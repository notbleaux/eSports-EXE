# Implementation Plan — Minimap Extraction Service

## Overview
This service extracts minimap frame sequences from VODs and classifies video segments for TeneT Key.Links verification.

---

### Architecture Refinement (Double-Pass Review)

**First Pass — Initial Refinements:**
1. **Separation of Extraction and Analysis**
   - Stream A focuses on high-speed sampling and storage.
   - Stream B decoupled to allow slower CV processing without blocking.
   - Use shared state to track frame processing status.
   - Lock frame indices between streams for consistency.
   - Implement "failed analysis" state for Stream B that doesn't invalidate Stream A.
2. **Dynamic Game Region Injection**
   - Minimap coordinates loaded dynamically based on `game` ID.
   - Support multiple regions per game layout (standard vs. alternate).
   - Use normalized coordinates (0.0-1.0) for resolution independence.
   - Compensate for aspect ratio shifts (4:3 vs 16:9).
   - Debug mode to visualize crop regions on sample frames.
3. **Chunked Persistence Pattern**
   - Flush frame metadata in batches to avoid long-running DB transactions.
   - Redis temporary storage for frame metadata before PG commit.
   - Job heartbeats to monitor extraction progress.
   - Hierarchical directory structure for frame storage.
   - Immediate cleanup of temporary video files.

**Second Pass — Strengthened Insights:**
1. **Decoupled Analysis Workflow (Refined Point 1)**
   - Transition to task queue (Celery/Redis) if Stream B latency exceeds 5x extraction time.
   - Partial verification state: TeneT receives Stream A data even if B is pending.
   - `worker_id` in `minimap_frames_stream_b` for parallel analysis support.
   - Memory-mapped files for high-speed frame sharing if co-located.
   - Verifier synchronization: run only when A/B counts match or timeout.
2. **Layout Detection & Self-Correction (Refined Point 2)**
   - 5-minute pre-scan phase to detect broadcast layout version.
   - Template matching on HUD elements (not just minimap) for game/layout confirmation.
   - Automatic minimap region switching if layout shift detected (e.g., halftime).
   - Layout-specific offsets stored in job record for audit trail.
   - Manual override API for automatic detection failures.
3. **Resilient Storage & TeneT Linkage (Refined Point 3)**
   - Content-addressable storage (CAS) or hash-based naming to prevent duplicates.
   - Manifest-first commit: write `manifest.json` to S3 before `COMPLETE` status.
   - Early `tenet_verification_id` linkage for intent tracking.
   - Redis caching for frequent Liquidpedia lookups to avoid rate limits.
   - Job garbage collection policy: auto-delete old frames unless "pinned" by TeneT.

---

### Delivery Phases Refinement (Double-Pass Review)

**First Pass — Initial Refinements:**
1. **MVP Scope Clarification**
   - Local File -> Stream A (Crops) -> PG metadata.
   - Skip segment detection in Week 1; 1fps raw extraction.
   - Implement basic `/health` and `/extract` (local path).
   - OpenCV standard `VideoWriter` logic.
   - Consistency check: file writes vs. DB records.
2. **Parallel Stream B Development**
   - Stream B as standalone module reading from Stream A output.
   - Start with "Player Dot Detection" using HSV color ranges.
   - `verifier.py` compares A presence with B results.
   - `minimap_frames_stream_b` table in migration 006.
   - Calibration with known VODs for HSV tolerances.
3. **TeneT Key.Links Hookup**
   - `tenet_client.py` using existing `circuit_breaker.py`.
   - Map extraction results to `minimap_analysis` schema.
   - Handle 401/403/503 errors with retry logic.
   - Log `tenet_confidence` in job record.
   - Verification service readiness for `minimap_analysis` payloads.

**Second Pass — Strengthened Insights:**
1. **Bootstrap & Instrumentation (Refined Phase 1)**
   - Early `Game Config System` (FR-26) to avoid hardcoding.
   - Prometheus metrics for memory/CPU monitoring during decoding.
   - Fast-Fail validation: check read permissions and disk space.
   - Structured JSON logging (`structlog`) for service consistency.
   - Dry Run mode for testing without side effects.
2. **Heuristic Content Classification (Refined Phase 2)**
   - `Segment Detection` (FR-09) prioritized to reduce storage waste.
   - Heuristic Tier (Brightness/Entropy) before Template Matching.
   - `segment_summary` in manifest for TeneT indexing.
   - Benchmarked Stream B throughput: < 1s/frame on 2 vCPU.
   - Verification of `BETWEEN_ROUND` segment identification accuracy.
3. **Advanced Integrations & URL Ingest (Refined Phase 3/4)**
   - `download_manager` for `yt-dlp` timeouts and cleanup.
   - S3/R2 as primary storage, local for dev.
   - Liquidpedia metadata validation via `legacy-compiler` proxy.
   - High Tier accuracy: template matching for `HALFTIME` and `BUY_PHASE`.
   - E2E validation: full VOD -> TeneT -> Truth Layer update.

---

### Recommendations

