// Single source for wording rules (v3 lock, Cindy 2026-09-26). Used by static + browser tests.
//
// Banned customer-facing words, PER LOCALE (one config for all languages).
//   match: "substring" — CJK text, any occurrence counts (zh, ja)
//          "word"      — Latin text, whole word, case-insensitive (en, es)
// zh is the locked list. en / ja / es are EMPTY placeholders.
// TODO(native review): each list must be written by a native speaker together with that locale's translation
// (medical claims, disease names, cure/treat promises, points/unlock/leaderboard language, negative sensory words).
// A locale may not be marked `complete: true` in app/i18n/<code>.js until its list here is filled and reviewed.
export const BANNED_BY_LOCALE = {
  zh: {
    match: "substring",
    words: [
      "治疗", "治愈", "疗效", "诊断", "降压", "降血压", "治失眠", "改善", "缓解", "调理", "药",
      "患者", "医生", "高血压", "失眠", "累", "烦", "日记", "打卡", "积分", "邀请好友", "解锁", "排行", "情绪曲线",
    ],
  },
  en: { match: "word", words: [ /* TODO(native review) */ ] },
  ja: { match: "substring", words: [ /* TODO(native review) */ ] },
  es: { match: "word", words: [ /* TODO(native review) */ ] },
};
export const LOCALES = Object.keys(BANNED_BY_LOCALE); // planned order: zh, en, ja, es
// Back-compat: the zh list.
export const BANNED_CUSTOMER_WORDS = BANNED_BY_LOCALE.zh.words;
// Must not appear anywhere in the shipped repo (App-only rule). Case-sensitive, as written in the lock.
export const BANNED_ANYWHERE = ["healoa.com", "光圈", "Keeper", "Host", "Choose Again", "/board"];
export const CONDITION_LABELS = ["血压偏高", "睡不踏实", "怕冷手脚凉", "肠胃弱", "心里绷得紧", "想安静一点"];
export const CONDITION_IDS = ["bp", "sleep", "cold", "gut", "tense", "quiet"];
export const DISCLAIMER = "这是顺应季节的养生参考，身体不适请以专业意见为准";
export const VERSION = "v2026-09-27-t";

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
