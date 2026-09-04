#!/usr/bin/env python3
from pathlib import Path
import json, re, hashlib

ROOT = Path(__file__).resolve().parent
GAMES = ROOT / "games"
PAYLOADS = GAMES / "payloads"
BANNERS = GAMES / "banners"
GAMES.mkdir(parents=True, exist_ok=True)
PAYLOADS.mkdir(parents=True, exist_ok=True)
BANNERS.mkdir(parents=True, exist_ok=True)

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

def discover_games():
    """Support both old games/Game.html and games/Game/index.html layouts."""
    found = list(sorted(GAMES.glob("*.html"), key=lambda p: p.name.lower()))
    reserved = {"payloads", "banners", "dungeonmusic"}
    for folder in sorted((p for p in GAMES.iterdir() if p.is_dir()), key=lambda p: p.name.lower()):
        if folder.name.lower() in reserved:
            continue
        index = folder / "index.html"
        if index.exists():
            found.append(index)
            continue
        htmls = sorted(folder.glob("*.html"), key=lambda p: p.name.lower())
        if len(htmls) == 1:
            found.append(htmls[0])
    return found

def extract_icon(text: str, game_file: Path) -> str:
    # Structured game folders prefer conventional icon/cover files.
    if game_file.parent != GAMES:
        stems = ["icon", "cover", game_file.parent.name, game_file.stem]
        for stem in stems:
            for ext in (".png", ".webp", ".jpg", ".jpeg"):
                sidecar = game_file.parent / f"{stem}{ext}"
                if sidecar.exists():
                    return sidecar.relative_to(ROOT).as_posix()
    else:
        for ext in (".png", ".webp", ".jpg", ".jpeg"):
            sidecar = game_file.with_suffix(ext)
            if sidecar.exists():
                return sidecar.relative_to(ROOT).as_posix()

    links = re.findall(r"<link\b[^>]*>", text, re.I)
    for tag in links:
        rel = re.search(r"\brel\s*=\s*([\"'])(.*?)\1", tag, re.I | re.S)
        href = re.search(r"\bhref\s*=\s*([\"'])(.*?)\1", tag, re.I | re.S)
        if not href or "icon" not in ((rel.group(2).lower() if rel else "")):
            continue
        icon = href.group(2).strip()
        if re.match(r"^(data:|https?:|blob:|//)", icon, re.I) or icon.startswith("/"):
            return icon
        return (game_file.parent.relative_to(ROOT) / icon).as_posix()
    return ""

def natural_key(p: Path):
    return [int(x) if x.isdigit() else x for x in re.split(r"(\d+)", p.name.lower())]

def extract_banners(gid: str, game_file: Path):
    folders = []
    if game_file.parent != GAMES:
        folders.append(game_file.parent / "banners")
    folders.append(BANNERS / gid)
    allowed = {".png", ".jpg", ".jpeg", ".webp"}
    out, seen = [], set()
    for folder in folders:
        if not folder.exists():
            continue
        for p in sorted((p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in allowed), key=natural_key):
            rel = p.relative_to(ROOT).as_posix()
            if rel not in seen:
                seen.add(rel); out.append(rel)
    return out

entries, seen = [], set()
for game in discover_games():
    raw = game.read_text(encoding="utf-8", errors="replace")
    structured = game.parent != GAMES
    base = game.parent.name if structured else game.stem
    if not structured and game.name.lower() == "dorukcraft.html":
        gid = "dorukcraft"
    else:
        gid = slug(base)
    if gid in seen:
        relname = game.relative_to(GAMES).as_posix()
        gid = f"{gid}-{hashlib.sha1(relname.encode()).hexdigest()[:6]}"
    seen.add(gid)
    name = extract_title(raw, base)
    if gid == "dorukcraft" and name.lower().startswith("dorukcraft"):
        display_name = "DorukCraft"
    elif gid.startswith("dorukcraft-dungeons") and name.lower().startswith("dorukcraft dungeons"):
        display_name = "DorukCraft Dungeons"
    else:
        display_name = name
    icon = extract_icon(raw, game)
    payload_rel = f"games/payloads/{gid}.js"
    payload_js = (
        "window.DorukStationGamePayloads=window.DorukStationGamePayloads||{};\n"
        f"window.DorukStationGamePayloads[{json.dumps(gid)}]={json.dumps(raw, ensure_ascii=False)};\n"
    )
    (PAYLOADS / f"{gid}.js").write_text(payload_js, encoding="utf-8")
    entries.append({
        "id": gid,
        "name": display_name,
        "title": name,
        "file": game.relative_to(ROOT).as_posix(),
        "payload": payload_rel,
        "icon": icon,
        "banners": extract_banners(gid, game),
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
