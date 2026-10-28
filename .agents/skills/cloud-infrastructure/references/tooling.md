# Cloud and platform tooling

Checked on 2026-10-15 against the projects' repositories, licence files and the VS Code Marketplace.

| Task | Options | Notes |
| :--- | :--- | :--- |
| Infrastructure as code (multi-cloud) | Terraform, OpenTofu, Pulumi | Terraform's licence is the Business Source License 1.1 (its `LICENSE` file); OpenTofu is the open-source fork under the Mozilla Public License 2.0. Check licence terms for your use |
| Infrastructure as code (single cloud) | AWS CloudFormation and AWS CDK, Azure Bicep | Use what the organization standardizes on |
| Kubernetes packaging | Helm, Kustomize | |
| GitOps delivery | Argo CD, Flux | |
| Autoscaling and multi-cluster | KEDA (event-driven autoscaling), Karmada (multi-cluster) | |
| Policy as code | Open Policy Agent (OPA, Gatekeeper), Kyverno | |
| Static analysis of IaC | Checkov, tflint, Trivy (`--scanners misconfig`) | |
| Kubernetes security posture | Kubescape, kube-bench (CIS Kubernetes Benchmark checks), Falco (runtime threat detection) | |
| Supply chain | Sigstore cosign or Notation (image signing), SLSA (provenance; specification version 1.2 is current), in-toto attestations | Enforce signatures at admission with Kyverno `verifyImages` rules or the Sigstore policy-controller |
| Observability | Prometheus, Grafana, OpenTelemetry Collector, Jaeger, kube-state-metrics | |
| Cost estimation | Infracost | |
| Chaos engineering | Chaos Mesh, LitmusChaos, AWS Fault Injection Service, Azure Chaos Studio, Chaos Toolkit | Run only with approval, starting in non-production ([chaos-engineering](../../chaos-engineering/SKILL.md)) |

## Editor support (VS Code extension IDs, checked on the Marketplace)

`hashicorp.terraform`, `ms-kubernetes-tools.vscode-kubernetes-tools`, `ms-azuretools.vscode-bicep`, `amazonwebservices.aws-toolkit-vscode`, `googlecloudtools.cloudcode`, `redhat.vscode-yaml`, `ms-azuretools.vscode-containers`.
