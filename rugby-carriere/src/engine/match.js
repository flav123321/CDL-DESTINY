import { positionById } from '../data/positions.js';
import { overall } from './rating.js';

const BENCH = { 'pilier-gauche': 1, 'talonneur': 1, 'pilier-droit': 1, 'deuxieme-ligne': 1, 'troisieme-ligne-aile': 1, 'numero-8': 0,
  'demi-de-melee': 1, 'demi-d-ouverture': 1, 'centre': 0, 'ailier': 1, 'arriere': 0 };

/** Sélection du joueur du user pour une journée, face aux vrais joueurs de son poste. */
export function selectMatchday(club, player, rng) {
  if (!player || player.blessure) return 'non-retenu';
  const pos = positionById(player.positionId);
  const titulaires = pos.numeros.length;
  const banc = BENCH[player.positionId] ?? 1;
  const moi = overall(player.stats, player.positionId) + (player.forme - 70) / 10 + (rng.next() * 8 - 4);
  const rivaux = club.joueurs
    .filter(j => j.positionId === player.positionId)
    .filter(() => !rng.chance(0.12)) // rotation, blessures, internationaux
    .map(j => j.note + (rng.next() * 6 - 3));
  const rang = rivaux.filter(n => n > moi).length;
  if (rang < titulaires) return 'titulaire';
  if (rang < titulaires + banc) return 'remplacant';
  return 'non-retenu';
}

function poisson(lambda, rng) {
  const L = Math.exp(-lambda); let k = 0, p = 1;
  do { k++; p *= rng.next(); } while (p > L);
  return k - 1;
}

function sideScore(lambda, rng) {
  const essais = poisson(lambda, rng);
  let transfo = 0; for (let i = 0; i < essais; i++) if (rng.chance(0.72)) transfo++;
  const penalites = rng.int(0, 4);
  return { essais, points: essais * 5 + transfo * 2 + penalites * 3, transfo, penalites };
}

const TRY_SHARE = { ailier: 0.17, arriere: 0.1, centre: 0.1, 'numero-8': 0.08, 'troisieme-ligne-aile': 0.06, talonneur: 0.07,
  'demi-de-melee': 0.06, 'demi-d-ouverture': 0.05, 'deuxieme-ligne': 0.03, 'pilier-gauche': 0.03, 'pilier-droit': 0.03 };
const TACKLES = { 'troisieme-ligne-aile': 12, 'numero-8': 10, 'deuxieme-ligne': 10, talonneur: 9, 'pilier-gauche': 7, 'pilier-droit': 7,
  centre: 8, 'demi-de-melee': 6, 'demi-d-ouverture': 6, ailier: 4, arriere: 4 };

/**
 * home/away : { id, force }. player : joueur du user (ou null). opts.statut : 'titulaire' | 'remplacant' | 'non-retenu'.
 * opts.buteur : le joueur tire les pénalités et transformations.
 */
export function simulateMatch(home, away, player, rng, opts = {}) {
  const diff = home.force + 2.5 - away.force;
  const lh = Math.max(0.4, Math.min(7, 2.6 + diff * 0.13));
  const la = Math.max(0.4, Math.min(7, 2.6 - diff * 0.13));
  const h = sideScore(lh, rng), a = sideScore(la, rng);
  const res = { home: home.id, away: away.id, scoreHome: h.points, scoreAway: a.points, essaisHome: h.essais, essaisAway: a.essais, perfJoueur: null };

  const statut = opts.statut ?? 'non-retenu';
  if (player && statut !== 'non-retenu' && (player.clubId === home.id || player.clubId === away.id)) {
    const moiDom = player.clubId === home.id;
    const side = moiDom ? h : a;
    const gagne = moiDom ? h.points > a.points : a.points > h.points;
    const minutes = statut === 'titulaire' ? rng.int(52, 80) : rng.int(8, 35);
    const part = minutes / 80;
    let essais = 0;
    for (let i = 0; i < side.essais; i++) if (rng.chance((TRY_SHARE[player.positionId] ?? 0.05) * part * 1.3)) essais++;
    const ovr = overall(player.stats, player.positionId);
    const points = essais * 5 + (opts.buteur ? side.transfo * 2 + side.penalites * 3 : 0);
    const plaquages = Math.max(0, Math.round((TACKLES[player.positionId] ?? 6) * part * (0.6 + rng.next() * 0.8)));
    let note = 5 + (ovr - 68) / 9 + essais * 0.8 + (gagne ? 0.4 : -0.3) + (rng.next() * 2.4 - 1.2);
    if (statut === 'remplacant') note = 5 + (note - 5) * 0.7;
    note = Math.max(0, Math.min(10, Math.round(note * 10) / 10));
    res.perfJoueur = { statut, minutes, essais, points, plaquages, note };
  }
  return res;
}
