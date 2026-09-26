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
ok(C.recommend({ energy: "tired", mood: "annoyed", want: "breathe" }).place === "onsen", "累+烦 → 温泉 (即将开放)");
ok(C.recommend({ energy: "tired", mood: "annoyed" }).open === false, "non-Hawaii rec is not open + nudge");
ok(C.recommend({ want: "breathe" }).place === "hawaii", "透口气 → 夏威夷");
ok(C.recommend({ text: "想要一个新开始" }).place === "hawaii", "新开始 keyword → 夏威夷");
ok(C.recommend({ energy: "energetic" }).mood.timeOfDay === "sunrise", "有精神 → sunrise mood");
const allWhy = ["tired", "ok", "energetic"].flatMap(e => ["annoyed", "calm", "happy"].flatMap(m => ["quiet", "breathe", "lively"].map(w => C.recommend({ energy: e, mood: m, want: w }).why))).join("");
ok(!/治疗|疗愈|改善|睡眠|诊断|医治|健康/.test(allWhy), "no health/medical words in recommendation copy");

// ---- smoke (browser)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
const server = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split("?")[0]); if (u.endsWith("/")) u += "index.html"; const f = path.resolve(ROOT, "." + u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, "127.0.0.1", r)); const BASE = `http://127.0.0.1:${server.address().port}/immersive-hawaii/`;
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const pg = await (await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 })).newPage(); const errs = []; pg.on("pageerror", e => errs.push(e.message));
  await pg.goto(BASE); await pg.waitForFunction(() => window.__ready, null, { timeout: 30000 });
  ok(await pg.evaluate(() => window.__ready > 0), "WebGL scene boots");
  ok(/告诉我你今天的状态/.test(await pg.textContent("#landH")), "landing value prop");
  ok(/不会上传/.test(await pg.textContent("#landing")), "privacy line on landing");
  await pg.click("#startBtn"); for (const v of ["ok", "calm", "breathe"]) { await pg.click(`#ciOpts button[data-v="${v}"]`); await pg.waitForTimeout(300); }
  await pg.click("#ciSkipText"); ok(/不是医疗建议/.test(await pg.textContent("#rec")), "not-medical disclaimer on recommendation");
  await pg.click("#goHawaii"); ok(await pg.isVisible("#guide"), "first-run guide shown"); await pg.click("#guideOk");
  await pg.click("#doorBtn"); await pg.waitForTimeout(2300); ok(await pg.evaluate(() => window.__S.scene === "lava"), "door → lava scene");
  await pg.click("#to2"); await pg.click("#sampleBtn"); await pg.waitForTimeout(600); ok(await pg.evaluate(() => !!window.__S.cut), "placeholder companion placed");
  await pg.click("#to3"); await pg.fill("#lineIn", "测试一句"); await pg.click("#makeCard"); await pg.waitForSelector("#keep:not(.hidden)", { timeout: 20000 });
  ok(await pg.evaluate(() => document.querySelector("#keepImg").src.startsWith("blob:")), "postcard PNG generated");
  const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem("healoa.immersive.hawaii.v2") || "null"));
  ok(saved && saved.line === "测试一句" && !!saved.cut, "place saved to localStorage");
  await pg.reload(); await pg.waitForFunction(() => window.__ready); ok(/还在这里/.test(await pg.textContent("#landH")), "revisit copy 你上次留下的，还在这里");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
} finally { await b.close(); server.close(); }
console.log(`\n${pass}/${pass + fail} PASS`); process.exit(fail ? 1 : 0);
