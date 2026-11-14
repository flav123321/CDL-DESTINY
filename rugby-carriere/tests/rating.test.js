import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overall } from '../src/engine/rating.js';
import { POSITIONS, STAT_KEYS } from '../src/data/positions.js';

const base = () => Object.fromEntries(STAT_KEYS.map(k => [k, 50]));
test('overall pilier privilégie conquete', () => {
  const s = { ...base(), conquete: 90 };
  assert.ok(overall(s, 'pilier-gauche') > overall(s, 'ailier'));
});
test('overall ouvreur privilégie jeuAuPied', () => {
  const s = { ...base(), jeuAuPied: 90 };
  assert.ok(overall(s, 'demi-d-ouverture') > overall(s, 'pilier-droit'));
});
test('poids de chaque poste somment à 1', () => {
  assert.equal(POSITIONS.length, 11);
  for (const p of POSITIONS) {
    const sum = Object.values(p.poids).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 0.001, p.id);
  }
});
test('overall borné 0-100', () => {
  const s = Object.fromEntries(STAT_KEYS.map(k => [k, 100]));
  assert.equal(overall(s, 'centre'), 100);
});
