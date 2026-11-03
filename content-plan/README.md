# AVP HUNT // HIVE TCG — Catalogue, decks et collections

**Catalogue consolidé pour la PR #4 au 3 novembre 2026 : 891 cartes jouables, 318 recettes de decks, 17 160 positions et 19 boosters.** Les 235 cartes MX développent les mécaniques Humains, Ruche et Yautja. Le programme éditorial de **30 sets, 2 602 concepts, 2 853 impressions et 14 finitions** reste suivi séparément. Les 158 cartes historiques, les **7 raretés actives**, les sauvegardes et le format de duel de 30 cartes sont préservés.

Le classeur versionné [AVP_HUNT_HIVE_TCG_Catalogue_318_Decks.xlsx](AVP_HUNT_HIVE_TCG_Catalogue_318_Decks.xlsx) réunit **27 onglets**. Les tables filtrables conservent les données de conception et les exports du moteur. Les onglets 22 à 26 ajoutent l’index des 318 recettes, **286 compatibilités d’armement**, **113 entrées de chaînes de la Ruche**, les ressources Yautja et **46 règles détaillées**. Les deux tables de relations totalisent **399 entrées**.

## Formats proposés pour les 30 extensions

| Gamme | Taille des extensions AVP | Cartes par paquet | Composition envisagée | Modèle officiel documenté |
|---|---|---:|---|---|
| Booster principal | 100 ou 120 impressions | 9 | 7 C + 1 R + 1 foil | [Power of the Elements (100/9)](https://www.yugioh-card.com/en/products/pote/) |
| Booster thématique | 70, 80 ou 90 | 7 | 5 C + 1 R + 1 foil | [Amazing Defenders (60/7)](https://www.yugioh-card.com/en/products/amde/) |
| Booster légendaire | 56 | 5 | 3 C + 1 R + 1 foil | [Synchro Storm (56/5)](https://www.yugioh-card.com/en/products/led8/) |
| Booster de construction | 60 | 7 | 6 R + 1 foil | [Tactical Masters (60/7)](https://www.yugioh-card.com/en/products/tama/) |
| Collection premium | 132, 146 ou 177 | 5 | 5 foils / prestige | [Ghosts From the Past (132)](https://www.yugioh-card.com/en/products/ghosts-from-the-past/), [Glorious Gallery (146)](https://www.yugioh-card.com/en/products/blgg/), [Monster Mayhem (177)](https://www.yugioh-card.com/en/products/blmm/) |

Les tailles AVP 70/80/90/120 sont des décisions éditoriales du projet. Les 19 boosters actifs utilisent leurs propres pools et règles de tirage, exportés dans la table des boosters actifs du classeur ; ce tableau décrit le programme des collections.

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
| Catalogue actif complet | 891 cartes | `gameplay-live.csv` |
| Cartes MX, incluses dans le catalogue actif | 235 cartes : 99 Humains, 66 Ruche, 70 Yautja | `asymmetric-cards.csv` |
| Recettes précédant les doctrines MX | 280 recettes, 15 450 positions | `decks-playable.csv`, `decklists-playable.csv` |
| Doctrines asymétriques | 38 recettes, 1 710 positions | `asymmetric-decks.csv`, `asymmetric-decklists.csv` |
| Ensemble des recettes actives | **318 recettes, 17 160 positions** | Onglet `22_DECKS_318` et les deux ensembles de listes ci-dessus |
| Programme éditorial | 30 sets, 2 602 concepts, 2 853 impressions dont 251 variantes foil | `sets.csv`, `printings.csv` |
| Recettes du programme éditorial | 210 recettes, 12 300 positions planifiées | `decks.csv`, `decklists.csv` |
| Produits du programme éditorial | 180 références de produits | `products.csv` |
| Finitions et distribution prévues | 14 finitions, profils et probabilités indicatifs | `rarities.csv`, `booster-slots.csv`, `rarity-odds.csv`, `pack-formats.csv` |
| Références documentaires et origine | 652 références Alien_base, 158 cartes historiques | `alien-base-sources.csv`, `legacy-cards.csv` |

Les 210 recettes éditoriales se répartissent en 5 starters, 25 structures, 90 kits de construction, 30 decks spéciaux et 60 decks de ligue. Leurs adaptations jouables figurent parmi les 280 recettes de production. Les **12 300 positions planifiées ne s’ajoutent pas aux 17 160 positions jouables** : elles décrivent un autre catalogue de composition.

`live-set-progress.csv` suit les 30 sets et l’archive PX00. Les decks sans suffisamment de cartes propres à leur œuvre portent la mention **composition transversale provisoire**. Le suivi signale aussi les cibles éditoriales à recalibrer ; un nombre de cartes supérieur à une cible ne certifie pas une extension complète.

## Génération du classeur Excel et validation

Depuis la racine du dépôt, avec le runtime documentaire configuré :

```bash
node scripts/sync-production-decks.mjs --write
node scripts/sync-asymmetric-content.mjs --write
python3 content-plan/build_xlsx.py
```

Recrée `content-plan/AVP_HUNT_HIVE_TCG_Catalogue_318_Decks.xlsx` à partir des CSV versionnés et du catalogue exécuté. Le classeur est versionné avec le générateur JavaScript. Le point d’entrée Python prépare un environnement temporaire puis lance `@oai/artifact-tool` avec les variables `CODEX_PRIMARY_RUNTIME_NODE` et `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Les modes de génération et les rapports sont décrits dans [XLSX_GENERATION.md](XLSX_GENERATION.md).

Le générateur contrôle les noms, coûts et statistiques des 891 cartes, puis compare chaque position principale et de réserve au moteur. L’index des 318 decks représente **17 160 positions**. Les compteurs de synthèse sont des formules Excel ; un changement temporaire de donnée vérifie leur recalcul avant restauration et export. Un aperçu est rendu pour chaque onglet.

Contrôles des sources avec Node 24, comme dans GitHub Actions :

```bash
npm run validate:content-plan
npm run check:playable-decks
npm run check:asymmetric-content
```

Vérifie tous les décomptes, l'unicité, les IDs de cartes et de références, les 30 cartes PRINCIPAL, les réserves, les factions et les quantités vendues par produit. Les taux foil sont **indicatifs et non activés** : ils doivent être renormalisés pour les finitions réellement présentes dans chaque set et simulés avant intégration.

Les références écran, jeux sous licence, comics/romans, figurines et fan lore sont distinguées. Les 2 602 cartes proposées **ne sont pas attestées fidèles 1:1** scène par scène avant validation éditoriale. Aucun fetch vers le dépôt privé Alien_base n'est effectué depuis le navigateur.

## Historique et organisation des onglets

| Étape | Contenu ajouté ou consolidé | Total à cette étape |
| --- | --- | --- |
| Origine | Standalone et trois starters historiques | 158 cartes |
| Vague AX | 156 cartes | 314 cartes |
| Vague BX et recettes de production | 342 cartes, 70 modèles de factions puis 210 recettes des collections | 656 cartes, 280 recettes, 16 boosters |
| Édition MX | 235 cartes, 38 doctrines et 3 boosters | **891 cartes, 318 recettes, 19 boosters** |

Les 498 cartes AX/BX couvrent 494 identités documentaires distinctes. Les 158 cartes historiques correspondent aux 158 autres identifiants `card.avp.*` de la source, soit 652 références représentées avant l’ajout des adaptations MX.

Les onglets **16_DECKS_JOUABLES** et **17_LISTES_JOUABLES** conservent les 280 recettes de production et leurs listes. Les onglets **18 à 21** décrivent les cartes, decks, positions et mécanismes MX. L’onglet **22_DECKS_318** réunit toutes les recettes actives, avec leur `PlanDeckID` lorsqu’il existe. Les identifiants des cartes et recettes restent stables entre les vagues.

Les règles de munitions, modules, fusion biologique, biomasse, plasma et honneur sont des adaptations de gameplay documentées. Les visuels précédents restent inchangés ; **aucune illustration nouvelle n’est ajoutée dans cette consolidation**.

## Consolidation du 3 novembre 2026

Le remélange des doctrines conserve les ressources et résultats nécessaires aux actions de leur deck principal : familles de tir et calibres correspondants, lignée d’hôte, œuf royal si requis, résultats de fusion ou de mue disponibles, biomasse et plasma. Les chargeurs vides libèrent leurs emplacements, les techniques refusent les mauvaises familles d’armes et les évolutions valident l’invocation avant le sacrifice.

Les compatibilités et combinaisons du classeur sont calculées à partir des propriétés des cartes en jeu. Ce sont des règles du TCG : les identifiants Alien_base documentent l’inspiration des cartes et ne certifient pas que ces effets sont canoniques. L’export complet conserve les 652 références de `alien_base@e65b75a6bfd1284dbac746102fdbae4fc5a3786b`.

La consolidation inclut les textes de règles et effets complets des cartes, les 19 boosters actifs, les 7 raretés implémentées, 286 compatibilités d'armement et 113 entrées décrivant les chaînes de la Ruche. Les colonnes `RelationSource`, `NoteSource` et `SourcePrimaireURL` qualifient les inspirations des 235 cartes MX. Les modules renvoient à leur arme compatible ; une référence de module ne prétend pas documenter un accessoire canon.

Le F44AA utilise désormais la famille de cartouches `F44AA` sans calibre supposé, avec migration des trois anciens chargeurs `CELLULE`. Tous les identifiants de cartes et de recettes demeurent conservés. Les anciennes parties sont migrées avant validation, y compris les armes légalement attachées sous les anciennes règles de porteur.

À sec, les bonus offensifs de l’arme et de ses modules cessent de s’appliquer ; le porteur conserve ses capacités de base. Les nouvelles sauvegardes refusent les montages incompatibles, tandis qu’une exception de migration reste limitée à l’arme déjà attachée dans une ancienne partie. Les fiches affichent les charges, les coûts de tir/riposte, les modules actifs, les matériaux et les résultats nécessaires.

## Validation de ce lot

La vérification locale du moteur et des sauvegardes est **PASS** : **177 duels terminés, 4 256 captures/restaurations et 1 130 continuations déterministes**, selon [le rapport de continuation](../reports/qa/continuation-2026-11-03.json). Les tableaux et formules du classeur disposent d’un [rapport de validation](../reports/qa/workbook-validation-2026-11-03.json).

La validation navigateur ordinateur/mobile ainsi que GitHub Actions et l’aperçu Vercel restent **en attente sur le nouveau commit**. Le navigateur local est indisponible ; les scénarios sont présents dans le workflow et doivent réussir sur la révision effectivement publiée.
