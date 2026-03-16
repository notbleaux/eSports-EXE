"""
Betting Odds Engine — Match odds calculation with live updates.

[Ver001.000]
Formula: Weighted factors with dynamic adjustment and cash-out support.
"""

import logging
from dataclasses import dataclass
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class OddsFormat(Enum):
    DECIMAL = "decimal"      # 1.85, 2.10
    AMERICAN = "american"    # +150, -120
    FRACTIONAL = "fractional"  # 5/4, 6/5


@dataclass
class TeamFactors:
    """Factors contributing to team strength assessment."""
    team_id: str
    win_rate: float              # 0-1, recent 20 matches
    form_score: float            # 0-1, last 5 matches weighted
    map_strength: float          # 0-1, specific map performance
    player_availability: float   # 0-1, roster strength
    fatigue_factor: float        # 0-1, recent match density


@dataclass
class MatchContext:
    """Match-specific context for odds calculation."""
    match_id: str
    team_a_id: str
    team_b_id: str
    game: str                    # "valorant" | "cs2"
    map_id: Optional[str] = None
    tournament_tier: int = 1     # 1=S-Tier, 2=A-Tier, etc.
    match_type: str = "bo3"      # bo1, bo3, bo5


@dataclass
class HeadToHead:
    """Historical matchup data."""
    total_matches: int
    team_a_wins: int
    team_b_wins: int
    draws: int
    recent_form: str  # "WLLWW", etc.


@dataclass
class OddsResult:
    """Complete odds calculation result."""
    match_id: str
    
    # Decimal odds (primary)
    team_a_decimal: float
    team_b_decimal: float
    
    # American odds (display)
    team_a_american: int
    team_b_american: int
    
    # Implied probabilities
    team_a_probability: float
    team_b_probability: float
    
    # Market info
    vig_percentage: float
    margin: float
    
    # Factors used
    team_a_factors: TeamFactors
    team_b_factors: TeamFactors
    head_to_head: HeadToHead
    
    # Dynamic tracking
    is_live: bool
    last_updated: datetime
    confidence_score: float  # 0-1 based on data quality
    
    # Cash-out
    cash_out_available: bool
    cash_out_multiplier: float  # e.g., 0.85 means 85% of potential winnings


