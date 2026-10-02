/**
 * Shared v4 flow helpers for the browser suites (v2026-09-27-x).
 * Since v4 Phase 1 the home page no longer has the 6 one-tap buttons: the main line is
 * 首页 → 2 分钟配对（一屏一题）→ 翻牌 → 为什么是你 → 地方 → 放松 → 卡 / 我的养护记录.
 *   toResult(p, cond)  — jumps straight to the 为什么是你 page for one body state through the app's own
 *                        test hook (answers are derived from that state exactly like a quiz with only it picked).
 *   runQuiz(p, picks)  — walks the real quiz UI, one question per screen: picks = { q1: ["bp"], q2: ["cold"], … };
 *                        a question without picks is skipped with 「都不是 / 说不准」. Ends on the flip reveal.
 */
export async function toResult(p, cond, season) {
  await p.evaluate(([c, s]) => window.__healoa.go("result", s ? { cond: c, season: s } : { cond: c }), [cond, season || null]);
  await p.waitForSelector("#vResult:not(.hidden)");
}

export async function runQuiz(p, picks = {}, { start = "#btnStart2" } = {}) {
  if (start) await p.click(start);
  await p.waitForSelector("#vQuiz:not(.hidden)");
  for (let guard = 0; guard < 12; guard++) {
    if (await p.isHidden("#vQuiz")) break;
    const cur = await p.evaluate(() => { const q = window.__healoa.quiz(); return { i: q.i }; });
    const qid = "q" + (cur.i + 1);
    const want = picks[qid] || [];
    if (!want.length) { await p.click('#quizBody [data-action="quizSkip"]'); continue; }
    for (const opt of want) {
      if (await p.isHidden("#vQuiz")) break;
      if ((await p.evaluate(() => window.__healoa.quiz().i)) !== cur.i) break;
      await p.click(`#quizBody [data-action="quizPick"][data-opt="${opt}"]`);
    }
    if (!(await p.isHidden("#vQuiz")) && (await p.evaluate(() => window.__healoa.quiz().i)) === cur.i) {
      await p.click('#quizBody [data-action="quizNext"]');
    }
  }
  await p.waitForSelector("#vReveal:not(.hidden)");
}

export async function toCard(p, cond, season) {
  await toResult(p, cond, season);
  await p.click('#resultBody [data-action="openCareplan"]');
  await p.waitForSelector("#vCareplan:not(.hidden)");
  await p.click('#careplanBody [data-action="openCard"]');
  await p.waitForSelector("#vCard:not(.hidden)");
}
export async function toCareplan(p, cond, season) {
  await toResult(p, cond, season);
  await p.click('#resultBody [data-action="openCareplan"]');
  await p.waitForSelector("#vCareplan:not(.hidden)");
}
