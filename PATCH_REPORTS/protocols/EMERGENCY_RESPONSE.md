# Emergency Response Protocol

> **Incident response procedures for critical situations**

---

## Status: 🟢 LIVE

```yaml
version: "1.0.0"
date: "2026-03-04"
author: "@notbleaux"
approval: "@hvrryh-web"
```

---

## 🚨 Severity Levels

### P0 - Critical (Immediate Response)

| Condition | Examples |
|-----------|----------|
| Complete outage | All services down |
| Data breach | Unauthorized data access |
| Security incident | Active attack in progress |
| Data loss | Database corruption |
| Firewall breach | GAME_ONLY_FIELDS exposed |

**Response Time:** Immediate (< 5 minutes)  
**Team:** All hands  
**Communication:** Immediate

### P1 - High (< 30 minutes)

| Condition | Examples |
|-----------|----------|
| Major feature down | API unavailable |
| Significant data issue | Inconsistent data |
| Performance degraded | Latency > 5s |
| Partial outage | Some endpoints failing |

**Response Time:** < 30 minutes  
**Team:** On-call + relevant experts  
**Communication:** Within 15 minutes

### P2 - Medium (< 2 hours)

| Condition | Examples |
|-----------|----------|
| Minor feature issues | Non-critical bugs |
| Degraded performance | Slow responses |
| Single user impact | Isolated issues |

**Response Time:** < 2 hours  
**Team:** On-call  
**Communication:** Within 1 hour

### P3 - Low (< 24 hours)

| Condition | Examples |
|-----------|----------|
| Cosmetic issues | UI glitches |
| Minor inconveniences | Edge case bugs |
| Documentation errors | Typos |

**Response Time:** < 24 hours  
**Team:** Standard support  
**Communication:** Next business day

---

## 🆘 Response Procedures

### P0 - Critical Incident Response

#### Phase 1: Detect & Alert (0-5 minutes)

```
┌─────────────────────────────────────────┐
│ 1. DETECTION                            │
├─────────────────────────────────────────┤
│ • Monitoring alert triggered            │
│ • User report received                  │
│ • Automated system detection            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 2. INITIAL ASSESSMENT                   │
├─────────────────────────────────────────┤
│ • Confirm incident is real              │
│ • Assess scope and impact               │
│ • Determine severity (P0/P1/P2/P3)      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 3. ALERT                                │
├─────────────────────────────────────────┤
│ Slack #incidents:                       │
│ 🚨 P0 INCIDENT DECLARED                 │
│ Impact: [brief description]             │
│ Responder: [your name]                  │
│ Status: Investigating                   │
│ Channel: #incident-YYYY-MM-DD-N         │
└─────────────────────────────────────────┘
```

#### Phase 2: Contain (5-15 minutes)

```bash
# 1. CREATE WAR ROOM
# Slack: #incident-YYYY-MM-DD-N

# 2. ASSEMBLE TEAM
# @channel P0 - Need all hands
# Security: @hvrryh-web
# DevOps: @devops-team
# Backend: @backend-team
# Frontend: @frontend-team

# 3. IMMEDIATE CONTAINMENT
# If data breach:
#   - Revoke compromised credentials
#   - Enable additional logging
#   - Isolate affected systems

# If outage:
#   - Attempt immediate rollback
#   - Enable maintenance mode
#   - Scale resources if capacity issue
```

#### Phase 3: Eradicate (15-60 minutes)

```
┌─────────────────────────────────────────┐
│ 4. ROOT CAUSE ANALYSIS                  │
├─────────────────────────────────────────┤
│ • Review logs                           │
│ • Check recent deployments              │
│ • Identify trigger                      │
│ • Determine fix approach                │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 5. IMPLEMENT FIX                        │
├─────────────────────────────────────────┤
│ • Rollback if appropriate               │
│ • Deploy hotfix if identified           │
│ • Apply configuration changes           │
│ • Execute runbook procedures            │
└─────────────────────────────────────────┘
```

#### Phase 4: Recover (60-120 minutes)

```
┌─────────────────────────────────────────┐
│ 6. RESTORE SERVICE                      │
├─────────────────────────────────────────┤
│ • Verify fix in staging                 │
│ • Deploy to production                  │
│ • Monitor health metrics                │
│ • Gradually restore traffic             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 7. VERIFY RESOLUTION                    │
├─────────────────────────────────────────┤
│ • All health checks passing             │
│ • Error rates normal                    │
│ • User reports resolved                 │
│ • Metrics stable                        │
└─────────────────────────────────────────┘
```

#### Phase 5: Post-Incident (24-48 hours)

```
┌─────────────────────────────────────────┐
│ 8. COMMUNICATION                        │
├─────────────────────────────────────────┤
│ • All-clear notification                │
│ • Incident summary                      │
│ • User communication (if affected)      │
│ • Status page update                    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 9. DOCUMENTATION                        │
├─────────────────────────────────────────┤
│ • Incident timeline                     │
│ • Root cause analysis                   │
│ • Actions taken                         │
│ • Lessons learned                       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 10. POST-MORTEM                         │
├─────────────────────────────────────────┤
│ • Schedule within 48 hours              │
│ • Blameless culture                     │
│ • Action items identified               │
│ • Process improvements                  │
└─────────────────────────────────────────┘
```

---

## 🔥 Specific Incident Types

### Security Incident

#### Immediate Actions (First 5 minutes)

