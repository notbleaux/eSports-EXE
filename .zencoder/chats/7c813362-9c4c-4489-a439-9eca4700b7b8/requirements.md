# Product Requirements Document — Minimap Extraction Service

**Feature:** Minimap Extraction Service
**Project:** NJZiteGeisTe Platform (NJZ eSports)
**PRD Version:** 0.1 (Draft — Pending Clarification)
**Created:** 2026-03-27
**Status:** DRAFT — 4 clarifying questions raised (see bottom)

---

## 1. Purpose

Build a backend data collection service that extracts minimap frames from recorded VCT and eSports game videos (Valorant-focused, with a reusable architecture for future games). The service feeds the `minimap_analysis` source channel in the TeneT Key.Links verification pipeline (trust level: MEDIUM, weight: 0.8), contributing to Path B (Static Truth Legacy) confidence scoring.

---

## 2. Context

The `minimap_analysis` data source type is already defined in `data/schemas/tenet-protocol.ts` and assigned MEDIUM trust level. The TeneT Verification Service at `services/tenet-verification/` already accepts `minimap_analysis` payloads via `POST /v1/verify`. This service fills that source slot by actually producing the payloads.

The service lives at `services/minimap-extractor/` and follows the same FastAPI + async Python patterns used by `services/legacy-compiler/` and `services/tenet-verification/`.

---

## 3. Goals

| Priority | Goal |
|----------|------|
| P0 | Extract minimap frame sequences from recorded game videos |
| P0 | Classify video segments by content type (live round, between-round, non-live/filler) |
| P0 | Compress and package extracted frames into a service-appropriate format |
| P1 | Aggregate minimap frame data across multiple recorded games for a given match/player |
| P1 | Submit extracted minimap data to TeneT Verification Service as `minimap_analysis` source |
| P2 | Modular game configuration so future games (CS2, LoL) can define their own minimap regions |

---

## 4. Non-Goals

- Real-time minimap extraction from live streams (Path A is handled by `services/websocket/`)
- Computer vision inference on extracted frames (player position detection, spike tracking) — this is a future ML layer, not this service
- Video hosting or CDN management — the service processes videos, it does not store or serve them
- Building a UI for this service — admin access is API-only

---

## 5. Functional Requirements

### 5.1 Video Ingestion

- **FR-01:** Accept a video source reference (file path or URL — see Clarification Q1) and a game identifier (`valorant`, `cs2`, etc.)
- **FR-02:** Support videos from local filesystem paths (absolute paths on server)
- **FR-03 (conditional):** If URL-based ingestion is in scope, support download from YouTube/Twitch VOD URLs via `yt-dlp` (free, no licensing cost)
- **FR-04:** Validate that the video file/URL is accessible before beginning extraction (fail fast)

### 5.2 Minimap Region Extraction

- **FR-05:** For each configured game, use a per-game minimap region spec (pixel coordinates or percentage-based crop box) to crop the minimap from each sampled frame
- **FR-06:** Valorant minimap region is configurable via a game config file — initial coordinates target the standard broadcast overlay position (bottom-left corner, approximately 15–20% of frame width)
- **FR-07:** Sampling rate is configurable (default: 1 frame per second); memory mode trades off frame count against RAM usage
- **FR-08:** Apply JPEG compression to extracted frames at configurable quality (default: 70%) to minimize storage footprint

### 5.3 Content Classification (Segment Detection)

- **FR-09:** Classify each sampled frame into one of three segment types:
  - `ROUND_LIVE` — Active gameplay (minimap shows player movement, round timer active)
  - `BETWEEN_ROUND` — Buy phase, round end screen, brief transitions
  - `NON_LIVE` — Commercial break, halftime, pre/post-game, stream offline cards
- **FR-10:** Classification uses simple heuristics: brightness variance, minimap region pixel entropy, and optionally frame difference between consecutive samples
- **FR-11:** Produce a segment timeline: ordered list of `{ start_sec, end_sec, segment_type, frame_count }` entries per video
- **FR-12:** Flag segment boundaries (transitions between types) with timestamps for downstream use

### 5.4 Frame Aggregation

