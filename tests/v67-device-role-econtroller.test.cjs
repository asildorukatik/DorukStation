const assert = require('assert');
const fs = require('fs');
const path = require('path');
const api = require('../v67-device-role-econtroller.js');

assert.equal(api.normalizeDeviceRole('station'), 'station');
assert.equal(api.normalizeDeviceRole('controller'), 'controller');
assert.equal(api.normalizeDeviceRole('permanent-station'), 'permanent-station');
assert.equal(api.normalizeDeviceRole('garbage'), '');

assert.equal(api.inputModeFromActivation({source:'pointer', pointerType:'touch'}), 'mobile');
assert.equal(api.inputModeFromActivation({source:'pointer', pointerType:'pen'}), 'mobile');
assert.equal(api.inputModeFromActivation({source:'pointer', pointerType:'mouse'}), 'pc');
assert.equal(api.inputModeFromActivation({source:'keyboard'}), 'pc');
assert.equal(api.inputModeFromActivation({source:'gamepad'}), 'controller');

const permanentCopy = api.permanentStationGateCopy();
assert.equal(permanentCopy.title, 'Press any input to play');
assert(permanentCopy.top.includes('No controller is required'));
assert(permanentCopy.hint.includes('Touch → Mobile'));
assert(permanentCopy.hint.includes('Keyboard / Mouse → PC'));
assert(permanentCopy.hint.includes('Controller → Controller'));
assert(permanentCopy.status.includes('Permanent DorukStation'));

const v62 = fs.readFileSync(path.join(__dirname, '..', 'v62-theme-surfaces-startup.js'), 'utf8');
assert(v62.includes('window.v62SetStartupPhase=v62SetStartupPhase'), 'v0.62 must expose its startup phase setter to later startup layers');
assert(v62.includes('window.v62HidePreloginSurfacesNow=v62HidePreloginSurfacesNow'), 'v0.62 must expose pre-login surface cleanup to later startup layers');

assert.equal(api.normalizePairingCode(' 12-34 56 '), '123456');
assert.equal(api.normalizePairingCode('abc'), '');
assert.equal(api.peerIdForCode('123456'), 'dorukstation-econtroller-123456');


assert.equal(api.normalizeStationId('qfra'), 'QFRA');
assert.equal(api.normalizeStationId('QFRA'), 'QFRA');
assert.equal(api.normalizeStationId('QF1A'), '');
assert.equal(api.normalizeStationId('ABCDE'), '');
assert.equal(api.stationDisplayNameForId('QFRA'), 'DorukStation - QFRA');
assert.equal(api.isValidDiscoveryResponse({type:'station-available',protocol:2,searchNonce:'search-1',stationId:'QFRA',code:'123456',instanceId:'station-instance'}, 'search-1'), true);
assert.equal(api.isValidDiscoveryResponse({type:'station-available',protocol:2,searchNonce:'wrong',stationId:'QFRA',code:'123456',instanceId:'station-instance'}, 'search-1'), false, 'stale or unrelated searches must be ignored');
assert.equal(api.isValidDiscoveryResponse({type:'station-available',protocol:1,searchNonce:'search-1',stationId:'QFRA',code:'123456',instanceId:'station-instance'}, 'search-1'), false, 'legacy permissive discovery broadcasts must be ignored');
assert.equal(api.isValidDiscoveryResponse({type:'station-available',protocol:2,searchNonce:'search-1',stationId:'',code:'123456',instanceId:'station-instance'}, 'search-1'), false, 'a valid station ID is required');

const pad = api.createRemoteGamepad(2, 'Phone E-Controller');
assert.equal(pad.index, 2);
assert.equal(pad.connected, true);
assert.equal(pad.mapping, 'standard');
assert.equal(pad.buttons.length, 17);
assert.deepEqual(pad.axes, [0,0,0,0]);

api.applyRemoteState(pad, {
  axes:[0.5,-0.25,0.1,-1],
  buttons:Array.from({length:17}, (_,i)=>i===0?1:(i===7?0.75:0))
});
assert.equal(pad.axes[0], 0.5);
assert.equal(pad.axes[3], -1);
assert.equal(pad.buttons[0].pressed, true);
assert.equal(pad.buttons[0].value, 1);
assert.equal(pad.buttons[7].pressed, true);
assert.equal(pad.buttons[7].value, 0.75);
assert.equal(pad.buttons[1].pressed, false);

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(index.includes('v67-device-role-econtroller.css'));
assert(index.includes('peerjs@1.5.5/dist/peerjs.min.js'));
assert(index.includes('v67-device-role-econtroller.js'));
assert(index.includes('id="deviceRoleGate"'));
assert(index.includes('id="eControllerPair"'));
assert(index.includes('id="eControllerApproval"'));



assert.equal(api.shouldShowHostPairingUi({sessionRole:'station', zone:'home', appSurface:false, pageOpen:false, quickMenuOpen:false, shareMenuOpen:false, userSelectOpen:false, loggedIn:true}), true);
assert.equal(api.shouldShowHostPairingUi({sessionRole:'station', zone:'home', appSurface:true, loggedIn:true}), false, 'pairing UI must hide while a game/app is open');
assert.equal(api.shouldShowHostPairingUi({sessionRole:'station', zone:'top', appSurface:false, loggedIn:true}), false, 'pairing UI belongs only on Home');
assert.equal(api.shouldShowHostPairingUi({sessionRole:'station', zone:'home', appSurface:false, loggedIn:false}), false, 'pairing UI must not appear before user login');
assert.equal(api.shouldShowHostPairingUi({sessionRole:'permanent-station', zone:'home', appSurface:false}), true);
assert.equal(api.shouldShowHostPairingUi({sessionRole:'controller', zone:'home', appSurface:false}), false);

