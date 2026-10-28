# Schema

Owner: <!-- doc: the person or team responsible -->
Last reviewed: <!-- doc: YYYY-MM-DD when the content was last checked against the source -->
Status: <!-- doc: current, draft, or not-applicable (then add a Reason: line and remove the sections) -->

The data model: entities, fields, relationships and validation. Generate tables from the real schema (migrations, ORM models, JSON Schema) where possible so this document cannot drift.

## Entities

<!-- doc: Each domain entity in one or two sentences, using the project's domain terms, and an entity-relationship diagram (Mermaid erDiagram). -->

## Tables

<!-- doc: For each table or collection: columns or fields, types, nullability, defaults, constraints, indexes, and which fields hold personal data. -->

## Relationships

<!-- doc: Foreign keys and cardinality, ownership and cascade rules (what happens on delete), and soft-delete behaviour. -->

## Enumerations

<!-- doc: Every enum or status field with its allowed values, their meaning, and allowed transitions. -->

## Validation

<!-- doc: Where input is validated (shared schemas such as Zod or JSON Schema), the rules for each field, and how client and server validation stay in sync. -->

## Schema changes

<!-- doc: A dated log of significant schema changes with the migration and reason, or a link to the migration history. -->
