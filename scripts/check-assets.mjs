import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const refs = [];

function walkValue(value, source) {
  if (typeof value === 'string') {
    if (value.startsWith('./assets/')) refs.push({ source, value });
    return;
  }
  if (Array.isArray(value)) return value.forEach((v) => walkValue(v, source));
  if (value && typeof value === 'object') for (const v of Object.values(value)) walkValue(v, source);
}

function walkJsonFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsonFiles(file);
    else if (entry.name.endsWith('.json')) walkValue(JSON.parse(fs.readFileSync(file, 'utf8')), path.relative(root, file));
  }
}
walkJsonFiles(contentDir);

const missing = [];
for (const ref of refs) {
  const target = path.resolve(root, ref.value.replace(/^\.\//, ''));
  if (!fs.existsSync(target)) missing.push(`${ref.source}: ${ref.value}`);
}

const manifestPath = path.join(root, 'assets/manifest.json');
if (!fs.existsSync(manifestPath)) missing.push('assets/manifest.json is missing');
else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const item of manifest.items || []) {
    if (item.path?.endsWith('/')) continue;
    const target = path.join(root, item.path || '');
    if (item.path && !fs.existsSync(target)) missing.push(`manifest ${item.id}: ${item.path}`);
  }
}

if (missing.length) {
  console.error('Asset check failed:\n- ' + missing.join('\n- '));
  process.exit(1);
}
console.log(`Asset check OK (${refs.length} content references).`);
