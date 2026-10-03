# HeaLoa Base · 顺着季节养（可点原型）

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- 版本：**预览 v2026-10-03-a**（v4 Phase 1：配对小测 → 翻牌 → 为什么是你 → 地方 → 放松 → 养护卡 / 我的养护记录，D-27-05）· 创始人规则见 `HEALOA_RULES.md`（机器可读 `rules/healoa-rules.json`）
- 当前产品定义只看 **[`PRODUCT_CURRENT.md`](PRODUCT_CURRENT.md)**；历史规则与 SUPERSEDED 标记见 **[`DECISIONS.md`](DECISIONS.md)**。
- 这是可点原型，不是正式 App；纯静态页面（GitHub Pages，main 分支），无后端、无账号、无网络请求。

## 主路径

首页（这个节气，哪里最适合你？+ 一句话 + 「怎么用」三步）→ 2 分钟配对小测（8 题，一屏一题，可多选 / 跳过 / 上一题，答案只存本机）→ 翻牌看这个节气的 3 个地方 → 为什么是你（理由 + 吃 / 做 / 避开）→ 地点页（适合谁 / 要避开什么 / 在这里做一件事）→ 真实计时的放松 → 本季养护卡（默认只留给自己）/ 我的养护记录（本机）→ 可选「留一句」→ 可选「发给一个人」。所有地方第一次打开就全部开放。收件人可看到那一句、「在旁边也写一句」（一次，无后端）或「给自己也配一次」。季节按二十四节气自动（秋 / 冬），可切换。

## 文件

| 路径 | 内容 |
|---|---|
| `index.html` | 页面结构（首页、配对小测、翻牌、为什么是你、所有地方、地点、练习、养护卡、我的养护记录、分享链接打开页） |
| `app/i18n/zh.js` | **全部面向用户的文字**（界面、结果、地点、练习口令、养护卡、分享文案、页脚）——默认、目前唯一完整的语言 |
| `app/i18n/en.js` | 英文**草稿**（Cindy 用 Muse 校对后上线），只能 `?lang=en` 打开，带「Draft preview」标记 |
| `app/i18n/ja.js` | 日文**草稿**（需日本工程师修改），只能 `?lang=ja` 打开，带「下書き」标记 |
| `app/i18n/es.js` | 空占位（延后，等有审核人） |
| `app/i18n/i18n.js` | 语言加载 + `t(key)`：`?lang=` → 本机记住的选择 → zh；草稿只能显式 `?lang=` 打开（不记忆）；缺失 / 空语言回退 zh |
| `app/share-targets.js` | 按语言的分享平台按钮（zh 微信 / 小红书 / 微博 / 抖音；en Text / Instagram Story / Facebook / WhatsApp / X；ja LINE / X；es WhatsApp / Facebook；都有复制链接），是否显示二维码（只 zh） |
| `app/social.js` | 官方社交账号（按语言：platform / url / label）；**目前为空**，「关注我们」不显示 |
| `app/data.js` | 与语言无关的结构：六个入口 id、气候数字、照片、属性、计时；文字从当前语言合并进来 |
| `app/rules.js` | 安全规则（先不选）+ 气候理由；文字全部走 `t(key)` |
| `app/kb.js` | 配对知识库（v4）：答案 → 标签权重（气候 / 场景 / 距离）；中医层结构在，权重全部 null（= 0），状态 pending-cindy；没有已核对来源的句子不显示 |
| `app/match.js` | 配对打分引擎（v4）：安全排除 → 气候 + 场景加分 → × 当前节气系数（→ 距离），前三每种主场景一个；`sourced()` 显示闸门 |
| `app/app.js` | 交互、真实计时（时间差 + Wake Lock）、养护卡 PNG、留一句 / 收件人回写、分享（navigator.share 带 PNG，按平台按钮，4:5 图卡 + 9:16 Story 图，拉丁文字按词换行，二维码只 zh）；无硬编码中文 |
| `app/app.css` | 移动优先、大字、高对比 |
| `vendor/qrcode.js` | qrcode-generator（MIT）离线副本 |
| `data/climate/*.json` | NASA POWER 2001–2020 气候月均值原始数据（CC BY 4.0） |
| `tools/climate-summary.mjs` | 由原始数据推导季节数字（测试校验与 `app/data.js` 一致） |
| `assets/places/` | Cindy 实拍照片（Photo · Cindy Yang，见 `assets/places/SOURCES.md`） |
| `scene-seed-legacy.html` | 旧 Scene Seed 演示归档（SUPERSEDED，不在主路径；旧 `#seed=` 链接自动跳转到这里） |

## 测试

```bash
npm i
npx playwright install chromium   # 第一次
npm test              # static-checks + match（打分引擎人设单元测试）+ healing-v3 + i18n + merged-plan + season（节气 / 季节单元测试）+ rules（R01–R17 每条规则至少一个检查；禁用词按语言、App-only、小测 → 翻牌 → 为什么是你、所有地方开放、无来源不显示、结果随输入变化、每个按钮有响应、分享无身体信息、真实计时、中文快照、语言回退 / 草稿、留一句 / 收件人 / 每个平台按钮 / 9:16 图）
npm run test:merged   # 只跑合并方案测试
npm run shots         # 390×844 截图（默认输出 /workspace/hb-merge-shots，可用 HEALOA_SHOTS_DIR 改；v4 一组在 /workspace/v4-p1-shots）
npm run test:legacy   # 归档页旧测试（可选，较慢）
npm run golden:zh     # 把当前中文渲染与 tests/golden/zh-baseline.json（v2026-10-01-a 有意更新的快照）对比；--write 重新采集
```

`tests/golden/zh-baseline.json` 含私有养护卡 PNG 的哈希，和机器字体有关；换机器跑如不一致，在当前提交上 `node tests/lib/capture-zh.mjs --write` 重新采集。

CI：`ci/github-actions-tests.yml` 是可直接使用的 GitHub Actions 工作流；放到 `.github/workflows/` 即可启用（当前推送凭据没有 workflow 权限，所以先放在 `ci/`）。

## 多语言（i18n）

- **zh 上线**；**en 草稿**由 Cindy 用 Muse 校对；**ja 草稿**由日本工程师修改；**es 延后**（没有审核人，`es.js` 为空）。
- 草稿只能 `?lang=en` / `?lang=ja` 打开，页面顶部有「Draft preview」/「下書き」小标记；公开语言切换只在 ≥2 种语言完整时出现（现在隐藏）。
- 上线一种语言：母语审核全部文字 → `rules/healoa-rules.json` 该语言禁用词表齐全（`tests/wording.mjs` 由它生成） → `meta.complete = true` 并去掉 `draft`。
- 每张卡片单独的链接预览图（OG image）需要短链接服务器（`/s/:shareId`），**还没做**。
- 「关注我们」：`app/social.js` 填入 Cindy 提供的真实账号后才显示，绝不代填。

## 待 Cindy

社交账号链接（`app/social.js`，按语言）、英文草稿 Muse 校对、日文草稿请日本工程师修改、地点署名一句真实感受（`cindyLine` 空位，没填就不显示）、云南等地照片（补齐前不进前三）、慢呼吸真人语音、各地原声、草津照片拍摄地确认。详见 `PRODUCT_CURRENT.md`。
