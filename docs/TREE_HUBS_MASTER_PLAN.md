[Ver001.000]

# TREE HUBS MASTER PLAN
## 4NJZ4 TENET Platform: World-Tree Architecture

**Source Commit:** 59460293 (March 18, 2026)  
**Source Branch:** docs: refine Tree Hubs plans, add reorg report, finalize tidying  
**Foreman:** Central coordinating node  
**Status:** Planning Phase  
**Last Updated:** 2026-03-23

---

## EXECUTIVE SUMMARY

This plan reimagines and restructures the Tree Hubs (World-Tree) architecture from the March 18, 2026 commit into a coherent, optimized development pipeline. The platform implements a **dual-layer architecture** with World-Base (data core) and NJZ-Base (artistic layer), spanning 5 interconnected HUB Trees.

### Core Concepts Extracted

| Concept | Description | Implementation |
|---------|-------------|----------------|
| **World-Base** | Core data layer | Twin-table, probability base, schemas |
| **NJZ-Base** | Artistic overlay | Motifs, SFX, clocks, glyphs, gardens |
| **World-Trees** | Per-game profiles | Graftable to TENET central hub |
| **Tree Grafting** | Cross-hub connectivity | Drag-drop linking, lensing views |
| **Quarterly Ports** | TENET dial system | 4-port modularity, NJZ vine connectors |

---

## DUAL-LAYER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NJZ-BASE (Artistic Layer)                     │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐      │
│  │   Motifs     │    SFX       │   Clocks     │   Gardens    │      │
│  │   (5 Arch)   │   (Toggle)   │ (Bases 1-120)│  (Vines)     │      │
│  └──────────────┴──────────────┴──────────────┴──────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│                       WORLD-BASE (Data Core)                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Twin-Table Pattern: Raw Data → Processed/Enriched           │   │
│  │  Probability Base: EV, EVR, Simulation Inputs                │   │
│  │  Schema Layer: VLR, HLTV, Pandascore mappings                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5 WORLD-TREE HUBS

### 1. SATOR Tree (Observatory) - Flagship: Advanced Visualization

**Core Function:** Stats engine, heatmaps, ratings (VLR+ standards)

**Refined Features:**
| Feature | Description | Tech Stack |
|---------|-------------|------------|
| Stats Engine | Real-time player/team statistics | Recharts + D3 |
| Heatmaps | Position-based performance viz | Three.js/WebGL |
| Ratings | 13-19 scale (VLR standard) | Custom algorithm |
| Auto-Export | PNG/SVG generation | Canvas API |
| Lens Grafting | SATOR/ROTAS sim-viz link | Zustand sync |
| NJZ Metrics | Flower bloom animations | Framer Motion |

**Implementation Spec:**
- 10+ leaderboard panels
- Player deep-dive profiles
- ML prediction integration
- Data pipeline connection

**QoL Features:**
- Keyboard shortcuts (1-9 panel nav)
- Search/filter with autocomplete
- Export to PNG/PDF
- Grafting overlay with ROTAS

---

### 2. ROTAS Tree (Harmony) - Flagship: Theoretical Simulations

**Core Function:** Offline probabilities, EVP/EVR, GM progression

**Refined Features:**
| Feature | Description | Tech Stack |
|---------|-------------|------------|
| Offline Probs | Match outcome predictions | Monte Carlo |
| EVP/EVR | Expected Value Prob/Range | Logistic regression |
| FM-GM Modes | Scout→Analyst→Coach→Manager→Director→Owner | Godot embed |
| Wild Roulette | 13-slot turbulence toggle | RNG engine |
| Podcast Gen | Auto-generated commentary | TTS + templates |

**GM Mode Progression:**
```
Level 1: SCOUT      → Player discovery, basic stats
Level 2: ANALYST    → Advanced metrics, heatmap analysis
Level 3: COACH      → Team composition, tactics
Level 4: MANAGER    → Roster decisions, schedules
Level 5: DIRECTOR   → Strategic planning, org growth
Level 6: OWNER      → Financial control, expansion
```

**Implementation Spec:**
- Godot embed + HTML5 Canvas
- Grafting with SATOR stats
- Theoretical trading integration
- Narrative engine for emergent stories

**QoL Features:**
- Difficulty toggles (Casual/Pro/Expert)
- Auto-save progression
- Voice selection (PlatChat-style)

---

### 3. AREPO Tree (Control) - Flagship: Tri-Split Lensing

**Core Function:** Modularity, multi-view control, drag-graft Trees

**Refined Modularity:**
| Mode | Description | Use Case |
|------|-------------|----------|
| General | Overview dashboard | First-time users |
| Focused | Tri-view split (3 panels) | Power users |
| Game-Focus | Expandable sub-focus | Deep analysis |

