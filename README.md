# AVP: HUNT // HIVE TCG

Version 1.0.0 du TCG tactique fan-made jouable hors ligne dans un navigateur. Le jeu propose 158 cartes, trois decks de départ, des boosters, sept raretés, un constructeur de decks, des duels sur trois voies et une campagne de huit missions.

## Jouer

Ouvrir `index.html` dans un navigateur moderne, ou visiter la production Vercel. L'application est autonome : aucun compte, serveur de jeu ou achat réel n'est utilisé.

## Vérifier

```bash
npm test
```

Le test contrôle l'intégrité SHA-256 du standalone récupéré, sa version, ses 158 cartes, ses decks de départ, sa campagne et ses moteurs de données/duel.

## Source

Cette reprise conserve octet pour octet le HTML autonome livré dans la conversation ChatGPT associée. Le détail vérifiable figure dans `SOURCE_PROVENANCE.md`. Le code CSS et JavaScript reste lisible dans le fichier HTML et doit être modularisé lors des prochaines passes Codex sans régression de contenu.

Projet fan non commercial. Alien, Predator et Alien vs. Predator appartiennent à leurs ayants droit respectifs. Le dépôt ne doit pas intégrer d'assets officiels copiés.
