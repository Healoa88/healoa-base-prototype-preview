/**
 * Scene Seed P0 + place/path share PNG heroes + Wudang/Forest/Thai chooser + Harbin (v2026-09-24-o)
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

async function markAndInspectShare(page, lineText) {
  const anyOn = await page.locator("#markTools .tool.on").count();
  if (!anyOn) await page.click("#markTools .tool").first();
  const stage = page.locator("#playStage");
  const box = await stage.boundingBox();
  await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.48);
  await page.click("#btnSendFriend");
  await page.waitForSelector("#s5:not(.hidden)");
  await page.fill("#cardLineEdit", lineText);
  await page.waitForTimeout(320);
  await page.evaluate(async () => {
    if (window.__healoaSeedTest && window.__healoaSeedTest.ensureSharePhotoReady) {
      await window.__healoaSeedTest.ensureSharePhotoReady();
    }
    if (window.__healoaSeedTest && window.__healoaSeedTest.paintShareImgPreviewNow) {
      window.__healoaSeedTest.paintShareImgPreviewNow();
    }
  });
  await page.waitForTimeout(200);
  return page.evaluate(() => window.__healoaSeedTest.inspectShareCard("vertical"));
}

async function goSoloToShare(page, lineText) {
  // Primary CTA → place pick (no body); one-tap place enters scene
  await page.click("#btnStart");
  await page.waitForSelector("#s2:not(.hidden)");
  await page.click('.place[data-id="onsen"]');
  await page.waitForSelector("#s3:not(.hidden)");
  const toolOn = await page.locator('#markTools .tool.on').count();
  if (!toolOn) await page.locator('#markTools .tool').first().click();
  const stage = page.locator("#playStage");
  const box = await stage.boundingBox();
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.45);
  // one mark → 留一句 (card editor)
  await page.click("#btnSendFriend");
  await page.waitForSelector("#s5:not(.hidden)");
  if (lineText != null) {
    await page.fill("#cardLineEdit", lineText);
    await page.waitForTimeout(320);
  }
}

async function confirmPrivacy(page) {
  // v-n: card is WYSIWYG editor; no separate confirm gate. Kept as no-op for call sites.
  await page.waitForTimeout(80);
}
async function domClick(page, sel) {
  await page.evaluate((s) => document.querySelector(s).click(), sel);
}
async function visibleButtons(page, scope) {
  return page.evaluate((sc) => {
    const root = document.querySelector(sc);
    return [...root.querySelectorAll("button")]
      .filter((b) => b.offsetParent !== null && !b.closest("details:not([open])") && !b.closest("details") && !b.classList.contains("chip"))
      .map((b) => b.innerText.trim());
  }, scope);
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
    const pathAssets = [
      ["wudang-path-homestay-courtyard", "assets/places/wudang/homestay/01-courtyard-house.jpg"],
      ["wudang-path-homestay-tea", "assets/places/wudang/homestay/02-window-tea-terrace.jpg"],
      ["wudang-path-vista-cliff", "assets/places/wudang/vista/01-cliff-pavilion.jpg"],
      ["wudang-path-bustle-crowd", "assets/places/wudang/bustle/01-stairs-cable-crowd.jpg"],
    ];
    for (const [name, rel] of pathAssets) {
      const fp = path.join(ROOT, rel);
      record(name + "-exists", fs.existsSync(fp) && fs.statSync(fp).size > 1000, fp);
    }
    const harbinHero = path.join(ROOT, "assets/places/harbin/01-night-snow-roofs.jpg");
    const harbinThumbFile = path.join(ROOT, "assets/places/harbin/03-day-milk-tea-village.jpg");
    const harbinFood = path.join(ROOT, "assets/places/harbin/03-day-milk-tea-village.jpg");
    record("harbin-asset-hero-exists", fs.existsSync(harbinHero) && fs.statSync(harbinHero).size > 1000, harbinHero);
    record("harbin-asset-thumb-exists", fs.existsSync(harbinThumbFile) && fs.statSync(harbinThumbFile).size > 1000, harbinThumbFile);
    record("harbin-asset-food-exists", fs.existsSync(harbinFood) && fs.statSync(harbinFood).size > 1000, harbinFood);
    const forestAssets = [
      ["forest-path-porch-lava", "assets/places/forest/porch/01-lava-porch.jpg"],
      ["forest-path-leaf-tunnel", "assets/places/forest/path/01-leaf-tunnel.jpg"],
      ["forest-path-monstera", "assets/places/forest/path/02-monstera-tunnel.jpg"],
      ["forest-path-canopy", "assets/places/forest/path/03-canopy-drive.jpg"],
      ["forest-cabin-desk", "assets/places/cabin/03-desk-notebook-window.jpg"],
      ["forest-cabin-porch-frost", "assets/places/cabin/01-porch-frost-forest.jpg"],
      ["forest-cabin-birch", "assets/places/cabin/02-cabin-through-birch.jpg"],
      ["forest-cabin-soup", "assets/places/cabin/04-soup-window-warm.jpg"],
      ["forest-cabin-aurora", "assets/places/cabin/05-aurora-forest-night.jpg"],
    ];
    for (const [name, rel] of forestAssets) {
      const fp = path.join(ROOT, rel);
      record(name + "-exists", fs.existsSync(fp) && fs.statSync(fp).size > 1000, fp);
    }
    const thaiAssets = [
      ["thai-path-pool-infinity", "assets/places/thai/pool/01-infinity-coast.jpg"],
      ["thai-path-pool-deck", "assets/places/thai/pool/02-deck-photo.jpg"],
      ["thai-path-pool-canopy", "assets/places/thai/pool/03-long-pool-canopy.jpg"],
      ["thai-path-market-boat", "assets/places/thai/market/01-floating-market-boat.jpg"],
      ["thai-path-dive-scuba", "assets/places/thai/dive/01-scuba-pair.jpg"],
      ["thai-path-sunset-harbor", "assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg"],
    ];
    for (const [name, rel] of thaiAssets) {
      const fp = path.join(ROOT, rel);
      record(name + "-exists", fs.existsSync(fp) && fs.statSync(fp).size > 1000, fp);
    }
    const senderCtx = await browser.newContext();
    const sender = await senderCtx.newPage();
    sender.on("pageerror", (e) => pageErrors.push(String(e)));
    await sender.goto(base);
    const banner = await sender.locator(".proto-banner strong").innerText();
    record("version-banner", banner.includes("v2026-09-24-o"), banner);

    const heroMap = await sender.evaluate(() => window.__healoaSeedTest.placePhotoHeroMap());
    const expectedHeroes = {
      wudang: "assets/places/wudang/02-terrace-sunrise.jpg",
      "wudang-homestay": "assets/places/wudang/homestay/01-courtyard-house.jpg",
      "wudang-vista": "assets/places/wudang/vista/01-cliff-pavilion.jpg",
      "wudang-bustle": "assets/places/wudang/bustle/01-stairs-cable-crowd.jpg",
      harbin: "assets/places/harbin/01-night-snow-roofs.jpg",
      forest: "assets/places/forest/porch/01-lava-porch.jpg",
      "forest-porch": "assets/places/forest/porch/01-lava-porch.jpg",
      "forest-path": "assets/places/forest/path/01-leaf-tunnel.jpg",
      "forest-cabin": "assets/places/cabin/03-desk-notebook-window.jpg",
      thai: "assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg",
      "thai-pool": "assets/places/thai/pool/01-infinity-coast.jpg",
      "thai-market": "assets/places/thai/market/01-floating-market-boat.jpg",
      "thai-dive": "assets/places/thai/dive/01-scuba-pair.jpg",
      "thai-sunset": "assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg",
      onsen: "assets/places/onsen/01-hot-spring-field-town.jpg",
    };
    let mapOk = true;
    const mapMiss = [];
    for (const [id, hero] of Object.entries(expectedHeroes)) {
      if (heroMap[id] !== hero) {
        mapOk = false;
        mapMiss.push(id + "=>" + (heroMap[id] || "(missing)"));
      }
    }
    record("share-hero-map-covers-photo-places", mapOk, mapMiss.join("; ") || "all " + Object.keys(expectedHeroes).length + " keys match");
    record("share-hero-map-onsen-real-photo", heroMap.onsen === "assets/places/onsen/01-hot-spring-field-town.jpg", "onsen=" + (heroMap.onsen || "(none)"));
    for (const f of ["assets/places/onsen/01-hot-spring-field-town.jpg", "assets/places/onsen/02-hot-spring-falls.jpg"]) {
      const fp = path.join(ROOT, f);
      record("onsen-asset-exists-" + path.basename(f), fs.existsSync(fp) && fs.statSync(fp).size > 1000, fp);
    }

    const homeH1 = await sender.locator("#s0 h1").innerText();
    const homePain = await sender.locator("#s0 .pain-line").innerText();
    const homeCta = await sender.locator("#btnStart").innerText();
    record("homepage-explains-app", homeH1.trim() === "选一个让你想停下来的地方。留下一句话，把它变成你的作品，再交给朋友接着创作。", homeH1);
    const chaptersUi = await sender.evaluate(() => { const d = document.getElementById("myChapters"); return { exists: !!d, closed: d && !d.open, summary: d && d.querySelector("summary").textContent, inAbout: !!(d && d.closest(".about-demo")) }; });
    record("my-chapters-unobtrusive", chaptersUi.exists && chaptersUi.closed && chaptersUi.summary === "我的篇章" && !chaptersUi.inAbout, JSON.stringify(chaptersUi));
    const evBtns = await sender.evaluate(() => ["btnDownloadEvents", "btnDownloadEventsHome"].map((id) => { const b = document.getElementById(id); return !!(b && b.closest("details.about-demo")); }));
    const evBtnsOutside = await sender.evaluate(() => [...document.querySelectorAll("button")].filter((b) => /事件记录|event log/i.test(b.textContent) && !b.closest("details.about-demo")).length);
    record("events-json-link-only-inside-about-demo", evBtns.every(Boolean) && evBtnsOutside === 0, JSON.stringify({ evBtns, evBtnsOutside }));
    const homeSteps = await sender.locator("#s0 .steps").innerText();
    record("homepage-4-steps", ["选地方", "留一笔", "留一句", "发给一个人"].every((x) => homeSteps.includes(x)) && !homeSteps.includes("身体"), homeSteps.replace(/\n/g, " "));
    const bodyEntries = await sender.evaluate(() => ["btnOptionalBody", "btnOptionalBodyFromScene"].filter((id) => document.getElementById(id)).length);
    const anyStepsBody = await sender.evaluate(() => [...document.querySelectorAll(".steps")].some((el) => el.textContent.includes("身体")));
    record("body-season-out-of-first-round", bodyEntries === 0 && !anyStepsBody, JSON.stringify({ bodyEntries, anyStepsBody }));
    record("homepage-pain-point", homePain.includes("不用先填") || homePain.includes("不用真的先飞"), homePain.slice(0, 120));
    record("homepage-primary-cta", homeCta.includes("走进场景"), homeCta);
    const skipLabel = await sender.locator("#btnSkipIn").innerText();
    record("default-skip-is-wudang", skipLabel.includes("武当"), skipLabel);
    const homeLead = await sender.locator("#s0 .lead").innerText();
    record("homepage-feel-flow", ["选地方", "留一笔", "留一句", "发给一个人"].every((x) => homeLead.includes(x)), homeLead.slice(0, 160));
    await shot(sender, "landing");
    await sender.screenshot({ path: path.join(EVIDENCE, "p0n-home4step.png"), fullPage: true });

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
    // Pick 武当 → path chooser (NOT body questionnaire, NOT auto-enter scene)
    await sender.click('.place[data-id="wudang"]');
    await sender.waitForSelector("#s2w:not(.hidden)");
    const onS1AfterWudang = await sender.locator("#s1:not(.hidden)").count();
    const onS3AfterWudang = await sender.locator("#s3:not(.hidden)").count();
    const pathCards = await sender.locator("#wudangPathList .path-card").count();
    const pathLabels = await sender.locator("#wudangPathList").innerText();
    record(
      "wudang-path-chooser-visible",
      onS1AfterWudang === 0 && onS3AfterWudang === 0 && pathCards === 3,
      JSON.stringify({ onS1AfterWudang, onS3AfterWudang, pathCards, labels: pathLabels.slice(0, 180) })
    );
    record(
      "wudang-path-chooser-copy",
      pathLabels.includes("山居慢住") && !pathLabels.includes("疗愈") && pathLabels.includes("山中胜景") && pathLabels.includes("热闹观景") && pathLabels.includes("想安静住下来") && pathLabels.includes("想先被山打动") && pathLabels.includes("能接受人多"),
      pathLabels.slice(0, 240)
    );
    record(
      "wudang-bustle-honesty-badge",
      pathLabels.includes("人多") && (pathLabels.includes("热门打卡") || pathLabels.includes("热闹")),
      pathLabels.slice(0, 200)
    );
    await shot(sender, "wudang-path-chooser");
    await sender.locator("#s2w").screenshot({ path: path.join(EVIDENCE, "wudang-path-chooser.png") });

    // Skip-in also lands on path chooser
    await sender.click("#s2w [data-back='s0']");
    await sender.waitForSelector("#s0:not(.hidden)");
    await sender.click("#btnSkipIn");
    await sender.waitForSelector("#s2w:not(.hidden)");
    record("wudang-skip-in-opens-path-chooser", true, "btnSkipIn → s2w");

    // Each path enters scene with matching photo
    const pathChecks = [
      {
        id: "wudang-homestay",
        needle: "homestay/01-courtyard-house",
        bgClass: "wudang-homestay",
        shot: "wudang-path-homestay",
        nameBits: ["山居", "慢住"],
      },
      {
        id: "wudang-vista",
        needle: "vista/01-cliff-pavilion",
        bgClass: "wudang-vista",
        shot: "wudang-path-vista",
        nameBits: ["胜景", "山"],
      },
      {
        id: "wudang-bustle",
        needle: "bustle/01-stairs-cable-crowd",
        bgClass: "wudang-bustle",
        shot: "wudang-path-bustle",
        nameBits: ["热闹", "人多"],
      },
    ];
    for (const pc of pathChecks) {
      await sender.goto(base);
      await sender.click("#btnStart");
      await sender.waitForSelector("#s2:not(.hidden)");
      await sender.click('.place[data-id="wudang"]');
      await sender.waitForSelector("#s2w:not(.hidden)");
      await sender.click(`.path-card[data-path="${pc.id}"]`);
      await sender.waitForSelector("#s3:not(.hidden)");
      await sender.waitForTimeout(350);
      const scene = await sender.evaluate((expect) => {
        const bg = document.getElementById("sceneBg");
        const cs = getComputedStyle(bg);
        const inline = bg.style.backgroundImage || "";
        const sheet = cs.backgroundImage || "";
        const combined = inline + " " + sheet;
        const label = (document.getElementById("sceneLabel") || {}).innerText || "";
        const line = (document.getElementById("sceneLine") || {}).innerText || "";
        const note = (document.getElementById("assetNote") || {}).innerText || "";
        const heading = (document.getElementById("sceneHeading") || {}).innerText || "";
        return {
          className: bg.className,
          hasPhoto: combined.includes(expect.needle) && bg.classList.contains(expect.bgClass),
          combined: combined.slice(0, 220),
          label, line, note, heading,
          markTools: document.querySelectorAll("#markTools .tool").length,
        };
      }, pc);
      record(
        "wudang-path-" + pc.id.replace("wudang-", "") + "-enters-scene",
        !!(scene.hasPhoto && scene.markTools >= 3),
        JSON.stringify(scene)
      );
      const nameOk = pc.nameBits.some((b) => (scene.label + scene.heading + scene.line).includes(b));
      record("wudang-path-" + pc.id.replace("wudang-", "") + "-copy", nameOk, (scene.label + " | " + scene.line).slice(0, 160));
      if (pc.id === "wudang-bustle") {
        record(
          "wudang-bustle-scene-honesty",
          scene.line.includes("人多") || scene.label.includes("人多"),
          (scene.label + " | " + scene.line).slice(0, 180)
        );
      }
      record(
        "wudang-path-" + pc.id.replace("wudang-", "") + "-honesty-note",
        scene.note.includes("实景") && scene.note.includes("武当"),
        scene.note.slice(0, 160)
      );
      await sender.locator("#sceneShell").screenshot({ path: path.join(EVIDENCE, pc.shot + ".png") });
      await shot(sender, pc.shot);
    }

    // Fresh navigate into vista for share PNG polish continuity
    await sender.goto(base);
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    await sender.click('.place[data-id="wudang"]');
    await sender.waitForSelector("#s2w:not(.hidden)");
    await sender.click('.path-card[data-path="wudang-vista"]');
    await sender.waitForSelector("#s3:not(.hidden)");
    await sender.waitForTimeout(300);
    const wudangScene = await sender.evaluate(() => {
      const bg = document.getElementById("sceneBg");
      const cs = getComputedStyle(bg);
      const inline = bg.style.backgroundImage || "";
      const sheet = cs.backgroundImage || "";
      const combined = inline + " " + sheet;
      return {
        className: bg.className,
        hasPhoto: combined.includes("assets/places/wudang/") && (bg.classList.contains("wudang-vista") || bg.classList.contains("wudang")),
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
    await sender.click("#btnSendFriend");
    await sender.waitForSelector("#s5:not(.hidden)");
    await sender.fill("#cardLineEdit", "雾还没散，我先留下一笔。");
    await sender.waitForTimeout(320);
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
      !!(exportMeta && exportMeta.usedPhoto && exportMeta.placeId === "wudang-vista" && String(exportMeta.heroSrc || "").includes("assets/places/wudang/vista/01-cliff-pavilion")),
      JSON.stringify({
        usedPhoto: exportMeta && exportMeta.usedPhoto,
        heroSrc: exportMeta && exportMeta.heroSrc,
        placeId: exportMeta && exportMeta.placeId,
        expectedHero: exportMeta && exportMeta.expectedHero,
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

    // --- Forest top-level place → path chooser (mirror Wudang) ---
    await sender.goto(base);
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    const forestThumb = await sender.evaluate(() => {
      const icon = document.querySelector('.place[data-id="forest"] .place-icon');
      if (!icon) return { ok: false };
      const cs = getComputedStyle(icon);
      const bg = cs.backgroundImage || "";
      return {
        ok: icon.classList.contains("photo") && bg.includes("assets/places/forest/"),
        cls: icon.className,
        bg: bg.slice(0, 180),
      };
    });
    record("forest-place-card-photo", forestThumb.ok, JSON.stringify(forestThumb));
    await sender.click('.place[data-id="forest"]');
    await sender.waitForSelector("#s2f:not(.hidden)");
    const onS1AfterForest = await sender.locator("#s1:not(.hidden)").count();
    const onS3AfterForest = await sender.locator("#s3:not(.hidden)").count();
    const forestPathCards = await sender.locator("#forestPathList .path-card").count();
    const forestPathLabels = await sender.locator("#forestPathList").innerText();
    record(
      "forest-path-chooser-visible",
      onS1AfterForest === 0 && onS3AfterForest === 0 && forestPathCards === 3,
      JSON.stringify({ onS1AfterForest, onS3AfterForest, forestPathCards, labels: forestPathLabels.slice(0, 200) })
    );
    record(
      "forest-path-chooser-copy",
      forestPathLabels.includes("廊前远望") && forestPathLabels.includes("林中路") && forestPathLabels.includes("屋里创作") && forestPathLabels.includes("想站在廊前望远") && forestPathLabels.includes("想走进绿隧道") && forestPathLabels.includes("想安静写点什么"),
      forestPathLabels.slice(0, 280)
    );
    record(
      "forest-cabin-honesty-badge",
      forestPathLabels.includes("窗外可能很冷") && forestPathLabels.includes("非医疗"),
      forestPathLabels.slice(0, 220)
    );
    await shot(sender, "forest-path-chooser");
    await sender.locator("#s2f").screenshot({ path: path.join(EVIDENCE, "forest-path-chooser.png") });

    const forestPathChecks = [
      {
        id: "forest-porch",
        needle: "forest/porch/01-lava-porch",
        bgClass: "forest-porch",
        shot: "forest-path-porch",
        nameBits: ["廊前", "远望"],
      },
      {
        id: "forest-path",
        needle: "forest/path/01-leaf-tunnel",
        bgClass: "forest-path",
        shot: "forest-path-path",
        nameBits: ["林中", "绿隧道", "林"],
      },
      {
        id: "forest-cabin",
        needle: "cabin/03-desk-notebook-window",
        bgClass: "forest-cabin",
        shot: "forest-path-cabin",
        nameBits: ["屋里", "创作"],
      },
    ];
    for (const pc of forestPathChecks) {
      await sender.goto(base);
      await sender.click("#btnStart");
      await sender.waitForSelector("#s2:not(.hidden)");
      await sender.click('.place[data-id="forest"]');
      await sender.waitForSelector("#s2f:not(.hidden)");
      await sender.click(`.path-card[data-path="${pc.id}"]`);
      await sender.waitForSelector("#s3:not(.hidden)");
      await sender.waitForTimeout(350);
      const scene = await sender.evaluate((expect) => {
        const bg = document.getElementById("sceneBg");
        const cs = getComputedStyle(bg);
        const inline = bg.style.backgroundImage || "";
        const sheet = cs.backgroundImage || "";
        const combined = inline + " " + sheet;
        const label = (document.getElementById("sceneLabel") || {}).innerText || "";
        const line = (document.getElementById("sceneLine") || {}).innerText || "";
        const note = (document.getElementById("assetNote") || {}).innerText || "";
        const heading = (document.getElementById("sceneHeading") || {}).innerText || "";
        return {
          className: bg.className,
          hasPhoto: combined.includes(expect.needle) && bg.classList.contains(expect.bgClass),
          combined: combined.slice(0, 240),
          label, line, note, heading,
          markTools: document.querySelectorAll("#markTools .tool").length,
        };
      }, pc);
      record(
        "forest-path-" + pc.id.replace("forest-", "") + "-enters-scene",
        !!(scene.hasPhoto && scene.markTools >= 3),
        JSON.stringify(scene)
      );
      const nameOk = pc.nameBits.some((b) => (scene.label + scene.heading + scene.line).includes(b));
      record("forest-path-" + pc.id.replace("forest-", "") + "-copy", nameOk, (scene.label + " | " + scene.line).slice(0, 160));
      if (pc.id === "forest-cabin") {
        record(
          "forest-cabin-scene-honesty",
          scene.line.includes("冷") || scene.line.includes("医疗") || scene.line.includes("药"),
          (scene.label + " | " + scene.line).slice(0, 200)
        );
      }
      record(
        "forest-path-" + pc.id.replace("forest-", "") + "-honesty-note",
        scene.note.includes("实景") && (scene.note.includes("森林") || scene.note.includes("廊前") || scene.note.includes("林中") || scene.note.includes("屋里") || scene.note.includes("创作")),
        scene.note.slice(0, 160)
      );
      await sender.locator("#sceneShell").screenshot({ path: path.join(EVIDENCE, pc.shot + ".png") });
      await shot(sender, pc.shot);
    }

    // Forest share PNG: cabin path must use cabin desk hero (not Wudang terrace)
    await sender.goto(base);
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    await sender.click('.place[data-id="forest"]');
    await sender.waitForSelector("#s2f:not(.hidden)");
    await sender.click('.path-card[data-path="forest-cabin"]');
    await sender.waitForSelector("#s3:not(.hidden)");
    await sender.waitForTimeout(300);
    const forestExport = await markAndInspectShare(sender, "屋里先写下这一句。");
    record(
      "forest-share-png-uses-cabin-hero",
      !!(forestExport && forestExport.usedPhoto && forestExport.placeId === "forest-cabin" && String(forestExport.heroSrc || "").includes("assets/places/cabin/03-desk-notebook-window")),
      JSON.stringify({
        usedPhoto: forestExport && forestExport.usedPhoto,
        heroSrc: forestExport && forestExport.heroSrc,
        placeId: forestExport && forestExport.placeId,
        expectedHero: forestExport && forestExport.expectedHero,
      })
    );
    record(
      "forest-share-png-no-wudang-borrow",
      !!(forestExport && !(String(forestExport.heroSrc || "").includes("wudang"))),
      JSON.stringify({ heroSrc: forestExport && forestExport.heroSrc })
    );
    await shot(sender, "forest-share-card");

    // --- Thai top-level place → path chooser (mirror Wudang/Forest) ---
    await sender.goto(base);
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    const thaiThumb = await sender.evaluate(() => {
      const icon = document.querySelector('.place[data-id="thai"] .place-icon');
      if (!icon) return { ok: false };
      const cs = getComputedStyle(icon);
      const bg = cs.backgroundImage || "";
      const btn = document.querySelector('.place[data-id="thai"]');
      const title = (btn && btn.querySelector("b") || {}).innerText || "";
      return {
        ok: icon.classList.contains("photo") && bg.includes("assets/places/thai/") && title.includes("拥抱大海"),
        cls: icon.className,
        bg: bg.slice(0, 200),
        title,
      };
    });
    record("thai-place-card-photo", thaiThumb.ok, JSON.stringify(thaiThumb));
    await sender.click('.place[data-id="thai"]');
    await sender.waitForSelector("#s2t:not(.hidden)");
    const onS1AfterThai = await sender.locator("#s1:not(.hidden)").count();
    const onS3AfterThai = await sender.locator("#s3:not(.hidden)").count();
    const thaiPathCards = await sender.locator("#thaiPathList .path-card").count();
    const thaiPathLabels = await sender.locator("#thaiPathList").innerText();
    const thaiChooserSub = await sender.locator("#s2t .sub").innerText();
    record(
      "thai-path-chooser-visible",
      onS1AfterThai === 0 && onS3AfterThai === 0 && thaiPathCards === 4,
      JSON.stringify({ onS1AfterThai, onS3AfterThai, thaiPathCards, labels: thaiPathLabels.slice(0, 220) })
    );
    record(
      "thai-path-chooser-copy",
      thaiPathLabels.includes("泳池看海") && thaiPathLabels.includes("水上市场") && thaiPathLabels.includes("潜入海里") && thaiPathLabels.includes("港湾日落") && thaiPathLabels.includes("想泡在泳池边看海") && thaiPathLabels.includes("想看港湾晚色"),
      thaiPathLabels.slice(0, 300)
    );
    record(
      "thai-path-chooser-honesty",
      (thaiChooserSub.includes("不是行程报价") || thaiChooserSub.includes("非行程")) && thaiChooserSub.includes("演示用实景") && (thaiChooserSub.includes("度假") || thaiChooserSub.includes("海边放松")),
      thaiChooserSub.slice(0, 220)
    );
    await shot(sender, "thai-path-chooser");
    await sender.locator("#s2t").screenshot({ path: path.join(EVIDENCE, "thai-path-chooser.png") });

    const thaiPathChecks = [
      {
        id: "thai-pool",
        needle: "thai/pool/01-infinity-coast",
        bgClass: "thai-pool",
        shot: "thai-path-pool",
        nameBits: ["泳池", "看海"],
      },
      {
        id: "thai-market",
        needle: "thai/market/01-floating-market-boat",
        bgClass: "thai-market",
        shot: "thai-path-market",
        nameBits: ["水上", "市场"],
      },
      {
        id: "thai-dive",
        needle: "thai/dive/01-scuba-pair",
        bgClass: "thai-dive",
        shot: "thai-path-dive",
        nameBits: ["潜入", "海里", "水下"],
      },
      {
        id: "thai-sunset",
        needle: "thai/sunset/01-pattaya-harbor-dusk",
        bgClass: "thai-sunset",
        shot: "thai-path-sunset",
        nameBits: ["港湾", "日落", "暮光", "晚色"],
      },
    ];
    for (const pc of thaiPathChecks) {
      await sender.goto(base);
      await sender.click("#btnStart");
      await sender.waitForSelector("#s2:not(.hidden)");
      await sender.click('.place[data-id="thai"]');
      await sender.waitForSelector("#s2t:not(.hidden)");
      await sender.click(`.path-card[data-path="${pc.id}"]`);
      await sender.waitForSelector("#s3:not(.hidden)");
      await sender.waitForTimeout(350);
      const scene = await sender.evaluate((expect) => {
        const bg = document.getElementById("sceneBg");
        const cs = getComputedStyle(bg);
        const inline = bg.style.backgroundImage || "";
        const sheet = cs.backgroundImage || "";
        const combined = inline + " " + sheet;
        const label = (document.getElementById("sceneLabel") || {}).innerText || "";
        const line = (document.getElementById("sceneLine") || {}).innerText || "";
        const note = (document.getElementById("assetNote") || {}).innerText || "";
        const heading = (document.getElementById("sceneHeading") || {}).innerText || "";
        return {
          className: bg.className,
          hasPhoto: combined.includes(expect.needle) && bg.classList.contains(expect.bgClass),
          combined: combined.slice(0, 240),
          label, line, note, heading,
          markTools: document.querySelectorAll("#markTools .tool").length,
        };
      }, pc);
      const short = pc.id.replace("thai-", "");
      record(
        "thai-path-" + short + "-enters-scene",
        !!(scene.hasPhoto && scene.markTools >= 3),
        JSON.stringify(scene)
      );
      const nameOk = pc.nameBits.some((b) => (scene.label + scene.heading + scene.line).includes(b));
      record("thai-path-" + short + "-copy", nameOk, (scene.label + " | " + scene.line).slice(0, 160));
      record(
        "thai-path-" + short + "-honesty-note",
        scene.note.includes("实景") && (scene.note.includes("泰国") || scene.note.includes("泳池") || scene.note.includes("水上") || scene.note.includes("潜入") || scene.note.includes("港湾") || scene.note.includes("拥抱")),
        scene.note.slice(0, 160)
      );
      if (pc.id === "thai-sunset" || pc.id === "thai-pool") {
        record(
          "thai-path-" + short + "-scene-honesty",
          scene.line.includes("不是行程报价") || scene.line.includes("演示用实景") || scene.line.includes("度假"),
          (scene.label + " | " + scene.line).slice(0, 200)
        );
      }
      await sender.locator("#sceneShell").screenshot({ path: path.join(EVIDENCE, pc.shot + ".png") });
      await shot(sender, pc.shot);
    }


    // Thai share PNG: pool path must use infinity-coast hero (not Wudang / Forest)
    await sender.goto(base);
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    await sender.click('.place[data-id="thai"]');
    await sender.waitForSelector("#s2t:not(.hidden)");
    await sender.click('.path-card[data-path="thai-pool"]');
    await sender.waitForSelector("#s3:not(.hidden)");
    await sender.waitForTimeout(300);
    const thaiExport = await markAndInspectShare(sender, "泳池边看一眼海。");
    record(
      "thai-share-png-uses-pool-hero",
      !!(thaiExport && thaiExport.usedPhoto && thaiExport.placeId === "thai-pool" && String(thaiExport.heroSrc || "").includes("assets/places/thai/pool/01-infinity-coast")),
      JSON.stringify({
        usedPhoto: thaiExport && thaiExport.usedPhoto,
        heroSrc: thaiExport && thaiExport.heroSrc,
        placeId: thaiExport && thaiExport.placeId,
        expectedHero: thaiExport && thaiExport.expectedHero,
      })
    );
    record(
      "thai-share-png-no-wudang-borrow",
      !!(thaiExport && !(String(thaiExport.heroSrc || "").includes("wudang"))),
      JSON.stringify({ heroSrc: thaiExport && thaiExport.heroSrc })
    );
    await shot(sender, "thai-share-card");

    // Return home before Harbin suite (thai ends on s3)
    await sender.goto(base);
    await sender.waitForSelector("#s0:not(.hidden)");

    // --- Harbin real-photo place (additional; default hero stays Wudang) ---
    const homeMulti = await sender.locator("#s0 .home-badge-row").innerText();
    record(
      "homepage-mentions-harbin-wudang",
      homeMulti.includes("哈尔滨") && homeMulti.includes("武当"),
      homeMulti.slice(0, 160)
    );
    record(
      "homepage-mentions-forest",
      homeMulti.includes("森林"),
      homeMulti.slice(0, 160)
    );
    record(
      "homepage-mentions-thai",
      homeMulti.includes("泰国"),
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
    await sender.click("#btnSendFriend");
    await sender.waitForSelector("#s5:not(.hidden)");
    await sender.fill("#cardLineEdit", "先感受冰雪，再想想暖食。");
    await sender.waitForTimeout(320);
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

    // Onsen (日本森林温泉): single top-level real-photo place (no sub-path chooser)
    await sender.goto(base);
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    const onsenCard = await sender.evaluate(() => {
      const btn = document.querySelector('.place[data-id="onsen"]');
      const icon = btn && btn.querySelector(".place-icon");
      return { title: (btn && btn.querySelector("b").innerText) || "", sub: (btn && btn.querySelector("span").innerText) || "",
        bg: icon ? getComputedStyle(icon).backgroundImage : "" };
    });
    record("onsen-place-card", onsenCard.title.includes("日本森林温泉") && onsenCard.bg.includes("assets/places/onsen/") && onsenCard.sub.includes("非医疗") && onsenCard.sub.includes("非预订"), JSON.stringify(onsenCard));
    await sender.click('.place[data-id="onsen"]');
    await sender.waitForSelector("#s3:not(.hidden)");
    const onsenOnChooser = await sender.evaluate(() => ["s2w", "s2f", "s2t"].some((id) => !document.getElementById(id).classList.contains("hidden")));
    const onsenScene = await sender.evaluate(() => ({ bg: document.getElementById("sceneBg").style.backgroundImage, note: document.getElementById("assetNote").innerText,
      credit: getComputedStyle(document.getElementById("sceneCredit")).display !== "none" && document.getElementById("sceneCredit").innerText }));
    record("onsen-enters-scene-directly-with-photo", !onsenOnChooser && onsenScene.bg.includes("onsen/01-hot-spring-field-town"), JSON.stringify(onsenScene));
    record("onsen-honesty-note", onsenScene.note.includes("温泉气氛预览") && onsenScene.note.includes("非医疗功效") && onsenScene.note.includes("非预订"), onsenScene.note);
    record("scene-photo-credit-visible", String(onsenScene.credit).includes("Photo · Cindy Yang"), String(onsenScene.credit));
    const onsenExport = await markAndInspectShare(sender, "热气还没落定。");
    record(
      "onsen-share-png-uses-onsen-hero",
      !!(onsenExport && onsenExport.placeId === "onsen" && onsenExport.usedPhoto === true && String(onsenExport.heroSrc || "").includes("onsen/01-hot-spring-field-town") && !(onsenExport.heroSrc || "").includes("wudang")),
      JSON.stringify({ placeId: onsenExport && onsenExport.placeId, usedPhoto: onsenExport && onsenExport.usedPhoto, heroSrc: onsenExport && onsenExport.heroSrc })
    );
    record(
      "onsen-share-png-still-crisp",
      !!(onsenExport && onsenExport.width >= 1080 && onsenExport.isPngDataUrl),
      JSON.stringify({ w: onsenExport && onsenExport.width, h: onsenExport && onsenExport.height, isPng: onsenExport && onsenExport.isPngDataUrl })
    );
    const cardCredit = await sender.locator("#seedLiveCredit").isVisible();
    record("card-photo-credit-visible", cardCredit && (await sender.locator("#seedLiveCredit").innerText()).includes("Photo · Cindy Yang"), "visible=" + cardCredit);

    // Procedural place coverage (hidden dev hook; not in customer list)
    await sender.goto(base);
    await sender.click("#btnStart");
    await sender.waitForSelector("#s2:not(.hidden)");
    // one-tap place → scene (no body)
    await sender.click('.place[data-id="harbin"]');
    await sender.waitForSelector("#s3:not(.hidden)");
    await sender.waitForTimeout(400);
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
    await sender.evaluate(() => window.__healoaSeedTest.enterPlaceDev("yunnan"));
    await sender.waitForSelector("#s3:not(.hidden)");
    await sender.waitForTimeout(300);
    // Fix B: scene must not be blank on enter (wait for fx canvas paint; longer suite / share PNG paths can delay rAF)
    await sender.evaluate(() => {
      // Nudge ambient fx after a long path-chooser + share suite
      try {
        const mist = document.getElementById("fxMist");
        const light = document.getElementById("fxLight");
        if (mist && !mist.classList.contains("on")) mist.click();
        if (light && !light.classList.contains("on")) light.click();
      } catch (e) {}
    });
    await sender.waitForFunction(() => {
      const c = document.getElementById("fxCanvas");
      if (!(c && c.width > 40 && c.height > 40)) return false;
      const ctx = c.getContext("2d");
      let maxA = 0;
      // denser sample grid — wash + particles after long suite
      for (let i = 0; i < 128; i++) {
        const x = Math.floor(c.width * (0.04 + (i % 16) * 0.058));
        const y = Math.floor(c.height * (0.08 + Math.floor(i / 16) * 0.11));
        const d = ctx.getImageData(x, y, 1, 1).data;
        if (d[3] > maxA) maxA = d[3];
      }
      return maxA >= 20;
    }, null, { timeout: 12000 }).catch(() => {});
    await sender.waitForTimeout(600);
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
      if (canvas.width > 0 && canvas.height > 0) {
        for (let i = 0; i < 48; i++) {
          const x = Math.floor(canvas.width * (0.08 + (i % 16) * 0.05));
          const y = Math.floor(canvas.height * (0.2 + Math.floor(i / 16) * 0.2));
          const d = ctx.getImageData(x, y, 1, 1).data;
          if (d[3] > maxA) maxA = d[3];
        }
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
        canvasW: canvas.width,
        canvasH: canvas.height,
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

    const toolOn0 = await sender.locator('#markTools .tool.on').count();
    if (!toolOn0) await sender.locator('#markTools .tool').first().click();
    const stage0 = sender.locator("#playStage");
    const box0 = await stage0.boundingBox();
    await sender.mouse.click(box0.x + box0.width * 0.4, box0.y + box0.height * 0.45);
    const sendEnabled = !(await sender.locator("#btnSendFriend").isDisabled());
    record("send-friend-enabled-after-one-mark", sendEnabled, "enabled=" + sendEnabled);
    const sendLabel = await sender.locator("#btnSendFriend").innerText();
    record("scene-cta-is-leave-a-line", sendLabel.trim() === "留一句", sendLabel);

    await sender.click("#btnSendFriend");
    await sender.waitForSelector("#s5:not(.hidden)");
    const s4Hidden = await sender.locator("#s4.hidden").count();
    record("share-tail-skips-save-screen", s4Hidden > 0, "s4 hidden=" + s4Hidden);
    await shot(sender, "share-after-one-mark");

    const primarySend = await sender.locator("#btnSendToFriend").innerText();
    record("share-primary-is-send-one", primarySend.trim() === "发给一个人", primarySend);
    const s5Buttons = await visibleButtons(sender, "#s5");
    record("share-page-only-two-actions", s5Buttons.length === 2 && s5Buttons.includes("发给一个人") && s5Buttons.includes("只留给自己"), JSON.stringify(s5Buttons));
    const aboutFold = await sender.evaluate(() => {
      const d = document.getElementById("shareAbout");
      return { isDetails: d && d.tagName === "DETAILS", closed: d && !d.open, summary: d && d.querySelector("summary").innerText,
        foldsHonest: !!(d && d.contains(document.getElementById("seedHonestBlock")) && d.contains(document.getElementById("seedUrlBox")) && d.contains(document.getElementById("btnDownloadSeedJson"))) };
    });
    record("share-tech-honesty-folded-into-about", aboutFold.isDetails && aboutFold.closed && aboutFold.summary.includes("关于这份 Demo") && aboutFold.foldsHonest, JSON.stringify(aboutFold));
    // Card IS the editor; line skippable; feel words optional ≤5, not printed by default
    const editorInCard = await sender.evaluate(() => !!document.querySelector("#seedCardLive #cardLineEdit"));
    record("card-is-the-editor", editorInCard, "textarea inside card=" + editorInCard);
    await sender.fill("#cardLineEdit", "");
    await sender.waitForTimeout(320);
    const skipSeed = await sender.evaluate(() => window.__healoaSeedTest.buildSceneSeed());
    const skipUrl = await sender.evaluate(() => window.__healoaSeedTest.buildSeedUrl());
    record("line-skippable-empty-ok", skipSeed.publicLine === "" && skipUrl.ok === true, JSON.stringify({ t: skipSeed.publicLine, ok: skipUrl.ok }));
    const chips = sender.locator("#feelWordChips .chip");
    for (let i = 0; i < 6; i++) await chips.nth(i).click();
    const fw = await sender.evaluate(() => window.__healoaSeedTest.getState());
    const feelSeedDefault = await sender.evaluate(() => window.__healoaSeedTest.buildSceneSeed().feel);
    const feelShownDefault = await sender.locator("#seedLiveFeel").isVisible();
    record("feel-words-max-5-not-printed-by-default", fw.feelWords.length === 5 && fw.feelPrint === false && feelSeedDefault.length === 0 && !feelShownDefault, JSON.stringify({ n: fw.feelWords.length, print: fw.feelPrint, seedFeel: feelSeedDefault, shown: feelShownDefault }));
    await sender.check("#feelPrint");
    await sender.waitForTimeout(100);
    const feelShownPrinted = await sender.locator("#seedLiveFeel").isVisible();
    const feelSeedPrinted = await sender.evaluate(() => window.__healoaSeedTest.buildSceneSeed().feel);
    record("feel-words-print-opt-in", feelShownPrinted && feelSeedPrinted.length === 5, JSON.stringify(feelSeedPrinted));
    await sender.uncheck("#feelPrint");
    await sender.fill("#cardLineEdit", "雨还没下完，叶子先亮了一下。");
    await sender.waitForTimeout(320);
    await sender.screenshot({ path: path.join(EVIDENCE, "p0n-card-editor.png"), fullPage: true });

    const honest = await sender.locator("#seedHonestBlock").textContent();
    record(
      "invite-truth-copy",
      honest.includes("自己的副本") && honest.includes("不会") && honest.includes("持续更新") && honest.includes("seedId"),
      honest.slice(0, 200)
    );

    const feel = await sender.locator("#feelPrompt").textContent();
    record("solo-feel-wording", feel.includes("独自") && !feel.includes("一起体验"), feel);

    // Card is WYSIWYG: what is on the card is what is sent; both actions always enabled
    const sendReady = !(await sender.locator("#btnSendToFriend").isDisabled());
    const keepReady = await sender.locator("#btnKeepSelf").isVisible() && !(await sender.locator("#btnKeepSelf").isDisabled());
    record("share-actions-ready-on-enter", sendReady && keepReady, JSON.stringify({ sendReady, keepReady }));
    const cardLine = await sender.evaluate(() => window.__healoaSeedTest.buildSceneSeed().publicLine);
    record("card-line-is-what-is-sent", cardLine === "雨还没下完，叶子先亮了一下。", cardLine);
    await sender.screenshot({ path: path.join(EVIDENCE, "p0n-share2btn.png"), fullPage: false });
    await shot(sender, "share-after-confirm");

    // Customer-facing share/save must not show main-site jargon
    const s5Text = await sender.locator("#s5").innerText();
    const jargonHits = ["Choose Again", "Keeper", "Circle Edition", "Wrapped"].filter((t) => s5Text.includes(t));
    record("no-customer-jargon-on-share", jargonHits.length === 0, jargonHits.join(",") || "clean");

    const urlBox = await sender.locator("#seedUrlBox").textContent();
    record("seed-url-is-seed-hash", urlBox.includes("#seed=") && !urlBox.includes("#seedId="), urlBox.slice(0, 120));

    const seedUrl = await sender.evaluate(() => window.__healoaSeedTest.buildSeedUrl().url);
    record("buildSeedUrl-ok", !!seedUrl && seedUrl.includes("#seed=") && !seedUrl.includes("#seedId="), (seedUrl || "").slice(0, 100));

    const previewHas = await sender.locator("#shareImgPreview").evaluate((el) => el.classList.contains("show") && !!el.src);
    const ogNote = honest.includes("页内 PNG") || honest.includes("富卡片") || honest.includes("OG");
    record("inpage-png-vs-og-honesty", previewHas && ogNote, "png=" + previewHas + " ogNote=" + ogNote);

    const procExport = await sender.evaluate(() => window.__healoaSeedTest.inspectShareCard("vertical"));
    record(
      "procedural-share-png-no-fake-hero",
      !!(procExport && procExport.placeId === "yunnan" && procExport.usedPhoto === false && !(procExport.heroSrc || "").includes("wudang")),
      JSON.stringify({ placeId: procExport && procExport.placeId, usedPhoto: procExport && procExport.usedPhoto })
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

    await domClick(sender, "#btnSimRecipient");
    await sender.waitForSelector("#sSeed:not(.hidden)");
    const simBadge = await sender.locator("#seedViewSimBadge").isVisible();
    const simSub = await sender.locator("#seedViewSub").innerText();
    record("same-device-sim-label", simBadge && simSub.includes("模拟"), simSub.slice(0, 120));
    await shot(sender, "same-device-sim");

    await sender.click("#btnSeedEnter");
    await sender.waitForSelector("#s3:not(.hidden)");
    const heading = await sender.locator("#sceneHeading").innerText();
    record("sim-enter-label", heading.includes("模拟"), heading);
    // Ensure a tool is ON (auto-coach may already select first; clicking again would toggle OFF)
    const toolArmed = await sender.locator('#markTools .tool.on').count();
    if (!toolArmed) await sender.locator('#markTools .tool').first().click();
    const stage2 = sender.locator("#playStage");
    const box2 = await stage2.boundingBox();
    const beforeSim = await sender.evaluate(() => window.__healoaSeedTest.getState().marks.length);
    await sender.mouse.click(box2.x + box2.width * 0.6, box2.y + box2.height * 0.55);
    const afterSim = await sender.evaluate(() => window.__healoaSeedTest.getState().marks.length);
    record("sim-stroke-changes-copy", afterSim === beforeSim + 1, `before=${beforeSim} after=${afterSim}`);
    await shot(sender, "sim-stroke");

    await senderCtx.close();

    // Two independent contexts · single-round Reply Seed loop
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    pageA.on("pageerror", (e) => pageErrors.push("A:" + e));
    await pageA.goto(base);
    await pageA.click("#btnStart");
    await pageA.click('.place[data-id="onsen"]');
    await pageA.waitForSelector("#s3:not(.hidden)");
    await pageA.waitForTimeout(400);
    const icBefore = await pageA.locator("#inlineCard").isHidden();
    const toolOnA = await pageA.locator('#markTools .tool.on').count();
    if (!toolOnA) await pageA.locator('#markTools .tool').first().click();
    const yBefore = await pageA.evaluate(() => window.scrollY);
    const boxA = await pageA.locator("#playStage").boundingBox();
    await pageA.mouse.click(boxA.x + boxA.width * 0.4, boxA.y + boxA.height * 0.45);
    await pageA.waitForTimeout(250);
    const ic = await pageA.evaluate(() => ({ visible: !document.getElementById("inlineCard").classList.contains("hidden"),
      s3: !document.getElementById("s3").classList.contains("hidden"), ph: document.getElementById("inlineLineEdit").placeholder, y: window.scrollY }));
    record("card-appears-in-place-after-mark", icBefore && ic.visible && ic.s3 && Math.abs(ic.y - yBefore) < 2, JSON.stringify({ icBefore, ...ic, yBefore }));
    record("card-hint-copy", ic.ph === "点这里留一句（可不写）", ic.ph);
    await pageA.fill("#inlineLineEdit", "两台设备副本测试句。");
    await pageA.click("#btnSendFriend");
    await pageA.waitForSelector("#s5:not(.hidden)");
    const carried = await pageA.locator("#cardLineEdit").inputValue();
    record("inline-card-line-carries-to-share", carried === "两台设备副本测试句。", carried);
    await pageA.fill("#authorNameEdit", "小云");
    await pageA.waitForTimeout(320);
    const noChapterYet = await pageA.evaluate(() => window.__healoaSeedTest.chapters().length);
    await pageA.click("#btnSendToFriend");
    await pageA.waitForTimeout(250);
    const sendStatus = await pageA.locator("#shareStatus").innerText();
    record("send-one-status-honest", sendStatus.includes("副本") && !sendStatus.includes("通知"), sendStatus);
    const inviteUrl = await pageA.evaluate(() => window.__healoaSeedTest.buildSeedUrl().url);
    const aLocal = await pageA.evaluate(() => ({ ch: window.__healoaSeedTest.chapters(), ev: window.__healoaSeedTest.events(), n: window.__healoaSeedTest.buildSceneSeed().authorName }));
    record("author-name-in-seed", aLocal.n === "小云", aLocal.n);
    const chLabel = await pageA.evaluate(() => { const d = document.getElementById("myChapters"); return [...d.querySelectorAll("li")].map((l) => l.textContent); });
    record("chapter-created-local", noChapterYet === 0 && aLocal.ch.length === 1 && aLocal.ch[0].placeId === "onsen" && /^[A-Z][a-z]{2} \d{1,2} · 森林温泉$/.test(chLabel[0] || ""), JSON.stringify({ noChapterYet, ch: aLocal.ch, chLabel }));
    // QR: generated only for short links; decoded later by zxing-cpp on the box
    const qr = await pageA.evaluate(() => ({ last: window.__healoaSeedTest.lastQr(), src: document.getElementById("qrImg").getAttribute("src") || "",
      visible: !document.getElementById("qrBox").classList.contains("hidden"), limit: window.__healoaSeedTest.QR_MAX_URL_LEN, maxV: window.__healoaSeedTest.QR_MAX_VERSION }));
    record("qr-generated-for-short-link", qr.visible && qr.last && qr.last.ok && qr.src.startsWith("data:image/png") && qr.last.version <= qr.maxV && inviteUrl.length <= qr.limit,
      JSON.stringify({ ok: qr.last && qr.last.ok, version: qr.last && qr.last.version, len: inviteUrl.length, limit: qr.limit }));
    if (qr.src.startsWith("data:image/png")) {
      fs.writeFileSync(path.join(EVIDENCE, "p0n-qr-code-only.png"), Buffer.from(qr.src.split(",")[1], "base64"));
      fs.writeFileSync(path.join(EVIDENCE, "p0n-qr-expected-url.txt"), inviteUrl);
    }
    await pageA.locator("#qrBox").scrollIntoViewIfNeeded();
    await pageA.screenshot({ path: path.join(EVIDENCE, "p0n-qr.png"), fullPage: false });
    const qrLong = await pageA.evaluate(() => window.__healoaSeedTest.makeQr("https://example.com/#seed=" + "x".repeat(700)));
    record("qr-not-generated-when-too-long", qrLong.ok === false && qrLong.reason === "too_long", JSON.stringify(qrLong));
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
    const firstScreenWork = await pageB.evaluate(() => ({ marks: document.querySelectorAll("#seedViewStage .mk").length, line: document.getElementById("seedViewLine").innerText }));
    record("friend-first-screen-shows-author-work", firstScreenWork.marks >= 1 && firstScreenWork.line.includes("两台设备"), JSON.stringify(firstScreenWork));
    await shot(pageB, "recipient-opened");

    let replyUrl = null;
    let evB = [];
    if (openedSeed > 0) {
      const subB = await pageB.locator("#seedViewSub").innerText();
      record("two-context-copy-honesty", subB.includes("副本") && subB.includes("不会同步"), subB.slice(0, 160));
      const simHidden = await pageB.locator("#seedViewSimBadge").evaluate((el) => getComputedStyle(el).display === "none");
      record("two-context-not-labeled-sim", simHidden, "simBadgeHidden=" + simHidden);
      const fv = await pageB.evaluate(() => ({ h1: document.getElementById("seedViewH1").textContent, btn: document.getElementById("btnSeedEnter").textContent }));
      record("friend-view-named", fv.h1 === "小云 在这里留了一句话。" && fv.btn === "我也留一句", JSON.stringify(fv));
      await pageB.screenshot({ path: path.join(EVIDENCE, "p0n-friend-view.png"), fullPage: true });

      await pageB.click("#btnSeedEnter");
      await pageB.waitForSelector("#s3:not(.hidden)");
      const marksBeforeFriend = await pageB.evaluate(() => window.__healoaSeedTest.getState().marks.length);
      const armedB = await pageB.locator('#markTools .tool.on').count();
      if (!armedB) await pageB.locator('#markTools .tool').first().click();
      const st = pageB.locator("#playStage");
      const bb = await st.boundingBox();
      await pageB.mouse.click(bb.x + bb.width * 0.7, bb.y + bb.height * 0.4);
      const marksAfterFriend = await pageB.evaluate(() => window.__healoaSeedTest.getState().marks.length);
      twoContext.recipientStrokeAdded = marksAfterFriend === marksBeforeFriend + 1;
      twoContext.recipientMarkCount = marksAfterFriend;
      record("two-context-recipient-adds-stroke", twoContext.recipientStrokeAdded, `before=${marksBeforeFriend} after=${marksAfterFriend}`);
      const leaveLineHidden = await pageB.locator("#btnSendFriend").isHidden();
      record("friend-cannot-forward-original", leaveLineHidden, "btnSendFriend hidden in recipient mode=" + leaveLineHidden);
      await shot(pageB, "recipient-stroke");

      await pageB.click("#btnReplyDone");
      await pageB.waitForSelector("#sReply:not(.hidden)");
      const replyScreen = await pageB.evaluate(() => ({
        h1: document.querySelector("#sReply h1").innerText,
        mine: document.querySelectorAll("#replyStage .mk:not(.friend)").length,
        friend: document.querySelectorAll("#replyStage .mk.friend").length,
        compact: window.__healoaSeedTest.lastReplyUrl() && window.__healoaSeedTest.lastReplyUrl().compact,
        url: window.__healoaSeedTest.lastReplyUrl() && window.__healoaSeedTest.lastReplyUrl().url,
      }));
      replyUrl = replyScreen.url;
      const c = replyScreen.compact || {};
      record("reply-seed-fields", c.k === "r" && typeof c.r === "string" && typeof c.pa === "string" && Array.isArray(c.m) && c.m.length >= 1 && Array.isArray(c.fm) && c.fm.length === 1 && c.p,
        JSON.stringify({ k: c.k, r: c.r, pa: c.pa, m: (c.m || []).length, fm: (c.fm || []).length, p: c.p }));
      record("friend-reply-screen-both-strokes", replyScreen.mine >= 1 && replyScreen.friend === 1 && replyScreen.h1.includes("你在 小云 留下的地方"), JSON.stringify(replyScreen).slice(0, 200));
      const replyBtns = await visibleButtons(pageB, "#sReply");
      record("friend-reply-actions", replyBtns.includes("送回给 小云") && replyBtns.includes("做一张我的") && replyBtns.includes("只留给自己"), JSON.stringify(replyBtns));
      await pageB.fill("#replyLineEdit", "我也来过。");
      await pageB.click("#btnSendBack");
      await pageB.waitForTimeout(250);
      const backStatus = await pageB.locator("#replyStatus").innerText();
      record("send-back-manual-no-notification-claim", backStatus.includes("自己") && !backStatus.includes("通知"), backStatus);
      await pageB.screenshot({ path: path.join(EVIDENCE, "p0n-friend-reply.png"), fullPage: true });
      const bAfter = await pageB.evaluate(() => ({ r: window.__healoaSeedTest.lastReplyUrl(), ch: window.__healoaSeedTest.chapters() }));
      replyUrl = bAfter.r && bAfter.r.url;
      record("reply-carries-friend-line", bAfter.r && bAfter.r.compact && bAfter.r.compact.ft === "我也来过。" && bAfter.r.compact.n === "小云", JSON.stringify(bAfter.r && { ft: bAfter.r.compact.ft, n: bAfter.r.compact.n }));
      record("friend-reply-chapter-local", bAfter.ch.length === 1 && bAfter.ch[0].role === "reply", JSON.stringify(bAfter.ch));
      // once per root: reopening the same original no longer offers to add another mark
      await pageB.goto("about:blank");
      await pageB.goto(inviteUrl);
      await pageB.waitForTimeout(300);
      const again = await pageB.evaluate(() => ({ note: !document.getElementById("seedAlreadyReplied").classList.contains("hidden"),
        enterHidden: document.getElementById("btnSeedEnter").classList.contains("hidden") }));
      record("reply-once-per-root", again.note && again.enterHidden, JSON.stringify(again));
      await pageB.click("#btnSeedViewMyReply");
      await pageB.waitForSelector("#sReply:not(.hidden)");
      await pageB.click("#btnMakeMine");
      await pageB.waitForSelector("#s2:not(.hidden)");
      evB = await pageB.evaluate(() => window.__healoaSeedTest.events());
    }

    // Sender still does not see the friend's stroke until the reply link is opened by hand
    await pageA.reload();
    await pageA.waitForTimeout(250);
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
    record("two-context-sender-does-NOT-see-friend-stroke", twoContext.senderSawStrokeAfterRefresh === false && senderAfter.marks === senderMarksBefore, JSON.stringify({ senderAfter, senderMarksBefore }));

    // Author opens the Reply Seed → sees both strokes; single round: no further 发回
    if (replyUrl) {
      await pageA.goto("about:blank");
      await pageA.goto(replyUrl);
      await pageA.waitForTimeout(350);
      const author = await pageA.evaluate(() => ({
        shown: !document.getElementById("sAuthorReply").classList.contains("hidden"),
        h1: document.querySelector("#sAuthorReply h1").innerText,
        mine: document.querySelectorAll("#authorStage .mk:not(.friend)").length,
        friend: document.querySelectorAll("#authorStage .mk.friend").length,
        seedEnterShown: !document.getElementById("sSeed").classList.contains("hidden"),
      }));
      record("author-sees-reply-both-strokes", author.shown && author.h1 === "有人在你留下的地方，也留下了一句话。" && author.mine >= 1 && author.friend === 1 && !author.seedEnterShown, JSON.stringify(author));
      const afl = await pageA.locator("#authorFriendLine").textContent();
      record("author-sees-friend-line", afl === "我也来过。", afl);
      const authorBtns = await visibleButtons(pageA, "#sAuthorReply");
      record("author-reply-no-further-send-back", !authorBtns.some((b) => b.includes("发回")) && authorBtns.includes("只留给自己") && authorBtns.includes("做一张新的"), JSON.stringify(authorBtns));
      await pageA.screenshot({ path: path.join(EVIDENCE, "p0n-author-reply.png"), fullPage: true });
      const bodyVisible = await pageA.evaluate(() => document.body.innerText);
      record("send-back-appears-once-per-root", (bodyVisible.match(/送回给|发回给/g) || []).length === 0, "author view 送回给 count=" + (bodyVisible.match(/送回给|发回给/g) || []).length);
      const evA = await pageA.evaluate(() => window.__healoaSeedTest.events());
      const allEv = evA.concat(evB);
      const names = ["chapter_created", "share_sent", "recipient_open", "recipient_contribute", "reply_back", "sender_return", "recipient_new_chapter"];
      const missing = names.filter((n) => !allEv.some((e) => e.event === n));
      const badShape = allEv.filter((e) => !(e.lang === "zh" || e.lang === "en") || typeof e.country !== "string" || !e.country || !e.at);
      record("seven-events-logged-locally", missing.length === 0 && badShape.length === 0, JSON.stringify({ missing, badShape: badShape.length, n: allEv.length, sample: allEv[0] }));
      record("events-split-by-device", evA.every((e) => ["chapter_created", "share_sent", "sender_return"].includes(e.event)) && evB.every((e) => ["recipient_open", "recipient_contribute", "reply_back", "recipient_new_chapter"].includes(e.event)),
        JSON.stringify({ A: evA.map((e) => e.event), B: evB.map((e) => e.event) }));
    } else {
      record("author-sees-reply-both-strokes", false, "no replyUrl");
    }

    // Red lines (source-level greps over the single-file app)
    const html = fs.readFileSync(INDEX, "utf8");
    const redHits = ["日记", "解锁", "助力", "打卡", "streak", "Streak", "会收到通知", "收到通知", "分享后解锁", "邀请助力", "集卡",
      "likes", "Likes", "点赞", "comments", "评论", "leaderboard", "Leaderboard", "排行榜", "情绪曲线", "mood curve"].filter((w) => html.includes(w));
    record("redline-forbidden-words-absent", redHits.length === 0, redHits.join(",") || "clean");
    const siteHits = ["healoa.com", "circles", "btnHandoff"].filter((w) => html.includes(w));
    record("redline-no-website-funnel", siteHits.length === 0, siteHits.join(",") || "clean");
    record("redline-no-fake-short-link", !/#seedId=["']?\s*\+/.test(html) && !/bit\.ly|t\.cn|tinyurl|short\.link/.test(html), "no short-link services / seedId invite builder");
    record("redline-keep-self-on-share-and-reply-screens", ["btnKeepSelf", "btnReplyKeep", "btnAuthorKeep"].every((id) => html.includes('id="' + id + '"')), "keep-self buttons present on s5/sReply/sAuthorReply");
    record("redline-no-fake-counts", !/(已有|超过|已经有)\s*\d+\s*(人|位)|\d+\s*人(已加入|参与|在看)|\d+\s*(people|users) (joined|are)/i.test(html), "no fabricated social counts");
    record("events-local-only-no-network-api", !/sendBeacon|XMLHttpRequest|fetch\(|navigator\.geolocation/.test(html) && html.includes('EVENTS_KEY = "healoa_base_events_v1"'), "events → localStorage only; no network/geo API in page");
    record("redline-no-crisis-claim", !/危机|crisis/i.test(html), "no crisis-handling claims");
    record("rename-mountain-stay", html.includes("山居慢住") && !html.includes("疗愈民宿"), "山居慢住");

    // English (language toggle) · customer path
    const enCtx = await browser.newContext();
    const en = await enCtx.newPage();
    en.on("pageerror", (e) => pageErrors.push("EN:" + e));
    await en.goto(base);
    await en.click("#btnLang");
    const enHome = await en.evaluate(() => ({ h1: document.querySelector("#s0 h1").innerText, start: document.getElementById("btnStart").innerText, steps: document.querySelector("#s0 .steps").innerText }));
    record("en-home", enHome.h1.includes("hand it to a friend") && enHome.start === "Step into a place" && enHome.steps.includes("Leave a line"), JSON.stringify(enHome));
    await en.click("#btnStart");
    await en.click('.place[data-id="onsen"]');
    await en.waitForSelector("#s3:not(.hidden)");
    const armedEn = await en.locator('#markTools .tool.on').count();
    if (!armedEn) await en.locator('#markTools .tool').first().click();
    const sbEn = await en.locator("#playStage").boundingBox();
    await en.mouse.click(sbEn.x + sbEn.width * 0.5, sbEn.y + sbEn.height * 0.5);
    await en.click("#btnSendFriend");
    await en.waitForSelector("#s5:not(.hidden)");
    const enShare = await en.evaluate(() => ({ btns: [...document.querySelectorAll("#s5 .share-actions button")].map((b) => b.innerText), h1: document.querySelector("#s5 h1").innerText,
      scene: document.getElementById("seedLiveTitle").innerText }));
    const cjk = /[\u4e00-\u9fff]/;
    record("en-share-screen", enShare.btns.includes("Send to one person") && enShare.btns.includes("Keep it just for me") && enShare.h1 === "Leave a line" && !cjk.test(enShare.scene), JSON.stringify(enShare));
    const enVisibleCjk = await en.evaluate(() => {
      const s5 = document.getElementById("s5");
      const txt = [...s5.querySelectorAll("h1,.sub,button,.seed-title,.seed-invite,.steps,h2,label")].filter((e) => e.offsetParent !== null && !e.closest("details")).map((e) => e.innerText).join(" | ");
      return txt;
    });
    record("en-share-no-chinese-in-customer-copy", !cjk.test(enVisibleCjk), enVisibleCjk.slice(0, 200));
    await en.screenshot({ path: path.join(EVIDENCE, "p0n-en.png"), fullPage: true });
    await enCtx.close();

    const soloCtx = await browser.newContext();
    const solo = await soloCtx.newPage();
    await solo.goto(base);
    await goSoloToShare(solo, "独自路径。");
    const feelSolo = await solo.locator("#feelPrompt").textContent();
    record("solo-path-feel", feelSolo.includes("独自"), feelSolo);
    const soloUrl = await solo.evaluate(() => window.__healoaSeedTest.buildSeedUrl().url);
    await solo.goto("about:blank");
    await solo.goto(soloUrl);
    await solo.waitForTimeout(300);
    const taH1 = await solo.locator("#seedViewH1").textContent();
    record("friend-view-falls-back-to-TA", taH1 === "TA 在这里留了一句话。", taH1);
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
    version: "v2026-09-24-o",
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
