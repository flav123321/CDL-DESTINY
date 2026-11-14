export const STAT_KEYS = ['puissance', 'vitesse', 'endurance', 'plaquage', 'passe', 'jeuAuPied', 'lecture', 'conquete', 'mental', 'leadership'];

export const STAT_LABELS = {
  puissance: 'Puissance', vitesse: 'Vitesse', endurance: 'Endurance', plaquage: 'Plaquage', passe: 'Passe',
  jeuAuPied: 'Jeu au pied', lecture: 'Lecture du jeu', conquete: 'Conquête', mental: 'Mental', leadership: 'Leadership',
};

const w = (o) => ({ puissance: 0, vitesse: 0, endurance: 0, plaquage: 0, passe: 0, jeuAuPied: 0, lecture: 0, conquete: 0, mental: 0, leadership: 0, ...o });

export const POSITIONS = [
  { id: 'pilier-gauche', label: 'Pilier gauche', court: 'PG', numeros: [1], ligne: 'avants', tailleCm: [175, 192], poidsKg: [105, 135],
    poids: w({ conquete: 0.35, puissance: 0.25, plaquage: 0.1, endurance: 0.1, mental: 0.1, lecture: 0.05, leadership: 0.05 }) },
  { id: 'talonneur', label: 'Talonneur', court: 'TA', numeros: [2], ligne: 'avants', tailleCm: [172, 188], poidsKg: [95, 120],
    poids: w({ conquete: 0.3, puissance: 0.2, plaquage: 0.15, endurance: 0.1, passe: 0.05, mental: 0.1, leadership: 0.1 }) },
  { id: 'pilier-droit', label: 'Pilier droit', court: 'PD', numeros: [3], ligne: 'avants', tailleCm: [176, 194], poidsKg: [110, 140],
    poids: w({ conquete: 0.38, puissance: 0.27, plaquage: 0.1, endurance: 0.1, mental: 0.1, leadership: 0.05 }) },
  { id: 'deuxieme-ligne', label: '2e ligne', court: '2L', numeros: [4, 5], ligne: 'avants', tailleCm: [193, 210], poidsKg: [105, 130],
    poids: w({ conquete: 0.3, puissance: 0.2, plaquage: 0.15, endurance: 0.15, lecture: 0.05, mental: 0.1, leadership: 0.05 }) },
  { id: 'troisieme-ligne-aile', label: '3e ligne aile', court: '3L', numeros: [6, 7], ligne: 'avants', tailleCm: [182, 198], poidsKg: [98, 118],
    poids: w({ plaquage: 0.3, endurance: 0.2, puissance: 0.15, vitesse: 0.1, conquete: 0.1, lecture: 0.1, mental: 0.05 }) },
  { id: 'numero-8', label: 'Numéro 8', court: 'N8', numeros: [8], ligne: 'avants', tailleCm: [185, 200], poidsKg: [105, 125],
    poids: w({ puissance: 0.25, plaquage: 0.2, endurance: 0.15, conquete: 0.1, lecture: 0.1, vitesse: 0.1, leadership: 0.1 }) },
  { id: 'demi-de-melee', label: 'Demi de mêlée', court: 'DM', numeros: [9], ligne: 'arrieres', tailleCm: [165, 182], poidsKg: [72, 90],
    poids: w({ passe: 0.3, lecture: 0.2, vitesse: 0.15, jeuAuPied: 0.1, mental: 0.1, leadership: 0.1, endurance: 0.05 }) },
  { id: 'demi-d-ouverture', label: "Demi d'ouverture", court: 'DO', numeros: [10], ligne: 'arrieres', tailleCm: [172, 190], poidsKg: [78, 95],
    poids: w({ jeuAuPied: 0.3, passe: 0.2, lecture: 0.2, mental: 0.15, leadership: 0.1, vitesse: 0.05 }) },
  { id: 'centre', label: 'Centre', court: 'CE', numeros: [12, 13], ligne: 'arrieres', tailleCm: [176, 195], poidsKg: [88, 108],
    poids: w({ puissance: 0.25, plaquage: 0.2, vitesse: 0.15, passe: 0.15, lecture: 0.15, mental: 0.1 }) },
  { id: 'ailier', label: 'Ailier', court: 'AI', numeros: [11, 14], ligne: 'arrieres', tailleCm: [172, 195], poidsKg: [80, 102],
    poids: w({ vitesse: 0.4, puissance: 0.15, lecture: 0.15, plaquage: 0.1, jeuAuPied: 0.05, endurance: 0.1, mental: 0.05 }) },
  { id: 'arriere', label: 'Arrière', court: 'AR', numeros: [15], ligne: 'arrieres', tailleCm: [175, 193], poidsKg: [82, 100],
    poids: w({ vitesse: 0.25, jeuAuPied: 0.25, lecture: 0.2, plaquage: 0.1, mental: 0.1, passe: 0.1 }) },
];

export const positionById = (id) => POSITIONS.find(p => p.id === id);
