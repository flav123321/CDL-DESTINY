# Rugby Carrière — Étape 1 : le cœur du jeu (Top 14) — Plan de construction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** une carrière jouable de bout en bout avec le Top 14 seul : création du joueur, centre de formation, saisons simulées, fin de saison, sauvegarde, hors connexion sur iPhone.

**Architecture:** une page web sans framework, en modules JavaScript (ES modules). Le moteur est en JavaScript pur, sans accès à l'écran (`src/engine/`), et testé avec `node --test`. L'interface (`src/ui/`) lit l'état du moteur et affiche des écrans avec des choix cliquables. Les données (clubs, joueurs, événements) sont des modules à part (`src/data/`). Un service worker met tout en cache pour le hors-ligne.

**Tech Stack:** HTML/CSS, JavaScript ES2022, Node 20+ (`node --test`, aucune dépendance), service worker et manifest pour l'installation sur iPhone.

**Spec:** `docs/2026-11-14-rugby-carriere-design.md`

## Global Constraints

- Tout le texte du jeu est en **français**.
- **Aucune dépendance** externe au moment de jouer : le jeu marche **hors connexion** une fois installé.
- **Aucun logo officiel** : chaque club a un **écusson SVG original**, généré à partir de ses couleurs et de ses initiales.
- **Saison de départ : 2026-27.**
- **Stats :** 10 stats notées de **0 à 100**, bornées, qui sont `puissance`, `vitesse`, `endurance`, `plaquage`, `passe`, `jeuAuPied`, `lecture`, `conquete`, `mental` et `leadership`.
- **Personnalités :** **exactement 3**, choisies parmi **12**.
- **Âge de départ : 16 ans.**
- **Nationalités :** les 20 du design (top 20 World Rugby, novembre 2026).
- **Pays de centre de formation** : France, Angleterre, Afrique du Sud, Japon. Dans cette étape, **seule la France est jouable**. Les trois autres sont affichés mais grisés, avec la mention « Bientôt ».
- **Effectifs :** vrais joueurs du Top 14 pour la saison 2026-27, avec des notes estimées.
- **Hasard :** tout passe par un générateur aléatoire à graine (seed), pour que les tests soient reproductibles.

## Review Focus

1. **Choix des personnalités :** on ne peut pas valider avec 2 ou 4 personnalités. Le bouton reste désactivé et `createPlayer` refuse. Test dans la Task 2.
2. **Stats hors bornes :** après un cumul de bonus (personnalités, événements, progression), aucune stat ne dépasse 100 ni ne passe sous 0. Test dans les Tasks 2 et 5.
3. **Carrière trop facile :** un joueur de 18 ans tout juste sorti du centre n'est pas titulaire en Top 14 sur la majorité des matchs (moins de 50 % de titularisations sur 200 simulations à graine fixe). Test dans la Task 4.
4. **Sauvegarde absente ou corrompue :** si la sauvegarde est absente, vide, illisible, ou si le stockage lève une erreur (navigation privée sur iPhone), le jeu propose une nouvelle carrière sans planter. Test dans la Task 6.
5. **Joueur blessé :** un joueur blessé n'est jamais retenu sur une feuille de match tant que sa blessure n'est pas finie, et les événements qui demandent de jouer sont adaptés. Test dans la Task 5.

---

### Task 1: Base du projet, hasard à graine, postes et note globale

**Files:**
- Create: `package.json` (`"type": "module"`, script `"test": "node --test tests/"`)
- Create: `src/engine/rng.js`, `src/data/positions.js`, `src/engine/rating.js`
- Test: `tests/rng.test.js`, `tests/rating.test.js`

**Interfaces:**
- Produces:
  - `createRng(seed: number) -> { next(): number /*[0,1)*/, int(min, max): number /*inclusif*/, pick(arr): any, chance(p: number): boolean }`
  - `POSITIONS: Array<{ id: string, label: string, numeros: number[], tailleCm: [min,max], poidsKg: [min,max], poids: Record<StatKey, number> }>`. Les ids sont `pilier-gauche`, `talonneur`, `pilier-droit`, `deuxieme-ligne`, `troisieme-ligne-aile`, `numero-8`, `demi-de-melee`, `demi-d-ouverture`, `centre`, `ailier`, `arriere`.
  - `STAT_KEYS: string[]` (les 10 clés des Global Constraints)
  - `overall(stats: Record<StatKey, number>, positionId: string) -> number`, un entier entre 0 et 100

