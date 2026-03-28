"""
NJZiteGeisTe Platform - Archival System
========================================

Frame storage, deduplication, and audit trail for minimap extraction.

[Ver001.000] - Initial archival system implementation
"""

from .schemas.archive import (
    ArchiveAuditLogResponse,
    ErrorResponse,
    FrameQueryResponse,
    FrameUploadRequest,
    FrameUploadResponse,
    GCRequest,
    PinRequest,
    StorageMigrateRequest,
)
from .services.archival_service import ArchivalService
from .storage.backend import LocalBackend, StorageBackend, StorageError

__all__ = [
    # Schemas
    "FrameUploadRequest",
    "FrameUploadResponse",
    "FrameQueryResponse",
    "PinRequest",
    "GCRequest",
    "StorageMigrateRequest",
    "ErrorResponse",
    "ArchiveAuditLogResponse",
    # Services
    "ArchivalService",
    # Storage
    "StorageBackend",
    "LocalBackend",
    "StorageError",
]
