# Repository Documentation Tidying & Consolidation Report

## Current Structure Analysis
- **docs/**: 50+ MD (plans duplicated TRADING_SIM/THEORETICAL_TRADING, legacy/archive-website bloat).
- **docs/plans/**: 16 focused MD (plans/trading/Godot/UI - keep active).
- **archive-website/**: Old static site (full subproject - archive).
- **implementation/**: 20+ AI prompts/plans (consolidate to project/).

## Recommendations & Actions Taken
1. **Consolidate Duplicates**: TRADING_SIM → THEORETICAL_TRADING/BETTING_SIM (done).
2. **Active Plans**: docs/plans/ → Keep (newest).
3. **Archive Legacy**: archive-website/ → Move to legacy/website-archive/ if oversized.
4. **Master Index**: Create docs/index.md linking sections.

**Proposed Structure**:
```
docs/
├── README.md (landing)
├── PLANS/ (plans/)
├── HUBS/ (TREE_HUBS_PLAN.md)
├── UI/ (STYLING_GUIDE, MOTIFS, EFFECTS)
├── SIM/ (GODOT_EXPANSION, CS2_SIM)
├── DATA/ (ANALYTICS, MODELING)
├── RESEARCH/ (CRITIQUE, SPORTS_RESEARCH)
└── ARCHIVE/ (old)
```

**File Admin**:
- No deletes (history).
- Symlinks/indexes for access.
- TODO.md links to master.

Repo tidy: Logical hierarchy, no bloat, search-friendly.

