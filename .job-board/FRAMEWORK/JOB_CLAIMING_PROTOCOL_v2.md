[Ver002.000]

# JOB CLAIMING & REPORTING PROTOCOL v2.0

**Protocol Version:** 2.0  
**Effective Date:** 2026-03-23  
**Status:** MANDATORY  
**Supersedes:** Previous claiming protocols

---

## Overview

This protocol defines the standardized process for claiming jobs, completing work, and generating reports in the Job Listing Board (JLB) system. Version 2.0 introduces Git-based locking, structured reporting, and automated verification.

---

## Job Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   LISTED    │───▶│   CLAIMED   │───▶│  COMPLETED  │───▶│  CONSOLID.  │
│  (01_LISTINGS)│   │ (02_CLAIMED) │   │ (03_COMPLETED)│  │  (ARCHIVE)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │
      │                   │                   │
      ▼                   ▼                   ▼
  Available          Git Lock File       Completion        Work History
  for claim          created             Report            Entry
```

---

## Phase 1: Job Discovery

### View Available Jobs

```bash
# List all active jobs
ls -la .job-board/01_LISTINGS/ACTIVE/

# Read job description
cat .job-board/01_LISTINGS/ACTIVE/JOB-{ID}.md
```

### Job File Structure

```markdown
[Ver001.000]

# JOB-{ID}: {Title}

**Priority:** P0/P1/P2  
**Estimated Duration:** {X} hours  
**Dependencies:** {List of blocking jobs}  
**Required Skills:** {Skill tags}

## Description
{Detailed description of work required}

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Deliverables
1. {Expected deliverable 1}
2. {Expected deliverable 2}

## Verification Steps
1. {How to verify completion}
2. {Test commands}
```

---

## Phase 2: Job Claiming (Git-Based Locking)

### New: Git Lock File System

Replace directory-based claiming with atomic Git lock files:

```bash
# OLD METHOD (deprecated)
mkdir .job-board/02_CLAIMED/{agent-id}/

# NEW METHOD (mandatory)
# Create lock file with claim metadata
cat > .job-board/locks/JOB-{ID}-{agent-id}.lock << 'EOF'
---
job_id: "JOB-{ID}"
agent_id: "{agent-id}"
claimed_at: "2026-03-23T09:00:00Z"
claimed_by: "{agent-name}"
ttl_minutes: 30
slot: 5
estimated_completion: "2026-03-23T10:30:00Z"
---
Claimed by {agent-id} at {timestamp}
EOF

# Stage and commit lock file
git add .job-board/locks/JOB-{ID}-{agent-id}.lock
git commit -m "[JLB-CLAIM] {agent-id} claims JOB-{ID} - Slot 5"
```

### Lock File Schema

```yaml
---
# Required fields
job_id: "string"           # Job identifier
agent_id: "string"         # Agent identifier
claimed_at: "ISO8601"      # Claim timestamp
claimed_by: "string"       # Human-readable agent name
ttl_minutes: 30            # Time-to-live in minutes
slot: 1-21                 # Assigned slot number

# Optional fields
estimated_completion: "ISO8601"  # When work expected complete
priority: "P0/P1/P2"           # Priority override
dependencies: []               # Blocking dependencies
notes: "string"                # Claim notes
---
```

### Claiming Rules

1. **Atomic Claims:** Use Git for atomic lock acquisition
2. **TTL Enforcement:** Claims expire after 30 minutes without progress
3. **Conflict Resolution:** If commit fails, job already claimed
4. **Slot Assignment:** Claim specific slot in lock file

---

## Phase 3: Work Execution

### Progress Updates

Create checkpoint files in claimed work directory:

```bash
# Create work directory (for artifacts, not claiming)
mkdir -p .job-board/02_CLAIMED/{agent-id}/JOB-{ID}/

# Progress checkpoint
cat > .job-board/02_CLAIMED/{agent-id}/JOB-{ID}/PROGRESS_25.md << 'EOF'
[Ver001.000]

# Progress Checkpoint: 25%

**Job:** JOB-{ID}  
**Agent:** {agent-id}  
**Timestamp:** 2026-03-23T09:15:00Z  
**Status:** In Progress

## Completed
- [x] Task 1 completed
- [x] Task 2 completed

## Blockers
None

## Next Steps
- [ ] Task 3
- [ ] Task 4
EOF
```

### Blocker Reporting

If blocked, create blocker file:

```bash
cat > .job-board/04_BLOCKS/BLOCK-{ID}_{agent-id}.md << 'EOF'
[Ver001.000]

# BLOCK-{ID}: {Brief Description}

**Blocking Job:** JOB-{ID}  
**Blocked Agent:** {agent-id}  
**Reported At:** 2026-03-23T09:20:00Z  
**Severity:** Blocking/Non-blocking

## Description
{Detailed description of blocker}

## Dependencies
- Dependency 1
- Dependency 2

## Proposed Resolution
{How to resolve}

## Escalation
{If not resolved in X time, escalate to Foreman}
EOF
```

---

## Phase 4: Completion Reporting (v2.0 Format)

### New Structured Report Format

```markdown
[Ver002.000]

# COMPLETION REPORT: {agent-id}

