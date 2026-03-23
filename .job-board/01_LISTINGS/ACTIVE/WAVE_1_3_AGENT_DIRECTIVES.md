[Ver001.000]

# WAVE 1.3 AGENT DIRECTIVES — Phase 1 Continuation

**Status:** 🟡 QUEUED - Pending TL Activation  
**Wave:** 1.3 (12 Agents)  
**Timeline:** Days 8-14  
**Teams:** TL-H2, TL-A2, TL-S2 (New Teams)  
**Foreman Authority:** 🔴 Review Required  

---

## NEW TEAM ACTIVATION

### TL-H2: WebGL Three.js Optimization Team
**Focus:** 3D visualization performance  
**Base:** `apps/website-v2/src/lib/three/`  

### TL-A2: Mobile Accessibility Team  
**Focus:** Touch, mobile, responsive a11y  
**Base:** `apps/website-v2/src/components/mobile/`  

### TL-S2: Replay 2.0 Core Team
**Focus:** Match replay system architecture  
**Base:** `apps/website-v2/src/lib/replay/`  

---

## AGENT ASSIGNMENTS

### TL-H2 TEAM (WebGL Three.js Optimization)

#### Agent 2-A: Three.js Scene Optimizer 🔵
**Task:** Optimize 3D mascot scenes for web
**Deliverables:**
- LOD (Level of Detail) system for mascot models
- Frustum culling implementation
- Texture atlasing
- drawCalls reduction (<100 per scene)
**Dependencies:** TL-H1 1-E mascot components
**Color Authority:** 🔵 Agent Level

#### Agent 2-B: Shader Pipeline Developer 🔵
**Task:** Custom shaders for mascot effects
**Deliverables:**
- Solar/Lunar glow shaders
- Binary code particle effect
- Fire/magic VFX shaders
- Shader compilation caching
**Dependencies:** TL-H2 2-A scene optimization
**Color Authority:** 🔵 Agent Level

#### Agent 2-C: React-Three-Fiber Integration 🔵
**Task:** Bridge Three.js to React components
**Deliverables:**
- `<Mascot3D />` R3F component
- Camera controls (orbit, focus, follow)
- Animation bridge (Framer Motion → Three.js)
- Performance monitoring
**Dependencies:** TL-H2 2-A, 2-B
**Color Authority:** 🔵 Agent Level

---

### TL-A2 TEAM (Mobile Accessibility)

#### Agent 2-A: Touch Gesture System 🔵
**Task:** Touch controls for all interactions
**Deliverables:**
- Swipe navigation between hubs
- Pinch-to-zoom for maps
- Long-press context menus
- Touch feedback (haptic API)
**Dependencies:** TL-A1 accessibility patterns
**Color Authority:** 🔵 Agent Level

#### Agent 2-B: Responsive Layout Engine 🔵
**Task:** Mobile-first responsive design
**Deliverables:**
- Breakpoint system (sm, md, lg, xl)
- Collapsible navigation
- Touch-friendly button sizes (44px min)
- Viewport adaptation
**Dependencies:** TL-A1 component library
**Color Authority:** 🔵 Agent Level

#### Agent 2-C: Mobile Screen Reader 🔵
**Task:** Mobile-specific a11y
**Deliverables:**
- iOS VoiceOver optimization
- Android TalkBack optimization
- Mobile rotor navigation
- Touch exploration patterns
**Dependencies:** TL-A2 2-A, 2-B
**Color Authority:** 🔵 Agent Level

---

### TL-S2 TEAM (Replay 2.0 Core)

#### Agent 2-A: Replay Parser Engine 🔵
**Task:** Parse match data into replay format
**Deliverables:**
- Valorant replay parser
- CS2 replay parser (experimental)
- Normalized replay schema
- Parser performance (<1s for 50MB file)
**Dependencies:** TL-S1 lens data structures
**Color Authority:** 🔵 Agent Level

#### Agent 2-B: Timeline Controller 🔵
**Task:** Replay timeline manipulation
**Deliverables:**
- Play/pause/scrub controls
- Speed control (0.25x - 4x)
- Keyframe bookmarking
- Timeline zoom (ms to round level)
**Dependencies:** TL-S2 2-A parser
**Color Authority:** 🔵 Agent Level

