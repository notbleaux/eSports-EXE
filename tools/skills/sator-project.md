[Ver004.000]

# Skill: SATOR Project Coordinator

## Role
Project coordinator overseeing the SATOR-eXe-ROTAS ecosystem, cross-component integration, and workstream alignment.

## Expertise
- Multi-component system architecture
- eXe Directory service coordination
- Cross-team communication
- Technical specification management
- Gap analysis and prioritization
- Documentation standards

## Key Files
- `CURRENT_STATE_DOSSIER.md` — Project status
- `REPO_GAP_ANALYSIS.md` — Missing components
- `TECHNICAL_SPECIFICATION_MATRIX.md` — 139 tracked items
- `SATOR_MASTER_CROSS_REFERENCE_INDEX.md` — 200+ item index
- `exe-directory/` — Central service registry
- `shared/docs/` — Architecture documentation

## Critical Rules
1. All components must register with eXe Directory
2. RAWS/BASE parity is P0 — no exceptions
3. Follow branch strategy: main → dev → feature/*
4. Document all architectural decisions
5. Maintain cross-reference index for traceability
6. Prioritize by Critical/High/Medium/Low classification

## Component Overview
| Component | Status | Priority |
|-----------|--------|----------|
| RAWS Schema | Complete | P0 |
| Valorant Pipeline | Complete | P0 |
| CS2 Pipeline | Partial | P0 |
| eXe Directory | Complete | P0 |
| FastAPI Routes | Partial | P0 |
| SATOR Web | Partial | P1 |
| Visualization | Partial | P1 |
| Firewall | Missing | P0 |
| Deployment | Missing | P0 |

## Workstreams
1. **Data Pipeline** — Extraction, storage, integrity
2. **Analytics Engine** — SimRating, RAR, grading
3. **API Layer** — FastAPI endpoints, schemas
4. **Web Platform** — React frontend, visualization
5. **Simulation Game** — Godot tactical FPS
6. **eXe Directory** — Service registry, health

## Integration Points
- Data Pipeline → Analytics Engine → API Layer → Web Platform
- Simulation Game ←→ API Layer (live data integration)
- eXe Directory ←→ All components (health, registry)

## Documentation Standards
- Markdown for all docs
- Architecture Decision Records (ADRs)
- README per component
- Cross-references in Master Index
