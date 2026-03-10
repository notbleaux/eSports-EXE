[Ver020.000]

# LEGACY DOSSIER: AXIOM / SATOR ESPORTS ANALYTICS PLATFORM
## Historical Context & Project Evolution (2024-2026)

**Document Version:** 1.0  
**Compilation Date:** March 4, 2026  
**Sources:** 47 Historical Documents, KCRITR Framework Analysis, AXAS3 Reports, Repository Gap Analysis  
**Word Count:** ~4,200

---

## EXECUTIVE SUMMARY

This dossier consolidates the complete historical context of the Axiom/SATOR esports analytics platform, spanning from initial concept in Q4 2024 through the current implementation phase in early 2026. The project represents one of the most comprehensive attempts to apply financial analytics frameworks (RAR, EPA, Investment Grade) to esports player valuation, built atop a sophisticated twin-table data architecture and deterministic simulation engine.

The journey has been marked by significant pivots—from a pure analytics framework to a dual-platform ecosystem (RadiantX game + SATOR Web stats), from HLTV-dependent data collection to multi-source pipelines, and from ad-hoc development to KCRITR-governed quality control.

---

## I. PROJECT EVOLUTION TIMELINE (2024-2026)

### ~~Phase 1: Foundation & Conceptualization (Q4 2024 - Q1 2025)~~

| Date | Milestone | Significance |
|------|-----------|--------------|
| ~~**2024 Q4**~~ | ~~Project initiation for Esports Advanced Analytics Framework~~ | ~~Response to limitations of HLTV Rating 2.0/2.1/3.0 systems; identified need for role-contextualized metrics~~ |
| ~~**Feb 2025**~~ | ~~Adoption of 37-field player database schema~~ | ~~Most comprehensive attempt to apply financial analytics (RAR, EPA, Investment Grade) to esports player valuation~~ |
| ~~**Feb 2025**~~ | ~~Definition of 8 tactical role types with replacement baselines~~ | ~~Enabled role-contextualized valuation: Entry, AWPer, IGL, Support, Lurker, Rifler, Controller, Initiator, Sentinel~~ |
| ~~**Feb 2025**~~ | ~~KCRITR Framework establishment~~ | ~~Six-gate quality control: Knowledge → Critical Analysis → Review → Integration → Testing → Refinement~~ |
| ~~**Feb 2025**~~ | ~~Data Quality Manifest creation with confidence tiers~~ | ~~Transparency in data reliability (40-100% confidence spectrum); 23 data sources cataloged~~ |

**Key Decision:** The 37-field schema was deliberately over-engineered to capture dimensions no existing esports analytics platform tracked—from temporal weighting to predictive risk scores. This decision has been validated by the framework's ability to evolve without schema changes.

---

### ~~Phase 2: Critical Review & Gap Identification (Feb-Mar 2025)~~

| Date | Milestone | Significance |
|------|-----------|--------------|
| ~~**Feb 2025**~~ | ~~Commissioning of KCRITR Esports Analytics Review (CRIT Report) v1.0~~ | ~~Independent assessment of framework viability before major investment; delivered B+ rating~~ |
| ~~**Feb 2025**~~ | ~~Identification of 5 Critical Gaps (C-01 through C-05)~~ | ~~Formula opacity, sample size issues, missing files, no WAR decomposition, undocumented confidence~~ |
| ~~**Feb 2025**~~ | ~~Establishment of RAR (Role-Adjusted Rating) methodology~~ | ~~Revolutionary potential for player valuation; contextualizes performance by role~~ |
| ~~**Feb 2025**~~ | ~~Implementation of temporal weighting & recency bias system~~ | ~~3 temporal weight categories: Standard (90-day), Scouting (180-day), Awards (30-day) half-lives~~ |

**Critical Gap Status (as of March 2026):**
| Gap ID | Description | Impact | Status |
|--------|-------------|--------|--------|
| C-01 | Formula Opacity: RAR, EPA derivation undocumented | Cannot validate methodology; community adoption blocked | 🟡 **IN PROGRESS** |
| C-02 | Sample Size: 10-player database vs 500+ target | Cannot validate statistical methodology | 🔴 **OPEN** |
| C-03 | Missing Files 6 & 7: Major MVP data and tournament awards | Breaks analytical chain | 🟡 **PARTIAL** |
| C-04 | No WAR-style additive decomposition | Cannot compare player value across roles | 🟡 **IN PROGRESS** |
| C-05 | Undocumented confidence intervals | Predictive metrics lack uncertainty quantification | 🔴 **OPEN** |

