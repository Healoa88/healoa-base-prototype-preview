/* HeaLoa · 夏威夷沉浸样张 (SAMPLE). Standalone; no backend; everything stays on this device. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const REC_KEY = 'healoa.immersive.hawaii.v2', ME_KEY = 'healoa.immersive.hawaii.me', UI_KEY = 'healoa.immersive.hawaii.ui';
const CREDIT = 'Photo · Cindy Yang';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const qs = new URLSearchParams(location.search);
const toast = (m, ms = 2400) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), ms); };
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

// ---------- identity / demo clock ----------
const me = lsGet(ME_KEY, null) || (() => { const a = new Uint8Array(6); crypto.getRandomValues(a); const v = { ref: [...a].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 10), welcomed: false }; lsSet(ME_KEY, v); return v; })();
const ui = lsGet(UI_KEY, { guideSeen: false, sound: false });
let rec = lsGet(REC_KEY, null);           // the user's saved place (null = first time)
const simDays = () => (rec && rec.simDays) || 0;
const dayKey = () => HLPoints.todayKey(new Date(Date.now() + simDays() * 864e5));
const P = HLPoints.create({ dayKey });
const refIn = qs.get('ref'); const refCompanion = qs.get('c') === '1';
const isArrival = !!refIn && refIn !== me.ref && !me.welcomed;

// ---------- scenes ----------
const SCENES = {
  door:  { img: 'assets/hawaii-13-door.jpg',  dep: 'assets/hawaii-13-door-depth.png',  asp: 900 / 1600,  cx: .47, zh: '门口', warm: .55 },
  lava:  { img: 'assets/hawaii-06.jpg',       dep: 'assets/hawaii-06-depth.png',       asp: 1200 / 1600, cx: .42, zh: '熔岩小树', cut: { x: .5, y: .61, h: .15 } },
  lanai: { img: 'assets/hawaii-12-lanai.jpg', dep: 'assets/hawaii-12-lanai-depth.png', asp: 900 / 1600,  cx: .6,  zh: '露台沙发', warm: .6, cut: { x: .76, y: .735, h: .13 } },
  mango: { img: 'assets/hawaii-17-mango.jpg', dep: 'assets/hawaii-17-mango-depth.png', asp: 900 / 1600,  cx: .5,  zh: '芒果树下', warm: .6, cut: { x: .6, y: .7, h: .12 } },
};
const STAGES = [
  { zh: '嫩芽', k: 1.0, g: 0.0 }, { zh: '小树', k: 1.07, g: .3, unlock: '露台沙发' }, { zh: '开花', k: 1.12, g: .45, unlock: '小花冠' },
  { zh: '结果', k: 1.16, g: .55, unlock: '芒果树' }, { zh: '小树林', k: 1.2, g: .65, unlock: '远处的小树林' },
];
const ACCS = [
  { id: 'lei', zh: '🌺 花环', need: () => true },
  { id: 'shades', zh: '🕶️ 小墨镜', need: () => P.balance() >= 60 || me.welcomed, why: '60 积分解锁（朋友邀请可直接获得）' },
  { id: 'crown', zh: '🌼 小花冠', need: () => stage() >= 2, why: '小树开花后解锁' },
  { id: 'mango', zh: '🥭 芒果', need: () => !!(rec && rec.mango), why: '在芒果树下摘一颗' },
  { id: 'goldlei', zh: '✨ 金色花环', need: () => P.balance() >= 150, why: '150 积分解锁' },
];
const stage = () => Math.min(4, (rec && rec.careDays ? rec.careDays.length : 0));

// ---------- state ----------
const S = {
  scene: 'lava', t0: performance.now(), enterT: 0, zoomAnim: null,
  pointer: { x: 0, y: 0 }, target: { x: 0, y: 0 }, tilt: null, auto: true, drift: 1,
  cut: null, cutBase: null, isPlaceholder: false, acc: {}, pos: {},
  morning: 0, baseMorning: 0, happyT: -1e9, recording: false, placing: false, panel: null,
};
window.__S = S;

// ---------- WebGL ----------
const cv = $('#gl');
const gl = cv.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false });
const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const FS = `precision highp float;
varying vec2 v;
uniform sampler2D uImg,uDep,uCut,uSpr;
uniform vec2 uRes,uOff,uCutPos,uCen;uniform float uAsp,uZoom,uT;
uniform float uHasCut,uCutD,uCutAsp,uCutH;uniform vec4 uAnim;
uniform float uMorning,uGrowth,uSprOn,uSprK,uStage,uWarm;
const vec2 SB=vec2(.331,.3425);const vec2 BMIN=vec2(.2225,.08);const vec2 BSZ=vec2(.3008,.2625);
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
vec2 mirror(vec2 u){return 1.-abs(1.-mod(u,2.));}
float dep(vec2 u){return texture2D(uDep,mirror(u)).r;}
vec4 spr(vec2 p,vec2 B,float k,out vec2 su){vec2 src=SB+(p-B)/k;su=(src-BMIN)/BSZ;if(su.x<0.||su.y<0.||su.x>1.||su.y>1.)return vec4(0.);return texture2D(uSpr,su);}
void main(){
  float sa=uRes.x/uRes.y; vec2 sc=v-.5; sc.y=-sc.y;
  vec2 base = sa<uAsp ? vec2(sc.x*sa/uAsp, sc.y) : vec2(sc.x, sc.y*uAsp/sa);
  base = base/uZoom + uCen;
  vec2 o=uOff; float d=dep(base);
  for(int i=0;i<5;i++){ d=dep(base+o*(d-.35)); }
  vec2 uv=mirror(base+o*(d-.35));
  vec3 col=texture2D(uImg,uv).rgb;
  // ---- growth visuals (lava scene only): sapling sprite scaled around its base, blossoms, mangoes, far saplings
  if(uSprOn>.5){
    vec2 su;
    if(uStage>3.5){
      for(int j=0;j<3;j++){
        vec2 B=j==0?vec2(.6,.352):(j==1?vec2(.69,.35):vec2(.17,.349));float k=j==0?.34:(j==1?.22:.27);
        vec4 f=spr(base+o*(.1-.35),B,k,su);
        col=mix(col,mix(f.rgb*.8,vec3(.55,.42,.38),.35),f.a*.92);
      }
    }
    vec2 pm=base+o*(.3-.35);
    vec4 s=spr(pm,SB,uSprK,su);
    if(uSprK>1.001) col=mix(col,s.rgb,s.a);
    if(uStage>1.5){ // blossoms
      vec2 g=vec2(15.,17.);vec2 cell=floor(su*g);vec2 cc=(cell+.5)/g;
      float hh=h21(cell+3.1);
      if(su.x>0.&&su.x<1.&&su.y>0.&&su.y<.72&&hh>.72&&texture2D(uSpr,cc).a>.6){
        float r=length((su-cc)*BSZ*uSprK*vec2(uAsp*1.33,1.))*1600.;
        float dot1=1.-smoothstep(3.,6.,r);
        col=mix(col,mix(vec3(1.,.83,.88),vec3(1.,.97,.9),hh),dot1*.95);
      }
    }
    if(uStage>2.5){ // mangoes
      for(int j=0;j<3;j++){
        vec2 mc=j==0?vec2(.33,.44):(j==1?vec2(.63,.49):vec2(.47,.6));
        vec2 dd=(su-mc)*BSZ*uSprK*1600.*vec2(uAsp*1.33,1.);dd.y*=.78;
        float m=1.-smoothstep(10.,12.,length(dd));
        vec3 mcol=mix(vec3(1.,.72,.25),vec3(.95,.45,.2),clamp(dd.y/12.+.5,0.,1.));
        mcol+=vec3(.25)*(1.-smoothstep(0.,6.,length(dd+vec2(3.,3.))));
        col=mix(col,mcol*.9,m);
      }
    }
  }
  // ---- daytime frames (door/lanai/mango) graded toward the same golden-hour look
  if(uWarm>0.){vec3 w=col*vec3(1.07,.97,.86);w=mix(vec3(dot(w,vec3(.3,.59,.11))),w,1.08);w=pow(w,vec3(1.06));col=mix(col,w,uWarm);}
  // ---- grade: dusk -> morning
  float sky=smoothstep(.12,.0,d);
  vec3 morn=col*vec3(.96,1.02,1.08)+vec3(.035,.04,.05)*(1.-col);
  morn=mix(morn,morn*vec3(1.05,.98,1.1)+vec3(.05,.03,.06),sky*.6);
  col=mix(col,morn,uMorning);
  float gr=max(col.g-max(col.r,col.b),0.)+max(col.g-col.b,0.)*.5;
  float plant=smoothstep(.02,.1,gr)*smoothstep(.05,.2,d);
  col=mix(col,col*vec3(.92,1.18,.92),plant*uGrowth);
  // ---- haze (no fire / embers)
  float hz=fbm(uv*vec2(3.,6.)+vec2(uT*.018,uT*.006));
  float far=1.-smoothstep(.05,.55,d);
  vec3 hazeC=mix(vec3(1.,.72,.55),vec3(.85,.86,.95),uMorning);
  col=mix(col,hazeC,far*hz*.12);
  col+=hazeC*.03*(.5+.5*sin(uT*.35))*far;
  // ---- companion cutout: depth occlusion, animated (bob / tilt / hop), soft shadow, light match
  if(uHasCut>.5){
    vec2 cb=base+o*(uCutD-.35);
    vec2 q=vec2((cb.x-uCutPos.x)*uAsp/uCutH,(cb.y-uCutPos.y)/uCutH);
    vec2 sp=q/vec2(uCutAsp*.42,.055);
    float sh=exp(-dot(sp,sp)*1.3)*.6*(1.-clamp(uAnim.x*5.,0.,.6))*smoothstep(.25,.1,abs(d-uCutD));
    col*=1.-sh;
    q.y+=uAnim.x;
    float cr=cos(uAnim.y),sr=sin(uAnim.y); q=vec2(cr*q.x+sr*q.y,-sr*q.x+cr*q.y);
    q/=uAnim.zw;
    vec2 lc=vec2(q.x/uCutAsp+.5,1.+q.y);
    if(lc.x>0.&&lc.x<1.&&lc.y>0.&&lc.y<1.){
      vec4 c=texture2D(uCut,lc);
      float a=c.a*(1.-step(uCutD+.035,d));
      vec3 cc=c.rgb; float L=dot(cc,vec3(.299,.587,.114));
      vec3 warm=mix(vec3(1.,.82,.68),vec3(.97,.98,1.02),uMorning);
      cc=mix(cc,vec3(L),.2)*warm*mix(.74,.92,uMorning)*mix(1.06,.66,lc.y)+vec3(.02,.01,0.);
      float aUp=texture2D(uCut,lc+vec2(0.,-.02)).a;
      cc+=vec3(1.,.68,.42)*max(c.a-aUp,0.)*.8*(1.-uMorning*.5);
      col=mix(col,cc,a);
    }
  }
  vec2 qv=v-.5; col*=1.-dot(qv,qv)*.5;
  col+=(h21(v*uRes+fract(uT))-.5)*.016;
  gl_FragColor=vec4(col,1.);
}`;
let U = {}, cache = {}, sprTex = null, cutTex = null;
function shd(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
function initGL() {
  const pr = gl.createProgram(); gl.attachShader(pr, shd(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, shd(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const l = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  'uImg uDep uCut uSpr uRes uOff uCutPos uCen uAsp uZoom uT uHasCut uCutD uCutAsp uCutH uAnim uMorning uGrowth uSprOn uSprK uStage uWarm'.split(' ').forEach(n => U[n] = gl.getUniformLocation(pr, n));
  gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uDep, 1); gl.uniform1i(U.uCut, 2); gl.uniform1i(U.uSpr, 3);
}
function mkTex(src) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([a, b]) => gl.texParameteri(gl.TEXTURE_2D, a, b));
  return t;
}
function bindTex(unit, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); }
async function loadScene(id) {
  if (cache[id]) return cache[id];
  const sc = SCENES[id]; const [img, dimg] = await Promise.all([loadImg(sc.img), loadImg(sc.dep)]);
  gl.activeTexture(gl.TEXTURE0); const t = mkTex(img); const dt = mkTex(dimg);
  const c = document.createElement('canvas'); c.width = dimg.width; c.height = dimg.height; const x = c.getContext('2d'); x.drawImage(dimg, 0, 0);
  return (cache[id] = { t, dt, dd: x.getImageData(0, 0, c.width, c.height).data, dw: c.width, dh: c.height });
}
function depthAt(id, x, y) { const c = cache[id]; if (!c) return .5; const i = Math.min(c.dh - 1, Math.max(0, Math.round(y * (c.dh - 1)))) * c.dw + Math.min(c.dw - 1, Math.max(0, Math.round(x * (c.dw - 1)))); return c.dd[i * 4] / 255; }
function resize() { if (S.recording) return; const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); }

const AMP = 0.034;
let zoom = 1;
function centerX(id, z, w, h) { const sc = SCENES[id]; const sa = w / h; if (sa >= sc.asp) return .5; const half = .5 * sa / sc.asp / z; return Math.max(half, Math.min(1 - half, sc.cx)); }
function petAnim(t, now) {
  if (reduced) return [0, 0, 1, 1];
  const br = Math.sin(t * 2.4); let hop = 0, rot = 0.035 * Math.sin(t * .8) * (Math.sin(t * .23) > .2 ? 1 : .35), sx = 1 - .01 * br, sy = 1 + .02 * br;
  const hp = t % 5.5; if (hp < .45) { const u = hp / .45; hop = .05 * 4 * u * (1 - u); }
  const k = (now - S.happyT) / 1000;
  if (k >= 0 && k < 1.5) { const u = (k % .5) / .5; hop = Math.max(hop, .1 * 4 * u * (1 - u)); rot = .13 * Math.sin(k * 13) * (1 - k / 1.5); sy *= u < .12 ? .92 : 1.03; }
  return [hop, rot, sx, sy];
}
// draw one frame of scene `id` into the current canvas size. `f` overrides for keepsake rendering.
function draw(now, f = {}) {
  const id = f.scene || S.scene, c = cache[id]; if (!c) return;
  const t = (now - S.t0) / 1000, w = cv.width, h = cv.height;
  gl.viewport(0, 0, w, h);
  let z, cen;
  if (f.zoom != null) { z = f.zoom; } else if (S.zoomAnim) { z = S.zoomAnim.z; } else {
    const e = S.enterT ? Math.min(1, (now - S.enterT) / 6000) : 1; const ez = 1 - Math.pow(1 - e, 3);
    z = 1.02 + .05 * ez + .004 * Math.sin(t * .2);
  }
  zoom = z;
  cen = f.cen || (S.zoomAnim && id === 'door' ? S.zoomAnim.cen : [centerX(id, z, w, h), .5]);
  let tx = S.target.x, ty = S.target.y;
  if (S.tilt) { tx = S.tilt.x; ty = S.tilt.y; } else if (S.auto) { tx = Math.sin(t * .25 * S.drift) * .4; ty = Math.sin(t * .17 * S.drift) * .12; }
  S.pointer.x += (tx - S.pointer.x) * .08; S.pointer.y += (ty - S.pointer.y) * .08;
  const ox = f.ox ?? S.pointer.x, oy = f.oy ?? S.pointer.y;
  bindTex(0, c.t); bindTex(1, c.dt); if (sprTex) bindTex(3, sprTex); if (cutTex) bindTex(2, cutTex);
  gl.uniform2f(U.uRes, w, h); gl.uniform1f(U.uAsp, SCENES[id].asp); gl.uniform2f(U.uOff, ox * AMP, oy * AMP * .6);
  gl.uniform1f(U.uZoom, z); gl.uniform2f(U.uCen, cen[0], cen[1]); gl.uniform1f(U.uT, t);
  const pos = S.pos[id]; const showCut = !!(S.cut && pos && id !== 'door' && f.cut !== false);
  gl.uniform1f(U.uHasCut, showCut ? 1 : 0);
  if (showCut) {
    gl.uniform1f(U.uCutAsp, S.cut.w / S.cut.h); gl.uniform1f(U.uCutH, pos.h * S.cut.h / S.cutBase.height); gl.uniform2f(U.uCutPos, pos.x, pos.y);
    gl.uniform1f(U.uCutD, cutDepth(id)); const a = f.anim || petAnim(t, now); gl.uniform4f(U.uAnim, a[0], a[1], a[2], a[3]);
  }
  const st = stage(), m = f.morning ?? S.morning;
  gl.uniform1f(U.uMorning, id === 'door' ? Math.min(m, .3) : m); gl.uniform1f(U.uGrowth, STAGES[st].g);
  gl.uniform1f(U.uWarm, SCENES[id].warm || 0);
  gl.uniform1f(U.uSprOn, id === 'lava' && sprTex ? 1 : 0); gl.uniform1f(U.uSprK, STAGES[st].k); gl.uniform1f(U.uStage, st);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function cutDepth(id) { const p = S.pos[id]; return Math.min(.98, depthAt(id, p.x, Math.min(.995, p.y + .005)) + .01); }
function loop(now) { if (!S.recording) draw(now); requestAnimationFrame(loop); }

// ---------- input ----------
function screenToImg(px, py) {
  const r = cv.getBoundingClientRect(), sc = SCENES[S.scene], sa = r.width / r.height;
  const sx = (px - r.left) / r.width - .5, sy = (py - r.top) / r.height - .5;
  let bx, by; if (sa < sc.asp) { bx = sx * sa / sc.asp; by = sy; } else { bx = sx; by = sy * sc.asp / sa; }
  return { x: bx / zoom + centerX(S.scene, zoom, cv.width, cv.height), y: by / zoom + .5 };
}
function hitCut(px, py) {
  const pos = S.pos[S.scene]; if (!S.cut || !pos) return false; const p = screenToImg(px, py);
  const hw = pos.h * (S.cutBase.width / S.cutBase.height) / SCENES[S.scene].asp / 2;
  return p.x > pos.x - hw * 1.3 && p.x < pos.x + hw * 1.3 && p.y > pos.y - pos.h * 1.2 && p.y < pos.y + .04;
}
const ptrs = new Map(); let mode = null, grab = null, pinch0 = null, lookedAround = false;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); S.auto = false; poke();
  const pos = S.pos[S.scene];
  if (ptrs.size === 2 && S.cut && S.placing && pos) { mode = 'pinch'; const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), h: pos.h }; return; }
  if (S.cut && S.placing && hitCut(e.clientX, e.clientY)) { mode = 'move'; const p = screenToImg(e.clientX, e.clientY); grab = { dx: pos.x - p.x, dy: pos.y - p.y }; }
  else mode = 'look';
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const pos = S.pos[S.scene];
  if (mode === 'pinch' && ptrs.size >= 2) { const [a, b] = [...ptrs.values()]; pos.h = clampH(pinch0.h * Math.hypot(a.x - b.x, a.y - b.y) / pinch0.d); updDepthLbl(); return; }
  if (mode === 'move') { const p = screenToImg(e.clientX, e.clientY); pos.x = Math.min(.95, Math.max(.05, p.x + grab.dx)); pos.y = Math.min(.99, Math.max(.3, p.y + grab.dy)); updDepthLbl(); return; }
  if (mode === 'look') { const r = cv.getBoundingClientRect(); S.target.x = ((e.clientX - r.left) / r.width - .5) * 2; S.target.y = ((e.clientY - r.top) / r.height - .5) * 2; if (!lookedAround) { lookedAround = true; if (S.panel === 'p1') setHint('很好 ✿ 下一步，把 TA 放进来'); } }
});
const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2 && mode === 'pinch') mode = null; if (!ptrs.size) mode = null; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
const clampH = h => Math.min(.6, Math.max(.05, h));
$('#smaller').onclick = () => { const p = S.pos[S.scene]; p.h = clampH(p.h / 1.15); updDepthLbl(); };
$('#bigger').onclick = () => { const p = S.pos[S.scene]; p.h = clampH(p.h * 1.15); updDepthLbl(); };
function updDepthLbl() { if (!S.pos[S.scene]) return; const d = cutDepth(S.scene); $('#depthLbl').textContent = '距离：' + (d > .62 ? '近处' : d > .35 ? '中间' : '远处'); }
function onOri(e) { if (e.gamma == null) return; S.tilt = { x: Math.max(-1, Math.min(1, e.gamma / 25)), y: Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 25)) }; }
$('#tiltBtn').onclick = async () => {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { toast('没有开启倾斜，也可以用手指拖动'); return; } }
    addEventListener('deviceorientation', onOri); $('#tiltBtn').classList.add('hidden'); toast('已开启：倾斜手机看看');
  } catch (err) { toast('这台设备不支持倾斜视角，用手指拖动就好'); }
};
if ('DeviceOrientationEvent' in window && matchMedia('(pointer:coarse)').matches) $('#tiltBtn').classList.remove('hidden');

// ---------- sound (WebAudio, muted by default) ----------
let actx = null;
function chime(kind = 'soft') {
  if (!ui.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { soft: [659], happy: [523, 659, 784], big: [523, 659, 784, 1047] }[kind] || [659];
    notes.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f; const t = actx.currentTime + i * .09;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .9); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 1); });
  } catch (e) {}
}
const syncSound = () => { $('#soundBtn').textContent = ui.sound ? '🔈' : '🔇'; };
$('#soundBtn').onclick = () => { ui.sound = !ui.sound; lsSet(UI_KEY, ui); syncSound(); chime('soft'); toast(ui.sound ? '声音已开（很轻）' : '已静音'); };
syncSound();

// ---------- plumeria petal confetti ----------
const pc = $('#petals'), px = pc.getContext('2d'); let petals = [];
function confetti(n = 26) {
  if (reduced) return; const dpr = Math.min(devicePixelRatio || 1, 2); pc.width = innerWidth * dpr; pc.height = innerHeight * dpr;
  for (let i = 0; i < n; i++) petals.push({ x: Math.random() * pc.width, y: -Math.random() * pc.height * .3, r: (7 + Math.random() * 7) * dpr, vy: (1.2 + Math.random() * 1.6) * dpr, vx: (Math.random() - .5) * 1.2 * dpr, a: Math.random() * 6, va: (Math.random() - .5) * .08, life: 0, pink: Math.random() < .35 });
  if (petals.length === n) requestAnimationFrame(tickPetals);
}
function flower(x, y, r, a, pink) {
  px.save(); px.translate(x, y); px.rotate(a);
  for (let k = 0; k < 5; k++) { px.rotate(Math.PI * 2 / 5); px.beginPath(); px.ellipse(0, -r * .55, r * .34, r * .6, .35, 0, Math.PI * 2); px.fillStyle = pink ? '#ffd3dc' : '#fffaf0'; px.fill(); }
  px.beginPath(); px.arc(0, 0, r * .22, 0, Math.PI * 2); px.fillStyle = '#ffd36b'; px.fill(); px.restore();
}
function tickPetals() {
  px.clearRect(0, 0, pc.width, pc.height);
  petals.forEach(p => { p.life++; p.y += p.vy; p.x += p.vx + Math.sin(p.life * .05) * .6; p.a += p.va; px.globalAlpha = Math.max(0, 1 - p.life / 200); flower(p.x, p.y, p.r, p.a, p.pink); });
  px.globalAlpha = 1; petals = petals.filter(p => p.life < 200 && p.y < pc.height + 40);
  if (petals.length) requestAnimationFrame(tickPetals); else px.clearRect(0, 0, pc.width, pc.height);
}

// ---------- points UI ----------
function earn(ev, meta) { const r = P.earn(ev, meta); if (r.ok) { syncPts(true); toast(`+${r.points} 积分 · ${P.rules[ev].zh}`); } return r; }
function syncPts(bump) { $('#ptsVal').textContent = P.balance(); if (bump) { const c = $('#ptsChip'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } }
function shareURL() { const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('ref', me.ref); if (S.cut) u.searchParams.set('c', '1'); return u.toString(); }
function openPts() {
  $('#ptsBig').textContent = P.balance();
  $('#unlockList').innerHTML = ACCS.filter(a => a.why).map(a => `<div class="unl"><span>${a.zh}</span><span class="mini">${a.need() ? '已解锁' : a.why}</span></div>`).join('')
    + STAGES.slice(1).map((s, i) => `<div class="unl"><span>🌱 ${s.zh}：${s.unlock}</span><span class="mini">${stage() >= i + 1 ? '已解锁' : `照顾小树 ${i + 1} 天`}</span></div>`).join('');
  $('#histList').innerHTML = P.history().slice(-8).reverse().map(h => `<li><span>${P.rules[h.event]?.zh || h.event}</span><span>+${h.points} · ${h.day}</span></li>`).join('') || '<li>还没有记录</li>';
  $('#myRef').textContent = '我的邀请码 ' + me.ref;
  $('#ptsSheet').classList.remove('hidden');
}
$('#ptsChip').onclick = openPts; $('#ptsClose').onclick = () => $('#ptsSheet').classList.add('hidden');
$('#shareLinkBtn').onclick = async () => {
  const url = shareURL();
  if (navigator.share) { try { await navigator.share({ title: '夏威夷 · 火山', text: '带你的狗也来这里', url }); earn('share'); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('链接已复制'); earn('share'); } catch (e) { prompt('复制这个链接', url); }
};

// ---------- panels, hints, guide ----------
const PANELS = ['#pDoor', '#p1', '#p2', '#p3', '#hub'];
const HINTS = { pDoor: '点「推开门」走进去', p1: '试试左右拖动画面 ↔', p2: '上传照片，或先用示例狗狗', p3: '写一句话，然后生成小视频', hub: '' };
function show(id) {
  S.panel = id; PANELS.forEach(p => $(p).classList.toggle('hidden', p !== '#' + id));
  S.placing = id === 'p2' && !!S.cut;
  requestAnimationFrame(() => { const el = $('#' + id); document.documentElement.style.setProperty('--panelH', (el ? el.offsetHeight : 0) + 'px'); });
  setHint(id === 'p2' && S.cut ? '拖动 TA 换位置 · 双指缩放 · 戴个花环' : id === 'hub' ? hubHint() : HINTS[id]);
  poke();
}
function setHint(t) { const h = $('#hint'); if (!t) { h.classList.add('hidden'); return; } h.textContent = t; h.classList.remove('hidden'); h.style.animation = 'none'; void h.offsetWidth; h.style.animation = ''; requestAnimationFrame(() => { const el = S.panel && $('#' + S.panel); document.documentElement.style.setProperty('--panelH', (el ? el.offsetHeight : 0) + 'px'); }); }
let idleT = null;
function poke() { clearTimeout(idleT); $$('.btn.pulse').forEach(b => b.id !== 'doorBtn' && b.classList.remove('pulse')); idleT = setTimeout(() => {
  const primary = { p1: '#to2', p2: S.cut ? '#to3' : '#sampleBtn', p3: '#makeVideo', hub: '#waterBtn' }[S.panel]; if (primary) { $(primary).classList.add('pulse'); setHint('不知道下一步？点亮着的按钮就好'); } }, 9000); }
function openGuide() { $('#guide').classList.remove('hidden'); }
$('#helpBtn').onclick = openGuide;
$('#guideOk').onclick = () => { $('#guide').classList.add('hidden'); ui.guideSeen = true; lsSet(UI_KEY, ui); };

// ---------- landing / check-in / recommendation ----------
const Q = [
  { key: 'energy', q: '嗨，我是小海龟 Honu。今天的你，大概是？', opts: [['tired', '😮‍💨', '累'], ['ok', '🙂', '还行'], ['energetic', '✨', '有精神']] },
  { key: 'mood', q: '心情呢？', opts: [['annoyed', '😣', '烦'], ['calm', '🌊', '平静'], ['happy', '😄', '开心']] },
  { key: 'want', q: '现在更想要？', opts: [['quiet', '🤫', '安静一下'], ['breathe', '🌬️', '透口气'], ['lively', '🎉', '热闹一点']] },
];
let answers = {}, qi = 0;
function screen(name) { ['#landing', '#checkin', '#rec'].forEach(s => $(s).classList.toggle('hidden', s !== '#' + name)); }
function renderQ() {
  const dots = $$('#ciDots i'); dots.forEach((d, i) => d.classList.toggle('on', i === qi));
  if (qi >= Q.length) { $('#ciQ').textContent = '想说一句也可以，或者直接跳过。'; $('#ciOpts').innerHTML = ''; $('#ciText').classList.remove('hidden'); return; }
  const q = Q[qi]; $('#ciQ').textContent = q.q; $('#ciText').classList.add('hidden');
  $('#ciOpts').innerHTML = q.opts.map(([v, e, t]) => `<button data-v="${v}"><span>${e}</span>${t}</button>`).join('');
  $$('#ciOpts button').forEach(b => b.onclick = () => { b.classList.add('sel'); answers[q.key] = b.dataset.v; chime('soft'); setTimeout(() => { qi++; renderQ(); }, 220); });
}
function finishCheckin() {
  answers.text = $('#ciFree').value; const r = HLCheckin.recommend(answers); S.rec = r;
  S.baseMorning = r.mood.timeOfDay === 'sunrise' ? .55 : 0; S.drift = r.mood.drift; S.morning = Math.max(S.morning, S.baseMorning);
  $('#recWhy').textContent = r.why;
  const hawaiiLine = r.mood.timeOfDay === 'sunrise' ? '为你调成了清晨的光。' : '为你留着黄昏的光。';
  $('#recCard').innerHTML = r.open
    ? `<p class="k">为你选的地方</p><h2>${r.placeInfo.zh}</h2><p class="sub">${hawaiiLine}推开门就到。</p><div class="row" style="margin-top:12px"><button class="btn" id="goHawaii">去这里</button></div>`
    : `<p class="k">为你选的地方</p><h2>${r.placeInfo.zh}<span class="soon">即将开放</span></h2><p class="sub">${r.nudge}</p><div class="row" style="margin-top:12px"><button class="btn" id="goHawaii">先去夏威夷看看</button></div>`;
  screen('rec'); $('#recWhy').parentElement.querySelector('.honu').classList.add('cheer');
  $('#goHawaii').onclick = goDoor;
}
$('#startBtn').onclick = () => { if (rec && !isArrival) return returnToPlace(); if (isArrival) return goDoor(); qi = 0; answers = {}; screen('checkin'); renderQ(); };
$('#skipBtn').onclick = goDoor;
$('#ciDone').onclick = finishCheckin; $('#ciSkipText').onclick = () => { $('#ciFree').value = ''; finishCheckin(); };

// ---------- door → push open ----------
async function goDoor() {
  ['#landing', '#checkin', '#rec'].forEach(s => $(s).classList.add('hidden'));
  S.scene = 'door'; S.enterT = performance.now(); show('pDoor');
  if (!ui.guideSeen) openGuide();
  loadScene('lava');
}
$('#doorBtn').onclick = async () => {
  $('#doorBtn').classList.remove('pulse'); chime('happy'); setHint('');
  const t0 = performance.now(), D = 1500; S.zoomAnim = { z: 1, cen: [centerX('door', 1, cv.width, cv.height), .5] };
  const from = S.zoomAnim.cen.slice(), to = [.46, .44];
  await new Promise(res => { const step = now => { const u = Math.min(1, (now - t0) / D), e = u * u * (3 - 2 * u);
    S.zoomAnim.z = 1 + 2.2 * e * e; S.zoomAnim.cen = [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e];
    $('#flash').style.opacity = Math.max(0, (u - .6) / .4); if (u < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
  await loadScene('lava'); S.zoomAnim = null; S.scene = 'lava'; S.enterT = performance.now();
  setTimeout(() => { $('#flash').style.opacity = 0; }, 120);
  if (P.canEarn('first_visit')) earn('first_visit');
  $('#ptsChip').classList.remove('hidden');
  if (isArrival) { show('p2'); setHint('把你的小伙伴放进来，领见面礼'); } else show('p1');
};
$('#to2').onclick = () => show('p2');

// ---------- 放进来: cutout + accessories ----------
function trimToCanvas(img, maxH = 640) {
  const c = document.createElement('canvas'); const s = Math.min(1, 1024 / Math.max(img.width, img.height)); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height); const d = x.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 16) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0 || y1 <= y0) { x0 = 0; y0 = 0; x1 = c.width - 1; y1 = c.height - 1; }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = Math.min(1, maxH / h); const o = document.createElement('canvas'); o.width = Math.round(w * k); o.height = Math.round(h * k);
  o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height); return o;
}
// heuristic sticker anchors from the alpha mask (head = top band centroid)
function anchors(c, kind) {
  const x = c.getContext('2d'), w = c.width, h = c.height, d = x.getImageData(0, 0, w, h).data;
  const span = (y) => { let a = w, b = -1; for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 80) { if (i < a) a = i; if (i > b) b = i; } return [a, b]; };
  let sx = 0, n = 0; for (let y = 0; y < h * .25; y += 2) for (let i = 0; i < w; i += 2) if (d[(y * w + i) * 4 + 3] > 80) { sx += i; n++; }
  const hx = n ? sx / n : w / 2; const [ha, hb] = span(Math.round(h * .12)); const headW = Math.max(w * .18, Math.min(w * .6, (hb - ha) * 1.2 || w * .3));
  const tall = h > w * 1.6, pet = kind !== 'person';
  const eyeY = pet ? h * .28 : (tall ? h * .09 : h * .3);
  const neckY = pet ? h * .56 : (tall ? h * .2 : h * .62);
  return { hx, headW, eyeY, neckY, topY: 0 };
}
function drawLei(x, cx, y, W, gold) {
  const n = 9, cols = gold ? ['#ffd36b', '#ffe9a8', '#f5c04a'] : ['#ff9fb5', '#fff4e8', '#ffd36b', '#ff7f9f'];
  for (let i = 0; i < n; i++) { const u = i / (n - 1) - .5; const px_ = cx + u * W, py = y + (1 - 4 * u * u) * W * .22; const r = W * .085;
    x.save(); x.translate(px_, py); for (let k = 0; k < 5; k++) { x.rotate(Math.PI * 2 / 5); x.beginPath(); x.ellipse(0, -r * .55, r * .36, r * .6, 0, 0, Math.PI * 2); x.fillStyle = cols[i % cols.length]; x.fill(); }
    x.beginPath(); x.arc(0, 0, r * .25, 0, Math.PI * 2); x.fillStyle = gold ? '#fff' : '#ffc94d'; x.fill(); x.restore(); }
}
function drawShades(x, cx, y, W) {
  const lw = W * .38, lh = W * .26; x.save(); x.lineWidth = W * .045; x.strokeStyle = '#f2c46b';
  [-1, 1].forEach(s => { const lx = cx + s * W * .23 - lw / 2; const g = x.createLinearGradient(0, y - lh / 2, 0, y + lh / 2); g.addColorStop(0, '#3a2f5c'); g.addColorStop(1, '#e0708a'); x.fillStyle = g; x.beginPath(); x.roundRect ? x.roundRect(lx, y - lh / 2, lw, lh, lh * .45) : x.rect(lx, y - lh / 2, lw, lh); x.fill(); x.stroke(); });
  x.beginPath(); x.moveTo(cx - W * .06, y - lh * .15); x.quadraticCurveTo(cx, y - lh * .4, cx + W * .06, y - lh * .15); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.45)'; [-1, 1].forEach(s => { x.beginPath(); x.ellipse(cx + s * W * .22 - lw * .2, y - lh * .18, lw * .12, lh * .12, -.5, 0, Math.PI * 2); x.fill(); }); x.restore();
}
function drawCrown(x, cx, y, W) { for (let i = 0; i < 5; i++) { const u = i / 4 - .5; const r = W * .09; x.save(); x.translate(cx + u * W * .8, y - Math.cos(u * 2) * W * .05);
  for (let k = 0; k < 5; k++) { x.rotate(Math.PI * 2 / 5); x.beginPath(); x.ellipse(0, -r * .55, r * .36, r * .6, 0, 0, Math.PI * 2); x.fillStyle = i % 2 ? '#fff6d6' : '#ffe07a'; x.fill(); }
  x.beginPath(); x.arc(0, 0, r * .25, 0, Math.PI * 2); x.fillStyle = '#f5a623'; x.fill(); x.restore(); } }
function drawMango(x, cx, y, r) { const g = x.createLinearGradient(cx - r, y - r, cx + r, y + r); g.addColorStop(0, '#ffd34d'); g.addColorStop(.6, '#ff9a3c'); g.addColorStop(1, '#e8643a');
  x.save(); x.beginPath(); x.ellipse(cx, y, r * .82, r, .5, 0, Math.PI * 2); x.fillStyle = g; x.fill(); x.beginPath(); x.ellipse(cx + r * .5, y - r * .95, r * .45, r * .18, -.6, 0, Math.PI * 2); x.fillStyle = '#5fae5a'; x.fill();
  x.beginPath(); x.ellipse(cx - r * .25, y - r * .35, r * .18, r * .28, .5, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); x.restore(); }
function compose() {
  const b = S.cutBase; if (!b) return; const a = anchors(b, S.kind);
  const padT = Math.round(b.height * .1), padR = S.acc.mango ? Math.round(b.height * .28) : 0;
  const c = document.createElement('canvas'); c.width = b.width + padR * 2; c.height = b.height + padT; const x = c.getContext('2d');
  // keep the foot centred: shift base so its centre stays at the canvas centre when padding right
  const ox = padR; x.drawImage(b, ox, padT);
  if (S.acc.crown) drawCrown(x, ox + a.hx, padT + b.height * .03, a.headW);
  if (S.acc.lei || S.acc.goldlei) drawLei(x, ox + a.hx, padT + a.neckY, a.headW * 1.15, !!S.acc.goldlei);
  if (S.acc.shades) drawShades(x, ox + a.hx, padT + a.eyeY, a.headW * .95);
  if (S.acc.mango) drawMango(x, ox + b.width + padR * .12, c.height - padR * .4, padR * .36);
  S.cut = { canvas: c, w: c.width, h: c.height, padR };
  gl.activeTexture(gl.TEXTURE2); if (cutTex) gl.deleteTexture(cutTex); cutTex = mkTex(c);
}
function renderAccRow() {
  $('#accRow').innerHTML = ACCS.map(a => { const ok = a.need(); return `<button data-a="${a.id}" class="${S.acc[a.id] ? 'on' : ''}" ${ok ? '' : 'disabled'} title="${ok ? '' : (a.why || '')}">${a.zh}${ok ? '' : ' 🔒'}</button>`; }).join('');
  $$('#accRow button').forEach(b => b.onclick = () => { const id = b.dataset.a; S.acc[id] = !S.acc[id]; if (id === 'goldlei' && S.acc.goldlei) S.acc.lei = false; if (id === 'lei' && S.acc.lei) S.acc.goldlei = false; compose(); renderAccRow(); S.happyT = performance.now(); chime('soft'); save(); });
}
function setCutBase(c, kind) {
  S.cutBase = c; S.kind = kind; if (!S.pos[S.scene]) S.pos[S.scene] = { ...SCENES[S.scene].cut };
  if (!Object.keys(S.acc).length) S.acc = { lei: true };
  compose(); $('#placeCtl').classList.remove('hidden'); $('#p2').classList.add('placed'); S.placing = true; updDepthLbl(); renderAccRow();
  celebratePlaced();
}
function celebratePlaced() {
  S.happyT = performance.now(); chime('big'); confetti(24); setHint('TA 很开心 ✿ 拖动换位置，双指缩放');
  earn('place_companion');
  if (isArrival && !me.welcomed) { const r = P.earn('referral_welcome', { ref: refIn }); me.welcomed = true; lsSet(ME_KEY, me); syncPts(true);
    S.acc.shades = true; compose(); renderAccRow(); setTimeout(() => toast(`朋友的见面礼：小墨镜 + ${r.points || 0} 积分（演示）`, 3200), 900); }
  requestAnimationFrame(() => document.documentElement.style.setProperty('--panelH', $('#p2').offsetHeight + 'px'));
}
$('#sampleBtn').onclick = async () => {
  const img = await loadImg('assets/placeholder-dog.svg'); const c = document.createElement('canvas'); c.width = 400; c.height = 360; c.getContext('2d').drawImage(img, 0, 0, 400, 360);
  S.isPlaceholder = true; $('#p2msg').textContent = '这是示例占位狗狗（画出来的剪影，不是真实照片）。';
  S.pos[S.scene] = { ...SCENES[S.scene].cut }; setCutBase(trimToCanvas(c), 'pet');
};
$('#again').onclick = () => { $('#p2').classList.remove('placed'); S.placing = false; show('p2'); };
$('#file').onchange = async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const bmp = await loadImg(URL.createObjectURL(f)); const s = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); // re-encode: drops EXIF/GPS
  const meter = $('#meter'), bar = meter.querySelector('b'); meter.classList.remove('hidden'); $('#p2msg').textContent = '正在手机里抠图…（第一次会久一点）';
  S.isPlaceholder = false; const kind = c.height > c.width * 1.25 ? 'person' : 'pet';
  S.pos[S.scene] = { ...SCENES[S.scene].cut, h: SCENES[S.scene].cut.h * 1.3 };
  try {
    const mod = await Promise.race([import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm'), new Promise((_, r) => setTimeout(() => r(new Error('load timeout')), 20000))]);
    const rb = mod.removeBackground || mod.default; const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const out = await rb(blob, { model: 'isnet_quint8', output: { format: 'image/png' }, progress: (k, cur, tot) => { if (tot) bar.style.width = Math.round(cur / tot * 100) + '%'; } });
    setCutBase(trimToCanvas(await loadImg(URL.createObjectURL(out))), kind); $('#p2msg').textContent = '抠好了，全程在你的手机里完成。';
  } catch (err) {
    console.warn('bg removal failed', err);
    const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const x = o.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(o.width / 2, o.height / 2, Math.min(o.width, o.height) * .28, o.width / 2, o.height / 2, Math.min(o.width, o.height) * .5); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, o.width, o.height);
    setCutBase(trimToCanvas(o), kind); $('#p2msg').textContent = '这台设备上没能自动抠图，先用柔边圆形代替（照片仍然没有上传）。';
  } finally { meter.classList.add('hidden'); }
};
$('#to3').onclick = () => { S.placing = false; save(); show('p3'); };

// ---------- QR (qrcode-generator, MIT, from CDN) ----------
let qrLib = null;
function loadQR() { if (window.qrcode) return Promise.resolve(window.qrcode); if (qrLib) return qrLib;
  return (qrLib = new Promise(res => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'; s.onload = () => res(window.qrcode); s.onerror = () => res(null); document.head.appendChild(s); })); }
async function qrCanvas(text, size) {
  const q = await loadQR(); if (!q) return null; const qr = q(0, 'M'); qr.addData(text); qr.make(); const n = qr.getModuleCount(), pad = 2, cell = Math.floor(size / (n + pad * 2));
  const c = document.createElement('canvas'); c.width = c.height = cell * (n + pad * 2); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#1b120e';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) x.fillRect((k + pad) * cell, (r + pad) * cell, cell, cell); return c;
}

// ---------- keepsakes ----------
const F = '"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
function wrap(x, text, maxW) { const out = []; let cur = ''; for (const ch of text) { if (x.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out; }
function withCanvasSize(w, h, fn) { const pw = cv.width, ph = cv.height; cv.width = w; cv.height = h; const r = fn(); cv.width = pw; cv.height = ph; return r; }
const lineText = () => ($('#lineIn').value.trim() || (rec && rec.line) || '我来过这里');
function dateStr() { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; }
function creditTxt() { return CREDIT + (S.isPlaceholder ? ' · 狗狗为示例占位' : ''); }
async function makePostcard() {
  const W = 1080, H = 1620, SH = 1380; const sceneId = S.scene === 'door' ? 'lava' : S.scene;
  const sc = withCanvasSize(W, SH, () => { draw(performance.now(), { scene: sceneId, ox: 0, oy: 0, zoom: 1.0, anim: [0, 0, 1, 1] }); const c = document.createElement('canvas'); c.width = W; c.height = SH; c.getContext('2d').drawImage(cv, 0, 0); return c; });
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#17100d'; x.fillRect(0, 0, W, H); x.drawImage(sc, 0, 0);
  const g = x.createLinearGradient(0, SH - 480, 0, SH); g.addColorStop(0, 'rgba(23,16,13,0)'); g.addColorStop(1, 'rgba(23,16,13,.94)'); x.fillStyle = g; x.fillRect(0, SH - 480, W, 480);
  x.fillStyle = '#fff7ee'; x.font = '600 58px ' + F; const lines = wrap(x, lineText(), W - 160).slice(0, 3); let y = SH - 50 - (lines.length - 1) * 76; lines.forEach(l => { x.fillText(l, 80, y); y += 76; });
  x.fillStyle = 'rgba(255,207,154,.96)'; x.font = '600 36px ' + F; x.fillText('夏威夷 · 火山', 80, SH + 78);
  x.fillStyle = 'rgba(255,247,238,.62)'; x.font = '27px ' + F; x.fillText(`${dateStr()} · HeaLoa 样张`, 80, SH + 124); x.fillText(creditTxt(), 80, SH + 166);
  x.fillStyle = '#fff7ee'; x.font = '600 30px ' + F; x.fillText('带你的狗也来这里 →', 80, SH + 216);
  const q = await qrCanvas(shareURL(), 170); if (q) { x.drawImage(q, W - 80 - 170, SH + 24, 170, 170); x.fillStyle = 'rgba(255,247,238,.62)'; x.font = '21px ' + F; x.textAlign = 'center'; x.fillText('扫码，把你的它也放进来', W - 80 - 85, SH + 222); x.textAlign = 'left'; }
  return c;
}
function pickType() {
  if (typeof MediaRecorder === 'undefined') return null;
  const list = window.__preferWebm ? ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'] : ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return list.find(t => MediaRecorder.isTypeSupported(t)) || null;
}
async function makeVideo() {
  const type = pickType(); const out = document.createElement('canvas');
  if (!type || !out.captureStream) { toast('这台设备不支持录视频，先给你做明信片'); return null; }
  const W = 720, H = 1280, DUR = 7500; out.width = W; out.height = H; const x = out.getContext('2d');
  const sceneId = S.scene === 'door' ? 'lava' : S.scene; await loadScene('door'); await loadScene(sceneId);
  const q = await qrCanvas(shareURL(), 220); const line = lineText();
  $('#busy').classList.remove('hidden'); $('#busyTxt').textContent = '正在做你的小视频…（约 8 秒）';
  S.recording = true; const pw = cv.width, ph = cv.height; cv.width = W; cv.height = H;
  const stream = out.captureStream(30); const mr = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 3.5e6 }); const chunks = [];
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  const doorCx = centerX('door', 1, W, H);
  await new Promise(res => {
    const t0 = performance.now(); mr.start(250);
    const frame = now => {
      const t = now - t0, u = Math.min(1, t / DUR); $('#busyBar').style.width = Math.round(u * 100) + '%';
      if (t < 1100) { const e = t / 1100, ee = e * e * (3 - 2 * e); draw(now, { scene: 'door', zoom: 1 + 2.2 * ee * ee, cen: [doorCx + (.46 - doorCx) * ee, .5 + (.44 - .5) * ee], ox: 0, oy: 0 }); x.drawImage(cv, 0, 0);
        if (e > .6) { x.fillStyle = `rgba(255,236,205,${(e - .6) / .4})`; x.fillRect(0, 0, W, H); } }
      else { const k = t - 1100; draw(now, { scene: sceneId, zoom: 1.0 + .07 * Math.min(1, k / 4200), ox: Math.sin(k / 1100) * .7, oy: Math.sin(k / 1700) * .15 }); x.drawImage(cv, 0, 0);
        if (k < 450) { x.fillStyle = `rgba(255,236,205,${1 - k / 450})`; x.fillRect(0, 0, W, H); }
        x.fillStyle = 'rgba(255,247,238,.8)'; x.font = '500 22px ' + F; x.fillText('夏威夷 · 火山', 36, 70);
        if (t < 5300) { const a = Math.min(1, Math.max(0, (k - 700) / 700)); const g = x.createLinearGradient(0, H - 360, 0, H); g.addColorStop(0, 'rgba(20,13,11,0)'); g.addColorStop(1, `rgba(20,13,11,${.8 * a})`); x.fillStyle = g; x.fillRect(0, H - 360, W, 360);
          x.globalAlpha = a; x.fillStyle = '#fff7ee'; x.font = '600 44px ' + F; wrap(x, line, W - 96).slice(0, 3).forEach((l, i) => x.fillText(l, 48, H - 150 + i * 58)); x.globalAlpha = 1; }
        else { const a = Math.min(1, (t - 5300) / 500); x.fillStyle = `rgba(20,13,11,${.72 * a})`; x.fillRect(0, 0, W, H); x.globalAlpha = a; x.textAlign = 'center'; x.fillStyle = '#ffcf9a'; x.font = '600 30px ' + F; x.fillText('夏威夷 · 火山', W / 2, 330);
          x.fillStyle = '#fff7ee'; x.font = '600 42px ' + F; wrap(x, line, W - 120).slice(0, 2).forEach((l, i) => x.fillText(l, W / 2, 410 + i * 56));
          if (q) { x.drawImage(q, W / 2 - 120, 560, 240, 240); } x.font = '600 34px ' + F; x.fillText('带你的狗也来这里', W / 2, 870); x.fillStyle = 'rgba(255,247,238,.7)'; x.font = '24px ' + F; x.fillText('扫码，把你的它也放进来', W / 2, 912);
          x.font = '20px ' + F; x.fillText(`HeaLoa 样张 · ${creditTxt()}`, W / 2, H - 70); x.textAlign = 'left'; x.globalAlpha = 1; }
      }
      if (t < DUR) requestAnimationFrame(frame); else res();
    }; requestAnimationFrame(frame);
  });
  mr.stop(); await new Promise(r => mr.onstop = r);
  cv.width = pw; cv.height = ph; S.recording = false; $('#busy').classList.add('hidden');
  return new Blob(chunks, { type: type.split(';')[0] });
}
let lastPng = null, lastVid = null, keepMode = 'video';
function showKeep(mode) {
  keepMode = mode; const v = $('#keepVid'), im = $('#keepImg');
  if (mode === 'video' && lastVid) { v.src = URL.createObjectURL(lastVid); v.classList.remove('hidden'); im.classList.add('hidden'); $('#dlLink').href = v.src; $('#dlLink').download = lastVid.type === 'video/mp4' ? 'healoa-hawaii.mp4' : 'healoa-hawaii.webm'; $('#swapKeep').textContent = '看明信片'; }
  else { im.src = URL.createObjectURL(lastPng); im.classList.remove('hidden'); v.classList.add('hidden'); $('#dlLink').href = im.src; $('#dlLink').download = 'healoa-hawaii-postcard.png'; $('#swapKeep').textContent = lastVid ? '看小视频' : '生成小视频'; }
  $('#keep').classList.remove('hidden');
}
async function keepsakeFlow(wantVideo) {
  if (lineText() && $('#lineIn').value.trim()) { earn('leave_line'); careToday('leave_line', true); }
  save();
  const pc_ = await makePostcard(); lastPng = await new Promise(r => pc_.toBlob(r, 'image/png')); earn('make_postcard');
  if (wantVideo) { lastVid = await makeVideo(); if (lastVid) earn('make_video'); }
  $('#celeTxt').textContent = S.cut ? '做好啦 ✿ 你和 TA 的夏威夷黄昏' : '做好啦 ✿'; confetti(30); chime('big');
  showKeep(lastVid && wantVideo ? 'video' : 'png');
}
$('#makeVideo').onclick = () => keepsakeFlow(true);
$('#makeCard').onclick = () => keepsakeFlow(false);
$('#hubVideo').onclick = () => keepsakeFlow(true);
$('#swapKeep').onclick = async () => { if (keepMode === 'png' && !lastVid) { $('#keep').classList.add('hidden'); lastVid = await makeVideo(); if (lastVid) earn('make_video'); showKeep(lastVid ? 'video' : 'png'); } else showKeep(keepMode === 'video' ? 'png' : 'video'); };
$('#closeKeep').onclick = () => { $('#keep').classList.add('hidden'); openHub(); };
$('#shareBtn').onclick = async () => {
  const blob = keepMode === 'video' && lastVid ? lastVid : lastPng; if (!blob) return;
  const name = blob.type === 'image/png' ? 'healoa-hawaii-postcard.png' : blob.type === 'video/mp4' ? 'healoa-hawaii.mp4' : 'healoa-hawaii.webm';
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: '夏威夷 · 火山', text: '带你的狗也来这里 ' + shareURL() }); earn('share'); return; } catch (e) { if (e.name === 'AbortError') return; } }
  $('#dlLink').click(); earn('share'); toast('已保存到本机');
};

// ---------- 养成 (growth) hub ----------
function careToday(kind, silent) {
  rec = rec || newRec(); rec.careDays = rec.careDays || []; const d = dayKey();
  if (rec.careDays.includes(d)) { if (!silent) toast('今天已经照顾过啦，明天再来 ✿'); return false; }
  const before = stage(); rec.careDays.push(d); save(); earn('nurture', { kind });
  const after = stage(); S.happyT = performance.now();
  if (after > before) { confetti(34); chime('big'); setTimeout(() => toast(`小树长到「${STAGES[after].zh}」了！解锁：${STAGES[after].unlock}`, 3400), 700); }
  else chime('happy');
  renderHub(); return true;
}
$('#waterBtn').onclick = () => careToday('water');
$('#sitBtn').onclick = () => { careToday('sit'); S.happyT = performance.now(); };
function hubHint() { return rec && rec.careDays && rec.careDays.includes(dayKey()) ? '今天照顾过了 · 明天再来，小树会长大一点' : '今天可以浇一次水 💧'; }
function renderHub() {
  const st = stage();
  $('#hubK').textContent = rec && rec.visits > 1 ? '你上次留下的，还在这里' : '你留下的，会在这里';
  $('#hubLine').textContent = rec && rec.line ? '“' + rec.line + '”' : '（还没有留下一句话）';
  $('#stageBar').innerHTML = STAGES.map((s, i) => `<div class="${i <= st ? 'on' : ''}"><i></i>${s.zh}</div>`).join('');
  const days = rec ? Math.floor((Date.now() - rec.first) / 864e5 + simDays()) : 0;
  $('#stageTxt').textContent = `小树现在是「${STAGES[st].zh}」。` + (st < 4 ? `再照顾 1 天会变成「${STAGES[st + 1].zh}」（每天最多一次）。` : '已经长成小树林啦。') + (days >= 1 ? ` 离你第一次来已经 ${days} 天。` : '');
  const spots = [['lava', '🌱 熔岩小树', 0], ['lanai', '🛋️ 露台沙发', 1], ['mango', '🥭 芒果树', 3]];
  $('#spots').innerHTML = spots.map(([id, zh, need]) => `<button class="btn ghost sm" data-s="${id}" ${st >= need ? '' : 'disabled'}>${zh}${st >= need ? '' : ' 🔒'}${S.scene === id ? ' ·在这' : ''}</button>`).join('')
    + (S.scene === 'mango' ? `<button class="btn sm" id="pickMango">${rec && rec.mango ? '🥭 已摘到' : '🥭 摘一颗芒果'}</button>` : '');
  $$('#spots button[data-s]').forEach(b => b.onclick = () => goSpot(b.dataset.s));
  const pm = $('#pickMango'); if (pm) pm.onclick = pickMango;
  setHint(hubHint());
}
async function goSpot(id) {
  if (id === S.scene) return; await loadScene(id); S.scene = id; S.enterT = performance.now();
  if (S.cut && !S.pos[id]) S.pos[id] = { ...SCENES[id].cut };
  S.happyT = performance.now(); save(); renderHub(); $('#hub').classList.add('min'); $('#hubMore').textContent = '更多 ▾'; requestAnimationFrame(() => document.documentElement.style.setProperty('--panelH', $('#hub').offsetHeight + 'px'));
  toast(id === 'lanai' ? 'TA 在沙发上坐下了' : id === 'mango' ? '芒果树下（彩蛋）' : '回到熔岩小树');
}
function pickMango() {
  if (rec.mango) { S.acc.mango = !S.acc.mango; compose(); save(); return; }
  rec.mango = true; S.acc.mango = true; compose(); save(); earn('mango_pick'); confetti(30); chime('big'); S.happyT = performance.now();
  toast('摘到一颗芒果 🥭 已放在 TA 身边（可在装扮里取下）', 3200); renderHub();
}
function openHub() { renderHub(); show('hub'); }
$('#hubMore').onclick = () => { $('#hub').classList.toggle('min'); $('#hubMore').textContent = $('#hub').classList.contains('min') ? '更多 ▾' : '收起 ▴'; requestAnimationFrame(() => document.documentElement.style.setProperty('--panelH', $('#hub').offsetHeight + 'px')); };
$('#editBtn').onclick = () => { show('p2'); if (S.cut) { $('#p2').classList.add('placed'); $('#placeCtl').classList.remove('hidden'); S.placing = true; renderAccRow(); } };
$('#simDay').onclick = () => { rec = rec || newRec(); rec.simDays = (rec.simDays || 0) + 1; rec.visits = (rec.visits || 1) + 1; save(); applyRevisitLight(); earn('daily_return'); renderHub(); toast('（演示）已模拟到第二天'); };
$('#forget').onclick = () => { localStorage.removeItem(REC_KEY); P.reset(); rec = null; S.cut = null; S.cutBase = null; S.pos = {}; S.acc = {}; S.morning = S.baseMorning; $('#lineIn').value = ''; syncPts(); show('p1'); toast('已删除，这台手机里不再保存'); };

// ---------- persistence ----------
function newRec() { return { v: 2, first: Date.now(), visits: 1, careDays: [], simDays: 0, lastDay: dayKey() }; }
function save() {
  rec = rec || newRec(); rec.line = $('#lineIn').value.trim() || rec.line || ''; rec.pos = S.pos; rec.acc = S.acc; rec.kind = S.kind; rec.placeholder = !!S.isPlaceholder; rec.scene = S.scene === 'door' ? 'lava' : S.scene;
  rec.mood = S.rec ? S.rec.mood : rec.mood;
  if (S.cutBase) { try { const k = Math.min(1, 360 / S.cutBase.height); const c = document.createElement('canvas'); c.width = Math.round(S.cutBase.width * k); c.height = Math.round(S.cutBase.height * k); c.getContext('2d').drawImage(S.cutBase, 0, 0, c.width, c.height); rec.cut = c.toDataURL('image/png'); } catch (e) {} }
  if (!lsSet(REC_KEY, rec)) { rec.cut = null; if (lsSet(REC_KEY, rec)) toast('空间不够，照片没存下来，只存了你的话'); }
}
function applyRevisitLight() { const days = (Date.now() - rec.first) / 864e5 + simDays(); const rv = rec.visits > 1 ? Math.min(1, .35 + days / 7 * .65) : 0; S.morning = Math.max(S.baseMorning, rv); }
async function restore() {
  rec.visits = (rec.visits || 1) + 1; const d = dayKey(); const newDay = rec.lastDay !== d; rec.lastDay = d; lsSet(REC_KEY, rec);
  S.pos = rec.pos || {}; S.acc = rec.acc || {}; S.kind = rec.kind; S.isPlaceholder = rec.placeholder; $('#lineIn').value = rec.line || '';
  if (rec.mood) { S.baseMorning = rec.mood.timeOfDay === 'sunrise' ? .55 : 0; S.drift = rec.mood.drift || 1; }
  if (rec.cut) { const img = await loadImg(rec.cut); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); S.cutBase = c; compose(); }
  applyRevisitLight();
  return newDay;
}
async function returnToPlace() {
  ['#landing', '#checkin', '#rec'].forEach(s => $(s).classList.add('hidden'));
  const id = rec.scene || 'lava'; await loadScene(id); S.scene = id; S.enterT = performance.now(); $('#ptsChip').classList.remove('hidden');
  openHub(); S.happyT = performance.now() + 600;
  if (S._newDay) setTimeout(() => earn('daily_return'), 900);
}

// ---------- boot ----------
(async () => {
  try {
    if (!gl) throw new Error('WebGL 不可用');
    initGL(); resize(); addEventListener('resize', resize);
    const sp = await loadImg('assets/hawaii-06-sapling.webp').catch(() => null); if (sp) { gl.activeTexture(gl.TEXTURE3); sprTex = mkTex(sp); }
    await Promise.all([loadScene('door'), loadScene('lava')]); S.scene = 'lava'; // landing backdrop = the lava sapling
    if (rec) S._newDay = await restore();
    // landing variants
    if (isArrival) { $('#arrive').textContent = refCompanion ? '有位朋友带着 TA 的小伙伴来过这里，把链接分享给了你。把你的也放进来吧——放好后有一份见面礼：小墨镜 + 30 积分（演示）。' : '有位朋友把这里分享给了你。把你的小伙伴也放进来吧——放好后有一份见面礼（演示）。'; $('#arrive').classList.remove('hidden'); $('#startBtn').textContent = '把我的也放进来'; $('#skipBtn').classList.add('hidden'); }
    else if (refIn && refIn === me.ref) { $('#arrive').textContent = '这是你自己的分享链接（自己打开不算邀请奖励）。'; $('#arrive').classList.remove('hidden'); }
    if (rec && !isArrival) { $('#landH').innerHTML = '你上次留下的，<br>还在这里'; $('#startBtn').textContent = '回到这里'; $('#skipBtn').classList.add('hidden'); }
    syncPts(); requestAnimationFrame(loop); cv.classList.add('on'); window.__ready = performance.now();
  } catch (err) { console.error(err); toast('场景加载失败：' + err.message, 6000); window.__ready = -1; }
})();
})();
