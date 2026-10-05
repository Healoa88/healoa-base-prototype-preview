/**
 * Layout regression tests (v2026-10-05-b live health check). Each check is a bug that shipped once and was found on the
 * live site at 390×844 / 1280×800 in zh + en:
 *  1. place page: the place name + area sit ON the hero photo (a later rule had pushed them below it, out of sight);
 *  2. reveal page: the solar-term pill, greeting and title sit on the hero photo;
 *  3. practice with a form video: the big 「开始」 is in the first screen and never covers the cue, the clock or the duration
 *     chips (before and after a finished session);
 *  4. practice: the chosen practice chip is fully inside the sideways-scrolling row;
 *  5. en / ja draft badge never overlaps a top-bar control (back, sound, season switch) or the shared-view brand line;
 *  6. desktop: the phone frame sits on the blurred photo backdrop (body::before has the photo, not just the season wash);
 *  7. no place repeats the hot-spring water-temperature line in 「要避开什么」.
 * Run: node tests/layout.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer } from "./lib/server.mjs";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 400) : ""}`);
}
const D = "date=2026-09-26";
const PLACES = ["wudang", "pattaya", "onsen", "seashrine", "harbin"];
const pageErrors = [];
let server, browser, base;

/* in-page helpers */
const RECT = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
const inside = (a, b, tol = 1) => !!a && !!b && a.w > 0 && a.h > 0 && a.l >= b.l - tol && a.r <= b.r + tol && a.t >= b.t - tol && a.b <= b.b + tol;
const overlap = (a, b) => !!a && !!b && a.w > 0 && b.w > 0 && a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;

