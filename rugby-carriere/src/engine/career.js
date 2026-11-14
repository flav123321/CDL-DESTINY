import { createRng } from './rng.js';
import { createPlayer } from './player.js';
import { overall } from './rating.js';
import { TOP14, clubById } from '../data/leagues/top14.js';
import { academyStep, newAcademyState, saisonLabel, CATEGORIES } from './academy.js';
import { PERIODES, drawEvent, applyChoice, eventById } from './events.js';
import { buildFixtures, standings, playoffs, teamStrength, playDay } from './season.js';
import { progressSeason } from './progression.js';
import { rollInjury, tickInjury } from './injuries.js';

// Répartition des 26 journées de Top 14 sur les périodes.
const JOURNEES = { presaison: [0, 0], automne: [0, 9], hiver: [9, 17], printemps: [17, 26], ete: [26, 26] };
const vide = () => ({ matchs: 0, titularisations: 0, minutes: 0, essais: 0, points: 0, plaquages: 0, notes: [] });

function withRng(state, fn) {
  const rng = createRng(0); rng.setState(state.rngState);
  const out = fn(rng);
  return { ...out, rngState: rng.getState() };
}
const toId = (s) => ({ ...s, evenementEnCours: s.evenementEnCours ? s.evenementEnCours.id : null });

/** 3 centres de formation proposés : un grand club et deux tirés au hasard. */
export function academyClubOffers(rng) {
  const clubs = [...TOP14.clubs];
  const grands = clubs.filter(c => c.centreFormation >= 4);
  const premier = rng.pick(grands);
  const reste = clubs.filter(c => c.id !== premier.id);
  const a = reste.splice(rng.int(0, reste.length - 1), 1)[0];
  const b = reste.splice(rng.int(0, reste.length - 1), 1)[0];
  return [premier.id, a.id, b.id];
}

export function newCareer(input, seed) {
  const rng = createRng(seed);
  const { clubId, ...rest } = input;
  if (!clubById(clubId)) throw new Error(`Club inconnu : ${clubId}`);
  const player = { ...createPlayer(rest, rng), clubId };
  const s = newAcademyState(player);
  return { version: 1, seed, ...s, clubNom: clubById(clubId).nom, ligue: null, pret: null, contratFin: null, dernierResume: null, rngState: rng.getState() };
}

/** Avance d'une période. Ne fait rien si un choix est en attente. */
export function advance(state) {
  if (state.phase === 'bilan') return { ...state, phase: state.phaseApresBilan ?? 'pro', phaseApresBilan: null };
  if (state.evenementEnCours || state.phase === 'offres' || state.phase === 'fin') return state;
  if (state.phase === 'centre') {
    return withRng(state, (rng) => {
      const ev = state.evenementEnCours;
      const s = academyStep({ ...state, evenementEnCours: ev ? eventById(ev) : null }, rng);
      if (s.offresContrat) {
        const last = s.player.historique.at(-1);
        return { ...toId(s), phase: 'offres', dernierResume: { ...last, niveau: CATEGORIES[last.age], club: clubById(s.player.clubId).nom } };
      }
      if (s.annee > state.annee) {
        // fin d'une saison au centre : bilan avant de continuer
        return { ...toId(s), phase: 'bilan', phaseApresBilan: 'centre', dernierResume: s.player.historique.at(-1) };
      }
      return toId(s);
    });
  }
  return withRng(state, (rng) => proStep(state, rng));
}

function initLigue(state) {
  const ids = TOP14.clubs.map(c => c.id);
  return { fixtures: buildFixtures(ids), journee: 0, results: [], joueurMatchs: [] };
}

