/**
 * Privacy + wellness notice pages (queue 6) and strengthened checks for this week's features
 * (queue 7: first session, PWA hooks, lazy media, photo crops, English draft footer).
 * Run: node tests/privacy.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer, ROOT } from "./lib/server.mjs";
import { scanLocale, scanRendered, BANNED_ANYWHERE, VERSION, CJK_RE } from "./wording.mjs";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 400) : ""}`);
}
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const SITE_RE = /healoa\.com/i;
const D = "date=2026-09-26";

/* ---------- static: pages exist in HTML + wiring ---------- */
const html = read("index.html");
const app = read("app/app.js");
const css = read("app/app.css");
check("HTML: privacy + wellness views present", /data-view="privacy"/.test(html) && /data-view="wellness"/.test(html));
check("HTML: reachable from footer, About, and home",
  (html.match(/data-action="openPrivacy"/g) || []).length >= 3 &&
  (html.match(/data-action="openWellness"/g) || []).length >= 3 &&
  /foot-links/.test(html) && /about-links/.test(html) && /home-more/.test(html));
check("app.js: VIEWS + ACTIONS wire privacy / wellness",
  /"privacy"/.test(app) && /"wellness"/.test(app) && /openPrivacy:\s*function/.test(app) && /openWellness:\s*function/.test(app));
check("no healoa.com anywhere in privacy / wellness markup or strings",
  !SITE_RE.test(html) && !SITE_RE.test(read("app/i18n/zh.js")) && !SITE_RE.test(read("app/i18n/en.js")));
check("VERSION is v2026-10-05-g", VERSION === "v2026-10-05-g" && html.includes('content="v2026-10-05-g"') && html.includes(">v2026-10-05-g<"));

/* ---------- static: week features still locked ---------- */
check("first session: muted place clip with preload=none (lazy until Start)",
  /id="firstClip"/.test(html) && /preload="none"/.test(html) && /muted/.test(html) && !/id="firstClip"[^>]*\ssrc=/.test(html));
