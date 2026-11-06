import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog, createTranslator } from '../src/catalog.mjs';

test('matches whole labels while keeping outer whitespace and unknown text', () => {
  const { translate } = createTranslator(buildCatalog({ en: { ui: { menu: 'Settings' } }, fr: { ui: { menu: 'Réglages' } } }));
  assert.equal(translate('  Settings\n'), '  Réglages\n');
  assert.equal(translate('Settings changed'), undefined);
  assert.equal(translate('Nothing here'), undefined);
});

test('leaves conflicting translations unresolved instead of picking one', () => {
  const catalog = buildCatalog({ en: { ui: { a: 'Open', b: 'Open' } }, fr: { ui: { a: 'Ouvrir', b: 'Ouvert' } } });
  assert.equal(createTranslator(catalog).translate('Open'), undefined);
  assert.equal(catalog.ambiguous.length, 1);
});

test('preserves changing numeric values, including grouped and decimal numbers', () => {
  const catalog = buildCatalog({ en: { ui: { spins: 'Spins remaining: {{spins}} / {{max}}' } }, fr: { ui: { spins: 'Tours restants : {{spins}} / {{max}}' } } });
  const { translate } = createTranslator(catalog);
  assert.equal(translate('Spins remaining: 1,250 / 2,000'), 'Tours restants : 1,250 / 2,000');
  assert.equal(translate('Spins remaining: 2 / 3'), 'Tours restants : 2 / 3');
  assert.equal(translate('Spins remaining: <script> / 3'), undefined);
});

test('resolves Pokémon references with the correct language without changing keys', () => {
  const resources = { en: { pokemon: { Bulbasaur: 'Bulbasaur' }, npcs: { line: 'Catch [[pokemon::Bulbasaur]]!' } }, fr: { pokemon: { Bulbasaur: 'Bulbizarre' }, npcs: { line: 'Capture [[pokemon::Bulbasaur]] !' } } };
  assert.equal(createTranslator(buildCatalog(resources)).translate('Catch Bulbasaur!'), 'Capture Bulbizarre !');
  assert.ok(resources.fr.pokemon.Bulbasaur);
});

test('rejects missing variables, rich HTML and unresolved references', () => {
  const catalog = buildCatalog({ en: { ui: { a: 'Level {{level}}', b: '<b>Buy</b>', c: 'Catch [[pokemon::Missing]]', d: 'Blank' } }, fr: { ui: { a: 'Niveau {{wrong}}', b: '<b>Acheter</b>', c: 'Capture [[pokemon::Missing]]', d: '' } } });
  const { translate } = createTranslator(catalog);
  assert.equal(translate('Level 12'), undefined);
  assert.equal(translate('<b>Buy</b>'), undefined);
  assert.equal(translate('Catch Missing'), undefined);
  assert.equal(translate('Blank'), undefined);
  assert.equal(catalog.invalid.length, 1);
});

test('never translates an already-French target into a different meaning', () => {
  const catalog = buildCatalog({ en: { ui: { explore: 'Explore' }, npcs: { explorer: 'Explorer' } }, fr: { ui: { explore: 'Explorer' }, npcs: { explorer: 'Explorateur' } } });
  const { translate } = createTranslator(catalog);
  assert.equal(translate('Explore'), 'Explorer');
  assert.equal(translate('Explorer'), undefined);
});
