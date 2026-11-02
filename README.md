# AVP: HUNT // HIVE TCG

Version 1.0.0 professionnelle du TCG tactique fan-made, jouable hors ligne dans un navigateur moderne. Cette édition part du standalone exact livré dans la conversation source, conserve ses 158 cartes et sépare désormais catalogue, moteur de règles, interface, styles et couche PWA.

> Projet non commercial et non officiel. Aucun asset visuel ou sonore officiel n'est embarqué. Les 158 cartes et 16 scènes utilisent des créations OpenAI ImageGen originales, contrôlées par manifeste et optimisées en WebP; le SVG procédural sert uniquement de repli hors ligne. Les citations reconnaissables de l'ancien catalogue ont été remplacées par des textes originaux dans la version jouable. L'archive historique exacte reste dans Git pour la provenance, mais n'est pas déployée.

## Contenu jouable

- **314 cartes jouables** : 158 cartes de la version historique et 156 cartes supplémentaires, en sept classes explicites (Personnages, Créatures, Armes, Équipements, Véhicules, Actions, Lieux). Les sept raretés historiques sont conservées ; quatorze finitions sont documentées pour les futures vagues.
- Trois decks de départ historiques intacts + **20 nouveaux préconstruits de 45 cartes** (30 principales + 15 cartes alternatives offertes dans la collection), génération/remélange déterministe de compositions variées, constructeur de 30 cartes, jusqu'à **32 decks sauvegardés**.
- Duels tactiques sur trois voies contre une IA déterministe à quatre difficultés.
- Factions asymétriques : Couvée et Sang acide, Chasse et Trophées, Escouades et technologie, Pathogène et mutation, Hybrides et synergies croisées.
- **Huit boosters jouables de neuf cartes**, dont Tantalus (TF28) et MNEMOSYNE (HA29), fabrication, désassemblage et protection de malchance. Les tailles variables de boosters inscrites dans `content-plan/` restent une proposition non activée.
- Campagne de huit missions avec règles de scénario, récompenses, progression, niveaux et succès.
- Tutoriel/règles accessibles depuis le jeu, synthèse audio locale et préférences de mouvement.
- Sauvegarde locale v3, reprise des duels, export/import JSON validé et migration des anciennes sauvegardes.
- PWA installable avec shell hors ligne complet, illustration d'accueil précachée et cache visuel à la demande borné à 80 images.

## Règles essentielles

