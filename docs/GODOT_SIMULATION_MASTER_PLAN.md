[Ver001.000]

# GODOT SIMULATION MASTER PLAN
## 4NJZ4 TENET Platform: Offline Game & 3D Viewer

**Source Commit:** 9789f2c2 (March 18, 2026)  
**Source Branch:** feat(godot): NJZ UI, 3D holo viewer, ROTAS integration, calendar mgmt, eSports history DB, sim review/enhancements  
**Foreman:** Central coordinating node  
**Status:** Planning Phase  
**Last Updated:** 2026-03-23

---

## EXECUTIVE SUMMARY

This plan reimagines and restructures the Godot Simulation development from the March 18, 2026 commit into a coherent, optimized 6-phase pipeline. The platform implements a **high-fidelity VAL/CS2 simulation** with NJZ artistic UI, 3D holographic viewer, GM management suite, and comprehensive eSports history database spanning 1995-2026.

### Core Concepts Extracted

| Concept | Description | Implementation |
|---------|-------------|----------------|
| **95% Accuracy** | VAL/CS2 toy-model simulation | Head multipliers, recoil/spread matching |
| **NJZ UI** | 5-archetype artistic interface | TENET cog, vines, bubbles, ripple shaders |
| **3D Holo Viewer** | Holographic replay system | Physics-based, materialized animations |
| **ROTAS Integration** | Proprietary analysis formulas | Offline/online dual mode |
| **Calendar Manager** | FM/NBA2k MyGM-style scheduling | Events, training, card deck system |
| **eSports History DB** | 1995-2026 archive | HLTV, Liquipedia, NJZ verification |

---

## 6-PHASE ARCHITECTURE

```
PHASE 1: Foundation & Review ✅ COMPLETE
├── Godot sim baseline tests
├── CRIT documentation
├── Deterministic RNG verification
└── 20TPS tick system validation

PHASE 2: NJZ UI/UX Integration 🔄 PLANNED
├── TENET Cog SFX toggle
├── Bubble/ripple shaders
├── Vine motifs on panels
├── 5 archetype visuals
└── Accessibility/FPS testing

PHASE 3: Lensing & Stress Layers ⬜ PLANNED
├── Multi-layer lens system
├── In-game stress toggles
├── Metrics tracking
└── WebSocket online stub

PHASE 4: Management Suite (FM/GM) ⬜ PLANNED
├── GM progression (Scout→Owner)
├── Staff hiring/contracts
├── Tactics board editor
├── Press conference sim
└── Procedural narratives

PHASE 5: War/Combat Suite ⬜ PLANNED
├── Large-scale war mode
├── Fog of war expansion
├── Pit/eco strategy layers
└── 31-game mechanic integrations

PHASE 6: Monitoring & Export ⬜ PLANNED
├── JLB cron dashboard
├── Full test suite
├── Export formats
└── Deployment pipeline
```

---

## CORE SYSTEMS

### 1. Simulation Core (95% Accuracy)

**Tick System:**
```gdscript
# 20 TPS with sub-tick interpolation
const TICK_RATE: int = 20
const DELTA_TIME: float = 0.05  # 1/20 second

var tick_counter: int = 0
var rng_seed: int = 0  # Deterministic

func _physics_process(delta: float):
    tick_counter += 1
    process_simulation_tick()
```

**Weapon Mechanics:**
| Mechanic | Implementation | Source |
|----------|---------------|--------|
| Head multiplier | 4x damage | VAL/CS2 wiki |
| Recoil pattern | Per-weapon curves | Official specs |
| Spread | First-shot accuracy | Community testing |
| Utility duration | Smokes 15s, flashes LOS | Official |

**Deterministic Features:**
- Seeded RNG for replayability
- Identical outcomes given same inputs
- Reproducible for analysis/ML training

---

### 2. NJZ UI System

**TENET Cog Component:**
```gdscript
class_name NJZCog
extends Control

# Spinning glyph dial
var glyphs: Array[String] = [
    '?', 'j', 'i', '!', '.', '•', 'I', 'l', 'L',
    'r', 'R', 'P', 'p', 'Q', 'q', 'T', 'H'
]

func toggle_sfx():
    # Global SFX on/off
    sfx_enabled = not sfx_enabled
    emit_signal("sfx_toggled", sfx_enabled)
```

