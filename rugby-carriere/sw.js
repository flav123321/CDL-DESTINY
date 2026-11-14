// Service worker : tout le jeu en cache pour jouer hors connexion.
// À chaque mise à jour : changer la version dans package.json ET ici.
const CACHE = 'rugby-carriere-0.1.0';
const FILES = [
  './',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './index.html',
  './manifest.webmanifest',
  './src/data/events.js',
  './src/data/leagues/top14-notes.js',
  './src/data/leagues/top14-raw.js',
  './src/data/leagues/top14.js',
  './src/data/nationalities.js',
  './src/data/personalities.js',
  './src/data/positions.js',
  './src/engine/academy.js',
  './src/engine/career.js',
  './src/engine/crest.js',
  './src/engine/events.js',
  './src/engine/injuries.js',
  './src/engine/match.js',
  './src/engine/player.js',
  './src/engine/progression.js',
  './src/engine/rating.js',
  './src/engine/rng.js',
  './src/engine/save.js',
  './src/engine/season.js',
  './src/ui/app.js',
  './src/ui/common.js',
  './src/ui/screens/accueil.js',
  './src/ui/screens/centre.js',
  './src/ui/screens/creation.js',
  './src/ui/screens/resume.js',
  './src/ui/screens/saison.js',
  './styles.css',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  })));
});
