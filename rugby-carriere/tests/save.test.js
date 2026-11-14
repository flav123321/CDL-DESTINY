import { test } from 'node:test';
import assert from 'node:assert/strict';
import { save, load, SAVE_KEY } from '../src/engine/save.js';
import { newCareer, advance } from '../src/engine/career.js';

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; };
const input = { prenom: 'Léo', nom: 'Martin', nationaliteId: 'FR', positionId: 'centre', tailleCm: 185, poidsKg: 95,
  personnaliteIds: ['bosseur', 'calme', 'fidele'], paysCentreId: 'FR', clubId: 'toulouse' };

test('load renvoie null si vide', () => assert.equal(load(mem()), null));
test('load renvoie null si JSON illisible', () => { const st = mem(); st.setItem(SAVE_KEY, '{oups'); assert.equal(load(st), null); });
test('load renvoie null si structure invalide', () => { const st = mem(); st.setItem(SAVE_KEY, '{"a":1}'); assert.equal(load(st), null); });
test('load renvoie null si getItem lève', () => assert.equal(load({ getItem() { throw new Error('privé'); } }), null));
test('load renvoie null sans stockage', () => assert.equal(load(undefined), null));
test('save renvoie false si setItem lève', () => assert.equal(save(newCareer(input, 1), { setItem() { throw new Error('quota'); } }), false));
test('save puis load redonne le même état, et le hasard reprend au même point', () => {
  const st = mem();
  let s = newCareer(input, 7); s = advance(advance(s));
  assert.equal(save(s, st), true);
  const l = load(st);
  assert.deepEqual(l, s);
  assert.deepEqual(advance(l), advance(s));
});
