# Technology catalog

Widely used technologies by category. This is a map, not an endorsement and not a complete list: any technology not listed here is adopted with the procedure in [SKILL.md](../SKILL.md).

**Verification on 2026-10-15:** 177 package names were confirmed in their official registries with `scripts/tech-lookup.mjs` (npm, PyPI, Go module proxy, crates.io, Maven Central, NuGet, RubyGems, Packagist, Hex, pub.dev). 101 open-source projects were confirmed on GitHub and checked for archived status. Commercial platforms were confirmed by their official websites responding (a few answered 403 or 429 to automated requests, which still proves the site exists; ServiceNow's site did not respond from the checking environment). Versions are deliberately omitted because they change weekly: get them live with `node scripts/tech-lookup.mjs`.

**Licence and status notes found during verification:**
- `minio/minio` is **archived** on GitHub: do not choose it for new work without checking its current status.
- `ansible-core` is GPL-3.0-or-later; Terraform is under the Business Source License 1.1 (OpenTofu is MPL-2.0); `ultralytics` is AGPL-3.0; Strapi's npm package points to its own LICENSE file; Soda Core's metadata says proprietary. Check that licences like these fit your use before adopting.
- TorchServe is archived (see [ml-inference-serving](../../ml-inference-serving/SKILL.md)).

## Languages and runtimes

JavaScript and TypeScript (Node.js, Deno, Bun), Python, Go, Rust, Java and Kotlin (JVM), C# and F# (.NET), C and C++, PHP, Ruby, Swift, Dart, Elixir. Toolchains: [project-bootstrap toolchains](../../project-bootstrap/references/toolchains.md). Supported versions: `node scripts/tech-lookup.mjs eol:nodejs eol:python eol:go eol:eclipse-temurin eol:dotnet eol:php eol:ruby` (Java is tracked per distribution, for example `eclipse-temurin`, `amazon-corretto`, `oracle-jdk`; endoflife.date listed 485 products on 2026-10-15, with identifiers at https://endoflife.date/api/v1/products).

## Backend web frameworks

| Language | Frameworks |
| :--- | :--- |
| JavaScript / TypeScript | Express, Fastify, NestJS, Hono, Koa |
| Python | Django, FastAPI, Flask, Litestar, Starlette, Tornado, aiohttp |
| Go | `net/http` (standard library), Gin, Echo, Chi, Fiber |
| Rust | Axum, Actix Web, Rocket (on Tokio) |
| Java / Kotlin | Spring Boot, Quarkus, Micronaut, Ktor |
| C# / .NET | ASP.NET Core (part of the .NET SDK) |
| PHP | Laravel, Symfony, Slim |
| Ruby | Rails, Sinatra, Hanami |
| Elixir | Phoenix |

## Frontend and full-stack web

React, Next.js, React Router (formerly Remix), Vue, Nuxt, Angular, Svelte and SvelteKit, SolidJS, Astro; styling with Tailwind CSS; data and API layers with TanStack Query, Apollo (GraphQL), tRPC. Domain guidance: [web-frontend-engineering](../../web-frontend-engineering/SKILL.md).

## Mobile and desktop

Flutter (state and data libraries: Riverpod, Bloc, Dio, go_router, Drift), React Native and Expo, native Kotlin and Swift, Capacitor and Ionic, Electron, Tauri. Domain guidance: [mobile-engineering](../../mobile-engineering/SKILL.md).

## Data access and ORMs

| Ecosystem | Libraries |
| :--- | :--- |
| JavaScript / TypeScript | Prisma, Drizzle ORM, TypeORM, Sequelize, Mongoose; drivers `pg`, `mysql2`, `ioredis` |
| Python | SQLAlchemy, Django ORM, Alembic; drivers `psycopg`, `pymongo`, `motor`, `redis` |
| Go | `database/sql`, pgx, GORM, Ent |
| Rust | SQLx, Diesel, SeaORM |
| Java / Kotlin | Hibernate ORM (JPA), Flyway, Liquibase, jOOQ |
| C# / .NET | Entity Framework Core, Dapper, Npgsql, StackExchange.Redis |
| PHP | Doctrine ORM, Laravel Eloquent |
| Ruby | Active Record |
| Elixir | Ecto |

## Databases and storage

| Kind | Technologies |
| :--- | :--- |
| Relational | PostgreSQL, MySQL, MariaDB, SQLite, Microsoft SQL Server, Oracle Database, CockroachDB |
| Document | MongoDB |
| Key-value and cache | Redis, Valkey |
| Wide-column | Apache Cassandra, ScyllaDB |
| Analytical | ClickHouse, DuckDB, cloud data warehouses (for example Snowflake, BigQuery, Redshift, Databricks) |
| Search | Elasticsearch, OpenSearch |
| Graph | Neo4j |
| Time series | InfluxDB, TimescaleDB |
| Vector | pgvector, Qdrant, Milvus, Weaviate, Chroma, LanceDB |
| Object storage | S3-compatible cloud storage, Ceph |
| Backend-as-a-service | Supabase, Firebase |

Selection guidance: [backend-engineering data stores](../../backend-engineering/references/data-stores.md).

## Messaging, streaming and workflows

Apache Kafka (clients such as `kafkajs`, `confluent-kafka`, `kafka-clients`), RabbitMQ, NATS, Apache Pulsar, Redis Streams; job queues BullMQ, Celery, Sidekiq, Oban; durable workflows Temporal; data orchestration Apache Airflow, Dagster, Prefect; integration and automation Apache Camel, Apache NiFi, n8n, Node-RED, Airbyte. Realtime web: Socket.IO, WebSockets, server-sent events.

## APIs and gateways

OpenAPI (generator: OpenAPI Generator), GraphQL (`graphql`, Apollo Server, Absinthe), gRPC (`grpc`, `grpc-go`, Tonic, Grpc.AspNetCore), tRPC; gateways and proxies NGINX, Apache HTTP Server, Caddy, Envoy, Traefik, Kong; service mesh Istio, Linkerd, Cilium. Third-party API work: [api-integration](../../api-integration/SKILL.md).

## Identity and security platforms

Keycloak, Ory Kratos, ZITADEL, Auth0, Okta, Microsoft Entra ID, Firebase Authentication, Supabase Auth; secrets with HashiCorp Vault and OpenBao; certificates with cert-manager; host security with Wazuh and osquery. Libraries: Passport (Node.js), `jsonwebtoken`, Devise (Rails). Security tooling: [security-hardening tools](../../security-hardening/references/tools.md).

## Build, package and monorepo tools

npm, pnpm, Yarn, Bun, Deno; pip, uv, Poetry, Hatch, tox, nox; Go modules; Cargo; Maven, Gradle; NuGet and the `dotnet` CLI; Composer; Bundler; Mix; CMake, Make, Bazel; monorepos with Nx and Turborepo.

## Testing

Unit and integration: Jest, Vitest, `node:test`, pytest, `unittest`, Go `testing` with testify, `cargo test`, JUnit Jupiter with AssertJ and Mockito, xUnit, NUnit and MSTest with NSubstitute, RSpec, PHPUnit and Pest, ExUnit. Browser and mobile: Playwright, Cypress, Selenium, WebdriverIO, Appium. BDD and acceptance: Cucumber, Behave, Robot Framework. Services: Testcontainers, Pact, k6, Locust. Guidance: [test-engineering](../../test-engineering/SKILL.md) and [quality-assurance](../../quality-assurance/SKILL.md).

## Resilience and observability libraries

Polly (.NET), Resilience4j (JVM), Serilog (.NET), zap (Go), `tracing` (Rust), OpenTelemetry SDKs for all major languages; platforms Prometheus, Grafana, Loki, Tempo, Jaeger, Sentry, Elastic, Datadog, New Relic, Splunk, Zabbix, Netdata.

## Containers, orchestration and delivery

Docker (Moby), Podman, Kubernetes (k3s, kind, minikube for local clusters), HashiCorp Nomad, Helm, Kustomize; CI/CD with GitHub Actions, GitLab CI/CD, Jenkins, Tekton, Argo Workflows, Argo CD, Flux; source hosting GitHub, GitLab, Bitbucket, Gitea. Guidance: [ci-cd-pipeline](../../ci-cd-pipeline/SKILL.md), [cloud-infrastructure](../../cloud-infrastructure/SKILL.md).

## Infrastructure and configuration as code

Terraform, OpenTofu, Pulumi, AWS CloudFormation and CDK, Azure Bicep; configuration management with Ansible, Puppet, Chef and Salt; service discovery with Consul.

## Cloud and hosting platforms (commercial)

Amazon Web Services, Microsoft Azure, Google Cloud, Oracle Cloud, IBM Cloud, Alibaba Cloud, DigitalOcean, Linode (Akamai), Hetzner, Cloudflare, Vercel, Netlify, Fly.io, Render, Heroku. Use each provider's official SDK (for example `boto3`, `aws-sdk-go-v2`, `google-cloud-*`, `azure-identity`) and its well-architected guidance.

## Data, analytics and BI

Apache Spark, Apache Flink, dbt, DuckDB, Polars, pandas, NumPy, Apache Superset, Metabase, Streamlit, Dash. Guidance: [data-engineering](../../data-engineering/SKILL.md), [data-analysis](../../data-analysis/SKILL.md).

## AI, ML and LLM frameworks

Machine learning: scikit-learn, PyTorch, TensorFlow and Keras, JAX, XGBoost, LightGBM, Hugging Face. LLM application and agent frameworks: LangChain and LangGraph, LlamaIndex, Haystack, Semantic Kernel, AutoGen, CrewAI, DSPy, Pydantic AI, the Model Context Protocol SDKs, MCP servers from the [official registry](https://registry.modelcontextprotocol.io/) or vendors (for example MCP Toolbox for Databases), tested with the MCP Inspector and vetted per the [MCP servers reference](../../ai-agent-systems/references/mcp-servers.md); demos with Gradio and Streamlit; serving with vLLM, SGLang, Ollama, llama.cpp. Prefer the simplest design that works before adopting a framework ([ai-agent-systems](../../ai-agent-systems/SKILL.md) section 1).

## Content, commerce and business applications

WordPress, Drupal, Strapi, Directus, Payload (content management); Shopify, WooCommerce, Magento Open Source (commerce); Odoo, ERPNext (open-source ERP); SAP, Salesforce, ServiceNow, Atlassian Jira (commercial platforms, integrated through their official APIs with [api-integration](../../api-integration/SKILL.md)).

## Collaboration and operations

GitHub, GitLab, Bitbucket, Gitea, Jira, Mattermost, PagerDuty; developer tools Visual Studio Code, JetBrains IDEs, Neovim, Postman, Docker Desktop.
