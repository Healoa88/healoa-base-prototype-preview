# Extract the sapling (above the horizon) as an RGBA sprite, used for growth-stage visuals.
from PIL import Image, ImageFilter; import numpy as np
A='/workspace/wt-immersive/immersive-hawaii/assets/'
im=Image.open(A+'hawaii-06.jpg').convert('RGB'); a=np.asarray(im,dtype=float); L=a.mean(2)
HOR=548
sky=np.median(L[:HOR],axis=1,keepdims=True)
m=(L[:HOR] < sky*0.72).astype(np.float32)
mi=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))
m=np.asarray(mi)>0
ys,xs=np.nonzero(m)
# keep the main connected column (the tree): restrict to x range around densest column
col=m.sum(0); col[:150]=0; col[700:]=0; cx=int(np.argmax(col))
sel=np.abs(xs-cx)<230; ys,xs=ys[sel],xs[sel]
x0,x1,y0=xs.min()-6,xs.max()+6,max(0,ys.min()-6)
print('stem col',cx,'bbox',x0,y0,x1,HOR)
alpha=np.zeros(L.shape,np.uint8); alpha[:HOR][m]=255
alpha[:, :x0]=0; alpha[:, x1:]=0
al=Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8))
rgba=im.copy(); rgba.putalpha(al)
spr=rgba.crop((x0,y0,x1,HOR)); spr.save(A+'hawaii-06-sapling.png',optimize=True)
print('sprite',spr.size,'uv', x0/1200,y0/1600,x1/1200,HOR/1600, 'stem x uv',cx/1200)
