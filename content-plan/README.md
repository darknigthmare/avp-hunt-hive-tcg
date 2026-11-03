# AVP HUNT // HIVE TCG — Catalogue, decks et collections

**État courant, édition 1.4.0-complete du 3 novembre 2026 : 2 021 cartes jouables, 659 recettes de decks, 32 505 positions et 24 boosters.** Les 891 cartes précédentes restent exactement conservées. Le complément ajoute **985 cartes Arsenal et 145 cartes de cycles**, ainsi que **233 arsenaux et 108 recettes de cycle**. [Décomptes exécutables](manifest.json), [audit de complétude](COMPLETENESS_AUDIT_2026-11-03.md).

Le classeur [AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx](AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx) réunit **32 onglets et 54 règles détaillées**. Il conserve les tables historiques et ajoute la couverture des arsenaux, des sujets biologiques, des domaines et les nouvelles listes de decks. Les compatibilités, chaînes et ressources proviennent du moteur ; leurs comptes exacts figurent dans [le rapport de validation du classeur](../reports/qa/workbook-validation-2026-11-03.json).

Le programme éditorial de **30 sets, 2 602 concepts, 2 853 impressions et 14 finitions** reste suivi séparément. Les **sept raretés actives**, les trois départs historiques, les sauvegardes et le format de duel de 30 cartes sont préservés. Aucun nouveau visuel n’est généré pour ce lot.

## Couverture documentaire et règles jouables

| Périmètre | Couverture courante | Export |
| --- | --- | --- |
| Armes et équipements humains/Yautja | 233 références intégrées ; correspondance des 134 armes et 113 équipements historiques ; ressources et modules compatibles | `coverage-arsenal.csv` |
| Recherches d’arsenal | 129 lignes de recherche : 8 alias déjà représentés et 121 références non admises, sans carte extrapolée | `coverage-arsenal.csv` |
| Sujets biologiques | 105 sujets, 123 routes de cycle : 109 nouvelles recettes `HIVE_ROUTE` et 14 routes historiques | `coverage-hive.csv` |
| Domaines du jeu | 17 classes de cartes, répartition par faction et présence dans les recettes, dont 43 véhicules pilotés | `coverage-domains.csv` |

Les noms du registre central, profils écran, accessoires documentés et créations de projet restent qualifiés. L’intégration prouve qu’un sujet dispose d’une adaptation jouable ; elle ne certifie ni une biologie universelle ni des statistiques canoniques. Les armes de mêlée, les appareils et les disques réutilisables n’utilisent pas de munitions artificielles. Les charges des consommables sont représentées par leur carte à usage unique. Les modules génériques ajoutés sont identifiés comme créations du TCG.

La source documentaire de ce lot est `alien_base@e65b75a6bfd1284dbac746102fdbae4fc5a3786b`. Les exports publics gardent les identifiants, noms et informations utiles à la traçabilité ; les dossiers privés complets ne sont pas distribués. Aucun fetch vers le dépôt privé n’est effectué par le navigateur.

## Collection et complétion des decks

La Collection dispose des vues **Cartes**, **Progression** et **Par type de deck**. Elle affiche les cartes possédées sur le total, les exemplaires, doublons et jeux de trois, ainsi que les répartitions par faction, type, extension, rareté et gamme. Les gammes comptent les identités de cartes distinctes sans gonfler le total quand une même carte apparaît dans plusieurs recettes.

Pour une recette, la progression est calculée sur les exemplaires requis. Avec la réserve activée, une carte demandée deux fois dans le principal et une fois en réserve exige trois exemplaires possédés. Les trois départs historiques et les decks personnels sont également consultables ; ils s’ajoutent à l’affichage des 659 recettes du catalogue sans modifier ce décompte.

Les cartes manquantes, leur coût de fabrication et les liens vers armes, munitions, modules, opérations et transformations sont disponibles dans le détail. Le bouton **Créer le principal avec mes cartes** nécessite le principal complet dans l’inventaire et un emplacement de deck libre ; il ne fournit pas de cartes manquantes. L’inventaire peut être exporté en JSON. [Modèle](../src/collection.js), [tests](../tests/collection.test.mjs).

## Formats proposés pour les 30 extensions

