# Data engineering tooling

Names checked against PyPI, npm or the projects' GitHub repositories on 2026-10-15. Prefer what the platform already uses.

| Task | Open-source options | Notes |
| :--- | :--- | :--- |
| Single-node analytics and local testing | DuckDB, Polars, pandas, PyArrow | DuckDB and Polars handle data larger than pandas comfortably on one machine |
| Distributed batch processing | Apache Spark (`pyspark`) | Check the cluster's Spark version before using new APIs |
| Stream processing | Apache Flink (`apache-flink` for PyFlink), Kafka Streams, Spark Structured Streaming | Event time, watermarks and state backends need explicit configuration |
| Event streaming | Apache Kafka (`confluent-kafka` is a common Python client) | Plan partitions, retention and schema registry up front |
| SQL transformation | dbt (`dbt-core`) | Models, tests, docs and lineage in one project; lint SQL with SQLFluff |
| Orchestration | Apache Airflow (`apache-airflow`), Dagster, Prefect | Version 3 of Airflow changed several APIs: read the migration guide when upgrading |
| Table formats (lakehouse) | Apache Iceberg, Delta Lake, Apache Hudi | Time travel, schema evolution and `MERGE` on object storage |
| File formats | Parquet (analytics), Avro or Protobuf (streams and records) | Avoid CSV and JSON as long-term storage for large data |
| Data quality | Great Expectations (`great-expectations`), dbt tests, pandera | Soda Core's PyPI metadata lists its licence as proprietary: check its terms before adopting |
| Lineage | OpenLineage (`openlineage-python`) | Supported by several orchestrators and engines |
| Profiling | `ydata-profiling` | For exploration, not as a production check |

## Editor support (VS Code extension IDs, checked on the Marketplace)

`ms-toolsai.jupyter` (notebooks), `ms-toolsai.datawrangler` (DataFrame viewing and cleaning), `mechatroner.rainbow-csv` (CSV), `mtxr.sqltools` (SQL client), `ms-ossdata.vscode-pgsql` (PostgreSQL).
