import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crestSvg } from '../src/engine/crest.js';

test('crestSvg contient les 2 couleurs et commence par <svg', () => {
  const s = crestSvg({ id: 'x', nom: 'Stade Test', couleurs: ['#ff0000', '#00ff00'], sigle: 'ST' });
  assert.ok(s.startsWith('<svg'));
  assert.ok(s.includes('#ff0000') && s.includes('#00ff00'));
  assert.ok(s.includes('ST'));
});
