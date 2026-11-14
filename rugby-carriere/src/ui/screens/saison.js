import { esc, crest, clubNom } from '../common.js';
import { standings } from '../../engine/season.js';

export function renderSaisonTab(s) {
  if (!s.ligue?.results.length) return '<p class="muted">Le championnat n’a pas encore commencé.</p>';
  const t = standings(s.ligue.results);
  return `<p class="muted">Top 14 · après ${s.ligue.journee} journée${s.ligue.journee > 1 ? 's' : ''}</p><div class="scroll"><table>
    <tr><th>#</th><th>Club</th><th>J</th><th>G</th><th>Diff</th><th>Pts</th></tr>
    ${t.map((r, i) => `<tr class="${r.clubId === s.player.clubId ? 'me' : ''}"><td>${i + 1}</td><td><span class="club-row">${crest(r.clubId, 20)} ${esc(clubNom(r.clubId))}</span></td>
      <td>${r.j}</td><td>${r.g}</td><td>${r.pf - r.pc > 0 ? '+' : ''}${r.pf - r.pc}</td><td><b>${r.pts}</b></td></tr>`).join('')}
  </table></div>`;
}

export function renderMatchsRecents(s) {
  const st = s.saisonStats;
  const moy = st.notes.length ? (st.notes.reduce((a, b) => a + b, 0) / st.notes.length).toFixed(1) : '–';
  const resume = `<div class="card"><div class="grid g3" style="text-align:center">
    <div><b>${st.matchs}</b><br><span class="muted">matchs</span></div>
    <div><b>${st.titularisations}</b><br><span class="muted">titularisations</span></div>
    <div><b>${st.essais}</b><br><span class="muted">essais</span></div>
    <div><b>${st.minutes}</b><br><span class="muted">minutes</span></div>
    <div><b>${st.points}</b><br><span class="muted">points</span></div>
    <div><b>${moy}</b><br><span class="muted">note moy.</span></div></div></div>`;
  const matchs = (s.ligue?.joueurMatchs ?? []).slice(-6).reverse();
  if (!matchs.length) return resume;
  return resume + `<h3>Derniers matchs du club</h3>${matchs.map(m => {
    const p = m.perf;
    const perf = !p ? '<span class="muted">Non retenu</span>'
      : `${p.statut === 'titulaire' ? 'Titulaire' : 'Remplaçant'} · ${p.minutes}′ · note <b>${p.note}</b>${p.essais ? ` · ${p.essais} essai${p.essais > 1 ? 's' : ''}` : ''}${p.points && !p.essais ? ` · ${p.points} pts` : ''}`;
    return `<div class="card"><span class="muted">J${m.journee}</span> ${esc(clubNom(m.home))} <b>${m.score}</b> ${esc(clubNom(m.away))}<br>${perf}</div>`;
  }).join('')}`;
}