#### Agent 2-C: Camera Director System 🔵
**Task:** Automated camera for replays
**Deliverables:**
- Action detection (kills, plants, etc.)
- Auto-camera switching
- Cinematic modes (free, follow, orbit)
- Camera path recording
**Dependencies:** TL-S2 2-A, 2-B
**Color Authority:** 🔵 Agent Level

#### Agent 2-D: Sync & Multi-view 🔵
**Task:** Multi-perspective replay sync
**Deliverables:**
- Player POV switching
- Split-screen multi-view
- Synchronized timeline across views
- Observer tools
**Dependencies:** TL-S2 2-A, 2-B, 2-C
**Color Authority:** 🔵 Agent Level

#### Agent 2-E: Replay Storage & Share 🔵
**Task:** Replay persistence system
**Deliverables:**
- Local storage (IndexedDB)
- Cloud replay upload
- Replay metadata indexing
- Searchable replay library
**Dependencies:** TL-S1 1-E export system
**Color Authority:** 🔵 Agent Level

#### Agent 2-F: Annotation System 🔵
**Task:** Replay annotation tools
**Deliverables:**
- Draw on map (arrows, circles)
- Text annotations
- Voice note attachments
- Export annotated replay
**Dependencies:** TL-S2 2-A through 2-E
**Color Authority:** 🔵 Agent Level

---

## SPAWN SEQUENCE

**Day 8:** TL-H2 2-A, TL-A2 2-A, TL-S2 2-A, TL-S2 2-B (4 agents)
**Day 10:** TL-H2 2-B, TL-A2 2-B, TL-S2 2-C, TL-S2 2-D (4 agents)
**Day 12:** TL-H2 2-C, TL-A2 2-C, TL-S2 2-E, TL-S2 2-F (4 agents)

**Gap:** 48 hours between batches for TL review

---

## CROSS-TEAM DEPENDENCIES

```
TL-H2 2-A (LOD) ──► TL-H2 2-B (shaders) ──► TL-H2 2-C (R3F)
                         │
                         ▼
              TL-H1 1-E (mascot components)

TL-A2 2-A (touch) ──► TL-A2 2-B (responsive) ──► TL-A2 2-C (mobile a11y)
      │
      ▼
TL-A1 patterns

TL-S2 2-A (parser) ──► TL-S2 2-B (timeline) ──► TL-S2 2-C (camera)
      │                                     │
      │                                     ▼
      │                              TL-S2 2-D (multi-view)
      │                                     │
      └──────────► TL-S2 2-E (storage) ◄────┘
                         │
                         ▼
              TL-S2 2-F (annotations)
```

---

## PREREQUISITES FOR ACTIVATION

Before Wave 1.3 spawning:
- [ ] TL-H2, TL-A2, TL-S2 frameworks approved by 🔴 Foreman
- [ ] TL-H1 1-E components 75% complete
- [ ] TL-A1 patterns documented and shared
- [ ] TL-S1 lens framework stable
- [ ] Resource capacity confirmed (max 5 concurrent agents)

---

## ACTIVATION CHECKPOINT

| Checkpoint | Time | Deliverable |
|------------|------|-------------|
| C1 | Day 7 EOD | Wave 1.2 100% complete, TL reviews done |
| C2 | Day 8 09:00 | New TLs activated, Wave 1.3 Batch 1 spawn |
| C3 | Day 10 09:00 | Wave 1.3 Batch 2 spawn |
| C4 | Day 12 09:00 | Wave 1.3 Batch 3 spawn |
| C5 | Day 14 EOD | Wave 1.3 completion review |

---

## CLAIM INSTRUCTIONS

1. **New TLs claim their agent rosters** from `05_TEMPLATES/TEAM_ROSTER_TEMPLATE.md`
2. TLs spawn agents using this directive document
3. Each agent gets individual SPAWN_DIRECTIVE in `02_CLAIMED/{TL-ID}/{AGENT-ID}/`
4. AF-001 reviews all spawn reports within 4 hours

**Authority:** 🟢 TL claim, 🟠 AF-001 oversight, 🔴 Foreman activation approval

---

*Wave 1.3 of Phase 1 - New Team Activation*
