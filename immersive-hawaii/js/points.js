/* HeaLoa immersive sample · 积分 (points) data module — LOCAL ONLY (localStorage).
 * Interface designed so a future backend can replace the storage layer:
 *   const P = HLPoints.create({ storage, now, dayKey });
 *   P.earn(event, meta?) -> { ok, points, reason }   // applies RULES caps
 *   P.balance() -> number
 *   P.history() -> [{ event, points, at, day, meta }]
 *   P.canEarn(event) -> boolean
 *   P.rules -> RULES (read-only)
 * Demo points have NO cash value and cannot be redeemed. Referral reward for the SHARER is NOT
 * implemented here on purpose: it needs server-side verification (see POINTS_REFERRAL_SPEC.md).
 */
(function (root) {
  'use strict';
  var RULES = {
    first_visit:      { points: 10, cap: 'once',  zh: '第一次来' },
    place_companion:  { points: 20, cap: 'daily', zh: '放入小伙伴' },
    leave_line:       { points: 10, cap: 'daily', zh: '留一句话' },
    daily_return:     { points: 15, cap: 'daily', zh: '今天回来看看' },
    nurture:          { points: 5,  cap: 'daily', zh: '照顾小树' },
    make_postcard:    { points: 5,  cap: 'daily', zh: '做明信片' },
    make_video:       { points: 20, cap: 'daily', zh: '做小视频' },
    share:            { points: 10, cap: 'daily', zh: '分享' },
    mango_pick:       { points: 15, cap: 'once',  zh: '摘到芒果' },
    referral_welcome: { points: 30, cap: 'once',  zh: '朋友邀请的见面礼' }
    // referral_sharer: server-only, NOT BUILT (cannot be verified on-device)
  };
  var KEY = 'healoa.immersive.hawaii.points.v1';
  function todayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function create(opts) {
    opts = opts || {};
    var storage = opts.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    var now = opts.now || function () { return Date.now(); };
    var dayKey = opts.dayKey || function () { return todayKey(new Date(now())); };
    function load() { try { return JSON.parse(storage.getItem(KEY)) || { h: [] }; } catch (e) { return { h: [] }; } }
    function save(s) { try { storage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
    function canEarn(event, s) {
      var r = RULES[event]; if (!r) return false; s = s || load();
      if (r.cap === 'once') return !s.h.some(function (x) { return x.event === event; });
      if (r.cap === 'daily') { var d = dayKey(); return !s.h.some(function (x) { return x.event === event && x.day === d; }); }
      return true;
    }
    return {
      rules: RULES,
      canEarn: function (e) { return canEarn(e); },
      earn: function (event, meta) {
        var r = RULES[event]; if (!r) return { ok: false, points: 0, reason: 'unknown_event' };
        var s = load(); if (!canEarn(event, s)) return { ok: false, points: 0, reason: 'capped' };
        s.h.push({ event: event, points: r.points, at: now(), day: dayKey(), meta: meta || null }); save(s);
        return { ok: true, points: r.points, reason: 'ok' };
      },
      balance: function () { return load().h.reduce(function (a, x) { return a + x.points; }, 0); },
      history: function () { return load().h.slice(); },
      reset: function () { try { storage.removeItem(KEY); } catch (e) {} }
    };
  }
  var api = { create: create, RULES: RULES, todayKey: todayKey, KEY: KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HLPoints = api;
})(typeof window !== 'undefined' ? window : globalThis);
