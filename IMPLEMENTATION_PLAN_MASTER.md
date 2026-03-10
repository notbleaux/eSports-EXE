# IMPLEMENTATION PLAN
## Repository Restructure — Option C (Hybrid)

**Project:** SATOR-eXe-ROTAS Directory Restructure  
**Plan Version:** 1.0.0  
**Date:** March 10, 2026  
**Owner:** Kimi Claw (KIKI)  
**Status:** PLANNING PHASE

---

## SECTION 1: RESEARCH & RESOURCE GATHERING

### 1.1 Pre-Implementation Research Required

Before any file movement, the following research must be completed:

**Research Task 1.1.1: Git Large-Scale Refactoring Best Practices**
- Source: GitHub Docs, Atlassian Git Tutorials
- Scope: How to rename/move 500+ files without losing history
- Deliverable: Safe refactoring checklist

**Research Task 1.1.2: CI/CD Impact Analysis**
- Scope: Identify all GitHub Actions workflows affected by path changes
- Files to audit: `.github/workflows/*.yml`
- Deliverable: Workflow update requirements list

**Research Task 1.1.3: Import Path Mapping**
- Scope: Identify all internal imports/requires that reference old paths
- Languages: JavaScript/TypeScript (import statements), Python (imports)
- Deliverable: Path mapping transformation rules

**Research Task 1.1.4: Rollback Strategy**
- Scope: Define emergency rollback procedure if restructure fails
- Deliverable: Rollback playbook

---

## SECTION 2: MASTER PHASE PLAN

### PHASE 0: PLANNING & SETUP (COMPLETED → IN PROGRESS)
**Status:** Active  
**Duration:** 1 day  
**Owner:** Kimi Claw (Main Agent)

**Tasks:**
- [x] Define directory structure (completed)
- [x] Define file naming convention (completed)
- [ ] Create master plan document (this file)
- [ ] Create Phase 1 Job Board Listing
- [ ] Initialize Phase 1 Asynchronous Agent

**Deliverables:**
- This plan document
- Job Board Listing for Phase 1

---

### PHASE 1: AI GOVERNANCE FRAMEWORK
**Status:** Pending Phase 0 Completion  
**Duration:** 1 day  
**Priority:** Critical  
**Dependencies:** Phase 0 completion report

**Scope:** Create AI governance infrastructure before any structural changes

**Job Board Listing ID:** JLB-2026-0310-001  
**Agent Type:** Asynchronous (Specialist: Governance & Policy)
**Agent ID:** AGENT-AI-GOV-001

**Tasks:**
1. Create `.github/AI_GOVERNANCE.md` with full metadata header
2. Create `.github/AI_AGENT_MANIFEST.md` — capabilities, limitations
3. Create `.github/AI_REVIEW_CHECKLIST.md` — mandatory review items
4. Create `.github/AI_ESCALATION_MATRIX.md` — escalation procedures
5. Create `.github/AI_AUDIT_LOG.md` — template for automated logging
6. Create `.github/CODEOWNERS` — review assignments

**File Naming Convention for this Phase:**
```
[0.POL-SYS|ai-gov]-AIGovernanceFramework-v1.0.0.md
[0.POL-SYS|manifest]-AIAgentManifest-v1.0.0.md
[0.POL-SYS|checklist]-AIReviewChecklist-v1.0.0.md
[0.POL-SYS|escalation]-AIEscalationMatrix-v1.0.0.md
[0.POL-SYS|audit]-AIAuditLog-v0.0.0.md (template)
```

**Completion Criteria:**
- All 5 AI governance files created
- All files have proper headers
- CODEOWNERS file active
- Completion report submitted to Job Board

**Next Phase Trigger:** AGENT-AI-GOV-001 reports COMPLETE

---

### PHASE 2: ROOT AXIOM DOCUMENTS
**Status:** Pending Phase 1 Completion  
**Duration:** 1 day  
**Priority:** Critical  
**Dependencies:** Phase 1 completion report

**Scope:** Create/rename root-level axiom documents with new naming convention

**Job Board Listing ID:** JLB-2026-0310-002  
**Agent Type:** Asynchronous (Specialist: Documentation & Architecture)
**Agent ID:** AGENT-ARCH-002

**Tasks:**
1. Identify all current authoritative documents
2. Rename/move to `0_Axioms/` directory structure
3. Update headers to new format: `[0.ARCH-SYS|...]` or `[0.DES-NJZ|...]` or `[0.POL-SYS|...]`
4. Create index document linking all axioms

**Files to Process (Estimated 15-25):**
- ARCH-* : Architecture documents
- DES-* : Design system documents  
- POL-* : Policy documents

**Completion Criteria:**
- `0_Axioms/` directory exists with subdirectories (ARCH/, DES/, POL/)
- All axiom documents renamed with new convention
- All headers updated
- Index document created
- Completion report submitted

