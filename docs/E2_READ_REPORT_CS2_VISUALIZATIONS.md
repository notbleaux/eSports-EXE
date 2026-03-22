[Ver001.000]

# E2-READ Report: CS2 Visualizations

**Agent:** E2-READ (Phase 3-1 Read-Only Check)  
**Date:** 2026-03-22  
**Status:** READ-ONLY ANALYSIS COMPLETE  

---

## Current State Analysis

### SATOR Hub Structure
The SATOR hub (`hub-1-sator/`) serves as the data observatory with the following key components:

- **PlayerRatingCard.tsx**: Displays SimRating with 5-component breakdown (Combat, Economy, Clutch, Support, Entry)
  - Uses role-based icons (duelist: ⚔️, initiator: 🔍, controller: ☁️, sentinel: 🛡️)
  - Grade-based color coding (A+ to D)
  - Component breakdown visualization with progress bars
  - Confidence display and key factors tags

- **VirtualPlayerGrid.tsx**: High-performance virtualized list using `@tanstack/react-virtual`
  - Displays 1000+ players at 60fps
  - Shows: Rank, Player, Team, Rating, ACS, Win%
  - Uses glass card design with hover glow effects

- **StatsGrid.jsx**: Grid display of StatBadge components
  - Responsive grid (2 cols mobile, 3 cols tablet, 6 cols desktop)
  - Animated with framer-motion stagger effects
  - Default stats: Teams, Matches, Players, Tournaments, Records, Uptime

### ROTAS Hub (Analytics & Simulation)
The ROTAS hub (`hub-2-rotas/`) provides predictive modeling:

- **ModelPerformanceCharts.tsx**: Recharts-based visualizations
  - LineChart: Latency over time
  - BarChart: Accuracy by model (color-coded: green ≥90%, yellow ≥70%, red <70%)
  - PieChart: Confidence distribution (0-50%, 50-80%, 80-95%, 95-100%)
  - AreaChart: Predictions per hour with gradient fill

- **MLAnalyticsPanel.tsx**: ML model dashboard
  - Time range selector (24h, 7d, 30d, custom)
  - Metric cards with icons and subtext
  - Model comparison table with accuracy bars

- **Harmonic Ellipse Visualization**: SVG-based animated visualization
  - 3 rotating ellipses representing Jungian archetype layers
  - Interactive layer toggles
  - Animated data points on ellipses

### AREPO Hub (Tactical Maps)
The AREPO hub (`hub-3-arepo/`) provides map visualization:

- **TacticalMapContainer.tsx**: Map viewer with tabs
  - Map selector with 10 Valorant maps (ascent, bind, breeze, haven, fracture, icebox, lotus, pearl, split, sunset)
  - Tabs: viewer, lineups, annotations, analysis
  - Grid overlay with callouts
  - Support for markers and annotations

- **mapData.ts**: Comprehensive map data structure
  - Coordinates for callouts, spawns, spike sites
  - Support for teleporters (Bind), doors (Ascent), z-levels
  - Game type filter support (`game: 'valorant' | 'cs2'`)

### OPERA Hub (Predictions & Engagement)
The OPERA hub (`hub-4-opera/`) contains simulation components:

- **WinProbabilityGauge.tsx**: Semi-circle SVG gauge
  - Gradient from red (0%) to yellow (50%) to green (100%)
  - Team A/B labels with VS indicator
  - Confidence indicator with dashed ring
  - Size variants: sm, md, lg

- **DuelPredictor.tsx**: Duel outcome predictor
  - Scenario selection: first_blood, 1v1, 1v2, 1v3, clutch
  - Player selection with search
  - Weapon selection dropdowns
  - HP sliders (1-150)
  - Ability toggles
  - Result display with probability bars

- **Simulator Panel**: Team/Player H2H comparison
  - Rating comparison
  - Form tracking
  - Win probability calculations

### Chart/Visualization Libraries Used

| Library | Version | Usage |
|---------|---------|-------|
| **recharts** | ^3.8.0 | LineChart, BarChart, PieChart, AreaChart for analytics |
| **d3** | ^7.9.0 | Advanced visualizations (SATOR Square in hub-5) |
| **framer-motion** | ^10.16.0 | Animations, transitions, stagger effects |
| **lucide-react** | ^0.294.0 | Icon library (consistent across all components) |
| **three** | ^0.158.0 | 3D visualizations (SpecMapViewer) |
| **@react-three/fiber** | ^8.15.0 | React Three.js integration |

### Design System (Porcelain³)

**Hub Colors:**
- SATOR (Gold): `#ffd700`
- ROTAS (Cyan): `#00d4ff`
- AREPO (Blue): `#0066ff`
- OPERA (Purple): `#9d4edd`
- TENET (White): `#ffffff`

**Common Components:**
- `GlassCard`: Frosted glass effect with configurable glow
- `GlowButton`: Button with glow hover effects
- `StatBadge`: Value display with trend indicator

---

