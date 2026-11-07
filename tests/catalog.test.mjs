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

test('named placeholders accept only declared terms and keep numbers and repeated values intact', () => {
  const catalog = buildCatalog({ en: { quests: { a: 'Use {{amount}} {{questBall}}.', b: 'Compare {{questBall}} with {{questBall}}.' } }, fr: { quests: { a: 'Utilise {{amount}} {{questBall}}.', b: 'Compare {{questBall}} et {{questBall}}.' } } });
  catalog.domains = { questBall: { 'Great Balls': 'Super Balls', 'Poké Balls': 'Poké Balls', 'Ball (X+)': 'Ball spéciale' } };
  const { translate } = createTranslator(catalog);
  assert.equal(translate('Use 1,378 Great Balls.'), 'Utilise 1,378 Super Balls.');
  assert.equal(translate('Use 2 Ball (X+).'), 'Utilise 2 Ball spéciale.');
  assert.equal(translate('Compare Great Balls with Great Balls.'), 'Compare Super Balls et Super Balls.');
  for (const text of ['Use 8 Unknown Balls.', 'Use <b>8</b> Great Balls.', 'Use 8 Ball XXX.', 'Compare Great Balls with Poké Balls.']) assert.equal(translate(text), undefined, text);
});

test('short numeric UI labels translate only complete numeric values', () => {
  const {translate} = createTranslator(buildCatalog({en:{ui:{a:'Level {{n}}',b:'{{n}}/hour',c:'Ball ({{n}})'}},fr:{ui:{a:'Niveau {{n}}',b:'{{n}}/heure',c:'Ball ({{n}})'}}}));
  assert.equal(translate('Level 23'),'Niveau 23');
  assert.equal(translate('1,200/hour'),'1,200/heure');
  assert.equal(translate('Level Joey'),undefined);
});

test('trusted rich catalogue resolves full NPC lines before native player-name escaping', () => {
  const catalog = buildCatalog({en:{pokemon:{Bulbasaur:'Bulbasaur'},npcs:{a:'Hello $playername$, meet <i>[[pokemon::Bulbasaur]]</i>.'}},fr:{pokemon:{Bulbasaur:'Bulbizarre'},npcs:{a:'Bonjour $playername$, voici <i>[[pokemon::Bulbasaur]]</i>.'}}}, {rich:true});
  assert.equal(createTranslator(catalog).translate('Hello $playername$, meet <i>Bulbasaur</i>.'),'Bonjour $playername$, voici <i>Bulbizarre</i>.');
});

test('duration placeholders accept game clocks and compact units without accepting names', () => {
  const c = buildCatalog({en:{ui:{a:'{{time}} left'}},fr:{ui:{a:'{{time}} restantes'}}});
  c.formats = {time:'duration'};
  const {translate} = createTranslator(c);
  assert.equal(translate('01:23:45 left'),'01:23:45 restantes');
  assert.equal(translate('01d 02h 03m left'),'01j 02h 03m restantes');
  assert.equal(translate('Joey left'),undefined);
});

test('context resolves homonyms without changing their meaning elsewhere', async () => {
  const {JSDOM} = await import('jsdom');
  const doc = new JSDOM('<div id="undergroundDisplay"><button>Fire</button></div><span>Fire</span>').window.document;
  const c = {entries:[],contexts:[{selector:'#undergroundDisplay button',en:'Fire',fr:'Renvoyer'},{selector:'*',en:'Fire',fr:'Feu'}]};
  const {translate} = createTranslator(c);
  assert.equal(translate('Fire',doc.querySelector('button')),'Renvoyer');
  assert.equal(translate('Fire',doc.querySelector('span')),'Feu');
  assert.equal(translate('Fire'),undefined);
  doc.defaultView.close();
});

