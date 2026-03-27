[Ver001.000]

# Phase 9 Pre-Scout Plan — Component Reconciliation & Optimization

**Purpose:** Before Phase 9 execution begins, verify that all "bonus addition" components from the archival audit are created, validate integration with existing infrastructure, and update Phase 9 tasks to replace redundant build work with optimization.

**Authority:** Cross-review findings (sonnet-4-6-think); ARCHIVE_INDEX_SCHEDULE.md, ARCHIVE_MASTER_DOSSIER.md (updated 2026-03-27)

**Tier:** PHASE (active during Phase 9 pre-execution)

**Date Created:** 2026-03-27

**Timeline:** Complete before Phase 9 tasks begin (same day if possible)

---

## Executive Summary

The cross-review identified that three "bonus additions" are **already declared as T1 files in `.doc-tiers.json`** but are **physically missing**:

- ✅ `.doc-registry.json` (declared line 33)
- ✅ `.agents/archiving/DOSSIER_CREATION_TEMPLATE.md` (declared line 34)
- ✅ `.agents/indexing/FILTER_RULES.md` (declared line 35)

These are **higher priority** than Phase 9 tasks because agents following `.doc-tiers.json` will expect to find these T1 files and fail silently if they're missing.

**This plan creates all three files, verifies integration, and updates Phase 9 execution plans accordingly.**

---

## Pre-Scout Tasks

### Task 1: Create `.doc-registry.json`

**Goal:** Single source of truth for document routing — enables agents to answer "where do I find information about X?" with O(1) lookup.

**Authority:** NJZPOF Pillar 4 (MCP); audit PASS 2 Bullet 3; ARCHIVE_MASTER_DOSSIER.md line 11

**Deliverable:** `.doc-registry.json` with complete schema, all consolidation files registered, validation schema in `.doc-registry-schema.json`

**Related Files:** `.doc-tiers.json` (existing), ARCHIVE_MASTER_DOSSIER.md, docs/archive/INDEX.md, docs/reports/DELIVERABLES_INDEX.md

**Status:** [ ] Create `.doc-registry.json`
**Status:** [ ] Create `.doc-registry-schema.json`
**Status:** [ ] Validate consistency between `.doc-registry.json` and `.doc-tiers.json`

---

### Task 2: Create `.agents/archiving/DOSSIER_CREATION_TEMPLATE.md`

**Goal:** Standardize dossier consolidation format — enables agents to compile fragments consistently before archival.

**Authority:** SESSION_LIFECYCLE.md Stage 1D; audit PASS 1 Bullet 2 (Sub-2c); ARCHIVE_INDEX_SCHEDULE.md M-Q1 (line 19)

**Deliverable:** Template with required sections (Metadata, Fragment List, Consolidated Content, Cross-References, Completeness Checklist); links to 2–3 exemplar dossiers in Archived/Y26/M03/

**Related Files:** SESSION_LIFECYCLE.md Stage 1D, ARCHIVE_INDEX_SCHEDULE.md, existing dossiers in Archived/Y26/M03/

**Status:** [ ] Create template with all required sections
**Status:** [ ] Audit existing dossiers for compliance with template
**Status:** [ ] Tag 2–3 exemplar dossiers in template examples section

---

### Task 3: Create `.agents/indexing/FILTER_RULES.md`

**Goal:** Enable tag-based filtering of ARCHIVE_MASTER_DOSSIER.md — allows agents to query by phase, topic, date, author with bash one-liners.

**Authority:** ARCHIVE_INDEX_SCHEDULE.md M-Q2 (line 20); audit PASS 1 Bullet 3 (Sub-3a); ARCHIVE_MASTER_DOSSIER.md line 12

**Deliverable:** Query syntax documentation with examples; approved topic tags; bash grep patterns for common queries

**Related Files:** ARCHIVE_MASTER_DOSSIER.md Index Table, ARCHIVE_INDEX_SCHEDULE.md, FILTER_RULES.md (this file will define approved tags)

**Status:** [ ] Define tag syntax ([phase:N] [topic:X] [date:YYYY-MM] [author:name])
**Status:** [ ] Document 5+ example queries with expected results
**Status:** [ ] Create bash helper functions for common queries
**Status:** [ ] Update ARCHIVE_MASTER_DOSSIER.md Index Table to include tags (if not already added in recent commit)

---

## Integration Checks

### Check 1: `.doc-registry.json` vs. `.doc-tiers.json` Authority Hierarchy

**Review Finding:** Audit flagged potential competing authorities. Registry should extend (not duplicate) existing tier classification.

**Check:** 
```bash
# Verify all files in .doc-registry.json are also in .doc-tiers.json manifest
jq -r '.consolidation_files[].path' .doc-registry.json | sort > /tmp/registry.txt
grep -o '"[^"]*\.md"' .doc-tiers.json | tr -d '"' | sort > /tmp/tiers.txt
comm -23 /tmp/registry.txt /tmp/tiers.txt  # files in registry but not in tiers = ERROR
```

**Decision Rule:** 
- If registry has files NOT in `.doc-tiers.json`: Add them to `.doc-tiers.json` as T1 files
- If `.doc-tiers.json` has files NOT in registry: Add them as entries with `metadata: { queries_it_answers: [...], scope: "..." }`

**Status:** [ ] Verify bidirectional consistency between registry and tiers

---

### Check 2: Stage 1D vs. Stage 5E Consolidation Authority

**Review Finding:** Audit flagged duplicate consolidation checkpoints. SESSION_LIFECYCLE.md Stage 1D already mandates fragment consolidation before archival in Stage 1 (session start). Proposal for Stage 5E (session close) creates ambiguity.

