/**
 * Add to Home Screen / offline tests (v2026-10-05-e, queue 4 · PWA).
 *  1. manifest.webmanifest + manifest.en.webmanifest: id / start_url / scope resolve INSIDE the GitHub Pages sub-path
 *     /healoa-base-prototype-preview/ (never the domain root), standalone, theme / background colours, 192 + 512 icons
 *     (any + maskable) that exist at the size they claim; en starts at ./?lang=en; no banned words; no official-site link.
 *  2. index.html: manifest link, favicons, 180×180 apple-touch-icon, iOS launch images whose pixel size matches their
 *     media query, title + description; sw.js registered with a relative URL.
 *  3. sw.js: VERSION = app VERSION; SHELL_URLS lists exactly the local CSS / JS index.html loads (same ?v=); every
 *     precached file exists; videos / SONO / 3D stay out of the cache; no official-site link; no root-absolute URLs.
 *  4. Browser (127.0.0.1 under the same sub-path): the worker controls the page with scope = the sub-path, the first
 *     screen + key photos are cached, and with the network OFF a reload still paints the first screen (zh and ?lang=en);
 *     the en page points at the en manifest. Without the opt-in flag an automated browser does not register the worker
 *     (so the other suites keep routing every request themselves).
 * Run: node tests/pwa.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer, ROOT } from "./lib/server.mjs";
import { scanLocale, scanText, BANNED_ANYWHERE, VERSION } from "./wording.mjs";
const SITE_RE = new RegExp(["healoa", "com"].join("\\."), "i"); /* the official site (R08) — spelled out nowhere in this file */

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 400) : ""}`);
}
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const exists = (f) => fs.existsSync(path.join(ROOT, f.split("?")[0]));
function pngSize(f) {
  const b = fs.readFileSync(path.join(ROOT, f));
  if (b.toString("ascii", 1, 4) !== "PNG") return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const LIVE = "https://healoa88.github.io/healoa-base-prototype-preview/";
const inSub = (u) => u.startsWith(LIVE);
const html = read("index.html");
const sw = read("sw.js");

/* ---------- 1. manifests ---------- */
for (const [file, lang] of [["manifest.webmanifest", "zh"], ["manifest.en.webmanifest", "en"]]) {
  let m = null;
  try { m = JSON.parse(read(file)); } catch (e) { check(`${file}: valid JSON`, false, String(e)); continue; }
  const at = new URL(file, LIVE);
  const id = new URL(m.id, at).href, start = new URL(m.start_url, at).href, scope = new URL(m.scope, at).href;
  check(`${file}: id / start_url / scope stay inside /healoa-base-prototype-preview/`, inSub(id) && inSub(start) && scope === LIVE, { id, start, scope });
  check(`${file}: start_url is the app page${lang === "en" ? " in English (?lang=en)" : ""}`, lang === "en" ? start === LIVE + "?lang=en" : start === LIVE, start);
  check(`${file}: standalone + name / short_name + colours match the page`, m.display === "standalone" && m.name && m.short_name === "HeaLoa" &&
    m.theme_color === "#f6f1e8" && m.background_color === "#f6f1e8" && html.includes('<meta name="theme-color" content="#f6f1e8">'), { display: m.display, name: m.name });
  const png = (m.icons || []).filter((i) => i.type === "image/png");
  const need = ["192x192 any", "512x512 any", "192x192 maskable", "512x512 maskable"];
  const have = png.map((i) => `${i.sizes} ${i.purpose || "any"}`);
  check(`${file}: 192 + 512 PNG icons, both "any" and "maskable"`, need.every((n) => have.includes(n)), have);
  const bad = (m.icons || []).filter((i) => {
    if (!exists(i.src) || i.src.startsWith("/") || /^https?:/.test(i.src)) return true;
    if (i.type !== "image/png") return false;
    const s = pngSize(i.src); return !s || `${s.w}x${s.h}` !== i.sizes;
  }).map((i) => i.src + " " + i.sizes);
  check(`${file}: every icon file exists at the size it claims (relative paths)`, bad.length === 0, bad);
  const text = JSON.stringify(m);
  const hits = [...scanLocale(`${m.name}\n${m.description}`, lang), ...scanText(text, BANNED_ANYWHERE)];
  check(`${file}: no banned words, no official-site link`, hits.length === 0 && !SITE_RE.test(text), hits);
  if (lang === "zh") check(`${file}: description = the page description`, html.includes(`<meta name="description" content="${m.description}">`), m.description);
}

/* ---------- 2. index.html head ---------- */
check("index.html links the manifest (relative)", /<link rel="manifest" href="manifest\.webmanifest">/.test(html));
const icons = [...html.matchAll(/<link rel="(icon|apple-touch-icon)" href="([^"]+)"/g)].map((m) => ({ rel: m[1], href: m[2] }));
check("index.html: SVG + PNG favicons and an apple-touch-icon, all present on disk", icons.some((i) => i.href.endsWith(".svg")) && icons.some((i) => i.href.endsWith(".png") && i.rel === "icon") &&
  icons.some((i) => i.rel === "apple-touch-icon") && icons.every((i) => exists(i.href)), icons);
const ati = icons.find((i) => i.rel === "apple-touch-icon");
const atiSize = ati && pngSize(ati.href);
check("apple-touch-icon is 180×180", atiSize && atiSize.w === 180 && atiSize.h === 180, atiSize);
const splash = [...html.matchAll(/<link rel="apple-touch-startup-image" media="\(device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)\)[^"]*" href="([^"]+)">/g)];
const badSplash = splash.filter((s) => { if (!exists(s[4])) return true; const z = pngSize(s[4]); return !z || z.w !== +s[1] * +s[3] || z.h !== +s[2] * +s[3]; }).map((s) => s[4]);
check(`iOS launch images: ${splash.length} portrait sizes incl. 390×844@3, each file matches its media query`, splash.length >= 8 && splash.some((s) => s[1] === "390" && s[3] === "3") && badSplash.length === 0, badSplash);
check("index.html: apple-mobile-web-app-capable + title HeaLoa", /name="apple-mobile-web-app-capable" content="yes"/.test(html) && /name="apple-mobile-web-app-title" content="HeaLoa"/.test(html));
check("index.html: page title + description present", /<title>HeaLoa · [^<]+<\/title>/.test(html) && /<meta name="description" content="[^"]{10,}">/.test(html));
check("index.html registers sw.js with a relative URL and scope ./ (stays under the sub-path)", /serviceWorker\.register\("sw\.js", \{ scope: "\.\/" \}\)/.test(html));

/* ---------- 3. sw.js ---------- */
const swVersion = (sw.match(/var VERSION = "([^"]+)"/) || [])[1];
check("sw.js VERSION = app VERSION (a new version clears the old cache)", swVersion === VERSION, { swVersion, VERSION });
const listOf = (name) => { const m = sw.match(new RegExp(`var ${name} = \\[([\\s\\S]*?)\\];`)); return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : []; };
const SHELL = listOf("SHELL_URLS"), KEY = listOf("KEY_PHOTOS");
const loaded = [...html.matchAll(/<script src="(app\/[^"]+)"/g), ...html.matchAll(/<link rel="stylesheet" href="(app\/[^"]+)"/g)].map((m) => m[1]);
const missing = loaded.filter((u) => !SHELL.includes(u));
const stale = SHELL.filter((u) => /^app\//.test(u) && !loaded.includes(u));
check("sw.js SHELL_URLS = every CSS / JS index.html loads, same ?v= (bump both together)", missing.length === 0 && stale.length === 0 && SHELL.includes("./"), { missing, stale });
const gone = [...SHELL.filter((u) => u !== "./"), ...KEY].filter((u) => !exists(u));
check(`sw.js: all ${SHELL.length + KEY.length} precached files exist`, gone.length === 0, gone);
check("sw.js precaches the first-session poster and both season home photos", KEY.includes("assets/practices/09-plaza-form-wfull.webp") &&
  KEY.some((u) => u.includes("wudang/02-terrace-sunrise")) && KEY.some((u) => u.includes("harbin/01-night-snow-roofs")), KEY);
check("sw.js never caches video / SONO / 3D (Range + mp4 / mp3 / spz / vendor three+spark bypass)", /range/.test(sw) && /mp4/.test(sw) && /mp3/.test(sw) && /spz/.test(sw) && /three\|spark/.test(sw) &&
  ![...SHELL, ...KEY].some((u) => /\.(mp4|mp3|spz)|vendor\/(three|spark)/.test(u)));
check("sw.js / manifests: no official-site link, no root-absolute URLs", !SITE_RE.test(sw + read("manifest.webmanifest") + read("manifest.en.webmanifest")) &&
  ![...SHELL, ...KEY].some((u) => u.startsWith("/") || /^https?:/.test(u)));

/* ---------- 4. browser: worker scope + offline first paint ---------- */
let server, browser;
try {
  let base;
  ({ server, base } = await startServer());
  browser = await chromium.launch();
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "zh-CN" });
    const p = await ctx.newPage();
    await p.goto(base);
    await p.waitForTimeout(2500);
    const n = await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
    check("automated browser without the opt-in flag: no service worker (other suites unaffected)", n === 0, n);
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "zh-CN" });
  await ctx.addInitScript(() => { try { localStorage.setItem("healoa.pwa.sw", "1"); } catch (e) {} });
  const errors = [];
  const p = await ctx.newPage();
  p.setDefaultTimeout(15000);
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(base);
  const reg = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, script: r.active && r.active.scriptURL }; });
  check("service worker active, scope = the sub-path (not the domain root)", reg.scope === base && reg.script === base + "sw.js", reg);
  await p.waitForFunction(async () => {
    const names = await caches.keys();
    return names.some((n) => n.startsWith("healoa-shell-")) && names.some((n) => n.startsWith("healoa-photos-"));
  });
  const cached = await p.evaluate(async (b) => ({
    index: !!(await caches.match(b)),
    poster: !!(await caches.match(b + "assets/practices/09-plaza-form-wfull.webp")),
    hero: !!(await caches.match(b + "assets/places/wudang/02-terrace-sunrise-wfull.webp")),
    appjs: !!(await caches.match([...document.scripts].map((s) => s.src).find((s) => /app\/app\.js/.test(s)))),
    mp4: (await Promise.all((await caches.keys()).map(async (n) => (await (await caches.open(n)).keys()).filter((r) => /\.(mp4|mp3|spz)/.test(r.url)).length))).reduce((a, c) => a + c, 0)
  }), base);
  check("cache holds the page, app.js, the first-session poster and the autumn home photo; no video / audio / 3D", cached.index && cached.appjs && cached.poster && cached.hero && cached.mp4 === 0, cached);
  await p.reload();
  await p.waitForFunction(() => !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await p.reload();
  await p.waitForFunction(() => window.__healoa && window.__healoa.go);
  const off = await p.evaluate(() => {
    const first = document.getElementById("vFirst"), home = document.getElementById("vHome");
    const shown = [first, home].find((v) => v && !v.classList.contains("hidden"));
    return { title: document.title, shown: shown && shown.id, text: shown ? shown.innerText.slice(0, 60) : "", css: getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)" || !!document.querySelector(".app") };
  });
  check("network OFF: reload still paints the first screen in zh (cached page + CSS + JS)", /HeaLoa · 顺着季节养/.test(off.title) && !!off.shown && off.text.length > 5, off);
  const poster = await p.evaluate(() => new Promise((res) => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(0); i.src = "assets/practices/09-plaza-form-wfull.webp"; }));
  check("network OFF: the first-session poster photo loads from the cache", poster > 0, poster);
  await p.goto(base + "?lang=en");
  await p.waitForFunction(() => window.__healoa && window.__healoa.go);
  const en = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, manifest: document.querySelector('link[rel="manifest"]').getAttribute("href") }));
  check("network OFF: ?lang=en opens the English first screen and points at the en manifest", en.lang === "en" && /Live with the season/.test(en.title) && en.manifest === "manifest.en.webmanifest", en);
  check("no page errors during the offline run", errors.length === 0, errors.slice(0, 5));
  await ctx.close();
} catch (e) {
  check("test run crashed", false, String((e && e.stack) || e));
} finally {
  if (browser) await browser.close();
  if (server) server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\npwa: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "pwa.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
