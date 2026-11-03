# Changelog

## 2026-11-03 — Édition 1.4 : arsenaux, cycles et Collection détaillée

**État courant : 2 021 cartes, 659 recettes, 32 505 positions principales/de réserve et 24 boosters.** Ajout de **1 130 cartes** (985 Arsenal + 145 cycles), **341 recettes** (233 arsenaux + 108 cycles) et cinq boosters. Les 891 cartes précédentes, leurs identifiants, les trois départs historiques et les sept raretés sont préservés exactement.

### Arsenaux et cycles jouables

- Couverture des 134 armes et 113 équipements historiques humains/Yautja ; 233 références concrètes intégrées avec variantes de gameplay, ressources et modules associés. Huit alias documentaires déjà couverts sont séparés des 121 recherches non admises.
- Ajout de 127 armes, 87 appareils, 191 munitions, 344 modules, sept réserves plasma et 229 techniques, opérations ou consommables. Compatibilités explicites par arme ou appareil ; aucune cartouche imposée à la mêlée, aux appareils ou aux projectiles réutilisables.
- Services conditionnés à l’appareil installé ; modules d’appareil distincts des modules d’arme ; plasma, tirs de filet et manœuvres de mêlée résolus par le moteur et conservés dans les sauvegardes.
- Couverture biologique de 105 sujets et 123 routes : 109 nouvelles recettes `HIVE_ROUTE` et 14 routes historiques. Matériaux, hôtes secondaires, catalyseurs, résultat disponible, biomasse et emplacement sont vérifiés avant la transformation.
- Préservation des copies supplémentaires nécessaires aux reproductions après consommation du premier Œuf ; IA conservant les places utiles aux matériaux de cycle.
- Decks et remélanges avec toutes leurs ressources ; 30 cartes principales et 15 alternatives pour chaque nouvelle recette. Nouveaux boosters Arsenal humain/Yautja et cycles Xénomorphes/Ingénieurs/Hybrides.
- Validation des munitions selon la faction du porteur, y compris ses affiliations supplémentaires, et contrôle des modules d’appareil dans les reprises. Pool des 38 anciennes doctrines figé pour préserver leur remélange historique.

### Collection et catalogue

- Trois vues de Collection : **Cartes**, **Progression**, **Par type de deck**. Possédées sur le total, exemplaires, doublons, jeux de trois cartes, filtres et tris par type, gamme, faction, extension et rareté.
- Progression des recettes en quantités exactes ; principal et réserve additionnés lorsqu’elle est incluse, cartes manquantes et coût de fabrication affichés. Création du principal depuis les cartes déjà possédées, sans attribution gratuite d’un manque.
- Navigation entre cartes et ressources compatibles, modules, opérations, matériaux et résultats d’évolution ; export JSON de l’inventaire.
- Classeur courant `AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx` : **32 onglets et 54 règles**, tables de couverture Arsenal/Ruche/domaines et index des 659 recettes. Les relations détaillées sont comptées depuis le moteur lors de l’export.
- Chargement commun par `runtime-modules.json`, synchronisation `sync-complete-content.mjs`, tests et QA complète ; couverture des 17 classes de cartes, dont 43 véhicules pilotés.

### Portée et preuves

Les règles sont des adaptations TCG, avec provenance et limites documentaires explicites ; les profils de projet, concepts, variantes d’œuvres et recherches non admises restent identifiables. Aucune illustration nouvelle n’est ajoutée.

Finalisation du 3 novembre : filtres de progression Collection réinitialisés correctement, création des decks limitée aux cartes possédées et Codex aligné sur les 652 références fusionnées d’Alien_base. Les techniques perforantes conservent désormais Perforation pendant leur dernière charge ; deux régressions couvrent ce tir et la mort acide du porteur sans double défausse.

Validation locale : **291 tests réussis, 715 duels terminés, 18 596 reprises et 4 908 continuations déterministes**. Le build contient 203 fichiers publics et 27 éléments critiques du shell. Les validations de cette édition sont consignées dans `reports/qa/complete-2026-11-03.json` et `reports/qa/workbook-validation-2026-11-03.json`, ainsi que dans les contrôles de la révision proposée. Cette entrée ne préjuge pas de la fusion ni du déploiement. Le périmètre détaillé est décrit dans [l’audit de complétude](content-plan/COMPLETENESS_AUDIT_2026-11-03.md). Les résultats des lots antérieurs ci-dessous restent historiques.

## 2026-11-03 — Réconciliation du Codex et du gameplay pour la PR #4

