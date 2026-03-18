---
name: sator-sator-square
description: "5-layer SATOR Square visualization with D3.js and WebGL for 4NJZ4 TENET Platform. USE FOR: SATOR Square layers, palindromic visualization, D3.js SVG, WebGL shaders, spatial data rendering. DO NOT USE FOR: general charts, non-esports visualizations, simple graphs."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# SATOR Square Visualization

> **5-LAYER PALINDROMIC SYSTEM**
>
> Location: `apps/website-v2/src/components/sator-square/`
> SATOR AREPO TENET OPERA ROTAS
> Layer 1,3,4: D3.js SVG
> Layer 2,5: WebGL Canvas with GLSL shaders
> Target: 60 FPS

## Triggers

Activate this skill when user wants to:
- Create SATOR Square visualization layers
- Implement D3.js SVG visualizations
- Work with WebGL/GLSL shaders
- Build spatial data representations
- Create the 5-layer palindromic system
- Implement map-based visualizations

## Rules

1. **5 Layers** — SATOR, OPERA, TENET, AREPO, ROTAS
2. **D3.js for SVG** — Layers 1, 3, 4
3. **WebGL for Canvas** — Layers 2, 5
4. **60 FPS Target** — Optimize for performance
5. **Protanopia-Safe** — No red-green only distinctions
6. **Layer Composition** — Proper z-index and blending

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| SATOR Square layers | General chart libraries |
| D3.js SVG visualization | Simple bar/line charts |
| WebGL/GLSL shaders | 2D canvas only |
| Spatial match visualization | Text-based statistics |
| Palindromic 5-layer system | Single-layer visualizations |
| Esports map visualization | Non-spatial data |

## Project Structure

```
apps/website-v2/src/components/sator-square/
├── SatorSquare.tsx              # Main container
├── layers/
│   ├── SatorLayer.tsx           # Layer 1: Golden Halo (D3.js)
│   ├── OperaLayer.tsx           # Layer 2: Fog of War (WebGL)
│   ├── TenetLayer.tsx           # Layer 3: Area Control (D3.js)
│   ├── ArepoLayer.tsx           # Layer 4: Death Stains (D3.js)
│   └── RotasLayer.tsx           # Layer 5: Rotation Trails (WebGL)
├── hooks/
│   ├── useSpatialData.ts
│   ├── useWebGL.ts
│   └── useD3Scale.ts
├── shaders/
│   ├── fog.frag                 # Fog shader
│   ├── fog.vert
│   ├── dust.frag                # Dust particles
│   └── trail.frag               # Trail shader
└── types/
    └── spatial.ts
```

## The SATOR Square

```
S A T O R    Layer 1: SATOR - Golden Halo (D3.js SVG)
A R E P O    Layer 2: OPERA - Fog of War (WebGL)
T E N E T    Layer 3: TENET - Area Control (D3.js SVG)
O P E R A    Layer 4: AREPO - Death Stains (D3.js SVG)
R O T A S    Layer 5: ROTAS - Rotation Trails (WebGL)
```

## Main Container

```tsx
// SatorSquare.tsx
import { useRef, useState } from 'react'
import { SatorLayer } from './layers/SatorLayer'
import { OperaLayer } from './layers/OperaLayer'
import { TenetLayer } from './layers/TenetLayer'
import { ArepoLayer } from './layers/ArepoLayer'
import { RotasLayer } from './layers/RotasLayer'

interface SatorSquareProps {
  matchId: string
  roundNumber?: number
  width?: number
  height?: number
}

export function SatorSquare({
  matchId,
  roundNumber = 1,
  width = 800,
  height = 800,
}: SatorSquareProps) {
  const [activeLayers, setActiveLayers] = useState({
    sator: true,
    opera: true,
    tenet: true,
    arepo: true,
    rotas: true,
  })

  return (
    <div className="relative" style={{ width, height }}>
      {/* Layer 1: SATOR - Golden Halo (SVG) */}
      {activeLayers.sator && (
        <SatorLayer matchId={matchId} roundNumber={roundNumber} />
      )}
      
      {/* Layer 2: OPERA - Fog of War (WebGL) */}
      {activeLayers.opera && (
        <OperaLayer matchId={matchId} roundNumber={roundNumber} />
      )}
      
      {/* Layer 3: TENET - Area Control (SVG) */}
      {activeLayers.tenet && (
        <TenetLayer matchId={matchId} roundNumber={roundNumber} />
      )}
      
      {/* Layer 4: AREPO - Death Stains (SVG) */}
      {activeLayers.arepo && (
        <ArepoLayer matchId={matchId} roundNumber={roundNumber} />
      )}
      
      {/* Layer 5: ROTAS - Rotation Trails (WebGL) */}
      {activeLayers.rotas && (
        <RotasLayer matchId={matchId} roundNumber={roundNumber} />
      )}
    </div>
  )
}
```

