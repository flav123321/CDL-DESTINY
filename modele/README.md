# Modèle de jeu de carrière

Moteur de CDL Destiny rendu générique. Un jeu = un dossier dans `jeux/`, sans toucher au moteur.
Exemple complet : `jeux/rugby-destiny/` (clubs et joueurs fictifs).

## Ce que le moteur fournit

Accueil avec plusieurs carrières, création du joueur avec nom proposé, saisons de 8 à 10 décisions,
écran de résultat après chaque choix, 4 tournois et une grande finale par saison, deux divisions,
note de saison qui décide du maintien au club, mercato avec offres variées, retraite, palmarès,
classement mondial, drapeaux et écussons, hors connexion, mises à jour par `content.json`,
application React Native dans `app/`.

## Créer un jeu

1. Copier `jeux/rugby-destiny/` vers `jeux/<id-du-jeu>/`.
2. `jeu.json` : `id` unique (minuscules et tirets), nom, description, couleurs `fond`, `accent`, `accentTexte`.
   L'`id` sépare les sauvegardes et le cache de chaque jeu : deux jeux sur le même site ne doivent jamais partager un `id`.
3. `content.json` : réécrire `labels`, `roles`, `origins`, `nationalities`, `starterTeams`, `names`, `teams`, `scenarios`.
   Ajuster `rules` si besoin (points, primes, difficulté, maintien).
4. Remplacer les trois icônes : `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
5. `npm test`, puis `node tools/build.mjs jeux/<id-du-jeu>`.
6. Publier le contenu de `jeux/<id-du-jeu>/dist/` à la racine d'un dépôt avec GitHub Pages
   (ou dans un sous-dossier d'un site existant).

Mise à jour du contenu d'un jeu déjà publié : modifier `content.json`, augmenter `revision`,
`npm run validate`, puis remplacer seulement `content.json` sur le site.

## Repères dans content.json

| Bloc | Rôle |
| --- | --- |
| `labels` | Tous les textes propres au jeu : nom, divisions, tournois, finale, stats, monnaie, année de départ. Les valeurs absentes reprennent celles de CDL Destiny. |
| `labels.stats` | Noms affichés des 4 attributs. Les clés internes restent `aim`, `move`, `sense`, `mental`. |
| `labels.perf` | Nom de la stat de performance par tournoi (ratio autour de 1, comme le K/D). |
| `roles` | Postes ou rôles, avec le poids de chaque attribut (total 1). |
| `origins` | Parcours de départ : bonus d'attributs et petite histoire. |
| `nationalities` | `[nom affiché, code pays à 2 lettres]` pour le drapeau. |
| `names` | `firstNames` et `lastNames` pour le nom proposé et les joueurs générés (ou `gamertagWords` pour des pseudos). `generatedNats` : nationalités des joueurs générés. |
| `teams.cdl` | 1re division : 12 équipes de 4 joueurs notés, avec `color`, `tag` (3 lettres max) et `nat`. |
| `teams.challengers` | 2e division : 8 équipes ; leurs joueurs sont générés. |
| `scenarios` | Décisions. `pool` : `prep` (intersaison), `train` (entraînement), `off` (vie perso), `clutch` (moment décisif en tournoi, avec réussite selon une stat). |

Les noms internes `cdl`, `challengers`, `CDL` et `CH` (dans `rules.qualifiers`, `rules.points`) viennent du premier jeu :
`CDL` = 1re division, `CH` = 2e division. Ne pas les renommer, le moteur les attend.

Effets autorisés dans les décisions : `aim`, `move`, `sense`, `mental`, `morale`, `fame`, `money`, `form`, `chem`.

## Commandes (Node 20 ou plus)

```
npm test
npm run validate
node tools/build.mjs jeux/<id-du-jeu>
```

Application mobile : construire le jeu, mettre son adresse dans `app/src/config.ts`, renseigner `app/app.json`,
puis `cd app && npm install && npx expo start`. Non testée sur un vrai téléphone.
