# PokéClicker en français 🇫🇷

Traduction française indépendante de **PokéClicker**, à installer avec Tampermonkey. Le jeu, les aides et les réglages sont traduits. L’historique des versions du jeu reste en anglais.

**Bêta 0.4.4 — pour PokéClicker 0.10.26.** Le projet est communautaire, non officiel et sans affiliation avec l’équipe de PokéClicker ou les ayants droit de Pokémon. Des erreurs et des textes manquants restent possibles.

## Installer

1. Exportez une sauvegarde de votre partie depuis le menu de PokéClicker.
2. Installez [Tampermonkey depuis son site officiel](https://www.tampermonkey.net/), qui renvoie vers la boutique de votre navigateur.
3. Cliquez sur **[Installer la traduction française](https://raw.githubusercontent.com/Axxxxpirine/pokeclicker-translation/main/dist/pokeclicker-translation.user.js)**, puis sur **Installer** dans Tampermonkey.
4. Ouvrez ou rechargez [PokéClicker](https://www.pokeclicker.com/). Le bouton **FR ✓**, en bas à droite, permet de revenir à l’anglais à tout moment.

Sur Chrome, activez **Autoriser les scripts utilisateur** dans les détails de l’extension Tampermonkey si nécessaire. [Aide officielle Tampermonkey](https://www.tampermonkey.net/faq.php#Q209).

Si le lien affiche du texte au lieu de proposer l’installation, ouvrez le tableau de bord Tampermonkey → **Utilitaires → Importer depuis une URL**, collez le lien d’installation ci-dessus et validez. Vérifiez que l’extension est autorisée sur `pokeclicker.com`.

Le script n’ajoute ni ressources, ni automatisation, ni triche. Il adapte l’affichage et conserve les identifiants du jeu.

## Mises à jour et désinstallation

Tampermonkey vérifie les nouvelles versions sur ce dépôt GitHub, selon la fréquence configurée dans l’extension. Vous pouvez également lancer **Vérifier les mises à jour** depuis son tableau de bord. Le canal bêta suit les versions numérotées de la branche `main`.

Si vous utilisiez une version privée 0.4.3 ou antérieure, ouvrez une fois le lien d’installation pour passer à 0.4.4 et enregistrer les adresses de mise à jour. Le nom et l’identité du script sont conservés pour éviter un doublon.

Pour désactiver temporairement la traduction, cliquez sur **FR ✓**. Pour la retirer, désactivez ou supprimez **PokéClicker Translation — Français** dans Tampermonkey, puis rechargez le jeu. Ne supprimez pas les données du site : elles contiennent votre partie.

Les versions téléchargeables et leurs notes sont dans [Releases](https://github.com/Axxxxpirine/pokeclicker-translation/releases). Pour conserver une ancienne version, désactivez sa mise à jour automatique dans Tampermonkey.

## Ce qui est couvert

- Menus, réglages, aides, dialogues, quêtes, notifications et journal.
- Noms de Pokémon, lieux, donjons, arènes, objets, baies et badges.
- Inventaire des 17 objets rares, dont TV ABC, Holokit, Wailmerrosoir et Pointeau ADN.
- 16 294 entrées françaises dans 14 dictionnaires, comparées au jeu publié 0.10.26.

**100 % des entrées recensées ne signifie pas 100 % des situations possibles en jeu.** Les noms officiels français sont utilisés lorsqu’ils sont attestés. Les éléments propres à PokéClicker reçoivent des traductions descriptives. Les pseudonymes, noms saisis par les joueurs et codes cadeaux sont préservés.

Les régions avancées ont été contrôlées à partir des données du jeu. Une partie complète, les longues sessions et une relecture humaine exhaustive restent à faire. Les ajouts futurs du jeu et tous les textes des scripts tiers ne sont pas couverts automatiquement.

## Compatibilité et problèmes connus

- Installation et utilisation réelles validées dans Zen avec Tampermonkey.
- Installation neuve de la bêta 0.4.4 et démarrage du jeu validés avec Tampermonkey dans Google Chrome 157 (extension 5.5.1) et Firefox Nightly 159 (extension 5.5.0), sur des profils de test séparés. Introduction, tutoriel, bascule français/anglais et rechargement contrôlés. Firefox stable n’a pas fait l’objet de ce test d’installation neuf.
- Tests automatisés du moteur également exécutés sur Chrome et Firefox. Les vérifications continues du dépôt couvrent Chromium et Firefox.
- Le client de bureau, les navigateurs mobiles et les autres gestionnaires de scripts ne sont pas validés.
- La coexistence avec six scripts d’automatisation a été testée. Ces scripts sont facultatifs et ne sont pas distribués avec la traduction.
- Si l’onglet **Objets rares** ne s’ouvre pas et que vous utilisez **Debug Cheats Tools**, mettez ce dernier à jour vers **1.1.3 ou plus récent**. Une ancienne version créait un conflit avec l’inventaire natif.

Si un problème apparaît, désactivez la traduction avec le bouton FR et comparez. Après une mise à jour importante de PokéClicker, consultez les [problèmes signalés](https://github.com/Axxxxpirine/pokeclicker-translation/issues).

## Signaler une erreur ou participer

**[Signaler un problème](https://github.com/Axxxxpirine/pokeclicker-translation/issues/new/choose)** : précisez le texte concerné, l’écran ou le lieu, la version du script, celle du jeu et votre navigateur. Une capture recadrée est utile. N’incluez pas votre sauvegarde complète ni d’informations personnelles.

Les retours de bêta sont bienvenus, notamment sur l’installation, les régions avancées et les sessions longues. Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour proposer une correction ou lancer les tests.

## Confidentialité

Le code de traduction ne transmet pas votre partie et ne fait appel à aucun service de traduction en ligne. Les dictionnaires sont embarqués. Sa seule préférence enregistrée est l’activation du bouton FR, dans le stockage local du site. Les vérifications et téléchargements de mises à jour sont effectués par Tampermonkey auprès de GitHub. Le jeu et l’extension ont leurs propres politiques de confidentialité.

## Licence et crédits

Le nouveau code est sous licence [MIT](LICENSE). Les traductions reprises de [pokeclicker-translations](https://github.com/pokeclicker/pokeclicker-translations) conservent leur [notice MIT](licenses/pokeclicker-translations-MIT.txt). Les notices MIT d’i18next et [BSD de PokeAPI](licenses/pokeapi-BSD-3-Clause.txt) sont également embarquées dans le script.

Les noms ont été recoupés avec les tables bilingues de [PokeAPI](https://github.com/PokeAPI/pokeapi), Poképédia et Bulbapedia. Les références et distinctions entre noms officiels et adaptations sont consignées dans [la revue de nomenclature](upstream/nomenclature-review.json) et [la revue des objets rares](upstream/key-item-nomenclature.json). Le jeu et ses illustrations ne sont pas distribués dans ce dépôt.
