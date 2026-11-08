import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { createTranslator } from '../src/catalog.mjs';
import { mountTranslation } from '../src/dom.mjs';
import { displayCatalog, readResources } from '../tools/resources.mjs';

const require = createRequire(import.meta.url);
const knockout = readFileSync(require.resolve('knockout'), 'utf8');
const settle = () => new Promise(resolve => setTimeout(resolve, 40));

test('recreated attack templates stay French before the next paint, including number updates and language toggles', async () => {
  const dom = new JSDOM(`<script type="text/html" id="pokemonAttackTemplate">
    <span>Pokémon Attack: <span data-bind="text: $root.attack().toLocaleString('en-US')"></span></span>
  </script><knockout data-bind="template: { name: 'pokemonAttackTemplate', data: enemy }"></knockout>`, {runScripts:'outside-only'});
  dom.window.eval(knockout);
  const ko = dom.window.ko, vm = {enemy:ko.observable({}), attack:ko.observable(1739038)};
  ko.applyBindings(vm, dom.window.document.body);
  const control = mountTranslation(dom.window.document, createTranslator({entries:[{en:'Pokémon Attack:',fr:'Attaque Pokémon :'}]}).translate);
  const line = () => dom.window.document.querySelector('knockout').textContent.replace(/\s+/g, ' ').trim();
  // Mutation observers run before rendering. A timer-delayed translation misses this deadline.
  const beforePaint = async () => { await Promise.resolve(); await Promise.resolve(); };
  try {
    assert.equal(line(), 'Attaque Pokémon : 1,739,038');
    for (const attack of [1739038, 1711111, 1888888, 999999, 1000000]) {
      vm.enemy({}); vm.attack(attack);
      await beforePaint();
      assert.equal(line(), `Attaque Pokémon : ${attack.toLocaleString('en-US')}`);
    }
    control.setEnabled(false);
    vm.enemy({});
    await beforePaint();
    assert.equal(line(), 'Pokémon Attack: 1,000,000');
    control.setEnabled(true);
    vm.enemy({});
    await beforePaint();
    assert.equal(line(), 'Attaque Pokémon : 1,000,000');
    await settle();
    const writes = control.stats().writes;
    await settle();
    assert.equal(control.stats().writes, writes, 'translations must not trigger a rewrite loop');
  } finally { control.stop(); dom.window.close(); }
});

test('real Knockout value bindings keep implicit option identities through translation, updates and toggles', async () => {
  const dom = new JSDOM('<select data-bind="value: chosen"><option>Buy</option><option>Settings</option></select>', {runScripts:'outside-only'});
  dom.window.eval(knockout);
  const ko = dom.window.ko, vm = {chosen:ko.observable('Buy')};
  ko.applyBindings(vm,dom.window.document.body);
  const translator = createTranslator({entries:[{en:'Buy',fr:'Acheter'},{en:'Settings',fr:'Réglages'}]});
  const control = mountTranslation(dom.window.document,translator.translate);
  try {
    const select = dom.window.document.querySelector('select');
    assert.equal(select.options[0].textContent,'Acheter');
    assert.equal(select.options[0].value,'Buy');
    select.selectedIndex = 1;
    select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
    assert.equal(vm.chosen(),'Settings');
    vm.chosen('Buy');
    assert.equal(select.selectedIndex,0);
    control.setEnabled(false);
    assert.equal(select.value,'Buy');
    assert.equal(select.options[0].hasAttribute('value'),false);
    control.setEnabled(true);
    select.options[1].textContent = 'Buy';
    await settle();
    assert.equal(select.options[1].value,'Buy');
    assert.equal(select.options[1].textContent,'Acheter');
    select.selectedIndex = 1;
    select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
    assert.equal(vm.chosen(),'Buy');
    const writes = control.stats().writes;
    await settle();
    assert.equal(control.stats().writes,writes,'observer must stop rewriting its own translations');
  } finally { control.stop(); dom.window.close(); }
});

test('current corpus leaves native French output stable, including named and duration templates', () => {
  const catalog = displayCatalog(readResources()), translator = createTranslator(catalog);
  for (const source of ['Subregional Travel (Kanto)', 'Requires level 5 in the Underground.', 'Hatch 100 eggs.', 'Complete 200 quests.', 'Have 8 different Berry types unlocked.']) {
    assert.ok(translator.translate(source), `overlapping templates must resolve consistently: ${source}`);
  }
  let checked = 0;
  for (const entry of catalog.entries) {
    const source = entry.en.replace(/{{\s*(\w+)\s*}}/g, (_, name) => Object.keys(catalog.domains[name] ?? {})[0] ?? (catalog.formats?.[name] === 'duration' ? '01h 02m' : '23'));
    const french = translator.translate(source);
    if (french === undefined) continue;
    const again = translator.translate(french);
    assert.ok(again === undefined || again === french, `${entry.id}: ${french} → ${again}`);
    checked++;
  }
  assert.ok(checked > 10000, `expected representative complete corpus, got ${checked}`);
});

test('dynamically opened Pokerus help translates both paragraphs and closes without replacing controls', async () => {
  const resources = readResources();
  const dom = new JSDOM('<div id="pokeballSelector"></div>');
  const { document } = dom.window;
  const control = mountTranslation(document, createTranslator(displayCatalog(resources)).translate);
  try {
    const tooltip = document.createElement('div');
    tooltip.className = 'introjs-tooltip';
    tooltip.innerHTML = '<div class="introjs-tooltiptext"></div><a class="introjs-button introjs-donebutton">Done</a>';
    tooltip.firstChild.innerHTML = resources.en['requirements-extra']['intro.pokerus'];
    const original = tooltip.firstChild.textContent, breaks = [...tooltip.querySelectorAll('br')];
    const done = tooltip.lastChild;
    done.addEventListener('click', () => tooltip.remove());
    document.body.append(tooltip);
    await settle();
    assert.match(tooltip.firstChild.textContent, /Vous pouvez désormais choisir/);
    assert.match(tooltip.firstChild.textContent, /Remarque :/);
    assert.doesNotMatch(tooltip.textContent, /You can now|Note:|Done/);
    assert.equal(done.textContent, 'Terminer');
    assert.deepEqual([...tooltip.querySelectorAll('br')], breaks);
    control.setEnabled(false);
    assert.equal(tooltip.firstChild.textContent, original);
    assert.equal(done.textContent, 'Done');
    control.setEnabled(true);
    assert.match(tooltip.firstChild.textContent, /Vous pouvez désormais choisir/);
    done.click();
    assert.equal(tooltip.isConnected, false);
  } finally { control.stop(); dom.window.close(); }
});
