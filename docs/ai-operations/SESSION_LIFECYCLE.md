[Ver001.001]

# Session Lifecycle Protocol — NJZ eSports Platform

**Purpose:** Governs how every agent session starts, runs, ends, and transfers context.
**Tier:** T1 — load at session start before any work begins.
**Authority:** `MASTER_PLAN.md §12`
**Framework:** NJZPOF v0.2
**Shell note:** All bash commands in this document assume Unix-compatible shell. On Windows, use **Git Bash** or **WSL** — not PowerShell or CMD.

---

## Overview

Every agent session has a 5-stage lifecycle. No stage may be skipped.

```
SESSION START
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  Stage 1: Cleanup — delete ephemera, verify clean state │
│  Stage 2: Orient — load context, check drift, gate lock │
│  Stage 3: Plan — create notebook + TODO (gate-linked)   │
│  Stage 4: Work — execute, log branches, mark TODOs      │
│  Stage 5: Close — write context forward, update logbook │
└─────────────────────────────────────────────────────────┘
     │
     ▼
SESSION END
```

**INTERRUPTED SESSION:** If `CONTEXT_FORWARD.md` contains `**Interrupted At:**` field — follow the
Resumption Strategy table in Stage 2 before any planning.

---

## Stage 1: Session Start Cleanup

**Run at the very start of every session, before reading any other files.**

### 1A — Delete previous session ephemera

```bash
# Delete all session-scoped files from previous session
find .agents/session/ -name "*.md" -not -name "CONTEXT_FORWARD.md" -not -name "README.md" -delete

# VERIFY deletion — this command must return empty output before proceeding to Stage 2
ls .agents/session/ | grep -E "NOTEBOOK|TODO" && echo "WARNING: stale session files remain" || echo "Session clean ✅"
```

If the verification returns `WARNING: stale session files remain` — do not proceed. Investigate and delete manually.

### 1B — Archive or delete old session plans

Session plans in `docs/superpowers/plans/` older than the current phase are reviewed:

- Plans for **completed phases** → move to `Archived/Y26/M{current}/` via `git mv`
- Plans for **active phases** → keep in place
- Plans for **future phases** → keep in place

```bash
# Check plan ages
ls -lt docs/superpowers/plans/
```

### 1C — Root-level stale file check

```bash
# Report any root .md files not in the approved manifest
ls *.md 2>/dev/null | grep -vE "^(MASTER_PLAN|AGENTS|CLAUDE|README|ARCHIVE_MASTER_DOSSIER|CONTRIBUTING|SECURITY)\.md$"
```

Approved root `.md` files are listed in `.doc-tiers.json` under `manifest.approved_root_files`.
Any file reported here → move to `Archived/Y26/M{MM}/` or delete if clearly temporary.

### 1D — Dossier consolidation check

Before archiving any set of files, check whether they are **fragments of a larger component**.

**Rule:** Fragment clusters MUST be consolidated into a compiled dossier before archiving.

```bash
# Look for fragment clusters
ls TASK_*.md SPECIALIST_*.md PHASE_*.md 2>/dev/null | sort
# Multiple files from one component → compile into dossier first
```

To create a dossier:

1. Create `Archived/Y26/M{MM}/DOSSIER-{component-name}-{date}.md`
2. Concatenate fragment contents under `## [original filename]` section headers
3. `git mv` the dossier; `git rm` the fragments
4. Add ONE row to `ARCHIVE_MASTER_DOSSIER.md` for the dossier

**Archiving/deletion is mandatory. Not optional.**

---

## Stage 2: Session Orientation

### 2A — Load files in order

1. `MASTER_PLAN.md` (T0) — confirm current phase, read active TODO
2. `.agents/PHASE_GATES.md` (T0) — confirm which phase is unlocked
3. `.agents/CODEOWNER_CHECKLIST.md` (T0) — check for pending USER_INPUT_REQUIRED
4. `.agents/session/CONTEXT_FORWARD.md` — read previous session's handoff (if exists)
5. `.agents/phase-logbooks/Phase-N-LOGBOOK.md` — read current phase history

### 2B — CONTEXT_FORWARD Freshness Check

If `CONTEXT_FORWARD.md` exists:

```
Is Valid Until date >= today?
    ├─ YES → proceed normally; read DO NOT REDO list before any task planning
    └─ NO (stale > 7 days) →
           ├─ Does user explicitly approve proceeding with stale context?
           │       └─ YES → log "Stale context accepted by user on [date]"; proceed
           └─ NO → re-verify top 3 phase status claims against PHASE_GATES.md live state
                   before proceeding to Stage 3
```

