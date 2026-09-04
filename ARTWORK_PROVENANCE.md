# Provenance des illustrations

La vague artistique 1.0.0 comprend exactement 174 bitmaps originaux :

- 158 illustrations individuelles, une par identifiant de carte;
- 8 scènes de campagne;
- 6 illustrations de booster;
- 1 décor d'accueil et 1 plateau tactique.

## Fournisseur et direction

Tous les maîtres ont été générés avec l'outil OpenAI ImageGen intégré à Codex. Aucun fichier visuel officiel, scan, capture de film, logo, police, affiche, key art ou asset tiers n'a été utilisé comme entrée. Les références canoniques sont étudiées en amont par un relecteur, puis transformées en notes écrites de morphologie et de fonction. Elles ne sont ni téléversées dans le générateur, ni stockées dans le dépôt.

Le profil de prompt des cartes impose une composition verticale 4:5, un sujet ou une action propre aux données de la carte, une peinture réaliste de science-fiction horrifique sombre, une silhouette lisible en vignette et une palette de faction. Il interdit le texte, les lettres, chiffres, logos, filigranes, interfaces, cadres, collages, ressemblances d'acteurs et reproductions d'un photogramme, d'une affiche, d'un key art, d'un costume complet, d'un accessoire ou d'un décor officiel identifiable.

La direction artistique v2 sépare deux obligations qui ne doivent jamais être confondues :

- la morphologie d'une créature connue doit être quasi canonique, avec un score de fidélité d'au moins 95/100;
- la composition doit rester originale : pose, cadrage, éclairage, action et environnement sont conçus pour le jeu et ne reproduisent aucune image officielle.

Chaque proposition reçoit sept notes entières sur 100 : silhouette (25 %), anatomie (25 %), attributs distinctifs (20 %), langage de surface (10 %), échelle et proportions (10 %), lisibilité de pose (5 %) et continuité de variante (5 %). Le score pondéré doit atteindre 95/100 et chaque axe au moins 90/100. Toutes les ancres du profil le plus précis — ancres héritées du profil de base incluses — doivent réussir, le prompt doit être complet et aucun défaut bloquant ne peut subsister. L'asset est sinon régénéré avec une correction ciblée, puis entièrement revu; le seuil et les ancres ne peuvent jamais être abaissés. Une révision de brief accepte au maximum six tentatives; après six rejets, le brief est réécrit et incrémenté, tandis que l'historique complet et le même seuil sont conservés.

Pour les humains, la fidélité porte sur le rôle, la fonction, la catégorie d'équipement, la posture tactique et la palette de faction. Le visage reste une création originale et ne doit ressembler à aucun acteur ou interprète réel. Les vêtements et accessoires sont des variantes originales cohérentes, jamais une copie exacte d'un costume ou d'un objet de tournage. Pour un yautja, la carrure, la logique crânienne, les mandibules ou leur volume sous masque, les quilles et la silhouette de chasse doivent rester reconnaissables; le biomask lui-même conserve une géométrie et des détails originaux, sans reproduire un accessoire officiel.

Les scènes emploient le même contrat d'originalité avec une composition 16:9 pour l'accueil, le plateau et la campagne, et 4:5 pour les boosters. Les prompts détaillés sont propres à chaque mission et série : signal oublié, colonie assiégée, jungle de chasse, rituel sous la glace, bio-ingénierie, planète-réserve, confinement urbain, arène finale et six thèmes de collection correspondants.

Chaque asset résulte d'un appel ImageGen distinct et d'une inspection visuelle avant optimisation. Deux premières propositions de reines, jugées trop anthropomorphes, ont été rejetées puis remplacées par des anatomies corrigées; ces propositions rejetées ne font pas partie des dérivés publics. Cet exemple historique ne constitue toutefois pas une certification selon la grille v2.

## Migration vers la revue v2

La vague artistique 1.0.0 a été produite et revue avant l'adoption du seuil morphologique v2. Elle est donc **non certifiée v2**. Son approbation technique v1 atteste la provenance, l'absence d'entrées officielles, la décodabilité, les dimensions et l'originalité générale; elle ne prouve pas un score morphologique d'au moins 95/100.

Aucun asset v1 ne reçoit de certification par simple migration de métadonnées. Chaque illustration est d'abord enregistrée `pending`, puis doit être réexaminée visuellement avec la grille v2, recevoir sept sous-scores, un score pondéré et une décision documentée dans `../art-originals/fidelity-ledger.json`. Elle est régénérée ou reste rejetée si elle échoue. Seuls les assets dont la dernière tentative est `accepted` peuvent porter l'état « certifié v2 ». Les critères sont versionnés dans `art-direction/avp-morphology-profiles.v1.json` et les extensions que ce registre déclare.

## Chaîne de production

Les PNG maîtres sont conservés dans le dossier de travail privé `../art-originals/`; ils ne sont ni publiés par le serveur, ni copiés dans `dist/`.

La publication suit obligatoirement cet ordre :

1. Le brief privé lie les neuf sections de prompt, le prompt négatif, le profil le plus précis et toutes ses ancres par SHA-256. Le ledger privé conserve chaque tentative, ses sept sous-scores, ses défauts, sa correction ciblée et sa décision.
2. `npm run review:art -- --approve --reviewer "Nom du relecteur"` décode les 174 PNG, vérifie ratios et résolutions, puis refuse tout asset `pending` ou `rejected`. Il exige 174 dernières tentatives `accepted`, chacune à 95/100 minimum, chaque axe à 90/100 minimum, toutes les ancres réussies, aucun défaut bloquant et un prompt complet.
3. `npm run prepare:art` recalcule chaque empreinte et refuse un master absent, ajouté ou modifié depuis la revue v2.
4. La conversion se fait dans un répertoire de staging isolé. Le dossier public, le manifeste, le registre navigateur et la liste blanche ne sont échangés qu'après validation complète; toute erreur déclenche le rollback vers les dérivés précédents.
5. `npm run verify:release` exécute la syntaxe, les tests, les simulations d'équilibre et le build de production. Vercel répète syntaxe, tests et build via `npm run vercel-build`.

`scripts/prepare-art.mjs` :

1. exige les 158 identifiants du catalogue et les 16 scènes déclarées;
2. refuse les noms de fichier non sûrs, les fichiers absents, vides ou extérieurs au dossier source;
3. produit des WebP versionnés aux dimensions prévues;
4. calcule les SHA-256 des maîtres et dérivés;
5. génère le registre navigateur et la liste publique explicite;
6. bloque le build si la couverture n'est pas 174/174 ou si le budget total dépasse 32 Mio.

Le manifeste final `assets/art/manifest.json` constitue la source de vérité publique. Il ne publie que les preuves et agrégats sûrs de fidélité — révision, couverture, score minimal et moyen, minimum par axe, nombre de retries et répartition des profils. Les références canoniques textuelles, prompts, cibles, ancres par asset et historiques de tentatives restent privés. Les contrôles de couverture, signature WebP, taille, dimensions, chemins, symlinks, empreintes et budget sont automatisés dans `tests/art.test.mjs`.

Ces images restent des créations de projet fan. Leur présence ne confère aucune licence commerciale sur les noms, personnages ou univers auxquels le jeu fait référence.
