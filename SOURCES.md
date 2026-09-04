# Source map

## OrbisPro

Repository:
`https://github.com/SvenGDK/OrbisPro`

Primary structural reference:
`OrbisPro/MainWindow.xaml`

Used as a reference for:

- 1920×1080 canvas
- status-strip placement
- Home row tile placement and selected frame
- function-area X positions
- start/title region
- right-side Options panel size
- launcher concepts documented by the project: gamepad navigation, Return HOME, suspend/resume, app switcher, library/file explorer, notifications and settings

No OrbisPro source code, binaries, icons, or audio are included in this package.

## skin.orbis (`omega`)

Repository:
`https://github.com/KnuxBoy04/skin.orbis/tree/omega`

Runtime assets copied into this package:

- `media/wave/flow.png`
- `media/wave/flow2.png`
- Flow `texture/content_icon/*` entries used by the shell
- Flow `texture/function_icon/*` entries used by the shell
- What's New / Store / Add artwork
- selected optional theme `bg.jpg` files

UI/theme behavior referenced from:

- `xml/Home.xml`
- `xml/Include_HomeUI_Orbis.xml`
- `xml/Custom_Flow.xml`
- `xml/Custom_Themes.xml`

License copy:
`LICENSES/skin.orbis-CC0-1.0.txt`


- Bundled DorukCraft: DorukCraft-Mobile-v0.17.3-seeded-texture-rotation.html (DorukCraft Mobile v0.17.3).


## v0.21 bundled DorukCraft

The DorukCraft game file was copied directly from the user-provided `DorukCraft-Mobile-v0.17.3-seeded-texture-rotation(1).html` for this build.

SHA-256: `d455850c554297ad803fd78acfb7e5299aaeda71eacf0c66e8721d808661e9ff`

## v0.26 Modern UI references

The **Modern** DorukStation UI mode is original DorukStation HTML/CSS/JS informed by the following open-source/reference projects; no Sony-owned UI files were copied into this build from these repositories.

- `robiningelbrecht/psnprofiles-playstation-5-ui` — PS5-like PSN profile web interface; used as a layout/motion reference. Repository license: ISC.
- `CrissMzs/ExodusLauncher` — PS5-inspired Electron launcher with a horizontal game gallery, smooth animations, and configurable backgrounds; used as a launcher/layout reference. Repository README identifies the project as MIT-licensed.
- `SvenGDK/OrbisPro` — existing DorukStation classic/reference source for console-shell interactions, gamepad handling concepts, backgrounds, notifications, and sound-pack settings. The repository is archived/read-only. v0.26 does **not** copy new OrbisPro assets because no repository-level license was visible in the referenced source page.

Modern mode's glitter effect, glass surfaces, layout overrides, and mode selector are newly authored for DorukStation v0.26.

## v0.28 system-sound mapping
DorukStation v0.28 maps the supplied Classic and Modern `SoundEffects/ALL` banks by the semantic names embedded in the gamerip filenames (for example menu enter/back, OSK cursor/key/backspace, notification/trophy, Open/Close Control Center, Open/Close Option Menu, Open OSK, Open Home and Take Screenshot). Source-project/console names in this credits file are preserved for accurate attribution even though the runtime UI is DorukStation-branded.

## v0.35 Flappy Bird-style game

The bundled `games/Flappy-Bird.html`, its icon, and banner are original DorukStation assets created for this build. The game recreates the familiar one-button pipe-dodging gameplay mechanically but does not include the original Flappy Bird game's art, audio, or source code.


## Modern UI visual reference (v0.43)
- InitialDin/ps5-menu-es-de — https://github.com/InitialDin/ps5-menu-es-de
  - Used only as a visual/structural reference for layered PS5-style background treatment and media presentation.
  - No repository assets or source code were copied into DorukStation v0.43.


## PS5 UI particle reference (v0.45)
- Sony Design, “PlayStation 5 Design Story”: visual reference only. Sony describes the PS5 initial setup as using glimmering particles of light and emphasizes a minimal UI. No Sony assets or code copied.
- InitialDin/ps5-menu-es-de: layout/atmosphere reference only. No project artwork, fonts, video, or code copied into DorukStation.


## v0.47 glitter research
- Sony PS5 Design Story: used only as behavioral/visual reference for glimmering particles of light; no code/assets copied.
- Sony PS5 Quick Start/Home UI documentation: used for general Modern home layout reference; no code/assets copied.
- InitialDin/ps5-menu-es-de: inspected as a public PS5-inspired theme reference; no project assets copied into DorukStation.

## v0.51 glitter-motion research
- Sony Design, “PlayStation 5 Design Story”: Sony describes the PS5 setup treatment as particles of light that glimmer in an animation intended to feel like a portal opening. https://www.sony.com/en/SonyInfo/design/stories/PS5/
- PlayStation Blog, “First look: PlayStation 5’s next-generation user experience”: official PS5 UX reveal/reference. https://blog.playstation.com/2020/10/15/first-look-playstation-5s-next-generation-user-experience/
- GamesRadar, coverage of Sony’s Future of Gaming startup sequence: describes shifting particles lit by rays of light. Used only as motion-reference research, not copied assets/code. https://www.gamesradar.com/ps5-start-up-screen-may-have-debuted-during-the-future-of-gaming-event/

Implementation remains original: lightweight transform-only DOM particles with long curved drift loops; no Sony assets or code are included.


## v0.53 user-provided shell artwork
- `assets/skin/dorukcraft-user.png` is copied byte-for-byte from the user-provided `DorukCraftIcon.png`.
- `assets/skin/sharps-playroom.png` is copied byte-for-byte from the user-provided Sharp's Playroom artwork.
- No Sharp's Playroom game payload is bundled in the NO-GAMES shell update.


## v0.54
Shell restoration is original DorukStation code. Existing user-supplied system-audio assets are reused; no new external assets were added.

## v0.55 restoration
- No new third-party assets or code were added.
- Game-management restoration is DorukStation shell code.
- Installed game payloads are intentionally excluded from this distribution.

## v0.56
- No new third-party assets or code were added.
- Fix is original DorukStation input-routing code for trusted shell file pickers.

## v0.57 Store

- Store layout and interaction direction: user-supplied Classic console Store, Search, Downloads, Library and quick-system reference photographs (`DorukStationPhotos.zip`).
- Remote Store catalog default: `https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/catalog.json`.
- No third-party Store game packages are bundled by this shell update.
- ZIP extraction, SHA-256 verification, OPFS/IndexedDB storage, File System Access storage selection, and the virtual-game service worker are implemented locally in `v57-store.js` / `v57-game-vfs-sw.js` without an external JavaScript ZIP dependency.


## v0.58 Store / What's New

- Store layout refinements continue to use the user-supplied Classic console UI photographs in `DorukStationPhotos.zip` as visual references.
- v0.58 Store filtering, linked-manifest loading, external-manifest package support and What's New release-history UI are original DorukStation code.
- The separate game-package example uses the user-provided DorukCraft icon only as a replace-me placeholder image.
- No third-party Store game package is bundled in the shell update.


## v0.59 reference pass
Classic Home selection proportions were adjusted from user-supplied DorukStation/console reference photographs. No reference image is redistributed in this package.
