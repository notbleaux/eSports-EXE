[Ver032.000]

# SATOR Repository Migration Plan

## Executive Summary

**Source Repository:** `hvrryh-web/satorXrotas`  
**Target Repository:** `notbleaux/eSports-EXE`  
**Migration Date:** 2026-03-04  
**Status:** Planned → In Progress

---

## Repository Overview Comparison

### satorXrotas (Source)

| Attribute | Details |
|-----------|---------|
| **Owner** | hvrryh-web |
| **Purpose** | Primary development repository with comprehensive documentation |
| **Documentation Level** | Extensive (13 root-level docs) |
| **Deployment Configs** | render.yaml, vercel.json |
| **File Index** | Complete SHA-indexed manifest (file_index.json) |

**Key Characteristics:**
- Acts as the **canonical source** for project documentation
- Contains migration guides and transfer documentation
- More mature CI/CD configuration
- Extensive skill architecture documentation

### eSports-EXE (Target)

| Attribute | Details |
|-----------|---------|
| **Owner** | notbleaux |
| **Purpose** | Production/public-facing repository |
| **Documentation Level** | Minimal (basic README, LICENSE) |
| **Deployment Configs** | Missing |
| **File Index** | None |

**Key Characteristics:**
- Contains same code structure as satorXrotas
- Missing root-level documentation
- Missing deployment configurations
- Needs documentation enrichment

---

## Component Analysis

### Identical Components (No Migration Needed)

These directories have matching SHA checksums between both repos:

| Component | Path | Status |
|-----------|------|--------|
| Simulation Game | `simulation-game/` | ✅ Identical |
| Shared Packages | `shared/packages/` | ✅ Identical |
| Website Structure | `website/` | ✅ Identical (mostly) |
| Axiom Core | `shared/axiom-esports-data/` | ✅ Identical |

### Components Requiring Migration

| Component | Source | Target | Action |
|-----------|--------|--------|--------|
| Root Documentation | 13 files | 2 files | **MIGRATE** |
| Deployment Configs | render.yaml, vercel.json | Missing | **MIGRATE** |
| GitHub Workflows | .github/workflows/ | Basic | **MERGE** |
| Tests | tests/ | Missing | **MIGRATE** |
| VS Code Settings | .vscode/settings.json | Missing | **MIGRATE** |

---

## Legacy & Redundant Data Analysis

### Legacy Data (Move to `/legacy/`)

These files are valuable for historical reference but not part of active codebase:

| File | Reason | Destination |
|------|--------|-------------|
| `CRIT_REPORT.md` | Critical assessment from earlier phase | `legacy/docs/` |
| `DESIGN_GAP_ANALYSIS.md` | Gap analysis document | `legacy/docs/` |
| `REPOSITORY_CHANGES.md` | Historical change log | `legacy/docs/` |
| `REPOSITORY_TRANSFER_GUIDE.md` | Transfer instructions (self-referential) | `legacy/docs/` |
| `SKILL_ARCHITECTURE_ANALYSIS.md` | Skill system planning | `legacy/docs/` |
| `file_index.json` | Snapshot index | `legacy/metadata/` |

### Redundant/Duplicate Data

| Item | Location | Action |
|------|----------|--------|
| `CONTRIBUTING.md` (root) | website/CONTRIBUTING.md exists | Consolidate to root only |
| `LICENSE` (root) | website/LICENSE exists | Keep root only |
| `CHANGELOG.md` (root) | website/CHANGELOG.md exists | Consolidate to root only |

---

## Migration Plan

### Phase 1: Documentation Migration

**Priority: HIGH**

1. **Root-Level Documentation**
   - [ ] AGENTS.md → Root
   - [ ] ARCHITECTURE.md → Root
   - [ ] DEPLOYMENT_ARCHITECTURE.md → Root
   - [ ] DEPLOYMENT_CHECKLIST.md → Root
   - [ ] DESIGN_OVERVIEW.md → Root

2. **Legacy Documentation** (Move to legacy/)
   - [ ] CRIT_REPORT.md → legacy/docs/
   - [ ] DESIGN_GAP_ANALYSIS.md → legacy/docs/
   - [ ] REPOSITORY_CHANGES.md → legacy/docs/
   - [ ] REPOSITORY_TRANSFER_GUIDE.md → legacy/docs/
   - [ ] SKILL_ARCHITECTURE_ANALYSIS.md → legacy/docs/
   - [ ] file_index.json → legacy/metadata/

### Phase 2: Configuration Migration

**Priority: HIGH**

1. **Deployment Configurations**
   - [ ] render.yaml → Root
   - [ ] vercel.json → Root (update if needed)

2. **Development Environment**
   - [ ] .vscode/settings.json → .vscode/

3. **Package Configuration**
   - [ ] Review and merge package.json changes

### Phase 3: Code Integration

**Priority: MEDIUM**

1. **GitHub Workflows**
   - [ ] Compare .github/workflows/ contents
   - [ ] Merge enhanced workflows from satorXrotas

2. **Test Suite**
   - [ ] Migrate tests/integration/ contents

3. **Shared Components**
   - [ ] Verify shared/api/ is complete
   - [ ] Verify shared/apps/ is complete

### Phase 4: Cleanup & Verification

**Priority: MEDIUM**

1. **Deduplication**
   - [ ] Remove duplicate CONTRIBUTING.md from website/
   - [ ] Remove duplicate LICENSE from website/
   - [ ] Remove duplicate CHANGELOG.md from website/

2. **Link Updates**
   - [ ] Update internal documentation links
   - [ ] Verify cross-references work

3. **Final Verification**
   - [ ] Run test suite
   - [ ] Verify build processes
   - [ ] Check deployment configs

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| File overwrites | Low | High | SHA comparison before copy |
| Broken links | Medium | Medium | Link validation script |
| Missing dependencies | Low | High | Dependency audit |
| Configuration conflicts | Medium | High | Staged merge review |

---

## Post-Migration Tasks

1. **Archive satorXrotas**
   - Update README to point to eSports-EXE
   - Mark as archived

2. **Update Skills**
   - Update skill references to new repository

3. **Verify CI/CD**
   - Test GitHub Actions workflows
   - Verify deployment pipelines

---

## Migration Command Reference

```bash
# Create legacy directory structure
mkdir -p legacy/docs legacy/metadata

# Copy documentation (dry run first)
cp -n satorXrotas/AGENTS.md eSports-EXE/
cp -n satorXrotas/ARCHITECTURE.md eSports-EXE/
# ... etc

# Move legacy files
mv satorXrotas/CRIT_REPORT.md eSports-EXE/legacy/docs/
mv satorXrotas/SKILL_ARCHITECTURE_ANALYSIS.md eSports-EXE/legacy/docs/
# ... etc

# Copy deployment configs
cp satorXrotas/render.yaml eSports-EXE/
cp satorXrotas/vercel.json eSports-EXE/
```

---

*Migration Plan Version: 1.0*  
*Created: 2026-03-04*  
*Status: Ready for Execution*
