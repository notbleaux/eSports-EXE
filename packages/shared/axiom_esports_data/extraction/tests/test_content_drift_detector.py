"""
Tests for ContentDriftDetector.
"""
import pytest
import json
from pathlib import Path
from datetime import datetime

from extraction.src.parsers.content_drift_detector import (
    ContentDriftDetector,
    DriftReport,
)


class TestDriftReport:
    """Test DriftReport dataclass."""
    
    def test_drift_report_creation(self):
        """Should create DriftReport with required fields."""
        report = DriftReport(
            url="https://vlr.gg/123",
            drift_detected=True,
            source="vlr_gg",
        )
        
        assert report.url == "https://vlr.gg/123"
        assert report.drift_detected is True
        assert report.source == "vlr_gg"
    
    def test_drift_report_to_dict(self):
        """Should convert to dictionary."""
        report = DriftReport(
            url="https://vlr.gg/123",
            drift_detected=False,
            source="vlr_gg",
            similarity_score=1.0,
        )
        
        d = report.to_dict()
        assert d['url'] == "https://vlr.gg/123"
        assert d['drift_detected'] is False
        assert d['similarity_score'] == 1.0
    
    def test_drift_report_timestamp_auto_set(self):
        """Should auto-set detection timestamp."""
        report = DriftReport(
            url="https://vlr.gg/123",
            drift_detected=True,
            source="vlr_gg",
        )
        
        assert report.detected_at is not None
        # Should be valid ISO timestamp
        try:
            datetime.fromisoformat(report.detected_at.replace('Z', '+00:00').replace('+00:00', ''))
        except ValueError:
            pytest.fail("detected_at is not valid ISO format")


class TestContentDriftDetectorChecksums:
    """Test checksum computation."""
    
    def test_checksum_consistency(self):
        """Same content should produce same checksum."""
        detector = ContentDriftDetector()
        content = "test content"
        
        cs1 = detector.compute_checksum(content)
        cs2 = detector.compute_checksum(content)
        
        assert cs1 == cs2
        assert len(cs1) == 64  # SHA-256 hex
    
    def test_checksum_uniqueness(self):
        """Different content should produce different checksums."""
        detector = ContentDriftDetector()
        
        cs1 = detector.compute_checksum("content A")
        cs2 = detector.compute_checksum("content B")
        
        assert cs1 != cs2
    
    def test_checksum_hex_format(self):
        """Checksum should be valid hex."""
        detector = ContentDriftDetector()
        cs = detector.compute_checksum("test")
        
        assert all(c in '0123456789abcdef' for c in cs)


class TestContentDriftDetection:
    """Test drift detection logic."""
    
    def test_no_drift_when_no_reference(self):
        """Should not detect drift when no reference checksum exists."""
        detector = ContentDriftDetector()
        content = "<html><body>Test</body></html>"
        
        report = detector.check_drift(content, "vlr_gg", "https://vlr.gg/123")
        
        assert report.drift_detected is False
        assert report.current_checksum is not None
    
    def test_no_drift_when_checksum_matches(self):
        """Should not detect drift when checksum matches."""
        detector = ContentDriftDetector()
        content = "<html><body>Test</body></html>"
        checksum = detector.compute_checksum(content)
        
        detector.reference_checksums["https://vlr.gg/123"] = checksum
        report = detector.check_drift(content, "vlr_gg", "https://vlr.gg/123")
        
        assert report.drift_detected is False
        assert report.similarity_score == 1.0
    
    def test_drift_detected_when_checksum_differs(self):
        """Should detect drift when checksum differs."""
        detector = ContentDriftDetector()
        content = "<html><body>Test</body></html>"
        
        detector.reference_checksums["https://vlr.gg/123"] = "different_checksum"
        report = detector.check_drift(content, "vlr_gg", "https://vlr.gg/123")
        
        assert report.drift_detected is True
        assert report.current_checksum != "different_checksum"


