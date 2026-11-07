import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { JSDOM } from 'jsdom';
import { createTranslator } from '../src/catalog.mjs';
import { mountTranslation } from '../src/dom.mjs';

const settle = () => new Promise(resolve=>setTimeout(resolve,40));

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
