/* HeaLoa · rule-based recommendation (v2026-09-27-s)
 * Deterministic: same (condition, season) → same result. No randomness, no paid ranking.
 * Places without a photo are never in the top 3.
 */
(function (root) {
  "use strict";
  var D = root.HEALOA_DATA;

  function fmt(n) { return (n < 0 ? "−" + Math.abs(n) : String(n)); }
  function deg(n) { return fmt(n) + "℃"; }

  function placeById(id) {
    for (var i = 0; i < D.PLACES.length; i++) if (D.PLACES[i].id === id) return D.PLACES[i];
    return null;
  }
  function climateOf(place, season) { return D.CLIMATE[place.climate][season]; }

  /* Returns a reason string if the place is「这个季节先不选」for this condition, else null. */
  function skipReason(place, cond, season) {
    var c = climateOf(place, season), S = D.SEASONS[season];
    var minT = Math.min.apply(null, c.months), minIdx = c.months.indexOf(minT);
    var hs = place.attrs.hotspring;
    var seasonAvg = S.label + "季平均 " + deg(c.t);
    if (c.pr >= 8) return seasonAvg + "，日均降水 " + c.pr + " 毫米，正是雨季，出门不方便。";
    if (c.t < -10 && cond !== "quiet") return seasonAvg + "，最冷的月份 " + deg(minT) + "，太冷，进出屋冷热变化大。";
    if (cond === "bp") {
      if (hs && c.t < 0) return "室外" + seasonAvg + "、泉水热，冷热反差大，血压偏高的人这个季节先不选。";
      if (c.t < 8) return seasonAvg + (minT < 0 ? "，" + S.monthNames[minIdx] + "降到 " + deg(minT) : "") + "，偏冷，血压偏高的人先去暖和、温差小的地方。";
      if (minT < 0) return seasonAvg + "，" + S.monthNames[minIdx] + "降到 " + deg(minT) + "，降温快。";
    }
    if (cond === "cold" && !hs && (c.t < 5 || minT < 0)) return seasonAvg + "，" + S.monthNames[minIdx] + " " + deg(minT) + "，怕冷的人这个季节先不选。";
    if (cond === "gut" && c.t < 5) return seasonAvg + "，偏冷，肠胃弱的人先选暖一点的地方。";
    if ((cond === "gut" || cond === "sleep") && !hs && minT < 0) return seasonAvg + "，" + S.monthNames[minIdx] + "已降到 " + deg(minT) + "，早晚冷，夜里更冷。";
    if ((cond === "sleep" || cond === "gut") && c.t > 26 && c.pr > 4) return seasonAvg + "、湿度 " + c.rh + "%、日均降水 " + c.pr + " 毫米，湿热多雨，" + (cond === "sleep" ? "夜里闷。" : "容易贪凉吃冰。");
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

  function tempWord(t) {
    if (t >= 24) return "暖和，不用在冷风里进进出出";
    if (t >= 15) return "不冷不热";
    if (t >= 8) return "偏凉，出门加件外套";
    if (t >= 0) return "偏冷，屋里要暖";
    return "室外冷，出门要穿厚";
  }

  /* Three reasons, two of them with real climate numbers. */
  function reasons(place, cond, season) {
    var c = climateOf(place, season), S = D.SEASONS[season];
    var first = c.months[0], last = c.months[2], spread = Math.max.apply(null, c.months) - Math.min.apply(null, c.months);
    var r1 = S.label + "季（" + S.months + "）平均 " + deg(c.t) + "、湿度 " + c.rh + "%：" + tempWord(c.t) + "。";
    var r2 = S.monthNames[0] + " " + deg(first) + " → " + S.monthNames[2] + " " + deg(last) +
      (spread >= 8 ? "，季节里降温明显，要跟着加衣" : "，季节里温度稳定") +
      "；日均降水 " + c.pr + " 毫米" + (c.pr < 1 ? "，少雨，适合每天出门走走。" : c.pr > 4 ? "，雨多，带伞，多安排屋里的活动。" : "。");
    var r3 = place.fit[cond] || "";
    return r3 ? [r1, r2, r3] : [r1, r2];
  }

  function shortLine(place, cond, season) {
    var c = climateOf(place, season), S = D.SEASONS[season];
    var line = S.label + "季平均 " + deg(c.t) + "、湿度 " + c.rh + "%";
    if (place.attrs.hotspring) line += "，有温泉（41℃ 以下、10 分钟以内）";
    if (place.highAltitude) line += "，海拔约 2000 米，出发前先听专业意见";
    return line + "。";
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
