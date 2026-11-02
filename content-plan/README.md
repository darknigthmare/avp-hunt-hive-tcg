# AVP HUNT // HIVE TCG — Collections à tailles variables (v2)

**Mise à jour de la PR #4 :** le catalogue de 30 extensions n'impose plus 100 cartes à chaque set. Les données de production restent **proposées / non jouables** : les 158 cartes actuellement jouables, leurs 7 raretés implémentées, leurs sauvegardes et leur deckbuilder de 30 cartes sont préservés.

## Formats et tailles

| Gamme | Taille des extensions AVP | Cartes par paquet | Composition envisagée | Modèle officiel documenté |
|---|---|---:|---|---|
| Booster principal | 100 ou 120 impressions | 9 | 7 C + 1 R + 1 foil | [Power of the Elements (100/9)](https://www.yugioh-card.com/en/products/pote/) |
| Booster thématique | 70, 80 ou 90 | 7 | 5 C + 1 R + 1 foil | [Amazing Defenders (60/7)](https://www.yugioh-card.com/en/products/amde/) |
| Booster légendaire | 56 | 5 | 3 C + 1 R + 1 foil | [Synchro Storm (56/5)](https://www.yugioh-card.com/en/products/led8/) |
| Booster de construction | 60 | 7 | 6 R + 1 foil | [Tactical Masters (60/7)](https://www.yugioh-card.com/en/products/tama/) |
| Collection premium | 132, 146 ou 177 | 5 | 5 foils / prestige | [Ghosts From the Past (132)](https://www.yugioh-card.com/en/products/ghosts-from-the-past/), [Glorious Gallery (146)](https://www.yugioh-card.com/en/products/blgg/), [Monster Mayhem (177)](https://www.yugioh-card.com/en/products/blmm/) |

Les tailles AVP 70/80/90/120 sont **nos décisions éditoriales**, pas des nombres attribués à ces produits officiels.

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

- **30 sets**, **2 853 impressions**, **2 602 identités de nouvelles cartes** et **251 variantes foil** sans changement de statistiques.
- **210 recettes**, dont 5 starters, 25 structures, 90 constructions, 30 decks spéciaux et 60 decks de ligue ; **12 300 lignes** contenant zones PRINCIPAL et RÉSERVE.
- **180 produits**, dont boosters, displays, coffrets et decks, avec des quantités cohérentes selon leur gamme.
- **14 raretés** prévues ; **652 références Alien_base** et **158 cartes historiques** conservées sans changement.
- `sets.csv`, `printings.csv`, `decks.csv`, `decklists.csv`, `products.csv`, `booster-slots.csv`, `rarity-odds.csv`, `pack-formats.csv`, `formats-reference.csv`, `manifest.json` : contenus synchronisés.

## Génération du classeur Excel et validation

Depuis la racine du repo avec Python + `artifact_tool` :

```bash
python content-plan/build_xlsx.py
```

Recrée le classeur **exhaustif** `content-plan/AVP_HUNT_HIVE_TCG_30_Collections.xlsx` à partir des CSV versionnés. Le binaire Excel n'est **pas commité**, mais ses données et son générateur le sont.

Avec Node 20+ :

```bash
node content-plan/validate.mjs
```

Vérifie tous les décomptes, l'unicité, les IDs de cartes et de références, les 30 cartes PRINCIPAL, les réserves, les factions et les quantités vendues par produit. Les taux foil sont **indicatifs et non activés** : ils doivent être renormalisés pour les finitions réellement présentes dans chaque set et simulés avant intégration.

Les références écran, jeux sous licence, comics/romans, figurines et fan lore sont distinguées. Les 2 602 cartes proposées **ne sont pas attestées fidèles 1:1** scène par scène avant validation éditoriale. Aucun fetch vers le dépôt privé Alien_base n'est effectué depuis le navigateur.

## État d'implémentation — vague 2 (pas d'illustrations)

La PR #4 conserve les **158 cartes historiques** et ajoute **156 cartes AX_** puis **342 cartes BX_** : **656 cartes jouables**. Les 498 cartes ajoutées recouvrent **494 identités documentaires distinctes**, tandis que les 158 fiches de cartes historiques correspondent aux 158 autres IDs `card.avp.*` de la source. Au total, les **652 identifiants** de `Alien_base` sont représentés, **sans validation automatique canon 1:1**.

Les **70 nouveaux modèles/variantes de decks** contiennent chacun 30 cartes de duel + 15 alternatives de construction, et **16 boosters jouables** utilisent 9 cartes (historiques), puis 9/7/5 cartes pour les nouveaux pools en aperçu. Les **14 finitions** décrites dans le plan restent à implémenter ultérieurement (le jeu continue d'utiliser ses sept raretés historiques).

- `gameplay-live.csv` : correspondance *exhaustive de 656 cartes* : ID, classe, faction, set, type, coûts, stats, référence documentaire, statut de jouabilité et statut d'illustration.
- `live-set-progress.csv` : **30 sets planifiés + PX00 archivage** avec nombre de concepts actifs, boosters ouverts et écart avec la feuille de route.
- Important : **impressions** et **identités de gameplay** ne sont pas comparables 1:1. Certains sets (notamment Tantalus) peuvent demander une révision du nombre de concepts prévu ; ce suivi signale ces dépassements.
- La modification des packs n'altère pas les sauvegardes ni les cartes historiques. Les nouveaux boosters sont verrouillés tant que leur pool est trop limité et sont clairement étiquetés comme **aperçus**.
- **Aucune illustration générée ou retouchée** pendant cette phase ; les nouveaux visuels ne sont que des placeholders procéduraux existants.
