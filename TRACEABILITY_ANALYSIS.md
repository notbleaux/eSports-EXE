# TRACEABILITY ANALYSIS & VERIFICATION CHECKLIST
## Repository Restructure — Path Dependency Mapping

**Analysis Date:** March 10, 2026  
**Scope:** Full repository path dependency audit  
**Status:** PRE-IMPLEMENTATION  
**Analyst:** Kimi Claw (Main Agent)

---

## SECTION 1: FILE COUNT SUMMARY

| Category | Count | Notes |
|----------|-------|-------|
| **Total Files** | 10,446 | Excluding node_modules, .git |
| **JavaScript/JSX** | ~1,200 | Primary concern for imports |
| **TypeScript/TSX** | ~150 | Import path dependencies |
| **JSON Configs** | ~300 | Path references |
| **YAML Workflows** | ~25 | CI/CD path dependencies |
| **Markdown Docs** | ~8,000 | Cross-references |

---

## SECTION 2: PATH DEPENDENCY MAP

### 2.1 WORKFLOW DEPENDENCIES (Critical)

| Workflow File | Current Path Reference | Impact Level | New Path After Restructure |
|---------------|------------------------|--------------|---------------------------|
| `.github/workflows/deploy.yml` | `cd website && npm ci` | **CRITICAL** | `cd 2_Libreaux_NJZ_eXe_[P_TENET]/000-TENET_[TENET] && npm ci` |
| `.github/workflows/deploy.yml` | `path: './website'` | **CRITICAL** | `path: './2_Libreaux_NJZ_eXe_[P_TENET]/dist'` |
| `.github/workflows/ci.yml` | `packages/shared/requirements.txt` | **HIGH** | `packages/shared/requirements.txt` (unchanged) |
| `.github/workflows/ci.yml` | `pytest packages/shared/` | **HIGH** | Unchanged |
| `.github/workflows/ci.yml` | `npm ci` (root) | **HIGH** | May need adjustment for workspace |
| `vercel.json` | `cd apps/website-v2` | **CRITICAL** | `cd 2_Libreaux_NJZ_eXe_[P_TENET]/000-TENET_[TENET]` |
| `vercel.json` | `apps/website-v2/dist` | **CRITICAL** | `2_Libreaux_NJZ_eXe_[P_TENET]/000-TENET_[TENET]/dist` |

**Workflow Update Count:** 5 files minimum

---

### 2.2 VITE CONFIGURATION DEPENDENCIES (Critical)

**File:** `apps/website-v2/vite.config.js`

| Alias | Current Path | New Path | Status |
|-------|--------------|----------|--------|
| `@` | `./src` | `./2_Libreaux_NJZ_eXe_[P_TENET]/000-TENET_[TENET]/src` | **MUST UPDATE** |
| `@shared` | `./src/shared` | `./2_Libreaux_NJZ_eXe_[P_TENET]/000-TENET_[TENET]/src/shared` | **MUST UPDATE** |
| `@hub-1` | `./src/hub-1-sator` | `./2_Libreaux_NJZ_eXe_[P_TENET]/010-SATOR_[SATOR]` | **MUST UPDATE** |
| `@hub-2` | `./src/hub-2-rotas` | `./2_Libreaux_NJZ_eXe_[P_TENET]/020-ROTAS_[ROTAS]` | **MUST UPDATE** |
| `@hub-3` | `./src/hub-3-arepo` | `./2_Libreaux_NJZ_eXe_[P_TENET]/030-AREPO_[AREPO]` | **MUST UPDATE** |
| `@hub-4` | `./src/hub-4-opera` | `./2_Libreaux_NJZ_eXe_[P_TENET]/040-OPERA_[OPERA]` | **MUST UPDATE** |
| `base` | `/eSports-EXE/platform/` | Unchanged | Keep as-is |
| `outDir` | `dist` | `dist` | Keep as-is |

**Vite Config Update:** REQUIRED before any file moves

---

### 2.3 IMPORT DEPENDENCIES — JavaScript/JSX (High)

**Source Directory:** `apps/website-v2/src/`

