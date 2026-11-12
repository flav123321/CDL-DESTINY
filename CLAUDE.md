# CDL Destiny

Jeu publié avec GitHub Pages depuis la racine de `main`. Les fichiers à la racine sont générés.

- Le code et le contenu sont dans `source/`. Modifie `source/content/content.json` et `source/web/`, jamais `index.html` à la main.
- Change de contenu seulement : augmente `revision`, lance `npm run validate`, puis copie `content.json` à la racine.
- Change de moteur : lance `npm test` et `npm run build` dans `source/`, puis copie tout `source/dist-pwa/` à la racine.
- Réponds à l'utilisateur en français, sur un ton simple : il joue sur iPhone, sans ordinateur.

## Modèle pour d'autres jeux

- `modele/` contient le moteur rendu générique et `modele/jeux/<id>/` un dossier par jeu (voir `modele/README.md`).
- `rugby-destiny/` à la racine est la version publiée du jeu d'essai : copie de `modele/jeux/rugby-destiny/dist/`.
- Ne pas modifier `source/` pour un autre jeu : CDL Destiny garde son propre moteur.
- Chaque jeu a un `id` unique dans `jeu.json` : il sépare sauvegardes et caches sur le même site.
