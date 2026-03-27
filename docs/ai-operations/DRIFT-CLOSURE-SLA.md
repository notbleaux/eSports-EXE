[Ver001.000]

# Drift Closure SLA Matrix — NJZ eSports Platform

**Purpose:** Defines mandatory closure times for each drift type detected during Session Orientation (Stage 2D).
**Tier:** T1 — load when drift is detected or when auditing phase state.
**Authority:** `MASTER_PLAN.md §11` · `SESSION_LIFECYCLE.md Stage 2D`
**Framework:** NJZPOF v0.2

---

## Drift Type Definitions

| Drift Type | Trigger Condition | Authoritative Source |
|------------|-------------------|----------------------|
| **Re-execution Drift** | Session TODO references a gate already `✅ PASSED` in PHASE_GATES.md | PHASE_GATES.md |
| **Synchronization Drift** | MASTER_PLAN.md checklist `[x]` contradicts PHASE_GATES.md status (or vice versa) | PHASE_GATES.md wins |
| **Staleness Drift** | Gate `Last Verified` date > 30 days from today | PHASE_GATES.md Last Verified field |
| **Artifact Drift** | Gate marked `✅ PASSED` but primary artifact file is missing | Filesystem check |
| **Context Drift** | CONTEXT_FORWARD.md `Valid Until` date < today and no user override present | CONTEXT_FORWARD.md Valid Until field |

---

## SLA Closure Table

| Drift Type | Max Closure Time | Resolution Action | Commit Convention |
|------------|-----------------|-------------------|-------------------|
| **Re-execution Drift** | **< 5 min** | Remove gate from Session TODO; log "prevented re-execution of [gate N.X]" in Notebook | No commit required |
| **Synchronization Drift** | **< 15 min** | PHASE_GATES.md wins. Update MASTER_PLAN.md checklist to match. | `chore(drift-fix): reconcile MASTER_PLAN with PHASE_GATES [SAFE]` |
| **Staleness Drift** | **< 60 min** | Re-run gate verification command. Update `Last Verified` date in PHASE_GATES.md. | `chore(drift-fix): re-verify gate N.X staleness drift [SAFE]` |
| **Artifact Drift** | **< 15 min** | Mark gate `❌ ARTIFACT_MISSING` in PHASE_GATES.md. Add to CONTEXT_FORWARD DO NOT REDO: "re-implement [gate name] — artifact lost". | `chore(drift-fix): mark gate N.X ARTIFACT_MISSING [SAFE]` |
| **Context Drift** | **< 10 min** | Re-verify top 3 phase status claims against PHASE_GATES.md live state. Obtain user override or re-run orientation. | No commit required unless phase status changed |

---

## Escalation Protocol

```
Drift detected → Start resolution timer
     │
     ▼
Is drift resolved within SLA time?
     ├─ YES → Commit fix, log in Notebook, continue session
     └─ NO  → Check 120-min total cap
                    │
                    ▼
             120-min cap reached?
                    ├─ YES → STOP session work
                    │         Report to user with:
                    │           - Drift type(s) detected
                    │           - What was attempted
                    │           - What is still unresolved
                    │           - Recommended next action
                    └─ NO  → If non-blocking (Staleness only):
                              defer, flag in Notebook Open Questions,
                              continue session
```

**Non-blocking deferral rule:** Staleness Drift ONLY may be deferred past its 60-min SLA if:
1. The stale gate is NOT in the current session's work scope
2. It is flagged in the Session Notebook Open Questions with gate ref
3. It is added to the CONTEXT_FORWARD `Files That Need Attention Next Session`

All other drift types (Re-execution, Synchronization, Artifact, Context) are **blocking** — session work cannot begin until resolved.

---

## Detection Commands

### Re-execution Drift
```bash
# Compare Session TODO gate refs against PHASE_GATES.md PASSED gates
# Manual check: read TODO-YYYY-MM-DD.md, then grep PHASE_GATES.md for each gate ref
grep "PASSED" .agents/PHASE_GATES.md | grep -oE "[0-9]+-?[A-Z]?\.[0-9]+"
```

### Synchronization Drift
```bash
# Find all checked items in MASTER_PLAN.md
grep -n "\[x\]" MASTER_PLAN.md | grep -oE "Gate [0-9]+\.[0-9]+"
# Verify each against PHASE_GATES.md status
grep "PASSED\|FAILED\|PENDING" .agents/PHASE_GATES.md
```

### Staleness Drift
```bash
# Check Last Verified dates in PHASE_GATES.md
grep "Last Verified" .agents/PHASE_GATES.md
# Compare against today's date — any > 30 days is Staleness Drift
```

### Artifact Drift
```bash
# Spot-check: verify the last 3 PASSED gate artifacts still exist
# Example:
test -f .github/CODEOWNERS && echo "Gate 7.1 ✅" || echo "Gate 7.1 ❌ ARTIFACT_MISSING"
test -f .github/workflows/pr-classification.yml && echo "Gate 7.3 ✅" || echo "Gate 7.3 ❌ ARTIFACT_MISSING"
test -f .agents/AGENT_CONTRACT.md && echo "Gate 7-S.1 ✅" || echo "Gate 7-S.1 ❌ ARTIFACT_MISSING"
```

### Context Drift
```bash
# Check Valid Until date in CONTEXT_FORWARD
grep "Valid Until" .agents/session/CONTEXT_FORWARD.md
# If date < today and no user override → Context Drift
```

---

## Drift Log Format

When drift is detected and resolved, log in the Phase Logbook session entry:

```markdown
**Drift detected and resolved:**
- Type: [Re-execution | Synchronization | Staleness | Artifact | Context]
- Gate(s) affected: [N.X, N.Y]
- Detected at: Stage 2D
- Resolved in: [X min] (within SLA: YES/NO)
- Resolution: [what was done]
- Commit: [hash or "none required"]
```

If drift exceeded SLA or was escalated, also note in `CONTEXT_FORWARD.md` under `Open Questions for Next Session`.

---

## Authority Precedence

When two sources disagree, this chain resolves the conflict:

```
PHASE_GATES.md (canonical state machine)
       │ overrides
MASTER_PLAN.md checklist
       │ overrides
CONTEXT_FORWARD.md DO NOT REDO list
       │ overrides
Session TODO items
```

PHASE_GATES.md is always the authoritative record. Any other document claiming a gate is complete when PHASE_GATES.md does not → Synchronization Drift → PHASE_GATES.md wins.