**Refined Features:**
| Feature | Description | Tech Stack |
|---------|-------------|------------|
| Drag-Graft | Connect AREPO to OPERA/others | React DnD |
| Zoom/Sync | Linked view synchronization | Zustand |
| Port Slots | Modular panel system | TanStack Virtual |
| NJZ Vines | Visual connection physics | Canvas/Three.js |

**Implementation Spec:**
- Virtual scrolling for large datasets
- Port slot architecture (hot-swappable)
- All hubs integration
- World selector navigation

**QoL Features:**
- View state persistence
- One-click layout presets
- Splitter resize with live preview

---

### 4. OPERA Tree (Action) - Flagship: Betting & Fantasy

**Core Function:** Odds calculation, Reserve Bank, fantasy leagues

**Refined Features:**
| Feature | Description | Tech Stack |
|---------|-------------|------------|
| Odds Calc | Real-time probability→odds | EV engine |
| Reserve Bank | Token circulation system | Supabase + Redis |
| Play Tokens | Paper trading currency | Token ledger |
| Fantasy Leagues | Auto-generated contests | Matchmaking |
| Bot Watch | Observer mode for AI trades | WebSocket |
| EV Alerts | Notification system | Push API |

**Implementation Spec:**
- Real-time WebSocket updates
- Grafting with AREPO data feeds
- Betting sim integration
- Token circulation metrics

**QoL Features:**
- One-click bet placement
- Fantasy auto-draft
- Bot trading strategies (watch/learn)
- EV threshold alerts

---

### 5. TENET Tree (Central Network) - Flagship: Modularity Hub

**Core Function:** Central connectivity, dial system, cross-Tree grafting

**Refined Features:**
| Feature | Description | Tech Stack |
|---------|-------------|------------|
| Dial/Cog | NJZ SFX toggle, glyph spinner | Framer Motion |
| Quarterly Ports | 4-port connection system | React DnD |
| Drag-Drop Graft | Visual Tree linking | Physics engine |
| Connectivity Diagnostics | Network health monitoring | Ping API |
| World-Tree Switcher | Game profile selector | Zustand |
| QoL Search | Global hub search | Fuse.js |
| Export/Share | Link generation | URL encoding |

**Dial/Cog System:**
```
Symbols: ? j i ! . • I l L r R P p Q q T H
Backwards: L/E/P/Q/R/C/b/a/A
Upside: T o O 0 s S z Z n N x X v V g G

Function: Toggle all NJZ-BASE SFX on/off
Animation: Spinning cog with glyph cycle
```

**Implementation Spec:**
- Central Zustand store
- Dynamic grafting (SATOR-OPERA-ROTAS combos)
- Lensing views (multi-Tree overlays)
- Vine/physics connections between ports

**QoL Features:**
- Global keyboard shortcuts
- Search across all Trees
- Share links with state encoding
- Connectivity status indicators

---

## WORLD-TREE GRAFTING SYSTEM

### Grafting Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GRAFTING LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 3: Visual (NJZ Vines)                                │
│  ├── Physics-based connections                              │
│  ├── Vine growth animations                                 │
│  └── Flower bloom on data sync                              │
│                                                              │
│  LAYER 2: Data (Zustand Sync)                               │
│  ├── Shared state slices                                    │
│  ├── Cross-Tree selectors                                   │
│  └── Real-time synchronization                              │
│                                                              │
│  LAYER 1: Structural (Port System)                          │
│  ├── Input/Output ports per Tree                            │
│  ├── Type-safe connections                                  │
│  └── Hot-swap capability                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Grafting Patterns

| Pattern | Trees | Use Case |
|---------|-------|----------|
| **SATOR-ROTAS** | Stats + Sims | Visualize theoretical predictions |
| **AREPO-OPERA** | Control + Action | Place bets on filtered views |
| **ROTAS-OPERA** | Sims + Betting | Test strategies with fake money |
| **Full Combo** | All 5 | Complete analytics→action pipeline |

---

## SUB-AGENT WAVE ORGANIZATION

### WAVE 1: World-Base Foundation (3 Agents)
**Objective:** Data layer, twin-table, schemas

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **W1-Data** | Twin-table architecture | Raw/processed table schemas |
| **W2-Schema** | VLR/HLTV mappings | API adapters, data models |
| **W3-Prob** | Probability base | EV/EVP/EVR engines |

### WAVE 2: NJZ-Base Artistic Layer (3 Agents)
**Objective:** Motifs, SFX, clocks, gardens

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **N1-Motifs** | 5 archetype system | BOY/GIRL/ANDRO/NON-BIN/FLUID |
| **N2-Clock** | TENET Dial Cog | Glyph spinner, SFX toggle |
| **N3-Garden** | Vine physics | Flower SFX, garden animations |

