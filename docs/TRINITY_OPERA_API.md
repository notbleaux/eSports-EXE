[Ver001.000]

# TRINITY + OPERA API Documentation

**HubDataGateway API Reference — Component D (OPERA) Client Library**

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [TiDBOperaClient](#tidboperaclient)
4. [Tournament Operations](#tournament-operations)
5. [Schedule Operations](#schedule-operations)
6. [Patch Operations](#patch-operations)
7. [Team Operations](#team-operations)
8. [Cross-Hub Queries](#cross-hub-queries)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## Overview

The OPERA (Operational Event & Results Aggregator) API provides programmatic access to tournament metadata, match schedules, team information, and circuit standings. Built on TiDB for distributed scalability, OPERA serves as the operational satellite to the main SATOR analytics platform.

### Base URL

```
Production:  https://opera.sator.io/api/v1
Development: http://localhost:8000/api/v1
```

### Authentication

All API requests require authentication using one of:

1. **API Key** (Header): `X-API-Key: your_api_key`
2. **Bearer Token** (Header): `Authorization: Bearer your_token`
3. **Service Account** (Internal): Automatic via VPC

### Response Format

All responses are JSON with the following structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "timestamp": "2026-03-15T04:50:54Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "TOURNAMENT_NOT_FOUND",
    "message": "Tournament with ID 12345 does not exist",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-03-15T04:50:54Z"
  }
}
```

---

## Getting Started

### Installation

```bash
# Install the Python client
pip install sator-opera-client

# Or use the built-in client from the repository
pip install -e packages/shared/api
```

### Quick Start

```python
from api.src.opera import TiDBOperaClient

# Initialize client
client = TiDBOperaClient(
    host="gateway.xxx.tidbcloud.com",
    port=4000,
    user="opera",
    password="your_password",
    database="opera_metadata"
)

# List tournaments
tournaments = client.list_tournaments(
    status="ongoing",
    game="Valorant",
    limit=10
)

print(f"Found {len(tournaments)} ongoing tournaments")
```

---

## TiDBOperaClient

### Constructor

```python
TiDBOperaClient(
    host: str,
    port: int = 4000,
    user: str = "opera",
    password: str = "",
    database: str = "opera_metadata",
    pool_size: int = 5,
)
```

**Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| host | str | required | TiDB server hostname |
| port | int | 4000 | TiDB server port |
| user | str | "opera" | Database username |
| password | str | "" | Database password |
| database | str | "opera_metadata" | Database name |
| pool_size | int | 5 | Connection pool size |

**Example**:

```python
client = TiDBOperaClient(
    host="gateway.xxx.us-east-1.prod.aws.tidbcloud.com",
    port=4000,
    user="opera",
    password=os.environ["TIDB_PASSWORD"],
    database="opera_metadata",
    pool_size=10
)
```

### Context Manager

```python
# Recommended: Use context manager for automatic cleanup
with TiDBOperaClient(
    host="gateway.xxx.tidbcloud.com",
    user="opera",
    password="secret"
) as client:
    tournament = client.get_tournament(1)
    # Client automatically closed
```

### Health Check

```python
# Check connection health
health = client.health_check()
print(health)
```

**Response**:

```json
{
  "status": "healthy",
  "ping": true,
  "server_time": "2026-03-15T04:50:54Z",
  "threads_connected": 8,
  "host": "gateway.xxx.tidbcloud.com",
  "port": 4000,
  "database": "opera_metadata"
}
```

---

## Tournament Operations

### Create Tournament

```python
create_tournament(
    tournament_data: Dict[str, Any]
) -> Dict[str, Any]
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | str | Yes | Tournament display name |
| tier | str | No | Champions, Masters, Challenger, etc. |
| game | str | No | Valorant, CS2, etc. (default: Valorant) |
| region | str | No | NA, EMEA, APAC, etc. |
| organizer | str | No | Tournament organizer name |
| prize_pool_usd | int | No | Prize pool in USD |
| start_date | str | No | ISO date (YYYY-MM-DD) |
| end_date | str | No | ISO date (YYYY-MM-DD) |
| status | str | No | upcoming, ongoing, completed |
| sator_cross_ref | str | No | Link to SATOR analytics ID |

**Example**:

```python
tournament = client.create_tournament({
    "name": "VCT 2026 Masters Tokyo",
    "tier": "Masters",
    "game": "Valorant",
    "region": "International",
    "organizer": "Riot Games",
    "prize_pool_usd": 1000000,
    "start_date": "2026-06-01",
    "end_date": "2026-06-14",
    "status": "upcoming"
})

print(tournament["tournament_id"])  # 12345
```

**Response**:

```json
{
  "tournament_id": 12345,
  "name": "VCT 2026 Masters Tokyo",
  "tier": "Masters",
  "game": "Valorant",
  "region": "International",
  "organizer": "Riot Games",
  "prize_pool_usd": 1000000,
  "start_date": "2026-06-01",
  "end_date": "2026-06-14",
  "status": "upcoming",
  "sator_cross_ref": null,
  "created_at": "2026-03-15T04:50:54Z",
  "updated_at": "2026-03-15T04:50:54Z"
}
```

### Get Tournament

```python
get_tournament(
    tournament_id: int
) -> Optional[Dict[str, Any]]
```

**Example**:

```python
tournament = client.get_tournament(12345)
if tournament:
    print(f"Tournament: {tournament['name']}")
else:
    print("Tournament not found")
```

### List Tournaments

```python
list_tournaments(
    status: Optional[str] = None,
    tier: Optional[str] = None,
    game: Optional[str] = None,
    region: Optional[str] = None,
    start_after: Optional[date] = None,
    end_before: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]
```

**Example**:

```python
from datetime import date

# Get ongoing Valorant tournaments in NA
ongoing = client.list_tournaments(
    status="ongoing",
    game="Valorant",
    region="NA",
    limit=20
)

# Get upcoming Masters events
masters = client.list_tournaments(
    status="upcoming",
    tier="Masters",
    start_after=date(2026, 1, 1),
    limit=10
)
```

### Update Tournament Status

```python
update_tournament_status(
    tournament_id: int,
    status: str,
) -> Optional[Dict[str, Any]]
```

**Example**:

```python
# Mark tournament as ongoing
updated = client.update_tournament_status(
    tournament_id=12345,
    status="ongoing"
)

# Mark as completed
completed = client.update_tournament_status(
    tournament_id=12345,
    status="completed"
)
```

### Get Tournament with Performance Summary

```python
get_tournament_with_performance_summary(
    tournament_id: int,
) -> Optional[Dict[str, Any]]
```

**Example**:

```python
summary = client.get_tournament_with_performance_summary(12345)
print(summary["performance_summary"])
```

**Response**:

```json
{
  "tournament_id": 12345,
  "name": "VCT 2026 Masters Tokyo",
  ...,
  "performance_summary": {
    "total_matches": 32,
    "completed_matches": 28,
    "live_matches": 2,
    "scheduled_matches": 2,
    "participating_teams": 12,
    "first_match": "2026-06-01T10:00:00Z",
    "last_match": "2026-06-14T18:00:00Z",
    "teams": [
      {"team_id": 1, "name": "Sentinels", "tag": "SEN", "region": "NA"},
      {"team_id": 2, "name": "Fnatic", "tag": "FNC", "region": "EMEA"}
    ]
  }
}
```

---

## Schedule Operations

### Create Schedule

```python
create_schedule(
    schedule_data: Dict[str, Any]
) -> Dict[str, Any]
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tournament_id | int | Yes | Parent tournament ID |
| match_id | str | Yes | Unique match identifier |
| round_name | str | No | Round/group name |
| team_a_id | int | No | Team A ID |
| team_b_id | int | No | Team B ID |
| scheduled_at | datetime | No | Match start time (ISO 8601) |
| stream_url | str | No | Primary stream URL |
| status | str | No | scheduled, live, completed |
| sator_match_ref | str | No | Link to SATOR match |

**Example**:

```python
schedule = client.create_schedule({
    "tournament_id": 12345,
    "match_id": "vct-2026-masters-sf-001",
    "round_name": "Semifinals",
    "team_a_id": 1,
    "team_b_id": 2,
    "scheduled_at": "2026-06-10T16:00:00Z",
    "stream_url": "https://twitch.tv/valorant",
    "status": "scheduled",
    "sator_match_ref": "sator-match-abc123"
})
```

### Get Schedule for Tournament

```python
get_schedule_for_tournament(
    tournament_id: int,
    status: Optional[str] = None,
    limit: int = 100,
) -> List[Dict[str, Any]]
```

**Example**:

```python
# Get all scheduled matches
scheduled = client.get_schedule_for_tournament(
    tournament_id=12345,
    status="scheduled",
    limit=50
)

# Get live matches
live = client.get_schedule_for_tournament(
    tournament_id=12345,
    status="live"
)

for match in live:
    print(f"LIVE: {match['team_a_name']} vs {match['team_b_name']}")
```

**Response**:

```json
[
  {
    "schedule_id": 98765,
    "tournament_id": 12345,
    "match_id": "vct-2026-masters-sf-001",
    "round_name": "Semifinals",
    "team_a_id": 1,
    "team_b_id": 2,
    "team_a_name": "Sentinels",
    "team_b_name": "Fnatic",
    "scheduled_at": "2026-06-10T16:00:00Z",
    "stream_url": "https://twitch.tv/valorant",
    "status": "scheduled",
    "sator_match_ref": "sator-match-abc123",
    "created_at": "2026-03-15T04:50:54Z"
  }
]
```

### Update Match Status

```python
update_match_status(
    match_id: str,
    status: str,
    additional_fields: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]
```

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| match_id | str | Match identifier |
| status | str | New status |
| additional_fields | dict | Optional: team_a_score, team_b_score, winner_team_id, duration_minutes |

**Example**:

```python
# Mark match as live
client.update_match_status(
    match_id="vct-2026-masters-sf-001",
    status="live"
)

# Complete match with scores
client.update_match_status(
    match_id="vct-2026-masters-sf-001",
    status="completed",
    additional_fields={
        "team_a_score": 2,
        "team_b_score": 1,
        "winner_team_id": 1,
        "duration_minutes": 127
    }
)
```

---

## Patch Operations

### Create Patch

```python
create_patch(
    patch_data: Dict[str, Any]
) -> Dict[str, Any]
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| version | str | Yes | Patch version (e.g., "8.11") |
| game | str | No | Game name (default: Valorant) |
| patch_type | str | No | major, minor, hotfix, beta |
| release_date | str | No | ISO date |
| notes_url | str | No | Link to patch notes |
| summary | str | No | Brief description |
| is_active_competitive | bool | No | Active in competitive play |
| sator_meta_ref | str | No | Link to SATOR meta analysis |

**Example**:

```python
patch = client.create_patch({
    "version": "8.11",
    "game": "Valorant",
    "patch_type": "major",
    "release_date": "2026-01-10",
    "notes_url": "https://playvalorant.com/patch-notes/8.11",
    "summary": "New agent Clove, map changes, weapon balance",
    "is_active_competitive": True
})
```

### Get Patch

```python
get_patch(patch_id: int) -> Optional[Dict[str, Any]]

get_patch_by_version(
    version: str,
    game: str = "Valorant"
) -> Optional[Dict[str, Any]]
```

**Example**:

```python
# Get by ID
patch = client.get_patch(42)

# Get by version
patch = client.get_patch_by_version("8.11", "Valorant")
```

### Get Patches for Date Range

```python
get_patches_for_date_range(
    start_date: date,
    end_date: date,
    game: Optional[str] = None,
    active_only: bool = False,
) -> List[Dict[str, Any]]
```

**Example**:

```python
from datetime import date

# Get all patches in 2026
patches = client.get_patches_for_date_range(
    start_date=date(2026, 1, 1),
    end_date=date(2026, 12, 31),
    game="Valorant"
)

# Get active competitive patches
active = client.get_patches_for_date_range(
    start_date=date(2026, 1, 1),
    end_date=date(2026, 12, 31),
    active_only=True
)
```

---

## Team Operations

### Create Team

```python
create_team(
    team_data: Dict[str, Any]
) -> Dict[str, Any]
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | str | Yes | Team display name |
| tag | str | No | Short abbreviation (e.g., "SEN") |
| region | str | No | Team region |
| logo_url | str | No | Logo image URL |
| website | str | No | Official website |
| social_media | dict | No | JSON object with social links |

**Example**:

```python
team = client.create_team({
    "name": "Sentinels",
    "tag": "SEN",
    "region": "NA",
    "logo_url": "https://example.com/sen-logo.png",
    "website": "https://sentinels.gg",
    "social_media": {
        "twitter": "@Sentinels",
        "youtube": "@Sentinels",
        "twitch": "Sentinels"
    }
})
```

### Get Team

```python
_get_team_by_id(team_id: int) -> Optional[Dict[str, Any]]
```

**Example**:

```python
team = client._get_team_by_id(1)
print(f"Team: {team['name']} ({team['tag']})")
```

---

## Cross-Hub Queries

### Overview

Cross-hub queries combine data from multiple TRINITY + OPERA components to provide comprehensive insights. These queries typically:

1. Fetch operational data from Component D (OPERA/TiDB)
2. Fetch analytics data from Component B (PostgreSQL)
3. Aggregate and return combined results

### Tournament with Player Stats

```python
async def get_tournament_player_stats(
    client: TiDBOperaClient,
    tournament_id: int
) -> Dict[str, Any]:
    """
    Get tournament details with player performance statistics
    from Component B (PostgreSQL).
    """
    # Get tournament from OPERA
    tournament = client.get_tournament(tournament_id)
    
    # Get schedule to find match IDs
    schedule = client.get_schedule_for_tournament(
        tournament_id,
        status="completed"
    )
    
    match_ids = [s["match_id"] for s in schedule]
    
    # Query Component B for player stats
    # (Assumes separate PostgreSQL connection)
    player_stats = await get_player_stats_for_matches(match_ids)
    
    return {
        "tournament": tournament,
        "player_stats": player_stats,
        "match_count": len(match_ids)
    }
```

### Live Matches with Analytics

```python
async def get_live_matches_with_analytics(
    client: TiDBOperaClient
) -> List[Dict[str, Any]]:
    """
    Get all live matches with real-time analytics.
    """
    # Find all ongoing tournaments
    tournaments = client.list_tournaments(status="ongoing")
    
    live_matches = []
    
    for tournament in tournaments:
        # Get live matches for this tournament
        matches = client.get_schedule_for_tournament(
            tournament["tournament_id"],
            status="live"
        )
        
        for match in matches:
            # Get team analytics from Component B
            team_a_stats = await get_team_analytics(match["team_a_id"])
            team_b_stats = await get_team_analytics(match["team_b_id"])
            
            live_matches.append({
                **match,
                "tournament_name": tournament["name"],
                "team_a_analytics": team_a_stats,
                "team_b_analytics": team_b_stats
            })
    
    return live_matches
```

### Player Career Across Tournaments

```python
async def get_player_career_summary(
    client: TiDBOperaClient,
    sator_player_ref: str
) -> Dict[str, Any]:
    """
    Get comprehensive player career spanning multiple tournaments.
    """
    # Get player roster history from OPERA
    roster_history = await get_roster_history(sator_player_ref)
    
    # Get all tournament IDs player participated in
    tournament_ids = set()
    for roster in roster_history:
        # Query schedules for this player
        schedules = await get_schedules_for_player(roster["player_id"])
        for schedule in schedules:
            tournament_ids.add(schedule["tournament_id"])
    
    # Get tournament details
    tournaments = []
    for tid in tournament_ids:
        tournament = client.get_tournament(tid)
        if tournament:
            tournaments.append(tournament)
    
    # Get performance stats from Component B
    performance = await get_player_performance_summary(sator_player_ref)
    
    return {
        "player_id": sator_player_ref,
        "roster_history": roster_history,
        "tournaments": tournaments,
        "performance_summary": performance
    }
```

### Circuit Standings with RAR Scores

```python
async def get_circuit_standings_with_rar(
    client: TiDBOperaClient,
    circuit_id: int
) -> Dict[str, Any]:
    """
    Get circuit standings enhanced with RAR (Risk-Adjusted Rating) scores.
    Combines OPERA standings with SATOR analytics.
    """
    # Get standings from OPERA
    # (Would need additional method in TiDBOperaClient)
    standings = await get_circuit_standings(circuit_id)
    
    # Enrich with RAR scores from Component B
    for standing in standings:
        team_id = standing["team_id"]
        rar_data = await get_team_rar_scores(team_id)
        standing["rar_score"] = rar_data.get("score")
        standing["investment_grade"] = rar_data.get("grade")
    
    # Sort by points, then by RAR
    standings.sort(
        key=lambda x: (x["points"], x.get("rar_score", 0)),
        reverse=True
    )
    
    return {
        "circuit": client.get_circuit(circuit_id),
        "standings": standings
    }
```

---

## Error Handling

### Exception Types

```python
from mysql.connector import Error as MySQLError

# Connection errors
try:
    client = TiDBOperaClient(host="invalid-host")
except MySQLError as e:
    print(f"Connection failed: {e}")

# Query errors
try:
    tournament = client.get_tournament(99999)  # Non-existent
except MySQLError as e:
    print(f"Query failed: {e}")

# Validation errors
try:
    client.create_tournament({})  # Missing required 'name'
except ValueError as e:
    print(f"Validation failed: {e}")
```

### Error Codes

| Code | HTTP Status | Description | Recovery |
|------|-------------|-------------|----------|
| CONNECTION_ERROR | 503 | Cannot connect to TiDB | Retry with backoff |
| AUTHENTICATION_ERROR | 401 | Invalid credentials | Check credentials |
| TOURNAMENT_NOT_FOUND | 404 | Tournament ID doesn't exist | Verify ID |
| DUPLICATE_ENTRY | 409 | Unique constraint violation | Use different ID |
| VALIDATION_ERROR | 400 | Missing required fields | Check request |
| RATE_LIMITED | 429 | Too many requests | Slow down |

### Retry Strategy

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def fetch_with_retry(client, tournament_id):
    return client.get_tournament(tournament_id)
```

### Best Practices

```python
# 1. Always handle None returns
tournament = client.get_tournament(id)
if tournament is None:
    # Handle not found
    return {"error": "Tournament not found"}

# 2. Use context managers
with TiDBOperaClient(...) as client:
    # Operations here
    pass  # Auto-cleanup

# 3. Validate inputs before API calls
if not tournament_data.get("name"):
    raise ValueError("Tournament name is required")

# 4. Log errors with context
import logging
logger = logging.getLogger(__name__)

try:
    result = client.create_tournament(data)
except Exception as e:
    logger.error(f"Failed to create tournament: {e}", extra={
        "tournament_data": data
    })
    raise
```

---

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Read (GET) | 1000 | per minute |
| Write (POST/PUT) | 100 | per minute |
| Bulk operations | 10 | per minute |
| Health check | Unlimited | - |

### Headers

Responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1710470400
```

### Handling Rate Limits

```python
import time
from typing import Callable

def rate_limited_call(
    func: Callable,
    *args,
    max_retries: int = 3,
    **kwargs
):
    """Execute function with rate limit handling."""
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except RateLimitError as e:
            if attempt < max_retries - 1:
                # Wait for reset
                reset_time = int(e.headers.get("X-RateLimit-Reset", 60))
                wait_time = max(reset_time - time.time(), 1)
                time.sleep(wait_time)
            else:
                raise
```

### Bulk Operations

For bulk operations, use batch endpoints:

```python
# Instead of multiple create calls:
for tournament in tournaments:
    client.create_tournament(tournament)  # Rate limited!

# Use batch endpoint (if available):
client.create_tournaments_batch(tournaments)  # Single request
```

---

## Webhooks

### Subscribing to Events

```python
# Register webhook
client.register_webhook(
    url="https://your-app.com/webhooks/opera",
    events=[
        "tournament.created",
        "tournament.updated",
        "match.status_changed",
        "schedule.created"
    ],
    secret="your_webhook_secret"
)
```

### Webhook Payload

```json
{
  "event": "match.status_changed",
  "timestamp": "2026-03-15T04:50:54Z",
  "data": {
    "match_id": "vct-2026-masters-sf-001",
    "previous_status": "scheduled",
    "current_status": "live",
    "tournament_id": 12345,
    "changed_at": "2026-03-15T04:50:54Z"
  }
}
```

### Verification

```python
import hmac
import hashlib

def verify_webhook(payload: str, signature: str, secret: str) -> bool:
    """Verify webhook signature."""
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## SDK Reference

### Python

```bash
pip install sator-opera-client
```

```python
from sator_opera import OperaClient

client = OperaClient(api_key="your_key")
tournaments = client.tournaments.list(status="ongoing")
```

### JavaScript/TypeScript

```bash
npm install @sator/opera-client
```

```typescript
import { OperaClient } from '@sator/opera-client';

const client = new OperaClient({ apiKey: 'your_key' });
const tournaments = await client.tournaments.list({ status: 'ongoing' });
```

### cURL Examples

```bash
# List tournaments
curl -X GET \
  https://opera.sator.io/api/v1/tournaments \
  -H "X-API-Key: your_api_key" \
  -H "Accept: application/json"

# Create tournament
curl -X POST \
  https://opera.sator.io/api/v1/tournaments \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VCT 2026 Masters",
    "tier": "Masters",
    "game": "Valorant",
    "region": "International"
  }'

# Update match status
curl -X PATCH \
  https://opera.sator.io/api/v1/matches/vct-2026-masters-sf-001 \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "team_a_score": 2,
    "team_b_score": 1
  }'
```

---

## Changelog

### v1.0.0 (2026-03-15)
- Initial API release
- Tournament management endpoints
- Schedule operations
- Patch tracking
- Team and roster management

---

*Document Version: [Ver001.000]*
*API Version: v1.0.0*
*Last Updated: 2026-03-15*
*Maintainer: SATOR API Team*
