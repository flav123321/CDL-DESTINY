// CDL Manager : moteur (données, saison, simulation des matchs). Aucun accès au DOM ici.
// Fonctionne dans le navigateur (window.ENGINE) et dans Node (module.exports) pour les tests.
(function (root) {
"use strict";

const R = Math.random;
const rnd = (a, b) => a + R() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(R() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sig = x => 1 / (1 + Math.exp(-x));
const round1 = v => Math.round(v * 10) / 10;
const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
function wpick(items, w) { let s = 0; for (const x of items) s += Math.max(0.0001, w(x)); let r = R() * s; for (const x of items) { r -= Math.max(0.0001, w(x)); if (r <= 0) return x; } return items[items.length - 1]; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const WEEKS_PER_SEASON = 26;
const ROLES = ["SMG", "AR", "Flex"];
const ROLE_W = {
  SMG: { aim: .35, move: .35, sense: .2, mental: .1 },
  AR: { aim: .3, move: .15, sense: .35, mental: .2 },
  Flex: { aim: .27, move: .25, sense: .28, mental: .2 },
};
const MODES = { HP: "Hardpoint", SND: "Recherche et Destruction", OVL: "Overload", CTRL: "Contrôle" };
// Pool de maps CDL 2026 (Black Ops 7), tel qu'en fin de saison (Stage IV).
const MAPS = {
  HP: ["Colossus", "Den", "Scar", "Sake", "Gridlock", "Hacienda"],
  SND: ["Den", "Raid", "Gridlock", "Fringe", "Sake", "Hacienda"],
  OVL: ["Den", "Exposure", "Scar", "Gridlock"],
};
const SERIES_MODES = ["HP", "SND", "OVL", "HP", "SND", "OVL", "HP", "SND", "OVL"];
const TACTICS = {
  agressif: { label: "Agressif", att: 1.6, def: 0.2, rate: 1.25 },
  equilibre: { label: "Équilibré", att: 0.8, def: 0.8, rate: 1 },
  prudent: { label: "Prudent", att: -0.5, def: 2.0, rate: 0.78 },
};
const TRAINING = {
  aim: { label: "Aim et duels", desc: "Progression en aim et en mouvement. Fatigue élevée.", fat: 9, chem: 0, morale: -1 },
  strat: { label: "Stratégie et VOD", desc: "Progression en lecture de jeu. Un peu de cohésion.", fat: 5, chem: 2, morale: 0 },
  cohesion: { label: "Cohésion", desc: "Les joueurs jouent ensemble. Cohésion et moral en hausse.", fat: 4, chem: 5, morale: 3 },
  repos: { label: "Repos", desc: "Récupération complète. Forme en hausse, aucune progression.", fat: -14, chem: 0, morale: 4 },
};
const NAT_POOL = ["US", "US", "US", "US", "US", "US", "CA", "CA", "GB", "GB", "FR", "AU", "BE", "ES", "DE", "NL", "MX"];

let DATA = null;
let uid = 0;
const newId = p => p + Date.now().toString(36).slice(-4) + (uid++).toString(36) + ri(0, 999);

/* ---------- Joueurs ---------- */
function ovr(p, role) {
  const w = ROLE_W[role || p.role];
  return w.aim * p.aim + w.move * p.move + w.sense * p.sense + w.mental * p.mental;
}
function pOvr(p) { return Math.round(ovr(p)); }
function makeAttrs(rating, role) {
  // Des attributs autour de la note, avec un profil qui colle au rôle.
  const b = { SMG: { aim: 1, move: 2.5, sense: -1.5, mental: -1 }, AR: { aim: .5, move: -2.5, sense: 2, mental: 1 }, Flex: { aim: 0, move: 0, sense: 0, mental: 0 } }[role];
  const a = {};
  for (const k of ["aim", "move", "sense", "mental"]) a[k] = clamp(rating + b[k] + rnd(-3, 3), 50, 99);
  // Ajuste pour que la note du rôle égale la note donnée.
  const d = rating - ovr(a, role);
  for (const k in a) a[k] = clamp(round1(a[k] + d), 45, 99);
  return a;
}
function salaryDemand(p) {
  const o = pOvr(p);
  let s = 22000 * Math.pow(1.17, (o - 72));
  if (p.age <= 20 && p.pot - o > 5) s *= 1.15;
  if (p.age >= 28) s *= .9;
  return Math.round(clamp(s, 15000, 420000) / 1000) * 1000;
}
function marketValue(p) {
  const o = pOvr(p);
  let v = salaryDemand(p) * (1 + Math.max(0, p.pot - o) * .08) * (p.age <= 22 ? 1.4 : p.age >= 27 ? .7 : 1);
  return Math.round(v * 1.4 / 5000) * 5000;
}
function fakeName() {
  const n = DATA.names;
  const r = R();
  if (r < .45) return pick(n.gamertagWords);
  if (r < .8) return pick(n.prefixes) + pick(n.suffixes);
  return pick(n.gamertagWords) + (R() < .5 ? "" : pick(["x", "z", "o", "y"]));
}
function uniqueName(S) {
  const used = new Set(Object.values(S.players).map(p => p.name.toLowerCase()));
  for (let i = 0; i < 40; i++) { const n = fakeName(); if (!used.has(n.toLowerCase())) return n; }
  return fakeName() + ri(2, 99);
}
function createPlayer(S, o) {
  const role = o.role || pick(ROLES);
  const rating = o.rating;
  const age = o.age || ri(18, 27);
  const p = {
    id: newId("p"), name: o.name, nat: o.nat || pick(NAT_POOL), age, role,
    ...makeAttrs(rating, role),
    pot: 0, form: ri(-2, 3), morale: ri(55, 75), fatigue: ri(0, 15),
    salary: 0, years: 0, teamId: o.teamId || null, real: !!o.real,
    ss: { k: 0, d: 0, maps: 0, mvp: 0 }, car: { k: 0, d: 0, maps: 0, titles: 0 }, joined: 0,
  };
  const r = pOvr(p);
  const youth = clamp(25 - age, 0, 8);
  p.pot = clamp(Math.round(r + youth * rnd(.6, 1.5) + rnd(0, 3)), r, 99);
  p.salary = salaryDemand(p);
  p.years = ri(1, 3);
  S.players[p.id] = p;
  return p;
}

/* ---------- Monde ---------- */
function newGame(data, opts) {
  DATA = data;
  const S = {
    v: 1, season: 2027, step: 0, week: 0, manager: opts.managerName || "Manager",
    userTeam: null, teams: {}, players: {}, order: [], chOrder: [],
    standings: {}, history: [], news: [], inbox: [], results: [], bracket: null,
    training: "strat", tactic: "equilibre", finances: null, board: 60, objective: null,
    seasonLog: [], phase: "season", over: false, titles: [],
  };
  // Équipes CDL réelles
  for (const t of data.teams.cdl) {
    const team = { id: t.id, name: t.name, tag: t.tag, color: t.color, prestige: t.prestige, div: "CDL", roster: [], chem: ri(55, 72), cash: 0 };
    S.teams[t.id] = team; S.order.push(t.id);
    const roles = shuffle(["SMG", "SMG", "AR", "Flex"]);
    t.players.forEach((pl, i) => {
      const p = createPlayer(S, { name: pl.name, nat: pl.nat, rating: pl.rating, role: roles[i % 4], teamId: t.id, real: true, age: ri(19, 27) });
      team.roster.push(p.id);
    });
  }
  // Équipes Challengers : joueurs générés
  for (const t of data.teams.challengers) {
    const team = { id: t.id, name: t.name, tag: t.tag, color: t.color, prestige: t.prestige, div: "CH", roster: [], chem: ri(45, 65), cash: 0 };
    S.teams[t.id] = team; S.chOrder.push(t.id);
    const roles = shuffle(["SMG", "SMG", "AR", "Flex"]);
    for (let i = 0; i < 4; i++) {
      const p = createPlayer(S, { name: uniqueName(S), rating: ri(70, 80), role: roles[i], teamId: t.id, age: ri(17, 22) });
      team.roster.push(p.id);
    }
  }
  // Agents libres
  for (const fa of data.teams.freeAgents) createPlayer(S, { name: fa.name, nat: fa.nat, rating: fa.rating, real: true, age: ri(22, 28) });
  for (let i = 0; i < 14; i++) createPlayer(S, { name: uniqueName(S), rating: ri(68, 81), age: ri(18, 27) });
  for (const p of Object.values(S.players)) if (!p.teamId) { p.years = 0; p.salary = salaryDemand(p); }
  for (const id of S.order) if (S.teams[id].roster.length < 4) aiRefill(S, id, true);

  const ut = S.teams[opts.teamId];
  if (opts.rename && opts.rename.name) { ut.name = opts.rename.name; ut.tag = (opts.rename.tag || ut.tag).toUpperCase().slice(0, 4); if (opts.rename.color) ut.color = opts.rename.color; }
  S.userTeam = ut.id;
  const rank = S.order.slice().sort((a, b) => S.teams[b].prestige - S.teams[a].prestige).indexOf(ut.id);
  S.finances = { cash: Math.round((1250000 - rank * 60000) / 1000) * 1000, sponsor: null, log: [] };
  for (const id of S.order) S.teams[id].cash = 900000;
  startSeason(S, true);
  return S;
}

function setData(d) { DATA = d; }

/* ---------- Calendrier ---------- */
function roundRobin(ids) {
  const a = ids.slice(); const n = a.length; const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) pairs.push([a[i], a[n - 1 - i]]);
    rounds.push(pairs);
    a.splice(1, 0, a.pop());
  }
  return rounds;
}
function buildSchedule(S) {
  const steps = [];
  const rr = roundRobin(shuffle(S.order.slice()));
  for (let m = 0; m < 4; m++) {
    for (let r = 0; r < 5; r++) steps.push({ type: "qual", major: m, round: r, pairs: rr[(m * 5 + r) % rr.length].map(x => R() < .5 ? x : [x[1], x[0]]) });
    steps.push({ type: "major", major: m });
  }
  steps.push({ type: "champs" });
  return steps;
}
function objectiveFor(S) {
  const rank = S.order.slice().sort((a, b) => S.teams[b].prestige - S.teams[a].prestige).indexOf(S.userTeam);
  if (rank < 3) return { kind: "top", target: 3, text: "Finir dans le top 3 du classement CDL et gagner au moins un Major." , needMajor: true };
  if (rank < 7) return { kind: "top", target: 6, text: "Finir dans le top 6 du classement CDL et jouer les Champs." };
  return { kind: "top", target: 8, text: "Se qualifier pour les Champs (top 8 du classement CDL)." };
}
function startSeason(S, first) {
  S.phase = "season"; S.step = 0; S.bracket = null;
  S.schedule = buildSchedule(S);
  S.points = {}; S.qual = {}; S.majors = [];
  for (const id of S.order) S.points[id] = 0;
  resetQual(S);
  for (const p of Object.values(S.players)) p.ss = { k: 0, d: 0, maps: 0, mvp: 0 };
  S.objective = objectiveFor(S);
  S.majorWins = 0;
  S.results = [];
  addNews(S, `Saison ${S.season} : ${S.objective.text}`, "board");
  pushSponsorChoice(S);
  if (first) pushWelcome(S);
}
function resetQual(S) { S.qual = {}; for (const id of S.order) S.qual[id] = { w: 0, l: 0, md: 0 }; }

/* ---------- Force d'équipe ---------- */
function effRating(p) {
  return ovr(p) + p.form * .55 + (p.morale - 55) * .045 - Math.max(0, p.fatigue - 45) * .09;
}
function starters(S, tid) { return S.teams[tid].roster.slice(0, 4).map(id => S.players[id]).filter(Boolean); }
function teamRating(S, tid) {
  const ps = starters(S, tid);
  if (ps.length < 4) return 60;
  let r = ps.reduce((s, p) => s + effRating(p), 0) / ps.length;
  const t = S.teams[tid];
  r += (t.chem - 55) * .055;
  const smg = ps.filter(p => p.role === "SMG").length, ar = ps.filter(p => p.role === "AR").length;
  if (ar === 0) r -= 1.6; if (ar > 2) r -= 1; if (smg === 0) r -= 1.2; if (smg > 2) r -= 1;
  return r;
}
function roleCheck(S, tid) {
  const ps = starters(S, tid);
  const smg = ps.filter(p => p.role === "SMG").length, ar = ps.filter(p => p.role === "AR").length;
  const w = [];
  if (ps.length < 4) w.push("Il te faut 4 titulaires.");
  if (ar === 0) w.push("Aucun AR titulaire : -1,6 de force d'équipe.");
  if (ar > 2) w.push("Trop d'AR titulaires.");
  if (smg === 0) w.push("Aucun SMG titulaire.");
  if (smg > 2) w.push("Trop de SMG titulaires.");
  return w;
}

/* ---------- Simulation d'une map (pas à pas, partagée par le direct et l'instantané) ---------- */
function aiTactic(S, tid) { return wpick(Object.keys(TACTICS), k => k === "equilibre" ? 3 : 1.4); }
function createMapSim(S, mode, mapName, ids, tactics) {
  const side = i => {
    const ps = starters(S, ids[i]);
    return {
      id: ids[i], tag: S.teams[ids[i]].tag, rating: teamRating(S, ids[i]) + gauss() * 3.2, tac: tactics[i],
      players: ps.map(p => ({ id: p.id, name: p.name, role: p.role, r: effRating(p), dead: 0, k: 0, d: 0, alive: true })),
      timeouts: 0,
    };
  };
  const sim = {
    mode, map: mapName, sides: [side(0), side(1)], t: 0, done: false, winner: -1,
    score: [0, 0], mom: [0, 0], events: [], seq: 0,
  };
  if (mode === "HP") Object.assign(sim, { hill: 0, hillT: 0, holder: -1, rot: 6, limit: 900 });
  if (mode === "SND") Object.assign(sim, { round: 0, att: R() < .5 ? 0 : 1, rt: 0, planted: false, plantT: 0, site: "A", first: ri(14, 30), target: 6 });
  if (mode === "OVL") Object.assign(sim, { x: 50, holder: -1, pause: 6, target: 8, limit: 600 });
  if (mode === "SND") resetRound(sim);
  return sim;
}
function ev(sim, type, text, extra) { sim.events.push(Object.assign({ n: sim.seq++, t: sim.t, type, text }, extra || {})); }
function aliveOf(s) { return s.players.filter(p => p.alive); }
function setTactic(sim, i, tac) { sim.sides[i].tac = tac; }
function timeout(sim, i) {
  const s = sim.sides[i]; if (s.timeouts >= 2) return false;
  s.timeouts++; sim.mom[i] = .8; sim.mom[1 - i] = 0;
  ev(sim, "info", `Temps mort ${s.timeouts}/2 pour ${s.tag}.`, { side: i });
  return true;
}
function killerWeight(sim, p) {
  const m = sim.mode;
  let mul = p.role === "SMG" ? (m === "SND" ? 1 : 1.22) : p.role === "AR" ? (m === "SND" ? 1.18 : 1.02) : 1.08;
  return Math.pow(Math.max(1, p.r - 62), 2) * mul;
}
function fight(sim, defSide) {
  // Un échange de tirs. defSide : l'équipe qui défend une position (ou -1).
  const A = sim.sides[0], B = sim.sides[1];
  const aA = aliveOf(A), aB = aliveOf(B);
  if (!aA.length || !aB.length) return -1;
  const mod = i => { const t = TACTICS[sim.sides[i].tac]; return defSide === i ? t.def : t.att; };
  let d = (A.rating - B.rating) + (sim.mom[0] - sim.mom[1]) + mod(0) - mod(1);
  if (sim.mode === "SND") d += (aA.length - aB.length) * 5;
  const pA = sig(d / 19);
  const w = R() < pA ? 0 : 1, l = 1 - w;
  const W = sim.sides[w], L = sim.sides[l];
  let n = 1 + (R() < .33 ? 1 : 0) + (R() < .12 ? 1 : 0);
  if (sim.sides[w].tac === "agressif" || sim.sides[l].tac === "agressif") n += R() < .2 ? 1 : 0;
  const killer = wpick(aliveOf(W), p => killerWeight(sim, p));
  let kills = 0;
  for (let i = 0; i < n; i++) {
    const vs = aliveOf(L); if (!vs.length) break;
    const v = pick(vs);
    kill(sim, killer, v, w);
    kills++;
  }
  // Échange : le perdant tue parfois un adversaire.
  if (R() < .26 && aliveOf(L).length && aliveOf(W).length > (sim.mode === "SND" ? 0 : 0)) {
    const k2 = wpick(aliveOf(L), p => killerWeight(sim, p));
    const v2 = pick(aliveOf(W));
    if (v2) kill(sim, k2, v2, l);
  }
  sim.mom[w] = clamp(sim.mom[w] + .3, -1.5, 1.5); sim.mom[l] = clamp(sim.mom[l] - .2, -1.5, 1.5);
  if (kills >= 3) ev(sim, "big", `${killer.name} sort un ${kills === 3 ? "triple" : "quadruple"} kill !`, { side: w });
  else if (kills === 2) ev(sim, "kill2", `Double kill pour ${killer.name}.`, { side: w });
  return w;
}
function kill(sim, k, v, ws) {
  k.k++; v.d++; v.alive = false; v.dead = sim.t;
  ev(sim, "kill", `${k.name} élimine ${v.name}`, { side: ws, killer: k.id, victim: v.id });
}
function respawn(sim) {
  for (const s of sim.sides) for (const p of s.players) if (!p.alive && sim.t - p.dead >= 4) p.alive = true;
}
function resetRound(sim) {
  for (const s of sim.sides) for (const p of s.players) { p.alive = true; }
  sim.rt = 0;
  if (sim.mode === "SND") { sim.planted = false; sim.plantT = 0; sim.site = R() < .5 ? "A" : "B"; sim.first = ri(12, 30); }
}
function rate(sim, base, i) { return base * TACTICS[sim.sides[i].tac].rate; }
function stepMap(sim) {
  if (sim.done) return;
  sim.t++;
  for (const i of [0, 1]) sim.mom[i] *= .985;
  if (sim.mode === "HP") stepHP(sim);
  else if (sim.mode === "SND") stepSND(sim);
  else stepOVL(sim);
}
function finishMap(sim, w) {
  sim.done = true; sim.winner = w;
  ev(sim, "end", `${sim.sides[w].tag} remporte ${sim.map} (${sim.score[0]}-${sim.score[1]}).`, { side: w });
}
function stepHP(sim) {
  respawn(sim);
  sim.hillT++;
  if (sim.hillT >= 60) {
    sim.hillT = 0; sim.hill = (sim.hill + 1) % 5; sim.holder = -1; sim.rot = 7;
    ev(sim, "obj", `La zone tourne : colline ${sim.hill + 1}.`);
  }
  if (sim.rot > 0) { sim.rot--; return; }
  const r = sim.holder < 0 ? .32 : .115 * (TACTICS[sim.sides[1 - sim.holder].tac].rate);
  if (R() < r) {
    const w = fight(sim, sim.holder);
    if (w >= 0 && w !== sim.holder && aliveOf(sim.sides[w]).length) {
      if (sim.holder >= 0) ev(sim, "obj", `${sim.sides[w].tag} casse la colline !`, { side: w });
      sim.holder = w;
    }
  }
  if (sim.holder >= 0 && aliveOf(sim.sides[sim.holder]).length) {
    sim.score[sim.holder]++;
    if (sim.score[sim.holder] >= 250) return finishMap(sim, sim.holder);
  }
  if (sim.t >= sim.limit) finishMap(sim, sim.score[0] >= sim.score[1] ? 0 : 1);
}
function stepSND(sim) {
  sim.rt++;
  const att = sim.att, def = 1 - att;
  const aA = aliveOf(sim.sides[att]).length, aD = aliveOf(sim.sides[def]).length;
  if (!sim.planted && aA > 0 && sim.rt > 38 && R() < .07 + (aA - aD) * .02) {
    sim.planted = true; sim.plantT = sim.rt;
    ev(sim, "obj", `Bombe posée sur ${sim.site} par ${sim.sides[att].tag}.`, { side: att });
  }
  if (sim.rt >= sim.first && R() < rate(sim, .16, att)) fight(sim, sim.planted ? att : def);
  const nA = aliveOf(sim.sides[att]).length, nD = aliveOf(sim.sides[def]).length;
  let w = -1, why = "";
  if (nD === 0) { w = att; why = "élimine toute l'équipe adverse"; }
  else if (nA === 0) { w = def; why = sim.planted ? "désamorce la bombe" : "élimine toute l'équipe adverse"; }
  else if (sim.planted && sim.rt - sim.plantT >= 45) { w = att; why = "fait exploser la bombe"; }
  else if (!sim.planted && sim.rt >= 100) { w = def; why = "tient jusqu'à la fin du temps"; }
  if (w >= 0) {
    sim.score[w]++;
    ev(sim, "round", `Manche ${sim.round + 1} pour ${sim.sides[w].tag} : ${why}.`, { side: w });
    if (sim.score[w] >= sim.target) return finishMap(sim, w);
    sim.round++; sim.att = 1 - sim.att; resetRound(sim);
  }
}
function stepOVL(sim) {
  // Overload (simplifié) : un seul engin au centre. L'équipe qui le tient avance vers le but adverse.
  // x va de 0 (but de l'équipe 0, à gauche) à 100 (but de l'équipe 1, à droite).
  respawn(sim);
  if (sim.pause > 0) { sim.pause--; return; }
  if (sim.holder >= 0 && !aliveOf(sim.sides[sim.holder]).length) { sim.holder = -1; ev(sim, "obj", "L'engin tombe au sol."); }
  const def = sim.holder < 0 ? -1 : 1 - sim.holder;
  if (R() < (sim.holder < 0 ? .3 : rate(sim, .15, def))) {
    const w = fight(sim, def);
    if (w >= 0 && w !== sim.holder && aliveOf(sim.sides[w]).length) {
      ev(sim, "obj", sim.holder < 0 ? `${sim.sides[w].tag} récupère l'engin.` : `${sim.sides[w].tag} reprend l'engin !`, { side: w });
      sim.holder = w;
    }
  }
  if (sim.holder >= 0) {
    sim.x += sim.holder === 0 ? 2.4 : -2.4;
    if (sim.x >= 100 || sim.x <= 0) {
      const w = sim.holder;
      sim.score[w]++;
      ev(sim, "round", `BUT pour ${sim.sides[w].tag} ! ${sim.score[0]}-${sim.score[1]}.`, { side: w });
      if (sim.score[w] >= sim.target) return finishMap(sim, w);
      sim.x = 50; sim.holder = -1; sim.pause = 6;
      for (const sd of sim.sides) for (const p of sd.players) p.alive = true;
    }
  }
  if (sim.t >= sim.limit && sim.score[0] !== sim.score[1]) finishMap(sim, sim.score[0] > sim.score[1] ? 0 : 1);
  else if (sim.t >= sim.limit + 300) finishMap(sim, sim.x < 50 ? 1 : 0);
}
function runMap(sim) { let g = 0; while (!sim.done && g++ < 5000) stepMap(sim); if (!sim.done) finishMap(sim, sim.score[0] >= sim.score[1] ? 0 : 1); return sim; }

/* ---------- Séries ---------- */
function seriesPlan(firstTo) {
  const n = firstTo * 2 - 1; const used = {}; const out = [];
  for (let i = 0; i < n; i++) {
    const m = SERIES_MODES[i];
    const pool = MAPS[m].filter(x => !(used[m] || []).includes(x));
    const map = pick(pool.length ? pool : MAPS[m]);
    (used[m] = used[m] || []).push(map);
    out.push({ mode: m, map });
  }
  return out;
}
function newSeries(S, a, b, firstTo, label) {
  return { a, b, firstTo, label, plan: seriesPlan(firstTo), maps: [], wins: [0, 0], done: false, winner: null, stats: {} };
}
function recordMap(S, ser, sim) {
  ser.maps.push({ mode: sim.mode, map: sim.map, score: sim.score.slice(), winner: sim.winner });
  ser.wins[sim.winner]++;
  for (const s of sim.sides) for (const p of s.players) {
    const st = ser.stats[p.id] || (ser.stats[p.id] = { k: 0, d: 0, maps: 0 });
    st.k += p.k; st.d += p.d; st.maps++;
  }
  if (ser.wins[sim.winner] >= ser.firstTo) { ser.done = true; ser.winner = sim.winner === 0 ? ser.a : ser.b; }
}
function simSeries(S, a, b, firstTo, label, userTac) {
  const ser = newSeries(S, a, b, firstTo, label);
  while (!ser.done) {
    const m = ser.plan[ser.maps.length];
    const tac = [a === S.userTeam ? (userTac || S.tactic) : aiTactic(S, a), b === S.userTeam ? (userTac || S.tactic) : aiTactic(S, b)];
    recordMap(S, ser, runMap(createMapSim(S, m.mode, m.map, [a, b], tac)));
  }
  return ser;
}
function applySeries(S, ser) {
  // Statistiques, forme, moral et fatigue après une série.
  for (const pid in ser.stats) {
    const p = S.players[pid]; if (!p) continue;
    const st = ser.stats[pid];
    p.ss.k += st.k; p.ss.d += st.d; p.ss.maps += st.maps;
    p.car.k += st.k; p.car.d += st.d; p.car.maps += st.maps;
    const kd = st.k / Math.max(1, st.d);
    p.form = clamp(Math.round((p.form * .7 + (kd - 1) * 4) * 10) / 10, -6, 6);
  }
  const best = Object.entries(ser.stats).sort((x, y) => (y[1].k - y[1].d) - (x[1].k - x[1].d))[0];
  if (best && S.players[best[0]]) { S.players[best[0]].ss.mvp++; ser.mvp = best[0]; }
  for (const tid of [ser.a, ser.b]) {
    const won = ser.winner === tid;
    for (const p of starters(S, tid)) {
      p.morale = clamp(p.morale + (won ? 3 : -3), 5, 100);
      p.fatigue = clamp(p.fatigue + 5 + (S.tactic === "agressif" && tid === S.userTeam ? 2 : 0), 0, 100);
    }
    S.teams[tid].chem = clamp(S.teams[tid].chem + (won ? 1 : -.5), 20, 100);
  }
}
function userPair(S) {
  const st = S.schedule[S.step]; if (!st) return null;
  if (st.type === "qual") {
    const p = st.pairs.find(x => x.includes(S.userTeam));
    return p ? { a: p[0], b: p[1], firstTo: DATA.rules.format.seriesFirstTo, label: `Major ${st.major + 1} · Qualifs, journée ${st.round + 1}` } : null;
  }
  if (S.bracket && !S.bracket.done) {
    const B = S.bracket, round = B.rounds[B.stage];
    const p = round.find(x => x.includes(S.userTeam));
    if (!p) return null;
    return { a: p[0], b: p[1], firstTo: B.firstTo[B.stage], label: `${B.name} · ${B.stageNames[B.stage]}` };
  }
  return null;
}

/* ---------- Avancer d'une étape ---------- */
// userSeries : résultat d'une série jouée en direct (optionnel). Retourne un résumé.
function advance(S, userSeries) {
  if (S.over) return null;
  if (S.phase === "offseason") return null;
  const st = S.schedule[S.step];
  const out = { label: "", user: null, others: [] };
  if (st.type === "qual") {
    out.label = `Major ${st.major + 1} · Qualifs, journée ${st.round + 1}`;
    for (const [a, b] of st.pairs) {
      let ser;
      if ((a === S.userTeam || b === S.userTeam) && userSeries) ser = userSeries;
      else ser = simSeries(S, a, b, DATA.rules.format.seriesFirstTo, out.label);
      applySeries(S, ser);
      const w = ser.winner, l = w === a ? b : a;
      const md = Math.abs(ser.wins[0] - ser.wins[1]);
      S.qual[w].w++; S.qual[w].md += md; S.qual[l].l++; S.qual[l].md -= md;
      const res = { label: out.label, a, b, wins: ser.wins.slice(), winner: w, maps: ser.maps, mvp: ser.mvp, stats: ser.stats };
      S.results.push(res);
      if (a === S.userTeam || b === S.userTeam) out.user = res; else out.others.push(res);
    }
    weekly(S, out);
    S.step++;
    if (S.schedule[S.step] && S.schedule[S.step].type === "major") openBracket(S, S.schedule[S.step]);
    return out;
  }
  // Tournoi (Major ou Champs) : un tour à la fois
  const B = S.bracket;
  out.label = `${B.name} · ${B.stageNames[B.stage]}`;
  const round = B.rounds[B.stage];
  const winners = [];
  for (const [a, b] of round) {
    let ser;
    if ((a === S.userTeam || b === S.userTeam) && userSeries) ser = userSeries;
    else ser = simSeries(S, a, b, B.firstTo[B.stage], out.label);
    applySeries(S, ser);
    winners.push(ser.winner);
    const loser = ser.winner === a ? b : a;
    B.out.push({ id: loser, stage: B.stage });
    const res = { label: out.label, a, b, wins: ser.wins.slice(), winner: ser.winner, maps: ser.maps, mvp: ser.mvp, stats: ser.stats };
    B.results[B.stage].push(res);
    S.results.push(res);
    if (a === S.userTeam || b === S.userTeam) out.user = res; else out.others.push(res);
  }
  B.stage++;
  if (winners.length > 1) {
    const nx = []; for (let i = 0; i < winners.length; i += 2) nx.push([winners[i], winners[i + 1]]);
    B.rounds.push(nx);
  } else {
    B.champion = winners[0]; B.done = true;
    closeBracket(S, B, out);
    weekly(S, out);
    S.step++;
    if (S.step >= S.schedule.length) endSeason(S, out);
    else if (S.schedule[S.step].type === "champs") openBracket(S, S.schedule[S.step]);
    else resetQual(S);
  }
  return out;
}
function openBracket(S, st) {
  const isChamps = st.type === "champs";
  let seeds;
  if (isChamps) seeds = S.order.slice().sort((a, b) => S.points[b] - S.points[a] || teamRating(S, b) - teamRating(S, a)).slice(0, 8);
  else seeds = qualTable(S).slice(0, 8).map(r => r.id);
  const f = DATA.rules.format;
  const B = {
    name: isChamps ? "CDL Champs" : `Major ${st.major + 1}`, champs: isChamps, major: st.major,
    seeds, stage: 0, rounds: [[[seeds[0], seeds[7]], [seeds[3], seeds[4]], [seeds[1], seeds[6]], [seeds[2], seeds[5]]]],
    stageNames: ["Quarts de finale", "Demi-finales", "Finale"],
    firstTo: [f.seriesFirstTo, f.seriesFirstTo, isChamps ? f.champsFinalFirstTo : f.majorFinalFirstTo],
    results: [[], [], []], out: [], done: false, champion: null,
    elim: isChamps ? [] : qualTable(S).slice(8).map(r => r.id),
  };
  S.bracket = B;
  const inIt = seeds.includes(S.userTeam);
  addNews(S, inIt ? `${B.name} : ton équipe est qualifiée, tête de série n°${seeds.indexOf(S.userTeam) + 1}.` : `${B.name} : ton équipe n'est pas qualifiée pour le tournoi.`, inIt ? "good" : "bad");
}
function placements(B) {
  // Classement final 1..8 à partir des éliminations, départage par la tête de série.
  const seedIdx = id => B.seeds.indexOf(id);
  const by = s => B.out.filter(o => o.stage === s).map(o => o.id).sort((a, b) => seedIdx(a) - seedIdx(b));
  const final = B.out.find(o => o.stage === 2);
  return [B.champion, final && final.id, ...by(1), ...by(0)];
}
function closeBracket(S, B, out) {
  const place = placements(B);
  const rules = DATA.rules;
  const prizes = B.champs ? rules.prizes.champs : rules.prizes.major;
  const all = B.champs ? place : place.concat(B.elim);
  const summary = [];
  all.forEach((id, i) => {
    if (!B.champs) S.points[id] += rules.points.CDL[i] || 0;
    const prize = prizes[i] || 0;
    S.teams[id].cash += prize;
    if (id === S.userTeam) {
      if (prize) money(S, prize, `${B.name} : ${i + 1}e place`);
      if (i === 0) { S.titles.push(`${B.name} ${S.season}`); for (const p of starters(S, id)) p.car.titles++; }
      if (i === 0 && !B.champs) S.majorWins++;
      sponsorBonus(S, i, B.champs);
      out.userPlace = i + 1;
    }
    summary.push(id);
  });
  if (!B.champs) S.majors.push({ name: B.name, champion: B.champion, place: all });
  else S.champsResult = { champion: B.champion, place: all };
  const ut = S.userTeam, up = all.indexOf(ut);
  addNews(S, `${S.teams[B.champion].name} remporte ${B.name === "CDL Champs" ? "les CDL Champs" : "le " + B.name} !` + (up >= 0 ? ` Ton équipe termine ${up + 1}e.` : ""), B.champion === ut ? "good" : "info");
  for (const id of S.order) {
    const pl = all.indexOf(id);
    const t = S.teams[id];
    if (pl === 0) t.prestige = clamp(t.prestige + 2, 20, 100);
    if (pl >= 8) t.prestige = clamp(t.prestige - .5, 20, 100);
  }
}
function qualTable(S) {
  return S.order.map(id => ({ id, ...S.qual[id] }))
    .sort((a, b) => b.w - a.w || b.md - a.md || S.points[b.id] - S.points[a.id] || teamRating(S, b.id) - teamRating(S, a.id));
}
function pointsTable(S) {
  return S.order.map(id => ({ id, pts: S.points[id] })).sort((a, b) => b.pts - a.pts || teamRating(S, b.id) - teamRating(S, a.id));
}

/* ---------- Semaine : finances, entraînement, événements ---------- */
function money(S, amount, why) {
  S.finances.cash += amount;
  S.finances.log.unshift({ s: S.season, w: S.week, amount: Math.round(amount), why });
  if (S.finances.log.length > 80) S.finances.log.length = 80;
}
function payroll(S, tid) { return S.teams[tid].roster.reduce((s, id) => s + (S.players[id] ? S.players[id].salary : 0), 0); }
function weeklyIncome(S) {
  const t = S.teams[S.userTeam];
  const sp = S.finances.sponsor ? S.finances.sponsor.perWeek : 0;
  const merch = Math.round(t.prestige * 140 + S.majorWins * 1500);
  return { sponsor: sp, merch, salaries: Math.round(payroll(S, S.userTeam) / WEEKS_PER_SEASON), ops: 9000 };
}
function weekly(S, out) {
  S.week++;
  const inc = weeklyIncome(S);
  money(S, inc.sponsor, "Sponsor principal");
  money(S, inc.merch, "Boutique et billetterie");
  money(S, -inc.salaries, "Salaires des joueurs");
  money(S, -inc.ops, "Staff, bootcamp et déplacements");
  const tr = TRAINING[S.training];
  const ut = S.teams[S.userTeam];
  ut.chem = clamp(ut.chem + tr.chem, 20, 100);
  ut.roster.forEach((id, i) => {
    const p = S.players[id]; if (!p) return;
    const bench = i >= 4;
    p.fatigue = clamp(p.fatigue + (bench ? -8 : tr.fat - 7), 0, 100);
    p.morale = clamp(p.morale + tr.morale + (bench ? -2.5 : 0) + (p.morale < 50 ? .8 : -.6), 5, 100);
    if (S.training === "repos") p.form = clamp(p.form + .6, -6, 6);
    growPlayer(p, S.training, 1);
  });
  // Les équipes IA : récupération et progression moyenne
  for (const id of S.order.concat(S.chOrder)) {
    if (id === S.userTeam) continue;
    for (const pid of S.teams[id].roster) {
      const p = S.players[pid]; if (!p) continue;
      p.fatigue = clamp(p.fatigue - 3, 0, 100);
      p.morale = clamp(p.morale + (p.morale < 60 ? 1 : -.5), 5, 100);
      growPlayer(p, pick(["aim", "strat", "cohesion"]), .85);
    }
  }
  for (const p of Object.values(S.players)) if (!p.teamId) growPlayer(p, "strat", .5);
  maybeEvent(S);
  if (S.finances.cash < 0 && S.week % 3 === 0) addNews(S, `Trésorerie négative : ${fmtMoney(S.finances.cash)}. Le conseil s'inquiète.`, "bad"), S.board = clamp(S.board - 4, 0, 100);
}
function growPlayer(p, focus, scale) {
  const gap = p.pot - ovr(p);
  if (gap <= 0) return;
  const ageF = p.age <= 20 ? 1.3 : p.age <= 23 ? 1 : p.age <= 26 ? .55 : .2;
  const base = .055 * ageF * scale * Math.min(1, gap / 4);
  const boost = { aim: ["aim", "move"], strat: ["sense", "mental"], cohesion: ["mental"], repos: [] }[focus] || [];
  for (const k of ["aim", "move", "sense", "mental"]) {
    const g = base * (boost.includes(k) ? 2.1 : focus === "repos" ? 0 : .5) * rnd(.3, 1.7);
    p[k] = clamp(round1(p[k] + g), 40, 99);
  }
}

/* ---------- Événements (boîte de réception) ---------- */
function pushInbox(S, m) { m.id = newId("m"); m.s = S.season; m.w = S.week; S.inbox.unshift(m); if (S.inbox.length > 40) S.inbox.length = 40; return m; }
function addNews(S, text, kind) { S.news.unshift({ s: S.season, w: S.week, text, kind: kind || "info" }); if (S.news.length > 60) S.news.length = 60; }
function pushWelcome(S) {
  const t = S.teams[S.userTeam];
  pushInbox(S, { from: "Conseil d'administration", title: `Bienvenue chez ${t.name}`, text: `${S.manager}, le conseil te confie l'équipe pour la saison ${S.season}. Objectif : ${S.objective.text} Ta trésorerie de départ : ${fmtMoney(S.finances.cash)}. On jugera la saison sur le classement final.`, read: false });
}
function pushSponsorChoice(S) {
  const t = S.teams[S.userTeam];
  const base = 9000 + t.prestige * 230;
  const offers = [
    { name: pick(["Voltcore Energy", "Nordlys Drinks", "Fuse Energy"]), perWeek: Math.round(base * 1.15 / 100) * 100, bonusTitle: 0, bonusTop4: 0, desc: "Montant fixe élevé, aucune prime." },
    { name: pick(["Apex Peripherals", "Kestrel Gear", "Halcyon Audio"]), perWeek: Math.round(base * .8 / 100) * 100, bonusTitle: 160000, bonusTop4: 40000, desc: "Moins de fixe, grosses primes : 160 000 $ par titre, 40 000 $ par top 4." },
    { name: pick(["Orbit Bank", "Lumen Telecom", "Cardinal Motors"]), perWeek: Math.round(base * .95 / 100) * 100, bonusTitle: 70000, bonusTop4: 15000, desc: "Équilibré : un bon fixe et des primes moyennes." },
  ];
  pushInbox(S, {
    from: "Service partenariats", title: "Choisis ton sponsor principal", kind: "sponsor", read: false, need: true,
    text: `Trois marques veulent être sponsor principal de ${t.name} pour la saison ${S.season}. Le contrat dure toute la saison.`,
    options: offers.map((o, i) => ({ id: "s" + i, label: `${o.name} · ${fmtMoney(o.perWeek)}/semaine`, detail: o.desc, sponsor: o })),
  });
}
function sponsorBonus(S, place, champs) {
  const sp = S.finances.sponsor; if (!sp) return;
  const mul = champs ? 2 : 1;
  if (place === 0 && sp.bonusTitle) money(S, sp.bonusTitle * mul, `Prime sponsor : titre (${sp.name})`);
  else if (place < 4 && sp.bonusTop4) money(S, sp.bonusTop4 * mul, `Prime sponsor : top 4 (${sp.name})`);
}
const EVENTS = [
  { title: "Stream tard dans la nuit", text: "{p} streame jusqu'à 4 h du matin tous les soirs. Il arrive fatigué aux scrims.", opts: [
    { label: "Interdire les streams après minuit", fx: { pMorale: -10, pFatigue: -15 } },
    { label: "Laisser faire, ça rapporte de la visibilité", fx: { cash: 6000, pFatigue: 12 } },
    { label: "En parler calmement avec lui", fx: { pMorale: 2, pFatigue: -6 } } ] },
  { title: "Embrouille en scrim", text: "Grosse dispute entre {p} et {q} après une série de scrims perdue. L'ambiance est tendue.", opts: [
    { label: "Réunion d'équipe pour crever l'abcès", fx: { chem: 3, morale: -1 } },
    { label: "Soutenir {p}", fx: { pMorale: 8, qMorale: -12, chem: -4 } },
    { label: "Ignorer, ça passera", fx: { chem: -6 } } ] },
  { title: "Offre de bootcamp", text: "Une structure propose un bootcamp d'une semaine en Europe contre des équipes pros. Coût : 35 000 $.", opts: [
    { label: "Accepter le bootcamp", fx: { cash: -35000, chem: 6, grow: 1.5, fatigue: 8 } },
    { label: "Refuser, on reste à la maison", fx: {} } ] },
  { title: "Proposition de contenu", text: "Une marque veut une série de vidéos avec les joueurs. 20 000 $, mais deux jours sans entraînement.", opts: [
    { label: "Accepter", fx: { cash: 20000, chem: -2, form: -0.5 } },
    { label: "Refuser", fx: { morale: 1 } } ] },
  { title: "Petit bobo au poignet", text: "{p} se plaint de douleurs au poignet après une grosse semaine.", opts: [
    { label: "Repos complet cette semaine (il reste titulaire)", fx: { pFatigue: -25, pForm: -1.5 } },
    { label: "Kiné et on continue", fx: { cash: -4000, pFatigue: -8 } },
    { label: "Il joue comme d'habitude", fx: { pFatigue: 15, pMorale: -5 } } ] },
  { title: "Rumeur de départ", text: "Une rumeur dit que {p} discute avec une autre équipe. Les fans s'agitent.", opts: [
    { label: "Démentir publiquement et le rassurer", fx: { pMorale: 6 } },
    { label: "Lui proposer une prolongation", fx: { extend: true } },
    { label: "Ne rien dire", fx: { pMorale: -6, chem: -2 } } ] },
  { title: "Le coach veut un psy", text: "Le coach pense qu'un préparateur mental aiderait l'équipe dans les séries serrées. 25 000 $ pour la saison.", opts: [
    { label: "Engager un préparateur mental", fx: { cash: -25000, mental: 1.2, morale: 4 } },
    { label: "Pas maintenant", fx: {} } ] },
  { title: "Fête après la victoire", text: "Les joueurs veulent fêter le dernier résultat ensemble ce week-end.", opts: [
    { label: "Payer le resto à toute l'équipe", fx: { cash: -3000, morale: 6, chem: 3 } },
    { label: "Repos, on fêtera un titre", fx: { fatigue: -6 } } ] },
  { title: "Clip viral", text: "Un clip de {p} fait le tour des réseaux. Les ventes de maillots montent.", opts: [
    { label: "En profiter : vente flash de maillots", fx: { cash: 18000 } },
    { label: "Le féliciter devant l'équipe", fx: { pMorale: 10 } } ] },
  { title: "Nouveau matériel", text: "Un fournisseur propose de nouveaux écrans 360 Hz pour toute l'équipe. 12 000 $.", opts: [
    { label: "Acheter", fx: { cash: -12000, morale: 3, form: .6 } },
    { label: "Le matériel actuel suffit", fx: {} } ] },
  { title: "Joueur frustré", text: "{p} trouve qu'on ne lui donne pas assez de responsabilités en jeu.", opts: [
    { label: "Lui confier les appels en S&D", fx: { pMorale: 9, chem: -2 } },
    { label: "Lui expliquer son rôle", fx: { pMorale: -3, chem: 2 } } ] },
  { title: "Invitation à un tournoi caritatif", text: "Un tournoi caritatif invite l'équipe. Bonne image, mais un week-end de moins pour s'entraîner.", opts: [
    { label: "Participer", fx: { prestige: 1, fatigue: 4, cash: 4000 } },
    { label: "Décliner poliment", fx: {} } ] },
];
function maybeEvent(S) {
  if (R() > .45) return;
  const ut = S.teams[S.userTeam];
  const ps = ut.roster.map(id => S.players[id]).filter(Boolean);
  if (ps.length < 2) return;
  S.recentEv = S.recentEv || [];
  const pool = EVENTS.filter(x => !S.recentEv.includes(x.title));
  const e = pick(pool.length ? pool : EVENTS);
  S.recentEv.push(e.title); if (S.recentEv.length > 7) S.recentEv.shift();
  const p = pick(ps), q = pick(ps.filter(x => x !== p));
  const sub = s => s.replace(/\{p\}/g, p.name).replace(/\{q\}/g, q.name);
  pushInbox(S, {
    from: "Vie de l'équipe", title: sub(e.title), text: sub(e.text), kind: "event", read: false, need: true,
    options: e.opts.map((o, i) => ({ id: "o" + i, label: sub(o.label), fx: o.fx, p: p.id, q: q.id })),
  });
}
function answer(S, msgId, optId) {
  const m = S.inbox.find(x => x.id === msgId); if (!m || m.answered) return null;
  const o = m.options.find(x => x.id === optId); if (!o) return null;
  m.answered = optId; m.read = true;
  const ut = S.teams[S.userTeam];
  const ps = ut.roster.map(id => S.players[id]).filter(Boolean);
  let txt = "";
  if (o.sponsor) {
    S.finances.sponsor = o.sponsor;
    txt = `${o.sponsor.name} devient sponsor principal.`;
    addNews(S, txt, "good");
    return txt;
  }
  const fx = o.fx || {}; const P = S.players[o.p], Q = S.players[o.q];
  const parts = [];
  if (fx.cash) { money(S, fx.cash, m.title); parts.push(`${fx.cash > 0 ? "+" : ""}${fmtMoney(fx.cash)}`); }
  if (fx.chem) { ut.chem = clamp(ut.chem + fx.chem, 20, 100); parts.push(`cohésion ${fx.chem > 0 ? "+" : ""}${fx.chem}`); }
  if (fx.morale) { ps.forEach(p => p.morale = clamp(p.morale + fx.morale, 5, 100)); parts.push(`moral équipe ${fx.morale > 0 ? "+" : ""}${fx.morale}`); }
  if (fx.fatigue) { ps.forEach(p => p.fatigue = clamp(p.fatigue + fx.fatigue, 0, 100)); parts.push(`fatigue ${fx.fatigue > 0 ? "+" : ""}${fx.fatigue}`); }
  if (fx.form) { ps.forEach(p => p.form = clamp(p.form + fx.form, -6, 6)); parts.push(`forme ${fx.form > 0 ? "+" : ""}${fx.form}`); }
  if (fx.mental) { ps.forEach(p => p.mental = clamp(round1(p.mental + fx.mental), 40, 99)); parts.push(`mental +${fx.mental}`); }
  if (fx.grow) { ps.forEach(p => { for (let i = 0; i < 4; i++) growPlayer(p, "strat", fx.grow); }); parts.push("progression"); }
  if (fx.prestige) { ut.prestige = clamp(ut.prestige + fx.prestige, 20, 100); parts.push(`prestige +${fx.prestige}`); }
  if (P) {
    if (fx.pMorale) { P.morale = clamp(P.morale + fx.pMorale, 5, 100); parts.push(`moral ${P.name} ${fx.pMorale > 0 ? "+" : ""}${fx.pMorale}`); }
    if (fx.pFatigue) { P.fatigue = clamp(P.fatigue + fx.pFatigue, 0, 100); parts.push(`fatigue ${P.name} ${fx.pFatigue > 0 ? "+" : ""}${fx.pFatigue}`); }
    if (fx.pForm) { P.form = clamp(P.form + fx.pForm, -6, 6); parts.push(`forme ${P.name} ${fx.pForm}`); }
    if (fx.extend) { const r = negotiate(S, P.id, Math.round(P.salary * 1.15 / 1000) * 1000, 2); parts.push(r.ok ? `${P.name} prolonge de 2 saisons` : `${P.name} refuse : ${r.why}`); }
  }
  if (Q && fx.qMorale) { Q.morale = clamp(Q.morale + fx.qMorale, 5, 100); parts.push(`moral ${Q.name} ${fx.qMorale}`); }
  txt = parts.length ? parts.join(" · ") : "Rien ne change.";
  m.result = txt;
  return txt;
}
function pendingChoices(S) { return S.inbox.filter(m => m.need && !m.answered); }

/* ---------- Effectif et marché ---------- */
function setRole(S, pid, role) { const p = S.players[pid]; if (p && p.teamId === S.userTeam && ROLES.includes(role)) { p.role = role; return true; } return false; }
function moveInRoster(S, pid, toIndex) {
  const r = S.teams[S.userTeam].roster; const i = r.indexOf(pid); if (i < 0) return;
  r.splice(i, 1); r.splice(clamp(toIndex, 0, r.length), 0, pid);
}
function swapStarter(S, a, b) {
  const r = S.teams[S.userTeam].roster; const i = r.indexOf(a), j = r.indexOf(b);
  if (i < 0 || j < 0) return; [r[i], r[j]] = [r[j], r[i]];
}
function releaseCost(S, pid) { const p = S.players[pid]; return Math.round(p.salary * .5 * Math.max(1, p.years) / 1000) * 1000; }
function release(S, pid) {
  const p = S.players[pid]; const t = S.teams[S.userTeam];
  if (!p || p.teamId !== t.id) return { ok: false, why: "Ce joueur n'est pas chez toi." };
  const cost = S.phase === "offseason" && p.years <= 0 ? 0 : releaseCost(S, pid);
  if (cost) money(S, -cost, `Indemnité de départ : ${p.name}`);
  t.roster = t.roster.filter(x => x !== pid);
  p.teamId = null; p.years = 0; p.morale = 50;
  t.chem = clamp(t.chem - 3, 20, 100);
  addNews(S, `${p.name} quitte ${t.name}.`, "info");
  return { ok: true, cost };
}
function interest(S, p, salary, years, fee) {
  // Probabilité qu'un joueur accepte l'offre.
  const ut = S.teams[S.userTeam];
  const demand = salaryDemand(p);
  let x = (salary / demand - 1) * 5.5;
  x += (ut.prestige - 70) * .04;
  if (p.teamId) { const cur = S.teams[p.teamId]; x += (ut.prestige - cur.prestige) * .03; if (cur.div === "CH" && ut.div === "CDL") x += 1.4; }
  const r = ut.roster.map(id => S.players[id]).filter(Boolean);
  const wouldStart = r.length < 4 || r.slice(0, 4).some(q => pOvr(q) < pOvr(p));
  x += wouldStart ? .7 : -1.1;
  if (p.age >= 27) x += (years >= 2 ? .5 : -.3);
  if (p.age <= 21) x += (years <= 2 ? .3 : -.2);
  x += .3;
  return clamp(sig(x), .02, .97);
}
function askingFee(S, p) {
  if (!p.teamId) return 0;
  const t = S.teams[p.teamId];
  let f = marketValue(p) * (t.div === "CDL" ? 1.25 : .7);
  if (t.roster.length <= 4) f *= 1.35;
  return Math.round(f / 5000) * 5000;
}
function canSign(S) {
  const t = S.teams[S.userTeam];
  if (t.roster.length >= 6) return "Ton effectif est complet (6 joueurs maximum). Libère un joueur d'abord.";
  return null;
}
function makeOffer(S, pid, salary, years) {
  const p = S.players[pid];
  if (!p || p.teamId === S.userTeam) return { ok: false, why: "Joueur introuvable." };
  const block = canSign(S); if (block) return { ok: false, why: block };
  p.offers = p.offers || {};
  const k = `${S.season}-${S.week}`;
  if (p.offers[k] >= 2) return { ok: false, why: `${p.name} ne veut plus négocier cette semaine. Réessaie après le prochain match.` };
  const fee = askingFee(S, p);
  if (fee + salary * .25 > S.finances.cash && fee > 0) return { ok: false, why: `Pas assez d'argent : il faut ${fmtMoney(fee)} pour le transfert.` };
  const pr = interest(S, p, salary, years, fee);
  p.offers[k] = (p.offers[k] || 0) + 1;
  if (R() > pr) return { ok: false, why: `${p.name} refuse ton offre. Il demande environ ${fmtMoney(salaryDemand(p))} par an.`, prob: pr };
  const from = p.teamId ? S.teams[p.teamId] : null;
  if (fee) { money(S, -fee, `Transfert de ${p.name} (${from.name})`); from.cash += fee; }
  if (from) { from.roster = from.roster.filter(x => x !== pid); }
  p.teamId = S.userTeam; p.salary = salary; p.years = years; p.morale = clamp(p.morale + 10, 5, 100); p.joined = S.week;
  const t = S.teams[S.userTeam];
  t.roster.push(pid);
  t.chem = clamp(t.chem - 6, 20, 100);
  if (from) aiRefill(S, from.id);
  addNews(S, `${t.name} signe ${p.name}${from ? ` (venu de ${from.name}, ${fmtMoney(fee)})` : " (agent libre)"} : ${fmtMoney(salary)}/an, ${years} saison${years > 1 ? "s" : ""}.`, "good");
  return { ok: true, fee };
}
function negotiate(S, pid, salary, years) {
  // Prolongation d'un joueur de ton équipe.
  const p = S.players[pid];
  if (!p || p.teamId !== S.userTeam) return { ok: false, why: "Joueur introuvable." };
  const demand = salaryDemand(p);
  let x = (salary / demand - 1) * 6 + (p.morale - 55) * .05 + .4;
  const pr = clamp(sig(x), .03, .97);
  if (R() > pr) { p.morale = clamp(p.morale - 3, 5, 100); return { ok: false, why: `il veut environ ${fmtMoney(demand)} par an`, prob: pr }; }
  p.salary = salary; p.years = Math.max(p.years, 0) + years; p.expiring = false;
  p.morale = clamp(p.morale + 6, 5, 100);
  addNews(S, `${p.name} prolonge : ${fmtMoney(salary)}/an jusqu'en ${S.season + p.years - (S.phase === "offseason" ? 0 : 1)}.`, "good");
  return { ok: true };
}
function aiRefill(S, tid, quiet) {
  // Une équipe IA complète son effectif avec le meilleur agent libre abordable.
  const t = S.teams[tid];
  let guard = 0;
  while (t.roster.length < 4 && guard++ < 6) {
    const need = (() => { const ps = t.roster.map(id => S.players[id]).filter(Boolean); if (!ps.some(p => p.role === "AR")) return "AR"; if (ps.filter(p => p.role === "SMG").length < 2) return "SMG"; return null; })();
    let pool = Object.values(S.players).filter(p => !p.teamId && !p.retired);
    if (!pool.length) { createPlayer(S, { name: uniqueName(S), rating: ri(68, 76), age: ri(18, 22) }); continue; }
    const target = t.div === "CDL" ? 999 : 80;
    pool = pool.filter(p => pOvr(p) <= target);
    const best = pool.sort((a, b) => (ovr(b, need || b.role) + (b.role === need ? 2 : 0)) - (ovr(a, need || a.role) + (a.role === need ? 2 : 0)))[0];
    if (!best) break;
    if (need) best.role = need;
    best.teamId = tid; best.salary = salaryDemand(best); best.years = ri(1, 2);
    t.roster.push(best.id);
    if (t.div === "CDL" && !quiet) addNews(S, `${t.name} recrute ${best.name}.`, "info");
  }
}
function marketList(S, filter) {
  const all = Object.values(S.players).filter(p => !p.retired && p.teamId !== S.userTeam);
  let l;
  if (filter === "fa") l = all.filter(p => !p.teamId);
  else if (filter === "ch") l = all.filter(p => p.teamId && S.teams[p.teamId].div === "CH");
  else l = all.filter(p => p.teamId && S.teams[p.teamId].div === "CDL");
  return l.sort((a, b) => pOvr(b) - pOvr(a));
}

/* ---------- Fin de saison et intersaison ---------- */
function endSeason(S, out) {
  S.phase = "offseason";
  const table = pointsTable(S);
  const rank = table.findIndex(r => r.id === S.userTeam) + 1;
  const champ = S.champsResult;
  const champPlace = champ ? champ.place.indexOf(S.userTeam) + 1 : 0;
  const o = S.objective;
  let ok = rank <= o.target && (!o.needMajor || S.majorWins > 0);
  if (champ && champ.champion === S.userTeam) ok = true;
  S.board = clamp(S.board + (ok ? 18 : -22) + (champ && champ.champion === S.userTeam ? 15 : 0) + (S.finances.cash < 0 ? -10 : 0), 0, 100);
  const allP = Object.values(S.players).filter(p => p.ss.maps >= 10);
  const mvp = allP.sort((a, b) => (b.ss.k / Math.max(1, b.ss.d)) - (a.ss.k / Math.max(1, a.ss.d)))[0];
  const rec = {
    season: S.season, rank, objective: o.text, ok, champsPlace: champPlace || null, majorWins: S.majorWins,
    champion: champ ? champ.champion : null, cash: S.finances.cash, mvp: mvp ? { name: mvp.name, kd: round1(mvp.ss.k / Math.max(1, mvp.ss.d) * 100) / 100, team: mvp.teamId } : null,
    majors: S.majors.map(m => ({ name: m.name, champion: m.champion, place: m.place.indexOf(S.userTeam) + 1 })),
  };
  S.history.push(rec);
  if (ok) money(S, 150000, "Bonus du conseil : objectif atteint");
  // Contrats, âge, progression, retraites
  for (const p of Object.values(S.players)) {
    if (p.retired) continue;
    p.age++;
    const o0 = ovr(p);
    if (p.age >= 27) { const dec = (p.age - 26) * rnd(.25, .7); for (const k of ["aim", "move"]) p[k] = clamp(round1(p[k] - dec), 40, 99); p.pot = Math.min(p.pot, Math.round(ovr(p)) + 1); }
    else { for (let i = 0; i < 8; i++) growPlayer(p, pick(["aim", "strat", "cohesion"]), 1); }
    p.form = 0; p.fatigue = 0; p.morale = clamp(p.morale * .6 + 25, 5, 100);
    if (p.teamId) p.years--;
    if (p.teamId && p.years <= 0) p.expiring = true;
    if (p.age >= 29 && R() < (p.age - 27) * .12 && ovr(p) < 86) { p.retireNext = true; }
  }
  for (const id of S.order.concat(S.chOrder)) {
    if (id === S.userTeam) continue;
    const t = S.teams[id];
    for (const pid of t.roster.slice()) {
      const p = S.players[pid];
      if (p.retireNext) { retireP(S, p); continue; }
      if (p.expiring) {
        const keep = R() < (pOvr(p) > 84 ? .75 : .45);
        if (keep) { p.years = ri(1, 3); p.salary = salaryDemand(p); p.expiring = false; }
        else { t.roster = t.roster.filter(x => x !== pid); p.teamId = null; p.expiring = false; }
      }
    }
  }
  for (const p of Object.values(S.players)) if (!p.teamId && p.retireNext && !p.retired) retireP(S, p);
  // Jeunes talents Challengers
  for (let i = 0; i < 10; i++) createPlayer(S, { name: uniqueName(S), rating: ri(66, 77), age: ri(17, 19) });
  for (const p of Object.values(S.players)) if (!p.teamId && !p.retired) { p.years = 0; p.salary = salaryDemand(p); }
  const ut = S.teams[S.userTeam];
  const exp = ut.roster.map(id => S.players[id]).filter(p => p.expiring);
  const ret = ut.roster.map(id => S.players[id]).filter(p => p.retireNext);
  let txt = `Classement CDL final : ${rank}e. ${ok ? "Objectif atteint, le conseil est satisfait." : "Objectif manqué, le conseil est déçu."}`;
  if (champ) txt += ` Champs : ${champ.champion === S.userTeam ? "champion !" : champPlace ? champPlace + "e" : "non qualifié"}.`;
  if (exp.length) txt += ` Fin de contrat : ${exp.map(p => p.name).join(", ")}. Prolonge-les dans l'onglet Effectif avant de lancer la nouvelle saison, sinon ils partiront.`;
  if (ret.length) txt += ` ${ret.map(p => p.name).join(", ")} annonce${ret.length > 1 ? "nt" : ""} sa retraite à la fin de la saison.`;
  pushInbox(S, { from: "Conseil d'administration", title: `Bilan de la saison ${S.season}`, text: txt, read: false });
  if (S.board < 15) {
    S.over = true;
    pushInbox(S, { from: "Conseil d'administration", title: "Tu es licencié", text: "Les résultats et les finances ne suivent plus. Le conseil met fin à ton contrat.", read: false });
  }
  out.seasonEnd = rec;
}
function retireP(S, p) {
  if (p.teamId) { const t = S.teams[p.teamId]; t.roster = t.roster.filter(x => x !== p.id); }
  p.teamId = null; p.retired = true;
  if (p.real || p.car.titles) addNews(S, `${p.name} prend sa retraite.`, "info");
}
function nextSeason(S) {
  if (S.phase !== "offseason" || S.over) return { ok: false };
  const ut = S.teams[S.userTeam];
  for (const pid of ut.roster.slice()) {
    const p = S.players[pid];
    if (p.retireNext) retireP(S, p);
    else if (p.expiring) { ut.roster = ut.roster.filter(x => x !== pid); p.teamId = null; p.expiring = false; p.years = 0; addNews(S, `${p.name} quitte l'équipe en fin de contrat.`, "bad"); }
  }
  // Les équipes IA complètent leurs effectifs avec les agents libres, les meilleures choisissent en premier.
  const order = S.order.filter(id => id !== S.userTeam).sort((a, b) => S.teams[b].prestige - S.teams[a].prestige);
  for (const id of order) aiRefill(S, id);
  for (const id of S.chOrder) aiRefill(S, id);
  for (const p of Object.values(S.players)) { p.retireNext = false; p.offers = {}; }
  S.season++; S.week = 0;
  startSeason(S, false);
  return { ok: true };
}

/* ---------- Outils ---------- */
function fmtMoney(n) {
  const s = n < 0 ? "-" : ""; n = Math.abs(Math.round(n));
  return s + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
}
function flag(code) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

const API = {
  setData, newGame, advance, nextSeason, userPair, newSeries, recordMap, createMapSim, stepMap, runMap, setTactic, timeout, aiTactic,
  teamRating, effRating, starters, roleCheck, ovr, pOvr, salaryDemand, marketValue, askingFee, interest, makeOffer, negotiate, release, releaseCost,
  setRole, swapStarter, moveInRoster, marketList, qualTable, pointsTable, weeklyIncome, payroll, answer, pendingChoices, fmtMoney, flag,
  ROLES, MODES, TACTICS, TRAINING, WEEKS_PER_SEASON, aliveOf,
};
if (typeof module !== "undefined" && module.exports) module.exports = API; else root.ENGINE = API;
})(typeof window !== "undefined" ? window : globalThis);
