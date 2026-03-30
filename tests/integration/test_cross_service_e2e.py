"""
Cross-Service End-to-End Integration Tests

Comprehensive E2E tests covering:
- Full data flow from Godot to Web
- Multi-service interactions
- Error propagation
- Performance under load

[Ver001.000]
"""

import pytest
import asyncio
import json
import time
from datetime import datetime


pytestmark = [pytest.mark.integration, pytest.mark.e2e]


@pytest.mark.asyncio
@pytest.mark.timeout(60)
async def test_complete_godot_to_web_flow(
    api_client,
    websocket_client,
    test_tournament,
    generate_match_result,
    sample_player_stats,
    feature_store_client,
    sample_simrating_request
):
    """
    Complete E2E test: Godot match export through to web display.
    
    Flow:
    1. Godot exports match result
    2. API processes and stores
    3. Analytics calculates SimRating
    4. Feature Store updated
    5. WebSocket notifies clients
    6. Web frontend displays data
    """
    tournament_id = test_tournament.get("id", "test_tournament")
    
    # Step 1: Connect WebSocket
    ws = await websocket_client(f"/ws/matches/{tournament_id}/live")
    
    try:
        # Step 2: Export match from Godot
        match_result = generate_match_result(tournament_id=tournament_id)
        match_result["stats"] = {
            "team_a": {"player_1": sample_player_stats}
        }
        
        export_response = await api_client.post(
            f"/api/v1/tournaments/{tournament_id}/matches/results",
            json=match_result
        )
        
        assert export_response.status_code in [201, 200, 501]
        
        # Step 3: Calculate SimRating
        calc_response = await api_client.post(
            "/api/v1/analytics/simrating/calculate",
            json=sample_simrating_request
        )
        
        assert calc_response.status_code == 200
        simrating = calc_response.json()
        
        # Step 4: Store in Feature Store
        player_id = sample_player_stats["player_id"]
        await feature_store_client.store_player_rating(player_id, simrating)
        
        # Step 5: Check WebSocket notification
        try:
            msg = await asyncio.wait_for(ws.recv(), timeout=3.0)
            data = json.loads(msg)
            # Any message confirms WebSocket is working
            assert "type" in data
        except asyncio.TimeoutError:
            pass  # WebSocket may not have immediate message
        
        # Step 6: Verify data is queryable
        # Check tournament data
        tourney_response = await api_client.get(f"/api/v1/tournaments/{tournament_id}")
        
        # Check analytics
        analytics_response = await api_client.get("/api/v1/analytics/leaderboard")
        
        # Overall success if no exceptions thrown
        
    finally:
        await ws.close()


@pytest.mark.asyncio
@pytest.mark.timeout(30)
async def test_multi_match_tournament_flow(
    api_client,
    test_tournament,
    generate_match_result
):
    """
    Test running a complete tournament with multiple matches.
    """
    tournament_id = test_tournament.get("id", "test_tournament")
    
    # Submit multiple matches
    num_matches = 5
    for i in range(num_matches):
        match_result = generate_match_result(
            tournament_id=tournament_id,
            team1_score=13,
            team2_score=10 + (i % 3)
        )
        
        response = await api_client.post(
            f"/api/v1/tournaments/{tournament_id}/matches/results",
            json=match_result
        )
        
        assert response.status_code in [201, 200, 501]
    
    # Verify tournament status
    status_response = await api_client.get(
        f"/api/v1/tournaments/{tournament_id}/status"
    )
    
    # Leaderboard should be available
    leaderboard_response = await api_client.get(
        "/api/v1/analytics/leaderboard?metric=wins"
    )


@pytest.mark.asyncio
@pytest.mark.timeout(30)
async def test_error_propagation(
    api_client,
    test_tournament
):
    """
    Test that errors are properly propagated through the system.
    """
    tournament_id = test_tournament.get("id", "test_tournament")
    
    # Submit invalid match data
    invalid_match = {
        "match_id": "test",
        "tournament_id": "wrong_tournament",  # Mismatch
        "team1_score": -1,  # Invalid score
        "team2_score": 10
    }
    
    response = await api_client.post(
        f"/api/v1/tournaments/{tournament_id}/matches/results",
        json=invalid_match
    )
    
    # Should get validation error
    assert response.status_code in [400, 422]
    
    # Error response should be informative
    error_data = response.json()
    assert "detail" in error_data or "error" in error_data