- **FR-13:** For a given match ID, aggregate minimap frame data across multiple game VODs (e.g., map 1, map 2, map 3)
- **FR-14:** Associate each frame batch with: `match_id`, `game`, `map_name` (if determinable), `segment_type`, `video_source`, `extracted_at`
- **FR-15:** Produce a summary payload per extraction job: frame count, segment breakdown, extraction duration, sampling rate, any errors

### 5.5 TeneT Integration

- **FR-16:** After successful extraction, submit a `minimap_analysis` source payload to `services/tenet-verification/` at `POST /v1/verify`
- **FR-17:** The verification payload includes: entity_id (match_id), entity_type (`match`), game, source_type (`minimap_analysis`), trust_level (`MEDIUM`), weight (0.8), and the extraction summary as `data`
- **FR-18:** Handle TeneT verification responses: log confidence score and routing decision; retry on transient 5xx failures (max 3 retries, exponential backoff)

### 5.6 Frame Storage

- **FR-19:** Extracted frames are written to a configurable output directory (local filesystem, or S3-compatible path — see Clarification Q3)
- **FR-20:** Frame file naming convention: `{match_id}/{map_name}/{segment_type}/{frame_index:06d}.jpg`
- **FR-21:** A per-job manifest file (`manifest.json`) is written alongside frames: includes frame metadata, segment timeline, and job summary

### 5.7 Memory Management

- **FR-22:** Process video in streaming/chunked fashion — do not load entire video into RAM
- **FR-23:** Configurable frame buffer size (default: 30 frames in memory at a time before flushing to disk/output)
- **FR-24:** Release video reader resources immediately after extraction completes (context manager pattern)
- **FR-25:** Log memory usage at extraction start, midpoint, and end (for monitoring)

### 5.8 API Endpoints

- `POST /v1/extract` — Submit an extraction job (match_id, game, video_source, options)
- `GET /v1/jobs/{job_id}` — Check job status and results
- `GET /v1/jobs` — List extraction jobs (filterable by game, match_id, status)
- `DELETE /v1/jobs/{job_id}` — Cancel a running job or delete a completed job record
- `GET /v1/config/games` — List supported game minimap configs
- `GET /health` — Service health check
- `GET /ready` — Readiness probe

### 5.9 Game Configuration System

- **FR-26:** Game minimap configs are defined in a `config/games/` directory as JSON files (one per game)
- **FR-27:** Valorant config defines: minimap crop region (x, y, width, height as % of frame), expected frame rate range, segment detection thresholds
- **FR-28:** Adding a new game requires only a new JSON config file — no code changes

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Process 1 hour of 1080p video in < 15 minutes on a standard VPS (2 vCPU, 4GB RAM) at 1fps sampling |
| **Memory** | Peak RAM usage < 512 MB per extraction job at default settings |
| **Budget** | Zero external API or licensing costs (OpenCV + FFmpeg + yt-dlp only) |
| **Modularity** | New game support requires only a config file addition, no code change |
| **Reliability** | Jobs survive service restart (persist job state to PostgreSQL) |
| **Observability** | Structured logging (JSON), /metrics endpoint for Prometheus |
| **Compliance** | Respect robots.txt and rate limits for any remote video downloads; no copyright-infringing redistribution of frames |

---

## 7. Integration Points

```
Video Source (local path or VOD URL)
        ↓
services/minimap-extractor/   [NEW — this service]
        ↓ POST /v1/verify (minimap_analysis source)
services/tenet-verification/  [existing]
        ↓ PATH_B_LEGACY routing
PostgreSQL truth layer         [existing]
```

---

## 8. Technology Decisions (Proposed)

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Video decoding | OpenCV (`cv2`) + FFmpeg subprocess | Free, battle-tested, memory-efficient |
| VOD download | `yt-dlp` (optional, if URL input in scope) | Free, no API keys required |
| Frame compression | OpenCV `imencode` with JPEG quality param | Built-in, no extra dependency |
| Async job queue | Python `asyncio` + background task (FastAPI `BackgroundTasks`) | Matches existing service patterns; Celery only if job queue grows |
| Job persistence | PostgreSQL (AsyncSession via asyncpg) | Consistent with all other services |
| Service port | 8004 | Follows: tenet-verification=8001, websocket=8002, legacy-compiler=8003 |
| Python version | 3.11+ | Consistent with all services |

