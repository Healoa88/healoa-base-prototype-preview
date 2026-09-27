/* HeaLoa · app (v2026-09-27-x · v4 Phase 1)
 * Main path (v4, plan §2.1): home (3 steps 「怎么用」, one start button) → 2-minute matching quiz (8 questions, one per
 * screen, multi-select where the plan says, back / skip / progress) → flip reveal of the top 3 places for this season
 * (computed by app/match.js, not drawn by lot) → 「为什么是你」 (reasons, eat / do / avoid) → place page → one real
 * relaxation "here" (real timer) → season care card (private by default) + 「我的养护记录」 (local only).
 * All places with a photo are open from the first visit (「看看所有地方」); there is nothing to open up or earn.
 * Returning: 「{term}到了，重新配一次？」 and 「今天的 3 分钟」 on the next open only (no push), 「我的养护记录」.
 * After the card (optional, never before it): 「留一句」 → 「发给一个人」 (native share sheet first, per-platform buttons).
 * Customer-facing text: only through t(key, vars) from app/i18n/<locale>.js (default zh). No hard-coded copy here.
 * Privacy: quiz answers and the body state never go into the URL, the share card, the share link or any payload (R05).
 * Every button uses data-action and is handled by ACTIONS (checked by tests).
 */
(function () {
  "use strict";
  var D = window.HEALOA_DATA, R = window.HEALOA_RULES, M = window.HEALOA_MATCH, I18N = window.HEALOA_I18N, t = I18N.t;
  var $ = function (id) { return document.getElementById(id); };
  var LS_CARD = "healoa.card.v1", LS_EVENTS = "healoa.events.v1", LS_LINE = "healoa.line.v1", LS_REPLIED = "healoa.replied.v1";
  var LS_MATCH = "healoa.match.v1", LS_LOG = "healoa.log.v1"; /* last quiz answers + top places; 我的养护记录 — this phone only */
  var LINE_MAX = 60;
  var SHARE_CFG = (window.HEALOA_SHARE && window.HEALOA_SHARE.byLocale[I18N.lang]) || { qr: false, targets: ["copy"] };
  var SHARE_TARGETS = (window.HEALOA_SHARE && window.HEALOA_SHARE.targets) || {};

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function condById(id) { for (var i = 0; i < D.CONDITIONS.length; i++) if (D.CONDITIONS[i].id === id) return D.CONDITIONS[i]; return null; }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* Validation events only: shared / opened / got_own_card / practice_completed / card_kept / quiz_done / flip_seen / rematch /
   * place_action_done. Never carries body or feeling data or quiz answers. */
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
  var termIndex = R.termIndexFor(today);
  var contentSeason = R.contentSeasonFor(naturalSeason); /* autumn / winter (the only content so far) */

  var state = { view: "home", season: contentSeason, cond: null, answers: null, placeId: null, practiceId: null, actionPlace: null, cardShowCond: false, shareUrl: null, from: null, line: "" };
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
  var VIEWS = ["home", "shared", "quiz", "reveal", "result", "places", "place", "practice", "card", "records"];
  function snapshot() { return { view: state.view, season: state.season, cond: state.cond, answers: state.answers, placeId: state.placeId, practiceId: state.practiceId, actionPlace: state.actionPlace }; }
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
    else if (state.view === "reveal") renderReveal();
    else if (state.view === "result") renderResult();
    else if (state.view === "places") renderPlaces();
    else if (state.view === "records") renderRecords();
    else if (state.view === "place") renderPlace();
    else if (state.view === "practice") renderPractice();
    else if (state.view === "card") renderCard();
  }
  function go(view, patch, replace) {
    if (state.view === "practice" && view !== "practice") timerStop(false);
    if (patch) {
      /* An entry that names one body state (saved card, test hooks) without quiz answers → answers derived from it. */
      if (patch.cond && !("answers" in patch)) state.answers = null;
      for (var k in patch) state[k] = patch[k];
    }
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
    state.season = s.season || state.season; state.cond = s.cond; state.answers = s.answers || null; state.placeId = s.placeId; state.practiceId = s.practiceId; state.actionPlace = s.actionPlace || null;
    show(s.view); render();
  });

  /* ---------- matching (app/match.js) ---------- */
  /* The season's solar term used for the multiplier: today's term, or the first term of a season looked at ahead. */
  function termFor(season) { return season === naturalSeason ? termIndex : D.SEASON_START_TERM[season]; }
  function termName(i) { return D.SOLAR_TERMS[i].name; }
  function currentAnswers() { return state.answers || M.answersForCond(state.cond || "quiet"); }
  function currentMatch() {
    var m = M.match(currentAnswers(), { season: state.season, termIndex: termFor(state.season), year: today.getFullYear() });
    if (state.answers || !condById(state.cond)) state.cond = m.primaryCond;
    return m;
  }
  function nextTermInfo() {
    var i = (termIndex + 1) % 24, y = today.getFullYear() + (termIndex === 23 ? 1 : 0);
    var T = (D.SOLAR_TERM_DATES && D.SOLAR_TERM_DATES[y]) || D.SOLAR_TERMS.map(function (x) { return [x.m, x.d]; });
    return { next: termName(i), date: t("date.md", { month: D.MONTHS[T[i][0] - 1], d: T[i][1] }) };
  }
  function kindOf(p) { return p.kind || p.name; }
  function placeNames(ids) { return ids.map(function (id) { var p = R.placeById(id); return p ? p.name : ""; }).filter(Boolean).join(t("punct.listSep")); }

  /* ---------- home ---------- */
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
    $("homeTermExplain").classList.toggle("hidden", !I18N.meta().explainTerms);
    var saved = lsGet(LS_MATCH), okSaved = saved && Array.isArray(saved.top) && saved.top.length && saved.answers;
    var re = $("homeRematch"), last = $("homeLast"), today3 = $("homeToday");
    if (okSaved && saved.termIndex !== termIndex) { re.textContent = t("home.rematch", { term: term }); re.classList.remove("hidden"); } else re.classList.add("hidden");
    if (okSaved && saved.termIndex === termIndex) { last.textContent = t("home.lastMatch", { places: placeNames(saved.top) }); last.classList.remove("hidden"); } else last.classList.add("hidden");
    today3.classList.toggle("hidden", !okSaved);
    $("homeNext").textContent = t("home.nextTerm", nextTermInfo());
    var card = lsGet(LS_CARD), hint = $("returnHint");
    if (card && condById(card.cond) && D.SEASONS[card.season]) {
      hint.textContent = t("home.returnHint", { season: D.SEASONS[card.season].label });
      hint.classList.remove("hidden");
    } else hint.classList.add("hidden");
  }
  /* Recipient view. ?l = the sender's own line (optional), ?r = one line written beside it (reply link). */
  var incoming = { id: null, line: "", reply: "", writing: false, mine: "" };
  function repliedIds() { var r = lsGet(LS_REPLIED); return Array.isArray(r) ? r : []; }
  function renderShared() {
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

  /* ---------- 2-minute matching quiz: one question per screen ---------- */
  var quiz = { i: 0, picks: {} };
  function renderQuiz() {
    var q = D.QUIZ[quiz.i], n = quiz.i + 1, total = D.QUIZ.length, picked = quiz.picks[q.id] || [];
    var h = '<div class="quiz-bar" role="progressbar" aria-valuemin="1" aria-valuemax="' + total + '" aria-valuenow="' + n + '" aria-label="' + esc(t("quiz.progressAria")) + '"><span style="width:' + Math.round(n / total * 100) + '%"></span></div>' +
      '<p class="quiz-prog">' + esc(t("quiz.progress", { n: n, total: total })) + "</p>" +
      '<p class="quiz-q" id="quizQ">' + esc(q.q) + "</p>" +
      '<p class="quiz-hint">' + esc(q.multi ? t("quiz.multi") : t("quiz.single")) + "</p>" +
      '<div class="quiz-opts" role="group" aria-labelledby="quizQ">' + q.options.map(function (o) {
        var on = picked.indexOf(o.id) >= 0;
        return '<button type="button" class="quiz-opt' + (on ? " on" : "") + '" data-action="quizPick" data-opt="' + esc(o.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(o.label) + "</button>";
      }).join("") + "</div>";
    if (q.multi) h += '<div class="stack"><button type="button" class="btn primary" data-action="quizNext" id="quizNext">' + esc(t(n === total ? "quiz.finish" : "quiz.next")) + "</button></div>";
    h += '<div class="stack"><button type="button" class="btn ghost" data-action="quizSkip">' + esc(t("quiz.skip")) + "</button></div>";
    h += '<button type="button" class="text-link" data-action="quizPrev">' + esc(t(quiz.i === 0 ? "quiz.exit" : "quiz.prev")) + "</button>";
    $("quizBody").innerHTML = h;
  }
  function quizAdvance() {
    if (quiz.i < D.QUIZ.length - 1) { quiz.i++; renderQuiz(); window.scrollTo(0, 0); return; }
    finishQuiz();
  }
  function finishQuiz() {
    state.answers = M.clean(quiz.picks);
    state.season = contentSeason;
    var m = currentMatch();
    lsSet(LS_MATCH, { answers: state.answers, season: state.season, termIndex: termIndex, top: m.top.map(function (x) { return x.id; }), savedAt: Date.now() });
    logEvent("quiz_done");
    flipped = {};
    go("reveal", { answers: state.answers, cond: m.primaryCond });
  }

  /* ---------- flip reveal of the top 3 (computed, not drawn by lot) ---------- */
  var flipped = {};
  function renderReveal() {
    var m = currentMatch(), S = D.SEASONS[state.season];
    $("revealTitle").textContent = t("reveal.title", { season: S.label, term: termName(m.termIndex) });
    var h = "";
    if (m.top.length === 0) h += '<p class="reveal-note">' + esc(t("reveal.none")) + "</p>";
    else if (m.top.length < 3) h += '<p class="reveal-note">' + esc(t("reveal.fewer", { n: m.top.length })) + "</p>";
    h += '<div class="flip-list">' + m.top.map(function (e, i) {
      var p = R.placeById(e.id), on = !!flipped[i];
      return '<div class="flip-card' + (on ? " flipped" : "") + '" role="button" tabindex="0" data-action="flip" data-i="' + i + '" data-place="' + e.id + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        '<div class="flip-inner"><div class="flip-face flip-front" aria-hidden="' + (on ? "true" : "false") + '"><span class="flip-n">' + esc(t("reveal.front", { n: i + 1 })) + '</span><span class="flip-tap">' + esc(t("reveal.tap")) + "</span></div>" +
        '<div class="flip-face flip-back" aria-hidden="' + (on ? "false" : "true") + '"><div class="photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.alt) + '"><span class="credit">' + esc(D.CREDIT) + "</span></div>" +
        '<div class="flip-text"><p class="flip-match">' + esc(t("reveal.match", { season: S.label, kind: kindOf(p) })) + '</p><p class="flip-name">' + esc(p.name) + '</p><p class="flip-reason">' + esc(e.reasons[0]) + "</p></div></div></div></div>";
    }).join("") + "</div>";
    var all = m.top.length && m.top.every(function (_, i) { return flipped[i]; });
    h += '<div class="stack">' + (m.top.length && !all ? '<button type="button" class="btn ghost" data-action="flipAll">' + esc(t("reveal.flipAll")) + "</button>" : "") +
      '<button type="button" class="btn primary" data-action="openWhy">' + esc(t("reveal.why")) + "</button></div>" +
      '<button type="button" class="text-link" data-action="openQuiz">' + esc(t("reveal.redo")) + "</button>";
    $("revealBody").innerHTML = h;
  }

  /* ---------- 为什么是你 (result) ---------- */
  function renderResult() {
    var S = D.SEASONS[state.season];
    if (!S) { go("home", null, true); return; }
    var m = currentMatch(), c = condById(state.cond);
    var care = D.CARE[state.cond][state.season];
    var prac = D.PRACTICES[m.practiceId] || D.PRACTICES.breath46;
    $("resultTitle").textContent = t("result.title", { season: S.label });
    var lead = t("result.lead");
    var h = '<p class="muted small" id="resultTermLine">' + esc(t("result.termLine", { term: termName(m.termIndex) })) + "</p>";
    h += lead ? '<p class="result-lead">' + esc(lead) + "</p>" : "";
    if (D.HOME_REGION === "us") h += '<p class="note-line" id="usNote">' + esc(t("result.usNote")) + "</p>";
    if (m.asia && D.ASIA_LINE) h += '<p class="cindy-line" id="asiaLine">' + esc(D.ASIA_LINE) + "</p>";
    var homeCard = '<div class="home-card" id="blkHome"><h3>' + esc(t("result.homeTitle")) + "</h3>" + (m.atHome ? '<p class="small">' + esc(t("result.atHomeFirst")) + "</p>" : "") + "<ul>" +
      D.HOME_PLAN[state.cond].map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") +
      '</ul><div class="btn-row"><button type="button" class="btn ghost" data-action="openPractice" data-practice="soak">' + esc(t("result.soakBtn")) + "</button>" +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="' + prac.id + '">' + esc(prac.short) + "</button></div></div>";
    if (m.atHome) h += homeCard;

    h += '<h3 class="sec-title">' + esc(t("result.placesTitle")) + '</h3><p class="sec-sub">' + esc(t("result.placesSub", { season: S.label })) + "</p>";
    m.top.forEach(function (tp, i) {
      var p = R.placeById(tp.id), act = D.PLACE_ACTIONS[tp.id];
      var eat = M.adviceFor(m.termIndex, "eat", m.answers).map(function (x) { return x.text; }), dos = M.adviceFor(m.termIndex, "do", m.answers).map(function (x) { return x.text; }), avoid = M.adviceFor(m.termIndex, "avoid", m.answers).map(function (x) { return x.text; });
      h += '<article class="place-card" data-place="' + tp.id + '">' +
        '<div class="photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.alt) + '" loading="lazy"><span class="rank">' + esc(t("result.rank", { n: i + 1 })) + '</span><span class="credit">' + esc(D.CREDIT) + "</span></div>" +
        '<div class="place-main"><p class="place-name">' + esc(p.name) + "</p>" +
        '<p class="place-benefit">' + esc(p.benefit) + "</p>" + cindyLineHtml(p) +
        '<p class="why-label">' + esc(t("result.whyLabel")) + '</p><ul class="why">' + tp.reasons.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" +
        '<ul class="eda">' +
        "<li><b>" + esc(t("result.eatLabel")) + "</b>" + esc(eat.concat(p.food.slice(0, 1)).join(t("punct.listSep"))) + "</li>" +
        "<li><b>" + esc(t("result.doLabel")) + "</b>" + esc(dos.concat(p.todo.slice(0, 1)).join(t("punct.listSep"))) + "</li>" +
        "<li><b>" + esc(t("result.avoidLabel")) + "</b>" + esc(avoid.concat(p.caution.slice(0, 1)).join(" ")) + "</li></ul>" +
        '<div class="btn-row"><button type="button" class="btn ghost small" data-action="openPlace" data-place="' + tp.id + '">' + esc(t("result.enter")) + "</button>" +
        (act ? '<button type="button" class="btn ghost small" data-action="openPractice" data-practice="' + act.practice + '" data-place="' + tp.id + '">' + esc(act.short) + "</button>" : "") + "</div></div></article>";
    });
    if (m.excluded.length) {
      h += '<div class="block" id="blkSkip"><h3>' + esc(t("result.skipTitle")) + '</h3><ul class="skip-list">' + m.excluded.map(function (s) {
        return '<li><span class="skip-name">' + esc(s.name) + "</span>" + esc(t("punct.colon")) + esc(s.reason) + "</li>";
      }).join("") + "</ul></div>";
    }
    h += '<div class="stack"><button type="button" class="btn primary" data-action="openPractice" data-practice="' + prac.id + '">' + esc(t("result.relaxCta", { label: prac.label })) + "</button></div>";
    var seasonLine = state.season === naturalSeason ? t("result.seasonToday", { term: term, season: S.label }) : t("result.seasonAhead", { season: S.label, months: S.months });
    h += '<div class="block" id="blkNote"><h3>' + esc(t("result.noteTitle")) + '</h3><p class="muted small">' + esc(seasonLine) + "</p><ul>" +
      care.note.map(function (n) { return '<li><span class="tag">' + esc(n.tag) + "</span>" + esc(n.text) + "</li>"; }).join("") + "</ul></div>";
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
    if (!m.atHome) h += homeCard;
    h += '<div class="stack"><button type="button" class="btn primary" data-action="openCard">' + esc(t("result.cardCta")) + "</button></div>";
    h += '<p class="note-line" id="resultNext">' + esc(t("result.nextTerm", nextTermInfo())) + "</p>";
    h += '<button type="button" class="text-link" data-action="openPlaces">' + esc(t("result.allPlaces")) + "</button>";
    h += '<button type="button" class="text-link" data-action="openQuiz">' + esc(t("result.redo")) + "</button>";
    h += '<p class="src-note">' + esc(t("result.srcNote", { credit: D.CREDIT })) + "</p>";
    $("resultBody").innerHTML = h;
    return c;
  }
  function cindyLineHtml(p) {
    /* Cindy's own signed line. Empty until she provides it → renders nothing. Never generated. */
    if (!p.cindyLine) return "";
    return '<p class="cindy-line">' + esc(t("place.cindyLine", { line: p.cindyLine })) + "</p>";
  }

  /* ---------- place: feeling line, who it suits, what to avoid, one real relaxation here ---------- */
  function renderPlace() {
    var p = R.placeById(state.placeId);
    if (!p || !p.photo) { go("places", null, true); return; }
    var cond = state.cond || "quiet", S = D.SEASONS[state.season], m = currentMatch();
    var rs = R.reasons(p, cond, state.season), skip = null;
    m.excluded.forEach(function (x) { if (x.id === p.id) skip = x.reason; });
    var h = '<div class="place-hero"><div class="photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.alt) + '"><span class="credit">' + esc(D.CREDIT) + "</span></div></div>";
    h += '<h2 class="place-title">' + esc(p.name) + '</h2><p class="place-area">' + esc(p.area) + "</p>";
    h += '<p class="place-benefit feel-line">' + esc(p.benefit) + "</p>" + cindyLineHtml(p);
    /* 适合谁: the existing approved per-state lines, only for states this place is not ruled out for this season. */
    var suits = D.CONDITIONS.filter(function (c) { return p.fit[c.id] && !R.skipReason(p, c.id, state.season); });
    if (suits.length) h += '<div class="block" id="blkSuits"><h3>' + esc(t("place.suitsTitle")) + '</h3><ul>' + suits.map(function (c) { return "<li><b>" + esc(c.label) + esc(t("punct.colon")) + "</b>" + esc(p.fit[c.id]) + "</li>"; }).join("") + "</ul></div>";
    var cautions = p.caution.slice();
    if (p.attrs.hotspring) cautions.unshift(t("place.hotspringCaution"));
    h += '<div class="safety" id="blkAvoid"><b>' + esc(t("place.avoidTitle")) + esc(t("punct.colon")) + "</b>" + (skip ? '<p class="skip-now">' + esc(t("place.skipLabel")) + esc(skip) + "</p>" : "") + "<ul>" + cautions.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    var act = D.PLACE_ACTIONS[p.id];
    if (act) h += '<div class="block action-block" id="blkAction"><h3>' + esc(t("place.actionTitle")) + '</h3><p>' + esc(act.label) + '</p><button type="button" class="btn primary" data-action="openPractice" data-practice="' + act.practice + '" data-place="' + p.id + '">' + esc(t("result.relaxCta", { label: act.short })) + "</button></div>";
    h += '<div class="block"><h3>' + esc(t(skip ? "place.climateSkip" : "place.climateFit", { season: S.label })) + '</h3><ol class="reasons">' + rs.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ol></div>";
    h += '<div class="block"><h3>' + esc(t("place.eatTitle")) + "</h3><ul>" + p.food.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    h += '<div class="block"><h3>' + esc(t("place.todoTitle")) + "</h3><ul>" + p.todo.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    if (p.gallery && p.gallery.length) {
      h += '<div class="gallery">' + p.gallery.map(function (g) { return '<div class="photo"><img src="' + esc(g) + '" alt="' + esc(p.name) + '" loading="lazy"><span class="credit">' + esc(D.CREDIT) + "</span></div>"; }).join("") + "</div>";
    }
    h += '<div class="home-card"><h3>' + esc(t("place.homeTitle")) + "</h3><ul>" + D.HOME_PLAN[cond].map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    h += '<button type="button" class="text-link" data-action="openPlaces">' + esc(t("place.allPlaces")) + "</button>";
    h += '<p class="src-note">' + esc(t("place.srcNote")) + "</p>";
    $("placeBody").innerHTML = h;
  }

  /* ---------- all places: every place with a real photo is open from the first visit ---------- */
  function openPlaceList() { return D.PLACES.filter(function (p) { return !!p.photo; }); }
  function renderPlaces() {
    $("placesBody").innerHTML = openPlaceList().map(function (p) {
      return '<article class="place-card" data-place="' + p.id + '"><div class="photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.alt) + '" loading="lazy"><span class="credit">' + esc(D.CREDIT) + "</span></div>" +
        '<div class="place-main"><p class="place-name">' + esc(p.name) + '</p><p class="place-area">' + esc(p.area) + '</p><p class="place-benefit">' + esc(p.benefit) + "</p>" + cindyLineHtml(p) +
        '<button type="button" class="btn ghost small" data-action="openPlace" data-place="' + p.id + '">' + esc(t("places.open")) + "</button></div></article>";
    }).join("");
  }

  /* ---------- 我的养护记录: a plain local list (date · solar term · place · what was done · optional own line) ---------- */
  var recEdit = -1;
  function logRows() { var r = lsGet(LS_LOG); return Array.isArray(r) ? r : []; }
  function addRecord(row) {
    var rows = logRows();
    row.d = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
    row.term = termIndex; row.note = ""; row.at = Date.now();
    rows.push(row);
    if (rows.length > 300) rows = rows.slice(-300);
    return lsSet(LS_LOG, rows);
  }
  function recordWhat(r) {
    if (r.kind === "card") return t("records.cardKept");
    var a = r.place && D.PLACE_ACTIONS[r.place], pr = D.PRACTICES[r.practice];
    return a && a.practice === r.practice ? a.label : pr ? pr.label : "";
  }
  function renderRecords() {
    var rows = logRows(), h = "";
    if (!rows.length) h += '<p class="muted" id="recordsEmpty">' + esc(t("records.empty")) + "</p>";
    else {
      h += '<ul class="rec-list">' + rows.map(function (r, i) { return { r: r, i: i }; }).reverse().map(function (x) {
        var r = x.r, p = r.place && R.placeById(r.place), dd = String(r.d || "").split("-");
        var date = dd.length === 3 ? t("date.md", { month: D.MONTHS[+dd[1] - 1], d: +dd[2] }) : "";
        var li = '<li class="rec-row" data-i="' + x.i + '"><p class="rec-when">' + esc(t("records.row", { date: date, term: D.SOLAR_TERMS[r.term] ? termName(r.term) : "" })) + "</p>" +
          '<p class="rec-what"><b>' + esc(p ? p.name : t("records.atHome")) + "</b>" + esc(t("punct.colon")) + esc(recordWhat(r)) + "</p>";
        if (r.note) li += '<p class="rec-note">' + esc(t("line.onCard", { line: r.note })) + "</p>";
        if (recEdit === x.i) {
          li += '<textarea id="recNoteInput" class="line-input" maxlength="' + LINE_MAX + '" rows="2" placeholder="' + esc(t("records.notePlaceholder")) + '" aria-label="' + esc(t("records.addNote")) + '"></textarea>' +
            '<div class="btn-row"><button type="button" class="btn primary" data-action="recNoteSave" data-i="' + x.i + '">' + esc(t("records.saveNote")) + "</button>" +
            '<button type="button" class="btn ghost" data-action="recNoteCancel">' + esc(t("line.cancel")) + "</button></div>";
        } else {
          li += '<div class="btn-row"><button type="button" class="btn ghost small" data-action="recNoteOpen" data-i="' + x.i + '">' + esc(t(r.note ? "records.editNote" : "records.addNote")) + "</button>" +
            '<button type="button" class="btn ghost small" data-action="recDelete" data-i="' + x.i + '">' + esc(t("records.delete")) + "</button></div>";
        }
        return li + "</li>";
      }).join("") + "</ul>";
      h += '<button type="button" class="text-link" data-action="recClearAll">' + esc(t("records.clearAll")) + "</button>";
    }
    h += '<p class="note-line">' + esc(t("records.nextTerm", nextTermInfo())) + "</p>";
    h += '<p class="saved-note hidden" id="recNote" role="status"></p>';
    $("recordsBody").innerHTML = h;
    if (recEdit >= 0 && $("recNoteInput")) { $("recNoteInput").value = (logRows()[recEdit] || {}).note || ""; }
  }

  /* ---------- practice: real timer (time-delta), wake lock ---------- */
  var T = { running: false, paused: false, startAt: 0, pauseAt: 0, pausedTotal: 0, duration: 180, raf: 0, iv: 0, lastBeat: -1, done: false, cadence: 75, beep: false, wake: null, audio: null };
  /* The practice being shown. Done "in" a place (state.actionPlace), it keeps the same timings and shows that place's
   * photo, label and intro (D.PLACE_ACTIONS; plan v4 §5). */
  function practice() {
    var base = D.PRACTICES[state.practiceId] || D.PRACTICES.breath46, a = state.actionPlace && D.PLACE_ACTIONS[state.actionPlace];
    if (!a || a.practice !== base.id) return base;
    var p = {}, k;
    for (k in base) p[k] = base[k];
    p.label = a.label; p.intro = a.intro; p.photo = a.photo; p.place = a.place;
    return p;
  }
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
      /* 我的养护记录: one plain local row (no body state, no answers). */
      var logged = addRecord({ kind: "practice", place: p.place || null, practice: p.id });
      if (p.place) logEvent("place_action_done");
      $("doneLogged").classList.toggle("hidden", !logged);
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
    var m = currentMatch(), top = m.top[0], place = top ? R.placeById(top.id) : null;
    cond = state.cond;
    var care = D.CARE[cond][season], prac = D.PRACTICES[m.practiceId] || D.PRACTICES[D.PRACTICE_DEFAULT[cond]];
    /* 「写出我的情况」 off (default): the card and its image carry NO condition-specific text — generic season items and a
     * generic safety line (same for every condition), and a 留一句 that names a body state stays off (rule R05). */
    var show = !!state.cardShowCond, G = D.CARE_GENERIC[season];
    var lineOk = show || lineTravels(state.line);
    return {
      seasonLine: season === naturalSeason ? t("card.seasonToday", { season: S.label, term: term }) : t("card.seasonAhead", { season: S.label, months: S.months }),
      head: t("card.head", { who: state.cardShowCond ? condById(cond).label : t("card.whoAnon"), season: S.label }),
      place: place ? { name: place.name, photo: place.photo, reason: top.climateReasons[0] /* weather only: answer reasons name body states (R05) */ } : null,
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
      if (state.view === "result" || state.view === "reveal") go(state.view, null, true); else render();
    },
    back: function () { if (history.state && history.length > 1 && state.view !== "home") history.back(); else go("home", null, true); },
    goHome: function () { go("home"); },
    openQuiz: function () {
      /* Start again; the last answers (this phone only) are pre-selected so a new solar term takes seconds. */
      var saved = lsGet(LS_MATCH), prev = state.answers || (saved && saved.answers) || {}, picks = {};
      Object.keys(prev).forEach(function (k) { if (Array.isArray(prev[k])) picks[k] = prev[k].slice(); });
      quiz = { i: 0, picks: picks };
      go("quiz");
    },
    quizPick: function (el) {
      var q = D.QUIZ[quiz.i], id = el.getAttribute("data-opt"), cur = (quiz.picks[q.id] || []).slice();
      if (!q.multi) { quiz.picks[q.id] = [id]; quizAdvance(); return; }
      var at = cur.indexOf(id);
      if (at >= 0) cur.splice(at, 1);
      else if (q.exclusive.indexOf(id) >= 0) cur = [id];
      else { cur = cur.filter(function (x) { return q.exclusive.indexOf(x) < 0; }); cur.push(id); }
      quiz.picks[q.id] = cur;
      renderQuiz();
    },
    quizNext: function () { quizAdvance(); },
    quizSkip: function () { quiz.picks[D.QUIZ[quiz.i].id] = []; quizAdvance(); },
    quizPrev: function () { if (quiz.i === 0) { go("home"); return; } quiz.i--; renderQuiz(); window.scrollTo(0, 0); },
    flip: function (el) {
      var i = +el.getAttribute("data-i");
      if (!Object.keys(flipped).length) logEvent("flip_seen");
      flipped[i] = !flipped[i];
      renderReveal();
    },
    flipAll: function () { if (!Object.keys(flipped).length) logEvent("flip_seen"); for (var i = 0; i < 3; i++) flipped[i] = true; renderReveal(); },
    openWhy: function () { go("result"); },
    openPlaces: function () { go("places"); },
    openRecords: function () { recEdit = -1; go("records"); },
    rematch: function () { logEvent("rematch"); ACTIONS.openQuiz(); },
    openLastMatch: function () {
      var saved = lsGet(LS_MATCH);
      if (!saved || !saved.answers) return;
      flipped = { 0: true, 1: true, 2: true };
      go("reveal", { answers: M.clean(saved.answers), season: D.SEASONS[saved.season] ? saved.season : state.season });
    },
    /* 今天的 3 分钟: slow breathing (吸 4 呼 6, 3 minutes), shown with the photo of the last first match when that place's action is breathing. */
    openToday: function () {
      var saved = lsGet(LS_MATCH), top = saved && saved.top && saved.top[0], a = top && D.PLACE_ACTIONS[top];
      if (saved && saved.answers) state.answers = M.clean(saved.answers);
      T.done = false; T.durationFor = null;
      go("practice", { practiceId: "breath46", actionPlace: a && a.practice === "breath46" ? top : null });
    },
    startFromShared: function () { logEvent("got_own_card"); ACTIONS.openQuiz(); },
    recNoteOpen: function (el) { recEdit = +el.getAttribute("data-i"); renderRecords(); try { $("recNoteInput").focus(); } catch (e) {} },
    recNoteCancel: function () { recEdit = -1; renderRecords(); },
    recNoteSave: function (el) {
      var i = +el.getAttribute("data-i"), rows = logRows();
      if (!rows[i]) return;
      rows[i].note = cleanLine($("recNoteInput").value);
      lsSet(LS_LOG, rows); recEdit = -1; renderRecords();
    },
    recDelete: function (el) {
      var i = +el.getAttribute("data-i"), rows = logRows();
      rows.splice(i, 1); lsSet(LS_LOG, rows); recEdit = -1; renderRecords();
    },
    recClearAll: function () {
      try { localStorage.removeItem(LS_LOG); } catch (e) {}
      recEdit = -1; renderRecords(); note("recNote", t("records.cleared"));
    },
    openPlace: function (el) { go("place", { placeId: el.getAttribute("data-place") }); },
    openPractice: function (el) {
      T.done = false;
      go("practice", { practiceId: el.getAttribute("data-practice") || D.PRACTICE_DEFAULT[state.cond || "quiet"], actionPlace: el.getAttribute("data-place") || null });
    },
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
      if (ok) { logEvent("card_kept"); var m = currentMatch(); addRecord({ kind: "card", place: m.top[0] ? m.top[0].id : null }); }
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
    makeOwn: function () { ACTIONS.startFromShared(); },
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
  /* role="button" elements (flip cards) also answer Enter / Space */
  document.addEventListener("keydown", function (ev) {
    var el = ev.target;
    if (!el || el.getAttribute("role") !== "button" || !el.getAttribute("data-action") || (ev.key !== "Enter" && ev.key !== " ")) return;
    var fn = ACTIONS[el.getAttribute("data-action")];
    if (fn) { ev.preventDefault(); fn(el, ev); }
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
    cardModel: cardModel, currentMatch: currentMatch, records: logRows, quiz: function () { return quiz; },
    privatePng: function () { return privatePng(); },
    lastPrivateText: function () { return lastPrivateText.slice(); }
  };
})();
