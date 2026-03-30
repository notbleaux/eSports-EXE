"""[Ver001.000]
Health check endpoints for monitoring and Kubernetes probes.

BONUS ADDITION: Provides liveness, readiness, and component health endpoints.
"""

import time
import logging
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status

from .database import check_database_connection
from .redis_cache import get_redis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def liveness_probe() -> Dict[str, Any]:
    """
    Kubernetes liveness probe - indicates service is running.
    
    Returns 200 if the application process is alive.
    Kubernetes uses this to restart crashed containers.
    """
    return {
        "status": "alive",
        "service": "njz-platform-api",
        "version": "2.1.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ready")
async def readiness_probe() -> Dict[str, Any]:
    """
    Kubernetes readiness probe - indicates service can accept traffic.
    
    Returns 200 only if all dependencies (database, redis) are healthy.
    Kubernetes uses this to add/remove pod from service endpoints.
    """
    checks = {}
    
    # Check database
    try:
        checks["database"] = "healthy" if await check_database_connection() else "unhealthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        checks["database"] = "unhealthy"
    
    # Check Redis
    try:
        redis = await get_redis_client()
        await redis.ping()
        checks["redis"] = "healthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        checks["redis"] = "unhealthy"
    
    # Overall status
    all_healthy = all(status == "healthy" for status in checks.values())
    
    if not all_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "not_ready",
                "checks": checks,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    return {
        "status": "ready",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/db")
async def database_health() -> Dict[str, Any]:
    """
    Detailed database health check with latency metrics.
    
    Returns connection status and query latency for performance monitoring.
    """
    start = time.time()
    
    try:
        healthy = await check_database_connection()
        latency = time.time() - start
        
        return {
            "component": "database",
            "healthy": healthy,
            "latency_ms": round(latency * 1000, 2),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Database health check error: {e}")
        return {
            "component": "database",
            "healthy": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/redis")
async def redis_health() -> Dict[str, Any]:
    """
    Detailed Redis health check with latency metrics.
    """
    start = time.time()
    
    try:
        redis = await get_redis_client()
        await redis.ping()
        latency = time.time() - start
        
        # Get Redis info
        info = await redis.info()
        
        return {
            "component": "redis",
            "healthy": True,
            "latency_ms": round(latency * 1000, 2),
            "version": info.get("redis_version", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Redis health check error: {e}")
        return {
            "component": "redis",
            "healthy": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("")
async def health_summary() -> Dict[str, Any]:
    """
    Overall health summary for external monitoring systems.
    
    Provides a quick overview of all system components.
    """
    components = {}
    
    # Database check
    try:
        db_healthy = await check_database_connection()
        components["database"] = "up" if db_healthy else "down"
    except Exception:
        components["database"] = "down"
    
    # Redis check
    try:
        redis = await get_redis_client()
        await redis.ping()
        components["redis"] = "up"
    except Exception:
        components["redis"] = "down"
    
    # Overall status
    all_up = all(status == "up" for status in components.values())
    
    return {
        "status": "healthy" if all_up else "degraded",
        "components": components,
        "timestamp": datetime.utcnow().isoformat()
    }
