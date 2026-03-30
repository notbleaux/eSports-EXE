"""
Bayesian Rating System

Probabilistic rating using Bayesian methods:
- TrueSkill-inspired team ratings
- Individual player ratings with uncertainty
- Match outcome predictions with confidence
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

import numpy as np
from scipy import stats

logger = logging.getLogger(__name__)


@dataclass
class PlayerRating:
    """Bayesian player rating with uncertainty."""
    player_id: str
    
    # Rating (normally distributed)
    mean: float  # Rating estimate (e.g., 1500)
    variance: float  # Uncertainty (higher = less certain)
    
    # Derived
    std: float  # sqrt(variance)
    confidence_interval_95: Tuple[float, float]
    
    # Metadata
    games_played: int
    last_updated: datetime
    
    @property
    def conservative_rating(self) -> float:
        """Conservative rating estimate (mean - 2*std)."""
        return self.mean - 2 * self.std


@dataclass
class MatchPrediction:
    """Prediction for a match with uncertainty."""
    team_a_win_prob: float
    team_b_win_prob: float
    draw_prob: float  # If applicable
    
    # Uncertainty
    prediction_confidence: float  # 0-1 based on rating uncertainties
    
    # Rating updates (pre-computed)
    team_a_rating_update: Optional[Dict[str, float]] = None
    team_b_rating_update: Optional[Dict[str, float]] = None


class BayesianRatingSystem:
    """
    Bayesian rating system for esports.
    
    Based on TrueSkill but adapted for team-based FPS games.
    Uses Gaussian belief distributions for ratings.
    """
    
    def __init__(
        self,
        default_rating: float = 1500.0,
        default_variance: float = 10000.0,  # High initial uncertainty
        beta: float = 200.0,  # Skill class width
        tau: float = 0.5,  # Dynamic factor (rating volatility)
        draw_probability: float = 0.0  # Draw probability (0 for Valorant)
    ):
        self.default_rating = default_rating
        self.default_variance = default_variance
        self.beta = beta
        self.tau = tau
        self.draw_probability = draw_probability
        
        self._player_ratings: Dict[str, PlayerRating] = {}
    
    def get_rating(self, player_id: str) -> PlayerRating:
        """Get current rating for a player."""
        if player_id not in self._player_ratings:
            # Initialize new player
            self._player_ratings[player_id] = PlayerRating(
                player_id=player_id,
                mean=self.default_rating,
                variance=self.default_variance,
                std=np.sqrt(self.default_variance),
                confidence_interval_95=(
                    self.default_rating - 2 * np.sqrt(self.default_variance),
                    self.default_rating + 2 * np.sqrt(self.default_variance)
                ),
                games_played=0,
                last_updated=datetime.utcnow()
            )
        
        return self._player_ratings[player_id]
    
    def calculate_team_rating(
        self,
        player_ids: List[str]
    ) -> Tuple[float, float]:
        """
        Calculate combined rating for a team.
        
        Returns:
            (team_mean, team_variance)
        """
        if not player_ids:
            return self.default_rating, self.default_variance
        
        ratings = [self.get_rating(pid) for pid in player_ids]
        
        # Team rating is average of player ratings
        team_mean = np.mean([r.mean for r in ratings])
        
        # Team variance combines individual uncertainties
        # Higher variance for teams with uncertain players
        team_variance = np.mean([r.variance for r in ratings]) / len(ratings)
        
        return team_mean, team_variance
    
    def predict_match(
        self,
        team_a_players: List[str],
        team_b_players: List[str]
    ) -> MatchPrediction:
        """
        Predict match outcome with uncertainty.
        
        Args:
            team_a_players: List of player IDs for team A
            team_b_players: List of player IDs for team B
            
        Returns:
            MatchPrediction with probabilities and confidence
        """
        # Get team ratings
        team_a_mean, team_a_var = self.calculate_team_rating(team_a_players)
        team_b_mean, team_b_var = self.calculate_team_rating(team_b_players)
        
        # Performance difference distribution
        # Team A wins if performance_A > performance_B
        diff_mean = team_a_mean - team_b_mean
        diff_var = team_a_var + team_b_var + 2 * self.beta ** 2
        diff_std = np.sqrt(diff_var)
        
        # Calculate win probability
        # P(team A wins) = P(diff > 0)
        win_prob = 1 - stats.norm.cdf(0, loc=diff_mean, scale=diff_std)
        lose_prob = stats.norm.cdf(0, loc=diff_mean, scale=diff_std)
        draw_prob = 0.0  # Valorant doesn't have draws
        
        # Prediction confidence based on rating uncertainties
        # Lower uncertainty = higher confidence
        total_uncertainty = np.sqrt(team_a_var + team_b_var)
        confidence = 1.0 / (1.0 + total_uncertainty / self.default_variance)
        
        return MatchPrediction(
            team_a_win_prob=win_prob,
            team_b_win_prob=lose_prob,
            draw_prob=draw_prob,
            prediction_confidence=confidence
        )
    
    def update_ratings(
        self,
        team_a_players: List[str],
        team_b_players: List[str],
        outcome: str,  # 'team_a_win', 'team_b_win', 'draw'
        score_diff: Optional[int] = None
    ) -> Dict[str, PlayerRating]:
        """
        Update player ratings after a match.
        
        Uses Bayesian update similar to TrueSkill.
        
        Args:
            team_a_players: Team A player IDs
            team_b_players: Team B player IDs
            outcome: Match outcome
            score_diff: Score difference (for margin of victory)
            
        Returns:
            Updated ratings for all players
        """
        # Get current ratings
        team_a_ratings = [self.get_rating(pid) for pid in team_a_players]
        team_b_ratings = [self.get_rating(pid) for pid in team_b_players]
        
        # Calculate team ratings
        team_a_mean = np.mean([r.mean for r in team_a_ratings])
        team_b_mean = np.mean([r.mean for r in team_b_ratings])
        team_a_var = np.mean([r.variance for r in team_a_ratings]) / len(team_a_ratings)
        team_b_var = np.mean([r.variance for r in team_b_ratings]) / len(team_b_ratings)
        
        # Dynamic variance increase (uncertainty grows over time)
        for r in team_a_ratings + team_b_ratings:
            r.variance += self.tau ** 2
        
        # Compute update factors
        diff_mean = team_a_mean - team_b_mean
        diff_var = team_a_var + team_b_var + 2 * self.beta ** 2
        diff_std = np.sqrt(diff_var)
        
        # Outcome value: 1 = team A wins, 0 = team B wins, 0.5 = draw
        if outcome == 'team_a_win':
            outcome_val = 1.0
        elif outcome == 'team_b_win':
            outcome_val = 0.0
        else:
            outcome_val = 0.5
        
        # Margin of victory factor (optional)
        mov_factor = 1.0
        if score_diff is not None:
            # Larger wins/losses = bigger rating changes
            mov_factor = min(2.0, 1.0 + score_diff / 10.0)
        
        # Update each player
        updated = {}
        
        # Team A updates
        for rating in team_a_ratings:
            # TrueSkill-style update
            # v = (outcome - expected) / variance
            expected = 1 - stats.norm.cdf(0, loc=diff_mean, scale=diff_std)
            
            # Simplified update (approximate)
            rating_change = (outcome_val - expected) * self.beta * mov_factor
            
            # Individual contribution (more certain players update less)
            uncertainty_factor = self.default_variance / (self.default_variance + rating.variance)
            
            new_mean = rating.mean + rating_change * uncertainty_factor
            
            # Variance decreases with more games
            new_variance = max(100, rating.variance * 0.95)  # Floor at 100
            
            updated_rating = PlayerRating(
                player_id=rating.player_id,
                mean=new_mean,
                variance=new_variance,
                std=np.sqrt(new_variance),
                confidence_interval_95=(
                    new_mean - 2 * np.sqrt(new_variance),
                    new_mean + 2 * np.sqrt(new_variance)
                ),
                games_played=rating.games_played + 1,
                last_updated=datetime.utcnow()
            )
            
            self._player_ratings[rating.player_id] = updated_rating
            updated[rating.player_id] = updated_rating
        
        # Team B updates (opposite direction)
        for rating in team_b_ratings:
            expected = stats.norm.cdf(0, loc=diff_mean, scale=diff_std)
            rating_change = ((1 - outcome_val) - expected) * self.beta * mov_factor
            
            uncertainty_factor = self.default_variance / (self.default_variance + rating.variance)
            new_mean = rating.mean + rating_change * uncertainty_factor
            new_variance = max(100, rating.variance * 0.95)
            
            updated_rating = PlayerRating(
                player_id=rating.player_id,
                mean=new_mean,
                variance=new_variance,
                std=np.sqrt(new_variance),
                confidence_interval_95=(
                    new_mean - 2 * np.sqrt(new_variance),
                    new_mean + 2 * np.sqrt(new_variance)
                ),
                games_played=rating.games_played + 1,
                last_updated=datetime.utcnow()
            )
            
            self._player_ratings[rating.player_id] = updated_rating
            updated[rating.player_id] = updated_rating
        
        return updated
    
    def get_leaderboard(
        self,
        min_games: int = 10,
        sort_by: str = "conservative"  # "mean", "conservative"
    ) -> List[PlayerRating]:
        """
        Get sorted leaderboard of players.
        
        Args:
            min_games: Minimum games played to be ranked
            sort_by: Sorting method
            
        Returns:
            Sorted list of PlayerRating
        """
        eligible = [
            r for r in self._player_ratings.values()
            if r.games_played >= min_games
        ]
        
        if sort_by == "conservative":
            return sorted(eligible, key=lambda r: r.conservative_rating, reverse=True)
        else:
            return sorted(eligible, key=lambda r: r.mean, reverse=True)
    
    def get_match_quality(
        self,
        team_a_players: List[str],
        team_b_players: List[str]
    ) -> float:
        """
        Calculate match quality (0-1) based on rating balance.
        
        Higher quality = more evenly matched teams.
        """
        prediction = self.predict_match(team_a_players, team_b_players)
        
        # Perfect match = 0.5 win probability for both teams
        # Quality = 1 - |0.5 - win_prob| * 2
        imbalance = abs(0.5 - prediction.team_a_win_prob)
        quality = 1.0 - imbalance * 2
        
        return quality
    
    def _get_pid_rating(self, pid: str) -> PlayerRating:
        """Internal helper to get rating."""
        return self.get_rating(pid)


# Global instance
_rating_system: Optional[BayesianRatingSystem] = None


def get_rating_system() -> BayesianRatingSystem:
    """Get the global rating system."""
    global _rating_system
    if _rating_system is None:
        _rating_system = BayesianRatingSystem()
    return _rating_system
