'use strict';
(function(){
  if(window.__ds59ShellPolishInstalled)return;
  window.__ds59ShellPolishInstalled=true;

  function focusedApp(){
    try{
      if(typeof v40FocusedHomeApp==='function')return v40FocusedHomeApp();
      return Array.isArray(apps)?apps[Math.max(0,Math.min(apps.length-1,S.app||0))]:null;
    }catch{return null}
  }
  function syncClassicFocus(){
    const app=focusedApp();
    if(!app)return;
    document.body.dataset.v59FocusedApp=String(app.id||'');
    document.body.dataset.v59FocusedAction=String(app.action||'');
    if(document.body.classList.contains('ui-modern'))return;
    const start=document.querySelector('#startBoxText');
    if(!start)return;
    let running=false;
    try{const e=runningApps?.get?.(app.id);running=!!e&&e.profileId===currentProfile?.id}catch{}
    const label=running?'Resume':(app.action==='news'?'↓':'Start');
    start.textContent=label;
    const box=document.querySelector('#startBox');
    if(box)box.setAttribute('aria-label',app.action==='news'?`Open ${app.name}`:`${label} ${app.name}`);
  }

  const baseRenderHome=typeof renderHome==='function'?renderHome:null;
  if(baseRenderHome)renderHome=function(...args){const out=baseRenderHome(...args);syncClassicFocus();return out};

  window.__dorukstationVersion='0.59';
  document.title='DorukStation — v0.59';
  const baseShowUserSelector=typeof showUserSelector==='function'?showUserSelector:null;
  if(baseShowUserSelector)showUserSelector=function(...args){const out=baseShowUserSelector(...args);document.title='DorukStation — v0.59';return out};

  requestAnimationFrame(syncClassicFocus);
})();
