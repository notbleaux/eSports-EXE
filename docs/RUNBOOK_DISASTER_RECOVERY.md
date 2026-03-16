[Ver001.000]

# Disaster Recovery Runbook
## Libre-X-eSport 4NJZ4 TENET Platform

**Last Updated:** 2026-03-16  
**Version:** 2.1.0  
**Classification:** INTERNAL - Operations Team

---

## 1. Overview

### Recovery Objectives
| Metric | Target | Measurement |
|--------|--------|-------------|
| **RPO** (Recovery Point) | < 1 hour | Maximum data loss acceptable |
| **RTO** (Recovery Time) | < 30 minutes | Time to restore service |
| **RLO** (Recovery Level) | Full | Complete platform restoration |

### Critical Components
| Priority | Component | Recovery Method |
|----------|-----------|-----------------|
| P0 | PostgreSQL Database | Point-in-time restore |
| P1 | API Service | Re-deploy from GitHub |
| P1 | Redis Cache | Rebuild (non-persistent) |
| P2 | Web Frontend | Vercel auto-deploy |

---

## 2. Incident Classification

### Severity Levels

#### SEV-1 (Critical)
**Criteria:**
- Complete platform outage
- Data corruption or loss
- Security breach
- Payment system failure

**Response:**
- Page on-call engineer immediately
- War room within 15 minutes
- Executive notification within 30 minutes
- Status page updated

#### SEV-2 (High)
**Criteria:**
- Major feature unavailable
- Degraded performance (>50% impact)
- Partial data inconsistency

**Response:**
- On-call engineer responds within 30 minutes
- Team lead notified
- Status page updated

#### SEV-3 (Medium)
**Criteria:**
- Minor feature issues
- Performance degradation (<50% impact)
- Non-critical bugs

**Response:**
- Ticket created
- Fix in next maintenance window

---

## 3. Database Recovery Procedures

### 3.1 Point-in-Time Recovery (PITR)

**When to use:**
- Data corruption
- Accidental deletion
- Rollback required

**Prerequisites:**
- Supabase project ID
- Target recovery timestamp
- `psql` client installed

**Steps:**

```bash
# 1. Access Supabase Dashboard
# URL: https://app.supabase.com/project/{project-ref}

# 2. Navigate to Database → Backups

# 3. Click "Restore to New Project" or "Point-in-Time Recovery"

# 4. Select target timestamp (format: YYYY-MM-DD HH:MM:SS UTC)

# 5. Confirm restoration

# 6. Update DATABASE_URL in Render environment variables

# 7. Restart API service
```

**Verification:**
```bash
# Check data integrity
curl https://api.libre-x-esport.com/health

# Verify record counts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM player_performance;"
```

### 3.2 Database Failover

**When to use:**
- Primary database unreachable
- Region outage

**Steps:**

```bash
# 1. Check current database status
psql $DATABASE_URL -c "SELECT version();"

# 2. If primary is down, initiate failover via Supabase Dashboard
# Dashboard → Database → Settings → Failover

# 3. Update connection string in Render
# Dashboard → Environment → Edit DATABASE_URL

# 4. Restart API service
render deploy --service sator-api

# 5. Verify connectivity
curl https://api.libre-x-esport.com/ready
```

---

## 4. Application Recovery

### 4.1 API Service Recovery

**When to use:**
- API container crash
- Deployment failure
- Configuration error

**Steps:**

```bash
# 1. Check service status
render ps --service sator-api

# 2. View logs
render logs --service sator-api --tail 100

# 3. If needed, trigger manual deploy
render deploy --service sator-api

# 4. Verify health
curl https://api.libre-x-esport.com/health
```

**Rollback Procedure:**
```bash
# 1. Identify last known good commit
git log --oneline -10

# 2. Rollback to previous commit
git revert HEAD

# 3. Push to trigger deploy
git push origin main

# 4. Verify rollback
curl https://api.libre-x-esport.com/health
```

### 4.2 Frontend Recovery

**When to use:**
- Build failure
- CDN issues
- Configuration errors

**Steps:**

```bash
# 1. Check Vercel deployment status
vercel --version

# 2. Redeploy if needed
vercel --prod

# 3. Verify deployment
vercel ls

# 4. Check domain
 curl -I https://libre-x-esport.com
```

---

