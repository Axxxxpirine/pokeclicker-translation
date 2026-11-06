import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFragments } from './fragments.mjs';
import { buildCatalog } from '../src/catalog.mjs';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function readResources() {
  return Object.fromEntries(['en', 'fr'].map(lang => [lang, Object.fromEntries(readdirSync(resolve(root, `locales/${lang}`)).filter(file => file.endsWith('.json')).sort().map(file => {
    const base = JSON.parse(readFileSync(resolve(root, `locales/${lang}/${file}`), 'utf8'));
    const patchPath = resolve(root, `overrides/${lang}/${file}`);
    const patch = existsSync(patchPath) ? JSON.parse(readFileSync(patchPath, 'utf8')) : {};
    // Overrides use flat i18next keys, including dotted paths, to preserve imported files.
    return [file.slice(0, -5), { ...base, ...patch }];
  }))]));
}

export function displayCatalog(resources) {
  const fragments = extractFragments(resources);
  return buildCatalog({ en: { ...resources.en, displayFragments: fragments.en }, fr: { ...resources.fr, displayFragments: fragments.fr } });
}
