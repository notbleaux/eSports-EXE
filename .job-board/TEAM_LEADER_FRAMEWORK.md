[Ver001.000]

# TEAM LEADER FRAMEWORK
## Hierarchical Coordination Structure for Mass Parallel Development

**Structure:** Foreman → Team Leaders (1:3 ratio) → Sub-agents  
**Purpose:** Distribute coordination load, enable autonomous team decision-making  
**Review Cycle:** Foreman reviews Team Leaders, Team Leaders coordinate Sub-agents

---

## ORGANIZATIONAL STRUCTURE

### Hierarchy Levels

```
┌─────────────────────────────────────────────────────────────┐
│                         FOREMAN                              │
│              (Strategic oversight, final approval)           │
│                     Reviews Team Leaders                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
┌────────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
│  TEAM LEADER  │ │ TEAM LEADER│ │ TEAM LEADER│
│      TL-1     │ │    TL-2    │ │    TL-3    │
│   (3 agents)  │ │  (3 agents) │ │  (3 agents) │
└───────┬───────┘ └─────┬──────┘ └─────┬──────┘
        │               │              │
   ┌────┼────┐     ┌────┼────┐    ┌────┼────┐
   │    │    │     │    │    │    │    │    │
   A1   A2   A3    A4   A5   A6   A7   A8   A9
   (Sub-agents working on coordinated tasks)
```

### Team Leader to Sub-agent Ratio

| Team Size | Team Leaders | Sub-agents | Foreman Review Load |
|-----------|--------------|------------|---------------------|
| 3 agents | 1 TL | 2 sub-agents | 33% of direct |
| 6 agents | 2 TLs | 4 sub-agents | 33% of direct |
| 9 agents | 3 TLs | 6 sub-agents | 33% of direct |
| 12 agents | 4 TLs | 8 sub-agents | 33% of direct |
| 30 agents | 10 TLs | 20 sub-agents | 33% of direct |

**Result:** Foreman reviews 10 team leaders instead of 30 individual agents

---

## TEAM LEADER ROLE DEFINITION

### Title Variants by Context
- **Wave Lead** — Leading a specific wave (e.g., "Wave 1.1 Lead")
- **Stream Lead** — Leading a development stream (e.g., "Lens System Lead")
- **Feature Lead** — Leading a feature area (e.g., "WebGL Rendering Lead")
- **Squad Lead** — General team coordination term

### Responsibilities

#### 1. Daily Coordination (Autonomous)
- [ ] Morning standup with sub-agents (15 min)
- [ ] Blocker identification and resolution
- [ ] Task rebalancing within team
- [ ] Code review of sub-agent work
- [ ] Progress synchronization

#### 2. Technical Oversight (Semi-autonomous)
- [ ] Architecture decisions within scope
- [ ] API design for team components
- [ ] Integration points with other teams
- [ ] Technical debt triage
- [ ] Performance budget enforcement

#### 3. Quality Assurance (Semi-autonomous)
- [ ] Pre-foreman review of sub-agent submissions
- [ ] Ensuring acceptance criteria met
- [ ] Cross-browser/device testing coordination
- [ ] Documentation completeness check

#### 4. Escalation to Foreman (Required)
- [ ] Cross-team dependencies blocking
- [ ] Scope changes or feature cuts needed
- [ ] Technical decisions exceeding team authority
- [ ] Quality gates at risk
- [ ] Resource reallocation requests

### Authority Levels

| Decision Type | Team Leader Authority | Foreman Notification |
|---------------|----------------------|---------------------|
| Task assignment within wave | ✅ Full | None (document only) |
| Code style within guidelines | ✅ Full | None |
| Component API design | ✅ With guidelines | Summary in daily |
| Timeline adjustments (±1 day) | ✅ Full | Document only |
| Dependency resolution (same pipeline) | ✅ Full | Daily report |
| Cross-pipeline dependencies | ⛔ Escalate | Immediate |
| Scope changes | ⛔ Escalate | Immediate |
| Architecture pattern changes | ⛔ Escalate | Request approval |
| Quality gate failures | ⛔ Escalate | Immediate |
| Agent replacement | ⛔ Escalate | Request approval |

---

## TEAM LEADER DELIVERABLES

### 1. Daily Team Report (TEAM_REPORT_YYYYMMDD.md)

```markdown
# Team Report — [Team Name] — [Date]
**Team Lead:** [TL-ID]  
**Sub-agents:** [A1-ID], [A2-ID], [A3-ID]

## Summary
- Status: 🟢 On Track / 🟡 At Risk / 🔴 Blocked
- Overall completion: XX%
- Risks: [List or "None"]

## Sub-agent Progress

### [A1-ID] — [Task Name]
- Yesterday: [Completed work]
- Today: [Planned work]
- Blockers: [None or description]
- Completion: XX%

### [A2-ID] — [Task Name]
[Same format]

### [A3-ID] — [Task Name]
[Same format]

## Decisions Made (Autonomous)
1. [Decision] — Rationale: [Brief explanation]

## Escalations to Foreman
1. [Issue] — Action needed: [Specific request]

## Cross-team Coordination
- Dependencies on: [Team IDs]
- Blocking: [Team IDs or "None"]
```

