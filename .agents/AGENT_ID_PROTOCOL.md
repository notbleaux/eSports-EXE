[Ver001.000]

# Agent ID + Lineage Protocol — Phase 0 (Advisory)

**Status:** ADVISORY (Phase 0) — non-blocking, no CI enforcement yet
**Authority:** This protocol + `AGENT_CONTRACT.md` + `MASTER_PLAN.md` together form the agent identity framework
**Owner:** Central PolyRepo registry — interim home at `polyrepo/registry/` (this repo); long-term home `notbleaux/njzpl-registry` (TBD)
**Repo short code:** `ZSXT` (ZeSporteXte) · **Portfolio code:** `NJZPL` (NJZ → NeXeZ portfolio)

---

## 1. Why This Exists

This repo is touched by ≥3 distinct AI families concurrently (Claude, GitHub Copilot, Kimi when active, plus archived references to Cursor / Zencoder / OpenClaw / Hermes). Today they're only distinguishable by branch prefix (`claude/*`, `copilot/*`, `kimi/*`) and commit author. That's imprecise (no model version, no session linkage, no order), easy to spoof, and doesn't scale to N agents within one family.

This protocol introduces a **lightweight, advisory, non-blocking** identity convention so each agent action carries:

- Its **lineage** (frontier LLM core family)
- Its **model** (specific answering model version)
- Its **session** (a stable handle for the working session)
- Its **order** (ordinal within the session)
- Counters scoped to **repo**, **agent**, **project**, **plan**, and the **portfolio-wide mutual counter**

The point is provenance + ordering + cross-agent coordination — not access control. Phase 4+ (cryptographic attestation via ECDSA) will replace these advisory claims with verified signatures. Until then, all sign-offs are claims, not proofs.

---

## 2. Canonical Schema

```
agent://<lineage>/<model>/<session>/<order>
```

| Component | Allowed values | Notes |
|---|---|---|
| `lineage` | `claude`, `gpt`, `gemini`, `kimi`, `mimo`, `hermes`, `copilot`, `qwen`, `other` | Lowercase, hyphenless. New lineages: open PR adding entry to `.agents/lineage-discovery.yaml`. |
| `model` | Canonical version slug | Examples: `claude-opus-4-7`, `gpt-5`, `mimo-v2-5-pro`, `k2-6`, `copilot-swe-agent`. Use the vendor's official version string when known; `unknown` is acceptable for agents that can't introspect (e.g. current Copilot SWE Agent). |
| `session` | UUIDv7 OR `YYYYMMDD-N` | UUIDv7 preferred (time-sortable). `YYYYMMDD-N` fallback where UUID gen isn't available. |
| `order` | `A`-prefixed zero-padded ordinal | `A0001`, `A0002`, … Counter resets per session. Idempotent on retry (same logical action re-uses its order). |

