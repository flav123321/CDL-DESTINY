// Top 20 World Rugby (classement de novembre 2026).
export const NATIONALITIES = [
  { id: 'ZA', label: 'Afrique du Sud', drapeau: '🇿🇦' },
  { id: 'NZ', label: 'Nouvelle-Zélande', drapeau: '🇳🇿' },
  { id: 'IE', label: 'Irlande', drapeau: '🇮🇪' },
  { id: 'FR', label: 'France', drapeau: '🇫🇷' },
  { id: 'EN', label: 'Angleterre', drapeau: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'SC', label: 'Écosse', drapeau: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { id: 'AU', label: 'Australie', drapeau: '🇦🇺' },
  { id: 'AR', label: 'Argentine', drapeau: '🇦🇷' },
  { id: 'FJ', label: 'Fidji', drapeau: '🇫🇯' },
  { id: 'WA', label: 'Pays de Galles', drapeau: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { id: 'IT', label: 'Italie', drapeau: '🇮🇹' },
  { id: 'JP', label: 'Japon', drapeau: '🇯🇵' },
  { id: 'GE', label: 'Géorgie', drapeau: '🇬🇪' },
  { id: 'PT', label: 'Portugal', drapeau: '🇵🇹' },
  { id: 'US', label: 'États-Unis', drapeau: '🇺🇸' },
  { id: 'ES', label: 'Espagne', drapeau: '🇪🇸' },
  { id: 'TO', label: 'Tonga', drapeau: '🇹🇴' },
  { id: 'CL', label: 'Chili', drapeau: '🇨🇱' },
  { id: 'WS', label: 'Samoa', drapeau: '🇼🇸' },
  { id: 'UY', label: 'Uruguay', drapeau: '🇺🇾' },
];
export const nationalityById = (id) => NATIONALITIES.find(n => n.id === id);

export const ACADEMY_COUNTRIES = [
  { id: 'FR', label: 'France', drapeau: '🇫🇷', jouable: true },
  { id: 'EN', label: 'Angleterre', drapeau: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', jouable: false },
  { id: 'ZA', label: 'Afrique du Sud', drapeau: '🇿🇦', jouable: false },
  { id: 'JP', label: 'Japon', drapeau: '🇯🇵', jouable: false },
];
