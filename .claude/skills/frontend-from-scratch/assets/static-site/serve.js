// Minimal static file server for local development only (module scripts do not load from file:// URLs).
// Usage: node serve.js            serves this folder on http://localhost:8080
//        PORT=3000 node serve.js
// For production, use a real static host or CDN with HTTPS, caching and security headers.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEV_HEADERS } from "./security-headers.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/** @type {Readonly<Record<string, string>>} */
export const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

/**
 * Maps a URL path to a file inside `root`, or returns null when it would escape `root`
 * or points at something that must not be served (dotfiles, node_modules).
 * @param {string} root
 * @param {string} urlPath
 * @returns {string | null}
 */
export function resolveRequestPath(root, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  } catch {
    return null; // malformed percent-encoding
  }
  if (decoded.includes("\0")) return null;
  const relative = decoded.endsWith("/") ? `${decoded}index.html` : decoded;
  const resolved = path.resolve(root, `.${path.posix.normalize(`/${relative}`)}`);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  const segments = path.relative(root, resolved).split(path.sep);
  if (segments.some((segment) => segment.startsWith(".") || segment === "node_modules")) return null;
  return resolved;
}

export function createServer(root = ROOT) {
  return http.createServer(async (request, response) => {
    /** @param {number} status @param {string} body */
    const send = (status, body) => {
      response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
      response.end(body);
    };
    if (request.method !== "GET" && request.method !== "HEAD") return send(405, "Method Not Allowed");
    const filePath = resolveRequestPath(root, request.url ?? "/");
    if (filePath === null) return send(404, "Not Found");
    try {
      const info = await stat(filePath);
      if (!info.isFile()) return send(404, "Not Found");
      response.writeHead(200, {
        "content-type": CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
        "content-length": info.size,
        "cache-control": "no-store",
        // Same policy as production (minus HSTS), so CSP violations show up during development.
        ...DEV_HEADERS,
      });
      if (request.method === "HEAD") return response.end();
      createReadStream(filePath).pipe(response);
    } catch {
      send(404, "Not Found");
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8080);
  createServer().listen(port, "127.0.0.1", () => {
    console.log(`Serving ${ROOT} at http://localhost:${port}/`);
  });
}
