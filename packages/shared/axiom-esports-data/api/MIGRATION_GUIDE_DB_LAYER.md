[Ver001.000]

# Database Layer Migration Guide
## Switching from Stubs to Implemented Queries

---

## Overview

This guide explains how to migrate from the stub `db.py` to the fully implemented `db_implemented.py`.

### Files Involved

| File | Status | Purpose |
|------|--------|---------|
| `src/db.py` | ❌ Stub | Original stub file (returns None) |
| `src/db_implemented.py` | ✅ Complete | New implemented file |
| `src/routes/*.py` | ⚠️ Needs update | Import from new module |

---

## Migration Steps

### Step 1: Backup Original (Optional but Recommended)

```bash
cd packages/shared/axiom-esports-data/api
cp src/db.py src/db.py.backup
```

### Step 2: Replace the Module

**Option A: Rename (Safest)**
```bash
mv src/db.py src/db_original.py
mv src/db_implemented.py src/db.py
```

**Option B: Update Imports (More work)**
```python
# In all route files, change:
from api.src.db import get_player_record

# To:
from api.src.db_implemented import get_player_record
```

### Step 3: Update Route Files

The implemented functions have the same signatures, so route files should work without changes. However, update these files to handle the new return values:

**File: `src/routes/players.py`**

```python
# BEFORE (handled None):
@router.get("/{player_id}", response_model=PlayerSchema)
async def get_player(player_id: UUID) -> PlayerSchema:
    record = await get_player_record(str(player_id))
    if record is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return PlayerSchema(**record)

# AFTER (same code works, but now gets real data):
@router.get("/{player_id}", response_model=PlayerSchema)
async def get_player(player_id: UUID) -> PlayerSchema:
    record = await get_player_record(str(player_id))
    if record is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return PlayerSchema(**record)
```

### Step 4: Add New Endpoints (Optional)

The implemented module adds new functions. Add routes for them:

**File: `src/routes/players.py`** (add these endpoints)

```python
@router.get("/{player_id}/stats", response_model=PlayerStatsResponse)
async def get_player_stats(player_id: UUID):
    """Get aggregated career stats for a player."""
    stats = await get_player_stats_aggregated(str(player_id))
    if stats is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return PlayerStatsResponse(**stats)


@router.get("/leaderboard/{metric}")
async def get_leaderboard_endpoint(
    metric: str = Path(..., regex="^(sim_rating|acs|rar_score|kast_pct|adr)$"),
    limit: int = Query(default=10, le=100)
):
    """Get top players by metric."""
    leaderboard = await get_leaderboard(metric, limit)
    return {"metric": metric, "players": leaderboard}
```

**File: `src/routes/matches.py`** (update or create)

```python
from fastapi import APIRouter, HTTPException
from api.src.db_implemented import get_match_record, get_recent_matches

router = APIRouter(prefix="/api/matches", tags=["matches"])

@router.get("/{match_id}")
async def get_match(match_id: str):
    """Get match details with all player performances."""
    match = await get_match_record(match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.get("/")
async def list_matches(
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0)
):
    """Get list of recent matches."""
    matches, total = await get_recent_matches(limit, offset)
    return {
        "matches": matches,
        "total": total,
        "limit": limit,
        "offset": offset
    }
```

**File: `src/routes/analytics.py`** (update)

```python
from api.src.db_implemented import get_regional_stats, get_leaderboard

@router.get("/regional")
async def regional_stats():
    """Get aggregated stats by region."""
    stats = await get_regional_stats()
    return {"regions": stats}
```

**File: `src/routes/collection.py`** (update)

```python
from api.src.db_implemented import get_collection_status

@router.get("/status")
async def collection_status():
    """Get data collection pipeline status."""
    return await get_collection_status()
```

---

## Testing the Migration

### 1. Start the Database

```bash
cd packages/shared/axiom-esports-data/infrastructure
docker-compose up -d
```

### 2. Verify Database Connection

```bash
cd packages/shared/axiom-esports-data/api
python -c "
import asyncio
from src.db_manager import db
from src.db_implemented import health_check

async def test():
    await db.connect()
    health = await health_check()
    print(health)
    await db.close()

asyncio.run(test())
"
```

**Expected output:**
```python
{
    "status": "healthy",
    "database": "connected",
    "version": "PostgreSQL 15.2 ...",
    "table_exists": True,
    "pool_size": 5,
    "free_connections": 4
}
```

### 3. Test Player Endpoint

```bash
# Start the API
uvicorn main:app --reload --port 8000

# Test in another terminal
curl http://localhost:8000/api/players/

# Expected: List of players (may be empty if no data)
{"players": [], "total": 0, "offset": 0, "limit": 50}
```

### 4. Test with Mock Data

If database is empty, insert test data:

```sql
-- Connect to database
psql $DATABASE_URL

-- Insert test player
INSERT INTO player_performance (
    player_id, name, team, region, role,
    kills, deaths, acs, adr, kast_pct,
    match_id, map_name, realworld_time
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'TestPlayer',
    'TestTeam',
    'Americas',
    'Entry',
    20, 15, 250.5, 150.2, 75.0,
    'match-001',
    'Ascent',
    NOW()
);
```

Then test:
```bash
curl http://localhost:8000/api/players/550e8400-e29b-41d4-a716-446655440000
```

---

## Rollback Plan

If issues occur:

```bash
# Restore original
cd packages/shared/axiom-esports-data/api
mv src/db.py src/db_implemented.py  # Save implemented version
mv src/db.py.backup src/db.py        # Restore stubs

# Restart API
pkill -f uvicorn
uvicorn main:app --reload
```

---

## Troubleshooting

### Issue: "Database pool not initialized"

**Cause:** `DATABASE_URL` not set or `db.connect()` not called

**Fix:**
```bash
export DATABASE_URL=postgresql://axiom:changeme@localhost:5432/axiom_esports
```

### Issue: "Relation 'player_performance' does not exist"

**Cause:** Migrations not run

**Fix:**
```bash
cd packages/shared/axiom-esports-data/infrastructure
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### Issue: "Connection refused"

**Cause:** PostgreSQL not running

**Fix:**
```bash
docker-compose up -d postgres
```

### Issue: Slow queries

**Cause:** Missing indexes or large dataset

**Check:**
```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'player_performance';

-- Should show:
-- idx_player_performance_player
-- idx_player_performance_match
-- etc.
```

---

## Performance Considerations

### Connection Pool Settings

Current settings in `db_manager.py`:
- `min_size: 1` — Conservative for free tier
- `max_size: 5` — Limit concurrent connections

For production with higher load:
```python
await db.connect(
    min_size=5,
    max_size=20
)
```

### Query Optimization

The implemented queries use:
- ✅ Parameterized queries (prevents SQL injection)
- ✅ Connection pooling (reuses connections)
- ✅ Proper indexing (leverages existing indexes)
- ✅ Pagination (LIMIT/OFFSET)

Monitor slow queries:
```sql
-- Find slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

## Next Steps After Migration

1. **Add Caching Layer**
   ```python
   from api.src.cache import cached
   
   @cached(ttl=300)  # Cache for 5 minutes
   async def get_player_record(player_id: str):
       # ... existing code
   ```

2. **Add Rate Limiting**
   ```python
   from slowapi import Limiter
   
   @router.get("/{player_id}")
   @limiter.limit("100/minute")
   async def get_player(...):
       # ... existing code
   ```

3. **Add API Documentation**
   ```python
   @router.get(
       "/{player_id}",
       response_model=PlayerSchema,
       summary="Get player by ID",
       description="Fetch a single player's most recent performance record"
   )
   ```

---

*End of Migration Guide*
