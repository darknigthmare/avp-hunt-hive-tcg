# Audit de complétude — édition 1.4 du 3 novembre 2026

## Résultat et périmètre

Le catalogue exécuté contient **2 021 cartes, 659 recettes préconstruites, 32 505 positions principales/de réserve et 24 boosters**. Cette édition ajoute **1 130 cartes et 341 recettes** aux 891 cartes et 318 recettes de l’édition 1.3. Les objets des 891 cartes précédentes restent exactement identiques ; leurs identifiants et leurs règles historiques sont conservés. [Manifeste](manifest.json), [catalogue actif](gameplay-live.csv), [tests de préservation](../tests/arsenal-coverage.test.mjs).

La vérification porte sur le registre documentaire disponible et sur l’intégration dans ce TCG. Une entrée intégrée dispose de cartes, ressources et règles utilisables dans le moteur ; ce statut ne certifie pas sa canonicité, l’existence de chaque accessoire dans une œuvre, ni l’exhaustivité de l’ensemble des publications Alien/Predator. Les valeurs d’attaque, santé, charges, plasma, biomasse et compatibilités génériques sont des choix de gameplay.

| Ensemble | Cartes ajoutées | Recettes ajoutées | Boosters ajoutés |
| --- | ---: | ---: | ---: |
| Arsenaux humains et Yautja | 985 | 233 | 2 |
| Cycles biologiques et lignées | 145 | 108 | 3 |
| **Complément de l’édition 1.4** | **1 130** | **341** | **5** |

Chaque nouvelle recette contient **30 cartes principales et 15 alternatives**, avec au plus trois exemplaires d’un même identifiant sur l’ensemble principal/réserve. Les anciens produits conservent leurs réserves de 15, 20 ou 45 cartes. Les trois decks de départ historiques sont conservés séparément des 659 recettes du catalogue. [Recettes complémentaires](complete-decks.csv), [positions complémentaires](complete-decklists.csv).

## 1. Armes, équipements, modules et ressources

### Références couvertes

L’audit comprend **233 références concrètes** : 154 identités d’équipement du registre central, 68 profils documentaires écran, huit armes admises dans le catalogue complémentaire et trois éléments historiques propres au TCG. Il relie **toutes les 134 armes et les 113 pièces d’équipement historiques humaines/Yautja** aux adaptations et cartes associées, sans réécrire leurs anciennes cartes. [Couverture Arsenal](coverage-arsenal.csv), [module de catalogue](../src/arsenal-cards.js).

| Statut | Lignes | Signification |
| --- | ---: | --- |
| `integrated` | 233 | Référence concrète avec adaptation jouable et recette. |
| `covered-alias` | 8 | Nom du dossier de recherche déjà représenté par une référence intégrée ; renvoi à ses cartes et recettes. |
| `research-only` | 121 | Identité documentaire non admise ; aucune carte ni capacité extrapolée. |
| **Total d’audit** | **362** | 233 références concrètes et 129 lignes de recherche, dont huit alias. |

Les alias couvrent notamment les entrées Lacrima 99, Draco Double Burner, le pistolet de Vasquez et cinq consommables/armes d’Isolation déjà représentés par leurs profils. Les versions nommées d’autres jeux, concepts, armes non identifiées et variantes non admises gardent leur statut de recherche ; elles ne sont pas présentées comme complètes.

### Cartes ajoutées

| Classe | Ajouts | Intégration effective |
| --- | ---: | --- |
| Armes | 127 | Emplacement d’arme, bonus de combat, modules et technique associés. |
| Appareils de soutien | 87 | Protection, détection, camouflage, maintenance ou logistique ; renfort et opération associés. |
| Munitions | 191 | Charges consommées par les familles explicitement compatibles. |
| Modules | 344 | 254 modules des armes, 87 renforts d’appareils et trois accessoires documentés. |
| Réserves plasma | 7 | Recharge de la réserve collective Yautja plafonnée à 12. |
| Techniques, opérations, consommables | 229 | 127 techniques d’armes, 87 services d’appareils et 15 consommables à usage unique. |
| **Total** | **985** | 824 cartes humaines et 161 Yautja. |

Les 127 armes se répartissent entre **95 armes à charges de projectile**, **sept armes plasma**, **23 armes de mêlée** et **deux projectiles réutilisables**. Les familles de charge sont des identifiants de jeu stables ; aucun calibre ni volume réel n’est déduit d’un nom. Flèches, traits, filets et harpons Yautja restent distincts du plasma. Le Smart Disc et le shuriken réutilisables n’utilisent pas de chargeur fictif.

Le silencieux et le harnais documentés sont des modules d’armes ; les torches d’entretien sont des outils de soutien. La présence d’un nom tel que « Plasma Whip » dans un ancien registre ne suffit pas à prouver une consommation de plasma : sa variante de jeu utilise ici la mêlée et conserve une note explicite. Les modules génériques ajoutés sont signalés comme créations du TCG.