- [ ] **Step 1: Write the failing tests**
  - `rng même graine → même suite`, avec `createRng(42).next()` répété 5 fois, identique entre deux instances.
  - `int(1,6) reste dans [1,6]` sur 1 000 tirages.
  - `overall pilier privilégie conquete` : avec les mêmes stats à 50 sauf `conquete: 90`, le pilier gauche a une note plus haute que l'ailier.
  - `overall ouvreur privilégie jeuAuPied` : avec `jeuAuPied: 90`, le demi d'ouverture a une note plus haute que le pilier droit.
  - `poids de chaque poste somment à 1` (à 0,001 près).
- [ ] **Step 2: Run** `npm test`. Expected : FAIL, modules introuvables.
- [ ] **Step 3: Implement.** `rng` avec l'algorithme mulberry32. `overall` est la somme pondérée, arrondie et bornée. Les poids par poste sont à choisir par l'implémenteur (en somme 1), avec 3 à 4 stats dominantes par poste.
- [ ] **Step 4: Run** `npm test`. Expected : PASS.
- [ ] **Step 5: Commit**, avec le message `feat: base projet, rng, postes, note globale`.

### Task 2: Personnalités, nationalités et création du joueur

**Files:**
- Create: `src/data/personalities.js`, `src/data/nationalities.js`, `src/engine/player.js`
- Test: `tests/player.test.js`

**Interfaces:**
- Consumes: `createRng`, `POSITIONS`, `STAT_KEYS`, `overall`
- Produces:
  - `PERSONALITIES: Array<{ id, label, description, statMods: Partial<Record<StatKey, number>>, tags: string[] }>`
    - Les 12 du design, section 7.2, avec les ids `bosseur`, `leader-ne`, `guerrier`, `technicien`, `flair`, `calme`, `tete-brulee`, `fetard`, `ambitieux`, `fidele`, `studieux` et `fragile-doue`.
    - Les tags pilotent les événements, par exemple `progression+` ou `blessures+`.
  - `NATIONALITIES: Array<{ id, label, drapeau: string /*emoji*/ }>`, avec les 20 pays du design dans l'ordre du classement.
  - `ACADEMY_COUNTRIES: Array<{ id: 'FR'|'EN'|'ZA'|'JP', label, jouable: boolean }>`, où seul `FR` a `jouable: true`.
  - `createPlayer({ prenom, nom, nationaliteId, positionId, tailleCm, poidsKg, personnaliteIds, paysCentreId }, rng) -> Player`
  - `Player = { prenom, nom, age: 16, nationaliteId, positionId, tailleCm, poidsKg, personnaliteIds, stats, potentiel: number, moral: number, blessure: null | { nom, semainesRestantes }, clubId: null, historique: [] }`

- [ ] **Step 1: Write the failing tests**
  - `refuse 2 personnalités` et `refuse 4 personnalités` : `createPlayer` lève une `Error` dont le message contient « 3 personnalités ».
  - `refuse personnalité en double` : la liste `['bosseur','bosseur','calme']` lève une erreur.
  - `refuse pays de centre non jouable` : `paysCentreId: 'JP'` lève une erreur.
  - `stats de départ entre 25 et 55 avant mods` : la base est tirée dans cet intervalle, puis les mods des personnalités sont ajoutés. Toutes les stats finales restent dans [0,100].
  - `guerrier augmente plaquage` : sur une moyenne de 200 joueurs à graines différentes, le plaquage est plus élevé avec `guerrier` que sans.
  - `gabarit hors fourchette du poste` : les valeurs sont ramenées à la fourchette (clamp).
  - `potentiel entre 60 et 95`.
- [ ] **Step 2: Run** `npm test`. Expected : FAIL.
- [ ] **Step 3: Implement** `createPlayer` dans `src/engine/player.js`. Il valide les entrées, tire la base avec le `rng`, ajoute les mods et borne les stats avec `clampStat(v) -> number`, qui est exportée et réutilisée plus tard.
- [ ] **Step 4: Run** `npm test`. Expected : PASS.
- [ ] **Step 5: Commit**, avec le message `feat: création du joueur et personnalités`.

### Task 3: Données Top 14 2026-27 et écussons

**Files:**
- Create: `src/data/leagues/top14.js`, `src/engine/crest.js`
- Test: `tests/top14-data.test.js`, `tests/crest.test.js`

