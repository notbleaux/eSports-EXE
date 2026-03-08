---
taskId: TASK-{uuid}
fromAgent: agent-{from-id}
toAgent: agent-{to-id}|unassigned
handoffTime: ISO-8601-timestamp
handoffType: partial|complete|escalation|reassignment|foreman-override
foremanId: agent-{id}|null  # If foreman-override
---

# Task Handoff: [[taskId]]

## 📋 Work Summary

**Task:** [Task Title from specification]  
**Handoff Type:** [partial/complete/escalation/reassignment/foreman-override]  
**From:** [[fromAgent]]  
**To:** [[toAgent]]  
**Time:** [[handoffTime]]

---

## ✅ Work Completed

### Summary
[Brief executive summary of work completed - 2-3 sentences]

### Deliverables Produced
| Deliverable | Location | Status | Notes |
|-------------|----------|--------|-------|
| [Name] | `path/to/file` | ✅ Complete | [Any notes] |
| [Name] | `path/to/file` | 🟡 Partial | [What's remaining] |
| [Name] | `path/to/file` | ⭕ Planned | [Not started] |

### Code Changes
```
[Key code snippets, file paths, or diff summaries]
```

### Documentation Updates
- [ ] README.md updated
- [ ] API documentation updated
- [ ] Architecture diagrams updated
- [ ] User guides updated
- [ ] None required

---

## 🧠 Context and Decisions

### Key Decisions Made

#### Decision 1: [Title]
- **What:** [Description of decision]
- **Why:** [Rationale]
- **Alternatives Considered:** [Other options]
- **Impact:** [Consequences of decision]

#### Decision 2: [Title]
- **What:** [Description]
- **Why:** [Rationale]
- **Alternatives Considered:** [Options]
- **Impact:** [Consequences]

### Open Questions for Next Agent
1. [Question requiring decision]
2. [Technical question]
3. [Design question]

### Assumptions Made
1. [Assumption 1]
2. [Assumption 2]

---

## ⚠️ Known Issues and Limitations

| Issue | Severity | Impact | Workaround | Planned Fix |
|-------|----------|--------|------------|-------------|
| [Description] | Critical/High/Medium/Low | [Impact] | [Workaround] | [When/who] |

### Technical Debt
- [ ] [Description of debt]
- [ ] [Description of debt]

---

## 🔗 Dependencies and Relationships

### Depends On (Prerequisites)
- [ ] TASK-{uuid}: [Status] — [Description]
- [ ] External: [Dependency]

### Blocks (Downstream)
- TASK-{uuid}: [Description of impact]
- TASK-{uuid}: [Description of impact]

### Related Work
- Related to: [Other tasks/files]
- Similar to: [Reference implementations]

---

## 🧪 Testing and Verification

### Tests Performed
| Test | Method | Result | Evidence |
|------|--------|--------|----------|
| [Description] | manual/automated/review | ✅ Pass/❌ Fail | `path/to/evidence` |

### Verification Checklist (Self-Assessment)
- [ ] All acceptance criteria addressed
- [ ] Code follows style guidelines
- [ ] No breaking changes (or documented)
- [ ] Documentation updated
- [ ] Tests pass
- [ ] Ready for review (if complete)
- [ ] Handoff documentation complete

---

## 📊 Time Investment

| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Planning | Xh | Yh | ±Zh |
| Implementation | Xh | Yh | ±Zh |
| Testing | Xh | Yh | ±Zh |
| Documentation | Xh | Yh | ±Zh |
| **Total** | **Xh** | **Yh** | **±Zh** |

**Remaining Estimate (if partial):** X hours

---

## 💡 Recommendations for Next Agent

### Immediate Next Steps
1. [Specific action to take first]
2. [Second action]
3. [Third action]

### Strategic Considerations
- [Strategic advice]
- [Potential pitfalls]
- [Optimization opportunities]

### Resources
- [Helpful documentation]
- [Reference implementations]
- [Contact for questions — if direct communication permitted]

---

## 📝 Additional Notes

[Any other information relevant to handoff]

---

## ✋ Handoff Confirmation

**Prepared By:**  
Agent: [[fromAgent]]  
Date: [Date]  
Signature: [Agent acknowledges accuracy of handoff]

**Accepted By:**  
Agent: [[toAgent]]  
Date: [To be filled]  
Signature: [Agent accepts responsibility]

**Foreman Review (if applicable):**  
Foreman: [[foremanId]]  
Date: [If foreman-override]  
Notes: [Foreman comments]

---

**Template Version:** [Ver001.000]  
**Framework:** Job Listing Board  
**Format:** Markdown with YAML frontmatter