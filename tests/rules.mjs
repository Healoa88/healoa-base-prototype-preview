/**
 * Founder-rule suite (v2026-09-27-x): every rule in rules/healoa-rules.json (human-readable: HEALOA_RULES.md)
 * has at least one automated check here. Check ids ("R05.b") are listed in each rule's `enforcedBy`,
 * and the META checks fail if a rule has no passing check or the doc and the JSON drift apart.
 * Static part (no browser) + Playwright part (390×844, zh default; en/ja drafts via ?lang=).
 * Run: node tests/rules.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import vm from "vm";
import { execSync } from "child_process";
import { startServer, ROOT } from "./lib/server.mjs";
import { toResult, runQuiz } from "./lib/flow.mjs";
import { scanLocale, scanRendered, scanText, stripJsComments } from "./wording.mjs";

const RULES = JSON.parse(fs.readFileSync(path.join(ROOT, "rules/healoa-rules.json"), "utf8"));
const rule = (id) => RULES.rules.find((r) => r.id === id);
const results = [];
function check(id, name, ok, detail) {
  results.push({ id, name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  [${id}] ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 400) : ""}`);
}
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const SC = RULES.scope;
const LOCALE_FILES = SC.localeFiles;

/** Scan every customer-facing source with one rule's per-locale list (code/markup with zh, each locale file with its own). */
function scanRule(r) {
  const hits = [];
  const scanWith = (text, locale) => {
    const words = (r.banned && r.banned[locale]) || [];
    if (!words.length) return [];
    // reuse the locale matcher with a rule-only list
    return scanLocaleWords(text, locale, words);
  };
  for (const f of SC.customerCodeFiles) for (const h of scanWith(read(f), SC.codeFilesScannedAs)) hits.push({ f, ...h });
  for (const [l, f] of Object.entries(LOCALE_FILES)) for (const h of scanWith(read(f), l)) hits.push({ f, ...h });
  return hits;
}
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function scanLocaleWords(text, locale, words) {
  if (RULES.matchModes[locale] !== "word") return scanText(text, words);
  const hits = [];
  text.split("\n").forEach((line, i) => {
    for (const w of words) if (new RegExp(`(^|[^\\p{L}\\p{N}])${escRe(w)}($|[^\\p{L}\\p{N}])`, "iu").test(line)) hits.push({ word: w, line: i + 1, text: line.trim().slice(0, 120) });
  });
  return hits;
}
const OUTCOME = rule("R02").outcomePatterns.map((p) => new RegExp(p.re, p.flags));
function outcomeHits(text) {
  const hits = [];
  text.split("\n").forEach((line, i) => { for (const re of OUTCOME) { const m = line.match(re); if (m) hits.push({ re: re.source.slice(0, 30), match: m[0], line: i + 1 }); } });
  return hits;
}

// ================= static =================
// R01 / R02 / R03 / R04 / R07 / R12 — per-rule word lists over every customer-facing source.
const WORD_CHECKS = { R01: "R01.a", R02: "R02.a", R03: "R03.a", R04: "R04.a", R07: "R07.a", R12: "R12.a", R13: "R13.a", R14: "R14.a", R15: "R15.a" };
for (const [rid, cid] of Object.entries(WORD_CHECKS)) {
  const r = rule(rid), hits = scanRule(r);
  const counts = Object.entries(r.banned).map(([l, w]) => `${l} ${w.length}`).join(", ");
  check(cid, `${rid} banned words (${counts}) absent from ${SC.customerCodeFiles.length} code/markup files + ${Object.keys(LOCALE_FILES).length} locale files`, hits.length === 0, hits.length ? hits.slice(0, 8) : null);
}
// R01.b — the six gentle labels are the entry, and none of them names a disease.
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of [...Object.values(LOCALE_FILES), "app/i18n/i18n.js", "app/social.js", "app/share-targets.js", "app/data.js", "app/rules.js", "app/kb.js", "app/match.js"]) vm.runInContext(read(f), ctx, { filename: f });
const D = ctx.HEALOA_DATA, I = ctx.HEALOA_I18N;
{
  const labels = D.CONDITIONS.map((c) => c.label);
  const bad = labels.filter((l) => scanLocaleWords(l, "zh", rule("R01").banned.zh).length);
  // v4: the same gentle labels are the quiz options (Q1 body states, Q6 feelings) and drive the safety rules
  const q = Object.fromEntries(D.QUIZ.map((x) => [x.id, Object.fromEntries(x.options.map((o) => [o.id, o.label]))]));
  const inQuiz = D.CONDITIONS.every((c) => q.q1[c.id] === c.label || q.q6[c.id] === c.label);
  const quizBad = D.QUIZ.flatMap((x) => [x.q, ...x.options.map((o) => o.label)]).filter((l) => scanLocaleWords(l, "zh", rule("R01").banned.zh).length);
  check("R01.b", "zh body-state labels are exactly the gentle labels (" + rule("R01").gentleLabels.zh.join(" / ") + "), appear as the quiz options (Q1 / Q6), and no quiz question or option contains a disease word", JSON.stringify(labels) === JSON.stringify(rule("R01").gentleLabels.zh) && bad.length === 0 && inQuiz && quizBad.length === 0, { labels, bad, inQuiz, quizBad });
}
// R02.b — no outcome phrasing anywhere in customer sources (all languages).
{
  const hits = [];
  for (const f of [...SC.customerCodeFiles, ...Object.values(LOCALE_FILES)]) for (const h of outcomeHits(stripJsComments(read(f)))) hits.push({ f, ...h });
  check("R02.b", `no outcome phrasing (${OUTCOME.length} patterns: 疗愈失眠 / heals insomnia / improves blood pressure / treats anxiety / therapeutic …)`, hits.length === 0, hits.length ? hits.slice(0, 6) : null);
}
// R02.c — 疗愈 / restorative / 癒し only next to place / atmosphere / experience / feeling words.
{
  const r = rule("R02"), bad = [], W = r.allowedNear.window;
  let n = 0;
  for (const [code, word] of Object.entries(r.restorativeWords)) {
    const near = new RegExp(r.allowedNear[code], code === "en" ? "i" : "");
    const files = code === "zh" ? [LOCALE_FILES.zh, ...SC.customerCodeFiles] : [LOCALE_FILES[code]];
    for (const f of files) {
      const txt = stripJsComments(read(f));
      let i = -1;
      while ((i = txt.indexOf(word, i + 1)) >= 0) { n++; const win = txt.slice(Math.max(0, i - W), i + word.length + W); if (!near.test(win)) bad.push({ f, win }); }
    }
  }
  check("R02.c", `疗愈 / restorative / 癒し describe only a place / atmosphere / feeling (${n} uses checked)`, bad.length === 0, bad.length ? bad : null);
}
// R14.b — no practice (any locale) holds the breath longer than maxHoldSec: breath phases whose circle keeps its size,
// and step / intro / phase texts that say "停 N 秒 / hold N / N秒止め" with N > max.
function holdsOf(pr) {
  const out = [];
  if (pr.phases) pr.phases.forEach((ph, i) => { const prev = pr.phases[(i - 1 + pr.phases.length) % pr.phases.length]; if (pr.phases.length > 1 && ph.scale === prev.scale) out.push({ phase: ph.name, sec: ph.sec }); });
  return out;
}
const CN_NUM = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
const HOLD_TEXT = [
  /(?:停|屏|憋)[^，。；]{0,3}?(\d+|[一两二三四五六七八九十])\s*秒/gu,
  /(?:hold|pause|stay)[^.,;]{0,20}?\b(\d+|one|two|three|four|five|six|seven|eight)\s*(?:s\b|sec|second)/giu,
  /(\d+)\s*秒[^、。]{0,2}(?:止め|止ま|キープ)/gu,
];
const EN_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
function textHolds(txt) {
  const out = [];
  for (const re of HOLD_TEXT) for (const m of String(txt).matchAll(re)) { const k = m[1].toLowerCase(); const n = /^\d+$/.test(k) ? +k : CN_NUM[k] || EN_NUM[k] || 99; out.push({ n, m: m[0] }); }
  return out;
}
{
  const MAX = rule("R14").maxHoldSec, bad = [];
  let n = 0;
  if (D.MAX_HOLD_SEC !== MAX) bad.push({ MAX_HOLD_SEC: D.MAX_HOLD_SEC });
  for (const [id, pr] of Object.entries(D.PRACTICES)) {
    for (const h of holdsOf(pr)) { n++; if (h.sec > MAX) bad.push({ id, ...h }); }
    if (pr.steps) pr.steps.forEach((st) => { for (const h of textHolds(st.text)) { n++; if (h.n > MAX) bad.push({ id, step: h.m }); } });
  }
  for (const [code, L] of Object.entries(ctx.HEALOA_LOCALES)) {
    const P = (L.content && L.content.practices) || {};
    for (const [id, tx] of Object.entries(P)) for (const t of [tx.intro, ...(tx.steps || []), ...(tx.phases || [])]) for (const h of textHolds(t)) { n++; if (h.n > MAX) bad.push({ code, id, text: h.m }); }
    for (const t of Object.values((L.content && L.content.homePlan) || {}).flat()) for (const h of textHolds(t)) { n++; if (h.n > MAX) bad.push({ code, homePlan: h.m }); }
  }
  // the detector itself works: a 4-7-8 shape and 「停 7 秒」 text are caught
  const selfTest = holdsOf({ phases: [{ name: "in", sec: 4, scale: 1 }, { name: "hold", sec: 7, scale: 1 }, { name: "out", sec: 8, scale: 0 }] }).some((h) => h.sec === 7) &&
    textHolds("吸 4 秒，停 7 秒，呼 8 秒").some((h) => h.n === 7) && textHolds("pause for 7 seconds").some((h) => h.n === 7) && textHolds("7秒止めて").some((h) => h.n === 7) && textHolds("在上面停两秒").every((h) => h.n === 2);
  check("R14.b", `no practice step holds the breath > ${MAX}s: ${Object.keys(D.PRACTICES).length} practices (phase shapes + step timings) and every intro / step / home-plan text in ${Object.keys(ctx.HEALOA_LOCALES).length} locales (${n} holds found, all ≤ ${MAX}s); detector self-test catches 4-7-8`, bad.length === 0 && selfTest, { bad: bad.slice(0, 6), selfTest });
}

