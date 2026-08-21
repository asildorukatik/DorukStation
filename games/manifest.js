window.DorukStationGameManifest=[{"id":"dorukcraft-dungeons","name":"DorukCraft Dungeons","title":"DorukCraft Dungeons 3D v0.4.7","file":"games/DorukCraft-Dungeons.html","payload":"games/payloads/dorukcraft-dungeons.js","icon":"games/DorukCraft-Dungeons.png","banners":["games/banners/dorukcraft-dungeons/1.png"],"size":1917969,"sha256":"825d5810cf09a68c8221c3077cd75e56ffde6eb996a8c962952747871b2d1b50"},{"id":"dorukcraft","name":"DorukCraft","title":"DorukCraft Mobile v0.17.6","file":"games/DorukCraft.html","payload":"games/payloads/dorukcraft.js","icon":"games/DorukCraft.png","banners":["games/banners/dorukcraft/1.png"],"size":35281903,"sha256":"95e1bec3b258d8bddcc946c9f92f0962ebd232d4dd7de8b28441718ae887bd84"},{"id":"flappy-bird","name":"Flappy Bird","title":"Flappy Bird","file":"games/Flappy-Bird.html","payload":"games/payloads/flappy-bird.js","icon":"games/Flappy-Bird.png","banners":["games/banners/flappy-bird/1.png"],"size":17837,"sha256":"61fc81bc6884af17e1a25cbb3092ca0a72bc5c6544db6f06c980adc01d460d4c"}];
window.DorukStationGamePayloads=window.DorukStationGamePayloads||{};

/* v0.39 mobile-safe layout patch loader. Loaded here so the existing index.html
   and the newer v0.39 app.js can remain untouched. */
(()=>{
  if(window.__dorukstationMobileSafe39Loader)return;
  window.__dorukstationMobileSafe39Loader=true;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='mobile-safe-v039.css';
  document.head.appendChild(link);
  const script=document.createElement('script');
  script.src='mobile-safe-v039.js';
  script.async=true;
  document.head.appendChild(script);
})();
