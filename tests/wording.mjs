// Wording rules (v3 lock, Cindy 2026-09-26; merged plan v2026-09-27-u; founder rules v2026-09-27-v).
//
// SOURCE OF TRUTH: rules/healoa-rules.json (human-readable: HEALOA_RULES.md). This module only
// derives the per-locale lists from it, so every suite and any external reviewer read the same rules.
//   match: "substring" — CJK text, any occurrence counts (zh, ja)
//          "word"      — Latin text, whole word, case-insensitive (en, es)
// en / ja = lists for the DRAFT locales; to be confirmed in the native review.
// es = EMPTY: Spanish is deferred until a reviewer exists.
// TODO(native review): es list must be written by a native speaker together with the es translation.
// 疗愈 / restorative / 癒し are allowed ONLY to describe a place, an atmosphere or a feeling (never a result).
// A locale may not be marked `complete: true` in app/i18n/<code>.js until its list here is filled and reviewed.
import fs from "fs";
export const RULES = JSON.parse(fs.readFileSync(new URL("../rules/healoa-rules.json", import.meta.url), "utf8"));
const uniq = (a) => [...new Set(a)];
export const BANNED_BY_LOCALE = Object.fromEntries(["zh", "en", "ja", "es"].map((l) => [l, {
  match: RULES.matchModes[l],
  words: uniq(RULES.rules.flatMap((r) => (r.banned && r.banned[l]) || [])),
}]));
// Where 疗愈 / restorative / 癒し may appear: only next to place / atmosphere / feeling words (checked by static tests).
export const RESTORATIVE_WORDS = RULES.rules.find((r) => r.id === "R02").restorativeWords;
export const LOCALES = Object.keys(BANNED_BY_LOCALE); // planned order: zh, en, ja, es
// Back-compat: the zh list.
export const BANNED_CUSTOMER_WORDS = BANNED_BY_LOCALE.zh.words;
// Must not appear anywhere in the shipped repo (App-only rule). Case-sensitive, as written in the lock.
export const BANNED_ANYWHERE = uniq(RULES.rules.flatMap((r) => r.bannedAnywhere || []));
export const CONDITION_LABELS = ["血压偏高", "睡不踏实", "怕冷手脚凉", "肠胃弱", "心里绷得紧", "想安静一点"];
export const CONDITION_IDS = ["bp", "sleep", "cold", "gut", "tense", "quiet"];
export const DISCLAIMER = "这是顺应季节的养生参考，身体不适请以专业意见为准";
export const VERSION = "v2026-10-02-a";

export function scanText(text, words) {
  const hits = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const w of words) if (line.includes(w)) hits.push({ word: w, line: i + 1, text: line.trim().slice(0, 120) });
  });
  return hits;
}
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
/** Scan text with the banned-word rules of one locale (unknown locale → zh rules). */
export function scanLocale(text, locale) {
  const rule = BANNED_BY_LOCALE[locale] || BANNED_BY_LOCALE.zh;
  if (rule.match !== "word") return scanText(text, rule.words);
  const hits = [];
  text.split("\n").forEach((line, i) => {
    for (const w of rule.words) if (new RegExp(`(^|[^\\p{L}\\p{N}])${escRe(w)}($|[^\\p{L}\\p{N}])`, "iu").test(line)) hits.push({ word: w, line: i + 1, text: line.trim().slice(0, 120) });
  });
  return hits;
}
/** Rendered-page scan: the locale's customer words + the repo-wide App-only words. */
export function scanRendered(text, locale) {
  return [...scanLocale(text, locale), ...scanText(text, BANNED_ANYWHERE)];
}

/** Strip JS comments (block comments, and // comments at line start or after whitespace), keeping strings/regex intact enough for scans. */
export function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|\s)\/\/.*$/gm, "$1");
}
// Any CJK ideograph, kana, CJK / full-width punctuation.
export const CJK_RE = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
