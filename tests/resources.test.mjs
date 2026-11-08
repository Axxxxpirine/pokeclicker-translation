import test from 'node:test';
import assert from 'node:assert/strict';
import { readResources, displayCatalog } from '../tools/resources.mjs';
import { buildCatalog, createTranslator, flatten } from '../src/catalog.mjs';
import ko from 'knockout';
import { installBridge } from '../src/bridge.mjs';
import { readFileSync } from 'node:fs';

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

test('released repeatable quest phrases render numbers and known names while unknown names remain unchanged', () => {
  const { translate } = createTranslator(displayCatalog(readResources()));
  const cases = [
    ['Use 378 Great Balls.', 'Utilise 378 Super Balls.'],
    ['Clear 158 Stages in the Battle Frontier.', 'Termine 158 étapes à la Zone de Combat.'],
    ['Defeat Elite Drake in Hoenn 11 times.', 'Bats Aragon du Conseil 4 (Hoenn) 11 fois.'],
    ['Capture or hatch 1,250 Fire-type Pokémon.', 'Capture ou fais éclore 1,250 Pokémon de type Feu.'],
    ['Harvest 151 Rawst Berries at the farm.', 'Récolte 151 baies Fraive à la ferme.'],
    ['Town Map (Hoenn)', 'Carte de Hoenn'],
  ];
  for (const [en, fr] of cases) assert.equal(translate(en), fr, en);
  assert.equal(translate('Use 8 Unknown Balls.'), undefined);
  assert.equal(translate('Defeat Invented boss in Hoenn 11 times.'), undefined);
});

test('dynamic UI translates names and duration values from finite game vocabularies', () => {
  const {translate} = createTranslator(displayCatalog(readResources()));
  assert.equal(translate('Fire gems'), 'Joyaux Feu');
  assert.match(translate('00:23:45 until ripe') ?? '', /00:23:45/);
  assert.doesNotMatch(translate('00:23:45 until ripe') ?? 'until ripe', /until ripe/);
  assert.equal(translate('Unknown-type gems'), undefined);
});

test('reviewed official names survive competing native and display catalog entries', () => {
  const review = JSON.parse(readFileSync(new URL('../upstream/nomenclature-review.json', import.meta.url)));
  const {translate} = createTranslator(displayCatalog(readResources()));
  for (const {en, fr} of review.corrections) assert.equal(translate(en) ?? en, fr, en);
  assert.equal(translate('Route 134'), 'Chenal 134');
  assert.equal(translate('Kanto Route 19'), 'Chenal 19 (Kanto)');
  assert.equal(translate('Unova Route 19'), 'Route 19 (Unys)');
  assert.equal(translate('Defeat the Deep Colosseum dungeon in Orre 11 times.'), 'Termine le donjon Colosseum de Targare (Rhode) 11 fois.');
});

test('native quest directions keep distinct French towns and dungeons after name review', () => {
  const resources = readResources(), enabled = ko.observable(true);
  const native = {get: key => ko.pureComputed(() => key)};
  installBridge({ko, App:{translation:native}}, resources, enabled);
  const cases = [
    ['Recover the Precious Egg!.step 1.0176758969', 'Littorella', 'Bonaugure'],
    ['Recover the Precious Egg!.step 22.0487619569', 'Féli-Cité', 'Littorella'],
    ['A Beautiful World.step 3.2004913040', 'Roche-sur-Gliffe', 'Relifac-le-Haut'],
    ['A Beautiful World.step 7.0372545423', 'Relifac-le-Haut', 'Roche-sur-Gliffe'],
    ['A Beautiful World.step 18.1080266809', 'Caverne Gelée', 'Grotte Coda'],
    ['A Beautiful World.step 19.1505915052', 'Flusselles', 'Auffrac-les-Congères'],
    ['A Beautiful World.step 17.0136284020', 'La Frescale', 'Frimapic'],
    ['Hollow Truth and Ideals.step 1.1956916657', 'Ondes-sur-Mer', 'Pavonnay'],
    ['Hollow Truth and Ideals.step 10.1218186736', 'Entrelasque', 'Papeloa'],
  ];
  for (const [key,correct,incorrect] of cases) {
    const value = native.get(key, 'questlines')();
    assert.ok(value.includes(correct), `${key}: ${value}`);
    assert.ok(!value.includes(incorrect), key);
  }
  assert.equal(native.get('Victory Road.displayName.1200551762', 'questlines')(), 'La voie du Maître');
  enabled(false);
  assert.equal(native.get(cases[0][0], 'questlines')(), cases[0][0]);
});

test('logbook translates embedded locations and items without mutating saved event options', () => {
  const resources=readResources(), catalog=displayCatalog(resources), enabled=ko.observable(true);
  const native={get:()=>ko.pureComputed(()=>'original log entry')};
  installBridge({ko,App:{translation:native}},resources,enabled,{translate:createTranslator(catalog).translate,domains:catalog.domains});
  const options={location:'Mt. Chimney Crater',pokemon:'Groudon (Synthetic)'};
  const value=native.get('encounterWild','logbook',options);
  assert.match(value(),/Cratère du Mont Chimnée/);
  assert.match(native.get('enemyDrop','logbook',{pokemon:'Zigzagoon',item:'Revive'})(),/Rappel/);
  assert.match(native.get('enemyDrop','logbook',{pokemon:'Zigzagoon',item:'Upgrade'})(),/Améliorator/);
  assert.equal(options.location,'Mt. Chimney Crater');
  assert.match(native.get('encounterWild','logbook',{location:'Unknown private place',pokemon:'Pikachu'})(),/Unknown private place/);
  enabled(false);assert.equal(value(),'original log entry');
});
