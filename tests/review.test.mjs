import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { JSDOM } from 'jsdom';
import { createTranslator } from '../src/catalog.mjs';
import { mountTranslation } from '../src/dom.mjs';
import { readResources, displayCatalog } from '../tools/resources.mjs';

const settle = () => new Promise(resolve=>setTimeout(resolve,40));

test('dynamic completion counts distinguish dungeons from mines as counters update', async () => {
  const dom=new JSDOM('<div id="dungeonsShortcutModal"><span>2 clears</span></div><div id="mineModal"><span>2 clears</span></div>');
  const control=mountTranslation(dom.window.document,createTranslator(displayCatalog(readResources())).translate);
  try {
    const dungeon=dom.window.document.querySelector('#dungeonsShortcutModal span');
    assert.equal(dungeon.textContent,'Passages terminés : 2');
    assert.equal(dom.window.document.querySelector('#mineModal span').textContent,'2 mines vidées');
    dungeon.textContent='3 clears';await settle();
    assert.equal(dungeon.textContent,'Passages terminés : 3');
    control.setEnabled(false);assert.equal(dungeon.textContent,'3 clears');
  } finally {control.stop();dom.window.close();}
});

test('item homonyms use their item meaning without changing action or trainer labels', () => {
  const dom = new JSDOM('<div id="showItemsModal"><div id="evoStones"><span>Upgrade</span></div><div id="itemBag"><span>Black Belt</span></div></div><button id="upgrade-action">Upgrade</button><span class="npc-name">Black Belt</span>');
  const control = mountTranslation(dom.window.document, createTranslator(displayCatalog(readResources())).translate);
  try {
    assert.equal(dom.window.document.querySelector('#evoStones span').textContent, 'Améliorator');
    assert.equal(dom.window.document.querySelector('#itemBag span').textContent, 'Ceinture Noire');
    assert.equal(dom.window.document.querySelector('#upgrade-action').textContent, 'Améliorer');
    assert.equal(dom.window.document.querySelector('.npc-name').textContent, 'Karatéka');
    control.setEnabled(false);
    assert.equal(dom.window.document.querySelector('#evoStones span').textContent, 'Upgrade');
  } finally {control.stop();dom.window.close();}
});

test('berry properties and image alternatives render in French without changing asset paths', () => {
  const dom = new JSDOM('<div id="berryDexModal"><code>Purple</code><code>Super Hard</code></div><img src="assets/Berry_Shovel.png" alt="Berry Shovel"><img alt="selected berry image"><img alt="selected mulch image"><div id="auto-mine-status">Mining</div>');
  const control=mountTranslation(dom.window.document,createTranslator(displayCatalog(readResources())).translate);
  try {
    assert.deepEqual([...dom.window.document.querySelectorAll('code')].map(e=>e.textContent), ['Violet','Extrêmement ferme']);
    const img=dom.window.document.querySelector('img');
    assert.equal(img.alt,'Pelle à baies');
    assert.deepEqual([...dom.window.document.querySelectorAll('img')].slice(1).map(e=>e.alt),['Baie sélectionnée','Engrais sélectionné']);
    assert.equal(dom.window.document.querySelector('#auto-mine-status').textContent,'Fouille en cours');
    assert.equal(img.getAttribute('src'),'assets/Berry_Shovel.png');
    control.setEnabled(false);
    assert.equal(img.alt,'Berry Shovel');
    assert.equal(dom.window.document.querySelector('code').textContent,'Purple');
  } finally {control.stop();dom.window.close();}
});

test('split text nodes in an implicit option keep the complete original value', async () => {
  const dom = new JSDOM('<select><option>Buy<!-- split --> Settings</option><option>Other</option></select>');
  const translate = createTranslator({entries:[{en:'Buy',fr:'Acheter'},{en:'Settings',fr:'Réglages'}]}).translate;
  const option = dom.window.document.querySelector('option');
  const control = mountTranslation(dom.window.document,translate);
  try {
    assert.equal(option.textContent,'Acheter Réglages');
    assert.equal(option.value,'Buy Settings');
    option.lastChild.nodeValue=' Buy';
    await settle();
    assert.equal(option.textContent,'Acheter Acheter');
    assert.equal(option.value,'Buy Buy','native update must use original text for other translated siblings');
    control.setEnabled(false);
    assert.equal(option.value,'Buy Buy');
    assert.equal(option.hasAttribute('value'),false);
  } finally { control.stop(); dom.window.close(); }
});

