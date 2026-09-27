/**
 * i18n tests (Playwright, 390×844): zh renders identically to the intentional zh snapshot (tests/golden/zh-baseline.json,
 * re-captured on purpose for v2026-09-27-u after the zh copy polish), en / ja drafts only via ?lang with a badge,
 * es / unknown locales fall back to zh, language switcher + social row stay hidden while there is
 * nothing to show (and work when there is — test fixtures only, never shipped), native share.
 * Run: node tests/i18n.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer } from "./lib/server.mjs";
import { captureZh, diffGolden, GOLDEN } from "./lib/capture-zh.mjs";
import { CONDITION_LABELS, scanRendered } from "./wording.mjs";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 300) : ""}`);
}

const D = "?date=2026-09-26";
const pageErrors = [];
let server, browser;
try {
  // ---------- 1. zh renders identically to the zh snapshot (intentionally re-captured for v2026-09-27-u) ----------
  const golden = JSON.parse(fs.readFileSync(GOLDEN, "utf8"));
  const now = await captureZh();
  const diff = diffGolden(golden, now);
  const n = (o) => Object.keys(o).length;
  check(`zh identical to the v2026-09-27-u zh snapshot (intentional update after the copy polish): home, shared, quiz, ${n(golden.result) / 2} results, ${n(golden.place)} place pages, ${n(golden.practice)} practice states + timed cues, ${n(golden.card)} season cards, share texts, private PNG hash, <html lang>, title, data + rule outputs`,
    diff.length === 0, diff.length ? diff.slice(0, 6) : "identical");
  check("key zh screens contain the locked strings", golden.home.includes("血压偏高、睡不好、怕冷……这个季节该怎么养？") && now.home === golden.home &&
    CONDITION_LABELS.every((l) => now.home.includes(l)) && now.result["bp/winter"].includes("这个季节先不选") && now.card["bp/autumn"].view.includes("只留给自己") && now.head.lang === "zh-CN");

  ({ server } = await startServer().then((x) => { globalThis.__base = x.base; return x; }));
  const base = globalThis.__base;
  browser = await chromium.launch();

  async function open(url, { routes = {}, init } = {}) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "zh-CN" });
    for (const [pattern, body] of Object.entries(routes)) await ctx.route(pattern, (r) => r.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body }));
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    p.on("pageerror", (e) => pageErrors.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error") pageErrors.push(m.text()); });
    await p.goto(url);
    return { ctx, p };
  }
  const shot = (p) => p.evaluate(() => ({ lang: document.documentElement.lang, app: window.__healoa.lang, title: document.title, text: document.body.innerText, stored: localStorage.getItem("healoa.lang.v1") }));
  async function resultText(p) {
    await p.click('#homeConds [data-cond="bp"]');
    await p.click('#vResult [data-action="season"][data-season="winter"]');
    return p.evaluate(() => document.body.innerText);
  }

  // ---------- 2. es (empty) / unknown locale → zh; en / ja drafts only via explicit ?lang ----------
  const ref = await open(base + D);
  const refHome = await shot(ref.p);
  const refResult = await resultText(ref.p);
  await ref.ctx.close();
  const fb = [];
  for (const q of ["es", "xx", "ES-mx", "zh-CN", "zh", ""]) {
    const { ctx, p } = await open(base + D + "&lang=" + q);
    const s = await shot(p);
    const r = await resultText(p);
    fb.push({ q, ok: s.lang === "zh-CN" && s.app === "zh" && s.text === refHome.text && s.title === refHome.title && r === refResult && s.stored !== "en" && s.stored !== "ja" && s.stored !== "es" && s.stored !== "xx" });
    await ctx.close();
  }
  check("?lang=es (empty stub), unknown and malformed codes → zh, identical home + result, <html lang=zh-CN>, nothing remembered", fb.every((x) => x.ok), fb.filter((x) => !x.ok));
  const dr = [];
  for (const [q, want, badge] of [["en", "en", "Draft preview"], ["EN-us", "en", "Draft preview"], ["ja", "ja", "下書き"]]) {
    const { ctx, p } = await open(base + D + "&lang=" + q);
    const s = await shot(p);
    const b = await p.evaluate(() => { const el = document.getElementById("draftBadge"); return { hidden: el.classList.contains("hidden"), text: el.textContent }; });
    const sw = await p.evaluate(() => document.getElementById("langSwitch").classList.contains("hidden"));
    await p.goto(base + D); // without ?lang the draft is not remembered
    const after = await shot(p);
    dr.push({ q, ok: s.app === want && s.lang === want && !b.hidden && b.text === badge && sw && s.stored !== want && after.app === "zh" && after.lang === "zh-CN", app: s.app, badge: b, after: after.app });
    await ctx.close();
  }
  check("?lang=en / ?lang=ja open the DRAFT locales with a small 「Draft preview」/「下書き」 badge; switcher stays hidden; draft never remembered (next visit without ?lang → zh)", dr.every((x) => x.ok), dr);
  {
    const { ctx, p } = await open(base + D);
    check("zh (default): no draft badge", await p.evaluate(() => document.getElementById("draftBadge").classList.contains("hidden")));
    await ctx.close();
  }
  {
    const { ctx, p } = await open(base + D, { init: () => { try { if (!sessionStorage.getItem("x")) { localStorage.setItem("healoa.lang.v1", "ja"); sessionStorage.setItem("x", "1"); } } catch (e) {} } });
    await p.reload();
    const s = await shot(p);
    check("a remembered but incomplete locale (localStorage = ja) → zh", s.app === "zh" && s.lang === "zh-CN" && s.text === refHome.text, { app: s.app, lang: s.lang });
    await ctx.close();
  }

  // ---------- 3. nothing new visible in zh ----------
  {
    const { ctx, p } = await open(base + D);
    const home = await p.evaluate(() => ({ sw: document.getElementById("langSwitch").classList.contains("hidden") && document.getElementById("langSwitch").children.length === 0, foot: document.getElementById("socialFoot").classList.contains("hidden") }));
    await p.click('#homeConds [data-cond="gut"]');
    await p.click('#resultBody [data-action="openCard"]');
    const card = await p.evaluate(() => ({ card: document.getElementById("socialCard").classList.contains("hidden"), follow: document.body.innerText.includes("关注我们") }));
    check("language switcher hidden (only 1 complete locale); 「关注我们」 hidden in footer + season card (no social entries)", home.sw && home.foot && card.card && !card.follow, { home, card });
    await ctx.close();
  }

  // ---------- 4. with a second complete locale (TEST FIXTURE, not shipped): switcher, ?lang, remember, per-key fallback ----------
  const fixtureLocale = `(function (root) { var L = root.HEALOA_LOCALES = root.HEALOA_LOCALES || {};
    L.en = { meta: { code: "en", htmlLang: "en", name: "Test-EN", complete: true }, strings: { "home.headline": "FIXTURE headline", "meta.title": "FIXTURE {version}" }, content: { conditions: { bp: "FIXTURE-bp" } } };
  })(window);`;
  {
    const { ctx, p } = await open(base + D, { routes: { "**/app/i18n/en.js*": fixtureLocale } });
    const sw = await p.$$eval("#langSwitch button", (els) => els.map((e) => ({ t: e.textContent, lang: e.getAttribute("data-lang"), on: e.classList.contains("on") })));
    check("switcher appears when >1 locale is complete (fixture): zh first, current marked", JSON.stringify(sw.map((x) => x.lang)) === '["zh","en"]' && sw[0].on && (await p.isVisible("#langSwitch")), sw);
    await p.click('#langSwitch [data-lang="en"]');
    await p.waitForFunction(() => window.__healoa && window.__healoa.lang === "en");
    const s = await shot(p);
    const title = await p.textContent("#homeTitle"), sub = await p.textContent("#vHome .subline"), c1 = await p.textContent('#homeConds [data-cond="bp"]'), c2 = await p.textContent('#homeConds [data-cond="sleep"]');
    check("switching to the fixture locale: ?lang=en in URL, <html lang=en>, remembered, translated keys used, missing keys fall back to zh (strings + content)",
      p.url().includes("lang=en") && s.lang === "en" && s.stored === "en" && title === "FIXTURE headline" && s.title.startsWith("FIXTURE v2026") && sub === "点一下你的情况，马上告诉你这个季节怎么吃、怎么动、去哪里养。" && c1 === "FIXTURE-bp" && c2 === "睡不踏实",
      { url: p.url(), lang: s.lang, stored: s.stored, title, sub, c1, c2 });
    await p.goto(base + D);
    check("remembered choice applies without ?lang", (await p.evaluate(() => window.__healoa.lang)) === "en" && (await p.textContent("#homeTitle")) === "FIXTURE headline");
    await p.goto(base + D + "&lang=zh");
    const back = await shot(p);
    check("?lang=zh switches back and is remembered", back.app === "zh" && back.lang === "zh-CN" && back.stored === "zh" && (await p.textContent("#homeTitle")) === "血压偏高、睡不好、怕冷……这个季节该怎么养？", { app: back.app, stored: back.stored });
    await ctx.close();
  }

  // ---------- 5. social row (TEST FIXTURE entries, not shipped) ----------
  const fixtureSocial = `window.HEALOA_SOCIAL = { zh: [
    { platform: "fixture", url: "https://example.org/healoa-fixture", label: "FIXTURE-账号" },
    { platform: "bad", url: "javascript:alert(1)", label: "BAD" },
    { platform: "bad2", url: "http://example.org/insecure", label: "BAD2" } ], en: [], ja: [], es: [] };`;
  {
    const { ctx, p } = await open(base + D, { routes: { "**/app/social.js*": fixtureSocial } });
    const foot = await p.evaluate(() => { const el = document.getElementById("socialFoot"); return { hidden: el.classList.contains("hidden"), text: el.innerText, links: [...el.querySelectorAll("a")].map((a) => ({ href: a.getAttribute("href"), target: a.target, rel: a.rel, action: a.getAttribute("data-action") })) }; });
    await p.click('#homeConds [data-cond="cold"]');
    await p.click('#resultBody [data-action="openCard"]');
    const card = await p.evaluate(() => { const el = document.getElementById("socialCard"); return { hidden: el.classList.contains("hidden"), text: el.innerText, n: el.querySelectorAll("a").length }; });
    check("with entries (fixture): 「关注我们」 row in footer + season card; only https links; opens in new tab with noopener",
      !foot.hidden && foot.text.includes("关注我们") && foot.links.length === 1 && foot.links[0].href === "https://example.org/healoa-fixture" && foot.links[0].target === "_blank" && /noopener/.test(foot.links[0].rel) && foot.links[0].action === "openSocial" && !card.hidden && card.text.includes("关注我们") && card.n === 1,
      { foot, card });
    await ctx.close();
  }

  // ---------- 6. native share (navigator.share) ----------
  {
    const { ctx, p } = await open(base + D, { init: () => { window.__shared = []; Object.defineProperty(navigator, "share", { configurable: true, value: (d) => { window.__shared.push({ title: d.title, text: d.text, url: d.url, files: (d.files || []).length }); return Promise.resolve(); } }); } });
    await p.click('#homeConds [data-cond="sleep"]');
    await p.click('#resultBody [data-action="openCard"]');
    await p.click("#btnOpenShare");
    await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
    await p.click('[data-action="shareSend"]');
    await p.waitForFunction(() => window.__shared.length > 0);
    const sh = await p.evaluate(() => window.__shared[0]);
    const u = new URL(sh.url);
    const blob = JSON.stringify(sh);
    check("share action uses navigator.share (title + text + link, no body/feeling data); fallback copy-link covered by the zh golden",
      JSON.stringify([...u.searchParams.keys()]) === '["s"]' && /^[a-z0-9]{6}$/.test(u.searchParams.get("s")) && !CONDITION_LABELS.some((l) => blob.includes(l)) && !/睡/.test(blob) && (await p.textContent("#shareNote")).includes("已打开发送"), sh);
    check("share flow stays zh-clean (rendered scan with zh rules)", scanRendered(await p.evaluate(() => document.body.innerText), "zh").length === 0);
    await ctx.close();
  }

  check("no page errors / console errors during the i18n run", pageErrors.length === 0, pageErrors.slice(0, 5));
} catch (e) {
  check("test run crashed", false, String((e && e.stack) || e));
} finally {
  if (browser) await browser.close();
  if (server) server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\ni18n: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "i18n.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
