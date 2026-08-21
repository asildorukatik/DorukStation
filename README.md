# DorukStation Web v0.39

## Mobile / touch controller

- Adds a full-screen touch controller inspired by the supplied Classic and Modern mobile sketches.
- Classic UI gets a blue translucent controller; Modern UI gets a dark glass controller.
- Works in the DorukStation shell and is exposed to same-origin HTML games as a standard Gamepad in slot 0.
- Supports true multitouch: both analog sticks plus held face/shoulder buttons at the same time.
- Touch PS/Home: short press returns Home; hold 1 second opens Quick Menu. SHARE opens DorukStation Share.
- Auto mode detects touch/coarse-pointer devices and hides the overlay when a real controller is connected.
- Settings → Mobile Controls: Auto/On/Off, Home/Games visibility, size, opacity, sensitivity and vibration.
- Portrait mode shows a rotate-device hint and rearranges/scales controls.
- Carries forward the v0.36 game-audio fix: game media playback is no longer delayed by DorukStation's device-sink routing shim.
- Keeps Dungeons music as normal `games/DungeonMusic/` files, making this package suitable for GitHub Pages and normal Git file limits.

# DorukStation Web v0.35


## v0.35 Flappy Bird game

- Adds an original, self-contained Flappy Bird-style game to the built-in games folder.
- Supports controller, keyboard/mouse, and mobile touch input.
- Includes its own DorukStation tile icon, banner, sound effects, pause menu, and per-user high score.
## v0.35 DorukCraft Dungeons audio fix

- Updates the bundled DorukCraft Dungeons game to v0.4.7.
- Bundles the complete `DungeonMusic/` companion folder under `games/DungeonMusic/`.
- Indexed games launch through `srcdoc` with a `games/` base URL, so Dungeons paths such as `DungeonMusic/Fight/...mp3` now resolve inside DorukStation exactly as they do when the game HTML is opened from its normal game folder.
- Keeps iframe autoplay permission enabled and preserves the existing suspended-app audio lifecycle.

# DorukStation PS4 Web v0.25

## v0.25 game loader fixes

- Bundles the exact user-supplied **DorukCraft Mobile v0.17.5 mesh-focus-fix** as `games/DorukCraft.html`.
- Fixes Chrome `file://` iframe storage failures by launching indexed/local HTML games through `srcdoc` under the DorukStation shell origin.
- Adds a real `games/` install folder. Put standalone `.html` games there and run `./refresh-games.py` (or `./serve.sh`, which refreshes automatically).
- `refresh-games.py` reads each game's `<title>` and favicon (`<link rel="icon">`) and uses that favicon as the Home/Library tile icon.
- Game payloads are lazy-loaded: DorukStation does not parse every large HTML game at startup.
- File-picker HTML apps also use `srcdoc`, avoiding blob/local-file storage-origin failures.
- A safe shell storage fallback prevents a denied `localStorage` getter from taking down DorukStation startup.

# DorukStation PS4 Web v0.23

## v0.23 device-audio routing

- DorukStation system sounds explicitly prefer a non-controller audio output.
- The output choice is device-global rather than stored separately per DorukStation user.
- DualShock / DualSense / Wireless Controller speaker endpoints are never selected automatically.
- Connecting or reconnecting a controller does not replace a remembered device-speaker sink.
- Same-origin/local HTML games inherit the same output when the browser supports `HTMLMediaElement.setSinkId()`. DorukCraft uses HTML Audio, so its music/SFX are covered.
- If the browser hides speaker identities until permission is granted, use **Settings → Sound and Screen → Device Audio Output** once and choose the laptop/device speakers.

# DorukStation PS4 Web v0.19

Adds multi-controller account assignment, controller/user handoff, avatar selection from the supplied profile pack, battery UI/notifications when browser battery data is available, disconnect/login/logout notifications, and audio-output selection/auto-routing for shell sound effects.

# DorukStation PS4 Web v0.15

## v0.15 PS/Home long-press fix

- Reworked PS/Home detection so holding the button is tracked continuously instead of depending only on a single edge.
- Standard Gamepad Meta/Home button index 16 is used when the browser exposes a standard mapping.
- Added Sony/DualShock/DualSense raw-mapping fallbacks for browsers that expose a non-standard gamepad layout.
- Checks both `GamepadButton.pressed` and `GamepadButton.value`.
- Added a small release debounce to ignore one-frame controller-state glitches.
- Hold for 1 second opens Quick Menu exactly once; releasing earlier performs the normal short-PS action.
- The detected raw PS-button index is remembered per controller ID.
- Keyboard Home remains a development fallback.

This is the first prototype built as a deliberate merge of two public projects:

- **OrbisPro** — used as the reference for PS4-home geometry, navigation and launcher behavior.
- **skin.orbis (`omega`)** — actual copied CC0 visual assets, Flow waves/icons, Flow color choices, and optional theme backgrounds.

