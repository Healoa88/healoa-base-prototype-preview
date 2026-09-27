/**
 * Scoring-engine unit tests (v2026-09-27-x, plan v4 §4): app/match.js + app/kb.js, no browser.
 * Order under test: 1 safety exclusions (app/rules.js climate rules, per picked body state) →
 * 2 climate + scene points from the answers → 3 × multiplier for the current solar term (→ distance).
 * The traditional-medicine layer exists in the schema but is switched off (weights null → 0) until Cindy's materials.
 * Personas below show different top-3 lists for different answer sets, and safety exclusions that hold.
 * Run: node tests/match.mjs
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail != null ? " — " + (typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 400) : ""}`);
}
const FILES = ["app/i18n/zh.js", "app/i18n/en.js", "app/i18n/ja.js", "app/i18n/es.js", "app/i18n/i18n.js", "app/social.js", "app/share-targets.js", "app/data.js", "app/rules.js", "app/kb.js", "app/match.js"];
function load() {
  const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  return ctx;
}
const ctx = load();
const D = ctx.HEALOA_DATA, R = ctx.HEALOA_RULES, M = ctx.HEALOA_MATCH, KB = ctx.HEALOA_KB;
const T = Object.fromEntries(D.SOLAR_TERMS.map((t, i) => [t.name, i]));
const AUTUMN = { season: "autumn", termIndex: T["寒露"] }, WINTER = { season: "winter", termIndex: T["冬至"] };

const PERSONAS = {
  coldBeach: { q1: ["cold"], q2: ["cold"], q7: ["sea"], q8: ["far"] },
  hotQuietMountain: { q2: ["hot"], q6: ["quiet"], q7: ["mountain"] },
  bpSleepQuiet: { q1: ["bp", "sleep"], q6: ["quiet"] },
  onsenLover: { q2: ["cold"], q4: ["low"], q7: ["hotspring"] },
  snowFun: { q4: ["plenty"], q6: ["fun"], q7: ["snow"] },
  nearWeekend: { q6: ["tense"], q8: ["near"] },
  none: {},
};
const top3 = (a, o) => M.match(a, o).top.map((x) => x.id);
const table = {};
for (const [name, a] of Object.entries(PERSONAS)) {
  const au = M.match(a, AUTUMN), wi = M.match(a, WINTER);
  table[name] = { autumn: au.top.map((x) => x.id).join(" > "), autumnOut: au.excluded.map((x) => x.id).join(","), winter: wi.top.map((x) => x.id).join(" > "), winterOut: wi.excluded.map((x) => x.id).join(",") };
}
console.log("\nPersona top-3 (寒露 / 冬至; excluded = set aside by the safety rules):");
console.table(table);

// 1. different answers → different top places
{
  const au = Object.values(table).map((r) => r.autumn), top1 = new Set(Object.keys(PERSONAS).map((n) => top3(PERSONAS[n], AUTUMN)[0]));
  check(`different answer sets give different top-3 (寒露): ${new Set(au).size} distinct lists across ${au.length} personas, ${top1.size} distinct first places`, new Set(au).size >= 5 && top1.size >= 3, [...top1]);
  check("coldBeach → 芭提雅 first (warm + sea); hotQuietMountain → 武当山 first; onsenLover → 草津 first",
    top3(PERSONAS.coldBeach, AUTUMN)[0] === "pattaya" && top3(PERSONAS.hotQuietMountain, AUTUMN)[0] === "wudang" && top3(PERSONAS.onsenLover, AUTUMN)[0] === "onsen",
    { coldBeach: top3(PERSONAS.coldBeach, AUTUMN), hotQuietMountain: top3(PERSONAS.hotQuietMountain, AUTUMN), onsenLover: top3(PERSONAS.onsenLover, AUTUMN) });
  check("snowFun: 哈尔滨 ranks first when nothing excludes it (寒露)", top3(PERSONAS.snowFun, AUTUMN)[0] === "harbin", top3(PERSONAS.snowFun, AUTUMN));
}
// 2. safety first: excluded places never score, and each exclusion comes from the climate rules for a picked body state
{
  const bad = [];
  for (const [name, a] of Object.entries(PERSONAS)) for (const o of [AUTUMN, WINTER]) {
    const m = M.match(a, o), conds = M.conds(M.clean(a));
    for (const e of m.excluded) {
      const q1 = (M.clean(a).q1 || []).filter((c) => ["bp", "sleep", "cold", "gut"].includes(c));
      const safety = q1.length ? q1 : (a.q6 || []).includes("quiet") ? ["quiet"] : (a.q6 || []).includes("tense") ? ["tense"] : [null];
      const why = safety.map((c) => R.skipReason(R.placeById(e.id), c, o.season)).filter(Boolean);
      if (!why.length || m.top.some((x) => x.id === e.id) || m.ranked.some((x) => x.id === e.id)) bad.push({ name, season: o.season, id: e.id });
    }
  }
  const bpWinter = M.match({ q1: ["bp"] }, WINTER), sleepAutumn = M.match({ q1: ["sleep"] }, AUTUMN);
  check("safety exclusions run first: an excluded place is never ranked; every exclusion is a climate rule for a picked body state", bad.length === 0, bad);
  check("血压偏高 + 冬: 哈尔滨 excluded (cold, big swings) and 芭提雅 first", bpWinter.excluded.some((x) => x.id === "harbin") && bpWinter.top[0].id === "pattaya", { top: bpWinter.top.map((x) => x.id), out: bpWinter.excluded.map((x) => x.id) });
  check("睡不踏实 + 秋: 芭提雅 excluded (hot, humid, rainy nights)", sleepAutumn.excluded.some((x) => x.id === "pattaya"), sleepAutumn.excluded);
  const multi = M.match({ q1: ["bp", "cold"] }, WINTER);
  check("multi-select: exclusions of every picked body state apply (血压偏高 + 怕冷 in winter)", multi.excluded.map((x) => x.id).includes("harbin") && !multi.top.some((x) => x.id === "harbin"), multi.excluded);
}
// 3. term multiplier: the same place scores differently in different solar terms; stays within 0.8 … 1.2
{
  const w = M.weightsFor({ q2: ["cold"] }), place = R.placeById("wudang");
  const a = M.termMultiplier(place, "autumn", T["白露"], 2026, w), b = M.termMultiplier(place, "autumn", T["霜降"], 2026, w);
  const all = D.PLACES.filter((p) => p.photo).flatMap((p) => ["autumn", "winter"].flatMap((s) => D.SOLAR_TERMS.map((_, i) => M.termMultiplier(p, s, i, 2026, w))));
  check(`solar-term multiplier: 武当山 for someone who runs cold ×${a} around 白露 vs ×${b} around 霜降; all multipliers within 0.8–1.2`, a !== b && all.every((x) => x >= 0.8 && x <= 1.2), { a, b });
  const early = M.match(PERSONAS.none, { season: "autumn", termIndex: T["白露"] }).ranked.map((x) => x.id + ":" + x.score).join(" "), late = M.match(PERSONAS.none, { season: "autumn", termIndex: T["霜降"] }).ranked.map((x) => x.id + ":" + x.score).join(" ");
  check("the ranking scores move with the solar term (白露 vs 霜降, same answers)", early !== late, { early, late });
}
// 4. the traditional-medicine layer is off: null weights → 0, even when a weight is filled in by mistake
{
  const tcm = KB.answerWeights.filter((x) => x.layer === "tcm");
  const before = JSON.stringify(M.match(PERSONAS.coldBeach, AUTUMN).ranked);
  const ctx2 = load();
  ctx2.HEALOA_KB.answerWeights.forEach((x) => { if (x.layer === "tcm") x.weight = 50; });
  const after = JSON.stringify(ctx2.HEALOA_MATCH.match(PERSONAS.coldBeach, AUTUMN).ranked);
  check(`tcm layer: ${tcm.length} placeholder weights are null + pending-cindy; they add 0 points, even if a number is filled in before the layer is switched on`, tcm.length >= 6 && tcm.every((x) => x.weight === null && x.status === "pending-cindy") && before === after);
}
// 5. display gate: only text with a verified source is shown
{
  const ctx3 = load(), K = ctx3.HEALOA_KB, M3 = ctx3.HEALOA_MATCH;
  K.sources.push({ id: "s-ok", verified: true }, { id: "s-no", verified: false });
  const items = [{ text: "a", sourceRef: "s-ok" }, { text: "b", sourceRef: "s-no" }, { text: "c", sourceRef: null }, { text: "", sourceRef: "s-ok" }, { text: "e" }];
  check("sourced(): shows only lines with text AND a sourceRef to a verified source (1 of 5 fixtures)", JSON.stringify(M3.sourced(items).map((x) => x.text)) === '["a"]');
  check("shipped knowledge base: no advice line is shown yet for any solar term", D.SOLAR_TERMS.every((_, i) => M.adviceFor(i).length === 0));
}
// 6. shape: ≤3, one per main scene, deterministic, unknown answers ignored, reasons present
{
  const bad = [];
  for (const [name, a] of Object.entries(PERSONAS)) for (const o of [AUTUMN, WINTER]) {
    const m = M.match(a, o), scenes = m.top.map((x) => R.placeById(x.id).scenes[0]);
    if (m.top.length > 3 || new Set(scenes).size !== scenes.length || m.top.some((x) => !x.reasons.length || !x.reasons[0]) || JSON.stringify(M.match(a, o)) !== JSON.stringify(m)) bad.push({ name, season: o.season });
  }
  check("top list: ≤3 places, one per main scene, each with ≥1 reason; same answers → same result", bad.length === 0, bad);
  const cl = M.clean({ q1: ["bp"], q9: ["x"], q7: ["moon", "sea"], q2: ["cold", "hot"] });
  check("clean(): unknown questions / options are dropped; a single-choice question keeps one answer", !("q9" in cl) && JSON.stringify(cl.q7) === '["sea"]' && JSON.stringify(cl.q1) === '["bp"]' && cl.q2.length === 1, cl);
  const cold = M.match(PERSONAS.coldBeach, AUTUMN).top[0];
  check("reasons name the answer that earned the points (coldBeach → 「你想去海边」 / 「你更怕冷」 first)", /海边|怕冷/.test(cold.reasons[0]), cold.reasons);
}
// 7. distance: "weekend, somewhere near" favours the home region (zh → cn places)
{
  const near = M.match({ q8: ["near"] }, AUTUMN), far = M.match({ q8: ["far"] }, AUTUMN);
  const cn = (m) => m.ranked.filter((x) => R.placeById(x.id).region === "cn").map((x) => x.distMult);
  check("周末去近一点的地方: places in China weigh ×1.3, others ×0.8; 能出远门: all ×1", cn(near).every((x) => x === 1.3) && near.ranked.filter((x) => R.placeById(x.id).region !== "cn").every((x) => x.distMult === 0.8) && far.ranked.every((x) => x.distMult === 1));
}

const failed = results.filter((r) => !r.ok);
console.log(`\nmatch: ${results.length - failed.length}/${results.length} PASS`);
if (process.env.HEALOA_RESULTS_DIR) fs.writeFileSync(path.join(process.env.HEALOA_RESULTS_DIR, "match.json"), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
