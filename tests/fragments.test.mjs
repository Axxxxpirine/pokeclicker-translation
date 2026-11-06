import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFragments } from '../tools/fragments.mjs';

test('pairs corresponding HTML text nodes while preserving links and line-break boundaries', () => {
  const result = extractFragments({ en: { ui: { intro: 'Welcome!<br>Visit <a href="https://example.com">our site</a>.' } }, fr: { ui: { intro: 'Bienvenue !<br>Visite <a href="https://example.com">notre site</a>.' } } });
  assert.deepEqual(Object.values(result.en), ['Welcome!', 'Visit ', 'our site']);
  assert.deepEqual(Object.values(result.fr), ['Bienvenue !', 'Visite ', 'notre site']);
});

test('does not align text across changed markup or moved interpolation variables', () => {
  const result = extractFragments({ en: { ui: { a: 'Welcome <a>here</a>', b: 'Level <b>{{level}}</b>' } }, fr: { ui: { a: '<a>Bienvenue</a> ici', b: 'Niveau {{level}} <b>atteint</b>' } } });
  assert.deepEqual(result, { en: {}, fr: {} });
});