---

### ~~Phase 3: Professional Sports Benchmarking (Mid 2025)~~

| Date | Milestone | Significance |
|------|-----------|--------------|
| ~~**Mid 2025**~~ | ~~Comprehensive benchmarking against NFL/NBA/MLB/NHL/Soccer/Golf~~ | ~~Identified framework deficits; leveraged universal ΔV identity across sports~~ |
| ~~**Mid 2025**~~ | ~~Key Finding: "Esports has data advantage but framework deficit"~~ | ~~CS2's 64-128 tick-per-second granularity exceeds traditional sports tracking~~ |
| ~~**Mid 2025**~~ | ~~Decision to implement WAR-style additive decomposition~~ | ~~Baseball's Wins Above Replacement provides proven model for above-replacement metrics~~ |
| ~~**Mid 2025**~~ | ~~Decision to implement EPA (Expected Points Added)~~ | ~~Universal ΔV = V(state_after) - V(state_before) identity underlies NFL EPA, xG, Strokes Gained~~ |
| ~~**Mid 2025**~~ | ~~Forge Engine combat system specification finalized~~ | ~~Pre-compute opposed d10 dice pools into 38KB L1-cache-fitting lookup table; sub-6-second match resolution validated~~ |

**Key Insight:** The sports benchmarking phase revealed that while esports generates 10-100x more raw data per match than traditional sports, the analytical frameworks lag decades behind baseball's WAR or golf's Strokes Gained. This insight directly drove the RAR/EPA architecture.

---

### ~~Phase 4: System Architecture & Integration (Late 2025 - Feb 2026)~~

| Date | Milestone | Significance |
|------|-----------|--------------|
| ~~**Q4 2025**~~ | ~~Three-layer AI hierarchy with shared blackboard~~ | ~~10Hz decision frequency; operational→tactical→strategic agent taxonomy~~ |
| ~~**Q4 2025**~~ | ~~SimRating formula finalization~~ | ~~Equal-weight 5-component: 0.20×KAST + 0.20×KPR + 0.20×(-DPR) + 0.20×RoundSwing + 0.20×ADR~~ |
| ~~**Q4 2025**~~ | ~~Dual combat engine LOD system~~ | ~~RaycastDuelEngine for detailed geometry; TTKDuelEngine for rapid simulation~~ |
| ~~**Feb 2026**~~ | ~~Beautiful Monster UI concept specification~~ | ~~10 Japanese design principles (Kintsugi, Ma, Wabi-sabi) for information-dense dashboards~~ |
| ~~**Feb 2026**~~ | ~~SATOR platform monorepo architecture~~ | ~~Unified: RadiantX game (Godot), Axiom analytics (Python), SATOR Web (TypeScript)~~ |
| ~~**Feb 26, 2026**~~ | ~~Temporal Wall architecture decision~~ | ~~Prevent overfitting through 3-epoch data architecture (2020-2022/2023-2025/2026+)~~ |
| ~~**Feb 2026**~~ | ~~Data Partition Firewall implementation~~ | ~~TypeScript library with FantasyDataFilter pattern to prevent data leakage~~ |

---

### Phase 5: Implementation & Repository Launch (Feb 2026 - Present)

| Date | Milestone | Significance |
|------|-----------|--------------|
| ~~**Feb 14, 2026**~~ | ~~MDFv0 Master Document v3.0 release~~ | ~~Comprehensive project chronicle with context-dependent development phases~~ |
| ~~**Feb 14, 2026**~~ | ~~Axiom Comprehensive Critical Review v2.0~~ | ~~Independent assessment across 7 interlinked design documents; B+ overall rating~~ |
| ~~**Feb 26, 2026**~~ | ~~FEBRRR RadiantX Repository Assessment~~ | ~~Technical verification of hvrryh-web/RadiantX against Axiom specifications; B+ grade~~ |
| **Mar 4, 2026** | SATOR Master Cross-Reference Index creation | 200+ items indexed across Research, Workstream, Technical, Code, Legacy, Config categories |
| **Mar 4, 2026** | Repository Gap Analysis completion | 55% completion assessed; 8 Critical, 5 Partial priority action items identified |
| **Active** | CS Pipeline Implementation | Priority shift to Counter-Strike dual-game support |

