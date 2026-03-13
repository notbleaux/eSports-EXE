[Ver001.000]

# COMPREHENSIVE DESIGN SPECIFICATION DOCUMENT
## SATOR eXe ROTAS — 4NJZ4 TENET Platform
### Web Platform UI/UX Architecture

**Classification:** Technical Design Specification  
**Date:** 13 March 2026  
**Budget Constraint:** $0 (Free/Open Source Only)  
**Target:** React 18 + Vite + Tailwind + Framer Motion

---

## I. FILE INVENTORY (Presentations Analyzed)

| ID | Filename | Slide Count | Core Content |
|----|----------|-------------|--------------|
| P1 | SATOR eXe_ World Premiere.pptx | 18 | Hero launch, architecture overview, features |
| P2 | The Quaternary Rosarium.pptx | 11 | Sacred geometry, 4x4 grid system, elemental mapping |
| P3 | SATOR_ROTAS_ Esports Intelligence.pptx | 14 | Dashboard UI, analytics, 37-field KCRITR schema |
| P4 | SATOR eXe _ ROTAS eXe.pptx | 13 | Dual system architecture, palindrome flow |
| P5 | The Tactical Rosarium_ SATOR Design.pptx | 10 | Design tokens, color system, components |
| P6 | The Quaternary Rosarium(1).pptx | 11 | Extended grid concepts, CSS implementation |
| P7 | Standing on the Shoulders of Mission Control.pptx | 16 | NASA heritage, Apollo-era aesthetics, console design |
| P8 | SATOR eXe _ ROTAS eXe(1).pptx | 13 | Technical ERD, API specs, deployment |

**Total: 106 slides** | **Primary Visual Motif: NASA Mission Control × Tactical Military × Swiss Brutalism**

---

## II. AESTHETIC: VISUAL EFFECTS & ELEMENTS

### 2.1 Core Visual Philosophy
**"Neo-Apollo Tactical"** — Fusion of 1960s NASA control room precision with modern esports dynamism

### 2.2 Visual Effects Inventory

| Effect | Implementation | Purpose | Reference |
|--------|----------------|---------|-----------|
| CRT Scanlines | CSS linear-gradient overlay with pointer-events: none | Retro Mission Control authenticity | Apollo-era displays |
| Phosphor Glow | text-shadow with cyan (#00D4FF) at 40% opacity | Terminal authenticity | CRT monitors |
| Neon Borders | box-shadow with dual-layer glow (inner + outer) | Interactive element focus | Cyberpunk 2077 UI |
| Hexagonal Buttons | CSS clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%) | Tactical military aesthetic | NATO military interfaces |
| Crosshair Overlays | SVG crosshairs with stroke-dasharray animation | Targeting/focus indication | Sniper scopes |
| Data Stream Rain | Canvas-based particle system (Matrix-style but vertical) | Live data ingestion visualization | The Matrix (film) |
| Lens Flare | CSS radial-gradient with blur on hover | Premium interactive feedback | JJ Abrams aesthetic |
| Holographic Shimmer | CSS background: linear-gradient() with animation | Advanced technology indication | Iron Man HUD |
| Chamfered Corners | clip-path with 45° cuts (not rounded) | Industrial/military precision | CNC-machined panels |
| Circular Minimap Frame | border-radius: 50% with rotating radar sweep | Radar authenticity | Aircraft HUD |
| Glassmorphism | backdrop-filter: blur(8px) + rgba backgrounds | Modern overlay transparency | macOS Big Sur |
| Gradient Orbs | Animated floating spheres with blur | Ambient depth | Apple Vision Pro |

### 2.3 Animation Specifications

```css
/* Keyframe Definitions */
@keyframes radarSweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 10px var(--glow-color); }
  50% { box-shadow: 0 0 25px var(--glow-color), 0 0 40px var(--glow-color); }
}

@keyframes dataStream {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.95; }
}
```

### 2.4 Aesthetic Plans by Hub

| Hub | Primary Effect | Secondary Effect | Animation Style |
|-----|---------------|------------------|-----------------|
| **SATOR** (Gold) | Pulsing starfield | Hotstreak particle trails | Staggered reveal |
| **ROTAS** (Cyan) | Radar sweep | Data stream rain | Continuous flow |
| **AREPO** (Blue) | Hexagonal grid fog | Depth parallax layers | Subtle drift |
| **OPERA** (Purple) | Holographic shimmer | Lens flare on hover | Elevation change |
| **TENET** (White) | Central convergence | Radial glow expansion | Center-out reveal |

