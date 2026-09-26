/* HeaLoa immersive sample · 感受签到 → 场景推荐 (rule-based, no LLM, no backend).
 * Feelings/mood only. NOT a body or medical assessment. */
(function (root) {
  'use strict';
  var PLACES = {
    hawaii: { id: 'hawaii', zh: '夏威夷 · 熔岩里长出的小树', open: true },
    onsen:  { id: 'onsen',  zh: '日本森林温泉', open: false },
    sea:    { id: 'sea',    zh: '海边，慢慢看浪', open: false },
    fern:   { id: 'fern',   zh: '雨林里的蕨类小路', open: false },
    market: { id: 'market', zh: '热闹的夜市', open: false }
  };
  // Priority: free-text keyword -> (累 + 烦) -> want -> fallback. Mood for Hawaii entry: dusk (calm) vs sunrise (fresh).
  function recommend(a) {
    a = a || {}; var text = (a.text || '').trim(); var r;
    if (/新开始|重新|开始|换个心情|出发/.test(text)) r = { place: 'hawaii', why: '你说想要一点新的开始。那就去看看熔岩裂缝里长出来的小树吧。', rule: 'text:new-start' };
    else if (a.energy === 'tired' && a.mood === 'annoyed') r = { place: 'onsen', alt: 'sea', why: '有点累、也有点烦的时候，找个暖和安静的地方慢下来，可能会舒服一些。', rule: 'tired+annoyed' };
    else if (a.want === 'quiet') r = { place: 'fern', why: '想安静一下？雨林里的蕨类小路，只有叶子和光。', rule: 'want:quiet' };
    else if (a.want === 'lively') r = { place: 'market', why: '想热闹一点？夜市的灯和人声会陪着你。', rule: 'want:lively' };
    else if (a.want === 'breathe') r = { place: 'hawaii', why: '想透口气？这里视野很开阔，黄昏的光铺在黑色熔岩上，还有一棵小树在长。', rule: 'want:breathe' };
    else r = { place: 'hawaii', why: '先带你去一个开阔的地方待一会儿。', rule: 'fallback' };
    // Hawaii entry tuning (visual only)
    var sunrise = a.energy === 'energetic' || a.mood === 'happy' || r.rule === 'text:new-start';
    r.mood = { timeOfDay: sunrise ? 'sunrise' : 'dusk', drift: a.energy === 'tired' ? 0.6 : (a.energy === 'energetic' ? 1.25 : 1.0) };
    r.placeInfo = PLACES[r.place]; r.open = PLACES[r.place].open;
    if (!r.open) r.nudge = '这里还在准备中（即将开放）。现在可以先去夏威夷看看。';
    return r;
  }
  var api = { recommend: recommend, PLACES: PLACES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HLCheckin = api;
})(typeof window !== 'undefined' ? window : globalThis);
