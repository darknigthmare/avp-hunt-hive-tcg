# Shared Alien_base v1 — TCG

Le jeu conserve ses 158 cartes, leurs coûts, attaques, effets, rarités, IDs et sauvegardes. `src/alien-base-v1.js` est un pont local versionné vers `darknigthmare/alien_base` (PR #4), chargé immédiatement après le catalogue. Chaque carte expose `sharedEntityId` (non énumérable, donc absent de la sérialisation JSON) ; une poignée de cartes dont l'identité est sans ambiguïté expose aussi `sharedLoreEntityId`. Les fiches lore et règles de combat restent distinctes.

L'API `window.resolveAlienBaseCardV1(cardId)` permet l'usage dans les archives et fiches ultérieures. Le pont est ajouté à la liste stricte d'assets, au build et au shell hors-ligne. Le dépôt Alien_base est privé ; aucun jeton ni chemin d'asset privé n'est livré au navigateur. Tester via `node --test tests/alien-base.test.mjs`.
