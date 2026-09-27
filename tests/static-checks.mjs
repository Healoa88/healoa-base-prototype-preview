/**
 * Deterministic static checks (no browser) for the v3 healing main line.
 * Run: node tests/static-checks.mjs
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { execSync } from "child_process";
import { ROOT } from "./lib/server.mjs";
import { BANNED_BY_LOCALE, BANNED_CUSTOMER_WORDS, BANNED_ANYWHERE, CONDITION_LABELS, CONDITION_IDS, DISCLAIMER, VERSION, LOCALES, RESTORATIVE_WORDS, scanText, scanLocale, stripJsComments, CJK_RE } from "./wording.mjs";
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
const CUSTOMER_FILES = ["index.html", "app/data.js", "app/rules.js", "app/kb.js", "app/match.js", "app/app.js", "app/i18n/i18n.js", "app/social.js", "app/share-targets.js", "scene-seed-legacy.html" /* archived, reachable only via old #seed= links */];
const scan = {};
for (const f of CUSTOMER_FILES) scan[f] = scanLocale(read(f), "zh");
for (const [l, f] of Object.entries(LOCALE_FILES)) scan[f] = scanLocale(read(f), l);
const totalHits = Object.values(scan).reduce((a, h) => a + h.length, 0);
check("banned-words (locale-aware): " + Object.values(LOCALE_FILES).join(", ") + " with their own lists; code/markup with zh", totalHits === 0, totalHits ? scan : `0 hits (zh ${BANNED_CUSTOMER_WORDS.length} words; ` + LOCALES.filter((l) => l !== "zh").map((l) => `${l} ${BANNED_BY_LOCALE[l].words.length}`).join(", ") + ")");
{
  const zhW = BANNED_BY_LOCALE.zh.words, enW = BANNED_BY_LOCALE.en.words, jaW = BANNED_BY_LOCALE.ja.words;
  const enNeed = ["digital asset", "AGI", "infrastructure", "network effect", "future friend", "heal", "heals", "cure", "treat", "treatment", "therapy", "therapeutic", "diagnose", "patient", "doctor", "insomnia", "hypertension", "blood pressure", "improve", "relieve", "medicine", "streak", "points", "reward", "unlock", "invite friends"];
  const jaNeed = ["治療", "治す", "効果", "診断", "患者", "医師", "不眠症", "高血圧", "改善", "薬", "ポイント", "招待特典", "デジタル資産"];
  const allIn = (need, have) => need.every((w) => have.includes(w));
  check("banned-word config: derived from rules/healoa-rules.json; still contains the zh locked 24 + 数字资产/网络效应/基础设施, the en 26 (word match) and ja 13 (substring) merged-plan words; es empty (deferred, TODO)",
    JSON.stringify(LOCALES) === '["zh","en","ja","es"]' && /healoa-rules\.json/.test(read("tests/wording.mjs")) && zhW.length >= 27 && allIn(["治疗", "治愈", "疗效", "诊断", "降压", "降血压", "治失眠", "改善", "缓解", "调理", "药", "患者", "医生", "高血压", "失眠", "累", "烦", "日记", "打卡", "积分", "邀请好友", "解锁", "排行", "情绪曲线", "数字资产", "网络效应", "基础设施"], zhW) &&
    BANNED_BY_LOCALE.en.match === "word" && allIn(enNeed, enW) &&
    BANNED_BY_LOCALE.ja.match === "substring" && allIn(jaNeed, jaW) &&
    Array.isArray(BANNED_BY_LOCALE.es.words) && BANNED_BY_LOCALE.es.words.length === 0 && /TODO\(native review\)/.test(read("tests/wording.mjs")), { zh: zhW.length, en: enW.length, ja: jaW.length });
  // The word matcher really catches the en phrases (and does not flag brand names like HeaLoa or words like "healing").
  const probe = scanLocale("Doctor says this will heal and improve your blood pressure. Earn points!", "en").map((h) => h.word);
  check("en word matcher: catches doctor / heal / improve / blood pressure / points; ignores HeaLoa", ["doctor", "heal", "improve", "blood pressure", "points"].every((w) => probe.includes(w)) && scanLocale("HeaLoa · healing places · Photo", "en").length === 0, probe);
}

