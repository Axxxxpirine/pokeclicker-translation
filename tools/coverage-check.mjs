import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { root, readResources, displayCatalog } from './resources.mjs';
import { createTranslator } from '../src/catalog.mjs';
import { serveRelease } from './game-server.mjs';

// Always inspect the pinned release in an isolated temporary browser profile.
// Build current translation modules in memory so this check never uses stale dist output.
const startedAt = performance.now();
const catalog = displayCatalog(readResources());
assert.deepEqual(catalog.invalid, []);
const translator = createTranslator(catalog);
const examples = ['Bulbasaur or 1', 'Shiny Bulbasaur is not unlocked yet'];
for (const source of examples) {
  const french = translator.translate(source);
  assert.ok(french && french !== source && french.includes('Bulbizarre'), `named Pokémon template: ${source}`);
  assert.ok(translator.translate(french) === undefined || translator.translate(french) === french, `French must be stable: ${french}`);
}
assert.ok(translator.translate('01h 02m left')?.includes('01h 02m'));
assert.equal(translator.translate('Joey left'), undefined);
const bundle = await build({
  stdin: { contents: "import {mountTranslation} from './src/dom.mjs';import {createTranslator} from './src/catalog.mjs';window.coverageMount=c=>mountTranslation(document,createTranslator(c).translate);", resolveDir: root },
  bundle: true, write: false, format: 'iife',
});
const server = await serveRelease(), browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://**/locales/**', route => route.abort());
  await page.goto(server.origin);
  await page.locator('#saveSelector .new-import-buttons label').first().click();
  await page.waitForFunction(() => Boolean(App.game));
  const before = await page.evaluate(() => ({region:player.region, starter:player.regionStarters[0](), gymMessages:Object.values(GymList).map(g=>g.defeatMessage), options:[...document.querySelectorAll('select option')].map(option=>option.value)}));
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  const mountMs = await page.evaluate(c => { const start=performance.now(); window.coverageControl = coverageMount(c); return Math.round(performance.now()-start); },catalog);
  const panels = [
    ['#FAQModal','Actuellement, les régions de Kanto à'],
    ['#help','Creuse deux couches à l’emplacement sélectionné.'],
    ['#settings-display','Pleine largeur (5 colonnes)'],
    ['#settings-game','Désactiver la sauvegarde automatique :'],
    ['#moonPhaseModal','Lune gibbeuse croissante'],
    ['#eventsModal','Le Pokémon Chenapan sème ses farces à travers le monde.'],
    ['#challengeModeModal','Les EV sont gagnés 10 fois plus lentement'],
    ['#lockedFarmHands','Débloque 8 variétés de baies.'],
    ['#receiveBadgeModal','Je t’ai sous-estimé, et j’ai perdu.'],
    ['#badgeCaseModal','Foudre'],
  ];
  for (const [selector, expected] of panels) assert.ok((await page.locator(selector).textContent()).includes(expected), `${selector} must contain ${expected}`);
  assert.deepEqual(await page.evaluate(() => ({region:player.region,starter:player.regionStarters[0](),gymMessages:Object.values(GymList).map(g=>g.defeatMessage),options:[...document.querySelectorAll('select option')].map(option=>option.value)})),before);
  // The actual released game's Knockout handles player choices after labels change.
  await page.evaluate(() => {
    const fixture = document.createElement('section'); fixture.id='coverage-fixture';
    fixture.innerHTML='<select data-bind="value: chosen"><option>Buy</option><option>Settings</option></select><span class="native-french">Paramètres</span>';
    document.body.append(fixture);
    window.coverageModel={chosen:ko.observable('Buy')};
    ko.applyBindings(coverageModel,fixture);
  });
  await page.waitForFunction(() => document.querySelector('#coverage-fixture option').textContent === 'Acheter');
  await page.locator('#coverage-fixture select').selectOption('Settings');
  assert.equal(await page.evaluate(() => coverageModel.chosen()),'Settings');
  await page.evaluate(() => coverageModel.chosen('Buy'));
  assert.equal(await page.locator('#coverage-fixture select').inputValue(),'Buy');
  assert.equal(await page.locator('.native-french').textContent(),'Paramètres');
  await page.waitForTimeout(100);
  const firstWrites = await page.evaluate(() => coverageControl.stats().writes);
  await page.waitForTimeout(250);
  const settledWrites = await page.evaluate(() => coverageControl.stats().writes);
  assert.equal(settledWrites,firstWrites,'translation observer must settle when rendered English is unchanged');
  await page.evaluate(() => coverageControl.setEnabled(false));
  assert.ok((await page.locator('#moonPhaseModal').textContent()).includes('Waxing Gibbous Moon'));
  assert.equal(await page.locator('#coverage-fixture option').first().getAttribute('value'),null);
  assert.equal(await page.locator('#coverage-fixture select').inputValue(),'Buy');
  await page.evaluate(() => coverageControl.setEnabled(true));
  assert.equal(await page.locator('#coverage-fixture select').inputValue(),'Buy');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({gameVersion:server.provenance.game.version,panels:panels.length,namedTemplates:true,durations:true,knockoutOptions:true,stableWrites:settledWrites,mountMs,totalMs:Math.round(performance.now()-startedAt),toggleRestoresEnglish:true,errors},null,2));
} finally { await browser.close(); await server.close(); }
