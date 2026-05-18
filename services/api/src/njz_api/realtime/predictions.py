"""
Prediction Service

Provides match outcome predictions using:
- Historical team performance
- Current match state
- Player form
- Map-specific statistics

[Ver001.000]
"""

import logging
import math
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass

from .schemas import (
    LiveMatchState,
    LivePlayerStats,
    PredictionRequest,
    PredictionResult
)
from ..stats.service import StatsAggregationService

logger = logging.getLogger(__name__)


@dataclass
class PredictionFactors:
    """Factors used in prediction calculation."""
    team_form_weight: float = 0.25
    player_form_weight: float = 0.30
    map_advantage_weight: float = 0.15
    economy_weight: float = 0.15
    momentum_weight: float = 0.15


class PredictionService:
    """
    Service for match outcome predictions.
    
    Uses a weighted combination of factors:
    - Historical team performance (win rates, map stats)
    - Current player form (KDA, ACS from recent matches)
    - Map-specific advantages
    - Current economy state
    - Momentum (recent rounds won)
    """
    
    def __init__(self):
        self.stats_service = StatsAggregationService()
        self.factors = PredictionFactors()
        self._cache: Dict[str, PredictionResult] = {}
    
    async def predict_match(
        self,
        request: PredictionRequest,
        live_state: Optional[LiveMatchState] = None
    ) -> PredictionResult:
        """
        Generate match outcome prediction.
        
        Args:
            request: Prediction request with match context
            live_state: Optional live match state for in-progress matches
            
        Returns:
            Prediction result with probabilities
        """
        match_id = request.match_id
        
        # Calculate individual factor scores (0-1)
        team_form_score = await self._calculate_team_form(
            request.team1_id,
            request.team2_id,
            request.map_id
        )
        
        player_form_score = await self._calculate_player_form(
            request.team1_id,
            request.team2_id,
            live_state.player_stats if live_state else None
        )
        
        map_advantage_score = await self._calculate_map_advantage(
            request.team1_id,
            request.team2_id,
            request.map_id
        )
        
        economy_score = self._calculate_economy_advantage(
            live_state,
            request.current_score_team1,
            request.current_score_team2
        )
        
        momentum_score = self._calculate_momentum(
            request.current_score_team1,
            request.current_score_team2,
            request.rounds_played
        )
        
        # Weighted combination
        team1_score = (
            team_form_score * self.factors.team_form_weight +
            player_form_score * self.factors.player_form_weight +
            map_advantage_score * self.factors.map_advantage_weight +
            economy_score * self.factors.economy_weight +
            momentum_score * self.factors.momentum_weight
        )
        
        # Convert to probability (sigmoid for normalization)
        team1_prob = self._sigmoid((team1_score - 0.5) * 4)
        team2_prob = 1 - team1_prob
        
        # Calculate confidence based on data quality
        confidence = self._calculate_confidence(
            request.rounds_played,
            live_state is not None
        )
        
        # Determine key factors
        key_factors = self._identify_key_factors(
            team_form_score,
            player_form_score,
            map_advantage_score,
            economy_score,
            momentum_score
        )
        
        # Estimate remaining rounds
        estimated_remaining = self._estimate_remaining_rounds(
            request.current_score_team1,
            request.current_score_team2
        )
        
        result = PredictionResult(
            match_id=match_id,
            team1_win_probability=round(team1_prob, 3),
            team2_win_probability=round(team2_prob, 3),
            confidence=round(confidence, 3),
            model_version="v1.0",
            key_factors=key_factors,
            estimated_rounds_remaining=estimated_remaining
        )
        
        # Cache result
        self._cache[match_id] = result
        
        return result
    
    async def predict_live_match(
        self,
        live_state: LiveMatchState
    ) -> PredictionResult:
        """
        Generate prediction for an in-progress match.
        
        Uses current score, player stats, and economy.
        """
        # Get team/player form from database
        team1_players = [
            pid for pid, stats in live_state.player_stats.items()
            if stats.team_id == live_state.team1_id
        ]
        team2_players = [
            pid for pid, stats in live_state.player_stats.items()
            if stats.team_id == live_state.team2_id
        ]
        
        # Calculate team performance metrics
        team1_kda = self._calculate_team_kda(live_state, live_state.team1_id)
        team2_kda = self._calculate_team_kda(live_state, live_state.team2_id)
        
        team1_acs = self._calculate_team_acs(live_state, live_state.team1_id)
        team2_acs = self._calculate_team_acs(live_state, live_state.team2_id)
        
        # Calculate win probability based on score and performance
        score_factor = (live_state.team1_score - live_state.team2_score) * 0.05
        performance_factor = (
            (team1_kda - team2_kda) * 0.1 +
            (team1_acs - team2_acs) / 1000 * 0.1
        )
        
        # Economy factor
        economy_factor = (live_state.team1_bank - live_state.team2_bank) / 10000 * 0.05
        
        # Combine factors
        team1_prob = 0.5 + score_factor + performance_factor + economy_factor
        team1_prob = max(0.05, min(0.95, team1_prob))  # Clamp to 5-95%
        team2_prob = 1 - team1_prob
        
        # Confidence increases as match progresses
        rounds_played = live_state.current_round
        confidence = min(0.9, 0.3 + (rounds_played / 24) * 0.6)
        
        return PredictionResult(
            match_id=live_state.match_id,
            team1_win_probability=round(team1_prob, 3),
            team2_win_probability=round(team2_prob, 3),
            confidence=round(confidence, 3),
            model_version="v1.0-live",
            key_factors=[
                {"factor": "score_advantage", "value": score_factor},
                {"factor": "performance", "value": performance_factor},
                {"factor": "economy", "value": economy_factor}
            ],
            estimated_rounds_remaining=self._estimate_remaining_rounds(
                live_state.team1_score,
                live_state.team2_score
            )
        )
    
    async def _calculate_team_form(
        self,
        team1_id: int,
        team2_id: int,
        map_id: Optional[str]
    ) -> float:
        """
        Calculate relative team form score (0-1).
        
        Returns score > 0.5 if team1 has advantage, < 0.5 if team2 has advantage.
        """
        # This would query historical match data
        # For now, return neutral
        return 0.5
    
    async def _calculate_player_form(
        self,
        team1_id: int,
        team2_id: int,
        live_stats: Optional[Dict[int, LivePlayerStats]]
    ) -> float:
        """Calculate relative player form score."""
        if not live_stats:
            return 0.5
        
        # Aggregate player stats by team
        team1_kda_sum = 0
        team2_kda_sum = 0
        team1_count = 0
        team2_count = 0
        
        for player_id, stats in live_stats.items():
            if stats.team_id == team1_id:
                team1_kda_sum += stats.kda
                team1_count += 1
            elif stats.team_id == team2_id:
                team2_kda_sum += stats.kda
                team2_count += 1
        
        if team1_count == 0 or team2_count == 0:
            return 0.5
        
        team1_avg_kda = team1_kda_sum / team1_count
        team2_avg_kda = team2_kda_sum / team2_count
        
        # Normalize to 0-1 range
        total_kda = team1_avg_kda + team2_avg_kda
        if total_kda == 0:
            return 0.5
        
        return team1_avg_kda / total_kda
    
    async def _calculate_map_advantage(
        self,
        team1_id: int,
        team2_id: int,
        map_id: Optional[str]
    ) -> float:
        """Calculate map-specific advantage."""
        if not map_id:
            return 0.5
        
        # This would query map-specific win rates
        return 0.5
    
    def _calculate_economy_advantage(
        self,
        live_state: Optional[LiveMatchState],
        score1: int,
        score2: int
    ) -> float:
        """Calculate economy-based advantage."""
        if not live_state:
            # Use score as proxy for economy
            return 0.5 + (score1 - score2) * 0.02
        
        total_bank = live_state.team1_bank + live_state.team2_bank
        if total_bank == 0:
            return 0.5
        
        return live_state.team1_bank / total_bank
    
    def _calculate_momentum(
        self,
        score1: int,
        score2: int,
        rounds_played: int
    ) -> float:
        """Calculate momentum factor based on recent performance."""
        if rounds_played == 0:
            return 0.5
        
        # Simple momentum: current score ratio
        total_score = score1 + score2
        if total_score == 0:
            return 0.5
        
        return score1 / total_score
    
    def _calculate_confidence(
        self,
        rounds_played: int,
        has_live_data: bool
    ) -> float:
        """Calculate prediction confidence."""
        base_confidence = 0.5
        
        # Increase confidence as match progresses
        match_progress = min(rounds_played / 20, 1.0)
        base_confidence += match_progress * 0.3
        
        # Bonus for live data
        if has_live_data:
            base_confidence += 0.1
        
        return min(0.95, base_confidence)
    
    def _identify_key_factors(
        self,
        team_form: float,
        player_form: float,
        map_adv: float,
        economy: float,
        momentum: float
    ) -> List[Dict[str, Any]]:
        """Identify and rank the key factors in the prediction."""
        factors = [
            {"name": "team_form", "impact": abs(team_form - 0.5), "advantage": "team1" if team_form > 0.5 else "team2"},
            {"name": "player_form", "impact": abs(player_form - 0.5), "advantage": "team1" if player_form > 0.5 else "team2"},
            {"name": "map_advantage", "impact": abs(map_adv - 0.5), "advantage": "team1" if map_adv > 0.5 else "team2"},
            {"name": "economy", "impact": abs(economy - 0.5), "advantage": "team1" if economy > 0.5 else "team2"},
            {"name": "momentum", "impact": abs(momentum - 0.5), "advantage": "team1" if momentum > 0.5 else "team2"},
        ]
        
        # Sort by impact
        factors.sort(key=lambda x: x["impact"], reverse=True)
        
        # Return top 3
        return factors[:3]
    
    def _estimate_remaining_rounds(
        self,
        score1: int,
        score2: int
    ) -> int:
        """Estimate remaining rounds based on current score."""
        max_score = 13  # First to 13 wins in Valorant
        
        if score1 >= max_score or score2 >= max_score:
            return 0
        
        # Minimum rounds needed
        rounds_needed = max_score - max(score1, score2)
        
        # Add estimate for competitive rounds
        score_diff = abs(score1 - score2)
        if score_diff <= 2:
            # Close match - expect more rounds
            return rounds_needed + 3
        elif score_diff <= 4:
            return rounds_needed + 1
        else:
            return rounds_needed
    
    def _sigmoid(self, x: float) -> float:
        """Sigmoid function for normalization."""
        return 1 / (1 + math.exp(-x))
    
    def _calculate_team_kda(
        self,
        live_state: LiveMatchState,
        team_id: int
    ) -> float:
        """Calculate aggregate KDA for a team."""
        total_kda = 0
        count = 0
        
        for stats in live_state.player_stats.values():
            if stats.team_id == team_id:
                total_kda += stats.kda
                count += 1
        
        return total_kda / count if count > 0 else 1.0
    
    def _calculate_team_acs(
        self,
        live_state: LiveMatchState,
        team_id: int
    ) -> float:
        """Calculate aggregate ACS for a team."""
        total_acs = 0
        count = 0
        
        for stats in live_state.player_stats.values():
            if stats.team_id == team_id:
                total_acs += stats.acs
                count += 1
        
        return total_acs / count if count > 0 else 200.0
    
    def get_cached_prediction(self, match_id: int) -> Optional[PredictionResult]:
        """Get cached prediction for a match."""
        return self._cache.get(match_id)