**5-Archetype Visuals:**
| Archetype | Visual Style | Animation |
|-----------|-------------|-----------|
| BOY | Structured, geometric | Sharp movements |
| GIRL | Flowery, organic | Blooming SFX |
| ANDRO | Hybrid, balanced | Dual-nature transitions |
| NON-BIN | Mirror/flip | Fluid transitions |
| FLUID | Upside-down, morphing | Shape-shifting |

**Shader Effects:**
- **Bubbles**: RNG spawn, float physics
- **Ripples**: Click-triggered, propagate outward
- **Vines**: Growth animation on panel borders

---

### 3. 3D Holographic Viewer

**Viewer3D Features:**
```gdscript
class_name Viewer3D
extends Node3D

# Holographic material properties
var holographic_shader: ShaderMaterial
var agents_3d: Dictionary = {}  # agent_id -> Node3D

func add_agent_3d(agent_id: int, pos: Vector3):
    var agent_node = RigidBody3D.new()
    agent_node.linear_damp = 0.8   # Materialized feel
    agent_node.angular_damp = 0.9
    
    # Holo effect mesh
    var mesh = MeshInstance3D.new()
    mesh.material_override = holographic_shader
    agent_node.add_child(mesh)
    
    agents_3d[agent_id] = agent_node
```

**Metrics Tracking:**
```gdscript
var metric_tracker: Dictionary = {
    'spatial_fps': [],           # FPS samples
    'agent_positions': [],        # Position history
    'combat_events': 0,           # Engagement count
    'utility_deployed': 0         # Grenades/smokes
}
```

**Features:**
- 3D/2.5D holographic replay
- Physics-based materialized animations
- Camera controls (orbit, zoom, follow)
- Heatmap overlay
- Spatial audio

---

### 4. ROTAS Integration

**Dual-Mode Analysis:**
```gdscript
class_name RotasIntegration
extends Node

var offline_formulas: Dictionary = {
    'kd_expected': 'kills / (deaths + 1)',
    'headshot_rate': 'headshots / shots * 100',
    'eco_efficiency': 'rounds_won_no_buy / eco_rounds'
}

var online_endpoint: String = 'https://sator-api.onrender.com/api/rotas'

func get_analysis(match_data: Dictionary) -> Dictionary:
    if is_online:
        return await _fetch_online_analysis(match_data)
    else:
        return _compute_offline_analysis(match_data)
```

**Fallback Strategy:**
1. Try online API for advanced stats
2. Fallback to offline formulas
3. Cache results for replay

**Analysis Types:**
- Basic: K/D, HS%, ADR
- Advanced: Clutch rate, entry success, trade efficiency
- Economic: Eco round win rate, buy efficiency

---

### 5. Calendar Manager (FM/MyGM Style)

**Event System:**
```gdscript
class_name CalendarManager
extends Control

enum ScheduleEvent { MATCH, TRAINING, MEETING, OPPORTUNITY }

var current_date: int = 0
var weekly_events: Array = []
var player_cards: Dictionary = {}

class Card:
    var type: String  # 'passive', 'structure', 'tag'
    var name: String
    var effect: String  # '+10% aim during clutch'
    var playstyle_tag: String
```

**Card Deck System:**
- Players collect cards through training
- Cards provide passive bonuses
- Deck building for match strategy
- Tag system (aggressive, support, clutch)

**Schedule Types:**
| Event | Effect | Frequency |
|-------|--------|-----------|
| Match | Scrim/competitive | 3-5x weekly |
| Training | Card acquisition | Daily |
| Meeting | Team cohesion | Weekly |
| Opportunity | Sponsors/transfers | Random |

---

### 6. eSports History Database (1995-2026)

