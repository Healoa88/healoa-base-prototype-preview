# 沉浸场景 · 技术调研（夏威夷样张）

调研日期：2026-09-25（PT）。没有注册账号、没有付费、没有输入任何凭证。以下信息都来自公开页面，查不到的一律标 **UNKNOWN**。

## 1. World Labs · Marble（李飞飞的公司；单张图 → 可以走进去的 3D 世界，底层是 Gaussian splats）

| 问题 | 结论 | 来源 |
|---|---|---|
| 有没有公开 API？ | **有**：World API（`POST /marble/v1/worlds:generate`，另有 `…:export`）。要在 platform.worldlabs.ai 单独买 API 额度，和 Marble 网页版订阅**不通用**。 | [API docs](https://docs.worldlabs.ai/api) · [API FAQ](https://docs.worldlabs.ai/api/faq) · [API pricing](https://docs.worldlabs.ai/api/pricing) |
| API 价格 | $1 = 1,250 credits，最低充 $5。一个世界（world generation）= 1,500 credits ≈ **$1.20**；draft 版 150 credits；PLY splat 导出免费；高质量 GLB 网格导出 3,500 credits ≈ $2.80。 | [API pricing](https://docs.worldlabs.ai/api/pricing) |
| 网页版（Marble app）套餐 | Free（约 4 次生成，**不能导出**）/ Standard（**$20/月**，20,000 credits，可导出 splat SPZ/PLY、360 全景、碰撞网格）/ Pro（**$35/月**，含高质量网格导出和**商用权**）/ Max。价格取自官方账单帮助页里的换算示例。 | [Subscriptions & billing](https://docs.worldlabs.ai/marble/support/account-billing) · [Export](https://docs.worldlabs.ai/marble/export/gaussian-splat) · [Mesh export](https://docs.worldlabs.ai/marble/export/mesh) |
| 免费额度 | 网页版 Free 套餐能生成、**不能导出**。API **没有**免费额度（官方 FAQ 写明 Marble Free 和 API 计费是分开的）。 | 同上 |
| 导出格式 | Splat：**.spz**（100k / 500k / 全分辨率）和 **.ply**；网格：GLB（碰撞网格 + 高质量带贴图网格）；**全景图**（pano_url）；缩略图。API 不导出视频（视频是网页版功能）。 | [API docs](https://docs.worldlabs.ai/api) |
| 能不能在手机网页里渲染？ | **能**：World Labs 开源了 **Spark**（MIT 协议），是基于 THREE.js / WebGL2 的 3DGS 渲染器，支持 .spz/.ply/.splat/.ksplat/.sog；Spark 2.0 有 LoD 和流式加载（.RAD），官方默认预算：iOS 约 1.5M splats、Android 约 1M。 | [Spark GitHub](https://github.com/sparkjsdev/spark) · [Spark 2.0 blog](https://www.worldlabs.ai/blog/spark-2.0) · [LoD docs](https://sparkjs.dev/docs/lod-getting-started/) |
| 商用 Demo 的授权条款 | ToS §3.3：**Free 账号**的产出版权归 World Labs，只授权“个人、非商业使用”；**付费账号和 API** 的用户拥有产出，可以商用，但要遵守 ToS（包括 World Labs 的 license-back 权利，以及 API 文档里规定的署名要求）。帮助文档写的是 Pro 套餐才含“commercial rights”。 | [Terms of Service](https://www.worldlabs.ai/terms-of-service) · [Billing](https://docs.worldlabs.ai/marble/support/account-billing) |
| 我们现在能不能用？ | **技术上能用，但要花钱**：要么 Pro $35/月（网页版，含商用权），要么 API 大约 $1.2/个世界（最低充 $5）。这份样张**没有用** Marble，因为说好了不注册、不付费。 | — |
| 用我们这张“熔岩小树”照片生成出来效果如何？ | **UNKNOWN**（没生成过）。官方 FAQ 和第三方评测都提到：单张图输入时，看不到的地方是模型“编”出来的，背面和角落可能不一致。 | [therundown 评测](https://www.therundown.ai/tools/marble)（第三方） |
| 生成的 splat 文件在中端安卓上跑 60fps？文件多大？ | **UNKNOWN**（没实测）。 | — |
| API 署名具体要写什么 | **UNKNOWN**（ToS 里提到“按 API 文档署名”，具体写法没有查到）。 | [ToS](https://www.worldlabs.ai/terms-of-service) |

**建议**：先用这份 2.5D 样张验证“走进去 + 放进来 + 带走”这个玩法。如果 Cindy 想要真正可以走动的 3D，下一步是花 $5 用 API 生成 1–2 个世界（记得选付费 / API 才有商用权），用 Spark 放进同一个页面里，在真机上测帧率和文件大小。

## 2. 替代方案：浏览器里 / 离线做单目深度 → 2.5D 视差（本样张用的就是这个）

| 方案 | 结论 | 来源 |
|---|---|---|
| Depth Anything V2 **Small** | **Apache-2.0**（可以商用）。**注意**：Base / Large 版本是 **CC-BY-NC-4.0**（不能商用）。 | [HF: Depth-Anything-V2-Small](https://huggingface.co/depth-anything/Depth-Anything-V2-Small) · [HF: Base](https://huggingface.co/depth-anything/Depth-Anything-V2-Base) |
| ONNX 版本（transformers.js / onnxruntime） | [onnx-community/depth-anything-v2-small](https://huggingface.co/onnx-community/depth-anything-v2-small)，fp32 大约 99 MB。本样张在盒子上用 Python onnxruntime **离线**跑（每张不到 1 秒），只把深度图 PNG（30–60 KB）发给用户，手机端**不用下载模型**。 | 本仓库 `docs/immersive-hawaii/make_depth.py` |
| 在浏览器里实时算深度（用户自己上传的照片） | 可以用 transformers.js 的 `depth-estimation` pipeline，但首次要下载几十 MB 模型；本样张不需要（场景照片是固定的）。手机上要跑多久：**UNKNOWN**（没测）。 | [transformers.js](https://huggingface.co/docs/transformers.js) |
| 浏览器里抠图 | `@imgly/background-removal` 1.7.0：全部在设备上跑（onnxruntime-web），模型默认从 IMG.LY 的 CDN 下载（quint8 约 40 MB）。**协议是 AGPL-3.0**：做样张可以；正式商用前要么开源整个前端，要么买 IMG.LY 的商业授权，要么换成 Apache 协议的模型（比如 MediaPipe 人像分割，**但它只认人，不认狗**）。 | [npm](https://www.npmjs.com/package/@imgly/background-removal) |
| 二维码 | `qrcode-generator` 1.4.4（MIT），从 jsDelivr 加载。 | [npm](https://www.npmjs.com/package/qrcode-generator) |

## 3. 本样张实际选用的方案
离线深度图（DA-V2-Small，Apache-2.0）+ 自己写的 WebGL 着色器做视差（**没有**引入 three.js，少加载约 600 KB）+ IMG.LY 在设备上抠图（AGPL，按需加载）+ MediaRecorder 录竖版视频 + qrcode-generator。没有后端。