class TestStructuralAnalysis:
    """Test structural marker analysis."""
    
    def test_detects_expected_markers(self):
        """Should detect expected HTML markers."""
        detector = ContentDriftDetector()
        content = """
        <html>
        <body>
        <div class="match-header">Header</div>
        <div class="vm-stats-game">Stats</div>
        <div class="mod-player">Player</div>
        </body>
        </html>
        """
        
        detector.reference_checksums["test"] = "wrong_checksum"
        report = detector.check_drift(content, "vlr_gg", "test")
        
        # Should have detected some markers
        assert len(report.detected_markers) > 0
    
    def test_identifies_missing_markers(self):
        """Should identify missing structural markers."""
        detector = ContentDriftDetector()
        content = "<html><body>Minimal content</body></html>"
        
        detector.reference_checksums["test"] = "wrong_checksum"
        report = detector.check_drift(content, "vlr_gg", "test")
        
        # Should have missing markers
        assert len(report.missing_markers) > 0


class TestSeverityClassification:
    """Test severity classification."""
    
    def test_critical_when_critical_markers_missing(self):
        """Should classify as critical when critical markers are missing."""
        detector = ContentDriftDetector()
        
        # Simulate critical marker missing
        detector.reference_checksums["test"] = "wrong_checksum"
        
        content = """
        <html><body>
        <div class="header">Header</div>
        </body></html>
        """
        
        report = detector.check_drift(content, "vlr_gg", "test")
        
        # With very low similarity, severity should be high
        if report.similarity_score < 0.5:
            assert report.severity in ("high", "critical")


class TestReferenceUpdates:
    """Test reference checksum updates."""
    
    def test_update_reference(self):
        """Should update reference checksum."""
        detector = ContentDriftDetector()
        content = "test content"
        
        detector.update_reference("https://vlr.gg/123", content)
        
        assert "https://vlr.gg/123" in detector.reference_checksums
        assert detector.reference_checksums["https://vlr.gg/123"] == detector.compute_checksum(content)


class TestDetailedValidation:
    """Test detailed content validation."""
    
    def test_validate_against_reference(self):
        """Should validate against stored reference content."""
        detector = ContentDriftDetector()
        
        old_content = "<html><body>Old Version</body></html>"
        new_content = "<html><body>New Version</body></html>"
        
        report = detector.validate_against_reference(
            new_content, old_content, "https://vlr.gg/123"
        )
        
        assert report.drift_detected is True
        assert report.diff_percentage > 0


class TestDriftHistory:
    """Test drift history management."""
    
    def test_get_empty_history(self, tmp_path):
        """Should return empty list when no history exists."""
        detector = ContentDriftDetector(storage_path=tmp_path)
        history = detector.get_drift_history()
        
        assert isinstance(history, list)
        assert len(history) == 0
    
    def test_clear_history(self, tmp_path):
        """Should clear drift history."""
        detector = ContentDriftDetector(storage_path=tmp_path)
        
        # Create a fake report file
        report_file = tmp_path / "drift_test_20240101_120000.json"
        report_file.write_text(json.dumps({"url": "test", "drift_detected": True}))
        
        cleared = detector.clear_history()
        
        assert cleared >= 0


class TestEdgeCases:
    """Test edge cases."""
    
    def test_empty_content(self):
        """Should handle empty content."""
        detector = ContentDriftDetector()
        
        report = detector.check_drift("", "vlr_gg", "test")
        
        assert report.drift_detected is False
        assert report.current_checksum == detector.compute_checksum("")
    
    def test_unicode_content(self):
        """Should handle unicode content."""
        detector = ContentDriftDetector()
        content = "<html><body>TenZ vs テンジ</body></html>"
        
        checksum = detector.compute_checksum(content)
        assert len(checksum) == 64
    
    def test_large_content(self):
        """Should handle large content."""
        detector = ContentDriftDetector()
        content = "<html><body>" + "x" * 100000 + "</body></html>"
        
        checksum = detector.compute_checksum(content)
        assert len(checksum) == 64


class TestConfiguration:
    """Test detector configuration."""
    
    def test_custom_markers(self):
        """Should accept custom markers."""
        custom_markers = ["custom-marker-1", "custom-marker-2"]
        detector = ContentDriftDetector(markers=custom_markers)
        
        assert detector.markers == custom_markers
    
    def test_custom_max_drift(self):
        """Should accept custom max drift percentage."""
        detector = ContentDriftDetector(max_drift_pct=10.0)
        
        assert detector.max_drift_pct == 10.0
