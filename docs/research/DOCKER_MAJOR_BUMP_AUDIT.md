[Ver001.000]

# Research: Docker Major-Version Bump Audit (Dependabot PRs #28 + #30)

**Status:** Scoping doc · 2026-05-17
**Plan reference:** Round 2 R2.5
**Recommendation summary:** **Close both PRs.** Reroll dependabot config to target intermediate stable versions (Python 3.12 / Node 22 LTS) instead of latest bleeding edge.

---

## Why this audit exists

PR #47's dependabot triage Wave B flagged two docker majors as needing per-PR investigation:

- **PR #28** — `python:3.11-slim` → `python:3.14-slim` (4 minor releases)
- **PR #30** — `node:20-slim` → `node:26-slim` (3 LTS-cycle jumps)

Both are direct dependabot bumps targeting the **latest** version on Docker Hub, not the most recent stable LTS. The decision matrix per PR:

| PR | Current → Proposed | Recommendation | Reason |
|---|---|---|---|
| **#28** Python | 3.11 → 3.14 | **Close, reroll for 3.12** | 3.14 is too aggressive; 3.13's JIT is experimental; 3.12 is the safe incremental step |
| **#30** Node | 20 → 26 | **Close, reroll for 22 LTS** | Node 26 is too new (Oct 2026 release); pnpm 8.15 + many npm packages may not yet support it; Node 22 is the current active LTS |

---

## Current state — Python pin inventory

8 Dockerfiles, **all** pin `python:3.11-slim`:

```
Dockerfile.api                          FROM python:3.11-slim
packages/shared/api/Dockerfile          FROM python:3.11-slim AS builder
services/legacy-compiler/Dockerfile     FROM python:3.11-slim as builder
services/tenet-verification/Dockerfile  FROM python:3.11-slim as builder
services/websocket/Dockerfile           FROM python:3.11-slim as builder
services/api-gateway/Dockerfile         FROM python:3.11-slim
tests/integration/Dockerfile.test       FROM python:3.11-slim
infra/docker/Dockerfile.service.template FROM python:3.11-slim as builder
```

