"""
Comprehensive test suite for TeneT Verification Service
Tests confidence calculation, endpoints, and database operations
"""
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import json

# Import from main
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import (
    app, Base, ConfidenceCalculator, DataSource, VerificationRequest,
    AsyncSessionLocal, VerificationRecord, VerificationStatus
)

client = TestClient(app)


class TestConfidenceCalculator:
    """Test the confidence scoring algorithm"""

    def test_empty_sources_returns_zero(self):
        """Empty source list should return 0 confidence"""
        confidence, breakdown, conflicts = ConfidenceCalculator.calculate_confidence([])
        assert confidence == 0.0
        assert "error" in breakdown

    def test_single_high_trust_source(self):
        """Single HIGH trust source should yield high confidence"""
        source = DataSource(
            sourceType="pandascore_api",
            trustLevel="HIGH",
            weight=1.0,
            data={"final_score": 100},
            capturedAt=datetime.utcnow()
        )
        confidence, breakdown, conflicts = ConfidenceCalculator.calculate_confidence([source])
        assert confidence >= 0.9
        assert len(conflicts) == 0

    def test_multiple_high_trust_agreeing_sources(self):
        """Multiple HIGH trust sources agreeing should yield very high confidence"""
        sources = [
            DataSource(
                sourceType="pandascore_api",
                trustLevel="HIGH",
                weight=1.0,
                data={"final_score": 100, "winner_id": "team_a"},
                capturedAt=datetime.utcnow()
            ),
            DataSource(
                sourceType="video_manual_review",
                trustLevel="HIGH",
                weight=1.0,
                data={"final_score": 100, "winner_id": "team_a"},
                capturedAt=datetime.utcnow()
            ),
        ]
        confidence, breakdown, conflicts = ConfidenceCalculator.calculate_confidence(sources)
        assert confidence >= 0.95
        assert len(conflicts) == 0

    def test_conflicting_sources_detected(self):
        """Sources disagreeing on critical fields should be flagged"""
        sources = [
            DataSource(
                sourceType="pandascore_api",
                trustLevel="HIGH",
                weight=1.0,
                data={"final_score": 100, "winner_id": "team_a"},
                capturedAt=datetime.utcnow()
            ),
            DataSource(
                sourceType="vlr_scrape",
                trustLevel="LOW",
                weight=0.5,
                data={"final_score": 100, "winner_id": "team_b"},
                capturedAt=datetime.utcnow()
            ),
        ]
        confidence, breakdown, conflicts = ConfidenceCalculator.calculate_confidence(sources)
        assert "winner_id" in conflicts
        assert breakdown["conflictDetected"] is True

    def test_weighted_scoring_respects_trust_levels(self):
        """Higher trust levels should contribute more to confidence"""
        sources_high = [
            DataSource(
                sourceType="pandascore_api",
                trustLevel="HIGH",
                weight=1.0,
                data={"final_score": 100},
                capturedAt=datetime.utcnow()
            ),
        ]
        sources_low = [
            DataSource(
                sourceType="fan_forum",
                trustLevel="LOW",
                weight=1.0,
                data={"final_score": 100},
                capturedAt=datetime.utcnow()
            ),
        ]

        conf_high, _, _ = ConfidenceCalculator.calculate_confidence(sources_high)
        conf_low, _, _ = ConfidenceCalculator.calculate_confidence(sources_low)
        assert conf_high > conf_low


