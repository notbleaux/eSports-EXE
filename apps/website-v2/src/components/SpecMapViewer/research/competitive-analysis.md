# SpecMapViewer: Competitive Analysis [Ver001.000]

**Date**: 2026-03-16  
**Analyst**: KID-003 Research Team  
**Scope**: Tactical minimap/radar systems in competitive FPS games

---

## 1. EXECUTIVE SUMMARY

| Game | Strengths | Weaknesses | SpecMapViewer Advantage |
|------|-----------|------------|------------------------|
| **Valorant** | Clean design, ability icons | Static 2D only | Multi-dimensional views |
| **CS2** | Proven radar, death markers | Limited information | Creative lens overlays |
| **Overwatch** | 3D awareness, hero icons | Cluttered at scale | Diegetic metaphors |
| **Rainbow Six** | Floor plans, destructibility | Complex readability | Predictive 4D lens |

---

## 2. VALORANT ANALYSIS

### Current Implementation
- **Type**: 2D top-down minimap
- **Features**:
  - Player position dots (colored by team)
  - Vision cone indicators
  - Ability usage icons
  - Spike carrier indicator
  - Death skull markers
  - Smoke/flash visual effects

### Strengths
1. **Clarity**: Clean visual hierarchy
2. **Consistency**: Same design language as game UI
3. **Information Density**: Shows exactly what players need

### Weaknesses
1. **Static**: No camera manipulation
2. **Limited History**: No movement trails
3. **No Prediction**: Future state not visualized
4. **2D Only**: Elevation not represented

### Technical Implementation
- Canvas-based rendering
- Fixed zoom levels (3 levels)
- No rotation capability
- Static sprite-based icons

---

## 3. COUNTER-STRIKE 2 ANALYSIS

### Current Implementation
- **Type**: Circular radar (innovative)
- **Features**:
  - Centered on player
  - Death markers (X)
  - Bomb carrier indicator
  - Footstep sound rings
  - Gunfire indicators

### Strengths
1. **Familiarity**: 20+ years of iteration
2. **Audio Visualization**: Sound rings are effective
3. **Minimal**: Doesn't distract from gameplay

### Weaknesses
1. **Limited Information**: No ability tracking
2. **Static**: Same as Valorant
3. **No Strategic Layer**: No rotation hints

### Technical Implementation
- Circular clipping mask
- Distance-based fading
- Simple circle/line primitives

---

## 4. OVERWATCH SPECTATOR ANALYSIS

### Current Implementation
- **Type**: 3D-aware top-down
- **Features**:
  - Hero icon portraits
  - Health bars
  - Ultimate charge indicators
  - Ability cooldowns
  - Vertical elevation markers

### Strengths
1. **Rich Information**: Comprehensive status
2. **Hero Recognition**: Icons vs dots
3. **Verticality**: Elevation awareness

### Weaknesses
1. **Visual Clutter**: Too much at once
2. **Scale Issues**: Hard to read in fights
3. **Learning Curve**: Requires game knowledge

### Technical Implementation
- WebGL acceleration
- Dynamic icon scaling
- Particle effects for abilities

---

## 5. RAINBOW SIX SIEGE ANALYSIS

### Current Implementation
- **Type**: Floor plan based
- **Features**:
  - Destructible wall indicators
  - Floor/level switching
  - Camera positions
  - Drone positions
  - Vertical play indicators

### Strengths
1. **Spatial Awareness**: Best-in-class
2. **Verticality**: Floor switching
3. **Tactical Depth**: Reinforcement status

### Weaknesses
1. **Complexity**: Steep learning curve
2. **Information Overload**: Too many icons
3. **Slow Pacing**: Not suitable for fast games

---

## 6. MARKET GAPS & OPPORTUNITIES

### Gap 1: Temporal Visualization
**Current State**: No game shows historical movement effectively  
**Opportunity**: Wind lens with flow field visualization  
**Value**: Reveals rotation patterns, common paths

### Gap 2: Predictive Layers
**Current State**: All maps are reactive (current state only)  
**Opportunity**: 4D predictive lens  
**Value**: Pre-round planning, opponent tendency analysis

### Gap 3: Diegetic Overlays
**Current State**: UI elements are abstract (dots, lines)  
**Opportunity**: Blood, tension, wind metaphors  
**Value**: Immersive, intuitive understanding

### Gap 4: Multi-Dimensional Views
**Current State**: All are fixed 2D or 3D  
**Opportunity**: 4D/3D/2.5D/2D mode switching  
**Value**: Context-appropriate visualization

---

## 7. SPECMAPVIEWER DIFFERENTIATION

### Unique Features

| Feature | Competitors | SpecMapViewer |
|---------|-------------|---------------|
| 4D Predictive | ❌ None | ✅ Future projection |
| Creative Lenses | ❌ None | ✅ 6 diegetic metaphors |
| Camera Control | ❌ None | ✅ Zoom, rotate, elevate |
| Lens Compositing | ❌ None | ✅ Multi-layer blending |
| Mode Switching | ⚠️ R6 only | ✅ 5 dimension modes |

### Technical Differentiation
1. **Canvas + WebGL Hybrid**: Performance + flexibility
2. **Modular Lens System**: Plugin architecture
3. **Animation-First**: 60fps smooth transitions
4. **Data-Driven**: ML-enhanced predictions

---

## 8. RECOMMENDATIONS

### Short-Term (Week 2-3)
1. **Focus on 2D/2.5D**: Ensure core experience is solid
2. **Tension + Blood Lenses**: Most intuitive for users
3. **A/B Site Context**: Bind-focused implementation

### Medium-Term (Week 4-6)
1. **3D Elevation**: Add cover height visualization
2. **Wind Lens**: Movement flow patterns
3. **Performance**: 60fps on mid-tier hardware

### Long-Term (Week 7+)
1. **4D Predictive**: ML model integration
2. **Doors Lens**: Full rotation analysis
3. **Multi-Map Support**: Beyond Bind

---

## 9. RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users prefer simple | High | High | Classic mode toggle |
| Performance issues | Medium | High | Quality settings |
| Information overload | Medium | Medium | Progressive disclosure |
| ML prediction inaccuracy | High | Low | Confidence indicators |

---

## 10. CONCLUSION

SpecMapViewer has **significant differentiation** in the competitive FPS tactical visualization space. No existing solution combines:
- Multi-dimensional views
- Creative diegetic metaphors  
- Predictive capabilities
- Modular compositing

**Recommendation**: Proceed with development, prioritize 2D/2.5D stability before advancing to 3D/4D features.

---

**Next Steps**: Technical survey of Canvas vs WebGL vs Three.js for implementation approach.
