# 夏威夷 · 火山 — 沉浸场景样张（SAMPLE，不要合并）

这是一个独立页面，**没有改动**主 demo 的 `index.html`。
流程：首页 → 感受签到（小海龟 Honu 陪你选）→ 推荐 → 门口 → 推开门 → 熔岩小树（2.5D 视差）→ 放入你的狗狗或自己（照片在手机里抠图）→ 挑装扮 → 留一句 → 竖版小视频 + 明信片（带二维码）→ 养成 / 积分 / 回访。

- 本地运行：在仓库根目录执行 `python3 -m http.server 8765`，然后打开 `http://127.0.0.1:8765/immersive-hawaii/`
- 测试：`npm run test:immersive`（主 demo 的测试照旧用 `npm run test:scene-seed`）
- 文档：`docs/RESEARCH.md` · `docs/SOURCES.md` · `docs/HOMEPAGE_COPY.md`（首页文案 + 签到推荐规则表）· `docs/POINTS_REFERRAL_SPEC.md`
- 没有后端，所有数据只存在这台设备上（localStorage）。换设备后数据能不能跟过去：**没做 / UNKNOWN**。
