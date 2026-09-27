# HeaLoa Base · 顺着季节养（可点原型）

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- 版本：**预览 v2026-09-27-w** · 创始人规则见 `HEALOA_RULES.md`（机器可读 `rules/healoa-rules.json`）· 疗愈主线（Cindy 2026-09-26 锁定 v3）+ 合并方案（留一句 / 发给一个人 / 按平台分享，D-27-02）+ 多语言（只上线中文；en / ja 为草稿预览）
- 当前产品定义只看 **[`PRODUCT_CURRENT.md`](PRODUCT_CURRENT.md)**；历史规则与 SUPERSEDED 标记见 **[`DECISIONS.md`](DECISIONS.md)**。
- 这是可点原型，不是正式 App；纯静态页面（GitHub Pages，main 分支），无后端、无账号、无网络请求。

## 主路径

首页点一下自己的情况（血压偏高 / 睡不踏实 / 怕冷手脚凉 / 肠胃弱 / 心里绷得紧 / 想安静一点）→ 本季要留意、吃喝、怎么动、去哪里养（带真实气候数字和原因，以及「这个季节先不选」）→ 真实计时的放松练习 → 本季养护卡（默认只留给自己）→ 可选「留一句」（只存本机，写在自己卡上）→ 可选「发给一个人」（原生分享 + 按平台按钮 + 9:16 Story 图；分享卡和链接不含身体或感受信息）。收件人可看到那一句、「在旁边也写一句」（一次，无后端）或「给自己也做一张」。季节按日期自动（秋 / 冬），可切换。

## 文件

| 路径 | 内容 |
|---|---|
| `index.html` | 页面结构（首页、结果、地点、练习、养护卡、分享链接打开页、可选小测） |
| `app/i18n/zh.js` | **全部面向用户的文字**（界面、结果、地点、练习口令、养护卡、分享文案、页脚）——默认、目前唯一完整的语言 |
| `app/i18n/en.js` | 英文**草稿**（Cindy 用 Muse 校对后上线），只能 `?lang=en` 打开，带「Draft preview」标记 |
| `app/i18n/ja.js` | 日文**草稿**（需日本工程师修改），只能 `?lang=ja` 打开，带「下書き」标记 |
| `app/i18n/es.js` | 空占位（延后，等有审核人） |
| `app/i18n/i18n.js` | 语言加载 + `t(key)`：`?lang=` → 本机记住的选择 → zh；草稿只能显式 `?lang=` 打开（不记忆）；缺失 / 空语言回退 zh |
| `app/share-targets.js` | 按语言的分享平台按钮（zh 微信 / 小红书 / 微博 / 抖音；en Text / Instagram Story / Facebook / WhatsApp / X；ja LINE / X；es WhatsApp / Facebook；都有复制链接），是否显示二维码（只 zh） |
| `app/social.js` | 官方社交账号（按语言：platform / url / label）；**目前为空**，「关注我们」不显示 |
| `app/data.js` | 与语言无关的结构：六个入口 id、气候数字、照片、属性、计时；文字从当前语言合并进来 |
| `app/rules.js` | 确定性推荐规则（先不选 + 排序；无照片不进前三）；文字全部走 `t(key)` |
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
npm test              # static-checks + healing-v3 + i18n + merged-plan + season（节气 / 季节单元测试）+ rules（R01–R14 每条规则至少一个检查；禁用词按语言、App-only、首页→结果 1 次点击、结果随输入变化、每个按钮有响应、分享无身体信息、真实计时、中文快照、语言回退 / 草稿、留一句 / 收件人 / 每个平台按钮 / 9:16 图）
npm run test:merged   # 只跑合并方案测试
npm run shots         # 390×844 截图（默认输出 /workspace/hb-merge-shots，可用 HEALOA_SHOTS_DIR 改）
npm run test:legacy   # 归档页旧测试（可选，较慢）
npm run golden:zh     # 把当前中文渲染与 tests/golden/zh-baseline.json（v2026-09-27-w 有意更新的快照）对比；--write 重新采集
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
