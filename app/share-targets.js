/* HeaLoa · share targets (v2026-09-27-y)
 * Sharing the user's own card, with no login and no backend. The share panel offers, in order:
 *   1. 发给一个人… / Share… — the phone's own share sheet (navigator.share, with the 9:16 PNG when files are supported),
 *      which reaches Instagram, TikTok, WeChat, Messages … whatever the person has installed;
 *   2. 存图片 (9:16, 1080×1920 PNG) and 存视频 (≈6 s 9:16 clip, where the browser can record);
 *   3. the few extra buttons below (per locale), each of which works on its own.
 * Cindy 2026-09-27: platform buttons that only saved an image and said "now open the app" (WeChat, 小红书, 抖音,
 * Instagram) or that need a login page (Weibo, Facebook) are gone — the system share covers them for real.
 * kinds:
 *   web  — opens the platform's public web share URL in a new tab ({url} / {text} / {textUrl} are URL-encoded)
 *   sms  — sms: link with the text + link in the body (Messages / iMessage)
 *   copy — copies the link
 * Labels are locale strings share.t.<id>, and how-to lines share.guide.<id> (not needed for copy).
 * qr: only zh keeps the QR code (scan with the phone camera). en / ja / es: no QR anywhere.
 * The shared link only ever carries a random id (+ the user's own optional line, + ?lang for draft previews);
 * never the body state or feeling option.
 */
(function (root) {
  "use strict";
  root.HEALOA_SHARE = {
    byLocale: {
      zh: { qr: true, targets: ["copy"] },
      en: { qr: false, targets: ["sms", "copy"] },
      ja: { qr: false, targets: ["line", "x", "copy"] },
      es: { qr: false, targets: ["whatsapp", "copy"] }
    },
    targets: {
      whatsapp: { kind: "web", url: "https://wa.me/?text={textUrl}" },
      x: { kind: "web", url: "https://x.com/intent/post?text={text}&url={url}" },
      line: { kind: "web", url: "https://social-plugins.line.me/lineit/share?url={url}&text={text}" },
      sms: { kind: "sms", url: "sms:?&body={textUrl}" },
      copy: { kind: "copy" }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
