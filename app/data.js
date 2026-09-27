/* HeaLoa · 顺着季节养 · content data (v2026-09-27-s)
 * Customer-facing text lives here. Wording rules: see PRODUCT_CURRENT.md and tests/static-checks.mjs.
 * Climate numbers: NASA POWER Climatology API v2.10.0, 2001–2020 monthly means (CC BY 4.0),
 * raw JSON in data/climate/, derived by tools/climate-summary.mjs (checked by tests).
 */
(function (root) {
  "use strict";

  var VERSION = "v2026-09-27-s";

  var CONDITIONS = [
    { id: "bp", label: "血压偏高" },
    { id: "sleep", label: "睡不踏实" },
    { id: "cold", label: "怕冷手脚凉" },
    { id: "gut", label: "肠胃弱" },
    { id: "tense", label: "心里绷得紧" },
    { id: "quiet", label: "想安静一点" }
  ];

  var SEASONS = {
    autumn: { id: "autumn", label: "秋", months: "9–11 月", monthNames: ["9 月", "10 月", "11 月"] },
    winter: { id: "winter", label: "冬", months: "12–2 月", monthNames: ["12 月", "1 月", "2 月"] }
  };

  /* Approximate solar-term start dates (common years; may differ by one day). */
  var SOLAR_TERMS = [
    { m: 1, d: 5, name: "小寒" }, { m: 1, d: 20, name: "大寒" }, { m: 2, d: 4, name: "立春" },
    { m: 2, d: 19, name: "雨水" }, { m: 3, d: 5, name: "惊蛰" }, { m: 3, d: 20, name: "春分" },
    { m: 4, d: 4, name: "清明" }, { m: 4, d: 20, name: "谷雨" }, { m: 5, d: 5, name: "立夏" },
    { m: 5, d: 21, name: "小满" }, { m: 6, d: 5, name: "芒种" }, { m: 6, d: 21, name: "夏至" },
    { m: 7, d: 7, name: "小暑" }, { m: 7, d: 22, name: "大暑" }, { m: 8, d: 7, name: "立秋" },
    { m: 8, d: 23, name: "处暑" }, { m: 9, d: 7, name: "白露" }, { m: 9, d: 23, name: "秋分" },
    { m: 10, d: 8, name: "寒露" }, { m: 10, d: 23, name: "霜降" }, { m: 11, d: 7, name: "立冬" },
    { m: 11, d: 22, name: "小雪" }, { m: 12, d: 7, name: "大雪" }, { m: 12, d: 21, name: "冬至" }
  ];

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

  /* Places. `photo: null` = no photo in the repo yet → never in the top 3.
   * `cindyLine` = Cindy's own signed one-line feeling. Leave "" until she provides it; empty renders nothing. */
  var PLACES = [
    {
      id: "wudang", climate: "wudang", name: "武当山 · 山居慢住", area: "湖北 · 十堰",
      photo: "assets/places/wudang/homestay/01-courtyard-house.jpg",
      gallery: ["assets/places/wudang/01-cloud-sea-sun.jpg", "assets/places/wudang/homestay/02-window-tea-terrace.jpg"],
      alt: "武当山里的山居院子",
      benefit: "山坳里的院子，早上雾从山谷慢慢升起来，四周很安静，有山林疗愈氛围。",
      cindyLine: "",
      attrs: { quiet: 2, nature: 2, hotspring: false },
      food: ["清淡的山野时蔬、热汤", "坐在露台慢慢喝一壶热茶", "少吃辛辣、重油"],
      todo: ["清晨在院子和石阶上慢走 20 分钟", "跟着做几式太极或八段锦（武当山素来与太极相连）", "在露台看云、喝茶、发会儿呆"],
      caution: ["表里的数字来自山下的气候网格（约 398 米），山上更冷，多带一件外套。", "石阶多，慢慢走，不赶路登顶。"],
      fit: {
        bp: "院子和平缓的路适合慢走，跟着练几式太极，动作慢、不憋气。",
        sleep: "山里入夜早、声音少，跟着天色早点睡。",
        cold: "白天有太阳时在院子里走一走，身子会暖起来；早晚记得加衣。",
        gut: "三餐清淡、吃热的，饭后在院子里慢走一会儿。",
        tense: "看云、听山风，走几步路，心里会慢下来一点。",
        quiet: "人少、山静，适合什么都不安排，安静住几天。"
      }
    },
    {
      id: "pattaya", climate: "pattaya", name: "芭提雅 · 海边", area: "泰国 · 春武里",
      photo: "assets/places/thai/sunset/01-pattaya-harbor-dusk.jpg",
      gallery: ["assets/places/thai/pool/01-infinity-coast.jpg"],
      alt: "芭提雅傍晚的海湾",
      benefit: "海风是暖的，傍晚的海湾慢慢变成橘色，走在海边身子松下来。",
      cindyLine: "",
      attrs: { quiet: 0, nature: 2, hotspring: false },
      food: ["椰青、清汤、烤鱼", "少喝冰饮，少吃太辣、太生的"],
      todo: ["清晨或傍晚沿着海边慢走", "在树荫下听海浪，做几分钟慢呼吸"],
      caution: ["中午日晒强，别长时间晒太阳；冷气房别开太低。", "路途较远，行程别排太满，每天留出午休。"],
      fit: {
        bp: "一年到头都暖和，温差小，每天可以放心出门慢走。",
        sleep: "白天在海边走一走、晒晒早上的太阳，晚上早点回屋。",
        cold: "一年到头都暖，手脚不容易凉。",
        gut: "吃热的、清淡的，少碰冰饮和生冷。",
        tense: "听海浪、看日落，心里会松一点。",
        quiet: "避开热闹的街，清晨的海边最安静。"
      }
    },
    {
      id: "onsen", climate: "kusatsu", name: "日本森林温泉 · 草津", area: "日本 · 群马",
      photo: "assets/places/onsen/01-hot-spring-field-town.jpg",
      gallery: ["assets/places/onsen/02-hot-spring-falls.jpg"],
      alt: "草津温泉汤畑的热气和木槽",
      benefit: "热气从汤畑里慢慢冒出来，走在温泉街上，身子一点点暖起来。",
      cindyLine: "",
      attrs: { quiet: 1, nature: 2, hotspring: true },
      food: ["热荞麦面、热汤", "泡汤前后各喝一杯温水"],
      todo: ["在温泉街慢走，看汤畑的热气", "泡汤或足汤：选 41℃ 以下的池子，每次 10 分钟以内"],
      caution: ["泡之前先冲冲手脚，起身慢一点，别一个人泡；饭后、喝酒后不泡，头晕马上出来。", "网格海拔约 1036 米，早晚凉，多带一层衣服。"],
      fit: {
        bp: "可以泡，但要守住：水温 41℃ 以下、每次 10 分钟以内、起身要慢。",
        sleep: "睡前 1–2 小时泡 10 分钟，擦干、穿暖，回屋早点睡。",
        cold: "泡完身子暖，擦干马上穿袜子、戴帽子再出门。",
        gut: "吃热的、清淡的，泡汤前后别吃太饱。",
        tense: "在热气和林子里慢慢走，心里会松一点。",
        quiet: "清晨的温泉街人少，很安静。"
      }
    },
    {
      id: "harbin", climate: "harbin", name: "哈尔滨 · 冰雪", area: "黑龙江",
      photo: "assets/places/harbin/03-day-milk-tea-village.jpg",
      gallery: ["assets/places/harbin/01-night-snow-roofs.jpg"],
      alt: "哈尔滨雪后的村子",
      benefit: "雪落下来的时候四周很安静，屋里暖烘烘的。",
      cindyLine: "",
      attrs: { quiet: 1, nature: 1, hotspring: false },
      food: ["热乎的饺子、炖菜", "一杯热奶茶暖手"],
      todo: ["白天看雪景，每次在室外别待太久", "回到屋里慢慢喝热饮"],
      caution: ["进出屋冷热变化很大，出门前先在门口停一停。", "路面结冰，慢慢走，穿防滑鞋。"],
      fit: {
        bp: "冷热变化大，这个季节不建议。",
        sleep: "屋里暖、屋外冷，睡前别在外面待太久。",
        cold: "太冷，这个季节不建议。",
        gut: "吃热的，别在冷风里吃东西。",
        tense: "雪景很安静，适合短时间看看，身体硬朗再去。",
        quiet: "雪夜很安静；只在身体硬朗时短住，每次出门别太久。"
      }
    },
    /* No photo in the repo yet → only shown under「照片陆续补上」, never in the top 3. */
    {
      id: "xishuangbanna", climate: "xishuangbanna", name: "西双版纳", area: "云南", photo: null, cindyLine: "",
      attrs: { quiet: 1, nature: 2, hotspring: false }, fit: {}
    },
    {
      id: "tengchong", climate: "tengchong", name: "腾冲", area: "云南", photo: null, cindyLine: "",
      attrs: { quiet: 1, nature: 2, hotspring: true }, fit: {}
    },
    {
      id: "kunming", climate: "kunming", name: "昆明", area: "云南", photo: null, cindyLine: "",
      attrs: { quiet: 1, nature: 1, hotspring: false }, fit: {}, highAltitude: true
    },
    {
      id: "phuket", climate: "phuket", name: "普吉", area: "泰国", photo: null, cindyLine: "",
      attrs: { quiet: 0, nature: 2, hotspring: false }, fit: {}
    }
  ];

  /* Season care per (condition × season). tag = 作息 / 保暖 / 喝水 … */
  var CARE = {
    bp: {
      autumn: {
        note: [
          { tag: "作息", text: "秋天讲究「收」：晚上早点睡，别熬夜。" },
          { tag: "保暖", text: "早晚温差大，出门加件外套，护好头颈。" },
          { tag: "起身", text: "早上醒来先坐一会儿，再慢慢站起来。" }
        ],
        eat: { more: "梨、百合、淮山、绿叶菜、豆腐", less: "咸菜、腊味、重口味的汤", tip: "每天盐不超过一个啤酒瓶盖（约 5 克）。", drink: "温开水；淡淡的菊花茶（胃里怕凉的人少喝）。" },
        move: ["每天慢走 20–30 分钟，微微出汗、还能说话就好。", "不做憋气、倒立、突然用力的动作。"],
        safety: "血压还不稳定时，出远门、泡汤前先听专业意见；如有头晕、胸闷，马上停下。"
      },
      winter: {
        note: [
          { tag: "作息", text: "冬天讲究「藏」：早睡晚起，等太阳出来再出门。" },
          { tag: "保暖", text: "从暖屋到室外，先在门口停一停，戴好帽子和围巾。" },
          { tag: "洗澡", text: "洗澡、泡脚水别太烫：41℃ 以下，10 分钟以内。" }
        ],
        eat: { more: "白萝卜、淮山、黑木耳、南瓜、少盐的热汤", less: "火锅底料、腌腊、咸菜", tip: "每天盐不超过一个啤酒瓶盖（约 5 克）。", drink: "温开水；山楂红枣水（胃酸多的人少喝）。" },
        move: ["中午暖和的时候慢走 20–30 分钟。", "大风降温的日子，改在屋里慢慢走。"],
        safety: "泡汤、泡脚：水温 41℃ 以下，每次 10 分钟以内，起身要慢，别一个人泡，饭后、喝酒后不泡。血压还不稳定时，先听专业意见。"
      }
    },
    sleep: {
      autumn: {
        note: [
          { tag: "作息", text: "秋天早睡早起，晚上 10 点半前上床。" },
          { tag: "睡前", text: "睡前 1–2 小时泡脚 10 分钟，调暗灯光，放下手机。" },
          { tag: "午睡", text: "午睡别超过 30 分钟。" }
        ],
        eat: { more: "百合、莲子、小米、银耳、梨", less: "晚上的浓茶、咖啡，太晚的夜宵", tip: "晚饭七分饱，睡前 2 小时不再吃东西。", drink: "睡前一小碗温热的小米粥，或一杯温牛奶。" },
        move: ["傍晚慢走 20 分钟；睡前 2 小时内不做剧烈运动。"],
        safety: "长期睡不踏实，请听专业意见。练习中觉得憋闷，就换成吸 4 呼 6。"
      },
      winter: {
        note: [
          { tag: "作息", text: "冬天早睡晚起，早上等太阳出来再起身活动。" },
          { tag: "卧室", text: "卧室别太热、别太干，被子里先把脚暖好。" },
          { tag: "睡前", text: "睡前 1–2 小时泡脚 10 分钟，擦干穿好袜子。" }
        ],
        eat: { more: "红枣、小米、核桃、桂圆（少量）", less: "晚饭太饱、辛辣", tip: "晚饭早一点、清淡一点。", drink: "睡前一杯温热、不含咖啡因的饮品。" },
        move: ["白天晒着太阳慢走 20 分钟。"],
        safety: "长期睡不踏实，请听专业意见。练习中觉得憋闷，就换成吸 4 呼 6。"
      }
    },
    cold: {
      autumn: {
        note: [
          { tag: "保暖", text: "秋天早晚凉，先护好脚、腰和后颈。" },
          { tag: "喝水", text: "秋天干燥，多喝温水，少吃冰的。" },
          { tag: "睡前", text: "晚上泡脚 10 分钟，擦干马上穿袜子。" }
        ],
        eat: { more: "淮山、南瓜、红枣、小米、羊肉（适量）", less: "冰饮、生冷瓜果", tip: "三餐都吃热的。", drink: "红枣桂圆茶，或生姜红糖水（喉咙干、嘴里起泡时少喝）。" },
        move: ["太阳出来后慢走 20–30 分钟，走到身上微微发热。", "坐久了搓搓手、揉揉脚心。"],
        safety: "泡脚水温 41℃ 以下，每次 10 分钟以内；脚上感觉不灵敏的人，用手试好水温。"
      },
      winter: {
        note: [
          { tag: "作息", text: "冬天早睡晚起，等太阳出来再出门。" },
          { tag: "保暖", text: "帽子、围巾、厚袜，护住头颈和脚。" },
          { tag: "睡前", text: "泡脚 10 分钟，擦干马上穿袜子、盖好被子。" }
        ],
        eat: { more: "羊肉萝卜汤、红枣、生姜、核桃", less: "冰的、生冷的", tip: "早饭一定吃热的。", drink: "姜枣茶（喉咙干、嘴里起泡时少喝）。" },
        move: ["中午暖和的时候慢走 20 分钟。", "屋里原地踏步 5 分钟，身子暖了再出门。"],
        safety: "泡脚、泡汤水温 41℃ 以下，每次 10 分钟以内；脚上感觉不灵敏的人，用手试好水温。"
      }
    },
    gut: {
      autumn: {
        note: [
          { tag: "作息", text: "三餐定时，每顿七分饱。" },
          { tag: "保暖", text: "早晚凉，护好肚子，晚上别光着脚。" },
          { tag: "吃饭", text: "吃饭慢一点，边吃边看手机的习惯先放一放。" }
        ],
        eat: { more: "淮山、小米粥、南瓜、蒸苹果、白萝卜", less: "冰饮、生冷、油炸、太辣", tip: "早饭吃一碗热的。", drink: "温热的小米粥、温开水。" },
        move: ["饭后半小时再慢走 15–20 分钟。", "睡前顺时针轻揉肚子 3 分钟。"],
        safety: "肚子一直不舒服、或和平时很不一样，请听专业意见。"
      },
      winter: {
        note: [
          { tag: "作息", text: "早饭吃热的，别空着肚子出门。" },
          { tag: "保暖", text: "护好肚子和脚，别让凉气进来。" },
          { tag: "吃饭", text: "火锅、烧烤别常吃，每顿七分饱。" }
        ],
        eat: { more: "淮山、小米、南瓜、红枣、温热的汤面", less: "生冷、冰的、太油腻", tip: "吃饭慢一点，细嚼慢咽。", drink: "温开水、红枣小米粥。" },
        move: ["饭后半小时慢走 15–20 分钟。", "睡前顺时针轻揉肚子 3 分钟。"],
        safety: "肚子一直不舒服、或和平时很不一样，请听专业意见。"
      }
    },
    tense: {
      autumn: {
        note: [
          { tag: "留白", text: "每天留 10 分钟什么都不做，看看天、看看树。" },
          { tag: "作息", text: "秋天早睡，睡前把手机放远一点。" },
          { tag: "出门", text: "白天出门晒 20 分钟太阳。" }
        ],
        eat: { more: "百合、小米、香蕉、少量坚果", less: "浓茶、咖啡、太甜的零食", tip: "按时吃饭，别饿着撑着。", drink: "淡淡的茉莉花茶（下午 3 点以后少喝）。" },
        move: ["跟着慢走节奏走 20 分钟，一步一步数着走。"],
        safety: "心里一直很紧、影响到吃饭睡觉，请听专业意见。"
      },
      winter: {
        note: [
          { tag: "晒太阳", text: "中午出门晒 20 分钟太阳。" },
          { tag: "作息", text: "冬天早睡晚起，别熬夜。" },
          { tag: "留白", text: "每天留 10 分钟，只做一件慢慢的小事，比如泡一壶茶。" }
        ],
        eat: { more: "小米、红枣、核桃、温热的汤", less: "浓茶、咖啡、太甜的零食", tip: "按时吃饭，吃热的。", drink: "温热的红枣茶。" },
        move: ["中午暖和时跟着慢走节奏走 20 分钟。"],
        safety: "心里一直很紧、影响到吃饭睡觉，请听专业意见。"
      }
    },
    quiet: {
      autumn: {
        note: [
          { tag: "留白", text: "每天找一个固定的安静时段，少安排一点事。" },
          { tag: "作息", text: "秋天早睡早起，跟着天色走。" },
          { tag: "喝水", text: "秋天干燥，多喝温水。" }
        ],
        eat: { more: "梨、百合、淮山、小米", less: "太辣、太咸、太晚的饭局", tip: "清淡、温热、按时。", drink: "一壶淡茶，慢慢喝。" },
        move: ["一个人慢走 20 分钟，不听东西，只听脚步声。"],
        safety: "觉得身体不适，请听专业意见。"
      },
      winter: {
        note: [
          { tag: "留白", text: "冬天适合「藏」：少出门应酬，多在家安静待着。" },
          { tag: "作息", text: "早睡晚起，等太阳出来再出门。" },
          { tag: "保暖", text: "屋里暖一点，泡一壶热茶。" }
        ],
        eat: { more: "淮山、萝卜、小米、温热的汤", less: "冰的、太辣的", tip: "吃热的，七分饱。", drink: "一壶热茶，慢慢喝。" },
        move: ["中午暖和时一个人慢走 20 分钟。"],
        safety: "觉得身体不适，请听专业意见。"
      }
    }
  };

  /* Default relaxation per condition. Only claim: 当场放松. */
  var PRACTICE_DEFAULT = { bp: "breath46", sleep: "breath478", cold: "breath46", gut: "breath46", tense: "walk", quiet: "breath46" };

  var PRACTICES = {
    breath46: {
      id: "breath46", kind: "breath", label: "慢呼吸 · 吸 4 呼 6", short: "慢呼吸",
      phases: [{ name: "吸气", sec: 4, scale: 1 }, { name: "呼气", sec: 6, scale: 0 }],
      durations: [180, 300], defaultDuration: 180,
      intro: "跟着圆圈：变大时用鼻子慢慢吸气，变小时慢慢呼气。不憋气。",
      photo: "assets/places/wudang/01-cloud-sea-sun.jpg"
    },
    breath478: {
      id: "breath478", kind: "breath", label: "4-7-8 呼吸 · 睡前", short: "4-7-8",
      phases: [{ name: "吸气", sec: 4, scale: 1 }, { name: "停一停", sec: 7, scale: 1 }, { name: "慢慢呼气", sec: 8, scale: 0 }],
      rounds: 4, durations: [76, 152], defaultDuration: 76,
      intro: "吸 4 秒，停 7 秒，呼 8 秒，做 4 轮。停不住就别硬撑，换成吸 4 呼 6。",
      photo: "assets/places/cabin/04-soup-window-warm.jpg"
    },
    walk: {
      id: "walk", kind: "walk", label: "慢走节奏", short: "慢走节奏",
      cadences: [60, 75, 90], defaultCadence: 75,
      durations: [600, 1200, 1800], defaultDuration: 600,
      intro: "跟着「左 · 右」的节奏慢慢走，吸气走三步，呼气走三步。在屋里、走廊、公园都可以。",
      photo: "assets/places/forest/path/01-leaf-tunnel.jpg"
    },
    soak: {
      id: "soak", kind: "soak", label: "泡脚 / 泡汤计时", short: "泡脚计时",
      durations: [300, 600], defaultDuration: 600,
      intro: "水温 41℃ 以下（摸着温热、不烫），每次 10 分钟以内。先冲冲手脚，起身慢一点。",
      photo: "assets/places/onsen/02-hot-spring-falls.jpg"
    },
    baduanjin1: {
      id: "baduanjin1", kind: "guided", label: "八段锦第一式 · 两手托天理三焦", short: "八段锦第一式",
      steps: [
        { sec: 10, text: "两脚分开与肩同宽，站稳（也可以坐着），肩膀放松。" },
        { sec: 12, text: "两手在小腹前十指交叉，掌心向上，慢慢吸气。" },
        { sec: 12, text: "两手经胸前翻掌向上托起，眼睛跟着手，慢慢往上伸展。" },
        { sec: 10, text: "在上面停两秒，不憋气，自然呼吸。" },
        { sec: 12, text: "慢慢呼气，两手从身体两侧落下，回到小腹前。" },
        { sec: 12, text: "再做一次：吸气托起，呼气落下。" },
        { sec: 12, text: "第三次：动作越慢越好，做完站一会儿。" }
      ],
      intro: "一式样品，站着、坐着都可以。肩颈不舒服就只抬到舒服的高度。",
      photo: "assets/places/wudang/homestay/02-window-tea-terrace.jpg"
    },
    taiji1: {
      id: "taiji1", kind: "guided", label: "太极 · 起势", short: "太极起势",
      steps: [
        { sec: 10, text: "两脚并拢站好，全身放松，眼睛平视。" },
        { sec: 10, text: "左脚向左轻轻迈开，与肩同宽。" },
        { sec: 12, text: "两手慢慢向前平举，与肩同高，同时吸气。" },
        { sec: 12, text: "膝盖微微弯曲，两手轻轻按下到腹前，同时呼气。" },
        { sec: 12, text: "再做一次：吸气举起，呼气按下。" },
        { sec: 12, text: "第三次，越慢越好，做完站一会儿。" }
      ],
      intro: "一式样品，慢、柔、配合呼吸。膝盖不舒服就少蹲一点。",
      photo: "assets/places/wudang/01-cloud-sea-sun.jpg"
    }
  };

  /* 去不了远方？在家这样做 */
  var HOME_PLAN = {
    bp: ["睡前 1–2 小时泡脚 10 分钟（41℃ 以下）", "慢呼吸 3 分钟：吸 4 秒、呼 6 秒，不憋气", "附近公园慢走 20–30 分钟"],
    sleep: ["睡前 1–2 小时泡脚 10 分钟", "调暗灯光，放下手机", "躺下前做 4 轮 4-7-8 呼吸"],
    cold: ["晚上泡脚 10 分钟，擦干马上穿袜子", "一杯温热的红枣茶", "太阳好的时候慢走 20 分钟"],
    gut: ["早饭一碗热粥", "饭后半小时慢走 15 分钟", "睡前顺时针轻揉肚子 3 分钟"],
    tense: ["跟着慢走节奏走 20 分钟", "慢呼吸 3 分钟", "每天留 10 分钟什么都不做"],
    quiet: ["找一个固定的安静时段", "泡一壶茶，慢慢喝", "慢呼吸 3 分钟，看看窗外"]
  };

  /* Optional 1-minute quiz (never blocks; home buttons work without it). */
  var QUIZ = [
    { cond: "cold", q: "手脚常常凉，比身边的人怕冷？" },
    { cond: "sleep", q: "晚上不容易睡着，或者半夜容易醒？" },
    { cond: "gut", q: "吃点凉的、油的，肚子就不舒服？" },
    { cond: "tense", q: "最近心里总绷着，放松不下来？" },
    { cond: "bp", q: "量血压时，常常比建议的数值高一点？" }
  ];

  /* Season mood photos for the share card (no link to any condition). */
  var SEASON_PHOTO = {
    autumn: "assets/places/wudang/01-cloud-sea-sun.jpg",
    winter: "assets/places/cabin/01-porch-frost-forest.jpg"
  };

  var DISCLAIMER = "这是顺应季节的养生参考，身体不适请以专业意见为准";

  root.HEALOA_DATA = {
    VERSION: VERSION, CONDITIONS: CONDITIONS, SEASONS: SEASONS, SOLAR_TERMS: SOLAR_TERMS,
    CLIMATE: CLIMATE, PLACES: PLACES, CARE: CARE, PRACTICES: PRACTICES,
    PRACTICE_DEFAULT: PRACTICE_DEFAULT, CREDIT: CREDIT, DISCLAIMER: DISCLAIMER,
    HOME_PLAN: HOME_PLAN, QUIZ: QUIZ, SEASON_PHOTO: SEASON_PHOTO
  };
})(typeof window !== "undefined" ? window : globalThis);
