/**
 * Deterministic static checks (no browser) for the v3 healing main line.
 * Run: node tests/static-checks.mjs
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { execSync } from "child_process";
import { ROOT } from "./lib/server.mjs";
import { BANNED_BY_LOCALE, BANNED_CUSTOMER_WORDS, BANNED_ANYWHERE, CONDITION_LABELS, CONDITION_IDS, DISCLAIMER, VERSION, LOCALES, scanText, scanLocale, stripJsComments, CJK_RE } from "./wording.mjs";
import { climateSummary } from "../tools/climate-summary.mjs";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 300) : ""}`);
}
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// 1. Banned-word scan of customer-facing sources — locale-aware (rules per locale in tests/wording.mjs).
//    Each locale file is scanned with its own list; code + markup (zh inline fallback) with the zh list.
const LOCALE_FILES = Object.fromEntries(LOCALES.map((l) => [l, `app/i18n/${l}.js`]));
const CUSTOMER_FILES = ["index.html", "app/data.js", "app/rules.js", "app/app.js", "app/i18n/i18n.js", "app/social.js", "scene-seed-legacy.html" /* archived, reachable only via old #seed= links */];
const scan = {};
for (const f of CUSTOMER_FILES) scan[f] = scanLocale(read(f), "zh");
for (const [l, f] of Object.entries(LOCALE_FILES)) scan[f] = scanLocale(read(f), l);
const totalHits = Object.values(scan).reduce((a, h) => a + h.length, 0);
check("banned-words (locale-aware): " + Object.values(LOCALE_FILES).join(", ") + " with their own lists; code/markup with zh", totalHits === 0, totalHits ? scan : `0 hits (zh ${BANNED_CUSTOMER_WORDS.length} words; ` + LOCALES.filter((l) => l !== "zh").map((l) => `${l} ${BANNED_BY_LOCALE[l].words.length}`).join(", ") + " — placeholders pending native review)");
check("banned-word config: one list per locale (zh, en, ja, es); zh = locked list; others empty placeholders", JSON.stringify(LOCALES) === '["zh","en","ja","es"]' && BANNED_BY_LOCALE.zh.words.length === 24 && ["en", "ja", "es"].every((l) => Array.isArray(BANNED_BY_LOCALE[l].words) && BANNED_BY_LOCALE[l].words.length === 0) && /TODO\(native review\)/.test(read("tests/wording.mjs")));

// 2. App-only words anywhere in tracked files (tests/ hold the list itself, so they are excluded).
let tracked = [];
try { tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean); } catch { tracked = CUSTOMER_FILES; }
const untrackedNew = ["index.html", "app/data.js", "app/rules.js", "app/app.js", "app/app.css", "app/social.js", ...Object.values(LOCALE_FILES), "app/i18n/i18n.js", "README.md", "PRODUCT_CURRENT.md", "DECISIONS.md", "vendor/qrcode.js"].filter((f) => fs.existsSync(path.join(ROOT, f)));
const files = [...new Set([...tracked, ...untrackedNew])].filter((f) => !f.startsWith("tests/") && /\.(html|js|mjs|md|css|json|yml|yaml|txt)$/.test(f) && fs.existsSync(path.join(ROOT, f)));
const anyHits = [];
for (const f of files) for (const h of scanText(read(f), BANNED_ANYWHERE)) anyHits.push({ file: f, ...h });
check("app-only: no healoa.com / 光圈 / Keeper / Host / Choose Again / /board in " + files.length + " files", anyHits.length === 0, anyHits.length ? anyHits.slice(0, 10) : null);

// 3. Load locales + i18n + data + rules in a sandbox (same order as index.html).
const LOAD_ORDER = [...Object.values(LOCALE_FILES), "app/i18n/i18n.js", "app/social.js", "app/data.js", "app/rules.js"];
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of LOAD_ORDER) vm.runInContext(read(f), ctx, { filename: f });
const D = ctx.HEALOA_DATA, R = ctx.HEALOA_RULES, I = ctx.HEALOA_I18N, ZH = ctx.HEALOA_LOCALES.zh;

check("version label " + VERSION, D.VERSION === VERSION && read("index.html").includes(VERSION));
check("home: ≤6 one-tap conditions with the locked labels", D.CONDITIONS.length <= 6 && JSON.stringify(D.CONDITIONS.map((c) => c.label)) === JSON.stringify(CONDITION_LABELS));
check("disclaimer text is exact in data + index", D.DISCLAIMER === DISCLAIMER && read("index.html").includes(DISCLAIMER));
check("keeps place name 山居慢住", D.PLACES.some((p) => p.name.includes("山居慢住")));

