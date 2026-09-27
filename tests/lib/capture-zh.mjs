/**
 * Captures every customer-facing zh string the app renders (DOM text, attributes, data, rule outputs,
 * practice cues over time, card/share texts, private PNG hash) into one normalized JSON object.
 * Used to prove the i18n refactor renders zh identically to the pre-change build (v2026-09-27-s).
 * Regenerate the golden only on purpose: node tests/lib/capture-zh.mjs --write
 */
import { chromium } from "playwright";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { startServer, ROOT } from "./server.mjs";

export const GOLDEN = path.join(ROOT, "tests/golden/zh-baseline.json");
const CONDS = ["bp", "sleep", "cold", "gut", "tense", "quiet"];
const SEASONS = ["autumn", "winter"];

function norm(v) {
  return JSON.parse(JSON.stringify(v)
    .replace(/v2026-\d{2}-\d{2}-[a-z]+/g, "<VERSION>")
    .replace(/\?s=[a-z0-9]{6}/g, "?s=<ID>")
    .replace(/127\.0\.0\.1:\d+/g, "<HOST>"));
}
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") return Object.keys(v).sort().reduce((o, k) => { o[k] = canon(v[k]); return o; }, {});
  return v;
}

export async function captureZh({ query = "" } = {}) {
  const { server, base } = await startServer();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "zh-CN" });
  const out = {};
  const Q = (d) => "?date=" + d + query;
  async function fresh(url, clock) {
    const p = await ctx.newPage();
    p.setDefaultTimeout(5000);
    if (clock) await p.clock.install();
    await p.goto(url);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.goto(url);
    return p;
  }
  const bodyText = (p) => p.evaluate(() => document.body.innerText);
  const attrs = (p) => p.evaluate(() => [...document.querySelectorAll("[aria-label],[alt],[title]")].map((e) => [e.id || e.className || e.tagName, e.getAttribute("aria-label"), e.getAttribute("alt"), e.getAttribute("title")]));
  try {
    // home (autumn + winter)
    let p = await fresh(base + Q("2026-09-26"));
    out.head = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, desc: document.querySelector('meta[name="description"]').content }));
    out.home = await bodyText(p);
    out.homeAttrs = await attrs(p);
    out.about = await p.evaluate(() => { const d = document.getElementById("about"); d.open = true; return d.innerText; });
    out.data = await p.evaluate(() => JSON.parse(JSON.stringify(window.HEALOA_DATA)));
    out.rules = await p.evaluate(({ CONDS, SEASONS }) => {
      const R = window.HEALOA_RULES, D = window.HEALOA_DATA, r = {};
      for (const s of SEASONS) for (const c of CONDS) {
        r[`rec ${c}/${s}`] = R.recommend(c, s);
        for (const pl of D.PLACES) r[`place ${pl.id} ${c}/${s}`] = { skip: R.skipReason(pl, c, s), reasons: R.reasons(pl, c, s) };
      }
      const terms = [];
      for (let m = 0; m < 12; m++) for (const d of [1, 6, 15, 24]) terms.push(R.solarTermFor(new Date(2026, m, d)));
      r.terms = terms;
      return r;
    }, { CONDS, SEASONS });
    await p.close();
    p = await fresh(base + Q("2026-12-20"));
    out.homeWinter = await bodyText(p);
    await p.click('#vHome [data-season="autumn"]');
    out.homeAhead = await bodyText(p);
    await p.close();

    // shared view
    p = await fresh(base + "?s=abc234&date=2026-09-26" + query);
    out.shared = await bodyText(p);
    await p.close();

    // quiz
    p = await fresh(base + Q("2026-09-26"));
    await p.click('[data-action="openQuiz"]');
    out.quiz = [await bodyText(p)];
    for (let i = 0; i < 5; i++) { await p.click(`[data-action="quizAnswer"][data-yes="${i % 2}"]`); out.quiz.push(await p.textContent("#quizBody")); }
    await p.close();
    p = await fresh(base + Q("2026-09-26"));
    await p.click('[data-action="openQuiz"]');
    for (let i = 0; i < 5; i++) await p.click('[data-action="quizAnswer"][data-yes="0"]');
    out.quizNone = await p.textContent("#quizBody");
    await p.close();

    // results + places (12 combos, both natural and "提前看" seasons), place pages for every photo place
    out.result = {}; out.place = {};
    p = await fresh(base + Q("2026-09-26"));
    for (const s of SEASONS) for (const c of CONDS) {
      await p.evaluate(({ c, s }) => window.__healoa.go("result", { cond: c, season: s }, true), { c, s });
      out.result[`${c}/${s}`] = await bodyText(p);
      out.result[`${c}/${s} attrs`] = await attrs(p);
      for (const pl of ["wudang", "pattaya", "onsen", "harbin"]) {
        await p.evaluate(({ pl }) => window.__healoa.go("place", { placeId: pl }, true), { pl });
        out.place[`${pl} ${c}/${s}`] = await p.textContent("#placeBody");
      }
    }
    await p.close();

    // practices: initial state + cues over time (controlled clock)
    out.practice = {};
    const ids = ["breath46", "breath478", "walk", "soak", "baduanjin1", "taiji1"];
    for (const cond of ["bp", "sleep", "tense", "cold"]) for (const id of ids) {
      const q = await fresh(base + Q("2026-09-26"), true);
      await q.evaluate(({ cond, id }) => window.__healoa.go("practice", { cond, practiceId: id }, true), { cond, id });
      const rec = { init: await q.textContent("#vPractice"), cues: [] };
      if (cond === "bp" || cond === "sleep") {
        await q.click("#btnStart");
        for (const ms of [500, 2500, 1500, 3000, 4000, 12000]) { await q.clock.runFor(ms); rec.cues.push([await q.textContent("#practiceCue"), await q.textContent("#practiceClock")]); }
        await q.click("#btnPause"); rec.paused = await q.textContent("#vPractice");
        await q.click("#btnPause"); await q.click("#btnStop"); rec.stopped = await q.textContent("#vPractice");
        await q.click("#btnStart"); await q.clock.fastForward(700000); await q.clock.runFor(600); rec.done = await q.textContent("#vPractice");
      }
      if (id === "walk") { await q.click('[data-action="practiceBeep"]').catch(() => {}); rec.beep = await q.textContent("#practiceOpts"); }
      out.practice[`${cond} ${id}`] = rec;
      if (process.env.CAP_DEBUG) console.error("practice", cond, id);
      await q.close();
    }

    // season card, keep, png, share
    out.card = {};
    for (const c of CONDS) for (const s of SEASONS) {
      const q = await fresh(base + Q("2026-09-26"));
      await q.evaluate(({ c, s }) => window.__healoa.go("card", { cond: c, season: s }, true), { c, s });
      const rec = { view: await bodyText(q), model: await q.evaluate(() => window.__healoa.cardModel()) };
      await q.click("#cardShowCond");
      rec.withCond = await q.textContent("#cardPreview");
      if (c === "bp" && s === "autumn") {
        await q.click("#btnKeep"); rec.kept = await q.textContent("#savedNote");
        await q.click('[data-action="savePng"]');
        await q.waitForFunction(() => document.getElementById("modalImg").src.startsWith("data:"));
        rec.modal = await bodyText(q);
        rec.pngSha = crypto.createHash("sha256").update(await q.evaluate(() => document.getElementById("modalImg").src)).digest("hex");
        await q.click('[data-action="closeModal"]');
        await q.click("#btnOpenShare");
        await q.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
        rec.sharePanel = await bodyText(q);
        rec.share = await q.evaluate(() => window.__healoa.buildShare());
        rec.shareDrawn = await q.evaluate(() => window.__healoa.lastShareCardText());
        await q.evaluate(() => { try { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); } catch (e) {} });
        await q.click('[data-action="shareCopy"]'); await q.waitForTimeout(300); rec.copied = await q.textContent("#shareNote");
        await q.click('[data-action="shareSend"]'); await q.waitForTimeout(300); rec.sendFallback = await q.textContent("#shareNote");
        await q.click("#btnOpenShare"); rec.shareClosed = await q.textContent("#btnOpenShare");
        await q.goto(base + Q("2026-09-26"));
        rec.returnHint = await q.textContent("#returnHint");
      }
      if (c === "cold" && s === "winter") {
        await q.click("#btnOpenShare");
        await q.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
        rec.share = await q.evaluate(() => window.__healoa.buildShare());
        rec.shareDrawn = await q.evaluate(() => window.__healoa.lastShareCardText());
      }
      out.card[`${c}/${s}`] = rec;
      await q.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  return canon(norm(out));
}

export function diffGolden(a, b, prefix = "", acc = []) {
  if (acc.length > 20) return acc;
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || a === null || b === null || typeof a !== "object") {
    if (JSON.stringify(a) !== JSON.stringify(b)) acc.push({ at: prefix, before: JSON.stringify(a)?.slice(0, 160), after: JSON.stringify(b)?.slice(0, 160) });
    return acc;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) diffGolden(a[k], b[k], prefix + "/" + k, acc);
  return acc;
}

if (process.argv[1] && process.argv[1].endsWith("capture-zh.mjs")) {
  const got = await captureZh();
  if (process.argv.includes("--write")) { fs.writeFileSync(GOLDEN, JSON.stringify(got, null, 1)); console.log("wrote " + GOLDEN + " (" + fs.statSync(GOLDEN).size + " bytes)"); }
  else { const d = diffGolden(JSON.parse(fs.readFileSync(GOLDEN, "utf8")), got); console.log(d.length ? JSON.stringify(d, null, 1) : "identical"); process.exit(d.length ? 1 : 0); }
}
