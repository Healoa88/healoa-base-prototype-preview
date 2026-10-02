#!/usr/bin/env python3
"""Responsive, compressed copies of every photo the app shows (v2026-09-28-a).

For each JPG listed in app/data.js PHOTO_META this writes WebP copies next to it:
  <name>-w480.webp, <name>-w828.webp, <name>-w1200.webp (only widths smaller than the original)
  and <name>-wfull.webp (original size), quality 74, EXIF / GPS dropped.
The app builds srcset from these (app/data.js SIZES + srcset()). The original JPGs stay as the <img src>
fallback and for the 1080×1920 exports. Cindy's photos only; nothing is added or retouched, only resized.
Run: python3 tools/make_sizes.py
"""
import re, pathlib
from PIL import Image, ImageOps
ROOT = pathlib.Path(__file__).resolve().parent.parent
data = (ROOT / "app/data.js").read_text()
meta = data[data.index("var PHOTO_META"):data.index("function focal")]
srcs = re.findall(r'"(assets/(?:places|practices)/[^"]+\.jpg)"', meta)
WIDTHS = [480, 828, 1200]
total_in = total_out = 0
for s in srcs:
    p = ROOT / s
    im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
    w, h = im.size
    total_in += p.stat().st_size
    for tw in [x for x in WIDTHS if x < w] + ["full"]:
        out = p.with_name(p.stem + f"-w{tw}.webp")
        if tw == "full":
            r = im
        else:
            r = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
        r.save(out, "WEBP", quality=74, method=6)
        if tw in (828, "full"): total_out += out.stat().st_size if tw == 828 or w <= 828 else 0
    print(s, w, h)
print("originals KB", total_in // 1024)
