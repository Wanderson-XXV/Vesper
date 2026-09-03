import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './server/api.mjs';
import { migrateDatabase } from './server/db.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const argValue = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : undefined;
};
const port = Number(argValue('port') || process.env.PORT || 5173);
const host = argValue('host') || process.env.HOST || '0.0.0.0';

if (process.env.DATABASE_URL) {
  try {
    await migrateDatabase();
    console.log('Schema PostgreSQL verificado.');
  } catch (error) {
    // Keep the Hub available while the API reports database unavailability.
    // The Compose entrypoint still runs the migration as a hard preflight.
    console.error(`Falha ao verificar o schema PostgreSQL: ${error.message}`);
  }
}

const api = createApi(root);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  try {
    if ((req.url || '').startsWith('/api/')) return api(req, res);
    const raw = decodeURIComponent((req.url || '/').split('?')[0]);
    const safe = normalize(raw).replace(/^(\.\.[/\\])+/, '');
    let path = join(root, safe === '/' ? 'index.html' : safe.replace(/^[/\\]/, ''));
    try {
      const s = await stat(path);
      if (s.isDirectory()) path = join(path, 'index.html');
    } catch {}
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 — arquivo não encontrado');
  }
});

server.listen(port, host, () => {
  console.log(`\nVesper rodando em http://localhost:${port}\n`);
  if (process.env.DATABASE_URL) console.log('API configurada para PostgreSQL. Login e banco são obrigatórios para jogar.');
  else console.log('Hub disponível; PostgreSQL ausente. API, autenticação e investigações estão bloqueadas.');
  console.log('Ctrl+C para encerrar.');
});
