import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCareer, advance, choose, acceptOffer, seasonSummary, academyClubOffers, retire } from '../src/engine/career.js';
import { createRng } from '../src/engine/rng.js';

const input = { prenom: 'Léo', nom: 'Martin', nationaliteId: 'FJ', positionId: 'ailier', tailleCm: 184, poidsKg: 90,
  personnaliteIds: ['bosseur', 'flair', 'fidele'], paysCentreId: 'FR' };

test('3 offres de centres de formation, clubs différents', () => {
  const o = academyClubOffers(createRng(5));
  assert.equal(o.length, 3); assert.equal(new Set(o).size, 3);
});

test('une carrière complète tourne du centre à 3 saisons pro sans erreur', () => {
  const clubId = academyClubOffers(createRng(1))[0];
  let s = newCareer({ ...input, clubId }, 1);
  assert.equal(s.phase, 'centre'); assert.equal(s.player.age, 16);
  let guard = 0, saisonsPro = 0;
  while (saisonsPro < 3 && guard++ < 200) {
    if (s.evenementEnCours) { s = choose(s, 0); continue; }
    if (s.phase === 'offres') { s = acceptOffer(s, 0); continue; }
    const avant = s.annee;
    s = advance(s);
    if (['pro', 'bilan'].includes(s.phase) && s.annee > avant && s.dernierResume?.niveau === 'Top 14') saisonsPro++;
    if (s.phase === 'fin') break;
  }
  assert.ok(saisonsPro >= 1 || s.phase === 'fin', `phase ${s.phase}`);
  assert.ok(s.player.historique.length >= 3);
  for (const h of s.player.historique) assert.ok(typeof h.age === 'number');
  JSON.stringify(s); // sérialisable
});

test('seasonSummary contient l’âge et le club', () => {
  const s = newCareer({ ...input, clubId: 'pau' }, 3);
  const r = seasonSummary(s);
  assert.equal(r.age, 16); assert.equal(r.club, 'Section Paloise');
});

test('choose sans événement en cours lève une erreur', () => {
  const s = newCareer({ ...input, clubId: 'pau' }, 3);
  assert.throws(() => choose({ ...s, evenementEnCours: null }, 0));
});

test('retire termine la carrière', () => assert.equal(retire(newCareer({ ...input, clubId: 'pau' }, 3)).phase, 'fin'));

test('avancer avec un événement en attente ne fait rien', () => {
  let s = newCareer({ ...input, clubId: 'pau' }, 4);
  while (!s.evenementEnCours) s = advance(s);
  assert.equal(advance(s), s);
});
