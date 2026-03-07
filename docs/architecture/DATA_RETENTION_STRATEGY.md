# Data Retention & Archival Strategy
## Addressing Supabase 500MB Free Tier Limit

**Date:** March 8, 2026  
**Status:** Strategy Document  
**Priority:** HIGH

---

## Current Situation

**Supabase Free Tier Limits:**
- Storage: 500MB
- Connections: 30 max
- Egress: 2GB/month

**Projected Usage:**
- ~1,000 full matches = 500MB exhausted
- Each match: ~0.5MB with tick data
- Current growth: ~100 matches/week

**Time to Limit:** ~10 weeks at current rate

---

## Tiered Storage Strategy

### Hot Storage (Supabase) - 90 days
**What:** Recent matches, active tournaments  
**Size:** ~150MB  
**Access:** Real-time queries  
**Retention:** 90 days

```sql
-- Hot data: Last 90 days
CREATE TABLE matches_hot AS
SELECT * FROM matches
WHERE created_at > NOW() - INTERVAL '90 days';

-- Index for fast queries
CREATE INDEX idx_matches_hot_date ON matches_hot(created_at);
```

### Warm Storage (S3/GCS) - 1 year
**What:** Matches 90 days - 1 year old  
**Size:** ~2GB  
**Access:** API with cache  
**Cost:** ~$0.05/GB/month

**Implementation:**
```python
# Archive to S3 after 90 days
async def archive_to_s3(match_id: str):
    match_data = await fetch_match_data(match_id)
    
    # Compress
    compressed = gzip.compress(json.dumps(match_data).encode())
    
    # Upload to S3
    await s3_client.put_object(
        Bucket='sator-archive',
        Key=f'matches/{match_id}.json.gz',
        Body=compressed
    )
    
    # Delete from hot storage
    await db.execute("DELETE FROM matches WHERE id = $1", match_id)
```

### Cold Storage (Glacier/Deep Archive) - Forever
**What:** Historical matches > 1 year  
**Size:** Unlimited  
**Access:** 12-48 hour retrieval  
**Cost:** ~$0.004/GB/month

**Implementation:**
```python
# Move to Glacier after 1 year
async def deep_archive(match_id: str):
    # Copy to Glacier
    await s3_client.copy_object(
        Bucket='sator-archive',
        Key=f'historical/{match_id}.json.gz',
        CopySource=f'sator-archive/matches/{match_id}.json.gz',
        StorageClass='GLACIER_DEEP_ARCHIVE'
    )
    
    # Delete from standard S3
    await s3_client.delete_object(
        Bucket='sator-archive',
        Key=f'matches/{match_id}.json.gz'
    )
```

---

## Automated Archival Pipeline

### Daily Archive Job
```python
# runs/archival.py
async def daily_archive_job():
    """Archive matches older than 90 days."""
    
    # Find matches to archive
    old_matches = await db.fetch("""
        SELECT id FROM matches
        WHERE created_at < NOW() - INTERVAL '90 days'
        AND archived = FALSE
        LIMIT 100
    """)
    
    for match in old_matches:
        try:
            await archive_to_s3(match['id'])
            await db.execute(
                "UPDATE matches SET archived = TRUE WHERE id = $1",
                match['id']
            )
        except Exception as e:
            print(f"Failed to archive {match['id']}: {e}")
```

### Weekly Deep Archive Job
```python
async def weekly_deep_archive():
    """Move 1+ year old matches to Glacier."""
    
    historical = await db.fetch("""
        SELECT id FROM matches
        WHERE created_at < NOW() - INTERVAL '1 year'
        AND deep_archived = FALSE
    """)
    
    for match in historical:
        await deep_archive(match['id'])
```

### Cron Configuration
```yaml
# .github/workflows/archival.yml
name: Data Archival
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  archive:
    runs-on: ubuntu-latest
    steps:
      - name: Run archival
        run: python runs/archival.py
```

---

## Access Pattern

### Unified Data Access Layer
```python
class TieredDataAccess:
    """Transparent access to tiered storage."""
    
    async def get_match(self, match_id: str):
        # 1. Check hot storage (Supabase)
        match = await self.db.fetchrow(
            "SELECT * FROM matches WHERE id = $1",
            match_id
        )
        if match:
            return match
        
        # 2. Check warm storage (S3)
        try:
            obj = await self.s3.get_object(
                Bucket='sator-archive',
                Key=f'matches/{match_id}.json.gz'
            )
            data = await obj['Body'].read()
            return json.loads(gzip.decompress(data))
        except:
            pass
        
        # 3. Check cold storage (Glacier)
        # Trigger retrieval (takes 12-48 hours)
        return await self.request_glacier_retrieval(match_id)
```

---

## Cost Comparison

| Storage Tier | 1 Year Cost | Access Time |
|--------------|-------------|-------------|
| Supabase (500MB) | $0 | Instant |
| S3 Standard (2GB) | $1.20 | <100ms |
| Glacier (10GB) | $0.48 | 12-48hrs |
| **Total** | **~$1.68** | Variable |

---

## Implementation Priority

1. **Week 1:** Set up S3 bucket, test archival
2. **Week 2:** Implement daily archive job
3. **Week 3:** Add unified access layer
4. **Week 4:** Migrate historical data

---

## Monitoring

```python
# Monitor storage usage
async def check_storage():
    """Alert when approaching limits."""
    result = await db.fetchval("""
        SELECT pg_size_pretty(pg_database_size(current_database()))
    """)
    
    # Alert at 80% (400MB)
    usage_mb = await db.fetchval("""
        SELECT pg_database_size(current_database()) / 1024 / 1024
    """)
    
    if usage_mb > 400:
        send_alert(f"Storage at {usage_mb}MB - archive needed")
```

---

**This strategy extends 500MB storage to handle years of data at minimal cost.**