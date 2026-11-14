import { renderAccueil } from './screens/accueil.js';
import { renderCreation } from './screens/creation.js';
import { renderJeu } from './screens/centre.js';
import { renderOffres, renderFin, renderBilan } from './screens/resume.js';
import { newCareer, advance, choose, acceptOffer, academyClubOffers, retire } from '../engine/career.js';
import { createRng } from '../engine/rng.js';
import { save, load } from '../engine/save.js';
import { positionById } from '../data/positions.js';

const root = document.getElementById('app');
const ui = { screen: 'accueil', career: null, creation: null, tab: 'saison', resultat: null, sauvegarde: null, stockageKo: false, erreur: false };

function persist() { if (ui.career && !save(ui.career)) ui.stockageKo = true; }

function screenFor() {
  if (ui.screen !== 'jeu') return ui.screen;
  if (ui.career.phase === 'offres') return 'offres';
  if (ui.career.phase === 'fin') return 'fin';
  if (ui.career.phase === 'bilan') return 'bilan';
  return 'jeu';
}

function render() {
  try {
    if (ui.screen === 'accueil') ui.sauvegarde = load(); // toujours la sauvegarde la plus récente
    const sc = screenFor();
    root.innerHTML = sc === 'accueil' ? renderAccueil(ui) : sc === 'creation' ? renderCreation(ui)
      : sc === 'offres' ? renderOffres(ui) : sc === 'fin' ? renderFin(ui) : sc === 'bilan' ? renderBilan(ui) : renderJeu(ui);
  } catch (err) {
    console.error(err);
    if (ui.screen !== 'accueil') { ui.screen = 'accueil'; ui.career = null; ui.erreur = true; render(); return; }
    root.innerHTML = '<p>Erreur inattendue. Recharge la page.</p>';
  }
}

function startCreation() {
  ui.creation = { step: 1, offres: null, seed: (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0,
    data: { prenom: '', nom: '', nationaliteId: null, positionId: null, tailleCm: 185, poidsKg: 95, personnaliteIds: [], paysCentreId: null } };
  ui.screen = 'creation';
}

const actions = {
  nouvelle() { startCreation(); },
  continuer() { if (ui.sauvegarde) { ui.career = ui.sauvegarde; ui.screen = 'jeu'; ui.resultat = null; } },
  'c-set'(el) {
    const d = ui.creation.data; d[el.dataset.k] = el.dataset.v;
    if (el.dataset.k === 'positionId') { const p = positionById(el.dataset.v);
      d.tailleCm = Math.round((p.tailleCm[0] + p.tailleCm[1]) / 2); d.poidsKg = Math.round((p.poidsKg[0] + p.poidsKg[1]) / 2); }
  },
  'c-perso'(el) {
    const l = ui.creation.data.personnaliteIds; const v = el.dataset.v;
    ui.creation.data.personnaliteIds = l.includes(v) ? l.filter(x => x !== v) : l.length < 3 ? [...l, v] : l;
  },
  'c-next'() { ui.creation.step = Math.min(5, ui.creation.step + 1); },
  'c-prev'() { if (ui.creation.step === 1) ui.screen = 'accueil'; else ui.creation.step--; },
  'c-pays'(el) { ui.creation.data.paysCentreId = el.dataset.v; ui.creation.offres = academyClubOffers(createRng(ui.creation.seed)); },
  'c-reset-pays'() { ui.creation.offres = null; },
  'c-club'(el) {
    ui.career = newCareer({ ...ui.creation.data, clubId: el.dataset.v }, ui.creation.seed);
    ui.screen = 'jeu'; ui.tab = 'stats'; ui.resultat = null; persist();
  },
  avancer() { ui.career = advance(ui.career); if (ui.tab === 'stats' && ui.career.periodeIndex === 0) ui.tab = 'saison'; persist(); },
  choix(el) {
    ui.career = choose(ui.career, Number(el.dataset.v));
    ui.resultat = ui.career.journal.at(-1); persist();
  },
  suite() { ui.resultat = null; ui.career = advance(ui.career); persist(); },
  offre(el) { ui.career = acceptOffer(ui.career, Number(el.dataset.v)); ui.tab = 'saison'; persist(); },
  retraite() { ui.career = retire(ui.career); persist(); },
  tab(el) { ui.tab = el.dataset.v; },
};

root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  try { fn(el); } catch (err) { console.error(err); }
  render();
  if (['avancer', 'suite', 'offre', 'c-next', 'c-prev', 'c-club', 'nouvelle', 'continuer'].includes(el.dataset.action)) window.scrollTo(0, 0);
});

root.addEventListener('input', (e) => {
  const f = e.target.dataset.field;
  if (!f || !ui.creation) return;
  const d = ui.creation.data;
  if (e.target.type === 'range') {
    d[f] = Number(e.target.value);
    const out = document.getElementById(f === 'tailleCm' ? 'taille-v' : 'poids-v');
    if (out) out.textContent = `${d[f]} ${f === 'tailleCm' ? 'cm' : 'kg'}`;
  } else {
    d[f] = e.target.value;
    const btn = root.querySelector('[data-action="c-next"]');
    if (btn) btn.disabled = !(d.prenom.trim() && d.nom.trim() && d.nationaliteId);
  }
});

// test de disponibilité du stockage
try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); } catch { ui.stockageKo = true; }

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW', err));
}
render();
