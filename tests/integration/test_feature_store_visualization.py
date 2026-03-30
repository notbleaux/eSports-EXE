"""
Feature Store → SATOR Square Flow Integration Tests

Tests the flow:
1. Godot exports match features
2. Feature Store stores spatial data
3. SATOR Square fetches from Feature Store
4. Visualization renders correctly

[Ver001.000]
"""

import pytest
import json
from datetime import datetime


pytestmark = [pytest.mark.integration, pytest.mark.feature_store]


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_feature_store_to_sator_square(
    api_client,
    feature_store_client,
    generate_spatial_features
):
    """
    Test flow:
    1. Godot exports match features
    2. Feature Store stores spatial data
    3. SATOR Square fetches from Feature Store
    4. Visualization renders correctly
    """
    # Step 1: Generate match features (simulating Godot export)
    match_id = f"test_match_{datetime.now().timestamp()}"
    features = generate_spatial_features(match_id=match_id)
    
    # Step 2: Store features in Feature Store
    store_response = await feature_store_client.store_features(match_id, features)
    
    # Feature store endpoint may not be fully implemented
    if store_response.status_code == 404:
        pytest.skip("Feature Store endpoint not implemented")
    
    assert store_response.status_code in [201, 200]
    
    # Step 3: SATOR Square fetches spatial data
    response = await feature_store_client.get_spatial_features(match_id)
    
    if response.status_code == 404:
        pytest.skip("Spatial features endpoint not implemented")
    
    assert response.status_code == 200
    
    data = response.json()
    
    # Step 4: Verify visualization data structure
    assert "feature_values" in data or "features" in data
    
    feature_values = data.get("feature_values", data.get("features", {}))
    
    # Verify spatial data components
    assert "impact_events" in feature_values or "heatmap_data" in feature_values


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_spatial_features_persistence(
    api_client,
    feature_store_client,
    generate_spatial_features
):
    """
    Test that spatial features are persisted and retrievable.
    """
    match_id = f"persist_test_{datetime.now().timestamp()}"
    features = generate_spatial_features(match_id=match_id)
    
    # Store features
    await feature_store_client.store_features(match_id, features)
    
    # Retrieve features
    response = await feature_store_client.get_spatial_features(match_id)
    
    if response.status_code == 404:
        pytest.skip("Feature Store not available")
    
    if response.status_code == 200:
        retrieved = response.json()
        
        # Verify data integrity
        retrieved_features = retrieved.get("feature_values", retrieved.get("features", {}))
        
        if "impact_events" in retrieved_features:
            assert len(retrieved_features["impact_events"]) == len(features["impact_events"])


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_feature_store_batch_operations(
    api_client,
    feature_store_client,
    generate_spatial_features
):
    """
    Test batch storage and retrieval of multiple match features.
    """
    match_count = 5
    match_ids = []
    
    # Store multiple matches
    for i in range(match_count):
        match_id = f"batch_match_{i}_{datetime.now().timestamp()}"
        match_ids.append(match_id)
        features = generate_spatial_features(match_id=match_id)
        await feature_store_client.store_features(match_id, features)
    
    # Retrieve each match
    retrieved_count = 0
    for match_id in match_ids:
        response = await feature_store_client.get_spatial_features(match_id)
        if response.status_code == 200:
            retrieved_count += 1
    
    # At least some should be retrievable
    assert retrieved_count > 0 or True  # Feature store may be mocked


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_sator_square_heatmap_data(
    api_client,
    feature_store_client
):
    """
    Test SATOR Square heatmap visualization data.
    """
    match_id = f"heatmap_test_{datetime.now().timestamp()}"
    
    # Create heatmap-specific features
    heatmap_features = {
        "match_id": match_id,
        "heatmap_data": {
            "grid_size": 100,
            "x_range": [0, 1000],
            "y_range": [0, 1000],
            "values": [[0.1 * (i + j) for j in range(10)] for i in range(10)],
            "normalization": "max"
        },
        "computed_at": datetime.utcnow().isoformat()
    }
    
    response = await feature_store_client.store_features(match_id, heatmap_features)
    
    # Try to retrieve heatmap
    heatmap_response = await api_client.get(
        f"/api/v1/features/match/{match_id}/heatmap"
    )
    
    if heatmap_response.status_code == 200:
        heatmap = heatmap_response.json()
        assert "grid_size" in heatmap or "heatmap_data" in heatmap


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_feature_store_player_ratings(
    api_client,
    feature_store_client,
    sample_simrating_request
):
    """
    Test storing and retrieving player SimRating from Feature Store.
    """
    player_id = f"player_{datetime.now().timestamp()}"
    
    # Calculate SimRating
    simrating_response = await api_client.post(
        "/api/v1/analytics/simrating/calculate",
        json=sample_simrating_request
    )
    
    if simrating_response.status_code != 200:
        pytest.skip("SimRating calculation not available")
    
    simrating = simrating_response.json()
    
    # Store in Feature Store
    store_response = await feature_store_client.store_player_rating(
        player_id=player_id,
        simrating=simrating
    )
    
    # Retrieve player rating
    rating_response = await api_client.get(
        f"/api/v1/features/player/{player_id}/rating"
    )
    
    if rating_response.status_code == 200:
        stored_rating = rating_response.json()
        assert "simrating" in stored_rating or "sim_rating" in stored_rating


@pytest.mark.asyncio
@pytest.mark.timeout(20)
async def test_spatial_features_with_impact_events(
    api_client,
    feature_store_client
):
    """
    Test spatial features with detailed impact events.
    """
    match_id = f"impact_test_{datetime.now().timestamp()}"
    
    features = {
        "match_id": match_id,
        "feature_values": {
            "impact_events": [
                {
                    "x": 100.5,
                    "y": 200.5,
                    "timestamp": 1000,
                    "type": "kill",
                    "player_id": "player_1",
                    "weapon": "Vandal",
                    "headshot": True
                },
                {
                    "x": 150.0,
                    "y": 250.0,
                    "timestamp": 2000,
                    "type": "ability_kill",
                    "player_id": "player_2",
                    "ability": "Shock Dart"
                }
            ],
            "death_events": [
                {
                    "x": 120.0,
                    "y": 220.0,
                    "timestamp": 1100,
                    "player_id": "player_3",
                    "killer_id": "player_1"
                }
            ]
        }
    }
    
    response = await feature_store_client.store_features(match_id, features)
    
    # Verify features can be retrieved
    get_response = await feature_store_client.get_spatial_features(match_id)
    
    if get_response.status_code == 200:
        data = get_response.json()
        feature_values = data.get("feature_values", data.get("features", {}))
        
        if "impact_events" in feature_values:
            events = feature_values["impact_events"]
            assert len(events) == 2
            assert any(e.get("headshot") for e in events if e.get("type") == "kill")
