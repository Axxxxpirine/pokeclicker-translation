import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFragments } from './fragments.mjs';
import { buildCatalog, flatten } from '../src/catalog.mjs';
import i18next from 'i18next';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function readResources() {
  return Object.fromEntries(['en', 'fr'].map(lang => [lang, Object.fromEntries(readdirSync(resolve(root, `locales/${lang}`)).filter(file => file.endsWith('.json')).sort().map(file => {
    const base = JSON.parse(readFileSync(resolve(root, `locales/${lang}/${file}`), 'utf8'));
    const patchPath = resolve(root, `overrides/${lang}/${file}`);
    const patch = existsSync(patchPath) ? JSON.parse(readFileSync(patchPath, 'utf8')) : {};
    // Overrides use flat i18next keys, including dotted paths, to preserve imported files.
    return [file.slice(0, -5), { ...base, ...patch }];
  }))]));
}

export function displayCatalog(resources) {
  const fragments = extractFragments(resources);
  const catalog = buildCatalog({ en: { ...resources.en, displayFragments: fragments.en }, fr: { ...resources.fr, displayFragments: fragments.fr } }, { rich: true, omitStandalonePokemonForms: true });
  const { domains } = JSON.parse(readFileSync(resolve(root, 'upstream/display-terms.json'), 'utf8'));
  const french = JSON.parse(readFileSync(resolve(root, 'display/terms-fr.json'), 'utf8'));
  catalog.domains = Object.fromEntries(Object.entries(domains).map(([name, terms]) => [name,
    Object.fromEntries(terms.map(term => [term, french[name]?.[term] ?? term])),
  ]));
  const engine = i18next.createInstance();
  engine.init({ lng: 'fr', fallbackLng: 'en', resources, initImmediate: false, nsSeparator: '::', interpolation: { nestingPrefix: '[[', nestingSuffix: ']]', escapeValue: false } });
  const pairs = (ns, filter = key => !key.startsWith('alt.')) => Object.fromEntries(Object.keys(flatten(resources.en[ns])).filter(filter).map(key => [engine.t(key, {ns, lng:'en'}), engine.t(key, {ns, lng:'fr'})]));
  const pokemon = {...pairs('pokemon'), ...Object.fromEntries(Object.keys(flatten(resources.en.pokemon)).filter(key => !key.startsWith('alt.')).map(key => [key,engine.t(key,{ns:'pokemon',lng:'fr'})]))};
  const names = resources.en.names ? pairs('names') : {};
  Object.assign(catalog.domains, {
    pokemonName: pokemon, pokemon, starter: pokemon,
    itemName: names, locationName: names, town: names,
    keyItem: {...names, Town_map:'Carte', Teachy_tv:'TV ABC', Coin_case:'Boîte Jetons', Dungeon_ticket:'Ticket Donjon', Wailmer_pail:'Seau Wailmer', Old_rod:'Canne', Good_rod:'Super Canne', Super_rod:'Méga Canne', Explorer_kit:'Explorakit', Mystery_egg:'Œuf Mystère'},
    ballId: {Pokeball:'Poké Balls', Greatball:'Super Balls', Ultraball:'Hyper Balls', Masterball:'Master Balls', Fastball:'Speed Balls', Quickball:'Rapide Balls', Timerball:'Chrono Balls', Duskball:'Sombre Balls', Luxuryball:'Luxe Balls', Diveball:'Scuba Balls', Lureball:'Appât Balls', Nestball:'Faiblo Balls', Repeatball:'Bis Balls', Beastball:'Ultra Balls', Cherishball:'Mémoire Balls'},
    questLine: pairs('questlines', key => key.includes('displayName')),
    battleName: {...names, ...pairs('dialogue-extra', key => key.startsWith('battleName.'))},
    badgeName: pairs('gyms', key => key.startsWith('badge.')),
    eventName: pairs('interface', key => key.startsWith('runtime.')),
    toolName: {Hammer:'Marteau', Chisel:'Burin', Bomb:'Bombe', Survey:'Sondage', Pickaxe:'Pioche'},
    region: catalog.domains.questRegion, subregion: catalog.domains.questRegion,
    type: catalog.domains.questType, berry: catalog.domains.questBerry,
    vitamin: {Protein:'Protéine', Calcium:'Calcium', Carbos:'Carbone'},
    color: {Red:'Rouge', Blue:'Bleu', Yellow:'Jaune', Green:'Vert', Pink:'Rose', Purple:'Violet', Brown:'Marron', White:'Blanc', Black:'Noir', Gray:'Gris', Grey:'Gris'},
    tier: {Common:'commun', Rare:'rare', Epic:'épique', Legendary:'légendaire', Mythic:'mythique'},
    state: {Enabled:'Activé', Disabled:'Désactivé', enabled:'activé', disabled:'désactivé', ON:'ACTIVÉ', OFF:'DÉSACTIVÉ'},
    hotkey: Object.fromEntries(['Shift','Ctrl','Alt','Control','Command','Shift + Click','Shift + click','Ctrl + Click'].map(key => [key, key.replace(/Click|click/g,'clic')])),
    shortcut: {'Ctrl + S':'Ctrl + S', 'Ctrl+S':'Ctrl+S', '⌘+S':'⌘+S', '⌘ + S':'⌘ + S'},
  });
  for (const direction of ['North','West','East','South']) catalog.domains[`questBerry${direction}`] = catalog.domains.questBerry;
  const requirementTerms = resolve(root, 'display/requirement-terms-fr.json');
  if (existsSync(requirementTerms)) {
    for (const [name, values] of Object.entries(JSON.parse(readFileSync(requirementTerms,'utf8')))) Object.assign(catalog.domains[name] ??= {}, values);
  }
  // Native translations may already supply a French name inside an English UI sentence.
  for (const domain of Object.values(catalog.domains)) {
    for (const value of Object.values(domain)) if (!Object.hasOwn(domain, value)) domain[value] = value;
    for (const [key,value] of Object.entries(domain)) if (key.includes('.') && !Object.hasOwn(domain,key.replaceAll('.',''))) domain[key.replaceAll('.','')] = value;
  }
  catalog.hints = catalog.entries.filter(entry => entry.id.startsWith('requirements') || /^(?:Requires |You must |Your local part |Questline |Progress further |Have |Hatch |Catch |Complete |Obtain |Come back|Find it elsewhere|Try again|The weather |The moon )| (?:needs?|must) (?:to )?be /.test(entry.en)).map(entry => ({...entry,en:entry.en.replace(/(?<!\d)\.|\.(?!\d)/g,''),fr:entry.fr.replace(/\.$/,'')}));
  catalog.formats = Object.fromEntries(['time', 'growthDuration', 'workCycle', 'nextPayment', 'duration'].map(key => [key, 'duration']));
  // These short labels have genuinely different meanings in different panels.
  catalog.contexts = [
    {selector:'.shopItem', contains:'img[src$="/Ultraball.png"],img[src$="/Ultraball.svg"]', en:'Ultra Ball', fr:'Hyper Ball'},
    {selector:'img[src$="/Ultraball.svg"],img[src$="/Ultraball.png"]', contains:'img', en:'Ultra Ball', fr:'Hyper Ball'},
    {selector:'#undergroundDisplay button', en:'Fire', fr:'Renvoyer'},
    {selector:'#safariModal', en:'Rock', fr:'Caillou'},
    {selector:'.npc-name', en:'Explorer', fr:'Explorateur'},
    {selector:'#FAQModal', en:'Start', fr:'Début'},
    {selector:'#weatherAppModal', en:'Time', fr:'Heure'},
    {selector:'#farmModal', en:'All', fr:'Toutes'},
    {selector:'#farmModal', en:'None', fr:'Aucune'},
    ...Object.entries({Bug:'Coléoptère', Fairy:'Nymphe', Psychic:'Psychisme'}).map(([en,fr]) => ({selector:'#badgeCaseModal .badgeEntry',en,fr})),
    ...Object.entries({Fire:'Feu', Rock:'Roche', Bug:'Insecte', Fairy:'Fée', Psychic:'Psy', Berry:'Baie', Diamonds:'Diamants', Start:'Commencer', Time:'Temps', All:'Tous', None:'Aucun', 'Victory Road':'Route Victoire'}).map(([en,fr]) => ({selector:'*',en,fr})),
  ];
  return catalog;
}
