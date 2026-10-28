---
name: cloud-infrastructure
description: Design, provision, secure and operate cloud and platform infrastructure as code - AWS, Azure, Google Cloud or on-premises Kubernetes - with Terraform/OpenTofu, Pulumi, CDK, CloudFormation or Bicep, Kubernetes manifests and Helm, GitOps, IAM least privilege, networking, secrets, observability, SRE practices (SLOs, error budgets, incident response), disaster recovery and cost control (FinOps). Use when creating or changing infrastructure, Kubernetes resources, cloud permissions, networks, environments, backups, or when planning reliability, scaling or cloud spend.
license: MIT
metadata:
  version: "1.0.0"
---

# Cloud Infrastructure, Platform and SRE

Facts checked on 2026-10-15. Tooling by task: [references/tooling.md](references/tooling.md). Never apply infrastructure changes to shared or production environments without the user's explicit approval ([AGENTS.md](../../../AGENTS.md) section 2).

## 1. Everything as code, through a pipeline

- Infrastructure, configuration, policies and dashboards are defined in version control and applied by CI/CD, not by hand in a console. Manual changes create drift that the next apply may destroy.
- Always produce and review a plan before applying (`terraform plan` / `tofu plan`, `pulumi preview`, CloudFormation change sets, `az deployment group what-if` for Bicep, `kubectl diff`). Read every destroy or replace in the plan.
- Remote, locked, encrypted state for Terraform or OpenTofu; never commit state files (they can contain secrets).
- Separate environments (development, staging, production) by account, subscription or project, with the same code and different variables.
- Pin provider, module and chart versions; update them deliberately.

## 2. Identity and access

- Least privilege for humans, workloads and CI: narrowly scoped roles, no wildcard actions or resources without a documented reason, no long-lived access keys where workload identity or OIDC federation is available.
- Separate break-glass administrative access, with multi-factor authentication and audit logging.
- Secrets in the platform's secret manager, injected at runtime; encryption at rest and in transit by default.

## 3. Network

- Private by default: databases, caches and internal services have no public endpoints. Expose only load balancers or gateways, with TLS.
- Security groups and firewall rules allow only the required ports and sources; Kubernetes `NetworkPolicy` restricts pod-to-pod traffic.
- Restrict egress for sensitive workloads; block access to cloud metadata endpoints from untrusted workloads (SSRF).

## 4. Kubernetes workloads

Supported Kubernetes versions on 2026-10-15: 1.35, 1.36 and 1.37 (the project maintains the three most recent minor releases; [kubernetes.io/releases](https://kubernetes.io/releases/)). For every workload:

- [ ] Resource requests and limits for CPU and memory
- [ ] Liveness, readiness and (for slow starters) startup probes that check real health
- [ ] `securityContext`: run as non-root, read-only root filesystem where possible, drop all capabilities, no privilege escalation; namespace enforces the **restricted** Pod Security Standard where feasible
- [ ] Image pinned by digest, from a trusted registry, scanned, and signed; production clusters admit only signed images (Kyverno `verifyImages` or the Sigstore policy-controller)
- [ ] At least two replicas, a `PodDisruptionBudget`, and topology spread across zones for production services
- [ ] Graceful shutdown: the app handles `SIGTERM` within `terminationGracePeriodSeconds`
- [ ] Configuration in ConfigMaps, secrets from the secret manager (external secrets operator or CSI driver), not hard-coded
- [ ] Horizontal autoscaling on a meaningful metric

Deliver with GitOps (Argo CD or Flux) or a pipeline; package with Helm or Kustomize consistently with the existing repository.

## 5. Reliability (SRE)

- Define service-level indicators (availability, latency, correctness) and objectives (SLOs) from the user's point of view; use the error budget to balance releases against reliability work.
- Observability: metrics (Prometheus or the cloud equivalent), logs, traces (OpenTelemetry Collector), dashboards (Grafana or equivalent), and alerts on SLO burn rate rather than on every cause.
- Incident response: on-call rotation, runbooks, severity levels, status communication, and blameless post-incident reviews ([systematic-debugging](../systematic-debugging/SKILL.md)).
- Capacity: load-test before launches; autoscaling with upper bounds; quotas checked.
- Monitor every user-facing service with the [four golden signals](https://sre.google/sre-book/monitoring-distributed-systems/) (latency, traffic, errors, saturation); RED (rate, errors, duration) for request-driven services and USE (utilization, saturation, errors) for resources are compact variants.
- Reduce toil, the operational work that is "manual, repetitive, automatable, tactical" and "scales linearly as a service grows"; Google's SRE teams aim to keep it below 50% of each engineer's time ([Eliminating toil](https://sre.google/sre-book/eliminating-toil/)).
- Prove that redundancy, failover and alerts work by injecting faults and running game days ([chaos-engineering](../chaos-engineering/SKILL.md)).

## 6. Backup and disaster recovery

- Set recovery point objective (RPO, how much data may be lost) and recovery time objective (RTO, how long recovery may take) per system with the business.
- Automated, encrypted backups, with at least one copy in another region or account and protected from deletion (immutability or separate credentials).
- **Test restores regularly**; a backup that has never been restored is not a backup.
- Multi-zone by default for production; multi-region only when the RTO and RPO require it, because it adds cost and complexity.

## 7. Cost (FinOps)

- Tag every resource with owner, environment and cost centre; review spend by tag.
- Right-size from utilization data; use autoscaling and scheduling (stop non-production environments outside working hours); commit to discounts only for steady baseline usage.
- Set budgets and anomaly alerts; estimate the cost of infrastructure changes before applying them (for example with Infracost).
- Watch data-transfer costs between zones, regions and the internet.

## 8. Verify

- Static checks in CI: formatting and validation (`terraform fmt -check`, `terraform validate`, `tflint`), policy and misconfiguration scanning (Checkov, Trivy with `--scanners misconfig`, OPA or Kyverno policies, Kubescape for Kubernetes).
- Use the provider's well-architected guidance as a review checklist (AWS Well-Architected Framework, Azure Well-Architected Framework, Google Cloud Architecture Framework).

## Done when

- [ ] Change is code, reviewed with a plan or diff, and applied by a pipeline
- [ ] IAM and network access are least-privilege; no public data stores; secrets from a manager
- [ ] Kubernetes checklist satisfied for new workloads
- [ ] SLOs, alerts and runbooks exist for new services; backups and restore tested
- [ ] Cost impact estimated; resources tagged
