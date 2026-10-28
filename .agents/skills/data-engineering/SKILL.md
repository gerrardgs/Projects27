---
name: data-engineering
description: Design, build and operate batch and streaming data pipelines and big-data platforms - ingestion, transformation, orchestration, data modelling, lakehouse and warehouse storage, data quality, lineage, schema evolution, backfills and cost control - with tools such as SQL, dbt, Spark, Flink, Kafka, Airflow, Dagster, DuckDB and Iceberg or Delta tables. Use when building or fixing an ETL/ELT job, data pipeline, stream processor, data model, or data platform component.
license: MIT
metadata:
  version: "1.0.0"
---

# Data Engineering

Tool names in this skill were checked against PyPI and the projects' repositories on 2026-10-15. Tooling by task is in [references/tooling.md](references/tooling.md).

## 1. Define the data contract first

For every dataset you produce, write down: owner, grain (what one row means), primary key, schema with types and nullability, freshness target, retention, personal-data classification, and the consumers. Store this next to the code (dbt model YAML, schema files, a data contract file).

## 2. Pipeline design rules

- **Idempotent and re-runnable**: running a job twice for the same interval gives the same result. Overwrite partitions or use `MERGE` on keys instead of blind appends.
- **Deterministic intervals**: parameterize by logical date or offset range, never by "now", so backfills reproduce history.
- **Incremental by default** for large data, with a tested full-refresh path.
- **Schema evolution**: additive changes are safe; renames, type changes and drops are breaking and need versioning and consumer coordination. Use formats and table formats that record schema (Parquet, Avro, Protobuf; Apache Iceberg, Delta Lake, Apache Hudi).
- **Partition and cluster** by how data is filtered (usually event date), avoiding many small files and high-cardinality partitions.
- **Late and duplicate data**: define watermarks and deduplication keys explicitly, especially in streams.
- **Separate layers**: raw (immutable, as received), cleaned and conformed, then business-level marts. Never let consumers read the raw layer for reporting.

## 3. Streaming specifics

- Choose delivery semantics deliberately: at-least-once with idempotent sinks is the usual practical choice; exactly-once needs end-to-end support from source, processor and sink.
- Partition keys decide ordering and parallelism; ordering exists only within a partition.
- Use event time with watermarks for windowed aggregations; handle late events by policy (drop, update, side output).
- Monitor consumer lag, throughput, error rate and dead-letter volume; alert on lag growth.
- Register and validate schemas (schema registry) so producers cannot break consumers.

## 4. Data quality (test data like code)

- Checks at each layer: not-null and unique keys, accepted values, referential integrity, row-count and volume anomalies, freshness, and business rules (for example "order total equals the sum of its lines").
- Run checks in the pipeline and fail or quarantine bad batches before publishing; do not silently drop rows.
- Tools: dbt tests, Great Expectations, pandera (DataFrames), plus warehouse constraints where supported.
- Reconcile against the source system for critical numbers.

## 5. Operations

- Orchestrate with the project's scheduler (Airflow, Dagster, Prefect, dbt jobs, or cloud equivalents): retries with backoff, timeouts, SLAs, alerts, and clear task ownership.
- Record lineage (OpenLineage or the orchestrator's lineage) so the impact of a change and the source of a bad number can be traced.
- Control cost: prune partitions, select only needed columns, avoid `SELECT *` on wide tables, size clusters to the job, and set lifecycle rules on storage.
- Backfills: run on a copy or a dedicated output first, compare results, then swap; announce to consumers.

## 6. Security and privacy

- Classify columns (personal, sensitive, public). Mask, tokenize or exclude personal data that consumers do not need; apply column- and row-level access controls.
- Credentials from the secret manager; least-privilege service accounts per pipeline.
- Honour retention and deletion requests across raw, derived and backup copies.

## 7. Testing

- Unit-test transformation logic on small, hand-written input and expected output tables.
- Integration-test against a local engine (DuckDB, a local Spark session, Testcontainers) with representative schemas.
- Run data-quality checks in CI on sample data; review dbt or SQL changes with the compiled SQL and a diff of output row counts.

## Done when

- [ ] Data contract (grain, keys, schema, freshness, owner) documented
- [ ] Job is idempotent and backfill-safe; re-run verified
- [ ] Quality checks run and block bad data
- [ ] Lineage, monitoring and alerts in place; cost reviewed for full-size runs
- [ ] Personal data classified and protected
