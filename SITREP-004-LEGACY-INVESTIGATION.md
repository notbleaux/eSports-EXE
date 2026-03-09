[Ver001.000]

# SITREP-004: LEGACY INVESTIGATION REPORT
**Subject:** hvrryh-web/satorXrotas Repository Analysis  
**Classification:** Gilded Legacy Redesign — PASS 1 COMPLETE  
**Timestamp:** 2026-03-09T22:43:00Z  
**Agent:** Async-Subagent-1

---

## 1. EXECUTIVE SUMMARY

The satorXrotas repository has been identified as the **NJZ Platform v2.0** — a sophisticated 4-hub esports analytics platform built on React 18 with advanced visualizations. The codebase requires **gilding** (version header standardization, structural organization, and archival framework) to transform it into a "Gilded Legacy Repository."

**Current State:** Functional, modern React application  
**Desired State:** Properly versioned, documented, and archived legacy codebase  
**Complexity:** Medium-High (multi-hub architecture, 3D visualizations, state management)

---

## 2. REPOSITORY INVENTORY

### 2.1 Primary Location
```
/root/.openclaw/workspace/main-repo/apps/website-v2/
```

### 2.2 Architecture Overview
| Hub | Name | Purpose | Accent Color |
|-----|------|---------|--------------|
| Hub 1 | **SATOR** | The Observatory — Raw data ingestion | Alert Amber `#ff9f1c` |
| Hub 2 | **ROTAS** | The Harmonic Layer — Analytics | Signal Cyan `#00f0ff` |
| Hub 3 | **Information** | The Directory | Porcelain `#e8e6e3` |
| Hub 4 | **Games** | The Nexus | Deep Cobalt `#1e3a5f` |

### 2.3 Core Technologies
- **Framework:** React 18.2.0 + Vite 5.0
- **Styling:** Tailwind CSS 3.3 + Custom CSS variables
- **Animation:** Framer Motion 10.16 + GSAP 3.12
- **3D Graphics:** Three.js 0.158 + React Three Fiber
- **State:** Zustand 4.4
- **Routing:** React Router 6.20
- **Icons:** Lucide React

### 2.4 File Structure Analysis
```
website-v2/
├── src/
│   ├── hub-1-sator/SATORHub.jsx       [12KB] — Orbital ring system, RAWS core
│   ├── hub-2-rotas/ROTASHub.jsx       [18KB] — Layer blending, BASE analytics
│   ├── hub-3-info/InformationHub.jsx  [12KB] — Directory interface
│   ├── hub-4-games/GamesHub.jsx       [15KB] — Nexus hub
│   ├── shared/components/             [10 files] — Reusable UI
│   └── shared/store/njzStore.js       [6KB] — Zustand state
├── hub-1-sator/                       [Legacy standalone]
├── hub-2-rotas/                       [Empty — placeholder]
├── shared/                            [VFX, components, hooks]
├── index.html, package.json, README.md
└── dist/                              [Build output]
```

### 2.5 Legacy Archive Versions
```
/website/archive/2024-legacy/hub1-satorxrotas/     [Vanilla JS predecessor]
/docs/website/archive/2024-legacy/hub1-satorxrotas/ [Duplicate]
```
**Archive Contents:**
- Pure JavaScript implementation (pre-React)
- Custom particle systems (particles.js, sphere.js)
- Static CSS styling (main.css)
- Jungian psychology visual assets (jung_maps.jpg, soul_elements.jpg, etc.)

---

## 3. CURRENT vs DESIRED STATE

### 3.1 Current State Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Version Headers | ❌ NONE | 0% compliance — No [VerMMM.mmm] headers |
| File Documentation | ⚠️ PARTIAL | README exists, inline comments sparse |
| Code Organization | ✅ GOOD | Clear separation of concerns |
| Legacy Archival | ⚠️ FRAGMENTED | Archive exists but not formally structured |
| Build System | ✅ MODERN | Vite-based, production-ready |
| Dependencies | ✅ CURRENT | Recent versions, no critical vulnerabilities |

### 3.2 "Gilded Legacy" Desired State

