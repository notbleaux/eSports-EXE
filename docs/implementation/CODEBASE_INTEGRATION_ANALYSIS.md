[Ver001.000]

# CODEBASE INTEGRATION ANALYSIS
## SATOR/eSports-EXE Platform — Integration Points for Quaternary Grid

**Date:** 13 March 2026  
**Target:** React 18 + Vite + Tailwind + Framer Motion  
**Scope:** Integration of Quaternary Grid, SATOR Square enhancements, and Mode Toggle

---

## I. CURRENT ARCHITECTURE OVERVIEW

### 1.1 Directory Structure

```
apps/website-v2/
├── src/
│   ├── App.jsx                    # Main router with 5 hub routes
│   ├── main.jsx                   # Entry point with ErrorBoundary
│   ├── theme/
│   │   └── colors.js              # PORCELAIN³ color tokens
│   ├── components/
│   │   ├── ModernQuarterGrid.jsx  # Current landing page (static)
│   │   ├── Navigation.jsx         # Glassmorphism header
│   │   └── ui/                    # Foundation components
│   │       ├── GlassCard.jsx      # Base card component
│   │       ├── AnimatedBackground.jsx
│   │       └── ...
│   ├── hub-1-sator/               # SATOR hub implementation
│   ├── hub-2-rotas/               # ROTAS hub implementation
│   ├── hub-3-arepo/               # AREPO hub implementation
│   ├── hub-4-opera/               # OPERA hub implementation
│   ├── hub-5-tenet/               # TENET hub (contains SatorSquare)
│   └── shared/                    # Shared utilities
├── package.json                   # Dependencies: React Three Fiber, Framer Motion, Zustand
└── vite.config.js
```

### 1.2 Existing Dependencies (Relevant)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.2.0 | Core framework |
| `react-router-dom` | 6.20.0 | Navigation |
| `framer-motion` | 10.16.0 | Animations |
| `zustand` | 4.4.0 | State management |
| `@react-three/fiber` | 8.15.0 | WebGL/Three.js |
| `@react-three/drei` | 9.90.0 | Three.js helpers |
| `three` | 0.158.0 | 3D library |
| `lucide-react` | 0.294.0 | Icons |
| `tailwindcss` | 3.3.0 | Styling |

### 1.3 Existing Components to Leverage

| Component | Location | Integration Point |
|-----------|----------|-------------------|
| `GlassCard` | `components/ui/GlassCard.jsx` | Base for panel cards |
| `ModernCard` | `components/ui/ModernCard.jsx` | Hub card styling |
| `SatorSquare` | `hub-5-tenet/components/SatorSquare.jsx` | Enhance with interactivity |
| `Navigation` | `shared/components/Navigation.jsx` | Add Mode Toggle |
| `AnimatedBackground` | `components/ui/AnimatedBackground.jsx` | Keep as-is |

---

## II. INTEGRATION POINTS

### 2.1 Quaternary Grid Integration

**Current State:** `ModernQuarterGrid.jsx` is a **static** landing page with:
- 4 hub cards in 2x2 grid
- Center TENET hub overlay
- No drag/resize functionality
- No panel system

**Target State:** Dynamic Quaternary Grid with:
- Draggable, resizable panels
- Minimize/maximize functionality
- Group views (save/load layouts)
- Panel types: Minimap, Live Map, Analytics, Stats, Chat, Video

**Integration Strategy:**

```typescript
// 1. Install additional dependency
npm install react-grid-layout

// 2. Create new component preserving existing styles
// src/components/QuaternaryGrid.jsx (replaces ModernQuarterGrid)

// 3. Refactor ModernQuarterGrid → static landing
// src/pages/LandingPage.jsx (marketing page)

// 4. Create new route for grid interface
// /dashboard → QuaternaryGrid
// / → LandingPage (static)
```

**File Changes:**
- ✅ **NEW:** `src/components/QuaternaryGrid.jsx` - Main grid component
- ✅ **NEW:** `src/components/grid/DraggablePanel.jsx` - Panel wrapper
- ✅ **NEW:** `src/components/grid/PanelTypes/` - Specific panel implementations
- ✅ **NEW:** `src/store/gridStore.js` - Zustand store for layout state
- ✅ **NEW:** `src/hooks/useLocalStorage.js` - Persistence hook
- ✅ **REFACTOR:** Move `ModernQuarterGrid.jsx` → `src/pages/LandingPage.jsx`
- ✅ **UPDATE:** `App.jsx` - Add `/dashboard` route

