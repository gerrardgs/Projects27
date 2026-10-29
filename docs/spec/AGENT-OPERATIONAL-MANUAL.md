# Agent Operational Manual

Which rules and skills to use for each kind of task, for AI agents and for the people directing them. The always-on core in [AGENTS.md](../../AGENTS.md) applies to every scenario. Paths below are relative to the repository root.

## 1. Scenario router

| Scenario | Read first | Then |
| :--- | :--- | :--- |
| New repository from an empty folder | [project-bootstrap](../../.agents/skills/project-bootstrap/SKILL.md) | [native-from-scratch](../../.agents/skills/native-from-scratch/SKILL.md), [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| New feature in an existing project | [change-existing-code](../../.agents/skills/change-existing-code/SKILL.md) | [test-engineering](../../.agents/skills/test-engineering/SKILL.md), rule [05](../../.agents/rules/05-error-handling.md) |
| Bug report or failing behaviour | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) | [test-engineering](../../.agents/skills/test-engineering/SKILL.md) for the regression test |
| Flaky test | [test-engineering](../../.agents/skills/test-engineering/SKILL.md) section 4 | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) |
| Refactoring | [change-existing-code](../../.agents/skills/change-existing-code/SKILL.md) | rule [02](../../.agents/rules/02-clean-code.md) |
| Dependency or runtime upgrade | [change-existing-code](../../.agents/skills/change-existing-code/SKILL.md) section 4 | rule [04](../../.agents/rules/04-dependencies.md) |
| Code review or pull request review | [rigorous-code-audit](../../.agents/skills/rigorous-code-audit/SKILL.md) | rule [06](../../.agents/rules/06-security.md) |
| Secret scanning setup, a blocked push or scanner finding, or a leaked credential | [secret-scanning](../../.agents/skills/secret-scanning/SKILL.md), rule [21](../../.agents/rules/21-secret-scanning.md) | [security-hardening](../../.agents/skills/security-hardening/SKILL.md) section 5 |
| Pre-release audit of the web, Android or iOS build, or a question about a shipped artifact | [reverse-engineering](../../.agents/skills/reverse-engineering/SKILL.md), rule [20](../../.agents/rules/20-reverse-engineering.md) | [mobile-engineering](../../.agents/skills/mobile-engineering/SKILL.md) |
| CodeRabbit review, its pull request comments, or `.coderabbit.yaml` | [coderabbit-review](../../.agents/skills/coderabbit-review/SKILL.md) | [rigorous-code-audit](../../.agents/skills/rigorous-code-audit/SKILL.md) |
| Work longer than one session, parallel sub-agents, or an unattended loop | [agent-delivery-loop](../../.agents/skills/agent-delivery-loop/SKILL.md), rule [19](../../.agents/rules/19-agentic-delivery-and-review.md) | [git-worktrees](../../.agents/skills/git-worktrees/SKILL.md) |
| Security review, auth, payments, uploads, personal data | [security-hardening](../../.agents/skills/security-hardening/SKILL.md) | [rigorous-code-audit](../../.agents/skills/rigorous-code-audit/SKILL.md) |
| Slow code or high memory | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) "Performance problems" | its [tools reference](../../.agents/skills/systematic-debugging/references/tools.md) |
| CI is failing | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) | [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| Set up or harden CI/CD | [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md) | [security-hardening](../../.agents/skills/security-hardening/SKILL.md) section 4 |
| Containerise or deploy | [deploy-and-release](../../.agents/skills/deploy-and-release/SKILL.md) | [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md) |
| Database schema change | [deploy-and-release](../../.agents/skills/deploy-and-release/SKILL.md) section 4 | [change-existing-code](../../.agents/skills/change-existing-code/SKILL.md) |
| Production incident | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) "Production incidents" | [deploy-and-release](../../.agents/skills/deploy-and-release/SKILL.md) section 6 |
| Commit, pull request, release | rule [08](../../.agents/rules/08-git-workflow.md) | |
| Documentation only | rule [01](../../.agents/rules/01-core-principles.md) section 7 | [project-bootstrap assets](../../.agents/skills/project-bootstrap/assets/) (README and ADR templates) |
| Question about the code, no change requested | rule [03](../../.agents/rules/03-verification.md) | Answer from the code you read, with file and line references; change nothing |
| New product, feature discovery, "who are the users?" | [ux-research-and-strategy](../../.agents/skills/ux-research-and-strategy/SKILL.md) | rule [09](../../.agents/rules/09-design-principles.md), [ui-design-and-prototyping](../../.agents/skills/ui-design-and-prototyping/SKILL.md) |
| Information architecture, navigation, sitemap | [ux-research-and-strategy](../../.agents/skills/ux-research-and-strategy/SKILL.md) section 5 | [design-critique-and-review](../../.agents/skills/design-critique-and-review/SKILL.md) |
| Design a screen, page, app or component | [ui-design-and-prototyping](../../.agents/skills/ui-design-and-prototyping/SKILL.md) | rules [09](../../.agents/rules/09-design-principles.md), [10](../../.agents/rules/10-accessibility.md), [14](../../.agents/rules/14-ux-writing-and-ethics.md) |
| Wireframe or prototype | [ui-design-and-prototyping](../../.agents/skills/ui-design-and-prototyping/SKILL.md) sections 2 and 4 | [motion-and-interaction](../../.agents/skills/motion-and-interaction/SKILL.md) |
| Logo, brand, social post, ad, poster, print file | [graphic-design-production](../../.agents/skills/graphic-design-production/SKILL.md) | rule [13](../../.agents/rules/13-visual-assets-and-licensing.md) |
| Chart, dashboard, infographic | [data-visualization-design](../../.agents/skills/data-visualization-design/SKILL.md) | rule [10](../../.agents/rules/10-accessibility.md) |
| Animation, transitions, micro-interactions | [motion-and-interaction](../../.agents/skills/motion-and-interaction/SKILL.md) | rule [12](../../.agents/rules/12-web-performance.md) |
| Animated titles, explainer, logo animation, Lottie or Rive file | [motion-graphics-and-animation](../../.agents/skills/motion-graphics-and-animation/SKILL.md) | rule [10](../../.agents/rules/10-accessibility.md) section 4 (flashing), [motion-and-interaction](../../.agents/skills/motion-and-interaction/SKILL.md) |
| Edit a video, export settings, loudness, captions, video on a website | [video-editing-and-post-production](../../.agents/skills/video-editing-and-post-production/SKILL.md) | its [web-media-pipeline](../../.agents/skills/video-editing-and-post-production/assets/web-media-pipeline/) template, rule [13](../../.agents/rules/13-visual-assets-and-licensing.md) |
| Colour grading, LUTs, ACES, HDR, colours differ between screens | [color-grading-and-color-management](../../.agents/skills/color-grading-and-color-management/SKILL.md) | [video-editing-and-post-production](../../.agents/skills/video-editing-and-post-production/SKILL.md) section 7 |
| Edit or retouch photos, web images, remove location data, label AI or retouched images | [photo-editing-and-retouching](../../.agents/skills/photo-editing-and-retouching/SKILL.md) | rule [13](../../.agents/rules/13-visual-assets-and-licensing.md) section 6, rule [14](../../.agents/rules/14-ux-writing-and-ethics.md) |
| Design tokens, theme, dark mode, component library | [design-system-and-tokens](../../.agents/skills/design-system-and-tokens/SKILL.md) | [css-architecture-and-responsive](../../.agents/skills/css-architecture-and-responsive/SKILL.md) |
| Figma, Penpot or screenshot to code | [design-to-code-handoff](../../.agents/skills/design-to-code-handoff/SKILL.md) | [frontend-testing-and-visual-qa](../../.agents/skills/frontend-testing-and-visual-qa/SKILL.md) |
| Claude Design, `/design`, `/design-sync`, an AI-generated design or deck to build | [ai-design-and-artifacts](../../.agents/skills/ai-design-and-artifacts/SKILL.md) | [design-to-code-handoff](../../.agents/skills/design-to-code-handoff/SKILL.md), rule [01](../../.agents/rules/01-core-principles.md) section 8 |
| Delete, remove, overwrite or "clean up" existing code, files or features | rule [01](../../.agents/rules/01-core-principles.md) section 8: stop, show what would go and why, offer alternatives, wait for approval | [change-existing-code](../../.agents/skills/change-existing-code/SKILL.md) |
| Security review, security audit, pen test of the code, "is this vulnerability real?" | [security-vulnerability-audit](../../.agents/skills/security-vulnerability-audit/SKILL.md) | [security-hardening](../../.agents/skills/security-hardening/SKILL.md), rule [06](../../.agents/rules/06-security.md) |
| Add, review or configure an MCP server; `.mcp.json`; connect an agent to a database | [mcp-servers-and-integrations](../../.agents/skills/mcp-servers-and-integrations/SKILL.md) | rules [04](../../.agents/rules/04-dependencies.md) section 9 and [06](../../.agents/rules/06-security.md) section 7 |
| A fix failed, the user says the answer is wrong, or you are stuck | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) section 7 (correct the thinking) | rule [01](../../.agents/rules/01-core-principles.md) section 1, rule [15](../../.agents/rules/15-clean-execution.md) section 3 |
| Figma link, Figma MCP server, Code Connect, Figma plugin | [figma-integration](../../.agents/skills/figma-integration/SKILL.md) | [design-to-code-handoff](../../.agents/skills/design-to-code-handoff/SKILL.md) |
| Keep code tokens in sync with Figma variables | [figma-integration](../../.agents/skills/figma-integration/SKILL.md) section 4 | [design-system-and-tokens](../../.agents/skills/design-system-and-tokens/SKILL.md) |
| Mobile app screen, iOS, Android, Flutter, React Native | [mobile-engineering](../../.agents/skills/mobile-engineering/SKILL.md) | rule [10](../../.agents/rules/10-accessibility.md), [figma-integration](../../.agents/skills/figma-integration/SKILL.md) section 5 |
| New website, landing page or portfolio | [frontend-from-scratch](../../.agents/skills/frontend-from-scratch/SKILL.md) | [web-performance-optimization](../../.agents/skills/web-performance-optimization/SKILL.md), [accessibility-audit](../../.agents/skills/accessibility-audit/SKILL.md) |
| React, Vue, Svelte, Angular, Astro, Next.js or Nuxt work | [framework-frontend-engineering](../../.agents/skills/framework-frontend-engineering/SKILL.md) | rule [11](../../.agents/rules/11-frontend-code.md) |
| Styling, layout or responsive bug | [css-architecture-and-responsive](../../.agents/skills/css-architecture-and-responsive/SKILL.md) section 6 | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) |
| Accessibility audit or fix, WCAG, EAA, ADA | [accessibility-audit](../../.agents/skills/accessibility-audit/SKILL.md) | rule [10](../../.agents/rules/10-accessibility.md) |
| Slow page, poor Core Web Vitals | [web-performance-optimization](../../.agents/skills/web-performance-optimization/SKILL.md) | rule [12](../../.agents/rules/12-web-performance.md) |
| UI tests, visual regression, cross-browser QA | [frontend-testing-and-visual-qa](../../.agents/skills/frontend-testing-and-visual-qa/SKILL.md) | [test-engineering](../../.agents/skills/test-engineering/SKILL.md) |
| Write or update project docs: PRD, architecture, tech stack, design, API, database, schema, security, testing, deployment | [project-documentation](../../.agents/skills/project-documentation/SKILL.md) | rule [16](../../.agents/rules/16-project-documentation.md), [project-bootstrap](../../.agents/skills/project-bootstrap/SKILL.md) |
| Output looks AI-generated or generic ("slop"): landing page, dashboard, copy, code comments | [anti-slop-filter](../../.agents/skills/anti-slop-filter/SKILL.md) | [design-critique-and-review](../../.agents/skills/design-critique-and-review/SKILL.md), rules [09](../../.agents/rules/09-design-principles.md) and [14](../../.agents/rules/14-ux-writing-and-ethics.md) |
| Review a design or UI | [design-critique-and-review](../../.agents/skills/design-critique-and-review/SKILL.md) | [accessibility-audit](../../.agents/skills/accessibility-audit/SKILL.md) |
| Review a front-end pull request | [rigorous-code-audit](../../.agents/skills/rigorous-code-audit/SKILL.md) | [design-critique-and-review](../../.agents/skills/design-critique-and-review/SKILL.md), rule [11](../../.agents/rules/11-frontend-code.md) |
| Interface copy, error messages, forms, consent | rule [14](../../.agents/rules/14-ux-writing-and-ethics.md) | rule [10](../../.agents/rules/10-accessibility.md) section 4 |
| Finding a trustworthy source on any design or front-end topic | [DESIGN-REFERENCES.md](DESIGN-REFERENCES.md) | rule [03](../../.agents/rules/03-verification.md) |
| Deploy a site, hosting, headers, domains, environment variables | [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md) | [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md) front-end templates |
| CMS, WordPress, Shopify, payments, auth UI, email, PWA, analytics | [web-integrations-and-platforms](../../.agents/skills/web-integrations-and-platforms/SKILL.md) | rule [04](../../.agents/rules/04-dependencies.md) section 9 |
| Works locally but broken when deployed; hydration, CORS, layout bugs | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md) with its [browser-debugging reference](../../.agents/skills/systematic-debugging/references/browser-debugging.md) | [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md) |
| Chaos engineering, resilience, offline or failure handling, SLOs | [resilience-and-chaos-engineering](../../.agents/skills/resilience-and-chaos-engineering/SKILL.md) | [systematic-debugging](../../.agents/skills/systematic-debugging/SKILL.md), [frontend-deployment](../../.agents/skills/frontend-deployment/SKILL.md) |
| "Which engineering concept applies here?" | [ENGINEERING-CONCEPTS.md](ENGINEERING-CONCEPTS.md) | the rule or skill it points to |
| Keep dependencies, tools and patches current; Dependabot; outdated or end-of-life versions | rule [04](../../.agents/rules/04-dependencies.md) section 2 ("Stay current continuously") | [ci-cd-pipeline](../../.agents/skills/ci-cd-pipeline/SKILL.md) templates `dependabot.yml` and `dependabot-auto-merge.yml` |
| A tool, framework or service this spec does not mention | rule [04](../../.agents/rules/04-dependencies.md) section 9 | [TOOLKIT.md](TOOLKIT.md) |
| Not sure how to phrase the request | [PROMPT-LIBRARY.md](PROMPT-LIBRARY.md) | |

