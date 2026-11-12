// Usage : node tools/validate.mjs [jeux/<dossier>/content.json]  (sans argument : tous les jeux)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { validateContent } = createRequire(import.meta.url)("../web/content-core.js");
const files = process.argv[2] ? [process.argv[2]] : fs.readdirSync(path.join(root, "jeux")).map((d) => path.join(root, "jeux", d, "content.json")).filter((f) => fs.existsSync(f));
let bad = 0;
for (const f of files) {
  const r = validateContent(JSON.parse(fs.readFileSync(f, "utf8")));
  console.log(`${path.relative(root, path.resolve(f))} : ${r.ok ? "valide" : "invalide\n- " + r.errors.join("\n- ")}`);
  if (!r.ok) bad++;
}
process.exit(bad ? 1 : 0);
