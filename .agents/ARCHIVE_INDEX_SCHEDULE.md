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
| M-Q1 | First 7 days of month | Run archive scan: `git log --diff-filter=A --name-only -- Archived/ \| head -200` |
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
