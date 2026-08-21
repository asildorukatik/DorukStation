DorukStation local system bridge
================================

A normal website is not allowed to change operating-system Wi-Fi or Bluetooth.
DorukStation's Settings pages can do it when the shell is served locally through
this helper on Linux.

Run from the DorukStation folder:

  ./serve.sh

Then open:

  http://127.0.0.1:8765/

Requirements for full controls:
- NetworkManager / nmcli for Wi-Fi
- BlueZ / bluetoothctl for Bluetooth

The server binds to 127.0.0.1 by default and exposes only a small fixed set of
Wi-Fi/Bluetooth actions. It does not provide arbitrary shell-command execution.

GitHub Pages behavior
---------------------
The site still works normally on GitHub Pages, but browsers deliberately block
websites from changing system Wi-Fi or full Bluetooth configuration. The UI
there shows browser-safe status and may offer Web Bluetooth LE pairing when the
browser supports it.
