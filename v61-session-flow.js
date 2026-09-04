
/* DorukStation Web v0.61 — fresh-per-session input mode + synchronized Flow themes */
(function(){
window.__dorukstationVersion='0.61';
const V61_FLOW=[
 {id:'blue',name:'Blue',color:'#0b3f8e'},
 {id:'red',name:'Red',color:'#72141c'},
 {id:'green',name:'Green',color:'#135b46'},
 {id:'orange',name:'Orange',color:'#a65112'},
 {id:'black',name:'Black',color:'#171a21'},
 {id:'purple',name:'Purple',color:'#552381'},
 {id:'yellow',name:'Yellow',color:'#9d7b18'},
 {id:'turquoise',name:'Turquoise',color:'#0c7b82'}
].map(t=>({...t,mp4:`assets/flowvideo/${t.id}.mp4`,webm:`assets/flowvideo/${t.id}.webm`,thumb:`assets/flowvideo/thumbs/${t.id}.jpg`}));
const V61_FLOW_IDS=new Set(V61_FLOW.map(x=>x.id));
const V61_OLD_FLOW_MAP={default:'blue',gold:'yellow',steelblue:'blue',red:'red',lightblue:'turquoise',purple:'purple',grey:'black',pink:'purple'};
function v61Flow(id){return V61_FLOW.find(t=>t.id===id)||V61_FLOW[0]}
function v61NormalizedThemeId(){
 if(S.theme?.kind==='flowvideo'&&V61_FLOW_IDS.has(S.theme.id))return S.theme.id;
 if(S.theme?.kind==='flow'&&V61_OLD_FLOW_MAP[S.theme.id])return V61_OLD_FLOW_MAP[S.theme.id];
 return 'blue';
}
function v61ForceFlowPreference(save=true){
 const id=v61NormalizedThemeId();
 if(S.theme?.kind!=='flowvideo'||S.theme.id!==id){S.theme={kind:'flowvideo',id};if(save&&currentProfile)try{pSet('theme',JSON.stringify(S.theme))}catch{}}
 return id;
}

/* ----------------------------------------------------------------------- */
/* Input Mode: first real input wins on EVERY page load/session.            */
/* ----------------------------------------------------------------------- */
try{localStorage.removeItem(V38_INPUT_MODE_KEY)}catch{}
v38DetectedMode='';
function v61ApplyInputMode(mode,{announce=false}={}){
 if(!V38_INPUT_MODES.has(mode))return false;
 const changed=v38DetectedMode!==mode;
 v38DetectedMode=mode;
 try{localStorage.removeItem(V38_INPUT_MODE_KEY)}catch{}
 if(mode!=='mobile')v37ResetPad();
 v37SyncMobileControls(true);v38UpdateGateCopy();
 try{updateSessionStatus(true)}catch{}
 if(announce&&changed&&currentProfile)try{pushSystemNotification('',`Input Mode: ${v38InputModeLabel(mode)}`,'Session only — DorukStation will detect input again next launch.',currentProfile)}catch{}
 return true;
}
v38SetInputMode=function(mode,opts={}){return v61ApplyInputMode(mode,{announce:!!opts.announce})};
v38UpdateGateCopy=function(){
 const gate=document.querySelector('#controllerGate');if(!gate)return;gate.classList.add('v38-input-detect');
 const title=gate.querySelector('#controllerGateHeadline'),hint=document.querySelector('#inputDetectHint'),status=document.querySelector('#inputModeGateStatus'),mode=v38InputMode(),top=document.querySelector('#controllerGateTopLine');
 if(title)title.textContent='Use the device you want for this session';
 if(top)top.textContent='First input decides this session. No controller is required.';
 if(hint)hint.textContent=mode?`Session Input: ${v38InputModeLabel(mode)}`:'Touch → Mobile · Keyboard / Mouse → PC · Controller button/stick → Controller';
 if(status)status.textContent=mode?'You can override this session in Settings → Input Mode. Next launch detects again.':'DorukStation does not save Input Mode between sessions.';
 const old=document.querySelector('#playWithoutController');if(old){old.classList.add('hidden');old.setAttribute('aria-hidden','true')}
};
v38InputModeItems=function(){
 const current=v38InputMode()||'pc';
 const pick=mode=>()=>{v61ApplyInputMode(mode,{announce:true});v38RefreshInputModePage()};
 return [
  {title:'Mobile Touch',note:current==='mobile'?'Current session · touch controller shown':'Use Mobile for this session only',action:pick('mobile')},
  {title:'PC Keyboard & Mouse',note:current==='pc'?'Current session':'Use PC input for this session only',action:pick('pc')},
  {title:'Controller',note:current==='controller'?'Current session':'Use physical controllers for this session only',action:pick('controller')},
  {title:'Automatic next launch',note:'Every launch starts neutral: first touch = Mobile · keyboard/mouse = PC · first gamepad action = Controller',disabled:true}
 ];
};
openInputModePage=function(){openPage({title:'Input Mode',subtitle:'Session-only override. DorukStation detects the first input again on the next launch.',icon:'assets/skin/flow/function/setting.png',items:v38InputModeItems()},true)};

/* ----------------------------------------------------------------------- */
/* Classic video deck. New theme starts at the OLD theme's exact phase.     */
/* ----------------------------------------------------------------------- */
let v61Active=null,v61SwitchToken=0;
function v61Deck(){
 let d=document.getElementById('flowVideoDeck');if(d)return d;
 d=document.createElement('div');d.id='flowVideoDeck';d.setAttribute('aria-hidden','true');
 const viewport=document.getElementById('viewport'),anchor=document.getElementById('flowColor');
 if(anchor?.nextSibling)viewport.insertBefore(d,anchor.nextSibling);else viewport.prepend(d);
 return d;
}
function v61VideoSource(video,t){
 const mp4=video.canPlayType?.('video/mp4; codecs="avc1.42E01E"');
 video.src=mp4?t.mp4:t.webm;
}
function v61SetVideoPhase(video,phase){
 const dur=Number(video.duration);if(!Number.isFinite(dur)||dur<=0)return;
 try{video.currentTime=((Number(phase)||0)%dur+dur)%dur}catch{}
}
function v61Play(video){
 if(S.animation===false){try{video.pause()}catch{};return}
 try{const p=video.play();if(p?.catch)p.catch(()=>{})}catch{}
}
function v61StopDeck(){
 const d=v61Deck();for(const v of [...d.querySelectorAll('video')]){try{v.pause()}catch{}}
 d.style.opacity='0';
}
function v61ShowFlow(id,{force=false}={}){
 const d=v61Deck(),t=v61Flow(id);d.style.background=t.color;d.style.opacity='1';
 if(v26UiMode()==='modern'){v61StopDeck();return}
 if(v61Active?.dataset.theme===t.id&&!force){v61Play(v61Active);return}
 const old=v61Active&&v61Active.isConnected?v61Active:null;
 const phase=old?Number(old.currentTime)||0:0;
 const token=++v61SwitchToken;
 const next=document.createElement('video');next.className='flow-phase-video';next.dataset.theme=t.id;next.muted=true;next.loop=true;next.autoplay=true;next.playsInline=true;next.preload='auto';next.setAttribute('muted','');next.setAttribute('loop','');next.setAttribute('playsinline','');
 v61VideoSource(next,t);d.appendChild(next);v61Active=next;
 const reveal=()=>{
  if(token!==v61SwitchToken||!next.isConnected)return;
  const beginFade=()=>{
   if(token!==v61SwitchToken||!next.isConnected)return;
   v61Play(next);
   requestAnimationFrame(()=>requestAnimationFrame(()=>next.classList.add('flow-visible')));
   /* Old Flow stays fully alive beneath the incoming Flow during its fade. */
   setTimeout(()=>{
    if(token!==v61SwitchToken)return;
    for(const v of [...d.querySelectorAll('video')])if(v!==next){try{v.pause()}catch{};v.remove()}
   },2200);
  };
  const targetPhase=old&&old.isConnected?(Number(old.currentTime)||phase):phase;
  v61SetVideoPhase(next,targetPhase);
  if(targetPhase>.04){
   let started=false;const start=()=>{if(started)return;started=true;beginFade()};
   next.addEventListener('seeked',start,{once:true});setTimeout(start,260);
  }else beginFade();
 };
 if(next.readyState>=1)reveal();else next.addEventListener('loadedmetadata',reveal,{once:true});
 next.load();
}

/* Bypass v0.60's single-video implementation; keep all pre-v0.60 theme/mobile/banner logic. */
applyTheme=function(...args){
 const id=v61ForceFlowPreference(false);
 const out=v37ApplyThemeBase(...args);
 requestAnimationFrame(()=>{try{v37SyncMobileControls(false)}catch{}});
 document.body.classList.toggle('flow-video-theme',v26UiMode()==='classic');
 if(v26UiMode()==='classic')v61ShowFlow(id);else v61StopDeck();
 return out;
};

/* Switching UI generation never injects the uploaded Flow videos into Modern. */
const v61SetUiModeBase=v26SetUiMode;
v26SetUiMode=function(mode,opts){
 const out=v61SetUiModeBase(mode,opts);
 if(mode==='modern')v61StopDeck();else {const id=v61ForceFlowPreference(true);setTimeout(()=>v61ShowFlow(id),0)}
 return out;
};

/* Selecting a new Classic Flow preserves the exact timestamp of the old one. */
function v61ChooseFlow(t){
 S.theme={kind:'flowvideo',id:t.id};try{pSet('theme',JSON.stringify(S.theme))}catch{}
 document.documentElement.style.setProperty('--flow-color',t.color);
 v61ShowFlow(t.id);renderPage();
}
function v61FlowItems(){return V61_FLOW.map(t=>({title:t.name,note:S.theme?.kind==='flowvideo'&&S.theme.id===t.id?'Active':'',image:t.thumb,action:()=>v61ChooseFlow(t)}))}
function v61RenderFlowCards(body){
 body.innerHTML=`<div class="v61-flow-grid">${V61_FLOW.map((t,i)=>`<button class="v61-flow-card ${i===S.pageIndex?'focused':''}" data-i="${i}" type="button"><div class="thumb" style="background-image:url('${t.thumb}')"></div><div class="tag">Animated Flow</div>${S.theme?.kind==='flowvideo'&&S.theme.id===t.id?'<div class="active">ACTIVE</div>':''}<div class="name">${esc(t.name)}</div></button>`).join('')}</div>`;
 body.querySelectorAll('[data-i]').forEach(el=>el.onclick=()=>{S.pageIndex=Number(el.dataset.i);activatePage()});
}
openFlowThemePage=function(){
 v61ForceFlowPreference(true);
 const items=v61FlowItems();openPage({title:'Classic Flow Theme',subtitle:'Choose visually. Every option is your looping animated Flow video — no static Classic backgrounds.',icon:'assets/skin/flow/function/setting.png',mode:'grid',cols:4,items,renderCustom:v61RenderFlowCards},true);
 const n=V61_FLOW.findIndex(t=>t.id===S.theme.id);S.pageIndex=n>=0?n:0;renderPage();
};
function v61ThemeLabel(){return `${v61Flow(v61NormalizedThemeId()).name} Flow`}
themeLabel=function(){return v61ThemeLabel()};
openThemeRootPage=function(){
 openPage({title:'Themes',subtitle:`${v26UiModeLabel()} UI · Classic uses animated Flow only; Modern keeps its own glitter style.`,icon:'assets/skin/flow/function/setting.png',items:[
  {title:'UI Mode',note:v26UiModeLabel(),action:openUiModePage},
  {title:'Classic Flow Theme',note:v61ThemeLabel(),action:openFlowThemePage},
  {title:'System Sound Theme',note:v22SoundThemeLabel(),action:openSoundThemePage},
  {title:'Boot Audio',note:v22BootAudioLabel(),action:openBootAudioPage}
 ]},true);
};
openSoundScreenPage=function(){
 openPage({title:'Sound and Screen',subtitle:'DorukStation display and audio preferences.',items:[
  {title:'Device Audio Output',note:'Always use this device’s speakers / headphones, never a controller speaker',action:chooseAudioOutput},
  {title:'Sound Effects',note:S.sounds?'On':'Off',action:()=>{S.sounds=!S.sounds;pSet('sounds',S.sounds?'on':'off');if(!S.sounds)v22StopSystemAudio();else setTimeout(()=>v22PlaySfx('select'),60);openSoundScreenPage()}},
  {title:'System Sound Theme',note:v22SoundThemeLabel(),action:openSoundThemePage},
  {title:'Boot Audio',note:v22BootAudioLabel(),action:openBootAudioPage},
  {title:'Background Animation',note:S.animation?'On':'Off',action:()=>{S.animation=!S.animation;pSet('animation',S.animation?'on':'off');if(v61Active){if(S.animation)v61Play(v61Active);else try{v61Active.pause()}catch{}};openSoundScreenPage()}},
  {title:'Display',note:'Full-bleed shell / native game viewport',action:openDisplayPage}
 ]},true);
};

/* Profile themes from old builds (static Flow/game/custom) become Blue/nearest Flow. */
const v61LoadProfileBase=loadProfileState;
loadProfileState=function(profile){
 const out=v61LoadProfileBase(profile);v61ForceFlowPreference(true);setTimeout(()=>applyTheme(),0);return out;
};

/* Visibility keeps loop phase; do not restart at zero. */
document.addEventListener('visibilitychange',()=>{
 if(!v61Active)return;
 if(document.hidden){try{v61Active.pause()}catch{}}else if(v26UiMode()==='classic'&&S.animation!==false)v61Play(v61Active);
});

/* Startup is always neutral, regardless of what v0.38 had saved previously. */
v38DetectedMode='';try{localStorage.removeItem(V38_INPUT_MODE_KEY)}catch{};v38UpdateGateCopy();
v61ForceFlowPreference(false);setTimeout(()=>applyTheme(),0);
})();