**Interfaces:**
- Consumes: `POSITIONS`, `NATIONALITIES`
- Produces:
  - `TOP14 = { id: 'top14', label: 'Top 14', pays: 'FR', saison: '2026-27', clubs: Club[] }`
  - `Club = { id, nom, ville, couleurs: [hex, hex], prestige: 1..5, centreFormation: 1..5, joueurs: Joueur[] }`
  - `Joueur = { nom, positionId, age, nationaliteId /*id de NATIONALITIES ou 'autre'*/, note: 40..95, jiff: boolean }`
  - `crestSvg(club: Club) -> string`, un SVG en ligne : forme de blason, deux couleurs, initiales du club. Pas de dessin qui reprend le logo réel.

- [ ] **Step 1: Research.** Chercher les **14 clubs du Top 14 2026-27** et l'effectif de chacun : nom, poste et âge, sur les sites officiels des clubs, la LNR et la presse rugby. Noter les sources en commentaire en haut du fichier. Estimer les notes ainsi :
  - international titulaire : 82-92
  - international remplaçant : 76-84
  - titulaire en club : 70-80
  - rotation : 62-72
  - espoir : 50-62
- [ ] **Step 2: Write the failing tests**
  - `14 clubs`.
  - `chaque club a au moins 30 joueurs`.
  - `chaque club a au moins 2 joueurs par poste de première ligne et au moins 1 par autre poste`.
  - `positionId valides`.
  - `notes dans [40,95]`.
  - `ids de club uniques`.
  - `couleurs au format #rrggbb`.
  - `crestSvg renvoie un SVG contenant les 2 couleurs du club et commence par <svg`.
- [ ] **Step 3: Run** `npm test`. Expected : FAIL.
- [ ] **Step 4: Implement**, en remplissant `top14.js` avec les données trouvées et en écrivant `crestSvg`.
- [ ] **Step 5: Run** `npm test`. Expected : PASS.
- [ ] **Step 6: Commit**, avec le message `feat: données Top 14 2026-27 et écussons`.

### Task 4: Simulation de la saison de Top 14

**Files:**
- Create: `src/engine/season.js`, `src/engine/match.js`
- Test: `tests/season.test.js`, `tests/match.test.js`

**Interfaces:**
- Consumes: `createRng`, `overall`, `TOP14`, `Player`
- Produces:
  - `buildFixtures(clubIds: string[]) -> Array<Array<[homeId, awayId]>>`, soit 26 journées en aller-retour, chaque club jouant une fois par journée.
  - `teamStrength(club: Club, player: Player | null) -> number`, calculée sur les 23 meilleurs joueurs du club, avec le joueur du user s'il en fait partie.
  - `selectMatchday(club, player, rng) -> 'titulaire' | 'remplacant' | 'non-retenu'`. Le joueur est comparé aux joueurs réels de son poste. Un joueur blessé est toujours `non-retenu`.
  - `simulateMatch(home, away, player, rng) -> { scoreHome, scoreAway, essaisHome, essaisAway, perfJoueur: null | { statut, minutes, essais, points, plaquages, note: 0..10 } }`, avec un avantage à domicile.
  - `standings(results) -> Array<{ clubId, j, g, n, p, pf, pc, bonus, pts }>`, avec 4 points pour une victoire, 2 pour un nul, un bonus offensif pour 3 essais de plus que l'adversaire et un bonus défensif pour une défaite de 5 points ou moins.
  - `playoffs(table, rng) -> { barrages, demis, finale, champion, relegue: clubId, barrageAccession: clubId }`. Les places 1 et 2 vont directement en demi-finale, les places 3 à 6 jouent les barrages. Le 14e est relégué, le 13e joue le barrage d'accession.

- [ ] **Step 1: Write the failing tests**
  - `26 journées, chaque club 13 domicile / 13 extérieur`.
  - `bonus offensif et défensif correctement attribués` : sur un cas 30-10 avec 4 essais à 1, le vainqueur prend 5 points. Sur un cas 20-17, le perdant prend 1 point.
  - `blessé jamais retenu` *(Review Focus 5)*.
  - `jeune de 18 ans rarement titulaire` *(Review Focus 3)* : un joueur créé avec une note de 55 et placé dans un club de prestige 4 est titulaire dans moins de 50 % des 200 tirages de `selectMatchday` à graine fixe.
  - `le meilleur club finit dans le top 6 dans plus de 70 % de 50 saisons simulées`.
  - `playoffs renvoie un champion parmi les 6 premiers`.
- [ ] **Step 2: Run** `npm test`. Expected : FAIL.
- [ ] **Step 3: Implement.** Pour le score, tirer le nombre d'essais selon l'écart de force entre les équipes, puis ajouter les pénalités. La note du match du joueur dépend de ses stats, de sa forme et du hasard.
- [ ] **Step 4: Run** `npm test`. Expected : PASS.
- [ ] **Step 5: Commit**, avec le message `feat: simulation saison Top 14`.

