import { test } from 'node:test';
import assert from 'node:assert/strict';
import { academyStep, newAcademyState } from '../src/engine/academy.js';
import { applyChoice } from '../src/engine/events.js';
import { createRng } from '../src/engine/rng.js';
import { createPlayer } from '../src/engine/player.js';

test('le centre dure de 16 à 19 ans et finit avec des offres', () => {
  const rng = createRng(11);
  const p = createPlayer({ prenom: 'Léo', nom: 'Test', nationaliteId: 'FR', positionId: 'ailier', tailleCm: 182, poidsKg: 88,
    personnaliteIds: ['bosseur', 'flair', 'fidele'], paysCentreId: 'FR' }, rng);
  let s = newAcademyState({ ...p, clubId: 'toulouse' });
  let steps = 0;
  while (!s.offresContrat && steps < 100) {
    s = academyStep(s, rng);
    if (s.evenementEnCours) s = { ...applyChoice(s, s.evenementEnCours, 0), evenementEnCours: null };
    steps++;
  }
  assert.ok(s.offresContrat?.length > 0);
  assert.equal(s.player.age, 19);
  assert.equal(steps, 16); // 3 saisons × 5 périodes + l’étape de fin
  for (const o of s.offresContrat) assert.ok(['pro', 'pret', 'liberation'].includes(o.type));
});
