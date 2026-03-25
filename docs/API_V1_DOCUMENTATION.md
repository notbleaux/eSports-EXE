[Ver002.001]

# API v1 Documentation — NJZiteGeisTe Platform

**Base URL:** `https://api.njzitegeist.com/v1`  
**Protocol:** HTTPS / WebSocket Secure (WSS)  
**Last Updated:** 2026-03-15

---

## Table of Contents

1. [Authentication](#authentication)
2. [Authentication API](#authentication-api)
3. [Players API](#players-api)
4. [Matches API](#matches-api)
5. [Analytics API](#analytics-api)
6. [Search API](#search-api)
7. [Betting API](#betting-api)
8. [WebSocket API](#websocket-api)
9. [Health & Status](#health--status)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Environment Variables](#environment-variables)

---

## Authentication

The API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

### Token Endpoints

**Obtain Token:**
```bash
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=<username>&password=<password>
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

## Authentication API

### OAuth Login

Initiate OAuth flow with provider.

```bash
GET /auth/oauth/{provider}/login
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| provider | string | Yes | Provider: discord, google, github |

**Response:**
Redirects to OAuth provider authorization page.

### OAuth Callback

Callback from OAuth provider.

```bash
GET /auth/oauth/{provider}/callback?code={code}&state={state}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| provider | string | Yes | Provider name |
| code | string | Yes | Authorization code |
| state | string | Yes | CSRF protection token |

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 2FA Setup

Initialize 2FA setup for user.

```bash
POST /auth/2fa/setup
Authorization: Bearer {token}
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KGgo...",
  "backup_codes": ["ABCD-1234-EFGH", "WXYZ-5678-IJKL"]
}
```

### 2FA Verify

Verify TOTP code during login.

```bash
POST /auth/2fa/verify
```

**Request Body:**
```json
{
  "temp_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "totp_code": "123456"
}
```

---

## Players API

### Get Player by ID

```bash
GET /v1/players/{player_id}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| player_id | UUID | Yes | Player UUID |

**Response:**
```json
{
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "TenZ",
  "real_name": "Tyson Ngo",
  "team": "Sentinels",
  "region": "Americas",
  "nationality": "CA",
  "role": "Duelist",
  "kills": 2456,
  "deaths": 1987,
  "acs": 265.4,
  "adr": 168.2,
  "sim_rating": 1.23,
  "rar_score": 1.15,
  "investment_grade": "A+",
  "confidence_tier": 92.5,
  "map_count": 156,
  "last_updated": "2026-03-15T10:00:00Z"
}
```

### List Players

```bash
GET /v1/players/
```

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| region | string | - | Filter by region (Americas, EMEA, Pacific, China) |
| role | string | - | Filter by role (Duelist, Controller, Initiator, Sentinel) |
| min_maps | integer | 50 | Minimum maps for statistical confidence |
| grade | string | - | Investment grade filter (A+, A, B, C, D) |
| limit | integer | 50 | Max results (max: 200) |
| offset | integer | 0 | Pagination offset |
| sort | string | "sim_rating" | Sort field (sim_rating, rar_score, name) |

**Response:**
```json
{
  "players": [...],
  "total": 142,
  "offset": 0,
  "limit": 50
}
```

---

## Matches API

### Get Match by ID

```bash
GET /v1/matches/{match_id}
```

**Response:**
```json
{
  "match_id": "550e8400-e29b-41d4-a716-446655440001",
  "tournament": "VCT Champions 2025",
  "game": "valorant",
  "map_name": "Haven",
  "team1": {
    "id": "team-uuid-1",
    "name": "Sentinels",
    "score": 13
  },
  "team2": {
    "id": "team-uuid-2",
    "name": "FNATIC",
    "score": 11
  },
  "match_date": "2026-03-10T20:00:00Z",
  "duration_minutes": 67,
  "winner_id": "team-uuid-1",
  "player_count": 10
}
```

### List Matches

```bash
GET /v1/matches/
```

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| game | string | - | Filter by game (cs, valorant) |
| tournament | string | - | Filter by tournament name |
| team | string | - | Filter by team name |
| map | string | - | Filter by map name |
| date_from | string | - | Start date (ISO 8601) |
| date_to | string | - | End date (ISO 8601) |
| limit | integer | 50 | Max results (max: 200) |
| offset | integer | 0 | Pagination offset |

### Get SATOR Events (Layer 1)

```bash
GET /v1/matches/{match_id}/rounds/{round_number}/sator-events
```

**Response:**
```json
{
  "match_id": "...",
  "round": 12,
  "events": [
    {
      "type": "plant",
      "player": "TenZ",
      "timestamp": "2026-03-10T20:15:32Z",
      "location": {"x": 150, "y": 200}
    },
    {
      "type": "mvp",
      "player": "TenZ",
      "timestamp": "2026-03-10T20:16:45Z"
    }
  ]
}
```

### Get AREPO Markers (Layer 4)

```bash
GET /v1/matches/{match_id}/rounds/{round_number}/arepo-markers
```

**Response:**
```json
{
  "match_id": "...",
  "round": 12,
  "markers": [
    {
      "type": "death",
      "player": "player1",
      "killer": "TenZ",
      "weapon": "Vandal",
      "headshot": true,
      "location": {"x": 320, "y": 180},
      "timestamp": "2026-03-10T20:15:28Z"
    }
  ]
}
```

### Get ROTAS Trails (Layer 5)

```bash
GET /v1/matches/{match_id}/rounds/{round_number}/rotas-trails
```

**Response:**
```json
{
  "match_id": "...",
  "round": 12,
  "trails": [
    {
      "player": "TenZ",
      "team": "Sentinels",
      "points": [
        {"x": 100, "y": 100, "t": 0},
        {"x": 150, "y": 120, "t": 1.5},
        {"x": 200, "y": 180, "t": 3.2}
      ]
    }
  ]
}
```

---

## Analytics API

### Get SimRating

```bash
GET /v1/analytics/simrating/{player_id}
```

**Response:**
```json
{
  "player_id": "...",
  "sim_rating": 1.23,
  "components": {
    "kills": 0.28,
    "deaths_inverse": 0.18,
    "adjusted_kill_value": 0.30,
    "adr": 0.25,
    "kast_pct": 0.22
  },
  "season": "2025",
  "role": "Duelist",
  "cohort_size": 142,
  "percentile": 94.5
}
```

### Get RAR Score

```bash
GET /v1/analytics/rar/{player_id}
```

**Response:**
```json
{
  "player_id": "...",
  "rar_score": 1.15,
  "role": "Duelist",
  "role_average": 0.98,
  "replacement_level": 0.85,
  "value_above_replacement": 0.30,
  "confidence": 0.92
}
```

### Get Investment Grade

```bash
GET /v1/analytics/investment/{player_id}
```

**Response:**
```json
{
  "player_id": "...",
  "investment_grade": "A+",
  "grade_score": 95.2,
  "age_curve_factor": 0.98,
  "temporal_decay": 0.02,
  "confidence_tier": 92.5,
  "recommendation": "Strong Buy"
}
```

### Get Leaderboard

```bash
GET /v1/analytics/leaderboard
```

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| metric | string | "sim_rating" | Metric to rank by |
| region | string | - | Filter by region |
| role | string | - | Filter by role |
| limit | integer | 100 | Max results |

**Response:**
```json
{
  "metric": "sim_rating",
  "region": "Americas",
  "rankings": [
    {
      "rank": 1,
      "player_id": "...",
      "name": "TenZ",
      "team": "Sentinels",
      "value": 1.23,
      "trend": "up"
    }
  ],
  "generated_at": "2026-03-15T10:00:00Z"
}
```

---

## Betting API

### Get Match Odds

Get current odds for a match.

```bash
GET /api/betting/matches/{match_id}/odds
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| match_id | string | Yes | Match identifier |

**Response:**
```json
{
  "match_id": "match_123",
  "team_a_decimal": 1.85,
  "team_b_decimal": 2.10,
  "team_a_american": -118,
  "team_b_american": 110,
  "last_updated": "2026-03-16T10:30:00Z"
}
```

### Calculate Odds

Force recalculation of odds.

```bash
POST /api/betting/matches/{match_id}/odds/calculate
Authorization: Bearer {token}
```

**Rate Limit:** 5 requests per minute

---

## Search API

### Unified Search

```bash
GET /v1/search/?q={query}
```

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| q | string | Required | Search query (1-100 chars) |
| type | string | - | Filter type (players, teams, matches) |
| game | string | - | Filter by game (cs, valorant) |
| limit | integer | 20 | Max results per type |
| offset | integer | 0 | Pagination offset |
| sort | string | "relevance" | Sort method (relevance, name, date) |

**Response:**
```json
{
  "query": "TenZ",
  "type": null,
  "total": 3,
  "limit": 20,
  "offset": 0,
  "sort": "relevance",
  "players": [
    {
      "id": "...",
      "name": "TenZ",
      "team": "Sentinels",
      "region": "Americas",
      "role": "Duelist",
      "sim_rating": 1.23,
      "relevance_score": 1.0
    }
  ],
  "teams": [],
  "matches": [],
  "execution_ms": 42
}
```

### Player Search

```bash
GET /v1/search/players?q={query}
```

**Additional Parameters:**
| Name | Type | Description |
|------|------|-------------|
| team | string | Filter by team name |
| region | string | Filter by region |

### Team Search

```bash
GET /v1/search/teams?q={query}
```

**Additional Parameters:**
| Name | Type | Description |
|------|------|-------------|
| region | string | Filter by region |

### Match Search

```bash
GET /v1/search/matches?q={query}
```

**Additional Parameters:**
| Name | Type | Description |
|------|------|-------------|
| tournament | string | Filter by tournament |
| map_name | string | Filter by map |

### Search Suggestions

```bash
GET /v1/search/suggestions?q={partial}
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| q | string | Required | Partial query (2-50 chars) |
| type | string | "all" | Suggestion type (players, teams, all) |
| limit | integer | 10 | Max suggestions |

**Response:**
```json
{
  "query": "Te",
  "suggestions": [
    {"type": "player", "name": "TenZ", "id": "..."},
    {"type": "player", "name": "Tenzin", "id": "..."}
  ],
  "total": 2
}
```

**Search Features:**
- Full-text search with PostgreSQL tsvector/tsquery
- Trigram fuzzy matching for typo tolerance
- Weighted relevance scoring
- Rate limited: 30 requests/minute

---

## WebSocket API

### Connection

```
wss://api.njzitegeist.com/ws/gateway
```

### Authentication

Connect with token:
```
wss://api.njzitegeist.com/ws/gateway?token=<jwt_token>
```

Or authenticate after connection:
```json
{
  "type": "authenticate",
  "token": "<jwt_token>"
}
```

### Client Messages

#### Subscribe to Channel

```json
{
  "type": "subscribe",
  "channel": "match:12345",
  "filters": {
    "events": ["kill", "round_end", "plant"]
  }
}
```

#### Unsubscribe

```json
{
  "type": "unsubscribe",
  "channel": "match:12345"
}
```

#### Ping

```json
{
  "type": "ping"
}
```

### Server Messages

#### Connection Confirmation

```json
{
  "type": "connection",
  "data": {
    "status": "connected",
    "connection_id": "abc123...",
    "authenticated": true
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Match Update

```json
{
  "type": "match_update",
  "channel": "match:12345",
  "data": {
    "matchId": "12345",
    "eventType": "kill",
    "data": {
      "killer": "TenZ",
      "victim": "player2",
      "weapon": "Vandal",
      "headshot": true
    },
    "round": 12,
    "timestamp": "2026-03-15T10:00:00Z"
  },
  "timestamp": "2026-03-15T10:00:00Z"
}
```

#### Player Stats Update

```json
{
  "type": "player_stats_update",
  "channel": "player:tenz",
  "data": {
    "playerId": "tenz",
    "matchId": "12345",
    "stats": {
      "kills": 15,
      "deaths": 8,
      "acs": 245
    }
  }
}
```

### Channel Types

| Channel | Format | Description |
|---------|--------|-------------|
| Match | `match:<match_id>` | Live match events |
| Player | `player:<player_id>` | Player statistics updates |
| Analytics | `analytics:<channel_id>` | Analytics and rankings |
| System | `system:global` | System-wide notifications |
| Tournament | `tournament:<tournament_id>` | Tournament updates |

### Reconnection Strategy

- Auto-reconnect enabled by default
- Exponential backoff: 1s, 2s, 4s, 8s... (max 30s)
- Max attempts: 10 (0 = unlimited)
- Heartbeat interval: 30 seconds

See [WebSocket Protocol Documentation](WEBSOCKET_PROTOCOL.md) for complete details.

---

## Health & Status

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "2.1.0",
  "timestamp": "2026-03-15T10:00:00Z"
}
```

### Readiness Check

```bash
GET /ready
```

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "pandascore": "available"
  }
}
```

### Liveness Check

```bash
GET /live
```

**Response:**
```json
{
  "status": "alive"
}
```

### Metrics (Prometheus)

```bash
GET /metrics
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "Player with ID 'xxx' not found",
    "details": {},
    "request_id": "req-abc123"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

| Code | Description |
|------|-------------|
| `PLAYER_NOT_FOUND` | Player ID does not exist |
| `MATCH_NOT_FOUND` | Match ID does not exist |
| `INVALID_UUID` | Invalid UUID format |
| `INVALID_PARAMETER` | Query parameter validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Standard API | 100 requests | 1 minute |
| Search API | 30 requests | 1 minute |
| Suggestions | 60 requests | 1 minute |
| WebSocket | 100 messages | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710507600
```

### Rate Limit Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "retry_after": 45
  }
}
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| REDIS_URL | Redis connection | redis://... |
| JWT_SECRET_KEY | JWT signing key | secret-key |

### OAuth Providers

| Variable | Description |
|----------|-------------|
| DISCORD_CLIENT_ID | Discord app ID |
| DISCORD_CLIENT_SECRET | Discord app secret |
| GOOGLE_CLIENT_ID | Google app ID |
| GOOGLE_CLIENT_SECRET | Google app secret |
| GITHUB_CLIENT_ID | GitHub app ID |
| GITHUB_CLIENT_SECRET | GitHub app secret |

### Push Notifications

| Variable | Description |
|----------|-------------|
| VAPID_PUBLIC_KEY | VAPID public key |
| VAPID_PRIVATE_KEY | VAPID private key |
| VAPID_CLAIMS_EMAIL | Admin email |

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Initialize client
const api = new NJZiteGeisTe({
  baseURL: 'https://api.njzitegeist.com/v1',
  token: 'your-jwt-token'
});

// Get player
const player = await api.players.get('player-uuid');

// Search
const results = await api.search.all({ q: 'TenZ', type: 'players' });

// WebSocket
const ws = api.websocket.connect();
ws.subscribe('match:12345', (update) => {
  console.log('Match update:', update);
});
```

### Python

```python
from njzitegeist import Client

client = Client(
    base_url="https://api.njzitegeist.com/v1",
    token="your-jwt-token"
)

# Get player
player = client.players.get("player-uuid")

# Search
results = client.search.all(q="TenZ", type="players")

# List with filters
players = client.players.list(region="Americas", role="Duelist")
```

---

*End of API v1 Documentation*
