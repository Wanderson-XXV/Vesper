import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content/catalog.json'), 'utf8'));
const forbidden = [
  { re: /\bcelular\b/i, why: 'technology outside current setting' },
  { re: /\bsmartphone\b/i, why: 'technology outside current setting' },
  { re: /\bwhats ?app\b/i, why: 'technology outside current setting' },
  { re: /mensagem instant[aâ]nea/i, why: 'technology outside current setting' },
  { re: /\bé f[aá]cil de prop[oó]sito\b/i, why: 'pedagogical metacommentary breaks diegesis' },
  { re: /\b(?:este|esse) (?:é|e) o tutorial\b/i, why: 'tutorial metacommentary breaks diegesis' },
  { re: /\bseed\b/i, why: 'engine metadata should not appear in narrative' }
];
const findings = [];
const inspect = (text, where) => {
  if (typeof text !== 'string') return;
  for (const rule of forbidden) if (rule.re.test(text)) findings.push(`${where}: ${rule.why} -> ${JSON.stringify(text)}`);
};

for (const caseEntry of catalog.cases) {
  const caseDir = path.resolve(root, caseEntry.contentPath.replace(/^\.\//, ''));
  const scenes = JSON.parse(fs.readFileSync(path.join(caseDir, 'scenes.json'), 'utf8'));
  const characters = JSON.parse(fs.readFileSync(path.join(caseDir, 'characters.json'), 'utf8'));
  for (const [sceneId, scene] of Object.entries(scenes)) for (let i = 0; i < (scene.events || []).length; i++) {
    const event = scene.events[i];
    if (event.type === 'say') inspect(event.text, `${caseEntry.id}/scene ${sceneId} event ${i}`);
    if (event.type === 'choice') for (const option of event.options || []) inspect(option.label, `${caseEntry.id}/choice ${event.id}`);
  }
  for (const character of characters) {
    inspect(character.description, `${caseEntry.id}/character ${character.id}`);
    for (const topic of character.topics || []) inspect(topic.label, `${caseEntry.id}/character ${character.id} topic ${topic.id}`);
  }
}

if (findings.length) {
  console.error(`Narrative lint failed:\n- ${findings.join('\n- ')}`);
  process.exit(1);
}
console.log(`Narrative lint OK (${catalog.cases.length} casos).`);
