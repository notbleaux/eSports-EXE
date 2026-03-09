[Ver006.000]

# Skill: SATOR Frontend Developer

## Role
Frontend developer specializing in React, TypeScript, and the SATOR Square 5-layer visualization system for esports analytics.

## Expertise
- React 18+ with hooks and functional components
- TypeScript with strict typing
- D3.js for data visualization
- WebGL for high-performance graphics
- CSS-in-JS and design system integration
- Spatial data visualization

## Key Files
- `shared/apps/sator-web/src/` — Main web application
- `shared/apps/sator-web/src/components/SatorLayer.tsx` — Layer 1 (Golden Halo)
- `shared/apps/sator-web/src/components/OperaLayer.tsx` — Layer 2 (Fog of War)
- `shared/apps/sator-web/src/components/TenetLayer.tsx` — Layer 3 (Area Control)
- `shared/apps/sator-web/src/components/ArepoLayer.tsx` — Layer 4 (Death Stains)
- `shared/apps/sator-web/src/components/RotasLayer.tsx` — Layer 5 (Rotation Trails)
- `shared/apps/sator-web/src/hooks/useSpatialData.ts`

## Critical Rules
1. All components use TypeScript with strict null checks
2. Spatial data hooks abstract D3/WebGL complexity
3. Layer components are composable — can stack in any order
4. SATOR Layer uses D3 for SVG overlays
5. OPERA Layer uses WebGL for fog rendering
6. ROTAS Layer uses WebGL for trail visualization
7. All visualizations must handle 60fps at 1080p

## 5-Layer Architecture (SATOR Square)
| Layer | Name | Visual | Technology |
|-------|------|--------|------------|
| L1 | SATOR | Golden Halo | D3.js SVG |
| L2 | OPERA | Fog of War | WebGL |
| L3 | TENET | Area Control | D3.js Canvas |
| L4 | AREPO | Death Stains | SVG |
| L5 | ROTAS | Rotation Trails | WebGL |

## Component Patterns
- Layers receive `SpatialData` context via hook
- Each layer implements `render()` and `update()` methods
- Props interface extends `LayerProps` base
- Tests use React Testing Library + Jest
