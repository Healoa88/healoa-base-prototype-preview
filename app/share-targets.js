/* HeaLoa · per-platform share targets (v2026-09-27-v)
 * Sharing the user's own card, with no login and no backend. Order of use in the share panel:
 *   1. native share sheet first (navigator.share, with the PNG file when the device supports files);
 *   2. then one explicit button per platform below (per locale), each of which works on its own.
 * kinds:
 *   web       — opens the platform's public web share URL in a new tab ({url} / {text} / {textUrl} are URL-encoded)
 *   sms       — sms: link with the text + link in the body (Messages / iMessage)
 *   saveImage — builds the image ("card" 4:5 or "story" 9:16, 1080×1920), shows it to save + a short how-to;
 *               copyLink: also copies the link
 *   copy      — copies the link
 * Labels and how-to lines are locale strings: share.t.<id> and share.guide.<id>.
 * qr: only zh keeps the QR code (WeChat habit). en / ja / es: no QR anywhere.
 * The shared link only ever carries a random id (+ the user's own optional line, + ?lang for draft previews);
 * never the body state or feeling option.
 */
(function (root) {
  "use strict";
  root.HEALOA_SHARE = {
    byLocale: {
      zh: { qr: true, targets: ["wechat", "xiaohongshu", "weibo", "douyin", "copy"] },
      en: { qr: false, targets: ["sms", "instagram", "facebook", "whatsapp", "x", "copy"] },
      ja: { qr: false, targets: ["line", "x", "copy"] },
      es: { qr: false, targets: ["whatsapp", "facebook", "copy"] }
    },
    targets: {
      wechat: { kind: "saveImage", image: "card", copyLink: true },
      xiaohongshu: { kind: "saveImage", image: "card" },
      douyin: { kind: "saveImage", image: "story" },
      instagram: { kind: "saveImage", image: "story" },
      weibo: { kind: "web", url: "https://service.weibo.com/share/share.php?url={url}&title={text}" },
      facebook: { kind: "web", url: "https://www.facebook.com/sharer/sharer.php?u={url}" },
      whatsapp: { kind: "web", url: "https://wa.me/?text={textUrl}" },
      x: { kind: "web", url: "https://x.com/intent/post?text={text}&url={url}" },
      line: { kind: "web", url: "https://social-plugins.line.me/lineit/share?url={url}&text={text}" },
      sms: { kind: "sms", url: "sms:?&body={textUrl}" },
      copy: { kind: "copy" }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
