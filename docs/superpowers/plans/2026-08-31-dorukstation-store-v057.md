# DorukStation Store v0.57 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first functional DorukStation Store/download/install layer with browser-default storage and per-game user-folder overrides.

**Architecture:** Add an isolated Store module and Store stylesheet instead of enlarging the legacy `app.js`. Add a service worker for virtual installed-game files. Store state lives in IndexedDB/localStorage while game bytes live in OPFS/IndexedDB or a chosen File System Access directory.

**Tech Stack:** Vanilla HTML/CSS/JS, Fetch streams, IndexedDB, OPFS, File System Access API, Service Worker, Web Crypto, DecompressionStream.

**Spec:** `docs/superpowers/specs/2026-08-31-dorukstation-store-design.md`

## Global Constraints
- Browser storage is the default install target.
- Per-game storage overrides global storage.
- Multi-file launch requires HTTPS or localhost.
- Do not bundle downloadable game payloads in the DorukStation update.
- Preserve existing user-imported/folder games.

---

### Task 1: Store model and storage routing
**Files:** Create `v57-store.js`; Test `tests/v57_store_core.test.js`.
- [ ] Write failing tests for catalog normalization, package-path safety, storage precedence, install-state labels and virtual route generation.
- [ ] Run tests and verify RED.
- [ ] Implement the pure core functions.
- [ ] Run tests and verify GREEN.

### Task 2: ZIP reader and extraction contract
**Files:** Modify `v57-store.js`; Test `tests/v57_zip.test.js`.
- [ ] Write a test ZIP with stored and deflated entries and assert safe extraction plus traversal rejection.
- [ ] Run tests and verify RED.
- [ ] Implement central-directory parsing and method 0/8 extraction using `DecompressionStream('deflate-raw')`.
- [ ] Run tests and verify GREEN.

### Task 3: Persistent install/storage adapters
**Files:** Modify `v57-store.js`; Create `v57-game-vfs-sw.js`; Test `tests/v57_store_contract.py`.
- [ ] Add contract tests for OPFS/IDB/user-folder adapters, storage settings and service-worker route.
- [ ] Run tests and verify RED.
- [ ] Implement IndexedDB metadata/files, OPFS writes, directory-handle persistence, and the service-worker virtual file responder.
- [ ] Run tests and verify GREEN.

### Task 4: Store, details, search and Downloads UI
**Files:** Create `v57-store.css`; Modify `v57-store.js`, `index.html`.
- [ ] Add failing DOM/source contracts for Classic/Modern Store, search, game details, Downloads and system footer.
- [ ] Run tests and verify RED.
- [ ] Implement Store page renderers and controller/keyboard/pointer navigation hooks.
- [ ] Run tests and verify GREEN.

### Task 5: Home/Library install-state integration
**Files:** Modify `v57-store.js`.
- [ ] Add tests for downloading placeholder tile, progress, installed launch action, update action, and Sharp's Playroom preinstalled state.
- [ ] Run tests and verify RED.
- [ ] Implement shell app synchronization without removing user-imported/folder games.
- [ ] Run tests and verify GREEN.

### Task 6: Version/package verification
**Files:** Modify `VERSION.txt`, `README.md`, `SOURCES.md`, `NO-GAMES-UPDATE.txt`.
- [ ] Run all v0.53-v0.57 tests and JavaScript syntax checks.
- [ ] Build full NO-GAME-PAYLOADS ZIP and small patch ZIP.
- [ ] Verify ZIP integrity and assert downloadable game payloads are absent.
