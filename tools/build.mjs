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
const header = `// ==UserScript==
// @name         PokéClicker Translation — Français
// @namespace    https://github.com/Axxxxpirine/pokeclicker-translation
// @version      ${version}
// @description  Traduction française indépendante, préversion. Interrupteur FR en bas à droite.
// @author       Axxxxpirine
// @license      MIT
// @match        https://www.pokeclicker.com/*
// @match        https://pokeclicker.com/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

/* ${ownLicense.replaceAll('*/', '* /')} */
/* Translation data: ${thirdPartyLicense.replaceAll('*/', '* /')} */
/* i18next: ${engineLicense.replaceAll('*/', '* /')} */
`;
await build({ entryPoints: [resolve(root, 'src/runtime.mjs')], outfile: resolve(root, 'dist/pokeclicker-translation.user.js'), bundle: true, format: 'iife', target: ['chrome100', 'firefox102'], minify: false, legalComments: 'inline', banner: { js: header } });
console.log(`Built dist/pokeclicker-translation.user.js (${version}). Private preview, no remote update URLs.`);
