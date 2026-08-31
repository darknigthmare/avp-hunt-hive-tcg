# Audit de livraison 1.0.0 — 31 août 2026

## Base et périmètre

Base Git `81dc957db58263aee4a89429524afdf3d3180c09`. Archive standalone vérifiée par SHA-256 et inchangée. Le catalogue conserve 158 cartes, trois decks de départ et huit missions. Le build public ne contient que 12 fichiers explicitement autorisés ; archive historique, documentation interne, tests et secrets sont exclus.

## Corrections livrées

- P0 : imports bornés et validés, migration et secours, résistance à un stockage refusé, aucun gain d'abandon, résolution atomique du combat et des doubles KO, quantités de deck bornées.
- P1 : immunités, mutation temporaire, PV des auras réels, Ruée sans attaque supplémentaire, Quarantaine complète, invocations Unique/exclusives, scénarios rituel/trophées, booster garanti au dixième paquet sans UR, récompense de campagne effective et non répétable.
- P1 : IA déterministe utilisant uniquement les informations autorisées, victoires directes prioritaires, choix de cibles et échanges, refus de nombreuses actions inutiles ou suicidaires.
- P2 : architecture séparée, constructeur par identité avec soutien biologique Hybride limité à six, tutoriel quatre étapes, pagination, clavier et focus, descriptions des unités en duel, contraste/texte agrandi, Web Audio local, installation et cache PWA versionné.

## Vérifications reproductibles

- `npm test` : 93 tests, aucun échec. Les tests incluent de vrais serveurs HTTP sur ports libres ; le cycle du service worker est aussi testé en environnement simulé.
- `npm run check` : syntaxe valide.
- `npm run build` : archive vérifiée, 12 fichiers publics, cache lié au contenu.
- `npm audit --omit=dev` : aucune vulnérabilité, aucune dépendance applicative externe.
- Chromium : tutoriel, déploiement/attaque/tour IA, raccourci clavier, absence de gain d'abandon, recherche avec focus conservé, constructeur mobile et plafond de soutien vérifiés. Rechargement hors ligne réussi après installation du worker.
- Dimensions contrôlées : 1440×900 et 390×844. Pas de débordement horizontal observé à 390 px. Il s'agit d'une émulation Chromium, pas d'un essai sur appareil iOS/Android physique.

## Équilibrage : mesure et limites

`npm run balance -- --extended` utilise la même IA pour les deux camps, des decks générés et des graines fixes. Dernier lot : 1 000 duels, 13,5 tours moyens, aucune partie plafonnée. Taux de victoire : Xéno 55,8 %, Yautja 61,8 %, Humains 37,0 %, Ingénieurs 47,3 %, Hybrides 48,3 %.

Escouade passe de +100 à +250 ATK par autre Humain allié. Deux lots indépendants de 1 000 parties par variante confirment l'amélioration des Humains (28,5–28,75 % vers 37–37,75 %). Les valeurs des descriptions sont synchronisées avec le moteur.

Ces résultats ne certifient pas un équilibre compétitif : les Humains restent en retrait avec les decks générés. Des parties humaines avec decks optimisés sont encore nécessaires avant une telle affirmation. Les contrôles automatisés de contraste signalent également des zones à examiner manuellement à cause des dégradés/effets visuels ; aucune conformité WCAG exhaustive n'est revendiquée.

## Persistance et exploitation

La collection, les decks et la progression sont enregistrés localement et exportables. Le duel en cours n'est pas restauré après fermeture ou rechargement. Aucun compte, paiement, serveur de progression ni multijoueur distant n'est embarqué. Une mise à jour PWA attend la fermeture des anciennes pages afin de ne pas mélanger deux moteurs pendant un duel.

La confirmation du commit publié, du déploiement et des contrôles HTTP de production accompagne la livraison ; ils ne sont pas déduits des seuls tests locaux.
