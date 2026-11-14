import { crestSvg } from '../engine/crest.js';
import { clubById } from '../data/leagues/top14.js';
import { positionById, STAT_KEYS, STAT_LABELS } from '../data/positions.js';
import { nationalityById } from '../data/nationalities.js';
import { overall } from '../engine/rating.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const crest = (clubId, size = 40) => { const c = clubById(clubId); return c ? `<span class="crest">${crestSvg(c, size)}</span>` : ''; };
export const clubNom = (id) => clubById(id)?.nom ?? '—';

export function header(career) {
  const p = career.player;
  const pos = positionById(p.positionId);
  const nat = nationalityById(p.nationaliteId);
  const ovr = overall(p.stats, p.positionId);
  return `<div class="card head">
    ${crest(p.clubId, 44)}
    <div class="who"><b>${esc(p.prenom)} ${esc(p.nom)}</b>
      <span class="muted">${nat?.drapeau ?? ''} ${p.age} ans · ${esc(pos.label)} · ${esc(clubNom(p.clubId))}</span>
      ${p.blessure ? `<div><span class="pill red">🚑 ${esc(p.blessure.nom)} · ${p.blessure.semainesRestantes} sem.</span></div>` : ''}
    </div>
    <div class="ovr">${ovr}<small>NOTE</small></div>
  </div>`;
}

export function statBars(p) {
  const row = (label, v, warn) => `<span>${label}</span><div class="bar ${warn ? 'warn' : ''}"><span style="width:${v}%"></span></div><b>${v}</b>`;
  return `<div class="bars">
    ${STAT_KEYS.map(k => row(STAT_LABELS[k], p.stats[k])).join('')}
    ${row('Moral', p.moral, p.moral < 40)}${row('Forme', p.forme ?? 70, (p.forme ?? 70) < 45)}
  </div>`;
}

export function historyTable(historique) {
  if (!historique.length) return '<p class="muted">Aucune saison terminée pour l’instant.</p>';
  return `<div class="scroll"><table>
    <tr><th>Saison</th><th>Club / niveau</th><th>Âge</th><th>M</th><th>Tit.</th><th>Essais</th><th>Pts</th><th>Note</th></tr>
    ${historique.map(h => `<tr><td>${esc(h.saison)}</td><td>${esc(h.club ?? '')}<br><span class="muted">${esc(h.niveau ?? h.categorie ?? '')}${h.classementClub ? ` · ${h.classementClub}e` : ''}${h.championAvecLui ? ' · 🏆' : ''}</span></td>
      <td>${h.age}</td><td>${h.matchs}</td><td>${h.titularisations}</td><td>${h.essais}</td><td>${h.points}</td><td>${h.noteMoyenne ?? '–'}</td></tr>`).join('')}
  </table></div>`;
}
