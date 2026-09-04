'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DorukStationV54ShellRestoration=api;
  if(typeof document!=='undefined'&&typeof window!=='undefined'){
    try{api.installBrowser()}catch(err){console.error('[DorukStation v0.54 shell restoration]',err)}
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function optionsDecision(owner){
    if(owner==='shell')return 'base';
    if(owner==='rightMenu')return 'closeOptions';
    return 'block';
  }
  function homeSectionShortcutBlocked(owner,key){
    const k=String(key||'').toLowerCase();
    if(!['tab','q','e'].includes(k))return false;
    if(owner==='digitalKeyboard')return false;
    return owner==='rightMenu'||owner==='controlCenter'||owner==='quickMenu'||owner==='shareMenu'||owner==='userSelect'||owner==='createChoice'||owner==='createUser'||owner==='avatarPicker';
  }
  function searchKeyboardSound(kind,key){
    if(kind==='move')return 'keyboardMove';
    const k=String(key||'');
    if(kind==='activate')return k==='BACKSPACE'?'keyboardBackspace':'keyboardKey';
    if(kind==='physical'){
      if(k==='Backspace')return 'keyboardBackspace';
      if(k.length===1)return 'keyboardKey';
    }
    return null;
  }

  function installBrowser(){
    if(window.__ds54ShellRestorationInstalled)return;
    window.__ds54ShellRestorationInstalled=true;
    window.__dorukstationVersion='0.54';
    document.title='DorukStation — v0.54';

    const owner=()=>window.__ds53InputOwner?.current?.()||'shell';
    const play=kind=>{try{return typeof v28PlayEvent==='function'?v28PlayEvent(kind):undefined}catch{}};
    const isSearch=()=>!!document.querySelector('#pageView:not(.hidden) .v42-search-layout');
    const focusedSearchKey=()=>document.querySelector('#pageView:not(.hidden) .v42-kb-key.focused');

    /* Search uses the OSK sound bank, not generic shell navigation/select. */
    if(typeof navSound==='function'){
      const base=navSound;
      navSound=function(){if(isSearch()&&focusedSearchKey()){play('keyboardMove');return}return base()};
    }
    if(typeof selectSound==='function'){
      const base=selectSound;
      selectSound=function(){
        const key=isSearch()?focusedSearchKey():null;
        if(key){play(searchKeyboardSound('activate',key.dataset.key||key.textContent||''));return}
        return base();
      };
    }
    document.addEventListener('click',ev=>{
      const key=ev.target?.closest?.('.v42-kb-key');
      if(!key||!isSearch())return;
      play(searchKeyboardSound('activate',key.dataset.key||key.textContent||''));
    },false);
    /* Window capture runs before the older document-capture Search handler,
       including when that handler stops propagation after consuming text. */
    window.addEventListener('keydown',ev=>{
      if(isSearch()){
        const sound=searchKeyboardSound('physical',ev.key);
        if(sound)play(sound);
      }
      if(homeSectionShortcutBlocked(owner(),ev.key)){
        ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation();
      }
    },true);

    /* Keep the full digital keyboard on its dedicated sound set. Older popup
       wrappers also emitted generic popup sounds, causing the OSK cue to be
       masked/doubled. */
    let keyboardClosing=false;
    if(typeof popupOpenSound==='function'){
      const base=popupOpenSound;
      popupOpenSound=function(){if(typeof S!=='undefined'&&S.digitalKeyboardOpen)return;return base()};
    }
    if(typeof popupCloseSound==='function'){
      const base=popupCloseSound;
      popupCloseSound=function(){if(keyboardClosing)return;return base()};
    }
    if(typeof closeDigitalKeyboard==='function'){
      const base=closeDigitalKeyboard;
      closeDigitalKeyboard=function(...args){keyboardClosing=true;try{return base(...args)}finally{keyboardClosing=false}};
    }
    if(typeof v19KeyboardL2==='function'){
      const base=v19KeyboardL2;
      v19KeyboardL2=function(...args){play('changePanel');return base(...args)};
    }

    /* OPTIONS is a toggle for the Options panel. Other foreground layers own
       input completely and therefore do not leak the shortcut to Home. */
    if(typeof options==='function'){
      const base=options;
      options=function(...args){
        const decision=optionsDecision(owner());
        if(decision==='closeOptions'){if(typeof closeMenu==='function')return closeMenu();return}
        if(decision==='block')return;
        return base(...args);
      };
    }

    /* v0.53 correctly made Control Center the foreground owner, but its move
       route had no Control Center branch. Restore left/right controller and
       keyboard navigation without allowing Home to move behind it. */
    if(typeof move==='function'){
      const base=move;
      move=function(dx,dy){
        if(owner()==='controlCenter'){
          if(!dx)return;
          try{
            const items=typeof v40ControlItems==='function'?v40ControlItems():[];
            if(!items.length)return;
            const currentId=typeof quickItems!=='undefined'?quickItems[S.quick]?.id:null;
            let i=Math.max(0,items.findIndex(q=>q.id===currentId));
            i=Math.max(0,Math.min(items.length-1,i+(dx>0?1:-1)));
            if(typeof quickItems!=='undefined')S.quick=Math.max(0,quickItems.findIndex(q=>q.id===items[i].id));
            play('nav');
            if(typeof v40RenderControlCenter==='function')v40RenderControlCenter();
          }catch{}
          return;
        }
        return base(dx,dy);
      };
    }

    /* The Modern Control Center has its own supplied Open/Close Control Center
       cues. Avoid the generic Back sound on close. */
    if(typeof v40OpenControlCenter==='function'){
      const base=v40OpenControlCenter;
      v40OpenControlCenter=function(...args){
        const was=!document.querySelector('#v40ControlCenter')?.classList.contains('hidden');
        const out=base(...args);
        const now=!document.querySelector('#v40ControlCenter')?.classList.contains('hidden');
        if(!was&&now)play('quickMenuOpen');
        return out;
      };
    }
    if(typeof v40CloseControlCenter==='function'){
      const base=v40CloseControlCenter;
      v40CloseControlCenter=function(playSound=true){
        const was=!document.querySelector('#v40ControlCenter')?.classList.contains('hidden');
        const out=base(false);
        if(playSound&&was)play('quickMenuClose');
        return out;
      };
    }

    if(typeof psShortPress==='function'){
      const base=psShortPress;
      psShortPress=function(...args){
        if(owner()==='controlCenter'&&typeof v40CloseControlCenter==='function'){v40CloseControlCenter(true);return}
        return base(...args);
      };
    }

    /* App-switch confirmation gets the actual dialog bank. Yes/No replaces
       the generic select cue for those two buttons. */
    if(typeof requestAppLaunch==='function'){
      requestAppLaunch=function(app){
        const current=getRunningEntry();
        if(!current)return launchApp(app);
        if(current.app.id===app.id&&current.profileId===currentProfile?.id)return resumeApp(app.id);
        play('dialogOpen');
        openAppMenu('Close running application?',[{
          label:`Close ${current.app.name} & Open ${app.name}`,
          note:`${current.app.name} belongs to ${current.profileName||'another user'}. It will be fully closed first.`,
          action:()=>{closeMenu(false);closeRunningApp(current.app.id);launchApp(app)}
        },{
          label:'Cancel',note:`Keep ${current.app.name} suspended and return Home.`,
          action:()=>{closeMenu(false);S.zone='home';render()}
        }]);
      };
    }
    if(typeof activateMenu==='function'){
      const base=activateMenu;
      activateMenu=function(){
        const title=document.querySelector('#menuTitle')?.textContent||'';
        if(title==='Close running application?'){
          const x=S.menuItems[S.menuIndex];if(!x||x.sep||x.disabled)return;
          play(S.menuIndex===0?'dialogYes':'dialogNo');x.action?.();return;
        }
        return base();
      };
    }

    /* Keep the visible version correct despite older render wrappers that
       rewrite the browser title/debug marker. */
    if(typeof renderHome==='function'){
      const base=renderHome;
      renderHome=function(...args){const out=base(...args);document.title='DorukStation — v0.54';return out};
    }
    if(typeof updateDebug==='function'){
      const base=updateDebug;
      updateDebug=function(...args){const out=base(...args),d=document.querySelector('#debug');if(d&&!d.classList.contains('hidden')){d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.54');d.textContent+='\nshellRestoration=v54 search-osk-sfx shortcuts=restored'}return out};
    }
  }

  return {optionsDecision,homeSectionShortcutBlocked,searchKeyboardSound,installBrowser};
});
