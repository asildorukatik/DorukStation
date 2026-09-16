# Web E-Controller Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the GitHub-Pages E-Controller screen auto-search browser-visible DorukStations, expose separate LAN refresh and Bluetooth search controls, merge results into one transport-labelled list, and preserve six-digit WebRTC pairing as the cross-device fallback.

**Architecture:** Keep the existing PeerJS/WebRTC controller transport. Extend the v0.67 discovery layer with source metadata and capability-aware search controls; BroadcastChannel remains the static-web local discovery mechanism, while Web Bluetooth is explicitly feature-detected and never treated as guaranteed. No backend or native LAN scanner is added.

**Tech Stack:** Static HTML/CSS/JavaScript, PeerJS 1.5.5, BroadcastChannel, optional Web Bluetooth.

**Spec:** Approved conversation design on 2026-09-16: Wi-Fi/LAN first, Bluetooth second, unified labelled results, web-first implementation.

## Global Constraints

- Must remain deployable as static GitHub Pages files.
- Must preserve PeerJS six-digit code pairing across separate devices.
- Must not claim unrestricted native LAN or Bluetooth scanning where browsers do not expose it.
- Must preserve battery, rumble, hold-to-disconnect, station ID, responsive shell, and user-selection behavior.

---

### Task 1: Discovery model and UI contracts

**Files:**
- Modify: `tests/v67-device-role-econtroller.test.cjs`
- Modify: `index.html`
- Modify: `v67-device-role-econtroller.css`
- Modify: `v67-device-role-econtroller.js`

**Interfaces:**
- Produces: `normalizeDiscoveryTransport(value)`, `mergeDiscoveredStation(map, station)`, transport badge rendering, `Refresh LAN`, `Search Bluetooth`.

- [ ] Write failing assertions for the two search buttons, auto-search hook, and transport merge rules.
- [ ] Run `node tests/v67-device-role-econtroller.test.cjs` and confirm failure.
- [ ] Implement minimal markup/model changes.
- [ ] Re-run the focused test.

### Task 2: Browser-safe auto-search and Bluetooth capability path

**Files:**
- Modify: `v67-device-role-econtroller.js`
- Modify: `v67-device-role-econtroller.css`
- Test: `tests/v67-device-role-econtroller.test.cjs`

**Interfaces:**
- Consumes: existing discovery protocol v2 and PeerJS pairing.
- Produces: automatic local-web search on E-Controller entry, manual LAN refresh, optional Bluetooth picker/status, unified result rows.

- [ ] Add failing assertions for automatic search and Bluetooth feature detection.
- [ ] Run focused test to verify failure.
- [ ] Implement browser-safe search behavior and source-labelled rows.
- [ ] Run focused test to green.

### Task 3: Regression verification and package

**Files:**
- Verify all existing tests and JavaScript syntax.
- Package: `/mnt/data/DorukStation-Web-v0.67-WEB-E-CONTROLLER-DISCOVERY.zip`

- [ ] Run all Node regression tests.
- [ ] Run JavaScript syntax checks.
- [ ] Serve the static build locally and verify HTTP 200 for the entrypoint/assets.
- [ ] Create ZIP and run `unzip -t`.
