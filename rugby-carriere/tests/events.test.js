import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS } from '../src/data/events.js';
import { drawEvent, applyChoice, PERIODES } from '../src/engine/events.js';
import { createRng } from '../src/engine/rng.js';
import { STAT_KEYS } from '../src/data/positions.js';

const player = (o = {}) => ({ prenom: 'A', nom: 'B', age: 17, positionId: 'centre', personnaliteIds: ['bosseur', 'calme', 'fidele'],
  stats: Object.fromEntries(STAT_KEYS.map(k => [k, 50])), potentiel: 80, moral: 70, forme: 70, blessure: null, clubId: 'toulouse', historique: [], ...o });
const state = (o = {}) => ({ phase: 'centre', periode: 'automne', flags: [], vusSaison: [], journal: [], player: player(), ...o });

test('au moins 40 événements, 20 au centre, 2 à 4 choix avec texteResultat, ids uniques', () => {
  assert.ok(EVENTS.length >= 40);
  assert.ok(EVENTS.filter(e => e.phase === 'centre').length >= 20);
  assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length);
  for (const e of EVENTS) {
    assert.ok(e.choix.length >= 2 && e.choix.length <= 4, e.id);
    for (const c of e.choix) assert.ok(c.label && c.effets.texteResultat, e.id);
  }
  assert.deepEqual(PERIODES, ['presaison', 'automne', 'hiver', 'printemps', 'ete']);
});

test("drawEvent n'offre pas d'événement 'requiertApte' à un blessé", () => {
  const rng = createRng(1);
  const s = state({ player: player({ blessure: { nom: 'Entorse', semainesRestantes: 4 } }) });
  for (const per of PERIODES) for (let i = 0; i < 50; i++) {
    const e = drawEvent({ ...s, periode: per }, per, rng);
    assert.ok(!e.tags?.includes('requiertApte'), e.id);
  }
});

test('drawEvent exclut les événements déjà vus dans la saison et respecte la phase', () => {
  const rng = createRng(2);
  const s = state({ phase: 'pro' });
  const vus = EVENTS.filter(e => e.phase === 'pro').map(e => e.id).slice(0, 5);
  for (let i = 0; i < 100; i++) {
    const e = drawEvent({ ...s, vusSaison: vus }, 'automne', rng);
    assert.ok(!vus.includes(e.id)); assert.ok(e.phase === 'pro' || e.phase === 'tous');
  }
});

test('applyChoice borne les stats et ne mute pas', () => {
  const s = state({ player: player({ stats: { ...player().stats, puissance: 98 } }) });
  const ev = { id: 'test', choix: [{ label: 'x', effets: { stats: { puissance: 10 }, moral: 50, texteResultat: 'ok' } }] };
  const s2 = applyChoice(s, ev, 0);
  assert.equal(s2.player.stats.puissance, 100);
  assert.equal(s.player.stats.puissance, 98);
  assert.equal(s2.player.moral, 100);
  assert.ok(s2.vusSaison.includes('test'));
  assert.equal(s2.journal.at(-1), 'ok');
});

test('applyChoice applique une blessure', () => {
  const ev = { id: 'b', choix: [{ label: 'x', effets: { blessure: { nom: 'Épaule', semaines: 6 }, texteResultat: 'aïe' } }] };
  const s2 = applyChoice(state(), ev, 0);
  assert.deepEqual(s2.player.blessure, { nom: 'Épaule', semainesRestantes: 6 });
});
