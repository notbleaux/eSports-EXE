# COMPREHENSIVE PROCEDURE: LEGACY REDESIGN + FOLLOW-UPS
## Priority B Execution with Integrated Follow-up Tasks

**Procedure ID:** PROC-COMPREHENSIVE-001  
**Version:** [Ver001.000]  
**Date:** March 9, 2026  
**Status:** APPROVED — EXECUTING  
**Authorization:** User approved with follow-up requirements

---

## 🎯 SCOPE INTEGRATION

### Primary Mission: Legacy Redesign (Priority B)
Transform `hvrryh-web/satorXrotas` into "Gilded Legacy Repository"

### Integrated Follow-Up Tasks (User Required):
| # | Task | Scope | Agent Assignment |
|---|------|-------|------------------|
| 1 | Archive legacy-repo/ | 30+ obsolete files | Documentation Curator |
| 2 | Fix broken links in archive-website | 5+ broken links | Frontend Validator |
| 3 | Consolidate duplicate /shared/ directories | 100+ duplicate files | Build Verification |
| 4 | Continue version headers | 632 remaining files | CodeQL Specialist |

---

## 📋 PHASE 1: LEGACY REDESIGN (3 PASSES)

### PASS 1: INVESTIGATION (15 minutes)
**Agent:** Async-Subagent-1  
**Scope:**
- Inventory hvrryh-web/satorXrotas repository
- Document current structure vs. desired "Gilded Legacy" state
- Identify files worth preserving vs. archiving
- Create transformation roadmap

**Deliverable:** `SITREP-004-LEGACY-INVESTIGATION.md`

---

### PASS 2: STRUCTURE DESIGN (15 minutes)
**Agent:** Async-Subagent-1  
**Scope:**
- Design new "Gilded Legacy" repository structure
- Create versioning system for legacy content
- Define archival framework and methods
- Design honorific presentation (archival with dignity)

**Deliverable:** `SITREP-005-LEGACY-STRUCTURE.md`

---

### PASS 3: IMPLEMENTATION (15 minutes)
**Agent:** Async-Subagent-1  
**Scope:**
- Implement new structure
- Add version headers to legacy files
- Create archival documentation
- Finalize "Gilded Legacy" presentation

**Deliverable:** `SITREP-006-LEGACY-IMPLEMENTATION.md`

---

## 📋 PHASE 2: FOLLOW-UP TASKS (PARALLEL)

### TASK-F1: Archive legacy-repo/ (30+ files)
**Agent:** Documentation Curator (from Priority D team)  
**Scope:**
- Identify 30+ obsolete files in legacy-repo/
- Move to 05-ARCHIVE/ directory
- Add [ARCHIVED] headers
- Create ARCHIVE_INDEX.md

**Deliverable:** `logs/F1-LEGACY-ARCHIVE-COMPLETE.md`

**Files to Process:**
```
legacy-repo/
├── old-website/
├── deprecated-api/
├── prototype-v1/
└── (identify all obsolete)
```

---

### TASK-F2: Fix Broken Links (5+ in archive-website)
**Agent:** Frontend Validator (from Priority D team)  
**Scope:**
- Scan archive-website/README.md
- Identify 5+ broken internal links
- Fix or replace with working equivalents
- Verify all external links functional

**Deliverable:** `logs/F2-BROKEN-LINKS-FIXED.md`

**Link Audit:**
```
/README.md:
- [ ] Link to /docs/ → verify
- [ ] Link to /api/ → verify  
- [ ] External dependencies → verify
- [ ] Image references → verify
- [ ] Style imports → verify
```

---

### TASK-F3: Consolidate /shared/ Directories
**Agent:** Build Verification (from Priority D team)  
**Scope:**
- Identify 100+ duplicate files across /shared/ directories
- Map consolidation strategy
- Merge duplicates keeping newest versions
- Update all import paths
- Verify builds still work

**Deliverable:** `logs/F3-SHARED-CONSOLIDATED.md`

**Duplicate Patterns:**
```
/shared/
├── components/ (appears in 3 locations)
├── styles/ (appears in 4 locations)
├── utils/ (appears in 2 locations)
└── hooks/ (appears in 3 locations)
```