### 2.2 SATOR Square Integration

**Current State:** `hub-5-tenet/components/SatorSquare.jsx` has:
- Three.js scene with 5 rings
- Rotation animation
- No click interactions
- No navigation
- No SVG fallback

**Target State:** Interactive SATOR Square with:
- Click-to-navigate on each ring
- Hover tooltips with hub description
- Selection state with pulse animation
- SVG fallback for mobile
- Lazy loading

**Integration Strategy:**

```typescript
// 1. Enhance existing component
// src/hub-5-tenet/components/SatorSquare.jsx

// Add props:
interface SatorSquareProps {
  interactive?: boolean;      // Enable click/hover
  onLayerClick?: (layer: SatorLayer) => void;
  showFallback?: boolean;     // Force SVG mode
  className?: string;
}

// 2. Create wrapper for lazy loading
// src/components/SatorSquareLazy.jsx

// 3. Add to grid center or as modal trigger
```

**File Changes:**
- ✅ **UPDATE:** `src/hub-5-tenet/components/SatorSquare.jsx` - Add interactivity
- ✅ **NEW:** `src/components/SatorSquare/SatorSquareSVG.jsx` - SVG fallback
- ✅ **NEW:** `src/components/SatorSquare/index.jsx` - Lazy load wrapper
- ✅ **NEW:** `src/hooks/useWebGLSupport.js` - Feature detection

### 2.3 Mode Toggle Integration

**Current State:** No mode toggle exists

**Target State:** Global SATOR ↔ ROTAS mode with:
- Header toggle button
- Color scheme changes
- Page transition effects
- Mode-aware components

**Integration Strategy:**

```typescript
// 1. Create Zustand store
// src/store/modeStore.js

// 2. Create toggle component
// src/components/ModeToggle.jsx

// 3. Add to Navigation
// src/shared/components/Navigation.jsx

// 4. Wrap app with transition provider
// src/components/ModeTransitionWrapper.jsx
```

**File Changes:**
- ✅ **NEW:** `src/store/modeStore.js` - Global state
- ✅ **NEW:** `src/components/ModeToggle.jsx` - Toggle UI
- ✅ **NEW:** `src/components/ModeTransitionWrapper.jsx` - Transition effects
- ✅ **NEW:** `src/hooks/useModeColors.js` - Color hook
- ✅ **UPDATE:** `src/shared/components/Navigation.jsx` - Add toggle
- ✅ **UPDATE:** `src/App.jsx` - Wrap with transition wrapper

---

## III. IMPLEMENTATION SEQUENCE

### Phase 1: Foundation (Prerequisites)

1. **Install Dependencies**
   ```bash
   cd apps/website-v2
   npm install react-grid-layout
   npm install -D @types/react-grid-layout
   ```

2. **Create Store Structure**
   ```
   src/
   ├── store/
   │   ├── index.js          # Re-export all stores
   │   ├── gridStore.js      # Quaternary Grid state
   │   ├── modeStore.js      # SATOR/ROTAS mode
   │   └── panelStore.js     # Panel content state
   ```

3. **Create Utility Hooks**
   ```
   src/
   └── hooks/
       ├── useLocalStorage.js
       ├── useWebGLSupport.js
       ├── useModeColors.js
       └── usePanelState.js
   ```

### Phase 2: Quaternary Grid

1. **Create Panel Components**
   ```
   src/components/grid/
   ├── DraggablePanel.jsx
   ├── PanelHeader.jsx
   ├── PanelContent.jsx
   ├── ResizeHandle.jsx
   └── PanelTypes/
       ├── MinimapPanel.jsx
       ├── LiveMapPanel.jsx
       ├── AnalyticsPanel.jsx
       ├── StatsPanel.jsx
       ├── ChatPanel.jsx
       └── VideoPanel.jsx
   ```

2. **Create Grid Container**
   ```
   src/components/
   ├── QuaternaryGrid.jsx          # Main grid
   ├── GridControls.jsx            # Add panel, reset, group selector
   └── GroupViewSelector.jsx       # Save/load layouts
   ```

3. **Update Routing**
   ```jsx
   // App.jsx
   <Route path="/dashboard" element={<QuaternaryGrid />} />
   <Route path="/" element={<LandingPage />} />
   ```

### Phase 3: SATOR Square Enhancement

1. **Update Existing Component**
   - Add click handlers to rings
   - Add hover states with tooltips
   - Add selection pulse animation

