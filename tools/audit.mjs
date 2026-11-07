import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createTranslator, flatten } from '../src/catalog.mjs';
import { root, readResources, displayCatalog } from './resources.mjs';

const resources = readResources();
const rows = Object.entries(resources.en).map(([ns, values]) => {
  const en = flatten(values), fr = flatten(resources.fr[ns]);
  const baselinePath = resolve(root, `upstream/en/${ns}.json`);
  const baseline = existsSync(baselinePath) ? flatten(JSON.parse(readFileSync(baselinePath, 'utf8'))) : undefined;
  const keys = Object.keys(en);
  return { namespace: ns, english: keys.length, translated: keys.filter(key => fr[key]?.trim()).length,
    missing: keys.filter(key => !fr[key]?.trim()).length,
    liveKeys: baseline ? Object.keys(baseline).length : 'not native',
    liveTranslated: baseline ? Object.keys(baseline).filter(key => baseline[key] === en[key] && fr[key]?.trim()).length : 'display adapter',
    changedOrNew: baseline ? Object.keys(baseline).filter(key => baseline[key] !== en[key]).length : 'not measured',
  };
});
console.table(rows);
const catalog = displayCatalog(resources);
const translator = createTranslator(catalog);
console.log(JSON.stringify({ totalEnglish: rows.reduce((n, row) => n + row.english, 0), totalTranslated: rows.reduce((n, row) => n + row.translated, 0), displayExact: translator.exactCount, displayTemplates: translator.templateCount, namedDomains: Object.keys(catalog.domains).length, ambiguous: catalog.ambiguous.length, invalidVariables: catalog.invalid, richOrUnresolved: catalog.skipped.length, note: 'Dictionary coverage is not verified in-game coverage. Live comparison only covers native namespaces, not all game text.' }, null, 2));
if (catalog.invalid.length || rows.some(row => row.missing)) process.exitCode = 1;
