DorukStation games folder
=========================

Put standalone .html games directly in this folder, then run one of:

  ./refresh-games.py

or simply:

  ./serve.sh

serve.sh refreshes the games list automatically before starting DorukStation.
DorukStation reads each game's <title> and <link rel="icon"> / apple-touch-icon.
That favicon is used as the Home/Library app icon when available.

Why the refresh step exists:
A normal browser page is not allowed to enumerate arbitrary files in a local
folder. refresh-games.py creates games/manifest.js plus lazy payload scripts so
DorukStation can discover the HTML files you intentionally placed here.

Direct index.html/file:// mode is supported for indexed games. DorukStation
loads the indexed HTML through srcdoc so games can use the shell's browser
storage instead of receiving Chrome's restricted local-file iframe origin.
For the most reliable persistent saves, running ./serve.sh is still recommended.
