[Ver001.000]

# Archival Optimization Master Plan — NJZiteGeisTe Platform

**Authority:** Repository Assessment Report 2026-03-30  
**Scope:** Full recursive archival cleanup with sub-agent orchestration  
**Status:** Phase 1 — Master Plan Initialization  
**Framework:** NJZPOF v0.2 + Nested Sub-Agent Protocol  

---

## Executive Summary

This plan establishes a **recursive, multi-layered archival optimization process** for the NJZiteGeisTe Platform repository. The process deploys sub-agents with nested sub-sub-agents to conduct comprehensive scouting, analysis, and reorganization of archival structures.

**Total Repository Scope:**
- 441 documentation files (4.82 MB)
- 144 files in primary archive (`Archived/`)
- 175 files in secondary archives (`docs/archive/`, `docs/archive-website/`)
- 8 root-level .md files
- 24 active agent files (`.agents/`)

---

## Phase Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MASTER COORDINATOR (You)                            │
│                    Creates Master Plan + Initial Report                     │
└────────────────────┬────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   Agent A    │ │ Agent B  │ │  Agent C     │  ← Phase 2: 2 Parallel Agents
│  (Report 1)  │ │(Report 2)│ │  (Base)      │     + Base Report (You)
└──────┬───────┘ └────┬─────┘ └──────┬───────┘
       │              │              │
       └──────────────┼──────────────┘
                      ▼
┌────────────────────────────────────────────────┐
│        COMPILATION & CRITIQUE (You)            │
│   Merge 3 reports, identify gaps, provide      │
│   context updates for improvement vectors      │
└────────────────────┬───────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  Agent D     │ │ Agent E  │ │  Agent F     │  ← Phase 4: 3 Improved Agents
│ (Improved 1) │ │(Improved 2)│ │ (Improved 3) │    with enhanced instructions
└──────┬───────┘ └────┬─────┘ └──────┬───────┘
       │              │              │
       └──────────────┼──────────────┘
                      ▼
┌────────────────────────────────────────────────┐
│      FINAL DOUBLE CHECK REVIEW (You)           │
│   Comprehensive validation against all         │
│   findings, cross-reference, synthesis         │
└────────────────────┬───────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────┐
│      FINE-TUNING & INTEGRATION (You)           │
│   Optimize master plan, consolidate findings   │
└────────────────────┬───────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────┐
│   SCOUT NETWORK DEPLOYMENT (Sub-Agents +       │
│   Nested Sub-Sub-Agents) — Full Repo Coverage  │
└────────────────────────────────────────────────┘
```

---

## Phase 2: Parallel Sub-Agent Deployment

### Agent A — Primary Scout
**Task:** Replicate master plan creation with independent analysis
**Scope:** Full repository assessment with fresh perspective
**Deliverable:** Complete report with 3 recommendations + 5 sub-bullets each

### Agent B — Secondary Scout  
**Task:** Independent parallel analysis
**Scope:** Cross-validation of findings, alternate perspective
**Deliverable:** Complete report with 3 recommendations + 5 sub-bullets each

---

## Report Format Specification

Each agent report MUST follow this exact structure:

```markdown
# [Agent Name] — Archival Optimization Report

## Section 1: Repository Scan Summary
[Brief overview of findings]

## Section 2: Three Core Recommendations

### Recommendation 1: [Title]
**Description:** [2-3 sentence description of the recommendation]

- **Enhancement:** [Specific enhancement detail]
- **Reconciliation:** [Reconciliation approach]
- **Adaption:** [Adaptation strategy]
- **Improvement:** [Improvement metric]
- **Update:** [Update procedure]

### Recommendation 2: [Title]
[Same structure...]

### Recommendation 3: [Title]
[Same structure...]

## Section 3: Sub-Agent Scouting Plan
[How this agent would organize nested sub-agents]

