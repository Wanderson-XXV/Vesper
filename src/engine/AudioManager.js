export class AudioManager {
  constructor(state, campaign) {
    this.state = state;
    this.campaign = campaign;
    this.music = null;
    this.currentTrack = null;
    this.ctx = null;
    this.musicGainNode = null;
    this.musicNodes = [];
  }

  ensureContext() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  musicGain() {
    const s = this.state.data.settings;
    if (s.muted) return 0;
    return Math.max(0, Math.min(1, Number(s.masterVolume ?? 0.8) * Number(s.musicVolume ?? 0.22)));
  }

  sfxGain() {
    const s = this.state.data.settings;
    if (s.muted) return 0;
    return Math.max(0, Math.min(1, Number(s.masterVolume ?? 0.8) * Number(s.sfxVolume ?? 0.9)));
  }

  refreshMusicVolume() {
    if (this.music) this.music.volume = this.musicGain();
    if (this.musicGainNode) this.musicGainNode.gain.value = this.musicGain() * 0.16;
  }

  setMasterVolume(v) {
    this.state.data.settings.masterVolume = Number(v);
    this.refreshMusicVolume();
    this.state.save();
  }

  setMusicVolume(v) {
    this.state.data.settings.musicVolume = Number(v);
    this.refreshMusicVolume();
    this.state.save();
  }

  setSfxVolume(v) {
    this.state.data.settings.sfxVolume = Number(v);
    this.state.save();
  }

  setMuted(muted) {
    this.state.data.settings.muted = Boolean(muted);
    this.refreshMusicVolume();
    this.state.save();
  }

  async playMusic(track) {
    const def = this.campaign.audio?.[track];
    if (!def) return false;
    if (this.currentTrack === track && this.music && !this.music.paused) return true;
    if (this.music) { this.music.pause(); this.music = null; }
    this.currentTrack = null;
    this.musicGainNode = null;
    this.musicNodes = [];
    if (def.type === 'synth') {
      try {
        this.startSynthMusic(track);
        return true;
      } catch {
        this.stopMusic();
        return false;
      }
    }
    let audio = null;
    try {
      audio = new Audio(def.url);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.musicGain();
      this.music = audio;
      await audio.play();
      if (this.music !== audio) return false;
      this.currentTrack = track;
      return true;
    } catch {
      // Music is optional; clear a failed track so a later user gesture can
      // retry after autoplay or network failures.
      if (this.music === audio) {
        audio.pause();
        this.music = null;
        this.currentTrack = null;
      }
      return false;
    }
  }

  startSynthMusic(track) {
    this.ensureContext();
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.value = this.musicGain() * 0.16;
    master.connect(ctx.destination);
    const nodes = [
      [55, 'sine', -7],
      [82.5, 'triangle', 5],
      [110, 'sine', -3]
    ].map(([frequency, type, detune]) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      osc.connect(master);
      osc.start();
      return osc;
    });
    const music = {
      paused: false,
      pause: () => {
        if (music.paused) return;
        music.paused = true;
        nodes.forEach((node) => { try { node.stop(); } catch {} });
        try { master.disconnect(); } catch {}
      }
    };
    this.music = music;
    this.musicGainNode = master;
    this.musicNodes = nodes;
    this.currentTrack = track;
  }

  stopMusic() {
    if (this.music) this.music.pause();
    this.music = null;
    this.currentTrack = null;
    this.musicGainNode = null;
    this.musicNodes = [];
  }

  playRemote(name) {
    const def = this.campaign.audio?.[name];
    if (!def || this.state.data.settings.muted) return false;
    try {
      const a = new Audio(def.url);
      a.volume = this.sfxGain();
      const result = a.play();
      result?.catch(() => this.synth(name));
      return true;
    } catch {
      this.synth(name);
      return false;
    }
  }

  synth(type) {
    if (this.state.data.settings.muted) return;
    this.ensureContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = Math.max(0.015, this.sfxGain() * 0.34);
    master.connect(ctx.destination);

    if (type === 'knock') {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(92, now); osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
      gain.gain.setValueAtTime(0.9, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.22);
    } else if (type === 'ritual') {
      [110, 164, 247].forEach((f, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = f;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.08 + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 1.05);
      });
    } else if (type === 'unlock') {
      [640, 420, 290].forEach((f, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'square'; osc.frequency.value = f;
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + i * 0.1);
        osc.connect(gain); gain.connect(master); osc.start(now + i * 0.1); osc.stop(now + 0.25 + i * 0.1);
      });
    } else if (type === 'door') {
      this.noise(master, 0.28, 700);
    } else if (type === 'paper' || type === 'archive') {
      this.noise(master, 0.22, 1100);
    } else if (type === 'tape') {
      this.noise(master, 0.8, 650);
    }
  }

  noise(master, duration, cutoff) {
    const ctx = this.ctx; const now = ctx.currentTime;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cutoff;
    src.connect(filter); filter.connect(master); src.start(now);
  }

  playSfx(name) {
    if (name === 'door') return this.playRemote('door');
    this.synth(name);
  }
}