If `CONTEXT_FORWARD.md` has `**Interrupted At:**` field populated — apply **Resumption Strategy**:

| Completion at Interruption | Strategy |
|---------------------------|----------|
| < 50% of gate task | Restart gate from beginning |
| 50–90% of gate task | Pull latest branch + resume; run conflict resolution checklist in Stage 3 |
| > 90% of gate task | Resume for final validation only; run gate verification command before marking PASSED |

### 2C — Gate Artifact Integrity Check

Before planning any work, verify that all gates currently marked `✅ PASSED` have their
artifacts still present:

```bash
# Spot-check: confirm last 3 PASSED gates still have their primary files
# Example for gate 7.1:
test -f .github/CODEOWNERS && echo "Gate 7.1 artifact ✅" || echo "Gate 7.1 artifact ❌ MISSING"
```

If any PASSED gate is missing its artifact:
- Mark gate as `❌ ARTIFACT_MISSING` in PHASE_GATES.md
- Add to DO NOT REDO as "re-implement [gate name] — artifact lost"
- This counts as **Synchronization Drift** → apply SLA from DRIFT-CLOSURE-SLA.md

### 2D — Content Drift Detection

Run this check for each of the three drift types:

**Re-execution Drift:** Session TODO references a gate already `✅ PASSED` in PHASE_GATES.md
→ Remove from Session TODO, log "prevented re-execution of [gate]"
→ Closure time: < 5 min

**Synchronization Drift:** MASTER_PLAN.md checklist `[x]` contradicts PHASE_GATES.md `❌` status (or vice versa)
→ PHASE_GATES.md wins. Update MASTER_PLAN.md. Commit: `chore(drift-fix): reconcile MASTER_PLAN with PHASE_GATES [SAFE]`
→ Closure time: < 15 min

**Staleness Drift:** Gate `Last Verified` > 30 days
→ Re-run gate verification command. Update `Last Verified` date. Commit.
→ Closure time: < 60 min (if non-blocking, defer and flag; do not block session)

Full SLA table: `docs/ai-operations/DRIFT-CLOSURE-SLA.md`

**Escalation:** Any drift unresolved after 120 min → stop session work, report to user with drift summary.

### 2E — Gate Transition Checkpoint

After drift is reconciled, **re-check phase lock status** before proceeding to Stage 3.
Drift reconciliation may have changed which phase is active.

```
All Phase N gates ✅ PASSED AND USER_INPUT_REQUIRED items ACTIVE?
    ├─ YES → Phase N confirmed active; proceed to Stage 3
    └─ NO  → Phase is locked or blocked; report to user
```

### 2F — USER_INPUT_REQUIRED Check

If any USER_INPUT_REQUIRED is UNCLAIMED or PENDING in CODEOWNER_CHECKLIST.md for the current phase:
- **STOP** — report to user before proceeding
- Follow `docs/ai-operations/ESCALATION_PROTOCOL.md` USER_INPUT_REQUIRED format

---

## Stage 3: Session Plan

### Session Notebook

File: `.agents/session/NOTEBOOK-YYYY-MM-DD.md`

```markdown
[SESSION-EPHEMERAL]

# Session Notebook — YYYY-MM-DD

**Phase:** Phase N
**Goal:** [one sentence — what this session will accomplish]
**Loaded context:** [list files read in Stage 2]
**Resumption:** [YES/NO — if YES, Interrupted At gate N.X, strategy applied: restart/resume/validate]

---

## Decisions

| # | Gate Ref | Decision | Rationale | Reversible? |
|---|----------|----------|-----------|-------------|
|   | [N.X]    |          |           |             |

## Branch Points Encountered

| # | Gate Ref | Options Considered | Choice Made | Reason |
|---|----------|--------------------|-------------|--------|
|   |          |                    |             |        |

## Open Questions

- [ ] [question] — blocks [gate ref if applicable]

## Observations

[anything unexpected found during orientation]
```

### Session TODO

File: `.agents/session/TODO-YYYY-MM-DD.md`

