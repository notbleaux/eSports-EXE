---
name: sator-end-to-end
description: "Full-stack 4NJZ4 TENET Platform development across all components. USE FOR: cross-component features, API contracts, data flow integration, end-to-end testing, feature coordination. DO NOT USE FOR: single-component work, non-SATOR projects."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# SATOR End-to-End

> **CROSS-COMPONENT COORDINATION**
>
> This skill coordinates changes across all 4NJZ4 TENET Platform components.
> Use when a feature touches multiple parts of the stack.
> Always maintain data partition firewall boundaries.

## Triggers

Activate this skill when user wants to:
- Build features spanning multiple components
- Define API contracts between game/web
- Coordinate data flow across the stack
- Implement end-to-end user workflows
- Add new statistics that cross boundaries
- Validate full-stack integration

## Rules

1. **Firewall First** — Never bypass data partition firewall
2. **API Contracts** — Define interfaces before implementation
3. **Sequential Validation** — Test components in order
4. **No Direct Game→Web** — All data flows through extraction→API
5. **Feature Flags** — Use for gradual rollouts
6. **E2E Tests** — Required for critical paths

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| Cross-component features | Single-component changes |
| API contract definition | Internal refactoring |
| Data flow integration | UI-only changes |
| End-to-end testing | Unit testing |
| Full-stack coordination | Code review |
| New stat field pipeline | Documentation only |

## Component Dependencies

```
Game (Godot)
    ↓ LiveSeasonModule.gd (firewall enforcement)
Extraction (Python)
    ↓ epoch_harvester.py
Database (PostgreSQL)
    ↓ asyncpg
API (FastAPI)
    ↓ firewall_middleware.py (firewall enforcement)
Web (React)
    ↓ FantasyDataFilter (firewall enforcement)
User
```

## Full-Stack Feature Workflow

### Step 1: Define API Contract

```yaml
# api-contract.yaml
feature: player_comparison
version: "1.0.0"

endpoints:
  GET /v1/players/compare:
    query:
      player_ids: string[]  # Max 5
      metric: string        # simrating, rar, kcr
      timeframe: string     # 30d, 90d, 1y
    response:
      players:
        - player_id: string
          name: string
          stats: PlayerStats
          comparison_rank: number
    errors:
      400: Invalid player_ids
      404: Player not found
      429: Rate limit exceeded

schemas:
  PlayerStats:
    sim_rating: number
    rar: number
    # NO game-only fields
```

### Step 2: Database Schema

```sql
-- Migration: 006_player_comparison.sql
-- Up
CREATE TABLE player_comparisons (
    id SERIAL PRIMARY KEY,
    player_ids TEXT[] NOT NULL,
    metric VARCHAR(50) NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_comparisons_players ON player_comparisons USING GIN(player_ids);

-- Down
DROP TABLE IF EXISTS player_comparisons;
```

### Step 3: Game Export (if needed)

```gdscript
# Add to LiveSeasonModule.gd
func export_comparison_data(match_data: Dictionary) -> Dictionary:
    # Only export fields safe for comparison
    return {
        "player_id": match_data.player_id,
        "kills": match_data.kills,
        "deaths": match_data.deaths,
        "assists": match_data.assists,
        # NO internal_agent_state
        # NO radar_data
    }
```

### Step 4: API Implementation

```python
# packages/shared/api/src/routes/comparison.py
from fastapi import APIRouter, HTTPException, Query
from typing import List

router = APIRouter()

@router.get("/players/compare")
async def compare_players(
    player_ids: List[str] = Query(..., max_length=5),
    metric: str = Query("simrating"),
    timeframe: str = Query("30d")
):
    # Validate input
    if len(player_ids) < 2:
        raise HTTPException(400, "Need at least 2 players")
    
    # Fetch from database
    stats = await fetch_player_stats(player_ids, metric, timeframe)
    
    # Rank and return
    ranked = rank_players(stats, metric)
    
    return {"players": ranked}
```

### Step 5: Frontend Implementation

```tsx
// apps/website-v2/src/hub-1-sator/pages/PlayerComparison.tsx
import { useQuery } from '@tanstack/react-query'

export function PlayerComparison() {
  const { data, isLoading } = useQuery({
    queryKey: ['comparison', playerIds, metric],
    queryFn: async () => {
      const response = await api.get('/v1/players/compare', {
        params: { player_ids: playerIds, metric }
      })
      return response.data
    }
  })
  
  return (
    <div>
      {data?.players.map((player, index) => (
        <PlayerCard 
          key={player.player_id}
          player={player}
          rank={index + 1}
        />
      ))}
    </div>
  )
}
```

