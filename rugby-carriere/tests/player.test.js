import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, clampStat } from '../src/engine/player.js';
import { createRng } from '../src/engine/rng.js';
import { PERSONALITIES } from '../src/data/personalities.js';
import { NATIONALITIES, ACADEMY_COUNTRIES } from '../src/data/nationalities.js';
import { STAT_KEYS } from '../src/data/positions.js';

const input = (o = {}) => ({ prenom: 'Léo', nom: 'Martin', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
  personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR', ...o });

test('12 personnalités, 20 nationalités, seul FR jouable', () => {
  assert.equal(PERSONALITIES.length, 12);
  assert.equal(NATIONALITIES.length, 20);
  assert.deepEqual(ACADEMY_COUNTRIES.filter(c => c.jouable).map(c => c.id), ['FR']);
});
test('refuse 2 personnalités', () => {
  assert.throws(() => createPlayer(input({ personnaliteIds: ['bosseur', 'calme'] }), createRng(1)), /3 personnalités/);
});
test('refuse 4 personnalités', () => {
  assert.throws(() => createPlayer(input({ personnaliteIds: ['bosseur', 'calme', 'fidele', 'flair'] }), createRng(1)), /3 personnalités/);
});
test('refuse personnalité en double', () => {
  assert.throws(() => createPlayer(input({ personnaliteIds: ['bosseur', 'bosseur', 'calme'] }), createRng(1)));
});
test('refuse pays de centre non jouable', () => {
  assert.throws(() => createPlayer(input({ paysCentreId: 'JP' }), createRng(1)));
});
test('stats finales dans [0,100], âge 16', () => {
  for (let s = 0; s < 100; s++) {
    const p = createPlayer(input({ personnaliteIds: ['guerrier', 'tete-brulee', 'leader-ne'] }), createRng(s));
    assert.equal(p.age, 16);
    for (const k of STAT_KEYS) assert.ok(p.stats[k] >= 0 && p.stats[k] <= 100);
  }
});
test('guerrier augmente plaquage', () => {
  let a = 0, b = 0;
  for (let s = 0; s < 200; s++) {
    a += createPlayer(input({ personnaliteIds: ['guerrier', 'calme', 'fidele'] }), createRng(s)).stats.plaquage;
    b += createPlayer(input({ personnaliteIds: ['studieux', 'calme', 'fidele'] }), createRng(s)).stats.plaquage;
  }
  assert.ok(a > b);
});
test('gabarit hors fourchette ramené', () => {
  const p = createPlayer(input({ positionId: 'pilier-droit', tailleCm: 150, poidsKg: 300 }), createRng(1));
  assert.equal(p.tailleCm, 176); assert.equal(p.poidsKg, 140);
});
test('potentiel entre 60 et 95', () => {
  for (let s = 0; s < 100; s++) { const p = createPlayer(input(), createRng(s)); assert.ok(p.potentiel >= 60 && p.potentiel <= 95); }
});
test('clampStat', () => { assert.equal(clampStat(120), 100); assert.equal(clampStat(-3), 0); });
