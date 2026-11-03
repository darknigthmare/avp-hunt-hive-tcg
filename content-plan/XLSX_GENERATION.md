# Générer le catalogue Excel

Le classeur courant [AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx](AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx) réunit les tables du programme éditorial et les cartes réellement jouables. Ses **32 onglets** décrivent **2 021 cartes**, **659 recettes**, **32 505 positions** principales/de réserve, **24 boosters actifs** et **54 règles détaillées**. Les compatibilités d’armes et d’appareils, ressources et chaînes de cycle sont comptées depuis le moteur lors de chaque export ; l’édition courante compte **1 144 compatibilités et 239 entrées de combinaisons Ruche**, soit **1 383 relations**, consignées dans [le rapport de validation](../reports/qa/workbook-validation-2026-11-03.json).

Le catalogue comprend les **891 cartes historiques de l’édition 1.3**, **985 cartes Arsenal** et **145 cartes de cycles**. Les tables exposent le texte complet, les mots-clés, l’effet, les ressources, la provenance et le numéro de collection. Les **sept raretés actives** restent distinctes du programme de **30 sets / 2 602 concepts / 2 853 impressions / 14 finitions**. [Périmètre de l’audit](COMPLETENESS_AUDIT_2026-11-03.md).

## Données et contrôles

Les CSV versionnés décrivent les extensions, produits, finitions, références et listes de decks. Le manifeste `runtime-modules.json` définit l’ordre commun des modules du jeu ; `scripts/runtime-loader.mjs` exécute ce catalogue pour les exports et les contrôles. Les compatibilités, les chaînes de la Ruche et les ressources Yautja sont dérivées des propriétés réellement interprétées par le moteur.

Les trois groupes de recettes sont conservés séparément :

| Groupe | Recettes | Positions principales et réserves | Listes |
| --- | ---: | ---: | --- |
| Production historique | 280 | 15 450 | `decklists-playable.csv` |
| Doctrines asymétriques MX | 38 | 1 710 | `asymmetric-decklists.csv` |
| Compléments Arsenal et cycles | 341 | 15 345 | `complete-decklists.csv` |
| **Index courant** | **659** | **32 505** | `22_DECKS_COMPLETS` |

Les nouveaux onglets `27_ARSENAL_COUVERTURE`, `28_RUCHE_COUVERTURE` et `31_COUVERTURE_DOMAINES` montrent respectivement les statuts documentaires d’arsenal, les 105 sujets biologiques et leurs routes, et les 17 classes de cartes. `29_DECKS_COMPLEMENTS` et `30_LISTES_COMPLEMENTS` présentent les 341 recettes ajoutées. Les tables des raretés et boosters actifs restent distinctes du programme éditorial dans leurs onglets respectifs.

Le générateur vérifie les identifiants, noms, coûts et statistiques contre le jeu. Il compare chaque exemplaire du principal et de la réserve à la recette exécutée. Les compteurs de synthèse et de factions sont des formules recalculées puis confrontées à des comptages indépendants. Une modification temporaire d’un total de boîte vérifie le recalcul ; la valeur est restaurée avant l’export.

Les empreintes SHA-256 des données, modules de règles et générateur sont enregistrées, ainsi que celle du fichier Excel. La génération s’arrête si une source change pendant le travail, pour empêcher un classeur contenant des éléments issus de révisions différentes.

## Génération complète

Depuis la racine du dépôt :

```bash
node scripts/sync-production-decks.mjs --write
node scripts/sync-asymmetric-content.mjs --write
node scripts/sync-complete-content.mjs --write
python3 content-plan/build_xlsx.py
```

