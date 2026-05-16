[Ver001.000]

# Playwright E2E Sprint — Scope

**Status:** OPEN · sprint kickoff
**Branch:** `claude/playwright-sprint`
**Owner:** TBD (sprint candidate; could be a focused human session, Kimi, or a follow-up Claude session)
**Pre-requisite:** PR #43 should merge first (it contains the `pnpm --filter=@njzitegeist/web` fix the workflow needs to even execute the tests)

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

### Step 0 — Branch hygiene (this commit)

This file. Branch off main.

### Step 1 — Wait for PR #43 to merge OR cherry-pick its workflow fix

`pnpm --filter web run build` doesn't work on this branch (still the OLD pre-PR-#43 filter); the build step fails before Playwright even runs. Pick:

- **Option a:** Wait for PR #43 to merge → rebase this branch on the new main → workflow runs through to Playwright step
- **Option b:** Cherry-pick PR #43 commits `439262e` (filter fix) and `79a629e` (`@njz/types` tsconfig fix) into this branch immediately

Recommendation: **(a)** — keeps the sprint branch clean. Don't accumulate cherry-picks from PR #43.

### Step 2 — Local repro

```bash
pnpm install --frozen-lockfile
cd apps/web
pnpm exec playwright install --with-deps
pnpm run build
pnpm exec playwright test --reporter=list 2>&1 | tee /tmp/playwright-sprint-run-1.log
```

Goal: identify which tests fail, with verbose output. List reporter shows pass/fail per test inline; HTML report is a fallback if the failure mode needs trace inspection.

### Step 3 — Triage matrix

For each failing test:

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

### Step 6 — Sprint close

Final commit: archive this scope doc to `docs/sprints/closed/` with a one-paragraph outcome summary.

---

## Out of scope (sprint anti-bloat)

- Migrating Playwright to a different test runner (Vitest browser mode, Cypress, etc.) — this sprint stabilizes what exists
- Visual regression baseline regeneration — separate workstream if needed
- Adding new tests — sprint focus is making existing tests pass
- The 21 docker-compose-tests pre-existing bugs documented in PR #43 commit `17043af` — separate sprint
- TS error reduction (2,142 → <100, MASTER_PLAN.md) — separate sprint

---

## Tracking

- Webhook events on PR #43 that surfaced this failure: runs `25938950408`, `25939147528` (and continuing on each new commit)
- Plan file: `/root/.claude/plans/plan-and-draft-the-elegant-widget.md` v002 (this sprint is one of several follow-up workstreams documented there)
- Agent ID: this sprint's first author should sign off per `.agents/AGENT_ID_PROTOCOL.md` (Phase 0, advisory)

---

## Definition of Done

- [ ] All E2E tests pass on `main` (3 consecutive green runs)
- [ ] `continue-on-error: true` removed from `.github/workflows/playwright.yml::Run Playwright tests`
- [ ] EXTERNAL_SERVICE_RECONCILIATION report updated to remove Playwright from the deferred backlog
- [ ] This scope doc moved to `docs/sprints/closed/PLAYWRIGHT_E2E_SPRINT.md` with outcome summary
- [ ] Sign-off appended to merge commit per AGENT_ID_PROTOCOL
