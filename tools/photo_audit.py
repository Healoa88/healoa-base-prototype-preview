#!/usr/bin/env python3
"""Photo audit contact sheets (v2026-09-27-y).
One sheet per place: every Cindy photo in the repo for that place, its size / orientation, a quality rank, the role
it has in the App, the focal point (+) and the phone crop (dashed 4:5 box, where the photo is cropped on a phone).
Picks are marked in gold. Output: /workspace/v4-y-shots/photo-audit-<place>.png  (Cindy can overrule any pick).
Usage: python3 tools/photo_audit.py [outdir]"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else "/workspace/v4-y-shots"
P = "assets/places/"
# (file, rank, role, focal (fx, fy) %, note) — rank 1 = best for this place. Role: HERO = phone + 9:16 export,
# WIDE = desktop backdrop, ACT = activity card, GAL = gallery, SEASON = season / home photo, — = not used.
SHEETS = {
  "wudang": ("武当山 Wudang", [
    ("wudang/02-terrace-sunrise.jpg", 1, "HERO · SEASON autumn · 2.5D", (50, 42), "golden sunrise over the cloud sea, strong leading lines; best photo in the repo"),
    ("wudang/03-crane-peaks.jpg", 2, "GAL", (42, 55), "dramatic peaks, tall 9:16 — good alt hero"),
    ("wudang/vista/01-cliff-pavilion.jpg", 3, "GAL · ACT sit", (52, 62), "pavilion on the cliff, calm"),
    ("wudang/01-cloud-sea-sun.jpg", 4, "practice bg", (62, 55), "cloud sea, a bit hazy"),
    ("wudang/homestay/01-courtyard-house.jpg", 5, "GAL · ACT walk", (52, 62), "old hero; pleasant but flat light"),
    ("wudang/homestay/02-window-tea-terrace.jpg", 6, "GAL · ACT baduanjin", (58, 55), "cozy tea window"),
    ("wudang/05-mist-rays.jpg", 7, "—", (40, 40), "mist rays, low resolution (810×1080)"),
    ("wudang/04-monkey-temple.jpg", 8, "—", (50, 50), "temple + monkey, busy frame"),
    ("wudang/bustle/01-stairs-cable-crowd.jpg", 9, "— (only landscape)", (50, 50), "crowded stairs; not calm → no good desktop photo"),
  ]),
  "pattaya": ("芭提雅 Pattaya", [
    ("thai/pool/01-infinity-coast.jpg", 1, "HERO", (50, 48), "infinity pool into the bay, clean horizon, portrait"),
    ("thai/sunset/01-pattaya-harbor-dusk.jpg", 2, "WIDE · ACT walk · SEASON wide", (50, 50), "dusk over the harbour — best mood, but landscape only"),
    ("thai/pool/03-long-pool-canopy.jpg", 3, "GAL · ACT sit", (58, 50), "long pool under trees"),
    ("thai/market/01-floating-market-boat.jpg", 4, "—", (50, 50), "floating market, busy (not Pattaya-calm)"),
    ("thai/pool/02-deck-photo.jpg", 5, "—", (50, 50), "a person in frame — not used"),
    ("thai/dive/01-scuba-pair.jpg", 6, "—", (50, 50), "people, 2:1 crop; off-topic"),
  ]),
  "onsen": ("草津温泉 Kusatsu onsen", [
    ("onsen/02-hot-spring-falls.jpg", 1, "HERO · practice bg", (62, 48), "steaming spring falls, more depth + motion"),
    ("onsen/01-hot-spring-field-town.jpg", 2, "GAL · ACT walk/sit", (50, 52), "overcast, bland buildings — was the old pick"),
  ]),
  "harbin": ("哈尔滨 Harbin", [
    ("harbin/01-night-snow-roofs.jpg", 1, "HERO · SEASON winter", (50, 55), "night snow on roofs, warm lights, portrait"),
    ("harbin/02-night-lanterns-snowman.jpg", 2, "WIDE · ACT breathe · SEASON wide", (45, 60), "lanterns + snowman, landscape"),
    ("harbin/04-stairs-street-blue-sky.jpg", 3, "GAL", (50, 60), "blue sky street, portrait"),
    ("harbin/03-day-milk-tea-village.jpg", 4, "GAL · ACT sit", (50, 62), "old hero; daylight, flatter"),
  ]),
  "cabin-forest": ("小屋 / 森林 (practice + season only)", [
    ("cabin/04-soup-window-warm.jpg", 1, "practice bg", (58, 58), "warm soup by the window"),
    ("cabin/02-cabin-through-birch.jpg", 2, "—", (50, 55), "cabin through birch, portrait"),
    ("forest/path/01-leaf-tunnel.jpg", 3, "practice bg", (50, 62), "leaf tunnel, portrait"),
    ("cabin/05-aurora-forest-night.jpg", 4, "—", (50, 50), "aurora, landscape"),
    ("cabin/01-porch-frost-forest.jpg", 5, "—", (50, 50), "frosty porch, landscape"),
    ("forest/porch/01-lava-porch.jpg", 6, "—", (50, 50), "porch, portrait"),
    ("forest/path/02-monstera-tunnel.jpg", 7, "—", (50, 50), "monstera tunnel"),
    ("forest/path/03-canopy-drive.jpg", 8, "—", (50, 50), "canopy drive, landscape"),
    ("cabin/03-desk-notebook-window.jpg", 9, "—", (50, 50), "desk + notebook"),
  ]),
}
GOLD, INK, MUTED, BG = (201, 154, 62), (38, 36, 31), (95, 90, 80), (246, 241, 232)

def font(sz, bold=False):
    for f in (["/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"] if bold else []) + ["/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()

def crop_box(w, h, ratio, fx, fy):
    """Box (in image px) that object-fit: cover + object-position fx% fy% shows in a frame of aspect `ratio` (w/h)."""
    if w / h > ratio: cw, ch = h * ratio, h
    else: cw, ch = w, w / ratio
    x = (w - cw) * fx / 100; y = (h - ch) * fy / 100
    return x, y, x + cw, y + ch

def dashed(d, box, fill, width=3, dash=12):
    x0, y0, x1, y1 = box
    for (a, b) in [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]:
        L = ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** .5; n = max(1, int(L // dash))
        for i in range(0, n, 2):
            t0, t1 = i / n, min(1, (i + 1) / n)
            d.line([(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0), (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)], fill=fill, width=width)

def sheet(key, title, items):
    TH = 420; tiles = []
    for f, rank, role, (fx, fy), note in items:
        im = Image.open(os.path.join(ROOT, P + f)).convert("RGB"); w, h = im.size
        tw = int(TH * w / h); t = im.resize((tw, TH), Image.LANCZOS); d = ImageDraw.Draw(t)
        s = tw / w
        if h >= w:  # portrait: show the 4:5 phone frame + 9:16 export frame
            b = crop_box(w, h, 4 / 5, fx, fy); dashed(d, [v * s for v in b], (255, 255, 255))
        else:       # landscape: show the 16:10 desktop crop
            b = crop_box(w, h, 16 / 10, fx, fy); dashed(d, [v * s for v in b], (255, 255, 255))
        cx, cy = tw * fx / 100, TH * fy / 100
        d.line([(cx - 12, cy), (cx + 12, cy)], fill=(255, 255, 255), width=3); d.line([(cx, cy - 12), (cx, cy + 12)], fill=(255, 255, 255), width=3)
        tiles.append((t, f, rank, role, w, h, note))
    PAD, CAPH, MAXW = 24, 150, 2000
    rows, row, x = [], [], PAD
    for tile in tiles:
        tw = max(tile[0].size[0], 300)
        if row and x + tw + PAD > MAXW: rows.append(row); row, x = [], PAD
        row.append(tile); x += tw + PAD
    if row: rows.append(row)
    W = max([1300] + [PAD + sum(max(t[0].size[0], 300) + PAD for t in r) for r in rows]); H = 120 + len(rows) * (TH + CAPH + PAD) + 70
    out = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(out)
    d.text((PAD, 24), "Photo audit · " + title, font=font(40, True), fill=INK)
    d.text((PAD, 76), "gold = pick · HERO = phone + 9:16 export · WIDE = desktop · dashed = what a phone (4:5) / desktop (16:10) crop shows · + = focal point", font=font(20), fill=MUTED)
    y = 120
    for r in rows:
        x = PAD
        for t, f, rank, role, w, h, note in r:
            tw = t.size[0]; pick = role.startswith("HERO") or role.startswith("WIDE")
            if pick: d.rectangle([x - 8, y - 8, x + tw + 7, y + TH + 7], outline=GOLD, width=8)
            out.paste(t, (x, y))
            if pick:
                lab = "★ " + role.split(" ·")[0]
                d.rectangle([x, y, x + 16 + int(d.textlength(lab, font=font(26, True))), y + 44], fill=GOLD); d.text((x + 8, y + 6), lab, font=font(26, True), fill=(40, 28, 6))
            orient = "portrait" if h > w else "landscape"
            d.text((x, y + TH + 12), "#%d  %s" % (rank, f.split("/")[-1]), font=font(20, True), fill=INK)
            d.text((x, y + TH + 40), "%d×%d · %s" % (w, h, orient), font=font(18), fill=MUTED)
            d.text((x, y + TH + 64), "role: " + role, font=font(18), fill=GOLD if pick else MUTED)
            words, line, ly = note.split(" "), "", y + TH + 90
            for wd in words:
                if d.textlength(line + " " + wd, font=font(17)) > max(tw, 300): d.text((x, ly), line.strip(), font=font(17), fill=MUTED); line, ly = "", ly + 22
                line += " " + wd
            d.text((x, ly), line.strip(), font=font(17), fill=MUTED)
            x += max(tw, 300) + PAD
        y += TH + CAPH + PAD
    d.text((PAD, H - 50), "All place photos © Cindy Yang. Picks are suggestions — Cindy can overrule any of them (assets/places/PHOTO_AUDIT.md).", font=font(18), fill=MUTED)
    path = os.path.join(OUT, "photo-audit-%s.png" % key); out.save(path, optimize=True); print(path, out.size)

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for k, (title, items) in SHEETS.items(): sheet(k, title, items)
