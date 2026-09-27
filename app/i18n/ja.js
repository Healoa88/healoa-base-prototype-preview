/* HeaLoa · locale stub: ja — 日本語 (Japanese). Planned order: zh → en → ja → es (this is #3).
 * Intentionally EMPTY: no machine translation. Until this file registers a complete locale,
 * app/i18n/i18n.js falls back to zh for every key (and ?lang=ja shows zh).
 *
 * To add the locale later (after a native-speaker review of every string):
 *   (function (root) {
 *     var L = root.HEALOA_LOCALES = root.HEALOA_LOCALES || {};
 *     L.ja = { meta: { code: "ja", htmlLang: "ja", name: "…", complete: true, canvasFont: "…" },
 *               strings: { … same keys as zh.js … }, content: { … same shape as zh.js … } };
 *   })(typeof window !== "undefined" ? window : globalThis);
 * Then fill the ja banned-word list in tests/wording.mjs (native review) and social accounts in app/social.js.
 */
