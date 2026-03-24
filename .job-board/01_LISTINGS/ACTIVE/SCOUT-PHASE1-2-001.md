# [JLB-LISTING] Scout Pass: Verify Phases 1 & 2 Implementation

**ID:** SCOUT-PHASE1-2-001  
**Type:** Read-Only Scout Mission  
**Priority:** P0 - VERIFICATION  
**Status:** ACTIVE  
**Created:** 2026-03-24  
**Foreman:** Main Agent  

## Mission Objective
Conduct read-only reconnaissance to verify Phases 1 & 2 structural changes were implemented correctly. Identify specific line/file errors, inconsistencies, and gaps.

## Scout Teams

### Team Alpha: Workspace & Package Verification
**Lead:** @coder-structural-scout  
**Focus:** Root configuration files

**Checklist:**
- [ ] Root `package.json` - verify workspaces array
- [ ] Root `package.json` - verify version is 2.1.0
- [ ] Root `turbo.json` - verify task names match new package names
- [ ] Root `package.json` - verify npm overrides for scheduler
- [ ] Verify `apps/web/package.json` - name is `@esports-exe/web`
- [ ] Verify `apps/web/package.json` - version is 2.1.0
- [ ] Check for any remaining `website-v2` references in root configs

**Deliverable:** Scout report with line numbers of any issues found

---

### Team Bravo: CI/CD & Deployment Verification
**Lead:** @coder-devops-scout  
**Focus:** GitHub Actions and Vercel configs

**Checklist:**
- [ ] `.github/workflows/ci.yml` - verify all paths use `apps/web/`
- [ ] `.github/workflows/static.yml` - verify paths
- [ ] `.github/workflows/vercel-deploy.yml` - verify paths
- [ ] `apps/web/vercel.json` - verify buildCommand uses `@esports-exe/web`
- [ ] Check for any `website-v2` references in workflow files
- [ ] Verify docker-compose.yml paths

**Deliverable:** Scout report with line numbers of any issues found

---

### Team Charlie: Import Path Verification
**Lead:** @coder-frontend-scout  
**Focus:** Source code imports and references

**Checklist:**
- [ ] Search for any `website-v2` string references in `apps/web/src/`
- [ ] Check if any files import from old paths
- [ ] Verify vite.config.js path aliases still work
- [ ] Check tsconfig.json paths
- [ ] Look for any hardcoded paths in scripts

**Deliverable:** Scout report with file paths and line numbers of any issues

---

### Team Delta: Docker CRIT Integration Review
**Lead:** @coder-integration-scout  
**Focus:** Cross-reference with Docker CRIT findings

**Checklist:**
- [ ] Review `CRIT_MONOREPO_OVERVIEW_2026-03-23.md` for Phase 1-2 relevant items
- [ ] Check if any items from Docker CRIT were missed in Phases 1-2
- [ ] Identify which Docker CRIT items should be added to Phase 1-2 completion
- [ ] Cross-reference TypeScript errors with structural changes

**Deliverable:** Integration report mapping Docker CRIT to our phases

---

## Scout Methodology

1. **READ-ONLY** - No edits during scout phase
2. **Use grep/search** to find patterns
3. **Document line numbers** for all findings
4. **Categorize severity:**
   - 🔴 BLOCKER - Breaks build/deploy
   - 🟡 WARNING - Should fix but not blocking
   - 🟢 INFO - Observation, no action needed

## Report Format

```markdown
## Scout Report: [Team Name]

### Findings

#### 🔴 BLOCKER: [Issue Title]
- **File:** `path/to/file`
- **Line:** XX
- **Current:** `what's there`
- **Expected:** `what should be there`
- **Impact:** Why this is a problem

#### 🟡 WARNING: [Issue Title]
- **File:** `path/to/file`
- **Line:** XX
- **Issue:** Description

### Summary
- Blockers: X
- Warnings: X
- Status: [READY FOR ACTION PASS | NEEDS REVIEW]
```

## Timeline
- **Scout Pass Duration:** 30 minutes per team
- **Report Deadline:** ASAP
- **Foreman Review:** Upon receipt of all reports

## Coordination
Post reports in `.job-board/02_CLAIMED/{team-lead}/scout-report.md`