**Worked example** (this protocol's authoring commit):
```
agent://claude/claude-opus-4-7/01HXX-ZSPRT-0G0F5/A0001
```

---

## 3. Multi-Scope Counter Registry

The **central polyrepo registry** is the authoritative source of counter state. During Phase 0 the interim home is in-repo at `polyrepo/registry/index.json` (single file); when the NeXeZ-core repo or a dedicated `notbleaux/njzpl-registry` is bootstrapped, the registry migrates there and this repo keeps a synced mirror at `.agents/registers/`.

### Scopes

| Scope | Counter prefix | Example | Meaning |
|---|---|---|---|
| **Repo** | `ZSXT-R-N` | `ZSXT-R-0156` | Total agent-signed actions on the ZSXT repo. Monotonic, never resets. |
| **Agent** | `ZSXT-AGENT-<LINEAGE>-S<sess>-A<order>` | `ZSXT-AGENT-CLA-S04-A0028` | Per-lineage action counter scoped to repo + session. |
| **Project** | `<PROJECT>-P-N` | `NJZ-P-0017` | Project-scoped — multiple repos can roll up to one project. |
| **Plan** | `PLN-<id>-<slug>-A<N>` | `PLN-002-agent-id-A0001` | Per-plan-file counter; ties commits to a specific plan document. |
| **Portfolio-mutual** | `NJZPL-MUTUAL-N` | `NJZPL-MUTUAL-0156` | The portfolio-wide monotonic counter. Every agent in every project in NJZPL increments the same number. The big-picture "this is action #156 across everything." |

### Lineage short codes (used in `AGENT-<LINEAGE>` counters)

| Lineage | Short |
|---|---|
| claude | CLA |
| gpt | GPT |
| gemini | GEM |
| kimi | KMI |
| mimo | MMO |
| hermes | HRM |
| copilot | COP |
| qwen | QWN |

---

## 4. Sign-Off Placement

Three independent placements, all cheap. Use **all three** when committing through a Pro-window session; use **(a) only** for hand-edits and quick fixes.

### (a) Git commit trailer — standard `Co-authored-by:` style

Append to the commit message body, after any `Co-authored-by:` lines:

```
fix(gateway): unblock vercel deploy

(body)

Agent-Sign-Off:     agent://claude/claude-opus-4-7/01HXX-ZSPRT-0G0F5/A0028
ZSXT-R-Counter:     ZSXT-R-0156
Agent-Counter:      ZSXT-AGENT-CLA-S04-A0028
Project-Counter:    NJZ-P-0017
Plan-Counter:       PLN-002-agent-id-A0001
Portfolio-Counter:  NJZPL-MUTUAL-0156
```

### (b) PR body frontmatter — small YAML block, CI-parseable

```yaml
---
agent-sign-off: agent://claude/claude-opus-4-7/01HXX-ZSPRT-0G0F5/A0028
plan-counter:   PLN-002-agent-id-A0001
portfolio-counter: NJZPL-MUTUAL-0156
---
```

### (c) Append-only audit log

`polyrepo/registry/log.jsonl` (one line per signed action). Phase 1+ adds a sync utility that propagates to a central log when the registry migrates.

---

## 5. Lineage Discovery — How an Agent Determines Its Own Attributes

An agent looks itself up at session start via `.agents/lineage-discovery.yaml`. The YAML declares each lineage's discovery contract (env var to read, fallback literal, etc.). An agent that doesn't know one of its attributes writes `unknown` for that slot — the register still increments. **No agent is required to know everything.** Better partial provenance than none.

Discovery order: `model` → `session` → `order` (claim from current counters).

**Idempotency:** if an agent claims order `A0028`, then crashes and retries, the retry should re-claim `A0028` (not jump to `A0029`). Implement via session-scoped claim tokens — the agent's session is the deduplication key.

---

## 6. Enforcement Roadmap

This phase is **advisory only**. No CI gate. No merge block.

| Phase | When | Mechanism | Failure mode |
|---|---|---|---|
| **0 — Advisory (this PR)** | Now → 4 weeks | Protocol exists; nothing checks it | Counter gaps visible; nothing blocks |
| **1 — Soft** | Weeks 4–8 (after ECDSA baseline lands) | CI workflow parses trailer, comments on PR if missing | Comment only; merge still allowed |
| **2 — Required** | Month 3+ | CI fails the PR if sign-off missing or malformed | Blocks merge; bypass via `agent-id-exempt` label |
| **3 — Verified** | After Hermes-MiMo node live | Cryptographic ECDSA attestation tied to lineage keypair | Signature required, not just claim |
| **4 — Networked** | After Pub/Sub bus live | Agent ID registered via signed network API call BEFORE commit; off-network commits flagged | Off-network commits rejected |

Each step is its own small follow-up PR. None block any current work.

---

## 7. Exemptions

- **Dependabot:** exempt (deterministic bot with its own provenance — `dependabot[bot]` author is sufficient)
- **`agent-id-exempt` label:** any PR with this label bypasses enforcement at every phase. For human-authored PRs or external contributors who shouldn't be required to learn the protocol.
- **Squash-merged PRs:** the merge commit retains the PR's sign-off in its body; individual squashed commits don't need their own.

---

## 8. Migration Path (when central registry moves to its own repo)

Trigger: when NeXeZ-core repo (or a dedicated `notbleaux/njzpl-registry`) is bootstrapped.

Steps:
1. `git mv polyrepo/registry/* <new-repo>/`
2. Add `.agents/registers/` to this repo as a synced mirror, populated by a CI workflow that pulls the central registry's `index.json` on every run
3. Update `polyrepo/registry/README.md` (in this repo) to point at the new central location
4. Update this file's "Owner" field

No counter renumbering required — the values are stable across the move.

---

## 9. References

- `AGENT_CONTRACT.md` — operating contract this protocol extends
- `polyrepo/registry/index.json` — interim central registry
- `.agents/lineage-discovery.yaml` — per-lineage discovery rules
- `/root/.claude/plans/plan-and-draft-the-elegant-widget.md` v002 — broader multi-phase roadmap (Phases 0–7)
