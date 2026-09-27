/* HeaLoa · locale: en (US English) — DRAFT, not shipped.
 * Status: draft preview only. Reachable ONLY with ?lang=en (never remembered, never in the public switcher);
 * the page shows a small "Draft preview" badge. meta.complete stays false until Cindy proofreads every line
 * (she reviews English with her tool, Muse) and the en banned-word list in tests/wording.mjs is confirmed.
 * Voice: natural, warm US English for readers 50+; not a literal translation of zh.
 * Units: °F and inches (meta.tempUnit / meta.rainUnit), with °C beside water temperatures.
 * The six entries are feelings mapped to the same body states as zh:
 *   Deep rest → sleep (睡不踏实) · Warmth → cold (怕冷手脚凉) · Easy on the stomach → gut (肠胃弱)
 *   Steady and calm → bp (血压偏高) · Let go of tension → tense (心里绷得紧) · Quiet → quiet (想安静一点)
 * cindyLine stays "" — Cindy's own words only; never written or translated for her.
 */
(function (root) {
  "use strict";
  var L = root.HEALOA_LOCALES = root.HEALOA_LOCALES || {};
  L.en = {
    meta: {
      code: "en", htmlLang: "en", name: "English", complete: false, draft: true,
      tempUnit: "F", rainUnit: "in/month",
      condOrder: ["sleep", "cold", "gut", "bp", "tense", "quiet"],
      canvasFont: '-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif'
    },
    strings: {
      "meta.title": "HeaLoa · Live with the season (preview {version})",
      "meta.description": "Tap what would feel good today and see what to eat, how to move, and where to go this season.",
      "brand.sub": "Live with the season",
      "disclaimer": "This is a seasonal lifestyle guide. If you feel unwell, please check with a health professional.",
      "punct.colon": ": ",
      "punct.listSep": ", ",
      "nav.back": "‹ Back",
      "season.switchAria": "Switch season",
      "season.autumn": "Fall",
      "season.winter": "Winter",
      "cond.groupAria": "What would feel good today?",
      "lang.switchAria": "Language",
      "social.follow": "Follow us",

      "home.headline": "What would feel good today?",
      "home.subline": "Tap one. We'll show you what to eat, how to move, and where to go this season.",
      "home.hint": "No forms · No sign-up · Stays on your phone",
      "home.stepsAria": "Three steps",
      "home.step1": "Tap what would feel good today",
      "home.step2": "See this season's tips: what to watch, what to eat, how to move, where to go",
      "home.step3": "Take a few calm minutes, then keep a season card just for you",
      "home.quizLink": "Not sure which one? Answer 5 quick questions (optional)",
      "home.seasonToday": "Today · around the {term} · {season}",
      "home.seasonAhead": "Looking ahead to {season}",
      "home.returnHint": "You saved a {season} card last time · Tap to open it",

      "shared.kicker": "Someone shared HeaLoa with you",
      "shared.headline": "How to live well this season, and where to go",
      "shared.subline": "HeaLoa gives you gentle, seasonal ideas. Tap what would feel good for you and get your own tips, a short calming exercise, and a season card.",
      "shared.hint": "Your results are based only on what you tap · No sign-up",

      "quiz.title": "5 quick questions",
      "quiz.intro": "Just to help you pick a button. Skip any time — tapping a button on the home screen works too.",
      "quiz.progress": "Question {n} of {total}",
      "quiz.yes": "Yes",
      "quiz.no": "Not really",
      "quiz.skip": "Skip and pick on the home screen",
      "quiz.suggest": "You might start with:",
      "quiz.note": "These questions only help you pick a starting point. Your answers aren't saved.",
      "quiz.home": "Back to home",

      "result.condsAria": "Pick another",
      "result.title": "{season} · {cond}",
      "result.seasonToday": "Now · around the {term} · {season}",
      "result.seasonAhead": "Looking ahead to {season} ({months})",
      "result.lead": "Here are a few places and ways to live that may fit this season.",
      "result.noteTitle": "Keep in mind this season",
      "result.placesTitle": "Places that may fit this season",
      "result.placesSub": "Ranked by past {season} weather and what you picked · every place has a real photo",
      "result.rank": "No. {n}",
      "result.openPlace": "See this place · why it fits, what to do",
      "result.homeTitle": "Can't travel? Try this at home",
      "result.soakBtn": "10-minute foot soak timer",
      "result.skipTitle": "Better another season",
      "result.moreTitle": "More places",
      "result.moreSub": "Photos are on the way. Until then, these stay out of the top three.",
      "result.photoPending": "Photo coming",
      "result.relaxCta": "Take a few calm minutes · {label}",
      "result.eatTitle": "Food and drink",
      "result.eatMore": "Enjoy more: ",
      "result.eatLess": "Go easy on: ",
      "result.eatTip": "One thing to remember: ",
      "result.eatDrink": "To drink: ",
      "result.eatNote": "Herbal teas: if you're pregnant or have an ongoing health condition, ask a health professional first.",
      "result.moveTitle": "Moving your body",
      "result.moveFollow": "Follow along (simple samples, standing or seated):",
      "result.moveWalk": "Slow-walk rhythm",
      "result.moveBaduanjin": "Baduanjin, first move",
      "result.moveTaiji": "Tai chi opening",
      "result.moveBreath": "3 minutes of slow breathing",
      "result.caution": "Please note: ",
      "result.cardCta": "Make my season card",
      "result.srcNote": "Place weather: past averages, not a forecast · Climate data: NASA POWER (CC BY 4.0) · Photos {credit}",

      "place.cindyLine": "“{line}” — Cindy",
      "place.skipLabel": "Better another season: ",
      "place.climateSkip": "{season} weather here",
      "place.climateFit": "Why it suits {season}",
      "place.eatTitle": "What to eat here",
      "place.todoTitle": "What to do here",
      "place.hotspringCaution": "Hot springs: 105°F (41°C) or cooler, 10 minutes at a time, and stand up slowly.",
      "place.homeTitle": "Can't go? Try this at home",
      "place.srcNote": "Past weather averages, not a forecast · Climate data: NASA POWER (CC BY 4.0) · Grid elevation about {elev} m (rough; to be checked by hand)",

      "practice.modesAria": "Choose an exercise",
      "practice.footL": "L",
      "practice.footR": "R",
      "practice.ready": "Tap Start when you're ready",
      "practice.readyGuided": "Tap Start when you're ready, then follow the words slowly",
      "practice.start": "Start",
      "practice.startAgain": "Start again",
      "practice.pause": "Pause",
      "practice.resume": "Resume",
      "practice.stop": "Stop",
      "practice.wakeNote": "Your screen stays on during the exercise",
      "practice.rounds": "{n} rounds",
      "practice.minutes": "{n} min",
      "practice.cadence": "{n} steps/min",
      "practice.beepOn": "Beat sound: on",
      "practice.beepOff": "Beat sound: off",
      "practice.safeDefault": "Never force or hold your breath. If you feel dizzy or tight in the chest, stop right away.",
      "practice.safeSoakTail": "Dry off well and put on socks.",
      "practice.safeWalk": "Walk on flat ground at your own pace. If you feel dizzy or tight in the chest, stop right away.",
      "practice.breathCue": "{phase} {n}",
      "practice.walkIn": "Breathe in · three steps",
      "practice.walkOut": "Breathe out · three steps",
      "practice.soakLast": "One minute left — get your towel ready",
      "practice.soakOn": "Soak and breathe slowly",
      "practice.guidedStep": "Step {n} of {total} · {text}",
      "practice.paused": "Paused",
      "practice.done": "All done",
      "practice.doneTitle": "All done · {time}",
      "practice.doneSub": "This was just to help you settle for a moment. However you feel is fine.",
      "practice.stopped": "Stopped (you did {time}). Tap Start whenever you'd like to go again",
      "practice.keepCard": "Keep my season card",
      "practice.again": "Once more",

      "card.title": "Your season card",
      "card.privateNote": "This card is just for you. It stays on this phone.",
      "card.showCond": "Show what I picked on my own card",
      "card.keep": "Keep it just for me",
      "card.savePng": "Save as image",
      "card.seasonToday": "{season} · around the {term}",
      "card.seasonAhead": "{season} ({months})",
      "card.head": "{who} · your {season} plan",
      "card.whoAnon": "Made for you",
      "card.placeLabel": "A place that fits: ",
      "card.itemEat": "Eat: {tip} Enjoy more {foods}.",
      "card.itemMove": "Move: {move}",
      "card.itemRelax": "Settle: {label} — any time you think of it.",
      "card.foot": "{disclaimer} · HeaLoa",
      "card.kept": "Saved on this phone — only you can see it. Next time you open HeaLoa, it'll be waiting on the home screen.",
      "card.keepFailed": "This phone won't let us save here. Try “Save as image” instead.",
      "card.pngName": "healoa-season-card.png",

      "share.open": "Send it to someone (nothing about your body is on the card)",
      "share.close": "Hide sharing",
      "share.lead": "Send it to someone you'd like to share this moment with.",
      "share.panelNote": "The card only shows the season and what this app does — nothing about your body or what you picked. The link carries just a random code.",
      "share.imgAlt": "Share image preview",
      "share.qrAria": "QR code",
      "share.linkLabel": "Link",
      "share.send": "Share…",
      "share.copy": "Copy link",
      "share.saveImg": "Save image",
      "share.saveStory": "Save story image (9:16)",
      "share.orPlatform": "Or pick where to send it:",
      "share.title": "HeaLoa · Live with the season",
      "share.text": "A gentle guide for {season}: where to go and how to live. Tap what feels right for you.",
      "share.cardBrand": "HeaLoa · Live with the season",
      "share.cardHead": "This {season}, slow down with the season",
      "share.cardSub": "Tap what would feel good today and see what to eat, how to move, and where to go.",
      "share.scanCta": "Scan, then tap what feels right for you",
      "share.openCta": "Open the link and tap what feels right for you",
      "share.sent": "Your share sheet is open. Whether to send, and to whom, is up to you.",
      "share.copiedWithText": "This device can't share directly, so we copied the link and a short note. Just paste it in a message.",
      "share.copied": "Link copied.",
      "share.copyFailed": "Couldn't copy. Press and hold the link above to copy it.",
      "share.pngName": "healoa-card.png",
      "share.storyName": "healoa-story.png",
      "share.storyGuide": "A tall 9:16 image for Stories: press and hold to save it to your photos.",
      "share.linkCopiedToo": "The link is copied too, so you can paste it alongside.",
      "share.t.wechat": "WeChat",
      "share.t.xiaohongshu": "Xiaohongshu",
      "share.t.weibo": "Weibo",
      "share.t.douyin": "Douyin",
      "share.t.copy": "Copy link",
      "share.t.sms": "Text / iMessage",
      "share.t.instagram": "Instagram Story",
      "share.t.facebook": "Facebook",
      "share.t.whatsapp": "WhatsApp",
      "share.t.x": "X",
      "share.t.line": "LINE",
      "share.guide.wechat": "Your image is ready: press and hold to save it, then send it in WeChat.",
      "share.guide.xiaohongshu": "Your image is ready: save it to your photos, then post it in Xiaohongshu.",
      "share.guide.weibo": "Weibo's share page is open.",
      "share.guide.douyin": "Your tall image is ready: save it, then pick it from your photos in Douyin.",
      "share.guide.sms": "Messages is open — pick who to send it to.",
      "share.guide.instagram": "Your 9:16 story image is ready. Save it to your photos, open Instagram, tap + and choose Story, then pick this image. You can add the link with a Link sticker.",
      "share.guide.facebook": "Facebook's share page is open in a new tab.",
      "share.guide.whatsapp": "WhatsApp is open — pick who to send it to.",
      "share.guide.x": "X is open with your post ready to go.",
      "share.guide.line": "LINE's share page is open.",

      "line.open": "Leave a line",
      "line.edit": "Change my line",
      "line.lead": "Leave a line. Make this moment yours.",
      "line.placeholder": "A few words for yourself (up to 60 characters)",
      "line.note": "It stays on this phone. If you send your card, this line goes with it — so leave out anything about your health.",
      "line.save": "Put it on my card",
      "line.cancel": "Not now",
      "line.clear": "Remove this line",
      "line.onCard": "“{line}”",
      "line.empty": "Write a few words first, then tap “Put it on my card.”",
      "line.saved": "Done. It's on your card and stays on this phone. If you send the card, the line goes with it.",
      "line.savedPrivate": "Done. It's on your own card only — it mentions your health, so it won't be sent with the card.",
      "line.cleared": "Your line is removed.",
      "recv.lineLabel": "They left a line:",
      "recv.write": "Add a line beside theirs",
      "recv.makeOwn": "Make one for yourself",
      "recv.placeholder": "A few words to sit beside theirs (up to 60 characters)",
      "recv.writeNote": "You can do this once. It lives only on your phone and in the link you send back — no server. Please leave out anything about your health.",
      "recv.save": "Done",
      "recv.mineLabel": "You added:",
      "recv.sendBack": "Send it back",
      "recv.sendBackNote": "Send this link back. When they open it, they'll see your line beside theirs.",
      "recv.sendText": "I added a line beside yours.",
      "recv.alreadyWrote": "You've already added a line here.",
      "recv.private": "That line mentions health details. Try different words.",
      "recv.makeOwnHint": "Tap what would feel good for you below, and your own card is ready in a moment.",
      "reply.kicker": "They added something beside yours.",
      "reply.yours": "Your line:",
      "reply.theirs": "Their line:",
      "draft.badge": "Draft preview",

      "modal.aria": "Image",
      "modal.imgAlt": "Card image",
      "modal.longPress": "On a phone, press and hold the image to save it to your photos.",
      "modal.download": "Download image",
      "modal.share": "Share this image",
      "modal.close": "Close",

      "about.summary": "About this demo",
      "about.versionPrefix": "Preview",
      "about.versionSuffix": "· a clickable prototype, not the finished app.",
      "about.how": "<b>How places are picked:</b> by season, each place's past weather, and what you tapped, using fixed rules. No business pays to be listed, and nothing is random. Places without a real photo stay out of the top three.",
      "about.climate": "<b>Weather numbers:</b> past averages, not a forecast. Climate data: NASA POWER (CC BY 4.0), monthly averages 2001–2020. The grid elevation is rough (the Wudang grid sits at about 398 m; up on the mountain it's higher and colder) and will be checked by hand before launch.",
      "about.photos": "<b>Photos:</b> Photo · Cindy Yang. The signed line under each place will come from Cindy herself; where she hasn't written one yet, it stays empty.",
      "about.privacy": "<b>Privacy:</b> what you tap stays on this phone (browser storage) and is never uploaded. Shared images and links carry nothing about your body or feelings — just a random code. A line you write goes into the link only when you choose to send it. This demo has no server.",
      "about.timer": "<b>Timer:</b> exercises run on real clock time, so pause, resume, and stop are accurate. Where supported, your screen stays on.",

      "rules.seasonAvg": "{season} average {t}",
      "rules.skipRain": "{avg}, about {pr} inches of rain a month — it's the rainy season, so getting out is hard.",
      "rules.skipFrigid": "{avg}, with the coldest month at {min}. Very cold, and a big jump every time you step in or out.",
      "rules.skipBpHotspring": "Outdoors: {avg}, while the springs run hot — a sharp hot-and-cold swing. For “Steady and calm,” skip it this season.",
      "rules.skipBpCold": "{avg}{dip} — on the cold side. For “Steady and calm,” start somewhere warm with gentle swings.",
      "rules.dipTo": ", dropping to {min} in {month}",
      "rules.skipBpDrop": "{avg}, dropping to {min} in {month} — it cools off quickly.",
      "rules.skipColdHands": "{avg}, {min} in {month}. If warmth is what you're after, skip it this season.",
      "rules.skipGutCold": "{avg} — on the cold side. For an easy stomach, pick somewhere a little warmer.",
      "rules.skipNightCold": "{avg}; by {month} it's down to {min}. Chilly mornings and colder nights.",
      "rules.skipHumid": "{avg}, {rh}% humidity, about {pr} inches of rain a month — hot, sticky, and rainy; {tail}",
      "rules.humidTailSleep": "nights feel stuffy.",
      "rules.humidTailGut": "it's tempting to live on iced drinks.",
      "rules.tempWarm": "warm, no stepping in and out of cold wind",
      "rules.tempMild": "not too hot, not too cold",
      "rules.tempCool": "cool, so bring a jacket",
      "rules.tempChilly": "chilly, so you'll want a warm room",
      "rules.tempCold": "cold outside, so bundle up",
      "rules.reason1": "{season} ({months}) averages {t} with {rh}% humidity: {word}.",
      "rules.reason2": "{m1} {t1} → {m3} {t3}{trend}; about {pr} inches of rain a month{rain}",
      "rules.trendBig": ", cooling noticeably through the season, so add layers as you go",
      "rules.trendStable": ", steady through the season",
      "rules.rainLow": ". Dry enough for a walk every day.",
      "rules.rainHigh": ". Rainy, so bring an umbrella and plan some indoor time.",
      "rules.rainMid": ".",
      "rules.short": "{season} average {t}, {rh}% humidity{extra}.",
      "rules.shortHotspring": ", hot springs (105°F / 41°C or cooler, 10 minutes at a time)",
      "rules.shortAltitude": ", about 6,600 ft up — check with a health professional before you go"
    },
    content: {
      privateWords: ["sleep", "stomach", "tension", "tense", "cold hands", "cold feet", "pressure", "my health", "insomn", "anxi", "diabet", "blood", "illness", "diseas", "pain", "ache", "medication"],
      conditions: { bp: "Steady and calm", sleep: "Deep rest", cold: "Warmth", gut: "Easy on the stomach", tense: "Let go of tension", quiet: "Quiet" },
      seasons: {
        autumn: { label: "Fall", months: "Sep–Nov", monthNames: ["Sep", "Oct", "Nov"] },
        winter: { label: "Winter", months: "Dec–Feb", monthNames: ["Dec", "Jan", "Feb"] }
      },
      solarTerms: ["Minor Cold", "Major Cold", "Start of Spring", "Rain Water", "Awakening of Insects", "Spring Equinox", "Clear and Bright", "Grain Rain", "Start of Summer", "Grain Buds", "Grain in Ear", "Summer Solstice", "Minor Heat", "Major Heat", "Start of Autumn", "End of Heat", "White Dew", "Autumn Equinox", "Cold Dew", "Frost's Descent", "Start of Winter", "Minor Snow", "Major Snow", "Winter Solstice"],
      places: {
        wudang: {
          name: "Wudang Mountains · Mountain Stay",
          area: "Shiyan, Hubei, China",
          alt: "A courtyard guesthouse in the Wudang Mountains",
          benefit: "A courtyard tucked into the hills. In the morning, mist drifts up from the valley and everything goes quiet — a restorative, wooded calm.",
          cindyLine: "",
          food: ["Simple mountain greens and hot soups", "A pot of hot tea, sipped slowly on the terrace", "Go easy on spicy and greasy food"],
          todo: ["Walk slowly around the courtyard and stone steps for 20 minutes in the morning", "Try a few tai chi or Baduanjin moves (Wudang has long been linked with tai chi)", "Watch the clouds from the terrace with a cup of tea"],
          caution: ["The numbers come from a weather grid below the mountain (about 398 m). It's colder up top, so pack an extra layer.", "Lots of stone steps: take them slowly. No need to race to the summit."],
          fit: {
            bp: "The courtyard and gentle paths are made for slow walks, and a few slow tai chi moves never ask you to strain.",
            sleep: "Night falls early in the mountains and it's very quiet — easy to go to bed with the sky.",
            cold: "Walk the courtyard when the sun is out and you'll warm up; add a layer morning and evening.",
            gut: "Simple, warm meals, and a slow stroll around the courtyard after eating.",
            tense: "Watch the clouds, listen to the mountain wind, take a few steps — your mind slows down a little.",
            quiet: "Few people, still hills. A good place to plan nothing and simply stay a few days."
          }
        },
        pattaya: {
          name: "Pattaya · By the Sea",
          area: "Chonburi, Thailand",
          alt: "Pattaya bay at dusk",
          benefit: "The sea breeze is warm, the bay turns orange at dusk, and walking by the water, your body loosens up.",
          cindyLine: "",
          food: ["Fresh coconut, clear soups, grilled fish", "Fewer iced drinks; go easy on very spicy or raw food"],
          todo: ["Walk slowly along the shore in the early morning or at dusk", "Sit in the shade, listen to the waves, and breathe slowly for a few minutes"],
          caution: ["The midday sun is strong — don't stay out in it long, and don't set the AC too cold.", "It's a long trip, so keep the schedule light and leave time for a rest after lunch."],
          fit: {
            bp: "Warm all year with small temperature swings, so you can head out for a slow walk every day.",
            sleep: "Walk by the sea and catch the morning sun, then head in early in the evening.",
            cold: "Warm all year, so hands and feet stay cozy.",
            gut: "Choose warm, simple food and skip the iced drinks and raw dishes.",
            tense: "Listen to the waves and watch the sunset — you'll loosen up a little.",
            quiet: "Skip the busy streets; the shore is quietest early in the morning."
          }
        },
        onsen: {
          name: "Kusatsu · Forest Hot Spring Town",
          area: "Gunma, Japan",
          alt: "Steam rising from the Kusatsu hot spring field and its wooden channels",
          benefit: "Steam rises slowly from the hot spring field, and as you stroll the onsen streets, you warm up bit by bit.",
          cindyLine: "",
          food: ["Hot soba and warm soups", "A glass of warm water before and after a soak"],
          todo: ["Stroll the onsen streets and watch the steam over the spring field", "Soak your body or just your feet: choose pools 105°F (41°C) or cooler, 10 minutes at a time"],
          caution: ["Rinse your hands and feet first, stand up slowly, and don't soak alone. Skip it right after a meal or a drink, and get out if you feel dizzy.", "The grid elevation is about 1,036 m, so mornings and evenings are cool — bring an extra layer."],
          fit: {
            bp: "You can soak, but keep to this: 105°F (41°C) or cooler, 10 minutes at a time, and stand up slowly.",
            sleep: "Soak for 10 minutes one to two hours before bed, dry off, bundle up, and turn in early.",
            cold: "You'll be warm after a soak — dry off and put on socks and a hat before you head out.",
            gut: "Eat warm, simple food, and don't soak on a full stomach.",
            tense: "Walk slowly through the steam and the trees; you'll loosen up a little.",
            quiet: "The onsen streets are nearly empty early in the morning."
          }
        },
        harbin: {
          name: "Harbin · Snow Country",
          area: "Heilongjiang, China",
          alt: "A village in Harbin after snowfall",
          benefit: "When the snow falls, everything goes quiet, and indoors it's warm and snug.",
          cindyLine: "",
          food: ["Hot dumplings and slow-cooked stews", "A cup of hot milk tea to warm your hands"],
          todo: ["Enjoy the snow by day, but don't stay outside too long at a time", "Come back in and sip something hot, slowly"],
          caution: ["The jump between indoors and out is huge — pause at the door before stepping out.", "Roads get icy: walk slowly and wear shoes with good grip."],
          fit: {
            bp: "Big swings between warm rooms and freezing air — not a good fit this season.",
            sleep: "Warm inside, freezing outside. Don't stay out late before bed.",
            cold: "Too cold — not a good fit this season.",
            gut: "Eat warm food, and don't eat out in the cold wind.",
            tense: "The snow is very quiet. Enjoy it in short spells, and go only if you're feeling sturdy.",
            quiet: "Snowy nights are very quiet. Stay only a short while if you're feeling sturdy, and keep trips outside short."
          }
        },
        xishuangbanna: { name: "Xishuangbanna", area: "Yunnan, China", cindyLine: "" },
        tengchong: { name: "Tengchong", area: "Yunnan, China", cindyLine: "" },
        kunming: { name: "Kunming", area: "Yunnan, China", cindyLine: "" },
        phuket: { name: "Phuket", area: "Thailand", cindyLine: "" }
      },
      care: {
        bp: {
          autumn: {
            note: [
              { tag: "Rest", text: "Fall is a time to draw in: get to bed a little earlier and skip the late nights." },
              { tag: "Warmth", text: "Mornings and evenings swing cool, so bring a jacket and keep your head and neck warm." },
              { tag: "Rising", text: "When you wake up, sit for a moment before you slowly stand." }
            ],
            eat: { more: "pears, lily bulb, Chinese yam, leafy greens, tofu", less: "pickles, cured meats, very salty soups", tip: "Keep salt to less than a teaspoon a day (about 5 g).", drink: "warm water; light chrysanthemum tea (go easy if cold drinks upset your stomach)." },
            move: ["Walk slowly for 20–30 minutes a day, just enough to feel warm while you can still chat.", "Skip moves that make you hold your breath, hang upside down, or strain suddenly."],
            safety: "If you're managing a health condition, check with a health professional before a long trip or a hot spring. If you feel dizzy or tight in the chest, stop right away."
          },
          winter: {
            note: [
              { tag: "Rest", text: "Winter is a time to rest and store up: early to bed, a bit later to rise, and head out once the sun is up." },
              { tag: "Warmth", text: "Going from a warm room to the cold, pause at the door and put on a hat and scarf." },
              { tag: "Bathing", text: "Keep bath and foot-soak water from getting too hot: 105°F (41°C) or cooler, 10 minutes or less." }
            ],
            eat: { more: "daikon, Chinese yam, wood ear mushrooms, pumpkin, lightly salted hot soups", less: "hot-pot broth bases, cured meats, pickles", tip: "Keep salt to less than a teaspoon a day (about 5 g).", drink: "warm water; hawthorn and red date tea (go easy if you get heartburn)." },
            move: ["Walk slowly for 20–30 minutes around midday, when it's warmest.", "On windy, cold days, walk slowly indoors instead."],
            safety: "Hot springs and foot soaks: 105°F (41°C) or cooler, 10 minutes at a time, stand up slowly, don't soak alone, and skip it after a meal or a drink. If you're managing a health condition, check with a health professional first."
          }
        },
        sleep: {
          autumn: {
            note: [
              { tag: "Rhythm", text: "Early to bed, early to rise this fall — aim to be in bed by 10:30." },
              { tag: "Wind-down", text: "One to two hours before bed, soak your feet for 10 minutes, dim the lights, and set the phone aside." },
              { tag: "Naps", text: "Keep afternoon naps under 30 minutes." }
            ],
            eat: { more: "lily bulb, lotus seeds, millet, snow fungus, pears", less: "strong tea or coffee in the evening, late-night snacks", tip: "Stop at about 70% full at dinner, and don't eat in the two hours before bed.", drink: "a small bowl of warm millet porridge or a cup of warm milk before bed." },
            move: ["Take a 20-minute slow walk in the early evening; nothing strenuous in the two hours before bed."],
            safety: "If restless nights keep going, talk with a health professional. If the breathing exercise feels stuffy, switch to in 4, out 6."
          },
          winter: {
            note: [
              { tag: "Rhythm", text: "Early to bed and a little later to rise this winter; get moving once the sun is up." },
              { tag: "Bedroom", text: "Keep the bedroom from getting too hot or too dry, and warm your feet under the covers first." },
              { tag: "Wind-down", text: "One to two hours before bed, soak your feet for 10 minutes, then dry off and put on socks." }
            ],
            eat: { more: "red dates, millet, walnuts, longan (a little)", less: "a heavy dinner, spicy food", tip: "Have dinner a bit earlier and keep it light.", drink: "a warm, caffeine-free drink before bed." },
            move: ["Walk slowly in the sunshine for 20 minutes during the day."],
            safety: "If restless nights keep going, talk with a health professional. If the breathing exercise feels stuffy, switch to in 4, out 6."
          }
        },
        cold: {
          autumn: {
            note: [
              { tag: "Warmth", text: "Fall mornings and evenings are cool — keep your feet, lower back, and the back of your neck warm first." },
              { tag: "Water", text: "Fall air is dry, so sip warm water often and skip the ice." },
              { tag: "Wind-down", text: "Soak your feet for 10 minutes in the evening, then dry off and put on socks right away." }
            ],
            eat: { more: "Chinese yam, pumpkin, red dates, millet, lamb (in moderation)", less: "iced drinks, cold raw fruit", tip: "Have something warm at every meal.", drink: "red date and longan tea, or ginger with brown sugar (go easy if your throat feels dry)." },
            move: ["Once the sun is up, walk slowly for 20–30 minutes until you feel a gentle warmth.", "After sitting a while, rub your hands together and massage the soles of your feet."],
            safety: "Foot-soak water: 105°F (41°C) or cooler, 10 minutes at a time. If your feet don't feel temperature well, test the water with your hand."
          },
          winter: {
            note: [
              { tag: "Rhythm", text: "Early to bed and a little later to rise this winter; head out once the sun is up." },
              { tag: "Warmth", text: "Hat, scarf, and thick socks — keep your head, neck, and feet covered." },
              { tag: "Wind-down", text: "Soak your feet for 10 minutes, dry off, put on socks, and tuck in." }
            ],
            eat: { more: "lamb and daikon soup, red dates, ginger, walnuts", less: "anything iced or cold and raw", tip: "Always start the day with a warm breakfast.", drink: "ginger and red date tea (go easy if your throat feels dry)." },
            move: ["Walk slowly for 20 minutes around midday, when it's warmest.", "March in place indoors for 5 minutes and head out once you're warm."],
            safety: "Foot soaks and hot springs: 105°F (41°C) or cooler, 10 minutes at a time. If your feet don't feel temperature well, test the water with your hand."
          }
        },
        gut: {
          autumn: {
            note: [
              { tag: "Rhythm", text: "Eat at regular times and stop at about 70% full." },
              { tag: "Warmth", text: "Mornings and evenings are cool — keep your belly covered and your feet warm at night." },
              { tag: "Meals", text: "Eat a little more slowly, and put the phone down while you eat." }
            ],
            eat: { more: "Chinese yam, millet porridge, pumpkin, baked apple, daikon", less: "iced drinks, cold raw food, fried food, very spicy food", tip: "Start the day with a warm bowl of something.", drink: "warm millet porridge, warm water." },
            move: ["Wait half an hour after eating, then walk slowly for 15–20 minutes.", "Before bed, gently rub your belly in clockwise circles for 3 minutes."],
            safety: "If your stomach stays upset or feels very different from usual, check with a health professional."
          },
          winter: {
            note: [
              { tag: "Rhythm", text: "Have a warm breakfast; don't head out on an empty stomach." },
              { tag: "Warmth", text: "Keep your belly and feet warm, and keep the chill out." },
              { tag: "Meals", text: "Save hot pot and barbecue for now and then, and stop at about 70% full." }
            ],
            eat: { more: "Chinese yam, millet, pumpkin, red dates, warm noodle soup", less: "cold raw food, iced food, very greasy food", tip: "Eat slowly and chew well.", drink: "warm water, red date and millet porridge." },
            move: ["Wait half an hour after eating, then walk slowly for 15–20 minutes.", "Before bed, gently rub your belly in clockwise circles for 3 minutes."],
            safety: "If your stomach stays upset or feels very different from usual, check with a health professional."
          }
        },
        tense: {
          autumn: {
            note: [
              { tag: "Space", text: "Leave 10 minutes a day to do nothing at all — look at the sky, look at the trees." },
              { tag: "Rhythm", text: "Get to bed earlier this fall, and put the phone across the room." },
              { tag: "Outside", text: "Get 20 minutes of daylight outdoors." }
            ],
            eat: { more: "lily bulb, millet, bananas, a few nuts", less: "strong tea, coffee, very sweet snacks", tip: "Eat on time, not too hungry and not too full.", drink: "light jasmine tea (go easy after 3 p.m.)." },
            move: ["Follow the slow-walk rhythm for 20 minutes, counting each step."],
            safety: "If the tension won't let up and it's getting in the way of eating or sleeping, talk with a health professional."
          },
          winter: {
            note: [
              { tag: "Sunlight", text: "Head out around midday for 20 minutes of sun." },
              { tag: "Rhythm", text: "Early to bed and a little later to rise this winter; skip the late nights." },
              { tag: "Space", text: "Leave 10 minutes a day for one slow little thing, like making a pot of tea." }
            ],
            eat: { more: "millet, red dates, walnuts, warm soups", less: "strong tea, coffee, very sweet snacks", tip: "Eat on time, and eat warm.", drink: "warm red date tea." },
            move: ["Follow the slow-walk rhythm for 20 minutes around midday, when it's warmest."],
            safety: "If the tension won't let up and it's getting in the way of eating or sleeping, talk with a health professional."
          }
        },
        quiet: {
          autumn: {
            note: [
              { tag: "Space", text: "Find the same quiet stretch of time each day, and plan a little less." },
              { tag: "Rhythm", text: "Early to bed, early to rise this fall — follow the daylight." },
              { tag: "Water", text: "Fall air is dry, so sip warm water often." }
            ],
            eat: { more: "pears, lily bulb, Chinese yam, millet", less: "very spicy or salty food, late dinners out", tip: "Light, warm, and on time.", drink: "a pot of light tea, sipped slowly." },
            move: ["Take a 20-minute walk on your own — no earbuds, just the sound of your steps."],
            safety: "If you feel unwell, check with a health professional."
          },
          winter: {
            note: [
              { tag: "Space", text: "Winter is for staying in: fewer outings, more quiet time at home." },
              { tag: "Rhythm", text: "Early to bed and a little later to rise; head out once the sun is up." },
              { tag: "Warmth", text: "Keep the room cozy and make a pot of hot tea." }
            ],
            eat: { more: "Chinese yam, daikon, millet, warm soups", less: "anything iced or very spicy", tip: "Eat warm, and stop at about 70% full.", drink: "a pot of hot tea, sipped slowly." },
            move: ["Take a 20-minute walk on your own around midday, when it's warmest."],
            safety: "If you feel unwell, check with a health professional."
          }
        }
      },
      practices: {
        breath46: {
          label: "Slow breathing · in 4, out 6",
          short: "Slow breathing",
          intro: "Follow the circle: breathe in slowly through your nose as it grows, and breathe out slowly as it shrinks. No holding your breath.",
          phases: ["Breathe in", "Breathe out"]
        },
        breath478: {
          label: "4-7-8 breathing · before bed",
          short: "4-7-8",
          intro: "In for 4, pause for 7, out for 8 — four rounds. If the pause feels like too much, don't push; switch to in 4, out 6.",
          phases: ["Breathe in", "Pause", "Breathe out slowly"]
        },
        walk: {
          label: "Slow-walk rhythm",
          short: "Slow walk",
          intro: "Walk slowly to the “L · R” beat: three steps breathing in, three steps breathing out. Indoors, in a hallway, or in the park."
        },
        soak: {
          label: "Foot soak / hot spring timer",
          short: "Foot soak",
          intro: "Water 105°F (41°C) or cooler — warm, not hot, to the touch — for 10 minutes or less. Rinse your hands and feet first, and stand up slowly."
        },
        baduanjin1: {
          label: "Baduanjin, first move · Holding up the sky",
          short: "Baduanjin 1",
          intro: "A one-move sample you can do standing or seated. If your shoulders or neck complain, only lift as high as feels comfortable.",
          steps: [
            "Stand with your feet shoulder-width apart (or sit), shoulders relaxed.",
            "Lace your fingers in front of your belly, palms up, and breathe in slowly.",
            "Turn your palms up past your chest and press toward the sky, eyes following your hands.",
            "Stay up there for two seconds — no holding your breath, just breathe naturally.",
            "Breathe out slowly and let your arms float down by your sides, back to your belly.",
            "Once more: breathe in and lift, breathe out and lower.",
            "A third time, as slowly as you like, then stand still for a moment."
          ]
        },
        taiji1: {
          label: "Tai chi · Opening",
          short: "Tai chi",
          intro: "A one-move sample: slow, soft, in time with your breath. If your knees complain, bend less.",
          steps: [
            "Stand with your feet together, body relaxed, eyes looking ahead.",
            "Step your left foot out gently to shoulder width.",
            "Slowly raise both arms in front of you to shoulder height as you breathe in.",
            "Soften your knees and gently press your hands down to your belly as you breathe out.",
            "Once more: breathe in and lift, breathe out and press down.",
            "A third time, as slowly as you like, then stand still for a moment."
          ]
        }
      },
      homePlan: {
        bp: ["Soak your feet for 10 minutes, one to two hours before bed (105°F / 41°C or cooler)", "3 minutes of slow breathing: in for 4, out for 6, no holding", "A slow 20–30 minute walk in a nearby park"],
        sleep: ["Soak your feet for 10 minutes, one to two hours before bed", "Dim the lights and set the phone aside", "Four rounds of 4-7-8 breathing before you lie down"],
        cold: ["Soak your feet for 10 minutes in the evening, then put on socks right away", "A cup of warm red date tea", "A slow 20-minute walk when the sun is out"],
        gut: ["A warm bowl of porridge for breakfast", "A slow 15-minute walk half an hour after meals", "Gently rub your belly in clockwise circles for 3 minutes before bed"],
        tense: ["Follow the slow-walk rhythm for 20 minutes", "3 minutes of slow breathing", "10 minutes a day of doing nothing at all"],
        quiet: ["Find the same quiet stretch of time each day", "Make a pot of tea and sip it slowly", "3 minutes of slow breathing while you look out the window"]
      },
      quiz: {
        cold: "Are your hands and feet often cold — colder than the people around you?",
        sleep: "Is it hard to fall asleep at night, or do you often wake up in the middle of the night?",
        gut: "Does your stomach get upset after something cold or greasy?",
        tense: "Lately, do you feel wound up and find it hard to relax?",
        bp: "At checkups, are your numbers often a little higher than you'd like?"
      }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
