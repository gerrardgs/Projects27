# Operations

<!-- Template from the technical-documentation skill. Replace every {{...}}; keep the guidance comments or delete them. A section that does not apply says so in one line with the reason. -->

How the running system is kept healthy. Shipping changes is in DEPLOYMENT.md; investigating a fault is in DEBUGGING.md.

## Service level objectives

<!-- SLIs and SLOs from the user's point of view, and the error-budget policy. -->

| SLI | SLO | Window | Measured by |
| :--- | :--- | :--- | :--- |
| {{successful checkout requests}} | {{99.9%}} | {{30 days}} | {{metric or query}} |

## Alerts and on-call

<!-- Alerts that page a person (on SLO burn rate, not every cause), the rotation, and how to escalate. -->

{{alert}}: {{condition}}, pages {{rotation}}

## Incident management

<!-- Severity levels, who leads, communication channels and status page, blameless post-incident reviews and where they are stored. -->

{{process}}

## Capacity and scaling

<!-- Current load, limits, autoscaling settings and the last load test. -->

{{capacity}}; last load test {{date}}

## Backup and disaster recovery

<!-- RPO and RTO per system, where backups are, and the date of the last restore and failover test (data details in DATABASE.md). -->

{{system}}: RPO {{value}}, RTO {{value}}, last tested {{date}}

## Routine maintenance

<!-- Recurring operational tasks (certificate renewal, key rotation, dependency updates) with owner and schedule. -->

| Task | Schedule | Owner | Automated |
| :--- | :--- | :--- | :--- |
| {{TLS certificate renewal}} | {{every 60 days}} | {{team}} | {{yes}} |

## Cost

<!-- Monthly cost by component and the budget alert. -->

{{cost and budget}}
