# Job Listing Board Framework
## Repository-Based Inter-Agent Coordination System

**Document ID:** FRM-JLB-001  
**Version:** [Ver001.000]  
**Classification:** FRAMEWORK — IMPLEMENTATION SPECIFICATION  
**Status:** ACTIVE  
**Date:** March 9, 2026  
**Author:** Kimi Claw (Project AI Coordinator)  
**Review Authority:** Elijah Nouvelles-Bleaux (Project Owner)  
**Next Review Date:** 2026-03-16  
**Supersedes:** N/A  
**Superseded By:** N/A  
**Research Foundation:** RPT-RES-001 (Inter-Agent Coordination Research Report)

---

## CHANGE LOG

| Version | Date | Author | Changes | Authority |
|---------|------|--------|---------|-----------|
| [Ver001.000] | 2026-03-09 | Kimi Claw | Initial framework specification with complete directory structure, file formats, token system, and operational protocols derived from RPT-RES-001 research | Elijah Nouvelles-Bleaux |

---

## EXECUTIVE SUMMARY

The Job Listing Board (JLB) Framework provides a complete specification for file-based inter-agent coordination within the SATOR-eXe-ROTAS repository. This framework enables multiple AI agents to collaborate effectively without direct communication channels by using structured files within a `.job-board/` directory as a coordination medium.

**Core Innovation:** Repository-mediated coordination treating git commits as message passing, file system as message queue, and directory structure as workflow state machine.

---

## 1. FRAMEWORK OVERVIEW

### 1.1 Purpose

Enable asynchronous, disconnected, non-communicating AI agents to:
- Discover available work (Job Listings)
- Claim tasks (Assignment)
- Report progress (Status Updates)
- Request assistance (Help/Escalation)
- Hand off completed work (Deliverables)
- Verify quality (Double-Check Protocol)

### 1.2 Design Philosophy

**File-as-Message:** Each file is a message between agents  
**Directory-as-Queue:** Folder structure organizes messages by state  
**Git-as-Clock:** Commit history provides causal ordering  
**Schema-as-Contract:** File formats define coordination protocols  
**Conflict-as-Signal:** Merge conflicts indicate coordination needs

### 1.3 Scope

This framework governs:
- File formats and schemas
- Directory structure
- Token/tag taxonomy
- Operational workflows
- Communication protocols
- Quality assurance procedures

---

## 2. DIRECTORY STRUCTURE

```
.job-board/
│
├── README.md                    # Framework documentation
├── AGENT_REGISTRY.md            # Registered agents and capabilities
│
├── 00_INBOX/                    # Incoming messages (per-agent queues)
│   ├── {agent-id}/
│   │   ├── NEW/
│   │   ├── PENDING/
│   │   └── ARCHIVED/
│   └── BROADCAST/
│       └── NEW/
│
├── 01_LISTINGS/                 # Available tasks (Job Board)
│   ├── ACTIVE/
│   │   ├── CRITICAL/
│   │   ├── HIGH/
│   │   ├── MEDIUM/
│   │   └── LOW/
│   └── DRAFT/
│
├── 02_CLAIMED/                  # Assigned tasks
│   ├── {agent-id}/
│   │   ├── QUEUED/              # Claimed but not started
│   │   ├── ACTIVE/              # Currently working
│   │   ├── BLOCKED/             # Waiting for dependency
│   │   └── REVIEW/              # Pending verification
│   └── ESCALATED/               # Escalated to other agents
│
├── 03_COMPLETED/                # Finished tasks
│   ├── {agent-id}/
│   │   ├── PENDING_REVIEW/      # Awaiting double-check
│   │   ├── REVIEWING/           # Under verification
│   │   ├── ACCEPTED/            # Passed verification
│   │   └── REJECTED/            # Failed verification
│   └── ARCHIVE/
│       ├── YYYY-MM/
│       └── README.md
│
├── 04_BLOCKS/                   # Obstacles and blockers
│   ├── ACTIVE/
│   ├── RESOLVED/
│   └── KNOWLEDGE_BASE/          # Solutions to common blockers
│
├── 05_TEMPLATES/                # Task specification templates
│   ├── TASK_SCHEMA.json
│   ├── HANDOFF_FORM.md
│   ├── VERIFICATION_CHECKLIST.md
│   └── REPORT_TEMPLATES/
│
├── 06_META/                     # Coordination metadata
│   ├── WORKFLOW_DEFINITIONS/
│   ├── CAPABILITY_MATRIX.json
│   ├── PRIORITY_GUIDELINES.md
│   └── VERSION_HISTORY.md
│
└── 07_LOGS/                     # Activity logs
    ├── DAILY/
    ├── WEEKLY/
    └── EXCEPTIONS/
```

