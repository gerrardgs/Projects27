---
name: web-integrations-and-platforms
description: Build front-ends on top of content and commerce platforms and third-party services - headless CMS (Sanity, Contentful, Strapi, Payload, Storyblok), WordPress block themes and blocks, Shopify themes and Hydrogen, Webflow and Framer, checkout and payment UIs (Stripe and others) with PCI scope kept small, authentication UIs and passkeys, HTML email templates, progressive web apps and offline support, technical SEO, analytics with consent, embeds and third-party scripts, maps and search. Use when integrating a CMS, store, payment provider, auth provider, email template, PWA, analytics or any third-party widget into a website or app.
license: MIT
metadata:
  version: "1.0.0"
---

# Web Integrations and Platforms

Every integration starts with [04-dependencies](../../rules/04-dependencies.md) section 9 (adopting any tool or service: need, identity, health, fit, risk, exit). Commonly used services with official links are in [docs/TOOLKIT.md](../../../docs/spec/TOOLKIT.md). To let an agent work with these services through MCP (CMS, commerce, payments, hosting), use [mcp-servers-and-integrations](../mcp-servers-and-integrations/SKILL.md). Links checked on 2026-10-15.

## 1. Content management

- **Model content, not pages**: structured types (article, author, product, call to action) with validation, required alt text on images, and fields that match the design's components. Rich text stays semantic (headings, lists, links), never free-form styling.
- **Headless CMS** ([Sanity](https://www.sanity.io/docs), [Contentful](https://www.contentful.com/developers/docs/), [Strapi](https://docs.strapi.io/), [Payload](https://payloadcms.com/docs) and others): fetch at build time or on the server; rebuild or revalidate on publish through webhooks; give editors a preview mode that is protected and not indexed; keep API tokens with write access on the server only.
- **WordPress**: block themes with `theme.json` for design tokens (colours, spacing, typography presets) ([block themes](https://developer.wordpress.org/themes/block-themes/), [global settings and styles](https://developer.wordpress.org/themes/global-settings-and-styles/)); custom blocks with the [Block Editor handbook](https://developer.wordpress.org/block-editor/); headless through the [REST API](https://developer.wordpress.org/rest-api/) or WPGraphQL. Escape output, check capabilities and nonces in PHP.
- **Site builders** ([Webflow](https://developers.webflow.com/), [Framer](https://www.framer.com/developers/)): use their components, variables and CMS collections as the design system; custom code goes in the platform's supported extension points.

## 2. Commerce, checkout and payments

- **Shopify**: Online Store themes in Liquid ([themes](https://shopify.dev/docs/storefronts/themes), [Liquid reference](https://shopify.dev/docs/api/liquid), [theme accessibility](https://shopify.dev/docs/storefronts/themes/best-practices/accessibility)) or headless with [Hydrogen](https://shopify.dev/docs/storefronts/headless/hydrogen).
- **Checkout UX**: guest checkout, few fields with correct `autocomplete` tokens, clear totals including tax and shipping before the last step, errors next to fields, no surprise costs ([Baymard checkout research](https://baymard.com/research/checkout-usability); deceptive patterns are forbidden by [14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md)).
- **Payments**: never let card data touch your servers or your own form fields. Use the provider's hosted fields or hosted checkout (for example [Stripe Elements](https://docs.stripe.com/payments/elements)), which keeps PCI DSS scope small ([Stripe security guide](https://docs.stripe.com/security/guide), [PCI Security Standards Council](https://www.pcisecuritystandards.org/)). Prices, discounts and totals are computed on the server, never trusted from the client.

## 3. Authentication UI

- Use an established provider or library (see the toolkit); do not build password storage or OAuth flows yourself ([06-security](../../rules/06-security.md)).
- Login and sign-up forms: `autocomplete="username"`, `"current-password"`, `"new-password"`, `"one-time-code"` ([MDN autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)); allow paste and password managers (WCAG 3.3.8); show-password toggle; offer passkeys ([passkeys.dev](https://passkeys.dev/)).
- Error messages do not reveal whether an account exists; rate limiting and lockout happen on the server.

## 4. HTML email

- Email clients are not browsers: table-based layout, inline CSS, a maximum width around 600 px, web-safe font fallbacks, images with `alt` text and explicit width and height, and a plain-text part. Check support per client on [Can I email](https://www.caniemail.com/).
- Use a framework that compiles to robust HTML: [MJML](https://mjml.io/documentation/), React Email or Maizzle. Test dark mode ([Litmus dark mode guide](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers)) and real clients before sending.
- Accessibility still applies: `lang`, semantic headings, sufficient contrast, real text rather than text in images, descriptive link text.

## 5. Progressive web apps and offline

- Web app manifest, icons, HTTPS and a service worker make a site installable ([web.dev Learn PWA](https://web.dev/learn/pwa), [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)).
- Use a maintained library such as [Workbox](https://developer.chrome.com/docs/workbox) or the framework's PWA plugin for caching strategies; version caches, and serve the service worker with `Cache-Control: no-cache` so updates arrive.
- Design the offline state and the update prompt like any other state ([09-design-principles](../../rules/09-design-principles.md) section 4).

## 6. Technical SEO

- Content that must rank is in the server-rendered or static HTML; JavaScript-only content is at risk ([Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)).
- Unique titles and descriptions, canonical URLs, `hreflang` for translations, structured data ([intro](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)), `sitemap.xml`, `robots.txt`, real 404 status codes, and fast Core Web Vitals.
- Documentation sites may also publish an [`llms.txt`](https://llmstxt.org/): a community proposal, not a standard, for a Markdown index that points language models to the key pages. It complements, never replaces, accessible HTML and a sitemap.

## 7. Third-party scripts, embeds and consent

- Every script runs with full page privileges: load it only when needed, after consent where required, with `async` or `defer`, from the vendor's official URL, with Subresource Integrity where the vendor publishes stable files, and allowed explicitly in the CSP.
- Heavy embeds (video players, chat widgets, maps) use a lightweight placeholder that loads the real embed on interaction ([Lighthouse: third-party facades](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades)).
- Analytics and advertising tags respect consent; with Google tags, use consent mode ([Google consent guide](https://developers.google.com/tag-platform/security/guides/consent)). The consent banner itself must be accessible and honest ([14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md) section 5).

## 8. Done when

- [ ] Each integration passed rule 04 section 9; keys with write access live only on the server
- [ ] Content models carry the fields the design needs, including required alt text
- [ ] Card data never touches project code; totals computed on the server
- [ ] Email tested in real clients and dark mode; PWA updates and offline state tested
- [ ] Third-party scripts loaded after consent where required, allowed in the CSP, and measured for performance cost
