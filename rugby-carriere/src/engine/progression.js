import { STAT_KEYS } from '../data/positions.js';
import { clampStat, hasTag } from './player.js';
import { overall } from './rating.js';

const PHYSIQUES = ['puissance', 'vitesse', 'endurance'];

function baseGain(age, physique) {
  if (age <= 20) return 3.2;
  if (age <= 23) return 2.2;
  if (age <= 25) return 1;
  if (age <= 29) return 0.2;
  if (age === 30) return physique ? -0.5 : 0;
  if (age <= 32) return physique ? -1.8 : -0.3;
  return physique ? -3 : -1;
}

/** Progression de fin de saison : âge, temps de jeu, entraînement, personnalités ; plafonnée par le potentiel. */
export function progressSeason(player, { minutesJouees = 0, entrainementBonus = 0 } = {}, rng) {
  const before = overall(player.stats, player.positionId);
  // au-dessus du potentiel (bonus d'événements), la note redescend doucement
  const plafond = before > player.potentiel ? before - 1 : player.potentiel;
  const mult = (hasTag(player, 'progression+') ? 1.25 : 1);
  const stats = { ...player.stats };
  const gains = {};
  for (const k of STAT_KEYS) {
    const physique = PHYSIQUES.includes(k);
    let g = baseGain(player.age, physique);
    if (g > 0) g = g * mult + (player.age <= 25 ? minutesJouees / 1600 : 0) + entrainementBonus * 0.3;
    g += rng.next() * 2 - 1;
    gains[k] = Math.round(g);
    stats[k] = clampStat(stats[k] + gains[k]);
  }
  // Plafond : on retire des gains positifs tant que la note dépasse le plafond.
  let guard = 0;
  while (overall(stats, player.positionId) > plafond && guard++ < 500) {
    const k = STAT_KEYS.filter(x => gains[x] > 0).sort((a, b) => gains[b] - gains[a])[0]
      ?? STAT_KEYS.sort((a, b) => stats[b] - stats[a])[0];
    stats[k] = clampStat(stats[k] - 1);
    gains[k] = (gains[k] ?? 0) - 1;
  }
  return { ...player, stats };
}
