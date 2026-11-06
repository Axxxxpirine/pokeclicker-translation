import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { root } from './resources.mjs';

// Serve the pinned, unmodified release directly from git. Never opens the user's profile/save.
const game = resolve(process.env.POKECLICKER_SOURCE ?? resolve(root, '../pokeclicker'));
const provenance = JSON.parse(readFileSync(resolve(root, 'upstream/provenance.json'), 'utf8'));
const cache = new Map();
const types = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/') path = '/index.html';
  if (path.includes('..') || !/^\/[\w\s./()%+&'!,:=~@\-]+$/u.test(path)) { res.writeHead(400).end(); return; }
  try {
    if (!cache.has(path)) cache.set(path, execFileSync('git', ['-C', game, 'show', `${provenance.game.commit}:docs${path}`], { maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }));
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }); res.end(cache.get(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  // Use the pinned bundled translations, even if the upstream CDN changes during this test.
  await context.route('https://**/locales/**', route => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
  await page.addScriptTag({ path: resolve(root, 'dist/pokeclicker-translation.user.js') });
  await page.waitForFunction(() => window.PokeClickerTranslation?.stats().nativeBridge, { timeout: 30000 });
  await page.waitForTimeout(750);
  const before = await page.evaluate(() => ({ stats: PokeClickerTranslation.stats(), button: document.querySelector('#pokeclicker-translation-toggle').textContent, body: document.body.innerText.slice(0, 900) }));
  assert.equal(before.button, 'FR ✓');
  assert.ok(before.stats.textNodes > 100, 'released game UI should actually translate');
  await page.getByText('Nouvelle sauvegarde', { exact: true }).click();
  await page.waitForFunction(() => Boolean(App.game));
  await page.waitForTimeout(750);
  const intro = await page.locator('#startSequenceModal .modal-body').innerText();
  assert.match(intro, /Bienvenue/);
  assert.doesNotMatch(intro, /Welcome to/);
  await page.locator('#startSequenceModal button[data-dismiss="modal"]').click();
  await page.locator('#starterSelection input').first().click();
  await page.waitForTimeout(250);
  const tutorial = await page.evaluate(() => App.game.quests.getQuestLine('Tutorial Quests').quests()[0].description);
  assert.match(tutorial, /Bats le Pokémon/);
  const result = await page.evaluate(() => {
    const pokemon = App.translation.get('Bulbasaur', 'pokemon')();
    const quest = App.translation.get('Tutorial Quests.displayName.0834273581', 'questlines')();
    const keys = Object.keys(TownList);
    const originalTown = TownList['Pallet Town'];
    PokeClickerTranslation.setEnabled(false);
    const disabled = PokeClickerTranslation.stats();
    const english = App.translation.get('Bulbasaur', 'pokemon')();
    PokeClickerTranslation.setEnabled(true);
    return { pokemon, quest, english, disabled, townPreserved: TownList['Pallet Town'] === originalTown && JSON.stringify(keys) === JSON.stringify(Object.keys(TownList)) };
  });
  assert.equal(result.pokemon, 'Bulbizarre');
  assert.equal(result.quest, 'Quêtes du tutoriel');
  assert.equal(result.english, 'Bulbasaur');
  assert.equal(result.disabled.textNodes, 0);
  assert.equal(result.townPreserved, true);
  const npcOriginal = await page.evaluate(() => {
    const npc = TownList['Pallet Town'].npcs.find(npc => npc.name === 'Mom');
    NPCController.selectedNPC(npc);
    $('#npc-modal').modal('show');
    return { name: npc.name, dialog: [...npc.dialog] };
  });
  await page.waitForFunction(() => document.querySelector('#npc-modal .npc-name').textContent === 'Maman');
  const npcText = await page.locator('#npc-modal .npc-dialog').innerText();
  assert.doesNotMatch(npcText, /So you're really leaving/);
  const npcAfter = await page.evaluate(() => {
    const npc = NPCController.selectedNPC();
    return { name: npc.name, dialog: [...npc.dialog] };
  });
  assert.deepEqual(npcAfter, npcOriginal, 'rendering a translated dialogue must not mutate NPC data');
  mkdirSync(resolve(root, '.verification'), { recursive: true });
  await page.screenshot({ path: resolve(root, '.verification/release-preview.png'), fullPage: false });
  assert.deepEqual(errors, []);
  await page.evaluate(() => PokeClickerTranslation.setEnabled(false));
  await page.reload({ waitUntil: 'load' });
  await page.addScriptTag({ path: resolve(root, 'dist/pokeclicker-translation.user.js') });
  const reloaded = await page.evaluate(() => PokeClickerTranslation.stats());
  assert.equal(reloaded.enabled, false);
  assert.equal(reloaded.textNodes, 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ release: provenance.game.version, ...before, checks: { ...result, tutorial, npcText, disabledAfterReload: !reloaded.enabled }, pageErrors: errors }, null, 2));
  await context.close();
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
