"""
Verification & Data Integrity Module

Integrates with TeneT verification service for:
- Match data verification
- Confidence scoring
- Manual review queue
- Decision tracking

[Ver001.000]
"""

from .routes import router
from .tenet_integration import (
    TeneTPClient,
    VerificationRecord,
    VerificationResult,
    VerificationSource,
    ConfidenceLevel,
    verify_match_data,
    batch_verify_matches,
    get_tenet_client,
    close_tenet_client,
)

__all__ = [
    "router",
    "TeneTPClient",
    "VerificationRecord",
    "VerificationResult",
    "VerificationSource",
    "ConfidenceLevel",
    "verify_match_data",
    "batch_verify_matches",
    "get_tenet_client",
    "close_tenet_client",
]
