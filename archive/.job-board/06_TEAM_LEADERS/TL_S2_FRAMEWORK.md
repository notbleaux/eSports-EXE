[Ver001.000]

# TL-S2 FRAMEWORK — Replay 2.0 Core Team

**Team ID:** TL-S2  
**Pipeline:** SpecMap V2  
**Focus:** Match replay system architecture  
**Authority Level:** 🟢 Team Leader  
**Reporting To:** 🟠 AF-001  
**Activation Date:** Day 8 (2026-03-28)  
**Team Size:** 6 agents (largest team)

---

## TEAM CHARTER

### Mission
Build comprehensive match replay system with parsing, timeline control, multi-view, and sharing capabilities.

### Scope
- Replay parser engine (Valorant, CS2)
- Timeline controller
- Camera director system
- Multi-view synchronization
- Replay storage & share
- Annotation system

### Boundaries
- ✅ Web-based replay viewing
- ✅ Match data parsing
- ✅ Client-side storage
- ❌ Live match streaming (TL-S4 domain)
- ❌ Server-side video encoding

---

## AGENT ROSTER (6 Agents)

### Agent 2-A: Replay Parser Engine 🔵
**Task:** Parse match data into replay format
**Dependencies:** TL-S1 lens data structures
**Deliverables:**
- Valorant replay parser
- CS2 replay parser (experimental)
- Normalized replay schema
- Parser performance (<1s for 50MB file)

### Agent 2-B: Timeline Controller 🔵
**Task:** Replay timeline manipulation
**Dependencies:** TL-S2 2-A parser
**Deliverables:**
- Play/pause/scrub controls
- Speed control (0.25x - 4x)
- Keyframe bookmarking
- Timeline zoom (ms to round level)

### Agent 2-C: Camera Director System 🔵
**Task:** Automated camera for replays
**Dependencies:** TL-S2 2-A, 2-B
**Deliverables:**
- Action detection (kills, plants, etc.)
- Auto-camera switching
- Cinematic modes (free, follow, orbit)
- Camera path recording

### Agent 2-D: Sync & Multi-view 🔵
**Task:** Multi-perspective replay sync
**Dependencies:** TL-S2 2-A, 2-B, 2-C
**Deliverables:**
- Player POV switching
- Split-screen multi-view
- Synchronized timeline across views
- Observer tools

### Agent 2-E: Replay Storage & Share 🔵
**Task:** Replay persistence system
**Dependencies:** TL-S1 1-E export system
**Deliverables:**
- Local storage (IndexedDB)
- Cloud replay upload
- Replay metadata indexing
- Searchable replay library

### Agent 2-F: Annotation System 🔵
**Task:** Replay annotation tools
**Dependencies:** TL-S2 2-A through 2-E
**Deliverables:**
- Draw on map (arrows, circles)
- Text annotations
- Voice note attachments
- Export annotated replay

---

## DEPENDENCY CHAIN

```
2-A (Parser) → 2-B (Timeline) → 2-C (Camera)
                   ↓                ↓
              2-D (Multi-view) ←───┘
                   ↓
              2-E (Storage)
                   ↓
              2-F (Annotations)
```

**Critical Path:** 2-A → 2-B → 2-C → 2-D → 2-E → 2-F  
**Parallel Work:** 2-A can start immediately; 2-B/C parallel after 2-A; 2-D after 2-B/C; 2-E after 2-D; 2-F last

---

## COORDINATION PROTOCOLS

### With TL-S1 (Lens Framework)
- **Data Flow:** TL-S1 lens data → TL-S2 replay rendering
- **Shared Code:** Lens registry, data types
- **Review:** Joint API design

### With TL-S4 (Real-time Data)
- **Distinction:** TL-S4 = live; TL-S2 = replay
- **Shared:** Data format compatibility

### With TL-H2 (WebGL)
- **3D Replays:** TL-H2 shaders for 3D replay view
- **Performance:** Shared WebGL budgets

---

## QUALITY GATES

### Performance
| Metric | Target | File Size |
|--------|--------|-----------|
| Parse Time | <1s | 50MB file |
| Scrub Response | <100ms | Any timestamp |
| Multi-view Sync | <50ms | All views |
| Storage | <100MB | IndexedDB quota |

### Browser Support
- Chrome 90+ (full)
- Firefox 88+ (full)
- Safari 14+ (no experimental features)
- Edge 90+ (full)

---

## ESCALATION PATHS

| Issue Type | Escalate To | Trigger |
|------------|-------------|---------|
| Parser complexity | AF-001 | >2s parse time |
| Storage limits | AF-001 | >100MB per replay |
| Sync issues | SAF Council | Multi-view desync |
| Scope expansion | Foreman | Beyond 6-agent capacity |

---

## SUCCESS METRICS

### Agent 2-A
- [ ] Valorant parser complete
- [ ] CS2 parser functional
- [ ] <1s parse for 50MB file

### Agent 2-B
- [ ] Smooth scrubbing
- [ ] Speed control working
- [ ] Bookmark system functional

### Agent 2-C
- [ ] Auto-camera detects kills/plants
- [ ] 3 camera modes working
- [ ] Path recording/export

### Agent 2-D
- [ ] 5 POV switching
- [ ] Split-screen layout
- [ ] Sync verified across views

### Agent 2-E
- [ ] IndexedDB storage working
- [ ] Cloud upload pattern ready
- [ ] Searchable metadata

### Agent 2-F
- [ ] Drawing on map
- [ ] Text annotations
- [ ] Export with annotations

---

**Framework Status:** 🟡 Draft — Pending Foreman Approval  
**Ready for Activation:** Day 8-12 (staggered)
**Note:** 6 agents = highest TL workload; monitor bandwidth
