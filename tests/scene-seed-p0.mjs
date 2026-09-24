/**
 * Scene Seed P0 + Harbin/Wudang real photos + primary CTA skips body + short 发给朋友 share-tail (v2026-09-24-i)
 * Run:
 *   cd /workspace/healoa-base-prototype-preview && node tests/scene-seed-p0.mjs
 */
import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const EVIDENCE = "/workspace/docs/demo-evidence-2026-09-24";
const RESULTS = path.join(EVIDENCE, "14-test-results.json");

fs.mkdirSync(EVIDENCE, { recursive: true });

function startServer() {
  const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".css": "text/css",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
  };
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
    const rel = urlPath.replace(/^\/+/, "");
    const filePath = path.resolve(ROOT, rel);
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
      res.writeHead(403); res.end("forbidden"); return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}/` });
    });
  });
}

const steps = [];
function record(name, ok, detail) {
  steps.push({ name, ok: !!ok, detail: detail == null ? null : String(detail).slice(0, 500) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + String(detail).slice(0, 160) : ""}`);
}

async function shot(page, name) {
  const dest = path.join(EVIDENCE, `14-${name}.png`);
  await page.screenshot({ path: dest, fullPage: true });
  return dest;
}

async function goSoloToShare(page, lineText) {
  // Primary CTA → place pick (no body); one-tap place enters scene
  await page.click("#btnStart");
  await page.waitForSelector("#s2:not(.hidden)");
  await page.click('.place[data-id="yunnan"]');
  await page.waitForSelector("#s3:not(.hidden)");
  const leafOn = await page.locator('#markTools .tool[data-tool="leaf"].on').count();
  if (!leafOn) await page.click('#markTools .tool[data-tool="leaf"]');
  const stage = page.locator("#playStage");
  const box = await stage.boundingBox();
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.45);
  if (lineText != null) {
    await page.fill("#soloLine", lineText);
    await page.click("#btnSetLine");
  }
  // Short share-tail: one mark → 发给朋友 (skips s4)
  await page.click("#btnSendFriend");
  await page.waitForSelector("#s5:not(.hidden)");
}

async function confirmPrivacy(page) {
  await page.check("#privacyLineConfirm");
  await page.waitForTimeout(80);
}