## 2. Execution loop for any scenario

This is clean execution ([rule 15](../../.agents/rules/15-clean-execution.md)) in six steps; the result must also be clean code ([rule 02](../../.agents/rules/02-clean-code.md)).

1. **Understand**: restate the goal and acceptance criteria; list assumptions.
2. **Ground**: read the relevant code, manifests and tests; run the baseline build and tests.
3. **Plan**: the smallest correct change; for multi-step work, a numbered plan with checkpoints.
4. **Do**: one step at a time, following the rules and the chosen skill.
5. **Verify**: run the formatter, linter, type checker and tests; read the actual output.
6. **Report**: the format in `AGENTS.md` section 7: changed, verified, not done, risks.

## 3. Using the spec where files are not loaded automatically

- **Chat models (ChatGPT, Claude.ai, Gemini, DeepSeek, Llama, Qwen and others)**: paste `AGENTS.md` first, then the rule or skill for the task. For design work without a design file, attach screenshots and the brand guide, and ask the model to label estimated values. Tell the model it cannot run commands, so every result must be labelled unverified until you run it.
- **IDE or CLI agents that load only `AGENTS.md`**: the indexes in `AGENTS.md` direct the agent to open the right rule or skill file.
- **Sub-agents**: pass each one the task, the acceptance criteria, and the links to the relevant rule and skill files. Sub-agents start without the parent's context.

