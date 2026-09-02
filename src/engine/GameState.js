const SAVE_PREFIX = 'vesper_save_v7';
const SETTINGS_KEY = 'vesper_settings_v2';
const LEGACY_SETTINGS_KEY = 'vesper_case_01_settings_v1';
const PROFILE_KEY = 'vesper_investigator_profile_v1';
export const SNAPSHOT_VERSION = 1;

const DEFAULT_CURSOR = {
  mode: 'explore',
  sceneId: null,
  nextEventIndex: 0,
  sceneStack: [],
  pendingChallenge: null
};

const DEFAULT_SETTINGS = {
  textSpeed: 24,
  dialogueScale: 1,
  grimoireLanguage: 'java',
  masterVolume: 0.8,
  musicVolume: 0.22,
  sfxVolume: 0.9,
  muted: false
};

const DEFAULT_PROFILE = {
  displayName: '',
  preferredLanguage: 'java',
  xp: 0,
  fieldMarks: 0,
  level: 1,
  unlockedCosmetics: ['portrait_frame_default'],
  equippedCosmetics: { portraitFrame: 'portrait_frame_default' },
  relationships: {},
  completedCases: [],
  rewardLedger: []
};

function parseStorage(key, fallback) {
  try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key) || '{}')) }; }
  catch { return { ...fallback }; }
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  return value;
}

function snapshotComparable(snapshot) {
  const value = clone(snapshot || {});
  for (const key of ['updatedAt', 'revision', 'rewardsEarned', 'rewardLedger', '_localSync']) delete value[key];
  return JSON.stringify(stableValue(value));
}

function eventKey(event) {
  switch (event.type) {
    case 'story_choice': return `story_choice:${event.choiceId}`;
    case 'clue_found': return `clue_found:${event.clueId}`;
    case 'ritual_attempt': return `ritual_attempt:${event.challengeId}:${event.attempt}`;
    case 'hint_used': return `hint_used:${event.challengeId}:${event.level}`;
    case 'case_completed': return `case_completed:${event.endingId}`;
    default: return `${event.type || 'event'}:${event.sequence}`;
  }
}

function normalizeStoryEvents(events = []) {
  return (Array.isArray(events) ? events : []).map((event, index) => {
    const normalized = { ...event, sequence: Number.isSafeInteger(Number(event.sequence)) ? Number(event.sequence) : index + 1 };
    return { ...normalized, eventKey: normalized.eventKey || eventKey(normalized) };
  });
}

function normalizeCursor(cursor = {}) {
  const value = { ...DEFAULT_CURSOR, ...(cursor || {}) };
  return {
    mode: ['explore', 'scene', 'choice', 'challenge', 'ending'].includes(value.mode) ? value.mode : 'explore',
    sceneId: value.sceneId == null ? null : String(value.sceneId),
    nextEventIndex: Math.max(0, Number.isSafeInteger(Number(value.nextEventIndex)) ? Number(value.nextEventIndex) : 0),
    sceneStack: Array.isArray(value.sceneStack)
      ? value.sceneStack.filter((frame) => frame && typeof frame.sceneId === 'string').map((frame) => ({
        sceneId: frame.sceneId,
        nextEventIndex: Math.max(0, Number(frame.nextEventIndex) || 0)
      }))
      : [],
    pendingChallenge: value.pendingChallenge ? clone(value.pendingChallenge) : null
  };
}

export class GameState {
  constructor(campaign, { userId = null } = {}) {
    this.campaign = campaign;
    this.caseId = campaign.id;
    this.userId = userId;
    this.profile = this.loadProfile();
    this.runId = null;
    this.revision = 0;
    this.saveKey = this.makeSaveKey(campaign.learningTrack || 'default', 'pending');
    this.data = this.newGame();
    this.syncHandler = null;
    this.syncTimer = null;
    this.syncPromise = null;
    this.syncStatusHandler = null;
    this.onlineAuthoritative = false;
    this.dirtyVersion = 0;
    this.flushedVersion = 0;
    this.inFlightSync = null;
    this.recoveryError = null;
  }

  makeSaveKey(trackId, runId = this.runId || 'pending') { return `${SAVE_PREFIX}_${this.userId || 'anonymous'}_${this.caseId}_${trackId || 'default'}_${runId}`; }

