# DorukStation Web v0.59 — Store Navigation + What's New

This build refines the v0.57 Store and adds the linked-manifest game-library format.

## v0.58 changes

- Store Search is now a separate top tab instead of being used as the category destination.
- Classic category buttons filter the right Store panel in place; Modern has equivalent category chips.
- Focused Store game cards enlarge by about 22% with stronger focus depth.
- What's New is now a visual release-history page with a latest-version hero and entries for every DorukStation Web release from v0.6 through v0.58.
- The Game Library can use a tiny root `catalog.json` containing only per-game `manifestUrl` links.
- `manifest.json`, icon, banner and screenshots stay unzipped on GitHub, so Store browsing never downloads the heavy game package.
- `Game.zip` may now contain only `Game/`; an internal package manifest is optional.
- The separate `DorukStation-Game-Package-Example.zip` template can be copied for each game and includes `build-game.sh` to create `Game.zip` and update SHA-256/package size.

See `STORE-LIBRARY-SETUP.md` and `store/*.example.json`.

---

# DorukStation Web v0.57 — Store Preview

This build adds the first functional DorukStation Store/install system while preserving the existing shell and local Games-folder workflow.

## v0.57 Store

- Classic Store redesigned around the supplied PS4 references: left navigation rail, featured game area, search, downloads, game details, contextual footer controls, and active-user footer.
- Modern mode exposes the same Store features using the existing Modern dark/glass presentation.
- Public catalog defaults to `asildorukatik/DorukStation-Game-Library` on GitHub.
- Game icons come from catalog artwork immediately, including while a package is still downloading.
- Download states: queued → downloading → verifying → installing → installed, with failed/cancelled/update states.
- Home and Library display Store download progress over the real game icon.
- ZIP packages are downloaded, optionally SHA-256 verified, safely extracted, and launched from `Game/index.html` (or the manifest entry).
- Browser storage is the default: OPFS first, IndexedDB fallback.
- Users can switch the global Store install target to a chosen real folder, and can override storage for individual games.
- Multi-file installed games are served through the v0.57 same-origin virtual game filesystem service worker.

See `STORE-LIBRARY-SETUP.md` and `store/*.example.json` for the GitHub catalog/package format.

## Update-package behavior

The v0.57 patch does not contain downloadable Store game packages and does not replace an existing `games/` folder. Store-installed packages live in browser/user-selected storage.

---

# DorukStation Web v0.56 — NO GAME PAYLOADS

This package contains the DorukStation shell and game-management workflow, but
it intentionally does **not** bundle the large installed games again.

## Games folder

DorukStation supports both layouts:

- Recommended: `games/<game-name>/index.html`
- Legacy: `games/Game.html`

A structured game folder may keep `icon.png`, assets, scripts and an optional
`banners/` directory beside its `index.html`. Run `./refresh-games.py` (or
`./serve.sh`) after adding/removing folder games so `games/manifest.js` and lazy
payload scripts are regenerated.

The v0.56 update ZIP deliberately does not contain `games/manifest.js` or game
payload files, so extracting it over an existing DorukStation install will not
overwrite the user's installed-game manifest.

## Custom games from Library

Library exposes **Add Custom Game**. It accepts a standalone `.html`/`.htm`
file through the browser picker. Imported apps are assigned to the active user
for the current session, and their browser storage is namespaced to that user.

## Per-user folders

Each profile has a logical root such as `users/user-abc123/` with isolated shell
settings, per-user Games-folder choices and `games/<game-id>/` save namespaces.
See `users/README.txt` for the full layout.

## v0.56 custom-game picker fix

The foreground input owner now treats only DorukStation's trusted hidden file pickers (`#htmlPicker` and `#backgroundPicker`) as system picker targets. This lets Library → Add Custom Game and custom background selection open the browser picker while keeping ordinary controls behind the active panel blocked.


## v0.59 focus fidelity
- Classic Home focused icons expand to the reference-sized large card (~1.7× normal).
- Selected tiles use a unified icon + action frame; What’s New shows the down-arrow strip and launchable items show Start.
- Library and Modern focus states receive stronger visual emphasis.
