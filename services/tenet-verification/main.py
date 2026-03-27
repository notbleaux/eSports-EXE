import os
import json
import logging
import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator, List, Dict, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
from fastapi import FastAPI, HTTPException, Query, Path as FastAPIPath, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings
from sqlalchemy import (
    Column, String, Float, DateTime, Enum as SQLEnum,
    Boolean, JSON, ForeignKey, Integer, create_engine, select
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
import asyncpg

# --- Configuration ---

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
    )
    CONFIDENCE_THRESHOLD_AUTO_ACCEPT: float = 0.90
    CONFIDENCE_THRESHOLD_FLAG: float = 0.70
    REVIEW_QUEUE_RETENTION_DAYS: int = 30
    APP_VERSION: str = "0.2.0"

settings = Settings()

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tenet-verification")

# --- Database Setup ---

Base = declarative_base()

class VerificationStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    FLAGGED = "FLAGGED"
    REJECTED = "REJECTED"
    PENDING = "PENDING"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"

# SQLAlchemy Models
class VerificationRecord(Base):
    """Stores verification results with confidence scores"""
    __tablename__ = "verification_records"

    id = Column(String(255), primary_key=True)
    entity_id = Column(String(255), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False)
    game = Column(String(50), nullable=False, index=True)
    status = Column(SQLEnum(VerificationStatus), nullable=False)
    confidence_value = Column(Float, nullable=False)
    confidence_breakdown = Column(JSON, nullable=False)
    conflict_fields = Column(JSON, nullable=True)
    has_conflicts = Column(Boolean, default=False)
    rejection_reasons = Column(JSON, nullable=True)
    distribution_path = Column(String(50), nullable=False)
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    source_contributions = relationship("DataSourceContribution", back_populates="verification_record", cascade="all, delete-orphan")
    manual_review = relationship("ReviewQueue", back_populates="verification_record", uselist=False, cascade="all, delete-orphan")

class DataSourceContribution(Base):
    """Tracks which sources contributed to a verification"""
    __tablename__ = "data_source_contributions"

    id = Column(String(255), primary_key=True)
    verification_id = Column(String(255), ForeignKey("verification_records.id"), nullable=False, index=True)
    source_type = Column(String(100), nullable=False)
    trust_level = Column(String(50), nullable=False)
    weight = Column(Float, nullable=False)
    source_confidence = Column(Float, nullable=False)
    ingested_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    verification_record = relationship("VerificationRecord", back_populates="source_contributions")

class ReviewQueue(Base):
    """Flagged entities awaiting manual review"""
    __tablename__ = "review_queue"

    id = Column(String(255), primary_key=True)
    verification_id = Column(String(255), ForeignKey("verification_records.id"), nullable=False, index=True, unique=True)
    entity_id = Column(String(255), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False)
    game = Column(String(50), nullable=False, index=True)
    reason = Column(String(500), nullable=False)
    confidence_value = Column(Float, nullable=False)
    reviewer_id = Column(String(255), nullable=True)
    review_decision = Column(String(50), nullable=True)  # ACCEPT, REJECT, NEEDS_MORE_DATA
    review_notes = Column(String(2000), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    flagged_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationship
    verification_record = relationship("VerificationRecord", back_populates="manual_review")

# --- Database Session Management ---

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        yield session

# --- Pydantic Models ---

class TenetBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )

class DataSource(TenetBaseModel):
    source_type: str = Field(alias="sourceType")
    trust_level: str = Field(alias="trustLevel")
    weight: float
    data: Dict[str, Any]
    captured_at: datetime = Field(alias="capturedAt")

class VerificationRequest(TenetBaseModel):
    entity_id: str = Field(alias="entityId")
    entity_type: str = Field(alias="entityType")
    game: str
    sources: List[DataSource]

class ConfidenceSourceContribution(TenetBaseModel):
    source_type: str = Field(alias="sourceType")
    trust_level: str = Field(alias="trustLevel")
    weight: float
    source_confidence: float = Field(alias="sourceConfidence")
    ingested_at: datetime = Field(alias="ingestedAt")

class ConfidenceScore(TenetBaseModel):
    value: float
    source_count: int = Field(alias="sourceCount")
    by_source: List[ConfidenceSourceContribution] = Field(alias="bySource")
    has_conflicts: bool = Field(alias="hasConflicts")
    conflict_fields: List[str] = Field(alias="conflictFields")
    computed_at: datetime = Field(alias="computedAt")

class VerificationResult(TenetBaseModel):
    entity_id: str = Field(alias="entityId")
    status: str
    confidence: ConfidenceScore
    verified_at: datetime = Field(alias="verifiedAt")
    distribution_path: str = Field(alias="distributionPath")
    metadata: Dict[str, Any]

