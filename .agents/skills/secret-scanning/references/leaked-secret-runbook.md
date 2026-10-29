# Runbook: a secret has leaked

A secret is leaked once it has been committed and pushed, logged, pasted, shipped in a build or sent to a third party, even for a moment, even if the commit was deleted. Deleting it does not un-leak it: forks, caches, clones, CI logs and scanners operated by attackers may already have it. The order below is deliberate.

## 1. Contain: revoke and rotate first (minutes)

1. Tell the owner now. Name the location (file, line, commit, log, build), never the value.
2. Revoke the credential at its issuer, or rotate it so that the old value stops working. Create the replacement, store it in the secret manager or the CI secret store, and redeploy what uses it.
3. If you cannot revoke it yourself, the owner or the provider must do it immediately. Some providers revoke automatically when GitHub's partner program reports a token. Do not count on that.

Revoking may break running systems. That is the owner's call, but a live leaked credential is the bigger risk. Record the decision.

## 2. Assess: was it used? (hours)

- Read the provider's access logs for the exposure window, from the first leak until revocation: logins, API calls, source IPs, new keys or users, data read.
- List what the credential could reach, and whether personal or customer data was in scope. Personal data may trigger legal notification duties with short deadlines. Involve the owner and, where they apply, the data protection officer and legal counsel.
- Check where the value travelled: forks, mirrors, CI logs and artifacts, container images, release bundles ([reverse-engineering](../../reverse-engineering/SKILL.md) audit for builds), chat and issue trackers.

## 3. Clean up (after rotation, with approval)

- Remove the secret from the current files, and load it from the environment instead ([06-security](../../../rules/06-security.md) section 2).
- Rewriting Git history is optional once the secret is revoked. It needs the owner's explicit approval, because it is irreversible and affects every clone ([08-git-workflow](../../../rules/08-git-workflow.md) section 3).
  - Use `git filter-repo --replace-text` on a fresh clone, then force-push with `--force-with-lease` and ask collaborators to re-clone.
  - On GitHub, cached views and pull request references can keep the old commits. Contact GitHub Support to purge them, and delete affected workflow logs and artifacts.
- Close the secret-scanning alert as **revoked**, not as a false positive. Remove any `.gitleaksignore` or `trufflehog:ignore` entry that only existed to hide it.

## 4. Learn

Write a short, blameless incident note:

- what leaked, how and for how long;
- how it was found;
- the impact;
- why the existing controls missed it;
- which control is being added: a pre-commit hook, push protection, a custom pattern, a CI check or a build audit.

Run the full-history scans again to confirm nothing else is waiting:

```bash
gitleaks git --log-opts="--all" --redact .
trufflehog git file://. --results=verified,unknown
```
