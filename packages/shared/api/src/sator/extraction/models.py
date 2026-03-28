"""
Module: sator.extraction.models
Purpose: Data models for frame extraction pipeline
Task: MF-2 - FFmpeg + OpenCV Extraction Pipeline
Date: 2026-03-28

[Ver001.000] - Initial models for frame extraction
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class FrameExtract:
    """
    Represents a single extracted minimap frame.
    
    Attributes:
        frame_index: Sequential frame number (0-based)
        timestamp_ms: Timestamp in the VOD in milliseconds
        file_path: Path to the extracted JPEG file
        image_hash: SHA-256 hash of JPEG bytes for deduplication
        width: Frame width in pixels
        height: Frame height in pixels
    """
    frame_index: int
    timestamp_ms: int
    file_path: str
    image_hash: str
    width: Optional[int] = None
    height: Optional[int] = None


@dataclass
class VODMetadata:
    """
    Video metadata extracted via ffprobe.
    
    Attributes:
        duration_ms: Total video duration in milliseconds
        fps: Frames per second
        width: Video width in pixels
        height: Video height in pixels
        codec: Video codec (e.g., 'h264', 'hevc')
        bitrate: Video bitrate in bits per second
        format_name: Container format (e.g., 'mp4', 'mkv')
    """
    duration_ms: int
    fps: float
    width: int
    height: int
    codec: str
    bitrate: Optional[int] = None
    format_name: Optional[str] = None


@dataclass
class ExtractionProgress:
    """
    Progress update during frame extraction.
    
    Attributes:
        job_id: Extraction job identifier
        frames_extracted: Number of frames extracted so far
        total_frames: Total expected frames
        current_timestamp_ms: Current position in VOD
        status: Current extraction status message
    """
    job_id: str
    frames_extracted: int
    total_frames: int
    current_timestamp_ms: int
    status: str
