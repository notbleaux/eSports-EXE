# [Ver001.000]
"""
Redis-Backed Circuit Breaker for Distributed Systems
Provides cluster-wide state synchronization for circuit breakers.
"""

import time
import redis.asyncio as redis
from typing import Dict, Optional, Any, List
import logging

from circuit_breaker import (
    CircuitBreaker,
    CircuitState,
    CircuitBreakerConfig,
    CircuitBreakerMetrics,
    CircuitBreakerOpen
)

logger = logging.getLogger(__name__)


class RedisCircuitBreaker(CircuitBreaker):
    """
    Circuit breaker with Redis-backed state for distributed systems.
    
    This implementation ensures circuit breaker state is synchronized
    across all service instances in a cluster, preventing thundering
    herd problems during recovery.
    
    Usage:
        redis_client = redis.from_url("redis://localhost:6379")
        cb = RedisCircuitBreaker("database", redis_client, failure_threshold=5)
        
        @cb
        async def get_data():
            return await db.query()
    """
    
    def __init__(
        self,
        name: str,
        redis_client: redis.Redis,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 3,
        success_threshold: int = 2,
        ttl: Optional[int] = None
    ):
        """
        Initialize Redis-backed circuit breaker.
        
        Args:
            name: Unique circuit breaker identifier
            redis_client: Async Redis client instance
            failure_threshold: Failures before opening circuit
            recovery_timeout: Seconds before attempting recovery
            half_open_max_calls: Max concurrent calls in half-open state
            success_threshold: Successes required to close circuit
            ttl: Optional TTL for Redis keys (seconds)
        """
        # Initialize base circuit breaker without Redis (we handle it here)
        self.config = CircuitBreakerConfig(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            half_open_max_calls=half_open_max_calls,
            success_threshold=success_threshold
        )
        self.redis = redis_client
        self._ttl = ttl or int(recovery_timeout * 2)  # Default: 2x recovery timeout
        
        # Local state cache (Redis is source of truth)
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        self._last_failure_time: Optional[float] = None
        
        # Metrics
        self._metrics = CircuitBreakerMetrics(name=name, state=CircuitState.CLOSED)
        
        # Register in class registry
        CircuitBreaker._registry[name] = self
        
        logger.info(f"[RedisCircuitBreaker] Created: {name}")
    
    def _key(self, suffix: str) -> str:
        """Generate Redis key for this circuit breaker."""
        return f"cb:{self.config.name}:{suffix}"
    
    async def _get_state(self) -> CircuitState:
        """Get current circuit state from Redis."""
        try:
            state_str = await self.redis.get(self._key("state"))
            if state_str:
                return CircuitState(state_str.decode())
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error getting state: {e}")
        
        # Fallback to local state if Redis fails
        return self._state
    
    async def _set_state(self, state: CircuitState):
        """Set circuit state in Redis with TTL."""
        try:
            await self.redis.setex(self._key("state"), self._ttl, state.value)
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error setting state: {e}")
        
        # Update local cache
        self._state = state
        self._metrics.state = state
        logger.info(f"[RedisCircuitBreaker:{self.config.name}] State changed to: {state.value}")
    
    async def _increment_failure(self):
        """Increment failure counter in Redis."""
        try:
            pipe = self.redis.pipeline()
            pipe.incr(self._key("failures"))
            pipe.setex(self._key("last_failure"), self._ttl, str(time.time()))
            results = await pipe.execute()
            self._failure_count = int(results[0])
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error incrementing failure: {e}")
            self._failure_count += 1
        
        self._metrics.failure_count = self._failure_count
        self._metrics.total_failures += 1
        self._last_failure_time = time.time()
        self._metrics.last_failure_time = self._last_failure_time
    
    async def _increment_success(self):
        """Increment success counter in Redis."""
        try:
            result = await self.redis.incr(self._key("successes"))
            self._success_count = int(result)
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error incrementing success: {e}")
            self._success_count += 1
        
        self._metrics.success_count = self._success_count
        self._metrics.total_successes += 1
        self._metrics.last_success_time = time.time()
    
    async def _reset_counters(self):
        """Reset all counters in Redis."""
        try:
            pipe = self.redis.pipeline()
            pipe.delete(self._key("failures"))
            pipe.delete(self._key("successes"))
            pipe.delete(self._key("half_open_calls"))
            await pipe.execute()
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error resetting counters: {e}")
        
        # Reset local cache
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        self._metrics.failure_count = 0
        self._metrics.success_count = 0
    
    async def _get_half_open_calls(self) -> int:
        """Get number of calls in half-open state from Redis."""
        try:
            calls = await self.redis.get(self._key("half_open_calls"))
            return int(calls) if calls else 0
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error getting half-open calls: {e}")
            return self._half_open_calls
    
    async def _increment_half_open_calls(self):
        """Increment half-open call counter in Redis."""
        try:
            result = await self.redis.incr(self._key("half_open_calls"))
            self._half_open_calls = int(result)
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error incrementing half-open calls: {e}")
            self._half_open_calls += 1
    
    async def _get_last_failure_time(self) -> float:
        """Get last failure timestamp from Redis."""
        try:
            last = await self.redis.get(self._key("last_failure"))
            return float(last) if last else 0.0
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error getting last failure time: {e}")
            return self._last_failure_time or 0.0
    
    async def _set_last_failure_time(self, timestamp: float):
        """Set last failure timestamp in Redis."""
        try:
            await self.redis.setex(self._key("last_failure"), self._ttl, str(timestamp))
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error setting last failure time: {e}")
        self._last_failure_time = timestamp
    
    async def get_metrics(self) -> CircuitBreakerMetrics:
        """Get current metrics from Redis."""
        try:
            pipe = self.redis.pipeline()
            pipe.get(self._key("state"))
            pipe.get(self._key("failures"))
            pipe.get(self._key("successes"))
            pipe.get(self._key("half_open_calls"))
            pipe.get(self._key("last_failure"))
            results = await pipe.execute()
            
            self._metrics.state = CircuitState(results[0].decode()) if results[0] else self._state
            self._metrics.failure_count = int(results[1]) if results[1] else self._failure_count
            self._metrics.success_count = int(results[2]) if results[2] else self._success_count
            self._metrics.last_failure_time = float(results[4]) if results[4] else self._last_failure_time
        except Exception as e:
            logger.error(f"[RedisCircuitBreaker:{self.config.name}] Error getting metrics: {e}")
            self._metrics.state = await self._get_state()
        
        return self._metrics
    
    async def force_open(self):
        """Manually force circuit to OPEN state."""
        await self._set_state(CircuitState.OPEN)
        await self._set_last_failure_time(time.time())
        logger.warning(f"[RedisCircuitBreaker:{self.config.name}] Circuit manually OPENED")
    
    async def force_closed(self):
        """Manually force circuit to CLOSED state."""
        await self._set_state(CircuitState.CLOSED)
        await self._reset_counters()
        logger.warning(f"[RedisCircuitBreaker:{self.config.name}] Circuit manually CLOSED")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Redis connectivity and circuit health."""
        try:
            await self.redis.ping()
            redis_healthy = True
        except Exception:
            redis_healthy = False
        
        return {
            "name": self.config.name,
            "redis_healthy": redis_healthy,
            "state": (await self._get_state()).value,
            "failure_count": self._failure_count,
            "success_count": self._success_count,
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
                "half_open_max_calls": self.config.half_open_max_calls,
                "success_threshold": self.config.success_threshold
            }
        }


async def create_circuit_breaker(
    name: str,
    use_redis: bool = True,
    redis_url: Optional[str] = None,
    redis_client: Optional[redis.Redis] = None,
    **kwargs
) -> CircuitBreaker:
    """
    Factory for creating circuit breakers.
    
    Creates a Redis-backed circuit breaker if Redis is available,
    otherwise falls back to a local circuit breaker.
    
    Args:
        name: Unique circuit breaker identifier
        use_redis: Whether to use Redis-backed circuit breaker
        redis_url: Redis connection URL (e.g., "redis://localhost:6379")
        redis_client: Existing Redis client instance (alternative to redis_url)
        **kwargs: Additional configuration parameters
        
    Returns:
        CircuitBreaker: RedisCircuitBreaker if Redis available, else CircuitBreaker
        
    Example:
        # Using Redis URL
        cb = await create_circuit_breaker("database", use_redis=True, redis_url="redis://localhost:6379")
        
        # Using existing Redis client
        redis = redis.from_url("redis://localhost:6379")
        cb = await create_circuit_breaker("database", use_redis=True, redis_client=redis)
        
        # Local circuit breaker (no Redis)
        cb = await create_circuit_breaker("database", use_redis=False)
    """
    if use_redis:
        try:
            if redis_client:
                # Verify connection
                await redis_client.ping()
                return RedisCircuitBreaker(name, redis_client, **kwargs)
            elif redis_url:
                client = await redis.from_url(redis_url)
                await client.ping()
                return RedisCircuitBreaker(name, client, **kwargs)
        except Exception as e:
            logger.warning(f"[create_circuit_breaker] Redis unavailable, using local CB: {e}")
    
    return CircuitBreaker(name, **kwargs)


async def get_cluster_metrics(redis_client: redis.Redis) -> Dict[str, Dict[str, Any]]:
    """
    Get circuit breaker metrics from all services in cluster.
    
    Queries Redis for all circuit breaker keys and aggregates
    metrics across the entire cluster.
    
    Args:
        redis_client: Async Redis client connected to cluster
        
    Returns:
        Dict mapping circuit breaker names to their metrics
        
    Example:
        redis = redis.from_url("redis://localhost:6379")
        metrics = await get_cluster_metrics(redis)
        for name, cb_metrics in metrics.items():
            print(f"{name}: {cb_metrics['state']} ({cb_metrics['total_calls']} calls)")
    """
    metrics = {}
    
    try:
        # Find all circuit breaker state keys
        pattern = "cb:*:state"
        keys = await redis_client.keys(pattern)
        
        for key in keys:
            key_str = key.decode() if isinstance(key, bytes) else key
            # Extract circuit breaker name from key (format: cb:{name}:state)
            parts = key_str.split(":")
            if len(parts) >= 3:
                name = parts[1]
                
                # Try to get from registry first
                cb = CircuitBreaker._registry.get(name)
                if cb and isinstance(cb, RedisCircuitBreaker):
                    metrics[name] = await cb.get_metrics()
                else:
                    # Read directly from Redis if not in local registry
                    pipe = redis_client.pipeline()
                    pipe.get(f"cb:{name}:state")
                    pipe.get(f"cb:{name}:failures")
                    pipe.get(f"cb:{name}:successes")
                    pipe.get(f"cb:{name}:last_failure")
                    results = await pipe.execute()
                    
                    metrics[name] = CircuitBreakerMetrics(
                        name=name,
                        state=CircuitState(results[0].decode()) if results[0] else CircuitState.CLOSED,
                        failure_count=int(results[1]) if results[1] else 0,
                        success_count=int(results[2]) if results[2] else 0,
                        last_failure_time=float(results[3]) if results[3] else None
                    )
    except Exception as e:
        logger.error(f"[get_cluster_metrics] Error fetching cluster metrics: {e}")
    
    return metrics


async def reset_all_cluster_circuits(redis_client: redis.Redis) -> List[str]:
    """
    Reset all circuit breakers in the cluster to CLOSED state.
    
    Useful for emergency recovery or after widespread issues.
    
    Args:
        redis_client: Async Redis client connected to cluster
        
    Returns:
        List of circuit breaker names that were reset
        
    Warning:
        Use with caution - this overrides all circuit breaker states
        across the entire cluster.
    """
    reset_circuits = []
    
    try:
        pattern = "cb:*:state"
        keys = await redis_client.keys(pattern)
        
        for key in keys:
            key_str = key.decode() if isinstance(key, bytes) else key
            name = key_str.split(":")[1]
            
            # Delete all keys for this circuit breaker
            pipe = redis_client.pipeline()
            pipe.delete(f"cb:{name}:state")
            pipe.delete(f"cb:{name}:failures")
            pipe.delete(f"cb:{name}:successes")
            pipe.delete(f"cb:{name}:half_open_calls")
            pipe.delete(f"cb:{name}:last_failure")
            await pipe.execute()
            
            reset_circuits.append(name)
            logger.warning(f"[reset_all_cluster_circuits] Reset circuit: {name}")
    except Exception as e:
        logger.error(f"[reset_all_cluster_circuits] Error resetting circuits: {e}")
    
    return reset_circuits


async def get_cluster_health(redis_client: redis.Redis) -> Dict[str, Any]:
    """
    Get overall cluster health summary.
    
    Returns aggregated statistics about all circuit breakers
    in the cluster.
    
    Args:
        redis_client: Async Redis client connected to cluster
        
    Returns:
        Dict with cluster-wide health statistics
    """
    cluster_metrics = await get_cluster_metrics(redis_client)
    
    total_circuits = len(cluster_metrics)
    open_circuits = sum(1 for m in cluster_metrics.values() if m.state == CircuitState.OPEN)
    half_open_circuits = sum(1 for m in cluster_metrics.values() if m.state == CircuitState.HALF_OPEN)
    closed_circuits = sum(1 for m in cluster_metrics.values() if m.state == CircuitState.CLOSED)
    
    total_failures = sum(m.total_failures for m in cluster_metrics.values())
    total_successes = sum(m.total_successes for m in cluster_metrics.values())
    total_calls = total_failures + total_successes
    
    return {
        "cluster_summary": {
            "total_circuits": total_circuits,
            "healthy_circuits": closed_circuits,
            "degraded_circuits": half_open_circuits,
            "unhealthy_circuits": open_circuits,
            "health_percentage": (closed_circuits / total_circuits * 100) if total_circuits > 0 else 100
        },
        "call_statistics": {
            "total_calls": total_calls,
            "total_failures": total_failures,
            "total_successes": total_successes,
            "failure_rate": (total_failures / total_calls * 100) if total_calls > 0 else 0
        },
        "circuits": {
            name: {
                "state": m.state.value,
                "failure_count": m.failure_count,
                "success_count": m.success_count,
                "total_calls": m.total_calls
            }
            for name, m in cluster_metrics.items()
        }
    }
