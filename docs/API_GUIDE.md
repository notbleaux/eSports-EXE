[Ver001.000]

# ESPORTEZ-MANAGER API Guide

Complete developer guide for the ESPORTEZ-MANAGER Tournament and Analytics API.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Tournament Management](#tournament-management)
4. [Match Operations](#match-operations)
5. [Godot Game Integration](#godot-game-integration)
6. [Analytics Calculations](#analytics-calculations)
7. [WebSocket Real-time Updates](#websocket-real-time-updates)
8. [Webhooks](#webhooks)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [API Reference](#api-reference)

---

## Quick Start

### Base URLs

| Environment | URL |
|-------------|-----|
| Local Development | `http://localhost:8000` |
| Production | `https://api.esportez-manager.com` |

### API Versions

- **v1** (Current): `/api/v1/*` - Latest stable endpoints
- **Legacy**: `/api/*` - Previous version endpoints

### Prerequisites

```bash
# Set your API key
export API_KEY="your_api_key_here"

# Or for Windows PowerShell
$env:API_KEY="your_api_key_here"
```

### 1. Check API Health

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "sator-api",
  "version": "2.1.0",
  "timestamp": "2026-03-30T22:40:00+00:00"
}
```

### 2. Create Your First Tournament

```bash
curl -X POST http://localhost:8000/api/v1/tournaments \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Championship 2026",
    "game": "valorant",
    "start_date": "2026-04-01T00:00:00Z",
    "end_date": "2026-04-05T00:00:00Z"
  }'
```

---

## Authentication

The API uses **Bearer Token Authentication** (JWT).

### Obtaining a Token

```bash
# Request a token
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

### Using the Token

Include the token in all API requests:

```bash
curl http://localhost:8000/api/v1/tournaments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Token Refresh

Tokens expire after a configured period. Use the refresh endpoint:

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

---

## Tournament Management

### List Tournaments

```bash
curl http://localhost:8000/api/v1/tournaments \
  -H "Authorization: Bearer $API_KEY" \
  -G \
  -d "game=valorant" \
  -d "page=1" \
  -d "per_page=20"
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `game` | string | `valorant` | Filter by game: `valorant` or `cs2` |
| `page` | integer | `1` | Page number |
| `per_page` | integer | `20` | Items per page (max 100) |

**Response:**
```json
{
  "tournaments": [
    {
      "id": "12345",
      "name": "VCT Masters Tokyo",
      "slug": "vct-masters-tokyo",
      "game": "valorant",
      "status": "running",
      "start_date": "2026-04-01T00:00:00+00:00",
      "end_date": "2026-04-10T00:00:00+00:00",
      "prize_pool": "$500,000",
      "location": "Tokyo, Japan",
      "teams_count": 12,
      "source": "pandascore"
    }
  ],
  "total": 45,
  "page": 1,
  "per_page": 20
}
```

### Get Tournament Details

```bash
curl http://localhost:8000/api/v1/tournaments/12345 \
  -H "Authorization: Bearer $API_KEY"
```

### Circuit Breaker Status

Check the health of tournament data fetching:

```bash
curl http://localhost:8000/api/v1/tournaments/system/circuit-breakers \
  -H "Authorization: Bearer $API_KEY"
```

**Response:**
```json
{
  "circuit_breakers": {
    "tournament_list": {
      "name": "tournament_list",
      "state": "closed",
      "failure_count": 0,
      "last_failure": null,
      "config": {
        "failure_threshold": 3,
        "recovery_timeout": 30.0
      }
    }
  },
  "summary": {
    "total": 5,
    "closed": 5,
    "open": 0,
    "half_open": 0
  }
}
```

---

## Match Operations

### Submit Match Result

This endpoint is primarily used by the Godot game, but can be called directly:

```bash
curl -X POST http://localhost:8000/api/v1/tournaments/12345/matches/results \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "match_001",
    "tournament_id": "12345",
    "team1_id": "team_alpha",
    "team2_id": "team_beta",
    "team1_score": 13,
    "team2_score": 10,
    "winner_id": "team_alpha",
    "map_results": [
      {
        "map": "ascent",
        "team1_score": 13,
        "team2_score": 10,
        "winner": "team_alpha"
      }
    ],
    "stats": {
      "team_alpha": {
        "player_1": { "kills": 25, "deaths": 15, "assists": 5 }
      }
    }
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `match_id` | string | ✅ | Unique match identifier |
| `tournament_id` | string | ✅ | Must match URL parameter |
| `team1_id` | string | ✅ | First team ID |
| `team2_id` | string | ✅ | Second team ID |
| `team1_score` | integer | ✅ | First team score (≥0) |
| `team2_score` | integer | ✅ | Second team score (≥0) |
| `winner_id` | string | ✅ | ID of winning team |
| `map_results` | array | ❌ | Per-map results |
| `stats` | object | ❌ | Player statistics |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Match result submitted successfully",
  "data": {
    "match_id": "match_001",
    "tournament_id": "12345",
    "team1_id": "team_alpha",
    "team2_id": "team_beta",
    "team1_score": 13,
    "team2_score": 10,
    "winner_id": "team_alpha",
    "submitted_by": "user_123",
    "submitted_at": "2026-03-30T22:45:00+00:00",
    "status": "processed"
  }
}
```

### Get Live Matches

```bash
curl http://localhost:8000/api/v1/live/matches \
  -H "Authorization: Bearer $API_KEY" \
  -G \
  -d "game=valorant" \
  -d "confidence_min=0.8"
```

---

## Godot Game Integration

### Overview

The Godot game exports match results to the API using the `LiveSeasonModule`.

### Configure LiveSeasonModule

```gdscript
extends Node

@onready var export_module = $LiveSeasonModule

func _ready():
    # Configure the API endpoint
    export_module.configure(
        "https://api.esportez-manager.com/api/v1",
        "your_api_key"
    )
    
    # Enable automatic export on match end
    export_module.auto_export = true
    
    # Connect signals
    export_module.match_exported.connect(_on_match_exported)
    export_module.export_failed.connect(_on_export_failed)

func _on_match_exported(match_id: String):
    print("Match ", match_id, " exported successfully!")

func _on_export_failed(match_id: String, error: String):
    push_error("Failed to export match " + match_id + ": " + error)
```

### Manual Match Export

```gdscript
func export_match_result():
    var result = {
        "match_id": generate_match_id(),
        "tournament_id": current_tournament.id,
        "team1_id": match_data.team_a.id,
        "team2_id": match_data.team_b.id,
        "team1_score": match_data.team_a.score,
        "team2_score": match_data.team_b.score,
        "winner_id": match_data.winner.id,
        "map_results": [
            {
                "map": current_map.name,
                "team1_score": map_stats.team_a_rounds,
                "team2_score": map_stats.team_b_rounds
            }
        ],
        "stats": extract_player_stats()
    }
    
    export_client.send_match_data(result)
```

### Export Response Handling

```gdscript
func _on_http_request_completed(result, response_code, headers, body):
    match response_code:
        201:
            print("Match exported successfully")
        400:
            push_error("Invalid match data: " + body.get_string_from_utf8())
        401:
            push_error("Authentication failed - check API key")
        429:
            push_warning("Rate limited - will retry with backoff")
            retry_with_backoff()
        503:
            push_warning("Service unavailable - circuit breaker may be open")
```

---

## Analytics Calculations

### SimRating Calculation

Calculate player performance rating from z-scored components.

```bash
curl -X POST http://localhost:8000/api/v1/analytics/simrating/calculate \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kills_z": 1.2,
    "deaths_z": -0.5,
    "adjusted_kill_value_z": 1.0,
    "adr_z": 0.8,
    "kast_pct_z": 0.6
  }'
```

**Response:**
```json
{
  "sim_rating": 108.2,
  "components": {
    "kills": 1.2,
    "deaths": 0.5,
    "adjusted_kill_value": 1.0,
    "adr": 0.8,
    "kast_pct": 0.6
  },
  "z_scores": {
    "kills": 1.2,
    "deaths": -0.5,
    "adjusted_kill_value": 1.0,
    "adr": 0.8,
    "kast_pct": 0.6
  },
  "percentile": 78.5,
  "interpretation": "Above average performer"
}
```

### RAR (Role-Adjusted Replacement) Calculation

```bash
curl -X POST http://localhost:8000/api/v1/analytics/rar/calculate \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_rating": 108.2,
    "role": "Entry"
  }'
```

**Response:**
```json
{
  "role": "Entry",
  "raw_rating": 108.2,
  "replacement_level": 0.75,
  "rar_score": 1.44,
  "investment_grade": "A",
  "interpretation": "All-Star - Core team piece"
}
```

### Investment Grading

```bash
curl -X POST http://localhost:8000/api/v1/analytics/investment/grade \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_rating": 108.2,
    "role": "Entry",
    "age": 21,
    "record_date": "2026-03-01T00:00:00Z"
  }'
```

**Response:**
```json
{
  "rar_score": 1.44,
  "age_factor": 1.05,
  "adjusted_rar": 1.51,
  "investment_grade": "A+",
  "in_peak_age": true,
  "career_stage": "peak",
  "peak_proximity": 0.95,
  "decay_factor": 0.98
}
```

### Batch Grading

Grade multiple players efficiently:

```bash
curl -X POST http://localhost:8000/api/v1/analytics/investment/grade/batch \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [
      {
        "player_id": "player_001",
        "raw_rating": 115.0,
        "role": "IGL",
        "age": 27,
        "record_date": "2026-03-01T00:00:00Z"
      },
      {
        "player_id": "player_002",
        "raw_rating": 105.0,
        "role": "Entry",
        "age": 19,
        "record_date": "2026-03-01T00:00:00Z"
      }
    ]
  }'
```

### Age Curve Analysis

```bash
curl http://localhost:8000/api/v1/analytics/age-curve/Entry/21 \
  -H "Authorization: Bearer $API_KEY"
```

**Response:**
```json
{
  "role": "Entry",
  "age": 21,
  "peak_range": [20, 24],
  "career_stage": "peak",
  "peak_proximity": 0.95
}
```

---

## WebSocket Real-time Updates

### Connect to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/sator');

ws.onopen = () => {
  console.log('Connected to SATOR WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data.type, data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};
```

### Subscribe to Tournament Updates

```javascript
// Subscribe to a specific tournament
ws.send(JSON.stringify({
  type: 'subscribe',
  tournament_id: 'tournament_uuid'
}));

// Subscribe to match updates
ws.send(JSON.stringify({
  type: 'subscribe',
  match_id: 'match_uuid'
}));
```

### Lens Updates (ROTAS)

```javascript
const lensWs = new WebSocket('ws://localhost:8000/ws/lens-updates');

lensWs.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch(update.type) {
    case 'match_start':
      console.log('Match started:', update.match_id);
      break;
    case 'score_update':
      console.log('Score update:', update.score);
      break;
    case 'match_end':
      console.log('Match ended:', update.winner);
      break;
  }
};
```

### Unified Gateway

```javascript
const gatewayWs = new WebSocket('ws://localhost:8000/ws/gateway');

gatewayWs.onopen = () => {
  // Subscribe to global channel
  gatewayWs.send(JSON.stringify({
    type: 'subscribe',
    channel: 'global'
  }));
  
  // Subscribe to specific hub
  gatewayWs.send(JSON.stringify({
    type: 'subscribe',
    channel: 'hub:sator'
  }));
};

// Heartbeat ping
setInterval(() => {
  gatewayWs.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

---

## Webhooks

### Pandascore Webhook

The API receives real-time match updates from Pandascore.

**Endpoint:** `POST /webhooks/pandascore/match-update`

**Headers:**
| Header | Description |
|--------|-------------|
| `X-Pandascore-Signature` | HMAC-SHA256 signature: `sha256=<hex_digest>` |

**Verification:**
```python
import hmac
import hashlib

def verify_signature(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

**Configure Pandascore Webhook:**
1. Go to Pandascore developer dashboard
2. Set webhook URL: `https://api.esportez-manager.com/webhooks/pandascore/match-update`
3. Set secret (store as `PANDASCORE_WEBHOOK_SECRET`)

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request accepted for async processing |
| 400 | Bad Request | Check request format and parameters |
| 401 | Unauthorized | Check API key or token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Verify resource exists |
| 429 | Rate Limited | Implement exponential backoff |
| 500 | Server Error | Retry with backoff, contact support if persists |
| 503 | Service Unavailable | Circuit breaker may be open, wait and retry |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Retry Strategy

```python
import time
import random

def exponential_backoff(attempt, max_delay=60):
    """Calculate delay with jitter"""
    delay = min(2 ** attempt + random.uniform(0, 1), max_delay)
    return delay

def api_call_with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError:
            delay = exponential_backoff(attempt)
            time.sleep(delay)
        except ServiceUnavailableError:
            if attempt < max_retries - 1:
                delay = exponential_backoff(attempt)
                time.sleep(delay)
            else:
                raise
    raise MaxRetriesExceeded()
```

---

## Rate Limiting

### Limits by Endpoint

| Endpoint Category | Limit | Burst |
|-------------------|-------|-------|
| Standard API | 100/min | 20 |
| Match Results | 10/min | 5 |
| Analytics Calc | 60/min | 10 |
| Webhooks | 1000/min | 100 |
| Health Checks | No limit | - |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648651200
```

### Handling Rate Limits

```javascript
async function apiCallWithRateLimit(url, options) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    
    console.log(`Rate limited. Retrying after ${delay}ms`);
    await sleep(delay);
    return apiCallWithRateLimit(url, options);
  }
  
  return response;
}
```

---

## API Reference

### Complete Endpoint List

#### Health & System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Basic health check |
| GET | `/ready` | No | Readiness probe |
| GET | `/live` | No | Liveness probe |
| GET | `/metrics` | No | Prometheus metrics |
| GET | `/system/circuit-breakers` | Yes | Circuit breaker status |

#### Tournaments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/tournaments` | Yes | List tournaments |
| GET | `/api/v1/tournaments/{id}` | Yes | Get tournament |
| POST | `/api/v1/tournaments/{id}/matches/results` | Yes | Submit match result |

#### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/analytics/simrating/calculate` | Yes | Calculate SimRating |
| POST | `/api/v1/analytics/rar/calculate` | Yes | Calculate RAR |
| POST | `/api/v1/analytics/investment/grade` | Yes | Grade investment |
| POST | `/api/v1/analytics/investment/grade/batch` | Yes | Batch grading |
| GET | `/api/v1/analytics/age-curve/{role}/{age}` | Yes | Age curve analysis |
| GET | `/api/v1/analytics/roles` | Yes | List roles |

#### Verification
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/live/matches` | Yes | Live matches |
| GET | `/api/v1/live/matches/{id}` | Yes | Specific live match |
| GET | `/api/v1/history/matches` | Yes | Match history |
| GET | `/api/v1/history/matches/{id}` | Yes | Historical match |
| GET | `/api/v1/review-queue` | Admin | Review queue |
| POST | `/api/v1/review-queue/{id}/decide` | Admin | Submit decision |

#### Webhooks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/webhooks/pandascore/match-update` | Signature | Receive updates |

#### WebSockets
| Endpoint | Description |
|----------|-------------|
| `/ws/sator` | SATOR live updates |
| `/ws/lens-updates` | ROTAS lens updates |
| `/ws/gateway` | Unified gateway |

---

## SDK Examples

### Python

```python
import httpx
from typing import Optional

class EsportezClient:
    def __init__(self, api_key: str, base_url: str = "http://localhost:8000"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {api_key}"}
    
    async def list_tournaments(self, game: str = "valorant"):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/tournaments",
                headers=self.headers,
                params={"game": game}
            )
            response.raise_for_status()
            return response.json()
    
    async def calculate_simrating(self, **components):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/analytics/simrating/calculate",
                headers={**self.headers, "Content-Type": "application/json"},
                json=components
            )
            response.raise_for_status()
            return response.json()

# Usage
async def main():
    client = EsportezClient(api_key="your_key")
    tournaments = await client.list_tournaments()
    print(tournaments)
```

### JavaScript/TypeScript

```typescript
class EsportezClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'http://localhost:8000') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async listTournaments(game = 'valorant') {
    return this.request(`/api/v1/tournaments?game=${game}`);
  }

  async calculateSimRating(components: {
    kills_z: number;
    deaths_z: number;
    adjusted_kill_value_z: number;
    adr_z: number;
    kast_pct_z: number;
  }) {
    return this.request('/api/v1/analytics/simrating/calculate', {
      method: 'POST',
      body: JSON.stringify(components),
    });
  }
}

// Usage
const client = new EsportezClient('your_api_key');
const tournaments = await client.listTournaments();
```

---

## Support

- **GitHub Issues**: https://github.com/notbleaux/eSports-EXE/issues
- **API Documentation**: http://localhost:8000/docs (when running locally)
- **OpenAPI Spec**: See `openapi.yaml` in this directory

---

*Last Updated: 2026-03-30*
