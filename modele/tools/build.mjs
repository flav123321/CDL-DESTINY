// Construit un jeu à partir du modèle.
// Usage : node tools/build.mjs jeux/<dossier-du-jeu>
// Sortie : jeux/<dossier>/dist/ (version web à publier) et app/src/gameHtml.ts (application React Native).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (f) => fs.readFileSync(path.join(root, f), "utf8");
const { validateContent } = createRequire(import.meta.url)(path.join(root, "web/content-core.js"));

const gameDir = path.resolve(root, process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(path.join(gameDir, "jeu.json"))) {
  console.error("Indique le dossier du jeu, par exemple : node tools/build.mjs jeux/rugby-destiny");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(path.join(gameDir, "jeu.json"), "utf8"));
if (!/^[a-z0-9-]{3,40}$/.test(cfg.id || "")) { console.error("jeu.json : id doit contenir 3 à 40 lettres minuscules, chiffres ou tirets."); process.exit(1); }
const contentText = fs.readFileSync(path.join(gameDir, "content.json"), "utf8");
const content = JSON.parse(contentText);
const v = validateContent(content);
if (!v.ok) { console.error("content.json invalide :\n- " + v.errors.join("\n- ")); process.exit(1); }

const col = { fond: "#0d1619", accent: "#f5a524", accentTexte: "#1b1204", ...(cfg.couleurs || {}) };
const hex = (k) => { if (!/^#[0-9a-fA-F]{6}$/.test(col[k])) { console.error(`jeu.json : couleurs.${k} doit être une couleur #RRGGBB.`); process.exit(1); } return col[k]; };
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const name = cfg.nom || content.labels?.game || cfg.id, short = cfg.nomCourt || name;

const faces = [["Big Shoulders Display", "big-shoulders-display", [800, 900]], ["Barlow", "barlow", [400, 500, 600, 700]], ["IBM Plex Mono", "ibm-plex-mono", [400, 500]]];
const fonts = faces.flatMap(([fam, file, ws]) => ws.map((w) => {
  const b = fs.readFileSync(path.join(root, `web/fonts/${file}-latin-${w}-normal.woff2`)).toString("base64");
  return `@font-face{font-family:"${fam}";font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b}) format("woff2")}`;
})).join("\n");
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
const template = rd("web/game.template.html");
const tokens = "--accent:#f5a524; --accent-ink:#1b1204;";
if (!template.includes(tokens) || !template.includes("--bg:#0d1619;")) { console.error("Le gabarit a changé : couleurs introuvables."); process.exit(1); }
const body = template
  .replace(tokens, `--accent:${hex("accent")}; --accent-ink:${hex("accentTexte")};`)
  .replace("--bg:#0d1619;", `--bg:${hex("fond")};`)
  .replace("/*__FONTS__*/", () => fonts)
  .replace("/*__CORE__*/", () => safe(rd("web/content-core.js")))
  .replace("/*__DEFAULT_CONTENT__*/null", () => safe(JSON.stringify(content)))
  .replace("/*__SYNC__*/", () => safe(rd("web/sync.js")).replace("__GAME_ID__", cfg.id).replace("__BUILD_ID__", new Date().toISOString().slice(0, 16).replace("T", " ")));

const head = (extra) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(name)}</title>
<meta name="theme-color" content="${col.fond}">
${extra}</head><body>
`;
const pwaHead = `<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${esc(short)}">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
`;
// Quand une nouvelle version du moteur prend le relais, la page se recharge une fois pour l'afficher.
const swReg = `<script>if("serviceWorker" in navigator){const had=!!navigator.serviceWorker.controller;let done=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!done){done=true;location.reload()}});addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}</script>\n`;

const dist = path.join(gameDir, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, "index.html"), head(pwaHead) + body + swReg + "</body></html>\n");
fs.writeFileSync(path.join(dist, "content.json"), contentText);
const icons = ["icon-192.png", "icon-512.png", "apple-touch-icon.png"];
for (const f of icons) {
  const own = path.join(gameDir, f);
  if (!fs.existsSync(own)) console.warn(`Attention : ${f} manque dans le dossier du jeu, l'icône par défaut est utilisée.`);
  fs.copyFileSync(fs.existsSync(own) ? own : path.join(root, "web/assets", f), path.join(dist, f));
}
fs.writeFileSync(path.join(dist, "manifest.webmanifest"), JSON.stringify({ name, short_name: short, description: cfg.description || "", lang: "fr", start_url: "./index.html", scope: "./", display: "standalone", orientation: "portrait", background_color: col.fond, theme_color: col.fond, icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" }, { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }] }, null, 1));
const appFiles = ["./", "index.html", "manifest.webmanifest", ...icons];
// Plusieurs jeux peuvent vivre sur le même site : chacun ne nettoie que ses propres caches.
fs.writeFileSync(path.join(dist, "sw.js"), `// Le code du jeu reste en cache pour le hors ligne. content.json passe par le réseau et est géré par le jeu.
const P=${JSON.stringify(cfg.id + "-moteur-")};const C=P+"${content.minEngine}-${Date.now()}";const F=${JSON.stringify(appFiles)};
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x.startsWith(P)).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).pathname.endsWith("content.json"))return;e.respondWith(caches.match(e.request,{ignoreSearch:true,cacheName:C}).then(r=>r||fetch(e.request)))});
`);
const appDir = path.join(root, "app/src");
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, "gameHtml.ts"), "// Fichier généré par tools/build.mjs. Ne pas modifier à la main.\n" +
  `export const GAME_ID = ${JSON.stringify(cfg.id)};\nexport const GAME_NAME = ${JSON.stringify(name)};\nexport const GAME_BG = ${JSON.stringify(col.fond)};\nexport const GAME_ACCENT = ${JSON.stringify(col.accent)};\n` +
  "export const GAME_HTML: string = " + JSON.stringify(head("") + body + "</body></html>\n") + ";\n");
console.log(`OK : ${name}, révision ${content.revision}, ${content.scenarios.length} scénarios -> ${path.relative(root, dist)}/`);
