# Alien_base v3 — Codex documentaire dans Hunt & Hive TCG

- **Branche source** : `darknigthmare/alien_base`, [PR #19](https://github.com/darknigthmare/alien_base/pull/19), dépendant de [#18](https://github.com/darknigthmare/alien_base/pull/18).
- **Données publiques intégrées** : 158 références de cartes stables et 68 fiches du catalogue v1 avec œuvres, statut et notes. Le registre v2 de la base contient 632 entités ; ses dossiers privés supplémentaires ne sont pas inclus dans le jeu public.
- **UI** : Collection → Codex Alien_base / onglet Archive ; recherche, catégorie, continuité, pagination, dossier détaillé, cartes associées.
- **Traçabilité** : 9 liens `canonicalEntityId` explicites, 24 références historiques v1 candidates, 28 rapprochements inter-jeux non vérifiés, sans transfert de statistiques.
- **Intégrité** : les 158 cartes, illustrations, decks, boosters, règles, campagne, service worker existant et sauvegarde v3 restent identiques au jeu avant cette passerelle.

## Commandes

```bash
# Requis : checkout de la branche PR #19 du dépôt privé voisin
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
