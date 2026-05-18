[Ver001.004]

# Agent Contract — NJZ eSports Platform

**Status:** ACTIVE — All agents operating in this repository are bound by this contract.
**Supersedes:** `.agents/COORDINATION_PROTOCOL.md` (JLB-based system, archived)
**Authority:** This contract + `MASTER_PLAN.md` + `CLAUDE.md` + `.agents/AGENT_ID_PROTOCOL.md` together form the agent operating framework.
**Multi-Agent Context:** This repository currently operates with 3 active agent lineages: Claude (Anthropic), GitHub Copilot, and Kimi (Moonshot AI). All must coordinate through the Shared Context Framework defined in `.agents/COORDINATION_PROTOCOL.md`.

---

## Before Starting Any Task

An agent MUST complete the 5-stage Session Lifecycle (full detail: `docs/ai-operations/SESSION_LIFECYCLE.md`) before writing a single line of code.

**Stage 1 — Cleanup:** Delete `.agents/session/` files from the previous session (anything older than today). Check for stale root `.md` files and archive them. Check for fragment clusters — consolidate into dossiers before archiving.

**Stage 2 — Orient (read in this order):**

1. `MASTER_PLAN.md` — Current phase, what is in scope, what is not
2. `.agents/PHASE_GATES.md` — Confirm the phase you are working on is unlocked
3. `.agents/CODEOWNER_CHECKLIST.md` — Check for UNCLAIMED / PENDING USER_INPUT_REQUIRED. **If any exist for the current phase: STOP and report to user before proceeding.**
4. `.agents/COORDINATION_PROTOCOL.md` — Check for active shared contexts, claimed branches, and agent lock status
5. `.agents/session/CONTEXT_FORWARD.md` — Previous session handoff (check DO NOT REDO list)
6. `.agents/phase-logbooks/Phase-N-LOGBOOK.md` — Current phase history
7. `.agents/SCHEMA_REGISTRY.md` — Check relevant types before creating any
8. `CLAUDE.md` — Code conventions and commit format
9. `.agents/AGENT_ID_PROTOCOL.md` — Current agent identity and counter state

**Stage 3 — Plan:** Create `.agents/session/NOTEBOOK-YYYY-MM-DD.md` and `.agents/session/TODO-YYYY-MM-DD.md`. Sync TODO from the current phase checklist in MASTER_PLAN.md. **If working in shared context:** Append your plan to the active Collaboration Runbook (`.agents/session/SHARED_CONTEXT.md` or `.agents/channels/broadcast/YYYY-MM-DD-shared.md`).

