[Ver001.000]

# Dossier Creation Template — Fragment Consolidation Guide

**Purpose:** Standardize the consolidation of fragment files into compiled dossiers before archival. Ensures consistency across all archives and enables efficient historical reference.

**Authority:** SESSION_LIFECYCLE.md Stage 1D; audit PASS 1 Bullet 2 (Sub-2c); ARCHIVE_INDEX_SCHEDULE.md M-Q1 (line 19)

**Tier:** T1 — load when consolidating files for archival

**Framework:** NJZPOF v0.2 (Pillar 6 — Success Deliverables)

---

## Quick Reference

A **dossier** consolidates related fragments (task reports, completion summaries, phase documents) into a single compiled document for efficient retrieval and archival.

**When to create a dossier:**
- Multiple related files from one component (e.g., TASK_12_REPORT.md, SPECIALIST_A_COMPLETION.md, PHASE_PLAN.md)
- Fragment files accumulating in root directory (>2 related fragments)
- Session produces multiple interconnected outputs that should be archived as a unit

**When NOT to create a dossier:**
- Standalone, self-contained files (e.g., single specification document)
- Files already part of a dossier (don't nest dossiers)
- Temporary scratch files meant to be deleted (not archived)

---

## Dossier Metadata Header

Every dossier must include this header at the top:

```markdown
[Ver001.000]

# Dossier Name — Descriptive Subtitle

**Created:** YYYY-MM-DD  
**Component:** Component or phase name (e.g., "Phase 2 Execution", "Specialist B Completion")  
**Fragment Count:** N files consolidated  
**Total Lines:** Approximate line count after consolidation  
**Author(s):** Agent name(s) or team  
**Archived In:** `Archived/Y26/M{MM}/DOSSIER-component-date.md`  

---
```

### Metadata Fields Explained

| Field | Purpose | Example |
|-------|---------|---------|
| **Version** | Document version for tracking changes | `[Ver001.000]` |
| **Title** | Clear, descriptive name | `Dossier: Phase 2 Execution — Completion Reports and Learnings` |
| **Created** | Date dossier was compiled | `2026-03-27` |
| **Component** | What the dossier is about | `Phase 2 Execution`, `Specialist B Tasks` |
| **Fragment Count** | How many original files were consolidated | `5 files` |
| **Total Lines** | Approximate length | `~2500 lines` |
| **Author(s)** | Who created the dossier | `Foreman Agent, KID003` |
| **Archived In** | Where it lives in Archived/ | `Archived/Y26/M03/DOSSIER-phase-2-2026-03-27.md` |

---

## Dossier Structure

### Required Sections (in this order)

#### 1. Fragment Index

List all original fragments consolidated into this dossier:

```markdown
## Fragment Index

| Original Filename | Lines | Date | Purpose |
|------------------|-------|------|---------|
| TASK_12_FINAL_REPORT.md | 456 | 2026-03-27 | Task completion summary |
| SPECIALIST_B_FILES.md | 234 | 2026-03-27 | Specialist deliverables |
| PHASE_2_FINAL_PLAN.md | 789 | 2026-03-27 | Phase execution plan |

**Total fragments:** 3  
**Total consolidated lines:** 1,479  
**Consolidation method:** Concatenated with section headers
```

#### 2. Consolidated Content

Include all fragment content under section headers matching fragment names. Preserve original structure but add context:

```markdown
## TASK_12_FINAL_REPORT.md

[original content of TASK_12_FINAL_REPORT.md here]

---

## SPECIALIST_B_FILES.md

[original content of SPECIALIST_B_FILES.md here]

---

## PHASE_2_FINAL_PLAN.md

[original content of PHASE_2_FINAL_PLAN.md here]
```

#### 3. Cross-References

Document relationships between fragments and links to related dossiers or archives:

```markdown
## Cross-References

**Related Dossiers:**
- `DOSSIER-phase-1-execution-2026-03-17.md` — Phase 1 completion (predecessor)
- `DOSSIER-phase-3-execution-2026-04-15.md` — Phase 3 continuation (successor)

**Related Archives:**
- See `ARCHIVE_MASTER_DOSSIER.md` Topic Map: "Phase Completion & Execution Reports" for other phase summaries
- See `PHASE_GATES.md` Phase 2 section for gate verification commands and status

**External References:**
- MASTER_PLAN.md §5 (Phase 2 scope definition)
- SESSION_LIFECYCLE.md Stage 4 (work execution guidelines)
```

#### 4. Completeness Checklist

Verify that the dossier captures all relevant information:

```markdown
## Completeness Checklist

- [x] All fragment files listed in Fragment Index
- [x] Consolidated content includes full text of each fragment
- [x] No information lost in consolidation (verify by file size comparison)
- [x] Cross-references updated (related dossiers, archives, external links)
- [x] Metadata header is complete and accurate
- [x] All section headers preserved from original fragments
- [x] No duplicate content across fragments (or duplicates documented with rationale)
- [x] Dossier filename follows `DOSSIER-component-date.md` convention
- [x] Dossier archived in correct `Archived/Y26/M{MM}/` subdirectory
- [x] One row added to ARCHIVE_MASTER_DOSSIER.md Index Table for this dossier

**Verification:**
- [ ] Line count matches sum of fragments ± formatting adjustments
- [ ] Cross-references verified to be accurate (spot-check 3+ links)
- [ ] README or related index files updated with dossier reference
```

---

## Step-by-Step Creation Process

### Step 1: Identify Fragments

Collect all files to be consolidated:

```bash
# Find all TASK_*.md, SPECIALIST_*.md, and PHASE_*.md files in current directory
ls TASK_*.md SPECIALIST_*.md PHASE_*.md 2>/dev/null | sort
```

Example output:
```
TASK_12_FINAL_REPORT.md
SPECIALIST_B_FILES.md
SPECIALIST_B_COMPLETION_REPORT.md
PHASE_2_FINAL_PLAN.md
```

**Decision:** Are these fragments? Apply this filter:
- From same component/phase? YES → consolidate
- Standalone, self-contained? NO → don't consolidate
- Related by date/author? YES → consolidate
- Part of archive workflow (not temporary)? YES → consolidate

### Step 2: Create Dossier File

Create `Archived/Y26/M{MM}/DOSSIER-component-date.md` with:

```bash
touch Archived/Y26/M03/DOSSIER-phase-2-2026-03-27.md
```

### Step 3: Add Metadata Header

Copy the template header above and fill in values:

```markdown
[Ver001.000]

# Dossier: Phase 2 Execution — Completion Reports and Learnings

**Created:** 2026-03-27  
**Component:** Phase 2 Execution  
**Fragment Count:** 4 files  
**Total Lines:** ~2,100  
**Author(s):** Foreman Agent, KID003  
**Archived In:** `Archived/Y26/M03/DOSSIER-phase-2-execution-2026-03-27.md`
```

### Step 4: Add Fragment Index

List all fragments:

```markdown
## Fragment Index

| Original Filename | Lines | Date | Purpose |
|------------------|-------|------|---------|
| TASK_12_FINAL_REPORT.md | 456 | 2026-03-27 | Task completion summary |
| SPECIALIST_B_FILES.md | 234 | 2026-03-27 | Specialist deliverables |
| SPECIALIST_B_COMPLETION_REPORT.md | 312 | 2026-03-27 | Specialist completion status |
| PHASE_2_FINAL_PLAN.md | 789 | 2026-03-27 | Phase execution plan |

**Total fragments:** 4  
**Total consolidated lines:** 1,791
```

### Step 5: Concatenate Fragment Content

Append each fragment's content with a section header:

```bash
cat TASK_12_FINAL_REPORT.md >> DOSSIER-phase-2-execution-2026-03-27.md
echo "" >> DOSSIER-phase-2-execution-2026-03-27.md
echo "---" >> DOSSIER-phase-2-execution-2026-03-27.md
cat SPECIALIST_B_FILES.md >> DOSSIER-phase-2-execution-2026-03-27.md
# ... repeat for remaining fragments
```

### Step 6: Add Cross-References

Manually add the Cross-References section (requires knowledge of related dossiers/archives).

### Step 7: Add Completeness Checklist

Copy checklist template and verify each item.

### Step 8: Update ARCHIVE_MASTER_DOSSIER.md

Add ONE row to the Index Table:

```markdown
| DOSSIER-phase-2-execution-2026-03-27.md | 2026-03-27 | Phase Completion & Execution Reports | Consolidated Phase 2 completion reports, specialist deliverables, phase plan [phase:2] [topic:execution] [date:2026-03] |
```

### Step 9: Move Fragments to Archive

```bash
# Archive original fragments in same directory
git mv TASK_12_FINAL_REPORT.md Archived/Y26/M03/
git mv SPECIALIST_B_FILES.md Archived/Y26/M03/
git mv SPECIALIST_B_COMPLETION_REPORT.md Archived/Y26/M03/
git mv PHASE_2_FINAL_PLAN.md Archived/Y26/M03/

# Commit dossier + archived fragments
git add DOSSIER-phase-2-execution-2026-03-27.md
git add ARCHIVE_MASTER_DOSSIER.md
git commit -m "chore(archive): Consolidate Phase 2 fragments into dossier [SAFE]"
```

### Step 10: Verification

```bash
# Verify line count
wc -l DOSSIER-phase-2-execution-2026-03-27.md
# (should be approximately 1,791 + markup lines)

# Verify fragments are archived
ls -la Archived/Y26/M03/ | grep TASK_12\|SPECIALIST_B\|PHASE_2

# Verify dossier index entry exists
grep "DOSSIER-phase-2-execution" ARCHIVE_MASTER_DOSSIER.md
```

---

## Exemplar Dossiers (Reference Implementation)

These existing dossiers in `Archived/Y26/M03/` follow this template:

1. **DOSSIER-specialist-b-session-2026-03-27.md**
   - Consolidates: 3 specialist reports + completion summary
   - Fragment count: 4 files
   - Pattern: Session-based consolidation

2. **DOSSIER-phase2-completion-reports-2026-03-27.md**
   - Consolidates: 5 phase completion + verification reports
   - Fragment count: 5 files
   - Pattern: Phase-based consolidation

3. (Additional exemplars to be documented as they are created)

---

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Fragment not found** | Cross-references point to non-existent files | Verify all fragments in Fragment Index exist in Archived/Y26/M{MM}/ |
| **Duplicate content** | Same text appears in two fragments | Document rationale in Cross-References or consolidate fragments more aggressively |
| **Incomplete consolidation** | Line count doesn't match sum of fragments | Check for formatting changes (line wraps, markdown additions) |
| **ARCHIVE_MASTER_DOSSIER.md not updated** | Index entry missing | Add one row to Index Table; if row already exists, verify against DOSSIER filename |
| **Cross-references broken** | Links to related dossiers fail | Use exact paths from ARCHIVE_MASTER_DOSSIER.md Index Table; verify dossier names |

---

## FAQ

**Q: Can I consolidate files from different phases?**  
A: No. Dossiers should be **single-component or single-phase**. If files span multiple phases, create separate dossiers per phase and link them in Cross-References.

**Q: What if a fragment is already very large (500+ lines)?**  
A: Include it as-is. The goal is consolidation of related fragments, not size reduction. Large fragments remain large.

**Q: Should I edit fragment content when consolidating?**  
A: No. Consolidation is concatenation only. Do not edit, reformat, or summarize fragment content — preserve original text exactly.

**Q: How long should a dossier be?**  
A: There's no maximum. Some dossiers are 1,000 lines; others are 5,000+. The goal is logical grouping, not size optimization.

**Q: Can I nest dossiers (dossier containing another dossier)?**  
A: No. Dossiers are leaf nodes in the archive tree. If you need to group multiple dossiers, use the ARCHIVE_MASTER_DOSSIER.md Cross-Reference Map instead.

---

## Maintenance

**Monthly (M-Q1) Review:**
- Check that all archived fragments have corresponding dossier entries
- Verify no orphaned fragments exist outside dossiers
- If new fragment patterns emerge, update this template with new guidance

**Phase Boundary (at phase completion):**
- Consolidate all phase completion reports into a PHASE_N_COMPLETION_DOSSIER.md
- Add to ARCHIVE_MASTER_DOSSIER.md Index Table
- Archive original fragments

---

*Template Version: [Ver001.000]*  
*Created: 2026-03-27*  
*Next Review: M-Q1 April 2026*
