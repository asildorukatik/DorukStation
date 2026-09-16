const assert = require('assert');
const fs = require('fs');
const path = require('path');
const responsive = require('../v67-responsive-shell.js');

assert.equal(responsive.classifyShellLayout(1920,1080), 'wide');
assert.equal(responsive.classifyShellLayout(1366,768), 'wide');
assert.equal(responsive.classifyShellLayout(900,900), 'compact');
assert.equal(responsive.classifyShellLayout(820,1180), 'portrait');
assert.equal(responsive.classifyShellLayout(390,844), 'portrait');
assert.equal(responsive.classifyShellLayout(844,390), 'compact');

const wide = responsive.stageMetrics(1366,768);
assert.equal(wide.mode, 'wide');
assert(wide.scale > 0 && wide.scale < 1);
assert.equal(wide.width, 1920);
assert.equal(wide.height, 1080);

const portrait = responsive.stageMetrics(390,844);
assert.equal(portrait.mode, 'portrait');
assert.equal(portrait.scale, 1);
assert.equal(portrait.width, 390);
assert.equal(portrait.height, 844);
assert.equal(portrait.transform, 'none');

const compact = responsive.stageMetrics(900,900);
assert.equal(compact.mode, 'compact');
assert.equal(compact.scale, 1);
assert.equal(compact.width, 900);
assert.equal(compact.height, 900);

const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
assert(appJs.includes('DorukResponsiveShell.stageMetrics'), 'scaleStage must use responsive stage metrics');
assert(appJs.includes('shell-layout-portrait'), 'scaleStage must expose portrait layout state on body');
assert(appJs.includes('shell-layout-compact'), 'scaleStage must expose compact layout state on body');

const css = fs.readFileSync(path.join(__dirname, '..', 'v67-responsive-shell.css'), 'utf8');
assert(css.includes('body.shell-layout-portrait #quickRow'), 'portrait must move quick actions to the top');
assert(css.includes('body.shell-layout-portrait #appCarousel'), 'portrait must have a dedicated app carousel layout');
assert(css.includes('body.shell-layout-portrait .app-icon'), 'portrait must resize app icons directly rather than scaling the whole 16:9 canvas');
assert(css.includes('body.shell-layout-compact #appCarousel'), 'compact layouts need their own carousel sizing');
assert(css.includes('body.shell-layout-portrait #pageView'), 'full function pages must use the real portrait viewport');
assert(css.includes('body.shell-layout-portrait #rightMenu'), 'side menus must fit portrait screens');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(index.includes('v67-responsive-shell.css'), 'responsive CSS must be loaded');
assert(index.includes('v67-responsive-shell.js'), 'responsive shell helper must be loaded');

const ecss = fs.readFileSync(path.join(__dirname, '..', 'v67-device-role-econtroller.css'), 'utf8');
assert(ecss.includes('#eControllerDisconnect'), 'disconnect button styling must exist');
assert(ecss.includes('left:50%'), 'disconnect button must be centered under the E-Controller status/battery display');
assert(ecss.includes('top:max(46px'), 'disconnect button must sit below the top battery/status pill');

console.log('v67 responsive layout tests: PASS');

// v0.67 responsive focus/carousel refinement regression checks.
assert.equal(typeof responsive.carouselTranslateOffset, 'function', 'responsive helper must expose carouselTranslateOffset');
assert.equal(responsive.carouselTranslateOffset(310, 126, 'compact', 2), 262, 'compact carousel should leave ~48 px of the previous tile visible');
assert.equal(responsive.carouselTranslateOffset(250, 100, 'portrait', 1), 210, 'portrait carousel should leave part of the previous tile visible');
assert.equal(responsive.carouselTranslateOffset(0, 126, 'compact', 0), 0, 'first app must not be shifted away from the left edge');
assert(css.includes('body.shell-layout-compact:not(.ui-modern) .app-tile.focused::after'), 'compact Classic focus frame must inherit responsive tile geometry');
assert(css.includes('width:calc(100% - 2px)'), 'responsive Classic focus frame must derive width from focused tile size');
assert(css.includes('height:calc(100% - 6px)'), 'responsive Classic focus frame must derive height from focused tile size');
assert(css.includes('body.shell-layout-compact #appCarousel{\n  left:max(20px,env(safe-area-inset-left));right:0;top:104px'), 'compact carousel must have about 22px more separation from quick actions');
assert(css.includes('body.shell-layout-portrait #appCarousel{\n  left:max(14px,env(safe-area-inset-left));right:0;top:98px'), 'portrait carousel must have about 22px more separation from quick actions');
assert(appJs.includes('DorukResponsiveShell.carouselTranslateOffset'), 'home renderer must use responsive carousel peek helper');

// v0.67 fullscreen-exit / wide-short viewport regression checks.
assert.equal(responsive.classifyShellLayout(1910, 800), 'compact', 'very wide browser windows must use compact layout after leaving fullscreen');
assert.equal(responsive.classifyShellLayout(1920, 900), 'compact', 'aspect ratios above 2.0 must not fall back to fixed wide geometry');
assert.equal(responsive.classifyShellLayout(1600, 900), 'wide', 'normal 16:9 desktop windows should remain wide');
assert(appJs.includes('visualViewport?.width'), 'scaleStage should prefer the settled visual viewport width when available');
assert(appJs.includes('visualViewport?.height'), 'scaleStage should prefer the settled visual viewport height when available');
assert(appJs.includes('visualViewport.addEventListener("resize"'), 'visual viewport resize must trigger layout recalculation after browser chrome changes');
assert(appJs.includes('setTimeout(onViewportResize,120)'), 'fullscreen transition should remeasure after an intermediate settle delay');
assert(appJs.includes('setTimeout(onViewportResize,300)'), 'fullscreen transition should remeasure after the final viewport settles');
