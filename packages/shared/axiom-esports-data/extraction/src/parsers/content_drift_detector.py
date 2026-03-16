"""
Content Drift Detector — Detects changes in source data structure.

Content drift occurs when a data source (VLR.gg) changes its HTML structure,
resulting in different content being returned for the same URL over time.
This module detects such changes and flags them for review.
"""
import hashlib
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Union

logger = logging.getLogger(__name__)


@dataclass
class DriftReport:
    """Detailed report of detected content drift."""
    url: str
    drift_detected: bool
    source: str
    expected_checksum: Optional[str] = None
    current_checksum: Optional[str] = None
    similarity_score: float = 0.0  # 0.0 to 1.0
    diff_percentage: float = 0.0
    
    # Structural analysis
    expected_markers: list[str] = field(default_factory=list)
    detected_markers: list[str] = field(default_factory=list)
    missing_markers: list[str] = field(default_factory=list)
    new_markers: list[str] = field(default_factory=list)
    
    # Classification
    severity: str = "none"  # none, low, medium, high, critical
    recommended_action: str = "none"  # none, review, exclude, block
    
    # Metadata
    detected_at: str = field(default_factory=lambda: datetime.now(tz=timezone.utc).isoformat())
    notes: str = ""
    
    def to_dict(self) -> dict:
        """Convert report to dictionary."""
        return {
            'url': self.url,
            'drift_detected': self.drift_detected,
            'source': self.source,
            'expected_checksum': self.expected_checksum,
            'current_checksum': self.current_checksum,
            'similarity_score': self.similarity_score,
            'diff_percentage': self.diff_percentage,
            'expected_markers': self.expected_markers,
            'detected_markers': self.detected_markers,
            'missing_markers': self.missing_markers,
            'new_markers': self.new_markers,
            'severity': self.severity,
            'recommended_action': self.recommended_action,
            'detected_at': self.detected_at,
            'notes': self.notes,
        }


