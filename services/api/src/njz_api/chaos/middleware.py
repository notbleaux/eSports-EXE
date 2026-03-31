"""[Ver001.000]
Chaos injection middleware for FastAPI.

Integrates with the chaos engine to inject failures into HTTP requests
based on active chaos experiments.
"""

import asyncio
import logging
import random
import time
from typing import Optional

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger(__name__)


class ChaosMiddleware(BaseHTTPMiddleware):
    """Middleware to inject chaos into HTTP requests.
    
    This middleware checks for active chaos experiments and injects
    failures (latency, errors, exceptions) based on experiment configuration.
    
    Usage:
        from fastapi import FastAPI
        from njz_api.chaos.middleware import ChaosMiddleware
        
        app = FastAPI()
        app.add_middleware(ChaosMiddleware)
    """
    
    def __init__(self, app, skip_health_checks: bool = True):
        """Initialize chaos middleware.
        
        Args:
            app: FastAPI application
            skip_health_checks: Skip chaos on health endpoints
        """
        super().__init__(app)
        self.skip_health_checks = skip_health_checks
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process request with potential chaos injection."""
        from . import chaos_engine, ChaosMode
        
        # Skip health checks if configured
        if self.skip_health_checks and request.url.path.startswith("/health"):
            return await call_next(request)
        
        # Skip chaos endpoints themselves
        if request.url.path.startswith("/chaos"):
            return await call_next(request)
        
        # Check if chaos should be injected
        result = chaos_engine.should_inject(request.url.path)
        
        if result:
            experiment, config = result
            return await self._apply_chaos(
                request, call_next, experiment, config
            )
        
        # Normal request processing
        return await call_next(request)
    
    async def _apply_chaos(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
        experiment,
        config,
    ) -> Response:
        """Apply chaos based on mode."""
        from . import ChaosMode
        
        mode = config.mode
        start_time = time.time()
        
        try:
            if mode == ChaosMode.LATENCY:
                return await self._inject_latency(request, call_next, experiment, config)
            
            elif mode == ChaosMode.ERROR:
                return await self._inject_error(request, experiment, config)
            
            elif mode == ChaosMode.EXCEPTION:
                return await self._inject_exception(experiment, config)
            
            elif mode == ChaosMode.DB_SLOW:
                return await self._inject_db_slow(request, call_next, experiment)
            
            elif mode == ChaosMode.CACHE_MISS:
                return await self._inject_cache_miss(request, call_next, experiment)
            
            elif mode == ChaosMode.NETWORK_PARTITION:
                return await self._inject_network_partition(experiment, config)
            
            else:
                # Other modes are handled elsewhere (e.g., CPU, MEMORY at system level)
                return await call_next(request)
        
        finally:
            # Record metrics
            latency_ms = (time.time() - start_time) * 1000
            experiment.metrics.record_injection(latency_ms)
    
    async def _inject_latency(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
        experiment,
        config,
    ) -> Response:
        """Inject latency delay."""
        # Delay: 100ms - 2000ms based on intensity
        base_delay = random.uniform(0.1, 2.0)
        delay = base_delay * config.intensity
        
        logger.debug(f"🐌 Injecting {delay:.2f}s latency into {request.url.path}")
        await asyncio.sleep(delay)
        
        return await call_next(request)
    
    async def _inject_error(
        self,
        request: Request,
        experiment,
        config,
    ) -> Response:
        """Inject HTTP error response."""
        # Error codes based on intensity
        if config.intensity < 0.5:
            errors = [500, 502, 503]
        elif config.intensity < 1.5:
            errors = [500, 502, 503, 504, 507]
        else:
            errors = [500, 502, 503, 504, 507, 508, 509]
        
        error_code = random.choice(errors)
        
        logger.warning(
            f"💥 Injecting HTTP {error_code} error into {request.url.path}"
        )
        experiment.metrics.record_error()
        
        raise HTTPException(
            status_code=error_code,
            detail={
                "error": "Chaos engineering: simulated failure",
                "chaos_experiment": experiment.name,
                "chaos_mode": "error",
            },
        )
    
    async def _inject_exception(
        self,
        experiment,
        config,
    ) -> None:
        """Inject random exception."""
        exceptions = [
            ValueError("Chaos: Random value error"),
            RuntimeError("Chaos: Random runtime error"),
            ConnectionError("Chaos: Connection failed"),
            TimeoutError("Chaos: Operation timed out"),
            OSError("Chaos: System I/O error"),
        ]
        
        if config.intensity > 2.0:
            exceptions.extend([
                MemoryError("Chaos: Out of memory"),
                RecursionError("Chaos: Maximum recursion depth exceeded"),
            ])
        
        exc = random.choice(exceptions)
        logger.warning(f"💣 Injecting {type(exc).__name__}: {exc}")
        experiment.metrics.record_error()
        
        raise exc
    
    async def _inject_db_slow(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
        experiment,
    ) -> Response:
        """Mark request for database slowdown."""
        # This flag will be picked up by database tracing middleware
        request.state.chaos_db_slow = True
        request.state.chaos_db_delay = random.uniform(0.5, 2.0)
        
        logger.debug(f"🐢 Marking {request.url.path} for DB slowdown")
        
        return await call_next(request)
    
    async def _inject_cache_miss(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
        experiment,
    ) -> Response:
        """Force cache miss for this request."""
        # This flag will be picked up by cache tracing middleware
        request.state.chaos_cache_miss = True
        
        logger.debug(f"🔄 Forcing cache miss for {request.url.path}")
        
        return await call_next(request)
    
    async def _inject_network_partition(
        self,
        experiment,
        config,
    ) -> None:
        """Simulate network partition (complete request failure)."""
        delay = config.intensity * 5  # 5-50 seconds
        
        logger.warning(
            f"🌐 Simulating network partition for {delay}s (chaos: {experiment.name})"
        )
        
        # Hang for a while then fail
        await asyncio.sleep(delay)
        
        raise HTTPException(
            status_code=504,
            detail={
                "error": "Chaos engineering: network partition simulated",
                "chaos_experiment": experiment.name,
                "partition_duration": delay,
            },
        )


class ChaosRequestInjector:
    """Helper class for injecting chaos into specific requests.
    
    Can be used to wrap specific functions or endpoints with chaos.
    """
    
    @staticmethod
    async def with_latency(
        func,
        *args,
        delay_ms: float = 100.0,
        jitter: float = 0.2,
        **kwargs,
    ):
        """Execute function with injected latency.
        
        Args:
            func: Async function to execute
            delay_ms: Base delay in milliseconds
            jitter: Random jitter factor (0.0-1.0)
            *args, **kwargs: Arguments for func
        """
        jitter_amount = delay_ms * jitter * random.uniform(-1, 1)
        actual_delay = max(0, (delay_ms + jitter_amount) / 1000)
        
        await asyncio.sleep(actual_delay)
        return await func(*args, **kwargs)
    
    @staticmethod
    def with_probability(probability: float) -> bool:
        """Check if chaos should be injected based on probability.
        
        Args:
            probability: Probability between 0.0 and 1.0
            
        Returns:
            True if chaos should be injected
        """
        return random.random() < probability


__all__ = [
    "ChaosMiddleware",
    "ChaosRequestInjector",
]
