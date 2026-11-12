// Fonctions pures : validation et fusion du contenu. Aucune dépendance au navigateur.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ContentCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const ENGINE = 1;
  const EFFECTS = ["aim", "move", "sense", "mental", "morale", "fame", "money", "form", "chem"];
  const STATS = ["aim", "move", "sense", "mental"];
  const POOLS = ["prep", "train", "off", "clutch"];
  const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
  const isNum = (x) => typeof x === "number" && Number.isFinite(x);
  const isStr = (x) => typeof x === "string" && x.length > 0;
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

  function eq(a, b) {
    if (a === b) return true;
    if (a === undefined || b === undefined) return false;
    return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
  }
  function sortKeys(x) {
    if (Array.isArray(x)) return x.map(sortKeys);
    if (!isObj(x)) return x;
    const out = {};
    Object.keys(x).sort().forEach((k) => (out[k] = sortKeys(x[k])));
    return out;
  }

  /** Vérifie qu'un contenu est jouable avant de le remplacer. */
  function validateContent(c, engine = ENGINE) {
    const e = [];
    if (!isObj(c)) return { ok: false, errors: ["Le fichier n'est pas un objet JSON."] };
    if (c.schema !== 1) e.push("schema doit valoir 1.");
    if (!Number.isInteger(c.revision) || c.revision < 1) e.push("revision doit être un entier positif.");
    if (!Number.isInteger(c.minEngine)) e.push("minEngine doit être un entier.");
    else if (c.minEngine > engine) e.push(`Ce contenu demande le moteur ${c.minEngine}, l'application a le moteur ${engine}.`);

    const r = c.rules;
    if (!isObj(r)) e.push("rules est absent.");
    else {
      ["CDL", "CH"].forEach((l) => {
        if (!Number.isInteger(r.qualifiers && r.qualifiers[l]) || r.qualifiers[l] < 2) e.push(`rules.qualifiers.${l} est invalide.`);
        if (!Array.isArray(r.points && r.points[l])) e.push(`rules.points.${l} est invalide.`);
      });
      if (!isObj(r.format)) e.push("rules.format est absent.");
      if (!isObj(r.retention)) e.push("rules.retention est absent.");
      if (!isObj(r.prizes)) e.push("rules.prizes est absent.");
      if (r.difficulty !== undefined && !isObj(r.difficulty)) e.push("rules.difficulty est invalide.");
      if (!isObj(r.simulation) || !(r.simulation.mapSpread > 0)) e.push("rules.simulation.mapSpread doit être positif.");
    }

    const t = c.teams;
    const teamIds = new Set();
    if (!isObj(t) || !Array.isArray(t.cdl) || !Array.isArray(t.challengers)) e.push("teams.cdl et teams.challengers sont requis.");
    else {
      if (t.cdl.length < 4) e.push("Il faut au moins 4 équipes CDL.");
      if (t.challengers.length < 4) e.push("Il faut au moins 4 équipes Challengers.");
      t.cdl.concat(t.challengers).forEach((x, i) => {
        if (!isObj(x) || !isStr(x.id) || !isStr(x.name)) return e.push(`Équipe ${i} invalide.`);
        if (teamIds.has(x.id)) e.push(`Équipe en double : ${x.id}.`);
        teamIds.add(x.id);
        if (!isNum(x.prestige)) e.push(`${x.id} : prestige manquant.`);
        if (x.tag !== undefined && (!isStr(x.tag) || x.tag.length > 3)) e.push(`${x.id} : écusson invalide.`);
        if (x.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(x.color)) e.push(`${x.id} : couleur invalide.`);
      });
      t.cdl.forEach((x) => {
        if (!isObj(x) || !Array.isArray(x.players)) return;
        x.players.forEach((p) => {
          if (!isStr(p.name) || !isNum(p.rating)) e.push(`${x.id} : joueur invalide.`);
          if (p.nat !== undefined && !/^[A-Z]{2}$/.test(p.nat)) e.push(`${x.id} : nationalité invalide pour ${p.name}.`);
        });
        if (x.players.length > 4) e.push(`${x.id} : plus de 4 joueurs.`);
      });
    }

    const L = c.labels;
    if (L !== undefined) {
      if (!isObj(L)) e.push("labels doit être un objet.");
      else {
        ["eventsTop", "eventsSecond"].forEach((k) => { if (L[k] !== undefined && (!Array.isArray(L[k]) || L[k].length !== 4 || !L[k].every(isStr))) e.push(`labels.${k} doit contenir 4 noms.`); });
        if (L.stats !== undefined && (!isObj(L.stats) || !Object.values(L.stats).every(isStr))) e.push("labels.stats est invalide.");
        if (L.startYear !== undefined && !Number.isInteger(L.startYear)) e.push("labels.startYear doit être une année.");
        Object.entries(L).forEach(([k, x]) => { if (!["eventsTop", "eventsSecond", "stats", "steps", "startYear"].includes(k) && typeof x !== "string") e.push(`labels.${k} doit être un texte.`); });
      }
    }
    if (!Array.isArray(c.nationalities) || !c.nationalities.length) e.push("nationalities est requis.");
    else c.nationalities.forEach((n) => { if (!(isStr(n) || (Array.isArray(n) && isStr(n[0]) && /^[A-Z]{2}$/.test(n[1] || "")))) e.push("nationalities : chaque entrée est un nom, ou [nom, code pays à 2 lettres]."); });
    if (!Array.isArray(c.starterTeams) || c.starterTeams.length < 1) e.push("starterTeams est requis.");
    else c.starterTeams.forEach((s) => { if (!teamIds.has(s.id)) e.push(`starterTeams : équipe inconnue ${s.id}.`); });

    if (!isObj(c.roles) || !Object.keys(c.roles).length) e.push("roles est requis.");
    else Object.entries(c.roles).forEach(([k, v]) => {
      if (!isObj(v.weights) || !STATS.every((s) => isNum(v.weights[s]))) e.push(`Rôle ${k} : pondérations invalides.`);
    });
    if (!isObj(c.origins) || !Object.keys(c.origins).length) e.push("origins est requis.");

    if (!Array.isArray(c.scenarios)) e.push("scenarios est requis.");
    else {
      const ids = new Set();
      const count = {};
      c.scenarios.forEach((s) => {
        if (!isObj(s) || !isStr(s.id)) return e.push("Scénario sans id.");
        if (ids.has(s.id)) e.push(`Scénario en double : ${s.id}.`);
        ids.add(s.id);
        if (!POOLS.includes(s.pool)) e.push(`${s.id} : pool inconnu.`);
        count[s.pool] = (count[s.pool] || 0) + 1;
        if (!isStr(s.title) || !isStr(s.text)) e.push(`${s.id} : titre ou texte manquant.`);
        if (!Array.isArray(s.options) || s.options.length < 2 || s.options.length > 4) return e.push(`${s.id} : il faut 2 à 4 options.`);
        s.options.forEach((o) => {
          if (!isStr(o.label)) e.push(`${s.id} : option sans libellé.`);
          if (s.pool === "clutch") {
            if (!STATS.includes(o.stat)) e.push(`${s.id} : stat invalide.`);
            if (!isNum(o.impact) || !isNum(o.difficulty) || !isStr(o.win) || !isStr(o.lose)) e.push(`${s.id} : option de clutch incomplète.`);
          } else if (!isObj(o.effects) || !Object.keys(o.effects).every((k) => EFFECTS.includes(k) && isNum(o.effects[k]))) {
            e.push(`${s.id} : effets invalides.`);
          }
        });
      });
      POOLS.forEach((p) => { if (!count[p]) e.push(`Aucun scénario dans le pool ${p}.`); });
    }
    return { ok: e.length === 0, errors: e };
  }

  const isIdArray = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => isObj(x) && x.id !== undefined);
  const toMap = (a) => { const m = new Map(); (a || []).forEach((x) => m.set(x.id, x)); return m; };

  /**
   * Fusion à trois versions. base = dernière version en ligne connue,
   * ours = copie modifiée sur le téléphone, theirs = nouvelle version en ligne.
   * Un conflit garde provisoirement la version en ligne et reste listé.
   */
  function merge3(base, ours, theirs) {
    const conflicts = [];
    const walk = (b, o, t, path) => {
      if (eq(o, t)) return clone(o);
      if (eq(b, o)) return clone(t);
      if (eq(b, t)) return clone(o);
      if (isObj(o) && isObj(t)) {
        const out = {};
        const bb = isObj(b) ? b : {};
        new Set([...Object.keys(t), ...Object.keys(o)]).forEach((k) => {
          const v = walk(bb[k], o[k], t[k], path.concat(k));
          if (v !== undefined) out[k] = v;
        });
        return out;
      }
      if ((isIdArray(o) || o === undefined || (Array.isArray(o) && !o.length)) && (isIdArray(t) || (Array.isArray(t) && !t.length)) && (isIdArray(o) || isIdArray(t))) {
        const bm = toMap(Array.isArray(b) ? b : []), om = toMap(o), tm = toMap(t);
        const order = [...tm.keys()];
        om.forEach((_, id) => { if (!tm.has(id)) order.push(id); });
        const out = [];
        order.forEach((id) => {
          const v = walk(bm.get(id), om.get(id), tm.get(id), path.concat({ id }));
          if (v !== undefined) out.push(v);
        });
        return out;
      }
      conflicts.push({ path, base: clone(b), ours: clone(o), theirs: clone(t) });
      return clone(t);
    };
    const merged = walk(base, ours, theirs, []);
    return { merged, conflicts };
  }

  /** Écrit une valeur à un chemin produit par merge3. undefined supprime l'élément. */
  function setPath(doc, path, value) {
    if (!path.length) return clone(value);
    const out = clone(doc);
    let cur = out;
    for (let i = 0; i < path.length; i++) {
      const seg = path[i], last = i === path.length - 1, byId = isObj(seg);
      if (byId) {
        const idx = cur.findIndex((x) => x.id === seg.id);
        if (last) {
          if (value === undefined) { if (idx >= 0) cur.splice(idx, 1); }
          else if (idx >= 0) cur[idx] = clone(value);
          else cur.push(clone(value));
          return out;
        }
        if (idx < 0) { cur.push({ id: seg.id }); cur = cur[cur.length - 1]; } else cur = cur[idx];
      } else {
        if (last) {
          if (value === undefined) delete cur[seg]; else cur[seg] = clone(value);
          return out;
        }
        if (cur[seg] === undefined) cur[seg] = isObj(path[i + 1]) ? [] : {};
        cur = cur[seg];
      }
    }
    return out;
  }

  /** Applique un morceau de JSON sur le contenu : fusion par clé, et par id dans les listes. */
  function applyPatch(doc, patch) {
    if (isIdArray(patch)) {
      const out = clone(Array.isArray(doc) ? doc : []);
      patch.forEach((p) => {
        const i = out.findIndex((x) => x.id === p.id);
        if (i >= 0) out[i] = applyPatch(out[i], p); else out.push(clone(p));
      });
      return out;
    }
    if (isObj(patch) && isObj(doc)) {
      const out = clone(doc);
      Object.keys(patch).forEach((k) => { out[k] = applyPatch(out[k], patch[k]); });
      return out;
    }
    return clone(patch);
  }

  function pathLabel(path) {
    return path.map((s) => (isObj(s) ? `[${s.id}]` : s)).join(".").replace(/\.\[/g, "[");
  }

  return { ENGINE, validateContent, merge3, setPath, applyPatch, pathLabel };
});
