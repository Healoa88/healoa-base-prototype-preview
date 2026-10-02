# HEALOA_RULES · 创始人规则（Cindy Yang）

> Founder rules for the HeaLoa Base App. 中文为准，英文是简短说明。
>
> **机器可读的同一份规则：[`rules/healoa-rules.json`](rules/healoa-rules.json)**（禁用词表、正则、必须存在的界面事实、每条规则对应的测试 ID）。
> Any reviewer tool (CI, code review bot, rule engine) should read that JSON; this page is its human-readable twin.
> 执行：`npm test`（含 `tests/rules.mjs`；季节 / 节气的单元测试在 `tests/season.mjs`）。`tests/wording.mjs` 的各语言禁用词表由这个 JSON 生成，所以所有测试共用一个来源。
> 改规则的顺序：先改 JSON → 再改本页 → 跑 `node tests/rules.mjs`。`META.a` / `META.b` 会在规则没人检查、或本页和 JSON 对不上时失败。

匹配方式 / matching：中文、日文按「出现即算」（substring）；英文按整词、不分大小写（word）。es 词表为空，等母语审核人。
扫描范围 / scope：`index.html`、`app/*.js`、`scene-seed-legacy.html`（按中文词表）＋ 每个 `app/i18n/<语言>.js`（按该语言词表）；运行时再把中文主路径每一屏、分享图文字都扫一遍。

