[Ver001.000]

# Sub-Agent Scouting Plan & Technical Coordination Framework

**Date:** 2026-03-30  
**Role:** Technical Lead / Foreman  
**Mission:** Execute comprehensive investigation and Rust simulation migration

---

## EXECUTIVE COMMAND STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TECHNICAL LEAD (YOU)                                 │
│              ┌──────────────┬──────────────┬──────────────┐                 │
│              │   AGENT A    │   AGENT B    │   AGENT C    │                 │
│              │   (Scout)    │  (Architect) │   (Builder)  │                 │
│              └──────┬───────┴──────┬───────┴──────┬───────┘                 │
│                     │              │              │                          │
│              Godot Audit    Rust Design    Implementation                    │
│              Path A/B       Engine Core      WebSocket Bridge                │
│              Integration    Determinism      Python Bindings                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: GODOT SIMULATION SCOUTING REPORT

### Agent A Assignment: Deep Godot Audit

**Task:** Comprehensive audit of existing Godot simulation engine
**Duration:** 2-3 hours  
**Deliverable:** `SCOUTING_REPORT_GODOT.md`

#### Scouting Checklist (5 Critical Areas)

**1. Core Engine Architecture**
- [ ] Document `MatchEngine.gd` tick processing loop
- [ ] Map `Agent.gd` decision-making algorithm
- [ ] Catalog `EventLog.gd` serialization format
- [ ] Identify all deterministic vs. non-deterministic operations
- [ ] List all external dependencies (network, file I/O)

**2. Weapon & Combat System**
- [ ] Extract weapon definitions from `Defs/weapons/weapons.json`
- [ ] Document damage calculation formula
- [ ] Map spread/recoil algorithms
- [ ] Validate against CS:GO/Valorant official stats
- [ ] Identify RNG usage in combat resolution

**3. Map & Geometry System**
- [ ] Analyze `MapData.gd` structure
- [ ] Document `training_ground.json` schema
- [ ] Identify line-of-sight algorithm
- [ ] Catalog smoke grenade physics
- [ ] List all map-related calculations

**4. ROTAS Integration Points**
- [ ] Document `RotasIntegration.gd` API contract
- [ ] Map offline formula implementations
- [ ] Identify online webhook endpoints
- [ ] Catalog fallback mechanisms
- [ ] Document analysis data flow

**5. Test Coverage & Validation**
- [ ] Locate all test files in `tests/`
- [ ] Document deterministic replay capability
- [ ] Identify floating-point precision risks
- [ ] Catalog seeded RNG usage
- [ ] List all edge cases handled

#### Scout Deliverable Format

```markdown
## Scout Report: Godot Simulation Engine

### Section 1: Executive Summary
- Lines of GDScript: [count]
- Core modules: [list]
- External dependencies: [list]
- Determinism confidence: [high/medium/low]

### Section 2: Porting Complexity Matrix
| Component | Complexity | Priority | Rust Approach |
|-----------|-----------|----------|---------------|
| MatchEngine | High | P0 | Port 1:1 |
| Agent AI | Medium | P1 | Simplify |
| Weapon System | Low | P0 | Port 1:1 |
| Map Geometry | High | P1 | Use Rapier |

### Section 3: Critical Findings
- [List blockers, risks, opportunities]

### Section 4: Migration Estimate
- Effort: [hours]
- Risk: [high/medium/low]
- Dependencies: [list]
```

---

## PHASE 2: RUST SIMULATION ENGINE ARCHITECTURE

### Agent B Assignment: Rust Core Design

**Task:** Design deterministic Rust simulation engine with Python bindings  
**Duration:** 4-6 hours  
**Deliverable:** `RUST_SIMULATION_DESIGN.md` + scaffolding PR

#### Design Requirements (From Context)

