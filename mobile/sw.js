const CACHE_PREFIX = 'rpys-cep-shell-';
const CACHE = CACHE_PREFIX + 'v4';
const CORE = ['./', './index.html', './mobile.css', './mobile.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const response = (async () => {
    const cache = await caches.open(CACHE).catch(() => null);
    try {
      const live = await fetch(request);
      if (live.ok && live.type !== 'opaque') {
        if (cache) await cache.put(request, live.clone()).catch(() => {});
        return live;
      }
      return await cache?.match(request) || live;
    } catch (_) {
      const hit = await cache?.match(request);
      if (hit) return hit;
      if (request.mode === 'navigate') {
        const page = await cache?.match('./index.html');
        if (page) return page;
      }
      return new Response('Bağlantı yok. İnternete bağlanıp tekrar deneyin.', {
        status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}
      });
    }
  })();
  event.respondWith(response);
  event.waitUntil(response.then(() => {}));
});
