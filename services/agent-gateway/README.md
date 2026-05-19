[Ver001.000]

# services/agent-gateway

**Status:** Phase 3.5 (Supabase cloud mirror) — in development; Phase 3 SQLite WAL shipped (PR #65)
**Plan:** `PLN-003-network-api` (multi-phase rollout, Phases 1–7)
**Owner:** `notbleaux/ZeSporteXte` repo (project `ZSXT`, portfolio `NJZPL`)
**Protocol:** `.agents/AGENT_ID_PROTOCOL.md` (Phase 1, soft enforcement)

---

## What this is

A new internal service for **agent coordination + identity attestation**, separate from the existing eSports data API (`packages/shared/api`). It implements the Zero-Trust Network API described in plan v002 (`/root/.claude/plans/plan-and-draft-the-elegant-widget.md`) — a decentralized choreography layer for multi-agent collaboration (Claude / Kimi / MiMo / Hermes / Copilot / etc.).

This is intentionally a **separate service** from `packages/shared/api`:

| Concern | `packages/shared/api` | `services/agent-gateway` (this) |
|---|---|---|
| Domain | eSports data (matches, players, stats) | Agent coordination ledger (tasks, bids, signatures) |
| Auth | JWT / OAuth | ECDSA secp256k1 signed payloads |
| Persistence | PostgreSQL via Supabase | SQLite (WAL) → Supabase failover (Phase 3) |
| Lifecycle | User-facing API | Internal / multi-agent only |
| Upgrade cadence | Product-driven | Protocol-driven |

## Roadmap

| Phase | Scope | Status | Tracking PR |
|---|---|---|---|
| **Phase 1** | ECDSA crypto baseline + local signing client | ✅ shipped | PR #46 |
| **Phase 1.5** | First public key registered | ✅ shipped | PR #48 |
| **Phase 1.6** | Sign-off helper CLI + key-gen runbook | ✅ shipped | PR #49, #55 (review fixes) |
| **Phase 2 (scaffold)** | FastAPI app + signature middleware + `/health` | ✅ shipped | PR #56 |
| **Phase 2 (endpoints)** | `/tasks/create`, `/bid`, `/submit` + in-memory blackboard | ✅ shipped | PR #57, #58 |
| **Phase 2 (OpenAPI)** | Export `openapi.json` + CI drift check — **v1.0.0 OKR hit** | ✅ shipped | PR #59 |
| **Phase 3** | Persistent storage (SQLite WAL, FK constraints, schema bootstrap) | ✅ shipped | PR #65 |
| **Phase 3.5** | Supabase cloud mirror (write-only, env-gated, fire-and-forget) | **🟡 IN DEVELOPMENT** | this PR |
| Phase 4 | Hermes-MiMo worker node (OpenRouter integration) | **⚠️ blocked** on user infra | — |
| Phase 5 | Real-time Pub/Sub (Redis 7) | scoped | — |
| Phase 6 | Production edge (Caddy + Docker Compose prod) | **⚠️ blocked** on user infra | — |
| Phase 7 | Telemetry + multi-platform fallbacks | scoped | — |

## Phase 3 scope (this PR)

**Goal:** swap the Phase 2 in-memory dict for a SQLite-backed Blackboard so tasks survive process restarts, with WAL journal mode for concurrent readers + FK constraints for referential integrity.

**Deliverables in this PR:**
1. `blackboard.py` rewritten — same Task/TaskStatus/TaskStateError/Blackboard surface, internal storage swapped from `dict` to `sqlite3` with WAL + FK ON DELETE CASCADE
2. `tests/conftest.py` (NEW) — forces `AGENT_GATEWAY_DB_PATH=:memory:` so tests don't touch on-disk default
3. `tests/test_persistence.py` (NEW, 10 tests) — durability across restarts, FK cascade, list_open filter, full hand-off chain reloaded from disk
4. `.gitignore` — exclude `services/agent-gateway/data/` (the default DB directory)

**Out of scope for this PR:**
- Supabase failover (Phase 3.5 — separate PR; needs supabase-py + connection string + writer migration logic)
- Alembic-style migrations (Phase 3.5+ — currently using `CREATE TABLE IF NOT EXISTS` idempotency)
- WAL checkpoint tuning / backup procedures (Phase 7 telemetry)

**Schema (created by `CREATE TABLE IF NOT EXISTS`):**

```sql
tasks (
    id PRIMARY KEY, creator_agent_id, description, status,
    created_at REAL, metadata JSON, claimer_agent_id
)
INDEX idx_tasks_status ON tasks(status)

task_contributions (
    id PRIMARY KEY AUTOINCREMENT, task_id FK, kind, agent_id, payload JSON, at REAL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
)
INDEX idx_contributions_task ON task_contributions(task_id)
```

**Configuration:**
- Default DB path: `services/agent-gateway/data/agent-gateway.db`
- Env override: `AGENT_GATEWAY_DB_PATH` (use `:memory:` for ephemeral)

**Acceptance criteria:**
- `pytest services/agent-gateway/tests/` passes 33/33 (5 + 5 + 9 + 4 + 10 new)
- Tasks created via `/tasks/create` survive an `uvicorn` restart
- FK cascade verified: deleting a task removes its contributions
- OpenAPI spec unchanged (storage swap is internal — no route/schema delta)

## Phase 3.5 scope (this PR)

**Goal:** mirror every successful local task-lifecycle write to a Supabase project for disaster recovery. SQLite is the source of truth; Supabase is async-replicated, write-only from the gateway's POV. Mirror failures never propagate to API callers.

**Deliverables in this PR:**
1. `supabase_mirror.py` (NEW, ~250 lines) — `SupabaseMirror` async write-mirror via Supabase REST API. No new runtime deps (stdlib `urllib.request` + `json`). Fire-and-forget queue drained by a daemon thread. `default_mirror` singleton built from env at import time.
2. `blackboard.py` — `Blackboard.__init__` accepts an optional `mirror` parameter; `create`/`bid`/`submit` call `mirror_task_insert`/`mirror_task_update`/`mirror_contribution` after each SQLite commit (outside the lock, non-blocking)
3. `tests/test_supabase_mirror.py` (NEW, 6 tests) — disabled-mirror no-op, enabled posts via mocked urlopen, pending count, 404 graceful degrade, Blackboard wiring verification
4. `tests/conftest.py` — also strips `SUPABASE_URL`/`SUPABASE_KEY` from env so `default_mirror` is no-op during tests

**Activation:**
```bash
export SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_KEY="<service-role-jwt-or-anon-with-rls>"
uvicorn services.agent_gateway.app:app --port 8001
```

**Operator one-time setup** (Supabase MCP or dashboard):
```sql
create table agent_gateway_tasks (
    id text primary key,
    creator_agent_id text not null,
    description text not null,
    status text not null,
    created_at double precision not null,
    metadata jsonb not null default '{}'::jsonb,
    claimer_agent_id text,
    mirrored_at double precision not null default extract(epoch from now())
);
create table agent_gateway_contributions (
    id bigserial primary key,
    task_id text not null references agent_gateway_tasks(id) on delete cascade,
    kind text not null,
    agent_id text not null,
    payload jsonb not null default '{}'::jsonb,
    at double precision not null
);
```

If tables don't exist, the mirror logs a one-time warning and degrades to no-op for the rest of the run.

**Acceptance criteria:**
- `pytest services/agent-gateway/tests/` passes 39/39 (33 + 6 new mirror tests)
- With `SUPABASE_URL`/`SUPABASE_KEY` unset → mirror is silent no-op (no thread spawned, no network calls)
- With env set → POST bodies match `agent_gateway_tasks` / `agent_gateway_contributions` schema
- OpenAPI spec byte-identical (no API surface change)

## Phase 2 scaffold scope (shipped — PR #56)

**Goal:** ship a FastAPI app skeleton that future Phase 2 PRs can attach endpoints to, with the signature-verification middleware proven against the registered ECDSA keys from Phase 1.5.

**Deliverables in this PR:**
1. `app.py` — FastAPI app, signature-verification middleware, `/health` endpoint
2. `requirements.txt` — fastapi + uvicorn + ecdsa + httpx/pytest for tests
3. `tests/test_app.py` — 5 tests: `/health` public, middleware rejects missing/stale/bad-sig/unknown-agent
4. README update (this section)

**Out of scope for this scaffold PR** (deliberately — each gets its own focused PR):
- `/tasks/create` endpoint + in-memory task blackboard
- `/tasks/{id}/bid`, `/tasks/{id}/submit` endpoints
- Persistent storage (Phase 3)
- OpenAPI 3.1 spec export (subsequent Phase 2 PR — hits v1.0.0 OKR)

**Acceptance criteria:**
- `pip install -r services/agent-gateway/requirements.txt` succeeds
- `pytest services/agent-gateway/tests/` passes 5/5
- `uvicorn services.agent_gateway.app:app --port 8001` starts; `curl localhost:8001/health` returns 200
- Middleware verifies an ECDSA signature against a registered `public_keys` entry from the central registry

## Phase 1 scope (shipped — PR #46)

**Goal:** ship a self-contained ECDSA signing client that future phases can import, without any network calls or external dependencies.

**Deliverables in this PR:**
1. `crypto_client.py` — `SecureAgentClient` class with keygen + signature generation (reference implementation from plan v002's blueprint)
2. This `README.md`

**Out of scope for Phase 1** (deliberately):
- Any network calls (Phase 2 introduces the FastAPI gateway)
- Public key registration into `polyrepo/registry/index.json::public_keys` (manual one-time step per agent owner, runs once after this lands)
- Unit tests (follow-up commit; want this PR to be a clean reference impl review first)
- Integration with `.agents/AGENT_ID_PROTOCOL.md` sign-off generation (Phase 1.5)

**Acceptance criteria:**
- `pip install ecdsa` succeeds (no other runtime deps)
- `python crypto_client.py --help` prints usage
- Running the module's `__main__` block:
  - Generates a new keypair if `keys/{agent_id}_private.pem` doesn't exist
  - Loads existing keypair otherwise
  - Prints the public hex (for manual registration into the central registry)
  - Generates valid auth headers (X-Agent-ID, X-Signature, X-Timestamp)
  - Verifies a roundtrip signature succeeds

## Why ECDSA secp256k1?

Same curve as Bitcoin and Ethereum — well-audited, library-mature, deterministic signatures via DER encoding. The agent ID protocol (Phase 0) and the future network API (Phase 2+) both use this curve consistently. No interop break with external attestation tooling (sigstore, GitHub commit signing, etc.).

## Key storage

`keys/` directory is **gitignored** (will be added in a follow-up commit if not already covered by existing `.gitignore` rules). Each agent owns its own private key, never shared. Only public hex is registered in `polyrepo/registry/index.json::public_keys`.

For local development each agent generates its keypair on first run. For production deployment, keys are mounted into the container as a volume (Phase 4+).

## How this fits into the agent lifecycle

```
1. Agent boots
   ├── Reads .agents/lineage-discovery.yaml → resolves own (lineage, model)
   └── Reads/generates keys/{agent_id}_private.pem via SecureAgentClient

2. Agent claims session order
   ├── Reads polyrepo/registry/index.json::agents/{lineage}.next
   ├── Bumps next counter, writes back
   └── Captures session ID + order

3. Agent signs each commit/action
   ├── Generates X-Agent-ID + X-Signature + X-Timestamp via SecureAgentClient
   ├── Appends Agent-Sign-Off trailer to commit message
   └── (Phase 4+) POSTs signed payload to network API gateway

4. Network API verifies signature
   └── Looks up public key in polyrepo/registry/index.json::public_keys
   └── Rejects payload if signature invalid OR timestamp > 60s old

Phase 1 implements steps 1 + 3 (signature generation only).
Phase 2 implements step 4 (verification at gateway).
```

## Out of scope for `services/agent-gateway` (entire service)

- Modifying `packages/shared/api` — agent gateway is a separate service
- Replacing existing observability/logging infrastructure — gateway is additive
- Implementing the Hermes-MiMo runtime itself — gateway provides the channel; the runtime lives in `services/hermes-host/` (Phase 4, separate service)

## References

- Plan v002: `/root/.claude/plans/plan-and-draft-the-elegant-widget.md` (multi-phase roadmap)
- Agent ID Protocol: `.agents/AGENT_ID_PROTOCOL.md` (Phase 0, advisory)
- **Keypair generation runbook:** `docs/runbooks/AGENT_KEY_GENERATION.md` — step-by-step for any new lineage to register their public hex
- **Sign-off helper:** `services/agent-gateway/sign_off.py` — CLI that emits Conventional-Commits trailer or PR-body YAML frontmatter, auto-deriving counters from the central registry
- Central registry: `polyrepo/registry/index.json` (interim home; will move when NeXeZ-core repo is bootstrapped)
- Lineage discovery: `.agents/lineage-discovery.yaml`