// 2. App-only words anywhere in tracked files (tests/, rules/ and HEALOA_RULES.md hold the list itself, so they are excluded).
let tracked = [];
try { tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean); } catch { tracked = CUSTOMER_FILES; }
const untrackedNew = ["index.html", "app/data.js", "app/rules.js", "app/app.js", "app/app.css", "app/kb.js", "app/match.js", "app/social.js", ...Object.values(LOCALE_FILES), "app/i18n/i18n.js", "README.md", "PRODUCT_CURRENT.md", "DECISIONS.md", "vendor/qrcode.js"].filter((f) => fs.existsSync(path.join(ROOT, f)));
const files = [...new Set([...tracked, ...untrackedNew])].filter((f) => !f.startsWith("tests/") && !f.startsWith("rules/") && f !== "HEALOA_RULES.md" /* the rule files hold the list itself */ && /\.(html|js|mjs|md|css|json|yml|yaml|txt)$/.test(f) && fs.existsSync(path.join(ROOT, f)));
const anyHits = [];
for (const f of files) for (const h of scanText(read(f), BANNED_ANYWHERE)) anyHits.push({ file: f, ...h });
check("app-only: no healoa.com / 光圈 / Keeper / Host / Choose Again / /board in " + files.length + " files", anyHits.length === 0, anyHits.length ? anyHits.slice(0, 10) : null);

// 3. Load locales + i18n + data + rules in a sandbox (same order as index.html).
const LOAD_ORDER = [...Object.values(LOCALE_FILES), "app/i18n/i18n.js", "app/social.js", "app/share-targets.js", "app/data.js", "app/rules.js", "app/kb.js", "app/match.js"];
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of LOAD_ORDER) vm.runInContext(read(f), ctx, { filename: f });
const D = ctx.HEALOA_DATA, R = ctx.HEALOA_RULES, I = ctx.HEALOA_I18N, ZH = ctx.HEALOA_LOCALES.zh;

check("version label " + VERSION, D.VERSION === VERSION && read("index.html").includes(VERSION));
check("body states (quiz Q1 + safety rules): ≤6 with the locked labels", D.CONDITIONS.length <= 6 && JSON.stringify(D.CONDITIONS.map((c) => c.label)) === JSON.stringify(CONDITION_LABELS));
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
check("practice defaults: 睡不踏实 → 睡前慢呼吸 (吸4呼6, no hold), 心里绷得紧 → 慢走节奏, 血压偏高 → 吸4呼6; 4-7-8 is gone (v2026-09-27-w)",
  D.PRACTICE_DEFAULT.sleep === "breathNight" && D.PRACTICE_DEFAULT.tense === "walk" && D.PRACTICE_DEFAULT.bp === "breath46" && !D.PRACTICES.breath478 &&
  JSON.stringify(D.PRACTICES.breathNight.phases.map((x) => x.sec)) === "[4,6]");

// 6. Share code path never reads the condition.
const app = read("app/app.js");
const shareFn = app.slice(app.indexOf("function buildShare"), app.indexOf("var lastShareCardText"));
check("share payload builder does not touch state.cond / condition labels", shareFn.length > 50 && !/cond/i.test(shareFn), shareFn.length ? null : "buildShare not found");
check("no backend calls (fetch/XMLHttpRequest/sendBeacon) in app code", !/\bfetch\(|XMLHttpRequest|sendBeacon/.test(app));

// 7. i18n foundation.
const html = read("index.html");
check("index.html loads locales → i18n.js → social.js → share-targets.js → data.js → rules.js → app.js in order", (() => {
  const order = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]).filter((f) => f.startsWith("app/"));
  return JSON.stringify(order) === JSON.stringify([...LOAD_ORDER, "app/app.js"]);
})());
check("i18n: zh is the default and the only complete locale", I.DEFAULT === "zh" && I.lang === "zh" && JSON.stringify(I.completeLocales()) === '["zh"]' && ZH.meta.complete === true && ZH.meta.htmlLang === "zh-CN");
const esCode = stripJsComments(read(LOCALE_FILES.es)).trim();
check("i18n: es.js stays an EMPTY stub (deferred until a reviewer exists; no machine translation)", esCode === "" && !ctx.HEALOA_LOCALES.es);
const EN = ctx.HEALOA_LOCALES.en, JA = ctx.HEALOA_LOCALES.ja;
check("i18n: en + ja are DRAFTS (meta.draft true, complete false) → not complete, not in completeLocales, not the default",
  EN && JA && EN.meta.draft === true && JA.meta.draft === true && EN.meta.complete === false && JA.meta.complete === false && I.isDraft("en") && I.isDraft("ja") && !I.isComplete("en") && !I.isComplete("ja") && !I.isDraft("zh") && !I.isDraft("es"));
