[Ver001.000]

# Verification Checklist & Gate Completion — Phase 9

**Tier:** WORK SESSION  
**Valid Until:** 2026-03-30T23:59:59Z  
**Framework:** NJZPOF v0.2 · Gate verification coordination  
**Audience:** Implementation agents + orchestrator, for validating task/gate completion

---

## Gate Completion Lifecycle

```
TASK VERIFICATION COMMAND RUNS
  ↓
1. COMMAND OUTPUT CAPTURED
  ↓
2. COMPARE TO EXPECTED OUTPUT
  ↓
3. PASS/FAIL DETERMINATION
  ↓
4. IF PASS: Update PHASE_GATES.md + mark task PASSED
  ↓
5. IF FAIL: Log failure reason + retry or escalate
```

---

## Verification Command Execution

**Standard execution pattern:**

```bash
# Example: Task 3 verification
cd /path/to/repo
pytest tests/unit/test_storage_backend.py -v

# Expected output:
# tests/unit/test_storage_backend.py::test_put_stores_file PASSED
# tests/unit/test_storage_backend.py::test_get_retrieves_file PASSED
# tests/unit/test_storage_backend.py::test_delete_removes_file PASSED
# tests/unit/test_storage_backend.py::test_409_on_duplicate PASSED
#
# ========== 4 passed in 0.45s ==========
```

**Success criteria:**
- Exit code = 0
- Output contains "passed" (not "failed", "error", "warning")
- All test cases mentioned in verification command passed

**Failure criteria:**
- Exit code != 0
- Output contains "FAILED", "ERROR", or "error" keyword
- Any test case skipped or xfailed (unless explicitly expected)

---

## Gate Completion Checklist Template

**For each task completion, verify:**

```markdown
## Task 3: Storage abstraction layer — Gate Completion Checklist

### Pre-Verification
- [ ] Task 1 (prerequisite) marked PASSED in plan
- [ ] All files created: backend.py, test file, imports updated
- [ ] Code reviewed for syntax, style, completeness
- [ ] No hardcoded secrets or environment-specific paths

### Verification Command Execution
- [ ] Run: `pytest tests/unit/test_storage_backend.py -v`
- [ ] Exit code: 0 ✓
- [ ] Output: "X passed in Y.ZZs" (no failures)
- [ ] Ruff check: `ruff check packages/shared/api/src/njz_api/archival/storage/ --fix`
  - Exit code: 0 ✓
  - Output: "All checks passed" or "X violations fixed"
- [ ] Mypy check: `mypy packages/shared/api/src/njz_api/archival/storage/ --strict`
  - Exit code: 0 ✓
  - Output: "Success: no issues found in X files"

### Code Quality Validation
- [ ] No type errors (mypy --strict passed)
- [ ] No linting violations (ruff passed)
- [ ] Test coverage >= 80% for this module
  - Run: `pytest tests/unit/test_storage_backend.py -v --cov=packages/shared/api/src/njz_api/archival/storage`
  - Expected: Coverage >= 80%
- [ ] Docstrings present on all public functions/classes
- [ ] Comments explain WHY, not WHAT
- [ ] No blocking I/O (all async)

### Integration Validation
- [ ] Imports resolve without error: `python -c "from njz_api.archival.storage import LocalBackend"`
- [ ] No breaking changes to existing imports
- [ ] Related tests still pass (if Task 1 has tests, run them too)

### Documentation Validation
- [ ] Code comments match implementation
- [ ] Assumptions logged if any deviations from spec.md
- [ ] File header includes task reference: `# Task: [Gate 9.3]`

### STUB Cleanup
- [ ] If this task started with STUB file: STUB file deleted
- [ ] Production file in place of STUB
- [ ] No broken references to deleted STUB

