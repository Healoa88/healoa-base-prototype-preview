/* HeaLoa · 顺着季节养 · locale: zh (简体中文) — default and, for now, the only complete locale.
 * Every customer-facing string lives in app/i18n/<locale>.js. Code (app/app.js, app/rules.js) only calls t(key, vars).
 * - strings: UI copy, templates with {placeholders}. Keys are flat and dot-separated.
 * - content: places, season care, practices, quiz, home plan … merged into HEALOA_DATA by app/data.js.
 * Wording rules (banned words per locale): tests/wording.mjs. Any other locale needs a native-speaker review before `complete: true`.
 */
(function (root) {
  "use strict";
  var L = root.HEALOA_LOCALES = root.HEALOA_LOCALES || {};
  L.zh = {
    meta: {
      code: "zh", htmlLang: "zh-CN", name: "中文", complete: true,
      canvasFont: '"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",sans-serif'
    },
    strings: {
      /* page head */
      "meta.title": "HeaLoa · 顺着季节养（预览 {version}）",
      "meta.description": "点一下你的情况，马上告诉你这个季节注意什么、吃什么、怎么动、去哪里养。",
      "brand.sub": "顺着季节养",
      "disclaimer": "这是顺应季节的养生参考，身体不适请以专业意见为准",
      "punct.colon": "：",
      "punct.listSep": "、",
      "nav.back": "‹ 返回",
      "season.switchAria": "切换季节",
      "season.autumn": "秋",
      "season.winter": "冬",
      "cond.groupAria": "点一下你的情况",
      "lang.switchAria": "语言",
      "social.follow": "关注我们",

      /* home */
      "home.headline": "血压偏高、睡不好、怕冷……这个季节该怎么养？",
      "home.subline": "点一下你的情况，马上告诉你这个季节注意什么、吃什么、怎么动、去哪里养",
      "home.hint": "不用问卷 · 不用注册 · 只存在你的手机上",
      "home.stepsAria": "三步",
      "home.step1": "点一下你的情况",
      "home.step2": "马上看到这个季节：注意什么、吃什么、怎么动、去哪里养",
      "home.step3": "跟着放松几分钟，存下本季养护卡（只留给自己）",
      "home.quizLink": "不知道点哪个？1 分钟小测（可跳过）",
      "home.seasonToday": "今天 · {term}前后 · {season}",
      "home.seasonAhead": "提前看{season}天",
      "home.returnHint": "你上次存了一张{season}季养护卡 · 点这里打开",

      /* opened from a share link */
      "shared.kicker": "有人把这个 App 分享给你",
      "shared.headline": "这个季节，怎么养身体、去哪里养？",
      "shared.subline": "HeaLoa 按季节给你养生参考。点一下你自己的情况，马上得到你的本季建议、放松练习和养护卡。",
      "shared.hint": "不会带入分享人的任何信息 · 不用注册",

      /* optional quiz */
      "quiz.title": "1 分钟小测",
      "quiz.intro": "简版，仅供参考。随时可以跳过，直接点首页的按钮也一样。",
      "quiz.progress": "第 {n} 题 / 共 {total} 题",
      "quiz.yes": "是",
      "quiz.no": "不太是",
      "quiz.skip": "跳过，回首页直接点",
      "quiz.suggest": "可以先看：",
      "quiz.note": "这是简版小测，只是帮你挑一个入口，结果不保存。",
      "quiz.home": "回首页",

      /* result */
      "result.condsAria": "换一个情况",
      "result.title": "{season} · {cond}",
      "result.seasonToday": "现在是{term}前后 · {season}季",
      "result.seasonAhead": "提前看{season}天（{months}）",
      "result.noteTitle": "本季要留意",
      "result.placesTitle": "这个季节去哪里养",
      "result.placesSub": "按{season}季历史气候和你的情况排出来 · 都有实拍照片",
      "result.rank": "第 {n} 选",
      "result.openPlace": "看这个地方 · 理由和做法",
      "result.homeTitle": "去不了远方？在家这样做",
      "result.soakBtn": "泡脚计时 10 分钟",
      "result.skipTitle": "这个季节先不选",
      "result.moreTitle": "还有这些地方",
      "result.moreSub": "照片陆续补上，补齐之前不排进前三。",
      "result.photoPending": "照片待补",
      "result.relaxCta": "先放松一下 · {label}",
      "result.eatTitle": "吃喝",
      "result.eatMore": "可以多吃：",
      "result.eatLess": "可以少一点：",
      "result.eatTip": "记住一句：",
      "result.eatDrink": "喝点什么：",
      "result.eatNote": "茶饮孕期、长期身体状况请先听专业意见。",
      "result.moveTitle": "怎么动",
      "result.moveFollow": "跟着做（简单样品，站着坐着都可以）：",
      "result.moveWalk": "慢走节奏",
      "result.moveBaduanjin": "八段锦第一式",
      "result.moveTaiji": "太极起势",
      "result.moveBreath": "慢呼吸 3 分钟",
      "result.caution": "要注意：",
      "result.cardCta": "生成本季养护卡",
      "result.srcNote": "地点气候：历史气候均值，不是天气预报 · Climate data: NASA POWER (CC BY 4.0) · 照片 {credit}",

      /* place */
      "place.cindyLine": "“{line}” —— Cindy",
      "place.skipLabel": "这个季节先不选：",
      "place.climateSkip": "{season}季的气候",
      "place.climateFit": "为什么{season}季适合",
      "place.eatTitle": "在这里可以吃",
      "place.todoTitle": "在这里做什么",
      "place.hotspringCaution": "泡汤：水温 41℃ 以下，每次 10 分钟以内，起身要慢。",
      "place.homeTitle": "去不了？在家这样做",
      "place.srcNote": "历史气候均值，不是天气预报 · Climate data: NASA POWER (CC BY 4.0) · 网格海拔约 {elev} 米（较粗，待人工核对）",

      /* relaxation practice */
      "practice.modesAria": "选择练习",
      "practice.footL": "左",
      "practice.footR": "右",
      "practice.ready": "准备好就点「开始」",
      "practice.readyGuided": "准备好就点「开始」，跟着文字慢慢做",
      "practice.start": "开始",
      "practice.startAgain": "再开始一次",
      "practice.pause": "暂停",
      "practice.resume": "继续",
      "practice.stop": "停止",
      "practice.wakeNote": "练习时屏幕会保持常亮",
      "practice.rounds": "{n} 轮",
      "practice.minutes": "{n} 分钟",
      "practice.cadence": "每分钟 {n} 步",
      "practice.beepOn": "节拍声：开",
      "practice.beepOff": "节拍声：关",
      "practice.safeDefault": "不憋气硬撑；如有头晕、胸闷，马上停下。",
      "practice.safeSoakTail": "泡完擦干，穿好袜子。",
      "practice.safeWalk": "走平路，量力而行；如有头晕、胸闷，马上停下。",
      "practice.breathCue": "{phase} {n}",
      "practice.walkIn": "吸气 · 走三步",
      "practice.walkOut": "呼气 · 走三步",
      "practice.soakLast": "还有 1 分钟，准备擦干",
      "practice.soakOn": "泡着，慢慢呼吸",
      "practice.guidedStep": "第 {n} / {total} 步 · {text}",
      "practice.paused": "已暂停",
      "practice.done": "做完了",
      "practice.doneTitle": "做完了 · 这一段 {time}",
      "practice.doneSub": "这一段只为当场放松。感觉怎么样都可以。",
      "practice.stopped": "已停止（练了 {time}）。想再来就点「开始」",
      "practice.keepCard": "存下本季养护卡",
      "practice.again": "再来一次",

      /* season care card */
      "card.title": "本季养护卡",
      "card.privateNote": "默认只留给你自己，存在这台手机上。",
      "card.showCond": "在我自己的卡上写出我的情况",
      "card.keep": "只留给自己",
      "card.savePng": "存成图片",
      "card.seasonToday": "{season}季 · {term}前后",
      "card.seasonAhead": "{season}季（{months}）",
      "card.head": "{who} · 这个{season}天这样养",
      "card.whoAnon": "按你的情况",
      "card.placeLabel": "适合去：",
      "card.itemEat": "吃：{tip}多吃{foods}。",
      "card.itemMove": "动：{move}",
      "card.itemRelax": "放松：{label}，想起来就做一段。",
      "card.foot": "{disclaimer} · HeaLoa",
      "card.kept": "已存在这台手机上，只有你看得到。下次打开 HeaLoa，首页会提醒你。",
      "card.keepFailed": "这台手机不允许本地保存，可以点「存成图片」。",
      "card.pngName": "healoa-本季养护卡.png",

      /* share (optional; never carries body or feeling data) */
      "share.open": "分享给别人（卡上不含你的身体情况）",
      "share.close": "收起分享",
      "share.panelNote": "分享卡只写季节和这个 App 是做什么的，不写你的身体情况和感受；链接里只有一个随机编号。",
      "share.imgAlt": "分享图预览",
      "share.qrAria": "二维码",
      "share.linkLabel": "链接",
      "share.send": "发送",
      "share.copy": "复制链接",
      "share.saveImg": "存分享图",
      "share.title": "HeaLoa · 顺着季节养",
      "share.text": "这个{season}天怎么养、去哪里养？点一下自己的情况就能看。",
      "share.cardBrand": "HeaLoa · 顺着季节养",
      "share.cardHead": "这个{season}天，顺着季节慢下来",
      "share.cardSub": "点一下你的情况，马上看这个季节注意什么、吃什么、怎么动、去哪里养",
      "share.scanCta": "扫码，点一下你自己的情况",
      "share.sent": "已打开发送。发不发、发给谁，由你决定。",
      "share.copiedWithText": "这台设备不能直接发送，已复制链接和一句介绍，粘贴给对方就行。",
      "share.copied": "链接已复制。",
      "share.copyFailed": "复制没成功，可以长按上面的链接手动复制。",
      "share.pngName": "healoa-分享卡.png",

      /* image modal */
      "modal.aria": "图片",
      "modal.imgAlt": "养护卡图片",
      "modal.longPress": "手机上可以长按图片保存到相册。",
      "modal.download": "下载图片",
      "modal.close": "关闭",

      /* footer */
      "about.summary": "关于这份 Demo",
      "about.versionPrefix": "预览版本",
      "about.versionSuffix": "· 可点原型，不是正式 App。",
      "about.how": "<b>推荐怎么来的：</b>按季节、当地历史气候和你点的情况，用固定规则算出来；没有任何商家付费，也不随机。没有实拍照片的地方不进前三。",
      "about.climate": "<b>气候数字：</b>历史气候均值，不是天气预报。Climate data: NASA POWER (CC BY 4.0)，2001–2020 年月均值；网格海拔较粗（例如武当山网格约 398 米，山上实际更高更冷），上线前会人工核对。",
      "about.photos": "<b>照片：</b>Photo · Cindy Yang。地点下的一句署名感受由 Cindy 本人提供，还没提供的地方先空着。",
      "about.privacy": "<b>隐私：</b>你点的情况只存在这台手机上（浏览器本地存储），不上传。分享图和分享链接里没有身体或感受信息，只有一个随机编号。本 Demo 没有服务器，正式版短链接会是 /s/编号。",
      "about.timer": "<b>计时：</b>放松练习按真实时间计时，暂停、继续、停止都准确；支持时会让屏幕保持常亮。",

      /* recommendation rules (app/rules.js) */
      "rules.seasonAvg": "{season}季平均 {t}",
      "rules.skipRain": "{avg}，日均降水 {pr} 毫米，正是雨季，出门不方便。",
      "rules.skipFrigid": "{avg}，最冷的月份 {min}，太冷，进出屋冷热变化大。",
      "rules.skipBpHotspring": "室外{avg}、泉水热，冷热反差大，血压偏高的人这个季节先不选。",
      "rules.skipBpCold": "{avg}{dip}，偏冷，血压偏高的人先去暖和、温差小的地方。",
      "rules.dipTo": "，{month}降到 {min}",
      "rules.skipBpDrop": "{avg}，{month}降到 {min}，降温快。",
      "rules.skipColdHands": "{avg}，{month} {min}，怕冷的人这个季节先不选。",
      "rules.skipGutCold": "{avg}，偏冷，肠胃弱的人先选暖一点的地方。",
      "rules.skipNightCold": "{avg}，{month}已降到 {min}，早晚冷，夜里更冷。",
      "rules.skipHumid": "{avg}、湿度 {rh}%、日均降水 {pr} 毫米，湿热多雨，{tail}",
      "rules.humidTailSleep": "夜里闷。",
      "rules.humidTailGut": "容易贪凉吃冰。",
      "rules.tempWarm": "暖和，不用在冷风里进进出出",
      "rules.tempMild": "不冷不热",
      "rules.tempCool": "偏凉，出门加件外套",
      "rules.tempChilly": "偏冷，屋里要暖",
      "rules.tempCold": "室外冷，出门要穿厚",
      "rules.reason1": "{season}季（{months}）平均 {t}、湿度 {rh}%：{word}。",
      "rules.reason2": "{m1} {t1} → {m3} {t3}{trend}；日均降水 {pr} 毫米{rain}",
      "rules.trendBig": "，季节里降温明显，要跟着加衣",
      "rules.trendStable": "，季节里温度稳定",
      "rules.rainLow": "，少雨，适合每天出门走走。",
      "rules.rainHigh": "，雨多，带伞，多安排屋里的活动。",
      "rules.rainMid": "。",
      "rules.short": "{season}季平均 {t}、湿度 {rh}%{extra}。",
      "rules.shortHotspring": "，有温泉（41℃ 以下、10 分钟以内）",
      "rules.shortAltitude": "，海拔约 2000 米，出发前先听专业意见"
    },
    content: {
      conditions: { bp: "血压偏高", sleep: "睡不踏实", cold: "怕冷手脚凉", gut: "肠胃弱", tense: "心里绷得紧", quiet: "想安静一点" },
      seasons: {
        autumn: { label: "秋", months: "9–11 月", monthNames: ["9 月", "10 月", "11 月"] },
        winter: { label: "冬", months: "12–2 月", monthNames: ["12 月", "1 月", "2 月"] }
      },
      /* Same order as SOLAR_TERMS dates in app/data.js. */
      solarTerms: ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"],
      /* cindyLine = Cindy's own signed line for this locale. Leave "" until she provides it; never generate or translate it for her. */
      places: {
        wudang: {
          name: "武当山 · 山居慢住",
          area: "湖北 · 十堰",
          alt: "武当山里的山居院子",
          benefit: "山坳里的院子，早上雾从山谷慢慢升起来，四周很安静，有山林疗愈氛围。",
          cindyLine: "",
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
        pattaya: {
          name: "芭提雅 · 海边",
          area: "泰国 · 春武里",
          alt: "芭提雅傍晚的海湾",
          benefit: "海风是暖的，傍晚的海湾慢慢变成橘色，走在海边身子松下来。",
          cindyLine: "",
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
        onsen: {
          name: "日本森林温泉 · 草津",
          area: "日本 · 群马",
          alt: "草津温泉汤畑的热气和木槽",
          benefit: "热气从汤畑里慢慢冒出来，走在温泉街上，身子一点点暖起来。",
          cindyLine: "",
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
        harbin: {
          name: "哈尔滨 · 冰雪",
          area: "黑龙江",
          alt: "哈尔滨雪后的村子",
          benefit: "雪落下来的时候四周很安静，屋里暖烘烘的。",
          cindyLine: "",
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
        xishuangbanna: {
          name: "西双版纳",
          area: "云南",
          cindyLine: ""
        },
        tengchong: {
          name: "腾冲",
          area: "云南",
          cindyLine: ""
        },
        kunming: {
          name: "昆明",
          area: "云南",
          cindyLine: ""
        },
        phuket: {
          name: "普吉",
          area: "泰国",
          cindyLine: ""
        }
      },
      care: {
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
      },
      practices: {
        breath46: {
          label: "慢呼吸 · 吸 4 呼 6",
          short: "慢呼吸",
          intro: "跟着圆圈：变大时用鼻子慢慢吸气，变小时慢慢呼气。不憋气。",
          phases: ["吸气", "呼气"]
        },
        breath478: {
          label: "4-7-8 呼吸 · 睡前",
          short: "4-7-8",
          intro: "吸 4 秒，停 7 秒，呼 8 秒，做 4 轮。停不住就别硬撑，换成吸 4 呼 6。",
          phases: ["吸气", "停一停", "慢慢呼气"]
        },
        walk: {
          label: "慢走节奏",
          short: "慢走节奏",
          intro: "跟着「左 · 右」的节奏慢慢走，吸气走三步，呼气走三步。在屋里、走廊、公园都可以。"
        },
        soak: {
          label: "泡脚 / 泡汤计时",
          short: "泡脚计时",
          intro: "水温 41℃ 以下（摸着温热、不烫），每次 10 分钟以内。先冲冲手脚，起身慢一点。"
        },
        baduanjin1: {
          label: "八段锦第一式 · 两手托天理三焦",
          short: "八段锦第一式",
          intro: "一式样品，站着、坐着都可以。肩颈不舒服就只抬到舒服的高度。",
          steps: [
            "两脚分开与肩同宽，站稳（也可以坐着），肩膀放松。",
            "两手在小腹前十指交叉，掌心向上，慢慢吸气。",
            "两手经胸前翻掌向上托起，眼睛跟着手，慢慢往上伸展。",
            "在上面停两秒，不憋气，自然呼吸。",
            "慢慢呼气，两手从身体两侧落下，回到小腹前。",
            "再做一次：吸气托起，呼气落下。",
            "第三次：动作越慢越好，做完站一会儿。"
          ]
        },
        taiji1: {
          label: "太极 · 起势",
          short: "太极起势",
          intro: "一式样品，慢、柔、配合呼吸。膝盖不舒服就少蹲一点。",
          steps: [
            "两脚并拢站好，全身放松，眼睛平视。",
            "左脚向左轻轻迈开，与肩同宽。",
            "两手慢慢向前平举，与肩同高，同时吸气。",
            "膝盖微微弯曲，两手轻轻按下到腹前，同时呼气。",
            "再做一次：吸气举起，呼气按下。",
            "第三次，越慢越好，做完站一会儿。"
          ]
        }
      },
      homePlan: {
        bp: ["睡前 1–2 小时泡脚 10 分钟（41℃ 以下）", "慢呼吸 3 分钟：吸 4 秒、呼 6 秒，不憋气", "附近公园慢走 20–30 分钟"],
        sleep: ["睡前 1–2 小时泡脚 10 分钟", "调暗灯光，放下手机", "躺下前做 4 轮 4-7-8 呼吸"],
        cold: ["晚上泡脚 10 分钟，擦干马上穿袜子", "一杯温热的红枣茶", "太阳好的时候慢走 20 分钟"],
        gut: ["早饭一碗热粥", "饭后半小时慢走 15 分钟", "睡前顺时针轻揉肚子 3 分钟"],
        tense: ["跟着慢走节奏走 20 分钟", "慢呼吸 3 分钟", "每天留 10 分钟什么都不做"],
        quiet: ["找一个固定的安静时段", "泡一壶茶，慢慢喝", "慢呼吸 3 分钟，看看窗外"]
      },
      quiz: {
        cold: "手脚常常凉，比身边的人怕冷？",
        sleep: "晚上不容易睡着，或者半夜容易醒？",
        gut: "吃点凉的、油的，肚子就不舒服？",
        tense: "最近心里总绷着，放松不下来？",
        bp: "量血压时，常常比建议的数值高一点？"
      }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
