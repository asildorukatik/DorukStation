'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DorukStationV58Store=api;
  if(typeof window!=='undefined'&&typeof document!=='undefined'){
    try{api.installBrowser()}catch(err){console.error('[DorukStation Store v0.58]',err)}
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DEFAULT_CATALOG_URL='https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/catalog.json';
  const INSTALL_STATES=new Set(['not-installed','queued','downloading','verifying','extracting','installed','failed','cancelled','update-available']);

  function slug(value){
    const out=String(value||'game').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    return out||'game';
  }
  function absoluteUrl(value,base){
    if(!value)return '';
    try{return new URL(String(value),base||undefined).href}catch{return String(value)}
  }
  function normalizeCatalog(raw,baseUrl){
    const source=raw&&typeof raw==='object'?raw:{};
    const games=Array.isArray(source.games)?source.games:[];
    return {
      schemaVersion:Number(source.schemaVersion)||1,
      updatedAt:source.updatedAt||'',
      games:games.map((g,i)=>{
        const id=slug(g?.id||g?.name||`game-${i+1}`);
        return {
          id,
          name:String(g?.name||g?.title||id),
          manifestUrl:absoluteUrl(g?.manifestUrl||g?.manifest||'',baseUrl),
          version:String(g?.version||'1.0.0'),
          description:String(g?.description||''),
          descriptionUrl:absoluteUrl(g?.descriptionUrl||'',baseUrl),
          age:String(g?.age||'Everyone'),
          genres:Array.isArray(g?.genres)?g.genres.map(String).filter(Boolean):[],
          icon:absoluteUrl(g?.icon||g?.logo||'',baseUrl),
          banner:absoluteUrl(g?.banner||'',baseUrl),
          screenshots:Array.isArray(g?.screenshots)?g.screenshots.map(x=>absoluteUrl(x,baseUrl)).filter(Boolean):[],
          packageUrl:absoluteUrl(g?.packageUrl||g?.package||'',baseUrl),
          packageSize:Number(g?.packageSize)||0,
          sha256:String(g?.sha256||'').trim().toLowerCase(),
          entry:String(g?.entry||'Game/index.html').replace(/\\/g,'/'),
          featured:!!g?.featured,
          tags:Array.isArray(g?.tags)?g.tags.map(String).filter(Boolean):[]
        };
      })
    };
  }
  async function hydrateCatalogManifests(catalog,fetchFn){
    const fetcher=fetchFn||((...args)=>fetch(...args));
    const source=catalog&&typeof catalog==='object'?catalog:{schemaVersion:2,games:[]};
    const games=[];
    for(const game of source.games||[]){
      if(!game.manifestUrl){games.push(game);continue}
      try{
        const res=await fetcher(game.manifestUrl,{cache:'no-store'});
        if(!res||res.ok===false)throw new Error(`HTTP ${res?.status||'error'}`);
        const raw=await res.json();
        const normalized=normalizeCatalog({schemaVersion:source.schemaVersion||2,games:[raw]},game.manifestUrl).games[0];
        const merged={...game,...normalized,manifestUrl:game.manifestUrl};
        if(game.featured)merged.featured=true;
        if(game.tags?.length)merged.tags=[...new Set([...(normalized.tags||[]),...game.tags])];
        games.push(merged);
      }catch(err){
        games.push({...game,manifestError:String(err?.message||err)});
      }
    }
    return {...source,games};
  }
  const CATEGORY_ALIASES={featured:['featured','popular'],adventure:['adventure'],racing:['racing','race'],horror:['horror'],strategy:['strategy','puzzle','strategy-puzzles'],building:['building','build','sandbox'],fight:['fight','fighting','combat']};
  function filterCatalogByCategory(catalog,filter){
    const all=[...(catalog?.games||[])],key=slug(filter||'featured');
    if(!filter||key==='featured'||key==='popular'){
      const featured=all.filter(g=>g.featured);return featured.length?featured:all;
    }
    const aliases=CATEGORY_ALIASES[key]||[key];
    return all.filter(game=>{
      const terms=[...(game.genres||[]),...(game.tags||[])].map(slug);
      return aliases.some(alias=>terms.some(term=>term===alias||term.includes(alias)||alias.includes(term)));
    });
  }
  function categoryLabel(filter){
    const key=slug(filter||'featured');
    return ({featured:'Most Popular',popular:'Most Popular',adventure:'Adventure',racing:'Racing',horror:'Horror',strategy:'Strategy & Puzzles',building:'Building',fight:'Fight'})[key]||String(filter||'Games');
  }
  function isSafePackagePath(input){
    const p=String(input||'').replace(/\\/g,'/');
    if(!p||p.startsWith('/')||/^[A-Za-z]:\//.test(p))return false;
    const parts=p.split('/');
    if(parts.some(x=>x===''||x==='.'||x==='..'))return false;
    return true;
  }
  function resolveStorageTarget(globalSetting,gameOverride){
    const global=globalSetting==='folder'?'folder':'browser';
    if(gameOverride==='browser'||gameOverride==='folder')return gameOverride;
    return global;
  }
  function installStateLabel(state){
    switch(state){
      case 'queued':return 'Queued';
      case 'downloading':return 'Downloading';
      case 'verifying':return 'Verifying';
      case 'extracting':return 'Installing';
      case 'installed':return 'Installed';
      case 'failed':return 'Failed';
      case 'cancelled':return 'Cancelled';
      case 'update-available':return 'Update Available';
      default:return 'Not Installed';
    }
  }
  function virtualGameUrl(scope,profileId,gameId,entry){
    const base=String(scope||'');
    const root=base.endsWith('/')?base:base+'/';
    const safeEntry=String(entry||'Game/index.html').replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    return new URL(`__ds_game__/${encodeURIComponent(String(profileId||'default'))}/${encodeURIComponent(String(gameId||'game'))}/${safeEntry}`,root).href;
  }
  function asUint8(input){
    if(input instanceof Uint8Array)return input;
    if(input instanceof ArrayBuffer)return new Uint8Array(input);
    if(ArrayBuffer.isView(input))return new Uint8Array(input.buffer,input.byteOffset,input.byteLength);
    throw new TypeError('ZIP input must be an ArrayBuffer or Uint8Array');
  }
  function u16le(v,o){return v[o]|(v[o+1]<<8)}
  function u32le(v,o){return (v[o]|(v[o+1]<<8)|(v[o+2]<<16)|(v[o+3]<<24))>>>0}
  async function inflateRaw(bytes){
    if(typeof DecompressionStream!=='function')throw new Error('Deflate decompression is not supported by this browser');
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function extractZipEntries(input,options={}){
    const bytes=asUint8(input), maxEntry=Number(options.maxEntrySize)||512*1024*1024, maxTotal=Number(options.maxTotalSize)||2*1024*1024*1024;
    let eocd=-1;
    const min=Math.max(0,bytes.length-65557);
    for(let i=bytes.length-22;i>=min;i--){if(u32le(bytes,i)===0x06054b50){eocd=i;break}}
    if(eocd<0)throw new Error('Invalid ZIP: end-of-central-directory not found');
    const count=u16le(bytes,eocd+10), cdSize=u32le(bytes,eocd+12), cdOffset=u32le(bytes,eocd+16);
    if(cdOffset+cdSize>bytes.length)throw new Error('Invalid ZIP: central directory is out of range');
    const decoder=new TextDecoder('utf-8');
    const metas=[];let pos=cdOffset,total=0;
    for(let i=0;i<count;i++){
      if(u32le(bytes,pos)!==0x02014b50)throw new Error('Invalid ZIP: central directory entry missing');
      const flags=u16le(bytes,pos+8), method=u16le(bytes,pos+10), compressedSize=u32le(bytes,pos+20), uncompressedSize=u32le(bytes,pos+24), nameLen=u16le(bytes,pos+28), extraLen=u16le(bytes,pos+30), commentLen=u16le(bytes,pos+32), localOffset=u32le(bytes,pos+42);
      const name=decoder.decode(bytes.slice(pos+46,pos+46+nameLen)).replace(/\\/g,'/');
      if(name && !name.endsWith('/') && !isSafePackagePath(name))throw new Error(`Unsafe ZIP path: ${name}`);
      if(flags&1)throw new Error(`Encrypted ZIP entries are not supported: ${name}`);
      if(![0,8].includes(method))throw new Error(`Unsupported ZIP compression method ${method}: ${name}`);
      if(uncompressedSize>maxEntry)throw new Error(`ZIP entry is too large: ${name}`);
      total+=uncompressedSize;if(total>maxTotal)throw new Error('ZIP extracted size exceeds safety limit');
      metas.push({name,method,compressedSize,uncompressedSize,localOffset});
      pos+=46+nameLen+extraLen+commentLen;
    }
    const out=new Map();
    for(const meta of metas){
      if(!meta.name||meta.name.endsWith('/'))continue;
      const o=meta.localOffset;
      if(u32le(bytes,o)!==0x04034b50)throw new Error(`Invalid ZIP local header: ${meta.name}`);
      const nameLen=u16le(bytes,o+26), extraLen=u16le(bytes,o+28), start=o+30+nameLen+extraLen, end=start+meta.compressedSize;
      if(end>bytes.length)throw new Error(`Invalid ZIP entry range: ${meta.name}`);
      const packed=bytes.slice(start,end);
      const raw=meta.method===0?packed:await inflateRaw(packed);
      if(raw.length!==meta.uncompressedSize)throw new Error(`ZIP size mismatch: ${meta.name}`);
      out.set(meta.name,raw);
    }
    return out;
  }
  async function extractZipBlobEntries(blob,onEntry,options={}){
    if(!blob||typeof blob.slice!=='function')throw new TypeError('ZIP blob required');
    const maxEntry=Number(options.maxEntrySize)||512*1024*1024,maxTotal=Number(options.maxTotalSize)||2*1024*1024*1024;
    const tailSize=Math.min(blob.size,65557),tail=new Uint8Array(await blob.slice(blob.size-tailSize).arrayBuffer());let rel=-1;
    for(let i=tail.length-22;i>=0;i--){if(u32le(tail,i)===0x06054b50){rel=i;break}}
    if(rel<0)throw new Error('Invalid ZIP: end-of-central-directory not found');
    const count=u16le(tail,rel+10),cdSize=u32le(tail,rel+12),cdOffset=u32le(tail,rel+16);
    if(cdOffset+cdSize>blob.size)throw new Error('Invalid ZIP: central directory is out of range');
    const cd=new Uint8Array(await blob.slice(cdOffset,cdOffset+cdSize).arrayBuffer()),decoder=new TextDecoder('utf-8');let pos=0,total=0;const metas=[];
    for(let i=0;i<count;i++){
      if(u32le(cd,pos)!==0x02014b50)throw new Error('Invalid ZIP: central directory entry missing');
      const flags=u16le(cd,pos+8),method=u16le(cd,pos+10),compressedSize=u32le(cd,pos+20),uncompressedSize=u32le(cd,pos+24),nameLen=u16le(cd,pos+28),extraLen=u16le(cd,pos+30),commentLen=u16le(cd,pos+32),localOffset=u32le(cd,pos+42);
      const name=decoder.decode(cd.slice(pos+46,pos+46+nameLen)).replace(/\\/g,'/');
      if(name&&!name.endsWith('/')&&!isSafePackagePath(name))throw new Error(`Unsafe ZIP path: ${name}`);
      if(flags&1)throw new Error(`Encrypted ZIP entries are not supported: ${name}`);
      if(![0,8].includes(method))throw new Error(`Unsupported ZIP compression method ${method}: ${name}`);
      if(uncompressedSize>maxEntry)throw new Error(`ZIP entry is too large: ${name}`);total+=uncompressedSize;if(total>maxTotal)throw new Error('ZIP extracted size exceeds safety limit');
      metas.push({name,method,compressedSize,uncompressedSize,localOffset});pos+=46+nameLen+extraLen+commentLen;
    }
    let written=0;
    for(const meta of metas){
      if(!meta.name||meta.name.endsWith('/'))continue;
      const head=new Uint8Array(await blob.slice(meta.localOffset,meta.localOffset+30).arrayBuffer());if(head.length<30||u32le(head,0)!==0x04034b50)throw new Error(`Invalid ZIP local header: ${meta.name}`);
      const nameLen=u16le(head,26),extraLen=u16le(head,28),start=meta.localOffset+30+nameLen+extraLen,end=start+meta.compressedSize;if(end>blob.size)throw new Error(`Invalid ZIP entry range: ${meta.name}`);
      const packed=new Uint8Array(await blob.slice(start,end).arrayBuffer()),raw=meta.method===0?packed:await inflateRaw(packed);if(raw.length!==meta.uncompressedSize)throw new Error(`ZIP size mismatch: ${meta.name}`);
      if(onEntry)await onEntry(meta.name,raw,meta);written++;
    }
    return {totalEntries:written,totalUncompressed:total};
  }
  const SHA256_K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const ror=(x,n)=>(x>>>n)|(x<<(32-n));
  class Sha256{
    constructor(){this.h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);this.buf=new Uint8Array(64);this.bufLen=0;this.bytes=0;this.w=new Uint32Array(64);this.done=false}
    _block(chunk,off=0){const w=this.w;for(let i=0;i<16;i++){const j=off+i*4;w[i]=((chunk[j]<<24)|(chunk[j+1]<<16)|(chunk[j+2]<<8)|chunk[j+3])>>>0}for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2],s0=(ror(a,7)^ror(a,18)^(a>>>3))>>>0,s1=(ror(b,17)^ror(b,19)^(b>>>10))>>>0;w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0}let[a,b,c,d,e,f,g,h]=this.h;for(let i=0;i<64;i++){const S1=(ror(e,6)^ror(e,11)^ror(e,25))>>>0,ch=((e&f)^((~e)&g))>>>0,t1=(h+S1+ch+SHA256_K[i]+w[i])>>>0,S0=(ror(a,2)^ror(a,13)^ror(a,22))>>>0,maj=((a&b)^(a&c)^(b&c))>>>0,t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0}this.h[0]=(this.h[0]+a)>>>0;this.h[1]=(this.h[1]+b)>>>0;this.h[2]=(this.h[2]+c)>>>0;this.h[3]=(this.h[3]+d)>>>0;this.h[4]=(this.h[4]+e)>>>0;this.h[5]=(this.h[5]+f)>>>0;this.h[6]=(this.h[6]+g)>>>0;this.h[7]=(this.h[7]+h)>>>0}
    update(input){if(this.done)throw new Error('SHA-256 digest already finalized');const data=asUint8(input);this.bytes+=data.length;let off=0;if(this.bufLen){const take=Math.min(64-this.bufLen,data.length);this.buf.set(data.subarray(0,take),this.bufLen);this.bufLen+=take;off+=take;if(this.bufLen===64){this._block(this.buf);this.bufLen=0}}while(off+64<=data.length){this._block(data,off);off+=64}if(off<data.length){this.buf.set(data.subarray(off),0);this.bufLen=data.length-off}return this}
    digest(){if(this.done)throw new Error('SHA-256 digest already finalized');this.done=true;const bitsLo=(this.bytes*8)>>>0,bitsHi=Math.floor(this.bytes/0x20000000)>>>0;this.buf[this.bufLen++]=0x80;if(this.bufLen>56){while(this.bufLen<64)this.buf[this.bufLen++]=0;this._block(this.buf);this.bufLen=0}while(this.bufLen<56)this.buf[this.bufLen++]=0;this.buf[56]=(bitsHi>>>24)&255;this.buf[57]=(bitsHi>>>16)&255;this.buf[58]=(bitsHi>>>8)&255;this.buf[59]=bitsHi&255;this.buf[60]=(bitsLo>>>24)&255;this.buf[61]=(bitsLo>>>16)&255;this.buf[62]=(bitsLo>>>8)&255;this.buf[63]=bitsLo&255;this._block(this.buf);const out=new Uint8Array(32);for(let i=0;i<8;i++){out[i*4]=this.h[i]>>>24;out[i*4+1]=this.h[i]>>>16;out[i*4+2]=this.h[i]>>>8;out[i*4+3]=this.h[i]}return out}
    hex(){return [...this.digest()].map(x=>x.toString(16).padStart(2,'0')).join('')}
  }
  function sha256Hex(input){return new Sha256().update(input).hex()}
  function storeAppFromGame(game,record,scope,profileId){
    const r=record||{state:'not-installed'},pct=gameProgress(r),installed=r.state==='installed'||r.state==='update-available';
    return {id:game.id,name:game.name,desc:game.description||'Installed from DorukStation Store.',image:game.icon||'assets/skin/store.png',type:'image',action:installed?'launch':'placeholder',url:installed?virtualGameUrl(scope,profileId,game.id,r.entry||game.entry):'',profiled:true,inFolder:true,folderGame:true,storeManaged:true,storeGameId:game.id,installState:r.state,downloadProgress:pct,live:r.state==='downloading'?`Downloading ${Math.round(pct)}%`:r.state==='verifying'?'Verifying download…':r.state==='extracting'?'Installing…':installed?'Installed from DorukStation Store.':installStateLabel(r.state)};
  }
  function validatePackageEntries(game,entries){
    if(!(entries instanceof Map))throw new Error('Package entries must be a Map');
    const expected=slug(game?.id||game?.name),manifestBytes=entries.get('manifest.json');
    let manifest={};
    if(manifestBytes){
      try{manifest=JSON.parse(new TextDecoder().decode(manifestBytes))}catch{throw new Error('Package manifest.json is invalid JSON')}
      const actual=slug(manifest?.id||expected);if(actual!==expected)throw new Error(`Package manifest id mismatch: expected ${expected}, got ${actual}`);
    }
    const entry=String(manifest?.entry||game?.entry||'Game/index.html').replace(/\\/g,'/');
    if(!isSafePackagePath(entry)||!entries.has(entry))throw new Error(`Package entry is missing or unsafe: ${entry}`);
    if(!/\.html?$/i.test(entry))throw new Error('Package entry must be an HTML file');
    return {...game,...manifest,id:expected,entry};
  }
  function htmlEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function attrEscape(value){return htmlEscape(value)}
  function formatBytes(value){
    const n=Math.max(0,Number(value)||0);if(n<1024)return `${Math.round(n)} B`;const units=['KB','MB','GB','TB'];let x=n/1024,i=0;while(x>=1024&&i<units.length-1){x/=1024;i++}return `${x>=10?x.toFixed(1):x.toFixed(1)} ${units[i]}`;
  }
  function formatEta(seconds){const n=Math.max(0,Math.round(Number(seconds)||0));if(n<60)return `${n}s left`;const m=Math.floor(n/60),s=n%60;if(m<60)return `${m}m ${s}s left`;const h=Math.floor(m/60);return `${h}h ${m%60}m left`}
  function gameInstall(state,gameId){return state?.installs?.[gameId]||{state:isStoreManagedPreinstalled({id:gameId})?'installed':'not-installed'}}
  function progressPercent(install){const total=Number(install?.total)||0,received=Number(install?.received)||0;if(total>0)return Math.max(0,Math.min(100,received/total*100));return ['verifying','extracting','installed','update-available'].includes(install?.state)?100:0}
  const gameProgress=progressPercent;
  function homeDownloadLabel(install){const state=install?.state||'not-installed';if(state==='downloading')return `Downloading ${Math.round(progressPercent(install))}%`;if(state==='queued')return 'Queued';if(state==='verifying')return 'Verifying';if(state==='extracting')return 'Installing';if(state==='failed')return 'Download Failed';if(state==='update-available')return 'Update Available';if(state==='installed')return 'Play';return 'Download'}
  function renderTileProgressMarkup(install){const state=install?.state||'not-installed';if(!['queued','downloading','verifying','extracting'].includes(state))return '';const pct=progressPercent(install),label=homeDownloadLabel(install);return `<div class="v57-tile-progress" data-state="${attrEscape(state)}"><div class="v57-tile-progress-track"><i style="width:${pct.toFixed(2)}%"></i></div><span>${htmlEscape(label)}</span></div>`}
  function searchCatalog(catalog,query){const q=String(query||'').trim().toLowerCase();if(!q)return [...(catalog?.games||[])];return (catalog?.games||[]).filter(g=>[g.name,g.description,g.age,...(g.genres||[]),...(g.tags||[])].join(' ').toLowerCase().includes(q))}
  function gameCardMarkup(state,game,idx,modern=false){
    const install=gameInstall(state,game.id),progress=gameProgress(install),status=installStateLabel(install.state),focus=Number(state?.focusIndex)===idx?' focused':'';
    return `<button class="v57-store-game-card${focus}" data-store-index="${idx}" data-game-id="${attrEscape(game.id)}" type="button"><div class="v57-card-art" style="background-image:url('${attrEscape(game.icon||game.banner||'assets/skin/store.png')}')">${install.state==='downloading'||install.state==='verifying'||install.state==='extracting'?`<div class="v57-card-progress"><i style="width:${progress.toFixed(2)}%"></i></div>`:''}</div><div class="v57-card-name">${htmlEscape(game.name)}</div><div class="v57-card-meta">${htmlEscape((game.genres||[]).slice(0,2).join(' · ')||game.age||'Game')}</div><div class="v57-card-state">${htmlEscape(status)}</div></button>`;
  }
  function renderSystemFooterMarkup(state,controls='✕ Select · ○ Back'){
    return `<footer class="v57-store-footer"><div class="v57-footer-controls">${htmlEscape(controls)}</div><div class="v57-footer-user">${state?.avatar?`<img src="${attrEscape(state.avatar)}" alt="">`:''}<span>${htmlEscape(state?.username||'User')}</span></div></footer>`;
  }
  function renderStoreHomeMarkup(state,modern=false){
    const games=state?.catalog?.games||[],filter=state?.filter||'featured',filtered=filterCatalogByCategory(state?.catalog,filter),featured=filtered[0]||games.find(g=>g.featured)||games[0],cards=filtered.map((g,i)=>gameCardMarkup(state,g,i,modern)).join(''),heading=categoryLabel(filter);
    const topnav=`<nav class="v58-store-topnav"><button data-store-action="home" class="${filter==='featured'||filter==='popular'?'active':''}" type="button">Store Home</button><button data-store-action="search" type="button">⌕ Search</button><button data-store-action="downloads" type="button">Downloads</button></nav>`;
    const categoryButtons=`<button data-store-filter="featured" class="${filter==='featured'||filter==='popular'?'active':''}">Popular</button><button data-store-filter="adventure" class="${filter==='adventure'?'active':''}">Adventure</button><button data-store-filter="racing" class="${filter==='racing'?'active':''}">Racing</button><button data-store-filter="horror" class="${filter==='horror'?'active':''}">Horror</button><button data-store-filter="strategy" class="${filter==='strategy'?'active':''}">Strategy & Puzzles</button><button data-store-filter="building" class="${filter==='building'?'active':''}">Building</button><button data-store-filter="fight" class="${filter==='fight'?'active':''}">Fight</button>`;
    if(modern)return `<section class="v57-store v57-store-modern v58-store-home">${topnav}<div class="v57-modern-store-head"><div><span>DorukStation Store</span><h1>${htmlEscape(featured?.name||'Discover Games')}</h1></div></div>${featured?`<div class="v57-modern-hero" style="background-image:linear-gradient(90deg,rgba(4,5,10,.94),rgba(4,5,10,.18)),url('${attrEscape(featured.banner||featured.icon)}')"><div><span>${htmlEscape(featured.age)}</span><h2>${htmlEscape(featured.name)}</h2><p>${htmlEscape(featured.description||'Available from DorukStation Store.')}</p></div></div>`:''}<div class="v58-modern-categories">${categoryButtons}<button data-store-action="storage">Storage</button></div><h3>${htmlEscape(heading)}</h3><div class="v57-store-grid">${cards||'<div class="v57-store-empty">No games in this category.</div>'}</div>${renderSystemFooterMarkup(state,'✕ Select · ○ Back · OPTIONS Details')}</section>`;
    return `<section class="v57-store v57-store-classic v58-store-home"><aside class="v57-store-rail"><div class="v57-store-brand">DorukStation Store</div><span>Categories</span>${categoryButtons}<div class="v57-store-rule"></div><button data-store-action="storage">Storage Settings</button></aside><main class="v57-store-main">${topnav}${featured?`<div class="v57-classic-feature"><div class="v57-feature-title">${htmlEscape(heading)}</div><div class="v57-feature-hero" style="background-image:linear-gradient(90deg,rgba(0,41,116,.18),rgba(0,20,78,.2)),url('${attrEscape(featured.banner||featured.icon)}')"><div><h1>${htmlEscape(featured.name)}</h1><p>${htmlEscape(featured.description||(featured.genres||[]).join(' · '))}</p></div></div></div>`:''}<h2>${htmlEscape(heading)}</h2><div class="v57-store-grid">${cards||'<div class="v57-store-empty">No games in this category.</div>'}</div></main>${renderSystemFooterMarkup(state,'✕ Enter · ○ Back · OPTIONS Menu')}</section>`;
  }
  const SEARCH_KEYS=['1','2','3','4','5','6','7','8','9','0','q','w','e','r','t','y','u','i','o','p','a','s','d','f','g','h','j','k','l','⌫','z','x','c','v','b','n','m','-','_','Space'];
  function renderStoreSearchMarkup(state,modern=false,query=''){
    const results=searchCatalog(state?.catalog,query),keyboard=SEARCH_KEYS.map(k=>`<button class="v57-key" data-store-key="${attrEscape(k)}" type="button">${htmlEscape(k)}</button>`).join('');
    if(modern)return `<section class="v57-store v57-store-modern v57-store-search"><div class="v57-modern-searchbar">⌕ <span>${htmlEscape(query||'Search DorukStation Store')}</span></div><div class="v57-modern-search-results">${results.map((g,i)=>gameCardMarkup(state,g,i,true)).join('')||'<div class="v57-store-empty">No results.</div>'}</div>${renderSystemFooterMarkup(state,'✕ Select · ○ Back · □ Delete')}</section>`;
    return `<section class="v57-store v57-store-classic v57-store-search"><div class="v57-search-left"><h1>Search</h1><div class="v57-search-box">⌕ <span>${htmlEscape(query)}</span><i></i></div><div class="v57-store-keyboard">${keyboard}</div></div><div class="v57-search-right"><h2>Results <small>${results.length}</small></h2><div class="v57-search-result-list">${results.map((g,i)=>`<button data-store-index="${i}" data-game-id="${attrEscape(g.id)}" type="button"><img src="${attrEscape(g.icon||'assets/skin/store.png')}" alt=""><span><b>${htmlEscape(g.name)}</b><small>${htmlEscape((g.genres||[]).join(' · ')||g.age)}</small></span></button>`).join('')||'<div class="v57-store-empty">No results.</div>'}</div></div>${renderSystemFooterMarkup(state,'✕ Enter · ○ Back · □ Delete')}</section>`;
  }
  function renderDownloadsMarkup(state,modern=false){
    const games=new Map((state?.catalog?.games||[]).map(g=>[g.id,g]));
    const rows=Object.entries(state?.installs||{}).filter(([,v])=>v&&v.state&&v.state!=='not-installed').sort((a,b)=>(a[1].state==='downloading'?-1:1)-(b[1].state==='downloading'?-1:1)).map(([id,d],i)=>{const g=games.get(id)||{id,name:d.name||id,icon:d.icon||''},pct=gameProgress(d),canCancel=['queued','downloading','verifying','extracting'].includes(d.state);return `<div class="v57-download-entry"><button class="v57-download-row${i===0?' focused':''}" data-store-index="${i}" data-game-id="${attrEscape(id)}" type="button"><img src="${attrEscape(g.icon||'assets/skin/store.png')}" alt=""><div class="v57-download-copy"><b>${htmlEscape(g.name)}</b><span>${htmlEscape(installStateLabel(d.state))}</span>${d.state==='downloading'?`<div class="v57-download-progress"><i style="width:${pct.toFixed(2)}%"></i></div><small>${htmlEscape(formatBytes(d.received))}/${htmlEscape(formatBytes(d.total))}${d.eta!=null?` (${htmlEscape(formatEta(d.eta))})`:''}</small>`:''}${d.error?`<small class="error">${htmlEscape(d.error)}</small>`:''}</div></button>${canCancel?`<button class="v57-download-cancel" data-store-cancel="${attrEscape(id)}" type="button">Cancel Download</button>`:''}</div>`}).join('');
    return `<section class="v57-store ${modern?'v57-store-modern':'v57-store-classic'} v57-downloads"><h1>Downloads</h1><div class="v57-download-list">${rows||'<div class="v57-store-empty">No downloads yet.</div>'}</div>${renderSystemFooterMarkup(state,'✕ Enter · ○ Back · △ Cancel · OPTIONS Menu')}</section>`;
  }
  function renderGameDetailMarkup(state,game,modern=false){
    const install=gameInstall(state,game.id),override=state?.gameOverrides?.[game.id]||'inherit',resolved=resolveStorageTarget(state?.globalStorage,override),status=installStateLabel(install.state),progress=gameProgress(install);
    const action=install.state==='installed'||install.state==='update-available'?'Play':install.state==='downloading'||install.state==='verifying'||install.state==='extracting'?'View Download':game.packageUrl?'Install':'Package URL Missing';
    return `<section class="v57-store ${modern?'v57-store-modern':'v57-store-classic'} v57-game-detail"><div class="v57-detail-hero" style="background-image:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.12)),url('${attrEscape(game.banner||game.icon)}')"><img src="${attrEscape(game.icon||'assets/skin/store.png')}" alt=""><div><span>${htmlEscape(game.age)} · ${htmlEscape((game.genres||[]).join(' · '))}</span><h1>${htmlEscape(game.name)}</h1><p>${htmlEscape(game.description||'No description yet.')}</p><b>${htmlEscape(status)}</b></div></div>${install.state==='downloading'?`<div class="v57-detail-download"><div class="v57-download-progress"><i style="width:${progress.toFixed(2)}%"></i></div><span>${htmlEscape(formatBytes(install.received))}/${htmlEscape(formatBytes(install.total))}</span></div>`:''}<div class="v57-detail-actions"><button data-store-action="primary" ${action==='Package URL Missing'?'disabled':''}>${htmlEscape(action)}</button><button data-store-action="downloads">Downloads</button></div><div class="v57-detail-storage"><h2>Install Storage</h2><p>Current target: <b>${resolved==='folder'?'User Storage':'Browser Storage'}</b></p><button data-storage="inherit" class="${override==='inherit'?'active':''}">Use Global Setting</button><button data-storage="browser" class="${override==='browser'?'active':''}">Browser Storage</button><button data-storage="folder" class="${override==='folder'?'active':''}">User Storage</button></div>${renderSystemFooterMarkup(state,'✕ Select · ○ Back · OPTIONS Menu')}</section>`;
  }
  function parseVirtualGamePath(pathname){
    const marker='/__ds_game__/';
    const i=String(pathname||'').indexOf(marker);if(i<0)return null;
    const rest=String(pathname).slice(i+marker.length).split('/');
    if(rest.length<3)return null;
    let profileId,gameId;
    try{profileId=decodeURIComponent(rest.shift());gameId=decodeURIComponent(rest.shift())}catch{return null}
    const path=rest.map(x=>{try{return decodeURIComponent(x)}catch{return x}}).join('/');
    if(!isSafePackagePath(path))return null;
    return {profileId,gameId,path};
  }
  function mimeForPath(path){
    const ext=String(path||'').split('?')[0].split('#')[0].toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]||'';
    return ({html:'text/html; charset=utf-8',htm:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json; charset=utf-8',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',ico:'image/x-icon',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',mp4:'video/mp4',webm:'video/webm',wasm:'application/wasm',glb:'model/gltf-binary',gltf:'model/gltf+json',bin:'application/octet-stream',txt:'text/plain; charset=utf-8'})[ext]||'application/octet-stream';
  }
  function installMetaKey(gameId){return `install:${slug(gameId)}`}
  function gameFileKey(gameId,path){return `file:${slug(gameId)}:${String(path||'').replace(/\\/g,'/')}`}
  const STORE_DB='dorukstation-store-v57';
  function openStoreDb(){
    if(typeof indexedDB==='undefined')return Promise.reject(new Error('IndexedDB unavailable'));
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(STORE_DB,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});if(!db.objectStoreNames.contains('files'))db.createObjectStore('files',{keyPath:'key'})};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
    });
  }
  async function idbGet(store,key){const db=await openStoreDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),r=tx.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
  async function idbPut(store,value){const db=await openStoreDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),r=tx.objectStore(store).put(value);r.onsuccess=()=>resolve(value);r.onerror=()=>reject(r.error)})}finally{db.close()}}
  async function idbDeletePrefix(store,prefix){
    const db=await openStoreDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),os=tx.objectStore(store),req=os.openCursor();req.onsuccess=()=>{const c=req.result;if(!c)return;const k=String(c.key||'');if(k.startsWith(prefix))c.delete();c.continue()};req.onerror=()=>reject(req.error);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}finally{db.close()}
  }
  async function getGlobalStorage(){return (await idbGet('meta','globalStorage'))?.value==='folder'?'folder':'browser'}
  async function setGlobalStorage(value){const v=value==='folder'?'folder':'browser';await idbPut('meta',{key:'globalStorage',value:v});return v}
  async function getGameStorageOverride(gameId){const v=(await idbGet('meta',`gameStorageOverride:${slug(gameId)}`))?.value;return v==='folder'||v==='browser'?v:'inherit'}
  async function setGameStorageOverride(gameId,value){const v=value==='folder'||value==='browser'?value:'inherit';await idbPut('meta',{key:`gameStorageOverride:${slug(gameId)}`,value:v});return v}
  async function getInstallRecord(gameId){return (await idbGet('meta',installMetaKey(gameId)))?.value||null}
  async function saveInstallRecord(gameId,value){await idbPut('meta',{key:installMetaKey(gameId),value:{...value,id:slug(gameId)}});return value}
  async function getStoredHandle(key){return (await idbGet('meta',key))?.handle||null}
  async function storeHandle(key,handle){await idbPut('meta',{key,handle});return handle}
  async function chooseUserFolder(gameId=null){
    if(typeof window==='undefined'||typeof window.showDirectoryPicker!=='function')throw new Error('User folder storage is not supported by this browser');
    const handle=await window.showDirectoryPicker({id:gameId?`dorukstation-${slug(gameId)}`:'dorukstation-games',mode:'readwrite'});
    const key=gameId?`folderHandle:${slug(gameId)}`:'globalFolderHandle';await storeHandle(key,handle);
    return handle;
  }
  async function ensureWritePermission(handle,request=false){
    if(!handle)return false;const opts={mode:'readwrite'};
    if(typeof handle.queryPermission==='function'&&await handle.queryPermission(opts)==='granted')return true;
    if(request&&typeof handle.requestPermission==='function'&&await handle.requestPermission(opts)==='granted')return true;
    return typeof handle.queryPermission!=='function';
  }
  async function resolveFolderHandle(gameId){return await getStoredHandle(`folderHandle:${slug(gameId)}`)||await getStoredHandle('globalFolderHandle')}
  async function childDirectory(root,parts,create){let d=root;for(const part of parts)d=await d.getDirectoryHandle(part,{create});return d}
  async function writeEntriesToDirectory(root,gameId,entries){
    const id=slug(gameId);try{await root.removeEntry(id,{recursive:true})}catch{}
    const base=await root.getDirectoryHandle(id,{create:true});
    for(const [path,bytes] of entries){if(!isSafePackagePath(path))throw new Error(`Unsafe ZIP path: ${path}`);const parts=path.split('/'),name=parts.pop(),dir=await childDirectory(base,parts,true),fh=await dir.getFileHandle(name,{create:true}),w=await fh.createWritable();await w.write(bytes);await w.close()}
    return base;
  }
  async function getOpfsGamesRoot(){
    if(typeof navigator==='undefined'||!navigator.storage||typeof navigator.storage.getDirectory!=='function')throw new Error('OPFS unavailable');
    const root=await navigator.storage.getDirectory();const ds=await root.getDirectoryHandle('DorukStationStore',{create:true});return ds.getDirectoryHandle('games',{create:true});
  }
  async function prepareDirectoryWriter(root,gameId,meta){
    const id=slug(gameId);try{await root.removeEntry(id,{recursive:true})}catch{}
    const base=await root.getDirectoryHandle(id,{create:true});
    return {meta,async write(path,bytes){if(!isSafePackagePath(path))throw new Error(`Unsafe ZIP path: ${path}`);const parts=path.split('/'),name=parts.pop(),dir=await childDirectory(base,parts,true),fh=await dir.getFileHandle(name,{create:true}),w=await fh.createWritable();await w.write(bytes);await w.close()},async finalize(){return meta},async abort(){try{await root.removeEntry(id,{recursive:true})}catch{}}};
  }
  async function prepareBrowserGameWriter(gameId){
    try{return await prepareDirectoryWriter(await getOpfsGamesRoot(),gameId,{storageTarget:'browser',backend:'opfs'})}catch(err){
      if(typeof indexedDB==='undefined')throw err;const prefix=`file:${slug(gameId)}:`;await idbDeletePrefix('files',prefix);return {meta:{storageTarget:'browser',backend:'idb'},async write(path,bytes){if(!isSafePackagePath(path))throw new Error(`Unsafe ZIP path: ${path}`);await idbPut('files',{key:gameFileKey(gameId,path),blob:new Blob([bytes],{type:mimeForPath(path)})})},async finalize(){return this.meta},async abort(){await idbDeletePrefix('files',prefix)}};
    }
  }
  async function prepareFolderGameWriter(gameId,handle,handleKey=`folderHandle:${slug(gameId)}`){
    if(!handle)throw new Error('Choose a user storage folder first');if(!await ensureWritePermission(handle,false))throw new Error('User storage folder permission is required');await storeHandle(handleKey,handle);return prepareDirectoryWriter(handle,gameId,{storageTarget:'folder',backend:'folder',handleKey});
  }
  async function writeBrowserGame(gameId,entries){
    const writer=await prepareBrowserGameWriter(gameId);try{for(const [path,bytes] of entries)await writer.write(path,bytes);return await writer.finalize()}catch(err){await writer.abort();throw err}
  }
  async function writeFolderGame(gameId,entries,handle){
    const root=handle||await resolveFolderHandle(gameId),writer=await prepareFolderGameWriter(gameId,root);try{for(const [path,bytes] of entries)await writer.write(path,bytes);return await writer.finalize()}catch(err){await writer.abort();throw err}
  }
  async function fileFromDirectory(root,parts){let d=root;for(const part of parts.slice(0,-1))d=await d.getDirectoryHandle(part);const h=await d.getFileHandle(parts.at(-1));return h.getFile()}
  async function createTempPackageSink(gameId){
    try{
      if(typeof navigator==='undefined'||!navigator.storage||typeof navigator.storage.getDirectory!=='function')throw new Error('OPFS unavailable');
      const root=await navigator.storage.getDirectory(),ds=await root.getDirectoryHandle('DorukStationStore',{create:true}),downloads=await ds.getDirectoryHandle('downloads',{create:true}),name=`${slug(gameId)}.zip.part`;try{await downloads.removeEntry(name)}catch{}const fh=await downloads.getFileHandle(name,{create:true}),w=await fh.createWritable();let closed=false;
      return {async write(chunk){await w.write(chunk)},async close(){if(!closed){closed=true;await w.close()}},async blob(){if(!closed)await this.close();return fh.getFile()},async cleanup(){if(!closed){try{await w.abort()}catch{}closed=true}try{await downloads.removeEntry(name)}catch{}}};
    }catch{
      const chunks=[];let closed=false;return {async write(chunk){chunks.push(new Uint8Array(chunk))},async close(){closed=true},async blob(){closed=true;return new Blob(chunks,{type:'application/zip'})},async cleanup(){chunks.length=0;closed=true}};
    }
  }
  async function downloadGamePackage(game,onProgress,signal){
    const response=await fetch(game.packageUrl,{cache:'no-store',signal});if(!response.ok)throw new Error(`Download failed: HTTP ${response.status}`);const total=Number(response.headers.get('content-length'))||Number(game.packageSize)||0,sink=await createTempPackageSink(game.id),hash=new Sha256(),started=Date.now();let received=0,lastNotify=0;
    try{
      if(response.body?.getReader){const reader=response.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;if(signal?.aborted)throw new DOMException('Download cancelled','AbortError');const chunk=asUint8(value);received+=chunk.length;hash.update(chunk);await sink.write(chunk);const now=Date.now();if(now-lastNotify>90){const seconds=Math.max(.001,(now-started)/1000),speed=received/seconds,eta=total&&speed?Math.max(0,(total-received)/speed):null;onProgress?.({received,total,speed,eta});lastNotify=now}}}else{const chunk=new Uint8Array(await response.arrayBuffer());received=chunk.length;hash.update(chunk);await sink.write(chunk)}
      await sink.close();const blob=await sink.blob(),sha256=hash.hex();onProgress?.({received,total:total||received,speed:received/Math.max(.001,(Date.now()-started)/1000),eta:0});return {blob,sha256,total:total||received,cleanup:()=>sink.cleanup()};
    }catch(err){await sink.cleanup();throw err}
  }
  async function installGamePackage(game,runtime,onUpdate){
    const id=slug(game.id),state=runtime||{installs:{},gameOverrides:{},globalStorage:'browser',aborters:new Map()};state.installs=state.installs||{};state.aborters=state.aborters||new Map();const controller=new AbortController();state.aborters.set(id,controller);let temp=null,writer=null;
    const emit=patch=>{state.installs[id]={...(state.installs[id]||{}),name:game.name,icon:game.icon,version:game.version,...patch};onUpdate?.(state.installs[id])};
    try{
      const override=state.gameOverrides?.[id]||await getGameStorageOverride(id),global=state.globalStorage||await getGlobalStorage(),target=resolveStorageTarget(global,override);let folderHandle=null,handleKey='';
      if(target==='folder'){
        if(override==='folder'){handleKey=`folderHandle:${id}`;folderHandle=await getStoredHandle(handleKey);if(!folderHandle)folderHandle=await chooseUserFolder(id)}
        else{handleKey='globalFolderHandle';folderHandle=await getStoredHandle(handleKey);if(!folderHandle)folderHandle=await chooseUserFolder(null)}
        if(!await ensureWritePermission(folderHandle,true))throw new Error('User storage folder permission was denied');
      }
      emit({state:'queued',received:0,total:Number(game.packageSize)||0,storageTarget:target,error:''});emit({state:'downloading'});
      temp=await downloadGamePackage(game,p=>emit({state:'downloading',...p}),controller.signal);
      emit({state:'verifying',received:temp.total,total:temp.total,sha256:temp.sha256});if(game.sha256&&temp.sha256.toLowerCase()!==game.sha256.toLowerCase())throw new Error('SHA-256 verification failed');
      emit({state:'extracting'});writer=target==='folder'?await prepareFolderGameWriter(id,folderHandle,handleKey):await prepareBrowserGameWriter(id);const names=new Map();
      const maxTotal=Math.min(4*1024*1024*1024,Math.max(512*1024*1024,(Number(game.packageSize)||128*1024*1024)*8));
      await extractZipBlobEntries(temp.blob,async(path,bytes)=>{names.set(path,path==='manifest.json'?bytes:new Uint8Array(0));await writer.write(path,bytes)},{maxEntrySize:1024*1024*1024,maxTotalSize:maxTotal});
      const manifest=validatePackageEntries(game,names),storage=await writer.finalize();const record={state:'installed',version:game.version,entry:manifest.entry,installedAt:Date.now(),name:game.name,icon:game.icon,sha256:temp.sha256,...storage};await saveInstallRecord(id,record);emit(record);return record;
    }catch(err){try{await writer?.abort?.()}catch{}const cancelled=err?.name==='AbortError';emit({state:cancelled?'cancelled':'failed',error:cancelled?'Download cancelled':String(err?.message||err)});throw err}
    finally{state.aborters.delete(id);try{await temp?.cleanup?.()}catch{}}
  }
  function cancelGameInstall(gameId,runtime){const c=runtime?.aborters?.get(slug(gameId));if(c){c.abort();return true}return false}
  async function readInstalledGameFile(gameId,path){
    if(!isSafePackagePath(path))throw new Error('Unsafe installed-game path');const id=slug(gameId),record=await getInstallRecord(id);if(!record)throw new Error('Game is not installed');
    if(record.backend==='opfs'){const root=await getOpfsGamesRoot();const game=await root.getDirectoryHandle(id);return fileFromDirectory(game,path.split('/'))}
    if(record.backend==='idb'){const row=await idbGet('files',gameFileKey(id,path));if(!row?.blob)throw new Error('Installed file not found');return row.blob}
    if(record.backend==='folder'){const root=await getStoredHandle(record.handleKey||`folderHandle:${id}`);if(!root)throw new Error('Installed folder handle is missing');const game=await root.getDirectoryHandle(id);return fileFromDirectory(game,path.split('/'))}
    throw new Error('Unknown installed-game backend');
  }
  async function registerVfsServiceWorker(){
    if(typeof navigator==='undefined'||!navigator.serviceWorker||!/^https?:$/.test(location.protocol))return null;
    try{return await navigator.serviceWorker.register('v57-game-vfs-sw.js')}catch(err){console.warn('[DorukStation Store] service worker registration failed',err);return null}
  }
  function shouldRemoveLegacyBundledGame(app){return !!app&&app.id==='dorukcraft'&&!app.folderGame&&!app.userAdded&&!app.storeManaged}
  function decorateStoreShellApp(app){if(!app)return app;app.name='DorukStation Store';app.desc='Browse and install games from DorukStation Store.';app.live='Featured games, downloads and updates.';app.action='store';return app}
  function storeShellAppActivation(app){if(!app?.storeManaged)return 'default';return ['queued','downloading','verifying','extracting'].includes(app.installState)?'detail':'launch'}
  function isStoreManagedPreinstalled(game){return String(game?.id||'')==='sharps-playroom'}
  function installBrowser(){
    if(window.__ds58StoreInstalled)return;
    window.__ds58StoreInstalled=true;
    window.__dorukstationVersion='0.58';
    document.title='DorukStation — v0.58';
    const v57ShowUserSelectorBase=typeof showUserSelector==='function'?showUserSelector:null;
    if(v57ShowUserSelectorBase)showUserSelector=function(...args){const out=v57ShowUserSelectorBase(...args);document.title='DorukStation — v0.58';return out};
    registerVfsServiceWorker();

    const runtime={
      catalog:normalizeCatalog({games:[{id:'sharps-playroom',name:"Sharp's Playroom",version:'preinstalled',description:'Preinstalled DorukStation playroom.',age:'7+',genres:['Adventure'],icon:'assets/skin/sharps-playroom.png',featured:true}]},location.href),
      installs:{'sharps-playroom':{state:'installed',preinstalled:true,version:'preinstalled'}},
      gameOverrides:{},globalStorage:'browser',search:'',catalogError:'',filter:'featured',activeView:'',activeGameId:'',focusables:[],aborters:new Map(),refreshTimer:0
    };
    window.__dorukstationStore58=runtime;
    try{decorateStoreShellApp(apps?.find?.(a=>a.id==='store'))}catch{}

    const isModern=()=>{try{return typeof v40CanUseModernHome==='function'?!!v40CanUseModernHome():document.body.classList.contains('ui-modern')}catch{return false}};
    const shellUser=()=>{let username='User',avatar='';try{username=currentProfile?.name||S?.username||username;avatar=currentProfile?.avatar||document.querySelector('#sessionAvatar')?.getAttribute('src')||''}catch{}return{username,avatar}};
    const snapshot=()=>({...runtime,...shellUser(),focusIndex:Math.max(0,Number(S?.pageIndex)||0)});
    const gameById=id=>runtime.catalog.games.find(g=>g.id===id)||null;
    const storePageActive=()=>!!(typeof S!=='undefined'&&S.pageOpen&&S.pageCustom&&S.pageCustom.__v57Store);

    async function refreshCatalog(){
      let remote=null;runtime.catalogError='';
      const catalogUrl=window.DORUKSTATION_STORE_CATALOG_URL||DEFAULT_CATALOG_URL;
      try{const res=await fetch(catalogUrl,{cache:'no-store'});if(!res.ok)throw new Error(`HTTP ${res.status}`);remote=await hydrateCatalogManifests(normalizeCatalog(await res.json(),catalogUrl),fetch)}catch(err){runtime.catalogError=`Catalog offline: ${err?.message||err}`}
      if(remote){
        const sharp=runtime.catalog.games.find(g=>g.id==='sharps-playroom');
        runtime.catalog=remote;
        if(sharp&&!runtime.catalog.games.some(g=>g.id==='sharps-playroom'))runtime.catalog.games.unshift(sharp);
      }
      try{runtime.globalStorage=await getGlobalStorage()}catch{}
      for(const g of runtime.catalog.games){
        try{runtime.gameOverrides[g.id]=await getGameStorageOverride(g.id)}catch{runtime.gameOverrides[g.id]='inherit'}
        if(g.id==='sharps-playroom'){runtime.installs[g.id]={state:'installed',preinstalled:true,version:g.version};continue}
        try{const rec=await getInstallRecord(g.id);if(rec){runtime.installs[g.id]={...rec,state:rec.version&&g.version&&rec.version!==g.version?'update-available':'installed'}}else if(!runtime.installs[g.id])runtime.installs[g.id]={state:'not-installed'}}catch{if(!runtime.installs[g.id])runtime.installs[g.id]={state:'not-installed'}}
      }
      if(storePageActive())renderPage();
      syncStoreApps();
      return runtime.catalog;
    }

    function renderStorageMarkup(state,modern){
      return `<section class="v57-store ${modern?'v57-store-modern':'v57-store-classic'} v57-store-storage"><h1>Game Install Storage</h1><div class="v57-storage-panel"><h2>Default for every Store game</h2><p>DorukStation uses browser storage by default. You can switch the default or override it inside one game's Store page.</p><button data-global-storage="browser" class="${state.globalStorage==='browser'?'active':''}">Browser Storage</button><button data-global-storage="folder" class="${state.globalStorage==='folder'?'active':''}">User Storage Folder</button><button data-store-action="choose-global-folder">Choose User Storage Folder</button><div class="v57-storage-note"><b>Per-game overrides</b><span>Open a game's Store page → Install Storage → choose Use Global, Browser Storage, or User Storage.</span></div></div>${renderSystemFooterMarkup(state,'✕ Select · ○ Back')}</section>`;
    }

    function annotateFocusable(body){
      runtime.focusables=[...body.querySelectorAll('button:not([disabled])')];
      if(!runtime.focusables.length){S.pageIndex=0;return}
      S.pageIndex=Math.max(0,Math.min(runtime.focusables.length-1,Number(S.pageIndex)||0));
      runtime.focusables.forEach((el,i)=>{el.dataset.storeFocusIndex=String(i);el.classList.toggle('focused',i===S.pageIndex);el.addEventListener('mouseenter',()=>{S.pageIndex=i;focusVisual()});el.addEventListener('focus',()=>{S.pageIndex=i;focusVisual()})});
    }
    function focusVisual(){runtime.focusables.forEach((el,i)=>el.classList.toggle('focused',i===S.pageIndex));const el=runtime.focusables[S.pageIndex];try{el?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'})}catch{}}
    function spatialMove(dx,dy){
      const list=runtime.focusables;if(!list.length)return true;const current=list[Math.max(0,Math.min(list.length-1,S.pageIndex))];if(!current){S.pageIndex=0;focusVisual();return true}
      const a=current.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;let best=-1,bestScore=Infinity;
      list.forEach((el,i)=>{if(i===S.pageIndex)return;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,rx=x-ax,ry=y-ay;if(dx&&Math.sign(rx)!==Math.sign(dx))return;if(dy&&Math.sign(ry)!==Math.sign(dy))return;const primary=dx?Math.abs(rx):Math.abs(ry),orth=dx?Math.abs(ry):Math.abs(rx),score=primary+orth*2.15;if(score<bestScore){bestScore=score;best=i}});
      if(best>=0){S.pageIndex=best;try{navSound?.()}catch{}focusVisual()}return true;
    }

    function bindStoreBody(body,view,gameId=''){
      body.querySelectorAll('[data-store-action]').forEach(el=>el.addEventListener('click',async()=>{
        const action=el.dataset.storeAction;
        if(action==='home'){runtime.filter='featured';openStoreHome();}
        else if(action==='search')openStoreSearch();
        else if(action==='downloads')openStoreDownloads();
        else if(action==='storage')openStoreStorage();
        else if(action==='choose-global-folder'){try{await chooseUserFolder(null);await setGlobalStorage('folder');runtime.globalStorage='folder';renderPage()}catch(err){if(err?.name!=='AbortError')showStoreMessage(err?.message||String(err))}}
        else if(action==='primary'&&gameId){const g=gameById(gameId);if(g)await primaryGameAction(g)}
      }));
      body.querySelectorAll('[data-store-cancel]').forEach(el=>el.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();const id=el.dataset.storeCancel;if(cancelGameInstall(id,runtime)){el.disabled=true;el.textContent='Cancelling…'}else showStoreMessage('That download is no longer active.')}));
      body.querySelectorAll('[data-store-filter]').forEach(el=>el.addEventListener('click',()=>{runtime.filter=el.dataset.storeFilter||'featured';S.pageIndex=0;renderPage()}));
      body.querySelectorAll('[data-game-id]').forEach(el=>el.addEventListener('click',()=>openStoreGameDetail(el.dataset.gameId)));
      body.querySelectorAll('[data-store-key]').forEach(el=>el.addEventListener('click',()=>applySearchKey(el.dataset.storeKey)));
      body.querySelectorAll('[data-storage]').forEach(el=>el.addEventListener('click',async()=>{
        if(!gameId)return;const value=el.dataset.storage;
        if(value==='folder'){
          try{await chooseUserFolder(gameId);await setGameStorageOverride(gameId,'folder');runtime.gameOverrides[gameId]='folder'}catch(err){if(err?.name!=='AbortError')showStoreMessage(err?.message||String(err));return}
        }else{await setGameStorageOverride(gameId,value);runtime.gameOverrides[gameId]=value}
        renderPage();
      }));
      body.querySelectorAll('[data-global-storage]').forEach(el=>el.addEventListener('click',async()=>{
        const value=el.dataset.globalStorage;if(value==='folder'){try{await chooseUserFolder(null)}catch(err){if(err?.name!=='AbortError')showStoreMessage(err?.message||String(err));return}}await setGlobalStorage(value);runtime.globalStorage=value;renderPage();
      }));
      annotateFocusable(body);
      if(runtime.catalogError&&!body.querySelector('.v57-catalog-status')){const n=document.createElement('div');n.className='v57-catalog-status';n.textContent=runtime.catalogError;body.querySelector('.v57-store')?.appendChild(n)}
    }
    function makeRenderer(view,gameId=''){
      const fn=body=>{
        runtime.activeView=view;runtime.activeGameId=gameId;document.body.classList.add('v57-store-open');const state=snapshot(),modern=isModern();
        if(view==='home')body.innerHTML=renderStoreHomeMarkup(state,modern);
        else if(view==='search')body.innerHTML=renderStoreSearchMarkup(state,modern,runtime.search);
        else if(view==='downloads')body.innerHTML=renderDownloadsMarkup(state,modern);
        else if(view==='storage')body.innerHTML=renderStorageMarkup(state,modern);
        else if(view==='detail'){const g=gameById(gameId);body.innerHTML=g?renderGameDetailMarkup(state,g,modern):`<div class="v57-store-empty">Game not found.</div>`}
        bindStoreBody(body,view,gameId);
      };fn.__v57Store=true;fn.__v57StoreView=view;fn.__v57GameId=gameId;return fn;
    }
    function openStoreRoot(view,subtitle,renderer){
      try{if(S.pageOpen)S.pageStack=[]}catch{}
      openPage({title:'DorukStation Store',subtitle,icon:'assets/skin/store.png',returnZone:'home',items:[],renderCustom:renderer});
    }
    function openStoreNested(view,subtitle,renderer){openPage({title:view==='downloads'?'Downloads':view==='storage'?'Game Install Storage':view==='search'?'Store Search':'DorukStation Store',subtitle,icon:'assets/skin/store.png',items:[],renderCustom:renderer},true)}
    function openStoreHome(){runtime.search='';S.pageIndex=0;openStoreRoot('home','Browse and install DorukStation games.',makeRenderer('home'));refreshCatalog()}
    function openStoreSearch(query=''){runtime.search=String(query||runtime.search||'');S.pageIndex=0;if(storePageActive())openStoreNested('search','Search the DorukStation game catalog.',makeRenderer('search'));else openStoreRoot('search','Search the DorukStation game catalog.',makeRenderer('search'));}
    function openStoreDownloads(){S.pageIndex=0;if(storePageActive())openStoreNested('downloads','Downloads, installs and updates.',makeRenderer('downloads'));else openStoreRoot('downloads','Downloads, installs and updates.',makeRenderer('downloads'))}
    function openStoreStorage(){S.pageIndex=0;if(storePageActive())openStoreNested('storage','Choose the default install location or override individual games.',makeRenderer('storage'));else openStoreRoot('storage','Choose the default install location or override individual games.',makeRenderer('storage'))}
    function openStoreGameDetail(gameId){const g=gameById(gameId);if(!g)return;S.pageIndex=0;if(storePageActive())openStoreNested('detail',`${g.age} · ${(g.genres||[]).join(' · ')}`,makeRenderer('detail',g.id));else openStoreRoot('detail',`${g.age} · ${(g.genres||[]).join(' · ')}`,makeRenderer('detail',g.id))}
    window.openStoreHome=openStoreHome;window.openStoreSearch=openStoreSearch;window.openStoreDownloads=openStoreDownloads;window.openStoreStorage=openStoreStorage;window.openStoreGameDetail=openStoreGameDetail;

    function applySearchKey(key){if(key==='⌫')runtime.search=runtime.search.slice(0,-1);else if(key==='Space')runtime.search+=' ';else runtime.search+=key;S.pageIndex=0;renderPage();try{if(key==='⌫')v28PlayEvent?.('keyboardBackspace');else v28PlayEvent?.('keyboardKey')}catch{}}
    function showStoreMessage(text){try{showToast?.(text)}catch{console.warn('[DorukStation Store]',text)}}

    async function primaryGameAction(game){
      const state=runtime.installs[game.id]||{state:'not-installed'};
      if(state.state==='downloading'||state.state==='verifying'||state.state==='extracting'){openStoreDownloads();return}
      if(state.state==='installed'||state.state==='update-available'){launchStoreGame(game);return}
      if(!game.packageUrl){showStoreMessage('This Store entry does not have a package URL yet.');return}
      await startInstall(game);
    }
    function launchStoreGame(game){
      if(game.id==='sharps-playroom'){
        const idx=typeof apps!=='undefined'?apps.findIndex(a=>a.id==='sharps-playroom'):-1;if(idx>=0){while(S.pageOpen)backPage();S.zone='home';S.app=idx;render();activate();return}showStoreMessage("Sharp's Playroom is preinstalled, but its playable package is not attached to this shell yet.");return;
      }
      const rec=runtime.installs[game.id];if(!rec||!['installed','update-available'].includes(rec.state)){showStoreMessage('Game is not installed.');return}
      if(!/^https?:$/.test(location.protocol)){showStoreMessage('Installed multi-file games launch from DorukStation on localhost or HTTPS.');return}
      syncStoreApps();const app=apps.find(a=>a.storeGameId===game.id);if(app){while(S.pageOpen)backPage();S.zone='home';S.app=apps.indexOf(app);render();activate()}
    }

    /* Installer is completed below in v0.57; keeping it here means Store UI can
       call a single stateful operation and the shell tile updates immediately. */
    async function startInstall(game){return installGamePackage(game,runtime,()=>{if(storePageActive())renderPage();syncStoreApps()})}

    function syncStoreApps(){
      if(typeof apps==='undefined')return;decorateStoreShellApp(apps.find(a=>a.id==='store'));
      for(let i=apps.length-1;i>=0;i--){const a=apps[i];if((a?.storeManaged&&a.id!=='sharps-playroom')||shouldRemoveLegacyBundledGame(a))apps.splice(i,1)}
      for(const game of runtime.catalog.games){
        if(game.id==='sharps-playroom')continue;const rec=runtime.installs[game.id];if(!rec||rec.state==='not-installed'||rec.state==='failed'||rec.state==='cancelled')continue;
        const existing=apps.find(a=>a.id===game.id);if(existing&&!existing.storeManaged)continue;
        const profileId=(()=>{try{return currentProfile?.id||'default'}catch{return'default'}})();
        const scope=(()=>{try{return navigator.serviceWorker?.controller?.scriptURL?new URL('./',navigator.serviceWorker.controller.scriptURL).href:new URL('./',location.href).href}catch{return location.href}})();
        const app={id:game.id,name:game.name,desc:game.description||'Installed from DorukStation Store.',image:game.icon||'assets/skin/store.png',type:'image',action:rec.state==='installed'||rec.state==='update-available'?'launch':'placeholder',url:virtualGameUrl(scope,profileId,game.id,rec.entry||game.entry),profiled:true,inFolder:true,folderGame:true,storeManaged:true,storeGameId:game.id,installState:rec.state,downloadProgress:gameProgress(rec),live:rec.state==='downloading'?`${installStateLabel(rec.state)} ${Math.round(gameProgress(rec))}%`:'Installed from DorukStation Store.'};
        if(existing)Object.assign(existing,app);else{const lib=apps.findIndex(a=>a.id==='library');apps.splice(lib>=0?lib:apps.length,0,app)}
      }
      try{ensureLibraryLast?.();renderHome?.()}catch{}
    }

    function visibleHomeApps(){
      try{return typeof v40CanUseModernHome==='function'&&v40CanUseModernHome()&&typeof v40CurrentHomeItems==='function'?v40CurrentHomeItems():apps}catch{return typeof apps!=='undefined'?apps:[]}
    }
    function decorateHomeDownloadProgress(){
      const carousel=document.querySelector('#appCarousel');if(!carousel)return;
      const items=visibleHomeApps();carousel.querySelectorAll('.app-tile[data-i]').forEach(tile=>{
        const app=items[Number(tile.dataset.i)],icon=tile.querySelector('.app-icon');if(!app?.storeManaged||!icon)return;
        icon.querySelector('.v57-tile-progress')?.remove();const rec=runtime.installs[app.storeGameId]||{state:app.installState||'not-installed',received:app.downloadProgress||0,total:100};
        const markup=renderTileProgressMarkup(rec);if(markup)icon.insertAdjacentHTML('beforeend',markup);
      });
      const focused=items[Math.max(0,Math.min(items.length-1,S.app||0))];if(focused?.storeManaged){const rec=runtime.installs[focused.storeGameId]||{state:focused.installState};const text=document.querySelector('#startBoxText');if(text&&['queued','downloading','verifying','extracting'].includes(rec.state))text.textContent=homeDownloadLabel(rec)}
    }
    function storeAppByTitle(title){return (typeof apps!=='undefined'?apps:[]).find(app=>app?.storeManaged&&app.name===title)}
    function decorateLibraryDownloadProgress(){
      if(!S.pageOpen||document.querySelector('#pageTitle')?.textContent!=='Library')return;
      const body=document.querySelector('#pageBody');if(!body)return;
      body.querySelectorAll('.v41-classic-tile,.v41-lib-tile').forEach(tile=>{
        const title=tile.querySelector('.v41-classic-title,.v40-page-cover-text b')?.textContent?.trim();const app=storeAppByTitle(title);if(!app)return;
        const rec=runtime.installs[app.storeGameId]||{state:app.installState,received:app.downloadProgress||0,total:100};const host=tile.querySelector('.v41-classic-thumb,.v40-page-cover-art')||tile;
        host.querySelector('.v57-tile-progress')?.remove();const markup=renderTileProgressMarkup(rec);if(markup)host.insertAdjacentHTML('beforeend',markup);
      });
      if(!body.querySelector('.v57-library-footer'))body.insertAdjacentHTML('beforeend',renderSystemFooterMarkup(currentUiState(),'✕ Select · ○ Back · OPTIONS Menu').replace('v57-store-footer','v57-store-footer v57-library-footer'));
    }
    const baseRenderHome=typeof renderHome==='function'?renderHome:null;
    if(baseRenderHome)renderHome=function(...args){const out=baseRenderHome(...args);decorateHomeDownloadProgress();return out};
    const baseOpenLibraryPage=typeof openLibraryPage==='function'?openLibraryPage:null;
    if(baseOpenLibraryPage)openLibraryPage=function(...args){const out=baseOpenLibraryPage(...args);requestAnimationFrame(decorateLibraryDownloadProgress);return out};
    const baseRenderPage=typeof renderPage==='function'?renderPage:null;
    if(baseRenderPage)renderPage=function(...args){const out=baseRenderPage(...args);requestAnimationFrame(decorateLibraryDownloadProgress);return out};

    const baseActivateApp=typeof activateApp==='function'?activateApp:null;
    if(baseActivateApp)activateApp=function(app){if(app?.id==='store'||app?.action==='store'){try{selectSound?.()}catch{}openStoreHome();return}if(storeShellAppActivation(app)==='detail'){try{selectSound?.()}catch{}openStoreGameDetail(app.storeGameId);return}return baseActivateApp(app)};
    const baseActivateQuick=typeof activateQuick==='function'?activateQuick:null;
    if(baseActivateQuick)activateQuick=function(id){if(id==='marketplace'){try{selectSound?.()}catch{}openStoreHome();return}return baseActivateQuick(id)};
    const baseMovePage=typeof movePage==='function'?movePage:null;
    if(baseMovePage)movePage=function(dx,dy){if(storePageActive())return spatialMove(dx,dy);return baseMovePage(dx,dy)};
    const baseActivatePage=typeof activatePage==='function'?activatePage:null;
    if(baseActivatePage)activatePage=function(){if(storePageActive()){runtime.focusables[S.pageIndex]?.click();return}return baseActivatePage()};
    const baseBackPage=typeof backPage==='function'?backPage:null;
    if(baseBackPage)backPage=function(){const out=baseBackPage();requestAnimationFrame(()=>{if(!storePageActive())document.body.classList.remove('v57-store-open')});return out};

    document.addEventListener('keydown',e=>{
      if(!storePageActive()||runtime.activeView!=='search'||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();applySearchKey('⌫');return}
      if(e.key.length===1&&/^[a-z0-9 _-]$/i.test(e.key)){e.preventDefault();e.stopImmediatePropagation();applySearchKey(e.key.toLowerCase())}
    },true);

    refreshCatalog();
  }
  return {DEFAULT_CATALOG_URL,INSTALL_STATES,STORE_DB,Sha256,sha256Hex,slug,normalizeCatalog,hydrateCatalogManifests,filterCatalogByCategory,categoryLabel,isSafePackagePath,resolveStorageTarget,installStateLabel,virtualGameUrl,extractZipEntries,extractZipBlobEntries,storeAppFromGame,validatePackageEntries,formatBytes,formatEta,searchCatalog,progressPercent,homeDownloadLabel,renderTileProgressMarkup,renderStoreHomeMarkup,renderStoreSearchMarkup,renderDownloadsMarkup,renderGameDetailMarkup,renderSystemFooterMarkup,parseVirtualGamePath,mimeForPath,installMetaKey,gameFileKey,openStoreDb,idbGet,idbPut,idbDeletePrefix,getGlobalStorage,setGlobalStorage,getGameStorageOverride,setGameStorageOverride,getInstallRecord,saveInstallRecord,getStoredHandle,storeHandle,chooseUserFolder,ensureWritePermission,resolveFolderHandle,prepareBrowserGameWriter,prepareFolderGameWriter,writeBrowserGame,writeFolderGame,createTempPackageSink,downloadGamePackage,installGamePackage,cancelGameInstall,readInstalledGameFile,registerVfsServiceWorker,shouldRemoveLegacyBundledGame,decorateStoreShellApp,storeShellAppActivation,isStoreManagedPreinstalled,installBrowser};
});
