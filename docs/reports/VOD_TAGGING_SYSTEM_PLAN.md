[Ver001.000]

# VOD Tagging System — Immediate Implementation Plan

**Date:** 2026-03-30  
**Status:** Ready for Implementation  
**Strategic Value:** Community Engagement + CV Training Data Pipeline

---

## EXECUTIVE SUMMARY

Instead of waiting for ML/CV infrastructure, implement **manual VOD tagging tools** that:
1. **Immediate Value:** Community contributes tactical analysis
2. **Training Data:** Tagged clips become CV training corpus
3. **Data Pipeline:** Establishes extraction → archival → ML workflow
4. **Risk Mitigation:** Proves value before heavy ML investment

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VOD TAGGING PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Upload    │───▶│   Manual    │───▶│   Store     │───▶│   Export    │  │
│  │   VOD       │    │   Tagging   │    │   Tagged    │    │   to ML     │  │
│  │             │    │   UI        │    │   Clips     │    │   Pipeline  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                  │                  │                  │          │
│         ▼                  ▼                  ▼                  ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  YouTube    │    │  Timeline   │    │  Archival   │    │  COCO/YOLO  │  │
│  │  Twitch     │    │  Markers    │    │  API        │    │  Format     │  │
│  │  Direct     │    │  Categories │    │  Pinning    │    │  Export     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TRAINING DATA GENERATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tagged Clips ──▶ Frame Extraction ──▶ Annotation Export ──▶ CV Training   │
│                                                                             │
│  Examples:                                                                  │
│  - "Smoke Execute on A Site" ──▶ 50 frames with smoke bounding boxes       │
│  - "Clutch 1v3" ──▶ Player positions + outcome labels                      │
│  - "Eco Round Win" ──▶ Weapon labels + economic state                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION PHASES

### Phase 1: Core Tagging UI (Week 1)

#### 1.1 Frontend Components (hub-4-opera)

```typescript
// apps/web/src/hub-4-opera/components/VodTagger/
├── VodTagger.tsx              # Main container
├── Timeline.tsx               # Video timeline with markers
├── TagPalette.tsx             # Available tag categories
├── TagMarker.tsx              # Individual tag on timeline
├── ClipExporter.tsx           # Export tagged clips
└── types.ts                   # Tag data structures
```

**Tag Data Model:**
```typescript
// data/schemas/vod-tags.ts
interface VodTag {
  id: string;
  matchId: string;
  videoUrl: string;
  
  // Temporal
  startTime: number;           // seconds
  endTime: number;             // seconds
  
  // Categorization
  category: TagCategory;
  subcategory: string;
  
  // Spatial (optional, for CV training)
  boundingBoxes?: BoundingBox[];
  
  // Metadata
  taggedBy: string;            // user_id
  taggedAt: string;            // ISO timestamp
  confidence: 'certain' | 'probable' | 'guess';
  
  // Game context
  game: 'valorant' | 'cs2';
  map?: string;
  round?: number;
}

type TagCategory = 
  | 'execute'        // Coordinated site take
  | 'clutch'         // Low-man advantage win
  | 'eco'            // Economy decision
  | 'ability_usage'  // Ability timing
  | 'positioning'    // Map positioning
  | 'trade'          // Trade fragging
  | 'retake'         // Site retake
  | 'rotate';        // Rotation timing

interface BoundingBox {
  x: number;           // normalized 0-1
  y: number;
  width: number;
  height: number;
  label: string;       // 'player', 'smoke', 'ability', etc.
}
```

#### 1.2 UI Component: Timeline Tagging

```tsx
// VodTagger.tsx
export function VodTagger({ videoUrl, matchId }: VodTaggerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [tags, setTags] = useState<VodTag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TagCategory>('execute');
  
  const addTag = useCallback((start: number, end: number) => {
    const newTag: VodTag = {
      id: generateId(),
      matchId,
      videoUrl,
      startTime: start,
      endTime: end,
      category: selectedCategory,
      taggedBy: currentUser.id,
      taggedAt: new Date().toISOString(),
      confidence: 'certain',
    };
    setTags(prev => [...prev, newTag]);
  }, [selectedCategory, matchId, videoUrl]);
  
  return (
    <div className="vod-tagger">
      <VideoPlayer 
        src={videoUrl} 
        onTimeUpdate={setCurrentTime}
      />
      <Timeline 
        duration={videoDuration}
        currentTime={currentTime}
        tags={tags}
        onAddTag={addTag}
      />
      <TagPalette 
        categories={TAG_CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <ClipExporter tags={tags} matchId={matchId} />
    </div>
  );
}
```