**1. Zero-Budget Stack**
```toml
# Cargo.toml
[dependencies]
rapier2d = "0.18"           # MIT - Physics engine
pyo3 = { version = "0.21", features = ["extension-module"] }  # Apache-2.0
rayon = "1.9"               # MIT - Parallelism
fixed = "1.24"              # MIT/Apache-2.0 - Fixed-point
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

**2. Performance Targets**
| Metric | Target | Godot Baseline |
|--------|--------|----------------|
| Single simulation | <1ms | ~10ms |
| 10K Monte Carlo | <500ms | ~100s |
| Parallel efficiency | 80%+ | N/A (single-threaded) |
| Memory per sim | <1MB | ~10MB |

**3. Determinism Guarantees**
- Fixed-point arithmetic for all coordinates
- Seeded RNG with reproducible sequences
- Deterministic iteration ordering
- Cross-platform hash verification
- Replay serialization format

#### Architecture Blueprint

```rust
// Core modules
src/
├── lib.rs                    # PyO3 module exports
├── deterministic/
│   ├── mod.rs               # Fixed-point types
│   ├── rng.rs               # Seeded RNG
│   └── hash.rs              # State hashing
├── physics/
│   ├── mod.rs               # Rapier integration
│   ├── map.rs               # Map geometry
│   └── collision.rs         # Line-of-sight
├── agents/
│   ├── mod.rs               # Agent definitions
│   ├── ai.rs                # Decision making
│   └── beliefs.rs           # Partial observability
├── combat/
│   ├── mod.rs               # Combat resolution
│   ├── weapons.rs           # Weapon definitions
│   └── damage.rs            # Damage calculation
├── simulation/
│   ├── mod.rs               # Simulation runner
│   ├── engine.rs            # MatchEngine equivalent
│   ├── tick.rs              # Tick processing
│   └── events.rs            # Event logging
└── monte_carlo/
    ├── mod.rs               # Parallel execution
    ├── outcomes.rs          # Result aggregation
    └── strategies.rs        # Strategy parameterization
```

#### Python API Design

```python
# Python consumer (FastAPI endpoint)
import njz_simulation_rust as sim

@app.post("/simulate/monte-carlo")
async def run_monte_carlo(params: SimParams):
    """
    10K iterations in <500ms vs 100s via Godot bridge
    """
    result = sim.monte_carlo_outcomes(
        map_layout=params.map_layout,
        team_a=params.team_a,
        team_b=params.team_b,
        iterations=10_000,
        strategy_space=params.strategies
    )
    return {
        "win_probability": result.win_probability,
        "expected_rounds": result.expected_rounds,
        "confidence_interval": result.ci_95,
        "hash": result.determinism_hash  # For verification
    }
```

---

## PHASE 3: SEPARATE REPOSITORY SETUP

### Repository Structure

**Decision:** Create `github.com/notbleaux/njz-simulation-engine` (separate repo)

**Rationale:**
- Rust build times are long (separate CI prevents blocking web builds)
- PyO3 requires Python headers (complex dependency)
- Versioning independent from web platform
- Can be used by other projects (open-source core)

#### Repository Layout

```
njz-simulation-engine/
├── .github/
│   └── workflows/
│       ├── rust.yml          # Rust CI (test, clippy, build)
│       └── python-release.yml # Build wheels for PyPI
├── crates/
│   └── njz-sim-core/         # Core simulation library
│       ├── Cargo.toml
│       └── src/
├── bindings/
│   └── python/               # PyO3 bindings
│       ├── Cargo.toml
│       ├── src/lib.rs
│       └── njz_simulation.pyi  # Type stubs
├── benches/                  # Criterion benchmarks
├── tests/
│   ├── determinism/          # Replay verification tests
│   ├── monte_carlo/          # Performance tests
│   └── integration/          # Python binding tests
├── examples/
│   ├── monte_carlo_cli.rs    # CLI example
│   └── python_client.py      # Python usage example
├── docs/
│   ├── ARCHITECTURE.md
│   └── DETERMINISM.md
├── Cargo.toml                # Workspace root
├── pyproject.toml            # Maturin build config
└── README.md
```

#### CI/CD Pipeline

```yaml
# .github/workflows/rust.yml
name: Rust CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test --all-features
      - run: cargo clippy --all-targets --all-features -- -D warnings
      - run: cargo test --benches  # Ensure benchmarks run

  determinism:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test determinism --features test-determinism
      # Runs 100 simulations with same seed, verifies identical hashes
```

---

## COORDINATION PROTOCOL

### Async Agent Communication

**Tool:** File-based coordination in `.agents/coordination/`

```
.agents/coordination/
├── SCOUTING_STATUS.md        # Live status updates
├── BLOCKERS.md               # Cross-agent dependencies
├── DECISIONS.md              # Architecture decisions
└── artifacts/                # Shared files
    ├── godot-export.json     # Scout export
    ├── rust-design.md        # Architect export
    └── benchmarks.json       # Performance results
```

#### Status Update Format

```markdown
## Agent A (Scout) - Update 2026-03-30 14:30 UTC

**Status:** 🟡 IN PROGRESS - 60% complete

**Completed:**
- ✅ Core Engine Architecture documented
- ✅ Weapon System cataloged
- 🔄 Map System in progress

**Blockers:**
- None

**Next:** ROTAS Integration analysis (ETA 30 min)

