import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures, standings, playoffs, teamStrength, simulateSeason } from '../src/engine/season.js';
import { selectMatchday } from '../src/engine/match.js';
import { TOP14, clubById } from '../src/data/leagues/top14.js';
import { createRng } from '../src/engine/rng.js';
import { createPlayer } from '../src/engine/player.js';
import { STAT_KEYS } from '../src/data/positions.js';

const ids = TOP14.clubs.map(c => c.id);

test('26 journées, chaque club 13 domicile / 13 extérieur, une fois par journée', () => {
  const f = buildFixtures(ids);
  assert.equal(f.length, 26);
  for (const day of f) {
    assert.equal(day.length, 7);
    assert.equal(new Set(day.flat()).size, 14);
  }
  for (const id of ids) assert.equal(f.flat().filter(([h]) => h === id).length, 13);
  const pairs = new Set(f.flat().map(([h, a]) => h + '>' + a));
  assert.equal(pairs.size, 182);
});

test('bonus offensif et défensif', () => {
  const t = standings([
    { home: 'a', away: 'b', scoreHome: 30, scoreAway: 10, essaisHome: 4, essaisAway: 1 },
    { home: 'c', away: 'd', scoreHome: 20, scoreAway: 17, essaisHome: 2, essaisAway: 2 },
  ]);
  const p = (id) => t.find(r => r.clubId === id).pts;
  assert.equal(p('a'), 5); assert.equal(p('b'), 0); assert.equal(p('c'), 4); assert.equal(p('d'), 1);
  assert.equal(t[0].clubId, 'a');
});

const mkPlayer = (seed, o = {}) => {
  const p = createPlayer({ prenom: 'Léo', nom: 'Test', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
    personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR' }, createRng(seed));
  return { ...p, ...o };
};

test('blessé jamais retenu', () => {
  const club = clubById('toulouse');
  const p = mkPlayer(1, { clubId: 'toulouse', stats: Object.fromEntries(STAT_KEYS.map(k => [k, 99])), blessure: { nom: 'Entorse', semainesRestantes: 3 } });
  const rng = createRng(3);
  for (let i = 0; i < 100; i++) assert.equal(selectMatchday(club, p, rng), 'non-retenu');
});

test('jeune noté 55 rarement titulaire dans un club de prestige 4', () => {
  const club = clubById('racing');
  const p = mkPlayer(2, { clubId: 'racing', age: 18, stats: Object.fromEntries(STAT_KEYS.map(k => [k, 55])) });
  const rng = createRng(9);
  let tit = 0;
  for (let i = 0; i < 200; i++) if (selectMatchday(club, p, rng) === 'titulaire') tit++;
  assert.ok(tit < 100, `titulaire ${tit}/200`);
});

test('joueur de 90 presque toujours titulaire', () => {
  const club = clubById('vannes');
  const p = mkPlayer(3, { clubId: 'vannes', stats: Object.fromEntries(STAT_KEYS.map(k => [k, 90])) });
  const rng = createRng(4);
  let tit = 0;
  for (let i = 0; i < 200; i++) if (selectMatchday(club, p, rng) === 'titulaire') tit++;
  assert.ok(tit > 150, `titulaire ${tit}/200`);
});

test('le meilleur club finit top 6 dans plus de 70 % des saisons, champion parmi les 6', () => {
  const best = [...TOP14.clubs].sort((a, b) => teamStrength(b, null) - teamStrength(a, null))[0].id;
  let top6 = 0;
  for (let s = 0; s < 50; s++) {
    const res = simulateSeason(TOP14.clubs, null, createRng(100 + s));
    const table = standings(res.results);
    if (table.slice(0, 6).some(r => r.clubId === best)) top6++;
    const po = playoffs(table, createRng(s), res.forces);
    assert.ok(table.slice(0, 6).map(r => r.clubId).includes(po.champion));
    assert.equal(po.relegue, table[13].clubId);
    assert.equal(po.barrageAccession, table[12].clubId);
  }
  assert.ok(top6 > 35, `top6 ${top6}/50`);
});
