/**
 * Immersive Hawaii SAMPLE tests (standalone page /immersive-hawaii/).
 * Run: npm run test:immersive
 * 1) unit: points rules/caps + check-in mapping (pure JS, via vm)
 * 2) smoke: Playwright 375x812 — landing → check-in → door → scene → placeholder dog → postcard → revisit, no page errors.
 */
import { chromium } from "playwright";
import http from "http"; import fs from "fs"; import path from "path"; import vm from "vm"; import { fileURLToPath } from "url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const load = f => { const ctx = { module: { exports: {} }, globalThis: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx); return ctx.module.exports; };

// ---- unit: points
const HP = load("immersive-hawaii/js/points.js");
const mem = () => { const m = {}; return { getItem: k => m[k] ?? null, setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; };
let day = "2026-09-25"; const P = HP.create({ storage: mem(), dayKey: () => day });
ok(P.earn("first_visit").ok && !P.earn("first_visit").ok, "first_visit is once");
ok(P.earn("nurture").ok && !P.earn("nurture").ok, "nurture capped daily");
day = "2026-09-26"; ok(P.earn("nurture").ok, "nurture again next day");
ok(P.balance() === 20, "balance sums history (" + P.balance() + ")");
ok(!P.earn("referral_sharer").ok, "sharer reward not available on-device");
ok(P.earn("referral_welcome").ok && !P.earn("referral_welcome").ok, "referral_welcome once per device");
ok(P.history().length === 4, "history length");
// ---- unit: check-in mapping
const C = load("immersive-hawaii/js/checkin.js");
// Cindy 2026-09-27: only places that exist are recommended — no "coming soon" place, no 即将开放 wording anywhere
const everyRec = ["tired", "ok", "energetic"].flatMap(e => ["annoyed", "calm", "happy"].flatMap(m => ["quiet", "breathe", "lively"].map(w => C.recommend({ energy: e, mood: m, want: w }))));
ok(everyRec.every(r => r.place === "hawaii" && r.open === true && !r.nudge) && Object.keys(C.PLACES).join() === "hawaii", "every answer → a place that exists (夏威夷); no closed places");
{ const src = ["immersive-hawaii/index.html", "immersive-hawaii/js/app.js", "immersive-hawaii/js/checkin.js"].map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n");
  ok(!/即将开放|敬请期待|🔒|积分|解锁|邀请|奖励|ptsChip|Photo · Cindy Yang/.test(src), "no points counter, no lock icons, no 即将开放 / 积分 / 解锁 / 邀请 wording, no per-photo credit in the sample source"); }
ok(C.recommend({ want: "breathe" }).place === "hawaii", "透口气 → 夏威夷");
ok(C.recommend({ text: "想要一个新开始" }).place === "hawaii", "新开始 keyword → 夏威夷");
ok(C.recommend({ energy: "energetic" }).mood.timeOfDay === "sunrise", "有精神 → sunrise mood");
const allWhy = ["tired", "ok", "energetic"].flatMap(e => ["annoyed", "calm", "happy"].flatMap(m => ["quiet", "breathe", "lively"].map(w => C.recommend({ energy: e, mood: m, want: w }).why))).join("");
ok(!/治疗|疗愈|改善|睡眠|诊断|医治|健康/.test(allWhy), "no health/medical words in recommendation copy");

// ---- unit: cutout clean-up + light match
const CU = load("immersive-hawaii/js/cutout.js");
{ const w = 60, h = 60, src = new Uint8ClampedArray(w * h * 4), cut = new Uint8ClampedArray(w * h * 4);
  const BG = [205, 222, 238], put = (a, x, y, c, al) => { const i = (y * w + x) * 4; a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; a[i + 3] = al; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inDog = (x - 30) ** 2 + (y - 32) ** 2 < 15 ** 2, eye = (x - 30) ** 2 + (y - 28) ** 2 < 3 ** 2;
    const c = inDog ? (eye ? BG : [120, 70, 40]) : [BG[0] + (x % 3) - 1, BG[1] + (y % 3) - 1, BG[2]]; put(src, x, y, c, 255);
    // the remover left a same-colour band of background around the dog (radius 15–20) and one speck at the corner
    const keep = inDog || (x - 30) ** 2 + (y - 32) ** 2 < 20 ** 2 || (x >= 2 && x <= 3 && y >= 2 && y <= 3); put(cut, x, y, c, keep ? 255 : 0); }
  const r = CU.clean(src, cut, w, h), a = (x, y) => cut[(y * w + x) * 4 + 3];
  ok(a(30, 32 - 18) === 0 && a(30 + 18, 32) === 0, "cutout: same-colour background band connected to the removed area is cleared (" + r.removed + " px)");
  ok(a(2, 2) === 0, "cutout: floating speck removed");
  ok(a(30, 40) === 255 && a(24, 32) === 255, "cutout: the subject itself is kept");
  ok(a(30, 28) === 255, "cutout: background-coloured detail enclosed by the subject (an eye) is kept");
  const dark = CU.lightMatch([40, 30, 25], [200, 200, 200]), bright = CU.lightMatch([220, 200, 180], [60, 60, 60]), same = CU.lightMatch([120, 110, 100], [120, 110, 100]);
  ok(dark.every(g => g < .7) && bright.every(g => g > 1.1) && same.every(g => Math.abs(g - 1) < .01), "light match: bright cutout on a dark scene is dimmed, dark cutout on a bright scene is lifted, equal = 1 — " + JSON.stringify({ dark, bright }));
  ok(CU.lightMatch([2, 2, 2], [250, 250, 250]).every(g => g >= .45 * .8) && CU.lightMatch([250, 250, 250], [2, 2, 2]).every(g => g <= 1.35 * 1.25), "light match is clamped (a black dog stays a black dog)");
}

// ---- smoke (browser)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
const server = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split("?")[0]); if (u.endsWith("/")) u += "index.html"; const f = path.resolve(ROOT, "." + u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, "127.0.0.1", r)); const BASE = `http://127.0.0.1:${server.address().port}/immersive-hawaii/`;
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const pg = await (await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, acceptDownloads: true })).newPage(); const errs = []; pg.on("pageerror", e => errs.push(e.message));
  await pg.goto(BASE); await pg.waitForFunction(() => window.__ready, null, { timeout: 30000 });
  ok(await pg.evaluate(() => window.__ready > 0), "WebGL scene boots");
  ok(/告诉我你今天的状态/.test(await pg.textContent("#landH")), "landing value prop");
  ok(/不会上传/.test(await pg.textContent("#landing")), "privacy line on landing");
  await pg.click("#startBtn"); for (const v of ["ok", "calm", "breathe"]) { await pg.click(`#ciOpts button[data-v="${v}"]`); await pg.waitForTimeout(300); }
  await pg.click("#ciSkipText"); ok(/不是医疗建议/.test(await pg.textContent("#rec")), "not-medical disclaimer on recommendation");
  await pg.click("#goHawaii"); ok(await pg.isVisible("#guide"), "first-run guide shown"); await pg.click("#guideOk");
  await pg.click("#doorBtn"); await pg.waitForTimeout(2300); ok(await pg.evaluate(() => window.__S.scene === "lava"), "door → lava scene");
  await pg.click("#to2"); await pg.click("#sampleBtn"); await pg.waitForTimeout(600); ok(await pg.evaluate(() => !!window.__S.cut), "placeholder companion placed");
  // what you see is what you get: framed canvas = postcard top layer, above the panel
  const fr = await pg.evaluate(() => { const r = document.querySelector("#gl").getBoundingClientRect(), pt = document.querySelector("#p2").getBoundingClientRect(); return { a: r.width / r.height, bottom: r.bottom, panelTop: pt.top, top: r.top }; });
  ok(Math.abs(fr.a - 1080 / 1380) < .01 && fr.bottom <= fr.panelTop && fr.top >= 40, "placement area = postcard top layer (aspect 1080:1380) and sits above the bottom menu — " + JSON.stringify(fr));
  const diff = await pg.evaluate(async () => { await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const cv = document.querySelector("#gl"), W = 54, H = 69;
    const small = src => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); x.drawImage(src, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; };
    const live = small(cv), card = small(window.__hawaii.renderTop()); let s = 0; for (let i = 0; i < live.length; i += 4) s += Math.abs(live[i] - card[i]) + Math.abs(live[i + 1] - card[i + 1]) + Math.abs(live[i + 2] - card[i + 2]); return s / (W * H * 3); });
  ok(diff < 8, "live placement view matches the postcard's photo layer (downscaled, mean |Δ| " + diff.toFixed(2) + "/255)");
  const inside = await pg.evaluate(() => { const S = window.__S, p = S.pos[S.scene]; p.x = 5; p.y = -3; window.__hawaii.clampPos(); const b = window.__hawaii.visibleBox(); return p.x > b.x0 && p.x < b.x1 && p.y - p.h > b.y0 && p.y <= b.y1; });
  ok(inside, "dragging is clamped to the postcard area");
  // speaker = loop one audio file (placeholder path until Cindy's MP3)
  await pg.click("#soundBtn"); const th = await pg.evaluate(() => ({ loop: window.__theme.loop, src: window.__theme.src }));
  ok(th.loop === true && /assets\/audio\/PLACEHOLDER-hawaii-theme-cindy-will-supply\.mp3$/.test(th.src), "speaker loops the theme audio file (clearly-named placeholder path) — " + th.src.split("/").slice(-3).join("/"));
  await pg.click("#soundBtn");
  await pg.click("#to3"); await pg.fill("#lineIn", "测试一句"); await pg.click("#makeCard"); await pg.waitForSelector("#keep:not(.hidden)", { timeout: 20000 });
  ok(await pg.evaluate(() => document.querySelector("#keepImg").src.startsWith("blob:")), "postcard PNG generated");
  // share = navigator.share WITH files; video is a real file (download event with .mp4/.webm)
  await pg.evaluate(() => { navigator.canShare = () => true; navigator.share = async d => { window.__shared = (d.files || []).map(f => [f.name, f.type, f.size]); }; });
  await pg.click("#shareBtn"); let sh = await pg.evaluate(() => window.__shared);
  ok(sh && sh[0][1] === "image/png" && /\.png$/.test(sh[0][0]) && sh[0][2] > 1000, "share (postcard) passes the PNG file to navigator.share — " + JSON.stringify(sh));
  await pg.click("#swapKeep"); await pg.waitForSelector("#keep:not(.hidden)", { timeout: 60000 }); await pg.waitForFunction(() => window.__hawaii.lastVid, null, { timeout: 60000 });
  const vid = await pg.evaluate(() => ({ t: window.__hawaii.lastVid.type, n: window.__hawaii.lastVid.size }));
  ok(/^video\/(mp4|webm)$/.test(vid.t) && vid.n > 10000, "video recorded as a real file — " + JSON.stringify(vid));
  await pg.click("#shareBtn"); sh = await pg.evaluate(() => window.__shared);
  ok(sh && /^video\//.test(sh[0][1]) && /\.(mp4|webm)$/.test(sh[0][0]) && sh.length === 2, "share (video) passes the video file first, postcard second — " + JSON.stringify(sh));
  const [dl] = await Promise.all([pg.waitForEvent("download", { timeout: 15000 }), pg.click("#saveVid")]);
  const dlp = await dl.path(); ok(/\.(mp4|webm)$/.test(dl.suggestedFilename()) && fs.statSync(dlp).size > 10000, "存视频文件 downloads a real video file — " + dl.suggestedFilename() + " " + fs.statSync(dlp).size + " B");
  await pg.click("#closeKeep");
  const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem("healoa.immersive.hawaii.v2") || "null"));
  ok(saved && saved.line === "测试一句" && !!saved.cut, "place saved to localStorage");
  await pg.reload(); await pg.waitForFunction(() => window.__ready); ok(/还在这里/.test(await pg.textContent("#landH")), "revisit copy 你上次留下的，还在这里");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  // copyright line visible on the landing page (replaces the per-photo credit)
  ok(/Cindy Yang 实地拍摄，受版权保护/.test(await pg.textContent("#landing .copyright")), "copyright line on the landing page");
  // responsive: desktop = centred phone-width frame (never stretched); phone landscape = scene left + menu column right
  for (const [vw, vh, kind] of [[1280, 800, "desktop"], [844, 390, "landscape"]]) {
    const pd = await (await b.newContext({ viewport: { width: vw, height: vh } })).newPage(); await pd.goto(BASE + "?x=" + kind); await pd.waitForFunction(() => window.__ready, null, { timeout: 30000 });
    const g = await pd.evaluate(() => { const s = document.querySelector("#stage").getBoundingClientRect(), c = document.querySelector("#gl"), bt = document.querySelector(".bottom").getBoundingClientRect(); return { sw: s.width, sh: s.height, sl: s.left, cw: c.width / (devicePixelRatio || 1), ch: c.height / (devicePixelRatio || 1), bl: bt.left, bw: bt.width, vw: innerWidth }; });
    const okG = kind === "desktop" ? g.sw <= 470 && Math.abs(g.sl + g.sw / 2 - g.vw / 2) < 2 && Math.abs(g.cw - g.sw) < 2 && Math.abs(g.ch - g.sh) < 2
      : g.sw < g.vw && g.bl >= g.sw - 1 && g.bw >= 280 && Math.abs(g.cw - g.sw) < 2;
    ok(okG, `${kind} ${vw}×${vh}: ${kind === "desktop" ? "centred phone-width frame, canvas = frame size" : "scene on the left, menu column on the right, canvas = scene size"} — ` + JSON.stringify(g));
    await pd.context().close();
  }
} finally { await b.close(); server.close(); }
console.log(`\n${pass}/${pass + fail} PASS`); process.exit(fail ? 1 : 0);
