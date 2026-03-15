"""
RAR (Risk-Adjusted Rating) Calculator — The Crown Jewel Metric.

Combines SimRating with volatility and consistency for investment-grade player valuation.

Formula: RAR = SimRating × (1 - Volatility) × Consistency_Bonus × Confidence_Factor

[Ver001.000]
"""
import logging
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime

from .volatility import VolatilityCalculator, VolatilityResult
from .decomposer import RARDecomposer, RARResult as RoleRARResult
from ..simrating.calculator import SimRatingCalculator, SimRatingResult

logger = logging.getLogger(__name__)


@dataclass
class CompleteRARResult:
    """Complete RAR calculation result with all components."""
    # Identifiers
    player_id: str
    player_name: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    
    # Core Metrics
    sim_rating: float = 0.0
    rar_score: float = 0.0
    rar_normalized: float = 0.0  # 0-100 scale
    
    # Components
    volatility_score: float = 0.0  # 0-1 (0 = stable)
    consistency_bonus: float = 1.0  # Multiplier
    confidence_factor: float = 1.0  # Based on sample size
    role_adjustment: float = 1.0  # Based on role difficulty
    
    # Derived Metrics
    investment_grade: str = "D"  # A+, A, B, C, D
    volatility_rating: str = "D"
    consistency_rating: str = "D"
    trend_direction: str = "unknown"
    trend_strength: float = 0.0
    
    # Metadata
    sample_size: int = 0
    calculation_timestamp: Optional[str] = None
    data_freshness_hours: Optional[float] = None
    
    # Risk Assessment
    risk_level: str = "high"  # low, medium, high
    risk_factors: list = None
    
    def __post_init__(self):
        if self.risk_factors is None:
            self.risk_factors = []


