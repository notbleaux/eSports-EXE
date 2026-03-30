[Ver001.000] [Part: 1/1, Phase: 3/3, Progress: 10%, Status: On-Going]

# Uncertainty Quantification Implementation
## Probabilistic SimRating™ with Prediction Intervals

---

## 1. EXECUTIVE SUMMARY

**Objective:** Replace point estimates with probabilistic outputs including confidence intervals for all SimRating™ predictions.

**Current State:**
```python
# Point estimate only
rating = calculate_simrating(player)  # Returns: 84.3
```

**Target State:**
```python
# Probabilistic output with confidence intervals
rating, ci_lower, ci_upper = calculate_simrating(player, confidence=0.95)
# Returns: rating=84.3, ci_lower=82.1, ci_upper=86.5
# Display: "SimRating 84.3 [82.1, 86.5]"
```

**Benefits:**
- Better risk assessment for predictions
- Transparency in model confidence
- Improved decision-making for users
- Statistical rigor comparable to academic standards

---

## 2. STATISTICAL METHODS

### 2.1 Bootstrap Confidence Intervals

```python
# packages/shared/ml/simrating/uncertainty.py
"""
Uncertainty quantification for SimRating™ using bootstrap resampling.
"""
import numpy as np
from typing import Tuple, List, Dict, Any
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)


@dataclass
class UncertainPrediction:
    """Probabilistic prediction with uncertainty bounds."""
    point_estimate: float
    confidence_level: float
    ci_lower: float
    ci_upper: float
    std_error: float
    sample_size: int
    bootstrap_samples: int
    
    def __str__(self) -> str:
        return f"{self.point_estimate:.1f} [{self.ci_lower:.1f}, {self.ci_upper:.1f}]"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "point_estimate": round(self.point_estimate, 2),
            "confidence_level": self.confidence_level,
            "confidence_interval": [
                round(self.ci_lower, 2),
                round(self.ci_upper, 2)
            ],
            "std_error": round(self.std_error, 3),
            "sample_size": self.sample_size,
            "interpretation": self._interpret()
        }
    
    def _interpret(self) -> str:
        """Human-readable interpretation of uncertainty."""
        width = self.ci_upper - self.ci_lower
        relative_width = width / self.point_estimate * 100
        
        if relative_width < 5:
            return "Very high confidence"
        elif relative_width < 10:
            return "High confidence"
        elif relative_width < 20:
            return "Moderate confidence"
        else:
            return "Low confidence - more data needed"


class BootstrapUncertaintyEstimator:
    """
    Estimate prediction uncertainty using bootstrap resampling.
    
    This is the preferred method for SimRating™ as it makes no
    distributional assumptions and works with any scoring function.
    """
    
    def __init__(
        self,
        n_bootstrap: int = 1000,
        confidence_level: float = 0.95,
        n_jobs: int = -1
    ):
        self.n_bootstrap = n_bootstrap
        self.confidence_level = confidence_level
        self.n_jobs = n_jobs
    
    def estimate(
        self,
        data: List[Dict[str, Any]],
        scoring_func: callable,
        random_state: int = None
    ) -> UncertainPrediction:
        """
        Estimate uncertainty via bootstrap.
        
        Args:
            data: List of match/performance records
            scoring_func: Function that computes rating from data
            random_state: For reproducibility
            
        Returns:
            UncertainPrediction with confidence intervals
        """
        if random_state:
            np.random.seed(random_state)
        
        n = len(data)
        if n < 10:
            logger.warning(f"Small sample size ({n}), confidence intervals may be unreliable")
        
        # Compute point estimate on full data
        point_estimate = scoring_func(data)
        
        # Bootstrap resampling
        bootstrap_estimates = []
        
        for _ in range(self.n_bootstrap):
            # Resample with replacement
            indices = np.random.randint(0, n, size=n)
            resampled = [data[i] for i in indices]
            
            # Compute estimate
            estimate = scoring_func(resampled)
            bootstrap_estimates.append(estimate)
        
        bootstrap_estimates = np.array(bootstrap_estimates)
        
        # Calculate confidence intervals
        alpha = 1 - self.confidence_level
        ci_lower = np.percentile(bootstrap_estimates, alpha/2 * 100)
        ci_upper = np.percentile(bootstrap_estimates, (1 - alpha/2) * 100)
        
        # Standard error
        std_error = np.std(bootstrap_estimates, ddof=1)
        
        return UncertainPrediction(
            point_estimate=point_estimate,
            confidence_level=self.confidence_level,
            ci_lower=ci_lower,
            ci_upper=ci_upper,
            std_error=std_error,
            sample_size=n,
            bootstrap_samples=self.n_bootstrap
        )


class BayesianUncertaintyEstimator:
    """
    Bayesian uncertainty estimation using posterior sampling.
    
    More appropriate when we have prior beliefs about player abilities.
    """
    
    def __init__(
        self,
        prior_mean: float = 50.0,
        prior_std: float = 15.0,
        n_samples: int = 5000
    ):
        self.prior_mean = prior_mean
        self.prior_std = prior_std
        self.n_samples = n_samples
    
    def estimate(
        self,
        observed_scores: List[float],
        confidence_level: float = 0.95
    ) -> UncertainPrediction:
        """
        Estimate uncertainty using Bayesian posterior.
        
        Assumes normal likelihood with unknown mean and variance.
        """
        import scipy.stats as stats
        
        n = len(observed_scores)
        sample_mean = np.mean(observed_scores)
        sample_var = np.var(observed_scores, ddof=1) if n > 1 else 1.0
        
        # Posterior parameters (conjugate normal prior)
        # Prior: N(mu_0, sigma_0^2)
        # Likelihood: N(mu, sigma^2)
        # Posterior for mu: N(mu_n, sigma_n^2)
        
        prior_var = self.prior_std ** 2
        
        # Posterior precision-weighted mean
        posterior_var = 1 / (1/prior_var + n/sample_var)
        posterior_mean = posterior_var * (
            self.prior_mean / prior_var + n * sample_mean / sample_var
        )
        
        # Sample from posterior
        posterior_samples = np.random.normal(
            posterior_mean,
            np.sqrt(posterior_var),
            self.n_samples
        )
        
        # Calculate intervals
        point_estimate = np.mean(posterior_samples)
        alpha = 1 - confidence_level
        ci_lower, ci_upper = np.percentile(
            posterior_samples,
            [alpha/2 * 100, (1 - alpha/2) * 100]
        )
        
        return UncertainPrediction(
            point_estimate=point_estimate,
            confidence_level=confidence_level,
            ci_lower=ci_lower,
            ci_upper=ci_upper,
            std_error=np.sqrt(posterior_var),
            sample_size=n,
            bootstrap_samples=self.n_samples
        )
```