const css = fs.readFileSync(path.join(__dirname, '..', 'v67-device-role-econtroller.css'), 'utf8');
assert(css.includes('body.v67-econtroller-mode #eControllerPair{visibility:visible!important'), 'pairing UI must remain visible even when the station viewport is hidden');
assert(css.includes('body.v67-econtroller-mode #mobileControls{visibility:visible!important'), 'controller controls must be able to become visible after pairing');
assert(index.includes('id="eControllerRefreshLan"'), 'E-Controller must expose a Refresh LAN action');
assert(index.includes('Refresh LAN'), 'Refresh LAN copy must be visible');
assert(index.includes('id="eControllerDiscoveryResults"'), 'E-Controller must render a list of discovered DorukStations');
assert(index.includes('id="eControllerHostStationId"'), 'DorukStation Home must show its four-letter DorukStation ID below the pairing code');
const v67 = fs.readFileSync(path.join(__dirname, '..', 'v67-device-role-econtroller.js'), 'utf8');
assert(v67.includes("new win.BroadcastChannel(DISCOVERY_CHANNEL)"), 'same-browser DorukStation tabs must support discovery');
assert(v67.includes("searchNonce"), 'discovery messages must be tied to the active search nonce');
assert(v67.includes("protocol:2"), 'new discovery must use protocol 2');
assert(v67.includes("station-id-conflict"), 'duplicate four-letter IDs must trigger collision resolution during discovery');
assert(v67.includes("refreshLanButton?.addEventListener('click'"), 'Refresh LAN must rerun discovery');
assert(!v67.includes("discoveryAnnounceTimer=setInterval(announceStationPresence,1200)"), 'stations must not continuously advertise themselves without a search');
assert(v67.includes("if(activeApproval||!approvalQueue.length||!isStationHome())return"), 'pairing approval must not interrupt games/apps');



assert.equal(api.normalizeBatteryPercent(0.78), 78);
assert.equal(api.normalizeBatteryPercent(78), 78);
assert.equal(api.normalizeBatteryPercent(-1), 0);
assert.equal(api.normalizeBatteryPercent(150), 100);
assert.equal(api.normalizeBatteryPercent(null), null);
assert.equal(api.controllerDeviceName('iPhone E-Controller'), 'iPhone');
assert.equal(api.controllerDeviceName('Android E-Controller'), 'Android');
assert.equal(api.disconnectingTitle('iPhone E-Controller'), 'E-Controller iPhone is disconnecting!');
assert.equal(api.disconnectedTitle('iPhone E-Controller'), 'E-Controller iPhone Disconnected');
assert(index.includes('id="eControllerDisconnect"'), 'connected E-Controller UI needs a hold-to-disconnect button');
assert(index.includes('Hold 2 seconds to disconnect'), 'disconnect button must explain the 2 second hold');
assert(v67.includes("msg.type==='battery'"), 'host must accept E-Controller battery updates');
assert(v67.includes("msg.type==='disconnecting'"), 'host must show a disconnecting notification on press');
assert(v67.includes("msg.type==='disconnect-request'"), 'host must process the completed 2 second disconnect hold');
assert(v67.includes('navigator.getBattery'), 'E-Controller client should report device battery when the browser exposes it');


// v0.67 web-first combined discovery UI
assert(index.includes('id="eControllerRefreshLan"'), 'E-Controller needs a dedicated Refresh LAN button');
assert(index.includes('id="eControllerSearchBluetooth"'), 'E-Controller needs a separate Search Bluetooth button');
assert.equal(api.normalizeDiscoveryTransport('lan'), 'lan');
assert.equal(api.normalizeDiscoveryTransport('bluetooth'), 'bluetooth');
assert.equal(api.normalizeDiscoveryTransport('web'), 'web');
assert.equal(api.normalizeDiscoveryTransport('garbage'), '');
const merged = new Map();
api.mergeDiscoveredStation(merged,{instanceId:'station-1',stationId:'QFRA',code:'123456',name:'DorukStation - QFRA',transport:'lan'});
api.mergeDiscoveredStation(merged,{instanceId:'station-1',stationId:'QFRA',code:'123456',name:'DorukStation - QFRA',transport:'bluetooth'});
assert.deepEqual([...merged.get('station-1').transports].sort(), ['bluetooth','lan']);
const mergedAcrossIds = new Map();
api.mergeDiscoveredStation(mergedAcrossIds,{instanceId:'lan-instance',stationId:'LMPT',code:'654321',name:'DorukStation - LMPT',transport:'lan'});
api.mergeDiscoveredStation(mergedAcrossIds,{instanceId:'bluetooth-device-9',stationId:'LMPT',name:'DorukStation - LMPT',transport:'bluetooth'});
assert.equal(mergedAcrossIds.size, 1, 'the same four-letter station ID found over LAN and Bluetooth must render once');
assert.deepEqual([...mergedAcrossIds.values()][0].transports.size, 2);
assert(v67.includes('startControllerSearch({automatic:true})'), 'choosing E-Controller should automatically begin local discovery');
assert(v67.includes("refreshLanButton?.addEventListener('click'"), 'Refresh LAN must rerun local discovery');
assert(v67.includes("bluetoothSearchButton?.addEventListener('click'"), 'Bluetooth must have its own search action');
assert(v67.includes('win.navigator?.bluetooth'), 'Bluetooth search must be feature-detected in the web build');

console.log('v67 device-role + E-Controller tests: PASS');
