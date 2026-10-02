/**
 * Season + solar-term tests (v2026-09-27-w). Season follows the 24 solar terms (立春 / 立夏 / 立秋 / 立冬),
 * with exact dates for 2025–2028 (app/data.js SOLAR_TERM_DATES); spring / summer are named honestly and the
 * app shows the coming autumn as a look ahead (never "today is autumn"). Static unit tests + a browser check with ?date=.
 * Run: node tests/season.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import vm from "vm";
import { startServer, ROOT } from "./lib/server.mjs";
import { toResult } from "./lib/flow.mjs";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 400) : ""}`);
}
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ["app/i18n/zh.js", "app/i18n/en.js", "app/i18n/ja.js", "app/i18n/es.js", "app/i18n/i18n.js", "app/social.js", "app/share-targets.js", "app/data.js", "app/rules.js", "app/kb.js", "app/match.js"]) vm.runInContext(read(f), ctx, { filename: f });
const D = ctx.HEALOA_DATA, R = ctx.HEALOA_RULES;
const day = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const at = (s) => ({ date: s, season: R.seasonFor(day(s)), term: R.solarTermFor(day(s)) });

// ---- 1. one date well inside each season ----
{
  const cases = [["2026-04-10", "spring", "清明"], ["2026-07-15", "summer", "小暑"], ["2026-09-27", "autumn", "秋分"], ["2027-01-10", "winter", "小寒"]];
  const got = cases.map(([d]) => at(d));
  check("one date inside each season: 2026-04-10 春 · 清明, 2026-07-15 夏 · 小暑, 2026-09-27 秋 · 秋分, 2027-01-10 冬 · 小寒", cases.every(([, s, t], i) => got[i].season === s && got[i].term === t), got);
}
// ---- 2. boundaries (day before / day of) for 立冬 / 立春 / 立夏 / 立秋, 2026 and 2027 ----
const BOUNDS = [
  ["2026-11-06", "autumn", "霜降"], ["2026-11-07", "winter", "立冬"], ["2026-11-10", "winter", "立冬"],
  ["2027-11-06", "autumn", "霜降"], ["2027-11-07", "winter", "立冬"],
  ["2026-02-03", "winter", "大寒"], ["2026-02-04", "spring", "立春"], ["2027-02-03", "winter", "大寒"], ["2027-02-04", "spring", "立春"],
  ["2026-05-04", "spring", "谷雨"], ["2026-05-05", "summer", "立夏"], ["2027-05-05", "spring", "谷雨"], ["2027-05-06", "summer", "立夏"],
  ["2026-08-06", "summer", "大暑"], ["2026-08-07", "autumn", "立秋"], ["2027-08-07", "summer", "大暑"], ["2027-08-08", "autumn", "立秋"],
];
for (const [d, s, t] of BOUNDS) { const g = at(d); check(`boundary ${d} → ${s} · ${t}`, g.season === s && g.term === t, g); }
// ---- 3. year wrap: before 小寒 it is still 冬至 of the previous year ----
{
  const g = ["2026-12-21", "2026-12-22", "2026-12-31", "2027-01-01", "2027-01-04", "2027-01-05"].map(at);
  check("year wrap: 12-21 大雪, 12-22 冬至 … 01-04 冬至, 01-05 小寒 — all winter", g.every((x) => x.season === "winter") && g.map((x) => x.term).join(",") === "大雪,冬至,冬至,冬至,冬至,小寒", g);
}
// ---- 4. the old bug: March–August never falls back to autumn (every day 2026-03-01 … 2026-08-06, and 2027 …08-07) ----
{
  const wrong = [];
  for (const y of [2026, 2027]) for (let t = new Date(y, 2, 1); t < new Date(y, 7, y === 2026 ? 7 : 8); t.setDate(t.getDate() + 1)) {
    const s = R.seasonFor(t);
    if (s === "autumn" || s === "winter") wrong.push(`${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()} ${s}`);
  }
  check("every day from 03-01 until 立秋 (2026 + 2027) is spring or summer — never 秋 / 冬 (month fallback bug fixed)", wrong.length === 0, wrong.slice(0, 5));
}
// ---- 5. exact 2026–2027 dates for all 24 terms (spot-check a few that differ from the old typical table) ----
{
  const T = D.SOLAR_TERM_DATES;
  const ok = T[2026] && T[2027] && T[2026].length === 24 && T[2027].length === 24 &&
    JSON.stringify(T[2026][20]) === "[11,7]" && JSON.stringify(T[2026][3]) === "[2,18]" && JSON.stringify(T[2026][6]) === "[4,5]" && JSON.stringify(T[2027][4]) === "[3,6]" && JSON.stringify(T[2027][14]) === "[8,8]";
  const mono = [2025, 2026, 2027, 2028].every((y) => T[y].every((md, i) => i === 0 || md[0] * 100 + md[1] > T[y][i - 1][0] * 100 + T[y][i - 1][1]));
  check("exact term dates 2025–2028 present (24 each, increasing); 2026 立冬 11-07, 雨水 02-18, 清明 04-05; 2027 惊蛰 03-06, 立秋 08-08", ok && mono);
  check("2026-02-18 is 雨水 (exact), 2026-04-04 still 春分, 2026-04-05 清明", at("2026-02-18").term === "雨水" && at("2026-04-04").term === "春分" && at("2026-04-05").term === "清明");
}
// ---- 6. years without an exact table use the typical dates ----
{
  const g = [at("2031-11-06"), at("2031-11-07"), at("2031-05-05"), at("2031-04-10")];
  check("fallback year 2031 (typical dates): 11-06 秋, 11-07 冬 · 立冬, 05-05 夏, 04-10 春", g[0].season === "autumn" && g[1].season === "winter" && g[1].term === "立冬" && g[2].season === "summer" && g[3].season === "spring", g);
}
// ---- 7. content season: spring / summer show autumn as a look ahead; autumn / winter show themselves ----
check("contentSeasonFor: spring → autumn, summer → autumn, autumn → autumn, winter → winter; SEASON_NAMES has 春 / 夏 / 秋 / 冬",
  R.contentSeasonFor("spring") === "autumn" && R.contentSeasonFor("summer") === "autumn" && R.contentSeasonFor("autumn") === "autumn" && R.contentSeasonFor("winter") === "winter" &&
  ["spring", "summer", "autumn", "winter"].map((s) => D.SEASON_NAMES[s]).join("") === "春夏秋冬");

// ---- 8. browser: what the customer sees on those dates ----
let server, browser;
try {
  let base;
  ({ server, base } = await startServer());
  browser = await chromium.launch();
  async function home(date, lang = "") {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "zh-CN" });
    const p = await c.newPage(); await p.goto(`${base}?date=${date}${lang}`); await p.evaluate(() => localStorage.clear()); await p.reload();
    return { c, p };
  }
  const probes = {};
  for (const d of ["2026-11-06", "2026-11-07", "2026-11-10", "2027-01-10", "2027-04-10", "2026-07-20", "2026-09-27"]) {
    const { c, p } = await home(d);
    const now = await p.textContent("#homeSeasonNow");
    await toResult(p, "cold");
    const title = await p.textContent("#resultTitle");
    await p.click('#resultBody [data-action="openCareplan"]');
    await p.waitForSelector("#vCareplan:not(.hidden)");
    probes[d] = { now, title, note: await p.textContent("#blkNote .muted") };
    await c.close();
  }
  check("2026-11-06 home: 霜降前后 · 秋天; result 秋 ·", probes["2026-11-06"].now === "今天是霜降前后 · 秋天" && probes["2026-11-06"].title.startsWith("秋 ·"), probes["2026-11-06"]);
  check("2026-11-07 / 11-10 (after 立冬) home: 今天是立冬前后 · 冬天; result 冬 · 为什么是这几个地方 (no more 「立冬前后 · 秋天」)",
    ["2026-11-07", "2026-11-10"].every((d) => probes[d].now === "今天是立冬前后 · 冬天" && probes[d].title === "冬 · 为什么是这几个地方" && probes[d].note.includes("立冬前后 · 冬天")), [probes["2026-11-07"], probes["2026-11-10"]]);
  check("2027-01-10 home: 小寒前后 · 冬天", probes["2027-01-10"].now === "今天是小寒前后 · 冬天", probes["2027-01-10"]);
  check("2027-04-10 (spring): says 清明前后 · 春天 and that spring content is being prepared; autumn shown only as 「先看看秋天」",
    /^今天是清明前后 · 春天。春天的内容还在准备，先看看秋天$/.test(probes["2027-04-10"].now) && probes["2027-04-10"].note.startsWith("先看看秋天") && !/前后 · 秋天/.test(JSON.stringify(probes["2027-04-10"])), probes["2027-04-10"]);
  check("2026-07-20 (summer): says 小暑前后 · 夏天, content labelled 「先看看秋天」", probes["2026-07-20"].now.startsWith("今天是小暑前后 · 夏天。夏天的内容还在准备") && probes["2026-07-20"].note.startsWith("先看看秋天"), probes["2026-07-20"]);
  check("2026-09-27 (today): 秋分前后 · 秋天 unchanged", probes["2026-09-27"].now === "今天是秋分前后 · 秋天", probes["2026-09-27"]);
  {
    const { c, p } = await home("2027-04-10", "&lang=ja");
    const ja = await p.textContent("#homeSeasonNow");
    const { c: c2, p: p2 } = await home("2027-04-10", "&lang=en");
    const en = await p2.textContent("#homeSeasonNow");
    check("en / ja drafts have the spring notice too (parity)", /春/.test(ja) && /用意中/.test(ja) && /Spring/.test(en) && /prepared/.test(en), { ja, en });
    await c.close(); await c2.close();
  }
} catch (e) {
  check("season browser run crashed", false, String((e && e.stack) || e));
} finally {
  if (browser) await browser.close();
  if (server) server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\nseason: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "season.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
