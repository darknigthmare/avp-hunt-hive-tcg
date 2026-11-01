# AVP: HUNT // HIVE TCG

Version 1.0.0 professionnelle du TCG tactique fan-made, jouable hors ligne dans un navigateur moderne. Cette édition part du standalone exact livré dans la conversation source, conserve ses 158 cartes et sépare désormais catalogue, moteur de règles, interface, styles et couche PWA.

> Projet non commercial et non officiel. Aucun asset visuel ou sonore officiel n'est embarqué. Les 158 cartes et 16 scènes utilisent des créations OpenAI ImageGen originales, contrôlées par manifeste et optimisées en WebP; le SVG procédural sert uniquement de repli hors ligne. Les citations reconnaissables de l'ancien catalogue ont été remplacées par des textes originaux dans la version jouable. L'archive historique exacte reste dans Git pour la provenance, mais n'est pas déployée.

## Contenu jouable

- 158 cartes, cinq identités jouables plus les cartes Neutres, et sept raretés.
- Trois decks de départ, constructeur de decks de 30 cartes et collection persistante.
- Duels tactiques sur trois voies contre une IA déterministe à quatre difficultés.
- Factions asymétriques : Couvée et Sang acide, Chasse et Trophées, Escouades et technologie, Pathogène et mutation, Hybrides et synergies croisées.
- Boosters de neuf cartes, fabrication, désassemblage et protection de malchance.
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

## Encyclopédie Alien_base — fédération v3

Le jeu conserve **ses 158 cartes**, ses règles, ses boosters, sa campagne, ses illustrations et ses sauvegardes. La [PR #19 Alien_base](https://github.com/darknigthmare/alien_base/pull/19), empilée sur la [PR #18](https://github.com/darknigthmare/alien_base/pull/18), fournit un export public sûr du registre **v1 (68 dossiers)** et des **158 correspondances avec le registre v2 (632 entités)**.

Dans le jeu, **Collection → Codex Alien_base** (ou l'onglet Archive sur ordinateur) permet de rechercher par catégorie et continuité, consulter les œuvres et les notes de référence. Les cartes associées restent des rapprochements à examiner, pas des identités biologiques automatiquement validées. Le détail des cartes présente aussi le statut des anciennes sources, neuf liens biologiques explicites, les archives v1 possibles et 28 rapprochements inter-jeux non certifiés.

Un consommateur public embarque le snapshot autonome `src/alien-base.js` ; aucun jeton ni appel réseau au dépôt privé n'est nécessaire. Pour comparer une nouvelle version de la base, cloner les deux dépôts frères, se placer sur la branche fédérée Alien_base, puis exécuter :

```bash
node scripts/sync-alien-base-unified.mjs --base ../alien_base
# Pour générer une version explicitement revue :
node scripts/sync-alien-base-unified.mjs --base ../alien_base --publish
npm run verify:release
```

Les fiches ne confèrent pas de cartes supplémentaires ni de droits de réutiliser des images sous licence. **Les 68 dossiers publics ne signifient pas que les 632 entités privées sont certifiées 1:1.** Les anciennes références Excel doivent encore être vérifiées individuellement.
