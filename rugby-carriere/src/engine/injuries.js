import { hasTag } from './player.js';

const BLESSURES = [
  ['Contracture à la cuisse', 1, 3], ['Entorse de la cheville', 2, 5], ['Commotion cérébrale', 1, 3], ["Élongation des ischio-jambiers", 3, 6],
  ['Entorse du genou', 4, 8], ["Fracture d'un doigt", 3, 5], ["Luxation de l'épaule", 6, 12], ['Rupture des ligaments croisés', 24, 36],
];

/** Risque de blessure sur une période (≈ 5-6 semaines). */
export function rollInjury(player, rng) {
  let p = 0.07;
  if (hasTag(player, 'blessures+')) p *= 1.4;
  if (hasTag(player, 'blessures++')) p *= 2;
  if ((player.forme ?? 70) < 50) p *= 1.3;
  if (player.age >= 31) p *= 1.2;
  if (!rng.chance(p)) return null;
  // les blessures graves sont rares
  const idx = rng.chance(0.06) ? BLESSURES.length - 1 : rng.int(0, BLESSURES.length - 2);
  const [nom, min, max] = BLESSURES[idx];
  return { nom, semainesRestantes: rng.int(min, max) };
}

export function tickInjury(player, semaines) {
  if (!player.blessure) return player;
  const reste = player.blessure.semainesRestantes - semaines;
  return { ...player, blessure: reste > 0 ? { ...player.blessure, semainesRestantes: reste } : null };
}
