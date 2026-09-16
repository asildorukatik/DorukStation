'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DorukStationV65=api;
  if(typeof window!=='undefined'&&typeof document!=='undefined'){
    try{api.installBrowser()}catch(err){console.error('[DorukStation v0.65 OS sync]',err)}
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MEDIA_ICONS={
    cd:'assets/system/media/CD-Normal.svg',
    usb:'assets/system/media/External-Icon.svg',
    external:'assets/system/media/External-Icon.svg',
    iso:'assets/system/media/External-Iso_file.svg',
    audio:'assets/system/media/External-Audio.svg',
    eject:'assets/system/media/Eject-Icon.svg',
    cdEject:'assets/system/media/CD-Eject.svg',
    downloading:'assets/system/media/External-Download.svg',
    success:'assets/system/media/External-Success.svg',
    failed:'assets/system/media/External-Fail.svg'
  };
  const ROM_EXTS=new Set(['gb','gbc','gba','nes','sfc','smc','n64','z64','v64','nds','3ds','cia','psx','cue','chd','pbp','iso','cso','wad','rvz','gcz','elf']);
  const NATIVE_EXTS=new Set(['appimage','exe','desktop','jar','sh','x86_64','bin']);
  const HTML_EXTS=new Set(['html','htm']);

  function slug(value){const out=String(value||'game').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return out||'game'}
  function extOf(name){const s=String(name||'').split(/[?#]/)[0],i=s.lastIndexOf('.');return i>=0?s.slice(i+1).toLowerCase():''}
  function detectGameKind(name){const ext=extOf(name);if(HTML_EXTS.has(ext))return 'html';if(ext==='iso')return 'iso';if(ROM_EXTS.has(ext))return 'rom';if(NATIVE_EXTS.has(ext))return 'native';if(ext==='zip'||ext==='dsgame'||ext==='dorukgame')return 'package';return 'file'}
  function mediaBadgeFor(app){if(!app?.externalTemporary)return '';const t=String(app.mediaType||'external').toLowerCase();return MEDIA_ICONS[t]||MEDIA_ICONS.external}
  function isHiddenHelperApp(app){
    if(!app||app.hidden===true||app.systemHelper===true||app.visibility==='hidden')return true;
    if(['handler','runtime','service','codec','emulator','recorder','media-handler'].includes(String(app.role||app.category||'').toLowerCase()))return true;
    if(app.bundledEssential===true&&/\b(vlc|mpv|ffmpeg|obs|recorder|retroarch|dolphin|pcsx2|rpcs3|ppsspp|mame|emulator|codec)\b/i.test(String(app.name||'')))return true;
    return false;
  }
  function normalizeSystemApp(raw){
    const source=raw||{},rawId=slug(source.id||source.appId||source.name||'app');
    return {
      id:`os-${rawId}`,
      osAppId:String(source.id||source.appId||rawId),
      name:String(source.name||source.title||rawId),
      desc:String(source.description||source.desc||'Installed on this device.'),
      live:String(source.live||'Installed on this device.'),
      type:'image',image:String(source.iconUrl||source.icon||'assets/skin/flow/content/library.png'),
      action:'native',nativeLaunch:true,osManaged:true,inFolder:true,
      appKind:String(source.kind||source.category||'app'),
      launchTarget:source.launchTarget||source.command||source.path||'',
      sourceMeta:source
    };
  }
  function normalizeExternalGame(raw){
    const source=raw||{},rawId=slug(source.id||source.gameId||source.name||source.path||'external-game'),media=String(source.mediaType||source.media||'usb').toLowerCase();
    return {
      id:`external-${rawId}`,
      externalGameId:String(source.id||source.gameId||rawId),
      sourceMediaId:String(source.sourceId||source.mediaId||source.mountId||source.deviceId||media),
      name:String(source.name||source.title||rawId),
      desc:String(source.description||`${media==='cd'?'Disc':'External'} game — available while the media is connected.`),
      live:String(source.live||'Temporary external game. Install it to keep it on DorukStation.'),
      type:'image',image:String(source.iconUrl||source.icon||MEDIA_ICONS[media]||MEDIA_ICONS.external),
      action:'native',nativeLaunch:true,externalTemporary:true,mediaType:media,inFolder:false,
      appKind:String(source.kind||detectGameKind(source.fileName||source.path||source.name||'')),
      launchTarget:source.launchTarget||source.path||source.url||'',
      sourceMeta:source,installProgress:null,installState:'external'
    };
  }
  function clampPercent(value){return Math.max(0,Math.min(100,Number(value)||0))}
  function clockMask(percent){const p=clampPercent(percent);if(p>=100)return 'none';return `conic-gradient(from -90deg, transparent 0 ${p}%, rgba(0,0,0,.64) ${p}% 100%)`}

  function installBrowser(){
    if(window.__ds65Installed)return;
    window.__ds65Installed=true;
    window.__dorukstationVersion='0.66';
    document.title='DorukStation — v0.66';

    const runtime={
      mode:'starting',socket:null,requests:new Map(),seq:1,
      snapshot:{wifi:{enabled:true,connected:null,networks:[]},bluetooth:{enabled:true,devices:[]},controllers:[],storage:[],apps:[]},
      grants:{},external:new Map(),listeners:new Map(),mockMediaCounter:0
    };
    const qs=new URLSearchParams(location.search||'');
    const fullMock=qs.get('mock')==='1'||qs.get('dsMock')==='1';
    const forceNative=qs.get('native')==='1'||qs.get('dsNative')==='1';
    const localNativeHost=['127.0.0.1','localhost'].includes(location.hostname)&&location.protocol!=='file:';

    function on(event,fn){if(!runtime.listeners.has(event))runtime.listeners.set(event,new Set());runtime.listeners.get(event).add(fn);return()=>runtime.listeners.get(event)?.delete(fn)}
    function emit(event,payload){for(const fn of runtime.listeners.get(event)||[])try{fn(payload)}catch(err){console.error('[DorukStation event]',event,err)}}
    function sendNative(method,params={}){
      return new Promise((resolve,reject)=>{
        const ws=runtime.socket;if(!ws||ws.readyState!==1){reject(new Error('DorukStationOS bridge is not connected'));return}
        const id=`web-${runtime.seq++}`;runtime.requests.set(id,{resolve,reject,timer:setTimeout(()=>{runtime.requests.delete(id);reject(new Error(`${method} timed out`))},6000)});
        ws.send(JSON.stringify({type:'request',id,method,params}));
      });
    }
    function mockSnapshot(){
      const snap={
        wifi:{enabled:true,connected:{ssid:'DorukStation Wi-Fi',signal:88,security:'WPA2'},networks:[
          {ssid:'DorukStation Wi-Fi',signal:88,security:'WPA2',saved:true,connected:true},
          {ssid:'Guest Network',signal:63,security:'WPA2',saved:false,connected:false},
          {ssid:'Workshop',signal:47,security:'WPA2',saved:true,connected:false}
        ]},
        bluetooth:{enabled:true,devices:[
          {id:'mock-dualsense',name:'DualSense Wireless Controller',kind:'controller',paired:true,trusted:true,connected:true,battery:78},
          {id:'mock-speaker',name:'Bluetooth Speaker',kind:'audio',paired:true,connected:false}
        ]},
        controllers:[{id:'mock-dualsense',name:'DualSense Wireless Controller',connected:true,battery:78}],
        storage:[{id:'local',name:'DorukStation Storage',kind:'internal',freeBytes:192*1024*1024*1024,totalBytes:256*1024*1024*1024}],
        apps:fullMock?[
          {id:'device-game',name:'Device Game (Mock)',kind:'game',iconUrl:'assets/skin/flow/content/library.png'},
          {id:'vlc',name:'VLC media player',role:'media-handler',systemHelper:true,bundledEssential:true},
          {id:'retroarch',name:'RetroArch',role:'emulator',systemHelper:true,bundledEssential:true}
        ]:[
          {id:'vlc',name:'VLC media player',role:'media-handler',systemHelper:true,bundledEssential:true},
          {id:'retroarch',name:'RetroArch',role:'emulator',systemHelper:true,bundledEssential:true}
        ]
      };
      return snap;
    }
    async function mockCall(method,params={}){
      switch(method){
        case 'permissions.request':{
          const caps=Array.isArray(params.capabilities)?params.capabilities:[];for(const c of caps)runtime.grants[c]=true;return {granted:Object.fromEntries(caps.map(c=>[c,true]))};
        }
        case 'system.snapshot':return structuredClone(runtime.snapshot);
        case 'apps.list':return runtime.snapshot.apps||[];
        case 'wifi.scan':return runtime.snapshot.wifi.networks||[];
        case 'wifi.connect':{
          const ssid=String(params.ssid||'');for(const n of runtime.snapshot.wifi.networks||[])n.connected=n.ssid===ssid;const net=(runtime.snapshot.wifi.networks||[]).find(n=>n.ssid===ssid)||{ssid,signal:0,security:''};runtime.snapshot.wifi.connected={...net,connected:true};emit('wifi.snapshot',runtime.snapshot.wifi);return {connected:true,ssid};
        }
        case 'bluetooth.scan':return runtime.snapshot.bluetooth.devices||[];
        case 'bluetooth.connect':{
          const d=(runtime.snapshot.bluetooth.devices||[]).find(x=>String(x.id)===String(params.id));if(d){d.connected=true;emit('bluetooth.snapshot',runtime.snapshot.bluetooth)}return {connected:!!d};
        }
        case 'bluetooth.disconnect':{
          const d=(runtime.snapshot.bluetooth.devices||[]).find(x=>String(x.id)===String(params.id));if(d){d.connected=false;emit('bluetooth.snapshot',runtime.snapshot.bluetooth)}return {connected:false};
        }
        case 'controllers.setAutoConnectPolicy':return {enabled:true,policy:params};
        case 'apps.launch':return {launched:true,id:params.id};
        case 'media.eject':mockRemoveMedia(params.sourceId||params.id);return {ejected:true};
        case 'files.pickAndOpen':return {opened:false,mock:true};
        case 'games.pickAndImport':return {nativePicker:false,mock:true};
        case 'games.installExternal':return mockInstallExternal(params.id||params.gameId);
        default:return {ok:true,mock:true,method,params};
      }
    }
    async function call(method,params={}){return runtime.mode==='native'?sendNative(method,params):mockCall(method,params)}
    async function requestAccess(capabilities){return call('permissions.request',{origin:location.origin||'file://',capabilities})}

    window.DorukOS={
      version:'1',runtime,on,call,requestAccess,
      get mode(){return runtime.mode},
      async getSystemSnapshot(){const snap=await call('system.snapshot');applySnapshot(snap);return snap},
      wifi:{scan:()=>call('wifi.scan'),connect:(ssid,options={})=>call('wifi.connect',{ssid,...options})},
      bluetooth:{scan:()=>call('bluetooth.scan'),connect:id=>call('bluetooth.connect',{id}),disconnect:id=>call('bluetooth.disconnect',{id})},
      apps:{list:()=>call('apps.list'),launch:id=>call('apps.launch',{id})},
      games:{pickAndImport:()=>call('games.pickAndImport'),installExternal:id=>call('games.installExternal',{id})},
      media:{eject:sourceId=>call('media.eject',{sourceId})}
    };

    function handleNativeMessage(message){
      let msg;try{msg=typeof message==='string'?JSON.parse(message):message}catch{return}
      if(msg?.type==='response'&&msg.id&&runtime.requests.has(msg.id)){
        const p=runtime.requests.get(msg.id);clearTimeout(p.timer);runtime.requests.delete(msg.id);if(msg.ok===false)p.reject(new Error(msg.error||'DorukStationOS request failed'));else p.resolve(msg.result);return;
      }
      if(msg?.type==='event'&&msg.event){dispatchOsEvent(msg.event,msg.payload);return}
      if(msg?.event)dispatchOsEvent(msg.event,msg.payload??msg.data);
    }
    function connectNative(){
      if(!(forceNative||localNativeHost)||typeof WebSocket!=='function'){startMock();return}
      let settled=false;const url=qs.get('bridge')||'ws://127.0.0.1:8061/v1';
      try{
        const ws=new WebSocket(url);runtime.socket=ws;
        const fallback=setTimeout(()=>{if(!settled){settled=true;try{ws.close()}catch{}startMock()}},1600);
        ws.addEventListener('open',async()=>{if(settled)return;settled=true;clearTimeout(fallback);runtime.mode='native';emit('bridge.mode','native');await initializeBridge()});
        ws.addEventListener('message',ev=>handleNativeMessage(ev.data));
        ws.addEventListener('close',()=>{if(runtime.mode==='native'){runtime.mode='offline';emit('bridge.mode','offline')}});
        ws.addEventListener('error',()=>{});
      }catch{startMock()}
    }
    function startMock(){runtime.mode='mock';runtime.snapshot=mockSnapshot();emit('bridge.mode','mock');initializeBridge();if(fullMock)setTimeout(()=>{mockInsertUsb();mockInsertCd()},900)}
    async function initializeBridge(){
      try{await requestAccess(['wifi','bluetooth','controllers','audio','storage','apps','games','media','power','system'])}catch{}
      try{await call('controllers.setAutoConnectPolicy',{controller:'DualSense',autoConnectTrusted:true,autoPairWhenPairingMode:true})}catch{}
      try{const snap=await call('system.snapshot');applySnapshot(snap)}catch{}
    }

    function appIndexById(id){try{return apps.findIndex(a=>a.id===id)}catch{return -1}}
    function removeManagedApps(){
      if(typeof apps==='undefined')return;
      for(let i=apps.length-1;i>=0;i--)if(apps[i]?.osManaged&&!apps[i]?.installedExternal)apps.splice(i,1);
    }
    function syncSystemApps(list){
      if(typeof apps==='undefined'||!Array.isArray(list))return;
      removeManagedApps();
      const libIndex=()=>Math.max(0,apps.findIndex(a=>a.id==='library'));
      for(const raw of list){if(isHiddenHelperApp(raw))continue;const app=normalizeSystemApp(raw);if(apps.some(a=>a.id===app.id))continue;apps.splice(libIndex(),0,app)}
      try{ensureLibraryLast()}catch{};safeRender();
    }
    function addExternalGame(raw){
      if(typeof apps==='undefined')return null;const app=normalizeExternalGame(raw),existing=apps.find(a=>a.id===app.id||a.externalGameId===app.externalGameId);
      if(existing){Object.assign(existing,app);runtime.external.set(existing.id,existing);safeRender();return existing}
      const lib=Math.max(0,apps.findIndex(a=>a.id==='library'));apps.splice(lib,0,app);runtime.external.set(app.id,app);try{ensureLibraryLast()}catch{};safeRender();return app;
    }
    function removeExternalGame(payload){
      if(typeof apps==='undefined')return;const id=String(payload?.id||payload?.gameId||'');const source=String(payload?.sourceId||payload?.mediaId||payload?.mountId||'');
      for(let i=apps.length-1;i>=0;i--){const a=apps[i];if(!a?.externalTemporary)continue;if((id&&(a.externalGameId===id||a.id===id||a.id===`external-${slug(id)}`))||(source&&a.sourceMediaId===source)){runtime.external.delete(a.id);apps.splice(i,1)}}
      try{ensureLibraryLast()}catch{};S.app=Math.max(0,Math.min(S.app,apps.length-1));safeRender();
    }
    function updateInstallProgress(payload){
      const id=String(payload?.id||payload?.gameId||payload?.appId||''),p=clampPercent(payload?.progress??payload?.percent??0);
      const app=apps.find(a=>a.id===id||a.externalGameId===id||a.osAppId===id||a.storeGameId===id);if(!app)return;
      app.installProgress=p;app.installState=String(payload?.state||'installing');if(p>=100||app.installState==='installed')finalizeExternalInstall(app,payload);safeRender();
    }
    function finalizeExternalInstall(app,payload={}){
      if(!app)return;app.installProgress=100;app.installState='installed';app.externalTemporary=false;app.installedExternal=true;app.osManaged=true;app.nativeLaunch=true;app.inFolder=true;app.mediaType='';app.sourceMediaId='';app.live='Installed on DorukStation.';app.desc=String(payload.description||app.desc||'Installed on DorukStation.');runtime.external.delete(app.id);
    }
    function installExternal(app){
      if(!app?.externalTemporary||app.installState==='installing')return;app.installState='installing';app.installProgress=0;safeRender();
      call('games.installExternal',{id:app.externalGameId||app.id,sourceId:app.sourceMediaId}).catch(err=>{app.installState='failed';app.installProgress=null;try{pushSystemNotification?.('',`Could not install ${app.name}`,String(err?.message||err),currentProfile)}catch{};safeRender()});
    }
    function applySnapshot(snap){
      if(!snap||typeof snap!=='object')return;runtime.snapshot={...runtime.snapshot,...snap};
      if(Array.isArray(snap.apps))syncSystemApps(snap.apps);
      for(const ext of snap.externalGames||[])addExternalGame(ext);
      emit('snapshot',runtime.snapshot);safeRender();
    }
    function dispatchOsEvent(event,payload){
      switch(event){
        case 'system.snapshot':applySnapshot(payload);break;
        case 'apps.snapshot':syncSystemApps(payload?.apps||payload||[]);break;
        case 'app.installed':case 'apps.installed':syncSystemApps(payload?.apps||runtime.snapshot.apps||[]);break;
        case 'externalGame.added':case 'media.gameAdded':addExternalGame(payload);break;
        case 'externalGame.removed':case 'media.gameRemoved':removeExternalGame(payload);break;
        case 'media.removed':removeExternalGame(payload);break;
        case 'install.started':updateInstallProgress({...payload,progress:0,state:'installing'});break;
        case 'install.progress':updateInstallProgress(payload);break;
        case 'install.completed':updateInstallProgress({...payload,progress:100,state:'installed'});break;
        case 'install.failed':{
          const id=String(payload?.id||payload?.gameId||''),app=apps.find(a=>a.externalGameId===id||a.id===id);if(app){app.installState='failed';app.installProgress=null}safeRender();break;
        }
        case 'wifi.snapshot':runtime.snapshot.wifi=payload||runtime.snapshot.wifi;refreshCurrentSystemPage();break;
        case 'bluetooth.snapshot':runtime.snapshot.bluetooth=payload||runtime.snapshot.bluetooth;refreshCurrentSystemPage();break;
        case 'controllers.snapshot':runtime.snapshot.controllers=payload?.controllers||payload||[];refreshCurrentSystemPage();break;
        case 'storage.snapshot':runtime.snapshot.storage=payload?.storage||payload||[];refreshCurrentSystemPage();break;
        case 'controller.connected':{
          const c=payload||{};if(c.id){const list=runtime.snapshot.controllers||[];const i=list.findIndex(x=>x.id===c.id);if(i>=0)list[i]={...list[i],...c,connected:true};else list.push({...c,connected:true})}try{pushSystemNotification?.('',`${c.name||'Controller'} connected`,c.battery!=null?`${c.battery}% battery`:'Connected by DorukStationOS',currentProfile)}catch{};refreshCurrentSystemPage();break;
        }
      }
      emit(event,payload);
    }

    function mockInstallExternal(id){
      const app=apps.find(a=>a.externalGameId===id||a.id===id||a.id===`external-${slug(id)}`);if(!app)return Promise.resolve({installed:false});
      app.installState='installing';app.installProgress=0;let p=0;const timer=setInterval(()=>{p=Math.min(100,p+5+Math.random()*11);dispatchOsEvent('install.progress',{id:app.externalGameId,progress:p,state:p>=100?'installed':'installing'});if(p>=100)clearInterval(timer)},180);return Promise.resolve({started:true});
    }
    function mockInsertUsb(){runtime.mockMediaCounter++;const sourceId=`mock-usb-${runtime.mockMediaCounter}`;runtime.snapshot.storage.push({id:sourceId,name:'USB Game Drive',kind:'usb',removable:true});dispatchOsEvent('externalGame.added',{id:`usb-demo-${runtime.mockMediaCounter}`,name:'USB Game (Mock)',mediaType:'usb',sourceId,iconUrl:'assets/system/media/External-Icon.svg',kind:'native'});return sourceId}
    function mockInsertCd(){runtime.mockMediaCounter++;const sourceId=`mock-cd-${runtime.mockMediaCounter}`;dispatchOsEvent('externalGame.added',{id:`cd-demo-${runtime.mockMediaCounter}`,name:'Disc Game (Mock)',mediaType:'cd',sourceId,iconUrl:'assets/system/media/CD-Normal.svg',kind:'iso'});return sourceId}
    function mockInsertIso(){runtime.mockMediaCounter++;const sourceId=`mock-iso-${runtime.mockMediaCounter}`;dispatchOsEvent('externalGame.added',{id:`iso-demo-${runtime.mockMediaCounter}`,name:'External ISO (Mock)',mediaType:'iso',sourceId,iconUrl:'assets/system/media/External-Iso_file.svg',kind:'iso'});return sourceId}
    function mockRemoveMedia(sourceId){dispatchOsEvent('media.removed',{sourceId});runtime.snapshot.storage=runtime.snapshot.storage.filter(x=>x.id!==sourceId)}
    window.DorukOSMock={insertUSB:mockInsertUsb,insertCD:mockInsertCd,insertISO:mockInsertIso,removeMedia:mockRemoveMedia,emit:dispatchOsEvent,snapshot:runtime.snapshot};

    function safeRender(){try{if(typeof render==='function')render()}catch{};requestAnimationFrame(()=>{decorateHome();decorateLibrary();adaptStoreProgress()})}
    function refreshCurrentSystemPage(){const title=document.querySelector('#pageTitle')?.textContent;if(title==='Network')openNetworkPage(true);else if(title==='Bluetooth Devices'||title==='Devices')openDevicesPage(true);else if(title==='Storage')openStoragePage(true)}
    function formatBytes(n){let x=Number(n)||0;const u=['B','KB','MB','GB','TB'];let i=0;while(x>=1024&&i<u.length-1){x/=1024;i++}return `${x>=10?x.toFixed(0):x.toFixed(1)} ${u[i]}`}

    function openNetworkPage(refresh=false){
      const wifi=runtime.snapshot.wifi||{},nets=wifi.networks||[];const items=[{title:'Wi-Fi',note:wifi.enabled===false?'Off':'On',disabled:true},{title:'Connection Status',note:wifi.connected?.ssid?`Connected to ${wifi.connected.ssid}`:'Not connected',disabled:true},{title:'Scan for Networks',action:async()=>{try{const n=await call('wifi.scan');if(Array.isArray(n))runtime.snapshot.wifi.networks=n}catch{}openNetworkPage(true)}}];
      for(const n of nets)items.push({title:n.ssid||'Wi-Fi Network',note:`${n.connected?'Connected · ':''}${n.signal!=null?`${Math.round(n.signal)}% · `:''}${n.security||'Open'}`,action:n.connected?undefined:async()=>{try{await call('wifi.connect',{ssid:n.ssid,saved:!!n.saved,interactive:!n.saved});await window.DorukOS.getSystemSnapshot()}catch{}openNetworkPage(true)},disabled:!!n.connected});
      if(refresh&&S.pageOpen&&document.querySelector('#pageTitle')?.textContent==='Network'){S.pageItems=items;S.pageIndex=Math.min(S.pageIndex,Math.max(0,items.length-1));renderPage();return}
      openPage({title:'Network',subtitle:runtime.mode==='native'?'Live data from DorukStationOS.':'OS bridge preview data.',items},true);
    }
    function openDevicesPage(refresh=false){
      const bt=runtime.snapshot.bluetooth||{},controllers=runtime.snapshot.controllers||[],items=[{title:'Bluetooth',note:bt.enabled===false?'Off':'On',disabled:true},{title:'DualSense Auto-Connect',note:'On — trusted DualSense controllers reconnect automatically',disabled:true},{title:'Scan for Bluetooth Devices',action:async()=>{try{const d=await call('bluetooth.scan');if(Array.isArray(d))runtime.snapshot.bluetooth.devices=d}catch{}openDevicesPage(true)}}];
      for(const c of controllers)items.push({title:c.name||'Controller',note:`${c.connected?'Connected':'Disconnected'}${c.battery!=null?` · ${c.battery}%`:''}`,disabled:true});
      for(const d of bt.devices||[]){if(controllers.some(c=>c.id===d.id))continue;items.push({title:d.name||'Bluetooth Device',note:`${d.connected?'Connected':'Available'}${d.paired?' · Paired':''}`,action:()=>call(d.connected?'bluetooth.disconnect':'bluetooth.connect',{id:d.id}).then(()=>window.DorukOS.getSystemSnapshot()).then(()=>openDevicesPage(true))})}
      if(refresh&&S.pageOpen&&['Bluetooth Devices','Devices'].includes(document.querySelector('#pageTitle')?.textContent)){S.pageItems=items;S.pageIndex=Math.min(S.pageIndex,Math.max(0,items.length-1));renderPage();return}
      openPage({title:'Bluetooth Devices',subtitle:runtime.mode==='native'?'Live data from DorukStationOS.':'OS bridge preview data.',items},true);
    }
    function openStoragePage(refresh=false){
      const items=(runtime.snapshot.storage||[]).map(d=>({title:d.name||d.id||'Storage',note:d.totalBytes?`${formatBytes(d.freeBytes)} free of ${formatBytes(d.totalBytes)}${d.removable?' · External':''}`:(d.removable?'External storage':'Storage'),disabled:true}));
      items.unshift({title:'User Folder',note:typeof folderForProfile==='function'?folderForProfile(currentProfile):'users/',disabled:true});
      if(refresh&&S.pageOpen&&document.querySelector('#pageTitle')?.textContent==='Storage'){S.pageItems=items;S.pageIndex=Math.min(S.pageIndex,Math.max(0,items.length-1));renderPage();return}
      openPage({title:'Storage',subtitle:runtime.mode==='native'?'DorukStationOS storage devices.':'OS bridge preview data.',items},true);
    }

    const baseOpenSettings=typeof openSettingsPage==='function'?openSettingsPage:null;
    if(baseOpenSettings)openSettingsPage=function(){
      const items=[
        {title:"User's Guide / Helpful Info",icon:'ⓘ',action:()=>openPage({title:'Helpful Info',subtitle:'DorukStation help and controls.',items:[{title:'Home',note:'Short PS press returns to Home',disabled:true},{title:'Quick Menu',note:'Hold PS for 1 second',disabled:true},{title:'Share',note:'Press SHARE',disabled:true}]},true)},
        {title:'Data Handling / Health & Safety',icon:'▣',action:()=>openPage({title:'Data Handling / Health & Safety',subtitle:'Local DorukStation information.',items:[{title:'Local user data',note:'Profiles and shell preferences stay local',disabled:true},{title:'Game saves',note:'Namespaced separately per DorukStation user',disabled:true}]},true)},
        {title:'Accessibility',icon:'◉',action:openAccessibilityPage},{title:'Account Management',icon:'♙',note:S.username,action:openProfilePage},{title:'Parental Controls / Family Management',icon:'♜',note:'Not configured',action:()=>openPage({title:'Parental Controls / Family Management',subtitle:'Prototype placeholder.',items:[{title:'No restrictions configured',disabled:true}]},true)},
        {title:'Login Settings',icon:'♟',action:()=>openPage({title:'Login Settings',subtitle:'Local DorukStation users.',items:[{title:'Switch User',action:()=>{while(S.pageOpen)backPage();showUserSelector()}},{title:'Create User',action:()=>{while(S.pageOpen)backPage();showUserSelector();S.userIndex=profiles.length;renderUserSelector();setTimeout(()=>openCreateChoice(),120)}}]},true)},
        {title:'Network',icon:'◎',note:runtime.snapshot.wifi?.connected?.ssid||'Not connected',action:()=>openNetworkPage(false)},
        {title:'Notifications',icon:'assets/skin/flow/function/notification.png',note:String(notificationLog.length),action:openNotificationsPage},
        {title:'Devices',icon:'assets/skin/flow/function/setting.png',note:`${(runtime.snapshot.controllers||[]).filter(c=>c.connected).length} controller${(runtime.snapshot.controllers||[]).filter(c=>c.connected).length===1?'':'s'}`,action:()=>openDevicesPage(false)},
        {title:'Storage',icon:'▤',note:`${(runtime.snapshot.storage||[]).length} device${(runtime.snapshot.storage||[]).length===1?'':'s'}`,action:()=>openStoragePage(false)},
        {title:'Themes',icon:'✦',note:themeLabel(),action:openThemeRootPage},{title:'Application Saved Data Management',icon:'▥',note:'Per-user',action:()=>openPage({title:'Application Saved Data Management',subtitle:`Saved data for ${S.username}.`,items:[{title:'DorukCraft',note:'Stored separately for this user',disabled:true},{title:'Local games',note:'Each app receives a separate user namespace',disabled:true}]},true)},
        {title:'Sound and Screen',icon:'♪',action:openSoundScreenPage},{title:'System',icon:'⬡',action:openSystemSettingsPage},{title:'Initialization',icon:'◌',action:()=>openPage({title:'Initialization',subtitle:'System reset tools are intentionally protected.',items:[{title:'Restart DorukStation',action:()=>{if(currentProfile?.guest)cleanupGuestSession('restart');location.reload()}},{title:'Replay Startup',action:()=>{backPage();replayBoot()}},{title:'User data reset',note:'Not exposed here to prevent accidental save loss',disabled:true}]},true)}
      ];
      openPage({title:'Settings',subtitle:'',icon:'assets/skin/flow/function/setting.png',returnZone:'top',items,renderCustom:renderPS4Settings});document.body.classList.add('ps4-settings-page');renderPage();
    };

    function appNote(a){if(a.osManaged)return a.installedExternal?'Installed from external media':'Installed on device';if(a.folderGame)return 'Games folder';if(a.userAdded)return 'Imported game';return 'Installed'}
    function appKind(a){if(a.osManaged)return /game|rom|iso/i.test(String(a.appKind||''))?'game':'app';if(a.userAdded)return 'imported';if(a.folderGame)return 'folder';return /dorukcraft|dungeons|flappy/i.test(a.id+' '+a.name)?'game':'app'}
    if(typeof v41BuildLibraryItems==='function')v41BuildLibraryItems=function(){
      const items=apps.filter(a=>a.id!=='library'&&!a.externalTemporary&&!a.systemHelper).map(a=>({title:a.name,note:appNote(a),image:a.image||V40_ALL_APPS_ICON,kind:appKind(a),appId:a.id,action:()=>{while(S.pageOpen)backPage();S.zone='home';S.homeSection='games';const idx=v40GameHomeItems().findIndex(x=>x.id===a.id);S.app=Math.max(0,idx);render()}}));
      items.push({title:'Add a Game',note:'HTML, DorukStation packages, native games, ROMs and ISO/disc images',image:'assets/skin/add.png',kind:'app',action:()=>window.v65OpenGamePicker?.()});
      items.push({title:'Games Folder',note:'Manage global game installs and per-game folders',image:'assets/skin/flow/content/library.png',kind:'folder',action:()=>window.v55OpenGamesFolderInfo?.()});
      items.push({title:'User Folder',note:'Open this user\'s isolated shell and save namespaces',image:'assets/skin/flow/function/profile.png',kind:'folder',action:()=>window.v55OpenUserFolderInfo?.()});
      items.push({title:'PlayStation Plus',note:'Subscription area placeholder',image:'assets/skin/plus.png',kind:'plus',disabled:true});return items;
    };

    const gamePicker=document.querySelector('#gamePicker');
    window.v65OpenGamePicker=async function(){
      if(runtime.mode==='native'){
        try{const out=await call('games.pickAndImport');if(out?.app)dispatchOsEvent('apps.installed',{apps:[...(runtime.snapshot.apps||[]),out.app]});if(out?.cancelled!==false&&out?.nativePicker!==false)return}catch{}
      }
      gamePicker?.click();
    };
    window.v55OpenCustomGamePicker=window.v65OpenGamePicker;
    gamePicker?.addEventListener('change',async()=>{
      const file=gamePicker.files?.[0];if(!file||!currentProfile)return;const kind=detectGameKind(file.name);
      if(kind==='html'){
        const text=await file.text(),meta=typeof v25ExtractHtmlMeta==='function'?v25ExtractHtmlMeta(text,file.name):{title:file.name.replace(/\.html?$/i,''),icon:''},stable=slug(file.name).slice(0,48),id=`local-${stable}-${file.size}`;
        const previous=apps.find(a=>a.userAdded&&a.id===id);if(previous)removeUserApp(previous);
        const app={id,name:meta.title,desc:`Local game: ${file.name}`,live:`Local game for ${S.username}. Browser storage is namespaced to this user.`,type:meta.icon?'image':'custom',image:meta.icon||'',mark:'GAME',action:'launch',sourceHtml:text,userAdded:true,inFolder:true,ownerProfileId:currentProfile.id,appKind:'html'};
        apps.splice(Math.max(0,apps.length-1),0,app);ensureLibraryLast();S.app=apps.indexOf(app);selectSound?.();safeRender();
      }else{
        const app={id:`picked-${slug(file.name)}-${file.size}`,name:file.name.replace(/\.[^.]+$/,''),desc:`${kind.toUpperCase()} game: ${file.name}`,live:'This file type is launched by DorukStationOS and its registered emulator/runtime.',type:'image',image:kind==='iso'?MEDIA_ICONS.iso:MEDIA_ICONS.external,action:'native',nativeLaunch:true,userAdded:true,inFolder:true,ownerProfileId:currentProfile.id,appKind:kind,browserPickedFile:file};
        apps.splice(Math.max(0,apps.length-1),0,app);ensureLibraryLast();S.app=apps.indexOf(app);try{pushSystemNotification?.('',`${app.name} added`,'DorukStationOS will choose the correct runtime when this game is launched.',currentProfile)}catch{};safeRender();
      }
      gamePicker.value='';if(S.pageOpen&&document.querySelector('#pageTitle')?.textContent==='Library')openLibraryPage();
    });

    const baseActivateApp=typeof activateApp==='function'?activateApp:null;
    if(baseActivateApp)activateApp=function(app){
      if(app?.nativeLaunch){try{selectSound?.()}catch{};if(runtime.mode!=='native'&&app.browserPickedFile){try{pushSystemNotification?.('',`${app.name} needs DorukStationOS`,`A ${String(app.appKind||'native').toUpperCase()} game is handed to the OS/emulator in the real build.`,currentProfile)}catch{};return}call('apps.launch',{id:app.osAppId||app.externalGameId||app.id,target:app.launchTarget,kind:app.appKind,external:!!app.externalTemporary}).catch(err=>{try{pushSystemNotification?.('',`Could not open ${app.name}`,String(err?.message||err),currentProfile)}catch{}});return}
      return baseActivateApp(app);
    };

    const baseOptions=typeof options==='function'?options:null;
    if(baseOptions)options=function(){
      if(S.switcher){closeSwitcher();return}if(S.appSurface||S.pageOpen||S.zone!=='home')return;const app=apps[S.app];if(!app)return;const running=runningApps.has(app.id);v28PlayEvent?.('optionOpen');
      const items=[{label:running?'Resume':'Start',action:()=>{closeMenu();activateApp(app)}},{label:'Information',note:app.externalTemporary?'External / temporary':app.osManaged?'Installed on device':app.userAdded?'Local game':'System app',action:()=>showAppInformation(app)}];
      if(app.externalTemporary){items.push({label:app.installState==='installing'?`Installing ${Math.round(app.installProgress||0)}%`:'Install To DorukStation',note:app.installState==='installing'?'Copying to local storage':'Keep this game after the external media is removed',disabled:app.installState==='installing',action:()=>{closeMenu(false);installExternal(app)}});items.push({label:'Eject',note:'Safely eject external media',action:()=>{closeMenu(false);call('media.eject',{sourceId:app.sourceMediaId}).catch(()=>{})}})}
      else if(!app.osManaged){items.push({label:app.inFolder?'Remove from Games folder':'Add to Games folder',action:()=>{app.inFolder=!app.inFolder;v18SaveFolderPrefs?.();closeMenu();render()}})}
      items.push({sep:true},{label:'Close background app',disabled:!running,action:()=>{closeRunningApp(app.id);closeMenu();render()}});
      if(app.userAdded&&!app.osManaged)items.push({label:'Delete',action:()=>removeUserApp(app)});
      openAppMenu(app.name,items);
    };
    if(typeof showAppInformation==='function')showAppInformation=function(app){
      const type=app.externalTemporary?`External ${String(app.mediaType||'media').toUpperCase()}`:app.osManaged?'Installed device app':app.userAdded?`Local ${String(app.appKind||'game').toUpperCase()}`:'System / built-in';
      openAppMenu('Information',[{label:'Name',note:app.name,disabled:true},{label:'Type',note:type,disabled:true},{label:'Running',note:runningApps.has(app.id)?'Yes':'No',disabled:true},{label:'Location',note:app.externalTemporary?'External media':app.osManaged?'DorukStation storage':'Games folder / user import',disabled:true}]);
    };

    const baseRenderHome=typeof renderHome==='function'?renderHome:null;
    if(baseRenderHome)renderHome=function(...args){const out=baseRenderHome(...args);document.title='DorukStation — v0.66';requestAnimationFrame(()=>{decorateHome();adaptStoreProgress()});return out};
    const baseRenderPage=typeof renderPage==='function'?renderPage:null;
    if(baseRenderPage)renderPage=function(...args){const out=baseRenderPage(...args);requestAnimationFrame(()=>{decorateLibrary();adaptStoreProgress()});return out};
    const baseOpenLibrary=typeof openLibraryPage==='function'?openLibraryPage:null;
    if(baseOpenLibrary)openLibraryPage=function(...args){
      /* v0.41's Library builder is closure-scoped. Temporarily remove external
         media entries while it snapshots the Library, then restore them to Home. */
      const external=[];if(typeof apps!=='undefined')for(let i=apps.length-1;i>=0;i--)if(apps[i]?.externalTemporary)external.unshift(apps.splice(i,1)[0]);
      let out;try{out=baseOpenLibrary(...args)}finally{if(typeof apps!=='undefined'&&external.length){const lib=Math.max(0,apps.findIndex(a=>a.id==='library'));apps.splice(lib,0,...external);try{ensureLibraryLast()}catch{}}}
      requestAnimationFrame(decorateLibrary);return out;
    };

    function progressOverlayMarkup(app){const p=clampPercent(app.installProgress);return `<div class="v65-install-progress" style="--ds-progress:${p}%;--ds-angle:${p*3.6}deg" aria-label="Installing ${Math.round(p)} percent"><span>${Math.round(p)}%</span></div>`}
    function setClockStyle(el,p){const pct=clampPercent(p);el.style.setProperty('--ds-progress',`${pct}%`);el.style.setProperty('--ds-angle',`${pct*3.6}deg`);el.classList.toggle('v65-complete',pct>=100)}
    function decorateHome(){
      const carousel=document.querySelector('#appCarousel');if(!carousel||typeof v40CurrentHomeItems!=='function'&&typeof apps==='undefined')return;const items=typeof v40CurrentHomeItems==='function'?v40CurrentHomeItems():apps;
      carousel.querySelectorAll('.app-tile[data-i]').forEach(tile=>{const app=items[Number(tile.dataset.i)],icon=tile.querySelector('.app-icon');if(!app||!icon)return;icon.querySelector('.v65-media-badge')?.remove();icon.querySelector('.v65-install-progress')?.remove();const badge=mediaBadgeFor(app);if(badge)icon.insertAdjacentHTML('beforeend',`<img class="v65-media-badge" src="${badge}" alt="External media">`);if(app.installState==='installing'&&app.installProgress!=null)icon.insertAdjacentHTML('beforeend',progressOverlayMarkup(app))});
      const app=items[Math.max(0,Math.min(items.length-1,S.app||0))];const title=document.querySelector('#appTitle');if(title){title.querySelector('.v65-title-media-badge')?.remove();const badge=mediaBadgeFor(app);if(badge)title.insertAdjacentHTML('beforeend',`<img class="v65-title-media-badge" src="${badge}" alt="External media">`)}
    }
    function decorateLibrary(){
      if(!S.pageOpen||document.querySelector('#pageTitle')?.textContent!=='Library')return;const body=document.querySelector('#pageBody');if(!body)return;
      body.querySelectorAll('.v41-lib-tile,.v41-classic-tile').forEach(tile=>{const titleEl=tile.querySelector('.v40-page-cover-text b,.v41-classic-title'),name=titleEl?.textContent?.trim(),app=apps.find(a=>a.name===name);if(!app)return;titleEl?.querySelector('.v65-title-media-badge')?.remove();const badge=mediaBadgeFor(app);if(badge)titleEl?.insertAdjacentHTML('beforeend',`<img class="v65-title-media-badge" src="${badge}" alt="External media">`)});
    }
    function adaptStoreProgress(){
      document.querySelectorAll('.v57-tile-progress').forEach(el=>{const w=el.querySelector('.v57-tile-progress-track>i')?.style?.width||'0',p=parseFloat(w)||0;setClockStyle(el,p)});
      document.querySelectorAll('.v57-card-progress').forEach(el=>{const w=el.querySelector('i')?.style?.width||'0',p=parseFloat(w)||0;setClockStyle(el,p)});
    }

    const baseUpdateDebug=typeof updateDebug==='function'?updateDebug:null;
    if(baseUpdateDebug)updateDebug=function(...args){const out=baseUpdateDebug(...args),d=document.querySelector('#debug');if(d&&!d.classList.contains('hidden')){d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.66');if(!d.textContent.includes('osBridge=v65'))d.textContent+=`\nosBridge=v65 mode=${runtime.mode} external=${runtime.external.size} dualSenseAutoConnect=on`}return out};

    if(fullMock){window.addEventListener('keydown',e=>{if(e.key==='F8'){e.preventDefault();mockInsertUsb()}else if(e.key==='F9'){e.preventDefault();mockInsertCd()}else if(e.key==='F10'){e.preventDefault();mockInsertIso()}},true)}
    connectNative();
  }

  return {MEDIA_ICONS,slug,extOf,detectGameKind,mediaBadgeFor,isHiddenHelperApp,normalizeSystemApp,normalizeExternalGame,clockMask,installBrowser};
});
