# Minimap Feature Integration Tasks MF-7, MF-8, MF-9

## Summary

Completed integration of the Minimap Feature (MF) with the Archival System (AS-5) for the NJZiteGeisTe Platform. These tasks replace the mock implementations from Phase 1 with real API integrations.

**Date:** 2026-03-28  
**Status:** ✅ Complete  
**Tasks:** MF-7 (Backend), MF-8 (Frontend), MF-9 (Pinning)

---

## Files Modified/Created

### Backend (MF-7)

| File | Lines | Description |
|------|-------|-------------|
| `packages/shared/api/routers/extraction.py` | +38/-10 | Added ArchivalService injection, updated background task processing |
| `packages/shared/api/src/sator/extraction/service.py` | +45/-25 | Phase 2 ArchivalService integration with fallback handling |

**Key Changes:**
- Extraction router now creates `ArchivalService` with `LocalBackend` and injects it into `ExtractionService`
- `_upload_to_archival()` method now handles real `FrameUploadResponse` from ArchivalService
- Fallback to local storage if ArchivalService upload fails
- Proper manifest ID extraction from Pydantic model responses

### Frontend (MF-8, MF-9)

| File | Lines | Description |
|------|-------|-------------|
| `apps/web/src/services/archivalApi.ts` | 220 (new) | Real API client for Archival System endpoints |
| `apps/web/src/hooks/useMinimapFrames.ts` | +50/-40 | Updated to use real API + added `useFramePinning` hook |
| `apps/web/src/components/MinimapFrameGrid/VerificationBadge.tsx` | +75/-40 | Added interactive pinning support for admin users |
| `apps/web/src/components/MinimapFrameGrid/FrameThumbnail.tsx` | +15/-5 | Pass through pinning props to VerificationBadge |
| `apps/web/src/components/MinimapFrameGrid/MinimapFrameGrid.tsx` | +35/-5 | Integrated pinning with auth check and error toast |
| `apps/web/src/components/MinimapFrameGrid/types.ts` | +10/-2 | Updated type definitions for pinning props |

---

## Integration Points

### MF-7: Extraction → Archival API

**Flow:**
1. Client POSTs to `/v1/extraction/jobs` with match_id and vod_path
2. Router creates `ArchivalService(LocalBackend, db_pool)` instance
3. Background task `_process_job_background()` runs with archival_service injected
4. `ExtractionService.process_job()` extracts and classifies frames
5. `_upload_to_archival()` converts frames to `FrameMetadata` list
6. `ArchivalService.upload_frames()` stores frames with deduplication
7. Manifest ID returned and stored in extraction job record

**API Endpoints:**
- `POST /v1/extraction/jobs` - Start extraction job
- `GET /v1/extraction/jobs/{job_id}` - Check job status
- `GET /v1/extraction/jobs` - List jobs

### MF-8: Frontend → Archival API

**New Service:** `archivalApi` in `apps/web/src/services/archivalApi.ts`

**Methods:**
```typescript
archivalApi.getFrames(matchId, page, pageSize)  // GET /v1/archive/matches/{match_id}/frames
archivalApi.getFrame(frameId)                   // Not implemented (requires backend)
archivalApi.pinFrame(frameId, reason)           // POST /v1/archive/frames/{frame_id}/pin
archivalApi.unpinFrame(frameId)                 // POST /v1/archive/frames/{frame_id}/unpin
archivalApi.togglePin(frameId, pin)             // Helper for pin/unpin
archivalApi.getHealth()                         // GET /v1/archive/health
```

**Hook Updates:**
- `useMinimapFrames` now uses real `archivalApi.getFrames()` instead of mock
- Added `useFramePinning(matchId)` hook for pin/unpin operations with cache invalidation

### MF-9: TeNET Pinning → Archival API

**Admin-only pinning flow:**
1. Admin user clicks VerificationBadge on unpinned frame
2. `VerificationBadge` calls `onPinToggle(frameId, true)`
3. `MinimapFrameGrid` handles via `useFramePinning().handlePinToggle()`
4. `archivalApi.pinFrame()` POSTs to `/v1/archive/frames/{frame_id}/pin` with JWT
5. Backend `require_admin_auth` dependency validates admin role
6. `ArchivalService.pin_frame()` updates database and creates audit log
7. Frontend cache invalidated, frame list refreshes with new pinned status

