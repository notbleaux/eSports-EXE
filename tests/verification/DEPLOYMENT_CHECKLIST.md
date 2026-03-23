[Ver001.000]

# Deployment Checklist — VERIFY-002
## 4NJZ4 TENET Platform Production Deployment

**Document ID:** VERIFY-002-DC  
**Date:** 2026-03-24  
**Version:** 2.0.0  
**Deployer:** VERIFY-002 Agent  

---

## Overview

This checklist ensures a safe and verified deployment of the mascot system v2.0 to production environments.

**Target Deployment:** Vercel (Frontend)  
**Rollback Strategy:** Git revert + Vercel instant rollback  
**Estimated Time:** 15-30 minutes  

---

## Pre-Deployment Checklist

### 1. Code Verification
| # | Check | Command/Method | Status |
|---|-------|----------------|--------|
| 1.1 | All tests passing | `npm test` / `npx vitest run` | [ ] |
| 1.2 | Build successful | `npm run build` | [ ] |
| 1.3 | TypeScript compilation | `npm run typecheck` | [ ] |
| 1.4 | No lint errors | `npm run lint` | [ ] |
| 1.5 | No secrets in code | `git-secrets --scan` | [ ] |

### 2. Assets & Build
| # | Check | Location | Status |
|---|-------|----------|--------|
| 2.1 | All mascots generated | `apps/website-v2/src/components/mascots/generated/` | [ ] |
| 2.2 | CSS files optimized | `public/mascots/css/*.css` | [ ] |
| 2.3 | Icons and images optimized | `public/mascots/svg/` | [ ] |
| 2.4 | Bundle size verified | <100KB initial | [ ] |

### 3. Documentation
| # | Check | Document | Status |
|---|-------|----------|--------|
| 3.1 | API docs updated | `docs/API_V1_DOCUMENTATION.md` | [ ] |
| 3.2 | CHANGELOG updated | `docs/CHANGELOG_MASTER.md` | [ ] |
| 3.3 | README updated | `apps/website-v2/src/components/mascots/README.md` | [ ] |

### 4. Environment Variables
| Variable | Production Value | Status |
|----------|-----------------|--------|
| VITE_API_URL | https://api.libre-x-esport.com/v1 | [ ] |
| VITE_WS_URL | wss://api.libre-x-esport.com/ws | [ ] |
| VITE_SENTRY_DSN | Configured in Vercel | [ ] |
| VITE_APP_ENVIRONMENT | production | [ ] |
| VITE_APP_VERSION | 2.0.0 | [ ] |

---

## Deployment Steps

### Phase 1: Staging Deployment
```bash
# 1. Ensure on main branch
git checkout main
git pull origin main

# 2. Verify commit
git log --oneline -1
# Expected: 4c08fb6f [JLB] Phase 4: Refinement Complete...

# 3. Install dependencies
npm install

# 4. Run full test suite
npm run test:unit
npm run test:e2e

# 5. Build for staging
cd apps/website-v2
npm run build

# 6. Deploy to staging
vercel --target=staging
```

| # | Staging Verification | Status |
|---|---------------------|--------|
| 1 | Staging URL accessible | [ ] |
| 2 | All 14 mascots display | [ ] |
| 3 | Style switching works | [ ] |
| 4 | Gallery loads correctly | [ ] |
| 5 | Animations play smoothly | [ ] |
| 6 | Keyboard navigation works | [ ] |
| 7 | No console errors | [ ] |

### Phase 2: Production Deployment

#### Option A: Git Push (Automatic via Vercel)
```bash
# 1. Tag the release
git tag -a v2.0.0 -m "Mascot System v2.0 - 14 mascots, 2 styles"
git push origin v2.0.0

# 2. Push to main (triggers Vercel deploy)
git push origin main

# 3. Monitor deployment
vercel --version
```

#### Option B: Manual Vercel Deploy
```bash
# 1. Navigate to app directory
cd apps/website-v2

# 2. Deploy to production
vercel --prod

# 3. Confirm deployment
vercel --confirm
```

| # | Production Verification | Status |
|---|------------------------|--------|
| 1 | Production URL accessible | [ ] |
| 2 | SSL certificate valid | [ ] |
| 3 | Security headers present | [ ] |
| 4 | All 14 mascots display | [ ] |
| 5 | Style switching works | [ ] |
| 6 | Gallery loads correctly | [ ] |
| 7 | Animations play smoothly | [ ] |
| 8 | Keyboard navigation works | [ ] |
| 9 | Screen reader compatible | [ ] |
| 10 | Mobile responsive | [ ] |
| 11 | No console errors | [ ] |
| 12 | Analytics firing | [ ] |

---

## Post-Deployment Monitoring

