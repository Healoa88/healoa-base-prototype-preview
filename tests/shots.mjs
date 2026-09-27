/**
 * Screenshots of the v3 main path at 390×844 (mobile). Output: $HEALOA_SHOTS_DIR or /workspace/hb-v3-shots
 * Run: node tests/shots.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer } from "./lib/server.mjs";

const OUT = process.env.HEALOA_SHOTS_DIR || "/workspace/hb-v3-shots";
fs.mkdirSync(OUT, { recursive: true });
const { server, base } = await startServer();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "zh-CN" });
const errors = [];
const saved = [];
async function page0(url) {
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(url);
  await p.waitForLoadState("networkidle");
  return p;
}
async function snap(p, name, full = true) {
  await p.waitForTimeout(250);
  const f = path.join(OUT, name + ".png");
  await p.screenshot({ path: f, fullPage: full });
  saved.push(f);
}
const D = "?date=2026-09-26";

let p = await page0(base + D);
await snap(p, "01-home");

await p.click('#homeConds [data-cond="bp"]');
await p.click('#vResult [data-action="season"][data-season="winter"]');
await p.waitForLoadState("networkidle");
await snap(p, "02-result-bp-winter");
await snap(p, "02b-result-bp-winter-first-screen", false);

await p.click('#vResult [data-action="season"][data-season="autumn"]');
await p.click('#resultConds [data-cond="sleep"]');
await p.waitForLoadState("networkidle");
await snap(p, "03-result-sleep-autumn");
await snap(p, "03b-result-sleep-autumn-first-screen", false);

await p.click('#resultBody [data-action="openPlace"] >> nth=0');
await p.waitForLoadState("networkidle");
await snap(p, "04-place-card");

await p.click('#vPlace [data-action="back"]');
await p.click('#resultBody [data-action="openPractice"][data-practice="breath478"] >> nth=0');
await p.click("#btnStart");
await p.waitForTimeout(2600);
await snap(p, "05-breathing-timer-running", false);
await p.click("#btnStop");

await p.click('#practiceModes [data-practice="walk"]');
await p.click("#btnStart");
await p.waitForTimeout(1500);
await snap(p, "05b-slow-walk-running", false);
await p.click("#btnStop");

await p.click('#vPractice [data-action="back"]');
await p.click('#resultBody [data-action="openCard"]');
await p.click("#btnKeep");
await snap(p, "06-season-card");
await p.click("#btnOpenShare");
await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
await snap(p, "06b-season-card-share-panel");
const shareUrl = await p.evaluate(() => window.__healoa.buildShare().url);
const shareImg = await p.evaluate(() => document.getElementById("shareImg").src);
fs.writeFileSync(path.join(OUT, "06c-share-card-image.png"), Buffer.from(shareImg.split(",")[1], "base64"));
saved.push(path.join(OUT, "06c-share-card-image.png"));

const local = new URL(shareUrl);
const q = await page0(base + local.search + "&date=2026-09-26");
await snap(q, "07-shared-link-view");
await q.click('#sharedConds [data-cond="cold"]');
await snap(q, "07b-shared-link-own-result-first-screen", false);

console.log(JSON.stringify({ out: OUT, saved, consoleErrors: errors }, null, 2));
await browser.close();
server.close();
if (errors.length) process.exit(1);
