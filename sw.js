const CACHE_NAME='foko-cache-v4';
const ASSETS=['./','./index.html','./app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME&&caches.delete(k))))); });
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(res=>res||fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request, copy)); return r;
  }).catch(()=>res)));
});
