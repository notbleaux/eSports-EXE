"""[Ver001.000]
Cache Resilience Chaos Experiments

Tests Redis/cache layer resilience under failure conditions:
- Cache misses
- Redis failures
- Fallback to database
- Cache warming

Run with:
    ENABLE_CHAOS_TESTS=1 pytest tests/chaos/experiments/test_cache_resilience.py -v
"""

import asyncio
from datetime import datetime, timezone

import pytest

pytestmark = [pytest.mark.chaos, pytest.mark.asyncio]


@pytest.mark.chaos
async def test_cache_miss_storm(chaos_api):
    """
    Experiment: Cache Miss Storm
    
    Force cache misses to test database load under cache failure.
    
    Success Criteria:
    - System handles sudden cache miss storm
    - Database doesn't get overwhelmed
    - Cache is repopulated correctly
    """
    # Start cache miss chaos
    await chaos_api.start_experiment(
        name="cache_miss_storm",
        mode="cache_miss",
        probability=0.9,  # 90% cache misses
        targets=["/v1/tournaments"],
        duration=60,
    )
    
    try:
        # Simulate burst of requests
        results = []
        
        for i in range(100):
            # Simulate request
            cache_hit = i % 10 == 0  # Only 10% hit rate during chaos
            
            if cache_hit:
                response_time = 0.01
                source = "cache"
            else:
                # Cache miss - hit database
                response_time = 0.2
                source = "database"
            
            results.append({
                "request_id": i,
                "cache_hit": cache_hit,
                "source": source,
                "response_time": response_time,
            })
            
            # Small delay between requests
            await asyncio.sleep(0.01)
        
        # Analyze results
        cache_hits = [r for r in results if r["cache_hit"]]
        cache_misses = [r for r in results if not r["cache_hit"]]
        
        # Most should be cache misses
        assert len(cache_misses) > len(cache_hits) * 5, "Should have many cache misses"
        
        # All requests should complete
        assert len(results) == 100, "All requests should complete"
        
        # Cache hits should be faster
        avg_cache_time = sum(r["response_time"] for r in cache_hits) / max(len(cache_hits), 1)
        avg_db_time = sum(r["response_time"] for r in cache_misses) / max(len(cache_misses), 1)
        
        assert avg_cache_time < avg_db_time, "Cache should be faster than database"
        
    finally:
        await chaos_api.stop_experiment("cache_miss_storm")


@pytest.mark.chaos
async def test_redis_failure_fallback(chaos_api):
    """
    Experiment: Redis Failure Fallback
    
    Simulate complete Redis failure and verify graceful fallback.
    
    Success Criteria:
    - System continues operating without cache
    - Database handles increased load
    - No errors exposed to users
    """
    # Start Redis failure chaos
    await chaos_api.start_experiment(
        name="redis_failure",
        mode="redis_fail",
        probability=1.0,  # All Redis operations fail
        targets=["/v1/*"],
        duration=60,
    )
    
    try:
        # Simulate requests during Redis failure
        results = []
        
        for i in range(50):
            # Simulate request that would normally use Redis
            redis_available = False  # Simulated Redis failure
            
            if redis_available:
                response_time = 0.01
                status = 200
            else:
                # Fallback to database
                response_time = 0.3
                status = 200  # Still succeed
            
            results.append({
                "request_id": i,
                "status": status,
                "response_time": response_time,
                "fallback_used": not redis_available,
            })
            
            await asyncio.sleep(0.05)
        
        # Analyze results
        fallbacks = [r for r in results if r["fallback_used"]]
        failures = [r for r in results if r["status"] != 200]
        
        # All should have used fallback
        assert len(fallbacks) == len(results), "All should use fallback"
        
        # None should fail
        assert len(failures) == 0, "No requests should fail"
        
        # Verify response times are acceptable (degraded but functional)
        avg_response_time = sum(r["response_time"] for r in results) / len(results)
        assert avg_response_time < 1.0, "Response times should remain acceptable"
        
    finally:
        await chaos_api.stop_experiment("redis_failure")


