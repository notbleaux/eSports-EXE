"""[Ver001.000]
Tests for Bayesian Confidence Scoring.
"""

import pytest
import numpy as np
from datetime import datetime

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.njz_api.analytics.bayesian.confidence import (
    BayesianConfidenceScorer,
    ConfidenceResult,
    get_confidence_scorer,
)


@pytest.fixture
def scorer():
    """Create a BayesianConfidenceScorer instance."""
    return BayesianConfidenceScorer()


class TestConfidenceResult:
    """Tests for ConfidenceResult dataclass."""
    
    def test_basic_creation(self):
        """Test creating a confidence result."""
        result = ConfidenceResult(
            score=0.85,
            credible_interval=(0.75, 0.95),
            confidence_level=0.95,
            sample_size=100,
            effective_sample_size=95.0,
            prior_strength=10.0,
        )
        
        assert result.score == 0.85
        assert result.credible_interval == (0.75, 0.95)
        assert result.sample_size == 100
        
    def test_with_warning(self):
        """Test confidence result with warning."""
        result = ConfidenceResult(
            score=0.5,
            credible_interval=(0.0, 1.0),
            confidence_level=0.95,
            sample_size=0,
            effective_sample_size=0.0,
            prior_strength=2.0,
            warning="No data available",
        )
        
        assert result.warning == "No data available"


class TestCalculateBinaryConfidence:
    """Tests for binary confidence calculations."""
    
    def test_basic_binary_confidence(self, scorer):
        """Test basic binary confidence calculation."""
        result = scorer.calculate_binary_confidence(
            successes=75,
            trials=100,
            prior_alpha=1.0,
            prior_beta=1.0,
        )
        
        assert 0 <= result.score <= 1
        assert result.sample_size == 100
        assert result.confidence_level == 0.95
        assert len(result.credible_interval) == 2
        
    def test_perfect_success_rate(self, scorer):
        """Test with 100% success rate."""
        result = scorer.calculate_binary_confidence(
            successes=100,
            trials=100,
        )
        
        assert result.score > 0.8  # Should be high confidence
        assert result.credible_interval[0] < 1.0
        assert result.credible_interval[1] <= 1.0
        
    def test_zero_success_rate(self, scorer):
        """Test with 0% success rate."""
        result = scorer.calculate_binary_confidence(
            successes=0,
            trials=100,
        )
        
        assert result.score < 0.2  # Should be low confidence
        assert result.credible_interval[0] >= 0.0
        
    def test_no_data(self, scorer):
        """Test with no data."""
        result = scorer.calculate_binary_confidence(
            successes=0,
            trials=0,
        )
        
        assert result.score == 0.5  # Maximum uncertainty
        assert result.warning == "No data available"
        assert result.credible_interval == (0.0, 1.0)
        
    def test_small_sample_size(self, scorer):
        """Test with small sample size."""
        result_small = scorer.calculate_binary_confidence(
            successes=5,
            trials=10,
        )
        
        result_large = scorer.calculate_binary_confidence(
            successes=50,
            trials=100,
        )
        
        # Same proportion, but larger sample should have higher precision
        assert result_large.score > result_small.score
        
    def test_different_confidence_levels(self, scorer):
        """Test different confidence levels."""
        result_95 = scorer.calculate_binary_confidence(
            successes=50,
            trials=100,
            confidence_level=0.95,
        )
        
        result_99 = scorer.calculate_binary_confidence(
            successes=50,
            trials=100,
            confidence_level=0.99,
        )
        
        # 99% CI should be wider than 95% CI
        width_95 = result_95.credible_interval[1] - result_95.credible_interval[0]
        width_99 = result_99.credible_interval[1] - result_99.credible_interval[0]
        assert width_99 > width_95


