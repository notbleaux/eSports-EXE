[Ver001.000]

# NJZiteGeisTe Platform — Phase 5 Status

**Date:** 2026-03-25
**Phase:** 5 — SimRating ML + Live Data (In Progress)

---

## Phases Complete

| Phase | Summary |
|-------|---------|
| Phase 1–2 | Branding, routing, TypeScript migration, hub architecture |
| Phase 3 | pnpm workspaces, Poetry, Vercel/Render deploy config |
| Phase 4 | Data layer: SQLAlchemy models, Alembic migrations, FastAPI v1 routers, TanStack Query hooks, Redis caching, WebSocket feed, profile pages |

---

## Phase 5 — Completed Items

| Item | File(s) | Status |
|------|---------|--------|
| player_stats table | `infra/migrations/versions/002_player_stats.py` | ✅ Done |
| PlayerStats model | `services/api/src/njz_api/models/player_stats.py` | ✅ Done |
| PandaScore stats fetcher | `services/api/src/njz_api/clients/pandascore.py` | ✅ Done |
| sync_player_stats pipeline | `services/api/src/njz_api/scripts/sync_pandascore.py` | ✅ Done |
| SimRating v2 formula | `packages/shared/api/routers/simrating.py` | ✅ Done |
| PandaScore webhook receiver | `packages/shared/api/routers/webhooks.py` | ✅ Done |
| AREPO Cross-Reference Engine | `apps/web/src/hub-3-arepo/index.jsx` | ✅ Done |
| PWA manifest | `apps/web/public/manifest.json` | ✅ Done |
| Service worker (v3) | `apps/web/src/sw.ts` | ✅ Done |
| index.html branding | `apps/web/index.html` | ✅ Done |

---

## Phase 5 — SimRating v2 Formula

Replaces heuristic `pandascore_id % 60 + 40` with real match data:

```
SimRating = kd_score + acs_score + consistency + precision  (0–100)

kd_score    = min(avg_kd / 2.0, 1.0) × 25      # 2.0 KD = max
acs_score   = min(avg_acs / 300.0, 1.0) × 25    # 300 ACS = max
consistency = min(games / 20.0, 1.0) × 25       # 20 games = max
precision   = min(avg_hs_pct / 30.0, 1.0) × 25  # 30% HS% = max
```

Falls back to v1 heuristic when no `player_stats` rows exist for a player.

---

## To Go Live

```bash
# 1. Apply DB migrations
cd packages/shared/api
alembic upgrade head

# 2. Set environment variables
export DATABASE_URL=postgresql+asyncpg://...
export PANDASCORE_API_KEY=pc_live_...
export REDIS_URL=rediss://...

# 3. Seed data (teams, players, matches, stats)
python -m njz_api.scripts.sync_pandascore

# 4. Register webhook URL with PandaScore dashboard
#    URL: https://your-api.onrender.com/v1/webhooks/pandascore

# 5. Deploy API → Render.com (auto on push to main)
# 6. Deploy frontend → Vercel (auto on push to main)
```

---

## Next Phase 5 Milestones

1. **Populate player_stats** — Run sync_pandascore.py with production keys
2. **Live match broadcast** — Wire `ws_matches.py` to broadcast events from webhook
3. **sim_calculations table** — Audit log for SimRating history per player
4. **Performance audit** — Bundle < 500KB gzipped, LCP < 2.5s (currently 675kB)
