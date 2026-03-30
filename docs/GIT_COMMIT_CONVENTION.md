[Ver001.000]

# Git Commit Convention Guide
## NJZiteGeisTe Platform - Commit Message Standards

---

## 1. CONVENTIONAL COMMITS FORMAT

All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Format Rules

| Element | Required | Description |
|---------|----------|-------------|
| `type` | ✅ Yes | Category of change |
| `scope` | 🟡 Optional | Area of codebase affected |
| `subject` | ✅ Yes | Short description (imperative mood) |
| `body` | 🟡 Optional | Detailed explanation |
| `footer` | 🟡 Optional | Breaking changes, issue refs |

---

## 2. COMMIT TYPES

| Type | Use When | Example |
|------|----------|---------|
| `feat` | New feature | `feat(sim): Add X-ePlayer emulation` |
| `fix` | Bug fix | `fix(api): Resolve JWT token expiry` |
| `docs` | Documentation | `docs(adr): Add event sourcing decision` |
| `style` | Formatting | `style(web): Fix indentation in CSS` |
| `refactor` | Code restructuring | `refactor(api): Split auth middleware` |
| `perf` | Performance | `perf(db): Add query optimization` |
| `test` | Tests | `test(sim): Add determinism tests` |
| `chore` | Maintenance | `chore(deps): Update pnpm lockfile` |
| `ci` | CI/CD changes | `ci(gha): Add security scan workflow` |
| `build` | Build system | `build(docker): Optimize image size` |
| `revert` | Revert commit | `revert: feat(sim) Remove broken feature` |

---

## 3. SCOPES

Scopes identify the area of the codebase:

| Scope | Description | Examples |
|-------|-------------|----------|
| `api` | FastAPI backend | `feat(api): Add rate limiting` |
| `web` | React frontend | `fix(web): MatchDetailPanel syntax` |
| `sim` | Godot simulation | `feat(sim): Add replay verification` |
| `db` | Database/schema | `feat(db): Add player_lineage table` |
| `ml` | ML/analytics | `feat(ml): Add uncertainty quantification` |
| `infra` | Infrastructure | `feat(infra): Add Kafka cluster` |
| `auth` | Authentication | `fix(auth): OAuth state validation` |
| `docs` | Documentation | `docs(readme): Update setup guide` |
| `ops` | Operations | `chore(ops): Archive old sessions` |
| `root` | Repository root | `chore(root): Move files to docs/` |

---

## 4. COMMIT MESSAGE EXAMPLES

### ✅ Good Examples

```
feat(api): Add tiered API key system with rate limiting

Implement Free/Pro/Enterprise tiers with configurable limits:
- Free: 30 req/min
- Pro: 10K req/min  
- Enterprise: Unlimited

Includes device fingerprinting and token rotation.

Closes #123
```

```
fix(db): Add missing migration for auth tables

Migration 004_auth_users_oauth_accounts was referenced but not
included in alembic history, causing fresh installs to fail.

Fixes deployment issue on Render.
```

```
docs(adr): Add event sourcing architecture decision

Document choice of Kafka over RabbitMQ for event streaming:
- Better ecosystem for Python/Faust
- Native replay capabilities
- Simpler operational model
```

```
refactor(sim): Extract headless server from Godot GUI

Separate concerns for cloud deployment:
- Headless export for Linux servers
- HTTP API for job submission
- S3 integration for replay storage

BREAKING CHANGE: Simulation now requires --headless flag
```

### ❌ Bad Examples (Avoid)

```
fixed stuff
```
- ❌ No type, no scope, vague subject

```
Update
```
- ❌ No information about what was updated

```
workflows & __pycache__ faux tests removed
```
- ❌ Missing type, inconsistent format

```
[AUTO] Health check - 23:05
```
- ❌ Use `[skip ci]` for automated checks or move to GitHub Actions

```
stubs of feature development: ARCHIVAL SYSTEMS, ROAD-MAPS FOR MINI-MAP RECORDING, DATA COLLECTION, TOOLS FOR VERIFICATION OF DATA AND NETWORK PIPELINES MAPPED OUT IN PLANS
```
- ❌ All caps, too long, multiple changes in one commit

---

## 5. SPECIAL TAGS

### Safety Tags (for agent coordination)

| Tag | Meaning | Use Case |
|-----|---------|----------|
| `[SAFE]` | Non-breaking, safe to apply | Documentation, config |
| `[STRUCT]` | Structural/architectural | New directories, moves |
| `[CRIT]` | Critical security/fix | Hotfixes, patches |
| `[WIP]` | Work in progress | Draft PRs |
| `[BREAK]` | Breaking change | Major version bump |

Example:
```
docs(adr): Add event sourcing decision [SAFE]

Non-code change, documentation only.
```

### Skip CI

