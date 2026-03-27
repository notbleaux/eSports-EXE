[Ver001.000]
# Tactical Map System - AREPO Hub

## Overview
The Tactical Map System has been reconstructed in AREPO hub (moved from OPERA) with enhanced capabilities for strategic analysis of Valorant maps.

## Features

### 1. Interactive Map Viewer
- **Zoom Range:** 25% to 400% (appropriate limits for tactical analysis)
- **Pan/Drag:** Smooth panning across the map
- **Mouse Wheel Zoom:** Scroll to zoom in/out
- **Keyboard Shortcuts:**
  - `+` / `=`: Zoom in
  - `-`: Zoom out
  - `0`: Reset zoom
  - `Ctrl+G`: Toggle grid
  - `Ctrl+F`: Toggle fullscreen

### 2. Grid Overlay System
- **Grid Sizes:** Small (20px), Medium (40px), Large (80px)
- **Coordinate Systems:**
  - Alphabetic (A, B, C...)
  - Numeric (1, 2, 3...)
  - Chess-style (a1, b2, c3...)
- **Major Grid Lines:** Every 5 cells
- **Adaptive Labels:** Labels scale and hide based on zoom level

### 3. Map Data
All 10 Valorant maps supported:
- Ascent
- Bind
- Breeze
- Fracture
- Haven
- Icebox
- Lotus
- Pearl
- Split
- Sunset

### 4. Tactical Markers
- Types: Ability, Position, Death, Kill, Utility, Annotation
- Color-coded by type
- Player names visible at high zoom
- Round indicators
- Click to remove

### 5. Callout Display
- Region color-coding:
  - A Site: Red (#ff4655)
  - B Site: Cyan (#00d4ff)
  - C Site: Gold (#ffd700)
  - Mid: Purple (#9d4edd)
  - Spawn: Green (#00ff88)
- Alternative names displayed at high zoom
- Z-level filtering

### 6. Multi-Z-Level Support
- Toggle between floor levels
- Level indicator display
- Separate markers per level

## File Structure
```
src/hub-3-arepo/components/TacticalMap/
├── types.ts                    # TypeScript interfaces
├── mapData.ts                  # Valorant map data
├── MapViewer.tsx               # Main map component
├── GridOverlay.tsx             # Grid system
├── ZoomControls.tsx            # Zoom UI
├── MapMarkers.tsx              # Marker display
├── MapCallouts.tsx             # Callout labels
├── MapSelector.tsx             # Map selection grid
├── LineupLibrary.tsx           # Lineup management
├── MapAnnotationTools.tsx      # Drawing tools
├── TacticalMapContainer.tsx    # Main container
└── index.ts                    # Exports
```

## Integration
- Integrated into AREPO hub as "Tactical Maps" tab
- Uses AREPO color scheme (Royal Blue #0066ff)
- Follows hub design patterns
- Error boundary protected

## Usage
```tsx
import { TacticalMapContainer } from './components/TacticalMap';

// In your component
<TacticalMapContainer />
```

## Zoom Limits Rationale
| Zoom | Use Case |
|------|----------|
| 25% | Overview of entire map, strategic positioning |
| 50% | Site overview, rotation planning |
| 100% | Standard view, general analysis |
| 200% | Detailed positioning, lineup setup |
| 400% | Precise placement, pixel-perfect lineups |

## Future Enhancements
1. Heatmap overlay for kill/death data
2. Animation playback for round replays
3. Smoke/utility trajectory visualization
4. Team strategy drawing tools
5. Export to image/PDF
6. Share links for specific views

## Technical Notes
- Grid overlay uses SVG patterns for performance
- Zoom uses CSS transforms with hardware acceleration
- Markers use percentage positioning for responsiveness
- Fullscreen mode with `Esc` to exit
