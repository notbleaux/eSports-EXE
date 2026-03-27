[Ver001.002]

# Agent Contract — NJZ eSports Platform

**Status:** ACTIVE — All agents operating in this repository are bound by this contract.
**Supersedes:** `.agents/COORDINATION_PROTOCOL.md` (JLB-based system, archived)
**Authority:** This contract + `MASTER_PLAN.md` + `CLAUDE.md` together form the agent operating framework.

---

## Before Starting Any Task

An agent MUST complete the 5-stage Session Lifecycle (full detail: `docs/ai-operations/SESSION_LIFECYCLE.md`) before writing a single line of code.

**Stage 1 — Cleanup:** Delete `.agents/session/` files from the previous session (anything older than today). Check for stale root `.md` files and archive them. Check for fragment clusters — consolidate into dossiers before archiving.

**Stage 2 — Orient (read in this order):**

1. `MASTER_PLAN.md` — Current phase, what is in scope, what is not
2. `.agents/PHASE_GATES.md` — Confirm the phase you are working on is unlocked
3. `.agents/CODEOWNER_CHECKLIST.md` — Check for UNCLAIMED / PENDING USER_INPUT_REQUIRED. **If any exist for the current phase: STOP and report to user before proceeding.**
4. `.agents/session/CONTEXT_FORWARD.md` — Previous session handoff (check DO NOT REDO list)
5. `.agents/phase-logbooks/Phase-N-LOGBOOK.md` — Current phase history
6. `.agents/SCHEMA_REGISTRY.md` — Check relevant types before creating any
7. `CLAUDE.md` — Code conventions and commit format

**Stage 3 — Plan:** Create `.agents/session/NOTEBOOK-YYYY-MM-DD.md` and `.agents/session/TODO-YYYY-MM-DD.md`. Sync TODO from the current phase checklist in MASTER_PLAN.md.