### 2. Pre-Submission Review (PRE_REVIEW_*.md)

Before submitting to Foreman, Team Lead reviews sub-agent work:

```markdown
# Pre-Review — [Agent-ID] — [Task]
**Team Lead:** [TL-ID]  
**Review Date:** [Date]

## Acceptance Criteria Check
- [ ] Criterion 1: [Status + notes]
- [ ] Criterion 2: [Status + notes]
- [ ] ...

## Code Quality
- [ ] Follows project conventions
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Documentation complete

## TL Assessment
- **Recommendation:** ✅ Approve / 🟡 Changes needed / ⛔ Escalate
- **Confidence:** High / Medium / Low
- **Notes:** [Any concerns or praise]

## If Changes Needed
- [ ] Issue 1: [Description] — Assigned back to agent
```

### 3. Weekly Team Retrospective (RETRO_YYYYMMDD.md)

```markdown
# Team Retrospective — Week [N]
**Team:** [Name]  
**TL:** [ID]

## What Went Well
1. [Achievement]

## What Could Improve
1. [Issue]

## Action Items
| Item | Owner | Due |
|------|-------|-----|
| [Action] | [ID] | [Date] |

## TL Feedback for Foreman
- Process improvement suggestions:
- Resource needs:
```

---

## COMMUNICATION PROTOCOLS

### Foreman ↔ Team Leader

**Daily Async Report:**
- TL submits TEAM_REPORT by 10:00 AM
- Foreman reviews and responds by 12:00 PM
- Escalations get immediate attention

**Weekly Sync (30 min):**
- TL presents team progress
- Foreman provides strategic direction
- Cross-team blockers resolved
- Resource reallocation decisions

**Ad-hoc Escalation:**
- TL posts in `.job-board/04_BLOCKS/ESCALATION/`
- Foreman responds within 2 hours during work hours
- For urgent blockers: ping protocol defined

### Team Leader ↔ Sub-agents

**Morning Standup (15 min):**
- Each agent: yesterday, today, blockers
- TL: resolves blockers, adjusts assignments
- Decisions documented in team notes

**Mid-day Check-in (5 min):**
- Quick sync on progress
- Early warning on blockers

**End-of-day Summary:**
- Agents update task status
- TL reviews and plans tomorrow

---

## TEAM FORMATION

### Assignment Logic

Teams are formed based on:
1. **Task proximity** — Related tasks in same wave
2. **Skill complementarity** — Mixed expertise
3. **Dependency chains** — Upstream/downstream relationships
4. **Pipeline alignment** — Same pipeline preferred

### Example Team Structures

#### Pipeline 1: Heroes & Mascots
| Team | Lead | Agents | Focus |
|------|------|--------|-------|
| TL-H1 | Agent 1-A | 1-B, 1-C | Wave 1.1: Character Bibles |
| TL-H2 | Agent 2-A | 2-B, 2-C | Wave 1.2: Mascot Architecture |
| TL-H3 | Agent 3-A | 3-B, 3-C | Wave 1.3: Visual Foundation |
| TL-H4 | Agent 4-A | 4-B, 4-C | Wave 2.1: Web Components |
| TL-H5 | Agent 5-A | 5-B, 5-C | Wave 2.2: Dashboard Integration |
| TL-H6 | Agent 6-A | 6-B, 6-C | Wave 3.1: Godot NPCs |
| TL-H7 | Agent 7-A | 7-B | Wave 3.2: Godot Manager |
| TL-H8 | Agent 8-A | 8-B, 8-C | Wave 4.1: Mascot Assets |
| TL-H9 | Agent 9-A | 9-B, 9-C | Wave 4.2: Mascot Editor |
| TL-H10 | Agent 10-A | 10-B | Wave 5.1: Visual Systems |
| TL-H11 | Agent 11 | — | Wave 6.2: Documentation |

#### Pipeline 2: Help & Accessibility
| Team | Lead | Agents | Focus |
|------|------|--------|-------|
| TL-A1 | Agent 1-A | 1-B, 1-C | Wave 1.1: Help Content |
| TL-A2 | Agent 2-A | 2-B, 2-C | Wave 1.2: Web Help |
| TL-A3 | Agent 3-A | 3-B | Wave 1.3: Godot Help |
| TL-A4 | Agent 4-A | 4-B, 4-C | Wave 2.1: WCAG Foundation |
| TL-A5 | Agent 5-A | 5-B | Wave 2.2: Godot A11y |
| TL-A6 | Agent 6-A | 6-B, 6-C | Wave 3.1: State Sync |
| TL-A7 | Agent 7-A | 7-B | Wave 3.2: Embed & Replay |
| TL-A8 | Agent 8-A | 8-B | Wave 4.1: Metrics |
| TL-A9 | Agent 9-A | 9-B | Wave 4.2: CI/CD |
| TL-A10 | Agent 10-A | 10-B | Wave 5.1: Testing |

