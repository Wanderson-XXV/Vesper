import { ApiClient } from './engine/ApiClient.js';
import { appPath } from './engine/AppPaths.js';

const root = document.querySelector('#mentorApp');
const api = new ApiClient();
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const rewriteAppLinks = () => root.querySelectorAll('a[href="/"]').forEach((link) => { link.href = appPath('/'); });
const particles = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

const languageLabels = { java: 'Java', python: 'Python', micropython: 'MicroPython' };
const statusLabels = { active: 'Em andamento', completed: 'Concluída', abandoned: 'Reiniciada' };

function humanizeName(value) {
  const raw = String(value || '').trim().replace(/[._-]+/g, ' ');
  if (!raw) return 'Investigador sem nome';
  return raw.split(/\s+/).map((word, index) => {
    const lower = word.toLocaleLowerCase('pt-BR');
    if (index && particles.has(lower)) return lower;
    if (word !== lower) return word;
    return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
  }).join(' ');
}

function teamById(id) {
  return window.mentorState?.me?.teams?.find((team) => team.id === id);
}

function setFeedback(message, state = 'neutral') {
  const feedback = root.querySelector('[data-page-feedback]');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = state;
  feedback.hidden = !message;
}

function passwordField(name, label) {
  return `<div class="mentor-field mentor-password-field">
    <label for="${name}">${label}</label>
    <div class="mentor-password-control">
      <input id="${name}" name="${name}" type="password" minlength="8" autocomplete="new-password" required>
      <button type="button" data-password-toggle="${name}" aria-label="Mostrar ${label.toLocaleLowerCase('pt-BR')}">MOSTRAR</button>
    </div>
  </div>`;
}

function bindPasswordToggles(scope) {
  scope.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.onclick = () => {
      const input = scope.querySelector(`#${button.dataset.passwordToggle}`);
      const revealing = input.type === 'password';
      input.type = revealing ? 'text' : 'password';
      button.textContent = revealing ? 'OCULTAR' : 'MOSTRAR';
      button.setAttribute('aria-label', `${revealing ? 'Ocultar' : 'Mostrar'} ${input.labels?.[0]?.textContent?.toLocaleLowerCase('pt-BR') || 'senha'}`);
    };
  });
}

function closeResetDialog() {
  const layer = root.querySelector('[data-mentor-modal-layer]');
  if (layer) layer.innerHTML = '';
}

function showResetSuccess({ password, studentName, username }) {
  const layer = root.querySelector('[data-mentor-modal-layer]');
  layer.innerHTML = `<div class="mentor-modal-backdrop">
    <section class="mentor-modal mentor-reset-success" role="dialog" aria-modal="true" aria-labelledby="resetSuccessTitle">
      <span class="mentor-modal-kicker">ACESSO ATUALIZADO</span>
      <h2 id="resetSuccessTitle">Senha temporária definida</h2>
      <p>A senha de <strong>${escapeHtml(studentName)}</strong> foi redefinida e as sessões anteriores foram encerradas.</p>
      <div class="mentor-credential">
        <span>ENTRAR COMO</span><strong>@${escapeHtml(username)}</strong>
        <span>SENHA TEMPORÁRIA</span><code data-temporary-password>${escapeHtml(password)}</code>
        <button class="ghost-btn" type="button" data-copy-password>COPIAR SENHA</button>
      </div>
      <p class="mentor-next-step"><strong>Próximo passo:</strong> o investigador entra com esses dados e o Vesper solicitará uma nova senha antes de abrir qualquer caso.</p>
      <button class="primary-btn" type="button" data-close-reset>CONCLUIR</button>
    </section>
  </div>`;
  layer.querySelector('[data-close-reset]').onclick = closeResetDialog;
  layer.querySelector('[data-copy-password]').onclick = async (event) => {
    try {
      await navigator.clipboard.writeText(password);
      event.currentTarget.textContent = 'SENHA COPIADA';
    } catch {
      event.currentTarget.textContent = 'SELECIONE A SENHA ACIMA';
    }
  };
  setFeedback(`Senha temporária de ${studentName} definida.`, 'success');
}

