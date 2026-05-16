[Ver001.000]

# Release

Release procedures and deployment surface for NJZiteGeisTe.

## Deployment surfaces

| Surface | Host | Workflow |
|---|---|---|
| Web frontend | Vercel | `.github/workflows/vercel-deploy.yml` |
| API | Render.com | `.github/workflows/deploy.yml` |
| PostgreSQL | Supabase | manual / migrations via `pnpm run db:migrate` |
| Redis | Upstash | managed |

## Release flow

1. Merge approved PRs to `main`.
2. Bump version in `package.json` (semver).
3. Update [`docs/CHANGELOG_MASTER.md`](../CHANGELOG_MASTER.md) (canonical) — the root `CHANGELOG.md` is a pointer.
4. Tag: `git tag -a vX.Y.Z -m "release: vX.Y.Z"` and push tags.
5. CI deploys preview → production per workflow gates.

## Migrations

```bash
pnpm run db:generate    # autogenerate migration from SQLAlchemy models
pnpm run db:migrate     # apply head migration
```

## Rollback

- Vercel: re-promote previous deployment via dashboard
- Render: redeploy previous image tag
- DB: Alembic downgrade only if migration is fully reversible — otherwise restore from Supabase backup

## Deeper references

- [`docs/DEPLOYMENT_GUIDE.md`](../DEPLOYMENT_GUIDE.md)
- [`docs/DEPLOYMENT_FREE_TIER.md`](../DEPLOYMENT_FREE_TIER.md)
- [`docs/CI_CD_PIPELINE.md`](../CI_CD_PIPELINE.md)
- [`docs/API_VERSIONING_POLICY.md`](../API_VERSIONING_POLICY.md)