## CS2 Visualization Needs

### Weapon Charts
**Purpose:** Display weapon performance statistics for CS2's extensive arsenal

**Requirements:**
- **Weapon Comparison Chart**: Side-by-side comparison of 2 weapons
  - Cost, kill reward, damage, fire rate, armor penetration
  - Recoil pattern visualization (SVG path)
  - DPS calculation display

- **Weapon Usage Distribution**: Pie/Donut chart showing player's weapon preferences
  - Categories: Rifles, SMGs, Pistols, Heavy, Grenades
  - Kill count per weapon

- **Recoil Pattern Display**: SVG-based heatmap showing spray patterns
  - AK-47, M4A4, M4A1-S patterns
  - Compensation difficulty indicator
  - Shot-by-shot trajectory visualization

### Economy Visualization
**Purpose:** CS2 has complex economy - different from Valorant's simpler system

**Requirements:**
- **Economy Timeline**: Area chart showing team money over rounds
  - CT vs T side tracking
  - Loss bonus escalation visualization
  - Force buy indicators
  - Full buy thresholds

- **Buy Type Distribution**: Stacked bar chart
  - Categories: Full buy, Force buy, Eco, Pistol round
  - Win rate by buy type
  - Round outcome correlation

- **Value Per Dollar Metric**: Gauge showing damage per $1000 spent
  - Player comparison
  - Team average
  - Historical trend

### Map-Specific Stats
**Purpose:** CS2 has 7-8 Active Duty maps (Dust2, Mirage, Inferno, Nuke, Overpass, Ancient, Anubis, Vertigo)

**Requirements:**
- **Map Performance Heatmap**: Grid-based win rate by map
  - Player's map pool visualization
  - CT vs T side win rates
  - Compare to global average

- **Map Callout Overlay**: Tactical map with CS2 callouts
  - Position-based stat overlays
  - Kill/death heatmaps
  - Utility usage zones

- **Map Pool Analysis**: Radar chart comparing player/team across maps
  - 5-8 axes (one per map)
  - Performance vs time played

### Round-by-Round Timeline
**Purpose:** Visualize match progression with CS2-specific events

**Requirements:**
- **Round Timeline**: Horizontal timeline with round events
  - Round winners (CT/T)
  - Bomb plant/defuse events
  - Clutch situations
  - Economy state indicators

- **Impact Events Chart**: Scatter plot showing high-impact rounds
  - X: Round number
  - Y: Impact score
  - Color: Winner (CT/T)
  - Size: Number of kills

---

## Gaps Identified

### Gap 1: No CS2 Map Data
**Current State:** `mapData.ts` only contains Valorant maps
**Impact:** Cannot render CS2 tactical maps
**Files Affected:** `hub-3-arepo/components/TacticalMap/`

### Gap 2: No Weapon Visualization Components
**Current State:** No weapon comparison or recoil pattern displays
**Impact:** Cannot showcase CS2's gunplay mechanics
**Files Needed:** New components in `hub-1-sator/components/`

### Gap 3: No Economy Visualization System
**Current State:** Basic economy metrics in PlayerRatingCard but no charts
**Impact:** Cannot display CS2's complex economy dynamics
**Files Needed:** New components similar to ModelPerformanceCharts

### Gap 4: Valorant-Specific Role Icons
**Current State:** PlayerRatingCard uses Valorant agent role icons
**Impact:** CS2 has 6 roles (AWPer, Entry, Support, IGL, Lurker, Hybrid)
**Files Affected:** `hub-1-sator/components/PlayerRatingCard.tsx`

### Gap 5: No Round Timeline Component
**Current State:** No match progression visualization
**Impact:** Cannot show round-by-round match flow
**Files Needed:** New component for OPERA or AREPO hub

### Gap 6: No CS2-Specific Stat Types
**Current State:** PlayerStats interface is Valorant-focused (utility_usage, assists_per_round)
**Impact:** Missing CS2 stats (KAST, ADR, Impact Rating, Value Per Dollar)
**Files Affected:** `hub-1-sator/components/PlayerRatingCard.tsx`

### Gap 7: No Game Type Selector
**Current State:** Hubs default to Valorant data
**Impact:** Cannot switch between game visualizations
**Files Needed:** Game selector component in shared components

---

## Implementation Plan

### Components to Create

1. **CS2WeaponComparison.tsx** (`hub-1-sator/components/`)
   - Side-by-side weapon stat comparison
   - Recoil pattern SVG visualization
   - Cost-effectiveness gauge

2. **CS2RecoilDisplay.tsx** (`hub-1-sator/components/`)
   - SVG-based spray pattern display
   - Shot-by-shot trajectory animation
   - Difficulty indicator

3. **CS2EconomyTracker.tsx** (`hub-2-rotas/components/`)
   - Team money timeline (AreaChart)
   - Buy type distribution (PieChart)
   - Value per dollar gauge