**Job ID:** JOB-{ID}  
**Job Title:** {Title from listing}  
**Agent ID:** {agent-id}  
**Team:** {Team designation}  
**Slot:** {1-21}  
**Started:** 2026-03-23T09:00:00Z  
**Completed:** 2026-03-23T10:30:00Z  
**Duration:** 1.5 hours  
**Status:** ✅ COMPLETE / ⚠️ PARTIAL / ❌ BLOCKED

---

## Executive Summary
{1-2 paragraph summary of work completed}

---

## Deliverables

| # | Deliverable | Location | Status |
|---|-------------|----------|--------|
| 1 | {Name} | {Path} | ✅ Complete |
| 2 | {Name} | {Path} | ✅ Complete |
| 3 | {Name} | {Path} | ⚠️ Partial |

---

## Metrics

```yaml
tests:
  count: 42
  passing: 42
  failing: 0
  coverage: 87.5%

code_metrics:
  files_created: 5
  files_modified: 3
  lines_added: 450
  lines_removed: 120
  total_lines: 890

documentation:
  jsdoc_coverage: 100%
  readme_updated: true
```

---

## Verification

### Automated Verification
```bash
# Commands to verify completion
npm test
npm run lint
npm run typecheck
```

### Results
- ✅ All tests passing (42/42)
- ✅ TypeScript compilation successful
- ✅ Linting clean
- ✅ No circular dependencies

---

## Work Product

### Files Created
1. `src/feature/new-module.ts` (120 lines)
2. `src/feature/new-module.test.ts` (85 lines)
3. `docs/feature-documentation.md` (45 lines)

### Files Modified
1. `src/index.ts` (+15 lines)
2. `package.json` (+3 lines)

---

## Acceptance Criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Criterion 1 | ✅ Met | Test file X validates |
| Criterion 2 | ✅ Met | Demo in docs/video |
| Criterion 3 | ⚠️ Partial | Explanation here |

---

## Blockers Encountered

None / {List with resolutions}

---

## Recommendations

- Recommendation 1
- Recommendation 2

---

## Sign-off

**Agent:** {agent-id}  
**Date:** 2026-03-23  
**Quality Grade:** A/B/C/D
```

### Report Submission

```bash
# 1. Move completion report to completed directory
cp COMPLETION_REPORT.md .job-board/03_COMPLETED/WAVE_{N}/{agent-id}_COMPLETION_REPORT.md

# 2. Release lock
git rm .job-board/locks/JOB-{ID}-{agent-id}.lock
git commit -m "[JLB-COMPLETE] {agent-id} completes JOB-{ID} - Quality: A"

# 3. Update work history (if async agent available)
# This happens automatically via ASYNC-CON agents
```

---

## Phase 5: Verification & Consolidation

### Automated Verification Pipeline

```
┌─────────────────┐
│ Report Submitted│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ verify_consolidation.py
│ - Check all files exist
│ - Extract metrics
│ - Validate consistency
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌────────┐
│ PASS  │ │  FAIL  │
└───┬───┘ └───┬────┘
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Archive│ │ Request│
│        │ │  Fix   │
└────────┘ └────────┘
```

### Consolidation Trigger

Async agents (Slot 21) automatically:
1. Detect new completion reports
2. Run verification scripts
3. Generate/update manifests
4. Archive to .tar.gz
5. Update MASTER_HISTORY.yaml

---

## Quality Gates

### Before Claiming
- [ ] Job description read and understood
- [ ] Dependencies checked (all unblocked)
- [ ] Required skills confirmed
- [ ] Slot available (1-21)

### During Work
- [ ] Progress checkpoints every 25%
- [ ] Blockers reported within 15 minutes
- [ ] TTL extended if needed (update lock file)

### Before Completion
- [ ] All acceptance criteria met
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Metrics extracted

### After Completion
- [ ] Report follows v2.0 format
- [ ] All claimed files exist
- [ ] Lock released
- [ ] Work history updated

---

## Error Handling

| Scenario | Action | Timeout |
|----------|--------|---------|
| Git conflict on claim | Retry with backoff | 5 attempts |
| Lock file expired | Reclaim or foreman review | Immediate |
| Verification fails | Fix and resubmit | 1 hour |
| Blocker unresolved | Escalate to foreman | 30 minutes |
| Completion rejected | Revise and resubmit | 2 hours |

---

## Tool Reference

### Quick Commands

```bash
# Claim a job
./scripts/jlb-claim.sh JOB-{ID} {agent-id} {slot}

# Update progress
./scripts/jlb-progress.sh JOB-{ID} {agent-id} 50 "Progress notes"

# Report blocker
./scripts/jlb-block.sh JOB-{ID} {agent-id} "Blocker description"

# Complete job
./scripts/jlb-complete.sh JOB-{ID} {agent-id} COMPLETION_REPORT.md

# Verify before submit
python .job-board/FRAMEWORK/VERIFICATION_SCRIPTS/verify_consolidation.py \
    --files COMPLETION_REPORT.md --verbose
```

---

## Sign-off

**Protocol Author:** Foreman  
**Version:** 2.0  
**Date:** 2026-03-23  
**Status:** MANDATORY

---

*This protocol replaces all previous job claiming documentation.*
