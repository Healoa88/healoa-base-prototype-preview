# Offline depth map for the in-App 2.5D view (v2026-09-27-y). Runs ON THIS MACHINE ONLY — Cindy's photos are never
# uploaded to any third-party service. Model: Depth Anything V2 Small (Apache-2.0, onnx-community export), onnxruntime CPU.
# Output: <photo>-depth.png (grayscale, 1 = near), half resolution, softened so edges tear less.
# Usage: python3 tools/make_depth.py assets/places/wudang/02-terrace-sunrise.jpg [model path]
import sys, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
src = sys.argv[1]; model = sys.argv[2] if len(sys.argv) > 2 else '/workspace/.models/da2s.onnx'
im = Image.open(src).convert('RGB')
sess = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
if im.width < im.height: tw = 518; th = round(im.height / im.width * 518 / 14) * 14
else: th = 518; tw = round(im.width / im.height * 518 / 14) * 14
x = np.asarray(im.resize((tw, th), Image.BICUBIC), dtype=np.float32) / 255.
x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
d = sess.run(None, {'pixel_values': x})[0].squeeze()
d = (d - d.min()) / (d.max() - d.min())
dm = Image.fromarray((d * 255).astype(np.uint8)).resize(im.size, Image.BICUBIC)
dm = dm.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(3))
out = src.rsplit('.', 1)[0] + '-depth.png'
dm.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(out, optimize=True)
print(out, im.size)