4. **CS2MapViewer.tsx** (`hub-3-arepo/components/TacticalMap/`)
   - Extend MapViewer for CS2 maps
   - CS2 callout data
   - Heatmap overlay support

5. **RoundTimeline.tsx** (`hub-4-opera/components/`)
   - Horizontal round progression
   - Event markers (plant, defuse, clutch)
   - Economy state indicators

6. **CS2MapStats.tsx** (`hub-1-sator/components/`)
   - Map performance grid
   - Win rate by map
   - CT/T side comparison

7. **GameSelector.tsx** (`components/common/`)
   - Toggle between Valorant/CS2
   - Context provider for game type

8. **CS2RoleIcon.tsx** (`components/ui/`)
   - Icons for 6 CS2 roles
   - Consistent with existing role icon pattern

### Reusable Components (Adapt for CS2)

1. **PlayerRatingCard** (`hub-1-sator/components/PlayerRatingCard.tsx`)
   - Adapt role icons for CS2 roles
   - Update stat fields (KAST, Impact, ADR, Value Per Dollar)
   - Maintain grade color system

2. **WinProbabilityGauge** (`hub-4-opera/components/Simulator/WinProbabilityGauge.tsx`)
   - Reuse as-is for match predictions
   - Works for any two-team matchup

3. **ModelPerformanceCharts** (`hub-2-rotas/ModelPerformanceCharts.tsx`)
   - Pattern for weapon accuracy charts
   - Reuse chart color scheme and tooltip styling

4. **GlassCard** (`components/ui/GlassCard.tsx`)
   - Base container for all new CS2 components
   - Consistent styling across game types

5. **VirtualPlayerGrid** (`hub-1-sator/components/VirtualPlayerGrid.tsx`)
   - Reuse virtualization pattern
   - Update columns for CS2 stats

### Styling Approach

**Design System Consistency:**
- Continue using Porcelain³ color tokens from `theme/colors.js`
- CS2 could use a distinct hub color (suggested: `#ff6b35` - CS orange)
- Maintain glass morphism effects
- Consistent typography and spacing

**Component Styling:**
- Use Tailwind CSS classes (existing pattern)
- Framer Motion for animations (existing pattern)
- Responsive design (mobile-first)
- Dark theme as default

**Chart Styling:**
- Reuse chart color constants from ModelPerformanceCharts
- Consistent tooltip styling (dark background, glass border)
- Grid lines: `rgba(255, 255, 255, 0.05)`
- Primary color: hub-specific

### Integration Points

1. **SATOR Hub** (`hub-1-sator/index.jsx`)
   - Add CS2 weapon comparison section
   - Game selector in hero section
   - CS2 player grid variant

2. **ROTAS Hub** (`hub-2-rotas/index.jsx`)
   - CS2 economy analytics panel
   - Weapon performance charts

3. **AREPO Hub** (`hub-3-arepo/components/TacticalMap/`)
   - CS2 map data integration
   - Game type conditional rendering

4. **OPERA Hub** (`hub-4-opera/components/`)
   - CS2 round timeline
   - Match prediction updates for CS2

---

## Effort Estimate

| Component | Hours | Complexity |
|-----------|-------|------------|
| CS2WeaponComparison | 8 | Medium |
| CS2RecoilDisplay | 12 | High (SVG patterns) |
| CS2EconomyTracker | 10 | Medium |
| CS2MapViewer | 16 | High (map data + rendering) |
| RoundTimeline | 10 | Medium |
| CS2MapStats | 6 | Low |
| GameSelector | 4 | Low |
| CS2RoleIcon | 4 | Low |
| PlayerRatingCard adaptation | 6 | Medium |
| **Total** | **76 hours** | **~2 weeks** |

**Additional Work:**
- CS2 map data creation: 8 hours
- Testing and refinement: 16 hours
- Documentation: 4 hours

**Grand Total: ~104 hours (~3 weeks)**

---

## Dependencies

1. **E1-READ Report**: CS2 data structure definitions
2. **Existing Chart Libraries**: Recharts, D3 (already installed)
3. **Design System**: `theme/colors.js`, GlassCard, GlowButton
4. **Map Assets**: CS2 minimap images (need to source)
5. **Weapon Data**: CS2 weapon stats database
6. **CS2 Expansion Plan**: Phase completion status

---

## Recommendations

1. **Start with GameSelector**: Provides foundation for dual-game support
2. **Reuse Chart Patterns**: ModelPerformanceCharts is excellent reference
3. **Map Data Priority**: CS2 tactical maps are high-value feature
4. **Weapon Visualizations**: Key differentiator from existing esports platforms
5. **Economy Complexity**: CS2's economy is unique - invest in clear visualization

---

## Next Steps

1. Review this report with Foreman
2. Await E1-READ completion for data structure alignment
3. Prioritize components based on Phase 3 roadmap
4. Create detailed component specs for highest priority items

---

*Report Generated by Agent E2-READ*  
*Read-Only Phase Complete - Awaiting Implementation Phase*
