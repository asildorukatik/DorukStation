DorukStation games folder — v0.56
================================

Recommended per-game layout:

  games/
    My Game/
      index.html
      icon.png
      assets/...
      banners/...

Legacy standalone files such as games/MyGame.html still work.

After changing installed games, run ../refresh-games.py from the DorukStation
root (or run ./serve.sh there). It generates games/manifest.js and lazy files
under games/payloads/.

This NO-GAME-PAYLOADS distribution intentionally does not ship manifest.js,
HTML games, music, banners or generated payload JS.
