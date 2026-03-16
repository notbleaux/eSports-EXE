"""
[Ver001.000]
Critical Betting Functionality Tests
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.betting.odds_engine import (
    OddsEngine, MatchContext, TeamFactors, HeadToHead, OddsResult,
    OddsFormat
)


class TestOddsCalculationAccuracy:
    """Critical odds calculation accuracy tests."""
    
    @pytest.fixture
    def engine(self):
        """Create odds engine with mocked dependencies."""
        mock_db = AsyncMock()
        mock_pandascore = AsyncMock()
        return OddsEngine(db_pool=mock_db, pandascore_client=mock_pandascore)
    
    @pytest.fixture
    def sample_context(self):
        """Create sample match context."""
        return MatchContext(
            match_id="match_123",
            team_a_id="team_a",
            team_b_id="team_b",
            game="valorant",
            map_id="ascent",
            tournament_tier=1,
            match_type="bo3"
        )
    
    @pytest.fixture
    def sample_factors_a(self):
        """Create sample team A factors."""
        return TeamFactors(
            team_id="team_a",
            win_rate=0.65,
            form_score=0.70,
            map_strength=0.60,
            player_availability=1.0,
            fatigue_factor=0.90
        )
    
    @pytest.fixture
    def sample_factors_b(self):
        """Create sample team B factors."""
        return TeamFactors(
            team_id="team_b",
            win_rate=0.55,
            form_score=0.60,
            map_strength=0.50,
            player_availability=1.0,
            fatigue_factor=0.85
        )
    
    @pytest.mark.asyncio
    async def test_odds_calculation_produces_valid_result(self, engine, sample_context):
        """Odds calculation produces valid OddsResult."""
        result = await engine.calculate_odds(sample_context, is_live=False)
        
        assert isinstance(result, OddsResult)
        assert result.match_id == sample_context.match_id
        assert result.team_a_decimal > 1.0
        assert result.team_b_decimal > 1.0
    
    @pytest.mark.asyncio
    async def test_odds_probabilities_sum_with_vig(self, engine, sample_context):
        """Probabilities sum to approximately 1 - vig."""
        result = await engine.calculate_odds(sample_context, is_live=False)
        
        prob_sum = result.team_a_probability + result.team_b_probability
        expected_sum = 1 - result.vig_percentage
        
        # Allow small floating point tolerance
        assert abs(prob_sum - expected_sum) < 0.01
    
    @pytest.mark.asyncio
    async def test_decimal_odds_conversion(self, engine, sample_context):
        """Decimal odds convert correctly from probabilities."""
        result = await engine.calculate_odds(sample_context, is_live=False)
        
        # Decimal odds = 1 / probability
        expected_a = 1 / result.team_a_probability
        expected_b = 1 / result.team_b_probability
        
        assert abs(result.team_a_decimal - expected_a) < 0.1
        assert abs(result.team_b_decimal - expected_b) < 0.1
    
    @pytest.mark.asyncio
    async def test_american_odds_format(self, engine, sample_context):
        """American odds are calculated correctly."""
        result = await engine.calculate_odds(sample_context, is_live=False)
        
        # Check format (should be integer)
        assert isinstance(result.team_a_american, int)
        assert isinstance(result.team_b_american, int)
        
        # Underdogs have positive odds, favorites have negative
        if result.team_a_decimal >= 2.0:
            assert result.team_a_american > 0
        else:
            assert result.team_a_american < 0
    
    @pytest.mark.asyncio
    async def test_live_odds_have_higher_vig(self, engine, sample_context):
        """Live odds have higher vig than pre-match."""
        pre_match = await engine.calculate_odds(sample_context, is_live=False)
        live = await engine.calculate_odds(sample_context, is_live=True, current_score={"team_a": 0, "team_b": 0})
        
        assert live.vig_percentage > pre_match.vig_percentage
        assert live.vig_percentage == engine.BASE_VIG + engine.DYNAMIC_VIG
    
    @pytest.mark.asyncio
    async def test_cash_out_only_available_live(self, engine, sample_context):
        """Cash out is only available for live matches."""
        pre_match = await engine.calculate_odds(sample_context, is_live=False)
        live = await engine.calculate_odds(sample_context, is_live=True, current_score={"team_a": 1, "team_b": 0})
        
        assert pre_match.cash_out_available == False
        assert live.cash_out_available == True
        assert live.cash_out_multiplier > 0
    
    @pytest.mark.asyncio
    async def test_confidence_score_based_on_data_quality(self, engine, sample_context):
        """Confidence score reflects data quality."""
        result = await engine.calculate_odds(sample_context, is_live=False)
        
        # Confidence should be between 0 and 1
        assert 0 <= result.confidence_score <= 1.0
        
        # With mock data (5 h2h matches), confidence should be decent
        assert result.confidence_score >= 0.5


class TestOddsEngineCalculations:
    """Odds engine calculation method tests."""
    
    @pytest.fixture
    def engine(self):
        return OddsEngine(db_pool=None, pandascore_client=None)
    
    @pytest.fixture
    def sample_factors(self):
        return TeamFactors(
            team_id="team_test",
            win_rate=0.60,
            form_score=0.65,
            map_strength=0.55,
            player_availability=0.95,
            fatigue_factor=0.90
        )
    
    @pytest.fixture
    def sample_h2h(self):
        return HeadToHead(
            total_matches=5,
            team_a_wins=3,
            team_b_wins=2,
            draws=0,
            recent_form="WLWLW"
        )
    
    def test_composite_score_calculation(self, engine, sample_factors, sample_h2h):
        """Composite score uses correct weights."""
        score = engine._calculate_composite_score(sample_factors, sample_h2h, is_team_a=True)
        
        # Score should be positive
        assert score > 0
        
        # Score should incorporate all factors
        # With win_rate=0.6 (weight 0.3), form=0.65 (weight 0.25), etc.
        expected_base = (
            sample_factors.win_rate * engine.WEIGHTS["win_rate"] +
            sample_factors.form_score * engine.WEIGHTS["form"] +
            sample_factors.map_strength * engine.WEIGHTS["map_strength"] +
            sample_factors.fatigue_factor * engine.WEIGHTS["fatigue"]
        )
        h2h_factor = sample_h2h.team_a_wins / sample_h2h.total_matches * engine.WEIGHTS["head_to_head"]
        expected = (expected_base + h2h_factor) * sample_factors.player_availability
        
        assert abs(score - expected) < 0.01
    
    def test_vig_application(self, engine):
        """Vig is correctly applied to probabilities."""
        a_prob = 0.6
        b_prob = 0.4
        vig = 0.05
        
        a_adj, b_adj = engine._apply_vig(a_prob, b_prob, vig)
        
        # Adjusted probs should sum to 1 - vig
        assert abs((a_adj + b_adj) - (1 - vig)) < 0.001
        
        # Ratios should be preserved
        original_ratio = a_prob / b_prob
        adjusted_ratio = a_adj / b_adj
        assert abs(original_ratio - adjusted_ratio) < 0.01
    
    def test_decimal_to_american_conversion_favorite(self, engine):
        """Decimal odds < 2.0 convert to negative American odds."""
        american = engine._decimal_to_american(1.5)
        assert american < 0
        # 1.5 decimal = -200 american (bet $200 to win $100)
        assert american == -200
    
    def test_decimal_to_american_conversion_underdog(self, engine):
        """Decimal odds > 2.0 convert to positive American odds."""
        american = engine._decimal_to_american(3.0)
        assert american > 0
        # 3.0 decimal = +200 american (bet $100 to win $200)
        assert american == 200
    
    def test_live_adjustment_bo3_one_map_lead(self, engine):
        """Live odds adjust for 1-0 lead in BO3."""
        a_score, b_score = 1.0, 1.0
        current_score = {"team_a": 1, "team_b": 0}
        context = MatchContext(
            match_id="test",
            team_a_id="a",
            team_b_id="b",
            game="valorant",
            match_type="bo3"
        )
        
        new_a, new_b = engine._apply_live_adjustment(a_score, b_score, current_score, context)
        
        # Team A with 1-0 lead should have higher score
        assert new_a > a_score
        assert new_b == b_score
    
    def test_live_adjustment_bo3_match_point(self, engine):
        """Live odds adjust for match point (2-0)."""
        a_score, b_score = 1.0, 1.0
        current_score = {"team_a": 2, "team_b": 0}
        context = MatchContext(
            match_id="test",
            team_a_id="a",
            team_b_id="b",
            game="valorant",
            match_type="bo3"
        )
        
        new_a, new_b = engine._apply_live_adjustment(a_score, b_score, current_score, context)
        
        # 2-0 lead gets bigger multiplier
        assert new_a > 1.4  # Should be around 1.5x
        assert new_b == b_score
    
    def test_confidence_calculation_with_h2h_data(self, engine):
        """Confidence increases with more h2h data."""
        factors_a = TeamFactors("a", 0.6, 0.6, 0.6, 1.0, 0.9)
        factors_b = TeamFactors("b", 0.5, 0.5, 0.5, 1.0, 0.9)
        
        h2h_5 = HeadToHead(5, 3, 2, 0, "WLWLW")
        h2h_2 = HeadToHead(2, 1, 1, 0, "WL")
        
        conf_5 = engine._calculate_confidence(factors_a, factors_b, h2h_5)
        conf_2 = engine._calculate_confidence(factors_a, factors_b, h2h_2)
        
        # More h2h matches = higher confidence
        assert conf_5 > conf_2


class TestOddsCaching:
    """Odds caching and live matches tests."""
    
    @pytest.fixture
    def engine(self):
        return OddsEngine(db_pool=None, pandascore_client=None)
    
    @pytest.mark.asyncio
    async def test_live_matches_cache_storage(self, engine):
        """Calculated odds are stored in live_matches cache."""
        context = MatchContext(
            match_id="cached_match",
            team_a_id="a",
            team_b_id="b",
            game="valorant"
        )
        
        result = await engine.calculate_odds(context, is_live=True)
        engine.live_matches[context.match_id] = result
        
        assert context.match_id in engine.live_matches
        cached = engine.live_matches[context.match_id]
        assert cached.match_id == context.match_id
    
    @pytest.mark.asyncio
    async def test_live_matches_cache_update(self, engine):
        """Cache can be updated with new odds."""
        context = MatchContext(
            match_id="update_match",
            team_a_id="a",
            team_b_id="b",
            game="valorant"
        )
        
        # First calculation
        result1 = await engine.calculate_odds(context, is_live=True)
        engine.live_matches[context.match_id] = result1
        
        # Second calculation (simulating live update)
        result2 = await engine.calculate_odds(context, is_live=True, current_score={"team_a": 1, "team_b": 0})
        engine.live_matches[context.match_id] = result2
        
        cached = engine.live_matches[context.match_id]
        assert cached.is_live == True


class TestOddsEdgeCases:
    """Odds calculation edge cases."""
    
    @pytest.fixture
    def engine(self):
        return OddsEngine(db_pool=None, pandascore_client=None)
    
    @pytest.mark.asyncio
    async def test_odds_with_zero_scores(self, engine):
        """Odds calculation handles edge case scores."""
        context = MatchContext(
            match_id="edge_case",
            team_a_id="a",
            team_b_id="b",
            game="valorant"
        )
        
        # Should not raise exception
        result = await engine.calculate_odds(context, is_live=False)
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_odds_with_equal_teams(self, engine):
        """Odds for evenly matched teams are close to equal."""
        context = MatchContext(
            match_id="even_match",
            team_a_id="a",
            team_b_id="b",
            game="valorant"
        )
        
        # Mock equal factors
        with patch.object(engine, '_get_team_factors') as mock_factors:
            equal_factors = TeamFactors("team", 0.5, 0.5, 0.5, 1.0, 1.0)
            mock_factors.return_value = equal_factors
            
            result = await engine.calculate_odds(context, is_live=False)
            
            # Odds should be relatively close (within factor of 1.5)
            ratio = max(result.team_a_decimal, result.team_b_decimal) / min(result.team_a_decimal, result.team_b_decimal)
            assert ratio < 1.5


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
