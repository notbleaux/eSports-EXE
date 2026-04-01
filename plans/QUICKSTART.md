[Ver001.000]

# Quick Start Guide
## Integrated Planning Framework

**Get started in 5 minutes**

---

## DIRECTORY STRUCTURE

```
.
├── notebooks/          # 📓 Documentation & research
│   ├── templates/      # Copy these to create new notebooks
│   ├── active/         # Current work + INDEX.md
│   └── archive/        # Completed notebooks
│
├── todo/               # ✅ Task tracking
│   ├── templates/      # Copy for new todo lists
│   ├── backlog/        # Future tasks
│   ├── active/         # Current work
│   │   ├── daily/      # Daily todo lists
│   │   ├── sprint/     # Sprint plans
│   │   └── phase/      # Phase alignment
│   └── completed/      # Historical record
│
└── plans/              # 📋 Phase planning
    ├── templates/      # Copy for new plans
    ├── phase-*/        # One directory per phase
    │   ├── PLAN.md     # Master phase plan
    │   ├── sub-plans/  # Nested plans
    │   ├── checkpoints/# Progress reviews
    │   └── retrospectives/
    ├── FRAMEWORK.md    # Full documentation
    └── INDEX.md        # Plans overview
```

---

## COMMON TASKS

### Start Your Day

```bash
# 1. Check yesterday's notes
notebooks/active/INDEX.md

# 2. Create today's todo
cp todo/templates/daily-template.md \
   todo/active/daily/2026-04-02.md

# 3. Edit the todo with your tasks
```

### Start a Work Session

```bash
# 1. Create a session notebook
cp notebooks/templates/session-template.md \
   notebooks/active/NB-20260402-001.md

# 2. Link to your todo
echo "todo: TD-P3-042" >> notebooks/active/NB-20260402-001.md

# 3. Work and document as you go
```

### Complete a Task

```markdown
# In your daily todo:
- [x] TD-P3-042: Task description
  completed: 2026-04-02T15:30:00
```

### Review Progress

```bash
# Check all active items
cat notebooks/active/INDEX.md
cat todo/active/INDEX.md
cat plans/INDEX.md
```

---

## ID SYSTEM

| Prefix | Meaning | Example |
|--------|---------|---------|
| NB- | Notebook | NB-20260402-001 |
| TD- | Todo | TD-P3-042 |
| PL- | Plan | PL-P3 |
| SP- | Sub-plan | SP-P3-001 |
| CP- | Checkpoint | CP-P3-complete |
| RETRO- | Retrospective | RETRO-20260402 |
| DEC- | Decision | DEC-20260402-001 |

---

## LINKING SYNTAX

**Always link both ways:**

```markdown
# In Notebook:
## Links
- **Plan:** [PL-P3](plans/phase-3-frontend/PLAN.md)
- **Todo:** [TD-P3-042](todo/active/daily/2026-04-02.md)

# In Todo:
## Links  
- **Notebook:** [NB-20260402-001](notebooks/active/NB-20260402-001.md)
- **Plan:** [PL-P3](plans/phase-3-frontend/PLAN.md)
```

---

## FILE NAMING

| Type | Format | Example |
|------|--------|---------|
| Daily Todo | YYYY-MM-DD.md | 2026-04-02.md |
| Notebook | NB-YYYYMMDD-###.md | NB-20260402-001.md |
| Sprint | S-[name]-###-plan.md | S-Frontend-001-plan.md |
| Phase | PLAN.md | plans/phase-3-frontend/PLAN.md |
| Sub-plan | SP-[phase]-###.md | SP-P3-001.md |
| Checkpoint | CP-[phase]-[name].md | CP-P3-midpoint.md |
| Retrospective | RETRO-YYYYMMDD.md | RETRO-20260402.md |

---

## STATUS ICONS

Use these in your todos:

| Icon | Meaning |
|------|---------|
| ☐ | Not started |
| 🔄 | In progress |
| ✅ | Complete |
| 🚫 | Blocked |
| ⏸️ | Paused |
| 📅 | Scheduled |
| 🟡 | Ready/Waiting |

---

## TEMPLATES

### Copy a Template

```bash
# Notebook
cp notebooks/templates/session-template.md \
   notebooks/active/NB-$(date +%Y%m%d)-001.md

# Todo
cp todo/templates/daily-template.md \
   todo/active/daily/$(date +%Y-%m-%d).md

# Plan
cp plans/templates/phase-template.md \
   plans/phase-7-newphase/PLAN.md
```

---

## DAILY WORKFLOW

```
09:00  Check INDEX files for context
       Create/open daily todo
       
09:30  Create session notebook
       Link todo ↔ notebook
       
10:00  Work with documentation
       Update notebook as you go
       
13:00  Lunch + quick status update
       
14:00  Continue work
       Update todo status
       
17:00  Wrap up
       Complete todo items
       Update INDEX files
       Move completed items to archive
```

---

## WEEKLY WORKFLOW

```
Monday:    Sprint planning (if new sprint)
           Review phase alignment
           
Tuesday-Thursday: Daily workflow
           
Friday:    Week review
           Update phase checkpoints
           Plan next week
```

---

## NEED HELP?

| Resource | Location |
|----------|----------|
| Full Documentation | `plans/FRAMEWORK.md` |
| Integration Details | `plans/INTEGRATION_SUMMARY.md` |
| Plans Overview | `plans/INDEX.md` |
| Active Notebooks | `notebooks/active/INDEX.md` |
| Active Todos | `todo/active/INDEX.md` |
| Backlog | `todo/backlog/BACKLOG.md` |

---

*Quick Start v1.0*  
*Start planning in 5 minutes*
