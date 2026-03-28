# Minimap Extraction Service

## Overview

The Minimap Extraction Service extracts frames from Valorant VODs using FFmpeg and OpenCV, classifies them by segment type, and manages extraction jobs.

## Components

### MF-2: FFmpeg + OpenCV Extraction Pipeline

**Files:**
- `models.py` - Data models (FrameExtract, VODMetadata, ExtractionProgress)
- `pipeline.py` - ExtractionPipeline class

**Key Classes:**
- `ExtractionPipeline` - Main extraction pipeline
  - `extract_metadata()` - Get VOD metadata via ffprobe
  - `extract_frames(fps=1)` - Extract frames at specified FPS
  - `detect_minimap_region()` - Detect minimap region (Phase 1: fixed bbox)
  - `cleanup()` - Remove temporary files

### MF-3: Segment Type Classification Logic

**Files:**
- `segment_classifier.py` - SegmentClassifier class

**Key Classes:**
- `SegmentClassifier` - Classify frames by segment type
  - `classify_frame()` - Async classification
  - `classify_frame_sync()` - Synchronous classification
  - `classify_batch()` - Batch classification
  - `get_segment_stats()` - Get segment distribution stats

**Segment Types:**
- `IN_ROUND` - Gameplay segment
- `BUY_PHASE` - First 15 seconds of each round
- `HALFTIME` - Middle of match (with 30s buffer)
- `BETWEEN_ROUND` - Brief transition between rounds
- `UNKNOWN` - Unclassifiable frame

### MF-4: FastAPI Extraction Endpoints

**Files:**
- `service.py` - ExtractionService class
- `routers/extraction.py` - FastAPI router

**Key Classes:**
- `ExtractionService` - Job lifecycle management
  - `create_job()` - Create and queue extraction job
  - `process_job()` - Background job processing
  - `get_job()` - Get job by ID
  - `list_jobs()` - List jobs with filters
  - `cancel_job()` - Cancel pending/running job

**API Endpoints:**
- `POST /v1/extraction/jobs` - Start extraction job
- `GET /v1/extraction/jobs/{job_id}` - Get job status
- `GET /v1/extraction/jobs` - List jobs (with pagination)
- `DELETE /v1/extraction/jobs/{job_id}` - Cancel job
- `GET /v1/extraction/health` - Service health check

## Integration

### Archival System

The service integrates with the Archival API for frame storage:
- Uses `ArchivalService` if available
- Falls back to mock implementation for Phase 1
- Handles deduplication via content hashing

### Database Models

Uses existing models from `extraction_job.py`:
- `ExtractionJob` - Job tracking
- `ArchiveManifest` - Deduplication manifest
- `ArchiveFrame` - Individual frame records

## Usage

```python
from src.sator.extraction import ExtractionPipeline, ExtractionService

# Create pipeline
pipeline = ExtractionPipeline(
    vod_path="/path/to/vod.mp4",
    output_dir="/tmp/output",
)

# Extract metadata
metadata = await pipeline.extract_metadata()

# Extract frames
frames = await pipeline.extract_frames(fps=1)

# Classify segments
from src.sator.extraction import SegmentClassifier
classifier = SegmentClassifier(vod_duration_ms=metadata.duration_ms)
for frame in frames:
    segment = await classifier.classify_frame(frame.file_path, frame.timestamp_ms)
```

## API Usage

```bash
# Start extraction job
curl -X POST http://api/v1/extraction/jobs \
  -H "Content-Type: application/json" \
  -d '{"match_id": "uuid", "vod_source": "local", "vod_path": "/path/to/vod.mp4"}'

# Get job status
curl http://api/v1/extraction/jobs/{job_id}

# List jobs
curl "http://api/v1/extraction/jobs?status=completed&limit=20"

# Cancel job
curl -X DELETE http://api/v1/extraction/jobs/{job_id}
```

## Testing

```bash
# Run tests
cd packages/shared/api
pytest tests/unit/extraction/ -v

# Syntax check
python -m py_compile src/sator/extraction/*.py
```

## Dependencies

- FFmpeg + ffprobe (system requirement)
- OpenCV (cv2)
- NumPy
- FastAPI
- SQLAlchemy (async)

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| `models.py` | 66 | Data models |
| `pipeline.py` | 308 | FFmpeg/OpenCV extraction |
| `segment_classifier.py` | 316 | Frame classification |
| `service.py` | 537 | Job lifecycle management |
| `routers/extraction.py` | 371 | FastAPI endpoints |
| `__init__.py` | 33 | Package exports |
| **Total** | **1631** | **Complete implementation** |

---

Tasks MF-2, MF-3, MF-4 - Implementation Complete