---

## III. FUNCTION: SERVICES & CONNECTIONS

### 3.1 Webpage Architecture Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SATOR WEB PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HEADER (Persistent Glassmorphism)                                  │   │
│  │  ├─ Logo (SATOR Square SVG animation)                               │   │
│  │  ├─ Hub Navigation (SATOR/ROTAS/AREPO/OPERA/TENET)                  │   │
│  │  ├─ Mode Toggle (SATOR ↔ ROTAS)                                     │   │
│  │  └─ User Profile / Settings                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  QUATERNARY GRID SYSTEM (Dynamic Layout)                            │   │
│  │                                                                     │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │   │   PANEL 1    │  │   PANEL 2    │  │   PANEL 3    │             │   │
│  │   │  (Draggable) │  │  (Draggable) │  │  (Draggable) │             │   │
│  │   │  Resizable   │  │  Resizable   │  │  Resizable   │             │   │
│  │   │              │  │              │  │              │             │   │
│  │   │  MINIMAP     │  │  LIVE MAP    │  │  ANALYTICS   │             │   │
│  │   │  (250x250)   │  │  (Full Site) │  │  (Charts)    │             │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  │                                                                     │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │   │   PANEL 4    │  │   PANEL 5    │  │   PANEL 6    │             │   │
│  │   │  (Draggable) │  │  (Draggable) │  │  (Draggable) │             │   │
│  │   │  Resizable   │  │  Resizable   │  │  Resizable   │             │   │
│  │   │              │  │              │  │              │             │   │
│  │   │  STATS       │  │  CHAT/LOGS   │  │  VIDEO FEED  │             │   │
│  │   │  (KCRITR)    │  │  (Team Comms)│  │  (VOD/Stream)│             │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  │                                                                     │   │
│  │  [+] ADD PANEL  │  [GROUP VIEW]  │  [RESET LAYOUT]                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SATOR SQUARE VISUALIZATION (Center Overlay / Modal)                │   │
│  │  ├─ Layer 1: SATOR (Hotstreaks) - Gold (#FFD700)                    │   │
│  │  ├─ Layer 2: OPERA (Fog of War) - Purple (#9D4EDD)                  │   │
│  │  ├─ Layer 3: TENET (Control) - White (#FFFFFF)                      │   │
│  │  ├─ Layer 4: AREPO (Death Stains) - Blue (#0066FF)                  │   │
│  │  └─ Layer 5: ROTAS (Rotation Trails) - Cyan (#00D4FF)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Service Connections

| Component | Connects To | Protocol | Purpose |
|-----------|-------------|----------|---------|
| Quaternary Grid | localStorage (layout persistence) | Browser API | Save panel positions/sizes |
| Minimap Panel | Supabase Realtime | WebSocket | Live position updates |
| Live Map Panel | Godot Web Export | WebAssembly | Interactive simulation |
| Analytics Panel | Kaggle API | REST | Statistical data fetching |
| Video Feed Panel | YouTube/Twitch Embed | iframe | VOD playback |
| SATOR Square | D3.js + WebGL | Canvas API | 5-layer visualization |
| Mode Toggle | Zustand Store | React Context | SATOR↔ROTAS state |
| User Auth | Supabase Auth | OAuth | Secure login |

### 3.3 Page-to-Page Relationships

| Source Page | Destination | Connection Type | Purpose |
|-------------|-------------|-----------------|---------|
| Landing (/) | /sator, /rotas, /arepo, /opera, /tenet | Navigation | Hub selection |
| Any Hub | / (Landing) | Breadcrumb | Return to center |
| SATOR Hub | Analytics Detail | Drill-down | Deep stat analysis |
| ROTAS Hub | Simulation Viewer | Modal/Overlay | Deterministic replay |
| AREPO Hub | Research Database | External API | Team/player lookup |
| OPERA Hub | Archive Browser | Internal | VOD library access |
| TENET Hub | Settings/Profile | Modal | User configuration |
| All Pages | SATOR Square Modal | Floating trigger | Palindromic visualization |

---

## IV. DOGMA: REQUIREMENTS & PURPOSE

### 4.1 Webpage Purpose Hierarchy

| Tier | Purpose | Success Metric |
|------|---------|----------------|
| Primary | Real-time tactical esports analytics dashboard | <2s data refresh |
| Secondary | Deterministic match replay & simulation | 100% reproducibility |
| Tertiary | Team collaboration & strategy sharing | Multi-user sync |
| Quaternary | Educational content & methodology | Tutorial completion rate |

### 4.2 Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| R01 | Quaternary panels must be draggable | P0 | react-grid-layout or similar |
| R02 | Panels must be resizable (min/max constraints) | P0 | Min: 200x200px, Max: 80% viewport |
| R03 | Minimap panel must support zoom (1x-5x) | P0 | Wheel scroll + buttons |
| R04 | Live Map must show real-time player positions | P0 | WebSocket <500ms latency |
| R05 | Group views (save/share layouts) | P1 | URL-encoded layout state |
| R06 | SATOR Square modal accessible from any panel | P1 | Click center hub or keyboard shortcut |
| R07 | CRT scanline toggle (accessibility) | P2 | User preference in settings |
| R08 | Export panel data to CSV/JSON | P2 | One-click download |
| R09 | Mobile-responsive grid collapse | P0 | Single column <768px |
| R10 | Cross-browser compatibility | P0 | Chrome, Firefox, Safari, Edge |

### 4.3 Ecosystem Integration

```
SATOR Web Platform
├── Connects ←── RadiantX Game (Godot 4) → Event Logs
├── Connects ←── Axiom Analytics (Python) → KCRITR Schema
├── Connects ←── Supabase (PostgreSQL) → Realtime Database
├── Connects ←── YouTube/Twitch APIs → VOD Metadata
└── Outputs  →── SATOR Public API → Third-party integrations
```

---

## V. PRAGMA: FORESEEN PROBLEMS & SOLUTIONS

### 5.1 Technical Challenges

| Problem | Root Cause | Solution | Implementation |
|---------|------------|----------|----------------|
| Layout Persistence | Users expect saved workspaces | localStorage + URL hash encoding | useLayoutEffect with debounced save |
| WebGL Performance | Mobile devices struggle with SATOR Square | Progressive enhancement (CSS fallback) | Feature detection: if (WebGL) { <Three.js /> } else { <SVG /> } |
| Real-time Sync | Multi-user collaboration conflicts | Operational Transform (OT) algorithm | Yjs library (CRDT implementation) |
| Video Sync | Minimap vs VOD timing alignment | Frame-accurate timestamps | FFmpeg metadata extraction |
| Data Overload | 37 KCRITR fields overwhelm users | Progressive disclosure (tabs/accordions) | Collapsible sections with priority indicators |
| Mobile Adaptation | Quaternary grid too dense for mobile | Single-column stack with swipe navigation | CSS Grid auto-fit with breakpoints |
| Panel State Loss | Browser refresh clears layout | localStorage auto-save | 5-second debounced persistence |
| Drag Performance | Large panels lag during move | Virtual DOM optimization | React.memo + useMemo for panel content |

### 5.2 Design Challenges

| Problem | Solution |
|---------|----------|
| Too Dark (accessibility) | Add high-contrast mode toggle (WCAG AAA) |
| Too Complex (cognitive load) | Onboarding wizard + contextual tooltips |
| Too Retro (dated feel) | Subtle gradients + glass morphism overlays |
| Too Static (boring) | Micro-animations on every interaction |
| Mobile Panel Overflow | Collapsible accordion panels with swipe gestures |
| Color Confusion | Consistent hub color mapping across all pages |

---

## VI. DYNAMIC VS STATIC ELEMENTS

### 6.1 Dynamic Elements (JavaScript Required)

| Element | Tech Stack | Update Frequency |
|---------|------------|------------------|
| Live player positions | WebSocket + Canvas | 20 TPS (real-time) |
| Minimap radar sweep | CSS Animation | 1 RPM (continuous) |
| Analytics charts | D3.js / Recharts | On data refresh |
| SATOR Square rotation | Three.js | 0.5 RPM (ambient) |
| Data stream text | Framer Motion | Staggered entrance |
| Panel drag/resize | react-grid-layout | On user interaction |
| Mode toggle (SATOR↔ROTAS) | Zustand + AnimatePresence | On click |
| Real-time notifications | Supabase Realtime | Event-driven |
| User cursor positions | Yjs + WebSocket | Continuous |
| Video playback state | React Player | On user interaction |

### 6.2 Static Elements (Server-Side or Build-Time)

| Element | Implementation | Cache Strategy |
|---------|----------------|----------------|
| Layout chrome (headers/footers) | Next.js Layout | Immutable |
| Color tokens | CSS Custom Properties | Inline <style> |
| Typography | Google Fonts (Inter, JetBrains Mono) | font-display: swap |
| Iconography | Lucide React (tree-shaken) | Component-level |
| Documentation content | Markdown → MDX | ISR (Incremental Static Regeneration) |
| KCRITR field definitions | JSON Schema | CDN edge cache |
| Hub background images | Static PNG/WebP | 1-year cache |
| SATOR Square fallback SVG | Inline SVG | Immutable |

---

## VII. RGB TEAM: AESTHETIC VALUES & DESIGN PRINCIPLES

### 7.1 Design Principles (The "SATOR Decalogue")

1. **Precision Over Decoration** — Every pixel serves analytical purpose
2. **Darkness as Default** — Reduce eye strain during extended analysis sessions
3. **Data Density With Hierarchy** — 37 fields organized by visual weight
4. **Tactical Authenticity** — Military-grade UI patterns for serious users
5. **NASA Heritage** — Honor Apollo-era mission control aesthetic
6. **Real-time Feedback** — Every action has immediate visual response
7. **Accessibility Without Compromise** — WCAG 2.1 AA minimum
8. **Performance as Design** — <100ms interaction response
9. **Deterministic Reproducibility** — Same inputs = same visual outputs
10. **Esoteric Elegance** — SATOR Square as functional art

### 7.2 Color Psychology

| Color | Hex | Psychological Effect | Application |
|-------|-----|---------------------|-------------|
| Deep Space | #0A0E12 | Focus, immersion, professionalism | Background |
| Cyan Neon | #00D4FF | Technology, trust, clarity | Primary actions, allies |
| Tactical Red | #FF4655 | Urgency, danger, enemies | Warnings, opponents |
| NASA Gold | #FFD700 | Achievement, milestones, SATOR | Success states, primary hub |
| Porcelain White | #FAFAFA | Purity, data, TENET center | High-contrast text |
| Gunmetal | #2A3A4A | Structure, containers, borders | Cards, panels |
| Toxic Green | #00FF88 | Growth, economy, positive trends | Success metrics |

---

## VIII. COLOR VALUES & GRADIENTS

### 8.1 Core Palette (CSS Custom Properties)

```css
:root {
  /* Backgrounds */
  --bg-void: #050508;
  --bg-space: #0A0E12;
  --bg-panel: #141B23;
  --bg-elevated: #1E2832;
  
  /* Accents (Hub Colors) */
  --sator-gold: #FFD700;
  --rotas-cyan: #00D4FF;
  --arepo-blue: #0066FF;
  --opera-purple: #9D4EDD;
  --tenet-white: #FAFAFA;
  
  /* Functional */
  --enemy-red: #FF4655;
  --success-green: #00FF88;
  --warning-orange: #FF6B00;
  --info-blue: #00D4FF;
  
  /* Gradients */
  --gradient-sator: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  --gradient-rotas: linear-gradient(135deg, #00D4FF 0%, #0066FF 100%);
  --gradient-alert: linear-gradient(90deg, #FF4655 0%, #FF6B00 100%);
  --gradient-scanline: linear-gradient(
    180deg,
    rgba(0, 212, 255, 0) 0%,
    rgba(0, 212, 255, 0.1) 50%,
    rgba(0, 212, 255, 0) 100%
  );
  
  /* Glow Effects */
  --glow-cyan: 0 0 20px rgba(0, 212, 255, 0.5);
  --glow-gold: 0 0 20px rgba(255, 215, 0, 0.5);
  --glow-red: 0 0 20px rgba(255, 70, 85, 0.5);
  --glow-white: 0 0 20px rgba(255, 255, 255, 0.3);
}
```

### 8.2 Analytics Color Detailing

| Metric Type | Color Scale | Gradient Direction |
|-------------|-------------|-------------------|
| Performance (ACS) | Green (#00FF88) → Yellow (#FFD700) → Red (#FF4655) | Horizontal |
| Economy | Blue (#0066FF) → White (#FFFFFF) | Vertical (credits) |
| K/D Ratio | Red (<1.0) → White (1.0) → Green (>1.0) | Segmented |
| Win Probability | Team A color ← Grayscale (50%) → Team B color | Radial gauge |
| Heatmap Density | Transparent → Blue (low) → Red (high) | Alpha + Hue |

### 8.3 Map Overlay Colors

```css
/* Minimap Overlay System */
--map-background: rgba(10, 14, 18, 0.9);
--map-grid: rgba(42, 58, 74, 0.5);
--map-ally: #00D4FF;
--map-enemy: #FF4655;
--map-spike: #FFD700;
--map-smoke: rgba(128, 128, 128, 0.6);
--map-molly: rgba(255, 107, 0, 0.4);
--map-ability-range: rgba(0, 212, 255, 0.2);
```

---

## IX. TECHTEXSPECS: TECHNICAL SPECIFICATIONS (FREE TIER)

### 9.1 Approved Technology Stack (Zero Cost)

| Layer | Technology | Free Tier Limit | Justification |
|-------|------------|-----------------|---------------|
| Framework | React 18 + Vite | Unlimited (open source) | Fast HMR, optimized builds |
| Styling | Tailwind CSS | Unlimited | Rapid prototyping |
| UI Components | Radix UI (Primitives) | Unlimited | Accessibility built-in |
| Animation | Framer Motion | Unlimited (client-side) | React-native animations |
| Icons | Lucide React | Unlimited | Tree-shakeable |
| Database | Supabase | 500MB, 2GB egress | PostgreSQL + Realtime |
| Auth | Supabase Auth | 50K MAU | OAuth providers included |
| Hosting | Vercel (Hobby) | 100GB bandwidth | Edge network |
| Storage | Cloudflare R2 | 10GB/month | S3-compatible |
| Compute | GitHub Actions | 2,000 min/month | CI/CD pipelines |
| Monitoring | Vercel Analytics | 30 days retention | Core Web Vitals |
| Error Tracking | Sentry | 5K errors/month | Error monitoring |

### 9.2 Prohibited (Paid-Only) Technologies

❌ AWS (requires credit card)  
❌ Google Cloud (requires billing account)  
❌ Datadog (paid-only)  
❌ LogRocket (paid-only)  
❌ Figma Dev Mode (paid) — Use Penpot instead  
❌ Adobe Fonts — Use Google Fonts  

### 9.3 Performance Budget

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint | <1.0s | 1.5s |
| Largest Contentful Paint | <2.5s | 4.0s |
| Time to Interactive | <3.0s | 5.0s |
| Total Bundle Size | <200KB | 500KB |
| WebGL Load Time | <1s | 2s (with fallback) |

---

## X. TYPOGRAPHY & LATIN SQUARE ORGANIZATION

### 10.1 Type Scale (SATOR Modular Scale)

| Token | Size | Line Height | Usage | Weight |
|-------|------|-------------|-------|--------|
| text-hero | 3rem (48px) | 1.1 | Page titles, SATOR logo | 800 |
| text-h1 | 2.25rem (36px) | 1.2 | Section headers | 700 |
| text-h2 | 1.5rem (24px) | 1.3 | Panel titles | 600 |
| text-h3 | 1.25rem (20px) | 1.4 | Widget headers | 600 |
| text-body | 1rem (16px) | 1.5 | General content | 400 |
| text-data | 0.875rem (14px) | 1.4 | KCRITR fields (tabular-nums) | 500 |
| text-caption | 0.75rem (12px) | 1.4 | Labels, timestamps | 400 |
| text-micro | 0.625rem (10px) | 1.2 | Fine print, legal | 400 |

### 10.2 Font Families

```css
:root {
  --font-sans: 'Inter', system-ui, sans-serif;       /* UI elements */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* Data, stats */
  --font-display: 'Inter', sans-serif;               /* Headers (tight tracking) */
  --font-tactical: 'DIN 1451', 'Roboto Condensed', sans-serif; /* Military feel */
}
```

### 10.3 LATIN Square Organization

The SATOR Square must be displayed using true Latin Square principles:

```
Visual Layout (CSS Grid):
┌─────────┬─────────┬─────────┐
│  SATOR  │  AREPO  │   OPERA  │
│ (Gold)  │ (Blue)  │ (Purple) │
├─────────┼─────────┼─────────┤
│  TENET  │  CENTER │  TENET   │
│ (White) │ (Hub)   │ (White)  │
├─────────┼─────────┼─────────┤
│  ROTAS  │  AREPO  │   SATOR  │
│ (Cyan)  │ (Blue)  │ (Gold)   │
└─────────┴─────────┴─────────┘

Text Direction (Reading):
SATOR (Top → Center)
ROTAS (Bottom → Center, reversed)
AREPO (Left → Center)
OPERA (Right → Center, reversed)
TENET (Vertical axis, center)

Animation: 0.5 RPM rotation when active
```

---

## XI. SFX: LENS OVERLAYS & VISUALIZATIONS

### 11.1 Lens Overlay Effects

| Overlay | Trigger | Visual Treatment | Tech |
|---------|---------|------------------|------|
| Thermal Vision | Enemy highlighting | Red-orange gradient map with noise | CSS mix-blend-mode: overlay + SVG filter |
| Night Vision | Low-light maps | Green monochrome (#00FF00) with scanlines | CSS filter hue-rotate(90deg) |
| Tactical Grid | Planning mode | Hexagonal grid overlay with coordinate labels | SVG pattern + Canvas text |
| Range Finder | Ability targeting | Concentric circles with distance markers | SVG circles + stroke-dasharray |
| Threat Detector | Enemy proximity | Pulsing red vignette | CSS radial-gradient + animation |
| Data Link | Real-time sync | Cyan connection lines between allies | SVG paths with stroke-dashoffset animation |

### 11.2 WebGL Shaders (SATOR Square)

```glsl
// Vertex Shader (SATOR Square rotation)
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Subtle breathing animation
  float breathe = sin(uTime * 0.5) * 0.02;
  pos.z += breathe;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

// Fragment Shader (Layer coloring)
uniform vec3 uColor;
uniform float uOpacity;

void main() {
  // Grid lines
  float grid = step(0.98, fract(vUv.x * 10.0)) + step(0.98, fract(vUv.y * 10.0));
  
  vec3 finalColor = mix(uColor, vec3(1.0), grid * 0.3);
  gl_FragColor = vec4(finalColor, uOpacity);
}
```

### 11.3 Sound Effects (Optional Enhancement)

| Event | Sound | Frequency |
|-------|-------|-----------|
| Panel focus | Subtle click (80Hz) | 200ms |
| Mode switch | Cyberpunk whoosh | 500ms |
| Data refresh | Digital chirp | 100ms |
| Alert/warning | Tactical beep | 400Hz, 200ms |
| SATOR Square activate | Deep resonance | 100Hz, 1s |

---

## XII. AI PROMPT: COMPLETE WEBSITE UI/UX DESIGN

### PROMPT FOR AI CODE GENERATION

```markdown
# SATOR eXe ROTAS — Website UI/UX Implementation Prompt

## ROLE & CONTEXT
You are a senior React/TypeScript developer specializing in tactical esports analytics dashboards. You have studied NASA Mission Control aesthetics, Swiss Brutalist web design, and modern CSS Grid layouts. You prioritize performance, accessibility, and visual impact equally.

## PROJECT OVERVIEW
Build the SATOR Web Platform — a Quaternary Grid-based analytics dashboard for Valorant esports. The design must evoke Apollo-era mission control while maintaining modern usability standards.

## DESIGN SYSTEM (MANDATORY ADHERENCE)

### Color Palette (EXACT hex codes only)
- Background: #0A0E12 (Deep Space)
- SATOR Hub: #FFD700 (Gold)
- ROTAS Hub: #00D4FF (Cyan)
- AREPO Hub: #0066FF (Blue)
- OPERA Hub: #9D4EDD (Purple)
- Enemy/Warning: #FF4655 (Red)
- Success: #00FF88 (Green)
- Text: #FAFAFA (White)

### Typography
- Primary: Inter (Google Fonts)
- Data: JetBrains Mono (tabular-nums mandatory)
- Weights: 400 (body), 600 (headers), 800 (hero)

### Effects
- CRT scanlines: CSS gradient overlay
- Neon glows: box-shadow with rgba()
- Backdrop blur: 8px on glass panels
- Border radius: 0 (chamfered corners via clip-path) or 4px (tactical)

## CORE FEATURES TO IMPLEMENT

### 1. QUATERNARY GRID SYSTEM
- Use react-grid-layout for drag-and-drop panels
- Minimum panel size: 200x200px
- Maximum panel size: 80% of viewport
- Persist layout to localStorage
- Support "Group Views" (save/load multiple layouts)

### 2. PANEL COMPONENTS
Each panel must include:
- Header with title and controls (minimize, maximize, close)
- Drag handle (top bar)
- Resize handle (bottom-right corner)
- Content area with proper overflow handling

Panel Types:
- Minimap (250x250 default, zoom 1x-5x)
- Live Map (full tactical map, real-time positions)
- Analytics (charts using Recharts or Victory)
- Stats (KCRITR 37-field data, tabular-nums)
- Video (YouTube/Twitch embed)
- Chat (team communications log)

### 3. SATOR SQUARE VISUALIZATION
- Center modal/overlay accessible from any panel
- 5-layer palindromic structure (SATOR-AREPO-TENET-OPERA-ROTAS)
- Colors correspond to hub colors above
- Rotation animation (0.5 RPM)
- Click layer to navigate to that hub

### 4. MODE TOGGLE (SATOR ↔ ROTAS)
- Global state toggle in header
- SATOR mode: Blue accent (#00D4FF), data ingestion view
- ROTAS mode: Red accent (#FF4655), analytics/prediction view
- Animate transition between modes (Framer Motion)

## TECHNICAL REQUIREMENTS

### Stack (Free Tier Only)
- Framework: React 18 + Vite
- Styling: Tailwind CSS
- Animation: Framer Motion
- Grid: react-grid-layout
- Charts: Recharts
- Icons: Lucide React
- State: Zustand
- Database: Supabase (500MB free tier)

### Performance
- First paint <1s
- Bundle size <200KB initial
- 60fps animations
- WebGL fallback to SVG for mobile

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader labels for all interactive elements
- High contrast mode toggle

## COMMON AI PITFALLS TO AVOID

❌ DON'T use rounded corners everywhere (use chamfered/military angles)
❌ DON'T use default Material Design (too generic)
❌ DON'T forget mobile responsive (60% of users on mobile)
❌ DON'T use placeholder text (use realistic esports data)
❌ DON'T ignore the CRT/scanline aesthetic (core to NASA heritage)
❌ DON'T use generic blue for links (use cyan #00D4FF)

✅ DO use tabular-nums for all statistics (alignment)
✅ DO implement proper dark mode (default, not optional)
✅ DO add micro-interactions (hover states, button presses)
✅ DO use the exact hex colors provided (no approximations)
✅ DO test at 320px width (minimum mobile viewport)

## REFERENCE RESOURCES

### Design Inspiration
- NASA Apollo Mission Control photos (consoles, data density)
- Game: "Observation" (space station UI)
- Game: "Alien: Isolation" (retro-futuristic terminals)
- Website: "https://spacex.com" (minimal, technical)
- Website: "https://www.nationalmuseum.af.mil" (military precision)

### Technical References
- react-grid-layout docs: https://github.com/react-grid-layout/react-grid-layout
- Framer Motion: https://www.framer.com/motion/
- Tailwind CSS: https://tailwindcss.com/docs

## DELIVERABLES

1. Complete React + Vite project structure
2. Theme configuration (colors, typography, spacing)
3. Quaternary Grid layout with 6 panel types
4. SATOR Square visualization component
5. Mode toggle system (SATOR/ROTAS)
6. Sample data for demonstration (realistic Valorant stats)
7. Responsive breakpoints (mobile, tablet, desktop)
8. Performance optimization (lazy loading, code splitting)

## SUCCESS CRITERIA

- [ ] All 6 panel types render without errors
- [ ] Drag/resize functionality works smoothly (60fps)
- [ ] Layout persists after refresh (localStorage)
- [ ] SATOR Square renders with WebGL (Three.js) or SVG fallback
- [ ] Mode toggle switches themes instantly
- [ ] Mobile responsive (single column on <768px)
- [ ] Lighthouse score >90 (Performance, Accessibility, Best Practices)
- [ ] Zero TypeScript errors
- [ ] No console warnings in production build

Execute this implementation with precision, adhering strictly to the design system specifications provided.
```

---

*End of Comprehensive Design Specification Document*
