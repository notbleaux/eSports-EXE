[Ver002.000]

# REVISED PRIORITY EXECUTION PLAN
## Post-Subagent Review: C → A → D Sequence

**Plan ID:** PLN-REVISED-002  
**Date:** March 9, 2026  
**Revision:** Based on 5-Round Review Synthesis  
**Trigger:** Phase 4 critical failures (4.75/10)

---

## 🎯 REVISED PRIORITY ORDER

### PRIORITY C: REDESIGN PHASE 4 (Most Broken)
**Rationale:** Phase 4 (Symbol Translation) scored **4.75/10** — lowest of all phases  
**Critical Issues:**
- 🔴 Knight's tour on 5×5 is **mathematically impossible**
- 🔴 Symbol count mismatch (claims 32, actual 31)
- 🔴 20×20 tiling math error
- 🟡 Arrow direction contradicts path

**Status:** ⏳ READY TO SPAWN  
**Assigned:** Subagent team (Analyst-Alpha + Optimizer-Delta collaboration)

---

### PRIORITY A: COMPLETE REPOSITORY VERIFICATION
**Condition:** After C completion  
**Assigned:** Async-Subagent-1 (already running)  
**Note:** Will continue legacy verification in parallel with C

---

### PRIORITY D: REPO HEALTH CHECKS & IMPROVEMENTS
**Condition:** After A completion  
**Scope:** CodeQL fixes, deployment optimization, general health  
**Assigned:** Full subagent team

---

## 📋 DETAILED BREAKDOWN

### PHASE 0: C — PHASE 4 REDESIGN (IMMEDIATE)

**Goal:** Fix mathematically impossible knight's tour, resolve symbol errors

**Spawn Configuration:**
```
Sessions: 2 (collaborative)
- Analyst-Alpha: Mathematical correctness
- Optimizer-Delta: Algorithm redesign

Model: kimi-coding/k2p5
Thinking: high
Timeout: 900 seconds (15 min)
Mode: Collaborative (shared STATE.yaml)
```

**Task Brief:**
```
PRIORITY C: PHASE 4 SYMBOL TRANSLATION REDESIGN

CRITICAL FIXES REQUIRED:
1. Replace knight's tour (impossible on 5×5) with valid traversal:
   - Options: Row scan, spiral, Hilbert curve, or open knight's tour
   - Must preserve SATOR↔ROTAS transformation semantics

2. Fix symbol count mismatch:
   - Reconcile 31 vs 32 discrepancy
   - Explicitly list all 25 SATOR symbols + remaining field symbols

3. Correct 20×20 tiling math:
   - Define: 6 SATOR + 6 ROTAS + 4 FIELD = 16 blocks
   - Or alternative valid tiling

4. Fix arrow direction:
   - Ensure field line arrows (↗/↘) match actual path direction
   - SATOR(0,0) to ROTAS(4,4) should be ↘ not ↗

DELIVERABLES:
- PHASE4_SYMBOL_TRANSLATION_REDESIGNED.md
- Updated STATE.yaml marking Phase 4 as "corrected"
- Verification checklist showing all 4 critical issues resolved

SUCCESS CRITERIA:
- [ ] Valid traversal algorithm specified
- [ ] Symbol count reconciled with explicit list
- [ ] Tiling math correct and diagram matches
- [ ] Arrow directions fixed
- [ ] Score improvement target: 4.75 → 7.5+
```

---

### PHASE 1: A — REPOSITORY VERIFICATION (CONTINUING)

**Status:** 🔄 IN PROGRESS (Async-Subagent-1, Pass 1/3)  
**Parallel:** Yes — runs concurrently with Phase 0C

**Async-Subagent-1 Current Status:**
- Session: `agent:main:subagent:318e295a-f0da-4624-b7a1-beaaae749514`
- Task: 3-pass repository verification
- Expected SITREP-001: Within 15 minutes

**Upon SITREP-001:**
- Review findings
- If transfer incomplete → Prioritize completion
- If transfer complete → Continue to redesign planning

---

### PHASE 2: D — HEALTH CHECKS (PENDING)

**Scope (from COMPREHENSIVE_REMEDIATION_PLAN):**
| Check | Priority | Assigned |
|-------|----------|----------|
| CodeQL 500+ warnings | High | CodeQL Specialist |
| GitHub Pages optimization | Medium | Deployment Engineer |
| Frontend validation | Medium | Frontend Validator |
| Documentation audit | Low | Documentation Curator |

**Condition:** After A confirmed complete AND Phase 4 redesign accepted

---

## 👥 REVISED AGENT ASSIGNMENTS

| Agent | New Assignment | Status | Task |
|-------|----------------|--------|------|
| **Foreman** (main) | Coordination | 🟢 Active | Plan revision, integration |
| **Async-Subagent-1** | Priority A | 🟢 Running | Repository verification |
| **Analyst-Alpha** | **Priority C** | 🟡 Standby → ACTIVE | Phase 4 math fixes |
| **Optimizer-Delta** | **Priority C** | 🟡 Standby → ACTIVE | Phase 4 algorithm redesign |
| **Reviewer-Beta** | Standby | 🟡 Available | Available for D |
| **Auditor-Gamma** | Standby | 🟡 Available | Available for D |

---

## 🔄 COORDINATION PROTOCOL

### Collaborative Mode for Priority C:
Both subagents work simultaneously:
1. **Analyst-Alpha** validates mathematical correctness
2. **Optimizer-Delta** designs replacement algorithms
3. Both update shared STATE.yaml
4. Foreman synthesizes and approves final design

### File Coordination:
```
/memory/phase4-redesign/
├── STATE.yaml (shared coordination)
├── analyst-alpha-findings.md
├── optimizer-delta-design.md
├── PHASE4_SYMBOL_TRANSLATION_REDESIGNED.md (final)
└── verification-checklist.md
```

---

## ✅ SUCCESS METRICS

| Phase | Metric | Target |
|-------|--------|--------|
| C | Phase 4 Score | 4.75 → 7.5+ |
| C | Critical Issues | 4 → 0 |
| A | Transfer Status | Confirmed complete |
| D | CodeQL Critical | 0 |
| D | CodeQL High | 0 |

---

## 🚀 IMMEDIATE NEXT ACTION

**Spawn Analyst-Alpha and Optimizer-Delta for Priority C (Phase 4 Redesign)?**

**YES/NO/Modify?**

If YES:
- Both subagents spawn immediately
- Work in collaborative mode on Phase 4
- Async-Subagent-1 continues Priority A in parallel
- Results expected in ~15 minutes

If NO:
- Please specify revised approach
- Or confirm different priority order