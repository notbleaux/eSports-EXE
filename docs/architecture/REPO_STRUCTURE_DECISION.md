[Ver001.001]

# Repository Structure Decision — NJZ eSports Platform

**Date:** 2026-03-27
**Authority:** `MASTER_PLAN.md §1` (Repository Decision)
**Reviewed At:** Phase 5 entry gate (gate 5.6) · Phase 6 entry gate (gate 6.5)

---

## Decision: Remain Monorepo — Do Not Split (Phase 5)

### Verdict

The NJZ eSports platform **continues as a single monorepo** (`eSports-EXE`) at this phase evaluation point.

### Evaluation Criteria (from MASTER_PLAN.md §1)

| Split Trigger Condition | Current State | Recommendation |
|------------------------|---------------|----------------|
| Team exceeds 8 active developers | Not reached | Stay monorepo |
| CI build times exceed 25 minutes | Under threshold | Stay monorepo |
| Offline Game requires independent versioning | Paused, not production-ready | Stay monorepo |
| Companion App reaches production-ready | Phase 5 stub only | Stay monorepo |

**All four split trigger conditions remain unmet at Phase 5 entry.**

---

## Monorepo Benefits (Current Phase)

1. **Unified CI/CD:** Single GitHub Actions pipeline validates all services, packages, and apps together — critical for catching cross-service type regressions
2. **Shared Package Resolution:** `@njz/types`, `@njz/ui`, `@njz/websocket-client` resolve via pnpm workspace links with zero publish overhead
3. **Coordinated Schema Changes:** A type change in `data/schemas/` is immediately visible to all consumers via TypeScript compilation — no versioning lag
4. **Low DevOps Complexity:** Vercel (frontend), Render.com (API), Supabase (DB), Upstash (Redis) are all configured for this single repo

---

## Planned Split Evaluation — Phase 6 Entry

Re-evaluate at Phase 6 entry (Month 4+). The proposed split architecture if triggered:

```
njz-platform-core         (Current repo — API, DB, shared packages, web app, services)
njz-ecosystem-apps        (Companion, Extension, Overlay, Wiki, Nexus)
njz-simulation            (Godot game, XSim engine)
```

**Pre-conditions required before splitting:**
- [ ] All shared packages published to private npm registry (or GitHub Packages)
- [ ] Independent versioning established per package
- [ ] CI pipelines migrated per repository
- [ ] Deployment configs duplicated and validated

---

## Workspace Structure (Current)

```
eSports-EXE/                   ← Monorepo root
├── apps/
│   ├── web/                   ← Primary platform (Vercel)
│   ├── companion/             ← Mobile companion stub
│   ├── browser-extension/     ← Extension stub
│   ├── overlay/               ← OBS overlay stub
│   ├── wiki/                  ← Wiki stub
│   └── nexus/                 ← Nexus portal stub
├── packages/
│   ├── @njz/types/            ← Canonical TypeScript types
│   ├── @njz/ui/               ← Shared React components
│   ├── @njz/websocket-client/ ← Universal WS client
│   └── shared/                ← FastAPI backend, data pipeline
├── services/
│   ├── tenet-verification/    ← TeneT Key.Links service
│   ├── websocket/             ← Path A live distribution
│   ├── legacy-compiler/       ← Path B data pipeline
│   └── api-gateway/           ← Placeholder
└── platform/
    └── simulation-game/       ← Godot 4 (paused)
```

---

*This document satisfies Phase 5 gate 5.6. Re-evaluate at Phase 6 entry.*

---

## Phase 6 Entry Re-Evaluation (Gate 6.5 — 2026-03-27)

### Verdict: Remain Monorepo — Split Conditions Still Unmet

| Split Trigger Condition | Current State | Recommendation |
|------------------------|---------------|----------------|
| Team exceeds 8 active developers | Not reached | Stay monorepo |
| CI build times exceed 25 minutes | Under threshold | Stay monorepo |
| Offline Game requires independent versioning | Paused, not production-ready | Stay monorepo |
| Companion App reaches production-ready | Phase 6 stub only | Stay monorepo |

**All four split trigger conditions remain unmet at Phase 6 entry.**

### Phase 6 Additions

Since the Phase 5 evaluation, two new apps have been scaffolded:
- `apps/wiki/` — Next.js 14 SSG media and knowledge base
- `apps/nexus/` — Vite+React aggregated World-Port directory

Both consume `@njz/types` and `@njz/ui` as workspace packages and add no new cross-repo dependencies. There is no technical pressure to split at this time.

### Next Evaluation

Re-evaluate when the Companion App (`apps/companion/`) approaches production-ready status or when any trigger condition is met. Estimated checkpoint: Month 6+.

*This document satisfies Phase 6 gate 6.5.*
