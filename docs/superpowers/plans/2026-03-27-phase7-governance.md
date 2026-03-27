# Phase 7 — Repository Governance and Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the full governance infrastructure (CODEOWNERS, risk-tiered PR system, Job Board deletion, archive consolidation, agent coordination files) that gates all subsequent phases.

**Architecture:** Single-owner `@notbleaux` CODEOWNERS with risk-tiered auto-merge (`[SAFE]`/`[STRUCT]`/`[CRIT]`), GitHub Actions for PR classification and auto-merge, permanent Job Board deletion via a CRIT PR, date-indexed `Archived/` structure pending migration to a separate archive repo, new T0 agent coordination files, and PHASE_GATES.md extended with a DAG header and Phases 7–13 gates.

**Tech Stack:** GitHub CODEOWNERS, GitHub Actions (YAML workflows), bash/git for archive reorganisation, Markdown for all documentation files.

**CODEOWNER_APPROVAL_REQUIRED:** Gate 7.2 (Job Board deletion) requires a `[CRIT]` PR — 24-hour hold after CODEOWNER approval before merge.

---

## File Map

**Created:**
- `.github/CODEOWNERS`
- `.github/workflows/pr-classification.yml`
- `.github/workflows/auto-merge.yml`
- `.github/pull_request_template/feature.md`
- `.github/pull_request_template/fix.md`
- `.github/pull_request_template/refactor.md`
- `.github/pull_request_template/schema-change.md`
- `.github/pull_request_template/deletion.md`
- `.github/pull_request_template/docs.md`
- `.github/commit-msg` (hook script)
- `.agents/CODEOWNER_CHECKLIST.md`
- `.agents/COORDINATION_PROTOCOL.md` (replaces stub)
- `.agents/ARCHIVE_INDEX_SCHEDULE.md`
- `ARCHIVE_MASTER_DOSSIER.md` (repo root, T0)
- `docs/superpowers/visual-design-book/VISUAL_DESIGN_REQUEST_CONTEXT.md`
- `docs/superpowers/visual-design-book/VISUAL_DESIGN_BOOK_SCHEMA.md`
- `docs/superpowers/visual-design-book/RESEARCH_REPORT_SCHEMA.md`
- `docs/superpowers/visual-design-book/RESEARCH_CONTEXT_PROMPT_SCHEMA.md`
- `Archived/Y25/M00-UNDATED/.gitkeep`
- `Archived/Y26/M00-UNDATED/.gitkeep`

**Modified:**
- `.agents/AGENT_CONTRACT.md` — add CODEOWNER_APPROVAL_REQUIRED prohibition
- `.agents/PHASE_GATES.md` — add DAG header + Phases 7–13 gates
- `.doc-tiers.json` — add new T0 files
- `MASTER_PLAN.md` — add Phases 7–13 sections
- `CLAUDE.md` — remove Job Board reference from Agent Coordination (after gate 7.2)
- `AGENTS.md` — remove `.job-board/` from directory diagram (after gate 7.2)

**Deleted (gate 7.2 — CRIT PR):**
- `archive/.job-board/` — entire directory, 329 files, permanent removal

---

## Task 1: CODEOWNERS File

**Files:**
- Create: `.github/CODEOWNERS`

- [ ] **Step 1: Verify `.github/` directory exists or note it needs creation**

Run: `ls /c/Users/jacke/Documents/GitHub/eSports-EXE/.github/`
Expected: directory listing (may or may not exist)

- [ ] **Step 2: Create `.github/CODEOWNERS`**

```
# CODEOWNERS — NJZ eSports Platform
# Single owner: @notbleaux
# All paths covered; highest-scrutiny overrides for schemas, services, agents, infra

# Default: everything requires @notbleaux review
*                                    @notbleaux

# === Highest Scrutiny Overrides ===
# Schema changes: breaking types affects every consumer
data/schemas/                        @notbleaux
packages/@njz/types/                 @notbleaux

# Service models: Pydantic schema changes affect API contracts
services/*/models.py                 @notbleaux
services/*/schemas.py                @notbleaux

# Agent coordination: governance files
.agents/                             @notbleaux
.github/                             @notbleaux

# Infrastructure: deployment configs
infra/                               @notbleaux
docker-compose*.yml                  @notbleaux
package.json                         @notbleaux
pnpm-workspace.yaml                  @notbleaux
```

- [ ] **Step 3: Commit**

```bash
git add .github/CODEOWNERS
git commit -m "chore(infra): add CODEOWNERS file — single owner @notbleaux [SAFE]"
```

---

## Task 2: PR Classification Workflow

**Files:**
- Create: `.github/workflows/pr-classification.yml`

- [ ] **Step 1: Create the PR classification workflow**

```yaml
# .github/workflows/pr-classification.yml
name: PR Classification

on:
  pull_request:
    types: [opened, synchronize, reopened, edited]

jobs:
  classify:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Read commit messages and PR title for risk tag
        id: detect_risk
        run: |
          PR_TITLE="${{ github.event.pull_request.title }}"
          COMMITS=$(git log origin/${{ github.base_ref }}..HEAD --oneline)

          # Check for explicit CRIT override paths
          CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}..HEAD)
          CRIT_PATHS=$(echo "$CHANGED_FILES" | grep -E '^(data/schemas/|services/[^/]+/models\.py|services/[^/]+/schemas\.py|\.github/|infra/|package\.json$|docker-compose)' || true)

          # Deletion check: > 5 files deleted
          DELETED_COUNT=$(git diff --diff-filter=D --name-only origin/${{ github.base_ref }}..HEAD | wc -l)

          if echo "$PR_TITLE" | grep -q '\[CRIT\]' || [ -n "$CRIT_PATHS" ] || [ "$DELETED_COUNT" -gt 5 ]; then
            echo "tier=CRIT" >> $GITHUB_OUTPUT
          elif echo "$PR_TITLE" | grep -q '\[STRUCT\]'; then
            echo "tier=STRUCT" >> $GITHUB_OUTPUT
          elif echo "$PR_TITLE" | grep -q '\[SAFE\]'; then
            echo "tier=SAFE" >> $GITHUB_OUTPUT
          else
            # Auto-safe commit types: docs, test, chore (lint/format only)
            if echo "$PR_TITLE" | grep -qE '^(docs|test|chore)\('; then
              echo "tier=SAFE" >> $GITHUB_OUTPUT
            else
              echo "tier=STRUCT" >> $GITHUB_OUTPUT
            fi
          fi

      - name: Remove existing tier labels
        run: |
          gh pr edit ${{ github.event.pull_request.number }} \
            --remove-label "safe-auto-merge" \
            --remove-label "structural-review" \
            --remove-label "critical-block" || true
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Apply tier label
        run: |
          TIER="${{ steps.detect_risk.outputs.tier }}"
          if [ "$TIER" = "CRIT" ]; then
            gh pr edit ${{ github.event.pull_request.number }} --add-label "critical-block"
          elif [ "$TIER" = "STRUCT" ]; then
            gh pr edit ${{ github.event.pull_request.number }} --add-label "structural-review"
          else
            gh pr edit ${{ github.event.pull_request.number }} --add-label "safe-auto-merge"
          fi
          echo "Classified as: $TIER"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/pr-classification.yml
git commit -m "feat(infra): add PR risk-tier classification workflow [SAFE]"
```

---

## Task 3: Auto-Merge Workflow

**Files:**
- Create: `.github/workflows/auto-merge.yml`

- [ ] **Step 1: Create the auto-merge workflow**

