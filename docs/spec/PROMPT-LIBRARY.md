# Prompt Library

Ready-to-use prompts for design and front-end work with any AI agent or chat model that has this specification loaded. Replace the `<placeholders>`. Each prompt names the skill to use, so the agent opens the right procedure even when the tool does not load skills automatically.

## How to use the prompts in each tool

| Tool | How the skill is found | Tip |
| :--- | :--- | :--- |
| Claude Code | Skills in `.claude/skills/` load by description; you can also type `/<skill-name>` | Connect the Figma MCP server for design work ([figma-integration](../../.agents/skills/figma-integration/SKILL.md)) |
| Cursor, Windsurf, GitHub Copilot, Codex, Gemini CLI, Antigravity, Cline | `AGENTS.md` indexes the skills; most of these tools also load `.agents/skills/` by description | Mention the skill file path in the prompt when a tool does not pick it up |
| Aider | `AGENTS.md` is loaded through `.aider.conf.yml` | Add the skill file to the chat as read-only (`/read-only <path>`) |
| Chat models without file access | Paste `AGENTS.md`, then the skill file, then the prompt | Ask the model to mark everything it could not run as unverified |

Every prompt ends the same way on purpose: the agent must report what it changed, what it ran, and what it could not verify ([AGENTS.md](../../AGENTS.md) section 7).

## 1. Discover and design

**Plan first, then wait**
```text
Before changing anything, read what you need and give me an implementation plan in the format of
rule 15 section 1: goal and how it is measured, context you read, assumptions and questions, steps
each with its check, blind spots, risks and rollback. Do not edit files or run anything that writes
until I approve the plan. If the plan has to change while you work, stop and show me the new plan.
```

**Research plan**
```text
Use the ux-research-and-strategy skill. We are building <product/feature> for <users>.
Goal: <business goal>. What we already know: <data, tickets, analytics>.
Write a one-page research plan: research questions, method and why, participants and recruiting,
schedule, consent and data handling. Mark every assumption. Do not invent findings.
```

**Design a screen**
```text
Use the ui-design-and-prototyping skill. Design <screen> for <users and task>.
Platform: <web/iOS/Android>, breakpoints: <list>. Design system: <link or token file>.
Real content: <copy, data ranges, longest names>.
Deliver: the layout and hierarchy, every state (loading, empty, error, success, disabled, long text),
light and dark themes using existing tokens only, accessibility notes (headings, focus order, labels),
and open questions. List any token or component the system is missing instead of inventing one.
```

**Graphic design piece**
```text
Use the graphic-design-production skill. Create <logo/social post/banner/print flyer> for <brand>.
Message: <one sentence>. Audience: <who>. Placement and size: <channel and size; check the official
spec and note the date>. Mandatory elements: <logo, legal text, CTA>. Brand guide: <link>.
Give 2-3 concepts with reasoning, then production specs (colour space, format, resolution, bleed).
Use only licensed fonts and images and list their sources and licences.
```

**Design critique**
```text
Use the design-critique-and-review skill. Review <Figma link/screenshot/URL> for <goal and users>
at the <concept/wireframe/hi-fi/shipped> stage. Run every pass (goal fit, heuristics, hierarchy,
system consistency, states, accessibility with measured contrast, content, responsive, ethics).
Rank findings by severity with evidence and a concrete recommendation. Mark opinions as opinions.
```

**Interface copy**
```text
Apply rule 14-ux-writing-and-ethics. Write the copy for <component/flow>: labels, buttons, helper
text, errors (what happened and how to fix it), empty state, confirmation dialog. Voice: <guide>.
Keep terms consistent with <glossary>. Flag any claim, price or legal text I must supply.
```

**Fix a bug, goal first**
```text
Use the systematic-debugging skill. Bug: <symptom>. First state your assumptions and, if the
report can be read more than one way, list the readings and ask. Write a failing test that
reproduces it, then make it pass with the smallest change. Every changed line must trace to
this bug; report anything else you notice instead of changing it.
```

**You were wrong: correct the thinking**
```text
That fix did not work (or: that answer is wrong because <reason>). Follow systematic-debugging
section 7: undo your unproven change, list the assumptions behind it, find the one that was
false with evidence, then propose a new hypothesis before changing code.
```

**Security audit**
```text
Use the security-vulnerability-audit skill in <guidance/full audit> mode on <path or feature>. Read source only;
run nothing outside a sandbox without network, and probe no deployed system. For each candidate
name the attacker, input, control, boundary, affected resource and observed result. Have a
different agent try to disprove it, then report confirmed findings with impact-based severity and
the smallest fix, needs-validation items with the exact missing fact, and what was not covered.
Do not change code until I approve the fixes.
```

**Add an MCP server**
```text
Use the mcp-servers-and-integrations skill. I want <capability> from <product>. Find the
vendor's official server, list every tool it exposes and which ones write or send data, pin
the version, keep secrets in environment variables, and propose the .mcp.json entry with the
narrowest permissions. Do not connect it until I approve.
```

