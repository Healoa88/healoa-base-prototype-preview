/* HeaLoa · app (v2026-09-27-w)
 * Main path: home (one tap) → result (season × condition) → relaxation (real timer) → season care card (private by default).
 * After the card (optional, never before it): 「留一句」 a line the user writes for themselves (local only, shown on their card)
 * → 「发给一个人」 native share sheet first, then per-platform buttons (app/share-targets.js), 9:16 story image.
 * Recipient view: may show that line, 「在旁边也写一句」 once (local + URL only, no backend), 「给自己也做一张」.
 * Customer-facing text: only through t(key, vars) from app/i18n/<locale>.js (default zh). No hard-coded copy here (checked by tests).
 * Privacy: the chosen condition never goes into the URL, the share card, the share link or any payload.
 * Every button uses data-action and is handled by ACTIONS (checked by tests).
 */
(function () {
  "use strict";
  var D = window.HEALOA_DATA, R = window.HEALOA_RULES, I18N = window.HEALOA_I18N, t = I18N.t;
  var $ = function (id) { return document.getElementById(id); };
  var LS_CARD = "healoa.card.v1", LS_EVENTS = "healoa.events.v1", LS_LINE = "healoa.line.v1", LS_REPLIED = "healoa.replied.v1";
  var LINE_MAX = 60;
  var SHARE_CFG = (window.HEALOA_SHARE && window.HEALOA_SHARE.byLocale[I18N.lang]) || { qr: false, targets: ["copy"] };
  var SHARE_TARGETS = (window.HEALOA_SHARE && window.HEALOA_SHARE.targets) || {};

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function condById(id) { for (var i = 0; i < D.CONDITIONS.length; i++) if (D.CONDITIONS[i].id === id) return D.CONDITIONS[i]; return null; }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* Validation events only: shared / opened / got_own_card / practice_completed / card_kept. Never carries body or feeling data. */
  function logEvent(name) {
    var ev = lsGet(LS_EVENTS) || [];
    ev.push({ e: name, t: Date.now() });
    if (ev.length > 200) ev = ev.slice(-200);
    lsSet(LS_EVENTS, ev);
  }

  /* ---------- date / season ---------- */
  var params = new URLSearchParams(location.search);
  var today = (function () {
    var q = params.get("date");
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) { var p = q.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
    return new Date();
  })();
  var naturalSeason = R.seasonFor(today); /* real season by solar term: spring / summer / autumn / winter */
  var term = R.solarTermFor(today);
  var contentSeason = R.contentSeasonFor(naturalSeason); /* autumn / winter (the only content so far) */

  var state = { view: "home", season: contentSeason, cond: null, placeId: null, practiceId: null, cardShowCond: false, shareUrl: null, from: null, line: "" };
  (function () { var l = lsGet(LS_LINE); if (l && typeof l.text === "string") state.line = cleanLine(l.text); })();

  /* ---------- the user's own line (留一句) ---------- */
  function cleanLine(s) { return String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, LINE_MAX); }
  function b64e(str) { try { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); } catch (e) { return ""; } }
  function b64d(str) {
    try {
      if (!str || !/^[A-Za-z0-9_-]{1,400}$/.test(str)) return "";
      var b = str.replace(/-/g, "+").replace(/_/g, "/");
      while (b.length % 4) b += "=";
      return cleanLine(decodeURIComponent(escape(atob(b))));
    } catch (e) { return ""; }
  }
  /* A line only travels with a shared card when it names no body state / feeling option (any locale). */
  var PRIVATE_WORDS = (function () {
    var out = [], L = window.HEALOA_LOCALES || {};
    Object.keys(L).forEach(function (code) {
      var c = L[code] && L[code].content && L[code].content.conditions;
      if (c) Object.keys(c).forEach(function (k) { if (c[k]) out.push(String(c[k]).toLowerCase()); });
      var extra = L[code] && L[code].content && L[code].content.privateWords;
      if (extra) extra.forEach(function (w) { out.push(String(w).toLowerCase()); });
    });
    return out;
  })();
  function lineTravels(line) {
    var low = String(line || "").toLowerCase();
    if (!low) return false;
    for (var i = 0; i < PRIVATE_WORDS.length; i++) if (PRIVATE_WORDS[i] && low.indexOf(PRIVATE_WORDS[i]) >= 0) return false;
    return true;
  }

  /* ---------- navigation (history state only; URL never carries the condition) ---------- */
  var VIEWS = ["home", "shared", "quiz", "result", "place", "practice", "card"];
  function snapshot() { return { view: state.view, season: state.season, cond: state.cond, placeId: state.placeId, practiceId: state.practiceId }; }
  function show(view) {
    VIEWS.forEach(function (v) {
      var el = document.querySelector('[data-view="' + v + '"]');
      if (el) el.classList.toggle("hidden", v !== view);
    });
    document.body.classList.toggle("practicing", view === "practice");
    state.view = view;
    window.scrollTo(0, 0);
  }
  function render() {
    renderSeasonButtons();
    if (state.view === "home") renderHome();
    else if (state.view === "shared") renderShared();
    else if (state.view === "quiz") renderQuiz();
    else if (state.view === "result") renderResult();
    else if (state.view === "place") renderPlace();
    else if (state.view === "practice") renderPractice();
    else if (state.view === "card") renderCard();
  }
  function go(view, patch, replace) {
    if (state.view === "practice" && view !== "practice") timerStop(false);
    if (patch) for (var k in patch) state[k] = patch[k];
    show(view);
    render();
    var url = location.pathname + cleanSearch();
    try { if (replace) history.replaceState(snapshot(), "", url); else history.pushState(snapshot(), "", url); } catch (e) {}
  }
  function cleanSearch() {
    var p = new URLSearchParams(location.search);
    p.delete("s"); p.delete("l"); p.delete("r");
    var s = p.toString();
    return s ? "?" + s : "";
  }
  window.addEventListener("popstate", function (ev) {
    var s = ev.state;
    if (state.view === "practice") timerStop(false);
    if (!s || !s.view) { show("home"); render(); return; }
    state.season = s.season || state.season; state.cond = s.cond; state.placeId = s.placeId; state.practiceId = s.practiceId;
    show(s.view); render();
  });

  /* ---------- home ---------- */
  /* A locale without spaces (ja) can list where a button label may break (content.conditionBreaks, "|" = break point).
   * Rendered as <wbr> with CSS keep-all, so a label never leaves its last kana alone on a second line. Others: plain text. */
  var COND_BREAKS = (I18N.content && I18N.content().conditionBreaks) || {};
  function condLabelHtml(c) {
    var b = COND_BREAKS[c.id];
    if (!b || b.replace(/\|/g, "") !== c.label) return esc(c.label);
    return b.split("|").map(esc).join("<wbr>");
  }
  function condButtons(container) {
    container.innerHTML = D.CONDITIONS.map(function (c) {
      return '<button type="button" class="cond-btn" data-action="pickCond" data-cond="' + c.id + '">' + condLabelHtml(c) + "</button>";
    }).join("");
  }
  function renderSeasonButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-action="season"]'), function (b) {
      var on = b.getAttribute("data-season") === state.season;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function renderHome() {
    var S = D.SEASONS[state.season];
    $("homeSeasonNow").textContent = state.season === naturalSeason ? t("home.seasonToday", { term: term, season: S.label }) :
      !D.SEASONS[naturalSeason] ? t("home.seasonPending", { term: term, now: D.SEASON_NAMES[naturalSeason], season: S.label }) : t("home.seasonAhead", { season: S.label });
    condButtons($("homeConds"));
    var saved = lsGet(LS_CARD);
    var hint = $("returnHint");
    if (saved && condById(saved.cond) && D.SEASONS[saved.season]) {
      hint.textContent = t("home.returnHint", { season: D.SEASONS[saved.season].label });
      hint.classList.remove("hidden");
    } else hint.classList.add("hidden");
  }
  /* Recipient view. ?l = the sender's own line (optional), ?r = one line written beside it (reply link). */
  var incoming = { id: null, line: "", reply: "", writing: false, mine: "" };
  function repliedIds() { var r = lsGet(LS_REPLIED); return Array.isArray(r) ? r : []; }
  function renderShared() {
    condButtons($("sharedConds"));
    var box = $("sharedLine"), h = "";
    if (!incoming.line) { box.innerHTML = ""; box.classList.add("hidden"); return; }
    if (incoming.reply) {
      /* The sender opens the link that came back: both lines side by side. No further replies. */
      h += '<p class="line-kicker">' + esc(t("reply.kicker")) + "</p>" +
        '<div class="line-pair"><div class="line-bubble"><p class="line-who">' + esc(t("reply.yours")) + '</p><p class="line-text">' + esc(incoming.line) + "</p></div>" +
        '<div class="line-bubble beside"><p class="line-who">' + esc(t("reply.theirs")) + '</p><p class="line-text">' + esc(incoming.reply) + "</p></div></div>";
    } else {
      h += '<div class="line-bubble"><p class="line-who">' + esc(t("recv.lineLabel")) + '</p><p class="line-text">' + esc(incoming.line) + "</p></div>";
      var done = incoming.mine || repliedIds().indexOf(incoming.id) >= 0;
      if (incoming.mine) {
        h += '<div class="line-bubble beside"><p class="line-who">' + esc(t("recv.mineLabel")) + '</p><p class="line-text">' + esc(incoming.mine) + "</p></div>" +
          '<p class="muted small">' + esc(t("recv.sendBackNote")) + "</p>" +
          '<div class="btn-row"><button type="button" class="btn primary" data-action="replySend">' + esc(t("recv.sendBack")) + "</button>" +
          '<button type="button" class="btn ghost" data-action="replyCopy">' + esc(t("share.t.copy")) + "</button></div>" +
          '<p class="muted small share-link" id="replyLink">' + esc(replyUrl()) + "</p>";
      } else if (incoming.writing) {
        h += '<textarea id="replyInput" class="line-input" maxlength="' + LINE_MAX + '" rows="2" placeholder="' + esc(t("recv.placeholder")) + '" aria-label="' + esc(t("recv.write")) + '"></textarea>' +
          '<p class="muted small">' + esc(t("recv.writeNote")) + "</p>" +
          '<div class="btn-row"><button type="button" class="btn primary" data-action="replySave">' + esc(t("recv.save")) + "</button>" +
          '<button type="button" class="btn ghost" data-action="replyCancel">' + esc(t("line.cancel")) + "</button></div>";
      } else {
        h += '<div class="btn-row">' + (done ? "" : '<button type="button" class="btn ghost" data-action="replyOpen">' + esc(t("recv.write")) + "</button>") +
          '<button type="button" class="btn ghost" data-action="makeOwn">' + esc(t("recv.makeOwn")) + "</button></div>";
        if (done) h += '<p class="muted small">' + esc(t("recv.alreadyWrote")) + "</p>";
      }
    }
    h += '<p class="saved-note hidden" id="replyNote" role="status"></p>';
    box.innerHTML = h;
    box.classList.remove("hidden");
  }
  function langQuery() { return I18N.lang !== I18N.DEFAULT ? "&lang=" + encodeURIComponent(I18N.lang) : ""; }
  function replyUrl() {
    return location.origin + location.pathname + "?s=" + incoming.id + "&l=" + b64e(incoming.line) + "&r=" + b64e(incoming.mine) + langQuery();
  }

  /* ---------- quiz (optional) ---------- */
  var quiz = { i: 0, yes: {} };
  function renderQuiz() {
    var body = $("quizBody");
    if (quiz.i < D.QUIZ.length) {
      var q = D.QUIZ[quiz.i];
      body.innerHTML = '<p class="quiz-prog">' + esc(t("quiz.progress", { n: quiz.i + 1, total: D.QUIZ.length })) + "</p>" +
        '<p class="quiz-q">' + esc(q.q) + "</p>" +
        '<div class="btn-row"><button type="button" class="btn primary" data-action="quizAnswer" data-yes="1">' + esc(t("quiz.yes")) + "</button>" +
        '<button type="button" class="btn ghost" data-action="quizAnswer" data-yes="0">' + esc(t("quiz.no")) + "</button></div>" +
        '<button type="button" class="text-link" data-action="goHome">' + esc(t("quiz.skip")) + "</button>";
      return;
    }
    var picks = D.QUIZ.filter(function (x) { return quiz.yes[x.cond]; }).map(function (x) { return x.cond; });
    if (!picks.length) picks = ["quiet"];
    body.innerHTML = '<p class="quiz-q">' + esc(t("quiz.suggest")) + '</p><div class="stack">' + picks.map(function (id) {
      return '<button type="button" class="btn primary" data-action="pickCond" data-cond="' + id + '">' + esc(condById(id).label) + "</button>";
    }).join("") + '</div><p class="muted small">' + esc(t("quiz.note")) + "</p>" +
      '<button type="button" class="text-link" data-action="goHome">' + esc(t("quiz.home")) + "</button>";
  }

  /* ---------- result ---------- */
  function renderResult() {
    var c = condById(state.cond), S = D.SEASONS[state.season];
    if (!c) { go("home", null, true); return; }
    var rec = R.recommend(state.cond, state.season);
    var care = D.CARE[state.cond][state.season];
    var prac = D.PRACTICES[D.PRACTICE_DEFAULT[state.cond]];
    $("resultTitle").textContent = t("result.title", { season: S.label, cond: c.label });
    $("resultConds").innerHTML = D.CONDITIONS.map(function (x) {
      return '<button type="button" class="chip' + (x.id === state.cond ? " on" : "") + '" data-action="pickCond" data-cond="' + x.id + '">' + esc(x.label) + "</button>";
    }).join("");
    var lead = t("result.lead");
    var h = lead ? '<p class="result-lead">' + esc(lead) + "</p>" : "";
    var seasonLine = state.season === naturalSeason ? t("result.seasonToday", { term: term, season: S.label }) : t("result.seasonAhead", { season: S.label, months: S.months });
    h += '<div class="block" id="blkNote"><h3>' + esc(t("result.noteTitle")) + '</h3><p class="muted small">' + esc(seasonLine) + "</p><ul>" +
      care.note.map(function (n) { return '<li><span class="tag">' + esc(n.tag) + "</span>" + esc(n.text) + "</li>"; }).join("") + "</ul></div>";

    h += '<h3 class="sec-title">' + esc(t("result.placesTitle")) + '</h3><p class="sec-sub">' + esc(t("result.placesSub", { season: S.label })) + "</p>";
    rec.top.forEach(function (tp, i) {
      var p = R.placeById(tp.id);
      h += '<article class="place-card" data-place="' + tp.id + '">' +
        '<div class="photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.alt) + '" loading="lazy"><span class="rank">' + esc(t("result.rank", { n: i + 1 })) + '</span><span class="credit">' + esc(D.CREDIT) + "</span></div>" +
        '<div class="place-main"><p class="place-name">' + esc(p.name) + "</p>" +
        '<p class="place-benefit">' + esc(p.benefit) + "</p>" + cindyLineHtml(p) +
        '<p class="reason1">' + esc(tp.reasons[0]) + "</p>" +
        '<button type="button" class="btn ghost small" data-action="openPlace" data-place="' + tp.id + '">' + esc(t("result.openPlace")) + "</button></div></article>";
    });
    h += '<div class="home-card" id="blkHome"><h3>' + esc(t("result.homeTitle")) + "</h3><ul>" +
      D.HOME_PLAN[state.cond].map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") +
      '</ul><div class="btn-row"><button type="button" class="btn ghost" data-action="openPractice" data-practice="soak">' + esc(t("result.soakBtn")) + "</button>" +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="' + prac.id + '">' + esc(prac.short) + "</button></div></div>";

    if (rec.skip.length) {
      h += '<div class="block" id="blkSkip"><h3>' + esc(t("result.skipTitle")) + '</h3><ul class="skip-list">' + rec.skip.map(function (s) {
        return '<li><span class="skip-name">' + esc(s.name) + "</span>" + esc(t("punct.colon")) + esc(s.reason) + "</li>";
      }).join("") + "</ul></div>";
    }
    if (rec.more.length) {
      h += '<div class="block" id="blkMore"><h3>' + esc(t("result.moreTitle")) + '</h3><p class="muted small">' + esc(t("result.moreSub")) + '</p><ul class="more-list">' + rec.more.map(function (m) {
        var p = R.placeById(m.id);
        return "<li><b>" + esc(p.name) + "</b>" + esc(t("punct.colon")) + esc(m.line) + "</li>";
      }).join("") + "</ul></div>";
    }
    h += '<div class="stack"><button type="button" class="btn primary" data-action="openPractice" data-practice="' + prac.id + '">' + esc(t("result.relaxCta", { label: prac.label })) + "</button></div>";

    h += '<div class="block" id="blkEat"><h3>' + esc(t("result.eatTitle")) + "</h3><ul>" +
      "<li><b>" + esc(t("result.eatMore")) + "</b>" + esc(care.eat.more) + "</li>" +
      "<li><b>" + esc(t("result.eatLess")) + "</b>" + esc(care.eat.less) + "</li>" +
      "<li><b>" + esc(t("result.eatTip")) + "</b>" + esc(care.eat.tip) + "</li>" +
      "<li><b>" + esc(t("result.eatDrink")) + "</b>" + esc(care.eat.drink) + "</li></ul>" +
      '<p class="muted small">' + esc(t("result.eatNote")) + "</p></div>";
    h += '<div class="block" id="blkMove"><h3>' + esc(t("result.moveTitle")) + "</h3><ul>" + care.move.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<p class="muted small">' + esc(t("result.moveFollow")) + '</p><div class="btn-row">' +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="walk">' + esc(t("result.moveWalk")) + "</button>" +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="baduanjin1">' + esc(t("result.moveBaduanjin")) + "</button>" +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="taiji1">' + esc(t("result.moveTaiji")) + "</button>" +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="breath46">' + esc(t("result.moveBreath")) + "</button></div></div>";
    h += '<div class="safety" id="blkSafety"><b>' + esc(t("result.caution")) + "</b>" + esc(care.safety) + "</div>";
    h += '<div class="stack"><button type="button" class="btn primary" data-action="openCard">' + esc(t("result.cardCta")) + "</button></div>";
    h += '<p class="src-note">' + esc(t("result.srcNote", { credit: D.CREDIT })) + "</p>";
    $("resultBody").innerHTML = h;
  }
  function cindyLineHtml(p) {
    /* Cindy's own signed line. Empty until she provides it → renders nothing. Never generated. */
    if (!p.cindyLine) return "";
    return '<p class="cindy-line">' + esc(t("place.cindyLine", { line: p.cindyLine })) + "</p>";
  }

  /* ---------- place ---------- */
  function renderPlace() {
    var p = R.placeById(state.placeId);
    if (!p || !p.photo) { go("result", null, true); return; }
    var cond = state.cond || "quiet", S = D.SEASONS[state.season];
    var rs = R.reasons(p, cond, state.season), skip = R.skipReason(p, cond, state.season);
    var h = '<div class="place-hero"><div class="photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.alt) + '"><span class="credit">' + esc(D.CREDIT) + "</span></div></div>";
    h += '<h2 class="place-title">' + esc(p.name) + '</h2><p class="place-area">' + esc(p.area) + "</p>";
    h += '<p class="place-benefit">' + esc(p.benefit) + "</p>" + cindyLineHtml(p);
    if (skip) h += '<div class="safety"><b>' + esc(t("place.skipLabel")) + "</b>" + esc(skip) + "</div>";
    h += '<div class="block"><h3>' + esc(t(skip ? "place.climateSkip" : "place.climateFit", { season: S.label })) + '</h3><ol class="reasons">' + rs.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ol></div>";
    h += '<div class="block"><h3>' + esc(t("place.eatTitle")) + "</h3><ul>" + p.food.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    h += '<div class="block"><h3>' + esc(t("place.todoTitle")) + "</h3><ul>" + p.todo.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    var cautions = p.caution.slice();
    if (p.attrs.hotspring) cautions.unshift(t("place.hotspringCaution"));
    h += '<div class="safety"><b>' + esc(t("result.caution")) + "</b><ul>" + cautions.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    if (p.gallery && p.gallery.length) {
      h += '<div class="gallery">' + p.gallery.map(function (g) { return '<div class="photo"><img src="' + esc(g) + '" alt="' + esc(p.name) + '" loading="lazy"><span class="credit">' + esc(D.CREDIT) + "</span></div>"; }).join("") + "</div>";
    }
    h += '<div class="home-card"><h3>' + esc(t("place.homeTitle")) + "</h3><ul>" + D.HOME_PLAN[cond].map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    var prac = D.PRACTICES[D.PRACTICE_DEFAULT[cond]];
    h += '<div class="stack"><button type="button" class="btn primary" data-action="openPractice" data-practice="' + prac.id + '">' + esc(t("result.relaxCta", { label: prac.short })) + "</button></div>";
    h += '<p class="src-note">' + esc(t("place.srcNote")) + "</p>";
    $("placeBody").innerHTML = h;
  }

  /* ---------- practice: real timer (time-delta), wake lock ---------- */
  var T = { running: false, paused: false, startAt: 0, pauseAt: 0, pausedTotal: 0, duration: 180, raf: 0, iv: 0, lastBeat: -1, done: false, cadence: 75, beep: false, wake: null, audio: null };
  function practice() { return D.PRACTICES[state.practiceId] || D.PRACTICES.breath46; }
  function durationOf(p) {
    if (p.kind === "guided") return p.steps.reduce(function (a, s) { return a + s.sec; }, 0);
    return T.duration;
  }
  function elapsedMs() {
    if (!T.startAt) return 0;
    var now = T.paused ? T.pauseAt : performance.now();
    return Math.max(0, now - T.startAt - T.pausedTotal);
  }
  function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2); }
  function modeList() {
    /* Every practice is safe for every condition (no breath hold > D.MAX_HOLD_SEC), so the list is the same for all. */
    var ids = ["breath46", "breathNight", "walk", "soak"];
    if (state.practiceId && ids.indexOf(state.practiceId) < 0) ids.push(state.practiceId);
    return ids;
  }
  function renderPractice() {
    var p = practice();
    if (!T.running) { T.duration = p.kind === "guided" ? durationOf(p) : (T.durationFor === p.id ? T.duration : p.defaultDuration); T.durationFor = p.id; }
    $("practiceBg").style.backgroundImage = "url('" + p.photo + "')";
    $("practiceModes").innerHTML = modeList().map(function (id) {
      var x = D.PRACTICES[id];
      return '<button type="button" class="chip' + (id === p.id ? " on" : "") + '" data-action="practiceMode" data-practice="' + id + '">' + esc(x.short) + "</button>";
    }).join("");
    $("practiceTitle").textContent = p.label;
    $("practiceIntro").textContent = p.intro;
    var opts = "";
    if (p.durations && p.kind !== "guided") {
      opts += p.durations.map(function (d) {
        var label = p.rounds ? t("practice.rounds", { n: Math.round(d / p.phases.reduce(function (a, x) { return a + x.sec; }, 0)) }) : t("practice.minutes", { n: Math.round(d / 60) });
        return '<button type="button" class="chip' + (d === T.duration ? " on" : "") + '" data-action="practiceOpt" data-duration="' + d + '">' + label + "</button>";
      }).join("");
    }
    if (p.kind === "walk") {
      opts += p.cadences.map(function (c) {
        return '<button type="button" class="chip' + (c === T.cadence ? " on" : "") + '" data-action="practiceOpt" data-cadence="' + c + '">' + esc(t("practice.cadence", { n: c })) + "</button>";
      }).join("");
      opts += '<button type="button" class="chip' + (T.beep ? " on" : "") + '" data-action="practiceBeep">' + esc(t(T.beep ? "practice.beepOn" : "practice.beepOff")) + "</button>";
    }
    $("practiceOpts").innerHTML = opts;
    var safe = t("practice.safeDefault");
    if (p.kind === "soak") safe = (state.cond && D.CARE[state.cond] ? D.CARE[state.cond][state.season].safety + " " : "") + t("practice.safeSoakTail");
    if (p.kind === "walk") safe = t("practice.safeWalk");
    $("practiceSafe").textContent = safe;
    $("walkFeet").classList.toggle("hidden", p.kind !== "walk");
    $("breathCircle").classList.toggle("hidden", p.kind === "walk");
    if (!T.running) {
      $("practiceClock").textContent = mmss(durationOf(p));
      $("practiceCue").textContent = t(p.kind === "guided" ? "practice.readyGuided" : "practice.ready");
      $("breathCircle").style.transform = "scale(.55)";
      $("donePanel").classList.toggle("hidden", !T.done);
    }
    updateControls();
  }
  function updateControls() {
    var running = T.running;
    $("btnStart").classList.toggle("hidden", running);
    $("btnStart").textContent = t(T.done ? "practice.startAgain" : "practice.start");
    $("btnPause").classList.toggle("hidden", !running);
    $("btnStop").classList.toggle("hidden", !running);
    $("btnPause").textContent = t(T.paused ? "practice.resume" : "practice.pause");
    document.querySelector("#vPractice .controls").classList.toggle("running", running);
    Array.prototype.forEach.call(document.querySelectorAll('#practiceOpts .chip, #practiceModes .chip'), function (b) { b.disabled = running; });
  }
  function ease(x) { return 0.5 - Math.cos(Math.PI * x) / 2; }
  function tick() {
    if (!T.running) return;
    var p = practice(), e = elapsedMs() / 1000, dur = durationOf(p), remain = dur - e;
    $("practiceClock").textContent = mmss(remain);
    if (p.kind === "breath") {
      var cycle = p.phases.reduce(function (a, x) { return a + x.sec; }, 0), tc = e % cycle, acc = 0, prevScale = p.phases[p.phases.length - 1].scale;
      for (var i = 0; i < p.phases.length; i++) {
        var ph = p.phases[i];
        if (tc < acc + ph.sec) {
          var k = (tc - acc) / ph.sec, from = prevScale, to = ph.scale;
          var s = 0.55 + 0.45 * (from + (to - from) * ease(k));
          $("breathCircle").style.transform = "scale(" + s.toFixed(3) + ")";
          $("practiceCue").textContent = t("practice.breathCue", { phase: ph.name, n: Math.ceil(ph.sec - (tc - acc)) });
          break;
        }
        acc += ph.sec; prevScale = ph.scale;
      }
    } else if (p.kind === "walk") {
      var interval = 60 / T.cadence, beat = Math.floor(e / interval);
      if (beat !== T.lastBeat) {
        T.lastBeat = beat;
        $("footL").classList.toggle("on", beat % 2 === 0);
        $("footR").classList.toggle("on", beat % 2 === 1);
        if (T.beep) click();
      }
      $("practiceCue").textContent = t(Math.floor(beat / 3) % 2 === 0 ? "practice.walkIn" : "practice.walkOut");
    } else if (p.kind === "soak") {
      var sPulse = 0.55 + 0.2 * (0.5 + 0.5 * Math.sin(e / 5 * Math.PI));
      $("breathCircle").style.transform = "scale(" + sPulse.toFixed(3) + ")";
      $("practiceCue").textContent = t(remain <= 60 ? "practice.soakLast" : "practice.soakOn");
    } else if (p.kind === "guided") {
      var a2 = 0;
      for (var j = 0; j < p.steps.length; j++) {
        if (e < a2 + p.steps[j].sec || j === p.steps.length - 1) {
          $("practiceCue").textContent = t("practice.guidedStep", { n: j + 1, total: p.steps.length, text: p.steps[j].text });
          break;
        }
        a2 += p.steps[j].sec;
      }
    }
    if (remain <= 0) { timerStop(true); return; }
  }
  function loop() { tick(); if (T.running && !T.paused) T.raf = requestAnimationFrame(loop); }
  function click() {
    try {
      if (!T.audio) T.audio = new (window.AudioContext || window.webkitAudioContext)();
      var ctx = T.audio, o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 660; g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }
  function wakeOn() {
    if (!("wakeLock" in navigator) || T.wake) return;
    navigator.wakeLock.request("screen").then(function (w) {
      T.wake = w; $("wakeNote").classList.remove("hidden");
      w.addEventListener("release", function () { T.wake = null; });
    }).catch(function () {});
  }
  function wakeOff() { if (T.wake) { try { T.wake.release(); } catch (e) {} T.wake = null; } $("wakeNote").classList.add("hidden"); }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && T.running && !T.paused) { wakeOn(); tick(); }
  });
  function timerStart() {
    var p = practice();
    T.running = true; T.paused = false; T.done = false; T.pausedTotal = 0; T.lastBeat = -1;
    T.startAt = performance.now();
    $("donePanel").classList.add("hidden");
    cancelAnimationFrame(T.raf); clearInterval(T.iv);
    T.iv = setInterval(tick, 250);
    if (p.kind === "walk" && T.beep) click();
    wakeOn(); updateControls(); loop();
  }
  function timerPause() {
    if (!T.running) return;
    if (!T.paused) { T.paused = true; T.pauseAt = performance.now(); cancelAnimationFrame(T.raf); $("practiceCue").textContent = t("practice.paused"); }
    else { T.pausedTotal += performance.now() - T.pauseAt; T.paused = false; wakeOn(); loop(); }
    updateControls();
  }
  function timerStop(completed) {
    var wasRunning = T.running, p = practice(), spent = elapsedMs() / 1000;
    T.running = false; T.paused = false; cancelAnimationFrame(T.raf); clearInterval(T.iv); wakeOff();
    $("footL").classList.remove("on"); $("footR").classList.remove("on");
    if (!wasRunning) return;
    if (completed) {
      T.done = true;
      logEvent("practice_completed");
      $("practiceClock").textContent = "0:00";
      $("practiceCue").textContent = t("practice.done");
      $("doneTitle").textContent = t("practice.doneTitle", { time: mmss(durationOf(p)) });
      $("donePanel").classList.remove("hidden");
    } else {
      T.done = false;
      $("practiceClock").textContent = mmss(durationOf(p));
      $("practiceCue").textContent = t("practice.stopped", { time: mmss(spent) });
      $("breathCircle").style.transform = "scale(.55)";
    }
    T.startAt = 0;
    if (state.view === "practice") updateControls();
  }

  /* ---------- language switcher + social links (both render nothing until there is something to show) ---------- */
  function renderLangSwitch() {
    var el = $("langSwitch");
    if (!el) return;
    var codes = I18N.completeLocales();
    if (codes.length < 2) { el.innerHTML = ""; el.classList.add("hidden"); return; }
    el.innerHTML = codes.map(function (c) {
      var m = (window.HEALOA_LOCALES[c] || {}).meta || {};
      return '<button type="button" class="chip' + (c === I18N.lang ? " on" : "") + '" data-action="setLang" data-lang="' + esc(c) + '" lang="' + esc(m.htmlLang || c) + '">' + esc(m.name || c) + "</button>";
    }).join("");
    el.classList.remove("hidden");
  }
  /* app/social.js: { <locale>: [{ platform, url, label }] }. Only https links; empty list → the row stays hidden. */
  function socialEntries() {
    var all = window.HEALOA_SOCIAL || {}, list = all[I18N.lang] || [];
    return list.filter(function (x) { return x && typeof x.url === "string" && /^https:\/\/[^\s"'<>]+$/.test(x.url) && x.label; });
  }
  function renderSocial(id) {
    var el = $(id);
    if (!el) return;
    var list = socialEntries();
    if (!list.length) { el.innerHTML = ""; el.classList.add("hidden"); return; }
    el.innerHTML = '<span class="social-title">' + esc(t("social.follow")) + "</span>" + list.map(function (x) {
      return '<a class="social-link" data-action="openSocial" data-platform="' + esc(x.platform || "") + '" href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.label) + "</a>";
    }).join("");
    el.classList.remove("hidden");
  }

  /* ---------- care card ---------- */
  function cardModel() {
    var cond = state.cond, season = state.season, S = D.SEASONS[season];
    var rec = R.recommend(cond, season), top = rec.top[0], place = top ? R.placeById(top.id) : null;
    var care = D.CARE[cond][season], prac = D.PRACTICES[D.PRACTICE_DEFAULT[cond]];
    /* 「写出我的情况」 off (default): the card and its image carry NO condition-specific text — generic season items and a
     * generic safety line (same for every condition), and a 留一句 that names a body state stays off (rule R05). */
    var show = !!state.cardShowCond, G = D.CARE_GENERIC[season];
    var lineOk = show || lineTravels(state.line);
    return {
      seasonLine: season === naturalSeason ? t("card.seasonToday", { season: S.label, term: term }) : t("card.seasonAhead", { season: S.label, months: S.months }),
      head: t("card.head", { who: state.cardShowCond ? condById(cond).label : t("card.whoAnon"), season: S.label }),
      place: place ? { name: place.name, photo: place.photo, reason: top.reasons[0] } : null,
      items: show ? [
        t("card.itemEat", { tip: care.eat.tip, foods: care.eat.more.split(t("punct.listSep")).slice(0, 3).join(t("punct.listSep")) }),
        t("card.itemMove", { move: care.move[0] }),
        t("card.itemRelax", { label: prac.label })
      ] : [G.eat, G.move, G.relax],
      safety: show ? care.safety : G.safety,
      line: lineOk ? state.line : "",
      lineHidden: !!state.line && !lineOk
    };
  }
  function renderCard() {
    if (!condById(state.cond)) { go("home", null, true); return; }
    var m = cardModel();
    $("cardShowCond").checked = !!state.cardShowCond;
    var h = "";
    if (m.place) h += '<div class="photo"><img src="' + esc(m.place.photo) + '" alt="' + esc(m.place.name) + '"><span class="credit">' + esc(D.CREDIT) + "</span></div>";
    h += '<div class="care-body"><p class="care-season">' + esc(m.seasonLine) + '</p><p class="care-head">' + esc(m.head) + "</p>";
    if (m.place) h += "<p><b>" + esc(t("card.placeLabel")) + "</b>" + esc(m.place.name) + '<br><span class="muted small">' + esc(m.place.reason) + "</span></p>";
    h += "<ol>" + m.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
    if (m.line) h += '<p class="care-line" id="cardLine">' + esc(t("line.onCard", { line: m.line })) + "</p>";
    else if (m.lineHidden) h += '<p class="muted small" id="cardLineHidden">' + esc(t("card.lineHidden")) + "</p>";
    h += '<p class="care-safe">' + esc(m.safety) + '</p><p class="care-foot">' + esc(t("card.foot", { disclaimer: D.DISCLAIMER })) + "</p></div>";
    $("cardPreview").innerHTML = h;
    $("savedNote").classList.add("hidden");
    $("sharePanel").classList.add("hidden");
    $("shareNote").classList.add("hidden");
    $("btnOpenShare").textContent = t("share.open");
    $("linePanel").classList.add("hidden");
    $("lineNote").classList.add("hidden");
    $("btnOpenLine").classList.remove("hidden");
    $("btnOpenLine").textContent = t(state.line ? "line.edit" : "line.open");
    renderSocial("socialCard");
  }

  /* ---------- canvas helpers ---------- */
  function loadImg(src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { resolve(im); };
      im.onerror = function () { resolve(null); };
      im.src = src;
    });
  }
  function coverDraw(ctx, im, x, y, w, h) {
    if (!im) { ctx.fillStyle = "#d9d2c4"; ctx.fillRect(x, y, w, h); return; }
    var r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
    ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
  }
  var FONT = I18N.meta().canvasFont || "sans-serif";
  /* Line breaking for canvas text: Latin words (and numbers, units, URLs pieces) stay whole and break at spaces;
   * CJK / kana break between characters; closing punctuation never starts a line; a single token wider than
   * the line (e.g. a long link) is split by characters. */
  var TOKEN_RE = /[A-Za-z0-9\u00C0-\u024F\u2019'\-\u2013.,:;!?%&+\u00B0\u2103()\/#@_=~*$"\u201C\u201D]+[ \u00A0]*|\s+|[\s\S]/g;
  var NO_START_RE = /^[\uFF0C\u3002\u3001\uFF01\uFF1F\uFF1B\uFF1A\u300D\u300F\uFF09\u300B\u3009\u3011\u201D\u2019,.!?;:)\]\u30FC\u30FB\u3063\u3083\u3085\u3087\u30C3\u30E3\u30E5\u30E7]/;
  function wrapLines(ctx, text, maxW) {
    var toks = String(text).match(TOKEN_RE) || [], lines = [], line = "";
    function push() { var l = line.replace(/\s+$/, ""); if (l) lines.push(l); line = ""; }
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i];
      if (!line && /^\s+$/.test(tk)) continue;
      var test = line + tk;
      if (ctx.measureText(test.replace(/\s+$/, "")).width <= maxW || !line || NO_START_RE.test(tk)) {
        if (!line && ctx.measureText(tk.replace(/\s+$/, "")).width > maxW) {
          /* over-long single token: split by characters */
          for (var j = 0; j < tk.length; j++) {
            if (ctx.measureText(line + tk[j]).width > maxW && line) push();
            line += tk[j];
          }
          continue;
        }
        line = test;
      } else { push(); line = /^\s+$/.test(tk) ? "" : tk; }
    }
    push();
    return lines;
  }
  var lastWrap = [];
  function wrap(ctx, text, x, y, maxW, lh, log) {
    var lines = wrapLines(ctx, text, maxW);
    lines.forEach(function (l, k) { ctx.fillText(l, x, y + k * lh); });
    lastWrap.push({ text: String(text), lines: lines, maxW: maxW });
    if (lastWrap.length > 80) lastWrap = lastWrap.slice(-80);
    if (log) log.push(text);
    return y + lines.length * lh;
  }
  var lastPrivateText = [];
  async function privatePng() {
    var m = cardModel(), W = 1080, H = 1560, c = document.createElement("canvas"), L = [];
    lastPrivateText = L;
    c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#fffdf9"; ctx.fillRect(0, 0, W, H);
    var im = m.place ? await loadImg(m.place.photo) : null;
    coverDraw(ctx, im, 0, 0, W, 560);
    ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(W - 300, 510, 280, 40);
    ctx.fillStyle = "#fff"; ctx.font = "26px " + FONT; ctx.fillText(D.CREDIT, W - 285, 540); L.push(D.CREDIT);
    var y = 640, X = 64, MW = W - 128;
    ctx.fillStyle = "#2f5d50"; ctx.font = "bold 38px " + FONT; y = wrap(ctx, m.seasonLine, X, y, MW, 50, L) + 20;
    ctx.fillStyle = "#26241f"; ctx.font = "bold 56px " + FONT; y = wrap(ctx, m.head, X, y, MW, 70, L); y += 20;
    ctx.font = "40px " + FONT;
    if (m.place) { y = wrap(ctx, t("card.placeLabel") + m.place.name, X, y, MW, 56, L); ctx.fillStyle = "#5f5a50"; ctx.font = "32px " + FONT; y = wrap(ctx, m.place.reason, X, y, MW, 46, L) + 20; }
    ctx.fillStyle = "#26241f"; ctx.font = "40px " + FONT;
    m.items.forEach(function (it, i) { y = wrap(ctx, (i + 1) + ". " + it, X, y, MW, 56, L) + 10; });
    if (m.line) { ctx.fillStyle = "#9a5530"; ctx.font = "bold 40px " + FONT; y = wrap(ctx, t("line.onCard", { line: m.line }), X, y + 10, MW, 54, L) + 6; }
    ctx.fillStyle = "#7a3b12"; ctx.font = "32px " + FONT; y = wrap(ctx, m.safety, X, y + 10, MW, 46, L);
    ctx.fillStyle = "#5f5a50"; ctx.font = "28px " + FONT; wrap(ctx, t("card.foot", { disclaimer: D.DISCLAIMER }), X, H - 60, MW, 40, L);
    return c.toDataURL("image/png");
  }

  /* ---------- share (secondary, after the card): image card + link (+ QR in zh only); no body/feeling data anywhere ---------- */
  function newShareId() {
    var a = new Uint8Array(6), chars = "abcdefghijkmnpqrstuvwxyz23456789", s = "";
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    for (var i = 0; i < a.length; i++) s += chars[a[i] % chars.length];
    return s;
  }
  /* The user's own line goes with the card only if it passes lineTravels() (names no body state / feeling option). */
  function travellingLine() { return lineTravels(state.line) ? state.line : ""; }
  function buildShare() {
    var line = travellingLine();
    if (!state.shareUrl) state.shareUrl = location.origin + location.pathname + "?s=" + newShareId() + (line ? "&l=" + b64e(line) : "") + langQuery();
    var S = D.SEASONS[state.season];
    return {
      url: state.shareUrl,
      title: t("share.title"),
      text: t("share.text", { season: S.label }),
      card: {
        brand: t("share.cardBrand"),
        head: t("share.cardHead", { season: S.label }),
        sub: t("share.cardSub"),
        line: line,
        photo: D.SEASON_PHOTO[state.season],
        credit: D.CREDIT,
        foot: D.DISCLAIMER
      }
    };
  }
  var lastShareCardText = [];
  function shownLink(url) { return url.replace(/^https?:\/\//, "").replace(/&[lr]=[A-Za-z0-9_-]*/g, ""); }
  function drawQr(ctx, url, qx, qy, size) {
    var q = qrcode(0, "M"); q.addData(url); q.make();
    var n = q.getModuleCount(), cell = size / n;
    ctx.fillStyle = "#fff"; ctx.fillRect(qx - 12, qy - 12, size + 24, size + 24);
    ctx.fillStyle = "#111";
    for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) ctx.fillRect(qx + cc * cell, qy + r * cell, Math.ceil(cell), Math.ceil(cell));
  }
  function drawLine(ctx, line, X, y, MW, px, log) {
    if (!line) return y;
    ctx.fillStyle = "#9a5530"; ctx.fillRect(X, y - px, 6, px * 1.2);
    ctx.font = "bold " + px + "px " + FONT;
    return wrap(ctx, t("line.onCard", { line: line }), X + 26, y, MW - 26, Math.round(px * 1.35), log);
  }
  /* Share images: 4:5 card (1080×1350) and 9:16 story (1080×1920). Text is laid out top-down under the photo;
   * if the text (with the user's line) would run into the QR / link block, the photo gets shorter and it is redrawn. */
  function drawShareImage(share, spec) {
    var W = spec.W, H = spec.H, card = share.card, X = spec.X, MW = W - 2 * X, c, ctx, log, ok = false;
    for (var k = 0; k < spec.photoHeights.length && !ok; k++) {
      var ph = spec.photoHeights[k];
      c = document.createElement("canvas"); c.width = W; c.height = H; ctx = c.getContext("2d"); log = [];
      ctx.fillStyle = "#f6f1e8"; ctx.fillRect(0, 0, W, H);
      coverDraw(ctx, spec.img, 0, 0, W, ph);
      if (spec.fade) { var g = ctx.createLinearGradient(0, ph - 240, 0, ph); g.addColorStop(0, "rgba(246,241,232,0)"); g.addColorStop(1, "rgba(246,241,232,1)"); ctx.fillStyle = g; ctx.fillRect(0, ph - 240, W, 240); }
      var cy = spec.creditTop ? 150 : ph - 50;
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(W - 300, cy, 280, 40);
      ctx.fillStyle = "#fff"; ctx.font = "26px " + FONT; ctx.fillText(card.credit, W - 285, cy + 30); log.push(card.credit);
      var y = ph + spec.gap;
      ctx.fillStyle = "#2f5d50"; ctx.font = "bold " + spec.brandPx + "px " + FONT; ctx.fillText(card.brand, X, y); log.push(card.brand);
      ctx.fillStyle = "#26241f"; ctx.font = "bold " + spec.headPx + "px " + FONT; y = wrap(ctx, card.head, X, y + spec.headPx * 1.5, MW, Math.round(spec.headPx * 1.24), log);
      ctx.fillStyle = "#5f5a50"; ctx.font = spec.subPx + "px " + FONT; y = wrap(ctx, card.sub, X, y + 16, MW, Math.round(spec.subPx * 1.45), log);
      if (card.line) y = drawLine(ctx, card.line, X, y + spec.linePx * 1.3, MW, spec.linePx, log);
      ctx.font = "24px " + FONT;
      var footLines = wrapLines(ctx, card.foot, MW).length, footTop = H - 40 - (footLines - 1) * 30;
      var blockTop;
      if (SHARE_CFG.qr) {
        var size = spec.qrSize, qy = footTop - 60 - size;
        blockTop = qy - 24;
        ok = y + 10 <= blockTop || k === spec.photoHeights.length - 1;
        if (!ok) continue;
        drawQr(ctx, share.url, X, qy, size);
        var tx = X + size + 40, tw = W - tx - 50;
        ctx.fillStyle = "#26241f"; ctx.font = "bold 34px " + FONT; var ty = wrap(ctx, t("share.scanCta"), tx, qy + 50, tw, 44, log);
        ctx.fillStyle = "#5f5a50"; ctx.font = "26px " + FONT; wrap(ctx, shownLink(share.url), tx, ty + 16, tw, 36, log);
      } else {
        ctx.font = "bold 36px " + FONT; var ctaLines = wrapLines(ctx, t("share.openCta"), MW).length;
        ctx.font = "28px " + FONT; var linkLines = wrapLines(ctx, shownLink(share.url), MW).length;
        blockTop = footTop - 50 - linkLines * 38 - ctaLines * 48;
        ok = y + 30 <= blockTop || k === spec.photoHeights.length - 1;
        if (!ok) continue;
        ctx.fillStyle = "#26241f"; ctx.font = "bold 36px " + FONT; var y2 = wrap(ctx, t("share.openCta"), X, blockTop + 36, MW, 48, log);
        ctx.fillStyle = "#5f5a50"; ctx.font = "28px " + FONT; wrap(ctx, shownLink(share.url), X, y2 + 6, MW, 38, log);
      }
      ctx.fillStyle = "#5f5a50"; ctx.font = "24px " + FONT; wrap(ctx, card.foot, X, footTop, MW, 30, log);
    }
    return { url: c.toDataURL("image/png"), log: log };
  }
  async function sharePng(share) {
    var img = await loadImg(share.card.photo);
    var r = drawShareImage(share, { W: 1080, H: 1350, X: 64, img: img, photoHeights: [620, 540, 460, 380, 300], gap: 80, brandPx: 36, headPx: 60, subPx: 36, linePx: 42, qrSize: 230 });
    lastShareCardText = r.log;
    return r.url;
  }
  /* 9:16 story image (1080×1920) for every locale (Instagram Story, 抖音, 小红书 …). */
  var lastStoryText = [];
  async function storyPng(share) {
    var img = await loadImg(share.card.photo);
    var r = drawShareImage(share, { W: 1080, H: 1920, X: 80, img: img, photoHeights: [1000, 900, 800, 700, 600], gap: 60, brandPx: 40, headPx: 72, subPx: 40, linePx: 48, qrSize: 240, fade: true, creditTop: true });
    lastStoryText = r.log;
    return r.url;
  }
  function qrSvg(url) {
    var q = qrcode(0, "M"); q.addData(url); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }
  function dataUrlToFile(dataUrl, name) {
    var b = atob(dataUrl.split(",")[1]), arr = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) arr[i] = b.charCodeAt(i);
    return new File([arr], name, { type: "image/png" });
  }
  function note(id, text) { var el = $(id); el.textContent = text; el.classList.remove("hidden"); }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta); return ok;
  }
  var modalFile = null;
  function canShareFile(file) { try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { return false; } }
  function openModal(dataUrl, name, guide) {
    $("modalImg").src = dataUrl; $("modalDownload").href = dataUrl; $("modalDownload").setAttribute("download", name);
    var g = $("modalGuide");
    if (guide) { g.textContent = guide; g.classList.remove("hidden"); } else { g.textContent = ""; g.classList.add("hidden"); }
    modalFile = dataUrlToFile(dataUrl, name);
    $("modalShare").classList.toggle("hidden", !canShareFile(modalFile));
    $("imgModal").classList.remove("hidden");
  }
  /* Per-platform share buttons for the active locale (app/share-targets.js). Web / sms targets are real links. */
  function fillTpl(tpl, share) {
    var enc = encodeURIComponent;
    return tpl.replace("{url}", enc(share.url)).replace("{text}", enc(share.text)).replace("{textUrl}", enc(share.text + " " + share.url));
  }
  function targetHref(id, share) {
    var tg = SHARE_TARGETS[id];
    return tg && (tg.kind === "web" || tg.kind === "sms") ? fillTpl(tg.url, share) : null;
  }
  function renderShareTargets(share) {
    $("shareTargets").innerHTML = SHARE_CFG.targets.filter(function (id) { return SHARE_TARGETS[id]; }).map(function (id) {
      var tg = SHARE_TARGETS[id], label = esc(t("share.t." + id)), href = targetHref(id, share);
      if (href) {
        var blank = tg.kind === "web" ? ' target="_blank" rel="noopener noreferrer"' : "";
        return '<a class="btn ghost target-btn" data-action="shareTarget" data-target="' + id + '" href="' + esc(href) + '"' + blank + ">" + label + "</a>";
      }
      return '<button type="button" class="btn ghost target-btn" data-action="shareTarget" data-target="' + id + '">' + label + "</button>";
    }).join("");
  }
  function sharedImage(kind) {
    var share = buildShare();
    if (kind === "story") return storyPng(share);
    if (shareImgData) return Promise.resolve(shareImgData);
    return sharePng(share).then(function (u) { shareImgData = u; return u; });
  }
  function resetShare() {
    state.shareUrl = null; shareImgData = null;
    if (state.view === "card" && !$("sharePanel").classList.contains("hidden")) refreshSharePanel();
  }
  function refreshSharePanel() {
    var share = buildShare();
    $("shareLink").textContent = share.url;
    var qrRow = $("shareQr");
    if (SHARE_CFG.qr) { qrRow.innerHTML = qrSvg(share.url); qrRow.classList.remove("hidden"); } else { qrRow.innerHTML = ""; qrRow.classList.add("hidden"); }
    renderShareTargets(share);
    $("shareNote").classList.add("hidden");
    return sharePng(share).then(function (url) { shareImgData = url; $("shareImg").src = url; });
  }

  /* ---------- actions (every visible button maps here) ---------- */
  var shareImgData = null;
  var ACTIONS = {
    season: function (el) {
      state.season = el.getAttribute("data-season");
      state.shareUrl = null; shareImgData = null;
      if (state.view === "result") go("result", null, true); else render();
    },
    pickCond: function (el) {
      var id = el.getAttribute("data-cond");
      if (!condById(id)) return;
      if (state.view === "shared") logEvent("got_own_card");
      go("result", { cond: id }, state.view === "result");
    },
    back: function () { if (history.state && history.length > 1 && state.view !== "home") history.back(); else go("home", null, true); },
    goHome: function () { go("home"); },
    openQuiz: function () { quiz = { i: 0, yes: {} }; go("quiz"); },
    quizAnswer: function (el) { var q = D.QUIZ[quiz.i]; if (el.getAttribute("data-yes") === "1") quiz.yes[q.cond] = true; quiz.i++; renderQuiz(); },
    openPlace: function (el) { go("place", { placeId: el.getAttribute("data-place") }); },
    openPractice: function (el) { T.done = false; go("practice", { practiceId: el.getAttribute("data-practice") || D.PRACTICE_DEFAULT[state.cond || "quiet"] }); },
    practiceMode: function (el) { if (T.running) return; T.done = false; state.practiceId = el.getAttribute("data-practice"); try { history.replaceState(snapshot(), "", location.pathname + cleanSearch()); } catch (e) {} renderPractice(); },
    practiceOpt: function (el) {
      if (T.running) return;
      if (el.hasAttribute("data-duration")) { T.duration = +el.getAttribute("data-duration"); T.durationFor = practice().id; }
      if (el.hasAttribute("data-cadence")) T.cadence = +el.getAttribute("data-cadence");
      T.done = false; renderPractice();
    },
    practiceBeep: function () { T.beep = !T.beep; if (T.beep) click(); renderPractice(); },
    practiceStart: function () { timerStart(); },
    practicePause: function () { timerPause(); },
    practiceStop: function () { timerStop(false); },
    practiceAgain: function () { T.done = false; $("donePanel").classList.add("hidden"); timerStart(); },
    openCard: function () { go("card"); },
    openSavedCard: function () {
      var saved = lsGet(LS_CARD);
      if (!saved || !condById(saved.cond)) return;
      state.cardShowCond = !!saved.showCond;
      go("card", { cond: saved.cond, season: D.SEASONS[saved.season] ? saved.season : state.season });
    },
    toggleCardCond: function (el) { state.cardShowCond = !!el.checked; renderCard(); },
    keepCard: function () {
      var ok = lsSet(LS_CARD, { cond: state.cond, season: state.season, showCond: !!state.cardShowCond, savedAt: Date.now() });
      if (ok) logEvent("card_kept");
      note("savedNote", t(ok ? "card.kept" : "card.keepFailed"));
    },
    savePng: function () {
      privatePng().then(function (url) { openModal(url, t("card.pngName")); });
    },
    openShare: function () {
      if (!$("sharePanel").classList.contains("hidden")) {
        $("sharePanel").classList.add("hidden");
        $("btnOpenShare").textContent = t("share.open");
        return;
      }
      $("sharePanel").classList.remove("hidden");
      $("btnOpenShare").textContent = t("share.close");
      refreshSharePanel();
    },
    /* Native share sheet first: the PNG card as a file when the device supports it, plus text + link. */
    shareSend: function () {
      var share = buildShare();
      var payload = { title: share.title, text: share.text, url: share.url };
      if (navigator.share) {
        try { if (shareImgData) { var f = dataUrlToFile(shareImgData, "healoa.png"); if (canShareFile(f)) payload.files = [f]; } } catch (e) {}
        navigator.share(payload).then(function () { logEvent("shared"); note("shareNote", t("share.sent")); }, function () {});
      } else {
        copyText(share.text + " " + share.url).then(function (ok) {
          if (ok) logEvent("shared");
          note("shareNote", t(ok ? "share.copiedWithText" : "share.copyFailed"));
        });
      }
    },
    shareTarget: function (el) {
      var id = el.getAttribute("data-target"), tg = SHARE_TARGETS[id], share = buildShare();
      if (!tg) return;
      if (tg.kind === "web" || tg.kind === "sms") {
        /* the <a href> itself opens the platform (new tab) or Messages; keep the href fresh */
        el.setAttribute("href", targetHref(id, share));
        logEvent("shared");
        note("shareNote", t("share.guide." + id));
        return true;
      }
      if (tg.kind === "copy") {
        copyText(share.url).then(function (ok) { if (ok) logEvent("shared"); note("shareNote", t(ok ? "share.copied" : "share.copyFailed")); });
        return;
      }
      if (tg.kind === "saveImage") {
        var after = function (url) {
          var name = t(tg.image === "story" ? "share.storyName" : "share.pngName");
          var guide = t("share.guide." + id);
          if (tg.copyLink) {
            copyText(share.url).then(function (ok) {
              openModal(url, name, guide + (ok ? " " + t("share.linkCopiedToo") : ""));
            });
          } else openModal(url, name, guide);
          logEvent("shared");
          note("shareNote", guide);
        };
        sharedImage(tg.image).then(after);
      }
    },
    shareSaveImg: function () {
      sharedImage("card").then(function (url) { openModal(url, t("share.pngName")); });
    },
    shareSaveStory: function () {
      sharedImage("story").then(function (url) { openModal(url, t("share.storyName"), t("share.storyGuide")); });
    },
    modalShare: function () {
      if (!modalFile || !navigator.share) return;
      var share = buildShare();
      navigator.share({ files: [modalFile], title: share.title, text: share.text + " " + share.url }).then(function () { logEvent("shared"); }, function () {});
    },
    /* 留一句 — the user's own line, local only, shown on their card. */
    openLine: function () {
      $("linePanel").classList.remove("hidden");
      $("btnOpenLine").classList.add("hidden");
      $("lineInput").value = state.line || "";
      $("btnClearLine").classList.toggle("hidden", !state.line);
      $("lineNote").classList.add("hidden");
      try { $("lineInput").focus(); } catch (e) {}
    },
    saveLine: function () {
      var v = cleanLine($("lineInput").value);
      if (!v) { note("lineNote", t("line.empty")); return; }
      state.line = v;
      lsSet(LS_LINE, { text: v, savedAt: Date.now() });
      resetShare();
      renderCard();
      note("lineNote", t(lineTravels(v) ? "line.saved" : "line.savedPrivate"));
    },
    cancelLine: function () {
      $("linePanel").classList.add("hidden");
      $("btnOpenLine").classList.remove("hidden");
    },
    clearLine: function () {
      state.line = "";
      try { localStorage.removeItem(LS_LINE); } catch (e) {}
      resetShare();
      renderCard();
      note("lineNote", t("line.cleared"));
    },
    /* Recipient: write one line beside theirs (once; kept on this phone and in the link you send back). */
    replyOpen: function () { incoming.writing = true; renderShared(); try { $("replyInput").focus(); } catch (e) {} },
    replyCancel: function () { incoming.writing = false; renderShared(); },
    replySave: function () {
      var v = cleanLine($("replyInput").value);
      if (!v) { note("replyNote", t("line.empty")); return; }
      if (!lineTravels(v)) { note("replyNote", t("recv.private")); return; }
      incoming.mine = v; incoming.writing = false;
      var ids = repliedIds(); if (ids.indexOf(incoming.id) < 0) ids.push(incoming.id); lsSet(LS_REPLIED, ids.slice(-100));
      renderShared();
    },
    replySend: function () {
      var url = replyUrl(), text = t("recv.sendText");
      if (navigator.share) {
        navigator.share({ title: t("share.title"), text: text, url: url }).then(function () { logEvent("shared"); note("replyNote", t("share.sent")); }, function () {});
      } else {
        copyText(text + " " + url).then(function (ok) { if (ok) logEvent("shared"); note("replyNote", t(ok ? "share.copiedWithText" : "share.copyFailed")); });
      }
    },
    replyCopy: function () {
      copyText(replyUrl()).then(function (ok) { if (ok) logEvent("shared"); note("replyNote", t(ok ? "share.copied" : "share.copyFailed")); });
    },
    makeOwn: function () {
      var g = $("sharedConds");
      g.classList.add("pulse");
      try { g.scrollIntoView({ block: "center" }); g.focus({ preventScroll: true }); } catch (e) {}
      note("replyNote", t("recv.makeOwnHint"));
    },
    closeModal: function () { $("imgModal").classList.add("hidden"); },
    setLang: function (el) {
      var code = el.getAttribute("data-lang");
      if (!code || code === I18N.lang || !I18N.isComplete(code)) return;
      I18N.setLang(code);
      var p = new URLSearchParams(location.search);
      p.set("lang", code); p.delete("s");
      location.href = location.pathname + "?" + p.toString();
    },
    openSocial: function () { /* default <a target=_blank> behaviour */ return true; },
    downloadImg: function () { /* default <a download> behaviour */ return true; }
  };
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-action]");
    if (!el || el.tagName === "INPUT") return;
    var fn = ACTIONS[el.getAttribute("data-action")];
    if (!fn) return;
    if (el.tagName !== "A") ev.preventDefault();
    fn(el, ev);
  });
  document.addEventListener("change", function (ev) {
    var el = ev.target;
    if (el && el.tagName === "INPUT" && el.getAttribute("data-action") && ACTIONS[el.getAttribute("data-action")]) ACTIONS[el.getAttribute("data-action")](el, ev);
  });
  $("imgModal").addEventListener("click", function (ev) { if (ev.target === $("imgModal")) ACTIONS.closeModal(); });

  /* ---------- boot ---------- */
  var sid = params.get("s");
  var initial = sid && /^[a-z0-9]{4,16}$/.test(sid) ? "shared" : "home";
  if (initial === "shared") {
    logEvent("opened");
    incoming.id = sid;
    incoming.line = b64d(params.get("l"));
    incoming.reply = incoming.line ? b64d(params.get("r")) : "";
  }
  I18N.applyDom(document, { version: D.VERSION });
  if (I18N.draft) { $("draftBadge").textContent = t("draft.badge"); $("draftBadge").classList.remove("hidden"); }
  renderLangSwitch();
  renderSocial("socialFoot");
  show(initial); render();
  try { history.replaceState(snapshot(), "", location.pathname + location.search); } catch (e) {}

  /* test / debug surface (no personal data leaves the device) */
  window.__healoa = {
    version: D.VERSION, lang: I18N.lang, state: state, actions: ACTIONS, go: go, buildShare: buildShare,
    elapsedMs: elapsedMs, timer: T, events: function () { return lsGet(LS_EVENTS) || []; },
    lastShareCardText: function () { return lastShareCardText.slice(); },
    lastStoryText: function () { return lastStoryText.slice(); },
    lastWrap: function () { return lastWrap.slice(); },
    wrapLines: function (text, maxW, font) { var c = document.createElement("canvas").getContext("2d"); c.font = font || "40px " + FONT; return wrapLines(c, text, maxW); },
    storyPng: function () { return storyPng(buildShare()); },
    shareConfig: SHARE_CFG, targetHref: function (id) { return targetHref(id, buildShare()); },
    incoming: incoming, lineTravels: lineTravels,
    cardModel: cardModel,
    privatePng: function () { return privatePng(); },
    lastPrivateText: function () { return lastPrivateText.slice(); }
  };
})();
