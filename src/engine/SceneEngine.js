import { conditionMet } from './ConditionEngine.js';

const INTERACTIVE_EVENTS = new Set(['say', 'showEvidence', 'choice', 'startChallenge', 'endCase']);

export class SceneEngine {
  constructor({ content, state, audio, ui }) {
    this.content = content;
    this.state = state;
    this.audio = audio;
    this.ui = ui;
    this.sceneId = null;
    this.events = [];
    this.index = 0;
    this.sceneStack = [];
    this.running = false;
    this.locked = false;
  }

  async start(sceneId, { index = 0, sceneStack = null } = {}) {
    const nested = this.running && sceneStack === null;
    const stack = sceneStack || (nested
      ? [...this.sceneStack, { sceneId: this.sceneId, nextEventIndex: this.index }]
      : []);
    return this.loadScene(sceneId, index, stack);
  }

  async loadScene(sceneId, index = 0, sceneStack = []) {
    const scene = this.content.scenes[sceneId];
    if (!scene) {
      console.warn('Cena nÃ£o encontrada:', sceneId);
      return this.finish();
    }
    this.sceneId = sceneId;
    this.events = scene.events || [];
    this.index = Math.max(0, Number(index) || 0);
    this.sceneStack = Array.isArray(sceneStack) ? sceneStack : [];
    this.running = true;
    this.locked = false;
    this.ui.beginScene();
    return this.next();
  }

  async resume() {
    const cursor = this.state.data.cursor || {};
    if (this.state.data.caseCompleted) {
      const ending = Object.values(this.content.scenes)
        .flatMap((scene) => scene.events || [])
        .find((event) => event.type === 'endCase' && (!this.state.data.endingId
          || event.endingId === this.state.data.endingId
          || (this.state.data.endingId === 'completed' && !event.endingId)));
      if (ending) return this.ui.showEndCard(ending);
    }
    if (cursor.sceneId && ['scene', 'choice', 'challenge', 'ending'].includes(cursor.mode)) {
      return this.start(cursor.sceneId, {
        index: cursor.nextEventIndex,
        sceneStack: cursor.sceneStack || []
      });
    }
    this.state.setNarrativeCursor({ mode: 'explore', sceneId: null, nextEventIndex: 0, sceneStack: [], pendingChallenge: null });
    this.ui.setMode('explore');
    this.ui.renderRoom();
  }

  checkpoint(mode, nextEventIndex = this.index, pendingChallenge = null, persist = false) {
    this.state.setNarrativeCursor({
      mode,
      sceneId: this.sceneId,
      nextEventIndex,
      sceneStack: this.sceneStack,
      pendingChallenge
    }, { persist });
  }

  checkpointForEvent(event, eventIndex) {
    const mode = event.type === 'choice'
      ? 'choice'
      : event.type === 'startChallenge'
        ? 'challenge'
        : event.type === 'endCase'
          ? 'ending'
          : 'scene';
    // Persist only stable interactive boundaries. Non-interactive events update the
    // in-memory cursor and are included by the next stable checkpoint.
    const challengeId = event.type === 'startChallenge' ? this.resolveChallengeId(event) : null;
    const previousPending = this.state.data.cursor?.pendingChallenge;
    const pendingChallenge = challengeId
      ? (previousPending?.challengeId === challengeId ? previousPending : { challengeId, generated: null })
      : null;
    this.checkpoint(mode, eventIndex, pendingChallenge, INTERACTIVE_EVENTS.has(event.type));
  }

  capturePendingChallenge(challengeId, generated) {
    const cursor = this.state.data.cursor || {};
    if (cursor.mode !== 'challenge') return;
    this.state.setNarrativeCursor({
      ...cursor,
      pendingChallenge: { challengeId, generated }
    });
  }

  resolveChallengeId(event) {
    return event.challengeSlot
      ? (this.content.activeTrack?.ritualSlots?.[event.challengeSlot] || event.challengeSlot)
      : event.challenge;
  }

  async next() {
    if (!this.running || this.locked) return;
    if (this.index >= this.events.length) return this.finish();
    const eventIndex = this.index;
    const event = this.events[this.index++];
    this.checkpointForEvent(event, eventIndex);
    return this.execute(event, eventIndex);
  }

