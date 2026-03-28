[Ver001.000]

# Task Execution Framework & Stub — Phase 9 Implementation

**Tier:** WORK SESSION  
**Valid Until:** 2026-03-30T23:59:59Z  
**Framework:** NJZPOF v0.2 · Task-level execution coordination  
**Audience:** Implementation agents executing individual tasks from plan.md

---

## Task Execution Lifecycle

```
TASK RECEIVED
  ↓
1. READ PLAN (identify task details, dependencies, verification)
  ↓
2. SETUP (ensure dependencies complete, create files, initialize context)
  ↓
3. IMPLEMENT (write code, following patterns from spec.md)
  ↓
4. VERIFY (run verification command, collect output)
  ↓
5. RESOLVE (fix failures, re-verify until pass)
  ↓
6. DELETE STUB (if this was a STUB file, replace with production)
  ↓
7. REPORT (log completion, update PHASE_GATES.md)
```

---

## Phase 1: Read Plan

**What you receive:**
- Plan file (plan.md or plan-minimap-feature.md)
- Task number (e.g., Task 3)
- Task title (e.g., "Storage abstraction layer (Protocol + LocalBackend)")

**What you must do:**

1. **Open plan file and locate your task:**
   ```
   Task 3: Storage abstraction layer (Protocol + LocalBackend)
   Gate Ref: [Gate 9.3]
   Dependencies: Task 1
   AC Links: AC-14
   Verification Command: pytest tests/unit/test_storage_backend.py -v
   Files Affected: packages/shared/api/src/njz_api/archival/storage/backend.py (new, ~200 LOC)
   ```

2. **Check if dependencies are complete:**
   - Task 3 depends on Task 1 — verify Task 1 status
   - If Task 1 marked PENDING in plan: **STOP and report blocker**
   - If Task 1 marked PASSED in plan: **PROCEED**

3. **Understand what you're building:**
   - Read the full task details section (purpose, approach, edge cases)
   - Read corresponding spec.md section (e.g., "Implementation Approach → Storage Abstraction Pattern")
   - Reference linked code from existing codebase

4. **Identify any assumptions or ambiguities:**
   - Task says "use Protocol vs ABC" — spec explains why
   - If unclear after reading spec: **Log assumption in code comment and proceed**

---

## Phase 2: Setup

**Environment preparation:**

1. **Create working branch** (optional, depends on your tooling):
   ```bash
   git checkout -b task/9.3-storage-abstraction
   ```

2. **Create files referenced in "Files Affected":**
   ```bash
   touch packages/shared/api/src/njz_api/archival/storage/backend.py
   touch tests/unit/test_storage_backend.py
   ```

3. **Update imports in parent modules:**
   - If creating new model: Add to `packages/shared/api/models/__init__.py`
   - If creating new service: Add to `packages/shared/api/archival/__init__.py`
   - **Verify imports don't break existing code:** `python -c "from njz_api import ..."`

4. **Set up test fixtures** (if needed):
   - Copy fixture patterns from existing tests (e.g., `tests/unit/test_archive_*.py`)
   - Create database fixtures (conftest.py) if integration tests needed

---

## Phase 3: Implement

**Code writing conventions:**

1. **File header format:**
   ```python
   """
   Module: njz_api.archival.storage.backend
   Purpose: Storage backend abstraction (Protocol-based)
   
   Author: [Agent task execution]
   Task: [Gate 9.3] — Storage abstraction layer
   Date: 2026-03-28
   
   References:
   - spec.md § 2 (Implementation Approach)
   - AGENTS.md § patterns for async services
   """

   from typing import Protocol, Any
   import asyncio
   # ... imports
   ```

2. **Code structure (follow existing patterns):**
   - Import order: stdlib → third-party → local
   - Type hints on all functions: `async def put(self, key: str, data: bytes) -> str:`
   - Error handling: Raise specific exceptions, don't silently fail
   - Comments: Explain WHY, not WHAT (code should be self-documenting)

3. **Async/await patterns (NO BLOCKING):**
   ```python
   # ❌ WRONG
   with open(file_path, 'w') as f:
       f.write(data)
   
   # ✅ RIGHT
   import aiofiles
   async with aiofiles.open(file_path, 'w') as f:
       await f.write(data)
   ```

4. **Error handling strategy:**
   - Use HTTP status codes (500, 503, 400, 409)
   - Catch specific exceptions, log with context
   - Return structured error responses: `{ error: str, code: str, timestamp: ISO8601 }`

5. **Testing inline:**
   - Write unit tests as you code (TDD or post-implementation unit tests)
   - Test error cases, not just happy path
   - Use descriptive test names: `test_storage_put_deduplicates_identical_content_hash()`

---

## Phase 4: Verify

**Run verification command from plan:**

1. **Execute verification command exactly as specified:**
   ```bash
   pytest tests/unit/test_storage_backend.py -v
   ```

