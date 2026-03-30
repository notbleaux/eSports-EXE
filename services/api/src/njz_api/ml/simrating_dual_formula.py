[Ver001.000] [Part: 1/7, Phase: 1/3, Progress: 15%] [Status: On-Going]

"""
Dual SimRating™ Formula Implementation
======================================

This module implements BOTH formula variants:
1. FULL 5-Component Formula (SKILL.md specification)
2. SIMPLIFIED 4-Component Formula (MVP fallback)

Integration Strategy:
- Use 4-component for MVP launch (faster, simpler)
- Use 5-component for v2 enhanced analytics
- Both share common infrastructure (CI calculation, validation)

Author: Technical Lead
Date: 2026-03-30
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Literal
from enum import Enum
import numpy as np
from datetime import datetime


class FormulaVersion(Enum):
    """Available SimRating formula versions"""
    V2_5_COMPONENT = "v2_5c"  # Full SKILL.md specification
    V2_4_COMPONENT = "v2_4c"  # Simplified MVP version
    V1_HEURISTIC = "v1"       # Legacy fallback


class ConfidenceTier(Enum):
    """Statistical confidence levels (Color-coded)"""
    CRITICAL = "critical"      # Red - High risk, insufficient data
    ELEVATED = "elevated"      # Orange - Medium risk, limited sample
    MODERATE = "moderate"      # Yellow - Acceptable, moderate sample
    STABLE = "stable"          # Green - Good confidence
    VERIFIED = "verified"      # Blue - Excellent, large sample


@dataclass
class PlayerMatchStats:
    """Comprehensive match statistics for both formulas"""
    # Core combat
    kills: int
    deaths: int
    assists: int
    headshots: int
    damage_dealt: int
    damage_taken: int
    acs: float  # Average Combat Score
    
    # Round impact
    rounds_played: int
    rounds_won: int
    first_bloods: int
    first_deaths: int
    clutches_won: int
    clutches_attempted: int
    
    # Economy (for 5-component)
    eco_rounds_played: int
    eco_rounds_won: int
    full_buy_rounds: int
    full_buy_wins: int
    total_credits_spent: int
    
    # Support (for 5-component)
    assists_per_round: float
    utility_damage: int
    enemies_flashed: int
    teammates_flashed: int
    
    # Entry (for 5-component)
    entry_attempts: int
    entry_successes: int
    entry_kills: int
    entry_deaths: int
    
    # Meta
    game: Literal["valorant", "cs2"]
    agent: Optional[str] = None
    map: Optional[str] = None
    timestamp: datetime = None
    match_id: Optional[str] = None


@dataclass
class SimRatingResult:
    """Rating result with confidence and risk staging"""
    score: float  # 0-100
    grade: str  # S, A, B, C, D, F
    
    # Confidence (for internal use - NOT displayed to users)
    confidence_interval: Tuple[float, float]
    confidence_tier: ConfidenceTier
    sample_size: int
    
    # Component breakdown (can be displayed)
    components: Dict[str, float]
    component_weights: Dict[str, float]
    
    # Risk staging (DISPLAYED to users)
    risk_stage: str  # Stage 1-5
    risk_color: str  # Color code
    reliability_indicator: str  # Visual indicator only
    
    # Metadata
    formula_version: FormulaVersion
    calculated_at: datetime
    
    def to_user_facing(self) -> Dict:
        """Return user-facing representation (no raw numbers)"""
        return {
            "score": self.score,
            "grade": self.grade,
            "stage": self.risk_stage,
            "indicator": self.reliability_indicator,
            "color": self.risk_color,
            "components": self.components,  # Relative weights shown
        }


class RiskStagingFramework:
    """
    Risk staging framework for user-facing display.
    Maps internal confidence to user-friendly stages WITHOUT revealing %.
    """
    
    STAGES = {
        # Stage 5: Critical Risk (Red)
        # Very high uncertainty - major caution advised
        "stage_5": {
            "name": "Stage 5: Emerging",
            "color": "#DC2626",  # Red-600
            "indicator": "◆◆◆◆◇",
            "message": "Limited data available - rating is preliminary",
            "ci_internal_range": (15, float('inf')),  # Wide CI (internal only)
            "sample_threshold": 5,
        },
        
        # Stage 4: Elevated Risk (Orange)
        # High uncertainty - use with caution
        "stage_4": {
            "name": "Stage 4: Developing",
            "color": "#EA580C",  # Orange-600
            "indicator": "◆◆◆◇◇",
            "message": "Growing dataset - reliability improving",
            "ci_internal_range": (10, 15),
            "sample_threshold": 10,
        },
        
        # Stage 3: Moderate (Yellow)
        # Moderate uncertainty - acceptable for general use
        "stage_3": {
            "name": "Stage 3: Established",
            "color": "#CA8A04",  # Yellow-600
            "indicator": "◆◆◆◆◇",
            "message": "Reliable rating with sufficient sample",
            "ci_internal_range": (5, 10),
            "sample_threshold": 20,
        },
        
        # Stage 2: Stable (Green)
        # Low uncertainty - highly reliable
        "stage_2": {
            "name": "Stage 2: Verified",
            "color": "#16A34A",  # Green-600
            "indicator": "◆◆◆◆◆",
            "message": "High confidence rating",
            "ci_internal_range": (2.5, 5),
            "sample_threshold": 50,
        },
        
        # Stage 1: Verified (Blue)
        # Very low uncertainty - excellent reliability
        "stage_1": {
            "name": "Stage 1: Elite",
            "color": "#2563EB",  # Blue-600
            "indicator": "★★★★★",
            "message": "Exceptional data quality - premier rating",
            "ci_internal_range": (0, 2.5),
            "sample_threshold": 100,
        },
    }
    
    @classmethod
    def stage_from_internal_metrics(
        cls,
        sample_size: int,
        ci_width: float  # Internal only - never displayed
    ) -> Tuple[str, str, str, str]:
        """
        Map internal metrics to user-facing stage.
        
        Args:
            sample_size: Number of matches in calculation
            ci_width: Confidence interval width (internal only)
            
        Returns:
            (stage_name, color, indicator, message) - All user-facing
        """
        # Priority: sample size first, then CI width
        for stage_key, stage_info in cls.STAGES.items():
            if sample_size >= stage_info["sample_threshold"]:
                # Additional check: CI must be within range for this stage
                ci_min, ci_max = stage_info["ci_internal_range"]
                if ci_min <= ci_width < ci_max:
                    return (
                        stage_info["name"],
                        stage_info["color"],
                        stage_info["indicator"],
                        stage_info["message"]
                    )
        
        # Default to highest risk if no match
        default = cls.STAGES["stage_5"]
        return (
            default["name"],
            default["color"],
            default["indicator"],
            default["message"]
        )


class SimRatingCalculatorFiveComponent:
    """
    FULL 5-Component SimRating Formula (SKILL.md specification)
    
    Components:
    1. Combat Efficiency (25%) - KD, ADR, First Bloods
    2. Economic Impact (20%) - Buy efficiency, Save conversion
    3. Clutch Performance (20%) - Win rate in low-man situations
    4. Support Contribution (20%) - Assists, utility, teamplay
    5. Entry Fragging (15%) - Opening duels, space creation
    """
    
    WEIGHTS = {
        'combat': 0.25,
        'economy': 0.20,
        'clutch': 0.20,
        'support': 0.20,
        'entry': 0.15
    }
    
    def calculate(self, matches: List[PlayerMatchStats]) -> SimRatingResult:
        """Calculate full 5-component SimRating"""
        if len(matches) < 3:
            return self._insufficient_data_result()
        
        # Calculate components
        combat = self._combat_efficiency(matches)
        economy = self._economic_impact(matches)
        clutch = self._clutch_performance(matches)
        support = self._support_contribution(matches)
        entry = self._entry_fragging(matches)
        
        # Weighted sum
        score = (
            combat['normalized'] * self.WEIGHTS['combat'] * 100 +
            economy['normalized'] * self.WEIGHTS['economy'] * 100 +
            clutch['normalized'] * self.WEIGHTS['clutch'] * 100 +
            support['normalized'] * self.WEIGHTS['support'] * 100 +
            entry['normalized'] * self.WEIGHTS['entry'] * 100
        )
        
        # Confidence interval (internal only)
        ci_lower, ci_upper = self._bootstrap_ci(matches)
        ci_width = ci_upper - ci_lower
        
        # Risk staging (user-facing)
        stage, color, indicator, message = RiskStagingFramework.stage_from_internal_metrics(
            len(matches), ci_width
        )
        
        return SimRatingResult(
            score=round(score, 2),
            grade=self._score_to_grade(score),
            confidence_interval=(round(ci_lower, 2), round(ci_upper, 2)),
            confidence_tier=self._tier_from_ci(ci_width, len(matches)),
            sample_size=len(matches),
            components={
                'Combat Efficiency': round(combat['raw'], 1),
                'Economic Impact': round(economy['raw'], 1),
                'Clutch Performance': round(clutch['raw'], 1),
                'Support Contribution': round(support['raw'], 1),
                'Entry Fragging': round(entry['raw'], 1)
            },
            component_weights=self.WEIGHTS,
            risk_stage=stage,
            risk_color=color,
            reliability_indicator=indicator,
            formula_version=FormulaVersion.V2_5_COMPONENT,
            calculated_at=datetime.now()
        )
    
    def _combat_efficiency(self, matches: List[PlayerMatchStats]) -> Dict:
        """Component 1: Combat Efficiency (25%)"""
        total_kills = sum(m.kills for m in matches)
        total_deaths = sum(m.deaths for m in matches)
        total_damage = sum(m.damage_dealt for m in matches)
        total_rounds = sum(m.rounds_played for m in matches)
        total_fb = sum(m.first_bloods for m in matches)
        
        # K/D with smoothing
        kd = total_kills / max(total_deaths, 1)
        
        # ADR (Average Damage per Round)
        adr = total_damage / max(total_rounds, 1)
        
        # First blood rate
        fb_rate = total_fb / max(total_rounds, 1)
        
        # Composite score (normalized 0-25)
        raw = (kd * 8) + (adr / 10) + (fb_rate * 50)
        normalized = min(raw, 25.0)
        
        return {'raw': raw, 'normalized': normalized, 'kd': kd, 'adr': adr}
    
    def _economic_impact(self, matches: List[PlayerMatchStats]) -> Dict:
        """Component 2: Economic Impact (20%)"""
        eco_rounds = sum(m.eco_rounds_played for m in matches)
        eco_wins = sum(m.eco_rounds_won for m in matches)
        full_buy_rounds = sum(m.full_buy_rounds for m in matches)
        full_buy_wins = sum(m.full_buy_wins for m in matches)
        
        # Eco conversion rate
        eco_conversion = eco_wins / max(eco_rounds, 1)
        
        # Full buy efficiency
        buy_efficiency = full_buy_wins / max(full_buy_rounds, 1)
        
        # Composite
        raw = (eco_conversion * 15) + (buy_efficiency * 10)
        normalized = min(raw, 25.0)
        
        return {'raw': raw, 'normalized': normalized}
    
    def _clutch_performance(self, matches: List[PlayerMatchStats]) -> Dict:
        """Component 3: Clutch Performance (20%)"""
        total_clutches = sum(m.clutches_attempted for m in matches)
        won_clutches = sum(m.clutches_won for m in matches)
        
        # Clutch win rate
        clutch_rate = won_clutches / max(total_clutches, 1)
        
        # Volume bonus (more clutches = more reliable)
        volume_factor = min(total_clutches / 10, 1.0)
        
        raw = (clutch_rate * 20) + (volume_factor * 5)
        normalized = min(raw, 25.0)
        
        return {'raw': raw, 'normalized': normalized}
    
    def _support_contribution(self, matches: List[PlayerMatchStats]) -> Dict:
        """Component 4: Support Contribution (20%)"""
        total_assists = sum(m.assists for m in matches)
        total_rounds = sum(m.rounds_played for m in matches)
        utility_dmg = sum(m.utility_damage for m in matches)
        enemies_flashed = sum(m.enemies_flashed for m in matches)
        
        # Assists per round
        apr = total_assists / max(total_rounds, 1)
        
        # Utility impact
        utility_score = (utility_dmg / 100) + (enemies_flashed / 10)
        
        raw = (apr * 15) + utility_score
        normalized = min(raw, 25.0)
        
        return {'raw': raw, 'normalized': normalized}
    
    def _entry_fragging(self, matches: List[PlayerMatchStats]) -> Dict:
        """Component 5: Entry Fragging (15%)"""
        entry_attempts = sum(m.entry_attempts for m in matches)
        entry_successes = sum(m.entry_successes for m in matches)
        entry_kills = sum(m.entry_kills for m in matches)
        
        # Entry success rate
        success_rate = entry_successes / max(entry_attempts, 1)
        
        # Entry volume
        volume = min(entry_kills / 20, 1.0)  # Cap at 20 entry kills
        
        raw = (success_rate * 20) + (volume * 5)
        normalized = min(raw, 25.0)
        
        return {'raw': raw, 'normalized': normalized}
    
    def _bootstrap_ci(self, matches: List[PlayerMatchStats], n_bootstrap: int = 1000) -> Tuple[float, float]:
        """Calculate bootstrap confidence interval (internal only)"""
        if len(matches) < 10:
            return 0.0, 100.0  # Wide CI for small samples
        
        scores = []
        n = len(matches)
        
        for _ in range(n_bootstrap):
            resampled = np.random.choice(matches, size=n, replace=True)
            result = self.calculate(resampled.tolist())
            scores.append(result.score)
        
        return np.percentile(scores, 2.5), np.percentile(scores, 97.5)
    
    def _score_to_grade(self, score: float) -> str:
        """Convert score to letter grade"""
        if score >= 90: return "S"
        if score >= 80: return "A"
        if score >= 70: return "B"
        if score >= 60: return "C"
        if score >= 50: return "D"
        return "F"
    
    def _tier_from_ci(self, ci_width: float, n: int) -> ConfidenceTier:
        """Determine confidence tier (internal)"""
        if n < 5:
            return ConfidenceTier.CRITICAL
        elif n >= 50 and ci_width < 5:
            return ConfidenceTier.VERIFIED
        elif n >= 20 and ci_width < 10:
            return ConfidenceTier.STABLE
        elif n >= 10 and ci_width < 15:
            return ConfidenceTier.MODERATE
        else:
            return ConfidenceTier.ELEVATED
    
    def _insufficient_data_result(self) -> SimRatingResult:
        """Return result for insufficient sample size"""
        return SimRatingResult(
            score=0.0,
            grade="?",
            confidence_interval=(0.0, 100.0),
            confidence_tier=ConfidenceTier.CRITICAL,
            sample_size=0,
            components={},
            component_weights=self.WEIGHTS,
            risk_stage="Stage 5: Emerging",
            risk_color="#DC2626",
            reliability_indicator="◆◆◆◆◇",
            formula_version=FormulaVersion.V2_5_COMPONENT,
            calculated_at=datetime.now()
        )


class SimRatingCalculatorFourComponent:
    """
    SIMPLIFIED 4-Component SimRating Formula (MVP version)
    
    Components:
    1. Combat Efficiency (30%) - K/D, ACS
    2. Round Impact (25%) - ACS, consistency proxy
    3. Consistency (25%) - Performance variance
    4. Precision (20%) - Headshot percentage
    """
    
    WEIGHTS = {
        'combat': 0.30,
        'impact': 0.25,
        'consistency': 0.25,
        'precision': 0.20
    }
    
    def calculate(self, matches: List[PlayerMatchStats]) -> SimRatingResult:
        """Calculate simplified 4-component SimRating"""
        if len(matches) < 3:
            return self._insufficient_data_result()
        
        # Calculate components (simpler, fewer inputs)
        combat = self._combat_efficiency_simple(matches)
        impact = self._round_impact_simple(matches)
        consistency = self._consistency_simple(matches)
        precision = self._precision_simple(matches)
        
        # Weighted sum
        score = (
            combat['normalized'] * self.WEIGHTS['combat'] * 100 +
            impact['normalized'] * self.WEIGHTS['impact'] * 100 +
            consistency['normalized'] * self.WEIGHTS['consistency'] * 100 +
            precision['normalized'] * self.WEIGHTS['precision'] * 100
        )
        
        # Confidence interval (internal only)
        ci_lower, ci_upper = self._bootstrap_ci(matches)
        ci_width = ci_upper - ci_lower
        
        # Risk staging (user-facing)
        stage, color, indicator, message = RiskStagingFramework.stage_from_internal_metrics(
            len(matches), ci_width
        )
        
        return SimRatingResult(
            score=round(score, 2),
            grade=self._score_to_grade(score),
            confidence_interval=(round(ci_lower, 2), round(ci_upper, 2)),
            confidence_tier=self._tier_from_ci(ci_width, len(matches)),
            sample_size=len(matches),
            components={
                'Combat Efficiency': round(combat['raw'], 1),
                'Round Impact': round(impact['raw'], 1),
                'Consistency': round(consistency['raw'], 1),
                'Precision': round(precision['raw'], 1)
            },
            component_weights=self.WEIGHTS,
            risk_stage=stage,
            risk_color=color,
            reliability_indicator=indicator,
            formula_version=FormulaVersion.V2_4_COMPONENT,
            calculated_at=datetime.now()
        )
    
    def _combat_efficiency_simple(self, matches: List[PlayerMatchStats]) -> Dict:
        """Simplified combat: K/D and ACS only"""
        total_kills = sum(m.kills for m in matches)
        total_deaths = sum(m.deaths for m in matches)
        avg_acs = np.mean([m.acs for m in matches])
        
        kd = total_kills / max(total_deaths, 1)
        
        # Normalize: 2.0 KD = max, 300 ACS = max
        kd_score = min(kd / 2.0, 1.0) * 12.5
        acs_score = min(avg_acs / 300.0, 1.0) * 12.5
        
        raw = kd_score + acs_score
        return {'raw': raw, 'normalized': raw, 'kd': kd, 'acs': avg_acs}
    
    def _round_impact_simple(self, matches: List[PlayerMatchStats]) -> Dict:
        """Simplified impact: ACS normalized"""
        avg_acs = np.mean([m.acs for m in matches])
        raw = min(avg_acs / 300.0 * 25, 25.0)
        return {'raw': raw, 'normalized': raw}
    
    def _consistency_simple(self, matches: List[PlayerMatchStats]) -> Dict:
        """Simplified consistency: ACS variance"""
        acs_values = [m.acs for m in matches]
        mean_acs = np.mean(acs_values)
        std_acs = np.std(acs_values)
        
        cv = std_acs / mean_acs if mean_acs > 0 else 1.0
        raw = max(0, 25 - (cv * 50))
        return {'raw': raw, 'normalized': raw, 'cv': cv}
    
    def _precision_simple(self, matches: List[PlayerMatchStats]) -> Dict:
        """Simplified precision: Headshot %"""
        total_kills = sum(m.kills for m in matches)
        total_hs = sum(m.headshots for m in matches)
        
        hs_pct = total_hs / max(total_kills, 1)
        raw = hs_pct * 25 * 3.33  # 30% HS = 25 points
        return {'raw': min(raw, 25), 'normalized': min(raw, 25)}
    
    def _bootstrap_ci(self, matches: List[PlayerMatchStats], n_bootstrap: int = 1000) -> Tuple[float, float]:
        """Simplified bootstrap for 4-component"""
        if len(matches) < 10:
            return 0.0, 100.0
        
        scores = []
        n = len(matches)
        
        for _ in range(n_bootstrap):
            resampled = np.random.choice(matches, size=n, replace=True)
            result = self.calculate(resampled.tolist())
            scores.append(result.score)
        
        return np.percentile(scores, 2.5), np.percentile(scores, 97.5)
    
    def _score_to_grade(self, score: float) -> str:
        if score >= 90: return "S"
        if score >= 80: return "A"
        if score >= 70: return "B"
        if score >= 60: return "C"
        if score >= 50: return "D"
        return "F"
    
    def _tier_from_ci(self, ci_width: float, n: int) -> ConfidenceTier:
        if n < 5:
            return ConfidenceTier.CRITICAL
        elif n >= 50 and ci_width < 5:
            return ConfidenceTier.VERIFIED
        elif n >= 20 and ci_width < 10:
            return ConfidenceTier.STABLE
        elif n >= 10 and ci_width < 15:
            return ConfidenceTier.MODERATE
        else:
            return ConfidenceTier.ELEVATED
    
    def _insufficient_data_result(self) -> SimRatingResult:
        return SimRatingResult(
            score=0.0,
            grade="?",
            confidence_interval=(0.0, 100.0),
            confidence_tier=ConfidenceTier.CRITICAL,
            sample_size=0,
            components={},
            component_weights=self.WEIGHTS,
            risk_stage="Stage 5: Emerging",
            risk_color="#DC2626",
            reliability_indicator="◆◆◆◆◇",
            formula_version=FormulaVersion.V2_4_COMPONENT,
            calculated_at=datetime.now()
        )


# Factory function for formula selection
def get_calculator(version: FormulaVersion) -> object:
    """Get appropriate calculator for formula version"""
    if version == FormulaVersion.V2_5_COMPONENT:
        return SimRatingCalculatorFiveComponent()
    elif version == FormulaVersion.V2_4_COMPONENT:
        return SimRatingCalculatorFourComponent()
    else:
        raise ValueError(f"Unknown formula version: {version}")


# Migration helper: Convert 4-component to 5-component
def migrate_to_five_component(
    four_comp_result: SimRatingResult,
    additional_stats: Dict
) -> SimRatingResult:
    """
    Migrate a 4-component rating to 5-component when additional data available.
    
    Args:
        four_comp_result: Existing 4-component rating
        additional_stats: Economy, clutch, support, entry data
        
    Returns:
        New 5-component rating
    """
    # Combine stats
    # ... migration logic ...
    pass