// R05.a — the share builder never reads the body state and only emits allowed URL params.
{
  const app = read("app/app.js");
  const fn = app.slice(app.indexOf("function buildShare"), app.indexOf("var lastShareCardText"));
  const lq = app.slice(app.indexOf("function langQuery"), app.indexOf("function langQuery") + 200).split("\n")[0];
  const params = [...(fn + lq).matchAll(/[?&]([a-z]+)=/g)].map((m) => m[1]);
  const allowed = rule("R05").allowedShareParams;
  check("R05.a", `buildShare() never touches state.cond; its URL params ⊆ {${allowed.join(", ")}}`, fn.length > 50 && !/cond/i.test(fn) && params.length > 0 && params.every((p) => allowed.includes(p)), { params });
}
// R08.a — healoa.com nowhere in the shipped repo (except the files that hold the rule itself).
{
  const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
  const ex = SC.repoWideExclude;
  const files = tracked.filter((f) => !ex.some((e) => f === e || f.startsWith(e)) && /\.(html|js|mjs|md|css|json|yml|yaml|txt)$/.test(f) && fs.existsSync(path.join(ROOT, f)));
  const hits = [];
  for (const f of files) for (const h of scanText(read(f), rule("R08").bannedAnywhere)) hits.push({ f, ...h });
  const r12 = [];
  for (const f of files.filter((f) => !/^vendor\/(three|spark)-\d/.test(f) /* unmodified third-party 3D libraries (three.js has a "// Host Relative URL" comment); still scanned for healoa.com above */)) for (const h of scanText(read(f), rule("R12").bannedAnywhere)) r12.push({ f, ...h });
  check("R08.a", `no "healoa.com" in ${files.length} tracked files (excluding ${ex.join(", ")})`, hits.length === 0, hits.length ? hits.slice(0, 5) : null);
  check("R12.b", `no old product / website terms (${rule("R12").bannedAnywhere.join(" / ")}) in ${files.length} tracked files`, r12.length === 0, r12.length ? r12.slice(0, 5) : null);
}
// R09.b — the home steps describe the main line in order.
{
  const s = ctx.HEALOA_LOCALES.zh.strings;
  const seq = [s["home.step1"], s["home.step2"], s["home.step3"]];
  check("R09.b", "home 「怎么用」 steps (v4): 1 花 2 分钟点几下说身体和心情 → 2 翻牌看 3 个地方和原因 → 3 走进一个地方放松、记下这一次", /2 分钟/.test(seq[0]) && /身体/.test(seq[0]) && /心情/.test(seq[0]) && /翻牌/.test(seq[1]) && /3 个地方/.test(seq[1]) && /原因/.test(seq[1]) && /走进/.test(seq[2]) && /放松/.test(seq[2]) && seq[2].indexOf("放松") < seq[2].indexOf("记下"), seq);
}
// R10.a — no overlay credit; no consumer Cindy / Cindy Yang photo credit or blanket copyright line (D-02-01);
// every photo <img> goes through img() (focal point, cover).
{
  const app = stripJsComments(read("app/app.js")), html = read("index.html"), css = read("app/app.css");
  const r = rule("R10");
  const imgLines = app.split("\n").filter((l) => /<img src=/.test(l));
  const zhCopy = ctx.HEALOA_LOCALES.zh.strings.copyright;
  const locales = ["zh", "en", "ja"];
  const consumerKeys = ["copyright", "imm3d.note", "about.photos", "about.world3d", "about.immersive", "music.noteTrack", "place.cindyLine"];
  const named = [];
  for (const l of locales) {
    const s = ctx.HEALOA_LOCALES[l].strings;
    for (const k of consumerKeys) {
      const v = s[k] || "";
      if (/Cindy\s*Yang|Photo\s*·\s*Cindy|©\s*Cindy|\bCindy\b/.test(v)) named.push(l + ":" + k);
    }
  }
  const ok = zhCopy === "" && r.copyrightZh === "" && !app.includes(r.bannedOverlay) && !html.includes(r.bannedOverlay) &&
    !html.includes(r.revokedCopyrightZh) && !Object.values(ctx.HEALOA_LOCALES).some((Lc) => (Lc.strings.copyright || "").includes("Cindy")) &&
    !/D\.CREDIT|class=\\?"credit/.test(app) && !/\.credit\b/.test(css) &&
    imgLines.length === 1 && /function img\(/.test(app) && /object-position:/.test(app) &&
    /function copyrightRow\(/.test(app) && named.length === 0;
  check("R10.a", `no 「${r.bannedOverlay}」 overlay; copyright strings empty (revoked blanket line); no Cindy / Cindy Yang in consumer photo/about strings; all photo <img> via img() with focal object-position`, ok,
    { imgLines: imgLines.length, zhCopy, named });
}
// R18.a — share config: only buttons that work on their own; QR only in zh; exports are 9:16 1080×1920.
{
  const SH = ctx.HEALOA_SHARE, app = stripJsComments(read("app/app.js")), html = read("index.html");
  const kinds = Object.values(SH.targets).map((x) => x.kind);
  const ok = kinds.every((k) => ["web", "sms", "copy"].includes(k)) && SH.byLocale.zh.qr === true && ["en", "ja", "es"].every((l) => SH.byLocale[l].qr === false) &&
    ["wechat", "xiaohongshu", "douyin", "instagram", "weibo", "facebook"].every((id) => !SH.targets[id]) &&
    /navigator\.share\(/.test(app) && /data-action="shareSend"/.test(html) && /data-action="shareSaveImg"/.test(html) && /data-action="shareSaveVideo"/.test(html) &&
    /width = 1080[^;]*;[^\n]*1920|1080, 1920|1080 \* k|W = 1080/.test(app) && /MediaRecorder/.test(app);
  check("R18.a", `share targets are only web / sms / copy (${Object.keys(SH.targets).join(", ")}); no save-then-open-the-app platform buttons; QR only in zh; system share + save image + save video (MediaRecorder) wired`, ok, SH.byLocale);
}
// R19.a — reminder stays opt-in and off; the practice bed is a licensed local file (or a synth pad) and this preview defaults the 声音 switch ON (D-03-01).
{
  const app = stripJsComments(read("app/app.js"));
  const M = D.MUSIC;
  const zh = ctx.HEALOA_LOCALES.zh.strings, en = ctx.HEALOA_LOCALES.en.strings;
  const rtext = Object.keys(zh).filter((k) => /^(remind|music)\./.test(k)).map((k) => zh[k] + " " + en[k]).join("\n");
  const ok = (M.src === null || /^assets\/audio\/[\w.-]+\.(mp3|m4a|ogg)$/.test(M.src)) && /createOscillator/.test(app) &&
    /MUS = \{ on: lsGet\(LS_MUSIC\) !== false/.test(app) && /notify: false/.test(app) && !/连续|天数|streak|in a row/i.test(rtext) && /没关系|No problem|That's fine/.test(rtext);
  check("R19.a", "music: synthesised pad (WebAudio) or a licensed local file; 声音 defaults ON for this preview (a stored off still wins); reminders start OFF; reminder texts gentle, no streak / missed-day wording", ok, { src: M.src });
}
// R11.a — zh is the only complete locale; en/ja drafts; es empty.
{
  const r = rule("R11");
  const esCode = stripJsComments(read(LOCALE_FILES.es)).trim();
  check("R11.a", "zh default + only complete locale (switcher needs ≥2 → hidden); en/ja meta.draft; es stub empty and es banned list empty",
    I.DEFAULT === r.defaultLocale && JSON.stringify(I.completeLocales()) === '["zh"]' && r.draftLocales.every((l) => I.isDraft(l) && !I.isComplete(l)) && esCode === "" && !ctx.HEALOA_LOCALES.es && (rule("R01").banned.es || []).length === 0 && /codes\.length < 2/.test(read("app/app.js")));
}

// R16.a — knowledge-base layer: every tcm weight is null / pending (→ 0 in scoring); nothing unsourced can be displayed.
{
  const KB = ctx.HEALOA_KB, M = ctx.HEALOA_MATCH;
  const tcm = KB.answerWeights.filter((x) => x.layer === "tcm");
  const allAnswers = Object.fromEntries(D.QUIZ.map((x) => [x.id, x.options.map((o) => o.id).filter((id) => !(x.exclusive || []).includes(id)).slice(0, x.multi ? 99 : 1)]));
  const w = M.weightsFor(allAnswers);
  const tcmScored = Object.keys(w).filter((t) => tcm.some((x) => x.tag === t));
  const unsourcedShown = M.sourced([...KB.seasonAdvice, { text: "FIXTURE", sourceRef: null }, { text: "FIXTURE", sourceRef: "nope" }]);
  const placeSuits = Object.values(KB.placeSuits || {}).every((v) => v === null);
  check("R16.a", `knowledge base: ${tcm.length} tcm-layer weights are all null + status pending-cindy + no sourceRef, and score 0 even with every answer picked; sourced() shows nothing without a verified source (${KB.sources.length} sources, ${KB.seasonAdvice.length} advice slots); placeSuits all pending`,
    tcm.length > 0 && tcm.every((x) => x.weight === null && x.status === "pending-cindy" && x.sourceRef === null) && tcmScored.length === 0 && unsourcedShown.length === 0 && KB.seasonAdvice.every((x) => x.text === null || x.sourceRef) && placeSuits, { tcmScored, unsourcedShown });
}
// R17.a — quiz structure: 8 questions, multi-select exactly where the plan says, every question has options and a skip.
{
  const r = rule("R17");
  const multi = D.QUIZ.filter((x) => x.multi).map((x) => x.id);
  const app = read("app/app.js");
  const renderQ = app.slice(app.indexOf("function renderQuiz"), app.indexOf("function quizAdvance"));
  check("R17.a", `quiz: ${r.questionCount} questions (${D.QUIZ.map((x) => x.id).join(" ")}); multi-select = ${r.multiQuestions.join(" / ")}; every screen renders one question + skip (「都不是 / 说不准」) + back + progress bar`,
    D.QUIZ.length === r.questionCount && JSON.stringify(multi) === JSON.stringify(r.multiQuestions) && D.QUIZ.every((x) => x.options.length >= 2 && x.q) &&
    /quizSkip/.test(renderQ) && /quizPrev/.test(renderQ) && /progressbar/.test(renderQ) && (renderQ.match(/class="quiz-q"/g) || []).length === 1, { multi });
}

// ================= browser =================
let server, browser;
const pageErrors = [];
try {
  let base;
  ({ server, base } = await startServer());
  browser = await chromium.launch();
  const origin = new URL(base).origin;
  const DQ = "date=2026-09-26";
  async function open(url, lang = "zh-CN") {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: lang });
    await c.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
    await c.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
    const p = await c.newPage();
    p.setDefaultTimeout(8000);
    p.on("pageerror", (e) => pageErrors.push(String(e)));
    await p.goto(url);
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem("healoa.first.v1", JSON.stringify({ at: 1 })); }); await p.reload();
    return { c, p };
  }
  const text = (p) => p.evaluate(() => document.body.innerText);
  const hrefs = (p) => p.evaluate(() => [...document.querySelectorAll("[href],[src],[action]")].map((e) => e.getAttribute("href") || e.getAttribute("src") || e.getAttribute("action")));
  // R10.b audit: no overlay credit; no Cindy / Cindy Yang photo credit on screen; photos object-fit: cover + focal.
  const creditAudit = (p, r) => p.evaluate(({ banned, revoked }) => {
    const v = document.querySelector(".view:not(.hidden)");
    const bad = [];
    let n = 0;
    const body = document.body.innerText;
    if (body.includes(banned)) bad.push("overlay credit text");
    if (revoked && body.includes(revoked)) bad.push("revoked copyright line");
    if (/Cindy\s*Yang|©\s*Cindy|\bCindy\b/.test(body)) bad.push("Cindy name in UI");
    for (const im of v.querySelectorAll("img")) {
      const src = im.getAttribute("src") || "";
      if (!src.startsWith("assets/") || !im.offsetParent) continue;
      n++;
      const cs = getComputedStyle(im);
      if (cs.objectFit !== "cover" || !im.style.objectPosition) bad.push(src + " fit=" + cs.objectFit);
    }
    return { n, bad };
  }, { banned: r.bannedOverlay, revoked: r.revokedCopyrightZh });

  // ---- sweep of the zh main path: every screen scanned with ALL rule word lists + outcome patterns; links + credits audited ----
  {
    const { c, p } = await open(base + "?" + DQ);
    const hits = [], outcome = [], links = [], credits = { n: 0, bad: [] };
    const sweep = async (where) => {
      const t = await text(p);
      for (const h of scanRendered(t, "zh")) hits.push({ where, ...h });
      for (const h of outcomeHits(t)) outcome.push({ where, ...h });
      for (const h of await hrefs(p)) if (h && /healoa\.com/i.test(h)) links.push({ where, h });
      const a = await creditAudit(p, rule("R10")); credits.n += a.n; credits.bad.push(...a.bad.map((b) => where + ":" + b));
    };
    await sweep("home");
    await p.click('[data-action="openQuiz"]');
    for (let i = 0; i < 8; i++) { await sweep("quiz " + (i + 1)); await p.click('#quizBody [data-action="quizSkip"]'); }
    await sweep("reveal (face down)"); await p.click('#revealBody [data-action="flipAll"]'); await sweep("reveal (flipped)");
    await p.click('#revealBody [data-action="openWhy"]'); await sweep("why these places");
    await p.evaluate(() => window.__healoa.go("places", {}, true)); await sweep("all places");
    await p.evaluate(() => localStorage.setItem("healoa.log.v1", JSON.stringify([{ d: "2026-09-26", term: 17, place: "wudang", practice: "walk", note: "", at: 1 }, { d: "2026-09-26", term: 17, kind: "card", note: "", at: 2 }])));
    await p.evaluate(() => window.__healoa.go("records", {}, true)); await sweep("我的养护记录");
    for (const season of ["autumn", "winter"]) for (const id of D.CONDITIONS.map((x) => x.id)) {
      await p.evaluate(({ id, season }) => window.__healoa.go("result", { cond: id, season }, true), { id, season }); await sweep(`result ${id}/${season}`);
      for (const pl of D.PLACES.filter((x) => x.photo).map((x) => x.id)) { await p.evaluate((pl) => window.__healoa.go("place", { placeId: pl }, true), pl); await sweep(`place ${pl}`); }
      await p.evaluate(() => window.__healoa.go("card", {}, true)); await sweep(`card ${id}/${season}`);
    }
    for (const pr of Object.keys(D.PRACTICES)) { await p.evaluate((pr) => window.__healoa.go("practice", { cond: "sleep", practiceId: pr }, true), pr); await sweep("practice " + pr); }
    await p.evaluate(() => window.__healoa.go("card", { cond: "sleep", season: "autumn" }, true));
    await p.click("#btnOpenLine"); await sweep("leave a line");
    await p.click("#btnOpenShare"); await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:")); await sweep("share panel");
    const drawn = await p.evaluate(() => window.__healoa.lastShareCardText().join("\n"));
    for (const h of scanRendered(drawn, "zh")) hits.push({ where: "share card image", ...h });
    const r07 = hits.filter((h) => rule("R07").banned.zh.includes(h.word));
    await p.evaluate(() => { document.getElementById("about").open = true; }); await p.evaluate(() => window.__healoa.go("home", {}, true)); await sweep("about");
    await p.evaluate(() => window.__healoa.go("privacy", {}, true)); await sweep("privacy");
    await p.evaluate(() => window.__healoa.go("wellness", {}, true)); await sweep("wellness");
    check("R01.c", "rendered zh sweep (home, 8 quiz screens, flip reveal, 为什么是你, all places, 我的养护记录, 12 results, every photo place, 12 cards, every practice, 留一句, share panel + share image, about, privacy, wellness) → 0 hits for ALL rule word lists (R01/R02/R03/R04/R07/R12) and 0 outcome phrases", hits.length === 0 && outcome.length === 0, { hits: hits.slice(0, 6), outcome: outcome.slice(0, 4) });
    check("R07.b", "no points / rewards / streak / invite wording rendered anywhere on the zh path incl. the share flow + share image", r07.length === 0 && !/积分|奖励|打卡|签到|邀请|返利/.test(drawn), r07.slice(0, 4));
    check("R08.b", "no link / src / action to healoa.com in any rendered zh screen", links.length === 0, links.slice(0, 4));
    check("R10.b", `every swept screen has no overlay / Cindy photo credit and no revoked copyright line; all ${credits.n} rendered photos are object-fit: cover with a focal point (never stretched)`, credits.n >= 20 && credits.bad.length === 0, credits.bad.slice(0, 5));
    check("R10.c", "the 9:16 share image does not draw the revoked copyright line or overlay credit, and names no Cindy", !drawn.includes(rule("R10").revokedCopyrightZh) && !drawn.includes(rule("R10").bannedOverlay) && !/Cindy/.test(drawn), drawn.slice(-3));
    await c.close();
  }

  // ---- R18.b: the share panel buttons really do something; exports are full-bleed 9:16 1080×1920 ----
  {
    const out = {};
    for (const [lang, q] of [["zh", ""], ["en", "&lang=en"]]) {
      const { c, p } = await open(base + "?" + DQ + q, lang === "zh" ? "zh-CN" : "en-US");
      await p.evaluate(() => { window.__sent = []; navigator.share = (d) => { window.__sent.push({ files: (d.files || []).map((f) => f.type + ":" + f.size), url: d.url }); return Promise.resolve(); }; navigator.canShare = () => true; });
      await p.evaluate(() => window.__healoa.go("card", { cond: "sleep", season: "autumn" }, true));
      await p.click("#btnOpenShare"); await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
      const panel = await p.evaluate(() => ({ targets: [...document.querySelectorAll("#shareTargets [data-target]")].map((b) => b.getAttribute("data-target")), qr: !!document.getElementById("shareQr").offsetParent, video: !document.getElementById("btnSaveVideo").classList.contains("hidden") }));
      await p.click("#btnShareSend"); await p.waitForTimeout(150);
      await p.click("#btnSaveImg"); await p.waitForFunction(() => !document.getElementById("imgModal").classList.contains("hidden"));
      const im = await p.evaluate(() => new Promise((res) => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.src = document.getElementById("modalImg").src; }));
      await p.click('#imgModal [data-action="closeModal"]');
      let vid = null;
      if (panel.video) { vid = await p.evaluate(() => window.__healoa.storyVideo(1200).then((b) => b && { type: b.type, size: b.size })); }
      out[lang] = { panel, sent: await p.evaluate(() => window.__sent), im, vid };
      await c.close();
    }
    const z = out.zh, e = out.en;
    const ok = JSON.stringify(z.panel.targets) === '["copy"]' && z.panel.qr && JSON.stringify(e.panel.targets) === '["sms","copy"]' && !e.panel.qr &&
      z.sent.length === 1 && /image\/png/.test(z.sent[0].files[0] || "") && e.sent.length === 1 &&
      JSON.stringify(z.im) === "[1080,1920]" && JSON.stringify(e.im) === "[1080,1920]" && (!z.panel.video || (z.vid && /^video\//.test(z.vid.type) && z.vid.size > 1000));
    check("R18.b", "zh: copy + QR only, en: Text + copy, no QR; 发给一个人 opens the system share with the 9:16 PNG; 存图片 gives a 1080×1920 PNG; 存视频 (where recording works) gives a real 9:16 video", ok, out);
  }

  // ---- R19.b: 声音 defaults on for this preview; the switch still turns it off and on; reminder stays opt-in ----
  {
    const { c, p } = await open(base + "?" + DQ);
    await p.evaluate(() => window.__healoa.go("practice", { cond: "sleep", practiceId: "breath46" }, true));
    const before = await p.evaluate(() => ({ music: document.getElementById("btnMusic").getAttribute("aria-pressed"), on: window.__healoa.music.on, label: document.getElementById("btnMusic").textContent, remind: localStorage.getItem("healoa.remind.v1") }));
    await p.click("#btnMusic");
    const mid = await p.evaluate(() => ({ music: document.getElementById("btnMusic").getAttribute("aria-pressed"), on: window.__healoa.music.on, label: document.getElementById("btnMusic").textContent }));
    await p.click("#btnMusic");
    const after = await p.evaluate(() => ({ music: document.getElementById("btnMusic").getAttribute("aria-pressed"), on: window.__healoa.music.on }));
    await p.click("#btnRemind");
    const view = await p.evaluate(() => !document.getElementById("vRemind").classList.contains("hidden"));
    await p.click('#remindTimes [data-time="08:00"]');
    const ics = await p.evaluate(() => window.__healoa.icsText());
    await c.close();
    const ok = before.music === "true" && before.on === true && before.label === "声音：开" && !before.remind && mid.music === "false" && mid.on === false && mid.label === "声音：关" && after.music === "true" && after.on === true && view &&
      /RRULE:FREQ=DAILY/.test(ics) && /T080000/.test(ics) && /BEGIN:VALARM/.test(ics) && !/连续|streak/i.test(ics);
    check("R19.b", "fresh visit: 声音 on + no reminder stored; the switch turns it off and on; 每天提醒我 opens the opt-in page; the calendar file is a daily repeating event with an alarm at the chosen time, no streak wording", ok, { before, mid, after, view, ics: ics.slice(0, 300) });
  }

  // ---- R05: share link / image never carry body-state info ----
  {
    const r = rule("R05");
    const labelsAll = Object.values(ctx.HEALOA_LOCALES).flatMap((L) => Object.values(L.content.conditions || {}));
    const bad = [];
    for (const [lang, q] of [["zh", ""], ["en", "&lang=en"], ["ja", "&lang=ja"]]) {
      for (const id of D.CONDITIONS.map((x) => x.id)) {
        const { c, p } = await open(base + "?" + DQ + q, lang);
        await toResult(p, id);
        await p.click('#resultBody [data-action="openCareplan"]'); await p.waitForSelector('#vCareplan:not(.hidden)'); await p.click('#careplanBody [data-action="openCard"]');
        await p.click("#btnOpenShare");
        await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
        const sh = await p.evaluate(() => ({ share: window.__healoa.buildShare(), drawn: window.__healoa.lastShareCardText(), story: (window.__healoa.storyPng(), 1), url: location.href }));
        const u = new URL(sh.share.url);
        const keys = [...u.searchParams.keys()];
        const blob = JSON.stringify([sh.share, sh.drawn]) + decodeURIComponent(sh.share.url);
        const leaked = labelsAll.filter((l) => blob.includes(l));
        if (!keys.every((k) => r.allowedShareParams.includes(k)) || leaked.length || /[?&](c|cond|condition|body)=/.test(sh.url)) bad.push({ lang, id, keys, leaked, page: sh.url });
        await c.close();
      }
    }
    check("R05.b", `18 runs (zh/en/ja × 6 body states): share link params ⊆ {${r.allowedShareParams.join(", ")}}, page URL has no condition, share text + share image text contain no body-state label (any locale)`, bad.length === 0, bad.slice(0, 4));
  }
  {
    const r = rule("R05");
    const { c, p } = await open(base + "?" + DQ);
    const priv = [], travel = [];
    for (const [l, list] of Object.entries(r.lineProbesMustStayPrivate)) for (const s of list) if (await p.evaluate((s) => window.__healoa.lineTravels(s), s)) priv.push(l + ": " + s);
    for (const [l, list] of Object.entries(r.lineProbesMayTravel)) for (const s of list) if (!(await p.evaluate((s) => window.__healoa.lineTravels(s), s))) travel.push(l + ": " + s);
    // end-to-end: a condition line is kept on the own card but not in the link / share image
    const probe = r.lineProbesMustStayPrivate.zh[2];
    await toResult(p, "sleep"); await p.click('#resultBody [data-action="openCareplan"]'); await p.waitForSelector('#vCareplan:not(.hidden)'); await p.click('#careplanBody [data-action="openCard"]');
    await p.click("#btnOpenLine"); await p.fill("#lineInput", probe); await p.click('[data-action="saveLine"]');
    await p.click("#btnOpenShare"); await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
    const sh = await p.evaluate(() => ({ share: window.__healoa.buildShare(), drawn: window.__healoa.lastShareCardText() }));
    const hiddenWhenOff = (await p.$$("#cardLine")).length === 0 && (await p.$$("#cardLineHidden")).length === 1;
    await p.click("#cardShowCond");
    const e2e = hiddenWhenOff && !new URL(sh.share.url).searchParams.has("l") && !sh.drawn.some((t) => t.includes(probe)) && (await p.textContent("#cardLine")).includes(probe);
    check("R05.c", `留一句 naming a body state stays off the share link + image (${Object.values(r.lineProbesMustStayPrivate).flat().length} probes zh/en/ja rejected by lineTravels; plain lines still travel; end-to-end with 「${probe}」: off the link + share image; on the own card only when 「写出我的情况」 is on)`, priv.length === 0 && travel.length === 0 && e2e, { travelsButShouldNot: priv, blocked: travel, e2e, url: sh.share.url });
    await c.close();
  }

  // ---- R05.d: private card + 「存成图片」 PNG with 「写出我的情况」 OFF carry no condition-identifying text ----
  {
    const L = ctx.HEALOA_LOCALES;
    const labelsAll = Object.values(L).flatMap((x) => Object.values((x.content && x.content.conditions) || {}));
    const stemsAll = Object.values(L).flatMap((x) => (x.content && x.content.privateWords) || []);
    const bad = [], runs = [];
    let control = null;
    for (const [lang, q, loc] of [["zh", "", "zh-CN"], ["en", "&lang=en", "en-US"], ["ja", "&lang=ja", "ja-JP"]]) {
      const { c, p } = await open(base + "?" + DQ + q, loc);
      // a line that names a body state is saved too: it must stay off the card while the toggle is off
      const care = L[lang].content.care;
      const specific = [];
      for (const cid of Object.keys(care)) for (const se of Object.keys(care[cid])) { const k = care[cid][se]; specific.push(k.safety, k.eat.tip, k.move[0]); }
      for (const season of ["autumn", "winter"]) for (const id of D.CONDITIONS.map((x) => x.id)) {
        await p.evaluate(({ id, season }) => { window.__healoa.state.line = "我血压偏高，最近睡不踏实"; window.__healoa.go("card", { cond: id, season }, true); }, { id, season });
        const off = await p.evaluate(() => !document.getElementById("cardShowCond").checked);
        const dom = await p.evaluate(() => document.getElementById("cardPreview").innerText);
        const png = await p.evaluate(async () => { const url = await window.__healoa.privatePng(); return { ok: url.startsWith("data:image/png"), text: window.__healoa.lastPrivateText().join("\n") }; });
        // the fixed disclaimer is identical on every card (it names no condition), so it is not scanned
        const blob = (dom + "\n" + png.text).split(L[lang].strings.disclaimer).join(" ");
        const hits = [...labelsAll, ...stemsAll].filter((w) => w && blob.toLowerCase().includes(String(w).toLowerCase()));
        const lines = [...new Set(specific)].filter((line) => line && blob.includes(line));
        runs.push(`${lang} ${id}/${season}`);
        if (!off || !png.ok || png.text.length < 40 || hits.length || lines.length) bad.push({ lang, id, season, off, png: png.ok, hits, lines: lines.map((x) => x.slice(0, 30)) });
      }
      if (lang === "zh") {
        // positive control: with the toggle ON the same test does see the condition (so the check is not vacuous)
        await p.evaluate(() => window.__healoa.go("card", { cond: "bp", season: "autumn" }, true));
        await p.click("#cardShowCond");
        const on = await p.evaluate(async () => { await window.__healoa.privatePng(); return window.__healoa.lastPrivateText().join("\n"); });
        control = on.includes("血压偏高") && on.includes(L.zh.content.care.bp.autumn.safety);
      }
      await c.close();
    }
    check("R05.d", `「写出我的情况」 off: private card screen + 「存成图片」 PNG text for ${runs.length} runs (zh/en/ja × 6 conditions × 2 seasons, with a condition-naming 留一句 saved) contain no condition label / privateWords stem (any locale) and no condition-specific safety / eat / move line; control: toggle on → label + safety line appear`, bad.length === 0 && runs.length === 36 && control === true, { bad: bad.slice(0, 4), control });
  }

  // ---- R14.c: every practice reachable from any condition / season is hold-free ----
  {
    const MAX = rule("R14").maxHoldSec;
    const { c, p } = await open(base + "?" + DQ);
    const reach = new Set(), bad = [];
    for (const season of ["autumn", "winter"]) for (const id of D.CONDITIONS.map((x) => x.id)) {
      await p.evaluate(({ id, season }) => window.__healoa.go("result", { cond: id, season }, true), { id, season });
      const ids = await p.evaluate(() => [...document.querySelectorAll('#resultBody [data-action="openPractice"]')].map((b) => b.getAttribute("data-practice")));
      const def = await p.evaluate(() => { const b = document.querySelector('#resultBody .btn.primary[data-action="openPractice"]'); return b && b.getAttribute("data-practice"); });
      for (const pr of ids) {
        await p.evaluate(({ pr, id }) => window.__healoa.go("practice", { cond: id, practiceId: pr }, true), { pr, id });
        const modes = await p.evaluate(() => [...document.querySelectorAll('#practiceModes [data-practice]')].map((b) => b.getAttribute("data-practice")));
        for (const m of [pr, ...modes]) reach.add(m);
        for (const m of [pr, ...modes]) {
          const P = D.PRACTICES[m];
          const long = P ? holdsOf(P).filter((h) => h.sec > MAX) : [{ missing: m }];
          if (long.length) bad.push({ cond: id, season, practice: m, long });
        }
        const txt = await p.evaluate(() => document.getElementById("vPractice").innerText);
        for (const h of textHolds(txt)) if (h.n > MAX) bad.push({ cond: id, season, practice: pr, text: h.m });
      }
      if (id === "bp" || id === "sleep") reach.add("default:" + id + "=" + def);
    }
    check("R14.c", `all 6 conditions × 2 seasons: every practice reachable from the result page and the practice chips (${[...reach].filter((x) => !x.startsWith("default")).length} distinct) holds the breath ≤ ${MAX}s (shape + on-screen text); 睡不踏实 default is ${D.PRACTICE_DEFAULT.sleep}`, bad.length === 0 && !reach.has("breath478") && D.PRACTICE_DEFAULT.sleep !== "breath478", { bad: bad.slice(0, 5), reach: [...reach] });
    await c.close();
  }

  // ---- R06: share entry after saving the card; not on home; default 只留给自己 ----
  {
    const r = rule("R06");
    const { c, p } = await open(base + "?" + DQ);
    const home = await p.evaluate(() => {
      const v = document.getElementById("vHome");
      return { text: v.innerText, shareEls: v.querySelectorAll('[data-action="openShare"],[data-action="shareSend"],[data-target],#sharePanel').length,
        visibleShare: [...document.querySelectorAll('#btnOpenShare,#sharePanel,[data-action="shareSend"]')].filter((e) => e.offsetParent).length };
    });
    check("R06.a", "home first screen has no share entry (no share buttons / panel, no 「发给」「分享」 text)", home.shareEls === 0 && home.visibleShare === 0 && !/发给|分享/.test(home.text), home);
    await toResult(p, "gut"); await p.click('#resultBody [data-action="openCareplan"]'); await p.waitForSelector('#vCareplan:not(.hidden)'); await p.click('#careplanBody [data-action="openCard"]');
    const def = await p.evaluate(() => ({ keep: document.getElementById("btnKeep").textContent, primary: document.getElementById("btnKeep").classList.contains("primary"), showCond: document.getElementById("cardShowCond").checked, note: document.querySelector("#vCard [data-i18n='card.privateNote']").textContent, panelOpen: !document.getElementById("sharePanel").classList.contains("hidden") }));
    check("R06.b", `card defaults to 「${r.keepLabel.zh}」 (primary action), condition not written on the card, share panel closed`, def.keep === r.keepLabel.zh && def.primary && !def.showCond && /只给你自己看/.test(def.note) && !def.panelOpen, def);
    await p.click("#btnKeep");
    await p.waitForSelector("#savedNote:not(.hidden)");
    const saved = await p.textContent("#savedNote");
    const entry = await p.evaluate(() => { const b = document.getElementById("btnOpenShare"); return { visible: !!b.offsetParent, label: b.textContent, afterSave: !!(document.getElementById("savedNote").compareDocumentPosition(b) & 4) }; });
    await p.click("#btnOpenShare");
    const panel = await p.evaluate(() => ({ open: !!document.getElementById("sharePanel").offsetParent, send: !!document.querySelector('#sharePanel [data-action="shareSend"]').offsetParent, lead: document.querySelector("#sharePanel .share-lead").textContent }));
    check("R06.c", `after 「${r.keepLabel.zh}」 saves the card, a visible share entry 「${r.shareActionLabel.zh}…」 follows and opens the share panel with 发送`, entry.visible && entry.label.startsWith(r.shareActionLabel.zh) && entry.afterSave && panel.open && panel.send && saved.length > 0, { saved, entry, panel });
    await c.close();
  }

  // ---- R09: main line order (v4) ----
  {
    const { c, p } = await open(base + "?" + DQ);
    const steps = {};
    steps.home = await p.evaluate(() => !!document.getElementById("btnStart2").offsetParent && document.querySelectorAll("#vHome .steps li").length === 3);
    await p.click("#btnStart2");
    steps.quiz = await p.isVisible("#vQuiz") && (await p.$$("#quizBody .quiz-q")).length === 1;
    await runQuiz(p, { q6: ["tense"], q7: ["mountain"] }, { start: null });
    steps.reveal = (await p.$$("#revealBody .flip-card")).length >= 1;
    await p.click('#revealBody [data-action="flipAll"]');
    await p.click('#revealBody [data-action="openWhy"]');
    const order = await p.evaluate(() => {
      const rb = document.getElementById("resultBody");
      const card1 = rb.querySelector(".place-card"), why = card1 && card1.querySelector(".why li"), eda = card1 && card1.querySelectorAll(".eda li").length, enter = card1 && card1.querySelector('[data-action="openPlace"]'), toCare = rb.querySelector('[data-action="openCareplan"]'), relax = rb.querySelector('.btn.primary[data-action="openPractice"]');
      const before = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & 4));
      return { season: /^(秋|冬) · /.test(document.getElementById("resultTitle").textContent), reason: !!why, eda, placeBeforeCare: before(card1, toCare), enter: !!enter, relaxPlace: !!(relax && relax.getAttribute("data-place")) };
    });
    steps.why = order.season && order.reason && order.eda === 3 && order.placeBeforeCare && order.enter && order.relaxPlace;
    await p.click('#resultBody .place-card [data-action="openPlace"] >> nth=0');
    steps.place = await p.isVisible("#vPlace") && (await p.$$('#placeBody [data-action="openPractice"][data-place]')).length >= 1;
    await p.click('#placeBody [data-action="openPractice"][data-place] >> nth=0');
    steps.practice = await p.isVisible("#vPractice") && (await p.$$('#vPractice [data-action="openCard"]')).length > 0;
    await p.evaluate(() => window.__healoa.go("card", {}, true));
    steps.card = await p.isVisible("#cardPreview");
    check("R09.a", "main line (v4): home 「开始配对」 → quiz one question per screen → flip reveal → 为什么是你 (reasons + 吃 / 做 / 避开, places before the card) → place 「在这里做一件事」 → practice → 本季养护卡", Object.values(steps).every(Boolean) && Object.keys(steps).length === 7, { steps, order });
    await c.close();
  }

  // ---- R15: every place open from the first visit ----
  {
    const { c, p } = await open(base + "?" + DQ);
    const photoIds = D.PLACES.filter((x) => x.photo).map((x) => x.id);
    await p.click('#vHome [data-action="openPlaces"]');
    const list = await p.evaluate(() => [...document.querySelectorAll("#placesBody [data-place]")].map((e) => ({ id: e.getAttribute("data-place"), disabled: !!e.disabled || e.getAttribute("aria-disabled") === "true", lockCls: /lock/i.test(e.className) })));
    const ids = [...new Set(list.map((x) => x.id))];
    const opened = [];
    for (const id of ids) {
      await p.evaluate(() => window.__healoa.go("places", {}, true));
      await p.click(`#placesBody [data-action="openPlace"][data-place="${id}"] >> nth=0`);
      opened.push((await p.isVisible("#vPlace")) && (await p.textContent("#placeBody")).length > 100 ? id : "!" + id);
    }
    await p.evaluate(() => window.__healoa.go("places", {}, true));
    const txt = await p.evaluate(() => document.body.innerText);
    check("R15.b", `first visit (empty storage): 「所有地方」 lists all ${photoIds.length} photo places (${photoIds.join(", ")}), none disabled / locked, each opens its page`,
      JSON.stringify(ids.slice().sort()) === JSON.stringify(photoIds.slice().sort()) && list.every((x) => !x.disabled && !x.lockCls) && opened.every((x) => !x.startsWith("!")) && !/即将开放|解锁|锁/.test(txt), { ids, opened });
    await c.close();
  }

  // ---- R16.b: an unsourced knowledge-base sentence is never rendered; a verified one is ----
  {
    const { c, p } = await open(base + "?" + DQ);
    const seen = await p.evaluate(() => {
      const KB = window.HEALOA_KB, term = window.__healoa.currentMatch().termIndex;
      KB.seasonAdvice.push({ solarTerm: term, tag: "want_warm", type: "eat", text: "FIXTURE-NO-SOURCE", sourceRef: null, status: "pending-cindy" });
      KB.seasonAdvice.push({ solarTerm: term, tag: "want_warm", type: "avoid", text: "FIXTURE-UNVERIFIED", sourceRef: "fx-unverified", status: "pending-cindy" });
      KB.sources.push({ id: "fx-unverified", verified: false });
      window.__healoa.go("result", { answers: { q2: ["cold"] } }, true);
      const a = document.getElementById("resultBody").innerText;
      KB.sources.push({ id: "fx-ok", verified: true });
      KB.seasonAdvice.push({ solarTerm: term, tag: "want_warm", type: "do", text: "FIXTURE-VERIFIED", sourceRef: "fx-ok" });
      window.__healoa.go("result", { answers: { q2: ["cold"] } }, true);
      const b = document.getElementById("resultBody").innerText;
      window.__healoa.go("result", { answers: { q2: ["hot"] } }, true);
      const d = document.getElementById("resultBody").innerText;
      return { noSource: a.includes("FIXTURE-NO-SOURCE"), unverified: a.includes("FIXTURE-UNVERIFIED"), verified: b.includes("FIXTURE-VERIFIED"), otherAnswers: d.includes("FIXTURE-VERIFIED") };
    });
    check("R16.b", "fixture (test only, not shipped): an advice line with no sourceRef or an unverified source is NOT rendered on 为什么是你; the same line with a verified source is rendered, and only for answers that point to its tag", !seen.noSource && !seen.unverified && seen.verified && !seen.otherAnswers, seen);
    await c.close();
  }

  // ---- R17.b: quiz answers never leave the phone (URL, share link, share image) ----
  {
    const { c, p } = await open(base + "?" + DQ);
    await runQuiz(p, { q1: ["bp", "sleep"], q2: ["cold"], q3: ["damp"], q4: ["low"], q5: ["late", "iced"], q6: ["tense", "quiet"], q7: ["hotspring"], q8: ["near"] });
    const urls = [p.url()];
    await p.click('#revealBody [data-action="openWhy"]'); urls.push(p.url());
    await p.click('#resultBody [data-action="openCareplan"]'); await p.waitForSelector('#vCareplan:not(.hidden)'); await p.click('#careplanBody [data-action="openCard"]'); urls.push(p.url());
    await p.click("#btnOpenShare"); await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
    const sh = await p.evaluate(() => ({ share: window.__healoa.buildShare(), drawn: window.__healoa.lastShareCardText(), story: (window.__healoa.storyPng(), window.__healoa.lastStoryText()), saved: localStorage.getItem("healoa.match.v1") }));
    const L = ctx.HEALOA_LOCALES.zh.content.quiz;
    const labels = Object.values(L).flatMap((q) => Object.values(Object.assign({}, q.opts, q.marketOpts)));
    const blob = JSON.stringify([sh.share, sh.drawn, sh.story]) + decodeURIComponent(sh.share.url) + urls.join(" ");
    const ids = ["bp", "sleep", "damp", "late", "iced", "tense", "quiet", "hotspring", "near", "q1", "q2", "q8"];
    const leakedLabels = labels.filter((l) => blob.includes(l));
    const leakedIds = ids.filter((id) => urls.concat(sh.share.url).some((u) => new RegExp(`[?&#=/]${id}\\b`).test(u.replace(/^https?:\/\/[^/]+/, ""))));
    check("R17.b", "a full 8-answer match: answers kept only in localStorage (healoa.match.v1); page URLs, share link, share text, share card + 9:16 story text carry no quiz answer (label or id)",
      leakedLabels.length === 0 && leakedIds.length === 0 && !!sh.saved && sh.saved.includes('"bp"'), { leakedLabels, leakedIds, url: sh.share.url });
    await c.close();
  }

  // ---- R11: drafts only via ?lang=, badge, switcher hidden, es empty ----
  {
    const out = {};
    for (const [k, q, lang] of [["zh", "", "zh-CN"], ["zhBrowserEn", "", "en-US"], ["en", "&lang=en", "en-US"], ["ja", "&lang=ja", "ja-JP"], ["es", "&lang=es", "es-ES"]]) {
      const { c, p } = await open(base + "?" + DQ + q, lang);
      out[k] = await p.evaluate(() => ({ lang: document.documentElement.lang, badge: !document.getElementById("draftBadge").classList.contains("hidden"), badgeText: document.getElementById("draftBadge").textContent, switcher: !document.getElementById("langSwitch").classList.contains("hidden"), langLinks: [...document.querySelectorAll("a[href]")].filter((a) => /[?&]lang=/.test(a.getAttribute("href"))).length }));
      await c.close();
    }
    const ok = out.zh.lang === "zh-CN" && !out.zh.badge && !out.zh.switcher && out.zh.langLinks === 0 &&
      out.zhBrowserEn.lang === "zh-CN" && !out.zhBrowserEn.badge &&
      out.en.lang === "en" && out.en.badge && !out.en.switcher && out.ja.lang === "ja" && out.ja.badge && !out.ja.switcher &&
      out.es.lang === "zh-CN" && !out.es.badge;
    check("R11.b", "default zh (even with an English browser): no badge, switcher hidden, no ?lang links; ?lang=en / ?lang=ja → draft badge, switcher still hidden; ?lang=es → zh", ok, out);
  }
  check("RUN", "no page errors during the rules run", pageErrors.length === 0, pageErrors.slice(0, 4));
} catch (e) {
  check("RUN", "rules test run crashed", false, String((e && e.stack) || e));
} finally {
  if (browser) await browser.close();
  if (server) server.close();
}

