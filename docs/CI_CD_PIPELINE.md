[Ver001.000]

# CI/CD Pipeline Documentation

**Platform:** GitHub Actions
**Main Workflow File:** `.github/workflows/ci.yml`
**Validation Workflow File:** `.github/workflows/ci-validate.yml`
**Local Pre-commit:** `.pre-commit-config.yaml`

---

## Overview

The NJZ eSports platform uses a **two-tier CI/CD system**:

1. **Main CI Pipeline** (`.github/workflows/ci.yml`) — Comprehensive checks (quality, security, tests)
2. **Validation Workflow** (`.github/workflows/ci-validate.yml`) — Schema and build validation
3. **Pre-commit Hooks** (`.pre-commit-config.yaml`) — Catch issues before commit

Both workflows trigger on push to `main` and `develop`, and on all pull requests.

---

## Main CI Pipeline (ci.yml)

### Job 1: Quality Checks (`quality-checks`)

**Purpose:** Static analysis and security scanning

**Steps:**
- Checkout code
- Install pnpm dependencies (frozen lockfile)
- Install Python dependencies (Black, Ruff, Bandit)
- Run Black formatter check (`packages/shared/api`)
- Run Ruff linter (`packages/shared/api`)
- Run Bandit security scan (`packages/shared/api`)
- Upload security report as artifact

**Status:** Non-blocking (allowed to continue even if fails, but results are visible)

### Job 2: Python Tests (`python-tests`)

**Purpose:** Run Python backend unit tests

**Services:**
- PostgreSQL 15 (user: `sator`, password: `sator_test`)
- Redis 7

**Steps:**
- Checkout code
- Setup Python 3.11
- Install pytest, pytest-asyncio, asyncpg, redis, httpx
- Install `requirements.txt` from `packages/shared/api`
- Run unit tests in `tests/unit/`
- Test API imports (`from main import app`)

**Environment Variables:**
- `TEST_DATABASE_URL` → `postgresql://sator:sator_test@localhost:5432/sator_test`
- `TEST_REDIS_URL` → `redis://localhost:6379/1`
- `JWT_SECRET_KEY` → `test-secret-key-for-ci`
- `TOTP_ENCRYPTION_KEY` → `test-totp-key-for-ci-32-chars`

**Status:** Non-blocking (tests may have DB setup issues in CI)

### Job 3: Frontend Build Check (`frontend-build`)

**Purpose:** Verify web app builds successfully with no TypeScript errors

**Steps:**
- Checkout code
- Setup pnpm 8.15.0
- Setup Node.js 20
- Install dependencies (`apps/web`)
- Type check (`pnpm run typecheck`)
- Build (`pnpm run build`)
- Verify `dist/` directory exists

**Status:** **BLOCKING** — must pass for CI to succeed

### Job 4: Repository Health Check (`repo-health`)

**Purpose:** Structural validation and security checks

**Steps:**
- Verify core files exist (package.json, docker-compose.yml, README.md, AGENTS.md)
- Verify directories exist (packages/shared/api, apps/web)
- Check for potential secrets (basic pattern scan)
- Print CI summary (repo, branch, commit)

**Status:** Non-blocking

### Job 5: Lighthouse CI (`lighthouse`)

**Purpose:** Performance and accessibility audits

**Dependencies:** Requires `frontend-build` to succeed

**Steps:**
- Checkout code
- Install dependencies
- Build web app
- Run Lighthouse CI (`@lhci/cli`)
- Upload results as artifact

**Status:** Non-blocking

### Job 6: Phase 5 Infrastructure Check (`phase5-check`)

**Purpose:** Verify Phase 5 specific files exist

**Files Checked:**
- `services/api/src/njz_api/models/player_stats.py`
- `services/api/src/njz_api/models/sim_calculation.py`
- `packages/shared/api/routers/webhooks.py`
- `packages/shared/api/routers/simrating.py`
- `apps/web/public/manifest.json`
- `infra/migrations/versions/002_player_stats.py`
- `infra/migrations/versions/003_sim_calculations.py`

**Status:** Non-blocking

---

## Validation Workflow (ci-validate.yml)

This dedicated workflow adds schema and build validation checks.

### Job 1: TypeScript Type Check (`typecheck`)

**Purpose:** Ensure no TypeScript errors across all packages

**Steps:**
- Checkout code
- Setup pnpm 8.15.0
- Setup Node.js 18
- Install dependencies
- Run `pnpm run typecheck`
- Report failure message

**Status:** **BLOCKING** — must pass for subsequent jobs

### Job 2: Build Web App (`build-web`)

**Purpose:** Verify web app builds and check bundle size

**Dependencies:** Requires `typecheck` to succeed

**Steps:**
- Checkout code
- Setup pnpm and Node.js
- Install dependencies
- Build web app with `pnpm run build --filter=web`
- Check bundle size:
  - Report actual size
  - Warn if >1MB
  - Can be adjusted based on project needs

**Status:** **BLOCKING**

### Job 3: Schema Consistency Check (`schema-validation`)

**Purpose:** Enforce schema registry rules and prevent inline type duplication

**Steps:**
- Checkout code
- Setup pnpm and Node.js
- Setup Python 3.11
- Install pydantic
- Count inline type definitions in `apps/web/src`:
  - Searches for `^interface` or `^type` patterns
  - Fails if more than 10 inline types found
  - Suggests importing from `@njz/types` instead
- Validate Python Pydantic schema imports:
  - Attempts to import from `packages/shared/api/main.py`
  - Non-blocking if import fails

**Status:** **BLOCKING** for TypeScript inline type count

### Job 4: Python Unit Tests (`test-python`)

**Purpose:** Run Python backend tests with containerized PostgreSQL

