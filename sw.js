const CACHE='strengthos-v3.1.2';
const SHELL=['./','./index.html','./manifest.json','./icon.svg'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

// Cache-first for the app shell: instant load, works with zero signal.
// A background fetch refreshes the cache so the next launch gets any update.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const network=fetch(e.request).then(res=>{
        if(res&&res.ok&&res.type==='basic'){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>cached||caches.match('./index.html'));
      return cached||network;
    })
  );
});
