# 🤖 FOREMAN PLAN: Website Visual Design Implementation
## Multi-Phase Sub-Agent Deployment Strategy

**Date:** March 5, 2026  
**Objective:** Implement missing visual design elements (35% → 95%)  
**Estimated Duration:** 40-60 hours  
**Agents Required:** 13 specialized sub-agents

---

## 🎯 PROJECT OVERVIEW

### Scope
Transform current website from basic implementation (35%) to full visual design specification (95%) by implementing:
- Sacred geometry visual assets
- Checkerboard Lipstick aesthetic
- GSAP/Three.js animations
- Typography system (Cinzel, Orbitron)
- Layout components (hero, grids, panels)

### Success Criteria
- [ ] All 26 sacred geometry images integrated
- [ ] Checkerboard hero section live
- [ ] GSAP animations on all hubs
- [ ] Three.js SATOR Sphere functional
- [ ] Typography system unified
- [ ] Color palette consistent
- [ ] Lighthouse 90+ performance maintained

---

## 👥 FOREMAN-AGENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    FOREMAN COORDINATOR                       │
│              (Task Orchestration & Integration)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┬──────────────┐
    │              │              │              │              │
┌───▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
│ AGENT  │   │ AGENT   │   │ AGENT   │   │ AGENT   │   │ AGENT   │
│ ASSET  │   │ COLOR   │   │ TYPO    │   │ GSAP    │   │ THREE   │
│ INTEGR │   │ PALETTE │   │ GRAPHY  │   │ ANIM    │   │ JS      │
└────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│              │              │              │              │
┌───▼────┐   ┌▼───────┐   ┌──▼────┐   ┌────▼───┐   ┌───▼────┐
│ AGENT  │   │ AGENT  │   │ AGENT │   │ AGENT  │   │ AGENT  │
│ HUB1   │   │ HUB2   │   │ HUB3  │   │ HUB4   │   │ QA     │
│ SATOR  │   │ ROTAS  │   │ INFO  │   │ GAMES  │   │ TEST   │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘
```

---

## 📋 PHASE-BY-PHASE BREAKDOWN

### PHASE 0: Infrastructure Setup (2 hours)
**Agent:** Foreman  
**Tasks:**
1. Verify all sub-agent spawn capabilities
2. Prepare workspace branches
3. Set up asset pipelines
4. Create integration checkpoints

**Deliverables:**
- Branch structure: `feature/visual-design-phase-{N}`
- Asset pipeline scripts
- Integration manifest

---

### PHASE 1: Asset Migration & Optimization (8 hours)

#### AGENT 01: Asset Integration Specialist
**Duration:** 4 hours  
**Focus:** Sacred geometry image migration

**Tasks:**
1. Migrate 26 images from archive to production
   ```
   FROM: /website/archive/2024-legacy/hub1-satorxrotas/assets/
   TO:   /website/hub1-sator/assets/sacred-geometry/
   ```

2. Organize by category:
   - `/astronomical/` - Arabic celestial diagrams
   - `/alchemical/` - Spiriti Damnati, etc.
   - `/psychological/` - Jung maps
   - `/mathematical/` - Lissajous figures
   - `/wellness/` - Wellbeing, soul elements

3. Create WebP versions
4. Generate responsive sizes (sm, md, lg, xl)
5. Create image manifest JSON

**Deliverables:**
- `hub1-sator/assets/sacred-geometry/` (organized)
- `shared/assets/image-manifest.json`
- WebP conversion complete

**Spawn Command:**
```json
{
  "task": "Migrate and optimize all 26 sacred geometry images from /website/archive/2024-legacy/hub1-satorxrotas/assets/ to /website/hub1-sator/assets/sacred-geometry/. Organize into folders: astronomical/, alchemical/, psychological/, mathematical/, wellness/. Convert all to WebP with 85% quality. Generate responsive sizes. Create image-manifest.json with metadata.",
  "agentId": "asset-specialist",
  "thinking": "high",
  "timeoutSeconds": 14400
}
```

---

### PHASE 2: Design System Unification (6 hours)

#### AGENT 02: Color Palette Unification
**Duration:** 3 hours  
**Focus:** Merge design system color tokens

**Tasks:**
1. Extract colors from:
   - `checkerboard.css` (lipstick palette)
   - `njz-design-system.css` (NJZ palette)
   - `index.html` (RadiantX palette)

2. Create unified design tokens:
   ```css
   /* /website/shared/styles/design-tokens.css */
   :root {
     /* Brand Core */
     --brand-hot-pink: #FF006E;
     --brand-neon-pink: #FF1493;
     --brand-cyan: #00F0FF;
     --brand-electric: #39FF14;
     
     /* Hub-Specific */
     --sator-gold: #D4AF37;
     --sator-copper: #B87333;
     --rotas-cyan: #00d4ff;
     --radiant-red: #ff4655;
     
     /* Functional */
     --bg-primary: #0a0a0f;
     --bg-secondary: #14141f;
     --text-primary: #ffffff;
     --text-secondary: #8a8a9a;
   }
   ```

3. Update all hub CSS files to use tokens
4. Create CSS custom properties fallback

**Deliverables:**
- `/website/shared/styles/design-tokens.css`
- Updated hub stylesheets
- Color migration guide

---

#### AGENT 03: Typography System Implementation
**Duration:** 3 hours  
**Focus:** Font system unification

**Tasks:**
1. Add missing fonts to all hubs:
   - Cinzel (esoteric headers)
   - Orbitron (gaming/tech)
   - Optimize loading with font-display: swap

2. Create typography scale:
   ```css
   --font-cinzel: 'Cinzel', serif;
   --font-orbitron: 'Orbitron', sans-serif;
   --font-inter: 'Inter', sans-serif;
   --font-mono: 'JetBrains Mono', monospace;
   
   --text-hero: clamp(3rem, 12vw, 8rem);
   --text-h1: clamp(2rem, 5vw, 4rem);
   --text-h2: clamp(1.5rem, 3vw, 2.5rem);
   --text-body: 1rem;
   ```

3. Apply typography to components:
   - Hub 1: Cinzel for esoteric headers
   - Hub 2: Orbitron for gaming elements
   - Hub 3: Inter for data/analytics
   - All: Mono for statistics

4. Optimize font loading (subsetting, preloading)

**Deliverables:**
- `/website/shared/styles/typography.css`
- Font loading optimization
- Typography component classes

---

### PHASE 3: Layout Components (10 hours)

#### AGENT 04: Checkerboard Hero Implementation
**Duration:** 4 hours  
**Focus:** Main portal hero section

**Tasks:**
1. Migrate from `/website/archive/2024-legacy/main-portal/`
2. Integrate with current header/navigation
3. Implement:
   - Animated checkerboard background
   - "DARE TO WEAR" typography
   - Hot pink accent grid
   - Scroll indicator

4. Ensure responsive behavior
5. Add reduced-motion support

**Deliverables:**
- Updated `/website/index.html` hero section
- `checkerboard-hero.css` component
- Mobile-responsive styles

---

#### AGENT 05: Hub 1 (SATOR) Visual Enhancement
**Duration:** 3 hours  
**Focus:** Esoteric aesthetic

**Tasks:**
1. Integrate sacred geometry images:
   - Background overlays
   - Particle system textures
   - Section dividers

2. Implement color palette:
   - Gold/copper accents
   - Parchment textures
   - Ink-colored text

3. Add scroll-triggered reveals:
   - GSAP ScrollTrigger
   - Image fade-ins
   - Text animations

4. Enhance ring system animations

**Deliverables:**
- Enhanced `hub1-sator/index.html`
- Sacred geometry integration
- SATOR-specific animations

---

#### AGENT 06: Hub 2 (ROTAS) Visual Enhancement
**Duration:** 3 hours  
**Focus:** Gaming aesthetic

**Tasks:**
1. Implement "DARE TO WEAR" component:
   - B&W makeup photo grid
   - Pink accent boxes
   - Hover interactions

2. Add CRT scanline effects:
   - Data panel overlays
   - Match predictor styling
   - Probability gauge animations

3. Enhance ellipse system:
   - Orbitron typography
   - Neon glow effects
   - Data flow animations

**Deliverables:**
- Enhanced `hub2-rotas/` components
- CRT effect CSS
- Gaming aesthetic polish

---

### PHASE 4: Animation System (12 hours)

#### AGENT 07: GSAP Animation Implementation
**Duration:** 6 hours  
**Focus:** JavaScript animations

**Tasks:**
1. Install GSAP:
   ```bash
   npm install gsap @gsap/react
   ```

2. Implement animations:
   - Hero entrance sequences
   - Scroll-triggered reveals
   - Hub card hover effects
   - Page transitions
   - Staggered list animations

3. Create reusable animation components:
   - FadeIn
   - SlideUp
   - ScaleIn
   - StaggerContainer

4. Add scroll-triggered parallax

5. Ensure accessibility (prefers-reduced-motion)

**Deliverables:**
- `/website/shared/js/animations.js`
- GSAP component library
- Animation documentation

---

#### AGENT 08: Three.js SATOR Sphere
**Duration:** 6 hours  
**Focus:** 3D visualization

**Tasks:**
1. Install Three.js:
   ```bash
   npm install three @react-three/fiber
   ```

2. Create SATOR Sphere 3D component:
   - Icosahedron geometry
   - Text labels on facets
   - Rotation animation
   - Mouse interaction
   - Particle system

3. Integrate into Hub 1 hero
4. Optimize for mobile (fallback to SVG)
5. Add loading state

**Deliverables:**
- `/website/shared/js/sator-sphere-3d.js`
- Three.js component
- Mobile fallback

---

### PHASE 5: Hub-Specific Polish (8 hours)

#### AGENT 09: Hub 3 (Information) Enhancement
**Duration:** 4 hours  
**Focus:** Glassmorphism + Swiss design

**Tasks:**
1. Implement glassmorphism panels:
   ```css
   .glass-panel {
     background: rgba(255, 255, 255, 0.05);
     backdrop-filter: blur(10px);
     border: 1px solid rgba(255, 255, 255, 0.1);
   }
   ```

2. Create 24-service directory grid
3. Add Cmd+K search functionality
4. Implement category filters
5. Enhance NJZ Grid with animations

**Deliverables:**
- Enhanced `hub3-information/`
- Glassmorphism components
- Directory grid system

---

#### AGENT 10: Hub 4 (Games) Enhancement
**Duration:** 4 hours  
**Focus:** Polish and consistency

**Tasks:**
1. Align with unified design tokens
2. Enhance TorusFlow animation
3. Polish download section
4. Ensure consistency with other hubs
5. Optimize bundle size (already done)

**Deliverables:**
- Polished `hub4-games/`
- Design system alignment
- Performance optimized

---

### PHASE 6: Integration & QA (10 hours)

#### AGENT 11: Cross-Hub Integration
**Duration:** 4 hours  
**Focus:** Consistency and flow

**Tasks:**
1. Verify all hubs use unified design tokens
2. Ensure consistent navigation
3. Test cross-hub links
4. Verify shared components work everywhere
5. Check mobile responsiveness across all hubs

**Deliverables:**
- Integration report
- Consistency fixes
- Navigation verification

---

#### AGENT 12: Performance Optimization
**Duration:** 3 hours  
**Focus:** Lighthouse 90+

**Tasks:**
1. Run Lighthouse audit on all hubs
2. Optimize image loading (lazy, WebP)
3. Minimize render-blocking resources
4. Optimize animations (GPU acceleration)
5. Ensure bundle sizes within budget

**Deliverables:**
- Lighthouse reports
- Performance optimizations
- Budget compliance verification

---

#### AGENT 13: Final QA & Bug Fixes
**Duration:** 3 hours  
**Focus:** Quality assurance

**Tasks:**
1. Cross-browser testing (Chrome, Firefox, Safari)
2. Mobile testing (iOS, Android)
3. Accessibility audit (WCAG 2.1 AA)
4. Visual regression testing
5. Bug fixes and polish

**Deliverables:**
- QA report
- Bug fix commits
- Final sign-off checklist

---

## ⏱️ TIMELINE

| Phase | Duration | Agents | Parallel |
|-------|----------|--------|----------|
| 0: Setup | 2h | 1 | No |
| 1: Assets | 8h | 1 | No |
| 2: Design System | 6h | 2 | Yes |
| 3: Layout | 10h | 3 | Yes |
| 4: Animation | 12h | 2 | Yes |
| 5: Hub Polish | 8h | 2 | Yes |
| 6: Integration | 10h | 3 | Yes |
| **Total** | **56h** | **13** | **-** |

---

## 🔄 DEPENDENCY GRAPH

```
Phase 0 (Setup)
    │
    ├── Phase 1 (Assets) ──────┐
    │                          │
    ├── Phase 2 (Design) ──────┼── Phase 3 (Layout)
    │       ├── Color          │       ├── Hero
    │       └── Typography     │       ├── Hub 1
    │                          │       ├── Hub 2
    Phase 4 (Animation) ◄──────┤       └── Hub 3/4
            ├── GSAP           │
            └── Three.js       │
                               │
                               └── Phase 5 (Hub Polish)
                                       ├── Hub 3
                                       └── Hub 4
    
    Phase 6 (Integration)
        ├── Cross-Hub
        ├── Performance
        └── QA