## 4. Capabilities matrix: what to do with the tools you have

Agents run with very different abilities. Use the best one available and say which you used.

| Capability | Use it for | Without it |
| :--- | :--- | :--- |
| Shell and file access | Run formatters, linters, tests, builds, the token pipeline and the link checker | Mark every result unverified; give the user the commands |
| Figma MCP server or Penpot MCP server | Exact layout, variables, components, Code Connect mappings, screenshots ([figma-integration](../../.agents/skills/figma-integration/SKILL.md)) | Ask for Dev Mode exports, a token file or screenshots; label values as estimates |
| Figma REST API token | Variables-to-tokens sync in CI | Use a plugin export or `get_variable_defs` per selection |
| Browser automation (Playwright MCP, Chrome DevTools MCP, computer use, or local Playwright) | See the rendered UI, console errors, network, performance traces, keyboard flows, axe scans | Say the UI was not seen rendered; provide test steps |
| Image input (vision) | Compare a build with a design or screenshot; critique layouts | Work from code and specs; ask for descriptions |
| Network access | Verify versions, Baseline status, licences and links | Use lockfiles and installed docs; label facts as unverified |
| Sub-agents | Parallel audits (accessibility, performance, visual QA) with one skill each | Do the passes one after another |
| Hooks (Claude Code `PreToolUse`/`PostToolUse`, Git pre-commit) | Enforce formatting, linting and secret scanning deterministically | Rely on the rules and CI |

