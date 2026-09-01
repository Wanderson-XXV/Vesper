import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const manifestPath = path.join(root, 'assets/manifest.json');
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

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : null;
const intentionallyLocal = new Set(
  (manifest?.items || [])
    .filter((item) => item.licenseStatus === 'unverified-do-not-publish')
    .map((item) => item.path),
);
const missing = [];
const intentionallyLocalMissing = [];
for (const ref of refs) {
  const relativePath = ref.value.replace(/^\.\//, '');
  const target = path.resolve(root, relativePath);
  if (fs.existsSync(target)) continue;
  if (intentionallyLocal.has(relativePath)) intentionallyLocalMissing.push(`${ref.source}: ${ref.value}`);
  else missing.push(`${ref.source}: ${ref.value}`);
}

if (!fs.existsSync(manifestPath)) missing.push('assets/manifest.json is missing');
else {
  for (const item of manifest.items || []) {
    if (item.path?.endsWith('/')) continue;
    const target = path.join(root, item.path || '');
    if (item.path && fs.existsSync(target)) continue;
    if (item.path && intentionallyLocal.has(item.path)) intentionallyLocalMissing.push(`manifest ${item.id}: ${item.path}`);
    else if (item.path) missing.push(`manifest ${item.id}: ${item.path}`);
  }
}

if (missing.length) {
  console.error('Asset check failed:\n- ' + missing.join('\n- '));
  process.exit(1);
}
if (intentionallyLocalMissing.length) {
  console.warn('Local-only assets omitted from this checkout:\n- ' + intentionallyLocalMissing.join('\n- '));
}
console.log(`Asset check OK (${refs.length} content references).`);
