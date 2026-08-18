const CACHE = 'family-farm-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(r => {
    const clone = r.clone();
    caches.open(CACHE).then(c => c.put(event.request, clone));
    return r;
  }).catch(() => caches.match(event.request)));
});
