# ADR 003: Monorepo vs Multi-Repository Structure

## Status
✅ **Accepted** - Monorepo with planned extraction for simulation

## Context

The platform consists of multiple components:
- Web application (React/Vite)
- API backend (FastAPI)
- Data pipeline (Python)
- Simulation engine (Godot)
- Browser extension (planned)

Two organizational approaches were evaluated:
1. **Monorepo** - Single repository with all components
2. **Multi-repo** - Separate repositories per component

## Decision

**Selected: Monorepo with selective extraction**

Current structure:
```
eSports-EXE/                    # Monorepo root
├── apps/web/                  # Web application
├── packages/shared/api/       # Backend API
├── packages/shared/axiom-esports-data/  # Data pipeline
└── platform/simulation-game/  # Godot simulation (TO BE EXTRACTED)
```

## Rationale

### Why Monorepo?

| Factor | Monorepo Benefit |
|--------|------------------|
| **Atomic Changes** | Single PR can modify API + Web + Documentation |
| **Shared Code** | Common types, utilities, schemas easily shared |
| **Dependency Management** | pnpm workspaces ensure version consistency |
| **CI/CD Efficiency** | Single pipeline orchestrates all deployments |
| **Onboarding** | One clone, one setup script |
| **Code Review** | Cross-component changes visible in single context |

### Why Extract Simulation?

The Godot simulation engine will be extracted to a separate repository because:
1. **Different release cadence** - Simulation updates less frequent than web
2. **Different skillset** - GDScript/C# vs TypeScript/Python
3. **Distribution model** - npm package + standalone game
4. **Build complexity** - WebAssembly build pipeline separate from web

## Consequences

### Positive
- **Developer Velocity**: Cross-component changes in single PR
- **Consistency**: Shared linting, formatting, TypeScript configs
- **Testing**: Integration tests across components in one CI run
- **Documentation**: Single source of truth for architecture

### Negative
- **Repository Size**: Godot assets increase clone time (mitigated by extraction)
- **Access Control**: Granular permissions harder (GitHub Teams help)
- **CI Complexity**: Must detect which components changed
- **Git History**: Potentially noisy with many components

## Tooling

### Package Management
- **pnpm workspaces** - Efficient dependency deduplication
- **turborepo** - Build pipeline orchestration

### Code Sharing
```typescript
// packages/shared/schemas/
export interface Player {
  id: string;
  name: string;
  simrating: number;
}

// Used by:
// - apps/web/src/ (frontend)
// - packages/shared/api/ (backend)
```

### CI/CD
```yaml
# .github/workflows/ci.yml
- Detect changed files
- Run only affected tests
- Deploy only changed components
```

## Extraction Criteria

A component should be extracted when:
1. **Different release schedule** - Updates independent of main platform
2. **Different ownership** - Separate team with different access needs
3. **Distribution requirements** - Published as npm package, etc.
4. **Build complexity** - Requires specialized CI/CD pipeline

### Current Extraction Plans

| Component | Status | Target |
|-----------|--------|--------|
| Godot Simulation | 🟡 Planned | `github.com/njzitegeist/rotas-simulation-engine` |
| Browser Extension | 🟢 Keep in monorepo | Shared build pipeline |
| Data Pipeline | 🟢 Keep in monorepo | Tightly coupled with API |

## References

- [Godot Extraction Plan](../../GODOT_EXTRACTION_PLAN.md)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/)

---

*Decision Date: 2024-01-20*  
*Decision Maker: Engineering Leadership*  
*Last Reviewed: 2026-03-30*
