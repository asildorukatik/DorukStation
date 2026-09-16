/* DorukStation Web v0.67 — responsive shell geometry helper */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DorukResponsiveShell=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function cleanSize(value,fallback){
    const n=Number(value);
    return Number.isFinite(n)&&n>0?n:fallback;
  }

  function classifyShellLayout(width,height){
    const w=cleanSize(width,1920),h=cleanSize(height,1080);
    if(h>w*1.05)return 'portrait';
    const aspect=w/h;
    if(w<1200||h<650||aspect<1.5||aspect>2.0)return 'compact';
    return 'wide';
  }

  function stageMetrics(width,height){
    const w=cleanSize(width,1920),h=cleanSize(height,1080);
    const mode=classifyShellLayout(w,h);
    if(mode==='wide'){
      const scale=Math.min(w/1920,h/1080);
      return {mode,width:1920,height:1080,scale,left:'50%',top:'50%',transform:`translate(-50%,-50%) scale(${scale})`,origin:'center center',visibleWidth:1920*scale,visibleHeight:1080*scale};
    }
    return {mode,width:w,height:h,scale:1,left:'0px',top:'0px',transform:'none',origin:'top left',visibleWidth:w,visibleHeight:h};
  }

  function carouselTranslateOffset(focusedOffset,previousTileWidth,mode,index){
    const offset=Math.max(0,Number(focusedOffset)||0);
    const i=Math.max(0,Number(index)||0);
    if(i===0)return offset;
    const previous=Math.max(0,Number(previousTileWidth)||0);
    if(previous<=0)return offset;
    const peek=Math.max(40,Math.min(64,Math.round(previous*.38)));
    return Math.max(0,offset-peek);
  }

  return {classifyShellLayout,stageMetrics,carouselTranslateOffset};
});