**Stage 4 — Work:** Execute tasks. Run drift check before each new gate (re-read phase section in MASTER_PLAN.md; if what you're about to do is NOT there, stop and confirm). **If another agent is active in shared context:** Check `.agents/active/` for lock files before modifying any non-owned domain.

**Stage 5 — Close:** Update PHASE_GATES.md for completed gates. Append to Phase Logbook. Write CONTEXT_FORWARD. **Update the Collaboration Runbook with your completion summary.** Run archiving/deletion final check.

If any of these files cannot be read (missing, corrupted), **stop and report** before proceeding.

---

## Multi-Agent Shared Context Rules (NEW)

When ≥2 agents are concurrently active (Claude, Copilot, Kimi), the following rules apply:

### Shared Context Declaration
Before beginning work, an agent MUST check `.agents/active/` and `.agents/channels/broadcast/` for an active shared context declaration. If one exists, the agent MUST append its identity and intended workstream to the declaration rather than creating a new one.

### Domain Ownership in Shared Context
| Domain | Primary Owner | Shared Context Rule |
|--------|--------------|---------------------|
| `schema` | First agent to touch schema files | Lock required; schema changes must be committed before other domains can proceed |
| `frontend` | Agent declared in shared context | Concurrent work allowed on **different** hub components; same file requires coordination |
| `backend` | Agent declared in shared context | Same-file changes require lock; different endpoints can proceed in parallel |
| `pipeline` | Single agent per ETL job | No concurrent pipeline work on same connector/transformer |
| `infra` | First agent to claim CI/CD files | Lock required; workflow changes are high-friction |
| `docs` | Any agent | Concurrent docs work allowed; merge conflicts resolved via CODEOWNER |
| `test` | Parallel execution encouraged | Test files are low-friction; run tests independently |

### Conflict Prevention in Shared Context
1. **Pre-flight check:** Before any file modification, check if another agent has modified the same file in an unmerged PR
2. **Staggered commits:** Agents in shared context should commit every 15-30 minutes (not batch at end) so others see changes incrementally
3. **Broadcast significant changes:** Any change that affects >3 files or modifies a shared interface MUST be broadcast to `.agents/channels/broadcast/`
4. **Merge-first rule:** When conflicts arise, the agent whose changes are smaller/more focused merges first; the other rebases

---

## Subagent Payload Schema

When dispatching a subagent, provide exactly this context — no more, no less:

```
[Gate Number]: [N.X — name of gate]
[Phase Status Summary]: From CONTEXT_FORWARD.md — current phase, last 3 PASSED gates, DO NOT REDO list
n[Task Description]: [specific, bounded task — one gate only]
[Expected Deliverables]: [C1 measurable outcome] / [files to create or modify] / [verification command]
[Commit Convention]: [type(scope): description [RISK-TAG]]
[Shared Context Status]: [ACTIVE / NONE — if ACTIVE, reference .agents/session/SHARED_CONTEXT.md]
```

**Never include in subagent payload:**
- Full MASTER_PLAN.md (too large; provide only the current phase section if needed)
- Full PHASE_GATES.md (provide only the current gate row)
- Full AGENT_CONTRACT.md (subagents are dispatched workers, not coordinators)
- Full COLLABORATION_RUNBOOK (provide only the current task row)

**If subagent returns BLOCKED status:** Re-dispatch with the specific missing context added. Do not retry without change.

---

## Auth Expansion Trigger

Current authorization model: single CODEOWNER (`@notbleaux`). This is correct for solo operation.

**Upgrade to 4-class auth when:** >3 concurrent workers operate on the repo in a single sprint.

4-class model (for future reference only — do NOT implement until trigger condition is met):
- Class A: MASTER-tier decisions — repo owner only
- Class B: Phase gate approval — repo owner or designated lead
- Class C: Domain work execution — any authorized agent
- Class D: Read-only audit — any observer

Until trigger: single-owner model remains. Do not add auth infrastructure preemptively.

---

## Phase Iteration Versioning

If a phase must be re-entered after completion (regression, scope change, or critical artifact loss):

1. Do NOT overwrite the existing Phase-N-LOGBOOK.md
2. Create `Phase-N-LOGBOOK-Iteration-2.md` (increment for further re-entries)
3. Add header: `[Re-entry: YYYY-MM-DD — Reason: [regression/scope-change/artifact-loss]]`
4. Update PHASE_GATES.md: add `[Re-entry: YYYY-MM-DD]` note to affected gates
5. MASTER_PLAN.md: note re-entry under the phase checklist

This preserves the original phase completion record while tracking re-entry separately.

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
- **In shared context:** Modify a file locked by another agent without coordination (see `.agents/COORDINATION_PROTOCOL.md`)
- **In shared context:** Force-push to a branch that another agent is actively working on

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
- **In shared context:** Sign off all commits with Agent ID per `.agents/AGENT_ID_PROTOCOL.md`
- **In shared context:** Broadcast changes affecting >3 files to `.agents/channels/broadcast/`

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
3. Read `.agents/COORDINATION_PROTOCOL.md` to check shared context status
4. Work within your declared domain
5. After completing a significant unit of work, update `AGENTS.md` under the relevant phase section
6. **In shared context:** Append progress to the active Collaboration Runbook
7. For parallel work, the schema boundary is the synchronization point — schema must be committed before dependent domains start

**There is no foreman, no lock system, no timing schedule.** The schema contract, phase gates, and shared context declaration are the coordination mechanisms.

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
- [ ] **If in shared context:** Collaboration Runbook updated with completion summary and next actions

---

## Agent ID Sign-Off (Phase 0 — advisory)

All agents working in this repo are encouraged (not yet required) to sign off their commits and PRs per the canonical schema:

```
agent://<lineage>/<model>/<session>/<order>
```

Full protocol: `.agents/AGENT_ID_PROTOCOL.md`.
Central registry (interim, in-repo): `polyrepo/registry/index.json`.
Lineage discovery rules: `.agents/lineage-discovery.yaml`.

**Canonical codes for this repo:**
- Repo short code: **`ZSXT`** (ZeSporteXte)
- Portfolio code: **`NJZPL`** (NeXeZ portfolio root)

**Where to sign off:**
- Git commit trailer (required for Phase 1+; advisory now)
- PR body frontmatter (parseable by CI in Phase 1+)
- Append-only audit log at `polyrepo/registry/log.jsonl`

**Exemptions:** Dependabot, `agent-id-exempt`-labelled PRs, squash-merge child commits.

Phase 0 introduces this advisory layer; enforcement progresses through Phases 1–4 (soft → required → cryptographically verified → networked) as the Zero-Trust Network API rollout lands. See `MASTER_PLAN.md` and the v002 multi-phase plan for the full progression.

---

*Agents that ignore this contract produce drift. Drift compounds. The contract exists to prevent the accumulated mess that occurs when each agent improvises.*
*In shared contexts, the Collaboration Runbook is the single source of truth for who is doing what right now.*