class RARCalculator:
    """
    Complete RAR (Risk-Adjusted Rating) Calculator.
    
    The RAR is SATOR's flagship metric for player valuation, combining:
    1. Base SimRating (performance quality)
    2. Volatility adjustment (stability penalty)
    3. Consistency bonus (reliability reward)
    4. Confidence factor (data quality)
    5. Role adjustment (position context)
    
    Target: Investment-grade player ratings for roster decisions,
    fantasy drafts, and betting analysis.
    """
    
    def __init__(self):
        self.sim_calculator = SimRatingCalculator()
        self.volatility_calc = VolatilityCalculator()
        self.role_decomposer = RARDecomposer()
    
    async def calculate(
        self,
        player_id: str,
        # SimRating inputs
        kills_z: float,
        deaths_z: float,
        adjusted_kill_value_z: float,
        adr_z: float,
        kast_pct_z: float,
        # Volatility inputs
        performance_history: list[float],
        history_timestamps: Optional[list[datetime]] = None,
        # Player metadata
        player_name: Optional[str] = None,
        role: Optional[str] = None,
        team: Optional[str] = None,
        # Calculation options
        include_components: bool = True
    ) -> CompleteRARResult:
        """
        Calculate complete RAR with all components.
        
        Args:
            player_id: Unique identifier
            kills_z, deaths_z, etc.: Z-scores for SimRating
            performance_history: List of historical performance scores
            history_timestamps: Optional timestamps for trend analysis
            player_name, role, team: Metadata
            include_components: Whether to calculate full component breakdown
            
        Returns:
            CompleteRARResult with all metrics
        """
        logger.info(f"Calculating RAR for {player_id}")
        
        # 1. Calculate SimRating
        sim_result = self.sim_calculator.calculate(
            kills_z=kills_z,
            deaths_z=deaths_z,
            adjusted_kill_value_z=adjusted_kill_value_z,
            adr_z=adr_z,
            kast_pct_z=kast_pct_z
        )
        
        # 2. Calculate Volatility
        vol_result = self.volatility_calc.calculate(
            player_id=player_id,
            performance_scores=performance_history,
            timestamps=history_timestamps
        )
        
        # 3. Calculate Confidence Factor
        confidence = self._calculate_confidence(len(performance_history))
        
        # 4. Role Adjustment
        role_adj = self._get_role_adjustment(role)
        
        # 5. Calculate RAR
        consistency_bonus = self.volatility_calc.get_consistency_bonus(
            vol_result.volatility_score
        )
        
        rar_score = (
            sim_result.sim_rating *
            (1 - vol_result.volatility_score) *  # Volatility penalty
            consistency_bonus *
            confidence *
            role_adj
        )
        
        # Normalize to 0-100 scale
        rar_normalized = min(max(rar_score * 10, 0), 100)
        
        # Determine investment grade
        investment_grade = self._determine_investment_grade(rar_normalized)
        risk_level = self._assess_risk(
            vol_result.volatility_score,
            confidence,
            vol_result.trend_direction
        )
        
        result = CompleteRARResult(
            player_id=player_id,
            player_name=player_name,
            role=role,
            team=team,
            sim_rating=sim_result.sim_rating,
            rar_score=rar_score,
            rar_normalized=rar_normalized,
            volatility_score=vol_result.volatility_score,
            consistency_bonus=consistency_bonus,
            confidence_factor=confidence,
            role_adjustment=role_adj,
            investment_grade=investment_grade,
            volatility_rating=vol_result.consistency_rating,
            consistency_rating=vol_result.consistency_rating,
            trend_direction=vol_result.trend_direction,
            trend_strength=vol_result.trend_strength,
            sample_size=len(performance_history),
            calculation_timestamp=datetime.utcnow().isoformat(),
            risk_level=risk_level,
            risk_factors=self._identify_risk_factors(
                vol_result, confidence, vol_result.trend_direction
            )
        )
        
        logger.info(
            f"RAR calculation complete for {player_id}: "
            f"RAR={rar_normalized:.1f}, Grade={investment_grade}"
        )
        
        return result
    
    def _calculate_confidence(self, sample_size: int) -> float:
        """
        Calculate confidence factor based on sample size.
        
        More data = higher confidence = less penalization
        """
        if sample_size >= 50:
            return 1.0
        elif sample_size >= 20:
            return 0.95
        elif sample_size >= 10:
            return 0.85
        elif sample_size >= 5:
            return 0.70
        else:
            return 0.50
    
    def _get_role_adjustment(self, role: Optional[str]) -> float:
        """Get role difficulty adjustment factor."""
        if not role:
            return 1.0
        
        # Higher difficulty roles get adjustment
        role_multipliers = {
            "IGL": 1.05,      # In-game leader - high responsibility
            "Entry": 1.03,    # Entry fragger - high risk
            "AWPer": 1.02,    # Primary AWPer - specialized
            "Support": 1.00,  # Support - standard
            "Lurker": 0.98,   # Lurker - lower engagement
        }
        
        return role_multipliers.get(role, 1.0)
    
    def _determine_investment_grade(self, rar_normalized: float) -> str:
        """
        Determine investment grade from normalized RAR score.
        
        Scale:
        - A+: 95-100 (Elite franchise player)
        - A:  85-94  (All-star caliber)
        - B:  70-84  (Above average starter)
        - C:  55-69  (Average/rotation player)
        - D:  Below 55 (Below replacement level)
        """
        if rar_normalized >= 95:
            return "A+"
        elif rar_normalized >= 85:
            return "A"
        elif rar_normalized >= 70:
            return "B"
        elif rar_normalized >= 55:
            return "C"
        else:
            return "D"
    
    def _assess_risk(
        self,
        volatility: float,
        confidence: float,
        trend: str
    ) -> str:
        """Assess overall risk level."""
        risk_score = 0
        
        # Volatility contribution
        if volatility > 0.7:
            risk_score += 3
        elif volatility > 0.5:
            risk_score += 2
        elif volatility > 0.3:
            risk_score += 1
        
        # Confidence contribution
        if confidence < 0.6:
            risk_score += 2
        elif confidence < 0.8:
            risk_score += 1
        
        # Trend contribution
        if trend == "declining":
            risk_score += 2
        elif trend == "improving":
            risk_score -= 1
        
        if risk_score >= 4:
            return "high"
        elif risk_score >= 2:
            return "medium"
        else:
            return "low"
    
    def _identify_risk_factors(
        self,
        vol_result: VolatilityResult,
        confidence: float,
        trend: str
    ) -> list[str]:
        """Identify specific risk factors."""
        factors = []
        
        if vol_result.volatility_score > 0.6:
            factors.append("high_volatility")
        
        if confidence < 0.7:
            factors.append("low_sample_size")
        
        if trend == "declining":
            factors.append("declining_trend")
        
        if vol_result.sample_size < 10:
            factors.append("limited_history")
        
        return factors
    
    async def batch_calculate(
        self,
        players_data: list[Dict[str, Any]]
    ) -> list[CompleteRARResult]:
        """Calculate RAR for multiple players."""
        results = []
        for data in players_data:
            try:
                result = await self.calculate(**data)
                results.append(result)
            except Exception as e:
                logger.error(f"RAR calculation failed: {e}")
                # Return minimal result on error
                results.append(CompleteRARResult(
                    player_id=data.get("player_id", "unknown"),
                    calculation_timestamp=datetime.utcnow().isoformat()
                ))
        return results


# Convenience function
async def calculate_rar(
    player_id: str,
    kills_z: float,
    deaths_z: float,
    adjusted_kill_value_z: float,
    adr_z: float,
    kast_pct_z: float,
    performance_history: list[float],
    **kwargs
) -> CompleteRARResult:
    """Quick RAR calculation."""
    calc = RARCalculator()
    return await calc.calculate(
        player_id=player_id,
        kills_z=kills_z,
        deaths_z=deaths_z,
        adjusted_kill_value_z=adjusted_kill_value_z,
        adr_z=adr_z,
        kast_pct_z=kast_pct_z,
        performance_history=performance_history,
        **kwargs
    )