## 5. Cache Recovery

### 5.1 Redis Rebuild

**When to use:**
- Cache corruption
- Memory exhaustion
- Connection issues

**Note:** Redis is used for caching only. Data can be rebuilt.

**Steps:**

```bash
# 1. Clear Redis (if accessible)
redis-cli -u $REDIS_URL FLUSHALL

# 2. Restart API service to reconnect
render deploy --service sator-api

# 3. Cache will rebuild automatically on requests
```

---

## 6. Data Integrity Checks

### 6.1 Post-Recovery Validation

```bash
# 1. Health checks
curl https://api.libre-x-esport.com/health
curl https://api.libre-x-esport.com/ready

# 2. Database connectivity
psql $DATABASE_URL -c "SELECT NOW();"

# 3. Critical table counts
psql $DATABASE_URL <<EOF
SELECT 
    'player_performance' as table_name, COUNT(*) as count FROM player_performance
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'matches', COUNT(*) FROM matches;
EOF

# 4. API endpoints
 curl https://api.libre-x-esport.com/api/sator/players?limit=1
```

### 6.2 Data Consistency Checks

```sql
-- Check for orphaned records
SELECT COUNT(*) FROM player_performance 
WHERE player_id NOT IN (SELECT id FROM players);

-- Check for null required fields
SELECT COUNT(*) FROM player_performance 
WHERE player_id IS NULL OR match_id IS NULL;

-- Verify recent data ingestion
SELECT MAX(realworld_time) as latest_record 
FROM player_performance;
```

---

## 7. Communication Templates

### 7.1 Internal Notification (Slack)

```
🚨 INCIDENT ALERT - SEV-{1|2|3}

Service: 4NJZ4 TENET Platform
Status: {DEGRADED|DOWN}
Impact: {DESCRIPTION}
Started: {TIMESTAMP}
On-Call: {ENGINEER}

Investigating: {INITIAL_ASSESSMENT}

Thread for updates →
```

### 7.2 Status Page Update

```
**Incident Report: {TITLE}**

**Status:** Investigating  
**Affected:** {SERVICES}  
**Started:** {TIME} UTC  

We are investigating reports of {ISSUE}. We will provide updates as more information becomes available.

**Next Update:** {TIME + 30min}
```

### 7.3 Post-Incident Report

```
**Post-Incident Review: {INCIDENT_ID}**

**Timeline:**
- {TIME}: Issue detected
- {TIME}: Incident declared
- {TIME}: Root cause identified
- {TIME}: Fix deployed
- {TIME}: Service restored

**Root Cause:**
{DESCRIPTION}

**Impact:**
- Duration: {X} minutes
- Users affected: {Y}
- Data loss: {Z}

**Action Items:**
1. {PREVENTION_MEASURE} - Owner: {NAME} - Due: {DATE}
2. {MONITORING_IMPROVEMENT} - Owner: {NAME} - Due: {DATE}
```

---

## 8. Escalation Matrix

| Level | Contact | When to Escalate |
|-------|---------|------------------|
| L1 | On-call Engineer | Initial response |
| L2 | Tech Lead | SEV-1, >30 min unresolved |
| L3 | Engineering Manager | SEV-1, >1 hour unresolved |
| L4 | CTO | Business impact, data loss |

### Contact Information
- **On-call:** ops-oncall@libre-x-esport.com
- **Slack:** #incidents
- **PagerDuty:** [Link to schedule]

---

## 9. Testing & Maintenance

### 9.1 DR Drill Schedule
| Type | Frequency | Last Completed |
|------|-----------|----------------|
| Tabletop exercise | Quarterly | TBD |
| Database restore test | Monthly | TBD |
| Full DR simulation | Annually | TBD |

### 9.2 Runbook Review
- Review this runbook monthly
- Update after each incident
- Validate contact information quarterly

---

## 10. Quick Reference

### Emergency Commands
```bash
# Health check
curl https://api.libre-x-esport.com/health

# Database status
psql $DATABASE_URL -c "SELECT version();"

# Restart API
render deploy --service sator-api

# View logs
render logs --service sator-api --tail 100
```

### Important URLs
- **Status Page:** https://status.libre-x-esport.com
- **Supabase Dashboard:** https://app.supabase.com
- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard

---

*This runbook is a living document. Update it after every incident.*