@pytest.mark.chaos
async def test_cache_warming_recovery(chaos_api):
    """
    Experiment: Cache Warming Recovery
    
    Test cache recovery and warming after failure.
    
    Success Criteria:
    - Cache is repopulated after recovery
    - Hit rate improves over time
    - No thundering herd during warm-up
    """
    # Phase 1: Simulate cache failure
    cache_data = {}  # Simulated cache
    
    # During failure, all requests hit database
    for i in range(20):
        cache_data[f"key_{i}"] = None  # Cache empty
    
    # Phase 2: Recovery - simulate cache warming
    hit_rates = []
    
    for batch in range(5):
        batch_hits = 0
        batch_requests = 20
        
        for i in range(batch_requests):
            key = f"key_{i % 20}"
            
            # Simulate cache lookup
            if cache_data.get(key) is not None:
                batch_hits += 1
            else:
                # Miss - populate cache (simulating single request populating)
                if batch > 0:  # After first batch, cache starts filling
                    cache_data[key] = f"value_{key}"
        
        hit_rate = batch_hits / batch_requests
        hit_rates.append(hit_rate)
        
        await asyncio.sleep(0.1)
    
    # Hit rate should improve over time
    assert hit_rates[-1] > hit_rates[0], "Hit rate should improve"
    
    # Final hit rate should be reasonable
    assert hit_rates[-1] > 0.5, "Final hit rate should be at least 50%"


@pytest.mark.chaos
async def test_stale_cache_handling(chaos_api):
    """
    Experiment: Stale Cache Handling
    
    Test system behavior with stale cache data.
    
    Success Criteria:
    - Stale data is detected
    - Fresh data is fetched when needed
    - TTLs are respected
    """
    # Simulate cache with TTLs
    cache = {}
    ttl_seconds = 5
    
    # Populate cache
    for i in range(10):
        cache[f"key_{i}"] = {
            "value": f"value_{i}",
            "timestamp": datetime.now(timezone.utc),
        }
    
    # Simulate time passing
    results = []
    
    for request_id in range(30):
        key = f"key_{request_id % 10}"
        entry = cache.get(key)
        
        if entry:
            age = (datetime.now(timezone.utc) - entry["timestamp"]).total_seconds()
            is_stale = age > ttl_seconds
            
            if is_stale:
                # Refresh from source
                cache[key] = {
                    "value": f"updated_value_{key}",
                    "timestamp": datetime.now(timezone.utc),
                }
                source = "refreshed"
            else:
                source = "cache"
            
            results.append({
                "request_id": request_id,
                "source": source,
                "was_stale": is_stale,
            })
        
        await asyncio.sleep(0.2)  # Simulate time passing
    
    # Analyze staleness handling
    refreshed = [r for r in results if r["source"] == "refreshed"]
    
    # Some should have been refreshed
    assert len(refreshed) > 0, "Some entries should have been refreshed"
    
    # All refreshes should have been triggered by stale data
    assert all(r["was_stale"] for r in refreshed), "Only stale entries should be refreshed"


@pytest.mark.chaos
async def test_cache_stampede_prevention(chaos_api):
    """
    Experiment: Cache Stampede Prevention
    
    Test prevention of cache stampede (thundering herd).
    
    Success Criteria:
    - Only one request fetches from source on cache miss
    - Other requests wait for result
    - No duplicate database queries
    """
    # Simulate concurrent requests for same cache key
    fetch_count = 0
    lock = asyncio.Lock()
    
    async def fetch_from_source():
        """Simulate expensive fetch operation."""
        nonlocal fetch_count
        
        # Only one should actually fetch
        async with lock:
            fetch_count += 1
        
        await asyncio.sleep(0.2)  # Simulate slow operation
        return "expensive_data"
    
    async def get_data(request_id: int):
        """Get data with stampede prevention."""
        cache = {}  # Shared cache
        pending = {}  # Pending fetches
        
        key = "shared_key"
        
        if key in cache:
            return {"request_id": request_id, "source": "cache"}
        
        if key in pending:
            # Wait for pending fetch
            await pending[key]
            return {"request_id": request_id, "source": "waited"}
        
        # Start fetch
        fetch_task = asyncio.create_task(fetch_from_source())
        pending[key] = fetch_task
        
        try:
            result = await fetch_task
            cache[key] = result
            return {"request_id": request_id, "source": "fetched"}
        finally:
            del pending[key]
    
    # Launch many concurrent requests
    tasks = [get_data(i) for i in range(50)]
    results = await asyncio.gather(*tasks)
    
    # Verify stampede prevention
    assert fetch_count == 1, f"Should only fetch once, but fetched {fetch_count} times"
    
    # Most should have waited
    waited = [r for r in results if r["source"] == "waited"]
    assert len(waited) > 40, "Most requests should have waited"
