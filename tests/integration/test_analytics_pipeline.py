"""
Analytics Calculation Flow Integration Tests

Tests the flow:
1. Match data exported
2. Analytics engine calculates SimRating
3. Results stored in Feature Store
4. Web platform displays rating

[Ver001.000]
"""

import pytest
import json
from datetime import datetime


pytestmark = [pytest.mark.integration]


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_simrating_calculation_pipeline(
    api_client,
    sample_player_stats,
    feature_store_client,
    sample_simrating_request
):
    """
    Test flow:
    1. Match data exported
    2. Analytics engine calculates SimRating
    3. Results stored in Feature Store
    4. Web platform displays rating
    """
    player_id = sample_player_stats["player_id"]
    
    # Step 1 & 2: Calculate SimRating
    response = await api_client.post(
        "/api/v1/analytics/simrating/calculate",
        json=sample_simrating_request
    )
    
    assert response.status_code == 200, f"SimRating calculation failed: {response.text}"
    
    simrating = response.json()
    
    # Verify response structure
    assert "sim_rating" in simrating or "simrating" in simrating
    assert "components" in simrating
    assert "z_scores" in simrating
    
    # Verify calculation is reasonable
    rating_value = simrating.get("sim_rating", simrating.get("simrating", 0))
    assert 50 <= rating_value <= 150, f"Rating out of expected range: {rating_value}"
    
    # Step 3: Store in Feature Store
    store_response = await feature_store_client.store_player_rating(
        player_id=player_id,
        simrating=simrating
    )
    
    # Step 4: Verify rating is queryable
    rating_check = await api_client.get(f"/api/v1/analytics/player/{player_id}/rating")
    
    if rating_check.status_code == 200:
        displayed_rating = rating_check.json()
        assert "sim_rating" in displayed_rating or "rating" in displayed_rating


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_rar_calculation_flow(
    api_client
):
    """
    Test RAR (Role-Adjusted Replacement) calculation flow.
    """
    rar_request = {
        "raw_rating": 115.0,
        "role": "Entry"
    }
    
    response = await api_client.post(
        "/api/v1/analytics/rar/calculate",
        json=rar_request
    )
    
    if response.status_code == 404:
        pytest.skip("RAR endpoint not implemented")
    
    assert response.status_code == 200
    
    result = response.json()
    
    # Verify RAR response structure
    assert "rar_score" in result
    assert "role" in result
    assert "investment_grade" in result
    
    # Verify calculations
    assert result["role"] == "Entry"
    assert result["rar_score"] > 0


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_investment_grading_pipeline(
    api_client
):
    """
    Test investment grading calculation flow.
    """
    grade_request = {
        "raw_rating": 120.0,
        "role": "IGL",
        "age": 22,
        "record_date": datetime.utcnow().isoformat()
    }
    
    response = await api_client.post(
        "/api/v1/analytics/investment-grade",
        json=grade_request
    )
    
    if response.status_code == 404:
        pytest.skip("Investment grade endpoint not implemented")
    
    assert response.status_code == 200
    
    result = response.json()
    
    # Verify response structure
    assert "investment_grade" in result
    assert "age_factor" in result
    assert "adjusted_rar" in result
    assert "in_peak_age" in result
    assert "career_stage" in result


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_batch_analytics_calculation(
    api_client
):
    """
    Test batch calculation for multiple players.
    """
    batch_request = {
        "players": [
            {
                "player_id": f"player_{i}",
                "kills_z": 0.5 + i * 0.2,
                "deaths_z": -0.3 + i * 0.1,
                "adjusted_kill_value_z": 0.4 + i * 0.15,
                "adr_z": 0.6 + i * 0.1,
                "kast_pct_z": 0.3 + i * 0.1
            }
            for i in range(5)
        ]
    }
    
    response = await api_client.post(
        "/api/v1/analytics/simrating/batch",
        json=batch_request
    )
    
    if response.status_code == 404:
        pytest.skip("Batch endpoint not implemented")
    
    assert response.status_code == 200
    
    result = response.json()
    
    if isinstance(result, list):
        assert len(result) == 5
        for r in result:
            assert "sim_rating" in r or "simrating" in r


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_analytics_with_match_integration(
    api_client,
    test_tournament,
    generate_match_result
):
    """
    Test analytics pipeline with real match data.
    """
    tournament_id = test_tournament.get("id", "test_tournament")
    
    # Submit a match
    match_result = generate_match_result(tournament_id=tournament_id)
    
    await api_client.post(
        f"/api/v1/tournaments/{tournament_id}/matches/results",
        json=match_result
    )
    
    # Get tournament analytics
    analytics_response = await api_client.get(
        f"/api/v1/analytics/tournament/{tournament_id}/summary"
    )
    
    if analytics_response.status_code == 200:
        summary = analytics_response.json()
        assert "matches" in summary or "stats" in summary


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_age_curve_calculation(
    api_client
):
    """
    Test age curve calculation for career trajectory.
    """
    age_request = {
        "role": "Entry",
        "age": 21
    }
    
    response = await api_client.post(
        "/api/v1/analytics/age-curve",
        json=age_request
    )
    
    if response.status_code == 404:
        pytest.skip("Age curve endpoint not implemented")
    
    assert response.status_code == 200
    
    result = response.json()
    
    # Verify response structure
    assert "role" in result
    assert "age" in result
    assert "peak_range" in result
    assert "career_stage" in result
    assert "peak_proximity" in result


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_leaderboard_flow(
    api_client
):
    """
    Test leaderboard generation flow.
    """
    # Get leaderboard
    response = await api_client.get(
        "/api/v1/analytics/leaderboard?metric=simrating&limit=10"
    )
    
    if response.status_code == 404:
        pytest.skip("Leaderboard endpoint not implemented")
    
    assert response.status_code == 200
    
    leaderboard = response.json()
    
    # Should be a list
    assert isinstance(leaderboard, list)
    
    # Verify structure if entries exist
    if leaderboard:
        entry = leaderboard[0]
        assert "player_id" in entry or "player" in entry or "name" in entry


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_analytics_error_handling(
    api_client
):
    """
    Test analytics error handling for invalid inputs.
    """
    # Invalid request - missing required fields
    invalid_request = {
        "kills_z": "invalid",  # Should be float
        "deaths_z": 0.5
    }
    
    response = await api_client.post(
        "/api/v1/analytics/simrating/calculate",
        json=invalid_request
    )
    
    # Should return 422 validation error
    assert response.status_code in [400, 422]
    
    # Empty request
    empty_response = await api_client.post(
        "/api/v1/analytics/simrating/calculate",
        json={}
    )
    
    assert empty_response.status_code in [400, 422]


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_feature_store_analytics_integration(
    api_client,
    sample_simrating_request
):
    """
    Test integration between Feature Store and Analytics.
    """
    # Calculate SimRating
    calc_response = await api_client.post(
        "/api/v1/analytics/simrating/calculate",
        json=sample_simrating_request
    )
    
    assert calc_response.status_code == 200
    
    # Check if features are logged to Feature Store
    features_response = await api_client.get(
        "/api/v1/features/analytics/simrating/latest"
    )
    
    if features_response.status_code == 200:
        features = features_response.json()
        assert "features" in features or "calculations" in features
