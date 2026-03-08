---
taskId: TASK-{uuid}
blockerId: BLOCK-{uuid}
agentId: agent-{id}
timestamp: ISO-8601-timestamp
severity: critical|high|medium|low
blockingType: technical|dependency|knowledge|resource|external|coordination
escalated: true|false
escalationTarget: agent-{id}|foreman|null
---

# Blocker Report: [[blockerId]] — [[taskId]]

## 🚨 Blocker Summary

| Field | Value |
|-------|-------|
| **Task** | [Task Title] |
| **Blocker ID** | [[blockerId]] |
| **Reported By** | [[agentId]] |
| **Time** | [[timestamp]] |
| **Severity** | [[severity]] |
| **Type** | [[blockingType]] |
| **Status** | ⭕ ACTIVE / 🟡 PENDING / ✅ RESOLVED |

---

## 🔍 Blocker Description

### What is Blocked?
[Specific task, feature, or activity that cannot proceed]

### The Problem
[Clear, detailed description of the blocker]

### Expected vs Actual
- **Expected:** [What should happen]
- **Actual:** [What is happening]
- **Error/Message:** [Any error messages or symptoms]

---

## 🎯 Impact Assessment

### Impact on Current Task
- **Progress Blocked At:** [[progressPercent]]%
- **Feature Affected:** [Specific feature/component]
- **Workaround Available:** [Yes/No — describe if yes]

### Impact on Other Tasks
| Task ID | Relationship | Impact Level |
|---------|--------------|--------------|
| TASK-{uuid} | Depends on this | Critical/High/Medium/Low |
| TASK-{uuid} | Related work | Critical/High/Medium/Low |

### Timeline Impact
- **Original ETA:** [Date/Time]
- **New ETA (if blocker persists):** [Date/Time]
- **Schedule Risk:** ⭕ Critical / 🟡 High / 🟢 Low

---

## 🔬 Investigation Performed

### Attempted Solutions

#### Attempt 1: [Description]
- **Approach:** [What was tried]
- **Result:** [Success/Failure]
- **Evidence:** [Logs, errors, outputs]

#### Attempt 2: [Description]
- **Approach:** [What was tried]
- **Result:** [Success/Failure]
- **Evidence:** [Logs, errors, outputs]

### Research Conducted
- [Documentation consulted]
- [Resources reviewed]
- [Similar issues found]

### Consultations
- [Agent or resource consulted]
- [Advice received]

---

## 🆘 Assistance Requested

### What Help is Needed?
[Specific assistance required to resolve blocker]

### From Whom?
- **Primary:** [Specific agent, foreman, or "any expert"]
- **Secondary:** [Backup option]

### By When?
- **Deadline:** [When resolution needed]
- **Consequence of Delay:** [What happens if not resolved]

### Required Expertise
- [ ] Technical domain knowledge
- [ ] Access to specific resources
- [ ] Decision authority
- [ ] Coordination with external parties
- [ ] Research capability

---

## 📝 Context and Background

### Relevant Code/Configuration
```
[Code snippets, config files, or relevant technical details]
```

### Steps to Reproduce (if technical)
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Environment
- **Location:** [Where the blocker occurs]
- **Dependencies:** [What it depends on]
- **Recent Changes:** [Any recent changes that might relate]

---

## 💡 Proposed Solutions (if any)

### Option 1: [Title]
- **Description:** [What could be done]
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Effort:** [Estimated effort]
- **Confidence:** High/Medium/Low

### Option 2: [Title]
- **Description:** [Alternative approach]
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Effort:** [Estimated effort]
- **Confidence:** High/Medium/Low

### Recommendation
[Which option is preferred and why]

---

## 🔄 Escalation Status

### Escalation History
| Time | From | To | Action | Result |
|------|------|-----|--------|--------|
| [Time] | agent-{id} | agent-{id} | Consulted | [Result] |
| [Time] | agent-{id} | foreman | Escalated | [Result] |

### Current Escalation
- **Escalated:** [[escalated]]
- **Target:** [[escalationTarget]]
- **Awaiting Response:** [Yes/No — from whom]

---

## ✅ Resolution (when resolved)

### Resolution Details
**Date Resolved:** [Date]  
**Resolved By:** [Agent or foreman]  
**Resolution Type:** [fix/workaround/dependency-met/external-resolved]

### Solution Applied
[Description of how the blocker was resolved]

### Verification
- [ ] Blocker confirmed resolved
- [ ] Task can proceed
- [ ] No regressions introduced
- [ ] Knowledge documented (if applicable)

### Time to Resolution
- **Reported:** [[timestamp]]
- **Resolved:** [Resolution timestamp]
- **Duration:** X hours

### Lessons Learned
[What was learned that could help future similar blockers]

---

## 📚 Knowledge Base Reference

### Similar Blockers
- [Link to similar blocker reports]
- [Link to solutions in KNOWLEDGE_BASE/]

### Solution to be Archived
[If resolved with novel solution, document for future reference]

**Archive Location:** `04_BLOCKS/KNOWLEDGE_BASE/[blocker-type]/`

---

## ✍️ Agent Report

**Reported By:** [[agentId]]  
**Timestamp:** [[timestamp]]  

**Accuracy:** I certify that this blocker report accurately describes the issue and all attempted solutions.

**Signature:** [Agent acknowledgment]

---

**Template Version:** [Ver001.000]  
**Framework:** Job Listing Board  
**Severity:** [[severity]]  
**Status:** ACTIVE → PENDING → RESOLVED