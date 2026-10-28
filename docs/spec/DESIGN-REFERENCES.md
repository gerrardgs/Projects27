# Design and Front-End Reference Library

A curated, link-checked library of the sources that matter for UI/UX design, digital graphic design and front-end development. Agents should prefer the **primary sources** (standards, official documentation) in each section and use the rest for learning and inspiration. Skill-specific references live next to each skill in `.agents/skills/*/references/`.

All links were checked with `node scripts/check-links.mjs` on 2026-10-15. Some sites block automated checks (they answer 401, 403 or 429 to scripts) but work in a browser; the checker reports those as warnings. Vendor products, plans and prices change: confirm on the vendor's site before relying on them.

## Contents

1. [Standards and specifications](#1-standards-and-specifications)
2. [Accessibility](#2-accessibility)
3. [UX research, strategy and content](#3-ux-research-strategy-and-content)
4. [UI design and platform guidelines](#4-ui-design-and-platform-guidelines)
5. [Design systems](#5-design-systems)
6. [Typography](#6-typography)
7. [Colour](#7-colour)
8. [Icons, illustration and imagery](#8-icons-illustration-and-imagery)
9. [Graphic design, branding and print](#9-graphic-design-branding-and-print)
10. [Motion and interaction](#10-motion-and-interaction)
11. [Data visualisation](#11-data-visualisation)
12. [Design tools](#12-design-tools)
13. [AI in design and front-end workflows](#13-ai-in-design-and-front-end-workflows)
14. [HTML, CSS and JavaScript](#14-html-css-and-javascript)
15. [Frameworks and build tools](#15-frameworks-and-build-tools)
16. [Browser support and the web platform](#16-browser-support-and-the-web-platform)
17. [Testing and quality](#17-testing-and-quality)
18. [Performance](#18-performance)
19. [Front-end security and privacy](#19-front-end-security-and-privacy)
20. [SEO, metadata, PWA and email](#20-seo-metadata-pwa-and-email)
21. [Internationalisation](#21-internationalisation)
22. [Ethics, deceptive patterns and law](#22-ethics-deceptive-patterns-and-law)
23. [Learning: courses and curricula](#23-learning-courses-and-curricula)
24. [Books](#24-books)
25. [Blogs, newsletters, podcasts and communities](#25-blogs-newsletters-podcasts-and-communities)
26. [Inspiration and pattern galleries](#26-inspiration-and-pattern-galleries)
27. [Photo, video, colour and motion production](#27-photo-video-colour-and-motion-production)

## 1. Standards and specifications

| Source | What |
| :--- | :--- |
| [HTML Living Standard (WHATWG)](https://html.spec.whatwg.org/) | The HTML specification |
| [DOM Living Standard](https://dom.spec.whatwg.org/) | The DOM |
| [Fetch Standard](https://fetch.spec.whatwg.org/) | `fetch`, CORS |
| [URL Standard](https://url.spec.whatwg.org/) | URL parsing |
| [ECMAScript specification (TC39)](https://tc39.es/ecma262/) | JavaScript |
| [TC39 proposals](https://github.com/tc39/proposals) | Upcoming JavaScript features and their stages |
| [W3C CSS current work](https://www.w3.org/Style/CSS/current-work) | Every CSS module and its status |
| [CSS Snapshot](https://www.w3.org/TR/css-2024/) | What counts as "CSS" at a point in time |
| [CSS Working Group drafts](https://drafts.csswg.org/) | Editor's drafts |
| [SVG 2](https://www.w3.org/TR/SVG2/) | Scalable Vector Graphics |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Web Content Accessibility Guidelines (Recommendation) |
| [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) | Accessible Rich Internet Applications |
| [ARIA in HTML](https://www.w3.org/TR/html-aria/) | Which ARIA is allowed on which HTML element |
| [Design Tokens Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) | DTCG token format, first stable version |
| [Design Tokens Resolver Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/) | Themes, modes and brands for DTCG tokens (`version` is `2025.10`) |
| [Unicode Standard](https://www.unicode.org/standard/standard.html) and [CLDR](https://cldr.unicode.org/) | Characters, emoji, locale data |
| [OpenType specification (Microsoft)](https://learn.microsoft.com/en-us/typography/opentype/spec/) | Font format |
| [WOFF 2.0](https://www.w3.org/TR/WOFF2/) | Web font format |
| [Web App Manifest](https://www.w3.org/TR/appmanifest/) | Installable web apps |
| [Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/) | User preference queries |
| [ISO 9241-210](https://www.iso.org/standard/77520.html) | Human-centred design for interactive systems |
| [ISO 9241-11](https://www.iso.org/standard/63500.html) | Usability: definitions and concepts |

## 2. Accessibility

| Source | What |
| :--- | :--- |
| [W3C Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/) | Home of WCAG and guidance |
| [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/) | Filterable checklist with techniques |
| [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/) | Intent and examples per success criterion |
| [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) | The nine new criteria |
| [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) | Accessible widget patterns |
| [WAI tutorials](https://www.w3.org/WAI/tutorials/) | Images, forms, tables, menus, carousels, page structure |
| [Easy Checks](https://www.w3.org/WAI/test-evaluate/preliminary/) | First accessibility review |
| [WCAG-EM](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/) | Evaluation methodology |
| [Accessibility statement generator](https://www.w3.org/WAI/planning/statements/generator/) | W3C tool |
| [WCAG 3.0 Working Draft](https://www.w3.org/TR/wcag-3.0/) | Future guidelines (draft) |
| [Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/) | W3C guidance beyond WCAG for cognitive accessibility |
| [Overlay Fact Sheet](https://overlayfactsheet.com/) | Why accessibility overlays do not make sites conform; see also the [FTC order against accessiBe](https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-approves-final-order-requiring-accessibe-pay-1-million) (April 2025) |
| [WebAIM](https://webaim.org/) | Articles, contrast checker, WAVE, surveys |
| [WebAIM Million](https://webaim.org/projects/million/) | Annual accessibility audit of top home pages |
| [The A11Y Project](https://www.a11yproject.com/) | Checklist, patterns, resources |
| [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) | Developer guides |
| [web.dev Learn Accessibility](https://web.dev/learn/accessibility) | Course |
| [Inclusive Components](https://inclusive-components.design/) | Accessible component walkthroughs |
| [Deque University](https://dequeuniversity.com/) | Courses and axe rule docs |
| [axe-core](https://github.com/dequelabs/axe-core) | Testing engine |
| [Accessibility Insights](https://accessibilityinsights.io/) | Microsoft testing tools |
| [Microsoft Inclusive Design](https://inclusive.microsoft.design/) | Inclusive design toolkit |
| [GOV.UK accessibility blog](https://accessibility.blog.gov.uk/) | Practice from UK government |
| [Section508.gov](https://www.section508.gov/) | US federal accessibility |
| [ADA.gov web guidance](https://www.ada.gov/resources/web-guidance/) | US Department of Justice |
| [European Accessibility Act (EUR-Lex)](https://eur-lex.europa.eu/eli/dir/2019/882/oj) | EU directive text |
| [ETSI EN 301 549 deliverables](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/) | EU harmonised standard |
| [IAAP](https://www.accessibilityassociation.org/) | Professional certification |
| [Adrian Roselli](https://adrianroselli.com/), [Sara Soueidan](https://www.sarasoueidan.com/), [Scott O'Hara](https://www.scottohara.me/), [TetraLogical](https://tetralogical.com/blog/), [Manuel Matuzović](https://www.matuzo.at/blog) | Expert blogs |

## 3. UX research, strategy and content

| Source | What |
| :--- | :--- |
| [Nielsen Norman Group articles](https://www.nngroup.com/articles/) | Research-based UX guidance |
| [10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | Heuristic evaluation |
| [Laws of UX](https://lawsofux.com/) | Psychology principles for design |
| [Baymard Institute](https://baymard.com/research) | E-commerce UX research |
| [Interaction Design Foundation literature](https://www.interaction-design.org/literature) | Encyclopedia and articles |
| [Design Council: Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/) | Design process model |
| [IDEO U: design thinking](https://www.ideou.com/blogs/inspiration/what-is-design-thinking) | Design thinking |
| [GOV.UK Service Manual](https://www.gov.uk/service-manual) | Research, design and delivery practice |
| [GOV.UK content design guide](https://www.gov.uk/guidance/content-design) | Writing for the web |
| [18F Methods source](https://github.com/18F/methods) | Method cards |
| [Usability.gov (archive)](https://www.usability.gov/) | Methods and templates |
| [UX Collective](https://uxdesign.cc/) | Community articles |
| [Smashing Magazine UX](https://www.smashingmagazine.com/category/ux-design) | Articles |
| [Content Design London](https://contentdesign.london/) | Content design resources |
| [Mailchimp Content Style Guide](https://styleguide.mailchimp.com/) | Voice and tone example |
| [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/) | UI text conventions |
| [Google developer documentation style guide](https://developers.google.com/style) | Technical writing |
| [Plain Language guidelines (US)](https://www.plainlanguage.gov/guidelines/) | Plain language |
| [ResearchOps Community](https://researchops.community/) | Research operations |
| [Pew Research: questionnaire design](https://www.pewresearch.org/our-methods/u-s-surveys/writing-survey-questions/) | Survey writing |

## 4. UI design and platform guidelines

| Source | What |
| :--- | :--- |
| [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) | iOS, iPadOS, macOS, watchOS, visionOS |
| [Apple design resources](https://developer.apple.com/design/resources/) | UI kits, templates, SF fonts |
| [Material Design 3](https://m3.material.io/) | Android and web; [Material 3 Expressive](https://m3.material.io/blog/building-with-m3-expressive) (2025) |
| [Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass) | Apple's 2025 design language and materials |
| [Android: design and plan](https://developer.android.com/design) | Android UI |
| [Fluent 2](https://fluent2.microsoft.design/) | Microsoft |
| [Windows app design](https://learn.microsoft.com/en-us/windows/apps/design/) | Windows |
| [GNOME Human Interface Guidelines](https://developer.gnome.org/hig/) | Linux desktop |
| [Meta Horizon OS design](https://developers.meta.com/horizon/design/) | XR |
| [Refactoring UI](https://www.refactoringui.com/) | Practical UI design (book) |
| [Practical UI (Adham Dannaway)](https://www.practical-ui.com/) | UI rules with rationale (book) |
| [UI Patterns](https://ui-patterns.com/) | Pattern library |
| [Component Gallery](https://component.gallery/) | Components across design systems |
| [Every Layout](https://every-layout.dev/) | Intrinsic layout primitives |
| [Smart Interface Design Patterns (Vitaly Friedman)](https://smart-interface-design-patterns.com/) | Patterns and checklists |
| [Checklist Design](https://www.checklist.design/) | UI checklists per page and component |

## 5. Design systems

| Source | What |
| :--- | :--- |
| [designsystems.com (Figma)](https://www.designsystems.com/) | Articles |
| [Atomic Design (Brad Frost)](https://atomicdesign.bradfrost.com/) | Free book |
| [Design Systems Repo](https://designsystemsrepo.com/) | Collection |
| [Adele (UXPin)](https://adele.uxpin.com/) | Design systems repository |
| [Design Tokens Community Group](https://www.designtokens.org/) | Token standard |
| [Style Dictionary](https://styledictionary.com/) | Token build system |
| [Tokens Studio](https://docs.tokens.studio/) | Figma token plugin |
| [Storybook](https://storybook.js.org/docs) | Component workshop |
| [Carbon](https://carbondesignsystem.com/), [Primer](https://primer.style/), [Polaris](https://shopify.dev/docs/api/polaris), [Atlassian](https://atlassian.design/), [Spectrum](https://spectrum.adobe.com/), [Lightning](https://www.lightningdesignsystem.com/), [Base Web](https://baseweb.design/), [Gestalt](https://gestalt.pinterest.systems/), [Elastic UI](https://eui.elastic.co/) | Company design systems |
| [GOV.UK Design System](https://design-system.service.gov.uk/), [U.S. Web Design System](https://designsystem.digital.gov/) | Government design systems |
| [Radix](https://www.radix-ui.com/), [React Aria](https://react-spectrum.adobe.com/react-aria/), [Headless UI](https://headlessui.com/), [Ark UI](https://ark-ui.com/), [shadcn/ui](https://ui.shadcn.com/), [Bits UI](https://bits-ui.com/) | Headless and copy-in component libraries |
| [Open UI](https://open-ui.org/) | W3C Community Group standardising UI controls |
| [Terrazzo](https://terrazzo.app/docs/) | DTCG-native token tool with Resolver Module support |

## 6. Typography

| Source | What |
| :--- | :--- |
| [Google Fonts](https://fonts.google.com/) and [Knowledge](https://fonts.google.com/knowledge) | Open fonts and type education |
| [Fontsource](https://fontsource.org/) | Self-hosting packages for open fonts |
| [Adobe Fonts](https://fonts.adobe.com/) | Subscription fonts |
| [Fontshare](https://www.fontshare.com/) | Free fonts (ITF licence) |
| [SIL Open Font License](https://openfontlicense.org/) | Licence text and FAQ |
| [Butterick's Practical Typography](https://practicaltypography.com/) | Typography for everyday writing |
| [Typewolf](https://www.typewolf.com/) | Type in use, pairing |
| [Fonts In Use](https://fontsinuse.com/) | Typography archive |
| [Typescale](https://typescale.com/) | Type scale generator |
| [Utopia](https://utopia.fyi/) | Fluid type and space |
| [Variable fonts (v-fonts)](https://v-fonts.com/) | Variable font catalogue |
| [MDN: variable fonts guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide) | Using variable fonts |
| [Modern Font Stacks](https://modernfontstacks.com/) | System font stacks |
| [Wakamai Fondue](https://wakamaifondue.com/) | Inspect a font's features |
| [Microsoft typography](https://learn.microsoft.com/en-us/typography/) | OpenType documentation |
| [I Love Typography](https://ilovetypography.com/) | Type articles |

## 7. Colour

| Source | What |
| :--- | :--- |
| [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | WCAG contrast |
| [OKLCH colour picker](https://oklch.com/) | Perceptual colour |
| [Adobe Color](https://color.adobe.com/) | Harmonies, accessibility tools |
| [Leonardo](https://leonardocolor.io/) | Contrast-based palettes |
| [Huetone](https://huetone.ardov.me/) | Accessible palettes in LCH/OKLCH |
| [Radix Colors](https://www.radix-ui.com/colors) | Scales with defined roles |
| [Tailwind CSS colours](https://tailwindcss.com/docs/colors) | Palette reference |
| [Coolors](https://coolors.co/) | Palette generator |
| [ColorBrewer](https://colorbrewer2.org/) | Map and chart palettes |
| [APCA](https://www.apcacontrast.com/) | Candidate contrast method for WCAG 3 |
| [Color.js](https://colorjs.io/) and [culori](https://culorijs.org/) | Colour libraries |
| [MDN: color values](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value) | CSS colour syntax |
| [Interaction of Color (Josef Albers)](https://interactionofcolor.com/) | Classic colour education |
| [Pantone](https://www.pantone.com/) | Spot colours |
| [International Color Consortium](https://www.color.org/) | Colour management |

## 8. Icons, illustration and imagery

| Source | Licence summary (verify) |
| :--- | :--- |
| [Material Symbols](https://fonts.google.com/icons) | Apache 2.0 |
| [Lucide](https://lucide.dev/) | ISC |
| [Heroicons](https://heroicons.com/) | MIT |
| [Phosphor](https://phosphoricons.com/) | MIT |
| [Tabler Icons](https://tabler.io/icons) | MIT |
| [Iconoir](https://iconoir.com/) | MIT |
| [Remix Icon](https://remixicon.com/) | Remix Icon License |
| [Font Awesome](https://fontawesome.com/) | Free set mixed licences; Pro commercial |
| [SF Symbols](https://developer.apple.com/sf-symbols/) | Apple platforms only |
| [Iconify](https://icon-sets.iconify.design/) | Search across open icon sets; licence per set |
| [The Noun Project](https://thenounproject.com/) | Attribution or paid |
| [unDraw](https://undraw.co/) | Own licence |
| [Open Peeps](https://www.openpeeps.com/) | CC0 |
| [Unsplash](https://unsplash.com/), [Pexels](https://www.pexels.com/), [Pixabay](https://pixabay.com/) | Own licences |
| [Openverse](https://openverse.org/), [Wikimedia Commons](https://commons.wikimedia.org/) | Openly licensed media |
| [Adobe Stock](https://stock.adobe.com/), [Getty Images](https://www.gettyimages.com/), [Shutterstock](https://www.shutterstock.com/) | Commercial stock |
| [Creative Commons licences](https://creativecommons.org/licenses/) | What each CC licence allows |
| [Squoosh](https://squoosh.app/), [SVGO](https://svgo.dev/), [SVGOMG](https://jakearchibald.github.io/svgomg/) | Image and SVG optimisation |

## 9. Graphic design, branding and print

| Source | What |
| :--- | :--- |
| [AIGA](https://www.aiga.org/) and [Eye on Design](https://eyeondesign.aiga.org/) | Professional association, articles |
| [D&AD](https://www.dandad.org/) | Awards and education |
| [ico-D](https://www.theicod.org/) | International Council of Design |
| [Brand New (UnderConsideration)](https://www.underconsideration.com/brandnew/) | Identity redesign reviews |
| [Standards Manual](https://standardsmanual.com/) | Archive of brand standards manuals |
| [Brandingstyleguides.com](https://brandingstyleguides.com/) | Brand guideline examples |
| [Logobook](http://www.logobook.com/) | Logo archive |
| [Adobe Help Center](https://helpx.adobe.com/support.html) | Photoshop, Illustrator, InDesign documentation |
| [Adobe colour settings](https://helpx.adobe.com/photoshop/using/color-settings.html) | Colour management in Adobe apps |
| [PDF Association: PDF/X](https://pdfa.org/resource/pdfx/) | Print PDF standards |
| [FOGRA](https://fogra.org/en/) | European print standards |
| [Idealliance (G7, GRACoL)](https://idealliance.org/) | US print standards |
| [Meta Ads Guide](https://www.facebook.com/business/ads-guide), [LinkedIn ads specifications](https://business.linkedin.com/marketing-solutions/success/ads-guide), [Pinterest product specs](https://help.pinterest.com/en/business/article/pinterest-product-specs), [Google Ads image requirements](https://support.google.com/google-ads/answer/7031480) | Official ad and social specifications |
| [IAB New Ad Portfolio](https://www.iab.com/guidelines/iab-new-ad-portfolio/) | Standard ad units |
| [App Store screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/), [Google Play graphic assets](https://support.google.com/googleplay/android-developer/answer/9866151) | Store artwork |
| [Canva Design School](https://www.canva.com/designschool/) | Graphic design basics |
| [Coursera: Graphic Design Specialization (CalArts)](https://www.coursera.org/specializations/graphic-design) | Course |

## 10. Motion and interaction

| Source | What |
| :--- | :--- |
| [Material Design 3: motion](https://m3.material.io/styles/motion/overview) | Motion system |
| [Apple HIG: motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Apple guidance |
| [Fluent 2: motion](https://fluent2.microsoft.design/motion) | Microsoft guidance |
| [MDN: CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations) and [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) | Platform animation |
| [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | Page and state transitions |
| [Chrome for Developers: view transitions](https://developer.chrome.com/docs/web-platform/view-transitions) | Guides and demos |
| [Scroll-driven animations](https://scroll-driven-animations.style/) | Demos and tools (Bramus) |
| [Motion](https://motion.dev/) | Animation library for JS, React, Vue |
| [GSAP](https://gsap.com/docs/v3/) | Animation platform (free since 2025) |
| [Lottie](https://airbnb.io/lottie/) and [LottieFiles](https://lottiefiles.com/) | Vector animation |
| [Rive](https://rive.app/docs/) | Interactive animation with state machines |
| [cubic-bezier.com](https://cubic-bezier.com/) | Easing editor |
| [easings.net](https://easings.net/) | Easing reference |
| [Val Head: designing interface animation](https://valhead.com/) | Motion design for UI |
| [web.dev: animations](https://web.dev/articles/animations-guide) | Performance of animations |

## 11. Data visualisation

| Source | What |
| :--- | :--- |
| [FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary) | Chart choice by question |
| [Data Viz Project](https://datavizproject.com/) | Chart catalogue |
| [From Data to Viz](https://www.data-to-viz.com/) | Decision tree |
| [Datawrapper Academy](https://academy.datawrapper.de/) and [blog](https://www.datawrapper.de/blog) | Practical guidance |
| [Fundamentals of Data Visualization (Claus Wilke)](https://clauswilke.com/dataviz/) | Free book |
| [Storytelling with Data](https://www.storytellingwithdata.com/) | Communication with data |
| [Edward Tufte](https://www.edwardtufte.com/) | Information design |
| [Information is Beautiful](https://informationisbeautiful.net/) | Examples |
| [Chartability](https://chartability.github.io/POUR-CAF/) | Accessibility heuristics for data viz |
| [W3C WAI: complex images](https://www.w3.org/WAI/tutorials/images/complex/) | Text alternatives for charts |
| [D3](https://d3js.org/), [Observable Plot](https://observablehq.com/plot/), [Vega-Lite](https://vega.github.io/vega-lite/), [Chart.js](https://www.chartjs.org/docs/latest/), [Apache ECharts](https://echarts.apache.org/en/index.html), [Recharts](https://recharts.org/), [Highcharts](https://www.highcharts.com/) | Libraries |
| [Datawrapper](https://www.datawrapper.de/), [Flourish](https://flourish.studio/), [RAWGraphs](https://www.rawgraphs.io/) | No-code tools |

## 12. Design tools

| Tool | Documentation |
| :--- | :--- |
| Figma | [Help Center](https://help.figma.com/), [Developer docs](https://developers.figma.com/), [Figma Learn](https://help.figma.com/hc/en-us/categories/360002051613), [Config talks](https://www.youtube.com/@Figma), [Community](https://www.figma.com/community) |
| Figma Dev Mode | [Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode) |
| Figma variables | [Guide to variables](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma) |
| Figma Code Connect | [Docs](https://developers.figma.com/docs/code-connect/) |
| Figma for VS Code | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=figma.figma-vscode-extension) |
| Penpot (open source) | [Docs](https://help.penpot.app/), [penpot.app](https://penpot.app/) |
| Sketch | [Docs](https://www.sketch.com/docs/) |
| Framer | [Help](https://www.framer.com/help/) |
| Webflow | [Webflow University](https://university.webflow.com/) |
| Adobe Creative Cloud | [Help Center](https://helpx.adobe.com/support.html) |
| Adobe XD (maintenance mode) | [FAQ](https://helpx.adobe.com/xd/desktop/introduction/faq.html) |
| Affinity by Canva | [affinity.studio](https://www.affinity.studio/) |
| Canva | [Help](https://www.canva.com/help/) |
| Inkscape | [inkscape.org](https://inkscape.org/) |
| GIMP | [Docs](https://www.gimp.org/docs/) |
| Krita | [Docs](https://docs.krita.org/) |
| Blender | [Manual](https://docs.blender.org/manual/en/latest/) |
| Spline | [Docs](https://docs.spline.design/) |
| Rive | [Docs](https://rive.app/docs/) |
| ProtoPie | [Learn](https://www.protopie.io/learn) |
| Miro, FigJam | [Miro Help](https://help.miro.com/), [FigJam guide](https://help.figma.com/hc/en-us/articles/1500004362321-Guide-to-FigJam) |

## 13. AI in design and front-end workflows

Use AI tools within the rules of this spec: verify output, check licences and terms, never present generated research or data as real, and keep personal or confidential data out of tools that are not approved for it.

| Source | What |
| :--- | :--- |
| [Guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) | Design context for coding agents |
| [Claude Code and Figma: set up the MCP server](https://help.figma.com/hc/en-us/articles/39888612464151-Claude-Code-and-Figma-Set-up-the-MCP-server) | Per-client setup |
| [Cursor and Figma](https://help.figma.com/hc/en-us/articles/39889260656407-Cursor-and-Figma-Set-up-the-MCP-server), [VS Code and Figma](https://help.figma.com/hc/en-us/articles/39890361040535-VS-Code-and-Figma-Set-up-the-MCP-server), [Gemini CLI and Figma](https://help.figma.com/hc/en-us/articles/39889246888855-Gemini-CLI-and-Figma-Set-up-the-MCP-server) | Per-client setup |
| [Introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs) | Anthropic's launch of Claude Design (17 April 2026) |
| [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design) | Access, design systems, editing, export, handoff, limits |
| [Claude Academy: Claude Design for prototypes and UX](https://academy.claude.com/tutorials/using-claude-design-for-prototypes-and-ux) | Prompting, design-system setup and handoff practice |
| [Claude Code artifacts](https://code.claude.com/docs/en/artifacts.md) | `/design`, `/slides`, design systems in artifacts, sharing and page constraints |
| [Model Context Protocol](https://modelcontextprotocol.io/) | The protocol behind MCP servers |
| [MCP Registry](https://registry.modelcontextprotocol.io/) | Published MCP servers |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers), [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) | Community directories of MCP servers (discovery, not review) |
| [MCP Toolbox for Databases](https://mcp-toolbox.dev/) | Google's open-source MCP server for databases |
| [The lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) | Why private data, untrusted content and external communication must not meet in one agent |
| [antislop](https://github.com/miqdadbadjuber/anti-slop) | Filter for generic AI output in UI, copy and code comments: purpose test, hard gates, liveliness dials, delivery report (MIT) |
| [Karpathy-inspired guidelines](https://github.com/multica-ai/andrej-karpathy-skills) | Think before coding, simplicity first, surgical changes, goal-driven execution |
| [Agent Skills specification](https://agentskills.io/specification) | The skill format used in this repository |
| [AGENTS.md](https://agents.md/) | The instruction file format used here |
| [Anthropic skills repository](https://github.com/anthropics/skills) | Open-source Agent Skills, including `frontend-design` (avoiding generic AI-generated aesthetics, Apache-2.0), `canvas-design`, `theme-factory` and `webapp-testing` |
| [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) | Practical interaction-quality checklist ([source, MIT](https://github.com/vercel-labs/web-interface-guidelines)) |
| [llms.txt](https://llmstxt.org/) | Community proposal (not a standard) for a Markdown file that points language models to a site's key docs |
| [Google PAIR Guidebook](https://pair.withgoogle.com/guidebook/) | Designing human-centred AI products |
| [Microsoft HAX Toolkit](https://www.microsoft.com/en-us/haxtoolkit/) | Guidelines for human-AI interaction |
| [NN/g: AI articles](https://www.nngroup.com/topic/ai/) | Research on AI user experience |

## 14. HTML, CSS and JavaScript

| Source | What |
| :--- | :--- |
| [MDN Web Docs](https://developer.mozilla.org/en-US/) | The reference for web developers |
| [MDN: HTML](https://developer.mozilla.org/en-US/docs/Web/HTML), [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS), [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) | References |
| [web.dev Learn](https://web.dev/learn) | Courses: HTML, CSS, JavaScript, forms, images, performance, accessibility, design |
| [web.dev Learn Design](https://web.dev/learn/design) | Responsive design course |
| [web.dev Learn Forms](https://web.dev/learn/forms) | Forms course |
| [javascript.info](https://javascript.info/) | Modern JavaScript tutorial |
| [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html) | TypeScript |
| [CSS-Tricks](https://css-tricks.com/) | CSS guides and almanac |
| [Smashing Magazine](https://www.smashingmagazine.com/) | Front-end and design articles |
| [Josh W. Comeau](https://www.joshwcomeau.com/), [Ahmad Shadeed](https://ishadeed.com/), [Kevin Powell](https://www.kevinpowell.co/), [Una Kravets](https://una.im/), [Jen Simmons](https://jensimmons.com/), [Rachel Andrew](https://rachelandrew.co.uk/), [Piccalilli](https://piccalil.li/), [Bramus](https://www.bram.us/) | Expert writers |
| [HTML validator (W3C Nu)](https://validator.w3.org/nu/) and [html-validate](https://html-validate.org/) | Validation |
| [Patterns.dev](https://www.patterns.dev/) | Design and rendering patterns |
| [roadmap.sh frontend](https://roadmap.sh/frontend) | Learning roadmap |

## 15. Frameworks and build tools

Versions and official docs: [framework-frontend-engineering references](../../.agents/skills/framework-frontend-engineering/references/frameworks.md).

| Source | What |
| :--- | :--- |
| [React](https://react.dev/), [Next.js](https://nextjs.org/docs), [React Router](https://reactrouter.com/) | React ecosystem |
| [Vue](https://vuejs.org/), [Nuxt](https://nuxt.com/docs) | Vue ecosystem |
| [Svelte and SvelteKit](https://svelte.dev/docs) | Svelte ecosystem |
| [Angular](https://angular.dev/) | Angular |
| [Astro](https://docs.astro.build/), [Eleventy](https://www.11ty.dev/), [Hugo](https://gohugo.io/documentation/) | Content sites |
| [Solid](https://docs.solidjs.com/), [Qwik](https://qwik.dev/), [Lit](https://lit.dev/), [htmx](https://htmx.org/), [Alpine.js](https://alpinejs.dev/) | Other approaches |
| [Vite](https://vite.dev/), [Lightning CSS](https://lightningcss.dev/), [PostCSS](https://postcss.org/), [Sass](https://sass-lang.com/documentation/), [Tailwind CSS](https://tailwindcss.com/docs) | Build and styling tools |
| [React Native](https://reactnative.dev/), [Expo](https://docs.expo.dev/), [Flutter](https://docs.flutter.dev/), [Ionic](https://ionicframework.com/docs), [Capacitor](https://capacitorjs.com/docs), [Tauri](https://tauri.app/), [Electron](https://www.electronjs.org/docs/latest/) | Mobile and desktop |
| [SwiftUI](https://developer.apple.com/documentation/swiftui), [Jetpack Compose](https://developer.android.com/compose) | Native UI |
| [State of JS](https://stateofjs.com/), [State of CSS](https://stateofcss.com/), [State of HTML](https://stateofhtml.com/) | Annual developer surveys |

## 16. Browser support and the web platform

| Source | What |
| :--- | :--- |
| [Baseline](https://web.dev/baseline) | Which features are safe to use |
| [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/) | Baseline data per feature |
| [Can I use](https://caniuse.com/) | Support tables |
| [MDN browser compat data](https://github.com/mdn/browser-compat-data) | Data behind MDN tables |
| [Interop dashboard](https://wpt.fyi/interop) | Cross-browser interoperability effort; [Interop 2026 focus areas](https://web.dev/blog/interop-2026) |
| [Chrome Platform Status](https://chromestatus.com/) | Chromium features |
| [WebKit features in Safari](https://webkit.org/blog/), [Safari release notes](https://developer.apple.com/documentation/safari-release-notes) | Safari |
| [Firefox release notes for developers](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases) | Firefox |
| [Browserslist](https://browsersl.ist/) | Support target queries |

## 17. Testing and quality

| Source | What |
| :--- | :--- |
| [Playwright](https://playwright.dev/docs/intro) | End-to-end, visual, accessibility |
| [Vitest](https://vitest.dev/) | Unit and component tests |
| [Testing Library](https://testing-library.com/docs/) | User-centric queries |
| [Mock Service Worker](https://mswjs.io/) | Network mocking |
| [Storybook testing](https://storybook.js.org/docs/writing-tests) | Interaction, accessibility, visual tests |
| [Chromatic](https://www.chromatic.com/docs/), [Percy](https://www.browserstack.com/docs/percy), [BackstopJS](https://github.com/garris/BackstopJS) | Visual regression |
| [ESLint](https://eslint.org/docs/latest/), [typescript-eslint](https://typescript-eslint.io/), [Biome](https://biomejs.dev/), [Prettier](https://prettier.io/docs/), [Stylelint](https://stylelint.io/) | Lint and format |
| [knip](https://knip.dev/) | Unused code and dependencies |
| [Chrome DevTools](https://developer.chrome.com/docs/devtools), [Firefox DevTools](https://firefox-source-docs.mozilla.org/devtools-user/), [Safari Web Inspector](https://developer.apple.com/documentation/safari-developer-tools/web-inspector) | Browser tools |
| [BrowserStack](https://www.browserstack.com/), [Sauce Labs](https://saucelabs.com/), [LambdaTest](https://www.lambdatest.com/) | Real-device clouds |

## 18. Performance

| Source | What |
| :--- | :--- |
| [Core Web Vitals](https://web.dev/articles/vitals) | Metrics and thresholds |
| [web.dev Learn Performance](https://web.dev/learn/performance) and [Learn Images](https://web.dev/learn/images) | Courses |
| [PageSpeed Insights](https://pagespeed.web.dev/) | Field and lab data |
| [Chrome UX Report](https://developer.chrome.com/docs/crux) | Field dataset |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) and [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | Lab audits and budgets |
| [web-vitals library](https://github.com/GoogleChrome/web-vitals) | Real-user measurement |
| [WebPageTest](https://www.webpagetest.org/) | Detailed lab testing |
| [HTTP Archive Web Almanac](https://almanac.httparchive.org/) | State of the web |
| [CSS Wizardry](https://csswizardry.com/) | Performance consulting articles |
| [High Performance Browser Networking](https://hpbn.co/) | Free book |
| [Bundlephobia](https://bundlephobia.com/) | Package cost |
| [W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/) | Sustainable design and development (Group Note Draft) |

## 19. Front-end security and privacy

| Source | What |
| :--- | :--- |
| [OWASP Top 10](https://owasp.org/Top10/) | Most critical web application risks |
| [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) | Including [XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) and [DOM-based XSS](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html) |
| [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) | CSP guide |
| [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) | SRI |
| [MDN: Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) | DOM XSS defence |
| [MDN Observatory](https://developer.mozilla.org/en-US/observatory) | HTTP security header scan |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitiser |
| [Cloudflare security-audit skill](https://github.com/cloudflare/security-audit-skill), [Build your own vulnerability harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness) | Evidence-first, multi-agent vulnerability auditing (MIT) |
| [XS-Leaks Wiki](https://xsleaks.dev/) | Cross-site leak techniques and defences |
| [OWASP DOM-based XSS](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html), [prototype pollution](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html), [clickjacking](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html) | Client-side prevention cheat sheets |
| [web.dev: security](https://web.dev/explore/secure) | Guides |
| [Privacy by design (ICO, UK)](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/) | Data protection by design |

## 20. SEO, metadata, PWA and email

| Source | What |
| :--- | :--- |
| [Google Search Central: SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) | Search basics |
| [Schema.org](https://schema.org/) and [Rich Results Test](https://search.google.com/test/rich-results) | Structured data |
| [Open Graph protocol](https://ogp.me/) | Share previews |
| [MDN: Progressive web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) | PWA guide |
| [web.dev: PWA](https://web.dev/explore/progressive-web-apps) | PWA course and articles |
| [Can I email](https://www.caniemail.com/) | Email client support |
| [Litmus](https://www.litmus.com/) | Email testing |
| [MJML](https://mjml.io/) | Responsive email framework |

## 21. Internationalisation

| Source | What |
| :--- | :--- |
| [W3C Internationalization](https://www.w3.org/International/) | Techniques and articles |
| [MDN: Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) | Formatting APIs |
| [Unicode CLDR](https://cldr.unicode.org/) | Locale data |
| [FormatJS / ICU MessageFormat](https://formatjs.github.io/) | Message formatting |
| [MDN: logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) | Right-to-left layouts |
| [Falsehoods programmers believe about names](https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/) | Designing name fields |

## 22. Ethics, deceptive patterns and law

| Source | What |
| :--- | :--- |
| [Deceptive Design (deceptive.design)](https://www.deceptive.design/) | Catalogue of deceptive patterns |
| [EDPB guidelines on deceptive design patterns in social media](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-032022-deceptive-design-patterns-social-media_en) | EU data protection guidance |
| [FTC: Bringing Dark Patterns to Light (2022 report)](https://www.ftc.gov/reports/bringing-dark-patterns-light) | US regulator report |
| [GDPR text (EUR-Lex)](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | EU data protection law |
| [Global Privacy Control](https://globalprivacycontrol.org/) | Browser opt-out signal (`Sec-GPC`) required by several US state laws |
| [EU Digital Services Act](https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/europe-fit-digital-age/digital-services-act_en) | Online platform rules including dark patterns |
| [Humane by Design](https://humanebydesign.com/) | Principles for ethical design |
| [Center for Humane Technology](https://www.humanetech.com/) | Technology and wellbeing |
| [Creative Commons](https://creativecommons.org/) | Open licensing |
| [U.S. Copyright Office: AI](https://www.copyright.gov/ai/) | Copyright and AI-generated works (US) |

## 23. Learning: courses and curricula

| Source | Cost |
| :--- | :--- |
| [MDN Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development) | Free |
| [web.dev Learn](https://web.dev/learn) | Free |
| [freeCodeCamp](https://www.freecodecamp.org/) | Free |
| [The Odin Project](https://www.theodinproject.com/) | Free |
| [Google UX Design Certificate (Coursera)](https://www.coursera.org/professional-certificates/google-ux-design) | Paid, financial aid available |
| [Interaction Design Foundation](https://www.interaction-design.org/) | Membership |
| [Nielsen Norman Group training](https://www.nngroup.com/training/) | Paid |
| [W3C WAI Digital Accessibility Foundations](https://www.w3.org/WAI/courses/foundations-course/) | Free |
| [Frontend Masters](https://frontendmasters.com/) | Subscription |
| [Figma Learn](https://help.figma.com/hc/en-us/categories/360002051613) | Free |
| [Harvard CS50 Web Programming](https://cs50.harvard.edu/web/) | Free |
| [Josh Comeau: CSS for JavaScript Developers](https://css-for-js.dev/) | Paid |
| [DesignLab](https://designlab.com/), [Memorisely](https://www.memorisely.com/) | Paid bootcamps |

## 24. Books

| Title | Author | Topic |
| :--- | :--- | :--- |
| *The Design of Everyday Things* | Don Norman | Usability foundations |
| *Don't Make Me Think, Revisited* | Steve Krug | Web usability |
| *About Face* | Alan Cooper et al. | Interaction design |
| *Refactoring UI* | Adam Wathan, Steve Schoger | Practical UI |
| *Design Systems* | Alla Kholmatova | Design systems |
| *Atomic Design* ([free online](https://atomicdesign.bradfrost.com/)) | Brad Frost | Design systems |
| *Inclusive Design Patterns* | Heydon Pickering | Accessible front-end |
| *Form Design Patterns* | Adam Silver | Forms |
| *Thinking with Type* | Ellen Lupton | Typography |
| *The Elements of Typographic Style* | Robert Bringhurst | Typography |
| *Grid Systems in Graphic Design* | Josef Müller-Brockmann | Layout |
| *Interaction of Color* | Josef Albers | Colour |
| *Logo Design Love* | David Airey | Identity |
| *Designing Brand Identity* | Alina Wheeler | Branding |
| *The Visual Display of Quantitative Information* | Edward Tufte | Data visualisation |
| *Just Enough Research* | Erika Hall | Research |
| *Interviewing Users* | Steve Portigal | Research |
| *Lean UX* | Jeff Gothelf, Josh Seiden | Process |
| *Strategic Writing for UX* | Torrey Podmajersky | UX writing |
| *Resilient Web Design* ([free online](https://resilientwebdesign.com/)) | Jeremy Keith | Progressive enhancement |
| *Every Layout* ([site](https://every-layout.dev/)) | Heydon Pickering, Andy Bell | CSS layout |
| *Deceived by Design* | Harry Brignull | Deceptive patterns |

## 25. Blogs, newsletters, podcasts and communities

| Source | Kind |
| :--- | :--- |
| [Figma blog](https://www.figma.com/blog/) | Product and design practice |
| [Chrome for Developers blog](https://developer.chrome.com/blog), [WebKit blog](https://webkit.org/blog/), [Mozilla Hacks](https://hacks.mozilla.org/) | Browser vendors |
| [Smashing Magazine](https://www.smashingmagazine.com/), [CSS-Tricks](https://css-tricks.com/), [A List Apart](https://alistapart.com/) | Articles |
| [Sidebar](https://sidebar.io/) | Five design links a day |
| [Frontend Focus](https://frontendfoc.us/), [JavaScript Weekly](https://javascriptweekly.com/), [CSS Weekly](https://css-weekly.com/) | Newsletters |
| [UX Collective](https://uxdesign.cc/), [Nielsen Norman Group](https://www.nngroup.com/) | UX articles |
| [Syntax](https://syntax.fm/), [ShopTalk Show](https://shoptalkshow.com/) | Front-end podcasts |
| [Design Details](https://designdetails.fm/) | Design podcast |
| [Figma Community forum](https://forum.figma.com/), [Stack Overflow](https://stackoverflow.com/), [DEV Community](https://dev.to/) | Communities |

## 26. Inspiration and pattern galleries

Study patterns; do not copy proprietary designs or brands.

| Source | Focus |
| :--- | :--- |
| [Mobbin](https://mobbin.com/) | Mobile and web app screens |
| [Page Flows](https://pageflows.com/) | User flows |
| [Dribbble](https://dribbble.com/), [Behance](https://www.behance.net/) | Portfolios |
| [Awwwards](https://www.awwwards.com/), [Godly](https://godly.website/), [Land-book](https://land-book.com/), [Siteinspire](https://www.siteinspire.com/) | Websites |
| [Savee](https://savee.it/), [Pinterest](https://www.pinterest.com/), [Are.na](https://www.are.na/) | Mood boards |
| [CodePen](https://codepen.io/) | Front-end experiments |
| [Collect UI](https://collectui.com/) | UI components |
| [Storybook showcase](https://storybook.js.org/showcase) | Real component libraries |

## 27. Photo, video, colour and motion production

Checked 2026-10-18. Details, numbers and more sources are in the [video](../../.agents/skills/video-editing-and-post-production/references/delivery-and-standards.md), [colour](../../.agents/skills/color-grading-and-color-management/references/color-pipelines.md), [photo](../../.agents/skills/photo-editing-and-retouching/references/tools-and-provenance.md) and [motion](../../.agents/skills/motion-graphics-and-animation/references/tools-and-safety.md) references.

| Topic | Sources |
| :--- | :--- |
| Loudness | [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770), [EBU R 128](https://tech.ebu.ch/publications/r128), [ATSC A/85:2026-07](https://www.atsc.org/wp-content/uploads/2026/07/A85-2026-07.pdf), [AES TD1004](https://aes.org/wp-content/uploads/2024/01/AESTD1004_1_15_10.pdf) |
| Video signals and HDR | [ITU-R BT.709](https://www.itu.int/rec/R-REC-BT.709), [BT.1886](https://www.itu.int/rec/R-REC-BT.1886), [BT.2020](https://www.itu.int/rec/R-REC-BT.2020), [BT.2100](https://www.itu.int/rec/R-REC-BT.2100), [BT.2408](https://www.itu.int/pub/R-REP-BT.2408) |
| Colour management | [ACES documentation](https://docs.acescentral.com/), [OpenColorIO](https://opencolorio.org/), [Cinematic Color](https://github.com/jeremyselan/cinematiccolor), [International Color Consortium](https://www.color.org/) |
| Web video | [MDN web video codec guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs), [WebVTT](https://www.w3.org/TR/webvtt1/), [HLS (RFC 8216)](https://datatracker.ietf.org/doc/html/rfc8216), [DASH Industry Forum](https://dashif.org/), [YouTube upload settings](https://support.google.com/youtube/answer/1722171) |
| Captions and description | [Netflix English timed text style guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide), [BBC subtitle guidelines](https://www.bbc.co.uk/accessibility/forproducts/guides/subtitles/), [W3C Media Accessibility User Requirements](https://www.w3.org/TR/media-accessibility-reqs/) |
| Provenance and disclosure | [C2PA 2.4](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html), [Content Credentials](https://contentcredentials.org/), [EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj), [NPPA Code of Ethics](https://nppa.org/resources/code-ethics) |
| Animation | [Lottie specification](https://lottie.github.io/lottie-spec/), [Rive documentation](https://rive.app/docs), *The Illusion of Life* (Thomas and Johnston), *The Animator's Survival Kit* (Williams) |
| Flash safety | [WCAG 2.2 SC 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [PEAT](https://trace.umd.edu/peat/), [Harding FPA](https://www.hardingfpa.com/), [ASA on flashing images](https://www.asa.org.uk/news/flashing-images-in-advertising.html) |
| Editing craft | Walter Murch, *In the Blink of an Eye*; [OpenTimelineIO](https://opentimeline.io/) for timeline interchange |
