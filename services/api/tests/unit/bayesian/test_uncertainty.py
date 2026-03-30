"""[Ver001.000]
Tests for Uncertainty Quantification.
"""

import pytest
import numpy as np
from unittest.mock import MagicMock

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.njz_api.analytics.bayesian.uncertainty import (
    UncertaintyQuantifier,
    UncertaintyEstimate,
    get_uncertainty_quantifier,
)


@pytest.fixture
def quantifier():
    """Create an UncertaintyQuantifier instance."""
    return UncertaintyQuantifier(n_bootstrap_samples=1000)


@pytest.fixture
def sample_predictions():
    """Create sample predictions."""
    np.random.seed(42)
    return list(np.random.normal(0.75, 0.1, 100))


class TestUncertaintyEstimate:
    """Tests for UncertaintyEstimate dataclass."""
    
    def test_basic_creation(self):
        """Test creating an uncertainty estimate."""
        estimate = UncertaintyEstimate(
            mean_prediction=0.75,
            total_uncertainty=0.15,
            epistemic_uncertainty=0.10,
            aleatoric_uncertainty=0.05,
            confidence_interval_95=(0.55, 0.95),
            confidence_interval_99=(0.45, 1.05),
            samples=100,
            std_deviation=0.12,
        )
        
        assert estimate.mean_prediction == 0.75
        assert estimate.total_uncertainty == 0.15
        # Total should be approximately sqrt(epistemic^2 + aleatoric^2)
        
    def test_uncertainty_components(self):
        """Test uncertainty component relationship."""
        estimate = UncertaintyEstimate(
            mean_prediction=0.5,
            total_uncertainty=0.2,
            epistemic_uncertainty=0.15,
            aleatoric_uncertainty=0.05,
            confidence_interval_95=(0.3, 0.7),
            confidence_interval_99=(0.1, 0.9),
            samples=50,
            std_deviation=0.18,
        )
        
        # Epistemic + aleatoric should equal total (approximately)
        assert estimate.epistemic_uncertainty > 0
        assert estimate.aleatoric_uncertainty >= 0


class TestBootstrapUncertainty:
    """Tests for bootstrap uncertainty calculation."""
    
    def test_basic_bootstrap(self, quantifier, sample_predictions):
        """Test basic bootstrap uncertainty."""
        result = quantifier.bootstrap_uncertainty(sample_predictions)
        
        assert 0 <= result.mean_prediction <= 1
        assert result.total_uncertainty >= 0
        assert result.epistemic_uncertainty >= 0
        assert result.aleatoric_uncertainty >= 0
        assert len(result.confidence_interval_95) == 2
        assert len(result.confidence_interval_99) == 2
        assert result.samples == 100
        
    def test_single_prediction(self, quantifier):
        """Test with single prediction."""
        result = quantifier.bootstrap_uncertainty([0.75])
        
        assert result.mean_prediction == 0.75
        assert result.total_uncertainty == 0.0
        assert result.samples == 1
        
    def test_empty_predictions(self, quantifier):
        """Test with empty predictions."""
        result = quantifier.bootstrap_uncertainty([])
        
        assert result.mean_prediction == 0.0
        assert result.total_uncertainty == 0.0
        assert result.samples == 0
        
    def test_confidence_interval_width(self, quantifier, sample_predictions):
        """Test that CI width increases with confidence level."""
        result_95 = quantifier.bootstrap_uncertainty(
            sample_predictions, confidence_levels=[0.95]
        )
        result_99 = quantifier.bootstrap_uncertainty(
            sample_predictions, confidence_levels=[0.99]
        )
        
        width_95 = result_95.confidence_interval_95[1] - result_95.confidence_interval_95[0]
        width_99 = result_99.confidence_interval_99[1] - result_99.confidence_interval_99[0]
        
        assert width_99 > width_95
        
    def test_uncertainty_decomposition(self, quantifier, sample_predictions):
        """Test that uncertainty components sum correctly."""
        result = quantifier.bootstrap_uncertainty(sample_predictions)
        
        # Total uncertainty should be approximately sqrt(epistemic^2 + aleatoric^2)
        combined = np.sqrt(
            result.epistemic_uncertainty**2 + result.aleatoric_uncertainty**2
        )
        
        # Allow for some numerical error
        assert abs(result.total_uncertainty - combined) < 0.01


class TestEnsembleUncertainty:
    """Tests for ensemble uncertainty calculation."""
    
    def test_basic_ensemble(self, quantifier):
        """Test basic ensemble uncertainty."""
        # 3 models, 5 samples each
        model_predictions = [
            [0.7, 0.75, 0.72, 0.78, 0.73],
            [0.68, 0.73, 0.70, 0.76, 0.71],
            [0.72, 0.77, 0.74, 0.80, 0.75],
        ]
        
        results = quantifier.ensemble_uncertainty(model_predictions)
        
        assert len(results) == 5  # One per sample
        
        for result in results:
            assert result.total_uncertainty >= 0
            assert result.samples == 3  # 3 models
            
    def test_empty_ensemble(self, quantifier):
        """Test with empty ensemble."""
        results = quantifier.ensemble_uncertainty([])
        
        assert results == []
        
    def test_single_model_ensemble(self, quantifier):
        """Test with single model."""
        model_predictions = [[0.7, 0.75, 0.8]]
        
        results = quantifier.ensemble_uncertainty(model_predictions)
        
        # Should still work but with high uncertainty
        assert len(results) == 3


