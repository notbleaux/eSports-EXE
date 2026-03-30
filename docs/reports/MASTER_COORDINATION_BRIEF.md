[Ver001.000]

# Master Coordination Brief

**Date:** 2026-03-30  
**Status:** Plans Finalized, Ready for Execution  
**Classification:** Technical Lead Directive

---

## SITUATION SUMMARY

Three comprehensive review passes have validated the codebase and identified critical gaps. This brief authorizes immediate action on:

1. **VOD Tagging System** — Immediate implementation (Week 1-2)
2. **HLTV Scraper Removal** — Legal compliance (24 hours)
3. **Module Consolidation** — Phase unblocker (Week 1)
4. **Rust Simulation Scouting** — Architecture foundation (Week 1-4)

---

## CURRENT FORCE DISPOSITION

### Verified Assets ✅

| Asset | Location | Status | Readiness |
|-------|----------|--------|-----------|
| OAuth System | `services/api/src/auth/` | ✅ Complete | Production |
| WebSocket Pipeline | `hooks/useWebSocket.ts` | ✅ Complete | Production |
| Godot Simulation | `platform/simulation-game/` | 🟡 Functional | Development |
| PandaScore Integration | `clients/pandascore.py` | ✅ Complete | Production |
| Database Schema | `infra/migrations/` | ✅ 9 migrations | Production |
| Frontend Hub Structure | `apps/web/src/hub-*/` | ✅ Organized | Production |

### Critical Gaps 🔴

| Gap | Location | Impact | ETA |
|-----|----------|--------|-----|
| HLTV Scraper | `extraction/src/scrapers/` | Legal risk | 24h |
| Gateway Module | `services/api/gateway/` | Phase 8 blocked | 1wk |
| Betting/Token Modules | `services/api/{betting,tokens}/` | Phase 12 blocked | 1wk |
| ML Model | `ml/train_simrating.py` | SimRating v2 incomplete | 3d |
| Rust Sim Engine | N/A (new repo) | Monte Carlo impossible | 4wk |

---

## EXECUTION PRIORITIES

### Priority 1: Immediate (This Week)

```
┌─────────────────────────────────────────────────────────────────┐
│ P1-A: HLTV Scraper Removal                                      │
│ P1-B: VOD Tagging System - Phase 1 (Core UI)                    │
│ P1-C: Gateway Module Implementation                             │
└─────────────────────────────────────────────────────────────────┘
```

**Agents Assigned:**
- Backend Agent: P1-A, P1-C
- Frontend Agent: P1-B

### Priority 2: Short-Term (Next 2 Weeks)

```
┌─────────────────────────────────────────────────────────────────┐
│ P2-A: VOD Tagging System - Phase 2-3 (Community + Pipeline)     │
│ P2-B: Betting/Token Module Migration                            │
│ P2-C: ML Model Training Execution                               │
│ P2-D: Rust Simulation Repository Setup                          │
└─────────────────────────────────────────────────────────────────┘
```

**Agents Assigned:**
- ML Agent: P2-C
- Backend Agent: P2-B
- Frontend Agent: P2-A
- Rust Agent: P2-D

### Priority 3: Medium-Term (Month 2)

```
┌─────────────────────────────────────────────────────────────────┐
│ P3-A: Rust Simulation Core Implementation                       │
│ P3-B: Map Library Expansion                                     │
│ P3-C: Determinism Verification Infrastructure                   │
│ P3-D: Store Consolidation (authStore move)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## AGENT ASSIGNMENTS

### Agent A: Backend Consolidation

**Scope:** Python backend, database, API
**Current Tasks:**
1. Remove HLTV scraper (24h)
2. Implement Gateway module (3d)
3. Migrate Betting/Token modules (3d)
4. Create migration 006_betting_token_schema.py (1d)
5. Create migration 007_vod_tags.py (1d)

**Deliverables:**
- `services/api/src/njz_api/gateway/router.py`
- `services/api/src/njz_api/betting/` (migrated)
- `services/api/src/njz_api/tokens/` (migrated)
- `infra/migrations/versions/006_betting_token_schema.py`
- `infra/migrations/versions/007_vod_tags.py`

### Agent B: Frontend VOD Tagging

**Scope:** React components, UI/UX, community features
**Current Tasks:**
1. Create VOD Tagging UI components (3d)
2. Implement timeline with markers (2d)
3. Build tag palette and categories (1d)
4. Add community features (gamification) (2d)
5. Integrate with OPERA hub (1d)

**Deliverables:**
- `apps/web/src/hub-4-opera/components/VodTagger/`
- `apps/web/src/hooks/useVodTags.ts`
- Tag reputation system
- Weekly challenges UI

### Agent C: ML & Data Pipeline

**Scope:** Model training, frame extraction, export
**Current Tasks:**
1. Execute SimRating training (2d)
2. Export TFJS model artifacts (1d)
3. Enable useMLInference hook (1d)
4. Build frame extraction service (2d)
5. COCO format export (1d)

**Deliverables:**
- `apps/web/public/models/simrating/` (trained model)
- `services/api/src/njz_api/opera/frame_extraction.py`
- COCO export endpoint

### Agent D: Rust Simulation Scout

**Scope:** New repository, Rust architecture, PyO3 bindings
**Current Tasks:**
1. Create `notbleaux/njz-simulation-engine` repo (1d)
2. Scout Godot simulation for porting (2d)
3. Design Rust architecture (2d)
4. Implement deterministic core (3d)
5. PyO3 Python bindings (2d)

**Deliverables:**
- Scouting report: `SCOUTING_REPORT_GODOT.md`
- Architecture doc: `RUST_SIMULATION_DESIGN.md`
- Working Rust simulation with Python API
- CI/CD pipeline

---

## COORDINATION PROTOCOLS

### Daily Standup Updates

**Format:**
```markdown
## Agent [X] - [Date]