- Réunion du Codex Alien_base intégré dans `main` et du catalogue asymétrique : **891 cartes, 318 recettes et 19 boosters**, avec les 158 liens documentaires historiques conservés.
- Archive et fiches de cartes réunissant les règles asymétriques et les recherches du Codex ; correction de l’affichage du compteur dans la Collection.
- Publication et cache hors ligne réunis : **20 routes critiques**, **196 fichiers publics**, contrôles de confidentialité conservés.
- Suites navigateur ordinateur/mobile réunissant gameplay, sauvegarde/reprise et navigation du Codex.
- Validation locale : **244 tests réussis**, 177 duels terminés, 4 256 restaurations et 1 130 continuations déterministes ; classeur inchangé validé sur 402 489 cellules et 31 empreintes. Détails dans `reports/qa/merge-validation-2026-11-03.json` ; contrôles distants rattachés au commit dans la PR.

## 2026-11-03 — Consolidation du catalogue asymétrique

Catalogue conservé : **891 cartes** dont **235 MX**, **318 recettes**, **17 160 positions** de cartes et **19 boosters**. Les **7 raretés actives** sont distinctes des **14 finitions** du programme éditorial de **30 sets / 2 602 concepts / 2 853 impressions**. Aucune illustration nouvelle dans ce lot.

### Gameplay et sauvegardes

- Correction du F44AA en fusil à impulsion à cartouches, migration ciblée de ses anciennes cellules et conservation des identifiants de cartes/decks.
- Sources des modules reliées aux armes compatibles, référence du bio-masque corrigée et qualification explicite des adaptations TCG dans les exports.
- Bonus d'arme, de module et de munitions calculés avant le plancher à zéro ; riposte à sec limitée à l'attaque de base.
- Honneur et trophées réservés aux éliminations ennemies, avec prise en compte de la double affiliation de Machiko.
- IA Ruche : préservation des voies nécessaires aux matériaux de fusion.
- Libération des emplacements de munitions épuisées et rechargement après plusieurs cycles de tir.
- Validation de la famille d’arme et du calibre des attaques spécialisées avant consommation.
- Validation des résultats de fusion et d’évolution avant sacrifice, et refus des hôtes synthétiques.
- Construction et remélange des doctrines avec les dépendances nécessaires : hôtes, lignées, œufs et résultats de transformations.
- Imports de sauvegardes contrôlant classe/faction du porteur, emplacement d’arme, compatibilité des modules, chargeurs et ressources ; migration limitée des anciens montages légaux via `rulesVersion: 2`, sans autoriser de nouvelles poses incompatibles.

### Catalogue et interface

- Classeur versionné de **27 onglets** : 17 160 positions principales et de réserve, **286 compatibilités d’armement + 113 entrées de chaînes Ruche = 399 relations**, économie Yautja et **46 règles détaillées**.
- Générateur JavaScript reproductible avec contrôle des CSV contre le catalogue réellement exécuté et formules de synthèse recalculées.
- Fiches d’unités affichant l’arme, les charges, le coût de tir/riposte et l’état des bonus de modules ; fiches de cartes détaillant compatibilités, matériaux et résultats de transformation.
- Actualisation des descriptions qui annonçaient encore 158, 314 ou 656 cartes comme état courant.

### État de validation du lot

Validation locale du moteur et des sauvegardes : **PASS**, avec **177 duels terminés, 4 256 captures/restaurations et 1 130 continuations déterministes**. Rapports dans `reports/qa/`. La consolidation `15b2e1e` a ensuite passé les tests et la QA navigateur dans le [workflow 41615223534](https://github.com/darknigthmare/avp-hunt-hive-tcg/actions/runs/41615223534). La réconciliation ultérieure avec le Codex est décrite ci-dessus et dispose de ses propres contrôles.

## 1.0.0 - Edition professionnelle

- Reprise des duels et de l'aléatoire, migration des profils v1/v2 vers v3, checkpoint exportable.
- Protection des récompenses et des sauvegardes entre onglets ; conservation du duel en cas d'échec de capture.
- IA d'équipement fondée sur les seuils de destruction/survie, archétype Humain d'infanterie cohérent.
- Campagne complète vérifiée par duels réels et rechargement entre opérations.
- Contrastes lisibles sans reflets sur les règles, titres hiérarchisés, archive sans débordement mobile et accès direct à la main.

- Conservation vérifiée du standalone source et de ses 158 cartes.
- Extraction en couches modulaires données, moteur, interface et styles.
- Durcissement des règles, de l'IA, des effets temporaires et des scénarios de campagne.
- Validation et migration des sauvegardes, import/export sécurisé et protection contre les récompenses abusives.
- Constructeur de decks par identité de faction et ergonomie mobile renforcée.
- Tutoriel, navigation clavier, modales accessibles, annonces live et réduction des mouvements.
- PWA installable, cache hors ligne, icônes originales et build statique reproductible.
- Tests de provenance, catalogue, moteur, sauvegarde, PWA, build et simulation d'équilibrage.
- Configuration Vercel de production avec en-têtes de sécurité défensifs.
