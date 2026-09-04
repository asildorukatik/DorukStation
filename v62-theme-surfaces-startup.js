/* DorukStation Web v0.62 — theme-aware Classic surfaces + strict startup order */
(function(){
'use strict';
window.__dorukstationVersion='0.62';

const V62_PALETTES={
 blue:{one:'#084b9b',two:'#062f78',three:'#031b52'},
 red:{one:'#8b2933',two:'#5d171f',three:'#330c12'},
 green:{one:'#24715a',two:'#104d3d',three:'#072b23'},
 orange:{one:'#a95b1d',two:'#73390f',three:'#3b1c08'},
 black:{one:'#383c46',two:'#20242b',three:'#0d0f13'},
 purple:{one:'#724198',two:'#492661',three:'#271433'},
 yellow:{one:'#a5872e',two:'#705b1b',three:'#3a2f0e'},
 turquoise:{one:'#198997',two:'#0d5b66',three:'#063239'}
};
const V62_OLD_FLOW={default:'blue',gold:'yellow',steelblue:'blue',red:'red',lightblue:'turquoise',purple:'purple',grey:'black',pink:'purple'};
function v62ThemeId(){
 const t=S?.theme||{};
 if(t.kind==='flowvideo'&&V62_PALETTES[t.id])return t.id;
 if(t.kind==='flow'&&V62_OLD_FLOW[t.id])return V62_OLD_FLOW[t.id];
 return 'blue';
}
function v62ApplySurfacePalette(){
 const p=V62_PALETTES[v62ThemeId()]||V62_PALETTES.blue,root=document.documentElement;
 root.style.setProperty('--ds-surface-1',p.one);
 root.style.setProperty('--ds-surface-2',p.two);
 root.style.setProperty('--ds-surface-3',p.three);
 root.dataset.dsClassicSurface=v62ThemeId();
}
window.v62ApplySurfacePalette=v62ApplySurfacePalette;

/* Apply the last signed-in user's Flow before login when possible. This gives
   boot -> Flow -> input gate continuity instead of flashing default blue. */
function v62LoadLastPreloginFlow(){
 try{
  if(currentProfile)return;
  const last=localStorage.getItem(PROFILE_LAST_KEY),profile=profiles.find(p=>p.id===last);
  if(!profile)return;
  let raw=localStorage.getItem(profileKey('theme',profile));
  if(raw===null)raw=localStorage.getItem(legacyProfileKey('theme',profile));
  const t=safeJSON(raw,null);
  if(t?.kind==='flowvideo'&&V62_PALETTES[t.id])S.theme={kind:'flowvideo',id:t.id};
  else if(t?.kind==='flow'&&V62_OLD_FLOW[t.id])S.theme={kind:'flowvideo',id:V62_OLD_FLOW[t.id]};
 }catch{}
}

/* Keep palette synchronized both on profile/theme application and on the
   visual theme selector, which changes --flow-color without calling applyTheme. */
const v62ApplyThemeBase=applyTheme;
applyTheme=function(...args){const out=v62ApplyThemeBase(...args);v62ApplySurfacePalette();return out};
const v62RenderPageBase=renderPage;
renderPage=function(...args){v62ApplySurfacePalette();return v62RenderPageBase(...args)};
new MutationObserver(()=>v62ApplySurfacePalette()).observe(document.documentElement,{attributes:true,attributeFilter:['style']});

/* ----------------------------------------------------------------------- */
/* Strict startup state machine: boot -> input -> users -> shell.           */
/* ----------------------------------------------------------------------- */
let v62StartupPhase='boot';
let v62UserRevealPending=false;
window.__v62StartupPhase=()=>v62StartupPhase;
function v62SetStartupPhase(next){
 v62StartupPhase=next;
 const b=document.body;
 b.classList.toggle('v62-startup-locked',next!=='shell');
 b.classList.toggle('v62-shell-concealed',next!=='shell');
 b.classList.toggle('v62-input-phase',next==='input');
 b.classList.toggle('v62-user-phase',next==='users'||next==='users-transition');
 b.classList.toggle('v62-shell-revealing',next==='shell');
}
function v62HidePreloginSurfacesNow(){
 for(const sel of ['#userSelect','#createUserChoice','#createUserView','#avatarPicker','#controllerGate']){
  const el=document.querySelector(sel);if(!el)continue;clearUiTimer?.(el);el.classList.add('hidden');el.classList.remove('ui-enter-forward','ui-enter-back','ui-exit-forward','ui-exit-back');
 }
 S.userSelectOpen=false;S.createChoiceOpen=false;S.createUserOpen=false;S.avatarPickerOpen=false;
}
function v62RevealInputGate(){
 v62UserRevealPending=false;v62SetStartupPhase('input');
 S.userSelectOpen=false;
 try{v19ShowControllerGate()}catch{showUi('#controllerGate','back')}
 try{v38UpdateGateCopy()}catch{}
}

/* app.js scheduled this function before v0.62 loaded. Replacing the global
   function is enough: its 2.25s timer resolves this new implementation. */
initialControllerLoginSequence=function(){
 v19Ready=true;
 try{pendingControllerLogins.splice(0)}catch{}
 try{selectingControllerIndex=null}catch{}
 v62HidePreloginSurfacesNow();
 v62RevealInputGate();
};

/* All first-input paths eventually call showUserSelector. During initial boot,
   wait for the input gate's exit animation to finish before revealing users. */
const v62ShowUserSelectorBase=showUserSelector;
showUserSelector=function(...args){
 if(v62StartupPhase==='input'||v62StartupPhase==='users-transition'){
  if(v62UserRevealPending)return;
  v62UserRevealPending=true;v62SetStartupPhase('users-transition');
  try{v19HideControllerGate()}catch{hideUi('#controllerGate','forward')}
  setTimeout(()=>{
   v62UserRevealPending=false;v62SetStartupPhase('users');
   v62ShowUserSelectorBase(...args);
  },UI_EXIT_MS+55);
  return;
 }
 return v62ShowUserSelectorBase(...args);
};

/* Home, apps and top quick functions remain invisible until the chosen user is
   committed. User Select fades out first, then the shell fades in. */
const v62FinishUserLoginBase=finishUserLogin;
finishUserLogin=function(...args){
 const wasStartup=v62StartupPhase==='users'||v62StartupPhase==='users-transition';
 const out=v62FinishUserLoginBase(...args);
 if(wasStartup){
  setTimeout(()=>{
   v62SetStartupPhase('shell');
   setTimeout(()=>document.body.classList.remove('v62-shell-revealing'),470);
  },UI_EXIT_MS+35);
 }
 return out;
};

/* Initial DOM used to contain an active user picker behind the boot animation.
   Hide it synchronously so the 1.45s boot fade can never expose clickable users. */
v62LoadLastPreloginFlow();
v62ApplySurfacePalette();
v62HidePreloginSurfacesNow();
v62SetStartupPhase('boot');
try{applyTheme()}catch{}
})();