| Importing File | Import Statement | Target File | New Location After Move |
|----------------|------------------|-------------|------------------------|
| `App.jsx` | `from './hub-3-arepo/ArepoHub'` | `ArepoHub.jsx` | `030-AREPO_[AREPO]/ArepoHub.jsx` |
| `App.jsx` | `from './hub-4-opera/OperaHub'` | `OperaHub.jsx` | `040-OPERA_[OPERA]/OperaHub.jsx` |
| `App.jsx` | `from './hub-2-rotas/ROTASHub'` | `ROTASHub.jsx` | `020-ROTAS_[ROTAS]/ROTASHub.jsx` |
| `App.jsx` | `from './hub-1-sator/SATORHub'` | `SATORHub.jsx` | `010-SATOR_[SATOR]/SATORHub.jsx` |
| `App.jsx` | `from './shared/components/*'` | Multiple | `000-TENET_[TENET]/src/shared/components/*` |
| `App.jsx` | `from './shared/store/njzStore'` | `njzStore.js` | `000-TENET_[TENET]/src/shared/store/njzStore.js` |
| `hub-1-sator/SATORHub.jsx` | `from '../shared/components/HubWrapper'` | `HubWrapper.jsx` | `000-TENET_[TENET]/src/shared/components/HubWrapper.jsx` |
| `hub-1-sator/SATORHub.jsx` | `from '../shared/store/njzStore'` | `njzStore.js` | `000-TENET_[TENET]/src/shared/store/njzStore.js` |
| `hub-2-rotas/ROTASHub.jsx` | `from '../shared/components/HubWrapper'` | `HubWrapper.jsx` | `000-TENET_[TENET]/src/shared/components/HubWrapper.jsx` |
| `hub-3-arepo/ArepoHub.jsx` | `from '../shared/components/HubWrapper'` | `HubWrapper.jsx` | `000-TENET_[TENET]/src/shared/components/HubWrapper.jsx` |
| `hub-4-opera/OperaHub.jsx` | `from '../shared/components/HubWrapper'` | `HubWrapper.jsx` | `000-TENET_[TENET]/src/shared/components/HubWrapper.jsx` |

**Total Import Updates Required:** ~30 import statements across 10+ files

---

### 2.4 DOCUMENTATION REFERENCES (Medium)

**Files with path references that need updating:**

| File | References | Update Required |
|------|------------|-----------------|
| `README.md` | `apps/website-v2/`, `packages/shared/vlr-data/` | **YES** |
| `CONTRIBUTING.md` | `apps/`, `packages/` structure | **YES** |
| `DEPLOYMENT_WORKFLOW.md` | `apps/website-v2` (multiple) | **YES** |
| `docs/guides/AI_COLLABORATION.md` | `packages/shared/vlr-data/` | **YES** |
| `IMPLEMENTATION_PLAN_MASTER.md` | `apps/website-v2` (multiple) | **YES** (ironic) |

**Documentation Update Count:** 5+ files

---

### 2.5 CONFIGURATION FILES (Medium)

| File | Path References | Impact |
|------|-----------------|--------|
| `package.json` (root) | workspaces: `packages/*`, `apps/*` | **MAY NEED UPDATE** |
| `vercel.json` | `apps/website-v2` (3 references) | **MUST UPDATE** |
| `apps/website-v2/package.json` | Internal structure | May need updates |
| `apps/website-v2/index.html` | Entry point reference | Likely unchanged |

---

## SECTION 3: TRANSFORMATION RULES

### 3.1 Path Mapping (Old → New)

```
OLD STRUCTURE                              NEW STRUCTURE
────────────────────────────────────────────────────────────────
apps/
├── website-v2/                            2_Libreaux_NJZ_eXe_[P_TENET]/
│   ├── src/                               ├── 000-TENET_[TENET]/
│   │   ├── shared/                        │   ├── src/
│   │   │   ├── components/                │   │   ├── shared/
│   │   │   ├── store/                     │   │   │   ├── components/
│   │   │   └── ...                        │   │   │   ├── store/
│   │   ├── hub-1-sator/                   │   │   │   └── ...
│   │   ├── hub-2-rotas/                   │   ├── 010-SATOR_[SATOR]/
│   │   ├── hub-3-arepo/                   │   ├── 020-ROTAS_[ROTAS]/
│   │   ├── hub-4-opera/                   │   ├── 030-AREPO_[AREPO]/
│   │   ├── App.jsx                        │   ├── 040-OPERA_[OPERA]/
│   │   └── main.jsx                       │   ├── App.jsx
│   ├── package.json                       │   ├── main.jsx
│   ├── vite.config.js                     │   ├── package.json
│   └── index.html                         │   ├── vite.config.js
                                            │   └── index.html
                                            ├── 8_Stats_[STA]/
                                            └── 9_System_[SYS]/
```