Un deck contient exactement 30 cartes, au maximum trois exemplaires d'une même carte. Une identité autorise ses cartes et les cartes Neutres. Les Hybrides peuvent aussi recruter six unités de soutien Humaines ou Xénomorphes non synthétiques de coût 2 ou moins. Chaque commandant commence avec 8 000 PV; le premier joueur reçoit cinq cartes et le second six afin de compenser le tempo d'ouverture (les difficultés supérieures et le boss renforcent l'IA). L'énergie maximale augmente au fil des tours jusqu'à dix. Les unités occupent l'une des trois voies, les Tactiques produisent un effet immédiat, les Equipements renforcent une unité et un seul Lieu peut être actif.

La victoire revient au premier commandant qui réduit les PV adverses à zéro. Les effets Garde, Camouflage, Armure, Ruée, Sang acide, Couvée, Trophée, Pathogène et autres mots-clefs sont résolus par le moteur testé dans `src/engine.js`.

## Préparer, vérifier et publier

Les PNG maîtres, les briefs et le registre de notation restent dans le dossier privé `../art-originals/` et ne sont jamais envoyés sur Vercel. La vague actuellement publiée est une vague v1 figée : sa provenance est valide, mais elle n'est pas certifiée par la grille morphologique v2 et ne doit jamais être présentée comme telle.

Initialisation unique d'une vague de remédiation v2 :

```bash
npm run generate:art-fidelity-map
npm run validate:art-fidelity -- --contract-only
npm run init:art-fidelity
npm run queue:art-fidelity -- --json
```

`init:art-fidelity` crée 174 briefs et 174 entrées privées en état `pending`; il refuse d'écraser un registre existant. Chaque image est ensuite générée dans une composition originale, inspectée à sa résolution native et au format carte, puis notée sur les sept axes du contrat. Une proposition sous 95/100, un axe sous 90/100, une ancre absente ou un défaut bloquant est rejeté et doit être régénéré. Après six échecs, le brief doit être réécrit sans abaisser le seuil.

Publication d'une vague v2 entièrement acceptée :

```bash
npm run validate:art-fidelity -- --release
npm run review:art -- --approve --reviewer "Nom du relecteur"
npm run prepare:art
npm run verify:release
npm run start
```

- `npm run generate:art-fidelity-map` vérifie la correspondance exacte des 158 cartes et 16 scènes avec les profils morphologiques versionnés.
- `npm run validate:art-fidelity -- --release` exige 174 décisions `accepted`, un score global d'au moins 95/100, chaque axe à 90/100 minimum, toutes les ancres obligatoires et zéro défaut bloquant.
- `npm run queue:art-fidelity` classe les images non acceptées par priorité P0/P1/P2 afin que chaque rejet soit réellement repris.
- `npm run review:art -- --approve --reviewer "..."` exige une approbation explicite et attribuée, décode les 174 PNG, recoupe les briefs et le registre v2, puis enregistre les agrégats publiables et chaque SHA-256 dans le fichier privé `../art-originals/review.json`.
- `npm run prepare:art` refuse tout master différent de la revue, produit les WebP dans un staging isolé, puis remplace atomiquement le manifeste, le registre et les dérivés; une erreur restaure la version publique précédente.
- `npm run verify:release` enchaîne syntaxe, tests fonctionnels et de sécurité, simulation déterministe de 2 000 duels et build final. La release échoue en cas de partie plafonnée, biais de siège supérieur à 7 points, spread global supérieur à 15 points ou confrontation d'un lot au-delà de 75/25.
- `npm run vercel-build` est la garde exécutée par Vercel : syntaxe, tests complets, puis build vérifié.
- `npm run dev` sert directement les sources sur `http://127.0.0.1:4173`.
- `npm run build` produit une version statique vérifiée dans `dist/`.
- `npm run start` sert le build de production.
- `npm run balance` exécute des duels déterministes entre les cinq identités principales.
- `npm run balance -- --extended` exécute 1 000 parties avec l'IA de production des deux côtés. Ces decks générés et taux de victoire sont un outil de régression, pas une certification d'équilibre compétitif avec des decks optimisés par des joueurs.
- `npm run balance -- --seeds 1009,991009 --games-per-pair 100 --json` vérifie deux lots indépendants (2 000 duels) et les dix confrontations dans un rapport JSON.

Publication de `main` :

```bash
git push origin main
npx vercel --prod --yes
```

Après déploiement, vérifier `https://avp-hunt-hive-tcg.vercel.app` sur bureau et mobile : accueil, collection, boosters, campagne et duel, chargement de toutes les images visibles, console sans erreur, installation PWA, mode hors ligne, réponses HTTP 200, en-têtes de sécurité, WebP et refus des chemins sensibles. En cas d’échec, ne pas promouvoir la release et restaurer le dernier déploiement Vercel prêt.

## Reprendre et protéger une partie

Chaque action complète est enregistrée. « Sauvegarder & quitter » met le duel en pause ; le bouton « Reprendre le duel » reste disponible à l'accueil après fermeture du navigateur. Le checkpoint contient les cartes, effets temporaires, tours, scénario et état aléatoire. Si la fermeture intervient pendant une animation adverse, son tour repart du début avec le même tirage.

L'export JSON contient aussi le duel suspendu. Un checkpoint corrompu est écarté sans supprimer la collection ou la progression. Une capture impossible conserve le duel vivant ; un stockage refusé est annoncé, et l'export reste disponible. Les récompenses et la suppression du checkpoint sont enregistrées ensemble. Un onglet devenu ancien recharge la dernière sauvegarde au lieu d'écraser sa progression.

## Architecture

- `AVP_HUNT_HIVE_TCG_STANDALONE.html` : livraison originale immuable, conservée avec son SHA-256.
- `src/data.js` : catalogue, decks de départ, boosters, campagne et règles.
- `src/art-manifest.js` et `assets/art/manifest.json` : registre client et preuve d'intégrité des 174 créations ImageGen.
- `art-direction/` : contrat de fidélité, 58 profils morphologiques et correspondance versionnée des 174 assets.
- `src/engine.js` : validation des decks, boosters, IA et moteur de duel.
- `src/duel-save.js` : checkpoints bornés, validation et restauration déterministe.
- `src/app.js` : interface, collection, progression, tutoriel, accessibilité et sauvegardes.
- `assets/styles.css` : design responsive desktop/mobile.
- `manifest.webmanifest` et `sw.js` : installation et fonctionnement hors ligne.
- `scripts/init-art-fidelity-wave.mjs`, `validate-art-fidelity.mjs` et `art-retry-queue.mjs` : briefs privés, preuve de notation stricte et file de reprises.
- `scripts/review-art.mjs` : approbation attribuée, contrôle croisé v2 et empreintes privées des 174 maîtres.
- `scripts/prepare-art.mjs` : préparation atomique et réversible des WebP publics.
- `scripts/` : build, serveur, génération d'icônes et simulation d'équilibrage.
- `tests/` : provenance, données, règles, sauvegardes, couverture artistique, PWA et configuration de production.

## Provenance et droits

Le détail de récupération vérifiable figure dans [SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md). Le cadre du projet fan et l'origine des actifs sont précisés dans [FAN_PROJECT_NOTICE.md](FAN_PROJECT_NOTICE.md). La provenance, le contrat créatif et les contrôles des illustrations sont documentés dans [ARTWORK_PROVENANCE.md](ARTWORK_PROVENANCE.md).

Alien, Predator et Alien vs. Predator appartiennent à leurs ayants droit respectifs. Leur mention sert uniquement à identifier l'univers auquel ce projet fan rend hommage.

## Extension de gameplay 1.1.0-wave1 — depuis Alien_base

La couche `src/expansion.js` se charge après `src/data.js`, avant le moteur. Elle ajoute **156 cartes nouvelles** liées à des identifiants documentaires de `darknigthmare/alien_base` (`main@e65b75a6bfd1284dbac746102fdbae4fc5a3786b`). Le fichier historique reste intact et les 158 illustrations originelles sont toujours vérifiées par le contrat d’art. Les nouvelles cartes ont pour le moment des **substituts SVG procéduraux**, pas des illustrations morphologiques 1:1 validées.

Les `cardClass` ajoutées ne remplacent pas les quatre types historiques du moteur (`UNIT / EQUIPMENT / TACTIC / LOCATION`). Cela préserve les sauvegardes, la détermination des cibles et les effets existants. Les innovations actives :
- **Personnage :** unité pouvant servir de pilote ; **Créature :** combattant biologique avec effets de faction.
- **Véhicule :** unité blindée nécessitant un Personnage de sa faction sur le plateau pour être déployée et pouvoir attaquer. Avec équipage : +200 ATK et +200 PV (règle du TCG).
- **Arme :** carte attachée donnant des bonus ATK et disposant d’un emplacement exclusif (une arme *nouvelle* par unité). Les équipements historiques ne sont pas restreints rétroactivement.
- **Équipement :** protection, détection ou support, pouvant être combinés avec une arme.
- **Action :** effet immédiat de pioche, attaque ciblée, contrôle, énergie ou renforcement ; **Lieu :** bonus de terrain et entretien de votre commandant.
- **Decks :** 20 recettes de structure/thème pour les cinq factions ; import sans retrait de cartes ni écrasement d’ancien deck et bouton « Remélanger » pour générer une autre composition. Le tirage des cartes dans le duel était déjà aléatoire et le reste.

La présence d'une entité dans `Alien_base` n'atteste **pas** son statut canon ni la fidélité 1:1 de l'effet proposé. Les entrées originales Tantalus / Hive Ascension sont marquées comme créations du projet. Les modèles physiques de 45 cartes ne modifient **pas** le format de duel de 30 cartes.

Contrôles dédiés : `node --test tests/expansion-gameplay.test.mjs`. Les cartes nouvellement jouables ne couvrent pas encore les **2 602 identités** de conception planifiées dans `content-plan/`. Elles constituent une première vague vérifiable, à équilibrer et illustrer avant mise en production.