**Schema Design:**
```sql
-- Events table
CREATE TABLE esports_events (
    id SERIAL PRIMARY KEY,
    game VARCHAR(10),              -- 'CS' or 'VAL'
    name VARCHAR(255),
    date DATE,
    type VARCHAR(50),              -- 'Major', 'League'
    prize_usd BIGINT,
    winner_team VARCHAR(100),
    mvp_player VARCHAR(100),
    map_pool JSONB,                -- ['Ascent', 'Bind']
    stats JSONB,                   -- {'kd_ratio': 1.2}
    recordings JSONB,              -- ['hltv_url']
    verified_by VARCHAR(50) DEFAULT 'NJZ'
);

-- Legacy stats (yearly aggregates)
CREATE TABLE legacy_stats (
    year INT CHECK (year >= 1995 AND year < 2026),
    game_version VARCHAR(50),
    total_matches INT,
    top_players JSONB,
    iconic_moments JSONB
);
```

**Data Sources:**
1. HLTV.org CS archive (1.6→CS2)
2. Liquipedia VAL (VCT 2021+)
3. Official Valve/RIOT schedules
4. NJZ verification scripts

**Integration:**
- Load historical matches for replay
- Train ML models on past data
- Compare current events to history

---

## SUB-AGENT WAVE ORGANIZATION

### WAVE 1: Core Systems Review (3 Agents)
**Objective:** Verify foundation, deterministic RNG, 20TPS

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **C1-SimCore** | Simulation core review | Tick system, weapon mechanics |
| **C2-Determinism** | RNG verification | Seed system, replay tests |
| **C3-Performance** | FPS optimization | 60fps target, profiling |

### WAVE 2: NJZ UI Integration (3 Agents)
**Objective:** TENET cog, shaders, 5 archetypes

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **N1-Cog** | TENET Cog system | SFX toggle, spinning glyphs |
| **N2-Shaders** | Visual effects | Bubble, ripple, vine shaders |
| **N3-Archetypes** | 5-archetype visuals | BOY/GIRL/ANDRO/NON-BIN/FLUID |

### WAVE 3: 3D Viewer & ROTAS (3 Agents)
**Objective:** Holo viewer, analysis integration

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **V1-Viewer3D** | 3D holographic viewer | Physics, materials, metrics |
| **V2-ROTAS** | ROTAS integration | Online/offline analysis |
| **V3-Replay** | Replay system | Historical match loading |

### WAVE 4: Management Suite (3 Agents)
**Objective:** Calendar, cards, GM progression

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **M1-Calendar** | Calendar system | Events, scheduling, phone UI |
| **M2-Cards** | Card deck system | Training, deck building |
| **M3-GMMode** | GM progression | Scout→Owner, narratives |

### WAVE 5: History DB & War Mode (2 Agents)
**Objective:** eSports DB, war/combat suite

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **H1-HistoryDB** | eSports history | 1995-2026 data, verification |
| **H2-WarMode** | Large-scale combat | Fog of war, 31 mechanics |

### WAVE 6: Testing & Deployment (2 Agents)
**Objective:** Testing, export, deployment

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **T1-Testing** | Test suite | Unit tests, integration tests |
| **T2-Deploy** | Export & deploy | Builds, CI/CD, dashboard |

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
- [ ] 6-phase architecture defined
- [ ] Core systems documented
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

| Wave | Duration | Agents | Effort | Phase |
|------|----------|--------|--------|-------|
| Wave 1: Core Review | 2 days | 3 | 24h | 1 |
| Wave 2: NJZ UI | 3 days | 3 | 36h | 2 |
| Wave 3: 3D/ROTAS | 3 days | 3 | 36h | 3 |
| Wave 4: Management | 3 days | 3 | 36h | 4 |
| Wave 5: History/War | 3 days | 2 | 24h | 5 |
| Wave 6: Testing | 2 days | 2 | 16h | 6 |
| **Total** | **16 days** | **16** | **172h** | **All** |

---

## RISK MITIGATION

| Risk | Mitigation | Owner |
|------|------------|-------|
| Agent deviates from plan | Daily sub-reports, redirect if needed | Foreman |
| Code quality issues | 2-pass foreman verification | Foreman |
| Scope creep | Strict phase boundaries | Foreman |
| Performance issues | FPS audit gate | Agent C3 |
| Determinism failure | Replay test suite | Agent C2 |

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
| 001.000 | 2026-03-23 | Initial master plan from commit 9789f2c2 | Foreman |

---

**END OF GODOT SIMULATION MASTER PLAN**
