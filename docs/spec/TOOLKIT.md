# Tools and Technology Catalog

The tools, frameworks, libraries, platforms and services that designers and front-end teams commonly use, by phase from the first sketch to production. Each entry links to its **official** site or documentation. Links were checked with `node scripts/check-links.mjs` on 2026-10-15 (media rows on 2026-10-18).

**No catalog can list every tool, and this one does not try to.** The spec works with any tool, framework or service, listed or not, through one procedure: [rule 04 section 9, "Adopting any tool"](../../.agents/rules/04-dependencies.md#9-adopting-any-tool-framework-service-or-platform). Inclusion here is not an endorsement; choose by the project's needs, existing stack, licence, cost, accessibility, privacy and maintenance health. Versions, prices and plans are deliberately left out where they change often: check the official page or `npm view <package> version` (dated versions for the main front-end packages are in [frameworks.md](../../.agents/skills/framework-frontend-engineering/references/frameworks.md)).

Related pages: [design tools](../../.agents/skills/ui-design-and-prototyping/references/design-tools.md), [Figma platform](../../.agents/skills/figma-integration/references/figma-platform.md), [reference library](DESIGN-REFERENCES.md), [toolchains and VS Code extensions](../../.agents/skills/project-bootstrap/references/toolchains.md).

## 1. Discover and research

| Category | Tools |
| :--- | :--- |
| Whiteboards | [FigJam](https://www.figma.com/figjam/), [Miro](https://miro.com/), [Mural](https://www.mural.co/), [tldraw](https://www.tldraw.com/), [Excalidraw](https://excalidraw.com/) |
| Research and testing | [Maze](https://maze.co/), [Lyssna](https://www.lyssna.com/), [UserTesting](https://www.usertesting.com/), [Lookback](https://www.lookback.com/), [Optimal Workshop](https://www.optimalworkshop.com/), [Dovetail](https://dovetail.com/) |
| Surveys | [Google Forms](https://workspace.google.com/products/forms/), [Typeform](https://www.typeform.com/), [Tally](https://tally.so/), [Qualtrics](https://www.qualtrics.com/) |
| Product analytics and insight | [Google Analytics](https://marketingplatform.google.com/about/analytics/), [PostHog](https://posthog.com/), [Amplitude](https://amplitude.com/), [Mixpanel](https://mixpanel.com/), [Microsoft Clarity](https://clarity.microsoft.com/), [Hotjar](https://www.hotjar.com/) |

## 2. Design, prototype and create

| Category | Tools |
| :--- | :--- |
| Interface design | [Figma](https://www.figma.com/), [Penpot](https://penpot.app/), [Sketch](https://www.sketch.com/), [Framer](https://www.framer.com/), [Lunacy](https://icons8.com/lunacy) |
| Prototyping | [ProtoPie](https://www.protopie.io/), [Origami Studio](https://origami.design/), Figma and Framer prototypes |
| Graphic, photo, layout | [Adobe Creative Cloud](https://www.adobe.com/creativecloud.html), [Affinity](https://www.affinity.studio/), [Canva](https://www.canva.com/), [Inkscape](https://inkscape.org/), [GIMP](https://www.gimp.org/), [Krita](https://krita.org/), [Photopea](https://www.photopea.com/), [Procreate](https://procreate.com/), [Scribus](https://www.scribus.net/) |
| Motion and 3D | [Rive](https://rive.app/), [LottieFiles](https://lottiefiles.com/), [Jitter](https://jitter.video/), [Spline](https://spline.design/), [Blender](https://www.blender.org/), [Adobe After Effects](https://www.adobe.com/products/aftereffects.html) |
| Video editing | [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve), Adobe Premiere Pro, [Final Cut Pro](https://www.apple.com/final-cut-pro/), [Avid Media Composer](https://www.avid.com/media-composer), [CapCut](https://www.capcut.com/), [Descript](https://www.descript.com/), [Kdenlive](https://kdenlive.org/), [Shotcut](https://shotcut.org/), [OpenShot](https://www.openshot.org/); see [video-editing-and-post-production](../../.agents/skills/video-editing-and-post-production/references/delivery-and-standards.md) section 7 |
| Colour grading and management | DaVinci Resolve, [Baselight](https://www.filmlight.ltd.uk/products/baselight/overview_bl.php), [OpenColorIO](https://opencolorio.org/), [ACES](https://docs.acescentral.com/), [Calman](https://www.portrait.com/), [ColourSpace](https://www.lightillusion.com/colourspace.html) |
| Photo, RAW and retouching | Adobe Lightroom and Photoshop, [Capture One](https://www.captureone.com/), [darktable](https://www.darktable.org/), [Pixelmator Pro](https://www.pixelmator.com/pro/), [ExifTool](https://exiftool.org/), [sharp](https://sharp.pixelplumbing.com/), [Squoosh](https://squoosh.app/) |
| Motion graphics | [Cavalry](https://cavalry.scenegroup.co/), [Apple Motion](https://www.apple.com/final-cut-pro/motion/), [Cinema 4D](https://www.maxon.net/en/cinema-4d), [Houdini](https://www.sidefx.com/), [Toon Boom](https://www.toonboom.com/), [Synfig](https://www.synfig.org/), [Remotion](https://www.remotion.dev/) (licence terms apply), [Motion Canvas](https://motioncanvas.io/) |
| Audio, loudness, captions | [Audacity](https://www.audacityteam.org/), [REAPER](https://www.reaper.fm/), [iZotope RX](https://www.izotope.com/en/products/rx.html), [Youlean Loudness Meter](https://youlean.co/youlean-loudness-meter/), [Subtitle Edit](https://github.com/SubtitleEdit/subtitleedit), [Whisper](https://github.com/openai/whisper) (drafts only) |
| Encoding, streaming, provenance | [FFmpeg](https://ffmpeg.org/), [HandBrake](https://handbrake.fr/), [MediaInfo](https://mediaarea.net/en/MediaInfo), [Shaka Packager](https://github.com/shaka-project/shaka-packager), [hls.js](https://github.com/video-dev/hls.js), [Media Chrome](https://github.com/muxinc/media-chrome), [c2patool](https://github.com/contentauth/c2patool), [PEAT](https://trace.umd.edu/peat/) and [Harding FPA](https://www.hardingfpa.com/) (flash tests) |
| Accessibility in design | [Stark](https://www.getstark.co/), [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/), [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/) |
| Tokens and handoff | [Terrazzo](https://terrazzo.app/docs/), [Tokens Studio](https://tokens.studio/), [Zeroheight](https://zeroheight.com/), [Supernova](https://www.supernova.io/), [Knapsack](https://www.knapsack.cloud/), Figma Dev Mode and Code Connect |
| Design-to-code and AI generation (review every output) | [Claude Design](https://claude.com/product/design) ([procedure](../../.agents/skills/ai-design-and-artifacts/SKILL.md)), [Figma Make](https://www.figma.com/make/), [v0](https://v0.app/), [Bolt](https://bolt.new/), [Lovable](https://lovable.dev/), [Builder.io](https://www.builder.io/), [Anima](https://www.animaapp.com/), [Locofy](https://www.locofy.ai/), [Relume](https://www.relume.io/), [Uizard](https://uizard.io/) |
| Icons, illustrations, stock, fonts | See [reference library sections 6 and 8](DESIGN-REFERENCES.md#6-typography) |

## 3. Code editors and AI coding agents

| Category | Tools |
| :--- | :--- |
| Editors and IDEs | [Visual Studio Code](https://code.visualstudio.com/), [Cursor](https://cursor.com/), [Windsurf](https://windsurf.com/), [WebStorm](https://www.jetbrains.com/webstorm/), [Zed](https://zed.dev/), [Sublime Text](https://www.sublimetext.com/), [Nova](https://nova.app/), [Android Studio](https://developer.android.com/studio), [Xcode](https://developer.apple.com/xcode/) |
| AI coding agents that load this spec | [Claude Code](https://code.claude.com/docs), [OpenAI Codex](https://developers.openai.com/codex), [Gemini CLI](https://geminicli.com/docs/), [GitHub Copilot](https://docs.github.com/en/copilot), [Cline](https://docs.cline.bot/), [Aider](https://aider.chat/), [Google Antigravity](https://antigravity.google/) |
| Open-source agent skills and checklists | [Anthropic skills](https://github.com/anthropics/skills) (Agent Skills format, compatible with this repository), [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) |
| Agent integrations (MCP) | Figma, Penpot, Playwright and Chrome DevTools MCP servers ([details](../../.agents/skills/figma-integration/references/figma-platform.md#other-design-tool-and-browser-integrations-for-agents)), [Model Context Protocol](https://modelcontextprotocol.io/); vendor-official servers for Storybook, shadcn/ui, GitHub, Vercel, Netlify, Cloudflare, Sentry, Contentful, Sanity, Webflow, Shopify, Stripe, Supabase, Notion and Atlassian, [MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox), the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) and the [MCP Registry](https://registry.modelcontextprotocol.io/) ([verified catalog](../../.agents/skills/mcp-servers-and-integrations/references/mcp-catalog.md)) |
| Playgrounds | [CodePen](https://codepen.io/), [CodeSandbox](https://codesandbox.io/), [StackBlitz](https://stackblitz.com/), [JSFiddle](https://jsfiddle.net/) |

## 4. Runtime, packages and build

| Category | Tools |
| :--- | :--- |
| JavaScript runtimes | [Node.js](https://nodejs.org/), [Deno](https://deno.com/), [Bun](https://bun.sh/) |
| Package managers | [npm](https://docs.npmjs.com/), [pnpm](https://pnpm.io/), [Yarn](https://yarnpkg.com/) |
| Bundlers and dev servers | [Vite](https://vite.dev/), [Rolldown](https://rolldown.rs/), [Rspack](https://rspack.rs/), [webpack](https://webpack.js.org/), [esbuild](https://esbuild.github.io/), [Rollup](https://rollupjs.org/), [Parcel](https://parceljs.org/), Turbopack (built into [Next.js](https://nextjs.org/docs/app/api-reference/turbopack)) |
| Monorepos | [Turborepo](https://turborepo.com/), [Nx](https://nx.dev/), [pnpm workspaces](https://pnpm.io/workspaces) |
| Version managers | [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), [Volta](https://volta.sh/), [mise](https://mise.jdx.dev/) |

## 5. Frameworks and UI libraries

Frameworks and meta-frameworks with dated versions: [frameworks.md](../../.agents/skills/framework-frontend-engineering/references/frameworks.md).

| Category | Tools |
| :--- | :--- |
| React component libraries | [MUI](https://mui.com/), [Chakra UI](https://chakra-ui.com/), [Mantine](https://mantine.dev/), [Ant Design](https://ant.design/), [Fluent UI](https://developer.microsoft.com/en-us/fluentui), [shadcn/ui](https://ui.shadcn.com/), [Radix](https://www.radix-ui.com/), [React Aria](https://react-spectrum.adobe.com/react-aria/), [Headless UI](https://headlessui.com/), [PrimeReact](https://primereact.org/), [HeroUI](https://www.heroui.com/) |
| Vue | [Vuetify](https://vuetifyjs.com/), [Quasar](https://quasar.dev/), [PrimeVue](https://primevue.org/), [Element Plus](https://element-plus.org/), [Naive UI](https://www.naiveui.com/), [Nuxt UI](https://ui.nuxt.com/), [Reka UI](https://reka-ui.com/) |
| Svelte | [Bits UI](https://bits-ui.com/), [Skeleton](https://www.skeleton.dev/), [shadcn-svelte](https://www.shadcn-svelte.com/), [Melt UI](https://melt-ui.com/) |
| Angular | [Angular Material and CDK](https://material.angular.dev/), [PrimeNG](https://primeng.org/), [Spartan](https://spartan.ng/) |
| Framework-agnostic and Web Components | [Lit](https://lit.dev/), [Stencil](https://stenciljs.com/), [Web Awesome](https://webawesome.com/) (successor of Shoelace), [Ark UI](https://ark-ui.com/), [Ionic](https://ionicframework.com/) |
| CSS frameworks | [Tailwind CSS](https://tailwindcss.com/), [Bootstrap](https://getbootstrap.com/), [Bulma](https://bulma.io/), [Foundation](https://get.foundation/), [daisyUI](https://daisyui.com/), [Flowbite](https://flowbite.com/), [Open Props](https://open-props.style/), [Pico CSS](https://picocss.com/) |
| Styling engines | [Sass](https://sass-lang.com/), [Less](https://lesscss.org/), [PostCSS](https://postcss.org/), [Lightning CSS](https://lightningcss.dev/), [UnoCSS](https://unocss.dev/), [Panda CSS](https://panda-css.com/), [vanilla-extract](https://vanilla-extract.style/), [StyleX](https://stylexjs.com/), [Emotion](https://emotion.sh/), [styled-components](https://styled-components.com/) (its maintainer announced maintenance mode in March 2025; releases continued since, so check the current status before adopting) |

## 6. Application building blocks

| Category | Tools |
| :--- | :--- |
| Server state and data | [TanStack Query](https://tanstack.com/query/latest), [SWR](https://swr.vercel.app/), [Apollo Client](https://www.apollographql.com/docs/react/), [urql](https://nearform.com/open-source/urql/), [tRPC](https://trpc.io/) |
| Client state | [Zustand](https://zustand.docs.pmnd.rs/), [Redux Toolkit](https://redux-toolkit.js.org/), [Jotai](https://jotai.org/), [Pinia](https://pinia.vuejs.org/), [NgRx](https://ngrx.io/), [XState](https://stately.ai/docs) |
| Forms and validation | [React Hook Form](https://react-hook-form.com/), [TanStack Form](https://tanstack.com/form/latest), [Conform](https://conform.guide/), [VeeValidate](https://vee-validate.logaretm.com/), [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), [ArkType](https://arktype.io/) |
| Routing | Framework routers, [TanStack Router](https://tanstack.com/router/latest) |
| Tables and data grids | [TanStack Table](https://tanstack.com/table/latest), [AG Grid](https://www.ag-grid.com/) |
| Rich text editors | [Tiptap](https://tiptap.dev/), [Lexical](https://lexical.dev/), [ProseMirror](https://prosemirror.net/), [Quill](https://quilljs.com/), [CKEditor](https://ckeditor.com/), [Slate](https://docs.slatejs.org/) |
| Dates and time | [date-fns](https://date-fns.org/), [Day.js](https://day.js.org/), [Luxon](https://moment.github.io/luxon/), [Temporal (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) |
| Animation | [Motion](https://motion.dev/), [GSAP](https://gsap.com/), [Lenis](https://lenis.darkroom.engineering/), [Theatre.js](https://www.theatrejs.com/), [AutoAnimate](https://auto-animate.formkit.com/) |
| 3D, canvas and games | [three.js](https://threejs.org/), [React Three Fiber](https://r3f.docs.pmnd.rs/), [Babylon.js](https://www.babylonjs.com/), [PlayCanvas](https://playcanvas.com/), [PixiJS](https://pixijs.com/), [Phaser](https://phaser.io/) |
| Charts | [data-visualization-design](../../.agents/skills/data-visualization-design/SKILL.md) |
| Maps | [MapLibre GL JS](https://maplibre.org/), [Leaflet](https://leafletjs.com/), [Mapbox](https://www.mapbox.com/), [Google Maps Platform](https://developers.google.com/maps), [OpenLayers](https://openlayers.org/) |
| Search | [Algolia](https://www.algolia.com/), [Meilisearch](https://www.meilisearch.com/), [Typesense](https://typesense.org/), [Pagefind](https://pagefind.app/) (static sites) |
| Internationalisation | [FormatJS](https://formatjs.github.io/), [i18next](https://www.i18next.com/), [next-intl](https://next-intl.dev/), [vue-i18n](https://vue-i18n.intlify.dev/), [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), [Lingui](https://lingui.dev/); translation platforms [Crowdin](https://crowdin.com/), [Lokalise](https://lokalise.com/), [Phrase](https://phrase.com/) |

## 7. Content, commerce and services

Procedures: [web-integrations-and-platforms](../../.agents/skills/web-integrations-and-platforms/SKILL.md).

| Category | Tools |
| :--- | :--- |
| Headless CMS | [Sanity](https://www.sanity.io/), [Contentful](https://www.contentful.com/), [Strapi](https://strapi.io/), [Payload](https://payloadcms.com/), [Storyblok](https://www.storyblok.com/), [Directus](https://directus.io/), [Hygraph](https://hygraph.com/), [Prismic](https://prismic.io/), [Decap CMS](https://decapcms.org/), [TinaCMS](https://tina.io/), [Keystatic](https://keystatic.com/) |
| Traditional CMS and site builders | [WordPress](https://developer.wordpress.org/), [Drupal](https://www.drupal.org/docs), [Ghost](https://ghost.org/docs/), [Webflow](https://webflow.com/), [Framer](https://www.framer.com/), [Wix Studio](https://www.wix.com/studio), [Squarespace](https://www.squarespace.com/) |
| E-commerce | [Shopify (themes, Hydrogen)](https://shopify.dev/), [WooCommerce](https://developer.woocommerce.com/docs/), [BigCommerce](https://developer.bigcommerce.com/), [Medusa](https://medusajs.com/), [Saleor](https://saleor.io/), [commercetools](https://docs.commercetools.com/) |
| Authentication | [Auth.js](https://authjs.dev/), [Better Auth](https://www.better-auth.com/), [Clerk](https://clerk.com/), [Auth0](https://auth0.com/docs), [Supabase Auth](https://supabase.com/docs/guides/auth), [Firebase Authentication](https://firebase.google.com/docs/auth), [Keycloak](https://www.keycloak.org/), passkeys ([passkeys.dev](https://passkeys.dev/)) |
| Backends for front-end teams | [Supabase](https://supabase.com/), [Firebase](https://firebase.google.com/), [Convex](https://www.convex.dev/), [Appwrite](https://appwrite.io/), [PocketBase](https://pocketbase.io/) |
| Payments | [Stripe](https://docs.stripe.com/), [PayPal](https://developer.paypal.com/), [Adyen](https://docs.adyen.com/), [Paddle](https://developer.paddle.com/), [Lemon Squeezy](https://docs.lemonsqueezy.com/) |
| Email | [MJML](https://mjml.io/), [React Email](https://react.email/), [Maizzle](https://maizzle.com/), [Can I email](https://www.caniemail.com/); sending: [Resend](https://resend.com/), [Postmark](https://postmarkapp.com/), [SendGrid](https://sendgrid.com/), [Amazon SES](https://aws.amazon.com/ses/) |
| Media and images | [Cloudinary](https://cloudinary.com/), [imgix](https://www.imgix.com/), [ImageKit](https://imagekit.io/), [Cloudflare Images](https://developers.cloudflare.com/images/), [Mux](https://www.mux.com/) (video) |
| Feature flags and experiments | [OpenFeature](https://openfeature.dev/) (standard), [LaunchDarkly](https://launchdarkly.com/), [GrowthBook](https://www.growthbook.io/), [Statsig](https://www.statsig.com/), [Unleash](https://www.getunleash.io/) |
| Privacy-friendly analytics and consent | [Plausible](https://plausible.io/), [Fathom](https://usefathom.com/), [Umami](https://umami.is/), [Matomo](https://matomo.org/); consent management: [Klaro](https://klaro.org/) (open source), [Cookiebot](https://www.cookiebot.com/), [OneTrust](https://www.onetrust.com/) |

## 8. Quality: test, audit, monitor

| Category | Tools |
| :--- | :--- |
| Unit, component, end-to-end, visual | [frontend-testing-and-visual-qa tooling](../../.agents/skills/frontend-testing-and-visual-qa/references/tooling.md); also [Cypress](https://docs.cypress.io/), [WebdriverIO](https://webdriver.io/) |
| Accessibility | [laws and tools](../../.agents/skills/accessibility-audit/references/laws-and-tools.md) |
| Performance | [web performance tools](../../.agents/skills/web-performance-optimization/references/tools.md); [Polypane](https://polypane.app/) and [Responsively App](https://responsively.app/) for multi-viewport browsing |
| Error and session monitoring | [Sentry](https://sentry.io/), [Datadog RUM](https://docs.datadoghq.com/real_user_monitoring/), [New Relic Browser](https://docs.newrelic.com/docs/browser/), [LogRocket](https://logrocket.com/), [OpenTelemetry](https://opentelemetry.io/) |
| Security | [OWASP ZAP](https://www.zaproxy.org/), [Snyk](https://snyk.io/), [Socket](https://socket.dev/), [OSV-Scanner](https://google.github.io/osv-scanner/), [CSP Evaluator](https://csp-evaluator.withgoogle.com/), [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory) |
| Code quality | [SonarQube](https://www.sonarsource.com/products/sonarqube/), [knip](https://knip.dev/), [Biome](https://biomejs.dev/), [ESLint](https://eslint.org/), [Stylelint](https://stylelint.io/) |

## 9. Ship and collaborate

| Category | Tools |
| :--- | :--- |
| Hosting and deployment | [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md) |
| CI/CD | [GitHub Actions](https://docs.github.com/en/actions), [GitLab CI/CD](https://docs.gitlab.com/ci/), [CircleCI](https://circleci.com/docs/), [Bitbucket Pipelines](https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/) |
| Version control | [Git](https://git-scm.com/doc), [GitHub](https://docs.github.com/), [GitLab](https://docs.gitlab.com/), [Bitbucket](https://support.atlassian.com/bitbucket-cloud/) |
| Planning and docs | [Linear](https://linear.app/), [Jira](https://www.atlassian.com/software/jira), [Notion](https://www.notion.com/), [Confluence](https://www.atlassian.com/software/confluence), [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects) |
| Async communication | [Slack](https://slack.com/), [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams/), [Loom](https://www.loom.com/) |

## 10. Browser extensions for designers and front-end developers

Install only from the official browser store pages linked by the publisher; extensions can read every page you visit.

| Extension | Publisher site |
| :--- | :--- |
| axe DevTools | [Deque](https://www.deque.com/axe/devtools/) |
| WAVE | [WebAIM](https://wave.webaim.org/extension/) |
| Accessibility Insights for Web | [Microsoft](https://accessibilityinsights.io/docs/web/overview/) |
| React Developer Tools | [react.dev](https://react.dev/learn/react-developer-tools) |
| Vue DevTools | [devtools.vuejs.org](https://devtools.vuejs.org/) |
| Angular DevTools | [angular.dev](https://angular.dev/tools/devtools) |
| Lighthouse | Built into Chrome DevTools ([docs](https://developer.chrome.com/docs/lighthouse/overview)) |
| Wappalyzer (identify a site's stack) | [wappalyzer.com](https://www.wappalyzer.com/) |
| Web Developer toolbar | [chrispederick.com](https://chrispederick.com/work/web-developer/) |
| Figma for VS Code (editor, not browser) | [Marketplace](https://marketplace.visualstudio.com/items?itemName=figma.figma-vscode-extension) |
