/* DorukStation Web v0.67 — device role startup + GitHub Pages E-Controller */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.installBrowser(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const ROLE_KEY='ds-v67-device-role';
  const VALID_ROLES=new Set(['station','controller','permanent-station']);

  function normalizeDeviceRole(value){
    const v=String(value||'').trim().toLowerCase();
    return VALID_ROLES.has(v)?v:'';
  }
  function inputModeFromActivation(info={}){
    if(info.source==='gamepad')return 'controller';
    if(info.source==='keyboard')return 'pc';
    if(info.source==='pointer')return info.pointerType==='touch'||info.pointerType==='pen'?'mobile':'pc';
    return 'pc';
  }
  function shouldShowHostPairingUi(state={}){
    const role=normalizeDeviceRole(state.sessionRole);
    if(role!=='station'&&role!=='permanent-station')return false;
    if(state.loggedIn===false)return false;
    if(state.zone&&state.zone!=='home')return false;
    if(state.appSurface||state.pageOpen||state.quickMenuOpen||state.shareMenuOpen||state.userSelectOpen||state.createChoiceOpen||state.createUserOpen)return false;
    return true;
  }
  function permanentStationGateCopy(){
    return {
      title:'Press any input to play',
      top:'No controller is required. Use touch, keyboard / mouse, or a controller.',
      hint:'Touch → Mobile · Keyboard / Mouse → PC · Controller → Controller',
      status:'Permanent DorukStation mode. Change it any time in Settings → Device Role.'
    };
  }
  function normalizePairingCode(value){
    const digits=String(value||'').replace(/\D/g,'').slice(0,6);
    return digits.length===6?digits:'';
  }
  function peerIdForCode(code){
    const clean=normalizePairingCode(code);
    return clean?`dorukstation-econtroller-${clean}`:'';
  }
  function normalizeStationId(value){
    const clean=String(value||'').trim().toUpperCase();
    return /^[A-Z]{4}$/.test(clean)?clean:'';
  }
  function stationDisplayNameForId(value){
    const id=normalizeStationId(value);
    return id?`DorukStation - ${id}`:'DorukStation';
  }
  function normalizeDiscoveryTransport(value){
    const v=String(value||'').trim().toLowerCase();
    return v==='lan'||v==='bluetooth'||v==='web'?v:'';
  }
  function mergeDiscoveredStation(map,station={}){
    if(!(map instanceof Map))return null;
    const instanceId=String(station.instanceId||'').trim();
    const stationId=normalizeStationId(station.stationId);
    const transport=normalizeDiscoveryTransport(station.transport);
    if(!instanceId||!stationId||!transport)return null;
    let key=instanceId,existing=map.get(instanceId)||null;
    if(!existing){
      for(const [candidateKey,candidate] of map.entries()){
        if(normalizeStationId(candidate?.stationId)===stationId){key=candidateKey;existing=candidate;break}
      }
    }
    existing=existing||{instanceId,stationId,code:'',name:stationDisplayNameForId(stationId),transports:new Set()};
    if(!(existing.transports instanceof Set))existing.transports=new Set(existing.transports||[]);
    existing.stationId=stationId;
    existing.name=String(station.name||existing.name||stationDisplayNameForId(stationId));
    const code=normalizePairingCode(station.code);if(code)existing.code=code;
    existing.transports.add(transport);
    if(station.bluetoothDevice)existing.bluetoothDevice=station.bluetoothDevice;
    map.set(key,existing);
    return existing;
  }
  function isValidDiscoveryResponse(msg,expectedNonce){
    if(!msg||typeof msg!=='object'||msg.type!=='station-available'||msg.protocol!==2)return false;
    if(!expectedNonce||String(msg.searchNonce||'')!==String(expectedNonce))return false;
    if(!normalizeStationId(msg.stationId)||!normalizePairingCode(msg.code))return false;
    if(!String(msg.instanceId||'').trim())return false;
    return true;
  }
  function normalizeBatteryPercent(value){
    if(value===null||value===undefined||value==='')return null;
    let n=Number(value);if(!Number.isFinite(n))return null;if(n>=0&&n<=1)n*=100;
    return Math.max(0,Math.min(100,Math.round(n)));
  }
  function controllerDeviceName(label){
    const clean=String(label||'').trim().replace(/\s*E-Controller\s*$/i,'').trim();
    return clean||'Device';
  }
  function disconnectingTitle(label){return `E-Controller ${controllerDeviceName(label)} is disconnecting!`}
  function disconnectedTitle(label){return `E-Controller ${controllerDeviceName(label)} Disconnected`}
  function clamp(n,min,max){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):0}
  function createRemoteGamepad(index,name='E-Controller'){
    return {
      id:String(name||'E-Controller'),index:Number(index)||0,connected:true,mapping:'standard',timestamp:0,
      axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0})),
      vibrationActuator:null,hapticActuators:[]
    };
  }
  function applyRemoteState(pad,state={}){
    if(!pad)return pad;
    const axes=Array.isArray(state.axes)?state.axes:[];
    for(let i=0;i<4;i++)pad.axes[i]=clamp(axes[i]||0,-1,1);
    const buttons=Array.isArray(state.buttons)?state.buttons:[];
    for(let i=0;i<17;i++){
      const raw=buttons[i];
      const value=typeof raw==='object'&&raw!==null?clamp(raw.value??(raw.pressed?1:0),0,1):clamp(raw||0,0,1);
      const pressed=typeof raw==='object'&&raw!==null?!!raw.pressed||value>.5:value>.5;
      const touched=typeof raw==='object'&&raw!==null?raw.touched!==false&&value>0:value>0;
      const b=pad.buttons[i]||(pad.buttons[i]={pressed:false,touched:false,value:0});
      b.value=value;b.pressed=pressed;b.touched=touched;
    }
    pad.timestamp=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
    return pad;
  }

  function installBrowser(win){
    const doc=win.document;
    win.__dorukstationVersion='0.67';
    doc.title='DorukStation — v0.67';

    const roleGate=doc.getElementById('deviceRoleGate');
    const roleButtons=[...doc.querySelectorAll('[data-v67-role]')];
    const pairOverlay=doc.getElementById('eControllerPair');
    const pairForm=doc.getElementById('eControllerPairForm');
    const pairInput=doc.getElementById('eControllerPairCode');
    const pairStatus=doc.getElementById('eControllerPairStatus');
    const pairTitle=doc.getElementById('eControllerPairTitle');
    const pairHelp=doc.getElementById('eControllerPairHelp');
    const refreshLanButton=doc.getElementById('eControllerRefreshLan');
    const bluetoothSearchButton=doc.getElementById('eControllerSearchBluetooth');
    const discoveryResults=doc.getElementById('eControllerDiscoveryResults');
    const codeFallback=doc.getElementById('eControllerCodeFallback');
    const pairBack=doc.getElementById('eControllerBackToRoles');
    const approval=doc.getElementById('eControllerApproval');
    const approvalTitle=doc.getElementById('eControllerApprovalTitle');
    const approvalText=doc.getElementById('eControllerApprovalText');
    const approvalAccept=doc.getElementById('eControllerAccept');
    const approvalDecline=doc.getElementById('eControllerDecline');
    const hostBadge=doc.getElementById('eControllerHostBadge');
    const hostCode=doc.getElementById('eControllerHostCode');
    const hostStatus=doc.getElementById('eControllerHostStatus');
    const hostStationIdEl=doc.getElementById('eControllerHostStationId');
    const controllerLiveStatus=doc.getElementById('eControllerLiveStatus');
    const controllerDisconnect=doc.getElementById('eControllerDisconnect');
    const mobileControls=doc.getElementById('mobileControls');

    const nativeGetGamepads=typeof navigator.getGamepads==='function'?navigator.getGamepads.bind(navigator):()=>[];
    const remotePads=new Map(); // index -> {pad, conn, label}
    const remoteByConn=new Map();
    let sessionRole='';
    let roleChosen=false;
    let roleFocus=0;
    let roleGamepadLast=[];
    let roleAxisLatched=false;
    let hostPeer=null;
    let hostPairingCode='';
    let controllerPeer=null;
    let controllerConn=null;
    let controllerConnected=false;
    let controllerStateLast='';
    let controllerStateLastSent=0;
    let controllerBatteryManager=null;
    let controllerBatteryHandler=null;
    let disconnectHoldTimer=null;
    let disconnectFallbackTimer=null;
    let disconnectHoldActive=false;
    let approvalQueue=[];
    let activeApproval=null;
    let hostRetryTimer=null;
    let discoveryChannel=null;
    let discoverySearchTimer=null;
    let discoveryFallbackTimer=null;
    let currentSearchNonce='';
    const discoveredStations=new Map();
    let hostStationId='';
    let hostInstanceId='';
    const DISCOVERY_CHANNEL='dorukstation-econtroller-discovery-v2';

    function setHidden(el,hidden){if(el)el.classList.toggle('hidden',!!hidden)}
    function safeCall(fn,...args){try{return typeof fn==='function'?fn(...args):undefined}catch(err){console.warn('[v0.67]',err);return undefined}}
    function permanentSaved(){try{return localStorage.getItem(ROLE_KEY)==='permanent-station'}catch{return false}}
    function savePermanent(on){try{if(on)localStorage.setItem(ROLE_KEY,'permanent-station');else localStorage.removeItem(ROLE_KEY)}catch{}}
    function setPairStatus(text,error=false){if(!pairStatus)return;pairStatus.textContent=text;pairStatus.classList.toggle('error',!!error)}
    function setControllerStatus(text){if(controllerLiveStatus){controllerLiveStatus.textContent=text;setHidden(controllerLiveStatus,false)}}
    function deviceLabel(){const ua=navigator.userAgent||'';if(/iPhone/i.test(ua))return 'iPhone E-Controller';if(/iPad/i.test(ua))return 'iPad E-Controller';if(/Android/i.test(ua))return 'Android E-Controller';if(/Mobile/i.test(ua))return 'Mobile E-Controller';return 'E-Controller';}

    function systemNotice(kind,title,text,profile){try{if(typeof pushSystemNotification==='function')pushSystemNotification(kind||'',title,text,profile??(typeof currentProfile!=='undefined'?currentProfile:null))}catch{}}
    function itemBatteryText(item){const p=normalizeBatteryPercent(item?.pad?.batteryPercent);return p===null?'Battery unavailable':`${p}% battery`}
    function updateRemoteSnapshot(item,connected=true){
      try{
        const list=win.DorukOSMock?.snapshot?.controllers;if(!Array.isArray(list)||!item)return;
        const id=`econtroller-${item.index}`,battery=normalizeBatteryPercent(item.pad?.batteryPercent);
        const data={id,name:item.label||'E-Controller',connected:!!connected,battery};
        const at=list.findIndex(x=>x?.id===id);if(at>=0)list[at]={...list[at],...data};else list.push(data);
      }catch{}
    }
    function updateHostConnectedStatus(){
      if(!hostStatus)return;
      if(!remotePads.size){hostStatus.textContent='Ready for E-Controller';return}
      if(remotePads.size===1){const item=[...remotePads.values()][0];hostStatus.textContent=`${item.label} · ${itemBatteryText(item)}`;return}
      hostStatus.textContent=`${remotePads.size} connected`;
    }

    function randomToken(){
      try{return win.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}catch{return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}
    }
    function randomStationId(){
      const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';let out='';
      for(let i=0;i<4;i++)out+=letters[Math.floor(Math.random()*letters.length)];
      return out;
    }
    function ensureStationIdentity(forceNew=false){
      if(!hostInstanceId)hostInstanceId=randomToken();
      if(!forceNew&&hostStationId)return hostStationId;
      let saved='';try{saved=normalizeStationId(win.sessionStorage?.getItem('ds-v67-station-id'))}catch{}
      if(forceNew){const previous=hostStationId;do{hostStationId=randomStationId()}while(hostStationId===previous)}
      else hostStationId=saved||randomStationId();
      try{win.sessionStorage?.setItem('ds-v67-station-id',hostStationId)}catch{}
      if(hostStationIdEl)hostStationIdEl.textContent=stationDisplayNameForId(hostStationId);
      return hostStationId;
    }
    function stationDisplayName(){return stationDisplayNameForId(ensureStationIdentity())}
    function stationHomeState(){
      let state={sessionRole,zone:'',appSurface:false,pageOpen:false,quickMenuOpen:false,shareMenuOpen:false,userSelectOpen:false,createChoiceOpen:false,createUserOpen:false,loggedIn:true};
      try{state.loggedIn=typeof currentProfile!=='undefined'&&!!currentProfile}catch{}
      try{if(typeof S!=='undefined'){state.zone=S.zone||'';state.appSurface=!!S.appSurface;state.pageOpen=!!S.pageOpen;state.quickMenuOpen=!!S.quickMenuOpen;state.shareMenuOpen=!!S.shareMenuOpen;state.userSelectOpen=!!S.userSelectOpen;state.createChoiceOpen=!!S.createChoiceOpen;state.createUserOpen=!!S.createUserOpen}}catch{}
      return state;
    }
    function isStationHome(){return shouldShowHostPairingUi(stationHomeState())}
    function syncHostPairingUi(){
      const visible=isStationHome();
      setHidden(hostBadge,!visible);
      if(visible)ensureStationIdentity();
      if(!visible)setHidden(approval,true);
      else if(!activeApproval)setTimeout(showNextApproval,0);
    }
    function transportBadgeLabel(transport){
      if(transport==='lan')return 'LAN (web-local)';
      if(transport==='bluetooth')return 'Bluetooth';
      if(transport==='web')return 'Web';
      return transport;
    }
    function renderDiscoveryResults(searchFinished=false){
      if(!discoveryResults)return;
      discoveryResults.textContent='';
      const stations=[...discoveredStations.values()];
      if(!stations.length){
        if(searchFinished){
          const empty=doc.createElement('div');empty.className='v67-discovery-empty';empty.textContent='No browser-visible DorukStations found. Use the six-digit Web code for another device.';discoveryResults.appendChild(empty);setHidden(discoveryResults,false);
        }else setHidden(discoveryResults,true);
        return;
      }
      for(const station of stations){
        const row=doc.createElement('div');row.className='v67-discovery-row';
        const info=doc.createElement('div'),name=doc.createElement('strong'),meta=doc.createElement('small'),badges=doc.createElement('div'),button=doc.createElement('button');
        name.textContent=station.name;meta.textContent=station.code?`Web code ${station.code}`:'Nearby DorukStation';badges.className='v67-transport-badges';
        for(const transport of [...(station.transports||[])]){const badge=doc.createElement('span');badge.className='v67-transport-badge';badge.dataset.transport=transport;badge.textContent=transportBadgeLabel(transport);badges.appendChild(badge)}
        button.type='button';button.textContent='Connect';
        if(station.code)button.addEventListener('click',()=>connectControllerToCode(station.code));
        else{button.addEventListener('click',()=>setPairStatus('Bluetooth discovery is visible in this browser, but web-hosted DorukStation pairing still uses the six-digit Web code.',true))}
        info.append(name,meta,badges);row.append(info,button);discoveryResults.appendChild(row);
      }
      setHidden(discoveryResults,false);
    }
    function setupDiscoveryChannel(){
      if(discoveryChannel||typeof win.BroadcastChannel!=='function')return;
      try{
        discoveryChannel=new win.BroadcastChannel(DISCOVERY_CHANNEL);
        discoveryChannel.addEventListener('message',ev=>{
          const msg=ev?.data;if(!msg||typeof msg!=='object')return;
          if(sessionRole==='station'||sessionRole==='permanent-station'){
            if(msg.type==='discover-station'&&msg.protocol===2&&String(msg.searchNonce||'')){announceStationPresence(String(msg.searchNonce));return}
            if(msg.type==='station-id-conflict'&&msg.protocol===2&&msg.targetInstanceId===hostInstanceId&&String(msg.searchNonce||'')){
              ensureStationIdentity(true);announceStationPresence(String(msg.searchNonce));return;
            }
          }
          if(sessionRole==='controller'&&isValidDiscoveryResponse(msg,currentSearchNonce)){
            const stationId=normalizeStationId(msg.stationId),instanceId=String(msg.instanceId);
            const duplicate=[...discoveredStations.values()].find(x=>x.stationId===stationId&&x.instanceId!==instanceId);
            if(duplicate){
              try{discoveryChannel.postMessage({type:'station-id-conflict',protocol:2,searchNonce:currentSearchNonce,targetInstanceId:instanceId,stationId})}catch{}
              return;
            }
            mergeDiscoveredStation(discoveredStations,{instanceId,stationId,code:normalizePairingCode(msg.code),name:stationDisplayNameForId(stationId),transport:'lan'});
            if(pairTitle)pairTitle.textContent=discoveredStations.size===1?'DorukStation found':'DorukStations found';
            if(pairHelp)pairHelp.textContent='Choose the DorukStation you want to connect to.';
            setPairStatus(`${discoveredStations.size} DorukStation${discoveredStations.size===1?'':'s'} found.`);
            renderDiscoveryResults(false);
          }
        });
      }catch{discoveryChannel=null}
    }
    function announceStationPresence(searchNonce){
      const nonce=String(searchNonce||'');
      if(!nonce||!discoveryChannel||!(sessionRole==='station'||sessionRole==='permanent-station')||!hostPairingCode||!isStationHome())return;
      ensureStationIdentity();
      try{discoveryChannel.postMessage({type:'station-available',name:stationDisplayName(),stationId:hostStationId,instanceId:hostInstanceId,code:hostPairingCode,searchNonce:nonce,protocol:2})}catch{}
    }
    function stopDiscoverySearch(){
      if(discoverySearchTimer){clearInterval(discoverySearchTimer);discoverySearchTimer=null}
      if(discoveryFallbackTimer){clearTimeout(discoveryFallbackTimer);discoveryFallbackTimer=null}
    }
    function removeDiscoveryTransport(transport){
      for(const [key,station] of [...discoveredStations.entries()]){
        station.transports?.delete?.(transport);
        if(!station.transports||station.transports.size===0)discoveredStations.delete(key);
      }
    }
    function resetControllerDiscovery(){
      setupDiscoveryChannel();stopDiscoverySearch();currentSearchNonce='';discoveredStations.clear();renderDiscoveryResults(false);
      if(pairTitle)pairTitle.textContent='Find a DorukStation';
      if(pairHelp)pairHelp.textContent='Searching automatically for browser-visible local DorukStations. For another device, use its six-digit Web code.';
      setPairStatus('Starting local search…');
      if(refreshLanButton){refreshLanButton.disabled=false;refreshLanButton.innerHTML='<span aria-hidden="true">📶</span> Refresh LAN'}
      if(bluetoothSearchButton){bluetoothSearchButton.disabled=false}
      setHidden(codeFallback,false);
    }
    function startControllerDiscovery(){resetControllerDiscovery();setTimeout(()=>startControllerSearch({automatic:true}),40)}
    function startControllerSearch({automatic=false}={}){
      setupDiscoveryChannel();stopDiscoverySearch();removeDiscoveryTransport('lan');renderDiscoveryResults(false);currentSearchNonce=randomToken();
      if(pairTitle)pairTitle.textContent='Searching for DorukStations…';
      if(pairHelp)pairHelp.textContent='Checking browser-visible local DorukStations first. Another phone, laptop, or Raspberry Pi can always connect with the six-digit Web code.';
      setPairStatus(automatic?'Searching automatically…':'Refreshing local search…');
      if(refreshLanButton){refreshLanButton.disabled=true;refreshLanButton.textContent='Searching…'}
      const probe=()=>{try{discoveryChannel?.postMessage({type:'discover-station',protocol:2,searchNonce:currentSearchNonce})}catch{}};
      probe();discoverySearchTimer=setInterval(probe,450);
      discoveryFallbackTimer=setTimeout(()=>{
        if(discoverySearchTimer){clearInterval(discoverySearchTimer);discoverySearchTimer=null}
        discoveryFallbackTimer=null;
        const count=[...discoveredStations.values()].filter(x=>x.transports?.has?.('lan')).length;
        if(refreshLanButton){refreshLanButton.disabled=false;refreshLanButton.innerHTML='<span aria-hidden="true">📶</span> Refresh LAN'}
        if(!count){if(pairTitle)pairTitle.textContent='No local DorukStations found';if(pairHelp)pairHelp.textContent='Static web pages cannot scan every device on your Wi-Fi. Use the six-digit Web code for another device, or try Bluetooth where supported.';setPairStatus('Local web search finished. No browser-visible DorukStations found.');renderDiscoveryResults(discoveredStations.size===0)}
        else{if(pairTitle)pairTitle.textContent=count===1?'DorukStation found':'DorukStations found';setPairStatus(`${count} local DorukStation${count===1?'':'s'} found.`);renderDiscoveryResults(true)}
      },1800);
    }
    async function startBluetoothSearch(){
      if(!bluetoothSearchButton)return;
      const bt=win.navigator?.bluetooth;
      if(!bt||typeof bt.requestDevice!=='function'){
        setPairStatus('Bluetooth search is not available in this browser. Use LAN/web discovery or the six-digit Web code.',true);return;
      }
      bluetoothSearchButton.disabled=true;bluetoothSearchButton.textContent='Searching…';setPairStatus('Opening the browser Bluetooth picker…');
      try{
        const device=await bt.requestDevice({filters:[{namePrefix:'DorukStation - '}]});
        const match=String(device?.name||'').match(/^DorukStation\s*-\s*([A-Z]{4})$/i);
        const stationId=normalizeStationId(match?.[1]);
        if(!stationId){setPairStatus('That Bluetooth device is not advertising a valid DorukStation ID.',true);return}
        const instanceId=`bluetooth-${String(device.id||randomToken())}`;
        mergeDiscoveredStation(discoveredStations,{instanceId,stationId,name:stationDisplayNameForId(stationId),transport:'bluetooth',bluetoothDevice:device});
        if(pairTitle)pairTitle.textContent='DorukStation found';
        setPairStatus(`${stationDisplayNameForId(stationId)} found over Bluetooth. Web-hosted DorukStation still pairs through its Web code.`);
        renderDiscoveryResults(true);
      }catch(err){
        if(String(err?.name||'')==='NotFoundError')setPairStatus('Bluetooth search cancelled.');
        else setPairStatus('Bluetooth search failed in this browser.',true);
      }finally{bluetoothSearchButton.disabled=false;bluetoothSearchButton.innerHTML='<span aria-hidden="true">ᛒ</span> Search Bluetooth'}
    }

    function combinedGamepads(){
      let base=[];try{base=[...(nativeGetGamepads()||[])]}catch{}
      let max=Math.max(base.length-1,...remotePads.keys(),-1);const out=Array.from({length:max+1},(_,i)=>base[i]||null);
      for(const [index,item] of remotePads)out[index]=item.pad;
      return out;
    }
    try{Object.defineProperty(navigator,'getGamepads',{configurable:true,value:combinedGamepads})}catch{try{navigator.getGamepads=combinedGamepads}catch{}}

    function allocateRemoteIndex(){
      const used=new Set();let base=[];try{base=[...(nativeGetGamepads()||[])]}catch{}
      for(const gp of base)if(gp&&Number.isInteger(gp.index))used.add(gp.index);
      for(const i of remotePads.keys())used.add(i);
      for(let i=0;i<32;i++)if(!used.has(i))return i;
      return 32+remotePads.size;
    }
    function syntheticGamepadEvent(type,pad){
      let ev;try{ev=new GamepadEvent(type,{gamepad:pad})}catch{ev=new Event(type);try{Object.defineProperty(ev,'gamepad',{value:pad})}catch{}}
      win.dispatchEvent(ev);
    }
    function sendConn(conn,message){try{if(conn?.open)conn.send(message)}catch(err){console.warn('[v0.67 send]',err)}}
    function attachRumble(pad,conn){
      const rumble=(params={})=>{
        const duration=Math.max(0,Math.min(5000,Number(params.duration)||120));
        const strong=clamp(params.strongMagnitude??params.magnitude??1,0,1),weak=clamp(params.weakMagnitude??params.magnitude??strong,0,1);
        sendConn(conn,{type:'rumble',duration,strong,weak});return Promise.resolve('complete');
      };
      pad.vibrationActuator={type:'dual-rumble',playEffect:(_type,params)=>rumble(params),reset:()=>{sendConn(conn,{type:'rumble-stop'});return Promise.resolve('complete')}};
      pad.hapticActuators=[pad.vibrationActuator];
    }
    function registerRemoteController(conn,label){
      if(remoteByConn.has(conn))return remoteByConn.get(conn);
      const index=allocateRemoteIndex(),pad=createRemoteGamepad(index,label);attachRumble(pad,conn);
      pad.batteryPercent=null;pad.battery={percent:null,charging:false};
      const item={index,pad,conn,label,disconnecting:false,disconnectReason:''};remotePads.set(index,item);remoteByConn.set(conn,item);updateRemoteSnapshot(item,true);
      if(typeof v38SetInputMode==='function'&&typeof v38InputMode==='function'&&v38InputMode()!=='controller')safeCall(v38SetInputMode,'controller',{announce:true});
      syntheticGamepadEvent('gamepadconnected',pad);
      sendConn(conn,{type:'accepted',index});
      sendConn(conn,{type:'user-select',text:'Select a user on DorukStation'});
      updateHostConnectedStatus();
      return item;
    }
    function removeRemoteController(conn,reason='Disconnected'){
      const item=remoteByConn.get(conn);if(!item)return;
      item.pad.connected=false;item.pad.timestamp=(performance?.now?.()||Date.now());
      remoteByConn.delete(conn);remotePads.delete(item.index);updateRemoteSnapshot(item,false);syntheticGamepadEvent('gamepaddisconnected',item.pad);
      updateHostConnectedStatus();
      systemNotice('disconnect',disconnectedTitle(item.label),reason||'E-Controller disconnected.');
      try{if(typeof updateSessionStatus==='function')updateSessionStatus(true)}catch{}
    }

    function randomPairingCode(){return String(Math.floor(100000+Math.random()*900000))}
    function showHostBadge(){syncHostPairingUi()}
    function destroyHostPeer(){if(hostRetryTimer){clearTimeout(hostRetryTimer);hostRetryTimer=null}try{hostPeer?.destroy()}catch{}hostPeer=null}
    function startStationHost(){
      if(!(sessionRole==='station'||sessionRole==='permanent-station'))return;
      setupDiscoveryChannel();showHostBadge();
      if(typeof win.Peer!=='function'){
        hostPairingCode='';if(hostCode)hostCode.textContent='OFFLINE';if(hostStatus)hostStatus.textContent='E-Controller service unavailable';return;
      }
      destroyHostPeer();ensureStationIdentity();hostPairingCode=randomPairingCode();if(hostCode)hostCode.textContent=hostPairingCode;if(hostStationIdEl)hostStationIdEl.textContent=stationDisplayName();if(hostStatus)hostStatus.textContent='Starting…';
      let peer;try{peer=new win.Peer(peerIdForCode(hostPairingCode));hostPeer=peer}catch{if(hostStatus)hostStatus.textContent='Could not start';return}
      peer.on('open',()=>{if(peer!==hostPeer)return;if(hostStatus)hostStatus.textContent='Ready for E-Controller'});
      peer.on('connection',conn=>{
        if(conn?.metadata?.type!=='dorukstation-econtroller'){try{conn.close()}catch{};return}
        queueApproval(conn,String(conn.metadata.deviceName||'E-Controller'));
      });
      peer.on('error',err=>{
        if(peer!==hostPeer)return;
        const type=String(err?.type||'');
        if(type==='unavailable-id'){if(hostStatus)hostStatus.textContent='Generating another code…';try{peer.destroy()}catch{};hostRetryTimer=setTimeout(startStationHost,120);return}
        if(hostStatus)hostStatus.textContent='E-Controller network error';
      });
      peer.on('disconnected',()=>{if(peer===hostPeer&&hostStatus)hostStatus.textContent='Reconnecting…'});
    }

    function queueApproval(conn,label){approvalQueue.push({conn,label});showNextApproval()}
    function showNextApproval(){
      if(activeApproval||!approvalQueue.length||!isStationHome())return;
      activeApproval=approvalQueue.shift();
      if(approvalTitle)approvalTitle.textContent=`Connect to ${activeApproval.label}?`;
      if(approvalText)approvalText.textContent='This device wants to become a new DorukStation controller.';
      setHidden(approval,false);
    }
    function clearApproval(){activeApproval=null;setHidden(approval,true);setTimeout(showNextApproval,0)}
    function finalizeAcceptedApproval(entry){
      const {conn,label}=entry;
      const go=()=>{if(!conn.open)return;const item=registerRemoteController(conn,label);conn.on('data',msg=>handleHostControllerMessage(item,msg));conn.on('close',()=>removeRemoteController(conn,item.disconnectReason||'Connection closed'));conn.on('error',()=>removeRemoteController(conn,'Connection error'));systemNotice('',`E-Controller ${controllerDeviceName(label)} Connected`,'Connected over WebRTC.');};
      if(conn.open)go();else conn.once?.('open',go);
    }
    function handleHostControllerMessage(item,msg){
      if(!item||!msg||typeof msg!=='object')return;
      if(msg.type==='state')applyRemoteState(item.pad,msg.state||msg);
      else if(msg.type==='hello')sendConn(item.conn,{type:'station-status',text:'Connected to DorukStation'});
      else if(msg.type==='battery'){
        const percent=normalizeBatteryPercent(msg.percent);item.pad.batteryPercent=percent;item.pad.battery={percent,charging:!!msg.charging};updateRemoteSnapshot(item,true);updateHostConnectedStatus();
        try{if(typeof updateSessionStatus==='function')updateSessionStatus(true)}catch{}
      }else if(msg.type==='disconnecting'){
        if(!item.disconnecting){item.disconnecting=true;systemNotice('disconnect',disconnectingTitle(item.label),'Keep holding for 2 seconds to disconnect.');}
      }else if(msg.type==='disconnect-cancelled')item.disconnecting=false;
      else if(msg.type==='disconnect-request'){
        item.disconnecting=true;item.disconnectReason='Disconnected from the E-Controller device.';sendConn(item.conn,{type:'disconnect-ack'});setTimeout(()=>{try{item.conn.close()}catch{}},40);
      }
    }
    approvalAccept?.addEventListener('click',()=>{if(!activeApproval)return;const entry=activeApproval;finalizeAcceptedApproval(entry);clearApproval()});
    approvalDecline?.addEventListener('click',()=>{if(!activeApproval)return;sendConn(activeApproval.conn,{type:'rejected',reason:'Connection declined on DorukStation'});try{activeApproval.conn.close()}catch{};clearApproval()});

    function showRoleGate(){
      roleChosen=false;sessionRole='';setHidden(roleGate,false);setHidden(pairOverlay,true);setHidden(hostBadge,true);setHidden(controllerLiveStatus,true);doc.body.classList.remove('v67-econtroller-mode');
      try{v62SetStartupPhase?.('input')}catch{};try{v62HidePreloginSurfacesNow?.()}catch{}
      setRoleFocus(0);
    }
    function setRoleFocus(index){roleFocus=Math.max(0,Math.min(roleButtons.length-1,index));roleButtons.forEach((b,i)=>b.classList.toggle('focused',i===roleFocus));try{roleButtons[roleFocus]?.focus({preventScroll:true})}catch{}}
    function continueStation(mode,gp=null,permanent=false){
      roleChosen=true;sessionRole=permanent?'permanent-station':'station';if(permanent)savePermanent(true);
      setHidden(roleGate,true);doc.body.classList.remove('v67-econtroller-mode');setHidden(controllerLiveStatus,true);
      try{v62SetStartupPhase?.('input')}catch{}
      safeCall(v38SetInputMode,mode,{announce:false});
      startStationHost();
      if(mode==='controller'&&gp){
        try{v29KnownPads?.set(gp.index,gp)}catch{};safeCall(controllerRuntime,gp);safeCall(v29Prime,gp.index);safeCall(showUserSelector,gp.index);
      }else{
        try{v19DebugWithoutController=true}catch{};safeCall(showUserSelector,null);safeCall(v37SyncMobileControls,true);
      }
    }
    function enterPermanentBoot(){
      roleChosen=true;sessionRole='permanent-station';setHidden(roleGate,true);doc.body.classList.remove('v67-econtroller-mode');
      safeCall(v67InitialBase);startStationHost();setTimeout(()=>safeCall(v38UpdateGateCopy),0);
    }
    function enterEController(){
      roleChosen=true;sessionRole='controller';destroyHostPeer();setHidden(roleGate,true);setHidden(hostBadge,true);setHidden(approval,true);setHidden(pairOverlay,false);
      try{v62SetStartupPhase?.('shell')}catch{}
      doc.body.classList.add('v67-econtroller-mode','input-mobile');
      safeCall(v38SetInputMode,'mobile',{announce:false});safeCall(v37SyncMobileControls,true);
      if(mobileControls)setHidden(mobileControls,true);setHidden(controllerLiveStatus,true);
      startControllerDiscovery();
    }
    function chooseRole(role,activation){
      if(roleChosen)return;const r=normalizeDeviceRole(role);if(!r)return;
      if(r==='controller'){enterEController();return}
      const mode=inputModeFromActivation(activation),gp=activation?.gamepad||null;
      continueStation(mode,gp,r==='permanent-station');
    }

    let lastPointerType='mouse';
    roleButtons.forEach((btn,i)=>{
      btn.addEventListener('pointerdown',ev=>{lastPointerType=ev.pointerType||'mouse';setRoleFocus(i)});
      btn.addEventListener('click',ev=>{ev.preventDefault();chooseRole(btn.dataset.v67Role,{source:'pointer',pointerType:lastPointerType})});
      btn.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();chooseRole(btn.dataset.v67Role,{source:'keyboard'})}});
    });

    function roleGamepadFrame(){
      if(roleGate&&!roleGate.classList.contains('hidden')&&!roleChosen){
        let pads=[];try{pads=[...(nativeGetGamepads()||[])].filter(Boolean)}catch{}
        const gp=pads[0];if(gp){
          const b=Array.from(gp.buttons||[],x=>!!x&&(x.pressed||Number(x.value||0)>.45));const edge=i=>!!b[i]&&!roleGamepadLast[i];const y=Number(gp.axes?.[1]||0);
          if(edge(12)||(!roleAxisLatched&&y<-.65)){setRoleFocus(roleFocus-1);roleAxisLatched=true}
          if(edge(13)||(!roleAxisLatched&&y>.65)){setRoleFocus(roleFocus+1);roleAxisLatched=true}
          if(Math.abs(y)<.35)roleAxisLatched=false;
          if(edge(0))chooseRole(roleButtons[roleFocus]?.dataset.v67Role,{source:'gamepad',gamepad:gp});
          roleGamepadLast=b;
        }
      }
      requestAnimationFrame(roleGamepadFrame);
    }
    requestAnimationFrame(roleGamepadFrame);

    function stopControllerBatteryReporter(){
      if(controllerBatteryManager&&controllerBatteryHandler){try{controllerBatteryManager.removeEventListener('levelchange',controllerBatteryHandler);controllerBatteryManager.removeEventListener('chargingchange',controllerBatteryHandler)}catch{}}
      controllerBatteryManager=null;controllerBatteryHandler=null;
    }
    async function startControllerBatteryReporter(){
      stopControllerBatteryReporter();
      if(typeof win.navigator?.getBattery!=='function'){sendConn(controllerConn,{type:'battery',percent:null,charging:false,available:false});return}
      try{
        const battery=await win.navigator.getBattery();if(!controllerConnected||!controllerConn?.open)return;controllerBatteryManager=battery;
        const sendBattery=()=>{const percent=normalizeBatteryPercent(battery.level);sendConn(controllerConn,{type:'battery',percent,charging:!!battery.charging,available:percent!==null});if(controllerConnected&&percent!==null)setControllerStatus(`Connected · ${percent}% battery`)};
        controllerBatteryHandler=sendBattery;battery.addEventListener('levelchange',sendBattery);battery.addEventListener('chargingchange',sendBattery);sendBattery();
      }catch{sendConn(controllerConn,{type:'battery',percent:null,charging:false,available:false})}
    }
    function resetDisconnectHold(sendCancel=false){
      if(disconnectHoldTimer){clearTimeout(disconnectHoldTimer);disconnectHoldTimer=null}if(disconnectFallbackTimer){clearTimeout(disconnectFallbackTimer);disconnectFallbackTimer=null}
      if(sendCancel&&disconnectHoldActive&&controllerConn?.open)sendConn(controllerConn,{type:'disconnect-cancelled'});disconnectHoldActive=false;controllerDisconnect?.classList.remove('holding');
    }
    function disconnectControllerClient(){resetDisconnectHold(false);stopControllerBatteryReporter();try{controllerConn?.close()}catch{};try{controllerPeer?.destroy()}catch{};controllerConn=null;controllerPeer=null;controllerConnected=false;controllerStateLast='';if(controllerDisconnect)setHidden(controllerDisconnect,true);}
    function showPairingAgain(message='Disconnected. Local search will restart automatically.',error=false){
      controllerConnected=false;resetDisconnectHold(false);stopControllerBatteryReporter();if(mobileControls)setHidden(mobileControls,true);if(controllerDisconnect)setHidden(controllerDisconnect,true);setHidden(pairOverlay,false);setHidden(controllerLiveStatus,true);startControllerDiscovery();if(message)setPairStatus(message,error);
    }
    function handleControllerFeedback(msg){
      if(!msg||typeof msg!=='object')return;
      if(msg.type==='accepted'){
        controllerConnected=true;stopDiscoverySearch();setHidden(pairOverlay,true);if(mobileControls)setHidden(mobileControls,false);if(controllerDisconnect)setHidden(controllerDisconnect,false);setControllerStatus('Connected · Select a user on DorukStation');startControllerBatteryReporter();
        try{navigator.vibrate?.(35)}catch{}
      }else if(msg.type==='rejected')showPairingAgain(msg.reason||'Connection declined.',true);
      else if(msg.type==='user-select')setControllerStatus(msg.text||'Select a user on DorukStation');
      else if(msg.type==='user-assigned')setControllerStatus(`Connected · ${msg.user||'User'}`);
      else if(msg.type==='station-status')setControllerStatus(msg.text||'Connected');
      else if(msg.type==='rumble'){
        const d=Math.max(0,Math.min(5000,Number(msg.duration)||100));const power=Math.max(Number(msg.strong)||0,Number(msg.weak)||0);try{if(power>.02)navigator.vibrate?.(d)}catch{}
      }else if(msg.type==='rumble-stop'){try{navigator.vibrate?.(0)}catch{}}
    }
    function connectControllerToCode(rawCode){
      const code=normalizePairingCode(rawCode);if(!code){setPairStatus('Enter the six-digit code shown on DorukStation.',true);return}
      if(typeof win.Peer!=='function'){setPairStatus('E-Controller network service could not load. Check internet access and reload.',true);return}
      disconnectControllerClient();stopDiscoverySearch();if(pairTitle)pairTitle.textContent='Connecting…';setPairStatus('Connecting…');
      let peer;try{peer=new win.Peer();controllerPeer=peer}catch{setPairStatus('Could not start E-Controller networking.',true);return}
      peer.on('open',()=>{
        if(peer!==controllerPeer)return;
        let conn;try{conn=peer.connect(peerIdForCode(code),{reliable:true,metadata:{type:'dorukstation-econtroller',deviceName:deviceLabel(),protocol:1}});controllerConn=conn}catch{showPairingAgain('Could not connect to that DorukStation.',true);return}
        conn.on('open',()=>{setPairStatus('DorukStation found. Waiting for approval…');sendConn(conn,{type:'hello'});});
        conn.on('data',handleControllerFeedback);
        conn.on('close',()=>showPairingAgain('E-Controller Disconnected. Local search will restart automatically.'));
        conn.on('error',()=>showPairingAgain('Connection error. Check the code and try again.',true));
      });
      peer.on('error',err=>{const type=String(err?.type||'');if(type==='peer-unavailable')showPairingAgain('No DorukStation is using that code right now.',true);else showPairingAgain('Could not reach DorukStation. Try again.',true)});
    }
    refreshLanButton?.addEventListener('click',()=>startControllerSearch({automatic:false}));
    bluetoothSearchButton?.addEventListener('click',startBluetoothSearch);
    pairForm?.addEventListener('submit',ev=>{ev.preventDefault();connectControllerToCode(pairInput?.value)});
    pairInput?.addEventListener('input',()=>{const digits=String(pairInput.value||'').replace(/\D/g,'').slice(0,6);if(pairInput.value!==digits)pairInput.value=digits});
    pairBack?.addEventListener('click',()=>{stopDiscoverySearch();disconnectControllerClient();doc.body.classList.remove('v67-econtroller-mode');if(mobileControls)setHidden(mobileControls,true);showRoleGate()});

    function startDisconnectHold(ev){
      if(sessionRole!=='controller'||!controllerConnected||!controllerConn?.open||disconnectHoldActive)return;ev?.preventDefault?.();disconnectHoldActive=true;controllerDisconnect?.classList.add('holding');
      try{if(ev?.pointerId!=null)controllerDisconnect?.setPointerCapture?.(ev.pointerId)}catch{}
      sendConn(controllerConn,{type:'disconnecting'});setControllerStatus('Keep holding… disconnecting in 2 seconds');
      disconnectHoldTimer=setTimeout(()=>{disconnectHoldTimer=null;if(!disconnectHoldActive)return;sendConn(controllerConn,{type:'disconnect-request'});setControllerStatus('Disconnecting…');disconnectFallbackTimer=setTimeout(()=>{try{controllerConn?.close()}catch{}},700)},2000);
    }
    function cancelDisconnectHold(ev){
      if(!disconnectHoldActive||!disconnectHoldTimer)return;ev?.preventDefault?.();resetDisconnectHold(true);setControllerStatus('Connected');
    }
    controllerDisconnect?.addEventListener('pointerdown',startDisconnectHold);
    controllerDisconnect?.addEventListener('pointerup',cancelDisconnectHold);
    controllerDisconnect?.addEventListener('pointercancel',cancelDisconnectHold);
    controllerDisconnect?.addEventListener('lostpointercapture',cancelDisconnectHold);
    controllerDisconnect?.addEventListener('contextmenu',ev=>ev.preventDefault());

    // Existing mobile-control handlers update v37Pad. In E-Controller mode,
    // suppress shell actions and transmit those same pad values remotely.
    const suppressible=['v37MoveDirection','v37Cross','v37Circle','v37Options','v37Share','v37HomeDown','v37HomeUp','v37L1R1','v37ShellStickFrame'];
    for(const name of suppressible){
      const base=win[name];if(typeof base!=='function')continue;
      win[name]=function(...args){if(sessionRole==='controller')return;return base.apply(this,args)};
    }
    const homeButton=doc.querySelector('#mobileControls [data-mc-system="home"]');
    homeButton?.addEventListener('pointerdown',()=>{if(sessionRole==='controller'&&typeof v37ButtonSet==='function')v37ButtonSet(16,true)},true);
    const homeRelease=()=>{if(sessionRole==='controller'&&typeof v37ButtonSet==='function')v37ButtonSet(16,false)};
    homeButton?.addEventListener('pointerup',homeRelease,true);homeButton?.addEventListener('pointercancel',homeRelease,true);homeButton?.addEventListener('lostpointercapture',homeRelease,true);

    function controllerSnapshot(){
      if(typeof v37Pad==='undefined')return {axes:[0,0,0,0],buttons:Array(17).fill(0)};
      return {axes:Array.from(v37Pad.axes||[0,0,0,0],v=>clamp(v,-1,1)),buttons:Array.from({length:17},(_,i)=>clamp(v37Pad.buttons?.[i]?.value||0,0,1))};
    }
    function controllerSendFrame(now){
      if(sessionRole==='controller'&&controllerConnected&&controllerConn?.open){
        const state=controllerSnapshot(),encoded=JSON.stringify(state);
        if(encoded!==controllerStateLast||now-controllerStateLastSent>750){sendConn(controllerConn,{type:'state',state});controllerStateLast=encoded;controllerStateLastSent=now}
      }
      requestAnimationFrame(controllerSendFrame);
    }
    requestAnimationFrame(controllerSendFrame);

    // Report the selected user back to the remote controller that owns the
    // currently active user picker.
    const finishBase=win.finishUserLogin;
    if(typeof finishBase==='function')win.finishUserLogin=function(profile,...rest){
      let selected=null;try{selected=selectingControllerIndex}catch{}
      const out=finishBase.call(this,profile,...rest);
      const item=Number.isInteger(selected)?remotePads.get(selected):null;if(item)sendConn(item.conn,{type:'user-assigned',user:profile?.name||'User'});
      return out;
    };

    // Permanent-station input gate copy. Future boots still accept touch,
    // keyboard/mouse, or gamepad; only the wording changes.
    const gateCopyBase=win.v38UpdateGateCopy;
    if(typeof gateCopyBase==='function')win.v38UpdateGateCopy=function(...args){
      const out=gateCopyBase.apply(this,args);
      if(sessionRole==='permanent-station'){
        const copy=permanentStationGateCopy();
        const title=doc.getElementById('controllerGateHeadline'),top=doc.getElementById('controllerGateTopLine'),hint=doc.getElementById('inputDetectHint'),status=doc.getElementById('inputModeGateStatus');
        if(title)title.textContent=copy.title;
        if(top)top.textContent=copy.top;
        if(hint)hint.textContent=copy.hint;
        if(status)status.textContent=copy.status;
      }
      return out;
    };

    // Settings integration.
    function openDeviceRolePage(){
      const permanent=permanentSaved();
      openPage({title:'Device Role',subtitle:'Choose whether this device should always boot directly into DorukStation.',icon:'assets/skin/flow/function/setting.png',items:[
        {title:'Current Session',note:sessionRole==='controller'?'E-Controller':sessionRole==='permanent-station'?'Permanent DorukStation':'DorukStation',disabled:true},
        {title:'Permanent DorukStation',note:permanent?'On':'Off',action:()=>{savePermanent(!permanent);openDeviceRolePage()}},
        {title:'Show role chooser next launch',note:permanent?'Turn off Permanent DorukStation':'Already enabled',disabled:!permanent,action:permanent?()=>{savePermanent(false);openDeviceRolePage()}:undefined},
        {title:'Restart role selection now',note:'Reload DorukStation and choose DorukStation or E-Controller',action:()=>{savePermanent(false);location.reload()}}
      ]},true);
    }
    win.openDeviceRolePage=openDeviceRolePage;
    const settingsBase=win.openSettingsPage;
    if(typeof settingsBase==='function')win.openSettingsPage=function(...args){
      const out=settingsBase.apply(this,args);
      try{if(S.pageOpen&&doc.getElementById('pageTitle')?.textContent==='Settings'&&!S.pageItems.some(x=>x.title==='Device Role')){const at=Math.max(0,S.pageItems.findIndex(x=>x.title==='Input Mode'));S.pageItems.splice(at>=0?at:0,0,{title:'Device Role',icon:'▣',note:permanentSaved()?'Permanent DorukStation':'Ask on startup',action:openDeviceRolePage});renderPage()}}catch{}
      return out;
    };

    // Keep the displayed build number current even though v0.65 wraps renderHome.
    const renderHomeBase=win.renderHome;if(typeof renderHomeBase==='function')win.renderHome=function(...args){const out=renderHomeBase.apply(this,args);doc.title='DorukStation — v0.67';setTimeout(syncHostPairingUi,0);return out};
    setInterval(syncHostPairingUi,180);
    const debugBase=win.updateDebug;if(typeof debugBase==='function')win.updateDebug=function(...args){const out=debugBase.apply(this,args),d=doc.getElementById('debug');if(d&&!d.classList.contains('hidden')){d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.67');if(!d.textContent.includes('eController=v67'))d.textContent+=`\neController=v67 role=${sessionRole||'chooser'} remotePads=${remotePads.size}`}return out};

    // v0.62 owns the startup animation. Intercept only what happens after the
    // boot screen disappears.
    const v67InitialBase=win.initialControllerLoginSequence;
    win.initialControllerLoginSequence=function(){
      try{v19Ready=true}catch{};try{pendingControllerLogins.splice(0)}catch{};try{selectingControllerIndex=null}catch{}
      if(permanentSaved()){enterPermanentBoot();return}
      showRoleGate();
    };

    // Expose a small diagnostics API for development and the future native bridge.
    win.DorukEController={
      version:2,get role(){return sessionRole},get pairingCode(){return hostPairingCode},get stationId(){return hostStationId},get remoteControllers(){return [...remotePads.values()].map(x=>({index:x.index,name:x.label,connected:x.pad.connected,battery:normalizeBatteryPercent(x.pad.batteryPercent)}))},
      startHost:startStationHost,disconnectAll(){for(const item of [...remotePads.values()])try{item.conn.close()}catch{}},forgetPermanent(){savePermanent(false)}
    };
  }

  return {normalizeDeviceRole,inputModeFromActivation,shouldShowHostPairingUi,permanentStationGateCopy,normalizePairingCode,peerIdForCode,normalizeStationId,stationDisplayNameForId,normalizeDiscoveryTransport,mergeDiscoveredStation,isValidDiscoveryResponse,normalizeBatteryPercent,controllerDeviceName,disconnectingTitle,disconnectedTitle,createRemoteGamepad,applyRemoteState,installBrowser};
});
