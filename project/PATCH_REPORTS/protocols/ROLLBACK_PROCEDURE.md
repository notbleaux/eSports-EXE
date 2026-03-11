[Ver002.000]

# Rollback Procedure

> **Standard operating procedure for reverting deployments**

---

## Status: 🟢 LIVE

```yaml
version: "1.0.0"
date: "2026-03-04"
author: "@notbleaux"
approval: "@hvrryh-web"
```

---

## 🚨 When to Rollback

### Automatic Triggers

Rollback immediately if:

| Condition | Threshold | Duration |
|-----------|-----------|----------|
| Error rate | > 1% | 5 minutes |
| P99 Latency | > 2000ms | 5 minutes |
| Availability | < 99% | 3 minutes |
| Failed health checks | Any | 3 consecutive |

### Manual Triggers

Rollback when:

- Critical functionality broken
- Data integrity issues detected
- Security vulnerability discovered
- Business impact exceeds acceptable threshold

### Do NOT Rollback

Consider forward-fix instead when:

- Rollback would cause data loss
- Database migrations are irreversible
- Fix is simple and quick (< 30 min)
- Rollback time > fix time

---

## ⚡ Emergency Rollback (< 5 minutes)

### Step 1: Alert Team (0-1 min)

```bash
# Post in #incidents Slack channel
@channel PRODUCTION ROLLBACK IN PROGRESS
Patch: [PATCH-ID]
Reason: [ERROR DESCRIPTION]
Deployer: [YOUR NAME]
ETA: 5 minutes
```

### Step 2: Stop Traffic (1-2 min)

```bash
# Option 1: Enable maintenance mode
# (if implemented)

# Option 2: Scale down to zero (Render/Vercel)
# Careful - affects all traffic
```

### Step 3: Execute Rollback (2-4 min)

#### Render (API)

```bash
# Option 1: Dashboard
# 1. Go to Render Dashboard
# 2. Find service "sator-api"
# 3. Click "Manual Deploy"
# 4. Select previous commit
# 5. Deploy

# Option 2: CLI (if configured)
render deploy --service sator-api --commit [PREVIOUS_COMMIT]
```

#### Vercel (Web)

```bash
# Option 1: Dashboard
# 1. Go to Vercel Dashboard
# 2. Find project "sator-web"
# 3. Go to "Deployments"
# 4. Find previous deployment
# 5. Click "Promote to Production"

# Option 2: CLI
vercel --version [PREVIOUS_VERSION]
```

#### Database (if needed)

```bash
# ONLY if database migration caused issue
# WARNING: May cause data loss

# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Or execute down migration
psql $DATABASE_URL -f migrations/00X_down_migration.sql
```

### Step 4: Verify Rollback (4-5 min)

```bash
# Health checks
curl https://sator-api.onrender.com/health
curl https://sator-api.onrender.com/ready

# Verify error rate dropping
# Check dashboard
```

### Step 5: Resume Traffic (5 min)

```bash
# Disable maintenance mode
# OR confirm traffic flowing normally
```

---

## 📋 Standard Rollback Procedure

### Preparation (Before rollback)

1. **Identify the issue**
   - What is broken?
   - When did it start?
   - Which patch caused it?

2. **Confirm rollback is safe**
   - [ ] Database state compatible
   - [ ] No data loss risk
   - [ ] Previous version stable

3. **Notify stakeholders**
   - [ ] Team notified
   - [ ] On-call aware
   - [ ] Status page updated (if user-facing)

### Execution

#### 1. Document Rollback Decision

```markdown
## Rollback Decision Record

**Patch:** [PATCH-ID]
**Reason:** [Why rolling back]
**Decision Time:** [Timestamp]
**Decision Maker:** [Name]
**Impact:** [User impact]
```

#### 2. Execute Rollback

**For Code Rollback:**

```bash
# Git revert (creates new commit)
git revert [PATCH_COMMIT]
git push origin main

# Or reset (if not pushed - DANGEROUS)
git reset --hard [PREVIOUS_COMMIT]
git push --force origin main  # ⚠️ Use with caution
```

**For Render Deployment:**

```bash
# Deploy previous version
# Via Render Dashboard or CLI
render deploy --service sator-api --commit [PREVIOUS_COMMIT]
```

**For Vercel Deployment:**

```bash
# Via Vercel Dashboard
# Find previous deployment, promote to production
```

#### 3. Database Rollback (if needed)

