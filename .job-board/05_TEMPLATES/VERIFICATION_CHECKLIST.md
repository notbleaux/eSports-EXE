---
taskId: TASK-{uuid}
verifier: agent-{id}
passNumber: 1|2
verificationType: initial|re-verification|foreman-review
foremanId: agent-{id}|null  # If foreman review
---

# Verification Report: Pass [[passNumber]] — [[taskId]]

## 🎯 Executive Summary

| Field | Value |
|-------|-------|
| **Task** | [Task Title] |
| **Pass** | [[passNumber]] of 2 |
| **Verifier** | [[verifier]] |
| **Type** | [[verificationType]] |
| **Status** | ⭕ PASS / 🟡 PASS_WITH_CONDITIONS / ❌ FAIL |
| **Confidence** | 🔴 High / 🟡 Medium / 🟢 Low |
| **Recommendation** | ✅ ACCEPT / 🟡 ACCEPT_WITH_FIXES / ❌ REJECT |

---

## 📋 Verification Scope

### Items Verified
- [Item 1]
- [Item 2]
- [Item 3]

### Verification Methods Used
- [ ] Code review (line-by-line)
- [ ] Functional testing (execution)
- [ ] Documentation review
- [ ] Cross-reference check (requirements)
- [ ] Style/convention compliance
- [ ] Security review
- [ ] Performance assessment
- [ ] Integration testing

### Standards Applied
- [ ] Project coding standards
- [ ] Documentation standards
- [ ] Security requirements
- [ ] Performance benchmarks
- [ ] Accessibility guidelines (if applicable)

---

## 🔍 Detailed Findings

### ⭕ Critical Issues (MUST FIX before acceptance)

| ID | Issue | Location | Severity | Fix Required | Verified Fix |
|----|-------|----------|----------|--------------|--------------|
| CRT-001 | [Description] | `path:line` | Critical | [What to do] | ⭕ / ✅ |
| CRT-002 | [Description] | `path:line` | Critical | [What to do] | ⭘ / ✅ |

**Count:** 0 critical issues required for PASS status

---

### 🟡 High Priority Issues (SHOULD FIX)

| ID | Issue | Location | Severity | Fix Required | Verified Fix |
|----|-------|----------|----------|--------------|--------------|
| HIG-001 | [Description] | `path:line` | High | [What to do] | ⭕ / ✅ |
| HIG-002 | [Description] | `path:line` | High | [What to do] | ⭕ / ✅ |

**Recommendation:** Fix if time permits, otherwise document for future revision

---

### 🟢 Medium Priority Issues (FIX IF TIME)

| ID | Issue | Location | Severity | Fix Required | Verified Fix |
|----|-------|----------|----------|--------------|--------------|
| MED-001 | [Description] | `path:line` | Medium | [What to do] | ⭕ / ✅ |

---

### 💡 Observations (INFORMATIONAL)

- [Observation 1 — positive or constructive feedback]
- [Observation 2 — suggestion for improvement]
- [Observation 3 — note on particularly good work]

---

## ✅ Compliance Check

### Requirements Verification

| Requirement | Specification | Implementation | Status | Evidence |
|-------------|---------------|----------------|--------|----------|
| Req 1 | [What was required] | [What was done] | ✅ Met / ❌ Not Met | `path/to/evidence` |
| Req 2 | [What was required] | [What was done] | ✅ Met / ❌ Not Met | `path/to/evidence` |
| Req 3 | [What was required] | [What was done] | ✅ Met / ❌ Not Met | `path/to/evidence` |

### Acceptance Criteria Check

From task specification:

| Criterion | Status | Evidence |
|-----------|--------|----------|
| [Criterion 1] | ✅ Pass / ❌ Fail | [Evidence] |
| [Criterion 2] | ✅ Pass / ❌ Fail | [Evidence] |
| [Criterion 3] | ✅ Pass / ❌ Fail | [Evidence] |

---

## 🔗 Cross-References

### Related Tasks
- Depends on: [Task IDs]
- Blocks: [Task IDs]
- Related to: [Task IDs]

### Affected Files
- `path/to/file` — [Description of change]
- `path/to/file` — [Description of change]

### Documentation References
- [Link to relevant docs]
- [Link to specifications]

---

## 📊 Verification Checklist

### Pre-Verification
- [ ] All deliverables present
- [ ] Handoff documentation complete
- [ ] Code compiles/builds successfully
- [ ] Tests executable

### During Verification
- [ ] All acceptance criteria checked
- [ ] Code reviewed for logic errors
- [ ] Documentation reviewed for accuracy
- [ ] Cross-references verified

### Post-Verification
- [ ] Findings documented
- [ ] Severity ratings assigned
- [ ] Fix requirements specified
- [ ] Recommendation determined

---

## 🎯 Final Assessment

### Strengths
1. [What was done particularly well]
2. [Positive aspects of implementation]

### Areas for Improvement
1. [Specific improvement opportunities]
2. [Technical debt to address]

### Comparison to Prior Work (if re-verification)
- Changes since Pass 1: [Summary]
- Issues resolved: [List]
- New issues introduced: [List]

---

## 📝 Verdict and Recommendation

### Recommendation

**[ ✅ ACCEPT / 🟡 ACCEPT_WITH_FIXES / ❌ REJECT ]**

### Rationale

[Detailed explanation of recommendation]

### Conditions (if ACCEPT_WITH_FIXES)

The following issues MUST be addressed:
- [ ] [Critical issue 1]
- [ ] [Critical issue 2]
- [ ] [High priority issue 1] (optional but recommended)

### Next Steps

1. If PASS: Move to Pass 2 (if Pass 1) or ACCEPTED (if Pass 2)
2. If PASS_WITH_CONDITIONS: Return to creator for fixes
3. If FAIL: Return to creator for significant revision

---

## ✍️ Verification Certification

I certify that this verification was conducted according to the Job Listing Board double-check protocol and represents my professional assessment.

**Verifier:** [[verifier]]  
**Date:** [Date]  
**Time Invested:** X hours  

**Signature:** [Agent certification of thoroughness and accuracy]

### Foreman Review (if applicable)

**Foreman:** [[foremanId]]  
**Review Date:** [If applicable]  
**Foreman Comments:** [Override notes if foreman-review type]

---

**Report Template:** [Ver001.000]  
**Framework:** Job Listing Board  
**Double-Check Protocol:** Pass [[passNumber]] of 2