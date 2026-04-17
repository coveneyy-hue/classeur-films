const CACHE = 'classeur-films-v3';
const IMG_CACHE = 'classeur-films-tmdb-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Ne jamais cacher les appels API TMDb (toujours frais)
  if (url.includes('api.themoviedb.org')) return;

  // Images TMDb : cache-first, jamais expiré (affiches stables)
  if (url.includes('image.tmdb.org')) {
    e.respondWith(caches.open(IMG_CACHE).then(c =>
      c.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res.ok) c.put(e.request, res.clone());
        return res;
      }).catch(() => r))
    ));
    return;
  }

  // Fonts Google : cache-first (comportement existant)
  if (url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
    e.respondWith(caches.open(CACHE).then(c =>
      c.match(e.request).then(r => r || fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; }))
    ));
    return;
  }

  // App shell : network-first avec fallback cache (comportement existant)
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