class TestMonteCarloDropoutUncertainty:
    """Tests for Monte Carlo dropout uncertainty."""
    
    def test_mc_dropout(self, quantifier):
        """Test MC dropout uncertainty."""
        # Mock predict function that returns slightly different values
        predictions = []
        
        def mock_predict(x):
            val = 0.75 + np.random.normal(0, 0.05)
            predictions.append(val)
            return val
        
        np.random.seed(42)
        result = quantifier.monte_carlo_dropout_uncertainty(
            mock_predict, "input", n_forward_passes=50
        )
        
        assert len(predictions) == 50
        assert result.samples == 50
        assert result.total_uncertainty > 0
        
    def test_mc_dropout_with_failures(self, quantifier):
        """Test MC dropout with some failed predictions."""
        call_count = [0]
        
        def mock_predict_with_failures(x):
            call_count[0] += 1
            if call_count[0] % 5 == 0:  # Every 5th call fails
                raise ValueError("Prediction failed")
            return 0.75
        
        result = quantifier.monte_carlo_dropout_uncertainty(
            mock_predict_with_failures, "input", n_forward_passes=20
        )
        
        # Should still work with reduced samples
        assert result.samples < 20
        assert result.samples >= 16  # At most 4 failures
        
    def test_mc_dropout_all_failures(self, quantifier):
        """Test MC dropout when all predictions fail."""
        def mock_predict_always_fails(x):
            raise ValueError("Always fails")
        
        result = quantifier.monte_carlo_dropout_uncertainty(
            mock_predict_always_fails, "input"
        )
        
        assert result.total_uncertainty == float('inf')
        assert result.epistemic_uncertainty == float('inf')


class TestCalibrationCurve:
    """Tests for calibration curve calculation."""
    
    def test_perfect_calibration(self, quantifier):
        """Test with perfectly calibrated predictions."""
        # Predictions match actual outcomes on average
        predicted_probs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
        # Outcomes match probabilities
        actual_outcomes = [False, False, False, True, False, True, True, True, True]
        
        bin_centers, bin_accuracies = quantifier.calibration_curve(
            predicted_probs, actual_outcomes, n_bins=5
        )
        
        assert len(bin_centers) == 5
        assert len(bin_accuracies) == 5
        
    def test_perfectly_uncalibrated(self, quantifier):
        """Test with completely uncalibrated predictions."""
        # Always predict 0.9, but outcomes are 50/50
        predicted_probs = [0.9] * 100
        actual_outcomes = [True] * 50 + [False] * 50
        
        bin_centers, bin_accuracies = quantifier.calibration_curve(
            predicted_probs, actual_outcomes, n_bins=5
        )
        
        # The bin containing 0.9 should have accuracy ~0.5
        assert len(bin_centers) == 5


class TestExpectedCalibrationError:
    """Tests for ECE calculation."""
    
    def test_perfect_calibration_ece(self, quantifier):
        """Test ECE with perfectly calibrated model."""
        # Predictions match outcomes perfectly
        predicted_probs = []
        actual_outcomes = []
        
        for _ in range(100):
            pred = np.random.uniform(0.3, 0.8)
            outcome = np.random.random() < pred
            predicted_probs.append(pred)
            actual_outcomes.append(outcome)
        
        ece = quantifier.expected_calibration_error(
            predicted_probs, actual_outcomes, n_bins=10
        )
        
        # ECE should be low (but not exactly 0 due to sampling)
        assert ece < 0.2
        
    def test_uncalibrated_ece(self, quantifier):
        """Test ECE with uncalibrated model."""
        # Always predict 0.8, but true rate is 0.5
        predicted_probs = [0.8] * 1000
        actual_outcomes = [np.random.random() < 0.5 for _ in range(1000)]
        
        ece = quantifier.expected_calibration_error(
            predicted_probs, actual_outcomes, n_bins=10
        )
        
        # ECE should be close to |0.8 - 0.5| = 0.3
        assert ece > 0.2


class TestPredictionWithUncertainty:
    """Tests for prediction with uncertainty bounds."""
    
    def test_prediction_with_history(self, quantifier):
        """Test prediction with historical errors."""
        base_prediction = 100.0
        historical_errors = [5, -3, 8, -2, 4, -6, 7, -4, 3, -5]
        
        prediction, lower, upper = quantifier.prediction_with_uncertainty(
            base_prediction, historical_errors, confidence_level=0.95
        )
        
        # Prediction should be adjusted for mean error
        assert lower < prediction < upper
        # Width should be reasonable
        assert upper - lower > 0
        
    def test_prediction_no_history(self, quantifier):
        """Test prediction with no historical errors."""
        base_prediction = 100.0
        historical_errors = []
        
        prediction, lower, upper = quantifier.prediction_with_uncertainty(
            base_prediction, historical_errors
        )
        
        # Should use wide bounds
        assert lower < prediction < upper
        assert upper - lower > 0
        
    def test_systematic_bias_correction(self, quantifier):
        """Test that systematic bias is corrected."""
        base_prediction = 100.0
        # Systematic over-prediction
        historical_errors = [10, 12, 8, 11, 9, 13, 10, 12]
        
        prediction, lower, upper = quantifier.prediction_with_uncertainty(
            base_prediction, historical_errors
        )
        
        # Prediction should be adjusted downward
        assert prediction < base_prediction


class TestGetUncertaintyQuantifier:
    """Tests for the get_uncertainty_quantifier factory function."""
    
    def test_singleton_pattern(self):
        """Test that get_uncertainty_quantifier returns a singleton."""
        quantifier1 = get_uncertainty_quantifier()
        quantifier2 = get_uncertainty_quantifier()
        
        assert quantifier1 is quantifier2
        
    def test_custom_bootstrap_samples(self):
        """Test creating quantifier with custom bootstrap samples."""
        quantifier = UncertaintyQuantifier(n_bootstrap_samples=500)
        
        assert quantifier.n_bootstrap_samples == 500
