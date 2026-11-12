// Construit CDL Manager.
// - dist/play.html : la page seule (pour un aperçu ou un Artifact)
// - ../cdl-manager/ : la version web installable, publiée avec le reste du site
// Utilise les équipes de CDL Destiny (source/content/content.json) et ses polices.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const rd = f => fs.readFileSync(path.join(repo, f), "utf8");

const content = JSON.parse(rd("source/content/content.json"));
const data = { teams: content.teams, names: content.names, rules: content.rules, revision: content.revision };

const faces = [["Big Shoulders Display", "big-shoulders-display", [800, 900]], ["Barlow", "barlow", [400, 500, 600, 700]], ["IBM Plex Mono", "ibm-plex-mono", [400, 500]]];
const fonts = faces.flatMap(([fam, file, ws]) => ws.map(w => {
  const b = fs.readFileSync(path.join(repo, `source/web/fonts/${file}-latin-${w}-normal.woff2`)).toString("base64");
  return `@font-face{font-family:"${fam}";font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b}) format("woff2")}`;
})).join("\n");
const safe = s => s.replace(/<\/script/gi, "<\\/script");

const page = rd("manager/game.html")
  .replace("/*__FONTS__*/", () => fonts)
  .replace("/*__DATA__*/", () => "window.CDLM_DATA=" + safe(JSON.stringify(data)) + ";")
  .replace("/*__ENGINE__*/", () => safe(rd("manager/engine.js")));

fs.mkdirSync(path.join(here, "dist"), { recursive: true });
fs.writeFileSync(path.join(here, "dist/play.html"), page);

// Version installable : en-tête complet, manifeste, cache hors ligne.
const out = path.join(repo, "cdl-manager");
fs.mkdirSync(out, { recursive: true });
const bodyPart = page.replace(/^<title>.*?<\/title>\n<meta name="claude:viewport-fit-sides"[^>]*>\n/, "");
const buildId = Date.now();
const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>CDL Manager</title>
<meta name="theme-color" content="#0c1417">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="CDL Manager">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
${bodyPart}
<script>if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});</script>
</body></html>
`;
fs.writeFileSync(path.join(out, "index.html"), html);
fs.writeFileSync(path.join(out, "manifest.webmanifest"), JSON.stringify({
  name: "CDL Manager", short_name: "CDL Manager", description: "Gestion d'une organisation CDL, projet de fan non officiel.",
  lang: "fr", start_url: "./index.html", scope: "./", display: "standalone", orientation: "any",
  background_color: "#0c1417", theme_color: "#0c1417",
  icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" }, { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }],
}, null, 1));
fs.writeFileSync(path.join(out, "sw.js"), `// Garde le jeu en cache pour jouer hors connexion.
const P="cdl-manager-";const C=P+"${buildId}";const F=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x.startsWith(P)).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request,{ignoreSearch:true,cacheName:C}).then(r=>r||fetch(e.request)))});
`);
for (const f of ["icon-192.png", "icon-512.png", "apple-touch-icon.png"]) fs.copyFileSync(path.join(repo, f), path.join(out, f));
console.log(`OK : manager/dist/play.html (${Math.round(page.length / 1024)} Ko) et cdl-manager/`);
