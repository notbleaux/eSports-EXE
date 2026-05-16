# SATOR Framework — Archival & Reconciliation Plan

## Status: ARCHIVED (Per v4 Master Plan)
SATOR is **incubated** — not gating development. All active references must be stripped.
Useful content extracted and preserved for later reconciliation.

---

## Phase 1: Strip (Remove from Active Code)

### Files to Delete/Remove
- `SATORtree.md` (root)
- `_SATORtree.md` (root)
- `rotas-frontend/SATOR/` (if exists as active stub)
- Any `SATOR_PHASE_*` environment variables in `.env.example` and docs
- SATOR imports/references in:
  - `apps/web/src/components/RotasHub/SATORtree.tsx`
  - Any `useSATOR` hooks
  - Any `SATOR_*` type prefixes in shared types

### Files to Modify (Remove SATOR refs)
- `PROJECT_REGISTRY.md` — Remove SATOR gating language
- `MEMORY.md` — Update SATOR status to "incubated, references archived"
- `HEARTBEAT.md` — Remove SATOR phase tracking
- Any ADRs referencing SATOR as active dependency

---

## Phase 2: Archive (Preserve in `docs/incubation/`)

### Archive Location
```
docs/incubation/
├── SATOR/
│   ├── SATORtree.md                    # Original spec (preserved)
│   ├── _SATORtree.md                 # Draft spec (preserved)
│   ├── SATOR-PHASE-ROADMAP.md        # Phase definitions
│   ├── SATOR-ADR-001.md              # Architecture decision (if exists)
│   ├── extracted-types.md            # Useful type definitions extracted
│   ├── extracted-components.md       # Useful component patterns
│   └── README.md                     # Why archived + how to restore
```

### Extraction Criteria
Preserve content that is:
- ✅ Type-safe patterns (generic tree structures, recursive types)
- ✅ UI patterns (collapsible tree, node rendering)
- ✅ Data models (hierarchical node relationships)
- ✅ Algorithm logic (tree traversal, path finding)

Discard content that is:
- ❌ SATOR-specific branding/naming
- ❌ Phase-gating logic ("wait for SATOR Phase 3")
- ❌ Stub implementations with no functionality
- ❌ Duplicate of existing ROTAS/SATOR HUB code

---

## Phase 3: Reconciliation Plan (For Later)

### Trigger Condition
Revisit when:
- ZeSporteXte ROTAS HUB reaches v2.0 (stable stats engine)
- SATOR HUB analytics layer proves viable in production
- User explicitly requests SATOR reactivation

### Reconciliation Steps
1. Review `docs/incubation/SATOR/README.md` for context
2. Compare extracted types against current type system
3. Adapt SATOR patterns to current design tokens and component library
4. Re-ADR: New architecture decision required (SATOR v2.0)
5. Gradual reintroduction: `docs/incubation/` → `packages/shared/` → active code

---

## Implementation Checklist

- [ ] Create `docs/incubation/SATOR/` directory
- [ ] Move `SATORtree.md` → `docs/incubation/SATOR/`
- [ ] Move `_SATORtree.md` → `docs/incubation/SATOR/`
- [ ] Extract useful types → `docs/incubation/SATOR/extracted-types.md`
- [ ] Extract useful components → `docs/incubation/SATOR/extracted-components.md`
- [ ] Write `docs/incubation/SATOR/README.md`
- [ ] Strip SATOR refs from `PROJECT_REGISTRY.md`
- [ ] Strip SATOR refs from `MEMORY.md`
- [ ] Strip SATOR refs from `HEARTBEAT.md`
- [ ] Remove SATOR imports from active React components
- [ ] Remove SATOR env vars from `.env.example`
- [ ] Verify build passes after stripping

---

## Notes
- **Mimo** (ex-JARVIS) does not depend on SATOR — this is explicit per v4
- **SATOR HUB** in ZeSporteXte remains active (it's the analytics HUB, not the framework)
- This archival refers to the **SATOR Framework/Phase system**, not the HUB
- Archive date: 2026-05-16
- Review date: 2026-08-16 (quarterly review per budget/testing schedule)

---

*Plan created: 2026-05-16*
*Status: Awaiting implementation*