// 4. Climate numbers match raw NASA POWER JSON.
const sum = climateSummary();
const mism = [];
for (const [id, rec] of Object.entries(sum)) {
  const d = D.CLIMATE[id];
  if (!d) { mism.push(id + " missing"); continue; }
  for (const s of ["autumn", "winter"]) for (const k of ["t", "rh", "pr"]) if (d[s][k] !== rec[s][k]) mism.push(`${id}.${s}.${k} ${d[s][k]}≠${rec[s][k]}`);
  for (const s of ["autumn", "winter"]) if (JSON.stringify(d[s].months) !== JSON.stringify(rec[s].months)) mism.push(`${id}.${s}.months`);
}
check("climate numbers in app/data.js == data/climate/*.json (NASA POWER)", mism.length === 0, mism.length ? mism : null);

// 5. Photos exist; places without a photo never in top 3; cindyLine never invented.
const missing = D.PLACES.filter((p) => p.photo && !fs.existsSync(path.join(ROOT, p.photo))).map((p) => p.photo);
const allPhotos = D.PLACES.flatMap((p) => [p.photo, ...(p.gallery || [])]).concat(Object.values(D.PRACTICES).map((x) => x.photo)).concat(Object.values(D.SEASON_PHOTO)).filter(Boolean);
const missing2 = allPhotos.filter((f) => !fs.existsSync(path.join(ROOT, f)));
check("every referenced photo exists in the repo", missing.length === 0 && missing2.length === 0, [...missing, ...missing2].join(", ") || null);
check("cindyLine slots are empty (Cindy's words are never generated)", D.PLACES.every((p) => p.cindyLine === ""));

const sig = {};
let topOk = true, topDetail = [];
for (const s of ["autumn", "winter"]) for (const c of CONDITION_IDS) {
  const r = R.recommend(c, s);
  if (r.top.length < 1 || r.top.length > 3) { topOk = false; topDetail.push(`${c}/${s} top=${r.top.length}`); }
  for (const t of r.top) {
    const p = R.placeById(t.id);
    if (!p.photo) { topOk = false; topDetail.push(`${c}/${s} ${t.id} has no photo`); }
    const withNum = t.reasons.filter((x) => /\d/.test(x)).length;
    if (t.reasons.length < 3 || withNum < 2) { topOk = false; topDetail.push(`${c}/${s} ${t.id} reasons=${t.reasons.length} numeric=${withNum}`); }
  }
  sig[`${c}/${s}`] = JSON.stringify([r.top.map((x) => x.id), r.skip.map((x) => x.id), D.CARE[c][s].note.map((n) => n.text)]);
}
check("rules: every condition×season gives 1–3 top places, all with photos, 3 reasons (≥2 with numbers)", topOk, topDetail.length ? topDetail : null);
const distinct = new Set(Object.values(sig)).size;
check("rules: output changes with input (12 condition×season combos → 12 distinct results)", distinct === 12, `${distinct} distinct`);

const bpW = R.recommend("bp", "winter");
check("血压偏高+冬: warm place first, Harbin + hot-spring town in 这个季节先不选",
  bpW.top[0].id === "pattaya" && bpW.skip.some((x) => x.id === "harbin") && bpW.skip.some((x) => x.id === "onsen") && !bpW.top.some((x) => x.id === "harbin"),
  { top: bpW.top.map((x) => x.id), skip: bpW.skip.map((x) => x.id + ": " + x.reason) });
check("血压偏高+冬: hot-spring caution ≤41℃ and ≤10 分钟", /41℃/.test(D.CARE.bp.winter.safety) && /10 分钟/.test(D.CARE.bp.winter.safety), D.CARE.bp.winter.safety);
const slA = R.recommend("sleep", "autumn");
check("睡不踏实+秋 differs from 血压偏高+冬", sig["sleep/autumn"] !== sig["bp/winter"] && slA.top[0].id !== bpW.top[0].id, { sleepAutumnTop: slA.top.map((x) => x.id), bpWinterTop: bpW.top.map((x) => x.id) });
check("practice defaults: 睡不踏实 → 4-7-8, 心里绷得紧 → 慢走节奏, 血压偏高 → 吸4呼6 (no breath-hold)",
  D.PRACTICE_DEFAULT.sleep === "breath478" && D.PRACTICE_DEFAULT.tense === "walk" && D.PRACTICE_DEFAULT.bp === "breath46");

