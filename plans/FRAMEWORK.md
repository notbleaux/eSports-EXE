[Ver001.000]

# Integrated Planning Framework
## Notebooks + Todo Lists + Nested Phase Plans

**Date:** 2026-04-01  
**Purpose:** Unified project management system for eSports-EXE  
**Integration Model:** Bidirectional linking between all components

---

## FRAMEWORK OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATED PLANNING SYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  NOTEBOOKS   │  │  TODO LISTS  │  │    NESTED PLANS          │  │
│  │              │  │              │  │                          │  │
│  │ • Research   │  │ • Daily      │  │ • Phase Plans            │  │
│  │ • Session    │  │ • Sprint     │  │ • Sub-plans              │  │
│  │ • Decision   │  │ • Backlog    │  │ • Checkpoints            │  │
│  │ • Analysis   │  │ • Templates  │  │ • Retrospectives         │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬──────────────┘  │
│         │                 │                      │                  │
│         └─────────────────┼──────────────────────┘                  │
│                           │                                         │
│                    ┌──────▼──────┐                                  │
│                    │  LINKAGE    │                                  │
│                    │  REGISTRY   │                                  │
│                    │             │                                  │
│                    │ Cross-ref   │                                  │
│                    │ IDs         │                                  │
│                    │ Bidirectional│                                 │
│                    └─────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## COMPONENT STRUCTURE

### 1. NOTEBOOKS (`notebooks/`)

**Purpose:** Long-form documentation, research, session logs, decision records

```
notebooks/
├── templates/           # Reusable notebook templates
│   ├── research-template.md
│   ├── session-template.md
│   ├── decision-template.md
│   └── analysis-template.md
├── active/              # Currently active notebooks
│   ├── NB-[ID]-[name].md
│   └── INDEX.md         # Active notebooks registry
└── archive/             # Completed notebooks
    └── YYYY-MM/         # Organized by completion date
```

**Notebook Types:**
| Type | Purpose | Linkage |
|------|---------|---------|
| Research | Deep dives, investigations | Links to Plans, Todos |
| Session | Work session logs | Links to Todos executed |
| Decision | ADRs, design decisions | Links to affected Plans |
| Analysis | Data analysis, reviews | Links to Checkpoints |

---

### 2. TODO LISTS (`todo/`)

**Purpose:** Task tracking, execution workflow, daily/sprint planning

```
todo/
├── templates/           # Todo list templates
│   ├── daily-template.md
│   ├── sprint-template.md
│   └── phase-template.md
├── backlog/             # Future tasks
│   └── BACKLOG.md
├── active/              # Current work
│   ├── daily/           # Daily todo lists
│   ├── sprint/          # Sprint-level (2 weeks)
│   └── phase/           # Phase-level alignment
└── completed/           # Historical record
    └── YYYY-MM/
```

**Todo States:**
```yaml
Status:
  - backlog       # Not started, no owner
  - ready         # Ready to start, has owner
  - in-progress   # Currently being worked
  - review        # Complete, awaiting review
  - done          # Verified complete
  - blocked       # Cannot proceed, has blocker
  - cancelled     # Will not do

Priority:
  - P0: Critical  # Blocks release/deployment
  - P1: High      # Required for milestone
  - P2: Medium    # Should have
  - P3: Low       # Nice to have
```

---

### 3. NESTED PLANS (`plans/`)

**Purpose:** Phase-scoped planning with sub-plans, checkpoints, retrospectives

```
plans/
├── phase-[N]-[name]/
│   ├── PLAN.md              # Master phase plan
│   ├── sub-plans/           # Nested sub-plans
│   │   ├── SP-[ID]-[name].md
│   │   └── INDEX.md
│   ├── checkpoints/         # Progress checkpoints
│   │   ├── CP-[date]-[milestone].md
│   │   └── INDEX.md
│   └── retrospectives/      # Phase retrospectives
│       └── RETRO-[date].md
└── FRAMEWORK.md             # This file
```

**Plan Hierarchy:**
```
MASTER_PLAN.md (Root)
    └── Phase Plans (Phase 0-6)
            └── Sub-plans (SP-001, SP-002...)
                    └── Tasks (Todos)
                            └── Sessions (Notebooks)
```

---

## INTEGRATION MECHANISMS

### 1. Cross-Reference IDs

