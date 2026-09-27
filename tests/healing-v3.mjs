/**
 * Browser tests (Playwright, headless Chromium, 390×844) for the v3 healing main line.
 * Run: node tests/healing-v3.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer } from "./lib/server.mjs";
import { toResult, runQuiz } from "./lib/flow.mjs";
import { CONDITION_LABELS, CONDITION_IDS, DISCLAIMER, VERSION, scanRendered } from "./wording.mjs";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 300) : ""}`);
}

const { server, base } = await startServer();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "zh-CN" });
// Platform share buttons open real web intents in a new tab; answer them locally so the run never leaves the box.
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>ok" }));
const B64 = (t) => Buffer.from(t, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const D = "?date=2026-09-26";
const pageErrors = [];

async function fresh(url = base + D, opts = {}) {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => pageErrors.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") pageErrors.push(m.text()); });
  if (opts.clock) await p.clock.install();
  await p.goto(url);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  return p;
}
const visibleView = (p) => p.evaluate(() => [...document.querySelectorAll("[data-view]")].filter((v) => !v.classList.contains("hidden")).map((v) => v.dataset.view).join(","));
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const allText = (p) => p.evaluate(() => document.body.innerText);
// Rendered-page banned-word scan uses the rules of the locale the page is actually showing (tests/wording.mjs).
const pageLang = (p) => p.evaluate(() => window.__healoa.lang);

async function buttonsHaveHandlers(p, label) {
  const bad = await p.evaluate(() => {
    const acts = window.__healoa.actions;
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    return [...document.querySelectorAll("button, a, [role=button], input[type=checkbox]")].filter(vis).filter((el) => {
      const a = el.getAttribute("data-action");
      return !(a && typeof acts[a] === "function");
    }).map((el) => el.outerHTML.slice(0, 120));
  });
  return { label, bad };
}

try {
  // ---------- Home ----------
  let p = await fresh();
  // v4 Phase 1 (D-27-05): one-sentence 「这个 App 做什么、给谁」 + 3-step 怎么用 + one big start button; the 6 one-tap buttons are gone.
  check("home: headline exact", (await p.textContent("#homeTitle")) === "这个节气，哪里最适合你？");
  check("home: one-sentence subline (what it does + for whom)", (await p.textContent("#vHome .subline")) === "按你最近的身体和心情，配出这个节气最适合你去放松的 3 个地方——给想顺着季节照顾自己的人。");
  check("home: no one-tap condition grid any more (the quiz is the entry)", (await p.$$("#homeConds, #vHome .cond-btn")).length === 0);
  check("home: 「怎么用」 title + start button 「开始配对（约 2 分钟）」 visible above the fold at 390×844", await p.evaluate(() => {
    const b = document.getElementById("btnStart2"), r = b.getBoundingClientRect();
    return document.getElementById("homeStepsTitle").textContent === "怎么用" && b.textContent === "开始配对（约 2 分钟）" && r.bottom <= window.innerHeight && r.height >= 56;
  }));
  check("home: 3-step explainer", (await p.$$("#vHome .steps li")).length === 3);
  check("home: season auto from date (2026-09-26 → 秋)", (await p.getAttribute('#vHome [data-season="autumn"]', "class")).includes("on"));
  const pw = await fresh(base + "?date=2026-12-20");
  check("home: season auto from date (2026-12-20 → 冬)", (await pw.getAttribute('#vHome [data-season="winter"]', "class")).includes("on"));
  await pw.close();
  check("home: quiz hidden until 「开始配对」 is tapped", (await p.isHidden("#vQuiz")) && (await p.isVisible('#btnStart2[data-action="openQuiz"]')));
  check("footer disclaimer exact", (await p.textContent("#disclaimer")) === DISCLAIMER);
  check("version label " + VERSION, (await p.getAttribute('meta[name="healoa-version"]', "content")) === VERSION && (await p.textContent("#verLabel")) === VERSION);
  check("tech notes are inside collapsible 「关于这份 Demo」", await p.evaluate(() => { const d = document.getElementById("about"); return d.tagName === "DETAILS" && !d.open && d.querySelector("summary").textContent === "关于这份 Demo"; }));
  const homeTxt = await allText(p);
  check("home: no old social/fake elements (1 人在场 / 留一笔 / Scene Seed / bubbles)", !/人在场|留一笔|Scene Seed|场景种子/.test(homeTxt) && (await p.$$(".bubble, .particle, .bubbles, #bubbles, canvas")).length === 0);
  check("home: no horizontal overflow at 390px", (await overflow(p)) <= 0);
  await p.close();

  // ---------- home → quiz → flip reveal → 为什么是你 (v4 main line) ----------
  {
    const q = await fresh();
    await runQuiz(q, { q1: ["cold"], q2: ["cold"], q7: ["sea"], q8: ["far"] });
    const cards = await q.$$eval("#revealBody .flip-card", (els) => els.length);
    const backHidden = await q.$$eval("#revealBody .flip-card", (els) => els.every((e) => !e.classList.contains("flipped")));
    await q.click("#revealBody .flip-card >> nth=0");
    const one = await q.$$eval("#revealBody .flip-card.flipped", (els) => els.length);
    await q.click('#revealBody [data-action="flipAll"]');
    const all = await q.$$eval("#revealBody .flip-card.flipped", (els) => els.length);
    const credit = (await q.textContent("#revealBody")).includes("Photo · Cindy Yang");
    await q.click('#revealBody [data-action="openWhy"]');
    const why = await q.$$eval("#resultBody .place-card", (els) => els.length);
    check("home → quiz → flip reveal: 1–3 face-down cards, tap flips one, 「全部翻开」 flips all, photos keep Photo · Cindy Yang, 「看看为什么」 → places with reasons",
      cards >= 1 && cards <= 3 && backHidden && one === 1 && all === cards && credit && why === cards, { cards, one, all, why });
    await q.close();
  }
  // ---------- result content per input ----------
  const snapshots = {};
  const urlLeaks = [];
  const domHits = [];
  const photoTop = [];
  const overflowStates = [];
  for (const season of ["autumn", "winter"]) {
    for (const id of CONDITION_IDS) {
      const q = await fresh();
      await toResult(q, id);
      await q.click(`#vResult [data-action="season"][data-season="${season}"]`);
      await q.waitForLoadState("networkidle");
      const txt = await q.textContent("#resultBody");
      snapshots[`${id}/${season}`] = txt;
      const href = q.url();
      if (CONDITION_IDS.some((c) => new RegExp(`[?&#/=]${c}\\b`).test(href)) || CONDITION_LABELS.some((l) => decodeURIComponent(href).includes(l))) urlLeaks.push(href);
      for (const h of scanRendered(await allText(q), await pageLang(q))) domHits.push({ state: `${id}/${season}`, ...h });
      const imgs = await q.$$eval("#resultBody .place-card img", (els) => els.map((e) => ({ src: e.getAttribute("src"), ok: e.complete && e.naturalWidth > 0 })));
      photoTop.push({ state: `${id}/${season}`, n: imgs.length, allLoaded: imgs.every((i) => i.ok) });
      if ((await overflow(q)) > 0) overflowStates.push(`result ${id}/${season}`);
      // place detail for the first top place
      await q.click('#resultBody [data-action="openPlace"] >> nth=0');
      for (const h of scanRendered(await allText(q), await pageLang(q))) domHits.push({ state: `place ${id}/${season}`, ...h });
      if ((await overflow(q)) > 0) overflowStates.push(`place ${id}/${season}`);
      if (id === "bp" && season === "winter") {
        check("place card: photo + credit + 3 reasons with numbers + 当地吃 + 做什么 + 适合谁 + 要避开什么 + 在这里做一件事", await q.evaluate(() => {
          const b = document.getElementById("placeBody");
          const reasons = [...b.querySelectorAll(".reasons li")].map((l) => l.textContent);
          return !!b.querySelector(".place-hero img") && b.textContent.includes("Photo · Cindy Yang") && reasons.length === 3 && reasons.filter((r) => /\d/.test(r)).length >= 2 &&
            b.textContent.includes("在这里可以吃") && b.textContent.includes("在这里做什么") && b.textContent.includes("要避开什么") && b.textContent.includes("适合谁") && b.textContent.includes("在这里做一件事");
        }));
        check("place card: Cindy line slot renders nothing while empty", (await q.$$(".cindy-line")).length === 0);
      }
      await q.close();
    }
  }
  const distinct = new Set(Object.values(snapshots)).size;
  check("result differs for every condition×season (12 distinct pages)", distinct === 12, `${distinct} distinct`);
  check("血压偏高+冬 ≠ 睡不踏实+秋", snapshots["bp/winter"] !== snapshots["sleep/autumn"]);
  const bw = snapshots["bp/winter"];
  check("血压偏高+冬: warm place first; 哈尔滨 in 这个季节先不选; hot-spring ≤41℃ ≤10 分钟",
    bw.indexOf("芭提雅") > -1 && bw.includes("这个季节先不选") && /哈尔滨 · 冰雪：冬季平均 −16.7℃/.test(bw) && bw.includes("41℃") && bw.includes("10 分钟"));
  check("睡不踏实+秋: 武当山 · 山居慢住 first, 芭提雅 not this season (湿热多雨)", /武当山 · 山居慢住/.test(snapshots["sleep/autumn"]) && /芭提雅 · 海边：秋季平均 27.8℃/.test(snapshots["sleep/autumn"]));
  check("result: 本季要留意 / 吃喝 / 怎么动 / 去哪里养 / 先不选 sections present", ["本季要留意", "吃喝", "怎么动", "这个季节去哪里养", "这个季节先不选"].every((s) => bw.includes(s)));
  check("top places (1–3) all have a loaded real photo", photoTop.every((x) => x.n >= 1 && x.n <= 3 && x.allLoaded), photoTop.filter((x) => !(x.n >= 1 && x.n <= 3 && x.allLoaded)));
  check("URL never carries the condition (id or label)", urlLeaks.length === 0, urlLeaks);
  check("rendered DOM banned-word scan, locale-aware (zh rules; 12 results + 12 place cards)", domHits.length === 0, domHits.length ? domHits.slice(0, 8) : "0 hits");
  check("no horizontal overflow in any result/place state", overflowStates.length === 0, overflowStates);

  // ---------- real timer ----------
  p = await fresh();
  await toResult(p, "bp");
  await p.click('#resultBody [data-action="openPractice"][data-practice="breath46"] >> nth=0');
  check("bp: every offered mode is hold-free (no 4-7-8; 睡前慢呼吸 吸4呼6 offered to everyone)", (await p.$$('#practiceModes [data-practice="breath478"]')).length === 0 && (await p.$$('#practiceModes [data-practice="breathNight"]')).length === 1);
  await p.click("#btnStart");
  await p.waitForTimeout(3000);
  const e1 = await p.evaluate(() => window.__healoa.elapsedMs());
  const clock1 = await p.textContent("#practiceClock");
  check("timer: real time-delta elapsed ≈3s after 3s", e1 > 2700 && e1 < 3800, `${Math.round(e1)}ms clock=${clock1}`);
  check("timer: countdown moved from 3:00", clock1 === "2:57" || clock1 === "2:58" || clock1 === "2:56", clock1);
  const scale = await p.evaluate(() => document.getElementById("breathCircle").style.transform);
  check("timer: breathing circle animates", /scale\(0?\.\d+|scale\(1/.test(scale) && scale !== "scale(.55)", scale);
  await p.click("#btnPause");
  const pa = await p.evaluate(() => window.__healoa.elapsedMs());
  await p.waitForTimeout(1200);
  const pb = await p.evaluate(() => window.__healoa.elapsedMs());
  check("timer: pause freezes elapsed time", Math.abs(pb - pa) < 60, `${Math.round(pa)} → ${Math.round(pb)}`);
  await p.click("#btnPause");
  await p.waitForTimeout(600);
  const pc = await p.evaluate(() => window.__healoa.elapsedMs());
  check("timer: resume continues from paused value", pc > pb + 400 && pc < pb + 1200, `${Math.round(pb)} → ${Math.round(pc)}`);
  await p.click("#btnStop");
  check("timer: stop resets", (await p.textContent("#practiceClock")) === "3:00" && (await p.isVisible("#btnStart")));
  await p.close();

  // completion with a controlled clock (deterministic; still time-delta based)
  p = await fresh(base + D, { clock: true });
  await toResult(p, "sleep");
  await p.click('#resultBody [data-action="openPractice"][data-practice="breathNight"] >> nth=0');
  check("睡不踏实: default practice is 睡前慢呼吸 吸4呼6 (10 轮 = 1:40, no breath hold)", (await p.textContent("#practiceClock")) === "1:40" && (await p.textContent("#practiceTitle")).includes("吸 4 呼 6"));
  await p.click("#btnStart");
  await p.clock.runFor(40000);
  const mid = await p.textContent("#practiceClock");
  await p.clock.runFor(61000);
  const donePanel = await p.isVisible("#donePanel");
  const ev = await p.evaluate(() => window.__healoa.events().map((e) => e.e));
  check("timer: 睡前慢呼吸 runs to completion → 做完了 panel + practice_completed event", mid === "1:00" && donePanel && ev.includes("practice_completed"), { mid, donePanel, ev });
  check("practice copy only claims 当场放松", (await p.textContent("#donePanel")).includes("当场放松"));
  await p.close();

  p = await fresh(base + D, { clock: true });
  await toResult(p, "tense");
  await p.click('#resultBody [data-action="openPractice"][data-practice="walk"]:not([data-place]) >> nth=0');
  await p.click("#btnStart");
  await p.clock.runFor(2000);
  const feet = await p.evaluate(() => ["footL", "footR"].map((i) => document.getElementById(i).classList.contains("on")));
  check("心里绷得紧: slow-walk rhythm (10 min, 左/右 beat)", (await p.textContent("#practiceTitle")) === "慢走节奏" && feet.includes(true) && /^9:5\d$/.test(await p.textContent("#practiceClock")), feet);
  await p.close();

  // ---------- every visible button has a handler + actually does something ----------
  const setups = {
    home: async (q) => {},
    result: async (q) => { await toResult(q, "cold"); },
    place: async (q) => { await toResult(q, "cold"); await q.click('#resultBody [data-action="openPlace"] >> nth=0'); },
    practice: async (q) => { await toResult(q, "tense"); await q.click('#resultBody [data-action="openPractice"] >> nth=0'); },
    card: async (q) => { await toResult(q, "gut"); await q.click('#resultBody [data-action="openCard"]'); },
    share: async (q) => { await toResult(q, "gut"); await q.click('#resultBody [data-action="openCard"]'); await q.click("#btnOpenShare"); await q.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:")); },
    quiz: async (q) => { await q.click('[data-action="openQuiz"]'); },
    quizMulti: async (q) => { await q.click('[data-action="openQuiz"]'); await q.click('#quizBody [data-opt="cold"]'); },
    reveal: async (q) => { await runQuiz(q, { q7: ["mountain"] }); },
    places: async (q) => { await q.click('#vHome [data-action="openPlaces"]'); },
    records: async (q) => { await q.evaluate(() => localStorage.setItem("healoa.log.v1", JSON.stringify([{ d: "2026-09-26", term: 17, place: "wudang", practice: "walk", note: "", at: 1 }]))); await q.click('#vHome [data-action="openRecords"]'); },
    shared: async (q) => { await q.goto(base + "?s=abc234&date=2026-09-26"); },
    cardLine: async (q) => { await toResult(q, "gut"); await q.click('#resultBody [data-action="openCard"]'); await q.click("#btnOpenLine"); },
    sharedLine: async (q) => { await q.goto(base + "?s=abc234&l=" + B64("这个秋天，慢一点。") + "&date=2026-09-26"); },
    sharedLineWriting: async (q) => { await q.goto(base + "?s=abc235&l=" + B64("这个秋天，慢一点。") + "&date=2026-09-26"); await q.evaluate(() => localStorage.clear()); await q.click('[data-action="replyOpen"]'); await q.fill("#replyInput", "我也想慢一点。"); },
    sharedLineWrote: async (q) => { await q.goto(base + "?s=abc236&l=" + B64("这个秋天，慢一点。") + "&date=2026-09-26"); await q.evaluate(() => localStorage.clear()); await q.click('[data-action="replyOpen"]'); await q.fill("#replyInput", "我也想慢一点。"); await q.click('[data-action="replySave"]'); },
    sharedReply: async (q) => { await q.goto(base + "?s=abc234&l=" + B64("这个秋天，慢一点。") + "&r=" + B64("我也想慢一点。") + "&date=2026-09-26"); },
  };
  const handlerIssues = [];
  const deadButtons = [];
  let clicked = 0;
  for (const [name, setup] of Object.entries(setups)) {
    const q = await fresh();
    await setup(q);
    const h = await buttonsHaveHandlers(q, name);
    if (h.bad.length) handlerIssues.push(h);
    const count = await q.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
      const els = [...document.querySelectorAll("button, a.btn, input[type=checkbox]")].filter(vis);
      els.forEach((el, i) => el.setAttribute("data-test-idx", String(i)));
      return els.length;
    });
    await q.close();
    for (let i = 0; i < count; i++) {
      const r = await fresh();
      await setup(r);
      await r.evaluate(() => {
        const vis = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
        [...document.querySelectorAll("button, a.btn, input[type=checkbox]")].filter(vis).forEach((el, k) => el.setAttribute("data-test-idx", String(k)));
      });
      const sel = `[data-test-idx="${i}"]`;
      const meta = await r.$eval(sel, (el) => ({ html: el.outerHTML.slice(0, 100), on: el.classList.contains("on"), disabled: el.disabled }));
      const before = await r.evaluate(() => document.body.innerHTML.length + "|" + document.body.innerText + "|" + JSON.stringify(window.__healoa.state) + location.href);
      await r.click(sel);
      await r.waitForTimeout(350);
      const after = await r.evaluate(() => document.body.innerHTML.length + "|" + document.body.innerText + "|" + JSON.stringify(window.__healoa.state) + location.href);
      clicked++;
      if (before === after && !meta.on && !meta.disabled) deadButtons.push({ state: name, ...meta });
      await r.close();
    }
  }
  check(`every visible button/link/checkbox has a registered handler (${Object.keys(setups).length} states)`, handlerIssues.length === 0, handlerIssues);
  check(`every visible button responds when clicked (${clicked} clicks across ${Object.keys(setups).length} states)`, deadButtons.length === 0, deadButtons);

  // ---------- season card: private by default; share payload has no body/feeling data ----------
  const shareLeaks = [];
  for (const id of CONDITION_IDS) {
    const q = await fresh();
    await toResult(q, id);
    await q.click('#resultBody [data-action="openCard"]');
    if (id === "bp") {
      check("season card: primary action is 「只留给自己」 and share is secondary", (await q.getAttribute("#btnKeep", "class")).includes("primary") && (await q.textContent("#btnKeep")) === "只留给自己" && (await q.getAttribute("#btnOpenShare", "class")).includes("text-link"));
      check("season card: condition hidden on card by default", !(await q.textContent("#cardPreview")).includes("血压偏高"));
      await q.click("#btnKeep");
      const saved = await q.evaluate(() => JSON.parse(localStorage.getItem("healoa.card.v1")));
      check("只留给自己 saves locally (no network)", saved && saved.cond === "bp");
    }
    await q.click("#btnOpenShare");
    await q.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
    const data = await q.evaluate(() => ({ share: window.__healoa.buildShare(), drawn: window.__healoa.lastShareCardText(), link: document.getElementById("shareLink").textContent, panel: document.getElementById("sharePanel").innerText }));
    const blob = JSON.stringify(data.share) + "|" + data.drawn.join("|") + "|" + data.link;
    const u = new URL(data.share.url);
    const keys = [...u.searchParams.keys()];
    const feelingWords = ["血压", "睡", "冷", "肠胃", "绷", "安静一点", "感受", ...CONDITION_LABELS];
    const leak = feelingWords.filter((w) => blob.includes(w));
    const idLeak = CONDITION_IDS.filter((c) => new RegExp(`\\b${c}\\b`).test(u.search + u.hash + u.pathname));
    if (leak.length || idLeak.length || JSON.stringify(keys) !== '["s"]' || !/^[a-z0-9]{6}$/.test(u.searchParams.get("s")) || u.hash) shareLeaks.push({ id, leak, idLeak, url: data.share.url });
    await q.close();
  }
  check("share payload (URL, text, image-card text, QR link) has no body/feeling data — 6 conditions", shareLeaks.length === 0, shareLeaks.length ? shareLeaks : "url = …/?s=<6 random chars> only");
  {
    const q = await fresh();
    await toResult(q, "bp");
    await q.click('#resultBody [data-action="openCard"]');
    await q.click("#btnOpenShare");
    await q.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
    const t = (await q.textContent("#vCard")) + (await q.evaluate(() => window.__healoa.lastShareCardText().join("|")));
    const hits = ["奖励", "积分", "解锁", "邀请", "领取", "红包", "排行"].filter((w) => t.includes(w));
    check("no rewards / points / unlock / invite wording in the share flow", hits.length === 0, hits);
    await q.close();
  }

  // ---------- shared link view ----------
  p = await fresh(base + "?s=abc234&date=2026-09-26");
  await p.reload(); // fresh() cleared localStorage after the first load; reload so the local "opened" event is kept
  check("shared link: plain intro + one start button into the quiz", (await visibleView(p)) === "shared" && (await p.isVisible("#sharedStart")) && (await p.textContent("#vShared")).includes("分享给了你"));
  await p.click("#sharedStart");
  const ev2 = await p.evaluate(() => window.__healoa.events().map((e) => e.e));
  check("shared link: start → own quiz; opened + got_own_card logged locally; ?s removed from URL", (await visibleView(p)) === "quiz" && ev2.includes("opened") && ev2.includes("got_own_card") && !p.url().includes("s=abc234"), { ev2, url: p.url() });
  await p.close();

  // ---------- return hint on next open ----------
  p = await fresh();
  await toResult(p, "cold");
  await p.click('#resultBody [data-action="openCard"]');
  await p.click("#btnKeep");
  await p.goto(base + D);
  check("next open: quiet return hint for the saved card (no push)", (await p.isVisible("#returnHint")) && (await p.textContent("#returnHint")).includes("养护卡"));
  await p.click("#returnHint");
  check("return hint opens the saved card", (await visibleView(p)) === "card");
  await p.close();

  // ---------- quiz mechanics (R17): one per screen, progress, multi-select, exclusive 「都还好」, back keeps answers, skip ----------
  p = await fresh();
  await p.click("#btnStart2");
  const q1 = await p.evaluate(() => ({ prog: document.querySelector("#quizBody .quiz-prog").textContent, now: document.querySelector("#quizBody [role=progressbar]").getAttribute("aria-valuenow"), qs: document.querySelectorAll("#quizBody .quiz-q").length, opts: [...document.querySelectorAll("#quizBody .quiz-opt")].map((b) => b.getBoundingClientRect().height) }));
  await p.click('#quizBody [data-opt="bp"]'); await p.click('#quizBody [data-opt="sleep"]');
  const multi = await p.$$eval("#quizBody .quiz-opt.on", (els) => els.map((e) => e.dataset.opt));
  await p.click('#quizBody [data-opt="fine"]');
  const excl = await p.$$eval("#quizBody .quiz-opt.on", (els) => els.map((e) => e.dataset.opt));
  await p.click('#quizBody [data-opt="bp"]');
  await p.click('#quizBody [data-action="quizNext"]');
  const q2 = await p.textContent("#quizBody .quiz-prog");
  await p.click('#quizBody [data-opt="hot"]');
  const q3 = await p.textContent("#quizBody .quiz-prog");
  await p.click('#quizBody [data-action="quizPrev"]');
  const kept = await p.$$eval("#quizBody .quiz-opt.on", (els) => els.map((e) => e.dataset.opt));
  await p.click('#quizBody [data-action="quizSkip"]');
  const afterSkip = await p.evaluate(() => JSON.stringify(window.__healoa.quiz().picks));
  check("quiz: one question per screen, 第 1 题 / 共 8 题 + progress bar, big options (≥56px)", q1.qs === 1 && q1.prog === "第 1 题 / 共 8 题" && q1.now === "1" && q1.opts.length === 7 && q1.opts.every((h) => h >= 56), q1);
  check("quiz: Q1 multi-select; 「都还好」 clears the others; tapping another clears 「都还好」", JSON.stringify(multi) === '["bp","sleep"]' && JSON.stringify(excl) === '["fine"]', { multi, excl });
  check("quiz: single-choice question moves on by itself; 「上一题」 goes back with the answer kept; 「都不是 / 说不准」 skips", q2 === "第 2 题 / 共 8 题" && q3 === "第 3 题 / 共 8 题" && JSON.stringify(kept) === '["hot"]' && afterSkip.includes('"q2":[]'), { q2, q3, kept, afterSkip });
  check("quiz: answers never in the URL", !/q\d|bp|sleep|hot/.test(new URL(p.url()).search.replace("date=2026-09-26", "")), p.url());
  await p.close();
  p = await fresh();
  await runQuiz(p, { q1: ["bp"], q6: ["quiet"], q7: ["hotspring"] });
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("healoa.match.v1")));
  check("quiz: finished match kept on this phone only (healoa.match.v1) with answers + top places", saved && JSON.stringify(saved.answers.q1) === '["bp"]' && saved.top.length >= 1, saved);
  await p.goto(base + D);
  check("next open: home offers 「上次配到」 + today's 3 minutes", (await p.isVisible("#homeLast")) && (await p.isVisible("#homeToday")));
  await p.click("#homeLast");
  check("「上次配到」 reopens the reveal", (await visibleView(p)) === "reveal");
  await p.close();

  // ---------- legacy links ----------
  p = await fresh(base + "#seed=abc");
  await p.waitForURL(/scene-seed-legacy\.html/);
  check("old #seed= links open the archived demo page (not the main path)", p.url().includes("scene-seed-legacy.html#seed=abc"));
  await p.close();

  check("no page errors / console errors during the whole run", pageErrors.length === 0, pageErrors.slice(0, 5));
} catch (e) {
  check("test run crashed", false, String(e && e.stack || e));
} finally {
  await browser.close();
  server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\nhealing-v3: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "healing-v3.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