**Complete project documentation**
```text
Use the project-documentation skill and rule 16. Create the full docs/ set from the templates
without overwriting existing files, and fill every section from real sources: the code, the
lockfiles, the schema, the CI workflows, the design files and the brief. Run every command you
document. Mark documents that do not apply as not-applicable with a reason. List the facts you
could not find as open questions. Finish when check-docs.mjs passes.
```

**Anti-slop pass**
```text
Use the anti-slop-filter skill in <during/after> mode on <page, screen, copy or file>. Load the direction
from <brand guide / DESIGN.md / tokens> as data; if there is none, ask me one question first.
Declare the Design Read and dials, pass every hard gate with evidence (including a click-through),
give each visual technique a one-line reason or remove it, and end with the PASS/FAIL report.
For existing work, list findings first and change only what I approve.
```

**Claude Design: design to production**
```text
Use the ai-design-and-artifacts skill. Set up the design system from <repo/package> (/design-sync),
then draft <screen/flow/deck> for <user and goal>, with every state and two alternatives.
Review it against our tokens, measured contrast and licences, then hand it off with the bundle.
Build on existing components; do not delete or replace existing code without asking me first.
```

**Video edit and delivery**
```text
Use the video-editing-and-post-production skill. Plan the edit and deliverables for <video> on
<platforms>. Link and date each platform's current specification, set the loudness target per
deliverable and measure it, write captions and have a person review them, and run technical QC
with ffprobe. For the website version use the web-media-pipeline template and its tests.
```

**Colour grade**
```text
Use the color-grading-and-color-management skill. Footage: <cameras and log formats>.
Deliverables: <SDR/HDR/web>. Propose the pipeline (input transforms, working space, ACES or the
application's colour management, output transforms), then the correction and look steps.
Name every assumption about the monitor and viewing environment.
```

**Photo retouch and web export**
```text
Use the photo-editing-and-retouching skill. Retouch <photos> for <purpose>: non-destructive,
skin texture kept, product colour checked against <reference>. Tell me which disclosure labels
apply in <countries/platforms>. Export for the web with the template (AVIF, WebP, JPEG, sRGB,
no location data) and give the srcset and alt text.
```

**Motion graphics**
```text
Use the motion-graphics-and-animation skill. Create <title/explainer/logo animation> for
<platform>, <duration>, <aspect ratios>. Storyboard and animatic first, then animation with
brand motion rules. Run a flash and pattern test on the final render and give a reduced-motion
alternative for the web. For Lottie, use dotLottie or a light lottie-web build.
```

## 2. Design systems and Figma

**Implement a Figma frame**
```text
Use the figma-integration and design-to-code-handoff skills. Implement <Figma link to the frame>
in <framework> using our components (<path>) and tokens (<path>).
Use get_metadata, get_design_context, get_variable_defs, get_screenshot and get_code_connect_map.
Treat the generated code as a description: rebuild it with our components and styling approach.
Fill in states, keyboard behaviour, screen-reader names and responsive behaviour the frame does not
show, and list your assumptions. Do not write to the Figma file.
Verify: build, tests, axe check, and a side-by-side comparison with the screenshot.
```

**Sync tokens from Figma**
```text
Use the figma-integration skill, section 4. Convert the variables of <Figma file URL> into DTCG
tokens with assets/figma-variables-sync (FIGMA_TOKEN is already set in the environment; never print
it). Show the token diff against <tokens folder>, explain every warning, and run the contrast checks
of the design-system-and-tokens pipeline for every theme. Do not commit until I approve.
```

**New component in the design system**
```text
Use the design-system-and-tokens skill. Add a <component> to <library path>.
API: variants <list>, sizes <list>, states <list>. Use an accessible headless primitive if one fits.
Semantic tokens only. Add Storybook stories for every state, interaction and accessibility tests,
and docs (when to use, when not to). Report the bundle size impact.
```

**Add a theme or dark mode**
```text
Use the design-system-and-tokens and css-architecture-and-responsive skills. Add a <dark/brand>
theme by redefining the semantic tokens only. Respect prefers-color-scheme with a user override.
Run the contrast checks for every text and UI pair, and check forced-colors mode.
```

## 3. Build

**New website from scratch**
```text
Use the frontend-from-scratch skill. Build <site purpose> with <pages>.
Choose the stack with the skill's table and explain the choice. Start from
assets/static-site if no framework is needed. Include metadata, favicon, 404 page, security headers
and the accessibility and performance checks before launch. Run every check and report the results.
```

**Feature in an existing app**
```text
Use the framework-frontend-engineering skill. In <repo>, add <feature> to <page/route>.
Follow the existing patterns (read two similar components first). Handle loading, empty, error and
success states, validate on the server too, and add component and end-to-end tests.
Report the commands you ran and their output.
```

