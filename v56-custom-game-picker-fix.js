'use strict';
(function(){
  if(typeof window==='undefined'||window.__ds56CustomGamePickerFixInstalled)return;
  window.__ds56CustomGamePickerFixInstalled=true;
  window.__dorukstationVersion='0.56';
  document.title='DorukStation — v0.56';

  if(typeof renderHome==='function'){
    const base=renderHome;
    renderHome=function(...args){
      const out=base(...args);
      document.title='DorukStation — v0.56';
      return out;
    };
  }
  if(typeof updateDebug==='function'){
    const base=updateDebug;
    updateDebug=function(...args){
      const out=base(...args),d=document.querySelector('#debug');
      if(d&&!d.classList.contains('hidden')){
        d.textContent=d.textContent.replace(/^v0\.\d+/m,'v0.56');
        if(!d.textContent.includes('customGamePicker=v56'))d.textContent+='\ncustomGamePicker=v56 trusted-native-picker-routing';
      }
      return out;
    };
  }
})();
