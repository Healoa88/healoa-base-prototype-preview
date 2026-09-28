#!/usr/bin/env python3
"""After tools/worldlabs_generate.py: download the world's files INTO THE REPO (no expiring signed links in the app)
and fill app/data.js → IMMERSIVE.wudang.world3d (scale from semantics_metadata, marbleUrl). v2026-09-28-b.
Downloads: 500k .spz (default), 100k .spz (weaker phones), pano (re-encoded to JPEG ≤ 4096 px wide), thumbnail (kept
out of git, for the report). Signed URLs are used once here and never written anywhere in the repo."""
import json, os, re, sys, urllib.request
from io import BytesIO

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets/places/wudang/3d")
run = json.load(open(os.path.join(HERE, ".worldlabs-run.json")))
_w = run.get("world") or {}
world = _w.get("world") or (_w if _w.get("assets") else None) or (run.get("operation") or {}).get("response") or {}  # GET /worlds/{id} returns the world unwrapped
a = world.get("assets") or {}
spz = (a.get("splats") or {}).get("spz_urls") or {}
sem = (a.get("splats") or {}).get("semantics_metadata") or {}
os.makedirs(OUT, exist_ok=True)

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "healoa-fetch"}), timeout=300) as r:
        return r.read()

sizes = {}
for key, name in (("500k", "terrace-500k.spz"), ("100k", "terrace-100k.spz")):
    if not spz.get(key): sys.exit(f"no {key} spz url in the world response")
    b = get(spz[key]); open(os.path.join(OUT, name), "wb").write(b); sizes[name] = len(b)
pano = (a.get("imagery") or {}).get("pano_url")
if pano:
    from PIL import Image
    im = Image.open(BytesIO(get(pano))).convert("RGB")
    raw = im.size
    if im.width > 4096: im = im.resize((4096, round(im.height * 4096 / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, "terrace-pano.jpg"); im.save(p, "JPEG", quality=85, optimize=True, progressive=True); sizes["terrace-pano.jpg"] = os.path.getsize(p)
    print("pano", raw, "->", im.size)
if a.get("thumbnail_url"):
    open("/workspace/3d-shots/marble-thumbnail.jpg", "wb").write(get(a["thumbnail_url"])) if os.path.isdir("/workspace/3d-shots") else None
if spz.get("full_res"):
    try:
        req = urllib.request.Request(spz["full_res"], method="HEAD"); sizes["(full_res, not downloaded)"] = int(urllib.request.urlopen(req, timeout=60).headers.get("Content-Length") or 0)
    except Exception as e: print("full_res HEAD:", e)
print(json.dumps({k: f"{v/1048576:.2f} MB" for k, v in sizes.items()}, indent=1))
print("semantics_metadata:", sem, "caption:", (a.get("caption") or "")[:300])

d = os.path.join(ROOT, "app/data.js"); s = open(d).read()
scale = sem.get("metric_scale_factor") or 1
murl = world.get("world_marble_url")
s = re.sub(r'(pano: "assets/places/wudang/3d/terrace-pano.jpg", marbleUrl: )[^,]+,', lambda m: m.group(1) + (json.dumps(murl) if murl else "null") + ",", s)
s = re.sub(r'(\n\s+scale: )[0-9.e-]+(, maxWalk)', lambda m: m.group(1) + ("%.6g" % scale) + m.group(2), s)
open(d, "w").write(s)
print("data.js: scale", scale, "marbleUrl", murl)