**Artifacts:**
- [Link to godot-export.json]
```

### Decision Log

| ID | Decision | Agent | Status | Impact |
|----|----------|-------|--------|--------|
| D001 | Use Rapier vs custom physics | B | PENDING | High |
| D002 | Fixed-point precision (32 vs 64 bit) | B | PENDING | High |
| D003 | Separate repo vs monorepo | Lead | APPROVED | High |

### Conflict Resolution

**Rule:** If agents disagree on architecture:
1. Both write up positions (max 500 words)
2. Technical lead decides within 2 hours
3. Decision logged in DECISIONS.md
4. Disagreeing agent implements decision (no veto)

---

## INVESTIGATION METHODOLOGY

### Deep Research Protocol

**For Complex Components (e.g., Determinism):**

1. **Literature Review**
   - Search: "deterministic game simulation fixed-point"
   - Reference: OpenAI Dota 2 bot (C++ determinism)
   - Reference: Fighting game rollback netcode

2. **Code Archaeology**
   - Trace all RNG usage in Godot codebase
   - Identify all floating-point operations
   - Map all external I/O (file, network, time)

3. **Prototype Validation**
   - Build minimal Rust prototype
   - Run 1000 simulations with same seed
   - Verify hash collision rate

4. **Documentation**
   - Write ADR (Architecture Decision Record)
   - Include benchmark results
   - Document trade-offs

### Scouting Report Template

```markdown
# Scout Report: [Component Name]

## 1. Discovery
- Location: [file paths]
- Lines of code: [count]
- Dependencies: [list]

## 2. Functionality
- Purpose: [description]
- Key algorithms: [list]
- Edge cases: [list]

## 3. Porting Analysis
| Aspect | Complexity | Notes |
|--------|-----------|-------|
| Logic | Low/Med/High | [notes] |
| Dependencies | Low/Med/High | [notes] |
| Testing | Low/Med/High | [notes] |

## 4. Risk Assessment
- [List risks and mitigations]

## 5. Recommendation
- [Port/Simplify/Replace/Keep in Godot]
```

---

## TIMELINE & MILESTONES

### Week 1: Scouting & Design

| Day | Agent | Task | Deliverable |
|-----|-------|------|-------------|
| 1 | A | Godot core audit | SCOUTING_REPORT_GODOT.md |
| 2 | A | Map/weapon analysis | Component breakdown |
| 3 | B | Rust architecture design | ARCHITECTURE.md |
| 4 | B | PyO3 binding design | API contract |
| 5 | Lead | Review & approve | Approved design |

### Week 2: Repository Setup

| Day | Agent | Task | Deliverable |
|-----|-------|------|-------------|
| 1 | C | Create repo structure | github.com/njz-sim-engine |
| 2 | C | CI/CD setup | Working pipelines |
| 3 | B | Core types implementation | deterministic/ module |
| 4 | B | Physics integration | Rapier setup |
| 5 | C | Python bindings scaffold | import njz_simulation works |

### Week 3: Implementation

| Day | Agent | Task | Deliverable |
|-----|-------|------|-------------|
| 1-3 | B+C | Port weapon system | Weapon definitions |
| 4-5 | B+C | Port Agent AI | Decision making |

### Week 4: Integration

| Day | Agent | Task | Deliverable |
|-----|-------|------|-------------|
| 1-2 | C | WebSocket bridge | Godot ↔ Rust communication |
| 3-4 | B | Monte Carlo parallel | Rayon implementation |
| 5 | All | Integration testing | End-to-end demo |

---

## SUCCESS CRITERIA

### Scout (Agent A)
- [ ] Complete Godot codebase documented
- [ ] Porting complexity matrix completed
- [ ] All blockers identified with mitigations
- [ ] Report < 2000 words, actionable

### Architect (Agent B)
- [ ] Rust design approved by lead
- [ ] Determinism guarantees documented
- [ ] Performance targets justified
- [ ] All decisions logged

### Builder (Agent C)
- [ ] Repository builds on Linux/Mac/Windows
- [ ] CI passes all tests
- [ ] Python import works
- [ ] Benchmarks prove 100x speedup

---

## ESCALATION PROTOCOL

**Immediate Escalation (Technical Lead):**
- Determinism cannot be guaranteed
- Performance target impossible
- Scope creep > 20% of estimate

**Codeowner Escalation:**
- Betting/prediction market legal questions
- Repository split decision
- Open-source licensing

---

*This plan authorizes async agent operations under the technical lead's direction. Execute with discipline, document everything, communicate status daily.*
