[Ver001.000]

# TRINITY + OPERA Verification Guide

**SATOR eSports Analytics Platform — 5-Day Verification Protocol**

---

## Executive Summary

This guide provides a comprehensive, day-by-day verification protocol for the TRINITY + OPERA database architecture. Following this guide ensures all four components (SQLite Task Queue, PostgreSQL Primary, Turso Edge, TiDB OPERA) are properly configured and operational before production deployment.

**Estimated Time:** 5 days (2-4 hours per day)  
**Difficulty:** Intermediate  
**Prerequisites:** Database administration knowledge, shell scripting basics

---

## Table of Contents

1. [Day 1: Database Verification Checklist](#day-1-database-verification-checklist)
2. [Day 2: Backend Service Verification](#day-2-backend-service-verification)
3. [Day 3: Frontend Hub Verification](#day-3-frontend-hub-verification)
4. [Day 4: Integration Testing](#day-4-integration-testing)
5. [Day 5: Performance Benchmarking](#day-5-performance-benchmarking)
6. [Quick Reference](#quick-reference)
7. [Troubleshooting](#troubleshooting)

---

## Day 1: Database Verification Checklist

**Goal:** Verify all four database components are accessible and properly configured.

### Prerequisites

```bash
# Required tools
sqlite3 --version          # Should be 3.30+
psql --version             # PostgreSQL client 14+
mysql --version            # MySQL client 8.0+
turso --version            # Turso CLI (optional but recommended)

# Environment setup
cp .env.example .env
# Edit .env with your database credentials
```

### Component A: SQLite Task Queue Verification

| Step | Task | Command | Expected Result |
|------|------|---------|-----------------|
| 1.1 | Check SQLite installation | `sqlite3 --version` | Version 3.30+ displayed |
| 1.2 | Verify database file exists | `ls -la /var/lib/sator/queue.db` | File exists with proper permissions |
| 1.3 | List tables | `sqlite3 /var/lib/sator/queue.db ".tables"` | `task_queue` and `harvest_tasks` shown |
| 1.4 | Check schema | `sqlite3 /var/lib/sator/queue.db ".schema task_queue"` | Complete schema displayed |
| 1.5 | Test WAL mode | `sqlite3 /var/lib/sator/queue.db "PRAGMA journal_mode;"` | Returns `wal` |
| 1.6 | Verify queue stats | `sqlite3 /var/lib/sator/queue.db "SELECT COUNT(*) FROM task_queue;"` | Returns count (may be 0) |

**Verification Script:**
```bash
#!/bin/bash
echo "=== Component A: SQLite Verification ==="
sqlite3 /var/lib/sator/queue.db << EOF
SELECT 
    COUNT(*) as total_tasks,
    SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status='processing' THEN 1 ELSE 0 END) as processing,
    SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
FROM task_queue;
EOF
```

### Component B: PostgreSQL Primary Verification

| Step | Task | Command | Expected Result |
|------|------|---------|-----------------|
| 2.1 | Check psql installation | `psql --version` | Version 14+ displayed |
| 2.2 | Test connection | `psql $DATABASE_URL -c "SELECT version();"` | PostgreSQL version returned |
| 2.3 | Verify tables | `psql $DATABASE_URL -c "\dt"` | Tables listed |
| 2.4 | Check player_performance | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM player_performance;"` | Returns record count |
| 2.5 | Check player_stats | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM player_stats;"` | Returns record count |
| 2.6 | Verify materialized views | `psql $DATABASE_URL -c "\dm"` | mv_daily_player_stats listed |
| 2.7 | Test materialized view | `psql $DATABASE_URL -c "SELECT * FROM mv_daily_player_stats LIMIT 1;"` | Returns sample data |
| 2.8 | Check migration status | `psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 1;"` | Latest migration shown |

**Verification Script:**
```bash
#!/bin/bash
echo "=== Component B: PostgreSQL Verification ==="
psql $DATABASE_URL << EOF
SELECT 
    'player_performance' as table_name, COUNT(*) as count FROM player_performance
UNION ALL
SELECT 
    'player_stats' as table_name, COUNT(*) as count FROM player_stats
UNION ALL
SELECT 
    'mv_daily_player_stats' as table_name, COUNT(*) as count FROM mv_daily_player_stats;
EOF
```

### Component C: Turso Edge Verification

| Step | Task | Command | Expected Result |
|------|------|---------|-----------------|
| 3.1 | Check Turso CLI | `turso --version` | CLI version displayed |
| 3.2 | List databases | `turso db list` | Your database shown |
| 3.3 | Verify connection | `turso db shell <db-name> "SELECT 1;"` | Returns `1` |
| 3.4 | Check edge table | `turso db shell <db-name> "SELECT COUNT(*) FROM player_performance_edge;"` | Returns count |
| 3.5 | Verify sync checkpoint | `turso db shell <db-name> "SELECT * FROM sync_checkpoint ORDER BY synced_at DESC LIMIT 1;"` | Latest checkpoint shown |
| 3.6 | Check database URL | `echo $TURSO_DATABASE_URL` | URL configured |
| 3.7 | Check auth token | `echo $TURSO_AUTH_TOKEN \| head -c 20` | Token configured (partial shown) |

**Verification Script:**
```bash
#!/bin/bash
echo "=== Component C: Turso Verification ==="
DB_NAME=$(echo $TURSO_DATABASE_URL | sed -E 's/.*\/([a-zA-Z0-9_-]+)(\?.*)?$/\1/')

turso db shell $DB_NAME << EOF
SELECT 
    (SELECT COUNT(*) FROM player_performance_edge) as edge_records,
    (SELECT MAX(synced_at) FROM sync_checkpoint) as last_sync;
EOF
```

### Component D: TiDB OPERA Verification

| Step | Task | Command | Expected Result |
|------|------|---------|-----------------|
| 4.1 | Check MySQL client | `mysql --version` | Version 8.0+ displayed |
| 4.2 | Test connection | `mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -e "SELECT VERSION();"` | TiDB version returned |
| 4.3 | List OPERA tables | `mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -e "SHOW TABLES IN opera;"` | 8 tables listed |
| 4.4 | Check tournaments | `mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -e "SELECT COUNT(*) FROM opera.opera_tournaments;"` | Returns count |
| 4.5 | Check schedules | `mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -e "SELECT COUNT(*) FROM opera.opera_schedules;"` | Returns count |
| 4.6 | Verify cross-references | `mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -e "SELECT sator_cross_ref FROM opera.opera_tournaments LIMIT 1;"` | Cross-ref field shown |

**Required OPERA Tables:**
1. `opera_tournaments`
2. `opera_schedules`
3. `opera_patches`
4. `opera_teams`
5. `opera_team_rosters`
6. `opera_circuits`
7. `opera_circuit_standings`
8. `opera_sync_log`

**Verification Script:**
```bash
#!/bin/bash
echo "=== Component D: TiDB OPERA Verification ==="
mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -p$TIDB_PASSWORD << EOF
USE opera;
SELECT 
    'opera_tournaments' as table_name, COUNT(*) as count FROM opera_tournaments
UNION ALL SELECT 'opera_schedules', COUNT(*) FROM opera_schedules
UNION ALL SELECT 'opera_teams', COUNT(*) FROM opera_teams
UNION ALL SELECT 'opera_circuits', COUNT(*) FROM opera_circuits;
EOF
```

### Day 1 Checklist Summary

- [ ] Component A: SQLite
  - [ ] queue.db exists at /var/lib/sator/queue.db
  - [ ] harvest_tasks table exists
  - [ ] Can enqueue/dequeue tasks
  - [ ] WAL mode enabled

- [ ] Component B: PostgreSQL
  - [ ] Connection successful
  - [ ] Migration 010 applied
  - [ ] mv_daily_player_stats returns data
  - [ ] mv_weekly_team_rankings returns data

- [ ] Component C: Turso
  - [ ] Database URL configured
  - [ ] Auth token valid
  - [ ] player_performance_edge table exists
  - [ ] Sync checkpoint updating

- [ ] Component D: TiDB
  - [ ] Connection successful
  - [ ] All 8 OPERA tables exist
  - [ ] Can query tournaments
  - [ ] Can query schedules

---

## Day 2: Backend Service Verification

**Goal:** Verify FastAPI backend services are running and properly connected to databases.

### API Health Checks

| Step | Task | Endpoint | Expected Result |
|------|------|----------|-----------------|
| 2.1 | API health | `GET /health` | `{"status": "healthy"}` |
| 2.2 | Ready check | `GET /ready` | `{"ready": true}` |
| 2.3 | Queue health | `GET /health/queue` | Queue status returned |
| 2.4 | PostgreSQL health | `GET /health/postgres` | DB status returned |
| 2.5 | Turso health | `GET /health/turso` | Sync status returned |
| 2.6 | OPERA health | `GET /health/opera` | TiDB status returned |

### Service Verification Commands

```bash
# Start the API server
cd packages/shared
uvicorn axiom-esports-data.api.main:app --reload --port 8000

# In another terminal, test endpoints
curl -s http://localhost:8000/health | jq
curl -s http://localhost:8000/ready | jq
curl -s http://localhost:8000/health/queue | jq
curl -s http://localhost:8000/health/postgres | jq
curl -s http://localhost:8000/health/turso | jq
curl -s http://localhost:8000/health/opera | jq
```

### Worker Verification

| Step | Task | Command | Expected Result |
|------|------|---------|-----------------|
| 2.7 | Start worker | `python -m axiom-esports-data.scheduler.harvest_orchestrator` | Worker starts |
| 2.8 | Check worker status | `curl -s http://localhost:8000/health/queue` | Worker count shown |
| 2.9 | Test task enqueue | Create test task via API | Task enqueued |
| 2.10 | Verify task processing | Check task_queue table | Task status changed |

### Backend Environment Variables

```bash
# Required for Day 2
export DATABASE_URL="postgresql://user:pass@localhost/sator"
export REDIS_URL="redis://localhost:6379"
export TURSO_DATABASE_URL="libsql://..."
export TURSO_AUTH_TOKEN="..."
export TIDB_HOST="..."
export TIDB_PORT="4000"
export TIDB_USER="..."
export TIDB_PASSWORD="..."
export TIDB_DATABASE="opera"
```

### Day 2 Checklist Summary

- [ ] API server starts without errors
- [ ] Health endpoints return 200
- [ ] All database health checks pass
- [ ] Workers can connect to SQLite queue
- [ ] Tasks can be enqueued and processed
- [ ] Logs show no connection errors

---

## Day 3: Frontend Hub Verification

**Goal:** Verify all 5 frontend hubs (SATOR, ROTAS, AREPO, OPERA, TENET) load data correctly.

### Environment Setup

```bash
cd apps/website-v2

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Server should start on http://localhost:5173
```

### Hub Testing Matrix

| Hub | Test | URL/Action | Expected Result |
|-----|------|------------|-----------------|
| SATOR | Load players | Navigate to /sator | Player list displayed |
| SATOR | Load analytics | Click analytics tab | SimRating data shown |
| SATOR | Load RAR | View RAR section | RAR scores displayed |
| ROTAS | Load matches | Navigate to /rotas | Match list displayed |
| ROTAS | Load predictions | View predictions | Match predictions shown |
| ROTAS | Investment grades | View grades | A-F grades displayed |
| AREPO | Global search | Search for player | Search results shown |
| AREPO | Cross-reference | View cross-refs | Related data linked |
| OPERA | Load tournaments | Navigate to /opera | Tournament list displayed |
| OPERA | Load schedules | View schedules | Match schedules shown |
| OPERA | Team data | View teams | Team information displayed |
| TENET | Edge cache | Monitor network tab | <100ms response times |

### Automated Hub Tests

```bash
# Run the hub connections test
node scripts/test-hub-connections.js --verbose

# Run Playwright E2E tests
cd apps/website-v2
npx playwright test
```

### API Endpoints by Hub

```bash
# SATOR endpoints
curl -s "http://localhost:8000/v1/players?limit=5" | jq
curl -s "http://localhost:8000/v1/analytics/ratings" | jq
curl -s "http://localhost:8000/v1/analytics/rar" | jq

# ROTAS endpoints
curl -s "http://localhost:8000/v1/matches?limit=5" | jq
curl -s "http://localhost:8000/v1/analytics/match-predictions" | jq

# AREPO endpoints
curl -s "http://localhost:8000/v1/search?q=sentinels" | jq

# OPERA endpoints
curl -s "http://localhost:8000/v1/opera/tournaments" | jq
curl -s "http://localhost:8000/v1/opera/schedules" | jq

# TENET endpoints
curl -s "http://localhost:8000/v1/edge/health" | jq
```

### Day 3 Checklist Summary

- [ ] SATOR loads player data
- [ ] SATOR loads analytics (SimRating)
- [ ] SATOR loads RAR scores
- [ ] ROTAS loads matches
- [ ] ROTAS loads predictions
- [ ] ROTAS loads investment grades
- [ ] AREPO cross-references work
- [ ] AREPO search works
- [ ] OPERA loads tournaments
- [ ] OPERA loads schedules
- [ ] TENET edge cache responds
- [ ] All hubs load in <1000ms

---

## Day 4: Integration Testing

**Goal:** Verify end-to-end data flow through all components.

### Integration Test Scenarios

#### Scenario 1: Player Data Flow
```
VLR.gg → Component A → Component B → Component C → Frontend
```

| Step | Action | Verification |
|------|--------|--------------|
| 4.1 | Enqueue player scrape task | Task appears in SQLite queue |
| 4.2 | Worker processes task | Task status changes to completed |
| 4.3 | Data stored in PostgreSQL | Player data in player_performance table |
| 4.4 | Data synced to Turso | Record in player_performance_edge |
| 4.5 | Frontend displays data | Player visible in SATOR hub |

#### Scenario 2: Tournament Schedule Flow
```
Pandascore API → Component A → Component D → Frontend
```

| Step | Action | Verification |
|------|--------|--------------|
| 4.6 | Enqueue tournament sync | Task queued |
| 4.7 | Worker processes | Tournament in TiDB opera_tournaments |
| 4.8 | Frontend displays | Tournament in OPERA hub |

#### Scenario 3: Cross-Reference Flow
```
Component B ←→ Component D → Frontend
```

| Step | Action | Verification |
|------|--------|--------------|
| 4.9 | Query player stats | PostgreSQL returns data |
| 4.10 | Cross-reference tournament | TiDB link resolved |
| 4.11 | Display combined | AREPO shows unified view |

### Integration Test Script

```bash
#!/bin/bash
# integration-test.sh

echo "=== Integration Test Suite ==="

# Test 1: Player data end-to-end
echo "Test 1: Player data flow..."
PLAYER_ID=$(curl -s "http://localhost:8000/v1/players?limit=1" | jq -r '.[0].id')
if [ "$PLAYER_ID" != "null" ]; then
    echo "✓ Player data retrieved from API"
else
    echo "✗ Player data not available"
fi

# Test 2: Tournament data
echo "Test 2: Tournament data flow..."
TOURNAMENT_COUNT=$(curl -s "http://localhost:8000/v1/opera/tournaments" | jq 'length')
if [ "$TOURNAMENT_COUNT" -gt 0 ]; then
    echo "✓ Tournament data available ($TOURNAMENT_COUNT tournaments)"
else
    echo "✗ No tournament data"
fi

# Test 3: Search functionality
echo "Test 3: Search integration..."
SEARCH_RESULT=$(curl -s "http://localhost:8000/v1/search?q=test" | jq 'length')
if [ "$SEARCH_RESULT" -ge 0 ]; then
    echo "✓ Search endpoint responding"
else
    echo "✗ Search failed"
fi

echo "=== Integration Tests Complete ==="
```

### Data Consistency Checks

```sql
-- Compare PostgreSQL and Turso counts
-- PostgreSQL
SELECT COUNT(*) FROM player_performance WHERE realworld_time > NOW() - INTERVAL '1 day';

-- Turso (run via turso CLI)
SELECT COUNT(*) FROM player_performance_edge WHERE date(realworld_time) > date('now', '-1 day');
```

### Day 4 Checklist Summary

- [ ] Player data flows from ingestion to frontend
- [ ] Tournament data flows from API to frontend
- [ ] Cross-references resolve correctly
- [ ] Data consistency between PostgreSQL and Turso
- [ ] Sync lag < 5 minutes
- [ ] No orphaned records
- [ ] Error rates < 0.1%

---

## Day 5: Performance Benchmarking

**Goal:** Establish baseline performance metrics and verify SLA compliance.

### Benchmark Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time (p50) | <100ms | >500ms |
| API Response Time (p95) | <300ms | >1000ms |
| Database Query Time | <50ms | >200ms |
| Turso Edge Latency | <100ms (global) | >500ms |
| Sync Lag (Turso) | <5 minutes | >15 minutes |
| Task Processing Rate | 1000/min | <100/min |
| Frontend Load Time | <2s | >5s |

### Performance Test Commands

#### API Latency Test
```bash
#!/bin/bash
# benchmark-api.sh

ENDPOINT="http://localhost:8000/v1/players?limit=10"
ITERATIONS=100

echo "Benchmarking $ENDPOINT ($ITERATIONS requests)..."

for i in $(seq 1 $ITERATIONS); do
    curl -s -o /dev/null -w "%{time_total}\n" $ENDPOINT
done | awk '
    {sum+=$1; sumsq+=$1*$1} 
    NR==1 {min=max=$1}
    {if($1<min) min=$1; if($1>max) max=$1}
    END {
        printf "Min: %.3fs\n", min
        printf "Max: %.3fs\n", max
        printf "Avg: %.3fs\n", sum/NR
        printf "P95: %.3fs\n", (sumsq/NR - (sum/NR)**2)**0.5 * 1.645 + sum/NR
    }
'
```

#### Database Query Performance
```sql
-- PostgreSQL query timing
\timing on
SELECT * FROM mv_daily_player_stats LIMIT 100;
SELECT * FROM player_performance WHERE player_id = '...';
\timing off

-- Turso query timing (libSQL)
.timer on
SELECT * FROM player_performance_edge LIMIT 100;
.timer off
```

#### Load Testing with Locust

```python
# locustfile.py
from locust import HttpUser, task, between

class SATORUser(HttpUser):
    wait_time = between(1, 5)
    
    @task(3)
    def get_players(self):
        self.client.get("/v1/players?limit=20")
    
    @task(2)
    def get_analytics(self):
        self.client.get("/v1/analytics/ratings")
    
    @task(1)
    def get_tournaments(self):
        self.client.get("/v1/opera/tournaments")
```

Run load test:
```bash
locust -f locustfile.py --host=http://localhost:8000
```

### Performance Monitoring Dashboard

Set up monitoring queries:

```sql
-- PostgreSQL performance stats
SELECT 
    schemaname,
    tablename,
    seq_scan,
    idx_scan,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Connection stats
SELECT 
    state,
    COUNT(*)
FROM pg_stat_activity
GROUP BY state;
```

### Day 5 Checklist Summary

- [ ] API p50 latency < 100ms
- [ ] API p95 latency < 300ms
- [ ] Database queries < 50ms
- [ ] Turso global latency < 100ms
- [ ] Sync lag consistently < 5 minutes
- [ ] Task processing rate ≥ 1000/min
- [ ] Frontend loads in < 2 seconds
- [ ] Load testing passes at expected scale

---

## Quick Reference

### One-Line Verification Commands

```bash
# Verify all components
./scripts/verify-trinity.sh --verbose

# Verify specific component
./scripts/verify-trinity.sh --component b  # PostgreSQL only

# Test hub connections
node scripts/test-hub-connections.js --env prod

# Run health checks
./scripts/health-check-all.sh
```

### Common Environment Variables

```bash
# SQLite
export SQLITE_DB_PATH="/var/lib/sator/queue.db"

# PostgreSQL
export DATABASE_URL="postgresql://user:pass@localhost:5432/sator"

# Turso
export TURSO_DATABASE_URL="libsql://your-db.turso.io"
export TURSO_AUTH_TOKEN="your-token"

# TiDB
export TIDB_HOST="your-gateway.tidbcloud.com"
export TIDB_PORT="4000"
export TIDB_USER="your-user"
export TIDB_PASSWORD="your-password"
export TIDB_DATABASE="opera"
```

### Troubleshooting Commands

```bash
# Check SQLite locks
lsof /var/lib/sator/queue.db

# Check PostgreSQL connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Check Turso sync status
turso db replicate-status <db-name>

# Check TiDB connection
mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -e "SHOW STATUS;"
```

---

## Troubleshooting

### Component A (SQLite) Issues

**Problem:** Database is locked
```bash
# Solution: Check for hanging connections
lsof /var/lib/sator/queue.db

# Force WAL checkpoint
sqlite3 /var/lib/sator/queue.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

**Problem:** Table doesn't exist
```bash
# Solution: Initialize schema
sqlite3 /var/lib/sator/queue.db < packages/shared/api/src/scheduler/schema.sql
```

### Component B (PostgreSQL) Issues

**Problem:** Connection refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection details
echo $DATABASE_URL
```

**Problem:** Materialized view not refreshing
```bash
# Manual refresh
psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW mv_daily_player_stats;"
```

### Component C (Turso) Issues

**Problem:** Authentication failed
```bash
# Verify token
turso auth token

# Re-authenticate
turso auth login
```

**Problem:** Sync lag too high
```bash
# Check sync status
turso db shell <db-name> "SELECT * FROM sync_checkpoint ORDER BY synced_at DESC LIMIT 5;"
```

### Component D (TiDB) Issues

**Problem:** Connection timeout
```bash
# Verify network connectivity
nc -zv $TIDB_HOST $TIDB_PORT

# Check TiDB status
mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -e "SHOW STATUS LIKE 'tidb_server_%';"
```

### Hub Connection Issues

**Problem:** Frontend can't connect to API
```bash
# Check CORS settings
curl -s -D - "http://localhost:8000/v1/health" | grep -i access-control

# Verify API is running
curl -s http://localhost:8000/health
```

---

## Document Information

- **Version:** [Ver001.000]
- **Last Updated:** 2026-03-15
- **Author:** SATOR Architecture Team
- **Review Cycle:** Quarterly

### Related Documents

- `docs/TRINITY_OPERA_ARCHITECTURE.md` — Architecture overview
- `docs/TRINITY_OPERA_API.md` — API documentation
- `scripts/verify-trinity.sh` — Verification script
- `scripts/health-check-all.sh` — Health monitoring script
- `scripts/test-hub-connections.js` — Frontend hub tests