### 2.2 SimRating™ with Uncertainty

```python
# packages/shared/ml/simrating/engine_uncertainty.py
"""
SimRating™ engine with integrated uncertainty quantification.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from .uncertainty import (
    BootstrapUncertaintyEstimator,
    UncertainPrediction
)
from ..features.serving.online import OnlineFeatureStore


class SimRatingEngineWithUncertainty:
    """
    Enhanced SimRating™ engine that outputs confidence intervals.
    """
    
    def __init__(
        self,
        confidence_level: float = 0.95,
        min_matches_for_ci: int = 10
    ):
        self.confidence_level = confidence_level
        self.min_matches = min_matches_for_ci
        self.bootstrap = BootstrapUncertaintyEstimator(
            n_bootstrap=1000,
            confidence_level=confidence_level
        )
    
    async def calculate_player_rating(
        self,
        player_id: str,
        include_uncertainty: bool = True
    ) -> Dict[str, Any]:
        """
        Calculate player SimRating™ with confidence intervals.
        """
        # Get player match history
        matches = await self._get_player_matches(player_id, limit=50)
        
        if len(matches) < self.min_matches:
            # Not enough data for reliable CI
            point_rating = self._calculate_point_rating(matches)
            
            return {
                "player_id": player_id,
                "simrating": {
                    "point_estimate": round(point_rating, 2),
                    "confidence_interval": None,
                    "confidence_level": self.confidence_level,
                    "status": "insufficient_data",
                    "matches_analyzed": len(matches),
                    "matches_required": self.min_matches
                },
                "interpretation": "More matches needed for reliable confidence interval"
            }
        
        if include_uncertainty:
            # Calculate with uncertainty
            uncertain_rating = self.bootstrap.estimate(
                data=matches,
                scoring_func=self._calculate_point_rating,
                random_state=42  # Reproducibility
            )
            
            return {
                "player_id": player_id,
                "simrating": uncertain_rating.to_dict(),
                "matches_analyzed": len(matches),
                "components": self._get_rating_components(matches)
            }
        else:
            # Point estimate only (backward compatibility)
            rating = self._calculate_point_rating(matches)
            return {
                "player_id": player_id,
                "simrating": {
                    "point_estimate": round(rating, 2)
                }
            }
    
    async def predict_match_outcome(
        self,
        team_a_id: str,
        team_b_id: str,
        map_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Predict match outcome with probability and confidence.
        """
        # Get team ratings with uncertainty
        team_a_rating = await self.calculate_team_rating(team_a_id)
        team_b_rating = await self.calculate_team_rating(team_b_id)
        
        # Monte Carlo simulation for win probability
        n_simulations = 10000
        wins_a = 0
        
        for _ in range(n_simulations):
            # Sample from rating distributions
            rating_a = np.random.normal(
                team_a_rating["simrating"]["point_estimate"],
                team_a_rating["simrating"].get("std_error", 5)
            )
            rating_b = np.random.normal(
                team_b_rating["simrating"]["point_estimate"],
                team_b_rating["simrating"].get("std_error", 5)
            )
            
            # Simulate with randomness
            if rating_a + np.random.normal(0, 10) > rating_b:
                wins_a += 1
        
        win_prob_a = wins_a / n_simulations
        win_prob_b = 1 - win_prob_a
        
        # Calculate confidence in prediction
        prediction_confidence = abs(win_prob_a - 0.5) * 2  # 0 to 1 scale
        
        return {
            "matchup": {
                "team_a": team_a_id,
                "team_b": team_b_id,
                "map": map_name
            },
            "prediction": {
                "winner_probability": {
                    team_a_id: round(win_prob_a, 3),
                    team_b_id: round(win_prob_b, 3)
                },
                "predicted_winner": team_a_id if win_prob_a > 0.5 else team_b_id,
                "confidence": self._interpret_confidence(prediction_confidence),
                "confidence_score": round(prediction_confidence, 3)
            },
            "team_ratings": {
                "team_a": team_a_rating["simrating"],
                "team_b": team_b_rating["simrating"]
            }
        }
    
    def _interpret_confidence(self, score: float) -> str:
        """Convert confidence score to human-readable label."""
        if score >= 0.8:
            return "Very High"
        elif score >= 0.6:
            return "High"
        elif score >= 0.4:
            return "Moderate"
        elif score >= 0.2:
            return "Low"
        else:
            return "Very Low - Coin Flip"
    
    def _calculate_point_rating(self, matches: List[Dict]) -> float:
        """Calculate point estimate SimRating™."""
        # Implementation of SimRating v2 formula
        # ... (existing calculation logic)
        pass
    
    async def _get_player_matches(self, player_id: str, limit: int = 50) -> List[Dict]:
        """Fetch player match history."""
        # Database query
        pass


# API Integration
from fastapi import APIRouter

router = APIRouter(prefix="/v1/simrating")

@router.get("/players/{player_id}")
async def get_player_rating_with_uncertainty(
    player_id: str,
    confidence: float = 0.95
):
    """
    Get player SimRating™ with confidence intervals.
    
    Query Parameters:
        confidence: Confidence level for intervals (default 0.95)
    
    Response:
        {
            "player_id": "player_123",
            "simrating": {
                "point_estimate": 84.3,
                "confidence_level": 0.95,
                "confidence_interval": [82.1, 86.5],
                "std_error": 1.1,
                "interpretation": "High confidence"
            },
            "matches_analyzed": 47
        }
    """
    engine = SimRatingEngineWithUncertainty(confidence_level=confidence)
    return await engine.calculate_player_rating(player_id)
```

