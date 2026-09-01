import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'AGENTS.md',
  'content/AGENTS.md',
  'src/AGENTS.md',
  'assets/AGENTS.md',
  'docs/INDEX.md',
  'docs/CURRENT_STATE.md',
  'docs/feedback/REJECTED_PATTERNS.md',
  'docs/art/UI_REFERENCE.md',
  'docs/architecture/CONTENT_MODEL.md',
  'assets/manifest.json',
];
const errors = [];
for (const rel of required) if (!fs.existsSync(path.join(root, rel))) errors.push(`missing ${rel}`);

const skillsRoot = path.join(root, '.agents/skills');
if (!fs.existsSync(skillsRoot)) errors.push('missing .agents/skills');
else {
  for (const dir of fs.readdirSync(skillsRoot)) {
    const skillPath = path.join(skillsRoot, dir, 'SKILL.md');
    if (!fs.existsSync(skillPath)) { errors.push(`missing SKILL.md for ${dir}`); continue; }
    const text = fs.readFileSync(skillPath, 'utf8');
    if (!/^---\n[\s\S]*?\n---\n/.test(text)) errors.push(`${dir}: missing YAML frontmatter`);
    if (!/^name:\s*[a-z0-9-]+$/m.test(text)) errors.push(`${dir}: invalid/missing name`);
    if (!/^description:\s*.+$/m.test(text)) errors.push(`${dir}: missing description`);
  }
}

if (errors.length) {
  console.error('Agent-ready validation failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('Agent-ready structure OK.');
