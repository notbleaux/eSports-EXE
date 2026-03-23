[Ver008.000]

# 4NJZ4 JOB LISTING BOARD — 5-Tier Hierarchical Coordination
**With SAF Council Review Layer**

**Repository:** notbleaux/eSports-EXE  
**Unified Master Plan:** `docs/UNIFIED_MASTER_PLAN.md`  
**Last Updated:** March 23, 2026

---

## 🆕 5-TIER HIERARCHY (UPDATED)

```
                    🔴 FOREMAN (F)
              Ultimate Authority, Final Override
                      │
                      ▼
              🟠 ASSISTANT FOREMAN (AF)
         Meta-Coordination, 13-Round Verification
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
    │ 🟡 SAF- │  │ 🟡 SAF- │  │ 🟡 SAF- │  ← COUNCIL OF 3 ⭐ NEW
    │  ALPHA  │  │  BETA   │  │  GAMMA  │     (2/3 vote required)
    └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │
         └────────────┼────────────┘
                      │ (Council acts as unit)
                      ▼
              🟢 TEAM LEADERS (TLs)
         Tactical Coordination
                      │
                      ▼
              🔵 SUB-AGENTS
              Task Execution
```

**Chain of Authority:** 🔴 F → 🟠 AF → 🟡 SAF → 🟢 TL → 🔵 Agent  
**Conflict Resolution:** SAF Council provides 3rd deciding vote

---

## 🎭 ROLE DEFINITIONS (5-Tier)

| Tier | Role | Color | Count | Authority | Key Duty |
|------|------|-------|-------|-----------|----------|
| 1 | **Foreman** | 🔴 RED | 1 | Ultimate | Strategic decisions, final override |
| 2 | **Asst. Foreman** | 🟠 ORANGE | 1 | Meta-layer | 13-round verification, plan partitioning |
| 3 | **SAF Council** | 🟡 YELLOW | 3 | Review Council | Conflict resolution, dated revisions |
| 4 | **Team Leader** | 🟢 GREEN | 33 | Tactical | Team coordination, autonomous decisions |
| 5 | **Sub-agent** | 🔵 BLUE | 65 | Execution | Task completion, daily reporting |

---

## 🟡 SAF COUNCIL — NEW REVIEW LAYER

**Status:** SPAWNING — Drafting Framework  
**Location:** `.job-board/08_SAF_COUNCIL/`  
**Framework:** `SAF_COUNCIL_FRAMEWORK.md`

### SAF Council Members
| Member | Role | Current Task |
|--------|------|--------------|
| **SAF-ALPHA** | Primary Drafter | ✅ v001 draft complete (28KB) |
| **SAF-BETA** | Critical Reviewer | ⏳ Creating v002 revisions |
| **SAF-GAMMA** | Consolidator | ⏳ Awaiting v002 for v003 |

### SAF Mandate
- **Review & revise** mid-development errors with dated comments
- **Provide 3rd deciding vote** in disputes (2/3 internal vote required)
- **Conflict resolution** between TLs, agents, teams
- **Quality gate enforcement** before escalation

### SAF Authority
✅ **SAF Can:**
- Fix code errors (with dated comments)
- Fix documentation errors
- Provide tie-breaking votes
- Review TL decisions (recommend, not override)

⛔ **SAF Cannot:**
- Change scope (escalate to 🔴 F)
- Change architecture (escalate to 🟠 AF → 🔴 F)
- Override TLs directly (TLs can petition 🔴 F)
- Be overridden by TLs (only 🔴 F and 🟠 AF can override SAF)

### Dated Comment Format (Required)
```typescript
// [SAF-REVIEW] YYYY-MM-DD HH:MM UTC
// Council Vote: 2/3 (Alpha, Beta)
// Reason: [Brief explanation]
// Authority: 🟡 SAF Council under 🔴 F + 🟠 AF
// Override: Only 🔴 F or 🟠 AF
```

---

## 📁 COMPLETE DIRECTORY STRUCTURE

```
.job-board/
├── README.md                              # This file
├── UNIFIED_MASTER_PLAN.md → ../docs/
├── TEAM_LEADER_FRAMEWORK.md
├── ASSISTANT_FOREMAN_FRAMEWORK.md
├── SAF_COUNCIL_FRAMEWORK.md               # 🟡 NEW
├── OPERATIONAL_FRAMEWORK.md
├── DEPLOYMENT_LOG.md
├── PHASE_0_RESOLUTION.md
├── TEAM_ROSTER.md
│
├── 00_INBOX/                              # Agent mailboxes
│
├── 01_LISTINGS/ACTIVE/                    # Task files
│
├── 02_CLAIMED/                            # Team workspaces
│   └── [TL-ID]/
│       ├── [AGENT-ID]/
│       └── ...
│
├── 03_COMPLETED/                          # Approved work
│
├── 04_BLOCKS/                             # Blockers
│   ├── ESCALATION/
│   └── TEAM_COORDINATION/
│
├── 05_TEMPLATES/                          # All templates
│
├── 06_TEAM_LEADERS/                       # 🟢 TL work areas
│   ├── TL_H1/ to TL_H11/
│   ├── TL_A1/ to TL_A10/
│   └── TL_S1/ to TL_S12/
│
├── 07_ASSISTANT_FOREMAN/                  # 🟠 AF work area
│   ├── AF_LOG.md
│   ├── AF_NOTIFICATION_SAF_COUNCIL.md     # 🟡 NEW
│   ├── VERIFICATION_ROUNDS/
│   ├── GRADE_CARDS/
│   ├── PARTITIONED_PLANS/
│   ├── SUPPLEMENTARY_TASKS/
│   ├── ESCALATIONS_TO_F/
│   └── PHASE_REPORTS/
│
└── 08_SAF_COUNCIL/                        # 🟡 SAF WORK AREA ⭐ NEW
    ├── SAF_COUNCIL_FRAMEWORK.md
    ├── DRAFTS/                            # Framework drafts
    │   ├── v001_alpha_draft.md            # ✅ EXISTS
    │   ├── v002_beta_revisions.md         # ⏳ IN PROGRESS
    │   └── v003_gamma_consolidated.md     # ⏳ PENDING
    ├── OPERATIONAL/                       # (Post-approval)
    ├── DECISIONS/                         # Council decisions log
    ├── REVISIONS_MADE/                    # SAF code/doc revisions
    ├── PETITIONS/                         # TL petitions
    └── COUNCIL_LOGS/                      # Internal council logs
```