function proStep(state, rng) {
  let s = { ...state };
  let idx = s.periodeIndex + 1;
  if (idx >= PERIODES.length) return finDeSaison(s, rng);
  s.periodeIndex = idx; s.periode = PERIODES[idx];
  if (!s.ligue) s.ligue = initLigue(s);
  s.player = tickInjury(s.player, 6);
  if (!s.player.blessure) { const b = rollInjury(s.player, rng); if (b) s.player = { ...s.player, blessure: b }; }

  const [from, to] = JOURNEES[s.periode];
  const ligue = { ...s.ligue, results: [...s.ligue.results], joueurMatchs: [...s.ligue.joueurMatchs] };
  const st = { ...s.saisonStats, notes: [...s.saisonStats.notes] };
  const enPret = !!s.pret;
  const playerTop14 = enPret ? null : s.player;
  const forces = Object.fromEntries(TOP14.clubs.map(c => [c.id, teamStrength(c, playerTop14)]));
  for (let j = from; j < to; j++) {
    for (const [h, a] of ligue.fixtures[j]) {
      const m = playDay(h, a, TOP14.clubs, forces, playerTop14, rng);
      const { perfJoueur, ...res } = m;
      ligue.results.push(res);
      if (playerTop14 && (h === s.player.clubId || a === s.player.clubId)) {
        if (perfJoueur) {
          st.matchs++;
          if (perfJoueur.statut === 'titulaire') st.titularisations++;
          st.minutes += perfJoueur.minutes; st.essais += perfJoueur.essais; st.points += perfJoueur.points;
          st.plaquages += perfJoueur.plaquages; st.notes.push(perfJoueur.note);
        }
        ligue.joueurMatchs.push({ journee: j + 1, home: h, away: a, score: `${res.scoreHome}-${res.scoreAway}`, perf: perfJoueur });
      }
    }
    ligue.journee = j + 1;
  }
  if (enPret && s.periode !== 'presaison' && s.periode !== 'ete') {
    // prêt en Pro D2 / Nationale : matchs résumés
    const ovr = overall(s.player.stats, s.player.positionId);
    const seuil = s.pret.division === 'Pro D2' ? 60 : 53;
    for (let i = 0; i < 9 && !s.player.blessure; i++) {
      st.matchs++;
      const tit = ovr + rng.int(-6, 6) >= seuil;
      if (tit) st.titularisations++;
      const min = tit ? rng.int(50, 80) : rng.int(0, 25);
      st.minutes += min;
      if (min) { const e = rng.chance(0.13) ? 1 : 0; st.essais += e; st.points += e * 5; st.notes.push(Math.max(0, Math.min(10, Math.round((5.5 + (ovr - seuil) / 6 + rng.next() * 2 - 1) * 10) / 10))); }
    }
  }
  s.ligue = ligue; s.saisonStats = st;
  s.evenementEnCours = drawEvent(s, s.periode, rng);
  return toId(s);
}

function finDeSaison(s, rng) {
  const table = standings(s.ligue.results);
  const forces = Object.fromEntries(TOP14.clubs.map(c => [c.id, teamStrength(c, s.pret ? null : s.player)]));
  const po = playoffs(table, rng, forces);
  const rang = table.findIndex(r => r.clubId === s.player.clubId) + 1;
  const resume = { ...seasonSummary(s), classementClub: rang, champion: clubById(po.champion).nom,
    finale: `${clubById(po.finale.home).nom} ${po.finale.scoreHome}-${po.finale.scoreAway} ${clubById(po.finale.away).nom}`,
    relegue: clubById(po.relegue).nom, championAvecLui: !s.pret && po.champion === s.player.clubId,
    niveau: s.pret ? s.pret.division : 'Top 14', tableau: table };
  const { tableau, ...histo } = resume;
  const progressed = progressSeason(s.player, { minutesJouees: s.saisonStats.minutes }, rng);
  const player = { ...progressed, age: progressed.age + 1, historique: [...progressed.historique, histo] };
  const out = { ...s, player, annee: s.annee + 1, periodeIndex: -1, periode: null, vusSaison: [], saisonStats: vide(),
    ligue: null, dernierResume: resume, evenementEnCours: null };
  if (s.pret || out.annee >= out.contratFin) {
    return { ...out, pret: null, phase: 'offres', offresContrat: contractOffers(out, rng) };
  }
  return { ...out, phase: 'bilan', phaseApresBilan: 'pro' };
}

