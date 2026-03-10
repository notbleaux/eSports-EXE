[Ver001.000]

# Patch Template

> Copy this template when creating a new patch.

---

## Status: 🟡 DRAFT

```yaml
patch_id: "2026-MM-DD_NNN"
version: "X.Y.Z"
date: "YYYY-MM-DD"
author: "@username"
reviewers: []
type: ""  # HOT, SEC, BUG, FEAT, PERF, DOC, REF, DATA, COMP, DEPS
priority: ""  # P0, P1, P2, P3
component: ""  # API, Web, Game, Pipeline, Database, Shared
related_issues: []
related_patches: []
```

---

## Summary

**One-line summary:** Brief description of what this patch does

**Detailed description:**
Provide context and background for this patch. Explain what problem it solves or what feature it adds.

---

## Rationale

### Why is this change needed?

Explain the business/technical reason for this patch.

### What are we trying to achieve?

Describe the desired outcome.

### What are the alternatives?

List alternative approaches considered and why they were rejected.

---

## Changes

### Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `path/to/file` | Modified | What changed |
| `path/to/new/file` | Added | New functionality |
| `path/to/old/file` | Deleted | No longer needed |

### Database Changes

```sql
-- Migration script (if applicable)
-- Include UP and DOWN migrations
```

### API Changes

| Endpoint | Change | Breaking? |
|----------|--------|-----------|
| `GET /api/...` | Modified | Yes/No |
| `POST /api/...` | Added | N/A |

### Configuration Changes

| Config | Old Value | New Value |
|--------|-----------|-----------|
| `FEATURE_FLAG` | `false` | `true` |

---

## Testing

### Test Plan

- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] E2E tests passing (if applicable)
- [ ] Security tests passing (if applicable)
- [ ] Performance benchmarked (if applicable)

### Test Results

```
Test Suite: PASSED ✅
Coverage: XX%
Duration: XXs
```

### Manual Testing

| Test Case | Steps | Expected Result | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| Test 1 | Step 1, Step 2... | Should... | Did... | ✅ Pass |

---

## Rollback Plan

### Rollback Procedure

1. Step 1 to rollback
2. Step 2 to rollback
3. Step 3 to rollback

### Rollback Verification

```bash
# Commands to verify rollback succeeded
curl https://api.sator.io/health
# Expected: {"status": "healthy"}
```

### Estimated Rollback Time

- **Database:** X minutes
- **Application:** X minutes
- **Total:** X minutes

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Risk 1 | Low/Med/High | Low/Med/High | How we'll handle it |
| Risk 2 | Low/Med/High | Low/Med/High | How we'll handle it |

---

## Deployment

### Pre-Deployment Checklist

- [ ] Code review completed
- [ ] Security review (if required)
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Database backup complete
- [ ] Rollback plan tested
- [ ] Monitoring alerts configured
- [ ] On-call notified

### Deployment Steps

1. **Preparation**
   ```bash
   # Commands to prepare
   ```

2. **Deployment**
   ```bash
   # Commands to deploy
   ```

3. **Verification**
   ```bash
   # Commands to verify
   ```

### Post-Deployment Verification

- [ ] Health checks passing
- [ ] Error rates normal
- [ ] Performance acceptable
- [ ] No alerts triggered

---

## Communication

### Internal Communication

| Audience | Message | Channel | Timing |
|----------|---------|---------|--------|
| Dev team | Summary | Slack | Before deploy |
| On-call | Notification | PagerDuty | Deploy time |

### External Communication

| Audience | Message | Channel | Timing |
|----------|---------|---------|--------|
| Users | If user-facing | Status page | After deploy |

---

## Checklist

### Before Submitting for Review

- [ ] Patch document completed
- [ ] Code implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] CHANGELOG entry added
- [ ] No secrets in code
- [ ] Commit messages follow convention

### Before Deployment

- [ ] All reviews approved
- [ ] Security review (if required)
- [ ] Staging deployment verified
- [ ] Rollback plan ready
- [ ] Monitoring configured

### After Deployment

- [ ] Production verified
- [ ] Metrics normal
- [ ] Status updated to LIVE
- [ ] Communication sent
- [ ] Patch archived after 30 days

---

## Notes

### Technical Notes

Any technical details worth noting.

### Lessons Learned

What we learned during this patch.

### Future Improvements

Ideas for future related work.

---

## History

| Date | Event | Author |
|------|-------|--------|
| YYYY-MM-DD | Created | @username |
| YYYY-MM-DD | Submitted for review | @username |
| YYYY-MM-DD | Approved | @reviewer |
| YYYY-MM-DD | Deployed to production | @deployer |
| YYYY-MM-DD | Status: LIVE | @maintainer |

---

**Template Version:** 1.0.0  
**Status:** 🟡 DRAFT
