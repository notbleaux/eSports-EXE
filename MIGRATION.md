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

## Phase 4: Python Consolidation (Planned)
- packages/shared/api/ → services/api/src/