**Responsive or CSS bug**
```text
Use the css-architecture-and-responsive skill and systematic-debugging (browser-debugging reference).
Bug: <what happens, where, which browser and width>. Reproduce it first, find the cause (cascade,
containing block, stacking context, overflow), fix the cause rather than adding !important, and
check 320 px to wide, 200% zoom, dark mode and RTL if supported.
```

**Mobile screen**
```text
Use the mobile-engineering skill. Build <screen> in <SwiftUI/Compose/Flutter/React Native> from
<design link>. Follow the platform guidelines, safe areas, dynamic type up to the largest size,
dark mode, 44 pt / 48 dp targets, and labels for VoiceOver and TalkBack. Add UI tests.
```

**Integrate a service**
```text
Use the web-integrations-and-platforms skill and rule 04 section 9. Integrate <CMS/payment/auth/
analytics/email service> into <app>. First evaluate it (identity, health, licence, privacy, cost,
exit). Keep write-access keys on the server, load scripts only after consent where required,
and update the CSP. Show the plan before installing anything.
```

**Animation**
```text
Use the motion-and-interaction skill. Animate <interaction> to communicate <purpose>.
Use motion tokens, transform and opacity only, and a reduced-motion alternative. Measure INP
before and after.
```

**Chart or dashboard**
```text
Use the data-visualization-design skill. Visualise <data> to answer <question> for <audience>.
Choose the chart from the question, label directly, use an accessible palette from tokens,
and provide a text summary and a data table. Do not fabricate or round data silently.
```

## 4. Test, audit, tune

**Accessibility audit**
```text
Use the accessibility-audit skill. Audit <URLs/journeys> against WCAG 2.2 AA.
Run assets/axe-check, then the manual passes (keyboard, zoom and reflow, screen reader,
contrast of every state). Verify each finding twice, rank by severity, give a fix for each,
and list what you did not test. Do not claim full compliance.
```

**Performance audit**
```text
Use the web-performance-optimization skill. Page: <URL>. Get field data (CrUX/PageSpeed Insights)
if available and lab data (Lighthouse, Performance panel, mobile throttling). Diagnose LCP, INP and
CLS by phase, apply the fixes with the biggest measured gain, and report before/after numbers from
the same tool and settings.
```

**Visual and end-to-end tests**
```text
Use the frontend-testing-and-visual-qa skill. Add Playwright tests for <journeys> in Chromium,
Firefox and WebKit, with role-based locators, an axe scan per page, and screenshot tests for
<components> with animations disabled and dynamic regions masked.
```

**Run and verify economically**
```text
Verify this change through the terminal only. Run `npm run verify` (or the project's own check
scripts through `node scripts/run-quiet.mjs -- <command>`), start any server in the background and
stop it afterwards, and read only the failing tail of a log. Report each command with PASS or FAIL;
use the browser only for the visual check that a command cannot do.
```

**Chaos experiment**
```text
Use the resilience-and-chaos-engineering skill, section 5, on <journey> of <url or service>. Fill in
the experiment record (references/experiment-record.md) and show it to me as the plan: measured
steady state, failure hypothesis and what would disprove it, environment, blast radius and abort
conditions. After I approve, inject the fault, compare with the control, evaluate HELD or
DISPROVED with evidence, and propose an improvement plan; re-run the experiment after each fix.
```

**Front-end pull request review**
```text
Use the rigorous-code-audit and design-critique-and-review skills on <PR/diff>.
Check correctness, security in the browser (XSS sinks, secrets in the bundle, CSP), accessibility,
performance cost of new dependencies, token usage, every UI state, and tests. Verify each finding
before reporting it and rank by severity.
```

## 5. Ship and maintain

**Deploy**
```text
Use the frontend-deployment skill. Deploy <app> to <host>. Configure environment variables
(public prefix only for public values), security headers from the static-site template, caching,
404 and redirects, the custom domain and HTTPS, protected previews, monitoring and rollback.
Ask me before publishing. Afterwards verify headers with curl -sI and run the axe check on production.
```

**Works locally, broken in production**
```text
Use systematic-debugging with references/browser-debugging.md. Symptom: <what users see>.
Check environment variables, base paths, case-sensitive file names, SPA fallback, caching and CSP
first. Reproduce with a production build locally. Fix the root cause and add a regression test.
```

**Framework upgrade**
```text
Use the change-existing-code skill (section 4) and framework-frontend-engineering. Upgrade
<framework> from <version> to <version>, one major version at a time, with the official migration
guide and codemods. Run type-check, tests and visual tests after each step, and list breaking
changes and anything left to do.
```

**Adopt a tool that is not in the spec**
```text
Apply rule 04 section 9 to <tool/service>. Confirm the official source and package name, check
health, fit with our stack and support target, licence, privacy and data flows, permissions, cost,
and how we would remove it later. Recommend adopt or not, with reasons. Install nothing yet.
```