| ID | 规则（中文） | English gloss | 测试（`tests/rules.mjs` 的检查 ID + 其他套件） |
|---|---|---|---|
| **R01** | **健康疗愈，不是治疗。** 客户界面不出现疾病名（高血压、失眠、糖尿病……）和医疗词（治疗 / 诊断 / 疗效 / 降压 / 患者 / 医生 / 病 等，en / ja 对应词同样禁止）。只用温和说法：血压偏高 / 睡不踏实 / 怕冷手脚凉 / 肠胃弱 / 心里绷得紧 / 想安静一点。 | Wellness, not treatment: no disease names or medical words on customer screens; gentle body-state labels only. | `R01.a` 源码逐语言扫词 · `R01.b` 六个身体 / 感受标签就是温和说法，也是配对小测 Q1 / Q6 的选项，小测题目和选项不含疾病词 · `R01.c` 运行时中文主路径每一屏 + 分享图扫全部词表 · 另有 `static-checks` banned-words、`healing-v3` / `merged-plan` 渲染扫描 |
| **R02** | **「疗愈 / healing」只能形容地方、氛围、体验、感受，不能说成结果。** 不说「疗愈失眠」「改善血压」「治焦虑」「有疗效 / therapeutic」。 | Healing may describe a place, atmosphere, experience or feeling — never an outcome. | `R02.a` 结果类词（治愈 / 改善 / 缓解 / heal / improve / 治す …）· `R02.b` 结果句式正则（heals insomnia / improves blood pressure / treats anxiety / 疗愈失眠 …）· `R02.c` 疗愈 / restorative / 癒し 旁边必须是地方 / 氛围 / 感受词 |
| **R03** | **投资人用语不进客户界面：** 数字资产、AGI、基础设施、网络效应、未来朋友（digital asset / AGI / infrastructure / network effect / future friend）。 | Investor words never appear in customer UI. | `R03.a` · `R01.c`（运行时） |
| **R04** | **不提中医顾问 / 顾问 / 医学审核人。** | No TCM consultant, advisor or medical reviewer mentions. | `R04.a` · `R01.c`（运行时） |
| **R05** | **身体 / 感受信息永远不进分享图、分享链接、网址参数。** 「留一句」里写了身体情况，就只留在自己的卡上，不跟着分享链接走。**没打开「写出我的情况」（默认）时，自己的养护卡和「存成图片」也不写任何能看出情况的字**：卡上换成对所有人都一样的本季通用安排和通用提醒；提到身体的「留一句」也先不写上卡（v2026-09-27-w）。 | Body/feeling info never in a shared image, share link or URL param; a line naming a condition stays off the link. With “write my condition” off, the private card and its saved PNG carry no condition-identifying text. | `R05.a` 分享代码不读身体状态、链接参数只允许 `s` / `l` / `lang` · `R05.b` zh / en / ja × 6 种情况实测分享链接和分享图 · `R05.c` 含身体词的「留一句」样例全部不外带（端到端验证；打开「写出我的情况」才上自己的卡） · `R05.d` 开关关着：zh / en / ja × 6 种情况 × 秋冬 共 36 次，卡片页面文字 + 「存成图片」PNG 上画的每一行都不含情况名、`privateWords` 词根、和情况有关的安全 / 吃 / 动句子；打开开关的对照组能看到情况 · 另有 `merged-plan` |
| **R06** | **存下本季养护卡之后，必须有分享入口，包含「发给一个人」。** 首页第一屏没有分享；卡片默认「只留给自己」。 | After saving the card there must be a share entry with “send to one person”; no share on the home first screen; card defaults to “keep it to myself”. | `R06.a` 首页无分享 · `R06.b` 卡片默认「只留给自己」、不写身体情况 · `R06.c` 点「只留给自己」后可见「发给一个人…」并能打开分享面板 · 另有 `merged-plan` |
| **R07** | **不做积分、奖励、拉新返利、连续打卡、邀请换好处。** | No points, rewards, referrals, check-in streaks or invite-for-benefit. | `R07.a` 源码扫词 · `R07.b` 运行时主路径 + 分享流程 + 分享图 |
| **R08** | **App 里永远不链接 healoa.com。** | The app never links to healoa.com. | `R08.a` 仓库所有已跟踪文件（除规则文件本身）· `R08.b` 运行时每一屏的 href / src |
| **R09** | **主线顺序（v4，D-27-05）：** 2 分钟配对（一屏一题）→ 翻牌看这个节气的 3 个地方 → 为什么是你（地点带理由 + 吃 / 做 / 避开）→ 走进一个地方做放松 → 本季养护卡 / 我的养护记录。 | Main line (v4): 2-minute match → flip reveal of 3 places → why these places → step into one place and relax → season card / care log. | `R09.a` 浏览器走一遍主线（首页 → 小测 → 翻牌 → 为什么是你 → 地方 → 放松 → 卡）并检查顺序 · `R09.b` 首页「怎么用」三步的顺序 |
| **R10** | **照片上不压任何署名；客户界面不出现「Photo · Cindy Yang」或「本 App 所有地方照片均由 Cindy Yang…」一类照片署名 / 版权行，也不以 Cindy / Cindy Yang 署名照片。**（D-02-01 撤销 D-27-06 的统一版权行） | No overlay credit; no consumer-facing Cindy / Cindy Yang photo credit or blanket copyright line. | `R10.a` 源码无署名浮层、copyright 字符串为空、无旧版权行、照片经 img()（焦点 + cover） · `R10.b` 运行时无署名浮层、无 Cindy 照片署名、照片 cover 不拉伸 · `R10.c` 9:16 分享图不画旧版权行、无署名浮层 |
| **R11** | **en / ja 只是草稿：** 只能用 `?lang=` 打开，并显示草稿标记；公开的语言切换隐藏；es 为空。 | en/ja are drafts, reachable only via `?lang=` with a draft badge; public switcher hidden; es empty. | `R11.a` 只有 zh 是完整语言、es 为空 · `R11.b` 浏览器实测默认 / 英文浏览器 / `?lang=en` / `?lang=ja` / `?lang=es` · 另有 `static-checks`、`i18n` |
| **R12** | （沿用 v3 锁定 2026-09-26）语气温和、不做情绪日记（累 / 烦 / 日记 / 情绪曲线）；不出现旧产品 / 网站用语（见 JSON `bannedAnywhere`）。 | Carried over from the v3 lock: gentle tone, no mood diary, no old product/website terms. | `R12.a` 源码扫词 · `R12.b` 仓库已跟踪文件 |
| **R13** | **客户界面不出现内部 / 没做完的用语**：网格海拔、待人工核对、样品、照片待补、Climate data……改成长辈看得懂的大白话，或者不显示；数据来源只写在「关于这份 Demo」。 | No internal / unfinished developer wording on customer screens; say it plainly or hide it. | `R13.a` 源码逐语言扫词（JSON `R13.banned`）· `R01.c`（运行时每一屏） |
| **R14** | **放松练习对每个人都安全。** 不管小测里选了什么（v4 可以多选、也可以跳过），任何练习都不能靠「选了什么」来保护人：任何一步憋气 / 停顿都不超过 2 秒，不做 4-7-8 这类长憋气，用吸 4 呼 6 这类温和的长呼气（v2026-09-27-w）。 | Every practice is safe for everyone: no breath hold longer than 2 s anywhere (no 4-7-8). | `R14.a` 源码扫词（4-7-8 / 停 7 秒 …）· `R14.b` 每个练习的呼吸形状 + 步骤时长 + 三种语言的说明文字，停顿都 ≤ 2 秒（含检测器自检）· `R14.c` 浏览器：6 种情况 × 秋冬，结果页和练习页能点到的每个练习都 ≤ 2 秒 |
| **R15** | **所有地方从第一次打开就全部开放**（v4，D-27-05）：有「所有地方」列表，列出每个有实拍照片的地方，都能点进去；没有锁、没有「即将开放」、不用先完成什么。 | Every place is open from the first visit; an all-places list, no locks, no “coming soon”. | `R15.a` 源码逐语言扫词（即将开放 / 已锁定 / coming soon / locked …）· `R15.b` 浏览器：第一次打开（本机没有记录），「所有地方」列出全部有照片的地方，没有禁用 / 锁，每个都能打开 |
| **R16** | **知识库的中医权重层在 Cindy 的资料到之前不生效**（v4，D-27-05）：每个权重都是 null（按 0 算）；没有来源（`sourceRef` 指向已核对的资料）的吃 / 做 / 避开 / 适合谁句子一律不显示。 | The TCM knowledge-base layer is off until Cindy’s materials arrive; weights null = 0; no sentence without a verified source is shown. | `R16.a` `app/kb.js` 的中医层权重全是 null + pending-cindy，全选答案时得分仍为 0；`sourced()` 不放出没来源的句子 · `R16.b` 浏览器（测试用假数据，不上线）：没来源 / 来源没核对的句子不显示，核对过的才显示，而且只对指向它的答案显示 |
| **R17** | **配对小测**（v4，D-27-05）：一屏一题，共 8 题；方案写「可以选几个」的题（Q1 / Q5 / Q6 / Q7）多选，其余单选；每题都有「都不是 / 说不准」、上一题、进度条；答案只存在手机本机，不进网址、分享链接、分享图。 | Quiz: one question per screen, 8 questions, multi-select where the plan says, skip / back / progress; answers never leave the phone. | `R17.a` 题数、多选题、每屏一题 + 跳过 + 上一题 + 进度条 · `R17.b` 浏览器：答满 8 题后，网址、分享链接、分享文字、分享图和 9:16 竖图都不含任何答案 · 另有 `healing-v3` quiz mechanics |
| **R18** | **分享的每个按钮都真的能用**（D-27-06）：系统分享 / 存图片 / 存视频 / 复制链接 / 短信（en）/ LINE、X（ja）；不放只会「存图再叫你自己打开 App」的平台按钮；导出是照片铺满的 9:16（1080×1920）；二维码只在 zh。 | Every share button genuinely works; no fake platform buttons; full-bleed 9:16 1080×1920 exports; QR only in zh. | `R18.a` 分享配置只有 web / sms / copy，系统分享 + 存图片 + 存视频都接好 · `R18.b` 浏览器：zh 只有复制 + 二维码、en 短信 + 复制无二维码；发送带 PNG；存图片 1080×1920；存视频得到真的视频 |
| **R19** | **提醒和音乐都是自己打开才有、默认关**（D-27-06）：提醒语气轻、错过不提示、没有连续天数；音乐只用手机当场合成的音色或 Cindy 提供的有版权的曲子。 | Reminders and music are opt-in, off by default, gentle, no streaks; music is synthesised or Cindy's licensed track. | `R19.a` 默认关、合成音色或本地授权曲子、文案无连续天数 · `R19.b` 浏览器：第一次打开都是关；点了才开；日历文件每天重复、到点提醒 |