### Gate Status Update
- [ ] PHASE_GATES.md Phase 9, [Gate 9.3] updated to ✅ PASSED
- [ ] Last Verified: 2026-03-28 (today's date)
- [ ] Plan.md Task 3 marked [x] COMPLETE

### Sign-Off
- [ ] Agent: [name of executing agent]
- [ ] Completion timestamp: 2026-03-28T14:30:00Z
- [ ] Comments: [any notes for next agent or CODEOWNER]
```

---

## Verification Patterns by Task Type

### Database Migration Task (e.g., Task 1)

**Verification command:**
```bash
alembic upgrade head && \
  pytest tests/unit/test_archive_models.py -v && \
  ruff check packages/shared/api/models/archive_frames.py && \
  mypy packages/shared/api/models/archive_frames.py --strict
```

**Expected output:**
```
INFO  [alembic.migration] Context impl PostgreSQLImpl with table alembic_version
INFO  [alembic.migration] Will assume transactional DDL.
INFO  [alembic.migration] Running upgrade ... (migration version)
tests/unit/test_archive_models.py::test_archive_frame_model PASSED
tests/unit/test_archive_models.py::test_archive_manifest_model PASSED
...
========== X passed in Y.ZZs ==========
All checks passed ✓
Success: no issues found in 1 file
```

**Success criteria:**
- Migration runs without error
- All model tests pass
- Ruff and mypy clean

---

### FastAPI Router Task (e.g., Task 5)

**Verification command:**
```bash
pytest tests/unit/test_archive_routes.py -v && \
  pytest tests/integration/test_archive_upload.py -v && \
  ruff check packages/shared/api/routers/archive.py && \
  mypy packages/shared/api/routers/archive.py --strict && \
  curl http://localhost:8000/v1/docs | grep -q "POST /v1/archive/frames"
```

**Expected output:**
```
tests/unit/test_archive_routes.py::test_upload_endpoint_accepts_valid_payload PASSED
tests/unit/test_archive_routes.py::test_upload_endpoint_returns_409_on_duplicate PASSED
...
tests/integration/test_archive_upload.py::test_upload_full_workflow PASSED
...
========== X passed in Y.ZZs ==========
All checks passed ✓
Success: no issues found in 1 file
(curl output includes "POST /v1/archive/frames")
```

**Success criteria:**
- Unit tests pass
- Integration tests pass
- Ruff and mypy clean
- FastAPI docs generated (endpoint appears in /v1/docs)

---

### Integration Test Task (e.g., Task 8)

**Verification command:**
```bash
pytest tests/integration/test_archive_e2e.py -v --tb=short && \
  pytest tests/integration/test_archive_e2e.py --cov=packages/shared/api/src/njz_api/archival --cov-report=term-missing
```

**Expected output:**
```
tests/integration/test_archive_e2e.py::test_upload_query_pin_gc_workflow PASSED
tests/integration/test_archive_e2e.py::test_deduplication_skips_duplicate PASSED
tests/integration/test_archive_e2e.py::test_gc_respects_pin_ttl PASSED
...
========== X passed in Y.ZZs ==========

Name                                                        Stmts   Miss  Cover   Missing
---------------------------                                -----   ----  -----   ----------
njz_api/archival/__init__.py                                  2      0   100%
njz_api/archival/services/archival_service.py               150      8    94%    123-131
njz_api/archival/routers/archive.py                         200      5    97%    445-448
---
TOTAL                                                      1200     25    98%
```

**Success criteria:**
- All integration tests pass
- Coverage >= 80% (shown in coverage report)
- No uncovered critical paths

---

## Gate Status File Update

**After verification passes, update PHASE_GATES.md:**

```markdown
### [Gate 9.3] Storage abstraction layer (Protocol + LocalBackend)

**Status:** ✅ PASSED  
**Last Verified:** 2026-03-28T14:30:00Z  
**Verification Command:** `pytest tests/unit/test_storage_backend.py -v`  
**Task:** Task 3 (plan.md)  
**Verification Evidence:**
- test_storage_backend.py: 4 tests PASSED
- Coverage: 94%
- Ruff: Clean
- Mypy: Clean (strict mode)

**Notes:** LocalBackend shard layout per spec.md § 2 (bottom-right naming convention). S3/R2 deferred to Phase 2.
```

---

## Failure Triage & Recovery

**If verification command fails:**

### Option 1: Code Fix (Typical)
```
FAILURE: test_put_deduplication_logic FAILED
ERROR: AssertionError: expected hash matching failed

ACTION:
1. Read test failure details
2. Identify code issue (e.g., hash comparison bug)
3. Fix code
4. Re-run verification command
5. Repeat until PASS
```

### Option 2: Test Fix (Rare)
```
FAILURE: test assumes AWS S3 availability, but S3 mocked locally

ACTION:
1. Verify test assumptions match spec.md
2. If test is wrong: Update test to use mock
3. If test is right but implementation wrong: Fix implementation
```

### Option 3: Blocker (Escalate)
```
FAILURE: Task 3 needs Task 1 migration, but Task 1 not passing

ACTION:
1. Verify Task 1 gate status in PHASE_GATES.md
2. If Task 1 marked PENDING: Wait and retry
3. If Task 1 marked PASSED but Task 3 still can't import: Investigate why
4. If blockers persist: Report to orchestrator with evidence
```

---

## Sign-Off Template

**After all verifications pass, log completion:**

```markdown
✅ GATE [9.3] VERIFICATION COMPLETE

Task: [Gate 9.3] Storage abstraction layer (Protocol + LocalBackend)
Agent: [Executing agent name]
Date: 2026-03-28
Time: 14:30 UTC

Verification Commands Executed:
1. ✅ pytest tests/unit/test_storage_backend.py -v
   - Output: 4 tests PASSED
2. ✅ ruff check packages/shared/api/src/njz_api/archival/storage/
   - Output: All checks passed
3. ✅ mypy packages/shared/api/src/njz_api/archival/storage/ --strict
   - Output: Success: no issues found

Code Quality Metrics:
- Test Coverage: 94%
- Linting Score: 100% (ruff clean)
- Type Safety: Strict mode compliant
- Blocking I/O: None detected

Files Affected:
- packages/shared/api/src/njz_api/archival/storage/backend.py (200 LOC)
- tests/unit/test_storage_backend.py (150 LOC)

Gate Status Updated:
- PHASE_GATES.md [Gate 9.3] → ✅ PASSED
- Last Verified: 2026-03-28T14:30:00Z

Notes:
- LocalBackend implementation per spec § 2 (shard layout documented)
- S3/R2 backends explicitly deferred to Phase 2 (documented in code)
- Protocol-based abstraction avoids ABC boilerplate per spec

Ready for: Task 4 (Archival service) can now proceed
```

---

## Monitoring & Metrics

**Track verification across all gates:**

| Gate | Task | Status | Last Verified | Next Gate |
|------|------|--------|---|---|
| 9.1 | PostgreSQL migration | ✅ PASSED | 2026-03-28T10:00Z | 9.2 |
| 9.2 | Pydantic schemas | ⏳ IN PROGRESS | — | 9.3 |
| 9.3 | Storage abstraction | ⏳ PENDING | — | 9.4 |
| 9.4 | Archival service | ⏳ PENDING | — | 9.5 |
| ... | ... | ... | ... | ... |

---

*This checklist expires 2026-03-30. After this date, follow MASTER_PLAN.md for phase context.*
