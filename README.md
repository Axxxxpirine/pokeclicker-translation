# PokéClicker Translation

Traduction française indépendante de PokéClicker. Projet personnel non affilié aux mainteneurs du jeu, privé pendant le développement et destiné à être partagé en open source.

## Version 0.4.2 — vérification en situation réelle dans Zen

Le script autonome est `dist/pokeclicker-translation.user.js`. Il embarque tous ses dictionnaires et ne contacte aucun service de traduction. Cette version vise le jeu publié **0.10.26**, fixé dans `upstream/provenance.json`, dans un navigateur avec Tampermonkey.

### Couverture

Les 14 dictionnaires contiennent **16 277 entrées françaises sur 16 277 clés anglaises recensées**, sans variable d’interpolation manquante. Ce total comprend des variantes et des doublons utiles au rendu. Il ne constitue pas un pourcentage de toutes les situations possibles à l’écran.

| Famille | Couverture du corpus publié contrôlée |
|---|---:|
| Noms et formes de Pokémon | 1 762 entrées natives |
| PNJ, professeurs et assistants | 634 personnages inventoriés |
| Arènes | 165 arènes examinées, 136 messages de victoire non vides |
| Combats temporaires | 454 combats examinés |
| Objets | 511 descriptions, 17 objets clés, 12 objets du Prof. Chen |
| Baies | 70 baies, 74 indices de mutations, 57 cas Enigma |
| Succès | 2 304 succès, dont les 28 secrets |
| Conditions de déblocage | Plus de 13 000 occurrences de conditions dans le modèle du jeu |
| Quêtes répétables | Les 18 classes natives |
| Interface | Menus, FAQ, aides, réglages, défis, événements et phases lunaires |

Les noms de lieux, champions, badges, baies et objets ont été complétés. Les références de nomenclature incluent les tables bilingues `location_names.csv` et `item_names.csv` de [PokeAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv), avec vérification des homonymes et adaptations des lieux propres à PokéClicker.

La révision 0.4.1 contrôle la nomenclature des lieux, donjons, routes et arènes de Kanto à Paldea, avec les Îles Sevii, Rhode, Hisui et Magicarpe Jump. Les références et exceptions sont conservées dans `upstream/nomenclature-review.json`. Elle harmonise aussi les mentions dans les quêtes, dialogues et succès, corrige les villes interverties et distingue les chenaux par région. Les noms français attestés sont conservés même lorsqu’ils paraissent anglais, comme **Shehroz Tower**. Les lieux fusionnés ou inventés par PokéClicker gardent des noms descriptifs, sans prétendre qu’ils sont officiels. Cette revue ne couvre pas exhaustivement chaque personnage secondaire ni chaque objet.

Les tests de navigateur vérifient dix panneaux réels ainsi que le démarrage, les dialogues, les quêtes et la coexistence avec six automatisations. Les inventaires contrôlent aussi les données des régions avancées qui ne sont pas accessibles dans une partie neuve. Cela ne remplace pas une partie complète ni une relecture humaine exhaustive du style.

### Contrôle en situation réelle du 8 novembre 2026

Parcours réel : écran principal, objets d’évolution et sac, ferme et aide, Baiedex et fiche Maron, Souterrain et aide/experts/trésors, Pension et aide, quêtes quotidiennes et scénarisées, Prof. Seko, Chambre de Purification, listes de donjons et d’arènes de Hoenn, navigation automatique, réglages Affichage/Jeu/Notifications, FAQ, Pokédex, badges, événements, journal, succès et statistiques. Les contrôles ont porté sur les écrans et échantillons accessibles, sans forcer la progression ni lancer d’achat, de combat ou de purification.

49 tests unitaires et sept suites d’intégration ont réussi pendant cette révision. Les contrôles navigateur, panneaux et compatibilité ont été relancés après les derniers changements. Le test des panneaux vérifie aussi toutes les statistiques générées, les objets, les baies et les onglets natifs. Le test navigateur vérifie le retour à l’anglais des textes CSS.

### Installer

1. Sauvegarder sa partie et ses scripts Tampermonkey avant de remplacer la version installée.
2. Ouvrir le script **PokéClicker Translation — Français** dans Tampermonkey et remplacer son contenu par le fichier complet `dist/pokeclicker-translation.user.js`.
3. Enregistrer et recharger PokéClicker.
4. Le bouton **FR ✓** en bas à droite active ou désactive la traduction.

