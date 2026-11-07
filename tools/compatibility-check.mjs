import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { root } from './resources.mjs';
import { serveRelease } from './game-server.mjs';

const scriptsPath = resolve(process.env.POKECLICKER_SCRIPTS ?? resolve(root, '../../Pokeclicker-Scripts-NEW'));
const names = ['enhancedautoclicker', 'autonavigation', 'autoquestrunner', 'enhancedautohatchery', 'enhancedautomine', 'simpleautofarmer'];
const scripts = names.map(name => ({ name, source: readFileSync(resolve(scriptsPath, name + '.user.js'), 'utf8') }));
const server = await serveRelease();
const browser = await chromium.launch({ headless: true });
try {
  let untranslatedBaseline;
  for (const order of ['untranslated', 'translation-first', 'translation-last']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
    await context.route('https://**/locales/**', route => route.abort());
    await context.addInitScript(() => localStorage.setItem('pokeclicker-translation.enabled', 'false'));
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(server.origin, { waitUntil: 'load' });
    const translation = () => page.addScriptTag({ path: resolve(root, 'dist/pokeclicker-translation.user.js') });
    if (order === 'translation-first') await translation();
    for (const { source } of scripts) await page.addScriptTag({ content: `(function(){ const unsafeWindow = window;\n${source}\n})();` });
    if (order === 'translation-last') await translation();
    await page.locator('#saveSelector .new-import-buttons label').first().click();
    await page.waitForFunction(() => window.AutoQuestRunner && window.PokeAutomationAdapters?.adapters.navigation);
    assert.deepEqual(await page.evaluate(() => Object.keys(PokeAutomationAdapters.adapters).sort()), ['clicker', 'farm', 'hatchery', 'mine', 'navigation']);
    const fixture = await page.evaluate(() => {
      // Disposable localhost fixture only. No personal save is read or copied.
      Information.hide();
      StartSequenceRunner.starterPicked = GameConstants.Starter.Grass;
      player.regionStarters[GameConstants.Region.kanto](GameConstants.Starter.Grass);
      $('.modal').modal('hide');
      for (const id of [1, 4, 7]) App.game.party.gainPokemonById(id, false, true);
      App.game.party.caughtPokemon.forEach(p => { p.level = 100; });
      App.game.gameState = GameConstants.GameState.fighting;
      MapHelper.moveToRoute(1, GameConstants.Region.kanto);
      const first = new DefeatPokemonsQuest(2, 10, 1, GameConstants.Region.kanto);
      const next = new DefeatPokemonsQuest(100000, 10, 1, GameConstants.Region.kanto);
      App.game.quests.questList([first, next]);
      window.translationCompatibilityQuest = first;
      return { pointsBefore: App.game.wallet.currencies[GameConstants.Currency.questPoint]() };
    });
    const snapshot = () => page.evaluate(() => ({
      quests: AutoQuestRunner.readQuestSnapshot().quests.map(q => ({ type: q.type, amount: q.amount, target: q.target, known: q.known })),
      controls: [...document.querySelectorAll('#auto-navigation input,#auto-navigation select,#auto-quest-runner-panel input')].map(e => [e.id, e.value, e.checked]),
      settingValue: Settings.getSetting('showFarmModule').value,
    }));
    const baseline = await snapshot();
    assert.ok(baseline.controls.length > 0, 'expected automation controls must exist');
    assert.ok(baseline.controls.some(([id]) => id === 'navigation-mode'), 'navigation controls must exist');
    assert.ok(baseline.controls.some(([id]) => id === 'auto-quest-refresh-enabled'), 'quest controls must exist');
    if (order === 'untranslated') {
      untranslatedBaseline = baseline;
      await context.close();
      continue;
    }
    assert.deepEqual(baseline, untranslatedBaseline, 'installing translation must preserve the untranslated baseline');
    assert.equal(await page.evaluate(() => PokeClickerTranslation.enabled), false);
    for (const enabled of [true, false, true]) {
      await page.evaluate(enabled => PokeClickerTranslation.setEnabled(enabled), enabled);
      // Allow mutation observers and Knockout subscriptions to update before comparing.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.deepEqual(await snapshot(), baseline, `quest inputs, controls and native setting value must survive language=${enabled}`);
    }
    const settings = await page.evaluate(() => ({ label: Settings.getSetting('showFarmModule').displayName, value: Settings.getSetting('showFarmModule').value }));
    assert.equal(settings.label, 'Afficher la ferme sur l’écran principal');
    await page.evaluate(() => document.querySelector('#auto-quest-runner').click());
    await page.waitForFunction(() => translationCompatibilityQuest.claimed(), null, { timeout: 30000 });
    const result = await page.evaluate(() => {
      AutoQuestRunner.stop('Translation compatibility test finished');
      return {
        claimed: translationCompatibilityQuest.claimed(),
        progress: translationCompatibilityQuest.focus() - translationCompatibilityQuest.initial(),
        points: App.game.wallet.currencies[GameConstants.Currency.questPoint](),
        internalRoute: player.route,
        runnerStopped: !AutoQuestRunner.active,
        translation: PokeClickerTranslation.stats(),
      };
    });
    assert.equal(result.claimed, true);
    assert.ok(result.progress >= 2);
    assert.ok(result.points > fixture.pointsBefore);
    assert.equal(result.runnerStopped, true);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ order, scripts: scripts.map(({ name, source }) => ({ name, version: source.match(/@version\s+(\S+)/)?.[1] })), settings, result, errors }, null, 2));
    await context.close();
  }
} finally { await browser.close(); await server.close(); }
