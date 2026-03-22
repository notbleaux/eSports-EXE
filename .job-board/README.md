[Ver005.000]

# 4NJZ4 JOB LISTING BOARD — Unified Coordination Center

**Repository:** notbleaux/eSports-EXE  
**Unified Master Plan:** `docs/UNIFIED_MASTER_PLAN.md`  
**Last Updated:** March 23, 2026

---

## 🎯 QUICK START

**New to the project?** Start here:
1. Read the **Unified Master Plan**: `docs/UNIFIED_MASTER_PLAN.md`
2. Review **Design Foundation**: `STYLE_BRIEF_v2.md`, `MVP_v2.md`
3. Pick a pipeline below and claim your first task

---

## 📋 UNIFIED MASTER PLAN SUMMARY

This project implements **three parallel development pipelines** under a unified coordination framework:

| Pipeline | Focus | Agents | Hours | Status |
|----------|-------|--------|-------|--------|
| **Heroes & Mascots** | Creative/visual identity | 32 | 168h | Wave 1.1 Ready |
| **Help & Accessibility** | Technical/systems architecture | 30 | 144h | Wave 1.1 Ready |
| **SpecMapViewer V2** | Advanced visualization platform | 36 | 224h | Wave 1.1 Ready |
| **TOTAL** | Complete platform | **98** | **536h** | **13 weeks** |

**Core Philosophy:** *"Type-first hierarchy, panelled lens architecture, motion for function only."*

---

## 🎭 PIPELINE 1: HEROES & MASCOTS

**Master Plan:** `docs/HEROES_MASCOTS_MASTER_PLAN.md`  
**Tracking:** `FOREMAN_HEROES_MASCOTS_TRACKING.md`  
**Source:** Branch `18adbe1e`  
**Duration:** 4 weeks

### Wave 1.1 — Character Bible Development 🔵 READY

| Agent | Task | Est. | Deliverable | File |
|-------|------|------|-------------|------|
| 1-A | Sol & Lun Bibles | 8h | Character specs, colors, animations | `WAVE_1_1_AGENT_1A_SOL_LUN.md` |
| 1-B | Bin & Fat Bibles | 8h | Character specs, villain contrasts | `WAVE_1_1_AGENT_1B_BIN_FAT.md` |
| 1-C | Uni + Villains | 8h | Unity mechanics, 3 villains | `WAVE_1_1_AGENT_1C_UNI_VILLAINS.md` |

**Dependencies:** None — can start immediately

---

## ♿ PIPELINE 2: HELP & ACCESSIBILITY

**Master Plan:** `docs/HELP_ACCESSIBILITY_INTEGRATION_MASTER_PLAN.md`  
**Tracking:** `FOREMAN_HELP_ACCESSIBILITY_TRACKING.md`  
**Source:** Branch `105bfaf1`  
**Duration:** 3.5 weeks

### Wave 1.1 — Help System Foundation 🔵 READY

| Agent | Task | Est. | Deliverable | File |
|-------|------|------|-------------|------|
| 1-A | Content Schema | 8h | JSON schema, 5 samples, 3 languages | `HELP_WAVE_1_1_AGENT_1A_CONTENT_SCHEMA.md` |
| 1-B | Context Engine | 8h | Expertise detection, auto-promotion | `HELP_WAVE_1_1_AGENT_1B_CONTEXT_ENGINE.md` |
| 1-C | Knowledge Graph | 8h | Search, recommendations, graph viz | `HELP_WAVE_1_1_AGENT_1C_KNOWLEDGE_GRAPH.md` |

**Dependencies:**
- 1-B needs: 1-A schema structure
- 1-C needs: 1-A content, 1-B expertise model

---

## 🗺️ PIPELINE 3: SPECMAPVIEWER V2

**Master Plan:** `docs/SPECMAPVIEWER_V2_EXPANSION_MASTER_PLAN.md`  
**Tracking:** `FOREMAN_SPECMAPVIEWER_V2_TRACKING.md`  
**Source:** Branch `7df305d5` (Foundation ✅ Complete)  
**Duration:** 5.5 weeks