Un module d’appareil exige l’identifiant exact d’un équipement compatible déjà installé. Les modules partagent la limite de trois sur un porteur et ne peuvent doubler un emplacement. Les opérations vérifient l’appareil ou la famille d’arme requis. Les imports valident ces montages ainsi que les factions de porteur, y compris leurs affiliations supplémentaires. [Règles Arsenal](../src/arsenal-rules.js), [validation des reprises](../src/duel-save.js).

## 2. Castes, lignées et moyens d’évolution

L’audit biologique couvre **105 sujets et 123 routes**, dont **109 nouvelles recettes `HIVE_ROUTE` et 14 routes historiques**. Les profils de films, jeux sous licence, variantes de projet et cartes historiques restent identifiés séparément. Les chemins de jeu n’affirment pas que toutes ces formes appartiennent à une caste ou à une évolution universelle. [Couverture Ruche](coverage-hive.csv), [catalogue des cycles](../src/hive-cards.js).

Les routes comprennent les éclosions, les hôtes humains, quadrupèdes ou Yautja, les fusions parasitaires, la maturation, les lignées royales, les gestations de branches mutagènes, l’eggmorphose et la ponte. Chaque route précise ses matériaux principaux, ses éventuels hôtes secondaires et catalyseurs, son résultat exact et son coût de biomasse.

Avant la consommation, le moteur vérifie les matériaux présents, la disponibilité du résultat dans la main ou le deck, la biomasse, les contraintes biologiques et la possibilité d’invocation. Les catalyseurs et la Reine de ponte sont conservés lorsque la recette l’indique. L’IA réserve les emplacements nécessaires aux matériaux. Les recettes de reproduction contiennent une copie d’Œuf supplémentaire après l’éclosion initiale ; le parcours combinant eggmorphose et ponte en contient trois. [Règles de cycle](../src/hive-rules.js), [recettes de cycle](../src/hive-decks.js).

Les 145 nouvelles cartes sont obtenables par les trois boosters de cycles et par la fabrication ; elles participent aux 108 recettes de cette partie du complément. Les filiations sont consultables depuis les fiches de Collection, avec accès aux matériaux, actions de transformation et résultats.

## 3. Couverture des domaines et des factions

L’audit générique dénombre **17 classes de cartes**. Il vérifie leur déclaration, leurs références documentaires, leur répartition par faction et leur présence dans une recette. Les types fondamentaux restent `UNIT`, `EQUIPMENT`, `TACTIC` et `LOCATION`, afin de conserver les règles et sauvegardes historiques. [Export des domaines](coverage-domains.csv).

| Domaine | Cartes actives |
| --- | ---: |
| Actions | 196 |
| Armes | 268 |
| Attaques spécialisées | 143 |
| Biomasse | 19 |
| Créatures | 155 |
| Équipements | 210 |
| Évolutions | 126 |
| Honneur | 10 |
| Hôtes | 20 |
| Lieux | 50 |
| Modules | 367 |
| Munitions | 215 |
| Œufs | 9 |
| Personnages | 161 |
| Réserves plasma | 17 |
| Trophées | 12 |
| Véhicules | 43 |
| **Total** | **2 021** |

Les 43 véhicules conservent le prérequis d’un pilote Personnage de faction compatible, avec un pilote affecté à au plus un véhicule. Les lieux, les identités hybrides, la limite de six soutiens autorisés aux Hybrides, les ressources et les campagnes utilisent les règles existantes et les contrôles communs. La relecture du catalogue n’a identifié aucune classe, compétence ou effet non déclaré, ni tactique dépourvue d’effet.

**2 013 cartes sur 2 021** figurent dans au moins une recette principale ou réserve. Les huit autres sont des cartes MX historiques : `MX_HU_092`, `MX_XE_034`, `MX_XE_048`, `MX_YA_033`, `MX_YA_055`, `MX_YA_056`, `MX_YA_059`, `MX_YA_060`. Elles restent dans le catalogue et accessibles par fabrication ; leur absence d’un préconstruit n’est pas une absence de carte ou de mécanique. **Les 1 130 nouvelles cartes sont toutes représentées dans les recettes**. Les 38 doctrines précédentes conservent leur pool de remélange historique.

## 4. Collection du joueur

La Collection possède trois vues :

| Vue | Couverture |
| --- | --- |
| **Cartes** | Exemplaires, cartes manquantes, doublons et jeux de trois ; recherche, quantités, faction, type, set, rareté et tris. |
| **Progression** | Possédées/total et complétion par faction, rareté, type, extension et gamme de deck. Les cartes partagées d’une gamme sont dédupliquées. |
| **Par type de deck** | Recettes de catalogue, départs et decks personnels ; progression, classement par proximité ou poussière, manquants et réserve optionnelle. |

Les quantités de principal et de réserve sont **additionnées avant comparaison à l’inventaire**. Exemple : deux exemplaires dans le principal et un en réserve demandent trois cartes possédées ; deux cartes donnent donc 2/3, et non deux progressions artificiellement complètes.

