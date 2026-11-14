import { esc, crest, clubNom, header, historyTable } from '../common.js';

const ROLES = { titulaire: 'Titulaire', rotation: 'Rotation', espoir: 'Espoir' };

function bilanCard(r) {
  return r ? `<div class="card"><h3>Bilan ${esc(r.saison)}</h3>
    <p><b>${esc(r.club)}</b> · ${esc(r.niveau ?? '')} · ${r.age} ans</p>
    <p>${r.matchs} matchs · ${r.titularisations} titularisations · ${r.minutes} min · ${r.essais} essais · ${r.points} pts · note moyenne ${r.noteMoyenne ?? '–'}</p>
    ${r.champion ? `<p class="muted">Champion de France : ${esc(r.champion)} (${esc(r.finale)}) · relégué : ${esc(r.relegue)}${r.classementClub ? ` · ton club : ${r.classementClub}e` : ''}</p>` : ''}
    ${r.championAvecLui ? '<p>🏆 <b>Tu es champion de France !</b></p>' : ''}</div>` : '';
}

export function renderBilan(ui) {
  const s = ui.career;
  return `${header(s)}<h1>Fin de saison</h1>${bilanCard(s.dernierResume)}
    <button class="btn primary" data-action="avancer">Saison suivante</button>`;
}

export function renderOffres(ui) {
  const s = ui.career;
  const bilan = bilanCard(s.dernierResume);
  const titre = s.player.age <= 19 && s.player.historique.every(h => h.categorie) ? 'Fin du centre de formation' : 'Ton avenir';
  return `${header(s)}<h1>${titre}</h1>${bilan}<h2>Offres</h2>
    ${s.offresContrat.map((o, i) => {
      if (o.type === 'liberation') return `<button class="btn danger" data-action="offre" data-v="${i}">Le club ne te garde pas<small>Fin de l’aventure (les autres divisions arrivent bientôt)</small></button>`;
      if (o.type === 'pret') return `<button class="btn" data-action="offre" data-v="${i}">Prêt d’un an en ${esc(o.division)}<small>Rôle attendu : ${ROLES[o.role] ?? ''} · retour ensuite à ${esc(clubNom(o.clubId))}</small></button>`;
      return `<button class="btn" data-action="offre" data-v="${i}"><span class="club-row">${crest(o.clubId, 36)}<span><b>${esc(clubNom(o.clubId))}</b>
        <small>Contrat pro de ${o.duree} an${o.duree > 1 ? 's' : ''} · rôle : ${ROLES[o.role] ?? o.role}</small></span></span></button>`;
    }).join('')}
    ${s.player.age >= 30 ? '<button class="btn danger" data-action="retraite">Prendre ma retraite</button>' : ''}`;
}

export function renderFin(ui) {
  const s = ui.career; const h = s.player.historique.filter(x => !x.categorie);
  const tot = (k) => h.reduce((a, x) => a + (x[k] ?? 0), 0);
  const titres = h.filter(x => x.championAvecLui).length;
  return `${header(s)}<h1>Fin de carrière</h1>
    <div class="card"><p>${esc(s.journal.at(-1) ?? '')}</p>
    <p><b>${tot('matchs')}</b> matchs pros · <b>${tot('essais')}</b> essais · <b>${tot('points')}</b> points · <b>${titres}</b> Bouclier${titres > 1 ? 's' : ''} de Brennus</p></div>
    ${historyTable(s.player.historique)}
    <button class="btn primary" data-action="nouvelle">Nouvelle carrière</button>`;
}
