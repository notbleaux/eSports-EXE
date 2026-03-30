[Ver001.000]

# Consultant Report Review - Pass 1: Initial Analysis

**Date:** 2026-03-30  
**Reviewer:** Technical Lead  
**Subject:** Professional Consultant Report on CV Pipeline, Simulation, and Architecture

---

## EXECUTIVE SUMMARY

The consultant report provides excellent technical depth on CV pipeline architecture, simulation engine selection, and implementation roadmaps. Key alignment with existing codebase found, with critical gaps around storage architecture and cost management that require immediate attention.

---

## SECTION 1: CV PIPELINE ASSESSMENT

### 1.1 Hybrid Approach Validation (Template + YOLO)

**Consultant Recommendation:** Template matching for MVP, YOLO training in parallel

**My Assessment:**
- ✅ **Correct approach** - Balances immediate delivery with long-term capability
- ✅ **Risk mitigation** - Acknowledges 40% failure rate with template matching
- ✅ **Resource realistic** - 20 hours labeling, 4-8 hours training on RTX 3060

**Alignment with Current VOD Tagging Plan:**
```
Current Plan:     Manual tagging → Frame extraction → COCO export
Consultant Adds:  Template matching → YOLO training → Full automation
```

**Integration Point:**
- Manual VOD tagging generates training data FOR YOLO
- Community becomes labelers (gamified)
- Hybrid: Template matching for MVP launch while community labels for YOLO v2

**Critical Detail:**
- Consultant mentions 500-1000 labeled images per game
- My VOD tagging plan needs explicit quota: "Tag 50 minimaps for Haven"
- Missing: Active learning loop (auto-label high-confidence, human-verify uncertain)

### 1.2 Production Architecture Critique

**Consultant Proposal:**
```
Video Ingestion → CV Engine (YOLOv8 + U-Net + OCR) → TeneT Verification → Storage
```

**Gap Identified:**
- No mention of existing Archival API integration
- Missing: Frame deduplication (we already have this in Archival service)
- Missing: Pin/unpin lifecycle (we have this)

**Recommendation:**
Integrate with existing `services/api/src/njz_api/archival/` - don't rebuild.

---

## SECTION 2: SIMULATION ENGINE VALIDATION

### 2.1 Rust + PyO3 Selection

**Consultant Recommendation:** Rust core + Python API + Godot visualization

**My Assessment:**
- ✅ **Validates my scouting plan** - Exact architecture proposed
- ✅ **Performance targets align** - <100ms, 10K iterations in <500ms
- ✅ **Determinism emphasis** - Fixed-point arithmetic, seeded RNG
- ✅ **Zero-cost stack** - Rapier (MIT), PyO3 (Apache-2.0)

**New Information from Consultant:**
- Reference: OpenAI Dota 2 bot (Lua + C++)
- Reference: Stanford HCI 2024 paper on Rust + Python esports sim
- These strengthen the architectural case

**Gap Identified:**
- Consultant doesn't address Godot integration specifics
- Missing: WebSocket protocol between Rust sim and Godot viz
- Missing: How to maintain 20 TPS sync

### 2.2 Temporal Alignment (Critical Blocker)

**Consultant Finding:**
> "Simulation state desyncs from video by 500ms, causing ghost agents"

**My Assessment:**
- 🔴 **P0 Issue** - Not previously identified
- Requires round-based sync points
- Needs game API round start events as anchors

**Action Required:**
- Add `round_start_anchor` field to VOD tags
- Implement sync validation in Rust sim
- Create drift detection metric

---

## SECTION 3: VIDEO STORAGE ASSESSMENT

### 3.1 Consultant Recommendation: 3 Repos for Storage

**Consultant Proposal:**
Create up to 3 repositories for temporary storage assessment

**My Assessment:**
- 🟡 **Concerning** - GitHub repos are NOT for video storage
- Git LFS has strict limits (1GB free tier)
- Large file storage violates free cost constraint

**Free Storage Options Analysis:**

| Option | Free Tier | Pros | Cons |
|--------|-----------|------|------|
| GitHub LFS | 1GB | Version control | Expensive beyond 1GB |
| Cloudflare R2 | 10GB/mo | Zero egress fees | 10M ops/mo limit |
| Backblaze B2 | 10GB | Cheap egress | $0.01/GB download |
| Supabase Storage | 1GB | Easy integration | Small free tier |
| Local + IPFS | Unlimited | Free forever | Complexity |

**Recommendation:**
Cloudflare R2 (10GB free) + local cache for active processing.
DO NOT use GitHub repos for video storage.

### 3.2 Video Analysis Pipeline Integration

**Consultant Architecture:**
- FFmpeg → Frame Buffer (Redis Streams) → CV Engine

**Alignment with Existing:**
- Redis already in stack ✅
- FFmpeg extraction in Phase 9 Archival system ✅
- TimescaleDB for telemetry mentioned - we have PostgreSQL

**Gap:**
- Consultant suggests TimescaleDB for time-series telemetry
- Current: PostgreSQL with standard tables
- Decision needed: Add TimescaleDB extension or use current?

---

## SECTION 4: 4-HUB ARCHITECTURE VALIDATION

