# [JLB-LISTING] Repo Structural Refactoring - Phase 4

**ID:** REPO-REFACTOR-004  
**Priority:** P2 - MEDIUM  
**Status:** PENDING  
**Created:** 2026-03-24  
**Coordinator:** Main Agent  

## Phase 4: Code Organization & Cleanup

### Task 4.1: Archive Legacy Website
**Assignee:** @coder-filesystem  
**Scope:** `apps/website/` (if exists)  

**Action:**
If `apps/website/` exists (legacy version):
1. Move to `archive/legacy-website/`
2. Add README explaining it's archived
3. Remove from workspaces

**Acceptance Criteria:**
- [ ] Legacy code archived
- [ ] No duplicate website code

---

### Task 4.2: Flatten packages/shared/ Structure
**Assignee:** @coder-structural  
**Scope:** `packages/shared/`  

**Issue:** Currently has nested `packages/shared/packages/` (confusing)

**Action:**
Flatten structure:
```
BEFORE:
packages/shared/
  ├── packages/
  │   ├── data-partition-lib/
  │   └── stats-schema/
  ├── api/
  └── axiom-esports-data/

AFTER:
packages/
  ├── api/
  ├── data-pipeline/          (was axiom-esports-data)
  ├── data-partition/         (moved from shared/packages/)
  └── stats-schema/           (moved from shared/packages/)
```

**Acceptance Criteria:**
- [ ] No nested packages/ directory
- [ ] All imports updated
- [ ] Build passes

---

### Task 4.3: Simplify Path Aliases
**Assignee:** @coder-frontend  
**Files:**
- `apps/web/tsconfig.json`
- `apps/web/vite.config.js`

**Issue:** 7 path aliases causing cognitive overload

**Action:**
Simplify from 7 aliases to 3:
```json
// BEFORE (complex)
{
  "@/*": ["src/*"],
  "@shared/*": ["src/shared/*"],
  "@hub-1/*": ["src/hub-1-sator/*"],
  "@hub-2/*": ["src/hub-2-rotas/*"],
  "@hub-3/*": ["src/hub-3-arepo/*"],
  "@hub-4/*": ["src/hub-4-opera/*"],
  "@hub-5/*": ["src/hub-5-tenet/*"]
}

// AFTER (simple)
{
  "@/*": ["./src/*"],
  "@hubs/*": ["./src/hubs/*"]
}
```

**Note:** This requires updating all import statements!

---

### Task 4.4: Consolidate Animation Libraries
**Assignee:** @coder-frontend  
**File:** `apps/web/package.json`

**Issue:** Using both Framer Motion AND GSAP

**Action:**
1. Audit which components use GSAP
2. Migrate to Framer Motion
3. Remove GSAP dependency

**Decision:** Use Framer Motion exclusively (more React-native)

---

### Task 4.5: Fix Environment Variable Prefixing
**Assignee:** @coder-frontend  
**Files:** All Vite config and env files

**Issue:** Mix of `VITE_` and unprefixed variables

**Action:**
Standardize on `VITE_` prefix for all frontend-exposed variables:
- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_APP_ENV`
- `VITE_ANALYTICS_ID`

Update `.env.example` and documentation.

---

## Dependencies
- Phase 1-3 complete
- Task 4.1 should be done first

## Claim Instructions
1. Use skill: `sator-react-frontend` for path alias work
2. Use skill: `sator-project` for structural changes
3. Create atomic commits with `[JLB-REFACTOR]` prefix
