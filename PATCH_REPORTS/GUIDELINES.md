# Safety Guidelines & Protocols

> **SATOR Platform - Critical Safety Requirements**

---

## Status: 🟢 LIVE

```yaml
version: "1.0.0"
date: "2026-03-04"
author: "@notbleaux"
reviewers: ["@hvrryh-web"]
approval: "@hvrryh-web"
```

---

## 🔴 CRITICAL - Non-Negotiable Rules

### 1. Data Partition Firewall

**NEVER bypass or modify without approval.**

- **Required Approver:** @hvrryh-web
- **Scope:** GAME_ONLY_FIELDS, firewall middleware, data sanitization
- **Consequence of Violation:** Immediate rollback, security audit

**GAME_ONLY_FIELDS (Blocked from Web):**
```typescript
// NEVER expose these to public API:
- internalAgentState
- radarData
- detailedReplayFrameData
- simulationTick
- seedValue
- visionConeData
- smokeTickData
- recoilPattern
- aiDecisionTree
- pathfindingNodes
```

**Enforcement Points (All Must Pass):**
1. Game Extraction (LiveSeasonModule.gd)
2. API Middleware Filter (firewall.py)
3. Web Schema Validation (validateStats.ts)
4. CI/CD Testing (test-firewall.yml)

### 2. Determinism Protection

**Simulation must remain deterministic.**

- Only use seeded RNG
- Never use delta-time in simulation logic
- Fixed 20 TPS timestep
- Consistent agent processing order

### 3. Temporal Wall

**Training data must predate 2024-01-01.**

- Enforced by temporal_wall.py
- Prevents future data leakage
- Required for analytics calculations

### 4. Secret Management

**NEVER commit secrets to repository.**

```bash
# NEVER DO THIS:
git add .env
git add secrets.json
git add *.key

# ALWAYS USE:
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
```

---

## 🟡 HIGH - Required Safety Measures

### Pre-Deployment Checklist

Before ANY deployment, verify:

- [ ] All tests pass (`npm run test`, `pytest`)
- [ ] Firewall tests pass (`npm run test:firewall`)
- [ ] Schema validation passes (`npm run validate:schema`)
- [ ] No secrets in code
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Database backup completed
- [ ] CODEOWNERS approval (if required)

### Required Reviews

| Change Type | Required Reviewers |
|-------------|-------------------|
| Security-related | @hvrryh-web (mandatory) |
| GAME_ONLY_FIELDS | @hvrryh-web (mandatory) |
| Database schema | Senior developer + DBA |
| API changes | API lead + Security |
| UI/UX changes | Design lead |
| Documentation | Technical writer |

### Rollback Requirements

Every deployment must have:

1. **Rollback Plan Document**
   - Steps to revert
   - Expected downtime
   - Data integrity checks

2. **Previous Version Accessible**
   - Docker image tagged
   - Database backup
   - Configuration snapshot

3. **Rollback Tested**
   - Procedure validated in staging
   - Timing measured
   - Verification steps defined

---

## 🟢 STANDARD - Best Practices

### Code Quality

- Type hints required (Python)
- Strict TypeScript mode
- ESLint/Prettier compliance
- 80%+ test coverage

### Documentation

- Update AGENTS.md for architectural changes
- Update API_REFERENCE.md for endpoint changes
- Add CHANGELOG entry for user-facing changes

### Testing

```bash
# Run before every PR:
npm run test:firewall
npm run validate:schema
npm run typecheck
pytest shared/axiom-esports-data/ -v
```

### Deployment Windows

| Environment | Window | Notice Required |
|-------------|--------|-----------------|
| Production | 02:00-04:00 UTC | 24 hours |
| Staging | Any time | 2 hours |
| Development | Any time | None |

---

## 🚨 Emergency Procedures

### Security Incident Response

```
1. DETECT (Immediate)
   └─ Identify the threat
   └─ Assess impact scope
   └─ Alert security team (@hvrryh-web)

2. CONTAIN (< 15 minutes)
   └─ Isolate affected systems
   └─ Revoke compromised credentials
   └─ Enable maintenance mode

3. ERADICATE (< 1 hour)
   └─ Remove threat
   └─ Patch vulnerability
   └─ Verify no persistence

4. RECOVER (< 4 hours)
   └─ Restore from clean backup
   └─ Verify system integrity
   └─ Resume operations

5. POST-INCIDENT (24-48 hours)
   └─ Document lessons learned
   └─ Update security measures
   └─ Communicate to stakeholders
```

### Production Outage Response

