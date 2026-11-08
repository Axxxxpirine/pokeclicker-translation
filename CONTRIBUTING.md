# Contribuer

PokéClicker Translation vise à rendre le jeu accessible dans toutes les langues grâce à la communauté. Le français est la première traduction disponible. Les nouvelles langues, corrections, relectures et retours de bêta sont bienvenus. Le projet est indépendant du jeu officiel.

## Contribuer à une nouvelle langue

1. Ouvrez une issue en indiquant la langue et, si nécessaire, sa variante régionale. Précisez si vous souhaitez traduire, relire ou tester. Les échanges peuvent se faire en français ou en anglais.
2. Utilisez les clés et textes anglais de `locales/en` comme référence. Le français de `locales/fr` fournit un exemple de traduction, pas une obligation de traduire depuis le français.
3. Proposez un premier ensemble de textes dans une pull request, sous `locales/<code-langue>/`, en conservant les noms de fichiers et les clés. Une contribution partielle est bienvenue si son périmètre et les textes restant à traduire sont indiqués.
4. Conservez les variables `{{...}}`, les références `[[...]]` et les balises utiles. Employez les noms officiels Pokémon de la langue cible lorsqu’ils existent, avec leurs sources. Préservez les identifiants internes et les noms des joueurs.
5. Faites relire les textes et participez aux essais en jeu avant la publication de cette langue.

La version 0.4.4 et ses outils de construction et de vérification ciblent actuellement le français. Ajouter un dossier de traduction ne suffit donc pas à activer une autre langue : son intégration au moteur, aux textes d’affichage et aux tests doit accompagner la contribution. Le guide décrit comment commencer, sans annoncer de prise en charge déjà disponible.

## Contribute a new language

Our goal is to make PokéClicker available in every language through community contributions. French is the first available translation. Translators, native-language reviewers and players who can test in-game text are welcome.

Open an issue naming your language and regional variant, if relevant. Use the English keys and text in `locales/en` as your source, and submit a small first batch under `locales/<language-code>/` in a pull request. Keep file names, keys, placeholders, references and necessary markup intact. Partial contributions are welcome when their scope and missing text are clearly identified. Use official Pokémon names in your language where available and cite sources.

Version 0.4.4 currently builds and tests French only. Adding translation files alone does not enable a new language: runtime integration, display adaptations, review and in-game tests are also needed before release. You can contribute translations or review without handling all of that yourself. Issues and pull requests in English or French are welcome.

## Proposer une correction

Ouvrez une issue avec le texte anglais, le texte français affiché, votre proposition et l’écran concerné. Pour un nom Pokémon officiel, ajoutez une source et vérifiez les variantes historiques. Ne traduisez pas les identifiants internes ni les noms saisis par les joueurs.

Les fichiers `locales/en` et `locales/fr` contiennent les dictionnaires. Les corrections des données importées vont dans `overrides/fr` sous forme de clés plates, afin de survivre au réimport. Conservez les variables `{{...}}`, les références `[[...]]` et les balises utiles. L’historique des versions du jeu reste en anglais.

## Construire et tester

Node.js 22 ou plus récent, npm et Git sont nécessaires.

```sh
npm ci
npm run build
npm test
npm run audit
```

Le script et son fichier de métadonnées sont générés dans `dist/`. Ne les modifiez pas à la main. La vérification GitHub reconstruit ces fichiers et contrôle leur concordance avec les sources.

Les tests du jeu utilisent un clone distinct de PokéClicker, lu au commit fixé dans `upstream/provenance.json`. Le clone doit contenir ce commit. Aucune sauvegarde personnelle n’est utilisée.

```sh
git clone https://github.com/pokeclicker/pokeclicker.git ../pokeclicker
npx playwright install chromium firefox
npm run test:browser
PCT_BROWSER=firefox npm run test:browser
# Google Chrome doit être installé pour ce contrôle supplémentaire
PCT_BROWSER=chrome npm run test:browser
npm run test:coverage
npm run test:quests
npm run test:dialogues
npm run test:requirements
npm run test:gameplay
```

`POKECLICKER_SOURCE` permet d’indiquer un autre chemin de clone. Les sorties et parties temporaires sont dans `.verification/`, ignoré par Git. Les tests automatisés injectent le script dans un profil neuf : ils vérifient le moteur et les comportements du jeu, pas toute l’interface de Tampermonkey.

Pour le contrôle facultatif des automatisations :

```sh
git clone https://github.com/Axxxxpirine/Pokeclicker-Scripts-NEW.git ../../Pokeclicker-Scripts-NEW
npm run test:compatibility
```

`POKECLICKER_SCRIPTS` permet de changer ce chemin. Le contrôle utilise les sources présentes dans ce clone. Les scripts d’automatisation ne sont pas nécessaires pour utiliser la traduction.

## Reconstituer les données

`upstream/provenance.json` fixe la source du jeu et des traductions importées. Les scripts `tools/gameplay-inventory.mjs`, `tools/gameplay-build.mjs` et `tools/gameplay-check.mjs` reconstruisent et contrôlent les descriptions, noms d’objets, succès et notifications. Les nouveaux objets rares doivent être documentés dans `upstream/key-item-nomenclature.json`.

L’import des six dictionnaires historiques nécessite les branches indiquées dans la provenance, dont `npc-dialog`, `fr-questlines` et `fr-ui`. Il n’est pas nécessaire pour construire le script à partir des dictionnaires déjà présents.

## Publier une nouvelle bêta

1. Actualiser `package.json` et `package-lock.json`, puis les notes de version.
2. Construire le script, exécuter les tests et vérifier les fichiers de `dist/`.
3. Tester le lien d’installation et la bascule FR sur une partie jetable dans Tampermonkey.
4. Envoyer les changements sur `main` et attendre les vérifications GitHub.
5. Créer une préversion GitHub avec le tag correspondant et les deux fichiers `dist/pokeclicker-translation.user.js` et `dist/pokeclicker-translation.meta.js`.

Les utilisateurs reçoivent les nouvelles versions numérotées de `main` via Tampermonkey. Évitez d’y envoyer un numéro de version dont la distribution n’est pas prête. Décrivez les limites réellement constatées et ne présentez pas le pourcentage du dictionnaire comme une garantie de couverture de tous les écrans.