```markdown
[SESSION-EPHEMERAL]

# Session TODO — YYYY-MM-DD

**Synced from:** MASTER_PLAN.md §N + PHASE_GATES.md
**Phase deliverables reference:** .agents/session-workplans/Phase-N/phase-deliverables.md

## Active Phase Tasks

Each item MUST reference its PHASE_GATES.md gate number.
Completing a TODO item without updating its gate = INCOMPLETE.

- [ ] [Gate N.1] [description] → Maps to Phase Deliverable: [G1-D1]
- [ ] [Gate N.2] [description] → Maps to Phase Deliverable: [G2-D1]

## Session Deliverables (x2 minimum)

- [ ] Functional: [what code/output this session delivers — measurable]
- [ ] Process: [which gate(s) will be updated + commit convention used]

## Anti-Drift Checks (run before closing session)

- [ ] All completed TODO items have their gate marked ✅ PASSED in PHASE_GATES.md
- [ ] Gate verification commands run and returned expected results
- [ ] Phase logbook updated with this session's work
- [ ] Context forward written with Branch Points and Valid Until date
- [ ] No stale session files left uncommitted
- [ ] Root-level file count within approved manifest
- [ ] No temporary .md files created outside `.agents/session/` or `docs/superpowers/plans/`

## Archiving/Deletion Checklist

- [ ] Stale root .md files identified and moved to Archived/ (dossiers where applicable)
- [ ] Previous session notebook deleted (Stage 1 — confirm with verification command)
- [ ] Completed phase plans archived if phase is done
- [ ] `.agents/session/` contains only today's files + CONTEXT_FORWARD.md
```

---

## Stage 4: Work

During work:

- Update `NOTEBOOK-YYYY-MM-DD.md` **Decisions** table as decisions are made — include gate reference
- Update **Branch Points** table when multiple paths were considered and one was chosen
- Mark TODO items as `[x]` when complete — simultaneously update the gate in PHASE_GATES.md
- If a task is blocked, add to Open Questions with gate reference and reason
- Update `Phase-N-LOGBOOK.md` with significant actions (key decisions and completions, not every commit)

**Drift check trigger:** Before starting any new gate task, re-read the relevant MASTER_PLAN.md
phase section. If what you're about to do is NOT in the phase spec — stop and confirm with user.

**Gate reference rule:** Every action, decision, and TODO item carries a gate number.
A task without a gate number has no completion authority.

---

## Stage 5: Session Close

### 5A — Mark completed gates

For each gate completed this session, update `.agents/PHASE_GATES.md`:

```
| N.X | [criteria] | [verification] | ✅ PASSED — YYYY-MM-DD | Last Verified: YYYY-MM-DD | Verified In: local+CI |
```

### 5B — Update Phase Logbook (includes session notebook consolidation)

Before appending to the logbook, extract key content from the Session Notebook (`NOTEBOOK-YYYY-MM-DD.md`).
The notebook will be deleted at the next session's Stage 1 — **this is the only consolidation opportunity.**

**Extract and include in the logbook entry:**
- All rows from the Notebook **Decisions** table
- All rows from the Notebook **Branch Points Encountered** table
- All open questions that were resolved during the session
- Architecture decisions (ADR-format for MASTER-tier decisions only)

**Do NOT transcribe the full notebook** — extract the above four categories only.
This resolves the Stage 1D/Stage 5 authority: Stage 1D deletes OLD session files at session START.
Stage 5B extracts from CURRENT session notebook at session CLOSE. Different sessions, no conflict.

Append to `.agents/phase-logbooks/Phase-N-LOGBOOK.md`:

```markdown
## Session YYYY-MM-DD

**Gates completed:** N.X, N.Y
**Drift detected and resolved:** [type] — [resolution] (or "None")
**Branch points:** [gate ref: options considered, choice made, reason]

**Decisions made:**
- [key decision + rationale + gate ref]

**Architecture Decisions (ADRs):**
[Use ADR-TEMPLATE.md format from docs/governance/ADR-TEMPLATE.md — only for MASTER-tier decisions]

**Files created/modified:**
- [path] — [what changed] — [gate ref]

**Open for next session:**
- [anything incomplete] — [gate ref]
```

### 5C — Write Context Forward

Overwrite `.agents/session/CONTEXT_FORWARD.md` with the complete schema:

```markdown
[SESSION-CONTEXT]

# Context Forward — YYYY-MM-DD

**From session:** YYYY-MM-DD
**Valid Until:** YYYY-MM-DD (+7 days from today)
**Current phase:** Phase N
**Gates remaining:** N.Z, N.W
**Interrupted At:** [gate N.X — 80% complete] OR [none]
**Staleness Override Authority:** CODEOWNER re-verification OR explicit user approval required if past Valid Until
**Resumption Strategy (if Interrupted At is set):** [restart/resume/validate — per SESSION_LIFECYCLE.md Stage 2B table]

## What Was Completed This Session

- [Gate N.X] [task] → committed as [hash]

## What Is In Progress

- [Gate N.X] [task] — stopped at [point], next step is [action]

## Branch Points Encountered

- [Gate N.X]: [options] → chose [option] because [reason]

## Open Questions for Next Session

- [ ] [question] — blocks [gate ref]

## Files That Need Attention Next Session

- [path] — [why] — [gate ref]

## USER_INPUT_REQUIRED Status

- C-N.X: [UNCLAIMED/PENDING/ACTIVE] — [what was done or still needed]

## Do NOT Redo

*Cross-reference with PHASE_GATES.md — gates marked ✅ PASSED are the authoritative record.*
- [Gate N.X] [task] — PASSED [date] — artifact: [primary file]
```

