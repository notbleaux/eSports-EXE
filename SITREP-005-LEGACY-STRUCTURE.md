[Ver002.000]

# SITREP-005: LEGACY STRUCTURE DESIGN
**Subject:** Gilded Legacy Repository Architecture  
**Classification:** Gilded Legacy Redesign — PASS 2 COMPLETE  
**Timestamp:** 2026-03-09T22:48:00Z  
**Agent:** Async-Subagent-1

---

## 1. EXECUTIVE SUMMARY

Designed comprehensive "Gilded Legacy Repository" structure for satorXrotas. The new architecture separates **current production code**, **archived historical versions**, and **documentation** into a formal, version-controlled hierarchy with standardized [VerMMM.mmm] headers.

**Design Principles:**
1. **Clear Separation** — Current vs Archive vs Docs
2. **Traceability** — Complete lineage from v1.0 → v2.0
3. **Discoverability** — Self-documenting structure
4. **Extensibility** — Room for v3.0, v4.0...

---

## 2. NEW REPOSITORY STRUCTURE

```
satorXrotas-gilded/                          [Gilded Legacy Root]
│
├── 📁 current/                               [ACTIVE DEVELOPMENT]
│   └── 📁 v2.0.0/                           [Current Production]
│       ├── 📄 INDEX.md                       [v2.0 Master Index]
│       ├── 📄 manifest.json                  [Build manifest]
│       │
│       ├── 📁 src/                          [Source Code]
│       │   ├── 📄 App.jsx                   [Main Router]
│       │   ├── 📄 main.jsx                  [Entry Point]
│       │   ├── 📄 index.css                 [Global Styles]
│       │   │
│       │   ├── 📁 hub-1-sator/              [SATOR Observatory]
│       │   │   └── 📄 SATORHub.jsx
│       │   ├── 📁 hub-2-rotas/              [ROTAS Analytics]
│       │   │   └── 📄 ROTASHub.jsx
│       │   ├── 📁 hub-3-info/               [Information Hub]
│       │   │   └── 📄 InformationHub.jsx
│       │   ├── 📁 hub-4-games/              [Games Nexus]
│       │   │   └── 📄 GamesHub.jsx
│       │   │
│       │   ├── 📁 shared/
│       │   │   ├── 📁 components/           [Shared UI]
│       │   │   │   ├── 📄 Navigation.jsx
│       │   │   │   ├── 📄 Footer.jsx
│       │   │   │   ├── 📄 HubWrapper.jsx
│       │   │   │   ├── 📄 CentralGrid.jsx
│       │   │   │   ├── 📄 TwinFileVisualizer.jsx
│       │   │   │   └── 📄 ...
│       │   │   │
│       │   │   └── 📁 store/
│       │   │       └── 📄 njzStore.js       [Zustand State]
│       │   │
│       │   └── 📁 styles/
│       │       └── 📄 mobile.css
│       │
│       ├── 📁 shared/                       [Cross-Cutting Code]
│       │   ├── 📁 components/               [UI Components]
│       │   │   ├── 📄 Button.jsx
│       │   │   ├── 📄 HubCard.jsx
│       │   │   ├── 📄 Input.jsx
│       │   │   └── 📄 Navigation.jsx
│       │   │
│       │   ├── 📁 vfx/                      [Visual Effects]
│       │   │   ├── 📄 ParticleSystems.jsx
│       │   │   ├── 📄 FluidSmokeEffects.jsx
│       │   │   └── 📄 AbyssalGradientShader.jsx
│       │   │
│       │   ├── 📁 hooks/                    [Custom Hooks]
│       │   │   ├── 📄 useFluidTransition.js
│       │   │   ├── 📄 useScrollAnimation.js
│       │   │   └── 📄 useAbyssalGradient.js
│       │   │
│       │   ├── 📁 js/                       [Utilities]
│       │   │   ├── 📄 animations.js
│       │   │   ├── 📄 fluid-effects.js
│       │   │   └── 📄 transitions.js
│       │   │
│       │   └── 📁 styles/                   [Design System]
│       │       ├── 📄 design-tokens.css
│       │       ├── 📄 sator-tokens.css
│       │       ├── 📄 glassmorphism.css
│       │       ├── 📄 typography.css
│       │       └── 📄 animations.css
│       │
│       ├── 📁 config/                       [Configuration]
│       │   ├── 📄 package.json
│       │   ├── 📄 vite.config.js
│       │   ├── 📄 tailwind.config.js
│       │   └── 📄 index.html
│       │
│       └── 📁 docs/                         [v2.0 Documentation]
│           ├── 📄 README.md
│           ├── 📄 API.md
│           ├── 📄 ARCHITECTURE.md
│           └── 📄 CHANGELOG-v2.md
│
├── 📁 archive/                              [HISTORICAL VERSIONS]
│   └── 📁 v1.0.0/                          [2024 Vanilla JS]
│       ├── 📄 INDEX.md                       [v1.0 Archive Index]
│       ├── 📄 manifest.json                  [Archive manifest]
│       │
│       ├── 📁 src/                          [Original Source]
│       │   ├── 📄 sator.js
│       │   ├── 📄 particles.js
│       │   └── 📄 sphere.js
│       │
│       ├── 📁 css/
│       │   └── 📄 main.css
│       │
│       ├── 📁 assets/                       [Legacy Visuals]
│       │   ├── 🖼️ jung_maps.jpg
│       │   ├── 🖼️ soul_elements.jpg
│       │   ├── 🖼️ lissajous.jpg
│       │   └── 🖼️ ...
│       │
│       └── 📁 docs/
│           └── 📄 README.md
│
├── 📁 docs/                                  [PROJECT DOCUMENTATION]
│   ├── 📄 GILDED-README.md                   [Master Entry Point]
│   ├── 📄 EVOLUTION.md                       [v1 → v2 Journey]
│   ├── 📄 PHILOSOPHY.md                      [SATOR/ROTAS Concept]
│   ├── 📄 DESIGN-SYSTEM.md                   [Tokens & Aesthetics]
│   ├── 📄 VERSIONING.md                      [Version Header Guide]
│   └── 📁 architecture/
│       ├── 📄 HUB-ARCHITECTURE.md
│       ├── 📄 STATE-MANAGEMENT.md
│       ├── 📄 TWIN-FILE-PHILOSOPHY.md
│       └── 📄 RAWS-BASE-SPEC.md
│
└── 📄 LEGACY-GILDED-REPOSITORY.md           [This Master Document]
```