class OddsEngine:
    """
    Calculates betting odds for esports matches.
    
    Algorithm:
    1. Gather team factors (win rate, form, map strength)
    2. Apply head-to-head adjustment
    3. Calculate raw probabilities
    4. Apply vig/margin
    5. Convert to target odds format
    6. Enable live updates based on match events
    """
    
    # Weight configuration
    WEIGHTS = {
        "win_rate": 0.30,
        "form": 0.25,
        "head_to_head": 0.20,
        "map_strength": 0.15,
        "fatigue": 0.10,
    }
    
    # Vig configuration
    BASE_VIG = 0.05      # 5% house edge
    DYNAMIC_VIG = 0.03   # Additional 3% for live betting
    
    def __init__(self, db_pool=None, pandascore_client=None):
        self.db = db_pool
        self.pandascore = pandascore_client
        self.live_matches: Dict[str, OddsResult] = {}
    
    async def calculate_odds(
        self,
        context: MatchContext,
        is_live: bool = False,
        current_score: Optional[Dict] = None
    ) -> OddsResult:
        """Calculate odds for a match."""
        logger.info(f"Calculating odds for {context.match_id}")
        
        # Gather team factors
        team_a_factors = await self._get_team_factors(context.team_a_id, context)
        team_b_factors = await self._get_team_factors(context.team_b_id, context)
        
        # Get head-to-head
        h2h = await self._get_head_to_head(context.team_a_id, context.team_b_id)
        
        # Calculate raw scores
        a_score = self._calculate_composite_score(team_a_factors, h2h, is_team_a=True)
        b_score = self._calculate_composite_score(team_b_factors, h2h, is_team_a=False)
        
        # Apply live adjustments if match in progress
        if is_live and current_score:
            a_score, b_score = self._apply_live_adjustment(
                a_score, b_score, current_score, context
            )
        
        # Convert to probabilities
        total_score = a_score + b_score
        a_prob = a_score / total_score if total_score > 0 else 0.5
        b_prob = b_score / total_score if total_score > 0 else 0.5
        
        # Apply vig
        vig = self.BASE_VIG + (self.DYNAMIC_VIG if is_live else 0)
        a_prob_adj, b_prob_adj = self._apply_vig(a_prob, b_prob, vig)
        
        # Convert to decimal odds
        a_decimal = 1 / a_prob_adj if a_prob_adj > 0 else 999
        b_decimal = 1 / b_prob_adj if b_prob_adj > 0 else 999
        
        # Convert to American odds
        a_american = self._decimal_to_american(a_decimal)
        b_american = self._decimal_to_american(b_decimal)
        
        # Calculate cash-out terms
        cash_out_avail = is_live and current_score is not None
        cash_out_mult = 0.85 if cash_out_avail else 0.0
        
        # Confidence based on data quality
        confidence = self._calculate_confidence(team_a_factors, team_b_factors, h2h)
        
        return OddsResult(
            match_id=context.match_id,
            team_a_decimal=round(a_decimal, 2),
            team_b_decimal=round(b_decimal, 2),
            team_a_american=a_american,
            team_b_american=b_american,
            team_a_probability=round(a_prob_adj, 3),
            team_b_probability=round(b_prob_adj, 3),
            vig_percentage=vig,
            margin=round(vig * 100, 1),
            team_a_factors=team_a_factors,
            team_b_factors=team_b_factors,
            head_to_head=h2h,
            is_live=is_live,
            last_updated=datetime.utcnow(),
            confidence_score=confidence,
            cash_out_available=cash_out_avail,
            cash_out_multiplier=cash_out_mult,
        )
    
    async def _get_team_factors(self, team_id: str, context: MatchContext) -> TeamFactors:
        """Gather performance factors for a team."""
        return TeamFactors(
            team_id=team_id,
            win_rate=0.65,
            form_score=0.70,
            map_strength=0.60,
            player_availability=1.0,
            fatigue_factor=0.90,
        )
    
    async def _get_head_to_head(self, team_a_id: str, team_b_id: str) -> HeadToHead:
        """Get historical matchup data."""
        return HeadToHead(
            total_matches=5,
            team_a_wins=3,
            team_b_wins=2,
            draws=0,
            recent_form="WLWLW",
        )
    
    def _calculate_composite_score(self, factors: TeamFactors, h2h: HeadToHead, is_team_a: bool) -> float:
        """Calculate weighted composite strength score."""
        score = (
            factors.win_rate * self.WEIGHTS["win_rate"] +
            factors.form_score * self.WEIGHTS["form"] +
            factors.map_strength * self.WEIGHTS["map_strength"] +
            factors.fatigue_factor * self.WEIGHTS["fatigue"]
        )
        
        if is_team_a:
            h2h_factor = h2h.team_a_wins / max(h2h.total_matches, 1)
        else:
            h2h_factor = h2h.team_b_wins / max(h2h.total_matches, 1)
        
        score += h2h_factor * self.WEIGHTS["head_to_head"]
        score *= factors.player_availability
        
        return max(score, 0.01)
    
    def _apply_live_adjustment(self, a_score: float, b_score: float, current_score: Dict, context: MatchContext) -> tuple:
        """Adjust odds based on current match state."""
        a_maps = current_score.get("team_a", 0)
        b_maps = current_score.get("team_b", 0)
        
        if context.match_type == "bo3":
            if a_maps == 1 and b_maps == 0:
                a_score *= 1.15
            elif b_maps == 1 and a_maps == 0:
                b_score *= 1.15
            elif a_maps == 2:
                a_score *= 1.5
            elif b_maps == 2:
                b_score *= 1.5
        
        return a_score, b_score
    
    def _apply_vig(self, a_prob: float, b_prob: float, vig: float) -> tuple:
        """Apply bookmaker margin to probabilities."""
        total_prob = a_prob + b_prob
        a_norm = a_prob / total_prob
        b_norm = b_prob / total_prob
        
        a_adj = a_norm * (1 - vig)
        b_adj = b_norm * (1 - vig)
        
        return a_adj, b_adj
    
    def _decimal_to_american(self, decimal: float) -> int:
        """Convert decimal odds to American format."""
        if decimal >= 2.0:
            return int((decimal - 1) * 100)
        else:
            return int(-100 / (decimal - 1))
    
    def _calculate_confidence(self, a_factors: TeamFactors, b_factors: TeamFactors, h2h: HeadToHead) -> float:
        """Calculate confidence score based on data quality."""
        confidence = 0.5
        
        if h2h.total_matches >= 5:
            confidence += 0.2
        elif h2h.total_matches >= 3:
            confidence += 0.1
        
        if a_factors.form_score > 0 and b_factors.form_score > 0:
            confidence += 0.15
        
        if a_factors.player_availability == 1.0 and b_factors.player_availability == 1.0:
            confidence += 0.15
        
        return min(confidence, 1.0)
