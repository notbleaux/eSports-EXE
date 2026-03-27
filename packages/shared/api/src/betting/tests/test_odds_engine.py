"""
[Ver001.000]
Unit tests for OddsEngine — token-based prediction system.
Gate 6.1 verification: pytest packages/shared/api/src/betting/
"""

import pytest
from ..odds_engine import (
    OddsEngine,
    OddsFormat,
    MatchContext,
    TeamFactors,
    HeadToHead,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def engine():
    return OddsEngine()


@pytest.fixture
def even_context():
    return MatchContext(
        match_id="test-match-001",
        team_a_id="team_alpha",
        team_b_id="team_beta",
        game="valorant",
        match_type="bo3",
    )


@pytest.fixture
def even_factors():
    return TeamFactors(
        team_id="team_alpha",
        win_rate=0.50,
        form_score=0.50,
        map_strength=0.50,
        player_availability=1.0,
        fatigue_factor=1.0,
    )


@pytest.fixture
def strong_factors():
    return TeamFactors(
        team_id="team_alpha",
        win_rate=0.80,
        form_score=0.85,
        map_strength=0.75,
        player_availability=1.0,
        fatigue_factor=0.95,
    )


@pytest.fixture
def weak_factors():
    return TeamFactors(
        team_id="team_beta",
        win_rate=0.30,
        form_score=0.25,
        map_strength=0.35,
        player_availability=0.80,
        fatigue_factor=0.70,
    )


@pytest.fixture
def equal_h2h():
    return HeadToHead(
        total_matches=10,
        team_a_wins=5,
        team_b_wins=5,
        draws=0,
        recent_form="WLWLW",
    )


@pytest.fixture
def dominant_h2h():
    return HeadToHead(
        total_matches=10,
        team_a_wins=8,
        team_b_wins=2,
        draws=0,
        recent_form="WWWWW",
    )


# ---------------------------------------------------------------------------
# _calculate_composite_score
# ---------------------------------------------------------------------------

class TestCalculateCompositeScore:
    def test_returns_positive_score(self, engine, even_factors, equal_h2h):
        score = engine._calculate_composite_score(even_factors, equal_h2h, is_team_a=True)
        assert score > 0

    def test_stronger_team_scores_higher(self, engine, strong_factors, weak_factors, equal_h2h):
        strong_score = engine._calculate_composite_score(strong_factors, equal_h2h, is_team_a=True)
        weak_score = engine._calculate_composite_score(weak_factors, equal_h2h, is_team_a=False)
        assert strong_score > weak_score

    def test_h2h_dominance_raises_score(self, engine, even_factors, dominant_h2h, equal_h2h):
        dominant_score = engine._calculate_composite_score(even_factors, dominant_h2h, is_team_a=True)
        equal_score = engine._calculate_composite_score(even_factors, equal_h2h, is_team_a=True)
        assert dominant_score > equal_score

    def test_h2h_dominant_favours_team_a_over_team_b(self, engine, even_factors, dominant_h2h):
        a_score = engine._calculate_composite_score(even_factors, dominant_h2h, is_team_a=True)
        b_score = engine._calculate_composite_score(even_factors, dominant_h2h, is_team_a=False)
        assert a_score > b_score

    def test_player_unavailability_reduces_score(self, engine, even_h2h=None):
        h2h = HeadToHead(total_matches=5, team_a_wins=2, team_b_wins=3, draws=0, recent_form="WLLWL")
        full_roster = TeamFactors("t", 0.5, 0.5, 0.5, 1.0, 1.0)
        depleted_roster = TeamFactors("t", 0.5, 0.5, 0.5, 0.6, 1.0)
        full_score = engine._calculate_composite_score(full_roster, h2h, is_team_a=True)
        depleted_score = engine._calculate_composite_score(depleted_roster, h2h, is_team_a=True)
        assert full_score > depleted_score

    def test_minimum_score_is_not_zero(self, engine, equal_h2h):
        zero_factors = TeamFactors("t", 0.0, 0.0, 0.0, 0.0, 0.0)
        score = engine._calculate_composite_score(zero_factors, equal_h2h, is_team_a=True)
        assert score >= 0.01


# ---------------------------------------------------------------------------
# _apply_vig
# ---------------------------------------------------------------------------

class TestApplyVig:
    def test_probabilities_sum_less_than_one_after_vig(self, engine):
        a_adj, b_adj = engine._apply_vig(0.5, 0.5, 0.05)
        assert a_adj + b_adj < 1.0

    def test_vig_reduces_both_probabilities(self, engine):
        a_adj, b_adj = engine._apply_vig(0.6, 0.4, 0.05)
        assert a_adj < 0.6
        assert b_adj < 0.4

    def test_equal_probabilities_remain_equal_after_vig(self, engine):
        a_adj, b_adj = engine._apply_vig(0.5, 0.5, 0.05)
        assert abs(a_adj - b_adj) < 1e-9

    def test_favourite_still_favoured_after_vig(self, engine):
        a_adj, b_adj = engine._apply_vig(0.70, 0.30, 0.05)
        assert a_adj > b_adj

    def test_zero_vig_preserves_proportions(self, engine):
        a_adj, b_adj = engine._apply_vig(0.7, 0.3, 0.0)
        assert abs(a_adj - 0.7) < 1e-9
        assert abs(b_adj - 0.3) < 1e-9


# ---------------------------------------------------------------------------
# _decimal_to_american
# ---------------------------------------------------------------------------

class TestDecimalToAmerican:
    def test_even_money(self, engine):
        # 2.0 decimal = +100 american
        assert engine._decimal_to_american(2.0) == 100

    def test_favourite(self, engine):
        # decimal < 2.0 → negative american
        result = engine._decimal_to_american(1.5)
        assert result < 0

    def test_underdog(self, engine):
        # decimal > 2.0 → positive american
        result = engine._decimal_to_american(3.0)
        assert result > 0
        assert result == 200

    def test_heavy_favourite(self, engine):
        result = engine._decimal_to_american(1.25)
        assert result == -400

    def test_large_underdog(self, engine):
        result = engine._decimal_to_american(5.0)
        assert result == 400


# ---------------------------------------------------------------------------
# _apply_live_adjustment
# ---------------------------------------------------------------------------

class TestApplyLiveAdjustment:
    def test_team_a_winning_bo3_boosts_a_score(self, engine, even_context):
        a, b = engine._apply_live_adjustment(1.0, 1.0, {"team_a": 1, "team_b": 0}, even_context)
        assert a > b

    def test_team_b_winning_bo3_boosts_b_score(self, engine, even_context):
        a, b = engine._apply_live_adjustment(1.0, 1.0, {"team_a": 0, "team_b": 1}, even_context)
        assert b > a

    def test_match_point_team_a_large_boost(self, engine, even_context):
        a_mp, _ = engine._apply_live_adjustment(1.0, 1.0, {"team_a": 2, "team_b": 0}, even_context)
        a_1_0, _ = engine._apply_live_adjustment(1.0, 1.0, {"team_a": 1, "team_b": 0}, even_context)
        assert a_mp > a_1_0

    def test_tied_score_no_adjustment(self, engine, even_context):
        a, b = engine._apply_live_adjustment(1.0, 1.0, {"team_a": 0, "team_b": 0}, even_context)
        assert a == b == 1.0


# ---------------------------------------------------------------------------
# _calculate_confidence
# ---------------------------------------------------------------------------

class TestCalculateConfidence:
    def test_high_data_quality_gives_high_confidence(self, engine, strong_factors, dominant_h2h):
        confidence = engine._calculate_confidence(strong_factors, strong_factors, dominant_h2h)
        assert confidence >= 0.8

    def test_minimum_confidence_floor(self, engine, even_factors):
        sparse_h2h = HeadToHead(total_matches=1, team_a_wins=1, team_b_wins=0, draws=0, recent_form="W")
        confidence = engine._calculate_confidence(even_factors, even_factors, sparse_h2h)
        assert confidence >= 0.5

    def test_confidence_capped_at_one(self, engine, strong_factors, dominant_h2h):
        confidence = engine._calculate_confidence(strong_factors, strong_factors, dominant_h2h)
        assert confidence <= 1.0

    def test_partial_roster_lowers_confidence(self, engine, equal_h2h):
        full = TeamFactors("t", 0.5, 0.5, 0.5, 1.0, 1.0)
        partial = TeamFactors("t", 0.5, 0.5, 0.5, 0.7, 1.0)
        full_conf = engine._calculate_confidence(full, full, equal_h2h)
        partial_conf = engine._calculate_confidence(partial, full, equal_h2h)
        assert full_conf >= partial_conf


# ---------------------------------------------------------------------------
# calculate_odds (async integration)
# ---------------------------------------------------------------------------

class TestCalculateOdds:
    @pytest.mark.asyncio
    async def test_returns_odds_result(self, engine, even_context):
        from ..odds_engine import OddsResult
        result = await engine.calculate_odds(even_context)
        assert isinstance(result, OddsResult)

    @pytest.mark.asyncio
    async def test_match_id_preserved(self, engine, even_context):
        result = await engine.calculate_odds(even_context)
        assert result.match_id == "test-match-001"

    @pytest.mark.asyncio
    async def test_probabilities_sum_below_one(self, engine, even_context):
        result = await engine.calculate_odds(even_context)
        assert result.team_a_probability + result.team_b_probability < 1.0

    @pytest.mark.asyncio
    async def test_decimal_odds_above_one(self, engine, even_context):
        result = await engine.calculate_odds(even_context)
        assert result.team_a_decimal > 1.0
        assert result.team_b_decimal > 1.0

    @pytest.mark.asyncio
    async def test_live_flag_set_correctly(self, engine, even_context):
        live_result = await engine.calculate_odds(even_context, is_live=True)
        static_result = await engine.calculate_odds(even_context, is_live=False)
        assert live_result.is_live is True
        assert static_result.is_live is False

    @pytest.mark.asyncio
    async def test_live_vig_higher_than_static(self, engine, even_context):
        live_result = await engine.calculate_odds(even_context, is_live=True)
        static_result = await engine.calculate_odds(even_context, is_live=False)
        assert live_result.vig_percentage > static_result.vig_percentage

    @pytest.mark.asyncio
    async def test_cash_out_available_only_when_live_with_score(self, engine, even_context):
        live_result = await engine.calculate_odds(
            even_context, is_live=True, current_score={"team_a": 1, "team_b": 0}
        )
        static_result = await engine.calculate_odds(even_context, is_live=False)
        assert live_result.cash_out_available is True
        assert static_result.cash_out_available is False

    @pytest.mark.asyncio
    async def test_confidence_score_in_valid_range(self, engine, even_context):
        result = await engine.calculate_odds(even_context)
        assert 0.0 <= result.confidence_score <= 1.0
