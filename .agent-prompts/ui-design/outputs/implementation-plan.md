# Implementation Plan: UI/UX Frontend
## Phase 5 — Technical Implementation Roadmap

---

## Executive Summary

This plan transforms the 10 page specifications into actionable development tasks. Total estimated effort: **3-4 sprints (6-8 weeks)** for full implementation.

---

## Component Architecture

### Shared Component Library

```
src/shared/components/
├── Layout/
│   ├── MainLayout.tsx              # Shell with nav + footer
│   ├── HubLayout.tsx               # HUB-specific sidebar
│   └── GameSelector.tsx            # Valorant/CS2 switcher
├── Navigation/
│   ├── TopNav.tsx                  # Global top navigation
│   ├── HubNav.tsx                  # 4 HUB icons
│   ├── Breadcrumbs.tsx             # Page breadcrumbs
│   └── SearchBar.tsx               # Global search
├── Data/
│   ├── DataTable.tsx               # Sortable, filterable table
│   ├── Leaderboard.tsx             # Ranked list display
│   ├── StatCard.tsx                # Key metric display
│   ├── RadarChart.tsx              # Player comparison
│   └── TrendChart.tsx              # Line/bar charts
├── Feedback/
│   ├── LoadingSpinner.tsx
│   ├── SkeletonTable.tsx
│   ├── ErrorBoundary.tsx
│   └── EmptyState.tsx
└── Primitives/
    ├── Button.tsx                  # With variants
    ├── Card.tsx
    ├── Badge.tsx
    ├── Avatar.tsx
    └── Tooltip.tsx
```

### HUB-Specific Components

#### ROTAS (hub-2-rotas/components/)
```
├── RotasPlayerCard.tsx
├── RotasTeamRoster.tsx
├── RotasMatchScoreboard.tsx
├── RotasPlayerComparisonLayout.tsx
├── RotasStatBreakdown.tsx
├── RotasHeatmapOverlay.tsx
├── RotasTournamentBracket.tsx
└── RotasStatsGrid.tsx
```

#### SATOR (hub-1-sator/components/)
```
├── SatorAnalyticsCard.tsx
├── SatorQueryBuilder.tsx
├── SatorMetricBuilder.tsx
├── SatorChartBuilder.tsx
├── SatorAPIQueryDisplay.tsx
└── SatorResultsTable.tsx
```

#### OPERA (hub-4-opera/components/)
```
├── OperaLiveMatchCard.tsx
├── OperaMatchHeader.tsx
├── OperaScheduleList.tsx
├── OperaTournamentCard.tsx
├── OperaBracketMatch.tsx
└── OperaRoundBreakdown.tsx
```

---

## File Creation/Modification List

### New Files (35 total)

#### Pages (10)
| File | Path | Priority |
|------|------|----------|
| TenetPortal.tsx | hub-5-tenet/index.tsx | P0 |
| GameEntry.tsx | hub-5-tenet/GameEntry.tsx | P0 |
| PlayerList.tsx | hub-2-rotas/pages/PlayerList.tsx | P0 |
| PlayerProfile.tsx | hub-2-rotas/pages/PlayerProfile.tsx | P0 |
| PlayerComparison.tsx | hub-2-rotas/pages/PlayerComparison.tsx | P1 |
| SatorHub.tsx | hub-1-sator/index.tsx | P2 |
| MatchDetail.tsx | hub-4-opera/pages/MatchDetail.tsx | P0 |
| OperaHub.tsx | hub-4-opera/index.tsx | P0 |
| TeamProfile.tsx | hub-2-rotas/pages/TeamProfile.tsx | P1 |
| TournamentBracket.tsx | hub-4-opera/pages/TournamentBracket.tsx | P2 |

#### Shared Components (15)
| File | Path |
|------|------|
| MainLayout.tsx | shared/components/Layout/MainLayout.tsx |
| HubLayout.tsx | shared/components/Layout/HubLayout.tsx |
| GameSelector.tsx | shared/components/Layout/GameSelector.tsx |
| TopNav.tsx | shared/components/Navigation/TopNav.tsx |
| HubNav.tsx | shared/components/Navigation/HubNav.tsx |
| Breadcrumbs.tsx | shared/components/Navigation/Breadcrumbs.tsx |
| DataTable.tsx | shared/components/Data/DataTable.tsx |
| StatCard.tsx | shared/components/Data/StatCard.tsx |
| RadarChart.tsx | shared/components/Data/RadarChart.tsx |
| LoadingSpinner.tsx | shared/components/Feedback/LoadingSpinner.tsx |
| SkeletonTable.tsx | shared/components/Feedback/SkeletonTable.tsx |
| ErrorBoundary.tsx | shared/components/Feedback/ErrorBoundary.tsx |
| Button.tsx | shared/components/Primitives/Button.tsx |
| Card.tsx | shared/components/Primitives/Card.tsx |
| Badge.tsx | shared/components/Primitives/Badge.tsx |