Every item has a unique ID for linking:

| Component | ID Format | Example |
|-----------|-----------|---------|
| Notebook | NB-YYYYMMDD-### | NB-20260401-001 |
| Todo | TD-[phase]-### | TD-P1-042 |
| Plan | PL-[phase] | PL-P3 |
| Sub-plan | SP-[phase]-### | SP-P3-001 |
| Checkpoint | CP-[phase]-[date] | CP-P3-20260415 |
| Decision | DEC-YYYYMMDD-### | DEC-20260401-001 |

### 2. Linkage Syntax

**In Notebooks:**
```markdown
## Related Items
- **Plan:** [PL-P3: Frontend Architecture](plans/phase-3-frontend/PLAN.md)
- **Todos:** [TD-P3-001](todo/active/phase/TD-P3-001.md), [TD-P3-002](...)
- **Decision:** [DEC-20260401-001](notebooks/DEC-20260401-001-decision.md)
```

**In Todos:**
```markdown
---
links:
  plan: PL-P3
  sub-plan: SP-P3-001
  notebook: NB-20260401-001
  parent: TD-P1-042
  blocks: [TD-P3-005, TD-P3-006]
---
```

**In Plans:**
```markdown
## Related Notebooks
- [NB-20260401-001: Component Analysis](notebooks/active/NB-20260401-001.md)

## Todo Registry
| ID | Task | Status |
|----|------|--------|
| TD-P3-001 | Setup component library | in-progress |

## Checkpoints
- [CP-P3-20260415: Component Library Complete](checkpoints/CP-P3-20260415.md)
```

### 3. Bidirectional Sync Rules

| When this changes... | Update these... |
|---------------------|-----------------|
| Todo status → done | Notebook session log, Plan checkpoint |
| Plan milestone reached | Todo priorities, Notebook analysis |
| Notebook decision made | Plan decisions section, Todo blockers |
| Checkpoint completed | Plan progress, Todo assignments |

---

## WORKFLOW INTEGRATION

### Daily Workflow

```
1. MORNING
   └── Open: todo/active/daily/YYYY-MM-DD.md
       └── Review: notebooks/active/INDEX.md (yesterday's notes)
       └── Check: plans/[current-phase]/checkpoints/latest.md

2. WORK SESSION
   └── Create: notebooks/active/NB-[date]-[###].md
       └── Execute: todos from daily list
       └── Link: todos ↔ notebook entries

3. EVENING
   └── Update: todo/active/daily/YYYY-MM-DD.md
       └── Mark: completed items
       └── Move: incomplete to tomorrow
   └── Update: notebooks/active/INDEX.md
   └── Sync: bidirectional links
```

### Sprint Workflow (2 weeks)

```
1. SPRINT PLANNING
   └── Create: todo/active/sprint/S-[N]-plan.md
       └── Pull: from todo/backlog/BACKLOG.md
       └── Align: with plans/[phase]/PLAN.md milestones

2. DURING SPRINT
   └── Daily: Create/update daily todos
   └── Sessions: Create notebooks as needed
   └── Checkpoints: Weekly checkpoint reviews

3. SPRINT REVIEW
   └── Update: plans/[phase]/checkpoints/
   └── Archive: completed todos
   └── Create: retrospective notebook

4. SPRINT RETROSPECTIVE
   └── Create: plans/[phase]/retrospectives/RETRO-[date].md
   └── Update: templates based on learnings
   └── Plan: next sprint
```

### Phase Workflow

```
1. PHASE INITIATION
   └── Create: plans/phase-[N]/PLAN.md
       └── Define: milestones, sub-plans
   └── Create: initial sub-plans
   └── Setup: todo templates for phase

2. PHASE EXECUTION
   └── Sprints: Multiple 2-week sprints
   └── Checkpoints: Key milestone reviews
   └── Notebooks: Continuous documentation

3. PHASE COMPLETION
   └── Create: checkpoint/CP-[phase]-complete.md
   └── Archive: phase todos to completed/
   └── Create: retrospective
   └── Update: FRAMEWORK.md learnings
```

---

## TEMPLATES

### Notebook Templates (`notebooks/templates/`)

| Template | Use For |
|----------|---------|
| research-template.md | Investigations, deep dives |
| session-template.md | Work session logs |
| decision-template.md | ADRs, design decisions |
| analysis-template.md | Data analysis, reviews |