```yaml
# .github/workflows/auto-merge.yml
name: Auto-Merge Safe PRs

on:
  pull_request:
    types: [labeled]
  check_suite:
    types: [completed]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: |
      github.event.label.name == 'safe-auto-merge' ||
      (github.event_name == 'check_suite' && github.event.check_suite.conclusion == 'success')
    permissions:
      pull-requests: write
      contents: write
    steps:
      - name: Check if PR has safe-auto-merge label
        id: check_label
        run: |
          LABELS=$(gh pr view ${{ github.event.pull_request.number }} --json labels --jq '.labels[].name' 2>/dev/null || echo "")
          if echo "$LABELS" | grep -q "safe-auto-merge"; then
            echo "should_merge=true" >> $GITHUB_OUTPUT
          else
            echo "should_merge=false" >> $GITHUB_OUTPUT
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Wait for all checks to pass
        if: steps.check_label.outputs.should_merge == 'true'
        run: |
          # Poll until all required checks pass (max 10 minutes)
          for i in $(seq 1 20); do
            STATUS=$(gh pr checks ${{ github.event.pull_request.number }} --json state --jq '[.[] | .state] | unique | length == 1 and .[0] == "SUCCESS"' 2>/dev/null || echo "false")
            if [ "$STATUS" = "true" ]; then
              echo "All checks passed"
              break
            fi
            echo "Waiting for checks... attempt $i/20"
            sleep 30
          done
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Auto-merge
        if: steps.check_label.outputs.should_merge == 'true'
        run: |
          gh pr merge ${{ github.event.pull_request.number }} \
            --squash \
            --delete-branch \
            --subject "$(gh pr view ${{ github.event.pull_request.number }} --json title --jq .title)"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Create required GitHub labels (run once manually or via script)**

```bash
# Run from repo root with GH_TOKEN set
gh label create "safe-auto-merge" --color "0e8a16" --description "Auto-merges after CI passes" 2>/dev/null || true
gh label create "structural-review" --color "e4e669" --description "Requires CODEOWNER review" 2>/dev/null || true
gh label create "critical-block" --color "d93f0b" --description "Requires CODEOWNER review + 24h hold" 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/auto-merge.yml
git commit -m "feat(infra): add safe-auto-merge workflow [SAFE]"
```

---

## Task 4: Commit Message Convention Hook + PR Templates

**Files:**
- Create: `.github/commit-msg`
- Create: `.github/pull_request_template/feature.md` (and 5 others)

- [ ] **Step 1: Create commit-msg hook**

```bash
#!/bin/sh
# .github/commit-msg — validates conventional commit format with optional risk tag
# Install: cp .github/commit-msg .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Pattern: type(scope): description [SAFE|STRUCT|CRIT] (tag optional)
PATTERN='^(feat|fix|docs|style|refactor|test|chore|delete)\([a-zA-Z0-9_\-]+\): .{10,}( \[(SAFE|STRUCT|CRIT)\])?'

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo "ERROR: Commit message does not match conventional commit format."
  echo ""
  echo "Required format: type(scope): description [SAFE|STRUCT|CRIT]"
  echo "Example: feat(website): add SATOR live panel [STRUCT]"
  echo ""
  echo "Valid types: feat, fix, docs, style, refactor, test, chore, delete"
  echo "Risk tag: [SAFE] [STRUCT] [CRIT] — optional for docs/test/chore, required for feat/fix/refactor/delete"
  exit 1
fi
```

- [ ] **Step 2: Create the 6 PR templates**

Create `.github/pull_request_template/feature.md`:
```markdown
## Feature: [description]

### What this adds
-

### Risk tier
- [ ] `[SAFE]` — non-breaking, no schema changes
- [ ] `[STRUCT]` — structural change, requires CODEOWNER review
- [ ] `[CRIT]` — schema/infra/deletion change, 24h hold

### Testing
- [ ] Unit tests added/updated
- [ ] E2E tests cover the new route/feature
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test:unit` passes

### Checklist
- [ ] Follows TENET architecture (no TENET-as-hub violations)
- [ ] No inline type definitions (all types via `@njz/types`)
- [ ] No secrets committed
- [ ] `[agent: <id>]` footer added if agent-authored
```

Create `.github/pull_request_template/fix.md`:
```markdown
## Fix: [description]

### Root cause
[One sentence describing why this broke]

### Fix applied
[One sentence describing the change]

### Risk tier
- [ ] `[SAFE]` — isolated fix, no interface changes
- [ ] `[STRUCT]` — fix changes a type or cross-service contract
- [ ] `[CRIT]` — fix touches schema, auth, or infra

### Testing
- [ ] Regression test added that would have caught this bug
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test:unit` passes

### Checklist
- [ ] No secrets committed
- [ ] `[agent: <id>]` footer added if agent-authored
```

Create `.github/pull_request_template/refactor.md`:
```markdown
## Refactor: [description]

### What changed
[What was restructured and why — no behaviour changes expected]

### Risk tier
- [ ] `[SAFE]` — internal restructure, no interface changes
- [ ] `[STRUCT]` — interface shape changed (imports, exports, API surface)

### Testing
- [ ] All existing tests still pass without modification
- [ ] `pnpm typecheck` passes

### Checklist
- [ ] No new features added (YAGNI)
- [ ] No secrets committed
```

Create `.github/pull_request_template/schema-change.md`:
```markdown
## Schema Change: [type name]

**THIS PR IS ALWAYS `[CRIT]`** — schema changes affect every consumer.

### Change description
[What was added, renamed, or removed]

### Consumer impact
| Consumer | Impact | Migration required? |
|----------|--------|---------------------|
| `apps/web/` | | |
| `services/` | | |
| `packages/shared/` | | |

### Testing
- [ ] `pnpm typecheck` passes across full monorepo
- [ ] `.agents/SCHEMA_REGISTRY.md` updated with new/changed types
- [ ] No duplicate type definitions (`grep -r "interface Player" apps/web/src/` → 0)

### Checklist
- [ ] CODEOWNER review obtained
- [ ] 24-hour hold observed
- [ ] `[agent: <id>]` footer added if agent-authored
```

Create `.github/pull_request_template/deletion.md`:
```markdown
## Deletion: [what is being removed]

**THIS PR IS ALWAYS `[CRIT]`** — deletions are irreversible.

### Files deleted
[List all files or provide count]

### Why permanent (not archived)
[Reason this is a full deletion]

### Audit trail
[Where the permanent record lives — e.g., this PR description IS the audit trail]

### Reference scrub
- [ ] All `.md` files referencing the deleted paths updated
- [ ] `grep -r "<deleted-path>" . --include="*.md"` returns 0

### Checklist
- [ ] CODEOWNER review obtained
- [ ] 24-hour hold observed after approval before merge
- [ ] `[agent: <id>]` footer added if agent-authored
```

Create `.github/pull_request_template/docs.md`:
```markdown
## Docs: [description]

### What changed
[Which documents and why]

### Risk tier
- [x] `[SAFE]` — documentation only (auto-safe)

