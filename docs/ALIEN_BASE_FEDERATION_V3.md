# Alien_base v3 — Codex documentaire dans Hunt & Hive TCG

- **Source vérifiée le 3 novembre 2026** : export `exports/avp-hunt-hive-tcg.v3.json` de [`darknigthmare/alien_base/main@e65b75a6`](https://github.com/darknigthmare/alien_base/commit/e65b75a6bfd1284dbac746102fdbae4fc5a3786b), révision `2026-11-02-tcg-v3-unified`. La fédération a été introduite par les [PR #19](https://github.com/darknigthmare/alien_base/pull/19) et [#18](https://github.com/darknigthmare/alien_base/pull/18).
- **Données publiques intégrées** : 158 références de cartes stables et 68 fiches du catalogue v1 avec œuvres, statut et notes. Le registre v2 de la base contient désormais 652 identités de référence ; les dossiers privés supplémentaires ne sont pas inclus dans le jeu public.
- **UI** : Collection → Codex Alien_base / onglet Archive ; recherche, catégorie, continuité, pagination, dossier détaillé, cartes associées.
- **Traçabilité** : 9 liens `canonicalEntityId` explicites, 24 références historiques v1 candidates, 28 rapprochements inter-jeux non vérifiés, sans transfert de statistiques.
- **Intégrité de cette synchronisation documentaire** : les cartes, illustrations, decks, boosters, règles, campagne et sauvegardes ne sont pas modifiés par l’import du Codex. Les ajouts jouables de l’édition 1.4 relèvent de leurs modules et audits distincts.

## Commandes

```bash
# Requis : checkout main du dépôt privé voisin
node scripts/sync-alien-base-unified.mjs --base ../alien_base
# Après modification approuvée de l'export :
node scripts/sync-alien-base-unified.mjs --base ../alien_base --publish
npm run check
npm test
npm run verify:release
```

Le mode vérification échoue en cas de désynchronisation de snapshot. `--publish` n'ajoute aucune nouvelle carte : il remplace seulement le document source public et doit faire l'objet d'une revue Git.

## Limites

La présence dans l'encyclopédie ne valide pas la morphologie 1:1 d'une image, la disponibilité d'une carte, ou les mesures physiques d'une arme/créature. Les fichiers Excel cités dans les sources d'origine restent à examiner. Les rapprochements entreprise ↔ synthétique sont des affiliations documentaires et non des identités biologiques.

## Sens jeu → Alien_base : vérification stricte

`scripts/check-alien-base-roundtrip.mjs` compare le catalogue réel du jeu aux données enregistrées dans `data/gameplay/avp-tcg-cards.v1.json` et aux 158 identités de la fédération v3. Il contrôle **14 champs** (nom, faction, type, set, rareté, coût, attaque, PV, mots-clés, texte, effet, tags, source et numéro de collection).

```bash
node scripts/check-alien-base-roundtrip.mjs --base ../alien_base
# En cas de divergence : créer une proposition de revue dans le jeu
node scripts/check-alien-base-roundtrip.mjs --base ../alien_base --propose docs/alien-base-proposals/review.json
```

Les divergences génèrent une **proposition de PR**, et ne sont jamais injectées automatiquement comme vérités canoniques dans Alien_base. La comparaison actuelle avec le catalogue importé confirme 158 identités et 14 champs sans divergence (audit GitHub du 1er novembre 2026).

## Raccords documentaires supplémentaires (Chrome QA)

Le test navigateur a montré qu'une recherche M41A ouvrait correctement sa notice, sans lien vers `EQ_PULSE_RIFLE`. Le registre intègre maintenant 16 références entre armes, matériel, vaisseaux et lieux du catalogue v1 et cartes du jeu : **40 liens historiques au total**. Les associations restent des références explicites à confirmer, jamais des identités biologiques ou des valeurs de gameplay imposées. Les tests couvrent aussi `H_WEYLAND_OP` comme simple affiliation à Weyland-Yutani.

## Arsenal de recherche et compléments (non jouables)

La troisième passe d'Alien_base fournit maintenant aussi **200 fiches d'armes issues du catalogue Tantalus** et **16 sujets à documenter** dans deux onglets distincts du Codex historique (68 fiches). Les 216 dossiers complémentaires exposent uniquement leurs noms, œuvres, familles et statuts documentaires. Aucun n'est certifié fidèle à 1:1 ni ajouté automatiquement comme carte, équipement débloqué ou contenu de booster. Recherche, pagination et détails sont disponibles hors ligne. Les PV, dégâts, prix et valeurs propres à Tantalus ne sont pas importés.

## Actualisation du 3 novembre 2026 — identités Apex et Hive intégrées

Les données issues des [PR Alien_base #21](https://github.com/darknigthmare/alien_base/pull/21), [#22](https://github.com/darknigthmare/alien_base/pull/22), [#23](https://github.com/darknigthmare/alien_base/pull/23) et [#24](https://github.com/darknigthmare/alien_base/pull/24) sont présentes dans l’export public de `main@e65b75a6`. Le Codex passe donc de l’ancien aperçu `UNMERGED_RESEARCH_DELTA` au statut **`MERGED_REFERENCE_IDS_RESEARCH_ONLY`**, avec **652 identités intégrées au registre**. Les 20 profils Yautja/Apex, 29 œuvres, 3 alias Alpha/Samurai/Viking et 3 notes biologiques gardent leurs statuts de recherche et leurs réserves d’origine. Le champ `baselineCount: 632` décrit le point de départ historique, pas le total courant.

La comparaison exacte avec l’ancien export relève seulement trois changements de données : la révision, `registry.v2` et le statut global de `registryUpdates`. Les liens, noms, œuvres et annotations restent identiques. L’intégration de ces références dans le dépôt ne valide pas automatiquement leur lore ni leur morphologie, et ne confère aucune carte au joueur. Le générateur, le build et les scénarios navigateur vérifient désormais le contrat de l’export unifié.