## Section 4: Risk Assessment
[Potential issues and mitigation]
```

---

## INITIAL BASE REPORT (Coordinator)

### Repository Scan Summary

**Primary Findings:**
1. **Archive Infrastructure: EXCELLENT** — Tier system, registries, protocols all in place
2. **Migration Blocker: PENDING** — Archive repo ready but subtree push not executed
3. **Bloat Distribution: UNEVEN** — 441 docs/ files, 175 in secondary archives
4. **ROOT_AXIOMS: WELL-STRUCTURED** — 12 files, 4 categories, canonical principles
5. **Monthly Protocol: DEFINED** — M-Q1 through M-Q4 cadence established

---

### RECOMMENDATION 1: Execute Archive Repository Migration with Validation Protocol

**Description:** The `Archived/` directory contains 144 files (~2.5 MB) that have been properly indexed in `ARCHIVE_MASTER_DOSSIER.md`. The separate repository `notbleaux/eSports-EXE-archives` has been created but the subtree push remains pending CODEOWNER approval. This migration must be executed with a validation protocol to ensure zero reference breakage.

- **Enhancement:** Implement pre-migration validation script that verifies all cross-references in `ARCHIVE_MASTER_DOSSIER.md` resolve correctly before and after migration
- **Reconciliation:** Create bidirectional linking system where `ARCHIVE_MASTER_DOSSIER.md` in main repo links to archived files, and archived files contain backlinks to main repo context
- **Adaption:** Adapt the `.doc-registry.json` to include archive repository as a remote registry entry, enabling queries to span both repositories
- **Improvement:** Reduce main repository clone size by ~2.5 MB (35% documentation reduction), improving CI/CD checkout times by approximately 8-12 seconds
- **Update:** Update `MONTHLY_CLEANUP_PROTOCOL.md` to include archive repository maintenance procedures and quarterly integrity checks

---

### RECOMMENDATION 2: Consolidate Secondary Archive Locations with Deduplication Analysis

**Description:** Currently, archived content is scattered across four locations: `Archived/` (144 files), `docs/archive/` (37 files), `docs/archive-website/` (138 files), and `docs/legacy-archive/` (12 files). This fragmentation creates maintenance overhead and potential reference confusion. A consolidation strategy with deduplication analysis is required.

- **Enhancement:** Develop archive consolidation dossier that maps all 331 archive files across locations, identifying potential duplicates using content hashing (SHA-256) and semantic similarity analysis
- **Reconciliation:** Reconcile overlapping content between `docs/archive/` (MVP specs, monorepo reports) and `Archived/Y26/M03/` (phase reports) by creating unified topic indices that span both locations
- **Adaption:** Adapt `docs/archive-website/` content from static HTML/favicons into a compressed downloadable asset bundle, moving content out of active repository while preserving accessibility
- **Improvement:** Reduce archive location complexity from 4 separate directories to 2 (remote archive repo + local `docs/archive/` for active reference materials), simplifying agent orientation
- **Update:** Update `ARCHIVE_MASTER_DOSSIER.md` to include cross-location index table that maps all 331 files with location codes (A=Archived/, D=docs/archive/, W=docs/archive-website/, L=docs/legacy-archive/)

---

### RECOMMENDATION 3: Implement Automated Document Lifecycle Governance with Staleness Detection

**Description:** While `MONTHLY_CLEANUP_PROTOCOL.md` establishes a manual M-Q1 through M-Q4 cadence, the repository lacks automated staleness detection and proactive archival recommendations. Currently, 46 files in `docs/project/` and multiple `.agents/` phase completion files are candidates for archival but remain in active tiers.

- **Enhancement:** Create automated staleness detection workflow that runs weekly, identifying files with: (a) no modifications in 90+ days, (b) no references from T0/T1 documents, (c) phase-completed status markers
- **Reconciliation:** Reconcile `.doc-tiers.json` with actual file usage patterns by implementing access logging (if not already present) to identify T1 files that are never requested, moving them to T2
- **Adaption:** Adapt the existing `.github/workflows/` infrastructure to include a document-governance.yml workflow that performs automated tier audits and creates archival recommendation PRs
- **Improvement:** Reduce manual monthly cleanup effort by 60% through automation of staleness detection, candidate identification, and PR generation, allowing human review to focus on validation rather than discovery
- **Update:** Update `.agents/PHASE_GATES.md` to include a documentation health gate (Gate 10.1) that requires document staleness score <15% before Phase 10 completion, ensuring ongoing governance

---

### Sub-Agent Scouting Plan (Nested)

Each Phase 2 agent should organize nested sub-agents as follows:

```
Agent A/Agent B
├── Scout-Archive/        → Deep analysis of Archived/ directory structure
├── Scout-Docs/           → Comprehensive docs/ audit
├── Scout-Agents/         → .agents/ file lifecycle review
├── Scout-Root/           → Root-level file validation
└── Scout-Registry/       → .doc-registry.json integrity check
```

**Scout-Archive/ Sub-Agent Tasks:**
- Verify all 144 files are indexed in ARCHIVE_MASTER_DOSSIER.md
- Check for orphaned files (in directory but not in index)
- Validate DOSSIER files are properly consolidated
- Assess migration readiness

**Scout-Docs/ Sub-Agent Tasks:**
- Map all 441 docs/ files by directory
- Identify files >90 days old
- Cross-reference with .doc-tiers.json
- Find unreferenced files

**Scout-Agents/ Sub-Agent Tasks:**
- Review 24 .agents/ .md files
- Identify completed phase files for archival
- Check session-workplans/ for stale plans
- Validate skill files are current

**Scout-Root/ Sub-Agent Tasks:**
- Validate 8 root .md files against .doc-tiers.json manifest
- Identify any new root files not in approved list
- Check for stale files requiring archival

**Scout-Registry/ Sub-Agent Tasks:**
- Validate .doc-registry.json schema
- Check all referenced paths exist
- Verify consolidation file integrity
- Identify broken references
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Archive migration breaks existing references | Low | High | Pre-migration validation script, bidirectional linking |
| Consolidation loses historical context | Low | Medium | Dossier consolidation preserves all content, SHA verification |
| Automation creates false positives | Medium | Low | Human-in-loop PR review, dry-run mode default |
| Sub-agent coordination overhead | Medium | Medium | Clear task boundaries, explicit output formats, time limits |
| Nested agent context overflow | Medium | Medium | 1000-line limit enforcement, focused scopes |

---

## Next Phase Triggers

**Phase 2 Initiation Condition:** This plan document committed to repository  
**Phase 4 Initiation Condition:** All 3 reports compiled and critiqued  
**Phase 6 Initiation Condition:** Final double check complete  
**Phase 7 Initiation Condition:** Fine-tuning integrated and plan finalized

---

## Appendix: Document Inventory Reference

```
Root .md files (8):
├── AGENTS.md                    25,090 bytes    T0
├── ARCHIVE_MASTER_DOSSIER.md    13,398 bytes    T0
├── CLAUDE.md                     8,699 bytes    T0
├── CONTRIBUTING.md               3,588 bytes    T0-equivalent
├── health_report.md                154 bytes    ⚠️ STALE
├── MASTER_PLAN.md               47,550 bytes    T0
├── README.md                    15,235 bytes    T0-equivalent
└── SECURITY.md                   5,532 bytes    T0-equivalent

Archive Distribution:
├── Archived/                     144 files       PRIMARY (pending migration)
├── archive/                       15 files       JOB BOARD (deprecated)
├── docs/archive/                  37 files       SECONDARY
├── docs/archive-website/         138 files       SECONDARY
└── docs/legacy-archive/          12 files       TERTIARY
```

---

*End of Phase 1 — Master Plan Initialization*
