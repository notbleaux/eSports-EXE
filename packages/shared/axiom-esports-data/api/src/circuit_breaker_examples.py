# [Ver001.000]
"""
Circuit Breaker Decorator Examples (CB-002)
Practical examples of using circuit breakers for different service types.
"""

import asyncio
import os
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone

import httpx

# Import circuit breaker components
from circuit_breaker import (
    CircuitBreaker,
    db_circuit,
    api_circuit,
    redis_circuit,
    CircuitBreakerOpen
)

# =============================================================================
# 1. DATABASE QUERY DECORATOR
# =============================================================================

@db_circuit
async def get_player_by_id(player_id: str) -> Optional[Dict]:
    """
    Get player with circuit breaker protection.
    
    Args:
        player_id: Unique player identifier
        
    Returns:
        Player data dict or None if not found
        
    Raises:
        CircuitBreakerOpen: If database circuit is open
    """
    # Simulated database call - replace with actual asyncpg/asyncmy implementation
    # Example with asyncpg:
    # return await db.fetchrow("SELECT * FROM players WHERE id = $1", player_id)
    
    # Simulated implementation for demonstration
    await asyncio.sleep(0.01)  # Simulate DB latency
    return {
        "id": player_id,
        "name": f"Player_{player_id}",
        "team": "SATOR Esports",
        "rating": 1.25,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


@db_circuit
async def get_match_by_id(match_id: str) -> Optional[Dict]:
    """
    Get match with circuit breaker protection.
    
    Args:
        match_id: Unique match identifier
        
    Returns:
        Match data dict or None if not found
        
    Raises:
        CircuitBreakerOpen: If database circuit is open
    """
    # Simulated database call
    await asyncio.sleep(0.01)
    return {
        "id": match_id,
        "team_a": "Team Alpha",
        "team_b": "Team Beta",
        "score_a": 13,
        "score_b": 11,
        "status": "completed",
        "played_at": datetime.now(timezone.utc).isoformat()
    }


@db_circuit
async def get_player_stats(player_id: str, season: str) -> Optional[Dict]:
    """
    Get player statistics with circuit breaker protection.
    
    Args:
        player_id: Unique player identifier
        season: Season identifier (e.g., "2024", "vct_2024")
        
    Returns:
        Player statistics dict
    """
    await asyncio.sleep(0.02)
    return {
        "player_id": player_id,
        "season": season,
        "matches_played": 45,
        "kills": 675,
        "deaths": 523,
        "assists": 234,
        "kd_ratio": 1.29,
        "adr": 152.3,
        "kast": 72.5
    }


# =============================================================================
# 2. EXTERNAL API DECORATOR
# =============================================================================

# Get API key from environment
PANDASCORE_API_KEY = os.getenv("PANDASCORE_API_KEY", "")


@api_circuit
async def fetch_pandascore_match(match_id: str) -> Dict:
    """
    Fetch match from Pandascore API with circuit breaker protection.
    
    Args:
        match_id: Pandascore match ID
        
    Returns:
        Match data from Pandascore API
        
    Raises:
        CircuitBreakerOpen: If API circuit is open
        httpx.HTTPStatusError: If API returns error status
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"https://api.pandascore.co/matches/{match_id}",
            headers={"Authorization": f"Bearer {PANDASCORE_API_KEY}"},
            params={"token": PANDASCORE_API_KEY}
        )
        response.raise_for_status()
        return response.json()


@api_circuit
async def fetch_pandascore_series(series_id: str) -> Dict:
    """
    Fetch series from Pandascore API with circuit breaker protection.
    
    Args:
        series_id: Pandascore series ID
        
    Returns:
        Series data from Pandascore API
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"https://api.pandascore.co/series/{series_id}",
            headers={"Authorization": f"Bearer {PANDASCORE_API_KEY}"}
        )
        response.raise_for_status()
        return response.json()


