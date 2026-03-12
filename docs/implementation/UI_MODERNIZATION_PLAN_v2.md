[Ver001.000]

# SATOR UI/UX Modernization Plan v2
## Neo-Apollo Tactical Implementation

**Based on:** Comprehensive Design Specification Document  
**Current Stack:** React 18 + Vite + Tailwind + Framer Motion  
**Target:** Full NASA Mission Control × Military Tactical aesthetic

---

## EXECUTIVE SUMMARY

This plan adapts the comprehensive design specification to our existing React/Vite codebase. The implementation follows a phased approach, prioritizing visual foundation before advanced interactive features.

### Critical Adapts from Specification
- **Framework:** Keep React + Vite (not Next.js) - migration unnecessary
- **Grid:** Implement custom grid vs react-grid-layout (bundle size)
- **WebGL:** Use Three.js via React Three Fiber (existing dependency)
- **Free Tier:** Maintain Vercel + Supabase approach

---

## PHASE 1: CORE VISUAL SYSTEM (Week 1)

### 1.1 CRT/Scanline Foundation
**Priority:** P0 - Defines the entire aesthetic

```css
/* New: styles/crt-effects.css */
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

@keyframes flicker {
  0%, 100% { opacity: 0.97; }
  50% { opacity: 1; }
}

.crt-overlay {
  background: linear-gradient(
    180deg,
    rgba(0, 212, 255, 0) 0%,
    rgba(0, 212, 255, 0.03) 50%,
    rgba(0, 212, 255, 0) 100%
  );
  background-size: 100% 4px;
  pointer-events: none;
}
```

**Components to Create:**
- `CRTScreen` - Wrapper providing scanline overlay
- `PhosphorText` - Text with CRT glow effect
- `TerminalPanel` - Chamfered corners, tactical aesthetic

### 1.2 Color System Updates
**Exact Hex Enforcement:**

```javascript
// Update: theme/colors.js
export const tacticalColors = {
  // Backgrounds (NASA Dark)
  void: '#050508',
  space: '#0A0E12',      // Main bg
  panel: '#141B23',      // Card bg
  elevated: '#1E2832',   // Hover states
  
  // Hubs (unchanged from current)
  sator: '#FFD700',      // Gold
  rotas: '#00D4FF',      // Cyan
  arepo: '#0066FF',      // Blue
  opera: '#9D4EDD',      // Purple
  tenet: '#FAFAFA',      // White
  
  // Functional
  enemy: '#FF4655',      // Red
  success: '#00FF88',    // Green
  warning: '#FF6B00',    // Orange
}
```

### 1.3 Typography System
**New Fonts Required:**
- `JetBrains Mono` - Data/stats (tabular nums)
- `Inter` - UI elements (already have)
- `DIN 1451` or `Roboto Condensed` - Military headers

```javascript
// Add to index.html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Roboto+Condensed:wght@400;700&display=swap" rel="stylesheet">
```

---

## PHASE 2: QUATERNARY GRID SYSTEM (Week 2)

### 2.1 Grid Architecture
**Layout:** 2×2 base with overlay center

```
┌─────────────────────────────────────────┐
│  ┌────────────┐    ┌────────────┐      │
│  │   PANEL 1  │    │   PANEL 2  │      │
│  │   SATOR    │    │   AREPO    │      │
│  │  Analytics │    │  Research  │      │
│  └────────────┘    └────────────┘      │
│         ╔══════════╗                   │
│         ║  TENET   ║                   │
│         ║  CENTER  ║                   │
│         ╚══════════╝                   │
│  ┌────────────┐    ┌────────────┐      │
│  │   PANEL 3  │    │   PANEL 4  │      │
│  │   ROTAS    │    │   OPERA    │      │
│  │ Simulation │    │  Archive   │      │
│  └────────────┘    └────────────┘      │
└─────────────────────────────────────────┘
```

**Components:**
- `QuaternaryGrid` - Main layout container
- `DraggablePanel` - Resizable, movable panels
- `PanelHeader` - Title bar with controls
- `PanelContent` - Scrollable content area

### 2.2 Panel Types (6 Required)

