# 02 - Architecture System
## TENET Architecture for UI Implementation

---

## Critical Understanding: TENET is NOT a HUB

**CLAUDE.md excerpt:**
> "TENET is a data networking and verification topology, NOT a 5th content hub."

```
WRONG (Old understanding):
TENET as 5th hub alongside ROTAS/SATOR/OPERA/AREPO

CORRECT (Current):
TENET = Navigation Layer
    ↓
Game Selection (Valorant/CS2)
    ↓
4 Content HUBs: ROTAS, SATOR, OPERA, AREPO
```

---

## Frontend Directory Structure

```
apps/web/src/
├── hub-1-sator/          # @hub-1/* alias
│   ├── index.tsx
│   ├── components/
│   └── analytics/
├── hub-2-rotas/          # @hub-2/* alias
│   ├── index.tsx
│   ├── components/
│   └── stats/
├── hub-3-arepo/          # @hub-3/* alias
│   ├── index.tsx
│   ├── components/
│   └── community/
├── hub-4-opera/          # @hub-4/* alias
│   ├── index.tsx
│   ├── components/
│   └── pro-scene/
├── hub-5-tenet/          # @hub-5/* alias — NAVIGATION ONLY
│   ├── index.tsx         # Portal + game directory
│   ├── GameWorldPortal.tsx
│   └── WorldPortDirectory.tsx
├── shared/               # @shared/* — Cross-HUB utilities
│   ├── components/
│   ├── hooks/
│   └── utils/
└── design-tokens.ts      # Color, typography, spacing tokens
```

---

## Route Structure

```typescript
// React Router configuration
const routes = [
  // TENET Navigation Layer
  { path: '/', element: <TenetPortal /> },
  { path: '/hubs', element: <WorldPortDirectory /> },
  { path: '/:game', element: <GameWorldEntry /> },  // /valorant, /cs2
  
  // ROTAS — Stats Reference
  { path: '/:game/stats', element: <RotasHub /> },
  { path: '/:game/stats/players', element: <PlayerList /> },
  { path: '/:game/stats/players/:slug', element: <PlayerProfile /> },
  { path: '/:game/stats/teams', element: <TeamList /> },
  { path: '/:game/stats/teams/:slug', element: <TeamProfile /> },
  { path: '/:game/stats/matches', element: <MatchList /> },
  { path: '/:game/stats/matches/:id', element: <MatchDetail /> },
  { path: '/:game/stats/tournaments', element: <TournamentList /> },
  { path: '/:game/stats/leaderboards', element: <Leaderboards /> },
  
  // SATOR — Advanced Analytics
  { path: '/:game/analytics', element: <SatorHub /> },
  { path: '/:game/analytics/simrating', element: <SimRating /> },
  { path: '/:game/analytics/rar', element: <RAR /> },
  { path: '/:game/analytics/predictions', element: <Predictions /> },
  
  // OPERA — Pro Scene
  { path: '/:game/pro', element: <OperaHub /> },
  { path: '/:game/pro/schedule', element: <ProSchedule /> },
  { path: '/:game/pro/tournaments', element: <ProTournaments /> },
  { path: '/:game/pro/live', element: <LiveMatches /> },
  
  // AREPO — Community
  { path: '/:game/community', element: <ArepoHub /> },
  { path: '/:game/community/forums', element: <Forums /> },
  { path: '/:game/community/fan-content', element: <FanContent /> },
];
```

---

## HUB Isolation Rules (CRITICAL)

**Rule:** HUBs cannot import from other HUBs.

```typescript
// ❌ FORBIDDEN — Cross-HUB import
import { StatsCard } from '@/hub-2-rotas/components/StatsCard';
// Used in hub-1-sator

// ✅ CORRECT — Shared component
import { StatsCard } from '@/shared/components/StatsCard';

// ✅ CORRECT — HUB-specific component stays in HUB
import { SimRatingChart } from '@/hub-1-sator/components/SimRatingChart';
```

**Shared code goes in:** `apps/web/src/shared/`

---

## Component Architecture

### Shared Components (All HUBs)

```typescript
// @shared/components/
├── Layout/
│   ├── MainLayout.tsx       # Shell with nav + footer
│   ├── HubLayout.tsx        # HUB-specific layout
│   └── GameSelector.tsx     # Valorant/CS2 switcher
├── Navigation/
│   ├── TopNav.tsx
│   ├── HubNav.tsx           # 4 HUB links
│   ├── Breadcrumbs.tsx
│   └── SearchBar.tsx
├── Data/
│   ├── DataTable.tsx        # Sortable, filterable table
│   ├── Leaderboard.tsx      # Ranked list display
│   ├── StatCard.tsx         # Key metric display
│   └── TrendChart.tsx       # Line/bar charts
├── Feedback/
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   └── EmptyState.tsx
└── Primitives/
    ├── Button.tsx           # With variants
    ├── Card.tsx
    ├── Badge.tsx
    ├── Avatar.tsx
    └── Tooltip.tsx
```

### HUB-Specific Components

```typescript
// hub-2-rotas/components/
├── PlayerCard.tsx           # Player summary card
├── TeamRoster.tsx           # Team player list
├── MatchScoreboard.tsx      # Live/current match display
├── TournamentBracket.tsx    # Tournament visualization
├── StatsGrid.tsx            # Dense stat layout
└── ComparisonTool.tsx       # Side-by-side player compare

// hub-1-sator/components/
├── SimRatingGauge.tsx       # Radial rating display
├── RARTimeline.tsx          # Role-adjusted value over time
├── PredictionCard.tsx       # Match prediction display
├── ConfidenceIndicator.tsx  # ML confidence visualization
└── AnalyticsDashboard.tsx   # Multi-metric dashboard
```

---

## State Management

```typescript
// Global State (Zustand)
├── stores/
│   ├── gameStore.ts         # Selected game (Valorant/CS2)
│   ├── userStore.ts         # Auth + preferences
│   └── uiStore.ts           # Theme, sidebar state

// Server State (TanStack Query)
├── queries/
│   ├── players.ts           # Player data hooks
│   ├── teams.ts             # Team data hooks
│   ├── matches.ts           # Match data hooks
│   └── tournaments.ts       # Tournament data hooks
```

---

## Progressive Disclosure Implementation

```typescript
// User tier determines component visibility
interface UserTier {
  type: 'casual' | 'aspiring' | 'professional';
}

// Component shows/hides based on tier
function StatsView({ player, userTier }: StatsViewProps) {
  return (
    <div>
      {/* Casual: Always visible */}
      <BasicStats player={player} />
      
      {/* Aspiring: Expandable */}
      {userTier !== 'casual' && (
        <AdvancedStats player={player} />
      )}
      
      {/* Professional: Collapsible sections */}
      {userTier === 'professional' && (
        <RawDataExport player={player} />
      )}
    </div>
  );
}
```

---

## API Integration Pattern

```typescript
// TanStack Query hook example
function usePlayerStats(playerId: string, game: string) {
  return useQuery({
    queryKey: ['player', playerId, game],
    queryFn: async () => {
      const response = await fetch(
        `/api/rotas/players/${playerId}?game=${game}`
      );
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

*Reference: docs/architecture/TENET_TOPOLOGY.md for complete topology*
