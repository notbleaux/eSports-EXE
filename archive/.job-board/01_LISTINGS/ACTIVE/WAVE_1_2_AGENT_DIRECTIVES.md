[Ver001.000]

# WAVE 1.2 AGENT DIRECTIVES — Phase 1 Continuation

**Status:** 🟢 ACTIVE - Ready for Claim  
**Wave:** 1.2 (6 Agents)  
**Timeline:** Days 4-7  
**Foreman Authority:** 🔴 Review Required  

---

## AGENT ASSIGNMENTS

### TL-H1 TEAM (Heroes & Mascots)

#### Agent 1-D: Godot Integration Specialist 🔵
**Task:** Integrate mascot assets into Godot 4 simulation
**Deliverables:**
- Mascot entity scenes (Sol, Lun, Bin, Fat, Uni)
- Animation state machines (idle, cheer, react)
- Spectator camera integration
- Performance budget: <2ms per mascot render
**Dependencies:** TL-H1 1-A, 1-B, 1-C bibles complete
**Color Authority:** 🔵 Agent Level
**Review Chain:** TL-H1 → AF-001 R3 → Foreman

#### Agent 1-E: Character Web Components 🔵
**Task:** React components for character showcase
**Deliverables:**
- `<MascotCard />` with stats display
- `<MascotGallery />` grid with filtering
- `<CharacterBible />` detailed view
- Storybook stories for all components
**Dependencies:** TL-H1 bibles, TL-A1 accessibility patterns
**Color Authority:** 🔵 Agent Level
**Review Chain:** TL-H1 → AF-001 R3 → Foreman

---

### TL-A1 TEAM (Help & Accessibility)

#### Agent 1-D: Broadcast Integration Tools 🔵
**Task:** WebSocket-powered live assistance system
**Deliverables:**
- Live context broadcast component
- Real-time help overlay system
- Broadcast priority queue
- Connection resilience (reconnect logic)
**Dependencies:** TL-A1 1-B Context Engine, TL-S1 WebSocket
**Color Authority:** 🔵 Agent Level
**Review Chain:** TL-A1 → AF-001 R3 → Foreman
**⚠️ Conflict Warning:** Coordinate with TL-S4 for WebSocket usage

#### Agent 1-E: Voice Navigation Prototype 🔵
**Task:** Experimental voice command navigation
**Deliverables:**
- Speech recognition hook (`useVoiceCommand`)
- Command mapping system
- Voice feedback responses
- Accessibility-compliant implementation
**Dependencies:** TL-A1 1-C Knowledge Graph
**Color Authority:** 🔵 Agent Level
**Review Chain:** TL-A1 → AF-001 R3 → Foreman

---

### TL-S1 TEAM (SpecMap V2)

#### Agent 1-D: Lens Performance Optimization 🔵
**Task:** Optimize 16 lenses for 60fps target
**Deliverables:**
- Web Worker offloading for calculations
- GPU acceleration for heatmaps
- Lazy lens loading system
- Performance profiling report
**Dependencies:** TL-S1 1-B + 1-C lenses complete
**Color Authority:** 🔵 Agent Level
**Review Chain:** TL-S1 → AF-001 R3 → Foreman

#### Agent 1-E: Export & Share System 🔵
**Task:** Screenshot, clip, and share functionality
**Deliverables:**
- Screenshot capture (PNG/WebP)
- Clip timeline selector
- Share to social/API endpoints
- Cloud storage integration pattern
**Dependencies:** TL-S1 lens framework
**Color Authority:** 🔵 Agent Level
**Review Chain:** TL-S1 → AF-001 R3 → Foreman

---

## CROSS-PIPELINE COORDINATION

### WebSocket Resource Sharing
**Issue:** TL-A1 1-D and TL-S4 both need WebSocket
**Resolution:** 
1. TL-A1 1-D uses broadcast channel (one-to-many)
2. TL-S4 uses dedicated match channel (one-to-one)
3. Shared WebSocket manager in `@shared/websocket`
**Coordinator:** 🟠 AF-001 (escalated from TLs)

### Shared Component Library
**Components needed across pipelines:**
- Loading states → TL-A1 1-A owns, others consume
- Error boundaries → TL-A1 1-A owns, others consume  
- Mascot avatars → TL-H1 owns, TL-A1/TL-S1 consume
- Lens thumbnails → TL-S1 owns, others consume

---

## SPAWN SEQUENCE

**Batch 1 (Day 4):** Agents 1-D (all teams) - 3 agents
**Batch 2 (Day 5):** Agents 1-E (all teams) - 3 agents
**Stagger:** 2-hour delays between spawns to prevent resource contention

---

## CHECKPOINT SCHEDULE

| Checkpoint | Time | Deliverable |
|------------|------|-------------|
| C1 | Day 4 12:00 | All 1-D agents spawned, plans submitted |
| C2 | Day 5 12:00 | All 1-E agents spawned, plans submitted |
| C3 | Day 6 18:00 | Mid-wave progress review |
| C4 | Day 7 18:00 | Wave 1.2 completion, TL pre-reviews |

---

## CLAIM INSTRUCTIONS

1. **TLs claim on behalf of agents** (not direct agent claim)
2. Copy agent directive to `02_CLAIMED/{TL-ID}/{AGENT-ID}/`
3. Spawn agent with full context
4. Submit AGENT_SPAWN_REPORT to AF-001 within 1 hour

**Authority:** 🟢 Team Leader claim, 🟠 AF-001 oversight, 🔴 Foreman final review

---

*Wave 1.2 of Phase 1 - Mass Deployment Continuation*