**Stage 4 — Work:** Execute tasks. Run drift check before each new gate (re-read phase section in MASTER_PLAN.md; if what you're about to do is NOT there, stop and confirm).

**Stage 5 — Close:** Update PHASE_GATES.md for completed gates. Append to Phase Logbook. Write CONTEXT_FORWARD. Run archiving/deletion final check.

If any of these files cannot be read (missing, corrupted), **stop and report** before proceeding.

---

## Domain Boundaries

Every agent must identify its domain before starting work. A task belongs to the domain that owns the **primary modified file**.

| Domain | Primary Files | Agent Role |
|--------|--------------|------------|
| `schema` | `data/schemas/`, `packages/@njz/types/`, `packages/shared/api/schemas/` | Define only. No component code. |
| `frontend` | `apps/web/src/`, `packages/@njz/ui/` | Components, hooks, routes, styles |
| `backend` | `packages/shared/api/`, `services/` | Routers, models, services, migrations |
| `pipeline` | `packages/shared/axiom-esports-data/`, `services/legacy-compiler/` | ETL, scrapers, data sync |
| `infra` | `infra/`, `.github/workflows/`, `docker-compose*.yml` | CI/CD, containers, deployment |
| `docs` | `docs/`, `AGENTS.md`, `CLAUDE.md`, `MASTER_PLAN.md` | Documentation only |
| `test` | `tests/`, `*.spec.ts`, `*.spec.py` | Tests only |

### Cross-Domain Work Protocol

If your task requires changes in more than one domain:

1. **Identify the interface boundary** (usually a schema/type)
2. **Schema changes first:** Complete schema-domain work, verify TypeScript passes, then proceed
3. **Sequential, not parallel:** Do not write frontend code that depends on a type you haven't finished defining
4. If splitting across agents: schema-agent completes and commits, then frontend-agent begins

---

## Prohibited Actions

**Never, under any circumstances:**

- Create a new top-level directory at the repo root without explicit approval in `MASTER_PLAN.md`
- Add files to the repo root that are not in the allowed list in `MASTER_PLAN.md §10`
- Modify `MASTER_PLAN.md`, `AGENT_CONTRACT.md`, or `PHASE_GATES.md` unless you are a `docs-agent` with explicit user instruction
- Create type definitions that duplicate what exists in `data/schemas/` or `packages/@njz/types/`
- Treat TENET as a content hub — it is a navigation and data-verification layer (see `MASTER_PLAN.md §2`)
- Add a new Phase to `AGENTS.md` without updating `MASTER_PLAN.md` and `PHASE_GATES.md`
- Commit secrets, API keys, or database URLs
- Use `--no-verify` on commits
- Create `TODO.md`, `QUICK_FIX_GUIDE_*.md`, `IMPLEMENTATION_SUMMARY_*.md` at the root
- Begin any task listed in `.agents/CODEOWNER_CHECKLIST.md` without that task showing `CLAIMED → ACTIVE` status confirmed by @notbleaux
- Merge or approve a `[CRIT]` PR before the 24-hour hold period has elapsed after CODEOWNER approval

---

## Required Practices

**Always:**

- Follow Conventional Commits: `type(scope): description - context`
- Version all new `.md` files with `[VerMMM.mmm]` header
- Write or update tests alongside code changes (test-domain agent may parallel)
- Update `AGENTS.md` known gaps when you discover them
- Reference schema types from `@njz/types` or `data/schemas/` — do not inline new types in component files
- When adding a new API endpoint: update `docs/API_V1_DOCUMENTATION.md`
- When adding a new service: add `README.md`, health check, and at least one unit test

---

## TENET Terminology — Critical Reference

Agents must use this terminology consistently:

| Term | Correct Usage |
|------|--------------|
| `TeNeT` | The user-facing Home Portal / entry page |
| `TeNET` | The Network Directory — routes to World-Ports |
| `World-Port` | Game-specific entry point (e.g., `/valorant`, `/cs2`) |
| `GameNodeID` | The base unit carrying the 2×2 Quarter GRID |
| `TeZeT` | World-Tree within each Quarter — hub-specific composition |
| `tenet` (lowercase) | Network channels / data directory / DB directory |
| `TeneT Key.Links` | The verification bridge pipeline |
| `SATOR` | Analytics hub (route: `/analytics`) |
| `AREPO` | Community hub (route: `/community`) |
| `OPERA` | Pro Scene hub (route: `/pro-scene`) |
| `ROTAS` | Stats/Simulation hub (route: `/stats`) |

**hub-5-tenet is NOT a content hub.** It is the TeNET navigation layer component directory.

---

## Coordination Between Agents

**How agents coordinate now:**
1. Read `MASTER_PLAN.md` to understand current phase and priorities
2. Read `.agents/PHASE_GATES.md` to confirm phase is unlocked
3. Work within your declared domain
4. After completing a significant unit of work, update `AGENTS.md` under the relevant phase section
5. For parallel work, the schema boundary is the synchronization point — schema must be committed before dependent domains start

**There is no foreman, no lock system, no timing schedule.** The schema contract and phase gates are the coordination mechanism.

---

## Definition of Done

A task is complete when:

- [ ] Code compiles / TypeScript passes
- [ ] Relevant tests pass (`pnpm test:unit` or `pytest` as appropriate)
- [ ] No new TypeScript `any` types introduced without comment explaining why
- [ ] No new files at repo root
- [ ] `AGENTS.md` updated with completed work under correct phase
- [ ] If new types were introduced: `.agents/SCHEMA_REGISTRY.md` updated
- [ ] If a Phase Gate is now met: `.agents/PHASE_GATES.md` updated
- [ ] Session Notebook updated with decisions made
- [ ] Session TODO items marked `[x]`
- [ ] Stage 5 close completed: logbook appended, CONTEXT_FORWARD written

---

*Agents that ignore this contract produce drift. Drift compounds. The contract exists to prevent the accumulated mess that occurs when each agent improvises.*