class ContentDriftDetector:
    """
    Detects changes in source data structure for VLR.gg pages.
    
    Uses multiple detection methods:
    1. Checksum comparison (SHA-256)
    2. Structural marker analysis
    3. Content similarity scoring
    
    Thresholds are loaded from harvest_protocol.json safety_thresholds.
    """

    # Default markers for VLR.gg pages
    DEFAULT_MARKERS = [
        "vlr",
        "match-header",
        "vm-stats-game",
        "mod-player",
        "mod-stat",
        "player-stats",
        "team-header",
        "roster",
    ]

    def __init__(
        self,
        reference_checksums: Optional[dict[str, str]] = None,
        markers: Optional[list[str]] = None,
        max_drift_pct: float = 5.0,
        storage_path: Optional[Path] = None,
    ):
        """
        Initialize drift detector.
        
        Args:
            reference_checksums: Mapping of URLs to expected SHA-256 checksums
            markers: HTML markers to check for structural integrity
            max_drift_pct: Maximum allowed content drift percentage (0-100)
            storage_path: Path to store drift history
        """
        self.reference_checksums = reference_checksums or {}
        self.markers = markers or self.DEFAULT_MARKERS.copy()
        self.max_drift_pct = max_drift_pct
        self.storage_path = storage_path or Path("data/drift_reports")
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def compute_checksum(self, content: str) -> str:
        """Compute SHA-256 checksum of content."""
        return hashlib.sha256(content.encode()).hexdigest()

    def check_drift(
        self,
        content: str,
        source: str,
        url: Optional[str] = None,
        expected_checksum: Optional[str] = None,
    ) -> DriftReport:
        """
        Check for content drift.
        
        Args:
            content: Current HTML/content to check
            source: Source identifier (e.g., "vlr_gg", "hltv")
            url: Optional URL for reference
            expected_checksum: Expected checksum (uses registry if not provided)
            
        Returns:
            DriftReport with detailed analysis
        """
        current_checksum = self.compute_checksum(content)
        url = url or "unknown"
        
        # Use provided expected checksum or look up from registry
        if expected_checksum is None:
            expected_checksum = self.reference_checksums.get(url)
        
        # If no reference, just record current state
        if expected_checksum is None:
            return DriftReport(
                url=url,
                drift_detected=False,
                source=source,
                current_checksum=current_checksum,
                notes="No reference checksum available for comparison",
            )
        
        # Check for exact match
        if current_checksum == expected_checksum:
            return DriftReport(
                url=url,
                drift_detected=False,
                source=source,
                expected_checksum=expected_checksum,
                current_checksum=current_checksum,
                similarity_score=1.0,
                diff_percentage=0.0,
            )
        
        # Drift detected - perform detailed analysis
        logger.warning(
            "Content drift detected for %s: checksum mismatch", url
        )
        
        return self._analyze_drift(content, url, source, expected_checksum, current_checksum)

    def _analyze_drift(
        self,
        content: str,
        url: str,
        source: str,
        expected_checksum: str,
        current_checksum: str,
    ) -> DriftReport:
        """Perform detailed drift analysis."""
        content_lower = content.lower()
        
        # Check structural markers
        detected_markers = []
        missing_markers = []
        
        for marker in self.markers:
            if marker.lower() in content_lower:
                detected_markers.append(marker)
            else:
                missing_markers.append(marker)
        
        # Calculate similarity score based on markers
        if self.markers:
            marker_similarity = len(detected_markers) / len(self.markers)
        else:
            marker_similarity = 0.0
        
        # Calculate content difference percentage (approximate)
        # This is a simplified diff - in production, use difflib or similar
        diff_percentage = self._estimate_diff_percentage(expected_checksum, content)
        
        # Determine severity
        severity = self._determine_severity(
            marker_similarity, diff_percentage, missing_markers
        )
        
        # Determine recommended action
        recommended_action = self._determine_action(severity, diff_percentage)
        
        report = DriftReport(
            url=url,
            drift_detected=True,
            source=source,
            expected_checksum=expected_checksum,
            current_checksum=current_checksum,
            similarity_score=round(marker_similarity, 4),
            diff_percentage=round(diff_percentage, 2),
            expected_markers=self.markers.copy(),
            detected_markers=detected_markers,
            missing_markers=missing_markers,
            severity=severity,
            recommended_action=recommended_action,
            notes=self._generate_notes(missing_markers, diff_percentage),
        )
        
        # Store drift report
        self._store_report(report)
        
        return report

    def _estimate_diff_percentage(
        self, expected_checksum: str, current_content: str
    ) -> float:
        """
        Estimate content difference percentage.
        
        Note: This is an approximation since we don't have the original content.
        In production, store original content samples for comparison.
        """
        # Simple heuristic based on checksum difference
        # In reality, this would use stored reference content
        return 100.0  # Unknown without reference content

    def _determine_severity(
        self,
        marker_similarity: float,
        diff_percentage: float,
        missing_markers: list[str],
    ) -> str:
        """Determine drift severity based on analysis."""
        critical_markers = {"vm-stats-game", "mod-player", "match-header"}
        missing_critical = any(m in critical_markers for m in missing_markers)
        
        if missing_critical:
            return "critical"
        if marker_similarity < 0.5:
            return "high"
        if marker_similarity < 0.75:
            return "medium"
        if diff_percentage > self.max_drift_pct:
            return "medium"
        return "low"

    def _determine_action(self, severity: str, diff_percentage: float) -> str:
        """Determine recommended action based on severity."""
        if severity == "critical":
            return "block"
        if severity == "high":
            return "exclude"
        if severity in ("medium", "low"):
            return "review"
        return "none"

    def _generate_notes(self, missing_markers: list[str], diff_percentage: float) -> str:
        """Generate human-readable notes about the drift."""
        notes = []
        
        if missing_markers:
            notes.append(f"Missing {len(missing_markers)} structural markers: {', '.join(missing_markers[:5])}")
        
        if diff_percentage > 0:
            notes.append(f"Content changed by ~{diff_percentage:.1f}%")
        
        return "; ".join(notes) if notes else "Content drift detected"

    def _store_report(self, report: DriftReport) -> None:
        """Store drift report to disk for audit trail."""
        try:
            timestamp = datetime.now(tz=timezone.utc).strftime("%Y%m%d_%H%M%S")
            safe_url = re.sub(r'[^\w]', '_', report.url)[:50]
            filename = f"drift_{safe_url}_{timestamp}.json"
            filepath = self.storage_path / filename
            
            with open(filepath, 'w') as f:
                json.dump(report.to_dict(), f, indent=2)
            
            logger.info("Drift report stored: %s", filepath)
        except Exception as e:
            logger.warning("Failed to store drift report: %s", e)

    def update_reference(self, url: str, content: str) -> None:
        """
        Update reference checksum for a URL.
        
        Call this after confirming that new content is valid (not drift).
        """
        checksum = self.compute_checksum(content)
        self.reference_checksums[url] = checksum
        logger.info("Updated reference checksum for %s: %s...", url, checksum[:16])

    def validate_against_reference(
        self,
        content: str,
        reference_content: str,
        url: str,
        source: str = "vlr_gg",
    ) -> DriftReport:
        """
        Validate content against stored reference content (not just checksum).
        
        This provides more detailed analysis than checksum comparison.
        """
        expected_checksum = self.compute_checksum(reference_content)
        current_checksum = self.compute_checksum(content)
        
        if expected_checksum == current_checksum:
            return DriftReport(
                url=url,
                drift_detected=False,
                source=source,
                expected_checksum=expected_checksum,
                current_checksum=current_checksum,
                similarity_score=1.0,
                diff_percentage=0.0,
            )
        
        # Detailed diff analysis
        diff_pct = self._calculate_diff_percentage(reference_content, content)
        
        # Structural analysis
        ref_markers = set(m for m in self.markers if m.lower() in reference_content.lower())
        curr_markers = set(m for m in self.markers if m.lower() in content.lower())
        
        missing = list(ref_markers - curr_markers)
        new_markers = list(curr_markers - ref_markers)
        
        # Similarity based on markers
        if ref_markers:
            marker_sim = len(curr_markers & ref_markers) / len(ref_markers)
        else:
            marker_sim = 1.0 if not curr_markers else 0.0
        
        severity = self._determine_severity(marker_sim, diff_pct, missing)
        action = self._determine_action(severity, diff_pct)
        
        report = DriftReport(
            url=url,
            drift_detected=True,
            source=source,
            expected_checksum=expected_checksum,
            current_checksum=current_checksum,
            similarity_score=round(marker_sim, 4),
            diff_percentage=round(diff_pct, 2),
            expected_markers=list(ref_markers),
            detected_markers=list(curr_markers),
            missing_markers=missing,
            new_markers=new_markers,
            severity=severity,
            recommended_action=action,
            notes=f"Detailed diff: {diff_pct:.1f}% change, {len(missing)} missing markers",
        )
        
        self._store_report(report)
        return report

    def _calculate_diff_percentage(self, old: str, new: str) -> float:
        """Calculate percentage difference between two strings."""
        import difflib
        
        # Use SequenceMatcher for similarity
        matcher = difflib.SequenceMatcher(None, old, new)
        similarity = matcher.ratio()
        return (1.0 - similarity) * 100

    def get_drift_history(self, url: Optional[str] = None) -> list[dict]:
        """Retrieve drift detection history."""
        reports = []
        
        try:
            for filepath in self.storage_path.glob("drift_*.json"):
                try:
                    with open(filepath, 'r') as f:
                        report = json.load(f)
                        if url is None or report.get('url') == url:
                            reports.append(report)
                except Exception as e:
                    logger.warning("Failed to load drift report %s: %s", filepath, e)
        except Exception as e:
            logger.warning("Failed to list drift reports: %s", e)
        
        # Sort by detection time
        reports.sort(key=lambda x: x.get('detected_at', ''), reverse=True)
        return reports

    def clear_history(self, older_than_days: Optional[int] = None) -> int:
        """
        Clear drift detection history.
        
        Args:
            older_than_days: If provided, only clear reports older than N days
            
        Returns:
            Number of reports cleared
        """
        cleared = 0
        
        try:
            for filepath in self.storage_path.glob("drift_*.json"):
                try:
                    if older_than_days:
                        import time
                        file_age_days = (time.time() - filepath.stat().st_mtime) / 86400
                        if file_age_days <= older_than_days:
                            continue
                    
                    filepath.unlink()
                    cleared += 1
                except Exception as e:
                    logger.warning("Failed to clear drift report %s: %s", filepath, e)
        except Exception as e:
            logger.warning("Failed to clear drift history: %s", e)
        
        return cleared
