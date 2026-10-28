# Data store reference

Choose by access pattern, consistency need and operational capacity. A relational database is the right default for most business data.

| Need | Typical choice | Watch out for |
| :--- | :--- | :--- |
| Transactions, relations, ad-hoc queries | PostgreSQL, MySQL/MariaDB, SQL Server, SQLite (embedded, single writer) | Missing indexes, long transactions, lock contention |
| Flexible documents keyed by ID | MongoDB, or JSON columns in PostgreSQL (`jsonb`) | Unbounded document growth, missing schema validation |
| Cache, sessions, counters, rate limits | Redis or Valkey | Treat as volatile unless persistence is configured; set TTLs |
| Full-text and log search | OpenSearch, Elasticsearch, PostgreSQL full-text search | Index mapping changes need reindexing |
| Vector similarity search | pgvector, Qdrant, Milvus, Weaviate, Chroma, LanceDB, FAISS (library) | See [rag-systems](../../rag-systems/SKILL.md) |
| Time series and metrics | Prometheus (monitoring), TimescaleDB, ClickHouse | Cardinality explosions from unbounded label values |
| Analytics over large data | DuckDB (embedded), ClickHouse, cloud warehouses, lakehouse tables (Apache Iceberg, Delta Lake, Apache Hudi) | See [data-engineering](../../data-engineering/SKILL.md) |
| Event streams and logs | Apache Kafka (and compatible), cloud streaming services | Partitioning keys decide ordering and parallelism |
| Work queues | RabbitMQ, cloud queues (SQS, Pub/Sub, Service Bus), Redis-based queues, Celery (Python) | At-least-once delivery: consumers must be idempotent |
| Object and file storage | S3-compatible object storage | Never public by default; signed URLs for client access |

## Relational essentials

- **Isolation levels**: know your database's default (PostgreSQL defaults to Read Committed). Use `SERIALIZABLE` or explicit locks (`SELECT ... FOR UPDATE`) for check-then-act logic, and retry serialization failures.
- **Indexes**: index foreign keys and columns in `WHERE`, `JOIN` and `ORDER BY` on hot paths; composite index column order follows the query; measure write cost.
- **Query plans**: read `EXPLAIN (ANALYZE, BUFFERS)` in PostgreSQL or `EXPLAIN ANALYZE` in MySQL before and after an optimization.
- **Migrations**: tools such as Flyway, Liquibase, Alembic, Prisma Migrate, Django and Rails migrations, golang-migrate. Lock-heavy operations (adding a non-null column with a default on old versions, building non-concurrent indexes, type changes on large tables) need a zero-downtime plan.
- **Backups**: automated, encrypted, tested by restoring regularly; point-in-time recovery for production.
- **AI agent access**: give agents fixed, parameterized queries through a dedicated least-privilege database user (read-only where possible), not free-form SQL; [MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox) serves such tools over MCP ([example and safety notes](../../ai-agent-systems/references/mcp-servers.md)).

## Editor support (VS Code extension IDs, checked on the Marketplace)

`ms-ossdata.vscode-pgsql` (PostgreSQL), `ms-mssql.mssql` (SQL Server), `mongodb.mongodb-vscode` (MongoDB), `mtxr.sqltools` (multi-database SQL client).
