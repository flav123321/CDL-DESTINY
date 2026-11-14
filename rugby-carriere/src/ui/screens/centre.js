import { esc, header, statBars } from '../common.js';
import { eventById, PERIODE_LABELS } from '../../engine/events.js';
import { CATEGORIES, saisonLabel } from '../../engine/academy.js';
import { renderSaisonTab, renderMatchsRecents } from './saison.js';
import { historyTable } from '../common.js';

export function renderJeu(ui) {
  const s = ui.career;
  const niveau = s.phase === 'centre' ? CATEGORIES[s.player.age] : (s.pret ? `Prêt en ${s.pret.division}` : 'Top 14');
  const periode = s.periode ? PERIODE_LABELS[s.periode] : 'Intersaison';
  let main = '';
  if (ui.resultat) {
    main = `<div class="card result"><p>${esc(ui.resultat)}</p></div><button class="btn primary" data-action="suite">Continuer</button>`;
  } else if (s.evenementEnCours) {
    const ev = eventById(s.evenementEnCours);
    main = `<div class="card event"><h3>${esc(periode)}</h3><p class="txt">${esc(ev.texte)}</p></div>
      ${ev.choix.map((c, i) => `<button class="btn" data-action="choix" data-v="${i}">${esc(c.label)}</button>`).join('')}`;
  } else {
    const debut = s.periodeIndex === -1;
    main = `<div class="card"><p>${debut ? `Une nouvelle saison commence. ${s.phase === 'centre' ? `Tu évolues en ${esc(niveau)}.` : ''}` : 'La période est terminée.'}</p></div>
      <button class="btn primary" data-action="avancer">${debut ? 'Lancer la saison' : 'Période suivante'}</button>`;
  }
  const tab = ui.tab ?? 'saison';
  const tabs = [['saison', 'Saison'], ['stats', 'Joueur'], ['carriere', 'Carrière']];
  if (s.phase === 'pro' && !s.pret) tabs.splice(1, 0, ['classement', 'Classement']);
  let content = '';
  if (tab === 'saison') content = renderMatchsRecents(s);
  if (tab === 'classement') content = renderSaisonTab(s);
  if (tab === 'stats') content = `<div class="card">${statBars(s.player)}</div>`;
  if (tab === 'carriere') content = historyTable(s.player.historique)
    + (s.phase === 'pro' && s.player.age >= 30 ? '<button class="btn danger" data-action="retraite">Annoncer ma retraite</button>' : '');
  return `${header(s)}
    <p class="muted">Saison ${saisonLabel(s.annee)} · ${esc(periode)} · ${esc(niveau)}</p>
    ${main}
    <div class="tabs">${tabs.map(([id, l]) => `<button class="${tab === id ? 'on' : ''}" data-action="tab" data-v="${id}">${l}</button>`).join('')}</div>
    ${content}`;
}
