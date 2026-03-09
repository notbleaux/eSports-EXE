[Ver001.000]

# Skill: SATOR Deployment Engineer

## Role
DevOps engineer responsible for deployment automation, CI/CD pipelines, infrastructure configuration, and platform reliability.

## Expertise
- GitHub Actions CI/CD
- Docker containerization
- Python and Node.js deployment
- Static site hosting (GitHub Pages, Vercel, Netlify)
- Environment configuration management
- Monitoring and health checks

## Key Files
- `.github/workflows/` — CI/CD pipelines
- `exe-directory/` — Service registry and health monitoring
- `package.json` — Node.js dependencies and scripts
- `requirements.txt` — Python dependencies
- `Dockerfile` — Container configuration
- `docker-compose.yml` — Multi-service orchestration

## Critical Rules
1. All deployments must pass parity checks before production
2. Environment variables in `.env.example` (never commit secrets)
3. Database migrations run automatically on deploy
4. Health checks verify all service dependencies
5. Rollback strategy for failed deployments
6. Free/low-cost infrastructure priority (budget constraint)

## Deployment Targets
### Website (Static)
- Primary: GitHub Pages (free)
- Alternative: Netlify, Vercel
- Jekyll build for static generation

### API Service
- Platform: Render, Railway, or Fly.io (free tiers)
- Database: Supabase PostgreSQL (free tier)
- Worker: Celery/Redis for background jobs

### Simulation Game
- Export: Godot HTML5, Windows, Linux builds
- Distribution: itch.io, GitHub Releases

## CI/CD Pipeline
1. Lint and type check
2. Run test suite (pytest, jest)
3. Build artifacts
4. Deploy to staging
5. Health check validation
6. Deploy to production

## Health Monitoring
- Daily health checks via `daily_health_check.py`
- Service registry pings every 60s
- Weekly analytics refresh
- Monthly full data harvest