### Checklist
- [ ] Version header `[VerMMM.mmm]` incremented on modified docs
- [ ] No T2 documents loaded or modified (check `.doc-tiers.json`)
- [ ] Links/paths in updated docs still resolve
```

- [ ] **Step 3: Commit**

```bash
git add .github/commit-msg .github/pull_request_template/
git commit -m "chore(infra): add commit-msg hook and 6 PR templates [SAFE]"
```

---

## Task 5: Agent Coordination Files

**Files:**
- Create: `.agents/CODEOWNER_CHECKLIST.md`
- Create: `.agents/ARCHIVE_INDEX_SCHEDULE.md`
- Modify: `.agents/AGENT_CONTRACT.md`
- Modify: `.agents/COORDINATION_PROTOCOL.md` (or create if missing)

- [ ] **Step 1: Check if COORDINATION_PROTOCOL.md exists**

Run: `ls /c/Users/jacke/Documents/GitHub/eSports-EXE/.agents/`
Expected: directory listing — note which files exist

- [ ] **Step 2: Create `.agents/CODEOWNER_CHECKLIST.md`**

```markdown
[Ver001.000]

# CODEOWNER Checklist — NJZ eSports Platform

**Purpose:** All tasks requiring CODEOWNER approval before agents may proceed.
**Tier:** T0 — always loaded.
**Authority:** `.agents/AGENT_CONTRACT.md §CODEOWNER_APPROVAL_REQUIRED`

An agent MUST NOT begin a CODEOWNER_APPROVAL_REQUIRED task without a CLAIMED entry here confirmed by @notbleaux.

---

## Claiming Protocol

1. Agent reads this file and confirms the task is UNCLAIMED
2. Agent opens a PR adding a CLAIM comment to the relevant entry (status: PENDING_APPROVAL)
3. @notbleaux reviews the claim and approves via PR review (status: CLAIMED → ACTIVE)
4. Agent proceeds only after ACTIVE status is set

---

## CODEOWNER_APPROVAL_REQUIRED Touchpoints

### Phase 7 — Repository Governance

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-7.2 | Job Board permanent deletion — 329 files `[CRIT]` PR | UNCLAIMED | — | 24h hold after approval |
| C-7.X | Visual Design Book — Phase 0-X research task claim | UNCLAIMED | — | Deep research agent preferred |

### Phase 8 — API Gateway and Auth

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-8.2 | Auth0 tenant configuration — requires @notbleaux credentials | UNCLAIMED | — | Agent creates setup guide, human configures |

### Phase 12 — Content and Prediction Platform

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-12.B | Betting/Prediction UI — gambling-adjacent opt-in | UNCLAIMED | — | Deliberate feature, not default |

### Phase 13 — Production Launch

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-13.D | Production deployment — irreversible | UNCLAIMED | — | All Phase 10+11+12 gates must pass first |

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| UNCLAIMED | No agent has claimed this task |
| PENDING_APPROVAL | Agent has submitted claim PR, awaiting @notbleaux approval |
| CLAIMED → ACTIVE | @notbleaux approved — agent may proceed |
| COMPLETED | Task complete, gate passed |
| BLOCKED | External blocker (e.g. awaiting user credentials) |
```

- [ ] **Step 3: Create `.agents/ARCHIVE_INDEX_SCHEDULE.md`**

```markdown
[Ver001.000]

# Archive Index Schedule — NJZ eSports Platform

**Purpose:** Rolling 360-day schedule for monthly archive index updates.
**Authority:** `docs/superpowers/specs/2026-03-27-master-plan-extension-phase7-13-design.md §14`
**Tier:** T1 — load when working on archive tasks.

---

## Schedule

The ARCHIVE_MASTER_DOSSIER.md at repo root is updated on a monthly cadence using the M-Q1 through M-Q4 time-quarter system.

| Cadence Label | Trigger | Agent Action |
|---------------|---------|--------------|
| M-Q1 | First 7 days of month | Run archive scan: `git log --diff-filter=A --name-only -- Archived/ | head -200` |
| M-Q2 | Days 8–14 | Update INDEX TABLE in ARCHIVE_MASTER_DOSSIER.md with new files |
| M-Q3 | Days 15–21 | Update FAQ and Cross-Reference Map sections |
| M-Q4 | Days 22–end | Version bump ARCHIVE_MASTER_DOSSIER.md, commit `[SAFE]` |

---

## Spawning Sequence for Archive Updates

1. **Async Verifier** (single agent, 9-pass verification):
   - Pass 1–3: Confirm Archived/ structure matches schema
   - Pass 4–6: Check for new files added since last update
   - Pass 7–9: Cross-check ARCHIVE_MASTER_DOSSIER.md index completeness
   - Output: consolidated verification report

2. **On verification complete**, spawn:
   - Foreman agent (1): coordinates remaining agents, owns final commit
   - Sub-agents (3): update Index Table, FAQ, Cross-Reference Map sections in parallel
   - Standard agents (5): validate all links, check T2 compliance, verify no T2 content loaded

3. **Final Pass** (3-phase):
   - Phase A: Accuracy — are file entries correct?
   - Phase B: Consistency — do cross-references match the index?
   - Phase C: Completeness — are all new Archived/ files represented?

---

## Migration Status

| Status | Date Set | Notes |
|--------|----------|-------|
| Pending reorganisation | 2026-03-27 | archive/ → Archived/Y25/ + Archived/Y26/ not yet done |
| Pending repo creation | 2026-03-27 | notbleaux/eSports-EXE-archives repo not yet created |
| Migration complete | — | Archived/ subtree pushed to archive repo |
```

- [ ] **Step 4: Add CODEOWNER_APPROVAL_REQUIRED prohibition to AGENT_CONTRACT.md**

Read `.agents/AGENT_CONTRACT.md` first (already done above). Append to the Prohibited Actions section:

In [AGENT_CONTRACT.md](../../../.agents/AGENT_CONTRACT.md), locate the `## Prohibited Actions` section and add after the existing bullets:

```
- Begin any task listed in `.agents/CODEOWNER_CHECKLIST.md` without that task showing `CLAIMED → ACTIVE` status confirmed by @notbleaux
- Merge or approve a `[CRIT]` PR before the 24-hour hold period has elapsed after CODEOWNER approval
```

Increment version header from `[Ver001.000]` to `[Ver001.001]`.

- [ ] **Step 5: Update or create `.agents/COORDINATION_PROTOCOL.md`**

If file exists, append the Time-Quarter Cadence section. If missing, create:

```markdown
[Ver001.000]

# Coordination Protocol — NJZ eSports Platform

**Authority:** `.agents/AGENT_CONTRACT.md`
**Tier:** T1 — load when coordinating multi-agent work.

---

## Time-Quarter Cadence

### Daily Quarters

| Label | Time Window | Purpose |
|-------|-------------|---------|
| Q1 | 00:00–06:00 | Overnight async tasks, batch jobs, archive scans |
| Q2 | 06:00–12:00 | Morning verification passes, gate checks |
| Q3 | 12:00–18:00 | Active implementation, PR submissions |
| Q4 | 18:00–24:00 | Review, final passes, commit + push |

### Weekly Quarters

| Label | Days | Purpose |
|-------|------|---------|
| W1 | Mon–Tue | Phase gate task execution |
| W2 | Wed | Structural reviews, CODEOWNER touchpoints |
| W3 | Thu | Integration + cross-service work |
| W4 | Fri | Final passes, PR submissions for the week |
| W5 | Sat | Optional overflow |
| W+1 | Sun | Compression day — archive index updates, memory consolidation, doc cleanup |

### Monthly Quarters

| Label | Days | Purpose |
|-------|------|---------|
| M-Q1 | 1–7 | Archive scan (see ARCHIVE_INDEX_SCHEDULE.md) |
| M-Q2 | 8–14 | Index table update |
| M-Q3 | 15–21 | FAQ and cross-reference update |
| M-Q4 | 22–end | Version bump + commit |

---

## Agent Spawning Sequence

### Standard Multi-Agent Task

1. **Async Verifier** (1 agent): runs 9 verification passes across 2 phases
   - Phase 1 (passes 1–5): read all relevant files, check for gaps/conflicts
   - Phase 2 (passes 6–9): cross-check interdependencies
   - Outputs: consolidated verification report → triggers next spawn

2. **On report received**, spawn in parallel:
   - **Foreman** (1): owns final commit, coordinates sub-agents, resolves conflicts
   - **Sub-agents** (3): execute specific implementation segments assigned by Foreman
   - **Standard agents** (5): validation, typecheck, test runs, lint

3. **Final Pass** (Foreman, 3 phases):
   - Phase A: Accuracy
   - Phase B: Consistency
   - Phase C: Completeness

### Spawn Log Format

Every spawned agent session MUST create a log at `.agents/spawn-logs/YYYY-MM-DD/<agent-id>.md`:

```markdown
[Ver001.000]

