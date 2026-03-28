"""
Unit tests for segment classifier.
Task: MF-3 - Segment Type Classification Logic
"""

import os
import sys
from unittest.mock import MagicMock, patch

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

# Mock sator modules to prevent import issues
sys.modules["src.sator.routes"] = MagicMock()
sys.modules["src.sator.extraction_job"] = MagicMock()
sys.modules["src.sator.extraction_schemas"] = MagicMock()

from src.sator.extraction.segment_classifier import (
    SegmentClassifier,
    SegmentType,
    ClassificationError,
    MLBasedClassifier,
)


class TestSegmentTypeEnum:
    """Tests for SegmentType enum."""
    
    def test_segment_type_values(self):
        """Test segment type enum values."""
        assert SegmentType.IN_ROUND.value == "IN_ROUND"
        assert SegmentType.BUY_PHASE.value == "BUY_PHASE"
        assert SegmentType.HALFTIME.value == "HALFTIME"
        assert SegmentType.BETWEEN_ROUND.value == "BETWEEN_ROUND"
        assert SegmentType.UNKNOWN.value == "UNKNOWN"


class TestSegmentClassifierInit:
    """Tests for SegmentClassifier initialization."""
    
    def test_classifier_init_default_rounds(self):
        """Test classifier with default rounds per half."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)  # 1 hour
        
        assert classifier.vod_duration_ms == 3600000
        assert classifier.rounds_per_half == 12
        assert classifier.total_rounds == 24
        assert classifier.round_duration_ms == 3600000 // 24  # 150000ms
    
    def test_classifier_init_custom_rounds(self):
        """Test classifier with custom rounds per half."""
        classifier = SegmentClassifier(
            vod_duration_ms=1800000,  # 30 minutes
            rounds_per_half=6,
        )
        
        assert classifier.rounds_per_half == 6
        assert classifier.total_rounds == 12
    
    def test_halftime_calculation(self):
        """Test halftime boundary calculation."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # Halftime should be at 30 minutes (1800000ms) with 30s buffer
        assert classifier.halftime_start == 1800000 - 30000  # 1770000
        assert classifier.halftime_end == 1800000 + 30000    # 1830000


class TestDetectBuyPhase:
    """Tests for buy phase detection."""
    
    def test_detect_buy_phase_first_15s(self):
        """Test buy phase detection in first 15 seconds of round."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # At 5 seconds into round
        assert classifier._detect_buy_phase(5000) is True
        
        # At 14 seconds into round
        assert classifier._detect_buy_phase(14000) is True
        
        # At 15 seconds into round (boundary)
        assert classifier._detect_buy_phase(14999) is True
    
    def test_detect_buy_phase_after_15s(self):
        """Test buy phase detection after 15 seconds."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # At 20 seconds into round
        assert classifier._detect_buy_phase(20000) is False
        
        # At 60 seconds into round
        assert classifier._detect_buy_phase(60000) is False
    
    def test_detect_buy_phase_multiple_rounds(self):
        """Test buy phase detection across multiple rounds."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # Round 1: 0-150s
        assert classifier._detect_buy_phase(5000) is True   # 5s in
        assert classifier._detect_buy_phase(30000) is False  # 30s in
        
        # Round 2: 150-300s
        round2_start = classifier.round_duration_ms  # 150000
        assert classifier._detect_buy_phase(round2_start + 5000) is True   # 5s in round 2
        assert classifier._detect_buy_phase(round2_start + 20000) is False  # 20s in round 2


class TestDetectHalftime:
    """Tests for halftime detection."""
    
    def test_detect_halftime_in_range(self):
        """Test halftime detection within buffer zone."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # 30 seconds before halftime (1770000ms)
        assert classifier._detect_halftime(1770000) is True
        
        # Exactly at halftime (1800000ms)
        assert classifier._detect_halftime(1800000) is True
        
        # 30 seconds after halftime (1830000ms)
        assert classifier._detect_halftime(1830000) is True
    
    def test_detect_halftime_outside_range(self):
        """Test halftime detection outside buffer zone."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # Before halftime buffer
        assert classifier._detect_halftime(1769999) is False
        
        # After halftime buffer
        assert classifier._detect_halftime(1830001) is False
        
        # At start of match
        assert classifier._detect_halftime(0) is False
        
        # At end of match
        assert classifier._detect_halftime(3600000) is False


class TestDetectBetweenRound:
    """Tests for between-round detection."""
    
    def test_detect_between_round_in_range(self):
        """Test between-round detection in transition period."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # Between round: 100s to 105s into each round
        assert classifier._detect_between_round(100000) is True   # Exactly at 100s
        assert classifier._detect_between_round(102000) is True   # At 102s
        assert classifier._detect_between_round(104999) is True   # Just before 105s
    
    def test_detect_between_round_outside_range(self):
        """Test between-round detection outside transition period."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # Before between-round period
        assert classifier._detect_between_round(99999) is False
        
        # After between-round period
        assert classifier._detect_between_round(105000) is False
        
        # During gameplay
        assert classifier._detect_between_round(50000) is False
    
    def test_detect_between_round_multiple_rounds(self):
        """Test between-round detection across multiple rounds."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # Round 1: between round at 100-105s
        assert classifier._detect_between_round(100000) is True
        
        # Round 2: between round at 100s + round_duration
        round2_offset = classifier.round_duration_ms
        assert classifier._detect_between_round(round2_offset + 100000) is True
        assert classifier._detect_between_round(round2_offset + 102000) is True


