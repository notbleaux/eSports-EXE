[Ver001.002]

# Playwright E2E Sprint — Scope

**Status:** Step 2 ATTEMPTED · sandbox-blocked · static-triage matrix written (Step 3) · awaiting CI artifact-based completion
**Branch:** `claude/r2-7-playwright-step-2` (off post-#58 main)
**Owner:** TBD (next focused session)
**Plan counter:** `PLN-004-playwright-sprint` (registered in `polyrepo/registry/index.json`)
**Portfolio:** `NJZPL` · **Project:** `ZSXT` · **Repo:** `notbleaux/ZeSporteXte`

---

## Linear progression context (portfolio → sprint)

```
NJZPL (NeXeZ Portfolio)
└── ZSXT (ZeSporteXte project)
    ├── PLN-001-rename               ✅ SHIPPED (PR #17 + PR #43)
    ├── PLN-002-agent-id             🟡 IN PROGRESS (PR #44 — Phase 0 advisory protocol)
    ├── PLN-003-network-api          ⏸ SCOPED (Phases 1-7, blocked on user infra for 4+6)
    │   ├── Phase 1: ECDSA crypto baseline       (NEXT — drafting underway)
    │   ├── Phase 2: Network API gateway MVP
    │   ├── Phase 3: Persistent storage (SQLite WAL + Supabase failover)
    │   ├── Phase 4: Hermes-MiMo worker          ⚠️ blocked on Cloud VPS + OpenRouter key
    │   ├── Phase 5: Redis Pub/Sub bus
    │   ├── Phase 6: Production edge (Caddy)     ⚠️ blocked on registered domain
    │   └── Phase 7: Telemetry + multi-platform fallbacks
    └── PLN-004-playwright-sprint    🟡 THIS (CI hygiene tail — re-enable Playwright as hard gate)
```

This sprint is **orthogonal** to the network-API stack (PLN-003) and **dependent on** the post-rename cleanup (PLN-001 — now in main). It does NOT block any other plan; it just closes the loose end where Playwright was deescalated to non-blocking in PR #43 `d528a95`.

---

## Why this sprint exists

PR #43's CI hygiene work (commits `62c0c45`, `ce1e440`, `439262e`) moved Playwright from "cancelled at the 6h workflow timeout" → "actually executes through the build step". The newly-completing workflow then revealed a **real test failure** (exit code 1 from the `Run Playwright tests` step) that had been masked by the timeout for so long nobody knew it was there.

PR #43 deescalates Playwright to non-blocking (`continue-on-error: true` in commit `d528a95`) so the merge isn't gated on a problem that pre-existed the rename / Sentry / Vercel work in PR #43. **This sprint is responsible for taking that deescalation back out** — diagnose the real failure(s), fix or quarantine the offending tests, re-enable the gate.

---

## Known facts (from PR #43 monitoring)

| Fact | Source |
|---|---|
| Failed step: `Run Playwright tests` | Webhook event runs `25938950408`, `25939147528` and others on PR #43 |
| Process exit code: `1` | Same |
| Failure detail not available via WebFetch | GitHub UI returned "There was an error while loading" — logs need a logged-in fetch, gh CLI, or the dashboard |
| Pattern: failure repeats on every commit since the workflow started executing | Webhook history on PR #43 |
| Apparent post-run `git 128` error | Misleading — that's the post-checkout cleanup, not the failure cause (verified pattern across other workflows in this session) |
| Visual regression suite exists | `apps/web/scripts/test:visual` + `playwright-visual.config.ts` references in `package.json` |
| Mascot test suites: Fox, Bear, Bunny | `package.json` has `test:visual:fox`, `test:visual:bear`, `test:visual:bunny` scripts |

## What we don't know

- Which specific test (or tests) fail
- Whether failure is deterministic or flaky
- Whether failure is related to visual baseline drift, network calls, missing fixture data, or something else entirely
- Whether the failure depends on a Vercel preview being live (PR #43's vercel.json fix may interact)

---

## Sprint plan

### Step 0 — Branch hygiene ✅ (initial scope-doc commit + this refinement)

Branch stacked on PR #44 (Agent ID Phase 0). Scope doc now reflects linear-progression placement in the portfolio plan tree.

### Step 1 — PR #43 prerequisite ✅ (satisfied 2026-05-16)

PR #43 merged at commit `d11542a` on main. The Playwright workflow's `pnpm --filter=@njzitegeist/web run build` step now works on every branch off main. **No cherry-pick needed.** This sprint branch was rebased onto PR #44 → main on 2026-05-16; rebase was clean (zero conflicts).

### Step 2 — Local repro

**Attempted 2026-05-18 from `claude/r2-7-playwright-step-2` branch.**

```bash
pnpm install --frozen-lockfile          # ✅ ok (workspace already hydrated)
cd apps/web
pnpm exec playwright install chromium   # ❌ failed: sandbox network restricted
pnpm run build                          # not attempted (browser missing)
pnpm exec playwright test               # not attempted (browser missing)
```

**Failure detail:**
```
Failed to install browsers
Error: Failed to download Chrome for Testing 145.0.7632.6 (playwright chromium v1208)
Error: Download failure, code=1
```

The current execution environment cannot reach the Playwright CDN to fetch
browser binaries. **Step 2 cannot complete in this sandbox.**

**Static survey performed instead** (no browsers required):

| Metric | Value |
|---|---|
| Spec files at top level | 6 (`tests/e2e/*.spec.ts`) |
| Spec files in `features/` | 10 (`tests/e2e/features/*.spec.ts`) |
| Total spec files | **16** |
| Total tests (Playwright `--list`) | **990** (198 unique × 5 browsers) |
| Largest suite | `navigation.spec.ts` (40 unique tests) |
| Existing conditional skips (runtime guards) | **7** |

### Step 2 alternative path — CI-based observation

When a local browser install is unblocked, the cheapest reroll is:

1. Trigger the **E2E Tests** workflow on this branch (it already exists at
   `.github/workflows/playwright.yml`, `continue-on-error: true` so it won't
   block the PR)
2. Download the `playwright-report` artifact from the run
3. `npx playwright show-report` against the artifact to drive failure inspection
4. Update Step 3 below with the actual failure ledger

For convenience, the workflow run for any PR on this branch can be found at:
`https://github.com/notbleaux/ZeSporteXte/actions/workflows/playwright.yml`

### Step 3 — Triage matrix

**Pre-populated** from static analysis (existing `test.skip(...)` markers documenting
real failure causes). The 7 entries below are already-quarantined runtime guards
that bypass the assertion when the UI prerequisite is absent — these are sprint
deliverables in their own right (need either the missing UI surface implemented,
or the test removed/rewritten).

| # | Test | File / line | Marker reason | Failure mode | Verdict |
|---|---|---|---|---|---|
| 1 | accessibility audit | `tests/e2e/accessibility.spec.ts:25` | "@axe-core/playwright not installed — run: pnpm add -D @axe-core/playwright" | missing dev dep | **fix** (add the dep + re-enable) |
| 2 | SpecMap pathfinding | `tests/e2e/specmap-viewer.spec.ts:388` | "Pathfinding UI not available" | feature unimplemented | **delete or rescope** (UI not shipping) |
| 3 | Mascot click | `tests/e2e/mascot-cross-browser.spec.ts:97` | "No clickable mascot element on this page" | UI changed | **rewrite** (locator outdated) |
| 4 | Mascot animation | `tests/e2e/mascot-cross-browser.spec.ts:162` | "No animation detected on mascot element" | UI changed | **rewrite** |
| 5 | Follow button (player card) | `tests/e2e/features/follows.spec.ts:25` | "No follow button visible — player cards may require API data" | data fixture missing | **fix fixture or skip** |
| 6 | Unfollow button | `tests/e2e/features/follows.spec.ts:39` | "No follow button visible" | same | **fix fixture or skip** |
| 7 | Search input | `tests/e2e/features/search.spec.ts:33` | "Search input not found on /stats — may be on a different hub" | routing changed | **update locator/route** |

For each **non-quarantined** failure surfaced by the CI artifact (next session):

| Column | Values |
|---|---|
| Test path + name | `tests/e2e/foo.spec.ts → "renders home page"` |
| Failure mode | timeout / assertion / setup error / network / visual diff |
| Deterministic? | yes / no (run 3× to check) |
| Pre-existing on `main`? | yes / no (checkout main, re-run) |
| Owner / suspect commit | git blame or last meaningful change |
| Verdict | fix / quarantine / delete |

### Step 4 — Fix or quarantine

- **Fix:** if the test is valid and exercises real behavior, fix the code or the test
- **Quarantine:** if the test is brittle/flaky and not on a critical path, mark it `test.skip()` with a TODO referencing this sprint
- **Delete:** if the test no longer reflects the product (e.g. asserts an old UI), delete it

### Step 5 — Re-enable the gate

Once Playwright run is consistently green (3+ consecutive runs):

1. Edit `.github/workflows/playwright.yml` — remove the `continue-on-error: true` (and the comment block) added in PR #43 commit `d528a95`
2. Update `docs/operations/EXTERNAL_SERVICE_RECONCILIATION.md` — move "Playwright deescalation" out of the deferred backlog
3. Update this scope doc's status to CLOSED
4. Bump `polyrepo/registry/index.json::plans.PLN-004-playwright-sprint.status` → `"shipped"`

### Step 6 — Sprint close

Final commit: archive this scope doc to `docs/sprints/closed/` with a one-paragraph outcome summary.

---

## Out of scope (sprint anti-bloat)

- Migrating Playwright to a different test runner (Vitest browser mode, Cypress, etc.) — this sprint stabilizes what exists
- Visual regression baseline regeneration — separate workstream if needed
- Adding new tests — sprint focus is making existing tests pass
- The 21 docker-compose-tests pre-existing bugs documented in PR #43 commit `17043af` — separate sprint
- TS error reduction (2,142 → <100, MASTER_PLAN.md) — separate sprint
- Network API gateway work (PLN-003 — separate plan entirely)

---

## Tracking

- Webhook events on PR #43 that surfaced this failure: runs `25938950408`, `25939147528` (and continuing on each new commit)
- Plan file: `/root/.claude/plans/plan-and-draft-the-elegant-widget.md` v002 (this sprint is one of several follow-up workstreams documented there)
- Central registry entry: `polyrepo/registry/index.json::plans.PLN-004-playwright-sprint`

---

## Agent ID sign-off (per AGENT_ID_PROTOCOL Phase 0 — advisory)

Every commit on this branch should carry:

```
Agent-Sign-Off:    agent://<lineage>/<model>/<session>/<order>
Plan-Counter:      PLN-004-playwright-sprint-A<N>
Portfolio-Counter: NJZPL-MUTUAL-<N>
```

The sprint owner bumps `polyrepo/registry/index.json::plans.PLN-004-playwright-sprint.next` for each action consumed.

---

## Definition of Done

- [ ] All E2E tests pass on `main` (3 consecutive green runs)
- [ ] `continue-on-error: true` removed from `.github/workflows/playwright.yml::Run Playwright tests`
- [ ] EXTERNAL_SERVICE_RECONCILIATION report updated to remove Playwright from the deferred backlog
- [ ] `PLN-004-playwright-sprint.status` → `"shipped"` in the central registry
- [ ] This scope doc moved to `docs/sprints/closed/PLAYWRIGHT_E2E_SPRINT.md` with outcome summary
- [ ] Sign-off appended to merge commit per AGENT_ID_PROTOCOL

## Session log

| Date | Session | Action | Outcome |
|---|---|---|---|
| 2026-05-18 | claude/r2-7-playwright-step-2 | Attempted Step 2 local repro | Browser install network-blocked in sandbox; produced static survey + pre-populated Step 3 triage matrix; handed off to CI-artifact path |