### Task 5: Événements, centre de formation, progression et blessures

**Files:**
- Create: `src/data/events.js`, `src/engine/events.js`, `src/engine/academy.js`, `src/engine/progression.js`, `src/engine/injuries.js`
- Test: `tests/events.test.js`, `tests/academy.test.js`, `tests/progression.test.js`

**Interfaces:**
- Consumes: `Player`, `createRng`, `clampStat`, `PERSONALITIES`
- Produces:
  - `EVENTS: Array<{ id, phase: 'centre'|'pro'|'tous', periode?: Periode, condition?: (state)=>boolean, poids: number, texte: string, choix: Array<{ label, effets: Effets }> }>`
    - Au moins **40 événements**, dont au moins 20 pour le centre de formation, et un mélange de sportifs et d'extra-sportifs.
    - Un événement a 2 à 4 choix.
  - `Effets = { stats?: Partial<Record<StatKey,number>>, moral?, potentiel?, blessure?: { nom, semaines }, flags?: string[] , texteResultat: string }`
  - `PERIODES = ['presaison','automne','hiver','printemps','ete']`
  - `drawEvent(state, periode, rng) -> Event`, un tirage pondéré parmi les événements dont la condition est vraie. Il exclut les événements déjà vus dans la même saison, ainsi que ceux qui demandent de jouer quand le joueur est blessé.
  - `applyChoice(state, event, choixIndex) -> state`, qui ne modifie pas l'état d'origine (immuable) et borne les stats.
  - `academyStep(state, rng) -> state`, qui avance d'une période au centre de formation, de 16 à 19 ans, catégories Crabos puis Espoirs. À la fin, elle renvoie `state.offresContrat` : un contrat pro au club si `overall >= 58`, sinon un prêt Pro D2 ou Nationale, présenté comme un « club partenaire » (texte seulement dans cette étape), ou une libération.
  - `progressSeason(player, { minutesJouees, entrainementBonus }, rng) -> Player`
    - Progression forte jusqu'à 23 ans, stable de 26 à 30 ans, déclin après 31 ans.
    - Bonus avec la personnalité `bosseur`.
    - Plafond fixé par `potentiel`.
  - `rollInjury(player, rng) -> blessure | null`, avec un risque plus élevé pour `guerrier` et `fragile-doue`. `tickInjury(player, semaines) -> Player`.

- [ ] **Step 1: Write the failing tests**
  - `au moins 40 événements, chacun 2 à 4 choix, chaque choix a texteResultat`.
  - `drawEvent n'offre pas d'événement 'jouer' à un blessé` *(Review Focus 5)*.
  - `applyChoice borne les stats` : sur un joueur à 98 de puissance avec un effet de +10, la puissance devient 100 *(Review Focus 2)*.
  - `applyChoice ne mute pas l'état d'origine`.
  - `academie dure de 16 à 19 ans et finit avec offresContrat non vide`.
  - `progression : à potentiel égal, 20 ans progresse plus que 32 ans`.
  - `progression ne dépasse jamais potentiel`.
  - `fragile-doue se blesse plus souvent` (sur 1 000 tirages).
- [ ] **Step 2: Run** `npm test`. Expected : FAIL.
- [ ] **Step 3: Implement.** Écrire les 40 événements en français, réalistes, dans l'esprit du design (section 7.4).
- [ ] **Step 4: Run** `npm test`. Expected : PASS.
- [ ] **Step 5: Commit**, avec le message `feat: événements, centre de formation, progression, blessures`.

### Task 6: Boucle de carrière et sauvegarde

**Files:**
- Create: `src/engine/career.js`, `src/engine/save.js`
- Test: `tests/career.test.js`, `tests/save.test.js`

**Interfaces:**
- Consumes: tout le moteur
- Produces:
  - `newCareer(input, seed) -> CareerState`, où `CareerState = { seed, rngState, saison: '2026-27', phase: 'centre'|'pro'|'fin', periode, player, ligues: { top14: { resultats, classement } }, evenementEnCours: Event|null, journal: string[] }`
  - `advance(state) -> state`, qui avance d'une période : simulation des journées de la période, tirage d'un événement, ou résumé de fin de saison.
  - `choose(state, choixIndex) -> state`
  - `seasonSummary(state) -> { saison, age, club, matchs, titularisations, minutes, essais, points, noteMoyenne, classementClub, champion }`
  - `contractOffers(state, rng) -> Array<{ clubId, duree: 1..4, role: 'titulaire'|'rotation'|'espoir' }>`, avec des offres de 1 à 3 clubs du Top 14 selon la note et la saison.
  - `retire(state) -> state`, qui passe la phase à `'fin'`.
  - `save(state, storage = globalThis.localStorage) -> boolean` et `load(storage) -> CareerState | null`, sous la clé `'rugby-carriere-v1'`.

