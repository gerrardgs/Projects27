# Project rules

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

Rules specific to this product and organisation that the shared engineering rules do not cover: business invariants, compliance, protected areas.

## Domain rules and invariants

<!-- Business rules the code must never violate, each testable. -->

- {{An invoice total equals the sum of its lines after tax.}}

## Compliance and legal constraints

<!-- Regulations, contracts and policies that constrain the code or data. -->

- {{regulation}}: {{what it requires here}}

## Protected areas

<!-- Files, data, environments or operations that need explicit approval before change. -->

- {{path or operation}}: {{who approves}}

## Approvals

<!-- Which changes need which reviewer or sign-off. -->

{{change type}}: {{approver}}

## Exceptions

<!-- Accepted deviations from these or the shared rules, with reason, owner and expiry. -->

{{exception}} (owner {{name}}, expires {{date}})