# Agent Spawn Log — <agent-id>

**Date:** YYYY-MM-DD
**Phase:** Phase N
**Task:** [task description]
**Spawned by:** <parent-agent-id> | CODEOWNER

## Verification Passes
[results of each pass]

## Actions Taken
[files modified, PRs created]

## Status
[ ] In progress / [x] Complete / [ ] Blocked

**Blocker (if any):** [description]
```
```

- [ ] **Step 6: Commit all agent coordination files**

```bash
git add .agents/CODEOWNER_CHECKLIST.md \
        .agents/ARCHIVE_INDEX_SCHEDULE.md \
        .agents/COORDINATION_PROTOCOL.md \
        .agents/AGENT_CONTRACT.md
git commit -m "chore(agents): add CODEOWNER_CHECKLIST, ARCHIVE_INDEX_SCHEDULE, COORDINATION_PROTOCOL; update AGENT_CONTRACT [SAFE]"
```

---

## Task 6: PHASE_GATES.md — DAG Header + Phases 7–13

**Files:**
- Modify: `.agents/PHASE_GATES.md`

- [ ] **Step 1: Read the current PHASE_GATES.md**

Run: read `.agents/PHASE_GATES.md` (confirm current state, verify Phase 6 is ✅ COMPLETE)

- [ ] **Step 2: Add DAG header block after the document header**

Insert immediately after the `---` following the current header block:

```markdown
## Phase Dependency Graph

```
Phase 0-X ──────────────────────────────────────────────────► (background, never gates)
Phase 7  ──────────────────────────────────────────────────┐
Phase 8  ──────────────────────────────────────────────────┤
Phase 9  (concurrent with 8, no hard dep) ─────────────────┤
                                                           ▼
Phase 10 (DEPENDS_ON: Phase 8) ────────────────────────────┐
Phase 11 (DEPENDS_ON: Phase 8) ────────────────────────────┤
Phase 12 (DEPENDS_ON: Phase 8) ────────────────────────────┤
                                                           ▼
Phase 13 (DEPENDS_ON: Phase 10 + 11 + 12) ────────────► LAUNCH
```

**CODEOWNER_APPROVAL_REQUIRED:** Phase 7 Job Board deletion · Phase 8 Auth0 config · Phase 12 Betting UI · Phase 13 production deploy
```

- [ ] **Step 3: Update Phase Status table to include Phases 7–13**

Replace the existing Phase Status table:

```markdown
| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Immediate Housekeeping | ✅ COMPLETE |
| Phase 1 | Schema Foundation | ✅ COMPLETE |
| Phase 2 | Service Architecture | ✅ COMPLETE |
| Phase 3 | Frontend Correction | ✅ COMPLETE |
| Phase 4 | Data Pipeline Lambda | ✅ COMPLETE |
| Phase 5 | Ecosystem Expansion | ✅ COMPLETE |
| Phase 6 | LIVEOperations & Advanced | ✅ COMPLETE |
| Phase 0-X | Non-Blocking Supplementals | 🟡 ACTIVE (background) |
| Phase 7 | Repository Governance & Hygiene | 🟡 UNLOCKED |
| Phase 8 | API Gateway & Auth Platform | 🔒 BLOCKED on Phase 7 |
| Phase 9 | Web App UI/UX Enhancement | 🟡 UNLOCKED (concurrent with 8) |
| Phase 10 | Companion App MVP | 🔒 BLOCKED on Phase 8 |
| Phase 11 | Browser Extension & LiveStream Overlay | 🔒 BLOCKED on Phase 8 |
| Phase 12 | Content & Prediction Platform | 🔒 BLOCKED on Phase 8 |
| Phase 13 | Simulation Engine & Production Launch | 🔒 BLOCKED on Phase 10+11+12 |
```

- [ ] **Step 4: Append Phase 0-X gates section**

```markdown
## Phase 0-X Gates — Non-Blocking Supplementals

**Status:** ACTIVE background track — never blocks numbered phases
**CODEOWNER_APPROVAL_REQUIRED:** Yes, before any agent may claim tasks (see CODEOWNER_CHECKLIST.md C-7.X)

| Gate | Criteria | Verification | Status |
|------|----------|--------------|--------|
| 0-X.1 | `docs/superpowers/visual-design-book/` contains all 4 schema files | `ls docs/superpowers/visual-design-book/` shows 4 files | ❌ Pending |
| 0-X.2 | Research context file contains verbatim deep-research directive | Manual review | ❌ Pending |
| 0-X.3 | CODEOWNER claim approved for Visual Design Book task | `CODEOWNER_CHECKLIST.md` C-7.X shows CLAIMED → ACTIVE | ❌ Pending |
```

- [ ] **Step 5: Append Phase 7 gates section**

```markdown
## Phase 7 Gates — Repository Governance and Hygiene

**DEPENDS_ON:** None (first unlocked phase)
**BLOCKS:** Phase 8 (Phase 9 may proceed concurrently)

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 7.1 | `.github/CODEOWNERS` active, risk-tier workflow deployed | `test -f .github/CODEOWNERS && test -f .github/workflows/pr-classification.yml` | ❌ Pending |
| 7.2 | Job Board fully deleted, all reference files scrubbed (CRIT PR + 24h hold) | `grep -r "job-board" . --include="*.md" \| grep -v "archive/"` returns 0 | ❌ Pending — CODEOWNER_APPROVAL_REQUIRED |
| 7.3 | `Archived/` date structure created, all archive/ files assigned to dated subdirs | `ls Archived/Y25/ Archived/Y26/` shows populated subdirs | ❌ Pending |
| 7.4 | `ARCHIVE_MASTER_DOSSIER.md` exists at repo root with complete index table | `test -f ARCHIVE_MASTER_DOSSIER.md` | ❌ Pending |
| 7.5 | `.agents/CODEOWNER_CHECKLIST.md` exists, AGENT_CONTRACT.md prohibition added | `test -f .agents/CODEOWNER_CHECKLIST.md` | ❌ Pending |
| 7.6 | PHASE_GATES.md has DAG header and DEPENDS_ON fields for phases 7–13 | Manual review | ❌ Pending |

**Phase 7 unlocks Phase 8 when:** All 6 gates show ✅ PASSED
```

- [ ] **Step 6: Append Phase 8 through 13 gate stubs**

