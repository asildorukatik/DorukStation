
'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DorukStationV58WhatsNew=api;
  if(typeof window!=='undefined'&&typeof document!=='undefined'){try{api.installBrowser()}catch(err){console.error('[DorukStation What\'s New v0.58]',err)}}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const RELEASES=[
    {version:'0.59',title:'Classic focus fidelity pass',changes:['Classic Home focused application tiles now expand to roughly 1.7× the normal icon size to match the supplied console references.','The selected tile now uses one large icon-and-action frame, with Start or the What\'s New down-arrow action strip inside it.','Classic app-title placement, Library selection emphasis and Modern focused-game emphasis were refined to match the stronger selection hierarchy.']},
    {version:'0.58',title:'Store browsing & full release history',changes:['Store Search moved to its own top tab while genre categories now filter the Store panel in place.','Focused Store games now enlarge much more clearly.',"What's New rebuilt as a visual release-history page covering every DorukStation web version from v0.6 onward.",'Game Library catalog can now point to lightweight per-game manifest files; game ZIPs may contain only the Game/ folder.']},
    {version:'0.57',title:'DorukStation Store preview',changes:['Added GitHub-backed Store catalog, Classic and Modern Store views, Search, Downloads and game detail pages.','Added browser-storage installs with OPFS/IndexedDB fallback plus optional global or per-game user folders.','Added ZIP download, SHA-256 verification, safe extraction, install states, progress overlays and cancellation.']},
    {version:'0.56',title:'Custom game picker fix',changes:["Fixed foreground input ownership blocking DorukStation's trusted HTML/background file pickers.",'Restored Add Custom Game without weakening panel click-through protection.']},
    {version:'0.55',title:'Game management restoration',changes:['Restored Add Custom Game and per-game folder scanning.','Restored per-user shell/game/imported storage structure and per-user Games Folder membership.']},
    {version:'0.54',title:'Shell shortcuts & audio restoration',changes:['Restored keyboard-exclusive UI sounds, Search keyboard sounds and Shift/Caps feedback.','Restored Options-as-close behavior, Control Center routing and dedicated dialog/control-center sounds.']},
    {version:'0.53',title:'Foreground input ownership',changes:['Added foreground-owner routing so panels and returning apps block controls behind them.',"Added Modern user-selection glitter, exact DorukCraft icon and Modern-only Sharp's Playroom tile."]},
    {version:'0.52',title:'Wider glitter bank',changes:['Expanded the lower-middle Modern glitter distribution without increasing particle count.']},
    {version:'0.51',title:'Curved glitter motion',changes:['Added longer visible curved drift paths to the lightweight Modern glitter field.']},
    {version:'0.50',title:'NO-GAMES shell updates',changes:['Raised Modern glitter to 264 particles with larger sizing and lower-middle concentration.','Introduced small NO-GAMES shell/patch packages and an initial Close App activation guard.']},
    {version:'0.49',title:'Lightweight glitter restored',changes:['Returned Modern glitter to a 220-particle CSS/DOM implementation with varied size and speed for better performance.']},
    {version:'0.48',title:'Reduced canvas glitter',changes:['Reduced the canvas glitter load after the first heavy implementation, though it remained too costly on slower hardware.']},
    {version:'0.47',title:'Canvas glitter experiment',changes:['Introduced a dense animated canvas glitter field as a visual experiment; later replaced for performance.']},
    {version:'0.46',title:'Compatibility maintenance',changes:['Consolidated the user-supplied canonical shell build and compatibility fixes before the glitter performance series.']},
    {version:'0.45',title:'Modern Settings redesign',changes:['Reworked Modern Settings toward the PS5-inspired visual language and removed Themes from Modern Settings.','Added launch/dialog guards and refined Modern illumination styling.']},
    {version:'0.44',title:'Lightweight Modern glitter',changes:['Replaced line/plus background experiments with actual lightweight glitter particles.']},
    {version:'0.43',title:'Mode-switch cleanup',changes:['Fixed raw Modern elements appearing when switching back to Classic and tested a new Modern background atmosphere.']},
    {version:'0.42',title:'Search keyboard & scroll follow',changes:['Added the Modern Search on-screen keyboard and automatic focus-follow scrolling.']},
    {version:'0.41',title:'Modern UI bugfix pass',changes:['Fixed Play/Open positioning, mode persistence, top Search navigation, Library navigation, duplicate hero overlays and stale version text.']},
    {version:'0.40',title:'PS5-inspired Modern pass',changes:['Reworked Modern Home with Games/Media tabs, top-right Search/Settings/Profile and Control Center behavior.','Added richer Media and Library presentations.']},
    {version:'0.39',title:'Mobile safe-fit',changes:['Improved mobile controller layout and short-landscape safe fitting.']},
    {version:'0.38',title:'Persistent input mode',changes:["Added persistent Mobile Touch, PC and Controller modes selected by the user's first meaningful input or Settings."]},
    {version:'0.37',title:'Mobile touch controller',changes:['Added the full virtual controller with D-pad, sticks, face buttons, shoulders, Share, Home and Options.']},
    {version:'0.36',title:'Game audio compatibility',changes:['Removed game setSinkId interception so embedded games keep reliable browser audio/user activation.']},
    {version:'0.35',title:'External Dungeons audio',changes:['Moved Dungeons music to external files as the baseline for GitHub Pages-compatible builds.']},
    {version:'0.34',title:'Home cleanup & custom icons',changes:['Cleaned the Home layout, improved custom icon handling and added Modern glitter foundations.']},
    {version:'0.33',title:'Dungeons integration',changes:['Integrated DorukCraft Dungeons with per-user data and game artwork.']},
    {version:'0.32',title:'DorukCraft presentation update',changes:['Updated the bundled DorukCraft build and added focused-game background/banner presentation.']},
    {version:'0.31',title:'Suspended audio lifecycle',changes:['Paused game media when suspended and restored it correctly on resume.']},
    {version:'0.30',title:'Input blocker fix',changes:['Fixed a stuck input-blocking state that could leave resumed games unable to receive controls.']},
    {version:'0.29',title:'Strict controller routing',changes:['Enforced controller ownership and same-origin gamepad routing with no unassigned fallback.']},
    {version:'0.28',title:'Keyboard/audio/branding pass',changes:['Made the on-screen keyboard click-activated, expanded semantic UI audio coverage and tightened DorukStation branding.']},
    {version:'0.27',title:'DorukStation logo',changes:['Integrated the DorukStation logo assets into the shell.']},
    {version:'0.26',title:'Classic & Modern modes',changes:['Introduced separate Classic and Modern shell modes.']},
    {version:'0.25',title:'Games scanner & srcdoc',changes:['Added game-folder scanning, manifest generation and file:// srcdoc support for local HTML games.']},
    {version:'0.24',title:'Modal and avatar loading fixes',changes:['Improved modal behavior and lazy-loaded avatar assets.']},
    {version:'0.23',title:'Audio-output experiment',changes:['Added an audio-output routing experiment for selectable playback devices.']},
    {version:'0.22',title:'System sound pack',changes:['Integrated the larger Classic and Modern DorukStation system sound packs.']},
    {version:'0.21',title:'Avatars & shell sounds',changes:['Expanded avatar presentation and added more shell sound feedback.']},
    {version:'0.20',title:'Startup & R2 Enter',changes:['Improved controller-first startup and added R2 as Enter in the digital keyboard.']},
    {version:'0.19',title:'Controller-first interaction',changes:['Improved controller-first startup, avatar selection, keyboard navigation and held-direction repeat.']},
    {version:'0.18',title:'Reconnect, themes & OSK',changes:['Added controller reconnect handling, user/theme improvements and on-screen keyboard functionality.']},
    {version:'0.17',title:'Gamepad slot compaction',changes:['Compacted routed gamepads so assigned controllers can appear as gamepad slot 0 to games.']},
    {version:'0.16',title:'Multi-controller profiles',changes:['Added multi-controller ownership, avatars and controller battery presentation.']},
    {version:'0.15',title:'Folders, Guest & transitions',changes:['Added 1-second Home hold behavior, folders, temporary Guest handling and smoother transitions.']},
    {version:'0.14',title:'Home-button hold',changes:['Introduced hold detection for the DorukStation/Home button.']},
    {version:'0.13',title:'User & system panels',changes:['Added users, Quick Menu, Share and Settings flows.']},
    {version:'0.12',title:'Per-user saves',changes:['Added separate save namespaces for DorukStation users.']},
    {version:'0.11',title:'Single-app suspend model',changes:['Established one running application at a time with suspend/resume behavior.']},
    {version:'0.10',title:'Focused action button',changes:['Added the primary action button for the currently focused Home application.']},
    {version:'0.9',title:'Attached focus highlight',changes:['Attached the Home focus highlight directly to the selected application tile.']},
    {version:'0.8',title:'Fullscreen viewport',changes:['Expanded applications to a true full-viewport presentation.']},
    {version:'0.7',title:'Full-bleed shell',changes:['Expanded the early DorukStation shell into a full-bleed console-style layout.']},
    {version:'0.6',title:'Recovered base shell',changes:['Established the recovered DorukStation web shell used as the base for later versions.']}
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function renderReleaseCard(release,index,focused=false){
    return `<button class="v58-release-card${focused?' focused':''}" data-v58-release-index="${index}" type="button"><div class="v58-release-version">v${esc(release.version)}</div><div class="v58-release-body"><h3>${esc(release.title)}</h3><ul>${release.changes.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div></button>`;
  }
  function renderWhatsNewMarkup(state={},modern=false){
    const latest=RELEASES[0],focus=Math.max(0,Math.min(RELEASES.length-1,Number(state.focusIndex)||0));
    const cards=RELEASES.map((r,i)=>renderReleaseCard(r,i,i===focus)).join('');
    return `<section class="v58-whats-new ${modern?'v58-whats-new-modern':'v58-whats-new-classic'}"><div class="v58-whats-new-hero"><div class="v58-whats-new-kicker">LATEST DORUKSTATION UPDATE</div><div class="v58-whats-new-version">v${esc(latest.version)}</div><h1>${esc(latest.title)}</h1><p>${esc(latest.changes[0])}</p><div class="v58-whats-new-badges"><span>${RELEASES.length} web releases</span><span>v0.6 → v${esc(latest.version)}</span></div></div><div class="v58-whats-new-heading"><h2>Version History</h2><span>Every DorukStation Web release</span></div><div class="v58-release-timeline">${cards}</div><footer class="v58-news-footer"><span>↑ ↓ Browse versions · ○ Back</span><span>${esc(state.username||'User')}</span></footer></section>`;
  }
  function installBrowser(){
    if(window.__ds58WhatsNewInstalled)return;window.__ds58WhatsNewInstalled=true;
    const isModern=()=>{try{return typeof v40CanUseModernHome==='function'?!!v40CanUseModernHome():document.body.classList.contains('ui-modern')}catch{return false}};
    function openWhatsNew(){
      document.body.classList.add('v58-news-open');
      const items=RELEASES.map(r=>({title:`v${r.version} ${r.title}`,note:r.changes[0],action:()=>{}}));
      const render=body=>{
        const username=(()=>{try{return currentProfile?.name||S?.username||'User'}catch{return'User'}})();
        body.innerHTML=renderWhatsNewMarkup({focusIndex:S.pageIndex,username},isModern());
        body.querySelectorAll('[data-v58-release-index]').forEach(el=>el.addEventListener('click',()=>{S.pageIndex=Number(el.dataset.v58ReleaseIndex)||0;renderPage()}));
        requestAnimationFrame(()=>{try{body.querySelector('.v58-release-card.focused')?.scrollIntoView({block:'nearest',behavior:'smooth'})}catch{}});
      };
      render.__v58WhatsNew=true;
      openPage({title:"What's New",subtitle:'DorukStation release history.',icon:'assets/skin/now.png',returnZone:'home',items,mode:'list',renderCustom:render});
    }
    window.openDorukStationWhatsNew=openWhatsNew;
    const base=typeof activateApp==='function'?activateApp:null;
    if(base)activateApp=function(app){if(app?.id==='whatsnew'||app?.action==='news'){try{selectSound?.()}catch{}openWhatsNew();return}return base(app)};
    const baseBack=typeof backPage==='function'?backPage:null;
    if(baseBack)backPage=function(){const out=baseBack();requestAnimationFrame(()=>{try{if(!(S.pageOpen&&S.pageCustom?.__v58WhatsNew))document.body.classList.remove('v58-news-open')}catch{document.body.classList.remove('v58-news-open')}});return out};
  }
  return {RELEASES,renderReleaseCard,renderWhatsNewMarkup,installBrowser};
});