6 CI workflows pin `python-version: '3.11'`:
- `ci.yml`, `ci-validate.yml`, `agent-validation.yml`, `chaos-engineering.yml`, `security-scan.yml` (deleted in PR #21 reroll), `integration-tests.yml`

**Cascade for PR #28 if merged as-is:**
- 1 Dockerfile would update (the bump target)
- 7 other Dockerfiles would stay on 3.11 — version skew
- 6 CI workflows would stay on `python-version: '3.11'` — CI tests on a different Python than the runtime Docker image
- Risk: real but recoverable (incremental fixes in follow-ups)

## Current state — Node pin inventory

1 Dockerfile pins `node:20-slim`:

```
Dockerfile.web                          FROM node:20-slim
```

7+ CI workflows pin Node — **with inconsistency**:

```
node-version: '18'  ← agent-validation.yml, others
node-version: '20'  ← playwright.yml, others
```

Mix of Node 18 and Node 20 across the workflow set. This is a **pre-existing inconsistency** independent of PR #30 — should be unified at Node 22 LTS regardless.

**Cascade for PR #30 if merged as-is:**
- 1 Dockerfile updates to Node 26
- 7+ CI workflows stay on 18/20 — production runs Node 26, CI runs 18/20
- pnpm 8.15.0 may or may not support Node 26 (untested)
- Vite 6.4.2 may have Node 26 incompatibilities
- Risk: high — likely breaks builds on first run

## Per-PR recommendation

### PR #28 — Python 3.11 → 3.14

**Verdict: CLOSE.** Reroll dependabot config to target **Python 3.12** as the next step.

**Why:**
- Python 3.14 stabilizes 2026-10 (per PEP 745); jumping ahead skips 3.12 (a quietly excellent release) and 3.13 (experimental JIT, free-threaded build).
- The codebase uses asyncpg + pydantic + fastapi + ecdsa — all should be 3.14-compatible, but the **integration test ecosystem** (pytest, pytest-asyncio, pytest-cov, pytest-timeout) has historically lagged 6-12 months behind Python releases.
- Incremental upgrade (3.11 → 3.12 → 3.13 → 3.14) lets us catch breaks one minor at a time.
- 3.12 specifically removes `distutils` and adds typing parameter syntax — clean, well-supported.

**Reroll path:**
1. Close PR #28 with note "deferring; targeting 3.12 first"
2. Update `.github/dependabot.yml` to constrain python docker bumps to `<=3.12` (or remove the docker python entry entirely and bump manually)
3. Open a focused PR: bump all 8 Dockerfiles + 6 CI workflows from 3.11 → 3.12 in one atomic change with verification

### PR #30 — Node 20 → 26

**Verdict: CLOSE.** Reroll dependabot config to target **Node 22 LTS** as the next step.

**Why:**
- Node 22 LTS (active until 2027-04) is the current production-grade target
- Node 24 LTS (active until 2028-04) is also a safe option
- Node 26 (release Oct 2026, LTS Oct 2027) is **brand new** — npm package ecosystem has not had time to validate
- pnpm 8.15 was released targeting Node 18-20 era; Node 26 compatibility is unverified
- Vite 6.4.2 doesn't list Node 26 in its supported versions
- The CI workflow inconsistency (`'18'` vs `'20'`) means we'd be running tests on 18/20 and production on 26 — three different runtimes

**Reroll path:**
1. Close PR #30 with note "deferring; targeting Node 22 LTS first"
2. Update `.github/dependabot.yml` to constrain node docker bumps to `<=22` (or remove entirely and bump manually)
3. Open a focused PR: unify all 7+ CI workflows + the 1 Dockerfile to **Node 22 LTS** in one atomic change
4. Defer Node 24+ to a separate later sprint after 22 has burned in

## Orthogonal finding — CI version-pin inconsistency

Independent of PRs #28/#30, the workflow files inconsistently pin Node 18 vs 20. This causes:
- Cache misses on `setup-node`
- Possible behavior drift between workflows
- Confusion for new contributors

**Recommended follow-up PR (separate from this audit):** unify all CI workflows on **Node 22 LTS** and **Python 3.12**. ~5 files (the workflow `node-version` / `python-version` lines). Pro-window-sized.

## Per-PR action plan (for user execution)

| PR | Action | Effort | Sequencing |
|---|---|---|---|
| #28 | Close with comment citing this audit | <5 min | Now |
| #30 | Close with comment citing this audit | <5 min | Now |
| `.github/dependabot.yml` constraint | Tighten docker constraints to LTS-only | 1 PR, 1 file | Next |
| Unified version pins across 8 Dockerfiles + 7 CI workflows | Python 3.12 + Node 22 LTS atomic bump | 1 focused PR | After dependabot constraint |

## Out of scope for this audit

- Actually closing PRs #28/#30 — that's user action (or my action with explicit approval — could batch with this PR's merge)
- Performing the Python 3.12 / Node 22 bumps — separate focused PR
- Dependabot config edit — separate small PR
- Wave C dependabot review (#42 `next 15 → 16` major) — separate sprint, more involved (Next.js majors are big)

## Companion / context

- Plan v002.003 §"Round 2 R2.5"
- PR #47 (closed) — original dependabot triage that flagged Wave B
- Open Wave B PRs: #28, #30 (this audit's targets)
- Open Wave C PRs (not in scope): #36 rollup 2→4, #37 vite 6→7, #42 next 15→16

## Decision matrix

| Option | Bump now | Recommendation |
|---|---|---|
| Merge PR #28 as-is | Python → 3.14 | ❌ Too aggressive; CI cascade risk |
| Merge PR #30 as-is | Node → 26 | ❌ Too new; ecosystem unverified |
| **Close both, reroll for LTS** | Python → 3.12, Node → 22 | ✅ Recommended |
| Defer all docker bumps indefinitely | No change | ❌ Misses Python security patches in 3.11.x line eventually |
| Close, no reroll, stay on 3.11/20 | No change | ❌ Loses dependabot scanning value |
