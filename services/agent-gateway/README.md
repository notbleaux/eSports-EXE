[Ver001.000]

# services/agent-gateway

**Status:** Phase 7-B (backup manager) — in development; Phase 3 / 3.5 / 5 / 7-A shipped (PR #65, #73, #72, #74)
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
| **Phase 3.5** | Supabase cloud mirror (write-only, env-gated, fire-and-forget) | ✅ shipped | PR #66 |
| Phase 4 | Hermes-MiMo worker node (OpenRouter integration) | **⚠️ blocked** on user infra | — |
| **Phase 5** | Real-time Pub/Sub (Redis 7) — 4 channels, env-gated, no-op when unset | ✅ shipped | PR #72 |
| Phase 6 | Production edge (Caddy + Docker Compose prod) | **⚠️ blocked** on user infra | — |
| **Phase 7-A** | Telemetry monitor (per-agent event counters + `/telemetry/summary`) | ✅ shipped | PR #74 |
| **Phase 7-B** | Backup manager (SQLite snapshot + retention CLI) | **🟡 IN DEVELOPMENT** | this PR |
| Phase 7-C | Emergency memory protocols runbook | scoped | — |

## Phase 7-B scope (this PR)

**Goal:** ship a stdlib-only `backup_manager.py` CLI that takes live SQLite snapshots (using `Connection.backup()` — no lock held during the page-copy) and enforces a retention policy. Operator wires it as a cron / systemd timer; the gateway itself is unaffected.

**Deliverables in this PR:**
1. `backup_manager.py` (NEW, ~130 lines) — `snapshot()`, `list_snapshots()`, `prune()`, `main()` CLI. Snapshot files named `agent-gateway-<YYYYMMDD-HHMMSS>.db` (UTC, sortable). No new deps.
2. `tests/test_backup.py` (NEW, 5 tests) — snapshot exists + data round-trips, missing-source raises `FileNotFoundError`, prune retains N most recent, `keep=0` is no-op, CLI runs end-to-end via `subprocess`

**CLI:**
```bash
python -m services.agent_gateway.backup_manager \
    --db services/agent-gateway/data/agent-gateway.db \
    --out services/agent-gateway/data/backups \
    --keep 14
# → snapshot: services/agent-gateway/data/backups/agent-gateway-20260518-101530.db
# → retained: 14 snapshots (keep=14) in 0.03s
```

Add `--skip-snapshot` for prune-only runs (useful for separate scheduling).

**Acceptance criteria:**
- `pytest services/agent-gateway/tests/` → 56 pass (51 + 5 new backup)
- Snapshot file is a valid SQLite DB with all source rows readable
- Prune is idempotent — running twice with the same `--keep` doesn't churn files

## Phase 7-A scope (shipped — PR #74)

**Goal:** subscribe to the Phase 5 Redis bus and aggregate per-agent event counts into a SQLite-backed `telemetry_counters` table, surfaced via a public `GET /telemetry/summary` endpoint. Provides the measurement substrate for Phase 4 worker cost-cap policies (Phase 4 is owner-blocked).

**Deliverables in this PR:**
1. `telemetry_monitor.py` (NEW, ~180 lines) — `TelemetryMonitor` with subscriber thread + `record()` + `summary()`. Reuses Phase 5's `AsyncEventBus`; opens its own SQLite connection (WAL handles concurrent readers, `busy_timeout=5000` absorbs write-write contention with Blackboard). Env-gated via `REDIS_URL`; `start()` is a no-op when unset.
2. `blackboard.py::SCHEMA` — adds `telemetry_counters` table (composite PK on `agent_id, event_kind`)
3. `app.py` — adds `GET /telemetry/summary` (public, like `/health`); FastAPI `lifespan` context starts/stops the monitor thread
4. `tests/test_telemetry.py` (NEW, 6 tests) — shape, record aggregation, no-op-when-disabled, bus-to-counter pipeline, public endpoint, end-to-end direct record → HTTP response

**`GET /telemetry/summary` response shape:**
```json
{
  "agents": {
    "agent_claude_code_local": {"created": 12, "submitted": 8, "claimed": 14, "handoff": 2}
  },
  "totals": {"created": 12, "claimed": 14, "handoff": 2, "submitted": 8},
  "agent_count": 1,
  "updated_at": 1779100123.45
}
```

**Activation:** `export REDIS_URL=redis://localhost:6379/0` (same as Phase 5). With unset → endpoint returns zeros; tests / ops can write counters directly via `default_monitor.record()`.

**Acceptance criteria:**
- `pytest services/agent-gateway/tests/` → 51 pass (45 + 6 new telemetry)
- `/telemetry/summary` returns 200 without auth headers
- Bus events `agent.tasks.*` → counter rows update within 2s
- OpenAPI spec regenerated: 5 paths (4 prior + `/telemetry/summary`)

## Phase 3 scope (shipped — PR #65)

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

## Phase 5 scope (this PR)

**Goal:** publish task-lifecycle events to a Redis Pub/Sub bus so downstream consumers (Phase 4 Hermes-MiMo worker, future telemetry monitor, live UI feeds) can react event-driven instead of polling.

**Deliverables in this PR:**
1. `async_bus.py` (NEW, ~160 lines) — `AsyncEventBus` wrapper over `redis.Redis` with 4 publish helpers + a `subscribe()` generator. Env-gated via `REDIS_URL`; unset → no-op stub, no client constructed, no connection attempted. `default_bus` singleton built from env at import time.
2. `blackboard.py` — `Blackboard.__init__` accepts an optional `bus` parameter (defaults to `default_bus`). `create`/`bid`/`submit` publish to the corresponding channel after each SQLite commit (outside the lock).
3. `tests/test_async_bus.py` (NEW, 6 tests) — disabled-bus no-op, single-channel roundtrip, full-lifecycle 5-event chain (created → claimed → handoff → claimed → submitted), broken-client doesn't crash caller, subscribe() yields decoded JSON, isolation of injected bus.
4. `requirements.txt` — adds `redis>=5.0,<6.0` (runtime) and `fakeredis>=2.0,<3.0` (test).
5. `tests/conftest.py` — also strips `REDIS_URL` so `default_bus` is no-op during tests.

**Channels:**

| Channel | Payload | Fired by |
|---|---|---|
| `agent.tasks.created` | `{id, creator_agent_id, description, created_at}` | `create` |
| `agent.tasks.claimed` | `{id, claimer_agent_id, at}` | `bid` |
| `agent.tasks.handoff` | `{id, previous_claimer, at}` | `submit(complete=False)` |
| `agent.tasks.submitted` | `{id, submitter_agent_id, at}` | `submit(complete=True)` |

**Activation:**
```bash
export REDIS_URL="redis://localhost:6379/0"
uvicorn services.agent_gateway.app:app --port 8001
# Subscribe from a consumer (e.g., the eventual Hermes-MiMo worker):
redis-cli SUBSCRIBE 'agent.tasks.*'
```

Reuses the existing Redis service in `docker-compose.yml` — no new infra.

**Acceptance criteria:**
- `pytest services/agent-gateway/tests/` passes 45/45 (39 + 6 new bus tests)
- With `REDIS_URL` unset → bus is silent no-op (no redis import attempted, no client constructed)
- Full lifecycle test (create → bid → partial → re-bid → complete) emits 5 events in order across all 4 channels
- Publish failures (Redis down, connection error) logged but never crash the API caller
- OpenAPI spec byte-identical (no API surface change)

## Phase 3.5 scope (shipped — PR #66)

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