### WAVE 3: SATOR + ROTAS Trees (3 Agents)
**Objective:** Observatory + Harmony hubs

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **S1-SATOR** | Advanced viz | Heatmaps, ratings, leaderboards |
| **S2-ROTAS** | GM modes | 6-level progression, roulette |
| **S3-Sim** | Godot embed | FM-GM integration, podcasts |

### WAVE 4: AREPO + OPERA Trees (3 Agents)
**Objective:** Control + Action hubs

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **A1-AREPO** | Tri-split lensing | Modularity, drag-graft |
| **A2-OPERA** | Betting system | Odds, Reserve Bank, fantasy |
| **A3-Ports** | Port slot system | Hot-swap, connections |

### WAVE 5: TENET Central + Grafting (2 Agents)
**Objective:** Central hub, connectivity, testing

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **T1-TENET** | Central network | Dial, ports, search, share |
| **T2-Graft** | Grafting system | Vines, physics, sync |

---

## SUB-AGENT WORKFLOW PROTOCOL

### Phase 1: Conceptualization (Foreman-Led)
1. **Foreman** extracts concepts from source commit
2. **Foreman** drafts initial implementation approach
3. **Foreman** assigns agents with conceptual briefs

### Phase 2: Drafting (Agent Work)
1. **Agent** receives conceptual brief from Foreman
2. **Agent** drafts implementation plan (not code)
3. **Agent** submits draft to Foreman for review

### Phase 3: Foreman Review & Update
1. **Foreman** reviews agent draft
2. **Foreman** identifies optimizations, errors, improvements
3. **Foreman** updates plan with corrections
4. **Foreman** returns updated plan to agent

### Phase 4: Implementation (Agent Work)
1. **Agent** follows updated plan (not original draft)
2. **Agent** implements with sub-reports to Foreman
3. **Agent** submits implementation for review

### Phase 5: Foreman Verification (2-Pass)
1. **Pass 1:** Read-only verification against checklist
2. **Pass 2:** Final proof-read and optimization
3. **Foreman** approves or requests changes

### Phase 6: Final Documentation
1. **Agent** provides final report with 3 recommendations
2. **Foreman** compiles wave report
3. **Foreman** proceeds to next wave

---

## QUALITY GATES

### Gate 1: Concept Approval (Foreman)
- [ ] World-Base/NJZ-Base separation defined
- [ ] 5 Tree architectures documented
- [ ] Grafting system specified
- [ ] Agent assignments confirmed

### Gate 2: Draft Approval (Foreman)
- [ ] Agent draft received
- [ ] Plan reviewed for errors/optimizations
- [ ] Updated plan returned to agent

### Gate 3: Implementation Check (Foreman)
- [ ] Code follows updated plan
- [ ] No deviations from approved approach
- [ ] Sub-reports submitted regularly

### Gate 4: Final Verification (Foreman)
- [ ] Read-only pass completed
- [ ] File locations verified
- [ ] Code quality checked
- [ ] 3 recommendations provided

### Gate 5: Wave Completion (Foreman)
- [ ] All agents in wave completed
- [ ] Wave report compiled
- [ ] Next wave prepared

---

## TIMELINE ESTIMATE

| Wave | Duration | Agents | Effort | Focus |
|------|----------|--------|--------|-------|
| Wave 1: World-Base | 3 days | 3 | 36h | Data layer |
| Wave 2: NJZ-Base | 3 days | 3 | 36h | Artistic layer |
| Wave 3: SATOR/ROTAS | 4 days | 3 | 48h | Observatory/Harmony |
| Wave 4: AREPO/OPERA | 4 days | 3 | 48h | Control/Action |
| Wave 5: TENET/Graft | 3 days | 2 | 24h | Central/Integration |
| **Total** | **17 days** | **14** | **192h** | **All** |

---

## RISK MITIGATION

| Risk | Mitigation | Owner |
|------|------------|-------|
| Agent deviates from plan | Daily sub-reports, redirect if needed | Foreman |
| Code quality issues | 2-pass foreman verification | Foreman |
| Scope creep | Strict Tree boundaries | Foreman |
| Grafting complexity | Prototype Layer 1 first | Foreman |
| Performance degradation | 60fps audit gate | Agent T2 |

---

## DOCUMENT CONTROL

**Version:** 001.000  
**Last Updated:** 2026-03-23  
**Next Review:** Upon wave initiation  
**Owner:** Foreman Agent  
**Distribution:** All sub-agents, stakeholders

### Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 001.000 | 2026-03-23 | Initial master plan from commit 59460293 | Foreman |

---

**END OF TREE HUBS MASTER PLAN**