---

## 🚀 PHASE 1 STATUS: ACTIVE

### Wave 1.1 Deployment (IN PROGRESS)

| Pipeline | Team | Agents | Status |
|----------|------|--------|--------|
| Heroes | TL-H1 | 1-A (TL), 1-B, 1-C | 🟢 Active |
| Help | TL-A1 | 1-A (TL), 1-B, 1-C | 🟢 Active |
| SpecMap | TL-S1 | 1-A (TL), 1-B, 1-C | 🟢 Active |

**Total Active:** 9 agents across 3 teams

### SAF Council (FORMING)

| Member | Task | ETA |
|--------|------|-----|
| SAF-ALPHA | ✅ v001 draft | Complete |
| SAF-BETA | ⏳ v002 revisions | T+24h |
| SAF-GAMMA | ⏳ v003 consolidation | T+48h |
| **AF Pre-review** | ⏳ Pending | T+72h |
| **Foreman Approval** | ⏳ Pending | T+96h+ |

---

## 📊 COORDINATION MATRIX (5-Tier)

| Activity | Agent | TL | SAF | AF | F |
|----------|-------|-----|-----|-----|-----|
| Write code | 🔵 | — | — | — | — |
| Coordinate team | — | 🟢 | — | — | — |
| Fix mid-dev errors | — | — | 🟡 | — | — |
| Review submissions | — | 🟢 | 🟡* | 🟠* | 🔴* |
| Partition plans | — | — | — | 🟠 | — |
| 13-round verification | — | — | — | 🟠 | — |
| Conflict resolution | — | — | 🟡 | — | — |
| Provide tie-break vote | — | — | 🟡 | — | — |
| Final authority | — | — | — | — | 🔴 |

*Spot-checks and reviews at each level

---

## 🎯 ESCALATION CHAIN

```
Sub-agent issue
    ↓
🟢 Team Leader (2h resolution)
    ↓ (if unresolved)
🟡 SAF Council (review & vote)
    ↓ (if scope/architecture)
🟠 Assistant Foreman
    ↓ (if strategic)
🔴 Foreman (final decision)
```

---

## 📋 PHASE 1 ACTIVE OPERATIONS

### Foreman (🔴) — Dual Role
- **Role A:** Coordinate 9 Phase 1 agents
- **Role B:** Design JLB maintenance architecture
- **Alternating:** 2h Agent mgmt / 2h JLB architecture

### AF (🟠) — AF-001 Operational
- 13-round verification active
- Daily AF_LOG to Foreman
- Preparing to receive SAF framework

### SAF Council (🟡) — Drafting Phase
- v001 complete (28KB)
- v002 in progress
- Framework submission to AF: T+72h

### TLs (🟢) — Managing Teams
- TL-H1: Heroes character bibles
- TL-A1: Help content schema
- TL-S1: SpecMap lens framework

### Agents (🔵) — Executing
- 9 agents actively developing
- Daily standups with TLs
- Submissions to TLs for pre-review

---

## 📚 ESSENTIAL REFERENCES

| Document | Purpose | Tier |
|----------|---------|------|
| `docs/UNIFIED_MASTER_PLAN.md` | Strategic coordination | All |
| `TEAM_LEADER_FRAMEWORK.md` | TL roles | 🟢 TL, 🟡 SAF, 🟠 AF, 🔴 F |
| `ASSISTANT_FOREMAN_FRAMEWORK.md` | AF operations | 🟠 AF, 🔴 F |
| `SAF_COUNCIL_FRAMEWORK.md` | SAF operations | 🟡 SAF, 🟠 AF, 🔴 F |
| `OPERATIONAL_FRAMEWORK.md` | Protocols & safety | All |

---

## 🎯 CURRENT STATUS

**Phase:** 1 (Implementation)  
**Agents Active:** 9 (Wave 1.1)  
**SAF Status:** Drafting (v001 complete, v002 in progress)  
**Next Milestone:** SAF v003 consolidation (T+48h)  
**Foreman Dual Role:** Active (Agent mgmt + JLB architecture)

---

*5-tier hierarchical coordination: 🔴 F → 🟠 AF → 🟡 SAF → 🟢 TL → 🔵 Agent*  
*SAF Council adds review/revision layer for quality assurance*

**Status: ✅ PHASE 1 ACTIVE — SAF COUNCIL FORMING — ALL SYSTEMS OPERATIONAL**

---

*Maintained by Foreman. Last updated: March 23, 2026*