**Decision 1: Use Redis for Frame Metadata Buffering**
- **Decision**: Buffer metadata in Redis before bulk inserting to PostgreSQL.
- **Why**: High-frequency extraction can overwhelm PG with small transactions; reduces IOPS.
- **Support**:
  - Buffer 30-60 frames in a Redis List.
  - Flush metadata every 60 seconds or at segment boundary.
  - Use job UUID as key for isolation.
  - Decreases database lock contention.
  - Allows ephemeral storage during volatile extraction phases.

**Decision 2: Standardize on `TenetBaseModel` and Shared Schemas**
- **Decision**: Inherit from existing Pydantic base models and mirror TS schemas.
- **Why**: Ensures verification payloads are always compatible with TeneT Key.Links.
- **Support**:
  - Mirror `data/schemas/tenet-protocol.ts` in Python.
  - Use camelCase aliases for JSON consistency.
  - Simplifies future frontend integration.
  - Facilitates automatic, accurate OpenAPI docs.
  - Enables shared logic for coordinate mapping across services.

**Decision 3: Implement Tiered Accuracy Levels via Config**
- **Decision**: Define extraction quality tiers (STANDARD, MEDIUM, HIGH) in game config.
- **Why**: Trades off processing cost/time for data quality based on match importance.
- **Support**:
  - `STANDARD`: 1fps, Stream A only, basic heuristics.
  - `MEDIUM`: 1fps, Stream A + B, basic heuristics.
  - `HIGH`: 2fps+, Stream A + B, template matching + Liquidpedia validation.
  - Trust level sent to TeneT tied to tier choice.
  - Resource quotas (CPU/Memory) per tier for isolation.

---

### Integration Requirements

**Requirement 1: New Database Migration (006_minimap_extractor)**
- **What:** Tables for jobs, frames (A/B), verification results, and templates.
- **Why:** Essential persistence for the new service.
- **Effort:** 1-day task.
- **Location:** `packages/shared/api/migrations/`, `services/minimap-extractor/models.py`.

**Requirement 2: Update `services/tenet-verification` for `minimap_analysis` Source**
- **What:** Endpoint and logic to handle the new source type.
- **Why:** TeneT must be able to weight and route the extractor output.
- **Effort:** 1-hour task.
- **Location:** `services/tenet-verification/main.py`.

**Requirement 3: Shared Core Module Integration**
- **What:** Integrate `database.py`, `circuit_breaker.py`, `cache.py` from shared API.
- **Why:** Code reuse and reliability for DB/Redis/HTTP.
- **Effort:** 1-hour task.
- **Location:** `services/minimap-extractor/`.

**Requirement 4: Docker Compose & Infrastructure Update**
- **What:** Map port 8004 for the new service in root compose file.
- **Why:** Orchestration for local development.
- **Effort:** 1-line task.
- **Location:** `docker-compose.yml`.

**Requirement 5: Dependency Management**
- **What:** Add `opencv-python-headless`, `yt-dlp`, `structlog` to requirements.
- **Why:** Core libraries for video processing and logging.
- **Effort:** 1-line task.
- **Location:** `services/minimap-extractor/requirements.txt`.

---

## Implementation Tasks

### [ ] Phase 1: MVP Scaffolding
- [ ] Create `services/minimap-extractor/` directory and basic FastAPI structure.
- [ ] Implement `models.py` and `database.py` with SQLAlchemy async engine.
- [ ] Apply Alembic migration `006_minimap_extractor` to the database.
- [ ] Create `schemas.py` using `TenetBaseModel` for request/response models.
- [ ] Implement `tools/ingest.py` for local file path validation.
- [ ] Implement `tools/frame_sampler.py` for 1fps raw extraction using OpenCV.
- [ ] Add `GET /health` and `POST /v1/extract` (local file input only).
- [ ] Verify basic extraction job creates DB records and writes image crops to local disk.

### [ ] Phase 2: Dual Stream & Heuristics
- [ ] Implement `tools/segment_detector.py` with Brightness/Entropy heuristics.
- [ ] Implement `tools/stream_a.py` for JPEG crop storage and manifest generation.
- [ ] Implement `tools/stream_b.py` for HSV-based player dot detection.
- [ ] Implement `tools/verifier.py` for A/B consistency checking.
- [ ] Integrate Redis metadata buffering for frame-level updates.
- [ ] Add `accuracy_tier` support to the extraction job logic.
- [ ] Test with Valorant VOD and verify `minimap_frames_stream_b` population.

### [ ] Phase 3: TeneT & External Integration
- [ ] Implement `tenet_client.py` for `POST /v1/verify` communication.
- [ ] Update `services/tenet-verification` to accept `minimap_analysis` source.
- [ ] Implement `liquidpedia_client.py` for match metadata cross-checks.
- [ ] Implement `tools/storage.py` abstraction with S3/R2 support.
- [ ] Add `tenet_confidence` and `tenet_verification_id` tracking to job record.
- [ ] Verify full pipeline: Video -> Extractor -> TeneT -> PostgreSQL Truth Layer.

### [ ] Phase 4: Production Hardening
- [ ] Implement `yt-dlp` download manager in `tools/ingest.py`.
- [ ] Add `config/templates/` for HIGH tier template matching.
- [ ] Implement auto-layout detection in the pre-scan phase.
- [ ] Add Prometheus metrics and comprehensive logging.
- [ ] Write integration tests for the full extraction lifecycle.
- [ ] Update root `docker-compose.yml` and documentation.
