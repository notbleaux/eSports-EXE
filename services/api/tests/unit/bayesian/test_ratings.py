"""[Ver001.000]
Tests for Bayesian Rating System.
"""

import pytest
import numpy as np
from datetime import datetime

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.njz_api.analytics.bayesian.ratings import (
    BayesianRatingSystem,
    PlayerRating,
    MatchPrediction,
    get_rating_system,
)


@pytest.fixture
def rating_system():
    """Create a BayesianRatingSystem instance."""
    return BayesianRatingSystem()


@pytest.fixture
def sample_players():
    """Create sample player IDs."""
    return ["player_1", "player_2", "player_3", "player_4", "player_5"]


class TestPlayerRating:
    """Tests for PlayerRating dataclass."""
    
    def test_basic_creation(self):
        """Test creating a player rating."""
        rating = PlayerRating(
            player_id="player_1",
            mean=1500.0,
            variance=10000.0,
            std=100.0,
            confidence_interval_95=(1300.0, 1700.0),
            games_played=10,
            last_updated=datetime.utcnow(),
        )
        
        assert rating.player_id == "player_1"
        assert rating.mean == 1500.0
        assert rating.conservative_rating == 1300.0  # mean - 2*std
        
    def test_conservative_rating_calculation(self):
        """Test conservative rating calculation."""
        rating = PlayerRating(
            player_id="player_1",
            mean=1600.0,
            variance=2500.0,
            std=50.0,
            confidence_interval_95=(1500.0, 1700.0),
            games_played=50,
            last_updated=datetime.utcnow(),
        )
        
        assert rating.conservative_rating == 1500.0  # 1600 - 2*50


class TestMatchPrediction:
    """Tests for MatchPrediction dataclass."""
    
    def test_basic_creation(self):
        """Test creating a match prediction."""
        prediction = MatchPrediction(
            team_a_win_prob=0.65,
            team_b_win_prob=0.35,
            draw_prob=0.0,
            prediction_confidence=0.8,
        )
        
        assert prediction.team_a_win_prob == 0.65
        assert prediction.team_b_win_prob == 0.35
        assert prediction.prediction_confidence == 0.8


class TestBayesianRatingSystemInitialization:
    """Tests for rating system initialization."""
    
    def test_default_initialization(self, rating_system):
        """Test default initialization."""
        assert rating_system.default_rating == 1500.0
        assert rating_system.default_variance == 10000.0
        assert rating_system.beta == 200.0
        assert rating_system._player_ratings == {}
        
    def test_custom_initialization(self):
        """Test custom initialization parameters."""
        system = BayesianRatingSystem(
            default_rating=2000.0,
            default_variance=5000.0,
            beta=150.0,
        )
        
        assert system.default_rating == 2000.0
        assert system.default_variance == 5000.0
        assert system.beta == 150.0


class TestGetRating:
    """Tests for getting player ratings."""
    
    def test_get_new_player_rating(self, rating_system):
        """Test getting rating for new player."""
        rating = rating_system.get_rating("new_player")
        
        assert rating.player_id == "new_player"
        assert rating.mean == rating_system.default_rating
        assert rating.variance == rating_system.default_variance
        assert rating.games_played == 0
        
    def test_get_existing_player(self, rating_system):
        """Test getting rating for existing player."""
        # First call creates the player
        rating1 = rating_system.get_rating("player_1")
        
        # Second call should return same rating
        rating2 = rating_system.get_rating("player_1")
        
        assert rating1 is rating2


class TestCalculateTeamRating:
    """Tests for team rating calculations."""
    
    def test_single_player_team(self, rating_system):
        """Test team rating with single player."""
        rating = rating_system.get_rating("player_1")
        team_mean, team_var = rating_system.calculate_team_rating(["player_1"])
        
        assert team_mean == rating.mean
        assert team_var == rating.variance
        
    def test_multi_player_team(self, rating_system):
        """Test team rating with multiple players."""
        # Set up players with different ratings
        rating_system._player_ratings["player_1"] = PlayerRating(
            player_id="player_1",
            mean=1600.0,
            variance=2500.0,
            std=50.0,
            confidence_interval_95=(1500.0, 1700.0),
            games_played=10,
            last_updated=datetime.utcnow(),
        )
        rating_system._player_ratings["player_2"] = PlayerRating(
            player_id="player_2",
            mean=1400.0,
            variance=2500.0,
            std=50.0,
            confidence_interval_95=(1300.0, 1500.0),
            games_played=10,
            last_updated=datetime.utcnow(),
        )
        
        team_mean, team_var = rating_system.calculate_team_rating(["player_1", "player_2"])
        
        assert team_mean == 1500.0  # Average
        assert team_var > 0
        
    def test_empty_team(self, rating_system):
        """Test team rating with empty team."""
        team_mean, team_var = rating_system.calculate_team_rating([])
        
        assert team_mean == rating_system.default_rating
        assert team_var == rating_system.default_variance


