import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('public install and update endpoints share the userscript identity and version', () => {
  const source=readFileSync(new URL('../dist/pokeclicker-translation.user.js',import.meta.url),'utf8');
  const header=source.slice(0,source.indexOf('// ==/UserScript==')+18);
  const value=key=>header.match(new RegExp(`^// @${key}\\s+(.+)$`,'m'))?.[1];
  assert.equal(value('downloadURL'),'https://raw.githubusercontent.com/Axxxxpirine/pokeclicker-translation/main/dist/pokeclicker-translation.user.js');
  assert.equal(value('updateURL'),'https://raw.githubusercontent.com/Axxxxpirine/pokeclicker-translation/main/dist/pokeclicker-translation.meta.js');
  assert.equal(value('name'),'PokéClicker Translation — Français');
  assert.equal(value('namespace'),'https://github.com/Axxxxpirine/pokeclicker-translation');
  assert.equal(value('version'),JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version);
  assert.equal(value('grant'),'none');
  const meta=readFileSync(new URL('../dist/pokeclicker-translation.meta.js',import.meta.url),'utf8').trim();
  assert.equal(meta,header.trim());
  assert.ok(meta.length<2000,'update checks should only download metadata');
  assert.equal(value('supportURL'),'https://github.com/Axxxxpirine/pokeclicker-translation/issues');
});
