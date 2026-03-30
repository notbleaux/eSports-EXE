# Branch Protection Configuration
## GitHub Repository Settings

This document describes the required branch protection settings for the NJZiteGeisTe Platform repository.

---

## Protected Branches

### `main` Branch Protection

Navigate to: Settings → Branches → Add rule

#### Required Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| Branch name pattern | `main` | Protect main branch |
| **Require a pull request before merging** | ✅ Enabled | Code review required |
| Require approvals | 1 | Minimum 1 reviewer |
| Dismiss stale PR approvals | ✅ Enabled | Re-review after changes |
| Require review from CODEOWNERS | ✅ Enabled | Expert review for critical files |
| **Require status checks to pass** | ✅ Enabled | CI must pass |
| Status checks | `ci`, `security-scan`, `commit-lint` | Required checks |
| **Require conversation resolution** | ✅ Enabled | All threads resolved |
| **Require signed commits** | ⚠️ Optional | Security enhancement |
| **Require linear history** | ✅ Enabled | No merge commits |
| **Require merge queue** | ⚠️ Optional | For high-traffic repos |
| **Require deployments to succeed** | ✅ Enabled | Staging must pass |

#### Restrictions

| Setting | Value |
|---------|-------|
| **Restrict pushes that create files** | `.github/`, `docs/architecture/` |
| **Restrict who can push** | `CODEOWNERS` only for protected paths |

---

### `develop` Branch Protection

| Setting | Value |
|---------|-------|
| Branch name pattern | `develop` |
| Require pull request | ✅ Yes |
| Require approvals | 1 |
| Require status checks | `ci` |
| Require linear history | ✅ Yes |

---

## CODEOWNERS Configuration

Create `.github/CODEOWNERS`:

```
# Global fallback
* @notbleaux

# Architecture decisions require lead approval
docs/architecture/ @notbleaux @architecture-lead
docs/adr/ @notbleaux @architecture-lead

# Security-sensitive files
.github/workflows/security.yml @notbleaux @security-lead
packages/shared/api/src/auth/ @notbleaux @security-lead

# Infrastructure changes
infrastructure/ @notbleaux @platform-lead

# Database migrations
infra/migrations/ @notbleaux @data-lead

# Public API changes
packages/shared/api/src/routers/ @notbleaux @api-lead

# Release configuration
.vercel.json @notbleaux @platform-lead
render.yaml @notbleaux @platform-lead
```

---

## Repository Settings

### General

| Setting | Value |
|---------|-------|
| **Squash merging** | ✅ Enabled (default) |
| **Merge commits** | ❌ Disabled |
| **Rebase merging** | ⚠️ Optional |
| **Auto-merge** | ⚠️ Optional (for trusted contributors) |
| **Delete head branches** | ✅ Enabled |

### Actions

| Setting | Value |
|---------|-------|
| **Allow all actions** | ❌ No |
| **Allow select actions** | ✅ Yes |
| **Allowed actions** | `actions/*`, `github/*`, `vercel/*` |

### Security

| Setting | Value |
|---------|-------|
| **Private vulnerability reporting** | ✅ Enabled |
| **Dependency graph** | ✅ Enabled |
| **Dependabot alerts** | ✅ Enabled |
| **Dependabot security updates** | ✅ Enabled |

---

## Automation

### GitHub Actions Workflow for Branch Protection

```yaml
# .github/workflows/branch-protection.yml
name: Enforce Branch Protection Rules

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  check-linear-history:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Check for merge commits
        run: |
          MERGE_COMMITS=$(git log --merges --pretty=format:"%h %s" origin/main..HEAD | wc -l)
          if [ "$MERGE_COMMITS" -gt 0 ]; then
            echo "❌ Merge commits detected. Use rebase or squash instead."
            git log --merges --pretty=format:"%h %s" origin/main..HEAD
            exit 1
          fi
          echo "✅ No merge commits found"

  check-conventional-commits:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Validate commit messages
        run: |
          pip install gitlint
          gitlint --commits origin/main..HEAD
```

---

## Implementation Checklist

- [ ] Create `main` branch protection rule
- [ ] Create `develop` branch protection rule
- [ ] Add CODEOWNERS file
- [ ] Configure status checks (CI workflows)
- [ ] Enable linear history requirement
- [ ] Disable merge commits
- [ ] Enable squash merging as default
- [ ] Configure deployment protection
- [ ] Test with a PR

---

*Last Updated: 2026-03-30*
