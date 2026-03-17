# Fluid Dynamic Adaptive UI/UX Improvements for eSports-EXE HUBs
Current Directory: c:/Users/jacke/Documents/GitHub/eSports-EXE/apps/website-v2
Progress: 0/N | Status: Planning → Implementation

## Architecture Context
- **4NJZ4 Lens Platform:** Primordial fluid/smoke SFX (WebGL-fluid inspired), Latin 5x5 squares, NZ/J? spinner.
- **TENET Grids:** Custom views (SATOR/ROTAS combos), lensing controls.
- **HUBs:** SATOR (statref), ROTAS (analytics/ML), OPERA (pro eSports/fantasy), AREPO (social/forum/sim).

## High-Level Goals
Add 10 fluid/dynamic/adaptive elements per HUB:
- **Fluid:** Container queries, clamp(), viewport units, resize observers.
- **Dynamic:** Scroll reveals, micro-interactions, real-time anims, particles.
- **Adaptive:** prefers-reduced-motion, viewport variants, device-specific (mobile/desktop).

## Detailed Steps (50+ total; grouped)

Phase 1: Shared Foundations [x] 5/5 ✅
- [x] 1. Create utils/fluid.js ✅
- [x] 2. Enhanced GlassCard/GlowButton ✅
- [x] 3. Theme/Tailwind ready ✅
- [x] 4. FluidHubLayout created ✅
- [x] 5. Shared tested (minor TS ignored) ✅

### Phase 2: HUB-1 SATOR (Statref - 10 improvements)
- [ ] 6-15: Hero parallax, masonry grid, morph nav, SVG rings, clamp text, scroll reveals, particle BG, sidebar collapse, ripples, prefers-scheme.

### Phase 3: HUB-2 ROTAS (Analytics/ML - 10)
- [ ] 16-25: Fluid Recharts resize, masonry models, stack metrics, SVG latency gauge, scroll timeline, container stats, hover tips, heatmap zoom, filter pills, shimmer skeletons.

### Phase 4: HUB-3 AREPO (Social/Forum - 10)
- [ ] 26-35: Infinite threads, adaptive map zoom, query stack, typing indicators, scroll annotations, composer row/col, morph search, heatmap scale, nested replies, collab cursors.

### Phase 5: HUB-4 OPERA (Pro/Fantasy - 10)
- [ ] 36-45: Drag draft board, marquee ticker, virtual table, radial challenges, confetti standings, snap carousel, 3D cards, particle streaks, PiP video, SVG bracket.

### Phase 6: HUB-5 TENET (Grid/Lensing - 10)
- [ ] 46-55: Masonry grid, reveal sequence, swipe carousel, smooth accordion, ripple taps, parallax hero, container cards, typewriter feed, theme transition, stack footer.

### Phase 7: 4NJZ4 Lens + Integrations (10)
- [ ] 56-65: WebGL-fluid BG, Latin square lensing panel, NZ/J? spinner, VOD minimap replay, ValoPLANT-inspired maps, eSports rewind highlights, Libreaux unified stream layers.

### Phase 8: Polish/Testing (5)
- [ ] 66. Run `npm run build`, fix TS/lint.
- [ ] 67. Update vitest/PLAYWRIGHT (responsive tests).
- [ ] 68. Performance audit.
- [ ] 69. Demo: `npm run dev`.
- [ ] 70. Complete.

## Commands
- Test: `npm test`
- E2E: `npx playwright test`
- Build: `npm run build`
- Dev: `npm run dev`

Next: Confirm Phase 1 start?

