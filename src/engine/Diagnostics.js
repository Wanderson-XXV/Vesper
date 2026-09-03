const MAX_ENTRIES = 50;
const entries = [];

const sensitiveKey = /password|cookie|token|authorization|snapshot|body|input|submitted/i;

function sanitize(value, key = '') {
  if (sensitiveKey.test(key)) return '[redacted]';
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, sanitize(childValue, childKey)]));
  }
  return value;
}

export function recordDiagnostic(event, details = {}) {
  const entry = sanitize({ at: new Date().toISOString(), event, ...details });
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  console.error(`[Vesper] ${event}`, entry);
  return entry;
}

export function diagnosticsReport() {
  return JSON.stringify({ app: 'Vesper', generatedAt: new Date().toISOString(), entries: entries.slice() }, null, 2);
}

export function installDiagnostics() {
  if (typeof window === 'undefined') return;
  window.vesperDiagnostics = () => {
    const report = diagnosticsReport();
    console.info('[Vesper] Relatório de diagnóstico:', report);
    return report;
  };
  window.__VESPER_DIAGNOSTICS__ = {
    get entries() { return entries.slice(); },
    clear() { entries.length = 0; },
    report: diagnosticsReport
  };
}
