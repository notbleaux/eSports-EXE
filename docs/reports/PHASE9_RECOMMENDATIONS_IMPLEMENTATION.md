[Ver001.000]

# Phase 9 Recommendations Implementation Plan

**Date:** 2026-03-28  
**Framework:** NJZPOF v0.2  
**Status:** IN PROGRESS

---

## Recommendation 1: Code Quality & Style Standardization

**Objective:** Address all linting warnings and establish consistent code style across the Archival System and Minimap Feature.

### Sub-point 1.1: Clean Up Unused Imports
- **Scope:** `routers/archive.py`, `routers/extraction.py`, `services/archival_service.py`, `services/extraction/service.py`
- **Action:** Remove all F401 (unused import) violations
- **Expected Reduction:** 15+ unused import statements
- **Verification:** `ruff check --select F401` returns clean

### Sub-point 1.2: Fix Import Ordering (E402, I001)
- **Scope:** All Python files in `src/njz_api/archival/` and `src/sator/extraction/`
- **Action:** Run `ruff check --fix` to auto-sort imports
- **Standard:** PEP 8 import order (stdlib, third-party, local)
- **Verification:** `ruff check --select I001` returns clean

### Sub-point 1.3: Resolve Line Length Violations (E501)
- **Scope:** `services/extraction/service.py`, `routers/extraction.py`
- **Action:** Wrap lines >100 characters using parentheses continuation
- **Target:** Maximum 100 characters per line
- **Verification:** `ruff check --select E501` returns clean

### Sub-point 1.4: Add Type Checking to CI Pipeline
- **Scope:** `.github/workflows/ci.yml`
- **Action:** Add `mypy` type checking step for archival and extraction modules
- **Config:** Use `mypy.ini` with strict mode for new code
- **Verification:** CI fails on type errors

### Sub-point 1.5: Standardize Docstring Format
- **Scope:** All public classes and methods
- **Action:** Enforce Google-style docstrings with type annotations
- **Tool:** Add `pydocstyle` to pre-commit hooks
- **Verification:** All public APIs have comprehensive docstrings

---

## Recommendation 2: Integration Test Suite Expansion

**Objective:** Expand test coverage to include end-to-end workflows between extraction, archival, and frontend components.

### Sub-point 2.1: Extraction-to-Archival E2E Test
- **File:** `tests/integration/test_extraction_to_archival.py`
- **Test Case:** Full pipeline: VOD → extraction → archival → query → verify
- **Mock Data:** Sample 10-second VOD with known frame count
- **Assertions:** Frame count matches, hashes verified, audit trail complete
- **Duration:** <30 seconds per test run

### Sub-point 2.2: Frontend API Integration Test
- **File:** `apps/web/src/services/archivalApi.integration.test.ts`
- **Test Case:** Real API calls to backend (using MSW or test server)
- **Coverage:** getFrames, pinFrame, unpinFrame error handling
- **Mock Server:** Use `msw` (Mock Service Worker) for consistent responses
- **CI Integration:** Run with `vitest` in CI pipeline

### Sub-point 2.3: Admin Pinning Workflow Test
- **File:** `tests/integration/test_admin_pinning_workflow.py`
- **Test Case:** Extract → Upload → Pin → Query pinned → Unpin → GC deletes
- **Auth Flow:** JWT token generation for admin user
- **State Verification:** Each step validates database state
- **Audit Verification:** Each action creates correct audit log entry

### Sub-point 2.4: Performance/Load Test
- **File:** `tests/load/test_archival_load.py`
- **Test Case:** Upload 1000 frames, measure latency
- **Tool:** `locust` or `pytest-benchmark`
- **Target:** P99 upload latency <2s for 1000 frames
- **Reporting:** Automated performance regression detection

### Sub-point 2.5: Error Recovery Test
- **File:** `tests/integration/test_error_recovery.py`
- **Scenarios:** Storage failure, DB connection loss, invalid JWT
- **Recovery:** Verify graceful degradation and retry logic
- **Metrics:** Error rates and recovery times logged
- **Alerts:** Critical failures trigger notifications

---

## Recommendation 3: Production Readiness & Observability

**Objective:** Prepare the implementation for production deployment with comprehensive monitoring, logging, and operational documentation.

### Sub-point 3.1: Structured Logging Implementation
- **Scope:** All archival and extraction services
- **Format:** JSON structured logs with correlation IDs
- **Fields:** timestamp, level, service, operation, duration, user_id, trace_id
- **Storage:** Centralized logging (Loki or CloudWatch)
- **Alerting:** Error rate thresholds trigger alerts

### Sub-point 3.2: Health Check Enhancement
- **Current:** Basic /health endpoint
- **Enhancement:** Deep health checks for DB, storage, dependencies
- **Endpoint:** `/health/deep` with component status
- **Response:** `{status: "healthy", components: {db: "up", storage: "up", ...}}`
- **Integration:** Kubernetes/Router health probes

### Sub-point 3.3: Operational Runbook Creation
- **File:** `docs/operations/ARCHIVAL_SYSTEM_RUNBOOK.md`
- **Sections:**
  - Common operations (manual GC, storage migration)
  - Troubleshooting guide (duplicate frames, storage full)
  - Incident response procedures
  - Rollback procedures
- **Examples:** Sample commands for each operation

### Sub-point 3.4: Environment Configuration Template
- **File:** `.env.archival.example`
- **Variables:** All required and optional env vars
- **Documentation:** Description of each variable
- **Validation:** Script to verify required variables are set
- **Security:** No secrets in example file

### Sub-point 3.5: Deployment Automation
- **Enhancement:** Update `render.yaml` and `docker-compose.yml`
- **Archival Service:** Dedicated service configuration
- **Volumes:** Persistent storage for frame data
- **Environment:** All required env vars templated
- **Health Checks:** Proper health probe configuration

---

## Implementation Priority

| Priority | Recommendation | Effort | Impact |
|----------|----------------|--------|--------|
| P0 | 1.1 - 1.3 (Code cleanup) | 30 min | High |
| P0 | 2.1 (E2E test) | 2 hours | Critical |
| P1 | 3.3 (Runbook) | 1 hour | Medium |
| P1 | 3.4 (Env template) | 30 min | Medium |
| P2 | 1.4 - 1.5 (CI/Style) | 1 hour | Low |
| P2 | 2.2 - 2.5 (More tests) | 4 hours | Medium |
| P3 | 3.1 - 3.2, 3.5 (Observability) | 3 hours | Low |

---

## Success Criteria

All recommendations implemented when:
- [ ] `ruff check` returns zero warnings
- [ ] E2E test passes: extraction → archival → query
- [ ] Runbook covers all common operations
- [ ] Environment template is complete
- [ ] CI includes type checking

---

*Implementation in progress...*
