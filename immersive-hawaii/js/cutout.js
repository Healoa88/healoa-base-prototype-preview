/* HeaLoa · 夏威夷样张 — cutout clean-up + light matching (pure functions, no DOM; unit-tested in tests/immersive-hawaii.mjs).
 * clean(): after background removal, pixels that still have the SAME colour as the removed background and are
 *   connected to it (flood fill from the transparent area and the photo border) are cleared; tiny floating specks
 *   are dropped; the 1–2 px edge that is still background-coloured is faded out (no halo).
 * lightMatch(): per-channel gain that brings the cutout's average brightness/colour toward the background around
 *   where it is placed (partial, clamped, so a black dog stays a black dog). */
(function (root) {
  'use strict';
  const lum = (r, g, b) => .299 * r + .587 * g + .114 * b;
  // background palette: colours of the original photo where the remover made it transparent + the photo border ring
  function palette(src, cut, w, h, k = 6) {
    const bins = new Map(); const add = i => { const r = src[i], g = src[i + 1], b = src[i + 2]; const key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
      let e = bins.get(key); if (!e) bins.set(key, e = [0, 0, 0, 0]); e[0] += r; e[1] += g; e[2] += b; e[3]++; };
    const step = Math.max(1, Math.round(Math.sqrt(w * h / 40000)));
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) { const i = (y * w + x) * 4; if (cut[i + 3] < 24) add(i); }
    const ring = Math.max(2, Math.round(Math.min(w, h) * .015));
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (x < ring || y < ring || x >= w - ring || y >= h - ring) add((y * w + x) * 4);
    return [...bins.values()].sort((a, b) => b[3] - a[3]).slice(0, k).filter((e, _, arr) => e[3] >= arr[0][3] * .04).map(e => [e[0] / e[3], e[1] / e[3], e[2] / e[3]]);
  }
  function distTo(pal, r, g, b) { let m = 1e9; for (const p of pal) { const dr = r - p[0], dg = g - p[1], db = b - p[2]; const d = Math.sqrt(dr * dr * .9 + dg * dg * 1.2 + db * db * .9); if (d < m) m = d; } return m; }
  /** src: RGBA of the original photo; cut: RGBA of the removed-background result (same size, modified in place). */
  function clean(src, cut, w, h, opt = {}) {
    const T = opt.tol ?? 34, n = w * h; const pal = palette(src, cut, w, h); if (!pal.length) return { removed: 0, specks: 0, palette: pal };
    const col = i => distTo(pal, src[i * 4], src[i * 4 + 1], src[i * 4 + 2]);
    const seen = new Uint8Array(n), q = new Int32Array(n); let qh = 0, qt = 0, removed = 0;
    const seed = p => { if (!seen[p]) { seen[p] = 1; q[qt++] = p; } };
    for (let p = 0; p < n; p++) if (cut[p * 4 + 3] < 24) seed(p);
    for (let x = 0; x < w; x++) { if (col(x) < T) seed(x); const p = (h - 1) * w + x; if (col(p) < T) seed(p); }
    for (let y = 0; y < h; y++) { const a = y * w, b = y * w + w - 1; if (col(a) < T) seed(a); if (col(b) < T) seed(b); }
    while (qh < qt) { const p = q[qh++]; if (cut[p * 4 + 3] >= 24) { cut[p * 4 + 3] = 0; removed++; }
      const x = p % w, y = (p / w) | 0;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const m of nb) if (m >= 0 && !seen[m] && cut[m * 4 + 3] >= 24 && col(m) < T) { seen[m] = 1; q[qt++] = m; } }
    // drop floating specks (components < 1.5% of the largest one)
    const lab = new Int32Array(n).fill(-1), sizes = []; let big = 0;
    for (let p = 0; p < n; p++) { if (lab[p] >= 0 || cut[p * 4 + 3] < 24) continue; const id = sizes.length; let s = 0; qh = qt = 0; q[qt++] = p; lab[p] = id;
      while (qh < qt) { const c = q[qh++]; s++; const x = c % w, y = (c / w) | 0;
        for (const m of [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, y > 0 ? c - w : -1, y < h - 1 ? c + w : -1]) if (m >= 0 && lab[m] < 0 && cut[m * 4 + 3] >= 24) { lab[m] = id; q[qt++] = m; } }
      sizes.push(s); if (s > big) big = s; }
    let specks = 0; for (let p = 0; p < n; p++) if (lab[p] >= 0 && sizes[lab[p]] < big * .015) { cut[p * 4 + 3] = 0; specks++; }
    // defringe: edge pixels still close to the background colour fade out
    for (let pass = 0; pass < 2; pass++) { const edge = [];
      for (let p = 0; p < n; p++) { if (cut[p * 4 + 3] === 0) continue; const x = p % w, y = (p / w) | 0;
        if ((x > 0 && cut[(p - 1) * 4 + 3] === 0) || (x < w - 1 && cut[(p + 1) * 4 + 3] === 0) || (y > 0 && cut[(p - w) * 4 + 3] === 0) || (y < h - 1 && cut[(p + w) * 4 + 3] === 0)) edge.push(p); }
      for (const p of edge) { const d = col(p); if (d < T * 2) cut[p * 4 + 3] = Math.round(cut[p * 4 + 3] * Math.max(0, (d - T * .5) / (T * 1.5))); } }
    return { removed, specks, palette: pal };
  }
  /** alpha-weighted mean RGB (0–255) of an RGBA buffer */
  function meanRGB(d, alphaMin = 24) { let r = 0, g = 0, b = 0, s = 0; for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (a < alphaMin) continue; r += d[i] * a; g += d[i + 1] * a; b += d[i + 2] * a; s += a; }
    return s ? [r / s, g / s, b / s] : [128, 128, 128]; }
  /** gain [r,g,b] to multiply the cutout by: brightness toward the background (strength .75, clamped .45–1.35), plus a light colour cast (.35). */
  function lightMatch(bg, cut, opt = {}) {
    const bl = Math.max(1, lum(...bg)), cl = Math.max(1, lum(...cut)), s = opt.strength ?? .75, cs = opt.cast ?? .35;
    const k = Math.min(1.35, Math.max(.45, Math.pow(bl / cl, s)));
    return [0, 1, 2].map(i => { const cast = (bg[i] / bl) / Math.max(.05, cut[i] / cl); return +(k * (1 + (Math.min(1.6, Math.max(.6, cast)) - 1) * cs)).toFixed(4); });
  }
  const api = { clean, palette, meanRGB, lightMatch, lum };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HLCutout = api;
})(typeof window !== 'undefined' ? window : globalThis);