@api_circuit
async def fetch_valorant_matches(date_from: str, date_to: str) -> List[Dict]:
    """
    Fetch Valorant matches from Pandascore with circuit breaker protection.
    
    Args:
        date_from: Start date (ISO format)
        date_to: End date (ISO format)
        
    Returns:
        List of match data
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            "https://api.pandascore.co/valorant/matches",
            headers={"Authorization": f"Bearer {PANDASCORE_API_KEY}"},
            params={
                "range[begin_at]": f"{date_from},{date_to}",
                "sort": "-begin_at",
                "page[size]": 100
            }
        )
        response.raise_for_status()
        return response.json()


# =============================================================================
# 3. REDIS OPERATION DECORATOR
# =============================================================================

# Simulated Redis client - replace with actual redis.asyncio client
class SimulatedRedis:
    """Simulated Redis for demonstration purposes."""
    
    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._ttl: Dict[str, float] = {}
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        if key in self._ttl and self._ttl[key] < asyncio.get_event_loop().time():
            del self._data[key]
            del self._ttl[key]
            return None
        return self._data.get(key)
    
    async def setex(self, key: str, seconds: int, value: str):
        """Set value with expiration."""
        self._data[key] = value
        self._ttl[key] = asyncio.get_event_loop().time() + seconds
    
    async def delete(self, key: str):
        """Delete key from cache."""
        self._data.pop(key, None)
        self._ttl.pop(key, None)


# Global Redis instance (replace with actual connection)
redis = SimulatedRedis()


@redis_circuit
async def get_cached_rating(player_id: str) -> Optional[float]:
    """
    Get cached player rating with circuit breaker protection.
    
    Args:
        player_id: Unique player identifier
        
    Returns:
        Cached rating value or None if not cached
        
    Raises:
        CircuitBreakerOpen: If Redis circuit is open
    """
    cached = await redis.get(f"rating:{player_id}")
    return float(cached) if cached else None


@redis_circuit
async def set_cached_rating(player_id: str, rating: float):
    """
    Set cached player rating with circuit breaker protection.
    
    Args:
        player_id: Unique player identifier
        rating: Rating value to cache
    """
    await redis.setex(f"rating:{player_id}", 3600, str(rating))


@redis_circuit
async def get_cached_match_result(match_id: str) -> Optional[Dict]:
    """
    Get cached match result with circuit breaker protection.
    
    Args:
        match_id: Unique match identifier
        
    Returns:
        Cached match result or None
    """
    import json
    cached = await redis.get(f"match_result:{match_id}")
    return json.loads(cached) if cached else None


@redis_circuit
async def set_cached_match_result(match_id: str, result: Dict):
    """
    Set cached match result with circuit breaker protection.
    
    Args:
        match_id: Unique match identifier
        result: Match result data
    """
    import json
    await redis.setex(f"match_result:{match_id}", 1800, json.dumps(result))


@redis_circuit
async def invalidate_player_cache(player_id: str):
    """
    Invalidate all cached data for a player.
    
    Args:
        player_id: Unique player identifier
    """
    await redis.delete(f"rating:{player_id}")
    await redis.delete(f"stats:{player_id}")
    await redis.delete(f"profile:{player_id}")


# =============================================================================
# 4. COMPLEX SERVICE DECORATOR
# =============================================================================

# Create custom circuit breaker for analytics service
analytics_circuit = CircuitBreaker(
    "analytics_service",
    failure_threshold=3,
    recovery_timeout=45.0,
    half_open_max_calls=2,
    success_threshold=2
)


@analytics_circuit
async def calculate_sim_rating_batch(player_ids: List[str]) -> List[Dict]:
    """
    Calculate SimRating for multiple players with circuit breaker protection.
    
    Args:
        player_ids: List of player identifiers
        
    Returns:
        List of player rating results
        
    Raises:
        CircuitBreakerOpen: If analytics circuit is open
    """
    results = []
    for pid in player_ids:
        # Simulated rating calculation
        rating = await _calculate_sim_rating(pid)
        results.append({
            "player_id": pid,
            "rating": rating,
            "confidence": 0.85,
            "calculated_at": datetime.now(timezone.utc).isoformat()
        })
    return results


async def _calculate_sim_rating(player_id: str) -> float:
    """Internal rating calculation (simulated)."""
    await asyncio.sleep(0.05)
    # Simulated calculation based on player_id hash
    # SECURITY FIX: Use SHA-256 instead of MD5
    import hashlib
    hash_val = int(hashlib.sha256(player_id.encode()).hexdigest(), 16)
    base_rating = 0.8 + (hash_val % 100) / 100 * 0.9  # Range: 0.8 - 1.7
    return round(base_rating, 2)


@analytics_circuit
async def generate_team_analytics(team_id: str, match_history: int = 10) -> Dict:
    """
    Generate comprehensive team analytics with circuit breaker protection.
    
    Args:
        team_id: Unique team identifier
        match_history: Number of matches to analyze
        
    Returns:
        Team analytics data
    """
    await asyncio.sleep(0.1)  # Simulate complex calculation
    
    return {
        "team_id": team_id,
        "matches_analyzed": match_history,
        "win_rate": 0.65,
        "avg_round_difference": 2.3,
        "map_preferences": {
            "Ascent": 0.25,
            "Bind": 0.20,
            "Haven": 0.30,
            "Split": 0.15,
            "Lotus": 0.10
        },
        "trends": {
            "improving": True,
            "momentum_score": 7.5
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@analytics_circuit
async def predict_match_outcome(team_a_id: str, team_b_id: str) -> Dict:
    """
    Predict match outcome with circuit breaker protection.
    
    Args:
        team_a_id: First team identifier
        team_b_id: Second team identifier
        
    Returns:
        Prediction results with confidence scores
    """
    await asyncio.sleep(0.15)  # Simulate ML inference
    
    return {
        "team_a_id": team_a_id,
        "team_b_id": team_b_id,
        "predictions": {
            "team_a_win_probability": 0.58,
            "team_b_win_probability": 0.42,
            "expected_score": "13-11"
        },
        "confidence": 0.72,
        "factors": [
            "recent_performance",
            "head_to_head",
            "map_pool_strength"
        ],
        "predicted_at": datetime.now(timezone.utc).isoformat()
    }


# =============================================================================
# USAGE EXAMPLES
# =============================================================================

async def example_usage():
    """Demonstrate circuit breaker usage patterns."""
    
    print("=" * 60)
    print("Circuit Breaker Examples - Usage Demo")
    print("=" * 60)
    
    # Example 1: Database queries
    print("\n1. Database Queries:")
    try:
        player = await get_player_by_id("player_123")
        print(f"   Player: {player['name']} (Rating: {player['rating']})")
        
        match = await get_match_by_id("match_456")
        print(f"   Match: {match['team_a']} vs {match['team_b']}")
    except CircuitBreakerOpen as e:
        print(f"   Circuit open: {e}")
    
    # Example 2: External API
    print("\n2. External API Calls:")
    try:
        # Note: This requires a valid PANDASCORE_API_KEY
        # match_data = await fetch_pandascore_match("12345")
        print("   API calls protected by api_circuit")
        print("   - fetch_pandascore_match()")
        print("   - fetch_pandascore_series()")
        print("   - fetch_valorant_matches()")
    except CircuitBreakerOpen as e:
        print(f"   Circuit open: {e}")
    
    # Example 3: Redis operations
    print("\n3. Redis Cache Operations:")
    try:
        await set_cached_rating("player_123", 1.35)
        cached = await get_cached_rating("player_123")
        print(f"   Cached rating: {cached}")
        
        await set_cached_match_result("match_456", {"winner": "team_a", "score": "13-11"})
        result = await get_cached_match_result("match_456")
        print(f"   Cached match: {result}")
    except CircuitBreakerOpen as e:
        print(f"   Circuit open: {e}")
    
    # Example 4: Analytics service
    print("\n4. Analytics Service:")
    try:
        ratings = await calculate_sim_rating_batch(["p1", "p2", "p3"])
        print(f"   Batch ratings: {len(ratings)} players processed")
        
        team_analytics = await generate_team_analytics("team_sator")
        print(f"   Team analytics: {team_analytics['win_rate']:.0%} win rate")
        
        prediction = await predict_match_outcome("team_a", "team_b")
        print(f"   Match prediction: {prediction['confidence']:.0%} confidence")
    except CircuitBreakerOpen as e:
        print(f"   Circuit open: {e}")
    
    # Show circuit breaker metrics
    print("\n" + "=" * 60)
    print("Circuit Breaker Metrics")
    print("=" * 60)
    
    from circuit_breaker import get_all_metrics
    metrics = await get_all_metrics()
    
    for name, m in metrics.items():
        print(f"\n   {name}:")
        print(f"     State: {m.state.value}")
        print(f"     Total calls: {m.total_calls}")
        print(f"     Total successes: {m.total_successes}")
        print(f"     Total failures: {m.total_failures}")


if __name__ == "__main__":
    asyncio.run(example_usage())
