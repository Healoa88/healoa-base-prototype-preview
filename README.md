# HeaLoa Base · 顺着季节养（可点原型）

- Live: https://healoa88.github.io/healoa-base-prototype-preview/
- 版本：**预览 v2026-09-27-s** · 疗愈主线（Cindy 2026-09-26 锁定 v3）
- 当前产品定义只看 **[`PRODUCT_CURRENT.md`](PRODUCT_CURRENT.md)**；历史规则与 SUPERSEDED 标记见 **[`DECISIONS.md`](DECISIONS.md)**。
- 这是可点原型，不是正式 App；纯静态页面（GitHub Pages，main 分支），无后端、无账号、无网络请求。

## 主路径

首页点一下自己的情况（血压偏高 / 睡不踏实 / 怕冷手脚凉 / 肠胃弱 / 心里绷得紧 / 想安静一点）→ 本季要留意、吃喝、怎么动、去哪里养（带真实气候数字和原因，以及「这个季节先不选」）→ 真实计时的放松练习 → 本季养护卡（默认只留给自己；分享是次要按钮，分享卡和链接不含身体或感受信息）。季节按日期自动（秋 / 冬），可切换。

## 文件

| 路径 | 内容 |
|---|---|
| `index.html` | 页面结构（首页、结果、地点、练习、养护卡、分享链接打开页、可选小测） |
| `app/data.js` | 全部面向用户的内容：六个入口、秋冬养护、地点、练习、气候数字 |
| `app/rules.js` | 确定性推荐规则（先不选 + 排序；无照片不进前三） |
| `app/app.js` | 交互、真实计时（时间差 + Wake Lock）、养护卡 PNG、分享卡 + 二维码 |
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
npm test              # static-checks + healing-v3（禁用词、App-only、首页→结果 1 次点击、结果随输入变化、每个按钮有响应、分享无身体信息、真实计时）
npm run shots         # 390×844 主路径截图（默认输出 /workspace/hb-v3-shots，可用 HEALOA_SHOTS_DIR 改）
npm run test:legacy   # 归档页旧测试（可选，较慢）
```

CI：`ci/github-actions-tests.yml` 是可直接使用的 GitHub Actions 工作流；放到 `.github/workflows/` 即可启用（当前推送凭据没有 workflow 权限，所以先放在 `ci/`）。

## 待 Cindy

地点署名一句真实感受（`cindyLine` 空位，没填就不显示）、云南等地照片（补齐前不进前三）、慢呼吸真人语音、各地原声、草津照片拍摄地确认。详见 `PRODUCT_CURRENT.md`。
