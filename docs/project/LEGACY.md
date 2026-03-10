[Ver010.000]

# Legacy & Historic Elements

## Overview

This document identifies **legacy and historic elements** in the eSports-EXE (SATOR-eXe-ROTAS) project. These elements are preserved for reference but should **NOT** be included in active development or production builds.

---

## Legacy Documents (Reference Only)

The following documents are historical artifacts from the project's evolution. They are preserved in the `/docs/legacy/` directory:

| Document | Purpose | Status |
|----------|---------|--------|
| `LEGACY_DOCUMENT_ANALYSIS.md` | Historical decision log & architectural evolution | **ARCHIVE** |
| `LEGACY_DOSSIER.md` | Consolidated historical context | **ARCHIVE** |
| `AXAS3_CODE_DATA_ANALYSIS_REPORT.md` | Legacy code review findings | **ARCHIVE** |
| `REPO_GAP_ANALYSIS.md` | Historical gap analysis | **ARCHIVE** |

### Why These Are Legacy

- They contain **historical decisions** that may no longer reflect current architecture
- They document **evolution phases** that have been superseded
- They serve as **archival reference** for understanding project history
- They should not be used for **current development decisions**

---

## Active vs Legacy Components

### Active Development Components ✅

| Component | Location | Status |
|-----------|----------|--------|
| RAWS Schema | `shared/axiom-esports-data/raws-schema/` | **ACTIVE** |
| FastAPI Backend | `shared/axiom-esports-data/api/` | **ACTIVE** |
| React Web App | `shared/apps/sator-web/` | **ACTIVE** |
| Godot Simulation | `simulation-game/` | **ACTIVE** |
| Data Pipeline | `shared/axiom-esports-data/pipeline/` | **ACTIVE** |
| Design System | `website/design-system/` | **ACTIVE** |

### Legacy Components (Do Not Modify) ⚠️

| Component | Location | Reason | Status |
|-----------|----------|--------|--------|
| AXAS3 Analysis | Root `AXAS3_*` files | Superseded by new architecture | **READ-ONLY** |
| Early Prototypes | Any `prototype/` or `old/` directories | Experimental code | **READ-ONLY** |
| Historical Reviews | `*REVIEW*.md` files in root | Historical assessments | **READ-ONLY** |

---

## Build Exclusions

The following are excluded from production builds via `.gitignore`:

```
# Legacy exclusions
/docs/legacy/*.md
LEGACY_*.md
ARCHIVE_*.md
*REVIEW*.md
prototype/
old/
*.bak
*.backup
```

---

## Migration Notes

### From satorXrotas to eSports-EXE

The following represent **historical milestones** and should not be reverted:

1. **Twin-table architecture** - RAWS/BASE system
2. **Data partition firewall** - GAME_ONLY_FIELDS protection
3. **Porcelain³ design system** - Current active design language
4. **Quarterly Grid UI** - Modern interface pattern

### Deprecated Concepts

The following concepts are **deprecated** and should not be used in new code:

| Deprecated | Replacement | Rationale |
|------------|-------------|-----------|
| Old KCRITR implementation | New verification framework | Better async support |
| File-based data storage | PostgreSQL + TimescaleDB | Scalability |
| Monolithic scrapers | Pipeline coordinator | Better isolation |
| Static CSS themes | Porcelain³ token system | Consistency |

---

## Historical Context

### Phase Timeline

| Phase | Period | Key Decisions | Current Status |
|-------|--------|---------------|----------------|
| Foundation | 2024 Q4 - 2025 Q1 | Project initiation, 37-field schema | ✅ Completed |
| KCRITR Review | Feb 2025 | Critical gaps identified | ✅ Addressed |
| Benchmarking | Mid 2025 | NFL/NBA/MLB comparison | ✅ Completed |
| Architecture | Late 2025 | Godot/Python/TS stack | ✅ Active |
| Unification | Feb 2026 | Monorepo consolidation | ✅ Current |

---

## Development Guidelines

### Do's ✅

- Reference legacy docs for **historical context**
- Build on the **active components** listed above
- Follow the **Porcelain³ design system**
- Use the **pipeline coordinator** for data extraction
- Respect the **data partition firewall**

### Don'ts ❌

- Modify legacy documents (they are archives)
- Implement features based on deprecated concepts
- Use old file-based storage patterns
- Reference outdated formulas without verification
- Commit experimental code to main

---

## Questions?

For questions about legacy elements vs active development:

1. Check this document first
2. Review the component status tables above
3. Consult the active architecture in `CURRENT_STATE_DOSSIER.md`
4. Ask in the #development channel

---

*Last Updated: March 4, 2026*
*Version: 1.0*