**Yesterday:**
- [Completed items]

**Today:**
- [Planned items]

**Blockers:**
- [Any dependencies on other agents]

**Needs Decision:**
- [Questions for Technical Lead]
```

### Conflict Resolution

**Rule:** Technical Lead has final authority on:
1. Architecture decisions
2. Scope changes > 20%
3. Agent priority conflicts
4. Repository structure changes

### Artifact Sharing

**Location:** `docs/reports/artifacts/`

```
docs/reports/artifacts/
├── 2026-03-30/
│   ├── agent-a-gateway-design.md
│   ├── agent-b-vod-ui-mockup.png
│   ├── agent-c-training-results.json
│   └── agent-d-scout-report.md
└── 2026-03-31/
    └── ...
```

---

## DECISION LOG

| ID | Date | Decision | Impact | Status |
|----|------|----------|--------|--------|
| D001 | 2026-03-30 | Create separate repo for Rust simulation | High | ✅ APPROVED |
| D002 | 2026-03-30 | Implement VOD tagging before CV | Medium | ✅ APPROVED |
| D003 | 2026-03-30 | Remove HLTV immediately | Critical | ✅ APPROVED |
| D004 | TBD | Fixed-point precision (32 vs 64) | High | ⏳ PENDING |
| D005 | TBD | Rapier vs custom physics | High | ⏳ PENDING |

---

## SUCCESS CRITERIA

### Week 1 Milestones

- [ ] HLTV scraper completely removed
- [ ] VOD Tagging UI functional (create/view tags)
- [ ] Gateway module responding to /health
- [ ] Godot scouting report delivered
- [ ] Rust repo created with CI/CD

### Week 2 Milestones

- [ ] 100+ VOD tags created by community
- [ ] Betting module migrated and tested
- [ ] ML model trained and exported
- [ ] Rust simulation deterministic core working
- [ ] Frame extraction service running

### Month 1 Milestones

- [ ] 500+ VOD tags with 30% having bounding boxes
- [ ] Token system operational
- [ ] Rust simulation 100x faster than Godot
- [ ] Monte Carlo predictions working
- [ ] Phase 8 and 12 gates unlocked

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Agent unavailability | Medium | High | Cross-train, document everything |
| Scope creep | High | Medium | Strict 20% change threshold |
| Legal issue (HLTV) | Low | Critical | Immediate removal authorized |
| Performance shortfall | Medium | Medium | Benchmark early, adjust targets |
| Integration failures | Medium | High | API contracts documented |

---

## COMMUNICATION CHANNELS

- **Daily Updates:** `.agents/coordination/STATUS.md`
- **Blockers:** `.agents/coordination/BLOCKERS.md`
- **Decisions:** `.agents/coordination/DECISIONS.md`
- **Artifacts:** `docs/reports/artifacts/[date]/`

---

## AUTHORIZATION

This brief authorizes:
1. ✅ Creation of `notbleaux/njz-simulation-engine` repository
2. ✅ Deletion of HLTV scraping code
3. ✅ Async agent operations under Technical Lead direction
4. ✅ Database migrations 006 and 007
5. ✅ Token rewards for VOD tagging (when token system ready)

**Effective:** 2026-03-30  
**Review:** Weekly

---

*Execute with discipline. Document everything. Communicate status daily.*
