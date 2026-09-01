import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFor, inputMatchesGenerator, normalizeAnswer, validateSubmission } from '../server/oracle.mjs';

test('normaliza espaços e caixa sem aceitar conteúdo extra', () => {
  assert.equal(normalizeAnswer('  torre\n'), 'TORRE');
  assert.equal(normalizeAnswer('1   3  5'), '1 3 5');
});

test('valida contagem, posições e sequência', () => {
  assert.equal(answerFor({ generator: { type: 'thresholdCount', threshold: 7 } }, [2, 7, 9, 1]), '2');
  assert.equal(answerFor({ generator: { type: 'thresholdPositions', threshold: 8 } }, [8, 2, 10, 1]), '1 3');
  assert.equal(answerFor({ generator: { type: 'longestRun' } }, [1, 1, 2, 2, 2, 1]), '3');
});

test('valida matriz e mapas', () => {
  const matrix = { generator: { type: 'matrixMaxPosition', rows: 2, cols: 3 } };
  assert.equal(answerFor(matrix, [1, 2, 9, 3, 4, 5]), '1 3');
  assert.equal(answerFor({ generator: { type: 'frequencyWinner' } }, ['N', 'V', 'N', 'S', 'N']), 'N');
});

test('rejeita entrada incompatível com especificação', () => {
  const challenge = { generator: { type: 'matrixFrequencyWinner', rows: 2, cols: 2, symbols: ['N', 'S'] } };
  assert.equal(inputMatchesGenerator(challenge, ['N', 'S', 'N', 'S']), true);
  assert.equal(inputMatchesGenerator(challenge, ['N', 'X', 'N', 'S']), false);
  assert.equal(inputMatchesGenerator(challenge, ['N']), false);
  assert.equal(inputMatchesGenerator({ generator: { type: 'binaryDecision' } }, [9]), false);
  assert.equal(inputMatchesGenerator({ generator: { type: 'fixed', input: [1, 0] } }, [1, 1]), false);
});

test('compara submissão pelo oráculo', () => {
  const challenge = { generator: { type: 'maxValue', length: 3 } };
  assert.equal(validateSubmission(challenge, [4, 9, 2], '9'), true);
  assert.equal(validateSubmission(challenge, [4, 9, 2], '4'), false);
});
