# AVP: HUNT // HIVE TCG

TCG tactique fan-made, jouable hors ligne dans un navigateur moderne. L’édition asymétrique conserve les 158 cartes du standalone d’origine et porte le catalogue actif à **891 cartes, 318 recettes de decks et 19 boosters**. Le catalogue, le moteur de règles, l’interface, les styles et la couche PWA sont séparés en modules testables.

> Projet fan non commercial et non officiel. Les visuels d’origine restent inchangés ; cette consolidation n’ajoute aucune illustration. Les nouvelles cartes conservent leurs substituts procéduraux. La provenance des actifs et du standalone est documentée dans les fichiers dédiés.

## Contenu jouable

- **891 cartes jouables** : 158 historiques, 156 cartes de vague 1, 342 de vague 2 et 235 cartes asymétriques. Les classes couvrent personnages, créatures, armes, équipements, véhicules, actions, lieux, munitions, modules, attaques spécialisées, œufs, hôtes, évolutions, biomasse, plasma, trophées et honneur. Les sept raretés historiques sont conservées ; quatorze finitions sont documentées pour les futures vagues.
- Trois decks de départ historiques intacts et **318 recettes préconstruites** : 70 modèles de factions, 210 recettes des collections et 38 doctrines asymétriques. Toutes utilisent 30 cartes principales et une réserve de 15, 20 ou 45 cartes selon le produit. Remélange déterministe, constructeur de 30 cartes et jusqu’à **32 decks sauvegardés**.
- Duels tactiques sur trois voies contre une IA déterministe à quatre difficultés.
- Factions asymétriques : Couvée et Sang acide, Chasse et Trophées, Escouades et technologie, Pathogène et mutation, Hybrides et synergies croisées.
- **19 boosters jouables**, avec des paquets de 5, 7 ou 9 cartes selon leur gamme : huit pools historiques, huit aperçus d’extensions et trois doctrines asymétriques. Les aperçus sont identifiés comme partiels. Fabrication, désassemblage et protection de malchance restent disponibles.
- Campagne de huit missions avec règles de scénario, récompenses, progression, niveaux et succès.
- Tutoriel/règles accessibles depuis le jeu, synthèse audio locale et préférences de mouvement.
- Sauvegarde locale v3, reprise des duels, export/import JSON validé et migration des anciennes sauvegardes.
- PWA installable avec shell hors ligne complet, illustration d'accueil précachée et cache visuel à la demande borné à 80 images.
- Codex Alien_base hors ligne, consultable depuis la Collection et l’Archive, avec recherches par catégorie et continuité et références associées aux cartes historiques.

Le classeur versionné [Catalogue des 318 decks](content-plan/AVP_HUNT_HIVE_TCG_Catalogue_318_Decks.xlsx) contient **27 onglets**, **17 160 positions de cartes** dans les decks et leurs réserves, et **46 règles détaillées**. Ses **399 relations** se décomposent en **286 compatibilités d’armement** et **113 entrées de chaînes de la Ruche**. Il conserve les 652 références documentaires Alien_base et distingue le catalogue actif du programme éditorial : **30 sets, 2 602 concepts, 2 853 impressions et 14 finitions prévues**, pour **7 raretés actuellement implémentées**. Les concepts planifiés ne sont pas tous des cartes jouables.

## Validation de la consolidation du 3 novembre 2026

