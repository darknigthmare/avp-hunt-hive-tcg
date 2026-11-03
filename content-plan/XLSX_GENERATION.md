# Générer le catalogue Excel

Le classeur versionné [AVP_HUNT_HIVE_TCG_Catalogue_318_Decks.xlsx](AVP_HUNT_HIVE_TCG_Catalogue_318_Decks.xlsx) réunit les tables du programme éditorial et les cartes réellement jouables. Ses **27 onglets** décrivent **891 cartes**, dont **235 MX**, **318 recettes**, **17 160 positions** principales/de réserve, **19 boosters actifs**, **399 relations** et **46 règles détaillées**. Les relations comprennent **286 compatibilités d’armement** et **113 entrées de chaînes Ruche**.

Les deux tables de cartes exposent le texte complet, les mots-clés, l’effet et le numéro de collection extraits du catalogue exécuté. Les **7 raretés actives** sont présentées séparément du programme de **30 sets / 2 602 concepts / 2 853 impressions / 14 finitions**.

## Données et contrôles

Les données CSV versionnées restent la source des extensions, produits, finitions, références et positions des decks. Les fichiers JavaScript du jeu fournissent les compatibilités d’armement, les chaînes de la Ruche et les ressources Yautja. Les raretés et boosters actifs disposent de tables distinctes dans leurs onglets respectifs, à côté du programme éditorial.

Le générateur vérifie les identifiants, noms, coûts et statistiques des cartes contre le jeu. Il compare chaque exemplaire du deck principal et de sa réserve à la recette exécutée. Les compteurs de la synthèse et des trois factions sont des formules Excel recalculées et confrontées à des comptages indépendants. Une modification temporaire d’un total de boîte vérifie le recalcul, puis la valeur est restaurée avant export.

Les empreintes SHA-256 des sources de données et des modules de règles sont enregistrées dans le rapport de validation. Le rapport enregistre également l’empreinte du générateur et celle du fichier Excel exporté. La génération s’arrête si une source change pendant le travail afin d’éviter un classeur mélangeant deux versions.

## Génération complète

Depuis la racine du dépôt :

```bash
node scripts/sync-production-decks.mjs --write
node scripts/sync-asymmetric-content.mjs --write
python3 content-plan/build_xlsx.py
```

Le point d’entrée Python prépare un répertoire temporaire isolé et appelle l’unique implémentation `build_xlsx.mjs`. Il utilise le runtime primaire fourni par `CODEX_PRIMARY_RUNTIME_NODE` et `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Aucun paquet n’est installé dans le dépôt.

La sortie se trouve dans `outputs/<identifiant du workspace>/`, à côté du dépôt, et une copie identique est placée dans `content-plan/` pour être versionnée. Le rapport `workbook-validation.json`, l’inspection des formules et les aperçus des 27 onglets sont produits avec le classeur. Une copie du rapport est enregistrée sous `reports/qa/workbook-validation-<date du manifeste>.json` ; le champ `output` y désigne le fichier Excel dans le dépôt.

Une sortie explicite peut être passée au point d’entrée JavaScript avec `--root /chemin/absolu/du/depot --out /chemin/absolu/outputs/identifiant`. Exécuter ce point d’entrée depuis un répertoire temporaire contenant un lien `node_modules` vers le runtime primaire. L’option `--no-render` réduit les aperçus pendant un diagnostic ; la livraison complète doit être générée sans cette option.

Pour une précision limitée aux textes des règles, `python3 content-plan/build_xlsx.py --refresh-rules` met à jour le tableau des 46 règles du dernier export et son rendu. Cette commande exige que les empreintes des sources correspondent au rapport du dernier export complet. Les cartes, tableaux de decks et compteurs restent inchangés. Une modification des données ou du moteur impose une génération complète.

## Vérification du classeur versionné

La vérification utilise Python 3 standard et Node, sans dépendance de création de classeur :

```bash
python3 scripts/verify-catalogue-xlsx.py
```

Le script lit le format OOXML et contrôle l’intégrité du fichier, ses empreintes, la structure des onglets et tables, les cellules issues des CSV, les textes et effets du catalogue exécuté, l’index des 318 decks et les totaux. Il compare les valeurs de formule mises en cache avec des comptes indépendants. Le recalcul des formules est effectué pendant la génération complète ; la vérification relit ces résultats et les preuves associées.

Après une modification des cartes, des decks ou des règles, les CSV, le classeur et son rapport doivent être régénérés ensemble. Une empreinte obsolète provoque un échec de vérification. Les contrôles du catalogue accompagnent ceux du gameplay dans GitHub Actions.

## Preuves et état de validation

Le [rapport de validation du classeur](../reports/qa/workbook-validation-2026-11-03.json) fournit les effectifs par onglet, les empreintes des sources et du classeur, les contrôles de recalcul et le nombre d’onglets rendus. `renderedSheets: 27` correspond à une génération complète ; `--no-render` produit seulement l’aperçu de synthèse et sert au diagnostic.

La consolidation dispose d’une validation locale du moteur : **177 duels terminés, 4 256 captures/restaurations et 1 130 continuations déterministes**. La QA navigateur ordinateur/mobile, GitHub Actions et l’aperçu Vercel restent **en attente sur le nouveau commit**. Le contrôle du fichier Excel et la validation du jeu ont chacun leurs preuves.

## Portée

Les chiffres actifs et ceux du programme éditorial sont séparés. Une référence `Alien_base` conserve la provenance documentaire ; les règles, statistiques, évolutions et adaptations du TCG restent des choix de conception. Le classeur ne valide pas automatiquement la fidélité de chaque sujet aux œuvres. Aucune nouvelle illustration n’est créée par ce générateur.
