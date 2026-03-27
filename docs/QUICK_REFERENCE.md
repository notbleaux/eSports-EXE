[Ver001.000]

# Quick Reference — NJZ eSports Platform

**Purpose:** 1-page cheat sheet for agents and developers. Read this instead of hunting through multiple files.
**Tier:** T1 — load at session start for orientation.

---

## Current Phase Status

| Phase | Status | Next action |
|-------|--------|-------------|
| Phases 0–6 | ✅ COMPLETE | — |
| Phase 7 | ✅ COMPLETE (2026-03-27) | — |
| Phase 8 | 🔒 Blocked on USER_INPUT_REQUIRED | Auth0 setup needed |
| Phase 9 | 🟡 UNLOCKED (concurrent with 8) | Design tokens / UI audit |

→ Full gate status: `.agents/PHASE_GATES.md`
→ Full phase detail: `MASTER_PLAN.md`

---

## Key Commands

```bash
# Development
pnpm run dev:web          # Vite dev server (port 5173)
pnpm run dev:api          # FastAPI dev server (port 8000)

# Build + Validate
pnpm run build            # Build all workspaces
pnpm run typecheck        # TypeScript check across all packages
pnpm run test:unit        # Vitest unit tests
npx playwright test       # E2E tests

# Services
pnpm run docker:up        # Start PostgreSQL + Redis
pnpm run docker:down      # Stop Docker services

# Per-app builds
pnpm --filter @njz/web build
pnpm --filter @njz/wiki build
pnpm --filter @njz/nexus build
pnpm --filter @njz/companion build
pnpm --filter @njz/extension build
pnpm --filter @njz/overlay build
```

---

## Key URLs (Development)

| Service | URL |
|---------|-----|
| Web app | `http://localhost:5173` |
| FastAPI | `http://localhost:8000` |
| API docs | `http://localhost:8000/docs` |
| WebSocket | `ws://localhost:8002/ws` |
| TeneT Verification | `http://localhost:8001/health` |
| Legacy Compiler | `http://localhost:8003/health` |

---

## Architecture in 30 Seconds

```
User → TeNeT (portal) → TeNET /hubs (directory) → /valorant or /cs2 (World-Port)
                                                         ↓
                                              GameNodeID (2×2 Quarter GRID)
                                         SATOR | AREPO | OPERA | ROTAS

Data:
  Live:    Pandascore → Redis Streams → WebSocket → Frontend (Path A)
  Legacy:  All sources → TeneT Key.Links → PostgreSQL → FastAPI → Frontend (Path B)
```

---

## File Locations — Find It Fast

| What you need | Where it is |
|---------------|-------------|
| Hub components | `apps/web/src/hub-{1-4}-*/` |
| Shared types | `packages/@njz/types/src/` |
| Canonical schemas | `data/schemas/` |
| FastAPI routers | `packages/shared/api/src/routers/` |
| WebSocket service | `services/websocket/` |
| TeneT verification | `services/tenet-verification/` |
| Shared UI components | `packages/@njz/ui/src/` |
| E2E tests | `tests/e2e/` |
| Phase gates | `.agents/PHASE_GATES.md` |
| Agent rules | `.agents/AGENT_CONTRACT.md` |
| Schema registry | `.agents/SCHEMA_REGISTRY.md` |
| CODEOWNER checklist | `.agents/CODEOWNER_CHECKLIST.md` |

---

## Commit Format

```
type(scope): description [SAFE|STRUCT|CRIT]

Types: feat, fix, docs, style, refactor, test, chore, delete
Risk: [SAFE] = auto-merge after CI | [STRUCT] = CODEOWNER review | [CRIT] = review + 24h hold
```

Example: `feat(sator): add live match panel [STRUCT]`

---

## Quick Links

- [MASTER_PLAN.md](../MASTER_PLAN.md) — authoritative road-map
- [PHASE_GATES.md](../.agents/PHASE_GATES.md) — go/no-go criteria
- [AGENT_CONTRACT.md](../.agents/AGENT_CONTRACT.md) — agent rules
- [SKILL_MAP.md](../.agents/SKILL_MAP.md) — who does what
- [ESCALATION_PROTOCOL.md](./ai-operations/ESCALATION_PROTOCOL.md) — when to ask vs decide
- [TENET_TOPOLOGY.md](./architecture/TENET_TOPOLOGY.md) — TENET architecture detail
- [SCHEMA_REGISTRY.md](../.agents/SCHEMA_REGISTRY.md) — all canonical types
- [CODEOWNER_CHECKLIST.md](../.agents/CODEOWNER_CHECKLIST.md) — approval-required tasks
