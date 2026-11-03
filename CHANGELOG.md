# Changelog

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

Validation locale du moteur et des sauvegardes : **PASS**, avec **177 duels terminés, 4 256 captures/restaurations et 1 130 continuations déterministes**. Rapports dans `reports/qa/`. La QA navigateur, GitHub Actions et l’aperçu Vercel du nouveau commit restent **en attente** ; les résultats d’une révision antérieure ne sont pas attribués à cette consolidation.

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