class TestClassifyFrameSync:
    """Tests for synchronous frame classification."""
    
    def test_classify_halftime_priority(self):
        """Test that halftime takes priority over other segments."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # During halftime (should be halftime even if also buy phase time)
        halftime_ts = 1800000  # 30 minutes
        result = classifier.classify_frame_sync(None, halftime_ts)
        assert result == SegmentType.HALFTIME
    
    def test_classify_buy_phase(self):
        """Test buy phase classification."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # At 5 seconds into round
        result = classifier.classify_frame_sync(None, 5000)
        assert result == SegmentType.BUY_PHASE
    
    def test_classify_between_round(self):
        """Test between round classification."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # At 102 seconds into round (skip halftime area)
        ts = 200000 + 102000  # Round 2, 102s in
        result = classifier.classify_frame_sync(None, ts)
        assert result == SegmentType.BETWEEN_ROUND
    
    def test_classify_in_round(self):
        """Test in-round classification."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # At 60 seconds into round (after buy phase, before between round)
        result = classifier.classify_frame_sync(None, 60000)
        assert result == SegmentType.IN_ROUND
    
    def test_classify_invalid_timestamp(self):
        """Test classification with invalid timestamp."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # Negative timestamp
        result = classifier.classify_frame_sync(None, -1000)
        assert result == SegmentType.UNKNOWN
        
        # Timestamp beyond duration
        result = classifier.classify_frame_sync(None, 4000000)
        assert result == SegmentType.UNKNOWN


class TestClassifyFrameAsync:
    """Tests for async frame classification."""
    
    @pytest.mark.asyncio
    async def test_classify_frame_async(self):
        """Test async classification returns same result as sync."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        # Test various timestamps
        test_cases = [
            (5000, SegmentType.BUY_PHASE),
            (60000, SegmentType.IN_ROUND),
            (1800000, SegmentType.HALFTIME),
        ]
        
        for ts, expected in test_cases:
            result = await classifier.classify_frame(None, ts)
            assert result == expected
    
    @pytest.mark.asyncio
    async def test_classify_frame_with_duration_override(self):
        """Test async classification with duration override."""
        classifier = SegmentClassifier(vod_duration_ms=1800000)
        
        # Override duration
        result = await classifier.classify_frame(None, 60000, vod_duration_ms=3600000)
        assert result == SegmentType.IN_ROUND


class TestClassifyBatch:
    """Tests for batch classification."""
    
    def test_classify_batch(self):
        """Test batch classification of multiple frames."""
        classifier = SegmentClassifier(vod_duration_ms=3600000)
        
        frames = [
            {"timestamp_ms": 5000},    # Buy phase
            {"timestamp_ms": 60000},   # In round
            {"timestamp_ms": 102000},  # Between round
        ]
        
        results = classifier.classify_batch(frames)
        
        assert len(results) == 3
        assert results[0] == SegmentType.BUY_PHASE
        assert results[1] == SegmentType.IN_ROUND
        assert results[2] == SegmentType.BETWEEN_ROUND


class TestGetSegmentStats:
    """Tests for segment statistics."""
    
    def test_segment_stats(self):
        """Test segment distribution statistics."""
        classifier = SegmentClassifier(
            vod_duration_ms=3600000,  # 1 hour
            rounds_per_half=12,
        )
        
        stats = classifier.get_segment_stats()
        
        assert stats["total_duration_ms"] == 3600000
        assert stats["total_rounds"] == 24
        assert stats["rounds_per_half"] == 12
        
        # Verify percentages add up to ~100%
        total_percent = (
            stats["buy_phase_percent"] +
            stats["halftime_percent"] +
            stats["between_round_percent"] +
            stats["in_round_percent"]
        )
        assert 99 <= total_percent <= 100
        
        # Verify durations are positive
        assert stats["buy_phase_ms"] > 0
        assert stats["halftime_ms"] > 0
        assert stats["in_round_ms"] >= 0


class TestClassificationError:
    """Tests for ClassificationError."""
    
    def test_error_with_default_code(self):
        """Test error with default code."""
        error = ClassificationError("Test error")
        assert error.message == "Test error"
        assert error.code == "CLASSIFICATION_ERROR"
        assert str(error) == "Test error"
    
    def test_error_with_custom_code(self):
        """Test error with custom code."""
        error = ClassificationError("Invalid timestamp", "INVALID_TIMESTAMP")
        assert error.message == "Invalid timestamp"
        assert error.code == "INVALID_TIMESTAMP"


class TestMLBasedClassifier:
    """Tests for ML-based classifier (future implementation)."""
    
    def test_ml_classifier_init(self):
        """Test ML classifier initialization."""
        # This is a placeholder for future ML implementation
        classifier = MLBasedClassifier(
            vod_duration_ms=3600000,
            model_path="/models/segment_classifier.h5",
        )
        
        assert classifier.vod_duration_ms == 3600000
        assert classifier.model_path == "/models/segment_classifier.h5"
        assert classifier._model_loaded is False
    
    def test_ml_classifier_not_implemented(self):
        """Test ML methods raise NotImplementedError."""
        classifier = MLBasedClassifier(vod_duration_ms=3600000)
        
        with pytest.raises(NotImplementedError):
            classifier._detect_buy_phase_ml(None)
