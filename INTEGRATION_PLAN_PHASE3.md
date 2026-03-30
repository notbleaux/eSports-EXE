[Ver001.000]

# INTEGRATION PLAN — Phase 3: Foreman Mode

**Date:** 2026-03-30  
**Agent:** Async Verification & Operations Agent  
**Status:** ✓ COMPLETE  

---

## 3.1 Background Integration Agent Design

### Agent Scope

**BackgroundIntegrationAgent** is an async background process responsible for monitoring and actioning unconnected systems that require continuous attention but don't block immediate development.

### Responsibilities

| System | Monitoring Task | Action Threshold | Escalation |
|--------|----------------|------------------|------------|
| ML Training | Track sample count in `player_stats` | < 10K samples: WARN, < 1K: CRITICAL | Discord webhook |
| Archive Push | Monitor CODEOWNER checklist C-ARCH.1 | Pending > 7 days: PING | Email digest |
| Auth0 Config | Check Phase 8 Gate 8.2 status | Blocked > 14 days: ESCALATE | CODEOWNER alert |
| E2E-Vercel | Track preview deployment success | Failure rate > 20%: INVESTIGATE | Slack alert |

### Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│              BackgroundIntegrationAgent                     │
├─────────────────────────────────────────────────────────────┤
│  Scheduler (cron: */30 * * * *)                             │
│  ├─→ ML Training Monitor ──→ PandaScore API status check   │
│  ├─→ Archive Push Monitor ──→ GitHub CODEOWNER status      │
│  ├─→ Auth0 Config Monitor ──→ PHASE_GATES.md gate 8.2      │
│  └─→ E2E-Vercel Monitor ──→ Vercel deployment status       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   Discord Webhook       │
              │   (status updates)      │
              └─────────────────────────┘
```

### Queue System

```python
# Background job queue schema
class IntegrationJob:
    job_id: str           # UUID v4
    system: str           # ml_training | archive_push | auth0 | e2e_vercel
    priority: int         # 1 (P1) | 2 (P2) | 3 (P3)
    status: str           # queued | running | completed | failed
    created_at: datetime
    retry_count: int      # max 3 with exponential backoff
    last_error: Optional[str]
```

### Health Check Endpoints

| System | Endpoint | Expected Response |
|--------|----------|-------------------|
| ML Training | `GET /v1/admin/ml/status` | `{"status": "ready|training|insufficient_data"}` |
| Archive Push | GitHub API check | Archive repo exists, subtree not pushed |
| Auth0 | `GET /v1/auth/status` | `{"configured": true|false}` |
| E2E-Vercel | GitHub Actions API | Latest workflow run status |

---

## 3.2 Integration Actions Identified

### Action Matrix

| System | Action | Priority | Complexity | ETA |
|--------|--------|----------|------------|-----|
| **ML Training** | Data collection webhook | P1 | Medium | 2-3 days |
| **Archive Push** | Approval request + script | P1 | Low | 1 day |
| **Auth0** | Configuration guide | P2 | High | 5-7 days |
| **E2E-Vercel** | Preview deployment trigger | P2 | Medium | 2 days |

### Detailed Actions

#### 1. ML Training — Data Collection Webhook (P1)

**Problem:** Currently using 2,000 synthetic samples instead of 50K+ real matches

**Solution:**
- Extend PandaScore webhook handler to feed match data into training pipeline
- Trigger model retraining when `player_stats` table reaches 10K rows
- Implement incremental training (don't retrain from scratch each time)

**Implementation:**
```python
# In packages/shared/api/routers/webhooks.py
@router.post("/pandascore")
async def pandascore_webhook(event: MatchEvent):
    # Existing: update match cache
    await update_match_cache(event)
    
    # New: check if we should trigger training
    sample_count = await get_player_stats_count()
    if sample_count >= 10000 and sample_count % 1000 == 0:
        await queue_training_job()
```

**Dependencies:**
- PandaScore API key configured
- `player_stats` table populated
- Training infrastructure (TensorFlow) installed

---

#### 2. Archive Push — Approval Request + Script (P1)

**Problem:** Archive repo created but subtree push pending CODEOWNER approval

**Solution:**
- Create subtree push script with safety checks
- Submit CODEOWNER approval request for C-ARCH.1
- Document rollback procedure

**Script:**
```bash
#!/bin/bash
# scripts/archive-subtree-push.sh

set -e

REPO_URL="git@github.com:notbleaux/eSports-EXE-archives.git"
BRANCH="main"

echo "Checking prerequisites..."
git fetch origin

# Verify we're on main
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    echo "ERROR: Must be on main branch"
    exit 1
fi

echo "Pushing Archived/ subtree to $REPO_URL..."
git subtree push --prefix=Archived "$REPO_URL" "$BRANCH"

echo "Subtree push complete."
echo "Next: Remove Archived/ from main repo after verification."
```

**Approval Request Template:**
```markdown
## CODEOWNER Approval Request: C-ARCH.1

**Request:** Approve subtree push of Archived/ to notbleaux/eSports-EXE-archives

**Impact:** 
- Removes 196 archived files from main repo
- Reduces clone size by ~XX MB
- Preserves full history in archive repo

**Rollback:** Archived/ can be restored from archive repo at any time

**Approver:** @notbleaux
```

---

#### 3. Auth0 — Configuration Guide (P2)

**Problem:** Phase 8 blocked on Auth0 credentials (Gate 8.2)

**Solution:**
- Create comprehensive Auth0 setup guide
- Document required environment variables
- Provide local testing configuration

**Guide Outline:**
```markdown
# Auth0 Configuration Guide

## Prerequisites
- Auth0 account (free tier sufficient)
- Custom domain (optional but recommended)

## Steps
1. Create Application in Auth0 Dashboard
2. Configure Allowed Callback URLs
3. Configure Allowed Logout URLs
4. Copy Client ID and Client Secret
5. Set environment variables

## Environment Variables
```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=xxx
AUTH0_CLIENT_SECRET=xxx
AUTH0_AUDIENCE=https://api.njzitegeist.com
```

## Local Testing
Use `localhost:5173` for development callbacks
```

**Dependencies:**
- CODEOWNER must create Auth0 account
- Domain DNS configuration (for production)

---

#### 4. E2E-Vercel — Preview Deployment Trigger (P2)

**Problem:** E2E tests exist but don't run against Vercel previews automatically

**Solution:**
- Update playwright.yml to wait for Vercel preview
- Add preview URL extraction step
- Run E2E tests against preview deployment

**Workflow Update:**
```yaml
# Add to .github/workflows/playwright.yml
jobs:
  test:
    steps:
      - name: Wait for Vercel Preview
        uses: patrickedqvist/wait-for-vercel-preview@v1
        id: wait
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 300
      
      - name: Run E2E tests against preview
        env:
          BASE_URL: ${{ steps.wait.outputs.url }}
        run: npx playwright test
```

**Dependencies:**
- Vercel GitHub integration enabled
- Preview deployments working
- Playwright tests stable

---

## Summary

### Immediate Actions (This Week)
1. Submit CODEOWNER approval for archive push (P1)
2. Create subtree push script (P1)
3. Implement ML training data collection webhook (P1)

### Medium-Term Actions (Next 2 Weeks)
4. Create Auth0 configuration guide (P2)
5. Implement E2E-Vercel preview testing (P2)

### Background Agent Deployment
- Create `services/background-agent/` service
- Schedule every 30 minutes
- Discord webhook integration
- Queue-based job processing

---

**Integration Agent:** Async Verification & Operations Agent  
**Next Phase:** Phase 4 — Finalization
