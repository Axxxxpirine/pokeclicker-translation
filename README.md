# PokéClicker Translation

Traduction indépendante de PokéClicker, en commençant par le français. Dépôt privé pendant le développement, destiné à être partagé en open source. Projet non affilié aux mainteneurs du jeu.

## État : préversion 0.2.0

Le script autonome se trouve dans `dist/pokeclicker-translation.user.js`. Il embarque ses dictionnaires et ne contacte aucun service de traduction. La première cible est le navigateur avec Tampermonkey. Le client bureau reste à valider.

| Dictionnaire | Textes français disponibles | Textes anglais recensés |
|---|---:|---:|
| Pokémon | 1 762 | 1 762 |
| Dialogues des PNJ | 2 091 | 2 091 |
| Quêtes scénarisées | 950 | 950 |
| Interface | 1 188 | 1 188 |
| Réglages | 274 | 274 |
| Journal | 45 | 45 |
| Total | 6 310 | 6 310 |

Ces chiffres mesurent les dictionnaires récupérés, **pas un pourcentage de traduction du jeu**. Les objets, lieux, combats, succès et autres textes non exportés ne sont pas tous recensés. La présence d'une traduction ne prouve pas son affichage sur tous les écrans. La comparaison avec la version publiée 0.10.26 ne détecte aucune clé anglaise nouvelle ou modifiée dans les quatre dictionnaires natifs.

## Essayer la préversion

1. Sauvegarder sa partie et ses scripts Tampermonkey avant un essai personnel.
2. Ouvrir le tableau de bord Tampermonkey, créer un script et remplacer son contenu par le fichier complet `dist/pokeclicker-translation.user.js`.
3. Enregistrer, puis recharger PokéClicker.
4. Utiliser le bouton **FR ✓** en bas à droite pour activer ou désactiver la traduction.

Le bouton conserve uniquement sa propre préférence. Désactiver le userscript puis recharger retire également la traduction. La langue native du jeu est conservée, donc l'affichage désactivé suit ce réglage. La préversion privée n'a pas de mise à jour automatique.

La coexistence avec Enhanced Auto Clicker 3.6.6, Auto Navigation 1.1.3, AutoQuest 1.1.10, Auto Hatchery 3.3.4, Auto Mine 3.2.4 et Auto Farmer 1.9.6 est vérifiée sur Chromium avec les sources réelles des scripts. Dans les deux ordres de chargement, AutoQuest termine une quête native de test et encaisse sa récompense. Les valeurs des commandes et les données de planification restent identiques après changement de langue. Les actions de ferme, de mine et de pension ne sont pas exercées par ce scénario. Cela ne valide pas encore toutes les régions, les activités parallèles ni une longue partie.

Le démarrage réel avec **Zen 1.24b et Tampermonkey 5.5.0** a été vérifié le 7 novembre 2026 : installation du seul script après sauvegarde des scripts existants, rechargement du jeu, reprise d’une sauvegarde avancée et basculement FR. Le raccord natif est actif, un seul bouton FR est présent, Auto Click et Auto Hatch continuent avec leurs réglages, AutoQuest reste OFF. Il s’agit d’un essai de fonctionnement court, pas d’une validation de toutes les activités. Le profil vierge automatisé de Zen rencontre encore une erreur interne Tampermonkey, absente de cet essai personnel. Les tests Chromium ci-dessus chargent les sources directement et ne simulent pas toute l’extension.

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
npm run test:compatibility
```

Le test navigateur lit le dépôt `../pokeclicker` au commit fixé dans `upstream/provenance.json`, sans modifier sa branche. Un autre emplacement peut être indiqué par `POKECLICKER_SOURCE`. Il lance son propre serveur sur localhost et vérifie le démarrage, le tutoriel, les traductions natives, le basculement de langue et les clés de villes. Les captures temporaires restent dans `.verification/`, ignoré par Git.

Le test de compatibilité lit les six scripts dans `../../Pokeclicker-Scripts-NEW`, ou dans le chemin indiqué par `POKECLICKER_SCRIPTS`. Il prépare une partie synthétique locale avec trois Pokémon et deux quêtes, puis laisse les vraies automatisations combattre, terminer et encaisser la première quête. Aucune progression ni sauvegarde personnelle n'est utilisée. Ces scripts externes ne sont pas intégrés au paquet de traduction.

## Traductions et provenance

- `locales/en` et `locales/fr` contiennent les instantanés importés.
- `upstream/provenance.json` conserve les branches et commits d'origine.
- `upstream/en` contient la référence anglaise des quatre espaces natifs du jeu publié.
- `overrides` contient les corrections locales sous forme de clés i18next plates. Elles rétablissent le nom du Pokémon dans la notification de capture d'un Pokémon obscur et complètent les 92 réglages manquants, dont 37 renvois aux libellés partagés des notifications de bureau.
- `src` contient le moteur et le raccord au jeu. `tools` contient l'import, l'audit et la construction.

L'import est une opération de maintenance : il remplace les instantanés de `locales` et `upstream`, mais conserve `overrides`. Pour réimporter depuis les branches de travail récupérées :

```sh
node tools/import-translations.mjs ../pokeclicker-translations ../pokeclicker
```

Les branches `npc-dialog`, `fr-questlines` et `fr-ui` sont nécessaires. Les dépendances aux anciens dépôts concernent seulement la réimportation et le test du jeu, pas la construction du script ni son installation.

## Suite prévue

1. Étendre les vérifications aux fenêtres principales, régions avancées et activités parallèles des automatisations.
2. Compléter les adaptations d'affichage manquantes et relire les traductions récupérées.
3. Étendre aux lieux, objets, arènes et autres systèmes, avec un comptage distinct des textes traduits, raccordés et vérifiés.
4. Préparer les contributions et les versions publiques, puis tester le client bureau.

## Licence et crédits

Le nouveau code est sous licence MIT. Les dictionnaires issus de [pokeclicker-translations](https://github.com/pokeclicker/pokeclicker-translations) conservent leur notice MIT dans `licenses/pokeclicker-translations-MIT.txt`. Le script embarque également la notice MIT d'i18next. Les illustrations et le jeu lui-même ne sont pas distribués dans ce dépôt.
