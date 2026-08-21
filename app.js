"use strict";

/* ===== v0.25 storage bootstrap =====
   Chrome can expose localStorage differently for file:// documents/iframes.
   Keep the shell alive even if the native getter is denied. Indexed games use
   srcdoc and therefore inherit the shell origin/storage context. */
(function installDorukStationStorageFallback(){
 let nativeStore=null,usable=false;
 try{
  nativeStore=window.localStorage;
  const k="__ds_storage_probe__"+Math.random();nativeStore.setItem(k,"1");nativeStore.removeItem(k);usable=true;
 }catch(e){}
 if(!usable){
  const mem=new Map();
  const api={
   get length(){return mem.size},
   key(i){return [...mem.keys()][Number(i)]??null},
   getItem(k){k=String(k);return mem.has(k)?mem.get(k):null},
   setItem(k,v){mem.set(String(k),String(v))},
   removeItem(k){mem.delete(String(k))},
   clear(){mem.clear()}
  };
  const proxy=new Proxy(api,{ownKeys(){return [...mem.keys()]},getOwnPropertyDescriptor(t,k){if(mem.has(String(k)))return{configurable:true,enumerable:true,writable:true,value:mem.get(String(k))};return Object.getOwnPropertyDescriptor(t,k)||{configurable:true,enumerable:false,writable:false,value:undefined}}});
  try{Object.defineProperty(window,"localStorage",{configurable:true,value:proxy})}catch(e){}
  window.__dorukstationStoragePersistent=false;
 }else window.__dorukstationStoragePersistent=true;
 try{window.__dorukstationStorage=window.localStorage}catch(e){}
})();

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

const FLOW_COLORS=[
 {id:"default",name:"Default",color:"#001D66"},{id:"gold",name:"Gold",color:"#967818"},{id:"steelblue",name:"Steel Blue",color:"#103B59"},{id:"red",name:"Red",color:"#6D0707"},{id:"lightblue",name:"Light Blue",color:"#017387"},{id:"purple",name:"Purple",color:"#3A0060"},{id:"grey",name:"Grey",color:"#232222"},{id:"pink",name:"Pink",color:"#720046"}
];
const PHOTO_THEMES=[
 {id:"battlefield",name:"Battlefield",bg:"assets/themes/battlefield.jpg"},{id:"destiny",name:"Destiny",bg:"assets/themes/destiny.jpg"},{id:"horizon",name:"Horizon Zero Dawn",bg:"assets/themes/horizon.jpg",light:true},{id:"tron",name:"Tron",bg:"assets/themes/tron.jpg"},{id:"until-dawn",name:"Until Dawn",bg:"assets/themes/until-dawn.jpg"},{id:"witcher3",name:"The Witcher 3",bg:"assets/themes/witcher3.jpg"},{id:"anniversary",name:"DorukStation Anniversary",bg:"assets/themes/anniversary.jpg",light:true}
];

const quickItems=[
 {id:"plus",name:"DorukStation Plus",image:"assets/skin/plus.png",subtitle:"Membership hub prototype"},
 {id:"marketplace",name:"DorukStation Store",image:"assets/skin/store.png",subtitle:"Games and applications"},
 {id:"notifications",name:"Notifications",image:"assets/skin/flow/function/notification.png",subtitle:"Invites, achievements and recordings"},
 {id:"friends",name:"Friends",image:"assets/skin/flow/function/friend.png",subtitle:"Friends and activity"},
 {id:"messages",name:"Messages",image:"assets/skin/flow/function/message.png",subtitle:"Messages"},
 {id:"parties",name:"Parties",image:"assets/skin/flow/function/party.png",subtitle:"Voice and parties"},
 {id:"profile",name:"Profile",avatar:true,subtitle:"Local user profile"},
 {id:"trophies",name:"Trophies",image:"assets/skin/flow/function/trophy.png",subtitle:"Achievements and trophies"},
 {id:"settings",name:"Settings",image:"assets/skin/flow/function/setting.png",subtitle:"System and appearance settings"},
 {id:"power",name:"Power",image:"assets/skin/flow/function/power.png",subtitle:"Session and power controls"}
];

let apps=[
 {id:"whatsnew",name:"What's New",desc:"Recent activity, games and DorukStation updates.",image:"assets/skin/now.png",type:"image",action:"news",live:"Your recently used games and shell activity appear here."},
 {id:"browser",name:"Internet Browser",desc:"Open web pages in your normal browser.",image:"assets/skin/flow/content/browser.png",type:"image",action:"browser",live:"External websites open in a normal browser tab."},
 {id:"gallery",name:"Capture Gallery",desc:"Browse screenshots and video clips.",image:"assets/skin/flow/content/gallery.png",type:"image",action:"gallery",live:"Capture integration is prepared for a later native build."},
 {id:"explorer",name:"File Explorer",desc:"Prototype file and media launcher.",type:"files",action:"explorer",live:"The browser cannot freely scan your filesystem without permission."},
 {id:"dorukcraft",name:"DorukCraft",desc:"Play DorukCraft inside DorukStation without leaving the shell.",type:"dorukcraft",action:"remote",url:"games/DorukCraft.html",legacyUrl:"https://asildorukatik.github.io/Minecraft2/",profiled:true,inFolder:true,live:"Runs inside DorukStation. Saves and game storage are isolated to the selected DorukStation user."},
 {id:"livefromps",name:"Live from DorukStation",desc:"Classic DorukStation live content placeholder.",image:"assets/skin/flow/content/livefromps.png",type:"image",action:"placeholder",live:"Uses the skin.orbis Flow content artwork."},
 {id:"shareplay",name:"Share Play",desc:"Share Play-style placeholder.",image:"assets/skin/flow/content/shareplay.png",type:"image",action:"placeholder",live:"A native network implementation can be connected later."},
 {id:"usbmusic",name:"USB Music Player",desc:"USB media player placeholder.",image:"assets/skin/flow/content/usbmusic.png",type:"image",action:"placeholder",live:"Native DorukStation can scan removable media later."},
 {id:"disc",name:"Disc",desc:"Disc/game-media placeholder.",image:"assets/skin/flow/content/disc.png",type:"image",action:"placeholder",live:"Disc detection belongs in the native build."},
 {id:"library",name:"Library",desc:"All games and applications, plus Add HTML App.",image:"assets/skin/flow/content/library.png",type:"image",action:"library",live:"Library is always the far-right Home item."}
];

/* ===== v0.25 games-folder registry =====
   games/manifest.js is generated by refresh-games.py. Folder games are global
   installations; saves remain isolated by DorukStation user at launch time. */
function dsFolderGameApp(g){
 return {
  id:g.id||"html-game",name:g.name||g.title||g.id||"HTML Game",
  desc:`Installed HTML game: ${g.file||"games/"}`,
  live:"Installed from DorukStation's games folder. Save data is isolated to the active user.",
  type:g.icon?"image":"custom",image:g.icon||"",mark:"GAME",action:"launch",
  url:g.file,payloadScript:g.payload,folderGame:true,profiled:true,inFolder:true,banners:Array.isArray(g.banners)?g.banners:[],
  manifestTitle:g.title||g.name||"",manifestSha256:g.sha256||""
 };
}
function dsRegisterFolderGames(){
 const manifest=Array.isArray(window.DorukStationGameManifest)?window.DorukStationGameManifest:[];
 if(!manifest.length)return;
 for(const g of manifest){
  const app=dsFolderGameApp(g);
  if(app.id==="dorukcraft"){
   const i=apps.findIndex(a=>a.id==="dorukcraft");if(i>=0)apps[i]=app;else apps.splice(Math.max(0,apps.length-1),0,app);
  }else if(!apps.some(a=>a.id===app.id))apps.splice(Math.max(0,apps.length-1),0,app);
 }
}
dsRegisterFolderGames();


const PROFILE_LIST_KEY="ds-profiles-v12";
const PROFILE_LAST_KEY="ds-last-profile-v12";
const STALE_GUEST_DB_KEY="ds-stale-guest-dbs-v15";
let currentProfile=null;
let profiles=[];
function safeJSON(text,fallback){try{return JSON.parse(text)}catch{return fallback}}
function folderForProfile(profile){return profile?.folder||`users/${profile?.id||"unselected"}/`}
function ensureProfileFolders(){let changed=false;for(const p of profiles){if(!p.folder){p.folder=`users/${p.id}/`;changed=true}if(p.foldered===undefined){p.foldered=false;changed=true}}if(changed)saveProfiles()}
function saveProfiles(){localStorage.setItem(PROFILE_LIST_KEY,JSON.stringify(profiles))}
function profileKey(key,profile=currentProfile){return profile?`dorukstation:${folderForProfile(profile)}shell/${key}`:`dorukstation:users/unselected/shell/${key}`}
function legacyProfileKey(key,profile=currentProfile){return profile?`ds-profile:${profile.id}:${key}`:`ds-profile:unselected:${key}`}
function pGet(key,fallback=null){
 if(!currentProfile)return fallback;
 if(currentProfile.guest)return guestShellStore.has(key)?guestShellStore.get(key):fallback;
 let v=localStorage.getItem(profileKey(key));
 if(v===null){v=localStorage.getItem(legacyProfileKey(key));if(v!==null)localStorage.setItem(profileKey(key),v)}
 return v===null?fallback:v;
}
function pSet(key,value){if(!currentProfile)return;if(currentProfile.guest){guestShellStore.set(key,String(value));return}localStorage.setItem(profileKey(key),String(value))}
function initProfiles(){
 profiles=safeJSON(localStorage.getItem(PROFILE_LIST_KEY),[]);
 if(!Array.isArray(profiles)||!profiles.length){
   const legacyName=(localStorage.getItem("ds-username-v04")||"Doruk").trim().slice(0,24)||"Doruk";
   const p={id:`user-${Date.now().toString(36)}`,name:legacyName,createdAt:Date.now(),legacy:true};profiles=[p];saveProfiles();
   const migrate=[["theme","ds-theme-v04"],["sounds","ds-sounds-v04"],["animation","ds-animation-v04"]];
   for(const [to,from] of migrate){const v=localStorage.getItem(from);if(v!==null)localStorage.setItem(`ds-profile:${p.id}:${to}`,v)}
 }
 ensureProfileFolders();
 cleanupStaleGuestData();
}
function cleanupStaleGuestData(){
 try{for(const k of Object.keys(localStorage))if(k.startsWith("dorukstation:users/__guest__/"))localStorage.removeItem(k)}catch{}
 const stale=safeJSON(localStorage.getItem(STALE_GUEST_DB_KEY),[]);localStorage.removeItem(STALE_GUEST_DB_KEY);
 if(indexedDB?.databases){indexedDB.databases().then(dbs=>{for(const d of dbs||[])if(d.name&&(d.name.startsWith("dorukstation:users/__guest__/")||stale.includes(d.name)))indexedDB.deleteDatabase(d.name)}).catch(()=>{})}
 else for(const n of stale)try{indexedDB.deleteDatabase(n)}catch{}
}
initProfiles();

const S={
 zone:"home",app:0,quick:0,
 menuIndex:0,menuItems:[],
 pageOpen:false,pageItems:[],pageIndex:0,pageCols:1,pageMode:"list",pageStack:[],pageReturnZone:"home",
 switcher:false,switcherIndex:0,appSurface:false,currentRunningId:null,
 lastButtons:[],axisLatch:false,
 userSelectOpen:false,userIndex:0,createChoiceOpen:false,createChoiceIndex:0,createUserOpen:false,createUserIndex:0,
 quickMenuOpen:false,quickMenuIndex:0,quickMenuPane:"main",quickMenuSubIndex:0,shareMenuOpen:false,shareMenuIndex:0,
 theme:{kind:"flow",id:"default"},sounds:true,animation:true,
 username:"User",customBackground:null
};
const runningApps=new Map();
const notificationLog=[];
const trophyLog=[];
let audioCtx=null;
let psHoldStarted=0,psOpenedThisHold=false,keyboardPsDown=false,keyboardPsTimer=null;
let psPhysicalDown=false,psActiveButton=-1,psLastSeenDown=0,psHoldTimer=null;
let guestShellStore=new Map(),guestDbNames=new Set(),guestControllerLastSeen=0,guestLogoutPending=false;
let rawPsLearningIndex=-1,rawPsLearningStarted=0,rawPsJustLearned=false;
const PS_HOLD_MS=1000,PS_RELEASE_DEBOUNCE_MS=120;

function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}


/* Smooth UI navigation. State changes remain immediate; only the visual layer
   waits a few frames, so controller navigation never feels delayed. */
const UI_TRANSITION_MS=280,UI_EXIT_MS=220;
function uiEl(v){return typeof v==="string"?$(v):v}
function clearUiTimer(el){if(el?._dsUiTimer){clearTimeout(el._dsUiTimer);el._dsUiTimer=null}}
function showUi(v,direction="forward"){
 const el=uiEl(v);if(!el)return;clearUiTimer(el);
 el.classList.remove("hidden","ui-exit-forward","ui-exit-back","ui-enter-forward","ui-enter-back");
 void el.offsetWidth;el.classList.add(direction==="back"?"ui-enter-back":"ui-enter-forward");
 el._dsUiTimer=setTimeout(()=>{el.classList.remove("ui-enter-forward","ui-enter-back");el._dsUiTimer=null},UI_TRANSITION_MS+30);
}
function hideUi(v,direction="forward",after){
 const el=uiEl(v);if(!el){after?.();return}clearUiTimer(el);
 if(el.classList.contains("hidden")){after?.();return}
 el.classList.remove("ui-enter-forward","ui-enter-back","ui-exit-forward","ui-exit-back");
 void el.offsetWidth;el.classList.add(direction==="back"?"ui-exit-back":"ui-exit-forward");
 el._dsUiTimer=setTimeout(()=>{el.classList.add("hidden");el.classList.remove("ui-exit-forward","ui-exit-back");el._dsUiTimer=null;after?.()},UI_EXIT_MS+25);
}
function swapUi(from,to,direction="forward"){
 const a=uiEl(from),b=uiEl(to);hideUi(a,direction);setTimeout(()=>showUi(b,direction),55);
}
function animatePageContent(direction="forward"){
 const body=$("#pageBody");if(!body)return;body.classList.remove("page-forward","page-back");void body.offsetWidth;body.classList.add(direction==="back"?"page-back":"page-forward");
 setTimeout(()=>body.classList.remove("page-forward","page-back"),300);
}
function setUserFlowVisual(open){document.body.classList.toggle("user-flow-open",!!open)}


/* ===== local users / per-user shell state ===== */
const GUEST_AVATAR="assets/skin/flow/function/friend.png";
function loadProfileState(profile){
 currentProfile=profile;
 S.username=profile.name;
 S.theme=safeJSON(pGet("theme",'{"kind":"flow","id":"default"}'),{kind:"flow",id:"default"});
 S.sounds=pGet("sounds","on")!=="off";
 S.animation=pGet("animation","on")!=="off";
 notificationLog.splice(0,notificationLog.length,...safeJSON(pGet("notifications","[]"),[]));
 trophyLog.splice(0,trophyLog.length,...safeJSON(pGet("trophies","[]"),[]));
 if(!profile.guest)localStorage.setItem(PROFILE_LAST_KEY,profile.id);
}
function persistNotifications(){pSet("notifications",JSON.stringify(notificationLog.slice(0,100)))}
function persistTrophies(){pSet("trophies",JSON.stringify(trophyLog.slice(0,200)))}
function resetSessionUserApps(){
 for(const a of [...apps])if(a.userAdded){if(a.objectUrl)URL.revokeObjectURL(a.objectUrl);apps.splice(apps.indexOf(a),1)}
 ensureLibraryLast();S.app=Math.max(0,Math.min(S.app,apps.length-1));
}
function renderUserSelector(){
 const box=$("#userCards");if(!box)return;
 const items=[...profiles,{id:"__add__",name:"Create User",add:true}];
 S.userIndex=Math.max(0,Math.min(S.userIndex,items.length-1));
 box.innerHTML=items.map((p,i)=>`<button class="user-card ${i===S.userIndex?"focused":""}" data-i="${i}">${p.add?'<div class="user-plus" aria-hidden="true">+</div>':`<img src="${GUEST_AVATAR}" alt="Guest avatar">`}<span>${esc(p.name)}</span>${p.add?'<small>New user or temporary guest</small>':`<small>${esc(p.folder||folderForProfile(p))}</small>`}</button>`).join("");
 $$(".user-card").forEach(el=>el.onclick=()=>{S.userIndex=Number(el.dataset.i);activateUserSelection()});
}
function showUserSelector(){
 if(getRunningEntry())closeRunningApp(getRunningEntry().app.id);
 if(currentProfile?.guest)cleanupGuestSession("switch-user");
 currentProfile=null;S.username="User";
 resetSessionUserApps();
 S.userSelectOpen=true;S.createChoiceOpen=false;S.createUserOpen=false;
 hideUi("#createUserChoice","back");hideUi("#createUserView","back");
 const last=localStorage.getItem(PROFILE_LAST_KEY),i=profiles.findIndex(p=>p.id===last);S.userIndex=i>=0?i:0;
 setUserFlowVisual(true);showUi("#userSelect","back");renderUserSelector();
}
function hideUserSelector(direction="forward"){S.userSelectOpen=false;hideUi("#userSelect",direction);setTimeout(()=>setUserFlowVisual(false),UI_EXIT_MS)}
function moveUserSelection(dx){const count=profiles.length+1;S.userIndex=(S.userIndex+dx+count)%count;navSound();renderUserSelector()}
function activateUserSelection(){
 const item=[...profiles,{id:"__add__",name:"Create User",add:true}][S.userIndex];if(!item)return;
 if(item.add){openCreateChoice();return}
 loadProfileState(item);applyTheme();S.zone="home";S.app=0;S.quick=0;render();hideUserSelector("forward");
}
function openCreateChoice(){
 S.userSelectOpen=false;S.createChoiceOpen=true;S.createChoiceIndex=0;setUserFlowVisual(true);
 swapUi("#userSelect","#createUserChoice","forward");renderCreateChoice();
}
function closeCreateChoice(){S.createChoiceOpen=false;S.userSelectOpen=true;swapUi("#createUserChoice","#userSelect","back");renderUserSelector();backSound()}
function renderCreateChoice(){$("#choicePermanent").classList.toggle("focused",S.createChoiceIndex===0);$("#choiceGuest").classList.toggle("focused",S.createChoiceIndex===1)}
function moveCreateChoice(d){S.createChoiceIndex=Math.max(0,Math.min(1,S.createChoiceIndex+d));navSound();renderCreateChoice()}
function activateCreateChoice(){if(S.createChoiceIndex===0)openCreateUser();else startGuestSession()}
function openCreateUser(){
 S.createChoiceOpen=false;S.createUserOpen=true;S.createUserIndex=0;
 swapUi("#createUserChoice","#createUserView","forward");
 $("#createUserName").value="";renderCreateUserFocus();
}
function closeCreateUser(){
 S.createUserOpen=false;S.createChoiceOpen=true;swapUi("#createUserView","#createUserChoice","back");renderCreateChoice();backSound();
}
function renderCreateUserFocus(){
 $("#createNameRow").classList.toggle("focused",S.createUserIndex===0);$("#createUserConfirm").classList.toggle("focused",S.createUserIndex===1);
}
function moveCreateUser(d){S.createUserIndex=Math.max(0,Math.min(1,S.createUserIndex+d));navSound();renderCreateUserFocus()}
function activateCreateUser(){if(S.createUserIndex===0){$("#createUserName").focus();$("#createUserName").select();return}confirmCreateUser()}
function confirmCreateUser(){
 const input=$("#createUserName"),name=input.value.trim();if(!name){S.createUserIndex=0;renderCreateUserFocus();input.focus();return}
 const id=`user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
 const p={id,name:name.slice(0,24),createdAt:Date.now(),folder:`users/${id}/`,foldered:true};
 profiles.push(p);saveProfiles();loadProfileState(p);S.createUserOpen=false;S.userSelectOpen=false;applyTheme();S.zone="home";S.app=0;S.quick=0;render();hideUi("#createUserView","forward");hideUi("#userSelect","forward");setTimeout(()=>setUserFlowVisual(false),UI_EXIT_MS);selectSound();
}
function startGuestSession(){
 const gp=[...(navigator.getGamepads?.()||[])].find(Boolean),id=`guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
 guestShellStore=new Map();guestDbNames=new Set();guestLogoutPending=false;
 const guest={id,name:"Guest",guest:true,createdAt:Date.now(),folder:`users/__guest__/${id}/`,boundGamepadIndex:gp?.index??null};
 if(gp)guestControllerLastSeen=performance.now();
 loadProfileState(guest);S.createChoiceOpen=false;S.userSelectOpen=false;applyTheme();S.zone="home";S.app=0;S.quick=0;render();hideUi("#createUserChoice","forward");hideUi("#userSelect","forward");setTimeout(()=>setUserFlowVisual(false),UI_EXIT_MS);selectSound();
}
function cleanupGuestSession(reason="end"){
 if(!currentProfile?.guest)return;
 const folder=folderForProfile(currentProfile),prefix=`dorukstation:${folder}`;
 try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith(prefix))localStorage.removeItem(k)}}catch{}
 const names=[...guestDbNames];
 try{localStorage.setItem(STALE_GUEST_DB_KEY,JSON.stringify(names))}catch{}
 for(const n of names)try{indexedDB.deleteDatabase(n)}catch{}
 guestShellStore.clear();guestDbNames.clear();
}
function registerGuestDb(name){if(!currentProfile?.guest||!name)return;guestDbNames.add(name);try{localStorage.setItem(STALE_GUEST_DB_KEY,JSON.stringify([...guestDbNames]))}catch{}}
$("#choicePermanent").onclick=()=>{S.createChoiceIndex=0;renderCreateChoice();activateCreateChoice()};
$("#choiceGuest").onclick=()=>{S.createChoiceIndex=1;renderCreateChoice();activateCreateChoice()};
$("#createUserConfirm").onclick=()=>{S.createUserIndex=1;renderCreateUserFocus();confirmCreateUser()};
$("#changeAvatarButton").onclick=()=>{};
$("#createNameRow").onclick=()=>{S.createUserIndex=0;renderCreateUserFocus();$("#createUserName").focus()};
function renameCurrentProfile(){
 if(!currentProfile)return;const name=prompt("DorukStation username",currentProfile.name);if(!name||!name.trim())return;
 currentProfile.name=name.trim().slice(0,24);S.username=currentProfile.name;saveProfiles();renderQuick();
}
function gameProfilePrefix(appId){return (currentProfile?.foldered||currentProfile?.guest)?`dorukstation:${folderForProfile(currentProfile)}games/${appId}/`:`dorukstation:${currentProfile?.id||"default"}:${appId}:`}
function storageShimScript(profile,appId){
 const profileId=profile?.id||"default",folder=folderForProfile(profile),guest=!!profile?.guest,foldered=!!profile?.foldered||guest;
 const prefix=foldered?`dorukstation:${folder}games/${appId}/`:`dorukstation:${profileId}:${appId}:`;
 return `<script data-dorukstation-v025-storage>(function(){const P=${JSON.stringify(prefix)},F=${JSON.stringify(folder)},G=${guest?"true":"false"};window.__dorukstationProfileId=${JSON.stringify(profileId)};window.__dorukstationAppId=${JSON.stringify(appId)};window.__dorukstationUserFolder=F;window.__dorukstationGuest=G;let B=null;try{B=window.localStorage;void B.length}catch(e){try{B=parent.__dorukstationStorage}catch(_){}}if(B){const A={get length(){let n=0;for(let i=0;i<B.length;i++){const k=B.key(i);if(k&&k.startsWith(P))n++}return n},key(i){let n=-1;for(let j=0;j<B.length;j++){const k=B.key(j);if(k&&k.startsWith(P)&&++n===Number(i))return k.slice(P.length)}return null},getItem(k){return B.getItem(P+String(k))},setItem(k,v){return B.setItem(P+String(k),String(v))},removeItem(k){return B.removeItem(P+String(k))},clear(){const a=[];for(let i=0;i<B.length;i++){const k=B.key(i);if(k&&k.startsWith(P))a.push(k)}for(const k of a)B.removeItem(k)}};try{Object.defineProperty(window,"localStorage",{configurable:true,value:A})}catch(e){}}try{const d=indexedDB,o=d.open.bind(d),x=d.deleteDatabase?.bind(d);d.open=(n,v)=>{const full=P+n;if(G)parent.postMessage({type:"dorukstation:guest-db",name:full},"*");return v===undefined?o(full):o(full,v)};if(x)d.deleteDatabase=n=>x(P+n)}catch(e){}})();<\/script>`;
}
function injectProfileShim(html,appId){
 const shim=storageShimScript(currentProfile,appId);
 if(/<head[\s>]/i.test(html))return html.replace(/<head([^>]*)>/i,m=>m+shim);
 if(/<html[\s>]/i.test(html))return html.replace(/<html([^>]*)>/i,m=>m+`<head>${shim}</head>`);
 return shim+html;
}


window.addEventListener("message",e=>{if(e?.data?.type==="dorukstation:guest-db"&&typeof e.data.name==="string")registerGuestDb(e.data.name)});
/* Safe-area UI + full-bleed background.
   The 1920x1080 controls are always fully visible, while #viewport fills
   any extra side/top space with the same animated theme instead of bars. */
function scaleStage(){
 const scale=Math.min(innerWidth/1920,innerHeight/1080);
 const stage=$("#stage");
 stage.style.transform=`translate(-50%,-50%) scale(${scale})`;
 document.documentElement.style.setProperty("--stage-scale",String(scale));
 document.documentElement.style.setProperty("--stage-visible-width",`${1920*scale}px`);
 document.documentElement.style.setProperty("--stage-visible-height",`${1080*scale}px`);
}
function onViewportResize(){
 scaleStage();
 broadcastGameResolution();
}
addEventListener("resize",onViewportResize,{passive:true});
addEventListener("orientationchange",()=>setTimeout(onViewportResize,80),{passive:true});
scaleStage();

function updateClock(){
 const d=new Date(),time=d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),date=d.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"});
 $("#clock").textContent=time;$("#dateText").textContent=date;$("#pageClock").textContent=time;$("#pageDate").textContent=date;
}
updateClock();setInterval(updateClock,1000);

/* Browser fullscreen requires a trusted user activation. DorukStation arms
   fullscreen immediately and requests it on the first click/tap/key. */
let firstEntryFullscreenArmed=true;
async function requestEntryFullscreen(){
 if(!firstEntryFullscreenArmed)return;
 if(document.fullscreenElement){firstEntryFullscreenArmed=false;return}
 const el=document.documentElement;
 if(!el.requestFullscreen)return;
 try{
   await el.requestFullscreen({navigationUI:"hide"});
   firstEntryFullscreenArmed=false;
 }catch{}
}
["pointerdown","touchend","keydown"].forEach(type=>addEventListener(type,requestEntryFullscreen,{capture:true,passive:type!=="keydown"}));
document.addEventListener("fullscreenchange",()=>{
 if(document.fullscreenElement)firstEntryFullscreenArmed=false;
 setTimeout(onViewportResize,30);
});

function themeLabel(){
 if(S.theme.kind==="photo")return PHOTO_THEMES.find(x=>x.id===S.theme.id)?.name||"Game Theme";
 if(S.theme.kind==="custom")return "Custom Background";
 return `${FLOW_COLORS.find(x=>x.id===S.theme.id)?.name||"Default"} Flow`;
}
function dsBootLogoShouldUseDark(){
 if($("#bootScreen")?.style.display!=="none" && !$("#bootScreen")?.classList.contains("out"))return false;
 if(document.body.classList.contains("light-theme"))return true;
 if(S.theme?.kind==="custom"&&S.customBackground){return !!document.body.dataset.customBackgroundLight && document.body.dataset.customBackgroundLight!=="0"}
 return false;
}
function syncDorukStationBootLogo(){
 const img=$("#bootLogo"); if(!img) return;
 img.src=dsBootLogoShouldUseDark()?"assets/branding/dorukstation-logo-dark.png":"assets/branding/dorukstation-logo-bright.png";
}

function applyTheme(){
 document.body.classList.remove("photo-theme","light-theme");
 const viewport=$("#viewport");viewport.style.backgroundImage="none";
 if(S.theme.kind==="photo"){
   const t=PHOTO_THEMES.find(x=>x.id===S.theme.id)||PHOTO_THEMES[0];
   $("#photoBackground").style.backgroundImage=`url("${t.bg}")`;document.body.classList.add("photo-theme");if(t.light)document.body.classList.add("light-theme");
   viewport.style.backgroundImage=`url("${t.bg}")`;viewport.style.backgroundSize="cover";viewport.style.backgroundPosition="center";
 }else if(S.theme.kind==="custom"&&S.customBackground){
   $("#photoBackground").style.backgroundImage=`url("${S.customBackground}")`;document.body.classList.add("photo-theme");
   viewport.style.backgroundImage=`url("${S.customBackground}")`;viewport.style.backgroundSize="cover";viewport.style.backgroundPosition="center";
   try{const probe=new Image();probe.onload=()=>{try{const c=document.createElement("canvas"),ctx=c.getContext("2d",{willReadFrequently:true});c.width=1;c.height=1;ctx.drawImage(probe,0,0,1,1);const d=ctx.getImageData(0,0,1,1).data;const lum=(0.2126*d[0]+0.7152*d[1]+0.0722*d[2])/255;document.body.dataset.customBackgroundLight=lum>.62?"1":"0";syncDorukStationBootLogo()}catch{document.body.dataset.customBackgroundLight="0";syncDorukStationBootLogo()}};probe.onerror=()=>{document.body.dataset.customBackgroundLight="0";syncDorukStationBootLogo()};probe.src=S.customBackground}catch{document.body.dataset.customBackgroundLight="0"}
 }else{
   const f=FLOW_COLORS.find(x=>x.id===S.theme.id)||FLOW_COLORS[0];document.documentElement.style.setProperty("--flow-color",f.color);viewport.style.backgroundColor=f.color;delete document.body.dataset.customBackgroundLight;
 }
 document.body.classList.toggle("no-animation",!S.animation);
 syncDorukStationBootLogo();
}
applyTheme();

function ensureLibraryLast(){
 const i=apps.findIndex(a=>a.id==="library");if(i>=0&&i!==apps.length-1){const [lib]=apps.splice(i,1);apps.push(lib)}
}

function render(){ensureLibraryLast();renderQuick();renderHome();syncMode();updateDebug()}
function syncMode(){document.body.classList.toggle("top-mode",S.zone==="top"&&!S.pageOpen)}

function renderQuick(){
 $("#quickButtons").innerHTML=quickItems.map((q,i)=>`<button class="quick-button ${S.zone==="top"&&S.quick===i&&!S.pageOpen?"focused":""} ${q.avatar?"avatar":""}" data-i="${i}" title="${esc(q.name)}">${q.avatar?`<img src="${GUEST_AVATAR}" alt="${esc(S.username)}">`:`<img src="${q.image}" alt="">`}</button>`).join("");
 $$(".quick-button").forEach(el=>el.onclick=()=>{S.zone="top";S.quick=Number(el.dataset.i);render();activate()});
 $("#quickTitle").textContent=quickItems[S.quick].name;
}
function appInner(a){
 if(a.type==="image")return `<img src="${a.image}" alt="">`;
 if(a.type==="custom")return `<div class="custom-mark">${esc(a.mark||"APP")}</div>`;
 if(a.type==="dorukcraft")return `<div class="dorukcraft-mark"><div class="grass-top"></div><div class="grass-name">DorukCraft</div></div>`;
 if(a.type==="files")return `<div class="files-mark"><div class="folder-shape"></div></div>`;
 return "";
}
function renderHome(){
 const c=$("#appCarousel");
 const startBox=$("#startBox");
 // The action button belongs to the focused tile visually. Park it outside the
 // carousel before rebuilding the tiles, then attach it to the new focus.
 if(startBox&&c.contains(startBox))$("#homeArea").appendChild(startBox);
 c.innerHTML=apps.map((a,i)=>`<div class="app-tile ${S.zone==="home"&&S.app===i&&!S.pageOpen?"focused":""} ${runningApps.has(a.id)?"running":""}" data-i="${i}"><div class="app-icon">${appInner(a)}</div><div class="app-running-dot"></div></div>`).join("");
 $$(".app-tile").forEach(el=>el.onclick=()=>{S.zone="home";S.app=Number(el.dataset.i);render();activate()});
 const focusedTile=c.querySelector(".app-tile.focused") || c.children[S.app];
 if(startBox&&focusedTile)focusedTile.appendChild(startBox);
 const focusedOffset=focusedTile ? focusedTile.offsetLeft : (S.app*160);
 c.style.transform=`translateX(${-focusedOffset}px)`;
 const a=apps[S.app]||apps[0],running=runningApps.has(a.id);
 $("#appTitle").textContent=a.name;$("#appDescription").textContent=a.desc;$("#widgetBody").textContent=a.live||a.desc;
 const canStart=S.zone==="home"&&(["news","browser","gallery","explorer","pick","remote","launch","library","placeholder"].includes(a.action)||running);
 document.body.classList.toggle("can-start",canStart);
 const startLabel=running?"Resume":((a.action==="launch"||a.action==="remote")?"Play":"Open");
 $("#startBoxText").textContent=startLabel;
 $("#startBox").setAttribute("aria-label",`${startLabel} ${a.name}`);
 $("#runningLabel").classList.toggle("hidden",!running);
}

$("#startBox").onclick=()=>{
 if(S.pageOpen||S.zone!=="home"||S.appSurface)return;
 activateApp(apps[S.app]);
};

function move(dx,dy){
 if(S.switcher)return moveSwitcher(dx,dy);
 if(S.pageOpen)return movePage(dx,dy);
 if(!$("#rightMenu").classList.contains("hidden"))return moveMenu(dx,dy);
 if(S.appSurface)return;
 if(S.zone==="home"){
   if(dy<0){S.zone="top";navSound();render();return}
   if(dx){S.app=Math.max(0,Math.min(apps.length-1,S.app+dx));navSound();render()}
 }else{
   if(dy>0){S.zone="home";navSound();render();return}
   if(dx){S.quick=Math.max(0,Math.min(quickItems.length-1,S.quick+dx));navSound();render()}
 }
}
function activate(){
 if(S.switcher)return activateSwitcher();
 if(S.pageOpen)return activatePage();
 if(!$("#rightMenu").classList.contains("hidden"))return activateMenu();
 if(S.appSurface)return;
 if(S.zone==="top")return activateQuick(quickItems[S.quick].id);
 activateApp(apps[S.app]);
}
function back(){
 if(S.switcher){closeSwitcher();return}
 /* Circle/B belongs to the running game. Only Home/PS suspends it. */
 if(S.appSurface)return;
 if(S.pageOpen){backPage();return}
 if(!$("#rightMenu").classList.contains("hidden")){closeMenu();return}
 if(S.zone==="top"){S.zone="home";backSound();render()}
}

/* ===== app activation ===== */
function activateApp(app){
 if(!app)return;selectSound();
 if(runningApps.has(app.id))return resumeApp(app.id);
 switch(app.action){
   case"news":openSimpleHomePage("What's New","Recent DorukStation activity.","assets/skin/now.png",[{title:"No recent activity",note:"Launch games or add a local HTML app to populate this area."}]);break;
   case"browser":openBrowserPage();break;
   case"gallery":openGalleryPage();break;
   case"explorer":openSimpleHomePage("File Explorer","Browser security limits direct filesystem browsing.","assets/skin/flow/content/library.png",[{title:"Use Library → Add HTML App",note:"Local standalone HTML games can be attached with the browser file picker."}]);break;
   case"pick":$("#htmlPicker").dataset.mode="replace";$("#htmlPicker").click();break;
   case"remote":requestAppLaunch(app);break;
   case"launch":requestAppLaunch(app);break;
   case"library":openLibraryPage();break;
   default:openSimpleHomePage(app.name,app.desc,app.image||"assets/skin/flow/content/library.png",[{title:"Prototype entry",note:app.live||app.desc}]);
 }
}

/* DorukStation v0.11 is intentionally single-application.
   A suspended app remains loaded, but a second game/application cannot start
   until the existing one is explicitly closed. */
function getRunningEntry(){return runningApps.values().next().value||null}
function requestAppLaunch(app){
 const current=getRunningEntry();
 if(!current)return launchApp(app);
 if(current.app.id===app.id)return resumeApp(app.id);
 openAppMenu("Close running application?",[
  {label:`Close ${current.app.name} & Open ${app.name}`,note:"The current app will be fully closed first.",action:()=>{
    closeMenu(false);
    closeRunningApp(current.app.id);
    launchApp(app);
  }},
  {label:"Cancel",note:`Keep ${current.app.name} suspended and return Home.`,action:()=>{
    closeMenu(false);S.zone="home";render();
  }}
 ]);
}

/* ===== APP OPTIONS: the only place that uses the right panel ===== */
function options(){
 if(S.switcher){closeSwitcher();return}
 if(S.appSurface)return;
 if(S.pageOpen||S.zone!=="home")return;
 const app=apps[S.app],running=runningApps.has(app.id);
 v28PlayEvent("optionOpen");
 openAppMenu(app.name,[
   {label:running?"Resume":"Start",action:()=>{closeMenu();activateApp(app)}},
   {label:"Information",note:app.userAdded?"Local app":"System app",action:()=>showAppInformation(app)},
   {label:app.inFolder?"Remove from Games folder":"Add to Games folder",action:()=>{app.inFolder=!app.inFolder;v18SaveFolderPrefs?.();closeMenu();render()}},
   {sep:true},
   {label:"Close background app",disabled:!running,action:()=>{closeRunningApp(app.id);closeMenu();render()}},
   {label:"Delete",disabled:!app.userAdded,action:()=>removeUserApp(app)}
 ]);
}
function openAppMenu(title,items){S.menuItems=items;S.menuIndex=0;$("#menuTitle").textContent=title;showUi("#scrim","forward");showUi("#rightMenu","forward");renderMenu()}
function showAppInformation(app){openAppMenu("Information",[{label:"Name",note:app.name,disabled:true},{label:"Type",note:app.userAdded?"Local HTML":"System / built-in",disabled:true},{label:"Running",note:runningApps.has(app.id)?"Yes":"No",disabled:true},{label:"Games folder",note:app.inFolder?"Yes":"No",disabled:true}])}
function renderMenu(){
 $("#menuBody").innerHTML=S.menuItems.map((x,i)=>x.sep?`<div class="menu-separator"></div>`:`<button class="menu-button ${i===S.menuIndex?"focused":""}" data-i="${i}" ${x.disabled?"disabled":""}><span>${esc(x.label)}</span>${x.note?`<small>${esc(x.note)}</small>`:""}</button>`).join("");
 $$(".menu-button").forEach(el=>el.onclick=()=>{S.menuIndex=Number(el.dataset.i);activateMenu()});
}
function moveMenu(dx,dy){let d=dy||dx;if(!d)return;let n=S.menuIndex;for(let t=0;t<S.menuItems.length;t++){n=Math.max(0,Math.min(S.menuItems.length-1,n+d));if(!S.menuItems[n]?.sep)break}S.menuIndex=n;navSound();renderMenu()}
function activateMenu(){const x=S.menuItems[S.menuIndex];if(!x||x.sep||x.disabled)return;selectSound();x.action?.()}
function closeMenu(playSound=true){hideUi("#scrim","back");hideUi("#rightMenu","back");S.menuItems=[];if(playSound)v28PlayEvent("optionClose")}
$("#scrim").onclick=closeMenu;

/* ===== full page system ===== */
function setPageHeader(title,subtitle,icon,eyebrow="DorukStation"){$("#pageTitle").textContent=title;$("#pageSubtitle").textContent=subtitle||"";$("#pageEyebrow").textContent=eyebrow;$("#pageIcon").src=icon||"assets/skin/flow/function/setting.png"}
function openPage({title,subtitle,icon,items=[],cols=1,mode="list",returnZone=null,eyebrow="DorukStation",renderCustom=null},nested=false){
 document.body.classList.remove("ps4-settings-page");
 if(nested&&S.pageOpen)S.pageStack.push({title:$("#pageTitle").textContent,subtitle:$("#pageSubtitle").textContent,icon:$("#pageIcon").src,eyebrow:$("#pageEyebrow").textContent,items:S.pageItems,index:S.pageIndex,cols:S.pageCols,mode:S.pageMode,custom:S.pageCustom});
 if(!S.pageOpen){S.pageReturnZone=returnZone||S.zone;S.pageStack=[]}
 S.pageOpen=true;S.pageItems=items;S.pageIndex=0;S.pageCols=cols;S.pageMode=mode;S.pageCustom=renderCustom||null;
 setPageHeader(title,subtitle,icon,eyebrow);if(!$("#pageView").classList.contains("hidden")){renderPage();animatePageContent("forward")}else{showUi("#pageView","forward");renderPage();animatePageContent("forward")}
}
function renderPage(){
 const body=$("#pageBody");
 if(S.pageCustom){S.pageCustom(body);return}
 if(!S.pageItems.length){body.innerHTML='<div class="page-empty">Nothing here yet.</div>';return}
 if(S.pageMode==="grid"){
   body.innerHTML=`<div class="page-grid" style="grid-template-columns:repeat(${S.pageCols},1fr)">${S.pageItems.map((x,i)=>`<div class="page-card ${i===S.pageIndex?"focused":""} ${x.disabled?"disabled":""}" data-i="${i}">${x.image?`<img src="${x.image}" alt="">`:""}<div class="card-title">${esc(x.title)}</div>${x.note?`<div class="card-note">${esc(x.note)}</div>`:""}</div>`).join("")}</div>`;
   $$(".page-card").forEach(el=>el.onclick=()=>{S.pageIndex=Number(el.dataset.i);activatePage()});
 }else{
   body.innerHTML=`<div class="page-list">${S.pageItems.map((x,i)=>`<div class="page-list-item ${i===S.pageIndex?"focused":""}" data-i="${i}"><span>${esc(x.title)}</span>${x.note?`<small>${esc(x.note)}</small>`:""}</div>`).join("")}</div>`;
   $$(".page-list-item").forEach(el=>el.onclick=()=>{S.pageIndex=Number(el.dataset.i);activatePage()});
 }
}
function movePage(dx,dy){
 if(!S.pageItems.length)return;
 let delta=S.pageMode==="grid"?(dx||dy*S.pageCols):(dy||dx);if(!delta)return;
 S.pageIndex=Math.max(0,Math.min(S.pageItems.length-1,S.pageIndex+delta));navSound();renderPage();
}
function activatePage(){const x=S.pageItems[S.pageIndex];if(!x||x.disabled)return;selectSound();x.action?.()}
function backPage(){
 if(S.pageStack.length){const p=S.pageStack.pop();S.pageItems=p.items;S.pageIndex=p.index;S.pageCols=p.cols;S.pageMode=p.mode;S.pageCustom=p.custom;setPageHeader(p.title,p.subtitle,p.icon,p.eyebrow);document.body.classList.toggle("ps4-settings-page",p.title==="Settings");renderPage();animatePageContent("back");backSound();return}
 hideUi("#pageView","back");document.body.classList.remove("ps4-settings-page");S.pageOpen=false;S.pageItems=[];S.zone=S.pageReturnZone||"home";backSound();render();
}
function openSimpleHomePage(title,subtitle,icon,cards){openPage({title,subtitle,icon,returnZone:"home",mode:"grid",cols:3,items:cards.map(c=>({title:c.title,note:c.note,disabled:true}))})}

/* ===== quick functions: every item gets its own page ===== */
function activateQuick(id){
 selectSound();
 switch(id){
  case"plus":openPage({title:"DorukStation Plus",subtitle:"Membership hub prototype. No online account or payment service is connected.",icon:"assets/skin/plus.png",returnZone:"top",mode:"grid",cols:3,items:[{title:"Monthly Games",note:"Offline prototype",disabled:true},{title:"Cloud Saves",note:"Not connected",disabled:true},{title:"Membership",note:"No account service",disabled:true}]});break;
  case"marketplace":openPage({title:"DorukStation Store",subtitle:"Games and applications. Store services are not connected in this web prototype.",icon:"assets/skin/store.png",returnZone:"top",mode:"grid",cols:4,items:[{title:"Featured",note:"Prototype",disabled:true},{title:"Games",note:"Prototype",disabled:true},{title:"Apps",note:"Prototype",disabled:true},{title:"Library",note:"Open your local Library",action:()=>{backPage();S.zone="home";S.app=apps.findIndex(a=>a.id==="library");render()}}]});break;
  case"notifications":openNotificationsPage();break;
  case"friends":openPage({title:"Friends",subtitle:"Local prototype friend activity.",icon:"assets/skin/flow/function/friend.png",returnZone:"top",items:[{title:"No friend service connected",note:"DorukStation is running locally",disabled:true}]});break;
  case"messages":openPage({title:"Messages",subtitle:"Message center.",icon:"assets/skin/flow/function/message.png",returnZone:"top",items:[{title:"No messages",note:"Local shell",disabled:true}]});break;
  case"parties":openPage({title:"Parties",subtitle:"Party and voice group center.",icon:"assets/skin/flow/function/party.png",returnZone:"top",items:[{title:"No active parties",note:"Native networking comes later",disabled:true}]});break;
  case"profile":openProfilePage();break;
  case"trophies":openTrophiesPage();break;
  case"settings":openSettingsPage();break;
  case"power":openPowerPage();break;
 }
}
function openNotificationsPage(){
 const items=notificationLog.length?notificationLog.map(n=>({title:n.title,note:`${n.kind.replaceAll("-"," ")} · ${n.time}`,disabled:true})):[{title:"No notifications",note:"Only invites, achievements and recording start/finish appear here.",disabled:true}];
 openPage({title:"Notifications",subtitle:"Only invites, achievements and recording events are shown.",icon:"assets/skin/flow/function/notification.png",returnZone:"top",items});
}
function openTrophiesPage(){const items=trophyLog.length?trophyLog.map(t=>({title:t.title,note:`${t.time}${t.text?` · ${t.text}`:""}`,disabled:true})):[{title:"No achievements yet",note:"Trophies are saved separately for this user.",disabled:true}];openPage({title:"Trophies",subtitle:`${S.username} · ${trophyLog.length} earned`,icon:"assets/skin/flow/function/trophy.png",returnZone:"top",items})}
function openProfilePage(){openPage({title:"Profile",subtitle:`${currentProfile?.guest?"Temporary guest":"Local DorukStation user"} · ${folderForProfile(currentProfile)}`,icon:GUEST_AVATAR,returnZone:"top",items:[{title:"Username",note:S.username,action:()=>{if(!currentProfile?.guest){renameCurrentProfile();openProfilePage()}}},{title:"User Folder",note:folderForProfile(currentProfile),disabled:true},{title:"Switch User",note:"Close the running app and return to user selection",action:()=>{backPage();showUserSelector()}},{title:"Status",note:navigator.onLine?"Online":"Offline",disabled:true}]})}
function openPowerPage(){openPage({title:"Power",subtitle:"Session controls.",icon:"assets/skin/flow/function/power.png",returnZone:"top",items:[{title:"Return to Home",action:()=>{backPage();S.zone="home";render()}},{title:"Running Application",note:getRunningEntry()?.app?.name||"None",action:()=>{backPage();openRunningApplicationPage()}},{title:"Enter Fullscreen",action:()=>document.documentElement.requestFullscreen?.()},{title:"Restart DorukStation",action:()=>{if(currentProfile?.guest)cleanupGuestSession("restart");location.reload()}}]})}

/* ===== Settings is a real full page ===== */
function openSettingsPage(){
 const items=[
  {title:"User's Guide / Helpful Info",icon:"ⓘ",action:()=>openPage({title:"Helpful Info",subtitle:"DorukStation help and controls.",items:[{title:"Home",note:"Short PS press returns to Home",disabled:true},{title:"Quick Menu",note:"Hold PS for 1 second",disabled:true},{title:"Share",note:"Press SHARE",disabled:true}]},true)},
  {title:"Data Handling / Health & Safety",icon:"▣",action:()=>openPage({title:"Data Handling / Health & Safety",subtitle:"Local prototype information.",items:[{title:"Local user data",note:"Profiles and shell preferences are stored in this browser",disabled:true},{title:"Game saves",note:"Namespaced separately per DorukStation user",disabled:true}]},true)},
  {title:"Accessibility",icon:"◉",action:openAccessibilityPage},
  {title:"Account Management",icon:"♙",note:S.username,action:openProfilePage},
  {title:"Parental Controls / Family Management",icon:"♜",note:"Not configured",action:()=>openPage({title:"Parental Controls / Family Management",subtitle:"Prototype placeholder.",items:[{title:"No restrictions configured",disabled:true}]},true)},
  {title:"Login Settings",icon:"♟",action:()=>openPage({title:"Login Settings",subtitle:"Local DorukStation users.",items:[{title:"Switch User",action:()=>{while(S.pageOpen)backPage();showUserSelector()}},{title:"Create User",action:()=>{while(S.pageOpen)backPage();showUserSelector();S.userIndex=profiles.length;renderUserSelector();setTimeout(()=>openCreateChoice(),120)}}]},true)},
  {title:"Network",icon:"◎",note:navigator.onLine?"Connected":"Offline",action:()=>openPage({title:"Network",subtitle:"Browser network status.",items:[{title:"Connection Status",note:navigator.onLine?"Connected":"Offline",disabled:true}]},true)},
  {title:"Notifications",icon:"assets/skin/flow/function/notification.png",note:String(notificationLog.length),action:openNotificationsPage},
  {title:"Devices",icon:"assets/skin/flow/function/setting.png",note:"Controllers",action:openControllerPage},
  {title:"Storage",icon:"▤",action:()=>openPage({title:"Storage",subtitle:`User folder: ${folderForProfile(currentProfile)}`,items:[{title:"User Folder",note:folderForProfile(currentProfile),disabled:true},{title:"Storage is managed by your browser",note:"Each user uses an isolated DorukStation folder namespace",disabled:true}]},true)},
  {title:"Themes",icon:"✦",note:themeLabel(),action:openThemeRootPage},
  {title:"Application Saved Data Management",icon:"▥",note:"Per-user",action:()=>openPage({title:"Application Saved Data Management",subtitle:`Saved data for ${S.username}.`,items:[{title:"DorukCraft",note:"Stored separately for this user",disabled:true},{title:"Local HTML games",note:"Each app receives a separate user namespace",disabled:true}]},true)},
  {title:"Sound and Screen",icon:"♪",action:openSoundScreenPage},
  {title:"System",icon:"⬡",action:openSystemSettingsPage},
  {title:"Initialization",icon:"◌",action:()=>openPage({title:"Initialization",subtitle:"System reset tools are intentionally protected.",items:[{title:"Restart DorukStation",action:()=>{if(currentProfile?.guest)cleanupGuestSession("restart");location.reload()}},{title:"Replay Startup",action:()=>{backPage();replayBoot()}},{title:"User data reset",note:"Not exposed here to prevent accidental save loss",disabled:true}]},true)}
 ];
 openPage({title:"Settings",subtitle:"",icon:"assets/skin/flow/function/setting.png",returnZone:"top",items,renderCustom:renderPS4Settings});document.body.classList.add("ps4-settings-page");renderPage();
}
function renderPS4Settings(body){
 body.innerHTML=`<div class="ps4-settings-list">${S.pageItems.map((x,i)=>`<div class="ps4-settings-row ${i===S.pageIndex?"focused":""} ${x.disabled?"disabled":""}" data-i="${i}"><span class="ps4-settings-icon">${String(x.icon||"⚙").includes("/")?`<img src="${x.icon}" alt="">`:esc(x.icon||"⚙")}</span><span class="ps4-settings-name">${esc(x.title)}</span>${x.note?`<span class="ps4-settings-note">${esc(x.note)}</span>`:""}</div>`).join("")}</div><div class="ps4-settings-footer">✕ Enter&nbsp;&nbsp;&nbsp;&nbsp;○ Back</div>`;
 $$(".ps4-settings-row").forEach(el=>el.onclick=()=>{S.pageIndex=Number(el.dataset.i);activatePage()});
 const row=body.querySelector(`.ps4-settings-row[data-i="${S.pageIndex}"]`);if(row)requestAnimationFrame(()=>row.scrollIntoView({block:"nearest"}));
}
function openAccessibilityPage(){openPage({title:"Accessibility",subtitle:"Accessibility preferences.",items:[{title:"Text to Speech",note:"Not available in this web build",disabled:true},{title:"Zoom",note:"Use browser/system zoom",disabled:true},{title:"Larger Text",note:"System setting later",disabled:true},{title:"Bold Text",note:"System setting later",disabled:true},{title:"High Contrast",note:"System setting later",disabled:true},{title:"Closed Captions",note:"Game dependent",disabled:true},{title:"Button Assignments",note:"Controller mapping",action:openControllerPage}]},true)}
function openSoundScreenPage(){openPage({title:"Sound and Screen",subtitle:"DorukStation display and audio preferences.",items:[{title:"Sound Effects",note:S.sounds?"On":"Off",action:()=>{S.sounds=!S.sounds;pSet("sounds",S.sounds?"on":"off");openSoundScreenPage()}},{title:"Background Animation",note:S.animation?"On":"Off",action:()=>{S.animation=!S.animation;pSet("animation",S.animation?"on":"off");applyTheme();openSoundScreenPage()}},{title:"Display",note:"Full-bleed shell / native game viewport",action:openDisplayPage},{title:"Custom Background",action:()=>$("#backgroundPicker").click()}]},true)}
function openSystemSettingsPage(){openPage({title:"System",subtitle:"DorukStation system options.",items:[{title:"Enter Fullscreen",action:()=>document.documentElement.requestFullscreen?.()},{title:"Replay Startup",action:()=>{backPage();replayBoot()}},{title:"About Sources",note:"OrbisPro + skin.orbis omega",action:()=>openPage({title:"About Sources",subtitle:"Project source mapping.",items:[{title:"OrbisPro",note:"Home geometry and interaction reference",disabled:true},{title:"skin.orbis omega",note:"CC0 visual assets, Flow textures and themes",disabled:true}]},true)}]},true)}
function openControllerPage(){openPage({title:"Controller",subtitle:"Controller mappings for the web prototype.",icon:"assets/skin/flow/function/setting.png",items:[{title:"D-pad / Left stick",note:"Navigate",disabled:true},{title:"Cross / A",note:"Enter",disabled:true},{title:"Circle / B",note:"Back in shell · passed to game while app is running",disabled:true},{title:"Options / Start",note:"App options on Home · passed to running game",disabled:true},{title:"Home / PS",note:"Short press: Home · Hold 1 second: Quick Menu",disabled:true},{title:"SHARE",note:"Opens the Share menu",disabled:true}]},true)}
function openDisplayPage(){openPage({title:"Display",subtitle:"The shell uses a contained 1920×1080 safe canvas; running games use the full live viewport and its device-pixel resolution.",icon:"assets/skin/flow/function/setting.png",items:[{title:"UI safe area",note:"Contain / no control cropping",disabled:true},{title:"Background",note:"Full bleed — no empty side bars",disabled:true},{title:"Shell reference canvas",note:"1920 × 1080",disabled:true},{title:"Game viewport",note:`${Math.round(innerWidth)} × ${Math.round(innerHeight)} CSS px`,disabled:true},{title:"Fullscreen",action:()=>document.documentElement.requestFullscreen?.()}]},true)}
function openThemeRootPage(){openPage({title:"Themes",subtitle:"Blue Flow is default; skin.orbis game themes are optional.",icon:"assets/skin/flow/function/setting.png",items:[{title:"Flow Colors",note:S.theme.kind==="flow"?themeLabel():"8 colors",action:openFlowThemePage},{title:"Game Themes",note:S.theme.kind==="photo"?themeLabel():`${PHOTO_THEMES.length} built in`,action:openPhotoThemePage},{title:"Custom Background",note:"Choose image",action:()=>$("#backgroundPicker").click()}]},true)}
function openFlowThemePage(){openPage({title:"Flow Colors",subtitle:"skin.orbis Flow color presets.",icon:"assets/skin/flow/function/setting.png",mode:"grid",cols:4,items:FLOW_COLORS.map(f=>({title:f.name,note:S.theme.kind==="flow"&&S.theme.id===f.id?"Active":"",color:f.color,action:()=>{S.theme={kind:"flow",id:f.id};pSet("theme",JSON.stringify(S.theme));applyTheme();renderPage()}})),renderCustom:renderFlowCards},true)}
function renderFlowCards(body){body.innerHTML=`<div class="theme-grid">${FLOW_COLORS.map((f,i)=>`<div class="theme-card flow-thumb ${i===S.pageIndex?"focused":""}" data-i="${i}" style="--card-color:${f.color}">${S.theme.kind==="flow"&&S.theme.id===f.id?'<div class="active">ACTIVE</div>':""}<div class="name">${esc(f.name)}</div></div>`).join("")}</div>`;$$('.theme-card').forEach(el=>el.onclick=()=>{S.pageIndex=Number(el.dataset.i);activatePage()})}
function openPhotoThemePage(){openPage({title:"Game Themes",subtitle:"Optional backgrounds copied from skin.orbis omega.",icon:"assets/skin/store.png",mode:"grid",cols:4,items:PHOTO_THEMES.map(t=>({title:t.name,note:S.theme.kind==="photo"&&S.theme.id===t.id?"Active":"",action:()=>{S.theme={kind:"photo",id:t.id};pSet("theme",JSON.stringify(S.theme));applyTheme();renderPage()}})),renderCustom:renderPhotoCards},true)}
function renderPhotoCards(body){body.innerHTML=`<div class="theme-grid">${PHOTO_THEMES.map((t,i)=>`<div class="theme-card ${i===S.pageIndex?"focused":""}" data-i="${i}" style="background-image:url('${t.bg}')">${S.theme.kind==="photo"&&S.theme.id===t.id?'<div class="active">ACTIVE</div>':""}<div class="name">${esc(t.name)}</div></div>`).join("")}</div>`;$$('.theme-card').forEach(el=>el.onclick=()=>{S.pageIndex=Number(el.dataset.i);activatePage()})}

/* ===== Home pages ===== */
function openBrowserPage(){openPage({title:"Internet Browser",subtitle:"External websites open in normal browser tabs.",icon:"assets/skin/flow/content/browser.png",returnZone:"home",mode:"grid",cols:3,items:[{title:"Google",action:()=>window.open("https://google.com","_blank","noopener")},{title:"GitHub",action:()=>window.open("https://github.com","_blank","noopener")},{title:"New Tab",note:"Use your browser controls",disabled:true}]})}
function openGalleryPage(){openPage({title:"Capture Gallery",subtitle:"Screenshots and recordings.",icon:"assets/skin/flow/content/gallery.png",returnZone:"home",mode:"grid",cols:3,items:[{title:"Screenshots",note:"0",disabled:true},{title:"Video Clips",note:"0",disabled:true},{title:"Recording integration",note:"Native build later",disabled:true}]})}
function openLibraryPage(){
 const items=apps.filter(a=>a.id!=="library").map(a=>({title:a.name,note:a.userAdded?"Local HTML":"Home item",image:a.image,action:()=>{backPage();S.zone="home";S.app=apps.indexOf(a);render()}}));
 items.push({title:"Add HTML App",note:"Choose a standalone .html file",image:"assets/skin/add.png",action:()=>{$("#htmlPicker").dataset.mode="new";$("#htmlPicker").click()}});
 openPage({title:"Library",subtitle:"All games and applications. Add HTML App lives here, not on Home.",icon:"assets/skin/flow/content/library.png",returnZone:"home",mode:"grid",cols:4,items});
}

/* ===== local HTML apps ===== */
$("#htmlPicker").addEventListener("change",async()=>{
 const file=$("#htmlPicker").files?.[0];if(!file||!currentProfile)return;
 const stable=file.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"html-app",id=`local-${stable}-${file.size}`,text=await file.text(),profiled=injectProfileShim(text,id),url=URL.createObjectURL(new Blob([profiled],{type:"text/html"}));
 const previous=apps.find(a=>a.userAdded&&a.id===id);if(previous)removeUserApp(previous);
 const app={id,name:file.name.replace(/\.html?$/i,""),desc:`Local HTML: ${file.name}`,live:`Local app for ${S.username}. Browser storage is namespaced to this user.`,type:"custom",mark:"APP",action:"launch",objectUrl:url,userAdded:true,inFolder:true,profiledInjected:true,ownerProfileId:currentProfile.id};apps.splice(Math.max(0,apps.length-1),0,app);ensureLibraryLast();S.app=apps.indexOf(app);
 $("#htmlPicker").value="";if(S.pageOpen&&$("#pageTitle").textContent==="Library")openLibraryPage();render();
});
$("#backgroundPicker").addEventListener("change",()=>{
 const file=$("#backgroundPicker").files?.[0];if(!file)return;if(S.customBackground)URL.revokeObjectURL(S.customBackground);S.customBackground=URL.createObjectURL(file);S.theme={kind:"custom",id:"custom"};applyTheme();$("#backgroundPicker").value="";if(S.pageOpen)renderPage();
});
function launchApp(app){
 let source=app.objectUrl||((app.legacyUrl&&currentProfile?.legacy)?app.legacyUrl:app.url);if(!source||!currentProfile)return;
 if(app.profiled&&!app.profiledInjected&&!currentProfile.legacy){const u=new URL(source,location.href);u.searchParams.set("dsProfile",currentProfile.id);u.searchParams.set("dsApp",app.id);u.searchParams.set("dsFolder",folderForProfile(currentProfile));if(currentProfile.foldered||currentProfile.guest)u.searchParams.set("dsFoldered","1");if(currentProfile.guest)u.searchParams.set("dsGuest","1");source=u.href;}
 const current=getRunningEntry();
 if(current&&current.app.id!==app.id)return requestAppLaunch(app);
 let e=runningApps.get(app.id);
 if(!e){
  const iframe=document.createElement("iframe");
  iframe.title=app.name;
  iframe.allow="fullscreen *; autoplay *; pointer-lock *; clipboard-read *; clipboard-write *";
  iframe.allowFullscreen=true;
  iframe.src=source;
  iframe.dataset.appId=app.id;
  iframe.tabIndex=-1;
  iframe.style.cssText="position:absolute;inset:0;width:100%;height:100%;min-width:100%;min-height:100%;border:0;background:#000;display:none;pointer-events:none;visibility:hidden";
  $("#appSurface").appendChild(iframe);
  e={iframe,app,suspended:true};runningApps.set(app.id,e);
  iframe.addEventListener("load",()=>{
    makeGameViewportResponsive(e);
    installInputPauseShim(e);
    sendGameResolution(e);
    setGameSuspended(e,e.suspended);
  });
 }
 resumeApp(app.id)
}
function selectedAppTarget(){
 const viewportRect=$("#viewport").getBoundingClientRect();
 const selected=apps.findIndex(a=>a.id===S.currentRunningId);
 if(selected>=0){S.app=selected;S.zone="home";render()}
 const icon=$$(".app-tile")[S.app]?.querySelector(".app-icon");
 const r=icon?.getBoundingClientRect();
 if(!r||!viewportRect.width||!viewportRect.height)return {x:0,y:0,w:1,h:1};
 return {x:r.left-viewportRect.left,y:r.top-viewportRect.top,w:r.width,h:r.height};
}
function appTransformForTarget(t){
 const vr=$("#viewport").getBoundingClientRect();
 const w=Math.max(1,vr.width),h=Math.max(1,vr.height);
 return `translate(${t.x}px,${t.y}px) scale(${t.w/w},${t.h/h})`;
}
function gameResolutionPayload(){
 const vr=$("#viewport").getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 const width=Math.max(1,Math.round(vr.width)),height=Math.max(1,Math.round(vr.height));
 return {type:"dorukstation:resolution",width,height,devicePixelRatio:dpr,pixelWidth:Math.round(width*dpr),pixelHeight:Math.round(height*dpr),orientation:width>=height?"landscape":"portrait"};
}
function sendGameResolution(e){
 if(!e?.iframe?.contentWindow)return;
 const payload=gameResolutionPayload();
 try{e.iframe.contentWindow.postMessage(payload,"*")}catch{}
 try{e.iframe.contentWindow.dispatchEvent(new Event("resize"))}catch{}
}
function broadcastGameResolution(){for(const e of runningApps.values())sendGameResolution(e)}
function makeGameViewportResponsive(e){
 try{
   const d=e.iframe.contentDocument;if(!d)return;
   let meta=d.querySelector('meta[name="viewport"]');
   if(!meta){meta=d.createElement("meta");meta.name="viewport";(d.head||d.documentElement).appendChild(meta)}
   meta.content="width=device-width,initial-scale=1,viewport-fit=cover";
   if(!d.querySelector('style[data-dorukstation-host="responsive-v12"]')){
     const style=d.createElement("style");style.dataset.dorukstationHost="responsive-v12";
     style.textContent="html,body{width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;overflow:hidden!important}";
     (d.head||d.documentElement).appendChild(style);
   }
 }catch{}
}
function installInputPauseShimV15(e){
 /* v0.30: suspension blocks all input, but launch/resume quarantine blocks
    ONLY Gamepad API reads. Pointer/keyboard/touch must never wait for a
    controller to become neutral. */
 try{
  const w=e.iframe.contentWindow,d=e.iframe.contentDocument;if(!w||!d)return;
  if(w.__dorukstationInputShimInstalled)return;
  w.__dorukstationInputShimInstalled=true;
  w.__dorukstationSuspended=!!e.suspended;
  w.__dorukstationInputBlocked=!!e.suspended;
  w.__dorukstationGamepadBlocked=false;
  try{w.DorukStationNotify=(kind,title,text)=>pushEventNotification(kind,title,text)}catch{}
  const nativeGetGamepads=w.navigator.getGamepads?.bind(w.navigator);
  if(nativeGetGamepads){
   try{Object.defineProperty(w.navigator,"getGamepads",{configurable:true,value:()=>{
    if(w.__dorukstationSuspended||w.__dorukstationInputBlocked||w.__dorukstationGamepadBlocked)return [];
    const pads=Array.from(nativeGetGamepads()||[]);return pads.map(g=>{if(!g)return null;try{return new Proxy(g,{get(t,k){if(k==="buttons")return Array.from(t.buttons||[],(b,i)=>(i===8||i===16)?{pressed:false,touched:false,value:0}:b);const v=t[k];return typeof v==="function"?v.bind(t):v}})}catch{return g}})
   }})}catch{}
  }
  const block=ev=>{if(!w.__dorukstationSuspended&&!w.__dorukstationInputBlocked)return;ev.preventDefault?.();ev.stopImmediatePropagation?.();ev.stopPropagation?.()};
  ["keydown","keyup","keypress","pointerdown","pointerup","pointermove","mousedown","mouseup","mousemove","click","dblclick","wheel","touchstart","touchmove","touchend"].forEach(type=>w.addEventListener(type,block,true));
 }catch{}
}
function setGameSuspended(e,suspended){
 if(!e?.iframe)return;
 e.suspended=!!suspended;
 e.iframe.inert=!!suspended;
 e.iframe.tabIndex=-1;
 e.iframe.style.pointerEvents=suspended?"none":"auto";
 if(!suspended){e.iframe.style.visibility="visible";e.iframe.style.display="block"}
 if(suspended)e.iframe.setAttribute("aria-hidden","true");else e.iframe.removeAttribute("aria-hidden");
 e.iframe.allow=suspended?"fullscreen *; autoplay *; pointer-lock *; clipboard-read *; clipboard-write *":"fullscreen *; autoplay *; gamepad *; pointer-lock *; clipboard-read *; clipboard-write *";
 try{
  const w=e.iframe.contentWindow;
  w.__dorukstationSuspended=!!suspended;
  w.__dorukstationInputBlocked=!!suspended;
  if(suspended)w.__dorukstationGamepadBlocked=true;
 }catch{}
 try{e.iframe.contentWindow.postMessage({type:suspended?"dorukstation:suspend-input":"dorukstation:resume-input"},"*")}catch{}
}
function sendLifecycle(e,type){
 try{e?.iframe?.contentWindow?.postMessage({...gameResolutionPayload(),type:`dorukstation:${type}`},"*")}catch{}
}
function gateGameInputUntilNeutral(e){
 /* v0.30: only quarantine controller reads. The game is visible/clickable
    immediately. A hard timeout guarantees controller input can never remain
    disabled forever because of stick drift or a browser mapping glitch. */
 if(!e?.iframe)return;
 e.iframe.style.display="block";
 e.iframe.style.visibility="visible";
 e.iframe.style.pointerEvents="auto";
 try{
  const w=e.iframe.contentWindow;
  w.__dorukstationInputBlocked=false;
  w.__dorukstationGamepadBlocked=true;
 }catch{}
 const started=performance.now();let neutralFrames=0,finished=false;
 const finish=()=>{
  if(finished)return;finished=true;
  try{e.iframe.contentWindow.__dorukstationGamepadBlocked=false}catch{}
  e.iframe.allow="fullscreen *; autoplay *; gamepad *; pointer-lock *; clipboard-read *; clipboard-write *";
  try{e.iframe.contentWindow.postMessage({type:"dorukstation:input-ready"},"*")}catch{}
 };
 const tick=()=>{
  if(finished)return;
  if(!S.appSurface||runningApps.get(e.app.id)!==e){finish();return}
  const allowed=window.__dorukstationAllowedGamepadIndices?.()||[];
  const allPads=[...(navigator.getGamepads?.()||[])].filter(Boolean);
  const pads=allowed.length?allPads.filter(g=>allowed.includes(g.index)):[];
  const neutral=!pads.length||pads.every(g=>g.buttons.every(b=>!b.pressed&&Number(b.value||0)<.25)&&g.axes.every(a=>Math.abs(a)<.34));
  neutralFrames=neutral?neutralFrames+1:0;
  if(neutralFrames>=2&&performance.now()-started>55){finish();return}
  if(performance.now()-started>=700){finish();return}
  requestAnimationFrame(tick);
 };
 requestAnimationFrame(tick);
}
function resumeAppV15(id){
 const e=runningApps.get(id);if(!e)return;
 /* v0.30: render immediately; only controller reads are quarantined. */
 e.iframe.style.display="block";
 setGameSuspended(e,false);

 S.currentRunningId=id;
 const idx=apps.findIndex(a=>a.id===id);
 if(idx>=0){S.app=idx;S.zone="home"}
 render();

 const surface=$("#appSurface"),target=selectedAppTarget();
 surface.classList.remove("hidden","app-returning");
 surface.style.transition="none";
 surface.style.transformOrigin="0 0";
 surface.style.transform=appTransformForTarget(target);
 surface.style.opacity=".28";
 surface.style.borderRadius="28px";
 surface.style.overflow="hidden";
 void surface.offsetWidth;

 surface.style.transition="transform .46s cubic-bezier(.20,.82,.18,1), opacity .34s ease, border-radius .46s ease";
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
   surface.style.transform="translate(0px,0px) scale(1,1)";
   surface.style.opacity="1";
   surface.style.borderRadius="0px";
 }));

 S.appSurface=true;
 gateGameInputUntilNeutral(e);
 sendGameResolution(e);
 sendLifecycle(e,"resume");
 setTimeout(()=>{
   if(!S.appSurface||S.currentRunningId!==id)return;
   surface.style.transition="";
   surface.style.transform="";
   surface.style.opacity="";
   surface.style.borderRadius="";
   surface.style.overflow="";
 },500);
}
function suspendToHome(){
 if(!S.appSurface||!S.currentRunningId)return;
 v28PlayEvent("appExit");
 const e=runningApps.get(S.currentRunningId);
 if(!e)return;

 /* Return to the exact Home tile first so the animation has a destination. */
 const idx=apps.findIndex(a=>a.id===S.currentRunningId);
 if(idx>=0){S.app=idx;S.zone="home"}
 render();

 const surface=$("#appSurface"),target=selectedAppTarget();
 sendLifecycle(e,"suspend");
 setGameSuspended(e,true);

 surface.classList.add("app-returning");
 surface.style.transformOrigin="0 0";
 surface.style.transition="transform .46s cubic-bezier(.32,.72,0,1), opacity .38s ease, border-radius .46s ease";
 surface.style.transform=appTransformForTarget(target);
 surface.style.opacity=".12";
 surface.style.borderRadius="30px";
 surface.style.overflow="hidden";

 setTimeout(()=>{
   /* Keep the browsing context loaded, but fully remove it from rendering/input. */
   e.iframe.style.display="none";
   e.iframe.style.visibility="hidden";
   surface.classList.add("hidden");
   surface.classList.remove("app-returning");
   surface.style.transition="";
   surface.style.transform="";
   surface.style.opacity="";
   surface.style.borderRadius="";
   surface.style.overflow="";
   S.appSurface=false;
   render();
 },475);
}
function closeRunningApp(id){
 const e=runningApps.get(id);if(!e)return;
 v28PlayEvent("appClose");
 /* CLOSE is destructive: remove browsing context so next start is fresh. */
 sendLifecycle(e,"close");
 try{if(document.pointerLockElement===e.iframe||e.iframe.contentDocument?.pointerLockElement)document.exitPointerLock?.()}catch{}
 setGameSuspended(e,true);
 e.iframe.src="about:blank";
 e.iframe.remove();
 runningApps.delete(id);
 if(S.currentRunningId===id){
  S.currentRunningId=null;
  S.appSurface=false;
  const surface=$("#appSurface");
  surface.classList.add("hidden");
  surface.style.transition="";
  surface.style.transform="";
  surface.style.opacity="";
  surface.style.borderRadius="";
 }
 render();
}
function removeUserApp(app){if(!app.userAdded)return;closeRunningApp(app.id);if(app.objectUrl)URL.revokeObjectURL(app.objectUrl);const i=apps.indexOf(app);apps.splice(i,1);ensureLibraryLast();S.app=Math.max(0,Math.min(S.app,apps.length-1));closeMenu();render()}

/* ===== single running application ===== */
function openRunningApplicationPage(){
 const e=getRunningEntry();
 openPage({title:"Running Application",subtitle:e?"Only one application can run at a time.":"No application is currently running.",icon:e?.app?.image||"assets/skin/flow/content/library.png",returnZone:"top",items:e?[
  {title:e.app.name,note:e.suspended?"Suspended — input paused":"Running",disabled:true},
  {title:"Resume",action:()=>{backPage();resumeApp(e.app.id)}},
  {title:"Close Application",note:"Next launch will start fresh.",action:()=>{closeRunningApp(e.app.id);openRunningApplicationPage()}}
 ]:[{title:"No running application",note:"Start a game from Home.",disabled:true}]});
}
function openSwitcher(){openRunningApplicationPage()}
function closeSwitcher(){S.switcher=false;$("#switcher")?.classList.add("hidden")}
function renderSwitcher(){}
function moveSwitcher(){}
function activateSwitcher(){}
function closeSelectedRunningApp(){const e=getRunningEntry();if(e)closeRunningApp(e.app.id)}

/* ===== strictly limited popup notifications ===== */
function pushEventNotification(kind,title,text){
 const allowed=new Set(["invite","achievement","recording-start","recording-stop"]);if(!allowed.has(kind))return;
 const time=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});notificationLog.unshift({kind,title,text,time});persistNotifications();
 if(kind==="achievement"){trophyLog.unshift({title,text,time,earnedAt:Date.now()});persistTrophies();}
 const n=document.createElement("div");n.className=`event-note ${kind==="achievement"?"achievement":kind.startsWith("recording")?"recording":""}`;n.innerHTML=`<b>${esc(title)}</b><span>${esc(text)}</span>`;$("#eventNotificationStack").appendChild(n);(kind==="achievement"?trophySound():notificationSound());setTimeout(()=>{n.style.opacity="0";setTimeout(()=>n.remove(),200)},4200);
 if(S.pageOpen&&$("#pageTitle").textContent==="Notifications")openNotificationsPage();
}
window.DorukStationNotify=pushEventNotification;


/* ===== v0.16 Quick Menu / Share overlays ===== */
function activeRunningEntry(){return S.currentRunningId?runningApps.get(S.currentRunningId)||null:getRunningEntry()}
function blockRunningGameForOverlay(blocked){
 const e=activeRunningEntry();if(!e||!S.appSurface)return;
 try{e.iframe.contentWindow.__dorukstationInputBlocked=!!blocked}catch{}
 e.iframe.style.pointerEvents=blocked?"none":"auto";
 e.iframe.allow=blocked?"fullscreen *; autoplay *; pointer-lock *; clipboard-read *; clipboard-write *":"fullscreen *; autoplay *; gamepad *; pointer-lock *; clipboard-read *; clipboard-write *";
 try{e.iframe.contentWindow.postMessage({type:blocked?"dorukstation:overlay-input-block":"dorukstation:overlay-input-release"},"*")}catch{}
 if(!blocked)gateGameInputUntilNeutral(e);
}
function quickMenuEntriesV15(){
 const e=activeRunningEntry(),app=e?.app;
 return [
  {title:"Close Application",icon:"◉",disabled:!e,action:()=>{if(e)closeRunningApp(e.app.id);closeQuickMenu(false);S.zone="home";render()}},
  {title:"Sound/Devices",icon:"♪",note:"Audio and controller options",subs:[{title:"Volume Control",note:"Use system volume",disabled:true},{title:"Output to Headphones",note:"Browser/system controlled",disabled:true},{title:"Mute All Microphones",note:"Browser permission controlled",disabled:true},{title:"Controller",note:"Gamepad API",action:()=>{closeQuickMenu();if(S.appSurface)suspendToHome();setTimeout(()=>{S.zone="top";S.quick=quickItems.findIndex(q=>q.id==="settings");openControllerPage()},520)}}]},
  {title:app?.name||"Application",icon:app?.image||"assets/skin/flow/content/library.png",disabled:!app,note:app?"Running application":"No application",subs:app?[{title:"Resume",action:()=>closeQuickMenu()},{title:"Close Application",action:()=>{closeRunningApp(app.id);closeQuickMenu(false);S.zone="home";render()}}]:[]},
  {title:"Online Friends",icon:"assets/skin/flow/function/friend.png",note:"Local prototype",subs:[{title:"No online friend service connected",disabled:true}]},
  {title:"Power",icon:"assets/skin/flow/function/power.png",note:"User and session controls",subs:[{title:"Log Out of DorukStation",action:()=>{closeQuickMenu(false);showUserSelector()}},{title:"Switch User",action:()=>{closeQuickMenu(false);showUserSelector()}},{title:"Enter Rest Mode",note:"Suspend app and return Home",action:()=>{closeQuickMenu(false);if(S.appSurface)suspendToHome();else{S.zone="home";render()}}},{title:"Turn Off DorukStation",note:"Close running application",action:()=>{const r=activeRunningEntry();if(r)closeRunningApp(r.app.id);closeQuickMenu(false);showUserSelector()}},{title:"Restart DorukStation",action:()=>{if(currentProfile?.guest)cleanupGuestSession("restart");location.reload()}}]},
  {title:"Music",icon:"assets/skin/flow/content/usbmusic.png",note:"USB Music Player",subs:[{title:"No music playing",disabled:true}]},
  {title:"Accessibility",icon:"◉",note:"Accessibility shortcuts",subs:[{title:"Zoom",note:"Browser/system zoom",disabled:true},{title:"Larger Text",note:"Settings",disabled:true},{title:"Button Assignments",note:"Settings → Accessibility",disabled:true}]},
  {title:"Online Status",icon:"assets/skin/flow/function/friend.png",note:navigator.onLine?"Online":"Offline",subs:[{title:"Online",note:navigator.onLine?"Current":"Unavailable offline",disabled:true},{title:"Appear Offline",note:"Local prototype",disabled:true}]},
  {title:"Customize",icon:"assets/skin/flow/function/setting.png",note:themeLabel(),subs:[{title:"Current Theme",note:themeLabel(),disabled:true},{title:"Open Settings",action:()=>{closeQuickMenu(false);if(S.appSurface){suspendToHome();setTimeout(()=>{S.zone="top";S.quick=quickItems.findIndex(q=>q.id==="settings");openSettingsPage()},520)}else openSettingsPage()}}]}
 ];
}
function iconHTML(icon,cls="qm-icon"){return `<span class="${cls}">${String(icon||"").includes("/")?`<img src="${icon}" alt="">`:esc(icon||"•")}</span>`}
function openQuickMenu(){
 if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen)return;closeShareMenu(false);S.quickMenuOpen=true;S.quickMenuPane="main";S.quickMenuIndex=0;S.quickMenuSubIndex=0;showUi("#quickMenuOverlay","forward");$("#quickMenuUser").textContent=S.username;blockRunningGameForOverlay(true);renderQuickMenu();
}
function closeQuickMenu(release=true){if(!S.quickMenuOpen)return;S.quickMenuOpen=false;hideUi("#quickMenuOverlay","back");if(release)blockRunningGameForOverlay(false);v28PlayEvent("quickMenuClose")}
function renderQuickMenu(){
 const entries=quickMenuEntries(),list=$("#quickMenuList"),detail=$("#quickMenuDetail");S.quickMenuIndex=Math.max(0,Math.min(S.quickMenuIndex,entries.length-1));
 list.innerHTML=entries.map((x,i)=>`<div class="qm-row ${i===S.quickMenuIndex&&S.quickMenuPane==="main"?"focused":""} ${x.disabled?"disabled":""}" data-i="${i}">${iconHTML(x.icon)}<span>${esc(x.title)}</span></div>`).join("");
 const cur=entries[S.quickMenuIndex],subs=cur?.subs||[];S.quickMenuSubIndex=Math.max(0,Math.min(S.quickMenuSubIndex,Math.max(0,subs.length-1)));
 detail.innerHTML=`<div class="qm-detail-title">${esc(cur?.title||"")}</div>${cur?.note?`<p class="qm-detail-note">${esc(cur.note)}</p>`:""}${subs.map((x,i)=>`<div class="qm-sub-row ${S.quickMenuPane==="sub"&&i===S.quickMenuSubIndex?"focused":""} ${x.disabled?"disabled":""}" data-sub="${i}"><span>${esc(x.title)}</span>${x.note?`<small>${esc(x.note)}</small>`:""}</div>`).join("")}`;
 $$(".qm-row").forEach(el=>el.onclick=()=>{S.quickMenuIndex=Number(el.dataset.i);S.quickMenuPane="main";S.quickMenuSubIndex=0;renderQuickMenu()});
 $$(".qm-sub-row").forEach(el=>el.onclick=()=>{S.quickMenuPane="sub";S.quickMenuSubIndex=Number(el.dataset.sub);activateQuickMenu()});
}
function moveQuickMenu(dx,dy){const entries=quickMenuEntries();if(S.quickMenuPane==="main"){if(dy){S.quickMenuIndex=Math.max(0,Math.min(entries.length-1,S.quickMenuIndex+dy));S.quickMenuSubIndex=0;navSound();renderQuickMenu()}else if(dx>0&&(entries[S.quickMenuIndex]?.subs||[]).length){S.quickMenuPane="sub";S.quickMenuSubIndex=0;navSound();renderQuickMenu()}}else{const subs=entries[S.quickMenuIndex]?.subs||[];if(dy&&subs.length){S.quickMenuSubIndex=Math.max(0,Math.min(subs.length-1,S.quickMenuSubIndex+dy));navSound();renderQuickMenu()}else if(dx<0){S.quickMenuPane="main";navSound();renderQuickMenu()}}}
function activateQuickMenu(){const entries=quickMenuEntries(),cur=entries[S.quickMenuIndex];if(S.quickMenuPane==="main"){if(cur?.disabled)return;if(cur?.action){selectSound();cur.action()}else if(cur?.subs?.length){S.quickMenuPane="sub";S.quickMenuSubIndex=0;selectSound();renderQuickMenu()}}else{const sub=cur?.subs?.[S.quickMenuSubIndex];if(!sub||sub.disabled)return;selectSound();sub.action?.()}}
function backQuickMenu(){if(S.quickMenuPane==="sub"){S.quickMenuPane="main";backSound();renderQuickMenu()}else closeQuickMenu()}

function shareEntries(){return [
 {title:"Video Clip",icon:"▣",note:"Recording controls are not connected in this web build",disabled:true},
 {title:"Screenshot",icon:"▧",note:"Browser security prevents direct game-frame capture",disabled:true},
 {title:"Broadcast Gameplay",icon:"◉",note:"Broadcast service not connected",disabled:true},
 {title:"Start Share Play",icon:"🎮",note:"Native networking later",disabled:true},
 {sep:true},
 {title:"Save Video Clip",icon:"▣",disabled:true},
 {title:"Save Screenshot",icon:"▧",disabled:true},
 {title:"Sharing and Broadcast Settings",icon:"⚙",action:()=>{closeShareMenu();if(S.appSurface){suspendToHome();setTimeout(()=>{S.zone="top";S.quick=quickItems.findIndex(q=>q.id==="settings");openSettingsPage()},520)}else openSettingsPage()}}
]}
function openShareMenu(){if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen||S.quickMenuOpen)return;S.shareMenuOpen=true;S.shareMenuIndex=0;showUi("#shareMenuOverlay","forward");$("#shareMenuUser").textContent=S.username;blockRunningGameForOverlay(true);renderShareMenu()}
function closeShareMenu(release=true){if(!S.shareMenuOpen)return;S.shareMenuOpen=false;hideUi("#shareMenuOverlay","back");if(release)blockRunningGameForOverlay(false);v28PlayEvent("shareClose")}
function renderShareMenu(){const items=shareEntries(),valid=items.map((x,i)=>!x.sep?i:-1).filter(i=>i>=0);if(!valid.includes(S.shareMenuIndex))S.shareMenuIndex=valid[0]||0;$("#shareMenuList").innerHTML=items.map((x,i)=>x.sep?'<div class="share-separator"></div>':`<div class="share-row ${i===S.shareMenuIndex?"focused":""} ${x.disabled?"disabled":""}" data-i="${i}">${iconHTML(x.icon,"share-icon")}<span>${esc(x.title)}</span></div>`).join("");$$(".share-row").forEach(el=>el.onclick=()=>{S.shareMenuIndex=Number(el.dataset.i);activateShareMenu()})}
function moveShareMenu(d){const items=shareEntries();let i=S.shareMenuIndex;do{i=Math.max(0,Math.min(items.length-1,i+d))}while(items[i]?.sep&&i>0&&i<items.length-1);S.shareMenuIndex=i;navSound();renderShareMenu()}
function activateShareMenu(){const x=shareEntries()[S.shareMenuIndex];if(!x||x.sep||x.disabled)return;selectSound();x.action?.()}

function psShortPress(){if(S.quickMenuOpen){closeQuickMenu();return}if(S.shareMenuOpen){closeShareMenu();return}if(S.appSurface){suspendToHome();return}if(S.pageOpen){while(S.pageOpen)backPage()}S.zone="home";render()}
function beginKeyboardPsHold(e){if(keyboardPsDown||S.userSelectOpen||S.createChoiceOpen||S.createUserOpen)return;keyboardPsDown=true;e?.preventDefault?.();clearTimeout(keyboardPsTimer);keyboardPsTimer=setTimeout(()=>{if(!keyboardPsDown)return;psOpenedThisHold=true;openQuickMenu()},PS_HOLD_MS)}
function endKeyboardPsHold(e){if(!keyboardPsDown)return;keyboardPsDown=false;e?.preventDefault?.();clearTimeout(keyboardPsTimer);keyboardPsTimer=null;if(psOpenedThisHold){psOpenedThisHold=false;return}psShortPress()}

/* ===== sounds ===== */
function tone(freq,dur=.05,vol=.018){if(!S.sounds)return;try{audioCtx||=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.stop(audioCtx.currentTime+dur)}catch{}}
function navSound(){tone(670,.04,.014)}function selectSound(){tone(930,.07,.022)}function backSound(){tone(430,.06,.018)}function notificationSound(){tone(790,.08,.014)}

/* ===== keyboard ===== */
document.addEventListener("keydown",e=>{
 const k=e.key;
 if(k==="Home"){beginKeyboardPsHold(e);return}
 if((k==="PrintScreen"||k==="F8")&&!S.userSelectOpen&&!S.createUserOpen){e.preventDefault();openShareMenu();return}
 if(S.createChoiceOpen){
  if(["ArrowUp","ArrowDown","Enter","Escape","Backspace"].includes(k))e.preventDefault();
  if(k==="ArrowUp")moveCreateChoice(-1);else if(k==="ArrowDown")moveCreateChoice(1);else if(k==="Enter")activateCreateChoice();else if(k==="Escape"||k==="Backspace")closeCreateChoice();return;
 }
 if(S.createUserOpen){
  if(["ArrowUp","ArrowDown","Enter","Escape"].includes(k))e.preventDefault();
  if(k==="ArrowUp")moveCreateUser(-1);else if(k==="ArrowDown")moveCreateUser(1);else if(k==="Enter"&&document.activeElement!==$("#createUserName"))activateCreateUser();else if(k==="Enter"&&document.activeElement===$("#createUserName")){S.createUserIndex=1;renderCreateUserFocus()}else if(k==="Escape")closeCreateUser();return;
 }
 if(S.userSelectOpen){
  if(["ArrowLeft","ArrowRight","Enter"].includes(k))e.preventDefault();
  if(k==="ArrowLeft")moveUserSelection(-1);else if(k==="ArrowRight")moveUserSelection(1);else if(k==="Enter")activateUserSelection();
  return;
 }
 if(S.quickMenuOpen){if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter","Escape","Backspace"].includes(k))e.preventDefault();if(k==="ArrowLeft")moveQuickMenu(-1,0);else if(k==="ArrowRight")moveQuickMenu(1,0);else if(k==="ArrowUp")moveQuickMenu(0,-1);else if(k==="ArrowDown")moveQuickMenu(0,1);else if(k==="Enter")activateQuickMenu();else if(k==="Escape"||k==="Backspace")backQuickMenu();return}
 if(S.shareMenuOpen){if(["ArrowUp","ArrowDown","Enter","Escape","Backspace"].includes(k))e.preventDefault();if(k==="ArrowUp")moveShareMenu(-1);else if(k==="ArrowDown")moveShareMenu(1);else if(k==="Enter")activateShareMenu();else if(k==="Escape"||k==="Backspace")closeShareMenu();return}
 /* A running game owns normal keyboard input. Home and Share are reserved by DorukStation. */
 if(S.appSurface)return;
 if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter","Escape","Backspace"].includes(k))e.preventDefault();
 if(k==="ArrowLeft")move(-1,0);else if(k==="ArrowRight")move(1,0);else if(k==="ArrowUp")move(0,-1);else if(k==="ArrowDown")move(0,1);else if(k==="Enter")activate();else if(k==="Escape"||k==="Backspace")back();else if(k.toLowerCase()==="o")options();else if(k==="F2")replayBoot();else if(k==="F10")$("#debug").classList.toggle("hidden");
});
document.addEventListener("keyup",e=>{if(e.key==="Home")endKeyboardPsHold(e)});

/* ===== gamepad ===== */
/*
 v0.15 PS/Home handling
 ----------------------
 The PS button is the Standard Gamepad "Meta" button (index 16), but some
 Sony-compatible pads can be exposed without the standard mapping.  In that
 case Chromium/Linux may expose the physical PS button at another raw index.
 We therefore use index 16 for standard pads and a conservative Sony fallback
 for raw/unmapped pads.  `value` is checked as well as `pressed`, because some
 browsers/controllers update the analog button value more reliably.

 Long-press timing is independent from focus and from the running iframe: the
 shell polls continuously and owns PS/Home.  A small release debounce prevents
 a one-frame false release from turning a long press into a short press.
*/
function gamepadButtonDown(gp,i){
 const x=gp?.buttons?.[i];
 return !!x&&(x.pressed||Number(x.value||0)>.45);
}
function psButtonCandidates(gp){
 if(!gp)return [];
 const n=gp.buttons?.length||0;
 // A standards-mapped controller must expose Home/Meta at index 16.
 if(gp.mapping==="standard")return n>16?[16]:[];
 const id=String(gp.id||"").toLowerCase();
 const sony=/sony|playstation|dualshock|dualsense|wireless controller|ps4|ps5/.test(id);
 if(sony){
  // Raw Sony layouts seen on Linux/browser stacks. Prefer canonical 16 first.
  return [16,12,10,13,17].filter((i,p,a)=>i<n&&a.indexOf(i)===p);
 }
 // For unknown non-standard pads, only use canonical Meta if it exists.
 return n>16?[16]:[];
}
function rememberedPsButton(gp){
 const value=localStorage.getItem(`ds-ps-button-v15:${gp?.id||"unknown"}`);if(value===null)return -1;
 const i=Number(value);return Number.isInteger(i)&&i>=0&&i<(gp?.buttons?.length||0)?i:-1;
}
function findPressedPsButton(gp,now=performance.now()){
 if(!gp)return -1;
 // Standard mapping is unambiguous: Meta/Home is button 16.
 if(gp.mapping==="standard")return gamepadButtonDown(gp,16)?16:-1;
 // Once a raw controller's PS button has been learned, trust ONLY that button.
 const remembered=rememberedPsButton(gp);if(remembered>=0)return gamepadButtonDown(gp,remembered)?remembered:-1;
 // Canonical button 16 is safe to try when present even without standard mapping.
 if((gp.buttons?.length||0)>16&&gamepadButtonDown(gp,16))return 16;
 // Unknown raw Sony layouts are learned only from a continuous 1s hold. Normal
 // X/D-pad/options taps are never treated as short PS presses, fixing the v0.14
 // "app immediately returns home" regression.
 const down=psButtonCandidates(gp).filter(i=>i!==16&&gamepadButtonDown(gp,i));
 if(down.length!==1){rawPsLearningIndex=-1;rawPsLearningStarted=0;return -1}
 const i=down[0];if(rawPsLearningIndex!==i){rawPsLearningIndex=i;rawPsLearningStarted=now;return -1}
 if(now-rawPsLearningStarted>=PS_HOLD_MS){rememberPsButton(gp,i);rawPsJustLearned=true;rawPsLearningIndex=-1;rawPsLearningStarted=0;return i}
 return -1;
}
function rememberPsButton(gp,i){if(!gp||i<0)return;try{localStorage.setItem(`ds-ps-button-v15:${gp.id||"unknown"}`,String(i))}catch{}}
function clearPsHoldTimer(){if(psHoldTimer){clearTimeout(psHoldTimer);psHoldTimer=null}}
function firePsLongPress(gp){if(!psPhysicalDown||psOpenedThisHold||S.userSelectOpen||S.createChoiceOpen||S.createUserOpen)return;psOpenedThisHold=true;rememberPsButton(gp,psActiveButton);openQuickMenu()}
function startPsHold(gp,index,now){
 psPhysicalDown=true;psActiveButton=index;psHoldStarted=now;psLastSeenDown=now;psOpenedThisHold=false;clearPsHoldTimer();
 psHoldTimer=setTimeout(()=>{const live=[...(navigator.getGamepads?.()||[])].find(x=>x&&x.index===gp.index)||gp;const stillDown=gamepadButtonDown(live,psActiveButton)||(performance.now()-psLastSeenDown<PS_RELEASE_DEBOUNCE_MS+80);if(psPhysicalDown&&stillDown)firePsLongPress(live)},PS_HOLD_MS);
}
function finishPsHold(){clearPsHoldTimer();const wasLong=psOpenedThisHold;psPhysicalDown=false;psActiveButton=-1;psHoldStarted=0;psLastSeenDown=0;psOpenedThisHold=false;if(!wasLong)psShortPress()}
function updatePsHold(gp,now){
 if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen){clearPsHoldTimer();psPhysicalDown=false;psActiveButton=-1;psHoldStarted=0;psLastSeenDown=0;psOpenedThisHold=false;return}
 const pressedIndex=findPressedPsButton(gp,now);
 if(pressedIndex>=0){
  if(rawPsJustLearned){rawPsJustLearned=false;psPhysicalDown=true;psActiveButton=pressedIndex;psHoldStarted=now-PS_HOLD_MS;psLastSeenDown=now;psOpenedThisHold=true;openQuickMenu()}
  else if(!psPhysicalDown)startPsHold(gp,pressedIndex,now);else{psLastSeenDown=now;psActiveButton=pressedIndex}
  if(!psOpenedThisHold&&psHoldStarted&&now-psHoldStarted>=PS_HOLD_MS)firePsLongPress(gp)
 }
 else if(psPhysicalDown&&now-psLastSeenDown>PS_RELEASE_DEBOUNCE_MS)finishPsHold();
}
function gamepadLoop(){
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean),gp=pads[0]||null,loopNow=performance.now();
 if(currentProfile?.guest&&currentProfile.boundGamepadIndex!==null){
  const bound=pads.find(x=>x.index===currentProfile.boundGamepadIndex);
  if(bound)guestControllerLastSeen=loopNow;
  else if(!guestLogoutPending&&loopNow-guestControllerLastSeen>1200){guestLogoutPending=true;setTimeout(()=>{guestLogoutPending=false;if(currentProfile?.guest&&![...(navigator.getGamepads?.()||[])].find(x=>x&&x.index===currentProfile.boundGamepadIndex))showUserSelector()},80)}
 }
 if(gp){
  const b=gp.buttons.map(x=>x.pressed),edge=i=>!!b[i]&&!S.lastButtons[i],release=i=>!b[i]&&!!S.lastButtons[i],now=loopNow;
  if(currentProfile?.guest&&currentProfile.boundGamepadIndex===null){currentProfile.boundGamepadIndex=gp.index;guestControllerLastSeen=now}
  if(firstEntryFullscreenArmed&&b.some((pressed,i)=>pressed&&!S.lastButtons[i]))requestEntryFullscreen();

  // PS/Home is tracked continuously, not just on a button edge.
  updatePsHold(gp,now);

  if(S.createChoiceOpen){
   if(edge(12))moveCreateChoice(-1);if(edge(13))moveCreateChoice(1);if(edge(0))activateCreateChoice();if(edge(1))closeCreateChoice();
   const y=gp.axes[1]||0;if(!S.axisLatch&&Math.abs(y)>.72){S.axisLatch=true;moveCreateChoice(y>0?1:-1)}if(Math.abs(y)<.34)S.axisLatch=false;
   S.lastButtons=b;updateDebug(gp);requestAnimationFrame(gamepadLoop);return;
  }
  if(S.createUserOpen){
   if(edge(12))moveCreateUser(-1);if(edge(13))moveCreateUser(1);if(edge(0))activateCreateUser();if(edge(1))closeCreateUser();
   S.lastButtons=b;updateDebug(gp);requestAnimationFrame(gamepadLoop);return;
  }
  if(S.userSelectOpen){
   if(edge(14))moveUserSelection(-1);if(edge(15))moveUserSelection(1);if(edge(0))activateUserSelection();
   const x=gp.axes[0]||0;if(!S.axisLatch&&Math.abs(x)>.72){S.axisLatch=true;moveUserSelection(x>0?1:-1)}if(Math.abs(x)<.34)S.axisLatch=false;
   S.lastButtons=b;updateDebug(gp);requestAnimationFrame(gamepadLoop);return;
  }

  if(edge(8)&&!S.quickMenuOpen){openShareMenu();S.lastButtons=b;updateDebug(gp);requestAnimationFrame(gamepadLoop);return}

  if(S.quickMenuOpen){
   if(edge(12))moveQuickMenu(0,-1);if(edge(13))moveQuickMenu(0,1);if(edge(14))moveQuickMenu(-1,0);if(edge(15))moveQuickMenu(1,0);if(edge(0))activateQuickMenu();if(edge(1))backQuickMenu();
   const x=gp.axes[0]||0,y=gp.axes[1]||0;if(!S.axisLatch&&(Math.abs(x)>.72||Math.abs(y)>.72)){S.axisLatch=true;if(Math.abs(x)>Math.abs(y))moveQuickMenu(x>0?1:-1,0);else moveQuickMenu(0,y>0?1:-1)}if(Math.abs(x)<.34&&Math.abs(y)<.34)S.axisLatch=false;
   S.lastButtons=b;updateDebug(gp);requestAnimationFrame(gamepadLoop);return;
  }
  if(S.shareMenuOpen){
   if(edge(12))moveShareMenu(-1);if(edge(13))moveShareMenu(1);if(edge(0))activateShareMenu();if(edge(1))closeShareMenu();
   const y=gp.axes[1]||0;if(!S.axisLatch&&Math.abs(y)>.72){S.axisLatch=true;moveShareMenu(y>0?1:-1)}if(Math.abs(y)<.34)S.axisLatch=false;
   S.lastButtons=b;updateDebug(gp);requestAnimationFrame(gamepadLoop);return;
  }

  if(S.appSurface){
   /* PS/Home and SHARE are reserved above. Everything else remains game input. */
   S.lastButtons=b;updateDebug(gp);requestAnimationFrame(gamepadLoop);return;
  }

  if(edge(12))move(0,-1);if(edge(13))move(0,1);if(edge(14))move(-1,0);if(edge(15))move(1,0);
  if(edge(0))activate();if(edge(1))back();if(edge(9))options();
  const x=gp.axes[0]||0,y=gp.axes[1]||0;
  if(!S.axisLatch&&(Math.abs(x)>.72||Math.abs(y)>.72)){S.axisLatch=true;if(Math.abs(x)>Math.abs(y))move(x>0?1:-1,0);else move(0,y>0?1:-1)}
  if(Math.abs(x)<.34&&Math.abs(y)<.34)S.axisLatch=false;
  S.lastButtons=b;updateDebug(gp)
 }else{S.lastButtons=[];updateDebug(null)}
 requestAnimationFrame(gamepadLoop)
}
requestAnimationFrame(gamepadLoop);

function updateDebug(gp){if($("#debug").classList.contains("hidden"))return;$("#debug").textContent=`user=${currentProfile?.name||"SELECT"} guest=${!!currentProfile?.guest} folder=${currentProfile?folderForProfile(currentProfile):"-"}\nzone=${S.zone}\napp=${S.app} ${apps[S.app]?.name}\nquick=${S.quick} ${quickItems[S.quick]?.name}\npage=${S.pageOpen} ${$("#pageTitle").textContent}\npageIndex=${S.pageIndex}\nmenu=${!$("#rightMenu").classList.contains("hidden")}\nrunningApps=${runningApps.size}\nappSurface=${S.appSurface}\nquickMenu=${S.quickMenuOpen} shareMenu=${S.shareMenuOpen}\ntheme=${JSON.stringify(S.theme)}\ngamepad=${gp?gp.id:"none"}\nmapping=${gp?gp.mapping:"-"} buttons=${gp?gp.buttons.length:0}\npsButton=${psActiveButton} psHeld=${psPhysicalDown} psMs=${psHoldStarted?Math.round(performance.now()-psHoldStarted):0}`}
function replayBoot(){syncDorukStationBootLogo();$("#bootScreen").style.display="grid";$("#bootScreen").classList.remove("out");setTimeout(()=>$("#bootScreen").classList.add("out"),1450);setTimeout(()=>$("#bootScreen").style.display="none",2250)}




/* ===== v0.19 stable multi-controller ownership / reconnect leases / per-user Home / digital keyboard ===== */
const V16_AVATARS = [{"src":"assets/profile_pics/Action/Fist.png","category":"Action","name":"Fist"},{"src":"assets/profile_pics/Action/RocketIcon.png","category":"Action","name":"Rocket Icon"},{"src":"assets/profile_pics/Action/SwingingHeroIcon.png","category":"Action","name":"Swinging Hero Icon"},{"src":"assets/profile_pics/Animals/ArmoredCat.png","category":"Animals","name":"Armored Cat"},{"src":"assets/profile_pics/Anime/BlueEyedAnimeGirl.png","category":"Anime","name":"Blue Eyed Anime Girl"},{"src":"assets/profile_pics/Anime/RedEyedAnimeGirl.png","category":"Anime","name":"Red Eyed Anime Girl"},{"src":"assets/profile_pics/Avatars/FootballHelmetAvatar.png","category":"Avatars","name":"Football Helmet Avatar"},{"src":"assets/profile_pics/Avatars/GlassesAvatar.png","category":"Avatars","name":"Glasses Avatar"},{"src":"assets/profile_pics/Avatars/HeadphonesAvatar.png","category":"Avatars","name":"Headphones Avatar"},{"src":"assets/profile_pics/Avatars/KnightHelmetAvatar.png","category":"Avatars","name":"Knight Helmet Avatar"},{"src":"assets/profile_pics/Avatars/LuchadorMaskAvatar.png","category":"Avatars","name":"Luchador Mask Avatar"},{"src":"assets/profile_pics/Avatars/MilitaryHelmetAvatar.png","category":"Avatars","name":"Military Helmet Avatar"},{"src":"assets/profile_pics/Avatars/MinerHatAvatar.png","category":"Avatars","name":"Miner Hat Avatar"},{"src":"assets/profile_pics/Avatars/PigtailsAvatar.png","category":"Avatars","name":"Pigtails Avatar"},{"src":"assets/profile_pics/Avatars/RacingHelmetAvatar.png","category":"Avatars","name":"Racing Helmet Avatar"},{"src":"assets/profile_pics/Avatars/SamuraiHelmetAvatar.png","category":"Avatars","name":"Samurai Helmet Avatar"},{"src":"assets/profile_pics/Avatars/ShadowArcherAvatar.png","category":"Avatars","name":"Shadow Archer Avatar"},{"src":"assets/profile_pics/Awards/Trophy.png","category":"Awards","name":"Trophy"},{"src":"assets/profile_pics/Cartoons/CartoonCatsIcon.png","category":"Cartoons","name":"Cartoon Cats Icon"},{"src":"assets/profile_pics/Cartoons/FlamingIceCreamClown.png","category":"Cartoons","name":"Flaming Ice Cream Clown"},{"src":"assets/profile_pics/Cartoons/PuzzlePieceFace.png","category":"Cartoons","name":"Puzzle Piece Face"},{"src":"assets/profile_pics/Creatures/OrangeCreature.png","category":"Creatures","name":"Orange Creature"},{"src":"assets/profile_pics/Creatures/SackRobotIceCream.png","category":"Creatures","name":"Sack Robot Ice Cream"},{"src":"assets/profile_pics/Creatures/SpikySackCreature.png","category":"Creatures","name":"Spiky Sack Creature"},{"src":"assets/profile_pics/Creatures/StoneColossus.png","category":"Creatures","name":"Stone Colossus"},{"src":"assets/profile_pics/Fantasy/ArmoredCatHero.png","category":"Fantasy","name":"Armored Cat Hero"},{"src":"assets/profile_pics/Fantasy/BlasterMonkey.png","category":"Fantasy","name":"Blaster Monkey"},{"src":"assets/profile_pics/Fantasy/FeatherBoy.png","category":"Fantasy","name":"Feather Boy"},{"src":"assets/profile_pics/Fantasy/FireFairy.png","category":"Fantasy","name":"Fire Fairy"},{"src":"assets/profile_pics/Fantasy/GreenHairedElf.png","category":"Fantasy","name":"Green Haired Elf"},{"src":"assets/profile_pics/Fantasy/HornedBlueElf.png","category":"Fantasy","name":"Horned Blue Elf"},{"src":"assets/profile_pics/Fantasy/MaskedElf.png","category":"Fantasy","name":"Masked Elf"},{"src":"assets/profile_pics/Fantasy/SplitFaceElf.png","category":"Fantasy","name":"Split Face Elf"},{"src":"assets/profile_pics/Fantasy/SplitRobotCat.png","category":"Fantasy","name":"Split Robot Cat"},{"src":"assets/profile_pics/Icons/BrainIcon.png","category":"Icons","name":"Brain Icon"},{"src":"assets/profile_pics/Icons/MusicNoteCharacter.png","category":"Icons","name":"Music Note Character"},{"src":"assets/profile_pics/Icons/OneEyedArcherIcon.png","category":"Icons","name":"One Eyed Archer Icon"},{"src":"assets/profile_pics/Icons/OneEyedSpearIcon.png","category":"Icons","name":"One Eyed Spear Icon"},{"src":"assets/profile_pics/Kids/GrayscaleTeenGirl.png","category":"Kids","name":"Grayscale Teen Girl"},{"src":"assets/profile_pics/Kids/ScissorKid.png","category":"Kids","name":"Scissor Kid"},{"src":"assets/profile_pics/Kids/YoungArcherBoy.png","category":"Kids","name":"Young Archer Boy"},{"src":"assets/profile_pics/Masks_Helmets/HornedMask.png","category":"Masks & Helmets","name":"Horned Mask"},{"src":"assets/profile_pics/Objects/BookCharacter.png","category":"Objects","name":"Book Character"},{"src":"assets/profile_pics/Objects/LowriderCar.png","category":"Objects","name":"Lowrider Car"},{"src":"assets/profile_pics/Objects/PlayingCardsCharacter.png","category":"Objects","name":"Playing Cards Character"},{"src":"assets/profile_pics/People/BeanieManPortrait.png","category":"People","name":"Beanie Man Portrait"},{"src":"assets/profile_pics/People/BeardedManPortrait.png","category":"People","name":"Bearded Man Portrait"},{"src":"assets/profile_pics/People/BraidedWomanPortrait.png","category":"People","name":"Braided Woman Portrait"},{"src":"assets/profile_pics/People/BrunetteWomanPortrait.png","category":"People","name":"Brunette Woman Portrait"},{"src":"assets/profile_pics/People/DarkSkinnedWomanPortrait.png","category":"People","name":"Dark Skinned Woman Portrait"},{"src":"assets/profile_pics/People/GrayscaleBeardedMan.png","category":"People","name":"Grayscale Bearded Man"},{"src":"assets/profile_pics/People/MaskedBlondeWoman.png","category":"People","name":"Masked Blonde Woman"},{"src":"assets/profile_pics/People/OlderMustachedMan.png","category":"People","name":"Older Mustached Man"},{"src":"assets/profile_pics/People/ScreamingWomanPortrait.png","category":"People","name":"Screaming Woman Portrait"},{"src":"assets/profile_pics/People/SternWomanPortrait.png","category":"People","name":"Stern Woman Portrait"},{"src":"assets/profile_pics/People/WetHairedManPortrait.png","category":"People","name":"Wet Haired Man Portrait"},{"src":"assets/profile_pics/People/WorriedBlondeWoman.png","category":"People","name":"Worried Blonde Woman"},{"src":"assets/profile_pics/Robots/SilverRobot.png","category":"Robots","name":"Silver Robot"},{"src":"assets/profile_pics/Sports/GolfBoy.png","category":"Sports","name":"Golf Boy"},{"src":"assets/profile_pics/Sports/GolfGirl.png","category":"Sports","name":"Golf Girl"},{"src":"assets/profile_pics/Symbols/CrossedBowAndAxe.png","category":"Symbols","name":"Crossed Bow And Axe"},{"src":"assets/profile_pics/Symbols/RainbowFaceSilhouette.png","category":"Symbols","name":"Rainbow Face Silhouette"},{"src":"assets/profile_pics/Symbols/SwordShieldCrest.png","category":"Symbols","name":"Sword Shield Crest"},{"src":"assets/profile_pics/Travelers/TravelerFront.png","category":"Travelers","name":"Traveler Front"},{"src":"assets/profile_pics/Travelers/TravelerRedCloak.png","category":"Travelers","name":"Traveler Red Cloak"},{"src":"assets/profile_pics/Travelers/TravelerSide.png","category":"Travelers","name":"Traveler Side"},{"src":"assets/profile_pics/Warriors/BaldWarriorPortrait.png","category":"Warriors","name":"Bald Warrior Portrait"},{"src":"assets/profile_pics/Warriors/CrowWarriorPortrait.png","category":"Warriors","name":"Crow Warrior Portrait"},{"src":"assets/profile_pics/Warriors/HoodedHunter.png","category":"Warriors","name":"Hooded Hunter"}];
const V16_DEFAULT_AVATAR = V16_AVATARS[0]?.src || GUEST_AVATAR;
const V16_CONTROLLER_ICON="assets/skin/flow/content/shareplay.png";
const V16_BATTERY={empty:"assets/system/battery-empty.svg",low:"assets/system/battery-low.svg",mid:"assets/system/battery-mid.svg",full:"assets/system/battery-full.svg",charging:"assets/system/battery-charging.svg"};
const controllerAssignments=new Map(); // gamepad index -> profile id
const profileAssignments=new Map();    // profile id -> gamepad index
const controllerFrames=new Map();      // gamepad index -> runtime input state
const guestProfilesV16=new Map();
const guestShellStoresV16=new Map();
const guestDbRegistryV16=new Map();
const pendingControllerLogins=[];
let selectingControllerIndex=null; // null = keyboard/device login
let activeControllerIndex=null;
let deviceProfileId=null;
let pendingResumeAfterLogin=null;
let deviceBatteryManager=null;
let lastBatteryUiUpdate=0;
const lowBatteryNotified=new Set();
let selectedAudioSinkId="";
let pendingCreateAvatar=V16_DEFAULT_AVATAR;
let avatarPickerTarget="profile",avatarCategoryIndex=0,avatarGridIndex=0,avatarFocusArea="categories";

function profileById(id){return profiles.find(p=>p.id===id)||guestProfilesV16.get(id)||(currentProfile?.id===id?currentProfile:null)}
function avatarForProfile(p){return p?.avatar||V16_DEFAULT_AVATAR||GUEST_AVATAR}
function guestStoreFor(p=currentProfile){if(!p?.guest)return null;let m=guestShellStoresV16.get(p.id);if(!m){m=new Map();guestShellStoresV16.set(p.id,m)}return m}
function pGet(key,fallback=null){if(!currentProfile)return fallback;if(currentProfile.guest){const m=guestStoreFor(currentProfile);return m.has(key)?m.get(key):fallback}let v=localStorage.getItem(profileKey(key));if(v===null){v=localStorage.getItem(legacyProfileKey(key));if(v!==null)localStorage.setItem(profileKey(key),v)}return v===null?fallback:v}
function pSet(key,value){if(!currentProfile)return;if(currentProfile.guest){guestStoreFor(currentProfile).set(key,String(value));return}localStorage.setItem(profileKey(key),String(value))}
function registerGuestDb(name){if(!currentProfile?.guest||!name)return;let s=guestDbRegistryV16.get(currentProfile.id);if(!s){s=new Set();guestDbRegistryV16.set(currentProfile.id,s)}s.add(name);try{localStorage.setItem(STALE_GUEST_DB_KEY,JSON.stringify([...new Set([...guestDbRegistryV16.values()].flatMap(x=>[...x]))]))}catch{}}
function cleanupGuestProfile(profile,reason="end"){if(!profile?.guest)return;const prefix=`dorukstation:${folderForProfile(profile)}`;try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith(prefix))localStorage.removeItem(k)}}catch{}const known=[...(guestDbRegistryV16.get(profile.id)||[])];for(const n of known)try{indexedDB.deleteDatabase(n)}catch{};try{indexedDB.databases?.().then(dbs=>{for(const d of dbs||[])if(d.name?.startsWith(prefix))indexedDB.deleteDatabase(d.name)}).catch(()=>{})}catch{}guestShellStoresV16.delete(profile.id);guestDbRegistryV16.delete(profile.id);guestProfilesV16.delete(profile.id)}
function migrateAvatars(){let dirty=false;for(const p of profiles){if(!p.avatar){p.avatar=V16_DEFAULT_AVATAR;dirty=true}}if(dirty)saveProfiles()}
migrateAvatars();

function controllerLabel(index){return Number.isInteger(index)?`Controller ${index+1}`:"This Device"}
function assignmentForProfile(id){if(profileAssignments.has(id))return {type:"controller",index:profileAssignments.get(id)};if(deviceProfileId===id)return {type:"device",index:null};return null}
function updateUserSelectHeading(){
 const t=$("#userSelectTitle"),s=$("#userSelectSubtitle");if(!t||!s)return;
 t.textContent=selectingControllerIndex===null?"Select User":`${controllerLabel(selectingControllerIndex)} — Select User`;
 s.textContent=selectingControllerIndex===null?"Choose the account for this device. Saves, trophies and settings stay separate.":"Choose one account for this controller. Selecting an account already in use transfers it to this controller.";
}
function renderUserSelector(){
 const box=$("#userCards");if(!box)return;updateUserSelectHeading();
 const items=[...profiles,{id:"__add__",name:"Create User",add:true}];S.userIndex=Math.max(0,Math.min(S.userIndex,items.length-1));
 box.innerHTML=items.map((p,i)=>{
   if(p.add)return `<button class="user-card ${i===S.userIndex?"focused":""}" data-i="${i}"><div class="user-plus" aria-hidden="true">+</div><span>${esc(p.name)}</span><small>New user or temporary guest</small></button>`;
   const a=assignmentForProfile(p.id),same=a?.type==="controller"&&a.index===selectingControllerIndex;
   let status=`<small>${esc(p.folder||folderForProfile(p))}</small>`;
   if(a)status=`<small class="user-selected-status"><img src="${V16_CONTROLLER_ICON}" alt="">${same?"Selected on this controller":`${a.type==="controller"?controllerLabel(a.index):"Device"} · Already Selected`}</small>`;
   return `<button class="user-card ${i===S.userIndex?"focused":""}" data-i="${i}"><img class="profile-avatar" src="${avatarForProfile(p)}" alt="${esc(p.name)}"><span>${esc(p.name)}</span>${status}</button>`;
 }).join("");
 $$(".user-card").forEach(el=>el.onclick=()=>{S.userIndex=Number(el.dataset.i);activateUserSelection()});
}
function showUserSelector(controllerIndex=activeControllerIndex){
 const switchingIndex=Number.isInteger(controllerIndex)?controllerIndex:null;
 if(currentProfile?.guest&&((switchingIndex!==null&&profileAssignments.get(currentProfile.id)===switchingIndex)||(switchingIndex===null&&deviceProfileId===currentProfile.id))){
   const entry=getRunningEntry();if(entry?.profileId===currentProfile.id)closeRunningApp(entry.app.id);
   if(switchingIndex!==null)removeControllerAssignment(switchingIndex,"switched users",true);else deviceProfileId=null;
   pushSystemNotification("logout",`${currentProfile.name} session ended`,"Guest data has been deleted.",currentProfile);cleanupGuestProfile(currentProfile,"switch-user");currentProfile=null;S.username="User";
 }
 if(S.appSurface){pendingResumeAfterLogin=S.currentRunningId;suspendToHome()}
 selectingControllerIndex=switchingIndex;
 S.userSelectOpen=true;S.createChoiceOpen=false;S.createUserOpen=false;S.avatarPickerOpen=false;
 hideUi("#createUserChoice","back");hideUi("#createUserView","back");hideUi("#avatarPicker","back");
 const preferred=currentProfile?.id||localStorage.getItem(PROFILE_LAST_KEY),i=profiles.findIndex(p=>p.id===preferred);S.userIndex=i>=0?i:0;
 setUserFlowVisual(true);showUi("#userSelect","back");renderUserSelector();
}
function removeControllerAssignment(index,reason="unassigned",notify=true){
 const id=controllerAssignments.get(index);if(!id)return null;const p=profileById(id);controllerAssignments.delete(index);if(profileAssignments.get(id)===index)profileAssignments.delete(id);
 if(notify&&p)pushSystemNotification("logout",`${p.name} signed out`,`${controllerLabel(index)} ${reason}.`,p);
 return p;
}
function transferProfileToController(profile,index){
 const previous=profileAssignments.get(profile.id);
 if(previous!==undefined&&previous!==index){removeControllerAssignment(previous,"was replaced by another controller",true)}
 const oldForController=controllerAssignments.get(index);if(oldForController&&oldForController!==profile.id){const op=profileById(oldForController);controllerAssignments.delete(index);if(profileAssignments.get(oldForController)===index)profileAssignments.delete(oldForController);if(op)pushSystemNotification("logout",`${op.name} signed out`,`${controllerLabel(index)} switched users.`,op)}
 if(deviceProfileId===profile.id)deviceProfileId=null;
 controllerAssignments.set(index,profile.id);profileAssignments.set(profile.id,index);activeControllerIndex=index;
}
function transferProfileToDevice(profile){
 const previous=profileAssignments.get(profile.id);if(previous!==undefined){removeControllerAssignment(previous,"was transferred to this device",true)}
 deviceProfileId=profile.id;activeControllerIndex=null;
}
function finishUserLogin(profile){
 const sameCurrent=currentProfile?.id===profile.id;
 if(selectingControllerIndex===null)transferProfileToDevice(profile);else transferProfileToController(profile,selectingControllerIndex);
 if(!sameCurrent){loadProfileState(profile);applyTheme();S.zone="home";S.app=0;S.quick=0;render()}else{S.username=profile.name;renderQuick();renderHome()}
 S.userSelectOpen=false;S.createChoiceOpen=false;S.createUserOpen=false;hideUi("#userSelect","forward");hideUi("#createUserChoice","forward");hideUi("#createUserView","forward");setTimeout(()=>setUserFlowVisual(false),UI_EXIT_MS);
 pushSystemNotification("login",`${profile.name} logged in`,activeControllerIndex===null?"Using this device.":`${controllerLabel(activeControllerIndex)} assigned.`,profile);
 updateSessionStatus(true);applyPreferredAudioSink();
 const resume=pendingResumeAfterLogin;pendingResumeAfterLogin=null;
 const entry=getRunningEntry();if(resume&&entry?.app.id===resume&&entry.profileId===profile.id)setTimeout(()=>resumeApp(resume),360);
 setTimeout(beginNextControllerLogin,380);
}
function activateUserSelection(){
 const item=[...profiles,{id:"__add__",name:"Create User",add:true}][S.userIndex];if(!item)return;if(item.add){openCreateChoice();return}
 finishUserLogin(item);
}
function confirmCreateUser(){
 const input=$("#createUserName"),name=input.value.trim();if(!name){S.createUserIndex=0;renderCreateUserFocus();input.focus();return}
 const id=`user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
 const p={id,name:name.slice(0,24),createdAt:Date.now(),folder:`users/${id}/`,foldered:true,avatar:pendingCreateAvatar||V16_DEFAULT_AVATAR};profiles.push(p);saveProfiles();finishUserLogin(p);selectSound();
}
function startGuestSession(){
 const id=`guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;guestShellStore=new Map();guestDbNames=new Set();guestLogoutPending=false;
 const guest={id,name:"Guest",guest:true,createdAt:Date.now(),folder:`users/__guest__/${id}/`,boundGamepadIndex:Number.isInteger(selectingControllerIndex)?selectingControllerIndex:null,avatar:GUEST_AVATAR};guestProfilesV16.set(id,guest);guestShellStoresV16.set(id,new Map());guestDbRegistryV16.set(id,new Set());
 if(guest.boundGamepadIndex!==null)guestControllerLastSeen=performance.now();finishUserLogin(guest);selectSound();
}
function openCreateUser(){S.createChoiceOpen=false;S.createUserOpen=true;S.createUserIndex=0;pendingCreateAvatar=V16_DEFAULT_AVATAR;swapUi("#createUserChoice","#createUserView","forward");$("#createUserName").value="";$(".create-user-avatar").src=pendingCreateAvatar;renderCreateUserFocus()}

function beginControllerLogin(index){
 if(!Number.isInteger(index)||controllerAssignments.has(index)||pendingControllerLogins.includes(index)||selectingControllerIndex===index&&S.userSelectOpen)return;
 pendingControllerLogins.push(index);beginNextControllerLogin();
}
function beginNextControllerLogin(){
 if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen||S.avatarPickerOpen)return;
 while(pendingControllerLogins.length){const index=pendingControllerLogins.shift();const gp=[...(navigator.getGamepads?.()||[])].find(g=>g&&g.index===index);if(!gp||controllerAssignments.has(index))continue;showUserSelector(index);return}
}
function activateAssignedController(index){
 const id=controllerAssignments.get(index),p=profileById(id);if(!p)return;
 if(activeControllerIndex===index&&currentProfile?.id===id)return;
 if(S.appSurface&&getRunningEntry()?.profileId!==id){pendingResumeAfterLogin=null;suspendToHome()}
 activeControllerIndex=index;deviceProfileId=deviceProfileId===id?null:deviceProfileId;
 if(currentProfile?.id!==id){loadProfileState(p);applyTheme();S.zone="home";render()}updateSessionStatus(true);
}
function initialControllerLoginSequence(){
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean).sort((a,b)=>a.index-b.index);
 if(pads.length){S.userSelectOpen=false;hideUi("#userSelect","back");for(const gp of pads)pendingControllerLogins.push(gp.index);beginNextControllerLogin()}
 else{selectingControllerIndex=null;S.userSelectOpen=true;showUi("#userSelect","back");renderUserSelector()}
}

/* Avatar picker */
function avatarCategories(){return ["All",...Array.from(new Set(V16_AVATARS.map(a=>a.category)))]}
function visibleAvatars(){const c=avatarCategories()[avatarCategoryIndex]||"All";return c==="All"?V16_AVATARS:V16_AVATARS.filter(a=>a.category===c)}
function openAvatarPicker(target="profile"){
 avatarPickerTarget=target;avatarCategoryIndex=0;avatarGridIndex=0;avatarFocusArea="categories";S.avatarPickerOpen=true;
 if(target==="create")hideUi("#createUserView","forward");else if(S.pageOpen)hideUi("#pageView","forward");showUi("#avatarPicker","forward");renderAvatarPicker();
}
function closeAvatarPicker(){S.avatarPickerOpen=false;hideUi("#avatarPicker","back");if(avatarPickerTarget==="create")showUi("#createUserView","back");else if(S.pageOpen)showUi("#pageView","back");backSound()}
function renderAvatarPicker(){
 const cats=avatarCategories(),avs=visibleAvatars();avatarCategoryIndex=Math.max(0,Math.min(avatarCategoryIndex,cats.length-1));avatarGridIndex=Math.max(0,Math.min(avatarGridIndex,Math.max(0,avs.length-1)));
 $("#avatarCategories").innerHTML=cats.map((c,i)=>`<button class="avatar-category ${avatarFocusArea==="categories"&&i===avatarCategoryIndex?"focused":""}" data-c="${i}">${esc(c)}</button>`).join("");
 const selected=avatarPickerTarget==="create"?pendingCreateAvatar:avatarForProfile(currentProfile);
 $("#avatarGrid").innerHTML=avs.map((a,i)=>`<button class="avatar-tile ${avatarFocusArea==="grid"&&i===avatarGridIndex?"focused":""} ${a.src===selected?"selected":""}" data-a="${i}" title="${esc(a.name)}"><img src="${a.src}" alt="${esc(a.name)}"></button>`).join("");
 $$(".avatar-category").forEach(el=>el.onclick=()=>{avatarCategoryIndex=Number(el.dataset.c);avatarGridIndex=0;avatarFocusArea="grid";renderAvatarPicker()});
 $$(".avatar-tile").forEach(el=>el.onclick=()=>{avatarGridIndex=Number(el.dataset.a);chooseAvatar()});
 $("#avatarCategories .focused")?.scrollIntoView({block:"nearest"});$("#avatarGrid .focused")?.scrollIntoView({block:"nearest"});
}
function moveAvatar(dx,dy){
 const cats=avatarCategories(),avs=visibleAvatars(),cols=7;
 if(dx<0&&avatarFocusArea==="grid"){avatarFocusArea="categories";navSound();renderAvatarPicker();return}if(dx>0&&avatarFocusArea==="categories"){avatarFocusArea="grid";navSound();renderAvatarPicker();return}
 if(avatarFocusArea==="categories"&&dy){avatarCategoryIndex=Math.max(0,Math.min(cats.length-1,avatarCategoryIndex+dy));avatarGridIndex=0;navSound();renderAvatarPicker();return}
 if(avatarFocusArea==="grid"){if(dx)avatarGridIndex=Math.max(0,Math.min(avs.length-1,avatarGridIndex+dx));if(dy)avatarGridIndex=Math.max(0,Math.min(avs.length-1,avatarGridIndex+dy*cols));navSound();renderAvatarPicker()}
}
function chooseAvatar(){const a=visibleAvatars()[avatarGridIndex];if(!a)return;if(avatarPickerTarget==="create"){pendingCreateAvatar=a.src;$(".create-user-avatar").src=a.src}else if(currentProfile){currentProfile.avatar=a.src;if(!currentProfile.guest)saveProfiles();renderQuick();updateSessionStatus(true)}selectSound();closeAvatarPicker()}
$("#changeAvatarButton").onclick=()=>openAvatarPicker("create");

function renderQuick(){
 $("#quickButtons").innerHTML=quickItems.map((q,i)=>`<button class="quick-button ${S.zone==="top"&&S.quick===i&&!S.pageOpen?"focused":""} ${q.avatar?"avatar":""}" data-i="${i}" title="${esc(q.name)}">${q.avatar?`<img src="${avatarForProfile(currentProfile)}" alt="${esc(S.username)}">`:`<img src="${q.image}" alt="">`}</button>`).join("");
 $$(".quick-button").forEach(el=>el.onclick=()=>{S.zone="top";S.quick=Number(el.dataset.i);render();activate()});const q=quickItems[S.quick];$("#quickTitle").textContent=q?.name||"";updateSessionStatus();
}
function updateSideMenuAvatars(){const src=avatarForProfile(currentProfile);const q=$("#quickMenuOverlay .side-menu-user img"),s=$("#shareMenuOverlay .side-menu-user img");if(q)q.src=src;if(s)s.src=src}
function openQuickMenu(){if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen||S.avatarPickerOpen)return;closeShareMenu(false);S.quickMenuOpen=true;S.quickMenuPane="main";S.quickMenuIndex=0;S.quickMenuSubIndex=0;showUi("#quickMenuOverlay","forward");$("#quickMenuUser").textContent=S.username;updateSideMenuAvatars();blockRunningGameForOverlay(true);renderQuickMenu()}
function openShareMenu(){if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen||S.avatarPickerOpen||S.quickMenuOpen)return;S.shareMenuOpen=true;S.shareMenuIndex=0;showUi("#shareMenuOverlay","forward");$("#shareMenuUser").textContent=S.username;updateSideMenuAvatars();blockRunningGameForOverlay(true);renderShareMenu()}

function openProfilePage(){openPage({title:"Profile",subtitle:`${currentProfile?.guest?"Temporary guest":"Local DorukStation user"} · ${folderForProfile(currentProfile)}`,icon:avatarForProfile(currentProfile),returnZone:"top",items:[{title:"Profile Picture",note:"Change Avatar",image:avatarForProfile(currentProfile),action:()=>openAvatarPicker("profile")},{title:"Username",note:S.username,action:()=>{if(!currentProfile?.guest){renameCurrentProfile();openProfilePage()}}},{title:"User Folder",note:folderForProfile(currentProfile),disabled:true},{title:"Input",note:activeControllerIndex===null?"This device":controllerLabel(activeControllerIndex),disabled:true},{title:"Switch User",note:"Choose another account without deleting the current user's saved data",action:()=>{backPage();showUserSelector(activeControllerIndex)}},{title:"Status",note:navigator.onLine?"Online":"Offline",disabled:true}]})}

function pushSystemNotification(kind,title,text,profile=currentProfile){
 const stack=$("#systemNotificationStack");if(!stack)return;const n=document.createElement("div");n.className=`system-note ${kind||""}`;n.innerHTML=`<img src="${avatarForProfile(profile)}" alt=""><div><b>${esc(title)}</b><span>${esc(text)}</span></div>`;stack.appendChild(n);notificationSound();setTimeout(()=>{n.style.opacity="0";n.style.transform="translateX(-12px)";setTimeout(()=>n.remove(),220)},3200)
}

/* Battery: system battery is standard Battery Status API when available. Gamepad
   battery is intentionally feature-detected because the standard Gamepad API
   does not define a battery field. */
function normalizeBatteryLevel(v){v=Number(v);if(!Number.isFinite(v))return null;if(v<=1)v*=100;return Math.max(0,Math.min(100,Math.round(v)))}
function controllerBatteryInfo(gp){
 if(!gp)return {percent:null,charging:false};const b=gp.battery||gp.power||null;
 let raw=(b&&typeof b==="object")?(b.level??b.value??b.percent):(gp.batteryLevel??gp.batteryPercent??(typeof b==="number"?b:null));
 return {percent:normalizeBatteryLevel(raw),charging:!!(b&&typeof b==="object"&&(b.charging||b.isCharging))};
}
function batteryIcon(info){if(info?.charging)return V16_BATTERY.charging;const p=info?.percent;if(p===null||p===undefined)return V16_BATTERY.empty;if(p<=20)return V16_BATTERY.low;if(p<=60)return V16_BATTERY.mid;return V16_BATTERY.full}
async function initDeviceBattery(){if(!navigator.getBattery)return;try{deviceBatteryManager=await navigator.getBattery();const u=()=>updateSessionStatus(true);deviceBatteryManager.addEventListener("levelchange",u);deviceBatteryManager.addEventListener("chargingchange",u);u()}catch{}}
initDeviceBattery();
function currentBatteryInfo(){
 if(activeControllerIndex!==null){const gp=[...(navigator.getGamepads?.()||[])].find(g=>g&&g.index===activeControllerIndex);return {...controllerBatteryInfo(gp),source:"controller"}}
 if(deviceBatteryManager)return {percent:normalizeBatteryLevel(deviceBatteryManager.level),charging:deviceBatteryManager.charging,source:"device"};return {percent:null,charging:false,source:"device"}
}
function updateSessionStatus(force=false){
 const now=performance.now();if(!force&&now-lastBatteryUiUpdate<500)return;lastBatteryUiUpdate=now;const el=$("#sessionStatus");if(!el)return;if(!currentProfile){el.classList.add("hidden");return}el.classList.remove("hidden");
 $("#sessionAvatar").src=avatarForProfile(currentProfile);$("#sessionUserName").textContent=S.username;$("#sessionInputIcon").textContent=activeControllerIndex===null?"⌨":"🎮";const info=currentBatteryInfo();$("#sessionBatteryIcon").src=batteryIcon(info);$("#sessionBatteryText").textContent=info.percent===null?"—":`${info.percent}%`;el.title=info.percent===null?(info.source==="controller"?"This browser does not expose controller battery percentage":"Battery percentage unavailable"):`${info.source==="controller"?"Controller":"Device"} battery ${info.percent}%`;
}
function monitorControllerBatteries(){for(const [index,id] of controllerAssignments){const gp=[...(navigator.getGamepads?.()||[])].find(g=>g&&g.index===index),p=profileById(id);if(!gp||!p)continue;const info=controllerBatteryInfo(gp),key=`${index}:${id}`;if(info.percent!==null&&info.percent<=20&&!lowBatteryNotified.has(key)){lowBatteryNotified.add(key);pushSystemNotification("low",`${p.name}'s controller battery is low`,`${controllerLabel(index)} · ${info.percent}% remaining.`,p)}else if(info.percent!==null&&info.percent>25)lowBatteryNotified.delete(key)}if(activeControllerIndex===null&&currentProfile&&deviceBatteryManager){const p=normalizeBatteryLevel(deviceBatteryManager.level),key=`device:${currentProfile.id}`;if(p!==null&&p<=20&&!lowBatteryNotified.has(key)){lowBatteryNotified.add(key);pushSystemNotification("low",`${currentProfile.name}'s device battery is low`,`${p}% remaining.`,currentProfile)}else if(p!==null&&p>25)lowBatteryNotified.delete(key)}updateSessionStatus()}
setInterval(monitorControllerBatteries,1500);

/* Audio output: try to keep shell SFX away from controller speaker endpoints.
   Explicit selection is available in Sound/Devices when permission is needed. */
async function ensureAudioContext(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();try{if(audioCtx.state==="suspended")await audioCtx.resume()}catch{}return audioCtx}
async function applyPreferredAudioSink(){
 const ctx=await ensureAudioContext().catch(()=>null);if(!ctx||typeof ctx.setSinkId!=="function")return false;let stored=pGet("audioSinkId","")||selectedAudioSinkId;
 if(stored){try{await ctx.setSinkId(stored);selectedAudioSinkId=stored;return true}catch{}}
 try{const devs=await navigator.mediaDevices?.enumerateDevices?.(),outs=(devs||[]).filter(d=>d.kind==="audiooutput"),bad=/controller|dualshock|dualsense|wireless controller|gamepad/i;const preferred=outs.find(d=>d.deviceId&&d.label&&!bad.test(d.label)&&!/default/i.test(d.deviceId));if(preferred){await ctx.setSinkId(preferred.deviceId);selectedAudioSinkId=preferred.deviceId;pSet("audioSinkId",preferred.deviceId);return true}}catch{}return false;
}
async function chooseAudioOutput(){
 if(!navigator.mediaDevices?.selectAudioOutput){pushSystemNotification("","Audio output selection unavailable","Use your operating system sound settings to choose the laptop speakers.",currentProfile);return}
 try{const d=await navigator.mediaDevices.selectAudioOutput();const ctx=await ensureAudioContext();if(typeof ctx.setSinkId==="function")await ctx.setSinkId(d.deviceId);selectedAudioSinkId=d.deviceId;pSet("audioSinkId",d.deviceId);pushSystemNotification("","Audio output changed",d.label||"Selected speaker output",currentProfile);selectSound()}catch(e){if(e?.name!=="NotAllowedError")pushSystemNotification("","Could not change audio output",e?.message||"Output selection failed.",currentProfile)}
}
const SHELL_SFX_GAIN=4;
function tone(freq,dur=.05,vol=.018){if(!S.sounds)return;ensureAudioContext().then(ctx=>{try{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=freq;g.gain.value=Math.min(.12,vol*SHELL_SFX_GAIN);o.connect(g);g.connect(ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);o.stop(ctx.currentTime+dur)}catch{}}).catch(()=>{})}
function openSoundScreenPage(){openPage({title:"Sound and Screen",subtitle:"DorukStation display and audio preferences.",items:[{title:"Audio Output",note:"Choose laptop speakers / headphones instead of a controller speaker",action:chooseAudioOutput},{title:"Sound Effects",note:S.sounds?"On":"Off",action:()=>{S.sounds=!S.sounds;pSet("sounds",S.sounds?"on":"off");openSoundScreenPage()}},{title:"Background Animation",note:S.animation?"On":"Off",action:()=>{S.animation=!S.animation;pSet("animation",S.animation?"on":"off");applyTheme();openSoundScreenPage()}},{title:"Display",note:"Full-bleed shell / native game viewport",action:openDisplayPage},{title:"Custom Background",action:()=>$("#backgroundPicker").click()}]},true)}
function logoutActiveUser(){
 const p=currentProfile;if(!p)return;const idx=activeControllerIndex;if(S.appSurface)suspendToHome();
 if(idx!==null)removeControllerAssignment(idx,"logged out",false);else if(deviceProfileId===p.id)deviceProfileId=null;
 pushSystemNotification("logout",`${p.name} logged out`,idx===null?"Signed out from this device.":`${controllerLabel(idx)} is ready for another user.`,p);
 if(p.guest){const entry=getRunningEntry();if(entry?.profileId===p.id)closeRunningApp(entry.app.id);cleanupGuestProfile(p,"logout")}currentProfile=null;S.username="User";activeControllerIndex=null;showUserSelector(idx);
}
const _v16QuickMenuEntries=quickMenuEntriesV15;
function quickMenuEntries(){const items=_v16QuickMenuEntries();const sd=items.find(x=>x.title==="Sound/Devices");if(sd)sd.subs=[{title:"Audio Output",note:"Choose speakers / headphones",action:chooseAudioOutput},{title:"Volume Control",note:"Use system volume",disabled:true},{title:"Mute All Microphones",note:"Browser permission controlled",disabled:true},{title:"Controller",note:activeControllerIndex===null?"No controller assigned":controllerLabel(activeControllerIndex),disabled:true}];const power=items.find(x=>x.title==="Power");if(power?.subs){const log=power.subs.find(x=>x.title.startsWith("Log Out"));if(log)log.action=()=>{closeQuickMenu(false);logoutActiveUser()}}return items}

/* Keep a running app associated with the account that launched it. */
function launchApp(app){
 let source=app.objectUrl||((app.legacyUrl&&currentProfile?.legacy)?app.legacyUrl:app.url);if(!source||!currentProfile)return;if(app.profiled&&!app.profiledInjected&&!currentProfile.legacy){const u=new URL(source,location.href);u.searchParams.set("dsProfile",currentProfile.id);u.searchParams.set("dsApp",app.id);u.searchParams.set("dsFolder",folderForProfile(currentProfile));if(currentProfile.foldered||currentProfile.guest)u.searchParams.set("dsFoldered","1");if(currentProfile.guest)u.searchParams.set("dsGuest","1");source=u.href}
 const current=getRunningEntry();if(current&&(current.app.id!==app.id||current.profileId!==currentProfile.id))return requestAppLaunch(app);let e=runningApps.get(app.id);if(e&&e.profileId!==currentProfile.id)return requestAppLaunch(app);
 if(!e){const iframe=document.createElement("iframe");iframe.title=app.name;iframe.allow="fullscreen *; autoplay *; pointer-lock *; clipboard-read *; clipboard-write *";iframe.allowFullscreen=true;iframe.src=source;iframe.dataset.appId=app.id;iframe.tabIndex=-1;iframe.style.cssText="position:absolute;inset:0;width:100%;height:100%;min-width:100%;min-height:100%;border:0;background:#000;display:none;pointer-events:none;visibility:hidden";$("#appSurface").appendChild(iframe);e={iframe,app,suspended:true,profileId:currentProfile.id,profileName:currentProfile.name,profileAvatar:avatarForProfile(currentProfile)};runningApps.set(app.id,e);iframe.addEventListener("load",()=>{makeGameViewportResponsive(e);installInputPauseShim(e);sendGameResolution(e);setGameSuspended(e,e.suspended)})}resumeApp(app.id)
}
function requestAppLaunch(app){const current=getRunningEntry();if(!current)return launchApp(app);if(current.app.id===app.id&&current.profileId===currentProfile?.id)return resumeApp(app.id);openAppMenu("Close running application?",[{label:`Close ${current.app.name} & Open ${app.name}`,note:`${current.app.name} belongs to ${current.profileName||"another user"}. It will be fully closed first.`,action:()=>{closeMenu(false);closeRunningApp(current.app.id);launchApp(app)}},{label:"Cancel",note:`Keep ${current.app.name} suspended and return Home.`,action:()=>{closeMenu(false);S.zone="home";render()}}])}
const _v16ResumeApp=resumeAppV15;
function resumeApp(id){const e=runningApps.get(id);if(!e)return;if(e.profileId&&currentProfile?.id!==e.profileId){const p=profileById(e.profileId);pushSystemNotification("",`${e.app.name} belongs to ${e.profileName||"another user"}`,p?`Switch to ${p.name} to continue.`:"Switch users to continue.",p||currentProfile);return}_v16ResumeApp(id)}
function renderHome(){
 const c=$("#appCarousel"),startBox=$("#startBox");if(startBox&&c.contains(startBox))$("#homeArea").appendChild(startBox);c.innerHTML=apps.map((a,i)=>{const re=runningApps.get(a.id),mine=re?.profileId===currentProfile?.id;return `<div class="app-tile ${S.zone==="home"&&S.app===i&&!S.pageOpen?"focused":""} ${mine?"running":""}" data-i="${i}"><div class="app-icon">${appInner(a)}</div><div class="app-running-dot"></div></div>`}).join("");$$(".app-tile").forEach(el=>el.onclick=()=>{S.zone="home";S.app=Number(el.dataset.i);render();activate()});const focusedTile=c.querySelector(".app-tile.focused")||c.children[S.app];if(startBox&&focusedTile)focusedTile.appendChild(startBox);const focusedOffset=focusedTile?focusedTile.offsetLeft:(S.app*160);c.style.transform=`translateX(${-focusedOffset}px)`;const a=apps[S.app]||apps[0],re=runningApps.get(a.id),running=!!re&&re.profileId===currentProfile?.id;$("#appTitle").textContent=a.name;$("#appDescription").textContent=a.desc;$("#widgetBody").textContent=re&&!running?`${a.live||a.desc} Running for ${re.profileName||"another user"}.`:a.live||a.desc;const canStart=S.zone==="home"&&(["news","browser","gallery","explorer","pick","remote","launch","library","placeholder"].includes(a.action)||running);document.body.classList.toggle("can-start",canStart);const startLabel=running?"Resume":((a.action==="launch"||a.action==="remote")?"Play":"Open");$("#startBoxText").textContent=startLabel;$("#startBox").setAttribute("aria-label",`${startLabel} ${a.name}`);$("#runningLabel").classList.toggle("hidden",!running)
}

/* Limit same-origin games to the controller assigned to the account that owns
   the running application. Other connected controllers stay shell-owned. */
window.__dorukstationAllowedGamepadIndices=()=>{
 const e=getRunningEntry();if(!e?.profileId)return [];
 let i=profileAssignments.get(e.profileId);
 /* Keep the active account/controller relationship authoritative. If a user was
    already active before the assignment map was rebuilt, recover that mapping. */
 if(!Number.isInteger(i)&&currentProfile?.id===e.profileId&&Number.isInteger(activeControllerIndex))i=activeControllerIndex;
 /* Compatibility fallback: with exactly one connected controller, never hide it
    from the active user's game just because an assignment map was lost. */
 if(!Number.isInteger(i)){const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean);if(pads.length===1)i=pads[0].index}
 return Number.isInteger(i)?[i]:[]
};
const _v16InstallInputPauseShim=installInputPauseShimV15;
function installInputPauseShim(e){
 _v16InstallInputPauseShim(e);
 try{
  const w=e.iframe.contentWindow,native=w.navigator.getGamepads?.bind(w.navigator);
  if(!native||w.__dorukstationV17PadFilter)return;
  w.__dorukstationV17PadFilter=true;
  Object.defineProperty(w.navigator,"getGamepads",{configurable:true,value:()=>{
   if(w.__dorukstationSuspended||w.__dorukstationInputBlocked||w.__dorukstationGamepadBlocked)return [];
   const allowed=parent.__dorukstationAllowedGamepadIndices?.()||[];
   /* IMPORTANT: compact the assigned controller to slot 0. A lot of HTML games
      (including controller code in DorukCraft) read getGamepads()[0]. v0.16
      preserved the physical index and returned [null, controller] for controller
      #2, which effectively removed controller support from those games. */
   const pads=Array.from(native()||[]).filter(g=>g&&allowed.includes(g.index));
   return pads;
  }})
 }catch{}
}

/* Per-controller input runtime. The active controller controls the shell; an
   unassigned controller can press a face button/PS to join. */
function controllerRuntime(gp){let r=controllerFrames.get(gp.index);if(!r){r={last:[],axisLatch:false,psDown:false,psStart:0,psLong:false,psIndex:-1,lastPsSeen:0,rawLearnIndex:-1,rawLearnStart:0,rawJustLearned:false};controllerFrames.set(gp.index,r)}return r}
function controllerPsIndex(gp,r,now){if(!gp)return -1;if(gp.mapping==="standard"&&gp.buttons.length>16)return 16;const remembered=rememberedPsButton(gp);if(remembered>=0)return remembered;if(gp.buttons.length>16&&gamepadButtonDown(gp,16))return 16;const down=psButtonCandidates(gp).filter(i=>i!==16&&gamepadButtonDown(gp,i));if(down.length!==1){r.rawLearnIndex=-1;r.rawLearnStart=0;return -1}const i=down[0];if(r.rawLearnIndex!==i){r.rawLearnIndex=i;r.rawLearnStart=now;return -1}if(now-r.rawLearnStart>=PS_HOLD_MS){rememberPsButton(gp,i);r.rawJustLearned=true;r.rawLearnIndex=-1;r.rawLearnStart=0;return i}return -1}
function handleControllerPs(gp,r,now){const i=controllerPsIndex(gp,r,now);if(i<0){if(r.psDown&&now-r.lastPsSeen>PS_RELEASE_DEBOUNCE_MS){const wasLong=r.psLong;r.psDown=false;r.psStart=0;r.psLong=false;if(!wasLong){if(controllerAssignments.has(gp.index)){activateAssignedController(gp.index);psShortPress()}else beginControllerLogin(gp.index)}return true}return false}const down=gamepadButtonDown(gp,i);if(down){r.lastPsSeen=now;if(r.rawJustLearned){r.rawJustLearned=false;r.psDown=true;r.psStart=now-PS_HOLD_MS;r.psLong=true;r.psIndex=i;if(controllerAssignments.has(gp.index)){activateAssignedController(gp.index);openQuickMenu()}else beginControllerLogin(gp.index);return true}if(!r.psDown){r.psDown=true;r.psStart=now;r.psLong=false;r.psIndex=i}if(!r.psLong&&now-r.psStart>=PS_HOLD_MS){r.psLong=true;if(controllerAssignments.has(gp.index)){activateAssignedController(gp.index);openQuickMenu()}else beginControllerLogin(gp.index)}}else if(r.psDown&&now-r.lastPsSeen>PS_RELEASE_DEBOUNCE_MS){const wasLong=r.psLong;r.psDown=false;r.psStart=0;r.psLong=false;if(!wasLong){if(controllerAssignments.has(gp.index)){activateAssignedController(gp.index);psShortPress()}else beginControllerLogin(gp.index)}return true}return down}
function gamepadLoop(){
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean),now=performance.now();
 for(const gp of pads){const r=controllerRuntime(gp),b=gp.buttons.map(x=>x.pressed||x.value>.45),edge=i=>!!b[i]&&!r.last[i];handleControllerPs(gp,r,now);
   if(!controllerAssignments.has(gp.index)&&!S.userSelectOpen&&!S.createChoiceOpen&&!S.createUserOpen&&!S.avatarPickerOpen&&(edge(0)||edge(9)))beginControllerLogin(gp.index);
   if(S.userSelectOpen&&selectingControllerIndex===gp.index){if(edge(14))moveUserSelection(-1);if(edge(15))moveUserSelection(1);if(edge(0))activateUserSelection();const x=gp.axes[0]||0;if(!r.axisLatch&&Math.abs(x)>.72){r.axisLatch=true;moveUserSelection(x>0?1:-1)}if(Math.abs(x)<.34)r.axisLatch=false;r.last=b;continue}
   if((S.createChoiceOpen||S.createUserOpen||S.avatarPickerOpen)&&selectingControllerIndex===gp.index){
      if(S.createChoiceOpen){if(edge(12))moveCreateChoice(-1);if(edge(13))moveCreateChoice(1);if(edge(0))activateCreateChoice();if(edge(1))closeCreateChoice()}
      else if(S.createUserOpen){if(edge(12))moveCreateUser(-1);if(edge(13))moveCreateUser(1);if(edge(0))activateCreateUser();if(edge(1))closeCreateUser()}
      else if(S.avatarPickerOpen){if(edge(12))moveAvatar(0,-1);if(edge(13))moveAvatar(0,1);if(edge(14))moveAvatar(-1,0);if(edge(15))moveAvatar(1,0);if(edge(0)){if(avatarFocusArea==="categories"){avatarFocusArea="grid";renderAvatarPicker()}else chooseAvatar()}if(edge(1))closeAvatarPicker()}
      r.last=b;continue
   }
   /* Restore the active controller from the selected user's assignment if needed.
      This keeps normal D-pad/stick/X navigation working after user/profile UI work. */
   const assignedToCurrent=currentProfile?profileAssignments.get(currentProfile.id):undefined;
   if(!Number.isInteger(activeControllerIndex)&&Number.isInteger(assignedToCurrent))activeControllerIndex=assignedToCurrent;
   if(activeControllerIndex!==gp.index){r.last=b;continue}
   if(firstEntryFullscreenArmed&&b.some((v,i)=>v&&!r.last[i]))requestEntryFullscreen();
   if(edge(8)&&!S.quickMenuOpen&&!S.userSelectOpen){openShareMenu();r.last=b;continue}
   if(S.quickMenuOpen){if(edge(12))moveQuickMenu(0,-1);if(edge(13))moveQuickMenu(0,1);if(edge(14))moveQuickMenu(-1,0);if(edge(15))moveQuickMenu(1,0);if(edge(0))activateQuickMenu();if(edge(1))backQuickMenu();r.last=b;continue}
   if(S.shareMenuOpen){if(edge(12))moveShareMenu(-1);if(edge(13))moveShareMenu(1);if(edge(0))activateShareMenu();if(edge(1))closeShareMenu();r.last=b;continue}
   if(S.appSurface){r.last=b;continue}
   if(edge(12))move(0,-1);if(edge(13))move(0,1);if(edge(14))move(-1,0);if(edge(15))move(1,0);if(edge(0))activate();if(edge(1))back();if(edge(9))options();const x=gp.axes[0]||0,y=gp.axes[1]||0;if(!r.axisLatch&&(Math.abs(x)>.72||Math.abs(y)>.72)){r.axisLatch=true;if(Math.abs(x)>Math.abs(y))move(x>0?1:-1,0);else move(0,y>0?1:-1)}if(Math.abs(x)<.34&&Math.abs(y)<.34)r.axisLatch=false;r.last=b;
 }
 updateSessionStatus();requestAnimationFrame(gamepadLoop)
}

addEventListener("gamepadconnected",e=>v18GamepadConnected(e));
addEventListener("gamepaddisconnected",e=>v18GamepadDisconnected(e));

addEventListener("pagehide",()=>{for(const p of [...guestProfilesV16.values()])cleanupGuestProfile(p,"pagehide")});

/* Capture keyboard navigation for the Avatar page before the older handler. */
document.addEventListener("keydown",e=>{if(!S.avatarPickerOpen)return;const k=e.key;if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter","Escape","Backspace"].includes(k)){e.preventDefault();e.stopImmediatePropagation()}if(k==="ArrowLeft")moveAvatar(-1,0);else if(k==="ArrowRight")moveAvatar(1,0);else if(k==="ArrowUp")moveAvatar(0,-1);else if(k==="ArrowDown")moveAvatar(0,1);else if(k==="Enter"){if(avatarFocusArea==="categories"){avatarFocusArea="grid";renderAvatarPicker()}else chooseAvatar()}else if(k==="Escape"||k==="Backspace")closeAvatarPicker()},true);

/* When keyboard/device uses the selector, keep its account ownership explicit. */
document.addEventListener("keydown",e=>{if(S.userSelectOpen&&selectingControllerIndex!==null&&["ArrowLeft","ArrowRight","Enter"].includes(e.key)){/* keyboard may assist the controller selection, intentionally allowed */}},true);

addEventListener("pagehide",()=>{if(currentProfile?.guest)cleanupGuestSession("pagehide")});
render();renderUserSelector();
syncDorukStationBootLogo();
setTimeout(()=>$("#bootScreen").classList.add("out"),1450);
setTimeout(()=>{$("#bootScreen").style.display="none";$("#userSelect").classList.add("hidden");initialControllerLoginSequence()},2250);


/* ==========================================================================\n   DorukStation PS4 Web v0.19\n   Stable v0.15-style active-controller polling + multi-controller ownership.\n   ========================================================================== */
const V18_RECONNECT_MS=10000;
const v18ReconnectLeases=[];
const v18UserSessionApps=new Map();
const v18SystemFolderDefaults=new Map(apps.filter(a=>!a.userAdded).map(a=>[a.id,!!a.inFolder]));
let v18ShellSwitching=false,v18KeyboardControllerIndex=null;

/* ---------- per-user Home content ---------- */
function v18StashUserApps(profile=currentProfile){
 if(!profile)return;
 const own=[];
 for(const a of apps){if(a.userAdded){if(!a.ownerProfileId)a.ownerProfileId=profile.id;if(a.ownerProfileId===profile.id)own.push(a)}}
 if(own.length||v18UserSessionApps.has(profile.id))v18UserSessionApps.set(profile.id,own);
 apps=apps.filter(a=>!a.userAdded);
 ensureLibraryLast();
}
function v18RestoreUserApps(profile){
 apps=apps.filter(a=>!a.userAdded);
 const own=v18UserSessionApps.get(profile?.id)||[];
 const lib=Math.max(0,apps.findIndex(a=>a.id==="library"));
 if(own.length)apps.splice(lib,0,...own);
 ensureLibraryLast();
}
function v18FolderPrefs(){return safeJSON(pGet("home-folder-state","{}"),{})||{}}
function v18ApplyFolderPrefs(){
 const prefs=v18FolderPrefs();
 for(const a of apps){if(!a.userAdded)a.inFolder=Object.prototype.hasOwnProperty.call(prefs,a.id)?!!prefs[a.id]:!!v18SystemFolderDefaults.get(a.id);else if(Object.prototype.hasOwnProperty.call(prefs,a.id))a.inFolder=!!prefs[a.id]}
}
function v18SaveFolderPrefs(){if(!currentProfile)return;const o={};for(const a of apps)o[a.id]=!!a.inFolder;pSet("home-folder-state",JSON.stringify(o))}
window.v18SaveFolderPrefs=v18SaveFolderPrefs;
const v18BaseLoadProfileState=loadProfileState;
loadProfileState=function(profile){
 if(currentProfile&&currentProfile.id!==profile?.id){v18SaveFolderPrefs();v18StashUserApps(currentProfile)}
 v18BaseLoadProfileState(profile);
 v18RestoreUserApps(profile);v18ApplyFolderPrefs();
};

/* ---------- exact-one-controller-per-user ownership ---------- */
function v18ControllerFingerprint(gp){return `${String(gp?.id||"unknown").trim()}|${gp?.mapping||"raw"}|b${gp?.buttons?.length||0}|a${gp?.axes?.length||0}`}
function v18PrimeController(index){const gp=[...(navigator.getGamepads?.()||[])].find(g=>g&&g.index===index),r=gp?controllerRuntime(gp):controllerFrames.get(index);if(r&&gp){r.last=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45));r.axisLatch=false}}
function v18DropProfileFromOtherControllers(profileId,exceptIndex){
 for(const [idx,id] of [...controllerAssignments])if(id===profileId&&idx!==exceptIndex){const pp=profileById(profileId);controllerAssignments.delete(idx);controllerFrames.get(idx)&&(controllerFrames.get(idx).last=[]);if(pp)pushSystemNotification("logout",`${pp.name} moved to another controller`,`${controllerLabel(idx)} no longer controls this account.`,pp)}
 const mapped=profileAssignments.get(profileId);if(mapped!==undefined&&mapped!==exceptIndex)profileAssignments.delete(profileId);
}
const v18BaseRemoveAssignment=removeControllerAssignment;
removeControllerAssignment=function(index,reason="unassigned",notify=true){
 const p=v18BaseRemoveAssignment(index,reason,notify);if(activeControllerIndex===index)activeControllerIndex=null;return p;
};
transferProfileToController=function(profile,index){
 if(!profile||!Number.isInteger(index))return;
 v18DropProfileFromOtherControllers(profile.id,index);
 const oldId=controllerAssignments.get(index);
 if(oldId&&oldId!==profile.id){const old=profileById(oldId);controllerAssignments.delete(index);if(profileAssignments.get(oldId)===index)profileAssignments.delete(oldId);if(old)pushSystemNotification("logout",`${old.name} signed out`,`${controllerLabel(index)} switched users.`,old)}
 if(deviceProfileId===profile.id)deviceProfileId=null;
 controllerAssignments.set(index,profile.id);profileAssignments.set(profile.id,index);activeControllerIndex=index;v18PrimeController(index);
};

/* ---------- 10-second reconnect lease ---------- */
function v18PurgeExpiredLeases(){const now=performance.now();for(let i=v18ReconnectLeases.length-1;i>=0;i--)if(v18ReconnectLeases[i].expiresAt<=now||profileAssignments.has(v18ReconnectLeases[i].profileId))v18ReconnectLeases.splice(i,1)}
function v18RememberReconnect(gp,profile,wasActive){
 v18PurgeExpiredLeases();
 for(let i=v18ReconnectLeases.length-1;i>=0;i--)if(v18ReconnectLeases[i].profileId===profile.id||v18ReconnectLeases[i].oldIndex===gp.index)v18ReconnectLeases.splice(i,1);
 const lease={profileId:profile.id,fingerprint:v18ControllerFingerprint(gp),oldIndex:gp.index,expiresAt:performance.now()+V18_RECONNECT_MS,wasActive:!!wasActive};v18ReconnectLeases.push(lease);
 setTimeout(()=>{const i=v18ReconnectLeases.indexOf(lease);if(i>=0&&performance.now()>=lease.expiresAt){v18ReconnectLeases.splice(i,1)}},V18_RECONNECT_MS+120);
}
function v18ClaimReconnect(gp){
 v18PurgeExpiredLeases();const fp=v18ControllerFingerprint(gp),now=performance.now();
 let lease=v18ReconnectLeases.find(x=>x.expiresAt>now&&x.oldIndex===gp.index&&x.fingerprint===fp);
 if(!lease){const same=v18ReconnectLeases.filter(x=>x.expiresAt>now&&x.fingerprint===fp);if(same.length===1)lease=same[0]}
 if(!lease)return null;
 const p=profileById(lease.profileId);if(!p||p.guest||profileAssignments.has(p.id)){v18ReconnectLeases.splice(v18ReconnectLeases.indexOf(lease),1);return null}
 v18ReconnectLeases.splice(v18ReconnectLeases.indexOf(lease),1);transferProfileToController(p,gp.index);
 if(lease.wasActive&&currentProfile?.id===p.id)activeControllerIndex=gp.index;
 pushSystemNotification("login",`${p.name}'s controller reconnected`,`Reconnected within 10 seconds. ${controllerLabel(gp.index)} was restored automatically.`,p);updateSessionStatus(true);return p;
}
function v18GamepadConnected(e){
 const gp=e.gamepad;controllerRuntime(gp);v18PrimeController(gp.index);
 const restored=v18ClaimReconnect(gp);if(restored)return;
 pushSystemNotification("",`${controllerLabel(gp.index)} connected`,`Choose a user for this controller.`,currentProfile);
 if(!controllerAssignments.has(gp.index))beginControllerLogin(gp.index);
}
function v18GamepadDisconnected(e){
 const gp=e.gamepad,index=gp.index,id=controllerAssignments.get(index),p=profileById(id),wasActive=activeControllerIndex===index;
 controllerFrames.delete(index);
 if(!p){beginNextControllerLogin();return}
 if(p.guest){
   removeControllerAssignment(index,"disconnected",false);pushSystemNotification("disconnect","Controller disconnected",`${p.name}'s temporary Guest session has ended.`,p);
   const entry=getRunningEntry();if(entry?.profileId===p.id)closeRunningApp(entry.app.id);cleanupGuestProfile(p,"controller-disconnect");
   if(currentProfile?.id===p.id){currentProfile=null;S.username="User";activeControllerIndex=null;showUserSelector(null)}
   beginNextControllerLogin();return;
 }
 v18RememberReconnect(gp,p,wasActive);removeControllerAssignment(index,"disconnected",false);
 pushSystemNotification("disconnect","Controller disconnected",`${p.name}: reconnect the same controller within 10 seconds for automatic sign-in.`,p);
 updateSessionStatus(true);beginNextControllerLogin();
}
window.v18GamepadConnected=v18GamepadConnected;window.v18GamepadDisconnected=v18GamepadDisconnected;

/* ---------- switching which user's Home owns the shell ---------- */
function v18CloseShellOverlays(){
 if(S.quickMenuOpen){S.quickMenuOpen=false;hideUi("#quickMenuOverlay","back")}
 if(S.shareMenuOpen){S.shareMenuOpen=false;hideUi("#shareMenuOverlay","back")}
 if(S.pageOpen){S.pageOpen=false;S.pageStack=[];hideUi("#pageView","back")}
 if(!$("#rightMenu").classList.contains("hidden"))closeMenu(false);
}
function v18SwitchShellNow(profile,index,after){
 if(!profile)return;
 v18ShellSwitching=true;document.body.classList.add("shell-user-switch");v18CloseShellOverlays();
 setTimeout(()=>{
   activeControllerIndex=Number.isInteger(index)?index:null;if(Number.isInteger(index))v18PrimeController(index);loadProfileState(profile);applyTheme();
   S.zone="home";S.app=0;S.quick=0;S.pageIndex=0;render();updateSessionStatus(true);
   requestAnimationFrame(()=>requestAnimationFrame(()=>{document.body.classList.remove("shell-user-switch");setTimeout(()=>{v18ShellSwitching=false;after?.()},210)}));
 },170);
}
function v18TakeShell(index,after){
 const id=controllerAssignments.get(index),p=profileById(id);if(!p)return;
 if(currentProfile?.id===p.id){activeControllerIndex=index;v18PrimeController(index);updateSessionStatus(true);after?.();return}
 const go=()=>v18SwitchShellNow(p,index,after);
 if(S.appSurface){suspendToHome();setTimeout(go,410)}else go();
}
activateAssignedController=function(index){const id=controllerAssignments.get(index),p=profileById(id);if(!p)return;if(currentProfile?.id===id){activeControllerIndex=index;v18PrimeController(index);updateSessionStatus(true);return}v18TakeShell(index)};

/* Login flow keeps one user per controller and always returns Home focus to item 1. */
const v18BaseFinishUserLogin=finishUserLogin;
finishUserLogin=function(profile){
 const chosenIndex=selectingControllerIndex;
 v18BaseFinishUserLogin(profile);
 S.zone="home";S.app=0;S.quick=0;render();
 if(Number.isInteger(chosenIndex))v18PrimeController(chosenIndex);
};

/* ---------- v0.15-style PS tracking, independently for each controller ---------- */
function v18PsIndex(gp){
 if(!gp)return -1;if(gp.mapping==="standard"&&gp.buttons.length>16)return 16;
 const remembered=rememberedPsButton(gp);if(remembered>=0)return remembered;
 return gp.buttons.length>16?16:-1;
}
function v18ProcessPs(gp,r,now){
 const i=v18PsIndex(gp);if(i<0)return false;const down=gamepadButtonDown(gp,i);
 if(down){
   r.lastPsSeen=now;
   if(!r.psDown){r.psDown=true;r.psStart=now;r.psLong=false;r.psIndex=i}
   if(!r.psLong&&now-r.psStart>=PS_HOLD_MS){r.psLong=true;
     if(controllerAssignments.has(gp.index))v18TakeShell(gp.index,()=>openQuickMenu());else beginControllerLogin(gp.index);
   }
   return true;
 }
 if(r.psDown&&now-(r.lastPsSeen||0)>PS_RELEASE_DEBOUNCE_MS){
   const wasLong=r.psLong;r.psDown=false;r.psStart=0;r.psLong=false;r.psIndex=-1;
   if(!wasLong){
     if(controllerAssignments.has(gp.index)){
       const id=controllerAssignments.get(gp.index);
       if(currentProfile?.id===id){activeControllerIndex=gp.index;v18PrimeController(gp.index);psShortPress()}
       else v18TakeShell(gp.index);
     }else beginControllerLogin(gp.index);
   }
   return true;
 }
 return false;
}

/* ---------- controller-friendly digital keyboard ---------- */
const V18_KB={
 letters:[..."1234567890",...["Q","W","E","R","T","Y","U","I","O","P"],...["A","S","D","F","G","H","J","K","L"],...["Z","X","C","V","B","N","M"]],
 rowsLetters:[["1","2","3","4","5","6","7","8","9","0"],["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L"],["Z","X","C","V","B","N","M","⌫"],["?123","Space","Done","Cancel"]],
 rowsSymbols:[["1","2","3","4","5","6","7","8","9","0"],["!","@","#","$","%","^","&","*","(",")"],["-","_","=","+","[","]","{","}","/"],[".",",","?","!",":",";","'","⌫"],["ABC","Space","Done","Cancel"]]
};
let v18Kb={open:false,page:"letters",row:0,col:0,text:"",title:"Enter Text",maxLength:64,onDone:null,onCancel:null};
function v18KbRows(){return v18Kb.page==="symbols"?V18_KB.rowsSymbols:V18_KB.rowsLetters}
function v18RenderKeyboard(){
 if(!v18Kb.open)return;const rows=v18KbRows();v18Kb.row=Math.max(0,Math.min(v18Kb.row,rows.length-1));v18Kb.col=Math.max(0,Math.min(v18Kb.col,rows[v18Kb.row].length-1));
 $("#oskTitle").textContent=v18Kb.title;$("#oskPageLabel").textContent=v18Kb.page==="symbols"?"?123":"ABC";$("#oskValue").textContent=v18Kb.text||" ";
 $("#oskKeys").innerHTML=rows.map((row,ri)=>`<div class="osk-row">${row.map((k,ci)=>`<button class="osk-key ${ri===v18Kb.row&&ci===v18Kb.col?"focused":""} ${k==="Space"?"space":""} ${["Done","?123","ABC"].includes(k)?"action":""} ${k==="Cancel"?"danger":""} ${["Space","Done","Cancel","?123","ABC"].includes(k)?"wide":""}" data-r="${ri}" data-c="${ci}">${esc(k)}</button>`).join("")}</div>`).join("");
 $$(".osk-key").forEach(el=>el.onclick=()=>{v18Kb.row=Number(el.dataset.r);v18Kb.col=Number(el.dataset.c);v18KeyboardActivate()});
}
function openDigitalKeyboard({title="Enter Text",initial="",maxLength=64,onDone,onCancel,controllerIndex}={}){
 v18Kb={open:true,page:"letters",row:0,col:0,text:String(initial||"").slice(0,maxLength),title,maxLength,onDone:onDone||null,onCancel:onCancel||null};S.digitalKeyboardOpen=true;
 v18KeyboardControllerIndex=Number.isInteger(controllerIndex)?controllerIndex:(Number.isInteger(selectingControllerIndex)?selectingControllerIndex:activeControllerIndex);
 showUi("#digitalKeyboard","forward");v18RenderKeyboard();
}
function closeDigitalKeyboard(cancel=false){if(!v18Kb.open)return;const cb=cancel?v18Kb.onCancel:v18Kb.onDone,text=v18Kb.text;v18Kb.open=false;S.digitalKeyboardOpen=false;hideUi("#digitalKeyboard",cancel?"back":"forward");v18KeyboardControllerIndex=null;cb?.(text)}
function v18KeyboardMove(dx,dy){const rows=v18KbRows();if(dy){v18Kb.row=Math.max(0,Math.min(rows.length-1,v18Kb.row+dy));v18Kb.col=Math.min(v18Kb.col,rows[v18Kb.row].length-1)}if(dx){const n=rows[v18Kb.row].length;v18Kb.col=(v18Kb.col+dx+n)%n}v28PlayEvent("keyboardMove");v18RenderKeyboard()}
function v18KeyboardBackspace(){if(v18Kb.text){v18Kb.text=[...v18Kb.text].slice(0,-1).join("");backSound();v18RenderKeyboard()}}
function v18KeyboardAppend(ch){if([...v18Kb.text].length>=v18Kb.maxLength)return;v18Kb.text+=ch;selectSound();v18RenderKeyboard()}
function v18KeyboardTogglePage(){v18Kb.page=v18Kb.page==="letters"?"symbols":"letters";v18Kb.row=0;v18Kb.col=0;navSound();v18RenderKeyboard()}
function v18KeyboardActivate(){const k=v18KbRows()[v18Kb.row]?.[v18Kb.col];if(!k)return;if(k==="⌫")return v18KeyboardBackspace();if(k==="Space")return v18KeyboardAppend(" ");if(k==="Done")return closeDigitalKeyboard(false);if(k==="Cancel")return closeDigitalKeyboard(true);if(k==="?123"||k==="ABC")return v18KeyboardTogglePage();v18KeyboardAppend(k)}
window.openDigitalKeyboard=openDigitalKeyboard;

/* Create User and profile renaming use the console keyboard instead of autofocus/prompt. */
activateCreateUser=function(){
 if(S.createUserIndex===0){openDigitalKeyboard({title:"Create User — Name",initial:$("#createUserName").value,maxLength:24,controllerIndex:selectingControllerIndex,onDone:v=>{$("#createUserName").value=v.trim();S.createUserIndex=1;renderCreateUserFocus()}});return}
 confirmCreateUser();
};
$("#createNameRow").onclick=()=>{S.createUserIndex=0;renderCreateUserFocus();activateCreateUser()};
const v18BaseConfirmCreateUser=confirmCreateUser;
confirmCreateUser=function(){const input=$("#createUserName"),name=input.value.trim();if(!name){S.createUserIndex=0;renderCreateUserFocus();openDigitalKeyboard({title:"Create User — Name",initial:"",maxLength:24,controllerIndex:selectingControllerIndex,onDone:v=>{input.value=v.trim();S.createUserIndex=1;renderCreateUserFocus()}});return}v18BaseConfirmCreateUser()};
renameCurrentProfile=function(){if(!currentProfile||currentProfile.guest)return;openDigitalKeyboard({title:"Change Username",initial:currentProfile.name,maxLength:24,onDone:v=>{const name=v.trim();if(!name)return;currentProfile.name=name;S.username=name;saveProfiles();renderQuick();updateSessionStatus(true);if(S.pageOpen)openProfilePage()}})};
openProfilePage=function(){openPage({title:"Profile",subtitle:`${currentProfile?.guest?"Temporary guest":"Local DorukStation user"} · ${folderForProfile(currentProfile)}`,icon:avatarForProfile(currentProfile),returnZone:"top",items:[{title:"Profile Picture",note:"Change Avatar",image:avatarForProfile(currentProfile),action:()=>openAvatarPicker("profile")},{title:"Username",note:S.username,action:()=>renameCurrentProfile()},{title:"User Folder",note:folderForProfile(currentProfile),disabled:true},{title:"Input",note:activeControllerIndex===null?"This device":controllerLabel(activeControllerIndex),disabled:true},{title:"Switch User",note:"Choose another account without deleting the current user's saved data",action:()=>{backPage();showUserSelector(activeControllerIndex)}},{title:"Status",note:navigator.onLine?"Online":"Offline",disabled:true}]})};

/* Keyboard event capture for the on-screen keyboard. */
document.addEventListener("keydown",e=>{if(!v18Kb.open)return;e.preventDefault();e.stopImmediatePropagation();const k=e.key;if(k==="ArrowLeft")v18KeyboardMove(-1,0);else if(k==="ArrowRight")v18KeyboardMove(1,0);else if(k==="ArrowUp")v18KeyboardMove(0,-1);else if(k==="ArrowDown")v18KeyboardMove(0,1);else if(k==="Enter")v18KeyboardActivate();else if(k==="Escape")closeDigitalKeyboard(true);else if(k==="Backspace")v18KeyboardBackspace();else if(k==="Tab")v18KeyboardTogglePage();else if(k.length===1)v18KeyboardAppend(k)},true);

/* ---------- stable active-controller loop (v0.15 behavior) ---------- */
gamepadLoop=function(){
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean),now=performance.now();
 // PS/Home is always monitored for every controller, even while a game owns input.
 for(const gp of pads){const r=controllerRuntime(gp);v18ProcessPs(gp,r,now)}

 // User-selection and account creation are owned by the controller being assigned.
 const selecting=Number.isInteger(selectingControllerIndex)?pads.find(g=>g.index===selectingControllerIndex):null;
 if(S.digitalKeyboardOpen){
   const gp=Number.isInteger(v18KeyboardControllerIndex)?pads.find(g=>g.index===v18KeyboardControllerIndex):null;
   if(gp){const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i],x=gp.axes[0]||0,y=gp.axes[1]||0;if(edge(12))v18KeyboardMove(0,-1);if(edge(13))v18KeyboardMove(0,1);if(edge(14))v18KeyboardMove(-1,0);if(edge(15))v18KeyboardMove(1,0);if(edge(0))v18KeyboardActivate();if(edge(1))closeDigitalKeyboard(true);if(edge(2))v18KeyboardBackspace();if(edge(4)||edge(5))v18KeyboardTogglePage();if(!r.axisLatch&&(Math.abs(x)>.72||Math.abs(y)>.72)){r.axisLatch=true;if(Math.abs(x)>Math.abs(y))v18KeyboardMove(x>0?1:-1,0);else v18KeyboardMove(0,y>0?1:-1)}if(Math.abs(x)<.34&&Math.abs(y)<.34)r.axisLatch=false;r.last=b}
   updateSessionStatus();requestAnimationFrame(gamepadLoop);return;
 }
 if((S.userSelectOpen||S.createChoiceOpen||S.createUserOpen||S.avatarPickerOpen)&&selecting){
   const r=controllerRuntime(selecting),b=selecting.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i],x=selecting.axes[0]||0,y=selecting.axes[1]||0;
   if(S.userSelectOpen){if(edge(14))moveUserSelection(-1);if(edge(15))moveUserSelection(1);if(edge(0))activateUserSelection();if(!r.axisLatch&&Math.abs(x)>.72){r.axisLatch=true;moveUserSelection(x>0?1:-1)}if(Math.abs(x)<.34)r.axisLatch=false}
   else if(S.createChoiceOpen){if(edge(12))moveCreateChoice(-1);if(edge(13))moveCreateChoice(1);if(edge(0))activateCreateChoice();if(edge(1))closeCreateChoice();if(!r.axisLatch&&Math.abs(y)>.72){r.axisLatch=true;moveCreateChoice(y>0?1:-1)}if(Math.abs(y)<.34)r.axisLatch=false}
   else if(S.createUserOpen){if(edge(12))moveCreateUser(-1);if(edge(13))moveCreateUser(1);if(edge(0))activateCreateUser();if(edge(1))closeCreateUser()}
   else if(S.avatarPickerOpen){if(edge(12))moveAvatar(0,-1);if(edge(13))moveAvatar(0,1);if(edge(14))moveAvatar(-1,0);if(edge(15))moveAvatar(1,0);if(edge(0)){if(avatarFocusArea==="categories"){avatarFocusArea="grid";renderAvatarPicker()}else chooseAvatar()}if(edge(1))closeAvatarPicker()}
   r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return;
 }
 // Keyboard/device user-selection still works through the normal keyboard handler.
 if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen||S.avatarPickerOpen){updateSessionStatus();requestAnimationFrame(gamepadLoop);return}

 // Unassigned controllers can join without interfering with the active user's controls.
 for(const gp of pads){if(controllerAssignments.has(gp.index))continue;const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];if(edge(0)||edge(9))beginControllerLogin(gp.index);r.last=b}

 const gp=Number.isInteger(activeControllerIndex)?pads.find(g=>g.index===activeControllerIndex):null;
 if(!gp){updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i],x=gp.axes[0]||0,y=gp.axes[1]||0;
 if(firstEntryFullscreenArmed&&b.some((v,i)=>v&&!r.last[i]))requestEntryFullscreen();
 if(edge(8)&&!S.quickMenuOpen&&!S.userSelectOpen){openShareMenu();r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(S.quickMenuOpen){if(edge(12))moveQuickMenu(0,-1);if(edge(13))moveQuickMenu(0,1);if(edge(14))moveQuickMenu(-1,0);if(edge(15))moveQuickMenu(1,0);if(edge(0))activateQuickMenu();if(edge(1))backQuickMenu();if(!r.axisLatch&&(Math.abs(x)>.72||Math.abs(y)>.72)){r.axisLatch=true;if(Math.abs(x)>Math.abs(y))moveQuickMenu(x>0?1:-1,0);else moveQuickMenu(0,y>0?1:-1)}if(Math.abs(x)<.34&&Math.abs(y)<.34)r.axisLatch=false;r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(S.shareMenuOpen){if(edge(12))moveShareMenu(-1);if(edge(13))moveShareMenu(1);if(edge(0))activateShareMenu();if(edge(1))closeShareMenu();if(!r.axisLatch&&Math.abs(y)>.72){r.axisLatch=true;moveShareMenu(y>0?1:-1)}if(Math.abs(y)<.34)r.axisLatch=false;r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(S.appSurface){r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(v18ShellSwitching){r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(edge(12))move(0,-1);if(edge(13))move(0,1);if(edge(14))move(-1,0);if(edge(15))move(1,0);if(edge(0))activate();if(edge(1))back();if(edge(9))options();
 if(!r.axisLatch&&(Math.abs(x)>.72||Math.abs(y)>.72)){r.axisLatch=true;if(Math.abs(x)>Math.abs(y))move(x>0?1:-1,0);else move(0,y>0?1:-1)}if(Math.abs(x)<.34&&Math.abs(y)<.34)r.axisLatch=false;
 r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);
};

/* Existing controllers at startup are queued one-by-one. Each selection is exclusive. */
initialControllerLoginSequence=function(){
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean).sort((a,b)=>a.index-b.index);pendingControllerLogins.splice(0);
 if(pads.length){S.userSelectOpen=false;hideUi("#userSelect","back");for(const gp of pads){controllerRuntime(gp);v18PrimeController(gp.index);pendingControllerLogins.push(gp.index)}beginNextControllerLogin()}
 else{selectingControllerIndex=null;S.userSelectOpen=true;showUi("#userSelect","back");renderUserSelector()}
};

/* Debug text now exposes ownership + reconnect state. */
updateDebug=function(gp){if($("#debug").classList.contains("hidden"))return;const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean);$("#debug").textContent=`v0.19 user=${currentProfile?.name||"SELECT"} folder=${currentProfile?folderForProfile(currentProfile):"-"}\nactiveController=${activeControllerIndex} assignments=${JSON.stringify([...controllerAssignments])}\nconnected=${pads.map(p=>`${p.index}:${p.id}`).join(" | ")||"none"}\nreconnectLeases=${v18ReconnectLeases.map(x=>`${x.profileId}@${x.oldIndex}:${Math.max(0,Math.ceil((x.expiresAt-performance.now())/1000))}s`).join(" | ")||"none"}\nzone=${S.zone} app=${S.app} ${apps[S.app]?.name||"-"}\nappSurface=${S.appSurface} quickMenu=${S.quickMenuOpen} share=${S.shareMenuOpen} keyboard=${v18Kb.open}\ntheme=${JSON.stringify(S.theme)}`};

/* If a user is already active when v0.19 loads, apply that user's Home separation. */
if(currentProfile){v18RestoreUserApps(currentProfile);v18ApplyFolderPrefs();render()}


/* ==========================================================================\n   DorukStation PS4 Web v0.19\n   Controller-first login + popup OSK + held navigation.\n   ========================================================================== */
let v19Ready=false,v19DebugWithoutController=false,v19KeyboardTarget=null,v19KeyboardOriginal="",v19KeyboardOpeningAt=0;
const V19_REPEAT_DELAY=330,V19_REPEAT_RATE=88;

/* ---------- controller-first startup; no persistent device-user assignment ---------- */
assignmentForProfile=function(id){return profileAssignments.has(id)?{type:"controller",index:profileAssignments.get(id)}:null};
controllerLabel=function(index){return Number.isInteger(index)?`Controller ${index+1}`:"Keyboard / Mouse"};
updateUserSelectHeading=function(){const t=$("#userSelectTitle"),s=$("#userSelectSubtitle");if(!t||!s)return;t.textContent="Pick User";s.textContent=Number.isInteger(selectingControllerIndex)?"Choose who is using this controller. An account can only belong to one controller at a time.":"Choose a user for keyboard and mouse debugging."};

renderUserSelector=function(){
 const box=$("#userCards");if(!box)return;updateUserSelectHeading();const items=[...profiles,{id:"__add__",name:"Create User",add:true}];S.userIndex=Math.max(0,Math.min(S.userIndex,items.length-1));
 box.innerHTML=items.map((p,i)=>{if(p.add)return `<button class="user-card ${i===S.userIndex?"focused":""}" data-i="${i}"><div class="user-plus" aria-hidden="true">+</div><span>${esc(p.name)}</span><small>New user or temporary guest</small></button>`;const a=assignmentForProfile(p.id),same=a?.index===selectingControllerIndex;let status=`<small>${esc(p.folder||folderForProfile(p))}</small>`;if(a)status=`<small class="user-selected-status"><img src="${V16_CONTROLLER_ICON}" alt="">${same?"Selected on this controller":`${controllerLabel(a.index)} · Already Selected`}</small>`;return `<button class="user-card ${i===S.userIndex?"focused":""}" data-i="${i}"><img class="profile-avatar" src="${avatarForProfile(p)}" alt="${esc(p.name)}"><span>${esc(p.name)}</span>${status}</button>`}).join("");
 $$(".user-card").forEach(el=>el.onclick=()=>{S.userIndex=Number(el.dataset.i);activateUserSelection()});
};

function v19ShowControllerGate(){selectingControllerIndex=null;S.userSelectOpen=false;hideUi("#userSelect","back");hideUi("#createUserChoice","back");hideUi("#createUserView","back");showUi("#controllerGate","back");setUserFlowVisual(true)}
function v19HideControllerGate(){hideUi("#controllerGate","forward")}
$("#playWithoutController").onclick=()=>{v19DebugWithoutController=true;v19HideControllerGate();requestEntryFullscreen?.();showUserSelector(null)};

showUserSelector=function(controllerIndex=activeControllerIndex){
 const switchingIndex=Number.isInteger(controllerIndex)?controllerIndex:null;
 if(currentProfile?.guest&&((switchingIndex!==null&&profileAssignments.get(currentProfile.id)===switchingIndex)||(switchingIndex===null&&v19DebugWithoutController))){const entry=getRunningEntry();if(entry?.profileId===currentProfile.id)closeRunningApp(entry.app.id);if(switchingIndex!==null)removeControllerAssignment(switchingIndex,"switched users",true);pushSystemNotification("logout",`${currentProfile.name} session ended`,"Guest data has been deleted.",currentProfile);cleanupGuestProfile(currentProfile,"switch-user");currentProfile=null;S.username="User"}
 if(S.appSurface){pendingResumeAfterLogin=S.currentRunningId;suspendToHome()}
 selectingControllerIndex=switchingIndex;S.userSelectOpen=true;S.createChoiceOpen=false;S.createUserOpen=false;S.avatarPickerOpen=false;hideUi("#controllerGate","back");hideUi("#createUserChoice","back");hideUi("#createUserView","back");hideUi("#avatarPicker","back");const preferred=currentProfile?.id||localStorage.getItem(PROFILE_LAST_KEY),i=profiles.findIndex(p=>p.id===preferred);S.userIndex=i>=0?i:0;setUserFlowVisual(true);showUi("#userSelect","back");renderUserSelector();
};

finishUserLogin=function(profile){
 const chosenIndex=selectingControllerIndex,sameCurrent=currentProfile?.id===profile.id;
 if(Number.isInteger(chosenIndex))transferProfileToController(profile,chosenIndex);else{const old=profileAssignments.get(profile.id);if(Number.isInteger(old))removeControllerAssignment(old,"was transferred to keyboard/mouse debugging",true);activeControllerIndex=null;deviceProfileId=null}
 if(!sameCurrent){loadProfileState(profile);applyTheme()}else S.username=profile.name;S.zone="home";S.app=0;S.quick=0;render();
 S.userSelectOpen=false;S.createChoiceOpen=false;S.createUserOpen=false;hideUi("#userSelect","forward");hideUi("#createUserChoice","forward");hideUi("#createUserView","forward");setTimeout(()=>setUserFlowVisual(false),UI_EXIT_MS);pushSystemNotification("login",`${profile.name} logged in`,Number.isInteger(chosenIndex)?`${controllerLabel(chosenIndex)} assigned.`:"Keyboard / mouse debugging mode.",profile);updateSessionStatus(true);applyPreferredAudioSink();if(Number.isInteger(chosenIndex))v18PrimeController(chosenIndex);const resume=pendingResumeAfterLogin;pendingResumeAfterLogin=null;const entry=getRunningEntry();if(resume&&entry?.app.id===resume&&entry.profileId===profile.id)setTimeout(()=>resumeApp(resume),360);setTimeout(beginNextControllerLogin,380);
};

initialControllerLoginSequence=function(){
 v19Ready=true;const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean).sort((a,b)=>a.index-b.index);pendingControllerLogins.splice(0);hideUi("#userSelect","back");
 if(pads.length){v19HideControllerGate();for(const gp of pads){controllerRuntime(gp);v18PrimeController(gp.index);pendingControllerLogins.push(gp.index)}beginNextControllerLogin()}else v19ShowControllerGate();
};

v18GamepadConnected=function(e){const gp=e.gamepad;controllerRuntime(gp);v18PrimeController(gp.index);if(!v19Ready)return;const restored=v18ClaimReconnect(gp);if(restored){v19HideControllerGate();return}v19HideControllerGate();pushSystemNotification("",`${controllerLabel(gp.index)} connected`,"Pick a user for this controller.",currentProfile);if(!controllerAssignments.has(gp.index))beginControllerLogin(gp.index)};

/* ---------- guest avatar is the default until the person explicitly picks one ---------- */
avatarForProfile=function(p){return p?.avatar||GUEST_AVATAR};
if(!localStorage.getItem("ds-v19-default-avatar-migration")){for(const p of profiles){if(!p.avatar||p.avatar===V16_DEFAULT_AVATAR)p.avatar=GUEST_AVATAR}saveProfiles();localStorage.setItem("ds-v19-default-avatar-migration","1")}
pendingCreateAvatar=GUEST_AVATAR;
openCreateUser=function(){S.createChoiceOpen=false;S.createUserOpen=true;S.createUserIndex=0;pendingCreateAvatar=GUEST_AVATAR;swapUi("#createUserChoice","#createUserView","forward");$("#createUserName").value="";$(".create-user-avatar").src=GUEST_AVATAR;renderCreateUserFocus()};
confirmCreateUser=function(){const input=$("#createUserName"),name=input.value.trim();if(!name){S.createUserIndex=1;renderCreateUserFocus();input.focus();v19OpenForEditable(input,"Create User — Name");return}const id=`user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,p={id,name:name.slice(0,24),createdAt:Date.now(),folder:`users/${id}/`,foldered:true,avatar:pendingCreateAvatar||GUEST_AVATAR,avatarChosen:pendingCreateAvatar!==GUEST_AVATAR};profiles.push(p);saveProfiles();finishUserLogin(p);selectSound()};
chooseAvatar=function(){const a=visibleAvatars()[avatarGridIndex];if(!a)return;if(avatarPickerTarget==="create"){pendingCreateAvatar=a.src;$(".create-user-avatar").src=a.src}else if(currentProfile){currentProfile.avatar=a.src;currentProfile.avatarChosen=true;if(!currentProfile.guest)saveProfiles();renderQuick();updateSessionStatus(true)}selectSound();closeAvatarPicker()};

/* Create-user controller focus: Avatar -> Name -> Confirm. */
renderCreateUserFocus=function(){$("#changeAvatarButton").classList.toggle("focused",S.createUserIndex===0);$("#createNameRow").classList.toggle("focused",S.createUserIndex===1);$("#createUserConfirm").classList.toggle("focused",S.createUserIndex===2)};
moveCreateUser=function(d){S.createUserIndex=Math.max(0,Math.min(2,S.createUserIndex+d));navSound();renderCreateUserFocus()};
activateCreateUser=function(){if(S.createUserIndex===0){openAvatarPicker("create");return}if(S.createUserIndex===1){const input=$("#createUserName");input.focus();v19OpenForEditable(input,"Create User — Name");return}confirmCreateUser()};
$("#changeAvatarButton").onclick=()=>{S.createUserIndex=0;renderCreateUserFocus();openAvatarPicker("create")};
$("#createNameRow").onclick=()=>{S.createUserIndex=1;renderCreateUserFocus();$("#createUserName").focus()};
$("#createUserConfirm").onclick=()=>{S.createUserIndex=2;renderCreateUserFocus();confirmCreateUser()};

/* ---------- popup digital keyboard bound to actual editable fields ---------- */
function v19IsEditable(el){if(!el||el.disabled||el.readOnly)return false;if(el.isContentEditable)return true;const tag=(el.tagName||"").toLowerCase();if(tag==="textarea")return true;if(tag!=="input")return false;return !["button","submit","reset","checkbox","radio","range","file","color","date","time","hidden","image"].includes((el.type||"text").toLowerCase())}
function v19TargetValue(el){return el?.isContentEditable?el.textContent:String(el?.value??"")}
function v19SetTargetValue(el,value){if(!el)return;if(el.isContentEditable)el.textContent=value;else el.value=value;try{el.dispatchEvent(new Event("input",{bubbles:true}))}catch{}}
function v19CommitTarget(el){try{el?.dispatchEvent(new Event("change",{bubbles:true}))}catch{}}
function v19OpenForEditable(el,title){if(!v19IsEditable(el))return;v19KeyboardTarget=el;v19KeyboardOriginal=v19TargetValue(el);v19KeyboardOpeningAt=performance.now();openDigitalKeyboard({title:title||el.getAttribute?.("aria-label")||el.placeholder||"Enter Text",initial:v19KeyboardOriginal,maxLength:Number(el.maxLength)>0?Number(el.maxLength):512,controllerIndex:Number.isInteger(activeControllerIndex)?activeControllerIndex:selectingControllerIndex,target:el})}

const V19_KB_LETTERS=[["1","2","3","4","5","6","7","8","9","0"],["q","w","e","r","t","y","u","i","o","p"],["a","s","d","f","g","h","j","k","l"],["z","x","c","v","b","n","m","⌫"],["Space"]];
const V19_KB_SYMBOLS=[["1","2","3","4","5","6","7","8","9","0"],["!","@","#","$","%","^","&","*","(",")"],["-","_","=","+","[","]","{","}","/"],[".",",","?","!",":",";","'","\"","⌫"],["Space"]];
v18Kb.capsLock=false;v18Kb.shiftOnce=false;v18Kb.lastL2Tap=0;v18Kb.target=null;
v18KbRows=function(){return v18Kb.page==="symbols"?V19_KB_SYMBOLS:V19_KB_LETTERS};
function v19DisplayKey(k){if(k.length===1&&/[a-z]/i.test(k)&&v18Kb.page==="letters")return (v18Kb.capsLock||v18Kb.shiftOnce)?k.toUpperCase():k.toLowerCase();return k}
v18RenderKeyboard=function(){if(!v18Kb.open)return;const rows=v18KbRows();v18Kb.row=Math.max(0,Math.min(v18Kb.row,rows.length-1));v18Kb.col=Math.max(0,Math.min(v18Kb.col,rows[v18Kb.row].length-1));$("#oskTitle").textContent=v18Kb.title;$("#oskPageLabel").textContent=v18Kb.page==="symbols"?"SYMBOLS":(v18Kb.capsLock?"CAPS":v18Kb.shiftOnce?"SHIFT":"abc");$("#oskValue").textContent=v18Kb.text||" ";$("#oskKeys").innerHTML=rows.map((row,ri)=>`<div class="osk-row">${row.map((k,ci)=>`<button tabindex="-1" class="osk-key ${ri===v18Kb.row&&ci===v18Kb.col?"focused":""} ${k==="Space"?"space wide":""}" data-r="${ri}" data-c="${ci}">${esc(v19DisplayKey(k))}</button>`).join("")}</div>`).join("");$$(".osk-key").forEach(el=>el.onpointerdown=e=>e.preventDefault());$$(".osk-key").forEach(el=>el.onclick=()=>{v18Kb.row=Number(el.dataset.r);v18Kb.col=Number(el.dataset.c);v18KeyboardActivate()})};
openDigitalKeyboard=function({title="Enter Text",initial="",maxLength=512,onDone,onCancel,controllerIndex,target=null}={}){v18Kb={...v18Kb,open:true,page:"letters",row:0,col:0,text:String(initial||"").slice(0,maxLength),title,maxLength,onDone:onDone||null,onCancel:onCancel||null,capsLock:false,shiftOnce:false,lastL2Tap:0,target};S.digitalKeyboardOpen=true;v18KeyboardControllerIndex=Number.isInteger(controllerIndex)?controllerIndex:(Number.isInteger(selectingControllerIndex)?selectingControllerIndex:activeControllerIndex);v28PlayEvent("keyboardOpen");showUi("#digitalKeyboard","forward");blockRunningGameForOverlay(true);v18RenderKeyboard()};
closeDigitalKeyboard=function(cancel=false){if(!v18Kb.open)return;const cb=cancel?v18Kb.onCancel:v18Kb.onDone,text=v18Kb.text,target=v18Kb.target||v19KeyboardTarget;if(cancel&&target)v19SetTargetValue(target,v19KeyboardOriginal);else if(target){v19SetTargetValue(target,text);v19CommitTarget(target)}v18Kb.open=false;S.digitalKeyboardOpen=false;v28PlayEvent(cancel?"cancel":"keyboardClose");hideUi("#digitalKeyboard",cancel?"back":"forward");v18KeyboardControllerIndex=null;blockRunningGameForOverlay(false);if(!cancel)cb?.(text);else cb?.(v19KeyboardOriginal);try{target?.blur?.()}catch{}v19KeyboardTarget=null};
v18KeyboardBackspace=function(){if(v18Kb.text){v18Kb.text=[...v18Kb.text].slice(0,-1).join("");if(v18Kb.target)v19SetTargetValue(v18Kb.target,v18Kb.text);keyboardBackspaceSound();v18RenderKeyboard()}};
v18KeyboardAppend=function(ch){if([...v18Kb.text].length>=v18Kb.maxLength)return;let out=ch;if(ch.length===1&&/[a-z]/i.test(ch)&&v18Kb.page==="letters")out=(v18Kb.capsLock||v18Kb.shiftOnce)?ch.toUpperCase():ch.toLowerCase();v18Kb.text+=out;if(v18Kb.shiftOnce&&!v18Kb.capsLock)v18Kb.shiftOnce=false;if(v18Kb.target)v19SetTargetValue(v18Kb.target,v18Kb.text);keyboardKeySound();v18RenderKeyboard()};
v18KeyboardTogglePage=function(){v18Kb.page=v18Kb.page==="letters"?"symbols":"letters";v18Kb.row=0;v18Kb.col=0;v28PlayEvent("changePanel");v18RenderKeyboard()};
v18KeyboardActivate=function(){const k=v18KbRows()[v18Kb.row]?.[v18Kb.col];if(!k)return;if(k==="⌫")return v18KeyboardBackspace();if(k==="Space")return v18KeyboardAppend(" ");v18KeyboardAppend(k)};
function v19KeyboardEnter(){const t=v18Kb.target||v19KeyboardTarget,multi=!!(t&&(t.tagName?.toLowerCase()==="textarea"||t.isContentEditable));if(multi){v18KeyboardAppend("\n");return}closeDigitalKeyboard(false);setTimeout(()=>{try{t?.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:true}));t?.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter",code:"Enter",bubbles:true}))}catch{}},0)}
function v19KeyboardL2(){const now=performance.now();if(v18Kb.capsLock){v18Kb.capsLock=false;v18Kb.shiftOnce=false;v18Kb.lastL2Tap=0;v18RenderKeyboard();return}if(now-(v18Kb.lastL2Tap||0)<360){v18Kb.capsLock=true;v18Kb.shiftOnce=false;v18Kb.lastL2Tap=0}else{v18Kb.shiftOnce=true;v18Kb.lastL2Tap=now}v18RenderKeyboard()}

function v19BindEditableDocument(doc,titlePrefix=""){if(!doc||doc.__dorukstationV19Keyboard)return;doc.__dorukstationV19Keyboard=true;doc.addEventListener("click",ev=>{const el=ev.target?.closest?.("input,textarea,[contenteditable='true'],[contenteditable='']");if(el&&v19IsEditable(el)){if(!v18Kb.open||v19KeyboardTarget!==el)setTimeout(()=>v19OpenForEditable(el,titlePrefix||el.placeholder||"Enter Text"),0)}else if(v18Kb.open&&performance.now()-v19KeyboardOpeningAt>220)closeDigitalKeyboard(false)},true)}
v19BindEditableDocument(document);
function v19BindIframe(iframe){const hook=()=>{try{v19BindEditableDocument(iframe.contentDocument,iframe.title?`${iframe.title} — Text`:"Enter Text")}catch{}};iframe.addEventListener("load",hook);hook()}
new MutationObserver(muts=>{for(const m of muts)for(const n of m.addedNodes)if(n?.tagName==="IFRAME")v19BindIframe(n)}).observe($("#appSurface"),{childList:true});$$("#appSurface iframe").forEach(v19BindIframe);

/* Profile rename uses the same popup keyboard. */
renameCurrentProfile=function(){if(!currentProfile||currentProfile.guest)return;openDigitalKeyboard({title:"Change Username",initial:currentProfile.name,maxLength:24,controllerIndex:activeControllerIndex,onDone:v=>{const name=v.trim();if(!name)return;currentProfile.name=name;S.username=name;saveProfiles();renderQuick();updateSessionStatus(true);if(S.pageOpen)openProfilePage()}})};

/* ---------- held D-pad/stick repeat ---------- */
function v19Direction(gp){if(gamepadButtonDown(gp,14))return "L";if(gamepadButtonDown(gp,15))return "R";if(gamepadButtonDown(gp,12))return "U";if(gamepadButtonDown(gp,13))return "D";const x=gp.axes[0]||0,y=gp.axes[1]||0;if(Math.abs(x)>.62||Math.abs(y)>.62)return Math.abs(x)>Math.abs(y)?(x>0?"R":"L"):(y>0?"D":"U");return ""}
function v19Repeat(r,dir,now,fire){if(!dir){r.v19RepeatDir="";r.v19RepeatNext=0;return}if(r.v19RepeatDir!==dir){r.v19RepeatDir=dir;r.v19RepeatNext=now+V19_REPEAT_DELAY;fire(dir);return}if(now>=(r.v19RepeatNext||0)){r.v19RepeatNext=now+V19_REPEAT_RATE;fire(dir)}}
function v19MoveFromDir(dir,fn){if(dir==="L")fn(-1,0);else if(dir==="R")fn(1,0);else if(dir==="U")fn(0,-1);else if(dir==="D")fn(0,1)}
function v19JumpHomeEnd(right){if(S.zone!=="home"||!apps.length)return;S.app=right?apps.length-1:0;navSound();render()}

/* Stable v0.15-style shell controller loop, with v0.19 ownership and repeats. */
gamepadLoop=function(){
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean),now=performance.now();for(const gp of pads){const r=controllerRuntime(gp);v18ProcessPs(gp,r,now)}
 const selectedIndex=Number.isInteger(selectingControllerIndex)?selectingControllerIndex:activeControllerIndex;
 if(S.digitalKeyboardOpen){const gp=Number.isInteger(v18KeyboardControllerIndex)?pads.find(g=>g.index===v18KeyboardControllerIndex):null;if(gp){const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,v18KeyboardMove));if(edge(0))v18KeyboardActivate();if(edge(1))closeDigitalKeyboard(false);if(edge(2))v18KeyboardBackspace();if(edge(3))v18KeyboardTogglePage();if(edge(6))v19KeyboardL2();if(edge(7))v19KeyboardEnter();r.last=b}updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 const flowGp=Number.isInteger(selectedIndex)?pads.find(g=>g.index===selectedIndex):null;
 if((S.userSelectOpen||S.createChoiceOpen||S.createUserOpen||S.avatarPickerOpen)&&flowGp){const r=controllerRuntime(flowGp),b=flowGp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];const dir=v19Direction(flowGp);if(S.userSelectOpen)v19Repeat(r,dir,now,d=>{if(d==="L")moveUserSelection(-1);else if(d==="R")moveUserSelection(1)});else if(S.createChoiceOpen)v19Repeat(r,dir,now,d=>{if(d==="U")moveCreateChoice(-1);else if(d==="D")moveCreateChoice(1)});else if(S.createUserOpen)v19Repeat(r,dir,now,d=>{if(d==="U")moveCreateUser(-1);else if(d==="D")moveCreateUser(1)});else if(S.avatarPickerOpen)v19Repeat(r,dir,now,d=>v19MoveFromDir(d,moveAvatar));if(edge(0)){if(S.userSelectOpen)activateUserSelection();else if(S.createChoiceOpen)activateCreateChoice();else if(S.createUserOpen)activateCreateUser();else if(S.avatarPickerOpen){if(avatarFocusArea==="categories"){avatarFocusArea="grid";renderAvatarPicker()}else chooseAvatar()}}if(edge(1)){if(S.createChoiceOpen)closeCreateChoice();else if(S.createUserOpen)closeCreateUser();else if(S.avatarPickerOpen)closeAvatarPicker()}r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen||S.avatarPickerOpen){updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 for(const gp of pads){if(controllerAssignments.has(gp.index))continue;const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];if(edge(0)||edge(9))beginControllerLogin(gp.index);r.last=b}
 const gp=Number.isInteger(activeControllerIndex)?pads.find(g=>g.index===activeControllerIndex):null;if(!gp){updateSessionStatus();requestAnimationFrame(gamepadLoop);return}const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];if(firstEntryFullscreenArmed&&b.some((v,i)=>v&&!r.last[i]))requestEntryFullscreen();if(edge(8)&&!S.quickMenuOpen&&!S.userSelectOpen){openShareMenu();r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(S.quickMenuOpen){v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,moveQuickMenu));if(edge(0))activateQuickMenu();if(edge(1))backQuickMenu();r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(S.shareMenuOpen){v19Repeat(r,v19Direction(gp),now,d=>{if(d==="U")moveShareMenu(-1);else if(d==="D")moveShareMenu(1)});if(edge(0))activateShareMenu();if(edge(1))closeShareMenu();r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(S.appSurface||v18ShellSwitching){r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop);return}
 if(S.zone==="home"&&edge(4))v19JumpHomeEnd(false);if(S.zone==="home"&&edge(5))v19JumpHomeEnd(true);v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,move));if(edge(0))activate();if(edge(1))back();if(edge(9))options();r.last=b;updateSessionStatus();requestAnimationFrame(gamepadLoop)
};

/* Keep the connect gate current if all controllers disappear before sign-in. */
const v19BaseDisconnect=v18GamepadDisconnected;
v18GamepadDisconnected=function(e){v19BaseDisconnect(e);setTimeout(()=>{if(v19Ready&&![...(navigator.getGamepads?.()||[])].filter(Boolean).length&&!currentProfile&&!v19DebugWithoutController)v19ShowControllerGate()},40)};

updateDebug=function(){if($("#debug").classList.contains("hidden"))return;const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean);$("#debug").textContent=`v0.19 user=${currentProfile?.name||"NONE"} folder=${currentProfile?folderForProfile(currentProfile):"-"}\nactiveController=${activeControllerIndex} assignments=${JSON.stringify([...controllerAssignments])}\nconnected=${pads.map(p=>`${p.index}:${p.id}`).join(" | ")||"none"}\nloginMode=${v19DebugWithoutController?"keyboard/mouse debug":"controller-first"}\nreconnectLeases=${v18ReconnectLeases.map(x=>`${x.profileId}@${x.oldIndex}:${Math.max(0,Math.ceil((x.expiresAt-performance.now())/1000))}s`).join(" | ")||"none"}\nzone=${S.zone} app=${S.app} ${apps[S.app]?.name||"-"} keyboard=${v18Kb.open}`};


/* ==========================================================================
   DorukStation PS4 Web v0.21
   Controller-first gate polish + avatar-controller focus fixes.
   Bundled game is indexed from games/DorukCraft.html; v0.25 ships the user-uploaded DorukCraft Mobile v0.17.5 mesh-focus-fix build.
   ========================================================================== */

/* Once login completes, the controller-selection flow no longer owns input.
   This prevents a stale selectingControllerIndex from stealing Profile/Avatar input. */
const v20FinishUserLoginBase=finishUserLogin;
finishUserLogin=function(profile){
  const loginController=Number.isInteger(selectingControllerIndex)?selectingControllerIndex:null;
  v20FinishUserLoginBase(profile);
  if(selectingControllerIndex===loginController) selectingControllerIndex=null;
};

/* Avatar picker starts on the avatar grid itself (not a hidden/non-obvious category focus).
   Prime controller state on entry/exit so the X/Circle used to open/close the picker is
   consumed here and cannot activate/back out of the screen underneath. */
function v20AvatarControllerIndex(){
  return Number.isInteger(selectingControllerIndex)?selectingControllerIndex:
         (Number.isInteger(activeControllerIndex)?activeControllerIndex:null);
}
function v20FindSelectedAvatarIndex(){
  const avs=visibleAvatars();
  const selected=avatarPickerTarget==="create"?pendingCreateAvatar:avatarForProfile(currentProfile);
  const i=avs.findIndex(a=>a.src===selected);
  return i>=0?i:0;
}
openAvatarPicker=function(target="profile"){
  avatarPickerTarget=target;
  avatarCategoryIndex=0;
  avatarFocusArea="grid";
  avatarGridIndex=0;
  avatarGridIndex=v20FindSelectedAvatarIndex();
  S.avatarPickerOpen=true;
  if(target==="create") hideUi("#createUserView","forward");
  else if(S.pageOpen) hideUi("#pageView","forward");
  showUi("#avatarPicker","forward");
  renderAvatarPicker();
  const idx=v20AvatarControllerIndex();
  if(Number.isInteger(idx)) v18PrimeController(idx);
};
closeAvatarPicker=function(){
  if(!S.avatarPickerOpen)return;
  const idx=v20AvatarControllerIndex();
  S.avatarPickerOpen=false;
  hideUi("#avatarPicker","back");
  if(avatarPickerTarget==="create") showUi("#createUserView","back");
  else if(S.pageOpen) showUi("#pageView","back");
  if(Number.isInteger(idx)) v18PrimeController(idx);
  backSound();
};

/* If Chrome exposes an already-connected controller late (common until the first button
   press), skip the "play without one" gate automatically and go straight to Pick User. */
let v20GateClaiming=false;
function v20ControllerGateWatch(){
  if(v19Ready && !v19DebugWithoutController && !S.userSelectOpen && !S.createChoiceOpen && !S.createUserOpen && !S.avatarPickerOpen){
    const gate=document.querySelector("#controllerGate");
    const gateVisible=gate && !gate.classList.contains("hidden");
    if(gateVisible && !v20GateClaiming){
      const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean).sort((a,b)=>a.index-b.index);
      const gp=pads.find(p=>!controllerAssignments.has(p.index));
      if(gp){
        v20GateClaiming=true;
        controllerRuntime(gp);v18PrimeController(gp.index);
        v19HideControllerGate();
        beginControllerLogin(gp.index);
        setTimeout(()=>{v20GateClaiming=false},180);
      }
    }
  }
  requestAnimationFrame(v20ControllerGateWatch);
}
requestAnimationFrame(v20ControllerGateWatch);

/* Keep debug version accurate. */
const v20UpdateDebugBase=updateDebug;
updateDebug=function(){
  v20UpdateDebugBase();
  const d=document.querySelector("#debug");
  if(d&&!d.classList.contains("hidden")) d.textContent=d.textContent.replace(/^v0\.19/m,"v0.21");
};


/* v0.21: exact current-turn DorukCraft upload, stronger avatar focus ring, louder shell SFX. */

/* ========================================================================== */
/* v0.22 — user-provided DorukStation system audio themes                     */
/* ========================================================================== */
const V22_AUDIO_ROOT="assets/system-audio";
const V22_LAST_SOUND_THEME_KEY="ds-last-sound-theme-v022";
const V22_LAST_BOOT_AUDIO_KEY="ds-last-boot-audio-v022";
const V22_SOUND_FILES={
 classic:{
  nav:"classic/ALL/40. Src7 Cursol Refine C.mp3",
  select:"classic/ALL/47. Src11 Decide Refine D.mp3",
  back:"classic/ALL/46. Src10 Cancel Refine D.mp3",
  popupOpen:"classic/ALL/81. Src5 Se Boot Miniapp.mp3",
  popupClose:"classic/ALL/82. Src6 Se Boot Miniapp.mp3",
  notification:"classic/ALL/60. Src23 Se Msg Notificat.mp3",
  trophy:"classic/ALL/64. Src27 Se Msg Trophy.mp3",
  error:"classic/ALL/69. Src31 Se Osk Tb Error.mp3",
  key:"classic/ALL/68. Src30 Se Osk Key Press.mp3",
  backspace:"classic/ALL/65. Src28 Se Osk Backspace.mp3",
  boot:"classic/boot.mp3",homeIntro:"classic/home-intro.mp3"
 },
 modern:{
  nav:"modern/ALL/17. Focus Move Psfx Focus Move.mp3",
  select:"modern/ALL/11. Enter Psfx Enter.mp3",
  back:"modern/ALL/05. Cancel Psfx Cancel.mp3",
  popupOpen:"modern/ALL/25. Open Control Center Psfx Open Contro.mp3",
  popupClose:"modern/ALL/09. Close Control Center Psfx Close Contr.mp3",
  notification:"modern/ALL/18. Informative Toasts Something to Read Psfx Informative.mp3",
  trophy:"modern/ALL/39. Trophy Toast Psfx Trophy Toas.mp3",
  error:"modern/ALL/14. Error Toasts Something Is Broken Psfx Error Toast.mp3",
  key:"modern/ALL/38. Text Input Psfx Text Input.mp3",
  backspace:"modern/ALL/04. Backspace Psfx Backspace.mp3",
  boot:"modern/boot.mp3",homeIntro:"modern/home-intro.mp3"
 }
}
const V22_SFX_VOLUME={nav:.82,select:.92,back:.90,popupOpen:.90,popupClose:.88,notification:.94,trophy:.96,error:.94,key:.82,backspace:.86,boot:.90,homeIntro:.84};
const v22AudioCache=new Map();
let v22BootAudio=null;

S.soundTheme="classic";
S.bootAudioMode="theme";

function v22SoundTheme(){
 const value=(currentProfile?S.soundTheme:localStorage.getItem(V22_LAST_SOUND_THEME_KEY))||"classic";
 return value==="modern"?"modern":"classic";
}
function v22BootAudioMode(){
 const value=(currentProfile?S.bootAudioMode:localStorage.getItem(V22_LAST_BOOT_AUDIO_KEY))||"theme";
 return value==="nostalgia"?"nostalgia":"theme";
}
function v22SoundThemeLabel(){return v22SoundTheme()==="modern"?"Modern":"Classic"}
function v22BootAudioLabel(){return v22BootAudioMode()==="nostalgia"?"Nostalgia":"Follow Sound Theme"}
function v22SetSoundTheme(value){
 S.soundTheme=value==="modern"?"modern":"classic";
 pSet("soundTheme",S.soundTheme);
 if(currentProfile&&!currentProfile.guest)localStorage.setItem(V22_LAST_SOUND_THEME_KEY,S.soundTheme);
}
function v22SetBootAudioMode(value){
 S.bootAudioMode=value==="nostalgia"?"nostalgia":"theme";
 pSet("bootAudioMode",S.bootAudioMode);
 if(currentProfile&&!currentProfile.guest)localStorage.setItem(V22_LAST_BOOT_AUDIO_KEY,S.bootAudioMode);
}
async function v22ApplySink(audio){
 try{
  const sink=selectedAudioSinkId||(currentProfile?pGet("audioSinkId",""):"");
  if(sink&&typeof audio.setSinkId==="function")await audio.setSinkId(sink);
 }catch{}
}
function v22AudioFor(path){
 let a=v22AudioCache.get(path);
 if(!a){a=new Audio(`${V22_AUDIO_ROOT}/${path}`);a.preload="auto";v22AudioCache.set(path,a)}
 return a;
}
function v22PlayPath(path,volume=.9,{restart=true}={}){
 if(!S.sounds||!path)return Promise.resolve(false);
 const a=v22AudioFor(path);
 try{if(restart){a.pause();a.currentTime=0}}catch{}
 a.volume=Math.max(0,Math.min(1,volume));
 return Promise.resolve(v22ApplySink(a)).then(()=>a.play()).then(()=>true).catch(()=>false);
}
function v22PlaySfx(kind){
 const theme=v22SoundTheme(),path=V22_SOUND_FILES[theme]?.[kind];
 return v22PlayPath(path,V22_SFX_VOLUME[kind]??.9);
}
function v22StopSystemAudio(){
 for(const a of v22AudioCache.values())try{a.pause();a.currentTime=0}catch{}
 if(v22BootAudio)try{v22BootAudio.pause();v22BootAudio.currentTime=0}catch{}
}
function v22PlayBootAudio(){
 if(!S.sounds)return Promise.resolve(false);
 const path=v22BootAudioMode()==="nostalgia"?"optional/nostalgia-boot.mp3":V22_SOUND_FILES[v22SoundTheme()].boot;
 if(v22BootAudio)try{v22BootAudio.pause();v22BootAudio.currentTime=0}catch{}
 v22BootAudio=v22AudioFor(path);v22BootAudio.volume=.90;
 try{v22BootAudio.currentTime=0}catch{}
 return Promise.resolve(v22ApplySink(v22BootAudio)).then(()=>v22BootAudio.play()).then(()=>true).catch(()=>false);
}
function v22PlayHomeIntro(){return v22PlaySfx("homeIntro")}

/* Replace generated oscillator bleeps with the supplied system sounds. */
navSound=()=>{v22PlaySfx("nav")};
selectSound=()=>{v22PlaySfx("select")};
backSound=()=>{v22PlaySfx("back")};
notificationSound=()=>{v22PlaySfx("notification")};
function trophySound(){v22PlaySfx("trophy")}
function errorSound(){v22PlaySfx("error")}
function popupOpenSound(){v22PlaySfx("popupOpen")}
function popupCloseSound(){v22PlaySfx("popupClose")}
function keyboardKeySound(){v22PlaySfx("key")}
function keyboardBackspaceSound(){v22PlaySfx("backspace")}

/* Load the audio-theme choices with the rest of each user's shell state. */
const _v22LoadProfileState=loadProfileState;
loadProfileState=function(profile){
 const out=_v22LoadProfileState(profile);
 S.soundTheme=pGet("soundTheme",localStorage.getItem(V22_LAST_SOUND_THEME_KEY)||"classic")==="modern"?"modern":"classic";
 S.bootAudioMode=pGet("bootAudioMode",localStorage.getItem(V22_LAST_BOOT_AUDIO_KEY)||"theme")==="nostalgia"?"nostalgia":"theme";
 if(profile&&!profile.guest){
  localStorage.setItem(V22_LAST_SOUND_THEME_KEY,S.soundTheme);
  localStorage.setItem(V22_LAST_BOOT_AUDIO_KEY,S.bootAudioMode);
 }
 return out;
};

function openSoundThemePage(){
 openPage({title:"System Sound Theme",subtitle:"Choose which DorukStation system-sound set this user hears.",icon:"assets/skin/flow/function/setting.png",items:[
  {title:"Classic",note:v22SoundTheme()==="classic"?"Active · classic DorukStation / Classic DorukStation sounds":"Classic DorukStation / Classic DorukStation sounds",action:()=>{v22SetSoundTheme("classic");renderPage()}},
  {title:"Modern",note:v22SoundTheme()==="modern"?"Active · modern DorukStation sounds":"Modern DorukStation sounds",action:()=>{v22SetSoundTheme("modern");renderPage()}}
 ]},true)
}
function openBootAudioPage(){
 openPage({title:"Boot Audio",subtitle:"The boot sound is independent from the rest of the system-sound theme.",icon:"assets/skin/flow/function/setting.png",items:[
  {title:"Follow Sound Theme",note:v22BootAudioMode()==="theme"?`Active · ${v22SoundThemeLabel()} boot sound`:`Use the ${v22SoundThemeLabel()} boot sound`,action:()=>{v22SetBootAudioMode("theme");renderPage();setTimeout(v22PlayBootAudio,80)}},
  {title:"Nostalgia Boot",note:v22BootAudioMode()==="nostalgia"?"Active · optional nostalgia startup audio":"Use the optional nostalgia startup audio",action:()=>{v22SetBootAudioMode("nostalgia");renderPage();setTimeout(v22PlayBootAudio,80)}}
 ]},true)
}

/* Surface audio choices in both Themes and Sound and Screen. */
openThemeRootPage=function(){
 openPage({title:"Themes",subtitle:"Visual themes and system-audio themes are saved separately for each user.",icon:"assets/skin/flow/function/setting.png",items:[
  {title:"Flow Colors",note:S.theme.kind==="flow"?themeLabel():"8 colors",action:openFlowThemePage},
  {title:"Game Themes",note:S.theme.kind==="photo"?themeLabel():`${PHOTO_THEMES.length} built in`,action:openPhotoThemePage},
  {title:"System Sound Theme",note:v22SoundThemeLabel(),action:openSoundThemePage},
  {title:"Boot Audio",note:v22BootAudioLabel(),action:openBootAudioPage},
  {title:"Custom Background",note:"Choose image",action:()=>$("#backgroundPicker").click()}
 ]},true)
};
openSoundScreenPage=function(){
 openPage({title:"Sound and Screen",subtitle:"DorukStation display and audio preferences.",items:[
  {title:"Audio Output",note:"Choose laptop speakers / headphones instead of a controller speaker",action:chooseAudioOutput},
  {title:"Sound Effects",note:S.sounds?"On":"Off",action:()=>{S.sounds=!S.sounds;pSet("sounds",S.sounds?"on":"off");if(!S.sounds)v22StopSystemAudio();else setTimeout(()=>v22PlaySfx("select"),60);openSoundScreenPage()}},
  {title:"System Sound Theme",note:v22SoundThemeLabel(),action:openSoundThemePage},
  {title:"Boot Audio",note:v22BootAudioLabel(),action:openBootAudioPage},
  {title:"Background Animation",note:S.animation?"On":"Off",action:()=>{S.animation=!S.animation;pSet("animation",S.animation?"on":"off");applyTheme();openSoundScreenPage()}},
  {title:"Display",note:"Full-bleed shell / native game viewport",action:openDisplayPage},
  {title:"Custom Background",action:()=>$("#backgroundPicker").click()}
 ]},true)
};

/* Quick Menu/Share opening uses the supplied popup-open sample. */
const _v22OpenQuickMenu=openQuickMenu;
openQuickMenu=function(...args){const was=S.quickMenuOpen,out=_v22OpenQuickMenu(...args);if(!was&&S.quickMenuOpen)v28PlayEvent("quickMenuOpen");return out};
const _v22OpenShareMenu=openShareMenu;
openShareMenu=function(...args){const was=S.shareMenuOpen,out=_v22OpenShareMenu(...args);if(!was&&S.shareMenuOpen)v28PlayEvent("shareOpen");return out};

/* A successful user login gets the matching Home-menu intro sample. */
const _v22FinishUserLogin=finishUserLogin;
finishUserLogin=function(...args){const out=_v22FinishUserLogin(...args);setTimeout(v22PlayHomeIntro,420);return out};

/* Replay Startup now replays the selected boot audio as well as the animation. */
const _v22ReplayBoot=replayBoot;
replayBoot=function(...args){v22PlayBootAudio();return _v22ReplayBoot(...args)};

/* Best-effort startup playback. Browsers may block unmuted audio before a user gesture;
   Replay Startup from Settings is always available as an explicit preview. */
setTimeout(()=>v22PlayBootAudio(),120);

/* Keep Active labels and parent-page notes live immediately after a change. */
function v22SyncAudioSettingNotes(){
 const groups=[S.pageItems,...S.pageStack.map(p=>p.items)].filter(Array.isArray);
 for(const items of groups)for(const item of items){
  if(item.title==="System Sound Theme")item.note=v22SoundThemeLabel();
  if(item.title==="Boot Audio")item.note=v22BootAudioLabel();
 }
}
openSoundThemePage=function(){
 const refresh=()=>{
  S.pageItems[0].note=v22SoundTheme()==="classic"?"Active · classic DorukStation / Classic DorukStation sounds":"Classic DorukStation / Classic DorukStation sounds";
  S.pageItems[1].note=v22SoundTheme()==="modern"?"Active · modern DorukStation sounds":"Modern DorukStation sounds";
  v22SyncAudioSettingNotes();renderPage();
 };
 openPage({title:"System Sound Theme",subtitle:"Choose which DorukStation system-sound set this user hears.",icon:"assets/skin/flow/function/setting.png",items:[
  {title:"Classic",note:v22SoundTheme()==="classic"?"Active · classic DorukStation / Classic DorukStation sounds":"Classic DorukStation / Classic DorukStation sounds",action:()=>{v22SetSoundTheme("classic");refresh()}},
  {title:"Modern",note:v22SoundTheme()==="modern"?"Active · modern DorukStation sounds":"Modern DorukStation sounds",action:()=>{v22SetSoundTheme("modern");refresh()}}
 ]},true)
};
openBootAudioPage=function(){
 const refresh=()=>{
  S.pageItems[0].note=v22BootAudioMode()==="theme"?`Active · ${v22SoundThemeLabel()} boot sound`:`Use the ${v22SoundThemeLabel()} boot sound`;
  S.pageItems[1].note=v22BootAudioMode()==="nostalgia"?"Active · optional nostalgia startup audio":"Use the optional nostalgia startup audio";
  v22SyncAudioSettingNotes();renderPage();
 };
 openPage({title:"Boot Audio",subtitle:"The boot sound is independent from the rest of the system-sound theme.",icon:"assets/skin/flow/function/setting.png",items:[
  {title:"Follow Sound Theme",note:v22BootAudioMode()==="theme"?`Active · ${v22SoundThemeLabel()} boot sound`:`Use the ${v22SoundThemeLabel()} boot sound`,action:()=>{v22SetBootAudioMode("theme");refresh();setTimeout(v22PlayBootAudio,80)}},
  {title:"Nostalgia Boot",note:v22BootAudioMode()==="nostalgia"?"Active · optional nostalgia startup audio":"Use the optional nostalgia startup audio",action:()=>{v22SetBootAudioMode("nostalgia");refresh();setTimeout(v22PlayBootAudio,80)}}
 ]},true)
};


/* ==========================================================================
   DorukStation PS4 Web v0.23
   Device-speaker audio routing. Controller speaker endpoints are never chosen
   automatically. The selected physical output is device-global rather than
   per-user, and same-origin HTML games inherit the same output where the
   browser supports HTMLMediaElement.setSinkId().
   ========================================================================== */
const V23_DEVICE_SINK_KEY="ds-device-audio-sink-v023";
const V23_CONTROLLER_AUDIO_RE=/controller|dualshock|dualsense|wireless controller|gamepad|sony.*speaker|playstation/i;
const V23_DEVICE_AUDIO_HINT_RE=/speaker|speakers|built[- ]?in|internal|analog|headphone|headset|line out|audio out|hdmi|displayport/i;
let v23DeviceSinkResolving=null;

function v23IsControllerAudioDevice(d){return !!(d&&V23_CONTROLLER_AUDIO_RE.test(String(d.label||"")))}
function v23OutputScore(d){
 const label=String(d?.label||"");let score=0;
 if(V23_DEVICE_AUDIO_HINT_RE.test(label))score+=100;
 if(/speaker|speakers|built[- ]?in|internal|analog/i.test(label))score+=45;
 if(/headphone|headset/i.test(label))score+=25;
 if(/hdmi|displayport/i.test(label))score+=12;
 if(d?.deviceId==="default")score+=4;
 if(v23IsControllerAudioDevice(d))score-=10000;
 return score;
}
function v23StoredDeviceSink(){return localStorage.getItem(V23_DEVICE_SINK_KEY)||""}
function v23RememberDeviceSink(id){
 selectedAudioSinkId=id||"";
 if(id)localStorage.setItem(V23_DEVICE_SINK_KEY,id);else localStorage.removeItem(V23_DEVICE_SINK_KEY);
}
async function v23EnumerateOutputs(){
 try{return (await navigator.mediaDevices?.enumerateDevices?.()||[]).filter(d=>d.kind==="audiooutput")}catch{return []}
}
async function v23ChooseSafeSinkId(){
 const outs=await v23EnumerateOutputs(),stored=v23StoredDeviceSink()||selectedAudioSinkId;
 if(stored){
  const found=outs.find(d=>d.deviceId===stored);
  /* Keep a previously chosen sink unless the browser can prove it is a
     controller endpoint. This makes the choice survive controller reconnects. */
  if(!found||!v23IsControllerAudioDevice(found))return stored;
  v23RememberDeviceSink("");
 }
 const labeled=outs.filter(d=>d.deviceId&&d.label&&!v23IsControllerAudioDevice(d));
 if(!labeled.length)return ""; // never blindly pick an unlabeled controller endpoint
 labeled.sort((a,b)=>v23OutputScore(b)-v23OutputScore(a));
 return labeled[0]?.deviceId||"";
}
async function v23SetDeviceSink(id,{remember=true}={}){
 if(!id)return false;
 try{
  const outs=await v23EnumerateOutputs(),found=outs.find(d=>d.deviceId===id);
  if(found&&v23IsControllerAudioDevice(found))return false;
  if(remember)v23RememberDeviceSink(id);else selectedAudioSinkId=id;
  const ctx=await ensureAudioContext().catch(()=>null);
  if(ctx&&typeof ctx.setSinkId==="function")try{await ctx.setSinkId(id)}catch{}
  for(const a of v22AudioCache.values())if(typeof a.setSinkId==="function")try{await a.setSinkId(id)}catch{}
  for(const e of runningApps.values())v23InstallFrameDeviceAudio(e);
  return true;
 }catch{return false}
}
async function v23EnsureDeviceSink(){
 if(v23DeviceSinkResolving)return v23DeviceSinkResolving;
 v23DeviceSinkResolving=(async()=>{
  const id=await v23ChooseSafeSinkId();
  if(!id)return "";
  await v23SetDeviceSink(id,{remember:true});return id;
 })().finally(()=>{v23DeviceSinkResolving=null});
 return v23DeviceSinkResolving;
}

/* Every supplied DorukStation system sound goes through the selected physical
   device output instead of inheriting a controller speaker as the browser's
   temporary default output. */
v22ApplySink=async function(audio){
 try{const sink=await v23EnsureDeviceSink();if(sink&&typeof audio?.setSinkId==="function"&&audio.sinkId!==sink)await audio.setSinkId(sink)}catch{}
};
applyPreferredAudioSink=async function(){return !!(await v23EnsureDeviceSink())};

/* Manual fallback for browsers that hide output-device labels until the user
   grants speaker-selection permission. Controller speaker choices are rejected. */
chooseAudioOutput=async function(){
 if(!navigator.mediaDevices?.selectAudioOutput){pushSystemNotification("","Device speaker selection unavailable","Use the operating system sound settings to choose this device's speakers.",currentProfile);return}
 try{
  const d=await navigator.mediaDevices.selectAudioOutput();
  if(v23IsControllerAudioDevice(d)){
   pushSystemNotification("","Controller speaker ignored","Choose the laptop/device speakers instead of the controller audio endpoint.",currentProfile);errorSound();return;
  }
  if(!await v23SetDeviceSink(d.deviceId,{remember:true}))throw new Error("The selected output could not be used.");
  pushSystemNotification("","Device audio selected",d.label||"DorukStation will keep using this device output.",currentProfile);selectSound();
 }catch(e){if(e?.name!=="NotAllowedError")pushSystemNotification("","Could not select device audio",e?.message||"Output selection failed.",currentProfile)}
};

/* Route media created by local/same-origin games too. DorukCraft uses new
   Audio(...), so patching HTMLMediaElement.play catches its music and SFX
   without changing DorukCraft's own sound code. */
function v23InstallFrameDeviceAudio(entry){
 try{
  const w=entry?.iframe?.contentWindow;if(!w)return;
  const proto=w.HTMLMediaElement?.prototype;if(!proto||proto.__dorukstationDeviceAudioPatched)return;
  const nativePlay=proto.play;
  Object.defineProperty(proto,"__dorukstationDeviceAudioPatched",{value:true,configurable:true});
  proto.play=function(...args){
   const media=this;
   return Promise.resolve(v23EnsureDeviceSink()).then(async sink=>{
    if(sink&&typeof media.setSinkId==="function"&&media.sinkId!==sink)try{await media.setSinkId(sink)}catch{}
    return nativePlay.apply(media,args);
   });
  };
  /* Also retarget media objects already present in the game document. */
  v23EnsureDeviceSink().then(sink=>{if(!sink)return;try{for(const m of w.document.querySelectorAll("audio,video"))if(typeof m.setSinkId==="function")m.setSinkId(sink).catch(()=>{})}catch{}});
 }catch{} // cross-origin games remain browser/OS routed
}
const _v23MakeGameViewportResponsive=makeGameViewportResponsive;
makeGameViewportResponsive=function(entry){const out=_v23MakeGameViewportResponsive(entry);v23InstallFrameDeviceAudio(entry);return out};

/* The audio output belongs to the physical device, not to a DorukStation user. */
const _v23OpenSoundScreenPage=openSoundScreenPage;
openSoundScreenPage=function(){
 openPage({title:"Sound and Screen",subtitle:"DorukStation display and audio preferences.",items:[
  {title:"Device Audio Output",note:"Always use this device's speakers / headphones, never a controller speaker",action:chooseAudioOutput},
  {title:"Sound Effects",note:S.sounds?"On":"Off",action:()=>{S.sounds=!S.sounds;pSet("sounds",S.sounds?"on":"off");if(!S.sounds)v22StopSystemAudio();else setTimeout(()=>v22PlaySfx("select"),60);openSoundScreenPage()}},
  {title:"System Sound Theme",note:v22SoundThemeLabel(),action:openSoundThemePage},
  {title:"Boot Audio",note:v22BootAudioLabel(),action:openBootAudioPage},
  {title:"Background Animation",note:S.animation?"On":"Off",action:()=>{S.animation=!S.animation;pSet("animation",S.animation?"on":"off");applyTheme();openSoundScreenPage()}},
  {title:"Display",note:"Full-bleed shell / native game viewport",action:openDisplayPage},
  {title:"Custom Background",action:()=>$("#backgroundPicker").click()}
 ]},true)
};

/* Quick Menu gets the same device-only selector. */
const _v23QuickMenuEntries=quickMenuEntries;
quickMenuEntries=function(){
 const items=_v23QuickMenuEntries();const sd=items.find(x=>x.title==="Sound/Devices");
 if(sd&&Array.isArray(sd.subs)){
  const audio=sd.subs.find(x=>x.title==="Audio Output");if(audio){audio.title="Device Audio Output";audio.note="Laptop/device speakers · controller speaker blocked";audio.action=chooseAudioOutput}
 }
 return items;
};

/* Re-check the physical output whenever audio devices change. An explicit
   speaker sink means connecting a controller cannot steal DorukStation audio. */
navigator.mediaDevices?.addEventListener?.("devicechange",()=>{setTimeout(()=>v23EnsureDeviceSink(),180)});
setTimeout(()=>v23EnsureDeviceSink(),350);

/* ========================================================================== */
/* DorukStation PS4 Web v0.24                                                 */
/* Create User flow: modal priority, single-exit overlays, lazy avatar pages, */
/* and complete system sounds throughout account creation.                    */
/* ========================================================================== */
const V24_AVATAR_PAGE_SIZE=21;
let v24AvatarPageKey="",v24AvatarRenderToken=0,v24KeyboardSuppressUntil=0;

function v24FlowControllerIndex(){
 return Number.isInteger(selectingControllerIndex)?selectingControllerIndex:
        (Number.isInteger(activeControllerIndex)?activeControllerIndex:null);
}
function v24ConsumeController(index){if(Number.isInteger(index))v18PrimeController(index)}

/* ---- Create User system sounds ---- */
const v24ActivateUserSelectionBase=activateUserSelection;
activateUserSelection=function(){
 const item=[...profiles,{id:"__add__",name:"Create User",add:true}][S.userIndex];
 if(item?.add){selectSound();openCreateChoice();return}
 selectSound();return v24ActivateUserSelectionBase();
};
const v24OpenCreateChoiceBase=openCreateChoice;
openCreateChoice=function(){const out=v24OpenCreateChoiceBase();popupOpenSound?.();v24ConsumeController(v24FlowControllerIndex());return out};
const v24ActivateCreateChoiceBase=activateCreateChoice;
activateCreateChoice=function(){selectSound();return v24ActivateCreateChoiceBase()};
const v24OpenCreateUserBase=openCreateUser;
openCreateUser=function(){const out=v24OpenCreateUserBase();popupOpenSound?.();v24ConsumeController(v24FlowControllerIndex());return out};
const v24CloseCreateUserBase=closeCreateUser;
closeCreateUser=function(){const out=v24CloseCreateUserBase();popupCloseSound?.();v24ConsumeController(v24FlowControllerIndex());return out};

/* ---- Avatar picker is now a true modal overlay. The screen underneath stays
   mounted, so leaving it never has to reconstruct Create User/Profile. ---- */
function v24SelectedAvatar(){return avatarPickerTarget==="create"?pendingCreateAvatar:avatarForProfile(currentProfile)}
function v24AvatarPageData(){
 const avs=visibleAvatars(),pageCount=Math.max(1,Math.ceil(avs.length/V24_AVATAR_PAGE_SIZE));
 avatarGridIndex=Math.max(0,Math.min(avatarGridIndex,Math.max(0,avs.length-1)));
 const page=Math.min(pageCount-1,Math.floor(avatarGridIndex/V24_AVATAR_PAGE_SIZE));
 return {avs,page,pageCount,start:page*V24_AVATAR_PAGE_SIZE,end:Math.min(avs.length,(page+1)*V24_AVATAR_PAGE_SIZE)};
}
function v24UpdateAvatarClasses(){
 const selected=v24SelectedAvatar();
 $$("#avatarGrid .avatar-tile").forEach(el=>{
  const i=Number(el.dataset.a);el.classList.toggle("focused",avatarFocusArea==="grid"&&i===avatarGridIndex);
  const a=visibleAvatars()[i];el.classList.toggle("selected",!!a&&a.src===selected);
 });
 $("#avatarGrid .focused")?.scrollIntoView({block:"nearest",inline:"nearest"});
}
function v24RenderAvatarGrid(force=false){
 const {avs,page,pageCount,start,end}=v24AvatarPageData(),key=`${avatarCategoryIndex}:${page}`;
 let pageInfo=$("#avatarPageInfo");
 if(!pageInfo){pageInfo=document.createElement("div");pageInfo.id="avatarPageInfo";pageInfo.className="avatar-page-info";$("#avatarPicker").appendChild(pageInfo)}
 pageInfo.textContent=`Page ${page+1} / ${pageCount}`;
 if(!force&&v24AvatarPageKey===key&&$("#avatarGrid .avatar-tile")){v24UpdateAvatarClasses();return}
 v24AvatarPageKey=key;const token=++v24AvatarRenderToken;
 $("#avatarGrid").innerHTML='<div class="avatar-loading"><div class="avatar-loading-spinner"></div><div>Loading avatars…</div></div>';
 requestAnimationFrame(()=>setTimeout(()=>{
  if(token!==v24AvatarRenderToken||!S.avatarPickerOpen)return;
  const current=visibleAvatars(),slice=current.slice(start,end),selected=v24SelectedAvatar();
  $("#avatarGrid").innerHTML=slice.map((a,j)=>{const i=start+j;return `<button class="avatar-tile ${avatarFocusArea==="grid"&&i===avatarGridIndex?"focused":""} ${a.src===selected?"selected":""}" data-a="${i}" title="${esc(a.name)}"><img loading="lazy" decoding="async" src="${a.src}" alt="${esc(a.name)}"></button>`}).join("");
  $$("#avatarGrid .avatar-tile").forEach(el=>el.onclick=()=>{avatarGridIndex=Number(el.dataset.a);avatarFocusArea="grid";chooseAvatar()});
  v24UpdateAvatarClasses();
 },24));
}
renderAvatarPicker=function(){
 const cats=avatarCategories();avatarCategoryIndex=Math.max(0,Math.min(avatarCategoryIndex,cats.length-1));
 $("#avatarCategories").innerHTML=cats.map((c,i)=>`<button class="avatar-category ${avatarFocusArea==="categories"&&i===avatarCategoryIndex?"focused":""}" data-c="${i}">${esc(c)}</button>`).join("");
 $$("#avatarCategories .avatar-category").forEach(el=>el.onclick=()=>{avatarCategoryIndex=Number(el.dataset.c);avatarGridIndex=0;avatarFocusArea="grid";selectSound();v24AvatarPageKey="";renderAvatarPicker()});
 $("#avatarCategories .focused")?.scrollIntoView({block:"nearest"});
 v24RenderAvatarGrid(false);
};
openAvatarPicker=function(target="profile"){
 if(S.avatarPickerOpen)return;
 avatarPickerTarget=target;avatarCategoryIndex=0;avatarFocusArea="grid";avatarGridIndex=0;
 const avs=visibleAvatars(),selected=target==="create"?pendingCreateAvatar:avatarForProfile(currentProfile),found=avs.findIndex(a=>a.src===selected);if(found>=0)avatarGridIndex=found;
 S.avatarPickerOpen=true;v24AvatarPageKey="";v24AvatarRenderToken++;
 showUi("#avatarPicker","forward");popupOpenSound?.();renderAvatarPicker();v24ConsumeController(v24FlowControllerIndex());
};
closeAvatarPicker=function({sound=true}={}){
 if(!S.avatarPickerOpen)return;
 const idx=v24FlowControllerIndex();S.avatarPickerOpen=false;v24AvatarRenderToken++;hideUi("#avatarPicker","back");
 if(sound){backSound();popupCloseSound?.()}v24ConsumeController(idx);
};
chooseAvatar=function(){
 const a=visibleAvatars()[avatarGridIndex];if(!a)return;
 if(avatarPickerTarget==="create"){pendingCreateAvatar=a.src;const img=$(".create-user-avatar");if(img)img.src=a.src}
 else if(currentProfile){currentProfile.avatar=a.src;currentProfile.avatarChosen=true;if(!currentProfile.guest)saveProfiles();renderQuick();updateSessionStatus(true)}
 selectSound();closeAvatarPicker({sound:false});popupCloseSound?.();
};
moveAvatar=function(dx,dy){
 const cats=avatarCategories(),avs=visibleAvatars(),cols=7;
 if(avatarFocusArea==="categories"){
  if(dx>0){avatarFocusArea="grid";navSound();renderAvatarPicker();return}
  if(dy){avatarCategoryIndex=Math.max(0,Math.min(cats.length-1,avatarCategoryIndex+dy));avatarGridIndex=0;v24AvatarPageKey="";navSound();renderAvatarPicker()}
  return;
 }
 if(dx<0){if(avatarGridIndex%cols===0){avatarFocusArea="categories";navSound();renderAvatarPicker();return}avatarGridIndex=Math.max(0,avatarGridIndex-1)}
 else if(dx>0)avatarGridIndex=Math.min(avs.length-1,avatarGridIndex+1);
 if(dy<0)avatarGridIndex=Math.max(0,avatarGridIndex-cols);else if(dy>0)avatarGridIndex=Math.min(avs.length-1,avatarGridIndex+cols);
 navSound();renderAvatarPicker();
};

/* ---- Text editing: never autofocus the DOM input from controller navigation.
   The OSK owns editing, sits on top, and one Circle always returns to Create User. ---- */
const v24OpenForEditableBase=v19OpenForEditable;
v19OpenForEditable=function(el,title){
 if(performance.now()<v24KeyboardSuppressUntil||!v19IsEditable(el))return;
 if(v18Kb.open&&(v18Kb.target===el||v19KeyboardTarget===el))return;
 return v24OpenForEditableBase(el,title);
};
const v24OpenDigitalKeyboardBase=openDigitalKeyboard;
openDigitalKeyboard=function(opts={}){
 if(v18Kb.open&&opts.target&&(v18Kb.target===opts.target||v19KeyboardTarget===opts.target))return;
 const out=v24OpenDigitalKeyboardBase(opts);popupOpenSound?.();v24ConsumeController(v18KeyboardControllerIndex);return out;
};
const v24CloseDigitalKeyboardBase=closeDigitalKeyboard;
closeDigitalKeyboard=function(cancel=false){
 if(!v18Kb.open)return;const idx=v18KeyboardControllerIndex,target=v18Kb.target||v19KeyboardTarget;
 v24KeyboardSuppressUntil=performance.now()+320;const out=v24CloseDigitalKeyboardBase(cancel);
 if(target?.id==="createUserName"&&S.createUserOpen){S.createUserIndex=1;renderCreateUserFocus()}
 popupCloseSound?.();v24ConsumeController(idx);return out;
};
v19KeyboardEnter=function(){
 const t=v18Kb.target||v19KeyboardTarget,multi=!!(t&&(t.tagName?.toLowerCase()==="textarea"||t.isContentEditable));
 if(multi){v18KeyboardAppend("\n");return}
 selectSound();closeDigitalKeyboard(false); /* R2 is Enter only: no synthetic X/letter event. */
};
activateCreateUser=function(){
 if(S.createUserIndex===0){selectSound();openAvatarPicker("create");return}
 if(S.createUserIndex===1){selectSound();const input=$("#createUserName");v19OpenForEditable(input,"Create User — Name");return}
 selectSound();confirmCreateUser();
};
$("#changeAvatarButton").onclick=()=>{S.createUserIndex=0;renderCreateUserFocus();activateCreateUser()};
$("#createNameRow").onclick=e=>{e?.preventDefault?.();S.createUserIndex=1;renderCreateUserFocus();v19OpenForEditable($("#createUserName"),"Create User — Name")};
$("#createUserConfirm").onclick=()=>{S.createUserIndex=2;renderCreateUserFocus();activateCreateUser()};

/* ---- One stable controller scheduler. Older versions added several RAF entry
   points while evolving the controller code; all of them now converge here. ---- */
let v24LoopPending=false;
function v24ScheduleControllerLoop(){if(v24LoopPending)return;v24LoopPending=true;requestAnimationFrame(ts=>{v24LoopPending=false;v24ControllerFrame(ts);v24ScheduleControllerLoop()})}
gamepadLoop=function(){v24ScheduleControllerLoop()};
function v24ControllerFrame(now){
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean);
 for(const gp of pads){const r=controllerRuntime(gp);v18ProcessPs(gp,r,now)}
 const selectedIndex=Number.isInteger(selectingControllerIndex)?selectingControllerIndex:activeControllerIndex;
 const flowGp=Number.isInteger(selectedIndex)?pads.find(g=>g.index===selectedIndex):null;

 /* Highest priority: popup keyboard. */
 if(S.digitalKeyboardOpen){
  const gp=Number.isInteger(v18KeyboardControllerIndex)?pads.find(g=>g.index===v18KeyboardControllerIndex):flowGp;
  if(gp){const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];
   v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,v18KeyboardMove));
   if(edge(0))v18KeyboardActivate();if(edge(1)){backSound();closeDigitalKeyboard(false)}if(edge(2))v18KeyboardBackspace();if(edge(3))v18KeyboardTogglePage();if(edge(6))v19KeyboardL2();if(edge(7))v19KeyboardEnter();r.last=b}
  updateSessionStatus();return;
 }

 /* Avatar is above Create User/Profile. This order fixes the old trap where the
    hidden Create User state consumed Circle/X before the avatar picker could. */
 if(S.avatarPickerOpen){
  if(flowGp){const r=controllerRuntime(flowGp),b=flowGp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];
   v19Repeat(r,v19Direction(flowGp),now,d=>v19MoveFromDir(d,moveAvatar));
   if(edge(0)){if(avatarFocusArea==="categories"){avatarFocusArea="grid";selectSound();renderAvatarPicker()}else chooseAvatar()}
   if(edge(1))closeAvatarPicker();r.last=b}
  updateSessionStatus();return;
 }

 /* Remaining account-flow screens. */
 if((S.userSelectOpen||S.createChoiceOpen||S.createUserOpen)&&flowGp){
  const r=controllerRuntime(flowGp),b=flowGp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i],dir=v19Direction(flowGp);
  if(S.userSelectOpen)v19Repeat(r,dir,now,d=>{if(d==="L")moveUserSelection(-1);else if(d==="R")moveUserSelection(1)});
  else if(S.createChoiceOpen)v19Repeat(r,dir,now,d=>{if(d==="U")moveCreateChoice(-1);else if(d==="D")moveCreateChoice(1)});
  else if(S.createUserOpen)v19Repeat(r,dir,now,d=>{if(d==="U")moveCreateUser(-1);else if(d==="D")moveCreateUser(1)});
  if(edge(0)){if(S.userSelectOpen)activateUserSelection();else if(S.createChoiceOpen)activateCreateChoice();else if(S.createUserOpen)activateCreateUser()}
  if(edge(1)){if(S.createChoiceOpen)closeCreateChoice();else if(S.createUserOpen)closeCreateUser()}
  r.last=b;updateSessionStatus();return;
 }
 if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen){updateSessionStatus();return}

 /* An unassigned controller can join without disturbing the active user's input. */
 for(const gp of pads){if(controllerAssignments.has(gp.index))continue;const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];if(edge(0)||edge(9))beginControllerLogin(gp.index);r.last=b}

 const gp=Number.isInteger(activeControllerIndex)?pads.find(g=>g.index===activeControllerIndex):null;
 if(!gp){updateSessionStatus();return}
 const r=controllerRuntime(gp),b=gp.buttons.map(x=>!!x&&(x.pressed||Number(x.value||0)>.45)),edge=i=>!!b[i]&&!r.last[i];
 if(firstEntryFullscreenArmed&&b.some((v,i)=>v&&!r.last[i]))requestEntryFullscreen();
 if(edge(8)&&!S.quickMenuOpen&&!S.userSelectOpen){openShareMenu();r.last=b;updateSessionStatus();return}
 if(S.quickMenuOpen){v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,moveQuickMenu));if(edge(0))activateQuickMenu();if(edge(1))backQuickMenu();r.last=b;updateSessionStatus();return}
 if(S.shareMenuOpen){v19Repeat(r,v19Direction(gp),now,d=>{if(d==="U")moveShareMenu(-1);else if(d==="D")moveShareMenu(1)});if(edge(0))activateShareMenu();if(edge(1))closeShareMenu();r.last=b;updateSessionStatus();return}
 if(S.appSurface||v18ShellSwitching){r.last=b;updateSessionStatus();return}
 if(S.zone==="home"&&edge(4))v19JumpHomeEnd(false);if(S.zone==="home"&&edge(5))v19JumpHomeEnd(true);
 v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,move));if(edge(0))activate();if(edge(1))back();if(edge(9))options();r.last=b;updateSessionStatus();
}
v24ScheduleControllerLoop();

/* Keep debug/version text accurate. */
const v24UpdateDebugBase=updateDebug;
updateDebug=function(){v24UpdateDebugBase();const d=$("#debug");if(d&&!d.classList.contains("hidden"))d.textContent=d.textContent.replace(/^v0\.\d+/m,"v0.24")};


/* ========================================================================== */
/* v0.25 — local-file game boot fix + games folder + favicon app tiles       */
/* ========================================================================== */

/* Prefer a real supplied favicon for any app, including DorukCraft/folder apps. */
const v25AppInnerBase=appInner;
appInner=function(a){if(a?.image)return `<img src="${String(a.image).replace(/"/g,"&quot;")}" alt="">`;return v25AppInnerBase(a)};

function v25ExtractHtmlMeta(text,fileName="HTML Game"){
 const titleMatch=String(text).match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i);
 const title=(titleMatch?.[1]||fileName.replace(/\.html?$/i,"")).replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim()||"HTML Game";
 const tags=String(text).match(/<link\b[^>]*>/gi)||[];let icon="";
 for(const tag of tags){const rel=tag.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase()||"",href=tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2]||"";if(href&&rel.includes("icon")){icon=href;break}}
 return {title,icon};
}

/* File-picker apps use srcdoc instead of blob: URLs. That preserves the shell
   storage origin and fixes localStorage failures in Chrome local-file mode. */
(function v25ReplaceHtmlPicker(){
 const old=$("#htmlPicker");if(!old)return;const picker=old.cloneNode(true);old.replaceWith(picker);
 picker.addEventListener("change",async()=>{
  const file=picker.files?.[0];if(!file||!currentProfile)return;
  const text=await file.text(),meta=v25ExtractHtmlMeta(text,file.name),stable=file.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"html-app",id=`local-${stable}-${file.size}`;
  const previous=apps.find(a=>a.userAdded&&a.id===id);if(previous)removeUserApp(previous);
  const app={id,name:meta.title,desc:`Local HTML: ${file.name}`,live:`Local app for ${S.username}. Browser storage is namespaced to this user.`,type:meta.icon?"image":"custom",image:meta.icon||"",mark:"APP",action:"launch",sourceHtml:text,userAdded:true,inFolder:true,ownerProfileId:currentProfile.id};
  apps.splice(Math.max(0,apps.length-1),0,app);ensureLibraryLast();S.app=apps.indexOf(app);picker.value="";if(S.pageOpen&&$("#pageTitle").textContent==="Library")openLibraryPage();render();selectSound?.();
 });
})();

function v25ResolveGameBase(app){
 try{const u=new URL(app?.url||"",location.href),dir=new URL("./",u);return dir.href}catch{return ""}
}
function v25InjectBase(html,app){
 if(!app?.folderGame||/<base\b/i.test(html))return html;const base=v25ResolveGameBase(app);if(!base)return html;
 const tag=`<base href="${base.replace(/"/g,"&quot;")}">`;
 if(/<head[\s>]/i.test(html))return html.replace(/<head([^>]*)>/i,m=>m+tag);
 return tag+html;
}
function v25LoadPayloadScript(src){
 return new Promise((resolve,reject)=>{if(!src){reject(new Error("No game payload"));return}const old=document.querySelector(`script[data-ds-game-payload="${CSS.escape(src)}"]`);if(old){if(old.dataset.loaded==="1")resolve();else{old.addEventListener("load",resolve,{once:true});old.addEventListener("error",()=>reject(new Error(`Could not load ${src}`)),{once:true})}return}const sc=document.createElement("script");sc.src=src;sc.dataset.dsGamePayload=src;sc.onload=()=>{sc.dataset.loaded="1";resolve()};sc.onerror=()=>reject(new Error(`Could not load ${src}`));document.head.appendChild(sc)})
}
async function v25RawHtmlForApp(app){
 if(typeof app?.sourceHtml==="string")return app.sourceHtml;
 if(app?.folderGame){
  if(window.DorukStationGamePayloads?.[app.id])return window.DorukStationGamePayloads[app.id];
  if(app.payloadScript){await v25LoadPayloadScript(app.payloadScript);return window.DorukStationGamePayloads?.[app.id]||null}
 }
 return null;
}
function v25PrepareSrcdoc(raw,app){return injectProfileShim(v25InjectBase(raw,app),app.id)}

launchApp=async function(app){
 if(!app||!currentProfile)return;
 const current=getRunningEntry();if(current&&(current.app.id!==app.id||current.profileId!==currentProfile.id))return requestAppLaunch(app);
 let e=runningApps.get(app.id);if(e&&e.profileId!==currentProfile.id)return requestAppLaunch(app);
 if(!e){
  const iframe=document.createElement("iframe");iframe.title=app.name;iframe.allow="fullscreen *; autoplay *; pointer-lock *; clipboard-read *; clipboard-write *";iframe.allowFullscreen=true;iframe.dataset.appId=app.id;iframe.tabIndex=-1;iframe.style.cssText="position:absolute;inset:0;width:100%;height:100%;min-width:100%;min-height:100%;border:0;background:#000;display:none;pointer-events:none;visibility:hidden";
  $("#appSurface").appendChild(iframe);e={iframe,app,suspended:true,profileId:currentProfile.id,profileName:currentProfile.name,profileAvatar:avatarForProfile(currentProfile)};runningApps.set(app.id,e);
  iframe.addEventListener("load",()=>{makeGameViewportResponsive(e);installInputPauseShim(e);sendGameResolution(e);setGameSuspended(e,e.suspended);if(!e.suspended&&S.appSurface&&S.currentRunningId===e.app.id)gateGameInputUntilNeutral(e)});
  try{
   const raw=await v25RawHtmlForApp(app);
   if(raw!==null){iframe.srcdoc=v25PrepareSrcdoc(raw,app)}
   else{
    let source=app.objectUrl||app.url;if(!source)throw new Error("This application has no launch source.");
    if(app.profiled&&!app.profiledInjected){const u=new URL(source,location.href);u.searchParams.set("dsProfile",currentProfile.id);u.searchParams.set("dsApp",app.id);u.searchParams.set("dsFolder",folderForProfile(currentProfile));if(currentProfile.foldered||currentProfile.guest)u.searchParams.set("dsFoldered","1");if(currentProfile.guest)u.searchParams.set("dsGuest","1");source=u.href}iframe.src=source;
   }
  }catch(err){runningApps.delete(app.id);iframe.remove();pushSystemNotification?.("",`Could not open ${app.name}`,err?.message||"Game launch failed.",currentProfile);render();return}
 }
 resumeApp(app.id);
};

/* Update Library wording so folder-installed games are easy to identify. */
openLibraryPage=function(){
 const items=apps.filter(a=>a.id!=="library").map(a=>({title:a.name,note:a.folderGame?"Games folder":a.userAdded?"Imported HTML":"Home item",image:a.image,action:()=>{backPage();S.zone="home";S.app=apps.indexOf(a);render()}}));
 items.push({title:"Add HTML App",note:"Choose a standalone .html file",image:"assets/skin/add.png",action:()=>{$("#htmlPicker").dataset.mode="new";$("#htmlPicker").click()}});
 openPage({title:"Library",subtitle:"Games in games/ are indexed by refresh-games.py. Imported HTML apps are session-local.",icon:"assets/skin/flow/content/library.png",returnZone:"home",mode:"grid",cols:4,items});
};

/* Update debug/version text. */
const v25UpdateDebugBase=updateDebug;
updateDebug=function(){v25UpdateDebugBase();const d=$("#debug");if(d&&!d.classList.contains("hidden")){d.textContent=d.textContent.replace(/^v0\.\d+/m,"v0.25");d.textContent+=`\ngamesFolder=${(window.DorukStationGameManifest||[]).length} storagePersistent=${window.__dorukstationStoragePersistent!==false}`}};

/* ========================================================================== */
/* v0.26 — UI Modes: Classic default + Modern DorukStation style Modern                   */
/* ========================================================================== */
const V26_LAST_UI_MODE_KEY="ds-ui-mode-v26";
S.uiMode="classic";
function v26UiMode(){return S.uiMode==="modern"?"modern":"classic"}
function v26UiModeLabel(){return v26UiMode()==="modern"?"Modern":"Classic"}
function v26ApplyUiModeClass(){
 const modern=v26UiMode()==="modern";
 document.body.classList.toggle("ui-modern",modern);
 document.body.classList.toggle("ui-classic",!modern);
}
function v26SetUiMode(mode,{syncSound=true,preview=true}={}){
 S.uiMode=mode==="modern"?"modern":"classic";
 try{if(currentProfile)pSet("uiMode",S.uiMode);if(currentProfile&&!currentProfile.guest)localStorage.setItem(V26_LAST_UI_MODE_KEY,S.uiMode)}catch{}
 if(syncSound&&typeof v22SetSoundTheme==="function")v22SetSoundTheme(S.uiMode);
 v26ApplyUiModeClass();applyTheme();render();
 if(preview){try{popupOpenSound?.()}catch{}}
}

const v26LoadProfileStateBase=loadProfileState;
loadProfileState=function(profile){
 const out=v26LoadProfileStateBase(profile);
 let mode="classic";
 try{mode=pGet("uiMode",localStorage.getItem(V26_LAST_UI_MODE_KEY)||"classic")}catch{}
 S.uiMode=mode==="modern"?"modern":"classic";
 v26ApplyUiModeClass();
 return out;
};

const v26ApplyThemeBase=applyTheme;
applyTheme=function(){
 const out=v26ApplyThemeBase();
 v26ApplyUiModeClass();
 return out;
};
v26ApplyUiModeClass();

function renderUiModeCards(body){
 body.innerHTML=`<div class="ui-mode-preview">
  <div class="ui-mode-card classic ${S.pageIndex===0?"focused":""}" data-i="0">${v26UiMode()==="classic"?'<span class="mode-active">ACTIVE</span>':""}<div class="mode-name">Classic</div><div class="mode-note">DorukStation's original Classic Flow interface. Selecting it also switches to Classic system sounds.</div></div>
  <div class="ui-mode-card modern ${S.pageIndex===1?"focused":""}" data-i="1">${v26UiMode()==="modern"?'<span class="mode-active">ACTIVE</span>':""}<div class="mode-name">Modern</div><div class="mode-note">Modern DorukStation dark-glass interface with a larger game row, smooth cards and animated glitter background. Selecting it also switches to Modern sounds.</div></div>
 </div>`;
 $$(".ui-mode-card").forEach(el=>el.onclick=()=>{S.pageIndex=Number(el.dataset.i);activatePage()});
}
function openUiModePage(){
 openPage({title:"UI Mode",subtitle:"Choose the DorukStation interface generation. UI Mode is saved separately for each user.",icon:"assets/skin/flow/function/setting.png",mode:"grid",cols:2,items:[
  {title:"Classic",note:v26UiMode()==="classic"?"Active":"Classic DorukStation style",action:()=>{v26SetUiMode("classic");renderPage()}},
  {title:"Modern",note:v26UiMode()==="modern"?"Active":"Modern DorukStation style",action:()=>{v26SetUiMode("modern");renderPage()}}
 ],renderCustom:renderUiModeCards},true);
}

/* Add UI Mode to the top-level PS4/Modern Settings list without replacing the
   existing page implementation or controller logic. */
const v26OpenSettingsPageBase=openSettingsPage;
openSettingsPage=function(){
 v26OpenSettingsPageBase();
 if(!S.pageOpen||$("#pageTitle")?.textContent!=="Settings")return;
 if(!S.pageItems.some(x=>x.title==="UI Mode")){
  const themeIndex=S.pageItems.findIndex(x=>x.title==="Themes");
  const at=themeIndex>=0?themeIndex:Math.max(0,S.pageItems.length-3);
  S.pageItems.splice(at,0,{title:"UI Mode",icon:"◈",note:v26UiModeLabel(),action:openUiModePage});
 }
 renderPage();
};

/* Themes owns both visual-generation mode and visual backgrounds. */
openThemeRootPage=function(){
 openPage({title:"Themes",subtitle:`${v26UiModeLabel()} UI · visual backgrounds and system audio are saved per user.`,icon:"assets/skin/flow/function/setting.png",items:[
  {title:"UI Mode",note:v26UiModeLabel(),action:openUiModePage},
  {title:"Flow Colors",note:S.theme.kind==="flow"?themeLabel():"8 colors",action:openFlowThemePage},
  {title:"Game Themes",note:S.theme.kind==="photo"?themeLabel():`${PHOTO_THEMES.length} built in`,action:openPhotoThemePage},
  {title:"System Sound Theme",note:v22SoundThemeLabel(),action:openSoundThemePage},
  {title:"Boot Audio",note:v22BootAudioLabel(),action:openBootAudioPage},
  {title:"Custom Background",note:"Choose image",action:()=>$("#backgroundPicker").click()}
 ]},true);
};

/* Sound-theme page remains independently editable. Changing UI mode simply
   chooses the matching sound pack once; users can override it here afterward. */
const v26OpenSoundThemePageBase=openSoundThemePage;
openSoundThemePage=function(){return v26OpenSoundThemePageBase()};

/* Modern Home detail gets a subtle UI-mode marker without duplicating labels. */
const v26RenderHomeBase=renderHome;
renderHome=function(){
 const out=v26RenderHomeBase();
 if(v26UiMode()==="modern"){
  const a=apps[S.app]||apps[0];
  if(a&&$("#appDescription")&&!$("#appDescription").dataset.v26Base)$("#appDescription").dataset.v26Base="1";
 }
 return out;
};

/* Keep current page selection notes live after switching modes. */
const v26RenderPageBase=renderPage;
renderPage=function(){
 const out=v26RenderPageBase();
 if($("#pageTitle")?.textContent==="Settings"){
  const item=S.pageItems.find(x=>x.title==="UI Mode");if(item)item.note=v26UiModeLabel();
 }
 return out;
};

/* Accurate version in debug. */
const v26UpdateDebugBase=updateDebug;
updateDebug=function(){v26UpdateDebugBase();const d=$("#debug");if(d&&!d.classList.contains("hidden")){d.textContent=d.textContent.replace(/^v0\.\d+/m,"v0.27");d.textContent+=`\nuiMode=${v26UiMode()} soundTheme=${typeof v22SoundTheme==="function"?v22SoundTheme():"unknown"}`}};


/* ==========================================================================
   v0.28 — DorukStation branding + ALL-bank semantic system sounds
   ========================================================================== */
const V28_EVENT_SOUND_FILES={
 classic:{
  quickMenuOpen:"classic/ALL/81. Src5 Se Boot Miniapp.mp3",quickMenuClose:"classic/ALL/82. Src6 Se Boot Miniapp.mp3",
  optionOpen:"classic/ALL/52. Src16 Se Enter Menu.mp3",optionClose:"classic/ALL/56. Src2 Se Back Menu.mp3",
  dialogOpen:"classic/ALL/50. Src14 Se Dlg Show Posi.mp3",dialogYes:"classic/ALL/51. Src15 Se Dlg Yes.mp3",dialogNo:"classic/ALL/48. Src12 Se Dlg No.mp3",
  keyboardOpen:"classic/ALL/50. Src14 Se Dlg Show Posi.mp3",keyboardClose:"classic/ALL/56. Src2 Se Back Menu.mp3",keyboardMove:"classic/ALL/66. Src29 Se Osk Cursor Mo.mp3",
  keyboardKey:"classic/ALL/68. Src30 Se Osk Key Press.mp3",keyboardBackspace:"classic/ALL/65. Src28 Se Osk Backspace.mp3",
  appExit:"classic/ALL/78. Src4 Se Boot Game Qui.mp3",appClose:"classic/ALL/78. Src4 Se Boot Game Qui.mp3",
  login:"classic/ALL/57. Src20 Se Log Login.mp3",logout:"classic/ALL/58. Src21 Se Log Logout.mp3",
  shareOpen:"classic/ALL/54. Src18 Se Live Gallery.mp3",shareClose:"classic/ALL/56. Src2 Se Back Menu.mp3",
  screenshot:"classic/ALL/75. Src37 Camera C Edit3.mp3",changePanel:"classic/ALL/76. Src38 Se Std Option1.mp3",cancel:"classic/ALL/46. Src10 Cancel Refine D.mp3"
 },
 modern:{
  quickMenuOpen:"modern/ALL/25. Open Control Center Psfx Open Contro.mp3",quickMenuClose:"modern/ALL/09. Close Control Center Psfx Close Contr.mp3",
  optionOpen:"modern/ALL/29. Open Option Menu Psfx Open Option.mp3",optionClose:"modern/ALL/10. Close Option Menu Psfx Close Optio.mp3",
  dialogOpen:"modern/ALL/26. Open Dialog Psfx Open Dialog.mp3",dialogYes:"modern/ALL/45. Yes in Dialog Psfx Yes in Dial.mp3",dialogNo:"modern/ALL/24. No in Dialog Psfx No in Dialo.mp3",
  keyboardOpen:"modern/ALL/30. Open Osk Psfx Open Osk.mp3",keyboardClose:"modern/ALL/05. Cancel Psfx Cancel.mp3",keyboardMove:"modern/ALL/16. Focus Move in Keyboard Psfx Focus Move.mp3",
  keyboardKey:"modern/ALL/38. Text Input Psfx Text Input.mp3",keyboardBackspace:"modern/ALL/04. Backspace Psfx Backspace.mp3",
  appExit:"modern/ALL/28. Open Home Psfx Open Home.mp3",appClose:"modern/ALL/22. Log Out Psfx Log Out.mp3",
  login:"modern/ALL/28. Open Home Psfx Open Home.mp3",logout:"modern/ALL/22. Log Out Psfx Log Out.mp3",
  shareOpen:"modern/ALL/07. Change Panel2 Psfx Change Pane.mp3",shareClose:"modern/ALL/05. Cancel Psfx Cancel.mp3",
  screenshot:"modern/ALL/37. Take Screenshot Psfx Take Screen.mp3",changePanel:"modern/ALL/06. Change Panel Psfx Change Pane.mp3",cancel:"modern/ALL/05. Cancel Psfx Cancel.mp3"
 }
};
function v28PlayEvent(kind,volume=.96){const theme=v22SoundTheme(),path=V28_EVENT_SOUND_FILES[theme]?.[kind]||V22_SOUND_FILES[theme]?.[kind];return v22PlayPath(path,volume)}
keyboardKeySound=()=>v28PlayEvent("keyboardKey",.95);
keyboardBackspaceSound=()=>v28PlayEvent("keyboardBackspace",.95);

/* Make the debug marker reflect this build. */
const v28UpdateDebugBase=updateDebug;
updateDebug=function(){v28UpdateDebugBase();const d=$("#debug");if(d&&!d.classList.contains("hidden"))d.textContent=d.textContent.replace(/^v0\.\d+/m,"v0.28")};

/* v0.28 semantic login/logout cues from the ALL banks. */
const v28FinishUserLoginBase=finishUserLogin;
finishUserLogin=function(...args){v28PlayEvent("login",.96);return v28FinishUserLoginBase(...args)};
const v28LogoutActiveUserBase=logoutActiveUser;
logoutActiveUser=function(...args){v28PlayEvent("logout",.96);return v28LogoutActiveUserBase(...args)};


/* ========================================================================== */
/* v0.29 — strict controller ownership + reliable app gamepad routing         */
/* ========================================================================== */
const V29_VERSION="v0.30";
const v29KnownPads=new Map();               // index -> last live Gamepad object
const v29PickerDismissed=new Map();          // index -> wait-until-neutral flag
const v29LastPromptAt=new Map();             // debounce repeated user-picker requests

function v29Buttons(gp){return Array.from(gp?.buttons||[],x=>!!x&&(x.pressed||Number(x.value||0)>.45))}
function v29PadNeutral(gp){
 if(!gp)return true;
 if(v29Buttons(gp).some(Boolean))return false;
 return Array.from(gp.axes||[]).every(v=>Math.abs(Number(v)||0)<.34);
}
function v29HasIntent(gp,r){
 const b=v29Buttons(gp),last=r?.last||[];
 if(b.some((v,i)=>v&&!last[i]))return true;
 return Array.from(gp.axes||[]).some(v=>Math.abs(Number(v)||0)>.62);
}
function v29RemovePending(index){for(let i=pendingControllerLogins.length-1;i>=0;i--)if(pendingControllerLogins[i]===index)pendingControllerLogins.splice(i,1)}
function v29Prime(index){try{v18PrimeController(index)}catch{};const gp=v29KnownPads.get(index)||[...(navigator.getGamepads?.()||[])].find(g=>g&&g.index===index);if(gp){const r=controllerRuntime(gp);r.last=v29Buttons(gp);r.repeatDir="";r.repeatNext=0;r.axisLatch=false}}
function v29RequestUser(index,{force=false}={}){
 if(!Number.isInteger(index)||controllerAssignments.has(index))return;
 const gp=v29KnownPads.get(index)||[...(navigator.getGamepads?.()||[])].find(g=>g&&g.index===index);if(!gp)return;
 if(v29PickerDismissed.get(index)&&!v29PadNeutral(gp))return;
 if(v29PickerDismissed.get(index)&&v29PadNeutral(gp))v29PickerDismissed.delete(index);
 const now=performance.now(),last=v29LastPromptAt.get(index)||0;if(!force&&now-last<180)return;v29LastPromptAt.set(index,now);
 if(S.userSelectOpen&&selectingControllerIndex===index)return;
 beginControllerLogin(index);
}
function v29IdleAfterPickerCancel(){
 if(currentProfile){setUserFlowVisual(false);render();return}
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean),gate=$("#controllerGate"),title=gate?.querySelector("h1"),btn=$("#playWithoutController");
 if(title)title.textContent=pads.length?"Press any controller button to choose a user":"Connect a controller to begin";
 if(btn)btn.classList.toggle("hidden",pads.length>0);
 if(gate){showUi(gate,"back");setUserFlowVisual(true)}
}
function v29CancelUserPicker(){
 if(!S.userSelectOpen||!Number.isInteger(selectingControllerIndex))return false;
 const index=selectingControllerIndex;v29RemovePending(index);v29PickerDismissed.set(index,true);v29Prime(index);
 selectingControllerIndex=null;S.userSelectOpen=false;hideUi("#userSelect","back");backSound();
 setTimeout(()=>{v29IdleAfterPickerCancel();beginNextControllerLogin()},UI_EXIT_MS+30);return true;
}

/* One profile is authoritative for exactly one controller. Never expose an
   unassigned pad just because it is the only physical controller connected. */
window.__dorukstationAllowedGamepadIndices=()=>{
 const e=getRunningEntry();if(!e?.profileId)return [];
 const index=profileAssignments.get(e.profileId);
 if(!Number.isInteger(index)||controllerAssignments.get(index)!==e.profileId)return [];
 const live=[...(navigator.getGamepads?.()||[])].find(g=>g&&g.index===index);return live?[index]:[];
};

/* iframe navigator.getGamepads() now reads the shell's live Gamepad API rather
   than the iframe-local API. This avoids games intermittently seeing no pad
   when the controller existed before the iframe or Chrome missed iframe state. */
const v29InstallPauseBase=installInputPauseShim;
installInputPauseShim=function(e){
 v29InstallPauseBase(e);
 try{
  const w=e.iframe.contentWindow;if(!w)return;
  Object.defineProperty(w.navigator,"getGamepads",{configurable:true,value:()=>{
   if(w.__dorukstationSuspended||w.__dorukstationInputBlocked||w.__dorukstationGamepadBlocked)return [];
   const allowed=parent.__dorukstationAllowedGamepadIndices?.()||[];
   let all=[];try{all=Array.from(parent.navigator.getGamepads?.()||[])}catch{try{all=Array.from(navigator.getGamepads?.()||[])}catch{}}
   return all.filter(g=>g&&allowed.includes(g.index));
  }});
  w.__dorukstationV29ParentPadRoute=true;
 }catch{}
};
function v29DispatchPadEvent(kind,profileId){
 const e=getRunningEntry();if(!e||e.profileId!==profileId||e.suspended)return;
 const index=profileAssignments.get(profileId),gp=[...(navigator.getGamepads?.()||[])].find(g=>g&&g.index===index);if(!gp)return;
 try{const w=e.iframe.contentWindow,ev=new w.GamepadEvent(kind,{gamepad:gp});w.dispatchEvent(ev)}catch{}
}
const v29TransferBase=transferProfileToController;
transferProfileToController=function(profile,index){
 v29TransferBase(profile,index);v29RemovePending(index);v29PickerDismissed.delete(index);v29Prime(index);setTimeout(()=>v29DispatchPadEvent("gamepadconnected",profile?.id),0);
};

/* Robust connect handling: use events when available, but the frame loop below
   also detects pads that appear without a gamepadconnected event. */
const v29ConnectBase=v18GamepadConnected;
v18GamepadConnected=function(e){
 const gp=e?.gamepad;if(!gp)return;v29KnownPads.set(gp.index,gp);controllerRuntime(gp);v29Prime(gp.index);
 if(!v19Ready)return;
 const restored=v18ClaimReconnect(gp);if(restored){v19HideControllerGate();v29PickerDismissed.delete(gp.index);setTimeout(()=>v29DispatchPadEvent("gamepadconnected",restored.id),0);return}
 if(controllerAssignments.has(gp.index))return;
 v19HideControllerGate();pushSystemNotification("",`${controllerLabel(gp.index)} connected`,"Pick a user for this controller.",currentProfile);v29RequestUser(gp.index,{force:true});
};
const v29DisconnectBase=v18GamepadDisconnected;
v18GamepadDisconnected=function(e){
 const gp=e?.gamepad;if(!gp)return;const id=controllerAssignments.get(gp.index);if(id)v29DispatchPadEvent("gamepaddisconnected",id);
 v29KnownPads.delete(gp.index);v29PickerDismissed.delete(gp.index);v29LastPromptAt.delete(gp.index);v29RemovePending(gp.index);
 if(selectingControllerIndex===gp.index){selectingControllerIndex=null;S.userSelectOpen=false;hideUi("#userSelect","back")}
 v29DisconnectBase(e);
};

/* Replace the v0.24 scheduler frame with strict assignment-aware routing. The
   scheduler itself stays unchanged, so there is still only one controller RAF. */
v24ControllerFrame=function(now){
 const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean).sort((a,b)=>a.index-b.index);
 const liveIndices=new Set(pads.map(g=>g.index));
 // Poll discovery in addition to gamepadconnected; some browser/controller pairs
 // do not consistently fire the event until after a button is pressed.
 for(const gp of pads){
  const first=!v29KnownPads.has(gp.index);v29KnownPads.set(gp.index,gp);controllerRuntime(gp);
  if(first){v29Prime(gp.index);if(v19Ready){const restored=v18ClaimReconnect(gp);if(restored){v19HideControllerGate();setTimeout(()=>v29DispatchPadEvent("gamepadconnected",restored.id),0)}else if(!controllerAssignments.has(gp.index)){v19HideControllerGate();v29RequestUser(gp.index,{force:true})}}}
 }
 // Poll disconnect fallback.
 for(const [index,lastGp] of [...v29KnownPads])if(!liveIndices.has(index)){v29KnownPads.delete(index);try{v18GamepadDisconnected({gamepad:lastGp})}catch{}}

 // Only assigned pads get PS/Home system behavior. Unassigned pads can only ask
 // to choose a user; they cannot navigate Home or reach a running app.
 for(const gp of pads)if(controllerAssignments.has(gp.index)){const r=controllerRuntime(gp);v18ProcessPs(gp,r,now)}

 const selectedIndex=Number.isInteger(selectingControllerIndex)?selectingControllerIndex:activeControllerIndex;
 const flowGp=Number.isInteger(selectedIndex)?pads.find(g=>g.index===selectedIndex):null;

 if(S.digitalKeyboardOpen){
  const gp=Number.isInteger(v18KeyboardControllerIndex)?pads.find(g=>g.index===v18KeyboardControllerIndex):flowGp;
  if(gp&&controllerAssignments.has(gp.index)){const r=controllerRuntime(gp),b=v29Buttons(gp),edge=i=>!!b[i]&&!r.last[i];v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,v18KeyboardMove));if(edge(0))v18KeyboardActivate();if(edge(1)){backSound();closeDigitalKeyboard(false)}if(edge(2))v18KeyboardBackspace();if(edge(3))v18KeyboardTogglePage();if(edge(6))v19KeyboardL2();if(edge(7))v19KeyboardEnter();r.last=b}
  updateSessionStatus();return;
 }

 if(S.avatarPickerOpen){
  if(flowGp){const r=controllerRuntime(flowGp),b=v29Buttons(flowGp),edge=i=>!!b[i]&&!r.last[i];v19Repeat(r,v19Direction(flowGp),now,d=>v19MoveFromDir(d,moveAvatar));if(edge(0)){if(avatarFocusArea==="categories"){avatarFocusArea="grid";selectSound();renderAvatarPicker()}else chooseAvatar()}if(edge(1))closeAvatarPicker();r.last=b}updateSessionStatus();return;
 }

 if(S.userSelectOpen&&flowGp){
  const r=controllerRuntime(flowGp),b=v29Buttons(flowGp),edge=i=>!!b[i]&&!r.last[i],dir=v19Direction(flowGp);
  v19Repeat(r,dir,now,d=>{if(d==="L")moveUserSelection(-1);else if(d==="R")moveUserSelection(1)});
  if(edge(0))activateUserSelection();
  if(edge(1)){r.last=b;v29CancelUserPicker();updateSessionStatus();return}
  r.last=b;updateSessionStatus();return;
 }
 if((S.createChoiceOpen||S.createUserOpen)&&flowGp){
  const r=controllerRuntime(flowGp),b=v29Buttons(flowGp),edge=i=>!!b[i]&&!r.last[i],dir=v19Direction(flowGp);
  if(S.createChoiceOpen)v19Repeat(r,dir,now,d=>{if(d==="U")moveCreateChoice(-1);else if(d==="D")moveCreateChoice(1)});else v19Repeat(r,dir,now,d=>{if(d==="U")moveCreateUser(-1);else if(d==="D")moveCreateUser(1)});
  if(edge(0)){if(S.createChoiceOpen)activateCreateChoice();else activateCreateUser()}if(edge(1)){if(S.createChoiceOpen)closeCreateChoice();else closeCreateUser()}r.last=b;updateSessionStatus();return;
 }
 if(S.userSelectOpen||S.createChoiceOpen||S.createUserOpen){updateSessionStatus();return}

 // Any real attempt to use an unassigned controller re-opens Pick User. Circle
 // used to dismiss the picker must first be released, preventing instant reopen.
 for(const gp of pads){
  if(controllerAssignments.has(gp.index))continue;
  const r=controllerRuntime(gp);
  if(v29PickerDismissed.get(gp.index)){if(v29PadNeutral(gp)){v29PickerDismissed.delete(gp.index);r.last=v29Buttons(gp)}else{r.last=v29Buttons(gp);continue}}
  if(v29HasIntent(gp,r))v29RequestUser(gp.index);
  r.last=v29Buttons(gp);
 }
 if(S.userSelectOpen){updateSessionStatus();return}

 const gp=Number.isInteger(activeControllerIndex)?pads.find(g=>g.index===activeControllerIndex&&controllerAssignments.has(g.index)):null;
 if(!gp){updateSessionStatus();return}
 const ownerId=controllerAssignments.get(gp.index);if(!ownerId||currentProfile?.id!==ownerId){updateSessionStatus();return}
 const r=controllerRuntime(gp),b=v29Buttons(gp),edge=i=>!!b[i]&&!r.last[i];
 if(firstEntryFullscreenArmed&&b.some((v,i)=>v&&!r.last[i]))requestEntryFullscreen();
 if(edge(8)&&!S.quickMenuOpen&&!S.userSelectOpen){openShareMenu();r.last=b;updateSessionStatus();return}
 if(S.quickMenuOpen){v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,moveQuickMenu));if(edge(0))activateQuickMenu();if(edge(1))backQuickMenu();r.last=b;updateSessionStatus();return}
 if(S.shareMenuOpen){v19Repeat(r,v19Direction(gp),now,d=>{if(d==="U")moveShareMenu(-1);else if(d==="D")moveShareMenu(1)});if(edge(0))activateShareMenu();if(edge(1))closeShareMenu();r.last=b;updateSessionStatus();return}
 if(S.appSurface||v18ShellSwitching){r.last=b;updateSessionStatus();return}
 if(S.zone==="home"&&edge(4))v19JumpHomeEnd(false);if(S.zone==="home"&&edge(5))v19JumpHomeEnd(true);v19Repeat(r,v19Direction(gp),now,d=>v19MoveFromDir(d,move));if(edge(0))activate();if(edge(1))back();if(edge(9))options();r.last=b;updateSessionStatus();
};

/* Startup pads are queued one-by-one; no implicit device account is created. */
const v29InitialBase=initialControllerLoginSequence;
initialControllerLoginSequence=function(){
 v19Ready=true;pendingControllerLogins.splice(0);selectingControllerIndex=null;const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean).sort((a,b)=>a.index-b.index);
 for(const gp of pads){v29KnownPads.set(gp.index,gp);controllerRuntime(gp);v29Prime(gp.index)}
 if(!pads.length){v19ShowControllerGate();return}
 v19HideControllerGate();S.userSelectOpen=false;hideUi("#userSelect","back");for(const gp of pads){const restored=v18ClaimReconnect(gp);if(!restored)pendingControllerLogins.push(gp.index)}beginNextControllerLogin();
};

/* Version marker. */
const v29DebugBase=updateDebug;
updateDebug=function(){v29DebugBase();const d=$("#debug");if(d&&!d.classList.contains("hidden")){d.textContent=d.textContent.replace(/^v0\.\d+/m,V29_VERSION);d.textContent+=`\nstrictControllerOwnership=on unassignedPads=${[...(navigator.getGamepads?.()||[])].filter(g=>g&&!controllerAssignments.has(g.index)).map(g=>g.index).join(",")||"none"}`}};


/* ========================================================================== */
/* DorukStation Web v0.31 — suspended-app audio lifecycle                     */
/*                                                                            */
/* A hidden iframe keeps JavaScript and HTMLMediaElement audio alive.          */
/* DorukCraft uses new Audio(...) for music, weather loops and SFX, so merely */
/* hiding its iframe lets music continue on Home. Track every media element   */
/* that plays, pause it on suspend, block new playback while suspended, and   */
/* resume the media that should still be active when the app returns.         */
/* ========================================================================== */
function v31InstallFrameAudioLifecycle(entry){
 try{
  const w=entry?.iframe?.contentWindow,d=entry?.iframe?.contentDocument;
  if(!w||!d||w.__dorukstationAudioLifecycleV31)return;
  const proto=w.HTMLMediaElement?.prototype;if(!proto?.play)return;
  w.__dorukstationAudioLifecycleV31=true;
  w.__dorukstationTrackedMediaV31=new Set();
  w.__dorukstationResumeMediaV31=new Set();
  const previousPlay=proto.play;
  proto.play=function(...args){
   try{w.__dorukstationTrackedMediaV31.add(this)}catch{}
   if(w.__dorukstationSuspended){
    try{w.__dorukstationResumeMediaV31.add(this)}catch{}
    /* Match HTMLMediaElement.play()'s Promise shape so the game does not treat
       suspension as an audio error. */
    return Promise.resolve();
   }
   return previousPlay.apply(this,args);
  };
  try{for(const m of d.querySelectorAll('audio,video'))w.__dorukstationTrackedMediaV31.add(m)}catch{}
 }catch{}
}
function v31PauseFrameAudio(entry){
 try{
  v31InstallFrameAudioLifecycle(entry);
  const w=entry?.iframe?.contentWindow,d=entry?.iframe?.contentDocument;if(!w)return;
  const tracked=w.__dorukstationTrackedMediaV31||new Set();
  const resume=w.__dorukstationResumeMediaV31||new Set();
  try{for(const m of d?.querySelectorAll?.('audio,video')||[])tracked.add(m)}catch{}
  for(const media of tracked){
   try{
    if(!media.paused&&!media.ended)resume.add(media);
    media.pause();
   }catch{}
  }
  w.__dorukstationResumeMediaV31=resume;
 }catch{}
}
function v31ResumeFrameAudio(entry){
 try{
  v31InstallFrameAudioLifecycle(entry);
  const w=entry?.iframe?.contentWindow;if(!w)return;
  const resume=w.__dorukstationResumeMediaV31||new Set();
  const pending=[...resume];resume.clear();
  /* Let DorukStation clear the suspended flag first, then continue the exact
     music/loop objects that were active before Home was opened. */
  requestAnimationFrame(()=>{
   for(const media of pending){
    try{if(!media.ended)media.play().catch(()=>{})}catch{}
   }
  });
 }catch{}
}

const v31MakeGameViewportResponsiveBase=makeGameViewportResponsive;
makeGameViewportResponsive=function(entry){
 const out=v31MakeGameViewportResponsiveBase(entry);
 v31InstallFrameAudioLifecycle(entry);
 return out;
};

const v31SetGameSuspendedBase=setGameSuspended;
setGameSuspended=function(entry,suspended){
 if(suspended)v31PauseFrameAudio(entry);
 const out=v31SetGameSuspendedBase(entry,suspended);
 if(!suspended)v31ResumeFrameAudio(entry);
 return out;
};

/* Keep debug version current. */
const v31UpdateDebugBase=updateDebug;
updateDebug=function(...args){
 const out=v31UpdateDebugBase(...args),d=document.querySelector('#debug');
 if(d&&!d.classList.contains('hidden'))d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.31');
 return out;
};


/* ========================================================================== */
/* DorukStation Web v0.33 — Modern game banner slideshow                      */
/* ========================================================================== */
const V32_BANNER_INTERVAL_MS=10000;
let v32BannerAppId=null,v32BannerIndex=0,v32BannerTimer=null,v32BannerLayer=0;
function v32BannerEls(){return [document.querySelector('#gameBannerA'),document.querySelector('#gameBannerB')]}
function v32FocusedBannerApp(){
 if(typeof v26UiMode==='function'&&v26UiMode()!=='modern')return null;
 if(S.zone!=='home'||S.pageOpen||S.appSurface||S.quickMenuOpen||S.shareMenuOpen||S.menuItems?.length)return null;
 const app=apps[S.app];return app&&Array.isArray(app.banners)&&app.banners.length?app:null;
}
function v32StopBannerTimer(){if(v32BannerTimer){clearInterval(v32BannerTimer);v32BannerTimer=null}}
function v32ShowBanner(src){
 const els=v32BannerEls();if(!els[0]||!els[1])return;
 const next=v32BannerLayer?0:1,prev=v32BannerLayer;v32BannerLayer=next;
 const n=els[next],p=els[prev];
 n.style.backgroundImage=`url("${String(src).replace(/"/g,'\\"')}")`;
 n.classList.add('active');p.classList.remove('active');
 document.body.classList.add('game-banner-active');
}
function v32HideGameBanner(){
 v32StopBannerTimer();v32BannerAppId=null;v32BannerIndex=0;
 document.body.classList.remove('game-banner-active');
 for(const el of v32BannerEls())el?.classList.remove('active');
}
function v32SyncGameBanner(force=false){
 const app=v32FocusedBannerApp();
 if(!app){v32HideGameBanner();return}
 const changed=app.id!==v32BannerAppId;
 if(changed||force){
  v32StopBannerTimer();v32BannerAppId=app.id;v32BannerIndex=0;v32ShowBanner(app.banners[0]);
  if(app.banners.length>1)v32BannerTimer=setInterval(()=>{
   const cur=v32FocusedBannerApp();if(!cur||cur.id!==v32BannerAppId){v32HideGameBanner();return}
   v32BannerIndex=(v32BannerIndex+1)%cur.banners.length;v32ShowBanner(cur.banners[v32BannerIndex]);
  },V32_BANNER_INTERVAL_MS);
 }
}
const v32RenderHomeBase=renderHome;
renderHome=function(...args){const out=v32RenderHomeBase(...args);requestAnimationFrame(()=>v32SyncGameBanner(false));return out};
const v32RenderQuickBase=renderQuick;
renderQuick=function(...args){const out=v32RenderQuickBase(...args);requestAnimationFrame(()=>v32SyncGameBanner(false));return out};
const v32ApplyThemeBase=applyTheme;
applyTheme=function(...args){const out=v32ApplyThemeBase(...args);requestAnimationFrame(()=>v32SyncGameBanner(true));return out};
document.addEventListener('visibilitychange',()=>{if(document.hidden)v32StopBannerTimer();else v32SyncGameBanner(true)});

/* Keep debug marker current. */
const v32UpdateDebugBase=updateDebug;
updateDebug=function(...args){
 const out=v32UpdateDebugBase(...args),d=document.querySelector('#debug');
 if(d&&!d.classList.contains('hidden')){d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.33');d.textContent+=`\nmodernBanner=${v32BannerAppId||'default'} slide=${v32BannerIndex}`}
 return out;
};


/* ========================================================================== */
/* DorukStation Web v0.35 — bundled Dungeons companion-audio fix              */
/*                                                                            */
/* Folder games loaded through srcdoc receive <base href=".../games/">.       */
/* DorukCraft Dungeons therefore expects its relative DungeonMusic/... URLs   */
/* under games/DungeonMusic/. v0.35 ships that companion folder with the      */
/* station package instead of bundling only the HTML payload.                 */
/* ========================================================================== */
window.__dorukstationVersion='0.35';
const v34UpdateDebugBase=updateDebug;
updateDebug=function(...args){
 const out=v34UpdateDebugBase(...args),d=document.querySelector('#debug');
 if(d&&!d.classList.contains('hidden')){
  d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.35');
  d.textContent+='\ndungeonsMusic=bundled games/DungeonMusic';
 }
 return out;
};




/* ========================================================================== */
/* v0.37 carry-forward — v0.34 Home cleanup + System Apps + real glitter      */
/* ========================================================================== */
const V37_HIDDEN_HOME_IDS=new Set(['gallery','explorer','usbmusic','disc']);
const V37_TRAILING_SYSTEM_IDS=['browser','livefromps','shareplay'];
function v37IsGameApp(a){return !!a&&(a.folderGame||a.userAdded||a.id==='dorukcraft'||a.id==='dorukcraft-dungeons'||a.action==='launch'||a.action==='remote')}
function v37InstallStoreHomeTile(){if(!apps.some(a=>a.id==='store'))apps.push({id:'store',name:'DorukStation Store',desc:'Browse games and applications.',image:'assets/skin/store.png',type:'image',action:'store',live:'Store services are not connected in this web prototype.'})}
v37InstallStoreHomeTile();for(let i=apps.length-1;i>=0;i--)if(V37_HIDDEN_HOME_IDS.has(apps[i]?.id))apps.splice(i,1);
ensureLibraryLast=function(){
 const focusId=apps[S.app]?.id||null;v37InstallStoreHomeTile();const seen=new Set(),take=id=>{const a=apps.find(x=>x.id===id&&!seen.has(x));if(a)seen.add(a);return a},ordered=[];
 for(const id of ['whatsnew','store']){const a=take(id);if(a)ordered.push(a)}
 for(const a of apps)if(!seen.has(a)&&!V37_HIDDEN_HOME_IDS.has(a.id)&&v37IsGameApp(a)){seen.add(a);ordered.push(a)}
 for(const a of apps)if(!seen.has(a)&&!V37_HIDDEN_HOME_IDS.has(a.id)&&!V37_TRAILING_SYSTEM_IDS.includes(a.id)&&a.id!=='library'){seen.add(a);ordered.push(a)}
 for(const id of V37_TRAILING_SYSTEM_IDS){const a=take(id);if(a)ordered.push(a)}const lib=take('library');if(lib)ordered.push(lib);
 apps.splice(0,apps.length,...ordered);if(focusId){const ni=apps.findIndex(a=>a.id===focusId);if(ni>=0)S.app=ni}else S.app=Math.max(0,Math.min(S.app,apps.length-1));
};
ensureLibraryLast();
function v37OpenStorePage(returnZone='home'){openPage({title:'DorukStation Store',subtitle:'Games and applications. Store services are not connected in this web prototype.',icon:'assets/skin/store.png',returnZone,mode:'grid',cols:4,items:[{title:'Featured',note:'Prototype',disabled:true},{title:'Games',note:'Prototype',disabled:true},{title:'Apps',note:'Prototype',disabled:true},{title:'Library',note:'Open your local Library',action:()=>{backPage();S.zone='home';ensureLibraryLast();S.app=apps.findIndex(a=>a.id==='library');render()}}]})}
const v37ActivateAppStoreBase=activateApp;
activateApp=function(app){if(app?.id==='store'||app?.action==='store'){selectSound();v37OpenStorePage('home');return}return v37ActivateAppStoreBase(app)};
function v37OpenSystemAppsPage(){openPage({title:'System Apps',subtitle:'Utilities that do not need permanent Home tiles.',icon:'assets/skin/flow/function/setting.png',items:[
 {title:'Capture Gallery',icon:'assets/skin/flow/content/gallery.png',action:()=>openPage({title:'Capture Gallery',subtitle:'Screenshots and recordings.',icon:'assets/skin/flow/content/gallery.png',mode:'grid',cols:3,items:[{title:'Screenshots',note:'0',disabled:true},{title:'Video Clips',note:'0',disabled:true},{title:'Recording integration',note:'Native build later',disabled:true}]},true)},
 {title:'File Explorer',icon:'assets/skin/flow/content/library.png',action:()=>openPage({title:'File Explorer',subtitle:'Browser security limits direct filesystem browsing.',icon:'assets/skin/flow/content/library.png',items:[{title:'Open Library',note:'Add or launch HTML apps',action:()=>{while(S.pageOpen)backPage();S.zone='home';ensureLibraryLast();S.app=apps.findIndex(a=>a.id==='library');render()}},{title:'Native filesystem access',note:'Planned for a native DorukStation build',disabled:true}]},true)},
 {title:'USB Music Player',icon:'assets/skin/flow/content/usbmusic.png',action:()=>openPage({title:'USB Music Player',subtitle:'Removable-media music player.',icon:'assets/skin/flow/content/usbmusic.png',items:[{title:'No USB music source connected',note:'Native removable-media scanning comes later',disabled:true}]},true)},
 {title:'Disc',icon:'assets/skin/flow/content/disc.png',action:()=>openPage({title:'Disc',subtitle:'Physical game/media support.',icon:'assets/skin/flow/content/disc.png',items:[{title:'No disc detected',note:'Disc detection belongs in the native build',disabled:true}]},true)}
]},true)}
const v37OpenSettingsSystemAppsBase=openSettingsPage;
openSettingsPage=function(){v37OpenSettingsSystemAppsBase();if(!S.pageOpen||document.querySelector('#pageTitle')?.textContent!=='Settings')return;if(!S.pageItems.some(x=>x.title==='System Apps')){const systemAt=S.pageItems.findIndex(x=>x.title==='System');S.pageItems.splice(systemAt>=0?systemAt:S.pageItems.length-1,0,{title:'System Apps',icon:'▦',note:'Gallery · Files · USB Music · Disc',action:v37OpenSystemAppsPage})}renderPage()};
function v37Seeded(i){let x=(i+1)*2654435761>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967295}
function v37InitModernGlitter(){const host=document.querySelector('#modernGlitter');if(!host||host.childElementCount)return;const frag=document.createDocumentFragment();for(let i=0;i<96;i++){const p=document.createElement('i');p.className='v34-glitter'+(i%5===0?' blue':'')+(i%13===0?' big':'');p.style.setProperty('--x',(v37Seeded(i*4)*100).toFixed(2)+'%');p.style.setProperty('--y',(v37Seeded(i*4+1)*100).toFixed(2)+'%');p.style.setProperty('--s',(1.2+v37Seeded(i*4+2)*3.6).toFixed(2)+'px');p.style.setProperty('--d',(2.4+v37Seeded(i*4+3)*5.8).toFixed(2)+'s');p.style.setProperty('--delay',(-v37Seeded(i*7+9)*7).toFixed(2)+'s');frag.appendChild(p)}host.appendChild(frag)}
v37InitModernGlitter();


/* ========================================================================== */
/* DorukStation Web v0.37 — mobile / touch virtual controller                 */
/* ========================================================================== */
window.__dorukstationVersion='0.37';

/* v0.36 carry-forward: do not delay a game's HTMLMediaElement.play() behind
   asynchronous setSinkId(). Browser user-activation is short-lived on mobile,
   and delaying play can turn a valid tap into NotAllowedError/silence. System
   UI sounds may still use DorukStation's selected sink; games use browser/OS. */
v23InstallFrameDeviceAudio=function(){return};

const V37_MOBILE_DEFAULTS={enabled:'auto',visibility:'both',opacity:.74,size:'medium',sensitivity:1,haptics:true};
const v37Pad={
 id:'DorukStation Virtual Touch Controller',index:0,connected:true,mapping:'standard',timestamp:0,
 axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))
};
const v37Pointers=new Map();
let v37HomeHoldTimer=null,v37HomeLong=false,v37ShellAxisDir='',v37ShellAxisNext=0,v37VirtualConnectedToGame=false;

function v37TouchCapable(){return !!(navigator.maxTouchPoints>0||matchMedia?.('(pointer: coarse)')?.matches||('ontouchstart' in window))}
function v37PhysicalPads(){try{return [...(navigator.getGamepads?.()||[])].filter(Boolean)}catch{return []}}
function v37MobilePrefs(){
 let p={...V37_MOBILE_DEFAULTS};
 try{if(currentProfile)p=Object.assign(p,safeJSON(pGet('mobileControls','{}'),{}))}catch{}
 p.enabled=['auto','on','off'].includes(p.enabled)?p.enabled:'auto';p.visibility=['both','home','games'].includes(p.visibility)?p.visibility:'both';
 p.opacity=Math.max(.4,Math.min(.95,Number(p.opacity)||.74));p.size=['small','medium','large'].includes(p.size)?p.size:'medium';
 p.sensitivity=Math.max(.65,Math.min(1.5,Number(p.sensitivity)||1));p.haptics=p.haptics!==false;return p;
}
function v37SaveMobilePrefs(p){if(currentProfile)pSet('mobileControls',JSON.stringify(p));v37SyncMobileControls(true)}
function v37MobileModeAllows(p){if(p.enabled==='off')return false;if(p.enabled==='on')return true;return v37TouchCapable()&&v37PhysicalPads().length===0}
function v37InGameContext(){return !!S.appSurface}
function v37VisibilityAllows(p){const g=v37InGameContext();return p.visibility==='both'||(g&&p.visibility==='games')||(!g&&p.visibility==='home')}
function v37ShouldShow(){
 const p=v37MobilePrefs();if(!v37MobileModeAllows(p)||!v37VisibilityAllows(p))return false;
 if(S.digitalKeyboardOpen)return false;
 return true;
}
function v37MobileGameActive(){return v37ShouldShow()&&v37InGameContext()&&!S.quickMenuOpen&&!S.shareMenuOpen}
function v37Haptic(ms=11){const p=v37MobilePrefs();if(p.haptics)try{navigator.vibrate?.(ms)}catch{}}
function v37ResetPad(){
 for(let i=0;i<v37Pad.buttons.length;i++){const b=v37Pad.buttons[i];b.pressed=false;b.touched=false;b.value=0}
 v37Pad.axes.fill(0);v37Pad.timestamp=performance.now();
 for(const el of document.querySelectorAll('#mobileControls .mc-active'))el.classList.remove('mc-active');
 for(const k of document.querySelectorAll('#mobileControls .mc-stick-knob'))k.style.transform='translate3d(0,0,0)';
}
function v37ButtonSet(i,on,value=on?1:0){
 const b=v37Pad.buttons[i];if(!b)return;b.pressed=!!on;b.touched=!!on;b.value=on?Math.max(0,Math.min(1,value)):0;v37Pad.timestamp=performance.now();
}
function v37ButtonView(b){return {pressed:!!b?.pressed,touched:!!b?.touched,value:Number(b?.value)||0}}
function v37MergedPad(physical){
 const p=v37MobilePrefs(),sens=p.sensitivity,axes=[0,0,0,0];
 for(let i=0;i<4;i++){const tv=(v37Pad.axes[i]||0)*sens,pv=Number(physical?.axes?.[i]||0);axes[i]=Math.max(-1,Math.min(1,Math.abs(tv)>.035?tv:pv))}
 const buttons=Array.from({length:Math.max(17,physical?.buttons?.length||0)},(_,i)=>{
  /* SHARE and PS/HOME belong to DorukStation, not the running game. */
  if(i===8||i===16)return {pressed:false,touched:false,value:0};
  const t=v37Pad.buttons[i],r=physical?.buttons?.[i],value=Math.max(Number(t?.value||0),Number(r?.value||0));
  return {pressed:!!t?.pressed||!!r?.pressed||value>.5,touched:!!t?.touched||!!r?.touched||value>0,value};
 });
 return {id:physical?.id?`${physical.id} + DorukStation Touch`:'DorukStation Virtual Touch Controller',index:0,connected:true,mapping:'standard',timestamp:performance.now(),axes,buttons,vibrationActuator:physical?.vibrationActuator||null,hapticActuators:physical?.hapticActuators||[]};
}
function v37GamePadsForEntry(entry){
 if(!entry||entry.suspended)return [];
 const owner=entry.profileId,idx=owner?profileAssignments.get(owner):null;
 const all=v37PhysicalPads(),physical=Number.isInteger(idx)?all.find(g=>g.index===idx):null;
 if(v37MobileGameActive())return [v37MergedPad(physical)];
 if(!physical)return [];
 return [physical];
}
function v37DispatchVirtualGamepad(kind){
 const e=getRunningEntry();if(!e?.iframe?.contentWindow||e.suspended)return;
 try{const w=e.iframe.contentWindow,ev=new w.Event(kind);Object.defineProperty(ev,'gamepad',{value:v37MergedPad(null)});w.dispatchEvent(ev)}catch{}
}
function v37SyncVirtualGameConnection(){
 const active=v37MobileGameActive(),e=getRunningEntry();
 if(active&&!v37VirtualConnectedToGame&&e&&!e.suspended){v37VirtualConnectedToGame=true;v37DispatchVirtualGamepad('gamepadconnected')}
 else if((!active||!e||e.suspended)&&v37VirtualConnectedToGame){v37VirtualConnectedToGame=false;v37DispatchVirtualGamepad('gamepaddisconnected')}
}
function v37SyncMobileControls(reset=false){
 const el=document.querySelector('#mobileControls');if(!el)return;const p=v37MobilePrefs(),show=v37ShouldShow();
 el.classList.toggle('hidden',!show);el.style.setProperty('--mc-opacity',String(p.opacity));
 document.body.classList.toggle('mc-size-small',p.size==='small');document.body.classList.toggle('mc-size-medium',p.size==='medium');document.body.classList.toggle('mc-size-large',p.size==='large');
 el.dataset.context=v37InGameContext()?'game':'shell';el.dataset.style=(typeof v26UiMode==='function'?v26UiMode():'classic');
 if((reset||!show)&&!show)v37ResetPad();v37SyncVirtualGameConnection();
}

/* Replace the final iframe Gamepad API route. Physical pads stay account-owned;
   touch becomes standard controller slot 0 so games that only read [0] work. */
const v37InstallInputPauseBase=installInputPauseShim;
installInputPauseShim=function(e){
 v37InstallInputPauseBase(e);
 try{
  const w=e?.iframe?.contentWindow;if(!w)return;
  Object.defineProperty(w.navigator,'getGamepads',{configurable:true,value:()=>{
   if(w.__dorukstationSuspended||w.__dorukstationInputBlocked||w.__dorukstationGamepadBlocked)return [];
   return v37GamePadsForEntry(e);
  }});
  w.__dorukstationV37TouchGamepad=true;
 }catch{}
};

function v37MoveDirection(dir){
 if(!dir)return;
 if(S.quickMenuOpen){if(dir==='U')moveQuickMenu(0,-1);else if(dir==='D')moveQuickMenu(0,1);else if(dir==='L')moveQuickMenu(-1,0);else if(dir==='R')moveQuickMenu(1,0);return}
 if(S.shareMenuOpen){if(dir==='U')moveShareMenu(-1);else if(dir==='D')moveShareMenu(1);return}
 if(S.avatarPickerOpen){if(dir==='U')moveAvatar(0,-1);else if(dir==='D')moveAvatar(0,1);else if(dir==='L')moveAvatar(-1,0);else if(dir==='R')moveAvatar(1,0);return}
 if(S.userSelectOpen){if(dir==='L')moveUserSelection(-1);else if(dir==='R')moveUserSelection(1);return}
 if(S.createChoiceOpen){if(dir==='U')moveCreateChoice(-1);else if(dir==='D')moveCreateChoice(1);return}
 if(S.createUserOpen){if(dir==='U')moveCreateUser(-1);else if(dir==='D')moveCreateUser(1);return}
 if(v37InGameContext())return;
 if(dir==='U')move(0,-1);else if(dir==='D')move(0,1);else if(dir==='L')move(-1,0);else if(dir==='R')move(1,0);
}
function v37Cross(){
 const gate=document.querySelector('#controllerGate');if(gate&&!gate.classList.contains('hidden')&&!currentProfile){document.querySelector('#playWithoutController')?.click();return}
 if(S.quickMenuOpen){activateQuickMenu();return}if(S.shareMenuOpen){activateShareMenu();return}
 if(S.avatarPickerOpen){if(avatarFocusArea==='categories'){avatarFocusArea='grid';selectSound();renderAvatarPicker()}else chooseAvatar();return}
 if(S.userSelectOpen){activateUserSelection();return}if(S.createChoiceOpen){activateCreateChoice();return}if(S.createUserOpen){activateCreateUser();return}
 if(v37InGameContext())return;activate();
}
function v37Circle(){
 if(v37InGameContext()&&!S.quickMenuOpen&&!S.shareMenuOpen)return;
 if(S.quickMenuOpen){backQuickMenu();return}if(S.shareMenuOpen){closeShareMenu();return}
 if(S.avatarPickerOpen){closeAvatarPicker();return}if(S.createChoiceOpen){closeCreateChoice();return}if(S.createUserOpen){closeCreateUser();return}
 back();
}
function v37Options(){if(v37InGameContext()&&!S.quickMenuOpen&&!S.shareMenuOpen)return;options()}
function v37Share(){if(!currentProfile)return;if(!S.shareMenuOpen)openShareMenu();else closeShareMenu()}
function v37HomeDown(){
 if(v37HomeHoldTimer)return;v37HomeLong=false;
 v37HomeHoldTimer=setTimeout(()=>{v37HomeHoldTimer=null;v37HomeLong=true;if(currentProfile)openQuickMenu()},1000);
}
function v37HomeUp(){
 if(v37HomeHoldTimer){clearTimeout(v37HomeHoldTimer);v37HomeHoldTimer=null}
 if(!v37HomeLong&&currentProfile)psShortPress();v37HomeLong=false;
}
function v37L1R1(i){if(v37InGameContext())return;if(S.zone==='home'){if(i===4)v19JumpHomeEnd(false);if(i===5)v19JumpHomeEnd(true)}}

function v37ButtonShellDown(i,el){
 el?.classList.add('mc-active');v37Haptic();
 if(i>=12&&i<=15){v37MoveDirection({12:'U',13:'D',14:'L',15:'R'}[i]);return}
 if(i===0)v37Cross();else if(i===1)v37Circle();else if(i===4||i===5)v37L1R1(i);
}
function v37ButtonShellUp(i,el){el?.classList.remove('mc-active')}
function v37BindButton(el){
 const i=Number(el.dataset.mcButton),system=el.dataset.mcSystem||'';
 el.addEventListener('contextmenu',ev=>ev.preventDefault());
 el.addEventListener('pointerdown',ev=>{
  ev.preventDefault();ev.stopPropagation();try{el.setPointerCapture(ev.pointerId)}catch{};v37Pointers.set(ev.pointerId,{type:'button',i,el,system});
  if(Number.isInteger(i))v37ButtonSet(i,true);
  if(system==='home'){v37HomeDown();el.classList.add('mc-active');v37Haptic();return}
  if(system==='share'){v37Share();el.classList.add('mc-active');v37Haptic();return}
  if(system==='options'&&!v37InGameContext()){v37Options();el.classList.add('mc-active');v37Haptic();return}
  if(!v37InGameContext()||S.quickMenuOpen||S.shareMenuOpen)v37ButtonShellDown(i,el);else{el.classList.add('mc-active');v37Haptic()}
 });
 const end=ev=>{
  const p=v37Pointers.get(ev.pointerId);if(!p||p.el!==el)return;ev.preventDefault();ev.stopPropagation();v37Pointers.delete(ev.pointerId);
  if(Number.isInteger(i))v37ButtonSet(i,false);
  if(system==='home')v37HomeUp();v37ButtonShellUp(i,el);
 };
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
}
function v37StickUpdate(el,ev,side){
 const rect=el.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,dx=ev.clientX-cx,dy=ev.clientY-cy,r=Math.max(24,rect.width*.33),mag=Math.hypot(dx,dy),k=mag>r?r/mag:1,x=dx*k/r,y=dy*k/r;
 const dead=.08,ax=Math.abs(x)<dead?0:x,ay=Math.abs(y)<dead?0:y,base=side==='left'?0:2;v37Pad.axes[base]=Math.max(-1,Math.min(1,ax));v37Pad.axes[base+1]=Math.max(-1,Math.min(1,ay));v37Pad.timestamp=performance.now();
 const knob=el.querySelector('.mc-stick-knob'),px=(dx*k)*.62,py=(dy*k)*.62;if(knob)knob.style.transform=`translate3d(${px}px,${py}px,0)`;
}
function v37BindStick(el){
 const side=el.dataset.mcStick;el.addEventListener('contextmenu',ev=>ev.preventDefault());
 el.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();try{el.setPointerCapture(ev.pointerId)}catch{};v37Pointers.set(ev.pointerId,{type:'stick',side,el});v37StickUpdate(el,ev,side);v37Haptic(8)});
 el.addEventListener('pointermove',ev=>{const p=v37Pointers.get(ev.pointerId);if(p?.el===el)v37StickUpdate(el,ev,side)});
 const end=ev=>{const p=v37Pointers.get(ev.pointerId);if(p?.el!==el)return;ev.preventDefault();v37Pointers.delete(ev.pointerId);const base=side==='left'?0:2;v37Pad.axes[base]=0;v37Pad.axes[base+1]=0;v37Pad.timestamp=performance.now();const knob=el.querySelector('.mc-stick-knob');if(knob)knob.style.transform='translate3d(0,0,0)'};
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
}
function v37ShellStickFrame(now){
 if(v37InGameContext()&&!S.quickMenuOpen&&!S.shareMenuOpen){v37ShellAxisDir='';return}
 const x=v37Pad.axes[0],y=v37Pad.axes[1],threshold=.57;let dir='';
 if(Math.abs(x)>Math.abs(y)&&Math.abs(x)>threshold)dir=x<0?'L':'R';else if(Math.abs(y)>threshold)dir=y<0?'U':'D';
 if(!dir){v37ShellAxisDir='';v37ShellAxisNext=0;return}
 if(dir!==v37ShellAxisDir||now>=v37ShellAxisNext){v37MoveDirection(dir);v37ShellAxisDir=dir;v37ShellAxisNext=now+(dir===v37ShellAxisDir?150:260)}
}
function v37MobileFrame(now){v37ShellStickFrame(now);requestAnimationFrame(v37MobileFrame)}

function v37MobileSettingItems(){
 const p=v37MobilePrefs(),enabledLabel={auto:'Auto',on:'On',off:'Off'}[p.enabled],visLabel={both:'Home + Games',home:'Home only',games:'Games only'}[p.visibility];
 return [
  {title:'Touch Controls',note:enabledLabel,action:()=>{p.enabled=p.enabled==='auto'?'on':p.enabled==='on'?'off':'auto';v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Show Controls',note:visLabel,action:()=>{p.visibility=p.visibility==='both'?'home':p.visibility==='home'?'games':'both';v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Style',note:`Follows ${typeof v26UiMode==='function'?v26UiModeLabel():'Classic'} UI`,disabled:true},
  {title:'Button Size',note:p.size[0].toUpperCase()+p.size.slice(1),action:()=>{p.size=p.size==='small'?'medium':p.size==='medium'?'large':'small';v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Opacity',note:`${Math.round(p.opacity*100)}%`,action:()=>{p.opacity=p.opacity<.6?.74:p.opacity<.82?.9:.52;v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Stick Sensitivity',note:`${p.sensitivity.toFixed(2)}×`,action:()=>{p.sensitivity=p.sensitivity<.9?1:p.sensitivity<1.15?1.25:.8;v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Touch Vibration',note:p.haptics?'On':'Off',action:()=>{p.haptics=!p.haptics;v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Controller Behavior',note:'Auto hides touch controls when a real controller is connected',disabled:true},
  {title:'Game Compatibility',note:'Exposed as a standard Gamepad in slot 0',disabled:true}
 ];
}
function v37RefreshMobileSettings(){if($('#pageTitle')?.textContent!=='Mobile Controls')return;S.pageItems=v37MobileSettingItems();S.pageIndex=Math.min(S.pageIndex,S.pageItems.length-1);renderPage()}
function openMobileControlsPage(){openPage({title:'Mobile Controls',subtitle:'Touch controller for DorukStation and HTML games. Classic/Modern style follows UI Mode.',icon:'assets/skin/flow/function/setting.png',items:v37MobileSettingItems()},true)}

const v37OpenSettingsBase=openSettingsPage;
openSettingsPage=function(){
 v37OpenSettingsBase();if(!S.pageOpen||$('#pageTitle')?.textContent!=='Settings')return;
 if(!S.pageItems.some(x=>x.title==='Mobile Controls')){const ui=S.pageItems.findIndex(x=>x.title==='UI Mode'),at=ui>=0?ui+1:Math.max(0,S.pageItems.findIndex(x=>x.title==='Themes'));S.pageItems.splice(at,0,{title:'Mobile Controls',icon:'◎',note:v37MobilePrefs().enabled==='off'?'Off':'Touch controller',action:openMobileControlsPage})}
 renderPage();
};

const v37LoadProfileBase=loadProfileState;
loadProfileState=function(profile){const out=v37LoadProfileBase(profile);setTimeout(()=>v37SyncMobileControls(true),0);return out};
const v37RenderBase=render;
render=function(...args){const out=v37RenderBase(...args);requestAnimationFrame(()=>v37SyncMobileControls(false));return out};
const v37ResumeBase=resumeApp;
resumeApp=function(id){const out=v37ResumeBase(id);requestAnimationFrame(()=>v37SyncMobileControls(true));return out};
const v37SuspendBase=suspendToHome;
suspendToHome=function(...args){const out=v37SuspendBase(...args);requestAnimationFrame(()=>v37SyncMobileControls(true));return out};
const v37SetGameSuspendedBase=setGameSuspended;
setGameSuspended=function(e,suspended){const out=v37SetGameSuspendedBase(e,suspended);requestAnimationFrame(()=>v37SyncMobileControls(!!suspended));return out};
const v37ApplyThemeBase=applyTheme;
applyTheme=function(...args){const out=v37ApplyThemeBase(...args);requestAnimationFrame(()=>v37SyncMobileControls(false));return out};

window.addEventListener('gamepadconnected',()=>v37SyncMobileControls(true));window.addEventListener('gamepaddisconnected',()=>setTimeout(()=>v37SyncMobileControls(true),80));
window.addEventListener('resize',()=>v37SyncMobileControls(false));window.addEventListener('orientationchange',()=>setTimeout(()=>v37SyncMobileControls(false),100));
document.addEventListener('visibilitychange',()=>{if(document.hidden)v37ResetPad()});
for(const el of document.querySelectorAll('#mobileControls [data-mc-button],#mobileControls [data-mc-system]'))v37BindButton(el);
for(const el of document.querySelectorAll('#mobileControls [data-mc-stick]'))v37BindStick(el);
requestAnimationFrame(v37MobileFrame);setInterval(()=>v37SyncMobileControls(false),350);v37SyncMobileControls(true);

/* Debug marker. */
const v37UpdateDebugBase=updateDebug;
updateDebug=function(...args){const out=v37UpdateDebugBase(...args),d=document.querySelector('#debug');if(d&&!d.classList.contains('hidden')){const p=v37MobilePrefs();d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.37');d.textContent+=`\nmobile=${p.enabled}/${p.visibility} visible=${v37ShouldShow()?'yes':'no'} virtualGamepad=${v37MobileGameActive()?'on':'off'}`}return out};


/* ========================================================================== */
/* DorukStation Web v0.38 — persistent Input Mode detection                   */
/* ========================================================================== */
window.__dorukstationVersion='0.38';

const V38_INPUT_MODE_KEY='ds-v38-input-mode';
const V38_INPUT_MODES=new Set(['mobile','pc','controller']);
let v38DetectedMode=(()=>{try{const m=localStorage.getItem(V38_INPUT_MODE_KEY)||'';return V38_INPUT_MODES.has(m)?m:''}catch{return ''}})();
const v38GatePadState=new Map();

function v38InputMode(){return V38_INPUT_MODES.has(v38DetectedMode)?v38DetectedMode:''}
function v38InputModeLabel(m=v38InputMode()){return m==='mobile'?'Mobile Touch':m==='controller'?'Controller':m==='pc'?'PC Keyboard & Mouse':'Detecting'}
function v38SetInputMode(mode,{persist=true,announce=false}={}){
 if(!V38_INPUT_MODES.has(mode))return false;
 const changed=v38DetectedMode!==mode;v38DetectedMode=mode;
 if(persist)try{localStorage.setItem(V38_INPUT_MODE_KEY,mode)}catch{}
 if(mode!=='mobile')v37ResetPad();
 v37SyncMobileControls(true);v38UpdateGateCopy();
 try{updateSessionStatus(true)}catch{}
 if(announce&&changed&&currentProfile)try{pushSystemNotification('',`Input Mode: ${v38InputModeLabel(mode)}`,'Change it any time in Settings → Input Mode.',currentProfile)}catch{}
 return true;
}
function v38GateVisible(){const g=document.querySelector('#controllerGate');return !!g&&!g.classList.contains('hidden')&&!currentProfile}
function v38UpdateGateCopy(){
 const gate=document.querySelector('#controllerGate');if(!gate)return;gate.classList.add('v38-input-detect');
 const title=gate.querySelector('h1'),hint=document.querySelector('#inputDetectHint'),status=document.querySelector('#inputModeGateStatus'),mode=v38InputMode();
 if(title)title.textContent='Press any button or click/tap anywhere';
 if(hint)hint.textContent=mode?`Current Input Mode: ${v38InputModeLabel(mode)}`:'Touch → Mobile · Keyboard / Mouse → PC · Controller → Controller';
 if(status)status.textContent=mode?`Input Mode is locked to ${v38InputModeLabel(mode)} until you change it in Settings.`:'DorukStation will remember the detected Input Mode until you change it in Settings.';
 const old=document.querySelector('#playWithoutController');if(old){old.classList.add('hidden');old.setAttribute('aria-hidden','true')}
}

/* Mobile overlay is now controlled ONLY by explicit Mobile Input Mode. Merely
   having a touchscreen, coarse pointer or maxTouchPoints no longer enables it. */
v37MobileModeAllows=function(){return v38InputMode()==='mobile'};

/* Games receive exactly the selected input class: virtual pad in Mobile mode,
   the assigned physical pad in Controller mode, and no Gamepad in PC mode. */
v37GamePadsForEntry=function(entry){
 if(!entry||entry.suspended)return [];
 const mode=v38InputMode();
 if(mode==='mobile')return v37MobileGameActive()?[v37MergedPad(null)]:[];
 if(mode!=='controller')return [];
 const owner=entry.profileId,idx=owner?profileAssignments.get(owner):null,physical=Number.isInteger(idx)?v37PhysicalPads().find(g=>g.index===idx):null;
 return physical?[physical]:[];
};

/* Unassigned controllers may only start the user picker while Controller mode
   is active. This stops a controller from stealing a Mobile/PC session. */
const v38RequestUserBase=v29RequestUser;
v29RequestUser=function(index,opt={}){if(v38InputMode()!=='controller')return;return v38RequestUserBase(index,opt)};

function v38StartNonController(mode){
 if(!v38GateVisible())return;
 if(!v38InputMode())v38SetInputMode(mode,{persist:true});
 /* A stored mode stays authoritative until Settings changes it. */
 v19DebugWithoutController=true;v19HideControllerGate();requestEntryFullscreen?.();showUserSelector(null);v37SyncMobileControls(true);
}
function v38StartController(gp){
 if(!gp||!v38GateVisible())return;
 if(!v38InputMode())v38SetInputMode('controller',{persist:true});
 if(v38InputMode()!=='controller')return;
 v19DebugWithoutController=false;v19HideControllerGate();controllerRuntime(gp);v29KnownPads.set(gp.index,gp);v29PickerDismissed.delete(gp.index);v29Prime(gp.index);v38RequestUserBase(gp.index,{force:true});
}
function v38PadIntent(gp){
 const b=Array.from(gp?.buttons||[],x=>!!x&&(x.pressed||Number(x.value||0)>.45)),axes=Array.from(gp?.axes||[],Number),prev=v38GatePadState.get(gp.index)||{b:[],axes:[]};
 const edge=b.some((v,i)=>v&&!prev.b[i]);const axis=axes.some((v,i)=>Math.abs(v)>.67&&Math.abs(prev.axes[i]||0)<=.52);
 v38GatePadState.set(gp.index,{b:[...b],axes:[...axes]});return edge||axis;
}

/* Initial login always presents one neutral input gate. Connected controllers
   are remembered but do not auto-open Pick User until the player actually uses
   one. This is what lets first real input decide Mobile / PC / Controller. */
initialControllerLoginSequence=function(){
 v19Ready=true;pendingControllerLogins.splice(0);selectingControllerIndex=null;S.userSelectOpen=false;hideUi('#userSelect','back');
 for(const gp of v37PhysicalPads()){v29KnownPads.set(gp.index,gp);controllerRuntime(gp);v29Prime(gp.index);v38GatePadState.set(gp.index,{b:v29Buttons(gp),axes:Array.from(gp.axes||[],Number)})}
 v19ShowControllerGate();v38UpdateGateCopy();v37SyncMobileControls(true);
};

/* A connection alone does not choose Controller mode at the startup gate.
   Once logged in, retain v0.29's strict new-controller ownership behavior. */
const v38GamepadConnectedBase=v18GamepadConnected;
v18GamepadConnected=function(e){
 const gp=e?.gamepad;if(!gp)return;
 if(v38GateVisible()){v29KnownPads.set(gp.index,gp);controllerRuntime(gp);v29Prime(gp.index);v38GatePadState.set(gp.index,{b:v29Buttons(gp),axes:Array.from(gp.axes||[],Number)});v38UpdateGateCopy();return}
 return v38GamepadConnectedBase(e);
};

/* Disable the old "controller exists = immediately claim it" gate watcher. */
try{v20ControllerGateWatch=function(){}}catch{}

/* The controller scheduler is dormant in PC/Mobile mode. At the startup gate
   it only watches for a REAL controller button/stick action. */
const v38ControllerFrameBase=v24ControllerFrame;
v24ControllerFrame=function(now){
 const pads=v37PhysicalPads();
 if(v38GateVisible()){
  for(const gp of pads){
   if(!v29KnownPads.has(gp.index)){v29KnownPads.set(gp.index,gp);controllerRuntime(gp);v38GatePadState.set(gp.index,{b:[],axes:[]})}
   if(v38PadIntent(gp)){v38StartController(gp);break}
  }
  try{updateSessionStatus()}catch{};return;
 }
 if(v38InputMode()!=='controller'){
  /* Keep live pad snapshots neutral so switching to Controller mode later starts
     with a clean edge instead of replaying an old held button. */
  for(const gp of pads){v29KnownPads.set(gp.index,gp);const r=controllerRuntime(gp);r.last=v29Buttons(gp)}
  try{updateSessionStatus()}catch{};return;
 }
 return v38ControllerFrameBase(now);
};

/* Startup gate: touch chooses Mobile, mouse/pen chooses PC. A stored mode does
   not get silently changed by another device; Settings is authoritative. */
document.addEventListener('pointerdown',ev=>{
 if(!v38GateVisible())return;
 const detected=ev.pointerType==='touch'?'mobile':'pc';
 if(!v38InputMode())v38SetInputMode(detected,{persist:true});
 if(v38InputMode()==='controller')return;
 ev.preventDefault();v38StartNonController(v38InputMode()||detected);
},{capture:true});
document.addEventListener('keydown',ev=>{
 if(!v38GateVisible()||ev.metaKey||ev.ctrlKey||ev.altKey)return;
 if(!v38InputMode())v38SetInputMode('pc',{persist:true});
 if(v38InputMode()!=='controller'){ev.preventDefault();v38StartNonController(v38InputMode()||'pc')}
},{capture:true});

/* Larger system buttons also get explicit click fallbacks. Pointer handling is
   still primary, but these make taps resilient on browsers that synthesize a
   click after an interrupted pointer capture. */
for(const el of document.querySelectorAll('#mobileControls [data-mc-system]')){
 el.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation()});
}

function v38InputModeItems(){
 const current=v38InputMode()||'pc';
 const pick=mode=>()=>{v38SetInputMode(mode,{persist:true,announce:true});v38RefreshInputModePage()};
 return [
  {title:'Mobile Touch',note:current==='mobile'?'Current · touch controller shown':'Use the on-screen controller',action:pick('mobile')},
  {title:'PC Keyboard & Mouse',note:current==='pc'?'Current':'Hide touch controls; use keyboard and mouse',action:pick('pc')},
  {title:'Controller',note:current==='controller'?'Current':'Use assigned physical controllers',action:pick('controller')},
  {title:'How automatic detection works',note:'First unconfigured startup: touch = Mobile · keyboard/mouse = PC · gamepad input = Controller',disabled:true}
 ];
}
function v38RefreshInputModePage(){if(document.querySelector('#pageTitle')?.textContent!=='Input Mode')return;S.pageItems=v38InputModeItems();S.pageIndex=Math.min(S.pageIndex,S.pageItems.length-1);renderPage()}
function openInputModePage(){openPage({title:'Input Mode',subtitle:'DorukStation keeps this mode until you change it here.',icon:'assets/skin/flow/function/setting.png',items:v38InputModeItems()},true)}

/* Mobile-controls page no longer has an Auto/On/Off toggle that can disagree
   with Input Mode. Input Mode is the single source of truth. */
v37MobileSettingItems=function(){
 const p=v37MobilePrefs(),visLabel={both:'Home + Games',home:'Home only',games:'Games only'}[p.visibility];
 return [
  {title:'Input Mode',note:v38InputModeLabel(),action:openInputModePage},
  {title:'Show Controls',note:visLabel,action:()=>{p.visibility=p.visibility==='both'?'home':p.visibility==='home'?'games':'both';v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Style',note:`Follows ${typeof v26UiMode==='function'?v26UiModeLabel():'Classic'} UI`,disabled:true},
  {title:'Button Size',note:p.size[0].toUpperCase()+p.size.slice(1),action:()=>{p.size=p.size==='small'?'medium':p.size==='medium'?'large':'small';v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Opacity',note:`${Math.round(p.opacity*100)}%`,action:()=>{p.opacity=p.opacity<.6?.74:p.opacity<.82?.9:.52;v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Stick Sensitivity',note:`${p.sensitivity.toFixed(2)}×`,action:()=>{p.sensitivity=p.sensitivity<.9?1:p.sensitivity<1.15?1.25:.8;v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Touch Vibration',note:p.haptics?'On':'Off',action:()=>{p.haptics=!p.haptics;v37SaveMobilePrefs(p);v37RefreshMobileSettings()}},
  {title:'Visibility rule',note:'Touch controller is shown only while Input Mode is Mobile',disabled:true}
 ];
};
openMobileControlsPage=function(){openPage({title:'Mobile Controls',subtitle:'Layout and feel of the touch controller. Input Mode must be Mobile.',icon:'assets/skin/flow/function/setting.png',items:v37MobileSettingItems()},true)};

const v38OpenSettingsBase=openSettingsPage;
openSettingsPage=function(){
 v38OpenSettingsBase();if(!S.pageOpen||document.querySelector('#pageTitle')?.textContent!=='Settings')return;
 if(!S.pageItems.some(x=>x.title==='Input Mode')){
  const ui=S.pageItems.findIndex(x=>x.title==='UI Mode'),at=ui>=0?ui+1:0;
  S.pageItems.splice(at,0,{title:'Input Mode',icon:'⌨',note:v38InputModeLabel(),action:openInputModePage});
 }
 const mobile=S.pageItems.find(x=>x.title==='Mobile Controls');if(mobile)mobile.note=v38InputMode()==='mobile'?'Active':'Available in Mobile mode';
 renderPage();
};

/* When a Settings change leaves Controller mode, release all virtual/system
   input immediately. When it enters Mobile mode, reveal the overlay at once. */
const v38LoadProfileBase=loadProfileState;
loadProfileState=function(profile){const out=v38LoadProfileBase(profile);setTimeout(()=>{v38UpdateGateCopy();v37SyncMobileControls(true)},0);return out};

v38UpdateGateCopy();v37SyncMobileControls(true);

const v38UpdateDebugBase=updateDebug;
updateDebug=function(...args){const out=v38UpdateDebugBase(...args),d=document.querySelector('#debug');if(d&&!d.classList.contains('hidden')){d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.38');d.textContent+=`\ninputMode=${v38InputModeLabel()} touchOverlay=${v37ShouldShow()?'visible':'hidden'}`}return out};


/* ========================================================================== */
/* DorukStation Web v0.39 — pre-login privacy + wireless system settings      */
/* ========================================================================== */
window.__dorukstationVersion='0.39';

/* The input gate must be the first interactive surface. Never expose account
   cards or the installed-app row underneath it, even for a single frame. */
for(const sel of ['#userSelect','#createUserChoice','#createUserView','#avatarPicker']){
 const el=document.querySelector(sel);if(el)el.classList.add('hidden');
}
S.userSelectOpen=false;S.createChoiceOpen=false;S.createUserOpen=false;

/* Before a user is selected there is no per-user UI mode yet. Reuse the last
   chosen global UI mode so the neutral gate looks like the shell the owner last
   used: Classic blue Flow or Modern dark/glitter. */
function v39ApplyPreloginUiMode(){
 try{
  const last=localStorage.getItem(V26_LAST_UI_MODE_KEY)||'classic';
  S.uiMode=last==='modern'?'modern':'classic';
  v26ApplyUiModeClass?.();
 }catch{}
}
v39ApplyPreloginUiMode();

/* Keep Home/apps completely private behind the input gate while preserving the
   real Flow/Modern background layers. */
const v39ShowGateBase=v19ShowControllerGate;
v19ShowControllerGate=function(){
 v39ApplyPreloginUiMode();document.body.classList.add('input-gate-open');
 const out=v39ShowGateBase();v39UpdateGateCopy();return out;
};
const v39HideGateBase=v19HideControllerGate;
v19HideControllerGate=function(){
 const out=v39HideGateBase();
 setTimeout(()=>document.body.classList.remove('input-gate-open'),UI_EXIT_MS+30);
 return out;
};

function v39UpdateGateCopy(){
 const gate=document.querySelector('#controllerGate');if(!gate)return;
 gate.classList.add('v39-input-gate');
 const title=gate.querySelector('h1'),hint=document.querySelector('#inputDetectHint'),status=document.querySelector('#inputModeGateStatus'),mode=v38InputMode();
 if(title)title.textContent='Press any button or click/tap anywhere';
 if(hint)hint.textContent=mode
   ?`Input Mode: ${v38InputModeLabel(mode)}`
   :'Touch = Mobile · Keyboard / Mouse = PC · Controller = Controller';
 if(status)status.textContent=mode
   ?'Your saved Input Mode stays active. Change it later in Settings → Input Mode.'
   :'User selection appears only after DorukStation receives your first input.';
}
const v39GateCopyBase=v38UpdateGateCopy;
v38UpdateGateCopy=function(){try{v39GateCopyBase()}catch{};v39UpdateGateCopy()};

/* -------------------------------------------------------------------------- */
/* Native-system bridge                                                       */
/* -------------------------------------------------------------------------- */
/* A normal HTTPS web page cannot enumerate SSIDs, toggle Wi-Fi, or control
   system Bluetooth. DorukStation therefore supports a same-origin native bridge
   when launched through serve.sh / DorukStation OS. GitHub Pages stays safe and
   falls back to browser-visible status + Web Bluetooth LE pairing when offered. */
function v39LocalSystemHost(){return ['127.0.0.1','localhost','::1'].includes(location.hostname)}
async function v39SystemCall(action,payload={}){
 if(window.DorukStationSystem&&typeof window.DorukStationSystem.call==='function'){
  const r=await window.DorukStationSystem.call(action,payload);return r||{};
 }
 if(!v39LocalSystemHost())throw new Error('native-bridge-unavailable');
 const r=await fetch(`/__dorukstation/api/${action}`,{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload||{}),cache:'no-store'
 });
 let data={};try{data=await r.json()}catch{}
 if(!r.ok||data.ok===false)throw new Error(data.error||`system-api-${r.status}`);
 return data;
}
async function v39SystemStatus(){
 try{return await v39SystemCall('status')}catch{return {ok:false,bridge:false,wifi:{available:false},bluetooth:{available:false}}}
}
function v39SetPageItemsIf(title,items,subtitle){
 if(document.querySelector('#pageTitle')?.textContent!==title)return;
 S.pageItems=items;S.pageIndex=Math.max(0,Math.min(S.pageIndex,Math.max(0,items.length-1)));
 if(subtitle!==undefined){const el=document.querySelector('#pageSubtitle');if(el)el.textContent=subtitle||''}
 renderPage();
}
function v39Notify(title,text=''){
 try{pushSystemNotification('',title,text,currentProfile)}catch{console.log(title,text)}
}

/* ---- Wi-Fi --------------------------------------------------------------- */
async function v39RefreshWifiPage(){
 const st=await v39SystemStatus(),w=st.wifi||{};
 if(!st.bridge||!w.available){
  v39SetPageItemsIf('Wi-Fi',[
   {title:'Internet Status',note:navigator.onLine?'Online':'Offline',disabled:true},
   {title:'Wi-Fi System Control',note:'Available when DorukStation runs through its local system bridge',disabled:true},
   {title:'GitHub Pages / normal browser',note:'Browsers are not allowed to read SSIDs, passwords, or toggle operating-system Wi-Fi',disabled:true},
   {title:'DorukStation OS',note:'Run ./serve.sh on Linux to enable NetworkManager controls here',disabled:true}
  ],'Browser-safe network status. Full Wi-Fi control activates automatically in DorukStation OS/local mode.');
  return;
 }
 const on=!!w.powered,connected=w.connection||'Not connected';
 v39SetPageItemsIf('Wi-Fi',[
  {title:'Wi-Fi',note:on?'On':'Off',action:async()=>{try{await v39SystemCall('wifi/power',{enabled:!on});v39Notify('Wi-Fi',!on?'Turned on':'Turned off');await v39RefreshWifiPage()}catch(e){v39Notify('Wi-Fi change failed',e.message)}}},
  {title:'Connection',note:connected,disabled:true},
  {title:'Signal',note:w.signal?`${w.signal}%`:'—',disabled:true},
  {title:'Available Networks',note:'Scan and connect',action:v39OpenWifiNetworksPage},
  {title:'Disconnect',note:w.connection?'Disconnect current Wi-Fi':'No active Wi-Fi',disabled:!w.connection,action:async()=>{try{await v39SystemCall('wifi/disconnect');v39Notify('Wi-Fi disconnected');await v39RefreshWifiPage()}catch(e){v39Notify('Disconnect failed',e.message)}}},
  {title:'Refresh',action:v39RefreshWifiPage}
 ],'Wi-Fi settings are provided by the DorukStation system bridge.');
}
function v39OpenWifiPage(){
 openPage({title:'Wi-Fi',subtitle:'Checking Wi-Fi…',icon:'assets/skin/flow/function/setting.png',items:[{title:'Checking system network…',disabled:true}]},true);
 v39RefreshWifiPage();
}
async function v39OpenWifiNetworksPage(){
 openPage({title:'Available Networks',subtitle:'Scanning Wi-Fi…',items:[{title:'Scanning…',disabled:true}]},true);
 try{
  const data=await v39SystemCall('wifi/scan'),nets=Array.isArray(data.networks)?data.networks:[];
  const unique=[];const seen=new Set();for(const n of nets){const key=n.ssid||'';if(!key||seen.has(key))continue;seen.add(key);unique.push(n)}
  const items=unique.map(n=>({
   title:n.ssid,note:`${n.signal||0}%${n.security&&n.security!=='--'?` · ${n.security}`:' · Open'}${n.active?' · Connected':''}`,
   action:n.active?undefined:async()=>{
    let password='';if(n.security&&n.security!=='--'&&n.security!=='OPEN')password=prompt(`Password for ${n.ssid}`,'')||'';
    try{v39Notify('Wi-Fi',`Connecting to ${n.ssid}…`);await v39SystemCall('wifi/connect',{ssid:n.ssid,password});v39Notify('Wi-Fi connected',n.ssid);backPage();setTimeout(v39RefreshWifiPage,120)}catch(e){v39Notify('Wi-Fi connection failed',e.message)}
   },disabled:!!n.active
  }));
  items.push({title:'Rescan',action:()=>{backPage();setTimeout(v39OpenWifiNetworksPage,80)}});
  v39SetPageItemsIf('Available Networks',items.length?items:[{title:'No Wi-Fi networks found',disabled:true}],'Select a network to connect.');
 }catch(e){v39SetPageItemsIf('Available Networks',[{title:'Wi-Fi scan unavailable',note:e.message,disabled:true}], 'The native system bridge could not scan Wi-Fi.');}
}

/* ---- Bluetooth ----------------------------------------------------------- */
async function v39RefreshBluetoothPage(){
 const st=await v39SystemStatus(),b=st.bluetooth||{};
 if(!st.bridge||!b.available){
  const items=[
   {title:'Bluetooth System Control',note:'Available in DorukStation OS/local system mode',disabled:true}
  ];
  if(navigator.bluetooth?.requestDevice)items.push({title:'Pair Bluetooth LE Device',note:'Browser Web Bluetooth fallback',action:v39WebBluetoothPair});
  items.push({title:'Browser limitation',note:'Web Bluetooth can pair supported BLE/GATT devices but cannot replace full OS Bluetooth settings',disabled:true});
  v39SetPageItemsIf('Bluetooth',items,'Full Bluetooth control activates automatically when the DorukStation system bridge is available.');
  return;
 }
 const on=!!b.powered;
 v39SetPageItemsIf('Bluetooth',[
  {title:'Bluetooth',note:on?'On':'Off',action:async()=>{try{await v39SystemCall('bluetooth/power',{enabled:!on});v39Notify('Bluetooth',!on?'Turned on':'Turned off');await v39RefreshBluetoothPage()}catch(e){v39Notify('Bluetooth change failed',e.message)}}},
  {title:'Pair New Device',note:on?'Scan nearby devices':'Turn Bluetooth on first',disabled:!on,action:v39OpenBluetoothScanPage},
  {title:'Paired Devices',note:String(b.pairedCount??0),action:v39OpenPairedBluetoothPage},
  {title:'Refresh',action:v39RefreshBluetoothPage}
 ],'Bluetooth settings are provided by the DorukStation system bridge.');
}
function v39OpenBluetoothPage(){openPage({title:'Bluetooth',subtitle:'Checking Bluetooth…',items:[{title:'Checking system Bluetooth…',disabled:true}]},true);v39RefreshBluetoothPage()}
async function v39WebBluetoothPair(){
 try{const d=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[]});v39Notify('Bluetooth LE device selected',d.name||d.id||'Device')}catch(e){if(e?.name!=='NotFoundError')v39Notify('Bluetooth pairing failed',e.message||String(e))}
}
async function v39OpenBluetoothScanPage(){
 openPage({title:'Bluetooth Devices',subtitle:'Scanning nearby devices…',items:[{title:'Scanning…',disabled:true}]},true);
 try{
  const data=await v39SystemCall('bluetooth/scan'),devices=Array.isArray(data.devices)?data.devices:[];
  const items=devices.map(d=>({title:d.name||d.mac,note:`${d.mac}${d.paired?' · Paired':''}${d.connected?' · Connected':''}`,action:async()=>{
   try{v39Notify('Bluetooth',`Pairing ${d.name||d.mac}…`);await v39SystemCall('bluetooth/pair',{mac:d.mac});v39Notify('Bluetooth paired',d.name||d.mac);backPage();setTimeout(v39RefreshBluetoothPage,100)}catch(e){v39Notify('Bluetooth pairing failed',e.message)}
  }}));
  items.push({title:'Scan Again',action:()=>{backPage();setTimeout(v39OpenBluetoothScanPage,80)}});
  v39SetPageItemsIf('Bluetooth Devices',items.length?items:[{title:'No Bluetooth devices found',disabled:true}],'Choose a device to pair. Some devices may require confirmation on the device itself.');
 }catch(e){v39SetPageItemsIf('Bluetooth Devices',[{title:'Bluetooth scan unavailable',note:e.message,disabled:true}]);}
}
async function v39OpenPairedBluetoothPage(){
 openPage({title:'Paired Bluetooth Devices',subtitle:'Loading paired devices…',items:[{title:'Loading…',disabled:true}]},true);
 try{
  const data=await v39SystemCall('bluetooth/devices',{paired:true}),devices=Array.isArray(data.devices)?data.devices:[];
  const items=devices.map(d=>({title:d.name||d.mac,note:`${d.mac}${d.connected?' · Connected':' · Paired'}`,action:async()=>{
   try{await v39SystemCall(d.connected?'bluetooth/disconnect':'bluetooth/connect',{mac:d.mac});v39Notify('Bluetooth',d.connected?'Disconnected':'Connected');v39OpenPairedBluetoothPage()}catch(e){v39Notify('Bluetooth action failed',e.message)}
  }}));
  v39SetPageItemsIf('Paired Bluetooth Devices',items.length?items:[{title:'No paired Bluetooth devices',disabled:true}]);
 }catch(e){v39SetPageItemsIf('Paired Bluetooth Devices',[{title:'Paired devices unavailable',note:e.message,disabled:true}]);}
}
function v39OpenDevicesPage(){openPage({title:'Devices',subtitle:'Controllers and Bluetooth devices.',items:[{title:'Controller',note:'Input mappings and assignments',action:openControllerPage},{title:'Bluetooth',note:'Power, pair and connect devices',action:v39OpenBluetoothPage}]},true)}

/* Upgrade the Settings entries without disturbing the existing settings tree. */
const v39OpenSettingsBase=openSettingsPage;
openSettingsPage=function(){
 v39OpenSettingsBase();if(!S.pageOpen||document.querySelector('#pageTitle')?.textContent!=='Settings')return;
 const net=S.pageItems.find(x=>x.title==='Network');if(net){net.note=navigator.onLine?'Online · Wi-Fi settings':'Offline · Wi-Fi settings';net.action=v39OpenWifiPage}
 const dev=S.pageItems.find(x=>x.title==='Devices');if(dev){dev.note='Controllers · Bluetooth';dev.action=v39OpenDevicesPage}
 renderPage();
};

/* Keep the gate copy and pre-login mode correct after profile changes/restarts. */
const v39LoadProfileBase=loadProfileState;
loadProfileState=function(profile){const out=v39LoadProfileBase(profile);setTimeout(()=>{v39UpdateGateCopy();v37SyncMobileControls(true)},0);return out};
v39UpdateGateCopy();

const v39UpdateDebugBase=updateDebug;
updateDebug=function(...args){const out=v39UpdateDebugBase(...args),d=document.querySelector('#debug');if(d&&!d.classList.contains('hidden')){d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.39');d.textContent+=`\nsystemBridge=${v39LocalSystemHost()?'local-capable':'browser-only'}`}return out};
