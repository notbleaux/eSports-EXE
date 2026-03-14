[Ver001.000]

# Riot Games API Integration Guide

**Document:** Riot Games API Integration for SATOR Platform  
**Last Updated:** 2026-03-15  
**Status:** Research & Setup Phase Complete

---

## Overview

This document outlines the integration of the official Riot Games API for Valorant data into the SATOR platform. The Riot API provides official, authoritative data directly from Riot's servers, complementing our existing Pandascore and VLR data sources.

---

## Table of Contents

1. [API Key Requirements](#api-key-requirements)
2. [Available Endpoints](#available-endpoints)
3. [Rate Limits](#rate-limits)
4. [Architecture](#architecture)
5. [Hybrid Data Strategy](#hybrid-data-strategy)
6. [Usage Examples](#usage-examples)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

---

## API Key Requirements

### Getting an API Key

1. Visit [https://developer.riotgames.com/](https://developer.riotgames.com/)
2. Sign in with your Riot account
3. Navigate to "Dashboard"
4. Click "Register Product"
5. Choose between:
   - **Personal Project** - Limited rate limits, no approval needed
   - **Production Project** - Higher limits, requires Riot approval

### Key Types

| Type | Rate Limit | Use Case | Approval |
|------|------------|----------|----------|
| **Development** | 20 req/s, 100 req/2min | Testing, prototyping | Auto-generated, expires in 24h |
| **Personal** | 20 req/s, 100 req/2min | Personal projects, small scale | Quick approval |
| **Production** | 500 req/10s, 30k req/10min | Public applications, esports platforms | Requires approval, RSO integration |

### Environment Configuration

```bash
# Backend (.env)
RIOT_API_KEY=RGAPI-your-api-key-here
RIOT_API_REGION=na
RIOT_API_SHARD=na

# Frontend (.env)
VITE_RIOT_API_KEY=RGAPI-your-api-key-here  # Dev only!
VITE_RIOT_API_URL=http://localhost:8000/api/riot  # Production proxy
```

---

## Available Endpoints

### VAL-CONTENT-V1

Get static game content (maps, agents, weapons, etc.).

```python
GET /val/content/v1/contents?locale={locale}
```

**Python:**
```python
from packages.shared.api.riot_client import RiotApiClient

async with RiotApiClient() as client:
    content = await client.get_content(locale="en-US")
    print(f"Agents: {len(content.characters)}")
    print(f"Maps: {len(content.maps)}")
```

**TypeScript:**
```typescript
import { riotApi } from '@/api/riot';

const content = await riotApi.getContent('en-US');
```

### VAL-MATCH-V1

Access match data and player match history.

```python
# Get match details
GET /val/match/v1/matches/{matchId}

# Get player match history
GET /val/match/v1/matchlists/by-puuid/{puuid}?queue={queue}&startIndex={start}&endIndex={end}

# Get recent matches
GET /val/match/v1/recent-matches/by-queue/{queue}
```

**Python:**
```python
# Get specific match
match = await client.get_match("match-uuid-here")

# Get player match history
matchlist = await client.get_matchlist(
    puuid="player-uuid",
    queue="competitive",
    start_index=0,
    end_index=20
)
```

### VAL-RANKED-V1

Access ranked leaderboards.

```python
GET /val/ranked/v1/leaderboards/by-act/{actId}?size={size}&startIndex={start}
```

**Python:**
```python
leaderboard = await client.get_leaderboard(
    act_id="act-uuid",
    size=200,
    start_index=0
)
```

### VAL-STATUS-V1

Check platform status and incidents.

```python
GET /val/status/v1/platformData
```

**Python:**
```python
status = await client.get_platform_data()
print(f"Platform: {status.name}")
print(f"Active Incidents: {len(status.incidents)}")
```

### Account/RSO Endpoints (Production Only)

These endpoints require a Production API key with RSO integration:

```python
# Get account by Riot ID
GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}

# Get account by PUUID
GET /riot/account/v1/accounts/by-puuid/{puuid}

# Get active shard
GET /riot/account/v1/active-shards/by-game/val/by-puuid/{puuid}
```

---

## Rate Limits

### Personal API Key Limits

| Window | Limit | Per Region |
|--------|-------|------------|
| 1 second | 20 requests | ✓ |
| 2 minutes | 100 requests | ✓ |

### Production API Key Limits

| Window | Limit | Per Region |
|--------|-------|------------|
| 10 seconds | 500 requests | ✓ |
| 10 minutes | 30,000 requests | ✓ |

### Rate Limit Headers

Responses include headers for tracking:

```
X-Rate-Limit-Limit: 20:1,100:120
X-Rate-Limit-Count: 5:1,50:120
Retry-After: 2  # Only on 429 responses
```

### Rate Limit Handling

Our clients automatically handle rate limits:

**Python:**
- Token bucket rate limiter with automatic throttling
- Exponential backoff on 429 responses
- Queue-based request management

**TypeScript:**
- Request timing tracking
- Automatic delays when approaching limits
- Queue for concurrent requests

---

## Architecture

### Backend (Python)

```
packages/shared/api/
├── riot_client.py      # Main API client
├── riot_models.py      # Pydantic data models
├── circuit_breaker.py  # Fault tolerance
└── cache.py            # Redis caching
```

**Key Features:**
- Async/await support via `aiohttp`
- Automatic rate limiting
- Circuit breaker pattern for resilience
- Redis caching with TTL
- Pydantic models for type safety
- Comprehensive error handling

### Frontend (TypeScript)

```
apps/website-v2/src/api/
├── riot.ts            # Main API client
├── client.ts          # Base HTTP client
└── pandascore.ts      # Reference implementation
```

**Key Features:**
- Type-safe API responses
- In-memory caching
- Rate limiting
- Error handling with user-friendly messages
- Data transformation to SATOR format

---

## Hybrid Data Strategy

### Data Source Hierarchy

We combine multiple data sources for comprehensive coverage:

```
┌─────────────────────────────────────────────────────────┐
│                    Data Sources                         │
├─────────────────────────────────────────────────────────┤
│  1. Riot API (Official)    - Authoritative match data   │
│  2. Pandascore (Legal)     - Esports tournament data    │
│  3. VLR (Community)        - Additional stats, cached   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              SATOR Data Pipeline                        │
│         (Normalization & Deduplication)                 │
└─────────────────────────────────────────────────────────┘
```

### When to Use Each Source

| Data Type | Primary Source | Fallback | Notes |
|-----------|---------------|----------|-------|
| Match Details | Riot API | Pandascore | Riot has most accurate data |
| Player Stats | Riot API | VLR | Riot requires player opt-in |
| Leaderboards | Riot API | - | Official source |
| Tournament Data | Pandascore | - | Esports focused |
| Team Info | Pandascore | VLR | Pandascore has better coverage |
| Game Content | Riot API | - | Static data, heavily cached |
| Platform Status | Riot API | - | Real-time incidents |

### HybridDataSource Class

```python
from packages.shared.api.riot_client import HybridValorantDataSource

async with HybridValorantDataSource() as source:
    # Automatically uses best available source
    match = await source.get_match("match-id")
    
    if source.is_official_source:
        print("Using official Riot API")
```

---

## Usage Examples

### Basic Match Lookup

**Python:**
```python
import asyncio
from packages.shared.api.riot_client import RiotApiClient

async def get_match_info(match_id: str):
    async with RiotApiClient() as client:
        match = await client.get_match(match_id)
        
        if match:
            print(f"Map: {match.match_info.map_id}")
            print(f"Duration: {match.match_info.game_length_millis / 60000:.1f} minutes")
            
            for player in match.players[:5]:
                print(f"{player.game_name}#{player.tag_line}: {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}")

asyncio.run(get_match_info("your-match-id"))
```

**TypeScript:**
```typescript
import { riotApi } from '@/api/riot';

async function displayMatch(matchId: string) {
  const match = await riotApi.getMatch(matchId);
  
  if (match) {
    const summary = riotApi.transformMatchToSator(match);
    console.log(`Map: ${summary.mapName}`);
    console.log(`Duration: ${summary.gameLength}`);
  }
}
```

### Player Statistics

**Python:**
```python
async def get_player_stats(puuid: str):
    async with RiotApiClient() as client:
        # Get recent matches
        matchlist = await client.get_matchlist(puuid, queue="competitive", end_index=10)
        
        # Fetch match details
        matches = []
        for entry in matchlist.history[:5]:
            match = await client.get_match(entry.match_id)
            if match:
                matches.append(match)
        
        # Calculate stats
        # ... (aggregate from matches)
```

**TypeScript:**
```typescript
async function getPlayerStats(puuid: string) {
  const matchlist = await riotApi.getMatchlist(puuid, 'competitive', 0, 10);
  
  const matches = await Promise.all(
    matchlist.history.slice(0, 5).map(entry => 
      riotApi.getMatch(entry.matchId)
    )
  );
  
  const validMatches = matches.filter((m): m is RiotMatch => m !== null);
  const stats = riotApi.calculatePlayerStats(puuid, validMatches);
  
  return stats;
}
```

### Health Check

**Python:**
```python
async with RiotApiClient() as client:
    health = await client.health_check()
    print(health)
    # {"healthy": true, "region": "na", "platform": "Valorant", "incidents": 0}
```

**TypeScript:**
```typescript
const health = await riotApi.healthCheck();
if (!health.healthy) {
  console.error('Riot API unavailable:', health.error);
}
```

---

## Error Handling

### Common Error Codes

| Status | Code | Meaning | Action |
|--------|------|---------|--------|
| 400 | Bad Request | Invalid parameters | Check request format |
| 401 | Unauthorized | Missing/invalid API key | Verify RIOT_API_KEY |
| 403 | Forbidden | Key lacks permissions | Upgrade to Production key |
| 404 | Not Found | Resource doesn't exist | Handle gracefully |
| 429 | Rate Limit | Too many requests | Wait and retry |
| 500+ | Server Error | Riot server issues | Retry with backoff |

### Python Exception Handling

```python
from aiohttp import ClientResponseError

async with RiotApiClient() as client:
    try:
        match = await client.get_match("invalid-id")
    except ClientResponseError as e:
        if e.status == 404:
            print("Match not found")
        elif e.status == 429:
            print("Rate limited, try again later")
        else:
            raise
```

### TypeScript Error Handling

```typescript
try {
  const match = await riotApi.getMatch('match-id');
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Show user-friendly message
  } else if (error.message.includes('404')) {
    // Handle not found
  }
}
```

---

## Security Considerations

### API Key Protection

⚠️ **CRITICAL:** Never expose your Production API key in frontend code!

**Development:**
- Can use key in frontend for testing
- Use Development or Personal key only

**Production:**
- Always proxy requests through backend
- Store key in environment variables
- Use key rotation
- Monitor usage for anomalies

### Recommended Architecture (Production)

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  Backend API │─────▶│  Riot API   │
│   (No Key)  │      │  (Key Here)  │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Cache     │
                     │   (Redis)    │
                     └──────────────┘
```

### CORS and Headers

The Riot API supports CORS but requires proper headers:

```python
headers = {
    "X-Riot-Token": api_key,  # Primary auth method
    "Accept": "application/json",
}
```

---

## Testing

### Without API Key

Most endpoints require a valid API key. For development without a key:

1. Use mock data
2. Use cached responses
3. Apply for a Development key (free, instant)

### With Development Key

```bash
# Set environment variable
export RIOT_API_KEY=RGAPI-xxxx-xxxx-xxxx-xxxx

# Run tests
python -m pytest tests/integration/test_riot_api.py -v
```

### Mock Testing

```python
import pytest
from unittest.mock import AsyncMock, patch

@patch('packages.shared.api.riot_client.RiotApiClient.get_match')
async def test_match_processing(mock_get_match):
    mock_get_match.return_value = AsyncMock(
        match_info=AsyncMock(map_id="map_id"),
        players=[]
    )
    # Test your code...
```

---

## Next Steps

### Phase 4.2: Backend API Routes

Create FastAPI routes to expose Riot data:

```python
# packages/shared/api/routes/riot.py
from fastapi import APIRouter

router = APIRouter(prefix="/riot", tags=["Riot API"])

@router.get("/matches/{match_id}")
async def get_match(match_id: str):
    async with RiotApiClient() as client:
        return await client.get_match(match_id)
```

### Phase 4.3: Frontend Integration

Integrate with SATOR hub components:

```typescript
// components/MatchDetails.tsx
import { riotApi } from '@/api/riot';

export function MatchDetails({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<RiotMatch | null>(null);
  
  useEffect(() => {
    riotApi.getMatch(matchId).then(setMatch);
  }, [matchId]);
  
  // Render match details...
}
```

### Phase 4.4: Data Pipeline Integration

Store Riot data in database:

```python
# Pipeline step to sync Riot matches
async def sync_riot_matches():
    async with RiotApiClient() as client:
        recent = await client.get_recent_matches("competitive")
        for entry in recent:
            match = await client.get_match(entry["matchId"])
            await store_in_database(match)
```

---

## References

- [Riot Developer Portal](https://developer.riotgames.com/)
- [Valorant API Docs](https://developer.riotgames.com/docs/valorant)
- [Rate Limiting Guide](https://developer.riotgames.com/docs/portal)
- [RSO Integration Guide](https://developer.riotgames.com/docs/rs)

---

## Support

For issues or questions:
1. Check [Riot Developer Discord](https://discord.gg/riotapi)
2. Review [Developer Forums](https://developer.riotgames.com/forums)
3. File an issue in this repository

---

*This document is maintained as part of the SATOR platform documentation. Last updated: 2026-03-15*
