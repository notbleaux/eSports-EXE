[Ver001.000]

# Research: Hugging Face Integration Opportunities

**Status:** Scoping doc · 2026-05-17
**Owner:** ML / platform
**Plan reference:** Plan v002.002 §"Newly available tool surface" item 25, Round 2 R2.4
**Authenticated user:** `Bleaux` (HF Hub, verified via `hf_whoami`)
**Recommendation:** **NO ready-made esports models** on HF. Three integration patterns identified — each is a separate workstream, none are Pro-window-sized. **Defer to post-Phase-4** focused ML sprint.

---

## Why this investigation

Hugging Face MCP server was added to the session toolkit. The platform already uses `TensorFlow.js` + `ONNX Runtime Web` (`apps/web` per `CLAUDE.md`) for in-browser inference of SimRating + RAR analytics. The question: are there HF models, datasets, or spaces that should augment or replace the current ML surface?

## What's on the HF Hub for esports analytics

**Direct esports queries returned zero results:**
- `"esports valorant counter-strike player performance prediction"` → 0 models, 0 datasets
- `"tabular regression time-series player statistics ranking"` → 0 models
- `"onnx web runtime browser inference"` → 0 trending hits

**Adjacent queries returned the broader pattern:**
- `"tabular classification"` (top by downloads): 6 templates/teaching repos (e.g. `templates/tabular-classification`, `Pankaj001/TabularClassification-banking-data`) — not production-grade. No "esports stats classifier" exists.
- `"time series forecasting"` (top by downloads): all weather / bitcoin examples (`keras-io/timeseries_forecasting_for_weather`, `Ankur87/Llama2_Time_series_forecasting_*`, `handecarkci/Bitcoin_Fiyat_Tahmini_Time_Series_Forecasting`). No game-domain models.

**Spaces query `"game stats analytics dashboard"` surfaced one notable hit:**
- 🥇 **[lmgame/lmgame_bench](https://hf.co/spaces/lmgame/lmgame_bench)** — "Evaluate AI Models on Gameplays" — Data Visualization Space, 42 likes. Direct match for game-AI evaluation benchmarking. Could be a community contribution target for ZSXT's SimRating ranking system.

**Conclusion:** the HF Hub does NOT have ready-made esports models. The integration path is custom modeling + general-purpose HF infrastructure, not "drop-in replacements."

## Three integration patterns (none Pro-window-sized)

### Pattern A — Fine-tune a general-purpose tabular/time-series model

**What:** Take a general transformer (`Ankur87/Llama2_Time_series_forecasting_*` family) or a tabular base model, fine-tune on Valorant/CS2 match histories from the existing `data/schemas/` pipeline.

**Use case:** Replace or augment the current SimRating v2 prediction surface with an HF-hosted model. Inference via `@huggingface/inference` JS client (replaces ONNX-Runtime-Web direct loading).

**Effort:** 1-2 weeks (data prep + training run + eval + integration). Compute cost: ~$10-50 for the fine-tune (HF Inference Endpoints or spot Colab).

**Tradeoff:** Adds an external dependency for cold-start inference (~500ms HF Inference latency vs ~50ms local ONNX). May be a regression for the in-browser predictive UX.

**Recommendation:** **Defer until SimRating v2 needs a refresh** (no current pain point).

### Pattern B — Embedding-based player/team similarity

**What:** Use a sentence-transformer or domain-tuned embedding model to encode player histories as vectors. Store in Supabase (`pgvector` extension); query nearest-neighbor for "players like X."

**Use case:** Powers the existing AREPO hub's "find players who play like me" feature. Replaces ad-hoc similarity calculation with a proper vector search.

**Effort:** 3-5 days. Embedding model is off-the-shelf; the work is data pipeline (encode every player on import) + Supabase pgvector setup + query layer.

**Tradeoff:** Embedding cost per insert (~$0.0001 per player via HF Inference). Supabase pgvector adds storage cost but at low scale this is free-tier.

**Recommendation:** **Promising for a post-Phase-3 sprint** (after the network gateway has persistent storage). Feasible HF model: `BAAI/bge-small-en-v1.5` or `intfloat/e5-small-v2`.

### Pattern C — HF Spaces as a community demo + benchmark contribution

**What:** Deploy a public HF Space at `Bleaux/zesportexte-sim-rating` that demonstrates SimRating v2 on uploaded match histories. Optionally contribute to `lmgame/lmgame_bench` as a benchmark entry.

**Use case:** Marketing / community visibility. Community-built esports models could submit to the benchmark and be evaluated against SimRating's ground truth.

**Effort:** 2-3 days for a basic Gradio Space wrapping `services/agent-gateway`'s eventual `/predict` endpoint (Phase 2+); 1-2 weeks if it includes a leaderboard or competitive evaluation harness.

**Tradeoff:** Adds public exposure. Free tier Spaces have 16GB RAM + CPU; sufficient for prediction inference.

**Recommendation:** **Wait until v1.0.0 release.** Community-facing artifact is a launch deliverable, not a development milestone.

## What's NOT recommended

- ❌ **Replacing TensorFlow.js / ONNX Runtime Web with HF Inference Endpoints** — would regress the in-browser zero-latency UX that the current stack delivers
- ❌ **Pulling random tabular templates from the Hub** — the templates surveyed (`Pankaj001/*`) are teaching artifacts, not production models; integrating them would be ML cargo-culting

## MCP tool surface available (for future reference)

| Tool | Purpose |
|---|---|
| `hf_whoami` | Auth verify (currently `Bleaux`) |
| `hub_repo_search` | Models/datasets/spaces by keyword, with sort + filter |
| `hub_repo_details` | Full repo metadata, README, files |
| `space_search` | Semantic search of Spaces |
| `paper_search` | arXiv ↔ HF cross-references |
| `hf_doc_search` / `hf_doc_fetch` | Library docs |
| `dynamic_space` | MCP-enabled Space invocations |

If Pattern B is picked up, `hub_repo_details` lets us evaluate model cards programmatically; `hf_doc_fetch` provides API-call boilerplate.

## Action items (deferred)

1. **Pattern B post-Phase-3:** prototype player-embedding pipeline in a separate research branch when network gateway is ready to ingest the encoded vectors
2. **Pattern C at v1.0.0 launch:** ship a public Gradio Space as part of release
3. **Pattern A only if:** SimRating v2 hits an accuracy ceiling and needs a transformer-based successor

## Why HF auth as `Bleaux` matters (privacy + private resources)

Bleaux's authenticated HF identity may expose:
- Private datasets the user has access to (if any are esports-related)
- Private model endpoints
- Org-level permissions if Bleaux is in any HF orgs

This investigation only queried **public** resources. A future research pass authenticated as Bleaux could probe private surfaces; that requires explicit user authorization (per HF MCP scope rules).

## References

- Plan v002.002 §"Newly available tool surface" item 25
- `CLAUDE.md` §"Key Technology Choices" — current ML stack (TensorFlow.js + ONNX Runtime Web)
- HF Space [lmgame/lmgame_bench](https://hf.co/spaces/lmgame/lmgame_bench) — gameplay evaluation benchmark; potential collaboration target
- `data/schemas/` — canonical match/player/team types feeding any HF training pipeline
