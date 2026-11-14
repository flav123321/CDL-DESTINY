import { RAW_CLUBS } from './top14-raw.js';
import { NOTABLES } from './top14-notes.js';
import { NATIONALITIES } from '../nationalities.js';

const CODE = { SCO: 'SC', ECO: 'SC', ARG: 'AR', RSA: 'ZA', ENG: 'EN', TON: 'TO', TGA: 'TO', GEO: 'GE', NZL: 'NZ', ITA: 'IT',
  AUS: 'AU', SAM: 'WS', URU: 'UY', POR: 'PT', CHI: 'CL', USA: 'US', ESP: 'ES', IRL: 'IE', WAL: 'WA', GAL: 'WA', FIJ: 'FJ', JPN: 'JP' };
const POS = { PG: 'pilier-gauche', PD: 'pilier-droit', TA: 'talonneur', '2L': 'deuxieme-ligne', '3L': 'troisieme-ligne-aile',
  N8: 'numero-8', DM: 'demi-de-melee', DO: 'demi-d-ouverture', CE: 'centre', AI: 'ailier', AR: 'arriere' };
const GROUP_DEFAULT = { AR: 'AI', CE: 'CE', DO: 'DO', DM: 'DM', '3L': '3L', '2L': '2L', TA: 'TA', PI: null };
const BASE_BY_PRESTIGE = { 1: 63, 2: 66, 3: 68, 4: 70, 5: 72 };
const natIds = new Set(NATIONALITIES.map(n => n.id));

// hachage déterministe d'une chaîne → [0,1)
function h(str) { let x = 2166136261; for (const c of str) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return ((x >>> 0) % 10000) / 10000; }

function parse(list) {
  return list.split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.*?)\s*\(([A-Z]{3})\)$/);
    if (!m) return { nom: s, nat: 'FR' };
    const nat = CODE[m[2]] ?? 'autre';
    return { nom: m[1], nat: natIds.has(nat) ? nat : 'autre' };
  });
}

function buildClub(raw) {
  const joueurs = [];
  for (const group of Object.keys(GROUP_DEFAULT)) {
    const entries = parse(raw[group] ?? '');
    const built = entries.map(({ nom, nat }) => {
      const n = NOTABLES[nom];
      const r = h(nom + raw.id);
      const age = n?.[1] ?? 20 + Math.floor(r * 11);
      const jeune = age <= 22;
      const note = n?.[0] ?? Math.round(BASE_BY_PRESTIGE[raw.prestige] - (jeune ? 6 : 0) + (r * 10 - 5));
      const code = n?.[2] ?? GROUP_DEFAULT[group];
      return { nom, positionId: code ? POS[code] : null, age, nationaliteId: nat, note: Math.max(40, Math.min(95, note)), jiff: nat === 'FR' };
    });
    // Équilibrages : piliers gauche/droit, au moins un arrière et un numéro 8
    if (group === 'PI') {
      for (const j of built.filter(j => !j.positionId)) {
        const g = built.filter(x => x.positionId === POS.PG).length, d = built.filter(x => x.positionId === POS.PD).length;
        j.positionId = g <= d ? POS.PG : POS.PD;
      }
    }
    if (group === 'AR' && !built.some(j => j.positionId === POS.AR)) built[0].positionId = POS.AR;
    if (group === '3L' && !built.some(j => j.positionId === POS.N8)) {
      [...built].sort((a, b) => b.note - a.note)[0].positionId = POS.N8;
    }
    joueurs.push(...built);
  }
  const { AR, CE, DO, DM, PI, TA, ...meta } = raw;
  delete meta['3L']; delete meta['2L'];
  return { ...meta, joueurs };
}

export const TOP14 = { id: 'top14', label: 'Top 14', pays: 'FR', saison: '2026-27', clubs: RAW_CLUBS.map(buildClub) };
export const clubById = (id) => TOP14.clubs.find(c => c.id === id);
