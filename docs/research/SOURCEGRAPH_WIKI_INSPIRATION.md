[Ver001.000]

# Research: Sourcegraph-Inspired Features for `@njz/wiki`

**Status:** Scoping doc · 2026-05-17
**Source of inspiration:** Sourcegraph (sourcegraph.com) — "Take control of your codebase"
**Target surface:** `apps/wiki/` (Next.js 15.5.18, currently 2-page skeleton)
**Plan reference:** new line item under plan v002.003 §"Strategic Path Forward" — proposed as **R3.x track** parallel to Network API rollout
**Recommendation:** **Phased adoption** — adapt Sourcegraph's *patterns*, not its product. Phase 1 fits a Pro window; Phases 2–5 are focused sprints.

---

## What Sourcegraph offers (verified from sourcegraph.com)

Sourcegraph's three pillars:

| Pillar | What it does for codebases | Direct analog for a wiki |
|---|---|---|
| **Understanding** | Indexes every repo. Gives humans + agents complete context. Surfaces references, definitions, history across the entire codebase. | Index every page. Give readers + agents complete cross-doc context. Surface back-links, definitions, edit history across the entire wiki. |
| **Oversight** | Multi-step plans for cross-cutting changes (8-step plan; "DB migration → Model → Auth → API DTO → Audit logging → Invite flow → Frontend"). "Nothing missed" verification after diff. | Multi-step plans for cross-doc changes (e.g. "rename SimRating v2 → SimRating v3" across PRD + ADR-006 + ROTAS guide + Valorant agent stat pages). "Nothing missed" verification after edit. |
| **Evolution** | Batch Changes — roll out updates, fix vulns, refactor across all repos with full control. 63-changeset example with merge/approve/check states. | Batch wiki updates — propagate canonical-term changes, fix broken links, restructure sections across all pages with status tracking. |

The product framing that maps directly: "Agents see only fragments of the enterprise codebase, rebuilding context for each task. As agent adoption grows, that blind spot becomes inconsistency, missed changes, and risk at scale." → For wikis: agents see only fragments of the knowledge base, rebuild context per task, causing drift between docs.

## Current state of `apps/wiki/`

| File | Status |
|---|---|
| `apps/wiki/app/page.tsx` | Stub: home page with 2 hardcoded entries (Valorant, CS2) |
| `apps/wiki/app/layout.tsx` | Stub: minimal header + body wrapper |
| `apps/wiki/next.config.js` | Default |
| `apps/wiki/package.json` | Next 15.5.18, React 18, `@njz/types` workspace dep |
| Content (`.md` / `.mdx`) | **None** — no wiki content exists yet |
| Search index / metadata | **None** |
| Cross-page link tracking | **None** |
| Agent context | **None** |

This is a **greenfield wiki**. Every feature is additive — nothing to refactor away.

## Adapted feature set (Sourcegraph → NJZ Wiki)

### Phase W1 — Wiki indexing (the "understanding" foundation)

**What:** Build a static index of all wiki content at build time. Index nodes:

| Node type | Source | Index field |
|---|---|---|
| Wiki page | `apps/wiki/content/**/*.mdx` | path, title, frontmatter, headings, body text, last-modified |
| Concept (term) | regex over body | canonical mention site + alternate-name list |
| Link | parsed from MDX | source page → target page or external URL |
| Code-ref | `code/path/to/file:line` mentions in body | links to GitHub permalink + commit SHA |
| Schema ref | `data/schemas/*.ts` types mentioned | links to `@njz/types` canonical definition |

**Output:** `apps/wiki/.wiki-index.json` (build-time artifact) — single file, ~50KB at MVP scale. Read by every page render for back-link / reference panels.

**Tools:** Existing `gray-matter` (MDX frontmatter parsing) + `remark`/`mdast-util-from-markdown` (Markdown AST). All standard Next.js ecosystem packages.

**Sized:** 1 PR, ~5 files (`content/sample.mdx`, `lib/wiki-index/index.ts` + 2 modules, `app/page.tsx` update to read index). Pro-window-sized.

### Phase W2 — Reference graph view (the "oversight" surface for content)

**What:** A `/graph` route in the wiki that visualizes the page-to-page link structure. Click a node → see all back-links + outbound refs. Find orphans (pages with no incoming links). Find hubs (pages cited by many).

**Why:** Sourcegraph shows a code dependency graph at runtime. The wiki analog answers: "if I deprecate this concept page, what else needs updating?"