#### Pipeline 3: SpecMapViewer V2
| Team | Lead | Agents | Focus |
|------|------|--------|-------|
| TL-S1 | Agent 1-A | 1-B, 1-C | Wave 1.1: Lens Architecture |
| TL-S2 | Agent 2-A | 2-B, 2-C | Wave 1.2: Rendering Engine |
| TL-S3 | Agent 3-A | 3-B | Wave 1.3: Lens Integration |
| TL-S4 | Agent 4-A | 4-B | Wave 2.1: WebSocket |
| TL-S5 | Agent 5-A | 5-B | Wave 2.2: Replay System |
| TL-S6 | Agent 6-A | 6-B, 6-C | Wave 3.1: ML Models |
| TL-S7 | Agent 7-A | 7-B | Wave 3.2: Training Pipeline |
| TL-S8 | Agent 8-A | 8-B | Wave 4.1: Observer Controls |
| TL-S9 | Agent 9-A | 9-B | Wave 4.2: Multi-Stream |
| TL-S10 | Agent 10-A | 10-B | Wave 5.1: Collaboration |
| TL-S11 | Agent 11-A | 11-B | Wave 5.2: Export/Sharing |
| TL-S12 | Agent 12 | — | Wave 6.2: Mobile Sync |

**Total Team Leaders:** 33 (11 + 10 + 12)  
**Total Sub-agents:** 65 (21 + 20 + 24)  
**Foreman Review Load:** 33 reports instead of 98

---

## TEAM LEADER SELECTION CRITERIA

### Qualities of Effective Team Leaders

1. **Technical Depth** — Understands the domain deeply
2. **Communication** — Clear written and verbal communication
3. **Decision-Making** — Comfortable with ambiguity
4. **Empathy** — Understands sub-agent challenges
5. **Accountability** — Takes ownership of team outcomes
6. **Escalation Judgment** — Knows when to escalate vs. resolve

### Selection Process

1. **Foreman nominates** based on task complexity and agent capability
2. **Agent accepts** or declines (no penalty for declining)
3. **Team announced** in JLB with TL/agent assignments
4. **TL briefing** — 30-min session with Foreman on responsibilities

---

## PERFORMANCE METRICS

### Team Leader Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Team velocity | 85%+ of planned | Tasks completed / Tasks planned |
| Blocker resolution | 80% within team | TL-resolved / Total blockers |
| Quality gate pass | 90% first try | First-try passes / Total submissions |
| Escalation appropriateness | 95% valid | Valid escalations / Total escalations |
| Sub-agent satisfaction | >4/5 | Anonymous survey |

### Foreman Evaluation of TLs

Weekly assessment on:
- Communication clarity
- Decision quality
- Team productivity
- Escalation judgment
- Documentation completeness

---

## ESCALATION PROTOCOL

### When Team Leader MUST Escalate

1. **Cross-pipeline dependency** — Needs coordination with other pipeline
2. **Resource conflict** — Competing demands on shared infrastructure
3. **Scope change** — Task requirements change significantly
4. **Quality gate risk** — Team may not meet gate criteria
5. **Agent performance** — Sub-agent struggling significantly
6. **Technical architecture** — Pattern affects multiple teams
7. **Timeline impact** — >2 day delay projected

### Escalation Format

```markdown
# ESCALATION — [TL-ID] — [Date]
**Severity:** 🔴 Critical / 🟡 High / 🟢 Normal

## Issue
[Clear description]

## Impact
- On team: [Description]
- On project: [Description]
- Timeline impact: [Days]

## Options Considered
1. [Option A] — Pros: [] Cons: []
2. [Option B] — Pros: [] Cons: []

## TL Recommendation
[Specific recommended action]

## Foreman Decision Needed By
[Date/time]
```

---

## ONBOARDING NEW TEAM LEADERS

### Day 1: Role Briefing (30 min with Foreman)
- [ ] Review this framework document
- [ ] Clarify authority boundaries
- [ ] Establish communication preferences
- [ ] Set up reporting schedule

### Day 2: Team Introduction (30 min with team)
- [ ] Introduce TL role to sub-agents
- [ ] Establish team norms
- [ ] Set up daily standup time
- [ ] Review current task status

### Week 1: Shadow Mode
- [ ] TL observes Foreman review process
- [ ] TL drafts reports, Foreman reviews
- [ ] TL makes decisions with Foreman validation

### Week 2: Full Authority
- [ ] TL operates with full autonomous authority
- [ ] Foreman reviews daily reports
- [ ] Feedback provided on decisions

---

*This framework reduces Foreman bottleneck from 98 direct reports to 33 managed through team leaders.*