---

## II. HISTORICAL DECISIONS

### Decision 1: 37-Field Player Database Schema

**Date:** February 2025  
**Rationale:** Existing esports analytics (HLTV Rating, VLR Stats) captured only surface-level performance metrics. Financial analytics for traditional sports (WAR, EPA, VORP) demonstrated the value of contextual, multi-dimensional player valuation. The 37-field schema was designed to capture:

- Raw performance (K/D, ADR, KAST, etc.)
- Role-adjusted value (difficulty multipliers)
- Temporal factors (recency, form trends)
- Predictive indicators (risk scores, future value)
- Financial context (earnings, inflation-adjusted)

**Current Status:** ✅ **IMPLEMENTED** — Schema remains unchanged; has accommodated RAR v2, EPA v1, and Investment Grade v1 without migration

---

### Decision 2: Twin-Table Architecture (RAWS/BASE)

**Date:** Q3 2025  
**Rationale:** Separation of concerns between immutable reference data (RAWS) and derived analytics (BASE) provides:
- Data integrity through foreign key enforcement
- Independent scaling (write-heavy RAWS vs read-heavy BASE)
- Audit trail preservation
- Multi-game extensibility via `game_id` column

**Architecture:**
```
RAWS Layer (Immutable)          BASE Layer (Derived)
├── raws_players ◄──────────────├── base_players
├── raws_matches ◄──────────────├── base_matches
├── raws_player_stats ◄─────────├── base_player_stats
└── SHA-256 checksums           └── parity_hash linkage
```

**Current Status:** ✅ **IMPLEMENTED** — 8 twin table pairs operational; parity checker validates synchronization

---

### Decision 3: Three-Layer AI Hierarchy

**Date:** Q4 2025  
**Rationale:** Agent decision-making in tactical FPS requires clear separation of concerns:
- **Operational (10Hz):** Movement, aiming, shooting
- **Tactical (1Hz):** Positioning, utility usage, rotations
- **Strategic (0.1Hz):** Economic decisions, round strategy, adaptation

Shared blackboard architecture enables emergent coordination without explicit communication protocols.

**Current Status:** ✅ **IMPLEMENTED** — GDScript/C# dual implementation validated

---

### Decision 4: Forge Engine Combat Resolution

**Date:** Mid 2025  
**Rationale:** Monte Carlo simulation of thousands of matches requires sub-second combat resolution. Pre-computed probability mass function (PMF) for opposed d10 dice pools:
- 38KB lookup table fits in L1 cache
- Eliminates runtime dice simulation
- 15×15 dice pool combinations covered
- Sub-6-second full match resolution achieved

**Current Status:** ✅ **IMPLEMENTED** — Production C# code; validated 100,000+ simulations

---

### Decision 5: KCRITR Quality Framework

**Date:** February 2025  
**Rationale:** Ad-hoc development of complex analytics leads to technical debt and validation gaps. KCRITR establishes six gates:
1. **Knowledge** — Data source verification
2. **Critical Analysis** — Formula derivation and validation
3. **Review** — Independent assessment
4. **Integration** — System compatibility
5. **Testing** — Empirical validation
6. **Refinement** — Continuous improvement

**Current Status:** ✅ **OPERATIONAL** — Applied to all 47 research documents; B+ average grade

---

### Decision 6: Temporal Wall Architecture

**Date:** February 26, 2026  
**Rationale:** Machine learning models for player prediction risk overfitting to recent patterns. Three-epoch architecture:
- **Epoch I (2020-2022):** Training data; 50% confidence floor
- **Epoch II (2023-2025):** Validation data; 75% confidence floor  
- **Epoch III (2026+):** Production/test data; 100% confidence required

Prevents data leakage and ensures models generalize to unseen seasons.

**Current Status:** ✅ **IMPLEMENTED** — Epoch harvester operational; CircuitBreaker pattern for epoch transitions

---

### Decision 7: Data Partition Firewall

**Date:** February 2026  
**Rationale:** RadiantX (offline game) and SATOR Web (online stats) share infrastructure but must not share sensitive simulation internals:

**GAME-ONLY Fields (blocked from web):**
- `internalAgentState` — AI decision trees
- `radarData` — Real-time position feeds
- `seedValue` — RNG seeds enabling outcome prediction
- `simulationTick` — Engine internals
- `recoilPattern` — Weapon internals

**Current Status:** ✅ **IMPLEMENTED** — FantasyDataFilter TypeScript library; 4 enforcement points

---

### Decision 8: Dual-Game Priority (CS First, Then Valorant)

**Date:** March 4, 2026  
**Rationale:** Initial implementation focused on Valorant (VLR.gg pipeline complete, 88,560 validated records). Critical assessment revealed:
- CS2 has richer historical data (decades vs years)
- HLTV provides more comprehensive stats than VLR
- User preference for CS analytics
- Dual-game architecture already supports extensibility

**Current Status:** 🔄 **IN PROGRESS** — CS pipeline under active development; Valorant maintenance mode

---

## III. COMPLETED PHASES (Struck Through)

### ~~1. Research & Foundation (Q4 2024 - Q1 2025)~~
- ~~Initial concept development~~
- ~~Sports analytics literature review~~
- ~~37-field schema design~~
- ~~Role classification framework~~
- ~~KCRITR framework establishment~~

### ~~2. Critical Assessment (Feb-Mar 2025)~~
- ~~CRIT Report v1.0 delivery~~
- ~~5 Critical Gaps identification~~
- ~~RAR methodology specification~~
- ~~Temporal weighting system~~

### ~~3. Sports Benchmarking (Mid 2025)~~
- ~~NFL/NBA/MLB/NHL/Soccer/Golf framework analysis~~
- ~~Universal ΔV identity derivation~~
- ~~WAR/EPA adaptation strategy~~
- ~~Forge Engine specification~~

### ~~4. Architecture Design (Late 2025)~~
- ~~Three-layer AI hierarchy~~
- ~~Twin-table data architecture~~
- ~~SimRating formula finalization~~
- ~~Beautiful Monster UI principles~~

### ~~5. Repository Foundation (Feb 2026)~~
- ~~SATOR monorepo establishment~~
- ~~55 commits, 8 branches, MIT licensed~~
- ~~Database migrations (5 files)~~
- ~~FastAPI REST service~~

---

## IV. ACTIVE/CURRENT PHASES

### 1. Phase Alpha: Data Remediation [Foundation] 🔄
| Task | Status | ETA |
|------|--------|-----|
| Restore Files 6 & 7 | 🟡 Partial | Ongoing |
| Apply role-specific replacement levels | ✅ Complete | Done |
| Resolve RAR ranking anomalies | 🟡 In Progress | 2 weeks |
| Expand to 100+ players | 🔴 Open | 1 month |

### 2. Phase Beta: Formula Documentation [Logic] 🔄
| Task | Status | ETA |
|------|--------|-----|
| Document RAR formula chain | 🟡 In Progress | 2 weeks |
| Generate PMF lookup table | ✅ Complete | Done |
| Specify VORP calculation | 🟡 In Progress | 2 weeks |
| Document Investment Grade | 🟡 In Progress | 2 weeks |

### 3. Phase Gamma: Analytical Framework [Engine] 🔄
| Task | Status | ETA |
|------|--------|-----|
| ERWP Model training | 🔴 Planned | 2 months |
| RARD Ridge regression | 🔴 Planned | 1 month |
| Strokes Gained decomposition | 🔴 Planned | 2 months |
| Stabilization analysis | 🟡 In Progress | 2 weeks |

### 4. Phase Delta: Visualization [UI] 🔶
| Task | Status | ETA |
|------|--------|-----|
| Beautiful Monster Toolkit | 🔴 Planned | 6 weeks |
| Triple-Timeframe Dashboard | 🔴 Planned | 2 weeks |
| Stat-to-Replay linkage | 🔴 Planned | 1 week |

### 5. Phase Epsilon: Validation [Verification] 🔶
| Task | Status | ETA |
|------|--------|-----|
| Historical backtesting | 🔴 Planned | 2 weeks |
| Glicko-2 correlation | 🔴 Planned | 1 week |
| CA attribute calibration | 🔴 Planned | 2 weeks |