function openResetDialog(button) {
  const layer = root.querySelector('[data-mentor-modal-layer]');
  const studentName = button.dataset.studentName;
  const username = button.dataset.username;
  layer.innerHTML = `<div class="mentor-modal-backdrop">
    <section class="mentor-modal" role="dialog" aria-modal="true" aria-labelledby="resetTitle">
      <button class="mentor-modal-close" type="button" data-close-reset aria-label="Fechar">×</button>
      <span class="mentor-modal-kicker">SEGURANÇA DO ARQUIVO</span>
      <h2 id="resetTitle">Redefinir acesso</h2>
      <p>Defina uma senha temporária para <strong>${escapeHtml(studentName)}</strong> <span class="mentor-inline-id">@${escapeHtml(username)}</span>.</p>
      <p class="mentor-warning">Ao confirmar, todas as sessões abertas desse investigador serão encerradas.</p>
      <form data-reset-form>
        ${passwordField('mentorTemporaryPassword', 'Senha temporária')}
        ${passwordField('mentorConfirmPassword', 'Confirme a senha temporária')}
        <p class="mentor-form-feedback" data-reset-feedback role="alert" aria-live="polite"></p>
        <div class="mentor-modal-actions">
          <button class="ghost-btn" type="button" data-close-reset>CANCELAR</button>
          <button class="primary-btn" type="submit">REDEFINIR ACESSO</button>
        </div>
      </form>
    </section>
  </div>`;
  layer.querySelectorAll('[data-close-reset]').forEach((close) => { close.onclick = closeResetDialog; });
  bindPasswordToggles(layer);
  layer.querySelector('#mentorTemporaryPassword').focus();
  layer.querySelector('[data-reset-form]').onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get('mentorTemporaryPassword') || '');
    const confirmation = String(data.get('mentorConfirmPassword') || '');
    const feedback = layer.querySelector('[data-reset-feedback]');
    if (password !== confirmation) {
      feedback.textContent = 'As senhas não conferem.';
      return;
    }
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'REDEFININDO…';
    feedback.textContent = '';
    try {
      const result = await api.resetStudentPassword(button.dataset.team, button.dataset.resetStudent, {
        temporaryPassword: password,
        confirmPassword: confirmation
      });
      showResetSuccess({ password: result.temporaryPassword, studentName, username });
    } catch (error) {
      feedback.textContent = error.message;
      submit.disabled = false;
      submit.textContent = 'REDEFINIR ACESSO';
    }
  };
}

function renderAttemptDetails(row) {
  const responses = Array.isArray(row.responses) ? row.responses : [];
  const choices = Array.isArray(row.choices) ? row.choices : [];
  if (!responses.length && !choices.length && !row.ending_id) return '';
  return `<details class="mentor-details">
    <summary>VER DETALHES DA TENTATIVA</summary>
    <div class="mentor-detail-content">
      ${row.ending_id ? `<p><span>FINAL</span><strong>${escapeHtml(humanizeName(row.ending_id))}</strong></p>` : ''}
      ${choices.length ? `<p><span>ESCOLHAS</span><strong>${choices.map((choice) => `${humanizeName(choice.choiceId)}: ${humanizeName(choice.optionId)}`).map(escapeHtml).join(' · ')}</strong></p>` : ''}
      ${responses.map((attempt) => `<div class="mentor-attempt"><b>${escapeHtml(humanizeName(attempt.challengeId))}</b><span>${attempt.correct ? 'Correta' : 'Incorreta'} · tentativa ${attempt.attemptNo} · dica ${attempt.hintLevel}</span><code>${escapeHtml(JSON.stringify(attempt.input))}</code><pre>${escapeHtml(attempt.submitted)}</pre></div>`).join('')}
    </div>
  </details>`;
}

