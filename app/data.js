/* HeaLoa · content structure (v2026-09-27-x)
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

  var VERSION = "v2026-09-27-x";

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
    pattaya: { elev: 17, autumn: { t: 27.8, rh: 79, pr: 5.9, months: [28.1, 28, 27.5] }, winter: { t: 26.8, rh: 73, pr: 0.6, months: [26.5, 26.6, 27.4] } },
    phuket: { elev: 11, autumn: { t: 27.3, rh: 84, pr: 10, months: [27.4, 27.2, 27.4] }, winter: { t: 27.2, rh: 81, pr: 2.7, months: [27.1, 26.9, 27.6] } },
    tengchong: { elev: 1730, autumn: { t: 16.7, rh: 81, pr: 2.9, months: [19.6, 17.1, 13.5] }, winter: { t: 10.9, rh: 64, pr: 0.6, months: [10.6, 9.9, 12.2] } },
    wudang: { elev: 398, autumn: { t: 15.2, rh: 73, pr: 2.1, months: [21.2, 15.5, 8.8] }, winter: { t: 2.7, rh: 70, pr: 0.6, months: [2.7, 1.1, 4.2] } },
    xishuangbanna: { elev: 1136, autumn: { t: 19.9, rh: 84, pr: 3.2, months: [22.1, 20.2, 17.3] }, winter: { t: 15.5, rh: 70, pr: 0.7, months: [14.5, 14.7, 17.2] } }
  };

  var CREDIT = "Photo · Cindy Yang";

  /* Places. `photo: null` = no photo in the repo yet → not shown anywhere (v4: no "coming soon" list either).
   * v4 matching fields: scenes (main scene first; used for scene answers + top-3 diversity), region (distance answer),
   * effort (0 flat paths … 2 many stone steps; used for the energy answer), action (the real relaxation done "here").
   * Text (name, area, alt, benefit, cindyLine, food, todo, caution, fit) comes from content.places[id].
   * `cindyLine` = Cindy's own signed one-line feeling, per locale; "" until she provides it; empty renders nothing. */
  var PLACE_BASE = [
    {
      id: "wudang", climate: "wudang",
      photo: "assets/places/wudang/homestay/01-courtyard-house.jpg",
      gallery: ["assets/places/wudang/01-cloud-sea-sun.jpg", "assets/places/wudang/homestay/02-window-tea-terrace.jpg"],
      attrs: { quiet: 2, nature: 2, hotspring: false },
      scenes: ["mountain", "forest"], region: "cn", effort: 2, action: "walk"
    },
    {
      id: "pattaya", climate: "pattaya",
      photo: "assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg",
      gallery: ["assets/places/thai/pool/01-infinity-coast.jpg"],
      attrs: { quiet: 0, nature: 2, hotspring: false },
      scenes: ["sea"], region: "th", effort: 0, action: "breath46"
    },
    {
      id: "onsen", climate: "kusatsu",
      photo: "assets/places/onsen/01-hot-spring-field-town.jpg",
      gallery: ["assets/places/onsen/02-hot-spring-falls.jpg"],
      attrs: { quiet: 1, nature: 2, hotspring: true },
      scenes: ["hotspring", "forest", "mountain"], region: "jp", effort: 1, action: "soak"
    },
    {
      id: "harbin", climate: "harbin",
      photo: "assets/places/harbin/03-day-milk-tea-village.jpg",
      gallery: ["assets/places/harbin/01-night-snow-roofs.jpg"],
      attrs: { quiet: 1, nature: 1, hotspring: false },
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
  /* Safe for everyone (only one condition can be picked, so no practice may rely on it): no breath hold longer than
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
      photo: "assets/places/wudang/homestay/02-window-tea-terrace.jpg"
    },
    taiji1: {
      id: "taiji1", kind: "guided",
      steps: [10, 10, 12, 12, 12, 12],
      photo: "assets/places/wudang/01-cloud-sea-sun.jpg"
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
    { id: "q1", multi: true, options: ["bp", "sleep", "cold", "gut", "lowEnergy", "stiff", "fine"], exclusive: ["fine"] },
    { id: "q2", multi: false, options: ["cold", "hot", "same", "unsure"] },
    { id: "q3", multi: false, options: ["dry", "damp", "neither"] },
    { id: "q4", multi: false, options: ["plenty", "soso", "low"] },
    { id: "q5", multi: true, options: ["late", "sitting", "meals", "iced", "regular"], exclusive: ["regular"] },
    { id: "q6", multi: true, options: ["tense", "quiet", "air", "fun", "calm"], exclusive: ["calm"] },
    { id: "q7", multi: true, options: ["sea", "mountain", "hotspring", "forest", "snow", "any"], exclusive: ["any"] },
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
    if (b.photo && b.action && tx) PLACE_ACTIONS[b.id] = { place: b.id, practice: b.action, label: tx.label, short: tx.short, intro: tx.intro, photo: b.photo };
  });

  /* Season mood photos for the share card (no link to any condition). */
  var SEASON_PHOTO = {
    autumn: "assets/places/wudang/01-cloud-sea-sun.jpg",
    winter: "assets/places/cabin/01-porch-frost-forest.jpg"
  };

  var DISCLAIMER = root.HEALOA_I18N.t("disclaimer");

  root.HEALOA_DATA = {
    VERSION: VERSION, CONDITIONS: CONDITIONS, SEASONS: SEASONS, SOLAR_TERMS: SOLAR_TERMS,
    CLIMATE: CLIMATE, PLACES: PLACES, CARE: CARE, PRACTICES: PRACTICES,
    PRACTICE_DEFAULT: PRACTICE_DEFAULT, CREDIT: CREDIT, DISCLAIMER: DISCLAIMER,
    HOME_PLAN: HOME_PLAN, QUIZ: QUIZ, SEASON_PHOTO: SEASON_PHOTO,
    SOLAR_TERM_DATES: SOLAR_TERM_DATES, SEASON_START_TERM: SEASON_START_TERM, SEASON_NAMES: SEASON_NAMES,
    CARE_GENERIC: C.careGeneric, MAX_HOLD_SEC: MAX_HOLD_SEC,
    PLACE_ACTIONS: PLACE_ACTIONS, HOME_REGION: HOME_REGION, MONTHS: C.monthShort, ASIA_LINE: C.asiaLine || ""
  };
})(typeof window !== "undefined" ? window : globalThis);
