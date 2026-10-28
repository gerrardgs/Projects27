# Design tools and their official documentation

Status checked on 2026-10-15. Plans, pricing and features change often: check the vendor page before advising on cost or availability.

## Interface design and prototyping

| Tool | Notes | Official docs |
| :--- | :--- | :--- |
| Figma | Industry default for UI design; auto layout, components and variants, variables (modes for themes), Dev Mode for developers, prototyping, FigJam whiteboards | [Help Center](https://help.figma.com/), [Developer docs (REST API, plugins, widgets)](https://developers.figma.com/), [Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode) |
| Figma MCP server | Gives AI coding agents structured design context (layout, variables, components, Code Connect mappings). Remote server at `https://mcp.figma.com/mcp`; a desktop server also exists | [Guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server), [developer docs](https://developers.figma.com/docs/figma-mcp-server/) |
| Figma Code Connect | Maps Figma components to real code components so Dev Mode and the MCP server show your code | [Code Connect docs](https://developers.figma.com/docs/code-connect/) |
| Penpot | Open-source, browser-based, self-hostable; designs use CSS flex and grid layout concepts; design tokens support | [Penpot docs](https://help.penpot.app/), [penpot.app](https://penpot.app/) |
| Sketch | macOS design app with a web workspace | [Sketch docs](https://www.sketch.com/docs/) |
| Framer | Visual site builder with publishing; design and ship marketing sites | [Framer help](https://www.framer.com/help/) |
| Webflow | Visual development of production websites with CMS | [Webflow University](https://university.webflow.com/) |
| Adobe XD | In maintenance mode: Adobe no longer funds new features, but still ships bug, security and privacy fixes; no end date announced. Do not start new work in it | [Adobe XD FAQ](https://helpx.adobe.com/xd/desktop/introduction/faq.html) |
| Claude Design | Anthropic's AI design product: designs, interactive prototypes, slides and one-pagers from a brief, on your imported design system; inline comments, canvas editing, handoff bundle to Claude Code; `/design` and `/design-sync` in Claude Code. In beta; the standalone claude.ai/design closes on 14 December 2026 | [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [ai-design-and-artifacts](../../ai-design-and-artifacts/SKILL.md) |
| ProtoPie | High-fidelity interaction prototypes with sensors and logic | [ProtoPie docs](https://www.protopie.io/learn) |
| Origami Studio | Meta's free prototyping tool for complex interactions | [origami.design](https://origami.design/) |

## Graphic, illustration, photo and layout

| Tool | Notes | Official docs |
| :--- | :--- | :--- |
| Adobe Photoshop, Illustrator, InDesign, After Effects, Premiere Pro, Lightroom | Industry standard Creative Cloud apps for raster, vector, layout, motion and video | [Adobe Help Center](https://helpx.adobe.com/support.html) |
| Affinity (by Canva) | Since October 2025 one free app combining the former Affinity Designer, Photo and Publisher; AI features need a Canva subscription | [affinity.studio](https://www.affinity.studio/) |
| Canva | Templates and brand kits for marketing and social content | [Canva Help](https://www.canva.com/help/) |
| Inkscape | Free, open-source vector editor (SVG native) | [inkscape.org](https://inkscape.org/) |
| GIMP | Free, open-source raster editor | [GIMP docs](https://www.gimp.org/docs/) |
| Krita | Free, open-source painting | [Krita docs](https://docs.krita.org/) |
| Scribus | Free, open-source desktop publishing with PDF/X export | [Scribus wiki](https://wiki.scribus.net/) |
| Procreate | iPad illustration | [Procreate handbook](https://help.procreate.com/) |
| Photopea | Browser-based raster editor that opens PSD files | [photopea.com](https://www.photopea.com/learn/) |

## Motion, 3D and interactive graphics

| Tool | Notes | Official docs |
| :--- | :--- | :--- |
| Rive | Interactive vector animation with state machines; runtimes for web, iOS, Android, Flutter, games | [Rive docs](https://rive.app/docs/) |
| LottieFiles / Lottie | JSON vector animations exported from After Effects (Bodymovin) or created online; dotLottie format | [LottieFiles docs](https://developers.lottiefiles.com/), [Airbnb Lottie](https://airbnb.io/lottie/) |
| Spline | 3D design for the web, exports to code | [Spline docs](https://docs.spline.design/) |
| Blender | Free, open-source 3D | [Blender manual](https://docs.blender.org/manual/en/latest/) |
| Jitter | Motion design for UI and social | [jitter.video](https://jitter.video/) |

## Icons, illustrations and fonts (check each licence)

| Resource | Licence (verify on the site) |
| :--- | :--- |
| [Material Symbols](https://fonts.google.com/icons) | Apache 2.0 |
| [Lucide](https://lucide.dev/) | ISC |
| [Heroicons](https://heroicons.com/) | MIT |
| [Phosphor Icons](https://phosphoricons.com/) | MIT |
| [Tabler Icons](https://tabler.io/icons) | MIT |
| [Iconoir](https://iconoir.com/) | MIT |
| [SF Symbols](https://developer.apple.com/sf-symbols/) | Apple platforms only, under Apple's licence |
| [Font Awesome](https://fontawesome.com/) | Free set: icons CC BY 4.0, fonts SIL OFL, code MIT; Pro is commercial |
| [Google Fonts](https://fonts.google.com/) | Mostly SIL Open Font License; check each family |
| [Fontshare](https://www.fontshare.com/) | ITF Free Font License; check terms |
| [unDraw](https://undraw.co/) | Own licence; free use, no redistribution as a pack |
| [Unsplash](https://unsplash.com/license), [Pexels](https://www.pexels.com/license/) | Own licences; no model or trademark guarantee |
| [Openverse](https://openverse.org/) | Search for openly licensed (Creative Commons) media |

## Accessibility and handoff plugins

Stark, Able, Contrast and similar Figma plugins check contrast and simulate colour vision deficiency; the Figma A11y Annotation Kit and Indeed's or CVS Health's annotation kits on Figma Community document headings, landmarks, focus order and names for developers. Verify a plugin's publisher and permissions before installing it.