### Immediate (0-15 minutes)
| # | Check | Tool | Status |
|---|-------|------|--------|
| 1 | Error rate <1% | Sentry / Vercel | [ ] |
| 2 | 200 response rate >99% | Vercel Analytics | [ ] |
| 3 | No 5xx errors | Vercel Logs | [ ] |
| 4 | Lighthouse score >90 | Chrome DevTools | [ ] |

### Short-term (15-60 minutes)
| # | Check | Tool | Status |
|---|-------|------|--------|
| 1 | User interactions tracking | Plausible | [ ] |
| 2 | Mascot click events | Custom analytics | [ ] |
| 3 | Performance metrics | Web Vitals | [ ] |
| 4 | Error trends | Sentry | [ ] |

### Long-term (1-24 hours)
| # | Check | Tool | Status |
|---|-------|------|--------|
| 1 | User feedback collected | Feedback widget | [ ] |
| 2 | Support tickets reviewed | Support system | [ ] |
| 3 | Performance stable | Vercel Analytics | [ ] |
| 4 | No regression in metrics | Comparison dashboard | [ ] |

---

## Smoke Test Script

### Critical Path Tests
```bash
# Run automated smoke tests
npx playwright test tests/e2e/mascot-cross-browser.spec.ts --project=chromium
```

### Manual Smoke Tests
| # | Test | Expected | Status |
|---|------|----------|--------|
| 1 | Load homepage | Page loads <2s | [ ] |
| 2 | View gallery | All 14 mascots visible | [ ] |
| 3 | Switch styles | Instant style change | [ ] |
| 4 | Select mascot | Detail panel opens | [ ] |
| 5 | Keyboard nav | Tab through all interactive | [ ] |
| 6 | Mobile view | Responsive layout | [ ] |
| 7 | Animation play | Smooth 60fps animation | [ ] |

---

## Rollback Procedure

### Emergency Rollback (Immediate)
```bash
# Via Vercel Dashboard:
# 1. Go to vercel.com/dashboard
# 2. Select project: libre-x-4njz4-tenet-platform
# 3. Go to "Deployments" tab
# 4. Find previous working deployment
# 5. Click "Promote to Production"
# 6. Confirm rollback

# Via CLI (if dashboard unavailable):
vercel rollback [deployment-url]
```

### Git Rollback (If code issue)
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to previous tag
git checkout v1.x.x
git checkout -b hotfix/rollback-v2
git push origin hotfix/rollback-v2
# Create PR and merge
```

---

## Deployment Verification Checklist

### Final Sign-off
| Phase | Status | Signed |
|-------|--------|--------|
| Pre-deployment checks | [ ] | _________ |
| Staging deployment | [ ] | _________ |
| Staging verification | [ ] | _________ |
| Production deployment | [ ] | _________ |
| Production verification | [ ] | _________ |
| Post-deployment monitoring | [ ] | _________ |

---

## Completion Statement

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        DEPLOYMENT CHECKLIST COMPLETE                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Deployment Date: _______________ 2026                                      ║
║   Deployed By: ________________________________                              ║
║   Deployment Method: [ ] Git Push  [ ] Manual Vercel CLI                     ║
║                                                                              ║
║   VERIFICATION RESULTS:                                                      ║
║   ─────────────────────                                                      ║
║   [ ] Pre-deployment: All checks passed                                      ║
║   [ ] Staging: Verified and approved                                         ║
║   [ ] Production: Successfully deployed                                      ║
║   [ ] Smoke Tests: All passed                                                ║
║   [ ] Monitoring: No anomalies detected                                      ║
║                                                                              ║
║   STATUS: [ ] READY FOR PRODUCTION  [ ] ROLLBACK REQUIRED                    ║
║                                                                              ║
║   Notes: ________________________________________________________________    ║
║          ________________________________________________________________    ║
║          ________________________________________________________________    ║
║                                                                              ║
║   Signature: ________________________________  Date: _______________          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Quick Reference

### Important URLs
| Environment | URL |
|-------------|-----|
| Production | https://sator-platform.vercel.app |
| Staging | https://staging.sator-platform.vercel.app |
| API | https://api.libre-x-esport.com |
| Sentry | https://sentry.io/organizations/libre-x-esport |

### Emergency Contacts
| Role | Contact |
|------|---------|
| Tech Lead | [Team Lead] |
| DevOps | [DevOps Lead] |
| On-Call | [On-Call Rotation] |

### Useful Commands
```bash
# Check deployment status
vercel ls

# View logs
vercel logs --production

# Check build
npm run build 2>&1 | tee build.log

# Run all tests
npm run test:unit && npm run test:e2e
```

---

*Document generated by VERIFY-002 Agent on 2026-03-24*
*Version: 001.000*
