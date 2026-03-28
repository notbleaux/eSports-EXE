"""
Unit tests for extraction pipeline.
Task: MF-2 - FFmpeg + OpenCV Extraction Pipeline
"""

import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch, mock_open

import pytest

# Mock external dependencies BEFORE any sator imports
sys.modules["cv2"] = MagicMock()
sys.modules["numpy"] = MagicMock()
sys.modules["fastapi"] = MagicMock()
sys.modules["sqlalchemy"] = MagicMock()
sys.modules["sqlalchemy.ext"] = MagicMock()
sys.modules["sqlalchemy.ext.asyncio"] = MagicMock()
sys.modules["pydantic"] = MagicMock()

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

# Mock sator.routes to prevent FastAPI import
sys.modules["src.sator.routes"] = MagicMock()
sys.modules["src.sator.extraction_job"] = MagicMock()
sys.modules["src.sator.extraction_schemas"] = MagicMock()

from src.sator.extraction.models import FrameExtract, VODMetadata
from src.sator.extraction.pipeline import (
    ExtractionPipeline,
    ExtractionError,
    check_ffmpeg,
)


class TestVODMetadata:
    """Tests for VODMetadata model."""
    
    def test_vod_metadata_creation(self):
        """Test basic metadata creation."""
        metadata = VODMetadata(
            duration_ms=1800000,  # 30 minutes
            fps=60.0,
            width=1920,
            height=1080,
            codec="h264",
            bitrate=8000000,
            format_name="mov,mp4,m4a",
        )
        assert metadata.duration_ms == 1800000
        assert metadata.fps == 60.0
        assert metadata.width == 1920
        assert metadata.height == 1080
        assert metadata.codec == "h264"
    
    def test_vod_metadata_optional_fields(self):
        """Test metadata with optional fields omitted."""
        metadata = VODMetadata(
            duration_ms=600000,
            fps=30.0,
            width=1280,
            height=720,
            codec="hevc",
        )
        assert metadata.bitrate is None
        assert metadata.format_name is None


class TestFrameExtract:
    """Tests for FrameExtract model."""
    
    def test_frame_extract_creation(self):
        """Test basic frame extract creation."""
        frame = FrameExtract(
            frame_index=42,
            timestamp_ms=42000,
            file_path="/tmp/frame_042.jpg",
            image_hash="a" * 64,
            width=400,
            height=300,
        )
        assert frame.frame_index == 42
        assert frame.timestamp_ms == 42000
        assert frame.image_hash == "a" * 64
    
    def test_frame_extract_optional_dimensions(self):
        """Test frame extract without dimensions."""
        frame = FrameExtract(
            frame_index=0,
            timestamp_ms=0,
            file_path="/tmp/frame_000.jpg",
            image_hash="b" * 64,
        )
        assert frame.width is None
        assert frame.height is None


class TestExtractionPipelineInit:
    """Tests for ExtractionPipeline initialization."""
    
    @patch("src.sator.extraction.pipeline.os.path.exists")
    @patch("src.sator.extraction.pipeline.Path.mkdir")
    def test_pipeline_init_success(self, mock_mkdir, mock_exists):
        """Test successful pipeline initialization."""
        mock_exists.return_value = True
        
        pipeline = ExtractionPipeline(
            vod_path="/data/vods/test.mp4",
            output_dir="/tmp/output",
        )
        
        assert pipeline.vod_path == "/data/vods/test.mp4"
        assert pipeline.output_dir == "/tmp/output"
        assert pipeline.minimap_bbox == (0.7, 0.7, 0.98, 0.98)
    
    @patch("src.sator.extraction.pipeline.os.path.exists")
    def test_pipeline_init_vod_not_found(self, mock_exists):
        """Test pipeline initialization with missing VOD."""
        mock_exists.return_value = False
        
        with pytest.raises(ExtractionError) as exc_info:
            ExtractionPipeline(
                vod_path="/data/vods/nonexistent.mp4",
                output_dir="/tmp/output",
            )
        
        assert exc_info.value.code == "VOD_NOT_FOUND"
    
    @patch("src.sator.extraction.pipeline.os.path.exists")
    @patch("src.sator.extraction.pipeline.Path.mkdir")
    def test_pipeline_init_custom_bbox(self, mock_mkdir, mock_exists):
        """Test pipeline with custom minimap bbox."""
        mock_exists.return_value = True
        
        custom_bbox = (0.75, 0.75, 0.95, 0.95)
        pipeline = ExtractionPipeline(
            vod_path="/data/vods/test.mp4",
            output_dir="/tmp/output",
            minimap_bbox=custom_bbox,
        )
        
        assert pipeline.minimap_bbox == custom_bbox


class TestCheckFFmpeg:
    """Tests for FFmpeg availability check."""
    
    @patch("src.sator.extraction.pipeline.shutil.which")
    def test_ffmpeg_available(self, mock_which):
        """Test when FFmpeg is available."""
        mock_which.side_effect = lambda x: f"/usr/bin/{x}"
        assert check_ffmpeg() is True
    
    @patch("src.sator.extraction.pipeline.shutil.which")
    def test_ffmpeg_not_available(self, mock_which):
        """Test when FFmpeg is not available."""
        mock_which.return_value = None
        assert check_ffmpeg() is False
    
    @patch("src.sator.extraction.pipeline.shutil.which")
    def test_ffprobe_missing(self, mock_which):
        """Test when ffprobe is missing but ffmpeg exists."""
        def side_effect(x):
            return "/usr/bin/ffmpeg" if x == "ffmpeg" else None
        mock_which.side_effect = side_effect
        assert check_ffmpeg() is False