function shape(o, pth = "") {
  if (Array.isArray(o)) return pth.endsWith("privateWords") ? "A" : "A" + o.length;
  // conditionBreaks = optional per-locale line-break hints for the home buttons (ja only; checked below), not content
  if (o && typeof o === "object") return Object.keys(o).filter((k) => k !== "conditionBreaks" && k !== "marketOpts" /* q8 options follow each market (plan v4 §2.2) */).sort().reduce((r, k) => { r[k] = shape(o[k], pth + "." + k); return r; }, {});
  return typeof o;
}
check("i18n: ja conditionBreaks (button line-break hints) cover the 6 conditions and, without the 「|」 marks, equal the ja labels exactly",
  JA.content.conditionBreaks && Object.keys(JA.content.conditions).every((k) => typeof JA.content.conditionBreaks[k] === "string" && JA.content.conditionBreaks[k].replace(/\|/g, "") === JA.content.conditions[k]));
for (const [code, Lc] of [["en", EN], ["ja", JA]]) {
  const zk = Object.keys(ZH.strings), lk = Object.keys(Lc.strings);
  const miss = zk.filter((k) => typeof Lc.strings[k] !== "string" || Lc.strings[k] === ""), extra = lk.filter((k) => !(k in ZH.strings));
  const same = zk.filter((k) => Lc.strings[k] === ZH.strings[k] && CJK_RE.test(ZH.strings[k]) && code === "en");
  check(`i18n: ${code} draft has every zh key (${zk.length}) and the same content shape (places, 12 care combos, practices, quiz …) — no silent zh fallback`,
    miss.length === 0 && extra.length === 0 && same.length === 0 && JSON.stringify(shape(Lc.content)) === JSON.stringify(shape(ZH.content)), { miss, extra, same: same.slice(0, 5) });
}
{
  const enText = JSON.stringify([EN.strings, EN.content]);
  check("i18n: en draft has no CJK characters (no untranslated zh left)", !CJK_RE.test(enText.replace(/…/g, "")), (enText.match(new RegExp(CJK_RE.source, "g")) || []).slice(0, 10).join(""));
}
check("i18n: ja.js header says it needs native review (Japanese engineer)", /NEEDS NATIVE REVIEW/.test(read(LOCALE_FILES.ja)) && /Japanese engineer/.test(read(LOCALE_FILES.ja)));
check("i18n: en.js header says Cindy proofreads with Muse", /Muse/.test(read(LOCALE_FILES.en)) && /DRAFT/.test(read(LOCALE_FILES.en)));
check("cindyLine stays empty in every locale (zh / en / ja)", [ZH, EN, JA].every((Lc) => Object.values(Lc.content.places).every((p) => p.cindyLine === "")));
{
  // Draft data as a ?lang=en visitor sees it (separate sandbox).
  const c2 = { location: { search: "?lang=en" }, URLSearchParams }; c2.globalThis = c2; vm.createContext(c2);
  for (const f of LOAD_ORDER) vm.runInContext(read(f), c2, { filename: f });
  const labels = c2.HEALOA_DATA.CONDITIONS.map((c) => c.id + "=" + c.label);
  check("en draft options map to the body states: Deep rest→sleep, Warmth→cold, Easy on the stomach→gut, Steady and calm→bp, Let go of tension→tense, Quiet→quiet",
    c2.HEALOA_I18N.lang === "en" && c2.HEALOA_I18N.draft === true && JSON.stringify(labels) === JSON.stringify(["sleep=Deep rest", "cold=Warmth", "gut=Easy on the stomach", "bp=Steady and calm", "tense=Let go of tension", "quiet=Quiet"]), labels);
  check("en draft: temperatures in °F (Wudang fall 15.2℃ → 59°F), rain in inches", c2.HEALOA_RULES.reasons(c2.HEALOA_RULES.placeById("wudang"), "sleep", "autumn")[0].includes("59°F") && /inches of rain/.test(c2.HEALOA_RULES.reasons(c2.HEALOA_RULES.placeById("wudang"), "sleep", "autumn")[1]));
  const c3 = { location: { search: "?lang=es" }, URLSearchParams }; c3.globalThis = c3; vm.createContext(c3);
  for (const f of LOAD_ORDER) vm.runInContext(read(f), c3, { filename: f });
  check("?lang=es (empty) → zh", c3.HEALOA_I18N.lang === "zh" && c3.HEALOA_DATA.CONDITIONS[0].label === "血压偏高");
}
{
  // 疗愈 / restorative / 癒し only next to place / atmosphere / feeling words.
  const OK_NEAR = { zh: /(氛围|环境|地方|感受|山林|空气|森林)/, en: /(calm|atmosphere|place|air|feel|setting|wooded|quiet)/i, ja: /(空気|雰囲気|場所|森|景色)/ };
  const bad = [];
  for (const [code, word] of Object.entries(RESTORATIVE_WORDS)) {
    const files = code === "zh" ? [LOCALE_FILES.zh, "index.html"] : [LOCALE_FILES[code]];
    for (const f of files) {
      const txt = stripJsComments(read(f));
      let i = -1;
      while ((i = txt.indexOf(word, i + 1)) >= 0) { const win = txt.slice(Math.max(0, i - 16), i + word.length + 16); if (!OK_NEAR[code].test(win)) bad.push({ f, win }); }
    }
  }
  check("疗愈 / restorative / 癒し only describe a place, atmosphere or feeling", bad.length === 0, bad.length ? bad : null);
}
{
  // Per-platform share config.
  const SH = ctx.HEALOA_SHARE;
  const byL = SH && SH.byLocale;
  // v2026-09-27-y (Cindy): the system share sheet + save image / save video do the real work; only buttons that work on their own stay.
  const want = { zh: ["copy"], en: ["sms", "copy"], ja: ["line", "x", "copy"], es: ["whatsapp", "copy"] };
  const okTargets = byL && Object.entries(want).every(([l, ids]) => JSON.stringify(byL[l].targets) === JSON.stringify(ids));
  const qrOk = byL && byL.zh.qr === true && byL.en.qr === false && byL.ja.qr === false && byL.es.qr === false;
  const webOk = Object.values(SH.targets).every((tg) => tg.kind !== "web" || /^https:\/\/[a-z0-9.-]+\//.test(tg.url));
  const noFake = !Object.values(SH.targets).some((tg) => tg.kind === "saveImage") && !["wechat", "xiaohongshu", "weibo", "douyin", "instagram", "facebook"].some((id) => SH.targets[id]);
  check("share targets per locale: zh copy (+QR); en Text/copy; ja LINE/X/copy; es WhatsApp/copy; no save-and-open-the-app platform buttons; QR only in zh; web intents https",
    okTargets && qrOk && webOk && noFake && SH.targets.sms.url.startsWith("sms:"), byL);
  check("share panel: system share + save image + save video buttons in markup", /data-action="shareSend"/.test(html) && /data-action="shareSaveImg"/.test(html) && /id="btnSaveVideo"[^>]*|data-action="shareSaveVideo"/.test(html));
  const labelMiss = [];
  for (const [l, ids] of Object.entries(want)) for (const id of ids) for (const Lc of [ZH, EN, JA]) if (!Lc.strings["share.t." + id] || !Lc.strings["share.guide." + id] && id !== "copy") labelMiss.push(l + ":" + id);
  check("every share target has a label (share.t.*) and a how-to line (share.guide.*) in zh / en / ja", labelMiss.length === 0, labelMiss);
}
const noCjk = {};
for (const f of ["app/app.js", "app/rules.js", "app/kb.js", "app/match.js", "app/data.js", "app/i18n/i18n.js"]) {
  const lines = stripJsComments(read(f)).split("\n").map((t, i) => ({ line: i + 1, t })).filter((x) => CJK_RE.test(x.t));
  if (lines.length) noCjk[f] = lines.slice(0, 5).map((x) => x.line + ": " + x.t.trim().slice(0, 80));
}
check("no hard-coded CJK strings in app/app.js, app/rules.js (and data.js, i18n.js) outside comments", Object.keys(noCjk).length === 0, Object.keys(noCjk).length ? noCjk : null);
const usedKeys = new Set();
for (const f of ["app/app.js", "app/rules.js", "app/match.js", "app/data.js"]) for (const m of read(f).matchAll(/\bt\("([a-zA-Z0-9_.]+)"/g)) usedKeys.add(m[1]);
for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) usedKeys.add(m[1]);
for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(";")) usedKeys.add(pair.split(":")[1]);
for (const m of read("app/app.js").matchAll(/"((?:practice|result|card|share|rules|home|place)\.[a-zA-Z]+)"/g)) usedKeys.add(m[1]);
const missingKeys = [...usedKeys].filter((k) => !k.endsWith(".") /* dynamic prefixes (share.t. / share.guide.) are checked per target */ && typeof ZH.strings[k] !== "string");
check(`i18n: every key used in code + markup exists in zh (${usedKeys.size} keys)`, missingKeys.length === 0, missingKeys.length ? missingKeys : null);
const inline = [...html.matchAll(/<([a-z0-9]+)[^>]*\sdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/g)].map((m) => ({ key: m[2], text: m[3] }));
const drift = inline.filter((x) => x.text !== "" && x.text !== ZH.strings[x.key]);
check(`index.html inline zh fallback text == app/i18n/zh.js (${inline.length} elements)`, inline.length >= 40 && drift.length === 0, drift.length ? drift : null);
check("t(): placeholders filled; missing key in active locale falls back to zh; unknown key returns the key", I.t("result.rank", { n: 2 }) === "第 2 选" && I.t("no.such.key") === "no.such.key" && I.t("disclaimer") === DISCLAIMER);
const social = ctx.HEALOA_SOCIAL;
check("governance: PRODUCT_CURRENT records the merged plan + language workflow (zh ships; en draft → Cindy with Muse; ja draft → Japanese engineer; es deferred); DECISIONS has D-27-02",
  (() => { const pc = read("PRODUCT_CURRENT.md"), dc = read("DECISIONS.md"); return /Muse/.test(pc) && /es/.test(pc) && /deferred|延后|暂缓/.test(pc) && /D-27-02/.test(dc) && pc.includes(VERSION); })());
check("social slot: app/social.js has zh/en/ja/es lists, all EMPTY (no invented account URLs)", social && ["zh", "en", "ja", "es"].every((l) => Array.isArray(social[l]) && social[l].length === 0) && !/https?:\/\//.test(stripJsComments(read("app/social.js"))));
check("share: native navigator.share with copy-link fallback", /navigator\.share\(payload\)/.test(app) && /copyText\(/.test(app));

// 8. Governance files exist.
check("PRODUCT_CURRENT.md + DECISIONS.md present; DECISIONS marks SUPERSEDED", fs.existsSync(path.join(ROOT, "PRODUCT_CURRENT.md")) && fs.existsSync(path.join(ROOT, "DECISIONS.md")) && /SUPERSEDED/.test(fs.existsSync(path.join(ROOT, "DECISIONS.md")) ? read("DECISIONS.md") : ""));

const failed = results.filter((r) => !r.ok);
console.log(`\nstatic-checks: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "static-checks.json"), JSON.stringify({ results, banScan: scan }, null, 2));
process.exit(failed.length ? 1 : 0);
