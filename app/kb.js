/* HeaLoa · matching knowledge base (v4 Phase 1) — structure only, content pending Cindy's materials.
 * Plan: docs HeaLoa-Base 疗愈App方案v4 §4.2. Language-neutral: ids, weights, statuses. No customer copy lives here
 * except sourced season advice (seasonAdvice[].text), and there is none yet.
 *
 * Layers (scoring order is in app/match.js):
 *   safety  — hard exclusions, reuses the climate rules in app/rules.js (NASA POWER 2001–2020 means). Not from this file.
 *   climate — temperature / humidity preference points (weights below; not a traditional-medicine inference).
 *   scene   — sea / mountain / hot spring / forest / snow, quiet / open / lively.
 *   practice— which relaxation to offer first (no score).
 *   tcm     — Cindy's verified materials (Wudang). EVERY weight is null (= 0) and status "pending-cindy" until she
 *             provides the materials and confirms each line. Nothing in this layer is displayed or scored before that.
 *
 * Display rule (enforced by app/match.js sourced() and tests/match.mjs + rule R16):
 *   an eat / do / avoid / "suits" sentence is shown ONLY if it has text AND a sourceRef that points at a source in
 *   `sources` with verified === true. No sourceRef → not shown. weight null → counted as 0.
 */
(function (root) {
  "use strict";
  root.HEALOA_KB = {
    schemaVersion: 1,
    status: "pending-cindy",
    /* Cindy's materials. Empty until she provides them; verifiedBy is internal only and never rendered. */
    sources: [],
    /* Answer → tag weights. Answer ids: q1..q8 option ids from app/data.js QUIZ. */
    answerWeights: [
      { answer: "q2:cold", tag: "want_warm", weight: 3, layer: "climate" },
      { answer: "q1:cold", tag: "want_warm", weight: 2, layer: "climate" },
      { answer: "q2:hot", tag: "want_cool", weight: 3, layer: "climate" },
      { answer: "q1:bp", tag: "even_temp", weight: 3, layer: "climate" },
      { answer: "q3:damp", tag: "avoid_damp", weight: 3, layer: "climate" },
      { answer: "q3:dry", tag: "avoid_dry", weight: 2, layer: "climate" },
      { answer: "q4:low", tag: "gentle_pace", weight: 3, layer: "scene" },
      { answer: "q1:lowEnergy", tag: "gentle_pace", weight: 1.5, layer: "scene" },
      { answer: "q4:soso", tag: "gentle_pace", weight: 1, layer: "scene" },
      { answer: "q4:plenty", tag: "active_ok", weight: 1, layer: "scene" },
      { answer: "q1:sleep", tag: "quiet", weight: 1.5, layer: "scene" },
      { answer: "q6:quiet", tag: "quiet", weight: 2, layer: "scene" },
      { answer: "q6:tense", tag: "nature", weight: 1.5, layer: "scene" },
      { answer: "q6:air", tag: "open_view", weight: 2, layer: "scene" },
      { answer: "q6:fun", tag: "lively", weight: 2.5, layer: "scene" },
      { answer: "q7:sea", tag: "scene_sea", weight: 8, layer: "scene" },
      { answer: "q7:mountain", tag: "scene_mountain", weight: 8, layer: "scene" },
      { answer: "q7:hotspring", tag: "scene_hotspring", weight: 8, layer: "scene" },
      { answer: "q7:forest", tag: "scene_forest", weight: 8, layer: "scene" },
      { answer: "q7:snow", tag: "scene_snow", weight: 8, layer: "scene" },
      { answer: "q8:near", tag: "near_home", weight: 1, layer: "distance" },
      /* v2026-09-27-y: the new options reuse the same climate / scene tags (no new inference; nothing traditional-medicine) */
      { answer: "q1:heavy", tag: "gentle_pace", weight: 1.5, layer: "scene" },
      { answer: "q1:eyes", tag: "open_view", weight: 1, layer: "scene" },
      { answer: "q1:eyes", tag: "nature", weight: 1, layer: "scene" },
      { answer: "q5:noexercise", tag: "gentle_pace", weight: 1.5, layer: "scene" },
      { answer: "q5:screen", tag: "nature", weight: 1, layer: "scene" },
      { answer: "q5:busy", tag: "quiet", weight: 1, layer: "scene" },
      { answer: "q6:sun", tag: "want_warm", weight: 1.5, layer: "climate" },
      { answer: "q6:sun", tag: "open_view", weight: 1, layer: "scene" },
      { answer: "q6:green", tag: "nature", weight: 2, layer: "scene" },
      { answer: "q6:alone", tag: "quiet", weight: 1.5, layer: "scene" },
      { answer: "q7:view", tag: "open_view", weight: 4, layer: "scene" },
      { answer: "q7:cozy", tag: "cozy", weight: 4, layer: "scene" },
      /* traditional-medicine layer: placeholders only (tag ids are neutral; Cindy chooses the categories and names) */
      { answer: "q2:cold", tag: "tcm_pending_1", weight: null, layer: "tcm", status: "pending-cindy", sourceRef: null },
      { answer: "q3:dry", tag: "tcm_pending_2", weight: null, layer: "tcm", status: "pending-cindy", sourceRef: null },
      { answer: "q3:damp", tag: "tcm_pending_3", weight: null, layer: "tcm", status: "pending-cindy", sourceRef: null },
      { answer: "q4:low", tag: "tcm_pending_4", weight: null, layer: "tcm", status: "pending-cindy", sourceRef: null },
      { answer: "q5:late", tag: "tcm_pending_5", weight: null, layer: "tcm", status: "pending-cindy", sourceRef: null },
      { answer: "q5:iced", tag: "tcm_pending_5", weight: null, layer: "tcm", status: "pending-cindy", sourceRef: null },
      { answer: "q5:meals", tag: "tcm_pending_5", weight: null, layer: "tcm", status: "pending-cindy", sourceRef: null },
      { answer: "q6:tense", tag: "tcm_pending_6", weight: null, layer: "tcm", status: "pending-cindy", sourceRef: null }
    ],
    /* Practice layer: which relaxation to offer first (ids from app/data.js PRACTICES). */
    practiceHints: [
      { answer: "q1:sleep", practice: "breathNight" },
      { answer: "q5:noexercise", practice: "sitEasy" },
      { answer: "q1:heavy", practice: "sitEasy" },
      { answer: "q6:tense", practice: "walk" },
      { answer: "q1:stiff", practice: "walk" },
      { answer: "q5:sitting", practice: "walk" }
    ],
    /* Per solar term × tag: eat / do / avoid. text + sourceRef stay null until Cindy confirms each line → never shown. */
    seasonAdvice: [
      { solarTerm: 18, tag: "tcm_pending_1", type: "eat", text: null, sourceRef: null, status: "pending-cindy" },
      { solarTerm: 18, tag: "tcm_pending_5", type: "avoid", text: null, sourceRef: null, status: "pending-cindy" }
    ],
    /* Per place: "suits" tags (who it suits, traditional-medicine view) — pending. */
    placeSuits: { wudang: null, pattaya: null, onsen: null, harbin: null }
  };
})(typeof window !== "undefined" ? window : globalThis);
