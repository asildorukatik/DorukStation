'use strict';
importScripts('v57-store.js');
const DS=DorukStationV57Store;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(!event.request.url.includes('/__ds_game__/'))return;
  const parsed=DS.parseVirtualGamePath(new URL(event.request.url).pathname);if(!parsed)return;
  event.respondWith((async()=>{
    try{
      const file=await DS.readInstalledGameFile(parsed.gameId,parsed.path);
      const headers={'Content-Type':DS.mimeForPath(parsed.path),'Cache-Control':'no-store'};
      return new Response(file,{status:200,headers});
    }catch(err){return new Response(`DorukStation game file unavailable: ${err?.message||err}`,{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}})}
  })());
});