class TestVerificationEndpoints:
    """Test HTTP endpoints"""

    def test_health_check(self):
        """Health endpoint should return ok status"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.json()["service"] == "tenet-verification"

    def test_verify_endpoint_accepts_high_confidence(self):
        """Verify endpoint should accept high-confidence data"""
        request_data = {
            "entityId": "match_001",
            "entityType": "match",
            "game": "valorant",
            "sources": [
                {
                    "sourceType": "pandascore_api",
                    "trustLevel": "HIGH",
                    "weight": 1.0,
                    "data": {"final_score": 100, "winner_id": "team_a"},
                    "capturedAt": datetime.utcnow().isoformat()
                }
            ]
        }
        response = client.post("/v1/verify", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["entityId"] == "match_001"
        assert data["status"] in ["ACCEPTED", "FLAGGED"]

    def test_verify_endpoint_flags_medium_confidence(self):
        """Verify endpoint should flag medium-confidence data"""
        request_data = {
            "entityId": "match_002",
            "entityType": "match",
            "game": "valorant",
            "sources": [
                {
                    "sourceType": "vlr_scrape",
                    "trustLevel": "LOW",
                    "weight": 1.0,
                    "data": {"final_score": 100},
                    "capturedAt": datetime.utcnow().isoformat()
                }
            ]
        }
        response = client.post("/v1/verify", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["FLAGGED", "REJECTED"]

    def test_verify_endpoint_rejects_empty_sources(self):
        """Verify endpoint should reject requests with no sources"""
        request_data = {
            "entityId": "match_003",
            "entityType": "match",
            "game": "valorant",
            "sources": []
        }
        response = client.post("/v1/verify", json=request_data)
        assert response.status_code == 422  # Validation error


class TestReviewQueue:
    """Test review queue operations"""

    def test_review_queue_endpoint_exists(self):
        """Review queue endpoint should be accessible"""
        response = client.get("/v1/review-queue")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_review_queue_pagination(self):
        """Review queue should support pagination"""
        response = client.get("/v1/review-queue?limit=10&offset=0")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_review_queue_filter_by_game(self):
        """Review queue should support game filtering"""
        response = client.get("/v1/review-queue?game=valorant")
        assert response.status_code == 200


class TestStatusEndpoint:
    """Test status checking"""

    def test_status_endpoint_404_for_nonexistent(self):
        """Status endpoint should return 404 for non-existent entities"""
        response = client.get("/v1/status/nonexistent_entity")
        assert response.status_code == 404

    def test_ready_endpoint(self):
        """Ready endpoint should indicate service readiness"""
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data


class TestDistributionPath:
    """Test distribution path logic"""

    def test_high_confidence_uses_path_b(self):
        """ACCEPTED status with high confidence should use PATH_B_LEGACY"""
        request_data = {
            "entityId": "match_004",
            "entityType": "match",
            "game": "valorant",
            "sources": [
                {
                    "sourceType": "pandascore_api",
                    "trustLevel": "HIGH",
                    "weight": 1.0,
                    "data": {"final_score": 100, "winner_id": "team_a"},
                    "capturedAt": datetime.utcnow().isoformat()
                },
                {
                    "sourceType": "video_manual_review",
                    "trustLevel": "HIGH",
                    "weight": 1.0,
                    "data": {"final_score": 100, "winner_id": "team_a"},
                    "capturedAt": datetime.utcnow().isoformat()
                }
            ]
        }
        response = client.post("/v1/verify", json=request_data)
        assert response.status_code == 200
        data = response.json()
        if data["status"] == "ACCEPTED":
            assert data["distributionPath"] in ["PATH_B_LEGACY", "BOTH"]


class TestConflictDetection:
    """Test conflict detection in sources"""

    def test_conflicts_populate_conflict_fields(self):
        """Conflicts should be listed in conflict_fields"""
        request_data = {
            "entityId": "match_005",
            "entityType": "match",
            "game": "valorant",
            "sources": [
                {
                    "sourceType": "pandascore_api",
                    "trustLevel": "HIGH",
                    "weight": 1.0,
                    "data": {"final_score": 100, "winner_id": "team_a", "kills": 50},
                    "capturedAt": datetime.utcnow().isoformat()
                },
                {
                    "sourceType": "vlr_scrape",
                    "trustLevel": "LOW",
                    "weight": 0.5,
                    "data": {"final_score": 100, "winner_id": "team_b", "kills": 40},
                    "capturedAt": datetime.utcnow().isoformat()
                }
            ]
        }
        response = client.post("/v1/verify", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["confidence"]["hasConflicts"] is True


# Test execution
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
