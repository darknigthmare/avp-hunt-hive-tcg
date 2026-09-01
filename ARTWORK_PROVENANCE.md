# Provenance des illustrations

La vague artistique 1.0.0 comprend exactement 174 bitmaps originaux :

- 158 illustrations individuelles, une par identifiant de carte;
- 8 scènes de campagne;
- 6 illustrations de booster;
- 1 décor d'accueil et 1 plateau tactique.

## Fournisseur et direction

Tous les maîtres ont été générés avec l'outil OpenAI ImageGen intégré à Codex. Aucun fichier visuel officiel, scan, capture de film, logo, police, affiche ou asset tiers n'a été utilisé comme entrée.

Le profil de prompt des cartes impose une composition verticale 4:5, un sujet ou une action propre aux données de la carte, une peinture réaliste de science-fiction horrifique sombre, une silhouette lisible en vignette et une palette de faction. Il interdit le texte, les lettres, chiffres, logos, filigranes, interfaces, cadres, collages, ressemblances d'acteurs et reproductions exactes de costumes, armes, créatures, véhicules, lieux ou scènes officielles.

Les scènes emploient le même contrat d'originalité avec une composition 16:9 pour l'accueil, le plateau et la campagne, et 4:5 pour les boosters. Les prompts détaillés sont propres à chaque mission et série : signal oublié, colonie assiégée, jungle de chasse, rituel sous la glace, bio-ingénierie, planète-réserve, confinement urbain, arène finale et six thèmes de collection correspondants.

Chaque asset résulte d'un appel ImageGen distinct et d'une inspection visuelle avant optimisation. Deux premières propositions de reines, jugées trop anthropomorphes, ont été rejetées puis remplacées par des anatomies entièrement insectoïdes; ces propositions rejetées ne font pas partie des dérivés publics.

## Chaîne de production

Les PNG maîtres sont conservés dans le dossier de travail privé `../art-originals/`; ils ne sont ni publiés par le serveur, ni copiés dans `dist/`.

La publication suit obligatoirement cet ordre :

1. `npm run review:art -- --approve --reviewer "Nom du relecteur"` décode les 174 PNG, vérifie leurs ratios et résolutions minimales, puis exige une approbation nominative. Le fichier privé `../art-originals/review.json` conserve la checklist visuelle, les dimensions, les tailles, les profils de prompt, le fournisseur et le SHA-256 de chaque master.
2. `npm run prepare:art` recalcule chaque empreinte et refuse un master absent, ajouté ou modifié depuis la revue.
3. La conversion se fait dans un répertoire de staging isolé. Le dossier public, le manifeste, le registre navigateur et la liste blanche ne sont échangés qu'après validation complète; toute erreur déclenche le rollback vers les dérivés précédents. Une erreur de nettoyage d'un ancien backup ne détruit jamais la nouvelle release validée.
4. `npm run verify:release` exécute la syntaxe, les tests, les simulations d'équilibre et le build de production. Vercel répète syntaxe, tests et build via `npm run vercel-build`.

`scripts/prepare-art.mjs` :

1. exige les 158 identifiants du catalogue et les 16 scènes déclarées;
2. refuse les noms de fichier non sûrs, les fichiers absents, vides ou extérieurs au dossier source;
3. produit des WebP versionnés aux dimensions prévues;
4. calcule les SHA-256 des maîtres et dérivés;
5. génère le registre navigateur et la liste publique explicite;
6. bloque le build si la couverture n'est pas 174/174 ou si le budget total dépasse 32 Mio.

Le manifeste final `assets/art/manifest.json` constitue la source de vérité publique. Il publie la révision de revue, le nom du relecteur et la checklist réussie, sans exposer les PNG privés. Les contrôles de couverture, signature WebP, taille, dimensions, chemins, symlinks, empreintes et budget sont automatisés dans `tests/art.test.mjs`.

Ces images restent des créations de projet fan. Leur présence ne confère aucune licence commerciale sur les noms, personnages ou univers auxquels le jeu fait référence.
