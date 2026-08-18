const CACHE = 'family-farm-shell-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
    if (response.ok) { const clone = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, clone)); }
    return response;
  }).catch(() => caches.match(event.request)));
});
