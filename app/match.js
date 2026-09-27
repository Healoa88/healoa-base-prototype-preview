/* HeaLoa · matching engine (v4 Phase 1). Pure and deterministic: same answers + season + solar term → same result.
 * Order (plan v4 §4.1):
 *   1. safety exclusions first — hard rules from app/rules.js skipReason() for every body state the user picked
 *      (NASA POWER climate means, not a traditional-medicine inference). An excluded place never reaches the top 3.
 *   2. climate + scene preference points — answer → tag weights from app/kb.js (layers climate / scene / distance).
 *      The tcm layer is in the schema but every weight is null (pending Cindy's materials) → counts as 0.
 *   3. × solar-term multiplier — the month the current solar term falls in (e.g. 寒露 → October) is compared with the
 *      user's comfort band, so the same place scores differently in 白露 and 霜降.
 *   4. diversity — at most one place per main scene in the top 3.
 *   5. reasons — the answer-related reasons first (only tags that really added points), then climate numbers.
 * Only places with a real photo take part (places without one are not shown anywhere).
 * Nothing here is sent anywhere: answers stay on the phone (rule R05).
 */
(function (root) {
  "use strict";
  var D = root.HEALOA_DATA, R = root.HEALOA_RULES, KB = root.HEALOA_KB, t = root.HEALOA_I18N.t;
  var BODY = ["bp", "sleep", "cold", "gut"]; /* Q1 options that are body states with safety rules */
  var BASE = 10;

  function has(a, q, id) { return !!(a && a[q] && a[q].indexOf(id) >= 0); }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function round2(x) { return Math.round(x * 100) / 100; }

  /* Normalise answers: every question → array of option ids (unknown ids dropped). */
  function clean(answers) {
    var out = {};
    D.QUIZ.forEach(function (q) {
      var ids = q.options.map(function (o) { return o.id; });
      var v = answers && answers[q.id];
      v = Array.isArray(v) ? v : v ? [v] : [];
      out[q.id] = v.filter(function (x, i) { return ids.indexOf(x) >= 0 && v.indexOf(x) === i; });
      if (!q.multi) out[q.id] = out[q.id].slice(0, 1);
    });
    return out;
  }

  /* Body states used for the safety pass and for the season card's condition (never shared). */
  function conds(a) {
    var c = BODY.filter(function (id) { return has(a, "q1", id); });
    if (has(a, "q6", "tense")) c.push("tense");
    if (has(a, "q6", "quiet") || has(a, "q1", "sleep")) c.push("quiet");
    return c;
  }
  function primaryCond(a) {
    var c = conds(a);
    return c.length ? c[0] : "quiet";
  }
  /* Safety conditions: the body states picked in Q1; with none, the calmest general rule set applies
   * ("quiet" only when the user asked for quiet; otherwise null = the general frigid / rainy-season rules). */
  function safetyConds(a) {
    var c = BODY.filter(function (id) { return has(a, "q1", id); });
    if (c.length) return c;
    if (has(a, "q6", "quiet")) return ["quiet"];
    if (has(a, "q6", "tense")) return ["tense"];
    return [null];
  }
  function excludeReason(place, a, season) {
    var cs = safetyConds(a);
    for (var i = 0; i < cs.length; i++) { var why = R.skipReason(place, cs[i], season); if (why) return why; }
    return null;
  }

  function weightsFor(a) {
    var w = {};
    KB.answerWeights.forEach(function (x) {
      var parts = x.answer.split(":");
      if (!has(a, parts[0], parts[1])) return;
      var v = typeof x.weight === "number" ? x.weight : 0; /* null (pending) → 0 */
      if (x.layer === "tcm") v = 0; /* tcm layer switched off until Cindy's materials are confirmed */
      if (v) w[x.tag] = (w[x.tag] || 0) + v;
    });
    return w;
  }

  /* Month (1–12) in which a solar term index starts (exact dates for known years). */
  function termMonth(termIndex, year) {
    var T = (D.SOLAR_TERM_DATES && D.SOLAR_TERM_DATES[year]) || D.SOLAR_TERMS.map(function (x) { return [x.m, x.d]; });
    return T[termIndex][0];
  }
  var SEASON_MONTHS = { autumn: [9, 10, 11], winter: [12, 1, 2] };
  /* Mean temperature of the term's month when it lies in the shown season, else the season mean. */
  function termTemp(place, season, termIndex, year) {
    var c = D.CLIMATE[place.climate][season], m = termMonth(termIndex, year), i = SEASON_MONTHS[season].indexOf(m);
    return i >= 0 ? c.months[i] : c.t;
  }
  function comfortIdeal(w) {
    if ((w.want_warm || 0) > (w.want_cool || 0)) return 24;
    if ((w.want_cool || 0) > (w.want_warm || 0)) return 16;
    return 20;
  }
  /* 0.8 … 1.2: how comfortable the place is in the month of the current solar term. */
  function termMultiplier(place, season, termIndex, year, w) {
    var tm = termTemp(place, season, termIndex, year), gap = Math.min(Math.abs(tm - comfortIdeal(w)), 20);
    return round2(1 + 0.2 * (1 - gap / 10));
  }

  /* Points per tag for one place (climate + scene layers). Returns [{tag, pts}] with non-zero points. */
  function tagPoints(place, season, w) {
    var c = D.CLIMATE[place.climate][season], at = place.attrs, sc = place.scenes || [], out = [];
    var minT = Math.min.apply(null, c.months), spread = Math.max.apply(null, c.months) - minT;
    function add(tag, pts) { if (w[tag] && pts) out.push({ tag: tag, pts: round2(w[tag] * pts) }); }
    /* a hot-spring town counts as warming for someone who runs cold (same idea as app/rules.js: cold → hot spring +3) */
    add("want_warm", place.attrs.hotspring ? Math.max(0.5, clamp((c.t - 12) / 12, -1, 1)) : clamp((c.t - 12) / 12, -1, 1));
    add("want_cool", clamp(1 - Math.abs(c.t - 16) / 8, -1, 1));
    add("even_temp", spread >= 8 || minT < 8 ? -0.5 : clamp(1 - Math.abs(c.t - 21) / 10, -1, 1));
    add("avoid_damp", c.rh >= 82 || c.pr > 4 ? -1 : c.rh < 78 ? 0.5 : 0);
    add("avoid_dry", c.rh < 60 ? -1 : 0.3);
    add("gentle_pace", place.effort ? -place.effort / 2 : 0.5);
    add("active_ok", place.effort ? place.effort / 2 : 0);
    add("quiet", (at.quiet - 1) * 1);
    add("nature", (at.nature - 1) * 1);
    add("open_view", sc.indexOf("sea") >= 0 || sc.indexOf("mountain") >= 0 ? 1 : 0);
    add("lively", at.quiet === 0 ? 1 : -0.5);
    ["sea", "mountain", "hotspring", "forest", "snow"].forEach(function (s) { add("scene_" + s, sc.indexOf(s) >= 0 ? 1 : 0); });
    return out;
  }
  /* Distance: "weekend, somewhere near" (us: "a weekend drive") → places in the home region weigh more
   * (zh → cn, ja → jp, en → us; there are no US places with photos yet, so for en every place weighs the same). */
  function distanceMultiplier(place, a, market) {
    if (has(a, "q8", "near") || has(a, "q8", "drive")) return place.region === market ? 1.3 : 0.8;
    return 1;
  }

  /* used = tags already explained on an earlier card: they go last, so the 3 cards read differently. */
  function answerReasons(place, season, parts, dm, used) {
    used = used || {};
    var c = D.CLIMATE[place.climate][season], S = D.SEASONS[season], out = [];
    var minT = Math.min.apply(null, c.months);
    var vars = { season: S.label, t: R.deg(c.t), rh: c.rh, min: R.deg(minT) };
    /* "warm" is only said where the season average really is warm (≥ 20°); a cooler hot-spring town says hot spring instead */
    parts = parts.map(function (p) {
      if (p.tag !== "want_warm" || c.t >= 20) return p;
      return place.attrs.hotspring ? { tag: "warm_spring", pts: p.pts } : { tag: p.tag, pts: 0 };
    });
    parts.filter(function (p) { return p.pts > 0 && t("match.r." + p.tag) !== "match.r." + p.tag; })
      .sort(function (x, y) { return (used[x.tag] ? 1 : 0) - (used[y.tag] ? 1 : 0) || y.pts - x.pts || (x.tag < y.tag ? -1 : 1); })
      .forEach(function (p) { out.push({ tag: p.tag, text: t("match.r." + p.tag, vars) }); });
    if (dm > 1) out.push({ tag: "near", text: t("match.r.near") });
    return out;
  }

  function match(answers, opts) {
    opts = opts || {};
    var a = clean(answers), season = opts.season || "autumn", termIndex = opts.termIndex != null ? opts.termIndex : D.SEASON_START_TERM[season];
    var year = opts.year || 2026, market = opts.market || D.HOME_REGION || "cn";
    var w = weightsFor(a), eligible = [], excluded = [];
    D.PLACES.forEach(function (p) {
      if (!p.photo) return; /* no real photo → not shown anywhere */
      var why = excludeReason(p, a, season);
      if (why) { excluded.push({ id: p.id, name: p.name, reason: why }); return; }
      var parts = tagPoints(p, season, w), pts = parts.reduce(function (s, x) { return s + x.pts; }, 0);
      var tm = termMultiplier(p, season, termIndex, year, w), dm = distanceMultiplier(p, a, market);
      var score = round2(Math.max(0.1, (BASE + pts) * tm * dm));
      eligible.push({ id: p.id, score: score, points: round2(pts), termMult: tm, distMult: dm, parts: parts });
    });
    eligible.sort(function (x, y) { return y.score - x.score || (x.id < y.id ? -1 : 1); });
    var top = [], usedScene = {};
    eligible.forEach(function (e) {
      if (top.length >= 3) return;
      var p = R.placeById(e.id), main = (p.scenes || [])[0] || p.id;
      if (usedScene[main]) return;
      usedScene[main] = true;
      top.push(e);
    });
    var pc = primaryCond(a), usedTags = {};
    top.forEach(function (e) {
      var p = R.placeById(e.id), picked = answerReasons(p, season, e.parts, e.distMult, usedTags).slice(0, 2);
      picked.forEach(function (x) { usedTags[x.tag] = true; });
      var ar = picked.map(function (x) { return x.text; }), climate = R.reasons(p, pc, season);
      e.answerReasons = ar;
      e.fitLine = p.fit[pc] || "";
      e.reasons = ar.concat(ar.length < 2 && e.fitLine ? [e.fitLine] : []).concat([climate[0]]);
      if (e.reasons.length < 2) e.reasons.push(climate[1]);
      e.climateReasons = climate.slice(0, 2);
    });
    var practice = null;
    KB.practiceHints.forEach(function (h) { var q = h.answer.split(":"); if (!practice && has(a, q[0], q[1])) practice = h.practice; });
    return {
      season: season, termIndex: termIndex, answers: a, conds: conds(a), primaryCond: pc,
      top: top, ranked: eligible, excluded: excluded,
      practiceId: practice || D.PRACTICE_DEFAULT[pc] || "breath46",
      atHome: has(a, "q8", "home"), asia: has(a, "q8", "asia"), weights: w
    };
  }

  /* Display gate for sourced content (eat / do / avoid / suits from the knowledge base):
   * shown only with text and a sourceRef to a verified source. */
  function sourced(items) {
    var ok = {};
    (KB.sources || []).forEach(function (s) { if (s && s.id && s.verified === true) ok[s.id] = true; });
    return (items || []).filter(function (x) { return x && x.text && x.sourceRef && ok[x.sourceRef]; });
  }
  /* Sourced advice for a solar term; with answers, only lines whose tag one of the answers points to (any layer). */
  function adviceFor(termIndex, type, answers) {
    var a = answers ? clean(answers) : null, tags = null;
    if (a) { tags = {}; KB.answerWeights.forEach(function (x) { var q = x.answer.split(":"); if (has(a, q[0], q[1])) tags[x.tag] = true; }); }
    return sourced(KB.seasonAdvice.filter(function (x) { return x.solarTerm === termIndex && (!type || x.type === type) && (!tags || tags[x.tag]); }));
  }
  /* Answers a single body state / feeling maps to (used when a saved card or an old link names one state). */
  function answersForCond(cond) {
    if (BODY.indexOf(cond) >= 0) return { q1: [cond] };
    if (cond === "tense" || cond === "quiet") return { q6: [cond] };
    return {};
  }

  root.HEALOA_MATCH = {
    match: match, clean: clean, conds: conds, primaryCond: primaryCond, sourced: sourced, adviceFor: adviceFor,
    answersForCond: answersForCond, termMultiplier: termMultiplier, termMonth: termMonth, weightsFor: weightsFor, BASE: BASE
  };
})(typeof window !== "undefined" ? window : globalThis);