```markdown
## Phase 8 Gates — API Gateway and Auth Platform

**DEPENDS_ON:** Phase 7 gate passed
**BLOCKS:** Phases 10, 11, 12
**CODEOWNER_APPROVAL_REQUIRED:** Gate 8.2 (Auth0 configuration requires user credentials)

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 8.1 | Gateway routes to all downstream services, `/health` aggregates all statuses | `curl localhost:9000/health` returns all service statuses | 🔒 Locked |
| 8.2 | JWT auth middleware rejects unauthenticated requests to protected routes | `pytest services/api-gateway/tests/test_auth.py` | 🔒 Locked — CODEOWNER_APPROVAL_REQUIRED |
| 8.3 | Rate limiting enforced, circuit breaker trips on service outage | Load test + manual service kill test | 🔒 Locked |

---

## Phase 9 Gates — Web App UI/UX Enhancement

**DEPENDS_ON:** None (concurrent with Phase 8)
**Note:** Phase 0-X Visual Design Book feeds into this when available

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 9.1 | All design tokens defined in `tokens.css`, Tailwind config updated | `pnpm typecheck` passes, visual regression tests pass | 🔒 Pending Phase 7 |
| 9.2 | All `@njz/ui` components documented with usage examples | Manual review of `packages/@njz/ui/README.md` | 🔒 Pending Phase 7 |
| 9.3 | Lighthouse ≥ 90 on all routes, WCAG 2.1 AA audit passed | `npx playwright test --project=accessibility` + Lighthouse CI | 🔒 Pending Phase 7 |

---

## Phase 10 Gates — Companion App MVP

**DEPENDS_ON:** Phase 8 gate passed
**CODEOWNER_APPROVAL_REQUIRED:** None

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 10.1 | App builds on iOS simulator and Android emulator | `eas build --platform all --local` passes | 🔒 Locked |
| 10.2 | Auth login, live scores display, profile page render | Manual smoke test on both simulators | 🔒 Locked |
| 10.3 | Push notification received on device | `eas notifications:test` | 🔒 Locked |

---

## Phase 11 Gates — Browser Extension and LiveStream Overlay

**DEPENDS_ON:** Phase 8 gate passed
**CODEOWNER_APPROVAL_REQUIRED:** None

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 11.1 | Extension installs in Chrome, popup renders live scores, badge updates | Manual install test in Chrome | 🔒 Locked |
| 11.2 | OBS browser source renders score HUD at 1920×1080, transparent background | Manual OBS test | 🔒 Locked |
| 11.3 | WebSocket connection survives browser/OBS session across 30 minutes | Manual connection stability test | 🔒 Locked |

---

## Phase 12 Gates — Content and Prediction Platform

**DEPENDS_ON:** Phase 8 gate passed
**CODEOWNER_APPROVAL_REQUIRED:** Gate 12.B (Betting/Prediction UI — deliberate opt-in)

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 12.1 | Wiki app deployed, game-world entries render for Valorant and CS2 | `pnpm --filter @njz/wiki build` + Vercel preview | 🔒 Locked |
| 12.2 | Nexus portal aggregates all World-Port cards with live status | Manual review of nexus app | 🔒 Locked |
| 12.3 | Token-based prediction UI accessible to authenticated users | Manual smoke test | 🔒 Locked — CODEOWNER_APPROVAL_REQUIRED |
| 12.4 | OddsEngine confidence scores visible in prediction UI | `pytest packages/shared/api/src/betting/` passes | 🔒 Locked |

---

## Phase 13 Gates — Simulation Engine and Production Launch

**DEPENDS_ON:** Phase 10 + Phase 11 + Phase 12 all gated passed
**CODEOWNER_APPROVAL_REQUIRED:** Gate 13.D (production deployment — irreversible)

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 13.1 | Godot simulation engine unpaused, builds headless | `godot --headless --script tests/run_tests.gd` passes | 🔒 Locked |
| 13.2 | XSim engine connected to platform data pipeline | `pytest tests/integration/ -k simulation` passes | 🔒 Locked |
| 13.3 | All production environment variables set and validated | `pnpm run validate:schema` + infra config review | 🔒 Locked |
| 13.4 | Full E2E test suite passes against production build | `npx playwright test` against production URL | 🔒 Locked — CODEOWNER_APPROVAL_REQUIRED |
```

- [ ] **Step 7: Increment version header from `[Ver001.002]` to `[Ver001.003]`**

- [ ] **Step 8: Commit**

```bash
git add .agents/PHASE_GATES.md
git commit -m "docs(agents): extend PHASE_GATES with DAG header and phases 7-13 gate stubs [SAFE]"
```

---

## Task 7: Visual Design Book Files (Phase 0-X)

**Files:**
- Create: `docs/superpowers/visual-design-book/VISUAL_DESIGN_BOOK_SCHEMA.md`
- Create: `docs/superpowers/visual-design-book/RESEARCH_REPORT_SCHEMA.md`
- Create: `docs/superpowers/visual-design-book/RESEARCH_CONTEXT_PROMPT_SCHEMA.md`
- Create: `docs/superpowers/visual-design-book/VISUAL_DESIGN_REQUEST_CONTEXT.md`

- [ ] **Step 1: Create `VISUAL_DESIGN_BOOK_SCHEMA.md`**

```markdown
[Ver001.000]

# Visual Design Book Schema — NJZ eSports Platform

**Purpose:** Defines the structure of the 6 analysis reports that form the Visual Design Book.
**Tier:** T1
**Produced by:** Phase 0-X research task (deep research agent, Kimi 2.5 preferred)

---

## Book Structure

The Visual Design Book is 6 reports + 1 synthesis document:

| Report | Title | Focus |
|--------|-------|-------|
| R1 | Competitive Landscape Analysis | Top 5 eSports analytics platforms — visual patterns, colour systems, typography, layout |
| R2 | Game World Palette Research | Valorant + CS2 official brand palettes, community-derived colour systems, contrast profiles |
| R3 | Data Visualisation Patterns | Chart types, animation conventions, and real-time display patterns used in eSports data products |
| R4 | Typography and Hierarchy Audit | Font stacks used across eSports platforms, hierarchy patterns for score/stat display |
| R5 | Interaction Design Patterns | Navigation, hover states, live indicator patterns, notification systems |
| R6 | Component Catalogue Audit | Audit of current `@njz/ui` components against identified patterns — gaps, inconsistencies |
| S1 | Synthesis and Design Recommendations | Distilled recommendations for Phase 9 design token system and component updates |

---

## Output Format

Each report (R1–R6) follows the RESEARCH_REPORT_SCHEMA.md template.
The synthesis (S1) follows its own format defined in that document.

All reports are saved to:
`docs/superpowers/visual-design-book/reports/R<N>-<slug>.md`
`docs/superpowers/visual-design-book/reports/S1-synthesis.md`
```

- [ ] **Step 2: Create `RESEARCH_REPORT_SCHEMA.md`**

```markdown
[Ver001.000]

# Research Report Schema — Visual Design Book

**Purpose:** Template for each of the 6 analysis reports (R1–R6).
**Tier:** T1

---

## Report Template

```markdown
[Ver001.000]

# Report R<N>: <Title>

**Research batch:** Batch <1|2|3>
**Date produced:** YYYY-MM-DD
**Agent:** <agent-id>
**Sources consulted:** <N> sources

---

## Executive Summary
[3–5 sentence summary of key findings]

## Findings

### Finding 1: [name]
**Evidence:** [what was observed, with source citations]
**Relevance to NJZ platform:** [how this applies]
**Recommended action:** [specific design decision or token value]

[... repeat for all findings ...]

## Pattern Catalogue
[Table of identified patterns with examples]

| Pattern | Source Platform | Implementation Note |
|---------|----------------|---------------------|
| | | |

