#!/usr/bin/env python3
from pathlib import Path
import json, re, hashlib, shutil

ROOT = Path(__file__).resolve().parent
GAMES = ROOT / "games"
PAYLOADS = GAMES / "payloads"
BANNERS = GAMES / "banners"
PAYLOADS.mkdir(parents=True, exist_ok=True)
BANNERS.mkdir(parents=True, exist_ok=True)

# Remove old generated payload scripts so deleted games disappear cleanly.
for p in PAYLOADS.glob("*.js"):
    p.unlink()

def slug(s: str) -> str:
    x = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return x[:56] or "html-game"

def extract_title(text: str, fallback: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title\s*>", text, re.I | re.S)
    if not m:
        return fallback
    title = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.group(1))).strip()
    return title or fallback

def extract_icon(text: str, game_file: Path) -> str:
    # A sidecar image beside the HTML overrides the webpage favicon. This lets a game
    # keep a dedicated DorukStation Home tile without editing the game's own HTML.
    # Example: games/DorukCraft.html + games/DorukCraft.png
    for ext in (".png", ".webp", ".jpg", ".jpeg"):
        sidecar = game_file.with_suffix(ext)
        if sidecar.exists():
            return (sidecar.relative_to(ROOT)).as_posix()

    # Otherwise prefer explicit favicon/apple-touch-icon. This supports self-contained
    # data: icons, absolute URLs, and files that live beside the game's HTML.
    links = re.findall(r"<link\b[^>]*>", text, re.I)
    candidates = []
    for tag in links:
        rel = re.search(r"\brel\s*=\s*([\"'])(.*?)\1", tag, re.I | re.S)
        href = re.search(r"\bhref\s*=\s*([\"'])(.*?)\1", tag, re.I | re.S)
        if not href:
            continue
        relv = (rel.group(2).lower() if rel else "")
        if "icon" in relv:
            candidates.append(href.group(2).strip())
    if not candidates:
        return ""
    icon = candidates[0]
    if re.match(r"^(data:|https?:|blob:|//)", icon, re.I) or icon.startswith("/"):
        return icon
    # Resolve a relative favicon against its HTML file in games/.
    rel = (game_file.parent.relative_to(ROOT) / icon).as_posix()
    return rel

def extract_banners(gid: str):
    folder = BANNERS / gid
    if not folder.exists():
        return []
    allowed = {".png", ".jpg", ".jpeg", ".webp"}
    files = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in allowed]
    def natural_key(p):
        parts = re.split(r"(\d+)", p.name.lower())
        return [int(x) if x.isdigit() else x for x in parts]
    files.sort(key=natural_key)
    return [p.relative_to(ROOT).as_posix() for p in files]

entries = []
seen = set()
for game in sorted(GAMES.glob("*.html"), key=lambda p: p.name.lower()):
    raw = game.read_text(encoding="utf-8", errors="replace")
    base = game.stem
    gid = "dorukcraft" if game.name.lower() == "dorukcraft.html" else slug(base)
    if gid in seen:
        gid = f"{gid}-{hashlib.sha1(game.name.encode()).hexdigest()[:6]}"
    seen.add(gid)
    name = extract_title(raw, base)
    # Clean common version suffix from Home title only when it is obviously DorukCraft.
    if gid == "dorukcraft" and name.lower().startswith("dorukcraft"):
        display_name = "DorukCraft"
    elif gid.startswith("dorukcraft-dungeons") and name.lower().startswith("dorukcraft dungeons"):
        display_name = "DorukCraft Dungeons"
    else:
        display_name = name
    icon = extract_icon(raw, game)
    payload_name = f"{gid}.js"
    payload_rel = f"games/payloads/{payload_name}"
    # External JS avoids loading every game's huge HTML into app.js/index.html.
    payload_js = (
        "window.DorukStationGamePayloads=window.DorukStationGamePayloads||{};\n"
        f"window.DorukStationGamePayloads[{json.dumps(gid)}]={json.dumps(raw, ensure_ascii=False)};\n"
    )
    (PAYLOADS / payload_name).write_text(payload_js, encoding="utf-8")
    entries.append({
        "id": gid,
        "name": display_name,
        "title": name,
        "file": f"games/{game.name}",
        "payload": payload_rel,
        "icon": icon,
        "banners": extract_banners(gid),
        "size": game.stat().st_size,
        "sha256": hashlib.sha256(game.read_bytes()).hexdigest(),
    })

manifest = (
    "window.DorukStationGameManifest=" + json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + ";\n"
    "window.DorukStationGamePayloads=window.DorukStationGamePayloads||{};\n"
)
(GAMES / "manifest.js").write_text(manifest, encoding="utf-8")
print(f"Indexed {len(entries)} HTML game(s) in {GAMES}")
for e in entries:
    print(f"- {e['name']} -> {e['file']} ({e['id']})")
