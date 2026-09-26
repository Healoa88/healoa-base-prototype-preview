# Offline asset prep for immersive-hawaii sample.
# Depth Anything V2 Small (Apache-2.0; onnx-community/depth-anything-v2-small export) via onnxruntime CPU.
# Output JPGs are re-encoded by Pillow WITHOUT exif -> EXIF/GPS stripped.
import sys, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter, ImageOps
IN='/workspace/docs/photo-inbox-2026-09-25/hawaii/'
OUT='/workspace/wt-immersive/immersive-hawaii/assets/'
JOBS={'06-lava-crack-fern-sapling-dusk.jpg':'hawaii-06','13-doorway-to-lanai-lava.jpg':'hawaii-13-door','12-lanai-sofa-lava-view.jpg':'hawaii-12-lanai','17-mango-tree-over-lava.jpg':'hawaii-17-mango'}
sess=ort.InferenceSession('/workspace/.models/da2s.onnx',providers=['CPUExecutionProvider'])
for src,name in JOBS.items():
    im=ImageOps.exif_transpose(Image.open(IN+src)).convert('RGB')
    W,H=im.size; s=1600/max(W,H); im2=im.resize((round(W*s),round(H*s)),Image.LANCZOS)
    im2.save(OUT+name+'.jpg',quality=80,optimize=True,progressive=True)
    im2.resize((im2.width//8,im2.height//8),Image.LANCZOS).filter(ImageFilter.GaussianBlur(2)).save(OUT+name+'-lqip.jpg',quality=45)
    if im2.width<im2.height: tw=518; th=round(im2.height/im2.width*518/14)*14
    else: th=518; tw=round(im2.width/im2.height*518/14)*14
    x=np.asarray(im2.resize((tw,th),Image.BICUBIC),dtype=np.float32)/255.
    x=((x-[0.485,0.456,0.406])/[0.229,0.224,0.225]).transpose(2,0,1)[None].astype(np.float32)
    d=sess.run(None,{'pixel_values':x})[0].squeeze()
    d=(d-d.min())/(d.max()-d.min())  # relative inverse depth, 1 = near
    dm=Image.fromarray((d*255).astype(np.uint8)).resize(im2.size,Image.BICUBIC)
    dm=dm.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.5))  # dilate near edges -> less tearing
    dm.resize((im2.width//2,im2.height//2),Image.LANCZOS).save(OUT+name+'-depth.png',optimize=True)
    print(name,src,im.size,'->',im2.size)