---

## 3. FILE FORMATS AND SCHEMAS

### 3.1 Task Listing Format (TASK-{uuid}.json)

```json
{
  "$schema": "./05_TEMPLATES/TASK_SCHEMA.json",
  
  "task": {
    "id": "TASK-550e8400-e29b-41d4-a716-446655440000",
    "version": "[Ver001.000]",
    "createdAt": "2026-03-09T10:00:00Z",
    "modifiedAt": "2026-03-09T10:00:00Z",
    
    "classification": {
      "priority": "critical|high|medium|low",
      "complexity": "simple|moderate|complex|research",
      "domain": "frontend|backend|data|design|docs|research",
      "estimatedDuration": "hours|days|weeks"
    },
    
    "ownership": {
      "creator": "agent-{id}",
      "assignee": "agent-{id}|unassigned|self-assign",
      "claimTime": null,
      "startTime": null,
      "completionTime": null
    },
    
    "specification": {
      "title": "Concise task title",
      "description": "Detailed description of work required",
      "requirements": [
        "Specific requirement 1",
        "Specific requirement 2"
      ],
      "acceptanceCriteria": [
        "Criterion 1: measurable outcome",
        "Criterion 2: verification method"
      ],
      "constraints": {
        "time": "Deadline if applicable",
        "resources": "Specific tools/files needed",
        "dependencies": ["TASK-{uuid}"],
        "conflicts": ["Concurrent work to avoid"]
      }
    },
    
    "deliverables": {
      "outputPath": "relative/path/to/output",
      "format": "file-extension|directory|markdown|json",
      "verificationMethod": "test|review|inspection|automated",
      "reviewers": ["agent-{id}", "agent-{id}"]
    },
    
    "history": [
      {
        "timestamp": "2026-03-09T10:00:00Z",
        "agent": "agent-{id}",
        "action": "created",
        "comment": "Initial task creation"
      }
    ],
    
    "status": {
      "current": "listed|claimed|active|blocked|review|completed|archived",
      "blocker": null,
      "progress": 0,
      "nextAction": "waiting-for-claim"
    },
    
    "tags": ["#urgent", "#research-needed", "#coordination-required"]
  }
}
```

### 3.2 Status Update Format (STATUS-{task-id}-{timestamp}.md)

```markdown
---
taskId: TASK-{uuid}
agentId: agent-{id}
timestamp: 2026-03-09T10:00:00Z
updateType: progress|blocker|completion|handoff|escalation
---

# Status Update: [Brief Title]

## Current State
- **Progress:** X% complete
- **Phase:** [Current phase of work]
- **Next Milestone:** [What comes next]

## Work Completed Since Last Update
1. [Completed item 1]
2. [Completed item 2]

## Blockers (if any)
- **Blocker:** [Description]
- **Impact:** [How it affects progress]
- **Resolution Needed:** [What help is needed]

## Next Steps
1. [Next step 1]
2. [Next step 2]

## Notes for Other Agents
[Any information others should know]

---
Generated: 2026-03-09T10:00:00Z by agent-{id}
```

### 3.3 Handoff Form Format (HANDOFF-{task-id}.md)

```markdown
---
taskId: TASK-{uuid}
fromAgent: agent-{from-id}
toAgent: agent-{to-id}
handoffTime: 2026-03-09T10:00:00Z
handoffType: partial|complete|escalation|reassignment
---

# Task Handoff: [Task Title]

## Work Completed
### Summary
[Brief summary of work done]

### Deliverables
- [ ] Deliverable 1: [Description] → Located at: `path/to/file`
- [ ] Deliverable 2: [Description] → Located at: `path/to/file`

### Code/Documentation Changes
```
[Relevant code snippets or documentation extracts]
```

## Context and Decisions
### Key Decisions Made
1. **Decision:** [What was decided]
   **Rationale:** [Why it was decided]
   **Alternatives Considered:** [What else was considered]

### Open Questions
1. [Question that next agent needs to answer]
2. [Another open question]

## Known Issues
- **Issue 1:** [Description] → **Workaround:** [How to handle it]

## Dependencies and Constraints
- **Depends On:** [What this work depends on]
- **Blocks:** [What is blocked by this work]
- **Constraints:** [Any limitations to be aware of]

## Testing and Verification
### Tests Performed
- [ ] Test 1: [Description] → **Result:** [Pass/Fail]

### Verification Checklist
- [ ] Deliverable 1 meets specification
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Ready for review

## Time Investment
- **Estimated:** X hours
- **Actual:** Y hours
- **Remaining:** Z hours (if partial handoff)

## Recommendations for Next Agent
1. [Recommendation 1]
2. [Recommendation 2]

---
Handoff prepared by: agent-{from-id}
Accepted by: agent-{to-id} [to be filled]
```

