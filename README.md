# AVP: HUNT // HIVE TCG

Version 1.0.0 professionnelle du TCG tactique fan-made, jouable hors ligne dans un navigateur moderne. Cette édition part du standalone exact livré dans la conversation source, conserve ses 158 cartes et sépare désormais catalogue, moteur de règles, interface, styles et couche PWA.

> Projet non commercial et non officiel. Aucun asset visuel ou sonore officiel n'est embarqué. Les illustrations sont des compositions SVG procédurales originales et les icônes PWA sont générées localement. Les citations reconnaissables de l'ancien catalogue ont été remplacées par des textes originaux dans la version jouable. L'archive historique exacte reste dans Git pour la provenance, mais n'est pas déployée.

## Contenu jouable

- 158 cartes, cinq identités jouables plus les cartes Neutres, et sept raretés.
- Trois decks de départ, constructeur de decks de 30 cartes et collection persistante.
- Duels tactiques sur trois voies contre une IA déterministe à quatre difficultés.
- Factions asymétriques : Couvée et Sang acide, Chasse et Trophées, Escouades et technologie, Pathogène et mutation, Hybrides et synergies croisées.
- Boosters de neuf cartes, fabrication, désassemblage et protection de malchance.
- Campagne de huit missions avec règles de scénario, récompenses, progression, niveaux et succès.
- Tutoriel/règles accessibles depuis le jeu, synthèse audio locale et préférences de mouvement.
- Sauvegarde locale v3, reprise des duels, export/import JSON validé et migration des anciennes sauvegardes.
- PWA installable avec cache hors ligne complet.

## Règles essentielles

Un deck contient exactement 30 cartes, au maximum trois exemplaires d'une même carte. Une identité autorise ses cartes et les cartes Neutres. Les Hybrides peuvent aussi recruter six unités de soutien Humaines ou Xénomorphes non synthétiques de coût 2 ou moins. Chaque commandant commence avec 8 000 PV et cinq cartes (les difficultés supérieures et le boss renforcent l'IA). L'énergie maximale augmente au fil des tours jusqu'à dix. Les unités occupent l'une des trois voies, les Tactiques produisent un effet immédiat, les Equipements renforcent une unité et un seul Lieu peut être actif.

La victoire revient au premier commandant qui réduit les PV adverses à zéro. Les effets Garde, Camouflage, Armure, Ruée, Sang acide, Couvée, Trophée, Pathogène et autres mots-clefs sont résolus par le moteur testé dans `src/engine.js`.

## Lancer et vérifier

```bash
npm test
npm run check
npm run balance
npm run build
npm run start
```

- `npm run dev` sert directement les sources sur `http://127.0.0.1:4173`.
- `npm run build` produit une version statique vérifiée dans `dist/`.
- `npm run start` sert le build de production.
- `npm run balance` exécute des duels déterministes entre les cinq identités principales.
- `npm run balance -- --extended` exécute 1 000 parties avec l'IA de production des deux côtés. Ces decks générés et taux de victoire sont un outil de régression, pas une certification d'équilibre compétitif avec des decks optimisés par des joueurs.
- `npm run balance -- --seeds 1009,991009 --games-per-pair 100 --json` vérifie deux lots indépendants (2 000 duels) et les dix confrontations dans un rapport JSON.

## Reprendre et protéger une partie

Chaque action complète est enregistrée. « Sauvegarder & quitter » met le duel en pause ; le bouton « Reprendre le duel » reste disponible à l'accueil après fermeture du navigateur. Le checkpoint contient les cartes, effets temporaires, tours, scénario et état aléatoire. Si la fermeture intervient pendant une animation adverse, son tour repart du début avec le même tirage.

L'export JSON contient aussi le duel suspendu. Un checkpoint corrompu est écarté sans supprimer la collection ou la progression. Une capture impossible conserve le duel vivant ; un stockage refusé est annoncé, et l'export reste disponible. Les récompenses et la suppression du checkpoint sont enregistrées ensemble. Un onglet devenu ancien recharge la dernière sauvegarde au lieu d'écraser sa progression.

## Architecture

- `AVP_HUNT_HIVE_TCG_STANDALONE.html` : livraison originale immuable, conservée avec son SHA-256.
- `src/data.js` : catalogue, decks de départ, boosters, campagne et règles.
- `src/engine.js` : validation des decks, boosters, IA et moteur de duel.
- `src/duel-save.js` : checkpoints bornés, validation et restauration déterministe.
- `src/app.js` : interface, collection, progression, tutoriel, accessibilité et sauvegardes.
- `assets/styles.css` : design responsive desktop/mobile.
- `manifest.webmanifest` et `sw.js` : installation et fonctionnement hors ligne.
- `scripts/` : préparation, build, serveur, génération d'icônes et simulation d'équilibrage.
- `tests/` : provenance, données, règles, sauvegardes, PWA et configuration de production.

## Provenance et droits

Le détail de récupération vérifiable figure dans [SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md). Le cadre du projet fan et l'origine des actifs sont précisés dans [FAN_PROJECT_NOTICE.md](FAN_PROJECT_NOTICE.md).

Alien, Predator et Alien vs. Predator appartiennent à leurs ayants droit respectifs. Leur mention sert uniquement à identifier l'univers auquel ce projet fan rend hommage.