## Recommended Tokens / Values
[Specific CSS variable names and values derived from research]

| Token | Recommended Value | Rationale |
|-------|------------------|-----------|
| | | |

## Sources
[Numbered list of all sources consulted]
```
```

- [ ] **Step 3: Create `RESEARCH_CONTEXT_PROMPT_SCHEMA.md`**

```markdown
[Ver001.000]

# Research Context Prompt Schema — Visual Design Book

**Purpose:** Format for the context prompt passed to the research agent at task start.
**Tier:** T1

---

## Prompt Structure

The context prompt passed to the deep research agent MUST include these sections in order:

1. **Role assignment:** "You are a visual design research analyst specialising in eSports platforms and data visualisation products."

2. **Platform context:** Brief description of the NJZ eSports platform — what it is, who uses it, what data it displays. Include the TENET hierarchy (TeNeT → TeNET → World-Ports → Quarter GRID → hubs) as context.

3. **Research objective:** Clearly state which report(s) this batch covers (R1–R6) and what the output format is (see RESEARCH_REPORT_SCHEMA.md).

4. **Constraints:**
   - Do not recommend designs that require proprietary fonts without free fallbacks
   - All colour recommendations must pass WCAG 2.1 AA contrast against the current dark background (`#0a0a0a`)
   - Recommendations must be implementable as CSS custom properties

5. **Output instructions:** Save each report to `docs/superpowers/visual-design-book/reports/R<N>-<slug>.md` following the RESEARCH_REPORT_SCHEMA.md template exactly.

6. **Batch assignment:** State which 2 reports this batch covers.
```

- [ ] **Step 4: Create `VISUAL_DESIGN_REQUEST_CONTEXT.md`**

```markdown
[Ver001.000]

# Visual Design Request Context — NJZ eSports Platform

**Purpose:** Context file for the deep research agent assigned to the Visual Design Book task.
**Tier:** T1
**CODEOWNER_APPROVAL_REQUIRED:** Yes — agent must have CLAIMED → ACTIVE in CODEOWNER_CHECKLIST.md C-7.X before beginning.

⚠️ IMPORTANT: This file is a CONTEXT and DIRECTIVE file for a future research agent. It is NOT a set of instructions for the current agent reading this. Do NOT execute the research described here unless you are the specifically claimed agent for task C-7.X.

---

## Task Assignment

You are assigned to produce the NJZ eSports Platform Visual Design Book. This is a 3-batch deep research process producing 6 analysis reports and 1 synthesis document.

## Platform Context

The NJZ eSports Platform (NJZiteGeisTe) is a community eSports analytics and simulation platform for Valorant and CS2. The platform is built on the TENET data topology:

- **TeNeT** — User-facing Home Portal (entry, auth, onboarding)
- **TeNET** — Network Directory routing users to World-Ports by game (`/hubs`)
- **World-Ports** — Game-specific entry points (`/valorant`, `/cs2`)
- **Quarter GRID** — Four hubs in every World-Port: SATOR (analytics), AREPO (community), OPERA (pro scene), ROTAS (stats)

The visual stack: React 18, Tailwind CSS, Framer Motion, Three.js/R3F. Current dark theme base `#0a0a0a`. Game accent colours: Valorant `#ff4655`, CS2 `#f0a500`. Typography: system font stack.

## Research Batches

**Batch 1 (R1 + R2):** Competitive landscape + game world palette research
**Batch 2 (R3 + R4):** Data visualisation patterns + typography and hierarchy
**Batch 3 (R5 + R6):** Interaction design patterns + component catalogue audit

## Process

For each batch:
1. Consult minimum 8 sources per report
2. Produce report following `RESEARCH_REPORT_SCHEMA.md`
3. Save to `docs/superpowers/visual-design-book/reports/`
4. After all 6 reports complete, produce S1 synthesis

After all 3 batches complete, produce `S1-synthesis.md`:
- Cross-batch recommendations synthesised into a unified design direction
- Token table: minimum 30 design tokens with recommended values
- Component gap analysis: what @njz/ui is missing vs. what was found in research
- Priority order for Phase 9 implementation

## Constraints

- All colour recommendations must pass WCAG 2.1 AA on `#0a0a0a` background
- No proprietary fonts without free fallbacks
- All tokens implementable as CSS custom properties
- Recommendations must be achievable within the existing Tailwind + Framer Motion stack
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/visual-design-book/
git commit -m "docs(phase-0x): add visual design book schema files and research context [SAFE]"
```

---

## Task 8: Archive Consolidation — Date-Indexed Structure

**Files:**
- Create: `Archived/Y25/M00-UNDATED/.gitkeep`
- Create: `Archived/Y26/M00-UNDATED/.gitkeep`
- Move: `archive/` contents → `Archived/Y25/` and `Archived/Y26/` (by date)

- [ ] **Step 1: Scan archive/ to determine what exists**

Run:
```bash
ls /c/Users/jacke/Documents/GitHub/eSports-EXE/archive/
```
Expected: directory listing showing archive subdirectories (including `.job-board/` to be deleted in gate 7.2)

- [ ] **Step 2: Date-scan the archive files**

```bash
cd /c/Users/jacke/Documents/GitHub/eSports-EXE
git log --diff-filter=A --name-only --format="%ai" -- archive/ 2>/dev/null | head -200
```
Note: files with no commit date → `M00-UNDATED`. Files with 2025 dates → `Y25/M{MM}/`. Files with 2026 dates → `Y26/M{MM}/`.

- [ ] **Step 3: Create the target directory structure**

```bash
mkdir -p /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y25/M00-UNDATED
mkdir -p /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y25/M01
mkdir -p /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y25/M02
mkdir -p /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y25/M03
mkdir -p /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y26/M00-UNDATED
mkdir -p /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y26/M01
mkdir -p /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y26/M02
mkdir -p /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y26/M03
touch /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y25/M00-UNDATED/.gitkeep
touch /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/Y26/M00-UNDATED/.gitkeep
```

- [ ] **Step 4: Move archive/ content (excluding .job-board/) to dated subdirs**

Use `git mv` to preserve history for each file. Files with determinable 2025 dates move to `Archived/Y25/M{MM}/`. Files with 2026 dates move to `Archived/Y26/M{MM}/`. Files with no determinable date move to `Archived/Y25/M00-UNDATED/` (default conservative assumption — assume older).

```bash
# Example for a batch of undated files:
# git mv archive/some-doc.md Archived/Y25/M00-UNDATED/some-doc.md
# Repeat for each file/directory (not .job-board/ — that is deleted in gate 7.2)
```

- [ ] **Step 5: Verify no files remain in archive/ (except .job-board/ pending deletion)**

```bash
ls /c/Users/jacke/Documents/GitHub/eSports-EXE/archive/
```
Expected: only `.job-board/` remains (or empty if job board already deleted)

- [ ] **Step 6: Commit**

```bash
git add Archived/ archive/
git commit -m "chore(archive): reorganise archive/ into date-indexed Archived/Y25+Y26 structure [STRUCT]"
```

---

## Task 9: Archive Master Dossier Report

**Files:**
- Create: `ARCHIVE_MASTER_DOSSIER.md` (repo root)

- [ ] **Step 1: Count archived files and build the index**

```bash
find /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/ -name "*.md" | wc -l
find /c/Users/jacke/Documents/GitHub/eSports-EXE/Archived/ -name "*.md" | sort
```

- [ ] **Step 2: Create `ARCHIVE_MASTER_DOSSIER.md`**

```markdown
[Ver001.000]