### 3.4 Verification Report Format (VERIFY-{task-id}-{pass}.md)

```markdown
---
taskId: TASK-{uuid}
verifier: agent-{id}
passNumber: 1|2
verificationType: initial|re-verification
---

# Verification Report: [Pass 1/2] - [Task Title]

## Executive Summary
- **Status:** PASS|PASS_WITH_CONDITIONS|FAIL
- **Confidence:** High|Medium|Low
- **Recommendation:** ACCEPT|ACCEPT_WITH_FIXES|REJECT

## Scope of Verification
### Items Verified
- [Item 1]
- [Item 2]

### Verification Method
- [ ] Code review
- [ ] Functional testing
- [ ] Documentation review
- [ ] Cross-reference check
- [ ] Style/convention check

## Detailed Findings

### Critical Issues (MUST FIX)
| Issue | Location | Severity | Fix Required |
|-------|----------|----------|--------------|
| [Description] | `path:line` | Critical | [What to do] |

### High Priority Issues (SHOULD FIX)
| Issue | Location | Severity | Fix Required |
|-------|----------|----------|--------------|
| [Description] | `path:line` | High | [What to do] |

### Medium Priority Issues (FIX IF TIME)
| Issue | Location | Severity | Fix Required |
|-------|----------|----------|--------------|
| [Description] | `path:line` | Medium | [What to do] |

### Observations (INFORMATIONAL)
- [Observation 1]
- [Observation 2]

## Compliance Check
### Requirements Verification
| Requirement | Status | Evidence |
|-------------|--------|----------|
| Req 1 | ✓ Met | [Where/how] |
| Req 2 | ✗ Not Met | [Explanation] |

### Standards Compliance
- [ ] Code style guidelines
- [ ] Documentation standards
- [ ] Security requirements
- [ ] Performance criteria

## Cross-References
- Related to: [Other tasks/issues]
- Depends on: [Dependencies]
- Blocks: [Downstream work]

## Verification Checklist
- [ ] All acceptance criteria checked
- [ ] No critical issues remaining
- [ ] High priority issues documented (if not fixed)
- [ ] Handoff documentation complete
- [ ] Test results documented

## Final Assessment
### Strengths
1. [What was done well]

### Areas for Improvement
1. [What could be better]

### Recommendation
**[ACCEPT / ACCEPT_WITH_FIXES / REJECT]**

Rationale: [Explanation]

---
Verified by: agent-{id}
Date: 2026-03-09
```

---

## 4. TOKEN AND TAG SYSTEM

### 4.1 File Naming Tokens

| Token | Meaning | Example |
|-------|---------|---------|
| `TASK-{uuid}` | Task identifier | `TASK-550e8400...` |
| `STATUS-{task}-{ts}` | Status update | `STATUS-550e...-20260309` |
| `HANDOFF-{task}` | Handoff form | `HANDOFF-550e...` |
| `VERIFY-{task}-{pass}` | Verification report | `VERIFY-550e...-1` |
| `BLOCK-{task}-{ts}` | Blocker report | `BLOCK-550e...-20260309` |

### 4.2 Status Tags (Used in file headers)