### 3.2 Import Path Transformations

| Pattern | Old Import | New Import |
|---------|------------|------------|
| Relative up + shared | `from '../shared/components/X'` | `from '../../000-TENET_[TENET]/src/shared/components/X'` |
| Hub component | `from './hub-1-sator/SATORHub'` | `from '../010-SATOR_[SATOR]/SATORHub'` |
| Shared store | `from '../shared/store/njzStore'` | `from '../../000-TENET_[TENET]/src/shared/store/njzStore'` |
| Vite alias @shared | `@shared/components/X` | `@shared/components/X` (update vite.config) |
| Vite alias @hub-1 | `@hub-1/SATORHub` | `@hub-1/SATORHub` (update vite.config path) |

---

## SECTION 4: VERIFICATION CHECKLIST

### PHASE 0: PRE-IMPLEMENTATION CHECKLIST

**Before any file moves, verify:**

- [ ] 4.1.1 All import dependencies mapped (Section 2.3 complete)
- [ ] 4.1.2 All workflow dependencies identified (Section 2.1 complete)
- [ ] 4.1.3 All config dependencies documented (Section 2.5 complete)
- [ ] 4.1.4 Transformation rules defined (Section 3 complete)
- [ ] 4.1.5 Backup/rollback strategy prepared
- [ ] 4.1.6 Feature branch created for restructure
- [ ] 4.1.7 Team/human notified of pending changes

### PHASE 1: CONFIGURATION UPDATES (FIRST)

**Before moving any files:**

