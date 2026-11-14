import { STAT_KEYS, positionById } from '../data/positions.js';
import { personalityById } from '../data/personalities.js';
import { nationalityById, ACADEMY_COUNTRIES } from '../data/nationalities.js';

export const clampStat = (v) => Math.max(0, Math.min(100, Math.round(v)));
const clamp = (v, [lo, hi]) => Math.max(lo, Math.min(hi, Math.round(v)));

export const hasTag = (player, tag) => player.personnaliteIds.some(id => personalityById(id)?.tags.includes(tag));

export function createPlayer(input, rng) {
  const { prenom, nom, nationaliteId, positionId, tailleCm, poidsKg, personnaliteIds, paysCentreId } = input;
  if (!prenom?.trim() || !nom?.trim()) throw new Error('Prénom et nom obligatoires');
  if (!nationalityById(nationaliteId)) throw new Error(`Nationalité inconnue : ${nationaliteId}`);
  const pos = positionById(positionId);
  if (!pos) throw new Error(`Poste inconnu : ${positionId}`);
  if (!Array.isArray(personnaliteIds) || personnaliteIds.length !== 3) throw new Error('Il faut choisir exactement 3 personnalités');
  if (new Set(personnaliteIds).size !== 3) throw new Error('Les 3 personnalités doivent être différentes');
  const perso = personnaliteIds.map(id => personalityById(id));
  if (perso.some(p => !p)) throw new Error('Personnalité inconnue');
  const pays = ACADEMY_COUNTRIES.find(c => c.id === paysCentreId);
  if (!pays?.jouable) throw new Error(`Pays de centre de formation non disponible : ${paysCentreId}`);

  const stats = {};
  for (const k of STAT_KEYS) {
    // les stats importantes pour le poste partent un peu plus haut
    const bonusPoste = (pos.poids[k] ?? 0) >= 0.15 ? 6 : 0;
    stats[k] = rng.int(25, 49) + bonusPoste;
  }
  for (const p of perso) for (const [k, v] of Object.entries(p.statMods)) stats[k] += v;
  for (const k of STAT_KEYS) stats[k] = clampStat(stats[k]);

  return {
    prenom: prenom.trim(), nom: nom.trim(), age: 16, nationaliteId, positionId,
    tailleCm: clamp(tailleCm, pos.tailleCm), poidsKg: clamp(poidsKg, pos.poidsKg),
    personnaliteIds: [...personnaliteIds],
    stats, potentiel: rng.int(60, 95), moral: 70, forme: 70,
    blessure: null, clubId: null, historique: [],
  };
}