---

## 3. VISUALIZATION

```typescript
// apps/web/src/components/SimRatingWithUncertainty.tsx
/**
 * Component to display SimRating with confidence visualization.
 */

interface UncertainRating {
  point_estimate: number;
  confidence_level: number;
  confidence_interval: [number, number];
  std_error: number;
  interpretation: string;
}

export const SimRatingDisplay: React.FC<{
  rating: UncertainRating;
  size?: 'sm' | 'md' | 'lg';
}> = ({ rating, size = 'md' }) => {
  const { point_estimate, confidence_interval, interpretation } = rating;
  const [lower, upper] = confidence_interval;
  
  // Calculate visual width of CI
  const range = upper - lower;
  const scale = 100 / (range * 2); // Scale factor for visualization
  
  return (
    <div className={`simrating-display simrating-${size}`}>
      {/* Main rating */}
      <div className="rating-value">
        <span className="score">{point_estimate.toFixed(1)}</span>
        <span className="grade">{getGrade(point_estimate)}</span>
      </div>
      
      {/* Confidence interval visualization */}
      <div className="confidence-bar-container">
        <div className="confidence-range" 
             style={{ 
               left: `${(lower / 100) * 100}%`,
               width: `${(range / 100) * 100}%`
             }}>
          <span className="ci-label">{lower.toFixed(1)} - {upper.toFixed(1)}</span>
        </div>
        <div className="point-estimate-marker" 
             style={{ left: `${(point_estimate / 100) * 100}%` }} />
      </div>
      
      {/* Interpretation */}
      <div className={`confidence-badge confidence-${interpretation.toLowerCase().replace(' ', '-')}`}>
        {interpretation}
      </div>
      
      {/* Tooltip explanation */}
      <Tooltip content={`95% confident true rating is between ${lower.toFixed(1)} and ${upper.toFixed(1)}`}>
        <InfoIcon className="info-icon" />
      </Tooltip>
    </div>
  );
};

// Grade calculation
const getGrade = (rating: number): string => {
  if (rating >= 90) return 'S';
  if (rating >= 80) return 'A';
  if (rating >= 70) return 'B';
  if (rating >= 60) return 'C';
  if (rating >= 50) return 'D';
  return 'F';
};
```

---

## 4. IMPLEMENTATION TIMELINE

### Week 1: Core Infrastructure
- [ ] Implement `BootstrapUncertaintyEstimator`
- [ ] Create `UncertainPrediction` dataclass
- [ ] Add uncertainty to SimRating™ engine

### Week 2: API Integration
- [ ] Add uncertainty endpoints
- [ ] Update response schemas
- [ ] Implement Monte Carlo for match predictions

### Week 3: Frontend
- [ ] Create uncertainty visualization component
- [ ] Update player profile displays
- [ ] Add confidence badges

### Week 4: Validation
- [ ] Test with historical data
- [ ] Validate calibration
- [ ] Document interpretation guidelines

---

## 5. DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | ML Team | Uncertainty quantification plan |

---

*End of Uncertainty Quantification Implementation*
