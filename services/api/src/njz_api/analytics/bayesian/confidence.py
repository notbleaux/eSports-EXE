"""
Bayesian Confidence Scoring

Calculates confidence scores using Bayesian methods with:
- Beta distributions for binary outcomes
- Normal distributions for continuous metrics
- Hierarchical models for player/team levels
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

import numpy as np
from scipy import stats

logger = logging.getLogger(__name__)


@dataclass
class ConfidenceResult:
    """Result of confidence calculation."""
    score: float  # 0.0 to 1.0
    credible_interval: Tuple[float, float]  # (lower, upper)
    confidence_level: float  # e.g., 0.95 for 95%
    sample_size: int
    effective_sample_size: float
    prior_strength: float
    
    # Diagnostics
    convergence_diagnostic: Optional[float] = None
    warning: Optional[str] = None


class BayesianConfidenceScorer:
    """
    Bayesian confidence scoring for predictions and ratings.
    
    Uses conjugate priors for efficient computation:
    - Beta-Binomial for binary outcomes (wins/losses)
    - Normal-Inverse-Gamma for continuous metrics (K/D, ACS)
    """
    
    def __init__(self):
        self._default_prior_strength = 10.0
    
    def calculate_binary_confidence(
        self,
        successes: int,
        trials: int,
        prior_alpha: float = 1.0,
        prior_beta: float = 1.0,
        confidence_level: float = 0.95
    ) -> ConfidenceResult:
        """
        Calculate confidence for binary outcomes using Beta-Binomial.
        
        Args:
            successes: Number of successes
            trials: Total number of trials
            prior_alpha: Beta prior alpha (default 1 = uniform)
            prior_beta: Beta prior beta (default 1 = uniform)
            confidence_level: Credible interval level
            
        Returns:
            ConfidenceResult with score and credible interval
        """
        if trials == 0:
            return ConfidenceResult(
                score=0.5,  # Maximum uncertainty
                credible_interval=(0.0, 1.0),
                confidence_level=confidence_level,
                sample_size=0,
                effective_sample_size=0.0,
                prior_strength=prior_alpha + prior_beta,
                warning="No data available"
            )
        
        # Posterior parameters
        posterior_alpha = prior_alpha + successes
        posterior_beta = prior_beta + (trials - successes)
        
        # Expected value (mean of Beta)
        expected_value = posterior_alpha / (posterior_alpha + posterior_beta)
        
        # Credible interval
        lower = stats.beta.ppf((1 - confidence_level) / 2, posterior_alpha, posterior_beta)
        upper = stats.beta.ppf(1 - (1 - confidence_level) / 2, posterior_alpha, posterior_beta)
        
        # Confidence score based on precision (narrowness of CI)
        interval_width = upper - lower
        precision_score = 1.0 - interval_width
        
        # Sample size penalty (diminishing returns)
        sample_size_score = min(1.0, trials / 100)  # Full confidence at 100+ samples
        
        # Combined score
        score = expected_value * precision_score * sample_size_score
        
        # Effective sample size (accounting for prior)
        ess = trials / (1 + (prior_alpha + prior_beta) / trials)
        
        return ConfidenceResult(
            score=score,
            credible_interval=(lower, upper),
            confidence_level=confidence_level,
            sample_size=trials,
            effective_sample_size=ess,
            prior_strength=prior_alpha + prior_beta
        )
    
    def calculate_continuous_confidence(
        self,
        values: List[float],
        prior_mean: float = 0.0,
        prior_variance: float = 100.0,
        confidence_level: float = 0.95
    ) -> ConfidenceResult:
        """
        Calculate confidence for continuous metrics using Normal-Inverse-Gamma.
        
        Args:
            values: List of observed values
            prior_mean: Prior mean
            prior_variance: Prior variance
            confidence_level: Credible interval level
            
        Returns:
            ConfidenceResult with score and credible interval
        """
        n = len(values)
        
        if n == 0:
            return ConfidenceResult(
                score=0.0,
                credible_interval=(float('-inf'), float('inf')),
                confidence_level=confidence_level,
                sample_size=0,
                effective_sample_size=0.0,
                prior_strength=1.0,
                warning="No data available"
            )
        
        # Sample statistics
        sample_mean = np.mean(values)
        sample_var = np.var(values, ddof=1) if n > 1 else 1.0
        
        # Posterior parameters (Normal-Inverse-Gamma)
        posterior_mean = (prior_mean / prior_variance + n * sample_mean) / (1 / prior_variance + n)
        posterior_var = sample_var / n if n > 1 else prior_variance
        
        # Degrees of freedom for t-distribution
        df = max(1, n - 1)
        
        # Credible interval (Student's t)
        t_value = stats.t.ppf(1 - (1 - confidence_level) / 2, df)
        margin = t_value * np.sqrt(posterior_var)
        
        lower = posterior_mean - margin
        upper = posterior_mean + margin
        
        # Confidence score
        # Higher score for larger sample sizes and lower variance
        cv = np.sqrt(posterior_var) / abs(posterior_mean) if posterior_mean != 0 else float('inf')
        variance_score = 1.0 / (1.0 + cv)  # 1 when CV=0, decreases as CV increases
        sample_size_score = min(1.0, n / 30)  # Full confidence at 30+ samples
        
        score = variance_score * sample_size_score
        
        # Effective sample size
        ess = n / (1 + prior_variance / (n * sample_var)) if sample_var > 0 else n
        
        return ConfidenceResult(
            score=score,
            credible_interval=(lower, upper),
            confidence_level=confidence_level,
            sample_size=n,
            effective_sample_size=ess,
            prior_strength=1.0 / prior_variance
        )
    
    def calculate_player_confidence(
        self,
        player_stats: Dict[str, any],
        min_matches: int = 10
    ) -> Dict[str, ConfidenceResult]:
        """
        Calculate confidence scores for all player metrics.
        
        Args:
            player_stats: Dictionary of player statistics
            min_matches: Minimum matches for full confidence
            
        Returns:
            Dictionary of metric -> ConfidenceResult
        """
        results = {}
        
        # K/D ratio confidence (Beta-Binomial on kills/deaths)
        if 'kills' in player_stats and 'deaths' in player_stats:
            kills = player_stats['kills']
            deaths = player_stats['deaths']
            total_engagements = kills + deaths
            
            # Use Beta(2, 2) as weak prior favoring ~0.5 K/D
            results['kd_ratio'] = self.calculate_binary_confidence(
                successes=kills,
                trials=total_engagements,
                prior_alpha=2.0,
                prior_beta=2.0
            )
        
        # ACS confidence (Normal on round scores)
        if 'acs_per_round_history' in player_stats:
            acs_values = player_stats['acs_per_round_history']
            results['acs'] = self.calculate_continuous_confidence(
                values=acs_values,
                prior_mean=200.0,  # Typical average ACS
                prior_variance=10000.0  # Wide prior
            )
        
        # Headshot % confidence
        if 'headshots' in player_stats and 'kills' in player_stats:
            headshots = player_stats['headshots']
            kills = player_stats['kills']
            
            results['headshot_pct'] = self.calculate_binary_confidence(
                successes=headshots,
                trials=kills,
                prior_alpha=1.0,
                prior_beta=3.0  # Weak prior favoring lower headshot %
            )
        
        # Match count confidence (overall sample size)
        if 'matches_played' in player_stats:
            matches = player_stats['matches_played']
            match_confidence = min(1.0, matches / min_matches)
            results['sample_size'] = ConfidenceResult(
                score=match_confidence,
                credible_interval=(max(0, matches - np.sqrt(matches)), matches + np.sqrt(matches)),
                confidence_level=0.95,
                sample_size=matches,
                effective_sample_size=float(matches),
                prior_strength=0.0
            )
        
        return results
    
    def calculate_prediction_confidence(
        self,
        predicted_prob: float,
        historical_accuracy: float,
        sample_size: int,
        confidence_level: float = 0.95
    ) -> ConfidenceResult:
        """
        Calculate confidence in a prediction.
        
        Combines model confidence with historical performance.
        
        Args:
            predicted_prob: Model's predicted probability (0-1)
            historical_accuracy: Historical accuracy of similar predictions
            sample_size: Number of similar predictions in history
            confidence_level: Credible interval level
            
        Returns:
            ConfidenceResult
        """
        # Beta posterior on prediction accuracy
        # Assume binomial: successes = accurate predictions
        successes = int(historical_accuracy * sample_size)
        
        result = self.calculate_binary_confidence(
            successes=successes,
            trials=sample_size,
            prior_alpha=1.0,
            prior_beta=1.0,
            confidence_level=confidence_level
        )
        
        # Adjust score by prediction uncertainty
        # Predictions near 0.5 are less certain than those near 0 or 1
        prediction_entropy = -predicted_prob * np.log2(predicted_prob + 1e-10) - \
                            (1 - predicted_prob) * np.log2(1 - predicted_prob + 1e-10)
        max_entropy = 1.0  # log2(2) for binary
        prediction_confidence = 1.0 - (prediction_entropy / max_entropy)
        
        # Combined confidence
        result.score = result.score * prediction_confidence
        
        return result


# Global scorer instance
_scorer: Optional[BayesianConfidenceScorer] = None


def get_confidence_scorer() -> BayesianConfidenceScorer:
    """Get the global confidence scorer."""
    global _scorer
    if _scorer is None:
        _scorer = BayesianConfidenceScorer()
    return _scorer
