[Ver011.000]

# 🏗️ Project Structure Standardization Plan
## Phase 2: Organization for SATOR-eXe-ROTAS

**Date:** March 7, 2026  
**Status:** IN PROGRESS

---

## 📋 CURRENT STATE

### Root Directory Contents
```
main-repo/
├── exe-directory/          ← eXe platform
├── shared/                 ← Shared code
├── skills/                 ← AI skill definitions
├── simulation-game/        ← Godot simulation
├── website/                ← Original website
├── website-v2/            ← NEW: 4-hub NJZ Platform
├── docs/                   ← Documentation
├── tests/                  ← Test suites
├── scripts/                ← Utility scripts
├── .cursor/               ← IDE config
├── .kimi/                 ← AI config
├── .github/               ← CI/CD workflows
└── [various .md files]    ← Documentation at root
```

---

## 🎯 PROPOSED STANDARD STRUCTURE

### Professional IT Project Layout
```
main-repo/
├── 📁 apps/                      # Applications
│   ├── website/                 # Original website
│   └── website-v2/             # NJZ Platform (new)
│
├── 📁 packages/                  # Shared packages
│   └── shared/                 # Current shared/
│
├── 📁 services/                  # Backend services
│   └── exe-directory/          # eXe platform → rename?
│
├── 📁 platform/                  # Simulation platform
│   └── simulation-game/        # Godot simulation
│
├── 📁 infrastructure/            # DevOps/Infrastructure
│   ├── .github/               # CI/CD workflows
│   └── scripts/               # Utility scripts
│
├── 📁 docs/                      # Documentation (consolidate)
│   ├── architecture/          # System design
│   ├── api/                   # API docs
│   ├── guides/                # User guides
│   └── legacy/                # Historical docs
│
├── 📁 tests/                     # Test suites (all in one place)
│   ├── integration/           # Integration tests
│   └── unit/                  # Unit tests
│
├── 📁 tools/                     # Development tools
│   ├── .cursor/              # IDE configs
│   ├── .kimi/                # AI configs
│   └── skills/               # AI skill definitions
│
└── 📁 project/                   # Project management
    ├── reports/               # Investigation reports
    ├── standards/             # Standards docs
    └── roadmap/               # Planning docs
```

---

## 📊 MAPPING CURRENT → PROPOSED

| Current Location | Proposed Location | Action |
|------------------|-------------------|--------|
| `website/` | `apps/website/` | Move |
| `website-v2/` | `apps/website-v2/` | Move |
| `shared/` | `packages/shared/` | Move |
| `exe-directory/` | `services/exe-directory/` | Move |
| `simulation-game/` | `platform/simulation-game/` | Move |
| `.github/` | `infrastructure/.github/` | Move |
| `scripts/` | `infrastructure/scripts/` | Move |
| `docs/` | `docs/` (keep) | Reorganize contents |
| `tests/` | `tests/` (keep) | Reorganize contents |
| `.cursor/` | `tools/.cursor/` | Move |
| `.kimi/` | `tools/.kimi/` | Move |
| `skills/` | `tools/skills/` | Move |
| Root .md files | `docs/` or `project/` | Move |

---

## ⚠️ CONSIDERATIONS

### Why This Structure?
1. **Separation of concerns** — Apps vs services vs packages
2. **Scalability** — Easy to add new apps/services
3. **Discoverability** — Clear where things belong
4. **Professional standard** — Matches industry conventions

### Risks
1. **Breaking changes** — Moving files changes paths
2. **Git history** — Moves show as delete+add
3. **References** — Internal links may break
4. **Time investment** — Significant reorganization effort

### Alternatives

#### Option A: Minimal Reorganization (Recommended)
Only fix the most problematic issues:
- Consolidate root .md files into `docs/`
- Move `website-v2/` to `apps/website-v2/`
- Keep everything else as-is

#### Option B: Full Standardization
Complete restructure per proposed layout above.

#### Option C: Status Quo
Accept current structure, improve documentation instead.

---

## 🎯 RECOMMENDATION

**Start with Option A: Minimal Reorganization**

1. **Move root .md files → `docs/project/`**
2. **Move `website-v2/` → `apps/website-v2/`**
3. **Create `docs/guides/` for user documentation**
4. **Update README with navigation guide**

**Why minimal?**
- Lower risk
- Faster completion
- Addresses main pain points
- Can expand later if needed

---

## ✅ ACTION CHECKLIST

- [ ] Create `apps/` directory
- [ ] Move `website-v2/` to `apps/website-v2/`
- [ ] Create `docs/project/` directory
- [ ] Move root .md files to `docs/project/`
- [ ] Update main README with structure guide
- [ ] Commit changes
- [ ] Update PROJECT_MEMORY

---

**Next Step:** Awaiting approval for reorganization approach