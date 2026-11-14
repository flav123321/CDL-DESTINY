import { esc, crest } from '../common.js';
import { NATIONALITIES, ACADEMY_COUNTRIES } from '../../data/nationalities.js';
import { POSITIONS, positionById } from '../../data/positions.js';
import { PERSONALITIES } from '../../data/personalities.js';
import { clubById } from '../../data/leagues/top14.js';

const stepsBar = (n) => `<div class="steps">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
const nav = (ok, label = 'Suivant') => `<button class="btn primary" data-action="c-next" ${ok ? '' : 'disabled'}>${label}</button>
  <button class="btn ghost" data-action="c-prev">Retour</button>`;

export function renderCreation(ui) {
  const c = ui.creation; const d = c.data;
  if (c.step === 1) {
    const ok = d.prenom?.trim() && d.nom?.trim() && d.nationaliteId;
    return `${stepsBar(1)}<h1>Ton joueur</h1>
      <label for="prenom">Prénom</label><input type="text" id="prenom" data-field="prenom" value="${esc(d.prenom)}" autocomplete="off" maxlength="24">
      <label for="nom">Nom</label><input type="text" id="nom" data-field="nom" value="${esc(d.nom)}" autocomplete="off" maxlength="24">
      <h3>Nationalité</h3>
      <div class="grid g3">${NATIONALITIES.map(n => `<button class="tile ${d.nationaliteId === n.id ? 'on' : ''}" data-action="c-set" data-k="nationaliteId" data-v="${n.id}">
        <span class="big">${n.drapeau}</span>${esc(n.label)}</button>`).join('')}</div>
      ${nav(ok)}`;
  }
  if (c.step === 2) {
    return `${stepsBar(2)}<h1>Ton poste</h1>
      <div class="grid g2">${POSITIONS.map(p => `<button class="tile ${d.positionId === p.id ? 'on' : ''}" data-action="c-set" data-k="positionId" data-v="${p.id}">
        <b>${esc(p.label)}</b><small>n° ${p.numeros.join(' / ')}</small></button>`).join('')}</div>
      ${nav(!!d.positionId)}`;
  }
  if (c.step === 3) {
    const p = positionById(d.positionId);
    return `${stepsBar(3)}<h1>Ton gabarit</h1><p class="muted">Fourchette réaliste pour un ${esc(p.label.toLowerCase())}.</p>
      <div class="card"><label for="taille">Taille : <b id="taille-v">${d.tailleCm} cm</b></label>
      <input type="range" id="taille" data-field="tailleCm" min="${p.tailleCm[0]}" max="${p.tailleCm[1]}" value="${d.tailleCm}">
      <label for="poids">Poids : <b id="poids-v">${d.poidsKg} kg</b></label>
      <input type="range" id="poids" data-field="poidsKg" min="${p.poidsKg[0]}" max="${p.poidsKg[1]}" value="${d.poidsKg}"></div>
      ${nav(true)}`;
  }
  if (c.step === 4) {
    const n = d.personnaliteIds.length;
    return `${stepsBar(4)}<h1>Ta personnalité</h1><p class="muted">Choisis exactement 3 traits. Ils fixent tes stats de départ et ce qui t’arrivera.</p>
      <p><span class="pill">${n}/3</span></p>
      <div class="grid g2">${PERSONALITIES.map(p => {
        const on = d.personnaliteIds.includes(p.id);
        return `<button class="tile ${on ? 'on' : ''}" data-action="c-perso" data-v="${p.id}" ${!on && n >= 3 ? 'disabled' : ''}>
          <span class="big">${p.emoji}</span><b>${esc(p.label)}</b><small>${esc(p.description)}</small></button>`;
      }).join('')}</div>
      ${nav(n === 3)}`;
  }
  // étape 5 : pays puis club
  if (!c.offres) {
    return `${stepsBar(5)}<h1>Ton centre de formation</h1><p class="muted">Dans quel pays commences-tu, à 16 ans ?</p>
      <div class="grid g2">${ACADEMY_COUNTRIES.map(p => `<button class="tile" data-action="c-pays" data-v="${p.id}" ${p.jouable ? '' : 'disabled'}>
        <span class="big">${p.drapeau}</span><b>${esc(p.label)}</b><small>${p.jouable ? 'Disponible' : 'Bientôt'}</small></button>`).join('')}</div>
      <button class="btn ghost" data-action="c-prev">Retour</button>`;
  }
  return `${stepsBar(5)}<h1>Trois clubs te veulent</h1><p class="muted">Leurs recruteurs t’ont repéré. Où signes-tu ta convention de formation ?</p>
    ${c.offres.map(id => { const cl = clubById(id); return `<button class="btn" data-action="c-club" data-v="${id}"><span class="club-row">${crest(id, 40)}
      <span><b>${esc(cl.nom)}</b><small>Centre de formation ${'★'.repeat(cl.centreFormation)}${'☆'.repeat(5 - cl.centreFormation)} · Prestige ${'★'.repeat(cl.prestige)}</small></span></span></button>`; }).join('')}
    <button class="btn ghost" data-action="c-reset-pays">Retour</button>`;
}