function renderRows(rows, teamId) {
  if (!rows.length) return `<div class="mentor-empty">
    <span>SEM REGISTROS</span>
    <h3>Nenhum investigador nesta equipe</h3>
    <p>Compartilhe o código da equipe. Os registros aparecerão aqui depois que os alunos criarem suas contas.</p>
  </div>`;
  return `<div class="mentor-table-wrap"><table>
    <thead><tr><th>Investigador</th><th>Investigação</th><th>Status</th><th>Rituais</th><th>Pistas / tempo</th><th>Progresso</th><th>Acesso</th></tr></thead>
    <tbody>${rows.map((row) => {
      const displayName = humanizeName(row.display_name || row.username);
      const status = row.status ? statusLabels[row.status] || humanizeName(row.status) : 'Não iniciada';
      const investigation = row.case_id ? [row.case_subtitle, row.case_title].filter(Boolean).join(' · ') || humanizeName(row.case_id) : 'Nenhuma investigação iniciada';
      const route = row.route_id ? row.route_name || humanizeName(row.route_id) : '';
      const language = row.language_id ? languageLabels[row.language_id] || row.language_id : '';
      const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
      return `<tr>
        <td data-label="Investigador"><div class="mentor-investigator"><span class="mentor-avatar" aria-hidden="true">${escapeHtml(initials)}</span><span><strong class="mentor-student-name">${escapeHtml(displayName)}</strong><small>@${escapeHtml(row.username)}</small></span></div></td>
        <td data-label="Investigação"><strong class="mentor-case-name">${escapeHtml(investigation)}</strong>${row.case_id ? `<small>${escapeHtml(route)}${language ? ` · ${escapeHtml(language)}` : ''} · tentativa ${row.attempt_number || 1}</small>` : ''}${renderAttemptDetails(row)}</td>
        <td data-label="Status"><span class="mentor-status" data-status="${escapeHtml(row.status || 'not-started')}">${escapeHtml(status)}</span></td>
        <td data-label="Rituais"><strong>${row.correct_attempts || 0}/${row.attempts || 0}</strong><small>corretos / tentativas${row.max_hint ? ` · dica ${row.max_hint}` : ''}</small></td>
        <td data-label="Pistas / tempo"><strong>${row.optional_clues || 0} pistas</strong><small>${row.duration_seconds ? `${Math.round(row.duration_seconds / 60)} min de investigação` : 'Tempo ainda não registrado'}</small></td>
        <td data-label="Progresso"><strong>${row.xp || 0} XP</strong><small>Nível ${row.level || 1} · ${row.field_marks || 0} marcas</small></td>
        <td data-label="Acesso"><button class="mentor-reset" type="button" data-reset-student="${escapeHtml(row.user_id)}" data-team="${escapeHtml(teamId)}" data-student-name="${escapeHtml(displayName)}" data-username="${escapeHtml(row.username)}">REDEFINIR SENHA</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function renderReport(report, team) {
  const panel = root.querySelector('[data-report]');
  const rows = report.students || [];
  panel.innerHTML = `<header class="mentor-report-header">
    <div><span>REGISTROS DA EQUIPE</span><h2>${escapeHtml(team.name)}</h2><p>${rows.length} ${rows.length === 1 ? 'registro encontrado' : 'registros encontrados'} · código <strong>${escapeHtml(team.code)}</strong></p></div>
    <a class="mentor-export" href="${appPath(`/api/mentor/teams/${team.id}/report.csv`)}">EXPORTAR CSV</a>
  </header>
  ${renderRows(rows, team.id)}`;
  panel.querySelectorAll('[data-reset-student]').forEach((button) => { button.onclick = () => openResetDialog(button); });
}

async function loadReport(teamId) {
  const team = teamById(teamId);
  if (!team) return;
  window.mentorState.activeTeamId = teamId;
  root.querySelectorAll('[data-team]').forEach((button) => {
    const active = button.dataset.team === teamId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const panel = root.querySelector('[data-report]');
  panel.innerHTML = '<div class="mentor-loading"><span></span><p>Consultando registros…</p></div>';
  setFeedback('', 'neutral');
  try {
    const report = await api.request(`/api/mentor/teams/${teamId}/report`);
    renderReport(report, team);
  } catch (error) {
    panel.innerHTML = `<div class="mentor-empty mentor-error"><span>FALHA NA CONSULTA</span><h3>Não foi possível abrir o relatório</h3><p>${escapeHtml(error.message)}</p><button class="ghost-btn" data-retry-report>TENTAR NOVAMENTE</button></div>`;
    panel.querySelector('[data-retry-report]').onclick = () => loadReport(teamId);
  }
}

function renderMentor(me) {
  const mentorName = humanizeName(me.profile?.display_name || me.user.username);
  root.innerHTML = `<div class="mentor-layout">
    <aside class="mentor-sidebar">
      <header class="mentor-brand"><span>ARQUIVO VESPER</span><h1>Relatório do mentor</h1><p>Acompanhamento de equipes e investigações.</p></header>
      <section class="mentor-session"><span>SESSÃO ATIVA</span><strong>${escapeHtml(mentorName)}</strong><small>@${escapeHtml(me.user.username)} · MENTOR</small></section>
      <section class="mentor-team-list">
        <div class="mentor-section-label"><span>EQUIPES</span><small>${me.teams.length}</small></div>
        <nav aria-label="Equipes">${me.teams.map((team) => `<button type="button" data-team="${team.id}" aria-pressed="false"><strong>${escapeHtml(team.name)}</strong><span>CÓDIGO ${escapeHtml(team.code)}</span></button>`).join('') || '<p>Nenhuma equipe criada.</p>'}</nav>
      </section>
      <form class="mentor-team-form" data-team-form>
        <label for="mentorTeamName">NOVA EQUIPE</label>
        <div><input id="mentorTeamName" name="name" placeholder="Nome da equipe" minlength="2" required><button class="primary-btn">CRIAR</button></div>
      </form>
      <a class="mentor-back" href="/">← VOLTAR AO VESPER</a>
    </aside>
    <main class="mentor-workspace">
      <div class="mentor-page-feedback" data-page-feedback role="status" aria-live="polite" hidden></div>
      <section class="mentor-report" data-report><div class="mentor-empty"><span>ARQUIVO DE EQUIPES</span><h3>Selecione uma equipe</h3><p>Os registros de investigação aparecerão neste espaço.</p></div></section>
    </main>
  </div><div data-mentor-modal-layer></div>`;
  rewriteAppLinks();
  root.querySelectorAll('[data-team]').forEach((button) => { button.onclick = () => loadReport(button.dataset.team); });
  root.querySelector('[data-team-form]').onsubmit = async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('button');
    const data = new FormData(event.currentTarget);
    submit.disabled = true;
    submit.textContent = 'CRIANDO…';
    try {
      await api.createTeam(data.get('name'));
      window.location.reload();
    } catch (error) {
      setFeedback(error.message, 'error');
      submit.disabled = false;
      submit.textContent = 'CRIAR';
    }
  };
  if (me.teams[0]) loadReport(me.teams[0].id);
}

async function boot() {
  const me = await api.me();
  if (!me) {
    root.innerHTML = '<div class="mentor-auth"><span>ARQUIVO VESPER</span><h1>Sessão necessária</h1><p>Entre pelo jogo com uma conta de mentor e volte a esta página.</p><a class="primary-btn" href="/">VOLTAR AO VESPER</a></div>';
    rewriteAppLinks();
    return;
  }
  if (!['mentor', 'admin'].includes(me.user.role)) {
    root.innerHTML = '<div class="mentor-auth"><span>ACESSO RESTRITO</span><h1>Arquivo reservado</h1><p>Este relatório está disponível apenas para mentores.</p><a class="primary-btn" href="/">VOLTAR AO JOGO</a></div>';
    rewriteAppLinks();
    return;
  }
  window.mentorState = { me, activeTeamId: null };
  renderMentor(me);
}

boot().catch((error) => {
  root.innerHTML = `<div class="mentor-auth mentor-error"><span>FALHA DE ACESSO</span><h1>O Arquivo não respondeu</h1><p>${escapeHtml(error.message)}</p><button class="ghost-btn" data-retry-boot>TENTAR NOVAMENTE</button></div>`;
  root.querySelector('[data-retry-boot]').onclick = () => window.location.reload();
});
