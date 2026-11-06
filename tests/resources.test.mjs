import test from 'node:test';
import assert from 'node:assert/strict';
import { readResources } from '../tools/resources.mjs';
import { buildCatalog, createTranslator } from '../src/catalog.mjs';

test('all shipped translations preserve source interpolation variables', () => {
  assert.deepEqual(buildCatalog(readResources()).invalid, []);
});

test('same-namespace nesting may expand to variables without causing false validation errors', () => {
  const result = buildCatalog({ en: { logbook: { base: 'Found {{count}}', dupe: '[[base]] (duplicate)' } }, fr: { logbook: { base: '{{count}} trouvé', dupe: '{{count}} trouvé (doublon)' } } });
  assert.deepEqual(result.invalid, []);
  assert.equal(createTranslator(result).translate('Found 3 (duplicate)'), '3 trouvé (doublon)');
});
