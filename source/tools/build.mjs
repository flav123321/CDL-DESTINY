// Construit la version web installable (dist-pwa) et le fichier du jeu pour React Native (app/src/gameHtml.ts).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (f) => fs.readFileSync(path.join(root, f), "utf8");
const { validateContent } = createRequire(import.meta.url)(path.join(root, "web/content-core.js"));

const contentText = rd("content/content.json");
const content = JSON.parse(contentText);
const v = validateContent(content);
if (!v.ok) { console.error("content.json invalide :\n- " + v.errors.join("\n- ")); process.exit(1); }

const faces = [["Big Shoulders Display", "big-shoulders-display", [800, 900]], ["Barlow", "barlow", [400, 500, 600, 700]], ["IBM Plex Mono", "ibm-plex-mono", [400, 500]]];
const fonts = faces.flatMap(([fam, file, ws]) => ws.map((w) => {
  const b = fs.readFileSync(path.join(root, `web/fonts/${file}-latin-${w}-normal.woff2`)).toString("base64");
  return `@font-face{font-family:"${fam}";font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b}) format("woff2")}`;
})).join("\n");
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
const body = rd("web/game.template.html")
  .replace("/*__FONTS__*/", () => fonts)
  .replace("/*__CORE__*/", () => safe(rd("web/content-core.js")))
  .replace("/*__DEFAULT_CONTENT__*/null", () => safe(JSON.stringify(content)))
  .replace("/*__SYNC__*/", () => safe(rd("web/sync.js")).replace("__BUILD_ID__", new Date().toISOString().slice(0, 16).replace("T", " ")));

const head = (extra) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>CDL Destiny</title>
<meta name="theme-color" content="#0d1619">
${extra}</head><body>
`;
const pwaHead = `<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="CDL Destiny">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
`;
// Quand une nouvelle version du moteur prend le relais, la page se recharge une fois pour l'afficher.
const swReg = `<script>if("serviceWorker" in navigator){const had=!!navigator.serviceWorker.controller;let done=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!done){done=true;location.reload()}});addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}</script>\n`;

const dist = path.join(root, "dist-pwa");
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, "index.html"), head(pwaHead) + body + swReg + "</body></html>\n");
fs.writeFileSync(path.join(dist, "content.json"), contentText);
for (const f of ["icon-192.png", "icon-512.png", "apple-touch-icon.png"]) fs.copyFileSync(path.join(root, "web/assets", f), path.join(dist, f));
fs.writeFileSync(path.join(dist, "manifest.webmanifest"), JSON.stringify({ name: "CDL Destiny", short_name: "CDL Destiny", description: "Jeu de carrière CDL, projet de fan non officiel.", lang: "fr", start_url: "./index.html", scope: "./", display: "standalone", orientation: "portrait", background_color: "#0d1619", theme_color: "#0d1619", icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" }, { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }] }, null, 1));
const appFiles = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
fs.writeFileSync(path.join(dist, "sw.js"), `// Le code du jeu reste en cache pour le hors ligne. content.json passe par le réseau et est géré par le jeu.
const C="cdl-destiny-engine-${content.minEngine}-${Date.now()}";const F=${JSON.stringify(appFiles)};
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).pathname.endsWith("content.json"))return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
`);
const appDir = path.join(root, "app/src");
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, "gameHtml.ts"), "// Fichier généré par tools/build.mjs. Ne pas modifier à la main.\nexport const GAME_HTML: string = " + JSON.stringify(head("") + body + "</body></html>\n") + ";\n");
console.log(`OK : révision ${content.revision}, ${content.scenarios.length} scénarios.`);
