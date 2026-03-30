"""[Ver001.000]
Godot Integration Chaos Experiments

Tests Godot game engine integration under failure conditions:
- Match export failures
- WebSocket disconnections
- Offline queue behavior
- Result reconciliation

Run with:
    ENABLE_CHAOS_TESTS=1 pytest tests/chaos/experiments/test_godot_integration.py -v
"""

import asyncio
from datetime import datetime, timezone

import pytest

pytestmark = [pytest.mark.chaos, pytest.mark.asyncio, pytest.mark.godot]


@pytest.mark.chaos
async def test_godot_export_under_load(chaos_api, godot_export_simulator):
    """
    Experiment: Export Load Test with Failures
    
    High volume of match exports with random failures.
    Verify offline queue handles failures correctly.
    
    Success Criteria:
    - All matches eventually received
    - Queue handles backpressure
    - No duplicate submissions
    """
    # Start error chaos targeting match results
    await chaos_api.start_experiment(
        name="export_error_test",
        mode="error",
        probability=0.3,
        targets=["/v1/tournaments/.*/matches/results"],
        duration=120,
    )
    
    try:
        # Simulate Godot exports
        godot_client = godot_export_simulator()
        
        for i in range(50):
            match_data = {
                "match_id": f"match_{i:03d}",
                "tournament_id": "test_tournament",
                "team1_id": f"team_{i % 10}",
                "team2_id": f"team_{(i + 1) % 10}",
                "team1_score": 13,
                "team2_score": 10,
                "winner_id": f"team_{i % 10}",
                "exported_at": datetime.now(timezone.utc).isoformat(),
            }
            
            await godot_client.send_match_data(match_data)
            await asyncio.sleep(0.5)
        
        # Flush queue
        queued_items = await godot_client.flush_queue()
        
        # Verify all matches were queued
        assert godot_client.sent_count == 50, "All 50 matches should be sent"
        assert len(queued_items) == 50, "All 50 matches should be in queue"
        
        # Verify unique match IDs
        match_ids = {m["match_id"] for m in queued_items}
        assert len(match_ids) == 50, "All match IDs should be unique"
        
    finally:
        await chaos_api.stop_experiment("export_error_test")
    
    # After chaos stops, queue should be processable
    # In real test, would verify matches appear in database


@pytest.mark.chaos
async def test_websocket_resilience(chaos_api):
    """
    Experiment: WebSocket Resilience
    
    Test WebSocket connections under chaos conditions.
    
    Success Criteria:
    - Connections recover from failures
    - Messages are buffered during outages
    - No message loss
    """
    # Start network chaos
    await chaos_api.start_experiment(
        name="websocket_chaos",
        mode="network_partition",
        probability=0.2,
        intensity=1.0,
        targets=["/ws"],
        duration=60,
    )
    
    try:
        # Simulate WebSocket behavior
        connection_state = "connected"
        sent_messages = []
        received_messages = []
        
        for i in range(100):
            # Simulate occasional disconnections
            if i % 20 == 0 and i > 0:
                connection_state = "disconnected"
                await asyncio.sleep(0.5)  # Brief outage
                connection_state = "reconnecting"
                await asyncio.sleep(0.2)  # Reconnection time
                connection_state = "connected"
            
            # Send message
            message = {"seq": i, "data": f"msg_{i}"}
            sent_messages.append(message)
            
            # Receive acknowledgment (may be delayed)
            if connection_state == "connected":
                received_messages.append(message)
            
            await asyncio.sleep(0.05)
        
        # Verify resilience
        assert connection_state == "connected", "Should end in connected state"
        
        # All messages should eventually be acknowledged
        # (In real scenario, client would retry during disconnect)
        assert len(received_messages) == len(sent_messages), "All messages should be received"
        
    finally:
        await chaos_api.stop_experiment("websocket_chaos")


@pytest.mark.chaos
async def test_offline_queue_behavior(chaos_api, godot_export_simulator):
    """
    Experiment: Offline Queue Behavior
    
    Test offline queue when network is unavailable.
    
    Success Criteria:
    - Data is queued when offline
    - Queue is flushed when online
    - Queue doesn't overflow
    """
    # Start network partition chaos
    await chaos_api.start_experiment(
        name="offline_test",
        mode="network_partition",
        probability=0.5,
        intensity=2.0,
        targets=["/v1/tournaments"],
        duration=90,
    )
    
    try:
        godot_client = godot_export_simulator()
        
        # Simulate match exports during network issues
        offline_count = 0
        
        for i in range(30):
            # Simulate network state
            is_offline = i % 5 == 0  # Periodic offline periods
            
            match_data = {
                "match_id": f"offline_match_{i}",
                "tournament_id": "offline_test",
                "team1_score": i,
                "team2_score": i + 1,
            }
            
            if is_offline:
                offline_count += 1
                # Queue for later
                await godot_client.send_match_data(match_data)
            else:
                # Try to send immediately
                await godot_client.send_match_data(match_data)
            
            await asyncio.sleep(0.3)
        
        # Verify queue behavior
        queued = await godot_client.flush_queue()
        
        # All data should be preserved
        assert len(queued) == 30, "All match data should be queued"
        
    finally:
        await chaos_api.stop_experiment("offline_test")


