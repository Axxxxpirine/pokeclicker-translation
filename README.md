# PokéClicker Translation 🌍

A community-driven open-source project that aims to make **PokéClicker available in every language**, with help from players, translators and reviewers.

**French is the first available translation.** Contributors from every language are welcome to add new languages, improve translations and test them in the game. The current version installs through Tampermonkey and translates the game, help panels and settings into French. The game's version history remains in English.

**Beta 0.4.6 — for PokéClicker 0.10.26.** This is an unofficial community project with no affiliation to the PokéClicker team or Pokémon rights holders. Errors and missing text are still possible.

## Languages and contributions

| Language | Status in this project |
|---|---|
| French | First available translation, in beta |
| Other languages | Contributions welcome, no other language included in the current release |

You can propose a new language, translate a few strings, review official Pokémon names or test translations in the game. See the [contribution guide](CONTRIBUTING.md#contribute-a-new-language) to get started. Each language will be integrated and validated with its contributors.

## Installation

1. Export a backup of your save from the PokéClicker menu.
2. Install [Tampermonkey from its official website](https://www.tampermonkey.net/), which links to your browser's extension store.
3. Click **[Install the French translation](https://raw.githubusercontent.com/Axxxxpirine/pokeclicker-translation/main/dist/pokeclicker-translation.user.js)**, then click **Install** in Tampermonkey.
4. Open or reload [PokéClicker](https://www.pokeclicker.com/). The **FR ✓** button in the bottom-right corner lets you switch back to English at any time.

On Chrome, enable **Allow User Scripts** in the Tampermonkey extension details if needed. See the [official Tampermonkey help](https://www.tampermonkey.net/faq.php#Q209).

If the link displays source code instead of an installation prompt, open the Tampermonkey dashboard → **Utilities → Import from URL**, paste the installation link above and confirm. Check that the extension is allowed to run on `pokeclicker.com`.

The script does not add resources, automation or cheats. It changes the display while preserving the game's internal identifiers.

## Updates and removal

Tampermonkey checks this GitHub repository for new versions at the interval configured in the extension. You can also select **Check for updates** in its dashboard. The beta channel follows numbered versions on the `main` branch.

If you used a private version, 0.4.3 or earlier, open the installation link once to upgrade to the current version and register the update URLs. The script's name and identity remain unchanged to avoid duplicate installations.

To temporarily disable the translation, click **FR ✓**. To remove it, disable or delete the **PokéClicker Translation** script in Tampermonkey, then reload the game. The installed script retains its original French language suffix for compatibility. Do not delete the site's data, as it contains your save.

Downloads and release notes are available under [Releases](https://github.com/Axxxxpirine/pokeclicker-translation/releases). To keep an older version, disable automatic updates for that script in Tampermonkey.

## French translation coverage

- Menus, settings, help panels, dialogue, quests, notifications and the logbook.
- Names of Pokémon, locations, dungeons, gyms, items, berries and badges.
- All 17 Key Items, including Teachy TV, Holo Caster, Wailmer Pail and DNA Splicers.
- 16,294 French entries across 14 dictionaries, checked against game release 0.10.26.

**100% of catalogued entries does not mean 100% of all possible in-game situations.** Attested official French names are used where available. PokéClicker-specific elements receive descriptive translations. Usernames, player-entered names and gift codes are preserved.

Later regions have been checked against the game data. A full playthrough, long sessions and an exhaustive human review are still pending. Future game additions and all third-party script text are not covered automatically.

## Compatibility and known issues

- Installation and real gameplay validated in Zen with Tampermonkey.
- Fresh beta 0.4.4 installation and game startup validated with Tampermonkey in Google Chrome 157 (extension 5.5.1) and Firefox Nightly 159 (extension 5.5.0), using separate test profiles. Introduction, tutorial, French/English switching and reloading were checked. Stable Firefox was not included in this fresh-installation test.
- Automated engine tests also run on Chrome and Firefox. The repository's continuous integration checks cover Chromium and Firefox.
- The desktop client, mobile browsers and other userscript managers have not been validated.
- Coexistence with six automation scripts has been tested. These scripts are optional and are not distributed with the translation.
- If the **Key Items** tab does not open and you use **Debug Cheats Tools**, update that script to **1.1.3 or later**. An older version conflicted with the native inventory.

If you encounter a problem, disable the translation with the FR button and compare. After a major PokéClicker update, check the [reported issues](https://github.com/Axxxxpirine/pokeclicker-translation/issues).

## Report an issue or contribute

**[Report an issue](https://github.com/Axxxxpirine/pokeclicker-translation/issues/new/choose)** with the affected text, screen or location, script version, game version and browser. A cropped screenshot is helpful. Do not include your full save or personal information.

Beta feedback is welcome, especially on installation, later regions and long sessions. See [CONTRIBUTING.md](CONTRIBUTING.md) to add a new language, propose a correction or run the tests.

## Privacy

The translation code does not transmit your save or contact any online translation service. Dictionaries are bundled with the script. Its only stored preference is whether the FR button is enabled, saved in the site's local storage. Tampermonkey checks for and downloads updates from GitHub. The game and extension have their own privacy policies.

## License and credits

New code is released under the [MIT license](LICENSE). Translations imported from [pokeclicker-translations](https://github.com/pokeclicker/pokeclicker-translations) retain their [MIT notice](licenses/pokeclicker-translations-MIT.txt). The i18next MIT notice and [PokeAPI BSD notice](licenses/pokeapi-BSD-3-Clause.txt) are also bundled with the script.

Names were cross-checked against bilingual [PokeAPI](https://github.com/PokeAPI/pokeapi) tables, Poképédia and Bulbapedia. Sources and distinctions between official names and adaptations are recorded in the [nomenclature review](upstream/nomenclature-review.json) and [Key Items review](upstream/key-item-nomenclature.json). The game and its artwork are not distributed in this repository.
