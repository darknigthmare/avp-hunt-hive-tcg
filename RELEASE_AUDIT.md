# Audit de livraison 1.0.0 — 31 août 2026

## Base et périmètre

Base standalone Git `81dc957db58263aee4a89429524afdf3d3180c09`, puis édition modulaire `2403dab`. Archive exacte inchangée, SHA-256 `23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f`. Le catalogue conserve 158 cartes, trois starters, sept raretés et huit missions. Treize fichiers publics sont autorisés ; archive, documentation, tests et secrets sont exclus.

## P0/P1/P2 implémentés

- Résolution atomique des combats, décès en chaîne, doubles KO, immunités synthétiques, mutations temporaires, auras de santé, Ruée, Quarantaine et contraintes Unique.
- Import JSON borné, validation des identités et quantités, sauvegarde de secours, migration v1/v2 vers v3 et fonctionnement temporaire explicite si le stockage est refusé.
- Checkpoints de duel : cartes, plateau, effets, scénario et état aléatoire complets. Enregistrement après action résolue. Un tour IA interrompu repart de son checkpoint initial, sans changer les tirages.
- Pause/reprise après fermeture, checkpoint inclus dans l'export/import, récompense unique et suppression du checkpoint dans le même profil. Protection contre un onglet ancien qui écraserait une victoire ; le duel vivant est conservé si sa capture échoue.
- Campagne et replays : verrouillages, boosts de scénario, premier booster seulement une fois, récompenses réduites ensuite, succès et aucun gain lors d'un abandon.
- IA à informations visibles, choix d'équipement par seuil de destruction/survie, archétype Humain d'infanterie/équipement au lieu d'un mélange de soutiens incompatibles.
- Constructeur par identité, six soutiens biologiques maximum pour Hybride, pagination, tutoriel, clavier/focus, titres hiérarchisés, textes agrandis, contraste des surfaces de lecture, main accessible par lien direct.
- Correction du débordement des archives mobile, du défilement des boosters sur écran court et des contrôles d'attaque recouvrant les statistiques.
- Illustrations SVG, icônes et audio synthétique originaux. Remplacement supplémentaire des accroches officielles dans les titres de tactique et de succès.

## Vérifications reproductibles

- `npm test` : 152 tests réussis lors du dernier passage complet ; provenance, règles, IA, équilibrage, campagne, sauvegarde/reprise, contraste, PWA et HTTP.
- `npm run check`, `npm run build` et `git diff --check` validés.
- `npm audit --omit=dev` : zéro vulnérabilité, aucune dépendance applicative.
- Campagne moteur : 72 duels sur huit missions et trois starters, puis parcours séquentiel intégral avec le starter Yautja inchangé, rechargement après chaque victoire, sans dégâts forcés.
- Campagne navigateur : huit missions gagnées en 29 parties réelles, huit boosters et 116 cartes possédées, six succès dont « Cycle rompu », rechargement entre victoires, console sans erreur. Les commandes de lancement et de résultat passent par l'interface ; les choix tactiques sont automatisés par le moteur légal, sans modifier les dégâts ou les récompenses. Le tampon de victoire a été replacé sous les boutons de replay après ce parcours.
- Navigateur Chromium : tutoriel, carte jouée réellement, enregistrement automatique, pause/rechargement/reprise identiques ; document rechargé 25 ms après la fin du tour joueur et résultat adverse identique après reprise.
- Export téléchargé de 7 812 octets, import par le vrai champ fichier : checkpoint restauré à l'identique. Fermeture puis réouverture du profil Chromium : duel tour 2 conservé.
- Desktop et mobile émulés, dont 1440×900, 390×844 et 320×568 ; navigation, lisibilité, défilement et focus inspectés. Axe 4.12.1 : aucune violation détectée sur les neuf vues contrôlées ; quelques vérifications de contraste des illustrations restent indéterminées. Pas de validation sur appareil physique iOS/Android revendiquée.

## Équilibrage mesuré

Commande : `npm run balance -- --seeds 1009,991009 --games-per-pair 100 --json`.

Deux lots indépendants, 2 000 duels, dix confrontations, places de départ alternées, 0 plafonnement, 12,61 tours moyens. Résultats reproduits à l'identique :

| Faction | Victoires |
|---|---:|
| Xénomorphes | 53,25 % |
| Yautja | 57,00 % |
| Humains | 51,38 % |
| Ingénieurs | 42,75 % |
| Hybrides | 45,63 % |

Le précédent lot plaçait les Humains à 37 %. Leur progression vient ici de la construction cohérente du deck IA et des équipements ; aucun nouveau gonflement de statistiques ni d'Escouade.

Les confrontations restent asymétriques : Humains contre Ingénieurs 84,5 %, premier joueur 59,8 %. Ces mesures ne certifient pas un équilibre de compétition, ni les performances de decks optimisés par des joueurs humains. Les missions 2 et 8 restent exigeantes ; elles ont été gagnées sans modifier le starter.

## PWA et exploitation

Le worker conserve la correction Vercel des alias : seul `/` est précaché comme document canonique ; les redirections `/index.html` ne sont jamais réutilisées comme navigation. Le nouveau module de reprise fait partie du shell atomique. Une mise à jour attend la fermeture des anciens onglets afin de ne pas mélanger les versions en duel.

Le jeu reste un TCG solo local : aucun compte, paiement, serveur de progression ou multijoueur distant. Les contrôles de contraste et de clavier ne constituent pas une certification WCAG exhaustive. Les preuves de commit, production, HTTP et du parcours navigateur final figurent dans le rapport de livraison associé.
