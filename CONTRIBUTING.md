# Contributing

PokéClicker Translation aims to make the game available in every language through community contributions. French is the first available translation. New languages, corrections, reviews and beta feedback are welcome. This project is independent of the official game.

## Contribute a new language

1. Open an issue naming your language and regional variant, if relevant. Let us know whether you would like to translate, review or test. Issues and pull requests in English or French are welcome.
2. Use the English keys and text in `locales/en` as your source. The French files in `locales/fr` are an example translation, not a requirement to translate from French.
3. Submit a small first batch in a pull request under `locales/<language-code>/`, preserving file names and keys. Partial contributions are welcome when their scope and remaining untranslated text are clearly identified.
4. Keep `{{...}}` placeholders, `[[...]]` references and necessary markup intact. Use official Pokémon names in the target language where available and cite sources. Preserve internal identifiers and player names.
5. Have the text reviewed and help test it in the game before the language is released.

The current version and its build and verification tools target French only. Adding a translation folder alone does not enable a new language: runtime integration, display adaptations and tests must accompany the contribution. You can contribute translations or review without handling all of that yourself. This guide explains how to get started, without claiming that other languages are already supported.

## Repository language

Write documentation, release notes, issue templates, code comments and development messages in English. Keep translation dictionaries, localized in-game text, nomenclature examples and related test fixtures in their target language. The installed userscript's original name is preserved for update compatibility.

## Propose a correction

Open an issue with the English source, the displayed French text, your proposed correction and the affected screen. For an official Pokémon name, add a source and check historical variants. Do not translate internal identifiers or player-entered names.

The `locales/en` and `locales/fr` directories contain the dictionaries. Corrections to imported data belong in `overrides/fr` as flat keys so they survive re-importing. Preserve `{{...}}` placeholders, `[[...]]` references and necessary markup. The game's version history remains in English.

## Build and test

Node.js 22 or later, npm and Git are required.

```sh
npm ci
npm run build
npm test
npm run audit
```

The userscript and its metadata file are generated in `dist/`. Do not edit them by hand. GitHub checks rebuild these files and verify that they match the sources.

Game tests use a separate PokéClicker clone, read at the commit pinned in `upstream/provenance.json`. The clone must contain that commit. No personal save is used.

```sh
git clone https://github.com/pokeclicker/pokeclicker.git ../pokeclicker
npx playwright install chromium firefox
npm run test:browser
PCT_BROWSER=firefox npm run test:browser
# Google Chrome must be installed for this additional check
PCT_BROWSER=chrome npm run test:browser
npm run test:coverage
npm run test:quests
npm run test:dialogues
npm run test:requirements
npm run test:gameplay
```

Set `POKECLICKER_SOURCE` to use a different clone path. Output and temporary saves are stored in `.verification/`, which is ignored by Git. Automated tests inject the script into a fresh profile: they check the translation engine and game behavior, not the entire Tampermonkey interface.

For the optional automation compatibility check:

```sh
git clone https://github.com/Axxxxpirine/Pokeclicker-Scripts-NEW.git ../../Pokeclicker-Scripts-NEW
npm run test:compatibility
```

Set `POKECLICKER_SCRIPTS` to change this path. The check uses the sources present in that clone. Automation scripts are not required to use the translation.

## Rebuild the data

`upstream/provenance.json` pins the game source and imported translations. The `tools/gameplay-inventory.mjs`, `tools/gameplay-build.mjs` and `tools/gameplay-check.mjs` scripts rebuild and verify descriptions, item names, achievements and notifications. New Key Items must be documented in `upstream/key-item-nomenclature.json`.

Importing the six original dictionaries requires the branches listed in the provenance file, including `npc-dialog`, `fr-questlines` and `fr-ui`. This import is not needed to build the userscript from the dictionaries already in the repository.

## Publish a new beta

1. Update `package.json` and `package-lock.json`, then the release notes.
2. Build the userscript, run the tests and check the files in `dist/`.
3. Test the installation link and FR toggle with a disposable save in Tampermonkey.
4. Push the changes to `main` and wait for the GitHub checks.
5. Create a GitHub prerelease with the matching tag and both `dist/pokeclicker-translation.user.js` and `dist/pokeclicker-translation.meta.js` attached.

Users receive new numbered versions from `main` through Tampermonkey. Avoid pushing a version number before its distribution files are ready. Describe observed limitations accurately and do not present dictionary coverage as a guarantee that every screen is fully translated.
