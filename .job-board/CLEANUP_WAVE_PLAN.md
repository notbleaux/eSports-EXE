[Ver001.000]

# JLB CLEANUP WAVE PLAN
## Sub-Agent Task Assignments & Execution Strategy

**Plan Date:** 2026-03-23  
**Status:** READY FOR DEPLOYMENT  
**Total Waves:** 6  
**Total Agents:** 40  
**Est. Duration:** 3 days

---

## Wave Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLEANUP WAVE TIMELINE                            │
├─────────────┬──────────────────────────────────────────┬────────────────┤
│ Wave        │ Description                              │ Duration       │
├─────────────┼──────────────────────────────────────────┼────────────────┤
│ CLEANUP-1   │ Empty Directory Removal                  │ 2 hours        │
│ CLEANUP-2   │ Status Correction (WAVE_1_3 → ON-GOING)  │ 2 hours        │
│ CLEANUP-3   │ Root Documentation Consolidation         │ 4 hours        │
│ CLEANUP-4   │ Naming Convention Standardization        │ 6 hours        │
│ CLEANUP-5   │ Master Index Creation                    │ 2 hours        │
│ CLEANUP-6   │ Final Verification & Sign-off            │ 2 hours        │
└─────────────┴──────────────────────────────────────────┴────────────────┘
```

---

## WAVE CLEANUP-1: Empty Directory Removal
**Objective:** Remove all empty directories from 02_CLAIMED and other locations
**Agents:** 8  
**Est. Time:** 2 hours  
**Dependencies:** None

### CL-1-1: OPT Directories Cleanup (Agents 1-2)

**Agent 1:** Remove empty OPT-A4, OPT-DOC directories
```
Tasks:
1. Verify OPT-A4/AGENT-1 is empty (no files)
2. Remove OPT-A4/AGENT-1 directory
3. Remove OPT-A4 directory if empty after cleanup
4. Verify OPT-DOC/AGENT-1 is empty
5. Remove OPT-DOC/AGENT-1 directory
6. Verify OPT-DOC/AGENT-2 is empty
7. Remove OPT-DOC/AGENT-2 directory
8. Remove OPT-DOC directory if empty
9. Create CL-1-1_REPORT.md with actions taken
10. Move report to 03_COMPLETED/CLEANUP_W1/
```

**Agent 2:** Remove empty OPT-EDGE, OPT-H4 directories
```
Tasks:
1. Remove OPT-EDGE/AGENT-1, AGENT-2, AGENT-3 (all empty)
2. Remove OPT-EDGE directory
3. Remove OPT-H4/AGENT-1, AGENT-2 (both empty)
4. Remove OPT-H4 directory
5. Create CL-1-2_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W1/
```

### CL-1-2: Optimization Directories Cleanup (Agents 3-4)

**Agent 3:** Remove empty OPT-INT, OPT-S5, OPT-S6 directories
```
Tasks:
1. Remove OPT-INT/AGENT-1, AGENT-2, AGENT-3 (all empty)
2. Remove OPT-INT directory
3. Remove OPT-S5/AGENT-1, AGENT-2 (both empty)
4. Remove OPT-S5 directory
5. Remove OPT-S6/AGENT-1, AGENT-2 (both empty)
6. Remove OPT-S6 directory
7. Create CL-1-3_REPORT.md
8. Move report to 03_COMPLETED/CLEANUP_W1/
```

**Agent 4:** Remove empty PERF, VAL-ML directories
```
Tasks:
1. Remove PERF/AGENT-1 through AGENT-5 (all empty)
2. Remove PERF directory
3. Remove VAL-ML/AGENT-1, AGENT-2, AGENT-3 (all empty)
4. Remove VAL-ML directory
5. Create CL-1-4_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W1/
```

### CL-1-3: TL Directory Audit (Agents 5-6)

**Agent 5:** Audit TL_A1, TL_A2, TL_A3 claimed directories
```
Tasks:
1. List all files in TL-A1/ and subdirectories
2. Identify empty AGENT-* subdirectories
3. Remove empty agent directories
4. Audit TL-A2/ similarly
5. Audit TL-A3/ similarly
6. Create consolidation report
7. Move report to 03_COMPLETED/CLEANUP_W1/
```

**Agent 6:** Audit TL_H1, TL_H2, TL_H3, TL_H4 claimed directories
```
Tasks:
1. Audit TL-H1/ for empty subdirectories
2. Audit TL-H2/ for empty subdirectories
3. Audit TL-H3/ for empty subdirectories
4. Audit TL-H4/ for empty subdirectories
5. Remove all empty directories found
6. Create CL-1-6_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W1/
```

### CL-1-4: TL_S Audit & Sessions Cleanup (Agents 7-8)

**Agent 7:** Audit TL_S1, TL_S2, TL_S3, TL_S4, TL_S5, TL_S6
```
Tasks:
1. Audit all TL-S* directories for empty subdirectories
2. Remove empty AGENT-* directories
3. Consolidate duplicate TL-H1 entries (TL_H1 vs TL-H1)
4. Create CL-1-7_REPORT.md
5. Move report to 03_COMPLETED/CLEANUP_W1/
```

**Agent 8:** Sessions archive audit
```
Tasks:
1. Audit 04_SESSIONS/ for empty directories
2. Verify TEMPLATE/ structure
3. Verify UNIFIED_ARCHIVE/ has required files
4. Remove any empty session subdirectories
5. Create CL-1-8_REPORT.md with session status
6. Move report to 03_COMPLETED/CLEANUP_W1/
```

---

## WAVE CLEANUP-2: Status Correction
**Objective:** Rename WAVE_1_3 from "completed" to "on-going" status
**Agents:** 8  
**Est. Time:** 2 hours  
**Dependencies:** CLEANUP-1 complete

### CL-2-1: Directory Structure Update (Agents 1-2)

**Agent 1:** Create new ON-GOING directory structure
```
Tasks:
1. Create 03_ONGOING/ directory
2. Create 03_ONGOING/WAVE_1_3/ directory
3. Move 03_COMPLETED/WAVE_1_3/ contents to 03_ONGOING/WAVE_1_3/
4. Verify move successful
5. Remove empty 03_COMPLETED/WAVE_1_3/
6. Update 03_COMPLETED/README.md with new structure
7. Create CL-2-1_REPORT.md
8. Move report to 03_COMPLETED/CLEANUP_W2/
```

**Agent 2:** Create ON-GOING tracking documentation
```
Tasks:
1. Create 03_ONGOING/INDEX.md with wave status
2. Create 03_ONGOING/WAVE_1_3/MANIFEST.md
3. List all 12 agent directories in WAVE_1_3
4. Mark each as "ON-GOING - Awaiting completion"
5. Add expected completion dates
6. Create CL-2-2_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W2/
```

### CL-2-2: Documentation Updates (Agents 3-6)

**Agent 3:** Update root documentation references
```
Tasks:
1. Search for "WAVE_1_3" references in root *.md files
2. Update PHASE_1_COMPLETION_SUMMARY.md
3. Update PHASE_1_STATUS_REPORT.md
4. Update FOREMAN_PHASE_1_FINAL_APPROVAL.md
5. Change references from "COMPLETED" to "ON-GOING"
6. Create CL-2-3_REPORT.md with changes made
7. Move report to 03_COMPLETED/CLEANUP_W2/
```

**Agent 4:** Update FRAMEWORK documentation
```
Tasks:
1. Search for WAVE_1_3 in FRAMEWORK/ files
2. Update any protocol references
3. Update ASYNC_CONSOLIDATION_PROTOCOL_v2.md if needed
4. Update JOB_CLAIMING_PROTOCOL_v2.md if needed
5. Create CL-2-4_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W2/
```

**Agent 5:** Update 06_TEAM_LEADERS references
```
Tasks:
1. Check TL_A2, TL_H2, TL_S2 frameworks
2. Update any WAVE_1_3 references
3. Update agent briefings
4. Create CL-2-5_REPORT.md
5. Move report to 03_COMPLETED/CLEANUP_W2/
```

**Agent 6:** Update 01_LISTINGS status
```
Tasks:
1. Check all ACTIVE listings for WAVE_1_3
2. Update status from "COMPLETED" to "ON-GOING"
3. Update agent directives
4. Create CL-2-6_REPORT.md
5. Move report to 03_COMPLETED/CLEANUP_W2/
```

### CL-2-3: Verification (Agents 7-8)

**Agent 7:** Cross-reference verification
```
Tasks:
1. Verify 03_COMPLETED/WAVE_1_3 no longer exists
2. Verify 03_ONGOING/WAVE_1_3 exists with content
3. Verify all 12 agent directories present
4. Search for any missed "WAVE_1_3 completed" references
5. Create CL-2-7_VERIFICATION_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W2/
```

**Agent 8:** Master status update
```
Tasks:
1. Update 06_WORK_HISTORY/MASTER_HISTORY.yaml
2. Change WAVE_1_3 status from "COMPLETE" to "ON-GOING"
3. Update AGENT_LOOKUP.json
4. Update 04_SESSIONS/UNIFIED_ARCHIVE/MASTER_INDEX.md
5. Create CL-2-8_MASTER_UPDATE_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W2/
```

---

## WAVE CLEANUP-3: Root Documentation Consolidation
**Objective:** Consolidate 23 root documentation files into structured archives
**Agents:** 8  
**Est. Time:** 4 hours  
**Dependencies:** CLEANUP-2 complete

### CL-3-1: Archive Structure Creation (Agent 1)
```
Tasks:
1. Create 09_ARCHIVE/ directory
2. Create 09_ARCHIVE/PHASE_SUMMARIES/
3. Create 09_ARCHIVE/FOREMAN_TRACKING/
4. Create 09_ARCHIVE/ASSESSMENT_REPORTS/
5. Create 09_ARCHIVE/FRAMEWORK_HISTORICAL/
6. Create CL-3-1_ARCHIVE_STRUCTURE_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W3/
```

### CL-3-2: Phase Summaries Consolidation (Agents 2-3)

**Agent 2:** Archive Phase 1 summaries
```
Tasks:
1. Move PHASE_1_COMPLETION_SUMMARY.md → 09_ARCHIVE/PHASE_SUMMARIES/
2. Move PHASE_1_EXECUTIVE_SUMMARY.md → 09_ARCHIVE/PHASE_SUMMARIES/
3. Move PHASE_1_STATUS_REPORT.md → 09_ARCHIVE/PHASE_SUMMARIES/
4. Create index of archived Phase 1 docs
5. Update any references in active docs
6. Create CL-3-2_PHASE1_ARCHIVE_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W3/
```

**Agent 3:** Archive Phase 2 summaries
```
Tasks:
1. Move PHASE_2_COMPLETION_SUMMARY.md → 09_ARCHIVE/PHASE_SUMMARIES/
2. Move PHASE_2_GAP_ANALYSIS.md → 09_ARCHIVE/PHASE_SUMMARIES/
3. Move PHASE_2_COMPREHENSIVE_VERIFICATION_REPORT.md → 09_ARCHIVE/PHASE_SUMMARIES/
4. Create index of archived Phase 2 docs
5. Update references
6. Create CL-3-3_PHASE2_ARCHIVE_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W3/
```

### CL-3-3: Foreman Tracking Consolidation (Agent 4)
```
Tasks:
1. Move FOREMAN_HELP_ACCESSIBILITY_TRACKING.md → 09_ARCHIVE/FOREMAN_TRACKING/
2. Move FOREMAN_HEROES_MASCOTS_TRACKING.md → 09_ARCHIVE/FOREMAN_TRACKING/
3. Move FOREMAN_PHASE_1_FINAL_APPROVAL.md → 09_ARCHIVE/FOREMAN_TRACKING/
4. Move FOREMAN_SPECMAPVIEWER_V2_TRACKING.md → 09_ARCHIVE/FOREMAN_TRACKING/
5. Create FOREMAN_TRACKING_INDEX.md
6. Create CL-3-4_FOREMAN_ARCHIVE_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W3/
```

### CL-3-4: Assessment Reports Consolidation (Agent 5)
```
Tasks:
1. Move OPTIMIZATION_SUMMARY.md → 09_ARCHIVE/ASSESSMENT_REPORTS/
2. Move ASYNC_AGENT_PERFORMANCE_REVIEW.md → 09_ARCHIVE/ASSESSMENT_REPORTS/
3. Move PHASE_0_RESOLUTION.md → 09_ARCHIVE/ASSESSMENT_REPORTS/
4. Create ASSESSMENT_INDEX.md
5. Create CL-3-5_ASSESSMENT_ARCHIVE_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W3/
```

### CL-3-5: Framework Integration (Agents 6-7)

**Agent 6:** Integrate core frameworks
```
Tasks:
1. Move JLB_ARCHITECTURE_DESIGN.md → FRAMEWORK/ (or integrate into README)
2. Move OPERATIONAL_FRAMEWORK.md → FRAMEWORK/ (archive v1, keep v2 active)
3. Move TEAM_LEADER_FRAMEWORK.md → 06_TEAM_LEADERS/
4. Move ASSISTANT_FOREMAN_FRAMEWORK.md → 07_ASSISTANT_FOREMAN/
5. Create CL-3-6_FRAMEWORK_INTEGRATION_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W3/
```

**Agent 7:** Integrate remaining docs
```
Tasks:
1. Move DEPLOYMENT_LOG.md → 07_ASSISTANT_FOREMAN/
2. Move SPAWN_DASHBOARD.md → SPAWN_LOGS/ (or update existing)
3. Move TEAM_ROSTER.md → 06_TEAM_LEADERS/ (merge with MASTER_TL_ROSTER)
4. Move MULTI_AI_COORD_GUIDELINES.md → FRAMEWORK/
5. Move SAF_COUNCIL_FRAMEWORK.md → 08_SAF_COUNCIL/
6. Create CL-3-7_INTEGRATION_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W3/
```

### CL-3-6: Root README Update (Agent 8)
```
Tasks:
1. Update .job-board/README.md with new structure
2. Add links to 09_ARCHIVE/
3. Add links to 03_ONGOING/
4. Update directory map
5. Add cleanup wave status
6. Create CL-3-8_README_UPDATE_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W3/
```

---

## WAVE CLEANUP-4: Naming Convention Standardization
**Objective:** Rename ~189 files to follow naming convention
**Agents:** 8  
**Est. Time:** 6 hours  
**Dependencies:** CLEANUP-3 complete

### CL-4-1: 01_LISTINGS Standardization (Agents 1-2)

**Agent 1:** Standardize HELP listings
```
Tasks:
1. Rename HELP_WAVE_1_1_AGENT_1A_CONTENT_SCHEMA.md → HELP-W1_1-1A_CONTENT_SCHEMA.md
2. Rename HELP_WAVE_1_1_AGENT_1B_CONTEXT_ENGINE.md → HELP-W1_1-1B_CONTEXT_ENGINE.md
3. Rename HELP_WAVE_1_1_AGENT_1C_KNOWLEDGE_GRAPH.md → HELP-W1_1-1C_KNOWLEDGE_GRAPH.md
4. Update any internal references
5. Create CL-4-1_HELP_LISTINGS_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W4/
```

**Agent 2:** Standardize SPEC and other listings
```
Tasks:
1. Rename SPEC_WAVE_* files to SPEC-W*_format
2. Rename WAVE_1_* files to standardized format
3. Update internal references
4. Create 01_LISTINGS/NAMING_CONVENTION.md guide
5. Create CL-4-2_SPEC_LISTINGS_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W4/
```

### CL-4-2: 02_CLAIMED Standardization (Agents 3-4)

**Agent 3:** Standardize OPT directories
```
Tasks:
1. Rename OPT-A3 → OPT-A3-{description}
2. Rename OPT-A4 → OPT-A4-{description} (if kept)
3. Rename OPT-H3 → OPT-H3-{description}
4. Rename OPT-S3 → OPT-S3-{description}
5. Standardize subdirectory naming
6. Create CL-4-3_OPT_CLAIMED_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W4/
```

**Agent 4:** Standardize TL directories
```
Tasks:
1. Standardize TL-A1/, TL-A2/, etc. naming
2. Standardize AGENT-* subdirectory names
3. Fix TL_H1 vs TL-H1 inconsistency
4. Create naming convention guide
5. Create CL-4-4_TL_CLAIMED_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W4/
```

### CL-4-3: 03_COMPLETED Standardization (Agents 5-6)

**Agent 5:** Standardize wave directories
```
Tasks:
1. Verify WAVE_1_1/ naming (should be correct)
2. Verify WAVE_1_2/ naming
3. Verify WAVE_2_0/ naming
4. Rename FOREMAN_VERIFICATION_REPORT.md to include wave
5. Standardize COMPLETION_MANIFEST.md naming
6. Create CL-4-5_COMPLETED_WAVES_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W4/
```

**Agent 6:** Standardize agent reports
```
Tasks:
1. Audit all *_COMPLETION_REPORT.md files
2. Verify naming follows TL-{TEAM}-{WAVE}-{AGENT}_COMPLETION_REPORT.md
3. Rename any non-compliant files
4. Update references
5. Create CL-4-6_AGENT_REPORTS_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W4/
```

### CL-4-4: Root & Framework Standardization (Agents 7-8)

**Agent 7:** Standardize remaining root files
```
Tasks:
1. Rename remaining root .md files per convention
2. Standardize README.md locations
3. Merge duplicate READMEs where appropriate
4. Create CL-4-7_ROOT_STANDARDIZATION_REPORT.md
5. Move report to 03_COMPLETED/CLEANUP_W4/
```

**Agent 8:** Framework version cleanup
```
Tasks:
1. Archive ASYNC_CONSOLIDATION_PROTOCOL.md (unversioned)
2. Move to FRAMEWORK/ARCHIVED/
3. Create FRAMEWORK/VERSION_HISTORY.md
4. Verify all active protocols are versioned
5. Create CL-4-8_FRAMEWORK_VERSION_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W4/
```

---

## WAVE CLEANUP-5: Master Index Creation
**Objective:** Create single MASTER_INDEX.md for entire JLB
**Agents:** 4  
**Est. Time:** 2 hours  
**Dependencies:** CLEANUP-4 complete

### CL-5-1: Index Structure (Agent 1)
```
Tasks:
1. Create MASTER_INDEX.md structure
2. Add directory overview section
3. Add quick links section
4. Add status dashboard section
5. Create CL-5-1_INDEX_STRUCTURE_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W5/
```

### CL-5-2: Content Population (Agents 2-3)

**Agent 2:** Populate active directories index
```
Tasks:
1. Document 00_INBOX structure
2. Document 01_LISTINGS/ACTIVE
3. Document 02_CLAIMED (active only)
4. Document 03_COMPLETED (summary)
5. Document 03_ONGOING
6. Update MASTER_INDEX.md
7. Create CL-5-2_ACTIVE_INDEX_REPORT.md
8. Move report to 03_COMPLETED/CLEANUP_W5/
```

**Agent 3:** Populate framework & archive index
```
Tasks:
1. Document FRAMEWORK/ contents
2. Document 09_ARCHIVE/ contents
3. Document 06_WORK_HISTORY/
4. Document 07_VERIFICATION/
5. Update MASTER_INDEX.md
6. Create CL-5-3_FRAMEWORK_INDEX_REPORT.md
7. Move report to 03_COMPLETED/CLEANUP_W5/
```

### CL-5-3: Cross-Reference & Verification (Agent 4)
```
Tasks:
1. Add cross-references between sections
2. Verify all links work
3. Add "last updated" timestamp
4. Add foreman contact info
5. Create CL-5-4_INDEX_VERIFICATION_REPORT.md
6. Move report to 03_COMPLETED/CLEANUP_W5/
```

---

## WAVE CLEANUP-6: Final Verification & Sign-off
**Objective:** Verify all cleanup waves complete, system operational
**Agents:** 4  
**Est. Time:** 2 hours  
**Dependencies:** CLEANUP-5 complete

### CL-6-1: Metrics Verification (Agent 1)
```
Tasks:
1. Count total files (target: <300)
2. Count empty directories (target: 0)
3. Count naming violations (target: <20)
4. Count root files (target: <10)
5. Verify disk space saved
6. Create CL-6-1_METRICS_VERIFICATION.md
7. Move report to 03_COMPLETED/CLEANUP_W6/
```

### CL-6-2: Functional Verification (Agent 2)
```
Tasks:
1. Verify claiming workflow works
2. Verify completion reporting works
3. Verify MASTER_INDEX accessible
4. Test directory navigation
5. Create CL-6-2_FUNCTIONAL_VERIFICATION.md
6. Move report to 03_COMPLETED/CLEANUP_W6/
```

### CL-6-3: Documentation Verification (Agent 3)
```
Tasks:
1. Verify all reports in 03_COMPLETED/CLEANUP_*/
2. Create CLEANUP_MASTER_REPORT.md
3. Document lessons learned
4. Update FRAMEWORK/README.md
5. Create CL-6-3_DOCUMENTATION_VERIFICATION.md
6. Move report to 03_COMPLETED/CLEANUP_W6/
```

### CL-6-4: Foreman Sign-off (Agent 4)
```
Tasks:
1. Compile all verification reports
2. Create executive summary
3. Prepare sign-off document
4. Submit for Foreman approval
5. Create CL-6-4_FOREMAN_SIGNOFF.md
6. Move report to 03_COMPLETED/CLEANUP_W6/
```

---

## Success Criteria

### Final State Targets

| Metric | Before | Target | Verified By |
|--------|--------|--------|-------------|
| Empty directories | 87 | 0 | CL-6-1 |
| Naming violations | ~189 | <20 | CL-6-1 |
| Root documentation | 23 | <10 | CL-6-1 |
| Total files | 400+ | 300+ | CL-6-1 |
| Status mislabels | 12 | 0 | CL-6-2 |
| MASTER_INDEX | No | Yes | CL-6-2 |

### Quality Gates

- [ ] CLEANUP-1: All empty directories removed
- [ ] CLEANUP-2: WAVE_1_3 renamed to ON-GOING
- [ ] CLEANUP-3: Root docs consolidated
- [ ] CLEANUP-4: Naming standardized
- [ ] CLEANUP-5: MASTER_INDEX created
- [ ] CLEANUP-6: All verification passed
- [ ] Foreman sign-off obtained

---

## Appendices

### A. File Naming Convention

```
Format: {COMPONENT}-{PHASE}-{WAVE}-{AGENT}_{TYPE}[_{VERSION}].md

Examples:
✅ TL-A1-1-B_COMPLETION_REPORT.md
✅ AF-001_WAVE-1-2_VERIFICATION_REPORT_v2.md
✅ OPT-PERF_PERFORMANCE_TESTING.md
✅ FOR-001_PHASE-1_APPROVAL.md
```

### B. Directory Naming Convention

```
Format: {PHASE}_{WAVE}_{TEAM}_{AGENT-ID}

Examples:
✅ P1_W1_1_TL-A1-B
✅ P2_W2_0_TL-A3
✅ CLEANUP_W1_CL-1-1
```

### C. Report Checklist

Each agent must produce:
- [ ] Completion report following template
- [ ] List of actions taken
- [ ] Before/after comparison
- [ ] Any issues encountered
- [ ] Recommendations

---

**Plan Author:** Foreman  
**Date:** 2026-03-23  
**Status:** READY FOR DEPLOYMENT

---

*This plan is read-only. Modifications require Foreman approval.*