---

## 3. VERSIONING SYSTEM

### 3.1 Semantic Versioning with Headers

All files receive a version header in format `[VerMMM.mmm]`:

```
[Ver002.000] = v2.0.0 (Major Release)
[Ver002.001] = v2.0.1 (Patch)
[Ver002.010] = v2.1.0 (Minor Release)
[Ver003.000] = v3.0.0 (Major Release)
```

### 3.2 Version Header Placement

**JavaScript/JSX Files:**
```javascript
/**
 * [Ver002.000]
 * 
 * SATOR Hub - Hub 1: The Observatory
 * Raw data ingestion with orbital ring navigation
 * 
 * @module SATORHub
 * @version 2.0.0
 * @since 2024-03
 */
```

**CSS Files:**
```css
/*
 * [Ver002.000]
 * 
 * SATOR Design Tokens
 * Abyssal depth aesthetic with signal amber accents
 */
```

**JSON/Markdown Files:**
```json
{
  "_version": "[Ver002.000]",
  "name": "njz-platform",
  "version": "2.0.0"
}
```

### 3.3 Version Assignment Matrix

| Component | Current | Archive v1 | Header Format |
|-----------|---------|------------|---------------|
| Core Source | v2.0.0 | v1.0.0 | [Ver002.000] / [Ver001.000] |
| Shared Components | v2.0.0 | — | [Ver002.000] |
| VFX Systems | v2.0.0 | v1.0 (particles.js) | [Ver002.000] / [Ver001.000] |
| Documentation | v2.0 | — | [Ver002.000] |

---

## 4. ARCHIVAL FRAMEWORK

### 4.1 Archive Principles

