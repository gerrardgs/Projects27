# MCP Toolbox for Databases: read-only SQLite example

A tested, least-privilege configuration for [MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox) (Apache-2.0). An agent connected to it can call two fixed, parameterized, read-only queries over a product catalog, and nothing else: no arbitrary SQL, no writes, no schema access. Tested on 2026-10-22 with Toolbox v1.14.0 on macOS (Apple Silicon), directly and through `npx @toolbox-sdk/server@1.14.0`; the repository's CI runs the same test with the Linux x86-64 binary.

| File | Purpose |
| :--- | :--- |
| `tools.yaml` | Source (path from `CATALOG_DB`), two `sqlite-sql` tools with bound `?` parameters and read-only annotations, one toolset |
| `seed.sql` | Synthetic demo data |
| `mcp.example.json` | Client configuration for Claude Code's project file `.mcp.json` (`${CATALOG_DB}` expansion); Cursor's `.cursor/mcp.json` uses the same shape with `${env:CATALOG_DB}`. Other clients: [MCP servers reference](../../references/mcp-servers.md) |
| `test_toolbox_smoke.py` | Starts the real server over the MCP stdio transport and checks the tool list, results, injection attempts and unknown tools |

## Run it

```bash
# 1. Get the pinned binary and check it against the SHA-256 on the release page
#    https://github.com/googleapis/mcp-toolbox/releases/tag/v1.14.0
curl -sSL -o toolbox https://storage.googleapis.com/mcp-toolbox-for-databases/v1.14.0/linux/amd64/toolbox
echo "8ff7c6034d792e2754999e101116ac63b8a9fb926dd2f736065d8e0ef85ead22  toolbox" | sha256sum -c
chmod +x toolbox
#    (macOS Apple Silicon: .../v1.14.0/darwin/arm64/toolbox,
#     SHA-256 d1578b3f551b1aa0947c7b377716cd5e8b9448ac5a79fdc1e06dc11a69bbe334, check with shasum -a 256)

# 2. Run the end-to-end test (it creates its own temporary database)
TOOLBOX_BIN=$PWD/toolbox python -m unittest -v

# 3. Use it from an MCP client: create the database, then point the client at tools.yaml
python -c "import sqlite3; sqlite3.connect('catalog.db').executescript(open('seed.sql').read())"
export CATALOG_DB=$PWD/catalog.db
./toolbox --config tools.yaml --stdio --disable-version-check
```

Without a downloaded binary, `npx -y @toolbox-sdk/server@1.14.0 --config tools.yaml --stdio` runs the same server (Node.js required); pin the version, because an unpinned `npx` runs whatever is latest.

## Why it is configured this way

- **Fixed statements with bound parameters.** The model supplies values, never SQL. `templateParameters` can replace identifiers and the Toolbox documentation warns they are prone to SQL injection; this example does not use them. The test sends `BK-001' OR '1'='1` and `x'; DROP TABLE products; --` and gets no rows.
- **Read-only annotations** (`readOnlyHint: true`, `destructiveHint: false`) so clients can tell these tools apart from ones that change data.
- **No secrets in the file.** Values come from the environment with `${ENV_NAME}`, as the Toolbox documentation recommends. For server databases, connect with a dedicated database user that has only `SELECT` on the tables the tools need.
- **stdio for local use.** It opens no network port. If you run the HTTP server instead, keep the default `--address 127.0.0.1` and set `--allowed-origins` and `--allowed-hosts` (both default to `*`); put authentication (`authRequired`, MCP authorization) in front of anything reachable by others.
- **No prebuilt generic tools in production.** `--prebuilt=<database>` adds broad tools such as `execute_sql`; use them only against development databases you can lose, and prefer a custom toolset like this one for agents.
