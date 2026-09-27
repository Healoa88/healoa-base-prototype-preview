// Single source for wording rules (v3 lock, Cindy 2026-09-26). Used by static + browser tests.
export const BANNED_CUSTOMER_WORDS = [
  "治疗", "治愈", "疗效", "诊断", "降压", "降血压", "治失眠", "改善", "缓解", "调理", "药",
  "患者", "医生", "高血压", "失眠", "累", "烦", "日记", "打卡", "积分", "邀请好友", "解锁", "排行", "情绪曲线",
];
// Must not appear anywhere in the shipped repo (App-only rule). Case-sensitive, as written in the lock.
export const BANNED_ANYWHERE = ["healoa.com", "光圈", "Keeper", "Host", "Choose Again", "/board"];
export const CONDITION_LABELS = ["血压偏高", "睡不踏实", "怕冷手脚凉", "肠胃弱", "心里绷得紧", "想安静一点"];
export const CONDITION_IDS = ["bp", "sleep", "cold", "gut", "tense", "quiet"];
export const DISCLAIMER = "这是顺应季节的养生参考，身体不适请以专业意见为准";
export const VERSION = "v2026-09-27-s";

export function scanText(text, words) {
  const hits = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const w of words) if (line.includes(w)) hits.push({ word: w, line: i + 1, text: line.trim().slice(0, 120) });
  });
  return hits;
}