class ManualReviewSubmission(TenetBaseModel):
    reviewer_id: str = Field(alias="reviewerId")
    decision: str  # ACCEPT, REJECT, NEEDS_MORE_DATA
    notes: str

class ReviewQueueItem(TenetBaseModel):
    entity_id: str = Field(alias="entityId")
    entity_type: str = Field(alias="entityType")
    game: str
    confidence_value: float = Field(alias="confidenceValue")
    reason: str
    flagged_at: datetime = Field(alias="flaggedAt")

# --- Confidence Calculator ---

class ConfidenceCalculator:
    """Implements the TeneT Key.Links consensus confidence algorithm"""

    DATA_SOURCE_TRUST = {
        "pandascore_api": ("HIGH", 1.0),
        "riot_official_api": ("HIGH", 1.0),
        "video_analysis": ("MEDIUM", 0.7),
        "video_manual_review": ("HIGH", 1.0),
        "minimap_analysis": ("MEDIUM", 0.7),
        "livestream_grading": ("MEDIUM", 0.7),
        "vlr_scrape": ("LOW", 0.4),
        "liquidpedia_scrape": ("MEDIUM", 0.7),
        "youtube_extract": ("LOW", 0.4),
        "fan_forum": ("LOW", 0.4),
        "manual_entry": ("HIGH", 1.0),
    }

    @classmethod
    def calculate_confidence(cls, sources: List[DataSource]) -> tuple[float, Dict[str, Any], List[str]]:
        """
        Calculate overall confidence score with field-level conflict detection.

        Returns:
            tuple: (confidence_value: float, breakdown: Dict, conflict_fields: List[str])
        """
        if not sources:
            return 0.0, {"error": "No sources provided", "sourceCount": 0}, []

        total_weight = sum(s.weight for s in sources)
        if total_weight == 0:
            return 0.0, {"error": "Total weight is zero", "sourceCount": len(sources)}, []

        weighted_base_score = 0.0
        agreement_bonus = 0.0
        conflict_fields = []

        # Calculate trust-based weighted score
        for source in sources:
            trust_level = source.trust_level
            trust_multiplier = {
                "HIGH": 1.0,
                "MEDIUM": 0.7,
                "LOW": 0.4
            }.get(trust_level, 0.1)

            weighted_base_score += (source.weight / total_weight) * trust_multiplier

        # Field-level agreement check
        critical_fields = ["final_score", "round_result", "winner_id", "kills", "deaths"]
        field_agreement = {}

        for field in critical_fields:
            field_values = []
            for source in sources:
                value = source.data.get(field)
                if value is not None:
                    field_values.append(json.dumps(value, sort_keys=True, default=str))

            if len(field_values) > 1:
                unique_values = set(field_values)
                field_agreement[field] = {
                    "count": len(field_values),
                    "unique": len(unique_values),
                    "agreement": len(unique_values) == 1
                }

                if len(unique_values) > 1:
                    conflict_fields.append(field)
                    agreement_bonus = max(agreement_bonus - 0.1, 0)  # Penalty for conflicts

        # Apply agreement bonus
        if field_agreement:
            agreed_fields = sum(1 for v in field_agreement.values() if v.get("agreement"))
            if agreed_fields > 0:
                agreement_bonus = min(0.15 * (agreed_fields / len(field_agreement)), 0.15)

        final_score = min(1.0, weighted_base_score + agreement_bonus)

        return round(final_score, 4), {
            "sourceCount": len(sources),
            "baseScore": round(weighted_base_score, 4),
            "agreementBonus": round(agreement_bonus, 4),
            "fieldAgreement": field_agreement,
            "conflictDetected": len(conflict_fields) > 0
        }, conflict_fields

# --- Route Distribution Logic ---

def determine_distribution_path(status: VerificationStatus, confidence: float) -> str:
    """Determine which distribution path to use based on verification status"""
    if status == VerificationStatus.ACCEPTED:
        if confidence >= 0.95:
            return "PATH_B_LEGACY"  # High confidence → truth layer
        else:
            return "BOTH"  # Moderate high confidence → both paths
    elif status == VerificationStatus.FLAGGED:
        return "PATH_A_LIVE"  # Low confidence → live path only
    else:
        return "NONE"  # Rejected → no distribution

# --- Middleware Classes ---

class RequestIDMiddleware:
    """Add X-Request-ID header for distributed tracing"""
    def __init__(self, app):
        self.app = app

    async def __call__(self, request: Request, call_next):
        # Get or generate request ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        # Log with request ID
        logger.info(f"[{request_id}] {request.method} {request.url.path}")

        # Add to response headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

# --- Database Connection Retry ---