test('ambiguous numeric partitions have bounded work for external text under the length limit', async () => {
  const moduleUrl = new URL('../src/catalog.mjs',import.meta.url).href;
  const source = `import assert from 'node:assert/strict';import {createTranslator} from ${JSON.stringify(moduleUrl)};const t=createTranslator({entries:[{en:'Award {{a}} {{b}} {{c}}!',fr:'Gain {{a}} {{b}} {{c}} !'}]});assert.equal(t.translate('Award '+'1 '.repeat(2000)+'X!'),undefined);console.log('bounded');`;
  const {stdout} = await promisify(execFile)(process.execPath,['--input-type=module','-e',source],{timeout:3000});
  assert.equal(stdout.trim(),'bounded');
});

test('implicit option values retain non-ASCII whitespace exactly as the browser does', () => {
  const dom=new JSDOM('<select><option>&nbsp;Buy<!-- split --> Settings&nbsp;</option></select>');
  const option=dom.window.document.querySelector('option'), original=option.value;
  const translate=createTranslator({entries:[{en:'Buy',fr:'Acheter'},{en:'Settings',fr:'Réglages'}]}).translate;
  const control=mountTranslation(dom.window.document,translate);
  try { assert.equal(option.value,original); }
  finally {control.stop();dom.window.close();}
});

test('finite vocabularies preserve literal punctuation, Unicode and repeated-name equality', () => {
  const translate = createTranslator({
    entries:[{en:'Compare {{pokemon}} with {{pokemon}}.',fr:'Compare {{pokemon}} et {{pokemon}}.'}],
    domains:{pokemon:{'Mime Jr.':'Mime Jr.','Mr. Mime':'M. Mime','Type: Null':'Type:0','Flabébé (Red)':'Flabébé (Rouge)','A+B?':'Nom spécial'}},
  }).translate;
  assert.equal(translate('Compare A+B? with A+B?.'),'Compare Nom spécial et Nom spécial.');
  assert.equal(translate('Compare Flabébé (Red) with Flabébé (Red).'),'Compare Flabébé (Rouge) et Flabébé (Rouge).');
  assert.equal(translate('Compare Mr. Mime with Mime Jr..'),undefined);
  assert.equal(translate('Compare ABBB with ABBB.'),undefined);
});

test('contextual labels cannot leak through the cache into another panel', () => {
  const dom = new JSDOM('<div id="mine"><b>Fire</b></div><div id="types"><b>Fire</b></div>');
  const translate=createTranslator({entries:[],contexts:[{en:'Fire',fr:'Renvoyer',selector:'#mine'},{en:'Fire',fr:'Feu',selector:'#types'}]}).translate;
  assert.equal(translate('Fire'),undefined);
  assert.equal(translate('Fire',dom.window.document.querySelector('#mine b')),'Renvoyer');
  assert.equal(translate('Fire',dom.window.document.querySelector('#types b')),'Feu');
  assert.equal(translate('Fire'),undefined);
  dom.window.close();
});

test('explicit native option values survive updates and disabling before observer flush', async () => {
  const dom = new JSDOM('<select><option>Buy</option></select>');
  const control=mountTranslation(dom.window.document,value=>value==='Buy'?'Acheter':undefined);
  try {
    const option=dom.window.document.querySelector('option');
    option.setAttribute('value','native-token');
    option.textContent='Native new label';
    control.setEnabled(false);
    assert.equal(option.value,'native-token');
    assert.equal(option.textContent,'Native new label');
    await settle();
    assert.equal(option.value,'native-token');
  } finally {control.stop();dom.window.close();}
});

 test('hatchery display values translate decimal and grouped native statistics', () => {
  const translate=createTranslator(displayCatalog(readResources())).translate;
  assert.equal(translate('Efficiency: 1.15'),'Efficacité : 1.15');
  assert.equal(translate('Egg Steps: 1,000'),'Pas d’éclosion : 1,000');
  assert.equal(translate('Attack Bonus: 42'),'Bonus d’attaque : 42');
  assert.equal(translate('Hatches: 0'),'Éclosions : 0');
});
