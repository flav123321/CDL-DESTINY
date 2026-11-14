import { overall } from './rating.js';
import { simulateMatch, selectMatchday } from './match.js';

/** Calendrier aller-retour (méthode du cercle) : 2(n-1) journées. */
export function buildFixtures(clubIds) {
  const n = clubIds.length;
  const t = [...clubIds];
  const aller = [];
  for (let r = 0; r < n - 1; r++) {
    const day = [];
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      day.push((i === 0 ? r % 2 === 0 : (r + i) % 2 === 0) ? [a, b] : [b, a]);
    }
    aller.push(day);
    t.splice(1, 0, t.pop());
  }
  const retour = aller.map(day => day.map(([h, a]) => [a, h]));
  return [...aller, ...retour];
}

/** Force d'un club : moyenne des 23 meilleures notes (le joueur du user compte s'il est au club). */
export function teamStrength(club, player) {
  const notes = club.joueurs.map(j => j.note);
  if (player && player.clubId === club.id && !player.blessure) notes.push(overall(player.stats, player.positionId));
  notes.sort((a, b) => b - a);
  const top = notes.slice(0, 23);
  return top.reduce((s, x) => s + x, 0) / top.length;
}

export function standings(results) {
  const t = new Map();
  const row = (id) => { if (!t.has(id)) t.set(id, { clubId: id, j: 0, g: 0, n: 0, p: 0, pf: 0, pc: 0, bonus: 0, pts: 0 }); return t.get(id); };
  for (const r of results) {
    const H = row(r.home), A = row(r.away);
    for (const [me, op, pf, pc, ef, ec] of [[H, A, r.scoreHome, r.scoreAway, r.essaisHome, r.essaisAway], [A, H, r.scoreAway, r.scoreHome, r.essaisAway, r.essaisHome]]) {
      me.j++; me.pf += pf; me.pc += pc;
      if (pf > pc) { me.g++; me.pts += 4; if (ef - ec >= 3) { me.bonus++; me.pts++; } }
      else if (pf === pc) { me.n++; me.pts += 2; }
      else { me.p++; if (pc - pf <= 5) { me.bonus++; me.pts++; } }
    }
  }
  return [...t.values()].sort((a, b) => b.pts - a.pts || (b.pf - b.pc) - (a.pf - a.pc) || b.pf - a.pf);
}

function knockout(homeId, awayId, forces, rng, neutral = false) {
  const m = simulateMatch({ id: homeId, force: forces[homeId] - (neutral ? 2.5 : 0) }, { id: awayId, force: forces[awayId] }, null, rng);
  if (m.scoreHome === m.scoreAway) return { ...m, vainqueur: rng.chance(0.5) ? homeId : awayId };
  return { ...m, vainqueur: m.scoreHome > m.scoreAway ? homeId : awayId };
}

/** Phases finales : 1-2 en demies, 3 à 6 en barrages (3v6, 4v5). 14e relégué, 13e en barrage d'accession. */
export function playoffs(table, rng, forces) {
  const ids = table.map(r => r.clubId);
  const b1 = knockout(ids[2], ids[5], forces, rng), b2 = knockout(ids[3], ids[4], forces, rng);
  const rang = (id) => ids.indexOf(id);
  const [moinsBon, meilleur] = [b1.vainqueur, b2.vainqueur].sort((x, y) => rang(y) - rang(x));
  const d1 = knockout(ids[0], moinsBon, forces, rng, true), d2 = knockout(ids[1], meilleur, forces, rng, true);
  const finale = knockout(d1.vainqueur, d2.vainqueur, forces, rng, true);
  return { barrages: [b1, b2], demis: [d1, d2], finale, champion: finale.vainqueur, relegue: ids[ids.length - 1], barrageAccession: ids[ids.length - 2] };
}

/** Simule une saison complète (utilisé pour les tests et la simulation rapide). */
export function simulateSeason(clubs, player, rng) {
  const forces = Object.fromEntries(clubs.map(c => [c.id, teamStrength(c, player)]));
  const results = [];
  for (const day of buildFixtures(clubs.map(c => c.id))) {
    for (const [h, a] of day) results.push(playDay(h, a, clubs, forces, player, rng));
  }
  return { results, forces };
}

export function playDay(h, a, clubs, forces, player, rng) {
  let statut = 'non-retenu';
  if (player && (player.clubId === h || player.clubId === a)) statut = selectMatchday(clubs.find(c => c.id === player.clubId), player, rng);
  const buteur = player?.positionId === 'demi-d-ouverture' && statut === 'titulaire' && player.stats.jeuAuPied >= 70;
  return simulateMatch({ id: h, force: forces[h] }, { id: a, force: forces[a] }, player, rng, { statut, buteur });
}