| Panel | Hub | Purpose | Data Source |
|-------|-----|---------|-------------|
| Analytics | SATOR | KCRITR stats, charts | API + local |
| Research | AREPO | Team/player lookup | VLR.gg API |
| Simulation | ROTAS | Godot WebGL export | Godot WASM |
| Archive | OPERA | VOD library, clips | YouTube/Twitch |
| Command | TENET | Settings, sync | Supabase |
| Minimap | Any | Tactical map overlay | Manual input |

---

## PHASE 3: SATOR SQUARE VISUALIZATION (Week 3)

### 3.1 5-Layer Structure
**Current:** Static text cards  
**Target:** Interactive WebGL palindrome

```
Layer 1: SATOR (Hotstreaks)    - Gold    - 5-point stars
Layer 2: OPERA (Fog of War)    - Purple  - Hex grid
Layer 3: TENET (Control)       - White   - Center hub
Layer 4: AREPO (Death Stains)  - Blue    - Impact points
Layer 5: ROTAS (Rotation)      - Cyan    - Arcing trails
```

**Rotation:** 0.5 RPM (1 revolution per 2 minutes)
**Interaction:** Click layer → Navigate to hub

### 3.2 Implementation
**Tech:** React Three Fiber (already in dependencies)

```javascript
// SATORSquare.jsx - Conceptual
function SATORSquare() {
  const meshRef = useRef();
  
  useFrame((state) => {
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.052; // 0.5 RPM
  });
  
  return (
    <Canvas>
      {/* Layer 5: ROTAS Trails */}
      <TrailLayer color="#00D4FF" rotation={ref} />
      {/* Layer 4: AREPO Stains */}
      <StainLayer color="#0066FF" />
      {/* Layer 3: TENET Hub */}
      <CenterHub color="#FAFAFA" />
      {/* Layer 2: OPERA Grid */}
      <HexGrid color="#9D4EDD" />
      {/* Layer 1: SATOR Stars */}
      <StarField color="#FFD700" />
    </Canvas>
  );
}
```

---

## PHASE 4: TACTICAL UI COMPONENTS (Week 4)

### 4.1 Button System
**Current:** Rounded buttons  
**Target:** Chamfered/hexagonal military

```css
/* Hexagonal Button */
.btn-tactical {
  clip-path: polygon(
    10% 0%, 90% 0%,
    100% 50%, 90% 100%,
    10% 100%, 0% 50%
  );
}

/* Chamfered Panel */
.panel-tactical {
  clip-path: polygon(
    8px 0%, calc(100% - 8px) 0%,
    100% 8px, 100% calc(100% - 8px),
    calc(100% - 8px) 100%, 8px 100%,
    0% calc(100% - 8px), 0% 8px
  );
}
```

### 4.2 HUD Elements
- `CrosshairOverlay` - Targeting reticle
- `RadarSweep` - Rotating minimap overlay
- `DataStream` - Matrix-style vertical text
- `RangeFinder` - Concentric circles
- `ThreatDetector` - Pulsing red vignette

### 4.3 Minimap System
**Specs:**
- Default: 250×250px
- Zoom: 1x-5x (wheel + buttons)
- Features: Grid overlay, ally/enemy icons, spike marker
- Real-time: WebSocket positions (future)

---

## PHASE 5: MODE TOGGLE SYSTEM (Week 5)

### 5.1 SATOR ↔ ROTAS States