**Next Phase Trigger:** AGENT-ARCH-002 reports COMPLETE

---

### PHASE 3: TENET PLATFORM CORE
**Status:** Pending Phase 2 Completion  
**Duration:** 2 days  
**Priority:** High  
**Dependencies:** Phase 2 completion report

**Scope:** Restructure main platform (website-v2) into TENET hierarchy

**Job Board Listing ID:** JLB-2026-0310-003  
**Agent Type:** Asynchronous (Specialist: Frontend & React)
**Agent ID:** AGENT-FRONTEND-003

**Tasks:**
1. Create `2_Libreaux_NJZ_eXe_[P_TENET]/` directory
2. Create `000-TENET_[TENET]/` subdirectory
3. Create `010-SATOR_[SATOR]/` through `040-OPERA_[OPERA]/` subdirectories
4. Move `apps/website-v2/` contents into appropriate hub directories
5. Update all import paths in JSX/JS files
6. Update `vite.config.js` aliases
7. Rename hub components to new convention
8. Run build test to verify paths work

**Critical Path Files:**
- `apps/website-v2/src/App.jsx` → split/reorganize
- `apps/website-v2/src/shared/` → move to TENET core
- `apps/website-v2/src/hub-1-sator/` → move to `010-SATOR_[SATOR]/`
- `apps/website-v2/src/hub-2-rotas/` → move to `020-ROTAS_[ROTAS]/`
- `apps/website-v2/src/hub-3-arepo/` → move to `030-AREPO_[AREPO]/`
- `apps/website-v2/src/hub-4-opera/` → move to `040-OPERA_[OPERA]/`

**Completion Criteria:**
- All website files moved to new structure
- All imports updated
- Build succeeds (`npm run build`)
- No broken references
- Completion report submitted

**Next Phase Trigger:** AGENT-FRONTEND-003 reports COMPLETE

---

### PHASE 4: NJZ 0X0 DIRECTORY
**Status:** Pending Phase 3 Completion  
**Duration:** 1 day  
**Priority:** Medium  
**Dependencies:** Phase 3 completion report

**Scope:** Create directory service structure

**Job Board Listing ID:** JLB-2026-0310-004  
**Agent Type:** Asynchronous (Specialist: Backend & API)
**Agent ID:** AGENT-BACKEND-004

**Tasks:**
1. Create `1_NJZ_0X0_[P_0x0]/` directory
2. Create subdirectories: `001-Registry/`, `002-Services/`, `003-API/`
3. Move relevant services from `services/exe-directory/` to new structure
4. Update service definitions
5. Create registry index

**Completion Criteria:**
- Directory service structure created
- Services moved and functional
- Registry index complete
- Completion report submitted

**Next Phase Trigger:** AGENT-BACKEND-004 reports COMPLETE

---

### PHASE 5: CROSS-CUTTING & SYSTEM
**Status:** Pending Phase 4 Completion  
**Duration:** 1 day  
**Priority:** Medium  
**Dependencies:** Phase 4 completion report

**Scope:** Restructure remaining directories (Stats, Memory, Archive)

**Job Board Listing ID:** JLB-2026-0310-005  
**Agent Type:** Asynchronous (Specialist: System & DevOps)
**Agent ID:** AGENT-SYS-005

**Tasks:**
1. Create `8_Stats_[STA]/` directory structure
2. Create `9_System_[SYS]/` directory with `900-MEM/` and `999-ARCHIVE/`
3. Move `memory/` contents to `900-MEM/`
4. Move legacy/deprecated docs to `999-ARCHIVE/`
5. Update any remaining references

**Completion Criteria:**
- All remaining directories restructured
- Memory logs moved
- Archive established
- Completion report submitted

**Next Phase Trigger:** AGENT-SYS-005 reports COMPLETE

---

### PHASE 6: WORKFLOW & CI/CD UPDATES
**Status:** Pending Phase 5 Completion  
**Duration:** 1 day  
**Priority:** High  
**Dependencies:** Phase 5 completion report

**Scope:** Update all GitHub Actions workflows for new paths

**Job Board Listing ID:** JLB-2026-0310-006  
**Agent Type:** Asynchronous (Specialist: DevOps & CI/CD)
**Agent ID:** AGENT-DEVOPS-006

**Tasks:**
1. Audit all `.github/workflows/*.yml` files
2. Update path references in workflows
3. Update build commands for new structure
4. Update deployment scripts
5. Test workflow triggers

**Files to Update:**
- `.github/workflows/deploy.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/static.yml`
- `.github/workflows/deploy-archive.yml`

**Completion Criteria:**
- All workflows updated
- CI passes on test branch
- Deployment works end-to-end
- Completion report submitted