- [ ] **Step 1: Write the failing tests**
  - `une carrière complète tourne de 16 ans jusqu'à 3 saisons pro sans erreur`, en choisissant toujours le choix 0, à graine fixe.
  - `seasonSummary contient l'âge`.
  - `load renvoie null si vide, si JSON illisible, ou si storage.getItem lève une erreur` *(Review Focus 4)*.
  - `save renvoie false si storage.setItem lève une erreur`.
  - `save puis load redonne le même état`.
- [ ] **Step 2: Run** `npm test`. Expected : FAIL.
- [ ] **Step 3: Implement.** L'état du `rng` est sauvegardé dans `rngState`, pour que le hasard reprenne au même point après un rechargement.
- [ ] **Step 4: Run** `npm test`. Expected : PASS.
- [ ] **Step 5: Commit**, avec le message `feat: boucle de carrière et sauvegarde`.

### Task 7: Interface, installation iPhone et hors-ligne

**Files:**
- Create: `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `icons/icon-192.png`, `icons/icon-512.png`
- Create: `src/ui/app.js` (routeur des écrans), `src/ui/screens/creation.js`, `src/ui/screens/centre.js`, `src/ui/screens/saison.js`, `src/ui/screens/resume.js`, `src/ui/screens/accueil.js`
- Test: vérification manuelle dans le navigateur (voir Step 3)

**Interfaces:**
- Consumes: `newCareer`, `advance`, `choose`, `seasonSummary`, `contractOffers`, `save`, `load`, `crestSvg`, `PERSONALITIES`, `NATIONALITIES`, `ACADEMY_COUNTRIES`, `POSITIONS`
- Produces: les écrans suivants.
  - **Accueil** : boutons « Nouvelle carrière » et « Continuer ». « Continuer » est grisé si `load()` renvoie `null`.
  - **Création** : 5 étapes.
    1. Identité et nationalité, avec une grille de drapeaux.
    2. Poste.
    3. Gabarit, avec des curseurs bornés selon le poste.
    4. Personnalités : des cartes à cocher. Le bouton reste désactivé tant qu'il n'y a pas exactement 3 personnalités, et un compteur « 2/3 » s'affiche.
    5. Pays du centre (seul FR actif, les autres « Bientôt »), puis le choix du club parmi les offres.
  - **Centre / Saison** : en-tête avec l'écusson, le nom, l'âge et la note. Carte de l'événement avec des choix en boutons, puis le texte du résultat. Bouton « Continuer ». Onglet « Classement ».
  - **Résumé de saison** : tableau avec l'âge, puis les offres de contrat en boutons.
  - **Sauvegarde automatique** après chaque choix.

- [ ] **Step 1: Implement** les écrans. Style : thème sombre « vestiaire », grandes cibles tactiles (au moins 44 px), lisible sur un écran d'iPhone.
- [ ] **Step 2: Implement** le service worker. Il met en cache tous les fichiers à l'installation (cache-first), et la liste des fichiers est versionnée. Le manifest a `display: standalone` et un nom court « Rugby Carrière ».
- [ ] **Step 3: Verify.**
  - Lancer `npx serve .` ou `python3 -m http.server`, et ouvrir le jeu en vue mobile (390 × 844).
  - Jouer la création puis 2 saisons.
  - Couper le réseau dans les outils du navigateur et recharger : le jeu s'ouvre et la carrière continue.
  - Vérifier qu'on ne peut pas valider avec 2 personnalités.
  - Expected : aucune erreur dans la console.
- [ ] **Step 4: Run** `npm test`. Expected : tout passe.
- [ ] **Step 5: Commit**, avec le message `feat: interface et mode hors-ligne`.

---

## Étapes suivantes (plans séparés, après celui-ci)

1. Pro D2 (vrais joueurs) et Nationale (joueurs générés), avec montées, descentes, prêts et JIFF.
2. Angleterre (Premiership réelle, Championship générée), Japon, Afrique du Sud (Currie Cup), et l'ouverture des centres de formation de ces pays.
3. Les 20 sélections nationales et leurs compétitions.
4. Les transferts internationaux et la finition.
