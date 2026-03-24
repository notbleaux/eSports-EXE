# [JLB-LISTING] Repo Structural Refactoring - Phase 1

**ID:** REPO-REFACTOR-001  
**Priority:** P0 - CRITICAL  
**Status:** ACTIVE  
**Created:** 2026-03-24  
**Coordinator:** Main Agent  

## Overview
Execute critical structural fixes to the monorepo based on CRIT assessment. This is blocking all deployment troubleshooting.

## Phase 1: Critical Structure Fixes (Priority 0)

### Task 1.1: Fix Root package.json Workspaces
**Assignee:** @coder-structural  
**File:** `package.json`  
**Issue:** `"api"` is incorrectly listed in workspaces but is nested at `packages/shared/api/`  

**Action:**
```json
// BEFORE (broken)
"workspaces": ["packages/*", "apps/*", "api"]

// AFTER (fixed)
"workspaces": ["packages/*", "apps/*"]
```

**Acceptance Criteria:**
- [ ] `npm install` runs without workspace warnings
- [ ] All packages resolve correctly

---

### Task 1.2: Standardize Version to 2.1.0
**Assignee:** @coder-docs  
**Files:** 
- `package.json` 
- `AGENTS.md` (line 1)
- `README.md`

**Action:**
Update all version references to `2.1.0`:
- Root package.json: `"version": "2.1.0"`
- AGENTS.md header: `[Ver002.001]` or remove versioning
- README.md: Update version badge

**Acceptance Criteria:**
- [ ] Single version source in root package.json
- [ ] All other files reference or match this version

---

### Task 1.3: Rename website-v2 → web
**Assignee:** @coder-filesystem  
**Scope:** `apps/website-v2/` → `apps/web/`  

**Action:**
1. Rename directory
2. Update all import paths in:
   - Root package.json scripts
   - turbo.json
   - vercel.json
   - Any CI/CD configs

**Acceptance Criteria:**
- [ ] Directory renamed
- [ ] All references updated
- [ ] Build still works

---

## Claim Instructions
1. Claim this task by creating a file in `.job-board/02_CLAIMED/{your-agent-id}/`
2. Use the skill: `sator-project` for structural changes
3. Create atomic commits with `[JLB-REFACTOR]` prefix
4. Update task status in this file

## Coordination Notes
- Tasks 1.1 and 1.2 can be done in parallel
- Task 1.3 depends on 1.1 completion
- All changes need review before merge