#### 1.3 Backend API Endpoints

```python
# services/api/src/njz_api/opera/vod_tags.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/v1/vod-tags", tags=["vod-tags"])

class VodTagCreate(BaseModel):
    match_id: str
    video_url: str
    start_time: float
    end_time: float
    category: str
    subcategory: Optional[str] = None
    bounding_boxes: Optional[List[dict]] = None
    confidence: str = "certain"

class VodTagResponse(VodTagCreate):
    id: str
    tagged_by: str
    tagged_at: str

@router.post("/", response_model=VodTagResponse)
async def create_tag(
    tag: VodTagCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new VOD tag"""
    tag_id = generate_uuid()
    
    async with db.pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO vod_tags 
            (id, match_id, video_url, start_time, end_time, 
             category, subcategory, bounding_boxes, confidence, 
             tagged_by, tagged_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            """,
            tag_id, tag.match_id, tag.video_url, tag.start_time, 
            tag.end_time, tag.category, tag.subcategory,
            json.dumps(tag.bounding_boxes) if tag.bounding_boxes else None,
            tag.confidence, current_user.id
        )
    
    return VodTagResponse(
        id=tag_id,
        tagged_by=current_user.id,
        tagged_at=datetime.now().isoformat(),
        **tag.dict()
    )

@router.get("/match/{match_id}", response_model=List[VodTagResponse])
async def get_tags_for_match(match_id: str):
    """Get all tags for a match"""
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM vod_tags WHERE match_id = $1 ORDER BY start_time",
            match_id
        )
    return [VodTagResponse(**dict(row)) for row in rows]

@router.get("/export/training-data")
async def export_training_data(
    game: Optional[str] = None,
    category: Optional[str] = None,
    min_confidence: str = "probable"
):
    """Export tagged clips for CV training (admin only)"""
    # Returns COCO format or YOLO format
    pass
```

#### 1.4 Database Migration

```python
# infra/migrations/versions/007_vod_tags.py
"""VOD tagging system for manual annotation and CV training.

Revision ID: 007_vod_tags
Revises: 006_betting_token_schema  # Or latest
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = '007_vod_tags'
down_revision = '006_betting_token_schema'

def upgrade():
    op.create_table(
        'vod_tags',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('match_id', sa.String(100), nullable=False, index=True),
        sa.Column('video_url', sa.String(500), nullable=False),
        sa.Column('start_time', sa.Float(), nullable=False),
        sa.Column('end_time', sa.Float(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False, index=True),
        sa.Column('subcategory', sa.String(50), nullable=True),
        sa.Column('bounding_boxes', JSONB(), nullable=True),
        sa.Column('confidence', sa.String(20), nullable=False),
        sa.Column('game', sa.String(20), nullable=False),
        sa.Column('map', sa.String(50), nullable=True),
        sa.Column('round', sa.Integer(), nullable=True),
        sa.Column('tagged_by', UUID(as_uuid=True), nullable=False),
        sa.Column('tagged_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    
    # Indexes for common queries
    op.create_index('ix_vod_tags_category_game', 'vod_tags', ['category', 'game'])
    op.create_index('ix_vod_tags_tagged_by', 'vod_tags', ['tagged_by'])
    op.create_index('ix_vod_tags_time_range', 'vod_tags', ['start_time', 'end_time'])
```

---

### Phase 2: Community Features (Week 2)

#### 2.1 Gamification & Leaderboards

```typescript
// Tagging leaderboards and reputation
interface TagReputation {
  userId: string;
  totalTags: number;
  verifiedTags: number;      // Confirmed by other users
  accuracy: number;          // % of tags others agree with
  specialty: TagCategory;    // Most tagged category
  rank: 'scout' | 'analyst' | 'expert' | 'sage';
}

// Consensus system for tag verification
interface TagConsensus {
  tagId: string;
  agrees: number;
  disagrees: number;
  consensusReached: boolean;
  finalCategory?: TagCategory;
}
```