**Decision:** 
- **Stage 1D is authoritative** for "consolidate before archival"
- **Stage 5E (if created) is verification-only** — confirm consolidation happened at Stage 1D, do not re-consolidate
- Do NOT add Stage 5E as a separate consolidation step (this would duplicate effort)

**Status:** [ ] Review SESSION_LIFECYCLE.md Stage 1D; confirm it's sufficient; document decision in Phase 9 Logbook

---

### Check 3: Archive Repo Creation Status (Prerequisite)

**Review Finding:** Audit flagged that external archive repo (`notbleaux/eSports-EXE-archives`) must exist before cross-reference linking features are enabled.

**Current Status (from ARCHIVE_MASTER_DOSSIER.md line 20-21):**
- ✅ Archive repo created: `notbleaux/eSports-EXE-archives` (2026-03-27)
- ⏳ Subtree push pending CODEOWNER approval (see CODEOWNER_CHECKLIST.md C-ARCH.1)
- 🔓 Cross-reference linking unblocked (repo exists; can proceed with implementation)

**Status:** [ ] Confirm archive repo exists: `gh repo view notbleaux/eSports-EXE-archives`
**Status:** [ ] Update CODEOWNER_CHECKLIST.md C-ARCH.1 with subtree push command when approved

---

### Check 4: Template Seed Verification (Automated)

**Authority:** ARCHIVE_INDEX_SCHEDULE.md M-Q1 (lines 42–47)

**Check:** Run these commands before Phase 9 work begins

```bash
# Verify DOSSIER_CREATION_TEMPLATE.md exists
test -f .agents/archiving/DOSSIER_CREATION_TEMPLATE.md && echo "✅ Template present" || echo "❌ MISSING"

# Verify FILTER_RULES.md exists
test -f .agents/indexing/FILTER_RULES.md && echo "✅ Filter rules present" || echo "❌ MISSING"

# Verify .doc-registry.json exists and is valid JSON
test -f .doc-registry.json && jq . .doc-registry.json > /dev/null && echo "✅ Registry valid" || echo "❌ MISSING or INVALID"
```

**Status:** [ ] Run all three checks; document results in CONTEXT_FORWARD.md

---

## Phase 9 Execution Plan Updates

### Update A: Replace "Create T1 files" tasks with "Verify & optimize"

**Original scope (if it existed in Phase 9):** Build three T1 files from scratch

**Revised scope (optimize, don't build):**
- [ ] Task 9.A1: Verify all three T1 files created; validate schema compliance
- [ ] Task 9.A2: Add tags to ARCHIVE_MASTER_DOSSIER.md Index Table (if not already done)
- [ ] Task 9.A3: Update Phase 9 PHASE_GATES.md to reflect T1 file completion

---

### Update B: Document integration points in Phase 9 Logbook

After completing pre-scout tasks, Phase 9 Logbook should record:

1. **Architecture Decisions** (ADR format):
   - ADR-1: `.doc-registry.json` extends (not duplicates) `.doc-tiers.json`
   - ADR-2: Stage 1D is authoritative for consolidation; Stage 5E is verification-only
   - ADR-3: Archive repo exists; cross-reference linking unblocked

2. **Integration Summary**:
   - `.doc-registry.json` integrated with ARCHIVE_MASTER_DOSSIER.md (routing reference on line 11)
   - FILTER_RULES.md integrated with ARCHIVE_INDEX_SCHEDULE.md (M-Q2 tagging process)
   - DOSSIER_CREATION_TEMPLATE.md integrated with SESSION_LIFECYCLE.md Stage 1D

3. **Deferred Work** (beyond Phase 9):
   - Subtree push to archive repo (awaiting CODEOWNER C-ARCH.1 approval)
   - Bidirectional archive linking (repo exists; can proceed in Phase 10)

---

## Completion Criteria

### Success Conditions

1. ✅ All three T1 files created and validated against schema
2. ✅ `.doc-registry.json` and `.doc-tiers.json` consistency verified (no divergence)
3. ✅ Archive repo status confirmed (repo exists; cross-reference linking unblocked)
4. ✅ Template seed checks pass (all three files present and valid)
5. ✅ Phase 9 tasks updated to reflect T1 file completion (no redundant build work)
6. ✅ Pre-scout findings documented in Phase 9 Logbook (ADRs + integration summary)

### Failure Thresholds

- ❌ Any T1 file missing or invalid JSON/schema → cannot proceed to Phase 9 tasks
- ❌ Registry/tiers divergence unresolved → halt until consistency verified
- ❌ Template seed checks fail → investigate why files are missing; recreate if necessary
- ❌ Phase 9 tasks still contain "build T1 files" work → remove redundant tasks

---

## Checkpoint: Approval before Phase 9 Execution

Once all pre-scout tasks complete:

1. CODEOWNER reviews pre-scout findings in Phase 9 Logbook
2. CODEOWNER confirms Phase 9 tasks have been updated (no redundant build work)
3. CODEOWNER approves: "Phase 9 execution may begin"
4. Phase 9 PHASE_GATES.md updated with approval timestamp

---

## Next Steps (After Pre-Scout)

1. Execute Phase 9 tasks (optimized list, no T1 file creation redundancy)
2. At end of Phase 9, update ARCHIVE_INDEX_SCHEDULE.md with experience from using new templates
3. Plan Phase 10 work (bidirectional archive linking, if CODEOWNER approves subtree push)

---

*Document Version: [Ver001.000]*  
*Created: 2026-03-27*  
*Checkpoint: Awaiting pre-scout completion*
