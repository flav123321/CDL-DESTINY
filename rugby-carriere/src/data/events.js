// Événements aléatoires. phase : 'centre' (16-19 ans), 'pro' ou 'tous'. periode facultative.
// tags 'requiertApte' : jamais proposé à un joueur blessé. condition(state) facultative.
const poste = (s) => s.player.positionId;
const avant = (s) => ['pilier-gauche', 'talonneur', 'pilier-droit', 'deuxieme-ligne', 'troisieme-ligne-aile', 'numero-8'].includes(poste(s));
const has = (s, id) => s.player.personnaliteIds.includes(id);

export const EVENTS = [
  // ───────────── CENTRE DE FORMATION ─────────────
  { id: 'c-premier-jour', phase: 'centre', periode: 'presaison', poids: 6, condition: (s) => s.player.age === 16,
    texte: "Premier jour au centre de formation. Dans le vestiaire, les anciens te jaugent. Le responsable te demande de te présenter devant tout le groupe.",
    choix: [
      { label: 'Parler franchement de tes ambitions', effets: { stats: { leadership: 3, mental: 1 }, moral: 4, texteResultat: "Certains ricanent, d'autres respectent. On saura qui tu es." } },
      { label: 'Rester discret et observer', effets: { stats: { lecture: 2 }, texteResultat: "Tu repères vite qui compte vraiment dans ce groupe." } },
      { label: 'Faire rire tout le monde', effets: { moral: 8, flags: ['ambianceur'], texteResultat: 'La glace est brisée. Tu es déjà adopté.' } },
    ] },
  { id: 'c-muscu', phase: 'centre', poids: 5,
    texte: "Le préparateur physique te propose un programme de musculation renforcé, en plus des séances collectives. Ça veut dire des réveils à 6 h.",
    choix: [
      { label: 'Accepter, à fond', effets: { stats: { puissance: 4, endurance: 1 }, moral: -3, texteResultat: '+4 kg de muscle en trois mois. Le corps tire, mais suit.' } },
      { label: 'Version allégée', effets: { stats: { puissance: 2 }, texteResultat: 'Progrès raisonnables, sans casser la machine.' } },
      { label: 'Refuser, tu préfères le ballon', effets: { stats: { passe: 2 }, texteResultat: 'Le préparateur note ton refus dans un coin de sa tête.' } },
    ] },
  { id: 'c-bac', phase: 'centre', periode: 'printemps', poids: 5, condition: (s) => s.player.age === 17,
    texte: "Le bac approche. Tes notes ont baissé depuis que tu t'entraînes deux fois par jour. Tes parents s'inquiètent.",
    choix: [
      { label: 'Lever le pied sur le rugby pour réviser', effets: { stats: { lecture: 2 }, moral: 3, flags: ['bac'], texteResultat: 'Bac en poche, mention assez bien. Tes parents respirent.' } },
      { label: 'Tout miser sur le rugby', effets: { stats: { endurance: 2, puissance: 2 }, moral: -2, texteResultat: 'Rattrapage de justesse. Le rugby, ce sera ça ou rien.' } },
      { label: 'Réviser la nuit, s’entraîner le jour', effets: { stats: { mental: 3 }, forme: -10, flags: ['bac'], texteResultat: 'Tu valides les deux, mais tu finis lessivé.' } },
    ] },
  { id: 'c-changement-poste', phase: 'centre', poids: 3,
    texte: "L'entraîneur des Crabos te prend à part : « Je te vois bien à un autre poste. Tu aurais plus d'avenir. » Il veut tester ça dès samedi.",
    choix: [
      { label: "Accepter l'essai", effets: { stats: { lecture: 3, mental: 1 }, texteResultat: "Tu découvres le jeu sous un autre angle. Ça t'ouvre l'esprit, même si tu reviens à ton poste." } },
      { label: 'Refuser poliment', effets: { stats: { mental: 1 }, moral: 2, texteResultat: 'Il respecte ton choix, mais il faudra lui prouver qu’il a tort.' } },
    ] },
  { id: 'c-selection-u18', phase: 'centre', poids: 4, tags: ['requiertApte'], condition: (s) => s.player.age >= 17,
    texte: "Convocation pour un stage avec la sélection nationale U18 ! Mais il tombe la même semaine qu'un match décisif des Crabos.",
    choix: [
      { label: 'Partir en stage avec la sélection', effets: { stats: { mental: 2, lecture: 2 }, moral: 6, flags: ['u18'], texteResultat: 'Tu côtoies les meilleurs de ta génération. Tu reviens transformé.' } },
      { label: 'Rester avec ton équipe', effets: { stats: { leadership: 3 }, moral: 2, texteResultat: "Tes coéquipiers n'oublieront pas. Le sélectionneur, lui, non plus." } },
    ] },
  { id: 'c-blessure-entrainement', phase: 'centre', poids: 3, tags: ['requiertApte'],
    texte: "Sur un plaquage à l'entraînement, ton épaule fait un bruit inquiétant. Le kiné hésite.",
    choix: [
      { label: 'Passer des examens tout de suite', effets: { blessure: { nom: "Luxation de l'épaule", semaines: 6 }, texteResultat: 'Luxation. Six semaines dehors, mais bien soignée.' } },
      { label: 'Serrer les dents et continuer', effets: { blessure: { nom: "Luxation de l'épaule", semaines: 11 }, stats: { mental: 2 }, texteResultat: 'Mauvaise idée : la blessure s’aggrave. Onze semaines d’arrêt.' } },
    ] },
  { id: 'c-pro-blesse', phase: 'centre', poids: 3, tags: ['requiertApte'], condition: (s) => s.player.age >= 17,
    texte: "Hécatombe chez les pros à ton poste ! Le manager t'appelle la veille d'un match de Top 14 : tu es sur la feuille, sur le banc.",
    choix: [
      { label: 'Foncer, c’est ta chance', effets: { stats: { mental: 4 }, moral: 10, flags: ['debut-top14'], texteResultat: "Tu entres à la 71e. Un plaquage, une course, et une ovation. Tu as goûté au Top 14." } },
      { label: "Demander à ne pas être pressé", effets: { stats: { lecture: 1 }, moral: -2, texteResultat: 'Le manager comprend… mais il en appelle un autre.' } },
    ] },
  { id: 'c-club-anglais', phase: 'centre', poids: 2, condition: (s) => s.player.age >= 17,
    texte: "Un recruteur d'un club anglais de Premiership te contacte en secret. Il te promet une académie moderne et un salaire.",
    choix: [
      { label: "L'écouter sans s'engager", effets: { moral: 3, flags: ['contact-anglais'], texteResultat: 'Tu gardes son numéro. Ça pourra servir.' } },
      { label: 'Refuser, tu es bien ici', effets: { moral: 2, stats: { mental: 1 }, texteResultat: 'Le club apprend ta fidélité. Ça compte.' } },
    ] },
  { id: 'c-copains', phase: 'centre', periode: 'hiver', poids: 4,
    texte: "Tes potes du lycée organisent une grosse soirée samedi. Tu as match dimanche matin.",
    choix: [
      { label: 'Y aller, juste une heure', effets: { moral: 5, forme: -5, texteResultat: "Une heure… qui devient trois. Dimanche, les jambes sont lourdes." } },
      { label: 'Rester à la maison', effets: { stats: { mental: 2 }, moral: -2, texteResultat: 'Frais pour le match. Les copains te chambrent un peu.' } },
      { label: 'Y aller à fond', effets: { moral: 8, forme: -12, flags: ['ecart'], texteResultat: 'Mémorable. L’entraîneur, lui, a tout su lundi.' } },
    ] },
  { id: 'c-agent', phase: 'centre', poids: 3, condition: (s) => s.player.age >= 17,
    texte: "Un agent sportif réputé veut te représenter. Il prend 10 % mais connaît tous les présidents du Top 14.",
    choix: [
      { label: 'Signer avec lui', effets: { flags: ['agent'], moral: 3, texteResultat: 'Tu as maintenant quelqu’un qui défend tes intérêts.' } },
      { label: 'Attendre encore un peu', effets: { stats: { mental: 1 }, texteResultat: 'Pas de précipitation. Tu restes maître de ton parcours.' } },
    ] },
  { id: 'c-video', phase: 'centre', poids: 4,
    texte: "L'analyste vidéo propose des séances individuelles le mercredi soir pour décortiquer tes matchs.",
    choix: [
      { label: "S'inscrire", effets: { stats: { lecture: 4 }, texteResultat: 'Tu vois enfin tes erreurs de placement. Ça change tout.' } },
      { label: 'Préférer du travail sur le terrain', effets: { stats: { vitesse: 2, endurance: 1 }, texteResultat: 'Tu enchaînes les sprints. Le chrono baisse.' } },
    ] },
  { id: 'c-capitaine-crabos', phase: 'centre', poids: 3, tags: ['requiertApte'],
    texte: "Le capitaine de ton équipe est blessé. L'entraîneur cherche quelqu'un pour porter le brassard ce week-end.",
    choix: [
      { label: 'Te proposer', effets: { stats: { leadership: 4 }, moral: 3, texteResultat: 'Discours d’avant-match, voix qui tremble un peu… et victoire.' } },
      { label: 'Laisser la place à un plus ancien', effets: { stats: { mental: 1 }, texteResultat: 'Tu observes comment il gère le groupe. Tu prends des notes.' } },
    ] },
  { id: 'c-alimentation', phase: 'centre', poids: 3,
    texte: "La diététicienne du centre trouve que ton alimentation n'est pas adaptée au haut niveau.",
    choix: [
      { label: 'Suivre son plan à la lettre', effets: { stats: { endurance: 2, puissance: 1 }, moral: -2, texteResultat: 'Adieu les kebabs. Mais tu récupères beaucoup mieux.' } },
      { label: 'Faire des efforts… raisonnables', effets: { stats: { endurance: 1 }, texteResultat: 'Un bon compromis.' } },
    ] },
  { id: 'c-famille', phase: 'centre', periode: 'hiver', poids: 3,
    texte: "Ton grand-père, qui t'a emmené à ton premier match, est hospitalisé. Il te demande au téléphone de venir le voir.",
    choix: [
      { label: 'Rentrer quelques jours', effets: { moral: 6, forme: -3, texteResultat: 'Il te serre la main : « Joue pour moi. » Tu n’oublieras jamais.' } },
      { label: "Rester t'entraîner", effets: { stats: { mental: 2 }, moral: -6, texteResultat: 'Tu as tenu ta place. Mais le cœur n’y est pas.' } },
    ] },
  { id: 'c-tournoi-international', phase: 'centre', periode: 'printemps', poids: 3, tags: ['requiertApte'],
    texte: "Ton équipe dispute un tournoi international de jeunes. Au programme : des équipes anglaises, sud-africaines et néo-zélandaises.",
    choix: [
      { label: 'Jouer avec agressivité', effets: { stats: { plaquage: 3, puissance: 1 }, texteResultat: 'Tu fais reculer un troisième ligne néo-zélandais. Les scouts notent ton nom.' } },
      { label: 'Jouer juste et propre', effets: { stats: { passe: 2, lecture: 2 }, texteResultat: 'Pas d’erreur, beaucoup de bons choix.' } },
    ] },
  { id: 'c-rivalite', phase: 'centre', poids: 4,
    texte: "Un autre jeune du centre joue au même poste que toi. L'entraîneur vous met en concurrence directe toute la semaine.",
    choix: [
      { label: 'Le battre à la régulière', effets: { stats: { mental: 2, endurance: 2 }, texteResultat: 'Duel acharné. Vous progressez tous les deux.' } },
      { label: "T'en faire un allié", effets: { stats: { leadership: 2 }, moral: 4, texteResultat: 'Vous bossez ensemble. Une amitié naît.' } },
      { label: 'Le déstabiliser en douce', effets: { stats: { mental: 1 }, moral: -4, flags: ['reputation-'], texteResultat: 'Ça marche… mais le vestiaire voit tout.' } },
    ] },
  { id: 'c-specifique', phase: 'centre', poids: 5,
    texte: "Séance spécifique à ton poste avec un ancien international devenu entraîneur.",
    choix: [
      { label: 'Travailler ton point fort', effets: { stats: { conquete: 2, passe: 2 }, texteResultat: 'Ton point fort devient une arme.' } },
      { label: 'Travailler ton point faible', effets: { stats: { plaquage: 2, jeuAuPied: 2 }, texteResultat: 'Moins brillant, mais plus complet.' } },
    ] },
  { id: 'c-avants-melee', phase: 'centre', poids: 4, tags: ['requiertApte'], condition: avant,
    texte: "L'entraîneur des avants organise une séance de mêlée contre les pros. Ça va piquer.",
    choix: [
      { label: 'Tenir coûte que coûte', effets: { stats: { conquete: 4, puissance: 1 }, forme: -5, texteResultat: 'Tu as reculé. Puis tu as tenu. Puis tu as poussé.' } },
      { label: 'Demander des conseils techniques', effets: { stats: { conquete: 2, lecture: 2 }, texteResultat: 'Un vieux pilier te montre deux trucs qui changent tout.' } },
    ] },
  { id: 'c-arrieres-buteur', phase: 'centre', poids: 4, tags: ['requiertApte'], condition: (s) => !avant(s),
    texte: "Le buteur titulaire des Crabos est suspendu. Quelqu'un doit prendre les tirs au but.",
    choix: [
      { label: 'Prendre le ballon', effets: { stats: { jeuAuPied: 4, mental: 2 }, texteResultat: '5 sur 6. Le coach te garde comme buteur.' } },
      { label: 'Laisser faire un autre', effets: { stats: { vitesse: 1 }, texteResultat: 'Tu te concentres sur ton jeu.' } },
    ] },
  { id: 'c-sanction', phase: 'centre', poids: 2, condition: (s) => s.flags.includes('ecart') || has(s, 'fetard') || has(s, 'tete-brulee'),
    texte: "Le directeur du centre te convoque. Retard à l'entraînement, comportement limite en match : tu es sur la sellette.",
    choix: [
      { label: "T'excuser et faire profil bas", effets: { stats: { mental: 2 }, moral: -2, texteResultat: 'Dernier avertissement. Tu as compris.' } },
      { label: 'Contester', effets: { moral: -6, flags: ['reputation-'], texteResultat: 'Mauvaise idée. Tu es suspendu une semaine.' } },
    ] },
  { id: 'c-coupe-crabos', phase: 'centre', periode: 'printemps', poids: 3, tags: ['requiertApte'],
    texte: "Phase finale du championnat de France jeunes ! Match à élimination directe, toute la famille est dans les tribunes.",
    choix: [
      { label: 'Jouer libéré', effets: { stats: { vitesse: 1, lecture: 2 }, moral: 5, texteResultat: "Tu fais le match de ta vie. Même battus, tu sors grandi." } },
      { label: 'Jouer pour l’équipe, sans risque', effets: { stats: { mental: 2, plaquage: 1 }, texteResultat: 'Solide, discipliné. Le staff apprécie.' } },
    ] },
  { id: 'c-ete-travail', phase: 'centre', periode: 'ete', poids: 4,
    texte: "C'est l'été. Six semaines de vacances avant la reprise.",
    choix: [
      { label: 'Programme individuel intensif', effets: { stats: { endurance: 3, vitesse: 2 }, moral: -2, texteResultat: 'Tu reviens affûté comme jamais.' } },
      { label: 'Vraies vacances', effets: { moral: 8, forme: 10, texteResultat: 'Tête vidée, corps reposé.' } },
      { label: 'Job d’été pour aider tes parents', effets: { stats: { mental: 2 }, moral: 2, texteResultat: 'Tu découvres la vraie vie. Ça remet les idées en place.' } },
    ] },
  { id: 'c-reseaux', phase: 'centre', poids: 2, tags: ['requiertApte'],
    texte: "Une de tes actions en match fait le buzz sur les réseaux sociaux : 300 000 vues.",
    choix: [
      { label: 'Profiter de la notoriété', effets: { moral: 5, flags: ['populaire'], texteResultat: 'Tu gagnes 10 000 abonnés. Attention à ne pas t’enflammer.' } },
      { label: 'Rester concentré', effets: { stats: { mental: 2 }, texteResultat: 'Tu coupes ton téléphone et retournes bosser.' } },
    ] },

  // ───────────── CARRIÈRE PRO ─────────────
  { id: 'p-contrat-prolongation', phase: 'pro', periode: 'hiver', poids: 3,
    texte: "Le président veut prolonger ton contrat de deux ans, avec une petite revalorisation.",
    choix: [
      { label: 'Signer tout de suite', effets: { moral: 5, prolongation: 2, flags: ['prolonge'], texteResultat: 'Stabilité. Tu peux te concentrer sur le terrain.' } },
      { label: 'Attendre la fin de saison', effets: { stats: { mental: 1 }, texteResultat: 'Tu fais monter les enchères. Risqué.' } },
    ] },
  { id: 'p-media', phase: 'pro', poids: 3,
    texte: "Un journaliste de Midi Olympique veut une grande interview. Il va forcément te demander ce que tu penses du manager.",
    choix: [
      { label: 'Langue de bois', effets: { moral: 1, texteResultat: 'Article sans relief. Personne ne s’en plaint.' } },
      { label: 'Parler cash', effets: { moral: -2, flags: ['franc-parler'], stats: { leadership: 2 }, texteResultat: 'Gros titre. Le manager n’a pas aimé, les supporters adorent.' } },
    ] },
  { id: 'p-tournee-ete', phase: 'pro', periode: 'ete', poids: 3,
    texte: "Pas de sélection cet été. Tu as cinq semaines avant la reprise.",
    choix: [
      { label: 'Préparation physique perso', effets: { stats: { endurance: 3, puissance: 2 }, texteResultat: 'Tu arrives à la reprise en tête des tests physiques.' } },
      { label: 'Récupération totale', effets: { forme: 15, moral: 6, texteResultat: 'Corps et tête régénérés.' } },
    ] },
  { id: 'p-cartons', phase: 'pro', poids: 2, tags: ['requiertApte'], condition: (s) => has(s, 'tete-brulee') || has(s, 'guerrier'),
    texte: "Match tendu. Un adversaire te provoque depuis le début, il vient de te mettre un coup en douce dans un ruck.",
    choix: [
      { label: 'Répondre', effets: { moral: -4, flags: ['carton-rouge'], texteResultat: 'Carton rouge. Trois semaines de suspension.' } },
      { label: 'Garder ton calme', effets: { stats: { mental: 3 }, texteResultat: 'Tu prends ta revanche au plaquage suivant. Proprement.' } },
    ] },
  { id: 'p-blessure-match', phase: 'pro', poids: 3, tags: ['requiertApte'],
    texte: "À la 60e minute, ton genou se tord dans un regroupement. Tu peux encore marcher.",
    choix: [
      { label: 'Sortir immédiatement', effets: { blessure: { nom: 'Entorse du genou', semaines: 4 }, texteResultat: 'Entorse. Quatre semaines.' } },
      { label: 'Finir le match', effets: { blessure: { nom: 'Entorse grave du genou', semaines: 9 }, stats: { mental: 2 }, texteResultat: 'Tu finis… et ça se paie : neuf semaines.' } },
    ] },
  { id: 'p-entraineur-confiance', phase: 'pro', poids: 4,
    texte: "Le manager te convoque : « Je compte sur toi, mais je veux voir plus d'impact dans les rucks. »",
    choix: [
      { label: 'Bosser le jeu au sol', effets: { stats: { puissance: 2, plaquage: 2 }, texteResultat: 'Message reçu. Ton temps de jeu s’en ressent.' } },
      { label: 'Lui expliquer ton style', effets: { stats: { lecture: 1 }, moral: -1, texteResultat: 'Il écoute. Il n’est pas convaincu.' } },
    ] },
  { id: 'p-offre-etranger', phase: 'pro', periode: 'printemps', poids: 2,
    texte: "Un club japonais te fait une offre énorme : trois fois ton salaire actuel pour deux saisons.",
    choix: [
      { label: 'Refuser, le Top 14 avant tout', effets: { moral: 3, stats: { mental: 1 }, texteResultat: 'Tu restes. L’argent attendra.' } },
      { label: "Demander à réfléchir", effets: { flags: ['offre-japon'], texteResultat: 'Ton agent garde le contact.' } },
    ] },
  { id: 'p-mentor', phase: 'pro', poids: 3,
    texte: "Un cadre international du club te prend sous son aile et te propose des séances supplémentaires.",
    choix: [
      { label: 'Accepter avec reconnaissance', effets: { stats: { lecture: 3, mental: 2 }, texteResultat: "Il t'apprend des choses qu'aucun coach ne t'avait dites." } },
      { label: 'Préférer ta propre routine', effets: { stats: { endurance: 1 }, texteResultat: 'Tu restes dans ton couloir.' } },
    ] },
  { id: 'p-derby', phase: 'pro', poids: 4, tags: ['requiertApte'],
    texte: "Semaine de derby. La ville ne parle que de ça. Le manager demande aux joueurs de ne rien dire à la presse.",
    choix: [
      { label: 'Jouer avec les tripes', effets: { stats: { plaquage: 2 }, moral: 4, texteResultat: 'Ambiance de folie. Tu es élu homme du match par les supporters.' } },
      { label: 'Rester froid et méthodique', effets: { stats: { mental: 2, lecture: 1 }, texteResultat: 'Match maîtrisé.' } },
    ] },
  { id: 'p-troisieme-mi-temps', phase: 'pro', poids: 3,
    texte: "Grosse victoire à l'extérieur. Les anciens organisent une troisième mi-temps légendaire.",
    choix: [
      { label: 'En être', effets: { moral: 6, forme: -6, stats: { leadership: 1 }, texteResultat: 'Des liens se créent pour toujours.' } },
      { label: 'Rentrer tôt', effets: { forme: 4, texteResultat: 'Tu récupères bien. Certains te trouvent un peu sérieux.' } },
    ] },
  { id: 'p-surentrainement', phase: 'pro', periode: 'hiver', poids: 3,
    texte: "Tu sens la fatigue s'accumuler. Le staff médical propose une semaine de repos complet.",
    choix: [
      { label: 'Accepter le repos', effets: { forme: 15, moral: 2, texteResultat: 'Tu reviens frais.' } },
      { label: 'Refuser, la concurrence ne dort pas', effets: { stats: { mental: 1 }, forme: -10, texteResultat: 'Tu tiens… pour l’instant.' } },
    ] },
  { id: 'p-reconversion', phase: 'pro', poids: 2, condition: (s) => has(s, 'studieux') || s.player.age >= 27,
    texte: "Une école de commerce propose aux sportifs pros un diplôme à distance, compatible avec les entraînements.",
    choix: [
      { label: "S'inscrire", effets: { stats: { lecture: 1 }, flags: ['diplome'], moral: 2, texteResultat: "Tu prépares l'après. Ça te rassure." } },
      { label: 'Plus tard', effets: { texteResultat: 'Le rugby d’abord.' } },
    ] },
  { id: 'p-supporter', phase: 'pro', poids: 3,
    texte: "Un jeune supporter malade t'écrit une lettre : il rêve de te rencontrer.",
    choix: [
      { label: "L'inviter à l'entraînement", effets: { moral: 8, flags: ['populaire'], texteResultat: 'Son sourire vaut tous les trophées.' } },
      { label: 'Lui envoyer un maillot dédicacé', effets: { moral: 3, texteResultat: 'Un beau geste.' } },
    ] },
  { id: 'p-poste-polyvalence', phase: 'pro', poids: 2, tags: ['requiertApte'],
    texte: "Hécatombe au club. Le manager te demande de dépanner à un autre poste pour trois matchs.",
    choix: [
      { label: 'Accepter', effets: { stats: { lecture: 2, mental: 1 }, moral: 1, texteResultat: 'Tu rends service. Le manager s’en souviendra.' } },
      { label: 'Refuser', effets: { moral: -1, texteResultat: 'Il trouve une autre solution. Un peu froidement.' } },
    ] },
  { id: 'p-banc', phase: 'pro', poids: 3, condition: (s) => (s.saisonStats?.titularisations ?? 0) < (s.saisonStats?.matchs ?? 0) / 2,
    texte: "Tu passes plus de temps sur le banc que sur le terrain. Ton agent parle d'un prêt.",
    choix: [
      { label: "S'accrocher et bosser", effets: { stats: { endurance: 2, mental: 2 }, texteResultat: 'Tu ne lâches rien.' } },
      { label: 'Demander une explication au manager', effets: { moral: -1, stats: { leadership: 1 }, texteResultat: 'Il te dit quoi travailler. Au moins c’est clair.' } },
    ] },

  // ───────────── TOUTES PHASES ─────────────
  { id: 't-maladie', phase: 'tous', periode: 'hiver', poids: 2,
    texte: "Une grosse grippe traverse le vestiaire. Tu as de la fièvre le jour d'un match.",
    choix: [
      { label: 'Rester au lit', effets: { forme: 5, texteResultat: 'Tu rates le match, mais tu reviens vite.' } },
      { label: 'Jouer quand même', effets: { forme: -12, stats: { mental: 1 }, texteResultat: 'Tu joues à 50 %. Et tu rechutes.' } },
    ] },
  { id: 't-relation', phase: 'tous', poids: 2,
    texte: "Tu rencontres quelqu'un qui compte. Mais ton emploi du temps laisse peu de place.",
    choix: [
      { label: 'Faire de la place', effets: { moral: 8, texteResultat: 'Ton équilibre perso te rend plus serein.' } },
      { label: 'Le rugby d’abord', effets: { stats: { mental: 1 }, moral: -3, texteResultat: 'Tu restes focalisé. Seul.' } },
    ] },
  { id: 't-parents', phase: 'tous', poids: 2,
    texte: "Tes parents traversent une période difficile. Ta mère te dit de ne pas t'inquiéter.",
    choix: [
      { label: 'Rentrer les voir', effets: { moral: 4, forme: -3, texteResultat: 'Ta présence leur fait du bien.' } },
      { label: 'Appeler tous les soirs', effets: { moral: 2, texteResultat: 'Un lien maintenu, malgré la distance.' } },
    ] },
  { id: 't-yoga', phase: 'tous', poids: 3,
    texte: "Le kiné te conseille de te mettre au yoga pour gagner en mobilité et éviter les blessures.",
    choix: [
      { label: 'Essayer sérieusement', effets: { stats: { endurance: 1 }, forme: 5, flags: ['yoga'], texteResultat: 'Les vestiaires rigolent. Tes ischios te remercient.' } },
      { label: 'Pas pour moi', effets: { texteResultat: 'Tu préfères la muscu.' } },
    ] },
  { id: 't-sprint', phase: 'tous', poids: 3,
    texte: "Un spécialiste de l'athlétisme passe au club pour des séances de vitesse.",
    choix: [
      { label: 'Participer', effets: { stats: { vitesse: 3 }, texteResultat: 'Tu gagnes un dixième sur 40 m.' } },
      { label: 'Rester sur le terrain de jeu', effets: { stats: { passe: 1, lecture: 1 }, texteResultat: 'Tu préfères le ballon.' } },
    ] },
  { id: 't-chambre', phase: 'tous', poids: 2,
    texte: "Le club te propose de partager un appartement avec un coéquipier étranger qui ne parle pas français.",
    choix: [
      { label: 'Accepter et l’aider à s’intégrer', effets: { stats: { leadership: 2 }, moral: 3, texteResultat: 'Tu apprends l’anglais, il apprend le français. Amis pour la vie.' } },
      { label: 'Préférer vivre seul', effets: { forme: 3, texteResultat: 'Calme et indépendance.' } },
    ] },
];