```
1. DETECT
   └─ Monitoring alert triggered
   └─ Manual verification
   └─ Declare incident severity

2. RESPOND (Severity-Based)
   
   P1 (Critical): < 5 min
   - Immediate rollback
   - All hands response
   
   P2 (High): < 30 min
   - Investigate root cause
   - Prepare hotfix
   
   P3 (Medium): < 2 hours
   - Schedule fix
   - Workaround if available

3. COMMUNICATE
   └─ Internal: Slack #incidents
   └─ External: Status page
   └─ Updates every 30 min

4. RESOLVE
   └─ Apply fix
   └─ Verify resolution
   └─ Monitor for 24 hours
```

---

## 🔒 Security Protocols

### Firewall Violation Response

| Severity | Condition | Action |
|----------|-----------|--------|
| **Critical** | GAME_ONLY_FIELDS in production DB | Immediate rollback, audit all deployments |
| **High** | Field leaks through API | Block deploy, fix middleware, re-run tests |
| **Medium** | Field in extraction but caught by middleware | Fix LiveSeasonModule, add regression test |
| **Low** | CI detects new unlisted field | Add to GAME_ONLY_FIELDS or schema |

### Secret Exposure Response

1. **Immediate (0-5 min):**
   - Rotate exposed credential
   - Revoke old credential
   - Audit access logs

2. **Short-term (5-60 min):**
   - Scan for additional exposures
   - Check for unauthorized access
   - Remove from git history (if committed)

3. **Long-term (1-24 hours):**
   - Root cause analysis
   - Update secret management
   - Team training if needed

---

## 📋 Compliance Requirements

### Data Retention

| Data Type | Retention Period | Action After |
|-----------|------------------|--------------|
| Match data | 2 years | Archive to cold storage |
| Player stats | 3 years | Anonymize |
| User activity | 1 year | Delete |
| Audit logs | 7 years | Archive |

### Privacy (GDPR/CCPA)

- Right to deletion: 30 days
- Data portability: 30 days
- Consent management: Required
- Breach notification: 72 hours

---

## 🎯 Quality Gates

### Definition of Done

- [ ] Code implemented
- [ ] Unit tests written (80%+ coverage)
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Security review (if required)
- [ ] Performance benchmarked
- [ ] Accessibility verified
- [ ] Code review approved
- [ ] CHANGELOG entry added

### Deployment Gates

- [ ] All tests pass
- [ ] Firewall tests pass
- [ ] Security scan clean
- [ ] Performance regression < 5%
- [ ] Rollback tested
- [ ] Monitoring configured
- [ ] Runbook updated
- [ ] On-call notified

---

## 📝 Documentation Standards

### Patch Documentation

Every patch MUST include:

```markdown
## Summary
Brief description of change

## Rationale
Why this change was needed

## Changes
List of specific changes

## Testing
How it was tested

## Rollback
How to revert if needed

## Risks
Known risks and mitigations
```

### Incident Reports

Every incident MUST document:

```markdown
## Incident Summary
What happened

## Timeline
Minute-by-minute breakdown

## Root Cause
Technical explanation

## Impact
Who/what was affected

## Resolution
How it was fixed

## Lessons Learned
What to improve

## Action Items
Specific follow-ups
```

---

## 👥 Approval Matrix

| Change Type | Developer | Senior Dev | Security Lead | Product Owner |
|-------------|:---------:|:----------:|:-------------:|:-------------:|
| Bug fix (minor) | ✅ | ⏺️ | ⏺️ | ⏺️ |
| Bug fix (major) | ✅ | ✅ | ⏺️ | ⏺️ |
| Feature (minor) | ✅ | ✅ | ⏺️ | ✅ |
| Feature (major) | ✅ | ✅ | ⏺️ | ✅ |
| Security patch | ✅ | ✅ | ✅ | ⏺️ |
| Firewall change | ✅ | ✅ | ✅ | ✅ |
| Schema change | ✅ | ✅ | ⏺️ | ✅ |
| Breaking change | ✅ | ✅ | ✅ | ✅ |

Legend: ✅ Required | ⏺️ Optional/Advisory

---

## 🔄 Review Cadence

| Document | Review Frequency | Owner |
|----------|------------------|-------|
| These guidelines | Quarterly | @hvrryh-web |
| FIREWALL_POLICY.md | Monthly | @hvrryh-web |
| DEPLOYMENT_ARCHITECTURE.md | Per deployment | DevOps |
| API_REFERENCE.md | Per API change | API Lead |

---

## 📞 Emergency Contacts

| Role | Contact | Method | Response |
|------|---------|--------|----------|
| Security Lead | @hvrryh-web | GitHub/Slack | Immediate |
| Tech Lead | @notbleaux | GitHub/Slack | < 1 hour |
| DevOps | DevOps team | PagerDuty | < 15 min |
| Product | Product Owner | Email/Slack | < 4 hours |

---

**Last Updated:** 2026-03-04  
**Status:** 🟢 LIVE  
**Next Review:** 2026-06-04
