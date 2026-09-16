const assert = require('assert');
const store = require('../v58-store.js');

assert.equal(store.DEFAULT_CATALOG_URL,
  'https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/catalog.json');
assert.equal(store.DEFAULT_README_URL,
  'https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/README.md');

const readme = `# DorukStation-Game-Library
[
Game: “DorukCraft”
Age: +10
Player: 1-4
Description: A voxel sandbox and adventure game.
Publisher: DorukGames
Genre: Sandbox, Adventure
Size: 35.3 MB
Supported Languages: English
VR: Not Supported
Logo: https://example.test/dc.png
GameFile:
]
[
Game: “DorukCraft Dungeons”
Age: +10
Player: 1-4
Description: A dungeon crawler
Publisher: DorukGames
Genre: Dungeon Crawler
Size: 130.0 MB
Supported Languages: English
VR: Not Supported
Logo: https://example.test/dcd.png
GameFile:
]`;

const parsed = store.parseReadmeCatalog(readme, store.DEFAULT_README_URL);
assert.deepEqual(parsed.games.map(g => g.id), ['dorukcraft', 'dorukcraft-dungeons']);
assert.deepEqual(parsed.games.map(g => g.name), ['DorukCraft', 'DorukCraft Dungeons']);
assert.equal(parsed.games[0].publisher, 'DorukGames');
assert.equal(parsed.games[0].players, '1-4');
assert.deepEqual(parsed.games[0].genres, ['Sandbox', 'Adventure']);
assert.deepEqual(parsed.games[0].languages, ['English']);
assert.equal(parsed.games[0].vr, 'Not Supported');
assert.equal(parsed.games[0].packageUrl, '');
assert(!parsed.games.some(g => g.id === 'sharps-playroom'));

const indexed = store.repositoryIndexToCatalog({format:1,items:[
  'Apps/DorukCraft/Outer/manifest.json',
  'Apps/DorukCraft-Dungeons/Outer/manifest.json'
]}, store.DEFAULT_CATALOG_URL);
assert.equal(indexed.games.length, 2);
assert.equal(indexed.games[0].manifestUrl,
  'https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/Apps/DorukCraft/Outer/manifest.json');

const normalizedManifest = store.normalizeRepositoryManifest({
  format:1,
  id:'dorukcraft',
  name:'DorukCraft',
  publisher:'DorukGames',
  version:'0.24.0',
  packageType:'hosted',
  descriptionFile:'description.txt',
  logo:'logo.png',
  banner:'banner.png',
  screenshots:['Screenshots/1.png'],
  payload:{fileType:'web-pwa',source:'../Inner.zip'},
  runtime:{handler:'dorukstation-web'},
  genres:['Sandbox','Adventure']
}, 'https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/Apps/DorukCraft/Outer/manifest.json');
assert.equal(normalizedManifest.packageUrl,
  'https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/Apps/DorukCraft/Inner.zip');
assert.equal(normalizedManifest.icon,
  'https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/Apps/DorukCraft/Outer/logo.png');
assert.equal(normalizedManifest.fileType, 'web-pwa');
assert.equal(normalizedManifest.runtimeHandler, 'dorukstation-web');
assert.equal(normalizedManifest.publisher, 'DorukGames');

assert.equal(store.isStoreManagedPreinstalled({id:'sharps-playroom'}), false);

const appSource = require('fs').readFileSync(require('path').join(__dirname, '..', 'app.js'),'utf8');
assert(!/modernOnly=sharps-playroom/.test(appSource));
assert(!/apps\.splice\([^\n]+v53SharpsPlayroomApp\(\)/.test(appSource));

console.log('v66 repo store sync tests: PASS');


(async()=>{
  const manifestUrl='https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/Apps/DorukCraft/Outer/manifest.json';
  const descriptionUrl='https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/Apps/DorukCraft/Outer/description.txt';
  const catalogFetch=async url=>{
    if(url===store.DEFAULT_CATALOG_URL)return {ok:true,json:async()=>({format:1,items:['Apps/DorukCraft/Outer/manifest.json']})};
    if(url===manifestUrl)return {ok:true,json:async()=>({format:1,id:'dorukcraft',name:'DorukCraft',publisher:'DorukGames',version:'1.2.3',packageType:'hosted',descriptionFile:'description.txt',payload:{fileType:'web-pwa',source:'../Inner.zip'},runtime:{handler:'dorukstation-web'}})};
    if(url===descriptionUrl)return {ok:true,text:async()=>('Live description from repo')};
    throw new Error('unexpected URL '+url);
  };
  const live=await store.loadRepositoryCatalog({fetchFn:catalogFetch});
  assert.equal(live.source,'catalog.json');
  assert.equal(live.catalog.games.length,1);
  assert.equal(live.catalog.games[0].name,'DorukCraft');
  assert.equal(live.catalog.games[0].description,'Live description from repo');
  assert.equal(live.catalog.games[0].packageUrl,'https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/Apps/DorukCraft/Inner.zip');

  const fallbackFetch=async url=>{
    if(url===store.DEFAULT_CATALOG_URL)return {ok:false,status:404};
    if(url===store.DEFAULT_README_URL)return {ok:true,text:async()=>readme};
    throw new Error('unexpected URL '+url);
  };
  const fallback=await store.loadRepositoryCatalog({fetchFn:fallbackFetch});
  assert.equal(fallback.source,'README.md');
  assert.deepEqual(fallback.catalog.games.map(g=>g.name),['DorukCraft','DorukCraft Dungeons']);
  assert(!fallback.catalog.games.some(g=>g.id==='sharps-playroom'));
  console.log('v66 repository loader async tests: PASS');
})().catch(err=>{console.error(err);process.exitCode=1});
