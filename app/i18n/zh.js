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
      "meta.description": "按你最近的身体和心情，配出这个节气最适合你去放松的 3 个地方。",
      "brand.sub": "顺着季节养",
      "disclaimer": "这是顺应季节的养生参考，身体不适请以专业意见为准",
      "copyright": "",
      "match.r.cozy": "你想待在暖暖的屋子里：这里有能慢慢待着的屋子。",
      "place.actionsLead": "在这里可以做的 {n} 件小事，点一下就开始：",
      "place.actGo": "开始",
      "imm.open": "走进这里看看",
      "imm.hint": "拖动画面，近处和远处会跟着动。",
      "imm.hintGyro": "慢慢转动手机，像站在那里往外看。",
      "imm3d.hint": "拖动四处看；按住「往前走」慢慢走近。点一下画面，说明会收起或再出来。",
      "imm3d.fwd": "按住往前走",
      "imm3d.back": "按住往后退",
      "imm3d.to2d": "换成照片看",
      "imm3d.to3d": "换成 3D 看",
      "imm3d.note": "3D 由 World Labs 根据照片生成",
      "imm3d.loading": "正在打开 3D 场景… {pct}%",
      "imm3d.fallback": "这台手机先用照片看：拖动画面，近处和远处会跟着动。",
      "about.world3d": "<b>3D：</b>把武当山日出平台这一张照片交给 World Labs（Marble），生成了一个可以走进去看的 3D 场景。只上传了这一张照片。",
      "imm.gyro": "转动手机来看",
      "music.on": "音乐：开",
      "music.off": "音乐：关",
      "greet.sep": " · ",
      "reveal.summary": "这个{term}，适合你的是：{places}",
      "reveal.open": "点照片，走进去看看 ›",
      "sound.on": "声音：开",
      "sound.off": "声音：关",
      "practice.stoppedNote": "停下也没关系。想留下这一季的安排，可以存一张卡。",
      "music.noteSynth": "轻柔的合成音色，手机当场生成。",
      "music.noteTrack": "安静背景声，大约一分钟，循环播放。",
      "remind.open": "每天提醒我做 3 分钟（可以不要）",
      "remind.openDone": "要不要每天轻轻提醒一下？",
      "remind.title": "每天 3 分钟的小提醒",
      "remind.lead": "想要的话，每天到点轻轻提醒你一下。错过了也没关系，想做的时候再做。",
      "remind.whenTitle": "什么时候提醒？",
      "remind.custom": "或者自己选时间",
      "remind.whatTitle": "做哪一个？",
      "remind.t0800": "早上 8:00",
      "remind.t1230": "中午 12:30",
      "remind.t2130": "睡前 21:30",
      "remind.ics": "加到手机日历（每天重复）",
      "remind.notify": "App 开着时，也在这台设备上提醒我",
      "remind.howNote": "日历提醒由你手机自己的日历来响，App 关着也会提醒；随时可以在日历里删掉。网页版的通知只在 App 开着时才会出现。",
      "remind.onNote": "这台设备上的提醒已经打开。",
      "remind.offBtn": "不要提醒了",
      "remind.off": "好的，不再提醒。日历里加过的，可以在日历里删掉。",
      "remind.icsDone": "日历文件已经生成，打开它、点「添加」就好。",
      "remind.notifyOn": "好的，App 开着时会在这台设备上提醒你。",
      "remind.notifyDenied": "这台设备没有允许通知，用上面的日历提醒就行。",
      "remind.icsTitle": "HeaLoa · {label}",
      "remind.icsBody": "有空的话，花 3 分钟慢下来。没空也没关系。",
      "share.saveVideo": "存视频",
      "share.howTo": "在手机上点「发给一个人…」，会打开手机自带的分享，可以直接选要发的 App 和人。也可以先存图片或视频，再从相册发。",
      "share.videoName": "healoa-分享视频",
      "share.videoGuide": "视频准备好了：点下面的按钮保存，或者直接发送。",
      "share.videoMaking": "正在做一段 6 秒的视频，稍等一下…",
      "share.videoFailed": "这台设备做不了视频，可以先存图片。",
      "modal.downloadVideo": "下载视频",
      "modal.shareVideo": "发送这段视频",
      "modal.longPressVideo": "可以点下面的按钮保存视频。",
      "about.immersive": "<b>走进这里看看：</b>用一张照片，在这台电脑上算出远近（景深），拖动或转动手机时，近处和远处移动得不一样。算景深这一步没有上传照片。",
      "about.music": "<b>声音：</b>太极、八段锦和武当的画面是练习原片，循环播放，片子里没有配乐。背景声是一段安静曲子（SONO，约一分钟），这一版预览默认开着，右上角「声音」可以关掉。",
      "punct.colon": "：",
      "punct.listSep": "、",
      "nav.back": "‹ 返回",
      "season.switchAria": "切换季节",
      "season.autumn": "秋",
      "season.winter": "冬",
      "season.spring": "春",
      "season.summer": "夏",
      "cond.groupAria": "点一下你的情况",
      "lang.switchAria": "语言",
      "social.follow": "关注我们",

      /* home (v4: 3 steps 「怎么用」 + one start button) */
      "home.headline": "这个节气，哪里最适合你？",
      "home.subline": "按你最近的身体和心情，配出这个节气最适合你去放松的 3 个地方——给想顺着季节照顾自己的人。",
      "home.hint": "不用注册 · 答案只留在你的手机里",
      "home.stepsAria": "怎么用",
      "home.stepsTitle": "怎么用",
      "home.step1": "花 2 分钟点几下，说说你最近的身体和心情",
      "home.step2": "翻牌看这个节气适合你的 3 个地方和原因",
      "home.step3": "走进一个地方，做几分钟放松，记下这一次",
      "home.start": "开始配对（约 2 分钟）",
      "home.seasonToday": "今天是{term}前后 · {season}天",
      "home.seasonAhead": "先看看{season}天",
      "home.seasonPending": "今天是{term}前后 · {now}天。{now}天的内容还在准备，先看看{season}天",
      "home.termExplain": "节气是中国传统历法里的 24 个小季节，大约半个月换一个。",
      "home.returnHint": "你上次存了一张{season}季养护卡，点这里打开",
      "home.rematch": "{term}到了，重新配一次？",
      "home.lastMatch": "上次配到：{places} · 点这里再看看",
      "home.nextTerm": "下一个节气是{next}（{date}），到时回来重新配一次，结果会跟着节气变。",
      "home.today": "今天的 3 分钟 · 慢呼吸",
      "home.places": "看看所有地方",
      "home.records": "我的养护记录",
      "home.moreAria": "更多",

      "first.title": "先在一个地方里，慢慢待一分钟",
      "first.lead": "画面是静音的。点「开始」后，会放约一分钟安静的歌；跟着慢吸慢呼，或只是轻轻放松肩膀。",
      "first.ready": "准备好了，就点「开始」",
      "first.start": "开始",
      "first.toQuiz": "接下来，答几个小问题",
      "first.skipPlaces": "跳过问题，直接看本季地方",
      "first.hint": "不用注册 · 答案只留在你的手机里",
      "first.inhale": "慢慢吸气 {n}",
      "first.exhale": "慢慢呼气 {n}",
      "first.move": "肩膀轻轻放松一下",
      "first.doneCue": "这一分钟到了。想更准一点，可以答几个小问题；也可以直接看本季地方。",

      /* opened from a share link */
      "shared.kicker": "有人把 HeaLoa 分享给了你",
      "shared.headline": "这个节气，哪里最适合你？",
      "shared.subline": "花 2 分钟点几下，按你自己的身体和心情，配出这个节气适合你去放松的 3 个地方。",
      "shared.hint": "你的答案只留在你自己的手机里 · 不用注册",
      "shared.start": "给自己也配一次（约 2 分钟）",

      /* v4 matching quiz: one question per screen */
      "quiz.title": "2 分钟配对",
      "quiz.intro": "一屏一题，点一点就行。答案只留在你的手机里，随时可以退出。",
      "quiz.progress": "第 {n} 题 / 共 {total} 题",
      "quiz.progressAria": "答题进度",
      "quiz.multi": "可以选几个",
      "quiz.single": "选一个",
      "quiz.next": "下一题",
      "quiz.finish": "看结果",
      "quiz.prev": "‹ 上一题",
      "quiz.skip": "都不是 / 说不准",
      "quiz.exit": "先不答了，回首页",

      /* flip reveal */
      "reveal.title": "{season}天 · {term}前后",
      "reveal.lead": "按你的回答和当下的节气算出来的，不是抽签。点一下牌，翻开看看。",
      "reveal.front": "第 {n} 张",
      "reveal.tap": "点一下翻开",
      "reveal.match": "{season}天 · 适合你的是：{kind}",
      "reveal.flipAll": "全部翻开",
      "reveal.why": "看看为什么",
      "reveal.fewer": "按你的回答，这个节气合适的地方有 {n} 个，其他地方先不选，原因在下一页。",
      "reveal.none": "按你的回答，这个节气先在家里做就好，原因在下一页。",
      "reveal.redo": "重新配一次",

      /* result */
      "result.condsAria": "换一个情况",
      "result.title": "{season} · 为什么是这几个地方",
      "result.termLine": "按你的回答和{term}前后的气候算出来，不是抽签，也没有商家付费。",
      "result.seasonToday": "现在是{term}前后 · {season}天",
      "result.seasonAhead": "先看看{season}天（{months}）",
      "result.noteTitle": "本季要留意",
      "result.placesTitle": "这个季节去哪里养",
      "result.whyLabel": "为什么是你",
      "result.eatLabel": "吃什么：",
      "result.doLabel": "做什么：",
      "result.avoidLabel": "避开什么：",
      "result.enter": "走进去看看",
      "result.redo": "重新配一次",
      "result.nextTerm": "下一个节气{next}（{date}）开始时，回来重新配一次，结果会跟着节气变。",
      "result.atHomeFirst": "你选了先在家里做：下面这些在家就能做，地方可以先看看。",
      "result.usNote": "现在所有地方都在亚洲，从美国过去路比较远；去不了的话，在家的小事哪里都能做。",
      "result.allPlaces": "看看所有地方（全部都能进）",
      "result.placesSub": "按{season}天的历史气候和你的回答排出来，每个地方都有实拍照片",
      "result.rank": "第 {n} 选",
      "result.openPlace": "看看这个地方：为什么合适、去了做什么",
      "result.homeTitle": "去不了远方？在家也能这样做",
      "result.soakBtn": "泡脚计时 10 分钟",
      "result.skipTitle": "这个季节先不选",
      "result.moreTitle": "还有这些地方",
      "result.moreSub": "这些地方也可以考虑，我们还没去拍照片，所以先简单说几句，不排进前三。",
      "result.relaxCta": "先放松几分钟 · {label}",
      "result.eatTitle": "吃喝",
      "result.eatMore": "可以多吃：",
      "result.eatLess": "可以少一点：",
      "result.eatTip": "记住一句：",
      "result.eatDrink": "喝点什么：",
      "result.eatNote": "茶饮：怀孕或身体有长期状况的，先听专业意见。",
      "result.moveTitle": "怎么动",
      "result.moveFollow": "跟着做一做（简单示范，站着、坐着都可以）：",
      "result.moveWalk": "慢走节奏",
      "result.moveBaduanjin": "八段锦第一式",
      "result.moveTaiji": "太极起势",
      "result.moveBreath": "慢呼吸 3 分钟",
      "result.caution": "要注意：",
      "result.cardCta": "存一张本季养护卡",
      "result.kbTitle": "按你的回答，这个节气可以参考",
      "result.careplanCta": "看看本季安排",
      "careplan.title": "本季安排",
      "careplan.lead": "按这个节气，在家也能慢慢做的小事。想存下来，就点下面的养护卡。",
      "careplan.backWhy": "回到为什么是这几个地方",
      "practice.here": "在这里 · {place}",
      "practice.guidedProg": "第 {n} / {total} 步",
      "imm.bandwidth": "3D 约 9 MB，建议在 Wi‑Fi 下打开；也可以先用照片看。",
      "result.srcNote": "地点的温度、湿度按往年平均算，不是天气预报。",

      /* place */
      "place.cindyLine": "“{line}”",
      "place.skipLabel": "这个季节先不选：",
      "place.climateSkip": "{season}天的气候",
      "place.climateFit": "为什么{season}天适合",
      "place.eatTitle": "在这里可以吃",
      "place.suitsTitle": "适合谁",
      "place.avoidTitle": "要避开什么",
      "place.actionTitle": "在这里做一件事",
      "place.allPlaces": "看看所有地方",
      "place.todoTitle": "在这里做什么",
      "place.hotspringCaution": "泡汤：水温 41℃ 以下，每次 10 分钟以内，起身要慢。",
      "place.homeTitle": "去不了？在家也能这样做",
      "place.srcNote": "温度、湿度按往年平均算，不是天气预报；山里、高处会比表里更凉一些。",

      /* answer-related reasons (app/match.js): shown only when that answer really added points for the place */
      "match.r.want_warm": "你更怕冷：这里{season}季平均 {t}，暖和。",
      "match.r.warm_spring": "你更怕冷：这里是温泉街，泡完身子暖。",
      "match.r.want_cool": "你更怕热：这里{season}季平均 {t}，不闷热。",
      "match.r.even_temp": "你选了血压偏高：这里{season}季暖和、冷热变化小，最冷的月份也有 {min}。",
      "match.r.avoid_damp": "你天潮时身上发沉：这里{season}季湿度 {rh}%，不算太潮。",
      "match.r.avoid_dry": "你常觉得口干：这里{season}季湿度 {rh}%，不算干。",
      "match.r.gentle_pace": "你想慢一点：这里路平，慢慢走就行。",
      "match.r.active_ok": "你精神挺足：这里可以多走一走。",
      "match.r.quiet": "你想安静一点：这里人少、很安静。",
      "match.r.nature": "你想离山水近一点：这里走一走、看一看就是自然。",
      "match.r.open_view": "你想看得远一点：这里视野开阔。",
      "match.r.lively": "你想热闹开心一点：这里街上热闹。",
      "match.r.scene_sea": "你想去海边：这里就在海湾边。",
      "match.r.scene_mountain": "你想去山里：这里就在山里。",
      "match.r.scene_hotspring": "你想泡温泉：这里是温泉街。",
      "match.r.scene_forest": "你想去森林：这里四周是林子。",
      "match.r.scene_snow": "你想看冰雪：这里冬天下雪。",
      "match.r.near": "离家近，周末就能去。",

      /* browse all places (all open from the first visit) */
      "places.title": "所有地方",
      "places.lead": "每个地方都开着，想看哪里就点哪里。",
      "places.open": "进去看看",

      /* my care log (local only) */
      "records.title": "我的养护记录",
      "records.lead": "只存在这台手机上，只给你自己看，可以随时删掉。",
      "records.empty": "还没有记录。做完一次放松，这里会自动记下一行。",
      "records.row": "{date} · {term}",
      "records.atHome": "在家",
      "records.cardKept": "存了一张本季养护卡",
      "records.addNote": "写一句",
      "records.editNote": "改这一句",
      "records.notePlaceholder": "写一句给自己的话（60 字以内，可以不写）",
      "records.saveNote": "存下",
      "records.delete": "删掉这一行",
      "records.clearAll": "全部删掉",
      "records.cleared": "记录已经全部删掉了。",
      "records.nextTerm": "下一个节气{next}（{date}）开始时，回来重新配一次。",

      /* relaxation practice */
      "practice.modesAria": "选择练习",
      "practice.footL": "左",
      "practice.footR": "右",
      "practice.ready": "准备好了，就点「开始」",
      "practice.readyGuided": "准备好了就点「开始」，跟着文字慢慢做",
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
      "practice.doneSub": "这一段只为让你当场放松一下。感觉怎么样都可以。",
      "practice.stopped": "停下了（做了 {time}）。想再来，就点「开始」",
      "practice.keepCard": "存下本季养护卡",
      "practice.again": "再来一次",
      "practice.logged": "这一次已经记在「我的养护记录」里，只在这台手机上。",
      "practice.openRecords": "看看我的养护记录",

      /* season care card */
      "card.title": "本季养护卡",
      "card.privateNote": "这张卡默认只给你自己看，存在这台手机上。",
      "card.showCond": "在我自己的卡上写出我的情况",
      "card.keep": "只留给自己",
      "card.savePng": "存成图片",
      "card.seasonToday": "{season}季 · {term}前后",
      "card.seasonAhead": "{season}季（{months}）",
      "card.head": "{who} · 这个{season}天这样养",
      "card.whoAnon": "按你的情况",
      "card.lineHidden": "你留的这句话，打开上面的「写出我的情况」后，才会写在卡上和图片里。",
      "card.placeLabel": "适合去：",
      "card.itemEat": "吃：{tip}多吃{foods}。",
      "card.itemMove": "动：{move}",
      "card.itemRelax": "放松：{label}，想起来就做一段。",
      "card.foot": "{disclaimer} · HeaLoa",
      "card.kept": "存好了，只有你看得到。下次打开 HeaLoa，首页会提醒你。",
      "card.keepFailed": "这台手机不让在本机保存，可以点「存成图片」。",
      "card.pngName": "healoa-本季养护卡.png",

      /* share (optional; never carries body or feeling data) */
      "share.open": "发给一个人（卡上不写你的身体情况）",
      "share.close": "收起分享",
      "share.panelNote": "卡上只写季节和这个 App 是做什么的，不写你的身体情况；链接里只有一个随机编号。",
      "share.imgAlt": "分享图预览",
      "share.qrAria": "二维码",
      "share.linkLabel": "链接",
      "share.send": "发给一个人…",
      "share.copy": "复制链接",
      "share.saveImg": "存图片",
      "share.title": "HeaLoa · 顺着季节养",
      "share.text": "这个{season}天，哪里最适合你？花 2 分钟点几下就能配出来。",
      "share.cardBrand": "HeaLoa · 顺着季节养",
      "share.cardHead": "这个{season}天，顺着季节慢下来",
      "share.cardSub": "花 2 分钟点几下，配出这个节气适合你去放松的 3 个地方",
      "share.scanCta": "用手机相机扫一扫，给自己也配一次",
      "share.sent": "已打开发送。发不发、发给谁，由你决定。",
      "share.copiedWithText": "这台设备不能直接发送，已经复制好链接和一句介绍，粘贴给对方就行。",
      "share.copied": "链接已复制。",
      "share.copyFailed": "复制没成功，可以长按上面的链接，手动复制。",

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
      "about.how": "<b>推荐怎么来的：</b>先按安全规则排除这个季节不合适的地方，再按你的回答（怕冷怕热、想去海边还是山里……）加分，最后按当下节气那个月的气候调整；没有任何商家付费，也不随机。只放有实拍照片的地方。",
      "about.climate": "<b>气候数字：</b>按往年平均算（2001–2020 年每月平均），不是天气预报。山里、高处会比表里更凉一些。数据来源：NASA POWER（CC BY 4.0）。",
      "about.photos": "<b>照片：</b>地点下的一句感受有写的才显示，没有的先空着。",
      "about.privacy": "<b>隐私：</b>你的回答和养护记录只存在这台手机上（浏览器本地存储），不上传。分享图和分享链接里没有身体或感受信息，只有一个随机编号；你自己留的一句话只在你选择发送时才写进链接。本 Demo 没有服务器，正式版短链接会是 /s/编号。",
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
      "rules.shortAltitude": "，海拔约 2000 米，出发前先听专业意见",

      /* v2026-09-27-u: leave a line, send it to one person, per-platform share, recipient line */
      "result.lead": "下面是这个季节可以去的地方，和在家就能做的小事。",
      "share.lead": "发给一个你想分享这一刻的人。",
      "share.openCta": "打开链接，给自己也配一次",
      "share.storyName": "healoa-分享图.png",
      "share.storyGuide": "长按图片保存到相册，就可以从相册发给朋友。",
      "share.t.copy": "复制链接",
      "share.t.sms": "短信",
      "share.t.whatsapp": "WhatsApp",
      "share.t.x": "X",
      "share.t.line": "LINE",
      "share.guide.sms": "已打开短信，选好联系人就能发。",
      "share.guide.whatsapp": "已打开 WhatsApp，选好联系人就能发。",
      "share.guide.x": "已打开 X 的发帖页。",
      "share.guide.line": "已打开 LINE 分享页。",
      "modal.share": "发送这张图",
      "line.open": "留一句",
      "line.edit": "改这一句",
      "line.lead": "给自己留一句话，写在你的卡上。",
      "line.placeholder": "写一句给自己的话（60 字以内）",
      "line.note": "只存在这台手机上。发给别人时，这句话会跟着卡一起去，所以别写身体情况。",
      "line.save": "写在卡上",
      "line.cancel": "先不写",
      "line.clear": "删掉这一句",
      "line.onCard": "“{line}”",
      "line.empty": "先写一句，再点「写在卡上」。",
      "line.saved": "写好了，只在这台手机上。发给别人时，这句话会跟着卡一起去。",
      "line.savedPrivate": "写好了，只存在这台手机上。这句话提到了身体情况，发给别人时不会带上；打开「写出我的情况」后，才写在你自己的卡上。",
      "line.cleared": "这一句删掉了。",
      "recv.lineLabel": "对方给自己留了一句：",
      "recv.write": "在旁边也写一句",
      "recv.makeOwn": "给自己也配一次",
      "recv.placeholder": "写一句放在对方旁边（60 字以内）",
      "recv.writeNote": "只能写一次。只存在你的手机和你发回去的链接里，不经过任何服务器。别写身体情况。",
      "recv.save": "写好了",
      "recv.mineLabel": "你在旁边写的：",
      "recv.sendBack": "发回给对方",
      "recv.sendBackNote": "把这个链接发回去，对方打开就能看到你写的这一句。",
      "recv.sendText": "我在你旁边也写了一句。",
      "recv.alreadyWrote": "你已经在旁边写过一句了。",
      "recv.private": "这句话提到了身体情况，换一句再写吧。",
      "recv.makeOwnHint": "花 2 分钟点几下，就有你自己的结果。",
      "reply.kicker": "对方在你的旁边也写了一句",
      "reply.yours": "你写的：",
      "reply.theirs": "对方写的：",
      "date.md": "{month} {d} 日",
      "draft.badge": "预览草稿"
    },
    content: {
      /* Words that keep a user-written line from travelling in a shared link (body states). Not shown anywhere.
       Stems on purpose (眠 / 糖尿 / 焦 / 郁 match the longer words that contain them) so this file stays clean for the banned-word scan (rule R05, HEALOA_RULES.md). */
      privateWords: ["血压", "睡不", "肠胃", "怕冷", "手脚凉", "绷得紧", "身体情况", "眠", "糖尿", "焦", "郁", "胃", "心慌", "头疼", "头痛", "疼"],
      conditions: { bp: "血压偏高", sleep: "睡不踏实", cold: "怕冷手脚凉", gut: "肠胃弱", tense: "心里绷得紧", quiet: "想安静一点" },
      seasons: {
        autumn: { label: "秋", months: "9–11 月", monthNames: ["9 月", "10 月", "11 月"] },
        winter: { label: "冬", months: "12–2 月", monthNames: ["12 月", "1 月", "2 月"] }
      },
      /* Same order as SOLAR_TERMS dates in app/data.js. */
      solarTerms: ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"],
      /* v2026-09-28-a: one quiet line per solar term (weather / nature only, no advice; same order as solarTerms) */
      termGreetings: ["小寒到了，天冷得扎实，屋里暖一点，心也就静了。","一年里最冷的时候，也是离春天最近的时候。","风开始变软，日子慢慢往亮处走。","细雨落下来，土地一点点醒了。","春雷响过，万物都伸了个懒腰。","昼夜一样长，适合把日子的节奏放匀一点。","天清地明，出门走走，看看新绿。","雨水多了，花开得正好。","白天长了，傍晚的风很舒服。","麦穗渐渐饱满，小小的满足刚刚好。","田里正忙，也给自己留一段慢下来的时间。","一年里白天最长的一天，找一片树荫坐一会儿。","热起来了，清晨和傍晚最适合出门。","一年里最热的时候，慢一点，找个凉快的地方待着。","暑气还在，早晚已经有一点凉意。","暑热慢慢退去，天高了一些。","早晨草叶上有了露水，出门添件薄外套。","昼夜平分，秋意正好，适合慢慢走走。","露水更凉了，山里的颜色一天比一天深。","早上可能见霜，天晴的时候最适合晒晒太阳。","冬天开始了，屋里的灯显得格外暖。","北方开始飘雪，喝口热汤，暖暖地待着。","雪下得多了，外面很安静，心也跟着静下来。","一年里夜最长的一天，从今天起，白天一点点变长。"],
      /* cindyLine = Cindy's own signed line for this locale. Leave "" until she provides it; never generate or translate it for her. */
      places: {
        wudang: {
          name: "武当山 · 山居慢住",
          area: "湖北 · 十堰",
          alt: "武当山里的山居院子",
          benefit: "山坳里的院子，早上雾从山谷慢慢升起来，四周很安静，有山林疗愈氛围。",
          kind: "安静的山居",
          cindyLine: "",
          food: ["清淡的山野时蔬、热汤", "坐在露台慢慢喝一壶热茶", "少吃辛辣、重油"],
          todo: ["清晨在院子和石阶上慢走 20 分钟", "跟着做几式太极或八段锦（武当山素来与太极相连）", "在露台看云、喝茶、发会儿呆"],
          caution: ["表里的温度按山脚算，山上更冷，多带一件外套。", "石阶多，慢慢走，不赶路登顶。"],
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
          kind: "温暖的海边",
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
          kind: "冒着热气的温泉街",
          cindyLine: "",
          food: ["热荞麦面、热汤", "泡汤前后各喝一杯温水"],
          todo: ["在温泉街慢走，看汤畑的热气", "泡汤或足汤：选 41℃ 以下的池子，每次 10 分钟以内"],
          caution: ["泡之前先冲冲手脚，起身慢一点，别一个人泡；饭后、喝酒后不泡，头晕马上出来。", "这里在山上，早晚凉，多带一层衣服。"],
          fit: {
            bp: "可以泡，但要守住：水温 41℃ 以下、每次 10 分钟以内、起身要慢。",
            sleep: "睡前 1–2 小时泡 10 分钟，擦干、穿暖，回屋早点睡。",
            cold: "泡完身子暖，擦干马上穿袜子、戴帽子再出门。",
            gut: "吃热的、清淡的，泡汤前后别吃太饱。",
            tense: "在热气和林子里慢慢走，心里会松一点。",
            quiet: "清晨的温泉街人少，很安静。"
          }
        },
        seashrine: {
          name: "日本海边 · 温泉与神社",
          area: "日本",
          alt: "落地窗前的日落海面，远处是安静的天际线",
          benefit: "傍晚的海面慢慢变成暖色。坐在窗边看一会儿，是一处安静的疗愈地方。神社的屋檐在蓝天下，空气很稳。",
          kind: "海边的安静角落",
          cindyLine: "",
          food: ["热汤、清淡的鱼、温热的茶", "少喝冰的，少吃太生的"],
          todo: ["傍晚坐在窗边看海，做几分钟慢呼吸", "白天到神社前慢慢走走，看看屋檐", "想泡汤就选 41℃ 以下的池子，每次 10 分钟以内"],
          caution: ["中午海边太阳好，别晒太久。", "泡汤：水温 41℃ 以下、每次 10 分钟以内，起身慢一点，别一个人泡；饭后、喝酒后不泡。", "神社的台阶慢慢走，不赶路。"],
          fit: {
            bp: "海边温差比高山小一些，出门慢慢走。想泡汤就守住：41℃ 以下、10 分钟以内、起身要慢。",
            sleep: "傍晚看一会儿海，回屋把灯光调暗，早点休息。",
            cold: "窗边暖和，出门加一件外套，脚别受凉。",
            gut: "吃热的、清淡的，少碰冰饮。",
            tense: "看海面慢慢变色，走一走神社前的路，心里会松一点。",
            quiet: "人少的时候，窗边和神社前都很安静，适合什么都不安排。"
          }
        },
        harbin: {
          name: "哈尔滨 · 冰雪",
          area: "黑龙江",
          alt: "松枝框着厚雪屋顶的雪乡",
          benefit: "厚雪压着屋顶，松枝框着村子。雪落下来的时候四周很安静，屋里暖烘烘的。",
          kind: "安静的雪乡",
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
            safety: "长期睡不踏实，请听专业意见。练习中觉得憋闷，就放慢一点，自然呼吸。"
          },
          winter: {
            note: [
              { tag: "作息", text: "冬天早睡晚起，早上等太阳出来再起身活动。" },
              { tag: "卧室", text: "卧室别太热、别太干，被子里先把脚暖好。" },
              { tag: "睡前", text: "睡前 1–2 小时泡脚 10 分钟，擦干穿好袜子。" }
            ],
            eat: { more: "红枣、小米、核桃、桂圆（少量）", less: "晚饭太饱、辛辣", tip: "晚饭早一点、清淡一点。", drink: "睡前一杯温热、不含咖啡因的饮品。" },
            move: ["白天晒着太阳慢走 20 分钟。"],
            safety: "长期睡不踏实，请听专业意见。练习中觉得憋闷，就放慢一点，自然呼吸。"
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
        breathNight: {
          label: "睡前慢呼吸 · 吸 4 呼 6",
          short: "睡前慢呼吸",
          intro: "躺着、坐着都可以。跟着圆圈：变大时慢慢吸气 4 秒，变小时慢慢呼气 6 秒，不憋气。做 10 轮，不到 2 分钟。",
          phases: ["吸气", "慢慢呼气"]
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
        sitEasy: {
          label: "坐着也能做 · 3 分钟",
          short: "坐着 3 分钟",
          intro: "不爱运动也没关系：坐在椅子上就能做，动作很小、很慢。哪里不舒服就跳过那一步。",
          steps: [
            "坐在椅子前半部分，两脚平放在地上，背轻轻挺直。",
            "吸气时慢慢耸起肩膀，呼气时让肩膀落下来。做几次。",
            "头慢慢转向左边，再慢慢转向右边，只转到舒服的地方。",
            "两手轻轻握拳再张开，手腕慢慢转几圈。",
            "脚跟不动，脚尖轻轻点地，再换脚跟点地。",
            "手放在肚子上，自然地吸气、呼气，感觉肚子一起一落。",
            "最后坐着看看窗外或远处，什么都不用做。"
          ]
        },
        baduanjin1: {
          label: "八段锦第一式 · 两手托天理三焦",
          short: "八段锦第一式",
          intro: "先学第一式，站着、坐着都可以。肩颈不舒服就只抬到舒服的高度。",
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
          intro: "先学起势：慢、柔、配合呼吸。膝盖不舒服就少蹲一点。",
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
      /* Card text when 「写出我的情况」 is off: the same for every condition, so the card and its image reveal nothing about the user's state. */
      careGeneric: {
        autumn: { eat: "吃：秋天干燥，多吃润一点的，比如梨、百合、银耳。", move: "动：每天出门慢走 20–30 分钟，走到身上微微发热就好。", relax: "放松：慢呼吸，吸 4 秒、呼 6 秒，想起来就做一段。", safety: "做什么都量力而行；觉得不舒服，就先停下来歇一歇。" },
        winter: { eat: "吃：冬天吃热的、七分饱，比如萝卜、淮山、小米、温热的汤。", move: "动：天气好的中午出门慢走 20 分钟，大风天改在屋里走。", relax: "放松：慢呼吸，吸 4 秒、呼 6 秒，想起来就做一段。", safety: "做什么都量力而行；觉得不舒服，就先停下来歇一歇。" }
      },
      homePlan: {
        bp: ["睡前 1–2 小时泡脚 10 分钟（41℃ 以下）", "慢呼吸 3 分钟：吸 4 秒、呼 6 秒，不憋气", "附近公园慢走 20–30 分钟"],
        sleep: ["睡前 1–2 小时泡脚 10 分钟", "调暗灯光，放下手机", "躺下前做 10 轮睡前慢呼吸：吸 4 秒、呼 6 秒"],
        cold: ["晚上泡脚 10 分钟，擦干马上穿袜子", "一杯温热的红枣茶", "太阳好的时候慢走 20 分钟"],
        gut: ["早饭一碗热粥", "饭后半小时慢走 15 分钟", "睡前顺时针轻揉肚子 3 分钟"],
        tense: ["跟着慢走节奏走 20 分钟", "慢呼吸 3 分钟", "每天留 10 分钟什么都不做"],
        quiet: ["找一个固定的安静时段", "泡一壶茶，慢慢喝", "慢呼吸 3 分钟，看看窗外"]
      },
      /* v4 quiz (plan v4 §3.1 draft; final wording pending Cindy + 小林遥). */
      quiz: {
        q1: { q: "最近身体有没有这些情况？", hint: "可以选几个", opts: { bp: "血压偏高", sleep: "睡不踏实", cold: "怕冷手脚凉", gut: "肠胃弱", lowEnergy: "容易没精神", stiff: "肩颈腰背发紧", heavy: "身子发沉、懒得动", eyes: "看屏幕久了眼睛发酸", fine: "都还好" } },
        q2: { q: "和身边的人比，你更怕冷还是更怕热？", hint: "选一个", opts: { cold: "更怕冷", hot: "更怕热", same: "差不多", unsure: "说不准" } },
        q3: { q: "平时更像哪一种？", hint: "选一个", opts: { dry: "常觉得口干、皮肤干", damp: "天潮的时候身上发沉", neither: "都不太像" } },
        q4: { q: "最近精神怎么样？", hint: "选一个", opts: { plenty: "挺足的", soso: "一般", low: "稍微动一动就想歇一歇" } },
        q5: { q: "你平常的日子是什么样？", hint: "可以选几个", opts: { late: "常熬夜", sitting: "坐着的时间多", screen: "每天看手机电脑很久", noexercise: "不太爱运动", meals: "三餐不太定时", iced: "爱喝冰的凉的", busy: "照顾家人，自己的时间少", regular: "作息挺规律" } },
        q6: { q: "心里最近是什么感觉？", hint: "可以选几个", opts: { tense: "心里绷得紧", quiet: "想安静一点", air: "有点闷，想透透气", fun: "想热闹开心一点", sun: "想晒晒太阳", green: "想被大自然包围", alone: "想一个人待着", calm: "挺平静" } },
        q7: { q: "你最想待在什么样的地方？", hint: "可以选几个", opts: { sea: "海边", mountain: "山里", hotspring: "温泉", forest: "森林", snow: "冰雪", view: "能看得很远的地方（云海、海面）", cozy: "暖暖的屋子里", any: "都可以" } },
        q8: { q: "这个季节，你能怎么安排？", hint: "选一个", opts: {}, marketOpts: { far: "能出远门住几天", near: "周末去近一点的地方", home: "先在家里做" } }
      },
      /* The one real relaxation "here" (plan v4 §5 draft). Only claim: relaxing right now. */
      placeActions: {
        wudang: { label: "在院子石阶上慢走 · 10 分钟", short: "石阶慢走", intro: "想着走在院子的石阶上，跟着「左 · 右」的节奏慢慢走，吸气走三步，呼气走三步。在屋里、走廊也可以。" },
        pattaya: { label: "想着海浪慢呼吸 · 吸 4 呼 6 · 3 分钟", short: "海边慢呼吸", intro: "看着傍晚的海湾，跟着圆圈：变大时用鼻子慢慢吸气 4 秒，变小时慢慢呼气 6 秒，像海浪一来一回。不憋气。" },
        onsen: { label: "泡脚计时 · 10 分钟（41℃ 以下）", short: "泡脚计时", intro: "像在温泉街的足汤边：水温 41℃ 以下（摸着温热、不烫），每次 10 分钟以内。先冲冲手脚，起身慢一点。" },
        seashrine: { label: "窗边看海 · 慢呼吸 3 分钟", short: "看海慢呼吸", intro: "看着窗外的海面，跟着圆圈：变大时用鼻子慢慢吸气 4 秒，变小时慢慢呼气 6 秒。不憋气。" },
        harbin: { label: "捧一杯热饮看雪 · 慢呼吸 3 分钟", short: "看雪慢呼吸", intro: "捧一杯热饮，看着窗外，跟着圆圈：变大时慢慢吸气 4 秒，变小时慢慢呼气 6 秒。不憋气。" }
      },
      placeActivities: {
        wudang: [
          { label: "在露台看日出，跟着做太极起势", short: "露台太极", intro: "像站在武当的露台上看云海日出：慢、柔、配合呼吸，先学起势。膝盖不舒服就少蹲一点。" },
          { label: "在窗边茶座做八段锦第一式", short: "茶座八段锦", intro: "像坐在民宿窗边的茶座：站着、坐着都可以，两手慢慢托起，肩颈不舒服就只抬到舒服的高度。" },
          { label: "坐在亭子里看云 · 3 分钟", short: "亭子看云", intro: "像坐在山崖边的亭子里：坐在椅子上做几个很小的动作，最后看看远处。" }
        ],
        pattaya: [
          { label: "傍晚沿着海边慢走", short: "海边慢走", intro: "像傍晚走在芭提雅的海湾边：跟着「左 · 右」的节奏慢慢走，吸气走三步，呼气走三步。" },
          { label: "坐在树荫下的池边 · 3 分钟", short: "池边坐坐", intro: "像坐在树荫下的长泳池边：坐着做几个很小的动作，听听水声。" }
        ],
        onsen: [
          { label: "在温泉街慢走，看热气", short: "温泉街慢走", intro: "像走在温泉街上看汤畑冒热气：跟着「左 · 右」的节奏慢慢走。在屋里、走廊也可以。" },
          { label: "泡完坐一会儿 · 3 分钟", short: "泡完坐坐", intro: "泡完起身要慢。坐下来做几个很小的动作，喝点温水。" }
        ],
        seashrine: [
          { label: "在神社前慢慢走走", short: "神社前慢走", intro: "像走在神社屋檐下：跟着「左 · 右」的节奏慢慢走。台阶多就走平路，不赶。" },
          { label: "坐在窗边看海 · 3 分钟", short: "窗边坐坐", intro: "像坐在落地窗前：坐着做几个很小的动作，看看海面。" }
        ],
        harbin: [
          { label: "在暖屋里坐着 · 3 分钟", short: "暖屋坐坐", intro: "像从雪地里回到暖和的屋子：坐着做几个很小的动作，慢慢喝点热的。" },
          { label: "看着灯和雪，睡前慢呼吸", short: "看灯慢呼吸", intro: "像晚上看着雪地里的灯：跟着圆圈，变大时慢慢吸气 4 秒，变小时慢慢呼气 6 秒，不憋气。" }
        ]
      },
      monthShort: ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"],
      /* Cindy's own "why Asia" line for the US version (plan v4 §2.2). "" until she writes it; empty renders nothing. */
      asiaLine: ""
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
