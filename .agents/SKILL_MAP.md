[Ver001.000]

# Agent Skill Map — NJZ eSports Platform

**Purpose:** Capability registry for all agents operating in this repository.
**Tier:** T1 — load when coordinating multi-agent work.
**Authority:** `MASTER_PLAN.md §8` (Sub-Agent Orchestration Model)

An agent reading this file that does NOT recognise its own role must treat itself as a `general-agent` and escalate before taking action.

---

## Controller / CODEOWNER (@notbleaux)

- **Role:** Project owner, final approval authority, human-in-the-loop for CRIT gates
- **Authority:** All CODEOWNER_APPROVAL_REQUIRED touchpoints (see `.agents/CODEOWNER_CHECKLIST.md`)
- **Responsibilities:** Auth0 configuration, production deployment sign-off, betting UI opt-in, archive repo creation
- **Cannot be substituted by:** Any agent

---

## Claude Code (Primary Orchestrator)

- **Role:** Session orchestrator, subagent dispatch, plan execution, code review
- **Domain:** Full repository — reads all, writes as directed by plan
- **Specialisation:** TypeScript, Python/FastAPI, React 18, Vite, GitHub Actions, governance docs
- **Authority:** All non-CRIT commits; STRUCT commits with CODEOWNER approval; CRIT commits with CODEOWNER approval + 24h hold
- **Cannot:** Create new top-level directories without MASTER_PLAN approval; modify MASTER_PLAN.md unilaterally; merge CRIT PRs before 24h hold; begin CODEOWNER_APPROVAL_REQUIRED tasks without CLAIMED → ACTIVE status
- **Escalation triggers:** Schema changes affecting multiple consumers → confirm before committing; new service dependencies → confirm architecture alignment; Auth0/production config → wait for CODEOWNER USER_INPUT_REQUIRED completion

---

## Kimi 2.5 (Deep Research)

- **Role:** Research, design analysis, competitive audit, accessibility review
- **Domain:** Read-only access; outputs to `docs/superpowers/visual-design-book/reports/`
- **Specialisation:** Visual design systems, eSports platform UX patterns, WCAG audit, data visualisation research
- **Authority:** Create research report files in `docs/superpowers/visual-design-book/reports/` only
- **Cannot:** Commit code, modify MASTER_PLAN.md, schema files, or infrastructure
- **Escalation triggers:** Any implementation decision → hand off to Claude Code; any CODEOWNER touchpoint → stop and report
- **Claiming requirement:** Must have CLAIMED → ACTIVE in CODEOWNER_CHECKLIST.md C-7.X before beginning Visual Design Book work

---

## Schema Agent

- **Role:** Type definition and schema maintenance
- **Domain:** `data/schemas/`, `packages/@njz/types/`, `packages/shared/api/schemas/`
- **Specialisation:** TypeScript strict mode types, Pydantic models, cross-service contract alignment
- **Authority:** Type definitions only — no component code, no API routing
- **Cannot:** Modify frontend components, create API routers, touch infrastructure
- **Escalation triggers:** Any type that breaks an existing consumer → confirm before committing; any Pydantic model that changes an existing API response shape → STRUCT PR required

---

## Frontend Agent

- **Role:** UI component implementation, hub routing, web app feature work
- **Domain:** `apps/web/src/`, `packages/@njz/ui/`
- **Specialisation:** React 18, Framer Motion, TanStack Query, Three.js/R3F, TENET routing layer
- **Authority:** Components, hooks, routes, styles — imports from `@njz/types` only (no inline type definitions)
- **Cannot:** Add inline type definitions; create services/ code; touch infra or CI
- **Escalation triggers:** UX decisions affecting multiple hubs → confirm; any Three.js/WebGL performance tradeoff → confirm

---

## Backend Agent

- **Role:** API service implementation, service layer, database migrations
- **Domain:** `packages/shared/api/`, `services/`
- **Specialisation:** FastAPI, asyncpg, Redis, Pydantic, circuit breakers, rate limiting
- **Authority:** API routers, Pydantic models, service logic, Alembic migrations
- **Cannot:** Touch frontend components; create new services not in MASTER_PLAN; modify CI/CD
- **Escalation triggers:** New Alembic migration → STRUCT PR; changes to public API response shape → CRIT review

---

## Pipeline Agent

- **Role:** Data ingestion, scraping, ETL, legacy-compiler service
- **Domain:** `packages/shared/axiom-esports-data/`, `services/legacy-compiler/`
- **Specialisation:** Scrapy, BeautifulSoup, robots.txt compliance, Pandascore webhook handling
- **Authority:** ETL scripts, scraper configs, data normalisation
- **Cannot:** Touch frontend, modify API gateway, access production databases directly
- **Escalation triggers:** New data source requiring API credentials → CODEOWNER input; robots.txt edge cases → confirm

---

## Infra Agent

- **Role:** CI/CD, GitHub Actions, Docker, deployment configuration
- **Domain:** `infra/`, `.github/workflows/`, `docker-compose*.yml`
- **Specialisation:** GitHub Actions YAML, Docker Compose, Vercel/Render deployment configs
- **Authority:** CI/CD workflows, container configs, deployment scripts
- **Cannot:** Modify application code; change `package.json` dependencies without STRUCT review
- **Escalation triggers:** Any change to production deployment config → CRIT PR required

---

## Docs Agent

- **Role:** Documentation maintenance, architecture docs, agent coordination files
- **Domain:** `docs/`, `AGENTS.md`, `CLAUDE.md`, `.agents/` (non-contract files)
- **Specialisation:** Markdown, version headers, doc-tier compliance, archive management
- **Authority:** Documentation files — all commits are `[SAFE]` unless modifying MASTER_PLAN.md or AGENT_CONTRACT.md
- **Cannot:** Modify `MASTER_PLAN.md`, `AGENT_CONTRACT.md`, or `PHASE_GATES.md` without explicit user instruction
- **Escalation triggers:** Any doc tier reclassification → confirm with CODEOWNER

---

## Future Agent Slots

| Role | Phase Needed | Specialisation |
|------|-------------|----------------|
| Godot Agent | Phase 13 | GDScript, Godot 4, XSim engine |
| Mobile Agent | Phase 10 | React Native, Expo SDK, EAS Build |
| Extension Agent | Phase 11 | Manifest V3, WebExtension Polyfill |

---

## Quick Escalation Reference

| Situation | Action |
|-----------|--------|
| About to make a schema change | Confirm with user before STRUCT PR |
| Blocked by missing credentials | Check CODEOWNER_CHECKLIST.md — if listed, report to CODEOWNER |
| Uncertain which agent owns a file | Check domain boundaries above |
| Task is in CODEOWNER_APPROVAL_REQUIRED | STOP — confirm CLAIMED → ACTIVE in CODEOWNER_CHECKLIST.md |
| Phase N+1 starts but USER_INPUT_REQUIRED pending | STOP — report to user, list required inputs |