Le détail présente les manquants, le coût de fabrication et les liens vers les fiches. **Créer le principal avec mes cartes** exige les 30 cartes du principal déjà possédées, la validation de faction et un emplacement libre parmi les 32 decks sauvegardables. Il ne fabrique ni n’accorde automatiquement les manquants. Un principal complet peut être créé même si sa réserve optionnelle reste incomplète.

Les fiches relient armes, munitions, plasma, modules, appareils, opérations, résultats de transformation, matériaux et catalyseurs. Les variantes anciennes restent navigables vers leurs adaptations récentes. L’inventaire JSON exporté contient les quantités possédées et les manquants pour les jeux de trois. [Modèle de Collection](../src/collection.js), [tests fonctionnels](../tests/collection.test.mjs).

## 5. Classeur et reproductibilité

Le classeur courant est [AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx](AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx). Il contient **32 onglets**, **54 règles**, **1 144 compatibilités** et **239 entrées de combinaisons Ruche**, soit **1 383 relations** dans ces deux tables. Une route biologique peut produire plusieurs lignes de relation ; les 239 combinaisons ne sont donc pas 239 routes distinctes.

Les exports séparent les 280 recettes de production, les 38 doctrines MX et les 341 compléments, pour **659 recettes et 32 505 positions**. Les compteurs de synthèse et de factions sont recalculés et vérifiés indépendamment ; chaque position de deck est comparée au moteur. Les empreintes du catalogue, des règles, des sources et de l’Excel sont enregistrées. [Procédure de génération](XLSX_GENERATION.md), [rapport du classeur](../reports/qa/workbook-validation-2026-11-03.json).

```bash
node scripts/sync-production-decks.mjs --write
node scripts/sync-asymmetric-content.mjs --write
node scripts/sync-complete-content.mjs --write
python3 content-plan/build_xlsx.py
python3 scripts/verify-catalogue-xlsx.py
npm run check:complete-content
npm run test:complete
npm run qa:complete -- --out=reports/qa/complete-2026-11-03.json
```

Les 30 sets, 2 602 concepts, 2 853 impressions et 14 finitions du programme éditorial restent séparés du catalogue jouable et de ses sept raretés. Aucun dump privé, actif officiel ou nouvelle illustration n’est ajouté par cet audit.

## 6. Résultats de vérification et limites restantes

La QA complète est **réussie** : **715 duels terminés sur 715**, **18 596 captures/restaurations** et **4 908 continuations déterministes**, avec zéro partie inachevée. Elle exerce les 341 nouvelles recettes dans leur composition initiale et en remix, les cinq identités d’IA et les huit missions. [Rapport complet et empreintes](../reports/qa/complete-2026-11-03.json).

Le même rapport confirme l’exécution des **127 armes**, de **268 compatibilités de modules d’arme**, des **87 modules d’appareil et 87 services**, des **127 techniques** et des **109 nouvelles routes**. Il contrôle **1 216 actions reprises** et **410 refus d’actions incomplètes**. Les tests spécifiques couvrent aussi la préservation des cartes historiques, les consommations, les dépendances des réserves, les trois exemplaires maximum, l’acquisition, les raretés et la protection de malchance.

Le contrôle général de la **révision locale `a4a500b4`**, exécuté après la reprise du 3 novembre 2026, compte **291 tests réussis, zéro échec et zéro test ignoré**, en **52,48 secondes**. Le build contient **203 fichiers publics et 27 éléments critiques du shell**. La régression asymétrique conserve son bilan de **177 duels, 4 256 reprises et 1 130 continuations**. Le rapport de l’édition complète reste la preuve principale pour les ajouts 1.4 ; les anciens rapports 1.3 ne valident pas à eux seuls le nouveau contenu.

Cette reprise corrige les techniques d’arme à projectiles qui épuisent leur dernière charge de munitions : les dégâts sont résolus avec les mots-clés de l’arme, dont **Perforation**, avant la consommation. Une régression vérifie que le dernier tir conserve son effet contre une cible protégée et que la ressource est ensuite dépensée. L’autre vérifie que la mort du porteur par le sang acide de sa cible ne défausse pas deux fois sa munition. Le classeur et ses empreintes sont régénérés après ce correctif. [Règles corrigées](../src/asymmetric-rules.js), [tests des dernières charges](../tests/arsenal-coverage.test.mjs), [rapport de vérification](../reports/qa/workbook-final-verification-2026-11-03.json).

Les scénarios navigateur ordinateur/mobile sont intégrés à `scripts/qa-browser.mjs`, notamment pour la Collection, les liens entre cartes et les reprises. Leur exécution en CI, les contrôles de la PR, sa fusion et le déploiement sont des étapes distinctes dont le statut doit être lu sur la révision effectivement publiée. Cet audit ne les annonce pas comme réalisés.

Les limites explicites restent les **121 recherches d’arsenal non admises**, la qualification documentaire des concepts et variantes de projet, le rapprochement éditorial des extensions et l’équilibrage compétitif. Les chiffres de QA établissent le fonctionnement, la cohérence des ressources et la reprise déterministe ; ils ne démontrent ni une fidélité canonique universelle ni un équilibre compétitif entre decks optimisés.
