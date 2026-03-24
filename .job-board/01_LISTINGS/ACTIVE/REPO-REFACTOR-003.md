# [JLB-LISTING] Repo Structural Refactoring - Phase 3

**ID:** REPO-REFACTOR-003  
**Priority:** P2 - MEDIUM  
**Status:** PENDING  
**Created:** 2026-03-24  
**Coordinator:** Main Agent  

## Phase 3: Naming & Version Standardization

### Task 3.1: Standardize Project Name
**Assignee:** @coder-docs  
**Files:** Multiple  

**Issue:** 5+ different names used interchangeably:
- Repository: eSports-EXE
- Package name: sator / libre-x-esport-4njz4-tenet
- Platform: Libre-X-eSport 4NJZ4 TENET Platform
- Former aliases: SATOR-eXe-ROTAS, NJZ Platform, RadiantX

**Action:**
Standardize on scoped npm naming: `@esports-exe/*`

Update package names:
```json
// Root package.json
{
  "name": "@esports-exe/monorepo",
  "version": "2.1.0"
}

// apps/web/package.json
{
  "name": "@esports-exe/web",
  "version": "2.1.0"
}
```

---

### Task 3.2: Fix Document Version Headers
**Assignee:** @coder-docs  
**Files:** 
- `AGENTS.md`
- `README.md`
- `MVP.md`
- `MVP_v2.md`
- Any file with `[VerXXX.XXX]` headers

**Action:**
Standardize versioning approach:
1. Remove `[VerXXX.XXX]` headers OR
2. Make them all reference root package.json version
3. Use semantic versioning consistently

**Acceptance Criteria:**
- [ ] All version headers follow same format
- [ ] Document how versioning works in AGENTS.md

---

### Task 3.3: Fix Inconsistent Hyphenation
**Assignee:** @coder-docs  
**Files:** All documentation

**Issue:** "eSports" vs "esports" vs "e-sports"  
**Standard:** Use "esports" (industry standard, no hyphen, lowercase)

**Action:**
Global find/replace:
- `eSports` → `esports`
- `e-sports` → `esports`
- `E-Sports` → `Esports`

---

### Task 3.4: Define Acronyms
**Assignee:** @coder-docs  
**File:** `AGENTS.md`

**Issue:** "JLB" used 10+ times but never defined

**Action:**
Add acronym definitions section to AGENTS.md:
```markdown
## Acronyms & Terminology

| Acronym | Definition |
|---------|------------|
| JLB | Job Listing Board (AI agent coordination system) |
| 4NJZ4 | "Forever and Never Die" - Platform codename |
| SATOR | Hub 1: The Observatory (data ingestion) |
| ROTAS | Hub 2: The Harmonic Layer (simulation) |
| AREPO | Hub 3: The Directory (services registry) |
| OPERA | Hub 4: The Nexus (ML/AI) |
| TENET | Hub 5: The Center (orchestration) |
```

---

## Dependencies
- Phase 1 and 2 should be complete
- These are documentation-only changes

## Claim Instructions
1. Use skill: `sator-project` for structural docs
2. Create atomic commits with `[JLB-REFACTOR]` prefix
