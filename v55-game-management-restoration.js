'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DorukStationV55GameManagement=api;
  if(typeof document!=='undefined'&&typeof window!=='undefined'){
    try{api.installBrowser()}catch(err){console.error('[DorukStation v0.55 game management]',err)}
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function normalizeFolder(folder){
    let f=String(folder||'users/unselected/').replace(/\\/g,'/').replace(/^\/+/, '');
    if(!f.endsWith('/'))f+='/';
    return f;
  }
  function folderLayout(folder){
    const user=normalizeFolder(folder);
    return {user,shell:user+'shell/',games:user+'games/',imported:user+'imported/'};
  }
  function isOwnedUserApp(app,profileId){
    return !!app&&app.userAdded===true&&String(app.ownerProfileId||'')===String(profileId||'');
  }
  function managementItems(folder){
    const f=normalizeFolder(folder);
    return [
      {id:'add-custom-game',title:'Add Custom Game',note:'Choose a standalone .html game for this user.'},
      {id:'games-folder',title:'Games Folder',note:'Global installs: games/<game-name>/index.html (legacy games/*.html also works).'},
      {id:'user-folder',title:'User Folder',note:f}
    ];
  }
  function installBrowser(){
    if(window.__ds55GameManagementInstalled)return;
    window.__ds55GameManagementInstalled=true;
    window.__dorukstationVersion='0.55';
    document.title='DorukStation — v0.55';

    function currentFolder(){
      try{return typeof folderForProfile==='function'?folderForProfile(currentProfile):'users/unselected/'}catch{return 'users/unselected/'}
    }
    function openInfo(title,subtitle,items){
      if(typeof openPage!=='function')return;
      openPage({title,subtitle,returnZone:'home',items},true);
    }

    window.v55OpenCustomGamePicker=function(){
      const picker=document.querySelector('#htmlPicker');
      try{if(!picker||typeof currentProfile==='undefined'||!currentProfile)return}catch{return}
      picker.dataset.mode='new';
      picker.click();
    };
    window.v55OpenGamesFolderInfo=function(){
      openInfo('Games Folder','Global installs · each game may live in its own folder',[{
        title:'Recommended layout',note:'games/<game-name>/index.html',disabled:true
      },{
        title:'Legacy layout',note:'games/Game.html is still supported',disabled:true
      },{
        title:'Assets stay with the game',note:'Put icon.png and other game files beside index.html',disabled:true
      },{
        title:'Refresh installed games',note:'Run ./refresh-games.py or ./serve.sh after adding/removing folder games',disabled:true
      },{
        title:'Save data',note:'Installed game files are global; saves remain isolated to the active DorukStation user',disabled:true
      }]);
    };
    window.v55OpenUserFolderInfo=function(){
      const layout=folderLayout(currentFolder());
      openInfo('User Folder',layout.user,[
        {title:'User Folder',note:layout.user,disabled:true},
        {title:'Shell Settings',note:layout.shell,disabled:true},
        {title:'Game Save Namespace',note:layout.games+'<game-id>/',disabled:true},
        {title:'Imported HTML Apps',note:layout.imported+'(session-local app list; saves remain user-scoped)',disabled:true}
      ]);
    };

    /* Re-assert per-user Home-folder preferences whenever Library opens. This
       keeps Add/Remove from Games Folder tied to the active profile, even after
       a live user or UI-mode switch. */
    if(typeof openLibraryPage==='function'){
      const base=openLibraryPage;
      openLibraryPage=function(...args){
        try{if(typeof v18ApplyFolderPrefs==='function')v18ApplyFolderPrefs()}catch{}
        return base(...args);
      };
    }

    /* Guard against a stale imported-app list leaking across a profile switch.
       v18 already owns the real stash/restore flow; this is only a consistency
       check at render time and does not persist imported HTML between reloads. */
    if(typeof renderHome==='function'){
      const base=renderHome;
      renderHome=function(...args){
        try{
          if(currentProfile&&Array.isArray(apps)){
            for(let i=apps.length-1;i>=0;i--){
              const a=apps[i];
              if(a?.userAdded&&!isOwnedUserApp(a,currentProfile.id))apps.splice(i,1);
            }
            if(typeof ensureLibraryLast==='function')ensureLibraryLast();
          }
        }catch{}
        const out=base(...args);document.title='DorukStation — v0.55';return out;
      };
    }
    if(typeof updateDebug==='function'){
      const base=updateDebug;
      updateDebug=function(...args){
        const out=base(...args),d=document.querySelector('#debug');
        if(d&&!d.classList.contains('hidden')){
          d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.55');
          d.textContent+='\ngameManagement=v55 custom-html=per-user folder-games=global structured-folders=enabled';
        }
        return out;
      };
    }
  }
  return {normalizeFolder,folderLayout,isOwnedUserApp,managementItems,installBrowser};
});
