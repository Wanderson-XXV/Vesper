import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ChallengeEngine } from '../src/engine/ChallengeEngine.js';
import { answerFor, inputMatchesGenerator, normalizeAnswer } from '../server/oracle.mjs';

const catalog = JSON.parse(await readFile(new URL('../content/catalog.json', import.meta.url), 'utf8'));

for (const caseEntry of catalog.cases) {
  test(`cliente e oráculo concordam em todos os rituais de ${caseEntry.id}`, async () => {
    const relative = caseEntry.contentPath.replace('./content/', '../content/');
    const challenges = JSON.parse(await readFile(new URL(`${relative}/challenges.json`, import.meta.url), 'utf8'));
    const state = {
      data: { challengeSeeds: {}, startedAt: 123456789 },
      save() {}
    };
    const engine = new ChallengeEngine(state);
    for (const challenge of challenges) {
      const generated = engine.generate(challenge);
      assert.equal(inputMatchesGenerator(challenge, generated.input), true, `${challenge.id}: entrada gerada deve ser aceita`);
      assert.equal(normalizeAnswer(answerFor(challenge, generated.input)), normalizeAnswer(generated.answer), `${challenge.id}: resposta divergente`);
    }
  });
}
