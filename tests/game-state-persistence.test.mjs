import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/engine/GameState.js';
import { SceneEngine } from '../src/engine/SceneEngine.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const campaign = { id: 'case_test', contentVersion: '1', learningTrack: 'route_test', startRoom: 'room_1', supportedLanguages: ['java'], knownCharacters: [] };

test('cache de execução e perfil são isolados por usuário e run', () => {
  globalThis.localStorage = new MemoryStorage();
  const first = new GameState(campaign, { userId: 'student-a' });
  first.attachRun({ id: 'run-a', route_id: 'route_test', revision: 0, snapshot: {} });
  first.setPlayerName('aluno-a');
  first.setFlag('private_progress');

  const second = new GameState(campaign, { userId: 'student-b' });
  second.attachRun({ id: 'run-b', route_id: 'route_test', revision: 0, snapshot: {} });
  assert.equal(second.data.player.name, '');
  assert.equal(second.hasFlag('private_progress'), false);
  assert.notEqual(first.saveKey, second.saveKey);
});

test('snapshot remoto vence cache com revisão antiga', () => {
  globalThis.localStorage = new MemoryStorage();
  const state = new GameState(campaign, { userId: 'student-a' });
  state.attachRun({ id: 'run-a', route_id: 'route_test', revision: 1, snapshot: { flags: { remote: true }, player: { name: 'a' }, updatedAt: 100 } });
  state.data.flags.local = true;
  state.data.revision = 1;
  state.persistLocal();
  state.attachRun({ id: 'run-a', route_id: 'route_test', revision: 2, snapshot: { flags: { newest: true }, player: { name: 'a' }, updatedAt: 200 } });
  assert.equal(state.hasFlag('newest'), true);
  assert.equal(state.hasFlag('local'), false);
});

test('flush confirmado atualiza a revisão local', async () => {
  globalThis.localStorage = new MemoryStorage();
  const state = new GameState(campaign, { userId: 'student-a' });
  state.attachRun({ id: 'run-a', route_id: 'route_test', revision: 3, snapshot: { player: { name: 'a' } } });
  state.setSyncHandler(async (snapshot) => {
    assert.equal(snapshot.revision, 3);
    return { revision: 4 };
  });
  state.setFlag('checkpoint');
  await state.flushSync();
  assert.equal(state.revision, 4);
  assert.equal(state.data.revision, 4);
});

test('snapshot versionado faz round-trip e migra save legado com cursor seguro', () => {
  globalThis.localStorage = new MemoryStorage();
  const state = new GameState(campaign, { userId: 'student-a' });
  state.attachRun({ id: 'run-a', route_id: 'route_test', language_id: 'java', revision: 2, snapshot: {
    caseId: 'case_test', learningTrack: 'route_test', language: 'java', currentRoom: 'room_2',
    flags: { found: true }, clues: [{ id: 'clue-1' }], inventory: ['lens'], knownCharacters: ['tomas'],
    relationships: { tomas: 2 }, presence: 14, challengeAttempts: { ritual: 2 }, challengeSeeds: { ritual: 'ABC' },
    hintUsage: { ritual: 1 }, endingId: null, caseCompleted: false, player: { name: 'Ada' }, startedAt: 10,
    updatedAt: 20, storyEvents: [{ eventId: 'event-1', type: 'clue_found' }]
  } });
  state.data.cursor = { mode: 'choice', sceneId: 'scene-1', nextEventIndex: 3, sceneStack: [], pendingChallenge: null };
  const snapshot = state.toSnapshot();
  assert.equal(snapshot.snapshotVersion, 1);
  assert.equal(snapshot.caseId, 'case_test');
  assert.equal(snapshot.routeId, 'route_test');
  assert.equal(snapshot.languageId, 'java');
  assert.equal(snapshot.currentRoom, 'room_2');
  assert.deepEqual(snapshot.flags, { found: true });
  assert.deepEqual(snapshot.inventory, ['lens']);
  assert.deepEqual(snapshot.cursor, { mode: 'choice', sceneId: 'scene-1', nextEventIndex: 3, sceneStack: [], pendingChallenge: null });
  assert.equal('settings' in snapshot, false);

  const legacy = new GameState(campaign, { userId: 'student-b' });
  legacy.attachRun({ id: 'run-b', route_id: 'route_test', revision: 0, snapshot: { player: { name: 'Legacy' }, currentRoom: 'room_2' } });
  assert.equal(legacy.data.snapshotVersion, 1);
  assert.deepEqual(legacy.data.cursor, { mode: 'explore', sceneId: null, nextEventIndex: 0, sceneStack: [], pendingChallenge: null });
  assert.equal(legacy.data.routeId, 'route_test');
  assert.equal(legacy.data.languageId, 'java');
});

