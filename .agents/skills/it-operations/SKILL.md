---
name: it-operations
description: Run and automate back-office and infrastructure IT ("back-line" IT) - identity and access (SSO, MFA, provisioning with SCIM, joiner-mover-leaver), directories, endpoints and patching, servers and configuration management, networks (DNS, DHCP, firewalls, VPN, zero trust), certificates, email security (SPF, DKIM, DMARC), backup and recovery, monitoring and logging, IT service management (incidents, requests, changes), asset inventory, and security frameworks (CIS Controls, NIST CSF, ISO/IEC 27001). Use for system administration, IT automation scripts, internal infrastructure, help-desk processes, or IT security and compliance tasks.
license: MIT
metadata:
  version: "1.0.0"
---

# IT Operations

Production and shared systems are read-only for an agent unless the user explicitly approves a change ([AGENTS.md](../../../AGENTS.md) section 6). Cloud-specific infrastructure is in [cloud-infrastructure](../cloud-infrastructure/SKILL.md). Standards checked on 2026-10-15.

## 1. Safe change practice

- Every change has a plan, an expected result, a verification step and a rollback. Changes to shared services (identity, DNS, email, network, backups) go through the organization's change process.
- Automate repeated work with idempotent tools (configuration management such as Ansible, or scripts written to be safe to re-run) and run them in check or dry-run mode first (for example `ansible-playbook --check --diff`, or `-WhatIf` on PowerShell cmdlets that support it).
- Scripts: Bash with `set -euo pipefail`, quoted variables and ShellCheck; PowerShell with PSScriptAnalyzer and Pester ([toolchains](../project-bootstrap/references/toolchains.md)). Never put credentials in scripts.
- Keep configuration, scripts and runbooks in version control.

## 2. Identity and access

- One identity provider with single sign-on (OpenID Connect or SAML 2.0) for all applications that support it.
- Multi-factor authentication for everyone, phishing-resistant methods (FIDO2 security keys, WebAuthn passkeys) for administrators and high-risk roles.
- Automated provisioning and deprovisioning (SCIM 2.0, RFC 7643 and RFC 7644) driven by the HR system: **joiner, mover, leaver**. Leavers lose access the same day; movers lose access they no longer need.
- Role-based access with least privilege; separate administrator accounts; just-in-time elevation where available; periodic access reviews.
- Service accounts are inventoried, owned, scoped and rotated; no shared personal accounts.

## 3. Endpoints and servers

- Inventory every device and server (owner, location, OS version, criticality).
- Patch operating systems and applications on a defined schedule, with emergency patching for actively exploited vulnerabilities; track exceptions.
- Full-disk encryption, screen lock, endpoint protection and detection, and device management for laptops and phones.
- Harden servers from a baseline (for example the CIS Benchmarks for the OS), disable unused services, and centralize logs.
- Remove local administrator rights from everyday user accounts.

## 4. Network

- Segment networks by trust level (users, servers, management, guests, IoT); default-deny between segments.
- Prefer zero-trust access (identity- and device-aware access to applications) over flat VPN access to the whole network.
- Secure DNS and DHCP: restrict zone transfers, protect registrar accounts with MFA, consider DNSSEC for public zones, and log queries for investigations.
- Wi-Fi: WPA3 where supported, enterprise authentication for staff, isolated guest network.
- Document firewall rules with owner and purpose; review and remove stale rules.

## 5. Certificates and email

- Inventory all TLS certificates with expiry monitoring; automate issuance and renewal with ACME (RFC 8555) where possible.
- Email domains publish SPF (RFC 7208), sign with DKIM (RFC 6376) and enforce DMARC (RFC 9989, May 2026, which obsoletes RFC 7489; aggregate and failure reporting in RFC 9990 and RFC 9991). Move DMARC from monitoring (`p=none`) to enforcement once reports show legitimate senders aligned. Domains that send no mail publish policies that reject all mail.

## 6. Backup and recovery

- The 3-2-1 practice: at least three copies, on two different media, one off-site, with at least one copy immutable or offline (protection against ransomware).
- Back up identity provider configuration, SaaS data where the vendor does not, network device configurations, and secrets vaults, not only servers.
- Define recovery point and recovery time objectives per system; **test restores regularly** and record the results.

## 7. Monitoring, logging and response

- Monitor availability and capacity of core services (identity, DNS, email, network links, storage, backups) with alerts to an owned on-call channel.
- Centralize security-relevant logs (sign-ins, privilege changes, admin actions, endpoint alerts) in a log platform or SIEM, with retention per policy.
- Have an incident response plan with contacts, severity levels and steps for common cases (compromised account, malware, lost device, data leak); practise it.

## 8. IT service management

- Separate incidents (restore service), service requests (standard fulfilment), problems (root causes of recurring incidents) and changes (controlled modifications). ITIL is the common reference vocabulary.
- A service catalogue with standard requests automated where possible (access requests through the identity provider, software installs through device management).
- Knowledge base articles and runbooks for recurring issues; measure resolution time and recurrence.

## 9. Governance and frameworks

Use a framework as the checklist and evidence structure: CIS Critical Security Controls (version 8.1 is current), the NIST Cybersecurity Framework (CSF 2.0 is current), ISO/IEC 27001 for an information security management system, and SOC 2 reports where customers require them. Map each control to an owner, a procedure and the evidence that it operates. Security baseline for code and agents: [06-security](../../rules/06-security.md); standards by system type: [domain standards](../security-hardening/references/domain-standards.md).

## Done when

- [ ] Change planned, approved where required, verified, and reversible
- [ ] Access follows least privilege, with MFA and automated deprovisioning
- [ ] Systems inventoried, patched and monitored; certificates tracked for expiry
- [ ] Backups exist in 3-2-1 form and a restore was tested
- [ ] Runbook or knowledge article updated for the change