class TestPredictMatch:
    """Tests for match prediction."""
    
    def test_even_match_prediction(self, rating_system):
        """Test prediction for evenly matched teams."""
        team_a = ["player_1", "player_2"]
        team_b = ["player_3", "player_4"]
        
        # All players have same rating
        for pid in team_a + team_b:
            rating_system._player_ratings[pid] = PlayerRating(
                player_id=pid,
                mean=1500.0,
                variance=2500.0,
                std=50.0,
                confidence_interval_95=(1400.0, 1600.0),
                games_played=20,
                last_updated=datetime.utcnow(),
            )
        
        prediction = rating_system.predict_match(team_a, team_b)
        
        # Should be close to 50/50
        assert 0.45 <= prediction.team_a_win_prob <= 0.55
        assert 0.45 <= prediction.team_b_win_prob <= 0.55
        
    def test_favored_team_prediction(self, rating_system):
        """Test prediction when one team is favored."""
        # Strong team
        for pid in ["player_1", "player_2"]:
            rating_system._player_ratings[pid] = PlayerRating(
                player_id=pid,
                mean=1800.0,
                variance=1000.0,
                std=31.6,
                confidence_interval_95=(1736.8, 1863.2),
                games_played=50,
                last_updated=datetime.utcnow(),
            )
        
        # Weak team
        for pid in ["player_3", "player_4"]:
            rating_system._player_ratings[pid] = PlayerRating(
                player_id=pid,
                mean=1200.0,
                variance=1000.0,
                std=31.6,
                confidence_interval_95=(1136.8, 1263.2),
                games_played=50,
                last_updated=datetime.utcnow(),
            )
        
        prediction = rating_system.predict_match(
            ["player_1", "player_2"],
            ["player_3", "player_4"]
        )
        
        # Strong team should have high win probability
        assert prediction.team_a_win_prob > 0.7
        assert prediction.team_b_win_prob < 0.3
        
    def test_uncertain_players(self, rating_system):
        """Test prediction with uncertain player ratings."""
        # Same mean, high variance
        for pid in ["player_1", "player_2", "player_3", "player_4"]:
            rating_system._player_ratings[pid] = PlayerRating(
                player_id=pid,
                mean=1500.0,
                variance=8000.0,  # High uncertainty
                std=89.4,
                confidence_interval_95=(1321.2, 1678.8),
                games_played=5,
                last_updated=datetime.utcnow(),
            )
        
        prediction = rating_system.predict_match(
            ["player_1", "player_2"],
            ["player_3", "player_4"]
        )
        
        # High uncertainty in ratings affects the prediction
        # Note: With evenly matched high-variance teams, the model assigns
        # high confidence to the 50/50 prediction itself
        assert prediction.team_a_win_prob > 0.4
        assert prediction.team_b_win_prob > 0.4


class TestUpdateRatings:
    """Tests for rating updates after matches."""
    
    def test_update_after_expected_win(self, rating_system):
        """Test rating update when favorite wins."""
        # Set up players
        rating_system._player_ratings["winner"] = PlayerRating(
            player_id="winner",
            mean=1800.0,
            variance=1000.0,
            std=31.6,
            confidence_interval_95=(1736.8, 1863.2),
            games_played=50,
            last_updated=datetime.utcnow(),
        )
        rating_system._player_ratings["loser"] = PlayerRating(
            player_id="loser",
            mean=1200.0,
            variance=1000.0,
            std=31.6,
            confidence_interval_95=(1136.8, 1263.2),
            games_played=50,
            last_updated=datetime.utcnow(),
        )
        
        original_winner_rating = rating_system._player_ratings["winner"].mean
        original_loser_rating = rating_system._player_ratings["loser"].mean
        
        updated = rating_system.update_ratings(
            ["winner"],
            ["loser"],
            outcome="team_a_win"
        )
        
        # Winner's rating should increase slightly (expected win)
        assert updated["winner"].mean > original_winner_rating
        # Loser's rating should decrease
        assert updated["loser"].mean < original_loser_rating
        
    def test_update_after_upset(self, rating_system):
        """Test rating update when underdog wins."""
        # Set up players
        rating_system._player_ratings["underdog"] = PlayerRating(
            player_id="underdog",
            mean=1200.0,
            variance=1000.0,
            std=31.6,
            confidence_interval_95=(1136.8, 1263.2),
            games_played=50,
            last_updated=datetime.utcnow(),
        )
        rating_system._player_ratings["favorite"] = PlayerRating(
            player_id="favorite",
            mean=1800.0,
            variance=1000.0,
            std=31.6,
            confidence_interval_95=(1736.8, 1863.2),
            games_played=50,
            last_updated=datetime.utcnow(),
        )
        
        original_underdog_rating = rating_system._player_ratings["underdog"].mean
        original_favorite_rating = rating_system._player_ratings["favorite"].mean
        
        updated = rating_system.update_ratings(
            ["underdog"],
            ["favorite"],
            outcome="team_a_win"
        )
        
        # Underdog's rating should increase significantly
        assert updated["underdog"].mean > original_underdog_rating + 50
        # Favorite's rating should decrease significantly
        assert updated["favorite"].mean < original_favorite_rating - 50
        
    def test_variance_reduction(self, rating_system):
        """Test that variance decreases with more games."""
        rating_system._player_ratings["player"] = PlayerRating(
            player_id="player",
            mean=1500.0,
            variance=5000.0,
            std=70.7,
            confidence_interval_95=(1358.6, 1641.4),
            games_played=10,
            last_updated=datetime.utcnow(),
        )
        
        original_variance = rating_system._player_ratings["player"].variance
        
        updated = rating_system.update_ratings(
            ["player"],
            ["opponent"],
            outcome="team_a_win"
        )
        
        # Variance should decrease
        assert updated["player"].variance < original_variance
        
    def test_games_played_increment(self, rating_system):
        """Test that games_played is incremented."""
        rating_system._player_ratings["player"] = PlayerRating(
            player_id="player",
            mean=1500.0,
            variance=2500.0,
            std=50.0,
            confidence_interval_95=(1400.0, 1600.0),
            games_played=10,
            last_updated=datetime.utcnow(),
        )
        rating_system._player_ratings["opponent"] = PlayerRating(
            player_id="opponent",
            mean=1500.0,
            variance=2500.0,
            std=50.0,
            confidence_interval_95=(1400.0, 1600.0),
            games_played=10,
            last_updated=datetime.utcnow(),
        )
        
        updated = rating_system.update_ratings(
            ["player"],
            ["opponent"],
            outcome="team_a_win"
        )
        
        assert updated["player"].games_played == 11
        assert updated["opponent"].games_played == 11