## Run

```bash
chmod +x serve.sh
./serve.sh
```

Then open:

```text
http://127.0.0.1:8765
```

You can also open `index.html` directly, but a local HTTP server is recommended.

## Controls

- Arrow keys / D-pad / left stick — move
- Enter / Cross / A — select
- Esc / Circle / B — back
- `O` / Options / Start — Options
- `Home` — return HOME from a running HTML app
- Share/View while an app is running — application switcher
- Share/View + Options/Start — return HOME
- Controller Home/PS button — return HOME when the browser exposes that gamepad button
- `F2` — replay startup
- `F10` — debug overlay

## OrbisPro behavior copied into the web implementation

The web shell uses a fixed **1920×1080 reference stage** and reconstructs the public `MainWindow.xaml` geometry rather than inventing new spacing:

- status row around Y=78
- home app row around Y=209
- selected-app frame approximately 175×175
- fixed app positions/spacing based on the OrbisPro Home row
- app title/start region around Y=533
- upper function area positions matching the OrbisPro row
- 500px right-side options panel
- HOME return, suspend/resume, running-app switcher, library/folder concepts

The implementation is fresh HTML/CSS/JS. No OrbisPro source file or binary is redistributed because the repository does not state a redistribution license at its root.

## skin.orbis `omega` used directly

Files inside `assets/skin`, `assets/wave`, and `assets/themes` are copied from the `omega` branch of skin.orbis.

Included Flow assets include:

- `flow.png`, `flow2.png`
- Browser
- Disc
- Gallery
- Library
- Live from PlayStation
- Share Play
- USB Music Player
- Community
- Events
- Friends
- Messages (+ glow)
- Notifications
- Parties (+ glow)
- Power
- Settings
- Trophies
- What's New / Store / Add artwork

The Flow color selector also uses the values defined by skin.orbis Custom_Flow:

- Default `#001D66`
- Gold `#967818`
- Steel Blue `#103B59`
- Red `#6D0707`
- Light Blue `#017387`
- Purple `#3A0060`
- Grey `#232222`
- Pink `#720046`

Optional built-in theme backgrounds include Battlefield, Destiny, Horizon Zero Dawn, Tron, Until Dawn, The Witcher 3, and PlayStation Anniversary.

The original skin.orbis CC0-1.0 license text is included under `LICENSES/skin.orbis-CC0-1.0.txt`.

## Local HTML games

The DorukCraft tile lets you select a standalone HTML build. Added HTML apps can stay running in hidden iframes so returning HOME behaves more like suspend/resume instead of destroying the app immediately.

Because this is a static web prototype, local file selections only last for the current browser session. Persistent app installation belongs in the later desktop/native wrapper.

## v0.7 fixes

- Fixed the Home carousel's one-item focus/highlight offset.
- The selected tile's actual DOM position now drives horizontal carousel/camera movement.
- DorukCraft is a built-in web app at `https://asildorukatik.github.io/Minecraft2/`.
- DorukCraft launches in the existing DorukStation app surface/iframe, not a separate tab.
- HOME hides the app surface and returns to the shell while leaving the iframe loaded.
- Replaced the old `DC` placeholder with a cleaner grass-block-style DorukCraft tile.
- Add HTML App remains inside Library only.


## v0.7

- Full-bleed active theme behind the contained 1920×1080 UI safe area, so ultrawide/tall screens no longer have visually empty side bands.
- Circle/B no longer returns to DorukStation while an app is running.
- While an app is running, DorukStation only consumes the PS/Home button (Gamepad button 16 when the browser exposes it).
- Keyboard `Home` is the development fallback for PS/Home.
- HOME suspend now animates the fullscreen app down into its Home tile, similar to a phone home-screen app-close transition.
- Resume animates from the Home tile back to fullscreen.
- Suspending keeps the exact iframe/browsing context alive and hidden.
- `Options → Close background app` destroys that iframe. The next launch therefore starts a fresh browsing context.
- DorukStation sends optional `dorukstation:suspend`, `dorukstation:resume`, and `dorukstation:close` `postMessage` lifecycle events to apps that choose to support deeper pause/resume behavior.

### Web suspension note

A static web shell cannot forcibly pause every possible timer inside an arbitrary cross-origin web game without the game cooperating. Hiding the iframe preserves its state and typically stops/throttles rendering work; games can additionally listen for the lifecycle `postMessage` events above for a true simulation pause.


## v0.7 changes
- Full-bleed Flow/photo/custom backgrounds now live outside the 1920×1080 UI canvas, eliminating empty side areas on wide/tall displays.
- Startup/boot overlay now covers the entire viewport, including any extra aspect-ratio area.
- Focused Home item now gets a Play/Open button directly below its tile.