## 5. CLI first, small output

Every line of output an agent reads costs tokens. This section holds the full text of Projects 24 non-negotiable 14 and rule 15 section 2 (version 1.13.0). In Projects 27 it lives here, on demand, because the always-on core is at its 20,000-token budget; rule 15 section 2 points here.

**Run processes through the CLI, and keep their output small.** Install, build, test, lint, serve, git and deploy through the terminal with the project's own scripts, not step by step through chat, a browser or MCP tools; use those only for what a command cannot do (a visual check). Read summaries and exit codes, not whole logs: the project's `verify` script or `node scripts/run-quiet.mjs -- <command>` prints one line per passing step and only the tail of a failure.

- Prefer one command that checks everything and prints a summary: the project's `verify` script (`npm run verify` here; add one when bootstrapping a project), or `node scripts/run-quiet.mjs -- <command>` for any command (one `PASS` line on success; the last lines and the path of the full log on failure).
- Use quiet and summary modes that the tool documents: `npm ci --no-audit --no-fund`, `node --test --test-reporter=dot`, `npx biome ci --reporter=summary`, `playwright test --reporter=line`, `pytest -q`, `ruff check --output-format concise`, `git status --short`, `git diff --stat`, `git log --oneline -n 10`. Check `--help` for the version in use before relying on a flag.
- Long output goes to a file; read only the failing part (`grep`, `tail`, the test name), never the whole log or file back into the conversation.
- Start long-running processes (dev servers, watchers, preview builds) in the background, wait for readiness with a command (`curl --retry`), and stop them when done.
- Batch independent commands, and do not re-run what already passed unless its inputs changed.
- Browser, MCP and computer-use tools are for what a command cannot show: the rendered result, a visual comparison, a design file. Script repeatable browser checks (Playwright, axe-core, Lighthouse CLI) instead of clicking through them.

## 6. What humans should still do

- Approve anything irreversible or outward-facing: deletions, force pushes, migrations, deployments, publishing sites or social posts, changes to shared design libraries, messages to other people.
- Judge design quality and brand fit, and run usability tests with real people; an agent can check rules, not taste or real user behaviour.
- Review diffs before merging; an agent's report is a summary, not proof.
- Keep the "Project profile" in `AGENTS.md` current, so agents run the right commands.
- Re-verify dated facts (runtime versions, tool locations, action SHAs) periodically; `node scripts/agents-sync.mjs` checks structure, not the outside world.
