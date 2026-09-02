import test from 'node:test';
import assert from 'node:assert/strict';
import { ICON_NAMES, getIconNames, hasIcon, icon } from '../src/ui/icons.js';

test('registro inicial expõe os nomes de ícone esperados', () => {
  const expected = [
    'user-round', 'log-out', 'eye', 'eye-off', 'save', 'rotate-ccw',
    'backpack', 'book-open', 'settings-2', 'chevron-right', 'arrow-left',
    'x', 'shield-check', 'play'
  ];

  assert.deepEqual(ICON_NAMES, expected);
  assert.deepEqual(getIconNames(), expected);
  assert.equal(hasIcon('shield-check'), true);
  assert.equal(hasIcon('missing-icon'), false);
});

test('nome inexistente falha explicitamente', () => {
  assert.throws(() => icon('missing-icon'), {
    name: 'RangeError',
    message: 'Unknown Vesper icon: missing-icon'
  });
});

test('markup é local, determinístico e acessível quando rotulado', () => {
  const first = icon('save', { label: 'Salvar investigação', size: 18 });
  const second = icon('save', { label: 'Salvar investigação', size: 18 });

  assert.equal(first, second);
  assert.match(first, /<svg[^>]+data-icon="save"/);
  assert.match(first, /role="img"/);
  assert.match(first, /aria-label="Salvar investigação"/);
  assert.match(first, /stroke="currentColor"/);
  assert.doesNotMatch(first, /(?:unpkg|jsdelivr|cdn\.)/i);

  const explicitLabel = icon('x', { 'aria-label': 'Fechar' });
  assert.match(explicitLabel, /role="img"/);
  assert.match(explicitLabel, /aria-label="Fechar"/);
});