```

---

## 📤 SPAWN COMMANDS

### Batch 1: Phase 1-2 (Parallel)
```json
{
  "agents": [
    {
      "agentId": "asset-specialist",
      "task": "Phase 1: Migrate sacred geometry images...",
      "timeout": 14400
    },
    {
      "agentId": "color-specialist", 
      "task": "Phase 2: Unify color palette...",
      "timeout": 10800
    },
    {
      "agentId": "typography-specialist",
      "task": "Phase 2: Implement typography system...",
      "timeout": 10800
    }
  ]
}
```

### Batch 2: Phase 3-4 (After Batch 1)
```json
{
  "agents": [
    {
      "agentId": "layout-specialist",
      "task": "Phase 3: Implement layout components...",
      "timeout": 18000
    },
    {
      "agentId": "gsap-specialist",
      "task": "Phase 4: GSAP animations...",
      "timeout": 21600
    },
    {
      "agentId": "threejs-specialist",
      "task": "Phase 4: Three.js SATOR Sphere...",
      "timeout": 21600
    }
  ]
}
```

### Batch 3: Phase 5-6 (After Batch 2)
```json
{
  "agents": [
    {
      "agentId": "hub3-specialist",
      "task": "Phase 5: Hub 3 enhancement...",
      "timeout": 14400
    },
    {
      "agentId": "integration-specialist",
      "task": "Phase 6: Cross-hub integration...",
      "timeout": 14400
    },
    {
      "agentId": "qa-specialist",
      "task": "Phase 6: Final QA...",
      "timeout": 10800
    }
  ]
}
```

---

## ✅ COMPLETION CRITERIA

### Visual Design (95%)
- [ ] All 26 sacred geometry images integrated
- [ ] Checkerboard hero section live
- [ ] Color palette unified across all hubs
- [ ] Typography system (Cinzel, Orbitron) implemented
- [ ] "DARE TO WEAR" component functional

### Animations (90%)
- [ ] GSAP animations on all hubs
- [ ] Three.js SATOR Sphere functional
- [ ] Scroll-triggered reveals working
- [ ] Page transitions smooth

### Performance (90+)
- [ ] Lighthouse 90+ all categories
- [ ] Bundle sizes within budget
- [ ] Images optimized (WebP)
- [ ] Fonts optimized (swap)

### Quality (100%)
- [ ] Cross-browser compatible
- [ ] Mobile responsive
- [ ] WCAG 2.1 AA accessible
- [ ] No visual regressions

---

*Foreman Plan created: March 5, 2026*  
*Ready for agent deployment*