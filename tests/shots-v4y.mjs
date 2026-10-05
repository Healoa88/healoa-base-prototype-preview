// v2026-09-27-y screenshots (390×844 phone + desktop / landscape) → HEALOA_V4Y_SHOTS_DIR (default /workspace/v4-y-shots)
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer } from "./lib/server.mjs";
const OUT = process.env.HEALOA_V4Y_SHOTS_DIR || "/workspace/v4-y-shots";
fs.mkdirSync(OUT, { recursive: true });
const { server, base } = await startServer();
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const D = "?date=2026-09-26";
async function page(q = "", vp = { width: 390, height: 844 }, locale = "zh-CN") {
  const c = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, locale });
  const p = await c.newPage(); p.on("pageerror", (e) => console.log("pageerror", String(e)));
  await p.goto(base + D + q); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("healoa.first.v1", JSON.stringify({ at: 1 })); }); await p.reload(); await p.waitForTimeout(500);
  return { c, p };
}
const shot = async (p, name, full = false) => { await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, name), fullPage: full }); console.log(name); };
const saveDataUrl = (url, name) => { fs.writeFileSync(path.join(OUT, name), Buffer.from(url.split(",")[1], "base64")); console.log(name); };
try {
  let { c, p } = await page();
  await shot(p, "01-home-zh.png");
  await p.click('[data-action="openQuiz"]'); await shot(p, "02-quiz-q1-more-options.png", true);
  await p.click('#quizBody [data-opt="heavy"]'); await p.click('#quizBody [data-opt="eyes"]'); await p.click('#quizBody [data-action="quizNext"]');
  for (let i = 0; i < 3; i++) await p.click('#quizBody [data-action="quizSkip"]');
  await p.click('#quizBody [data-opt="noexercise"]'); await p.click('#quizBody [data-opt="screen"]'); await shot(p, "03-quiz-q5-more-options.png", true);
  await p.click('#quizBody [data-action="quizNext"]'); await p.click('#quizBody [data-opt="green"]'); await p.click('#quizBody [data-action="quizNext"]');
  await p.click('#quizBody [data-opt="view"]'); await shot(p, "04-quiz-q7-more-options.png", true);
  await p.click('#quizBody [data-action="quizNext"]'); await p.click('#quizBody [data-action="quizSkip"]');
  await p.waitForTimeout(700); await shot(p, "05-reveal-face-down.png");
  await p.click("#revealBody .flip-card >> nth=0"); await p.waitForTimeout(900); await shot(p, "06-reveal-first-flipped.png");
  await p.click('#revealBody [data-action="flipAll"]'); await p.waitForTimeout(900); await shot(p, "07-reveal-all.png", true);
  await p.click('#revealBody [data-action="openWhy"]'); await shot(p, "08-why-these-places.png");
  await p.evaluate(() => window.__healoa.go("place", { placeId: "wudang" }, true)); await shot(p, "09-place-wudang-hero.png");
  await p.evaluate(() => document.getElementById("blkAction").scrollIntoView({ block: "start" })); await shot(p, "10-place-wudang-activities.png");
  await p.evaluate(() => window.__healoa.go("place", { placeId: "onsen" }, true)); await shot(p, "11-place-onsen-new-hero.png");
  await p.evaluate(() => window.__healoa.go("places", {}, true)); await shot(p, "12-all-places.png");
  await p.evaluate(() => window.__healoa.go("immersive", { placeId: "wudang" }, true)); await p.waitForTimeout(1500);
  await p.mouse.move(120, 300); await p.waitForTimeout(600); await shot(p, "13-immersive-wudang.png");
  await p.evaluate(() => window.__healoa.go("practice", { cond: "sleep", practiceId: "sitEasy" }, true)); await p.click("#btnMusic"); await shot(p, "14-practice-sit-easy-music-on.png");
  await p.click("#btnMusic");
  await p.click("#btnRemind"); await shot(p, "15-reminder-opt-in.png", true);
  await p.evaluate(() => window.__healoa.go("card", { cond: "sleep", season: "autumn" }, true)); await shot(p, "16-season-card.png");
  await p.click("#btnOpenShare"); await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
  await p.evaluate(() => document.getElementById("sharePanel").scrollIntoView({ block: "start" })); await shot(p, "17-share-options-zh.png");
  saveDataUrl(await p.evaluate(() => document.getElementById("shareImg").src), "18-share-9x16-zh-1080x1920.png");
  await p.click("#btnSaveImg"); await p.waitForFunction(() => !document.getElementById("imgModal").classList.contains("hidden")); await shot(p, "19-save-image-dialog-zh.png");
  await p.click('#imgModal [data-action="closeModal"]');
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await shot(p, "20-footer-copyright.png");
  await c.close();
  ({ c, p } = await page("&lang=en", undefined, "en-US"));
  await p.evaluate(() => window.__healoa.go("card", { cond: "sleep", season: "autumn" }, true));
  await p.click("#btnOpenShare"); await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:"));
  await p.evaluate(() => document.getElementById("sharePanel").scrollIntoView({ block: "start" })); await shot(p, "21-share-options-en.png");
  saveDataUrl(await p.evaluate(() => document.getElementById("shareImg").src), "22-share-9x16-en-1080x1920.png");
  await c.close();
  ({ c, p } = await page("&date=2026-12-20"));
  await shot(p, "23-home-winter-snow.png");
  await c.close();
  // desktop + landscape: centred phone-width frame over the blurred wide photo
  ({ c, p } = await page("", { width: 1280, height: 800 }));
  await shot(p, "24-desktop-1280-home.png");
  await p.evaluate(() => window.__healoa.go("place", { placeId: "pattaya" }, true)); await shot(p, "25-desktop-1280-place-pattaya.png");
  await c.close();
  ({ c, p } = await page("", { width: 844, height: 390 }));
  await shot(p, "26-phone-landscape-844x390-home.png");
  await c.close();
} finally { await browser.close(); server.close(); }