try {
  ({ server, base } = await startServer());
  browser = await chromium.launch();
  async function open(q = "", { lang = "zh-CN", vp = { width: 390, height: 844 } } = {}) {
    const ctx = await browser.newContext({ viewport: vp, locale: lang });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    p.on("pageerror", (e) => pageErrors.push(String(e)));
    await p.goto(base + "?" + D + q);
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem("healoa.first.v1", JSON.stringify({ at: 1 })); });
    await p.reload();
    await p.waitForFunction(() => window.__healoa && window.__healoa.go);
    return { ctx, p };
  }
  const rect = (p, sel) => p.evaluate(RECT, sel);
  const go = (p, view, patch) => p.evaluate(([v, pa]) => window.__healoa.go(v, pa), [view, patch]);

  for (const [lang, q, loc] of [["zh", "", "zh-CN"], ["en", "&lang=en", "en-US"]]) {
    const { ctx, p } = await open(q, { lang: loc });
    // 1. place hero text
    const bad = [];
    for (const id of PLACES) {
      await go(p, "place", { placeId: id });
      const photo = await rect(p, "#placeBody .place-hero .photo"), title = await rect(p, "#placeBody .place-title"), area = await rect(p, "#placeBody .place-area");
      const txt = await p.textContent("#placeBody .place-title");
      if (!(inside(title, photo) && inside(area, photo) && txt.trim())) bad.push({ id, photo, title });
    }
    check(`${lang}: place page — name + area are on the hero photo for all ${PLACES.length} places`, bad.length === 0, bad.slice(0, 2));
    // 2. reveal hero
    await go(p, "reveal", { cond: "sleep" });
    await p.waitForTimeout(200);
    const hero = await rect(p, "#vReveal .rv-hero"), rt = await rect(p, "#revealTitle"), term = await rect(p, "#revealTerm");
    check(`${lang}: reveal — term pill + title are on the hero photo`, inside(rt, hero) && inside(term, hero) && (await p.textContent("#revealTitle")).trim().length > 0, { hero, rt, term });
    // 3. practice Start vs cue / clock / chips
    const cover = [];
    for (const [pr, place] of [["baduanjin1", "wudang"], ["taiji1", "wudang"], ["breath46", "wudang"]]) {
      await go(p, "practice", { practiceId: pr, actionPlace: place });
      await p.waitForTimeout(150);
      const needs = await p.evaluate(() => document.getElementById("vPractice").classList.contains("needs-start"));
      const btn = await rect(p, "#btnStart");
      if (needs && !(btn && btn.b <= 844 && btn.t >= 0)) cover.push({ pr, s: "Start below the first screen", btn });
      for (const s of ["#practiceCue", "#practiceClock", "#practiceTitle"]) if (overlap(btn, await rect(p, s))) cover.push({ pr, s, needs });
      const chips = await p.evaluate(() => [...document.querySelectorAll("#practiceOpts .chip")].map((c) => { const r = c.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }));
      if (chips.some((c) => overlap(btn, c))) cover.push({ pr, s: "#practiceOpts", needs });
      if (pr === "breath46") {
        await p.click("#btnStart"); await p.waitForTimeout(150);
        await p.evaluate(() => { window.__healoa.timer.startAt -= 3600 * 1000; });
        await p.waitForFunction(() => !document.getElementById("donePanel").classList.contains("hidden"));
        const b2 = await rect(p, "#btnStart");
        for (const s of ["#practiceCue", "#practiceClock", "#donePanel"]) if (overlap(b2, await rect(p, s))) cover.push({ pr: pr + "-done", s });
      }
    }
    check(`${lang}: practice — the big Start is in the first screen and never covers the cue, the clock, the title or the duration chips (fresh + finished)`, cover.length === 0, cover);
    // 4. chosen chip visible
    const hidden = [];
    for (const pr of ["baduanjin1", "taiji1", "soak", "walk", "sitEasy", "breathNight"]) {
      await go(p, "practice", { practiceId: pr, actionPlace: pr === "baduanjin1" || pr === "taiji1" ? "wudang" : null });
      await p.waitForTimeout(100);
      const row = await rect(p, "#practiceModes"), on = await rect(p, "#practiceModes .chip.on");
      if (on && !inside(on, row, 2)) hidden.push({ pr, row, on });
    }
    check(`${lang}: practice — the chosen practice chip is scrolled fully into view`, hidden.length === 0, hidden);
    // 7. no repeated hot-spring line
    const dup = [];
    for (const id of PLACES) {
      await go(p, "place", { placeId: id });
      const lines = await p.evaluate(() => [...document.querySelectorAll("#blkAvoid li")].map((li) => li.textContent));
      if (lines.filter((x) => /41\s*°?\s*[℃C]/.test(x)).length > 1) dup.push({ id, lines });
    }
    check(`${lang}: 「要避开什么」 never repeats the hot-spring water-temperature line`, dup.length === 0, dup);
    await ctx.close();
  }

  // 5. draft badge vs top-bar controls (en + ja, phone + desktop)
  for (const [lang, loc] of [["en", "en-US"], ["ja", "ja-JP"]]) {
    for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
      const { ctx, p } = await open("&lang=" + lang, { lang: loc, vp });
      const hits = [];
      const probe = async (label) => {
        await p.waitForTimeout(150);
        const r = await p.evaluate(() => {
          const b = document.getElementById("draftBadge"); if (!b || b.classList.contains("hidden")) return { badge: null };
          const br = b.getBoundingClientRect();
          const v = document.querySelector(".view:not(.hidden)");
          const els = [...v.querySelectorAll(".topbar button, .topbar .seg, :scope > .brand")].filter((e) => e.offsetParent);
          return { badge: [br.left, br.top, br.right, br.bottom], els: els.map((e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.className, box: [r.left, r.top, r.right, r.bottom] }; }) };
        });
        if (!r.badge) { hits.push({ label, err: "no badge" }); return; }
        const [l, t, rr, bb] = r.badge;
        for (const e of r.els) { const [L, T, R, B] = e.box; if (l < R - 1 && L < rr - 1 && t < B - 1 && T < bb - 1) hits.push({ label, el: e.id }); }
      };
      await probe("home");
      await go(p, "reveal", { cond: "sleep" }); await probe("reveal");
      await go(p, "result", { cond: "sleep" }); await probe("result");
      await go(p, "careplan", { cond: "sleep" }); await probe("careplan");
      await go(p, "place", { placeId: "wudang" }); await probe("place");
      await go(p, "practice", { practiceId: "baduanjin1", actionPlace: "wudang" }); await probe("practice");
      await go(p, "card", { cond: "sleep" }); await probe("card");
      await go(p, "records", {}); await probe("records");
      await p.goto(base + "?" + D + "&lang=" + lang + "&s=abc123"); await p.waitForFunction(() => window.__healoa && window.__healoa.state.view === "shared"); await probe("shared");
      check(`${lang} ${vp.width}px: the draft badge never overlaps back / sound / season switch / shared brand line`, hits.length === 0, hits.slice(0, 4));
      await ctx.close();
    }
  }

  // 6. desktop backdrop
  {
    const { ctx, p } = await open("", { vp: { width: 1280, height: 800 } });
    const bg = await p.evaluate(() => { const s = getComputedStyle(document.body, "::before"); return { img: s.backgroundImage, filter: s.filter }; });
    check("desktop 1280: the phone frame sits on the blurred season photo (body::before carries the photo url + blur)", /url\(/.test(bg.img) && /blur/.test(bg.filter), bg);
    await go(p, "place", { placeId: "pattaya" });
    const bg2 = await p.evaluate(() => getComputedStyle(document.body, "::before").backgroundImage);
    check("desktop 1280: on a place page the backdrop is that place's wide photo", /thai\/sunset\/01-pattaya-harbor-dusk/.test(bg2), bg2.slice(0, 160));
    await ctx.close();
  }
  check("no page errors during the layout run", pageErrors.length === 0, pageErrors.slice(0, 5));
} catch (e) {
  check("test run crashed", false, String((e && e.stack) || e));
} finally {
  if (browser) await browser.close();
  if (server) server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\nlayout: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "layout.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
