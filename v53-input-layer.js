'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DorukStationV53InputLayer=api;
  if(typeof document!=='undefined'&&typeof window!=='undefined'){
    try{api.installBrowser()}catch(err){console.error('[DorukStation v0.53 input layer]',err)}
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const PRIORITY=[
    'digitalKeyboard','shareMenu','quickMenu','controllerGate','appSurface',
    'avatarPicker','createChoice','createUser','userSelect','controlCenter','rightMenu','pageView','shell'
  ];

  function resolveOwner(flags={}){
    for(const k of PRIORITY)if(flags[k])return k;
    return 'shell';
  }

  function isSystemPickerTarget(target){
    if(!target)return false;
    const id=String(target.id||'');
    const tag=String(target.tagName||'').toUpperCase();
    const type=String(target.type||'').toLowerCase();
    return tag==='INPUT'&&type==='file'&&(id==='htmlPicker'||id==='backgroundPicker');
  }

  function ownerAllows(owner,targetKind){
    if(targetKind==='mobileControls')return true;
    if(targetKind==='systemPicker')return owner==='shell'||owner==='pageView'||owner==='rightMenu';
    if(owner==='rightMenu'&&targetKind==='scrim')return true;
    return owner===targetKind || (owner==='shell'&&targetKind==='shell');
  }

  function createReleaseGate(){
    const pressed=new Map();
    let block=false;
    const key=(kind,token)=>kind+':'+String(token);
    return {
      press(kind,token,owner){pressed.set(key(kind,token),{kind,token,owner})},
      release(kind,token){pressed.delete(key(kind,token))},
      ownerChanged(before,after){if(before!==after&&pressed.size)block=true},
      blocked(){return block},
      canActivate(kind,token){return !block || !pressed.has(key(kind,token))},
      flush(){if(!pressed.size)block=false},
      activeCount(){return pressed.size}
    };
  }

  function installBrowser(){
    if(window.__ds53InputLayerInstalled)return;
    window.__ds53InputLayerInstalled=true;

    const $=s=>document.querySelector(s);
    const roots={
      controllerGate:'#controllerGate',digitalKeyboard:'#digitalKeyboard',avatarPicker:'#avatarPicker',
      createUser:'#createUserView',createChoice:'#createUserChoice',userSelect:'#userSelect',
      shareMenu:'#shareMenuOverlay',quickMenu:'#quickMenuOverlay',controlCenter:'#v40ControlCenter',
      rightMenu:'#rightMenu',pageView:'#pageView',appSurface:'#appSurface',shell:'#cameraLayer'
    };
    const inertKeys=['controllerGate','digitalKeyboard','avatarPicker','createUser','createChoice','userSelect','shareMenu','quickMenu','controlCenter','rightMenu','pageView','appSurface','shell'];
    const gate=createReleaseGate();
    let lastOwner='shell';

    function visible(el){return !!el&&!el.classList.contains('hidden')}
    function flags(){
      const out={shell:true};
      for(const [k,sel] of Object.entries(roots))if(k!=='shell')out[k]=visible($(sel));
      return out;
    }
    function currentOwner(){return resolveOwner(flags())}
    function ownerElement(owner){return $(roots[owner]||roots.shell)}
    function isExiting(owner){
      const el=ownerElement(owner);return !!el&&(el.classList.contains('ui-exit-forward')||el.classList.contains('ui-exit-back'));
    }
    function targetKind(target){
      const el=target&&target.nodeType===1?target:target?.parentElement;
      if(!el)return 'shell';
      if(isSystemPickerTarget(el))return 'systemPicker';
      if(el.closest?.('#mobileControls'))return 'mobileControls';
      if(el.closest?.('#scrim'))return 'scrim';
      for(const k of PRIORITY){
        if(k==='shell')continue;
        const rootEl=$(roots[k]);if(rootEl&&(el===rootEl||rootEl.contains(el)))return k;
      }
      return 'shell';
    }
    function syncInert(owner){
      for(const k of inertKeys){
        const el=$(roots[k]);if(!el)continue;
        const active=(k===owner);
        if(k==='shell'&&owner==='shell')el.inert=false;
        else el.inert=!active;
      }
      const mobile=$('#mobileControls');if(mobile)mobile.inert=false;
      document.body.dataset.ds53Owner=owner;
    }
    function sync(){
      const now=currentOwner();
      if(now!==lastOwner)gate.ownerChanged(lastOwner,now);
      lastOwner=now;syncInert(now);return now;
    }
    function blockEvent(ev){ev.preventDefault?.();ev.stopImmediatePropagation?.();ev.stopPropagation?.()}

    document.addEventListener('pointerdown',ev=>{
      const owner=sync(),kind=targetKind(ev.target);
      gate.press('pointer',ev.pointerId??0,owner);
      if(!ownerAllows(owner,kind)||isExiting(owner))blockEvent(ev);
    },true);
    const releasePointer=ev=>{
      const owner=sync(),kind=targetKind(ev.target);
      if(!ownerAllows(owner,kind)||isExiting(owner))blockEvent(ev);
      gate.release('pointer',ev.pointerId??0);
      requestAnimationFrame(()=>{gate.flush();sync()});
    };
    document.addEventListener('pointerup',releasePointer,true);
    document.addEventListener('pointercancel',releasePointer,true);
    document.addEventListener('click',ev=>{
      const owner=sync(),kind=targetKind(ev.target);
      if(gate.blocked()||!ownerAllows(owner,kind)||isExiting(owner))blockEvent(ev);
    },true);
    document.addEventListener('focusin',ev=>{
      const owner=sync(),kind=targetKind(ev.target);
      if(ownerAllows(owner,kind)&&!isExiting(owner))return;
      try{ev.target?.blur?.()}catch{}
    },true);

    const obs=new MutationObserver(()=>sync());
    obs.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});

    function wrapGlobal(name,router){
      const base=window[name];
      if(typeof base!=='function')return;
      window[name]=function(...args){return router(base,args)};
    }
    function routeAction(base,args,kind){
      const owner=sync();
      if(isExiting(owner)||gate.blocked())return;
      if(kind==='activate'){
        if(owner==='rightMenu')return typeof window.activateMenu==='function'?window.activateMenu():undefined;
        if(owner==='pageView')return typeof window.activatePage==='function'?window.activatePage():undefined;
        if(owner==='appSurface')return;
        if(owner==='userSelect')return typeof window.activateUserSelection==='function'?window.activateUserSelection():undefined;
        if(owner==='createChoice')return typeof window.activateCreateChoice==='function'?window.activateCreateChoice():undefined;
        if(owner==='createUser')return typeof window.activateCreateUser==='function'?window.activateCreateUser():undefined;
        if(owner==='avatarPicker')return;
        if(owner==='quickMenu')return typeof window.activateQuickMenu==='function'?window.activateQuickMenu():undefined;
        if(owner==='shareMenu')return typeof window.activateShareMenu==='function'?window.activateShareMenu():undefined;
      }
      if(kind==='back'){
        if(owner==='rightMenu')return typeof window.closeMenu==='function'?window.closeMenu():undefined;
        if(owner==='pageView')return typeof window.backPage==='function'?window.backPage():undefined;
        if(owner==='appSurface')return;
      }
      if(kind==='options'&&owner!=='shell')return;
      if(kind==='move'){
        if(owner==='rightMenu')return typeof window.moveMenu==='function'?window.moveMenu(...args):undefined;
        if(owner==='pageView')return typeof window.movePage==='function'?window.movePage(...args):undefined;
        if(owner!=='shell')return;
      }
      return base(...args);
    }
    wrapGlobal('activate',(base,args)=>routeAction(base,args,'activate'));
    wrapGlobal('back',(base,args)=>routeAction(base,args,'back'));
    wrapGlobal('options',(base,args)=>routeAction(base,args,'options'));
    wrapGlobal('move',(base,args)=>routeAction(base,args,'move'));

    window.__ds53InputOwner={current:currentOwner,sync,isExiting,targetKind,gate};
    sync();
  }

  return {resolveOwner,ownerAllows,isSystemPickerTarget,createReleaseGate,installBrowser};
});