  async advanceInteractive() {
    if (this.locked) return;
    this.checkpoint('scene', this.index, null, true);
    return this.next();
  }

  async execute(event, eventIndex = this.index - 1) {
    switch (event.type) {
      case 'say':
        return this.ui.showDialogue(event, () => this.advanceInteractive());
      case 'wait':
        this.locked = true;
        this.ui.setSceneLocked(true);
        return new Promise((resolve) => setTimeout(async () => {
          this.locked = false;
          this.ui.setSceneLocked(false);
          resolve(await this.next());
        }, event.duration || 500));
      case 'sound':
        this.audio.playSfx(event.sound);
        if (event.blocking) {
          this.locked = true;
          this.ui.setSceneLocked(true);
          return new Promise((resolve) => setTimeout(async () => {
            this.locked = false;
            this.ui.setSceneLocked(false);
            resolve(await this.next());
          }, event.duration || 250));
        }
        return this.next();
      case 'music':
        this.audio.playMusic(event.track);
        return this.next();
      case 'stopMusic':
        this.audio.stopMusic();
        return this.next();
      case 'setFlag':
        this.state.setFlag(event.flag, event.value);
        return this.next();
      case 'addClue':
        this.state.addClue(event.clue, { sceneId: this.sceneId, eventIndex });
        this.ui.toast(`EvidÃªncia adicionada: ${event.clue.title}`);
        return this.next();
      case 'discoverCharacter':
        this.state.discoverCharacter(event.character);
        return this.next();
      case 'showEvidence':
        return this.ui.showEvidence(event, () => this.advanceInteractive());
      case 'transitionRoomBackground':
        this.locked = true;
        this.ui.setSceneLocked(true);
        return this.ui.transitionRoomBackground(event.duration || 360, () => {
          this.locked = false;
          this.ui.setSceneLocked(false);
          this.advanceInteractive();
        });
      case 'startChallenge': {
        const challengeId = this.resolveChallengeId(event);
        const pending = this.state.data.cursor?.pendingChallenge;
        const generated = pending?.challengeId === challengeId ? pending.generated : null;
        return this.ui.openChallenge(challengeId, () => this.advanceInteractive(), generated);
      }
      case 'scene':
        return this.start(event.scene);
      case 'conditionalScene':
        return this.start(conditionMet(event.condition, this.state) ? event.trueScene : event.falseScene);
      case 'choice':
        return this.ui.showChoice(event, async (option) => {
          this.state.recordChoice(event.id, option, { sceneId: this.sceneId, eventIndex });
          if (option.scene) return this.start(option.scene);
          return this.advanceInteractive();
        });
      case 'clockObservation': {
        const n = this.state.data.clockChecks++;
        this.state.save();
        const time = ['23:47', '23:48', '23:49', '23:51'][Math.min(n, 3)];
        const text = n === 0
          ? `O relÃ³gio marca ${time}. O ponteiro dos segundos nÃ£o se move.`
          : `O relÃ³gio marca ${time}. VocÃª tem certeza de que antes marcava menos.`;
        return this.ui.showDialogue({ speaker: 'Narrador', text }, () => this.advanceInteractive());
      }
      case 'endCase':
        if (!this.state.onlineAuthoritative) {
          this.state.completeCase(event.endingId || 'completed', event.rewards || this.content.campaign.rewards?.caseCompletion);
        }
        return this.ui.showEndCard(event);
      default:
        console.warn('Evento desconhecido', event);
        return this.next();
    }
  }

  async finish() {
    if (this.sceneStack.length) {
      const parent = this.sceneStack[this.sceneStack.length - 1];
      this.sceneStack = this.sceneStack.slice(0, -1);
      return this.loadScene(parent.sceneId, parent.nextEventIndex, this.sceneStack);
    }
    this.running = false;
    this.locked = false;
    this.state.setNarrativeCursor({ mode: 'explore', sceneId: null, nextEventIndex: 0, sceneStack: [], pendingChallenge: null });
    this.ui.setSceneLocked(false);
    this.ui.setMode('explore');
    this.ui.renderRoom();
  }
}