## v0.13
- Highlight tracking is now bound directly to the focused app icon.
- The highlight appears on the newly focused icon immediately while carousel/camera motion remains smooth.
- The highlight grows and shrinks with the icon itself.


## v0.13
- The Play/Open/Resume action button is now attached to the focused Home tile, so it jumps to the newly focused icon immediately and then travels with that icon/highlight during the existing smooth carousel movement.


## v0.13 application lifecycle
- Exactly one game/application may be loaded at a time.
- HOME suspends the current app and blocks its input while it remains loaded.
- Starting a different app asks whether to close the suspended app first.
- Cancel keeps the old app suspended and returns to Home.
- Close & Open destroys the old iframe, then starts the selected app fresh.


## v0.13
- Adds startup user selection and per-user shell settings, notifications and trophies.
- Bundles DorukCraft locally and namespaces its LocalStorage/IndexedDB by DorukStation user.
- Local HTML games are injected with the same per-user browser-storage namespace.
- Removes shell-side iframe autofocus. Games keep ownership of their own focused buttons.
- Resume/start input is quarantined until controller buttons and sticks return to neutral, preventing the launch/resume Cross/A press from becoming an in-game jump.
- All avatars currently use the included generic profile/friend icon.

- The first migrated user keeps using the existing hosted DorukCraft origin so pre-v0.13 worlds remain available; newly created users use the bundled profile-isolated DorukCraft copy.


## v0.13
- Hold PS/Home for 1 second to open a PS4-style Quick Menu; short PS press still returns Home.
- DualShock SHARE button (standard Gamepad button 8) opens the Share panel. F8/Print Screen are keyboard test shortcuts.
- Settings rebuilt as a PS4-style vertical settings list.
- User selection now has a same-size Create User tile with a plus icon and a dedicated Create User screen.
- Quick/Share overlays hard-block game input while open and release only after controller input returns neutral.


## v0.15
- Fixes the v0.14 raw-gamepad PS-button regression that could immediately return a newly launched app to Home. Unknown raw Sony layouts now learn the PS button only after a deliberate long hold; ordinary game buttons are never treated as short PS presses.
- Quick Menu hold changed from 2 seconds to 1 second.
- Permanent accounts now have explicit virtual user folders (`users/<user-id>/`) for shell/account organization while existing game save namespaces are preserved for compatibility.
- Create User now offers **Create New User** or **Play as Guest**.
- Guest sessions are not added to the permanent user list. Their shell/local-storage data is memory-only, guest IndexedDB namespaces are deleted on logout/controller disconnect/restart and cleaned again on next startup if shutdown was abrupt.
- Guests are automatically logged out when their bound controller disappears.

- Smooth PS4-style transitions now cover user selection, Create User / Guest choice, back navigation, full settings/pages, app Options, Quick Menu, and Share Menu. Navigation state changes immediately while visuals ease between screens.


## v0.17 controller regression fix
- Restores shell navigation from the controller assigned to the active user.
- Running games receive the assigned controller as `navigator.getGamepads()[0]` for compatibility.
- Other users' controllers remain hidden from that game.
- Single-controller sessions fall back safely if an assignment map is temporarily missing.
- Resume input quarantine now waits only for the controller assigned to the running game.


## v0.19
- Restores v0.15-style active-controller polling while retaining multi-controller user assignment.
- One account can only be assigned to one controller at a time.
- A disconnected permanent user's controller has a 10-second reconnection lease; the same controller automatically reclaims that account when it returns in time.
- Press PS/Home on any assigned controller to make that controller's user own the shell. The shell UI fades, the user's theme/folder/Home are loaded, Home focus resets to the first item, then the UI fades back in.
- Session-added HTML apps and Games-folder choices are separated by user.
- Adds a controller-operated digital keyboard for Create User and username editing.


## v0.19
- Controller-first boot gate: Connect a controller to begin, with optional keyboard/mouse debug mode.
- Removed persistent device-user assignment; user ownership is controller-based.
- Avatar selector and Change Avatar are controller navigable. Guest icon is the default until an avatar is chosen.
- Popup on-screen keyboard opens for editable text fields, including same-origin/local games.
- OSK shortcuts: X type, R2 Enter, L2 shift/caps, Triangle symbols, Square backspace, Circle leave.
- Held D-pad/stick repeats in Home and keyboard; L1/R1 jump to the left/right end of the Home app list.


## v0.20 changes
- Bundles DorukCraft Mobile v0.17.3 (latest DorukCraft HTML available when this build was made).
- R2/Enter on the popup keyboard now commits/enters only; it no longer types the currently highlighted key as an extra character.
- If a controller is detected, DorukStation skips the no-controller gate and goes directly to Pick User.
- Avatar selection starts with controller focus on the avatar grid and consumes open/close inputs so one Circle press exits cleanly without leaking into the Profile page.
- Login controller-selection ownership is cleared after sign-in so Profile/Avatar screens always use the active controller.


