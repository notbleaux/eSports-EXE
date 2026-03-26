# [Ver001.000] Pre-Deploy Checklist — NJZiteGeisTe Platform

## Backend (Render.com) — Environment Variables
- [ ] DATABASE_URL (Supabase → Settings → Database → Connection string)
- [ ] REDIS_URL (Upstash → REST URL)
- [ ] PANDASCORE_API_KEY
- [ ] PANDASCORE_WEBHOOK_SECRET
- [ ] JWT_SECRET_KEY (min 32 chars — generate: python -c "import secrets; print(secrets.token_hex(32))")
- [ ] ADMIN_USERNAME + ADMIN_PASSWORD
- [ ] GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (optional — OAuth)
- [ ] DISCORD_CLIENT_ID + DISCORD_CLIENT_SECRET (optional — OAuth)
- [ ] GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET (optional — OAuth)
- [ ] GITHUB_REDIRECT_URI = https://your-api.onrender.com/v1/oauth/github/callback
- [ ] SENTRY_DSN (optional)

## Backend — Deploy Steps
- [ ] alembic upgrade head (applies migrations 001-003)
- [ ] python -m njz_api.scripts.sync_pandascore (seed data)
- [ ] GET /health returns {"status": "healthy"}
- [ ] bash tests/smoke/smoke_test.sh (API_URL=https://your-api.onrender.com)

## Frontend (Vercel) — Environment Variables
- [ ] VITE_API_URL = https://your-api.onrender.com
- [ ] VITE_WS_URL = wss://your-api.onrender.com
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] VITE_SENTRY_DSN (optional)
- [ ] VITE_APP_VERSION = 2.1.0

## Frontend — Deploy Steps
- [ ] Vercel build passes (pnpm run build — no errors)
- [ ] Verify /analytics, /stats, /community, /pro-scene, /hubs all load
- [ ] Verify /player/test-slug and /team/test-slug don't crash (empty state ok)
- [ ] Verify 404 page renders for unknown routes

## GitHub Repository Secrets (for CI/health cron)
- [ ] API_URL = https://your-api.onrender.com
- [ ] FRONTEND_URL = https://your-app.vercel.app

## Post-Deploy
- [ ] Register PandaScore webhook: POST https://api.pandascore.co/v2/webhooks
- [ ] Run Lighthouse CI
- [ ] Confirm all GitHub Actions jobs green on main
