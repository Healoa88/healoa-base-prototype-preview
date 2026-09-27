# HeaLoa Base · 顺着季节养（可点原型）

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- 版本：**预览 v2026-09-27-t** · 疗愈主线（Cindy 2026-09-26 锁定 v3）+ 多语言地基（目前只上线中文）
- 当前产品定义只看 **[`PRODUCT_CURRENT.md`](PRODUCT_CURRENT.md)**；历史规则与 SUPERSEDED 标记见 **[`DECISIONS.md`](DECISIONS.md)**。
- 这是可点原型，不是正式 App；纯静态页面（GitHub Pages，main 分支），无后端、无账号、无网络请求。

## 主路径

首页点一下自己的情况（血压偏高 / 睡不踏实 / 怕冷手脚凉 / 肠胃弱 / 心里绷得紧 / 想安静一点）→ 本季要留意、吃喝、怎么动、去哪里养（带真实气候数字和原因，以及「这个季节先不选」）→ 真实计时的放松练习 → 本季养护卡（默认只留给自己；分享是次要按钮，分享卡和链接不含身体或感受信息）。季节按日期自动（秋 / 冬），可切换。

## 文件

| 路径 | 内容 |
|---|---|
| `index.html` | 页面结构（首页、结果、地点、练习、养护卡、分享链接打开页、可选小测） |
| `app/i18n/zh.js` | **全部面向用户的文字**（界面、结果、地点、练习口令、养护卡、分享文案、页脚）——默认、目前唯一完整的语言 |
| `app/i18n/en.js` `ja.js` `es.js` | 空占位（只有注释，不做机器翻译） |
| `app/i18n/i18n.js` | 语言加载 + `t(key)`：`?lang=` → 本机记住的选择 → zh；缺失 / 不完整的语言回退 zh |
| `app/social.js` | 官方社交账号（按语言：platform / url / label）；**目前为空**，「关注我们」不显示 |
| `app/data.js` | 与语言无关的结构：六个入口 id、气候数字、照片、属性、计时；文字从当前语言合并进来 |
| `app/rules.js` | 确定性推荐规则（先不选 + 排序；无照片不进前三）；文字全部走 `t(key)` |
| `app/app.js` | 交互、真实计时（时间差 + Wake Lock）、养护卡 PNG、分享（navigator.share，退回复制链接）+ 二维码；无硬编码中文 |
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
npm test              # static-checks + healing-v3 + i18n（禁用词按语言、App-only、首页→结果 1 次点击、结果随输入变化、每个按钮有响应、分享无身体信息、真实计时、中文与改动前逐字一致、语言回退）
npm run shots         # 390×844 主路径截图（默认输出 /workspace/hb-v3-shots，可用 HEALOA_SHOTS_DIR 改）
npm run test:legacy   # 归档页旧测试（可选，较慢）
npm run golden:zh     # 把当前中文渲染与 tests/golden/zh-baseline.json（v2026-09-27-s 改动前采集）对比
```

`tests/golden/zh-baseline.json` 含私有养护卡 PNG 的哈希，和机器字体有关；换机器跑如不一致，先在改动前的提交上 `node tests/lib/capture-zh.mjs --write` 重新采集。

CI：`ci/github-actions-tests.yml` 是可直接使用的 GitHub Actions 工作流；放到 `.github/workflows/` 即可启用（当前推送凭据没有 workflow 权限，所以先放在 `ci/`）。

## 多语言（i18n）

- 顺序：**zh（已上线）→ en → ja → es**。目前只有中文完整；`en.js` / `ja.js` / `es.js` 是空占位，不做机器翻译。
- 每种语言上线前都要**母语者审核**全部文字，并在 `tests/wording.mjs` 补上该语言的禁用词表（现在是带 TODO 的空列表）；审核通过后才把 `meta.complete` 设为 `true`。
- 语言切换按钮只在 ≥2 种语言完整时出现；`?lang=xx` 可指定，选择记在本机；`<html lang>` 跟随当前语言。
- 英文版计划：分享走系统原生分享（iMessage / 短信，`navigator.share`）+ 9:16 IG Story 导出图，**不放二维码**。
- 每张卡片单独的链接预览图（OG image）需要短链接服务器（`/s/:shareId`），**还没做**。
- 「关注我们」：`app/social.js` 填入 Cindy 提供的真实账号后才显示（页脚 + 本季养护卡），绝不代填。

## 待 Cindy

社交账号链接（`app/social.js`，按语言）、地点署名一句真实感受（`cindyLine` 空位，没填就不显示）、云南等地照片（补齐前不进前三）、慢呼吸真人语音、各地原声、草津照片拍摄地确认。详见 `PRODUCT_CURRENT.md`。
