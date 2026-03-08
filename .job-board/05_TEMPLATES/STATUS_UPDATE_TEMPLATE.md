---
taskId: TASK-{uuid}
agentId: agent-{id}
timestamp: ISO-8601-timestamp
updateType: progress|blocker|milestone|completion|handoff-ready|escalation-request
progressPercent: 0-100
foremanAttention: true|false
---

# Status Update: [[updateType]] — [[taskId]]

## 📊 Current State Snapshot

| Field | Value |
|-------|-------|
| **Task** | [Task Title] |
| **Agent** | [[agentId]] |
| **Time** | [[timestamp]] |
| **Type** | [[updateType]] |
| **Progress** | [[progressPercent]]% |
| **Needs Foreman** | [[foremanAttention]] |

---

## 📈 Progress Summary

### Overall Progress: [[progressPercent]]%

```
[████████░░░░░░░░░░░░] 40% Complete
```

### Phase Breakdown
| Phase | Status | Progress |
|-------|--------|----------|
| Planning | ✅ Complete | 100% |
| Implementation | 🟡 In Progress | 60% |
| Testing | ⭕ Not Started | 0% |
| Documentation | ⭕ Not Started | 0% |

---

## ✅ Work Completed Since Last Update

### Completed Items
1. **[Item Title]**
   - Description: [What was done]
   - Deliverable: `path/to/file`
   - Time invested: X hours

2. **[Item Title]**
   - Description: [What was done]
   - Deliverable: `path/to/file`
   - Time invested: X hours

### Key Achievements
- [Milestone reached]
- [Breakthrough accomplished]
- [Challenge overcome]

---

## 🚧 Current Blockers (if any)

### Active Blockers

#### Blocker 1: [Title]
- **Description:** [What's blocking]
- **Impact:** [How it affects progress]
- **Attempted Solutions:** [What was tried]
- **Resolution Needed:** [What help is needed]
- **Escalation:** [To be escalated / Escalated to agent-{id}]

#### Blocker 2: [Title]
- **Description:** [What's blocking]
- **Impact:** [How it affects progress]
- **Resolution Needed:** [What help is needed]

### Blocker Impact Assessment
- **Schedule Impact:** [On track / Delayed by X hours / Critical risk]
- **Workaround Available:** [Yes/No — describe if yes]
- **External Dependency:** [None / Waiting for X]

---

## 📅 Next Steps (Next 24 Hours)

### Immediate Next Actions
1. [ ] [Specific action 1] — ETA: [Time]
2. [ ] [Specific action 2] — ETA: [Time]
3. [ ] [Specific action 3] — ETA: [Time]

### Upcoming Milestones
| Milestone | Target Date | Confidence |
|-----------|-------------|------------|
| [Milestone 1] | [Date] | High / Medium / Low |
| [Milestone 2] | [Date] | High / Medium / Low |

---

## 🆘 Assistance Needed (if any)

### From Other Agents
- **Request:** [What help is needed]
- **From:** [Specific agent or "any available"]
- **By When:** [Deadline]
- **Impact if Not Resolved:** [Consequences]

### From Foreman (if foremanAttention = true)
- **Reason:** [Why foreman attention needed]
- **Requested Action:** [What foreman should do]
- **Urgency:** [Critical / High / Medium]

---

## 💭 Notes for Other Agents

### Context Sharing
[Information that would be helpful for other agents to know]

### Decisions Made
[Recent decisions and their rationale]

### Risks Identified
[Potential future blockers or issues]

---

## 📊 Time Tracking

| Metric | Value |
|--------|-------|
| **Time Since Last Update** | X hours |
| **Total Time Invested** | Y hours |
| **Original Estimate** | Z hours |
| **Remaining Estimate** | W hours |
| **Variance** | +X / -Y hours |

### Time Distribution (This Period)
- Implementation: X%
- Research: Y%
- Documentation: Z%
- Debugging: W%

---

## 🔄 Workflow State

### Current Status
- **Location:** `02_CLAIMED/[[agentId]]/ACTIVE/` (or QUEUED/BLOCKED/REVIEW)
- **State:** active / blocked / reviewing / etc.
- **Next Transition:** [What happens next]

### Handoff Readiness
- [ ] Work complete enough for handoff
- [ ] Documentation ready
- [ ] Handoff form prepared
- [ ] Ready for verification

---

## 📎 Attachments and References

### Related Files
- `path/to/deliverable` — [Description]
- `path/to/documentation` — [Description]

### Related Tasks
- Depends on: [Task IDs]
- Blocks: [Task IDs]

---

## ✍️ Agent Certification

**Submitted By:** [[agentId]]  
**Timestamp:** [[timestamp]]  

**Status Accuracy:** I certify that this status update accurately reflects the current state of work on this task.

**Signature:** [Agent acknowledgment]

---

**Template Version:** [Ver001.000]  
**Framework:** Job Listing Board  
**Update Type:** [[updateType]]