### Step 6: End-to-End Test

```python
# tests/e2e/test_player_comparison.py
import pytest

@pytest.mark.e2e
async def test_player_comparison_flow():
    """Test full flow from DB to UI."""
    
    # 1. Seed database
    await seed_test_players()
    
    # 2. Call API
    response = await client.get(
        "/v1/players/compare",
        params={"player_ids": ["p1", "p2", "p3"], "metric": "simrating"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["players"]) == 3
    
    # 3. Verify no game-only fields
    for player in data["players"]:
        assert "internal_agent_state" not in player
        assert "radar_data" not in player
```

## Adding a New Stat Field

### Step 1: Classify the Field

```
Is this field game-internal? 
├─ YES → Add to GAME_ONLY_FIELDS
│        No further action needed for web
│
└─ NO → Public stat
         1. Add to stats-schema
         2. Add to extraction pipeline
         3. Add to API schema
         4. Add to web types
```

### Step 2: Implementation Checklist

- [ ] Classify field (game-only vs public)
- [ ] If public: add to `stats-schema/src/types/`
- [ ] Update extraction bridge mapping
- [ ] Update API Pydantic schema
- [ ] Update web TypeScript types
- [ ] Run `npm run test:firewall`
- [ ] Run `npm run validate:schema`
- [ ] Update documentation

### Step 3: Verification Commands

```bash
# Test firewall
npm run test:firewall

# Validate schemas
npm run validate:schema

# Run E2E tests
pytest tests/e2e/ -v

# Type check all
npm run typecheck
```

## Common Integration Patterns

### Pattern 1: Game → Pipeline → Database

```gdscript
# 1. Game exports match
var export_data = LiveSeasonModule.export_match_data(match)

# 2. Pipeline picks up
await epoch_harvester.process_export(export_data)

# 3. Stored in database
INSERT INTO matches (data) VALUES (export_data)
```

### Pattern 2: Database → API → Web

```python
# 1. API queries database
rows = await conn.fetch("SELECT * FROM matches WHERE ...")

# 2. Sanitizes through firewall
sanitized = [FantasyDataFilter.sanitize(r) for r in rows]

# 3. Returns to web
return {"matches": sanitized}
```

### Pattern 3: Web → API → Database

```typescript
// 1. Web makes request
const response = await api.post('/v1/feedback', feedback)

// 2. API validates
FantasyDataFilter.validateWebInput(data)

// 3. Stores in database
await conn.execute("INSERT INTO feedback ...", data)
```

## Feature Flag System

```typescript
// apps/website-v2/src/config/features.ts
export const FEATURES = {
  PLAYER_COMPARISON: import.meta.env.VITE_FEATURE_PLAYER_COMPARISON === 'true',
  ADVANCED_ANALYTICS: import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS === 'true',
  SATOR_SQUARE_V2: import.meta.env.VITE_FEATURE_SATOR_SQUARE_V2 === 'true',
}

// Usage
import { FEATURES } from '@/config/features'

export function Navigation() {
  return (
    <nav>
      {FEATURES.PLAYER_COMPARISON && (
        <Link to="/compare">Compare</Link>
      )}
    </nav>
  )
}
```

## E2E Testing Strategy

```python
# tests/e2e/conftest.py
import pytest
import asyncio

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_database():
    """Set up test database."""
    # Run migrations
    # Seed test data
    yield
    # Cleanup

@pytest.fixture
async def api_client(test_database):
    """Create test API client."""
    from httpx import AsyncClient
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

## Troubleshooting Integration Issues

### Issue: Data not appearing in web

```bash
# 1. Check extraction
cd packages/shared
python -m axiom-esports-data.extraction.scripts.check_extraction --match-id=xxx

# 2. Check database
psql $DATABASE_URL -c "SELECT * FROM matches WHERE match_id='xxx'"

# 3. Check API response
curl http://localhost:8000/v1/matches/xxx | jq

# 4. Check firewall
curl http://localhost:8000/v1/matches/xxx | grep -i "internal_"
```

### Issue: Type mismatches

```bash
# Regenerate types
npm run generate:types

# Check TypeScript
npm run typecheck

# Check Python
cd packages/shared
mypy axiom-esports-data/
```

## References

- [FIREWALL_POLICY.md](../../../docs/FIREWALL_POLICY.md)
- [API_V1_DOCUMENTATION.md](../../../docs/API_V1_DOCUMENTATION.md)
