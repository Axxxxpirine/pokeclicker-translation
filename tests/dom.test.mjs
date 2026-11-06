import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { buildCatalog, createTranslator } from '../src/catalog.mjs';
import { mountTranslation } from '../src/dom.mjs';

const settle = () => new Promise(resolve => setTimeout(resolve, 35));
function setup(html) {
  const dom = new JSDOM(html, { url: 'https://www.pokeclicker.com' });
  const catalog = buildCatalog({ en: { ui: { a: 'Settings', b: 'Buy', c: 'Attempts remaining: {{count}}' } }, fr: { ui: { a: 'Réglages', b: 'Acheter', c: 'Tentatives restantes : {{count}}' } } });
  return { dom, control: mountTranslation(dom.window.document, createTranslator(catalog).translate) };
}

test('translates display text and tooltips without replacing elements, handlers or internal attributes', async () => {
  const { dom, control } = setup('<button id="Buy" title="Settings" data-bind="click: buy"><img src="Buy.png"> Buy</button><input value="Buy" placeholder="Settings">');
  const button = dom.window.document.querySelector('button');
  let clicks = 0;
  button.onclick = () => clicks++;
  await settle();
  assert.equal(button.textContent, ' Acheter');
  assert.equal(button.title, 'Réglages');
  assert.equal(button.id, 'Buy');
  assert.equal(button.getAttribute('data-bind'), 'click: buy');
  assert.ok(button.querySelector('img'));
  button.click();
  assert.equal(clicks, 1);
  assert.equal(dom.window.document.querySelector('input').value, 'Buy');
  assert.equal(dom.window.document.querySelector('input').placeholder, 'Réglages');
  control.stop(); dom.window.close();
});

test('tracks game updates and restores the latest English value when disabled', async () => {
  const { dom, control } = setup('<span>Attempts remaining: 1</span>');
  const span = dom.window.document.querySelector('span');
  await settle();
  assert.equal(span.textContent, 'Tentatives restantes : 1');
  span.firstChild.nodeValue = 'Attempts remaining: 2';
  await settle();
  assert.equal(span.textContent, 'Tentatives restantes : 2');
  control.setEnabled(false);
  assert.equal(span.textContent, 'Attempts remaining: 2');
  span.textContent = 'Attempts remaining: 3';
  await settle();
  control.setEnabled(true);
  await settle();
  assert.equal(span.textContent, 'Tentatives restantes : 3');
  control.stop(); dom.window.close();
});

test('observes inserted nodes but never changes user input, scripts or explicitly excluded content', async () => {
  const { dom, control } = setup('<textarea>Buy</textarea><div contenteditable="true">Buy</div><script>"Buy"</script><div data-pct-ignore>Buy</div>');
  const added = dom.window.document.createElement('p'); added.textContent = 'Buy';
  dom.window.document.body.append(added);
  await settle();
  assert.equal(added.textContent, 'Acheter');
  assert.equal(dom.window.document.querySelector('textarea').value, 'Buy');
  assert.equal(dom.window.document.querySelector('[contenteditable]').textContent, 'Buy');
  assert.equal(dom.window.document.querySelector('[data-pct-ignore]').textContent, 'Buy');
  assert.equal(dom.window.document.querySelector('script').textContent, '"Buy"');
  control.stop(); dom.window.close();
});

test('does not restore stale translations over an unprocessed game update', async () => {
  const { dom, control } = setup('<span>Buy</span>');
  await settle();
  const span = dom.window.document.querySelector('span');
  span.firstChild.nodeValue = 'Sold out';
  control.setEnabled(false);
  assert.equal(span.textContent, 'Sold out');
  control.stop(); dom.window.close();
});

test('preserves implicit option values and player-authored trainer names', async () => {
  const { dom, control } = setup('<select><option>Buy</option><option value="settings">Settings</option></select><span class="trainer-name">Buy</span>');
  await settle();
  const options = dom.window.document.querySelectorAll('option');
  assert.equal(options[0].value, 'Buy');
  assert.equal(options[0].textContent, 'Buy');
  assert.equal(options[1].value, 'settings');
  assert.equal(options[1].textContent, 'Réglages');
  assert.equal(dom.window.document.querySelector('.trainer-name').textContent, 'Buy');
  control.stop(); dom.window.close();
});
