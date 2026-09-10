'use strict';
const PREFIX='yea-arcade-3d-',CACHE=PREFIX+'v2-20260910';
const CORE=['./','./index.html','./v2.html','./redirect.js','./app3d.css','./app3d.js','./castle3d.js','./world3d.js','./engine.js','./manifest.webmanifest','./app-icon.svg','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png','../install.js','../install.css'];
const ENGINES=['https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/build/three.min.js','https://cdn.jsdelivr.net/gh/schteppe/cannon.js@v0.6.2/build/cannon.min.js'];
// Engines are linked from their official distribution; never republished with our source/APKs.
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...CORE,...ENGINES])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url),scope=new URL(self.registration.scope);
  if(req.method!=='GET')return;
  if(ENGINES.includes(url.href)){event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(req)||fetch(req)));return;}
  if(url.origin!==scope.origin)return;
  const known=CORE.some(p=>new URL(p,scope).pathname===url.pathname);
  if(!known&&!url.pathname.startsWith(scope.pathname))return;
  event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(req,{ignoreSearch:true});
    if(req.mode==='navigate'){try{const response=await fetch(req);if(response.ok){cache.put(req,response.clone());return response;}return cached||response;}catch{return cached||cache.match('./v2.html');}}
    if(cached)return cached;
    try{const response=await fetch(req);if(response.ok)cache.put(req,response.clone());return response;}catch{return new Response('Bağlantı yok.',{status:503});}
  })());
});
