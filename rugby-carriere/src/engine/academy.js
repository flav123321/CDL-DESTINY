import { PERIODES, drawEvent } from './events.js';
import { progressSeason } from './progression.js';
import { rollInjury, tickInjury } from './injuries.js';
import { overall } from './rating.js';

export const CATEGORIES = { 16: 'Cadets (U16)', 17: 'Crabos (U18)', 18: 'Espoirs' };
export const SAISON_DEPART = 2026;
export const saisonLabel = (annee) => `${annee}-${String((annee + 1) % 100).padStart(2, '0')}`;

export function newAcademyState(player) {
  return { phase: 'centre', annee: SAISON_DEPART, periodeIndex: -1, periode: null, flags: [], vusSaison: [], journal: [],
    evenementEnCours: null, offresContrat: null, player, saisonStats: { matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, notes: [] } };
}

/** Matchs de catégorie joués sur une période (≈ 4 matchs). */
function jeunesMatchs(state, rng) {
  const p = state.player;
  const st = { ...state.saisonStats, notes: [...state.saisonStats.notes] };
  if (p.blessure) return st;
  const ovr = overall(p.stats, p.positionId);
  const seuil = 42 + (p.age - 16) * 5; // le niveau requis monte avec la catégorie
  for (let i = 0; i < 4; i++) {
    st.matchs++;
    const titulaire = ovr + rng.int(-6, 6) >= seuil;
    if (titulaire) st.titularisations++;
    const minutes = titulaire ? rng.int(50, 80) : rng.int(0, 30);
    st.minutes += minutes;
    if (minutes > 0) {
      const essais = rng.chance(0.12) ? 1 : 0;
      st.essais += essais; st.points += essais * 5;
      st.notes.push(Math.max(0, Math.min(10, Math.round((5 + (ovr - seuil) / 6 + rng.next() * 2 - 1) * 10) / 10)));
    }
  }
  return st;
}

/** Fin du parcours : offres selon la note. */
export function academyOffers(player) {
  const ovr = overall(player.stats, player.positionId);
  if (ovr >= 58) return [{ type: 'pro', clubId: player.clubId, duree: 3, role: 'espoir' }];
  if (ovr >= 50) return [{ type: 'pret', clubId: player.clubId, duree: 1, division: 'Pro D2', role: 'rotation' },
    { type: 'pret', clubId: player.clubId, duree: 1, division: 'Nationale', role: 'titulaire' }];
  return [{ type: 'liberation', clubId: null, duree: 0 }];
}

/** Avance d'une période au centre de formation. */
export function academyStep(state, rng) {
  if (state.offresContrat) return state;
  let s = { ...state };
  let idx = s.periodeIndex + 1;
  if (idx >= PERIODES.length) {
    // fin de saison : progression, anniversaire, nouvelle saison
    const player = progressSeason(s.player, { minutesJouees: s.saisonStats.minutes, entrainementBonus: 1 }, rng);
    const { notes, ...st } = s.saisonStats;
    const noteMoyenne = notes.length ? Math.round(notes.reduce((a, b) => a + b, 0) / notes.length * 10) / 10 : null;
    const resume = { saison: saisonLabel(s.annee), age: s.player.age, categorie: CATEGORIES[s.player.age], niveau: CATEGORIES[s.player.age],
      club: s.clubNom ?? null, ...st, noteMoyenne };
    s.player = { ...player, age: player.age + 1, historique: [...player.historique, resume] };
    s.annee += 1; s.vusSaison = [];
    s.saisonStats = { matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, notes: [] };
    if (s.player.age >= 19) { s.offresContrat = academyOffers(s.player); s.periode = null; s.evenementEnCours = null; return s; }
    idx = 0;
  }
  s.periodeIndex = idx;
  s.periode = PERIODES[idx];
  s.player = tickInjury(s.player, 6);
  if (!s.player.blessure) { const b = rollInjury(s.player, rng); if (b) s.player = { ...s.player, blessure: b }; }
  if (s.periode !== 'ete') s.saisonStats = jeunesMatchs(s, rng);
  s.evenementEnCours = drawEvent(s, s.periode, rng);
  return s;
}
