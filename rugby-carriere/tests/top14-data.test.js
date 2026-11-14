import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOP14 } from '../src/data/leagues/top14.js';
import { POSITIONS } from '../src/data/positions.js';
import { NATIONALITIES } from '../src/data/nationalities.js';

const posIds = new Set(POSITIONS.map(p => p.id));
const natIds = new Set([...NATIONALITIES.map(n => n.id), 'autre']);

test('14 clubs, saison 2026-27', () => { assert.equal(TOP14.clubs.length, 14); assert.equal(TOP14.saison, '2026-27'); });
test('ids de club uniques', () => assert.equal(new Set(TOP14.clubs.map(c => c.id)).size, 14));
test('chaque club a au moins 30 joueurs', () => { for (const c of TOP14.clubs) assert.ok(c.joueurs.length >= 30, c.id); });
test('première ligne : 2 par poste minimum, 1 ailleurs', () => {
  for (const c of TOP14.clubs) for (const p of POSITIONS) {
    const n = c.joueurs.filter(j => j.positionId === p.id).length;
    const min = ['pilier-gauche', 'pilier-droit', 'talonneur'].includes(p.id) ? 2 : 1;
    assert.ok(n >= min, `${c.id} ${p.id} ${n}`);
  }
});
test('positionId et nationalités valides', () => {
  for (const c of TOP14.clubs) for (const j of c.joueurs) {
    assert.ok(posIds.has(j.positionId), `${j.nom} ${j.positionId}`);
    assert.ok(natIds.has(j.nationaliteId), `${j.nom} ${j.nationaliteId}`);
  }
});
test('notes dans [40,95], âges 18-41', () => {
  for (const c of TOP14.clubs) for (const j of c.joueurs) {
    assert.ok(j.note >= 40 && j.note <= 95, j.nom);
    assert.ok(j.age >= 18 && j.age <= 41, j.nom);
  }
});
test('couleurs #rrggbb, prestige et centre 1..5', () => {
  for (const c of TOP14.clubs) {
    assert.equal(c.couleurs.length, 2);
    for (const col of c.couleurs) assert.match(col, /^#[0-9a-f]{6}$/i);
    assert.ok(c.prestige >= 1 && c.prestige <= 5 && c.centreFormation >= 1 && c.centreFormation <= 5);
  }
});
test('Dupont est à Toulouse et noté au moins 90', () => {
  const t = TOP14.clubs.find(c => c.id === 'toulouse');
  const d = t.joueurs.find(j => j.nom === 'Antoine Dupont');
  assert.ok(d && d.note >= 90 && d.positionId === 'demi-de-melee');
});