| Aspect | SATOR Mode | ROTAS Mode |
|--------|-----------|------------|
| Accent | Cyan (#00D4FF) | Red (#FF4655) |
| Purpose | Data ingestion | Analytics/Prediction |
| View | Raw data feeds | Processed insights |
| Animation | Flowing in | Rotating out |

### 5.2 Implementation
```javascript
// store/modeStore.js
export const useModeStore = create((set) => ({
  mode: 'SATOR', // 'SATOR' | 'ROTAS'
  toggle: () => set((state) => ({ 
    mode: state.mode === 'SATOR' ? 'ROTAS' : 'SATOR' 
  })),
  colors: {
    SATOR: { accent: '#00D4FF', glow: 'rgba(0, 212, 255, 0.5)' },
    ROTAS: { accent: '#FF4655', glow: 'rgba(255, 70, 85, 0.5)' }
  }
}));
```

---

## IMPLEMENTATION PRIORITIES

### Must Have (P0)
- [ ] CRT scanline overlay
- [ ] Exact hex color enforcement
- [ ] JetBrains Mono for data
- [ ] Quaternary grid structure
- [ ] Basic SATOR Square (SVG fallback)
- [ ] Chamfered panel corners

### Should Have (P1)
- [ ] Draggable panels
- [ ] WebGL SATOR Square
- [ ] Mode toggle system
- [ ] Minimap component
- [ ] Hexagonal buttons

### Nice to Have (P2)
- [ ] Radar sweep animation
- [ ] Data stream effects
- [ ] Thermal/night vision toggles
- [ ] Sound effects
- [ ] Full react-grid-layout

---

## TECHNICAL CONSIDERATIONS

### Bundle Size Impact
| Feature | Size | Mitigation |
|---------|------|------------|
| Three.js | ~150KB | Lazy load SATOR Square |
| react-grid-layout | ~50KB | Implement custom grid |
| JetBrains Mono | ~20KB | Font subsetting |
| **Total** | **~220KB** | Code splitting |

### Performance Targets
- First paint: <1.5s
- Time to interactive: <3s
- Animation: 60fps
- Panel drag: 60fps

### Accessibility Requirements
- WCAG 2.1 AA minimum
- CRT toggle (reduce motion)
- Keyboard navigation
- Screen reader labels
- High contrast mode

---

## FILES TO MODIFY/CREATE

### New Files
```
src/
├── components/
│   ├── crt/
│   │   ├── CRTScreen.jsx
│   │   ├── PhosphorText.jsx
│   │   └── ScanlineOverlay.jsx
│   ├── tactical/
│   │   ├── TacticalButton.jsx
│   │   ├── TacticalPanel.jsx
│   │   ├── CrosshairOverlay.jsx
│   │   └── RadarSweep.jsx
│   ├── grid/
│   │   ├── QuaternaryGrid.jsx
│   │   ├── DraggablePanel.jsx
│   │   └── PanelTypes/
│   │       ├── AnalyticsPanel.jsx
│   │       ├── ResearchPanel.jsx
│   │       ├── SimulationPanel.jsx
│   │       ├── ArchivePanel.jsx
│   │       └── MinimapPanel.jsx
│   └── sator-square/
│       ├── SATORSquare.jsx
│       ├── WebGLSquare.jsx
│       ├── SVGFallback.jsx
│       └── LayerComponents/
├── styles/
│   ├── crt-effects.css
│   ├── tactical.css
│   └── animations.css
└── store/
    └── modeStore.js
```

### Modified Files
- `App.jsx` - Add CRT wrapper
- `index.css` - Add font imports
- `theme/colors.js` - Add tactical colors
- `ModernQuarterGrid.jsx` - Convert to QuaternaryGrid

---

## SUCCESS CRITERIA

- [ ] All 5 hub colors render exactly (#FFD700, #00D4FF, #0066FF, #9D4EDD, #FAFAFA)
- [ ] CRT scanlines visible on all pages
- [ ] JetBrains Mono used for all numeric data
- [ ] SATOR Square renders (SVG or WebGL)
- [ ] Mode toggle switches accent colors
- [ ] Panel corners are chamfered (not rounded)
- [ ] Mobile: Single column layout
- [ ] Lighthouse: >90 Performance, >95 Accessibility

---

## COMMON PITFALLS (From Specification)

❌ **DON'T:**
- Use rounded corners everywhere (military = chamfered)
- Use default Material Design
- Ignore mobile (60% of users)
- Use placeholder text
- Approximate hex colors
- Forget keyboard navigation

✅ **DO:**
- Use `font-variant-numeric: tabular-nums` for stats
- Implement proper dark mode (default)
- Add micro-interactions
- Test at 320px width
- Lazy load heavy components

---

*Implementation plan based on Comprehensive Design Specification*
*Adapted for React 18 + Vite + Tailwind stack*
