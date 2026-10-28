// Single source of truth for the HTTP security headers of this site.
// serve.js sends DEV_HEADERS locally; _headers (Netlify, Cloudflare Pages) and vercel.json must contain
// PRODUCTION_HEADERS, which security-headers.test.js checks. References:
// https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP

// No inline scripts or styles, no third-party origins. Add origins deliberately, one directive at a time.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  // Trusted Types (Baseline newly available since 2026-02): string-to-DOM sinks such as innerHTML throw unless they
  // receive a value from a reviewed policy. This page creates no policies because it never writes HTML from strings.
  "require-trusted-types-for 'script'",
  "trusted-types 'none'",
].join("; ");

/** Headers that are safe on plain-HTTP localhost as well as in production. */
export const DEV_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-Frame-Options": "DENY",
};

/** HSTS only makes sense over HTTPS; add "preload" only after reading https://hstspreload.org/. */
export const PRODUCTION_HEADERS = {
  ...DEV_HEADERS,
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};

/**
 * Renders the Netlify and Cloudflare Pages `_headers` format for every path.
 * @param {Record<string, string>} headers
 */
export function toHeadersFile(headers) {
  const lines = Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`);
  return ["# Generated from security-headers.js; keep in sync (checked by npm test).", "/*", ...lines, ""].join("\n");
}

/**
 * Renders the Vercel `vercel.json` headers configuration for every path.
 * @param {Record<string, string>} headers
 */
export function toVercelJson(headers) {
  const config = {
    $schema: "https://openapi.vercel.sh/vercel.json",
    headers: [{ source: "/(.*)", headers: Object.entries(headers).map(([key, value]) => ({ key, value })) }],
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}