**Services:**
- PostgreSQL 15

**Steps:**
- Checkout code
- Setup Python 3.11
- Install dependencies
- Run pytest in `packages/shared/api`
- Non-blocking (tests may fail due to DB setup in CI)

**Status:** Non-blocking

### Job 5: Status Summary (`summary`)

**Purpose:** Final check that all critical jobs passed

**Logic:**
- Checks `typecheck` result — fails if failed
- Checks `build-web` result — fails if failed
- Checks `schema-validation` result — fails if failed
- Passes if all critical checks passed

**Status:** **BLOCKING** — this is the final gate

---

## Pre-commit Hooks (.pre-commit-config.yaml)

Runs locally before every commit. Prevents broken code from being committed.

### Hook 1: Pre-commit-hooks (v4.5.0)

- `trailing-whitespace` — Remove trailing spaces
- `end-of-file-fixer` — Ensure files end with newline
- `check-yaml` — Validate YAML syntax
- `check-added-large-files` — Reject files >1MB
- `check-json` — Validate JSON syntax
- `check-merge-conflict` — Detect merge conflict markers

### Hook 2: Black (23.12.1)

**Purpose:** Python code formatting

- Applies to: `packages/` directory
- Line length: 100 characters
- Python version: 3.11

### Hook 3: Ruff (v0.1.9)

**Purpose:** Python linting and auto-fixes

- Applies to: `packages/` directory
- Auto-fixes issues where possible
- Exits with error if fixes applied (user must re-stage)

### Hook 4: Mypy (v1.7.1)

**Purpose:** Python static type checking

- Applies to: `packages/` directory
- Ignores missing type stubs
- Dependencies: `types-requests`, `types-python-dateutil`

### Hook 5: ESLint (v8.56.0)

**Purpose:** JavaScript/TypeScript linting

- Files: `*.ts`, `*.tsx`, `*.js`, `*.jsx`
- Dependencies: ESLint 8.56.0, Prettier 9.1.0, TypeScript plugins

### Hook 6: Prettier (v3.1.0)

**Purpose:** Code formatting for JS/TS/JSON/YAML/Markdown

- File types: JavaScript, JSX, TypeScript, TSX, JSON, YAML, Markdown, CSS

### Hook 7: Detect-secrets (v1.4.0)

**Purpose:** Prevent accidental secret commits

- Baseline: `.secrets.baseline`
- Excludes: `package-lock.json`

---

## Running CI Checks Locally

### Install Pre-commit Hooks

```bash
# Install pre-commit package
pip install pre-commit

# Install hooks (runs on every commit)
pre-commit install

# Manually run all hooks on all files
pre-commit run --all-files

# Run specific hook
pre-commit run black --all-files
```

### Run Main CI Commands

```bash
# Install all dependencies
pnpm install

# Type check (TypeScript)
pnpm run typecheck

# Build web app
pnpm run build --filter=web

# Run Python tests
cd packages/shared/api
pytest tests/ -v

# Run Black formatter check
black --check packages/shared/api

# Run Ruff linter
ruff check packages/shared/api

# Run MyPy type checker
mypy packages/shared/api --ignore-missing-imports
```

---

## Workflow Status & Artifacts

### On Success (All Blocking Jobs Pass)

- Green checkmark on PR/commit
- No artifacts generated (only failure artifacts are kept)

### On Failure

**Artifacts Retained (30 days):**
- `security-report` — Bandit security scan JSON output
- `lighthouse-results` — Lighthouse CI audit results

### How to View Artifacts

1. Go to GitHub Actions tab
2. Click on failed workflow run
3. Scroll to "Artifacts" section
4. Download the report you need

---

## CI Configuration Tips

### Adjusting Bundle Size Threshold

In `.github/workflows/ci-validate.yml`, search for `build-web` job:

```bash
# Current: warn if >1MB (1000000 bytes)
if [ $(du -s apps/web/dist/ | cut -f1) -gt 1000000 ]; then
```

Change `1000000` to your desired byte threshold.

### Skipping Workflows on Specific Commits

Add `[skip ci]` to commit message:

```bash
git commit -m "docs: Update README [skip ci]"
```

This skips ALL workflows. Use sparingly.

### Running a Workflow Manually

1. Go to GitHub Actions tab
2. Select desired workflow
3. Click "Run workflow"
4. Select branch
5. Click green "Run workflow" button

---

## Troubleshooting

### "TypeScript check failed"

**Solution:** Run locally and fix errors:

```bash
pnpm run typecheck
```

### "Bundle size is >1MB"

**Solution:** This is a warning only (non-blocking). To fix:

1. Analyze bundle: `npm run build:analyze` (if available)
2. Look for large dependencies
3. Consider code splitting or lazy loading

### "Too many inline types in frontend"

**Solution:** Import from `@njz/types` instead:

```typescript
// ❌ BAD — inline type
interface Player {
  id: string;
  name: string;
}

// ✅ GOOD — import from registry
import { Player } from '@sator/types';
```

### "Python tests failing in CI but passing locally"

**Causes:**
- Database connection issues (CI uses containerized PostgreSQL)
- Missing environment variables
- Timing/ordering issues in async tests

**Solution:** Check test logs in Actions tab for details.

### "detect-secrets baseline outdated"

**Solution:** Regenerate baseline:

```bash
detect-secrets scan > .secrets.baseline
```

---

## Next Steps

- Monitor CI runs regularly in GitHub Actions
- Review security reports for Bandit findings
- Keep pre-commit hooks updated (`pre-commit autoupdate`)
- Add more strict linting rules as code quality improves

---

**Last Updated:** 2026-03-27
**Policy Owner:** Specialist D — CI/CD Pipeline & Schema Versioning
**Next Review:** 2026-06-27