```bash
# 1. PRESERVE EVIDENCE
# DO NOT: Delete logs, restart services, clear caches
# DO: Screenshot everything, save logs, document timestamps

# 2. CONTAIN
# Rotate compromised credentials
# Revoke API keys
# Enable enhanced logging
# Alert security team @hvrryh-web

# 3. ASSESS
# What data was accessed?
# What systems were compromised?
# Is attack ongoing?
```

#### Notification Requirements

| Time | Action | Audience |
|------|--------|----------|
| Immediate | Alert security team | @hvrryh-web |
| 15 min | Notify leadership | Engineering Manager |
| 1 hour | Legal assessment | Legal team (if data breach) |
| 24 hours | Regulatory notification | Authorities (if required) |
| 72 hours | User notification | Affected users (GDPR/CCPA) |

### Data Breach (GAME_ONLY_FIELDS Exposed)

```bash
# CRITICAL: This is a P0 incident

# 1. IMMEDIATE ACTIONS
# Stop the data flow
# Revoke API keys if compromised
# Enable emergency logging

# 2. ASSESS IMPACT
# What fields were exposed?
# How long was exposure active?
# Who accessed the data?

# 3. CONTAINMENT
# Deploy firewall fix
# Rotate all credentials
# Increase monitoring

# 4. NOTIFICATION
# @hvrryh-web (mandatory)
# Legal team
# Compliance officer

# 5. REMEDIATION
# Patch vulnerability
# Verify firewall enforcement
# Audit all access logs
# Document for compliance
```

### Complete Outage

```bash
# 1. VERIFY OUTAGE
# Check from multiple locations
# Verify not just local issue
# Check third-party status pages

# 2. QUICK DIAGNOSIS
# Database connection? → Check Supabase
# API down? → Check Render
# Web down? → Check Vercel
# Pipeline? → Check GitHub Actions

# 3. IMMEDIATE ACTIONS
# Check if rollback candidate
# Execute rollback if clear cause
# Scale resources if capacity
# Enable maintenance page

# 4. COMMUNICATION
# Post to status page
# Alert in #incidents
# Notify on-call
```

### Database Corruption

```bash
# WARNING: High risk of data loss

# 1. STOP ALL WRITES
# Enable read-only mode
# Pause pipeline jobs
# Alert all teams

# 2. ASSESS DAMAGE
# Identify corrupted tables
# Determine last good backup
# Estimate data loss window

# 3. DECISION POINT
if [ "last backup < 1 hour" ]; then
    # Restore from backup
    pg_restore backup_file
elif [ "corruption isolated" ]; then
    # Targeted repair
    repair_corrupted_data
else
    # Full restore
    pg_restore latest_backup
fi

# 4. VERIFY INTEGRITY
# Run data validation scripts
# Check referential integrity
# Verify no orphaned records
```

---

## 📞 Communication Templates

### Initial Alert (Slack #incidents)

```
🚨 P0 INCIDENT DECLARED

Impact: [Service] is down/unavailable
Started: [Timestamp]
Severity: P0 - Critical
Responder: [Your name]
Status: Investigating

War Room: #incident-YYYY-MM-DD-N
Zoom: [link]

Updates every 15 minutes.
```

### Status Update (Every 15 min)

```
📊 P0 Update - [+XX min]

Status: [Investigating/Identified/Controlling/Resolved]
Impact: [Current situation]
Progress: [What we've done]
Next: [What we're doing]
ETA: [Expected resolution]
```

### Resolution

```
✅ P0 RESOLVED

Duration: XX minutes
Resolution: [Brief description]
Impact: [Summary of user impact]

Post-mortem: Scheduled for [Date/Time]

Thank you for your patience.
```

---

## 🛠️ Emergency Contacts

### Primary Contacts

| Role | Contact | Method | Response |
|------|---------|--------|----------|
| Security Lead | @hvrryh-web | GitHub/Slack | Immediate |
| Tech Lead | @notbleaux | GitHub/Slack | < 5 min |
| DevOps | DevOps Team | PagerDuty | < 5 min |
| On-Call | Rotating | PagerDuty | < 15 min |

### Third-Party Services

| Service | Status Page | Support |
|---------|-------------|---------|
| Supabase | status.supabase.com | - |
| Render | status.render.com | - |
| Vercel | status.vercel.com | - |
| GitHub | status.github.com | - |

---

## 📝 Incident Documentation

### Incident Record Template

```markdown
## Incident: INC-YYYY-MM-DD-N

### Summary
Brief description of what happened

### Timeline
| Time | Event |
|------|-------|
| 00:00 | Issue detected |
| 00:05 | P0 declared |
| 00:30 | Root cause identified |
| 01:00 | Fix deployed |
| 01:30 | Service restored |

### Root Cause
Technical explanation of why this happened

### Impact
- Users affected: X
- Duration: XX minutes
- Services affected: [list]
- Data loss: Yes/No (amount)

### Resolution
What fixed the issue

### Lessons Learned
What we can improve

### Action Items
| Task | Owner | Due |
|------|-------|-----|
| Fix X | @user | YYYY-MM-DD |
| Improve Y | @user | YYYY-MM-DD |
```

---

## 🎓 Training & Drills

### Quarterly Drills

| Drill | Frequency | Participants |
|-------|-----------|--------------|
| Security incident | Quarterly | Security + Dev |
| Outage response | Quarterly | On-call rotation |
| Data recovery | Semi-annual | DevOps + DBAs |
| Communication | Quarterly | All teams |

### Post-Drill Review

- What went well?
- What could be improved?
- Were runbooks accurate?
- Did communication work?
- Update procedures as needed

---

**Last Updated:** 2026-03-04  
**Status:** 🟢 LIVE  
**Next Drill:** 2026-06-04