**UI Components:**
- `VerificationBadge`: Shows pin status, tooltip with details, click to toggle (admin only)
- `FrameThumbnail`: Passes pinning props through to VerificationBadge
- `MinimapFrameGrid`: Manages pinning state, shows error toast on failures

---

## API Endpoint Mappings

| Frontend | Backend | Method | Auth |
|----------|---------|--------|------|
| `archivalApi.getFrames()` | `/v1/archive/matches/{match_id}/frames` | GET | None |
| `archivalApi.pinFrame()` | `/v1/archive/frames/{frame_id}/pin` | POST | Admin JWT |
| `archivalApi.unpinFrame()` | `/v1/archive/frames/{frame_id}/unpin` | POST | Admin JWT |
| `archivalApi.getHealth()` | `/v1/archive/health` | GET | None |

| Extraction | Backend | Method | Auth |
|------------|---------|--------|------|
| Create job | `/v1/extraction/jobs` | POST | None (add auth in production) |
| Get job | `/v1/extraction/jobs/{job_id}` | GET | None |
| List jobs | `/v1/extraction/jobs` | GET | None |

---

## Configuration

### Environment Variables

**Backend:**
```bash
# In .env or environment
ARCHIVE_DATA_DIR=./data  # Storage path for LocalBackend
```

**Frontend:**
```bash
# In .env or .env.local
VITE_API_URL=http://localhost:8000  # API base URL
```

### Auth Token Storage

The `archivalApi` expects JWT tokens in `localStorage` under key `sator_auth_token`. This is set by the existing auth flow in `api-client.ts`.

---

## Verification Commands

### Backend

```bash
cd packages/shared/api

# Verify Python syntax
python -m py_compile src/sator/extraction/service.py
python -m py_compile routers/extraction.py

# Test imports (requires dependencies)
python -c "from src.sator.extraction.service import ExtractionService; print('OK')"
```

### Frontend

```bash
cd apps/web

# Type check (note: project has existing errors in unrelated files)
pnpm run typecheck

# Lint
pnpm run lint
```

### E2E Test

```bash
# Start API
cd packages/shared/api && python main.py

# Test extraction + archival integration
curl -X POST http://localhost:8000/v1/extraction/jobs \
  -H "Content-Type: application/json" \
  -d '{"match_id": "550e8400-e29b-41d4-a716-446655440000", "vod_path": "/path/to/vod.mp4"}'

# Query archival for frames
curl http://localhost:8000/v1/archive/matches/{match_id}/frames?page=1&limit=50

# Pin a frame (requires admin JWT)
curl -X POST http://localhost:8000/v1/archive/frames/{frame_id}/pin \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Verified by TeNET", "ttl_days": 365}'
```

---

## Architecture Notes

### Phase 1 → Phase 2 Migration

**Before (Phase 1 Mock):**
- `ExtractionService` used local file storage only
- `mockArchivalClient` returned deterministic mock data
- No real pinning functionality

**After (Phase 2 Real):**
- `ExtractionService` injects real `ArchivalService`
- `archivalApi` calls actual REST endpoints
- Admin users can pin/unpin frames via API

### Fallback Behavior

The extraction service includes fallback logic:
1. Try to upload via `ArchivalService.upload_frames()`
2. On failure, fall back to local `ArchiveFrame` records
3. Log error and continue with extraction job

This ensures extraction jobs don't fail if the archival service is temporarily unavailable.

### Security Considerations

- Pinning endpoints require `admin` permission via `require_admin_auth` dependency
- JWT tokens are passed in `Authorization: Bearer {token}` header
- Token is retrieved from `localStorage` (set during OAuth login)
- Non-admin users see read-only verification badges

---

## Next Steps

1. **ML Training** (Phase 10): Run SimRating ML training with 50K+ real matches
2. **Monitoring**: Add metrics for extraction job success rates
3. **Optimization**: Add caching for frequently accessed frames
4. **WebSocket**: Real-time frame availability notifications

---

## References

- Archival System: `packages/shared/api/src/njz_api/archival/`
- Extraction Pipeline: `packages/shared/api/src/sator/extraction/`
- Frontend Components: `apps/web/src/components/MinimapFrameGrid/`
- API Documentation: `docs/API_V1_DOCUMENTATION.md`
