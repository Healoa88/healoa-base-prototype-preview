/**
 * Merged-plan tests (v2026-09-27-u, Playwright, 390×844):
 *  - 「留一句」 after the card only (never before it on the main path), local only, shown on the user's own card;
 *  - 「发给一个人」: native share sheet first (PNG file when supported) + every per-platform button works
 *    (zh 微信 / 小红书 / 微博 / 抖音 / copy + QR; en Text / Instagram Story / Facebook / WhatsApp / X / copy, no QR;
 *    ja LINE / X / copy, no QR), 9:16 story PNG 1080×1920 in every locale, Latin text wraps by word;
 *  - recipient view: the sender's line, 「在旁边也写一句」 once (local + URL only), 「给自己也做一张」, reply view;
 *  - body / feeling info never in any shared card or link; no rewards / points / streaks;
 *  - en / ja drafts: exact key copy, option → body-state mapping, locale-aware banned-word scan of every screen.
 * Run: node tests/merged-plan.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { startServer } from "./lib/server.mjs";
import { CONDITION_IDS, CONDITION_LABELS, scanRendered, CJK_RE } from "./wording.mjs";

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 300) : ""}`);
}
const D = "date=2026-09-26";
const B64 = (t) => Buffer.from(t, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unB64 = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const EN_LABELS = { bp: "Steady and calm", sleep: "Deep rest", cold: "Warmth", gut: "Easy on the stomach", tense: "Let go of tension", quiet: "Quiet" };
const JA_LABELS = { bp: "おだやかに落ち着きたい", sleep: "ぐっすり休みたい", cold: "ぬくもりがほしい", gut: "おなかにやさしく", tense: "こわばりをほどきたい", quiet: "静かに過ごしたい" };
const ALL_LABELS = [...CONDITION_LABELS, ...Object.values(EN_LABELS), ...Object.values(JA_LABELS)];
const INCENTIVE = /奖励|积分|解锁|邀请|连续|打卡|排行|\breward|\bpoints?\b|\bstreak|\bunlock|\binvite|ポイント|特典|連続/i;

const pageErrors = [];
let server, browser, base;
try {
  ({ server, base } = await startServer());
  browser = await chromium.launch();
  const origin = new URL(base).origin;

  async function open(url, { init, lang = "zh-CN" } = {}) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: lang });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>ok" }));
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    p.on("pageerror", (e) => pageErrors.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error") pageErrors.push(m.text()); });
    await p.goto(url);
    return { ctx, p };
  }
  const text = (p) => p.evaluate(() => document.body.innerText);
  const toCard = async (p, cond = "gut") => { await p.click(`#homeConds [data-cond="${cond}"]`); await p.click('#resultBody [data-action="openCard"]'); };
  const openShare = async (p) => { await p.click("#btnOpenShare"); await p.waitForFunction(() => document.getElementById("shareImg").src.startsWith("data:")); };
  const imgDims = (p, sel) => p.evaluate((sel) => new Promise((res) => { const im = new Image(); im.onload = () => res([im.naturalWidth, im.naturalHeight]); im.onerror = () => res(null); im.src = document.querySelector(sel).src; }), sel);
  const clip = (p) => p.evaluate(() => navigator.clipboard.readText());
  const local = (u) => base + u.replace(/^https?:\/\/[^/]+\/healoa-base-prototype-preview\//, "");

  // ---------- 1. 留一句 is never before the card on the main path ----------
  {
    const { ctx, p } = await open(base + "?" + D);
    const seen = [];
    const probe = async (where) => { const t = await text(p); if (t.includes("留一句") || (await p.isVisible("#lineZone"))) seen.push(where); };
    await probe("home");
    await p.click('#homeConds [data-cond="sleep"]'); await probe("result");
    await p.click('#resultBody [data-action="openPlace"] >> nth=0'); await probe("place");
    await p.click('#vPlace [data-action="back"]');
    await p.click('#resultBody [data-action="openPractice"] >> nth=0'); await probe("practice");
    await p.click('#vPractice [data-action="back"]');
    await p.click('#resultBody [data-action="openCard"]');
    const onCard = await p.isVisible("#btnOpenLine") && (await p.textContent("#btnOpenLine")) === "留一句";
    const order = await p.evaluate(() => { const a = document.getElementById("cardPreview"), b = document.getElementById("lineZone"), c = document.getElementById("btnOpenShare"); return !!(a.compareDocumentPosition(b) & 4) && !!(b.compareDocumentPosition(c) & 4); });
    check("「留一句」 appears only after the season card (not on home / result / place / practice); order: card → 留一句 → 发给一个人", seen.length === 0 && onCard && order, { seen, onCard, order });
    check("share entry reads 「发给一个人…」 and stays a secondary text link", (await p.textContent("#btnOpenShare")).startsWith("发给一个人") && (await p.getAttribute("#btnOpenShare", "class")).includes("text-link"));
    await ctx.close();
  }

  // ---------- 2. 留一句: local only, on the user's own card, travels only when it names no body state ----------
  {
    const { ctx, p } = await open(base + "?" + D);
    await p.evaluate(() => localStorage.clear()); await p.reload();
    await toCard(p, "bp");
    await p.click("#btnOpenLine");
    await p.click('[data-action="saveLine"]');
    const emptyNote = await p.textContent("#lineNote");
    const LINE = "这个秋天，慢一点。";
    await p.fill("#lineInput", LINE);
    await p.click('[data-action="saveLine"]');
    const cardLine = await p.textContent("#cardLine");
    const stored = await p.evaluate(() => JSON.parse(localStorage.getItem("healoa.line.v1")));
    check("留一句: empty → gentle note; saved line shows on the user's own card and is stored only on this phone (not in the page URL)",
      emptyNote.includes("先写一句") && cardLine === "“" + LINE + "”" && stored && stored.text === LINE && !p.url().includes("l=") && (await p.textContent("#btnOpenLine")) === "改这一句", { emptyNote, cardLine, url: p.url() });
    await p.click('[data-action="savePng"]');
    await p.waitForFunction(() => document.getElementById("modalImg").src.startsWith("data:"));
    const wr = await p.evaluate(() => window.__healoa.lastWrap().map((w) => w.text));
    check("留一句 is drawn on the user's own card image", wr.some((t) => t.includes(LINE)));
    await p.click('[data-action="closeModal"]');
    await openShare(p);
    const sh = await p.evaluate(() => ({ share: window.__healoa.buildShare(), drawn: window.__healoa.lastShareCardText() }));
    const u = new URL(sh.share.url);
    check("发给一个人: the share link carries only a random id + the user's own line (base64url); the share card shows the line",
      JSON.stringify([...u.searchParams.keys()]) === '["s","l"]' && /^[a-z0-9]{6}$/.test(u.searchParams.get("s")) && unB64(u.searchParams.get("l")) === LINE && sh.drawn.some((t) => t.includes(LINE)), sh.share.url);
    const blob = JSON.stringify(sh) + decodeURIComponent(sh.share.url);
    check("share card + link contain no body-state / feeling words", !ALL_LABELS.some((l) => blob.includes(l)) && !/血压|睡|肠胃|绷/.test(blob));
    // a line that names a body state stays private
    await p.click("#btnOpenLine");
    await p.fill("#lineInput", "最近睡不踏实，慢慢来");
    await p.click('[data-action="saveLine"]');
    const note2 = await p.textContent("#lineNote");
    const sh2 = await p.evaluate(() => ({ share: window.__healoa.buildShare(), drawn: window.__healoa.lastShareCardText() }));
    const u2 = new URL(sh2.share.url);
    check("a line that mentions a body state stays on the user's own card only (not in the link or the share image)",
      note2.includes("不会带上") && JSON.stringify([...u2.searchParams.keys()]) === '["s"]' && !sh2.drawn.some((t) => t.includes("睡不踏实")) && (await p.textContent("#cardLine")).includes("睡不踏实"), { note2, url: sh2.share.url });
    await p.click("#btnOpenLine"); await p.click("#btnClearLine");
    check("「删掉这一句」 removes the line from the card and the phone", (await p.$$("#cardLine")).length === 0 && (await p.evaluate(() => localStorage.getItem("healoa.line.v1"))) === null);
    await ctx.close();
  }

  // ---------- 3. recipient view: line, write one beside it (once), make your own, reply view ----------
  {
    const LINE = "这个秋天，慢一点。", MINE = "我也想慢一点。";
    const url = base + "?s=abc234&l=" + B64(LINE) + "&" + D;
    const { ctx, p } = await open(url);
    await p.evaluate(() => localStorage.clear()); await p.reload();
    const v = await p.textContent("#sharedLine");
    const beforeGrid = await p.evaluate(() => !!(document.getElementById("sharedLine").compareDocumentPosition(document.getElementById("sharedConds")) & 4));
    check("recipient view shows the sender's line with 「在旁边也写一句」 and 「给自己也做一张」, above the six buttons", v.includes(LINE) && v.includes("在旁边也写一句") && v.includes("给自己也做一张") && beforeGrid, v);
    await p.click('[data-action="replyOpen"]');
    await p.fill("#replyInput", "我也睡不踏实");
    await p.click('[data-action="replySave"]');
    check("a reply naming a body state is not accepted", (await p.textContent("#replyNote")).includes("身体情况") && (await p.$$("#replyInput")).length === 1);
    await p.fill("#replyInput", MINE);
    await p.click('[data-action="replySave"]');
    const link = await p.textContent("#replyLink");
    const ru = new URL(link);
    check("在旁边也写一句: reply saved; the link to send back carries only id + both lines (no backend call)",
      JSON.stringify([...ru.searchParams.keys()]) === '["s","l","r"]' && unB64(ru.searchParams.get("r")) === MINE && unB64(ru.searchParams.get("l")) === LINE && (await p.$$('[data-action="replyOpen"]')).length === 0, link);
    await p.click('[data-action="replyCopy"]');
    check("reply link: copy works", (await clip(p)) === link);
    await p.goto(url);
    check("one-time: reopening the same link shows 「你已经在旁边写过一句了」 and no second reply button", (await p.textContent("#sharedLine")).includes("已经在旁边写过") && (await p.$$('[data-action="replyOpen"]')).length === 0);
    await p.click('[data-action="makeOwn"]');
    const pulse = await p.evaluate(() => document.getElementById("sharedConds").classList.contains("pulse"));
    await p.click('#sharedConds [data-cond="quiet"]');
    check("给自己也做一张 → points to the six buttons → one tap gives the recipient's own result; sender's line/ids leave the URL",
      pulse && (await p.isVisible("#vResult")) && !/[?&](s|l|r)=/.test(p.url()), p.url());
    await p.goto(local(link));
    const rv = await p.textContent("#sharedLine");
    check("reply view (sender opens the returned link): 「对方在你的旁边也写了一句」 with both lines; no further replies",
      rv.includes("对方在你的旁边也写了一句") && rv.includes(LINE) && rv.includes(MINE) && (await p.$$('[data-action="replyOpen"]')).length === 0, rv);
    await p.goto(base + "?s=abc234&l=%%%bad&" + D);
    check("a malformed line parameter is ignored (plain recipient view)", (await p.isHidden("#sharedLine")) && (await p.isVisible("#vShared")));
    await ctx.close();
  }

  // ---------- 4. per-platform share buttons: every one works ----------
  async function platformRun(lang, uiLang) {
    const q = lang ? "&lang=" + lang : "";
    const { ctx, p } = await open(base + "?" + D + q, {
      lang: uiLang,
      init: () => { window.__shared = []; Object.defineProperty(navigator, "share", { configurable: true, value: (d) => { window.__shared.push({ title: d.title, text: d.text, url: d.url, files: (d.files || []).map((f) => [f.name, f.type, f.size]) }); return Promise.resolve(); } }); Object.defineProperty(navigator, "canShare", { configurable: true, value: (d) => !!d }); }
    });
    await p.evaluate(() => localStorage.clear()); await p.reload();
    await toCard(p, "cold");
    await openShare(p);
    const share = await p.evaluate(() => window.__healoa.buildShare());
    const out = { share, lang, targets: {} };
    out.panel = await p.evaluate(() => ({ ids: [...document.querySelectorAll("#shareTargets [data-target]")].map((e) => e.dataset.target), qrHidden: document.getElementById("shareQr").classList.contains("hidden"), qrSvg: !!document.querySelector("#shareQr svg"), text: document.getElementById("sharePanel").innerText }));
    out.drawn = await p.evaluate(() => window.__healoa.lastShareCardText());
    // native share sheet first
    await p.click('[data-action="shareSend"]');
    await p.waitForFunction(() => window.__shared.length > 0);
    out.native = await p.evaluate(() => window.__shared[0]);
    for (const id of out.panel.ids) {
      const el = `#shareTargets [data-target="${id}"]`;
      const href = await p.getAttribute(el, "href");
      const tgt = await p.getAttribute(el, "target");
      const rec = { href };
      await p.evaluate(() => { document.getElementById("shareNote").classList.add("hidden"); document.getElementById("imgModal").classList.add("hidden"); });
      if (href && href.startsWith("https://")) {
        const [pop] = await Promise.all([ctx.waitForEvent("page"), p.click(el)]);
        await pop.waitForLoadState("domcontentloaded").catch(() => {});
        rec.opened = pop.url(); rec.newTab = tgt === "_blank";
        await pop.close();
      } else if (href && href.startsWith("sms:")) {
        await p.evaluate((el) => document.querySelector(el).addEventListener("click", (e) => e.preventDefault(), { once: true }), el); // do not launch an OS handler in CI
        await p.click(el);
      } else {
        await p.evaluate(() => navigator.clipboard.writeText("-"));
        await p.click(el);
        await p.waitForTimeout(300);
        if (await p.isVisible("#imgModal")) {
          rec.modal = { dims: await imgDims(p, "#modalImg"), guide: await p.textContent("#modalGuide"), download: (await p.getAttribute("#modalDownload", "href")).startsWith("data:image/png"), name: await p.getAttribute("#modalDownload", "download"), shareBtn: await p.isVisible("#modalShare") };
          if (rec.modal.shareBtn) { const n0 = await p.evaluate(() => window.__shared.length); await p.click("#modalShare"); rec.modal.shared = (await p.evaluate(() => window.__shared.slice(-1)[0])); rec.modal.sharedOk = (await p.evaluate(() => window.__shared.length)) === n0 + 1; }
        }
        rec.clip = await clip(p);
      }
      rec.note = (await p.isVisible("#shareNote")) ? await p.textContent("#shareNote") : "";
      out.targets[id] = rec;
    }
    // 9:16 story button
    await p.evaluate(() => document.getElementById("imgModal").classList.add("hidden"));
    await p.click('[data-action="shareSaveStory"]');
    await p.waitForFunction(() => !document.getElementById("imgModal").classList.contains("hidden"));
    out.story = { dims: await imgDims(p, "#modalImg"), text: await p.evaluate(() => window.__healoa.lastStoryText()), name: await p.getAttribute("#modalDownload", "download") };
    out.wrap = await p.evaluate(() => window.__healoa.lastWrap());
    out.rendered = await text(p);
    out.lang2 = await p.evaluate(() => window.__healoa.lang);
    await ctx.close();
    return out;
  }
  const enc = encodeURIComponent;
  const zh = await platformRun("", "zh-CN");
  const zhT = zh.targets;
  check("zh share panel: native share first, then 微信 / 小红书 / 微博 / 抖音 / 复制链接; QR shown (zh keeps QR)",
    JSON.stringify(zh.panel.ids) === '["wechat","xiaohongshu","weibo","douyin","copy"]' && !zh.panel.qrHidden && zh.panel.qrSvg && zh.drawn.includes("扫一扫，点一下你自己的情况") && ["微信", "小红书", "微博", "抖音", "复制链接"].every((w) => zh.panel.text.includes(w)), zh.panel);
  check("native share sheet: navigator.share with the PNG file + text + link (no body data)", zh.native.files.length === 1 && zh.native.files[0][1] === "image/png" && zh.native.files[0][2] > 10000 && zh.native.url === zh.share.url && !ALL_LABELS.some((l) => JSON.stringify(zh.native).includes(l)), zh.native);
  check("微信: saves the 4:5 card image (1080×1350) + copies the link + WeChat how-to", JSON.stringify(zhT.wechat.modal && zhT.wechat.modal.dims) === "[1080,1350]" && zhT.wechat.modal.download && zhT.wechat.clip === zh.share.url && zhT.wechat.modal.guide.includes("微信") && zhT.wechat.modal.guide.includes("链接也复制好了"), zhT.wechat);
  check("小红书: saves the card image + 小红书 how-to", JSON.stringify(zhT.xiaohongshu.modal && zhT.xiaohongshu.modal.dims) === "[1080,1350]" && zhT.xiaohongshu.modal.guide.includes("小红书"), zhT.xiaohongshu);
  check("微博: web share intent opens in a new tab with the link + text", zhT.weibo.newTab && zhT.weibo.opened === `https://service.weibo.com/share/share.php?url=${enc(zh.share.url)}&title=${enc(zh.share.text)}` && zhT.weibo.note.includes("微博"), zhT.weibo);
  check("抖音: saves the 9:16 image (1080×1920) + 抖音 how-to", JSON.stringify(zhT.douyin.modal && zhT.douyin.modal.dims) === "[1080,1920]" && zhT.douyin.modal.guide.includes("抖音"), zhT.douyin);
  check("复制链接 copies the share link", zhT.copy.clip === zh.share.url && zhT.copy.note === "链接已复制。", zhT.copy);
  check("image dialog offers 「发送这张图」 (native file share) when the device supports it", zhT.xiaohongshu.modal.shareBtn && zhT.xiaohongshu.modal.sharedOk && zhT.xiaohongshu.modal.shared.files.length === 1);
  check("zh 9:16 story image: 1080×1920 PNG (with QR in zh)", JSON.stringify(zh.story.dims) === "[1080,1920]" && zh.story.text.includes("扫一扫，点一下你自己的情况") && zh.story.name.endsWith(".png"));

  const en = await platformRun("en", "en-US");
  const enT = en.targets;
  const enU = new URL(en.share.url);
  check("en share panel: native share first, then Text/iMessage, Instagram Story, Facebook, WhatsApp, X, Copy link; NO QR (panel, card, story)",
    JSON.stringify(en.panel.ids) === '["sms","instagram","facebook","whatsapp","x","copy"]' && en.panel.qrHidden && !en.panel.qrSvg && !en.drawn.some((t) => /scan/i.test(t)) && !en.story.text.some((t) => /scan/i.test(t)) && ["Text / iMessage", "Instagram Story", "Facebook", "WhatsApp", "X", "Copy link"].every((w) => en.panel.text.includes(w)), en.panel);
  check("en share lead: “Send it to someone you'd like to share this moment with.”", en.panel.text.includes("Send it to someone you'd like to share this moment with."));
  check("en link: random id + ?lang=en only (draft recipients see the same draft)", JSON.stringify([...enU.searchParams.keys()]) === '["s","lang"]' && enU.searchParams.get("lang") === "en", en.share.url);
  check("Text / iMessage: sms: link with the text + link in the body", enT.sms.href === `sms:?&body=${enc(en.share.text + " " + en.share.url)}` && enT.sms.note.includes("Messages"), enT.sms);
  check("Instagram Story: exports the 9:16 PNG (1080×1920) + Story how-to", JSON.stringify(enT.instagram.modal && enT.instagram.modal.dims) === "[1080,1920]" && /Story/.test(enT.instagram.modal.guide) && enT.instagram.modal.name.endsWith(".png"), enT.instagram);
  check("Facebook: sharer URL opens in a new tab", enT.facebook.newTab && enT.facebook.opened === `https://www.facebook.com/sharer/sharer.php?u=${enc(en.share.url)}`, enT.facebook);
  check("WhatsApp: wa.me with text + link", enT.whatsapp.newTab && enT.whatsapp.opened === `https://wa.me/?text=${enc(en.share.text + " " + en.share.url)}`, enT.whatsapp);
  check("X: intent with text + link", enT.x.newTab && enT.x.opened === `https://x.com/intent/post?text=${enc(en.share.text)}&url=${enc(en.share.url)}`, enT.x);
  check("en Copy link copies the link", enT.copy.clip === en.share.url && enT.copy.note === "Link copied.", enT.copy);
  check("en 9:16 story image: 1080×1920", JSON.stringify(en.story.dims) === "[1080,1920]");
  // Latin word wrap on every canvas text drawn in the en run (share card, story); long links are the only char-split tokens.
  const badWrap = en.wrap.filter((w) => /[A-Za-z]{2,} [A-Za-z]/.test(w.text) && !/\/\?s=/.test(w.text)).filter((w) => w.lines.join(" ") !== w.text.replace(/\s+/g, " ").trim());
  const multi = en.wrap.filter((w) => w.lines.length > 1 && !/\/\?s=/.test(w.text)).length;
  check(`en card / story text wraps by word (${en.wrap.length} texts drawn, ${multi} multi-line; no word split)`, badWrap.length === 0 && multi >= 2, badWrap.slice(0, 3));

  const ja = await platformRun("ja", "ja-JP");
  const jaT = ja.targets;
  check("ja share panel: native share first, then LINE, X, リンクをコピー; no QR", JSON.stringify(ja.panel.ids) === '["line","x","copy"]' && ja.panel.qrHidden && !ja.panel.qrSvg && ja.panel.text.includes("LINE"), ja.panel);
  check("LINE: social-plugins share URL opens in a new tab", jaT.line.newTab && jaT.line.opened === `https://social-plugins.line.me/lineit/share?url=${enc(ja.share.url)}&text=${enc(ja.share.text)}`, jaT.line);
  check("ja X + copy work", jaT.x.opened === `https://x.com/intent/post?text=${enc(ja.share.text)}&url=${enc(ja.share.url)}` && jaT.copy.clip === ja.share.url, { x: jaT.x.opened, copy: jaT.copy.clip });
  check("ja 9:16 story image: 1080×1920", JSON.stringify(ja.story.dims) === "[1080,1920]");
  check("no rewards / points / streak / invite wording in any share flow (zh / en / ja)", ![zh, en, ja].some((r) => INCENTIVE.test(r.rendered + r.drawn.join("|") + r.story.text.join("|"))), [zh, en, ja].map((r) => (r.rendered.match(INCENTIVE) || [])[0]));

  // ---------- 5. word-wrap unit checks ----------
  {
    const { ctx, p } = await open(base + "?" + D + "&lang=en", { lang: "en-US" });
    const s = "Send it to someone you'd like to share this moment with.";
    const lines = await p.evaluate((s) => window.__healoa.wrapLines(s, 300, "40px sans-serif"), s);
    const zhLines = await p.evaluate(() => window.__healoa.wrapLines("点一下你的情况，马上告诉你这个季节怎么吃、怎么动、去哪里养。", 300, "40px sans-serif"));
    check("wrapLines: Latin breaks only at spaces; CJK still breaks between characters; closing punctuation never starts a line",
      lines.length > 1 && lines.join(" ") === s && zhLines.length > 1 && zhLines.join("") === "点一下你的情况，马上告诉你这个季节怎么吃、怎么动、去哪里养。" && !zhLines.some((l) => /^[，。、]/.test(l)), { lines, zhLines });
    await ctx.close();
  }

  // ---------- 6. en / ja drafts: key copy, mapping, every screen scanned with that locale's banned words ----------
  async function draftSweep(lang, uiLang, labels) {
    const { ctx, p } = await open(base + "?" + D + "&lang=" + lang, { lang: uiLang });
    const out = { hits: [], overflow: [], cjk: [] };
    out.home = { headline: await p.textContent("#homeTitle"), labels: await p.$$eval("#homeConds .cond-btn", (els) => els.map((e) => e.dataset.cond + "=" + e.textContent)), badge: await p.textContent("#draftBadge"), lang: await p.evaluate(() => document.documentElement.lang) };
    const scan = async (where) => {
      const t = await text(p);
      for (const h of scanRendered(t, lang)) out.hits.push({ where, ...h });
      if (lang === "en") { const m = t.match(new RegExp(CJK_RE.source, "g")); if (m) out.cjk.push({ where, chars: m.slice(0, 8).join("") }); }
      if ((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) > 0) out.overflow.push(where);
    };
    await scan("home");
    await p.click('[data-action="openQuiz"]'); await scan("quiz"); await p.click('[data-action="goHome"]');
    for (const season of ["autumn", "winter"]) for (const id of CONDITION_IDS) {
      await p.evaluate(({ id, season }) => window.__healoa.go("result", { cond: id, season }, true), { id, season });
      if (id === "sleep" && season === "autumn") out.lead = await p.textContent("#resultBody .result-lead");
      await scan(`result ${id}/${season}`);
      for (const pl of ["wudang", "pattaya", "onsen", "harbin"]) { await p.evaluate((pl) => window.__healoa.go("place", { placeId: pl }, true), pl); await scan(`place ${pl} ${id}/${season}`); }
      await p.evaluate(() => window.__healoa.go("card", {}, true)); await scan(`card ${id}/${season}`);
    }
    for (const pr of ["breath46", "breath478", "walk", "soak", "baduanjin1", "taiji1"]) { await p.evaluate((pr) => window.__healoa.go("practice", { cond: "sleep", practiceId: pr }, true), pr); await scan("practice " + pr); }
    await p.evaluate(() => window.__healoa.go("card", { cond: "sleep", season: "autumn" }, true));
    await p.click("#btnOpenLine");
    out.lineLead = await p.textContent(".line-lead");
    await scan("leave a line");
    await openShare(p); await scan("share panel");
    out.shareBlob = JSON.stringify(await p.evaluate(() => [window.__healoa.buildShare(), window.__healoa.lastShareCardText()]));
    await p.goto(base + "?s=abc234&l=" + B64("Slow mornings.") + "&r=" + B64("Warm tea.") + "&lang=" + lang + "&" + D);
    out.reply = await p.textContent("#sharedLine");
    await scan("reply view");
    await p.evaluate(() => document.getElementById("about").open = true); await scan("about");
    await ctx.close();
    return out;
  }
  const enS = await draftSweep("en", "en-US", EN_LABELS);
  check("en home: “What would feel good today?”; draft badge; <html lang=en>", enS.home.headline === "What would feel good today?" && enS.home.badge === "Draft preview" && enS.home.lang === "en", enS.home);
  check("en options mapped to body states (Deep rest→sleep, Warmth→cold, Easy on the stomach→gut, Steady and calm→bp, Let go of tension→tense, Quiet→quiet)", JSON.stringify(enS.home.labels) === JSON.stringify(["sleep=Deep rest", "cold=Warmth", "gut=Easy on the stomach", "bp=Steady and calm", "tense=Let go of tension", "quiet=Quiet"]), enS.home.labels);
  check("en result lead: “Here are a few places and ways to live that may fit this season.”", enS.lead === "Here are a few places and ways to live that may fit this season.", enS.lead);
  check("en leave-a-line: “Leave a line. Make this moment yours.”; recipient: “They added something beside yours.”", enS.lineLead === "Leave a line. Make this moment yours." && enS.reply.includes("They added something beside yours."), { lineLead: enS.lineLead, reply: enS.reply });
  check(`en draft: every screen scanned with the en banned-word list (home, quiz, 12 results, 48 place pages, 12 cards, 6 practices, line, share, reply, about) → 0 hits`, enS.hits.length === 0, enS.hits.slice(0, 6));
  check("en draft: no untranslated Chinese on any screen; no horizontal overflow", enS.cjk.length === 0 && enS.overflow.length === 0, { cjk: enS.cjk.slice(0, 4), overflow: enS.overflow.slice(0, 4) });
  check("en share payload carries no body-state / feeling words", !ALL_LABELS.some((l) => enS.shareBlob.includes(l)) && !/sleep|stomach|tension/i.test(enS.shareBlob));
  const jaS = await draftSweep("ja", "ja-JP", JA_LABELS);
  check("ja home: headline + 「下書き」 badge + same feeling-option structure", jaS.home.headline === "今日は、何があると心地いいですか？" && jaS.home.badge === "下書き" && jaS.home.lang === "ja" && JSON.stringify(jaS.home.labels) === JSON.stringify(["sleep", "cold", "gut", "bp", "tense", "quiet"].map((id) => id + "=" + JA_LABELS[id])), jaS.home);
  check("ja draft: every screen scanned with the ja banned-word list → 0 hits; no horizontal overflow", jaS.hits.length === 0 && jaS.overflow.length === 0, { hits: jaS.hits.slice(0, 6), overflow: jaS.overflow.slice(0, 4) });

  check("no page errors / console errors during the merged-plan run", pageErrors.length === 0, pageErrors.slice(0, 5));
} catch (e) {
  check("test run crashed", false, String((e && e.stack) || e));
} finally {
  if (browser) await browser.close();
  if (server) server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\nmerged-plan: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "merged-plan.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