---

### TASK-F4: Version Headers (632 files)
**Agent:** CodeQL Specialist (from Priority D team)  
**Scope:**
- Batch add [VerMMM.mmm] headers to 632 remaining files
- Prioritize: Core docs → Component files → Config files
- Use automated script approach
- Track progress in batches of 50

**Deliverable:** `logs/F4-VERSION-HEADERS-ADDED.md`

**Batch Plan:**
```
Batch 1-10: Core documentation (500 files)
Batch 11-13: Remaining files (132 files)
Total: 632 files → target 100% compliance
```

---

## 🔄 EXECUTION SEQUENCE

```
PHASE 1: LEGACY REDESIGN (45 min)
├── Pass 1: Investigation ──────────── 15 min
├── Pass 2: Structure Design ───────── 15 min  
└── Pass 3: Implementation ─────────── 15 min

PHASE 2: FOLLOW-UPS (45 min, parallel)
├── F1: Archive legacy-repo/ ───────── 20 min
├── F2: Fix broken links ───────────── 10 min
├── F3: Consolidate /shared/ ───────── 30 min
└── F4: Version headers (632 files) ── 45 min

PHASE 3: SYNTHESIS (15 min)
├── Compile all deliverables
├── Update Job Listing Board
├── Create COMPLETION_REPORT.md
└── Prepare for Vercel 3-pass review

TOTAL TIME: ~105 minutes (~1.75 hours)
```

---

## 👥 AGENT ALLOCATION

### Primary Agent
| Agent | Task | Duration |
|-------|------|----------|
| **Async-Subagent-1** | Legacy Redesign (3 passes) | 45 min |

### Follow-Up Task Force (from Priority D)
| Agent | Task | Duration |
|-------|------|----------|
| **Documentation Curator** | F1: Archive legacy-repo/ | 20 min |
| **Frontend Validator** | F2: Fix broken links | 10 min |
| **Build Verification** | F3: Consolidate /shared/ | 30 min |
| **CodeQL Specialist** | F4: Version headers | 45 min |

### Coordination
| Role | Responsibility |
|------|----------------|
| **Foreman (me)** | Overall coordination, synthesis, final report |

**Total Agents:** 5 concurrent (within 8-agent limit) ✓

---

## 📁 DELIVERABLE STRUCTURE

```
/legacy-redesign/
├── SITREP-004-LEGACY-INVESTIGATION.md
├── SITREP-005-LEGACY-STRUCTURE.md
├── SITREP-006-LEGACY-IMPLEMENTATION.md
└── LEGACY-GILDED-REPOSITORY.md (final spec)

/logs/
├── F1-LEGACY-ARCHIVE-COMPLETE.md
├── F2-BROKEN-LINKS-FIXED.md
├── F3-SHARED-CONSOLIDATED.md
├── F4-VERSION-HEADERS-ADDED.md
└── COMPLETION_REPORT.md (Foreman synthesis)

/05-ARCHIVE/ (new directory)
├── ARCHIVE_INDEX.md
└── legacy-repo/ (moved contents)
```

---

## ✅ SUCCESS CRITERIA

### Legacy Redesign
- [ ] Gilded Legacy repository structure defined
- [ ] Versioning system implemented
- [ ] Archival framework documented
- [ ] Honorific presentation complete

### Follow-Up Tasks
- [ ] 30+ files archived from legacy-repo/
- [ ] 5+ broken links fixed in archive-website
- [ ] 100+ duplicates consolidated in /shared/
- [ ] 632 files versioned (100% compliance)

### Overall
- [ ] All 5 agents report complete
- [ ] Foreman synthesis delivered
- [ ] Job Listing Board updated
- [ ] Ready for Vercel 3-pass review

---

## 🎬 SPAWN AUTHORIZATION

**User Approval:** ✅ CONFIRMED  
**Scope:** Legacy Redesign + 4 Follow-up tasks  
**Agents:** 5 concurrent  
**Timeline:** ~105 minutes  
**Authorization:** Full codebase modification approved

**Ready to spawn all 5 agents?**

**YES/NO/Modify?**

---

*Procedure version: [Ver001.000]*  
*Awaiting final spawn confirmation*