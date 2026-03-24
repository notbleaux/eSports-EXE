[Ver001.000]

# TL-H2 FRAMEWORK — WebGL Three.js Optimization Team

**Team ID:** TL-H2  
**Pipeline:** Heroes & Mascots  
**Focus:** 3D WebGL visualization  
**Authority Level:** 🟢 Team Leader  
**Reporting To:** 🟠 AF-001  
**Activation Date:** Day 8 (2026-03-28)  

---

## TEAM CHARTER

### Mission
Optimize mascot and 3D scene rendering using Three.js and React-Three-Fiber for web deployment.

### Scope
- LOD (Level of Detail) systems for mascot models
- Custom shaders for visual effects
- React-Three-Fiber integration
- Performance optimization for web

### Boundaries
- ✅ WebGL/Three.js development
- ✅ Shader programming
- ✅ R3F component architecture
- ❌ Godot engine work (TL-H1 domain)
- ❌ Backend 3D rendering

---

## AGENT ROSTER (3 Agents)

### Agent 2-A: Three.js Scene Optimizer 🔵
**Task:** LOD system and scene optimization
**Dependencies:** TL-H1 1-E mascot components
**Deliverables:**
- LOD system for mascot models
- Frustum culling implementation
- Texture atlasing
- drawCalls reduction (<100 per scene)

### Agent 2-B: Shader Pipeline Developer 🔵
**Task:** Custom shaders for mascot effects
**Dependencies:** TL-H2 2-A LOD system
**Deliverables:**
- Solar/Lunar glow shaders
- Binary code particle effect
- Fire/magic VFX shaders
- Shader compilation caching

### Agent 2-C: React-Three-Fiber Integration 🔵
**Task:** Bridge Three.js to React components
**Dependencies:** TL-H2 2-A, 2-B
**Deliverables:**
- `<Mascot3D />` R3F component
- Camera controls (orbit, focus, follow)
- Animation bridge (Framer Motion → Three.js)
- Performance monitoring

---

## COORDINATION PROTOCOLS

### With TL-H1 (Character Team)
- **Asset Flow:** TL-H1 provides mascot specs → TL-H2 implements 3D
- **Review Points:** Weekly sync on mascot design changes
- **Escalation:** Asset conflicts → AF-001

### With TL-H3 (Animation Team - Future)
- **Handoff:** TL-H2 3D components → TL-H3 animation controllers
- **Interface:** Standardized animation props

### With TL-S5 (3D Map Rendering - Future)
- **Shared Resources:** Shader library, R3F utilities
- **Coordination:** Common performance budgets

---

## QUALITY GATES

### Performance Targets
| Metric | Target | Measurement |
|--------|--------|-------------|
| FPS | 60fps | Chrome DevTools |
| drawCalls | <100 | Three.js inspector |
| GPU Memory | <100MB | Chrome Task Manager |
| Load Time | <2s | Lighthouse |

### Code Standards
- TypeScript strict mode
- R3F best practices
- Shader comments for maintainability
- Performance profiling in dev mode

---

## ESCALATION PATHS

| Issue Type | Escalate To | Trigger |
|------------|-------------|---------|
| Asset conflicts | AF-001 | TL-H1 disagreement |
| Performance targets unreachable | AF-001 | <30fps sustained |
| Scope creep | AF-001 | Beyond 3-agent capacity |
| Technical blockers | SAF Council | 3+ hours no progress |

---

## SUCCESS METRICS

### Agent 2-A
- [ ] LOD system reduces mesh detail by 50% at distance
- [ ] Frustum culling eliminates off-screen rendering
- [ ] Texture atlas reduces drawCalls to <100

### Agent 2-B
- [ ] 5 shader effects implemented
- [ ] Shader compile time <100ms
- [ ] Effects run at 60fps on mid-tier GPU

### Agent 2-C
- [ ] R3F components type-safe
- [ ] Camera controls smooth (no jank)
- [ ] Animation bridge working with Framer Motion

---

**Framework Status:** 🟡 Draft — Pending Foreman Approval  
**Ready for Activation:** Day 8 09:00 UTC
