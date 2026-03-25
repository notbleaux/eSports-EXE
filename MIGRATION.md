# Migration Log — NJZiteGeisTe Platform

## Phase 1-2: Structure & Branding (Completed)

### Deleted
| Path | Reason |
|------|--------|
| `legacy/` | Legacy static website — replaced by apps/web/ |
| `shared/` (root) | Merged into packages/shared/ |
| `.job-board/` | AI coordination system — archived to archive/.job-board/ |

### Renamed / Moved
| Old Path | New Path | Reason |
|----------|----------|--------|
| `apps/website-v2/` | `apps/web/` | Standardised name |
| `packages/shared/apps/sator-web/` | Scheduled removal | Duplicate of apps/web/ |

### Route Changes (Permanent Redirects Active)
| Old Route | New Route | Hub | User Label |
|-----------|-----------|-----|------------|
| `/sator` | `/analytics` | SATOR | Analytics |
| `/rotas` | `/stats` | ROTAS | Stats |
| `/arepo` | `/community` | AREPO | Community |
| `/opera` | `/pro-scene` | OPERA | Pro Scene |
| `/tenet` | `/hubs` | TENET | Hubs |

### Package Names
| Old Name | New Name |
|----------|----------|
| `libre-x-esport-4njz4-tenet` | `njzitegeist-platform` |
| `@esports-exe/web` | `@njzitegeist/web` |

## Phase 3: Tooling Modernisation (Completed)
- npm → pnpm@8.15.0 (pnpm-workspace.yaml, pnpm-lock.yaml generated)
- Python requirements.txt → Poetry pyproject.toml (packages/shared/api/)
- packages/shared/apps/sator-web/ removed (no external references found)
- services/api/ placeholder created for Phase 4 migration
- infra/docker/ and infra/migrations/ scaffolded
- vercel.json SPA routing fixed (catch-all rewrite)
- infrastructure/vercel.json replaced (was referencing deleted paths)

## Vercel Configuration (Phase 3)

| File | Change |
|------|--------|
| `vercel.json` (root) | `installCommand` → pnpm; `buildCommand` → @njzitegeist/web; broken SPA rewrites replaced |
| `infrastructure/vercel.json` | Completely replaced — was referencing deleted paths (website/, sator-web/) |
| `apps/web/vercel.json` | Legacy `routes` format replaced with `rewrites` |

## Phase 4: Data Layer (In Progress)

### Completed
- SQLAlchemy models created: Player, Team, Match (services/api/src/)
- Alembic migration 001_initial_schema applied (infra/migrations/)
- FastAPI routers scaffolded: /v1/players, /v1/teams, /v1/matches
- TanStack Query hooks added to web app: usePlayers, useTeams, useMatches
- PandaScore API client implemented
- CORS middleware and QueryClientProvider configured in web app

### Next Steps
- DB query implementation (replace stub responses with real queries)
- Hub integration (wire data hooks into SATOR, ROTAS, OPERA hub components)
- Data ingestion pipeline (PandaScore → PostgreSQL via axiom-esports-data)

## Phase 5: SimRating ML + Live Data (IN PROGRESS)
Starting: 2026-03-25

### Goals
- Replace heuristic SimRating with real stats-based ML model
- Implement PandaScore webhook receiver for live match events
- Build player stats ingestion pipeline (K/D/A, win rate, round impact)
- Expand player profile pages with full stats breakdown
- Add community features to AREPO hub (follows, discussions)
- Achieve PWA compliance (offline LandingPage, install prompt)

### Architecture Changes
- New table: player_stats (per-match statistics)
- New table: sim_calculations (SimRating history/audit)
- New endpoint: POST /v1/webhooks/pandascore (live event receiver)
- New service: packages/shared/simengine/ (SimRating calculation service)
