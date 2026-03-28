[Ver001.000]

# Archival System Operational Runbook

## Table of Contents

- [Overview](#overview)
- [Common Operations](#common-operations)
  - [Manual Garbage Collection](#manual-garbage-collection)
  - [Storage Migration](#storage-migration)
  - [Frame Pinning](#frame-pinning)
  - [Health Checks](#health-checks)
  - [Querying Frames](#querying-frames)
- [Troubleshooting](#troubleshooting)
  - [High Storage Usage](#high-storage-usage)
  - [Duplicate Frame Errors (409)](#duplicate-frame-errors-409)
  - [Storage Full](#storage-full)
  - [Database Connection Issues](#database-connection-issues)
  - [Slow Frame Queries](#slow-frame-queries)
- [Incident Response](#incident-response)
  - [P1: Complete Storage Failure](#p1-complete-storage-failure)
  - [P2: Database Connection Issues](#p2-database-connection-issues)
  - [P3: High GC Failure Rate](#p3-high-gc-failure-rate)
- [Monitoring](#monitoring)
  - [Key Metrics](#key-metrics)
  - [Log Analysis](#log-analysis)
- [Configuration](#configuration)
- [Contacts](#contacts)

## Overview

This runbook provides operational procedures for the NJZiteGeisTe Platform Archival System, which manages frame storage, deduplication, and lifecycle management for match replay data.

## Common Operations

### Manual Garbage Collection

Garbage collection removes unpinned frames older than the retention period.

```bash
# Dry run to see what would be deleted
curl -X POST http://localhost:8000/v1/archive/gc \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"retention_days": 90, "dry_run": true}'

# Execute GC
curl -X POST http://localhost:8000/v1/archive/gc \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"retention_days": 90, "dry_run": false}'
```

**Parameters:**
- `retention_days`: Delete frames older than this (1-3650)
- `dry_run`: If true, only counts without deleting (default: true)
- `batch_size`: Frames per batch (100-10000, default: 1000)

### Storage Migration (Placeholder)

Note: Multi-backend migration requires additional configuration.

```bash
# Initiate migration (dry run)
curl -X POST http://localhost:8000/v1/archive/storage/migrate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"from_backend": "local", "to_backend": "s3", "dry_run": true}'

# Check migration status
curl -X GET http://localhost:8000/v1/archive/storage/migrate/{job_id} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Frame Pinning

Pin important frames to prevent garbage collection.

```bash
# Pin frame
curl -X POST http://localhost:8000/v1/archive/frames/{frame_id}/pin \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "Important play", "ttl_days": 365}'

# Unpin frame
curl -X POST http://localhost:8000/v1/archive/frames/{frame_id}/unpin \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Parameters:**
- `reason`: Required reason for pinning
- `ttl_days`: Optional TTL (null = indefinite)

### Health Checks

```bash
# Basic health check
curl http://localhost:8000/v1/archive/health

# Deep health check with component status
curl http://localhost:8000/v1/archive/health/deep \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Prometheus metrics
curl http://localhost:8000/v1/archive/metrics/archive
```

### Querying Frames

```bash
# Query frames by match
curl "http://localhost:8000/v1/archive/matches/{match_id}/frames?page=1&limit=50"

# Get frame audit log
curl http://localhost:8000/v1/archive/frames/{frame_id}/audit \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Troubleshooting

### High Storage Usage

**Symptoms:** Storage alerts, disk space warnings

**Resolution:**
1. Check current usage: `GET /v1/archive/metrics/archive`
2. Run GC with shorter retention period
3. Consider storage migration to S3 (Phase 2)

```bash
# Check storage stats
curl http://localhost:8000/v1/archive/health

# Emergency GC with shorter retention
curl -X POST http://localhost:8000/v1/archive/gc \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"retention_days": 30, "dry_run": false}'
```

### Duplicate Frame Errors (409)

**Symptoms:** 409 responses during frame upload

**Resolution:**
- This is expected behavior - frame already exists
- Response contains existing `frame_id`
- No action needed - deduplication is working correctly

### Storage Full

**Symptoms:** Write failures, 503 Service Unavailable

**Resolution:**
1. Emergency GC: `retention_days=0` (deletes all unpinned frames)
2. Expand storage volume
3. Consider migration to S3

```bash
# Emergency cleanup - deletes ALL unpinned frames
curl -X POST http://localhost:8000/v1/archive/gc \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"retention_days": 0, "dry_run": false}'
```

### Database Connection Issues

**Symptoms:** Health check failures, timeout errors

**Resolution:**
1. Check connection pool metrics in logs
2. Verify database credentials
3. Restart service if needed

```bash
# Check deep health for database status
curl http://localhost:8000/v1/archive/health/deep
```

### Slow Frame Queries

**Symptoms:** High latency on frame list endpoints

**Resolution:**
1. Check if results are cached (5-minute TTL)
2. Reduce page size (`limit` parameter)
3. Add database indexes if missing

## Incident Response

### P1: Complete Storage Failure

**Impact:** All archival operations fail

**Response:**
1. Enable maintenance mode on API
2. Switch to backup storage backend (if configured)
3. Notify users of read-only mode
4. Investigate root cause:
   - Disk failures
   - Network issues
   - Permission problems

```bash
# Check component health
curl http://localhost:8000/v1/archive/health/deep
```

### P2: Database Connection Issues

**Impact:** Metadata operations fail, uploads may fail

**Response:**
1. Check connection pool metrics
2. Verify database credentials
3. Check PostgreSQL server status
4. Restart service if needed

### P3: High GC Failure Rate

**Impact:** Storage not being cleaned up

**Response:**
1. Check GC logs for specific errors
2. Verify storage permissions
3. Run GC with smaller batch size

```bash
# Run GC with smaller batch
curl -X POST http://localhost:8000/v1/archive/gc \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"retention_days": 90, "dry_run": false, "batch_size": 100}'
```

## Monitoring

### Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `archive_storage_bytes` | Total storage used | >80% capacity |
| `archive_frames_total` | Total frames stored | N/A |
| `archive_gc_errors_total` | GC error count | >5 in 1 hour |
| `archive_upload_duration_seconds` | Upload latency | p99 >5s |

### Log Analysis

Structured logs use the following keys:
- `event`: Action being performed
- `frame_id`: Frame UUID
- `match_id`: Match UUID
- `actor`: User or service performing action
- `duration_ms`: Operation duration

Example log search:
```bash
# Find all GC operations
grep "gc_completed" /var/log/archival/app.log

# Find errors
grep "error" /var/log/archival/app.log | jq '.'
```

## Configuration

See `packages/shared/api/.env.archival.example` for all configuration options.

Key environment variables:
- `ARCHIVE_LOCAL_DATA_DIR`: Local storage path
- `ARCHIVE_STORAGE_BACKEND`: Backend type (local/s3)
- `DEFAULT_RETENTION_DAYS`: Default GC retention
- `MAX_UPLOAD_SIZE_MB`: Max upload size
- `ENABLE_PROMETHEUS`: Enable metrics endpoint

## Contacts

- **Primary:** Platform Engineering Team
- **Escalation:** SRE On-call
- **Slack:** #sator-platform-alerts
