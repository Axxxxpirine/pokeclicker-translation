import test from 'node:test';
import assert from 'node:assert/strict';
import { readResources } from '../tools/resources.mjs';
import { buildCatalog, createTranslator, flatten } from '../src/catalog.mjs';
import ko from 'knockout';
import { installBridge } from '../src/bridge.mjs';

test('all shipped translations preserve source interpolation variables', () => {
  assert.deepEqual(buildCatalog(readResources()).invalid, []);
});

test('same-namespace nesting may expand to variables without causing false validation errors', () => {
  const result = buildCatalog({ en: { logbook: { base: 'Found {{count}}', dupe: '[[base]] (duplicate)' } }, fr: { logbook: { base: '{{count}} trouvé', dupe: '{{count}} trouvé (doublon)' } } });
  assert.deepEqual(result.invalid, []);
  assert.equal(createTranslator(result).translate('Found 3 (duplicate)'), '3 trouvé (doublon)');
});

test('every settings label is available in French and desktop notifications resolve their shared label', () => {
  const resources = readResources();
  const native = { get: () => ko.pureComputed(() => 'MISSING TRANSLATION') };
  installBridge({ ko, App: { translation: native } }, resources, ko.observable(true));
  for (const key of Object.keys(flatten(resources.en.settings))) {
    const value = native.get(key, 'settings')();
    assert.notEqual(value, 'MISSING TRANSLATION', key);
    assert.ok(value.trim(), key);
    assert.doesNotMatch(value, /\[\[|\]\]/, key);
    if (key.endsWith('.desktop')) assert.equal(value, native.get(key.slice(0, -8), 'settings')(), key);
  }
  assert.equal(native.get('showFarmModule', 'settings')(), 'Afficher la ferme sur l’écran principal');
  assert.equal(native.get('sound.muted', 'settings')(), 'Couper tous les sons');
});