test('form name fragments resolve inside full names without colliding with UI labels', () => {
  const c = buildCatalog({en:{pokemon:{alt:{sweet:'Berry'},Alcremie:'Alcremie [[alt.sweet]]'},ui:{berry:'Berry'}},fr:{pokemon:{alt:{sweet:'Baie en Sucre'},Alcremie:'Charmilly [[alt.sweet]]'},ui:{berry:'Baie'}}}, {omitStandalonePokemonForms:true});
  const {translate} = createTranslator(c);
  assert.equal(translate('Berry'),'Baie');
  assert.equal(translate('Alcremie Berry'),'Charmilly Baie en Sucre');
});

test('multi-name templates backtrack over vocabulary boundaries and preserve repeated names', () => {
  const c = {entries:[{en:'Compare {{left}} and {{right}} {{n}} times.',fr:'Compare {{left}} à {{right}} {{n}} fois.'}],domains:{left:{'Old':'Ancien','Old and New':'Ancien et Nouveau'},right:{'New and Town':'Nouveau et Ville','Town':'Ville'}}};
  const {translate} = createTranslator(c);
  assert.equal(translate('Compare Old and New and Town 12 times.'),'Compare Ancien et Nouveau à Ville 12 fois.');
  assert.equal(translate('Compare Unknown and Town 12 times.'),undefined);
});

test('compound requirements translate only when every condition is recognized', () => {
  const c={entries:[],hints:[{en:'You must own {{n}} or more {{item}}',fr:'Possède au moins {{n}} {{item}}'},{en:'{{pokemon}} needs to be owned',fr:'Possède {{pokemon}}'}],domains:{item:{'Great Ball':'Super Ball'},pokemon:{Bulbasaur:'Bulbizarre'}}};
  const {translate}=createTranslator(c);
  assert.equal(translate('You must own 10 or more Great Ball and Bulbasaur needs to be owned.'),'Possède au moins 10 Super Ball et Possède Bulbizarre.');
  assert.equal(translate('Bulbasaur needs to be owned or You must own 20 or more Great Ball.'),'Possède Bulbizarre ou Possède au moins 20 Super Ball.');
  assert.equal(translate('Bulbasaur needs to be owned and a personal message.'),undefined);
});

test('ambiguous item names use the source icon, including linked tooltips', async () => {
  const {JSDOM}=await import('jsdom');
  const dom=new JSDOM('<button class="shopItem" aria-describedby="tooltip123"><img src="assets/Ultraball.png"><span>Ultra Ball</span></button><button class="shopItem"><img src="assets/Beastball.png"><span>Ultra Ball</span></button><div id="tooltip123" class="tooltip"><b>Ultra Ball</b></div>');
  const {translate}=createTranslator({entries:[],contexts:[{en:'Ultra Ball',fr:'Hyper Ball',selector:'.shopItem',contains:'img[src$="/Ultraball.png"]'}]});
  const nodes=dom.window.document.querySelectorAll('span');
  assert.equal(translate('Ultra Ball',nodes[0]),'Hyper Ball');
  assert.equal(translate('Ultra Ball',nodes[1]),undefined);
  assert.equal(translate('Ultra Ball',dom.window.document.querySelector('.tooltip b')),'Hyper Ball');
  dom.window.close();
});

test('legacy namespace references resolve alongside double-colon references', () => {
  const r={en:{logbook:{type:{NEW:'New catch'}},settings:{new:'[[logbook:type.NEW]]'}},fr:{logbook:{type:{NEW:'Nouvelle capture'}},settings:{new:'Nouvelle capture'}}};
  const c=buildCatalog(r);
  assert.deepEqual(c.skipped,[]);
  assert.equal(createTranslator(c).translate('New catch'),'Nouvelle capture');
});

test('compound requirements preserve decimal numbers while removing sentence punctuation', () => {
  const {translate}=createTranslator({entries:[],hints:[{en:'Gain {{n}} coins',fr:'Gagne {{n}} pièces'},{en:'Win {{n}} battles',fr:'Gagne {{n}} combats'}]});
  assert.equal(translate('Gain 1.5 coins and Win 2 battles.'),'Gagne 1.5 pièces et Gagne 2 combats.');
  assert.equal(translate('Gain 1.234,5 coins and Win 2 battles.'),'Gagne 1.234,5 pièces et Gagne 2 combats.');
});