Le bouton ne conserve que sa propre préférence. Désactiver le userscript puis recharger retire également la traduction. La langue native du jeu est conservée. Cette version privée n’a pas d’URL de mise à jour automatique.

## Fonctionnement

- Le raccord i18next traduit les appels natifs connus et conserve leur comportement pour les clés inconnues.
- Le raccord `TextMerger` traduit les lignes de dialogue complètes avant la substitution et l’échappement natifs du nom du joueur. Les tableaux de dialogues, identifiants et sauvegardes restent inchangés.
- Le complément d’affichage traduit les textes complets, les fragments HTML alignés et les attributs d’aide. Il conserve les éléments, liens et actions.
- Les noms variables proviennent de vocabulaires fermés. Un parcours par préfixes évite les expressions régulières géantes. Les captures numériques, durées et combinaisons de conditions ont des limites de travail explicites.
- Les homonymes, notamment les types, badges et certaines Poké Balls, utilisent leur contexte d’affichage. Les fragments servant à composer les noms de Pokémon ne sont pas appliqués seuls aux libellés de l’interface.
- Les options sans attribut `value` conservent leur valeur originale pendant la traduction. Les mises à jour natives et le retour à l’anglais sont couverts par des tests avec les vrais bindings Knockout.
- Les champs de saisie, noms de dresseur, scripts, éditeurs et éléments marqués `data-pct-ignore` sont préservés. Un contenu tiers inconnu conserve son affichage d’origine.

## Vérifier et reconstruire

Node.js 22 ou plus récent.

```sh
npm ci
npm test
npm run audit
npm run build
npx playwright install chromium --only-shell
npm run test:browser
npm run test:coverage
npm run test:quests
npm run test:dialogues
npm run test:requirements
npm run test:gameplay
npm run test:compatibility
```

Tous les essais utilisent des parties jetables sur localhost. Le jeu est lu depuis les objets Git du commit fixé, sans changer sa branche, dans `../pokeclicker` ou `POKECLICKER_SOURCE`. Les sorties temporaires sont placées dans `.verification/`, ignoré par Git.

Le scénario de compatibilité charge les vraies sources d’Enhanced Auto Clicker 3.6.6, Auto Navigation 1.1.3, AutoQuest 1.1.10, Auto Hatchery 3.3.4, Auto Mine 3.2.4 et Auto Farmer 1.9.6 depuis `../../Pokeclicker-Scripts-NEW` ou `POKECLICKER_SCRIPTS`. Dans les deux ordres de chargement, AutoQuest termine une quête native et encaisse sa récompense. Les commandes et données de planification restent identiques après le changement de langue. Ce scénario ne simule pas toute l’extension Tampermonkey et n’exerce pas toutes les actions de ferme, mine et pension.

## Maintenance des dictionnaires

- `locales/en` et `locales/fr` contiennent les traductions importées et les compléments du script.
- `overrides/fr` conserve les corrections des instantanés importés.
- `upstream/en` contient les quatre espaces anglais natifs de référence.
- `upstream/display-terms.json`, `display/terms-fr.json` et `display/requirement-terms-fr.json` définissent les vocabulaires des phrases variables et les variantes d’identifiants réellement utilisées dans les conditions.
- `src` contient le moteur. `tools` contient l’import, la construction, les inventaires et les vérifications.

Réimporter les six dictionnaires historiques depuis les branches récupérées :

```sh
node tools/import-translations.mjs ../pokeclicker-translations ../pokeclicker
```

Cette opération remplace les six instantanés importés et leur provenance, en conservant les autres dictionnaires et les corrections. Les branches `npc-dialog`, `fr-questlines` et `fr-ui` sont nécessaires.

Reconstruire le corpus d’objets, succès et notifications depuis la version fixée :

```sh
node tools/gameplay-inventory.mjs
node tools/gameplay-build.mjs
node tools/gameplay-check.mjs
```

`npm run import:terms` actualise le vocabulaire des quêtes. Relire ensuite les noms français avant de reconstruire. Une nouvelle version du jeu exige un nouvel inventaire et le passage des vérifications. Les textes ajoutés par d’autres scripts et les nouvelles versions ne sont pas couverts automatiquement.

## Licence et crédits

Le nouveau code est sous licence MIT. Les dictionnaires issus de [pokeclicker-translations](https://github.com/pokeclicker/pokeclicker-translations) conservent leur notice MIT dans `licenses/pokeclicker-translations-MIT.txt`. Le script embarque également la notice MIT d’i18next. Les illustrations et le jeu lui-même ne sont pas distribués dans ce dépôt.
