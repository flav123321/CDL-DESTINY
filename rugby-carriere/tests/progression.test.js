import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressSeason } from '../src/engine/progression.js';
import { rollInjury, tickInjury } from '../src/engine/injuries.js';
import { overall } from '../src/engine/rating.js';
import { createRng } from '../src/engine/rng.js';
import { STAT_KEYS } from '../src/data/positions.js';

const pl = (o = {}) => ({ age: 20, positionId: 'centre', personnaliteIds: ['calme', 'fidele', 'studieux'], potentiel: 90,
  stats: Object.fromEntries(STAT_KEYS.map(k => [k, 60])), blessure: null, ...o });

test('à potentiel égal, 20 ans progresse plus que 32 ans', () => {
  const rng = createRng(1);
  let g20 = 0, g32 = 0;
  for (let i = 0; i < 50; i++) {
    g20 += overall(progressSeason(pl({ age: 20 }), { minutesJouees: 800 }, rng).stats, 'centre') - 60;
    g32 += overall(progressSeason(pl({ age: 32 }), { minutesJouees: 800 }, rng).stats, 'centre') - 60;
  }
  assert.ok(g20 > 0 && g32 < g20);
});
test('la progression ne dépasse jamais le potentiel', () => {
  const rng = createRng(2);
  for (let i = 0; i < 200; i++) {
    const p = progressSeason(pl({ age: 18, potentiel: 62, personnaliteIds: ['bosseur', 'calme', 'fidele'] }), { minutesJouees: 2000, entrainementBonus: 3 }, rng);
    assert.ok(overall(p.stats, 'centre') <= 62);
    for (const k of STAT_KEYS) assert.ok(p.stats[k] <= 100 && p.stats[k] >= 0);
  }
});
test('fragile-doue se blesse plus souvent que calme', () => {
  const rng = createRng(3);
  let f = 0, c = 0;
  for (let i = 0; i < 1000; i++) {
    if (rollInjury(pl({ personnaliteIds: ['fragile-doue', 'fidele', 'studieux'] }), rng)) f++;
    if (rollInjury(pl(), rng)) c++;
  }
  assert.ok(f > c * 1.4, `${f} vs ${c}`);
});
test('tickInjury guérit', () => {
  const p = tickInjury(pl({ blessure: { nom: 'x', semainesRestantes: 3 } }), 4);
  assert.equal(p.blessure, null);
  assert.equal(tickInjury(pl({ blessure: { nom: 'x', semainesRestantes: 6 } }), 4).blessure.semainesRestantes, 2);
});
