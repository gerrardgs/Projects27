---
name: frontend-deployment
description: Deploy and operate websites and front-end apps - choosing static, server-rendered or edge hosting (GitHub Pages, Netlify, Vercel, Cloudflare Pages and Workers, Firebase Hosting, AWS Amplify or S3 with CloudFront, Azure Static Web Apps, Render and others), build output and environment variables, public versus secret configuration, caching and CDN headers, security headers and Content Security Policy, redirects and SPA fallbacks, custom domains and HTTPS, preview deployments, monitoring (real-user metrics, errors, uptime), and rollback. Use when publishing a site, setting up hosting, configuring headers, domains, caching or environment variables for a front-end, or when a deployed site behaves differently from local.
license: MIT
metadata:
  version: "1.0.0"
---

# Front-End Deployment

Front-end counterpart of [deploy-and-release](../deploy-and-release/SKILL.md), which covers containers, migrations and progressive rollouts. Deploying is outward-facing: confirm with the user before publishing ([AGENTS.md](../../../AGENTS.md) section 2). Links checked on 2026-10-15.

## 1. Choose the hosting model

| Output of the build | Host it on | Notes |
| :--- | :--- | :--- |
| Static files only (plain HTML, Astro or Eleventy static, Vite SPA, `next export`-style output) | Any static host or CDN: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Netlify](https://docs.netlify.com/), [Cloudflare Pages](https://developers.cloudflare.com/pages/) or [Workers static assets](https://developers.cloudflare.com/workers/static-assets/), [Vercel](https://vercel.com/docs), [Firebase Hosting](https://firebase.google.com/docs/hosting), [AWS Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html), [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/overview), [Render](https://render.com/docs/static-sites) | Cheapest, fastest and simplest. GitHub Pages cannot set custom response headers: a `<meta http-equiv="Content-Security-Policy">` tag covers most of CSP (not `frame-ancestors`); use another host when you need real headers |
| Server rendering, API routes, server actions, middleware | A platform with the framework's adapter (Vercel, Netlify, Cloudflare, Node.js server, container) | Use the framework's official deployment guide: [Next.js](https://nextjs.org/docs/app/getting-started/deploying), [Nuxt](https://nuxt.com/docs/getting-started/deployment), [SvelteKit adapters](https://svelte.dev/docs/kit/adapters), [Astro](https://docs.astro.build/en/guides/deploy/), [Angular](https://angular.dev/tools/cli/deployment), [Vite static](https://vite.dev/guide/static-deploy) |
| A container you control | [deploy-and-release](../deploy-and-release/SKILL.md), or [Fly.io](https://fly.io/docs/), [Railway](https://docs.railway.com/), [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/), cloud container services | Most control, most operational work |

Prefer the host the organisation already uses. Record the choice and reasons in an ADR.

## 2. Configuration and secrets

- Anything bundled into client JavaScript is public. Public build-time variables use the framework's prefix: `VITE_` ([Vite](https://vite.dev/guide/env-and-mode)), `NEXT_PUBLIC_` ([Next.js](https://nextjs.org/docs/app/guides/environment-variables)), `PUBLIC_` (SvelteKit `$env/static/public`, Astro), `NUXT_PUBLIC_` (Nuxt runtime config). Never give a secret one of these prefixes.
- Secrets (API keys with write access, database URLs, signing keys) live only in server code and in the host's encrypted environment settings, separated per environment (production, preview, development).
- Keep `.env.example` with every variable name and no real values ([06-security](../../rules/06-security.md)). Fail the build when a required variable is missing.

## 3. HTTP headers

**Security**: start from [assets/static-site security headers](../frontend-from-scratch/assets/static-site/security-headers.js), one source rendered to `_headers` (Netlify and Cloudflare Pages; Cloudflare limits: 100 rules, 2,000 characters per line, not applied to Pages Functions responses) and `vercel.json`. Its strict Content Security Policy has no inline scripts or styles; the starter site passes it in a real browser with zero console errors. Add third-party origins one directive at a time, check the policy with [CSP Evaluator](https://csp-evaluator.withgoogle.com/), and roll out a stricter policy first as `Content-Security-Policy-Report-Only`. HSTS only over HTTPS; add `preload` only after reading [hstspreload.org](https://hstspreload.org/). Reference: [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), [MDN CSP guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

**Caching** ([web.dev](https://web.dev/articles/http-cache), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)):

| Resource | `Cache-Control` |
| :--- | :--- |
| Files with a content hash in the name (`app.3f9a1c.js`) | `public, max-age=31536000, immutable` |
| HTML and other unhashed files | `no-cache` (revalidate every time) or a short `max-age` |
| Personalised or authenticated responses | `private, no-store` unless you know better |
| Service worker script | `no-cache` |

Most hosts and frameworks set sensible defaults; check the real response headers (`curl -sI https://example.com/`) after deploying.

## 4. Routing details

- Single-page apps need a fallback that serves `index.html` for client routes (host rewrite rule), and a real 404 page for unknown routes, with a 404 status.
- Set redirects for moved pages (301 for permanent). Keep trailing-slash behaviour consistent with the canonical URLs.
- Custom domain: DNS records from the host's docs, HTTPS certificate issued by the host, redirect the non-canonical hostname (`www` or apex) to the canonical one. GitHub Pages: [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## 5. Pipeline

1. CI on every pull request: [ci-frontend.yml](../ci-cd-pipeline/assets/github-actions/ci-frontend.yml) (lint, type-check, unit tests, build, Playwright end-to-end and accessibility, Lighthouse CI budgets from [lighthouserc.json](../ci-cd-pipeline/assets/lighthouse/lighthouserc.json)).
2. Preview deployment per pull request where the host supports it; protect previews (password or team login), and send `X-Robots-Tag: noindex` so they are not indexed.
3. Production deploy from the main branch only, from CI, never from a laptop. For GitHub Pages: [deploy-github-pages.yml](../ci-cd-pipeline/assets/github-actions/deploy-github-pages.yml) (official Pages actions pinned to commit SHAs).
4. Smoke test after deploy: key URLs return 200, headers present, no console errors (the [axe-check](../accessibility-audit/assets/axe-check/) script fails on console errors and accessibility violations).

## 6. Observe and roll back

- Real-user monitoring of Core Web Vitals with the `web-vitals` library or the host's analytics; error tracking for the browser (for example [Sentry for JavaScript](https://docs.sentry.io/platforms/javascript/), or [OpenTelemetry for JavaScript](https://opentelemetry.io/docs/languages/js/)) with source maps uploaded privately, not served publicly; uptime checks on key URLs.
- Analytics and error tracking that set cookies or collect personal data need consent where the law requires it ([14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md)).
- Rollback: use the host's instant rollback to a previous deployment, or redeploy the previous Git tag. Know the procedure before the first launch.

## 7. Done when

- [ ] Hosting model chosen and documented; production deploys only from CI
- [ ] No secrets in client bundles; public variables use the framework prefix; `.env.example` complete
- [ ] Security headers verified on the live site (`curl -sI`), CSP produces no console errors
- [ ] Hashed assets cached long and immutable; HTML revalidated
- [ ] 404 page, redirects, canonical domain and HTTPS working
- [ ] Previews protected and not indexed; monitoring and rollback procedure in place
