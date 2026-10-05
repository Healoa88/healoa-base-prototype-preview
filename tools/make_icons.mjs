// HeaLoa app icons + iOS launch images (v2026-10-05-e, queue 4 · PWA).
// Renders one SVG (dawn sun over three soft ridges, no text) to PNG with Playwright/Chromium.
//   node tools/make_icons.mjs     → assets/icons/*
// The art is full-bleed with the sun inside the central 60%, so the same picture works as
// "any" and "maskable" (Android crops to a circle / squircle; iOS rounds the corners itself).
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "assets", "icons");
fs.mkdirSync(OUT, { recursive: true });

export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7ead6"/><stop offset=".62" stop-color="#f1d3ad"/><stop offset="1" stop-color="#e9bf92"/>
    </linearGradient>
    <radialGradient id="glow" cx="256" cy="236" r="170" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff4dc" stop-opacity=".9"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <circle cx="256" cy="236" r="170" fill="url(#glow)"/>
  <circle cx="256" cy="240" r="74" fill="#d9874b"/>
  <path d="M0 318 C70 262 132 250 196 286 C238 310 276 270 330 248 C392 222 450 252 512 300 L512 512 L0 512 Z" fill="#8fa99c"/>
  <path d="M0 362 C64 330 118 322 178 346 C236 370 286 330 350 318 C414 306 466 330 512 352 L512 512 L0 512 Z" fill="#5d8475"/>
  <path d="M0 414 C80 384 150 384 226 404 C300 424 380 396 512 400 L512 512 L0 512 Z" fill="#2f5d50"/>
</svg>`;

const FAVICON_SVG = ICON_SVG; // same art; readable as sun + ridges at 16–32 px

// iOS launch images (apple-touch-startup-image): portrait, CSS size × DPR. Plain cream page,
// the icon and the word HeaLoa — no language-specific words, so zh and en share them.
export const SPLASH = [
  [440, 956, 3], [430, 932, 3], [428, 926, 3], [402, 874, 3], [393, 852, 3], [390, 844, 3],
  [414, 896, 3], [375, 812, 3], [414, 896, 2], [375, 667, 2]
];
export const splashName = ([w, h, r]) => `splash-${w * r}x${h * r}.png`;

const browser = await chromium.launch();
const page = await browser.newPage();
async function shot(html, w, h, file) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden}</style></head><body>${html}</body></html>`);
  await page.screenshot({ path: path.join(OUT, file), omitBackground: false });
}
const svgAt = (s) => ICON_SVG.replace("<svg ", `<svg width="${s}" height="${s}" style="display:block" `);
for (const [s, f] of [[512, "icon-512.png"], [192, "icon-192.png"], [180, "apple-touch-icon.png"], [32, "favicon-32.png"], [16, "favicon-16.png"]]) {
  await shot(svgAt(s), s, s, f);
}
fs.writeFileSync(path.join(OUT, "favicon.svg"), FAVICON_SVG + "\n");
for (const sp of SPLASH) {
  const [cw, ch, r] = sp;
  const W = cw * r, H = ch * r, icon = Math.round(cw * 0.3) * r;
  const html = `<div style="width:${W}px;height:${H}px;background:#f6f1e8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${18 * r}px;font-family:'Noto Sans','Helvetica Neue',Arial,sans-serif">
    <div style="width:${icon}px;height:${icon}px;border-radius:${Math.round(icon * 0.225)}px;overflow:hidden;box-shadow:0 ${4 * r}px ${18 * r}px rgba(47,93,80,.18)">${svgAt(icon)}</div>
    <div style="font-size:${30 * r}px;font-weight:700;letter-spacing:.02em;color:#2f5d50">HeaLoa</div>
  </div>`;
  await shot(html, W, H, splashName(sp));
}
await browser.close();
console.log("icons →", path.relative(ROOT, OUT), fs.readdirSync(OUT).join(" "));
