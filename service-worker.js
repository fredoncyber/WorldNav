const CACHE_NAME = 'worldnav-hybrid-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './offline-data.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (APP_SHELL.some(path => url.pathname.endsWith(path.replace('./','/')))) {
    event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
    return;
  }
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return resp;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResp => {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResp.clone()));
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
