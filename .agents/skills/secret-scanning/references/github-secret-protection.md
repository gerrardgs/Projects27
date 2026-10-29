# GitHub secret scanning and push protection

Checked on 2026-10-29 in GitHub's documentation ([push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection), [about secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning)), on the [Secret Protection page](https://github.com/security/advanced-security/secret-protection) and on the [pricing page](https://github.com/pricing). These settings are the repository owner's to change. An agent proposes them; it does not change them.

## 1. Availability

- **Public repositories**: secret scanning "runs automatically for free". The pricing page lists push protection and secret scanning for public repositories on the Free plan.
- **Organisation-owned private and internal repositories**: these need GitHub Secret Protection, a paid product on GitHub Team or GitHub Enterprise Cloud. See the pricing page for the current price.
- **AI-detected generic secrets** (passwords found from code context) are in public preview. On the pricing page they are usage-based in push protection.
- **Scope of scanning**: the entire Git history on all branches, plus issues, pull requests, discussions, wikis and secret gists.

## 2. Push protection

Push protection blocks a push that contains a supported secret before the secret reaches the repository.

- **Detects**: partner patterns (provider-specific tokens), generic patterns (private keys, connection strings; this needs generic-pattern scanning turned on), custom patterns (your regular expressions) and AI-detected secrets (preview).
- **Applies to**: command-line pushes, commits in the web interface, file uploads and REST API requests. AI-detected secrets are not checked for REST API requests.
- **For users**: on by default on GitHub.com. It stops you pushing secrets to public repositories, but creates no alert unless repository-level push protection is also on.
- **For repositories**: off by default. Turn it on per repository, organisation or enterprise.

## 3. When a push is blocked

1. Remove the secret from the commits, not only from the latest file: amend or rebase the unpublished commits, then push again.
2. If the secret was real and has left your machine in any way, follow the [leaked-secret runbook](leaked-secret-runbook.md). Rotation comes first.
3. Bypass only with a true reason. The reason decides what happens to the alert:

| Bypass reason | Alert |
| :--- | :--- |
| It's used in tests | Created closed, resolved as "used in tests" |
| It's a false positive | Created closed, resolved as "false positive" |
| I'll fix it later | Created open |

Every bypass is written to the audit log and creates an alert. Owners and security managers are emailed. An agent never bypasses push protection on its own: it stops, and reports the blocked secret's location (not its value) to the user.

## 4. Recommended settings (owner action)

For every repository that follows this specification:

- [ ] Secret scanning on, including scanning for generic patterns (non-provider patterns).
- [ ] Push protection on at the repository level, so bypasses create alerts.
- [ ] Validity checks on where offered, so alerts show whether the secret is still active.
- [ ] For organisations: delegated bypass, so bypasses go through named reviewers, plus exemptions only for automation that needs them.
- [ ] Custom patterns for the project's own token formats.
- [ ] Notifications for secret-scanning alerts go to someone who acts on them; open alerts are reviewed weekly.
- [ ] For organisations on GitHub Team or Enterprise: run the free secret risk assessment once, then on a schedule.

Settings live under **Settings → Advanced Security** (repository) or the organisation's security configurations. The labels change from time to time, so follow the linked documentation.