check("practice clip: preload=none (lazy)", /id="practiceClip"[^>]*preload="none"/.test(html));
check("lazy media: world3d dynamic import + qrcode on demand",
  /import\(new URL\("app\/world3d\.js/.test(app) && /__healoaEnsureQr/.test(html + app));
check("photo crops: care-card portrait 4:5 + object-fit cover",
  /\.care-card\s+\.photo\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5/.test(css) && /object-fit:\s*cover/.test(css));
check("PWA: manifest link + sw.js register relative",
  /rel="manifest" href="manifest\.webmanifest"/.test(html) && /serviceWorker\.register\("sw\.js"/.test(html));
check("en draft footer note key present (待母语审校)",
  /This English is a draft/.test(read("app/i18n/en.js")) && /"draft\.note":\s*""/.test(read("app/i18n/zh.js")));

/* locale copy: required claims, no banned words, no Cindy */
for (const [code, file] of [["zh", "app/i18n/zh.js"], ["en", "app/i18n/en.js"], ["ja", "app/i18n/ja.js"]]) {
  const src = read(file);
  const need = code === "zh"
    ? [/隐私说明/, /健康提示（非医疗）/, /只留在这台手机/, /不会上传/, /分享图/, /分享链接/, /网址/, /专业意见/, /疗愈/, /地方/, /氛围/, /感受/, /当场放松/]
    : code === "en"
      ? [/Privacy note/, /Wellness note \(not medical\)/, /stay[s]? on this phone/i, /never uploaded/i, /shared image/i, /share link/i, /URL parameter/i, /professional advice/i, /restorative/i, /place/, /atmosphere/, /feeling/, /moment of ease/i]
      : [/プライバシー/, /健康のヒント/, /この端末/, /アップロード/, /共有/, /専門家/, /癒し/, /場所/, /雰囲気/];
  const miss = need.filter((re) => !re.test(src));
  check(`${code}: privacy + wellness copy covers required claims`, miss.length === 0, miss.map(String));
  const hits = [...scanLocale(src, code), ...scanLocale(src.match(/"privacy\.[^"]+":\s*"([^"]*)"/g)?.join("\n") || "", code)];
  /* full-file scan already covered by static-checks; here scan just the privacy/wellness values */
  const vals = [...src.matchAll(/"(?:privacy|wellness)\.[^"]+":\s*"((?:\\.|[^"\\])*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
  const pageHits = vals.flatMap((v) => scanLocale(v, code));
  const cindy = vals.some((v) => /Cindy/i.test(v));
  check(`${code}: privacy/wellness strings — no banned words, no Cindy, no healoa.com`,
    pageHits.length === 0 && !cindy && !vals.some((v) => SITE_RE.test(v)), pageHits.slice(0, 4));
  if (code === "en") check("en privacy/wellness: no leftover CJK", !vals.some((v) => CJK_RE.test(v)));
}

let server, browser, base;
const pageErrors = [];
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

  for (const [lang, q] of [["zh", ""], ["en", "&lang=en"]]) {
    const { ctx, p } = await open(q, { lang: lang === "en" ? "en-US" : "zh-CN" });
    /* footer → privacy */
    await p.click('.foot-links [data-action="openPrivacy"]');
    await p.waitForSelector('#vPrivacy:not(.hidden)');
    const priv = await p.evaluate(() => {
      const v = document.getElementById("vPrivacy");
      const title = document.getElementById("privacyTitle").textContent.trim();
      const body = v.innerText;
      const links = [...v.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
      const taps = [...v.querySelectorAll("button, .text-link, a")].map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { t: el.textContent.trim().slice(0, 40), h: r.height, fs: parseFloat(cs.fontSize) };
      });
      const texts = [...v.querySelectorAll("h1, p")].map((el) => ({ t: el.textContent.trim().slice(0, 60), fs: parseFloat(getComputedStyle(el).fontSize) }));
      return { title, body, links, taps, texts, view: window.__healoa.state.view };
    });
    const titleOk = lang === "zh" ? priv.title === "隐私说明" : /Privacy note/i.test(priv.title);
    const claims = lang === "zh"
      ? [/这台手机/, /不会上传|不上传/, /分享图|分享链接/, /身体/]
      : [/this phone/i, /never uploaded/i, /shared image|share link/i, /body|feeling/i];
    check(`${lang}: footer opens Privacy; title + on-device / no-upload / no-body-in-share claims`,
      priv.view === "privacy" && titleOk && claims.every((re) => re.test(priv.body)), { title: priv.title, body: priv.body.slice(0, 200) });
    check(`${lang}: privacy page — taps ≥52px, text ≥17px, no healoa.com, no Cindy`,
      priv.taps.every((x) => x.h >= 52) && priv.texts.every((x) => !x.t || x.fs >= 17) &&
      !priv.links.some((h) => SITE_RE.test(h || "")) && !/Cindy/i.test(priv.body),
      { taps: priv.taps.filter((x) => x.h < 52), small: priv.texts.filter((x) => x.t && x.fs < 17) });

    /* cross-link to wellness */
    await p.click('#vPrivacy [data-action="openWellness"]');
    await p.waitForSelector('#vWellness:not(.hidden)');
    const well = await p.evaluate(() => {
      const v = document.getElementById("vWellness");
      return { title: document.getElementById("wellnessTitle").textContent.trim(), body: v.innerText, view: window.__healoa.state.view,
        fs: [...v.querySelectorAll("h1, p")].map((el) => parseFloat(getComputedStyle(el).fontSize)) };
    });
    const wTitle = lang === "zh" ? well.title === "健康提示（非医疗）" : /Wellness note \(not medical\)/i.test(well.title);
    const wClaims = lang === "zh"
      ? [/专业意见/, /疗愈/, /地方/, /氛围|感受/, /当场放松|不舒服就停下/]
      : [/professional advice/i, /restorative/i, /place/, /atmosphere|feeling/, /moment of ease|Stop if/i];
    check(`${lang}: wellness page from privacy; gentle non-medical claims; 疗愈/restorative = place/feeling only`,
      well.view === "wellness" && wTitle && wClaims.every((re) => re.test(well.body)) && well.fs.every((n) => n >= 17),
      { title: well.title, body: well.body.slice(0, 220) });
    const hits = scanRendered(well.body + "\n" + priv.body, lang);
    check(`${lang}: privacy+wellness rendered scan — 0 banned hits`, hits.length === 0, hits.slice(0, 4));

    /* About → privacy */
    await p.evaluate(() => window.__healoa.go("home", null, true));
    await p.evaluate(() => { document.getElementById("about").open = true; });
    await p.click('.about-links [data-action="openPrivacy"]');
    await p.waitForSelector('#vPrivacy:not(.hidden)');
    check(`${lang}: About link opens Privacy`, await p.evaluate(() => window.__healoa.state.view === "privacy"));

    /* home button */
    await p.evaluate(() => window.__healoa.go("home", null, true));
    await p.click('.home-more [data-action="openWellness"]');
    await p.waitForSelector('#vWellness:not(.hidden)');
    check(`${lang}: home-more opens Wellness`, await p.evaluate(() => window.__healoa.state.view === "wellness"));

    if (lang === "en") {
      const note = await p.evaluate(() => {
        const el = document.getElementById("draftNote");
        return { shown: el && !el.classList.contains("hidden"), text: el && el.textContent, px: el && parseFloat(getComputedStyle(el).fontSize) };
      });
      check("en: draft footer note still visible on wellness (≥17px, 待母语审校)",
        note.shown && /draft/i.test(note.text) && /native speaker/i.test(note.text) && note.px >= 17, note);
    }
    await ctx.close();
  }

  /* desktop reachability too */
  {
    const { ctx, p } = await open("", { vp: { width: 1280, height: 800 } });
    await p.click('.foot-links [data-action="openPrivacy"]');
    await p.waitForSelector('#vPrivacy:not(.hidden)');
    check("desktop 1280: footer opens Privacy", await p.evaluate(() => window.__healoa.state.view === "privacy" && document.getElementById("privacyTitle").offsetHeight > 0));
    await ctx.close();
  }

  /* first-session lazy: no network video until Start (week feature) */
  {
    const { ctx, p } = await open("", { lang: "zh-CN" });
    await p.evaluate(() => { localStorage.removeItem("healoa.first.v1"); });
    await p.reload();
    await p.waitForFunction(() => window.__healoa && window.__healoa.state && window.__healoa.state.view === "first");
    const before = await p.evaluate(() => {
      const v = document.getElementById("firstClip");
      return { src: v.getAttribute("src") || v.currentSrc || "", preload: v.getAttribute("preload") };
    });
    check("first session ready: video has no src yet (lazy)", !before.src && before.preload === "none", before);
    await ctx.close();
  }
} finally {
  try { await browser?.close(); } catch (e) {}
  try { server?.close(); } catch (e) {}
}

check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 3));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.error("FAILED:\n" + failed.map((f) => " - " + f.name).join("\n")); process.exit(1); }
