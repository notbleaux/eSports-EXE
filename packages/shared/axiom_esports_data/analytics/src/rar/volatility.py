"""
RAR Volatility Calculator — Performance stability metrics for Risk-Adjusted Rating.

[Ver001.000]
"""
import logging
import statistics
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


@dataclass
class VolatilityResult:
    """Volatility calculation result."""
    player_id: str
    coefficient_of_variation: float  # CV = std/mean
    volatility_score: float  # 0-1 scale (0 = stable, 1 = volatile)
    consistency_rating: str  # A+, A, B, C, D
    sample_size: int
    trend_direction: str  # "improving", "declining", "stable"
    trend_strength: float  # 0-1 scale


class VolatilityCalculator:
    """
    Calculates performance volatility for RAR (Risk-Adjusted Rating).
    
    Uses coefficient of variation (CV) normalized to a 0-1 scale.
    Lower volatility = higher consistency bonus in RAR.
    
    Formula:
    - CV = std(performance_scores) / mean(performance_scores)
    - Volatility Score = min(CV, 1.0)  # Cap at 1.0
    - Consistency Bonus = 1 - Volatility Score
    """
    
    # Minimum matches for reliable volatility calculation
    MIN_SAMPLE_SIZE = 5
    
    # Default volatility for new players (high uncertainty)
    DEFAULT_VOLATILITY = 0.5
    
    # Trend calculation window (recent matches vs older matches)
    TRECENT_WINDOW = 5
    
    def calculate(
        self,
        player_id: str,
        performance_scores: List[float],
        timestamps: Optional[List[datetime]] = None
    ) -> VolatilityResult:
        """
        Calculate volatility metrics for a player.
        
        Args:
            player_id: Unique player identifier
            performance_scores: List of performance scores (e.g., SimRatings, ACS)
            timestamps: Optional list of match timestamps for trend analysis
            
        Returns:
            VolatilityResult with CV, volatility score, and consistency rating
        """
        if len(performance_scores) < self.MIN_SAMPLE_SIZE:
            logger.warning(
                f"Insufficient data for {player_id}: {len(performance_scores)} samples, "
                f"using default volatility {self.DEFAULT_VOLATILITY}"
            )
            return VolatilityResult(
                player_id=player_id,
                coefficient_of_variation=self.DEFAULT_VOLATILITY,
                volatility_score=self.DEFAULT_VOLATILITY,
                consistency_rating=self._grade_consistency(1 - self.DEFAULT_VOLATILITY),
                sample_size=len(performance_scores),
                trend_direction="unknown",
                trend_strength=0.0
            )
        
        # Calculate coefficient of variation
        mean_score = statistics.mean(performance_scores)
        
        if mean_score <= 0:
            logger.warning(f"Non-positive mean score for {player_id}: {mean_score}")
            cv = 1.0  # Maximum volatility
        elif len(performance_scores) == 1:
            cv = self.DEFAULT_VOLATILITY
        else:
            try:
                stdev = statistics.stdev(performance_scores)
                cv = stdev / mean_score
            except statistics.StatisticsError:
                cv = 0.0  # All values identical = perfect consistency
        
        # Normalize to 0-1 scale and cap
        volatility_score = min(cv, 1.0)
        consistency_score = 1 - volatility_score
        
        # Calculate trend if timestamps provided
        trend_direction, trend_strength = self._calculate_trend(
            performance_scores, timestamps
        )
        
        return VolatilityResult(
            player_id=player_id,
            coefficient_of_variation=cv,
            volatility_score=volatility_score,
            consistency_rating=self._grade_consistency(consistency_score),
            sample_size=len(performance_scores),
            trend_direction=trend_direction,
            trend_strength=trend_strength
        )
    
    def _grade_consistency(self, consistency_score: float) -> str:
        """
        Convert consistency score to letter grade.
        
        Scale:
        - A+: >= 0.95 (Extremely consistent)
        - A:  >= 0.85 (Very consistent)
        - B:  >= 0.70 (Consistent)
        - C:  >= 0.50 (Moderate consistency)
        - D:  < 0.50 (Inconsistent)
        """
        if consistency_score >= 0.95:
            return "A+"
        elif consistency_score >= 0.85:
            return "A"
        elif consistency_score >= 0.70:
            return "B"
        elif consistency_score >= 0.50:
            return "C"
        else:
            return "D"
    
    def _calculate_trend(
        self,
        scores: List[float],
        timestamps: Optional[List[datetime]]
    ) -> tuple[str, float]:
        """
        Calculate performance trend direction and strength.
        
        Returns:
            Tuple of (direction, strength) where direction is one of:
            "improving", "declining", "stable", "unknown"
            and strength is 0-1 scale.
        """
        if timestamps is None or len(scores) < self.TRECENT_WINDOW * 2:
            return "unknown", 0.0
        
        # Sort by timestamp
        sorted_data = sorted(zip(timestamps, scores), key=lambda x: x[0])
        sorted_scores = [s for _, s in sorted_data]
        
        # Split into recent and older
        recent_scores = sorted_scores[-self.TRECENT_WINDOW:]
        older_scores = sorted_scores[:-self.TRECENT_WINDOW]
        
        if len(older_scores) == 0:
            return "unknown", 0.0
        
        recent_mean = statistics.mean(recent_scores)
        older_mean = statistics.mean(older_scores)
        
        # Calculate trend
        if older_mean == 0:
            return "unknown", 0.0
        
        change_pct = (recent_mean - older_mean) / older_mean
        
        # Determine direction and strength
        if abs(change_pct) < 0.05:  # Less than 5% change = stable
            return "stable", 1.0 - abs(change_pct) / 0.05
        elif change_pct > 0:
            strength = min(change_pct, 1.0)
            return "improving", strength
        else:
            strength = min(abs(change_pct), 1.0)
            return "declining", strength
    
    def get_consistency_bonus(self, volatility_score: float) -> float:
        """
        Calculate consistency bonus multiplier for RAR.
        
        Formula: bonus = 1 + (1 - volatility) * 0.2
        Range: 1.0 to 1.2 (0% to 20% bonus)
        
        Args:
            volatility_score: 0-1 scale (0 = stable, 1 = volatile)
            
        Returns:
            Consistency bonus multiplier
        """
        return 1.0 + (1 - volatility_score) * 0.2
    
    def batch_calculate(
        self,
        player_data: List[tuple[str, List[float], Optional[List[datetime]]]]
    ) -> List[VolatilityResult]:
        """
        Calculate volatility for multiple players.
        
        Args:
            player_data: List of (player_id, scores, timestamps) tuples
            
        Returns:
            List of VolatilityResult objects
        """
        results = []
        for player_id, scores, timestamps in player_data:
            try:
                result = self.calculate(player_id, scores, timestamps)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to calculate volatility for {player_id}: {e}")
                # Return default result on error
                results.append(VolatilityResult(
                    player_id=player_id,
                    coefficient_of_variation=self.DEFAULT_VOLATILITY,
                    volatility_score=self.DEFAULT_VOLATILITY,
                    consistency_rating="D",
                    sample_size=len(scores),
                    trend_direction="unknown",
                    trend_strength=0.0
                ))
        return results


# Convenience function
async def calculate_volatility(
    player_id: str,
    performance_scores: List[float],
    timestamps: Optional[List[datetime]] = None
) -> VolatilityResult:
    """Quick volatility calculation."""
    calculator = VolatilityCalculator()
    return calculator.calculate(player_id, performance_scores, timestamps)