test('cursor persiste a fala, escolha e ritual sem salvar cada caractere', async () => {
  globalThis.localStorage = new MemoryStorage();
  const state = new GameState(campaign, { userId: 'student-a' });
  state.attachRun({ id: 'run-a', route_id: 'route_test', revision: 0, snapshot: {} });
  const dialogues = [];
  let choiceHandler;
  let challengeHandler;
  const ui = {
    beginScene() {}, setSceneLocked() {}, setMode() {}, renderRoom() {},
    showDialogue(event, done) { dialogues.push({ event, done }); },
    showChoice(event, done) { choiceHandler = done; },
    openChallenge(id, cancel, generated) {
      state.data.cursor.pendingChallenge = { challengeId: id, generated: { seed: 'SEED', input: [1], answer: '1', meta: {} } };
      challengeHandler = cancel;
      assert.equal(generated, null);
    }
  };
  const engine = new SceneEngine({
    content: { scenes: { intro: { events: [
      { type: 'say', text: 'one' }, { type: 'say', text: 'two' },
      { type: 'choice', id: 'choice-1', options: [{ id: 'continue' }] },
      { type: 'startChallenge', challenge: 'ritual-1' }
    ] }, ritual: { events: [] } }, activeTrack: {} },
    state, audio: { playSfx() {}, playMusic() {} }, ui
  });
  await engine.start('intro');
  assert.deepEqual(state.data.cursor, { mode: 'scene', sceneId: 'intro', nextEventIndex: 0, sceneStack: [], pendingChallenge: null });
  await dialogues[0].done();
  assert.deepEqual(state.data.cursor, { mode: 'scene', sceneId: 'intro', nextEventIndex: 1, sceneStack: [], pendingChallenge: null });
  await dialogues[1].done();
  assert.equal(state.data.cursor.mode, 'choice');
  assert.equal(state.data.cursor.nextEventIndex, 2);
  await choiceHandler({ id: 'continue' });
  assert.equal(state.data.cursor.mode, 'challenge');
  assert.equal(state.data.cursor.nextEventIndex, 3);
  assert.equal(state.data.cursor.pendingChallenge.challengeId, 'ritual-1');
  assert.equal(typeof challengeHandler, 'function');
});

test('flush enfileira alteraÃ§Ã£o feita enquanto o request anterior estÃ¡ ativo', async () => {
  globalThis.localStorage = new MemoryStorage();
  const state = new GameState(campaign, { userId: 'student-a' });
  state.attachRun({ id: 'run-a', route_id: 'route_test', revision: 0, snapshot: { player: { name: 'Ada' } } });
  const payloads = [];
  let resolveFirst;
  state.setSyncHandler(async (payload) => {
    payloads.push(payload);
    if (payloads.length === 1) {
      state.setFlag('during_flush');
      await new Promise((resolve) => { resolveFirst = resolve; });
      return { revision: 1 };
    }
    return { revision: 2 };
  });
  state.setFlag('before_flush');
  const first = state.flushSync();
  await new Promise((resolve) => setTimeout(resolve, 0));
  resolveFirst();
  await first;
  await new Promise((resolve) => setTimeout(resolve, 700));
  assert.equal(payloads.length, 2);
  assert.equal(payloads[1].snapshot.flags.during_flush, true);
  assert.equal(state.revision, 2);
});

test('retomada de ritual reutiliza a entrada determinÃ­stica pendente', async () => {
  globalThis.localStorage = new MemoryStorage();
  const state = new GameState(campaign, { userId: 'student-a' });
  state.attachRun({ id: 'run-a', route_id: 'route_test', revision: 4, snapshot: {
    player: { name: 'Ada' },
    cursor: {
      mode: 'challenge', sceneId: 'ritual-scene', nextEventIndex: 0, sceneStack: [],
      pendingChallenge: { challengeId: 'ritual-1', generated: { seed: 'SEED', input: [7], answer: '7', meta: {} } }
    }
  } });
  let resumedGenerated;
  const ui = {
    beginScene() {}, setSceneLocked() {}, setMode() {}, renderRoom() {},
    openChallenge(id, cancel, generated) { resumedGenerated = generated; }
  };
  const engine = new SceneEngine({
    content: { scenes: { 'ritual-scene': { events: [{ type: 'startChallenge', challenge: 'ritual-1' }] } }, activeTrack: {} },
    state, audio: { playSfx() {}, playMusic() {} }, ui
  });
  await engine.resume();
  assert.deepEqual(resumedGenerated, { seed: 'SEED', input: [7], answer: '7', meta: {} });
});