For commits that don't need CI (docs, config):
```
docs(readme): Update badges [skip ci]
```

---

## 6. AUTOMATED COMMIT CHECKS

### Git Hook (prepare-commit-msg)

```bash
#!/bin/bash
# .git/hooks/prepare-commit-msg

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Skip for merge commits, fixups, etc.
if [ "$COMMIT_SOURCE" = "merge" ] || [ "$COMMIT_SOURCE" = "squash" ]; then
    exit 0
fi

# Read commit message
MSG=$(head -n1 "$COMMIT_MSG_FILE")

# Check conventional commit format
if ! echo "$MSG" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\([a-z-]+\))?: .+"; then
    echo "❌ Commit message does not follow conventional commit format!"
    echo ""
    echo "Expected format: <type>(<scope>): <subject>"
    echo ""
    echo "Valid types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert"
    echo ""
    echo "Examples:"
    echo "  feat(api): Add rate limiting"
    echo "  fix(web): Resolve TypeScript error"
    echo "  docs(readme): Update installation guide"
    echo ""
    exit 1
fi

echo "✅ Commit message format valid"
exit 0
```

---

## 7. RECENT COMMIT REFORMATTING

### Current → Refined Mapping

| Current | Refined |
|---------|---------|
| `workflows & __pycache__ faux tests removed` | `chore(test): Remove __pycache__ faux tests and unused workflows` |
| `docs(cert): Add final archival optimization certificate [SAFE]` | ✅ Already correct |
| `docs(ops): Add async agent completion report [SAFE]` | ✅ Already correct |
| `chore(root): Move operation reports to docs/reports [SAFE]` | ✅ Already correct |
| `fix(registry): Update file count, fix paths, add version headers [SAFE]` | ✅ Already correct |
| `fix(ci): Fix placeholder URLs, enable security, add E2E workflow [SAFE]` | ✅ Already correct |
| `chore(archive): Move 17 expired session files to archive [SAFE]` | ✅ Already correct |
| `[AUTO] Health check - 23:05` | `chore(ops): Automated health check [skip ci]` OR remove from commit history |
| `Merge branch 'main' of https://github.com/notbleaux/eSports-EXE` | ✅ Git default - acceptable |
| `Check n VERIFICATION_COMPLETED` | `ops(verify): Complete verification checkpoint` |
| `chore(deps): bump the npm_and_yarn group across 3 directories with 2 updates` | ✅ Already correct |
| `Stream Minimap recorder and enrichment pipeline, data archival update, stubs for development features, extraction data processes refined` | **SPLIT INTO:**<br>`feat(minimap): Add stream recorder and enrichment pipeline`<br>`feat(archival): Update data archival system`<br>`docs(stubs): Add development feature stubs` |
| `stubs of feature development: ARCHIVAL SYSTEMS, ROAD-MAPS FOR MINI-MAP RECORDING, DATA COLLECTION, TOOLS FOR VERIFICATION OF DATA AND NETWORK PIPELINES MAPPED OUT IN PLANS` | **SPLIT INTO:**<br>`docs(stubs): Add archival system roadmap`<br>`docs(stubs): Add minimap recording roadmap`<br>`docs(stubs): Add data collection pipeline roadmap` |

---

## 8. COMMIT BEST PRACTICES

### Do's ✅

- Use imperative mood ("Add feature" not "Added feature")
- Keep subject line under 50 characters
- Wrap body at 72 characters
- Reference issues: `Closes #123`, `Refs #456`
- One logical change per commit
- Explain WHY, not just WHAT

### Don'ts ❌

- Don't use past tense
- Don't end subject with period
- Don't exceed 72 chars in subject
- Don't combine unrelated changes
- Don't use vague messages like "fix stuff"
- Don't commit with "-m" flag for complex changes (use editor)

---

## 9. COMMIT TEMPLATE

Create `.gitmessage` in repo root:

```
# <type>(<scope>): <subject>
# 👆 50 chars or less， imperative mood

# Body: Explain WHY this change is needed
# - What problem does it solve?
# - What approach was taken?
# - Any breaking changes?
# 👆 Wrap at 72 characters

# Footer: Reference issues, breaking changes
# Closes #123
# BREAKING CHANGE: Description

# Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert
# Scopes: api, web, sim, db, ml, infra, auth, docs, ops, root
```

Configure Git to use it:
```bash
git config commit.template .gitmessage
```

---

## 10. VERSION BUMP COMMITS

When releasing a new version:

```
chore(release): Bump version to 2.2.0

Changes:
- feat: Add event sourcing architecture
- feat: Implement tiered API keys
- fix: Resolve WebSocket connection drops
- docs: Add deployment guide

See CHANGELOG.md for full details.
```

---

*Document Version: 001.000*  
*Last Updated: 2026-03-30*
