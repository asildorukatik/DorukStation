const assert = require('assert');
const api = require('../v65-os-sync-external-media.js');

assert.equal(api.slug('My Game!!'), 'my-game');
assert.equal(api.detectGameKind('game.iso'), 'iso');
assert.equal(api.detectGameKind('game.AppImage'), 'native');
assert.equal(api.detectGameKind('index.html'), 'html');
assert.equal(api.detectGameKind('zelda.gba'), 'rom');

assert.equal(api.mediaBadgeFor({externalTemporary:true, mediaType:'cd'}), 'assets/system/media/CD-Normal.svg');
assert.equal(api.mediaBadgeFor({externalTemporary:true, mediaType:'iso'}), 'assets/system/media/External-Iso_file.svg');
assert.equal(api.mediaBadgeFor({externalTemporary:true, mediaType:'usb'}), 'assets/system/media/External-Icon.svg');
assert.equal(api.mediaBadgeFor({externalTemporary:false, mediaType:'usb'}), '');

assert.equal(api.isHiddenHelperApp({systemHelper:true,name:'VLC'}), true);
assert.equal(api.isHiddenHelperApp({role:'runtime',name:'RetroArch'}), true);
assert.equal(api.isHiddenHelperApp({bundledEssential:true,name:'VLC media player'}), true);
assert.equal(api.isHiddenHelperApp({bundledEssential:false,name:'VLC media player'}), false);
assert.equal(api.isHiddenHelperApp({name:'My Game'}), false);

const normalized = api.normalizeSystemApp({id:'foo',name:'Foo Game',kind:'game',iconUrl:'foo.png'});
assert.equal(normalized.id, 'os-foo');
assert.equal(normalized.osManaged, true);
assert.equal(normalized.nativeLaunch, true);
assert.equal(normalized.image, 'foo.png');

const ext = api.normalizeExternalGame({id:'disc-game',name:'Disc Game',mediaType:'cd',iconUrl:'disc.png',sourceId:'sr0'});
assert.equal(ext.externalTemporary, true);
assert.equal(ext.mediaType, 'cd');
assert.equal(ext.inFolder, false);
assert.equal(ext.nativeLaunch, true);

assert.equal(api.clockMask(0), 'conic-gradient(from -90deg, transparent 0 0%, rgba(0,0,0,.64) 0% 100%)');
assert.equal(api.clockMask(50), 'conic-gradient(from -90deg, transparent 0 50%, rgba(0,0,0,.64) 50% 100%)');
assert.equal(api.clockMask(100), 'none');

console.log('v65-os-sync tests: PASS');