Le point d’entrée Python prépare un répertoire temporaire isolé et appelle l’unique implémentation `build_xlsx.mjs`. Il utilise le runtime primaire fourni par `CODEX_PRIMARY_RUNTIME_NODE` et `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Aucun paquet n’est installé dans le dépôt.

La sortie est placée dans `outputs/<identifiant du workspace>/`, à côté du dépôt, avec une copie identique sous `content-plan/AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx` pour le versionnement. Le rapport `workbook-validation.json`, l’inspection des formules et les aperçus des **32 onglets** accompagnent le classeur. Une copie du rapport est enregistrée sous `reports/qa/workbook-validation-<date du manifeste>.json` ; son champ `output` désigne la copie dans le dépôt.

Une sortie explicite peut être passée au point d’entrée JavaScript avec `--root /chemin/absolu/du/depot --out /chemin/absolu/outputs/identifiant`. Ce point d’entrée s’exécute depuis un répertoire temporaire contenant un lien `node_modules` vers le runtime primaire. L’option `--no-render` réduit les aperçus pendant un diagnostic ; la génération destinée à la livraison s’effectue sans cette option.

Pour une précision limitée aux textes des règles, `python3 content-plan/build_xlsx.py --refresh-rules` met à jour le tableau des **54 règles** du dernier export et son rendu. Cette commande exige que les empreintes des sources correspondent au rapport du dernier export complet. Une modification des cartes, recettes ou règles exécutées impose une nouvelle génération complète.

## Vérification du classeur versionné

La vérification utilise Python 3 standard et Node, sans dépendance de création de classeur :

```bash
npm run check:complete-content
python3 scripts/verify-catalogue-xlsx.py
```

Le script lit le format OOXML et contrôle l’intégrité du fichier, les empreintes, les onglets et tables, les cellules issues des CSV, les textes et effets du catalogue exécuté, l’index des **659 decks** et ses totaux. Les valeurs de formule mises en cache sont comparées avec des comptes indépendants. Le recalcul est effectué pendant la génération ; la vérification relit les résultats et leurs preuves.

Après une modification des cartes, decks ou règles, régénérer ensemble les CSV, le classeur et son rapport. Une empreinte obsolète provoque un échec de vérification. Pour contrôler également le gameplay et la Collection :

```bash
npm run validate:content-plan
npm run test:complete
npm run qa:complete -- --out=reports/qa/complete-2026-11-03.json
```

Les scénarios navigateur ordinateur/mobile sont inclus dans `npm run qa:browser -- http://127.0.0.1:4173`, après construction et démarrage du serveur. Les résultats de CI et de déploiement restent attachés à la révision effectivement exécutée.

## Preuves et état de validation

Le [rapport du classeur](../reports/qa/workbook-validation-2026-11-03.json) précise le nom du fichier, les effectifs de chaque onglet, le nombre exact de compatibilités et de combinaisons, les empreintes, les contrôles de recalcul et les onglets rendus. Pour cette édition, vérifier `cards: 2021`, `decks: 659`, `positions: 32505`, `boosters: 24`, `sheetCount: 32`, `rules: 54` et `renderedSheets: 32`. Un rapport portant encore le nom de l’ancien classeur ou les effectifs 891/318 décrit le lot 1.3 et ne valide pas le nouvel export.

Le [rapport de QA complète](../reports/qa/complete-2026-11-03.json) traite séparément le moteur, les ressources, les 341 nouvelles recettes et les reprises déterministes. La validation de l’Excel, celle du jeu, celle du navigateur et le statut de publication ont chacun leurs preuves ; la documentation ne présume aucune fusion ni publication à partir d’un contrôle local.

### Historique du classeur 1.3

Le précédent `AVP_HUNT_HIVE_TCG_Catalogue_318_Decks.xlsx` décrivait 891 cartes, 318 recettes, 17 160 positions, 19 boosters, 27 onglets et 46 règles. Ses 399 relations se répartissaient en 286 compatibilités d’armement et 113 entrées de chaînes de la Ruche. Ces décomptes sont conservés comme état historique du 3 novembre 2026, avant l’édition complète.

La QA moteur de cette étape comptait 177 duels, 4 256 captures/restaurations et 1 130 continuations déterministes ; le [rapport de réconciliation](../reports/qa/merge-validation-2026-11-03.json) documente l’état de l’ancien lot. Les résultats courants doivent être lus dans les rapports de l’édition 1.4 avec leurs empreintes correspondantes.

## Portée

Les chiffres jouables et le programme éditorial sont séparés. Une référence Alien_base établit la provenance de l’identité ; statistiques, modules, routes de reproduction et évolutions restent des adaptations du TCG. Les 233 références d’arsenal intégrées, huit alias couverts et 121 recherches non admises restent distingués. Le classeur ne certifie pas automatiquement la fidélité à chaque œuvre et ne crée aucune illustration.
