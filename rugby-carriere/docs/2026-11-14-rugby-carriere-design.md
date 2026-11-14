# Rugby Carrière — Document de conception

*Version 1 — 14 novembre 2026*

## 1. L'intention

Un jeu de carrière de rugbyman **réaliste**, qui fait vivre ce que vivent les vrais joueurs : on entre en centre de formation à 16 ans et on va jusqu'à la retraite. Le jeu doit donner l'impression d'être dans le vrai monde du rugby, avec les vrais clubs, les vrais joueurs et les vraies compétitions, pas dans un jeu arcade générique.

C'est un jeu solo, qu'on joue sur iPhone, même hors connexion.

## 2. Objectifs

- Partir de 16 ans en centre de formation, avec des **événements aléatoires et des choix** à chaque étape.
- **Choisir son poste.**
- **Choisir 3 personnalités parmi 12.** Ces 3 personnalités fixent les stats de départ du joueur.
- **Ligues jouables :**
  - France : Top 14, Pro D2, Nationale
  - Angleterre : Premiership, Championship
  - Japon : League One (Division 1)
  - Afrique du Sud : Currie Cup
- **Sélections nationales** jouables : U18, U20 puis équipe A.
- **Vrais noms d'équipes partout.**
- **Vrais joueurs** en Top 14, Pro D2, Premiership, League One, Currie Cup et dans les sélections nationales.

## 3. Ce que le jeu ne fait pas (version 1)

- Jouer les matchs en temps réel : les matchs sont simulés. On les suit par un résumé et par quelques choix au moment clé.
- Le multijoueur et le mode en ligne.
- La gestion d'un club (ça, c'est un autre jeu).

## 4. Ce qui ferait rater le jeu, même s'il marche techniquement

- Des noms ou des clubs qui sonnent faux.
- Une carrière trop facile, où l'on est titulaire en Top 14 à 18 ans à tous les coups.
- Des choix sans conséquence.
- Un jeu qui demande une connexion internet.

## 5. Contraintes

- **Logos :** les logos officiels sont des marques déposées et ne sont pas reproduits. Chaque club reçoit un **écusson original à ses couleurs** (forme, couleurs, initiales), qu'on reconnaît sans copier le logo.
- **Données :** les effectifs sont ceux de la **saison 2026-27**, trouvés en ligne au moment de la construction. Ils pourront être mis à jour ensuite.
- **Ligues sans vrais joueurs :** en Nationale et en Championship, les effectifs sont générés, avec des noms crédibles selon le pays.
- **Notes des vrais joueurs :** il n'existe pas de note officielle. Les notes sont donc estimées (statut international, titulaire ou remplaçant, âge, poste) et peuvent être corrigées à la main.

## 6. Les approches envisagées

| Approche | Pour | Contre |
|---|---|---|
| **Jeu web installable (choisie)** | Pas d'App Store, modifs visibles immédiatement, hors connexion, données faciles à mettre à jour | Un peu moins « natif » |
| Appli iPhone native (Expo) | Plus fluide en main, vibrations | Chaque modif passe par un build et TestFlight, lent pour un jeu très chargé en données |
| Appli native avec données sur serveur | Mises à jour des données à distance | Demande une connexion et un serveur, contraire à « hors ligne » |

**Choix :** jeu web installable, sur le même principe que CDL Destiny.

## 7. Le déroulé du jeu

### 7.1 Création du joueur

1. **Nom, prénom, nationalité.** 20 nationalités : le top 20 du classement World Rugby (novembre 2026), qui comprend déjà les 6 nations du Tournoi :
   - Afrique du Sud, Nouvelle-Zélande, Irlande, France, Angleterre, Écosse, Australie, Argentine, Fidji, Pays de Galles
   - Italie, Japon, Géorgie, Portugal, États-Unis, Espagne, Tonga, Chili, Samoa, Uruguay

   La nationalité décide de la sélection nationale du joueur. Elle compte aussi pour les règles **JIFF**, c'est-à-dire le quota de joueurs formés localement en Top 14 et en Pro D2 : un étranger formé en France à partir de 16 ans devient JIFF.
2. **Poste**, parmi les 15 postes réels : pilier gauche, talonneur, pilier droit, 2e ligne, 3e ligne aile (flanker), n°8, demi de mêlée, demi d'ouverture, centre (12 ou 13), ailier, arrière.
3. **Gabarit** (taille et poids), dans une fourchette réaliste pour le poste.
4. **3 personnalités sur 12** (voir 7.2).
5. **Pays du centre de formation** *(demande du user)* : le joueur choisit librement où il commence (France, Angleterre, Afrique du Sud ou Japon), quelle que soit sa nationalité. Par exemple, un Fidjien peut commencer en France, ou un Argentin en Angleterre.
6. **Club du centre de formation** : on reçoit 2 ou 3 propositions aléatoires de clubs du pays choisi (plus ou moins prestigieux), et on en choisit une. *(Proposition)*
   - Japon : il n'y a pas de centre de formation de club comme en France. Le parcours passe par le lycée puis l'université, avant d'être recruté par une équipe d'entreprise. *(Proposition)*

### 7.2 Les 12 personnalités *(proposition, liste modifiable)*

Chaque personnalité ajoute des bonus et des malus aux stats de départ, et influence certains événements.

