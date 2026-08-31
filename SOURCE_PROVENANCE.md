# Provenance de la source

- Conversation ChatGPT : `6a8f156b-13d0-83ed-89c7-0e1a26fb552d` — « Créer un jeu vidéo TCG Alien Predator ».
- Message de livraison : `62208db0-8b57-40eb-9377-43f40964d941`.
- Titre livré : **AVP: HUNT // HIVE TCG — Version 1.0.0**.
- Fichier récupéré : `AVP_HUNT_HIVE_TCG_STANDALONE.html`.
- Identifiant Estuary observé dans le cache : `file_0000000002c481f49d1a62b581dcdc1c`.
- SHA-256 : `23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f`.

Le SHA-256 correspond exactement à celui publié par le message ChatGPT. La conversation mentionne aussi l'archive complète `AVP_HUNT_HIVE_TCG_COMPLETE_v1.0.0.zip` (SHA-256 `679652a33050dd5be70535f0ba7dceaa80ce274bae18f7e18a49e20a7cb13679`), mais son corps ZIP n'était pas présent dans les téléchargements ni dans le cache local au moment de cette reprise. Le présent dépôt part donc du standalone exact et vérifié, qui contient tout le moteur, les données, les styles et l'interface.

## Edition modulaire

`AVP_HUNT_HIVE_TCG_STANDALONE.html` reste l'archive immuable de référence. Le fichier `index.html` de production charge une extraction lisible de ses trois couches d'origine :

- `src/data.js` pour le catalogue et la configuration ;
- `src/engine.js` pour les règles et l'IA ;
- `src/app.js` pour l'interface et la persistance ;
- `assets/styles.css` pour la présentation responsive.

Les corrections professionnelles sont appliquées à ces modules et couvertes par des tests. Le script `scripts/prepare-source.mjs` documente l'extraction mécanique initiale; il ne doit pas être relancé sur des modules déjà enrichis sans intention explicite, car il régénère les fichiers depuis l'archive originale.
