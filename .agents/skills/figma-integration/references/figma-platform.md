# Figma platform reference

Checked in Figma's official documentation on 2026-10-15. Figma changes plans, seats, limits and tools often: re-check the linked page before quoting a fact to a user.

## Figma MCP server

| Topic | Fact | Source |
| :--- | :--- | :--- |
| Servers | Remote server (recommended, broadest feature set, hosted at `https://mcp.figma.com/mcp`) and desktop server (runs from the Figma desktop app). Figma for Government supports the desktop server only | [Introduction](https://developers.figma.com/docs/figma-mcp-server/), [Guide (Help Center)](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) |
| Clients | Only clients listed in the Figma MCP catalog can connect | [MCP catalog](https://www.figma.com/mcp-catalog) |
| Setup per client | Claude Code, Cursor, VS Code, Gemini CLI and others | [Claude Code](https://help.figma.com/hc/en-us/articles/39888612464151-Claude-Code-and-Figma-Set-up-the-MCP-server), [Cursor](https://help.figma.com/hc/en-us/articles/39889260656407-Cursor-and-Figma-Set-up-the-MCP-server), [VS Code](https://help.figma.com/hc/en-us/articles/39890361040535-VS-Code-and-Figma-Set-up-the-MCP-server), [Gemini CLI](https://help.figma.com/hc/en-us/articles/39889246888855-Gemini-CLI-and-Figma-Set-up-the-MCP-server), [remote setup](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/) |
| Rate limits | View and Collab seats: up to 20 calls a month. Dev and Full seats: per-day and per-minute limits by plan (for example up to 200 a day on Professional). Limits apply to read tools; `add_code_connect_map`, `create_new_file` and `whoami` are exempt | [Rate limits and access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/) |
| File preparation | Components, Code Connect, variables, semantic names, auto layout, annotations, dev resources | [Structure your Figma file](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/) |
| Skills | Figma publishes agent skills for MCP workflows, recommended for write-to-canvas | [Figma skills for MCP](https://help.figma.com/hc/en-us/articles/39166810751895-Figma-skills-for-MCP) |

### Tools (from [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/))

Read tools:

| Tool | Use | Notes |
| :--- | :--- | :--- |
| `get_design_context` | Design context for a layer or selection, as code | Defaults to React with Tailwind; ask for your stack. Remote needs a link to a frame or layer |
| `get_variable_defs` | Variables and styles used in a selection | Tokens for that selection |
| `get_screenshot` | PNG screenshot of a selection | Visual reference and fidelity checks |
| `get_metadata` | Sparse XML outline (IDs, names, types, positions, sizes) | Use on large selections before fetching context for parts |
| `get_code_connect_map` | Node IDs mapped to code components | Remote supports framework and language filters |
| `get_figjam` | FigJam diagrams as XML with screenshots | Flows and diagrams |
| `get_motion_context` | Keyframe animation data and code snippets | Motion handoff |
| `download_assets` (remote) | Exports and source images | Up to 20 nodes per call; PNG, JPG, SVG, PDF |
| `search_design_system`, `get_libraries` (remote) | Find components, variables and styles in libraries | |
| `whoami` (remote) | Identity, plans and seats | |

Write tools (remote unless noted): `use_figma` (general create, edit, inspect), `generate_figma_design` (design layers from interfaces), `create_new_file`, `upload_assets` (PNG, JPG, GIF, WebP up to 10 MB), `generate_diagram` (FigJam from Mermaid or natural language), `add_code_connect_map`, `send_code_connect_mappings`, plus tools for generative plugins, shaders and images. Prompt: `create_design_system_rules` writes a rules file with your design system and stack context.

Deprecated: `list_shader_effects`, `list_shader_fills`, `get_shader_effect`, `get_shader_fill` (replaced by `list_shaders` and `get_shader`).

## Code Connect

| Topic | Fact | Source |
| :--- | :--- | :--- |
| Availability | Dev or Full seat on Organization and Enterprise plans | [Code Connect](https://developers.figma.com/docs/code-connect/) |
| CLI | Figma documents `npm install --global @figma/code-connect@latest`; in projects using this spec, pin it instead as a dev dependency (`npm install --save-dev --save-exact @figma/code-connect@<version>`, 2.0.2 on 2026-10-15; Node.js 18+) and run `npx --no-install figma connect publish`; `npx figma connect unpublish --node=<url> --label=<label>`; see `--help` for all commands | [Quickstart](https://developers.figma.com/docs/code-connect/quickstart-guide/) |
| Token | Personal access token with Code Connect Write and File content Read; `FIGMA_ACCESS_TOKEN` environment variable or `--token` | Quickstart |
| Config | `figma.config.json` at the repository root, with a `codeConnect` object (`include`, `label`, `language`, and more) | Quickstart |
| Languages | React and React Native; HTML (Web Components, Angular, Vue); SwiftUI; Jetpack Compose; template files (`*.figma.ts`) for any stack | [Code Connect](https://developers.figma.com/docs/code-connect/) |
| UI | Connect components inside Figma with GitHub access; supports one design component mapped to several implementations | Code Connect |
| With MCP | Mappings make the MCP server return your components | [Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/) |

## REST API

| Topic | Fact | Source |
| :--- | :--- | :--- |
| Base URL | `https://api.figma.com` | [REST API](https://developers.figma.com/docs/rest-api/) |
| Personal access token | Sent in the `X-Figma-Token` header; created under Settings → Security with an expiry and scopes; shown once; revocation is instant | [Personal access tokens](https://developers.figma.com/docs/rest-api/personal-access-tokens/) |
| OAuth | Preferred for apps acting for users | [Authentication](https://developers.figma.com/docs/rest-api/authentication/) |
| Scopes | Granular scopes such as `file_content:read`, `file_metadata:read`, `file_variables:read` and `file_variables:write` (Enterprise only), `file_dev_resources:read/write`, `library_content:read`, `webhooks:read/write`. `files:read` is deprecated | [Scopes](https://developers.figma.com/docs/rest-api/scopes/) |
| Variables | `GET /v1/files/:file_key/variables/local` (Tier 2 rate limit), `GET .../variables/published`, `POST .../variables`; Full seat in an Enterprise organisation | [Variables endpoints](https://developers.figma.com/docs/rest-api/variables-endpoints/), [types](https://developers.figma.com/docs/rest-api/variables-types/) |
| Official typings | `@figma/rest-api-spec` (0.44.0 on 2026-10-15, MIT), generated from Figma's OpenAPI specification | [GitHub](https://github.com/figma/rest-api-spec) |
| Colours | sRGB channels from 0 to 1; composed colours carry opacity as a percentage from 0 to 100 | Variables types |

## Plugins, widgets, Dev Mode

| Topic | Source |
| :--- | :--- |
| Plugin API and manifest | [Plugins docs](https://developers.figma.com/docs/plugins/) |
| Typings | `@figma/plugin-typings` (1.141.0 on 2026-10-15) |
| Lint rules | `@figma/eslint-plugin-figma-plugins` (1.0.0 on 2026-10-15) |
| Widgets | [Widgets docs](https://developers.figma.com/docs/widgets/) |
| Codegen plugins for Dev Mode | [Codegen plugins](https://developers.figma.com/docs/plugins/codegen-plugins/): `"editorType": ["dev"]` and the `"codegen"` capability |
| Dev Mode | [Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode) |
| Annotations and measurements | [Add measurements and annotate designs](https://help.figma.com/hc/en-us/articles/20774752502935-Use-annotations-to-convey-design-details) |
| Variables | [Guide to variables](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma) |
| Figma for VS Code | Extension `figma.figma-vscode-extension` |

## Other design-tool and browser integrations for agents

| Integration | Package (npm, 2026-10-15) | What it gives an agent | Source |
| :--- | :--- | :--- | :--- |
| Penpot MCP server | `@penpot/mcp` 2.15.4 | Read and edit Penpot files; hosted or local | [Penpot help](https://help.penpot.app/mcp/), [source](https://github.com/penpot/penpot/tree/develop/mcp) |
| Playwright MCP | `@playwright/mcp` 0.0.83 | Drive a browser through accessibility snapshots: navigate, click, fill, read pages | [GitHub](https://github.com/microsoft/playwright-mcp) |
| Chrome DevTools MCP | `chrome-devtools-mcp` 1.10.1 | Inspect a live Chrome: console with source-mapped stacks, network, performance traces, screenshots | [GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp) |

Browser-automation servers can read and change browser data. Use a fresh profile without personal logins, and keep secrets out of the session. More vendor-official servers (Storybook, shadcn/ui, hosting, CMS, databases) with versions checked on 2026-10-22 are in the [MCP catalog](../../mcp-servers-and-integrations/references/mcp-catalog.md); `chrome-devtools-mcp` was at 1.11.0 on that date.
