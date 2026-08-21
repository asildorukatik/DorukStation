"use strict";

/* DorukStation v0.39 supplemental mobile safe-fit patch.
   Kept separate so it can coexist with the newer v0.39 system-settings code. */
(()=>{
  if(window.__dorukstationMobileSafe39)return;
  window.__dorukstationMobileSafe39=true;

  const mobileMode=()=>typeof window.v38InputMode==='function'&&window.v38InputMode()==='mobile';
  const syncBodyMode=()=>document.body?.classList.toggle('input-mobile',mobileMode());

  function fitFramePanels(doc){
    try{
      if(!doc?.documentElement)return;
      const w=doc.defaultView;if(!w)return;
      const mobile=mobileMode();
      doc.documentElement.classList.toggle('ds39-mobile-hosted',mobile);
      const candidates=new Set([
        ...doc.querySelectorAll('.panel,.menuPanel,[role="dialog"],.modal,.dialog,.popup,.settingsPanel,.settings-panel'),
        ...doc.querySelectorAll('.overlay > div:first-child')
      ]);
      for(const el of candidates){
        if(!(el instanceof w.HTMLElement))continue;
        if(el.dataset.ds39Fit==='1'){
          el.style.removeProperty('scale');
          el.style.removeProperty('transform-origin');
          delete el.dataset.ds39Fit;
        }
        if(!mobile)continue;
        const cs=w.getComputedStyle(el);
        if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)continue;
        const r=el.getBoundingClientRect();
        if(r.width<80||r.height<50)continue;
        const vw=Math.max(1,w.innerWidth||doc.documentElement.clientWidth||1);
        const vh=Math.max(1,w.innerHeight||doc.documentElement.clientHeight||1);
        const margin=Math.max(10,Math.min(22,Math.round(Math.min(vw,vh)*.032)));
        const usableW=Math.max(1,vw-margin*2),usableH=Math.max(1,vh-margin*2);
        const close=r.left<margin||r.top<margin||r.right>vw-margin||r.bottom>vh-margin;
        if(!close)continue;
        let factor=Math.min(1,usableW/r.width,usableH/r.height);
        factor=Math.max(.68,Math.min(.96,factor*.985));
        if(factor<.995){
          el.style.setProperty('transform-origin','center center','important');
          el.style.setProperty('scale',factor.toFixed(3),'important');
          el.dataset.ds39Fit='1';
        }
      }
    }catch{}
  }

  function installFrame(iframe){
    if(!iframe||iframe.__dorukstationMobileSafe39)return;
    iframe.__dorukstationMobileSafe39=true;
    const bind=()=>{
      try{
        const doc=iframe.contentDocument,w=iframe.contentWindow;if(!doc||!w)return;
        let style=doc.getElementById('dorukstation-v39-mobile-safe-style');
        if(!style){
          style=doc.createElement('style');
          style.id='dorukstation-v39-mobile-safe-style';
          style.textContent=`
html.ds39-mobile-hosted body{overscroll-behavior:none}
html.ds39-mobile-hosted .overlay{box-sizing:border-box;padding-left:max(10px,env(safe-area-inset-left))!important;padding-right:max(10px,env(safe-area-inset-right))!important;padding-top:max(10px,env(safe-area-inset-top))!important;padding-bottom:max(10px,env(safe-area-inset-bottom))!important}
html.ds39-mobile-hosted .panel,html.ds39-mobile-hosted .menuPanel,html.ds39-mobile-hosted [role="dialog"],html.ds39-mobile-hosted .modal,html.ds39-mobile-hosted .dialog,html.ds39-mobile-hosted .popup{max-width:calc(100vw - 20px)!important;max-height:calc(100dvh - 20px)!important;overflow:auto}
@media (orientation:landscape) and (max-height:560px){html.ds39-mobile-hosted .panel,html.ds39-mobile-hosted .menuPanel{border-radius:min(18px,3vh)!important}}
`;
          (doc.head||doc.documentElement).appendChild(style);
        }
        const run=()=>w.requestAnimationFrame(()=>fitFramePanels(doc));
        if(doc.__dorukstationMobileSafe39Observer)try{doc.__dorukstationMobileSafe39Observer.disconnect()}catch{}
        const mo=new w.MutationObserver(run);
        mo.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open']});
        doc.__dorukstationMobileSafe39Observer=mo;
        w.addEventListener('resize',run,{passive:true});
        w.addEventListener('orientationchange',run,{passive:true});
        run();setTimeout(run,80);setTimeout(run,300);
      }catch{}
    };
    iframe.addEventListener('load',bind);
    bind();
  }

  function refresh(){
    syncBodyMode();
    for(const iframe of document.querySelectorAll('#appSurface iframe')){
      installFrame(iframe);
      try{fitFramePanels(iframe.contentDocument)}catch{}
    }
  }

  function start(){
    if(!document.body||!document.querySelector('#appSurface')||typeof window.v38InputMode!=='function'){
      setTimeout(start,50);return;
    }
    if(typeof window.v38SetInputMode==='function'&&!window.v38SetInputMode.__mobileSafe39Wrapped){
      const base=window.v38SetInputMode;
      const wrapped=function(...args){const out=base.apply(this,args);refresh();return out};
      wrapped.__mobileSafe39Wrapped=true;
      window.v38SetInputMode=wrapped;
    }
    const surface=document.querySelector('#appSurface');
    if(surface&&!surface.__mobileSafe39Observed){
      surface.__mobileSafe39Observed=true;
      new MutationObserver(muts=>{
        for(const m of muts)for(const n of m.addedNodes)if(n?.tagName==='IFRAME')installFrame(n);
      }).observe(surface,{childList:true});
    }
    addEventListener('resize',refresh,{passive:true});
    addEventListener('orientationchange',()=>setTimeout(refresh,80),{passive:true});
    refresh();
  }

  start();
})();
