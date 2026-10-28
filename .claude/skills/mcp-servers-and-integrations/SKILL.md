---
name: mcp-servers-and-integrations
description: Choose, vet, configure, secure and test Model Context Protocol (MCP) servers for design and front-end work - finding servers in the official MCP Registry and community lists (awesome-mcp-servers), preferring vendor-official servers, reviewing permissions and tool descriptions, pinning versions, keeping secrets out of .mcp.json, project-scope approval and CI behaviour in Claude Code, least privilege and the "lethal trifecta", testing with the MCP Inspector, connecting databases safely with Google's MCP Toolbox for Databases (read-only sources, dedicated identities, parameterised tools), and building your own server. Use when adding or reviewing an MCP server or connector, writing .mcp.json, connecting an agent to Figma, Penpot, a browser, Storybook, GitHub, a CMS, a commerce or payment platform, hosting, monitoring or a database, or when asked which MCP servers to use.
license: MIT
metadata:
  version: "1.0.0"
---

# MCP Servers and Integrations

An MCP server gives an agent tools, data and actions in another system. Every server is a dependency with privileges: adopt it like one ([04-dependencies](../../rules/04-dependencies.md) section 9) and secure it like one ([06-security](../../rules/06-security.md) section 7). The catalogue of verified servers for design and front-end work, with versions and sources, is in [references/mcp-catalog.md](references/mcp-catalog.md).

## 1. Decide whether you need a server

- Use a server when it gives the agent something it cannot get safely otherwise: structured design data (Figma, Penpot), a real browser (Playwright, Chrome DevTools), your component documentation (Storybook), or an account you would otherwise click through (hosting, CMS, issue tracker).
- Prefer what already exists in the session: a CLI the project already uses (`gh`, `vercel`, `netlify`, `psql`), the repository's own scripts, or a read-only export. Each connected server adds its tool descriptions to the model's context and adds attack surface.
- Connect only for the task and disconnect what you no longer use.

## 2. Find and vet a server

1. **Start from the vendor.** The vendor's documentation names its official server or remote endpoint (for example `https://mcp.figma.com/mcp`, `https://mcp.vercel.com`). Prefer it over a community server for the same product.
2. **Use directories for discovery only**: the official [MCP Registry](https://registry.modelcontextprotocol.io/), [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) (marks official implementations with 🎖️), [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) (separates official and community servers) and [Glama](https://glama.ai/mcp/servers). Listing is not review: most entries are small community projects.
3. **Check it like any dependency**: the publisher and repository are the vendor or a known maintainer; the package name on npm or PyPI points back to that repository; a licence exists (some official servers have none or use a source-available licence such as Sentry's FSL); recent releases and issue activity; not archived or deprecated (Storybook's standalone `mcp` repository was archived in favour of `@storybook/addon-mcp`; Sanity deprecated its local server in favour of `https://mcp.sanity.io`).
4. **Read what it exposes** before enabling it: every tool name, description and parameter, and which ones write, delete, deploy, buy or send. Tool descriptions are model input; a malicious server can hide instructions in them ("tool poisoning"), or change them after you approved it, so re-review on every update.
5. **Test it in isolation** with the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) (`npx @modelcontextprotocol/inspector@<version>`) against a test account before it touches real data.

## 3. Configure it safely

- **Pin versions** in shared configuration: `npx -y @playwright/mcp@0.0.83`, never `@latest`. Remote servers cannot be pinned, so record the endpoint and check the vendor's changelog.
- **Secrets stay out of files**: in Claude Code's `.mcp.json`, reference them as `${VAR}` (or `${VAR:-default}`), which expands in `command`, `args`, `env`, `url` and `headers`; keep the values in the environment or a secret manager. Prefer OAuth remote servers, which keep tokens out of configuration entirely.
- **Scopes in Claude Code**: `claude mcp add --transport http <name> <url>` writes to your local scope; `--scope project` writes `.mcp.json` for the team. Claude Code asks before using project servers in interactive sessions, but loads them without asking in `claude -p`, the Agent SDK and cloud sessions; in CI, block unexpected ones with `disabledMcpjsonServers` or start with `--strict-mcp-config`. Review every pull request that changes `.mcp.json` like code. Organisations can enforce allow and deny lists (`allowedMcpServers`, `deniedMcpServers`) in managed settings.
- **Other clients** (Cursor `.cursor/mcp.json`, VS Code, Gemini CLI `settings.json`, Windsurf) use similar JSON; follow each client's documentation and the same rules.

