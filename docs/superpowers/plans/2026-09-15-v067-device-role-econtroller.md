# DorukStation Web v0.67 Device Role + E-Controller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add the approved device-role startup flow and a real phone-to-laptop E-Controller path that works from GitHub Pages.

**Architecture:** Add a v0.67 overlay/controller module that extends rather than rewrites the existing shell. PeerJS Cloud provides rendezvous for WebRTC; accepted remote controllers are injected into the shell's existing Gamepad API route so existing login, navigation, and game input keep working.

**Tech Stack:** Static HTML/CSS/JavaScript, PeerJS 1.5.5, WebRTC DataChannels, existing DorukStation Gamepad layer, Node assert tests.

**Spec:** `docs/superpowers/specs/2026-09-15-v067-device-role-econtroller-design.md`

## Global Constraints
- Do not build DorukStationOS/Linux in this change.
- Keep GitHub Pages deployment static.
- Preserve the existing v0.65 DorukOS mock/native bridge.
- Use the existing mobile controller control surface for E-Controller mode.
- Permanent DorukStation must be reversible from Settings.
- Incoming E-Controllers require explicit host approval.
- Remote controllers must enter the existing controller/user assignment flow as standard gamepads.

---

### Task 1: Helper contract and page surfaces
**Files:** Create `v67-device-role-econtroller.js`, create `v67-device-role-econtroller.css`, modify `index.html`, test `tests/v67-device-role-econtroller.test.cjs`.
**Interfaces:** Produces `normalizeDeviceRole`, `inputModeFromActivation`, `normalizePairingCode`, `peerIdForCode`, `createRemoteGamepad`, `applyRemoteState` for tests and browser runtime.
- [x] Step 1: Write failing helper/integration assertions in `tests/v67-device-role-econtroller.test.cjs`.
- [x] Step 2: Run the test and confirm it fails because `v67-device-role-econtroller.js` is missing.
- [x] Step 3: Implement helper exports plus role/pairing/approval markup and stylesheet.
- [x] Step 4: Re-run the v0.67 test.

### Task 2: Startup role state
**Files:** Modify `v67-device-role-econtroller.js`.
**Interfaces:** Consumes existing `v38SetInputMode`, `v19HideControllerGate`, `showUserSelector`, `v19ShowControllerGate`; produces session role boot routing and permanent-role localStorage behavior.
- [x] Step 1: Route non-permanent boots to the role selector.
- [x] Step 2: Route station selection using pointer/keyboard/gamepad activation source.
- [x] Step 3: Route permanent station directly to modified input gate.
- [x] Step 4: Add Settings page controls to enable/disable permanent station mode.

### Task 3: PeerJS station host and controller client
**Files:** Modify `v67-device-role-econtroller.js`.
**Interfaces:** Produces pairing-code host, incoming approval, controller connect/status flow, and full-state data messages.
- [x] Step 1: Start a station Peer with a six-digit code and collision retry.
- [x] Step 2: Connect E-Controller client to the code-derived Peer ID.
- [x] Step 3: Require host Accept/Decline before registering input.
- [x] Step 4: Send controller snapshots on change and heartbeat.

### Task 4: Remote Gamepad integration and feedback
**Files:** Modify `v67-device-role-econtroller.js`.
**Interfaces:** Consumes `navigator.getGamepads`, `finishUserLogin`; produces remote pads, synthetic gamepad connect/disconnect events, user-status messages, vibration actuator messages.
- [x] Step 1: Wrap `navigator.getGamepads()` and append accepted remote pads at unused indices.
- [x] Step 2: Dispatch synthetic connect/disconnect events so existing controller ownership code runs unchanged.
- [x] Step 3: Wrap `finishUserLogin` to report assigned user to the matching E-Controller.
- [x] Step 4: Expose vibration actuator methods that send feedback to the phone.

### Task 5: Versioning, regression verification, package
**Files:** Modify `VERSION.txt`, `README.md`; create `BUILD-NOTES-v0.67.txt`.
- [x] Step 1: Update visible version to v0.67.
- [x] Step 2: Run v0.67, v0.66, and v0.65 Node tests.
- [x] Step 3: Check JavaScript syntax with `node --check`.
- [x] Step 4: Serve locally and smoke-test that the page returns HTTP 200 and required v0.67 assets are available.
- [x] Step 5: Zip the completed package without modifying the original upload.
