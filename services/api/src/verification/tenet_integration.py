"""
TeneT Verification Integration — Path B Legacy Pipeline

Integrates with TeneT verification service for data verification and confidence scoring.
Routes flagged items to review queue.

[Ver001.000]
"""

import os
import logging
import httpx
import asyncio
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

logger = logging.getLogger("tenet-integration")

# --- Configuration ---

TENET_SERVICE_URL = os.getenv("TENET_SERVICE_URL", "http://localhost:8001")
TENET_TIMEOUT = float(os.getenv("TENET_TIMEOUT", "10.0"))
TENET_RETRY_ATTEMPTS = int(os.getenv("TENET_RETRY_ATTEMPTS", "3"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.85"))

# --- Models ---

class VerificationSource(str, Enum):
    PANDASCORE = "pandascore"
    VLR = "vlr"
    LIQUIDPEDIA = "liquidpedia"
    MANUAL = "manual"

class ConfidenceLevel(str, Enum):
    TRUSTED = "trusted"      # >= 0.95
    HIGH = "high"            # >= 0.85
    MEDIUM = "medium"        # >= 0.70
    LOW = "low"              # >= 0.50
    FLAGGED = "flagged"      # < 0.50

class VerificationRecord(BaseModel):
    """Data submitted for verification"""
    source: VerificationSource
    data_type: str  # "match", "player", "team", "result"
    game: str       # "valorant", "cs2"
    entity_id: str  # match_id, player_id, team_id

    payload: Dict[str, Any]
    timestamp: int  # Unix milliseconds

    # Verification metadata
    verified: bool = False
    confidence: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.FLAGGED
    verification_notes: Optional[str] = None

class VerificationResult(BaseModel):
    """Result from TeneT verification service"""
    record_id: str
    verified: bool
    confidence: float
    confidence_level: ConfidenceLevel
    issues: List[str] = Field(default_factory=list)
    recommendations: Optional[str] = None
    requires_review: bool  # True if confidence < CONFIDENCE_THRESHOLD
    reviewed_at: Optional[int] = None
    review_notes: Optional[str] = None

# --- Client ---

class TeneTPClient:
    """Client for TeneT Verification Service"""

    def __init__(self, base_url: str = TENET_SERVICE_URL, timeout: float = TENET_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout
        self.client: Optional[httpx.AsyncClient] = None

    async def connect(self):
        """Establish connection to TeneT service"""
        try:
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout
            )
            await self.health_check()
            logger.info(f"Connected to TeneT service at {self.base_url}")
        except Exception as e:
            logger.error(f"Failed to connect to TeneT service: {e}")
            raise

    async def close(self):
        """Close TeneT service connection"""
        if self.client:
            await self.client.aclose()
            logger.info("Closed TeneT service connection")

    async def health_check(self) -> bool:
        """Verify TeneT service is healthy"""
        try:
            response = await self.client.get("/health")
            response.raise_for_status()
            logger.info("TeneT service health check passed")
            return True
        except Exception as e:
            logger.error(f"TeneT service health check failed: {e}")
            return False

    async def verify_data(
        self,
        record: VerificationRecord,
        retry_count: int = 0
    ) -> Tuple[Optional[VerificationResult], Optional[str]]:
        """
        Submit data to TeneT for verification.

        Returns: (result, error_message)
        """
        try:
            payload = {
                "source": record.source.value,
                "data_type": record.data_type,
                "game": record.game,
                "entity_id": record.entity_id,
                "payload": record.payload,
                "timestamp": record.timestamp,
            }

            response = await self.client.post(
                "/v1/verify",
                json=payload
            )

            if response.status_code == 429:  # Rate limited
                if retry_count < TENET_RETRY_ATTEMPTS:
                    wait_time = 2 ** retry_count  # Exponential backoff
                    logger.warning(f"Rate limited, retrying after {wait_time}s")
                    await asyncio.sleep(wait_time)
                    return await self.verify_data(record, retry_count + 1)
                else:
                    return None, "Rate limited - max retries exceeded"

            response.raise_for_status()

            data = response.json()

            # Determine confidence level
            confidence = data.get("confidence", 0.0)
            if confidence >= 0.95:
                conf_level = ConfidenceLevel.TRUSTED
            elif confidence >= 0.85:
                conf_level = ConfidenceLevel.HIGH
            elif confidence >= 0.70:
                conf_level = ConfidenceLevel.MEDIUM
            elif confidence >= 0.50:
                conf_level = ConfidenceLevel.LOW
            else:
                conf_level = ConfidenceLevel.FLAGGED

            result = VerificationResult(
                record_id=data.get("record_id", record.entity_id),
                verified=data.get("verified", False),
                confidence=confidence,
                confidence_level=conf_level,
                issues=data.get("issues", []),
                recommendations=data.get("recommendations"),
                requires_review=confidence < CONFIDENCE_THRESHOLD,
            )

            return result, None

        except httpx.HTTPError as e:
            logger.error(f"TeneT verification error: {e}")
            return None, str(e)
        except Exception as e:
            logger.exception(f"Unexpected error during verification: {e}")
            return None, str(e)

    async def get_review_queue(self) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
        """Get items flagged for manual review"""
        try:
            response = await self.client.get("/v1/review-queue")
            response.raise_for_status()

            data = response.json()
            return data.get("items", []), None

        except Exception as e:
            logger.error(f"Failed to fetch review queue: {e}")
            return None, str(e)

    async def submit_review_decision(
        self,
        record_id: str,
        decision: str,  # "approve", "reject", "needs_more_data"
        notes: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """Submit manual review decision"""
        try:
            payload = {
                "decision": decision,
                "notes": notes,
                "reviewed_at": int(datetime.now(timezone.utc).timestamp() * 1000)
            }

            response = await self.client.post(
                f"/v1/review-queue/{record_id}/decide",
                json=payload
            )

            response.raise_for_status()
            logger.info(f"Review decision submitted for {record_id}: {decision}")
            return True, None

        except Exception as e:
            logger.error(f"Failed to submit review decision: {e}")
            return False, str(e)

# --- Singleton Instance ---

_tenet_client: Optional[TeneTPClient] = None

async def get_tenet_client() -> TeneTPClient:
    """Get or create TeneT client (singleton)"""
    global _tenet_client
    if _tenet_client is None:
        _tenet_client = TeneTPClient()
        await _tenet_client.connect()
    return _tenet_client

async def close_tenet_client():
    """Close TeneT client connection"""
    global _tenet_client
    if _tenet_client:
        await _tenet_client.close()
        _tenet_client = None

# --- High-Level Verification Pipeline ---

async def verify_match_data(
    source: VerificationSource,
    game: str,
    match_id: str,
    payload: Dict[str, Any]
) -> Tuple[Optional[VerificationResult], Optional[str]]:
    """Verify match data through TeneT pipeline"""
    try:
        client = await get_tenet_client()

        record = VerificationRecord(
            source=source,
            data_type="match",
            game=game,
            entity_id=match_id,
            payload=payload,
            timestamp=int(datetime.now(timezone.utc).timestamp() * 1000),
        )

        result, error = await client.verify_data(record)

        if error:
            logger.error(f"Verification failed for {match_id}: {error}")
            return None, error

        # Log if flagged for review
        if result.requires_review:
            logger.warning(f"Match {match_id} flagged for review (confidence: {result.confidence:.2f})")

        return result, None

    except Exception as e:
        logger.exception(f"Error in verify_match_data: {e}")
        return None, str(e)

async def batch_verify_matches(
    source: VerificationSource,
    game: str,
    matches: List[Tuple[str, Dict[str, Any]]]  # List of (match_id, payload) tuples
) -> Tuple[List[VerificationResult], int]:
    """Verify multiple matches in parallel"""
    try:
        tasks = [
            verify_match_data(source, game, match_id, payload)
            for match_id, payload in matches
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        verified_results = []
        flagged_count = 0

        for result in results:
            if isinstance(result, tuple):
                verification_result, error = result
                if verification_result:
                    verified_results.append(verification_result)
                    if verification_result.requires_review:
                        flagged_count += 1

        logger.info(f"Batch verification completed: {len(verified_results)} verified, {flagged_count} flagged")
        return verified_results, flagged_count

    except Exception as e:
        logger.exception(f"Error in batch_verify_matches: {e}")
        return [], 0