---

## 9. Out-of-Scope (Explicitly Deferred)

- ML-based minimap object detection (player dots, spike, bomb plant) — future Phase
- Real-time live stream minimap extraction — Path A concern
- Browser-accessible frame viewer UI
- Automated video sourcing (this service processes videos, it does not discover them)

---

## 10. Assumptions Made (Minor Details)

These were decided without clarification — please flag if incorrect:

- **A1:** The service produces JPEG compressed crops, not raw pixel data, to keep storage practical on a free-tier deployment
- **A2:** Segment classification uses pixel-level heuristics (no ML model required) — sufficient for flagging non-live segments; accuracy does not need to be perfect since the TeneT pipeline has a manual review queue for low-confidence results
- **A3:** The service port is 8004, continuing the existing service port convention
- **A4:** The minimap crop region for Valorant is a fixed percentage-based box (bottom-left corner), consistent with standard Valorant broadcast overlays — exact coordinates TBD in technical spec from reference screenshots
- **A5:** Job queue is in-process (FastAPI BackgroundTasks) initially; Celery/Redis queue only if concurrency demands it

---

## 11. Clarifying Questions (4 — Impact on Scope)

These require user input before finalizing scope. They affect implementation complexity significantly.

---

### Q1 — Video Input Method (HIGH IMPACT)

> Are the videos already downloaded to the server as local files, or does the service need to download them from a URL (YouTube, Twitch VOD, or another platform)?

- **Option A — Local files only:** Simpler. No `yt-dlp` dependency. Assumes a separate process has already fetched the video.
- **Option B — URL download included:** The service downloads from YouTube/Twitch/VOD URL using `yt-dlp` before extraction. Adds `yt-dlp` as a dependency and a download phase.
- **Option C — Both:** Accept either a file path or a URL.

*Assumed Option A for now (local files), with Option C noted as the preferred design. Please confirm.*

---

### Q2 — Minimap Frame Output: Images or Extracted Data? (CRITICAL SCOPE QUESTION)

> Should the service output **raw image files** (JPEG crops of the minimap), or should it also **analyze the images** to extract structured data (e.g., player positions as coordinates, alive/dead status, spike location)?

- **Option A — Image crops only:** The service captures and stores JPEG crops. Downstream ML services analyze them. Simpler, faster to build, lower accuracy risk.
- **Option B — Structured extraction:** The service runs computer vision (OpenCV template matching or basic segmentation) to extract player dot positions, alive/dead indicators, etc. as JSON data. More complex, significantly higher scope.

*Assumed Option A (image crops only) for the current phase. Please confirm.*

---

### Q3 — Frame Storage Backend (MEDIUM IMPACT)

> Where should extracted minimap frames be stored?

- **Option A — Local filesystem:** Frames written to a configured directory on the service host. Simplest. Works for development and small-scale use.
- **Option B — S3 / Cloudflare R2:** Frames uploaded to object storage. More appropriate for production scale. MASTER_PLAN.md mentions S3/R2 for raw video/HTML archives.
- **Option C — Both (configurable):** Local filesystem in dev, S3/R2 in production via environment variable.

*MASTER_PLAN.md lists S3/R2 for archival data. Option C assumed as the target design, with local-only as the Phase 1 MVP. Please confirm.*

---

### Q4 — Segment Classification Accuracy Requirement (MEDIUM IMPACT)

> How accurate does the between-round / non-live classification need to be for the minimap data to be useful?

The segment classifier distinguishes "active gameplay" from "buy phase" and "non-live filler." Getting this right requires:

- **Option A — Best-effort heuristics:** Brightness variance + pixel entropy. Fast, ~80% accuracy. Acceptable because the TeneT pipeline has a manual review queue for uncertain results.
- **Option B — Higher accuracy required:** Needs reference frame matching (detect known screen layouts for buy phase, halftime) using OpenCV template matching. More robust, ~95% accuracy, but requires maintaining reference image assets per game.

*Option A assumed (heuristics-only) for Phase 1. Please confirm, or specify an accuracy target.*

---

*End of PRD — awaiting user confirmation on Q1–Q4 before proceeding to Technical Specification.*
