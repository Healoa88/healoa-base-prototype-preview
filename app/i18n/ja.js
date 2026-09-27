/* HeaLoa · locale: ja (日本語) — DRAFT, not shipped.
 * ⚠ NEEDS NATIVE REVIEW (ネイティブ校正が必要): this is a careful machine draft. A Japanese engineer will correct it.
 *   Please check especially:
 *   1. The six feeling options (same structure as the en draft) and the headline — natural and gentle for readers 50+?
 *   2. Politeness level: です・ます throughout; button labels short.
 *   3. Food names (長いも / ゆり根 / なつめ / 白きくらげ …) and seasonal terms (二十四節気).
 *   4. Hot-spring safety lines (温泉の入り方) — match what Japanese onsen guidance usually says.
 *   5. Banned words (tests/wording.mjs, ja list) — no medical claims; 癒し only for place / atmosphere / feeling.
 * Reachable ONLY with ?lang=ja (never remembered, never in the public switcher); shows a 「下書き」 badge.
 * meta.complete stays false until the review is done.
 * The six entries map to the same body states as zh:
 *   ぐっすり休みたい → sleep · ぬくもりがほしい → cold · おなかにやさしく → gut
 *   おだやかに落ち着きたい → bp · こわばりをほどきたい → tense · 静かに過ごしたい → quiet
 * cindyLine stays "" — Cindy's own words only; never written or translated for her.
 */
