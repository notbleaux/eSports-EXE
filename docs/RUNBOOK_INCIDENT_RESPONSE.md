[Ver001.000]

# Incident Response Runbook
## Libre-X-eSport 4NJZ4 TENET Platform

**Last Updated:** 2026-03-16  
**Version:** 2.1.0  
**Classification:** INTERNAL - All Engineers

---

## 1. Incident Response Lifecycle

```
DETECT → Triage → Respond → Resolve → Post-Incident
   ↑                                    ↓
   └──────────── Monitor ←──────────────┘
```

---

## 2. Detection

### Monitoring Sources
| Source | Alert Channel | Response Time |
|--------|--------------|---------------|
| Render Health Checks | Email/SMS | 5 minutes |
| Vercel Alerts | Email | 15 minutes |
| Uptime Monitor | Slack #alerts | 1 minute |
| Error Logs | Slack #errors | Real-time |
| User Reports | Slack #support | 30 minutes |

### Automated Alerts
```bash
# Health check failure (3 consecutive failures)
if ! curl -sf https://api.libre-x-esport.com/health; then
    ALERT="API Health Check Failed"
fi

# Error rate threshold (>5% 5xx)
if [ $error_rate -gt 5 ]; then
    ALERT="High Error Rate: ${error_rate}%"
fi

# Response time threshold (p95 > 500ms)
if [ $p95_latency -gt 500 ]; then
    ALERT="High Latency: ${p95_latency}ms"
fi
```

---

## 3. Triage (First 5 Minutes)

### Initial Assessment Checklist
- [ ] Confirm the incident (not a false positive)
- [ ] Determine severity (SEV-1/2/3)
- [ ] Identify affected components
- [ ] Check if related to deployment
- [ ] Create incident channel/thread

### Severity Classification

#### SEV-1 (Critical) - Immediate Response
**Indicators:**
- Complete platform down
- Data loss/corruption
- Security breach
- Payment failure

**Actions:**
1. Page on-call engineer
2. Create war room (Google Meet/Zoom)
3. Notify leadership
4. Update status page

#### SEV-2 (High) - 15 Minute Response
**Indicators:**
- Major feature degraded
- >50% performance impact
- Significant user impact

**Actions:**
1. Slack #incidents
2. Assign owner
3. Begin investigation

#### SEV-3 (Medium) - 1 Hour Response
**Indicators:**
- Minor feature issues
- <50% performance impact
- Workaround available

**Actions:**
1. Create ticket
2. Schedule fix

---

## 4. Response Procedures

### 4.1 API Outage

**Symptoms:**
- 503/504 errors
- High error rate
- Slow response times

**Diagnostic Steps:**
```bash
# 1. Check service status
render ps --service sator-api

# 2. View recent logs
render logs --service sator-api --tail 50

# 3. Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# 4. Check Redis
redis-cli -u $REDIS_URL ping
```

**Resolution Options:**
1. **Restart Service:**
   ```bash
   render deploy --service sator-api
   ```

2. **Rollback Deployment:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Scale Workers:**
   ```bash
   # Update render.yaml, increase workers
   render deploy --service sator-api
   ```

### 4.2 Database Issues

**Symptoms:**
- Connection timeouts
- Query errors
- Slow queries

**Diagnostic Steps:**
```bash
# Check connection
psql $DATABASE_URL -c "SELECT version();"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql $DATABASE_URL <<EOF
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
EOF
```

**Resolution:**
- Connection pool exhaustion: Restart API service
- Slow queries: Identify and kill (if necessary)
- Disk space: Contact Supabase support

### 4.3 High Error Rate

**Symptoms:**
- >5% 5xx errors
- Error spike in logs

**Diagnostic:**
```bash
# Check error logs
render logs --service sator-api | grep ERROR

# Analyze error patterns
# Look for:
# - Database connection errors
# - Rate limiting errors
# - Memory errors
# - Third-party API failures
```

**Common Causes:**
1. **Rate Limiting:** Check if legitimate traffic or attack
2. **Database:** Pool exhaustion, slow queries
3. **Memory:** Out of memory errors
4. **Dependencies:** Pandascore API down

### 4.4 Performance Degradation

**Symptoms:**
- p95 latency > 500ms
- User complaints about slowness

**Diagnostic:**
```bash
# Check resource usage
render ps --service sator-api

# Database performance
psql $DATABASE_URL <<EOF
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 10;
EOF
```

**Resolution:**
- Enable additional workers
- Check for missing indexes
- Review recent deployments
- Clear Redis cache

---

## 5. Communication

### 5.1 Internal Communication

**Incident Channel:** `#incidents`

**Update Template:**
```
🔴 INCIDENT: [SEV-1] API Outage

Time: 2026-03-16 14:30 UTC
Impact: Complete platform down
Status: Investigating

Updates in thread →
```

**Progress Updates (Every 15 min for SEV-1):**
```
Update 14:45 UTC:
- Root cause: Database connection pool exhausted
- Action: Restarting API service
- ETA: 10 minutes
```

### 5.2 External Communication

**Status Page:** https://status.libre-x-esport.com

**Update Template:**
```markdown
**Investigating:** We are investigating reports of platform 
unavailability. We will provide updates as more information 
becomes available.

**Affected:** All services  
**Started:** 14:30 UTC  
```

---

## 6. Resolution

### Resolution Checklist
- [ ] Service fully restored
- [ ] Error rates normal
- [ ] Performance normal
- [ ] All tests passing
- [ ] Status page updated
- [ ] Incident declared resolved

### Post-Resolution Actions
1. Monitor for 30 minutes
2. Schedule post-mortem (within 48 hours for SEV-1)
3. Document lessons learned
4. Create action items

---

## 7. Post-Incident Review

### Post-Mortem Template

```markdown
# Post-Mortem: [INCIDENT_ID]

## Summary
- **Date:** YYYY-MM-DD
- **Duration:** X minutes
- **Severity:** SEV-1/2/3
- **Impact:** Description

## Timeline
| Time | Event |
|------|-------|
| 14:30 | Issue detected via monitoring |
| 14:35 | Incident declared SEV-1 |
| 14:45 | Root cause identified |
| 15:00 | Fix deployed |
| 15:10 | Service restored |

## Root Cause
Detailed explanation of what happened and why.

## Impact Assessment
- Users affected: X
- Transactions lost: Y
- Data integrity: OK/Compromised

## Lessons Learned
1. What went well?
2. What could have gone better?
3. What did we learn?

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| Fix X | Engineer A | 2026-03-23 |
| Add monitoring Y | Engineer B | 2026-03-30 |
```

---

## 8. Quick Reference Cards

### Response Cheat Sheet
```
SEV-1: Page on-call, war room, leadership notify
SEV-2: Slack #incidents, team lead notify
SEV-3: Ticket, schedule fix

Commands:
- render logs --service sator-api --tail 100
- render deploy --service sator-api
- curl https://api.libre-x-esport.com/health
```

### Emergency Contacts
- On-call: ops-oncall@libre-x-esport.com
- Tech Lead: [Contact]
- Engineering Manager: [Contact]
- Supabase Support: https://supabase.com/support
- Render Support: https://render.com/support

---

## 9. Training

### Required Training
- [ ] Read this runbook (Annual)
- [ ] DR drill participation (Quarterly)
- [ ] Post-mortem review (Monthly)

### Scenario Practice
1. API outage simulation
2. Database failover drill
3. Security incident response
4. Performance degradation handling

---

*This runbook should be reviewed and updated after each incident.*
