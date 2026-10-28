# Claude Design: Facts, Dates and Sources

Checked 2026-10-18 against Anthropic's own pages. Claude Design, Claude Slides and Claude Docs are in beta; plans, limits and commands change, so open the sources before relying on a detail.

## 1. Timeline

| Date | Change | Source |
| :--- | :--- | :--- |
| 17 April 2026 | Claude Design launched by Anthropic Labs as a research preview, on Claude Opus 4.7, for Pro, Max, Team and Enterprise; designs, prototypes, slides and one-pagers; design system built from the team's codebase and design files; imports from prompts, images, DOCX, PPTX and XLSX, the codebase and a web capture tool; exports to Canva, PDF, PPTX and standalone HTML; handoff bundle for Claude Code | [Anthropic: Introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs) |
| 17 June 2026 | Design system import rebuilt (GitHub repository, design files or uploads; one or several systems); output checked against the design system; admin role to approve one system and lock edits; `/design-sync`; handoff continues from existing work; new editor; usage shared with the rest of Claude; connectors (Adobe, Base44, Canva, Gamma, Lovable, Miro, Replit, Vercel, Wix) | [Claude blog: Claude Design now stays on brand](https://claude.com/blog/claude-design-stays-on-brand-for-daily-work) |
| August 2026 | `/design` skill in Claude Code (research preview): a canvas of editable artboards from a brief | [Claude Code: week 34](https://code.claude.com/docs/en/whats-new/2026-w34.md) |
| 16 September 2026 | Designs, decks and documents in any conversation; Claude Slides and Claude Docs introduced; artifacts, including Claude Design, on every plan including Free; Enterprise off by default until an Owner enables it | [Claude release notes](https://support.claude.com/en/articles/12138966-release-notes) |
| 15 October 2026 | On by default for Enterprise (an Owner could enable it earlier) | [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design) |
| 14 December 2026 | The standalone claude.ai/design closes; Claude Code 2.1.302 (16 October 2026) added a notice to `/design-sync` and `/design-login` | [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), Claude Code changelog |

## 2. Working in Claude Design

- **Inputs**: screenshots, images, wireframes, existing decks and documents, linked repositories.
- **Editing**: chat (broad changes and alternatives), inline comments (one element), direct canvas editing (drag, resize, align), and adjustment sliders.
- **Exports**: `.zip`, PDF, PPTX, Google Slides, standalone HTML, third-party tools; handoff to a local coding agent or to Claude Code on the web.
- **Known limitations** listed by Anthropic: no version history ("Save what we have" in chat preserves an iteration), basic simultaneous editing, comments that can disappear, sharing settings not changeable in the mobile app, and output that only matches the quality of the source design system.
- **Practice guide**: [Claude Academy: Using Claude Design for prototypes and UX](https://academy.claude.com/tutorials/using-claude-design-for-prototypes-and-ux): name components, prototype whole journeys, ask for edge states, record design reasoning, link only the relevant package of a large repository, and avoid attaching `.git` or `node_modules`.

## 3. In Claude Code

From the [Claude Code documentation](https://code.claude.com/docs/en/artifacts.md) (commands reference and artifacts page):

| Command | What it does | Requirements |
| :--- | :--- | :--- |
| `/design [brief]` | Drafts UI mockups, screen flows, landing pages or posters as artboards on one canvas, published as a Claude Design artifact; edits in the browser save automatically; each artboard exports as PNG or PDF | Claude Code v2.1.265 or later, artifacts available in the session, the Design template enabled for the account |
| `/design-sync [hint]` | Converts the repository's React design system and uploads it to Claude Design so designs use real components; a first sync verifies every component and can take a few hours on a large repository | claude.ai login (`/design-login`); not on Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry, Claude Platform on AWS or a Claude apps gateway |
| `/slides [brief]` | Creates a Claude Slides deck | Same as `/design` |

Artifact pages are single static pages under a strict Content Security Policy: scripts only from cdnjs, unpkg, the Tailwind and jQuery CDNs and selected jsDelivr paths; fonts only from Google Fonts; images embedded as data URIs; no backend; at most 16 MiB. They are private until shared; Team and Enterprise can share within the organisation or, once an Owner allows it, publicly.

## 4. Similar tools

The review and handoff steps of the skill apply to every AI design generator: Figma Make, v0, Bolt, Lovable, Builder.io, Anima, Locofy, Relume, Uizard and others listed in the [tools catalog](../../../../docs/spec/TOOLKIT.md). None of them replaces the design system, the accessibility checks or the tests.