| Aspect | Target |
|--------|--------|
| Version Headers | 100% compliance — [Ver002.000] for v2.0 release |
| Repository Structure | `/current/`, `/archive/`, `/docs/` separation |
| Documentation | Complete API docs + architecture diagrams |
| Versioning System | Semantic with [VerMMM.mmm] headers |
| Archival Framework | Formal migration path from v1 (vanilla) → v2 (React) |
| Legacy Preservation | Archived 2024 vanilla JS version properly catalogued |

---

## 4. PRESERVE vs ARCHIVE ANALYSIS

### 4.1 PRESERVE (Current/Maintenance)
These files are actively maintained and form the current production codebase:

**Critical Core (Preserve):**
- `src/App.jsx` — Main application router
- `src/main.jsx` — Entry point
- `src/index.css` — Design tokens, global styles
- `src/hub-1-sator/SATORHub.jsx` — SATOR observatory hub
- `src/hub-2-rotas/ROTASHub.jsx` — ROTAS analytics hub
- `src/shared/components/HubWrapper.jsx` — Layout component
- `src/shared/store/njzStore.js` — State management
- `shared/vfx/*` — Visual effects (ParticleSystems, FluidSmokeEffects)

**Supporting (Preserve):**
- `package.json`, `vite.config.js`, `tailwind.config.js`
- `README.md` (to be enhanced)
- `index.html`

### 4.2 ARCHIVE (Legacy/Read-Only)
These represent historical versions or superseded implementations:

**Archive Candidates:**
- `/website/archive/2024-legacy/hub1-satorxrotas/` — Complete vanilla JS v1.0
  - `js/sator.js` — Pre-React SATOR implementation
  - `js/particles.js` — Legacy particle system
  - `js/sphere.js` — 3D sphere visualization
  - `css/main.css` — Original styling
  - `assets/*` — Jungian psychology artwork

**Duplications to Consolidate:**
- `/docs/website/archive/2024-legacy/` — Duplicate of `/website/archive/`

### 4.3 CONSOLIDATE/MERGE
- `hub-1-sator/` (root level) appears to be a standalone demo — **Merge into main** or **Archive**
- `hub-2-rotas/` (root level) is empty — **Remove** or repurpose

---

## 5. KEY FINDINGS

### 5.1 SATOR/ROTAS Philosophy
The codebase implements a **twin-file philosophy**:
- **RAWS** (Raw Archive Write System) — Immutable data snapshots (SATOR)
- **BASE** (Base Analytics System for Esports) — Processed analytics (ROTAS)

This mirrors the ancient SATOR square palindrome — a recursive, self-referential data structure.

### 5.2 Visual Design System
- **Abyssal Depth Aesthetic:** Deep void blacks (`#0a0a0f`)
- **Signal Colors:** Alert Amber, Signal Cyan, Aged Gold
- **Glassmorphism:** Consistent use across all hubs
- **Motion:** 60fps animations, reduced motion support

### 5.3 Technical Debt
1. **No version headers** — 0% compliance with project standards
2. **hub-2-rotas/ at root level** — Empty directory, confusing structure
3. **Duplicate archive locations** — `/docs/` vs `/website/`
4. **Legacy hub-1-sator/** — Standalone version may be outdated

---

## 6. RECOMMENDATIONS FOR PASS 2

1. **Create repository structure:**
   ```
   satorXrotas-gilded/
   ├── current/v2.0.0/          [Main React codebase]
   ├── archive/v1.0.0/          [2024 vanilla JS]
   ├── docs/architecture/       [Technical documentation]
   └── README-GILDED.md         [Master index]
   ```

2. **Implement versioning scheme:**
   - Current: [Ver002.000] for v2.0 release
   - Archive v1: [Ver001.000] for 2024 legacy

3. **Add version headers to:**
   - All source files in `src/`
   - All shared components
   - Configuration files
   - Documentation

4. **Create archival documentation** tracing evolution from v1 → v2

---

## 7. NEXT ACTIONS

✅ **PASS 1 COMPLETE:** Investigation documented  
⏳ **PASS 2 READY:** Structure design pending  
⏳ **PASS 3 READY:** Implementation pending

---

**End of SITREP-004**