## 4. Least privilege and the lethal trifecta

- Give each server the narrowest access that does the job: read-only scopes and tokens, one project or team, a test or staging account, a fresh browser profile without personal logins.
- Avoid combining, in one session, **private data**, **untrusted content** (web pages, issues, design files, emails, user uploads) and a way to **send data out** (HTTP requests, posting, deploying, email). Together they let injected instructions exfiltrate data ([Simon Willison, "The lethal trifecta"](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)). Remove one of the three, or put a human approval in front of the outward step.
- Writes and outward actions through any server (editing a shared design file, deploying, publishing, purchasing, sending, deleting) need explicit human approval ([AGENTS.md](../../../AGENTS.md) section 2, [01-core-principles](../../rules/01-core-principles.md) section 8). Keep the client's confirmation prompts on.

## 5. Databases: MCP Toolbox for Databases

[MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox) (Google, Apache-2.0; v1.14.0 released 2026-10-08) connects agents to PostgreSQL, MySQL, SQL Server, Oracle, MongoDB, Redis, Elasticsearch, Snowflake, BigQuery, AlloyDB, Cloud SQL, Spanner, Firestore and others. It is useful for front-end work that needs real data shapes: checking a schema before writing a form, seeding realistic fixtures, or debugging a query behind a page.

1. **Prebuilt tools** for exploration: `npx -y @toolbox-sdk/server@1.14.0 --prebuilt=postgres --stdio`; narrow to a toolset such as `--prebuilt=postgres/data`. Connection details come from environment variables documented in the prebuilt reference.
2. **Custom tools** for anything repeatable: define `source`, `tool` and `toolset` entries in `tools.yaml` with parameterised statements (`$1`), so the agent fills values, not SQL. Put credentials in `${ENV_NAME}` references, never literal passwords.
3. **Read-only by construction**: set `readOnly: true` on the source and connect with a dedicated database identity that has `SELECT` on only the schemas and tables the agent needs. Never use owner, admin, migration or application-write accounts. The Toolbox documentation warns that client confirmations and keyword filters are not a database security boundary for dynamic `execute_sql` tools.
4. **Never point it at production** with write access. Use a staging copy or a read replica with masked personal data; follow the data-minimisation rules in [06-security](../../rules/06-security.md) section 8.
5. **Authenticate callers** for shared deployments with `authServices` and `authRequired` on tools, and prefer the binary or container image (pinned version) over `npx` for long-running servers. OpenTelemetry tracing is built in.

## 6. Build your own server

- Use the official SDKs ([TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk), `@modelcontextprotocol/sdk` 1.32.1 on 2026-10-22; Python and other SDKs on [modelcontextprotocol.io](https://modelcontextprotocol.io/)) and the [current specification](https://modelcontextprotocol.io/specification/latest).
- Expose small, specific tools with typed parameters rather than one "run anything" tool; validate every input at the boundary ([05-error-handling](../../rules/05-error-handling.md)); return data, not instructions.
- Follow the [MCP security best practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices) (OAuth for remote servers, no token passthrough, confused-deputy protection, session handling), test it with the Inspector, and add it to CI like any other service ([ci-cd-pipeline](../ci-cd-pipeline/SKILL.md)).

## 7. Done when

- [ ] The server is the vendor's official one, or its maintainer, licence, activity and permissions were checked and recorded
- [ ] Every tool it exposes was read; write and outward tools need human confirmation
- [ ] Version pinned (or remote endpoint recorded); secrets only in the environment or OAuth; `.mcp.json` reviewed
- [ ] Least privilege: read-only where possible, test or staging data, no trifecta without a human gate
- [ ] Tested with the MCP Inspector or a dry run before real use; removed when no longer needed
