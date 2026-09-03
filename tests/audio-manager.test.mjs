import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager } from '../src/engine/AudioManager.js';

test('falha de música não bloqueia uma tentativa posterior', async () => {
  const originalAudio = globalThis.Audio;
  const attempts = [];
  let shouldFail = true;

  class FakeAudio {
    constructor(url) {
      this.url = url;
      this.paused = true;
      this.volume = 0;
    }

    play() {
      attempts.push(this.url);
      if (shouldFail) return Promise.reject(new Error('arquivo indisponível'));
      this.paused = false;
      return Promise.resolve();
    }

    pause() { this.paused = true; }
  }

  globalThis.Audio = FakeAudio;
  try {
    const state = { data: { settings: { masterVolume: 0.8, musicVolume: 0.22, muted: false } } };
    const manager = new AudioManager(state, { audio: { ambient: { url: '/ambient.ogg' } } });

    assert.equal(await manager.playMusic('ambient'), false);
    assert.equal(manager.currentTrack, null);
    assert.equal(manager.music, null);

    shouldFail = false;
    assert.equal(await manager.playMusic('ambient'), true);
    assert.equal(manager.currentTrack, 'ambient');
    assert.equal(attempts.length, 2);
  } finally {
    globalThis.Audio = originalAudio;
  }
});
