import { ApiClient } from './engine/ApiClient.js';
import { appPath } from './engine/AppPaths.js';

const root = document.querySelector('#mentorApp');
const api = new ApiClient();
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const rewriteAppLinks = () => root.querySelectorAll('a[href="/"]').forEach((link) => { link.href = appPath('/'); });

function renderRows(rows, teamId) {
  if (!rows.length) return '<p class="mentor-empty">Nenhum aluno ou progresso registrado nesta equipe.</p>';
  return `<div class="mentor-table-wrap"><table><thead><tr><th>Investigador</th><th>Caso / rota</th><th>Status</th><th>Tentativas</th><th>Dica</th><th>Investigação</th><th>XP</th><th>Final / escolhas</th></tr></thead><tbody>${rows.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.display_name)}</strong><small>${escapeHtml(row.username)}</small></td>
      <td>${escapeHtml(row.case_id || '—')}<small>${escapeHtml(row.route_id || '')} · ${escapeHtml(row.language_id || '')} · tentativa ${row.attempt_number || 1}</small></td>
      <td>${escapeHtml(row.status === 'abandoned' ? 'reiniciada' : row.status || 'não iniciado')}</td>
      <td>${row.attempts || 0} <small>${row.correct_attempts || 0} corretas</small></td>
      <td>${row.max_hint || 0}</td><td>${row.optional_clues || 0} pistas<small>${row.duration_seconds ? `${Math.round(row.duration_seconds / 60)} min` : ''}</small></td><td>${row.xp || 0}</td><td>${escapeHtml(row.ending_id || '—')}<small>${(row.choices || []).map((choice) => `${choice.choiceId}: ${choice.optionId}`).join(' · ')}</small><details><summary>VER RESPOSTAS</summary>${(row.responses || []).map((attempt) => `<div class="mentor-attempt"><b>${escapeHtml(attempt.challengeId)}</b><span>${attempt.correct ? 'correta' : 'incorreta'} · tentativa ${attempt.attemptNo} · dica ${attempt.hintLevel}</span><code>${escapeHtml(JSON.stringify(attempt.input))}</code><pre>${escapeHtml(attempt.submitted)}</pre></div>`).join('') || '<span>Nenhuma resposta.</span>'}</details><button class="ghost-btn mentor-reset" data-reset-student="${escapeHtml(row.user_id)}" data-team="${escapeHtml(teamId)}">REDEFINIR SENHA</button></td>
    </tr>`).join('')}</tbody></table></div>`;
}

async function loadReport(teamId) {
  const panel = root.querySelector('[data-report]');
  panel.innerHTML = '<p>Carregando relatório…</p>';
  try {
    const report = await api.request(`/api/mentor/teams/${teamId}/report`);
    panel.innerHTML = `${renderRows(report.students, teamId)}<a class="ghost-btn mentor-export" href="${appPath(`/api/mentor/teams/${teamId}/report.csv`)}">EXPORTAR CSV</a>`;
    panel.querySelectorAll('[data-reset-student]').forEach((button) => button.onclick = async () => {
      if (!confirm('Redefinir a senha deste aluno e encerrar as sessões abertas?')) return;
      try {
        const result = await api.resetStudentPassword(button.dataset.team, button.dataset.resetStudent);
        prompt('Copie a senha temporária. Ela será exibida somente agora:', result.temporaryPassword);
      } catch (error) { panel.insertAdjacentHTML('afterbegin', `<p class="mentor-error">${escapeHtml(error.message)}</p>`); }
    });
  } catch (error) { panel.innerHTML = `<p class="mentor-error">${escapeHtml(error.message)}</p>`; }
}

async function boot() {
  const me = await api.me();
  if (!me) {
    root.innerHTML = '<div class="mentor-auth"><span>ARQUIVO VESPER</span><h1>Sessão necessária</h1><p>Entre pelo jogo com uma conta de mentor e volte a esta página.</p><a class="primary-btn" href="/">VOLTAR AO VESPER</a></div>';
    rewriteAppLinks();
    return;
  }
  if (!['mentor', 'admin'].includes(me.user.role)) {
    root.innerHTML = '<div class="mentor-auth"><h1>Acesso reservado</h1><p>Este relatório está disponível apenas para mentores.</p><a class="primary-btn" href="/">VOLTAR AO JOGO</a></div>';
    rewriteAppLinks();
    return;
  }
  root.innerHTML = `
    <header class="mentor-header"><div><span>ARQUIVO VESPER</span><h1>Relatório do mentor</h1></div><a href="/">VOLTAR AO JOGO</a></header>
    <section class="mentor-toolbar">
      <form data-team-form><label>Nova equipe <input name="name" placeholder="TechFenix" required></label><button class="primary-btn">CRIAR EQUIPE</button></form>
      <nav>${me.teams.map((team) => `<button data-team="${team.id}"><strong>${escapeHtml(team.name)}</strong><span>CÓDIGO ${escapeHtml(team.code)}</span></button>`).join('') || '<span>Nenhuma equipe criada.</span>'}</nav>
    </section>
    <section class="mentor-report" data-report><p>Selecione ou crie uma equipe.</p></section>`;
  root.querySelectorAll('a[href="/"]').forEach((link) => { link.href = appPath('/'); });
  root.querySelectorAll('[data-team]').forEach((button) => button.onclick = () => loadReport(button.dataset.team));
  root.querySelector('[data-team-form]').onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try { await api.createTeam(data.get('name')); window.location.reload(); }
    catch (error) { root.querySelector('[data-report]').innerHTML = `<p class="mentor-error">${escapeHtml(error.message)}</p>`; }
  };
  if (me.teams[0]) loadReport(me.teams[0].id);
}

boot().catch((error) => { root.innerHTML = `<p class="mentor-error">${escapeHtml(error.message)}</p>`; });
