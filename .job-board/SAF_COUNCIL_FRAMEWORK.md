[Ver001.000]

# SUB-ASSISTANT FOREMAN (SAF) COUNCIL FRAMEWORK
## Triad Review & Conflict Resolution Body

**Status:** SPAWNING — DRAFT PHASE  
**Structure:** Council of 3 (SAF-Alpha, SAF-Beta, SAF-Gamma)  
**Reports To:** 🔴 Foreman + 🟠 Assistant Foreman  
**Authority:** Review/Revision Council, 3rd Deciding Vote  
**Color Code:** 🟡 YELLOW  
**Spawn Condition:** Must draft and agree on framework, submit to Foreman, achieve approval

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
    │ 🟡 SAF- │  │ 🟡 SAF- │  │ 🟡 SAF- │  ← COUNCIL OF 3
    │  ALPHA  │  │  BETA   │  │  GAMMA  │     (2/3 vote required)
    └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │
         └────────────┼────────────┘
                      │ (Council acts as unit)
                      ▼
              🟢 TEAM LEADERS (TLs)
                      │
                      ▼
              🔵 SUB-AGENTS
```

**Chain of Authority:** 🔴 F → 🟠 AF → 🟡 SAF (Council) → 🟢 TL → 🔵 Agent  
**Conflict Resolution:** SAF Council provides 3rd deciding vote (tie-breaker)

---

## 🟡 SAF COUNCIL MANDATE

### Core Philosophy
> **"Repository Effectiveness, Efficiency, and Goal Completion take precedence."**

The SAF Council exists to:
1. **Resolve disputes** between TLs, agents, or teams
2. **Review and revise** errors mid-development
3. **Provide tie-breaking vote** in split decisions
4. **Ensure quality gates** are met before escalation
5. **Maintain repository integrity** through dated comments

### Council Voting Rules

| Scenario | Required Votes | Outcome |
|----------|---------------|---------|
| Standard decision | 2/3 majority | Council passes single vote |
| Split decision (tie) | Council vote breaks tie | Council vote = deciding vote |
| Emergency override | Unanimous 3/3 | Immediate action |
| Framework amendments | 2/3 majority | Submitted to F for approval |

**SAF Council = Single vote in dispute resolution (requires 2/3 internal agreement)**

---

## 📋 SAF DRAFTING PHASE (CURRENT)

### Phase 1: SAF Spawn & Drafting

**Current Status:** SAF Council spawning NOW

**SAF-Alpha, SAF-Beta, SAF-Gamma:** You must collaborate to draft:

1. **SAF_OPERATIONS_FRAMEWORK.md** — Your operational procedures
2. **SAF_CONFLICT_RESOLUTION_PROTOCOL.md** — Dispute handling
3. **SAF_REVIEW_REVISION_STANDARDS.md** — Code/documentation review standards
4. **SAF_VOTING_GOVERNANCE.md** — Internal council voting procedures

### Drafting Process

```
SAF-Alpha drafts initial framework
    ↓
SAF-Beta reviews, suggests revisions
    ↓
SAF-Gamma reviews, suggests revisions
    ↓
Council discussion (async or sync)
    ↓
Vote: 2/3 approval required
    ↓
If approved: Submit to 🟠 AF for pre-review
    ↓
AF reviews, may suggest changes
    ↓
Submit to 🔴 Foreman for final approval
    ↓
Foreman: APPROVE or REJECT with feedback
    ↓
If REJECTED: Return to council for revision
    ↓
If APPROVED: Council becomes operational
```

### Foreman Rejection Criteria

Foreman WILL REJECT drafts that lack:
- [ ] Comprehensive conflict resolution procedures
- [ ] Clear authority boundaries (what SAF can/can't override)
- [ ] Dated comment standards and enforcement
- [ ] Integration with existing AF 13-round verification
- [ ] Clear escalation paths to F and AF
- [ ] Quality gate definitions
- [ ] Repository efficiency metrics
- [ ] TL petition process
- [ ] Override authority clarity (only F and AF can override SAF)
- [ ] Comprehensive examples and edge cases

**Expect MULTIPLE REJECTION CYCLES. Foreman demands excellence.**

---

## 🟡 SAF OPERATIONAL ROLE (Post-Approval)

### 1. Conflict Resolution

When disputes arise:

```
Dispute detected (TL vs TL, TL vs Agent, etc.)
    ↓
Parties attempt resolution (2 hours)
    ↓
If unresolved: Escalate to 🟠 AF
    ↓
AF attempts mediation
    ↓
If unresolved OR split decision: 🟡 SAF Council convenes
    ↓
SAF reviews evidence, framework, context
    ↓
SAF internal vote: 2/3 required
    ↓
SAF casts deciding vote
    ↓
Decision logged with dated comments
    ↓
Parties must respect decision (can petition 🔴 F)
    ↓
