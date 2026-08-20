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

## v0.36 Flappy Bird-style game

The bundled `games/Flappy-Bird.html`, its icon, and banner are original DorukStation assets created for this build. The game recreates the familiar one-button pipe-dodging gameplay mechanically but does not include the original Flappy Bird game's art, audio, or source code.