#### 2.2 Tag Challenges

```typescript
// Weekly challenges to drive engagement
interface TagChallenge {
  id: string;
  title: string;
  description: string;
  category: TagCategory;
  targetMatchIds: string[];
  reward: {
    tokens: number;
    badge?: string;
  };
  startDate: string;
  endDate: string;
}

// Example challenges
const weeklyChallenges = [
  {
    title: "Smoke Master",
    description: "Tag 10 effective smoke executes on Haven",
    category: "execute",
    reward: { tokens: 100, badge: "smoke-master" }
  },
  {
    title: "Clutch Hunter", 
    description: "Find and tag 5 clutch rounds",
    category: "clutch",
    reward: { tokens: 150, badge: "clutch-hunter" }
  }
];
```

---

### Phase 3: CV Training Pipeline (Week 3-4)

#### 3.1 Frame Extraction Service

```python
# services/api/src/njz_api/opera/frame_extraction.py
import ffmpeg
import cv2
from pathlib import Path

class FrameExtractor:
    """Extract frames from tagged clips for CV training"""
    
    def __init__(self, output_dir: str = "data/training_frames"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def extract_clip_frames(
        self,
        tag: VodTag,
        fps: int = 5,  # 5 frames per second
        resolution: tuple = (1280, 720)
    ) -> List[Path]:
        """
        Extract frames from a tagged clip.
        Returns paths to extracted frames.
        """
        clip_dir = self.output_dir / tag.id
        clip_dir.mkdir(exist_ok=True)
        
        # Extract clip segment
        stream = ffmpeg.input(
            tag.video_url,
            ss=tag.start_time,
            t=tag.end_time - tag.start_time
        )
        
        # Output frames
        output_pattern = str(clip_dir / "frame_%04d.jpg")
        stream = ffmpeg.filter(stream, 'fps', fps=fps)
        stream = ffmpeg.filter(stream, 'scale', *resolution)
        stream = ffmpeg.output(stream, output_pattern)
        
        ffmpeg.run(stream, quiet=True)
        
        return sorted(clip_dir.glob("*.jpg"))
    
    async def generate_bounding_boxes(
        self,
        frames: List[Path],
        tag: VodTag
    ) -> List[dict]:
        """
        Generate bounding box annotations for frames.
        For now, use manual tags. Future: YOLO inference.
        """
        annotations = []
        
        for frame_path in frames:
            frame_anno = {
                "image": str(frame_path),
                "tags": tag.category,
                "bounding_boxes": tag.bounding_boxes or [],
                "metadata": {
                    "match_id": tag.match_id,
                    "timestamp": tag.start_time,
                    "game": tag.game
                }
            }
            annotations.append(frame_anno)
        
        return annotations
```

#### 3.2 COCO Format Export

```python
# Export to COCO format for CV training
def export_coco_format(tags: List[VodTag]) -> dict:
    """
    Export tags to COCO dataset format.
    
    COCO structure:
    {
      "images": [...],
      "annotations": [...],
      "categories": [...]
    }
    """
    coco = {
        "info": {
            "description": "NJZ VOD Tag Dataset",
            "version": "1.0",
            "year": 2026,
            "contributor": "NJZ Community"
        },
        "images": [],
        "annotations": [],
        "categories": [
            {"id": 1, "name": "execute", "supercategory": "tactic"},
            {"id": 2, "name": "clutch", "supercategory": "situation"},
            {"id": 3, "name": "smoke", "supercategory": "ability"},
            # ... etc
        ]
    }
    
    annotation_id = 1
    
    for tag in tags:
        # Add image entries for each frame
        frames = extract_frames(tag)
        
        for i, frame in enumerate(frames):
            image_id = f"{tag.id}_{i}"
            
            coco["images"].append({
                "id": image_id,
                "file_name": str(frame),
                "width": 1280,
                "height": 720,
                "match_id": tag.match_id
            })
            
            # Add annotations
            if tag.bounding_boxes:
                for bbox in tag.bounding_boxes:
                    coco["annotations"].append({
                        "id": annotation_id,
                        "image_id": image_id,
                        "category_id": category_to_id(tag.category),
                        "bbox": [bbox.x, bbox.y, bbox.width, bbox.height],
                        "area": bbox.width * bbox.height,
                        "iscrowd": 0
                    })
                    annotation_id += 1
    
    return coco
```

