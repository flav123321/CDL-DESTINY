import { positionById } from '../data/positions.js';

export function overall(stats, positionId) {
  const pos = positionById(positionId);
  if (!pos) throw new Error(`Poste inconnu : ${positionId}`);
  let sum = 0;
  for (const [k, w] of Object.entries(pos.poids)) sum += (stats[k] ?? 0) * w;
  return Math.max(0, Math.min(100, Math.round(sum)));
}