**Tools:** Existing visualization stack from `apps/web/` — `d3` is already in `apps/web/package.json` deps. Wiki can import or duplicate the d3-force layout.

**Sized:** 1 PR, ~4 files (`app/graph/page.tsx` + 2 lib modules + a CSS module). Pro-window-sized.

### Phase W3 — Agentic wiki search (Sourcegraph's "Agentic Search" analog)

**What:** A `/search` route + API endpoint that:
1. Accepts a natural-language query
2. Searches the wiki index (keyword + future: embedding-based via HF — see `HF_INTEGRATION_OPPORTUNITIES.md` Pattern B)
3. Returns ranked passages **with cross-references** (link to definition, related pages, recent edits)
4. **Includes an "Agent Context" payload** — JSON the Agent ID Protocol (PR #44) can consume so an agent gets the same context a human reader would

**Why:** Closes the "agents see only fragments" loop. An agent answering "explain SimRating v2's RAR feature" reads the same wiki view a developer would, not a random splat of `grep` results.

**Sized:** 1 PR, ~5 files (`app/search/page.tsx`, `app/api/search/route.ts`, `lib/wiki-index/query.ts`, plus a JSON-API contract file at `services/agent-gateway/`). Pro-window borderline; could split into "search UI" PR + "agent JSON API" PR.

### Phase W4 — Plan-then-edit workflow (Sourcegraph's "Oversight" pillar)

**What:** A CLI + UI for proposing cross-doc edits. Given an instruction like "rename SimRating v2 → SimRating v3 across all references":

1. **Plan:** scan the wiki index, list every affected page + the specific lines
2. **Diff preview:** show before/after per page
3. **Apply:** write the changes (gated behind a confirmation step + auto-generated PR per Sourcegraph's "Nothing missed" verification)
4. **Verify:** re-scan to confirm zero stale references remain

**Why:** Sourcegraph's 8-step plan UI + "Nothing missed" green-check is exactly what a wiki maintainer needs for terminology updates (rename concepts), section restructures, link migrations.

**Tools:** Reuse `services/agent-gateway/sign_off.py` pattern (PR #49) for audit trail; each plan execution is a single signed action.

**Sized:** 2 PRs over a focused sprint:
- W4a: planner + diff preview (CLI only, no UI) — ~4 files
- W4b: web UI + signed-apply step — ~5 files
Each Pro-window-sized.

### Phase W5 — Batch wiki updates (Sourcegraph "Evolution" pillar)

**What:** A page like Sourcegraph's "Batch Changes" — list all open wiki-edit plans + their changeset state (proposed / merged / approved / failed). Bulk-approve, bulk-revert.

**Tied to:** the Agent ID Protocol's PR-counter system. Each batch action is recorded in `polyrepo/registry/index.json::plans` under a new `PLN-WIKI-NNN` namespace.

**Sized:** 1 PR, ~6 files. Sprint-sized (3-5 days).

---

## What NOT to copy from Sourcegraph

- ❌ **Full LSIF indexing** — Sourcegraph supports compiler-grade semantic indexing for code. A wiki doesn't need it; MDX AST + heading anchors are sufficient.
- ❌ **Multi-repo federation** — Sourcegraph indexes hundreds of repos. NJZ Wiki has one repo's content (until NEXEZ-CORE bootstraps; revisit then).
- ❌ **Enterprise SSO / RBAC** — Wiki is public-facing; auth lives in the existing `packages/shared/api`.
- ❌ **Replicating their pricing-tier features** — visualizations should be opinionated to NJZ's content, not generic.

## Sequencing recommendation

| Phase | When | Pro-window fit | Prerequisite |
|---|---|---|---|
| W1 Indexer | Earliest — independent of network API | ✅ YES (1 PR) | None |
| W2 Reference graph | After W1 | ✅ YES (1 PR) | W1 index format frozen |
| W3 Agentic search | After W1; co-design with Phase 2 gateway | ⚠️ borderline | W1 index + plan v002 Phase 2 gateway (PR pending) |
| W4 Plan-then-edit | After W3; uses agent signing | ❌ NO (2 PRs over sprint) | W3 search + PR #49 sign-off helper |
| W5 Batch updates | After W4 | ❌ NO (1 PR + sprint) | W4 plan executor + agent-gateway storage (Phase 3) |

## Integration with existing plan v002 phases

This wiki workstream is **orthogonal to** the Network API workstream (PLN-003), not a replacement:

```
PLN-003-network-api (existing): agent coordination layer
  ├── Phase 1 ECDSA ✅
  ├── Phase 1.5 first key ✅
  ├── Phase 1.6 sign-off helper (PR #49)
  ├── Phase 2 gateway MVP (next major)
  ├── Phase 3 storage
  └── Phase 4-7 (Hermes / Pub-Sub / Edge / Telemetry)

PLN-WIKI-sourcegraph (PROPOSED, parallel track):
  ├── W1 Indexer
  ├── W2 Reference graph
  ├── W3 Agentic search ← bridges to PLN-003 Phase 2 gateway
  ├── W4 Plan-then-edit ← uses PLN-003 sign-off helper
  └── W5 Batch updates ← uses PLN-003 Phase 3 storage
```

Phases W3-W5 **consume** the Network API outputs (gateway endpoints, signing, persistence). Phases W1-W2 are independent.

## Files / paths affected

**This PR adds:** just `docs/research/SOURCEGRAPH_WIKI_INSPIRATION.md` (this file).

**Future PRs would add** (sized in each phase above):
- `apps/wiki/content/**/*.mdx` — actual wiki content (currently zero pages)
- `apps/wiki/lib/wiki-index/` — index builder
- `apps/wiki/app/graph/page.tsx` — reference-graph UI
- `apps/wiki/app/search/page.tsx` + `app/api/search/route.ts` — search
- `apps/wiki/scripts/batch-update.ts` — plan/edit CLI
- `polyrepo/registry/index.json::plans.PLN-WIKI-*` — new plan namespace

## Risks / open decisions

- **Content first?** Currently `apps/wiki/` has zero MDX content. The indexer doesn't help anyone until pages exist. Recommend kicking off content authoring (manual or Kimi-class) in parallel with W1, OR slotting W1 only after a critical mass of content lands.
- **MDX vs plain Markdown?** MDX allows embedded React components (rich game cards, stats widgets) but raises authoring complexity. Recommend **MDX** — the wiki is React-rendered anyway, and `apps/web` already has react-three-fiber + d3 components reusable in wiki pages.
- **Wiki content sourcing** — content authoring is the largest open question. Options: hand-authored by NJZ team, AI-augmented (using Bleaux's HF authentication + a private agent), or imported from existing scattered docs in `docs/`. Recommend hand-authored skeleton + AI-augmented expansion.
- **Naming the plan series** — should be `PLN-005-wiki-sourcegraph-inspired` to match the existing PLN-001-rename / PLN-002-agent-id / PLN-003-network-api / PLN-004-playwright-sprint sequence. Reserve slot.

## Existing patterns reused (no new abstractions)

- `[Ver001.000]` doc-versioning per CLAUDE.md
- Decision-matrix table shape from PR #48 `EXTERNAL_SERVICE_RECONCILIATION.md` + PR #52 `NETLIFY_INVESTIGATION.md`
- Phased rollout framing from plan v002 Network API Phases 1-7
- Agent ID sign-off mechanism from PR #44 `.agents/AGENT_ID_PROTOCOL.md` (Phase 1.6 helper consumed by W4)

## References

- Sourcegraph product page: https://sourcegraph.com (screenshots reviewed 2026-05-17)
- `apps/wiki/app/page.tsx` + `layout.tsx` — current wiki skeleton
- Plan v002.003 §"Strategic Path Forward"
- `HF_INTEGRATION_OPPORTUNITIES.md` Pattern B — embedding-based search candidate for W3
- `services/agent-gateway/` — Network API surface that W3-W5 will consume

## Decision requested before any phase-W work begins

1. **Reserve `PLN-005-wiki-sourcegraph-inspired` in the registry?** (1-line bump in next PR)
2. **Content authoring strategy?** Hand-authored vs AI-augmented vs imported — affects W1 prerequisites.
3. **Is wiki public or internal?** Affects whether agent-context API surface needs auth (Phase 2 gateway has ECDSA; wiki could reuse).
4. **Priority vs Network API?** W1+W2 can ship in parallel without touching PLN-003. W3+W4+W5 wait on Phase 2-3 of the gateway. Recommend parallel W1+W2 work after the immediate Round 2 backlog (R2.5 docker audit + R2.6 Phase 2 scaffold) is shipped.