## 元检查 / Meta checks

- `META.a`：JSON 里每条规则至少有一个 `tests/rules.mjs` 检查，而且都跑过、都通过；跑过的检查也都登记在某条规则下。
- `META.b`：本页写到了每条规则 ID 和每个检查 ID，并指向 `rules/healoa-rules.json` 与 `tests/rules.mjs`。

## 说明 / Notes

- 「留一句」过滤词在 `app/i18n/<语言>.js` 的 `privateWords`（只用于判断，不显示）。为了让语言文件本身也通过禁用词扫描，这里用词根（如 眠 / 糖尿 / 焦 / 郁、insomn / anxi / diabet），能盖住包含它们的长词。
- CI：`ci/github-actions-tests.yml` 是备用的 GitHub Actions 配置（暂未启用，因为没有 workflow 权限）。现在拦住合并的是下面的「合并闸门」。

## 合并闸门 / Merge gate（`scripts/gate.sh`）

每个 PR 合并前都必须先跑 `scripts/gate.sh <PR号>`——Code Bot 和 Grok 都一样，没有例外。
Every PR must run `scripts/gate.sh <PR>` before merge — Code Bot and Grok alike.

- 它做什么：取 PR 最新提交（head SHA），在临时 git worktree 里装依赖（有 lockfile 用 `npm ci`，否则 `npm install --no-save`），跑完整 `npm test`，然后在这个提交上写 commit status `healoa-rules-gate`：开始时 `pending`，结束时 `success`（通过数）或 `failure`（最先失败的规则 / 检查 ID）。不会动你当前的 checkout。
- main 开了分支保护：必须 `healoa-rules-gate = success`，而且分支必须和 main 同步（strict）；管理员也一样；不能强推、不能删 main。
- PR 落后于 main 时：先更新分支（`gh pr update-branch <PR>`），新的 head 没有状态，要重新跑闸门。
- 唯一的合并方式 / the only way to merge:

```
scripts/gate.sh <PR> && gh pr merge <PR> --merge
```
