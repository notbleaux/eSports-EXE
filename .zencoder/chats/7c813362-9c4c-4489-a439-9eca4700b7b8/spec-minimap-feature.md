[Ver001.000]

# Technical Specification — Minimap Extraction Service & Frontend

**Status:** Specification Phase (Step 2)  
**Framework:** 2/3/5+1,2,3 compliance (NJZPOF v0.2)  
**Feature:** Minimap Extraction Service + React Frontend Component  
**Dependency:** Archival System (CRITICAL BLOCKER on Tasks 7–9)  
**Output Location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/spec-minimap-feature.md`  
**Cross-Review Ready:** Yes (all 7 sections complete; Archival blocker documented)

---

## 1. Technical Context

### Backend: Extraction Service

- **Language & Runtime:** Python 3.11+, asyncio-based
- **Web Framework:** FastAPI for REST endpoints
- **Media Processing:** FFmpeg (system binary) + opencv-python (4.8+) for frame extraction and minimap detection
- **Database ORM:** SQLAlchemy 2.0 (async SQLAlchemy) with Alembic migrations
- **Async Client:** httpx (for Archival API calls)
- **Job Dispatch:** asyncio.Task with background execution via FastAPI Lifespan or Celery (optional Phase 2)
- **Configuration:** Environment variables (.env, python-dotenv)

**Reference Patterns:**
- SQLAlchemy models: `packages/shared/api/models/match.py`, `packages/shared/api/models/player.py`
- FastAPI routers: `packages/shared/api/routers/players.py`, `packages/shared/api/routers/matches.py`
- Pydantic schemas: `packages/shared/api/schemas/player.py`
- Async patterns: `packages/shared/api/services/` (httpx, asyncpg usage)

### Frontend: React Component

- **Framework:** React 18 with TypeScript 5.9+
- **Data Fetching:** TanStack Query v5 (@tanstack/react-query) for server state management, caching (5-min stale time, SWR pattern)
- **Styling:** Tailwind CSS for utility-based layout
- **UI Patterns:** Component composition following ROTAS/OPERA hub structure
- **State Management:** React hooks (useState for pagination), optional Zustand for global state
- **Visualization:** Image lightbox (optional: Framer Motion for zoom animations, deferred to Phase 2)

**Reference Patterns:**
- Hub components: `apps/web/src/hub-2-rotas/`, `apps/web/src/hub-4-opera/`
- TanStack Query hooks: `apps/web/src/hooks/useMatches.ts`, `apps/web/src/hooks/usePlayers.ts`
- Component style: Tailwind-based, responsive, mobile-first
- TypeScript interfaces: `apps/web/src/types/` (type aliases, discriminated unions)

### Integration Architecture

**Backend ↔ Frontend Communication:**
- REST endpoints: `POST /v1/extraction/jobs`, `GET /v1/extraction/jobs/{job_id}`
- Response format: JSON with ISO-8601 timestamps, UUID fields
- Error responses: StandardError format (code, message, details)

**Backend ↔ Archival API Communication:**
- Async httpx client for `POST /v1/archive/frames` (batch frame upload)
- Credential: Service principal authentication (Bearer token from JWT_SECRET_KEY or Archival API key)
- Payload: Frame metadata + JPEG binary data (multipart or JSON base64 encoding)

**Frontend ↔ Archival API Communication:**
- TanStack Query: `GET /v1/archive/matches/{match_id}/frames?page={page}&page_size=50`
- Public read endpoint (no auth required)
- Response: `{ frames: [...], total_count, page, page_size }`

---

## 2. Extraction Service Architecture

### Frame Extraction Pipeline

The extraction pipeline processes a Valorant VOD file through the following sequential stages:

#### Stage 1: FFmpeg Metadata Parsing

**Input:** Local VOD file path (e.g., `/data/vods/valorant_match_abc123.mp4`)

**Output:** Metadata dict containing:
- `duration_ms`: Total duration in milliseconds
- `fps`: Frames per second of the VOD
- `width`, `height`: Video resolution
- `frame_count`: Calculated total frames = `(duration_ms / 1000) * fps`

**Implementation:**
```python
# services/extraction_service.py (pseudo-code)
async def parse_vod_metadata(vod_path: str) -> VODMetadata:
    """Use ffprobe to extract duration, FPS, resolution."""
    result = await run_async_subprocess(['ffprobe', '-v', 'error', '-show_entries', 
                                         'format=duration', 'stream=r_frame_rate', ...])
    return VODMetadata(duration_ms=..., fps=..., width=..., height=...)
```

**Error Handling:** Return 503 Service Unavailable if FFmpeg unavailable; return 400 Bad Request if VOD file corrupted/invalid.

#### Stage 2: Minimap Region Detection

**Phase 1 MVP:** Fixed bounding box extraction (bottom-right 25% of frame)

**Algorithm:**
1. Extract one sample frame at t=0 using FFmpeg
2. Define bounding box: `bbox = (width * 0.75, height * 0.75, width, height)` (assuming minimap in bottom-right)
3. Validate minimap contains expected UI elements (optional: heuristic check for rounded corners, distinct color palette)

**Phase 3:** ML-based detection using pre-trained ONNX model (deferred).

**Output:** JPEG crop image (~100–200 KB per frame, depending on compression quality and minimap size)

#### Stage 3: Frame Extraction at 1 fps

**Input:** VOD file path, bounding box coordinates

**Output:** List of JPEG crops, one per second of VOD

**Implementation:**
```python
async def extract_frames_at_1fps(vod_path: str, bbox: Tuple[int, int, int, int], 
                                   output_dir: str) -> List[str]:
    """Use ffmpeg to extract frames at 1 fps, crop to minimap region."""
    # ffmpeg -i input.mp4 -vf "fps=1,crop=w:h:x:y" output_%04d.jpg
    # Returns list of output file paths
