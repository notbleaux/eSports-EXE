# Free Deployment Guide (Zero Cost)

## Services Provisioning
```bash
# Vercel Frontend (Hobby)
npx vercel --prod

# Render API (Free)
# infrastructure/render.yaml: plan: free
render deploy

# Supabase DB
# dashboard.supabase.com → New project (500MB free)

# Upstash Redis (10k cmds/day)
console.upstash.com → Create DB
```

## Trading Sim Cron (Render)
```yaml
cron: "0 */6 * * *"  # EV recalc every 6h
```

**Monitoring**: Dashboards weekly (egress <2GB).
**Cold Start**: GitHub keepalive cron.

