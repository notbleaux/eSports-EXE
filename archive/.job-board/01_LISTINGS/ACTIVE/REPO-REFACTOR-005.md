# [JLB-LISTING] Repo Structural Refactoring - Phase 5

**ID:** REPO-REFACTOR-005  
**Priority:** P1 - HIGH  
**Status:** PENDING  
**Created:** 2026-03-24  
**Coordinator:** Main Agent  

## Phase 5: Final Validation & Deployment

### Task 5.1: Validate Monorepo Structure
**Assignee:** @coder-build  

**Action:**
Run full validation suite:
```bash
# Clean install
rm -rf node_modules **/node_modules
npm install

# Validate workspaces
npm ls

# Build all packages
turbo run build

# Run tests
turbo run test

# Type check
turbo run typecheck

# Lint
turbo run lint
```

**Acceptance Criteria:**
- [ ] No workspace errors
- [ ] Build passes for all packages
- [ ] Tests pass
- [ ] No TypeScript errors

---

### Task 5.2: Update CI/CD Pipelines
**Assignee:** @coder-devops  
**Files:** `.github/workflows/*.yml`

**Action:**
Update GitHub Actions for new structure:
1. Update working directories
2. Update package names
3. Ensure Turbo caching is enabled
4. Add Vercel deployment step

---

### Task 5.3: Test Vercel Deployment
**Assignee:** @coder-deployment  

**Action:**
Deploy and validate:
```bash
cd apps/web
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

**Acceptance Criteria:**
- [ ] Build succeeds
- [ ] Deploy succeeds
- [ ] Site loads without errors
- [ ] All routes work (/sator, /rotas, /arepo, /opera, /tenet)

---

### Task 5.4: Update Documentation
**Assignee:** @coder-docs  
**Files:**
- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`

**Action:**
Update all docs to reflect new structure:
1. Update directory tree diagrams
2. Update package names
3. Update build/deployment instructions
4. Add migration notes

---

### Task 5.5: Create Migration Guide
**Assignee:** @coder-docs  
**File:** `docs/MIGRATION-v2.1.md`

**Action:**
Document what changed:
- Directory renames
- Package name changes
- Path alias changes
- New build commands

---

## Dependencies
- ALL previous phases complete
- This is the final validation phase

## Success Criteria
- [ ] Site deploys and runs correctly
- [ ] All tests pass
- [ ] Documentation is accurate
- [ ] Team can onboard successfully

## Claim Instructions
1. Use appropriate skills for each task
2. Report blockers immediately
3. Celebrate when done! 🎉