```

**Calculation:** For a 30-minute (1800 second) match at 1 fps = 1800 frames.

**Deduplication Note:** Frame extraction itself does not deduplicate; that happens in Stage 5.

#### Stage 4: Segment Type Classification

**Purpose:** Label each frame with the tactical context it represents.

**Segment Types:**
- `IN_ROUND`: Active round play (5v5 combat)
- `BUY_PHASE`: Economy phase (shopping screen visible)
- `HALFTIME`: Half changeover (centered UI, no gameplay)
- `BETWEEN_ROUND`: Post-round, before next buy (transition screen)
- `UNKNOWN`: Cannot classify with confidence

**Phase 1 MVP Heuristics:**
1. **Round Timer Detection:** OCR the round timer (top-center of minimap) if visible
2. **UI Overlay Detection:** Identify buy phase by presence of economy UI
3. **Fallback to UNKNOWN:** If confidence < 50%, classify as UNKNOWN

**Phase 3:** ML-based segment classification using trained model (deferred).

**Output:** Tuple of (segment_type, confidence_score) per frame.

```python
async def classify_segment_type(frame_crop: np.ndarray) -> SegmentType:
    """Heuristic: detect round timer, UI overlays, economy screen."""
    # Phase 1: Hardcoded rules based on pixel patterns
    # Phase 3: ML model inference
```

#### Stage 5: Deduplication

**Purpose:** Skip frames identical to the previous frame (reduces storage by ~10-20%).

**Algorithm:**
1. Compute SHA-256 hash of each JPEG crop
2. Compare to previous frame's hash
3. If identical, skip (do not add to upload batch)

**Output:** Filtered list of unique frames with their SHA-256 hashes.

```python
def deduplicate_frames(frame_paths: List[str]) -> List[Tuple[str, str]]:
    """Compute hashes, return only frames with new hashes."""
    unique_frames = []
    prev_hash = None
    for frame_path in frame_paths:
        frame_hash = sha256_file(frame_path)
        if frame_hash != prev_hash:
            unique_frames.append((frame_path, frame_hash))
            prev_hash = frame_hash
    return unique_frames
