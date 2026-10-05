import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".webmanifest": "application/manifest+json" };

/** Static server rooted at the repo (like GitHub Pages under a sub-path). */
export function startServer({ prefix = "/healoa-base-prototype-preview/" } = {}) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (!urlPath.startsWith(prefix)) { res.writeHead(404); res.end("not found"); return; }
    urlPath = "/" + urlPath.slice(prefix.length);
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const filePath = path.resolve(ROOT, urlPath.replace(/^\/+/, ""));
    if (!filePath.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end("forbidden"); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, base: `http://127.0.0.1:${server.address().port}${prefix}` })));
}