2. **Expected output format:**
   ```
   tests/unit/test_storage_backend.py::test_put_stores_file ✓
   tests/unit/test_storage_backend.py::test_get_retrieves_file ✓
   tests/unit/test_storage_backend.py::test_delete_removes_file ✓
   tests/unit/test_storage_backend.py::test_put_409_on_duplicate_hash ✓
   
   ========== 4 passed in 0.45s ==========
   ```

3. **Lint & type check:**
   ```bash
   ruff check packages/shared/api/src/njz_api/archival/storage/
   mypy packages/shared/api/src/njz_api/archival/storage/ --strict
   ```

4. **All green?** → Proceed to Phase 5  
   **Failures?** → Proceed to Phase 5 (Resolve)

---

## Phase 5: Resolve

**If verification fails:**

1. **Identify failure type:**
   - Test failure: Read test output, fix implementation
   - Linting failure: Run `ruff check --fix` to auto-fix
   - Type error: Add type hints or assert statements

2. **Fix iteratively:**
   ```bash
   # Edit code
   vim packages/shared/api/src/njz_api/archival/storage/backend.py
   
   # Re-verify
   pytest tests/unit/test_storage_backend.py -v
   ```

3. **When all green:**
   - Verify once more (run full verification command)
   - Review code for quality (readability, no shortcuts)
   - Ensure no hardcoded values (use config/env)

---

## Phase 6: Delete Stub (if applicable)

**If this task started with a STUB file:**

1. **Identify stub file name:**
   - Example: Task 1 started with `TASK-001-STUB.md`
   - Example: Component started with `DATABASE-MODEL-STUB.py`

2. **Delete stub after verification passes:**
   ```bash
   rm TASK-001-STUB.md
   ```

3. **Verify deletion:**
   - Ensure production files exist in their place
   - No broken imports or references

---

## Phase 7: Report Completion

**Update plan.md (master agent does this, but document your status):**

1. **Status log format:**
   ```
   ✅ TASK 3 COMPLETE — [Gate 9.3] Storage abstraction layer
   - Implementation: packages/shared/api/src/njz_api/archival/storage/backend.py (200 LOC)
   - Tests: tests/unit/test_storage_backend.py (150 LOC)
   - Verification: pytest PASSED (4 tests, all green)
   - Lint: ruff PASSED
   - Type check: mypy PASSED
   - Branch: task/9.3-storage-abstraction (ready for PR)
   ```

2. **If blockers encountered:**
   ```
   ⏳ TASK 3 BLOCKED — [Gate 9.3] Storage abstraction layer
   - Reason: Task 1 (PostgreSQL migration) not yet complete
   - Mitigation: Will retry after Task 1 passes
   - Timeline impact: +1 day
   ```

3. **If assumptions made:**
   ```
   ⚠️ TASK 3 ASSUMPTIONS — [Gate 9.3] Storage abstraction layer
   - Assumed S3 backend deferred to Phase 2 (not implemented in Phase 1)
   - Assumed LocalBackend shard layout: {DATA_DIR}/frames/{hash[:2]}/{hash}.jpg
   - Both documented in code and spec.md section 2
   ```

---

## File Replacement Pattern (Stub → Production)

If you received a STUB file and are replacing it with production:

**Before:**
```
TASK-EXECUTION-STUB-2026-03-27.md  (this file — instructions)
STORAGE-BACKEND-STUB.py            (empty skeleton)
```

**After:**
```
packages/shared/api/src/njz_api/archival/storage/backend.py  (production)
tests/unit/test_storage_backend.py                           (production)
# STUB files DELETED
```

**Deletion safety check:**
```bash
# Before deleting, verify production file is in place
ls -la packages/shared/api/src/njz_api/archival/storage/backend.py

# After deletion, verify imports still work
python -c "from njz_api.archival.storage import LocalBackend; print('✓')"
```

---

## Troubleshooting

**Blocker: Dependency not complete**
- Can't start Task 3 until Task 1 passes? **Log blocker and skip to next ready task**
- If multiple blockers, report and wait for orchestrator guidance

**Blocker: Unclear spec**
- Spec section missing detail you need? **Document assumption in code comment, proceed**
- Example: "Assuming S3 retry logic deferred to Phase 2 per spec § 6"

**Blocker: Test data unavailable**
- Need real database? **Use test fixtures and mock data**
- Can't access external service? **Implement service mock**
- Example: `MockS3Backend` for testing storage abstraction

**Failure: Circular dependency**
- Task A depends on B, Task B depends on A? **STOP and report immediately**
- This is a plan error, not a code error

---

## Success Criteria

✅ **Task execution complete when:**
- All code written per spec.md approach
- All tests passing (pytest, ruff, mypy all green)
- No compiler/type errors
- Verification command returns expected success output
- Any STUB files deleted (replaced with production)
- Completion status reported with gate number

---

*This stub expires 2026-03-30. After this date, follow MASTER_PLAN.md for phase context.*
