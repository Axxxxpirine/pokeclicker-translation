import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { root } from './resources.mjs';
import { serveRelease } from './game-server.mjs';

const server = await serveRelease();
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('https://**/locales/**', route => route.abort());
  const page = await context.newPage(), errors = [];
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await page.goto(server.origin);
  await page.locator('#saveSelector .new-import-buttons label').first().click();
  await page.waitForFunction(() => Boolean(App.game));
  const original = await page.evaluate(() => {
    // Synthetic quests in a disposable localhost save, never the personal game.
    Information.hide(); StartSequenceRunner.starterPicked = GameConstants.Starter.Grass; player.regionStarters[GameConstants.Region.kanto](GameConstants.Starter.Grass); $('.modal').modal('hide');
    const quests = [
      new DefeatPokemonsQuest(17, 10, 1, GameConstants.Region.kanto),
      new CapturePokemonsQuest(17, 10), new CapturePokemonTypesQuest(17, 10, PokemonType.Fire),
      new ClearBattleFrontierQuest(158, 10), new GainFarmPointsQuest(17, 10),
      new GainMoneyQuest(1250, 10), new GainTokensQuest(17, 10), new GainGemsQuest(17, 10, PokemonType.Fire),
      new HatchEggsQuest(17, 10), new MineLayersQuest(17, 10), new MineItemsQuest(17, 10),
      new CatchShiniesQuest(17, 10), new CatchShadowsQuest(17, 10),
      new DefeatGymQuest(11, 10, 'Elite Drake'), new DefeatDungeonQuest(17, 10, 'Viridian Forest'),
      new UsePokeballQuest(378, 10, GameConstants.Pokeball.Greatball),
      new UseOakItemQuest(17, 10, OakItemType.Magic_Ball), new HarvestBerriesQuest(151, 10, BerryType.Rawst),
    ];
    App.game.quests.questList(quests);
    quests.forEach((q, index) => { q.index = index; q.begin(); });
    const panel = document.querySelector('#questDisplayContainer');
    panel.style.display = 'block'; panel.style.width = '235px';
    return quests.map(q => ({ description: q.description, serialized: q.toJSON() }));
  });
  const labels = page.locator('#dailyQuestDisplayBody [data-bind="text: $data.description"]');
  await page.addScriptTag({ path: resolve(root, 'dist/pokeclicker-translation.user.js') });
  await page.waitForFunction(() => document.querySelector('#dailyQuestDisplayBody').textContent.includes('Utilise 378 Super Balls.'));
  const translated = await labels.allTextContents();
  assert.equal(translated.length, 18);
  translated.forEach((text, i) => assert.notEqual(text, original[i].description, original[i].description));
  assert.equal(translated[2], 'Capture ou fais éclore 17 Pokémon de type Feu.');
  assert.equal(translated[13], 'Bats Drake du Conseil 4 (Hoenn) 11 fois.');
  const snapshot = () => page.evaluate(() => App.game.quests.questList().map(q => ({ description: q.description, serialized: q.toJSON() })));
  assert.deepEqual(await snapshot(), original, 'translated rendering must not change quest descriptions or serialized data');
  const layout = await page.locator('#dailyQuestDisplayBody .col-2 button').first().evaluate(el => { const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); ctx.font = getComputedStyle(el).font; return { naturalWidth: ctx.measureText(el.textContent.trim()).width, text: el.textContent.trim(), height: el.clientHeight, lineHeight: parseFloat(getComputedStyle(el).lineHeight), width: el.clientWidth, content: el.scrollWidth, row: el.parentElement.parentElement.getBoundingClientRect().width, extent: el.getBoundingClientRect().right - el.parentElement.parentElement.getBoundingClientRect().left }; });
  assert.equal(layout.text, 'Abandonner');
  assert.ok(layout.height <= layout.lineHeight + 4, 'quest action label must fit on one line');
  assert.ok(layout.width >= Math.max(layout.content, layout.naturalWidth), `quest button must fit its French label: ${JSON.stringify(layout)}`);
  assert.ok(layout.extent <= layout.row + 1, 'quest actions must stay within the panel');
  await page.evaluate(() => PokeClickerTranslation.setEnabled(false));
  await page.waitForFunction(() => document.querySelector('#dailyQuestDisplayBody').textContent.includes('Use 378 Great Balls.'));
  assert.deepEqual(await labels.allTextContents(), original.map(q => q.description));
  assert.deepEqual(await snapshot(), original);
  await page.evaluate(() => PokeClickerTranslation.setEnabled(true));
  await page.waitForFunction(() => document.querySelector('#dailyQuestDisplayBody').textContent.includes('Utilise 378 Super Balls.'));
  // Click the real native quit handler. Only the selected synthetic quest should stop.
  await page.evaluate(() => $('.modal').modal('hide'));
  await page.locator('#dailyQuestDisplayBody .col-2 button').first().click();
  await page.waitForFunction(() => !App.game.quests.questList()[0].inProgress());
  assert.equal(await labels.count(), 17);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ questClasses: 18, descriptions: translated, layout, nativeQuitWorks: true, errors }, null, 2));
} finally { await browser.close(); await server.close(); }
