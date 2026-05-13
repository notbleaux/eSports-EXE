[Ver001.000]

# Active TODO Triage — Production Paths

**Last Updated:** 2026-05-13

This checklist records active-path TODO/stub items that are intentionally deferred and assigns owner + tracking anchors.

## Immediate Fixes in This PR

- [x] NJZ-TO-001..005: Added owner + tracking metadata for `apps/web/src/hooks/useExpertise.ts` TODOs.
- [x] NJZ-TO-101..104: Added owner + tracking metadata for `services/api/src/verification/tenet_stubs/__init__.py` stub TODOs.
- [x] NJZ-TO-201: Added owner + tracking metadata for `packages/shared/api/src/rotas/map_routes.py` mock-data TODO.

## Deferred Backlog with Ownership

### NJZ-TO-001
- **File:** `/apps/web/src/hooks/useExpertise.ts`
- **Status:** Deferred (API integration)
- **Owner:** `@frontend-platform`
- **Acceptance:** Replace mock profile fetch with real `/v1/help/expertise` data source and error handling.

### NJZ-TO-002
- **File:** `/apps/web/src/hooks/useExpertise.ts`
- **Status:** Deferred (realtime integration)
- **Owner:** `@frontend-platform`
- **Acceptance:** Implement websocket subscription lifecycle with cleanup and reconnect policy.

### NJZ-TO-003
- **File:** `/apps/web/src/hooks/useExpertise.ts`
- **Status:** Deferred (interaction telemetry)
- **Owner:** `@frontend-platform`
- **Acceptance:** Persist interaction events through backend API with retry strategy.

### NJZ-TO-004
- **File:** `/apps/web/src/hooks/useExpertise.ts`
- **Status:** Deferred (error telemetry)
- **Owner:** `@frontend-platform`
- **Acceptance:** Persist error events to backend with recoverable flag and feature context.

### NJZ-TO-005
- **File:** `/apps/web/src/hooks/useExpertise.ts`
- **Status:** Deferred (help telemetry)
- **Owner:** `@frontend-platform`
- **Acceptance:** Persist help-request events to backend and include content identifier.

### NJZ-TO-101
- **File:** `/services/api/src/verification/tenet_stubs/__init__.py`
- **Status:** Intentional placeholder (Phase X)
- **Owner:** `@backend-verification`
- **Acceptance:** Replace stub exports with production implementation module wiring.

### NJZ-TO-102
- **File:** `/services/api/src/verification/tenet_stubs/__init__.py`
- **Status:** Intentional placeholder (Phase X)
- **Owner:** `@backend-verification`
- **Acceptance:** Back verification service with persistent database queries.

### NJZ-TO-103
- **File:** `/services/api/src/verification/tenet_stubs/__init__.py`
- **Status:** Intentional placeholder (Phase X)
- **Owner:** `@backend-verification`
- **Acceptance:** Deliver confidence scoring algorithm matching TENET verification contract.

### NJZ-TO-104
- **File:** `/services/api/src/verification/tenet_stubs/__init__.py`
- **Status:** Intentional placeholder (Phase X)
- **Owner:** `@backend-verification`
- **Acceptance:** Implement review queue workflow for low-confidence verification results.

### NJZ-TO-201
- **File:** `/packages/shared/api/src/rotas/map_routes.py`
- **Status:** Deferred (backend data source)
- **Owner:** `@backend-rotas`
- **Acceptance:** Replace in-memory `MAPS_DB` with persisted map metadata provider.
