# 样张素材来源（immersive-hawaii）

所有素材都来自 `/workspace/docs/photo-inbox-2026-09-25/hawaii/`（Cindy 的照片收件箱）。用 Pillow 重新编码时**没有带上 EXIF**，所以 GPS、机型、拍摄时间都已经去掉（已检查：输出文件 `getexif()` 为空）。原图的 EXIF 里有 GPS 块（tag 34853）、Apple iPhone 16 Pro Max、2026:01:19 等信息，这些**都没有**进仓库。

| 仓库文件 | 原图 | 处理 |
|---|---|---|
| assets/hawaii-06.jpg (1200×1600, 265 KB) | 06-lava-crack-fern-sapling-dusk.jpg (3024×4032) | 缩放，JPEG q80，渐进式 |
| assets/hawaii-06-depth.png | 同上 | Depth Anything V2 Small（ONNX，Apache-2.0），先膨胀再模糊，600×800 |
| assets/hawaii-06-sapling.webp | 同上 | 按“地平线以上，比天空暗”抠出小树，做成成长阶段用的贴图 |
| assets/hawaii-13-door.jpg (900×1600) + depth | 13-doorway-to-lanai-lava.jpg (2160×3840) | 同上（原图本身是 2160×3840，不需要放大） |
| assets/hawaii-12-lanai.jpg + depth | 12-lanai-sofa-lava-view.jpg (2160×3840) | 同上 |
| assets/hawaii-17-mango.jpg + depth | 17-mango-tree-over-lava.jpg (2160×3840) | 同上 |
| assets/*-lqip.jpg | 同上 | 1/8 尺寸的模糊占位图 |
| assets/placeholder-dog.svg | 手绘 | 卡通狗狗剪影，**明确是占位图**，不是真实照片 |

- 照片署名沿用本仓库现有的写法：`Photo · Cindy Yang`（前提是这些照片是 Cindy 拍的；从“Cindy 的照片”这个说法推断，**没有逐张核实**）。
- 画面里没有人脸。
- 13/12/17 的简报里说是“约 576px 宽的视频帧”，但实际文件是 2160×3840，所以没有做放大。
- 生成脚本：`docs/immersive-hawaii/make_depth.py`、`make_sapling_sprite.py`。
