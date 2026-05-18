[Ver001.000]

# services/agent-gateway

**Status:** Phase 2 (FastAPI gateway scaffold) — in development
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
| **Phase 2 (OpenAPI)** | Export `openapi.json` + CI drift check — **v1.0.0 OKR hit** | **🟡 IN DEVELOPMENT** | this PR |
| Phase 3 | Persistent storage (SQLite WAL, Supabase failover) | scoped | — |
| Phase 4 | Hermes-MiMo worker node (OpenRouter integration) | **⚠️ blocked** on user infra | — |
| Phase 5 | Real-time Pub/Sub (Redis 7) | scoped | — |
| Phase 6 | Production edge (Caddy + Docker Compose prod) | **⚠️ blocked** on user infra | — |
| Phase 7 | Telemetry + multi-platform fallbacks | scoped | — |

## Phase 2 scaffold scope (this PR)

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
