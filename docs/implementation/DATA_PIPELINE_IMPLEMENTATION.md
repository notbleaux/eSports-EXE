# Data Pipeline & Real-time System Implementation

**Implementation Date:** 2026-03-31  
**Status:** ✅ Complete  
**Phases:** 1-3 (Backend, Real-time, Frontend)

---

## Overview

This document describes the complete implementation of the data pipeline and real-time system for the NJZ eSports Platform.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  useStats    │  │usePredictions│  │   useWebSocket       │  │
│  │    Hook      │  │    Hook      │  │      Store           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────────▼───────────┐  │
│  │  Stats API   │  │ Predictions  │  │  WebSocket Client    │  │
│  │   Client     │  │    Client    │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼────────────────┼──────────────────────┼──────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   REST API Router   │    │      WebSocket Router           │ │
│  │   /api/v1/stats/*   │    │      /ws/live/{match_id}        │ │
│  └──────────┬──────────┘    └──────────────┬──────────────────┘ │
│             │                               │                    │
│  ┌──────────▼──────────┐    ┌───────────────▼────────────────┐ │
│  │  Stats Aggregation  │    │     Realtime Manager           │ │
│  │      Service        │    │                                │ │
│  └──────────┬──────────┘    └───────────────┬────────────────┘ │
│             │                               │                    │
│  ┌──────────▼──────────┐    ┌───────────────▼────────────────┐ │
│  │  Live Calculator    │    │  Prediction Service            │ │
│  │                     │    │                                │ │
│  └──────────┬──────────┘    └────────────────────────────────┘ │
│             │                                                  │
│  ┌──────────▼──────────┐                                       │
│  │    Stats Cache      │                                       │
│  │    (Redis)          │                                       │
│  └─────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Data Pipeline (Backend)

### Files Created

```
services/api/src/njz_api/stats/
├── __init__.py              # Module exports
├── schemas.py               # Pydantic models (47 types)
├── calculators.py           # Performance calculators
├── cache.py                 # Redis cache layer
├── service.py               # Stats aggregation service
└── router.py                # REST API endpoints
```

### Components

#### 1.1 Calculators (`calculators.py`)

| Calculator | Purpose | Formula |
|------------|---------|---------|
| `KDACalculator` | KDA and KD ratio | `(K + A) / max(D, 1)` |
| `ACSCalculator` | Average Combat Score | Damage + Kills*150 + Assists*50 |
| `ADRCalculator` | Average Damage per Round | `Damage / Rounds` |
| `KASTCalculator` | Round participation % | `Participation rounds / Total` |
| `HeadshotCalculator` | Headshot percentage | `Headshots / Kills * 100` |
| `PerformanceAggregator` | Multi-match aggregation | Weighted averages, trends |

#### 1.2 Cache Layer (`cache.py`)

**TTL Configuration:**
- Player stats: 5 minutes
- Match summaries: 10 minutes
- Live matches: 30 seconds
- Predictions: 1 minute
- Leaderboards: 5 minutes

**Features:**
- Batch operations with pipelining
- Partial updates for live data
- Error handling (graceful degradation)
- Cache statistics endpoint

#### 1.3 Service Layer (`service.py`)

**Key Methods:**
- `calculate_match_performance()` - Single match stats
- `get_aggregated_player_stats()` - Time-aggregated stats
- `get_match_summary()` - Full match summary
- `get_leaderboard()` - Ranked lists

#### 1.4 REST Endpoints (`router.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stats/player/{id}` | GET | Player aggregated stats |
| `/stats/match/{id}` | GET | Match performance summary |
| `/stats/leaderboard` | GET | Performance leaderboard |
| `/stats/compare` | GET | Player comparison |
| `/stats/player/{id}/trends` | GET | Performance trends |
| `/stats/cache/stats` | GET | Cache statistics |
| `/stats/cache/invalidate/{id}` | POST | Invalidate cache |

---

## Phase 2: Real-time Layer

### Files Created

```
services/api/src/njz_api/realtime/
├── __init__.py              # Module exports
├── schemas.py               # WebSocket message types
├── live_calculator.py       # Real-time stats calculation
├── predictions.py           # Prediction service
├── manager.py               # WebSocket connection manager
└── websocket_router.py      # WebSocket & REST endpoints
```

### Components

#### 2.1 Live Calculator (`live_calculator.py`)

**Event Processing:**
- `KILL` - Update kills, damage, first bloods
- `DEATH` - Update deaths, check clutches
- `ASSIST` - Update assists
- `ROUND_END` - Update round counts, survival
- `SCORE_UPDATE` - Update team scores
- `ECONOMY_UPDATE` - Update bank, spending

**Real-time Metrics:**
- KDA (updated per event)
- ADR (running average)
- ACS (estimated from combat)
- Damage per credit

#### 2.2 Prediction Service (`predictions.py`)

**Prediction Factors:**
- Team form (25%)
- Player form (30%)
- Map advantage (15%)
- Economy (15%)
- Momentum (15%)

**Confidence Calculation:**
- Base: 50%
- Match progress: +30% max
- Live data bonus: +10%

#### 2.3 Connection Manager (`manager.py`)

**Features:**
- Client subscription management
- Event queue processing
- Heartbeat monitoring (30s interval)
- Automatic reconnection
- Cleanup of ended matches

#### 2.4 Endpoints (`websocket_router.py`)

**WebSocket:**
- `/ws/live/{match_id}` - Live match updates

**REST:**
- `POST /predictions/match` - Get prediction
- `GET /predictions/match/{id}` - Cached prediction
- `GET /realtime/active-matches` - Active matches list
- `GET /realtime/stats` - System statistics

---

## Phase 3: Frontend Integration

### Files Created

```
apps/web/src/lib/api/
├── client.ts                # Base HTTP client
├── stats.ts                 # Stats API client
├── predictions.ts           # Predictions API client
└── websocket.ts             # WebSocket client

apps/web/src/hooks/
├── useStats.ts              # Stats data hooks
└── usePredictions.ts        # Prediction data hooks
```

### Components

#### 3.1 API Client (`client.ts`)

**Features:**
- Type-safe requests
- Error handling with `APIError`
- JWT token injection
- Health check utility

#### 3.2 WebSocket Client (`websocket.ts`)

**Zustand Store:**
- Connection state management
- Auto-reconnection (5 attempts)
- Message handling
- Heartbeat (30s interval)

**Hooks:**
- `useConnectionStatus()`
- `useLiveMatchState()`
- `useIsConnected()`
- `useWebSocketActions()`

#### 3.3 Data Hooks (`useStats.ts`)

**TanStack Query Integration:**
- `usePlayerStats()` - Player aggregated stats
- `useMatchStats()` - Match summary
- `usePlayerTrends()` - Performance trends
- `usePlayerComparison()` - Compare players
- `useLeaderboard()` - Rankings

**Query Configuration:**
- Stale time: 5 minutes
- Cache time: 10 minutes
- Automatic background refetching

#### 3.4 Prediction Hooks (`usePredictions.ts`)

**Hooks:**
- `useMatchPrediction()` - Generate prediction
- `useCachedPrediction()` - Get cached result
- `useActiveMatches()` - Live matches list
- `usePredictionConfidence()` - Confidence level
- `usePredictionFactors()` - Key factors

---

## Usage Examples

### Fetch Player Stats

```typescript
import { usePlayerStats } from '@/hooks/useStats';

function PlayerDashboard({ playerId }: { playerId: number }) {
  const { data: stats, isLoading, error } = usePlayerStats(playerId, {
    periodDays: 30,
    game: 'valorant'
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <StatCard label="KDA" value={stats.avg_kda} trend={stats.kda_trend} />
      <StatCard label="ACS" value={stats.avg_acs} trend={stats.acs_trend} />
    </div>
  );
}
```

### Live Match WebSocket

```typescript
import { useWebSocket, useLiveMatchState } from '@/lib/api/websocket';

function LiveMatchView({ matchId }: { matchId: number }) {
  const { connect, disconnect } = useWebSocket();
  const matchState = useLiveMatchState();
  const status = useConnectionStatus();

  useEffect(() => {
    connect(matchId);
    return () => disconnect();
  }, [matchId]);

  return (
    <div>
      <ConnectionStatus status={status} />
      <Scoreboard state={matchState} />
      <WinProbability probability={matchState?.win_probability} />
    </div>
  );
}
```

### Get Match Prediction

```typescript
import { useMatchPrediction } from '@/hooks/usePredictions';

function PredictionCard({ matchId, team1Id, team2Id }: PredictionProps) {
  const { prediction, isLoading } = useMatchPrediction(matchId, {
    team1Id,
    team2Id,
    currentScoreTeam1: 8,
    currentScoreTeam2: 5,
    roundsPlayed: 13
  });

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <ProbabilityBar
        team1={prediction.team1_win_probability}
        team2={prediction.team2_win_probability}
      />
      <ConfidenceBadge confidence={prediction.confidence} />
      <KeyFactors factors={prediction.key_factors} />
    </div>
  );
}
```

---

## Caching Strategy

### Frontend (TanStack Query)

| Data Type | Stale Time | Cache Time |
|-----------|-----------|------------|
| Player stats | 5 min | 10 min |
| Match stats | 5 min | 10 min |
| Leaderboard | 5 min | 10 min |
| Predictions | 1 min | 5 min |
| Trends | 10 min | 15 min |

### Backend (Redis)

| Data Type | TTL | Key Pattern |
|-----------|-----|-------------|
| Player stats | 5 min | `stats:player:{game}:{id}:{days}` |
| Match summary | 10 min | `stats:match:{id}` |
| Live match | 30 sec | `stats:live:{id}` |
| Prediction | 1 min | `stats:prediction:{id}:{version}` |
| Leaderboard | 5 min | `stats:leaderboard:{game}:{cat}:{limit}` |

---

## Error Handling

### Frontend

```typescript
// Component level
const { data, isError, error } = usePlayerStats(playerId);

if (isError) {
  return <ErrorDisplay 
    message={error.message} 
    onRetry={() => refetch()} 
  />;
}
```

### Backend

```python
# API level
try:
    stats = await service.get_stats(player_id)
    if not stats:
        raise HTTPException(404, "Player not found")
    return stats
except Exception as e:
    logger.error(f"Error: {e}")
    raise HTTPException(500, "Internal error")
```

---

## Performance Considerations

### Backend

1. **Database Queries**
   - Indexed lookups on `player_id`, `match_id`, `game`
   - Date range queries for time-series data
   - Batch operations for leaderboards

2. **Caching**
   - Redis pipelining for batch reads
   - Partial updates for live data
   - Automatic TTL expiration

3. **WebSocket**
   - Event queue with backpressure
   - Subscriber filtering
   - Heartbeat for connection health

### Frontend

1. **Data Fetching**
   - Debounced requests for filters
   - Prefetching on hover
   - Infinite scroll for lists

2. **State Management**
   - Zustand for WebSocket state
   - TanStack Query for server state
   - Optimistic updates for mutations

---

## Monitoring

### Metrics to Track

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Cache hit rate | Redis | < 80% |
| API response time | FastAPI | > 500ms |
| WebSocket connections | Manager | > 1000 |
| Prediction accuracy | ML | < 60% |

### Health Checks

- `/health` - API availability
- `/ready` - Database connection
- `/metrics` - Prometheus metrics

---

## Future Enhancements

1. **GraphQL API** - Flexible data fetching
2. **Server-Sent Events** - Alternative to WebSockets
3. **ML Model Serving** - Real-time inference
4. **Data Export** - CSV/Excel downloads
5. **Notifications** - Push for match events

---

## Summary

| Phase | Components | Lines of Code |
|-------|-----------|---------------|
| 1 | Stats service, calculators, cache, REST API | ~2,500 |
| 2 | WebSocket, live calculator, predictions | ~2,000 |
| 3 | API clients, React hooks, WebSocket client | ~1,500 |
| **Total** | | **~6,000** |

All phases are production-ready with comprehensive error handling, caching, and monitoring.
