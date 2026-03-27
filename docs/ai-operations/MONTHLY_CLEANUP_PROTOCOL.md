[Ver001.001]

# Monthly Cleanup Protocol — NJZ eSports Platform

**Purpose:** Formalises the monthly maintenance cycle for documentation, session plans, archive index, and governance files.
**Tier:** T1 — load during M-Q1 through M-Q4 cadence sessions.
**Authority:** `MASTER_PLAN.md §12` (Monthly Cleanup Protocol), `.agents/ARCHIVE_INDEX_SCHEDULE.md`
**Framework:** NJZPOF v0.2

---

## Monthly Calendar

| Quarter | Days | Tasks |
|---------|------|-------|
| M-Q1 | 1–7 | Archive scan, session workplan audit |
| M-Q2 | 8–14 | ARCHIVE_MASTER_DOSSIER index table update |
| M-Q3 | 15–21 | FAQ + Cross-Reference Map update, PHASE_GATES review |
| M-Q4 | 22–end | Session workplan cleanup, version bumps, commit |

---

## M-Q1: Archive Scan + Session Workplan Audit

```bash
# 1. Scan Archived/ for new files since last update
git log --diff-filter=A --name-only --pretty=format:"%ai" -- Archived/ | head -200

# 2. List all session workplans
find .agents/session-workplans/ -name "*.md" | sort

# 3. Identify plans older than 30 days
find .agents/session-workplans/ -name "*.md" -mtime +30 | sort
```

**Agent action:** Report findings — total new archived files, total workplans, how many are >30 days old.

---

## M-Q2: ARCHIVE_MASTER_DOSSIER Index Update

Read `ARCHIVE_MASTER_DOSSIER.md`. For each new file found in M-Q1 scan:
1. Add a row to the Index Table (filename, date, topic, one-line summary)
2. Update the Summary file count
3. Update the Topic Map if a new topic category is present

Do NOT load the actual archived files — derive summaries from filenames only.

```bash
# After edits:
git add ARCHIVE_MASTER_DOSSIER.md
# (commit deferred to M-Q4)
```

---

## M-Q3: FAQ + PHASE_GATES Review + Gate Freshness Check

1. **ARCHIVE_MASTER_DOSSIER FAQ:** Re-read the 10 FAQ items. If any answer is now stale (e.g., migration status changed), update it. Review Cross-Reference Map against new archived files — add new Q&A rows if new topics were introduced.

2. **PHASE_GATES.md audit — gate freshness check:**
   ```bash
   # Find all gates with Last Verified older than 30 days (Staleness Drift)
   grep "Last Verified:" .agents/PHASE_GATES.md
   # Compare each date against today; any > 30 days = Staleness Drift
   ```
   - For stale gates: re-run their verification command; update `Last Verified: YYYY-MM-DD` in PHASE_GATES.md
   - For pending gates: has the gate condition been met? If so, mark `✅ PASSED — YYYY-MM-DD`
   - Is any gate blocked on a USER_INPUT_REQUIRED? If so, verify the blocker is still valid
   - Closure SLA: see `docs/ai-operations/DRIFT-CLOSURE-SLA.md`

3. **Doc tiers audit:** Scan for any new `.md` files in `.agents/` or root that aren't tiered in `.doc-tiers.json`. Add them to the appropriate tier.

4. **Governance archive snapshot:**
   ```bash
   # The governance-archive.yml CI workflow runs monthly automatically.
   # Verify the last snapshot exists in docs/governance-archive/
   ls docs/governance-archive/ | tail -5
   # If missing or >35 days old, trigger manually:
   # gh workflow run governance-archive.yml
   ```

---

## M-Q4: Cleanup, Version Bumps, Commit

### Session Workplan Cleanup

```bash
# Delete workplans older than 30 days
find .agents/session-workplans/ -name "*.md" -mtime +30 -delete

# Verify only current work remains
ls .agents/session-workplans/
```

### Root-Level Stale File Audit

```bash
# Check for new stale files at root
ls /*.md | grep -vE "^(MASTER_PLAN|AGENTS|CLAUDE|README|ARCHIVE_MASTER_DOSSIER)\.md$"
```

Any file not in the approved root list (MASTER_PLAN.md, AGENTS.md, CLAUDE.md, README.md, ARCHIVE_MASTER_DOSSIER.md) should be moved to `Archived/Y26/M{current-month}/` via `git mv`.

### Dossier Consolidation Before Archiving

Before moving any files to `Archived/`, check for **fragment clusters** — multiple files that belong to the same component, session, or feature (e.g., several TASK_*.md files for one feature, multiple SPECIALIST_*.md from one session, split phase reports).

**Rule:** Fragment clusters MUST be consolidated into a compiled dossier before archiving. Archive the dossier, not the fragments.

```bash
# Find fragment clusters in root and common staging areas
ls TASK_*.md SPECIALIST_*.md PHASE_*.md 2>/dev/null | sort
find .agents/session-workplans/ -name "*.md" | sort
```

To consolidate a cluster:

1. Create `Archived/Y26/M{MM}/DOSSIER-{component-name}-{date}.md`
2. Concatenate all fragment contents under section headers (`## [original filename]`)
3. `git mv` the dossier; `git rm` the fragments
4. Add ONE row to `ARCHIVE_MASTER_DOSSIER.md` for the dossier

### docs/ Stale File Audit

Check `docs/` for files that are:

- Not referenced by any T0/T1 document
- Older than 3 months with no modification
- Prefixed with old conventions (not `xCOMP_` but equally stale)

Move candidates to `Archived/Y26/M{current-month}/` — do not delete. Apply dossier consolidation if multiple related stale files exist.

### Final Commit

```bash
git add ARCHIVE_MASTER_DOSSIER.md .agents/PHASE_GATES.md .doc-tiers.json
git add Archived/  # if any files moved
git commit -m "chore(monthly): M-Q4 cleanup — archive index update, session workplan purge [SAFE]"
```

---

## Approved Root-Level Files

These 5 files are ALWAYS valid at repo root. All others should be in `docs/`, `.agents/`, or `Archived/`:

| File | Tier | Purpose |
|------|------|---------|
| `MASTER_PLAN.md` | T0 | Central truth road-map |
| `AGENTS.md` | T0-equivalent | Project state for agent orientation |
| `CLAUDE.md` | T0-equivalent | Claude Code instructions |
| `README.md` | T0-equivalent | Repository entry point |
| `ARCHIVE_MASTER_DOSSIER.md` | T0 | Archive index — replaces all archived docs |

---

## Archive Repository Migration (Pending)

When `notbleaux/eSports-EXE-archives` is created:

```bash
# Push Archived/ subtree to archive repo
git subtree push --prefix=Archived origin-archives main

# Remove Archived/ from current repo after successful push
git rm -r Archived/
git commit -m "chore(archive): migrate Archived/ to notbleaux/eSports-EXE-archives [CRIT]"
```

After migration, `ARCHIVE_MASTER_DOSSIER.md` remains at root as the only archive reference. Update `Migration status` field to `Complete`.