## Layer 1: SATOR - Golden Halo (D3.js)

```tsx
// layers/SatorLayer.tsx
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface SatorLayerProps {
  matchId: string
  roundNumber: number
}

export function SatorLayer({ matchId, roundNumber }: SatorLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Fetch highlight moments for this match/round
    const highlights = fetchHighlights(matchId, roundNumber)

    // Golden halo for high-impact moments
    const haloGroup = svg.append('g').attr('class', 'sator-halos')

    highlights.forEach((moment) => {
      const { x, y, type } = moment
      
      // Golden gradient
      const gradient = haloGroup.append('defs')
        .append('radialGradient')
        .attr('id', `halo-${moment.id}`)

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#D4AF37')
        .attr('stop-opacity', 0.8)

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#D4AF37')
        .attr('stop-opacity', 0)

      // Halo circle
      haloGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .attr('fill', `url(#halo-${moment.id})`)
        .transition()
        .duration(1000)
        .attr('r', 40)
        .transition()
        .duration(500)
        .attr('r', 30)

      // Type icon (Plant, MVP, Hotstreak, Ace)
      const icon = getIconForType(type)
      haloGroup.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#D4AF37')
        .attr('font-size', '16')
        .text(icon)
    })
  }, [matchId, roundNumber])

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  )
}

function fetchHighlights(matchId: string, roundNumber: number) {
  // Return highlight moments with coordinates
  return []
}

function getIconForType(type: string): string {
  const icons: Record<string, string> = {
    plant: 'P',
    mvp: '★',
    hotstreak: '🔥',
    ace: 'A',
  }
  return icons[type] || '•'
}
```

## Layer 3: TENET - Area Control (D3.js)

```tsx
// layers/TenetLayer.tsx
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface ZoneControl {
  zone: string
  grade: 'A' | 'B' | 'C' | 'D'
  control: number
  polygon: [number, number][]
}

export function TenetLayer({ matchId, roundNumber }: { matchId: string; roundNumber: number }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const zoneControls = fetchZoneControls(matchId, roundNumber)

    const zoneGroup = svg.append('g').attr('class', 'tenet-zones')

    zoneControls.forEach((zone) => {
      // Color by grade
      const colors: Record<string, string> = {
        A: '#22c55e', // Green
        B: '#3b82f6', // Blue
        C: '#f59e0b', // Yellow
        D: '#ef4444', // Red
      }

      // Draw zone polygon
      zoneGroup.append('polygon')
        .attr('points', zone.polygon.map(p => p.join(',')).join(' '))
        .attr('fill', colors[zone.grade])
        .attr('fill-opacity', 0.3)
        .attr('stroke', colors[zone.grade])
        .attr('stroke-width', 2)

      // Zone label
      const centroid = d3.polygonCentroid(zone.polygon)
      zoneGroup.append('text')
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('text-anchor', 'middle')
        .attr('fill', colors[zone.grade])
        .attr('font-weight', 'bold')
        .text(`${zone.zone}: ${zone.grade}`)
    })
  }, [matchId, roundNumber])

  return <svg ref={svgRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }} />
}

function fetchZoneControls(matchId: string, roundNumber: number): ZoneControl[] {
  return []
}
```

## Commands

```bash
cd apps/website-v2

# Build visualization
npm run build

# Test WebGL shaders
npm run test:webgl

# Optimize for 60 FPS
npm run analyze:performance
```

## References

- [D3.js Documentation](https://d3js.org/)
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/)
