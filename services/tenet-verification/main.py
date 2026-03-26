import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings

# --- Configuration ---

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres")
    CONFIDENCE_THRESHOLD_AUTO_ACCEPT: float = 0.90
    CONFIDENCE_THRESHOLD_FLAG: float = 0.70
    APP_VERSION: str = "0.1.0"

settings = Settings()

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tenet-verification")

# --- Models ---

class TenetBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )

class DataSource(TenetBaseModel):
    source_type: str = Field(alias="sourceType")  # api, video, manual, scraper
    trust_level: str = Field(alias="trustLevel")  # HIGH, MEDIUM, LOW
    weight: float
    data: Dict[str, Any]
    captured_at: datetime = Field(alias="capturedAt")

class VerificationRequest(TenetBaseModel):
    entity_id: str = Field(alias="entityId")
    entity_type: str = Field(alias="entityType")  # match, player_stat, team_info
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
    status: str  # ACCEPTED, FLAGGED, REJECTED
    confidence: ConfidenceScore
    verified_at: datetime = Field(alias="verifiedAt")
    metadata: Dict[str, Any]

# --- Core Logic ---

def calculate_consensus(sources: List[DataSource]) -> tuple[float, Dict[str, Any]]:
    """
    Enhanced weighted consensus algorithm with field-level agreement bonus.
    """
    if not sources:
        return 0.0, {"error": "No sources provided"}

    total_weight = sum(s.weight for s in sources)
    weighted_base_score = 0.0
    agreement_bonus = 0.0
    
    # Trust-based baseline
    for source in sources:
        trust_multiplier = {
            "HIGH": 1.0,
            "MEDIUM": 0.7,
            "LOW": 0.4
        }.get(source.trust_level, 0.1)
        
        weighted_base_score += (source.weight / total_weight) * trust_multiplier

    # Field-level agreement check (Example: final_score)
    # In a production system, this would iterate through all critical fields
    scores = []
    for s in sources:
        score = s.data.get("final_score")
        if score:
            scores.append(json.dumps(score, sort_keys=True))
    
    if len(scores) > 1:
        # Check if all sources with score data agree
        unique_scores = set(scores)
        if len(unique_scores) == 1:
            agreement_bonus = 0.15 # 15% bonus for consensus on score
        elif len(unique_scores) < len(scores):
            agreement_bonus = 0.05 # Partial consensus bonus
            
    final_score = min(1.0, weighted_base_score + agreement_bonus)

    return round(final_score, 4), {
        "sourceCount": len(sources),
        "baseScore": round(weighted_base_score, 4),
        "agreementBonus": agreement_bonus,
        "hasConsensus": len(set(scores)) == 1 if scores else False
    }

# --- FastAPI App ---

app = FastAPI(
    title="TeneT Verification Service",
    description="NJZ eSports TeneT Key.Links data verification bridge",
    version=settings.APP_VERSION,
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "tenet-verification", "version": settings.APP_VERSION}

@app.post("/v1/verify", response_model=VerificationResult)
async def verify_entity(request: VerificationRequest):
    logger.info(f"Verifying {request.entity_type} {request.entity_id} for game {request.game}")
    
    confidence_val, meta = calculate_consensus(request.sources)
    
    status = "REJECTED"
    if confidence_val >= settings.CONFIDENCE_THRESHOLD_AUTO_ACCEPT:
        status = "ACCEPTED"
    elif confidence_val >= settings.CONFIDENCE_THRESHOLD_FLAG:
        status = "FLAGGED"
        
    confidence_obj = ConfidenceScore(
        value=confidence_val,
        source_count=len(request.sources),
        by_source=[
            ConfidenceSourceContribution(
                source_type=s.source_type,
                trust_level=s.trust_level,
                weight=s.weight,
                source_confidence=0.9, # Placeholder per-source confidence
                ingested_at=s.captured_at
            ) for s in request.sources
        ],
        has_conflicts=not meta["hasConsensus"],
        conflict_fields=["final_score"] if not meta["hasConsensus"] else [],
        computed_at=datetime.utcnow()
    )

    result = VerificationResult(
        entity_id=request.entity_id,
        status=status,
        confidence=confidence_obj,
        verified_at=datetime.utcnow(),
        metadata=meta
    )
    
    return result

@app.get("/ready")
async def ready():
    # Check DB connectivity here
    return {"status": "ready"}
