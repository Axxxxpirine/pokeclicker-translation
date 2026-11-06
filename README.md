# PokéClicker Translation

Traduction indépendante de PokéClicker, en commençant par le français. Dépôt privé pendant le développement, destiné à être partagé en open source. Projet non affilié aux mainteneurs du jeu.

## État : préversion 0.1.0

Le script autonome se trouve dans `dist/pokeclicker-translation.user.js`. Il embarque ses dictionnaires et ne contacte aucun service de traduction. La première cible est le navigateur avec Tampermonkey. Le client bureau reste à valider.

| Dictionnaire | Textes français disponibles | Textes anglais recensés |
|---|---:|---:|
| Pokémon | 1 762 | 1 762 |
| Dialogues des PNJ | 2 091 | 2 091 |
| Quêtes scénarisées | 950 | 950 |
| Interface | 1 188 | 1 188 |
| Réglages | 182 | 274 |
| Journal | 45 | 45 |
| Total | 6 218 | 6 310 |

Ces chiffres mesurent les dictionnaires récupérés, **pas un pourcentage de traduction du jeu**. Les objets, lieux, combats, succès et autres textes non exportés ne sont pas tous recensés. La présence d'une traduction ne prouve pas son affichage sur tous les écrans. La comparaison avec la version publiée 0.10.26 ne détecte aucune clé anglaise nouvelle ou modifiée dans les quatre dictionnaires natifs.

## Essayer la préversion

1. Sauvegarder sa partie et ses scripts Tampermonkey avant un essai personnel.
2. Ouvrir le tableau de bord Tampermonkey, créer un script et remplacer son contenu par le fichier complet `dist/pokeclicker-translation.user.js`.
3. Enregistrer, puis recharger PokéClicker.
4. Utiliser le bouton **FR ✓** en bas à droite pour activer ou désactiver la traduction.

Le bouton conserve uniquement sa propre préférence. Désactiver le userscript puis recharger retire également la traduction. La langue native du jeu est conservée, donc l'affichage désactivé suit ce réglage. La préversion privée n'a pas de mise à jour automatique.

## Fonctionnement et limites

- Le raccord au système natif traduit les appels connus et conserve le comportement natif pour les clés inconnues. Il ne renomme aucun identifiant de Pokémon, ville, objet ou quête.
- Le complément d'affichage remplace des textes complets reconnus et certains compteurs numériques. Les correspondances ambiguës restent dans leur langue d'origine.
- Les paragraphes HTML sont découpés à la construction seulement lorsque leur structure anglaise et française correspond. Les éléments, liens et actions du jeu restent en place.
- Les champs de saisie, noms de dresseur et options sans valeur explicite sont préservés. Un contenu tiers peut demander une exclusion supplémentaire avec `data-pct-ignore`.
- Les textes avec des variables arbitraires, les changements de structure HTML, certains textes riches et les textes absents des dictionnaires restent partiels ou non traduits.
- Les traductions existantes demandent encore une relecture linguistique, notamment pour harmoniser le tutoiement et le vocabulaire.
- Une mise à jour du jeu demande un nouveau contrôle. La compatibilité avec tous les scripts tiers n'est pas encore établie.

## Développement

Node.js 22 ou plus récent.

```sh
npm ci
npm test
npm run audit
npm run build
```

Vérification sur le vrai jeu dans un navigateur isolé :

```sh
npx playwright install chromium --only-shell
npm run test:browser
```

Le test navigateur lit le dépôt `../pokeclicker` au commit fixé dans `upstream/provenance.json`, sans modifier sa branche. Un autre emplacement peut être indiqué par `POKECLICKER_SOURCE`. Il lance son propre serveur sur localhost et vérifie le démarrage, le tutoriel, les traductions natives, le basculement de langue et les clés de villes. Les captures temporaires restent dans `.verification/`, ignoré par Git.

## Traductions et provenance

- `locales/en` et `locales/fr` contiennent les instantanés importés.
- `upstream/provenance.json` conserve les branches et commits d'origine.
- `upstream/en` contient la référence anglaise des quatre espaces natifs du jeu publié.
- `overrides` contient les corrections locales sous forme de clés i18next plates. La correction initiale rétablit le nom du Pokémon dans la notification de capture d'un Pokémon obscur.
- `src` contient le moteur et le raccord au jeu. `tools` contient l'import, l'audit et la construction.

L'import est une opération de maintenance : il remplace les instantanés de `locales` et `upstream`, mais conserve `overrides`. Pour réimporter depuis les branches de travail récupérées :

```sh
node tools/import-translations.mjs ../pokeclicker-translations ../pokeclicker
```

Les branches `npc-dialog`, `fr-questlines` et `fr-ui` sont nécessaires. Les dépendances aux anciens dépôts concernent seulement la réimportation et le test du jeu, pas la construction du script ni son installation.

## Suite prévue

## Licence et crédits

Le nouveau code est sous licence MIT. Les dictionnaires issus de [pokeclicker-translations](https://github.com/pokeclicker/pokeclicker-translations) conservent leur notice MIT dans `licenses/pokeclicker-translations-MIT.txt`. Le script embarque également la notice MIT d'i18next. Les illustrations et le jeu lui-même ne sont pas distribués dans ce dépôt.
