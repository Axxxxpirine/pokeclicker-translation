import { build } from 'esbuild';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, readResources, displayCatalog } from './resources.mjs';

const resources = readResources(), catalog = displayCatalog(resources);
if (catalog.invalid.length) throw new Error(`Invalid translation variables: ${catalog.invalid.join(', ')}`);
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
mkdirSync(resolve(root, '.verification'), { recursive: true });
mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, '.verification/payload.mjs'), `export const resources = ${JSON.stringify(resources)};\nexport const catalog = ${JSON.stringify(catalog)};\nexport const version = ${JSON.stringify(version)};\n`);
const thirdPartyLicense = readFileSync(resolve(root, 'licenses/pokeclicker-translations-MIT.txt'), 'utf8');
const engineLicense = readFileSync(resolve(root, 'node_modules/i18next/LICENSE'), 'utf8');
const ownLicense = readFileSync(resolve(root, 'LICENSE'), 'utf8');
const pokeApiLicense = readFileSync(resolve(root, 'licenses/pokeapi-BSD-3-Clause.txt'), 'utf8');
const header = `// ==UserScript==
// @name         PokéClicker Translation — Français
// @namespace    https://github.com/Axxxxpirine/pokeclicker-translation
// @version      ${version}
// @description  Independent French translation beta. FR toggle in the bottom-right corner.
// @author       Axxxxpirine
// @license      MIT
// @homepageURL  https://github.com/Axxxxpirine/pokeclicker-translation
// @supportURL   https://github.com/Axxxxpirine/pokeclicker-translation/issues
// @downloadURL  https://raw.githubusercontent.com/Axxxxpirine/pokeclicker-translation/main/dist/pokeclicker-translation.user.js
// @updateURL    https://raw.githubusercontent.com/Axxxxpirine/pokeclicker-translation/main/dist/pokeclicker-translation.meta.js
// @match        https://www.pokeclicker.com/*
// @match        https://pokeclicker.com/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

/* ${ownLicense.replaceAll('*/', '* /')} */
/* Translation data: ${thirdPartyLicense.replaceAll('*/', '* /')} */
/* i18next: ${engineLicense.replaceAll('*/', '* /')} */
/* PokeAPI name reference data: ${pokeApiLicense.replaceAll('*/', '* /')} */
`;
writeFileSync(resolve(root, 'dist/pokeclicker-translation.meta.js'), header.split('// ==/UserScript==')[0]+'// ==/UserScript==\n');
await build({ entryPoints: [resolve(root, 'src/runtime.mjs')], outfile: resolve(root, 'dist/pokeclicker-translation.user.js'), bundle: true, format: 'iife', target: ['chrome100', 'firefox102'], minify: false, legalComments: 'inline', banner: { js: header } });
console.log(`Built userscript and update metadata (${version}). Public beta channel: main.`);