### Wave 1.1 — Lens Architecture 🔵 READY

| Agent | Task | Est. | Deliverable | File |
|-------|------|------|-------------|------|
| 1-A | Lens Framework | 10h | Plugin architecture, compositor, hot-reload | `SPEC_WAVE_1_1_AGENT_1A_LENS_FRAMEWORK.md` |
| 1-B | Analytical Lenses | 12h | 8 lenses (heatmap, efficiency, etc.) | `SPEC_WAVE_1_1_AGENT_1B_ANALYTICAL_LENSES.md` |
| 1-C | Tactical Lenses | 12h | 8 lenses (predictor, timing, etc.) | `SPEC_WAVE_1_1_AGENT_1C_TACTICAL_LENSES.md` |

**Target:** 20+ lens ecosystem (6 existing + 16 new)

**Dependencies:**
- 1-B needs: 1-A framework
- 1-C needs: 1-A framework

---

## 🔗 CROSS-PIPELINE COORDINATION

### Shared Infrastructure

| Component | Owner | Used By | Status |
|-----------|-------|---------|--------|
| Design Tokens | STYLE_BRIEF | All | ✅ Complete |
| Component Library | DELIVERABLES | All | ✅ Complete |
| Zustand Stores | Pipeline 2 | All | 🟡 Design needed |
| WebSocket Layer | Pipeline 2 | P1, P3 | 🟡 Design needed |
| TensorFlow.js | Pipeline 3 | P2 | 🟡 Foundation ready |
| Godot Bridge | Pipeline 1 | P2, P3 | 🟡 Foundation ready |

### Integration Points

```
Heroes ───────┬──► SpecMapViewer (broadcast overlays)
              └──► Help System (mascot guides)

Help ─────────┬──► SpecMapViewer (help overlays)
              ├──► All Hubs (WCAG compliance)
              └──► Heroes (accessibility)

SpecMapViewer ─┬──► Help (visualization help)
               ├──► All Hubs (match viewer)
               └──► Mobile (companion)
```

---

## 📁 DIRECTORY STRUCTURE

```
.job-board/
├── README.md                              # This file
├── UNIFIED_MASTER_PLAN.md -> ../docs/     # Central coordination
│
├── FOREMAN_HEROES_MASCOTS_TRACKING.md    # Pipeline 1 status
├── FOREMAN_HELP_ACCESSIBILITY_TRACKING.md # Pipeline 2 status
├── FOREMAN_SPECMAPVIEWER_V2_TRACKING.md   # Pipeline 3 status
│
├── 00_INBOX/{agent-id}/                   # Agent mailboxes
│
├── 01_LISTINGS/ACTIVE/                    # Ready to claim
│   ├── WAVE_1_1_AGENT_1A_SOL_LUN.md
│   ├── WAVE_1_1_AGENT_1B_BIN_FAT.md
│   ├── WAVE_1_1_AGENT_1C_UNI_VILLAINS.md
│   ├── WAVE_1_2_MASCOT_ARCHITECTURE.md
│   ├── WAVE_1_3_VISUAL_FOUNDATION.md
│   ├── HELP_WAVE_1_1_AGENT_1A_CONTENT_SCHEMA.md
│   ├── HELP_WAVE_1_1_AGENT_1B_CONTEXT_ENGINE.md
│   ├── HELP_WAVE_1_1_AGENT_1C_KNOWLEDGE_GRAPH.md
│   ├── SPEC_WAVE_1_1_AGENT_1A_LENS_FRAMEWORK.md
│   ├── SPEC_WAVE_1_1_AGENT_1B_ANALYTICAL_LENSES.md
│   └── SPEC_WAVE_1_1_AGENT_1C_TACTICAL_LENSES.md
│
├── 02_CLAIMED/{agent-id}/                 # In-progress work
│   ├── SUBMISSION_1A_v1.md
│   └── ...
│
├── 03_COMPLETED/                          # Approved work
│   └── wave-1-1-agent-1A/
│
├── 04_BLOCKS/                             # Cross-pipeline blockers
│   └── {agent-id}/
│       └── BLOCK_{id}.md
│
└── 05_TEMPLATES/                          # Reusable templates
    ├── SUBMISSION_TEMPLATE.md
    ├── CHANGE_REQUEST_TEMPLATE.md
    └── DAILY_STANDUP_TEMPLATE.md
```