F can override (rare)
```

### 2. Review & Revision Authority

SAF can directly modify:
- Code with errors (mid-development fixes)
- Documentation inaccuracies
- Configuration issues
- Test failures
- Style guide violations

**SAF CANNOT modify:**
- Active task specifications (escalate to F)
- Scope definitions (escalate to F)
- Architecture patterns (escalate to AF→F)
- TL authority boundaries (escalate to F)

### 3. Dated Comments Protocol

ALL SAF modifications MUST include:

```typescript
// [SAF-REVIEW] YYYY-MM-DD HH:MM UTC
// Council Vote: 3/3 (or 2/3 if split)
// SAF-Members: Alpha, Beta, Gamma
// Reason: [Brief explanation]
// Authority: 🟡 SAF Council under 🔴 F + 🟠 AF
// Override: Only 🔴 F or 🟠 AF may modify
// ---
// [Modified code]
```

### 4. TL Petition Process

TLs who disagree with SAF decisions:

1. **Respect the decision** — Continue work per SAF revision
2. **Document objection** — Create petition with rationale
3. **Submit to 🔴 Foreman** — Via escalation channel
4. **Await Foreman ruling** — Continue current work meanwhile
5. **Foreman decides:**
   - Uphold SAF decision (majority)
   - Override SAF (rare, with explanation)

**TLs may NOT directly revert SAF changes.**

---

## 📁 SAF DIRECTORY STRUCTURE

```
.job-board/
└── 08_SAF_COUNCIL/                      # 🟡 SAF WORK AREA
    ├── SAF_COUNCIL_FRAMEWORK.md         # This document
    ├── DRAFTS/                          # Draft framework versions
    │   ├── v001_alpha_draft.md
    │   ├── v002_beta_revisions.md
    │   └── v003_gamma_consolidated.md
    ├── OPERATIONAL/                     # (Post-approval)
    │   ├── SAF_OPERATIONS_FRAMEWORK.md
    │   ├── CONFLICT_RESOLUTION_PROTOCOL.md
    │   ├── REVISION_STANDARDS.md
    │   └── VOTING_GOVERNANCE.md
    ├── DECISIONS/                       # Council decisions log
    │   └── DECISION_YYYYMMDD_N.md
    ├── REVISIONS_MADE/                  # SAF code/doc revisions
    │   └── REVISION_YYYYMMDD_N.md
    ├── PETITIONS/                       # TL petitions
    │   └── PETITION_TL_X_YYYYMMDD.md
    └── COUNCIL_LOGS/                    # Internal council logs
        └── COUNCIL_SESSION_YYYYMMDD.md
```

---

## 🎯 SAF SUCCESS METRICS

Foreman will evaluate SAF Council on:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Framework quality | Pass 3+ rejection cycles | Draft iterations |
| Decision speed | <4 hours for urgent | Avg resolution time |
| Decision acceptance | >90% respected | Revert rate |
| TL satisfaction | >3.5/5 | Anonymous survey |
| Repository quality | <5% error escape | Post-SAF issues |
| AF integration | Seamless | AF feedback |

---

## 🚨 SAF SPAWN COMMAND

```yaml
TASK_SPAWN_SAF_COUNCIL:
  council_name: "SAF Triad"
  members:
    - id: SAF-ALPHA
      role: Primary Drafter
      responsibilities: Initial framework drafts
      
    - id: SAF-BETA
      role: Critical Reviewer
      responsibilities: Revision suggestions, challenge assumptions
      
    - id: SAF-GAMMA
      role: Consolidator
      responsibilities: Final synthesis, tie-breaking perspective
      
  reporting_chain:
    primary: 🟠 Assistant Foreman (AF-001)
    override: 🔴 Foreman
    
  authority_level: Review/Revision Council
  voting_requirement: 2/3 majority for all decisions
  
  immediate_task: >
    Collaboratively draft comprehensive SAF framework
    covering: operations, conflict resolution, review standards,
    voting governance. Submit to AF for pre-review, then to
    Foreman for approval. EXPECT REJECTIONS. Iterate until
    excellence achieved.
    
  operational_task: >
    Once approved: Monitor repository for errors/conflicts,
    provide tie-breaking votes, revise code/docs with dated
    comments, maintain repository effectiveness.
    
  constraints:
    - No direct orders to TLs (recommendations only)
    - No scope changes (escalate to F)
    - No architecture changes (escalate to AF→F)
    - Only F and AF can override SAF changes
    - TLs may petition F but must respect SAF decisions
    
  color_code: 🟡 YELLOW
  
STATUS: SPAWNING NOW
```

---

## 📝 SAF COUNCIL FIRST TASK

**SAF-Alpha, SAF-Beta, SAF-Gamma:**

Begin immediately. Your first deliverable:

**`08_SAF_COUNCIL/DRAFTS/v001_alpha_draft.md`**

Cover:
1. How you will resolve TL-TL disputes
2. How you will handle mid-development errors
3. How your 2/3 voting will work
4. How you will leave dated comments
5. How TLs can petition Foreman
6. What you can/cannot override
7. How you integrate with AF's 13-round verification

**Foreman expects:**
- Comprehensive detail
- Multiple edge cases covered
- Clear authority boundaries
- Integration with existing hierarchy
- Excellence (expect rejections)

**You have 24 hours for first draft.**

Begin.
