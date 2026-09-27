/* HeaLoa · 顺着季节养 · app (v2026-09-27-s)
 * Main path: home (one tap) → result (season × condition) → relaxation (real timer) → 本季养护卡 (private by default).
 * Privacy: the chosen condition never goes into the URL, the share card, the share link or any payload.
 * Every button uses data-action and is handled by ACTIONS (checked by tests).
 */
(function () {
  "use strict";
  var D = window.HEALOA_DATA, R = window.HEALOA_RULES;
  var $ = function (id) { return document.getElementById(id); };
  var LS_CARD = "healoa.card.v1", LS_EVENTS = "healoa.events.v1";

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
  var naturalSeason = R.seasonFor(today);
  var term = R.solarTermFor(today);

  var state = { view: "home", season: naturalSeason, cond: null, placeId: null, practiceId: null, cardShowCond: false, shareUrl: null, from: null };

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
    p.delete("s");
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
  function condButtons(container) {
    container.innerHTML = D.CONDITIONS.map(function (c) {
      return '<button type="button" class="cond-btn" data-action="pickCond" data-cond="' + c.id + '">' + esc(c.label) + "</button>";
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
    $("homeSeasonNow").textContent = state.season === naturalSeason ? "今天 · " + term + "前后 · " + S.label : "提前看" + S.label + "天";
    condButtons($("homeConds"));
    var saved = lsGet(LS_CARD);
    var hint = $("returnHint");
    if (saved && condById(saved.cond) && D.SEASONS[saved.season]) {
      hint.textContent = "你上次存了一张" + D.SEASONS[saved.season].label + "季养护卡 · 点这里打开";
      hint.classList.remove("hidden");
    } else hint.classList.add("hidden");
  }
  function renderShared() { condButtons($("sharedConds")); }

  /* ---------- quiz (optional) ---------- */
  var quiz = { i: 0, yes: {} };
  function renderQuiz() {
    var body = $("quizBody");
    if (quiz.i < D.QUIZ.length) {
      var q = D.QUIZ[quiz.i];
      body.innerHTML = '<p class="quiz-prog">第 ' + (quiz.i + 1) + " 题 / 共 " + D.QUIZ.length + " 题</p>" +
        '<p class="quiz-q">' + esc(q.q) + "</p>" +
        '<div class="btn-row"><button type="button" class="btn primary" data-action="quizAnswer" data-yes="1">是</button>' +
        '<button type="button" class="btn ghost" data-action="quizAnswer" data-yes="0">不太是</button></div>' +
        '<button type="button" class="text-link" data-action="goHome">跳过，回首页直接点</button>';
      return;
    }
    var picks = D.QUIZ.filter(function (x) { return quiz.yes[x.cond]; }).map(function (x) { return x.cond; });
    if (!picks.length) picks = ["quiet"];
    body.innerHTML = '<p class="quiz-q">可以先看：</p><div class="stack">' + picks.map(function (id) {
      return '<button type="button" class="btn primary" data-action="pickCond" data-cond="' + id + '">' + esc(condById(id).label) + "</button>";
    }).join("") + '</div><p class="muted small">这是简版小测，只是帮你挑一个入口，结果不保存。</p>' +
      '<button type="button" class="text-link" data-action="goHome">回首页</button>';
  }

  /* ---------- result ---------- */
  function renderResult() {
    var c = condById(state.cond), S = D.SEASONS[state.season];
    if (!c) { go("home", null, true); return; }
    var rec = R.recommend(state.cond, state.season);
    var care = D.CARE[state.cond][state.season];
    var prac = D.PRACTICES[D.PRACTICE_DEFAULT[state.cond]];
    $("resultTitle").textContent = S.label + " · " + c.label;
    $("resultConds").innerHTML = D.CONDITIONS.map(function (x) {
      return '<button type="button" class="chip' + (x.id === state.cond ? " on" : "") + '" data-action="pickCond" data-cond="' + x.id + '">' + esc(x.label) + "</button>";
    }).join("");
    var h = "";
    var seasonLine = state.season === naturalSeason ? "现在是" + term + "前后 · " + S.label + "季" : "提前看" + S.label + "天（" + S.months + "）";
    h += '<div class="block" id="blkNote"><h3>本季要留意</h3><p class="muted small">' + esc(seasonLine) + "</p><ul>" +
      care.note.map(function (n) { return '<li><span class="tag">' + esc(n.tag) + "</span>" + esc(n.text) + "</li>"; }).join("") + "</ul></div>";

    h += '<h3 class="sec-title">这个季节去哪里养</h3><p class="sec-sub">按' + S.label + "季历史气候和你的情况排出来 · 都有实拍照片</p>";
    rec.top.forEach(function (t, i) {
      var p = R.placeById(t.id);
      h += '<article class="place-card" data-place="' + t.id + '">' +
        '<div class="photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.alt) + '" loading="lazy"><span class="rank">第 ' + (i + 1) + ' 选</span><span class="credit">' + esc(D.CREDIT) + "</span></div>" +
        '<div class="place-main"><p class="place-name">' + esc(p.name) + "</p>" +
        '<p class="place-benefit">' + esc(p.benefit) + "</p>" + cindyLineHtml(p) +
        '<p class="reason1">' + esc(t.reasons[0]) + "</p>" +
        '<button type="button" class="btn ghost small" data-action="openPlace" data-place="' + t.id + '">看这个地方 · 理由和做法</button></div></article>';
    });
    h += '<div class="home-card" id="blkHome"><h3>去不了远方？在家这样做</h3><ul>' +
      D.HOME_PLAN[state.cond].map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") +
      '</ul><div class="btn-row"><button type="button" class="btn ghost" data-action="openPractice" data-practice="soak">泡脚计时 10 分钟</button>' +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="' + prac.id + '">' + esc(prac.short) + "</button></div></div>";

    if (rec.skip.length) {
      h += '<div class="block" id="blkSkip"><h3>这个季节先不选</h3><ul class="skip-list">' + rec.skip.map(function (s) {
        return '<li><span class="skip-name">' + esc(s.name) + "</span>：" + esc(s.reason) + "</li>";
      }).join("") + "</ul></div>";
    }
    if (rec.more.length) {
      h += '<div class="block" id="blkMore"><h3>还有这些地方</h3><p class="muted small">照片陆续补上，补齐之前不排进前三。</p><ul class="more-list">' + rec.more.map(function (m) {
        var p = R.placeById(m.id);
        return "<li><b>" + esc(p.name) + '</b><span class="pending">照片待补</span>：' + esc(m.line) + "</li>";
      }).join("") + "</ul></div>";
    }
    h += '<div class="stack"><button type="button" class="btn primary" data-action="openPractice" data-practice="' + prac.id + '">先放松一下 · ' + esc(prac.label) + "</button></div>";

    h += '<div class="block" id="blkEat"><h3>吃喝</h3><ul>' +
      "<li><b>可以多吃：</b>" + esc(care.eat.more) + "</li>" +
      "<li><b>可以少一点：</b>" + esc(care.eat.less) + "</li>" +
      "<li><b>记住一句：</b>" + esc(care.eat.tip) + "</li>" +
      "<li><b>喝点什么：</b>" + esc(care.eat.drink) + "</li></ul>" +
      '<p class="muted small">茶饮孕期、长期身体状况请先听专业意见。</p></div>';
    h += '<div class="block" id="blkMove"><h3>怎么动</h3><ul>' + care.move.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<p class="muted small">跟着做（简单样品，站着坐着都可以）：</p><div class="btn-row">' +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="walk">慢走节奏</button>' +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="baduanjin1">八段锦第一式</button>' +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="taiji1">太极起势</button>' +
      '<button type="button" class="btn ghost" data-action="openPractice" data-practice="breath46">慢呼吸 3 分钟</button></div></div>';
    h += '<div class="safety" id="blkSafety"><b>要注意：</b>' + esc(care.safety) + "</div>";
    h += '<div class="stack"><button type="button" class="btn primary" data-action="openCard">生成本季养护卡</button></div>';
    h += '<p class="src-note">地点气候：历史气候均值，不是天气预报 · Climate data: NASA POWER (CC BY 4.0) · 照片 ' + esc(D.CREDIT) + "</p>";
    $("resultBody").innerHTML = h;
  }
  function cindyLineHtml(p) {
    /* Cindy's own signed line. Empty until she provides it → renders nothing. Never generated. */
    if (!p.cindyLine) return "";
    return '<p class="cindy-line">“' + esc(p.cindyLine) + "” —— Cindy</p>";
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
    if (skip) h += '<div class="safety"><b>这个季节先不选：</b>' + esc(skip) + "</div>";
    h += '<div class="block"><h3>' + (skip ? S.label + "季的气候" : "为什么" + S.label + "季适合") + '</h3><ol class="reasons">' + rs.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ol></div>";
    h += '<div class="block"><h3>在这里可以吃</h3><ul>' + p.food.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    h += '<div class="block"><h3>在这里做什么</h3><ul>' + p.todo.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    var cautions = p.caution.slice();
    if (p.attrs.hotspring) cautions.unshift("泡汤：水温 41℃ 以下，每次 10 分钟以内，起身要慢。");
    h += '<div class="safety"><b>要注意：</b><ul>' + cautions.map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    if (p.gallery && p.gallery.length) {
      h += '<div class="gallery">' + p.gallery.map(function (g) { return '<div class="photo"><img src="' + esc(g) + '" alt="' + esc(p.name) + '" loading="lazy"><span class="credit">' + esc(D.CREDIT) + "</span></div>"; }).join("") + "</div>";
    }
    h += '<div class="home-card"><h3>去不了？在家这样做</h3><ul>' + D.HOME_PLAN[cond].map(function (x) { return "<li>· " + esc(x) + "</li>"; }).join("") + "</ul></div>";
    var prac = D.PRACTICES[D.PRACTICE_DEFAULT[cond]];
    h += '<div class="stack"><button type="button" class="btn primary" data-action="openPractice" data-practice="' + prac.id + '">先放松一下 · ' + esc(prac.short) + "</button></div>";
    h += '<p class="src-note">历史气候均值，不是天气预报 · Climate data: NASA POWER (CC BY 4.0) · 网格海拔约 ' + D.CLIMATE[p.climate].elev + " 米（较粗，待人工核对）</p>";
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
    var ids = ["breath46", "breath478", "walk", "soak"];
    if (state.cond === "bp") ids = ["breath46", "walk", "soak"];
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
        var label = p.rounds ? (Math.round(d / 19)) + " 轮" : Math.round(d / 60) + " 分钟";
        return '<button type="button" class="chip' + (d === T.duration ? " on" : "") + '" data-action="practiceOpt" data-duration="' + d + '">' + label + "</button>";
      }).join("");
    }
    if (p.kind === "walk") {
      opts += p.cadences.map(function (c) {
        return '<button type="button" class="chip' + (c === T.cadence ? " on" : "") + '" data-action="practiceOpt" data-cadence="' + c + '">每分钟 ' + c + " 步</button>";
      }).join("");
      opts += '<button type="button" class="chip' + (T.beep ? " on" : "") + '" data-action="practiceBeep">节拍声' + (T.beep ? "：开" : "：关") + "</button>";
    }
    $("practiceOpts").innerHTML = opts;
    var safe = "不憋气硬撑；如有头晕、胸闷，马上停下。";
    if (p.kind === "soak") safe = (state.cond && D.CARE[state.cond] ? D.CARE[state.cond][state.season].safety + " " : "") + "泡完擦干，穿好袜子。";
    if (p.kind === "walk") safe = "走平路，量力而行；如有头晕、胸闷，马上停下。";
    $("practiceSafe").textContent = safe;
    $("walkFeet").classList.toggle("hidden", p.kind !== "walk");
    $("breathCircle").classList.toggle("hidden", p.kind === "walk");
    if (!T.running) {
      $("practiceClock").textContent = mmss(durationOf(p));
      $("practiceCue").textContent = p.kind === "guided" ? "准备好就点「开始」，跟着文字慢慢做" : "准备好就点「开始」";
      $("breathCircle").style.transform = "scale(.55)";
      $("donePanel").classList.toggle("hidden", !T.done);
    }
    updateControls();
  }
  function updateControls() {
    var running = T.running;
    $("btnStart").classList.toggle("hidden", running);
    $("btnStart").textContent = T.done ? "再开始一次" : "开始";
    $("btnPause").classList.toggle("hidden", !running);
    $("btnStop").classList.toggle("hidden", !running);
    $("btnPause").textContent = T.paused ? "继续" : "暂停";
    document.querySelector("#vPractice .controls").classList.toggle("running", running);
    Array.prototype.forEach.call(document.querySelectorAll('#practiceOpts .chip, #practiceModes .chip'), function (b) { b.disabled = running; });
  }
  function ease(x) { return 0.5 - Math.cos(Math.PI * x) / 2; }
  function tick() {
    if (!T.running) return;
    var p = practice(), e = elapsedMs() / 1000, dur = durationOf(p), remain = dur - e;
    $("practiceClock").textContent = mmss(remain);
    if (p.kind === "breath") {
      var cycle = p.phases.reduce(function (a, x) { return a + x.sec; }, 0), t = e % cycle, acc = 0, prevScale = p.phases[p.phases.length - 1].scale;
      for (var i = 0; i < p.phases.length; i++) {
        var ph = p.phases[i];
        if (t < acc + ph.sec) {
          var k = (t - acc) / ph.sec, from = prevScale, to = ph.scale;
          var s = 0.55 + 0.45 * (from + (to - from) * ease(k));
          $("breathCircle").style.transform = "scale(" + s.toFixed(3) + ")";
          $("practiceCue").textContent = ph.name + " " + Math.ceil(ph.sec - (t - acc));
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
      $("practiceCue").textContent = Math.floor(beat / 3) % 2 === 0 ? "吸气 · 走三步" : "呼气 · 走三步";
    } else if (p.kind === "soak") {
      var sPulse = 0.55 + 0.2 * (0.5 + 0.5 * Math.sin(e / 5 * Math.PI));
      $("breathCircle").style.transform = "scale(" + sPulse.toFixed(3) + ")";
      $("practiceCue").textContent = remain <= 60 ? "还有 1 分钟，准备擦干" : "泡着，慢慢呼吸";
    } else if (p.kind === "guided") {
      var a2 = 0;
      for (var j = 0; j < p.steps.length; j++) {
        if (e < a2 + p.steps[j].sec || j === p.steps.length - 1) {
          $("practiceCue").textContent = "第 " + (j + 1) + " / " + p.steps.length + " 步 · " + p.steps[j].text;
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
    if (!T.paused) { T.paused = true; T.pauseAt = performance.now(); cancelAnimationFrame(T.raf); $("practiceCue").textContent = "已暂停"; }
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
      $("practiceCue").textContent = "做完了";
      $("doneTitle").textContent = "做完了 · 这一段 " + mmss(durationOf(p));
      $("donePanel").classList.remove("hidden");
    } else {
      T.done = false;
      $("practiceClock").textContent = mmss(durationOf(p));
      $("practiceCue").textContent = "已停止（练了 " + mmss(spent) + "）。想再来就点「开始」";
      $("breathCircle").style.transform = "scale(.55)";
    }
    T.startAt = 0;
    if (state.view === "practice") updateControls();
  }

  /* ---------- care card ---------- */
  function cardModel() {
    var cond = state.cond, season = state.season, S = D.SEASONS[season];
    var rec = R.recommend(cond, season), top = rec.top[0], place = top ? R.placeById(top.id) : null;
    var care = D.CARE[cond][season], prac = D.PRACTICES[D.PRACTICE_DEFAULT[cond]];
    return {
      seasonLine: S.label + "季" + (season === naturalSeason ? " · " + term + "前后" : "（" + S.months + "）"),
      head: (state.cardShowCond ? condById(cond).label : "按你的情况") + " · 这个" + S.label + "天这样养",
      place: place ? { name: place.name, photo: place.photo, reason: top.reasons[0] } : null,
      items: ["吃：" + care.eat.tip + "多吃" + care.eat.more.split("、").slice(0, 3).join("、") + "。", "动：" + care.move[0], "放松：" + prac.label + "，想起来就做一段。"],
      safety: care.safety
    };
  }
  function renderCard() {
    if (!condById(state.cond)) { go("home", null, true); return; }
    var m = cardModel();
    $("cardShowCond").checked = !!state.cardShowCond;
    var h = "";
    if (m.place) h += '<div class="photo"><img src="' + esc(m.place.photo) + '" alt="' + esc(m.place.name) + '"><span class="credit">' + esc(D.CREDIT) + "</span></div>";
    h += '<div class="care-body"><p class="care-season">' + esc(m.seasonLine) + '</p><p class="care-head">' + esc(m.head) + "</p>";
    if (m.place) h += "<p><b>适合去：</b>" + esc(m.place.name) + '<br><span class="muted small">' + esc(m.place.reason) + "</span></p>";
    h += "<ol>" + m.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
    h += '<p class="care-safe">' + esc(m.safety) + '</p><p class="care-foot">' + esc(D.DISCLAIMER) + " · HeaLoa</p></div>";
    $("cardPreview").innerHTML = h;
    $("savedNote").classList.add("hidden");
    $("sharePanel").classList.add("hidden");
    $("shareNote").classList.add("hidden");
    $("btnOpenShare").textContent = "分享给别人（卡上不含你的身体情况）";
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
  var FONT = '"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
  function wrap(ctx, text, x, y, maxW, lh, log) {
    var line = "", lines = [];
    for (var i = 0; i < text.length; i++) {
      var test = line + text[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = text[i]; } else line = test;
    }
    if (line) lines.push(line);
    lines.forEach(function (l, k) { ctx.fillText(l, x, y + k * lh); });
    if (log) log.push(text);
    return y + lines.length * lh;
  }
  async function privatePng() {
    var m = cardModel(), W = 1080, H = 1560, c = document.createElement("canvas");
    c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#fffdf9"; ctx.fillRect(0, 0, W, H);
    var im = m.place ? await loadImg(m.place.photo) : null;
    coverDraw(ctx, im, 0, 0, W, 560);
    ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(W - 300, 510, 280, 40);
    ctx.fillStyle = "#fff"; ctx.font = "26px " + FONT; ctx.fillText(D.CREDIT, W - 285, 540);
    var y = 640, X = 64, MW = W - 128;
    ctx.fillStyle = "#2f5d50"; ctx.font = "bold 38px " + FONT; ctx.fillText(m.seasonLine, X, y); y += 70;
    ctx.fillStyle = "#26241f"; ctx.font = "bold 56px " + FONT; y = wrap(ctx, m.head, X, y, MW, 70); y += 20;
    ctx.font = "40px " + FONT;
    if (m.place) { y = wrap(ctx, "适合去：" + m.place.name, X, y, MW, 56); ctx.fillStyle = "#5f5a50"; ctx.font = "32px " + FONT; y = wrap(ctx, m.place.reason, X, y, MW, 46) + 20; }
    ctx.fillStyle = "#26241f"; ctx.font = "40px " + FONT;
    m.items.forEach(function (it, i) { y = wrap(ctx, (i + 1) + ". " + it, X, y, MW, 56) + 10; });
    ctx.fillStyle = "#7a3b12"; ctx.font = "32px " + FONT; y = wrap(ctx, m.safety, X, y + 10, MW, 46);
    ctx.fillStyle = "#5f5a50"; ctx.font = "28px " + FONT; wrap(ctx, D.DISCLAIMER + " · HeaLoa", X, H - 60, MW, 40);
    return c.toDataURL("image/png");
  }

  /* ---------- share (secondary): image card + link/QR; no body/feeling data anywhere ---------- */
  function newShareId() {
    var a = new Uint8Array(6), chars = "abcdefghijkmnpqrstuvwxyz23456789", s = "";
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    for (var i = 0; i < a.length; i++) s += chars[a[i] % chars.length];
    return s;
  }
  function buildShare() {
    if (!state.shareUrl) state.shareUrl = location.origin + location.pathname + "?s=" + newShareId();
    var S = D.SEASONS[state.season];
    return {
      url: state.shareUrl,
      title: "HeaLoa · 顺着季节养",
      text: "这个" + S.label + "天怎么养、去哪里养？点一下自己的情况就能看。",
      card: {
        brand: "HeaLoa · 顺着季节养",
        head: "这个" + S.label + "天，顺着季节慢下来",
        sub: "点一下你的情况，马上看这个季节注意什么、吃什么、怎么动、去哪里养",
        photo: D.SEASON_PHOTO[state.season],
        credit: D.CREDIT,
        foot: D.DISCLAIMER
      }
    };
  }
  var lastShareCardText = [];
  async function sharePng(share) {
    var W = 1080, H = 1350, c = document.createElement("canvas"), card = share.card, log = [];
    c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#f6f1e8"; ctx.fillRect(0, 0, W, H);
    coverDraw(ctx, await loadImg(card.photo), 0, 0, W, 620);
    ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(W - 300, 570, 280, 40);
    ctx.fillStyle = "#fff"; ctx.font = "26px " + FONT; ctx.fillText(card.credit, W - 285, 600); log.push(card.credit);
    var X = 64, MW = W - 128;
    ctx.fillStyle = "#2f5d50"; ctx.font = "bold 36px " + FONT; ctx.fillText(card.brand, X, 700); log.push(card.brand);
    ctx.fillStyle = "#26241f"; ctx.font = "bold 60px " + FONT; var y = wrap(ctx, card.head, X, 790, MW, 74, log);
    ctx.fillStyle = "#5f5a50"; ctx.font = "36px " + FONT; wrap(ctx, card.sub, X, y + 16, MW, 52, log);
    var q = qrcode(0, "M"); q.addData(share.url); q.make();
    var n = q.getModuleCount(), size = 250, cell = size / n, qx = X, qy = H - 370;
    ctx.fillStyle = "#fff"; ctx.fillRect(qx - 12, qy - 12, size + 24, size + 24);
    ctx.fillStyle = "#111";
    for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) ctx.fillRect(qx + cc * cell, qy + r * cell, Math.ceil(cell), Math.ceil(cell));
    ctx.fillStyle = "#26241f"; ctx.font = "bold 34px " + FONT; ctx.fillText("扫码，点一下你自己的情况", qx + size + 40, qy + 60); log.push("扫码，点一下你自己的情况");
    ctx.fillStyle = "#5f5a50"; ctx.font = "26px " + FONT; wrap(ctx, share.url.replace(/^https?:\/\//, ""), qx + size + 40, qy + 110, W - (qx + size + 40) - 50, 36, log);
    ctx.font = "24px " + FONT; ctx.fillText(card.foot, X, H - 40); log.push(card.foot);
    lastShareCardText = log;
    return c.toDataURL("image/png");
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
  function openModal(dataUrl, name) {
    $("modalImg").src = dataUrl; $("modalDownload").href = dataUrl; $("modalDownload").setAttribute("download", name);
    $("imgModal").classList.remove("hidden");
  }

  /* ---------- actions (every visible button maps here) ---------- */
  var shareImgData = null;
  var ACTIONS = {
    season: function (el) {
      state.season = el.getAttribute("data-season");
      state.shareUrl = null;
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
      note("savedNote", ok ? "已存在这台手机上，只有你看得到。下次打开 HeaLoa，首页会提醒你。" : "这台手机不允许本地保存，可以点「存成图片」。");
    },
    savePng: function () {
      privatePng().then(function (url) { openModal(url, "healoa-本季养护卡.png"); });
    },
    openShare: function () {
      if (!$("sharePanel").classList.contains("hidden")) {
        $("sharePanel").classList.add("hidden");
        $("btnOpenShare").textContent = "分享给别人（卡上不含你的身体情况）";
        return;
      }
      var share = buildShare();
      $("sharePanel").classList.remove("hidden");
      $("btnOpenShare").textContent = "收起分享";
      $("shareLink").textContent = share.url;
      $("shareQr").innerHTML = qrSvg(share.url);
      sharePng(share).then(function (url) { shareImgData = url; $("shareImg").src = url; });
    },
    shareSend: function () {
      var share = buildShare();
      var payload = { title: share.title, text: share.text, url: share.url };
      if (navigator.share) {
        try { if (shareImgData && navigator.canShare && navigator.canShare({ files: [dataUrlToFile(shareImgData, "healoa.png")] })) payload.files = [dataUrlToFile(shareImgData, "healoa.png")]; } catch (e) {}
        navigator.share(payload).then(function () { logEvent("shared"); note("shareNote", "已打开发送。发不发、发给谁，由你决定。"); }, function () {});
      } else {
        copyText(share.text + " " + share.url).then(function (ok) {
          if (ok) logEvent("shared");
          note("shareNote", ok ? "这台设备不能直接发送，已复制链接和一句介绍，粘贴给对方就行。" : "复制没成功，可以长按上面的链接手动复制。");
        });
      }
    },
    shareCopy: function () {
      var share = buildShare();
      copyText(share.url).then(function (ok) { if (ok) logEvent("shared"); note("shareNote", ok ? "链接已复制。" : "复制没成功，可以长按上面的链接手动复制。"); });
    },
    shareSaveImg: function () {
      var go2 = function (url) { openModal(url, "healoa-分享卡.png"); };
      if (shareImgData) go2(shareImgData); else sharePng(buildShare()).then(go2);
    },
    closeModal: function () { $("imgModal").classList.add("hidden"); },
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
  if (initial === "shared") logEvent("opened");
  show(initial); render();
  try { history.replaceState(snapshot(), "", location.pathname + location.search); } catch (e) {}

  /* test / debug surface (no personal data leaves the device) */
  window.__healoa = {
    version: D.VERSION, state: state, actions: ACTIONS, go: go, buildShare: buildShare,
    elapsedMs: elapsedMs, timer: T, events: function () { return lsGet(LS_EVENTS) || []; },
    lastShareCardText: function () { return lastShareCardText.slice(); },
    cardModel: cardModel
  };
})();
