/* DorukStation Web v0.63 — Change Background preview + smooth static palette fades */
(function(){
'use strict';
window.__dorukstationVersion='0.63';
const V63_FLOW=[
 {id:'blue',name:'Blue',one:'#084b9b',two:'#062f78',three:'#031b52'},
 {id:'red',name:'Red',one:'#8b2933',two:'#5d171f',three:'#330c12'},
 {id:'green',name:'Green',one:'#24715a',two:'#104d3d',three:'#072b23'},
 {id:'orange',name:'Orange',one:'#a95b1d',two:'#73390f',three:'#3b1c08'},
 {id:'black',name:'Black',one:'#383c46',two:'#20242b',three:'#0d0f13'},
 {id:'purple',name:'Purple',one:'#724198',two:'#492661',three:'#271433'},
 {id:'yellow',name:'Yellow',one:'#a5872e',two:'#705b1b',three:'#3a2f0e'},
 {id:'turquoise',name:'Turquoise',one:'#198997',two:'#0d5b66',three:'#063239'}
].map(t=>({...t,thumb:`assets/flowvideo/thumbs/${t.id}.jpg`}));
const V63_BY_ID=Object.fromEntries(V63_FLOW.map(t=>[t.id,t]));
const V63_OLD={default:'blue',gold:'yellow',steelblue:'blue',red:'red',lightblue:'turquoise',purple:'purple',grey:'black',pink:'purple'};
let v63Leaving=false;
function v63CommittedId(){
 const t=S?.theme||{};
 if(t.kind==='flowvideo'&&V63_BY_ID[t.id])return t.id;
 if(t.kind==='flow'&&V63_OLD[t.id])return V63_OLD[t.id];
 return 'blue';
}
function v63Page(){return document.getElementById('pageView')}
function v63IsBackgroundPage(){return S.pageOpen&&document.getElementById('pageTitle')?.textContent==='Change Background'}
function v63SetPagePalette(id){
 const page=v63Page(),t=V63_BY_ID[id]||V63_BY_ID.blue;if(!page)return;
 page.classList.add('v63-bg-preview');
 page.style.setProperty('--ds-preview-1',t.one);
 page.style.setProperty('--ds-preview-2',t.two);
 page.style.setProperty('--ds-preview-3',t.three);
}
function v63PreviewTheme(id){
 if(!v63IsBackgroundPage())return;
 v63SetPagePalette(id);
}
function v63ClearPreview(){
 const page=v63Page();if(!page)return;
 page.classList.remove('v63-bg-preview');
 page.style.removeProperty('--ds-preview-1');
 page.style.removeProperty('--ds-preview-2');
 page.style.removeProperty('--ds-preview-3');
}
function v63RestoreCommittedPreview(){v63SetPagePalette(v63CommittedId())}
function v63RenderCards(body){
 const current=v63CommittedId();
 body.innerHTML=`<div class="v61-flow-grid">${V63_FLOW.map((t,i)=>`<button class="v61-flow-card ${i===S.pageIndex?'focused':''}" data-i="${i}" type="button"><div class="thumb" style="background-image:url('${t.thumb}')"></div><div class="tag">Animated Flow</div>${current===t.id?'<div class="active">ACTIVE</div>':''}<div class="name">${esc(t.name)}</div></button>`).join('')}</div><div class="v63-preview-note">Move focus or hover to preview this page. Press Select / Enter / click to apply.</div>`;
 const cards=[...body.querySelectorAll('[data-i]')];
 cards.forEach(el=>{
  const i=Number(el.dataset.i),t=V63_FLOW[i];
  el.addEventListener('mouseenter',()=>{
   S.pageIndex=i;
   cards.forEach((card,j)=>card.classList.toggle('focused',j===i));
   v63PreviewTheme(t.id);
  });
  el.addEventListener('focus',()=>{S.pageIndex=i;v63PreviewTheme(t.id)});
  el.onclick=()=>{S.pageIndex=i;activatePage()};
 });
 const focusTheme=V63_FLOW[Math.max(0,Math.min(V63_FLOW.length-1,S.pageIndex))];
 if(focusTheme)v63PreviewTheme(focusTheme.id);
}

/* Keep the existing v0.61 selection actions so committing still uses the
   timestamp-synchronized dual-video crossfade. Only the page renderer changes. */
const v63OpenFlowBase=openFlowThemePage;
openFlowThemePage=function(){
 v63OpenFlowBase();
 const originalItems=[...(S.pageItems||[])];
 setPageHeader('Change Background','Preview with focus/hover. Select a color to apply it; leaving restores the saved background.', 'assets/skin/flow/function/setting.png');
 S.pageItems=originalItems.map((item,i)=>({...item,action:()=>{
  const out=item.action?.();
  /* v0.61 commits S.theme and performs the real Flow-video crossfade. */
  setTimeout(()=>{if(v63IsBackgroundPage())v63PreviewTheme(v63CommittedId())},0);
  return out;
 }}));
 S.pageCustom=v63RenderCards;
 const n=V63_FLOW.findIndex(t=>t.id===v63CommittedId());S.pageIndex=n>=0?n:0;
 v63SetPagePalette(v63CommittedId());
 renderPage();
};

/* Rename the entry without restoring the removed static/game backgrounds. */
openThemeRootPage=function(){
 openPage({title:'Themes',subtitle:`${v26UiModeLabel()} UI · Classic uses animated Flow only; Modern keeps its own glitter style.`,icon:'assets/skin/flow/function/setting.png',items:[
  {title:'UI Mode',note:v26UiModeLabel(),action:openUiModePage},
  {title:'Change Background',note:themeLabel(),action:openFlowThemePage},
  {title:'System Sound Theme',note:v22SoundThemeLabel(),action:openSoundThemePage},
  {title:'Boot Audio',note:v22BootAudioLabel(),action:openBootAudioPage}
 ]},true);
};

/* Controller/keyboard navigation re-renders custom pages. Re-apply preview
   from the selected index after any move so focus navigation previews too. */
const v63MovePageBase=movePage;
movePage=function(dx,dy){
 const out=v63MovePageBase(dx,dy);
 if(v63IsBackgroundPage()){
  const t=V63_FLOW[Math.max(0,Math.min(V63_FLOW.length-1,S.pageIndex))];if(t)v63PreviewTheme(t.id);
 }
 return out;
};

/* Leaving without selecting first visibly fades the page back to the committed
   palette, then returns to Themes. The real Flow video was never touched. */
const v63BackPageBase=backPage;
backPage=function(){
 if(v63IsBackgroundPage()&&v63Leaving)return;
 if(v63IsBackgroundPage()&&!v63Leaving){
  v63Leaving=true;v63RestoreCommittedPreview();
  setTimeout(()=>{
   const out=v63BackPageBase();
   v63ClearPreview();v63Leaving=false;
   return out;
  },280);
  return;
 }
 v63ClearPreview();
 return v63BackPageBase();
};
})();