async def initialize_database_with_retry(max_retries: int = 3):
    """Initialize database with exponential backoff retry"""
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables initialized successfully")
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 1, 2, 4 seconds
                logger.warning(f"Database connection failed (attempt {attempt + 1}/{max_retries}). Retrying in {wait_time}s: {e}")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Database initialization failed after {max_retries} attempts: {e}")
                raise

# --- FastAPI Lifespan Context Manager ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern FastAPI lifespan context manager (replaces deprecated @app.on_event)"""
    # Startup
    logger.info("TeneT Verification Service starting...")
    try:
        await initialize_database_with_retry(max_retries=3)
        logger.info("Service startup complete")
    except Exception as e:
        logger.error(f"Service startup failed: {e}")
        raise

    yield  # Service running

    # Shutdown
    logger.info("TeneT Verification Service shutting down...")
    try:
        await engine.dispose()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

# --- FastAPI App ---

app = FastAPI(
    title="TeneT Verification Service",
    description="NJZ eSports TeneT Key.Links data verification bridge",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(RequestIDMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting configuration
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from fastapi.responses import JSONResponse

    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        """Handle rate limit exceeded"""
        request_id = getattr(request.state, "request_id", "unknown")
        logger.warning(f"[{request_id}] Rate limit exceeded: {exc.detail}")
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests", "detail": exc.detail},
            headers={"Retry-After": "60"}
        )

    def rate_limit(limit_string: str):
        """Apply slowapi rate limiting decorator"""
        return limiter.limit(limit_string)

except ImportError:
    logger.warning("slowapi not installed. Rate limiting disabled. Install with: pip install slowapi")
    limiter = None

    def rate_limit(_limit_string: str):  # type: ignore[misc]
        """No-op rate limiter when slowapi is not installed"""
        def decorator(func):  # type: ignore[misc]
            return func
        return decorator

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "tenet-verification",
        "version": settings.APP_VERSION
    }

@app.post("/v1/verify", response_model=VerificationResult)
@rate_limit("100/minute")
async def verify_entity(request: VerificationRequest, http_request: Request):
    """
    Submit data for verification and get confidence score + routing decision.

    Rate limit: 100 requests per minute
    """
    request_id = getattr(http_request.state, "request_id", "unknown")
    logger.info(f"[{request_id}] Verifying {request.entity_type} {request.entity_id} for game {request.game}")

    # Calculate confidence
    confidence_val, breakdown, conflict_fields = ConfidenceCalculator.calculate_confidence(request.sources)

    # Determine status
    if confidence_val >= settings.CONFIDENCE_THRESHOLD_AUTO_ACCEPT:
        status = VerificationStatus.ACCEPTED
    elif confidence_val >= settings.CONFIDENCE_THRESHOLD_FLAG:
        status = VerificationStatus.FLAGGED
    else:
        status = VerificationStatus.REJECTED

    # Determine distribution path
    distribution_path = determine_distribution_path(status, confidence_val)

    # Build confidence object
    confidence_obj = ConfidenceScore(
        value=confidence_val,
        source_count=len(request.sources),
        by_source=[
            ConfidenceSourceContribution(
                source_type=s.source_type,
                trust_level=s.trust_level,
                weight=s.weight,
                source_confidence=min(confidence_val, 1.0),
                ingested_at=s.captured_at
            ) for s in request.sources
        ],
        has_conflicts=len(conflict_fields) > 0,
        conflict_fields=conflict_fields,
        computed_at=datetime.utcnow()
    )

    # Store to database
    verification_id = f"{request.entity_id}_{request.game}_{datetime.utcnow().timestamp()}"
    async with AsyncSessionLocal() as session:
        # Create verification record
        verification = VerificationRecord(
            id=verification_id,
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            game=request.game,
            status=status,
            confidence_value=confidence_val,
            confidence_breakdown=breakdown,
            conflict_fields=conflict_fields or None,
            has_conflicts=len(conflict_fields) > 0,
            distribution_path=distribution_path,
            verified_at=datetime.utcnow()
        )
        session.add(verification)

        # Create source contribution records
        for source in request.sources:
            contribution = DataSourceContribution(
                id=f"{verification_id}_{source.source_type}",
                verification_id=verification_id,
                source_type=source.source_type,
                trust_level=source.trust_level,
                weight=source.weight,
                source_confidence=confidence_val,
                ingested_at=source.captured_at
            )
            session.add(contribution)

        # If flagged, add to review queue
        if status == VerificationStatus.FLAGGED:
            reason = f"Confidence {confidence_val:.2f} between thresholds ({settings.CONFIDENCE_THRESHOLD_FLAG}-{settings.CONFIDENCE_THRESHOLD_AUTO_ACCEPT})"
            if conflict_fields:
                reason += f". Conflicts in: {', '.join(conflict_fields)}"

            review_item = ReviewQueue(
                id=f"review_{verification_id}",
                verification_id=verification_id,
                entity_id=request.entity_id,
                entity_type=request.entity_type,
                game=request.game,
                reason=reason,
                confidence_value=confidence_val,
                flagged_at=datetime.utcnow()
            )
            session.add(review_item)

        await session.commit()

    result = VerificationResult(
        entity_id=request.entity_id,
        status=status.value,
        confidence=confidence_obj,
        verified_at=datetime.utcnow(),
        distribution_path=distribution_path,
        metadata=breakdown
    )

    return result

