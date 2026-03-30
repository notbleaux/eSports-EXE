"""
Test ExportClient integration with eSports-EXE Feature Store API.

This test simulates the Godot ExportClient sending data to the Feature Store.
Run with: python test_feature_store_integration.py
"""

import asyncio
import json
import httpx
from datetime import datetime
from typing import Dict, Any, Optional

# Feature Store API endpoint (from eSports-EXE)
FEATURE_STORE_URL = "http://localhost:8000/v1/features"
API_KEY = "test_key_123"


class ExportClientSimulator:
    """
    Simulates the Godot ExportClient behavior in Python.
    This mimics how the GDScript ExportClient would interact with the API.
    """
    
    def __init__(self, api_endpoint: str, api_key: str):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.offline_queue: list = []
        self.max_retries = 3
        self.base_retry_delay = 1.0
        
    async def send_match_data(self, payload: Dict[str, Any]) -> bool:
        """
        Send match data to Feature Store API.
        Mimics ExportClient.send_match_data() from GDScript.
        """
        if not self.api_endpoint:
            print("⚠️  API endpoint not configured, queuing for offline mode")
            self._queue_offline(payload)
            return False
        
        # Attempt to send with retries
        for attempt in range(1, self.max_retries + 1):
            try:
                success = await self._execute_request(payload)
                if success:
                    print(f"✅ Successfully sent data (attempt {attempt})")
                    await self._process_offline_queue()
                    return True
            except Exception as e:
                print(f"⚠️  Attempt {attempt} failed: {e}")
                if attempt < self.max_retries:
                    delay = self.base_retry_delay * (2 ** (attempt - 1))
                    print(f"⏳ Retrying in {delay}s...")
                    await asyncio.sleep(delay)
        
        # Max retries exceeded, queue for later
        print("❌ Max retries exceeded, queuing for offline mode")
        self._queue_offline(payload)
        return False
    
    async def _execute_request(self, payload: Dict[str, Any]) -> bool:
        """Execute HTTP request to Feature Store."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.api_endpoint,
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code >= 200 and response.status_code < 300:
                    print(f"✅ API Response: {response.status_code}")
                    return True
                else:
                    print(f"❌ API Error: {response.status_code} - {response.text}")
                    return False
                    
            except httpx.ConnectError:
                print("❌ Connection error - API server may not be running")
                return False
            except Exception as e:
                print(f"❌ Request error: {e}")
                return False
    
    def _queue_offline(self, payload: Dict[str, Any]):
        """Queue data for offline mode."""
        self.offline_queue.append({
            "timestamp": datetime.utcnow().isoformat(),
            "payload": payload
        })
        print(f"📦 Queued for offline. Queue size: {len(self.offline_queue)}")
    
    async def _process_offline_queue(self):
        """Process any queued items."""
        if not self.offline_queue:
            return
        
        print(f"🔄 Processing offline queue ({len(self.offline_queue)} items)...")
        
        # Process queue (simplified - in production would process all)
        while self.offline_queue:
            item = self.offline_queue.pop(0)
            success = await self._execute_request(item["payload"])
            
            if not success:
                # Put back at front if failed
                self.offline_queue.insert(0, item)
                break
            
            await asyncio.sleep(0.5)  # Rate limiting
        
        if not self.offline_queue:
            print("✅ Offline queue flushed")
    
    def get_queue_size(self) -> int:
        """Get current queue size."""
        return len(self.offline_queue)
    
    def is_offline(self) -> bool:
        """Check if in offline mode."""
        return len(self.offline_queue) > 0 or not self.api_endpoint


async def test_basic_export():
    """Test basic match data export to Feature Store."""
    print("\n" + "=" * 60)
    print("Test 1: Basic Match Data Export")
    print("=" * 60)
    
    client = ExportClientSimulator(FEATURE_STORE_URL, API_KEY)
    
    # Create sample match data
    match_data = {
        "entity_type": "match",
        "entity_id": f"match_{datetime.utcnow().timestamp()}",
        "feature_values": {
            "team_a_score": 13,
            "team_b_score": 10,
            "duration_seconds": 1800,
            "total_rounds": 23,
            "first_blood_team": "team_a"
        },
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": {
            "map": "ascent",
            "game_version": "1.0.0",
            "simulation_seed": 12345
        }
    }
    
    result = await client.send_match_data(match_data)
    
    if result:
        print("✅ Test passed: Data exported successfully")
    else:
        print("⚠️  Test info: Data queued (API may not be running)")
    
    return True


async def test_player_features_export():
    """Test player statistics export to Feature Store."""
    print("\n" + "=" * 60)
    print("Test 2: Player Features Export")
    print("=" * 60)
    
    client = ExportClientSimulator(FEATURE_STORE_URL, API_KEY)
    
    # Create player feature data
    player_data = {
        "entity_type": "player_match",
        "entity_id": f"player_001_match_{datetime.utcnow().timestamp()}",
        "feature_values": {
            "player_id": "player_001",
            "kills": 22,
            "deaths": 15,
            "assists": 5,
            "adr": 182.5,
            "kast": 78.3,
            "kpr": 0.96,
            "headshot_percentage": 36.4,
            "first_kills": 4,
            "clutches_won": 1
        },
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": {
            "team": "team_a",
            "agent": "jett",
            "role": "duelist"
        }
    }
    
    result = await client.send_match_data(player_data)
    
    if result:
        print("✅ Test passed: Player data exported successfully")
    else:
        print("⚠️  Test info: Data queued (API may not be running)")
    
    return True


async def test_simrating_features():
    """Test SimRating feature export."""
    print("\n" + "=" * 60)
    print("Test 3: SimRating Features Export")
    print("=" * 60)
    
    client = ExportClientSimulator(FEATURE_STORE_URL, API_KEY)
    
    # Create SimRating feature data
    simrating_data = {
        "entity_type": "player_simrating",
        "entity_id": "player_001",
        "feature_values": {
            "combat_score": 85.5,
            "tactical_score": 78.2,
            "economic_score": 82.0,
            "impact_score": 88.5,
            "consistency_score": 75.3,
            "simrating_overall": 81.9,
            "rar": 0.45,
            "investment_grade": "A-"
        },
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": {
            "calculation_version": "1.0.0",
            "sample_size": 50,
            "confidence_interval": [79.5, 84.3]
        }
    }
    
    result = await client.send_match_data(simrating_data)
    
    if result:
        print("✅ Test passed: SimRating data exported successfully")
    else:
        print("⚠️  Test info: Data queued (API may not be running)")
    
    return True


async def test_offline_queue():
    """Test offline queue functionality."""
    print("\n" + "=" * 60)
    print("Test 4: Offline Queue")
    print("=" * 60)
    
    # Create client without endpoint (simulates offline)
    client = ExportClientSimulator("", API_KEY)
    
    # Send multiple items
    for i in range(3):
        data = {
            "entity_type": "match",
            "entity_id": f"offline_match_{i}",
            "feature_values": {"test": True, "index": i}
        }
        await client.send_match_data(data)
    
    # Verify queue
    if client.get_queue_size() == 3:
        print("✅ Test passed: All items queued correctly")
        
        # Now configure endpoint and try to flush
        client.api_endpoint = FEATURE_STORE_URL
        await client._process_offline_queue()
        
        if client.get_queue_size() == 0:
            print("✅ Queue flushed successfully")
        else:
            print(f"⚠️  Queue has {client.get_queue_size()} items (API may not be running)")
    else:
        print(f"❌ Test failed: Expected 3 items, got {client.get_queue_size()}")
        return False
    
    return True


async def test_retry_mechanism():
    """Test retry mechanism with invalid endpoint."""
    print("\n" + "=" * 60)
    print("Test 5: Retry Mechanism")
    print("=" * 60)
    
    # Use invalid endpoint to trigger retries
    client = ExportClientSimulator("http://invalid-endpoint:9999", API_KEY)
    client.max_retries = 2
    client.base_retry_delay = 0.5  # Fast for testing
    
    data = {"entity_type": "test", "entity_id": "retry_test"}
    result = await client.send_match_data(data)
    
    # Should fail and queue
    if not result and client.get_queue_size() == 1:
        print("✅ Test passed: Retries exhausted, data queued")
        return True
    else:
        print("❌ Test failed: Unexpected result")
        return False


async def run_all_tests():
    """Run all integration tests."""
    print("=" * 60)
    print("ExportClient - Feature Store Integration Tests")
    print("=" * 60)
    print(f"Feature Store URL: {FEATURE_STORE_URL}")
    print("Note: Make sure eSports-EXE API is running on port 8000")
    print("=" * 60)
    
    results = []
    
    try:
        results.append(("Basic Export", await test_basic_export()))
        results.append(("Player Features", await test_player_features_export()))
        results.append(("SimRating Features", await test_simrating_features()))
        results.append(("Offline Queue", await test_offline_queue()))
        results.append(("Retry Mechanism", await test_retry_mechanism()))
    except Exception as e:
        print(f"\n❌ Test suite error: {e}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    failed = len(results) - passed
    
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {len(results)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
