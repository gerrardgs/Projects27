# Using MCP Servers: Find, Vet, Configure

How to add Model Context Protocol servers to an agent or a coding assistant without handing an unknown program your files, credentials and data. Sources checked on 2026-10-22; each client section links its official documentation.

An MCP server is code that runs with your permissions (a local `stdio` process) or a remote service that receives what your agent sends it. Its tool descriptions and results reach the model as text, so a malicious or compromised server can also inject instructions. Treat every server as a dependency **and** as untrusted input ([rule 04](../../../rules/04-dependencies.md), [rule 06](../../../rules/06-security.md)).

## 1. Where to find servers

| Source | What it is | Trust level |
| :--- | :--- | :--- |
| [Official MCP Registry](https://registry.modelcontextprotocol.io/) | Published servers, the place the [reference servers repository](https://github.com/modelcontextprotocol/servers) points to | Listing is not an audit; vet each server |
| [Reference servers](https://github.com/modelcontextprotocol/servers) (Everything, Fetch, Filesystem, Git, Memory, Sequential Thinking, Time) | Maintained by the MCP steering group; their README says they are "reference implementations" and not production-ready | Learn from them; harden before real use |
| Vendor-official servers, such as [MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox) from Google | Maintained by the company that owns the product | Higher, still vet configuration and permissions |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) (MIT, synced with the [Glama directory](https://glama.ai/mcp/servers)) | Very large community list by category; legend marks official implementations, language, local or cloud scope and OS. It carries advertisements | Discovery only |
| [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) (MIT) | Curated list split into reference, official and community servers, plus clients and frameworks; it lists sponsors | Discovery only |

Popularity, stars and a place on a list are not evidence of safety.

## 2. Vet before you install

1. **Need**: an existing tool, an official server, or a few lines of your own code may be enough; every server widens what the agent can reach.
2. **Publisher and code**: official organisation or known maintainer, public source, licence compatible with your use, recent releases, open security issues. Read the tool list and every tool description; descriptions that tell the model to do things beyond the tool's purpose are a red flag.
3. **Permissions**: what it can read, write, delete, execute or send, and to which hosts. Prefer servers with read-only modes, allow-lists for paths and hosts, and per-tool switches.
4. **Credentials**: a dedicated, least-privilege, short-lived token or database user per server; never your personal admin credentials. Secrets come from environment variables, never from the committed configuration.
5. **Pin it**: an exact package version or image digest (`@toolbox-sdk/server@1.14.0`, not `@latest` or an unpinned `npx -y package`), verified checksums for downloaded binaries, and review before upgrading.
6. **Contain it**: run local servers in a container or sandbox with only the folders and network access they need; prefer `stdio` for local use so no port is opened; for HTTP servers bind to `127.0.0.1`, restrict allowed hosts and origins, and require authentication.
7. **Keep confirmations on**: leave per-tool approval prompts enabled; allow only the tools you need (tool allow-lists below); never mark a third-party server as trusted to skip confirmations.
8. **Try it safely**: inspect the server with the official [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) and test against non-production data first.
9. **Review regularly**: remove servers you no longer use; re-vet after updates.

The [MCP security best practices](https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices) and the [AI agent systems skill](../SKILL.md) section 2 apply to every server you add or build.

## 3. Client configuration (verified against each official page)

| Client | Project file | Shape | Secrets | Tool filtering and approval |
| :--- | :--- | :--- | :--- | :--- |
| [Claude Code](https://code.claude.com/docs/en/mcp) | `.mcp.json` at the project root (`claude mcp add --scope project ...`) | `mcpServers` → `command`, `args`, `env` (stdio) or `type: "http"`, `url`, `headers` | `${VAR}` and `${VAR:-default}` expansion | Asks for approval before using project-scoped servers in interactive sessions; non-interactive runs (`claude -p`, Agent SDK) load them without asking |
| [VS Code (Copilot)](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) | `.vscode/mcp.json` (the guided flow marks it deprecated) or the user profile | top-level `servers`; portable files use `mcpServers` | Do not paste or commit credentials | "Only trust configurations you have reviewed" |
| [Cursor](https://cursor.com/docs/context/mcp) | `.cursor/mcp.json` | `mcpServers` | `${env:NAME}` in `command`, `args`, `env`, `url`, `headers` | Install only from trusted sources |
| [Gemini CLI](https://geminicli.com/docs/tools/mcp-server/) | `settings.json` | `mcpServers` → `command` / `url` / `httpUrl`, `args`, `env`, `cwd`, `timeout` | `$VAR` or `${VAR}` in `env`; sensitive host variables are stripped unless listed | `includeTools`, `excludeTools`; `trust: true` bypasses all confirmations, so leave it `false` for servers you do not control |
| [Codex](https://learn.chatgpt.com/docs/extend/mcp) | `~/.codex/config.toml`, or `.codex/config.toml` in trusted projects | `[mcp_servers.<name>]` → `command`, `args`, `env` or `url` | `bearer_token_env_var` names the variable holding a token | `enabled_tools`, `disabled_tools` |
| [Antigravity](https://antigravity.google/docs/mcp) | `.agents/mcp_config.json` (workspace) or `~/.gemini/config/mcp_config.json` | `mcpServers` → `command` or `serverUrl` (not `url`/`httpUrl`), `args`, `env`, `headers` | OAuth tokens kept locally | `disabledTools`; unconfigured MCP tools default to Ask mode |

Commit a project configuration only when every server in it is vetted and pinned, and only with variable references for secrets. Teammates' clients will start those servers.

## 4. MCP Toolbox for Databases

[googleapis/mcp-toolbox](https://github.com/googleapis/mcp-toolbox) (Apache-2.0, v1.14.0 released 2026-10-08) is an open-source MCP server for databases: PostgreSQL, MySQL, SQL Server, SQLite, Oracle, MongoDB, Redis, BigQuery, Spanner, AlloyDB, Cloud SQL, Snowflake, Neo4j and more. It serves two purposes: prebuilt generic tools for development (`--prebuilt=<database>`, for example `list_tables` and `execute_sql`), and a framework of custom tools defined in `tools.yaml` for production agents, with client SDKs for Python (`toolbox-core`), JavaScript (`@toolbox-sdk/core`), Go and Java.

Use it safely (from the [tools documentation](https://mcp-toolbox.dev/documentation/configuration/tools/), the [sources documentation](https://mcp-toolbox.dev/documentation/configuration/sources/) and `toolbox --help`):

- Production agents get **custom tools with fixed statements and bound `parameters`**, grouped in a toolset per agent. Avoid `templateParameters` (the documentation warns they are prone to SQL injection); if you must use them, restrict them with `allowedValues`.
- Keep `execute_sql` and other prebuilt generic tools to development databases.
- Database credentials live in the source configuration as `${ENV_NAME}`, for a database user with the minimum grants (read-only where possible); never pass credentials as tool parameters.
- Set accurate annotations (`readOnlyHint`, `destructiveHint`) and require authentication (`authRequired`, authenticated parameters, MCP authorization scopes) for anything beyond local use.
- Local use: `--stdio`. HTTP: keep `--address 127.0.0.1`, and narrow `--allowed-hosts` and `--allowed-origins`, which default to `*`. `--disable-version-check` stops the start-up check for newer versions.
- Pin the version and verify the binary's SHA-256 against the release page. The README's own examples mix versions (binary 1.14.0, container 0.24.0), so take the version from the release you verified.

A tested read-only example with an end-to-end MCP test is in [assets/mcp-toolbox-sqlite](../assets/mcp-toolbox-sqlite/).