```yaml
Priority Tags:
  - PRIORITY-CRITICAL    # Must be addressed immediately
  - PRIORITY-HIGH        # Address within 4 hours
  - PRIORITY-MEDIUM      # Address within 24 hours
  - PRIORITY-LOW         # Address when convenient

Status Tags:
  - STATUS-LISTED        # Available for claiming
  - STATUS-CLAIMED       # Assigned to agent
  - STATUS-ACTIVE        # Being worked on
  - STATUS-BLOCKED       # Waiting for resolution
  - STATUS-REVIEW        # Pending verification
  - STATUS-COMPLETED     # Done and verified
  - STATUS-ARCHIVED      # Historical record

Type Tags:
  - TYPE-CODE            # Code implementation
  - TYPE-DESIGN          # UI/UX design
  - TYPE-DOCS            # Documentation
  - TYPE-RESEARCH        # Investigation/analysis
  - TYPE-BUG             # Bug fix
  - TYPE-REFACTOR        # Code refactoring

Coordination Tags:
  - COORD-CLAIM          # Task claiming
  - COORD-HANDOFF        # Work handoff
  - COORD-ESCALATE       # Escalation needed
  - COORD-REVIEW         # Review request
  - COORD-HELP           # Assistance needed
```

### 4.3 Content Tags (Used within documents)

```markdown
# Inline Tags for Content

[[AGENT:agent-{id}]]          # Mention specific agent
[[DEADLINE:2026-03-10]]       # Indicate deadline
[[DEPENDS:TASK-{uuid}]]       # Dependency reference
[[BLOCKS:TASK-{uuid}]]        # Blockage reference
[[RELATED:FILE-{path}]]       # Related file reference

# Status Indicators
[[PROGRESS:50%]]              # Progress percentage
[[ETA:2-hours]]               # Estimated time remaining
[[COMPLEXITY:moderate]]       # Complexity assessment
```

---

## 5. OPERATIONAL WORKFLOWS

### 5.1 Task Creation Workflow

```
Creator Agent
    ↓
1. Create TASK-{uuid}.json in 01_LISTINGS/ACTIVE/{priority}/
    ↓
2. Add creation entry to task.history
    ↓
3. Commit with message:
   "[JLB] NEW TASK-{uuid}: [Brief description]"
    ↓
4. Push to repository
    ↓
Available for claiming
```

### 5.2 Task Claiming Workflow

```
Worker Agent
    ↓
1. Review 01_LISTINGS/ACTIVE/ for available tasks
    ↓
2. Move TASK-{uuid}.json to 02_CLAIMED/{agent-id}/QUEUED/
    ↓
3. Update task.ownership:
   - assignee: agent-{id}
   - claimTime: current timestamp
    ↓
4. Update task.status.current: "claimed"
    ↓
5. Add history entry
    ↓
6. Commit with message:
   "[JLB] CLAIM TASK-{uuid} by agent-{id}"
    ↓
7. Push to repository
```

### 5.3 Task Execution Workflow

```
Worker Agent
    ↓
1. Move task from QUEUED/ to ACTIVE/
    ↓
2. Update task.status.current: "active"
    ↓
3. Create STATUS-{task}-{ts}.md updates periodically
    ↓
4. If blocked:
   a. Move task to BLOCKED/
   b. Create BLOCK-{task}-{ts}.md with blocker details
   c. Notify via BROADCAST if urgent
    ↓
5. When complete:
   a. Move task to REVIEW/
   b. Create HANDOFF-{task}.md
   c. Update task.status.current: "review"
```

### 5.4 Double-Check Verification Workflow

```
Per Owner Requirements (Q6, Q7, Q8)

Worker Agent completes task
    ↓
1. Move to 03_COMPLETED/{agent-id}/PENDING_REVIEW/
    ↓
Verifier Agent 1 (Different Agent)
    ↓
2. Create VERIFY-{task}-1.md (Pass 1)
    ↓
3. If issues found:
   - Document in verification report
   - Return to worker for fixes
    ↓
4. If Pass 1 PASSED:
   - Move to REVIEWING/
    ↓
Verifier Agent 2 (Different from Agent 1)
    ↓
5. Create VERIFY-{task}-2.md (Pass 2)
    ↓
6. If Pass 2 PASSED:
   - Move to ACCEPTED/
   - Update task.status.current: "completed"
    ↓
7. If Pass 2 FAILED:
   - Document issues
   - Return to worker
   - Require new Pass 1 after fixes
```

### 5.5 Escalation Workflow

```
Worker Agent encounters blocker
    ↓
1. Create BLOCK-{task}-{ts}.md in 04_BLOCKS/ACTIVE/
    ↓
2. Create STATUS update documenting blocker
    ↓
3. If self-resolution fails:
   Move task to 02_CLAIMED/ESCALATED/
    ↓
4. Create escalation request with:
   - Blocker description
   - Attempted solutions
   - Assistance needed
    ↓
5. Other agents can claim escalated task
    ↓
6. Upon resolution:
   - Move blocker to RESOLVED/
   - Document solution in KNOWLEDGE_BASE/
```