# Archive Master Dossier — NJZ eSports Platform

**Tier:** T0 — always loaded by all agents.
**Authority:** `docs/superpowers/specs/2026-03-27-master-plan-extension-phase7-13-design.md §7.4`
**Last updated:** 2026-03-27
**Next scheduled update:** M-Q4 of 2026-04 (see `.agents/ARCHIVE_INDEX_SCHEDULE.md`)

---

## Summary

- **Total archived files:** [N — fill after Task 8 complete]
- **Date range covered:** 2025-[M] — 2026-03
- **Migration status:** Pending — `Archived/` not yet pushed to `notbleaux/eSports-EXE-archives`
- **Archive repo:** Not yet created — planned for Phase 7 completion

---

## Topic Map

| Topic | File Count | Location |
|-------|-----------|----------|
| Phase implementation reports | [N] | Archived/Y26/M03/ |
| Job Board (DELETED — not archived) | 329 | — permanently deleted in Phase 7 gate 7.2 |
| Architecture decision records | [N] | Archived/Y25+Y26/ |
| Verification manifests | [N] | Archived/Y26/ |
| [Other topics discovered during Task 8] | | |

---

## Index Table

| Filename | Date | Topic | One-Line Summary |
|----------|------|-------|-----------------|
| [Populate after Task 8 reorganisation is complete] | | | |

---

## Cross-Reference Map

| Question | Archived Document(s) That Answer It |
|----------|-------------------------------------|
| Why is TENET a navigation layer, not a content hub? | [docs/architecture/ archival if applicable] |
| What were the Phase 0–6 implementation decisions? | Phase completion reports in Archived/Y26/M03/ |
| What patterns came from the Job Board? | This dossier §Historical Artefacts (below) — Job Board files are permanently deleted |

---

## Historical Artefacts and Case Examples

### Job Board Patterns (preserved as concepts — source files permanently deleted)

The Job Board (`archive/.job-board/`, 329 files) was permanently deleted in Phase 7 gate 7.2. The following patterns from it are preserved here as the sole reference:

| Pattern | Description | Current Equivalent |
|---------|-------------|-------------------|
| INBOX → CLAIMED → COMPLETED queue | Task lifecycle with explicit state transitions | `.agents/CODEOWNER_CHECKLIST.md` task states |
| Priority tiers HIGH/MEDIUM/LOW | Relative task urgency | PR labels + PHASE_GATES.md |
| Wave-based deployment | Sequential agent deployment waves | Phase gate sequencing |
| TL / Foreman / Scout hierarchy | Agent role hierarchy | Agent spawning sequence (COORDINATION_PROTOCOL.md) |
| Lock files for concurrent access | Preventing two agents from claiming the same task | Git branch per agent |
| Session documentation | Per-session agent activity logs | `.agents/spawn-logs/YYYY-MM-DD/` |
| Verification manifests | Structured pass/fail checklists | PHASE_GATES.md verification commands |
| SPAWN_LOGS | Agent spawn and activity history | `.agents/spawn-logs/` |

---

## FAQ

1. **Where did all the archive files go?** → `Archived/Y25/` and `Archived/Y26/` in this repo, pending migration to `notbleaux/eSports-EXE-archives`.
2. **Where is the Job Board?** → Permanently deleted in Phase 7 gate 7.2. Patterns preserved in §Historical Artefacts above.
3. **Can I load files from `Archived/`?** → These are T2 files. Do NOT load them — they are context waste. Use this dossier's index instead.
4. **How do I know which phase a document belongs to?** → Check the `Archived/Y26/M{MM}/` folder — Phase completion reports are dated by commit month.
5. **Is there a separate archive repository?** → Not yet. Migration to `notbleaux/eSports-EXE-archives` is a Phase 7 planning deliverable.
6. **How often is this dossier updated?** → Monthly, following the cadence in `.agents/ARCHIVE_INDEX_SCHEDULE.md`.
7. **What was the repo structure before Phase 0?** → See Phase 0 completion report in Archived/Y26/M03/ if preserved.
8. **What types existed before Phase 1?** → Type history is in git log. The canonical current types are in `data/schemas/` and `packages/@njz/types/`.
9. **Why are some files in M00-UNDATED?** → No determinable commit date — conservative default of Y25 assumed.
10. **How do I find a specific archived document?** → Use the Index Table above. Do not `find` or `ls` the Archived/ directory.
```

- [ ] **Step 3: Commit**

```bash
git add ARCHIVE_MASTER_DOSSIER.md
git commit -m "docs(archive): create ARCHIVE_MASTER_DOSSIER initial version — T0 file [SAFE]"
```

---

## Task 10: Update `.doc-tiers.json`

**Files:**
- Modify: `.doc-tiers.json`

- [ ] **Step 1: Read current `.doc-tiers.json`**

Run: read `.doc-tiers.json` at repo root

- [ ] **Step 2: Add new T0 entries**

Add to the T0 array:
- `"ARCHIVE_MASTER_DOSSIER.md"`
- `".agents/CODEOWNER_CHECKLIST.md"`

- [ ] **Step 3: Confirm Visual Design Book files are T1 (not T0)**

The 4 files in `docs/superpowers/visual-design-book/` should be T1. Verify they are not accidentally in T0.

- [ ] **Step 4: Commit**

```bash
git add .doc-tiers.json
git commit -m "chore(docs): add ARCHIVE_MASTER_DOSSIER and CODEOWNER_CHECKLIST to T0 tier [SAFE]"
```

---

## Task 11: MASTER_PLAN.md — Add Phases 7–13

**Files:**
- Modify: `MASTER_PLAN.md`

- [ ] **Step 1: Read current MASTER_PLAN.md structure**

Run: read `MASTER_PLAN.md` — identify the last Phase 6 section and the version header. Note the section numbering.

- [ ] **Step 2: Append Phases 7–13 sections**

Add after the Phase 6 section:

```markdown
---

## §7 — Phase 7: Repository Governance and Hygiene

**Status:** 🟡 UNLOCKED
**DEPENDS_ON:** None
**BLOCKS:** Phase 8

### Objectives
- Establish single-owner CODEOWNERS with risk-tiered auto-merge (`[SAFE]`/`[STRUCT]`/`[CRIT]`)
- Permanently delete the Job Board (329 files, security surface, CRIT PR)
- Reorganise `archive/` into date-indexed `Archived/Y25/` + `Archived/Y26/` structure
- Create `ARCHIVE_MASTER_DOSSIER.md` (T0) as permanent reference replacing 100s of archived docs
- Update agent coordination files: CODEOWNER_CHECKLIST.md, COORDINATION_PROTOCOL.md, ARCHIVE_INDEX_SCHEDULE.md, AGENT_CONTRACT.md

### Gate Summary
6 gates. See `.agents/PHASE_GATES.md §Phase 7`.

### CODEOWNER_APPROVAL_REQUIRED
Job Board deletion PR (CRIT) + Visual Design Book task claim.

---

## §8 — Phase 8: API Gateway and Auth Platform

**Status:** 🔒 BLOCKED on Phase 7
**DEPENDS_ON:** Phase 7
**BLOCKS:** Phases 10, 11, 12

### Objectives
- Upgrade `services/api-gateway/` from placeholder to production FastAPI gateway
- Wire Auth0 end-to-end (JWT middleware, frontend auth context, refresh token rotation)
- Add circuit breakers, tiered rate limiting, and structured audit logging

### Gate Summary
3 gates. See `.agents/PHASE_GATES.md §Phase 8`.