```

#### Stage 6: Batch Upload to Archival API

**Input:** List of unique frame JPEG crops + metadata (segment type, timestamp, content hash)

**Output:** Manifest ID from Archival System + list of stored frame IDs

**Implementation:**
```python
async def upload_to_archival(frames: List[FrameData], job_id: UUID) -> str:
    """POST /v1/archive/frames with batch of frames."""
    payload = {
        'frames': [
            {
                'content_hash': frame.sha256,
                'jpeg_bytes': frame.jpeg_binary,
                'metadata': {
                    'match_id': frame.match_id,
                    'extraction_job_id': job_id,
                    'frame_index': frame.index,
                    'segment_type': frame.segment_type,
                    'timestamp_ms': frame.timestamp_ms,
                    'accuracy_tier': 'STANDARD'
                }
            }
            for frame in frames
        ]
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post('http://api:8000/v1/archive/frames', json=payload)
        result = resp.json()
        return result['manifest_id']
```

**Error Handling:**
- 503 Archival unavailable: Retry with exponential backoff (max 3 retries)
- 413 Payload too large: Split batch into chunks of ≤500 frames
- Success: Update `extraction_jobs.manifest_id`, set status to 'completed'

### Job Tracking & Async Execution

**State Machine:**
```
pending → running → completed
              ↓
           failed
```

**Database State:**
- `extraction_jobs.status` tracks current state
- `extraction_jobs.frame_count` updated when completed
- `extraction_jobs.manifest_id` populated when Archival upload succeeds
- `extraction_jobs.error_message` populated when failed

**Async Dispatch:**
```python
# In routers/extraction.py
@router.post('/v1/extraction/jobs')
async def start_extraction(req: ExtractionJobRequest, bg_tasks: BackgroundTasks):
    """Create job record, dispatch async task."""
    job = ExtractionJob(
        job_id=uuid4(),
        match_id=req.match_id,
        status='pending',
        created_at=now()
    )
    db.add(job)
    db.commit()
    
    # Dispatch async task (will run independently)
    bg_tasks.add_task(run_extraction_pipeline, job_id=job.job_id)
    
    return ExtractionJobResponse(job_id=job.job_id, status='pending')

async def run_extraction_pipeline(job_id: UUID):
    """Background task: runs all 6 stages."""
    try:
        job = db.query(ExtractionJob).filter_by(job_id=job_id).first()
        job.status = 'running'
        db.commit()
        
        # Stage 1-6
        metadata = await parse_vod_metadata(job.vod_path)
        bbox = compute_minimap_bbox(metadata)
        frames = await extract_frames_at_1fps(job.vod_path, bbox, '/tmp/frames')
        # ... classify, deduplicate, upload
        
        job.status = 'completed'
        job.manifest_id = manifest_id
        job.frame_count = len(frames)
        job.completed_at = now()
        db.commit()
    except Exception as e:
        job.status = 'failed'
        job.error_message = str(e)
        db.commit()
        raise
```

---

## 3. Frontend Component: MinimapFrameGrid

### Component Architecture

**Hierarchy:**
```
<MinimapFrameGrid matchId={matchId} />
├─ <GridHeader />
│  ├─ <PaginationControls page={page} hasMore={hasMore} onNext={handleNext} />
│  └─ <FilterControls segment_type={filter} onChange={setFilter} />
├─ <FrameGrid>
│  ├─ <FrameThumbnail frame={frame1} />
│  ├─ <FrameThumbnail frame={frame2} />
│  └─ ... (50 per page)
└─ <LoadingSpinner isLoading={isLoading} />
```

**Styling:** Tailwind CSS grid layout (`grid-cols-4` or `grid-cols-5` responsive), max-width containers, padding/spacing from design system.

### Data Flow

```
User navigates to match details page
  ↓
MinimapFrameGrid(matchId="12345") component mounts
  ↓
useMinimapFrames(matchId, page=1) hook invoked
  ↓
TanStack Query: GET /v1/archive/matches/12345/frames?page=1&page_size=50
  ↓
Archival API returns:
  {
    "frames": [
      {
        "id": "frame-001",
        "storage_url": "s3://bucket/frames/frame-001.jpg",
        "segment_type": "IN_ROUND",
        "timestamp_ms": 5000,
        "is_pinned": true,
        "created_at": "2026-03-27T..."
      },
      ...
    ],
    "total_count": 1800,
    "page": 1,
    "page_size": 50,
    "has_more": true
  }
  ↓
React re-renders FrameGrid with 50 <FrameThumbnail /> components
  ↓
User clicks "Next Page"
  ↓
page state updated to 2, useMinimapFrames re-runs
  ↓
TanStack Query caches previous page (5-min stale time)
  ↓
User sees page 2 frames
```

### Pagination & Filtering

**Pagination:**
- Offset-based: `page` (1-indexed), `page_size` (default 50, max 100)
- TanStack Query cache key: `['minimap-frames', matchId, page]`
- Controls: "Previous" / "Next" buttons + "Page X of Y" indicator
- `hasMore` computed as: `page < ceil(total_count / page_size)`

**Filtering (optional Phase 2, minimal MVP):**
- Query param: `?segment_type=IN_ROUND` (filter by segment type)
- Filter options: Dropdown in header (IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN)
- Default: Show all segments

**Caching Strategy:**
- Stale time: 5 minutes (SWR pattern — serve stale data while revalidating)
- Cache invalidation: Manual via `queryClient.invalidateQueries(['minimap-frames', matchId])` (e.g., after job completes)
- Network timeout: 30 seconds

### UI Features

#### Frame Thumbnail Layout
```
┌─────────────────┐
│  [JPEG Image]   │  ← Image from storage_url
│                 │
├─────────────────┤
│ ⚡ IN_ROUND     │  ← Segment badge (red)
│ ✓ Verified      │  ← Verification badge (if pinned)
│ 00:05:23.456    │  ← Timestamp overlay
└─────────────────┘
```

**Segment Badges (color-coded):**
- `IN_ROUND`: Red/orange background
- `BUY_PHASE`: Green background
- `HALFTIME`: Gray background
- `BETWEEN_ROUND`: Yellow background
- `UNKNOWN`: Light gray

**Verification Badge:**
- If `is_pinned === true`: Green checkmark "✓ Verified" (pinned by TeneT)
- If `is_pinned === false`: Gray question mark "? Pending" (awaiting verification)

**Timestamp Overlay:**
- Format: `HH:MM:SS.mmm` (e.g., "00:05:23.456")
- Computed from `frame.timestamp_ms` as `floor(ms / 1000)` = seconds, then format
- Positioned bottom-left corner with semi-transparent dark background

**Lightbox/Zoom:**
- Click thumbnail → open fullscreen modal (Framer Motion optional, deferred Phase 2)
- Modal shows full JPEG, metadata, timestamp
- Keyboard navigation: Left/Right arrows to navigate frames within modal

### Integration with ROTAS/OPERA Hub

**Recommendation:** Integrate MinimapFrameGrid into **ROTAS Hub** (leaderboard context makes sense for historical match analysis)

**Route:** `/rotas/:matchId/minimap` or as a tab in `/rotas/:matchId/details`

**Alternative:** OPERA Hub (tournament context, post-match analysis) at `/opera/:matchId/minimap`

**Tab Integration Example (ROTAS):**
```
MatchDetailsPage
├─ Overview Tab
├─ Stats Tab
├─ Rosters Tab
└─ Minimap Frames Tab ← NEW
```

---

## 4. Data Model Integration

### Table: extraction_jobs

**Purpose:** Track extraction job metadata, status, and reference to Archival manifest.

**Definition (Alembic Migration 006):**

```python
# packages/shared/api/alembic/versions/006_extraction_jobs.py
import sqlalchemy as sa
from alembic import op

def upgrade():
    op.create_table(
        'extraction_jobs',
        sa.Column('job_id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('match_id', sa.UUID, sa.ForeignKey('matches.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('vod_source', sa.VARCHAR(20), nullable=False),  # 'local', 's3'
        sa.Column('vod_path', sa.TEXT, nullable=False),  # /path/to/vod.mp4 or s3://bucket/key
        sa.Column('status', sa.VARCHAR(20), nullable=False, default='pending'),  # pending, running, completed, failed
        sa.Column('frame_count', sa.Integer, nullable=True),  # populated when completed
        sa.Column('manifest_id', sa.UUID, nullable=True, index=True),  # FK to Archival manifest (not enforced; reference only)
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('error_message', sa.TEXT, nullable=True),
        sa.Index('idx_extraction_jobs_match_id', 'match_id'),
        sa.Index('idx_extraction_jobs_status', 'status'),
        sa.Index('idx_extraction_jobs_created', 'created_at', postgresql_ops={'created_at': 'DESC'}),
    )

def downgrade():
    op.drop_table('extraction_jobs')
```

**SQLAlchemy Model:**

```python
# packages/shared/api/models/extraction_job.py
from sqlalchemy import Column, UUID, String, DateTime, Integer, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

class ExtractionJob(Base):
    __tablename__ = 'extraction_jobs'
    
    job_id = Column(UUID, primary_key=True, default=uuid4)
    match_id = Column(UUID, ForeignKey('matches.id', ondelete='CASCADE'), nullable=False, index=True)
    vod_source = Column(String(20), nullable=False)  # 'local', 's3'
    vod_path = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default='pending')
    frame_count = Column(Integer, nullable=True)
    manifest_id = Column(UUID, nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationship
    match = relationship('Match', back_populates='extraction_jobs')
    
    def __repr__(self):
        return f'<ExtractionJob {self.job_id} status={self.status}>'
```

**Indices:**
- `idx_extraction_jobs_match_id`: For "get jobs for this match"
- `idx_extraction_jobs_status`: For "get running jobs"
- `idx_extraction_jobs_created DESC`: For "recent jobs" listing

### Integration with Archival System

**Frame Upload Payload Schema:**

When Extraction Service uploads to Archival API (`POST /v1/archive/frames`), it sends:

```python
class ExtractionFrameData(BaseModel):
    """Data sent from Extraction Service → Archival API."""
    content_hash: str  # SHA-256 of JPEG
    jpeg_bytes: bytes  # JPEG image binary (base64 encoded in JSON)
    metadata: dict  # {match_id, extraction_job_id, frame_index, segment_type, timestamp_ms, accuracy_tier}
```

**Frame Query Response Schema (Archival → Frontend):**

```python
class ArchiveFrame(BaseModel):
    """Data returned from Archival API → Frontend."""
    id: str  # Frame ID (UUID from Archival)
    content_hash: str
    match_id: str
    frame_index: int
    stream_type: str  # 'A' (crop) or 'B' (analysis)
    segment_type: str  # IN_ROUND, BUY_PHASE, etc.
    timestamp_ms: int
    storage_url: str  # Signed S3 URL or file:// path
    file_size_bytes: int
    is_pinned: bool
    created_at: datetime

class FrameQueryResponse(BaseModel):
    """Paginated response from GET /v1/archive/matches/{match_id}/frames."""
    frames: List[ArchiveFrame]
    total_count: int
    page: int
    page_size: int
```

### TeneT Integration: Pinning Workflow

**Workflow:**
1. TeneT service analyzes frames (confidence scoring, verification)
2. For high-confidence frames (>90%), TeneT calls: `POST /v1/archive/frames/{frame_id}/pin`
3. Archival system marks frame as `is_pinned = true`, records `pin_reason` + `pin_expires_at`
4. Frontend displays green "✓ Verified" badge on pinned frames

**Payload:**
```python
class PinRequest(BaseModel):
    reason: str  # e.g., "TeneT verification: high confidence"
    ttl_days: Optional[int] = None  # Optional expiration
```

**Response:**
```python
class PinResponse(BaseModel):
    pinned_at: datetime
    expires_at: Optional[datetime]
```

**No reverse dependency:** Extraction Service does not call TeneT; TeneT initiates pinning after independent analysis.

---

## 5. API Endpoint Design

### Endpoint 1: POST /v1/extraction/jobs

**Purpose:** Trigger async frame extraction from a VOD file.

**Auth:** Service principal (extracted_service) or admin

**Request Schema:**

```python
class ExtractionJobRequest(BaseModel):
    """Request to start extraction job."""
    match_id: str  # UUID of the match
    vod_source: Literal["local"]  # Phase 1 only; "s3" deferred to Phase 2
    vod_path: str  # Absolute path (e.g., /data/vods/valorant_abc123.mp4)
    
    class Config:
        json_schema_extra = {
            "example": {
                "match_id": "550e8400-e29b-41d4-a716-446655440000",
                "vod_source": "local",
                "vod_path": "/data/vods/valorant_match_2026_03_27.mp4"
            }
        }
```

**Response Schema:**

```python
class ExtractionJobResponse(BaseModel):
    """Response after job creation."""
    job_id: str  # UUID of the job
    status: str  # "pending" (job queued, not yet running)
    created_at: datetime
```

**HTTP Response:**
- **200 OK:** Job created, async task dispatched
- **400 Bad Request:** Missing/invalid vod_path, invalid match_id UUID format
  - Example: `{ "code": "INVALID_VOD_PATH", "message": "VOD file not found: /data/vods/nonexistent.mp4", "details": {...} }`
- **404 Not Found:** Match doesn't exist in database
  - Example: `{ "code": "MATCH_NOT_FOUND", "message": "Match with ID ... does not exist" }`
- **503 Service Unavailable:** FFmpeg not available on system
  - Example: `{ "code": "FFMPEG_UNAVAILABLE", "message": "FFmpeg binary not found; check system PATH" }`

**Async Execution:**
- Response returns immediately (async task runs in background)
- Client must poll `GET /v1/extraction/jobs/{job_id}` to track progress

**Example Flow:**
```
POST /v1/extraction/jobs
Content-Type: application/json

{
  "match_id": "550e8400-e29b-41d4-a716-446655440000",
  "vod_source": "local",
  "vod_path": "/data/vods/valorant_2026_03_27.mp4"
}

→ 200 OK
{
  "job_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "pending",
  "created_at": "2026-03-27T10:30:00Z"
}
```

---

### Endpoint 2: GET /v1/extraction/jobs/{job_id}

**Purpose:** Poll job status and retrieve results (frame count, manifest ID, error details).

**Auth:** Service principal or admin (can be extended to user with job ownership check in Phase 2)

**Path Parameter:**
- `job_id` (string): UUID of extraction job

**Query Parameters:** None (Phase 1); optional `include_frames=true` deferred to Phase 2

**Response Schema:**

```python
class ExtractionJobStatusResponse(BaseModel):
    """Status response for extraction job."""
    job_id: str  # UUID
    match_id: str  # UUID
    status: str  # "pending", "running", "completed", "failed"
    frame_count: Optional[int] = None  # Non-null when status == "completed"
    manifest_id: Optional[str] = None  # UUID from Archival API, non-null when status == "completed"
    error_message: Optional[str] = None  # Non-null when status == "failed"
    completed_at: Optional[datetime] = None  # Non-null when status in ["completed", "failed"]
    
    class Config:
        json_schema_extra = {
            "example_pending": {
                "job_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                "match_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "pending",
                "frame_count": None,
                "manifest_id": None,
                "error_message": None,
                "completed_at": None
            },
            "example_completed": {
                "job_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                "match_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "completed",
                "frame_count": 1650,
                "manifest_id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
                "error_message": None,
                "completed_at": "2026-03-27T10:35:00Z"
            },
            "example_failed": {
                "job_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                "match_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "failed",
                "frame_count": None,
                "manifest_id": None,
                "error_message": "FFmpeg error: Invalid VOD format or corrupted file",
                "completed_at": "2026-03-27T10:32:15Z"
            }
        }
```

**HTTP Response:**
- **200 OK:** Job exists; return status
- **404 Not Found:** Job doesn't exist
  - Example: `{ "code": "JOB_NOT_FOUND", "message": "Extraction job with ID ... does not exist" }`

**Status Progression:**
1. Job created → status = "pending"
2. Background task starts → status = "running"
3. All stages complete → status = "completed" (frame_count, manifest_id populated)
4. Error in any stage → status = "failed" (error_message populated)

**Polling Guidance:**
- Typical job duration: 10–30 seconds (30-minute VOD)
- Recommended poll interval: 2–5 seconds (exponential backoff optional)
- Frontend timeout: 5 minutes (fail if job not completed after 300 sec)

**Example Flow:**
```
GET /v1/extraction/jobs/f47ac10b-58cc-4372-a567-0e02b2c3d479

→ 200 OK
{
  "job_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "match_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "frame_count": null,
  "manifest_id": null,
  "error_message": null,
  "completed_at": null
}

[After 15 seconds...]

GET /v1/extraction/jobs/f47ac10b-58cc-4372-a567-0e02b2c3d479

→ 200 OK
{
  "job_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "match_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "frame_count": 1650,
  "manifest_id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "error_message": null,
  "completed_at": "2026-03-27T10:35:00Z"
}
```

---

## 6. Frontend Hooks & Components

### Hook: useMinimapFrames

**Purpose:** Fetch paginated minimap frames for a match from Archival API using TanStack Query.

**Signature:**

```typescript
// apps/web/src/hooks/useMinimapFrames.ts

interface MinimapFrame {
  id: string;  // UUID
  content_hash: string;
  match_id: string;  // UUID
  frame_index: number;
  stream_type: 'A' | 'B';
  segment_type: 'IN_ROUND' | 'BUY_PHASE' | 'HALFTIME' | 'BETWEEN_ROUND' | 'UNKNOWN';
  timestamp_ms: number;
  storage_url: string;
  file_size_bytes: number;
  is_pinned: boolean;
  created_at: string;  // ISO-8601
}

interface UseMinimapFramesResult {
  frames: MinimapFrame[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

function useMinimapFrames(
  matchId: string,
  page: number = 1,
  pageSize: number = 50,
  segmentTypeFilter?: string
): UseMinimapFramesResult {
  const queryKey = ['minimap-frames', matchId, page, segmentTypeFilter];
  
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        ...(segmentTypeFilter && { segment_type: segmentTypeFilter })
      });
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/archive/matches/${matchId}/frames?${params}`
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => 1000 * (2 ** attemptIndex),
  });
  
  return {
    frames: query.data?.frames ?? [],
    isLoading: query.isLoading,
    error: query.error,
    hasMore: page < Math.ceil((query.data?.total_count ?? 0) / pageSize),
    totalCount: query.data?.total_count ?? 0,
    page,
    pageSize,
    nextPage: () => {/* increment page */},
    prevPage: () => {/* decrement page */},
    setPage: (newPage) => {/* set page */},
  };
}
```

**Caching Strategy:**
- **Stale Time:** 5 minutes (serve stale data while revalidating)
- **Cache Key:** `['minimap-frames', matchId, page, segmentTypeFilter]` (page-specific caching)
- **Retry:** 2 attempts with exponential backoff (1s, 2s)
- **Network Timeout:** 30 seconds (via fetch timeout or AbortController)

**Error Handling:**
- Network error: `error` property set; component shows error message
- 404 Not Found: Display "Match not found" or "No frames available"
- 503 Archival unavailable: Display "Archival service unavailable; try again later"

---

### Component: MinimapFrameGrid

**Purpose:** Render paginated grid of minimap frame thumbnails with pagination controls.

**Props:**

```typescript
// apps/web/src/components/MinimapFrameGrid.tsx

interface MinimapFrameGridProps {
  matchId: string;
  showVerificationBadges?: boolean;  // default: true
  pageSize?: number;  // default: 50, max: 100
  onFrameClick?: (frame: MinimapFrame) => void;  // callback for lightbox
}
```

**Component Structure:**

```typescript
function MinimapFrameGrid({
  matchId,
  showVerificationBadges = true,
  pageSize = 50,
  onFrameClick
}: MinimapFrameGridProps) {
  const [page, setPage] = useState(1);
  const { frames, isLoading, error, hasMore, totalCount } = useMinimapFrames(
    matchId,
    page,
    pageSize
  );
  
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Minimap Frames</h2>
        <span className="text-sm text-gray-600">
          {totalCount} frames total
        </span>
      </div>
      
      {/* Frame Grid */}
      <div className="grid grid-cols-4 gap-2 md:grid-cols-5 lg:grid-cols-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : frames.length === 0 ? (
          <div>No frames found</div>
        ) : (
          frames.map((frame) => (
            <FrameThumbnail
              key={frame.id}
              frame={frame}
              showVerificationBadge={showVerificationBadges}
              onZoom={onFrameClick}
            />
          ))
        )}
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {page} of {Math.ceil(totalCount / pageSize)}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

**Styling:** Tailwind responsive grid (`grid-cols-4 md:grid-cols-5 lg:grid-cols-6`), centered pagination, clean spacing.

---

### Component: FrameThumbnail

**Purpose:** Render individual frame thumbnail with badges, timestamp, and click handler.

**Props:**

```typescript
interface FrameThumbnailProps {
  frame: MinimapFrame;
  showVerificationBadge?: boolean;
  onZoom?: (frame: MinimapFrame) => void;
}

function FrameThumbnail({
  frame,
  showVerificationBadge = true,
  onZoom
}: FrameThumbnailProps) {
  const segmentColor = {
    'IN_ROUND': 'bg-red-500',
    'BUY_PHASE': 'bg-green-500',
    'HALFTIME': 'bg-gray-500',
    'BETWEEN_ROUND': 'bg-yellow-500',
    'UNKNOWN': 'bg-gray-400',
  }[frame.segment_type];
  
  const timestamp = new Date(frame.timestamp_ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  return (
    <div
      className="relative w-full aspect-square cursor-pointer group"
      onClick={() => onZoom?.(frame)}
    >
      {/* Frame Image */}
      <img
        src={frame.storage_url}
        alt={`Frame at ${timestamp}`}
        className="w-full h-full object-cover rounded"
        loading="lazy"
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded flex items-center justify-center">
        <span className="text-white text-sm">Click to zoom</span>
      </div>
      
      {/* Badges Container */}
      <div className="absolute bottom-1 left-1 right-1 space-y-1">
        {/* Segment Badge */}
        <span className={`inline-block ${segmentColor} text-white text-xs px-2 py-1 rounded`}>
          {frame.segment_type}
        </span>
        
        {/* Verification Badge */}
        {showVerificationBadge && (
          <div className={`text-xs font-semibold ${frame.is_pinned ? 'text-green-400' : 'text-gray-400'}`}>
            {frame.is_pinned ? '✓ Verified' : '? Pending'}
          </div>
        )}
      </div>
      
      {/* Timestamp Overlay */}
      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
        {timestamp}
      </div>
    </div>
  );
}
```

**Styling:** Aspect-square container, lazy loading, hover overlay effect, badge positioning.

---

## 7. Delivery Phases

### Phase 1 MVP (Phase 9 Execution: 2026-03-27 to 2026-03-30)

**Scope (In):**
- ✅ Single-threaded extraction pipeline (no parallel workers)
- ✅ Local VOD files only (`vod_source = "local"`)
- ✅ Fixed minimap region detection (hardcoded bounding box, bottom-right 25%)
- ✅ Segment classification using heuristics (round timer OCR, UI overlay detection; fallback to UNKNOWN)
- ✅ Deduplication via SHA-256 hashing (reduce ~10-20% of frames)
- ✅ Batch upload to Archival API (`POST /v1/archive/frames`)
- ✅ React MinimapFrameGrid component (paginated, 50 frames/page)
- ✅ TanStack Query hook for frame fetching (5-min cache, SWR pattern)
- ✅ Segment + verification badges on thumbnails
- ✅ Timestamp overlay (HH:MM:SS.mmm)
- ✅ PostgreSQL extraction_jobs table + SQLAlchemy model
- ✅ Two FastAPI endpoints: `POST /v1/extraction/jobs`, `GET /v1/extraction/jobs/{job_id}`
- ✅ Async job dispatch (background task execution)
- ✅ TeneT pinning workflow (display badges, read-only from Archival)

**Out of Scope (Phase 2+):**
- ❌ Parallel extraction workers (Celery, RQ; deferred Phase 2)
- ❌ Cloud VOD sources (S3, HTTP; deferred Phase 2)
- ❌ ML-based minimap detection (Phase 3)
- ❌ ML-based segment classification (Phase 3)
- ❌ Advanced filtering (segment type filters, confidence thresholds; Phase 2)
- ❌ Frame search/full-text search (Phase 2)
- ❌ Mobile optimization (responsive design Phase 2, full mobile Phase 3)
- ❌ Real-time streaming extraction (Phase 3)
- ❌ Lightbox zoom animations (Framer Motion; Phase 2)

### Phase 2 (Phase 10: 2026-04-15 to 2026-05-01)

**New Features:**
- Parallel extraction workers (Celery + Redis queue)
- S3/cloud VOD support
- Advanced job management (retries, cancellation, priority queue)
- ML-based minimap detection (ONNX model)
- Segment filtering UI (dropdown in MinimapFrameGrid header)
- Mobile responsive optimization (tablet, phone views)
- Lightbox zoom + keyboard navigation

### Phase 3+ (Phase 11+: 2026-05-15+)

**Future Enhancements:**
- Real-time streaming extraction (live match VODs)
- Advanced ML segment detection
- Frame search/tagging system
- Integration with SATOR/ROTAS for player-specific frame analysis
- Storage archival to Glacier/cold tier after retention

---

## 8. Verification Approach

### Unit Tests: Extraction Service

**Location:** `tests/unit/test_extraction_*.py`

**Test Modules:**

1. **test_extraction_models.py**
   - SQLAlchemy ExtractionJob model relationships, fields, validation
   - Test: Create job, update status, persist to DB
   - Command: `pytest tests/unit/test_extraction_models.py -v`

2. **test_extraction_pipeline.py**
   - FFmpeg metadata parsing (mock FFmpeg binary)
   - Minimap bounding box calculation
   - Segment classification logic (heuristics)
   - Deduplication algorithm (hash comparison)
   - Command: `pytest tests/unit/test_extraction_pipeline.py -v`

3. **test_extraction_routes.py**
   - Endpoint: `POST /v1/extraction/jobs` (create job, validate request, dispatch task)
   - Endpoint: `GET /v1/extraction/jobs/{job_id}` (poll status)
   - Error cases: 400 Bad Request, 404 Not Found, 503 Service Unavailable
   - Command: `pytest tests/unit/test_extraction_routes.py -v`

**Combined Command:**
```bash
pytest tests/unit/test_extraction_*.py -v --cov=packages/shared/api/src/njz_api/extraction --cov-report=term-missing
```

### Unit Tests: React Component

**Location:** `apps/web/src/__tests__/`

**Test Modules:**

1. **MinimapFrameGrid.test.tsx**
   - Component renders with mock data (from TanStack Query)
   - Pagination controls: next/prev buttons, page indicator
   - Loading state: spinner visible while fetching
   - Error state: error message displayed
   - Command: `npm run test -- MinimapFrameGrid.test.tsx --coverage`

2. **FrameThumbnail.test.tsx**
   - Renders thumbnail with image, badges, timestamp
   - Segment badges: correct color + text
   - Verification badge: ✓ for pinned, ? for pending
   - Click handler: `onZoom` callback invoked
   - Command: `npm run test -- FrameThumbnail.test.tsx --coverage`

3. **useMinimapFrames.test.tsx**
   - Hook fetches data from mock Archival API
   - Cache key correct: `['minimap-frames', matchId, page]`
   - Stale time: 5 minutes
   - Pagination functions work (nextPage, prevPage, setPage)
   - Error handling (network error, 404, 503)
   - Command: `npm run test -- useMinimapFrames.test.tsx --coverage`

**Combined Command:**
```bash
npm run test -- MinimapFrameGrid FrameThumbnail useMinimapFrames --coverage
```

### Integration Tests

**Location:** `tests/integration/test_minimap_*.py`

**Test Modules:**

1. **test_minimap_extraction_e2e.py**
   - End-to-end extraction pipeline:
     - Mock VOD file → Extract frames → Classify segments → Deduplicate → Upload to Archival (mock)
   - Verify job status progression: pending → running → completed
   - Verify frame count matches expected
   - Verify manifest_id populated in extraction_jobs
   - Command: `pytest tests/integration/test_minimap_extraction_e2e.py -v`

2. **test_minimap_archival_integration.py**
   - Mock Archival API: `POST /v1/archive/frames` returns manifest_id
   - Frame query mock: `GET /v1/archive/matches/{match_id}/frames` returns paginated frames
   - Verify Extraction Service correctly uploads frames (payload format, auth)
   - Verify Frontend TanStack Query hook correctly queries Archival
   - Command: `pytest tests/integration/test_minimap_archival_integration.py -v`

3. **test_minimap_tenet_integration.py**
   - TeneT pinning workflow:
     - Frame extracted → TeneT verifies (mock) → `POST /v1/archive/frames/{id}/pin` → Frontend shows badge
   - Verify pin badge displays correctly in MinimapFrameGrid
   - Command: `pytest tests/integration/test_minimap_tenet_integration.py -v`

**Combined Command:**
```bash
pytest tests/integration/test_minimap_*.py -v --cov=packages/shared/api/src/njz_api/extraction
```

### E2E Tests (Playwright)

**Location:** `tests/e2e/minimap-extraction.spec.ts`

**Test Scenarios:**

1. **Extraction Job Flow**
   - Navigate to match details page
   - Click "Extract Minimap Frames" button (if visible)
   - Verify job ID displayed and status = "pending"
   - Poll status until "completed"
   - Verify frame_count displayed

2. **Minimap Frame Grid Display**
   - Navigate to match with extracted frames
   - MinimapFrameGrid component loads
   - Verify 50 thumbnails displayed (first page)
   - Verify segment badges: IN_ROUND (red), BUY_PHASE (green), etc.
   - Verify verification badges: ✓ for pinned, ? for pending
   - Verify timestamps: HH:MM:SS.mmm format

3. **Pagination**
   - Start on page 1 (50 frames)
   - Click "Next" button
   - Verify page 2 loaded (frames 51-100)
   - Verify "Previous" button enabled
   - Click "Previous"
   - Verify back on page 1

4. **Lightbox (Phase 2)**
   - Click thumbnail
   - Fullscreen modal opens
   - Verify image, metadata, timestamp
   - Navigate frames with keyboard arrows
   - Click outside modal to close

**Command:**
```bash
npx playwright test tests/e2e/minimap-extraction.spec.ts --headed
```

### Type Checking & Linting

**Python:**
```bash
# Type checking
mypy packages/shared/api/src/njz_api/extraction/ --ignore-missing-imports

# Linting
ruff check packages/shared/api/src/njz_api/extraction/
ruff format packages/shared/api/src/njz_api/extraction/

# Combined
mypy packages/shared/api/src/njz_api/ && ruff check packages/shared/api/src/njz_api/
```

**TypeScript:**
```bash
# Type checking
npm run typecheck

# Linting
npm run lint -- apps/web/src/components/MinimapFrameGrid.tsx apps/web/src/hooks/useMinimapFrames.ts

# Combined
npm run lint && npm run typecheck
```

### Pre-Commit Hook

All code must pass before commit:
```bash
# Run all checks
pytest tests/unit/test_extraction_*.py && \
npm run test -- MinimapFrameGrid FrameThumbnail useMinimapFrames && \
mypy packages/shared/api/src/njz_api/extraction/ && \
ruff check packages/shared/api/src/njz_api/extraction/ && \
npm run typecheck && \
npm run lint
```

---

## 9. CRITICAL BLOCKER: Archival System Integration

### Blocker Definition

**Tasks 7–9 (Archival integration) CANNOT start until:**
1. ✅ Archival System API endpoints deployed and tested
2. ✅ Frame storage and deduplication working reliably
3. ✅ Query endpoint (`GET /v1/archive/matches/{match_id}/frames`) functional
4. ✅ Pinning endpoint (`POST /v1/archive/frames/{id}/pin`) functional

**Current Status:** Archival System in parallel development (see ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md)

**Estimated Archival Completion:** 2026-03-29 to 2026-03-31 (check Archival workplan for updated ETA)

### Blocker Impact

**Blocked Tasks (cannot execute before Archival ready):**
- **Task 7:** Integration — Extraction Service → Archival API (frame upload)
- **Task 8:** Integration — Frontend → Archival API (frame query, pagination)
- **Task 9:** Integration — TeneT → Archival pinning workflow

**Unblocked Tasks (can execute in parallel while Archival completes):**
- **Task 1:** PostgreSQL extraction_jobs table + SQLAlchemy model ✅
- **Task 2:** FFmpeg + OpenCV extraction pipeline ✅
- **Task 3:** Segment type classification logic ✅
- **Task 4:** FastAPI extraction jobs endpoint + async dispatch ✅
- **Task 5:** React MinimapFrameGrid component (mock data) ✅
- **Task 6:** TanStack Query hook useMinimapFrames (mock Archival) ✅

### Mitigation Strategy: Mock Archival API

**For Tasks 1–6 development (while Archival System completes):**

#### Mock Archival API Implementation

Create a mock Archival endpoint at `packages/shared/api/routers/mock_archival.py`:

```python
# packages/shared/api/routers/mock_archival.py

from fastapi import APIRouter, Query
from uuid import uuid4
from datetime import datetime, timedelta

router = APIRouter(prefix='/v1/archive', tags=['mock-archival'])

# In-memory store (Phase 1; replaced with real Archival System in Phase 2)
mock_frames_store = {}
mock_manifests_store = {}

@router.post('/frames')
async def mock_upload_frames(request: dict):
    """Mock frame upload endpoint."""
    frame_ids = [str(uuid4()) for _ in request.get('frames', [])]
    manifest_id = str(uuid4())
    
    # Store in mock store
    mock_manifests_store[manifest_id] = {
        'frame_ids': frame_ids,
        'created_at': datetime.now().isoformat()
    }
    
    return {
        'frame_ids': frame_ids,
        'manifest_id': manifest_id,
        'duplicates_skipped': 0
    }

@router.get('/matches/{match_id}/frames')
async def mock_query_frames(match_id: str, page: int = Query(1), page_size: int = Query(50)):
    """Mock frame query endpoint."""
    # Return 50 dummy frames per page
    total_count = 1800
    start = (page - 1) * page_size
    
    frames = [
        {
            'id': str(uuid4()),
            'content_hash': f'sha256_mock_{i}',
            'match_id': match_id,
            'frame_index': i,
            'stream_type': 'A',
            'segment_type': ['IN_ROUND', 'BUY_PHASE', 'HALFTIME', 'BETWEEN_ROUND'][i % 4],
            'timestamp_ms': i * 1000,
            'storage_url': f'file:///mock/frames/{i}.jpg',
            'file_size_bytes': 150000,
            'is_pinned': i % 10 == 0,  # Mock: every 10th frame pinned
            'created_at': (datetime.now() - timedelta(hours=1)).isoformat()
        }
        for i in range(start, min(start + page_size, total_count))
    ]
    
    return {
        'frames': frames,
        'total_count': total_count,
        'page': page,
        'page_size': page_size
    }

@router.post('/frames/{frame_id}/pin')
async def mock_pin_frame(frame_id: str, request: dict):
    """Mock frame pinning endpoint."""
    return {
        'pinned_at': datetime.now().isoformat(),
        'expires_at': None
    }
```

**Configuration:**
- `USE_MOCK_ARCHIVAL=true` in `.env` during development
- Route registration: Include mock router only when `USE_MOCK_ARCHIVAL=true`
- Existing real Archival routes prefixed differently (e.g., `/v1/archive-real/`) if deployed in parallel

**Swap Strategy (Phase 2):**
1. Archival System deployed to production
2. Update `VITE_API_URL` in frontend .env to point to real Archival
3. Remove mock router from FastAPI app
4. Verify Tests 7–9 pass against real Archival API
5. No code changes to Extraction Service or Frontend needed (API contract identical)

### Contingency: Archival Delay

**If Archival System not ready by 2026-03-30:**
1. Continue Tasks 1–6 with mock API (no blockers)
2. Defer Tasks 7–9 to Phase 9 continuation session (2026-03-30+)
3. Extend mock API to support more realistic Archival responses (frame URLs, pinning state)
4. Confirm Archival ETA with Archival team; re-plan Phase 10 if Archival spans into Phase 10

**Expected Delay Impact:** 1–2 days (small; Tasks 1–6 = 70% of MVP)

### Testing Mock API

**Unit Test for Mock Archival:**

```python
# tests/unit/test_mock_archival.py
import pytest
from fastapi.testclient import TestClient
from packages.shared.api.main import app

client = TestClient(app)

def test_mock_upload_frames():
    """Verify mock upload returns frame IDs and manifest."""
    response = client.post('/v1/archive/frames', json={
        'frames': [{'frame_data': b'...'} for _ in range(10)]
    })
    assert response.status_code == 200
    assert 'manifest_id' in response.json()
    assert len(response.json()['frame_ids']) == 10

def test_mock_query_frames():
    """Verify mock query returns paginated frames."""
    response = client.get('/v1/archive/matches/test-match-id/frames?page=1&page_size=50')
    assert response.status_code == 200
    data = response.json()
    assert 'frames' in data
    assert len(data['frames']) <= 50
    assert data['total_count'] == 1800
    assert data['page'] == 1
```

---

## Summary

This specification defines a complete, implementation-ready design for the **Minimap Extraction Service & Frontend**. The system is decomposed into:

1. **Backend Extraction Pipeline:** 6-stage async processor (metadata → detection → extraction → classification → deduplication → upload)
2. **Frontend Component:** Paginated frame grid with segment + verification badges
3. **Data Model:** PostgreSQL extraction_jobs table + Archival integration
4. **API Layer:** 2 endpoints for job lifecycle management
5. **Integration Points:** Clear Archival API contracts with mock API mitigation for Phase 1

**Critical Blocker:** Archival System integration (Tasks 7–9) deferred until Archival API ready; mock API enables Tasks 1–6 parallel execution.

**Quality Assurance:** Comprehensive testing strategy (unit, integration, E2E) with specific, executable commands for all test suites.

**Ready for Cross-Review:** All 8 sections complete; all patterns reference existing codebase; blocker explicitly documented with mitigation.