| Gamme | Taille des extensions AVP | Cartes par paquet | Composition envisagée | Modèle officiel documenté |
|---|---|---:|---|---|
| Booster principal | 100 ou 120 impressions | 9 | 7 C + 1 R + 1 foil | [Power of the Elements (100/9)](https://www.yugioh-card.com/en/products/pote/) |
| Booster thématique | 70, 80 ou 90 | 7 | 5 C + 1 R + 1 foil | [Amazing Defenders (60/7)](https://www.yugioh-card.com/en/products/amde/) |
| Booster légendaire | 56 | 5 | 3 C + 1 R + 1 foil | [Synchro Storm (56/5)](https://www.yugioh-card.com/en/products/led8/) |
| Booster de construction | 60 | 7 | 6 R + 1 foil | [Tactical Masters (60/7)](https://www.yugioh-card.com/en/products/tama/) |
| Collection premium | 132, 146 ou 177 | 5 | 5 foils / prestige | [Ghosts From the Past (132)](https://www.yugioh-card.com/en/products/ghosts-from-the-past/), [Glorious Gallery (146)](https://www.yugioh-card.com/en/products/blgg/), [Monster Mayhem (177)](https://www.yugioh-card.com/en/products/blmm/) |

Les tailles AVP 70/80/90/120 sont des décisions éditoriales du projet. Les 24 boosters actifs utilisent leurs propres pools et règles de tirage, exportés dans la table des boosters actifs du classeur ; ce tableau décrit le programme des collections.

## Starter et decks de structure

Le jeu conserve **30 cartes pour un deck utilisable en duel**. Les cartes supplémentaires d'une boîte préconstruite sont des choix de construction à sélectionner avant le duel, **pas un Extra Deck Yu-Gi-Oh!**.

| Produit | Deck principal AVP | Cartes de réserve | Total boîte |
|---|---:|---:|---:|
| Starter Deck (5 factions) | 30 | 15 | **45** |
| Structure Deck (25 thèmes) | 30 | 15 | **45** |
| Deck de ligue | 30 | 15 | **45** |
| Deck spécial | 30 | 20 | **50** |
| Kit de construction | 30 | 45 | **75** |

Exemples officiels de tailles variables : [Starter Codebreaker (45)](https://www.yugioh-card.com/en/products/ys18/), [Structure Yugi/Kaiba (45)](https://www.yugioh-card.com/en/products/past_products/sdmy-sdks/), [Realm of Light (41)](https://www.yugioh-card.com/eu/fr/product/structure-deck-realm-of-light/), [Spirit Charmers (51)](https://www.yugioh-card.com/en/products/ch02/).

## Fichiers et décomptes

| Ensemble | Décompte | Sources |
| --- | ---: | --- |
| Catalogue actif complet | **2 021 cartes** | `gameplay-live.csv` |
| Cartes MX historiques, incluses dans le catalogue | 235 cartes : 99 Humains, 66 Ruche, 70 Yautja | `asymmetric-cards.csv` |
| Compléments Arsenal et cycles, inclus dans le catalogue | **1 130 cartes** : 985 Arsenal + 145 cycles | `complete-cards.csv` |
| Recettes antérieures aux doctrines MX | 280 recettes, 15 450 positions | `decks-playable.csv`, `decklists-playable.csv` |
| Doctrines asymétriques | 38 recettes, 1 710 positions | `asymmetric-decks.csv`, `asymmetric-decklists.csv` |
| Compléments Arsenal et cycles | **341 recettes, 15 345 positions** | `complete-decks.csv`, `complete-decklists.csv` |
| Ensemble des recettes actives | **659 recettes, 32 505 positions** | Onglet `22_DECKS_COMPLETS` et les trois ensembles de listes ci-dessus |
| Programme éditorial | 30 sets, 2 602 concepts, 2 853 impressions dont 251 variantes foil | `sets.csv`, `printings.csv` |
| Recettes du programme éditorial | 210 recettes, 12 300 positions planifiées | `decks.csv`, `decklists.csv` |
| Produits du programme éditorial | 180 références de produits | `products.csv` |
| Finitions et distribution prévues | 14 finitions, profils et probabilités indicatifs | `rarities.csv`, `booster-slots.csv`, `rarity-odds.csv`, `pack-formats.csv` |
| Références documentaires et origine | 652 références Alien_base, 158 cartes historiques | `alien-base-sources.csv`, `legacy-cards.csv` |

Les 210 recettes éditoriales se répartissent en 5 starters, 25 structures, 90 kits de construction, 30 decks spéciaux et 60 decks de ligue. Leurs adaptations jouables sont incluses dans les 280 recettes de production historiques. Les **12 300 positions planifiées ne s’ajoutent pas aux 32 505 positions jouables** : elles décrivent un autre catalogue de composition.

`live-set-progress.csv` suit les 30 sets et l’archive PX00. Les decks sans assez de cartes propres à leur œuvre gardent la mention **composition transversale provisoire**. Un nombre de cartes supérieur à une cible éditoriale ne certifie pas à lui seul la complétude de cette œuvre.

## Génération du classeur Excel et validation

Depuis la racine du dépôt :

```bash
node scripts/sync-production-decks.mjs --write
node scripts/sync-asymmetric-content.mjs --write
node scripts/sync-complete-content.mjs --write
python3 content-plan/build_xlsx.py
python3 scripts/verify-catalogue-xlsx.py
```

Ces commandes recréent `AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx` à partir des exports versionnés et du catalogue exécuté. Le point d’entrée Python appelle le générateur JavaScript avec `CODEX_PRIMARY_RUNTIME_NODE` et `CODEX_PRIMARY_RUNTIME_NODE_MODULES`, dans un environnement temporaire. Les modes, dépendances et rapports sont décrits dans [XLSX_GENERATION.md](XLSX_GENERATION.md).

Le générateur compare les 2 021 cartes et les 32 505 positions au moteur, contrôle les quantités principales et de réserve, recalcule les formules de synthèse et de factions, puis produit un aperçu par onglet. Les empreintes des sources et de l’export sont consignées dans son rapport.

Contrôles du catalogue et du jeu :

```bash
npm run validate:content-plan
npm run check:playable-decks
npm run check:asymmetric-content
npm run check:complete-content
npm run test:complete
npm run qa:complete -- --out=reports/qa/complete-2026-11-03.json
```

Le dernier contrôle exerce chaque nouvelle recette et son remix, les ressources, les transformations, les reprises et les continuations déterministes. Les scénarios navigateur de Collection et de gameplay sont réunis dans `scripts/qa-browser.mjs`. Les taux foil du programme éditorial restent indicatifs et ne sont pas automatiquement activés par l’export.

## Organisation du classeur courant

| Onglets | Rôle |
| --- | --- |
| `00_PILOTAGE` à `15_SUIVI_DES_SETS` | Synthèse, programme éditorial, références, cartes historiques, catalogue actif et progression des sets. |
| `16_DECKS_JOUABLES`, `17_LISTES_JOUABLES` | 280 recettes de production historiques et 15 450 positions. |
| `18_CARTES_ASYMETRIQUES` à `21_REGLES_ASYMETRIQUES` | 235 cartes MX, 38 doctrines, leurs 1 710 positions et règles d’origine. |
| `22_DECKS_COMPLETS` | Index des 659 recettes, principal et réserve. |
| `23_COMPATIBILITES`, `24_CHAINES_RUCHE`, `25_RESSOURCES_YAUTJA` | Relations calculées depuis les propriétés des cartes et routes exécutables. |
| `26_REGLES_DETAILLEES` | 54 règles de construction, combat, ressources, cycles, sauvegardes et Collection. |
| `27_ARSENAL_COUVERTURE`, `28_RUCHE_COUVERTURE` | Références, statuts, correspondances historiques et cartes ou routes associées. |
| `29_DECKS_COMPLEMENTS`, `30_LISTES_COMPLEMENTS` | 341 nouvelles recettes et 15 345 positions. |
| `31_COUVERTURE_DOMAINES` | Audit des 17 classes de cartes, factions, sources et présence dans les decks. |

## Historique des décomptes

| Étape | Contenu ajouté ou consolidé | Total à cette étape |
| --- | --- | --- |
| Origine | Standalone et trois starters historiques | 158 cartes |
| Vague AX | 156 cartes | 314 cartes |
| Vague BX et recettes de production | 342 cartes, 70 modèles de factions puis 210 recettes de collections | 656 cartes, 280 recettes, 16 boosters |
| Édition MX / consolidation du 3 novembre 2026 | 235 cartes, 38 doctrines et 3 boosters | 891 cartes, 318 recettes, 17 160 positions, 19 boosters |
| Édition complète du 3 novembre 2026 | 985 cartes Arsenal + 145 cycles ; 233 arsenaux + 108 cycles ; 5 boosters | **2 021 cartes, 659 recettes, 32 505 positions, 24 boosters** |

Les 498 cartes AX/BX représentent 494 identités documentaires distinctes ; les 158 cartes historiques correspondent aux identifiants `card.avp.*`, soit 652 références représentées avant les adaptations MX. Le classeur de l’étape MX comptait 27 onglets, 286 compatibilités d’armement, 113 entrées de chaînes Ruche et 46 règles. Ces valeurs sont historiques et ne décrivent pas l’export complet courant.

La consolidation 1.3 a notamment corrigé le F44AA sans calibre supposé, migré ses anciennes cartes `CELLULE`, validé les ressources avant sacrifice et limité les exceptions de migration aux anciennes armes déjà attachées. Les nouveaux modules prolongent ces règles sans réécrire les 891 cartes précédentes.

## Preuves de validation

Le [rapport de QA complète](../reports/qa/complete-2026-11-03.json) confirme **715 duels terminés, 18 596 reprises et 4 908 continuations déterministes** pour la version 1.4, avec les contrôles des mécaniques et les empreintes des modules. Le [rapport du classeur](../reports/qa/workbook-validation-2026-11-03.json) fournit les décomptes exacts des relations, les vérifications de formule et l’empreinte de l’Excel. Les contrôles de CI, du navigateur et du déploiement doivent correspondre à la révision proposée ; leur statut n’est pas déduit de ces fichiers locaux.

Le bilan historique 1.3 reste consultable dans [continuation-2026-11-03.json](../reports/qa/continuation-2026-11-03.json) : 177 duels terminés, 4 256 captures/restaurations et 1 130 continuations déterministes. Les résultats de cette étape ne remplacent pas la QA du nouveau catalogue.