(function (root) {
  "use strict";
  var L = root.HEALOA_LOCALES = root.HEALOA_LOCALES || {};
  L.ja = {
    meta: {
      code: "ja", htmlLang: "ja", name: "日本語", complete: false, draft: true,
      condOrder: ["sleep", "cold", "gut", "bp", "tense", "quiet"],
      canvasFont: '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans CJK JP","Yu Gothic",Meiryo,sans-serif'
    },
    strings: {
      "meta.title": "HeaLoa · 季節とともに暮らす（プレビュー {version}）",
      "meta.description": "今日の気分をひとつ選ぶと、この季節に何を食べ、どう体を動かし、どこへ行くとよいかがわかります。",
      "brand.sub": "季節とともに暮らす",
      "disclaimer": "季節に合わせた暮らしの参考です。体調がすぐれないときは、専門家にご相談ください。",
      "punct.colon": "：",
      "punct.listSep": "、",
      "nav.back": "‹ 戻る",
      "season.switchAria": "季節を切り替える",
      "season.autumn": "秋",
      "season.winter": "冬",
      "cond.groupAria": "今日は、何があると心地いいですか？",
      "lang.switchAria": "言語",
      "social.follow": "フォローする",

      "home.headline": "今日は、何があると心地いいですか？",
      "home.subline": "ひとつ選ぶだけで、この季節に何を食べ、どう動き、どこへ行くとよいかをお伝えします。",
      "home.hint": "入力フォームなし · 登録なし · この端末の中だけに保存",
      "home.stepsAria": "3つのステップ",
      "home.step1": "今日の気分をひとつ選ぶ",
      "home.step2": "この季節の過ごし方を見る：気をつけること、食べもの、体の動かし方、行き先",
      "home.step3": "数分ゆっくりしてから、自分だけの季節のカードを残す",
      "home.quizLink": "どれを選べばいいか迷ったら？ 5つの質問に答える（スキップできます）",
      "home.seasonToday": "今日は{term}のころ · {season}",
      "home.seasonAhead": "{season}を先に見る",
      "home.returnHint": "前回、{season}のカードを保存しました · タップして開く",

      "shared.kicker": "HeaLoa が届きました",
      "shared.headline": "この季節、どう過ごし、どこへ行く？",
      "shared.subline": "HeaLoa は季節に合わせた暮らしのヒントをお届けします。今の気分をひとつ選ぶと、あなたの季節のヒント、短いリラックス、カードがすぐに手に入ります。",
      "shared.hint": "結果はあなたが選んだものだけで決まります · 登録不要",

      "quiz.title": "5つの質問",
      "quiz.intro": "ボタン選びのお手伝いだけです。いつでもスキップできます。ホームのボタンを直接押しても同じです。",
      "quiz.progress": "{total}問中 {n}問目",
      "quiz.yes": "はい",
      "quiz.no": "あまり",
      "quiz.skip": "スキップしてホームで選ぶ",
      "quiz.suggest": "まずはこちらから：",
      "quiz.note": "入口選びのための簡単な質問です。答えは保存されません。",
      "quiz.home": "ホームへ",

      "result.condsAria": "ほかの気分を選ぶ",
      "result.title": "{season} · {cond}",
      "result.seasonToday": "今は{term}のころ · {season}",
      "result.seasonAhead": "{season}を先に見る（{months}）",
      "result.lead": "この季節に合いそうな場所と暮らし方を、いくつかご紹介します。",
      "result.noteTitle": "この季節に気をつけたいこと",
      "result.placesTitle": "この季節に合いそうな場所",
      "result.placesSub": "{season}の過去の気候と、選んだ気分から並べています · すべて実際の写真つき",
      "result.rank": "{n}番目",
      "result.openPlace": "この場所を見る · 合う理由と過ごし方",
      "result.homeTitle": "遠くへ行けないときは、家でこんなふうに",
      "result.soakBtn": "足湯タイマー 10分",
      "result.skipTitle": "この季節は見送りたい場所",
      "result.moreTitle": "ほかの場所",
      "result.moreSub": "写真は準備中です。そろうまでは上位3つには入りません。",
      "result.photoPending": "写真準備中",
      "result.relaxCta": "まず数分ゆっくり · {label}",
      "result.eatTitle": "食べもの・飲みもの",
      "result.eatMore": "多めにとりたいもの：",
      "result.eatLess": "控えめにしたいもの：",
      "result.eatTip": "覚えておきたいこと：",
      "result.eatDrink": "飲みもの：",
      "result.eatNote": "お茶類は、妊娠中の方や体に長く続く不調がある方は、先に専門家に相談を。",
      "result.moveTitle": "体の動かし方",
      "result.moveFollow": "いっしょにやってみる（簡単な見本。立っても座ってもできます）：",
      "result.moveWalk": "ゆっくり歩くリズム",
      "result.moveBaduanjin": "八段錦 第一式",
      "result.moveTaiji": "太極拳 起勢",
      "result.moveBreath": "ゆっくり呼吸 3分",
      "result.caution": "気をつけること：",
      "result.cardCta": "季節のカードをつくる",
      "result.srcNote": "場所の気候：過去の平均値で、天気予報ではありません · Climate data: NASA POWER (CC BY 4.0) · 写真 {credit}",

      "place.cindyLine": "「{line}」—— Cindy",
      "place.skipLabel": "この季節は見送り：",
      "place.climateSkip": "{season}の気候",
      "place.climateFit": "{season}に合う理由",
      "place.eatTitle": "ここで食べたいもの",
      "place.todoTitle": "ここでの過ごし方",
      "place.hotspringCaution": "温泉：湯温41℃以下、1回10分以内。立ち上がるときはゆっくりと。",
      "place.homeTitle": "行けないときは、家でこんなふうに",
      "place.srcNote": "過去の気候の平均値で、天気予報ではありません · Climate data: NASA POWER (CC BY 4.0) · グリッド標高 約{elev}m（大まかな値。人の目で確認予定）",

      "practice.modesAria": "練習を選ぶ",
      "practice.footL": "左",
      "practice.footR": "右",
      "practice.ready": "準備ができたら「スタート」を押してください",
      "practice.readyGuided": "準備ができたら「スタート」を押して、文字に合わせてゆっくりどうぞ",
      "practice.start": "スタート",
      "practice.startAgain": "もう一度スタート",
      "practice.pause": "一時停止",
      "practice.resume": "再開",
      "practice.stop": "やめる",
      "practice.wakeNote": "練習中は画面がついたままになります",
      "practice.rounds": "{n}回",
      "practice.minutes": "{n}分",
      "practice.cadence": "1分間に{n}歩",
      "practice.beepOn": "リズム音：オン",
      "practice.beepOff": "リズム音：オフ",
      "practice.safeDefault": "息を止めてがまんしないでください。めまいや胸の苦しさを感じたら、すぐにやめましょう。",
      "practice.safeSoakTail": "上がったらよく拭いて、靴下をはきましょう。",
      "practice.safeWalk": "平らな道を、無理のないペースで。めまいや胸の苦しさを感じたら、すぐにやめましょう。",
      "practice.breathCue": "{phase} {n}",
      "practice.walkIn": "吸って · 3歩",
      "practice.walkOut": "吐いて · 3歩",
      "practice.soakLast": "あと1分。拭く準備をしましょう",
      "practice.soakOn": "お湯につかって、ゆっくり呼吸",
      "practice.guidedStep": "{total}ステップ中 {n} · {text}",
      "practice.paused": "一時停止中",
      "practice.done": "おつかれさまでした",
      "practice.doneTitle": "おつかれさまでした · {time}",
      "practice.doneSub": "今この場で少しほっとするための時間でした。どんな感じ方でも大丈夫です。",
      "practice.stopped": "やめました（{time}）。もう一度やるときは「スタート」を",
      "practice.keepCard": "季節のカードを残す",
      "practice.again": "もう一度",

      "card.title": "季節のカード",
      "card.privateNote": "このカードは、あなただけのもの。この端末の中に保存されます。",
      "card.showCond": "自分のカードに、選んだ気分を書く",
      "card.keep": "自分だけに残す",
      "card.savePng": "画像で保存",
      "card.seasonToday": "{season} · {term}のころ",
      "card.seasonAhead": "{season}（{months}）",
      "card.head": "{who} · この{season}の過ごし方",
      "card.whoAnon": "あなたに合わせて",
      "card.placeLabel": "合いそうな場所：",
      "card.itemEat": "食べる：{tip}{foods}を多めに。",
      "card.itemMove": "動く：{move}",
      "card.itemRelax": "ゆるめる：{label}。思い出したときに。",
      "card.foot": "{disclaimer} · HeaLoa",
      "card.kept": "この端末に保存しました。見られるのはあなただけです。次に HeaLoa を開くと、ホームでお知らせします。",
      "card.keepFailed": "この端末では保存できませんでした。「画像で保存」をお使いください。",
      "card.pngName": "healoa-season-card.png",

      "share.open": "誰かに送る（カードに体のことは書かれません）",
      "share.close": "閉じる",
      "share.lead": "この瞬間を分かち合いたい人に送りましょう。",
      "share.panelNote": "カードには季節と、このアプリが何をするものかだけを書きます。体のことや選んだ気分は書きません。リンクにはランダムな番号しか入りません。",
      "share.imgAlt": "共有画像のプレビュー",
      "share.qrAria": "QRコード",
      "share.linkLabel": "リンク",
      "share.send": "共有する",
      "share.copy": "リンクをコピー",
      "share.saveImg": "画像を保存",
      "share.saveStory": "縦長画像（9:16）を保存",
      "share.orPlatform": "送り先を選ぶ：",
      "share.title": "HeaLoa · 季節とともに暮らす",
      "share.text": "この{season}、どう過ごしてどこへ行く？ 今の気分をひとつ選ぶだけ。",
      "share.cardBrand": "HeaLoa · 季節とともに暮らす",
      "share.cardHead": "この{season}は、季節にあわせてゆっくりと",
      "share.cardSub": "今日の気分をひとつ選ぶと、食べもの、体の動かし方、行き先がわかります。",
      "share.scanCta": "読み取って、今の気分を選んでください",
      "share.openCta": "リンクを開いて、今の気分を選んでください",
      "share.sent": "共有画面を開きました。送るかどうか、誰に送るかはあなた次第です。",
      "share.copiedWithText": "この端末では直接共有できないため、リンクと短い紹介文をコピーしました。メッセージに貼りつけてください。",
      "share.copied": "リンクをコピーしました。",
      "share.copyFailed": "コピーできませんでした。上のリンクを長押ししてコピーしてください。",
      "share.pngName": "healoa-card.png",
      "share.storyName": "healoa-story.png",
      "share.storyGuide": "ストーリーズ向けの縦長画像です。長押しして写真に保存してください。",
      "share.linkCopiedToo": "リンクもコピーしたので、いっしょに貼りつけられます。",
      "share.t.wechat": "WeChat",
      "share.t.xiaohongshu": "小紅書",
      "share.t.weibo": "Weibo",
      "share.t.douyin": "抖音",
      "share.t.copy": "リンクをコピー",
      "share.t.sms": "メッセージ",
      "share.t.instagram": "Instagram ストーリーズ",
      "share.t.facebook": "Facebook",
      "share.t.whatsapp": "WhatsApp",
      "share.t.x": "X",
      "share.t.line": "LINE",
      "share.guide.wechat": "画像ができました。長押しで保存して、WeChat で送ってください。",
      "share.guide.xiaohongshu": "画像ができました。写真に保存して、小紅書で投稿してください。",
      "share.guide.weibo": "Weibo の共有ページを開きました。",
      "share.guide.douyin": "縦長画像ができました。写真に保存して、抖音で選んでください。",
      "share.guide.sms": "メッセージを開きました。送る相手を選んでください。",
      "share.guide.instagram": "縦長画像ができました。写真に保存して、Instagram のストーリーズで選んでください。",
      "share.guide.facebook": "Facebook の共有ページを新しいタブで開きました。",
      "share.guide.whatsapp": "WhatsApp を開きました。送る相手を選んでください。",
      "share.guide.x": "X の投稿画面を開きました。",
      "share.guide.line": "LINE の共有ページを開きました。送る相手を選んでください。",

      "line.open": "ひとこと残す",
      "line.edit": "ひとことを書き直す",
      "line.lead": "ひとこと残す。この瞬間を、あなたのものに。",
      "line.placeholder": "自分へのひとこと（60文字まで）",
      "line.note": "この端末の中だけに保存されます。カードを送るときは、このひとことも一緒に届くので、体のことは書かないでください。",
      "line.save": "カードに書く",
      "line.cancel": "今はやめておく",
      "line.clear": "このひとことを消す",
      "line.onCard": "「{line}」",
      "line.empty": "ひとこと書いてから「カードに書く」を押してください。",
      "line.saved": "カードに書きました。この端末の中だけにあります。カードを送ると、このひとことも一緒に届きます。",
      "line.savedPrivate": "カードに書きました。体のことに触れているので、自分のカードだけに残し、送るときには入れません。",
      "line.cleared": "ひとことを消しました。",
      "recv.lineLabel": "ひとこと添えられています：",
      "recv.write": "となりにひとこと書く",
      "recv.makeOwn": "自分のカードもつくる",
      "recv.placeholder": "となりに添えるひとこと（60文字まで）",
      "recv.writeNote": "書けるのは一度だけです。あなたの端末と、送り返すリンクの中だけに入り、サーバーは通りません。体のことは書かないでください。",
      "recv.save": "書けました",
      "recv.mineLabel": "あなたが添えたひとこと：",
      "recv.sendBack": "送り返す",
      "recv.sendBackNote": "このリンクを送り返すと、相手があなたのひとことを読めます。",
      "recv.sendText": "あなたのひとことの隣に、私もひとこと書きました。",
      "recv.alreadyWrote": "ここにはもう、ひとこと書いています。",
      "recv.private": "体のことに触れているようです。別の言葉で書いてみてください。",
      "recv.makeOwnHint": "下から今の気分を選ぶと、すぐにあなたのカードができます。",
      "reply.kicker": "あなたのひとことの隣に、ひとこと添えてくれました。",
      "reply.yours": "あなたのひとこと：",
      "reply.theirs": "添えられたひとこと：",
      "draft.badge": "下書き",

      "modal.aria": "画像",
      "modal.imgAlt": "カードの画像",
      "modal.longPress": "スマートフォンでは、画像を長押しすると写真に保存できます。",
      "modal.download": "画像をダウンロード",
      "modal.share": "この画像を共有",
      "modal.close": "閉じる",

      "about.summary": "このデモについて",
      "about.versionPrefix": "プレビュー版",
      "about.versionSuffix": "· 操作できる試作品で、正式なアプリではありません。",
      "about.how": "<b>場所の選び方：</b>季節、その土地の過去の気候、選んだ気分から、決まったルールで計算しています。お店からの広告料は一切なく、ランダムでもありません。実際の写真がない場所は上位3つに入りません。",
      "about.climate": "<b>気候の数字：</b>過去の平均値で、天気予報ではありません。Climate data: NASA POWER (CC BY 4.0)、2001〜2020年の月平均。グリッドの標高は大まかです（たとえば武当山のグリッドは約398mで、山の上はもっと高く寒い）。公開前に人の目で確認します。",
      "about.photos": "<b>写真：</b>Photo · Cindy Yang。各場所の署名つきのひとことは Cindy 本人が書きます。まだの場所は空欄のままです。",
      "about.privacy": "<b>プライバシー：</b>選んだ気分はこの端末（ブラウザの保存領域）の中だけにあり、送信されません。共有画像とリンクには体や気分の情報はなく、ランダムな番号だけです。自分で書いたひとことは、送ると決めたときだけリンクに入ります。このデモにはサーバーがありません。",
      "about.timer": "<b>タイマー：</b>練習は実際の時間で計っているので、一時停止・再開・停止も正確です。対応している端末では画面がついたままになります。",

      "rules.seasonAvg": "{season}の平均 {t}",
      "rules.skipRain": "{avg}、1日の降水量 {pr}mm。ちょうど雨季で、出歩きにくい時期です。",
      "rules.skipFrigid": "{avg}、いちばん寒い月は {min}。とても寒く、屋内と屋外の温度差が大きくなります。",
      "rules.skipBpHotspring": "屋外は{avg}なのに湯は熱く、寒暖差が大きめです。「おだやかに落ち着きたい」ときは、この季節は見送りましょう。",
      "rules.skipBpCold": "{avg}{dip}。寒めなので、「おだやかに落ち着きたい」ときは、暖かく寒暖差の小さい場所から。",
      "rules.dipTo": "、{month}は {min} まで下がります",
      "rules.skipBpDrop": "{avg}、{month}は {min} まで下がり、冷え込みが早い時期です。",
      "rules.skipColdHands": "{avg}、{month}は {min}。ぬくもりがほしいときは、この季節は見送りましょう。",
      "rules.skipGutCold": "{avg}。寒めなので、おなかにやさしく過ごすなら、もう少し暖かい場所を。",
      "rules.skipNightCold": "{avg}、{month}には {min} まで下がり、朝晩が冷え、夜はさらに冷えます。",
      "rules.skipHumid": "{avg}、湿度 {rh}%、1日の降水量 {pr}mm。蒸し暑く雨も多く、{tail}",
      "rules.humidTailSleep": "夜は寝苦しくなりがちです。",
      "rules.humidTailGut": "つい冷たいものに手が伸びがちです。",
      "rules.tempWarm": "暖かく、冷たい風の中を出入りせずにすみます",
      "rules.tempMild": "暑すぎず、寒すぎず",
      "rules.tempCool": "やや涼しいので、上着を一枚",
      "rules.tempChilly": "寒めなので、部屋は暖かく",
      "rules.tempCold": "屋外は寒いので、しっかり厚着を",
      "rules.reason1": "{season}（{months}）の平均 {t}、湿度 {rh}%：{word}。",
      "rules.reason2": "{m1} {t1} → {m3} {t3}{trend}。1日の降水量 {pr}mm{rain}",
      "rules.trendBig": "と季節の中で気温がはっきり下がるので、重ね着で調整を",
      "rules.trendStable": "と、季節を通して気温は安定",
      "rules.rainLow": "で雨が少なく、毎日の散歩に向いています。",
      "rules.rainHigh": "で雨が多め。傘を持って、屋内の過ごし方も考えておきましょう。",
      "rules.rainMid": "。",
      "rules.short": "{season}の平均 {t}、湿度 {rh}%{extra}。",
      "rules.shortHotspring": "、温泉あり（41℃以下・10分以内）",
      "rules.shortAltitude": "、標高約2000m。出発前に専門家に相談を"
    },
    content: {
      privateWords: ["血圧", "眠れ", "不眠", "胃腸", "冷え性", "手足が冷", "緊張", "体調"],
      conditions: { bp: "おだやかに落ち着きたい", sleep: "ぐっすり休みたい", cold: "ぬくもりがほしい", gut: "おなかにやさしく", tense: "こわばりをほどきたい", quiet: "静かに過ごしたい" },
      seasons: {
        autumn: { label: "秋", months: "9〜11月", monthNames: ["9月", "10月", "11月"] },
        winter: { label: "冬", months: "12〜2月", monthNames: ["12月", "1月", "2月"] }
      },
      solarTerms: ["小寒", "大寒", "立春", "雨水", "啓蟄", "春分", "清明", "穀雨", "立夏", "小満", "芒種", "夏至", "小暑", "大暑", "立秋", "処暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"],
      places: {
        wudang: {
          name: "武当山 · 山の宿でゆっくり滞在",
          area: "中国 湖北省 十堰",
          alt: "武当山の山あいにある中庭のある宿",
          benefit: "山あいの中庭。朝は谷から霧がゆっくりと立ちのぼり、あたりはとても静か。森の癒しの空気に包まれます。",
          cindyLine: "",
          food: ["あっさりした山菜と、温かいスープ", "テラスで温かいお茶をゆっくりと", "辛いもの・脂っこいものは控えめに"],
          todo: ["朝、中庭や石段を20分ほどゆっくり歩く", "太極拳や八段錦をいくつか（武当山は昔から太極拳とゆかりの深い場所）", "テラスで雲をながめ、お茶を飲み、ぼんやりする"],
          caution: ["数字は山のふもとの気候グリッド（約398m）のものです。山の上はもっと寒いので、上着を一枚多めに。", "石段が多いので、ゆっくりと。山頂を急いで目指す必要はありません。"],
          fit: {
            bp: "中庭やなだらかな道はゆっくり歩くのにぴったり。太極拳は動きがゆるやかで、息を止めません。",
            sleep: "山は日が暮れるのが早く、音も少なめ。空にあわせて早めに休めます。",
            cold: "日が出ているうちに中庭を歩くと体が温まります。朝晩は一枚重ねて。",
            gut: "三食あっさり温かいものを。食後は中庭を少し歩きましょう。",
            tense: "雲をながめ、山の風を聞き、少し歩くと、気持ちもゆっくりになります。",
            quiet: "人が少なく山は静か。何も予定を入れずに、数日静かに過ごすのに向いています。"
          }
        },
        pattaya: {
          name: "パタヤ · 海辺",
          area: "タイ チョンブリー",
          alt: "夕暮れのパタヤの湾",
          benefit: "海風は暖かく、夕方の湾はゆっくりとオレンジ色に。海辺を歩くと体がほどけていきます。",
          cindyLine: "",
          food: ["ココナッツ、澄んだスープ、焼き魚", "冷たい飲みものは控えめに。辛すぎるもの・生ものもほどほどに"],
          todo: ["早朝か夕方に海沿いをゆっくり歩く", "木陰で波の音を聞きながら、数分ゆっくり呼吸する"],
          caution: ["昼の日差しは強いので長く当たらないように。冷房も下げすぎないように。", "移動が長いので予定は詰めこまず、毎日昼休みの時間を。"],
          fit: {
            bp: "一年中暖かく寒暖差も小さいので、毎日安心して散歩に出られます。",
            sleep: "日中は海辺を歩いて朝日を浴び、夜は早めに部屋へ。",
            cold: "一年中暖かく、手足が冷えにくい場所です。",
            gut: "温かくあっさりしたものを。冷たい飲みものや生ものは控えめに。",
            tense: "波の音を聞き、夕日をながめると、少し気持ちがゆるみます。",
            quiet: "にぎやかな通りを避ければ、早朝の海辺がいちばん静かです。"
          }
        },
        onsen: {
          name: "日本の森の温泉 · 草津",
          area: "日本 群馬県",
          alt: "草津温泉・湯畑の湯けむりと木の樋",
          benefit: "湯畑から湯けむりがゆっくりと立ちのぼり、温泉街を歩くうちに体が少しずつ温まっていきます。",
          cindyLine: "",
          food: ["温かいそば、温かい汁もの", "入浴の前後に、白湯を一杯ずつ"],
          todo: ["温泉街をゆっくり歩き、湯畑の湯けむりをながめる", "温泉や足湯へ：41℃以下の湯を選び、1回10分以内に"],
          caution: ["入る前にかけ湯をし、立ち上がるときはゆっくりと。ひとりで入らないように。食後すぐや飲酒後は入らず、めまいがしたらすぐに上がりましょう。", "グリッド標高は約1036m。朝晩は冷えるので、一枚多めに。"],
          fit: {
            bp: "入ってもかまいませんが、湯温41℃以下・1回10分以内・ゆっくり立ち上がる、を守りましょう。",
            sleep: "寝る1〜2時間前に10分ほど入り、よく拭いて暖かくし、早めに休みましょう。",
            cold: "湯上がりは体がぽかぽか。拭いたらすぐ靴下と帽子を身につけてから外へ。",
            gut: "温かくあっさりしたものを。入浴の前後は食べすぎないように。",
            tense: "湯けむりと森の中をゆっくり歩くと、少し気持ちがゆるみます。",
            quiet: "早朝の温泉街は人が少なく、とても静かです。"
          }
        },
        harbin: {
          name: "ハルビン · 雪と氷",
          area: "中国 黒竜江省",
          alt: "雪が降ったあとのハルビンの村",
          benefit: "雪が降るとあたりはしんと静かで、部屋の中はぽかぽか。",
          cindyLine: "",
          food: ["熱々の水餃子や煮込み料理", "手を温める熱いミルクティーを一杯"],
          todo: ["昼間に雪景色を楽しむ。外にいるのは短めに", "部屋に戻ったら、温かい飲みものをゆっくりと"],
          caution: ["屋内と屋外の温度差がとても大きいので、出る前に戸口でひと呼吸。", "道が凍るので、ゆっくり歩き、滑りにくい靴を。"],
          fit: {
            bp: "寒暖差が大きく、この季節はおすすめしません。",
            sleep: "部屋は暖かく外は寒いので、寝る前は長く外にいないように。",
            cold: "寒すぎるため、この季節はおすすめしません。",
            gut: "温かいものを。冷たい風の中で食べないように。",
            tense: "雪景色はとても静か。体が丈夫なときに、短い時間だけ楽しみましょう。",
            quiet: "雪の夜はとても静か。体が丈夫なときだけ短めに滞在し、外出も短めに。"
          }
        },
        xishuangbanna: { name: "シーサンパンナ", area: "中国 雲南省", cindyLine: "" },
        tengchong: { name: "騰衝", area: "中国 雲南省", cindyLine: "" },
        kunming: { name: "昆明", area: "中国 雲南省", cindyLine: "" },
        phuket: { name: "プーケット", area: "タイ", cindyLine: "" }
      },
      care: {
        bp: {
          autumn: {
            note: [
              { tag: "休む", text: "秋は「おさめる」季節。夜は早めに休み、夜ふかしは控えましょう。" },
              { tag: "保温", text: "朝晩の寒暖差が大きいので、上着を一枚。頭と首元を冷やさないように。" },
              { tag: "起きる", text: "朝、目が覚めたら少し座ってから、ゆっくり立ち上がりましょう。" }
            ],
            eat: { more: "梨、ゆり根、長いも、青菜、豆腐", less: "漬けもの、干物や塩漬けの肉、味の濃い汁もの", tip: "塩分は1日小さじ1杯弱（約5g）までに。", drink: "白湯。薄めの菊花茶（おなかが冷えやすい方は控えめに）。" },
            move: ["毎日20〜30分ゆっくり歩きましょう。少し汗ばみ、話ができるくらいがちょうどいい。", "息を止める、逆さになる、急に力を入れる動きは避けましょう。"],
            safety: "体に続いている不調がある方は、遠出や温泉の前に専門家に相談を。めまいや胸の苦しさを感じたら、すぐにやめましょう。"
          },
          winter: {
            note: [
              { tag: "休む", text: "冬は「たくわえる」季節。早めに寝てゆっくり起き、日が出てから出かけましょう。" },
              { tag: "保温", text: "暖かい部屋から外へ出るときは、戸口でひと呼吸。帽子とマフラーを。" },
              { tag: "お風呂", text: "お風呂や足湯は熱すぎないように。41℃以下、10分以内に。" }
            ],
            eat: { more: "大根、長いも、きくらげ、かぼちゃ、塩分控えめの温かいスープ", less: "鍋のもと、塩漬けの肉、漬けもの", tip: "塩分は1日小さじ1杯弱（約5g）までに。", drink: "白湯。さんざしとなつめのお茶（胃酸が多い方は控えめに）。" },
            move: ["暖かい昼どきに20〜30分ゆっくり歩きましょう。", "風が強く冷える日は、家の中でゆっくり歩きましょう。"],
            safety: "温泉・足湯は、湯温41℃以下、1回10分以内。ゆっくり立ち上がり、ひとりで入らず、食後すぐや飲酒後は避けましょう。体に続いている不調がある方は、先に専門家に相談を。"
          }
        },
        sleep: {
          autumn: {
            note: [
              { tag: "リズム", text: "秋は早寝早起き。夜10時半までには布団に入りましょう。" },
              { tag: "寝る前", text: "寝る1〜2時間前に10分ほど足湯を。明かりを落とし、スマートフォンは手放して。" },
              { tag: "昼寝", text: "昼寝は30分以内に。" }
            ],
            eat: { more: "ゆり根、はすの実、あわ、白きくらげ、梨", less: "夜の濃いお茶やコーヒー、遅い夜食", tip: "夕食は腹七分目。寝る2時間前からは食べないように。", drink: "寝る前に、温かいあわのおかゆを少し、または温かい牛乳を一杯。" },
            move: ["夕方に20分ほどゆっくり散歩。寝る前2時間は激しい運動を避けましょう。"],
            safety: "寝つけない夜が長く続くときは、専門家に相談を。練習で息苦しく感じたら、「吸う4 吐く6」に切り替えましょう。"
          },
          winter: {
            note: [
              { tag: "リズム", text: "冬は早寝で、朝はゆっくり。日が出てから体を動かしましょう。" },
              { tag: "寝室", text: "寝室は暑すぎず乾燥しすぎないように。布団の中でまず足を温めて。" },
              { tag: "寝る前", text: "寝る1〜2時間前に10分ほど足湯を。よく拭いて靴下をはきましょう。" }
            ],
            eat: { more: "なつめ、あわ、くるみ、竜眼（少し）", less: "食べすぎの夕食、辛いもの", tip: "夕食は少し早めに、あっさりと。", drink: "寝る前に、カフェインのない温かい飲みものを一杯。" },
            move: ["昼間、日を浴びながら20分ほどゆっくり歩きましょう。"],
            safety: "寝つけない夜が長く続くときは、専門家に相談を。練習で息苦しく感じたら、「吸う4 吐く6」に切り替えましょう。"
          }
        },
        cold: {
          autumn: {
            note: [
              { tag: "保温", text: "秋の朝晩は冷えます。まずは足元、腰、首の後ろを温めて。" },
              { tag: "水分", text: "秋は乾燥するので、白湯をこまめに。冷たいものは控えめに。" },
              { tag: "寝る前", text: "夜に10分ほど足湯を。拭いたらすぐに靴下を。" }
            ],
            eat: { more: "長いも、かぼちゃ、なつめ、あわ、羊肉（適量）", less: "冷たい飲みもの、冷えた果物", tip: "三食とも温かいものを。", drink: "なつめと竜眼のお茶、またはしょうが湯（のどが乾くときは控えめに）。" },
            move: ["日が出てから20〜30分、体がほんのり温まるまでゆっくり歩きましょう。", "長く座ったら、手をこすり合わせ、足の裏をもみましょう。"],
            safety: "足湯は41℃以下、1回10分以内に。足の感覚が鈍い方は、手で湯温を確かめてから。"
          },
          winter: {
            note: [
              { tag: "リズム", text: "冬は早寝で、朝はゆっくり。日が出てから出かけましょう。" },
              { tag: "保温", text: "帽子、マフラー、厚手の靴下で、頭・首・足元を守りましょう。" },
              { tag: "寝る前", text: "10分ほど足湯をして、拭いたらすぐ靴下をはき、布団をかけて。" }
            ],
            eat: { more: "羊肉と大根のスープ、なつめ、しょうが、くるみ", less: "冷たいもの、生もの", tip: "朝ごはんは必ず温かいものを。", drink: "しょうがとなつめのお茶（のどが乾くときは控えめに）。" },
            move: ["暖かい昼どきに20分ほどゆっくり歩きましょう。", "家の中で5分ほど足踏みをして、体が温まってから外へ。"],
            safety: "足湯・温泉は41℃以下、1回10分以内に。足の感覚が鈍い方は、手で湯温を確かめてから。"
          }
        },
        gut: {
          autumn: {
            note: [
              { tag: "リズム", text: "三食は決まった時間に、腹七分目で。" },
              { tag: "保温", text: "朝晩は冷えるので、おなかを温かく。夜ははだしで過ごさないように。" },
              { tag: "食事", text: "ゆっくり食べましょう。食べながらスマートフォンを見るのは、少しお休みに。" }
            ],
            eat: { more: "長いも、あわのおかゆ、かぼちゃ、焼きりんご、大根", less: "冷たい飲みもの、生もの、揚げもの、辛すぎるもの", tip: "朝は温かいものを一杯。", drink: "温かいあわのおかゆ、白湯。" },
            move: ["食後30分たってから、15〜20分ゆっくり歩きましょう。", "寝る前に、おなかを時計回りに3分ほどやさしくなでましょう。"],
            safety: "おなかの不調が続くときや、いつもと様子が大きく違うときは、専門家に相談を。"
          },
          winter: {
            note: [
              { tag: "リズム", text: "朝は温かいものを食べて、空腹のまま出かけないように。" },
              { tag: "保温", text: "おなかと足元を温めて、冷えを入れないように。" },
              { tag: "食事", text: "鍋や焼き肉はたまにして、腹七分目に。" }
            ],
            eat: { more: "長いも、あわ、かぼちゃ、なつめ、温かい汁麺", less: "生もの、冷たいもの、脂っこすぎるもの", tip: "ゆっくり、よくかんで食べましょう。", drink: "白湯、なつめとあわのおかゆ。" },
            move: ["食後30分たってから、15〜20分ゆっくり歩きましょう。", "寝る前に、おなかを時計回りに3分ほどやさしくなでましょう。"],
            safety: "おなかの不調が続くときや、いつもと様子が大きく違うときは、専門家に相談を。"
          }
        },
        tense: {
          autumn: {
            note: [
              { tag: "余白", text: "1日10分、何もしない時間を。空や木をながめてみましょう。" },
              { tag: "リズム", text: "秋は早めに休み、寝る前はスマートフォンを少し遠くに。" },
              { tag: "外へ", text: "昼間に外へ出て、20分ほど日を浴びましょう。" }
            ],
            eat: { more: "ゆり根、あわ、バナナ、ナッツを少し", less: "濃いお茶、コーヒー、甘すぎるおやつ", tip: "食事は時間どおりに。おなかをすかせすぎず、食べすぎず。", drink: "薄めのジャスミン茶（午後3時以降は控えめに）。" },
            move: ["ゆっくり歩くリズムに合わせて、一歩ずつ数えながら20分歩きましょう。"],
            safety: "張りつめた気持ちがずっと続き、食事や睡眠にまで響くときは、専門家に相談を。"
          },
          winter: {
            note: [
              { tag: "日なた", text: "昼どきに外へ出て、20分ほど日を浴びましょう。" },
              { tag: "リズム", text: "冬は早寝で、朝はゆっくり。夜ふかしは控えめに。" },
              { tag: "余白", text: "1日10分、お茶をいれるような、ゆっくりした小さなことをひとつだけ。" }
            ],
            eat: { more: "あわ、なつめ、くるみ、温かいスープ", less: "濃いお茶、コーヒー、甘すぎるおやつ", tip: "食事は時間どおりに、温かいものを。", drink: "温かいなつめ茶。" },
            move: ["暖かい昼どきに、ゆっくり歩くリズムで20分歩きましょう。"],
            safety: "張りつめた気持ちがずっと続き、食事や睡眠にまで響くときは、専門家に相談を。"
          }
        },
        quiet: {
          autumn: {
            note: [
              { tag: "余白", text: "毎日決まった静かな時間をつくり、予定は少なめに。" },
              { tag: "リズム", text: "秋は早寝早起き。空の明るさにあわせて。" },
              { tag: "水分", text: "秋は乾燥するので、白湯をこまめに。" }
            ],
            eat: { more: "梨、ゆり根、長いも、あわ", less: "辛すぎるもの、塩辛いもの、遅い時間の会食", tip: "あっさり、温かく、時間どおりに。", drink: "薄めのお茶をひとつ、ゆっくりと。" },
            move: ["ひとりで20分ゆっくり歩きましょう。イヤホンは外して、足音だけを聞きながら。"],
            safety: "体調がすぐれないときは、専門家に相談を。"
          },
          winter: {
            note: [
              { tag: "余白", text: "冬は「こもる」季節。つきあいの外出は少なめに、家で静かに過ごしましょう。" },
              { tag: "リズム", text: "早寝で、朝はゆっくり。日が出てから出かけましょう。" },
              { tag: "保温", text: "部屋を少し暖かくして、熱いお茶をいれましょう。" }
            ],
            eat: { more: "長いも、大根、あわ、温かいスープ", less: "冷たいもの、辛すぎるもの", tip: "温かいものを、腹七分目で。", drink: "熱いお茶をひとつ、ゆっくりと。" },
            move: ["暖かい昼どきに、ひとりで20分ゆっくり歩きましょう。"],
            safety: "体調がすぐれないときは、専門家に相談を。"
          }
        }
      },
      practices: {
        breath46: {
          label: "ゆっくり呼吸 · 吸う4 吐く6",
          short: "ゆっくり呼吸",
          intro: "円に合わせて。大きくなるときに鼻からゆっくり吸い、小さくなるときにゆっくり吐きます。息は止めません。",
          phases: ["吸って", "吐いて"]
        },
        breath478: {
          label: "4-7-8呼吸 · 寝る前に",
          short: "4-7-8",
          intro: "4秒吸って、7秒止めて、8秒で吐く、を4回。止めるのがつらければ無理をせず、「吸う4 吐く6」に切り替えましょう。",
          phases: ["吸って", "止めて", "ゆっくり吐いて"]
        },
        walk: {
          label: "ゆっくり歩くリズム",
          short: "ゆっくり歩く",
          intro: "「左・右」のリズムに合わせてゆっくり歩きます。吸いながら3歩、吐きながら3歩。家の中、廊下、公園、どこでもどうぞ。"
        },
        soak: {
          label: "足湯・温泉タイマー",
          short: "足湯タイマー",
          intro: "湯温は41℃以下（さわって温かく、熱くない程度）、1回10分以内。先にかけ湯をし、立ち上がるときはゆっくりと。"
        },
        baduanjin1: {
          label: "八段錦 第一式 · 両手で天を支える",
          short: "八段錦 第一式",
          intro: "ひとつの型の見本です。立っても座ってもできます。肩や首がつらいときは、心地よい高さまで。",
          steps: [
            "足を肩幅に開いて立ちます（座ってもかまいません）。肩の力を抜いて。",
            "おなかの前で両手の指を組み、手のひらを上に向けて、ゆっくり吸います。",
            "胸の前で手のひらを返し、上へ押し上げます。目は手を追って、ゆっくり伸びましょう。",
            "上で2秒ほど。息は止めず、自然に呼吸します。",
            "ゆっくり吐きながら、両手を体の横からおろし、おなかの前に戻します。",
            "もう一度。吸いながら上げ、吐きながらおろします。",
            "3回目は、できるだけゆっくり。終わったら少し立ったまま休みましょう。"
          ]
        },
        taiji1: {
          label: "太極拳 · 起勢",
          short: "太極拳 起勢",
          intro: "ひとつの型の見本です。ゆっくり、やわらかく、呼吸に合わせて。ひざがつらいときは、あまり沈まずに。",
          steps: [
            "両足をそろえて立ち、全身の力を抜いて、まっすぐ前を見ます。",
            "左足を軽く横に開き、肩幅にします。",
            "吸いながら、両手をゆっくり前に上げ、肩の高さへ。",
            "吐きながら、ひざを少しゆるめ、両手をおなかの前までそっとおろします。",
            "もう一度。吸いながら上げ、吐きながらおろします。",
            "3回目は、できるだけゆっくり。終わったら少し立ったまま休みましょう。"
          ]
        }
      },
      homePlan: {
        bp: ["寝る1〜2時間前に10分ほど足湯（41℃以下）", "ゆっくり呼吸を3分：4秒吸って6秒吐く。息は止めない", "近くの公園を20〜30分ゆっくり散歩"],
        sleep: ["寝る1〜2時間前に10分ほど足湯", "明かりを落とし、スマートフォンを手放す", "横になる前に4-7-8呼吸を4回"],
        cold: ["夜に10分ほど足湯。拭いたらすぐ靴下を", "温かいなつめ茶を一杯", "日が出ているうちに20分ゆっくり散歩"],
        gut: ["朝は温かいおかゆを一杯", "食後30分たってから15分ゆっくり散歩", "寝る前におなかを時計回りに3分やさしくなでる"],
        tense: ["ゆっくり歩くリズムで20分歩く", "ゆっくり呼吸を3分", "1日10分、何もしない時間をつくる"],
        quiet: ["毎日決まった静かな時間をつくる", "お茶をいれて、ゆっくり飲む", "ゆっくり呼吸を3分。窓の外をながめながら"]
      },
      quiz: {
        cold: "手足がよく冷え、まわりの人より寒がりですか？",
        sleep: "夜なかなか寝つけない、または夜中に目が覚めやすいですか？",
        gut: "冷たいものや脂っこいものを食べると、おなかの調子がくずれやすいですか？",
        tense: "最近、気持ちが張りつめていて、なかなかゆるめられませんか？",
        bp: "健康チェックで、数値が目安より少し高めと言われることが多いですか？"
      }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