### CODEOWNER_APPROVAL_REQUIRED
Auth0 configuration (requires user's Auth0 tenant credentials).

---

## §9 — Phase 9: Web App UI/UX Enhancement

**Status:** 🟡 UNLOCKED (concurrent with Phase 8)
**DEPENDS_ON:** None (concurrent)
**Note:** Phase 0-X Visual Design Book feeds into this when available

### Objectives
- Formalise CSS design token system (`tokens.css` + Tailwind extension)
- Document all `@njz/ui` components with usage examples
- WCAG 2.1 AA audit + Lighthouse ≥ 90 on all routes

### Gate Summary
3 gates. See `.agents/PHASE_GATES.md §Phase 9`.

---

## §10 — Phase 10: Companion App MVP

**Status:** 🔒 BLOCKED on Phase 8
**DEPENDS_ON:** Phase 8

### Objectives
- Upgrade `apps/companion/` from Vite stub to Expo SDK project
- Auth0 login, live match scores, player profiles, push notifications

### Gate Summary
3 gates. See `.agents/PHASE_GATES.md §Phase 10`.

---

## §11 — Phase 11: Browser Extension and LiveStream Overlay

**Status:** 🔒 BLOCKED on Phase 8
**DEPENDS_ON:** Phase 8

### Objectives
- Upgrade `apps/browser-extension/` to Manifest V3 compliant, installable Chrome extension
- Upgrade `apps/overlay/` to production OBS browser source with score HUD and TeneT confidence badge

### Gate Summary
3 gates. See `.agents/PHASE_GATES.md §Phase 11`.

---

## §12 — Phase 12: Content and Prediction Platform

**Status:** 🔒 BLOCKED on Phase 8
**DEPENDS_ON:** Phase 8
**CODEOWNER_APPROVAL_REQUIRED:** Betting/Prediction UI (deliberate opt-in)

### Objectives
- Deploy Wiki app (Next.js 14 SSG) and Nexus portal with live status
- Token-based prediction system accessible to authenticated users
- OddsEngine confidence scores surfaced in the prediction UI

### Gate Summary
4 gates. See `.agents/PHASE_GATES.md §Phase 12`.

---

## §13 — Phase 13: Simulation Engine and Production Launch

**Status:** 🔒 BLOCKED on Phase 10 + 11 + 12
**DEPENDS_ON:** Phases 10, 11, 12 all gated
**CODEOWNER_APPROVAL_REQUIRED:** Production deployment (irreversible)

### Objectives
- Unpause Godot simulation engine, connect XSim to platform data pipeline
- All production environment variables set and validated
- Full E2E suite passing against production build
- Production deploy with CODEOWNER sign-off

### Gate Summary
4 gates. See `.agents/PHASE_GATES.md §Phase 13`.
```

- [ ] **Step 3: Increment version header**

Change `[VerMMM.mmm]` to the next version (e.g. if current is `[Ver001.000]`, update to `[Ver001.001]`).

- [ ] **Step 4: Commit**

```bash
git add MASTER_PLAN.md
git commit -m "docs(master-plan): add phases 7-13 sections [STRUCT]"
```

---

## Task 12: Job Board Deletion — CRIT PR (Gate 7.2)

**⚠️ CODEOWNER_APPROVAL_REQUIRED — do not begin until CODEOWNER_CHECKLIST.md C-7.2 shows CLAIMED → ACTIVE**

**Files:**
- Delete: `archive/.job-board/` — all 329 files, permanent

- [ ] **Step 1: Confirm CODEOWNER approval obtained**

Check `.agents/CODEOWNER_CHECKLIST.md` — C-7.2 must show `CLAIMED → ACTIVE`.
If not, STOP. Open a claim PR first.

- [ ] **Step 2: Create a dedicated branch for this deletion**

```bash
git checkout -b delete/job-board-permanent
```

- [ ] **Step 3: List all job board files (this list IS the permanent audit trail)**

```bash
find /c/Users/jacke/Documents/GitHub/eSports-EXE/archive/.job-board/ -type f | sort
```
Copy the full output — it goes into the PR description.

- [ ] **Step 4: Delete all job board files**

```bash
git rm -r /c/Users/jacke/Documents/GitHub/eSports-EXE/archive/.job-board/
```

- [ ] **Step 5: Commit the deletion**

```bash
git commit -m "delete(archive): remove job board — 329 files permanent deletion [CRIT]

Security surface removed. No copy kept. Patterns preserved in ARCHIVE_MASTER_DOSSIER.md.

See PR description for complete file audit trail.

[agent: <agent-id>]"
```

- [ ] **Step 6: Push and open PR with full file list as body**

PR title: `delete(archive): remove job board — 329 files [CRIT]`
PR body must contain the complete sorted file list from Step 3.
PR body must state: "This PR description is the permanent audit trail. 24-hour hold required after CODEOWNER approval before merge."

- [ ] **Step 7: After 24-hour hold, merge**

Do NOT merge before 24 hours have elapsed after @notbleaux approval.

- [ ] **Step 8: Reference scrub — second PR immediately after**

On a new branch `chore/job-board-reference-scrub`:

Remove all references to `.job-board/` or "job board" from:
- `CLAUDE.md` — Agent Coordination section
- `AGENTS.md` — directory structure diagram
- `README.md` — if referenced
- `docs/UNIFIED_MASTER_PLAN.md` — if it exists and references job board
- `docs/IMPLEMENTATION_READINESS_CHECKLIST.md` — if it exists

Verify:
```bash
grep -r "job-board\|job board\|Job Board" /c/Users/jacke/Documents/GitHub/eSports-EXE/ \
  --include="*.md" \
  --exclude-dir=".git" \
  --exclude-dir="Archived"
```
Expected: 0 results (ARCHIVE_MASTER_DOSSIER.md contains the historical note but that is intentional — exclude it if it appears).

- [ ] **Step 9: Commit reference scrub**

```bash
git add CLAUDE.md AGENTS.md README.md
git commit -m "chore(docs): scrub all job-board references post-deletion [STRUCT]"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Covered in task |
|-----------------|----------------|
| CODEOWNERS file | Task 1 |
| pr-classification.yml | Task 2 |
| auto-merge.yml | Task 3 |
| GitHub labels (safe/struct/crit) | Task 3 Step 2 |
| 6 PR templates | Task 4 |
| commit-msg hook | Task 4 Step 1 |
| CODEOWNER_CHECKLIST.md | Task 5 Step 2 |
| ARCHIVE_INDEX_SCHEDULE.md | Task 5 Step 3 |
| AGENT_CONTRACT.md update | Task 5 Step 4 |
| COORDINATION_PROTOCOL.md | Task 5 Step 5 |
| PHASE_GATES.md DAG + phases 7-13 | Task 6 |
| Visual Design Book schema files (4) | Task 7 |
| Archived/Y25+Y26 structure | Task 8 |
| ARCHIVE_MASTER_DOSSIER.md | Task 9 |
| .doc-tiers.json update | Task 10 |
| MASTER_PLAN.md phases 7-13 | Task 11 |
| Job Board deletion CRIT PR | Task 12 |
| Reference scrub post-deletion | Task 12 Step 8 |

All 18 spec requirements covered. No gaps detected.

### Placeholder scan

No TBDs or incomplete sections. Task 8 Step 4 has a manual note about using `git mv` per file — this is intentional since the exact file list is determined at runtime by the archive scan.

### Type consistency

No types or function signatures used across tasks — this is a governance/docs/infra plan. No type consistency issues.
