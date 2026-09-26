# 积分 + 邀请奖励 · 规则与后端需求（样张阶段）

状态：样张里的积分**只存在这台手机的 localStorage 里**，页面上写着：「演示版积分只存在你的手机里，暂时不能兑换」，没有现金价值，也不承诺以后能兑换。**服务端部分全部还没做（UNKNOWN / not built）。**

## 1. 本地模块接口（`immersive-hawaii/js/points.js`）
```
const P = HLPoints.create({ storage, now, dayKey });
P.earn(event, meta?) -> { ok, points, reason: 'ok' | 'capped' | 'unknown_event' }
P.balance() -> number        P.history() -> [{event, points, at, day, meta}]
P.canEarn(event) -> bool     P.rules -> RULES
```
以后接后端时，保持这套接口不变，把内部实现换成调用 `POST /v1/points/events`，由服务端返回结果就行。

## 2. 规则表
| event | 积分 | 上限 | 什么时候触发 | 样张里 |
|---|---|---|---|---|
| first_visit | 10 | 每台设备 1 次 | 第一次推开门 | ✅ 本地 |
| place_companion | 20 | 每天 1 次 | 放入狗狗 / 自己的照片 | ✅ 本地 |
| leave_line | 10 | 每天 1 次 | 留一句话后生成纪念品 | ✅ 本地 |
| daily_return | 15 | 每天 1 次 | 新的一天回来（不算第一次来的那天） | ✅ 本地 |
| nurture | 5 | 每天 1 次 | 浇水 / 陪它坐一会 / 留一句（**每天最多让小树长 1 级**） | ✅ 本地 |
| make_postcard | 5 | 每天 1 次 | 生成明信片 | ✅ 本地 |
| make_video | 20 | 每天 1 次 | 生成小视频 | ✅ 本地 |
| share | 10 | 每天 1 次 | 系统分享成功，或者走下载兜底 | ✅ 本地（没法核实对方有没有真的收到） |
| mango_pick | 15 | 1 次 | 芒果树彩蛋 | ✅ 本地 |
| referral_welcome | 30 + 小墨镜 | 每台设备 1 次 | 通过 `?ref=` 进来的朋友放入自己的小伙伴 | ✅ 本地（**可以被刷**，见下文） |
| referral_sharer | 50（草案） | 每个新朋友 1 次；每天 ≤5，总共 ≤50 | 朋友通过我的链接完成“放入小伙伴” | ❌ **没做，必须服务端做** |

养成阶段：嫩芽 → 小树（解锁露台沙发）→ 开花（小花冠）→ 结果（芒果树彩蛋）→ 小树林。按“照顾过的天数”算，每天最多 +1 级。
积分能解锁的装扮（只是装饰）：小墨镜 60（或者朋友邀请的见面礼）、金色花环 150。

## 3. 为什么“分享者的奖励”在样张里不能记
没有服务器，A 的手机就不可能知道 B 有没有打开链接、有没有放入小伙伴。如果在本地假装记上，就是造假。所以页面上只写：「朋友通过你的链接来放入 TA 的小伙伴时，你会得到奖励（正式版开启）」。

## 4. 需要的后端（草案，全部 UNKNOWN / 没做）
- `POST /v1/devices`：注册匿名设备，返回 device_id 和签名 token（最好能做设备证明：iOS 用 App Attest / DeviceCheck，安卓用 Play Integrity；网页端能做到什么程度：**UNKNOWN**）
- `POST /v1/referrals/links`：返回 ref_code（服务端生成，绑定分享者的账号或设备）
- `POST /v1/referrals/claim` `{ref_code, device_token, proof_event_id}`：朋友完成“放入小伙伴”后调用；服务端检查以后，给**双方**记账
- `POST /v1/points/events` `{event, idempotency_key}` 和 `GET /v1/points/balance|history`：所有积分都由服务端记账，客户端只负责显示
- 防刷规则：
  - **不能自己邀请自己**：ref_code 的主人不能等于领取人（按账号、设备指纹、支付或手机号去重）
  - **每个新人 / 新设备只算一次**：只有账号和设备都是第一次出现才给奖励；一台设备一辈子最多领一次见面礼
  - **有上限**：分享者每天 ≤5 次奖励，总共 ≤50 次；超过的只记录，不给积分
  - **必须真的做了事**：朋友要完成“放入小伙伴”才算，只打开链接不算；奖励可以延迟 24 小时，等风控检查
  - 同一个 IP 或设备段短时间内有大量领取就要限流；异常的进人工审核队列
  - 所有写操作都要带 idempotency_key，防止重放
- 隐私：用户的照片**永远不上传**；服务端只存事件和计数，不存照片也不存用户写的那句话。
- 合规：积分不能兑换现金；如果以后要兑换，需要法务评估（**UNKNOWN**）。

## 5. 现在已知可以被钻的空子
清掉 localStorage 就能再领一次 first_visit 和 referral_welcome。样张阶段可以接受，因为这些积分没有任何价值。
