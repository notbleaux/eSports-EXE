"""
Module: sator.extraction.segment_classifier
Purpose: Classify frames by tactical segment type
Task: MF-3 - Segment Type Classification Logic
Date: 2026-03-28

[Ver001.000] - Heuristic-based segment classification
"""

import logging
from enum import Enum
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


class SegmentType(str, Enum):
    """Tactical frame segment classification."""
    IN_ROUND = "IN_ROUND"
    BUY_PHASE = "BUY_PHASE"
    HALFTIME = "HALFTIME"
    BETWEEN_ROUND = "BETWEEN_ROUND"
    UNKNOWN = "UNKNOWN"


class ClassificationError(Exception):
    """Exception raised during segment classification."""
    
    def __init__(self, message: str, code: str = "CLASSIFICATION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class SegmentClassifier:
    """
    Classify frames by tactical segment type using heuristic analysis.
    
    Phase 1: Uses timing-based heuristics to classify segments:
    - BUY_PHASE: First 15 seconds of each round
    - HALFTIME: Middle of match (with 30s buffer)
    - BETWEEN_ROUND: Detected between rounds (no gameplay)
    - IN_ROUND: Default gameplay segment
    
    Future phases will incorporate ML-based classification using:
    - Timer UI detection via template matching
    - HUD element analysis
    - Scene change detection
    """
    
    # Timing constants (milliseconds)
    BUY_PHASE_DURATION_MS = 15_000  # 15 seconds
    ROUND_DURATION_MS = 100_000  # ~1:40 per round (including buy phase)
    HALFTIME_BUFFER_MS = 30_000  # 30 seconds buffer around halftime
    
    def __init__(
        self,
        vod_duration_ms: int,
        rounds_per_half: int = 12,  # Standard Valorant
    ):
        """
        Initialize segment classifier.
        
        Args:
            vod_duration_ms: Total VOD duration in milliseconds
            rounds_per_half: Number of rounds per half (default: 12 for Valorant)
        """
        self.vod_duration_ms = vod_duration_ms
        self.rounds_per_half = rounds_per_half
        self.total_rounds = rounds_per_half * 2
        
        # Calculate halftime point
        self.halftime_start = (vod_duration_ms // 2) - self.HALFTIME_BUFFER_MS
        self.halftime_end = (vod_duration_ms // 2) + self.HALFTIME_BUFFER_MS
        
        # Estimate round boundaries (approximate for Phase 1)
        self.round_duration_ms = vod_duration_ms // self.total_rounds
        
        logger.debug(
            f"SegmentClassifier initialized: duration={vod_duration_ms}ms, "
            f"rounds={self.total_rounds}, round_duration={self.round_duration_ms}ms"
        )
    
    async def classify_frame(
        self,
        frame_path: Optional[str],
        timestamp_ms: int,
        vod_duration_ms: Optional[int] = None,
    ) -> SegmentType:
        """
        Classify a frame into segment type.
        
        Heuristics (Phase 1):
        - HALFTIME: Within 30s of match middle
        - BUY_PHASE: First 15s of each round
        - BETWEEN_ROUND: Brief period between rounds
        - IN_ROUND: Default gameplay segment
        
        Args:
            frame_path: Path to frame image (for future CV analysis)
            timestamp_ms: Frame timestamp in milliseconds
            vod_duration_ms: Optional override for VOD duration
            
        Returns:
            SegmentType classification
            
        Raises:
            ClassificationError: If classification fails
        """
        if vod_duration_ms:
            self.vod_duration_ms = vod_duration_ms
        
        # Validate timestamp
        if timestamp_ms < 0 or timestamp_ms > self.vod_duration_ms:
            logger.warning(
                f"Timestamp {timestamp_ms}ms outside VOD duration {self.vod_duration_ms}ms"
            )
            return SegmentType.UNKNOWN
        
        try:
            # Check for halftime first (highest priority)
            if self._detect_halftime(timestamp_ms):
                return SegmentType.HALFTIME
            
            # Check for buy phase
            if self._detect_buy_phase(timestamp_ms):
                return SegmentType.BUY_PHASE
            
            # Check for between rounds (brief pause after round end)
            if self._detect_between_round(timestamp_ms):
                return SegmentType.BETWEEN_ROUND
            
            # Default: in-round gameplay
            return SegmentType.IN_ROUND
            
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            return SegmentType.UNKNOWN
    
    def _detect_buy_phase(self, timestamp_ms: int) -> bool:
        """
        Detect buy phase by analyzing timestamp within round.
        
        In Valorant, buy phase is the first ~15 seconds of each round
        where players purchase weapons and abilities.
        
        Args:
            timestamp_ms: Frame timestamp in milliseconds
            
        Returns:
            True if frame is in buy phase
        """
        # Calculate position within estimated round
        round_progress_ms = timestamp_ms % self.round_duration_ms
        return round_progress_ms < self.BUY_PHASE_DURATION_MS
    
    def _detect_halftime(self, timestamp_ms: int) -> bool:
        """
        Detect halftime (middle of match with buffer).
        
        Args:
            timestamp_ms: Frame timestamp in milliseconds
            
        Returns:
            True if frame is during halftime
        """
        return self.halftime_start <= timestamp_ms <= self.halftime_end
    
    def _detect_between_round(self, timestamp_ms: int) -> bool:
        """
        Detect between-round period (brief transition).
        
        This is the ~5 second period after a round ends before
        the next buy phase begins.
        
        Args:
            timestamp_ms: Frame timestamp in milliseconds
            
        Returns:
            True if frame is between rounds
        """
        # Between rounds: brief window after round ends (approximate)
        # Round end is estimated at ~100s (1:40) from round start
        round_progress_ms = timestamp_ms % self.round_duration_ms
        round_end_start = 100_000  # ~1:40 gameplay
        round_end_end = 105_000   # ~5 second transition
        
        return round_end_start <= round_progress_ms < round_end_end
    
    def classify_batch(
        self,
        frames: list[dict],
    ) -> list[SegmentType]:
        """
        Classify a batch of frames efficiently.
        
        Args:
            frames: List of frame dicts with 'timestamp_ms' and optionally 'frame_path'
            
        Returns:
            List of SegmentType classifications
        """
        results = []
        for frame in frames:
            segment = self.classify_frame_sync(
                frame.get("frame_path"),
                frame["timestamp_ms"],
            )
            results.append(segment)
        return results
    
    def classify_frame_sync(
        self,
        frame_path: Optional[str],
        timestamp_ms: int,
    ) -> SegmentType:
        """
        Synchronous version of classify_frame for batch processing.
        
        Args:
            frame_path: Path to frame image
            timestamp_ms: Frame timestamp in milliseconds
            
        Returns:
            SegmentType classification
        """
        # Validate timestamp
        if timestamp_ms < 0 or timestamp_ms > self.vod_duration_ms:
            return SegmentType.UNKNOWN
        
        # Check for halftime first
        if self._detect_halftime(timestamp_ms):
            return SegmentType.HALFTIME
        
        # Check for buy phase
        if self._detect_buy_phase(timestamp_ms):
            return SegmentType.BUY_PHASE
        
        # Check for between rounds
        if self._detect_between_round(timestamp_ms):
            return SegmentType.BETWEEN_ROUND
        
        # Default: in-round gameplay
        return SegmentType.IN_ROUND
    
    def get_segment_stats(self) -> dict:
        """
        Get estimated segment distribution for the VOD.
        
        Returns:
            Dictionary with estimated segment counts and durations
        """
        # Estimate buy phase time per round
        buy_phase_per_round = self.BUY_PHASE_DURATION_MS
        total_buy_phase = buy_phase_per_round * self.total_rounds
        
        # Estimate halftime duration
        halftime_duration = self.HALFTIME_BUFFER_MS * 2
        
        # Estimate between-round time
        between_round_duration = 5_000  # ~5 seconds per transition
        total_between_round = between_round_duration * (self.total_rounds - 1)
        
        # Remaining is in-round gameplay
        total_in_round = (
            self.vod_duration_ms
            - total_buy_phase
            - halftime_duration
            - total_between_round
        )
        
        return {
            "total_duration_ms": self.vod_duration_ms,
            "buy_phase_ms": total_buy_phase,
            "buy_phase_percent": round(total_buy_phase / self.vod_duration_ms * 100, 1),
            "halftime_ms": halftime_duration,
            "halftime_percent": round(halftime_duration / self.vod_duration_ms * 100, 1),
            "between_round_ms": total_between_round,
            "between_round_percent": round(total_between_round / self.vod_duration_ms * 100, 1),
            "in_round_ms": max(0, total_in_round),
            "in_round_percent": round(max(0, total_in_round) / self.vod_duration_ms * 100, 1),
            "total_rounds": self.total_rounds,
            "rounds_per_half": self.rounds_per_half,
        }


class MLBasedClassifier(SegmentClassifier):
    """
    Future ML-based classifier (Phase 2+).
    
    This class will implement:
    - Timer UI detection using template matching
    - Scene classification using CNN
    - Optical flow analysis for round transitions
    """
    
    def __init__(self, vod_duration_ms: int, model_path: Optional[str] = None):
        """
        Initialize ML-based classifier.
        
        Args:
            vod_duration_ms: Total VOD duration in milliseconds
            model_path: Path to trained classification model
        """
        super().__init__(vod_duration_ms)
        self.model_path = model_path
        self._model_loaded = False
        
        # Future: Load TensorFlow/PyTorch model
        logger.info("MLBasedClassifier initialized (model loading not yet implemented)")
    
    def _detect_buy_phase_ml(self, frame: np.ndarray) -> bool:
        """
        Future ML-based buy phase detection.
        
        Args:
            frame: Frame image as numpy array
            
        Returns:
            True if frame shows buy phase UI
        """
        # Future implementation:
        # 1. Detect timer UI in top section
        # 2. Check for weapon shop visibility
        # 3. Classify using trained CNN
        raise NotImplementedError("ML classification not yet implemented")
