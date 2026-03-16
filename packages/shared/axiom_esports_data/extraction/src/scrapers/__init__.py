"""
Scrapers module — VLR.gg data extraction with ethical rate limiting.
"""
from extraction.src.scrapers.vlr_client import VLRClient
from extraction.src.scrapers.vlr_resilient_client import ResilientVLRClient, CircuitBreaker, ValidatedResponse
from extraction.src.scrapers.epoch_harvester import EpochHarvester, EPOCHS
from extraction.src.scrapers.validation_crossref import ValidationCrossRef

__all__ = [
    "VLRClient",
    "ResilientVLRClient",
    "CircuitBreaker",
    "ValidatedResponse",
    "EpochHarvester",
    "EPOCHS",
    "ValidationCrossRef",
]
