import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/engine/rng.js';

test('rng même graine → même suite', () => {
  const a = createRng(42), b = createRng(42);
  for (let i = 0; i < 5; i++) assert.equal(a.next(), b.next());
});
test('int(1,6) reste dans [1,6]', () => {
  const r = createRng(1);
  for (let i = 0; i < 1000; i++) { const v = r.int(1, 6); assert.ok(v >= 1 && v <= 6 && Number.isInteger(v)); }
});
test('état sauvegardable', () => {
  const a = createRng(7); a.next(); const s = a.getState();
  const b = createRng(0); b.setState(s);
  assert.equal(a.next(), b.next());
});
