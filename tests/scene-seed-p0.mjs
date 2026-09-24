/**
 * Scene Seed P0 + scene-not-blank (v2026-09-24-e)
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
  const html = fs.readFileSync(INDEX);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
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
  await page.click("#btnSkipIn");
  await page.waitForSelector("#s2:not(.hidden)");
  await page.click('.place[data-id="yunnan"]');
  await page.click("#btnEnter");
  await page.waitForSelector("#s3:not(.hidden)");
  await page.click('#markTools .tool[data-tool="leaf"]');
  const stage = page.locator("#playStage");
  const box = await stage.boundingBox();
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.45);
  if (lineText != null) {
    await page.fill("#soloLine", lineText);
    await page.click("#btnSetLine");
  }
  await page.click("#btnSoloSave");
  await page.waitForSelector("#s4:not(.hidden)");
  await page.click("#btnSaveLocal");
  await page.click("#btnToShare");
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
    const senderCtx = await browser.newContext();
    const sender = await senderCtx.newPage();
    sender.on("pageerror", (e) => pageErrors.push(String(e)));
    await sender.goto(base);
    const banner = await sender.locator(".proto-banner strong").innerText();
    record("version-banner", banner.includes("v2026-09-24-e"), banner);
    const homeH1 = await sender.locator("#s0 h1").innerText();
    const homePain = await sender.locator("#s0 .pain-line").innerText();
    const homeCta = await sender.locator("#btnStart").innerText();
    record("homepage-explains-app", homeH1.includes("美的地方") && homeH1.includes("邀请"), homeH1);
    record("homepage-pain-point", homePain.includes("不用先填") || homePain.includes("不用真的先飞"), homePain.slice(0, 120));
    record("homepage-primary-cta", homeCta.includes("走进场景"), homeCta);
    await shot(sender, "landing");

    // Fix B: scene must not be blank on enter
    await sender.click("#btnSkipIn");
    await sender.waitForSelector("#s2:not(.hidden)");
    await sender.click('.place[data-id="yunnan"]');
    await sender.click("#btnEnter");
    await sender.waitForSelector("#s3:not(.hidden)");
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

    // continue into share flow from current scene
    await sender.click('#markTools .tool[data-tool="leaf"]');
    const stage0 = sender.locator("#playStage");
    const box0 = await stage0.boundingBox();
    await sender.mouse.click(box0.x + box0.width * 0.4, box0.y + box0.height * 0.45);
    await sender.fill("#soloLine", "雨还没下完，叶子先亮了一下。");
    await sender.click("#btnSetLine");
    await sender.click("#btnSoloSave");
    await sender.waitForSelector("#s4:not(.hidden)");
    await sender.click("#btnSaveLocal");
    await sender.click("#btnToShare");
    await sender.waitForSelector("#s5:not(.hidden)");
    await shot(sender, "share-before-confirm");

    const copyDisabled = await sender.locator("#btnCopySeedUrl").isDisabled();
    record("privacy-gate-before-confirm", copyDisabled, "copy disabled=" + copyDisabled);

    const honest = await sender.locator("#seedHonestBlock").innerText();
    record(
      "invite-truth-copy",
      honest.includes("自己的副本") && honest.includes("不会") && honest.includes("持续更新") && honest.includes("seedId"),
      honest.slice(0, 200)
    );

    const feel = await sender.locator("#feelPrompt").innerText();
    record("solo-feel-wording", feel.includes("独自") && !feel.includes("一起体验"), feel);

    await confirmPrivacy(sender);
    const copyEnabled = !(await sender.locator("#btnCopySeedUrl").isDisabled());
    record("privacy-gate-after-confirm", copyEnabled, "copy enabled=" + copyEnabled);
    await shot(sender, "share-after-confirm");

    const urlBox = await sender.locator("#seedUrlBox").innerText();
    record("seed-url-is-seed-hash", urlBox.includes("#seed=") && !urlBox.includes("#seedId="), urlBox.slice(0, 120));

    const seedUrl = await sender.evaluate(() => window.__healoaSeedTest.buildSeedUrl().url);
    record("buildSeedUrl-ok", !!seedUrl && seedUrl.includes("#seed=") && !seedUrl.includes("#seedId="), (seedUrl || "").slice(0, 100));

    const previewHas = await sender.locator("#shareImgPreview").evaluate((el) => el.classList.contains("show") && !!el.src);
    const ogNote = honest.includes("页内 PNG") || honest.includes("富卡片") || honest.includes("OG");
    record("inpage-png-vs-og-honesty", previewHas && ogNote, "png=" + previewHas + " ogNote=" + ogNote);

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
    version: "v2026-09-24-e",
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
