# Technical Specification — Minimap Extraction Service

**Feature:** Minimap Extraction Service (`services/minimap-extractor/`)
**Version:** 0.1 (Draft)
**Created:** 2026-03-27
**Phase:** Post-Phase 10 / Phase 11 candidate
**PRD Source:** `requirements.md` (v0.1)
**Status:** DRAFT — Pending user confirmation before Planning step

---

## Table of Contents

1. [Technical Context](#1-technical-context)
2. [Architecture Overview](#2-architecture-overview)
3. [Dual-Stream Pattern — Parallel to TeneT](#3-dual-stream-pattern--parallel-to-tenet)
4. [Source Code Structure](#4-source-code-structure)
5. [Data Models](#5-data-models)
6. [API Interface](#6-api-interface)
7. [Sub-Tool Modules](#7-sub-tool-modules)
8. [HUB Classification System](#8-hub-classification-system)
9. [Segment Classification — Tiered Accuracy](#9-segment-classification--tiered-accuracy)
10. [Storage Backend](#10-storage-backend)
11. [GitHub Storage Investigation](#11-github-storage-investigation)
12. [TeneT Integration](#12-tenet-integration)
13. [Liquidpedia Metadata Validation](#13-liquidpedia-metadata-validation)
14. [Delivery Phases](#14-delivery-phases)
15. [Verification Approach](#15-verification-approach)
16. [Dependencies](#16-dependencies)
17. [Environment Variables](#17-environment-variables)

---

## 1. Technical Context

| Property | Value |
|----------|-------|
| **Language** | Python 3.11+ |
| **Framework** | FastAPI (async) |
| **Service port** | 8004 (follows: tenet-verification=8001, websocket=8002, legacy-compiler=8003) |
| **Database** | PostgreSQL 15+ via asyncpg / SQLAlchemy async |
| **Cache** | Redis (Upstash) |
| **Video decoding** | OpenCV (`cv2`) + FFmpeg subprocess |
| **VOD download** | `yt-dlp` (free, no API key required) |
| **Computer vision** | OpenCV only (no ML framework in Phase 1–2) |
| **Storage** | Local filesystem (Phase 1), S3/Cloudflare R2 (Phase 3+) |
| **Job queue** | FastAPI `BackgroundTasks` (Phase 1–2); Celery + Redis queue if concurrency demands it |
| **Service location** | `services/minimap-extractor/` |
| **Pattern source** | Mirrors `services/tenet-verification/` for DB, FastAPI, Pydantic patterns |
| **Circuit breaker** | Mirrors `services/legacy-compiler/` CircuitBreaker pattern for external calls |
| **Retry logic** | Mirrors `services/legacy-compiler/` `retry_with_backoff()` pattern |

### Key Existing Integration Points

- **`data/schemas/tenet-protocol.ts`** — `minimap_analysis` source type already registered; trust level MEDIUM (weight 0.8)
- **`services/tenet-verification/`** — `POST /v1/verify` accepts `minimap_analysis` payloads without code change
- **`services/legacy-compiler/`** — Liquidpedia client available for metadata cross-reference
- **`packages/shared/api/schemas/`** — Pydantic base models to follow for consistency

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│            services/minimap-extractor/                  │
│                    port 8004                            │
│                                                         │
│  ┌──────────────┐      ┌──────────────────────────┐    │
│  │  Video Ingest│      │  Segment Detector         │    │
│  │  (local path │─────▶│  (ROUND_LIVE /            │    │
│  │   or yt-dlp) │      │   BETWEEN_ROUND /         │    │
│  └──────────────┘      │   NON_LIVE)               │    │
│                         └────────────┬─────────────┘    │
│                                      │                   │
│                    ┌─────────────────┴──────────────┐   │
│                    │       Frame Sampler             │   │
│                    │   (configurable fps, chunked)   │   │
│                    └──────┬──────────────┬───────────┘   │
│                           │              │                │
│              ┌────────────▼──┐    ┌──────▼────────────┐  │
│              │   STREAM A    │    │    STREAM B        │  │
│              │  Image Crops  │    │  Structured CV     │  │
│              │  (JPEG, raw   │    │  (player dots,     │  │
│              │   minimap     │    │   alive/dead,      │  │
│              │   captures)   │    │   spike pos)       │  │
│              └──────┬────────┘    └──────┬─────────────┘  │
│                     │                    │                  │
│                     └────────┬───────────┘                  │
│                              │                               │
│                     ┌────────▼────────────┐                  │
│                     │  Cross-Stream        │                  │
│                     │  Verifier            │                  │
│                     │  (consistency check, │                  │
│                     │   confidence score)  │                  │
│                     └────────┬────────────┘                  │
│                              │                                │
│              ┌───────────────┴──────────────┐                 │
│              │                              │                  │
│  ┌───────────▼────────┐       ┌────────────▼────────────┐    │
│  │  Storage Backend   │       │  TeneT Verification     │    │
│  │  (local / S3 / R2) │       │  POST /v1/verify        │    │
│  └────────────────────┘       │  source: minimap_analysis│   │
│                                └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Dual-Stream Pattern — Parallel to TeneT

The dual-stream architecture deliberately mirrors the **TeneT Path A / Path B** design, applying it within the extraction service itself. This is intentional — the minimap extractor functions as a micro-TeneT for video data.

| TeneT Concept | Minimap Extractor Equivalent |
|---------------|------------------------------|
| Path A — Live (fast, simple) | **Stream A** — Raw JPEG crops (fast, large volume, unanalyzed) |
| Path B — Static Truth Legacy (slow, rich) | **Stream B** — Structured CV data (slower, analyzed, structured JSON) |
| TeneT Key.Links Verification Bridge | **Cross-Stream Verifier** — Reconciles streams, flags contradictions, assigns confidence |
| Twin raw copies / audit trail | **Dual manifests** — Stream A + Stream B manifests stored independently with cross-reference IDs |
| Distribution path routing | **HUB classification** — Tags which QuarterKey(s) the data serves (SATOR/AREPO/OPERA/ROTAS) |
| Manual review queue | **Flagged frames** — Low-confidence cross-stream results queued for review |

### Compiler of Sub-Tools

The service acts as a **compiler**: each `tool/` module is a discrete, independently testable sub-tool. The main extraction job orchestrates them in a pipeline:

```
ingest → segment_detector → frame_sampler → [stream_a | stream_b] → verifier → storage → tenet_client
```

Each sub-tool:
- Has its own input/output schema
- Can be invoked independently (for testing, re-processing, or future enrichment)
- Produces output that is consumed by the next tool in the chain
- Is versioned independently via its own config

---

## 4. Source Code Structure

```
services/minimap-extractor/
│
├── main.py                          # FastAPI app, lifespan, route registration
├── models.py                        # SQLAlchemy ORM models (5 tables)
├── schemas.py                       # Pydantic request/response models (TenetBaseModel)
├── database.py                      # Async engine, session factory (mirrors tenet-verification)
├── tenet_client.py                  # HTTP client → services/tenet-verification POST /v1/verify
├── liquidpedia_client.py            # HTTP client → Liquidpedia metadata validation
│
├── tools/                           # Sub-tool modules (the compiler pipeline)
│   ├── __init__.py
│   ├── ingest.py                    # Video ingestion: local path validator + yt-dlp downloader
│   ├── segment_detector.py          # Content classification (ROUND_LIVE / BETWEEN_ROUND / NON_LIVE)
│   ├── frame_sampler.py             # Frame extraction, chunked memory management
│   ├── stream_a.py                  # Stream A: JPEG crop extraction + manifest generation
│   ├── stream_b.py                  # Stream B: OpenCV CV analysis → structured JSON per frame
│   ├── verifier.py                  # Cross-stream consistency checker + confidence scoring
│   └── storage.py                   # Storage backend abstraction (local / S3 / R2)
│
├── config/
│   └── games/
│       ├── valorant.json            # Minimap region spec, segment thresholds, accuracy tier
│       └── cs2.json                 # CS2 minimap config (stub)
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # Fixtures: test video, mock DB, mock tenet client
│   ├── test_ingest.py               # Local path validation, yt-dlp mock
│   ├── test_segment_detector.py     # Classification accuracy per tier
│   ├── test_frame_sampler.py        # Memory budget enforcement, chunked output
│   ├── test_stream_a.py             # JPEG output format, crop dimensions
│   ├── test_stream_b.py             # CV output schema, player dot detection
│   ├── test_verifier.py             # Cross-stream agreement scoring
│   ├── test_storage.py              # Local write, S3 mock
│   ├── test_tenet_client.py         # Payload format, retry logic
│   └── test_health.py              # /health, /ready endpoints
│
├── Dockerfile                       # Mirrors tenet-verification/Dockerfile template
├── requirements.txt
├── openapi.yaml                     # OpenAPI 3.1 spec (generated)
└── README.md
```

### Game Config Format (`config/games/valorant.json`)

```json
{
  "game": "valorant",
  "displayName": "VALORANT",
  "minimap": {
    "regionType": "percentage",
    "x": 0.01,
    "y": 0.78,
    "width": 0.17,
    "height": 0.20,
    "referenceResolution": [1920, 1080]
  },
  "segmentDetection": {
    "defaultTier": "STANDARD",
    "roundLive": {
      "minEntropyThreshold": 4.5,
      "minBrightnessVariance": 800
    },
    "betweenRound": {
      "maxEntropyThreshold": 3.5,
      "maxBrightnessVariance": 400
    },
    "templateMatchingEnabled": false,
    "templateAssets": "config/templates/valorant/"
  },
  "streamB": {
    "playerDotDetection": {
      "method": "color_range_hsv",
      "allyColor": [100, 180, 200],
      "enemyColor": [0, 180, 200],
      "tolerance": 30
    },
    "spikeDetection": {
      "enabled": true,
      "color": [50, 180, 200]
    }
  },
  "hubClassification": {
    "primary": "SATOR",
    "secondary": ["ROTAS", "OPERA"]
  }
}
```

---

## 5. Data Models

### PostgreSQL Tables (5 new tables — new Alembic migration)

#### `minimap_extraction_jobs`
Master job tracking table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Unique job identifier |
| `match_id` | VARCHAR(255) | Associated match ID (links to verification records) |
| `game` | VARCHAR(50) | Game identifier (valorant, cs2, …) |
| `map_name` | VARCHAR(100) | Map name if determinable (Haven, Bind, …) |
| `video_source` | TEXT | Original input (file path or URL) |
| `video_source_type` | VARCHAR(20) | `local_file` or `url` |
| `status` | ENUM | `PENDING`, `DOWNLOADING`, `EXTRACTING`, `VERIFYING`, `COMPLETE`, `FAILED`, `CANCELLED` |
| `accuracy_tier` | VARCHAR(20) | `HIGH`, `MEDIUM`, `STANDARD` |
| `hub_tags` | JSONB | Array of QuarterKey values: `["SATOR", "ROTAS"]` |
| `stream_a_frame_count` | INTEGER | Frames extracted by Stream A |
| `stream_b_frame_count` | INTEGER | Frames analyzed by Stream B |
| `segment_timeline` | JSONB | Array of `{start_sec, end_sec, type, frame_count}` |
| `extraction_duration_s` | FLOAT | Wall-clock seconds for extraction |
| `error_message` | TEXT | Failure reason if status=FAILED |
| `tenet_verification_id` | VARCHAR(255) | ID from tenet-verification service response |
| `tenet_confidence` | FLOAT | Confidence score returned by tenet-verification |
| `tenet_distribution_path` | VARCHAR(50) | PATH_A_LIVE / PATH_B_LEGACY / BOTH |
| `liquidpedia_validated` | BOOLEAN | Whether Liquidpedia cross-check passed |
| `created_at` | TIMESTAMP | Job creation time |
| `updated_at` | TIMESTAMP | Last status update |
| `completed_at` | TIMESTAMP | Completion or failure time |

#### `minimap_frames_stream_a`
Metadata for each extracted JPEG frame (images stored in storage backend, not DB).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Frame record ID |
| `job_id` | UUID FK | → minimap_extraction_jobs |
| `frame_index` | INTEGER | Sequential frame number in job |
| `timestamp_sec` | FLOAT | Position in source video (seconds) |
| `segment_type` | VARCHAR(30) | `ROUND_LIVE`, `BETWEEN_ROUND`, `NON_LIVE` |
| `segment_confidence` | FLOAT | Classification confidence (0.0–1.0) |
| `storage_key` | TEXT | Path or S3 key to the JPEG file |
| `storage_backend` | VARCHAR(20) | `local`, `s3`, `r2` |
| `file_size_bytes` | INTEGER | Compressed JPEG size |
| `width_px` | INTEGER | Crop width in pixels |
| `height_px` | INTEGER | Crop height in pixels |
| `entropy` | FLOAT | Pixel entropy (used by segment detector) |
| `brightness_variance` | FLOAT | Brightness variance (used by segment detector) |
| `created_at` | TIMESTAMP | |

#### `minimap_frames_stream_b`
Structured CV analysis results per frame (paired with Stream A records).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `job_id` | UUID FK | → minimap_extraction_jobs |
| `stream_a_frame_id` | UUID FK | → minimap_frames_stream_a (1:1 pairing) |
| `frame_index` | INTEGER | Must match stream_a frame_index |
| `timestamp_sec` | FLOAT | Must match stream_a timestamp_sec |
| `player_dots` | JSONB | Array of `{team: ally|enemy, x_pct, y_pct, confidence}` |
| `player_count_ally` | INTEGER | Detected allied players visible on map |
| `player_count_enemy` | INTEGER | Detected enemy players visible on map |
| `spike_detected` | BOOLEAN | Whether spike icon detected |
| `spike_position` | JSONB | `{x_pct, y_pct}` or null |
| `analysis_confidence` | FLOAT | CV detection confidence (0.0–1.0) |
| `analysis_method` | VARCHAR(50) | `color_range_hsv`, `template_match`, etc. |
| `raw_detection_data` | JSONB | Full OpenCV output for enrichment/audit |
| `hub_relevance` | JSONB | `{SATOR: float, AREPO: float, OPERA: float, ROTAS: float}` |
| `created_at` | TIMESTAMP | |

#### `minimap_verification_results`
Cross-stream verification outputs (the verifier's conclusions).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `job_id` | UUID FK | → minimap_extraction_jobs (1:1 per job) |
| `overall_confidence` | FLOAT | Cross-stream agreement score (0.0–1.0) |
| `stream_agreement_pct` | FLOAT | % of frames where A and B are consistent |
| `flagged_frame_count` | INTEGER | Frames where streams contradict each other |
| `flagged_frame_ids` | JSONB | Array of stream_a_frame_ids with contradictions |
| `segment_consistency` | JSONB | Per-segment type accuracy assessment |
| `recommendation` | VARCHAR(50) | `ACCEPT`, `FLAG_FOR_REVIEW`, `REJECT` |
| `recommendation_reason` | TEXT | Human-readable reason |
| `tenet_payload_preview` | JSONB | Snapshot of the payload sent to tenet-verification |
| `created_at` | TIMESTAMP | |

#### `minimap_reference_templates`
Template images used for high-accuracy segment classification.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `game` | VARCHAR(50) | |
| `template_type` | VARCHAR(50) | `ROUND_LIVE`, `BUY_PHASE`, `HALFTIME`, `NON_LIVE` |
| `description` | TEXT | E.g., "Valorant Halftime screen v2024" |
| `storage_key` | TEXT | Path to template PNG file |
| `accuracy_tier_required` | VARCHAR(20) | `HIGH` = only used for high-tier jobs |
| `match_threshold` | FLOAT | OpenCV matchTemplate confidence floor (default 0.8) |
| `game_version` | VARCHAR(50) | Game patch version this template applies to |
| `active` | BOOLEAN | Whether this template is in use |
| `created_at` | TIMESTAMP | |

---

## 6. API Interface

All endpoints follow `TenetBaseModel` (camelCase aliases, same as all other services).

### Ingest

**`POST /v1/ingest`** — Submit a new extraction job

```json
Request:
{
  "matchId": "match_vnct_2026_001",
  "game": "valorant",
  "mapName": "Haven",
  "videoSource": "/data/videos/game1.mp4",
  "videoSourceType": "local_file",
  "accuracyTier": "HIGH",
  "options": {
    "samplingFps": 1,
    "streamBEnabled": true,
    "maxFrameBufferSize": 30,
    "liquidpediaValidate": true
  }
}

OR with URL:
{
  "matchId": "match_vnct_2026_001",
  "game": "valorant",
  "videoSource": "https://www.youtube.com/watch?v=xxxx",
  "videoSourceType": "url"
}
```

```json
Response 202 Accepted:
{
  "jobId": "uuid-v4",
  "status": "PENDING",
  "matchId": "match_vnct_2026_001",
  "estimatedDurationS": 180,
  "createdAt": "2026-03-27T10:00:00Z"
}
```

---

**`GET /v1/jobs/{job_id}`** — Job status + summary

```json
Response 200:
{
  "jobId": "uuid-v4",
  "status": "COMPLETE",
  "matchId": "match_vnct_2026_001",
  "game": "valorant",
  "mapName": "Haven",
  "accuracyTier": "HIGH",
  "hubTags": ["SATOR", "ROTAS", "OPERA"],
  "streamAFrameCount": 3420,
  "streamBFrameCount": 3420,
  "extractionDurationS": 142.3,
  "segmentTimeline": [
    { "startSec": 0, "endSec": 38, "type": "NON_LIVE", "frameCount": 38 },
    { "startSec": 38, "endSec": 152, "type": "ROUND_LIVE", "frameCount": 114 },
    { "startSec": 152, "endSec": 182, "type": "BETWEEN_ROUND", "frameCount": 30 }
  ],
  "tenetConfidence": 0.82,
  "tenetDistributionPath": "PATH_B_LEGACY",
  "liquidpediaValidated": true,
  "createdAt": "2026-03-27T10:00:00Z",
  "completedAt": "2026-03-27T10:02:22Z"
}
```

---

**`GET /v1/jobs/{job_id}/stream-a`** — Stream A image manifest

```json
Response 200:
{
  "jobId": "uuid-v4",
  "totalFrames": 3420,
  "storageBackend": "local",
  "frames": [
    {
      "frameIndex": 0,
      "timestampSec": 0.0,
      "segmentType": "NON_LIVE",
      "segmentConfidence": 0.94,
      "storageKey": "/data/frames/match_001/ROUND_LIVE/000001.jpg",
      "fileSizeBytes": 12440,
      "widthPx": 320,
      "heightPx": 320,
      "entropy": 6.2,
      "brightnessVariance": 1200.5
    }
  ],
  "cursor": "next-page-token"
}
```

---

**`GET /v1/jobs/{job_id}/stream-b`** — Stream B structured data

```json
Response 200:
{
  "jobId": "uuid-v4",
  "totalFrames": 3420,
  "frames": [
    {
      "frameIndex": 0,
      "timestampSec": 0.0,
      "streamAFrameId": "uuid",
      "playerDots": [
        { "team": "ally", "xPct": 0.42, "yPct": 0.61, "confidence": 0.87 },
        { "team": "enemy", "xPct": 0.78, "yPct": 0.23, "confidence": 0.72 }
      ],
      "playerCountAlly": 5,
      "playerCountEnemy": 3,
      "spikeDetected": false,
      "spikePosition": null,
      "analysisConfidence": 0.84,
      "analysisMethod": "color_range_hsv",
      "hubRelevance": {
        "SATOR": 0.92,
        "AREPO": 0.40,
        "OPERA": 0.75,
        "ROTAS": 0.88
      }
    }
  ],
  "cursor": "next-page-token"
}
```

---

**`GET /v1/jobs/{job_id}/verify`** — Cross-stream verification result

```json
Response 200:
{
  "jobId": "uuid-v4",
  "overallConfidence": 0.81,
  "streamAgreementPct": 93.4,
  "flaggedFrameCount": 8,
  "recommendation": "FLAG_FOR_REVIEW",
  "recommendationReason": "8 frames show segment type disagreement between streams at round boundary timestamps",
  "segmentConsistency": {
    "ROUND_LIVE": { "agreementPct": 97.1, "frameCount": 2800 },
    "BETWEEN_ROUND": { "agreementPct": 88.2, "frameCount": 510 },
    "NON_LIVE": { "agreementPct": 91.0, "frameCount": 110 }
  },
  "tenetPayloadPreview": {
    "entityId": "match_vnct_2026_001",
    "entityType": "match",
    "sourceType": "minimap_analysis",
    "confidence": 0.81
  },
  "createdAt": "2026-03-27T10:02:20Z"
}
```

---

**`GET /v1/jobs`** — List jobs (filterable)

```
?game=valorant
?matchId=match_001
?status=COMPLETE
?limit=50&cursor=token
```

**`DELETE /v1/jobs/{job_id}`** — Cancel (if running) or delete job record

**`GET /v1/config/games`** — List supported game configs

**`GET /health`** / **`GET /ready`** — Health and readiness probes (mirrors other services)

---

## 7. Sub-Tool Modules

### `tools/ingest.py` — Video Ingest

**Responsibility:** Validate or download the video source.

```python
class VideoIngestor:
    async def from_local_path(path: str) -> VideoMeta
    async def from_url(url: str, download_dir: str) -> VideoMeta  # uses yt-dlp subprocess
    async def validate_video(path: str) -> VideoMeta             # ffprobe for duration, fps, resolution
```

`VideoMeta` contains: `path`, `duration_sec`, `fps`, `width`, `height`, `codec`, `source_type`.

yt-dlp invoked via `asyncio.create_subprocess_exec` — no shell=True. Format selection: `bestvideo[height<=1080]+bestaudio/best[height<=1080]` — avoids unnecessarily large downloads.

---

### `tools/segment_detector.py` — Content Classification

**Responsibility:** Classify each sampled frame into ROUND_LIVE / BETWEEN_ROUND / NON_LIVE.

Two strategies, selected per job's `accuracy_tier`:

#### Strategy 1: Heuristics (STANDARD / MEDIUM tiers)
- Compute **pixel entropy** of the minimap crop (high entropy → active gameplay)
- Compute **brightness variance** (low variance → static buy-phase screen)
- Compare against thresholds from game config JSON
- Output: `segment_type`, `confidence` (scaled from threshold distance)

#### Strategy 2: Template Matching (HIGH tier only)
- Load reference template PNGs from `config/templates/{game}/`
- Run `cv2.matchTemplate` against each frame crop
- Match above `match_threshold` → classify as that template's type
- Fall back to heuristics if no template matches

**Tiered Accuracy Targets:**

| Tier | Method | Target Accuracy | Use Case |
|------|--------|-----------------|----------|
| `HIGH` | Template match + heuristics | ~95% | Historic, important matches |
| `MEDIUM` | Heuristics + frame differencing | ~85–90% | Recent games (≤3 months) |
| `STANDARD` | Heuristics only | ~80% | General legacy processing |

**Refinement cycle:** After processing, flagged boundary frames are stored in `flagged_frames` for manual review. Reviewed frames can be promoted to reference templates (`POST /v1/config/games/{game}/templates`), improving HIGH-tier accuracy over time.

---

### `tools/frame_sampler.py` — Frame Extraction

**Responsibility:** Extract frames from video at configurable rate, chunked to stay within memory budget.

```python
class FrameSampler:
    def __init__(self, video_path: str, fps: float, buffer_size: int, game_config: GameConfig)
    async def sample_frames(self) -> AsyncIterator[FrameBatch]
    # FrameBatch = list of up to buffer_size frames, released after yield
```

- Opens video with `cv2.VideoCapture` in context manager
- Crops minimap region per game config (percentage → pixel coords)
- Yields `FrameBatch` objects; caller processes and flushes before next batch
- Logs memory usage at start, 25%, 50%, 75%, end via `psutil`

---

### `tools/stream_a.py` — Image Crop Extraction

**Responsibility:** Encode minimap crops as JPEG and write to storage.

```python
class StreamAExtractor:
    async def process_batch(batch: FrameBatch, job_id: str) -> List[StreamAFrame]
```

- `cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, quality])` — configurable quality (default 70%)
- Writes to storage backend via `tools/storage.py`
- Returns `StreamAFrame` records for DB persistence

---

### `tools/stream_b.py` — Structured CV Analysis

**Responsibility:** Analyze minimap crops to extract structured player/game state data.

```python
class StreamBAnalyzer:
    async def analyze_batch(batch: FrameBatch, stream_a_frames: List[StreamAFrame], game_config: GameConfig) -> List[StreamBFrame]
```

**Phase 1–2 implementation (OpenCV only):**

1. **Player dot detection:** HSV color range filtering (`cv2.inRange`) for ally/enemy team colors per game config. Detect blobs via `cv2.findContours`. Map contour centroids to minimap percentage coordinates.

2. **Spike detection:** Separate HSV range for spike icon color. Report presence and position.

3. **Confidence scoring:** Based on number of detected blobs, their size/shape regularity, and overlap with expected minimap boundaries.

**`hub_relevance` scoring:**
- `SATOR` (Analytics): High when player positions + alive counts are detected reliably
- `ROTAS` (Stats): High for all ROUND_LIVE frames (round state data)
- `OPERA` (Pro Scene): High for frames from professional tournament match context
- `AREPO` (Community): Low by default; elevated for highlight-detected frames (future)

---

### `tools/verifier.py` — Cross-Stream Verifier

**Responsibility:** Compare Stream A and Stream B frame-by-frame; produce a confidence score and recommendation.

```python
class CrossStreamVerifier:
    async def verify_job(job_id: str, stream_a: List[StreamAFrame], stream_b: List[StreamBFrame]) -> VerificationResult
```

**Verification checks:**
1. **Frame count parity:** Stream A and B must have equal frame counts; mismatch → REJECT
2. **Timestamp alignment:** `timestamp_sec` delta must be < 0.1s for paired frames; outliers flagged
3. **Segment consistency:** If Stream A classifies frame as NON_LIVE but Stream B detects 5 player dots → flag as contradiction
4. **Player count plausibility:** Valorant = max 5 ally + 5 enemy; any frame exceeding this flagged
5. **Temporal consistency:** Player count should not jump by > 2 between consecutive frames (unless boundary crossing); spike transitions should follow game logic

**Confidence formula (mirrors tenet-verification algorithm):**
```
base = (stream_a_confidence + stream_b_confidence) / 2
agreement_bonus = 0.15 × (agreed_frames / total_frames)
conflict_penalty = 0.10 × (flagged_frames / total_frames)
final = min(1.0, base + agreement_bonus - conflict_penalty)
```

**Recommendation routing:**
- ≥ 0.85 → `ACCEPT` → submit to tenet-verification
- 0.70–0.84 → `FLAG_FOR_REVIEW` → submit to tenet-verification + queue for manual review
- < 0.70 → `REJECT` → do not submit to tenet-verification

---

### `tools/storage.py` — Storage Backend

**Responsibility:** Abstract file write/read over local filesystem or S3-compatible object storage.

```python
class StorageBackend(ABC):
    async def write(key: str, data: bytes) -> str  # returns storage key
    async def read(key: str) -> bytes
    async def exists(key: str) -> bool
    async def delete(key: str) -> bool

class LocalStorageBackend(StorageBackend): ...
class S3StorageBackend(StorageBackend): ...   # boto3 / aiobotocore
class R2StorageBackend(S3StorageBackend): ...  # Cloudflare R2 (S3-compatible)
```

Selected via `STORAGE_BACKEND=local|s3|r2` environment variable.

---

## 8. HUB Classification System

Every extraction job and each frame produces `hub_tags` — an array of `QuarterKey` values indicating which hubs the data is relevant to. This mirrors the `QuarterKey` type in `data/schemas/GameNodeID.ts`.

**Job-level hub tags** (set from game config `hubClassification`):
- Valorant default: `["SATOR", "ROTAS", "OPERA"]`

**Frame-level hub relevance** (float 0.0–1.0 per hub, from Stream B):
- `SATOR`: Weighted by player position detection confidence + alive count accuracy
- `ROTAS`: Weighted by ROUND_LIVE frame count / total frames (raw stats value)
- `OPERA`: Weighted by tournament tier (fed from Liquidpedia metadata)
- `AREPO`: Reserved for future highlight detection layer (default: 0.0)

The TeneT verification payload includes the dominant hub tags so downstream consumers know which hubs can consume the data.

---

## 9. Segment Classification — Tiered Accuracy

### Accuracy Tier Assignment Logic

Tier is determined from Liquidpedia metadata (if validated) or from the `accuracyTier` field in the ingest request:

| Signal | Assigned Tier |
|--------|--------------|
| Historic tournament (VCT Champions, Worlds) | `HIGH` |
| Tier 1 league match < 3 months old | `MEDIUM` |
| Tier 1 league match > 3 months old | `MEDIUM` |
| Regional / qualifier / less significant | `STANDARD` |
| No Liquidpedia match found | `STANDARD` (with flag) |

### Refinement Cycle

```
Initial extraction (any tier)
        ↓
Verifier flags boundary-disagreement frames
        ↓
Manual review via /v1/review-queue
        ↓
Accepted frame → promote to reference template (HIGH tier)
        ↓
Next job on same game uses improved templates
```

This iterative cycle means HIGH-tier accuracy improves over time as more reference frames accumulate — consistent with the platform's "repeatable framework for video recovery" goal.

### Handling Missing Videos

When a video is not available (URL returns 404, yt-dlp fails, file not found):
- Job status set to `FAILED` with `error_message: "Video source unavailable: {reason}"`
- Job record persisted with `liquidpedia_validated` flag if metadata was fetched before failure
- Retry available via `POST /v1/jobs/{job_id}/retry` — re-attempts ingest with same config
- Flagged in review queue with `reason: "Video source unavailable — manual resolution required"`

---

## 10. Storage Backend

### Phase 1 (MVP): Local Filesystem

```
/data/minimap-extractor/
  {match_id}/
    {map_name}/
      stream_a/
        ROUND_LIVE/
          000001.jpg, 000002.jpg, …
        BETWEEN_ROUND/
          …
        NON_LIVE/
          …
      manifest.json          ← Stream A manifest
      stream_b.json          ← Stream B structured data (full)
      verification.json      ← Cross-stream verification result
```

Frame naming: `{frame_index:06d}.jpg` — zero-padded to 6 digits.

### Phase 3+: S3 / Cloudflare R2

Same key structure, using S3 bucket prefix instead of filesystem path:

```
s3://njz-minimap/{match_id}/{map_name}/stream_a/ROUND_LIVE/000001.jpg
```

Configured via environment variable; no code change required (storage abstraction).

---

## 11. GitHub Storage Investigation

**Verdict: Not viable for video files. Viable for reference templates and manifests.**

| Asset Type | Size | GitHub Viable? | Recommendation |
|-----------|------|---------------|----------------|
| Full game video (1080p VOD) | 2–8 GB | ❌ Exceeds 100MB file limit, 1GB repo soft limit | Local disk or R2 |
| Extracted JPEG frames (per job) | 50–200 MB | ⚠️ Marginal with Git LFS; costs accumulate | Local/R2 preferred |
| Reference template PNGs | < 5 MB total | ✅ Yes — commit directly to `config/templates/` | Committed to repo |
| Manifest JSON files | < 1 MB | ✅ Yes — small structured data | Commit or R2 |
| Stream B structured JSON | 5–20 MB | ⚠️ Acceptable for small match sets | R2 for production |

**Recommendation:** Store reference template images (used for HIGH-tier classification) directly in `config/templates/{game}/` within the repo — they are small PNGs, version-controlled, and shared across deployments. All extracted frame files go to local disk (dev) or R2 (production). Raw video files are never stored in the repo.

---

## 12. TeneT Integration

After the cross-stream verifier produces a result, the service submits to `services/tenet-verification/`:

```python
# tenet_client.py
class TenetVerificationClient:
    async def submit_minimap_analysis(job: ExtractionJob, verification: VerificationResult) -> TenetResponse
```

**Payload structure** (matches existing VerificationRequest schema exactly):

```json
{
  "entityId": "match_vnct_2026_001",
  "entityType": "match",
  "game": "valorant",
  "sources": [
    {
      "sourceType": "minimap_analysis",
      "trustLevel": "MEDIUM",
      "weight": 0.8,
      "capturedAt": "2026-03-27T10:00:00Z",
      "data": {
        "jobId": "uuid",
        "mapName": "Haven",
        "accuracyTier": "HIGH",
        "streamAFrameCount": 3420,
        "streamBFrameCount": 3420,
        "segmentBreakdown": {
          "ROUND_LIVE": 2800,
          "BETWEEN_ROUND": 510,
          "NON_LIVE": 110
        },
        "crossStreamAgreementPct": 93.4,
        "hubTags": ["SATOR", "ROTAS", "OPERA"],
        "liquidpediaValidated": true
      }
    }
  ]
}
```

**Retry policy:** 3 retries, exponential backoff (mirrors `retry_with_backoff()` from legacy-compiler).

---

## 13. Liquidpedia Metadata Validation

`liquidpedia_client.py` calls the Legacy Compiler's Liquidpedia scraper endpoint (or scrapes directly — to be decided in Planning):

```python
class LiquidpediaClient:
    async def lookup_match(match_id: str, game: str) -> Optional[LiquidpediaMatch]
    async def get_accuracy_tier(match: LiquidpediaMatch) -> AccuracyTier
```

`LiquidpediaMatch` contains: `tournament_name`, `tier`, `date`, `team_a`, `team_b`, `map_name`, `url`.

**Usage in the pipeline:**
1. Before extraction begins: fetch match metadata → set `accuracy_tier`
2. If no match found: proceed with `STANDARD` tier + flag `liquidpedia_validated=false`
3. Map name from Liquidpedia → override `map_name` in job record if video source doesn't include it

---

## 14. Delivery Phases

### Phase 1 — MVP Core (2–3 sessions)

**Goal:** Working extraction pipeline for local video files, Stream A only.

- [ ] `services/minimap-extractor/` directory, `main.py`, `Dockerfile`, `requirements.txt`
- [ ] `tools/ingest.py` — local file validation (no yt-dlp yet)
- [ ] `tools/segment_detector.py` — STANDARD tier heuristics (entropy + brightness variance)
- [ ] `tools/frame_sampler.py` — chunked frame extraction, memory logging
- [ ] `tools/stream_a.py` — JPEG crop extraction + local filesystem write
- [ ] `tools/storage.py` — `LocalStorageBackend` only
- [ ] `models.py` + `database.py` — `minimap_extraction_jobs` + `minimap_frames_stream_a` tables
- [ ] Alembic migration: `006_minimap_extractor.py`
- [ ] API: `POST /v1/ingest`, `GET /v1/jobs/{id}`, `GET /v1/jobs/{id}/stream-a`, `GET /v1/jobs`, `GET /health`, `GET /ready`
- [ ] `config/games/valorant.json` — initial minimap region spec
- [ ] Tests: ingest, segment_detector, frame_sampler, stream_a, health (target: 80% coverage)

**Gate:** `POST /v1/ingest` with a local Valorant VOD produces valid JPEG crops, manifest, and job record in DB.

---

### Phase 2 — Stream B + Verifier (2 sessions)

**Goal:** Dual-stream output + cross-stream verification.

- [ ] `tools/stream_b.py` — HSV player dot detection + spike detection
- [ ] `tools/verifier.py` — Cross-stream consistency checks + confidence scoring
- [ ] `models.py` + migration — `minimap_frames_stream_b` + `minimap_verification_results`
- [ ] API: `GET /v1/jobs/{id}/stream-b`, `GET /v1/jobs/{id}/verify`
- [ ] `hub_relevance` scoring in Stream B
- [ ] Tests: stream_b, verifier (target: 85% coverage of CV logic)

**Gate:** A completed job exposes all 3 data endpoints (stream-a, stream-b, verify) with valid schemas.

---

### Phase 3 — TeneT + S3 + Liquidpedia (2 sessions)

**Goal:** Full pipeline integration.

- [ ] `tenet_client.py` — Submit to `services/tenet-verification/` with retry
- [ ] `liquidpedia_client.py` — Accuracy tier assignment from tournament metadata
- [ ] `tools/storage.py` — `S3StorageBackend` + `R2StorageBackend`
- [ ] MEDIUM-tier segment detection (frame differencing added to heuristics)
- [ ] `minimap_reference_templates` table + migration
- [ ] `config/games/cs2.json` — CS2 stub config
- [ ] Review queue endpoint: `GET /v1/review-queue`, `POST /v1/review/{job_id}`
- [ ] Tests: tenet_client (mock), storage S3 mock, liquidpedia_client (mock)

**Gate:** End-to-end: local VOD → extraction → verification → tenet-verification confidence score returned and logged.

---

### Phase 4 — URL Download + HIGH Tier + Refinement (2 sessions)

**Goal:** yt-dlp download, HIGH-tier template matching, iterative refinement.

- [ ] `tools/ingest.py` — yt-dlp subprocess integration for YouTube/Twitch URLs
- [ ] HIGH-tier template matching in `segment_detector.py` (`cv2.matchTemplate`)
- [ ] Template management: `POST /v1/config/games/{game}/templates` (admin, upload reference PNG)
- [ ] Refinement cycle: flagged frames → manual review → template promotion
- [ ] `POST /v1/jobs/{id}/retry` endpoint
- [ ] Prometheus `/metrics` endpoint
- [ ] Load/memory profiling: verify < 512 MB peak on 1-hour 1080p video

**Gate:** URL ingest works. HIGH-tier job on a known Valorant VOD achieves ≥ 90% segment classification agreement with manual spot-check.

---

## 15. Verification Approach

### Lint + Type Check

```bash
cd services/minimap-extractor

# Python type checking
mypy main.py tools/ --ignore-missing-imports

# Ruff linting
ruff check . --fix

# Black formatting
black . --line-length 100
```

### Unit Tests

```bash
# All tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=. --cov-report=html

# Specific modules
pytest tests/test_segment_detector.py -v
pytest tests/test_verifier.py -v
```

### Integration Test

```bash
# Requires: PostgreSQL running, test video file at /tmp/test_game.mp4
pytest tests/integration/ -v

# Health check
curl http://localhost:8004/health
curl http://localhost:8004/ready
```

### Manual Smoke Test

```bash
# Submit test job with bundled 30-second test clip
curl -X POST http://localhost:8004/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"matchId": "test_001", "game": "valorant", "videoSource": "/tmp/test_game.mp4", "videoSourceType": "local_file"}'

# Poll for completion
curl http://localhost:8004/v1/jobs/{job_id}

# Inspect stream outputs
curl http://localhost:8004/v1/jobs/{job_id}/stream-a | python -m json.tool
curl http://localhost:8004/v1/jobs/{job_id}/stream-b | python -m json.tool
curl http://localhost:8004/v1/jobs/{job_id}/verify   | python -m json.tool
```

---

## 16. Dependencies

### Python (`requirements.txt`)

```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
pydantic>=2.7.0
pydantic-settings>=2.2.1
sqlalchemy[asyncio]>=2.0.29
asyncpg>=0.29.0
alembic>=1.13.1
httpx>=0.27.0          # tenet client, liquidpedia client
opencv-python-headless>=4.9.0  # headless (no GUI), smaller image
numpy>=1.26.4           # required by OpenCV
psutil>=5.9.0           # memory monitoring
redis[asyncio]>=5.0.4   # job state + dedup cache
aiobotocore>=2.13.0     # S3/R2 async client (Phase 3)
yt-dlp>=2024.3.10       # URL download (Phase 4)
beautifulsoup4>=4.12.3  # Liquidpedia scraping
```

Note: `opencv-python-headless` is used instead of `opencv-python` — no GUI dependencies, smaller Docker image, compatible with server environments.

---

## 17. Environment Variables

| Variable | Default | Required | Purpose |
|----------|---------|----------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | ✅ | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379` | ✅ | Redis cache + job dedup |
| `TENET_VERIFICATION_URL` | `http://localhost:8001` | ✅ | TeneT verification service |
| `LEGACY_COMPILER_URL` | `http://localhost:8003` | — | Liquidpedia client endpoint |
| `STORAGE_BACKEND` | `local` | — | `local`, `s3`, `r2` |
| `STORAGE_LOCAL_BASE_PATH` | `/data/minimap-extractor` | — | Local storage root |
| `STORAGE_S3_BUCKET` | — | Phase 3 | S3/R2 bucket name |
| `STORAGE_S3_ENDPOINT_URL` | — | Phase 3 | R2 endpoint (Cloudflare) |
| `AWS_ACCESS_KEY_ID` | — | Phase 3 | S3/R2 credentials |
| `AWS_SECRET_ACCESS_KEY` | — | Phase 3 | S3/R2 credentials |
| `DEFAULT_SAMPLING_FPS` | `1` | — | Frames per second to sample |
| `DEFAULT_JPEG_QUALITY` | `70` | — | JPEG compression quality (0–100) |
| `DEFAULT_FRAME_BUFFER_SIZE` | `30` | — | Max frames in RAM at once |
| `CONFIDENCE_THRESHOLD_ACCEPT` | `0.85` | — | Cross-stream → ACCEPT |
| `CONFIDENCE_THRESHOLD_FLAG` | `0.70` | — | Cross-stream → FLAG_FOR_REVIEW |
| `LOG_LEVEL` | `INFO` | — | Logging verbosity |
| `APP_VERSION` | `0.1.0` | — | Service version |

---

*End of Technical Specification — pending user confirmation before Planning step.*
