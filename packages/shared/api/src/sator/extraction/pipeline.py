"""
Module: sator.extraction.pipeline
Purpose: FFmpeg + OpenCV frame extraction pipeline
Task: MF-2 - FFmpeg + OpenCV Extraction Pipeline
Date: 2026-03-28

[Ver001.000] - Initial extraction pipeline implementation
"""

import asyncio
import hashlib
import json
import logging
import os
import shutil
from pathlib import Path
from typing import Callable, Optional
from uuid import UUID

import cv2
import numpy as np

from .models import FrameExtract, VODMetadata

logger = logging.getLogger(__name__)


class ExtractionError(Exception):
    """Exception raised during frame extraction."""
    
    def __init__(self, message: str, code: str = "EXTRACTION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ExtractionPipeline:
    """
    Extracts minimap frames from Valorant VODs using FFmpeg and OpenCV.
    
    This pipeline handles:
    1. VOD metadata extraction via ffprobe
    2. Minimap region detection
    3. Frame extraction at specified FPS
    4. Image deduplication via content hashing
    
    Attributes:
        vod_path: Path to the VOD file
        output_dir: Directory to save extracted frames
        minimap_bbox: Normalized coordinates (x1, y1, x2, y2) for minimap region
        job_id: Optional extraction job ID for progress tracking
    """
    
    def __init__(
        self,
        vod_path: str,
        output_dir: str,
        job_id: Optional[UUID] = None,
        minimap_bbox: Optional[tuple[float, float, float, float]] = None,
    ):
        self.vod_path = vod_path
        self.output_dir = output_dir
        self.job_id = str(job_id) if job_id else None
        # Default minimap bbox: bottom-right corner, normalized coords
        self.minimap_bbox = minimap_bbox or (0.7, 0.7, 0.98, 0.98)
        
        # Ensure output directory exists
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
        
        # Verify VOD exists
        if not os.path.exists(vod_path):
            raise ExtractionError(f"VOD file not found: {vod_path}", "VOD_NOT_FOUND")
    
    async def extract_metadata(self) -> VODMetadata:
        """
        Extract VOD metadata using ffprobe.
        
        Returns:
            VODMetadata with duration, fps, resolution, and codec info
            
        Raises:
            ExtractionError: If ffprobe fails or returns invalid data
        """
        ffprobe_cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration,bit_rate,format_name",
            "-show_entries", "stream=codec_name,r_frame_rate,width,height",
            "-of", "json",
            self.vod_path,
        ]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *ffprobe_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                raise ExtractionError(
                    f"ffprobe failed: {stderr.decode()}",
                    "FFPROBE_ERROR"
                )
            
            data = json.loads(stdout.decode())
            
            # Extract video stream info (first video stream)
            video_stream = None
            for stream in data.get("streams", []):
                if stream.get("codec_type") == "video":
                    video_stream = stream
                    break
            
            if not video_stream:
                raise ExtractionError("No video stream found in VOD", "NO_VIDEO_STREAM")
            
            # Parse fps from fraction string (e.g., "60/1" or "30000/1001")
            fps_str = video_stream.get("r_frame_rate", "30/1")
            if "/" in fps_str:
                num, den = map(float, fps_str.split("/"))
                fps = num / den if den != 0 else 30.0
            else:
                fps = float(fps_str)
            
            # Parse duration
            duration_sec = float(data.get("format", {}).get("duration", 0))
            duration_ms = int(duration_sec * 1000)
            
            # Parse bitrate
            bitrate_str = data.get("format", {}).get("bit_rate")
            bitrate = int(bitrate_str) if bitrate_str else None
            
            return VODMetadata(
                duration_ms=duration_ms,
                fps=fps,
                width=int(video_stream.get("width", 0)),
                height=int(video_stream.get("height", 0)),
                codec=video_stream.get("codec_name", "unknown"),
                bitrate=bitrate,
                format_name=data.get("format", {}).get("format_name"),
            )
            
        except asyncio.TimeoutError:
            raise ExtractionError("ffprobe timed out", "FFPROBE_TIMEOUT")
        except json.JSONDecodeError as e:
            raise ExtractionError(f"Failed to parse ffprobe output: {e}", "FFPROBE_PARSE_ERROR")
        except Exception as e:
            raise ExtractionError(f"Metadata extraction failed: {e}", "METADATA_ERROR")
    
    async def extract_frames(
        self,
        fps: int = 1,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> list[FrameExtract]:
        """
        Extract minimap frames at specified fps.
        
        Args:
            fps: Frames per second to extract (default: 1)
            progress_callback: Optional callback(current, total) for progress updates
            
        Returns:
            List of FrameExtract objects with metadata
            
        Raises:
            ExtractionError: If frame extraction fails
        """
        # Run OpenCV operations in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._extract_frames_sync, fps, progress_callback
        )
    
    def _extract_frames_sync(
        self,
        fps: int,
        progress_callback: Optional[Callable[[int, int], None]],
    ) -> list[FrameExtract]:
        """Synchronous frame extraction (runs in thread pool)."""
        frames: list[FrameExtract] = []
        
        cap = cv2.VideoCapture(self.vod_path)
        if not cap.isOpened():
            raise ExtractionError(f"Failed to open VOD: {self.vod_path}", "OPEN_ERROR")
        
        try:
            # Get video properties
            video_fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_interval = int(video_fps / fps) if video_fps > 0 else 30
            
            frame_idx = 0
            extract_idx = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Extract frame at specified interval
                if frame_idx % frame_interval == 0:
                    timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
                    
                    # Extract minimap region
                    minimap = self._extract_minimap_region(frame)
                    
                    # Compute hash for deduplication
                    image_hash = self._compute_frame_hash(minimap)
                    
                    # Save frame
                    output_path = os.path.join(
                        self.output_dir,
                        f"frame_{extract_idx:06d}_{timestamp_ms}.jpg"
                    )
                    cv2.imwrite(output_path, minimap, [cv2.IMWRITE_JPEG_QUALITY, 95])
                    
                    frame_extract = FrameExtract(
                        frame_index=extract_idx,
                        timestamp_ms=timestamp_ms,
                        file_path=output_path,
                        image_hash=image_hash,
                        width=minimap.shape[1],
                        height=minimap.shape[0],
                    )
                    frames.append(frame_extract)
                    extract_idx += 1
                    
                    # Progress callback
                    if progress_callback and extract_idx % 10 == 0:
                        progress_callback(extract_idx, total_frames // frame_interval)
                
                frame_idx += 1
            
            # Final progress update
            if progress_callback:
                progress_callback(extract_idx, extract_idx)
            
            logger.info(f"Extracted {len(frames)} frames from {self.vod_path}")
            return frames
            
        finally:
            cap.release()
    
    def _extract_minimap_region(self, frame: np.ndarray) -> np.ndarray:
        """
        Extract minimap region from full frame.
        
        Args:
            frame: Full video frame (BGR format from OpenCV)
            
        Returns:
            Cropped minimap region
        """
        height, width = frame.shape[:2]
        
        # Convert normalized bbox to pixel coordinates
        x1 = int(self.minimap_bbox[0] * width)
        y1 = int(self.minimap_bbox[1] * height)
        x2 = int(self.minimap_bbox[2] * width)
        y2 = int(self.minimap_bbox[3] * height)
        
        # Ensure bounds
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(width, x2), min(height, y2)
        
        return frame[y1:y2, x1:x2]
    
    def _compute_frame_hash(self, frame: np.ndarray) -> str:
        """
        Compute SHA-256 hash of frame for deduplication.
        
        Args:
            frame: Image frame (numpy array)
            
        Returns:
            Hex-encoded SHA-256 hash
        """
        # Encode frame to JPEG bytes for consistent hashing
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return hashlib.sha256(buffer.tobytes()).hexdigest()
    
    async def detect_minimap_region(self, sample_frame: Optional[np.ndarray] = None) -> tuple:
        """
        Detect minimap region in VOD frame.
        
        Phase 1: Returns fixed bbox. Future implementation will use ML-based detection
        to locate the minimap dynamically.
        
        Args:
            sample_frame: Optional sample frame to analyze (unused in Phase 1)
            
        Returns:
            Tuple of (x1, y1, x2, y2) normalized coordinates
        """
        # Phase 1: Use fixed bbox for Valorant minimap (bottom-right corner)
        # Future: Implement ML-based detection using cv2.matchTemplate or YOLO
        return self.minimap_bbox
    
    async def cleanup(self) -> None:
        """
        Clean up extracted frames from output directory.
        
        Use this after frames have been uploaded to archival storage.
        """
        if os.path.exists(self.output_dir):
            shutil.rmtree(self.output_dir)
            logger.info(f"Cleaned up output directory: {self.output_dir}")


def check_ffmpeg() -> bool:
    """
    Check if FFmpeg and ffprobe are available in PATH.
    
    Returns:
        True if both tools are available
    """
    return shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None
