// Usage : node tools/validate.mjs [chemin/vers/content.json]
import fs from "node:fs";
import { createRequire } from "node:module";
const { validateContent } = createRequire(import.meta.url)("../web/content-core.js");
const f = process.argv[2] || new URL("../content/content.json", import.meta.url).pathname;
const r = validateContent(JSON.parse(fs.readFileSync(f, "utf8")));
console.log(r.ok ? "Contenu valide." : "Contenu invalide :\n- " + r.errors.join("\n- "));
process.exit(r.ok ? 0 : 1);