2. **Create SVG Fallback**
   - Implement SVG version with CSS animations
   - Add feature detection

3. **Create Lazy Wrapper**
   - Code-split WebGL component
   - Show skeleton while loading

### Phase 4: Mode Toggle

1. **Create Store**
   - Zustand with persistence
   - Mode colors configuration

2. **Create Components**
   - ModeToggle.jsx (toggle button)
   - ModeTransitionWrapper.jsx (page transitions)

3. **Integrate**
   - Add to Navigation
   - Update GlassCard to use mode colors
   - Add mode-aware styling to hubs

---

## IV. STYLING INTEGRATION

### 4.1 Tailwind Config Extensions

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Hub colors
        'sator': '#ffd700',
        'rotas': '#00d4ff',
        'arepo': '#0066ff',
        'opera': '#9d4edd',
        'tenet': '#ffffff',
        
        // Mode colors
        'sator-accent': '#00D4FF',
        'rotas-accent': '#FF4655',
        
        // Backgrounds
        'void': '#050508',
        'space': '#0A0E12',
        'panel': '#141B23',
      },
      animation: {
        'radar-sweep': 'radarSweep 4s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px var(--glow-color)' },
          '50%': { boxShadow: '0 0 25px var(--glow-color), 0 0 40px var(--glow-color)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
};
```

### 4.2 CSS Variables Integration

```css
/* index.css */
:root {
  /* Mode-aware variables (set by ModeStore) */
  --mode-accent: #00D4FF;
  --mode-accent-glow: rgba(0, 212, 255, 0.5);
  --mode-live-indicator: #00D4FF;
}

[data-mode="ROTAS"] {
  --mode-accent: #FF4655;
  --mode-accent-glow: rgba(255, 70, 85, 0.5);
  --mode-live-indicator: #FF4655;
}
```

---

## V. TESTING INTEGRATION

### 5.1 Manual Testing Checklist

| Feature | Test | Expected |
|---------|------|----------|
| Grid | Drag panel | Smooth 60fps movement |
| Grid | Resize panel | Respects min/max bounds |
| Grid | Minimize | Shows header only |
| Grid | Maximize | Full viewport overlay |
| Grid | Save group | Persists to localStorage |
| Grid | Load group | Restores layout |
| SATOR Square | Click ring | Navigates to hub |
| SATOR Square | Hover ring | Shows tooltip |
| Mode Toggle | Click toggle | Switches mode with animation |
| Mode Toggle | Refresh page | Retains mode preference |

### 5.2 Browser Testing

- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+

### 5.3 Device Testing

- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x812)

---

## VI. PERFORMANCE CONSIDERATIONS

### 6.1 Bundle Size Impact

| Feature | Size | Mitigation |
|---------|------|------------|
| react-grid-layout | ~50KB | Tree-shake unused features |
| Three.js (WebGL) | ~150KB | Lazy load SATOR Square |
| Framer Motion | Already included | Use layout animations sparingly |
| **Total Added** | **~200KB** | Code splitting |

### 6.2 Runtime Performance

- Use `React.memo` for panel components
- Debounce drag/resize events (16ms)
- Virtualize long lists in panels
- Use `will-change: transform` during animations

---

## VII. MIGRATION STRATEGY

### 7.1 Backward Compatibility

- Keep `/` as landing page (no breaking change)
- Add `/dashboard` for new grid interface
- Existing hub routes (`/sator`, `/rotas`, etc.) remain functional

### 7.2 Gradual Rollout

1. **Week 1:** Implement behind feature flag
2. **Week 2:** Internal testing
3. **Week 3:** Beta users
4. **Week 4:** Full release

---

## VIII. RISK MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| react-grid-layout breaking changes | High | Pin version, fork if necessary |
| WebGL not supported | Medium | SVG fallback mandatory |
| Performance on low-end devices | Medium | Disable animations, reduce particles |
| localStorage quota exceeded | Low | Compress layout data, LRU eviction |
| State management complexity | Medium | Clear store boundaries, devtools |

---

## IX. SUCCESS CRITERIA

- [ ] All 6 panel types functional
- [ ] Drag/resize at 60fps
- [ ] Layout persists across sessions
- [ ] Mode toggle switches instantly
- [ ] SATOR Square navigates correctly
- [ ] Mobile responsive
- [ ] Lighthouse score >90
- [ ] Zero console errors

---

*End of Integration Analysis*