### 5D — Archiving/Deletion Final Check

```bash
# 1. Session files are only today's + CONTEXT_FORWARD
ls .agents/session/

# 2. Verify cleanup from Stage 1 is still clean
ls .agents/session/ | grep -E "NOTEBOOK|TODO" | grep -v "$(date +%Y-%m-%d)" && echo "WARNING: old session files" || echo "Clean ✅"

# 3. No stale root files
ls *.md 2>/dev/null | grep -vE "^(MASTER_PLAN|AGENTS|CLAUDE|README|ARCHIVE_MASTER_DOSSIER|CONTRIBUTING|SECURITY)\.md$"

# 4. No temporary files outside approved locations
find . -name "TASK_*.md" -o -name "health_report.md" -o -name "SPECIALIST_*.md" 2>/dev/null | grep -v ".git" | grep -v "Archived/"

# 5. Fragment cluster check
ls TASK_*.md SPECIALIST_*.md PHASE_*.md 2>/dev/null | sort

# 6. All stale files → dossier → archive
```

Commit cleanup actions as: `chore(cleanup): session close — archive stale files [SAFE]`

---

## File Locations Summary

| File | Location | Tier | Lifetime | Committed? |
|------|----------|------|----------|------------|
| Session Notebook | `.agents/session/NOTEBOOK-YYYY-MM-DD.md` | T2 | 1 session | ✅ Yes |
| Session TODO | `.agents/session/TODO-YYYY-MM-DD.md` | T2 | 1 session | ✅ Yes |
| Context Forward | `.agents/session/CONTEXT_FORWARD.md` | T1 | Until next session | ✅ Yes |
| Phase Logbook | `.agents/phase-logbooks/Phase-N-LOGBOOK.md` | T1 | Permanent | ✅ Yes |
| Phase Deliverables | `.agents/session-workplans/Phase-N/phase-deliverables.md` | PHASE | Until phase complete | ✅ Yes |
| Session Work Plan | `.agents/session-workplans/Phase-N/YYYY-MM-DD-*.md` | T2 | 30 days | ✅ Yes |
| Session Plans | `docs/superpowers/plans/YYYY-MM-DD-*.md` | T1→T2 | Until phase complete | ✅ Yes |
| ADR Template | `docs/governance/ADR-TEMPLATE.md` | MASTER | Permanent | ✅ Yes |
| Drift SLA | `docs/ai-operations/DRIFT-CLOSURE-SLA.md` | T1 | Permanent | ✅ Yes |

---

## Resumption Strategy Reference

| Interrupted At Completion | Recovery Action | Commit Before Resuming |
|--------------------------|-----------------|------------------------|
| < 50% | Restart gate from beginning | `chore(recovery): restart gate N.X after interruption [SAFE]` |
| 50–90% | Pull latest, resolve conflicts, resume | `chore(recovery): resume gate N.X from interruption point [SAFE]` |
| > 90% | Final validation only; run verification command | `chore(recovery): validate gate N.X completion after interruption [SAFE]` |

---

## What Counts as a Vulnerability

| Pattern | Risk | Resolution |
|---------|------|------------|
| Root-level `TASK_*.md` or `PHASE_*.md` files | Stale state confusion | Move to Archived/ |
| Session notebooks from previous sessions | Context pollution | Delete at Stage 1 (verify with command) |
| TODO lists with no gate references | Untrackable work | Add gate ref or delete |
| TODO lists with no session date | Can't tell if current | Delete or date-stamp |
| Phase plans for completed phases | Agent thinks work is pending | Archive to Archived/ |
| Credentials or API keys in notebooks | Security breach | Delete immediately, rotate keys |
| `.agents/session/` files from 2+ sessions ago | Context contamination | Delete at Stage 1 |
| Fragment clusters (multiple TASK_*.md / SPECIALIST_*.md for same feature) | Fragmented context | Consolidate into dossier, then archive |
| PASSED gate with missing artifact | Phantom completion | Mark ❌ ARTIFACT_MISSING, re-implement |
| CONTEXT_FORWARD older than 7 days without re-verification | Staleness drift | Re-verify claims or obtain user override |