---

## V. ABANDONED/DEPRECATED APPROACHES

### ~~1. Single-Table Analytics Design~~
**Abandoned:** Q3 2025  
**Reason:** Could not support audit trails or derived metric regeneration. Led to data drift issues when source corrections were needed. Replaced with twin-table RAWS/BASE architecture.

### ~~2. HLTV-Only Data Strategy~~
**Abandoned:** Q4 2025  
**Reason:** HLTV robots.txt restrictions made comprehensive scraping untenable; unreliable unofficial API. Replaced with multi-source pipeline including VLR.gg, Steam API, GRID, and Riot API.

### ~~3. Ad-Hoc Quality Control~~
**Abandoned:** Q1 2025  
**Reason:** Inconsistent validation led to documented "Critical Gaps." Replaced with formal KCRITR 6-gate framework.

### ~~4. JavaScript-Only Visualization~~
**Abandoned:** Q4 2025  
**Reason:** Performance limitations for 5-layer SATOR Square visualization. Replaced with hybrid D3.js/WebGL approach.

### ~~5. Synchronous Data Pipeline~~
**Abandoned:** Q3 2025  
**Reason:** Rate limiting and network failures caused cascading failures. Replaced with async architecture using circuit breakers and exponential backoff.

---

## VI. KEY ARCHITECTURAL PIVOTS

### Pivot 1: From Pure Analytics to Dual-Platform Ecosystem

