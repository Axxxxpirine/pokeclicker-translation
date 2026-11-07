import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { createTranslator } from '../src/catalog.mjs';
import { displayCatalog, readResources } from './resources.mjs';
import { serveRelease } from './game-server.mjs';

// Only punctuation, nonverbal cries, the redeemable code, and image-only lines
// may remain unchanged. An arbitrary HTML wrapper never exempts readable text.
const nonverbal = new Set(['Grrrssssss', 'Cracrown crow. Roooooowwwn rown crown.']);
const unchangedBattleNames = new Set([
  'Arceus', 'Butler', 'Chobin', 'Deoxys', 'Eusine', 'Giovanni', 'Guzma', 'Kahili',
  'Karami', 'Karbuck', 'Kareign', 'Karpella', 'Karpen', 'Karpress', 'Karson',
  'Kecleon', 'Koylee', 'Kyurem', 'Latias', 'Latios', 'Merilyn', 'Mirages',
  'Necrozma', 'Rayquaza', 'Red', 'Regigigas', 'Riot', 'Rival Blue', 'Rival Silver',
  'Ryuki', 'Skyhopper', 'Suicune', 'Tykarp', 'Willie', 'Xerneas', 'Yveltal',
  'Zero', 'Zinzolin', 'Zook',
]);
function isInert(source) {
  if (!source.trim() || /^[\s.…!?-]+$/u.test(source) || nonverbal.has(source)) return true;
  if (source === '<code class="text-nowrap">EON-TICKET</code>') return true;
  const imageOnly = source.replace(/<\/?br\s*\/?\s*>/gi, '')
    .replace(/<img\b[^>]*\bsrc=["'](?:\.\/)?assets\/images\/[^"']+["'][^>]*>/gi, '').trim();
  return imageOnly === '';
}
const uniqueStrings = values => [...new Set(values.flat(Infinity).filter(value => typeof value === 'string'))];
const tokens = text => [...text.matchAll(/\$\w+\$|\{ROUTE_NAME\}/g)].map(match => match[0]).sort();
const imageSources = text => [...text.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match => match[1]).sort();

const server = await serveRelease();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  // A fresh disposable profile against pinned, read-only git objects. Never
  // connect to the player's tab, save files, or the public game's storage.
  const context = await browser.newContext({ locale: 'en-US' });
  await context.route('https://**/locales/**', route => route.abort());
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(server.origin);
  await page.locator('#saveSelector .new-import-buttons label').first().click();
  await page.waitForFunction(() => Boolean(App.game));
  const corpus = await page.evaluate(() => {
    const npcs = Object.values(TownList).flatMap(town => town.npcs ?? []);
    const gyms = Object.values(GymList);
    const battles = Object.values(TemporaryBattleList);
    const enigma = [];
    const directions = ['north', 'west', 'east', 'south'];
    const originalRequirements = EnigmaMutation.getReqs;
    try {
      // Exercise the release's own getters with distinct and repeated berries,
      // every subset of known directions, and each partial-hint direction.
      for (const berries of [
        ['Figy', 'Wiki', 'Mago', 'Aguav'],
        ['Spelon', 'Pamtre', 'Watmel', 'Durin'],
        ['Oran', 'Oran', 'Oran', 'Oran'],
      ]) {
        EnigmaMutation.getReqs = () => berries.map(name => BerryType[name]);
        const mutation = new EnigmaMutation(0);
        for (let mask = 1; mask < 16; mask++) {
          mutation.hintsSeen.forEach((seen, index) => seen(Boolean(mask & (1 << index))));
          enigma.push({
            source: mutation.hint,
            berries: berries.filter((_, index) => mask & (1 << index)),
            directions: directions.filter((_, index) => mask & (1 << index)),
            incomplete: mask !== 15,
          });
        }
        for (let index = 0; index < 4; index++) {
          mutation.lastIndex(index);
          enigma.push({ source: mutation.partialHint, berries: [berries[index]], directions: [directions[index]], incomplete: false });
        }
      }
    } finally {
      EnigmaMutation.getReqs = originalRequirements;
    }
    return {
      counts: { npcs: npcs.length, gyms: gyms.length, battles: battles.length },
      npc: npcs.flatMap(npc => [npc.dialog, npc.listingDialogue, npc.pokedexCompleteText, npc.nextRegionUnlockedText]),
      gym: gyms.map(gym => gym.defeatMessage),
      battle: battles.map(battle => battle.defeatMessage),
      battleName: battles.map(battle => battle.getDisplayName()),
      mutation: App.game.farming.mutations.map(mutation => mutation.hint),
      roamer: Object.values(RoamingPokemonList.roamerGroups).flatMap(groups => groups.map(group => `There haven't been any reports of roaming Pokémon around ${group.name} lately.`)),
      enigma,
    };
  });

  const catalog = displayCatalog(readResources());
  const translator = createTranslator(catalog);
  const failures = [];
  const counts = {};
  for (const section of ['npc', 'gym', 'battle', 'mutation', 'roamer', 'battleName']) {
    const sources = uniqueStrings(corpus[section]);
    counts[section] = { distinct: sources.length, translated: 0, unchanged: 0 };
    for (const source of sources) {
      const inert = isInert(source) || (section === 'battleName' && unchangedBattleNames.has(source));
      const target = translator.translate(source);
      if (target === undefined || target === source) {
        if (inert) counts[section].unchanged++;
        else failures.push({ section, source, reason: 'missing translation' });
      } else {
        counts[section].translated++;
        if (JSON.stringify(tokens(source)) !== JSON.stringify(tokens(target))) failures.push({ section, source, reason: 'player or route token changed' });
        if (JSON.stringify(imageSources(source)) !== JSON.stringify(imageSources(target))) failures.push({ section, source, reason: 'image resource changed' });
      }
      if (section === 'battleName' && !Object.hasOwn(catalog.domains.battleName, source)) failures.push({ section, source, reason: 'missing from battleName domain' });
    }
  }

  const directionLabels = { north: 'au nord', west: 'à l’ouest', east: 'à l’est', south: 'au sud' };
  for (const sample of corpus.enigma) {
    const clauses = sample.berries.map((berry, index) => `une baie ${catalog.domains.questBerry[berry]} ${directionLabels[sample.directions[index]]}`);
    const list = clauses.length > 1 ? `${clauses.slice(0, -1).join(', ')} et ${clauses.at(-1)}` : clauses[0];
    const expected = `Une baie mystérieuse nécessite ${list}.${sample.incomplete ? ' Cependant, il manque encore quelque chose...' : ''}`;
    const actual = translator.translate(sample.source);
    if (actual !== expected) failures.push({ section: 'enigma', source: sample.source, expected, actual });
  }
  assert.equal(translator.translate("There's a mysterious berry that requires a NotARealBerry Berry to the north."), undefined, 'Enigma must reject names outside its closed berry vocabulary');
  assert.deepEqual(pageErrors, [], 'released game must load without page errors');
  assert.deepEqual(failures, [], 'every readable release dialogue must be translated without changing interpolation tokens or images');
  console.log(JSON.stringify({ release: server.provenance.game.version, ...corpus.counts, coverage: counts, enigmaCases: corpus.enigma.length, pageErrors }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
