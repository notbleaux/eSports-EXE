[Ver001.000]

# Onboarding

Goal: a new contributor reaches a green local environment in under one hour.

## 1. Required reading (in order)

1. [`README.md`](../../README.md) — Product overview
2. [`CLAUDE.md`](../../CLAUDE.md) — Architecture rules (TENET topology, hub model)
3. [`MASTER_PLAN.md`](../../MASTER_PLAN.md) — Current phase and scope
4. [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — Workflow conventions
5. [`docs/architecture/TENET_TOPOLOGY.md`](../architecture/TENET_TOPOLOGY.md) — Data networking topology

If you're an AI agent, also read `.agents/AGENT_CONTRACT.md` and `.agents/PHASE_GATES.md`.

## 2. Local setup

```bash
# 1. Use the right Node version
nvm use   # reads .nvmrc

# 2. Copy env template
cp .env.example .env.local

# 3. Install & set up
pnpm install
pnpm run setup        # cross-platform; delegates to scripts/setup-local.{sh,ps1}

# 4. Start services
pnpm run docker:up    # PostgreSQL + Redis
pnpm run dev:api      # FastAPI on :8000
pnpm run dev:web      # Vite on :5173
```

See [`docs/COMPREHENSIVE_SETUP_PROCEDURES.md`](../COMPREHENSIVE_SETUP_PROCEDURES.md) for the deep dive (databases, secrets, troubleshooting).

## 3. Pre-PR confidence check

```bash
pnpm run check        # typecheck + unit tests
```

CI runs lint, typecheck, unit, e2e, security, and firewall tests — see [`docs/testing/`](../testing/).

## 4. First commit

- Branch naming: `<type>/<short-slug>` (e.g. `feat/sator-rating-tooltip`)
- Commit format: see [`docs/GIT_COMMIT_CONVENTION.md`](../GIT_COMMIT_CONVENTION.md)
- Open PR using one of the templates in `.github/pull_request_template/`

## 5. Where things live

| You want to... | Look in |
|---|---|
| Edit web UI | `apps/web/src/` (hubs are `hub-1-sator` ... `hub-5-tenet`) |
| Change API | `packages/shared/api/` |
| Add a schema | `data/schemas/` (then update `.agents/SCHEMA_REGISTRY.md`) |
| Add a workflow | `.github/workflows/` |
| Document a decision | `docs/adrs/` (ADR template at `docs/governance/ADR-TEMPLATE.md`) |
