/* CareRecall v8 — network-first updates prevent old speech controls from reappearing. */
const CACHE='care-recall-v12';
const ASSETS=['./','./index.html','./practice.html','./listen.html','./library.html','./assets/style.css','./assets/data.js','./assets/app.js','./assets/saved-audio.js','./assets/favicon.svg','./manifest.webmanifest'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('care-recall-')&&k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const request=e.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try {
      const response=await fetch(request);
      if(response.ok)cache.put(request,response.clone());
      return response;
    } catch(error) {
      const previous=await cache.match(request,{ignoreSearch:request.mode==='navigate'});
      if(previous)return previous;
      throw error;
    }
  })());
});
