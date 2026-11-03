import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
const { validateContent, merge3, setPath, applyPatch } = createRequire(import.meta.url)("../web/content-core.js");
const base = JSON.parse(fs.readFileSync(new URL("../content/content.json", import.meta.url), "utf8"));
const copy = (x) => JSON.parse(JSON.stringify(x));
const sid = base.scenarios[0].id;
const scen = (c, id = sid) => c.scenarios.find((s) => s.id === id);

test("le contenu livré est valide", () => assert.equal(validateContent(base).ok, true));
test("contenu cassé refusé", () => {
  const c = copy(base); c.scenarios = c.scenarios.filter((s) => s.pool !== "clutch");
  assert.equal(validateContent(c).ok, false);
  assert.equal(validateContent(null).ok, false);
  const d = copy(base); d.minEngine = 99; assert.equal(validateContent(d).ok, false);
  const e = copy(base); e.scenarios[1].id = e.scenarios[0].id; assert.equal(validateContent(e).ok, false);
});
test("en ligne seul : la nouvelle version passe", () => {
  const t = copy(base); t.revision = 2; scen(t).title = "Nouveau";
  const m = merge3(base, copy(base), t);
  assert.deepEqual(m.conflicts, []); assert.equal(scen(m.merged).title, "Nouveau"); assert.equal(m.merged.revision, 2);
});
test("modifications sur des champs différents : les deux sont gardées", () => {
  const o = copy(base); scen(o).text = "Texte local";
  const t = copy(base); t.revision = 2; scen(t).title = "Titre en ligne"; t.rules.qualifiers.CDL = 6;
  const m = merge3(base, o, t);
  assert.deepEqual(m.conflicts, []);
  assert.equal(scen(m.merged).text, "Texte local"); assert.equal(scen(m.merged).title, "Titre en ligne"); assert.equal(m.merged.rules.qualifiers.CDL, 6);
});
test("même champ : conflit, la version en ligne reste provisoirement", () => {
  const o = copy(base); scen(o).title = "Local";
  const t = copy(base); t.revision = 2; scen(t).title = "En ligne";
  const m = merge3(base, o, t);
  assert.equal(m.conflicts.length, 1); assert.equal(m.conflicts[0].ours, "Local"); assert.equal(scen(m.merged).title, "En ligne");
  const kept = setPath(m.merged, m.conflicts[0].path, m.conflicts[0].ours);
  assert.equal(scen(kept).title, "Local"); assert.equal(validateContent(kept).ok, true);
});
test("scénario ajouté des deux côtés, et suppression", () => {
  const add = (id) => ({ ...copy(base.scenarios[0]), id });
  const o = copy(base); o.scenarios.push(add("prep-local"));
  const t = copy(base); t.revision = 2; t.scenarios.push(add("prep-enligne")); t.scenarios = t.scenarios.filter((s) => s.id !== base.scenarios[1].id);
  const m = merge3(base, o, t);
  assert.deepEqual(m.conflicts, []);
  assert.ok(scen(m.merged, "prep-local")); assert.ok(scen(m.merged, "prep-enligne")); assert.equal(scen(m.merged, base.scenarios[1].id), undefined);
});
test("supprimé en ligne mais modifié ici : conflit", () => {
  const o = copy(base); scen(o, base.scenarios[1].id).title = "Local";
  const t = copy(base); t.revision = 2; t.scenarios = t.scenarios.filter((s) => s.id !== base.scenarios[1].id);
  const m = merge3(base, o, t);
  assert.equal(m.conflicts.length, 1); assert.equal(scen(m.merged, base.scenarios[1].id), undefined);
  assert.ok(scen(setPath(m.merged, m.conflicts[0].path, m.conflicts[0].ours), base.scenarios[1].id));
});
test("modification partielle par id", () => {
  const n = applyPatch(base, { rules: { qualifiers: { CDL: 6 } }, scenarios: [{ id: sid, title: "Patché" }] });
  assert.equal(n.rules.qualifiers.CDL, 6); assert.equal(n.rules.qualifiers.CH, 4);
  assert.equal(scen(n).title, "Patché"); assert.equal(scen(n).text, base.scenarios[0].text); assert.equal(validateContent(n).ok, true);
});