// ================= meta: every rule enforced, doc ↔ JSON in sync =================
{
  const ids = RULES.rules.map((r) => r.id);
  const seqOk = ids.every((id, i) => id === "R" + String(i + 1).padStart(2, "0"));
  const byId = Object.fromEntries(results.map((r) => [r.id, r]));
  const gaps = [];
  for (const r of RULES.rules) {
    const own = r.enforcedBy.filter((x) => x.startsWith("rules:")).map((x) => x.slice(6));
    if (!own.length) gaps.push(r.id + ": no rules: check listed");
    for (const cid of own) if (!byId[cid]) gaps.push(`${r.id}: ${cid} did not run`); else if (!byId[cid].ok) gaps.push(`${r.id}: ${cid} failed`);
  }
  const ran = results.filter((r) => /^R\d\d\./.test(r.id)).map((r) => r.id);
  const unlisted = ran.filter((cid) => !RULES.rules.some((r) => r.enforcedBy.includes("rules:" + cid)));
  check("META.a", `every rule (${ids.length}) lists ≥1 rules: check in enforcedBy, and all listed checks ran and passed; every check that ran is listed`, seqOk && gaps.length === 0 && unlisted.length === 0, { gaps, unlisted });
  const doc = read(RULES.doc);
  const missing = [];
  for (const r of RULES.rules) {
    if (!new RegExp(`\\b${r.id}\\b`).test(doc)) missing.push(r.id);
    for (const x of r.enforcedBy.filter((x) => x.startsWith("rules:"))) if (!doc.includes(x.slice(6))) missing.push(x);
  }
  check("META.b", `${RULES.doc} names every rule id and every enforcing check id, and points at rules/healoa-rules.json`, missing.length === 0 && doc.includes("rules/healoa-rules.json") && doc.includes("tests/rules.mjs"), missing);
}

const failed = results.filter((r) => !r.ok);
console.log(`\nrules: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "rules.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
