DorukStation Modern-mode game banners
=====================================

Put banner/background images into a folder named after the game id:

  games/banners/dorukcraft/
  games/banners/dorukcraft-dungeons/

Supported image types: .png .jpg .jpeg .webp

Run ./refresh-games.py (or ./serve.sh) afterward.
DorukStation adds the images to games/manifest.js automatically.

In Modern UI Mode:
- focusing a game with banners crossfades to that game's first banner
- if it has multiple banners, the background changes every 10 seconds
- moving to another game resets that game's slideshow to its first banner
- moving focus away from Home returns to the normal Modern DorukStation background

Classic UI Mode ignores game banners.
