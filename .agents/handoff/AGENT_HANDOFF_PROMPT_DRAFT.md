[Ver001.000]

# AGENT HANDOFF PROMPT - DRAFT
## For Next Kimi Code IDE Session

**Date:** 2026-04-01  
**Status:** PENDING APPROVAL  
**Handoff Type:** Full Context Transfer + Task Initiation  
**CRIT Protocol:** 1/2/3/5/6 Review Required

---

## ⚠️ USER OBLIGATIONS & REQUIREMENTS

### Before Next Agent Begins, User Must:

1. **Repository Access**
   - [ ] Confirm git remote is configured (`git remote -v`)
   - [ ] Verify push permissions to origin/main
   - [ ] Confirm .git/config has user.name and user.email

2. **Environment Setup**
   - [ ] Node.js v20+ installed (`node --version`)
   - [ ] pnpm installed (`pnpm --version`)
   - [ ] Python 3.11+ installed (`python --version`)
   - [ ] Poetry installed (`poetry --version`)

3. **Dependencies**
   - [ ] Run `pnpm install` in root (if not done)
   - [ ] Run `poetry install` in services/api (if not done)
   - [ ] Confirm no uncommitted critical changes

4. **Secrets/Environment**
   - [ ] .env file present with required vars
   - [ ] No secrets committed to repo
   - [ ] PANDASCORE_API_KEY configured (if testing)

5. **Approval**
   - [ ] Review and approve this handoff prompt
   - [ ] Confirm understanding of task scope
   - [ ] Acknowledge 1235+1 review protocol

### User Responsibilities During Session:

1. **Availability for Questions**
   - Respond to clarification requests within 15 minutes
   - Provide decision authority on architectural choices
   - Confirm scope changes before implementation

2. **Testing Support**
   - Provide API keys if external testing needed
   - Confirm test environment access
   - Validate user-facing changes

3. **Review & Approval**
   - Review checkpoint outputs at defined milestones
   - Approve major architectural decisions
   - Sign off on phase completions

---

## 📋 INITIAL INVESTIGATION TASKS

### Phase 1: Repository State Assessment (Read-Only)

**Task 1.1: Git Status Verification**
```bash
# Commands to run:
git status
git log --oneline -10
git branch -a
git diff --stat HEAD
git stash list
```
**Deliverable:** Git state report with:
- Modified files count
- Uncommitted changes summary
- Branch status
- Stash contents

**Task 1.2: File System Audit**
```bash
# Verify created structures exist:
ls -la notebooks/
ls -la todo/
ls -la plans/
ls -la .agents/skills/
```
**Deliverable:** Directory structure confirmation

**Task 1.3: Integration Verification**
```bash
# Verify key files exist:
test -f plans/FRAMEWORK.md && echo "FRAMEWORK.md: OK"
test -f notebooks/active/INDEX.md && echo "Notebooks INDEX: OK"
test -f todo/active/INDEX.md && echo "Todo INDEX: OK"
test -f plans/INDEX.md && echo "Plans INDEX: OK"
```
**Deliverable:** Critical files checklist

**Task 1.4: Link Validation (Sample)**
- Open 3 random files from each system
- Verify cross-references resolve
- Check ID consistency

**Deliverable:** Link integrity report

---

## 🎯 PRIMARY TASK PLANS

### Plan A: Framework Adoption (If approved)

**Goal:** Begin using the integrated planning framework for Phase 3

**Tasks:**
1. Create Phase 3 PLAN.md from template
2. Create initial sub-plans for frontend architecture
3. Populate backlog items into todo/active/phase/P3-alignment.md
4. Create first sprint plan for Phase 3
5. Create tomorrow's daily todo

**Deliverables:**
- PL-P3: Frontend Architecture plan
- SP-P3-001, SP-P3-002: Sub-plans
- S-P3-001: Sprint plan
- Daily todo: 2026-04-02.md

### Plan B: Plan Extraction Integration (Alternative)

**Goal:** Begin integrating the 12 extracted backlog items

**Tasks:**
1. Prioritize P0 items (TD-P3-001, TD-P4-001)
2. Create detailed specs for GameNodeIDFrame
3. Create detailed specs for Path A/B pipeline
4. Add to active sprint

**Deliverables:**
- Detailed spec: GameNodeIDFrame component
- Detailed spec: Data pipeline architecture
- Updated sprint plan with implementation tasks

### Plan C: Repository Synchronization (If needed)

**Goal:** Reconcile local changes with remote

**Tasks:**
1. Review all modified files
2. Stage appropriate files
3. Commit with conventional commit format
4. Push to origin/main
5. Verify sync

**Deliverables:**
- Clean git status
- Remote sync confirmation
- Commit log updated

---

## 🔍 VERIFICATION & REVIEW PROTOCOL

### CRIT 1/2/3/5/6 Review Checklist

#### Review 1: Structural Integrity (First Pass)
- [ ] All directories created correctly
- [ ] File naming conventions followed
- [ ] Version headers present ([VerMMM.mmm])
- [ ] ID system consistent

#### Review 2: Content Completeness (Second Pass)
- [ ] All templates have required sections
- [ ] Sample content demonstrates usage
- [ ] Links are bidirectional
- [ ] INDEX files populated

#### Review 3: Integration Testing (Third Pass)
- [ ] Cross-reference IDs unique
- [ ] Links resolve correctly
- [ ] Workflow examples clear
- [ ] No broken references

#### Review 5: Final Polish (Fourth Pass)
- [ ] Documentation proofread
- [ ] Consistent formatting
- [ ] No placeholder text remaining
- [ ] Professional presentation

#### Review 6: Handoff Readiness (Fifth Pass +1)
- [ ] User obligations documented
- [ ] Next agent can start immediately
- [ ] No blockers identified
- [ ] Approval ready

---

## 📊 CURRENT STATE SNAPSHOT

### Files Created (43 total)
```
notebooks/       10 files
todo/            7 files  
plans/           26 files
```

### Key Documents
- FRAMEWORK.md (13KB) - Complete integration guide
- INTEGRATION_SUMMARY.md (10KB) - Visual overview
- QUICKSTART.md (5KB) - 5-minute getting started
- COMPLETION_SUMMARY.md (6KB) - This handoff

### Git Status
```
Modified: ~100 files (skill updates, AGENTS.md)
New: 43 files (framework)
Uncommitted: All new files
```

---

## 🚀 RECOMMENDED FIRST ACTIONS

Once user approves this prompt:

1. **Immediate (First 15 min)**
   - Run git status audit
   - Verify file structure
   - Check environment

2. **Short-term (First hour)**
   - Complete triple scout pass
   - Identify any issues
   - Report findings to user

3. **Medium-term (First session)**
   - Begin selected task plan (A, B, or C)
   - Create first real planning artifacts
   - Demonstrate framework usage

---

## ⏸️ AWAITING USER APPROVAL

**This prompt is a DRAFT.**

Do not proceed until:
1. User reviews this document
2. User confirms obligations understanding
3. User approves task scope
4. User confirms environment readiness

**Next Step:** User approval → Final adjustments → Git sync → Handoff execution

---

*Agent Handoff Prompt - DRAFT v1.0*  
*Pending User Approval*
