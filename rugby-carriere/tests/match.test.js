import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateMatch } from '../src/engine/match.js';
import { createRng } from '../src/engine/rng.js';

test('scores cohérents avec les essais', () => {
  const rng = createRng(5);
  for (let i = 0; i < 300; i++) {
    const m = simulateMatch({ id: 'a', force: 80 }, { id: 'b', force: 72 }, null, rng);
    assert.ok(m.scoreHome >= m.essaisHome * 5 && m.scoreAway >= m.essaisAway * 5);
    assert.equal(m.perfJoueur, null);
  }
});
test('le plus fort à domicile gagne majoritairement', () => {
  const rng = createRng(6); let w = 0;
  for (let i = 0; i < 300; i++) { const m = simulateMatch({ id: 'a', force: 82 }, { id: 'b', force: 72 }, null, rng); if (m.scoreHome > m.scoreAway) w++; }
  assert.ok(w > 210, `${w}`);
});
test('perfJoueur renseignée quand le joueur joue', () => {
  const rng = createRng(7);
  const player = { clubId: 'a', positionId: 'ailier', stats: { puissance: 60, vitesse: 80, endurance: 60, plaquage: 50, passe: 50, jeuAuPied: 40, lecture: 60, conquete: 30, mental: 60, leadership: 40 } };
  const m = simulateMatch({ id: 'a', force: 75 }, { id: 'b', force: 75 }, player, rng, { statut: 'titulaire' });
  assert.ok(m.perfJoueur.minutes >= 40 && m.perfJoueur.note >= 0 && m.perfJoueur.note <= 10);
  assert.equal(m.perfJoueur.statut, 'titulaire');
});
