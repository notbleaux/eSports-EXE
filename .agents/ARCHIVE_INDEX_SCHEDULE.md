[Ver001.001]

# Archive Index Schedule — NJZ eSports Platform

**Purpose:** Rolling 360-day schedule for monthly archive index updates.
**Authority:** `docs/superpowers/specs/2026-03-27-master-plan-extension-phase7-13-design.md §14`
**Tier:** T1 — load when working on archive tasks.
**Framework:** NJZPOF v0.2
**USER_INPUT_REQUIRED:** `notbleaux/eSports-EXE-archives` repo must be created before cross-reference linking features are enabled. Command: `gh repo create notbleaux/eSports-EXE-archives --private`

---

## Schedule

The ARCHIVE_MASTER_DOSSIER.md at repo root is updated on a monthly cadence using the M-Q1 through M-Q4 time-quarter system.

| Cadence Label | Trigger | Agent Action |
|---------------|---------|--------------|
| M-Q1 | First 7 days of month | Archive scan + new template seeding (Phase 9+: seed DOSSIER_CREATION_TEMPLATE and FILTER_RULES if not yet present) |
| M-Q2 | Days 8–14 | Update Index Table with new files; add tags ([phase:N] [topic:X] [date:YYYY-MM]) to new entries |
| M-Q3 | Days 15–21 | Gate freshness check (Staleness Drift); FAQ update; governance archive verify |
| M-Q4 | Days 22–end | Phase deliverables consolidation; workplan cleanup (>30 days); version bump ARCHIVE_MASTER_DOSSIER.md; commit [SAFE] |

**Phase sequencing note:** Template adoption (DOSSIER_CREATION_TEMPLATE.md, FILTER_RULES.md) is active from **Phase 9 onward** (current active phase). Not deferred to Phase 10.

---

## M-Q1 Steps (Archive Scan)

```bash
# 1. Scan for new files added to Archived/ since last M-Q1
git log --diff-filter=A --name-only --pretty=format:"%ai" -- Archived/ | head -200

# 2. Check for fragment clusters needing dossier consolidation
ls Archived/Y26/M$(date +%m)/ 2>/dev/null | sort

# 3. Verify .doc-registry.json and .doc-tiers.json are consistent
# (new T1 files added? add them to both files)
grep -c "T1" .doc-tiers.json
```

**Template seed check (Phase 9+):**

```bash
test -f .agents/archiving/DOSSIER_CREATION_TEMPLATE.md && echo "✅ Template present" || echo "❌ MISSING — create from docs/governance/"
test -f .agents/indexing/FILTER_RULES.md && echo "✅ Filter rules present" || echo "❌ MISSING — create from docs/governance/"
```

---

## M-Q2 Steps (Index Table Update)

For each new file found in M-Q1 scan:

1. Add a row to ARCHIVE_MASTER_DOSSIER.md Index Table
2. Include tags: `[phase:N] [topic:X] [date:YYYY-MM]` (approved topics in `.agents/indexing/FILTER_RULES.md`)
3. Use append-only rule: **never modify existing rows** — new consolidations add new rows only
4. Update `**Total archived files:**` count (exact number, not "144+")
5. Update `**Last Updated:**` date in header

**Cross-Reference Map:** Review new archives against common Q&A topics. If new archives answer new questions, add rows to the Cross-Reference Map section. *(Bidirectional linking deferred until `notbleaux/eSports-EXE-archives` exists.)*

```bash
git add ARCHIVE_MASTER_DOSSIER.md
# (commit deferred to M-Q4)
```

---

## M-Q3 Steps (Gate Freshness + Governance Verify)

```bash
# Gate freshness check — find Last Verified dates older than 30 days
grep "Last Verified:" .agents/PHASE_GATES.md

# Governance archive verify — check last snapshot exists
ls docs/governance-archive/ | tail -3
# If most recent entry is >35 days old: gh workflow run governance-archive.yml

# .doc-registry.json freshness — verify Last Updated fields
grep "last_updated" .doc-registry.json
```

---

## M-Q4 Steps (Phase Deliverables Consolidation + Commit)

For each phase that completed this month:
1. Create `Archived/Y26/M{MM}/PHASE_{N}_DELIVERABLES_CONSOLIDATED.md` from `.agents/session-workplans/Phase-N/phase-deliverables.md`
2. Add one row to ARCHIVE_MASTER_DOSSIER.md Index Table for the consolidated deliverables
3. Run workplan cleanup and version bumps

```bash
# Workplan cleanup
find .agents/session-workplans/ -name "*.md" -mtime +30 -delete

# Root stale file audit (check manifest)
ls *.md 2>/dev/null | grep -vE "^(MASTER_PLAN|AGENTS|CLAUDE|README|ARCHIVE_MASTER_DOSSIER|CONTRIBUTING|SECURITY)\.md$"

# Final commit
git add ARCHIVE_MASTER_DOSSIER.md .agents/PHASE_GATES.md .doc-tiers.json .doc-registry.json
git add Archived/
git commit -m "chore(monthly): M-Q4 cleanup — archive index update, session workplan purge [SAFE]"
```

---

## Spawning Sequence for Archive Updates

The original 9-agent spawning sequence has been simplified. For a solo repo at current scale:

1. **Single agent, 3-pass verification:**
   - Pass 1: Confirm `Archived/` structure matches schema (dated subdirs present)
   - Pass 2: Check for new files added since last M-Q update
   - Pass 3: Cross-check ARCHIVE_MASTER_DOSSIER.md index completeness against actual files

2. **On verification complete:** Update Index Table, FAQ, Cross-Reference Map in the same session

3. **Final check:** Accuracy (entries correct?), Consistency (cross-refs match index?), Completeness (all new files represented?)

*Scale up to multi-agent spawning only if archive grows beyond 500 files or if multiple phases complete in the same month.*

---

## Migration Status

| Status | Date Set | Notes |
|--------|----------|-------|
| ✅ Reorganisation complete | 2026-03-27 | archive/ → Archived/Y26/M03/ (144 files) |
| ✅ Archive repo created | 2026-03-27 | `notbleaux/eSports-EXE-archives` exists |
| ⏳ Subtree push pending | 2026-03-27 | CODEOWNER approval required (C-ARCH.1) before executing push — irreversible |
| — | — | See migration stub below for exact commands |

---

## Archive Migration Stub

**PREREQUISITE:** CODEOWNER_CHECKLIST.md C-ARCH.1 must show `CLAIMED → ACTIVE` before any command below is run.
**RISK:** `[CRIT]` — removes `Archived/` from current repo. 24-hour hold applies after CODEOWNER approval.

### Step 1 — Add archive remote (one-time setup)

```bash
git remote add origin-archives https://github.com/notbleaux/eSports-EXE-archives.git
# Verify:
git remote -v
```

### Step 2 — Push Archived/ subtree to archive repo

```bash
git subtree push --prefix=Archived origin-archives main
```

Expected: `Archived/` directory contents appear as root-level files in `notbleaux/eSports-EXE-archives`.

### Step 3 — Verify push succeeded

```bash
gh repo view notbleaux/eSports-EXE-archives --json name,updatedAt
# Should show recent updatedAt timestamp
```

### Step 4 — Remove Archived/ from current repo (IRREVERSIBLE — confirm push first)

```bash
git rm -r Archived/
git commit -m "chore(archive): migrate Archived/ to notbleaux/eSports-EXE-archives [CRIT]"
```

### Step 5 — Update ARCHIVE_MASTER_DOSSIER.md

Update migration status to `✅ Complete`. Add link to archive repo in Summary section.