#### Hooks (6)
| File | Path |
|------|------|
| usePlayers.ts | shared/hooks/usePlayers.ts |
| usePlayerStats.ts | shared/hooks/usePlayerStats.ts |
| useMatches.ts | shared/hooks/useMatches.ts |
| useTournaments.ts | shared/hooks/useTournaments.ts |
| usePlayerComparison.ts | shared/hooks/usePlayerComparison.ts |
| useHeatmapData.ts | hub-2-rotas/hooks/useHeatmapData.ts |

#### Stores (4)
| File | Path |
|------|------|
| gameStore.ts | stores/gameStore.ts |
| userStore.ts | stores/userStore.ts |
| uiStore.ts | stores/uiStore.ts |
| comparisonStore.ts | stores/comparisonStore.ts |

### Modified Files (5)

| File | Changes |
|------|---------|
| App.tsx | Add new routes |
| main.tsx | Import new pages |
| design-tokens.ts | Add new tokens |
| index.css | Add global styles |
| tailwind.config.js | Add custom colors |

---

## Route Definitions

### React Router Configuration

```typescript
// router.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // TENET Navigation Layer
      { index: true, element: <TenetPortal /> },
      { path: 'hubs', element: <WorldPortDirectory /> },
      
      // Game Entry
      { path: ':game', element: <GameEntry /> },
      
      // ROTAS — Stats Reference
      {
        path: ':game/stats',
        element: <HubLayout hub="rotas" />,
        children: [
          { index: true, element: <RotasHub /> },
          { path: 'players', element: <PlayerList /> },
          { path: 'players/:slug', element: <PlayerProfile /> },
          { path: 'compare', element: <PlayerComparison /> },
          { path: 'teams', element: <TeamList /> },
          { path: 'teams/:slug', element: <TeamProfile /> },
          { path: 'matches', element: <MatchList /> },
          { path: 'tournaments', element: <TournamentList /> },
          { path: 'leaderboards', element: <Leaderboards /> },
        ],
      },
      
      // SATOR — Advanced Analytics
      {
        path: ':game/analytics',
        element: <HubLayout hub="sator" />,
        children: [
          { index: true, element: <SatorHub /> },
          { path: 'tournament', element: <TournamentAnalysis /> },
          { path: 'trends', element: <PlayerTrends /> },
          { path: 'query', element: <CustomQuery /> },
        ],
      },
      
      // OPERA — Pro Scene
      {
        path: ':game/pro',
        element: <HubLayout hub="opera" />,
        children: [
          { index: true, element: <OperaHub /> },
          { path: 'matches/:id', element: <MatchDetail /> },
          { path: 'tournaments/:id', element: <TournamentBracket /> },
          { path: 'schedule', element: <ProSchedule /> },
        ],
      },
      
      // AREPO — Community
      {
        path: ':game/community',
        element: <HubLayout hub="arepo" />,
        children: [
          { index: true, element: <ArepoHub /> },
          { path: 'forums', element: <Forums /> },
        ],
      },
    ],
  },
]);
```

---

## State Management

### Zustand Stores

```typescript
// stores/gameStore.ts
interface GameState {
  currentGame: 'valorant' | 'cs2';
  setGame: (game: 'valorant' | 'cs2') => void;
}

// stores/userStore.ts
interface UserState {
  tier: 'casual' | 'aspiring' | 'professional';
  setTier: (tier: UserTier) => void;
  followedPlayers: string[];
  followPlayer: (id: string) => void;
  unfollowPlayer: (id: string) => void;
}

// stores/uiStore.ts
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

// stores/comparisonStore.ts
interface ComparisonState {
  selectedPlayers: string[];
  addPlayer: (id: string) => void;
  removePlayer: (id: string) => void;
  clearSelection: () => void;
}
```

### TanStack Query Hooks

```typescript
// shared/hooks/usePlayers.ts
export function usePlayers(game: string, page: number) {
  return useQuery({
    queryKey: ['players', game, page],
    queryFn: () => fetchPlayers(game, page),
    staleTime: 5 * 60 * 1000,
  });
}

// shared/hooks/usePlayerStats.ts
export function usePlayerStats(playerId: string, game: string) {
  return useQuery({
    queryKey: ['player-stats', playerId, game],
    queryFn: () => fetchPlayerStats(playerId, game),
    staleTime: 5 * 60 * 1000,
  });
}

// shared/hooks/useMatches.ts
export function useMatches(
  game: string,
  filters: MatchFilters,
  page: number
) {
  return useQuery({
    queryKey: ['matches', game, filters, page],
    queryFn: () => fetchMatches(game, filters, page),
    staleTime: 2 * 60 * 1000, // 2 min for live matches
  });
}
```

