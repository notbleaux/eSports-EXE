# ROTAS Disaster Recovery Procedures

**Document ID:** DR-001-ROTAS  
**Version:** 1.0  
**Last Updated:** 2026-03-31  
**Owner:** Operations Team  
**RTO Target:** < 15 minutes  
**RPO Target:** < 1 hour

---

## Table of Contents

1. [Overview](#overview)
2. [Incident Severity Levels](#incident-severity-levels)
3. [Runbook Procedures](#runbook-procedures)
4. [Recovery Procedures](#recovery-procedures)
5. [Communication Protocol](#communication-protocol)
6. [Testing Schedule](#testing-schedule)

---

## Overview

This document provides procedures for responding to and recovering from system failures in the ROTAS (Stats Reference HUB) infrastructure.

### Critical Components

| Component | Impact if Failed | Recovery Priority |
|-----------|------------------|-------------------|
| PostgreSQL Database | Complete data unavailability | P0 - Critical |
| API Service | Read-only, no new data | P1 - High |
| Celery Workers | Ingestion stops | P1 - High |
| Redis Queue | Task queue lost | P2 - Medium |
| Prometheus/Grafana | Monitoring blind | P2 - Medium |

### Backup Strategy

```
Backup Type     Frequency   Retention   Location
─────────────   ─────────   ─────────   ─────────
Full pg_dump    Daily       30 days     S3 (us-east-1)
WAL Archives    Continuous  7 days      S3 (us-east-1)
Cross-region    Daily       30 days     S3 (us-west-2)
```

---

## Incident Severity Levels

### SEV-1: Critical - Service Unavailable

**Criteria:**
- API returning 5xx errors for > 5 minutes
- Database connection failures
- Complete data ingestion stop

**Response:**
- Page on-call engineer immediately
- War room within 15 minutes
- Executive notification within 30 minutes

### SEV-2: High - Degraded Service

**Criteria:**
- API latency > 500ms p95
- Partial ingestion failure (> 5% error rate)
- Single AZ failure

**Response:**
- Ticket created for on-call
- Investigation within 1 hour
- Status page update

### SEV-3: Medium - Minor Impact

**Criteria:**
- Non-critical monitoring alerts
- Delayed data (< 2 hours stale)
- Single component restart needed

**Response:**
- Next business day resolution
- Tracking ticket created

---

## Runbook Procedures

### RB-001: Database Connection Failures

**Symptoms:**
- API logs: `connection refused` to PostgreSQL
- Health check failures on `/health/db`
- Alert: `RotasDatabaseConnectionFailed`

**Diagnosis Steps:**

1. Check database connectivity:
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

2. Check connection pool status:
```sql
SELECT count(*) FROM pg_stat_activity 
WHERE state = 'active';
```

3. Check for locks:
```sql
SELECT * FROM pg_locks 
WHERE NOT granted;
```

**Resolution:**

If connection pool exhausted:
```bash
# Restart API pods to reset connections
kubectl rollout restart deployment/rotas-api
```

If database unresponsive:
```bash
# Trigger failover to replica
aws rds promote-read-replica \
  --db-instance-identifier rotas-db-replica
```

---

### RB-002: Ingestion Pipeline Failure

**Symptoms:**
- Alert: `RotasHighIngestionFailureRate`
- Celery task queue growing
- No new data for > 2 hours

**Diagnosis Steps:**

1. Check Celery worker status:
```bash
celery -A njz_api.rotas.tasks status
```

2. Check dead letter queue:
```bash
redis-cli llen celery-failed
```

3. Review PandaScore API status:
```bash
curl https://api.pandascore.co/status
```

**Resolution:**

If workers down:
```bash
# Scale up workers
kubectl scale deployment rotas-workers --replicas=5
```

If API rate limited:
```bash
# Pause ingestion for 15 minutes
redis-cli set ingestion:pause 1 ex 900
```

---

### RB-003: Data Corruption Detected

**Symptoms:**
- Alert: `RotasDataQualityIssues` spike
- Impossible values in API responses
- User reports of incorrect stats

**Diagnosis Steps:**

1. Identify affected data:
```sql
SELECT game, issue_type, COUNT(*) 
FROM data_quality_log 
WHERE detected_at > NOW() - INTERVAL '1 hour'
GROUP BY game, issue_type;
```

2. Check recent ingestion batches:
```sql
SELECT * FROM data_ingestion_log 
WHERE started_at > NOW() - INTERVAL '6 hours'
ORDER BY started_at DESC;
```

**Resolution:**

If isolated to recent data:
```bash
# Re-run ingestion for affected period
python -m njz_api.rotas.scripts.reingest \
  --game=valorant \
  --date-from=2024-01-15 \
  --date-to=2024-01-16
```

If widespread corruption:
```bash
# Restore from backup
./scripts/restore-from-backup.sh \
  --backup-date=2024-01-15 \
  --verify-only=false
```

---

## Recovery Procedures

### Full Database Restore

**When to Use:**
- Database corruption beyond repair
- Complete data loss
- Point-in-time recovery needed

**Procedure:**

1. Stop all write operations:
```bash
kubectl scale deployment rotas-api --replicas=0
kubectl scale deployment rotas-workers --replicas=0
```

2. Restore from latest backup:
```bash
# List available backups
aws s3 ls s3://rotas-backups/daily/

# Download and restore
pg_restore \
  --host=$DB_HOST \
  --username=$DB_USER \
  --dbname=esports \
  --clean \
  s3://rotas-backups/daily/rotas-20240115.dump
```

3. Verify restore:
```sql
SELECT COUNT(*) FROM teams;
SELECT COUNT(*) FROM matches;
```

4. Resume operations:
```bash
kubectl scale deployment rotas-api --replicas=3
kubectl scale deployment rotas-workers --replicas=5
```

5. Backfill missing data:
```bash
python -m njz_api.rotas.tasks.orchestrate_full_sync \
  --game=valorant
```

**Expected Time:** 30-45 minutes

---

### Point-in-Time Recovery

**When to Use:**
- Specific data deletion identified
- Need to recover to specific moment

**Procedure:**

```bash
# Restore to specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier rotas-db \
  --target-db-instance-identifier rotas-db-recovery \
  --restore-time 2024-01-15T10:00:00Z

# Extract specific data and merge
pg_dump \
  --host=rotas-db-recovery.cluster-xxx.us-east-1.rds.amazonaws.com \
  --table=teams \
  --where="updated_at > '2024-01-15 09:00:00'" \
  | psql $DATABASE_URL
```

---

## Communication Protocol

### Incident Response Flow

```
Detection → Triage (5min) → Response (15min) → Resolution → Post-Mortem
                ↓
        Severity Assignment
                ↓
        Stakeholder Notification
```

### Notification Matrix

| Severity | Engineering | Product | Executive | Public Status |
|----------|-------------|---------|-----------|---------------|
| SEV-1 | Immediate | 15 min | 30 min | Immediate |
| SEV-2 | 15 min | 1 hour | 4 hours | Within 2 hours |
| SEV-3 | 1 hour | 4 hours | Next day | Not required |

### Communication Templates

**SEV-1 Initial Notification:**
```
Subject: [SEV-1] ROTAS Service Disruption

Status: Investigating
Impact: Complete service unavailability
Started: {timestamp}
Next Update: 30 minutes
War Room: {zoom link}
```

**Status Page Update:**
```
ROTAS (Stats Reference HUB) - Major Outage

We are investigating an issue causing complete unavailability 
of the ROTAS API. All teams are engaged in resolution.

Last Updated: {timestamp}
Next Update: {timestamp + 30min}
```

---

## Testing Schedule

### Monthly Drills

**First Monday of each month:**

| Month | Drill Type | Scope |
|-------|-----------|-------|
| January | Tabletop | Database failure scenario |
| February | Live | Failover to read replica |
| March | Live | Full restore from backup |
| April | Tabletop | Data corruption recovery |
| May | Live | Worker pool failure |
| June | Live | Complete region failure |

### Drill Documentation

Each drill must produce:
1. Timeline of events
2. Actual vs. target RTO/RPO
3. Issues encountered
4. Process improvements identified

**Drill Report Template:**
```markdown
# Disaster Recovery Drill - {Date}

## Scenario
{Description}

## Timeline
- 10:00 Drill initiated
- 10:05 Issue detected
- 10:12 Recovery started
- 10:28 Service restored

## Metrics
- Target RTO: 15 minutes
- Actual RTO: 28 minutes ❌
- Target RPO: 1 hour
- Actual RPO: 45 minutes ✅

## Issues
1. Backup download slower than expected
2. Runbook step 3 unclear

## Improvements
1. Implement parallel backup downloads
2. Update RB-001 with clearer instructions
```

---

## Appendix

### Emergency Contacts

| Role | Primary | Secondary |
|------|---------|-----------|
| On-Call Engineer | PagerDuty | Slack #incidents |
| Database Admin | +1-xxx-xxx-xxxx | Slack @dba-team |
| Engineering Lead | +1-xxx-xxx-xxxx | Email |
| Product Manager | Slack @pm-rotas | Email |

### Resource Locations

```
Backups:           s3://rotas-backups/
Runbooks:          https://wiki.internal/runbooks/rotas
Dashboards:        https://grafana.internal/d/rotas
Logs:              https://kibana.internal/rotas
```

### Quick Reference Commands

```bash
# Check service health
curl https://api.esports-exe.com/health

# View recent errors
kubectl logs -l app=rotas-api --tail=100 | grep ERROR

# Check Celery queue depth
redis-cli llen celery

# Database size check
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('esports'));"
```

---

*This document is living. Update after each incident and drill.*