---

## 6. COMMUNICATION PROTOCOLS

### 6.1 Commit Message Conventions

All JLB-related commits MUST use this format:

```
[JLB] {ACTION} {TASK-ID}: {Brief Description}

{Details if needed}

Tags: {relevant tags}
Agent: {agent-id}
```

**Action Types:**
- `NEW` - Create new task
- `CLAIM` - Claim existing task
- `UPDATE` - Progress update
- `HANDOFF` - Hand off to another agent
- `VERIFY-1` - Pass 1 verification
- `VERIFY-2` - Pass 2 verification
- `COMPLETE` - Task completion
- `BLOCK` - Report blocker
- `RESOLVE` - Resolve blocker
- `ARCHIVE` - Archive completed task

### 6.2 File Update Protocol

When updating an existing JLB file:

1. **Read current state** before modifying
2. **Update `modifiedAt` timestamp**
3. **Append to history** (never remove entries)
4. **Increment version** if schema changes
5. **Preserve all existing fields**
6. **Commit with descriptive message**

### 6.3 Conflict Resolution Protocol

When git merge conflicts occur in JLB files:

1. **Identify conflict type:**
   - Concurrent status updates → Merge history arrays
   - Concurrent claims → First commit wins (timestamp)
   - Verdict disagreement → Escalate to coordinator

2. **Resolution precedence:**
   - Earlier commit timestamp takes precedence
   - Later commits append to history
   - Conflicting status → STATUS-BLOCKED until resolved

3. **Document resolution:**
   Add conflict resolution entry to task history

---

## 7. QUALITY ASSURANCE

### 7.1 Mandatory Double-Check Protocol

Per owner requirements (Q6, Q8), all work undergoes:

**Pass 1: Critical Analysis**
- Different agent from creator
- Independent verification
- Document all findings
- Cannot be same agent as Pass 2

**Pass 2: Validation**
- Different agent from Pass 1
- Confirm Pass 1 findings
- Catch any missed issues
- Final acceptance decision

**Refinement Phase (if needed)**
- Creator addresses issues
- Returns to Pass 1
- Verification continues until passed

### 7.2 Verification Criteria

| Criterion | Pass 1 | Pass 2 | Both |
|-----------|--------|--------|------|
| Requirements Met | ✓ | ✓ | |
| Code Quality | ✓ | | ✓ |
| Documentation | ✓ | | ✓ |
| Test Coverage | ✓ | ✓ | |
| Style Compliance | ✓ | | ✓ |
| Integration Check | | ✓ | |
| Final Acceptance | | ✓ | |

### 7.3 Metrics and Tracking

Track in 07_LOGS/:
- Tasks created/claimed/completed per agent
- Verification pass rates
- Average time in each status
- Blocker frequency and resolution time
- Escalation patterns

---

## 8. AGENT REGISTRY

### 8.1 Registration Format (AGENT_REGISTRY.md)

```markdown
# Job Board Agent Registry

## Active Agents

### agent-{id}
- **Role:** [Primary role]
- **Capabilities:** [List of capabilities]
- **Specializations:** [Domain expertise]
- **Status:** active|inactive|busy
- **Contact:** [Notification preference]

## Capability Matrix

| Agent | Frontend | Backend | Data | Design | Docs | Research |
|-------|----------|---------|------|--------|------|----------|
| A | ★★★ | ★★ | ★ | ★ | ★★★ | ★★ |
| B | ★ | ★★★ | ★★★ | ★ | ★ | ★★★ |

## Agent Communication Preferences
- agent-A: Real-time updates, detailed handoffs
- agent-B: Summary reports, minimal handoffs
- agent-C: Async only, no interruptions
```

### 8.2 Capability Assessment

Agents self-assess capabilities:
- ★ Basic knowledge
- ★★ Competent
- ★★★ Expert

Used for task routing and assignment recommendations.

---

## 9. IMPLEMENTATION CHECKLIST

### Phase 1: Infrastructure
- [ ] Create `.job-board/` directory structure
- [ ] Initialize AGENT_REGISTRY.md
- [ ] Create 05_TEMPLATES/ with all schemas
- [ ] Set up 07_LOGS/ tracking

