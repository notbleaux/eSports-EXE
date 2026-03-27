[Ver001.000]

# Session Lifecycle Protocol — NJZ eSports Platform

**Purpose:** Governs how every agent session starts, runs, ends, and transfers context.
**Tier:** T1 — load at session start before any work begins.
**Authority:** `MASTER_PLAN.md §12`

---

## Overview

Every agent session has a 5-stage lifecycle. No stage may be skipped.

```
SESSION START
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  Stage 1: Cleanup — delete previous session ephemera    │
│  Stage 2: Orient — load context forward + logbooks      │
│  Stage 3: Plan — create session notebook + TODO         │
│  Stage 4: Work — execute, update notebook, mark TODOs   │
│  Stage 5: Close — write context forward, update logbook │
└─────────────────────────────────────────────────────────┘
     │
     ▼
SESSION END
```

---

## Stage 1: Session Start Cleanup

**Run at the very start of every session, before reading any other files.**

### 1A — Delete previous session ephemera

```bash
# Delete all session-scoped files from previous session
find .agents/session/ -name "*.md" -not -name "README.md" -delete

# Delete previous context archive (keep only 1 back)
find .agents/session/ -name "PREV_*.md" -delete
```

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
# Report any root .md files not in the approved list
ls /*.md 2>/dev/null | grep -vE "/(MASTER_PLAN|AGENTS|CLAUDE|README|ARCHIVE_MASTER_DOSSIER|CONTRIBUTING|SECURITY)\.md$"
```

Any file reported here should be moved to `Archived/Y26/M{MM}/` or deleted if clearly temporary (TASK_*.md, SPECIALIST_*.md, health_report.md, PHASE_2_*.md, etc.).

### 1D — Dossier consolidation check

Before archiving any set of files, check whether they are **fragments of a larger component** (e.g., multiple TASK_*.md files for the same feature, multiple SPECIALIST_*.md files from one session, split phase reports).

**Rule:** Fragmented or extracted components MUST be consolidated into a compiled dossier before archiving. Do not archive piecemeal.

```bash
# Look for fragment clusters at root or in .agents/session/
ls TASK_*.md SPECIALIST_*.md PHASE_*.md 2>/dev/null | sort
# If multiple files belong to one component → compile into a dossier first
```

To create a dossier:

1. Create `Archived/Y26/M{MM}/DOSSIER-{component-name}-{date}.md`
2. Concatenate all fragment contents under clear section headers
3. `git mv` the dossier file; `git rm` the individual fragments
4. Add a row to `ARCHIVE_MASTER_DOSSIER.md` for the dossier (not the fragments)

**This cleanup is mandatory and part of the archiving/deletion framework — not optional.**

---

## Stage 2: Session Orientation

Load these files in order:

1. `MASTER_PLAN.md` (T0) — confirm current phase, read active TODO
2. `.agents/PHASE_GATES.md` (T0) — confirm which phase is unlocked
3. `.agents/CODEOWNER_CHECKLIST.md` (T0) — check for pending USER_INPUT_REQUIRED
4. `.agents/session/CONTEXT_FORWARD.md` — read previous session's handoff (if exists)
5. `.agents/phase-logbooks/Phase-N-LOGBOOK.md` — read current phase history

If `CONTEXT_FORWARD.md` exists:
- Note all open questions and in-progress work
- Do NOT re-do completed work listed in logbook

If any USER_INPUT_REQUIRED is UNCLAIMED or PENDING in CODEOWNER_CHECKLIST.md for the current phase:
- **STOP** — report to user before proceeding
- Follow ESCALATION_PROTOCOL.md USER_INPUT_REQUIRED format

---

## Stage 3: Session Plan

Create two files at session start:

### Session Notebook

File: `.agents/session/NOTEBOOK-YYYY-MM-DD.md` (use today's date)

```markdown
[SESSION-EPHEMERAL]

# Session Notebook — YYYY-MM-DD

**Phase:** Phase N
**Goal:** [one sentence — what this session will accomplish]
**Loaded context:** [list files read in Stage 2]

---

## Decisions

| # | Decision | Rationale | Reversible? |
|---|----------|-----------|-------------|
| | | | |

## Open Questions

- [ ] [question]

## Observations

[anything unexpected found during orientation]
```

### Session TODO

File: `.agents/session/TODO-YYYY-MM-DD.md` (use today's date)

```markdown
[SESSION-EPHEMERAL]

# Session TODO — YYYY-MM-DD

**Synced from:** MASTER_PLAN.md §N + PHASE_GATES.md

## Active Phase Tasks (from MASTER_PLAN.md)

Copy the relevant phase checklist items here. Mark as you complete them.

- [ ] Gate N.1: [description]
- [ ] Gate N.2: [description]
- [ ] ...

## Anti-Drift Checks (run before closing session)

- [ ] All completed tasks marked in PHASE_GATES.md
- [ ] Phase logbook updated with this session's work
- [ ] Context forward written
- [ ] No stale session files left uncommitted
- [ ] Root-level file count within approved list
- [ ] No temporary .md files created outside `.agents/session/` or `docs/superpowers/plans/`

## Archiving/Deletion Checklist

- [ ] Stale root .md files identified and moved to Archived/
- [ ] Previous session notebook deleted (Stage 1)
- [ ] Completed phase plans archived if phase is done
- [ ] `.agents/session/` contains only today's files
```

---

## Stage 4: Work

During work:
- Update `NOTEBOOK-YYYY-MM-DD.md` with decisions as they are made
- Mark TODO items as `[x]` when complete
- If a task is blocked, add it to Open Questions with reason
- Update `Phase-N-LOGBOOK.md` with significant actions (not every commit — key decisions and completions)

**Drift check trigger:** Before starting any new gate task, re-read the relevant MASTER_PLAN.md phase section. If what you're about to do is NOT in the phase spec, stop and confirm.

---

## Stage 5: Session Close

### 5A — Mark completed gates

For each gate completed this session, update `.agents/PHASE_GATES.md`:
```
| N.X | [criteria] | [verification] | ✅ PASSED — YYYY-MM-DD |
```

### 5B — Update Phase Logbook

Append to `.agents/phase-logbooks/Phase-N-LOGBOOK.md`:

```markdown
## Session YYYY-MM-DD

**Gates completed:** N.X, N.Y
**Decisions made:**
- [key decision + rationale]

**Files created/modified:**
- [path] — [what changed]

**Open for next session:**
- [anything incomplete]
```

### 5C — Write Context Forward

Overwrite `.agents/session/CONTEXT_FORWARD.md`:

```markdown
[SESSION-CONTEXT]

# Context Forward — YYYY-MM-DD

**From session:** YYYY-MM-DD
**Current phase:** Phase N
**Gates remaining:** N.Z, N.W

## What Was Completed This Session
- [task] → committed as [hash]

## What Is In Progress
- [task] — stopped at [point], next step is [action]

## Open Questions for Next Session
- [ ] [question]

## Files That Need Attention Next Session
- [path] — [why]

## USER_INPUT_REQUIRED Status
- C-N.X: [status] — [what was done or still needed]

## Do NOT Redo
- [things already done that might look undone]
```

### 5D — Archiving/Deletion Final Check

Before ending session, verify:

```bash
# 1. Session files are only today's (no old dates)
ls .agents/session/

# 2. No stale root files
ls *.md | grep -vE "^(MASTER_PLAN|AGENTS|CLAUDE|README|ARCHIVE_MASTER_DOSSIER|CONTRIBUTING|SECURITY)\.md$"

# 3. No temporary files outside approved locations
find . -name "TASK_*.md" -o -name "health_report.md" -o -name "SPECIALIST_*.md" | grep -v ".git"

# 4. Check for fragment clusters — consolidate before archiving
ls TASK_*.md SPECIALIST_*.md PHASE_*.md 2>/dev/null | sort
# Multiple files from one component → compile dossier, then archive dossier

# 5. All stale files found → move to Archived/ (as dossiers where applicable)
# git mv [dossier] Archived/Y26/M{MM}/[dossier]
```

Commit cleanup actions as: `chore(cleanup): session close — archive stale files [SAFE]`

---

## File Locations Summary

| File | Location | Lifetime | Committed? |
|------|----------|----------|------------|
| Session Notebook | `.agents/session/NOTEBOOK-YYYY-MM-DD.md` | 1 session | ✅ Yes (T2) |
| Session TODO | `.agents/session/TODO-YYYY-MM-DD.md` | 1 session | ✅ Yes (T2) |
| Context Forward | `.agents/session/CONTEXT_FORWARD.md` | Until next session | ✅ Yes (T1) |
| Phase Logbook | `.agents/phase-logbooks/Phase-N-LOGBOOK.md` | Permanent | ✅ Yes (T1) |
| Session Plans | `docs/superpowers/plans/YYYY-MM-DD-*.md` | Until phase complete | ✅ Yes (T1→T2) |

---

## What Counts as a Vulnerability

The following patterns create repo vulnerabilities and must be cleaned immediately:

| Pattern | Risk | Resolution |
|---------|------|------------|
| Root-level `TASK_*.md` or `PHASE_*.md` files | Stale state confusion | Move to Archived/ |
| Session notebooks from previous sessions | Context pollution | Delete at Stage 1 |
| TODO lists with no session date | Can't tell if current | Delete or date-stamp |
| Phase plans for completed phases | Agent thinks work is pending | Archive to Archived/ |
| Credentials or API keys in notebooks | Security breach | Delete immediately, rotate keys |
| `.agents/session/` files from 2+ sessions ago | Context contamination | Delete at Stage 1 |
| Fragment clusters (multiple TASK_*.md / SPECIALIST_*.md for same feature) | Fragmented context, can't reconstruct history | Consolidate into dossier, then archive |
