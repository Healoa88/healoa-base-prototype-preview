/**
 * Screenshots at 390×844 (mobile). Output: $HEALOA_SHOTS_DIR or /workspace/hb-merge-shots
 * zh main path + 留一句 + share panel + recipient view; en draft home / result / share panel; ja draft home;
 * 9:16 story PNGs (zh + en). Run: node tests/shots.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer } from "./lib/server.mjs";

const OUT = process.env.HEALOA_SHOTS_DIR || "/workspace/hb-merge-shots";
fs.mkdirSync(OUT, { recursive: true });
const { server, base } = await startServer();
const browser = await chromium.launch();
const errors = [];
const saved = [];
const B64 = (t) => Buffer.from(t, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function page0(url, locale = "zh-CN") {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(url);
  await p.waitForLoadState("networkidle");
  return p;
}
async function snap(p, name, full = false) {
  await p.waitForTimeout(250);
  const f = path.join(OUT, name + ".png");
  await p.screenshot({ path: f, fullPage: full });
  saved.push(f);
}
async function snapEl(p, sel, name) {
  await p.waitForTimeout(250);
  await p.$eval(sel, (el) => el.scrollIntoView({ block: "start" }));
  const f = path.join(OUT, name + ".png");
  await p.screenshot({ path: f, fullPage: false });
  saved.push(f);
}
function savePng(dataUrl, name) { const f = path.join(OUT, name + ".png"); fs.writeFileSync(f, Buffer.from(dataUrl.split(",")[1], "base64")); saved.push(f); }
const D = "?date=2026-09-26";

// ---------- zh ----------
let p = await page0(base + D);
await snap(p, "01-zh-home");
await snap(p, "01b-zh-home-full", true);
await p.click('#homeConds [data-cond="sleep"]');
await p.waitForLoadState("networkidle");
await snap(p, "02-zh-result-first-screen");
await snap(p, "02b-zh-result-full", true);
await p.click('#resultBody [data-action="openCard"]');
await p.waitForLoadState("networkidle");
await snap(p, "03-zh-season-card");
await p.click("#btnOpenLine");
await p.fill("#lineInput", "这个秋天，慢一点。");
await snapEl(p, "#lineZone", "04-zh-leave-a-line");
await p.click('[data-action="saveLine"]');
await snapEl(p, "#cardPreview .care-body", "04b-zh-line-on-card");
await p.click("#btnOpenShare");
await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
await snap(p, "05-zh-season-card-share-panel-full", true);
await snapEl(p, "#sharePanel", "05b-zh-share-panel");
await snapEl(p, "#shareTargets", "05c-zh-share-platform-buttons");
savePng(await p.evaluate(() => document.getElementById("shareImg").src), "05d-zh-share-card-image-4x5");
savePng(await p.evaluate(() => window.__healoa.storyPng()), "10-zh-story-9x16");
const shareUrl = await p.evaluate(() => window.__healoa.buildShare().url);

// ---------- recipient ----------
const q = await page0(base + new URL(shareUrl).search + "&date=2026-09-26");
await snap(q, "06-recipient-view");
await q.click('[data-action="replyOpen"]');
await q.fill("#replyInput", "我也想慢一点。");
await q.click('[data-action="replySave"]');
await snap(q, "06b-recipient-wrote-beside");
const replyLink = await q.textContent("#replyLink");
const r = await page0(base + new URL(replyLink).search + "&date=2026-09-26");
await snap(r, "06c-reply-view-sender");

// ---------- en draft ----------
const e = await page0(base + D + "&lang=en", "en-US");
await snap(e, "07-en-home");
await snap(e, "07b-en-home-full", true);
await e.click('#homeConds [data-cond="sleep"]');
await e.waitForLoadState("networkidle");
await snap(e, "08-en-result-first-screen");
await e.click('#resultBody [data-action="openCard"]');
await e.click("#btnOpenLine");
await e.fill("#lineInput", "Slow mornings, warm tea, and a long walk by the water.");
await snapEl(e, "#lineZone", "08b-en-leave-a-line");
await e.click('[data-action="saveLine"]');
await e.click("#btnOpenShare");
await e.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
await snapEl(e, "#sharePanel", "09-en-share-panel");
await snapEl(e, "#shareTargets", "09b-en-share-platform-buttons");
savePng(await e.evaluate(() => document.getElementById("shareImg").src), "09c-en-share-card-image-4x5");
savePng(await e.evaluate(() => window.__healoa.storyPng()), "10b-en-story-9x16");
const enShare = await e.evaluate(() => window.__healoa.buildShare().url);
const er = await page0(base + new URL(enShare).search + "&date=2026-09-26", "en-US");
await snap(er, "09d-en-recipient-view");

// ---------- ja draft ----------
const j = await page0(base + D + "&lang=ja", "ja-JP");
await snap(j, "11-ja-home");
savePng(await (async () => { await j.click('#homeConds [data-cond="sleep"]'); await j.click('#resultBody [data-action="openCard"]'); return j.evaluate(() => window.__healoa.storyPng()); })(), "10c-ja-story-9x16");

console.log(JSON.stringify({ out: OUT, saved, consoleErrors: errors }, null, 2));
await browser.close();
server.close();
if (errors.length) process.exit(1);
