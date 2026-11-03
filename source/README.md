# CDL Destiny

Jeu de carrière CDL hors ligne, avec contenu mis à jour depuis un fichier en ligne. Projet de fan non officiel, sans lien avec Activision ni la Call of Duty League.

## Dossiers

- `content/content.json` : règles, équipes, personnages, dialogues. C'est le seul fichier à modifier pour changer le contenu.
- `web/` : moteur du jeu (`game.template.html`), synchronisation (`sync.js`), validation et fusion (`content-core.js`).
- `tools/` : `build.mjs` construit le jeu, `validate.mjs` contrôle un `content.json`.
- `test/` : tests de la validation et de la fusion.
- `dist-pwa/` : version web installable, prête à mettre en ligne.
- `app/` : application React Native (Expo).

## Commandes (Node 20 ou plus)

```
npm test
npm run validate
npm run build
```

`npm run build` régénère `dist-pwa/` et `app/src/gameHtml.ts`. Relance-le après toute modification de `web/`.

## Mettre à jour le contenu

1. Modifie `content/content.json` et augmente `revision` de 1.
2. Lance `npm run validate`.
3. Remplace uniquement `content.json` sur le site.

Si la révision n'augmente pas, le jeu ignore le fichier.

## Application React Native

```
cd app
npm install
npx expo start
```

Avant de compiler, change l'adresse dans `src/config.ts` et les identifiants `com.tonpseudo.cdldestiny` dans `app.json`.

- APK Android : `npx eas-cli build -p android --profile apk`
- iOS : `npx eas-cli build -p ios --profile production` (compte développeur Apple payant requis)