**Next Phase Trigger:** AGENT-DEVOPS-006 reports COMPLETE

---

### PHASE 7: VALIDATION & DOCUMENTATION
**Status:** Pending Phase 6 Completion  
**Duration:** 1 day  
**Priority:** Critical  
**Dependencies:** Phase 6 completion report

**Scope:** Final validation, documentation, handover

**Job Board Listing ID:** JLB-2026-0310-007  
**Agent Type:** Asynchronous (Specialist: QA & Documentation)
**Agent ID:** AGENT-QA-007

**Tasks:**
1. Run full test suite
2. Verify all imports resolve
3. Verify build succeeds
4. Verify deployment succeeds
5. Create final structure documentation
6. Create migration guide for future reference
7. Archive this plan

**Completion Criteria:**
- All tests pass
- Build succeeds
- Deployment verified
- Documentation complete
- Project marked COMPLETE

**Final Deliverable:** PROJECT COMPLETION REPORT

---

## SECTION 3: JOB BOARD INTEGRATION

### Job Board Listing Format

Each phase will have a Job Board Listing created in `.job-board/`:

```
.job-board/
├── JLB-2026-0310-001-AI-GOVERNANCE.md      ← Phase 1
├── JLB-2026-0310-002-AXIOM-DOCS.md         ← Phase 2
├── JLB-2026-0310-003-TENET-PLATFORM.md     ← Phase 3
├── JLB-2026-0310-004-0X0-DIRECTORY.md      ← Phase 4
├── JLB-2026-0310-005-SYSTEM-RESTRUCTURE.md ← Phase 5
├── JLB-2026-0310-006-WORKFLOW-UPDATES.md   ← Phase 6
└── JLB-2026-0310-007-VALIDATION.md         ← Phase 7
```

### Asynchronous Agent Spawning Protocol

**RULE: No agent spawned until previous phase completion report is received.**

**Sequence:**
```
Main Agent (Me)
    │
    ├── Create JLB-001
    ├── Spawn AGENT-AI-GOV-001
    │
    └── WAIT for completion report
        │
        ├── Receive COMPLETE
        ├── Create JLB-002
        ├── Spawn AGENT-ARCH-002
        │
        └── WAIT for completion report
            │
            ├── Receive COMPLETE
            ├── Create JLB-003
            ├── Spawn AGENT-FRONTEND-003
            │
            └── ... (continues through Phase 7)
```

### Completion Report Template

Each agent must submit:

```markdown
# COMPLETION REPORT
**Agent ID:** [ID]
**Job Board Listing:** [JLB-XXXX]
**Phase:** [Number]
**Status:** COMPLETE / PARTIAL / FAILED
**Date:** YYYY-MM-DD

## Completed Tasks
- [x] Task 1
- [x] Task 2
...

## Issues Encountered
1. [Description and resolution]

## Files Created/Modified
- path/to/file1
- path/to/file2

## Verification
- [ ] Build passes
- [ ] Tests pass
- [ ] Manual inspection complete

## Next Phase Notes
[Any information needed for next agent]

## Sign-off
Agent: [Name]
Confidence: [High/Medium/Low]
```

---

## SECTION 4: CONTINUOUS MONITORING

### Until Completion, Main Agent Responsibilities:

1. **Monitor Job Board** — Check for completion reports every heartbeat
2. **Validate Reports** — Verify completion criteria met before spawning next agent
3. **Update Job Board** — Mark listings as IN_PROGRESS / COMPLETE / BLOCKED
4. **Escalation** — If agent fails, determine retry or intervention
5. **Documentation** — Update this plan with actual progress
6. **Coordination** — Ensure agents don't conflict (sequential only)

### Communication Protocol

**Agent → Main:**
- Completion report via Job Board Listing update
- Blockers reported immediately
- Questions via sessions_send or Job Board comments

**Main → Agent:**
- Spawn instruction via sessions_spawn
- Clarification via sessions_send
- Steering via subagents(action=steer) if needed

---

## SECTION 5: RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Agent fails mid-phase | Retry once, then escalate to human |
| Import paths broken | Phase 3 includes full build verification |
| CI/CD breaks | Phase 6 dedicated to workflow fixes |
| Merge conflicts | Work on feature branch, merge at end |
| Scope creep | Strict phase boundaries, new items → new phase |

---

## SECTION 6: APPROVAL

**Plan Status:** READY FOR APPROVAL

**Approved By:** _________________ (Eli)
**Date:** _________________

**Upon Approval, First Action:**
1. Create Job Board Listing JLB-2026-0310-001
2. Spawn AGENT-AI-GOV-001
3. Begin Phase 1

---

*Plan Version: 1.0.0*  
*Last Updated: 2026-03-10*  
*Next Review: Upon Phase 1 completion*
