# HEALOA_RULES · 创始人规则（Cindy Yang）

> Founder rules for the HeaLoa Base App. 中文为准，英文是简短说明。
>
> **机器可读的同一份规则：[`rules/healoa-rules.json`](rules/healoa-rules.json)**（禁用词表、正则、必须存在的界面事实、每条规则对应的测试 ID）。
> Any reviewer tool (CI, code review bot, rule engine) should read that JSON; this page is its human-readable twin.
> 执行：`npm test`（含 `tests/rules.mjs`）。`tests/wording.mjs` 的各语言禁用词表由这个 JSON 生成，所以所有测试共用一个来源。
> 改规则的顺序：先改 JSON → 再改本页 → 跑 `node tests/rules.mjs`。`META.a` / `META.b` 会在规则没人检查、或本页和 JSON 对不上时失败。

匹配方式 / matching：中文、日文按「出现即算」（substring）；英文按整词、不分大小写（word）。es 词表为空，等母语审核人。
扫描范围 / scope：`index.html`、`app/*.js`、`scene-seed-legacy.html`（按中文词表）＋ 每个 `app/i18n/<语言>.js`（按该语言词表）；运行时再把中文主路径每一屏、分享图文字都扫一遍。

| ID | 规则（中文） | English gloss | 测试（`tests/rules.mjs` 的检查 ID + 其他套件） |
|---|---|---|---|
| **R01** | **健康疗愈，不是治疗。** 客户界面不出现疾病名（高血压、失眠、糖尿病……）和医疗词（治疗 / 诊断 / 疗效 / 降压 / 患者 / 医生 / 病 等，en / ja 对应词同样禁止）。只用温和说法：血压偏高 / 睡不踏实 / 怕冷手脚凉 / 肠胃弱 / 心里绷得紧 / 想安静一点。 | Wellness, not treatment: no disease names or medical words on customer screens; gentle body-state labels only. | `R01.a` 源码逐语言扫词 · `R01.b` 六个入口标签就是温和说法 · `R01.c` 运行时中文主路径每一屏 + 分享图扫全部词表 · 另有 `static-checks` banned-words、`healing-v3` / `merged-plan` 渲染扫描 |
| **R02** | **「疗愈 / healing」只能形容地方、氛围、体验、感受，不能说成结果。** 不说「疗愈失眠」「改善血压」「治焦虑」「有疗效 / therapeutic」。 | Healing may describe a place, atmosphere, experience or feeling — never an outcome. | `R02.a` 结果类词（治愈 / 改善 / 缓解 / heal / improve / 治す …）· `R02.b` 结果句式正则（heals insomnia / improves blood pressure / treats anxiety / 疗愈失眠 …）· `R02.c` 疗愈 / restorative / 癒し 旁边必须是地方 / 氛围 / 感受词 |
| **R03** | **投资人用语不进客户界面：** 数字资产、AGI、基础设施、网络效应、未来朋友（digital asset / AGI / infrastructure / network effect / future friend）。 | Investor words never appear in customer UI. | `R03.a` · `R01.c`（运行时） |
| **R04** | **不提中医顾问 / 顾问 / 医学审核人。** | No TCM consultant, advisor or medical reviewer mentions. | `R04.a` · `R01.c`（运行时） |
| **R05** | **身体 / 感受信息永远不进分享图、分享链接、网址参数。** 「留一句」里写了身体情况，就只留在自己的卡上，不跟着分享链接走。 | Body/feeling info never in a shared image, share link or URL param; a line naming a condition stays off the link. | `R05.a` 分享代码不读身体状态、链接参数只允许 `s` / `l` / `lang` · `R05.b` zh / en / ja × 6 种情况实测分享链接和分享图 · `R05.c` 含身体词的「留一句」样例全部不外带（端到端验证） · 另有 `merged-plan` |
| **R06** | **存下本季养护卡之后，必须有分享入口，包含「发给一个人」。** 首页第一屏没有分享；卡片默认「只留给自己」。 | After saving the card there must be a share entry with “send to one person”; no share on the home first screen; card defaults to “keep it to myself”. | `R06.a` 首页无分享 · `R06.b` 卡片默认「只留给自己」、不写身体情况 · `R06.c` 点「只留给自己」后可见「发给一个人…」并能打开分享面板 · 另有 `merged-plan` |
| **R07** | **不做积分、奖励、拉新返利、连续打卡、邀请换好处。** | No points, rewards, referrals, check-in streaks or invite-for-benefit. | `R07.a` 源码扫词 · `R07.b` 运行时主路径 + 分享流程 + 分享图 |
| **R08** | **App 里永远不链接 healoa.com。** | The app never links to healoa.com. | `R08.a` 仓库所有已跟踪文件（除规则文件本身）· `R08.b` 运行时每一屏的 href / src |
| **R09** | **主线顺序：** 身体 / 感受入口 → 季节 + 地点（带理由）→ 放松练习 → 本季养护卡。 | Main line: body/feeling entry → season + places with reasons → relaxation practice → season care card. | `R09.a` 浏览器走一遍主线并检查页面顺序 · `R09.b` 首页三步说明的顺序 |
| **R10** | **出现 Cindy 照片的地方署名「Photo · Cindy Yang」。** | Every Cindy photo carries the credit “Photo · Cindy Yang”. | `R10.a` 源码里每个照片模板都带署名 · `R10.b` 运行时每张可见照片都有署名 · `R10.c` 分享图上画了署名 |
| **R11** | **en / ja 只是草稿：** 只能用 `?lang=` 打开，并显示草稿标记；公开的语言切换隐藏；es 为空。 | en/ja are drafts, reachable only via `?lang=` with a draft badge; public switcher hidden; es empty. | `R11.a` 只有 zh 是完整语言、es 为空 · `R11.b` 浏览器实测默认 / 英文浏览器 / `?lang=en` / `?lang=ja` / `?lang=es` · 另有 `static-checks`、`i18n` |
| **R12** | （沿用 v3 锁定 2026-09-26）语气温和、不做情绪日记（累 / 烦 / 日记 / 情绪曲线）；不出现旧产品 / 网站用语（见 JSON `bannedAnywhere`）。 | Carried over from the v3 lock: gentle tone, no mood diary, no old product/website terms. | `R12.a` 源码扫词 · `R12.b` 仓库已跟踪文件 |

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