1. **Immutable** — Archived versions are read-only
2. **Complete** — Full source, assets, and docs preserved
3. **Indexed** — Each version has INDEX.md with metadata
4. **Linked** — Cross-references between versions

### 4.2 Archive Metadata Format

Each archived version contains `INDEX.md`:

```markdown
[Ver001.000]

# Archive Index: v1.0.0

## Metadata
- **Version:** 1.0.0
- **Codename:** SATORxROTAS Vanilla
- **Date:** 2024-Q1
- **Status:** Archived (superseded by v2.0.0)
- **Location:** /archive/v1.0.0/

## Contents
- Pure JavaScript implementation
- Custom particle systems
- Jungian psychology visual assets
- CSS-based animations

## Migration Path
See /docs/EVOLUTION.md for v1 → v2 transition details.

## Preservation Notes
Original implementation using vanilla JS + Three.js.
Superseded by React-based v2.0 architecture.
```

### 4.3 Evolution Documentation

**File:** `/docs/EVOLUTION.md`

Documents the transformation journey:
- v1.0: Vanilla JS, standalone HTML files
- v2.0: React 18, component architecture, state management
- Key technical decisions
- Breaking changes
- Migration guide

---

## 5. IMPLEMENTATION CHECKLIST

### 5.1 Structure Creation (PASS 3)
- [ ] Create `satorXrotas-gilded/` root directory
- [ ] Create `current/v2.0.0/` structure
- [ ] Create `archive/v1.0.0/` structure
- [ ] Create `docs/` structure

### 5.2 Version Headers (PASS 3)
- [ ] Add [Ver002.000] to all v2.0 source files
- [ ] Add [Ver001.000] to all v1.0 archive files
- [ ] Add [Ver002.000] to documentation

### 5.3 Documentation (PASS 3)
- [ ] Write GILDED-README.md (master entry)
- [ ] Write EVOLUTION.md (v1→v2 journey)
- [ ] Write VERSIONING.md (header standards)
- [ ] Write PHILOSOPHY.md (SATOR/ROTAS concept)

---

## 6. FILE MAPPING

### 6.1 Source File Inventory (v2.0 — To Be Gilded)

| File | Path | Version | Priority |
|------|------|---------|----------|
| App.jsx | src/ | [Ver002.000] | Critical |
| main.jsx | src/ | [Ver002.000] | Critical |
| index.css | src/ | [Ver002.000] | Critical |
| SATORHub.jsx | src/hub-1-sator/ | [Ver002.000] | Critical |
| ROTASHub.jsx | src/hub-2-rotas/ | [Ver002.000] | Critical |
| InformationHub.jsx | src/hub-3-info/ | [Ver002.000] | High |
| GamesHub.jsx | src/hub-4-games/ | [Ver002.000] | High |
| Navigation.jsx | src/shared/components/ | [Ver002.000] | Critical |
| HubWrapper.jsx | src/shared/components/ | [Ver002.000] | High |
| njzStore.js | src/shared/store/ | [Ver002.000] | Critical |
| ParticleSystems.jsx | shared/vfx/ | [Ver002.000] | Medium |
| FluidSmokeEffects.jsx | shared/vfx/ | [Ver002.000] | Medium |
| design-tokens.css | shared/styles/ | [Ver002.000] | High |

### 6.2 Archive File Inventory (v1.0 — Already Legacy)

| File | Path | Version | Notes |
|------|------|---------|-------|
| sator.js | src/ | [Ver001.000] | Original SATOR |
| particles.js | src/ | [Ver001.000] | Vanilla particles |
| sphere.js | src/ | [Ver001.000] | 3D sphere viz |
| main.css | css/ | [Ver001.000] | Original styles |

---

## 7. SUMMARY

**PASS 2 COMPLETE:** Structure designed with:
- ✅ Clear current/archive/docs separation
- ✅ [VerMMM.mmm] versioning system defined
- ✅ Complete file inventory mapped
- ✅ Archival framework established
- ✅ Evolution documentation planned

**Ready for PASS 3:** Implementation

---

**End of SITREP-005**
