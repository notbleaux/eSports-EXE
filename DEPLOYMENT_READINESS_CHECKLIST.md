[Ver003.000]

# Deployment Readiness Checklist
## Libre-X-eSport 4NJZ4 TENET Platform v2.1

**Date:** 2026-03-16  
**Version:** 2.1.0  
**Status:** Ready for Production  

---

## Pre-Deployment Verification

### Environment Variables
| Variable | Required | Description | Status |
|----------|----------|-------------|--------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | ⬜ |
| `REDIS_URL` | ✅ | Redis connection string | ⬜ |
| `JWT_SECRET_KEY` | ✅ | JWT signing (min 256-bit) | ⬜ |
| `ENCRYPTION_KEY` | ✅ | Data encryption | ⬜ |
| `TOTP_ENCRYPTION_KEY` | ✅ | 2FA secret encryption | ⬜ |
| `DISCORD_CLIENT_ID` | ⚠️ | OAuth (optional) | ⬜ |
| `DISCORD_CLIENT_SECRET` | ⚠️ | OAuth (optional) | ⬜ |
| `GOOGLE_CLIENT_ID` | ⚠️ | OAuth (optional) | ⬜ |
| `GOOGLE_CLIENT_SECRET` | ⚠️ | OAuth (optional) | ⬜ |
| `GITHUB_CLIENT_ID` | ⚠️ | OAuth (optional) | ⬜ |
| `GITHUB_CLIENT_SECRET` | ⚠️ | OAuth (optional) | ⬜ |
| `VAPID_PUBLIC_KEY` | ⚠️ | Push notifications (optional) | ⬜ |
| `VAPID_PRIVATE_KEY` | ⚠️ | Push notifications (optional) | ⬜ |
| `VAPID_CLAIMS_EMAIL` | ⚠️ | Push notifications (optional) | ⬜ |
| `NODE_ENV` | ✅ | production/development | ⬜ |
| `APP_ENVIRONMENT` | ✅ | production/staging/development | ⬜ |

---

### Security Verification

| Check | Method | Status |
|-------|--------|--------|
| Generate secure keys | `openssl rand -base64 32` | ⬜ |
| Verify HTTPS in production | Configuration check | ⬜ |
| CSRF tokens enabled | API test | ⬜ |
| Rate limiting active | Load test | ⬜ |
| CORS configured | Headers check | ⬜ |
| Security headers set | Headers check | ⬜ |

---

### Database Migration

| Step | Command | Status |
|------|---------|--------|
| Backup existing | `pg_dump` | ⬜ |
| Run migrations | `alembic upgrade head` | ⬜ |
| Verify schema | Database inspection | ⬜ |
| Test connection | Application startup | ⬜ |

---

### Health Checks

| Endpoint | Expected Response | Status |
|----------|-------------------|--------|
| `GET /health` | `{"status":"healthy"}` | ⬜ |
| `GET /ready` | `{"status":"ready"}` | ⬜ |
| `GET /metrics` | Prometheus metrics | ⬜ |

---

### OAuth Configuration (Optional)

| Provider | Redirect URI | Status |
|----------|--------------|--------|
| Discord | `https://your-domain.com/auth/oauth/discord/callback` | ⬜ |
| Google | `https://your-domain.com/auth/oauth/google/callback` | ⬜ |
| GitHub | `https://your-domain.com/auth/oauth/github/callback` | ⬜ |

---

### Push Notifications (Optional)

| Step | Command | Status |
|------|---------|--------|
| Generate VAPID keys | `npx web-push generate-vapid-keys` | ⬜ |
| Configure email | Add to VAPID_CLAIMS_EMAIL | ⬜ |
| Test subscription | Browser notification test | ⬜ |

---

## Testing

| Test Suite | Command | Status |
|------------|---------|--------|
| Unit Tests | `pytest` | ⬜ |
| Integration Tests | `pytest tests/integration/` | ⬜ |
| E2E Tests | `npx playwright test` | ⬜ |
| Security Scan | `bandit -r api/src` | ⬜ |

---

## Deployment Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn api.src.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Install dependencies
npm install

# Build
npm run build

# Deploy to Vercel
vercel --prod
```

---

## Post-Deployment Verification

| Check | Method | Status |
|-------|--------|--------|
| API responding | `curl /health` | ⬜ |
| WebSocket connects | Browser dev tools | ⬜ |
| Database queries work | Test endpoint | ⬜ |
| OAuth login works | Manual test | ⬜ |
| 2FA enrollment works | Manual test | ⬜ |
| Push notifications work | Browser test | ⬜ |
| Betting odds calculate | API test | ⬜ |

---

## Rollback Plan

1. Keep previous deployment image
2. Database backup before migration
3. Quick rollback command ready
4. Monitoring alerts configured

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Lead | | | |
| Security Review | | | |
| QA Lead | | | |
| Product Owner | | | |

---

**All checks must pass before production deployment.**
