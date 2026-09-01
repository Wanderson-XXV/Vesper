import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/engine/GameState.js';

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
  await state.flushSync();
  assert.equal(state.revision, 4);
  assert.equal(state.data.revision, 4);
});