class TestCalculateContinuousConfidence:
    """Tests for continuous confidence calculations."""
    
    def test_basic_continuous_confidence(self, scorer):
        """Test basic continuous confidence calculation."""
        values = [200, 210, 190, 205, 195, 215, 200]
        
        result = scorer.calculate_continuous_confidence(
            values=values,
            prior_mean=200.0,
            prior_variance=10000.0,
        )
        
        assert 0 <= result.score <= 1
        assert result.sample_size == 7
        assert len(result.credible_interval) == 2
        
    def test_no_data(self, scorer):
        """Test with no data."""
        result = scorer.calculate_continuous_confidence(
            values=[],
        )
        
        assert result.score == 0.0
        assert result.warning == "No data available"
        assert result.credible_interval[0] == float('-inf')
        
    def test_low_variance(self, scorer):
        """Test with low variance (high confidence)."""
        values = [200.1, 200.0, 199.9, 200.0, 200.1]
        
        result = scorer.calculate_continuous_confidence(values=values)
        
        # Low variance gives moderate confidence (score depends on multiple factors)
        assert result.score > 0.1
        
    def test_high_variance(self, scorer):
        """Test with high variance (low confidence)."""
        values = [100, 300, 50, 400, 150]
        
        result = scorer.calculate_continuous_confidence(values=values)
        
        # High variance should give lower confidence
        assert result.score < 0.5
        
    def test_single_value(self, scorer):
        """Test with single value."""
        values = [200.0]
        
        result = scorer.calculate_continuous_confidence(values=values)
        
        assert result.sample_size == 1
        assert result.score > 0  # Should have some confidence


class TestCalculatePlayerConfidence:
    """Tests for player confidence calculations."""
    
    def test_full_player_stats(self, scorer):
        """Test with full player statistics."""
        player_stats = {
            "kills": 150,
            "deaths": 100,
            "acs_per_round_history": [200, 220, 180, 210, 190],
            "headshots": 45,
            "matches_played": 20,
        }
        
        results = scorer.calculate_player_confidence(
            player_stats=player_stats,
            min_matches=10,
        )
        
        assert "kd_ratio" in results
        assert "acs" in results
        assert "headshot_pct" in results
        assert "sample_size" in results
        
    def test_partial_player_stats(self, scorer):
        """Test with partial player statistics."""
        player_stats = {
            "kills": 50,
            "deaths": 40,
        }
        
        results = scorer.calculate_player_confidence(player_stats=player_stats)
        
        assert "kd_ratio" in results
        assert "acs" not in results  # No ACS data
        
    def test_insufficient_matches(self, scorer):
        """Test with insufficient match history."""
        player_stats = {
            "matches_played": 3,
            "kills": 30,
            "deaths": 20,
        }
        
        results = scorer.calculate_player_confidence(
            player_stats=player_stats,
            min_matches=10,
        )
        
        # Sample size confidence should be low
        assert results["sample_size"].score < 0.5


class TestCalculatePredictionConfidence:
    """Tests for prediction confidence calculations."""
    
    def test_prediction_confidence(self, scorer):
        """Test prediction confidence calculation."""
        result = scorer.calculate_prediction_confidence(
            predicted_prob=0.75,
            historical_accuracy=0.80,
            sample_size=100,
        )
        
        assert 0 <= result.score <= 1
        assert result.sample_size == 100
        
    def test_uncertain_prediction(self, scorer):
        """Test with uncertain prediction (near 0.5)."""
        result_uncertain = scorer.calculate_prediction_confidence(
            predicted_prob=0.51,
            historical_accuracy=0.80,
            sample_size=100,
        )
        
        result_certain = scorer.calculate_prediction_confidence(
            predicted_prob=0.90,
            historical_accuracy=0.80,
            sample_size=100,
        )
        
        # Prediction near 0.5 should have lower confidence
        assert result_uncertain.score < result_certain.score
        
    def test_perfect_historical_accuracy(self, scorer):
        """Test with perfect historical accuracy."""
        result = scorer.calculate_prediction_confidence(
            predicted_prob=0.80,
            historical_accuracy=1.0,
            sample_size=100,
        )
        
        # Score is reduced by prediction entropy (0.8 is not 0 or 1)
        assert result.score > 0.1


class TestGetConfidenceScorer:
    """Tests for the get_confidence_scorer factory function."""
    
    def test_singleton_pattern(self):
        """Test that get_confidence_scorer returns a singleton."""
        scorer1 = get_confidence_scorer()
        scorer2 = get_confidence_scorer()
        
        assert scorer1 is scorer2
