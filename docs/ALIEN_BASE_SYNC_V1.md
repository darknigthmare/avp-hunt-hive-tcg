# AVP: Hunt // Hive TCG ⇄ Alien_base

Les 158 cartes originales du TCG sont archivées dans le master privé `darknigthmare/alien_base#2` sous `projects/avp-hunt-hive-tcg/cards.json` avec des statistiques **propres au TCG**. Les 58 fiches de morphologie restent des directives créatives de fan art, jamais des certifications visuelles 1:1.

Le jeu consomme un snapshot public autorisé, embarqué hors ligne, et expose `window.AVP_ALIEN_BASE.cardLinks` (ID locaux vers ID de master) et `find` sans modifier les unités, les cartes, les sauvegardes ni les decks. Aucun fetch du dépôt privé n'existe. Le serveur public et le service worker autorisent les deux modules explicitement.

Vérifier `node --test tests/alien-base-reference.test.mjs` et `npm run verify:release` avant fusion.


**Export étendu vérifié :** 158 fiches réelles de cartes TCG dans `Alien_base` (identités et noms uniquement), 52 familles d'ennemis Tantalus et 29 œuvres du catalogue Apex. `getSharedCardId` effectue maintenant une recherche exacte dans le registre maître au lieu de fabriquer un lien. Aucun coût, PV ou effet TCG n'est importé dans les autres jeux.