### Todo Templates (`todo/templates/`)

| Template | Use For |
|----------|---------|
| daily-template.md | Daily task lists |
| sprint-template.md | 2-week sprint planning |
| phase-template.md | Phase-level alignment |

### Plan Templates (`plans/templates/`)

| Template | Use For |
|----------|---------|
| phase-template.md | Phase master plans |
| sub-plan-template.md | Nested sub-plans |
| checkpoint-template.md | Progress checkpoints |
| retrospective-template.md | Phase retrospectives |

---

## ACTIVE REGISTRIES

### Active Notebooks (`notebooks/active/INDEX.md`)

```markdown
# Active Notebooks

## Research
| ID | Title | Started | Status |
|----|-------|---------|--------|
| NB-20260401-001 | Video Recording Analysis | 2026-04-01 | in-progress |

## Sessions
| ID | Title | Date | Related |
|----|-------|------|---------|
| NB-20260401-002 | TypeScript Error Fix Session | 2026-04-01 | TD-P0-001 |

## Decisions
| ID | Title | Date | Status |
|----|-------|------|--------|
| DEC-20260401-001 | Component Library Choice | 2026-04-01 | decided |
```

### Active Todos (`todo/active/INDEX.md`)

```markdown
# Active Todos

## Daily
- [2026-04-01](daily/2026-04-01.md) - 5 items, 3 complete
- [2026-04-02](daily/2026-04-02.md) - 8 items, 0 complete

## Sprint S-001
- [Sprint Plan](sprint/S-001-plan.md)
- Progress: 12/20 complete (60%)

## Phase Alignment
- [Phase 0](phase/P0-alignment.md)
- [Phase 1](phase/P1-alignment.md)
```

### Active Plans (`plans/INDEX.md`)

```markdown
# Active Plans

## Current Phase
- [Phase 0: Foundation](phase-0-foundation/PLAN.md) - COMPLETE
- [Phase 1: Critical Skills](phase-1-critical-skills/PLAN.md) - COMPLETE
- [Phase 2: System Expansions](phase-2-system-expansions/PLAN.md) - COMPLETE

## Upcoming Phases
- [Phase 3: Frontend Architecture](phase-3-frontend/PLAN.md) - READY
- [Phase 4: Data Pipeline](phase-4-data-pipeline/PLAN.md) - PLANNED
- [Phase 5: Review](phase-5-review/PLAN.md) - PLANNED
- [Phase 6: Production](phase-6-production/PLAN.md) - PLANNED
```

---

## USAGE GUIDELINES

### Creating a New Work Session

1. **Create Todo** (if not exists):
   ```bash
   # In todo/active/daily/YYYY-MM-DD.md
   - [ ] TD-P3-042: Implement component X
   ```

2. **Create Notebook**:
   ```bash
   cp notebooks/templates/session-template.md \
      notebooks/active/NB-$(date +%Y%m%d)-001.md
   ```

3. **Link Everything**:
   ```markdown
   # In notebook
   ---
   todo: TD-P3-042
   plan: PL-P3
   ---
   ```

### Completing Work

1. **Update Todo**:
   ```markdown
   - [x] TD-P3-042: Implement component X
     completed: 2026-04-01T14:30:00
   ```

2. **Update Notebook**:
   ```markdown
   ## Completion Summary
   - Status: Complete
   - Outcome: Component X implemented with tests
   - Links to: TD-P3-042
   ```

3. **Move to Completed**:
   ```bash
   mv todo/active/daily/2026-04-01.md todo/completed/2026-04/
   mv notebooks/active/NB-20260401-001.md notebooks/archive/2026-04/
   ```

---

## FRAMEWORK METADATA

```yaml
framework:
  name: Integrated Planning System
  version: 1.0.0
  created: 2026-04-01
  components:
    notebooks: 3 directories, 4 templates
    todos: 4 directories, 3 templates
    plans: 7 phases, 3 subdirs each
  integration:
    cross_ref_ids: true
    bidirectional_links: true
    automated_sync: manual
  workflows:
    daily: true
    sprint: 2-week
    phase: milestone-based
```

---

*Integrated Planning Framework v1.0*  
*Notebooks + Todo Lists + Nested Plans*