@app.get("/v1/review-queue")
async def get_review_queue(
    game: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
) -> List[ReviewQueueItem]:
    """
    List entities in the manual review queue.
    Supports filtering by game and pagination.
    """
    async with AsyncSessionLocal() as session:
        query = select(ReviewQueue).where(ReviewQueue.review_decision.is_(None))

        if game:
            query = query.where(ReviewQueue.game == game)

        query = query.order_by(ReviewQueue.flagged_at.desc()).limit(limit).offset(offset)

        result = await session.execute(query)
        items = result.scalars().all()

        return [
            ReviewQueueItem(
                entity_id=item.entity_id,
                entity_type=item.entity_type,
                game=item.game,
                confidence_value=item.confidence_value,
                reason=item.reason,
                flagged_at=item.flagged_at
            )
            for item in items
        ]

@app.post("/v1/review/{entity_id}")
async def submit_manual_review(
    entity_id: str = FastAPIPath(...),
    review: Optional[ManualReviewSubmission] = None
) -> VerificationResult:
    """
    Submit a manual review decision for a flagged entity.
    Updates the verification record and review queue.
    """
    if review is None:
        raise HTTPException(status_code=400, detail="Review body required")

    async with AsyncSessionLocal() as session:
        # Find the most recent verification for this entity
        query = select(VerificationRecord).where(
            VerificationRecord.entity_id == entity_id
        ).order_by(VerificationRecord.created_at.desc())

        result = await session.execute(query)
        verification = result.scalars().first()

        if not verification:
            raise HTTPException(status_code=404, detail=f"No verification found for {entity_id}")

        # Update review queue
        review_query = select(ReviewQueue).where(
            ReviewQueue.verification_id == verification.id
        )
        review_result = await session.execute(review_query)
        review_item = review_result.scalars().first()

        if review_item:
            review_item.reviewer_id = review.reviewer_id
            review_item.review_decision = review.decision
            review_item.review_notes = review.notes
            review_item.reviewed_at = datetime.utcnow()

        # Update verification status if needed
        if review.decision == "ACCEPT":
            verification.status = VerificationStatus.MANUAL_OVERRIDE
            verification.distribution_path = determine_distribution_path(
                VerificationStatus.ACCEPTED, verification.confidence_value
            )
        elif review.decision == "REJECT":
            verification.status = VerificationStatus.REJECTED
            verification.distribution_path = "NONE"

        await session.commit()

        # Return updated verification
        confidence_breakdown = verification.confidence_breakdown or {}
        return VerificationResult(
            entity_id=verification.entity_id,
            status=verification.status.value,
            confidence=ConfidenceScore(
                value=verification.confidence_value,
                source_count=confidence_breakdown.get("sourceCount", 0),
                by_source=[],
                has_conflicts=verification.has_conflicts,
                conflict_fields=verification.conflict_fields or [],
                computed_at=verification.verified_at
            ),
            verified_at=verification.verified_at,
            distribution_path=verification.distribution_path,
            metadata=confidence_breakdown
        )

@app.get("/v1/status/{entity_id}")
async def get_verification_status(
    entity_id: str = FastAPIPath(...)
) -> Optional[VerificationResult]:
    """Check the verification status of an entity"""
    async with AsyncSessionLocal() as session:
        query = select(VerificationRecord).where(
            VerificationRecord.entity_id == entity_id
        ).order_by(VerificationRecord.created_at.desc())

        result = await session.execute(query)
        verification = result.scalars().first()

        if not verification:
            raise HTTPException(status_code=404, detail=f"No verification found for {entity_id}")

        confidence_breakdown = verification.confidence_breakdown or {}
        return VerificationResult(
            entity_id=verification.entity_id,
            status=verification.status.value,
            confidence=ConfidenceScore(
                value=verification.confidence_value,
                source_count=confidence_breakdown.get("sourceCount", 0),
                by_source=[],
                has_conflicts=verification.has_conflicts,
                conflict_fields=verification.conflict_fields or [],
                computed_at=verification.verified_at
            ),
            verified_at=verification.verified_at,
            distribution_path=verification.distribution_path,
            metadata=confidence_breakdown
        )

@app.get("/ready")
async def ready():
    """Readiness check — verifies database connectivity"""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(select(1))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {"status": "not_ready", "database": "disconnected", "error": str(e)}
