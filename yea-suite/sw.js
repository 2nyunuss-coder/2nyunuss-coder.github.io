const CACHE_PREFIX = 'yea-suite-';
const CACHE = CACHE_PREFIX + 'v16-r1';
const CORE = ['./', './index.html', './boot-guard.js', './v10.html', './v16.html','./v16-bootstrap.js','./v16-core.js','./v16.css','./v15.html','./v15-bootstrap.js','./v15-core.js','./v15.css','./v14.html','./v14-bootstrap.js','./v14-core.js','./v14.css','./v13.html','./v13-bootstrap.js','./v13-core.js','./v13-fix.js','./v13.css','./v12.html','./v12-bootstrap.js','./v12-core.js','./v12.css','./v11.html','./v11-bootstrap.js','./v11-core.js','./v11.css','./v10-bootstrap.js','./v10-core.js','./v10.css','./v09.html','./v09.js','./v09-decision.js','./v08-assistant.js','./v07.js','./v06.css','./v07.css','./v08.css','./v09.css','./manifest.webmanifest','./icon.svg'];

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
      if (request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html')) {
        const page = await cache?.match('./v16.html');
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