// 6. Share code path never reads the condition.
const app = read("app/app.js");
const shareFn = app.slice(app.indexOf("function buildShare"), app.indexOf("var lastShareCardText"));
check("share payload builder does not touch state.cond / condition labels", shareFn.length > 50 && !/cond/i.test(shareFn), shareFn.length ? null : "buildShare not found");
check("no backend calls (fetch/XMLHttpRequest/sendBeacon) in app code", !/\bfetch\(|XMLHttpRequest|sendBeacon/.test(app));

// 7. i18n foundation.
const html = read("index.html");
check("index.html loads locales → i18n.js → social.js → data.js → rules.js → app.js in order", (() => {
  const order = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]).filter((f) => f.startsWith("app/"));
  return JSON.stringify(order) === JSON.stringify([...LOAD_ORDER, "app/app.js"]);
})());
check("i18n: zh is the default and the only complete locale", I.DEFAULT === "zh" && I.lang === "zh" && JSON.stringify(I.completeLocales()) === '["zh"]' && ZH.meta.complete === true && ZH.meta.htmlLang === "zh-CN");
const stubs = ["en", "ja", "es"].map((l) => ({ l, code: stripJsComments(read(LOCALE_FILES[l])).trim() }));
check("i18n: en.js / ja.js / es.js are empty stubs (comment only, no machine translation)", stubs.every((x) => x.code === "") && ["en", "ja", "es"].every((l) => !ctx.HEALOA_LOCALES[l]), stubs.filter((x) => x.code).map((x) => x.l));
const noCjk = {};
for (const f of ["app/app.js", "app/rules.js", "app/data.js", "app/i18n/i18n.js"]) {
  const lines = stripJsComments(read(f)).split("\n").map((t, i) => ({ line: i + 1, t })).filter((x) => CJK_RE.test(x.t));
  if (lines.length) noCjk[f] = lines.slice(0, 5).map((x) => x.line + ": " + x.t.trim().slice(0, 80));
}
check("no hard-coded CJK strings in app/app.js, app/rules.js (and data.js, i18n.js) outside comments", Object.keys(noCjk).length === 0, Object.keys(noCjk).length ? noCjk : null);
const usedKeys = new Set();
for (const f of ["app/app.js", "app/rules.js", "app/data.js"]) for (const m of read(f).matchAll(/\bt\("([a-zA-Z0-9_.]+)"/g)) usedKeys.add(m[1]);
for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) usedKeys.add(m[1]);
for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(";")) usedKeys.add(pair.split(":")[1]);
for (const m of read("app/app.js").matchAll(/"((?:practice|result|card|share|rules|home|place)\.[a-zA-Z]+)"/g)) usedKeys.add(m[1]);
const missingKeys = [...usedKeys].filter((k) => typeof ZH.strings[k] !== "string");
check(`i18n: every key used in code + markup exists in zh (${usedKeys.size} keys)`, missingKeys.length === 0, missingKeys.length ? missingKeys : null);
const inline = [...html.matchAll(/<([a-z0-9]+)[^>]*\sdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/g)].map((m) => ({ key: m[2], text: m[3] }));
const drift = inline.filter((x) => x.text !== "" && x.text !== ZH.strings[x.key]);
check(`index.html inline zh fallback text == app/i18n/zh.js (${inline.length} elements)`, inline.length >= 40 && drift.length === 0, drift.length ? drift : null);
check("t(): placeholders filled; missing key in active locale falls back to zh; unknown key returns the key", I.t("result.rank", { n: 2 }) === "第 2 选" && I.t("no.such.key") === "no.such.key" && I.t("disclaimer") === DISCLAIMER);
const social = ctx.HEALOA_SOCIAL;
check("social slot: app/social.js has zh/en/ja/es lists, all EMPTY (no invented account URLs)", social && ["zh", "en", "ja", "es"].every((l) => Array.isArray(social[l]) && social[l].length === 0) && !/https?:\/\//.test(stripJsComments(read("app/social.js"))));
check("share: native navigator.share with copy-link fallback", /navigator\.share\(payload\)/.test(app) && /copyText\(/.test(app));

// 8. Governance files exist.
check("PRODUCT_CURRENT.md + DECISIONS.md present; DECISIONS marks SUPERSEDED", fs.existsSync(path.join(ROOT, "PRODUCT_CURRENT.md")) && fs.existsSync(path.join(ROOT, "DECISIONS.md")) && /SUPERSEDED/.test(fs.existsSync(path.join(ROOT, "DECISIONS.md")) ? read("DECISIONS.md") : ""));

const failed = results.filter((r) => !r.ok);
console.log(`\nstatic-checks: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "static-checks.json"), JSON.stringify({ results, banScan: scan }, null, 2));
process.exit(failed.length ? 1 : 0);
