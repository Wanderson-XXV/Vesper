import { requirementsMet, hiddenByFlags } from '../engine/ConditionEngine.js';

export class AppUI {
  constructor({ root, content, state, challengeEngine, audio, api = null, account = null }) {
    this.root = root;
    this.content = content;
    this.state = state;
    this.challengeEngine = challengeEngine;
    this.audio = audio;
    this.api = api;
    this.account = account;
    this.sceneEngine = null;
    this.mode = 'title';
    this.sceneLocked = false;
    this.typeTimer = null;
    this.dialogueComplete = false;
    this.dialogueCallback = null;
    this.modal = null;
    this.settingsOpen = false;
    this.settingsFocus = null;
    this.activeChallenge = null;
    this.onStart = null;
    this.onStartConditionals = null;
    this.onContinue = null;
    this.onSaveExit = null;
    this.onRestart = null;
    this.saveStatus = 'saved';
    this.renderShell();
    this.applyReadingPreferences();
    this.bindGlobalShortcuts();
  }

  bindSceneEngine(engine) { this.sceneEngine = engine; }

  interpolate(value = '') {
    return String(value).replace(/\{\{player\.name\}\}/g, this.state.data.player?.name || 'Investigador');
  }
  applyReadingPreferences() {
    const scale = Math.min(1.25, Math.max(0.9, Number(this.state.data.settings.dialogueScale || 1)));
    this.root.style.setProperty('--dialogue-scale', String(scale));
  }
  setMode(mode) { this.mode = mode; document.body.dataset.mode = mode; }
  setSceneLocked(value) { this.sceneLocked = value; this.root.classList.toggle('scene-locked', value); }
  bindGlobalShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || event.repeat || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      if (this.settingsOpen) this.closeSettings();
      else this.openSettings();
    });
  }

  beginScene() {
    this.setMode('scene');
    this.contentLayer.innerHTML = '';
    this.dialogueLayer.innerHTML = '';
  }

  renderShell() {
    this.root.innerHTML = `
      <main class="game-shell">
        <div class="room-layer" id="roomLayer"></div>
        <div class="visual-filter"></div>
        <header class="topbar" id="topbar"></header>
        <section class="content-layer" id="contentLayer"></section>
        <section class="dialogue-layer" id="dialogueLayer"></section>
        <section class="modal-layer" id="modalLayer"></section>
        <div class="toast-layer" id="toastLayer"></div>
      </main>`;
    this.roomLayer = this.root.querySelector('#roomLayer');
    this.topbar = this.root.querySelector('#topbar');
    this.contentLayer = this.root.querySelector('#contentLayer');
    this.dialogueLayer = this.root.querySelector('#dialogueLayer');
    this.modalLayer = this.root.querySelector('#modalLayer');
    this.toastLayer = this.root.querySelector('#toastLayer');
  }

  showTitle({
    hasSave = false, catalog, currentCase, tracks, currentTrack, languages, currentLanguage,
    profile, account, onlineAvailable, onStart, onContinue, onSelectCase, onSelectTrack, onSelectLanguage, onAccountChange
  }) {
    this.onStart = onStart; this.onContinue = onContinue;
    this.applyReadingPreferences();
    this.setMode('title');
    this.roomLayer.style.backgroundImage = currentCase?.cover ? `url('${currentCase.cover}')` : 'none';
    this.topbar.innerHTML = '';
    this.dialogueLayer.innerHTML = '';
    const languageNames = { java: 'Java', python: 'Python', micropython: 'MicroPython' };
    this.contentLayer.innerHTML = `
      <div class="title-screen">
        <div class="title-account-access">
          ${onlineAvailable ? `<button class="title-account-btn" id="accountBtn">${account ? `SAIR · ${account.user.username}` : 'ENTRAR'}</button>` : '<span class="title-account-status">ARQUIVO INDISPONÍVEL</span>'}
        </div>
        <div class="case-selector-layout">
          <aside class="case-dossiers" aria-label="Casos disponíveis">
            <span class="title-eyebrow">ARQUIVO DE INVESTIGAÇÕES</span>
            ${(catalog?.cases || []).map((entry, index) => `
              <button class="case-dossier ${entry.id === currentCase?.id ? 'active' : ''}" data-case="${entry.id}">
                <small>${String(index + 1).padStart(2, '0')} · ${entry.subtitle || 'CASO'}</small>
                <strong>${entry.title}</strong>
                <span>${entry.status === 'playable' ? 'DISPONÍVEL' : 'EM PREPARAÇÃO'}</span>
              </button>`).join('')}
          </aside>
          <section class="selected-case">
            <div class="vesper-mark">VESPER</div>
            <span>${currentCase?.subtitle || ''}</span>
            <h1>${currentCase?.title || 'Arquivo sem título'}</h1>
            <p>${currentCase?.description || ''}</p>
            <div class="route-ledger">
              <small>ROTA DE INVESTIGAÇÃO</small>
              <div>${(tracks || []).map((track) => `<button class="route-choice ${track.id === currentTrack?.id ? 'active' : ''}" data-track="${track.id}"><strong>${track.name}</strong><span>${track.audience || track.description || ''}</span></button>`).join('')}</div>
            </div>
            <label class="language-choice">LINGUAGEM DO INVESTIGADOR
              <select data-language>${(languages || ['java']).map((language) => `<option value="${language}" ${language === currentLanguage ? 'selected' : ''}>${languageNames[language] || language}</option>`).join('')}</select>
            </label>
            <div class="title-actions">
              ${!hasSave ? '<button class="primary-btn" id="newGameBtn">INICIAR CASO</button>' : ''}
              ${account && hasSave ? '<button class="primary-btn" id="continueBtn">RETOMAR INVESTIGAÇÃO</button>' : ''}
              <button class="ghost-btn" id="optionsBtn">OPÇÕES</button>
            </div>
            ${account && profile?.displayName ? `<div class="investigator-mark"><span>INVESTIGADOR</span><strong>${profile.displayName}</strong><small>NÍVEL ${profile.level} · ${profile.xp} XP · ${profile.fieldMarks} MARCAS DE CAMPO</small></div>` : ''}
          </section>
        </div>
      </div>`;
    this.contentLayer.querySelectorAll('[data-case]').forEach((button) => {
      button.onclick = () => this._animateTitleOut(() => onSelectCase?.(button.dataset.case));
    });
    this.contentLayer.querySelectorAll('[data-track]').forEach((button) => {
      button.onclick = () => this._animateRouteSelect(button, () => onSelectTrack?.(button.dataset.track));
    });
    this.contentLayer.querySelector('[data-language]').onchange = (event) => onSelectLanguage?.(event.target.value);
    const requireAccount = (startAfterAuthentication = false) => {
      if (account) return true;
      if (!onlineAvailable) {
        this.toast('O Arquivo online precisa estar disponível para iniciar uma investigação.');
        return false;
      }
      this.openAccount(onAccountChange, { startAfterAuthentication });
      return false;
    };
    const actions = this.contentLayer.querySelector('.title-actions');
    if (actions) actions.onclick = (event) => {
      const id = event.target.id;
      if (id === 'newGameBtn' && requireAccount(true)) this._animateTitleOut(() => this.onStart?.());
      else if (id === 'continueBtn' && requireAccount()) this._animateTitleOut(() => this.onContinue?.());
      else if (id === 'optionsBtn') this.openSettings(true);
    };
    const accountButton = this.contentLayer.querySelector('#accountBtn');
    if (accountButton) accountButton.onclick = async () => {
      if (account) {
        await this.api.logout();
        onAccountChange?.();
      } else this.openAccount(onAccountChange);
    };
    this._animateTitleIn();
  }

  updateTitleRoute(trackId) {
    this.contentLayer.querySelectorAll('[data-track]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.track === trackId);
    });
  }

  updateTitleActions({ hasSave, account } = {}) {
    const actions = this.contentLayer.querySelector('.title-actions');
    if (!actions) return;
    actions.innerHTML = `
      ${!hasSave ? '<button class="primary-btn" id="newGameBtn">INICIAR CASO</button>' : ''}
      ${account && hasSave ? '<button class="primary-btn" id="continueBtn">RETOMAR INVESTIGAÇÃO</button>' : ''}
      <button class="ghost-btn" id="optionsBtn">OPÇÕES</button>`;
  }

  _animateRouteSelect(button, onSelect) {
    onSelect?.();
    if (typeof gsap === 'undefined' || !button) return;
    gsap.fromTo(button, { x: 14 }, { x: 0, duration: 0.4, ease: 'power3.out' });
  }

  updateTitleLanguage(language) {
    const select = this.contentLayer.querySelector('[data-language]');
    if (select) select.value = language;
  }

  _animateTitleIn() {
    const screen = this.contentLayer.querySelector('.title-screen');
    if (typeof gsap === 'undefined') {
      if (screen) screen.style.opacity = '1';
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const add = (selector, from, to, at) => {
      if (this.contentLayer.querySelector(selector)) tl.fromTo(selector, from, to, at);
    };
    add('.title-screen', { opacity: 0 }, { opacity: 1, duration: 0.45 });
    add('.case-dossiers', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7 }, 0.1);
    add('.case-dossier', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, 0.2);
    add('.selected-case .vesper-mark', { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.15);
    add('.selected-case > span', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.25);
    add('.selected-case h1', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.3);
    add('.selected-case > p', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.4);
    add('.route-ledger', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.45);
    add('.route-choice', { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, 0.5);
    add('.language-choice', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.55);
    add('.title-actions', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, 0.6);
    add('.investigator-mark', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.65);
    add('.title-account-access', { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.2);
  }

  _animateTitleOut(onComplete) {
    if (typeof gsap === 'undefined') { onComplete?.(); return; }
    gsap.to('.title-screen', {
      opacity: 0,
      y: -12,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => { onComplete?.(); }
    });
  }
  openAccount(onAuthenticated, { startAfterAuthentication = false } = {}) {
    this.modal = 'account';
    const render = (view = 'login') => {
      const creating = view === 'register';
      this.modalLayer.innerHTML = `
        <div class="modal-backdrop"><div class="account-modal account-modal-${view}" role="dialog" aria-modal="true" aria-labelledby="accountTitle">
          <div class="modal-title"><div><span>ARQUIVO VESPER</span><h2 id="accountTitle">${creating ? 'Criar registro' : 'Entrar no Arquivo'}</h2></div><button class="icon-btn" data-close aria-label="Fechar">×</button></div>
          <p class="account-intro">${creating ? 'Seu usuário identifica o investigador. Aparência e detalhes de personagem serão definidos depois.' : 'Entre para acessar casos, progresso e o seu registro de investigação.'}</p>
          <form class="account-form" data-account-form>
            <label>Usuário <input name="username" autocomplete="username" minlength="3" maxlength="32" required autofocus></label>
            <label>Senha <input name="password" type="password" minlength="8" autocomplete="${creating ? 'new-password' : 'current-password'}" required></label>
            ${creating ? '<label>Código da turma <input name="teamCode" minlength="8" autocomplete="off" required></label>' : ''}
            <button class="primary-btn" type="submit">${creating ? 'CRIAR E ENTRAR' : 'ENTRAR'}</button>
          </form>
          <p class="account-switch">${creating ? 'Já possui registro?' : 'Ainda não possui registro?'} <button type="button" data-account-view="${creating ? 'login' : 'register'}">${creating ? 'Entrar' : 'Criar conta'}</button></p>
          <div class="account-feedback" aria-live="polite"></div>
        </div></div>`;
      const feedback = this.modalLayer.querySelector('.account-feedback');
      const submit = async (action) => {
        feedback.textContent = 'Consultando o arquivo…';
        try {
          await action();
          onAuthenticated?.({ startAfterAuthentication });
        } catch (error) { feedback.textContent = error.message; }
      };
      this.modalLayer.querySelector('[data-account-form]').onsubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const username = data.get('username');
        const password = data.get('password');
        if (creating) submit(() => this.api.register({ username, password, teamCode: data.get('teamCode'), preferredLanguage: this.state.data.language }));
        else submit(() => this.api.login(username, password));
      };
      this.modalLayer.querySelector('[data-account-view]').onclick = () => render(creating ? 'login' : 'register');
      this.modalLayer.querySelector('[data-close]').onclick = () => this.closeModal();
    };
    render();
  }

  openPasswordChange(onChanged) {
    this.modal = 'password-change';
    this.setSceneLocked(true);
    this.modalLayer.innerHTML = `
      <div class="modal-backdrop"><div class="account-modal" role="dialog" aria-modal="true" aria-labelledby="passwordTitle">
        <div class="modal-title"><div><span>SEGURANÇA DO ARQUIVO</span><h2 id="passwordTitle">Defina uma nova senha</h2></div></div>
        <p class="account-intro">A senha temporária deve ser substituída antes de acessar qualquer investigação.</p>
        <form class="account-form" data-password-form><label>Nova senha <input name="password" type="password" minlength="8" autocomplete="new-password" required autofocus></label><button class="primary-btn">ATUALIZAR SENHA</button></form>
        <div class="account-feedback" aria-live="polite"></div>
      </div></div>`;
    this.modalLayer.querySelector('[data-password-form]').onsubmit = async (event) => {
      event.preventDefault();
      const feedback = this.modalLayer.querySelector('.account-feedback');
      feedback.textContent = 'Atualizando…';
      try { await this.api.changePassword(new FormData(event.currentTarget).get('password')); onChanged?.(); }
      catch (error) { feedback.textContent = error.message; }
    };
  }

  setServiceUnavailable(onRetry) {
    const actions = this.contentLayer.querySelector('.title-actions');
    actions?.querySelectorAll('#newGameBtn,#continueBtn').forEach((button) => { button.disabled = true; });
    actions?.insertAdjacentHTML('afterend', '<div class="service-unavailable"><strong>ARQUIVO INDISPONÍVEL</strong><span>Não é possível entrar, iniciar ou retomar enquanto o servidor de saves estiver fora do ar.</span><button class="ghost-btn" data-retry> TENTAR NOVAMENTE </button></div>');
    this.contentLayer.querySelector('[data-retry]')?.addEventListener('click', () => onRetry?.());
  }

  setSaveStatus(status, error = null) {
    this.saveStatus = status;
    const labels = { saving: 'SALVANDO…', saved: 'SALVO', error: 'FALHA AO SALVAR' };
    const node = this.topbar.querySelector('[data-save-status]');
    if (node) { node.textContent = labels[status] || ''; node.dataset.state = status; }
    if (status === 'error' && (error?.status === 401 || error?.code === 'PASSWORD_CHANGE_REQUIRED')) {
      this.setSceneLocked(true);
      this.openAccount(() => window.location.reload());
    } else if (status === 'error') {
      this.toast(error?.status === 409 ? 'Este save mudou em outro dispositivo. Recarregue para usar a versão mais recente.' : 'O progresso está protegido neste dispositivo, mas ainda não chegou ao Arquivo.');
    }
  }

  currentObjective() {
    return (this.content.objectives || []).find((o) => requirementsMet(o.requires, this.state) && !hiddenByFlags(o.hideWhen, this.state)) || null;
  }

  resolveRoomBackground(room) {
    if (!room) return '';
    const states = room.backgroundStates || [];
    for (const item of states) {
      if (!item.requires || requirementsMet(item.requires, this.state)) return item.background;
    }
    return room.background || '';
  }

  applyRoomBackground(room) {
    const bg = this.resolveRoomBackground(room);
    if (bg) this.roomLayer.style.backgroundImage = `url('${bg}')`;
  }

  transitionRoomBackground(duration = 360, onDone = () => {}) {
    const room = this.content.roomMap[this.state.data.currentRoom];
    const ms = Math.max(120, Number(duration) || 360);
    this.roomLayer.classList.add('room-fading');
    setTimeout(() => {
      this.applyRoomBackground(room);
      requestAnimationFrame(() => this.roomLayer.classList.remove('room-fading'));
      setTimeout(onDone, ms);
    }, Math.round(ms * 0.55));
  }

  renderTopbar() {
    const room = this.content.roomMap[this.state.data.currentRoom];
    const pips = Math.ceil(this.state.data.presence / 20);
    this.topbar.innerHTML = `
      <div class="location-mark">
        <span class="case-label">${room?.name || ''}</span>
      </div>
      <div class="top-actions">
        <span class="save-status" data-save-status data-state="${this.saveStatus}">${this.saveStatus === 'saving' ? 'SALVANDO…' : this.saveStatus === 'error' ? 'FALHA AO SALVAR' : 'SALVO'}</span>
        <button class="top-btn" data-action="inventory" title="Inventário">INVENTÁRIO</button>
        <button class="top-btn" data-action="settings" title="Opções">OPÇÕES</button>
        <div class="presence" title="Erros de ritual aumentam a Presença">
          <span class="presence-label">PRESENÇA</span>
          <div>${Array.from({length:5}, (_,i) => `<i class="${i < pips ? 'on' : ''}"></i>`).join('')}</div>
        </div>
      </div>`;
    this.topbar.querySelector('[data-action="inventory"]').onclick = () => this.openInventory();
    this.topbar.querySelector('[data-action="settings"]').onclick = () => this.openSettings();
  }

  renderRoom() {
    if (this.mode === 'title' || this.modal) return;
    const room = this.content.roomMap[this.state.data.currentRoom];
    if (!room) return;
    this.setMode('explore');
    this.dialogueLayer.innerHTML = '';
    this.applyRoomBackground(room);
    this.renderTopbar();
    if (room.music) this.audio.playMusic(room.music); else if (this.audio.currentTrack !== 'ambient') this.audio.playMusic('ambient');

    const interactions = (room.interactions || []).filter((i) => {
      if (i.once && this.state.isInteractionDone(room.id, i.id)) return false;
      if (!requirementsMet(i.requires, this.state)) return false;
      if (hiddenByFlags(i.hideWhen, this.state)) return false;
      return true;
    });
    const connections = (room.connections || []).filter((c) => !hiddenByFlags(c.hideWhen, this.state) && requirementsMet(c.requires, this.state));

    this.contentLayer.innerHTML = `
      <div class="room-ui">
        <div class="action-panel">
          ${interactions.length ? `<div class="action-group"><div class="action-heading">AÇÕES</div>${interactions.map((i) => `<button class="action-btn ${i.kind === 'ritual' ? 'ritual-action' : ''}" data-interaction="${i.id}">${i.kind === 'ritual' ? '<span class="ritual-glyph">∴</span>' : ''}${i.label}</button>`).join('')}</div>` : ''}
          ${(room.npcs || []).length ? `<div class="action-group people-actions"><div class="action-heading">PESSOAS</div>${(room.npcs || []).map((id) => `<button class="action-btn npc-btn" data-npc="${id}">Conversar com ${this.content.characterMap[id].name}</button>`).join('')}</div>` : ''}
          ${connections.length ? `<div class="action-group routes"><div class="action-heading">ACESSOS</div>${connections.map((c) => `<button class="route-btn" data-room="${c.to}">→ ${c.label}</button>`).join('')}</div>` : ''}
        </div>
      </div>`;

    interactions.forEach((i) => {
      const el = this.contentLayer.querySelector(`[data-interaction="${i.id}"]`);
      if (!el) return;
      el.onclick = () => {
        if (i.once) this.state.markInteraction(room.id, i.id);
        if (i.action === 'openGrimoire') return this.openGrimoire('room');
        const sceneId = i.sceneSlot
          ? (this.content.activeTrack?.sceneSlots?.[i.sceneSlot] || i.fallbackScene || i.scene)
          : i.scene;
        if (sceneId) this.sceneEngine.start(sceneId);
      };
    });
    (room.npcs || []).forEach((id) => {
      const el = this.contentLayer.querySelector(`[data-npc="${id}"]`); if (el) el.onclick = () => this.openConversation(id);
    });
    connections.forEach((c) => {
      const el = this.contentLayer.querySelector(`[data-room="${c.to}"]`);
      if (el) el.onclick = () => this.enterRoom(c.to);
    });
  }

  async enterRoom(roomId) {
    const first = this.state.visitRoom(roomId);
    const room = this.content.roomMap[roomId];
    this.applyRoomBackground(room);
    this.renderTopbar();
    if (first && room.firstEnterScene) return this.sceneEngine.start(room.firstEnterScene);
    this.renderRoom();
  }

  portraitMarkup(c, cls = '') {
    if (!c) return '';
    if (c.player) return '';
    if (c.portrait) return `<div class="portrait-frame ${cls}"><img src="${c.portrait}" alt="${c.name}"></div>`;
    return `<div class="portrait-frame portrait-placeholder ${cls}"><span class="portrait-head"></span><span class="portrait-body"></span><b>${c.monogram || '?'}</b></div>`;
  }

  characterCard(c, large = false, clickable = false) {
    if (!c) return '';
    const tag = clickable ? 'button' : 'div';
    const attr = clickable ? ` type="button" data-character-profile="${c.id}"` : '';
    return `<${tag} class="character-card ${large ? 'large' : ''} ${clickable ? 'clickable' : ''}"${attr}>${this.portraitMarkup(c)}<div><strong>${c.name}</strong><small>${c.role || ''}</small></div></${tag}>`;
  }

  openConversation(characterId) {
    const c = this.content.characterMap[characterId]; if (!c) return;
    this.setMode('conversation');
    this.dialogueLayer.innerHTML = '';
    const topics = (c.topics || []).filter((t) => requirementsMet(t.requires, this.state));
    this.contentLayer.innerHTML = `
      <div class="conversation-panel">
        <div class="conversation-person">
          ${this.portraitMarkup(c, 'conversation-portrait')}
          <div class="conversation-name"><strong>${c.name}</strong><small>${c.role || ''}</small></div>
        </div>
        <div class="conversation-copy">
          <div class="action-heading">O QUE PERGUNTAR</div>
          <div class="conversation-options">
            ${topics.map((t) => `<button class="action-btn ${t.tone === 'confront' ? 'confront-btn' : ''}" data-topic="${t.id}">${t.label}</button>`).join('')}
            <button class="ghost-btn" data-back>ENCERRAR CONVERSA</button>
          </div>
        </div>
      </div>`;
    topics.forEach((t) => {
      this.contentLayer.querySelector(`[data-topic="${t.id}"]`).onclick = () => this.sceneEngine.start(t.scene);
    });
    this.contentLayer.querySelector('[data-back]').onclick = () => this.renderRoom();
  }

  speakerCharacter(speaker) {
    if (!speaker) return null;
    const normalized = String(speaker).toLowerCase().trim();
    if (normalized === 'protagonista' || normalized === 'player') return { id: 'player', name: this.state.data.player?.name || 'Investigador', role: 'Investigador', player: true };
    return this.content.characters.find((c) => normalized === c.name.toLowerCase() || normalized === c.id.toLowerCase() || normalized.startsWith(c.name.split(' ')[0].toLowerCase())) || null;
  }

  showDialogue(event, onDone) {
    this.applyReadingPreferences();
    clearInterval(this.typeTimer);
    this.dialogueComplete = false;
    this.dialogueCallback = onDone;
    const full = this.interpolate(event.text || '');
    const speaker = event.speaker || '';
    const speakerLabel = (String(speaker).toLowerCase() === 'protagonista' || String(speaker).toLowerCase() === 'player') ? (this.state.data.player?.name || 'Investigador') : speaker;
    const character = this.speakerCharacter(speaker);
    const isNarration = !character && (!speaker || speaker.toLowerCase() === 'narrador');
    const isRecording = String(speaker).toLowerCase().includes('gravação');
    this.dialogueLayer.innerHTML = `
      <div class="dialogue-stage ${isNarration ? 'narration' : ''} ${isRecording ? 'recording' : ''}">
        ${character && !character.player ? `<div class="speaker-portrait-wrap">${this.portraitMarkup(character, 'speaker-portrait')}</div>` : ''}
        <div class="dialogue-box" tabindex="0">
          ${isNarration ? '' : `<div class="speaker ${character?.player ? 'player-speaker' : ''}">${speakerLabel}</div>`}
          <div class="dialogue-text"></div>
          <div class="continue-mark">CLIQUE / ENTER / ESPAÇO</div>
        </div>
      </div>`;
    const box = this.dialogueLayer.querySelector('.dialogue-box');
    const text = this.dialogueLayer.querySelector('.dialogue-text');
    const speed = Math.max(4, Number(this.state.data.settings.textSpeed || 24));
    let i = 0;
    const finishTyping = () => { clearInterval(this.typeTimer); text.textContent = full; this.dialogueComplete = true; };
    const advance = () => {
      if (this.sceneLocked) return;
      if (!this.dialogueComplete) return finishTyping();
      clearInterval(this.typeTimer); onDone();
    };
    if (event.advance === 'auto') {
      finishTyping();
      setTimeout(() => onDone(), event.duration || 1200);
      return;
    }
    this.typeTimer = setInterval(() => {
      i += 1; text.textContent = full.slice(0, i);
      if (i >= full.length) finishTyping();
    }, speed);
    box.onclick = advance;
    box.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    };
    box.focus();
  }

  showEvidence(event, onDone) {
    this.dialogueLayer.innerHTML = '';
    const canStore = Boolean(event.clue);
    this.contentLayer.innerHTML = `
      <div class="evidence-screen">
        <div class="evidence-card">
          <div class="evidence-stamp">${canStore ? 'EVIDÊNCIA RECUPERADA' : 'REGISTRO EM EXAME'}</div>
          <h2>${this.interpolate(event.title || 'Documento')}</h2>
          <pre>${this.interpolate(event.body || '')}</pre>
          <button class="primary-btn evidence-action" data-close-evidence>${canStore ? 'GUARDAR NO ARQUIVO' : 'FECHAR'}</button>
        </div>
      </div>`;
    const btn = this.contentLayer.querySelector('[data-close-evidence]');
    btn.onclick = () => {
      btn.disabled = true;
      if (canStore) {
        const clue = {
          ...event.clue,
          view: event.clue.view || {
            title: this.interpolate(event.title || event.clue.title || 'Documento'),
            body: this.interpolate(event.body || ''),
            stamp: 'ARQUIVO DE CAMPO'
          }
        };
        this.state.addClue(clue);
        this.audio.playSfx('archive');
        btn.textContent = 'ARQUIVADO';
        this.toast(`Arquivado: ${clue.title}`);
        setTimeout(() => { this.contentLayer.innerHTML = ''; onDone(); }, 360);
      } else {
        this.audio.playSfx('paper');
        this.contentLayer.innerHTML = '';
        onDone();
      }
    };
  }

  showChoice(event, onSelected) {
    this.setMode('choice');
    this.dialogueLayer.innerHTML = '';
    const options = (event.options || []).filter((option) => requirementsMet(option.requires, this.state));
    this.contentLayer.innerHTML = `
      <div class="story-choice-screen">
        <div class="story-choice-copy">
          <span>DECISÃO DE CAMPO</span>
          <h2>${this.interpolate(event.prompt || 'O que você faz?')}</h2>
          ${event.context ? `<p>${this.interpolate(event.context)}</p>` : ''}
          <div class="story-choice-options">
            ${options.map((option) => `<button data-choice="${option.id}"><strong>${this.interpolate(option.label)}</strong>${option.description ? `<span>${this.interpolate(option.description)}</span>` : ''}</button>`).join('')}
          </div>
        </div>
      </div>`;
    this.contentLayer.querySelectorAll('[data-choice]').forEach((button) => {
      button.onclick = () => {
        const option = options.find((item) => item.id === button.dataset.choice);
        if (option) onSelected(option);
      };
    });
  }

  challengeInputText(challenge, generated) {
    if (Array.isArray(generated.rows)) return generated.rows.map((row) => row.join(' ')).join('\n');
    if (challenge.inputFormat === 'lines' && Array.isArray(generated.input?.[0])) {
      return generated.input.map((row) => row.join(' ')).join('\n');
    }
    return (generated.input || []).join(' ');
  }

  openChallenge(challengeId, cancelCallback, generatedOverride = null) {
    const challenge = this.content.challengeMap[challengeId]; if (!challenge) return cancelCallback?.();
    const generated = generatedOverride || this.challengeEngine.generate(challenge);
    this.activeChallenge = { challenge, generated, cancelCallback };
    const language = this.state.data.language || 'java';
    const languageNames = { java: 'Java', python: 'Python', micropython: 'MicroPython' };
    const languageLabel = languageNames[language] || language;
    const inputText = this.challengeInputText(challenge, generated);
    this.modal = 'challenge'; this.setMode('challenge');
    this.modalLayer.innerHTML = `
      <div class="modal-backdrop challenge-backdrop">
        <div class="challenge-modal">
          <div class="challenge-head">
            <div><span>RITO DE CAMPO · ${challenge.shortLabel || ''}</span><h2>${challenge.title}</h2></div>
            <button class="icon-btn" data-challenge-close aria-label="Fechar">×</button>
          </div>
          <p class="challenge-story">${challenge.narrative}</p>
          ${challenge.tutorial ? `<div class="field-procedure"><small>COMO EXECUTAR</small><p>Transcreva as marcas no seu programa em ${languageLabel}. Faça o código aplicar a regra do ritual e traga de volta somente a resposta produzida.</p></div>` : ''}
          <div class="ritual-request"><small>RESPOSTA EXIGIDA PELO RITO</small><strong>${challenge.outputHint}</strong></div>
          <div class="ritual-meta">${this.challengeDisplayMeta(challenge, generated).map((m) => `<span>${m}</span>`).join('')}</div>
          <div class="data-box"><code>${inputText}</code><button class="copy-btn" data-copy>COPIAR REGISTRO</button></div>
          <form data-challenge-form>
            <label>Saída produzida pelo programa</label>
            <textarea rows="2" spellcheck="false" placeholder="Cole ou digite somente a saída"></textarea>
            <div class="challenge-actions">
              <div class="challenge-help-actions">
                <button type="button" class="ghost-btn" data-grimoire>${challenge.tutorial ? 'ABRIR ANOTAÇÕES' : 'ABRIR GRIMÓRIO'}</button>
                ${(challenge.hints || []).length ? '<button type="button" class="ghost-btn" data-hint>PERGUNTAR A TOMÁS</button>' : ''}
              </div>
              <button type="submit" class="primary-btn">SUBMETER RITUAL</button>
            </div>
          </form>
          <div class="challenge-feedback" aria-live="polite"></div>
        </div>
      </div>`;
    const close = () => { this.closeModal(); cancelCallback?.(); };
    this.modalLayer.querySelector('[data-challenge-close]').onclick = close;
    this.modalLayer.querySelector('[data-grimoire]').onclick = () => this.openGrimoire('challenge');
    const hintBtn = this.modalLayer.querySelector('[data-hint]');
    let hintIndex = 0;
    if (hintBtn) hintBtn.onclick = () => {
      const hints = challenge.hints || [];
      const feedback = this.modalLayer.querySelector('.challenge-feedback');
      feedback.className = 'challenge-feedback hint';
      feedback.textContent = hints[Math.min(hintIndex, hints.length - 1)];
      hintIndex += 1;
      this.state.recordHint(challenge.id, hintIndex);
      if (hintIndex >= hints.length) hintBtn.textContent = 'RELER AJUDA';
    };
    this.modalLayer.querySelector('[data-copy]').onclick = async () => {
      const text = inputText;
      try { await navigator.clipboard.writeText(text); this.toast('Registro copiado.'); }
      catch { this.toast('Selecione o registro e copie manualmente.'); }
    };
    this.modalLayer.querySelector('[data-challenge-form]').onsubmit = async (e) => {
      e.preventDefault();
      const submitted = this.modalLayer.querySelector('textarea').value;
      const feedback = this.modalLayer.querySelector('.challenge-feedback');
      const submitButton = this.modalLayer.querySelector('[data-challenge-form] button[type="submit"]');
      submitButton.disabled = true;
      let correct = this.challengeEngine.validate(generated.answer, submitted);
      let remoteResult = null;
      if (this.account && this.api) {
        try {
          remoteResult = await this.api.submitChallenge({
            caseId: this.state.data.caseId,
            routeId: this.state.data.learningTrack,
            languageId: this.state.data.language,
            challengeId: challenge.id,
            input: generated.input,
            submitted,
            hintLevel: hintIndex,
            snapshot: this.state.data,
            runId: this.state.runId,
            clientAttemptId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
          });
          correct = remoteResult.correct;
        } catch (error) {
          feedback.className = 'challenge-feedback error';
          feedback.textContent = `O Arquivo não recebeu a resposta: ${error.message}`;
          submitButton.disabled = false;
          return;
        }
      }
      const tries = this.state.recordChallengeAttempt(challenge.id, { correct, hintLevel: hintIndex });
      if (correct) {
        feedback.className = 'challenge-feedback success';
        feedback.textContent = 'A resposta se sustenta.';
        const firstCompletion = this.state.completeChallenge(
          challenge.id,
          this.state.onlineAuthoritative ? { xp: 0, fieldMarks: 0 } : (challenge.rewards || { xp: 25, fieldMarks: 0 })
        );
        if (remoteResult?.profile) this.state.applyRemoteProfile(remoteResult.profile);
        if (!this.state.onlineAuthoritative && firstCompletion && tries <= 2 && hintIndex < 3) {
          this.state.award(`mastery:${this.state.caseId}:${challenge.id}`, challenge.masteryRewards || { xp: 10, fieldMarks: 0 });
        }
        (challenge.flagsOnSuccess || []).forEach((f) => this.state.setFlag(f, true));
        if (challenge.clueOnSuccess) this.state.addClue(challenge.clueOnSuccess);
        this.audio.playSfx('ritual');
        setTimeout(() => {
          this.closeModal();
          this.sceneEngine.start(challenge.successScene);
        }, 650);
      } else {
        submitButton.disabled = false;
        this.state.addPresence(8);
        feedback.className = 'challenge-feedback error';
        feedback.textContent = tries === 1 ? 'Nada muda. Revise o programa antes de tentar outra vez.' : `Ainda não. Alguma coisa respondeu do outro lado. Tentativa ${tries}.`;
        document.body.classList.add('wrong-answer');
        this.audio.playSfx('knock');
        setTimeout(() => document.body.classList.remove('wrong-answer'), 650);
        this.renderTopbar();
      }
    };
  }

  closeModal() { this.modal = null; this.modalLayer.innerHTML = ''; this.activeChallenge = null; }

  openInventory() {
    this.modal = 'inventory';
    const objective = this.currentObjective();
    const visiblePeople = this.content.characters.filter((c) => this.state.knowsCharacter(c.id));
    const firstInventoryOpen = !this.state.hasFlag('inventory_intro_seen');
    if (firstInventoryOpen) this.state.setFlag('inventory_intro_seen', true);
    this.modalLayer.innerHTML = `
      <div class="modal-backdrop"><div class="inventory-modal">
        <div class="modal-title"><div><span>MALETA DE CAMPO</span><h2>${this.state.data.player?.name || 'Investigador'}</h2></div><button class="icon-btn" data-close>×</button></div>
        ${objective ? `<section class="case-note"><small>ANOTAÇÃO ATUAL</small><p>${objective.text}</p></section>` : ''}
        <section class="investigator-progress"><span>NÍVEL ${this.state.profile.level}</span><strong>${this.state.profile.xp} XP</strong><small>${this.state.profile.fieldMarks} Marcas de Campo</small></section>
        ${firstInventoryOpen ? `<div class="inventory-intro"><div class="inventory-speaker">${(this.state.data.player?.name || 'Investigador').toUpperCase()}</div><p>Vou deixar aqui só o que consegui confirmar. Se eu travar num rito, minhas anotações ficam junto do arquivo.</p></div>` : ''}
        <div class="inventory-links">
          <button class="inventory-link" data-open="archive"><strong>Arquivo de campo</strong><span>${this.state.data.clues.length ? `${this.state.data.clues.length} evidência(s) catalogada(s)` : 'Ainda não cataloguei nada útil.'}</span></button>
          <button class="inventory-link" data-open="grimoire"><strong>Grimório</strong><span>Notas de ritual, exemplos em ${this.state.data.language === 'python' ? 'Python' : this.state.data.language === 'micropython' ? 'MicroPython' : 'Java'} e pistas de raciocínio.</span></button>
        </div>
        <div class="people-section compact"><h3>Pessoas conhecidas</h3><div class="people-grid">${visiblePeople.map((c) => this.characterCard(c, false, true)).join('')}</div></div>
      </div></div>`;
    this.modalLayer.querySelector('[data-close]').onclick = () => { this.closeModal(); this.renderRoom(); };
    this.modalLayer.querySelector('[data-open="archive"]').onclick = () => this.openArchive('inventory');
    this.modalLayer.querySelector('[data-open="grimoire"]').onclick = () => this.openGrimoire('inventory');
    this.modalLayer.querySelectorAll('[data-character-profile]').forEach((btn) => {
      btn.onclick = () => this.openCharacterProfile(btn.dataset.characterProfile, 'inventory');
    });
  }

  openArchive(source = 'room') {
    const returnToEnding = this.mode === 'ending' && this.lastEndEvent;
    const clues = this.state.data.clues;
    this.modal = 'archive';
    this.modalLayer.innerHTML = `
      <div class="modal-backdrop"><div class="archive-modal casebook-modal">
        <div class="modal-title"><div><span>ARQUIVO DE CAMPO</span><h2>Evidências recuperadas</h2></div><div class="modal-tools">${source === 'inventory' ? '<button class="ghost-btn small-btn" data-back>VOLTAR</button>' : ''}<button class="icon-btn" data-close>×</button></div></div>
        <div class="archive-grid">
          ${clues.length ? clues.map((c, i) => `<button type="button" class="clue-card ${c.view ? 'clickable' : ''}" data-clue="${c.id}"><span>${String(i+1).padStart(2,'0')}</span><h3>${c.title}</h3><p>${c.text}</p>${c.view ? '<small>ABRIR ORIGINAL</small>' : ''}</button>`).join('') : '<p class="empty-state">Nenhuma evidência catalogada até agora.</p>'}
        </div>
        <div class="people-section"><h3>Pessoas</h3><div class="people-grid">${this.content.characters.filter((c) => this.state.knowsCharacter(c.id)).map((c) => this.characterCard(c, false, true)).join('')}</div></div>
      </div></div>`;
    const closeHandler = () => {
      this.closeModal();
      if (source === 'inventory') this.openInventory();
      else if (returnToEnding) this.showEndCard(this.lastEndEvent);
      else this.renderRoom();
    };
    const back = this.modalLayer.querySelector('[data-back]'); if (back) back.onclick = closeHandler;
    this.modalLayer.querySelector('[data-close]').onclick = closeHandler;
    this.modalLayer.querySelectorAll('[data-clue]').forEach((btn) => {
      const clue = clues.find((c) => c.id === btn.dataset.clue);
      if (clue?.view) btn.onclick = () => this.openArchivedEvidence(clue, source);
    });
    this.modalLayer.querySelectorAll('[data-character-profile]').forEach((btn) => {
      btn.onclick = () => this.openCharacterProfile(btn.dataset.characterProfile, 'archive', source);
    });
  }

  openArchivedEvidence(clue, archiveSource = 'inventory') {
    if (!clue?.view) return;
    this.modal = 'evidence-view';
    this.audio.playSfx('paper');
    this.modalLayer.innerHTML = `
      <div class="modal-backdrop evidence-archive-backdrop">
        <div class="evidence-card archived-evidence">
          <div class="evidence-stamp">${clue.view.stamp || 'ARQUIVO DE CAMPO'}</div>
          <h2>${this.interpolate(clue.view.title || clue.title)}</h2>
          <pre>${this.interpolate(clue.view.body || clue.text || '')}</pre>
          <button class="paper-return" data-return>← VOLTAR AO ARQUIVO</button>
        </div>
      </div>`;
    this.modalLayer.querySelector('[data-return]').onclick = () => this.openArchive(archiveSource);
  }

  openCharacterProfile(characterId, returnView = 'inventory', archiveSource = 'inventory') {
    const c = this.content.characterMap[characterId];
    if (!c || !this.state.knowsCharacter(c.id)) return;
    const p = c.profile || {};
    const linked = (p.linkedEvidence || []).map((id) => this.state.data.clues.find((cl) => cl.id === id)).filter(Boolean);
    this.modal = 'character-profile';
    this.modalLayer.innerHTML = `
      <div class="modal-backdrop"><div class="character-profile-modal">
        <div class="profile-portrait">${this.portraitMarkup(c, 'profile-portrait-image')}</div>
        <div class="profile-copy">
          <span class="profile-kicker">PESSOA REGISTRADA</span>
          <h2>${c.name}</h2>
          <p class="profile-role">${p.role || c.role || ''}</p>
          ${p.firstImpression ? `<blockquote>${p.firstImpression}</blockquote>` : ''}
          <h3>O que sabemos</h3>
          <ul>${(p.knownFacts || []).map((f) => `<li>${f}</li>`).join('') || '<li>Ainda há pouco para registrar.</li>'}</ul>
          ${linked.length ? `<h3>Evidências relacionadas</h3><div class="profile-evidence">${linked.map((e) => `<span>${e.title}</span>`).join('')}</div>` : ''}
          <button class="paper-return" data-return>← VOLTAR</button>
        </div>
      </div></div>`;
    this.modalLayer.querySelector('[data-return]').onclick = () => {
      if (returnView === 'archive') this.openArchive(archiveSource);
      else this.openInventory();
    };
  }

  openGrimoire(source = 'room') {
    this.modal = 'grimoire';
    const previousChallenge = source === 'challenge' ? this.activeChallenge : null;
    const activeTrackId = this.content.activeTrack?.id;
    const entries = this.content.grimoire.filter((g) =>
      (!g.requires || requirementsMet(g.requires, this.state))
      && (!g.tracks || g.tracks.includes(activeTrackId))
    );
    const firstOpen = !this.state.hasFlag('grimoire_intro_seen');
    if (firstOpen) this.state.setFlag('grimoire_intro_seen', true);
    this.modalLayer.innerHTML = `
      <div class="modal-backdrop book-backdrop"><div class="grimoire-modal grimoire-book">
        <div class="book-binding"></div>
        <div class="book-page book-page-left">
          <div class="book-page-scroll">
            <div class="book-kicker">CADERNO DE RITOS</div>
            <h2>Grimório de campo</h2>
            ${firstOpen ? `<div class="book-handnote"><span>COMO USAR ESTE CADERNO</span><p>Estas páginas não substituem a investigação. Elas servem para transformar o que você viu numa regra clara antes de escrever o rito.</p><ol><li>Comece por <em>O que é</em> para nomear a ideia.</li><li>Leia <em>Como pensar</em> e repita o problema em português.</li><li>Use a forma em Java e o exemplo apenas depois de entender a decisão.</li><li>Confira o erro comum antes de submeter o ritual.</li></ol></div>` : `<p class="book-muted">Anotações compreendidas até agora.</p>`}
            <nav class="book-index">
              ${entries.map((g, i) => `<button data-entry="${g.id}"><em>${String(i+1).padStart(2,'0')}</em><span>${g.title}</span><small>${g.concept || ''}</small></button>`).join('') || '<p>Nenhuma anotação foi compreendida ainda.</p>'}
            </nav>
          </div>
          <footer class="book-page-footer">${source === 'inventory' ? '<button class="book-tab" data-back>← MALETA</button>' : '<span></span>'}</footer>
        </div>
        <div class="book-page book-page-right">
          <div class="book-page-scroll" data-book-page>
            ${entries.length ? this.grimoireEntryMarkup(entries[0]) : '<div class="empty-page">As páginas seguintes ainda estão em branco.</div>'}
          </div>
          <footer class="book-page-footer right"><button class="book-tab" data-close>FECHAR GRIMÓRIO →</button></footer>
        </div>
      </div></div>`;
    const page = this.modalLayer.querySelector('[data-book-page]');
    this.modalLayer.querySelectorAll('[data-entry]').forEach((btn) => {
      btn.onclick = () => {
        const entry = entries.find((g) => g.id === btn.dataset.entry);
        if (entry) page.innerHTML = this.grimoireEntryMarkup(entry);
        page.scrollTop = 0;
        this.modalLayer.querySelectorAll('[data-entry]').forEach((b) => b.classList.toggle('active', b === btn));
        this.audio.playSfx('paper');
      };
    });
    const closeHandler = () => {
      this.modalLayer.innerHTML = ''; this.modal = null;
      if (previousChallenge) {
        this.activeChallenge = previousChallenge;
        this.openChallenge(previousChallenge.challenge.id, previousChallenge.cancelCallback, previousChallenge.generated);
      } else if (source === 'inventory') this.openInventory();
      else this.renderRoom();
    };
    const back = this.modalLayer.querySelector('[data-back]'); if (back) back.onclick = closeHandler;
    this.modalLayer.querySelector('[data-close]').onclick = closeHandler;
  }

  grimoireEntryMarkup(g) {
    const language = this.state.data.language === 'micropython'
      ? 'python'
      : (this.state.data.settings.grimoireLanguage === 'python' ? 'python' : 'java');
    const languageLabel = this.state.data.language === 'micropython' ? 'MicroPython' : (language === 'python' ? 'Python' : 'Java');
    const syntax = language === 'python' ? (g.pythonSyntax || g.syntax) : g.syntax;
    const example = language === 'python' ? (g.pythonExample || g.example) : g.example;
    return `<article class="grimoire-entry" data-grimoire-entry="${g.id}">
      <div class="entry-number">${g.concept || 'Rito'}</div>
      <h3>${g.title}</h3>
      <section><h4>O que é</h4><p>${g.what}</p></section>
      <section><h4>Como pensar</h4><p>${g.mentalModel}</p></section>
      <section><h4>Forma em ${languageLabel}</h4><pre><code>${syntax}</code></pre></section>
      <section><h4>Exemplo em ${languageLabel}</h4><pre><code>${example}</code></pre></section>
      <aside class="margin-note"><b>Erro comum</b><p>${g.commonMistake}</p></aside>
      <aside class="ritual-note"><b>Quando isso aparece num rito</b><p>${g.ritualUse}</p></aside>
      ${g.protagonistNote ? `<aside class="field-handnote"><b>Anotação de ${this.state.data.player?.name || 'campo'}</b><p>${g.protagonistNote}</p></aside>` : ''}
      ${g.tomasTip ? `<aside class="tomas-note"><b>Nota de Tomás</b><p>${g.tomasTip}</p></aside>` : ''}
    </article>`;
  }

  challengeDisplayMeta(challenge, generated) {
    const values = { N: generated.meta.N ?? generated.input.length, threshold: generated.meta.threshold ?? '' };
    const raw = challenge.displayMeta || [`${values.N} registros transcritos`];
    return raw.map((item) => String(item).replace(/\{\{N\}\}/g, values.N).replace(/\{\{threshold\}\}/g, values.threshold));
  }

  openSettings() {
    if (this.settingsOpen) return;
    const s = this.state.data.settings;
    this.settingsOpen = true;
    this.settingsFocus = document.activeElement;
    this.modalLayer.insertAdjacentHTML('beforeend', `
      <div class="modal-backdrop settings-overlay" data-settings-overlay><div class="settings-modal" role="dialog" aria-modal="true" aria-label="Opções">
        <div class="modal-title"><div><span>AJUSTES</span><h2>Opções</h2></div><button class="icon-btn" data-close>×</button></div>
        <label>Volume geral <input type="range" min="0" max="1" step="0.01" value="${s.masterVolume}" data-master></label>
        <label>Música <input type="range" min="0" max="1" step="0.01" value="${s.musicVolume}" data-music></label>
        <label>Efeitos sonoros <input type="range" min="0" max="1" step="0.01" value="${s.sfxVolume}" data-sfx></label>
        <label>Velocidade do texto <input type="range" min="5" max="50" step="1" value="${s.textSpeed}" data-speed></label>
        <label>Tamanho do texto <input type="range" min="0.9" max="1.25" step="0.05" value="${s.dialogueScale || 1}" data-dialogue-scale></label>
        <label>Linguagem de consulta <select data-grimoire-language><option value="java" ${s.grimoireLanguage !== 'python' ? 'selected' : ''}>Java</option><option value="python" ${s.grimoireLanguage === 'python' ? 'selected' : ''}>Python</option></select></label>
        <label class="toggle"><input type="checkbox" ${s.muted ? 'checked' : ''} data-muted> Silenciar todo o áudio</label>
        ${this.mode !== 'title' && this.state.runId ? `<hr><section class="investigation-actions"><span>INVESTIGAÇÃO</span><button class="primary-btn" data-save-exit>SALVAR E SAIR PARA O ARQUIVO</button><button class="danger-btn" data-restart>REINICIAR CASO</button><p>Reiniciar arquiva esta tentativa e preserva as respostas para o mentor.</p></section>` : ''}
      </div></div>`);
    const overlay = this.modalLayer.querySelector('[data-settings-overlay]');
    overlay.querySelector('[data-master]').oninput = (e) => this.audio.setMasterVolume(e.target.value);
    overlay.querySelector('[data-music]').oninput = (e) => this.audio.setMusicVolume(e.target.value);
    overlay.querySelector('[data-sfx]').oninput = (e) => { this.audio.setSfxVolume(e.target.value); this.audio.playSfx('paper'); };
    overlay.querySelector('[data-speed]').oninput = (e) => { this.state.data.settings.textSpeed = Number(e.target.value); this.state.save(); };
    overlay.querySelector('[data-dialogue-scale]').oninput = (e) => {
      this.state.data.settings.dialogueScale = Number(e.target.value);
      this.applyReadingPreferences();
      this.state.save();
    };
    overlay.querySelector('[data-grimoire-language]').onchange = (e) => {
      this.state.data.settings.grimoireLanguage = e.target.value;
      this.state.save();
      const visibleEntry = this.modalLayer.querySelector('[data-book-page] .grimoire-entry');
      const entry = this.content.grimoire.find((g) => g.id === visibleEntry?.dataset.grimoireEntry);
      if (visibleEntry && entry) visibleEntry.outerHTML = this.grimoireEntryMarkup(entry);
    };
    overlay.querySelector('[data-muted]').onchange = (e) => this.audio.setMuted(e.target.checked);
    const saveExit = overlay.querySelector('[data-save-exit]');
    if (saveExit) saveExit.onclick = async () => {
      saveExit.disabled = true; saveExit.textContent = 'SALVANDO…';
      try { await this.onSaveExit?.(); }
      catch (error) { saveExit.disabled = false; saveExit.textContent = 'TENTAR SALVAR E SAIR'; this.toast(`Não foi possível sair: ${error.message}`); }
    };
    const restart = overlay.querySelector('[data-restart]');
    if (restart) restart.onclick = async () => {
      const route = this.state.data.learningTrack;
      if (!confirm(`Reiniciar ${this.content.campaign.title || 'este caso'} (${route})?\n\nA tentativa atual será arquivada e continuará visível ao mentor.`)) return;
      restart.disabled = true; restart.textContent = 'ARQUIVANDO…';
      try { await this.onRestart?.(); }
      catch (error) { restart.disabled = false; restart.textContent = 'REINICIAR CASO'; this.toast(`Não foi possível reiniciar: ${error.message}`); }
    };
    overlay.querySelector('[data-close]').onclick = () => this.closeSettings();
    overlay.querySelector('[data-close]').focus();
  }

  closeSettings() {
    this.modalLayer.querySelector('[data-settings-overlay]')?.remove();
    this.settingsOpen = false;
    const previousFocus = this.settingsFocus;
    this.settingsFocus = null;
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  async showEndCard(event) {
    this.lastEndEvent = event;
    if (this.account && this.api) {
      try {
        await this.state.flushSync();
        const result = await this.api.completeCase(this.state.data);
        this.state.syncHandler = null;
        this.setSaveStatus('saved');
        if (result.profile) this.state.applyRemoteProfile(result.profile);
      } catch (error) {
        console.warn('Conclusão online pendente:', error.message);
      }
    }
    this.setMode('ending');
    this.topbar.innerHTML = '';
    this.dialogueLayer.innerHTML = '';
    const clues = this.state.data.clues.length;
    const rewards = this.state.data.rewardsEarned || { xp: 0, fieldMarks: 0 };
    this.contentLayer.innerHTML = `
      <div class="end-card">
        <div class="end-line"></div>
        <span>ARQUIVO VESPER // RESULTADO</span>
        <h1>${event.title}</h1>
        <p>${event.subtitle}</p>
        <div class="end-stats"><b>${clues}</b><small>evidências catalogadas</small></div>
        <div class="end-rewards"><span>+${rewards.xp} XP</span><span>+${rewards.fieldMarks} MARCAS DE CAMPO</span><small>As escolhas foram registradas no relatório, sem pontuação moral.</small></div>
        <div class="case-hook">${event.hookLabel || 'ARQUIVO SEGUINTE'}: <strong>${event.hook || 'NOVOS CASOS AGUARDAM REVISÃO'}</strong></div>
        <button class="ghost-btn" data-archive>REVER ARQUIVO</button>
        <button class="primary-btn" data-return>VOLTAR AO TÍTULO</button>
      </div>`;
    this.contentLayer.querySelector('[data-archive]').onclick = () => this.openArchive();
    this.contentLayer.querySelector('[data-return]').onclick = () => location.reload();
  }

  toast(message) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = message;
    this.toastLayer.appendChild(t);
    setTimeout(() => t.classList.add('show'), 20);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 2200);
  }
}