---

## 🚀 HOW TO CLAIM A TASK

### Step 1: Choose Your Pipeline
- **Heroes & Mascots:** Creative, visual, character design
- **Help & Accessibility:** Architecture, systems, UX
- **SpecMapViewer:** WebGL, visualization, ML, broadcast

### Step 2: Review Available Tasks
Check `01_LISTINGS/ACTIVE/` for 🔵 **READY** status tasks

### Step 3: Claim
```bash
# Copy task to your agent directory
cp 01_LISTINGS/ACTIVE/WAVE_1_1_AGENT_1A_SOL_LUN.md 02_CLAIMED/your-agent-id/

# Update tracking document
# Edit FOREMAN_*_TRACKING.md with your claim
```

### Step 4: Work
Follow task specifications exactly. Reference Unified Master Plan for context.

### Step 5: Submit
Create `SUBMISSION_{task}_v1.md` in your `02_CLAIMED/` directory with:
- All deliverables
- Testing notes
- Key decisions
- Any deviations

### Step 6: Review
Foreman will 4-pass review within 8 hours:
1. Scout: File runs
2. Plan: Matches spec
3. Review: Code quality
4. Implement: Approve/change

---

## 📊 UNIFIED QUALITY GATES

All pipelines must pass these gates:

| Gate | Criterion | Owner |
|------|-----------|-------|
| G1 | Design tokens match STYLE_BRIEF | All |
| G2 | Heroes & Mascots complete | Pipeline 1 |
| G3 | Unified help functional | Pipeline 2 |
| G4 | WCAG 2.2 AA compliance | Pipeline 2 |
| G5 | 20+ lenses at 60fps | Pipeline 3 |
| G6 | Real-time <100ms | Pipeline 3 |
| G7 | ML 70%+ accuracy | Pipeline 3 |
| G8 | Cross-pipeline integration | All |
| G9 | Lighthouse >90 | All |
| G10 | 80% test coverage | All |

---

## 📝 CONVENTIONS

### Version Headers
All documents: `[VerMMM.mmm]`
- Major: Structural changes
- Minor: Content updates

### Status Emojis
- 🔵 READY — Available
- 🟡 IN PROGRESS — Claimed
- 🟠 IN REVIEW — Submitted
- 🟢 APPROVED — Complete
- 🔴 CHANGES — Revision needed
- ⏳ QUEUED — Waiting
- ⛔ BLOCKED — Issue

### Communication
- **Daily standups:** Async in agent directories
- **Blockers:** Post in `04_BLOCKS/{agent-id}/`
- **Questions:** Reference Unified Master Plan first

---

## 📚 ESSENTIAL REFERENCES

| Document | Why You Need It |
|----------|-----------------|
| `docs/UNIFIED_MASTER_PLAN.md` | Central coordination, all pipelines |
| `STYLE_BRIEF_v2.md` | Design tokens, typography, colors |
| `MVP_v2.md` | Scope, acceptance criteria |
| `CRIT_TEMPLATE_v2.md` | Review process |
| `AGENTS.md` | Project conventions |

---

## 🎯 CURRENT PRIORITIES

### This Week (Week 1)
- [ ] Deploy Wave 1.1 agents across all pipelines
- [ ] Establish shared infrastructure design
- [ ] First CRIT session (end of week)

### Next 4 Weeks
- [ ] Complete Pipeline 1 (Heroes & Mascots)
- [ ] Complete Pipeline 2 Phase 1-2 (Help & A11y)
- [ ] Complete Pipeline 3 Phase 1-2 (Lens + Data)

### 13-Week Goal
- [ ] All 98 agent assignments complete
- [ ] All 10 quality gates passed
- [ ] Public MVP deployed

---

*Maintained by Foreman. Last updated: March 23, 2026*
*"Type-first hierarchy, panelled lens architecture, motion for function only."*