## v0.21 changes

- Re-bundled DorukCraft directly from the exact HTML uploaded in the v0.21 request.
- Made the Profile Picture controller focus ring much thicker, brighter, and easier to track across avatar tiles and categories.
- Increased DorukStation shell SFX output gain by 4x (with a safety cap).

## v0.22 — System audio themes
- Bundles the user-provided DorukStation system-sound pack.
- Adds Classic (default) and Modern system sound themes.
- Adds an independent Nostalgia boot-audio option.
- Sound theme and boot-audio choice are saved per user; the last permanent user's boot choice is remembered for pre-login startup.
- Replay Startup previews the currently selected boot audio.
- System audio continues to honor Sound Effects On/Off and the preferred audio-output routing.
- Bundled DorukCraft is the exact latest user-provided v0.17.3 HTML from this conversation.


## v0.24
- Fixed Create User controller-state traps. Avatar picker is now a true modal and exits with one Circle press.
- Username OSK exits cleanly with one Circle press and returns focus to Name.
- Create User / avatar / keyboard navigation now uses the selected system sound theme.
- Avatar images are lazy-rendered 21 at a time with a loader instead of mounting the full library.
- Consolidated controller polling into one stable scheduler to prevent duplicated input handling.

### v0.26 UI Modes

Settings → **UI Mode** now offers:

- **Classic** (default): existing PS4-style Flow UI + Classic system sounds.
- **Modern**: PS5-inspired dark/glass Home UI with larger horizontal game cards, modern Settings/Quick Menu styling, and a procedural animated glitter background. Selecting Modern also selects the Modern system sound pack; sound packs can still be changed independently afterward.

UI Mode is stored per DorukStation user, so different users can keep different interface generations, themes, and sounds.


### v0.28 branding/audio
Runtime UI is DorukStation-branded. The Store and Now icons are the user-supplied replacements. Editable-field OSK opens on click/activation only. The ALL sound banks are included and mapped to semantic UI events.


### v0.29 controller ownership reliability
- Unassigned controllers are fully blocked from shell and game input.
- Newly detected controllers immediately restore a valid 10-second reconnect lease or open Pick User.
- If an unassigned controller sends input later, Pick User opens again.
- Circle/B dismisses Pick User for that controller without assigning an account.
- Running HTML games receive only their owning user's controller, compacted to gamepad slot 0, using the parent shell Gamepad API for reliability.
- Controller connect/disconnect state is also polled every frame so browsers that miss a Gamepad event recover automatically.


### v0.30 Input gate fix
Game pointer/keyboard/touch input is available immediately on launch/resume. Only controller Gamepad API reads are briefly quarantined until the launch button is released, with a 700ms hard timeout.


### v0.31
- Bundles the exact DorukCraft Mobile v0.17.6 input/settings build supplied by the user.
- Suspended HTML apps now pause tracked HTML audio/music and resume it when reopened.
- games/ supports optional sidecar app artwork (`Game.html` + `Game.png/.webp/.jpg/.jpeg`), which overrides the webpage favicon.
- DorukCraft uses its dedicated grass-block + diamond-tools Home icon.


### v0.33 — DorukCraft Dungeons
- Added `DorukCraft-Dungeons.html` as a separate installed game.
- Uses its own per-user save namespace (`dorukcraft-dungeons`).
- Added a dedicated DorukCraft Dungeons Home icon.
- Modern UI uses the supplied Dungeons 2560×1440 artwork while the game is focused.
- DorukCraft also now has its supplied 2560×1440 focus background.


## v0.38 — Input Mode detection
- Startup gate now says **Press any button or click/tap anywhere**.
- First unconfigured input chooses Mobile Touch, PC Keyboard & Mouse, or Controller.
- Input Mode is remembered until changed under **Settings → Input Mode**.
- Touch controls are visible **only** in Mobile Input Mode; touchscreen capability alone no longer enables them.
- SHARE / DorukStation / OPTIONS touch buttons are larger.
- Controller connection alone no longer hijacks the startup gate; the controller must actually send input.


## v0.39 — Private input gate + Wi-Fi/Bluetooth settings

- The startup input gate appears before any local user cards or installed-app tiles can be visible.
- The gate uses the last selected Classic blue or Modern dark/glitter UI background.
- User selection opens only after the startup input event is accepted.
- Settings → Network now exposes Wi-Fi controls when DorukStation is running with its local Linux system bridge.
- Settings → Devices now includes Bluetooth power/pair/connect controls through the same bridge.
- Normal browsers/GitHub Pages keep safe browser-only fallbacks because websites cannot directly change operating-system Wi-Fi/Bluetooth settings.
- `./serve.sh` now starts the optional local system bridge/static server on Linux.
