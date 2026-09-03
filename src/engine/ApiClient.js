import { appPath } from './AppPaths.js';
import { installDiagnostics, recordDiagnostic } from './Diagnostics.js';

installDiagnostics();

function requestId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class ApiClient {
  async request(path, options = {}) {
    const startedAt = Date.now();
    const method = options.method || 'GET';
    const clientRequestId = requestId();
    const { headers: optionHeaders = {}, ...requestOptions } = options;
    let response;
    try {
      response = await fetch(appPath(path), {
        ...requestOptions,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...optionHeaders, 'X-Vesper-Request-Id': clientRequestId }
      });
    } catch (cause) {
      const diagnostic = recordDiagnostic('api_network_error', {
        method,
        path,
        clientRequestId,
        durationMs: Date.now() - startedAt,
        message: cause.message || String(cause)
      });
      throw Object.assign(cause, { requestId: clientRequestId, diagnostic });
    }
    const data = await response.json().catch(() => ({}));
    const serverRequestId = response.headers.get('x-vesper-request-id') || data.requestId || clientRequestId;
    if (!response.ok) {
      const error = Object.assign(new Error(data.error || `Falha HTTP ${response.status}`), {
        status: response.status,
        code: data.code,
        current: data.current,
        requestId: serverRequestId
      });
      error.diagnostic = recordDiagnostic('api_error', {
        method,
        path,
        status: response.status,
        code: data.code,
        requestId: serverRequestId,
        durationMs: Date.now() - startedAt,
        message: error.message
      });
      throw error;
    }
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

  resetStudentPassword(teamId, studentId, payload = {}) {
    return this.request(`/api/mentor/teams/${teamId}/students/${studentId}/reset-password`, { method: 'POST', body: JSON.stringify(payload) });
  }
}
