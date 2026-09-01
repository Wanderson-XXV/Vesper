import { conditionMet } from './ConditionEngine.js';

export class SceneEngine {
  constructor({ content, state, audio, ui }) {
    this.content = content;
    this.state = state;
    this.audio = audio;
    this.ui = ui;
    this.sceneId = null;
    this.events = [];
    this.index = 0;
    this.running = false;
    this.locked = false;
  }

  async start(sceneId) {
    const scene = this.content.scenes[sceneId];
    if (!scene) { console.warn('Cena não encontrada:', sceneId); return this.finish(); }
    this.sceneId = sceneId;
    this.events = scene.events || [];
    this.index = 0;
    this.running = true;
    this.ui.beginScene();
    await this.next();
  }

  async next() {
    if (!this.running || this.locked) return;
    if (this.index >= this.events.length) return this.finish();
    const event = this.events[this.index++];
    await this.execute(event);
  }

  async execute(event) {
    switch (event.type) {
      case 'say':
        return this.ui.showDialogue(event, () => this.next());
      case 'wait':
        this.locked = true;
        this.ui.setSceneLocked(true);
        setTimeout(() => { this.locked = false; this.ui.setSceneLocked(false); this.next(); }, event.duration || 500);
        return;
      case 'sound':
        this.audio.playSfx(event.sound);
        if (event.blocking) {
          this.locked = true; this.ui.setSceneLocked(true);
          setTimeout(() => { this.locked = false; this.ui.setSceneLocked(false); this.next(); }, event.duration || 250);
        } else this.next();
        return;
      case 'music':
        this.audio.playMusic(event.track); this.next(); return;
      case 'stopMusic':
        this.audio.stopMusic(); this.next(); return;
      case 'setFlag':
        this.state.setFlag(event.flag, event.value); this.next(); return;
      case 'addClue':
        this.state.addClue(event.clue); this.ui.toast(`Evidência adicionada: ${event.clue.title}`); this.next(); return;
      case 'discoverCharacter':
        this.state.discoverCharacter(event.character); this.next(); return;
      case 'showEvidence':
        return this.ui.showEvidence(event, () => this.next());
      case 'transitionRoomBackground':
        this.locked = true;
        this.ui.setSceneLocked(true);
        return this.ui.transitionRoomBackground(event.duration || 360, () => {
          this.locked = false;
          this.ui.setSceneLocked(false);
          this.next();
        });
      case 'startChallenge': {
        const challengeId = event.challengeSlot
          ? (this.content.activeTrack?.ritualSlots?.[event.challengeSlot] || event.challengeSlot)
          : event.challenge;
        return this.ui.openChallenge(challengeId, () => this.next());
      }
      case 'scene':
        return this.start(event.scene);
      case 'conditionalScene':
        return this.start(conditionMet(event.condition, this.state) ? event.trueScene : event.falseScene);
      case 'choice':
        return this.ui.showChoice(event, (option) => {
          this.state.recordChoice(event.id, option);
          if (option.scene) return this.start(option.scene);
          this.next();
        });
      case 'clockObservation': {
        const n = this.state.data.clockChecks++;
        this.state.save();
        const time = ['23:47', '23:48', '23:49', '23:51'][Math.min(n, 3)];
        const text = n === 0
          ? `O relógio marca ${time}. O ponteiro dos segundos não se move.`
          : `O relógio marca ${time}. Você tem certeza de que antes marcava menos.`;
        return this.ui.showDialogue({ speaker: 'Narrador', text }, () => this.next());
      }
      case 'endCase':
        this.state.completeCase(
          event.endingId || 'completed',
          this.state.onlineAuthoritative ? { xp: 0, fieldMarks: 0 } : (event.rewards || this.content.campaign.rewards?.caseCompletion)
        );
        return this.ui.showEndCard(event);
      default:
        console.warn('Evento desconhecido', event); this.next();
    }
  }

  finish() {
    this.running = false;
    this.locked = false;
    this.ui.setSceneLocked(false);
    this.ui.setMode('explore');
    this.ui.renderRoom();
  }
}
