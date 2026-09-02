import { appPath } from './AppPaths.js';

export class ApiClient {
  async request(path, options = {}) {
    const response = await fetch(appPath(path), {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || `Falha HTTP ${response.status}`), { status: response.status, code: data.code, current: data.current });
    return data;
  }

  async status() {
    try { return await this.request('/api/health'); }
    catch { return { ok: false, database: false }; }
  }

  async me() {
    try {
      const result = await this.request('/api/me');
      return result.authenticated === false ? null : result;
    }
    catch (error) { if (error.status === 401 || error.status === 503) return null; throw error; }
  }

  login(username, password) { return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }); }
  register(payload) { return this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }); }
  getAccount() { return this.me(); }
  changePassword(payload) {
    const body = typeof payload === 'string'
      ? { newPassword: payload, confirmPassword: payload }
      : payload;
    return this.request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(body) });
  }
  updateUsername(payload) {
    return this.request('/api/account/username', { method: 'POST', body: JSON.stringify(payload) });
  }
  logout() { return this.request('/api/auth/logout', { method: 'POST', body: '{}' }); }
  createTeam(name) { return this.request('/api/teams', { method: 'POST', body: JSON.stringify({ name }) }); }
  currentRun(caseId, routeId) { return this.request(`/api/runs/current?caseId=${encodeURIComponent(caseId)}&routeId=${encodeURIComponent(routeId)}`); }
  startRun(data) { return this.request('/api/runs/start', { method: 'POST', body: JSON.stringify(data) }); }
  restartRun(data) { return this.request('/api/runs/restart', { method: 'POST', body: JSON.stringify(data) }); }

  syncState(data) {
    return this.request('/api/runs/sync', {
      method: 'POST',
      body: JSON.stringify({
        caseId: data.caseId,
        routeId: data.routeId || data.learningTrack,
        languageId: data.languageId || data.language,
        contentVersion: data.contentVersion,
        runId: data.runId,
        revision: data.revision,
        snapshot: data,
        events: data.storyEvents || []
      })
    });
  }

  submitChallenge(payload) {
    return this.request('/api/submissions', { method: 'POST', body: JSON.stringify(payload) });
  }

  completeCase(data) {
    return this.request('/api/runs/complete', {
      method: 'POST',
      body: JSON.stringify({
        caseId: data.caseId,
        routeId: data.routeId || data.learningTrack,
        languageId: data.languageId || data.language,
        contentVersion: data.contentVersion,
        endingId: data.endingId,
        runId: data.runId,
        revision: data.revision,
        snapshot: data.snapshot || data
      })
    });
  }

  resetStudentPassword(teamId, studentId) {
    return this.request(`/api/mentor/teams/${teamId}/students/${studentId}/reset-password`, { method: 'POST', body: '{}' });
  }
}
