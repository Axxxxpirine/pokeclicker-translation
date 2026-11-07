import test from 'node:test';
import assert from 'node:assert/strict';
import ko from 'knockout';
import { installBridge } from '../src/bridge.mjs';

test('native translation keeps interpolated values and uses original fallback and live toggle', () => {
  const enabled = ko.observable(true);
  const native = { get: (key, ns, options) => ko.pureComputed(() => options?.defaultValue ?? `original:${key}`) };
  const original = native.get;
  const page = { ko, App: { translation: native } };
  const bridge = installBridge(page, { en: { ui: { level: 'Level {{level}}' }, pokemon: { Bulbasaur: 'Bulbasaur' } }, fr: { ui: { level: 'Niveau {{level}}' }, pokemon: { Bulbasaur: 'Bulbizarre' } } }, enabled);
  const value = native.get('level', 'ui', { level: 12, defaultValue: 'Level 12' });
  assert.equal(value(), 'Niveau 12');
  assert.equal(native.get('Bulbasaur', 'pokemon')(), 'Bulbizarre');
  assert.equal(native.get('new.123', 'questlines', { defaultValue: 'New quest' })(), 'New quest');
  const subscription = value.subscribe(() => {});
  enabled(false);
  assert.equal(value(), 'Level 12');
  enabled(true);
  assert.equal(value(), 'Niveau 12');
  subscription.dispose();
  bridge.restore();
  assert.equal(native.get, original);
});

test('native translation resolves nested Pokémon names and leaves internal keys intact', () => {
  const enabled = ko.observable(true), key = 'Catch.123';
  const page = { ko, App: { translation: { get: () => ko.pureComputed(() => 'fallback') } } };
  installBridge(page, { en: { pokemon: { Bulbasaur: 'Bulbasaur' }, questlines: { [key]: 'Catch [[pokemon::Bulbasaur]]' } }, fr: { pokemon: { Bulbasaur: 'Bulbizarre' }, questlines: { [key]: 'Capture [[pokemon::Bulbasaur]]' } } }, enabled);
  assert.equal(page.App.translation.get(key, 'questlines')(), 'Capture Bulbizarre');
  assert.equal(key, 'Catch.123');
});

test('text bridge translates trusted NPC markup, retains native escaping and switches reactively', async () => {
  const { installTextBridge } = await import('../src/bridge.mjs');
  const enabled = ko.observable(true);
  const merger = {mergeText(text) {return text.replace('$playername$', '&lt;Joey&gt;');}};
  const original = merger.mergeText;
  const bridge = installTextBridge({TextMerger:merger}, text => text === 'Hello $playername$!' ? 'Bonjour $playername$ !' : undefined, enabled);
  const result = ko.pureComputed(() => merger.mergeText('Hello $playername$!'));
  const subscription = result.subscribe(() => {});
  assert.equal(result(), 'Bonjour &lt;Joey&gt; !');
  enabled(false);
  assert.equal(result(), 'Hello &lt;Joey&gt;!');
  assert.equal(merger.mergeText('Unknown'), 'Unknown');
  enabled(true);
  assert.equal(result(), 'Bonjour &lt;Joey&gt; !');
  subscription.dispose(); bridge.restore();
  assert.equal(merger.mergeText, original);
});
