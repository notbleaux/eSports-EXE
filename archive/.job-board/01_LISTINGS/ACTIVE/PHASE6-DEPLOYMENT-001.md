# [JLB-LISTING] Phase 6: Production Deployment

**ID:** PHASE6-DEPLOYMENT-001  
**Priority:** P0 - CRITICAL  
**Phase:** 6  
**Status:** PENDING  
**Coordinator:** Main Agent  
**Blocked By:** Phase 5 validation GO decision

## Objective
Deploy the refactored application to production with zero downtime.

## Pre-Deployment Checklist

### 6.1: Pre-Flight Verification
**Assignee:** Main Agent
- [ ] Phase 5 validation report shows GO
- [ ] All blockers resolved
- [ ] Team sign-off obtained
- [ ] Rollback plan ready

---

## Deployment Strategy

### Option A: Blue-Green Deployment (Recommended)
**Use Vercel's atomic deployments**

1. **Build Production**
```bash
cd apps/web
npx vercel build --prod
```

2. **Deploy to Production**
```bash
npx vercel deploy --prebuilt --prod
```

3. **Verify Deployment**
- Check build logs for errors
- Verify URL responds
- Run smoke tests

### Option B: Staging → Production
**Two-stage deployment**

1. **Deploy to Staging**
```bash
npx vercel deploy --prebuilt
# Get staging URL
```

2. **Staging Validation**
- Manual QA
- Automated smoke tests
- Performance check

3. **Promote to Production**
```bash
npx vercel promote [deployment-id]
```

---

## Deployment Steps

### Step 1: Environment Preparation
**Assignee:** @coder-deployment

Verify environment variables in Vercel Dashboard:
- [ ] VITE_API_URL
- [ ] VITE_WS_URL
- [ ] VITE_APP_ENV=production
- [ ] VITE_ANALYTICS_ID
- [ ] All feature flags set

### Step 2: Build
**Assignee:** @coder-build
```bash
cd apps/web
npx vercel pull --yes
npx vercel build --prod
```

**Verify:**
- Build succeeds
- No console errors
- Bundle size reasonable

### Step 3: Deploy
**Assignee:** @coder-deployment
```bash
npx vercel deploy --prebuilt --prod --yes
```

**Capture:**
- Deployment URL
- Deployment ID
- Build time

### Step 4: Smoke Tests
**Assignee:** @coder-testing

Automated checks:
```bash
# Test homepage
curl -s -o /dev/null -w "%{http_code}" https://website-v2-ashen-mu.vercel.app/
# Expect: 200

# Test hub routes
curl -s -o /dev/null -w "%{http_code}" https://website-v2-ashen-mu.vercel.app/sator
# Expect: 200

# Test API health (if applicable)
curl https://sator-api.onrender.com/health
# Expect: {"status":"ok"}
```

Manual checks:
- [ ] Landing page loads
- [ ] Navigation works
- [ ] All 5 hubs accessible
- [ ] No console errors
- [ ] Responsive design works

### Step 5: Monitoring
**Assignee:** @coder-monitoring

**Watch for 30 minutes:**
- Vercel Analytics dashboard
- Error rates
- Performance metrics
- User feedback

---

## Rollback Plan

**If issues detected:**

### Immediate Rollback (Vercel)
```bash
# List recent deployments
npx vercel list

# Find previous production deployment
# Promote previous deployment
npx vercel promote [previous-deployment-id]
```

### Timeline
- Detection: 0-5 minutes
- Decision: 5-10 minutes
- Rollback execution: 1-2 minutes
- Verification: 2-5 minutes
- **Total rollback time: <15 minutes**

---

## Post-Deployment

### 6.2: Verification (1 hour post-deploy)
**Assignee:** @coder-monitoring

- [ ] Error rates normal
- [ ] Performance metrics acceptable
- [ ] No user complaints
- [ ] All features functional

### 6.3: Documentation Update
**Assignee:** @coder-docs

Update:
- [ ] Deployment log
- [ ] AGENTS.md with any new learnings
- [ ] Runbook with any process changes

### 6.4: Team Notification
**Assignee:** Main Agent

Notify team:
- Deployment successful
- Any issues encountered
- Any manual steps required

---

## Deployment Report Template

```markdown
# Production Deployment Report

**Date:** YYYY-MM-DD
**Deployment ID:** dpl_xxxx
**Status:** ✅ SUCCESS / ❌ ROLLBACK

## Changes Deployed
- Phase 1-2: Structural refactoring
- Phase 3: TypeScript error fixes
- Phase 4: Code optimization (if applicable)

## Metrics
- Build Time: X minutes
- Bundle Size: X KB
- Lighthouse Score: XX

## Issues
[Any issues encountered]

## Sign-off
- Deployed by: [Name]
- Verified by: [Name]
- Approved by: [Name]
```

---

## Success Criteria

✅ **Deployment Successful if:**
- Zero downtime
- All smoke tests pass
- Error rates <0.1%
- Performance maintained or improved
- No critical user-facing bugs

❌ **Rollback Required if:**
- Site unreachable
- >1% error rate
- Critical functionality broken
- Performance degraded >50%

---

## Coordination

- Deployment window: Low-traffic period
- Team on standby during deployment
- Communication channel open (Slack/Discord)
- Rollback decision authority: Main Agent
