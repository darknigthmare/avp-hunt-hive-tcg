# Audit de livraison 1.0.0 — 31 août 2026

## Base et périmètre

Base standalone Git `81dc957db58263aee4a89429524afdf3d3180c09`, puis édition modulaire `2403dab`. Archive exacte inchangée, SHA-256 `23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f`. Le catalogue conserve 158 cartes, trois starters, sept raretés et huit missions. Le build autorise exactement 189 fichiers publics ; archive, maîtres PNG, revue privée, documentation, tests et secrets sont exclus.

## P0/P1/P2 implémentés

- Résolution atomique des combats, décès en chaîne, doubles KO, immunités synthétiques, mutations temporaires, auras de santé, Ruée, Quarantaine et contraintes Unique.
- Import JSON borné, validation des identités et quantités, sauvegarde de secours, migration v1/v2 vers v3 et fonctionnement temporaire explicite si le stockage est refusé.
- Checkpoints de duel : cartes, plateau, effets, scénario et état aléatoire complets. Enregistrement après action résolue. Un tour IA interrompu repart de son checkpoint initial, sans changer les tirages.
- Pause/reprise après fermeture, checkpoint inclus dans l'export/import, récompense unique et suppression du checkpoint dans le même profil. Protection contre un onglet ancien qui écraserait une victoire ; le duel vivant est conservé si sa capture échoue.
- Campagne et replays : verrouillages, boosts de scénario, premier booster seulement une fois, récompenses réduites ensuite, succès et aucun gain lors d'un abandon.
- IA à informations visibles, choix d'équipement par seuil de destruction/survie, archétype Humain d'infanterie/équipement au lieu d'un mélange de soutiens incompatibles.
- Constructeur par identité, six soutiens biologiques maximum pour Hybride, pagination, tutoriel, clavier/focus, titres hiérarchisés, textes agrandis, contraste des surfaces de lecture, main accessible par lien direct.
- Correction du débordement des archives mobile, du défilement des boosters sur écran court et des contrôles d'attaque recouvrant les statistiques.
- Vague artistique complète : 158 cartes et 16 scènes originales générées avec OpenAI ImageGen, revues par empreinte SHA-256, converties en WebP et intégrées par manifeste. Aucun visuel, logo, son ou asset officiel n'est inclus. Les icônes et l'audio synthétique restent originaux.

## Vérifications reproductibles

- `npm run verify:release` : syntaxe validée, 162 tests réussis, 2 000 duels d'équilibrage avec garde-fous de release, puis build de 189 fichiers publics.
- `npm audit` : zéro vulnérabilité sur les neuf paquets installés. `git diff --check` validé.
- Campagne moteur : 72 duels sur huit missions et trois starters, puis parcours séquentiel intégral avec le starter Yautja inchangé, rechargement après chaque victoire, sans dégâts forcés. La mission finale est gagnée en six tentatives et douze manches.
- Navigateur Chromium desktop 1440×1000 : onboarding et tutoriel complet, collection, six boosters, huit missions, modal de carte, lancement d'un duel et tour IA réellement résolu. Toutes les illustrations visibles sont décodées ; console et erreurs de page vides.
- Navigateur Chromium mobile 390×844 : accueil, collection, boosters et duel contrôlés, sans débordement horizontal ; 48/48 images de collection, 6/6 boosters et 7/7 images du duel décodés.
- PWA : après arrêt complet du serveur local, un rechargement réel restitue encore l'accueil et ses quatre images depuis le service worker. Les tests couvrent aussi les refus CacheStorage, MIME incorrects et chemins sensibles.
- Axe 4.12.1 WCAG 2 A/AA : aucune violation automatique sur le duel ; treize nœuds restent indéterminés pour le contraste à cause de glyphes ou de fonds en dégradé. Pas de validation sur appareil physique iOS/Android ni de certification WCAG revendiquée.

## Équilibrage mesuré

Commande : `npm run balance -- --seeds 1009,991009 --games-per-pair 100 --json --assert-release`.

Deux lots indépendants, 2 000 duels, dix confrontations, places de départ alternées, 0 plafonnement, 12,59 tours moyens et 55,20 % de victoires pour le premier joueur. Résultats du passage final :

| Faction | Victoires |
|---|---:|
| Xénomorphes | 51,25 % |
| Yautja | 53,50 % |
| Humains | 57,50 % |
| Ingénieurs | 42,63 % |
| Hybrides | 45,13 % |

L'écart global entre factions est de 14,87 points. Le garde-fou de release impose aussi 0 partie plafonnée, au plus 7 points d'écart de siège, au plus 15 points entre factions et au plus 75 % de domination sur chaque confrontation et seed. Ces mesures valident la stabilité de l'IA fournie ; elles ne certifient pas un équilibre de compétition ni les performances de decks optimisés par des joueurs humains.

## PWA et exploitation

Le worker conserve la correction Vercel des alias : seul `/` est précaché comme document canonique ; les redirections `/index.html` ne sont jamais réutilisées comme navigation. Le nouveau module de reprise fait partie du shell atomique. Une mise à jour attend la fermeture des anciens onglets afin de ne pas mélanger les versions en duel.

Le jeu reste un TCG solo local : aucun compte, paiement, serveur de progression ou multijoueur distant. Les contrôles de contraste et de clavier ne constituent pas une certification WCAG exhaustive. Les preuves de commit, production, HTTP et du parcours navigateur final figurent dans le rapport de livraison associé.
