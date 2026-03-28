"""
SATOR Minimap Extraction Module
==============================

Provides frame extraction pipeline for Valorant VODs:
- FFmpeg + OpenCV frame extraction
- Segment type classification
- Archival integration

Exports:
    ExtractionPipeline: Main extraction pipeline
    ExtractionService: Job management service
    SegmentClassifier: Frame classification
    FrameExtract: Extracted frame data model
"""

from .models import ExtractionProgress, FrameExtract, VODMetadata
from .pipeline import ExtractionError, ExtractionPipeline, check_ffmpeg
from .segment_classifier import ClassificationError, SegmentClassifier, SegmentType
from .service import ExtractionService, ExtractionServiceError

__all__ = [
    # Pipeline
    "ExtractionPipeline",
    "ExtractionError",
    "check_ffmpeg",
    # Service
    "ExtractionService",
    "ExtractionServiceError",
    # Classification
    "SegmentClassifier",
    "SegmentType",
    "ClassificationError",
    # Models
    "FrameExtract",
    "VODMetadata",
    "ExtractionProgress",
]