class TestGetLeaderboard:
    """Tests for leaderboard generation."""
    
    def test_leaderboard_sorting(self, rating_system):
        """Test leaderboard sorting."""
        # Add players with different ratings
        for i, mean in enumerate([1600, 1400, 1800, 1500]):
            rating_system._player_ratings[f"player_{i}"] = PlayerRating(
                player_id=f"player_{i}",
                mean=float(mean),
                variance=2500.0,
                std=50.0,
                confidence_interval_95=(mean - 100, mean + 100),
                games_played=20,
                last_updated=datetime.utcnow(),
            )
        
        leaderboard = rating_system.get_leaderboard(min_games=10)
        
        # Should be sorted by mean (highest first)
        assert leaderboard[0].mean == 1800.0
        assert leaderboard[-1].mean == 1400.0
        
    def test_leaderboard_min_games_filter(self, rating_system):
        """Test min_games filter."""
        # Experienced player
        rating_system._player_ratings["experienced"] = PlayerRating(
            player_id="experienced",
            mean=2000.0,
            variance=1000.0,
            std=31.6,
            confidence_interval_95=(1936.8, 2063.2),
            games_played=100,
            last_updated=datetime.utcnow(),
        )
        
        # New player with high rating
        rating_system._player_ratings["newbie"] = PlayerRating(
            player_id="newbie",
            mean=1900.0,
            variance=5000.0,
            std=70.7,
            confidence_interval_95=(1758.6, 2041.4),
            games_played=3,
            last_updated=datetime.utcnow(),
        )
        
        leaderboard = rating_system.get_leaderboard(min_games=10)
        
        # Only experienced player should be on leaderboard
        assert len(leaderboard) == 1
        assert leaderboard[0].player_id == "experienced"


class TestGetMatchQuality:
    """Tests for match quality calculation."""
    
    def test_perfect_match_quality(self, rating_system):
        """Test match quality for perfectly balanced teams."""
        # Set up evenly matched players
        for i in range(4):
            rating_system._player_ratings[f"player_{i}"] = PlayerRating(
                player_id=f"player_{i}",
                mean=1500.0,
                variance=2500.0,
                std=50.0,
                confidence_interval_95=(1400.0, 1600.0),
                games_played=20,
                last_updated=datetime.utcnow(),
            )
        
        quality = rating_system.get_match_quality(
            ["player_0", "player_1"],
            ["player_2", "player_3"]
        )
        
        # Should be close to 1.0 (perfect match)
        assert quality > 0.95
        
    def test_poor_match_quality(self, rating_system):
        """Test match quality for unbalanced teams."""
        # Strong team
        for i in range(2):
            rating_system._player_ratings[f"strong_{i}"] = PlayerRating(
                player_id=f"strong_{i}",
                mean=1800.0,
                variance=1000.0,
                std=31.6,
                confidence_interval_95=(1736.8, 1863.2),
                games_played=50,
                last_updated=datetime.utcnow(),
            )
        
        # Weak team
        for i in range(2):
            rating_system._player_ratings[f"weak_{i}"] = PlayerRating(
                player_id=f"weak_{i}",
                mean=1200.0,
                variance=1000.0,
                std=31.6,
                confidence_interval_95=(1136.8, 1263.2),
                games_played=50,
                last_updated=datetime.utcnow(),
            )
        
        quality = rating_system.get_match_quality(
            ["strong_0", "strong_1"],
            ["weak_0", "weak_1"]
        )
        
        # Should be low (poor match)
        assert quality < 0.5


class TestGetRatingSystem:
    """Tests for the get_rating_system factory function."""
    
    def test_singleton_pattern(self):
        """Test that get_rating_system returns a singleton."""
        system1 = get_rating_system()
        system2 = get_rating_system()
        
        assert system1 is system2
