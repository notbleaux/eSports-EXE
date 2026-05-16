[Ver001.000]

# Repository Standards

This is the canonical inventory of files and conventions every repository under `@notbleaux/` ownership should carry. It exists so sibling repos (`eSports-EXE`, `eSports-EXE-archives`, future ones) can be brought to the same bar by copying a known list rather than re-deriving it each time.

Source of the standard: PixelOffice premier-grade onboarding checklist (adapted for the NJZ project family). Last refreshed: 2026-05-11.

## Required root files

| File | Purpose | Auto-recognized by GitHub |
|---|---|---|
| `README.md` | Product overview, quickstart, badges | Yes |
| `LICENSE` | License text | Yes |
| `CONTRIBUTING.md` | Contribution workflow | Yes |
| `CODE_OF_CONDUCT.md` | Community standards | Yes |
| `SECURITY.md` | Vulnerability reporting policy | Yes |
| `SUPPORT.md` | Where to get help | Yes |
| `CHANGELOG.md` | Release history (or pointer to canonical) | Yes (releases) |
| `ROADMAP.md` | Forward direction (or pointer) | No |
| `AGENTS.md` | AI agent contract / policy | No (project convention) |
| `CLAUDE.md` | Claude-specific working rules | No (project convention) |
| `MASTER_PLAN.md` | Strategic direction | No (project convention) |
| `.editorconfig` | Cross-editor formatting | Yes |
| `.nvmrc` | Node version pin | Yes (nvm) |
| `.gitattributes` | Line ending + binary rules | Yes |
| `.gitignore` | Ignore rules | Yes |
| `.env.example` | Variable surface reference | No |

## Required `.github/` contents

| Path | Purpose |
|---|---|
| `CODEOWNERS` | Review routing |
| `ISSUE_TEMPLATE/bug_report.yml` | Bug intake |
| `ISSUE_TEMPLATE/feature_request.yml` | Feature intake |
| `ISSUE_TEMPLATE/task.yml` | Chore/refactor/docs intake |
| `ISSUE_TEMPLATE/config.yml` | Disable blank issues, route security |
| `PULL_REQUEST_TEMPLATE.md` | Default PR template |
| `pull_request_template/` | Typed templates (feat, fix, refactor, docs, schema-change, deletion) |
| `dependabot.yml` | Grouped weekly dependency updates |
| `release.yml` | Auto release-notes categorization |
| `workflows/ci.yml` | Lint, typecheck, unit, build |
| `workflows/security.yml` | Secret + dependency scanning |

## Required commands (`package.json`)

Every repo must expose:

```
setup       # bash scripts/setup.sh — cross-platform entrypoint
dev         # primary local dev server
build       # production build
lint        # ESLint / equivalent
format      # Prettier write
test        # unit tests
typecheck   # tsc --noEmit / equivalent
check       # single-confidence pre-PR gate (typecheck + test)
```

## Required directories

| Path | Purpose |
|---|---|
| `docs/onboarding/` | "<1 hour to green env" index |
| `docs/testing/` | Test layer map |
| `docs/release/` | Deploy + release flow |
| `docs/architecture/` | Topology, ADRs, schemas |
| `docs/operations/` | Runbooks, env files, monitoring |
| `scripts/` | `setup.sh`, `check.sh`, `validate-env.sh`, `release.sh` |
| `archive/` | T2 / completed material per `.doc-tiers.json` |

## Doc tier policy

If `.doc-tiers.json` exists, all root `.md` files must appear in the `manifest.approved_root_files` list. Reports and completion summaries belong in `archive/<period>/`, not at root.

## Cross-repo replication

To apply this standard to a sibling repo:

1. Copy this file (`docs/operations/REPO_STANDARDS.md`) to the target repo.
2. Copy the "Required root files" set; adapt content but keep filenames.
3. Copy `.github/{ISSUE_TEMPLATE,PULL_REQUEST_TEMPLATE.md,dependabot.yml,release.yml}`.
4. Copy `scripts/{setup,check}.sh`.
5. Wire the standard `package.json` script names; let internal implementations diverge.
6. Add a `.doc-tiers.json` (or equivalent) so the manifest is enforceable.

The point is that file *names* and *commands* match across repos. Their *contents* should reflect each repo's product.
