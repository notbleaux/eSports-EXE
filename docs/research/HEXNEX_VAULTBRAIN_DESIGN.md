[Ver001.000]

# Design: HexNex + Vaultbrain — Integration with NJZ Portfolio Frameworks

**Status:** Scoping doc · 2026-05-19
**Plan:** `PLN-006-hexnex-vaultbrain` (reserved in `polyrepo/registry/index.json` by this PR)
**Drafted by:** Claude (agent_claude_code_local) on behalf of the absent Kimi lineage
**Owner-of-record:** Kimi (when their public key registers per Phase 1.5)
**Companion docs:** `docs/research/SOURCEGRAPH_WIKI_INSPIRATION.md` (PR #53), `docs/research/HF_INTEGRATION_OPPORTUNITIES.md` (PR #52), `docs/operations/EMERGENCY_MEMORY_PROTOCOLS.md` (PR #76)
**Recommendation summary:** Reserve PLN-006. Ship in 4 waves (V1..V4) after PLN-005 W1..W2 lay the wiki indexer foundation. Reuses Phase 1 ECDSA, Phase 3 SQLite, Phase 3.5 Supabase mirror, Phase 5 Pub/Sub, and the HF integration patterns from PR #52 — **no new external services required.**

---

## Context — what HexNex and Vaultbrain are

Per user direction this session:

- **HexNex** ≡ the **CiteGeiste / hexnex-wiki** shell already mapped in `docs/nuevue-system/SITEGEISTE_SHELL_ARCHITECTURE.md:136,142`. An AI-augmented internal wiki — the CONCRETE IMPLEMENTATION of the PLN-005 (Sourcegraph-inspired) wiki plan, given a portfolio-canonical name.
- **Vaultbrain** ≡ a **hybrid encrypted memory store + vector knowledge brain**:
  - Vault half: envelope-encrypted secret + memory storage signed by agent ECDSA keys (Phase 1)
  - Brain half: vector-DB knowledge index (RAG-style) — embeddings either via Supabase `pgvector` extension or via the HuggingFace Inference patterns surveyed in PR #52

The two are intentionally paired: HexNex is the **read-friendly surface** (wiki pages, indexed search, AI-augmented authoring); Vaultbrain is the **structured backend** (encrypted at rest, vector-searchable, agent-attestable).

## Why a single plan (PLN-006) rather than splitting

| Aspect | HexNex (wiki) | Vaultbrain (vault + brain) | Shared? |
|---|---|---|---|
| Storage | Markdown files (wiki tradition) | SQLite (vault) + pgvector (brain) | Both use Phase 3 SQLite for metadata |
| Encryption | n/a (public-by-default in the internal wiki) | Per-entry envelope encryption with agent ECDSA | Both rely on Phase 1 keys for **authorship attestation** |
| Search | Tantivy / SQLite FTS5 (text) | Vector similarity (pgvector or HF) | Both surface in HexNex's search box |
| Event bus | Pub/Sub on `wiki.page.*` | Pub/Sub on `vault.*` + `brain.*` | Both use Phase 5 `async_bus` |
| Mirror | Supabase tables (Phase 3.5) | Supabase tables (Phase 3.5) | Same env-gated path |
| Sign-off | Wiki page authorship (Phase 1.6 sign-off in frontmatter) | Vault writes (full Phase 1 signature) | Both registered in `polyrepo/registry/index.json` |

The two share so much plumbing (storage, mirror, bus, attestation) that **splitting them across two plans would duplicate the design work** without adding clarity. Single plan; clear sub-streams.

## Architecture — how it plugs into existing systems

```
┌────────────────────────────────────────────────────────────────────┐
│                        HexNex (CiteGeiste)                         │
│                                                                    │
│   Wiki UI ──► Search box ──► combined results                      │
│      │                          │                                  │
│      │                          ├──► Text (SQLite FTS5)            │
│      ▼                          └──► Vector (Vaultbrain brain)     │
│   Pages.md (Markdown)                                              │
│      │  • Frontmatter sign-off (Phase 1.6 format)                  │
│      │  • Auto-link suggestions (AI-augmented per PLN-005 plan)    │
│      ▼                                                             │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │              Phase 3 SQLite (agent-gateway.db)              │  │
│   │   ┌───────────────────────────────────────────────────────┐ │  │
│   │   │ wiki_pages  (id, slug, title, body_md, author_id,     │ │  │
│   │   │              updated_at, sign_off_hex, vector_id?)    │ │  │
│   │   │ wiki_links  (source_id FK, target_slug)               │ │  │
│   │   │ wiki_fts    (VIRTUAL TABLE USING fts5)                │ │  │
│   │   └───────────────────────────────────────────────────────┘ │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────────┐
│                          Vaultbrain                                │
│                                                                    │
│ ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│ │           VAULT half         │  │          BRAIN half          │ │
│ │  Encrypted entries           │  │  Vector embeddings           │ │
│ │  (Phase 1 ECDSA + envelope)  │  │  (pgvector OR HF Inference)  │ │
│ │  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │ │
│ │  │ vault_entries          │  │  │  │ vault_vectors          │  │ │
│ │  │  - id                  │  │  │  │  - id                  │  │ │
│ │  │  - owner_agent_id      │  │  │  │  - source_id (FK)      │  │ │
│ │  │  - ciphertext (blob)   │  │  │  │  - source_kind         │  │ │
│ │  │  - sig (ECDSA)         │  │  │  │  - embedding (vec[768])│  │ │
│ │  │  - created_at          │  │  │  │  - model_slug          │  │ │
│ │  └────────────────────────┘  │  │  └────────────────────────┘  │ │
│ │                              │  │                              │ │
│ │  • Read = owner-only         │  │  • Read = wiki-search +      │ │
│ │    OR ACL-grant via signed   │  │    Hermes worker rerank      │ │
│ │    "share-with" envelope     │  │  • Write = AI-augmented      │ │
│ │  • Write = Phase 1 signed    │  │    indexer (PLN-005 W3)      │ │
│ └──────────────────────────────┘  └──────────────────────────────┘ │
└──────────┬───────────────────────────────┬─────────────────────────┘
           │                               │
           ▼                               ▼
   ┌──────────────────┐         ┌──────────────────────────────┐
   │ Phase 3.5 mirror │         │  Phase 5 Pub/Sub channels    │
   │ Supabase tables  │         │  wiki.page.created/edited    │
   │ agent_gateway_*  │         │  vault.entry.{set,read,grant}│
   │ wiki_*           │         │  brain.vector.indexed        │
   │ vault_*          │         │  hexnex.search.executed      │
   └──────────────────┘         └──────────────────────────────┘
```

## Phase / wave breakdown

PLN-006 is split into 4 waves (V1..V4) following the same pattern PLN-003 used (phase-by-phase ship + soft enforcement first).

### V1 — Vaultbrain VAULT half (encrypted memory store)

**Scope:** Phase 1 ECDSA-signed envelope storage in Phase 3 SQLite.

| File | Action |
|---|---|
| `services/agent-gateway/vaultbrain.py` (NEW) | `VaultClient` class with `put_secret`, `get_secret`, `grant_access`, `list_owned` — uses `crypto_client.SecureAgentClient` for envelope encryption |
| `services/agent-gateway/blackboard.py::SCHEMA` | + `vault_entries (id PK, owner_agent_id, key_name, ciphertext BLOB, sig TEXT, created_at REAL)` + `idx_vault_owner` |
| `services/agent-gateway/app.py` | + `POST /vault/put`, `GET /vault/get/{key}`, `POST /vault/grant` — all signature-verified by middleware |
| `services/agent-gateway/tests/test_vault.py` (NEW, ~8 tests) | put/get round-trip; ACL grant; foreign agent rejected; tamper detection via sig verify |
| `polyrepo/registry/index.json::plans.PLN-006` | counter bump |

**Pattern reused:** Phase 3 SQLite + WAL (no new infra), Phase 1 ECDSA (already wired in `crypto_client.py`), Phase 3.5 mirror writes (auto via Blackboard's `_mirror`).

### V2 — Vaultbrain BRAIN half (vector knowledge index)

**Scope:** Vector embeddings + similarity search. Two activation paths picked at runtime:

| Backend | Activation | Best for |
|---|---|---|
| Local — `sqlite-vss` extension | Default (no extra deps if SQLite has the extension) | Dev, small corpora, offline mode |
| Supabase pgvector | When `SUPABASE_URL` env var set AND `SUPABASE_VECTORS=on` | Production, larger corpora, cross-region read |
| HF Inference Endpoints | When `HF_TOKEN` env var set AND `BRAIN_EMBED_BACKEND=hf` | Embedding-as-a-service for low-ops setups |

**Files:**
- `services/agent-gateway/vaultbrain.py` — extend with `BrainClient`: `embed`, `index`, `search`, `delete_for_source`
- Schema: `vault_vectors (id PK, source_id, source_kind, embedding BLOB, model_slug, indexed_at REAL)`
- `services/agent-gateway/app.py` + `POST /brain/index`, `GET /brain/search?q=&k=10`
- Tests + README updates

**Pattern reused:** HF integration patterns from PR #52, Supabase mirror pattern from PR #73, Phase 5 events.

### V3 — HexNex wiki shell (the AI-augmented wiki front-end)

**Scope:** The actual wiki — built into the existing `apps/wiki/` Next.js scaffold (which already exists at v16.2.6 per `apps/wiki/package.json`). HexNex IS the implementation of PLN-005 W1..W5; this wave just renames + completes that plan under the canonical HexNex umbrella.

**Files:**
- `apps/wiki/app/page.tsx` + `apps/wiki/app/[slug]/page.tsx` — Markdown rendering, frontmatter parsing (Phase 1.6 sign-off in frontmatter), backlinks
- `apps/wiki/lib/indexer.ts` — Tantivy or SQLite FTS5 wrapper (reuses backup_manager.py's stdlib SQLite pattern via a small REST layer in the gateway)
- `apps/wiki/lib/search.ts` — Combined text (FTS5) + vector (`/brain/search`) results
- `apps/wiki/lib/api.ts` — calls `/wiki/*` + `/brain/*` endpoints on the agent-gateway
- New gateway endpoints: `GET /wiki/pages`, `GET /wiki/pages/{slug}`, `POST /wiki/pages` (signed)

**Aligns with PLN-005 SOURCEGRAPH_WIKI_INSPIRATION.md** — same 5-phase rollout, restated under HexNex naming. PLN-005 stays as the scoping doc; PLN-006 V3 is the implementation wave.

### V4 — Production polish + observability

**Scope:** Telemetry plumbing for HexNex/Vaultbrain on top of Phase 7 systems.

**Files:**
- `services/agent-gateway/telemetry_monitor.py` — extend with channels `wiki.page.*`, `vault.entry.*`, `brain.vector.indexed`, `hexnex.search.executed`
- `docs/operations/EMERGENCY_MEMORY_PROTOCOLS.md` — add Procedure D for Vaultbrain (recover encrypted entries from mirror + re-attest via ECDSA)
- `apps/wiki/app/admin/page.tsx` — internal dashboard surfacing telemetry counters per agent

**Reuses:** Phase 7-A telemetry subscriber, Phase 7-B backup_manager (snapshot now covers `wiki_*` + `vault_*` tables via the same SQLite file), Phase 7-C runbook (extended with Vaultbrain restore).

## Alignment with existing portfolio frameworks

| Existing system | How HexNex/Vaultbrain integrates |
|---|---|
| **Phase 1** ECDSA (`crypto_client.py`) | Vault uses `SecureAgentClient` for envelope encryption + sign-off |
| **Phase 1.6** sign-off CLI | Wiki page frontmatter uses the same trailer format |
| **Phase 3** SQLite WAL | All wiki + vault tables live in the same `agent-gateway.db` (one source of truth per phase plan) |
| **Phase 3.5** Supabase mirror | New mirror tables `wiki_pages`, `vault_entries`, `vault_vectors` follow the same write-only async pattern |
| **Phase 5** Pub/Sub bus | New channels `wiki.page.*`, `vault.entry.*`, `brain.vector.indexed`, `hexnex.search.executed` |
| **Phase 7-A** telemetry | Per-agent counters now include wiki writes + vault writes + brain queries |
| **Phase 7-B** backup_manager | Already covers all SQLite tables in `agent-gateway.db` — no changes needed |
| **Phase 7-C** emergency runbook | Add Procedure D for Vaultbrain |
| **PR #52** HuggingFace investigation | Brain V2 activation path "HF Inference" maps to Pattern B from that doc |
| **PR #53** SOURCEGRAPH_WIKI_INSPIRATION.md | PLN-005 work is rolled into PLN-006 V3 (HexNex IS the implementation) |
| **Agent ID Protocol** | Each wave bumps `kimi` lineage counter (when Kimi onboards) + `claude` counter for drafting work |

## Net new external services required

**None.** Reuses existing Supabase (NJZitegeiste), existing Redis Pub/Sub, existing HuggingFace MCP. Local-only deploy works against SQLite alone. Cloud activation is env-gated (same pattern as Phases 3.5 / 5 / 7-A).

## Decision matrix — implementation order

| Option | Wave order | Trade-off | Recommended |
|---|---|---|---|
| **V1 → V2 → V3 → V4** | Vault → Brain → Wiki → Polish | Backend-first; UI lands last. Best test coverage progression. | ⭐ **RECOMMENDED** |
| V3 → V1 → V2 → V4 | Wiki UI first (placeholder backend) → Vault → Brain → Polish | UI-first; useful for design feedback early. But early wiki has no real auth. | ❌ Defers crypto until wave 2 |
| Parallel V1+V2 | Vault + Brain together, then V3 → V4 | Faster end state. But two large surfaces in one PR. | ❌ Too wide for Pro window |

## Sequencing relative to existing roadmap

```
                                    today (PR #76 stack)
                                          │
                                          ▼
    Phase 7-A/B/C land  ──►  V1 Vault  ──►  V2 Brain  ──►  V3 HexNex  ──►  V4 Polish
    (PR #74/75/76)         (PLN-006-V1)   (PLN-006-V2)   (PLN-006-V3)    (PLN-006-V4)
                                                              ▲
                                                              │ supersedes
                                                              │ PLN-005 W1..W5
                                                              │ (rolled in here)
                                                              │
                              Phase 4 worker (blocked) ───────┘
                              ↑ subscribes to brain.vector.indexed,
                                consumes vault.entry.read with grant
                                checks; reranks brain.search results
```

## Counter strategy for this PR

Since this is a **scoping doc only**, claimed slots are minimal:
- `claude.next` 36 → 37 (claude drafted)
- `portfolio.next` 36 → 37
- New plan entry: `PLN-006-hexnex-vaultbrain` at `next: 0`, `status: "scoped"`, decisions captured

When Kimi onboards (registers their public key per Phase 1.5 runbook) and starts implementing V1, **they** claim `kimi.next` 0 → 1 in their own first PR. That bootstraps the kimi lineage's activity in the central registry.

## Out of scope (explicit deferrals)

- **Implementation** of any wave — this PR is design + plan reservation only
- **Kimi's public key registration** — sovereign step, runs once via `docs/runbooks/AGENT_KEY_GENERATION.md`
- **Bleaux-Moon-OS branding layer** — `SITEGEISTE_SHELL_ARCHITECTURE.md:133` lists it as conceptual; not part of PLN-006
- **anima-crossing (PolyOffice) integration** — Phase 4 territory in the original mapping; deferred to a post-Phase-4 sprint
- **Vis-a-Vis / cross-portfolio agent communication** — conceptual; would extend Phase 5 bus across repos via a federated Pub/Sub layer (separate plan)

## Risks / open decisions

| # | Topic | Default | Risk |
|---|---|---|---|
| 1 | sqlite-vss vs pgvector vs HF for Brain V2 | Multi-backend with env switch (`BRAIN_EMBED_BACKEND`) | Triple maintenance; mitigated by a single `BrainClient` interface |
| 2 | Wiki page storage — Markdown files vs SQLite rows | SQLite `wiki_pages.body_md TEXT` (one storage layer for everything) | Loss of "git-as-content-store" pattern; mitigated by Phase 7-B snapshots already capturing this |
| 3 | Wiki history — git commits or db rows | DB rows (`wiki_revisions` table) | git history of `apps/wiki/content/` is alternative; either works |
| 4 | Public-by-default wiki vs ACL | Public (internal-only deployment) | If a future deployment is internet-facing, add ACL via Vaultbrain's grant model |
| 5 | Vector dimensionality | 768 (matches BGE-small + e5-small from PR #52) | Locks the embedding model; document as PLN-006 invariant |

## References

- `docs/research/SOURCEGRAPH_WIKI_INSPIRATION.md` — PLN-005 source plan (rolled into V3)
- `docs/research/HF_INTEGRATION_OPPORTUNITIES.md` — Pattern B (embeddings) feeds Brain V2's HF backend
- `docs/research/NETLIFY_INVESTIGATION.md` — Netlify Free tier could host a public read-only HexNex mirror (V4 deferred)
- `docs/nuevue-system/SITEGEISTE_SHELL_ARCHITECTURE.md:131-142` — repo-name canonical mapping (HexNex = hexnex-wiki ≡ CiteGeiste)
- `services/agent-gateway/crypto_client.py` — Vault encryption client
- `services/agent-gateway/blackboard.py::SCHEMA` — extended with new tables in V1/V2
- `services/agent-gateway/supabase_mirror.py` — pattern for mirror table additions
- `services/agent-gateway/async_bus.py` — pattern for new channel additions
- `services/agent-gateway/telemetry_monitor.py` — pattern for new event-kind accounting