```bash
# Check if database migration needs rollback
# WARNING: This can cause data loss

# Option 1: Down migration (if exists)
psql $DATABASE_URL -f migrations/00X_down.sql

# Option 2: Restore from backup
psql $DATABASE_URL < backup_file.sql

# Option 3: Forward-fix schema (recommended if possible)
```

#### 4. Verify Rollback

```bash
# Health checks
for i in {1..5}; do
  curl -s https://sator-api.onrender.com/health | grep "healthy"
  sleep 5
done

# Error rates
curl [metrics_endpoint] | jq '.error_rate'
# Should be < 0.1%

# Key functionality
curl https://sator-api.onrender.com/api/players | jq '.players | length'
# Should return expected data
```

### Post-Rollback

1. **Monitor** (30 minutes)
   - Error rates
   - Latency
   - User complaints

2. **Communicate**
   ```
   Slack #incidents:
   "Rollback of [PATCH] complete. 
   Service restored to [PREVIOUS_VERSION].
   Monitoring for 30 minutes."
   ```

3. **Document**
   - Update patch document
   - Record lessons learned
   - Schedule post-mortem

4. **Clean Up**
   - Remove broken deployment
   - Archive patch as ROLLED_BACK
   - Update STATUS.md

---

## 🗄️ Database Rollback Scenarios

### Scenario 1: Migration Never Ran

**No action needed** - Old code works with old schema.

### Scenario 2: Migration Ran, No Data Loss

```sql
-- Execute down migration
-- (if provided in migrations/)
```

### Scenario 3: Migration Ran, Potential Data Loss

```sql
-- WARNING: Complex scenario
-- Options:
-- 1. Forward-fix (recommended)
-- 2. Data migration script
-- 3. Restore from backup (last resort)
```

### Scenario 4: Irreversible Migration

**DO NOT ROLLBACK** - Must forward-fix:

1. Create hotfix patch
2. Deploy hotfix
3. Mark original patch as superseded

---

## 🔧 Rollback Tools

### Quick Commands

```bash
# Get previous commit
git log --oneline -5

# Get previous Docker image
docker images | grep sator-api

# List database backups
ls -la backups/

# Get previous Vercel deployment
vercel deployments list
```

### Scripts

```bash
#!/bin/bash
# rollback.sh - Quick rollback script

SERVICE=$1
PREVIOUS_VERSION=$2

echo "Rolling back $SERVICE to $PREVIOUS_VERSION..."

if [ "$SERVICE" == "api" ]; then
  render deploy --service sator-api --commit $PREVIOUS_VERSION
elif [ "$SERVICE" == "web" ]; then
  vercel --version $PREVIOUS_VERSION
else
  echo "Unknown service: $SERVICE"
  exit 1
fi

echo "Rollback initiated. Monitor at:"
echo "https://dashboard.render.com/"
echo "https://vercel.com/dashboard"
```

---

## 📊 Rollback Decision Matrix

| Issue Severity | Rollback? | Alternative |
|----------------|:---------:|-------------|
| Complete outage | ✅ Yes | - |
| Major feature broken | ✅ Yes | Hotfix if < 30 min |
| Minor bug | ⏸️ No | Schedule fix |
| Performance degradation | ⚠️ Maybe | Scale up first |
| Security vulnerability | ✅ Yes | Immediately |
| Data corruption | ✅ Yes | + Restore backup |

---

## 📝 Post-Rollback Checklist

- [ ] Service fully restored
- [ ] Error rates back to normal
- [ ] No user complaints
- [ ] Team notified of completion
- [ ] Patch document updated (status: ROLLED_BACK)
- [ ] STATUS.md updated
- [ ] Incident documented
- [ ] Post-mortem scheduled (if significant)
- [ ] Lessons learned captured

---

## 🎓 Lessons Learned

### Common Rollback Reasons

1. **Insufficient testing** - Tests passed but edge cases missed
2. **Environment differences** - Worked in staging, failed in prod
3. **Database issues** - Migration problems
4. **Configuration errors** - Wrong env vars
5. **Dependency issues** - Third-party service changes

### Prevention

- Thorough testing (unit, integration, E2E)
- Staging environment matches production
- Database migrations tested with realistic data
- Configuration validation
- Canary deployments for risky changes

---

## 📞 Escalation

If rollback fails:

| Time | Action | Contact |
|------|--------|---------|
| 0-5 min | Attempt emergency rollback | On-call |
| 5-15 min | Escalate to senior engineer | Tech Lead |
| 15-30 min | All-hands response | Engineering Manager |
| 30+ min | Executive notification | CTO |

---

**Last Updated:** 2026-03-04  
**Status:** 🟢 LIVE  
**Next Review:** 2026-06-04