**Before:** Standalone analytics framework generating player ratings  
**After:** Integrated ecosystem:
- **RadiantX:** Offline deterministic tactical FPS (Godot 4 + C#)
- **SATOR Web:** Online public statistics platform (React + TypeScript)
- **Axiom Analytics:** Backend rating/ranking engine (Python)

**Rationale:** Game-generated data provides ground-truth validation for analytics models; analytics inform game balance. Creates sustainable feedback loop.

**Impact:** Repository scope expanded 3x; required new firewall architecture; enabled simulation-based validation.

---

### Pivot 2: From Valorant-First to Counter-Strike Priority

**Before:** Primary development on Valorant pipeline (VLR.gg scraper, 88,560 records)  
**After:** CS2 prioritized; Valorant in maintenance

**Rationale:**
- CS2 has 10+ years of historical data vs Valorant's 4 years
- HLTV provides more comprehensive stats
- User preference alignment
- Simpler role taxonomy (5 roles vs 4 + agents)

**Impact:** 2-week delay to establish HLTV pipeline; long-term data quality improvement.

---

### Pivot 3: From Single-Language to Polyglot Architecture

**Before:** Python-only stack  
**After:** 
- Python (data pipelines, analytics, API)
- C# (game simulation, combat resolution)
- GDScript (Godot game logic)
- TypeScript (web platform, visualization)

**Rationale:** Each component uses the right tool for its domain. Python for ML/data, C# for performance-critical simulation, TypeScript for type-safe web development.

**Impact:** Increased complexity but 10x performance improvement in simulation; type safety in web layer.

---

### Pivot 4: From Schema-on-Read to Strict Schema Enforcement

**Before:** Flexible JSON documents  
**After:** Strict 37-field schema with validation at ingestion

**Rationale:** Financial analytics require precision; schema drift breaks formula calculations; strict typing enables compile-time validation.

**Impact:** Slower ingestion (validation overhead); elimination of downstream data quality issues; enabled parity checking.

---

### Pivot 5: From Monolithic to Micro-Repository Architecture

**Before:** Single repository  
**After:** Monorepo with clear boundaries:
- `sator-workspace/shared/` — Common code
- `sator-workspace/apps/radiantx-game/` — Game
- `sator-workspace/apps/sator-web/` — Web platform
- `exe-directory/` — Service registry

**Rationale:** Independent deployment cadences; clear dependency boundaries; code ownership.

**Impact:** Enabled parallel development; required CI/CD pipeline updates; improved build times.

---

## VII. SYSTEM COMPONENT STATUS SUMMARY

### ✅ Implemented
| Component | Technology | Evidence |
|-----------|------------|----------|
| Forge Engine Combat | GDScript/C# | 38KB PMF lookup table; 15×15 dice pool resolution |
| RaycastDuelEngine | C# .NET | Geometry-respecting duels; sigma-based shot error |
| TTKDuelEngine | C# .NET | Rapid combat resolution for LOD switching |
| Three-Layer AI | GDScript | Operational/tactical/strategic hierarchy |
| Epoch Harvester | Python | 3-epoch architecture; CircuitBreaker pattern |
| Temporal Wall | Python | Overfitting guardrails; leakage detection |
| SATOR Square Viz | TSX/GLSL | 5-layer visualization scaffolded |
| Database Infrastructure | Docker/TimescaleDB | 5 migrations; 37-field schema |
| KCRITR Framework | Spreadsheet/Process | 6 data sheets; 6-gate quality control |
| VLR.gg Pipeline | Python | 88,560 validated player records |
| eXe Directory | Python/FastAPI | Service registry; health monitoring |
| Data Partition Firewall | TypeScript | FantasyDataFilter implementation |

### ⚠️ Partial Implementation
| Component | Issue | Next Step |
|-----------|-------|-----------|
| SimRating | Equal weights unvalidated vs HLTV 3.0 | Empirical calibration |
| RAR Pipeline | Formula chain partially documented | Complete specification |
| HLTV Pipeline | Client exists; full pipeline needed | CS integration |
| Analytics Engine | Normalizer needs production data | 100+ player records |
| Beautiful Monster UI | 10 design principles defined | Implementation pending |

### 🔶 Conceptual/Planned
| Component | Description | Dependency |
|-----------|-------------|------------|
| ERWP Model | P(round_win) = f(alive_diff, hp_diff, equipment) | Forge Engine training data |
| RARD | Ridge regression player isolation | Participation matrices |
| Strokes Gained Decomposition | Additive metrics by phase | ERWP baseline |
| 16 Agent Skills | Specialized AI agent definitions | Documentation |

---

## VIII. LESSONS LEARNED

1. **Schema Stability Pays Dividends:** The 37-field schema designed in Feb 2025 has required zero migrations despite significant feature additions. Over-engineering the data model upfront prevented downstream technical debt.

2. **Quality Frameworks Are Non-Negotiable:** The 5 Critical Gaps identified in early 2025 would have been catastrophic if discovered post-launch. KCRITR's independent review process is essential.

3. **Data > Algorithms:** 88,560 validated Valorant records taught more about player performance than any theoretical model. The shift to CS prioritization acknowledges that data volume trumps data novelty.

4. **Performance Requires Architectural Investment:** The 38KB PMF lookup table decision (sacrificing elegance for speed) enabled real-time simulation. Premature optimization was correct in this case.

5. **Firewalls Must Be Designed In, Not Bolted On:** The Data Partition Firewall required significant refactoring when added retroactively. Future architectures will include this from day one.

---

## IX. APPENDIX: DOCUMENT SOURCES

| Document ID | Name | Date | Grade | Key Contribution |
|-------------|------|------|-------|------------------|
| R001 | KCRITR Esports Analytics Review CRIT v1.0 | Feb 2025 | - | Framework quality control |
| R002 | Axiom Comprehensive Critical Review v2.0 | Feb 14, 2026 | B+ | Multi-document assessment |
| R003 | FEBRRR RadiantX Repository Assessment | Feb 26, 2026 | B+ | Technical verification |
| R004 | MDFv0 Project Overview w/Historical v3.0 | Feb 14, 2026 | - | Master chronicle |
| R013 | RAR Formula Specification | 2026 | - | Complete formula chain |
| R014 | KCRITR_FRAMEWORK_SSHEET.xlsx | 2026 | - | 39-field player database |
| R035 | SATOR Square Visualization Design | 2026 | - | 5-layer visualization |
| R039 | Twin Table Philosophy | 2026 | - | RAWS/BASE architecture |
| W001 | AXAS3 Code Data Analysis Report | Mar 4, 2026 | - | RAR calculator analysis |
| W002 | Legacy Document Analysis Report | Mar 4, 2026 | - | Historical decisions |
| W004 | Repository Gap Analysis | Mar 4, 2026 | - | 55% completion assessment |

---

*Dossier compiled under KCRITR Framework v1.0*  
*Total documents reviewed: 47*  
*Historical span: Q4 2024 - Q1 2026*  
*Repository: notbleaux/eSports-EXE*
