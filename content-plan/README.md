# AVP HUNT // HIVE — COLLECTIONS 30 EXTENSIONS (PR de conception)

**Snapshot vérifié** : `darknigthmare/alien_base@e65b75a6bfd1284dbac746102fdbae4fc5a3786b`, `data/entities.v1.json` SHA blob `393e88526dd16cd67c730761f23f68c4d8b97145` ; TCG `main@e7a9c8ee6017c25afceacccf580eeb8661257e97`.

Cette PR apporte **un référentiel de conception Excel/CSV**, pas 2850 cartes jouables ni un moteur modifié. Les 158 cartes historiques sont archivées séparément, inchangées ; les 652 entités Alien_base sont citées en sources. **Aucune entité de fan game n'est promue en canon officiel.**

## Livrables
- `sets.csv` : 30 extensions et leurs médias, factions, mécaniques.
- `printings.csv` : 3000 impressions **proposées** (2850 identités de cartes à créer + 150 traitements alternatifs qui partagent le même GameplayCardID).
- `legacy-cards.csv` : les 158 cartes existantes, sans changement.
- `rarities.csv` : 14 finitions, dont les 9 supplémentaires demandées, et alias historiques sans remappage silencieux.
- `decks.csv` + `decklists.csv` : 210 recettes nommées mono-faction de 30 cartes ; **non testées en jeu**.
- `booster-slots.csv` : booster 9 cartes (7 C, 1 R, 1 foil), tirages indicatifs, renormalisation obligatoire selon la présence des éditions premium dans chaque extension, anti-malchance existante à conserver.
- `products.csv` : 180 fiches de produits proposées.
- `alien-base-sources.csv` : 652 entrées exactes du registre source, sans attribuer de canon officiel.
- `research-backlog.csv` : sujets livres/comics/films/série/figurines non complets à vérifier à partir de sources primaires.
- `manifest.json` : compte exact et épingles des sources.

## Règles impératives de livraison
1. **Même identité de carte, différentes raretés d'impression.** Ne pas créer d'avantage statistique pour la version Ghost, Starlight, QCS, etc.
2. **Lier au registre privé par snapshot statique versionné.** Pas de fetch GitHub privé depuis le navigateur.
3. **Préserver `SCR`, `PR`, `GR` des 158 anciennes cartes**. `SE`, `PSR`, `GHR` sont de nouveaux codes proposés ; migration uniquement après audit de compatibilité et tests de sauvegarde.
4. **Les scripts de gameplay, boosters, sauvegardes et deckbuilder existants restent inchangés.** La PR n'active pas les nouvelles cartes.
5. **Canon** : distinguer film, jeu sous licence, print, figurine, fan. Chaque carte de cette proposition est un design gameplay dérivé, pas une scène 1:1 prouvée ; la colonne compatibilité indique thème direct ou adaptation transversale.
6. **Le format 30 cartes** et le maximum de trois copies subsistent. Les recettes ici sont toutes à 30 identités distinctes, mono-faction. Le moteur doit valider avant activation.

## Répartition et drop rates (proposition)
Chaque extension dispose de 95 identités de cartes nouvelles : 44 C, 24 R, 14 SR, 8 UR, 5 SE, puis 5 impressions alternatives. Les cinq extensions déjà dans le jeu utilisent les numéros 101–200 pour éviter de remplacer les numéros historiques. Les rares alternées tournent sur UTR, GHR, STL, QCS, CLR, PSR, PLS, PLR, PAR. Les 4 cartes historiques PX00 demeurent hors des 30 boosters ordinaires.

Un booster standard contient 9 impressions. Slot 9 foil pondéré : R 45%, SR 30%, UR 15%, SE 6,5%, divers premium 3,5% au global. **Cela ne garantit pas ces pourcentages par set individuel** ; seuls les traitements publiés dans un set peuvent être tirés. Les tableaux sont des objectifs à intégrer, pas une assertion que ces rates tournent aujourd'hui.

## Suite prévue
Audit éditorial carte par carte / sources primaires → règles et tags validés → illustrations originales et contrat 1:1 → QA ratios / sauvegardes / boosters → intégration progressive par extension. Les références de romans et comics listées dans le backlog demandent une ingestion primaire dans Alien_base avant canonisation.

Ce projet est un fan game non officiel non commercial ; œuvres, marques et personnages appartiennent à leurs ayants droit.
