import test from 'node:test';
import assert from 'node:assert/strict';

test('ApiClient registra erros com requestId sem expor payload sensível', async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const logs = [];
  globalThis.window = { location: { pathname: '/' } };
  console.error = (...args) => logs.push(args);
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers['X-Vesper-Request-Id'].length > 0, true);
    return new Response(JSON.stringify({ error: 'Falha interna da API', code: 'INTERNAL', requestId: 'req-test-123' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'X-Vesper-Request-Id': 'req-test-123' }
    });
  };

  try {
    const { ApiClient } = await import('../src/engine/ApiClient.js?diagnostics-test');
    await assert.rejects(
      () => new ApiClient().request('/api/submissions', { method: 'POST', body: JSON.stringify({ password: 'nao-logar' }) }),
      (error) => {
        assert.equal(error.requestId, 'req-test-123');
        assert.equal(error.diagnostic.event, 'api_error');
        assert.match(error.diagnostic.path, /submissions/);
        return true;
      }
    );
    assert.equal(logs.length, 1);
    assert.doesNotMatch(JSON.stringify(logs), /nao-logar/);
    assert.equal(typeof window.vesperDiagnostics(), 'string');
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});
