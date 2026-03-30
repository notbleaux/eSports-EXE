"""
Uncertainty Quantification

Methods for quantifying prediction uncertainty:
- Monte Carlo dropout
- Ensemble uncertainty
- Bootstrap confidence intervals
- Epistemic vs aleatoric uncertainty separation
"""

import logging
from dataclasses import dataclass
from typing import List, Tuple, Optional, Callable
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class UncertaintyEstimate:
    """Uncertainty estimate for a prediction."""
    mean_prediction: float
    total_uncertainty: float  # Combined uncertainty
    epistemic_uncertainty: float  # Model uncertainty (reducible)
    aleatoric_uncertainty: float  # Data noise (irreducible)
    
    # Confidence intervals
    confidence_interval_95: Tuple[float, float]
    confidence_interval_99: Tuple[float, float]
    
    # Sample statistics
    samples: int
    std_deviation: float


class UncertaintyQuantifier:
    """
    Uncertainty quantification for ML predictions.
    
    Separates:
    - Epistemic uncertainty: Model's lack of knowledge (reducible with more data)
    - Aleatoric uncertainty: Inherent randomness in data (irreducible)
    """
    
    def __init__(self, n_bootstrap_samples: int = 1000):
        self.n_bootstrap_samples = n_bootstrap_samples
    
    def bootstrap_uncertainty(
        self,
        predictions: List[float],
        confidence_levels: List[float] = [0.95, 0.99]
    ) -> UncertaintyEstimate:
        """
        Calculate uncertainty using bootstrap resampling.
        
        Args:
            predictions: List of model predictions (e.g., from MC dropout)
            confidence_levels: Confidence levels for intervals
            
        Returns:
            UncertaintyEstimate with all uncertainty components
        """
        if len(predictions) < 2:
            return UncertaintyEstimate(
                mean_prediction=predictions[0] if predictions else 0.0,
                total_uncertainty=0.0,
                epistemic_uncertainty=0.0,
                aleatoric_uncertainty=0.0,
                confidence_interval_95=(0.0, 0.0),
                confidence_interval_99=(0.0, 0.0),
                samples=len(predictions),
                std_deviation=0.0
            )
        
        predictions_array = np.array(predictions)
        mean_pred = np.mean(predictions_array)
        std_pred = np.std(predictions_array, ddof=1)
        
        # Bootstrap for confidence intervals
        bootstrap_means = []
        n = len(predictions)
        
        for _ in range(self.n_bootstrap_samples):
            sample = np.random.choice(predictions_array, size=n, replace=True)
            bootstrap_means.append(np.mean(sample))
        
        bootstrap_means = np.array(bootstrap_means)
        
        # Confidence intervals
        ci_95 = (
            np.percentile(bootstrap_means, 2.5),
            np.percentile(bootstrap_means, 97.5)
        )
        ci_99 = (
            np.percentile(bootstrap_means, 0.5),
            np.percentile(bootstrap_means, 99.5)
        )
        
        # Uncertainty components
        # Total uncertainty = variance of predictions
        total_unc = np.var(predictions_array)
        
        # Epistemic = variance of bootstrap means (model uncertainty)
        epistemic_unc = np.var(bootstrap_means)
        
        # Aleatoric = total - epistemic (remaining noise)
        aleatoric_unc = max(0, total_unc - epistemic_unc)
        
        return UncertaintyEstimate(
            mean_prediction=mean_pred,
            total_uncertainty=np.sqrt(total_unc),
            epistemic_uncertainty=np.sqrt(epistemic_unc),
            aleatoric_uncertainty=np.sqrt(aleatoric_unc),
            confidence_interval_95=ci_95,
            confidence_interval_99=ci_99,
            samples=len(predictions),
            std_deviation=std_pred
        )
    
    def ensemble_uncertainty(
        self,
        model_predictions: List[List[float]]
    ) -> List[UncertaintyEstimate]:
        """
        Calculate uncertainty from ensemble of models.
        
        Args:
            model_predictions: List of predictions from each model
                               Each inner list is predictions for all samples
                               
        Returns:
            List of UncertaintyEstimate (one per sample)
        """
        if not model_predictions or not model_predictions[0]:
            return []
        
        n_models = len(model_predictions)
        n_samples = len(model_predictions[0])
        
        results = []
        
        for i in range(n_samples):
            # Get predictions for this sample from all models
            sample_preds = [model_preds[i] for model_preds in model_predictions]
            
            uncertainty = self.bootstrap_uncertainty(sample_preds)
            results.append(uncertainty)
        
        return results
    
    def monte_carlo_dropout_uncertainty(
        self,
        predict_fn: Callable,
        inputs: any,
        n_forward_passes: int = 100
    ) -> UncertaintyEstimate:
        """
        Calculate uncertainty using Monte Carlo dropout.
        
        Args:
            predict_fn: Function that takes inputs and returns prediction
            inputs: Model inputs
            n_forward_passes: Number of stochastic forward passes
            
        Returns:
            UncertaintyEstimate
        """
        predictions = []
        
        for _ in range(n_forward_passes):
            try:
                pred = predict_fn(inputs)
                predictions.append(float(pred))
            except Exception as e:
                logger.warning(f"MC dropout forward pass failed: {e}")
                continue
        
        if len(predictions) < 2:
            logger.error("Not enough valid predictions for uncertainty quantification")
            return UncertaintyEstimate(
                mean_prediction=0.0,
                total_uncertainty=float('inf'),
                epistemic_uncertainty=float('inf'),
                aleatoric_uncertainty=0.0,
                confidence_interval_95=(0.0, 0.0),
                confidence_interval_99=(0.0, 0.0),
                samples=len(predictions),
                std_deviation=0.0
            )
        
        return self.bootstrap_uncertainty(predictions)
    
    def calibration_curve(
        self,
        predicted_probs: List[float],
        actual_outcomes: List[bool],
        n_bins: int = 10
    ) -> Tuple[List[float], List[float]]:
        """
        Calculate calibration curve for probability predictions.
        
        Args:
            predicted_probs: Predicted probabilities
            actual_outcomes: Actual binary outcomes
            n_bins: Number of calibration bins
            
        Returns:
            (mean_predicted_probs, actual_frequencies)
        """
        bins = np.linspace(0, 1, n_bins + 1)
        bin_centers = (bins[:-1] + bins[1:]) / 2
        
        bin_accuracies = []
        
        for i in range(n_bins):
            bin_lower = bins[i]
            bin_upper = bins[i + 1]
            
            # Find predictions in this bin
            in_bin = [
                (p, a) for p, a in zip(predicted_probs, actual_outcomes)
                if bin_lower <= p < bin_upper or (p == 1.0 and bin_upper == 1.0)
            ]
            
            if in_bin:
                actual_freq = np.mean([a for _, a in in_bin])
            else:
                actual_freq = bin_centers[i]  # No data, assume well-calibrated
            
            bin_accuracies.append(actual_freq)
        
        return bin_centers.tolist(), bin_accuracies
    
    def expected_calibration_error(
        self,
        predicted_probs: List[float],
        actual_outcomes: List[bool],
        n_bins: int = 10
    ) -> float:
        """
        Calculate Expected Calibration Error (ECE).
        
        Lower is better (0 = perfectly calibrated).
        """
        bins = np.linspace(0, 1, n_bins + 1)
        ece = 0.0
        n = len(predicted_probs)
        
        for i in range(n_bins):
            bin_lower = bins[i]
            bin_upper = bins[i + 1]
            
            in_bin = [
                (p, a) for p, a in zip(predicted_probs, actual_outcomes)
                if bin_lower <= p < bin_upper or (p == 1.0 and bin_upper == 1.0)
            ]
            
            if in_bin:
                bin_acc = np.mean([a for _, a in in_bin])
                bin_conf = np.mean([p for p, _ in in_bin])
                bin_weight = len(in_bin) / n
                
                ece += bin_weight * abs(bin_acc - bin_conf)
        
        return ece
    
    def prediction_with_uncertainty(
        self,
        base_prediction: float,
        historical_errors: List[float],
        confidence_level: float = 0.95
    ) -> Tuple[float, float, float]:
        """
        Get prediction with uncertainty bounds.
        
        Args:
            base_prediction: Point prediction
            historical_errors: List of past prediction errors
            confidence_level: Desired confidence level
            
        Returns:
            (prediction, lower_bound, upper_bound)
        """
        if not historical_errors:
            # No history, use wide bounds
            margin = 0.5 * abs(base_prediction)  # 50% margin
            return base_prediction, base_prediction - margin, base_prediction + margin
        
        # Calculate error distribution
        mean_error = np.mean(historical_errors)
        std_error = np.std(historical_errors, ddof=1)
        
        # Adjust prediction for systematic bias
        adjusted_prediction = base_prediction - mean_error
        
        # Calculate margin for confidence level
        z_score = 1.96 if confidence_level == 0.95 else 2.58  # Normal approximation
        margin = z_score * std_error
        
        lower = adjusted_prediction - margin
        upper = adjusted_prediction + margin
        
        return adjusted_prediction, lower, upper


# Global instance
_quantifier: Optional[UncertaintyQuantifier] = None


def get_uncertainty_quantifier() -> UncertaintyQuantifier:
    """Get the global uncertainty quantifier."""
    global _quantifier
    if _quantifier is None:
        _quantifier = UncertaintyQuantifier()
    return _quantifier
