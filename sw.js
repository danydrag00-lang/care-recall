/* CareRecall v17 — editorial theme and edited Kokoro narration. */
const CACHE='care-recall-v17';
const ASSETS=['./','./index.html','./practice.html','./listen.html','./library.html','./assets/style.css','./assets/editorial.css','./assets/data.js','./assets/answer-edits.js','./assets/edited-voice.js','./assets/app.js','./assets/saved-audio.js','./assets/favicon.svg','./manifest.webmanifest'];
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
  // Saved MP3s may use HTTP byte-range responses (206). Let the browser
  // stream and cache them normally, without filling the site's CacheStorage.
  if(url.pathname.includes('/audio/') || request.headers.has('range'))return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try {
      const response=await fetch(request);
      if(response.ok && response.status===200) {
        e.waitUntil(cache.put(request,response.clone()).catch(()=>{}));
      }
      return response;
    } catch(error) {
      const previous=await cache.match(request,{ignoreSearch:request.mode==='navigate'});
      if(previous)return previous;
      throw error;
    }
  })());
});