- [ ] 4.2.1 Update `vite.config.js` with new alias paths
- [ ] 4.2.2 Update `vercel.json` with new build paths
- [ ] 4.2.3 Update `.github/workflows/deploy.yml` paths
- [ ] 4.2.4 Update `.github/workflows/ci.yml` paths (if needed)
- [ ] 4.2.5 Verify configs in place (don't commit yet)

### PHASE 2: DIRECTORY CREATION

- [ ] 4.3.1 Create `0_Axioms/` directory structure
- [ ] 4.3.2 Create `1_NJZ_0X0_[P_0x0]/` directory structure
- [ ] 4.3.3 Create `2_Libreaux_NJZ_eXe_[P_TENET]/` directory structure
- [ ] 4.3.4 Create `2_Libreaux_NJZ_eXe_[P_TENET]/000-TENET_[TENET]/src/`
- [ ] 4.3.5 Create `2_Libreaux_NJZ_eXe_[P_TENET]/010-SATOR_[SATOR]/`
- [ ] 4.3.6 Create `2_Libreaux_NJZ_eXe_[P_TENET]/020-ROTAS_[ROTAS]/`
- [ ] 4.3.7 Create `2_Libreaux_NJZ_eXe_[P_TENET]/030-AREPO_[AREPO]/`
- [ ] 4.3.8 Create `2_Libreaux_NJZ_eXe_[P_TENET]/040-OPERA_[OPERA]/`
- [ ] 4.3.9 Create `8_Stats_[STA]/` directory
- [ ] 4.3.10 Create `9_System_[SYS]/` directory

### PHASE 3: FILE MIGRATION (ORDERED)

**Order matters — migrate in this sequence:**

- [ ] 4.4.1 Move `src/shared/` → `000-TENET_[TENET]/src/shared/`
- [ ] 4.4.2 Move `src/App.jsx` → `000-TENET_[TENET]/src/App.jsx`
- [ ] 4.4.3 Move `src/main.jsx` → `000-TENET_[TENET]/src/main.jsx`
- [ ] 4.4.4 Move `hub-1-sator/` → `010-SATOR_[SATOR]/`
- [ ] 4.4.5 Move `hub-2-rotas/` → `020-ROTAS_[ROTAS]/`
- [ ] 4.4.6 Move `hub-3-arepo/` → `030-AREPO_[AREPO]/`
- [ ] 4.4.7 Move `hub-4-opera/` → `040-OPERA_[OPERA]/`
- [ ] 4.4.8 Move `package.json` → `000-TENET_[TENET]/package.json`
- [ ] 4.4.9 Move `vite.config.js` → `000-TENET_[TENET]/vite.config.js`
- [ ] 4.4.10 Move `index.html` → `000-TENET_[TENET]/index.html`
- [ ] 4.4.11 Move config files (postcss.config.js, tailwind.config.js, etc.)

### PHASE 4: IMPORT PATH UPDATES

- [ ] 4.5.1 Update imports in `App.jsx` (hub references)
- [ ] 4.5.2 Update imports in `SATORHub.jsx` (shared references)
- [ ] 4.5.3 Update imports in `ROTASHub.jsx` (shared references)
- [ ] 4.5.4 Update imports in `ArepoHub.jsx` (shared references)
- [ ] 4.5.5 Update imports in `OperaHub.jsx` (shared references)
- [ ] 4.5.6 Verify all `../shared/` → `../../000-TENET_[TENET]/src/shared/`
- [ ] 4.5.7 Run grep to verify no broken imports remain

### PHASE 5: BUILD VERIFICATION

- [ ] 4.6.1 `cd 2_Libreaux_NJZ_eXe_[P_TENET]/000-TENET_[TENET] && npm install`
- [ ] 4.6.2 `npm run build` — **MUST PASS**
- [ ] 4.6.3 Verify no import errors in build output
- [ ] 4.6.4 Check `dist/` folder created with expected contents

### PHASE 6: WORKFLOW VERIFICATION

- [ ] 4.7.1 Verify updated workflow files syntax
- [ ] 4.7.2 Test workflow on feature branch
- [ ] 4.7.3 Verify deployment paths work

### PHASE 7: DOCUMENTATION UPDATES

- [ ] 4.8.1 Update `README.md` with new paths
- [ ] 4.8.2 Update `CONTRIBUTING.md` with new structure
- [ ] 4.8.3 Update any docs referencing old paths

### PHASE 8: FINAL VERIFICATION

- [ ] 4.9.1 Full text search for old paths (`apps/website-v2`)
- [ ] 4.9.2 Full text search for old hub paths (`hub-1-sator`)
- [ ] 4.9.3 Verify no references remain
- [ ] 4.9.4 Commit all changes with descriptive message
- [ ] 4.9.5 Push to feature branch
- [ ] 4.9.6 Create PR for review

---

## SECTION 5: RISK INDICATORS

### HIGH RISK (Blocking)

| Risk | Indicator | Mitigation |
|------|-----------|------------|
| Import cycle | `../shared` breaks after move | Fix all relative imports before build |
| Vite alias failure | `@hub-1` not resolving | Update vite.config before file moves |
| Workflow path error | CI/CD fails on new paths | Test workflows on feature branch |

### MEDIUM RISK (Recoverable)

| Risk | Indicator | Mitigation |
|------|-----------|------------|
| Missing file | Build error: module not found | Checklist 4.4.x ensures all moved |
| Path typo | Import error on specific file | Grep search for pattern |
| Config drift | Package.json scripts wrong | Verify scripts work post-move |

---

## SECTION 6: TOOLS FOR VERIFICATION

### 6.1 Pre-Move Audit Commands

```bash
# Find all imports referencing hubs
grep -r "hub-1-sator\|hub-2-rotas\|hub-3-arepo\|hub-4-opera" --include="*.js" --include="*.jsx" src/

# Find all workflow path references
grep -r "apps/website-v2\|website-v2" .github/workflows/

# Find all vite alias usages
grep -r "@hub-1\|@hub-2\|@hub-3\|@hub-4" --include="*.jsx" src/
```

### 6.2 Post-Move Verification Commands

```bash
# Verify no old paths remain
grep -r "apps/website-v2" . --include="*.yml" --include="*.json" --include="*.md"

# Verify build succeeds
cd 2_Libreaux_NJZ_eXe_[P_TENET]/000-TENET_[TENET] && npm run build

# Verify imports resolve
npm run lint || echo "Check import errors"
```

---

## SECTION 7: APPROVAL

**Traceability Analysis Status:** COMPLETE

**Checklist Status:** READY FOR USE

**Approved For Implementation:** _________________ (Eli)

**Date:** _________________

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-03-10  
**Analyst:** Kimi Claw