  savedSettings() {
    const legacy = parseStorage(LEGACY_SETTINGS_KEY, {});
    return parseStorage(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...legacy });
  }

  loadProfile() {
    const profile = parseStorage(`${PROFILE_KEY}_${this.userId || 'anonymous'}`, DEFAULT_PROFILE);
    profile.relationships = { ...DEFAULT_PROFILE.relationships, ...(profile.relationships || {}) };
    profile.equippedCosmetics = { ...DEFAULT_PROFILE.equippedCosmetics, ...(profile.equippedCosmetics || {}) };
    profile.unlockedCosmetics = Array.isArray(profile.unlockedCosmetics) ? profile.unlockedCosmetics : [...DEFAULT_PROFILE.unlockedCosmetics];
    profile.completedCases = Array.isArray(profile.completedCases) ? profile.completedCases : [];
    profile.rewardLedger = Array.isArray(profile.rewardLedger) ? profile.rewardLedger : [];
    return profile;
  }

  saveProfile() {
    this.profile.level = Math.max(1, Math.floor(this.profile.xp / 250) + 1);
    localStorage.setItem(`${PROFILE_KEY}_${this.userId || 'anonymous'}`, JSON.stringify(this.profile));
  }

  applyRemoteProfile(profile) {
    if (!profile) return;
    const nextXp = Number(profile.xp ?? this.profile.xp);
    const nextMarks = Number(profile.field_marks ?? this.profile.fieldMarks);
    this.data.rewardsEarned.xp += Math.max(0, nextXp - this.profile.xp);
    this.data.rewardsEarned.fieldMarks += Math.max(0, nextMarks - this.profile.fieldMarks);
    this.profile.xp = nextXp;
    this.profile.fieldMarks = nextMarks;
    this.profile.level = Number(profile.level ?? Math.floor(nextXp / 250) + 1);
    this.saveProfile();
    this.save();
  }

  setSyncHandler(handler, statusHandler = null) {
    this.syncHandler = handler;
    this.syncStatusHandler = statusHandler;
    this.scheduleSync();
  }

  attachRun(run, { preferRemote = true } = {}) {
    if (!run?.id) throw new Error('Execução remota inválida');
    this.runId = run.id;
    this.revision = Number(run.revision ?? 0);
    const routeId = run.route_id || run.routeId || this.campaign.learningTrack;
    this.saveKey = this.makeSaveKey(routeId, run.id);
    const remote = run.snapshot && Object.keys(run.snapshot).length ? run.snapshot : null;
    let local = null;
    try { local = JSON.parse(localStorage.getItem(this.saveKey) || 'null'); } catch {}
    const localSync = local?._localSync || null;
    if (local) delete local._localSync;
    const hasPendingLocal = Number(localSync?.dirtyVersion || 0) > Number(localSync?.flushedVersion || 0);
    const recoverLocal = local && Number(local.revision) === this.revision
      && (hasPendingLocal || Number(local.updatedAt || 0) > Number(remote?.updatedAt || 0));
    const acknowledgedInFlight = local && remote && localSync?.inFlight
      && Number(localSync.inFlight.revision) + 1 === this.revision
      && snapshotComparable(localSync.inFlight.snapshot) === snapshotComparable(remote);
    const changedAfterInFlight = acknowledgedInFlight
      && Number(localSync.dirtyVersion || 0) > Number(localSync.inFlight.targetDirtyVersion || 0);
    const unsafeConflict = local && hasPendingLocal && !recoverLocal && !acknowledgedInFlight;
    if (unsafeConflict) {
      localStorage.setItem(`${this.saveKey}_recovery`, JSON.stringify(local));
      this.recoveryError = Object.assign(new Error('Há um checkpoint local em conflito com uma versão mais nova do Arquivo. A cópia local foi preservada para recuperação.'), { status: 409 });
    }
    if (changedAfterInFlight) {
      this.hydrate(local);
      this.dirtyVersion = Number(localSync.dirtyVersion || 1);
      this.flushedVersion = Number(localSync.inFlight.targetDirtyVersion || 0);
    } else if (recoverLocal) {
      this.hydrate(local);
      this.dirtyVersion = Math.max(1, Number(localSync?.dirtyVersion || 1));
      this.flushedVersion = Number(localSync?.flushedVersion || 0);
    } else if (preferRemote && remote) this.hydrate(remote);
    else if (!this.load() && remote) this.hydrate(remote);
    this.data.runId = this.runId;
    this.data.revision = this.revision;
    this.data.routeId = routeId;
    this.data.learningTrack = routeId;
    this.data.languageId = run.language_id || run.languageId || this.data.language;
    this.data.language = this.data.languageId;
    if (!recoverLocal && !changedAfterInFlight) {
      this.dirtyVersion = 0;
      this.flushedVersion = 0;
    }
    this.inFlightSync = null;
    this.persistLocal();
  }

  hydrate(snapshot) {
    const fresh = this.newGame();
    const parsed = snapshot || {};
    const routeId = parsed.routeId || parsed.learningTrack || fresh.learningTrack;
    const languageId = parsed.languageId || parsed.language || fresh.language;
    this.data = {
      ...fresh, ...parsed,
      caseId: this.caseId,
      contentVersion: fresh.contentVersion,
      snapshotVersion: SNAPSHOT_VERSION,
      routeId,
      learningTrack: routeId,
      languageId,
      language: languageId,
      player: { ...fresh.player, ...(parsed.player || {}) },
      settings: { ...fresh.settings, ...(parsed.settings || {}), ...this.savedSettings() },
      relationships: { ...fresh.relationships, ...(parsed.relationships || {}) },
      rewardsEarned: { ...fresh.rewardsEarned, ...(parsed.rewardsEarned || {}) },
      knownCharacters: Array.isArray(parsed.knownCharacters) ? parsed.knownCharacters : fresh.knownCharacters,
      storyEvents: normalizeStoryEvents(parsed.storyEvents),
      rewardLedger: Array.isArray(parsed.rewardLedger) ? parsed.rewardLedger : [],
      cursor: normalizeCursor(parsed.cursor)
    };
  }

  toSnapshot() {
    const snapshot = clone({
      ...this.data,
      snapshotVersion: SNAPSHOT_VERSION,
      caseId: this.caseId,
      routeId: this.data.learningTrack,
      learningTrack: this.data.learningTrack,
      languageId: this.data.language,
      language: this.data.language,
      contentVersion: this.data.contentVersion,
      runId: this.runId,
      revision: this.revision,
      cursor: normalizeCursor(this.data.cursor)
    });
    // Audiovisual preferences are local and are not part of the authoritative run.
    delete snapshot.settings;
    return snapshot;
  }

  syncPayload() {
    if (!this.runId) return null;
    const snapshot = this.toSnapshot();
    return {
      caseId: snapshot.caseId,
      routeId: snapshot.routeId,
      languageId: snapshot.languageId,
      contentVersion: snapshot.contentVersion,
      runId: this.runId,
      revision: this.revision,
      snapshot,
      events: snapshot.storyEvents || []
    };
  }

  hasPendingSync() { return this.dirtyVersion > this.flushedVersion; }

  setNarrativeCursor(cursor, { persist = true } = {}) {
    this.data.cursor = normalizeCursor(cursor);
    if (persist) this.save();
    return this.data.cursor;
  }

  scheduleSync() {
    if (!this.syncHandler || !this.runId || !this.data.player?.name || !this.hasPendingSync()) return;
    clearTimeout(this.syncTimer);
    this.syncStatusHandler?.('saving');
    this.syncTimer = setTimeout(() => {
      this.flushSync().catch((error) => console.warn('Falha ao sincronizar save:', error.message));
    }, 650);
  }

  async flushSync() {
    if (!this.syncHandler || !this.runId) return null;
    clearTimeout(this.syncTimer);
    if (this.syncPromise) return this.syncPromise;
    if (!this.hasPendingSync()) {
      this.syncStatusHandler?.('saved');
      return null;
    }
    const targetDirtyVersion = this.dirtyVersion;
    const payload = this.syncPayload();
    this.inFlightSync = { revision: this.revision, targetDirtyVersion, snapshot: payload.snapshot };
    this.persistLocal();
    this.syncStatusHandler?.('saving');
    this.syncPromise = Promise.resolve(this.syncHandler(payload)).then((result) => {
      this.revision = Number(result?.revision ?? this.revision);
      this.data.revision = this.revision;
      this.inFlightSync = null;
      this.flushedVersion = Math.max(this.flushedVersion, targetDirtyVersion);
      this.persistLocal();
      if (this.dirtyVersion > targetDirtyVersion) this.scheduleSync();
      else this.syncStatusHandler?.('saved');
      return result;
    }).catch((error) => {
      this.inFlightSync = null;
      this.persistLocal();
      this.syncStatusHandler?.('error', error);
      throw error;
    }).finally(() => { this.syncPromise = null; });
    return this.syncPromise;
  }

  preparePagehideSync() {
    clearTimeout(this.syncTimer);
    this.persistLocal();
    if (this.syncPromise || !this.hasPendingSync()) return null;
    const payload = this.syncPayload();
    if (!payload) return null;
    this.inFlightSync = { revision: this.revision, targetDirtyVersion: this.dirtyVersion, snapshot: payload.snapshot };
    this.persistLocal();
    return payload;
  }

  cancelPreparedSync(error = null) {
    if (!this.syncPromise) this.inFlightSync = null;
    this.persistLocal();
    if (error) this.syncStatusHandler?.('error', error);
  }

  hasUnconfirmedPagehideSync() { return Boolean(this.inFlightSync); }

  addEvent(event) {
    const sequence = this.data.storyEvents.reduce((highest, item) => Math.max(highest, Number(item.sequence) || 0), 0) + 1;
    const value = { eventId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, at: Date.now(), sequence, ...event };
    value.eventKey = eventKey(value);
    this.data.storyEvents.push(value);
  }

  setPlayerName(name) {
    this.data.player.name = name;
    this.profile.displayName = name;
    this.saveProfile();
    this.save();
  }

  setTrack(trackId) {
    this.campaign.learningTrack = trackId;
    this.saveKey = this.makeSaveKey(trackId);
    this.data = this.newGame();
  }

  setLanguage(language) {
    const value = ['java', 'python', 'micropython'].includes(language) ? language : 'java';
    this.data.language = value;
    this.data.languageId = value;
    this.data.settings.grimoireLanguage = value === 'micropython' ? 'python' : value;
    this.profile.preferredLanguage = value;
    this.saveProfile();
    this.save();
  }

  newGame() {
    return {
      snapshotVersion: SNAPSHOT_VERSION,
      caseId: this.caseId,
      contentVersion: this.campaign.contentVersion || this.campaign.version || '1',
      routeId: this.campaign.learningTrack || 'default',
      languageId: this.campaign.selectedLanguage || this.profile.preferredLanguage || 'java',
      currentRoom: this.campaign.startRoom,
      flags: {},
      knownCharacters: [...(this.campaign.knownCharacters || ['tomas'])],
      visitedRooms: [],
      completedInteractions: [],
      completedChallenges: [],
      clues: [],
      inventory: [],
      presence: 0,
      challengeAttempts: {},
      challengeSeeds: {},
      hintUsage: {},
      storyEvents: [],
      relationships: {},
      rewardLedger: [],
      endingId: null,
      caseCompleted: false,
      runId: this.runId,
      revision: this.revision,
      rewardsEarned: { xp: 0, fieldMarks: 0 },
      clockChecks: 0,
      player: { name: this.profile.displayName || '' },
      learningTrack: this.campaign.learningTrack || 'default',
      language: this.campaign.selectedLanguage || this.profile.preferredLanguage || 'java',
      cursor: { ...DEFAULT_CURSOR },
      settings: this.savedSettings(),
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  reset() {
    clearTimeout(this.syncTimer);
    localStorage.removeItem(this.saveKey);
    this.runId = null;
    this.revision = 0;
    this.saveKey = this.makeSaveKey(this.campaign.learningTrack || 'default', 'pending');
    this.data = this.newGame();
    this.dirtyVersion = 0;
    this.flushedVersion = 0;
  }

  load() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      this.hydrate(parsed);
      if (this.data.player?.name && !this.profile.displayName) {
        this.profile.displayName = this.data.player.name;
        this.saveProfile();
      }
      return true;
    } catch {
      return false;
    }
  }

  save() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.data.settings));
    if (!this.data.player?.name || !this.runId) return;
    this.data.updatedAt = Date.now();
    this.data.runId = this.runId;
    this.data.revision = this.revision;
    this.dirtyVersion += 1;
    this.persistLocal();
    this.scheduleSync();
  }

  persistLocal() {
    if (this.runId) localStorage.setItem(this.saveKey, JSON.stringify({
      ...this.data,
      _localSync: {
        dirtyVersion: this.dirtyVersion,
        flushedVersion: this.flushedVersion,
        inFlight: this.inFlightSync ? clone(this.inFlightSync) : null
      }
    }));
  }

  hasFlag(flag) { return Boolean(this.data.flags[flag]); }
  setFlag(flag, value = true) { this.data.flags[flag] = value; this.save(); }

  hasCompletedChallenge(id) { return this.data.completedChallenges.includes(id); }
  completeChallenge(id, rewards = { xp: 25, fieldMarks: 0 }) {
    const first = !this.hasCompletedChallenge(id);
    if (first) this.data.completedChallenges.push(id);
    if (first) this.award(`challenge:${this.caseId}:${id}`, rewards);
    this.save();
    return first;
  }

  recordChallengeAttempt(id, { correct, hintLevel = 0 } = {}) {
    const attempts = (this.data.challengeAttempts[id] || 0) + 1;
    this.data.challengeAttempts[id] = attempts;
    this.addEvent({ type: 'ritual_attempt', challengeId: id, correct: Boolean(correct), attempt: attempts, hintLevel });
    this.save();
    return attempts;
  }

  recordHint(id, level) {
    this.data.hintUsage[id] = Math.max(this.data.hintUsage[id] || 0, level);
    this.addEvent({ type: 'hint_used', challengeId: id, level });
    this.save();
  }

  award(key, { xp = 0, fieldMarks = 0 } = {}) {
    if (!key || this.data.rewardLedger.includes(key) || this.profile.rewardLedger.includes(key)) return false;
    this.data.rewardLedger.push(key);
    this.profile.rewardLedger.push(key);
    this.data.rewardsEarned.xp += xp;
    this.data.rewardsEarned.fieldMarks += fieldMarks;
    this.profile.xp += xp;
    this.profile.fieldMarks += fieldMarks;
    this.saveProfile();
    return true;
  }

  addClue(clue, origin = {}) {
    if (!clue?.id) return;
    if (!this.data.clues.some((item) => item.id === clue.id)) {
      this.data.clues.push(clue);
      this.addEvent({ type: 'clue_found', clueId: clue.id, optional: Boolean(clue.optional), ...origin });
      if (clue.optional) this.award(`clue:${this.caseId}:${clue.id}`, clue.rewards || { xp: 10, fieldMarks: 1 });
    }
    this.save();
  }

  discoverCharacter(id) {
    if (!id) return;
    if (!this.data.knownCharacters.includes(id)) this.data.knownCharacters.push(id);
    this.save();
  }

  knowsCharacter(id) { return this.data.knownCharacters.includes(id); }

  recordChoice(choiceId, option, origin = {}) {
    if (!choiceId || !option?.id) return;
    this.addEvent({ type: 'story_choice', choiceId, optionId: option.id, ...origin });
    (option.setFlags || []).forEach((flag) => { this.data.flags[flag] = true; });
    if (option.relation?.character) {
      const id = option.relation.character;
      const amount = Number(option.relation.amount || 0);
      this.data.relationships[id] = (this.data.relationships[id] || 0) + amount;
      this.profile.relationships[id] = (this.profile.relationships[id] || 0) + amount;
      this.saveProfile();
    }
    this.save();
  }

  completeCase(endingId, rewards = { xp: 100, fieldMarks: 10 }) {
    this.data.endingId = endingId;
    this.data.caseCompleted = true;
    this.addEvent({ type: 'case_completed', endingId });
    this.award(`case:${this.caseId}`, rewards);
    if (!this.profile.completedCases.some((entry) => entry.caseId === this.caseId)) {
      this.profile.completedCases.push({ caseId: this.caseId, endingId, completedAt: Date.now() });
      this.saveProfile();
    }
    this.save();
  }

  acceptRemoteCompletion(run) {
    if (!run?.id || !run?.snapshot?.caseCompleted) throw new Error('Conclusão remota inválida');
    clearTimeout(this.syncTimer);
    this.runId = run.id;
    this.revision = Number(run.revision ?? this.revision);
    this.hydrate(run.snapshot);
    this.data.runId = this.runId;
    this.data.revision = this.revision;
    this.dirtyVersion = 0;
    this.flushedVersion = 0;
    this.inFlightSync = null;
    this.persistLocal();
  }

  markInteraction(roomId, interactionId) {
    const key = `${roomId}:${interactionId}`;
    if (!this.data.completedInteractions.includes(key)) this.data.completedInteractions.push(key);
    this.save();
  }

  isInteractionDone(roomId, interactionId) { return this.data.completedInteractions.includes(`${roomId}:${interactionId}`); }

  visitRoom(roomId) {
    this.data.currentRoom = roomId;
    const first = !this.data.visitedRooms.includes(roomId);
    if (first) this.data.visitedRooms.push(roomId);
    this.save();
    return first;
  }

  addPresence(amount = 1) {
    this.data.presence = Math.min(100, this.data.presence + amount);
    this.save();
  }
}
