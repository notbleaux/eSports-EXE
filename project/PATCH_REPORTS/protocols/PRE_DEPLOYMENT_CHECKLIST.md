[Ver003.000]

# Pre-Deployment Checklist

> **Required checks before ANY deployment to production**

---

## Status: 🟢 LIVE

```yaml
version: "1.0.0"
date: "2026-03-04"
author: "@notbleaux"
approval: "@hvrryh-web"
```

---

## ⚠️ CRITICAL - Must Pass All

### Code Quality

- [ ] All unit tests passing
  ```bash
  # Python
  pytest shared/axiom-esports-data/ -v --cov
  
  # TypeScript
  npm run test
  ```

- [ ] All integration tests passing
  ```bash
  pytest tests/integration/ -v
  ```

- [ ] Firewall tests passing (REQUIRED)
  ```bash
  npm run test:firewall
  ```
  **Failure = Automatic deployment block**

- [ ] Schema validation passing
  ```bash
  npm run validate:schema
  ```

- [ ] Type checking passing
  ```bash
  npm run typecheck
  mypy shared/axiom-esports-data/
  ```

- [ ] Linting clean
  ```bash
  npm run lint
  pylint shared/axiom-esports-data/
  ```

### Security

- [ ] No secrets in code
  ```bash
  # Scan for common patterns
  grep -r "password\|secret\|key\|token" --include="*.py" --include="*.ts" --include="*.js" .
  
  # Use git-secrets
  git secrets --scan
  ```

- [ ] Security scan clean
  ```bash
  # Python
  bandit -r shared/axiom-esports-data/
  
  # Node.js
  npm audit
  ```

- [ ] Firewall compliance verified
  - GAME_ONLY_FIELDS unchanged OR approved by @hvrryh-web
  - All 4 enforcement points verified
  - No game data leakage in API responses

- [ ] Dependencies updated
  ```bash
  # Check for vulnerabilities
  npm audit
  pip check
  ```

### Documentation

- [ ] PATCH_REPORT created
  - File: `PATCH_REPORTS/patches/YYYY-MM-DD_NNN_TYPE_description.md`
  - Status: PENDING

- [ ] CHANGELOG updated
  - Entry in `PATCH_REPORTS/changelog/LIVE.md`
  - User-facing changes documented

- [ ] API documentation updated (if API changed)
  - `shared/axiom-esports-data/docs/API_REFERENCE.md`

- [ ] Architecture documentation updated (if architecture changed)
  - `ARCHITECTURE.md`

### Review

- [ ] Code review completed
  - At least 1 approval from senior developer
  - All review comments resolved

- [ ] Security review (if security-related)
  - Approval from @hvrryh-web

- [ ] Architecture review (if architectural changes)
  - Tech lead approval

---

## 🔴 HIGH - Required for Production

### Database

- [ ] Database backup completed
  ```bash
  # Supabase
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Migration scripts tested
  - Tested on staging database
  - Rollback script tested
  - No data loss risk

- [ ] Schema changes reviewed
  - Backward compatible OR migration plan approved
  - Performance impact assessed

### Deployment

- [ ] Rollback plan documented
  - Steps clearly defined
  - Rollback tested in staging
  - Estimated downtime documented

- [ ] Previous version accessible
  - Docker image tagged and available
  - Configuration snapshot saved
  - Database backup verified

- [ ] Deployment window confirmed
  - Within maintenance window (02:00-04:00 UTC)
  - No conflicting deployments
  - On-call engineer notified

### Monitoring

- [ ] Monitoring alerts configured
  - Error rate alerts
  - Latency alerts
  - Availability alerts

- [ ] Dashboards accessible
  - API health dashboard
  - Database metrics
  - Pipeline status

- [ ] Runbook updated (if procedures changed)
  - Incident response procedures
  - Escalation paths
  - Contact information

---

## 🟡 MEDIUM - Recommended

### Communication

- [ ] Team notified
  - Slack #deploys channel
  - Email to stakeholders (if user-facing)

- [ ] Status page updated (if user-facing)
  - Scheduled maintenance posted
  - Expected impact communicated

- [ ] On-call briefed
  - Changes explained
  - Known risks communicated
  - Rollback procedure reviewed

### Testing

- [ ] Staging deployment verified
  - Smoke tests passing
  - Key user flows working
  - Performance acceptable

- [ ] Load testing (if performance-critical)
  - Expected load handled
  - No degradation from baseline

- [ ] Compatibility testing (if breaking changes)
  - Client compatibility verified
  - API consumers notified

### Documentation

- [ ] AGENTS.md updated (if agent-affecting)
  - New patterns documented
  - Examples updated

- [ ] CONTRIBUTING.md updated (if process changes)
  - New procedures documented

---

## 📋 Sign-Off

### Required Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Developer | | | |
| Reviewer | | | |
| Security (if applicable) | @hvrryh-web | | |
| Tech Lead (if major) | | | |

### Deployment Authorization

```
I authorize deployment of this patch to production:

Deployer: ___________________ Date: ___________

Deployment Window: ___________________
Estimated Duration: ___________________
Rollback Plan Verified: [ ] Yes
```

---

## 🚀 Deployment Execution

### Pre-Deploy (T-5 minutes)

- [ ] Verify all checkboxes above
- [ ] Confirm no production incidents
- [ ] Check weather/status of dependencies
- [ ] Alert team: "Starting deployment"

### Deploy (T-0)

- [ ] Execute deployment
- [ ] Monitor for errors
- [ ] Verify health checks

### Post-Deploy (T+5 minutes)

- [ ] Confirm health checks passing
- [ ] Verify no error spikes
- [ ] Check key metrics normal
- [ ] Update status page

### Verification (T+30 minutes)

- [ ] Error rates normal
- [ ] Latency acceptable
- [ ] No customer complaints
- [ ] Monitoring stable

### Final (T+24 hours)

- [ ] No incidents reported
- [ ] Performance stable
- [ ] Patch marked LIVE
- [ ] Communication sent

---

## 🆘 Emergency Override

In case of emergency (active security vulnerability, production outage):

1. **Document the emergency**
   - Create patch document post-hoc
   - Record decision rationale

2. **Get verbal approval**
   - Security lead for security issues
   - Tech lead for production issues

3. **Deploy with monitoring**
   - Extra monitoring during deployment
   - Immediate rollback if issues

4. **Retroactive review**
   - Team review within 24 hours
   - Process improvement if needed

---

**Last Updated:** 2026-03-04  
**Status:** 🟢 LIVE  
**Next Review:** 2026-06-04
