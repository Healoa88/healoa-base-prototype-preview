/* HeaLoa · content structure (v2026-09-28-c · 3D framing clamps; v2026-09-28-b · 3D world slot filled for Wudang; v2026-09-28-a)
 * Language-neutral data only: ids, climate numbers, photos, attributes, timings.
 * Every customer-facing string comes from the active locale (app/i18n/<locale>.js, default zh)
 * via window.HEALOA_I18N.content() and is merged here, so HEALOA_DATA keeps the same shape as before.
 * Wording rules: see PRODUCT_CURRENT.md and tests/wording.mjs.
 * Climate numbers: NASA POWER Climatology API v2.10.0, 2001–2020 monthly means (CC BY 4.0),
 * raw JSON in data/climate/, derived by tools/climate-summary.mjs (checked by tests).
 */
(function (root) {
  "use strict";
  var C = root.HEALOA_I18N.content();

  var VERSION = "v2026-10-05-b";

  /* Six body-state / feeling entries (fixed ids). A locale may present them in its own order (meta.condOrder),
   * e.g. the en/ja drafts lead with "Deep rest"; zh keeps the locked order. */
  var COND_IDS = ["bp", "sleep", "cold", "gut", "tense", "quiet"];
  var order = (root.HEALOA_I18N.meta().condOrder || []).slice();
  if (order.length !== COND_IDS.length || COND_IDS.some(function (id) { return order.indexOf(id) < 0; })) order = COND_IDS;
  var CONDITIONS = order.map(function (id) { return { id: id, label: C.conditions[id] }; });

  var SEASONS = {};
  ["autumn", "winter"].forEach(function (id) {
    var x = C.seasons[id];
    SEASONS[id] = { id: id, label: x.label, months: x.months, monthNames: x.monthNames.slice() };
  });

  /* Solar-term start dates (Beijing time), order = content.solarTerms: 小寒 … 冬至.
   * Exact dates for 2025–2028 (sun's apparent ecliptic longitude 285° + 15°·i, computed with astronomy-engine,
   * matching the official Chinese calendar); other years fall back to SOLAR_TERMS (typical dates, ±1 day). */
  var SOLAR_TERM_DATES = {
    2025: [[1, 5], [1, 20], [2, 3], [2, 18], [3, 5], [3, 20], [4, 4], [4, 20], [5, 5], [5, 21], [6, 5], [6, 21], [7, 7], [7, 22], [8, 7], [8, 23], [9, 7], [9, 23], [10, 8], [10, 23], [11, 7], [11, 22], [12, 7], [12, 21]],
    2026: [[1, 5], [1, 20], [2, 4], [2, 18], [3, 5], [3, 20], [4, 5], [4, 20], [5, 5], [5, 21], [6, 5], [6, 21], [7, 7], [7, 23], [8, 7], [8, 23], [9, 7], [9, 23], [10, 8], [10, 23], [11, 7], [11, 22], [12, 7], [12, 22]],
    2027: [[1, 5], [1, 20], [2, 4], [2, 19], [3, 6], [3, 21], [4, 5], [4, 20], [5, 6], [5, 21], [6, 6], [6, 21], [7, 7], [7, 23], [8, 8], [8, 23], [9, 8], [9, 23], [10, 8], [10, 23], [11, 7], [11, 22], [12, 7], [12, 22]],
    2028: [[1, 6], [1, 20], [2, 4], [2, 19], [3, 5], [3, 20], [4, 4], [4, 19], [5, 5], [5, 20], [6, 5], [6, 21], [7, 6], [7, 22], [8, 7], [8, 22], [9, 7], [9, 22], [10, 8], [10, 23], [11, 7], [11, 22], [12, 6], [12, 21]]
  };
  /* Season starts at 立春 / 立夏 / 立秋 / 立冬 (term index 2 / 8 / 14 / 20). Content exists for autumn + winter only. */
  var SEASON_START_TERM = { spring: 2, summer: 8, autumn: 14, winter: 20 };
  var SEASON_NAMES = {};
  ["spring", "summer", "autumn", "winter"].forEach(function (id) { SEASON_NAMES[id] = root.HEALOA_I18N.t("season." + id); });
  var SOLAR_TERMS = [
    [1, 5], [1, 20], [2, 4], [2, 19], [3, 5], [3, 20], [4, 4], [4, 20], [5, 5], [5, 21], [6, 5], [6, 21],
    [7, 7], [7, 22], [8, 7], [8, 23], [9, 7], [9, 23], [10, 8], [10, 23], [11, 7], [11, 22], [12, 7], [12, 21]
  ].map(function (md, i) { return { m: md[0], d: md[1], name: C.solarTerms[i] }; });

  /* Season means derived from data/climate/*.json (see tools/climate-summary.mjs). */
  var CLIMATE = {
    harbin: { elev: 139, autumn: { t: 4.8, rh: 70, pr: 1.1, months: [15.2, 5.3, -6] }, winter: { t: -16.7, rh: 86, pr: 0.2, months: [-16.7, -19, -14.5] } },
    kunming: { elev: 2021, autumn: { t: 15.4, rh: 77, pr: 2.1, months: [18.8, 15.8, 11.7] }, winter: { t: 8.7, rh: 72, pr: 0.4, months: [8.2, 7.7, 10.1] } },
    kusatsu: { elev: 1036, autumn: { t: 10.6, rh: 88, pr: 4.7, months: [16.9, 10.5, 4.3] }, winter: { t: -3.6, rh: 92, pr: 2.6, months: [-1.6, -5, -4.3] } },
    jpcoast: { elev: 69, autumn: { t: 19.8, rh: 79, pr: 6.7, months: [24.1, 19.8, 15.6] }, winter: { t: 9.4, rh: 71, pr: 2.9, months: [11.1, 8.4, 8.7] } },
    pattaya: { elev: 17, autumn: { t: 27.8, rh: 79, pr: 5.9, months: [28.1, 28, 27.5] }, winter: { t: 26.8, rh: 73, pr: 0.6, months: [26.5, 26.6, 27.4] } },
    phuket: { elev: 11, autumn: { t: 27.3, rh: 84, pr: 10, months: [27.4, 27.2, 27.4] }, winter: { t: 27.2, rh: 81, pr: 2.7, months: [27.1, 26.9, 27.6] } },
    tengchong: { elev: 1730, autumn: { t: 16.7, rh: 81, pr: 2.9, months: [19.6, 17.1, 13.5] }, winter: { t: 10.9, rh: 64, pr: 0.6, months: [10.6, 9.9, 12.2] } },
    wudang: { elev: 398, autumn: { t: 15.2, rh: 73, pr: 2.1, months: [21.2, 15.5, 8.8] }, winter: { t: 2.7, rh: 70, pr: 0.6, months: [2.7, 1.1, 4.2] } },
    xishuangbanna: { elev: 1136, autumn: { t: 19.9, rh: 84, pr: 3.2, months: [22.1, 20.2, 17.3] }, winter: { t: 15.5, rh: 70, pr: 0.7, months: [14.5, 14.7, 17.2] } }
  };

  /* v2026-10-02-a: no overlay credit; no consumer-facing Cindy / Cindy Yang photo credit or blanket copyright line (R10, D-02-01). */

  /* Art direction for every photo the app shows (photo audit 2026-09-27, see assets/places/PHOTO_AUDIT.md):
   * w / h = pixel size, fx / fy = focal point in % (what must stay in frame when the photo is cropped with object-fit: cover
   * or drawn onto a canvas). Portrait photos serve the phone frame and the 9:16 exports; landscape ones serve the wide
   * desktop backdrop. Nothing is ever stretched. */
  var PHOTO_META = {
    "assets/places/wudang/02-terrace-sunrise.jpg": { w: 1170, h: 1560, fx: 50, fy: 42 },
    "assets/places/wudang/03-crane-peaks.jpg": { w: 1080, h: 1916, fx: 42, fy: 55 },
    "assets/places/wudang/vista/01-cliff-pavilion.jpg": { w: 1050, h: 1400, fx: 52, fy: 62 },
    "assets/places/wudang/homestay/01-courtyard-house.jpg": { w: 1050, h: 1400, fx: 52, fy: 62 },
    "assets/places/wudang/homestay/02-window-tea-terrace.jpg": { w: 787, h: 1400, fx: 58, fy: 55 },
    "assets/places/wudang/01-cloud-sea-sun.jpg": { w: 1080, h: 1440, fx: 62, fy: 55 },
    "assets/places/wudang/05-mist-rays.jpg": { w: 810, h: 1080, fx: 40, fy: 40 },
    "assets/places/thai/pool/01-infinity-coast.jpg": { w: 787, h: 1400, fx: 50, fy: 48 },
    "assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg": { w: 1400, h: 1050, fx: 50, fy: 50 },
    "assets/places/thai/pool/03-long-pool-canopy.jpg": { w: 1400, h: 1050, fx: 58, fy: 50 },
    "assets/places/onsen/02-hot-spring-falls.jpg": { w: 787, h: 1400, fx: 62, fy: 48 },
    "assets/places/onsen/01-hot-spring-field-town.jpg": { w: 787, h: 1400, fx: 50, fy: 52 },
    "assets/places/harbin/01-night-snow-roofs.jpg": { w: 1050, h: 1400, fx: 50, fy: 55 },
    "assets/places/harbin/02-night-lanterns-snowman.jpg": { w: 1400, h: 787, fx: 45, fy: 60 },
    "assets/places/harbin/03-day-milk-tea-village.jpg": { w: 1400, h: 787, fx: 50, fy: 62 },
    "assets/places/harbin/04-stairs-street-blue-sky.jpg": { w: 787, h: 1400, fx: 50, fy: 60 },
    "assets/places/harbin/05-snow-roofs-icicles.jpg": { w: 1600, h: 1200, fx: 48, fy: 58 },
    "assets/places/harbin/06-snow-roofs-pines.jpg": { w: 1600, h: 1200, fx: 50, fy: 52 },
    "assets/places/jpcoast/01-feet-sunset-sea.jpg": { w: 1200, h: 1600, fx: 50, fy: 68 },
    "assets/places/jpcoast/02-lounge-sea-sunset.jpg": { w: 1600, h: 1200, fx: 36, fy: 62 },
    "assets/places/jpcoast/03-shrine-facade.jpg": { w: 1600, h: 1200, fx: 50, fy: 72 },
    "assets/places/jpcoast/04-lounge-sea-window.jpg": { w: 1600, h: 696, fx: 50, fy: 48 },
    "assets/places/cabin/04-soup-window-warm.jpg": { w: 1400, h: 1050, fx: 58, fy: 58 },
    "assets/places/cabin/02-cabin-through-birch.jpg": { w: 787, h: 1400, fx: 50, fy: 55 },
    "assets/places/forest/path/01-leaf-tunnel.jpg": { w: 787, h: 1400, fx: 50, fy: 62 },
    "assets/places/wudang/06-courtyard-class.jpg": { w: 1440, h: 1080, fx: 50, fy: 55 },
    "assets/places/wudang/07-zixiao-steps-mist.jpg": { w: 459, h: 689, fx: 48, fy: 58 },
    "assets/practices/01-courtyard-group.jpg": { w: 1280, h: 1707, fx: 48, fy: 55 },
    "assets/practices/02-path-balance.jpg": { w: 1280, h: 1707, fx: 52, fy: 48 },
    "assets/practices/03-indoor-balance.jpg": { w: 1320, h: 1814, fx: 55, fy: 40 },
    "assets/practices/04-indoor-arm-raise.jpg": { w: 1027, h: 1868, fx: 52, fy: 38 },
    "assets/practices/05-courtyard-class.jpg": { w: 1440, h: 1080, fx: 50, fy: 55 },
    "assets/practices/06-zixiao-steps-mist.jpg": { w: 459, h: 689, fx: 48, fy: 58 },
    "assets/practices/07-mountain-balance.jpg": { w: 1200, h: 1600, fx: 46, fy: 46 },
    "assets/practices/08-courtyard-white.jpg": { w: 1200, h: 1600, fx: 50, fy: 58 },
    "assets/practices/09-plaza-form.jpg": { w: 720, h: 1280, fx: 50, fy: 40 },
    "assets/practices/10-path-form.jpg": { w: 1280, h: 720, fx: 58, fy: 46 }

  };
  function focal(src) { var m = PHOTO_META[src]; return m ? m.fx + "% " + m.fy + "%" : "50% 50%"; }
  /* v2026-09-28-a: compressed responsive copies of every photo above (tools/make_sizes.py): <name>-w480 / -w828 / -w1200.webp
   * (only widths below the original) + <name>-wfull.webp (original size). The JPG stays as the <img src> fallback and for the
   * 1080×1920 exports. srcset(src) → the srcset string; sized(src, w) → the smallest copy at least w px wide (CSS backgrounds). */
  var SIZES = [480, 828, 1200];
  function sizeList(src) {
    var m = PHOTO_META[src]; if (!m) return [];
    var base = src.replace(/\.jpg$/, "");
    return SIZES.filter(function (w) { return w < m.w; }).map(function (w) { return { w: w, src: base + "-w" + w + ".webp" }; }).concat([{ w: m.w, src: base + "-wfull.webp" }]);
  }
  function srcset(src) { return sizeList(src).map(function (x) { return x.src + " " + x.w + "w"; }).join(", "); }
  function sized(src, w) { var l = sizeList(src); for (var i = 0; i < l.length; i++) if (l[i].w >= w) return l[i].src; return l.length ? l[l.length - 1].src : src; }

  /* Places. `photo: null` = no photo in the repo yet → not shown anywhere (v4: no "coming soon" list either).
   * v4 matching fields: scenes (main scene first; used for scene answers + top-3 diversity), region (distance answer),
   * effort (0 flat paths … 2 many stone steps; used for the energy answer), action (the real relaxation done "here").
   * Text (name, area, alt, benefit, cindyLine, food, todo, caution, fit) comes from content.places[id].
   * `cindyLine` = Cindy's own signed one-line feeling, per locale; "" until she provides it; empty renders nothing. */
  var PLACE_BASE = [
    /* hero = best portrait from the audit (phone + 9:16); wide = best landscape for the desktop backdrop (null = none yet). */
    {
      id: "wudang", climate: "wudang",
      photo: "assets/places/wudang/02-terrace-sunrise.jpg", wide: "assets/places/wudang/02-terrace-sunrise.jpg", /* best hero; courtyard-class has a crowd */
      gallery: ["assets/places/wudang/03-crane-peaks.jpg", "assets/places/wudang/vista/01-cliff-pavilion.jpg", "assets/places/wudang/homestay/01-courtyard-house.jpg", "assets/places/wudang/homestay/02-window-tea-terrace.jpg"],
      attrs: { quiet: 2, nature: 2, hotspring: false, cozy: 1 },
      scenes: ["mountain", "forest"], region: "cn", effort: 2, action: "walk", actionPhoto: "assets/places/wudang/homestay/01-courtyard-house.jpg"
    },
    {
      id: "pattaya", climate: "pattaya",
      photo: "assets/places/thai/pool/01-infinity-coast.jpg", wide: "assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg",
      gallery: ["assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg", "assets/places/thai/pool/03-long-pool-canopy.jpg"],
      attrs: { quiet: 0, nature: 2, hotspring: false, cozy: 0 },
      scenes: ["sea"], region: "th", effort: 0, action: "breath46"
    },
    {
      id: "onsen", climate: "kusatsu",
      photo: "assets/places/onsen/02-hot-spring-falls.jpg", wide: null,
      gallery: ["assets/places/onsen/01-hot-spring-field-town.jpg"],
      attrs: { quiet: 1, nature: 2, hotspring: true, cozy: 1 },
      scenes: ["hotspring", "forest", "mountain"], region: "jp", effort: 1, action: "soak"
    },
    /* Sea lounge + shrine. Not Kusatsu (that place keeps the yubatake photos). Town is not named:
     * the frames are a window on the sea and a shrine front, and a TV in one lounge is a travel
     * program, not this place. Climate is a Pacific-coast Honshu grid cell (data/climate/jpcoast.json). */
    {
      id: "seashrine", climate: "jpcoast",
      photo: "assets/places/jpcoast/01-feet-sunset-sea.jpg", wide: "assets/places/jpcoast/03-shrine-facade.jpg",
      gallery: ["assets/places/jpcoast/02-lounge-sea-sunset.jpg", "assets/places/jpcoast/03-shrine-facade.jpg"],
      attrs: { quiet: 1, nature: 2, hotspring: true, cozy: 1 },
      scenes: ["sea"], region: "jp", effort: 1, action: "breath46",
      actionPhoto: "assets/places/jpcoast/01-feet-sunset-sea.jpg"
    },
    {
      id: "harbin", climate: "harbin",
      photo: "assets/places/harbin/01-night-snow-roofs.jpg", wide: "assets/places/harbin/06-snow-roofs-pines.jpg",
      gallery: ["assets/places/harbin/06-snow-roofs-pines.jpg", "assets/places/harbin/05-snow-roofs-icicles.jpg", "assets/places/harbin/02-night-lanterns-snowman.jpg", "assets/places/harbin/04-stairs-street-blue-sky.jpg"],
      attrs: { quiet: 1, nature: 1, hotspring: false, cozy: 1 },
      scenes: ["snow"], region: "cn", effort: 1, action: "breath46"
    },
    /* No photo in the repo yet → not shown anywhere (kept for climate data only). */
    { id: "xishuangbanna", climate: "xishuangbanna", photo: null, attrs: { quiet: 1, nature: 2, hotspring: false } },
    { id: "tengchong", climate: "tengchong", photo: null, attrs: { quiet: 1, nature: 2, hotspring: true } },
    { id: "kunming", climate: "kunming", photo: null, attrs: { quiet: 1, nature: 1, hotspring: false }, highAltitude: true },
    { id: "phuket", climate: "phuket", photo: null, attrs: { quiet: 0, nature: 2, hotspring: false } }
  ];
  var PLACE_TEXT = ["name", "area", "alt", "benefit", "cindyLine", "food", "todo", "caution", "kind"];
  var PLACES = PLACE_BASE.map(function (b) {
    var tx = C.places[b.id] || {}, p = {}, k;
    for (k in b) p[k] = b[k];
    PLACE_TEXT.forEach(function (f) { if (tx[f] !== undefined) p[f] = tx[f]; });
    p.fit = tx.fit || {};
    return p;
  });

  /* Season care per (condition × season): content.care. */
  var CARE = C.care;

  /* Default relaxation per condition. Only claim: relaxing right now. */
  var PRACTICE_DEFAULT = { bp: "breath46", sleep: "breathNight", cold: "breath46", gut: "breath46", tense: "walk", quiet: "breath46" };
  /* Safe for everyone (whatever the quiz answers are, so no practice may rely on it): no breath hold longer than
   * MAX_HOLD_SEC anywhere. A "hold" = a breath phase whose circle does not change size (same scale as the phase before). */
  var MAX_HOLD_SEC = 2;

  /* Timings, shapes and photos; label / short / intro / phase names / step texts come from content.practices. */
  var PRACTICE_BASE = {
    breath46: {
      id: "breath46", kind: "breath",
      phases: [{ sec: 4, scale: 1 }, { sec: 6, scale: 0 }],
      durations: [180, 300], defaultDuration: 180,
      photo: "assets/places/wudang/01-cloud-sea-sun.jpg"
    },
    breathNight: {
      id: "breathNight", kind: "breath",
      phases: [{ sec: 4, scale: 1 }, { sec: 6, scale: 0 }],
      rounds: 10, durations: [100, 200], defaultDuration: 100,
      photo: "assets/places/cabin/04-soup-window-warm.jpg"
    },
    walk: {
      id: "walk", kind: "walk",
      cadences: [60, 75, 90], defaultCadence: 75,
      durations: [600, 1200, 1800], defaultDuration: 600,
      photo: "assets/places/forest/path/01-leaf-tunnel.jpg"
    },
    soak: {
      id: "soak", kind: "soak",
      durations: [300, 600], defaultDuration: 600,
      photo: "assets/places/onsen/02-hot-spring-falls.jpg"
    },
    baduanjin1: {
      id: "baduanjin1", kind: "guided",
      steps: [10, 12, 12, 10, 12, 12, 12],
      photo: "assets/practices/09-plaza-form.jpg",
      clip: "assets/practices/clips/plaza-form.mp4",
      poster: "assets/practices/09-plaza-form.jpg",
      stills: [
        "assets/practices/09-plaza-form.jpg",
        "assets/practices/08-courtyard-white.jpg",
        "assets/practices/07-mountain-balance.jpg",
        "assets/practices/04-indoor-arm-raise.jpg",
        "assets/practices/01-courtyard-group.jpg",
        "assets/practices/03-indoor-balance.jpg",
        "assets/practices/02-path-balance.jpg",
        "assets/practices/05-courtyard-class.jpg",
        "assets/practices/06-zixiao-steps-mist.jpg",
        "assets/practices/04-indoor-arm-raise.jpg"
      ]
    },
    taiji1: {
      id: "taiji1", kind: "guided",
      steps: [10, 10, 12, 12, 12, 12],
      photo: "assets/practices/07-mountain-balance.jpg",
      clip: "assets/practices/clips/path-form.mp4",
      poster: "assets/practices/10-path-form.jpg",
      stills: [
        "assets/practices/07-mountain-balance.jpg",
        "assets/practices/10-path-form.jpg",
        "assets/practices/08-courtyard-white.jpg",
        "assets/practices/01-courtyard-group.jpg",
        "assets/practices/02-path-balance.jpg",
        "assets/practices/03-indoor-balance.jpg",
        "assets/practices/04-indoor-arm-raise.jpg",
        "assets/practices/05-courtyard-class.jpg",
        "assets/practices/06-zixiao-steps-mist.jpg"
      ]
    },
    /* v2026-09-27-y 「不爱运动也能做」: 3 minutes sitting on a chair, tiny slow moves, natural breathing (no hold at all). */
    sitEasy: {
      id: "sitEasy", kind: "guided",
      steps: [20, 25, 25, 25, 25, 30, 30],
      photo: "assets/practices/03-indoor-balance.jpg",
      stills: [
        "assets/practices/03-indoor-balance.jpg",
        "assets/practices/01-courtyard-group.jpg",
        "assets/practices/04-indoor-arm-raise.jpg",
        "assets/practices/02-path-balance.jpg",
        "assets/practices/05-courtyard-class.jpg",
        "assets/practices/03-indoor-balance.jpg",
        "assets/practices/06-zixiao-steps-mist.jpg"
      ]
    }
  };
  var PRACTICES = {};
  Object.keys(PRACTICE_BASE).forEach(function (id) {
    var b = PRACTICE_BASE[id], tx = C.practices[id], p = {}, k;
    for (k in b) p[k] = b[k];
    p.label = tx.label; p.short = tx.short; p.intro = tx.intro;
    if (b.phases) p.phases = b.phases.map(function (ph, i) { return { name: tx.phases[i], sec: ph.sec, scale: ph.scale }; });
    if (b.steps) p.steps = b.steps.map(function (sec, i) { return { sec: sec, text: tx.steps[i] }; });
    PRACTICES[id] = p;
  });

  /* At home, when travel is not possible: content.homePlan. */
  var HOME_PLAN = C.homePlan;

  /* v4 matching quiz: 8 questions, one per screen (plan v4 §3). Option ids feed app/match.js via app/kb.js.
   * multi = pick all that fit; exclusive = an option that clears the others ("都还好" …).
   * Q8 options follow the market of the locale (meta.homeRegion): cn / jp → far · near · home; us → drive · nights · asia · home.
   * Question + option texts: content.quiz (q8 options in content.quiz.q8.marketOpts). Answers stay on the phone (R05). */
  var HOME_REGION = root.HEALOA_I18N.meta().homeRegion || "cn";
  var Q8 = HOME_REGION === "us" ? ["drive", "nights", "asia", "home"] : ["far", "near", "home"];
  var QUIZ_BASE = [
    /* v2026-09-27-y: more options (Cindy: "too few choices"); still 8 questions, same multi-select questions (R17). */
    { id: "q1", multi: true, options: ["bp", "sleep", "cold", "gut", "lowEnergy", "stiff", "heavy", "eyes", "fine"], exclusive: ["fine"] },
    { id: "q2", multi: false, options: ["cold", "hot", "same", "unsure"] },
    { id: "q3", multi: false, options: ["dry", "damp", "neither"] },
    { id: "q4", multi: false, options: ["plenty", "soso", "low"] },
    { id: "q5", multi: true, options: ["late", "sitting", "screen", "noexercise", "meals", "iced", "busy", "regular"], exclusive: ["regular"] },
    { id: "q6", multi: true, options: ["tense", "quiet", "air", "fun", "sun", "green", "alone", "calm"], exclusive: ["calm"] },
    { id: "q7", multi: true, options: ["sea", "mountain", "hotspring", "forest", "snow", "view", "cozy", "any"], exclusive: ["any"] },
    { id: "q8", multi: false, options: Q8 }
  ];
  var QUIZ = QUIZ_BASE.map(function (b) {
    var tx = C.quiz[b.id], opts = b.id === "q8" ? tx.marketOpts : tx.opts;
    return { id: b.id, multi: b.multi, exclusive: b.exclusive || [], q: tx.q, hint: tx.hint,
      options: b.options.map(function (id) { return { id: id, label: opts[id] }; }) };
  });

  /* The one real relaxation done "in" each place (plan v4 §5): an existing practice, shown with the place photo. */
  var PLACE_ACTIONS = {};
  PLACE_BASE.forEach(function (b) {
    var tx = C.placeActions && C.placeActions[b.id];
    if (b.photo && b.action && tx) PLACE_ACTIONS[b.id] = { place: b.id, practice: b.action, label: tx.label, short: tx.short, intro: tx.intro, photo: b.actionPhoto || b.photo };
  });
  /* v2026-09-27-y: more things to do in each place — only existing practices, each shown with one of Cindy's photos of
   * that place and a line taken from the place's own 做什么 list. First entry = PLACE_ACTIONS (the main one). */
  var ACTIVITY_BASE = {
    wudang: [{ practice: "taiji1", photo: "assets/places/wudang/02-terrace-sunrise.jpg" }, { practice: "baduanjin1", photo: "assets/places/wudang/homestay/02-window-tea-terrace.jpg" }, { practice: "sitEasy", photo: "assets/places/wudang/vista/01-cliff-pavilion.jpg" }],
    pattaya: [{ practice: "walk", photo: "assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg" }, { practice: "sitEasy", photo: "assets/places/thai/pool/03-long-pool-canopy.jpg" }],
    onsen: [{ practice: "walk", photo: "assets/places/onsen/01-hot-spring-field-town.jpg" }, { practice: "sitEasy", photo: "assets/places/onsen/01-hot-spring-field-town.jpg" }],
    seashrine: [{ practice: "walk", photo: "assets/places/jpcoast/03-shrine-facade.jpg" }, { practice: "sitEasy", photo: "assets/places/jpcoast/01-feet-sunset-sea.jpg" }],
    harbin: [{ practice: "sitEasy", photo: "assets/places/harbin/06-snow-roofs-pines.jpg" }, { practice: "breathNight", photo: "assets/places/harbin/05-snow-roofs-icicles.jpg" }]
  };
  var PLACE_ACTIVITIES = {};
  Object.keys(PLACE_ACTIONS).forEach(function (id) {
    var list = [PLACE_ACTIONS[id]], tx = (C.placeActivities && C.placeActivities[id]) || [];
    (ACTIVITY_BASE[id] || []).forEach(function (b, i) {
      if (tx[i]) list.push({ place: id, practice: b.practice, photo: b.photo, label: tx[i].label, short: tx[i].short, intro: tx[i].intro });
    });
    PLACE_ACTIVITIES[id] = list;
  });

  /* Season mood photos for the share card and home (no link to any condition). Portrait = phone + 9:16 export;
   * wide = desktop backdrop. Picked in the photo audit (assets/places/PHOTO_AUDIT.md). */
  var SEASON_PHOTO = {
    autumn: "assets/places/wudang/02-terrace-sunrise.jpg",
    winter: "assets/places/harbin/01-night-snow-roofs.jpg"
  };
  /* v2026-09-28-a: the reveal opens on a quiet season photo that is not one of the places (so the first card is still a
   * surprise): autumn = mist and sun over the Wudang ridges, winter = the snowy birch path to the cabin. */
  var REVEAL_PHOTO = {
    autumn: "assets/places/wudang/05-mist-rays.jpg",
    winter: "assets/places/cabin/02-cabin-through-birch.jpg"
  };
  var SEASON_WIDE = {
    autumn: "assets/places/wudang/02-terrace-sunrise.jpg", /* best autumn hero; not courtyard-with-people */
    winter: "assets/places/harbin/02-night-lanterns-snowman.jpg"
  };

  /* Practice bed (v2026-10-03-a). src is a 65s calm excerpt of a purchased track (see assets/audio/SOURCES.md).
   * The practice videos themselves have no audio. Without src, the phone synthesises a soft pad. */
  var MUSIC = { src: "assets/audio/sono-bed.mp3", plannedPath: "assets/audio/sono-bed.mp3" };

  /* Immersive view per place (v2026-09-27-y).
   * depth = a depth map made ON THIS MACHINE from Cindy's photo (tools/make_depth.py, Depth Anything V2 Small, Apache-2.0);
   *         the app shifts near / far parts of the photo when you drag or tilt the phone (2.5D).
   * world3d = World Labs Marble world made from this one photo with Cindy's OK (v2026-09-28-b, tools/worldlabs_generate.py).
   *         spz = 500k-splat file (default), spzLow = 100k fallback for weaker phones, pano = the world's panorama; all
   *         downloaded into the repo (no expiring links). scale = semantics_metadata.metric_scale_factor (raw units → metres);
   *         maxWalk = how far (m) you may walk from the photo spot. marbleUrl = the world on marble.worldlabs.ai (PRIVATE:
   *         opens only for Cindy's account; never shown in the app). The app itself never uploads anything. */
  var IMMERSIVE = {
    wudang: {
      photo: "assets/places/wudang/02-terrace-sunrise.jpg", depth: "assets/places/wudang/02-terrace-sunrise-depth.png",
      world3d: {
        spz: "assets/places/wudang/3d/terrace-500k.spz", spzLow: "assets/places/wudang/3d/terrace-100k.spz",
        pano: "assets/places/wudang/3d/terrace-pano.jpg", marbleUrl: "https://marble.worldlabs.ai/world/20ea415f-ad14-4828-a4a4-441f7f1e3c1b",
        scale: 2.44225, maxWalk: 1.2, yaw: 0, pitch: -0.04, fov: 62,
        /* v2026-09-28-c framing: how far the EDGES of the view may go (degrees from the photo direction / horizon); no zoom.
         * Chosen from the v2026-09-28-b shots: beyond ~60° sideways the invented parts get soft, below ~30° the ground
         * and steps smear, above ~42° the sky texture is magnified. hfovWide = horizontal FOV on landscape screens. */
        edgeYaw: 60, edgeDown: 30, edgeUp: 42, hfovWide: 74
      }
    }
  };

  var DISCLAIMER = root.HEALOA_I18N.t("disclaimer");

  root.HEALOA_DATA = {
    VERSION: VERSION, CONDITIONS: CONDITIONS, SEASONS: SEASONS, SOLAR_TERMS: SOLAR_TERMS,
    CLIMATE: CLIMATE, PLACES: PLACES, CARE: CARE, PRACTICES: PRACTICES,
    PRACTICE_DEFAULT: PRACTICE_DEFAULT, DISCLAIMER: DISCLAIMER, PHOTO_META: PHOTO_META, focal: focal, srcset: srcset, sized: sized,
    HOME_PLAN: HOME_PLAN, QUIZ: QUIZ, SEASON_PHOTO: SEASON_PHOTO, REVEAL_PHOTO: REVEAL_PHOTO, SEASON_WIDE: SEASON_WIDE, MUSIC: MUSIC, IMMERSIVE: IMMERSIVE,
    PLACE_ACTIVITIES: PLACE_ACTIVITIES,
    SOLAR_TERM_DATES: SOLAR_TERM_DATES, SEASON_START_TERM: SEASON_START_TERM, SEASON_NAMES: SEASON_NAMES,
    CARE_GENERIC: C.careGeneric, MAX_HOLD_SEC: MAX_HOLD_SEC,
    PLACE_ACTIONS: PLACE_ACTIONS, HOME_REGION: HOME_REGION, MONTHS: C.monthShort, ASIA_LINE: C.asiaLine || "",
    /* v2026-09-28-a: one quiet line per solar term (weather / nature only, no advice), order = content.solarTerms */
    TERM_GREETINGS: C.termGreetings || []
  };
})(typeof window !== "undefined" ? window : globalThis);