export function choose(state, choixIndex) {
  if (!state.evenementEnCours) throw new Error('Aucun événement en cours');
  const ev = eventById(state.evenementEnCours);
  const s = applyChoice(state, ev, choixIndex);
  const prolongation = ev.choix[choixIndex].effets.prolongation;
  const contratFin = prolongation && s.contratFin ? s.contratFin + prolongation : s.contratFin;
  return { ...s, contratFin, evenementEnCours: null };
}

/** Accepte une offre (fin du centre ou fin de contrat). */
export function acceptOffer(state, i) {
  const o = state.offresContrat?.[i];
  if (!o) throw new Error(`Offre invalide : ${i}`);
  const base = { ...state, offresContrat: null, phase: 'pro', periodeIndex: -1, periode: null, saisonStats: vide(), ligue: null };
  if (o.type === 'liberation') return { ...base, phase: 'fin', journal: [...state.journal, "Le club ne te garde pas. Fin de l'aventure… pour l'instant."] };
  if (o.type === 'pret') return { ...base, pret: { division: o.division }, contratFin: state.annee + 1,
    journal: [...state.journal, `Prêt d'un an en ${o.division}.`] };
  return { ...base, pret: null, clubNom: clubById(o.clubId).nom, player: { ...state.player, clubId: o.clubId }, contratFin: state.annee + o.duree,
    journal: [...state.journal, `Contrat de ${o.duree} an${o.duree > 1 ? 's' : ''} signé avec ${clubById(o.clubId).nom} (${o.role}).`] };
}

export function seasonSummary(state) {
  const st = state.saisonStats;
  const notes = st.notes ?? [];
  return { saison: saisonLabel(state.annee), age: state.player.age, club: clubById(state.player.clubId)?.nom ?? '—',
    matchs: st.matchs, titularisations: st.titularisations, minutes: st.minutes, essais: st.essais, points: st.points,
    noteMoyenne: notes.length ? Math.round(notes.reduce((a, b) => a + b, 0) / notes.length * 10) / 10 : null };
}

/** Offres de contrat pro (1 à 3 clubs du Top 14) selon la note du joueur. */
export function contractOffers(state, rng) {
  const p = state.player;
  const ovr = overall(p.stats, p.positionId);
  if (ovr < 52) return [{ type: 'pret', clubId: p.clubId, duree: 1, division: 'Nationale', role: 'titulaire' },
    { type: 'liberation', clubId: null, duree: 0 }];
  const maxPrestige = ovr >= 82 ? 5 : ovr >= 75 ? 4 : ovr >= 66 ? 3 : 2;
  const roleFor = (club) => {
    const rivals = club.joueurs.filter(j => j.positionId === p.positionId).map(j => j.note).sort((a, b) => b - a);
    const n = rivals.filter(x => x > ovr).length;
    return n === 0 ? 'titulaire' : n <= 2 ? 'rotation' : 'espoir';
  };
  const offers = [];
  const own = clubById(p.clubId);
  if (own && (ovr >= 58 || rng.chance(0.5))) offers.push({ type: 'pro', clubId: own.id, duree: rng.int(1, 3), role: roleFor(own) });
  const autres = TOP14.clubs.filter(c => c.id !== p.clubId && c.prestige <= maxPrestige);
  const n = Math.min(autres.length, ovr >= 70 ? 2 : 1);
  for (let i = 0; i < n; i++) {
    const c = autres.splice(rng.int(0, autres.length - 1), 1)[0];
    offers.push({ type: 'pro', clubId: c.id, duree: rng.int(1, 4), role: roleFor(c) });
  }
  if (ovr < 62) offers.push({ type: 'pret', clubId: p.clubId, duree: 1, division: 'Pro D2', role: 'rotation' });
  return offers;
}

export function retire(state) {
  return { ...state, phase: 'fin', evenementEnCours: null, journal: [...(state.journal ?? []), `Fin de carrière à ${state.player.age} ans.`] };
}
