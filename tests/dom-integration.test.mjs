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