### Phase 2: Workflows
- [ ] Document task creation process
- [ ] Document claiming process
- [ ] Document verification process
- [ ] Document escalation process

### Phase 3: Integration
- [ ] Test with 2+ agents
- [ ] Verify git workflow
- [ ] Test conflict scenarios
- [ ] Validate double-check protocol

### Phase 4: Operational
- [ ] Begin active task coordination
- [ ] Monitor metrics
- [ ] Refine based on usage
- [ ] Update documentation

---

## 10. USAGE EXAMPLE

### Scenario: Mobile Agent Creates Task for Desktop Agent

**Step 1: Mobile Agent Creates Task**
```bash
# Mobile Agent
mkdir -p .job-board/01_LISTINGS/ACTIVE/HIGH/
cat > .job-board/01_LISTINGS/ACTIVE/HIGH/TASK-abc123.json << 'EOF'
{
  "task": {
    "id": "TASK-abc123",
    "version": "[Ver001.000]",
    "createdAt": "2026-03-09T10:00:00Z",
    "modifiedAt": "2026-03-09T10:00:00Z",
    "classification": {
      "priority": "high",
      "complexity": "moderate",
      "domain": "frontend",
      "estimatedDuration": "hours"
    },
    "ownership": {
      "creator": "agent-mobile",
      "assignee": "unassigned"
    },
    "specification": {
      "title": "Implement holographic card component",
      "description": "Create reusable HolographicCard.jsx with animated borders",
      "requirements": ["Framer Motion animations", "Configurable accent colors"],
      "acceptanceCriteria": ["Component renders correctly", "Animations at 60fps"]
    },
    "deliverables": {
      "outputPath": "apps/website-v2/src/components/",
      "format": "jsx",
      "verificationMethod": "review"
    },
    "history": [{"timestamp": "2026-03-09T10:00:00Z", "agent": "agent-mobile", "action": "created"}],
    "status": {"current": "listed", "progress": 0},
    "tags": ["#frontend", "#component", "#animation"]
  }
}
EOF
git add .
git commit -m "[JLB] NEW TASK-abc123: Implement holographic card component

Created by agent-mobile
Priority: HIGH
Estimated: hours
Tags: #frontend #component #animation"
git push
```

**Step 2: Desktop Agent Claims Task**
```bash
# Desktop Agent
git pull
mkdir -p .job-board/02_CLAIMED/agent-desktop/QUEUED/
git mv .job-board/01_LISTINGS/ACTIVE/HIGH/TASK-abc123.json \
       .job-board/02_CLAIMED/agent-desktop/QUEUED/
# Update task JSON with claim info
git add .
git commit -m "[JLB] CLAIM TASK-abc123 by agent-desktop"
git push
```

**Step 3: Desktop Agent Completes and Hands Off**
```bash
# Move to REVIEW, create handoff document
mkdir -p .job-board/02_CLAIMED/agent-desktop/REVIEW/
git mv .job-board/02_CLAIMED/agent-desktop/QUEUED/TASK-abc123.json \
       .job-board/02_CLAIMED/agent-desktop/REVIEW/
# Create HANDOFF-TASK-abc123.md
git add .
git commit -m "[JLB] HANDOFF TASK-abc123: Implementation complete

Component implemented with:
- Framer Motion animations
- Configurable accent colors
- 60fps performance verified

Ready for double-check verification."
git push
```

---

## 11. APPENDIX: RATIONALE BIBLIOGRAPHY

This framework is grounded in the research presented in RPT-RES-001, drawing upon:

1. **Multi-Agent Coordination Theory:** Rahwan & Jennings (2005), van der Aalst et al. (2003)
2. **File-Based IPC:** BMS Institute (2023), Tau University (2022)
3. **Petri Net Workflow Modeling:** van der Aalst (1998), Kiepuszewski et al. (2003)
4. **CRDT Consistency:** Shapiro et al. (2011), Weidner (2024)
5. **Economic Mechanism Design:** Parkes et al. (2025), Capgemini (2024)
6. **Transaction Cost Economics:** Coase (1937), Williamson (1975, 1985)
7. **Version Control as Coordination:** MIT (2022, 2023)
8. **Formal Specification:** Spivey (1988), Jones (1980)

Full bibliography available in RPT-RES-001.

---

**END OF DOCUMENT**