### 4.1 Module Configuration Schema

**Consultant Proposal:**
```typescript
interface GameNodeConfig {
  gameId: string;
  hubs: {
    sator: { enabled, modules, dataSources }
    arepo: { enabled, modules }
    opera: { enabled, modules }
    rotas: { enabled, modules, videoProcessing }
  }
}
```

**My Assessment:**
- ✅ **Validates current hub structure**
- ✅ **Extensible module system**
- ✅ **Game-specific configuration**

**Gap Identified:**
- Consultant places video analysis in ROTAS (Simulation)
- Current plan: VOD tagging in OPERA (Pro Scene)
- **Decision needed:** Which hub owns video analysis?

**Recommendation:**
ROTAS makes sense - VOD analysis feeds into simulation. Update plan.

### 4.2 Modulo4 Clarification

**Consultant Interpretation:**
> "Modulo4 = 4 hubs? 4 rounds?"

**My Clarification:**
Based on context, Modulo4 = "Modulo 4" = cycle of 4 = the 4-hub rotation.
But also implies 4-phase processing cycle.

Accept consultant's interpretation: 4-hub configuration with modular modules.

---

## SECTION 5: IMPLEMENTATION ROADMAP CRITIQUE

### 5.1 Phase Breakdown Assessment

**Consultant Timeline:**
- Phase 0: Weeks 1-2 (Foundation)
- Phase 1: Weeks 3-6 (Web Platform)
- Phase 2: Weeks 7-14 (Video Analysis - CRITICAL PATH)
- Phase 3: Weeks 15-18 (Simulation)
- Phase 4: Weeks 19-22 (Overlay)

**My Assessment:**
- ✅ **Realistic timeline** - 22 weeks total
- ✅ **Critical path identified** - Phase 2 is MVP blocker
- ✅ **Parallel work possible** - Phases 0-1 can overlap with preparation

**Gap:**
- Missing: VOD tagging system (my immediate recommendation)
- Video analysis starts Week 7, but we need training data NOW

### 5.2 Technology Stack Validation

**Consultant Stack:**
- pnpm + Turborepo
- Next.js 14 + FastAPI
- PostgreSQL 15 + TimescaleDB
- Celery for task queue

**Alignment:**
- ✅ pnpm already in use
- ⚠️ Next.js vs Vite (we use Vite)
- ✅ FastAPI confirmed
- ⚠️ TimescaleDB vs standard PostgreSQL
- ⚠️ Celery vs existing async patterns

**Decision Required:**
Stick with Vite + React (not Next.js) - already built and working.

---

## SECTION 6: RISK ASSESSMENT VALIDATION

### 6.1 Identified Risks

| Risk | Consultant | My Assessment | Severity |
|------|------------|---------------|----------|
| CV Model Drift | ✅ Identified | ✅ Valid - patches change UI | High |
| Computational Cost | $5-10k/mo | ✅ Valid for live streams | High |
| Labeling Bottleneck | 416 hours | ✅ Valid - mitigates with active learning | Medium |
| Temporal Alignment | 500ms drift | ✅ Valid - P0 issue | Critical |

### 6.2 Missing Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| HLTV legal exposure | Project shutdown | Remove immediately (already planned) |
| ML model training cost | GPU hours | Use Kaggle free tier |
| Storage cost escalation | Budget overrun | R2 10GB free tier |
| Hub module bloat | Maintenance burden | Strict module boundaries |

---

## SECTION 7: COST ANALYSIS

### 7.1 Free Tier Maximization

**Consultant Budget Assumption:** Zero budget

**My Analysis:**

| Component | Free Option | Limit | Strategy |
|-----------|-------------|-------|----------|
| CV Training | Kaggle Notebooks | 30hr GPU/wk | Train there, export model |
| Video Storage | Cloudflare R2 | 10GB | LRU cache, archive cold |
| Compute | Render free tier | 512MB RAM | Use for API, not processing |
| Processing | Local + Colab | Unlimited | Batch processing offline |
| Database | Supabase free | 500MB | Optimize with cleanup jobs |

### 7.2 Cost Traps Identified

- ❌ **TimescaleDB** - May require paid extension
- ❌ **Heavy Redis usage** - Memory costs on Render
- ❌ **Concurrent stream processing** - Impossible on free tier
- ✅ **VOD-only first** - Avoids live processing costs

---

## PASS 1 CONCLUSIONS

### Validated Recommendations
1. ✅ Hybrid CV approach (template + YOLO)
2. ✅ Rust + PyO3 simulation
3. ✅ 22-week phased implementation
4. ✅ 4-hub module configuration

### Critical Gaps to Address
1. 🔴 Storage architecture (NOT GitHub repos)
2. 🔴 Temporal alignment (500ms drift)
3. 🟡 VOD tagging integration with consultant plan
4. 🟡 Hub ownership of video analysis

### Questions for Sub-Agents
1. How to implement active learning for CV training?
2. What's the cheapest storage for 100GB+ video archive?
3. How to sync Rust sim with Godot at 20 TPS?

---

*Pass 1 complete. Proceeding to spawn sub-agents for parallel analysis.*
