/* HeaLoa · 3D world view (v2026-09-28-b)
 * Renders the World Labs Marble world made from Cindy's Wudang terrace photo (Gaussian splats, .spz) with
 * Spark 2.2.0 + three.js 0.186.1, both vendored under vendor/ (no CDN). Loaded only when the 3D view opens.
 * Controls: drag = look around · pinch / scroll = zoom · hold 「向前 / 向后」 (or W / S, ↑ / ↓) = walk a little.
 * The camera starts where the photo was taken; walking is clamped to a small radius because a world made from one
 * photo only holds up near that spot. Any failure → the caller falls back to the 2.5D photo view. */
import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

export function start(host, cfg, cb) {
  cb = cb || {};
  var W = host.clientWidth || 390, H = host.clientHeight || 700;
  var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: !!cfg.keepFrame, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(cfg.maxDpr || 1.5, window.devicePixelRatio || 1));
  renderer.setSize(W, H);
  renderer.domElement.id = "imm3dCanvas";
  renderer.domElement.className = "imm3d-canvas";
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(cfg.sky || "#c9b79a");
  var FOV0 = cfg.fov || 62;
  var camera = new THREE.PerspectiveCamera(FOV0, W / H, 0.02, 500);
  camera.rotation.order = "YXZ";
  var spark = new SparkRenderer({ renderer: renderer });
  scene.add(spark);

  /* Marble SPZ is in the OpenCV frame (y down, z forward): rotate 180° about X for three.js, then scale raw units to
   * metres with semantics_metadata.metric_scale_factor so walking distances are real-world sized. */
  var s = cfg.scale || 1;
  var splat = new SplatMesh({
    url: cfg.spz,
    onProgress: function (e) { if (cb.progress && e && e.total) cb.progress(Math.min(1, e.loaded / e.total)); }
  });
  splat.quaternion.set(1, 0, 0, 0);
  splat.scale.setScalar(s);
  scene.add(splat);

  var st = { yaw: cfg.yaw || 0, pitch: cfg.pitch || 0, tyaw: cfg.yaw || 0, tpitch: cfg.pitch || 0, fov: FOV0, walk: 0, pos: new THREE.Vector3(0, 0, 0), alive: true, ready: false, frames: 0 };
  var maxWalk = cfg.maxWalk || 1.2; /* metres from the photo spot */
  var MAXP = 1.1, MINFOV = 30, MAXFOV = 85;

  /* pointer: 1 finger drags the view, 2 fingers pinch-zoom */
  var pts = new Map(), pinch0 = 0, fov0 = FOV0, el = renderer.domElement;
  el.style.touchAction = "none";
  function onDown(e) { pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { pinch0 = dist(); fov0 = st.fov; } try { el.setPointerCapture(e.pointerId); } catch (x) {} }
  function onMove(e) {
    if (!pts.has(e.pointerId)) return;
    var p = pts.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1];
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) {
      var k = (st.fov / FOV0) * 0.0042;
      st.tyaw += dx * k; st.tpitch = Math.max(-MAXP, Math.min(MAXP, st.tpitch + dy * k));
    } else if (pts.size === 2 && pinch0) {
      st.fov = Math.max(MINFOV, Math.min(MAXFOV, fov0 * pinch0 / Math.max(10, dist())));
    }
  }
  function onUp(e) { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; }
  function dist() { var a = Array.from(pts.values()); return Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); }
  function onWheel(e) { e.preventDefault(); st.fov = Math.max(MINFOV, Math.min(MAXFOV, st.fov * (1 + Math.sign(e.deltaY) * 0.08))); }
  function onKey(e) {
    var k = e.key;
    if (k === "w" || k === "W" || k === "ArrowUp") st.walk = 1;
    else if (k === "s" || k === "S" || k === "ArrowDown") st.walk = -1;
    else if (k === "ArrowLeft") st.tyaw += 0.08;
    else if (k === "ArrowRight") st.tyaw -= 0.08;
    else return;
    e.preventDefault();
  }
  function onKeyUp(e) { if (/^(w|W|s|S|ArrowUp|ArrowDown)$/.test(e.key)) st.walk = 0; }
  el.addEventListener("pointerdown", onDown); el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp); el.addEventListener("pointercancel", onUp);
  el.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKeyUp);

  function resize() {
    var w = host.clientWidth || W, h = host.clientHeight || H;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  var fwd = new THREE.Vector3(), last = performance.now(), t0 = last;
  renderer.setAnimationLoop(function (now) {
    if (!st.alive) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    /* idle: a very slow look-around until the first touch, so the scene reads as 3D on first sight */
    if (cfg.idleDrift !== false && !st.touched && st.ready) st.tyaw = (cfg.yaw || 0) + Math.sin((now - t0) / 1000 * 0.18) * 0.18;
    st.yaw += (st.tyaw - st.yaw) * 0.18; st.pitch += (st.tpitch - st.pitch) * 0.18;
    camera.rotation.x = -st.pitch; camera.rotation.y = -st.yaw;
    if (Math.abs(camera.fov - st.fov) > 0.01) { camera.fov += (st.fov - camera.fov) * 0.2; camera.updateProjectionMatrix(); }
    if (st.walk) {
      fwd.set(-Math.sin(-st.yaw), 0, -Math.cos(-st.yaw));
      st.pos.addScaledVector(fwd, st.walk * dt * (cfg.walkSpeed || 0.6));
      if (st.pos.length() > maxWalk) st.pos.setLength(maxWalk);
    }
    camera.position.copy(st.pos);
    renderer.render(scene, camera);
    if (st.ready && ++st.frames === 3 && cb.ready) cb.ready();
  });

  splat.initialized.then(function () { st.ready = true; if (cb.progress) cb.progress(1); }, function (err) { if (cb.error) cb.error(err || new Error("splat load failed")); });
  ["pointerdown", "wheel", "keydown"].forEach(function (n) { (n === "keydown" ? window : el).addEventListener(n, function () { st.touched = true; }, { once: true }); });

  return {
    walk: function (dir) { st.touched = true; st.walk = dir; },
    look: function (yaw, pitch, fov) { st.touched = true; st.tyaw = st.yaw = yaw; st.tpitch = st.pitch = pitch || 0; if (fov) st.fov = fov; },
    moveTo: function (z) { st.touched = true; fwd.set(-Math.sin(-st.yaw), 0, -Math.cos(-st.yaw)); st.pos.copy(fwd.multiplyScalar(Math.max(-maxWalk, Math.min(maxWalk, z)))); },
    shot: function () { renderer.render(scene, camera); return renderer.domElement.toDataURL("image/jpeg", 0.85); },
    state: function () { return { yaw: st.yaw, pitch: st.pitch, fov: st.fov, pos: st.pos.toArray(), ready: st.ready, frames: st.frames, maxWalk: maxWalk, walk: st.walk }; },
    stop: function () {
      st.alive = false;
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize); window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp);
      try { scene.remove(splat); splat.dispose && splat.dispose(); } catch (x) {}
      try { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } catch (x) {}
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  };
}
