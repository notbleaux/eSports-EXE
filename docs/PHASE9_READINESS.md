[Ver001.000]
# Phase 9 Readiness — NJZiteGeisTe Platform

## Resolved in Phase 9
- usePlayerStats URL double-path bug (critical, would cause 404 on all stats requests)
- OAuth CSRF vulnerability (critical security fix)
- Missing auth DB tables (would crash OAuth login)
- GitHub OAuth provider (was missing, only Google + Discord existed)
- PostgreSQL version mismatch (docker-compose had v14, codebase targets v15)
- Corrupted test_api_firewall.py (UTF-16 encoding, unrunnable)
- ML initMLBackend() never called (ML ratings were never computed)

## Known Gaps Before Production
| Gap | Severity | Notes |
|-----|----------|-------|
| ML training on real data | High | Currently 2K synthetic samples |
| Forum in-memory store | Medium | Data lost on restart — needs DB migration |
| EsportsCalendar `scheduled_at` field | Medium | Match model may not have this field |
| data-partition-lib TODO | Medium | Recursive filtering not implemented |
| E2E coverage 28 vs 95+ | Medium | Needs test expansion sprint |
| VAPID keys not generated | Low | Push notifications won't fire without |

## Pre-Deploy Minimum Checklist
- [ ] Run `alembic upgrade head` (all 4 migrations)
- [ ] Run `python packages/shared/api/scripts/sync_pandascore.py` (seed data)
- [ ] Set all env vars in docs/PRE_DEPLOY_CHECKLIST.md
- [ ] Run `bash tests/smoke/smoke_test.sh` (all 9 endpoints)
- [ ] Verify Vite build: `pnpm run build` exits 0
