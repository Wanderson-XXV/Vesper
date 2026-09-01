import { loadContent } from './engine/ContentLoader.js';
import { GameState } from './engine/GameState.js';
import { ChallengeEngine } from './engine/ChallengeEngine.js';
import { AudioManager } from './engine/AudioManager.js';
import { SceneEngine } from './engine/SceneEngine.js';
import { AppUI } from './ui/AppUI.js';
import { ApiClient } from './engine/ApiClient.js';
import { appPath } from './engine/AppPaths.js';

function navigateWith(selection) {
  const params = new URLSearchParams(window.location.search);
  Object.entries(selection).forEach(([key, value]) => {
    if (value) params.set(key, value);
    else params.delete(key);
  });
  window.location.search = params.toString();
}

async function boot() {
  const root = document.querySelector('#app');
  try {
    const params = new URLSearchParams(window.location.search);
    const api = new ApiClient();
    const apiStatus = await api.status();
    const account = apiStatus.database ? await api.me() : null;
    const content = await loadContent({ caseId: params.get('case') || undefined });
    const requestedTrack = params.get('route') || params.get('track');
    if (requestedTrack && content.trackMap?.[requestedTrack]) {
      content.campaign.learningTrack = requestedTrack;
      content.activeTrack = content.trackMap[requestedTrack];
    }

    const state = new GameState(content.campaign, { userId: account?.user?.id || null });
    if (account?.profile) {
      state.profile = {
        ...state.profile,
        displayName: account.user.username,
        preferredLanguage: account.profile.preferred_language,
        xp: account.profile.xp,
        level: account.profile.level,
        fieldMarks: account.profile.field_marks,
        relationships: account.profile.relationships || state.profile.relationships
      };
      state.saveProfile();
    }
    const supportedLanguages = content.activeTrack?.supportedLanguages
      || content.campaign.supportedLanguages
      || ['java', 'python'];
    const requestedLanguage = params.get('language');
    const selectedLanguage = supportedLanguages.includes(requestedLanguage)
      ? requestedLanguage
      : (supportedLanguages.includes(state.profile.preferredLanguage) ? state.profile.preferredLanguage : supportedLanguages[0]);
    content.campaign.selectedLanguage = selectedLanguage;
    state.data.language = selectedLanguage;
    state.data.settings.grimoireLanguage = selectedLanguage === 'micropython' ? 'python' : selectedLanguage;

    let currentRun = null;
    if (account && apiStatus.database && !account.user.must_change_password) {
      currentRun = (await api.currentRun(content.campaign.id, content.campaign.learningTrack)).run;
      if (currentRun) state.attachRun(currentRun);
    }
    const hasSave = Boolean(currentRun);
    if (!hasSave) state.setLanguage(selectedLanguage);
    const challenges = new ChallengeEngine(state);
    const audio = new AudioManager(state, content.campaign);
    if (account && currentRun) {
      state.onlineAuthoritative = true;
    }
    const ui = new AppUI({ root, content, state, challengeEngine: challenges, audio, api, account });
    const scenes = new SceneEngine({ content, state, audio, ui });
    ui.bindSceneEngine(scenes);
    state.setSyncHandler(
      (data) => api.syncState(data),
      (status, error) => ui.setSaveStatus(status, error)
    );
    ui.onSaveExit = async () => {
      await state.flushSync();
      window.location.assign(window.location.pathname);
    };
    ui.onRestart = async () => {
      const fresh = state.newGame();
      fresh.player.name = account.user.username;
      fresh.runId = null;
      fresh.revision = 0;
      const result = await api.restartRun({
        runId: state.runId, caseId: content.campaign.id, routeId: state.data.learningTrack,
        languageId: state.data.language, snapshot: fresh
      });
      state.attachRun(result.run);
      window.location.reload();
    };

    const startFresh = async () => {
      if (!account) return;
      state.reset();
      state.setLanguage(selectedLanguage);
      state.setPlayerName(account.user.username);
      const started = await api.startRun({
        caseId: content.campaign.id, routeId: content.campaign.learningTrack,
        languageId: selectedLanguage, snapshot: state.data
      });
      state.attachRun(started.run, { preferRemote: false });
      state.visitRoom(content.campaign.startRoom);
      ui.applyRoomBackground(content.roomMap[content.campaign.startRoom]);
      audio.ensureContext();
      await audio.playMusic('ambient');
      scenes.start(content.campaign.startScene);
    };

    const continueGame = async () => {
      audio.ensureContext();
      await audio.playMusic(content.roomMap[state.data.currentRoom]?.music || 'ambient');
      ui.setMode('explore');
      ui.renderRoom();
    };

    const showTitleScreen = () => {
      ui.showTitle({
        hasSave,
        catalog: content.catalog,
        currentCase: content.caseEntry,
        tracks: content.tracks,
        currentTrack: content.activeTrack,
        languages: supportedLanguages,
        currentLanguage: state.data.language,
        profile: state.profile,
        account,
        onlineAvailable: apiStatus.database,
        onStart: startFresh,
        onContinue: continueGame,
        onSelectCase: (caseId) => navigateWith({ case: caseId, route: null }),
        onSelectTrack: async (route) => {
          if (!content.trackMap?.[route] || route === content.campaign.learningTrack) return;
          content.campaign.learningTrack = route;
          content.activeTrack = content.trackMap[route];
          const params = new URLSearchParams(window.location.search);
          params.set('route', route);
          history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
          ui.updateTitleRoute(route);
          let run = null;
          if (account && apiStatus.database && !account.user.must_change_password) {
            run = (await api.currentRun(content.campaign.id, route)).run;
          }
          if (route !== content.campaign.learningTrack) return;
          currentRun = run;
          if (run) {
            state.attachRun(run);
          } else {
            state.runId = null;
            state.revision = 0;
            state.saveKey = state.makeSaveKey(route);
            state.data = state.newGame();
            state.setLanguage(selectedLanguage);
            if (account) state.setPlayerName(account.user.username);
          }
          state.onlineAuthoritative = Boolean(account && run);
          ui.updateTitleActions({ hasSave: Boolean(run), account });
        },
        onSelectLanguage: (language) => {
          state.profile.preferredLanguage = language;
          state.saveProfile();
          state.setLanguage(language);
          state.data.settings.grimoireLanguage = language === 'micropython' ? 'python' : language;
          const params = new URLSearchParams(window.location.search);
          params.set('language', language);
          history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
          ui.updateTitleLanguage(language);
        },
        onAccountChange: ({ startAfterAuthentication = false } = {}) => {
          if (startAfterAuthentication) sessionStorage.setItem('vesper_start_after_authentication', '1');
          window.location.reload();
        }
      });
    };

    showTitleScreen();
    if (!apiStatus.database) ui.setServiceUnavailable(() => window.location.reload());
    if (account?.user?.must_change_password) ui.openPasswordChange(() => window.location.reload());
    if (account && sessionStorage.getItem('vesper_start_after_authentication') === '1') {
      sessionStorage.removeItem('vesper_start_after_authentication');
      startFresh();
    }
    window.addEventListener('pagehide', () => {
      if (!state.runId || !state.data.player?.name) return;
      const payload = { caseId: state.data.caseId, routeId: state.data.learningTrack, languageId: state.data.language, runId: state.runId, revision: state.revision, snapshot: state.data, events: state.data.storyEvents || [] };
      navigator.sendBeacon?.(appPath('/api/runs/sync'), new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    });
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div style="padding:40px;color:white;background:#111;min-height:100vh;font-family:system-ui"><h1>Falha ao iniciar Vesper</h1><pre>${String(err.stack || err)}</pre><p>Rode o projeto por um servidor local: <code>npm start</code>.</p></div>`;
  }
}

boot();
