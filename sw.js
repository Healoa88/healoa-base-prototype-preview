/* HeaLoa · service worker (v2026-10-05-f, queue 4 · PWA).
 * Lives next to index.html, so its scope is that folder — on GitHub Pages /healoa-base-prototype-preview/ — and it never
 * sees anything outside the app. Registered from index.html after the page has loaded (does not slow the first paint).
 *
 * What it keeps on the phone so the first screen opens with no network:
 *   SHELL  — index.html + the exact ?v= CSS / JS / locale files index.html loads, the manifests and icons.
 *   PHOTOS — the first-session poster and the two season home photos (precached), plus every place / practice photo
 *            the person has already looked at (cache-first, trimmed to PHOTO_MAX).
 * Never cached here (too big or streamed with Range requests): videos (.mp4), the SONO bed (.mp3), the 3D world (.spz)
 * and the 3D libraries in vendor/three-*, vendor/spark-* — those stay on-demand exactly as in v2026-10-05-d.
 * Navigations are network-first (a new version shows up as soon as there is signal), falling back to the cached page.
 * When you bump the version: change VERSION and the ?v= URLs below to match index.html (tests/pwa.mjs checks this). */
"use strict";
var VERSION = "v2026-10-05-f";
var SHELL = "healoa-shell-" + VERSION;
var PHOTOS = "healoa-photos-" + VERSION;
var PHOTO_MAX = 80;

var SHELL_URLS = [
  "./",
  "app/app.css?v=2026-10-05-f",
  "app/i18n/zh.js?v=2026-10-05-f",
  "app/i18n/en.js?v=2026-10-05-f",
  "app/i18n/ja.js?v=2026-10-05-f",
  "app/i18n/es.js?v=2026-10-05-f",
  "app/i18n/i18n.js?v=2026-10-05-f",
  "app/social.js?v=2026-10-01-a",
  "app/share-targets.js?v=2026-10-01-a",
  "app/data.js?v=2026-10-05-f",
  "app/rules.js?v=2026-10-01-a",
  "app/kb.js?v=2026-10-01-a",
  "app/match.js?v=2026-10-01-a",
  "app/app.js?v=2026-10-05-f",
  "manifest.webmanifest",
  "manifest.en.webmanifest",
  "assets/icons/favicon.svg",
  "assets/icons/favicon-32.png",
  "assets/icons/icon-192.png",
  "assets/icons/apple-touch-icon.png"
];
/* First screen + key photos: the first-session poster and the autumn / winter home photos at the two widths phones pick. */
var KEY_PHOTOS = [
  "assets/practices/09-plaza-form-wfull.webp",
  "assets/places/wudang/02-terrace-sunrise-w828.webp",
  "assets/places/wudang/02-terrace-sunrise-wfull.webp",
  "assets/places/harbin/01-night-snow-roofs-w828.webp",
  "assets/places/harbin/01-night-snow-roofs-wfull.webp"
];

var SCOPE = self.registration ? self.registration.scope : new URL("./", self.location.href).href;
function abs(u) { return new URL(u, SCOPE).href; }
var INDEX = abs("./");

self.addEventListener("install", function (e) {
  e.waitUntil(Promise.all([
    caches.open(SHELL).then(function (c) { return c.addAll(SHELL_URLS.map(abs)); }),
    /* photos are a bonus: one failing must not stop the app from installing */
    caches.open(PHOTOS).then(function (c) { return Promise.all(KEY_PHOTOS.map(function (u) { return c.add(abs(u)).catch(function () {}); })); })
  ]).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("healoa-") === 0 && k !== SHELL && k !== PHOTOS; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function isSkipped(url, req) {
  if (req.headers.has("range")) return true;
  if (/\.(mp4|webm|mov|mp3|m4a|wav|spz|ply|glb)$/i.test(url.pathname)) return true;
  if (/\/vendor\/(three|spark)-/.test(url.pathname)) return true;
  return false;
}
function isPhoto(url) { return /\/assets\/.+\.(webp|jpe?g|png|svg)$/i.test(url.pathname); }
function isIndex(url) {
  var p = url.origin + url.pathname;
  return p === INDEX || p === INDEX + "index.html";
}

function trim(cache) {
  return cache.keys().then(function (keys) {
    if (keys.length <= PHOTO_MAX) return;
    return Promise.all(keys.slice(0, keys.length - PHOTO_MAX).map(function (k) { return cache.delete(k); }));
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin || req.url.indexOf(SCOPE) !== 0) return;
  if (isSkipped(url, req)) return;

  /* Page loads: network first, cached page when offline (also for ?lang=en / ?s=… share links). */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok && isIndex(url)) {
        var copy = res.clone();
        caches.open(SHELL).then(function (c) { c.put(INDEX, copy); });
      }
      return res;
    }).catch(function () {
      return caches.open(SHELL).then(function (c) {
        return (isIndex(url) ? c.match(INDEX) : c.match(req, { ignoreSearch: true })).then(function (hit) {
          return hit || c.match(INDEX);
        });
      });
    }));
    return;
  }

  /* Photos: cache first; anything the person has seen opens offline next time. */
  if (isPhoto(url)) {
    e.respondWith(caches.open(PHOTOS).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return caches.match(req).then(function (any) {
          if (any) return any;
          return fetch(req).then(function (res) {
            if (res.ok && res.type === "basic") { c.put(req, res.clone()).then(function () { return trim(c); }); }
            return res;
          });
        });
      });
    }));
    return;
  }

  /* Versioned CSS / JS (?v=…), manifests, icons: cache first, then network (and keep a copy). */
  e.respondWith(caches.open(SHELL).then(function (c) {
    return c.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok && res.type === "basic" && url.search) c.put(req, res.clone());
        return res;
      });
    });
  }));
});