---

## INTEGRATION WITH EXISTING SYSTEMS

### 1. Archival API Integration

```typescript
// Link tagged clips to archival system
interface TaggedClipArchive {
  tagId: string;
  archivalFrameIds: string[];  // References to archival API
  pinned: boolean;
  pinDuration: number;         // Days to keep pinned
}

// Auto-archive high-quality tags
async function autoArchiveTag(tag: VodTag) {
  if (tag.confidence === 'certain' && hasBoundingBoxes(tag)) {
    await archivalApi.pinFrames({
      tagId: tag.id,
      duration: 365  // Keep for 1 year
    });
  }
}
```

### 2. SimRating Integration

```python
# Tagged clutches feed into SimRating clutch factor
def calculate_clutch_rating(player_id: str) -> float:
    """Calculate clutch performance from tagged clips"""
    clutch_tags = db.query("""
        SELECT * FROM vod_tags 
        WHERE category = 'clutch' 
        AND tagged_by IN (
            SELECT user_id FROM users WHERE reputation > 50
        )
    """)
    
    # Weight by tagger reputation and confidence
    weighted_clutches = sum(
        tag.confidence_weight * tag.tagger_reputation
        for tag in clutch_tags
        if tag.player_id == player_id
    )
    
    return normalize(weighted_clutches)
```

### 3. Prediction Market Integration

```typescript
// Tagged scenarios inform prediction odds
interface ScenarioOdds {
  situation: string;     // "1v2 clutch, 100HP vs 50HP"
  map: string;
  winProbability: number;
  sampleSize: number;    // Number of tagged similar situations
}

// Derive odds from tagged historical data
function calculateScenarioOdds(
  map: string,
  playersAlive: number,
  enemyAlive: number,
  economy: EconomyState
): ScenarioOdds {
  const similarTags = searchTaggedScenarios({
    map,
    category: 'clutch',
    filters: { playersAlive, enemyAlive }
  });
  
  return {
    situation: formatSituation(playersAlive, enemyAlive),
    map,
    winProbability: calculateWinRate(similarTags),
    sampleSize: similarTags.length
  };
}
```

---

## IMPLEMENTATION CHECKLIST

### Week 1: Core UI

- [ ] Create `VodTagger` component in hub-4-opera
- [ ] Implement timeline with tag markers
- [ ] Build tag palette with categories
- [ ] Create API endpoints (POST /v1/vod-tags)
- [ ] Database migration 007_vod_tags.py
- [ ] Add to OPERA hub navigation
- [ ] Basic styling with Tailwind

### Week 2: Community

- [ ] User reputation system
- [ ] Tag consensus/voting
- [ ] Weekly challenges
- [ ] Leaderboard component
- [ ] Token rewards integration

### Week 3: Pipeline

- [ ] Frame extraction service
- [ ] COCO format export
- [ ] Admin export dashboard
- [ ] Integration with archival API
- [ ] Frame storage optimization

### Week 4: Polish

- [ ] Keyboard shortcuts for power users
- [ ] Tag templates (common scenarios)
- [ ] Import from YouTube/Twitch timestamps
- [ ] Mobile-responsive tagging UI
- [ ] Documentation and tutorials

---

## SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tags created (Month 1) | 500 | Database count |
| Active taggers | 50 | Unique user count |
| Tags with bounding boxes | 30% | Quality metric |
| Consensus accuracy | 80% | Agree/disagree ratio |
| Training clips exported | 100 | ML pipeline input |

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Low community engagement | Gamification + token rewards |
| Poor tag quality | Reputation system + consensus |
| Copyright issues | Only official broadcast VODs |
| Storage costs | Auto-expire unverified clips |
| ML training delay | Manual tags work without CV |

---

*This plan provides immediate community value while building the data pipeline for future CV automation. Execute in parallel with Rust simulation work.*
