[Ver001.000]
# SATOR Hub Backend API

## Overview

The SATOR Hub provides esports analytics and player performance data for the Libre-X-eSport 4NJZ4 TENET Platform.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  SATOR Routes   │────▶│  SATOR Service  │
│  SATORHub.tsx   │     │  (FastAPI)      │     │  (PostgreSQL)   │
│                 │◀────│                 │◀────│                 │
│ useSatorData.ts │     │ WebSocket /ws   │     │ player_perf     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## API Endpoints

### Platform Stats
```
GET /api/sator/stats
→ PlatformStats {
    total_players, total_teams, total_matches,
    matches_today, matches_live,
    data_freshness: "Live|Recent|Stale",
    top_player: PlayerStats
  }
```

### Players
```
GET /api/sator/players/top?limit=10
→ Top players by SimRating

GET /api/sator/players?page=1&page_size=20&region=EMEA&role=Duelist
→ Paginated player list with filters

GET /api/sator/players/{player_id}
→ Detailed player stats + recent matches + trend analysis
```

### Teams
```
GET /api/sator/teams?page=1&page_size=20&region=Americas
→ Team list with aggregated stats
```

### Matches
```
GET /api/sator/matches?status=live&page=1
→ Match list (status: upcoming|live|completed)
```

### Search
```
GET /api/sator/search?q=TenZ&limit=20
→ Full-text search across players, teams, tournaments
→ Target: <200ms response time
```

### Data Freshness
```
GET /api/sator/freshness
→ Data freshness status and source timestamps
```

### WebSocket
```
WS /ws/sator
→ Real-time updates for matches and players

# Subscribe to channel
{"type": "subscribe", "channel": "matches"}

# Receive updates
{"type": "match_update", "match_id": "...", "data": {...}}
```

## Database Schema

Uses existing `player_performance` table:

```sql
SELECT 
    player_id, name, team, region, role,
    AVG(acs) as avg_acs,
    AVG(sim_rating) as avg_sim_rating,
    COUNT(*) as matches_played
FROM player_performance
GROUP BY player_id, name, team, region, role
ORDER BY avg_sim_rating DESC
```

## Frontend Integration

The frontend expects these endpoints (already defined in `apps/website-v2/src/lib/sator.ts`):

```typescript
// From sator.ts API client
satorApi.getStats()        // GET /sator/stats
satorApi.getTopPlayers()   // GET /sator/players/top
satorApi.getPlayers()      // GET /sator/players
satorApi.getPlayer(id)     // GET /sator/players/{id}
satorApi.getTeams()        // GET /sator/teams
satorApi.getMatches()      // GET /sator/matches
satorApi.search(q)         // GET /sator/search
satorApi.getFreshness()    // GET /sator/freshness

// WebSocket
ws = new WebSocket('ws://api/ws/sator')
ws.send(JSON.stringify({type: 'subscribe', channel: 'matches'}))
```

## Running the API

```bash
# 1. Set environment variables
cp .env.example .env
# Edit .env with your database URL

# 2. Run migrations
psql $DATABASE_URL -f migrations/018_users_auth.sql

# 3. Start the API
cd packages/shared/api
python main.py

# 4. Test endpoints
curl http://localhost:8000/api/sator/stats
curl http://localhost:8000/api/sator/players/top
curl "http://localhost:8000/api/sator/search?q=TenZ"
```

## Data Freshness Logic

| Status | Criteria | Display |
|--------|----------|---------|
| Live | < 5 minutes ago | 🟢 Live |
| Recent | < 1 hour ago | 🟡 Recent |
| Stale | > 1 hour ago | 🔴 Stale |

## Performance Targets

- Search: < 200ms
- Player list: < 100ms
- Stats endpoint: < 50ms
- WebSocket latency: < 100ms

## Next Steps for Production

1. **Add caching layer** (Redis) for stats endpoint
2. **Create materialized view** for top players query
3. **Add rate limiting** on search endpoint
4. **Implement data pipeline** for real-time updates
5. **Add monitoring** for endpoint performance
