/* HeaLoa · rule-based recommendation (v2026-09-27-u)
 * Deterministic: same (condition, season) → same result. No randomness, no paid ranking.
 * Places without a photo are never in the top 3.
 * All wording comes from the active locale via t(key) (app/i18n/<locale>.js); no customer text is hard-coded here.
 */
(function (root) {
  "use strict";
  var D = root.HEALOA_DATA, t = root.HEALOA_I18N.t;

  function fmt(n) { return (n < 0 ? "−" + Math.abs(n) : String(n)); }
  /* Units follow the locale (meta.tempUnit "F" → °F for the US-English draft; default ℃). */
  var UNIT = (root.HEALOA_I18N.meta && root.HEALOA_I18N.meta().tempUnit) || "C";
  function deg(n) { return UNIT === "F" ? fmt(Math.round(n * 9 / 5 + 32)) + "°F" : fmt(n) + "℃"; }
  /* Rain: mm per day by default; meta.rainUnit "in/month" → inches per month. */
  var RAIN = (root.HEALOA_I18N.meta && root.HEALOA_I18N.meta().rainUnit) || "mm/day";
  function rain(pr) { return RAIN === "in/month" ? String(Math.round(pr * 30.4 / 25.4 * 10) / 10) : String(pr); }

  function placeById(id) {
    for (var i = 0; i < D.PLACES.length; i++) if (D.PLACES[i].id === id) return D.PLACES[i];
    return null;
  }
  function climateOf(place, season) { return D.CLIMATE[place.climate][season]; }

  /* Returns a reason string if the place should be skipped this season for this condition, else null. */
  function skipReason(place, cond, season) {
    var c = climateOf(place, season), S = D.SEASONS[season];
    var minT = Math.min.apply(null, c.months), minIdx = c.months.indexOf(minT);
    var hs = place.attrs.hotspring;
    var avg = t("rules.seasonAvg", { season: S.label, t: deg(c.t) });
    var month = S.monthNames[minIdx], min = deg(minT);
    if (c.pr >= 8) return t("rules.skipRain", { avg: avg, pr: rain(c.pr) });
    if (c.t < -10 && cond !== "quiet") return t("rules.skipFrigid", { avg: avg, min: min });
    if (cond === "bp") {
      if (hs && c.t < 0) return t("rules.skipBpHotspring", { avg: avg });
      if (c.t < 8) return t("rules.skipBpCold", { avg: avg, dip: minT < 0 ? t("rules.dipTo", { month: month, min: min }) : "" });
      if (minT < 0) return t("rules.skipBpDrop", { avg: avg, month: month, min: min });
    }
    if (cond === "cold" && !hs && (c.t < 5 || minT < 0)) return t("rules.skipColdHands", { avg: avg, month: month, min: min });
    if (cond === "gut" && c.t < 5) return t("rules.skipGutCold", { avg: avg });
    if ((cond === "gut" || cond === "sleep") && !hs && minT < 0) return t("rules.skipNightCold", { avg: avg, month: month, min: min });
    if ((cond === "sleep" || cond === "gut") && c.t > 26 && c.pr > 4) return t("rules.skipHumid", { avg: avg, rh: c.rh, pr: rain(c.pr), tail: t(cond === "sleep" ? "rules.humidTailSleep" : "rules.humidTailGut") });
    return null;
  }

  function score(place, cond, season) {
    var c = climateOf(place, season), a = place.attrs;
    switch (cond) {
      case "bp": return 10 - Math.abs(c.t - 20) / 2 + (c.rh < 80 ? 1 : 0) - (a.hotspring ? 1 : 0);
      case "cold": return c.t / 3 + (a.hotspring ? 3 : 0);
      case "sleep": return 10 - Math.abs(c.t - 16) / 2 + a.quiet * 2 + (a.hotspring ? 1.5 : 0);
      case "gut": return 10 - Math.abs(c.t - 20) / 2 - (c.rh > 82 ? 2 : 0);
      case "tense": return 10 - Math.abs(c.t - 20) / 3 + a.nature * 2;
      case "quiet": return 10 - Math.abs(c.t - 15) / 3 + a.quiet * 3 - (c.t < -10 ? 6 : 0);
    }
    return 0;
  }

  function tempWord(tc) {
    if (tc >= 24) return t("rules.tempWarm");
    if (tc >= 15) return t("rules.tempMild");
    if (tc >= 8) return t("rules.tempCool");
    if (tc >= 0) return t("rules.tempChilly");
    return t("rules.tempCold");
  }

  /* Three reasons, two of them with real climate numbers. */
  function reasons(place, cond, season) {
    var c = climateOf(place, season), S = D.SEASONS[season];
    var first = c.months[0], last = c.months[2], spread = Math.max.apply(null, c.months) - Math.min.apply(null, c.months);
    var r1 = t("rules.reason1", { season: S.label, months: S.months, t: deg(c.t), rh: c.rh, word: tempWord(c.t) });
    var r2 = t("rules.reason2", {
      m1: S.monthNames[0], t1: deg(first), m3: S.monthNames[2], t3: deg(last),
      trend: t(spread >= 8 ? "rules.trendBig" : "rules.trendStable"),
      pr: rain(c.pr), rain: t(c.pr < 1 ? "rules.rainLow" : c.pr > 4 ? "rules.rainHigh" : "rules.rainMid")
    });
    var r3 = place.fit[cond] || "";
    return r3 ? [r1, r2, r3] : [r1, r2];
  }

  function shortLine(place, cond, season) {
    var c = climateOf(place, season), S = D.SEASONS[season];
    var extra = "";
    if (place.attrs.hotspring) extra += t("rules.shortHotspring");
    if (place.highAltitude) extra += t("rules.shortAltitude");
    return t("rules.short", { season: S.label, t: deg(c.t), rh: c.rh, extra: extra });
  }

  function recommend(cond, season) {
    var withPhoto = [], noPhoto = [], skip = [];
    D.PLACES.forEach(function (p) {
      var why = skipReason(p, cond, season);
      if (why) { skip.push({ id: p.id, name: p.name, photo: p.photo, reason: why }); return; }
      var s = score(p, cond, season);
      var item = { id: p.id, name: p.name, photo: p.photo, score: Math.round(s * 100) / 100 };
      (p.photo ? withPhoto : noPhoto).push(item);
    });
    var byScore = function (a, b) { return b.score - a.score || (a.id < b.id ? -1 : 1); };
    withPhoto.sort(byScore); noPhoto.sort(byScore);
    var top = withPhoto.filter(function (x) { return x.score > 0; }).slice(0, 3).map(function (x) {
      var p = placeById(x.id);
      x.reasons = reasons(p, cond, season);
      x.benefit = p.benefit;
      return x;
    });
    var more = noPhoto.filter(function (x) { return x.score > 3; }).map(function (x) {
      x.line = shortLine(placeById(x.id), cond, season);
      return x;
    });
    return { cond: cond, season: season, top: top, skip: skip, more: more };
  }

  function seasonFor(date) {
    var m = date.getMonth() + 1;
    if (m === 12 || m <= 2) return "winter";
    return "autumn"; /* Phase 1 only has autumn + winter; spring/summer fall back to autumn. */
  }

  function solarTermFor(date) {
    var m = date.getMonth() + 1, d = date.getDate(), T = D.SOLAR_TERMS, cur = T[T.length - 1];
    for (var i = 0; i < T.length; i++) {
      if (m > T[i].m || (m === T[i].m && d >= T[i].d)) cur = T[i];
    }
    return cur.name;
  }

  root.HEALOA_RULES = {
    recommend: recommend, reasons: reasons, skipReason: skipReason, score: score,
    placeById: placeById, seasonFor: seasonFor, solarTermFor: solarTermFor, deg: deg
  };
})(typeof window !== "undefined" ? window : globalThis);