| Contrôle | État documenté |
| --- | --- |
| Moteur et sauvegardes, exécution locale | **PASS** : 177 duels terminés, 4 256 captures/restaurations et 1 130 continuations déterministes |
| Préservation du contenu | 891 identifiants de cartes, 318 recettes et 19 boosters conservés ; cartes historiques, starters, raretés et campagne inchangés |
| Catalogue Excel | 27 onglets ; cartes et positions recoupées avec le moteur, formules et empreintes des sources contrôlées |
| Navigateur ordinateur/mobile | Les scénarios de gameplay, pause/reprise et Codex sont réunis dans `scripts/qa-browser.mjs` et exécutés par GitHub Actions sur chaque révision de PR |
| GitHub Actions et aperçu Vercel | Consulter les contrôles du commit de la [PR #4](https://github.com/darknigthmare/avp-hunt-hive-tcg/pull/4) ; le statut de déploiement est distinct des tests du jeu |

Les preuves locales figurent dans [le rapport de continuation](reports/qa/continuation-2026-11-03.json), [les duels asymétriques](reports/qa/asymmetric-2026-11-03.json) et [la validation du classeur](reports/qa/workbook-validation-2026-11-03.json). La consolidation initiale a aussi passé les tests et le navigateur dans le [workflow 41615223534](https://github.com/darknigthmare/avp-hunt-hive-tcg/actions/runs/41615223534), sur `15b2e1e`, avant la réconciliation avec le Codex de `main`. Le [rapport de réconciliation](reports/qa/merge-validation-2026-11-03.json) documente les **244 tests réussis**, les 196 fichiers publics et les contrôles du moteur et du classeur sur la version réunie. Les tests de régression vérifient le fonctionnement ; l’équilibrage compétitif et le rapprochement éditorial des 30 sets restent des travaux distincts.

## Règles essentielles

Un deck contient exactement 30 cartes, au maximum trois exemplaires d'une même carte. Une identité autorise ses cartes et les cartes Neutres. Les Hybrides peuvent aussi recruter six unités de soutien Humaines ou Xénomorphes non synthétiques de coût 2 ou moins. Chaque commandant commence avec 8 000 PV; le premier joueur reçoit cinq cartes et le second six afin de compenser le tempo d'ouverture (les difficultés supérieures et le boss renforcent l'IA). L'énergie maximale augmente au fil des tours jusqu'à dix. Les unités occupent l'une des trois voies, les Tactiques produisent un effet immédiat, les Equipements renforcent une unité et un seul Lieu peut être actif.

La victoire revient au premier commandant qui réduit les PV adverses à zéro. Les effets Garde, Camouflage, Armure, Ruée, Sang acide, Couvée, Trophée, Pathogène et autres mots-clefs sont résolus par le moteur testé dans `src/engine.js`.

## Préparer, vérifier et publier

Contrôles du gameplay et du catalogue depuis la racine du dépôt :

```bash
npm run check
npm test
npm run validate:content-plan
npm run check:playable-decks
npm run check:asymmetric-content
python3 scripts/verify-catalogue-xlsx.py
npm run qa:asymmetric
npm run build
npm run start
```

Puis, dans un second terminal avec Chrome ou Chromium installé :

```bash
npm run qa:browser -- http://127.0.0.1:4173
```

La [génération et la vérification du classeur](content-plan/XLSX_GENERATION.md) décrivent les dépendances du générateur et les contrôles du fichier versionné.

### Workflow des illustrations, conservé pour une vague ultérieure

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

### Procédure de publication en production

Après fusion d’une PR validée, l’intégration GitHub/Vercel déclenche la publication de `main`. Pour une publication manuelle autorisée :

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
- `src/expansion.js`, `src/expansion-wave2.js` et `src/asymmetric-cards.js` : ajouts des vagues AX, BX et MX.
- `src/deck-productions.js` et `src/asymmetric-decks.js` : recettes préconstruites et remélange avec leurs dépendances.
- `src/alien-base.js` : snapshot documentaire public du Codex, sans accès au dépôt privé pendant le jeu.
- `src/art-manifest.js` et `assets/art/manifest.json` : registre client et preuve d'intégrité des 174 créations ImageGen.
- `art-direction/` : contrat de fidélité, 58 profils morphologiques et correspondance versionnée des 174 assets.
- `src/engine.js` : validation des decks, boosters, IA et moteur de duel.
- `src/asymmetric-rules.js` : armes, munitions, modules, fusion, biomasse, plasma et honneur.
- `src/duel-save.js` : checkpoints bornés, validation et restauration déterministe.
- `src/app.js` : interface, collection, progression, tutoriel, accessibilité et sauvegardes.
- `assets/styles.css` : design responsive desktop/mobile.
- `manifest.webmanifest` et `sw.js` : installation et fonctionnement hors ligne.
- `scripts/init-art-fidelity-wave.mjs`, `validate-art-fidelity.mjs` et `art-retry-queue.mjs` : briefs privés, preuve de notation stricte et file de reprises.
- `scripts/review-art.mjs` : approbation attribuée, contrôle croisé v2 et empreintes privées des 174 maîtres.
- `scripts/prepare-art.mjs` : préparation atomique et réversible des WebP publics.
- `scripts/` : build, serveur, génération d'icônes et simulation d'équilibrage.
- `tests/` : provenance, données, règles, sauvegardes, couverture artistique, PWA et configuration de production.
- `content-plan/` : CSV, manifeste, classeur versionné et générateur ; `reports/qa/` : preuves de validation locale.

## Provenance et droits

Le détail de récupération vérifiable figure dans [SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md). Le cadre du projet fan et l'origine des actifs sont précisés dans [FAN_PROJECT_NOTICE.md](FAN_PROJECT_NOTICE.md). La provenance, le contrat créatif et les contrôles des illustrations sont documentés dans [ARTWORK_PROVENANCE.md](ARTWORK_PROVENANCE.md).

Alien, Predator et Alien vs. Predator appartiennent à leurs ayants droit respectifs. Leur mention sert uniquement à identifier l'univers auquel ce projet fan rend hommage.

## Historique — vague 1.1.0-wave1 depuis Alien_base

La couche `src/expansion.js` se charge après `src/data.js`, avant le moteur. Cette vague ajoutait **156 cartes AX** liées à des identifiants documentaires de `darknigthmare/alien_base` (`main@e65b75a6bfd1284dbac746102fdbae4fc5a3786b`) et portait le catalogue à 314 cartes. Le fichier historique reste intact et les 158 illustrations originelles sont toujours vérifiées par le contrat d’art. Les cartes ajoutées utilisent des substituts SVG procéduraux.

Les `cardClass` ajoutées ne remplacent pas les quatre types historiques du moteur (`UNIT / EQUIPMENT / TACTIC / LOCATION`). Cela préserve les sauvegardes, la détermination des cibles et les effets existants. Les apports de cette vague étaient :

- **Personnage :** unité pouvant servir de pilote ; **Créature :** combattant biologique avec effets de faction.
- **Véhicule :** unité blindée nécessitant un Personnage de sa faction sur le plateau pour être déployée et pouvoir attaquer. Avec équipage : +200 ATK et +200 PV (règle du TCG).
- **Arme :** carte attachée donnant des bonus ATK et disposant d’un emplacement exclusif (une arme *nouvelle* par unité). Les équipements historiques ne sont pas restreints rétroactivement.
- **Équipement :** protection, détection ou support, pouvant être combinés avec une arme.
- **Action :** effet immédiat de pioche, attaque ciblée, contrôle, énergie ou renforcement ; **Lieu :** bonus de terrain et entretien de votre commandant.
- **Decks :** 20 recettes de structure/thème pour les cinq factions ; import sans retrait de cartes ni écrasement d’ancien deck et bouton « Remélanger » pour générer une autre composition. Le tirage des cartes dans le duel était déjà aléatoire et le reste.

La présence d'une entité dans `Alien_base` n'atteste **pas** son statut canon ni la fidélité 1:1 de l'effet proposé. Les entrées originales Tantalus / Hive Ascension sont marquées comme créations du projet. Les modèles physiques de 45 cartes ne modifient **pas** le format de duel de 30 cartes.

Contrôles dédiés : `node --test tests/expansion-gameplay.test.mjs`. Les cartes nouvellement jouables ne couvrent pas encore les **2 602 identités** de conception planifiées dans `content-plan/`. Elles constituent une première vague vérifiable, à équilibrer et illustrer avant mise en production.

## Historique de la vague 1.2.1 — 280 decks préconstruits

Cette vague rendait **210 recettes des 30 extensions sélectionnables dans le jeu**, en plus des 70 modèles existants, sans modifier les 158 cartes historiques. Elles étaient composées des 656 cartes alors jouables. Les identités futures de l’Excel restaient au stade de conception.

| Gamme de deck | Recettes en jeu | Deck de duel | Cartes de réserve | Total en boîte |
| --- | ---: | ---: | ---: | ---: |
| Starter | 5 | 30 | 15 | 45 |
| Structure | 25 | 30 | 15 | 45 |
| Construction | 90 | 30 | 45 | 75 |
| Spécial | 30 | 30 | 20 | 50 |
| Ligue | 60 | 30 | 15 | 45 |

Cette vague portait le jeu à **280 decks** (70 antérieurs + 210 nouveaux), avant les 38 doctrines décrites ci-dessous. Les recettes préservent au moins **5 unités de coût faible** au démarrage. Chacune est contrôlée pour les limites de copies, la faction, les réserves et l'import non destructif. La fonction de remélange régénère également la réserve adéquate.

Toutes les 30 extensions ne sont pas encore disponibles sous forme de boosters complets. Pour celles qui n’ont pas encore assez de cartes jouables de leur œuvre propre, le deck porte la mention **composition transversale provisoire**. Cette vague comptait **16 boosters, 7 raretés et 656 cartes**. Les **14 finitions** et les **2 853 impressions** de la feuille de route restent des objectifs éditoriaux.

**Fichiers et validations :** `src/deck-productions.js`, `tests/production-decks.test.mjs`, `content-plan/decks-playable.csv` (280 fiches), `content-plan/decklists-playable.csv` (15 450 positions), `scripts/sync-production-decks.mjs`. Lancer `npm run check:playable-decks` pour vérifier la parfaite correspondance avec le moteur et `npm run validate:content-plan` pour la cohérence de l'Excel. Tous les nouveaux visuels restent des SVG de substitution procéduraux.


## Édition asymétrique 1.3 — gameplay des trois grandes factions

Les **656 cartes des versions précédentes sont conservées** ; **235 nouvelles cartes dédiées** forment trois économies complémentaires : **Humains : 99 cartes**, **Ruche : 66**, **Yautja : 70**, portant le catalogue à **891 cartes jouables**. Les nouvelles cartes sont enregistrées dans `src/asymmetric-cards.js`, avec référence documentaire Alien_base et statut **mécanique TCG proposée, non canon certifié**. Aucun artwork n'a été créé ou modifié.

**Humains — paquet d'armes combinatoires.** Les Personnages portent une Arme, puis des cartes **Munitions** de famille compatible (10MM, CAL12, carburant, 9MM, précision, grenades, F44AA). Une arme de tir n'ajoute sa puissance que si elle peut payer sa consommation ; chaque attaque et carte Attaque spécialisée retire le nombre indiqué de charges. Les modules **Viseur, Crosse, Canon et Chargeur** s'attachent seulement à une famille d'arme compatible, un mod par emplacement, trois maximum. Les armes de corps-à-corps n'utilisent pas de munition. Les armements historiques restent compatibles avec leurs règles anciennes pour ne pas casser les decks existants.

**Xénomorphes — construction biologique.** Placez des cartes **Œuf**. Leur sacrifice permet de jouer un **Facehugger**, qui peut fusionner avec un **Hôte** Humain, quadrupède ou Yautja à l'aide d'une carte Fusion dédiée. Le **Chestburster** correspondant, présent dans le deck ou la main, remplace les deux matériaux sur le terrain. Les cartes **Biomasse**, la **Gelée royale concentrée** et les autres cartes Évolution permettent ensuite de transformer le Chestburster en caste adulte, puis en Prétorien et Reine, à condition de posséder la caste cible et de payer la ressource. L'immunité des synthétiques et les différences d'hôte sont traitées comme des règles de gameplay ; aucune fusion biologiquement non documentée n'est présentée comme canon.

**Yautja — chasse, trophées et énergie de plasma.** Les armes plasma dépensent une **Réserve de plasma** plafonnée à 12 ; à sec, elles n'accordent plus de bonus de tir. Les chasseurs accumulent des trophées et points d'**Honneur** lors des combats. Les cartes **Trophée**, **Recharge plasma** et **Rituel d’honneur** convertissent ces ressources en effets de ciblage, défense ou pioche (plafond Honneur 12). Les 7 raretés actuelles ne modifient jamais les statistiques.

**38 decks asymétriques supplémentaires** (30 cartes jouables + 15 alternatives), avec remélange qui conserve les ressources de leur archétype, et **3 boosters spécialisés** de neuf cartes : arsenal humain, fusion parasitaire, plasma/honneur. Totaux actifs : **891 cartes, 318 decks, 19 boosters**. Les 30 extensions théoriques (2 853 impressions) et leurs autres raretés restent distinctes du contenu réellement jouable.

**Compatibilité :** les nouvelles ressources Biomasse, Plasma, Honneur et Munitions sont vérifiées lors de la capture et restauration du duel. Les checkpoints historiques v1 sont toujours acceptés, sans ajout destructif de données. Les fichiers CSV de cartes/decks/positions sont situés dans `content-plan/` et testés par `npm run validate:content-plan`.

## Consolidation des règles et de l’Excel — 3 novembre 2026

Les chargeurs épuisés libèrent leurs emplacements pour permettre le rechargement. Les attaques spécialisées contrôlent la **famille d’arme, le calibre, les charges et la cible** avant toute dépense. Une fusion ou évolution vérifie que son résultat peut être invoqué avant de sacrifier ses matériaux. La construction des doctrines de la Ruche associe désormais les cartes de transformation à leurs résultats et respecte les œufs royaux. Le remélange des autres recettes évite les cartes spécialisées dépourvues de ressources.

Les bonus d'arme, de module et de munition s'appliquent avant le plancher à zéro des dégâts. À sec, l'attaque et la riposte utilisent les capacités de base ; une salve incomplète ne consomme pas les charges restantes. La fiche d'unité détaille les équipements, les charges, les coûts et les bonus offensifs actifs. L'IA Ruche conserve de la place pour réunir ses matériaux. Les éliminations alliées n'accordent ni trophée ni honneur ; les affiliations multiples, dont celle de Machiko, sont prises en compte.

Le **F44AA** est corrigé en fusil à impulsion balistique, conformément au registre central et à la [présentation des accessoires par Wētā Workshop](https://www.wetaworkshop.com/projects/alien-romulus). La famille `F44AA` du TCG représente des cartouches compatibles, sans inventer un calibre canon. Les trois anciennes cartes `CELLULE` migrent avec leurs charges restantes ; les IDs des cartes et recettes restent stables. Les sources des modules désignent désormais l'arme compatible, et les colonnes de provenance indiquent explicitement les adaptations de gameplay.

Les checkpoints historiques restent au format `avp-duel` v1 ; le champ `rulesVersion: 2` distingue les nouvelles règles de montage. Une arme déjà légalement attachée sous l’ancien moteur reste sur son porteur après migration, avec une exception limitée à cette unité et à cette arme. Cette exception ne permet aucune nouvelle pose incompatible. Les imports de nouvelles sauvegardes contrôlent la classe et la faction du porteur, l’emplacement d’arme, la compatibilité et les emplacements des modules, les six chargeurs actifs maximum et les plafonds de ressources.

Pour reconstruire le classeur après une modification du catalogue :

```bash
node scripts/sync-production-decks.mjs --write
node scripts/sync-asymmetric-content.mjs --write
python3 content-plan/build_xlsx.py
```

Le point d’entrée Python lance `content-plan/build_xlsx.mjs` avec `@oai/artifact-tool` dans un répertoire temporaire. L’export refuse les différences entre les CSV et le moteur, recalcule les formules et produit un aperçu des 27 onglets. Le fichier Excel est versionné avec ses sources reproductibles ; les commandes et rapports sont décrits dans [XLSX_GENERATION.md](content-plan/XLSX_GENERATION.md).

## Encyclopédie Alien_base — fédération v3

L’intégration du Codex préserve **les 158 cartes historiques** au sein du catalogue de **891 cartes**, ainsi que les nouveaux decks et les règles asymétriques. Son snapshot documentaire, introduit dans la PR #1, provient de la [PR #19 Alien_base](https://github.com/darknigthmare/alien_base/pull/19), empilée sur la [PR #18](https://github.com/darknigthmare/alien_base/pull/18) : un export public du registre **v1 (68 dossiers)** et les **158 correspondances avec le registre v2 (632 entités)**.

Dans le jeu, **Collection → Codex Alien_base** (ou l'onglet Archive sur ordinateur) permet de rechercher par catégorie et continuité, consulter les œuvres et les notes de référence. Les cartes associées restent des rapprochements à examiner, pas des identités biologiques automatiquement validées. Le détail des cartes présente aussi le statut des anciennes sources, neuf liens biologiques explicites, les archives v1 possibles et 28 rapprochements inter-jeux non certifiés.

Un consommateur public embarque le snapshot autonome `src/alien-base.js` ; aucun jeton ni appel réseau au dépôt privé n'est nécessaire. Pour comparer une nouvelle version de la base, cloner les deux dépôts frères, se placer sur la branche fédérée Alien_base, puis exécuter :

```bash
node scripts/sync-alien-base-unified.mjs --base ../alien_base
# Pour générer une version explicitement revue :
node scripts/sync-alien-base-unified.mjs --base ../alien_base --publish
npm run verify:release
```

Les fiches ne confèrent pas de cartes supplémentaires ni de droits de réutiliser des images sous licence. **Les 68 dossiers publics ne signifient pas que les 632 entités privées sont certifiées 1:1.** Les anciennes références Excel doivent encore être vérifiées individuellement.

### Mise à jour Alien_base du 2 novembre 2026

La mise à jour du snapshot préparée le 2 novembre comparait les PR du registre privé (#21–24), qui proposaient 652 identités, aux 632 de la branche fédérée. **La consultation du Codex n'ajoute pas de carte automatiquement.** Le Codex conserve deux sections de recherche hors ligne : 20 identités Yautja/Apex et 29 œuvres ou continuités Predator, avec trois alias historiques Alpha, Samurai et Viking et trois réserves biologiques (Royal Facehugger, Crusher, Offspring). Les six rapprochements nominaux entre personnages Apex et cartes TCG restent des propositions, y compris `Y_SCAR` ; l'alias Samurai vers `Y_SAMURAI` n'est pas une preuve d'identité universelle. Les 632 IDs du snapshot fédéré et les 158 liens historiques coexistent avec les 652 références documentaires du catalogue d’extensions ; ces périmètres ne constituent pas une certification canon commune.
