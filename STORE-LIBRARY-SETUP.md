# DorukStation Game Library — v0.58

DorukStation reads the master list from:

`https://raw.githubusercontent.com/asildorukatik/DorukStation-Game-Library/main/catalog.json`

## Recommended layout

Keep only lightweight preview data unzipped. The large game downloads only when the user selects **Install**.

```text
DorukStation-Game-Library/
├── catalog.json
└── games/
    └── example-game/
        ├── manifest.json
        ├── Logo/
        │   ├── icon.png
        │   └── banner.png
        ├── Screenshots/
        │   └── 01.png
        └── Game.zip
```

The root `catalog.json` can stay extremely small:

```json
{
  "schemaVersion": 2,
  "games": [
    {"manifestUrl":"games/example-game/manifest.json"}
  ]
}
```

DorukStation v0.58 fetches each `manifest.json` to build the Store page. Relative icon, banner, screenshot, and package URLs are resolved relative to that manifest. Therefore Store artwork appears without downloading `Game.zip`.

## Game.zip

Recommended contents:

```text
Game.zip
└── Game/
    ├── index.html
    ├── scripts/
    ├── assets/
    ├── audio/
    └── ...
```

An additional `manifest.json` inside the ZIP is optional. If present, DorukStation verifies its id and entry. If omitted, DorukStation uses the public unzipped manifest.

Use the separate `DorukStation-Game-Package-Example.zip` as the copy-and-repeat template. Replace the Game folder and artwork, edit `manifest.json`, then run `build-game.sh`. It creates `Game.zip` and fills `packageSize` and `sha256` automatically.

For very large games, upload `Game.zip` as a GitHub Release asset instead of normal Git history, then put the full Release asset URL in `packageUrl`.

## Storage

Browser-managed storage remains the default (OPFS with IndexedDB fallback). The user can switch the global Store default to a chosen directory or override storage for one specific game.