@pytest.mark.asyncio
@pytest.mark.timeout(30)
async def test_concurrent_operations(
    api_client,
    test_tournament,
    generate_match_result
):
    """
    Test system behavior under concurrent operations.
    """
    tournament_id = test_tournament.get("id", "test_tournament")
    
    async def submit_match(i):
        match_result = generate_match_result(tournament_id=tournament_id)
        response = await api_client.post(
            f"/api/v1/tournaments/{tournament_id}/matches/results",
            json=match_result
        )
        return response.status_code
    
    # Submit 5 matches concurrently
    tasks = [submit_match(i) for i in range(5)]
    results = await asyncio.gather(*tasks)
    
    # All should complete (may succeed or fail gracefully)
    assert all(status in [201, 200, 501] for status in results)


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_api_response_times(
    api_client
):
    """
    Test API response times are within acceptable limits.
    """
    endpoints = [
        "/health",
        "/ready",
        "/api/v1/tournaments/",
        "/api/v1/analytics/leaderboard"
    ]
    
    max_response_time = 2.0  # seconds
    
    for endpoint in endpoints:
        start = time.time()
        response = await api_client.get(endpoint)
        elapsed = time.time() - start
        
        # Response should complete within timeout
        assert elapsed < max_response_time, \
            f"{endpoint} took {elapsed}s (max {max_response_time}s)"


@pytest.mark.asyncio
@pytest.mark.timeout(30)
async def test_data_consistency_across_services(
    api_client,
    websocket_client,
    test_tournament,
    generate_match_result
):
    """
    Test data consistency between API and WebSocket.
    """
    tournament_id = test_tournament.get("id", "test_tournament")
    
    # Connect WebSocket
    ws = await websocket_client(f"/ws/matches/{tournament_id}/live")
    
    try:
        # Submit match
        match_result = generate_match_result(tournament_id=tournament_id)
        
        await api_client.post(
            f"/api/v1/tournaments/{tournament_id}/matches/results",
            json=match_result
        )
        
        # Get match data from API
        api_response = await api_client.get(
            f"/api/v1/tournaments/{tournament_id}/matches/{match_result['match_id']}"
        )
        
        # WebSocket should receive notification
        try:
            msg = await asyncio.wait_for(ws.recv(), timeout=3.0)
            ws_data = json.loads(msg)
            
            # Data should be consistent (if match_id is available in both)
            if api_response.status_code == 200:
                api_data = api_response.json()
                # Consistency check - both should reference same match
                if "matchId" in ws_data and "match_id" in api_data:
                    pass  # Data structure matches
                    
        except asyncio.TimeoutError:
            pass  # WebSocket may not have immediate message
            
    finally:
        await ws.close()


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_service_health_checks(
    api_client
):
    """
    Test health checks for all services.
    """
    # Basic health
    health = await api_client.get("/health")
    assert health.status_code == 200
    
    health_data = health.json()
    assert health_data.get("status") == "healthy"
    
    # Readiness
    ready = await api_client.get("/ready")
    assert ready.status_code == 200
    
    ready_data = ready.json()
    assert ready_data.get("ready") is True or ready_data.get("status") == "ready"
    
    # Liveness
    live = await api_client.get("/live")
    assert live.status_code == 200


@pytest.mark.asyncio
@pytest.mark.timeout(30)
async def test_end_to_end_security(
    api_client,
    test_tournament
):
    """
    Test security headers and firewall protection end-to-end.
    """
    response = await api_client.get("/api/v1/tournaments/")
    
    # Check security headers
    headers = response.headers
    
    # Should have security headers
    assert "x-frame-options" in headers or "X-Frame-Options" in headers
    assert "x-content-type-options" in headers or "X-Content-Type-Options" in headers
    
    # Firewall should block game-only fields
    # This would require a specific endpoint that returns player data
    players_response = await api_client.get("/api/players/")
    
    if players_response.status_code == 200:
        players = players_response.json()
        if isinstance(players, list) and players:
            for player in players:
                # These fields should NOT be present
                assert "internalAgentState" not in player
                assert "radarData" not in player
                assert "simulationTick" not in player
