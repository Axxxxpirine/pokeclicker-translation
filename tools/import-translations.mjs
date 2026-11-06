import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const translations = resolve(process.argv[2] ?? resolve(root, '../pokeclicker-translations'));
const game = resolve(process.argv[3] ?? resolve(root, '../pokeclicker'));
const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const branches = { pokemon: 'origin/develop', settings: 'origin/develop', logbook: 'origin/develop', questlines: 'fr-questlines', npcs: 'npc-dialog', ui: 'fr-ui' };
// Explicitly snapshot each branch: switching branches loses the other translation lots.
const provenance = { upstream: 'https://github.com/pokeclicker/pokeclicker-translations', contributionFork: 'https://github.com/Axxxxpirine/pokeclicker-translations', game: { repository: 'https://github.com/pokeclicker/pokeclicker', commit: git(game, 'rev-parse', 'origin/master').trim(), version: JSON.parse(git(game, 'show', 'origin/master:package.json')).version }, namespaces: {} };
for (const [ns, ref] of Object.entries(branches)) {
  provenance.namespaces[ns] = { ref, commit: git(translations, 'rev-parse', ref).trim() };
  for (const lang of ['en', 'fr']) {
    const value = JSON.parse(git(translations, 'show', `${ref}:locales/${lang}/${ns}.json`));
    mkdirSync(resolve(root, `locales/${lang}`), { recursive: true });
    writeFileSync(resolve(root, `locales/${lang}/${ns}.json`), JSON.stringify(value, null, 2) + '\n');
  }
}
mkdirSync(resolve(root, 'upstream/en'), { recursive: true });
for (const ns of ['pokemon', 'settings', 'logbook', 'questlines']) {
  writeFileSync(resolve(root, `upstream/en/${ns}.json`), git(game, 'show', `origin/master:docs/locales/en/${ns}.json`));
}
mkdirSync(resolve(root, 'licenses'), { recursive: true });
writeFileSync(resolve(root, 'licenses/pokeclicker-translations-MIT.txt'), git(translations, 'show', 'origin/develop:LICENSE'));
writeFileSync(resolve(root, 'upstream/provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
console.log(`Imported ${Object.keys(branches).length} English/French namespaces. Baseline: PokéClicker ${provenance.game.version}.`);