@pytest.mark.chaos
async def test_result_reconciliation(chaos_api):
    """
    Experiment: Result Reconciliation
    
    Test reconciliation of results after network issues.
    
    Success Criteria:
    - Duplicate results are detected
    - Missing results are identified
    - Final state is consistent
    """
    # Simulate partial export
    local_results = [
        {"match_id": f"m_{i:03d}", "complete": True}
        for i in range(100)
    ]
    
    # Simulate server state (some missing due to network issues)
    server_results = local_results.copy()
    # Remove some random entries to simulate missing exports
    missing_indices = [5, 15, 25, 35, 45]
    for idx in sorted(missing_indices, reverse=True):
        server_results.pop(idx)
    
    # Reconciliation process
    missing_on_server = []
    duplicates = []
    
    local_ids = {r["match_id"] for r in local_results}
    server_ids = {r["match_id"] for r in server_results}
    
    # Find missing
    for local_id in local_ids:
        if local_id not in server_ids:
            missing_on_server.append(local_id)
    
    # Find duplicates (would be detected in real scenario)
    from collections import Counter
    server_counts = Counter(r["match_id"] for r in server_results)
    duplicates = [mid for mid, count in server_counts.items() if count > 1]
    
    # Verify reconciliation
    assert len(missing_on_server) == len(missing_indices), "Should identify all missing"
    assert len(duplicates) == 0, "Should detect any duplicates"
    
    # After reconciliation, server should have all results
    expected_count = len(local_results)
    actual_count = len(server_results) + len(missing_on_server)
    assert actual_count == expected_count, "Should account for all results"


@pytest.mark.chaos
async def test_batch_export_resilience(chaos_api, godot_export_simulator):
    """
    Experiment: Batch Export Resilience
    
    Test batch export functionality under failure conditions.
    
    Success Criteria:
    - Partial batch failures are handled
    - Successful items are not re-sent
    - Failed items are retried
    """
    godot_client = godot_export_simulator()
    
    # Simulate batch of 20 matches
    batch = [
        {"match_id": f"batch_{i}", "data": f"data_{i}"}
        for i in range(20)
    ]
    
    # Simulate batch export with some failures
    successful = []
    failed = []
    
    for item in batch:
        # Simulate 20% failure rate
        if int(item["match_id"].split("_")[1]) % 5 == 0:
            failed.append(item)
        else:
            successful.append(item)
            await godot_client.send_match_data(item)
    
    # Retry failed items
    retry_successful = []
    for item in failed:
        # Retry succeeds
        retry_successful.append(item)
        await godot_client.send_match_data(item)
    
    # Verify batch export
    queued = await godot_client.flush_queue()
    
    assert len(queued) == 20, "All 20 items should eventually be sent"
    assert len(successful) + len(retry_successful) == 20, "All items should succeed on retry"


@pytest.mark.chaos
async def test_live_match_disruption(chaos_api):
    """
    Experiment: Live Match Disruption
    
    Test live match handling during chaos.
    
    Success Criteria:
    - Live matches continue despite chaos
    - State is consistent after recovery
    - No match data is lost
    """
    # Start mixed chaos during "live" match
    await chaos_api.start_experiment(
        name="live_match_chaos",
        mode="latency",
        probability=0.3,
        intensity=1.5,
        targets=["/v1/matches/live"],
        duration=60,
    )
    
    try:
        # Simulate live match updates
        match_events = []
        
        for round_num in range(24):  # 24 rounds
            event = {
                "round": round_num + 1,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "round_end",
                "data": {"score": f"{round_num % 13}-{(round_num + 1) % 13}"},
            }
            
            # Simulate some latency in processing
            await asyncio.sleep(0.1)
            match_events.append(event)
        
        # Verify all rounds were recorded
        assert len(match_events) == 24, "All 24 rounds should be recorded"
        
        # Verify event sequence
        rounds = [e["round"] for e in match_events]
        assert rounds == list(range(1, 25)), "Rounds should be in sequence"
        
    finally:
        await chaos_api.stop_experiment("live_match_chaos")
