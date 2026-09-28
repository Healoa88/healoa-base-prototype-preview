/* HeaLoa immersive sample · 感受签到 → 场景推荐 (rule-based, no LLM, no backend).
 * Feelings/mood only. NOT a body or medical assessment. */
(function (root) {
  'use strict';
  // Only places that really exist in this sample are ever recommended (no "coming soon" places, Cindy 2026-09-27).
  var PLACES = {
    hawaii: { id: 'hawaii', zh: '夏威夷 · 熔岩里长出的小树', open: true }
  };
  // Priority: free-text keyword -> (累 + 烦) -> want -> fallback. Mood for Hawaii entry: dusk (calm) vs sunrise (fresh).
  function recommend(a) {
    a = a || {}; var text = (a.text || '').trim(); var r;
    if (/新开始|重新|开始|换个心情|出发/.test(text)) r = { place: 'hawaii', why: '你说想要一点新的开始。那就去看看熔岩裂缝里长出来的小树吧。', rule: 'text:new-start' };
    else if (a.energy === 'tired' && a.mood === 'annoyed') r = { place: 'hawaii', why: '有点累、也有点烦的时候，找个安静的地方慢下来。黄昏的熔岩边很安静，只有一棵小树。', rule: 'tired+annoyed' };
    else if (a.want === 'quiet') r = { place: 'hawaii', why: '想安静一下？黄昏的熔岩边没什么人，只有风和一棵小树。', rule: 'want:quiet' };
    else if (a.want === 'lively') r = { place: 'hawaii', why: '想热闹一点？把你的狗或者自己放进来，给它戴个花环，拍一段小视频。', rule: 'want:lively' };
    else if (a.want === 'breathe') r = { place: 'hawaii', why: '想透口气？这里视野很开阔，黄昏的光铺在黑色熔岩上，还有一棵小树在长。', rule: 'want:breathe' };
    else r = { place: 'hawaii', why: '先带你去一个开阔的地方待一会儿。', rule: 'fallback' };
    // Hawaii entry tuning (visual only)
    var sunrise = a.energy === 'energetic' || a.mood === 'happy' || r.rule === 'text:new-start';
    r.mood = { timeOfDay: sunrise ? 'sunrise' : 'dusk', drift: a.energy === 'tired' ? 0.6 : (a.energy === 'energetic' ? 1.25 : 1.0) };
    r.placeInfo = PLACES[r.place]; r.open = true;
    return r;
  }
  var api = { recommend: recommend, PLACES: PLACES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HLCheckin = api;
})(typeof window !== 'undefined' ? window : globalThis);