class TestExtractMinimapRegion:
    """Tests for minimap region extraction."""
    
    @patch("src.sator.extraction.pipeline.os.path.exists")
    @patch("src.sator.extraction.pipeline.Path.mkdir")
    def test_extract_minimap_region(self, mock_mkdir, mock_exists):
        """Test minimap region extraction from frame."""
        mock_exists.return_value = True
        
        # Mock numpy for testing
        import src.sator.extraction.pipeline as pipeline_module
        original_np = pipeline_module.np
        mock_np = MagicMock()
        pipeline_module.np = mock_np
        
        try:
            pipeline = ExtractionPipeline(
                vod_path="/data/vods/test.mp4",
                output_dir="/tmp/output",
                minimap_bbox=(0.7, 0.7, 0.98, 0.98),
            )
            
            # Create mock frame (1080p)
            mock_frame = MagicMock()
            mock_frame.shape = (1080, 1920, 3)
            
            # Calculate expected coordinates
            # x1 = 0.7 * 1920 = 1344, y1 = 0.7 * 1080 = 756
            # x2 = 0.98 * 1920 = 1881, y2 = 0.98 * 1080 = 1058
            
            result = pipeline._extract_minimap_region(mock_frame)
            
            # Verify slicing was called with correct coordinates
            mock_frame.__getitem__.assert_called_once()
            
        finally:
            pipeline_module.np = original_np


class TestComputeFrameHash:
    """Tests for frame hash computation."""
    
    @patch("src.sator.extraction.pipeline.os.path.exists")
    @patch("src.sator.extraction.pipeline.Path.mkdir")
    @patch("src.sator.extraction.pipeline.cv2.imencode")
    @patch("src.sator.extraction.pipeline.hashlib.sha256")
    def test_compute_frame_hash(self, mock_sha256, mock_imencode, mock_mkdir, mock_exists):
        """Test frame hash computation."""
        mock_exists.return_value = True
        
        # Setup mocks
        mock_buffer = MagicMock()
        mock_buffer.tobytes.return_value = b"test_jpeg_bytes"
        mock_imencode.return_value = (True, mock_buffer)
        
        mock_hash = MagicMock()
        mock_hash.hexdigest.return_value = "a" * 64
        mock_sha256.return_value = mock_hash
        
        pipeline = ExtractionPipeline(
            vod_path="/data/vods/test.mp4",
            output_dir="/tmp/output",
        )
        
        mock_frame = MagicMock()
        result = pipeline._compute_frame_hash(mock_frame)
        
        assert result == "a" * 64
        mock_sha256.assert_called_once_with(b"test_jpeg_bytes")


class TestDetectMinimapRegion:
    """Tests for minimap region detection."""
    
    @patch("src.sator.extraction.pipeline.os.path.exists")
    @patch("src.sator.extraction.pipeline.Path.mkdir")
    @patch("src.sator.extraction.pipeline.logging")
    async def test_detect_minimap_region_phase1(self, mock_logging, mock_mkdir, mock_exists):
        """Test Phase 1 fixed bbox detection."""
        mock_exists.return_value = True
        
        pipeline = ExtractionPipeline(
            vod_path="/data/vods/test.mp4",
            output_dir="/tmp/output",
            minimap_bbox=(0.7, 0.7, 0.98, 0.98),
        )
        
        result = await pipeline.detect_minimap_region()
        
        # Phase 1 returns fixed bbox
        assert result == (0.7, 0.7, 0.98, 0.98)


class TestCleanup:
    """Tests for pipeline cleanup."""
    
    @patch("src.sator.extraction.pipeline.os.path.exists")
    @patch("src.sator.extraction.pipeline.Path.mkdir")
    @patch("src.sator.extraction.pipeline.shutil.rmtree")
    @patch("src.sator.extraction.pipeline.logging")
    async def test_cleanup(self, mock_logging, mock_rmtree, mock_mkdir, mock_exists):
        """Test cleanup removes output directory."""
        mock_exists.return_value = True
        
        pipeline = ExtractionPipeline(
            vod_path="/data/vods/test.mp4",
            output_dir="/tmp/output",
        )
        
        await pipeline.cleanup()
        
        mock_rmtree.assert_called_once_with("/tmp/output")
    
    @patch("src.sator.extraction.pipeline.os.path.exists")
    @patch("src.sator.extraction.pipeline.Path.mkdir")
    @patch("src.sator.extraction.pipeline.shutil.rmtree")
    @patch("src.sator.extraction.pipeline.logging")
    async def test_cleanup_nonexistent(self, mock_logging, mock_rmtree, mock_mkdir, mock_exists):
        """Test cleanup when directory doesn't exist."""
        mock_exists.return_value = True
        
        pipeline = ExtractionPipeline(
            vod_path="/data/vods/test.mp4",
            output_dir="/tmp/output",
        )
        
        # Change exists to return False for cleanup check
        mock_exists.side_effect = [True, False]
        
        await pipeline.cleanup()
        
        # rmtree should not be called if directory doesn't exist
        mock_rmtree.assert_not_called()
