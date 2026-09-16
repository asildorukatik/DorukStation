# DorukStation Web v0.67 Device Role + E-Controller Design

## Goal
Turn the existing DorukStation Web shell into a GitHub-Pages-testable prototype of the DorukStationOS boot role model and E-Controller workflow without building the Linux OS yet.

## Startup roles
On a normal page load, show a device-role selector before the existing controller/input gate:
- **DorukStation**: run the shell for this session. The activation source decides initial controls: touch/pen = Mobile, mouse/keyboard = PC, gamepad = Controller.
- **E-Controller**: hide the DorukStation shell and present the existing touch-controller layout over a solid black background.
- **Permanent DorukStation**: persist the station role in localStorage. Future launches skip the role selector and show an input gate whose headline is **Connect a controller to play**; keyboard, mouse, touch, and controller input remain accepted. Settings can remove permanent mode.

## GitHub Pages E-Controller transport
A pure static site cannot perform Bluetooth peripheral emulation or enumerate nearby DorukStations. The web prototype therefore uses WebRTC DataChannels through PeerJS. PeerJS Cloud is used only to broker the initial connection; controller state then travels peer-to-peer.

The station creates a random six-digit pairing code and a PeerJS peer ID derived from it. The phone enters the code. Incoming E-Controller connections are never trusted automatically: the station displays `Connect to <device label>?` and requires explicit Accept/Decline.

## Remote gamepad model
Accepted E-Controllers are represented as standard Gamepad-like objects injected into DorukStation's existing `navigator.getGamepads()` path. Each remote pad receives the lowest unused gamepad index. Existing controller assignment and user-selection logic therefore continues to own controller-to-user binding.

The phone sends full controller snapshots containing four axes and seventeen standard gamepad buttons. The station updates the remote Gamepad-like object and dispatches a synthetic `gamepadconnected` event. Disconnects dispatch `gamepaddisconnected` and remove the virtual pad.

## Feedback
The station sends controller feedback over the same data channel:
- accepted / rejected / disconnected status
- prompt to select a user on DorukStation after acceptance
- selected user name after login
- vibration requests from the Gamepad vibration actuator exposed to games

The E-Controller shows connection/status text while preserving a black controller-only presentation.

## DorukOS bridge relationship
v0.67 does not replace the v0.65 DorukOS bridge. The web E-Controller transport is a prototype transport. The later native OS can implement Bluetooth transport behind the same controller abstraction while the web shell keeps treating the controller as a standard gamepad.

## Files
- `index.html`: role/pairing/approval overlays and script/style includes.
- `v67-device-role-econtroller.css`: role UI, pairing UI, black controller mode.
- `v67-device-role-econtroller.js`: startup role state, PeerJS host/client, remote gamepad injection, status feedback, settings integration.
- `tests/v67-device-role-econtroller.test.cjs`: pure helper and integration/static assertions.
- `VERSION.txt`, `README.md`, `BUILD-NOTES-v0.67.txt`: version/docs.

## Failure handling
If PeerJS is unavailable, DorukStation itself remains usable. E-Controller pairing reports that the network controller service is unavailable. If a pairing code is unavailable because another PeerJS peer owns it, the station generates another code. Invalid codes are rejected locally. Connection failures return the phone to the pairing form with an error message.
