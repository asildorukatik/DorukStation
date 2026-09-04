/* DorukStation Web v0.64 — animated Flow video preview inside Change Background */
(function(){
'use strict';
window.__dorukstationVersion='0.64';
const V64_FLOW=[
 {id:'blue',name:'Blue'},
 {id:'red',name:'Red'},
 {id:'green',name:'Green'},
 {id:'orange',name:'Orange'},
 {id:'black',name:'Black'},
 {id:'purple',name:'Purple'},
 {id:'yellow',name:'Yellow'},
 {id:'turquoise',name:'Turquoise'}
].map(t=>({...t,mp4:`assets/flowvideo/${t.id}.mp4`,webm:`assets/flowvideo/${t.id}.webm`,thumb:`assets/flowvideo/thumbs/${t.id}.jpg`}));
const V64_BY_ID=Object.fromEntries(V64_FLOW.map(t=>[t.id,t]));
const V64_OLD={default:'blue',gold:'yellow',steelblue:'blue',red:'red',lightblue:'turquoise',purple:'purple',grey:'black',pink:'purple'};
const V64_PREVIEW_FADE_MS=1350;
let v64ActivePreview=null,v64SwitchToken=0,v64Leaving=false;
function v64CommittedId(){
 const t=S?.theme||{};
 if(t.kind==='flowvideo'&&V64_BY_ID[t.id])return t.id;
 if(t.kind==='flow'&&V64_OLD[t.id])return V64_OLD[t.id];
 return 'blue';
}
function v64Page(){return document.getElementById('pageView')}
function v64IsBackgroundPage(){return S.pageOpen&&document.getElementById('pageTitle')?.textContent==='Change Background'}
function v64PreviewDeck(){
 const page=v64Page();if(!page)return null;
 let deck=page.querySelector('.v64-flow-preview-deck');
 if(deck)return deck;
 deck=document.createElement('div');deck.className='v64-flow-preview-deck';deck.setAttribute('aria-hidden','true');
 page.insertBefore(deck,page.firstChild);return deck;
}
function v64VideoSource(video,t){
 const mp4=video.canPlayType?.('video/mp4; codecs="avc1.42E01E"');
 video.src=mp4?t.mp4:t.webm;
}
function v64SetPhase(video,phase){
 const dur=Number(video.duration);if(!Number.isFinite(dur)||dur<=0)return;
 try{video.currentTime=((Number(phase)||0)%dur+dur)%dur}catch{}
}
function v64Play(video){
 if(S.animation===false){try{video.pause()}catch{};return}
 try{const p=video.play();if(p?.catch)p.catch(()=>{})}catch{}
}
function v64RealPhase(){
 const videos=[...document.querySelectorAll('#flowVideoDeck .flow-phase-video')].filter(v=>v.isConnected);
 const visible=videos.filter(v=>v.classList.contains('flow-visible'));
 const v=(visible.length?visible:videos).at(-1);return v?(Number(v.currentTime)||0):0;
}
function v64ShowPreview(id){
 if(!v64IsBackgroundPage())return;
 const t=V64_BY_ID[id]||V64_BY_ID.blue,page=v64Page(),deck=v64PreviewDeck();if(!page||!deck)return;
 page.classList.add('v64-background-preview');deck.classList.remove('v64-preview-leaving');
 if(v64ActivePreview?.dataset.theme===t.id&&v64ActivePreview.isConnected){v64Play(v64ActivePreview);return}
 const visible=[...deck.querySelectorAll('.flow-preview-video.visible')].filter(v=>v.isConnected).at(-1);
 const old=visible||(v64ActivePreview&&v64ActivePreview.isConnected?v64ActivePreview:null);
 const phase=old?(Number(old.currentTime)||0):v64RealPhase();
 const token=++v64SwitchToken;
 const next=document.createElement('video');
 next.className='flow-preview-video';next.dataset.theme=t.id;next.muted=true;next.loop=true;next.autoplay=true;next.playsInline=true;next.preload='auto';
 next.setAttribute('muted','');next.setAttribute('loop','');next.setAttribute('playsinline','');
 v64VideoSource(next,t);deck.appendChild(next);v64ActivePreview=next;
 const reveal=()=>{
  if(token!==v64SwitchToken||!next.isConnected)return;
  const begin=()=>{
   if(token!==v64SwitchToken||!next.isConnected)return;
   v64Play(next);
   requestAnimationFrame(()=>requestAnimationFrame(()=>next.classList.add('visible')));
   setTimeout(()=>{
    if(token!==v64SwitchToken)return;
    for(const v of [...deck.querySelectorAll('video')])if(v!==next){try{v.pause()}catch{};v.remove()}
   },V64_PREVIEW_FADE_MS+180);
  };
  v64SetPhase(next,phase);
  if(phase>.04){let started=false;const start=()=>{if(started)return;started=true;begin()};next.addEventListener('seeked',start,{once:true});setTimeout(start,260)}
  else begin();
 };
 if(next.readyState>=1)reveal();else next.addEventListener('loadedmetadata',reveal,{once:true});
 next.load();
}
function v64ClearPreview(){
 const page=v64Page(),deck=page?.querySelector('.v64-flow-preview-deck');
 ++v64SwitchToken;v64ActivePreview=null;
 if(deck){for(const v of [...deck.querySelectorAll('video')]){try{v.pause()}catch{}}deck.remove()}
 page?.classList.remove('v64-background-preview');
}
function v64FadeOutPreview(done){
 const deck=v64Page()?.querySelector('.v64-flow-preview-deck');
 if(!deck){done?.();return}
 deck.classList.add('v64-preview-leaving');
 setTimeout(()=>done?.(),560);
}
function v64RenderCards(body){
 const current=v64CommittedId();
 body.innerHTML=`<div class="v61-flow-grid">${V64_FLOW.map((t,i)=>`<button class="v61-flow-card ${i===S.pageIndex?'focused':''}" data-i="${i}" type="button"><div class="thumb" style="background-image:url('${t.thumb}')"></div><div class="tag">Animated Flow</div>${current===t.id?'<div class="active">ACTIVE</div>':''}<div class="name">${esc(t.name)}</div></button>`).join('')}</div><div class="v64-preview-note">Move focus or hover to preview the real Flow animation inside this page. Select to apply.</div>`;
 const cards=[...body.querySelectorAll('[data-i]')];
 cards.forEach(el=>{
  const i=Number(el.dataset.i),t=V64_FLOW[i];
  el.addEventListener('mouseenter',()=>{S.pageIndex=i;cards.forEach((card,j)=>card.classList.toggle('focused',j===i));v64ShowPreview(t.id)});
  el.addEventListener('focus',()=>{S.pageIndex=i;v64ShowPreview(t.id)});
  el.onclick=()=>{S.pageIndex=i;activatePage()};
 });
 const t=V64_FLOW[Math.max(0,Math.min(V64_FLOW.length-1,S.pageIndex))];if(t)v64ShowPreview(t.id);
}

/* v0.61 still owns committing the real Flow and phase-synchronised viewport
   crossfade. v0.64 changes only the temporary Change Background preview. */
const v64OpenFlowBase=openFlowThemePage;
openFlowThemePage=function(){
 v64OpenFlowBase();
 const original=[...(S.pageItems||[])];
 setPageHeader('Change Background','Hover or move focus to preview the animated Flow in this page. Select to apply it to Classic.', 'assets/skin/flow/function/setting.png');
 S.pageItems=original.map(item=>({...item,action:()=>item.action?.()}));
 S.pageCustom=v64RenderCards;
 const n=V64_FLOW.findIndex(t=>t.id===v64CommittedId());S.pageIndex=n>=0?n:0;
 v64PreviewDeck();v64Page()?.classList.add('v64-background-preview');renderPage();
 setTimeout(()=>v64ShowPreview(v64CommittedId()),0);
};

openThemeRootPage=function(){
 openPage({title:'Themes',subtitle:`${v26UiModeLabel()} UI · Classic uses animated Flow only; Modern keeps its own glitter style.`,icon:'assets/skin/flow/function/setting.png',items:[
  {title:'UI Mode',note:v26UiModeLabel(),action:openUiModePage},
  {title:'Change Background',note:themeLabel(),action:openFlowThemePage},
  {title:'System Sound Theme',note:v22SoundThemeLabel(),action:openSoundThemePage},
  {title:'Boot Audio',note:v22BootAudioLabel(),action:openBootAudioPage}
 ]},true);
};

const v64MovePageBase=movePage;
movePage=function(dx,dy){
 const out=v64MovePageBase(dx,dy);
 if(v64IsBackgroundPage()){
  const t=V64_FLOW[Math.max(0,Math.min(V64_FLOW.length-1,S.pageIndex))];if(t)v64ShowPreview(t.id);
 }
 return out;
};

const v64BackPageBase=backPage;
backPage=function(){
 if(v64IsBackgroundPage()&&v64Leaving)return;
 if(v64IsBackgroundPage()){
  v64Leaving=true;
  v64FadeOutPreview(()=>{
   const out=v64BackPageBase();v64ClearPreview();v64Leaving=false;return out;
  });
  return;
 }
 v64ClearPreview();return v64BackPageBase();
};

document.addEventListener('visibilitychange',()=>{
 if(!v64ActivePreview)return;
 if(document.hidden){try{v64ActivePreview.pause()}catch{}}
 else if(v64IsBackgroundPage())v64Play(v64ActivePreview);
});
})();
