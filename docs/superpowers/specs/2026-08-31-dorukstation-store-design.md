# DorukStation Store v0.57 Design

## Goal
Replace the Store prototype with a functional web Store shell that can load a remote catalog, show Classic/Modern Store views, track downloads, install ZIP game packages, and expose storage routing globally or per game.

## Package/catalog contract
Remote catalog default: `https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/catalog.json`.

Each catalog item has: `id`, `name`, `version`, optional `description`/`descriptionUrl`, `age`, `genres`, `icon`, optional `banner`, `screenshots`, `packageUrl`, optional `packageSize`, optional `sha256`, and optional `entry` (defaults to `Game/index.html`).

A downloaded ZIP may contain:
- `manifest.json`
- `Game/` with the launch HTML and all runtime assets
- `Logo/` with icon/banner artwork
- `Screenshots/`

`manifest.json` may override display metadata but must not change the catalog `id` to another game.

## Install storage
Default global install target is browser storage.
- Browser storage uses OPFS when available and IndexedDB as a fallback.
- User storage uses the File System Access API and a directory chosen by the user.
- Global setting: Browser Storage or User Folder.
- Per-game setting: Inherit Global, Browser Storage, or User Folder.
- A per-game override wins over the global setting.
- Folder permission is requested only from a user gesture. If permission is unavailable, the install is not silently redirected; the UI explains the problem and lets the user choose Browser Storage.

## Web launch model
Installed multi-file games are exposed through a same-origin virtual game route served by `v57-game-vfs-sw.js`. The service worker reads files from OPFS/IndexedDB or a persisted directory handle and returns them as normal HTTP responses so relative assets continue to work.

This requires DorukStation to run on HTTPS or localhost. Under `file://`, Store browsing still works but multi-file installed-game launch clearly reports that localhost/HTTPS is required.

## Download lifecycle
States: `not-installed`, `queued`, `downloading`, `verifying`, `extracting`, `installed`, `failed`, `cancelled`, `update-available`.

Download UI records bytes received, total bytes when known, speed, ETA, error text, and install target. While downloading, the real remote game icon is used immediately on Home/Library and a progress bar replaces the normal Play state.

SHA-256 is optional in catalog metadata. When supplied it is verified before extraction.

## UI
Classic Store follows the supplied references: left navigation rail, featured hero, tile shelves, dedicated search view, game details, Downloads page, contextual controls footer on the lower left, and current-user avatar/name on the lower right with separator lines.

Modern mode exposes the same Store capabilities with DorukStation's existing dark/glass/glitter language rather than copying the Classic blue presentation.

Store search is local against loaded catalog metadata and filters by name, genres, age, and description.

Library gains install-state awareness and can show downloading/installed/update states.

## Preinstalled content
Store-managed content treats Sharp's Playroom as the only preinstalled Store game. Existing user-imported HTML apps and games already present in `games/` remain user-owned/local content and are not deleted.

## Safety/error handling
- Reject ZIP paths containing `..`, absolute paths, or drive prefixes.
- Reject packages without a valid HTML entry.
- Never execute package files during extraction.
- Limit individual ZIP entry size and total extracted size using catalog/package size bounds.
- Failed installs keep their Store metadata and expose Retry/Remove Download.
