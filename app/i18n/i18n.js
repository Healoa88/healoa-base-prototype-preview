/* HeaLoa · i18n loader + t(key) helper (v2026-09-27-w)
 * Locale files (app/i18n/zh.js, en.js, ja.js, es.js) register into window.HEALOA_LOCALES.
 * - zh is the default and the only complete (shipped) locale.
 * - en / ja are DRAFTS (meta.draft === true, complete: false): reachable ONLY with an explicit ?lang=en / ?lang=ja,
 *   never remembered, never listed in the public switcher; the page shows a small "draft" badge.
 * - es is an empty stub (deferred until a reviewer exists).
 * - Choice order: ?lang=<code> (complete → remembered; draft → this visit only) → remembered complete choice → zh.
 *   An unknown or unavailable ?lang falls back to zh.
 * - t(key, vars): active locale → zh → the key itself. {name} placeholders are filled from vars.
 * - content(): active locale content deep-merged over zh content (arrays replace).
 * Must load after the locale files and before app/data.js.
 */
(function (root) {
  "use strict";
  var DEFAULT = "zh";
  var ORDER = ["zh", "en", "ja", "es"]; /* planned rollout order */
  var LS_LANG = "healoa.lang.v1";
  var LOCALES = root.HEALOA_LOCALES = root.HEALOA_LOCALES || {};

  function isComplete(code) {
    var l = LOCALES[code];
    return !!(l && l.meta && l.meta.complete === true && l.strings && l.content);
  }
  function isDraft(code) {
    var l = LOCALES[code];
    return !!(l && l.meta && l.meta.draft === true && l.meta.complete !== true && l.strings && l.content);
  }
  function completeLocales() {
    var extra = Object.keys(LOCALES).filter(function (c) { return ORDER.indexOf(c) < 0; }).sort();
    return ORDER.concat(extra).filter(isComplete);
  }
  function normCode(code) { return String(code || "").trim().toLowerCase().split(/[-_]/)[0]; }
  function lsGet() { try { return root.localStorage ? root.localStorage.getItem(LS_LANG) : null; } catch (e) { return null; } }
  function lsSet(v) { try { if (root.localStorage) root.localStorage.setItem(LS_LANG, v); return true; } catch (e) { return false; } }

  function resolve() {
    var q = null;
    try { q = root.location ? new URLSearchParams(root.location.search).get("lang") : null; } catch (e) { q = null; }
    if (q !== null && q !== "") {
      var code = normCode(q);
      if (isComplete(code)) { lsSet(code); return code; }
      if (isDraft(code)) return code; /* draft preview: explicit ?lang only, not remembered */
      return DEFAULT; /* explicit but unavailable → zh */
    }
    var saved = normCode(lsGet());
    if (saved && isComplete(saved)) return saved;
    return DEFAULT;
  }

  var lang = isComplete(DEFAULT) ? resolve() : DEFAULT;
  var active = LOCALES[lang] || LOCALES[DEFAULT] || { meta: {}, strings: {}, content: {} };
  var base = LOCALES[DEFAULT] || active;

  function fill(s, vars) {
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vars, k) && vars[k] != null ? String(vars[k]) : m; });
  }
  function t(key, vars) {
    var s = active.strings && active.strings[key];
    if (s == null) s = base.strings && base.strings[key];
    if (s == null) return key;
    return fill(s, vars);
  }
  function merge(a, b) {
    if (b === undefined) return a;
    if (Array.isArray(a) || Array.isArray(b) || !a || !b || typeof a !== "object" || typeof b !== "object") return b;
    var out = {}, k;
    for (k in a) out[k] = a[k];
    for (k in b) out[k] = merge(a[k], b[k]);
    return out;
  }
  var mergedContent = lang === DEFAULT ? base.content : merge(base.content, active.content);
  function meta() { return merge(base.meta || {}, lang === DEFAULT ? undefined : active.meta); }

  /* Fill static markup: data-i18n (text), data-i18n-html (trusted locale HTML), data-i18n-attr="aria-label:key;alt:key". */
  function applyDom(doc, vars) {
    doc = doc || root.document;
    if (!doc) return;
    var m = meta();
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n]"), function (el) { el.textContent = t(el.getAttribute("data-i18n"), vars); });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n-html]"), function (el) { el.innerHTML = t(el.getAttribute("data-i18n-html"), vars); });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n-attr]"), function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var i = pair.indexOf(":");
        if (i > 0) el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim(), vars));
      });
    });
    if (doc.documentElement) doc.documentElement.lang = m.htmlLang || lang;
    doc.title = t("meta.title", vars);
    var d = doc.querySelector('meta[name="description"]');
    if (d) d.setAttribute("content", t("meta.description", vars));
  }
  function setLang(code) {
    code = normCode(code);
    if (!isComplete(code)) return false;
    return lsSet(code);
  }

  root.HEALOA_I18N = {
    DEFAULT: DEFAULT, ORDER: ORDER, LS_KEY: LS_LANG,
    lang: lang, t: t, meta: meta, content: function () { return mergedContent; },
    draft: isDraft(lang), isDraft: isDraft,
    isComplete: isComplete, completeLocales: completeLocales, applyDom: applyDom, setLang: setLang
  };
})(typeof window !== "undefined" ? window : globalThis);
