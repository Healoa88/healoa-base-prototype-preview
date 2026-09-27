/**
 * Deterministic static checks (no browser) for the v3 healing main line.
 * Run: node tests/static-checks.mjs
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { execSync } from "child_process";
import { ROOT } from "./lib/server.mjs";
import { BANNED_CUSTOMER_WORDS, BANNED_ANYWHERE, CONDITION_LABELS, CONDITION_IDS, DISCLAIMER, VERSION, scanText } from "./wording.mjs";
import { climateSummary } from "../tools/climate-summary.mjs";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 300) : ""}`);
}
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// 1. Banned-word scan of customer-facing sources.
const CUSTOMER_FILES = ["index.html", "app/data.js", "app/rules.js", "app/app.js", "scene-seed-legacy.html" /* archived, reachable only via old #seed= links */];
const scan = {};
for (const f of CUSTOMER_FILES) scan[f] = scanText(read(f), BANNED_CUSTOMER_WORDS);
const totalHits = Object.values(scan).reduce((a, h) => a + h.length, 0);
check("banned-words: customer-facing sources (" + CUSTOMER_FILES.join(", ") + ")", totalHits === 0, totalHits ? scan : `0 hits for ${BANNED_CUSTOMER_WORDS.length} words`);

// 2. App-only words anywhere in tracked files (tests/ hold the list itself, so they are excluded).
let tracked = [];
try { tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean); } catch { tracked = CUSTOMER_FILES; }
const untrackedNew = ["index.html", "app/data.js", "app/rules.js", "app/app.js", "app/app.css", "README.md", "PRODUCT_CURRENT.md", "DECISIONS.md", "vendor/qrcode.js"].filter((f) => fs.existsSync(path.join(ROOT, f)));
const files = [...new Set([...tracked, ...untrackedNew])].filter((f) => !f.startsWith("tests/") && /\.(html|js|mjs|md|css|json|yml|yaml|txt)$/.test(f) && fs.existsSync(path.join(ROOT, f)));
const anyHits = [];
for (const f of files) for (const h of scanText(read(f), BANNED_ANYWHERE)) anyHits.push({ file: f, ...h });
check("app-only: no healoa.com / 光圈 / Keeper / Host / Choose Again / /board in " + files.length + " files", anyHits.length === 0, anyHits.length ? anyHits.slice(0, 10) : null);

// 3. Load data + rules in a sandbox.
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(read("app/data.js"), ctx);
vm.runInContext(read("app/rules.js"), ctx);
const D = ctx.HEALOA_DATA, R = ctx.HEALOA_RULES;

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

// 7. Governance files exist.
check("PRODUCT_CURRENT.md + DECISIONS.md present; DECISIONS marks SUPERSEDED", fs.existsSync(path.join(ROOT, "PRODUCT_CURRENT.md")) && fs.existsSync(path.join(ROOT, "DECISIONS.md")) && /SUPERSEDED/.test(fs.existsSync(path.join(ROOT, "DECISIONS.md")) ? read("DECISIONS.md") : ""));

const failed = results.filter((r) => !r.ok);
console.log(`\nstatic-checks: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "static-checks.json"), JSON.stringify({ results, banScan: scan }, null, 2));
process.exit(failed.length ? 1 : 0);
