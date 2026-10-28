# Data schema

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

Entities, fields, relationships and invariants. Generate from the migrations or schema files where possible, and say how.

## Entity relationship diagram

<!-- Mermaid erDiagram of the main entities. -->

```mermaid
erDiagram
  {{CUSTOMER}} ||--o{ {{ORDER}} : places
```

## Entities

<!-- One table per entity: field, type, nullability, default, constraint, description, data classification. -->

### {{orders}}

| Field | Type | Null | Default | Constraint | Description | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| {{id}} | {{uuid}} | no | {{gen_random_uuid()}} | primary key | {{description}} | internal |

## Relationships

<!-- Foreign keys and their delete behaviour. -->

{{relationship}}

## Invariants

<!-- Rules the data must always satisfy and where they are enforced (constraint, code, both). -->

{{invariant}}: {{enforced by}}

## Data classification

<!-- Which fields hold personal or confidential data, and their protection. -->

{{field}}: {{classification}}, {{protection}}

## Source of truth

<!-- The files this document reflects and how to regenerate it. -->

{{migrations/}}, generated with {{tool}}
