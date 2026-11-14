import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { save, load, SAVE_KEY } from '../src/engine/save.js';
import { newCareer, advance, choose } from '../src/engine/career.js';
import { EVENTS } from '../src/data/events.js';

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const input = { prenom: 'Léo', nom: 'Martin', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
  personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR', clubId: 'toulouse' };

test('F1 : un événement disparu dans la sauvegarde est ignoré au chargement', () => {
  const st = mem(); save({ ...newCareer(input, 1), evenementEnCours: 'evenement-supprime' }, st);
  assert.equal(load(st).evenementEnCours, null);
});
test('F1 : une sauvegarde incomplète est refusée', () => {
  const st = mem(); const s = newCareer(input, 1);
  st.setItem(SAVE_KEY, JSON.stringify({ ...s, saisonStats: undefined })); assert.equal(load(st), null);
  st.setItem(SAVE_KEY, JSON.stringify({ ...s, player: { ...s.player, stats: undefined } })); assert.equal(load(st), null);
  st.setItem(SAVE_KEY, JSON.stringify({ ...s, phase: 'nimporte' })); assert.equal(load(st), null);
});
test('F2 : le cache du service worker suit la version du jeu et force le rechargement', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok(sw.includes(`rugby-carriere-${version}`));
  assert.ok(sw.includes("cache: 'reload'"));
});
test('F3 : un bilan est affiché à chaque fin de saison, même sans fin de contrat', () => {
  let s = newCareer(input, 2); let bilans = 0, guard = 0;
  while (s.annee < 2028 && guard++ < 100) {
    if (s.evenementEnCours && s.phase !== 'bilan') { s = choose(s, 0); continue; }
    const avant = s.annee; s = advance(s);
    if (s.annee > avant) { assert.equal(s.phase, 'bilan'); assert.ok(s.dernierResume); bilans++; s = advance(s); assert.equal(s.phase, 'centre'); }
  }
  assert.equal(bilans, 2);
});
test('F4 : les événements de jeu exigent un joueur apte', () => {
  for (const id of ['c-arrieres-buteur', 'c-avants-melee', 'c-reseaux'])
    assert.ok(EVENTS.find(e => e.id === id).tags?.includes('requiertApte'), id);
});
test('F5 : signer la prolongation allonge le contrat de 2 ans', () => {
  const s = { ...newCareer(input, 3), phase: 'pro', contratFin: 2029, evenementEnCours: 'p-contrat-prolongation' };
  assert.equal(choose(s, 0).contratFin, 2031);
  assert.equal(choose(s, 1).contratFin, 2029);
});
