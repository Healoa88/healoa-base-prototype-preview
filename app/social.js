/* HeaLoa · social accounts slot (v2026-09-27-t)
 * Cindy's official accounts, per locale. The 「关注我们」 row (footer + season card) renders ONLY when the
 * active locale has at least one entry; with empty lists nothing is shown.
 *
 * Entry shape: { platform: "xiaohongshu" | "wechat" | "douyin" | "instagram" | "tiktok" | "youtube" | …,
 *                url: "https://…"  (https only; anything else is ignored),
 *                label: "text shown on the link, in that locale" }
 *
 * EMPTY ON PURPOSE: Cindy has not provided account URLs yet. Never invent or guess an account URL —
 * add entries only from URLs Cindy sends.
 */
(function (root) {
  "use strict";
  root.HEALOA_SOCIAL = {
    zh: [],
    en: [],
    ja: [],
    es: []
  };
})(typeof window !== "undefined" ? window : globalThis);