test('retomada de caso concluido encontra o endCase sem endingId explÃ­cito', async () => {
  globalThis.localStorage = new MemoryStorage();
  const state = new GameState(campaign, { userId: 'student-a' });
  state.attachRun({ id: 'run-a', route_id: 'route_test', revision: 1, snapshot: {
    player: { name: 'Ada' }, caseCompleted: true, endingId: 'completed',
    cursor: { mode: 'ending', sceneId: 'ending', nextEventIndex: 0, sceneStack: [], pendingChallenge: null }
  } });
  let shown;
  const ui = { showEndCard(event) { shown = event; } };
  const engine = new SceneEngine({
    content: { scenes: { ending: { events: [{ type: 'endCase', title: 'Fim' }] } } },
    state, audio: {}, ui
  });
  await engine.resume();
  assert.equal(shown.title, 'Fim');
});

test('caso online não é concluído localmente antes da confirmação remota', async () => {
  globalThis.localStorage = new MemoryStorage();
  const state = new GameState(campaign, { userId: 'student-a' });
  state.attachRun({ id: 'run-a', route_id: 'route_test', revision: 2, snapshot: { player: { name: 'Ada' } } });
  state.onlineAuthoritative = true;
  let observedCompletion;
  const ui = {
    beginScene() {},
    showEndCard() { observedCompletion = state.data.caseCompleted; }
  };
  const engine = new SceneEngine({
    content: { campaign: { rewards: { caseCompletion: { xp: 100 } } }, scenes: { ending: { events: [{ type: 'endCase', endingId: 'safe' }] } } },
    state, audio: {}, ui
  });
  await engine.start('ending');
  assert.equal(observedCompletion, false);
  assert.equal(state.data.caseCompleted, false);
  assert.equal(state.data.cursor.mode, 'ending');
});

test('cache recupera alteração feita durante flush confirmado antes de pagehide', async () => {
  globalThis.localStorage = new MemoryStorage();
  const first = new GameState(campaign, { userId: 'student-a' });
  first.attachRun({ id: 'run-a', route_id: 'route_test', revision: 0, snapshot: { player: { name: 'Ada' }, updatedAt: 1 } });
  let sent;
  first.setSyncHandler((payload) => {
    sent = payload;
    return new Promise(() => {});
  });
  first.setFlag('before_flush');
  first.flushSync();
  first.setFlag('during_flush');
  assert.equal(first.preparePagehideSync(), null);

  const resumed = new GameState(campaign, { userId: 'student-a' });
  resumed.attachRun({ id: 'run-a', route_id: 'route_test', language_id: 'java', revision: 1, snapshot: sent.snapshot });
  assert.equal(resumed.hasFlag('before_flush'), true);
  assert.equal(resumed.hasFlag('during_flush'), true);
  assert.equal(resumed.revision, 1);
  assert.equal(resumed.hasPendingSync(), true);

  let recoveredPayload;
  resumed.setSyncHandler(async (payload) => { recoveredPayload = payload; return { revision: 2 }; });
  await resumed.flushSync();
  assert.equal(recoveredPayload.revision, 1);
  assert.equal(recoveredPayload.snapshot.flags.during_flush, true);
  assert.equal(resumed.revision, 2);
});

test('falha ao enfileirar pagehide mantém checkpoint local retomável', () => {
  globalThis.localStorage = new MemoryStorage();
  const first = new GameState(campaign, { userId: 'student-a' });
  first.attachRun({ id: 'run-a', route_id: 'route_test', revision: 0, snapshot: { player: { name: 'Ada' }, updatedAt: 1 } });
  first.setFlag('pending_pagehide');
  const payload = first.preparePagehideSync();
  assert.equal(payload.snapshot.flags.pending_pagehide, true);
  first.cancelPreparedSync(new Error('beacon recusado'));

  const resumed = new GameState(campaign, { userId: 'student-a' });
  resumed.attachRun({ id: 'run-a', route_id: 'route_test', revision: 0, snapshot: { player: { name: 'Ada' }, updatedAt: 1 } });
  assert.equal(resumed.hasFlag('pending_pagehide'), true);
  assert.equal(resumed.hasPendingSync(), true);
});

test('conflito de recuperação preserva a cópia local e mantém o remoto canônico', () => {
  globalThis.localStorage = new MemoryStorage();
  const first = new GameState(campaign, { userId: 'student-a' });
  first.attachRun({ id: 'run-a', route_id: 'route_test', revision: 1, snapshot: { player: { name: 'Ada' }, updatedAt: 1 } });
  first.setFlag('local_only');

  const resumed = new GameState(campaign, { userId: 'student-a' });
  resumed.attachRun({ id: 'run-a', route_id: 'route_test', revision: 3, snapshot: { player: { name: 'Ada' }, flags: { remote_only: true }, updatedAt: 3 } });
  assert.equal(resumed.hasFlag('remote_only'), true);
  assert.equal(resumed.hasFlag('local_only'), false);
  assert.equal(resumed.recoveryError?.status, 409);
  assert.ok(localStorage.getItem(`${resumed.saveKey}_recovery`));
});