async function main() {
  const { server, base } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const pageErrors = [];
  let senderMarksBefore = null;
  const twoContext = {
    recipientOpened: false,
    recipientStrokeAdded: false,
    senderSawStrokeAfterRefresh: null,
    senderMarkCountBefore: null,
    senderMarkCountAfter: null,
    recipientMarkCount: null,
  };

  try {
    const wudangHero = path.join(ROOT, "assets/places/wudang/02-terrace-sunrise.jpg");
    const wudangThumbFile = path.join(ROOT, "assets/places/wudang/01-cloud-sea-sun.jpg");
    record("wudang-asset-hero-exists", fs.existsSync(wudangHero) && fs.statSync(wudangHero).size > 1000, wudangHero);
    record("wudang-asset-thumb-exists", fs.existsSync(wudangThumbFile) && fs.statSync(wudangThumbFile).size > 1000, wudangThumbFile);
    const harbinHero = path.join(ROOT, "assets/places/harbin/01-night-snow-roofs.jpg");
    const harbinThumbFile = path.join(ROOT, "assets/places/harbin/03-day-milk-tea-village.jpg");
    const harbinFood = path.join(ROOT, "assets/places/harbin/03-day-milk-tea-village.jpg");
    record("harbin-asset-hero-exists", fs.existsSync(harbinHero) && fs.statSync(harbinHero).size > 1000, harbinHero);
    record("harbin-asset-thumb-exists", fs.existsSync(harbinThumbFile) && fs.statSync(harbinThumbFile).size > 1000, harbinThumbFile);
    record("harbin-asset-food-exists", fs.existsSync(harbinFood) && fs.statSync(harbinFood).size > 1000, harbinFood);
    const senderCtx = await browser.newContext();
    const sender = await senderCtx.newPage();
    sender.on("pageerror", (e) => pageErrors.push(String(e)));
    await sender.goto(base);
    const banner = await sender.locator(".proto-banner strong").innerText();
    record("version-banner", banner.includes("v2026-09-24-i"), banner);
    const homeH1 = await sender.locator("#s0 h1").innerText();
    const homePain = await sender.locator("#s0 .pain-line").innerText();
    const homeCta = await sender.locator("#btnStart").innerText();
    record("homepage-explains-app", (homeH1.includes("美的地方") || homeH1.includes("气氛") || homeH1.includes("太极")) && homeH1.includes("邀请"), homeH1);
    record("homepage-pain-point", homePain.includes("不用先填") || homePain.includes("不用真的先飞"), homePain.slice(0, 120));
    record("homepage-primary-cta", homeCta.includes("走进场景"), homeCta);
    const skipLabel = await sender.locator("#btnSkipIn").innerText();
    record("default-skip-is-wudang", skipLabel.includes("武当"), skipLabel);
    const homeLead = await sender.locator("#s0 .lead").innerText();
    record("homepage-feel-flow", homeLead.includes("气氛") && homeLead.includes("留下一笔"), homeLead.slice(0, 160));
    await shot(sender, "landing");

    // Primary CTA must NOT require body chips — goes to place pick
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    const onS1 = await sender.locator("#s1:not(.hidden)").count();
    const bodyRequired = await sender.evaluate(() => {
      const s1 = document.getElementById("s1");
      const s2 = document.getElementById("s2");
      return {
        s1Visible: s1 && !s1.classList.contains("hidden"),
        s2Visible: s2 && !s2.classList.contains("hidden"),
        bodySelected: !!(window.__healoaSeedTest && false),
      };
    });
    // state.body is internal; infer from UI: s1 hidden, s2 shown, no body chips selected needed
    const bodyChipsOn = await sender.locator("#bodyChips .chip.on").count();
    record(
      "primary-start-skips-body-form",
      onS1 === 0 && bodyRequired.s2Visible && bodyChipsOn === 0,
      JSON.stringify({ onS1, bodyChipsOn, ...bodyRequired })
    );
    // Wudang place card must be photo-first
    const wudangThumb = await sender.evaluate(() => {
      const icon = document.querySelector('.place[data-id="wudang"] .place-icon');
      if (!icon) return { ok: false };
      const cs = getComputedStyle(icon);
      const bg = cs.backgroundImage || "";
      return {
        ok: icon.classList.contains("photo") && bg.includes("assets/places/wudang/"),
        cls: icon.className,
        bg: bg.slice(0, 180),
      };
    });
    record("wudang-place-card-photo", wudangThumb.ok, JSON.stringify(wudangThumb));
    // Enter Wudang first: real photo must paint scene-bg
    await sender.click('.place[data-id="wudang"]');
    await sender.waitForSelector("#s3:not(.hidden)");
    await sender.waitForTimeout(400);
    const wudangScene = await sender.evaluate(() => {
      const bg = document.getElementById("sceneBg");
      const cs = getComputedStyle(bg);
      const inline = bg.style.backgroundImage || "";
      const sheet = cs.backgroundImage || "";
      const combined = inline + " " + sheet;
      return {
        className: bg.className,
        hasPhoto: combined.includes("assets/places/wudang/") && bg.classList.contains("wudang"),
        assetNote: (document.getElementById("assetNote") || {}).innerText || "",
        footer: (document.querySelector("#s3 .footer-meta, .footer-meta") || {}).innerText || "",
      };
    });
    record("wudang-scene-photo-bg", wudangScene.hasPhoto, JSON.stringify(wudangScene));
    record(
      "wudang-honesty-note",
      wudangScene.assetNote.includes("实景") && wudangScene.assetNote.includes("武当"),
      wudangScene.assetNote.slice(0, 160)
    );
    await sender.locator("#sceneShell").screenshot({ path: path.join(EVIDENCE, "wudang-scene-shell.png") });
    await shot(sender, "wudang-scene");

    // Share-card PNG polish: Wudang export must use real hero (not leaf/placeholder)
    const leafOnW = await sender.locator('#markTools .tool[data-tool="leaf"].on').count();
    if (!leafOnW) {
      const anyOn = await sender.locator("#markTools .tool.on").count();
      if (!anyOn) await sender.click("#markTools .tool").first();
    }
    const stageW = sender.locator("#playStage");
    const boxW = await stageW.boundingBox();
    await sender.mouse.click(boxW.x + boxW.width * 0.42, boxW.y + boxW.height * 0.48);
    await sender.fill("#soloLine", "雾还没散，我先留下一笔。");
    await sender.click("#btnSetLine");
    await sender.click("#btnSendFriend");
    await sender.waitForSelector("#s5:not(.hidden)");
    await sender.evaluate(async () => {
      if (window.__healoaSeedTest && window.__healoaSeedTest.ensureSharePhotoReady) {
        await window.__healoaSeedTest.ensureSharePhotoReady();
      }
      if (window.__healoaSeedTest && window.__healoaSeedTest.paintShareImgPreviewNow) {
        window.__healoaSeedTest.paintShareImgPreviewNow();
      }
    });
    await sender.waitForTimeout(200);
    const exportMeta = await sender.evaluate(() => {
      const api = window.__healoaSeedTest;
      return api.inspectShareCard("vertical");
    });
    record(
      "wudang-share-png-uses-hero",
      !!(exportMeta && exportMeta.usedPhoto && String(exportMeta.heroSrc || "").includes("assets/places/wudang/")),
      JSON.stringify({
        usedPhoto: exportMeta && exportMeta.usedPhoto,
        heroSrc: exportMeta && exportMeta.heroSrc,
        placeId: exportMeta && exportMeta.placeId,
      })
    );
    record(
      "wudang-share-png-crisp-size",
      !!(exportMeta && exportMeta.width >= 1080 && exportMeta.height >= 1440),
      JSON.stringify({ w: exportMeta && exportMeta.width, h: exportMeta && exportMeta.height })
    );
    record(
      "wudang-share-png-is-png",
      !!(exportMeta && exportMeta.isPngDataUrl && exportMeta.pngBytesHint > 20000),
      JSON.stringify({ isPng: exportMeta && exportMeta.isPngDataUrl, bytesHint: exportMeta && exportMeta.pngBytesHint })
    );
    const liveCardPhoto = await sender.evaluate(() => {
      const card = document.getElementById("seedCardLive");
      if (!card) return { ok: false };
      const cs = getComputedStyle(card);
      const bg = (card.style.backgroundImage || "") + " " + (cs.backgroundImage || "");
      return {
        ok: card.classList.contains("place-wudang") && card.classList.contains("has-photo") && bg.includes("assets/places/wudang/"),
        cls: card.className,
        bg: bg.slice(0, 200),
      };
    });
    record("wudang-live-seed-card-photo", liveCardPhoto.ok, JSON.stringify(liveCardPhoto));
    const previewShown = await sender.locator("#shareImgPreview").evaluate((el) => el.classList.contains("show") && !!el.src && el.src.indexOf("data:image/png") === 0);
    record("wudang-share-preview-png-shown", previewShown, "previewShown=" + previewShown);
    // Save exported PNG bytes into evidence for visual check
    await sender.evaluate((destHint) => {
      const api = window.__healoaSeedTest;
      const meta = api.inspectShareCard("vertical");
      window.__healoaLastExportDataUrl = meta.dataUrl || "";
      return !!window.__healoaLastExportDataUrl;
    }, "wudang-share-export.png");
    const dataUrl = await sender.evaluate(() => window.__healoaLastExportDataUrl || "");
    if (dataUrl && dataUrl.startsWith("data:image/png")) {
      const b64 = dataUrl.split(",", 2)[1] || "";
      const buf = Buffer.from(b64, "base64");
      fs.writeFileSync(path.join(EVIDENCE, "wudang-share-export.png"), buf);
      record("wudang-share-export-evidence-written", buf.length > 20000, "bytes=" + buf.length);
    } else {
      record("wudang-share-export-evidence-written", false, "no dataUrl");
    }
    await shot(sender, "wudang-share-card");

    // --- Harbin real-photo place (additional; default hero stays Wudang) ---
    await sender.click("#btnEndReplay");
    await sender.waitForSelector("#s0:not(.hidden)");
    const homeMulti = await sender.locator("#s0 .home-badge-row").innerText();
    record(
      "homepage-mentions-harbin-wudang",
      homeMulti.includes("哈尔滨") && homeMulti.includes("武当"),
      homeMulti.slice(0, 160)
    );
    const skipStillWudang = await sender.locator("#btnSkipIn").innerText();
    record("default-skip-still-wudang-with-harbin", skipStillWudang.includes("武当") && !skipStillWudang.includes("哈尔滨"), skipStillWudang);
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    const harbinThumb = await sender.evaluate(() => {
      const btn = document.querySelector('.place[data-id="harbin"]');
      const icon = btn && btn.querySelector(".place-icon");
      if (!icon) return { ok: false };
      const cs = getComputedStyle(icon);
      const bg = cs.backgroundImage || "";
      const span = (btn.querySelector("span") || {}).innerText || "";
      return {
        ok: icon.classList.contains("photo") && bg.includes("assets/places/harbin/"),
        cls: icon.className,
        bg: bg.slice(0, 200),
        span: span.slice(0, 120),
        cold: span.includes("28") || span.includes("−28") || span.includes("-28"),
        months: span.includes("两月") || span.includes("两个月"),
        food: span.includes("奶茶") || span.includes("暖食"),
      };
    });
    record("harbin-place-card-photo", harbinThumb.ok, JSON.stringify(harbinThumb));
    record(
      "harbin-place-card-bullets",
      !!(harbinThumb.cold && harbinThumb.months && harbinThumb.food),
      JSON.stringify({ cold: harbinThumb.cold, months: harbinThumb.months, food: harbinThumb.food, span: harbinThumb.span })
    );
    await sender.click('.place[data-id="harbin"]');
    await sender.waitForSelector("#s3:not(.hidden)");
    await sender.waitForTimeout(400);
    const harbinScene = await sender.evaluate(() => {
      const bg = document.getElementById("sceneBg");
      const cs = getComputedStyle(bg);
      const inline = bg.style.backgroundImage || "";
      const sheet = cs.backgroundImage || "";
      const combined = inline + " " + sheet;
      const line = (document.getElementById("sceneLine") || {}).innerText || "";
      return {
        className: bg.className,
        hasPhoto: combined.includes("assets/places/harbin/") && bg.classList.contains("harbin"),
        assetNote: (document.getElementById("assetNote") || {}).innerText || "",
        line: line.slice(0, 220),
        landmarkEmpty: !(document.getElementById("sceneLandmark") || {}).querySelector || !document.getElementById("sceneLandmark").querySelector("svg"),
      };
    });
    record("harbin-scene-photo-bg", harbinScene.hasPhoto, JSON.stringify(harbinScene));
    record(
      "harbin-honesty-note",
      harbinScene.assetNote.includes("实景") && (harbinScene.assetNote.includes("哈尔滨") || harbinScene.assetNote.includes("冰雪")),
      harbinScene.assetNote.slice(0, 160)
    );
    record(
      "harbin-scene-feel-copy",
      harbinScene.line.includes("冰雪") && (harbinScene.line.includes("28") || harbinScene.line.includes("零下")) && (harbinScene.line.includes("两个月") || harbinScene.line.includes("两月")) && (harbinScene.line.includes("奶茶") || harbinScene.line.includes("暖食")),
      harbinScene.line
    );
    await sender.locator("#sceneShell").screenshot({ path: path.join(EVIDENCE, "harbin-scene-shell.png") });
    await shot(sender, "harbin-scene");
    // mark + share PNG must use Harbin hero
    const anyOnH = await sender.locator("#markTools .tool.on").count();
    if (!anyOnH) await sender.click("#markTools .tool").first();
    const stageH = sender.locator("#playStage");
    const boxH = await stageH.boundingBox();
    await sender.mouse.click(boxH.x + boxH.width * 0.45, boxH.y + boxH.height * 0.5);
    await sender.fill("#soloLine", "先感受冰雪，再想想暖食。");
    await sender.click("#btnSetLine");
    await sender.click("#btnSendFriend");
    await sender.waitForSelector("#s5:not(.hidden)");
    await sender.evaluate(async () => {
      if (window.__healoaSeedTest && window.__healoaSeedTest.ensureSharePhotoReady) {
        await window.__healoaSeedTest.ensureSharePhotoReady();
      }
      if (window.__healoaSeedTest && window.__healoaSeedTest.paintShareImgPreviewNow) {
        window.__healoaSeedTest.paintShareImgPreviewNow();
      }
    });
    await sender.waitForTimeout(200);
    const harbinExport = await sender.evaluate(() => window.__healoaSeedTest.inspectShareCard("vertical"));
    record(
      "harbin-share-png-uses-hero",
      !!(harbinExport && harbinExport.usedPhoto && String(harbinExport.heroSrc || "").includes("assets/places/harbin/") && harbinExport.placeId === "harbin"),
      JSON.stringify({
        usedPhoto: harbinExport && harbinExport.usedPhoto,
        heroSrc: harbinExport && harbinExport.heroSrc,
        placeId: harbinExport && harbinExport.placeId,
      })
    );
    const harbinLiveCard = await sender.evaluate(() => {
      const card = document.getElementById("seedCardLive");
      if (!card) return { ok: false };
      const cs = getComputedStyle(card);
      const bg = (card.style.backgroundImage || "") + " " + (cs.backgroundImage || "");
      return {
        ok: card.classList.contains("place-harbin") && card.classList.contains("has-photo") && bg.includes("assets/places/harbin/"),
        cls: card.className,
        bg: bg.slice(0, 200),
      };
    });
    record("harbin-live-seed-card-photo", harbinLiveCard.ok, JSON.stringify(harbinLiveCard));
    const harbinDataUrl = await sender.evaluate(() => {
      const api = window.__healoaSeedTest;
      const meta = api.inspectShareCard("vertical");
      return meta.dataUrl || "";
    });
    if (harbinDataUrl && harbinDataUrl.startsWith("data:image/png")) {
      const b64 = harbinDataUrl.split(",", 2)[1] || "";
      const buf = Buffer.from(b64, "base64");
      fs.writeFileSync(path.join(EVIDENCE, "harbin-share-export.png"), buf);
      record("harbin-share-export-evidence-written", buf.length > 20000, "bytes=" + buf.length);
    } else {
      record("harbin-share-export-evidence-written", false, "no dataUrl");
    }
    await shot(sender, "harbin-share-card");

    // reset to continue yunnan share-path coverage
    await sender.click("#btnEndReplay");
    await sender.waitForSelector("#s0:not(.hidden)");
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    // one-tap place → scene (no body)
    await sender.click('.place[data-id="yunnan"]');
    await sender.waitForSelector("#s3:not(.hidden)");
    const reachedSceneNoBody = await sender.evaluate(() => {
      const s3 = document.getElementById("s3");
      const s1 = document.getElementById("s1");
      return {
        s3: s3 && !s3.classList.contains("hidden"),
        s1Hidden: !s1 || s1.classList.contains("hidden"),
        activeTool: document.querySelector("#markTools .tool.on")?.getAttribute("data-tool") || null,
      };
    });
    record(
      "primary-start-reaches-scene-without-body",
      reachedSceneNoBody.s3 && reachedSceneNoBody.s1Hidden,
      JSON.stringify(reachedSceneNoBody)
    );
    record(
      "first-mark-tool-auto-selected",
      !!reachedSceneNoBody.activeTool,
      "activeTool=" + reachedSceneNoBody.activeTool
    );
    // Fix B: scene must not be blank on enter
    await sender.waitForTimeout(500);
    const blankCheck = await sender.evaluate(() => {
      const bg = document.getElementById("sceneBg");
      const stage = document.getElementById("playStage");
      const landmark = document.getElementById("sceneLandmark");
      const coach = document.getElementById("coachDock");
      const sbg = getComputedStyle(bg);
      const stageRect = stage.getBoundingClientRect();
      const canvas = document.getElementById("fxCanvas");
      const ctx = canvas.getContext("2d");
      let maxA = 0;
      for (let i = 0; i < 30; i++) {
        const d = ctx.getImageData(Math.floor(canvas.width * (0.1 + i * 0.025)), Math.floor(canvas.height * 0.35), 1, 1).data;
        if (d[3] > maxA) maxA = d[3];
      }
      return {
        bgGradient: sbg.backgroundImage.includes("gradient"),
        bgOpacity: Number(sbg.opacity),
        stageH: stageRect.height,
        stageW: stageRect.width,
        stageInView: stageRect.top < window.innerHeight && stageRect.bottom > 40,
        landmarkSvg: !!(landmark && landmark.querySelector("svg")),
        coachText: (coach && coach.innerText) || "",
        lightOn: bg.classList.contains("light-on"),
        maxParticleA: maxA,
        stageBg: getComputedStyle(stage).backgroundColor,
      };
    });
    record("scene-not-blank-bg-gradient", blankCheck.bgGradient && blankCheck.bgOpacity > 0.5, JSON.stringify(blankCheck));
    record("scene-not-blank-stage-visible", blankCheck.stageH >= 180 && blankCheck.stageW >= 200 && blankCheck.stageInView, JSON.stringify({ h: blankCheck.stageH, w: blankCheck.stageW, inView: blankCheck.stageInView }));
    record("scene-not-blank-landmark", blankCheck.landmarkSvg, "landmarkSvg=" + blankCheck.landmarkSvg);
    record("scene-not-blank-coach-dock", blankCheck.coachText.includes("你可以做什么"), blankCheck.coachText.slice(0, 80));
    record("scene-not-blank-atmosphere", blankCheck.lightOn && blankCheck.maxParticleA >= 20, JSON.stringify({ lightOn: blankCheck.lightOn, maxA: blankCheck.maxParticleA }));
    await shot(sender, "scene-entered");
    await sender.locator("#sceneShell").screenshot({ path: path.join(EVIDENCE, "14-scene-shell.png") });

    // Short share-tail: one mark → 发给朋友 (skip s4 confirm dance)
    const sendDisabledBefore = await sender.locator("#btnSendFriend").isDisabled();
    record("send-friend-disabled-before-mark", sendDisabledBefore, "disabled=" + sendDisabledBefore);

    const leafOn0 = await sender.locator('#markTools .tool[data-tool="leaf"].on').count();
    if (!leafOn0) await sender.click('#markTools .tool[data-tool="leaf"]');
    const stage0 = sender.locator("#playStage");
    const box0 = await stage0.boundingBox();
    await sender.mouse.click(box0.x + box0.width * 0.4, box0.y + box0.height * 0.45);
    await sender.fill("#soloLine", "雨还没下完，叶子先亮了一下。");
    await sender.click("#btnSetLine");

    const sendEnabled = !(await sender.locator("#btnSendFriend").isDisabled());
    record("send-friend-enabled-after-one-mark", sendEnabled, "enabled=" + sendEnabled);
    const sendLabel = await sender.locator("#btnSendFriend").innerText();
    record("send-friend-cta-label", sendLabel.includes("发给朋友"), sendLabel);

    await sender.click("#btnSendFriend");
    await sender.waitForSelector("#s5:not(.hidden)");
    const s4Hidden = await sender.locator("#s4.hidden").count();
    record("share-tail-skips-save-screen", s4Hidden > 0, "s4 hidden=" + s4Hidden);
    await shot(sender, "share-after-one-mark");

    const primarySend = await sender.locator("#btnSendToFriend").innerText();
    record("share-primary-is-send-friend", primarySend.includes("发给朋友"), primarySend);

    const honest = await sender.locator("#seedHonestBlock").innerText();
    record(
      "invite-truth-copy",
      honest.includes("自己的副本") && honest.includes("不会") && honest.includes("持续更新") && honest.includes("seedId"),
      honest.slice(0, 200)
    );

    const feel = await sender.locator("#feelPrompt").innerText();
    record("solo-feel-wording", feel.includes("独自") && !feel.includes("一起体验"), feel);

    // Short share-tail: enter ready-to-send; editing public line re-gates (P0 honesty stays on screen)
    const sendReadyDefault = !(await sender.locator("#btnSendToFriend").isDisabled());
    const copyReadyDefault = !(await sender.locator("#btnCopySeedUrl").isDisabled());
    record(
      "privacy-default-ready-on-enter",
      sendReadyDefault === true && copyReadyDefault === true,
      "send enabled=" + sendReadyDefault + " copy enabled=" + copyReadyDefault
    );

    await sender.fill("#publicLineEdit", "改一行后应重新确认");
    await sender.waitForTimeout(80);
    const sendDisabledAfterEdit = await sender.locator("#btnSendToFriend").isDisabled();
    record("privacy-gate-after-edit", sendDisabledAfterEdit, "disabled after edit=" + sendDisabledAfterEdit);

    await confirmPrivacy(sender);
    const copyEnabled = !(await sender.locator("#btnSendToFriend").isDisabled());
    record("privacy-gate-after-confirm", copyEnabled, "send enabled=" + copyEnabled);
    await shot(sender, "share-after-confirm");

    // Customer-facing share/save must not show main-site jargon
    const s5Text = await sender.locator("#s5").innerText();
    const jargonHits = ["Choose Again", "Keeper", "Circle Edition", "Wrapped"].filter((t) => s5Text.includes(t));
    record("no-customer-jargon-on-share", jargonHits.length === 0, jargonHits.join(",") || "clean");

    const urlBox = await sender.locator("#seedUrlBox").innerText();
    record("seed-url-is-seed-hash", urlBox.includes("#seed=") && !urlBox.includes("#seedId="), urlBox.slice(0, 120));

    const seedUrl = await sender.evaluate(() => window.__healoaSeedTest.buildSeedUrl().url);
    record("buildSeedUrl-ok", !!seedUrl && seedUrl.includes("#seed=") && !seedUrl.includes("#seedId="), (seedUrl || "").slice(0, 100));

    const previewHas = await sender.locator("#shareImgPreview").evaluate((el) => el.classList.contains("show") && !!el.src);
    const ogNote = honest.includes("页内 PNG") || honest.includes("富卡片") || honest.includes("OG");
    record("inpage-png-vs-og-honesty", previewHas && ogNote, "png=" + previewHas + " ogNote=" + ogNote);

    const yunnanExport = await sender.evaluate(() => window.__healoaSeedTest.inspectShareCard("vertical"));
    record(
      "yunnan-share-png-no-fake-wudang-hero",
      !!(yunnanExport && yunnanExport.placeId === "yunnan" && yunnanExport.usedPhoto === false && !(yunnanExport.heroSrc || "").includes("wudang")),
      JSON.stringify({ placeId: yunnanExport && yunnanExport.placeId, usedPhoto: yunnanExport && yunnanExport.usedPhoto, heroSrc: yunnanExport && yunnanExport.heroSrc })
    );
    record(
      "yunnan-share-png-still-crisp",
      !!(yunnanExport && yunnanExport.width >= 1080 && yunnanExport.isPngDataUrl),
      JSON.stringify({ w: yunnanExport && yunnanExport.width, h: yunnanExport && yunnanExport.height, isPng: yunnanExport && yunnanExport.isPngDataUrl })
    );

    const nativeDupCheck = await sender.evaluate(() => {
      const api = window.__healoaSeedTest;
      const seed = api.buildSceneSeed();
      const result = api.buildSeedUrl(seed);
      const preview = document.getElementById("sharePreview").textContent || "";
      const occurrences = (preview.match(/#seed=/g) || []).length;
      return { ok: result.ok, occurrences };
    });
    record(
      "native-share-no-duplicate-url-contract",
      nativeDupCheck.ok && nativeDupCheck.occurrences === 1,
      JSON.stringify(nativeDupCheck)
    );

    const abortHandled = await sender.evaluate(async () => {
      const orig = navigator.share;
      navigator.share = () => Promise.reject(Object.assign(new Error("abort"), { name: "AbortError" }));
      document.getElementById("btnShareNative").click();
      await new Promise((r) => setTimeout(r, 80));
      const status = document.getElementById("shareStatus").textContent || "";
      navigator.share = orig;
      return status.includes("取消");
    });
    record("system-share-cancel", abortHandled, "abort status ok");

    const overlong = await sender.evaluate(() => window.__healoaSeedTest.forceOverlongSeed());
    record(
      "overlong-no-seedId-invite",
      overlong && overlong.ok === false && overlong.reason === "url_too_long" && !String(overlong.url || "").includes("seedId"),
      JSON.stringify(overlong)
    );

    const badHash = await sender.evaluate(() => {
      const api = window.__healoaSeedTest;
      return [
        api.validateCompact(null),
        api.validateCompact({ v: 99, p: "yunnan" }),
        api.validateCompact({ v: 1, p: "nope" }),
        api.validateCompact({ v: 1, p: "yunnan", t: 123 }),
        api.validateCompact({ v: 1, p: "yunnan", m: [{ x: 999, y: 1, tool: "leaf" }] }),
        api.validateCompact({ v: 1, p: "yunnan", t: "ok", m: [{ x: 10, y: 20, tool: "leaf" }] }),
      ];
    });
    record(
      "bad-hash-validation",
      badHash[0].ok === false &&
        badHash[1].ok === false &&
        badHash[2].ok === false &&
        badHash[3].ok === false &&
        badHash[4].ok === false &&
        badHash[5].ok === true,
      JSON.stringify(badHash.map((c) => ({ ok: c.ok, err: c.err || null })))
    );

    const badCtx = await browser.newContext();
    const badPage = await badCtx.newPage();
    await badPage.goto(base + "#seed=not-valid-base64!!!");
    await badPage.waitForTimeout(250);
    const errVisible = await badPage.locator("#seedImportError").count();
    record("bad-hash-error-ui", errVisible > 0, "error cards=" + errVisible);
    await shot(badPage, "bad-hash-error");
    await badCtx.close();

    const idCtx = await browser.newContext();
    const idPage = await idCtx.newPage();
    await idPage.goto(base + "#seedId=friend-cannot-open-this");
    await idPage.waitForTimeout(250);
    const idErr = await idPage.locator("#seedImportError").count();
    const idErrText = idErr ? await idPage.locator("#seedImportError").innerText() : "";
    record("seedId-unopenable-error", idErr > 0 && idErrText.includes("本机编号"), idErrText.slice(0, 180));
    await shot(idPage, "seedId-unopenable");
    await idCtx.close();

    const seedJson = await sender.evaluate(() => {
      const seed = window.__healoaSeedTest.buildSceneSeed();
      const raw = JSON.stringify(seed);
      return {
        privacy: seed.privacy,
        rawHasFatigueWord: raw.includes("肩颈") || raw.includes("累、想放空"),
        publicLine: seed.publicLine,
      };
    });
    record(
      "privacy-body-excluded",
      seedJson.privacy && seedJson.privacy.bodyExcluded === true && seedJson.privacy.fatigueExcluded === true && !seedJson.rawHasFatigueWord,
      JSON.stringify(seedJson)
    );

    await sender.click("#btnSimRecipient");
    await sender.waitForSelector("#sSeed:not(.hidden)");
    const simBadge = await sender.locator("#seedViewSimBadge").isVisible();
    const simSub = await sender.locator("#seedViewSub").innerText();
    record("same-device-sim-label", simBadge && simSub.includes("模拟"), simSub.slice(0, 120));
    await shot(sender, "same-device-sim");

    await sender.click("#btnSeedEnter");
    await sender.waitForSelector("#s3:not(.hidden)");
    const heading = await sender.locator("#sceneHeading").innerText();
    record("sim-enter-label", heading.includes("模拟"), heading);
    await sender.click('#markTools .tool[data-tool="sun"]');
    const stage2 = sender.locator("#playStage");
    const box2 = await stage2.boundingBox();
    const beforeSim = await sender.evaluate(() => window.__healoaSeedTest.getState().marks.length);
    await sender.mouse.click(box2.x + box2.width * 0.6, box2.y + box2.height * 0.55);
    const afterSim = await sender.evaluate(() => window.__healoaSeedTest.getState().marks.length);
    record("sim-stroke-changes-copy", afterSim === beforeSim + 1, `before=${beforeSim} after=${afterSim}`);
    await shot(sender, "sim-stroke");

    await senderCtx.close();

    // Two independent contexts
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    pageA.on("pageerror", (e) => pageErrors.push("A:" + e));
    await pageA.goto(base);
    await goSoloToShare(pageA, "两台设备副本测试句。");
    await confirmPrivacy(pageA);
    const inviteUrl = await pageA.evaluate(() => window.__healoaSeedTest.buildSeedUrl().url);
    senderMarksBefore = await pageA.evaluate(() => window.__healoaSeedTest.getState().marks.length);
    twoContext.senderMarkCountBefore = senderMarksBefore;
    await shot(pageA, "sender-before-invite");

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    pageB.on("pageerror", (e) => pageErrors.push("B:" + e));
    await pageB.goto(inviteUrl);
    await pageB.waitForTimeout(300);
    const openedSeed = await pageB.locator("#sSeed:not(.hidden)").count();
    twoContext.recipientOpened = openedSeed > 0;
    record("two-context-recipient-opens-seed", openedSeed > 0, "sSeed visible=" + openedSeed);
    await shot(pageB, "recipient-opened");

    if (openedSeed > 0) {
      const subB = await pageB.locator("#seedViewSub").innerText();
      record("two-context-copy-honesty", subB.includes("副本") && subB.includes("不会同步"), subB.slice(0, 160));
      const simHidden = await pageB.locator("#seedViewSimBadge").evaluate((el) => getComputedStyle(el).display === "none");
      record("two-context-not-labeled-sim", simHidden, "simBadgeHidden=" + simHidden);

      await pageB.click("#btnSeedEnter");
      await pageB.waitForSelector("#s3:not(.hidden)");
      const marksBeforeFriend = await pageB.evaluate(() => window.__healoaSeedTest.getState().marks.length);
      await pageB.click('#markTools .tool[data-tool="moss"]');
      const st = pageB.locator("#playStage");
      const bb = await st.boundingBox();
      await pageB.mouse.click(bb.x + bb.width * 0.7, bb.y + bb.height * 0.4);
      const marksAfterFriend = await pageB.evaluate(() => window.__healoaSeedTest.getState().marks.length);
      twoContext.recipientStrokeAdded = marksAfterFriend === marksBeforeFriend + 1;
      twoContext.recipientMarkCount = marksAfterFriend;
      record("two-context-recipient-adds-stroke", twoContext.recipientStrokeAdded, `before=${marksBeforeFriend} after=${marksAfterFriend}`);
      await shot(pageB, "recipient-stroke");

      await pageB.click("#btnSoloSave");
      await pageB.waitForSelector("#s4:not(.hidden)");
      await pageB.click("#btnSaveLocal");
    }

    await pageA.reload();
    await pageA.waitForTimeout(250);
    const restoreVisible = await pageA.locator("#btnRestore:not(.hidden)").count();
    if (restoreVisible) {
      await pageA.click("#btnRestore");
      await pageA.waitForTimeout(200);
    }
    const senderAfter = await pageA.evaluate(() => {
      try {
        const raw = localStorage.getItem("healoa_base_cocreate_v1");
        if (!raw) return { marks: null, via: "none", fromFriend: 0 };
        const data = JSON.parse(raw);
        const marks = (data.scene && data.scene.marks) || [];
        return { marks: marks.length, via: "local", fromFriend: marks.filter((m) => m.from === "friend").length };
      } catch (e) {
        return { marks: null, via: "err", err: String(e), fromFriend: 0 };
      }
    });
    twoContext.senderMarkCountAfter = senderAfter.marks;
    twoContext.senderSawStrokeAfterRefresh = senderAfter.fromFriend > 0;
    const expectNo = twoContext.senderSawStrokeAfterRefresh === false && senderAfter.marks === senderMarksBefore;
    record(
      "two-context-sender-does-NOT-see-friend-stroke",
      expectNo,
      JSON.stringify({ senderAfter, senderMarksBefore })
    );
    await shot(pageA, "sender-after-refresh");

    const soloCtx = await browser.newContext();
    const solo = await soloCtx.newPage();
    await solo.goto(base);
    await goSoloToShare(solo, "独自路径。");
    const feelSolo = await solo.locator("#feelPrompt").innerText();
    record("solo-path-feel", feelSolo.includes("独自"), feelSolo);
    await shot(solo, "solo-path");
    await soloCtx.close();

    await ctxA.close();
    await ctxB.close();

    record("pageerror-count", pageErrors.length === 0, pageErrors.join(" | ") || "0");
  } finally {
    await browser.close();
    server.close();
  }

  const passed = steps.filter((s) => s.ok).length;
  const failed = steps.filter((s) => !s.ok).length;
  const out = {
    version: "v2026-09-24-i",
    generatedAt: new Date().toISOString(),
    summary: { passed, failed, total: steps.length },
    twoContext,
    pageErrors,
    steps,
    runCommand: "cd /workspace/healoa-base-prototype-preview && node tests/scene-seed-p0.mjs",
  };
  fs.writeFileSync(RESULTS, JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(ROOT, "tests/scene-seed-p0-results.json"), JSON.stringify(out, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(`${passed}/${steps.length} PASS, ${failed} FAIL`);
  console.log("twoContext:", JSON.stringify(twoContext, null, 2));
  console.log("results:", RESULTS);
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