---

## API Integration

### Service Layer

```typescript
// shared/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

export const api = {
  players: {
    list: (game: string, params: ListParams) =>
      fetch(`${API_BASE_URL}/api/rotas/players?game=${game}&${qs(params)}`),
    get: (id: string) =>
      fetch(`${API_BASE_URL}/api/rotas/players/${id}`),
    getStats: (id: string) =>
      fetch(`${API_BASE_URL}/api/rotas/players/${id}/stats`),
  },
  teams: {
    list: (game: string) =>
      fetch(`${API_BASE_URL}/api/rotas/teams?game=${game}`),
    get: (id: string) =>
      fetch(`${API_BASE_URL}/api/rotas/teams/${id}`),
  },
  matches: {
    list: (game: string, filters: MatchFilters) =>
      fetch(`${API_BASE_URL}/api/rotas/matches?game=${game}&${qs(filters)}`),
    get: (id: string) =>
      fetch(`${API_BASE_URL}/api/rotas/matches/${id}`),
  },
  tournaments: {
    list: (game: string) =>
      fetch(`${API_BASE_URL}/api/rotas/tournaments?game=${game}`),
    get: (id: string) =>
      fetch(`${API_BASE_URL}/api/rotas/tournaments/${id}`),
    getBracket: (id: string) =>
      fetch(`${API_BASE_URL}/api/rotas/tournaments/${id}/bracket`),
  },
};
```

---

## Testing Strategy

### Test Coverage Requirements

| Layer | Coverage Target | Tools |
|-------|-----------------|-------|
| Components | 70% | Vitest + Testing Library |
| Hooks | 80% | Vitest + MSW |
| Pages | 50% | Playwright (E2E) |
| Utils | 90% | Vitest |

### Test Files Structure

```
ComponentName/
├── index.tsx
├── ComponentName.test.tsx
├── hooks.ts
├── hooks.test.ts
└── utils.test.ts
```

### Example Component Test

```typescript
// DataTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from './DataTable';

const mockData = [
  { id: '1', name: 'TenZ', kd: 1.45 },
  { id: '2', name: 'aspas', kd: 1.42 },
];

const mockColumns = [
  { key: 'name', label: 'Player' },
  { key: 'kd', label: 'K/D' },
];

describe('DataTable', () => {
  it('renders data correctly', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('TenZ')).toBeInTheDocument();
    expect(screen.getByText('1.45')).toBeInTheDocument();
  });

  it('sorts when column header clicked', () => {
    render(<DataTable data={mockData} columns={mockColumns} sortable />);
    fireEvent.click(screen.getByText('K/D'));
    // Assert sort order changed
  });
});
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up routing structure
- [ ] Create shared components (Layout, Navigation, Primitives)
- [ ] Implement design tokens
- [ ] Set up TanStack Query + Zustand

### Phase 2: Core ROTAS (Week 3-4)
- [ ] Player Leaderboard page
- [ ] Player Profile page
- [ ] Team Profile page
- [ ] Data Table component

### Phase 3: OPERA + Comparison (Week 5-6)
- [ ] OPERA Hub + Match Detail
- [ ] Player Comparison page
- [ ] Tournament Bracket
- [ ] Live match integration

### Phase 4: SATOR + Polish (Week 7-8)
- [ ] SATOR Analytics Hub
- [ ] Query builder UI
- [ ] Charts and visualizations
- [ ] Performance optimization

### Phase 5: Testing + Launch (Week 9-10)
- [ ] Unit tests (70%+ coverage)
- [ ] E2E tests (critical paths)
- [ ] Accessibility audit
- [ ] Performance audit

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Bundle Size (initial) | < 200KB | webpack-bundle-analyzer |
| API Response | < 200ms | p95 metric |
| Query Cache Hit Rate | > 80% | TanStack Query devtools |

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "recharts": "^2.10.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^1.0.0",
    "msw": "^2.0.0"
  }
}
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API latency | Medium | High | Aggressive caching, skeletons |
| Bundle size | Medium | Medium | Code splitting, lazy loading |
| Cross-browser issues | Low | Medium | BrowserStack testing |
| Accessibility gaps | Medium | High | axe-core automated checks |

---

## Success Criteria

- [ ] All 10 pages implemented per spec
- [ ] 70%+ test coverage
- [ ] Lighthouse score > 90
- [ ] Zero TypeScript errors
- [ ] Design token compliance 100%
- [ ] All 3 user paths functional end-to-end

---

*Generated: 2026-03-31*
*Status: Implementation planning complete*
