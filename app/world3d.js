/* HeaLoa · 3D world view (v2026-09-28-c: framing clamps; v2026-09-28-b)
 * Renders the World Labs Marble world made from Cindy's Wudang terrace photo (Gaussian splats, .spz) with
 * Spark 2.2.0 + three.js 0.186.1, both vendored under vendor/ (no CDN). Loaded only when the 3D view opens.
 * Controls: drag = look around · hold 「往前走 / 往后退」 (or W / S, ↑ / ↓) = walk a little. No zoom (v2026-09-28-c).
 * Framing (v2026-09-28-c): a world made from one portrait photo only holds up near the photo's own view, so the view is
 * clamped by where its EDGES may go (not just its centre): at most edgeYaw left / right of the photo direction, edgeDown
 * below and edgeUp above the horizon. The start view is tilted slightly up (pitch < 0) so the smeared ground stays out
 * of sight. On wide screens the horizontal field of view is fixed (hfov) and the vertical one follows from the aspect,
 * so the yaw range shrinks automatically.
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
  var D2R = Math.PI / 180;
  var FOVP = cfg.fov || 62;                                   /* vertical FOV (deg) on portrait screens */
  var HFOVW = cfg.hfovWide || 74;                             /* horizontal FOV (deg) on landscape screens */
  var EDGE_YAW = (cfg.edgeYaw != null ? cfg.edgeYaw : 60) * D2R, EDGE_DOWN = (cfg.edgeDown != null ? cfg.edgeDown : 30) * D2R, EDGE_UP = (cfg.edgeUp != null ? cfg.edgeUp : 42) * D2R;
  function vfovFor(aspect) { return aspect > 1 ? 2 * Math.atan(Math.tan(HFOVW * D2R / 2) / aspect) / D2R : FOVP; }
  var FOV0 = vfovFor(W / H);
  var camera = new THREE.PerspectiveCamera(FOV0, W / H, 0.02, 500);
  var lim = { yaw: 0, pmin: 0, pmax: 0 };
  function limits() {
    var vf = camera.fov * D2R, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    lim.yaw = Math.max(0.05, EDGE_YAW - hf / 2);
    lim.pmax = Math.max(-0.2, EDGE_DOWN - vf / 2);            /* + = looking down */
    lim.pmin = Math.min(lim.pmax, -(EDGE_UP - vf / 2));       /* - = looking up */
  }
  limits();
  var Y0 = cfg.yaw || 0;
  function cy(v) { return Math.max(Y0 - lim.yaw, Math.min(Y0 + lim.yaw, v)); }
  function cp(v) { return Math.max(lim.pmin, Math.min(lim.pmax, v)); }
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

  var P0 = cp(cfg.pitch != null ? cfg.pitch : -0.04);
  var st = { yaw: Y0, pitch: P0, tyaw: Y0, tpitch: P0, fov: FOV0, walk: 0, pos: new THREE.Vector3(0, 0, 0), alive: true, ready: false, frames: 0 };
  var maxWalk = cfg.maxWalk || 1.2; /* metres from the photo spot */

  /* pointer: 1 finger drags the view (no pinch zoom: zooming in makes the edges blurry) */
  var pts = new Map(), el = renderer.domElement;
  el.style.touchAction = "none";
  function onDown(e) { pts.set(e.pointerId, [e.clientX, e.clientY]); try { el.setPointerCapture(e.pointerId); } catch (x) {} }
  function onMove(e) {
    if (!pts.has(e.pointerId)) return;
    var p = pts.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1];
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) {
      var k = 0.0042;
      st.tyaw = cy(st.tyaw + dx * k); st.tpitch = cp(st.tpitch + dy * k);
    }
  }
  function onUp(e) { pts.delete(e.pointerId); }
  function onWheel(e) { e.preventDefault(); /* no zoom */ }
  function onKey(e) {
    var k = e.key;
    if (k === "w" || k === "W" || k === "ArrowUp") st.walk = 1;
    else if (k === "s" || k === "S" || k === "ArrowDown") st.walk = -1;
    else if (k === "ArrowLeft") st.tyaw = cy(st.tyaw + 0.08);
    else if (k === "ArrowRight") st.tyaw = cy(st.tyaw - 0.08);
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
    renderer.setSize(w, h); camera.aspect = w / h; st.fov = camera.fov = vfovFor(w / h); camera.updateProjectionMatrix();
    limits(); st.tyaw = cy(st.tyaw); st.tpitch = cp(st.tpitch);
  }
  window.addEventListener("resize", resize);
  var ro = window.ResizeObserver ? new ResizeObserver(function () { if (st && st.alive) resize(); }) : null;
  if (ro) ro.observe(host);

  var fwd = new THREE.Vector3(), last = performance.now(), t0 = last;
  renderer.setAnimationLoop(function (now) {
    if (!st.alive) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    /* idle: a very slow look-around until the first touch, so the scene reads as 3D on first sight */
    if (cfg.idleDrift !== false && !st.touched && st.ready) st.tyaw = cy(Y0 + Math.sin((now - t0) / 1000 * 0.18) * Math.min(0.18, lim.yaw * 0.6));
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
    /* look(yaw, pitch): clamped like a drag; pitch undefined = the start pitch. (fov argument ignored: no zoom) */
    look: function (yaw, pitch) { st.touched = true; st.tyaw = st.yaw = cy(yaw); st.tpitch = st.pitch = cp(pitch == null ? P0 : pitch); },
    limits: function () { return { yaw: lim.yaw, pitchMin: lim.pmin, pitchMax: lim.pmax, start: P0, fov: camera.fov }; },
    moveTo: function (z) { st.touched = true; fwd.set(-Math.sin(-st.yaw), 0, -Math.cos(-st.yaw)); st.pos.copy(fwd.multiplyScalar(Math.max(-maxWalk, Math.min(maxWalk, z)))); },
    shot: function () { renderer.render(scene, camera); return renderer.domElement.toDataURL("image/jpeg", 0.85); },
    state: function () { return { yaw: st.yaw, pitch: st.pitch, fov: camera.fov, lim: { yaw: lim.yaw, pmin: lim.pmin, pmax: lim.pmax }, pos: st.pos.toArray(), ready: st.ready, frames: st.frames, maxWalk: maxWalk, walk: st.walk }; },
    stop: function () {
      st.alive = false;
      /* Spark's sort worker may still be busy when the view closes; it then rejects with no reason. Swallow only that
       * one harmless rejection for a moment after closing (v2026-09-28-c). */
      var quiet = function (e) { if (e.reason === undefined) e.preventDefault(); };
      window.addEventListener("unhandledrejection", quiet); setTimeout(function () { window.removeEventListener("unhandledrejection", quiet); }, 5000);
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize); if (ro) ro.disconnect(); window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp);
      if (el.parentNode) el.parentNode.removeChild(el);
      /* free the GPU a little later, once Spark's in-flight sort / readback has settled (disposing mid-sort rejects) */
      setTimeout(function () {
        try { scene.remove(splat); splat.dispose && splat.dispose(); } catch (x) {}
        try { renderer.dispose(); } catch (x) {} /* no forceContextLoss: Spark rejects its pending GPU readback when the context is lost; the detached canvas is garbage-collected */
      }, 2000);
    }
  };
}
