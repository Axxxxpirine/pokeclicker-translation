# Contribuer

Les corrections de traduction et les retours de bêta sont bienvenus. Le projet est indépendant du jeu officiel.

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