| Personnalité | Effet sur les stats | Effet sur les événements |
|---|---|---|
| Bosseur | + Endurance, + progression à l'entraînement | Bonus sur les choix d'entraînement |
| Leader né | + Leadership, + Mental | Brassard plus tôt |
| Guerrier | + Plaquage, + Puissance | Joue blessé plus souvent (risque) |
| Technicien | + Passe, + Jeu au pied | — |
| Flair | + Lecture du jeu, + Vitesse | Gestes de génie, mais aussi erreurs |
| Calme | + Mental, + Jeu au pied | Résiste à la pression des grands matchs |
| Tête brûlée | + Puissance | Plus de cartons |
| Fêtard | + Moral du vestiaire | Écarts de discipline |
| Ambitieux | + Mental | Veut des transferts, conflits si remplaçant |
| Fidèle | + Moral | Bonus quand il reste au club |
| Studieux | + Lecture du jeu | Peut préparer sa reconversion |
| Fragile physiquement mais doué | + Technique globale | Plus de blessures |

### 7.3 Les stats du joueur *(proposition)*

10 stats, notées sur 100 :

- Puissance
- Vitesse
- Endurance
- Plaquage
- Passe
- Jeu au pied
- Lecture du jeu
- Conquête (mêlée, touche, ruck)
- Mental
- Leadership

La note globale est une moyenne pondérée selon le poste. Par exemple, un pilier dépend surtout de la conquête et de la puissance ; un ouvreur, du jeu au pied, de la passe et de la lecture du jeu.

### 7.4 Le centre de formation (16 à 19 ans)

- **Catégories :** Crabos (U18), puis Espoirs, avec des entraînements et des matchs de catégorie.
- **Rythme :** chaque saison est découpée en périodes (présaison, automne, hiver, printemps, été). À chaque période :
  - un événement aléatoire, avec 2 à 4 choix cliquables ;
  - les choix sont sportifs (entraînement spécifique, muscu, changer de poste…) ou extra-sportifs (études, famille, copains, agent…).
- **Exemples d'événements :** blessure à l'entraînement, convocation en équipe de France U18, entraîneur qui veut te faire changer de poste, blessure d'un pro qui t'ouvre une place pour un match de Top 14, bac à passer, proposition d'un club anglais.
- **Signature :** au bout du parcours, contrat pro dans ton club, prêt en Pro D2 ou en Nationale, ou départ.

### 7.5 La carrière pro

- **Saisons simulées journée par journée :** feuille de match (titulaire, remplaçant ou non retenu), minutes jouées, essais, points, plaquages et note du match.
- **Moments clés :** dans certains matchs (finale, match serré), un choix au moment décisif, par exemple tenter la pénalité ou jouer la touche.
- **Choix entre les périodes :** comme au centre de formation (entraînement, vie privée, médias…).
- **Fin de saison :** résumé avec l'âge, les matchs, les minutes, les essais, les points et la note moyenne, puis des offres de contrat ou de transfert.
- **Progression :** le joueur progresse selon son âge, son temps de jeu, ses choix et ses personnalités. Il atteint son pic vers 26-30 ans, puis décline.
- **Blessures :** réalistes, avec une durée d'indisponibilité.
- **Retraite :** choisie par le joueur, ou forcée par le déclin ou une blessure.

### 7.6 Les sélections nationales

- Convocations U18, U20, puis équipe A, selon la note du joueur, son temps de jeu et son poste face à la concurrence (les vrais joueurs de la sélection).
- **Compétitions :** Tournoi des Six Nations, Rugby Championship, test-matchs d'automne et d'été, Coupe du monde tous les 4 ans (simulée).
- **Effectifs :** les 20 sélections ont leurs vrais effectifs, qui servent de concurrence au joueur pour sa place.
- **Pays sans ligue dans le jeu :** la note de base de la sélection vient de ses internationaux qui jouent dans les ligues du jeu, complétée par des estimations.

### 7.7 Les ligues

- **Format :** chaque ligue a son vrai format de championnat (phases finales, montées, descentes). Les clubs non contrôlés sont simulés selon la force de leur effectif.
- **Saison de départ :** 2026-27. Les résultats sont ensuite fictifs.
- **Transferts :** entre les ligues de tous les pays.

## 8. Les données

- **Format :** un fichier par ligue. Pour chaque club : nom réel, ville, couleurs, écusson généré. Pour chaque joueur : nom, poste, âge, nationalité, note estimée.
- **Recherche :** les vrais effectifs sont cherchés en ligne, en commençant par le Top 14, puis Pro D2, Premiership, League One, Currie Cup et les sélections.
- **Joueurs générés :** pour la Nationale et le Championship, des listes de prénoms et de noms par pays.

## 9. Laissé au constructeur

- L'équilibrage précis des stats et de la progression.
- Le moteur de simulation des matchs.
- Le texte des événements aléatoires (au moins 40 au départ).
- Le style visuel (écran sombre, esprit vestiaire).
- La sauvegarde sur le téléphone (une seule carrière pour la version 1).

## 10. Ordre de construction proposé

1. **Le cœur du jeu**, avec le Top 14 seul : création du joueur, centre de formation, saisons, fin de saison.
2. Les autres ligues françaises, puis anglaises, japonaise et sud-africaine.
3. Les sélections nationales.
4. Les transferts entre pays, et la finition.
