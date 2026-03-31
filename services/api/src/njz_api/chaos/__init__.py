"""[Ver001.000]
Chaos Engineering Framework for NJZiteGeisTe Platform

Failure injection modes:
- Latency: Add delays to responses
- Errors: Return HTTP 5xx errors
- Exceptions: Raise random exceptions
- Memory: Consume memory
- CPU: Spike CPU usage
- DB: Slow queries, connection drops
- Cache: Cache misses, Redis failures
- Network: Packet loss, partitions

Usage:
    from njz_api.chaos import chaos_engine, ChaosMode, ChaosConfig
    
    # Start latency experiment
    config = ChaosConfig(
        mode=ChaosMode.LATENCY,
        probability=0.3,
        duration=60,
        intensity=1.0,
        targets=["/v1/tournaments"]
    )
    chaos_engine.start_experiment("latency_test", config)
    
    # Stop experiment
    chaos_engine.stop_experiment("latency_test")
"""

import asyncio
import gc
import logging
import random
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


class ChaosMode(Enum):
    """Available chaos injection modes."""
    
    LATENCY = "latency"
    ERROR = "error"
    EXCEPTION = "exception"
    MEMORY = "memory"
    CPU = "cpu"
    DB_SLOW = "db_slow"
    DB_DISCONNECT = "db_disconnect"
    CACHE_MISS = "cache_miss"
    REDIS_FAIL = "redis_fail"
    NETWORK_PARTITION = "network_partition"
    DEADLOCK = "deadlock"
    GOROUTINE_LEAK = "goroutine_leak"


@dataclass
class ChaosMetrics:
    """Metrics for a chaos experiment."""
    
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    requests_affected: int = 0
    errors_injected: int = 0
    latency_added_ms: float = 0.0
    last_injection: Optional[datetime] = None
    
    def record_injection(self, latency_ms: float = 0.0):
        """Record a chaos injection."""
        self.requests_affected += 1
        self.last_injection = datetime.now(timezone.utc)
        if latency_ms > 0:
            self.latency_added_ms += latency_ms
    
    def record_error(self):
        """Record an error injection."""
        self.errors_injected += 1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary."""
        runtime = (datetime.now(timezone.utc) - self.started_at).total_seconds()
        return {
            "started_at": self.started_at.isoformat(),
            "runtime_seconds": runtime,
            "requests_affected": self.requests_affected,
            "errors_injected": self.errors_injected,
            "latency_added_ms": round(self.latency_added_ms, 2),
            "avg_latency_ms": round(self.latency_added_ms / max(self.requests_affected, 1), 2),
            "last_injection": self.last_injection.isoformat() if self.last_injection else None,
        }


@dataclass
class ChaosConfig:
    """Configuration for chaos experiments."""
    
    mode: ChaosMode
    probability: float = 0.1
    duration: int = 60
    intensity: float = 1.0
    targets: List[str] = field(default_factory=lambda: ["*"])
    
    def __post_init__(self):
        """Validate configuration."""
        if not 0.0 <= self.probability <= 1.0:
            raise ValueError(f"Probability must be between 0.0 and 1.0, got {self.probability}")
        if not 0.0 <= self.intensity <= 10.0:
            raise ValueError(f"Intensity must be between 0.0 and 10.0, got {self.intensity}")
        if self.duration < 1:
            raise ValueError(f"Duration must be at least 1 second, got {self.duration}")


@dataclass
class ChaosExperiment:
    """Active chaos experiment with metrics."""
    
    name: str
    config: ChaosConfig
    metrics: ChaosMetrics = field(default_factory=ChaosMetrics)
    _stop_event: asyncio.Event = field(default_factory=asyncio.Event)
    
    @property
    def is_active(self) -> bool:
        """Check if experiment is still active."""
        runtime = (datetime.now(timezone.utc) - self.metrics.started_at).total_seconds()
        return runtime < self.config.duration and not self._stop_event.is_set()
    
    def stop(self):
        """Stop the experiment."""
        self._stop_event.set()


class ChaosEngine:
    """Main chaos engineering controller.
    
    Manages chaos experiments and provides methods for injecting failures
    into the system for resilience testing.
    """
    
    def __init__(self):
        self.active_experiments: Dict[str, ChaosExperiment] = {}
        self._memory_hog: List[bytearray] = []
        self._cpu_tasks: Set[asyncio.Task] = set()
        self._db_slow_enabled: bool = False
        self._db_slow_delay: float = 0.0
        self._cache_miss_enabled: bool = False
        self._redis_fail_enabled: bool = False
        self._lock = asyncio.Lock()
    
    async def start_experiment(self, name: str, config: ChaosConfig) -> ChaosExperiment:
        """Start a chaos experiment.
        
        Args:
            name: Unique name for the experiment
            config: Chaos experiment configuration
            
        Returns:
            The created ChaosExperiment instance
            
        Raises:
            ValueError: If experiment with same name already exists
        """
        async with self._lock:
            if name in self.active_experiments:
                raise ValueError(f"Experiment '{name}' already exists")
            
            experiment = ChaosExperiment(name=name, config=config)
            self.active_experiments[name] = experiment
            
            logger.warning(
                f"🌩️  Chaos experiment started: {name} "
                f"(mode={config.mode.value}, prob={config.probability}, "
                f"intensity={config.intensity}, duration={config.duration}s)"
            )
            
            # Start mode-specific chaos
            if config.mode == ChaosMode.MEMORY:
                await self._start_memory_pressure(config.intensity)
            elif config.mode == ChaosMode.CPU:
                await self._start_cpu_spike(config.intensity)
            elif config.mode == ChaosMode.DB_SLOW:
                self._db_slow_enabled = True
                self._db_slow_delay = config.intensity * 2.0  # Max 20s delay
            elif config.mode == ChaosMode.CACHE_MISS:
                self._cache_miss_enabled = True
            elif config.mode == ChaosMode.REDIS_FAIL:
                self._redis_fail_enabled = True
            
            # Schedule auto-stop
            asyncio.create_task(self._auto_stop_experiment(name, config.duration))
            
            return experiment
    
    async def stop_experiment(self, name: str) -> bool:
        """Stop a chaos experiment.
        
        Args:
            name: Name of the experiment to stop
            
        Returns:
            True if experiment was found and stopped, False otherwise
        """
        async with self._lock:
            if name not in self.active_experiments:
                return False
            
            experiment = self.active_experiments.pop(name)
            experiment.stop()
            
            # Clean up mode-specific resources
            config = experiment.config
            if config.mode == ChaosMode.MEMORY:
                await self._stop_memory_pressure()
            elif config.mode == ChaosMode.CPU:
                await self._stop_cpu_spike()
            elif config.mode == ChaosMode.DB_SLOW:
                self._db_slow_enabled = False
                self._db_slow_delay = 0.0
            elif config.mode == ChaosMode.CACHE_MISS:
                self._cache_miss_enabled = False
            elif config.mode == ChaosMode.REDIS_FAIL:
                self._redis_fail_enabled = False
            
            logger.warning(
                f"🛑 Chaos experiment stopped: {name} "
                f"(affected {experiment.metrics.requests_affected} requests, "
                f"injected {experiment.metrics.errors_injected} errors)"
            )
            
            return True
    
    async def stop_all_experiments(self) -> int:
        """Stop all active experiments.
        
        Returns:
            Number of experiments stopped
        """
        async with self._lock:
            count = len(self.active_experiments)
            names = list(self.active_experiments.keys())
        
        for name in names:
            await self.stop_experiment(name)
        
        return count
    
    def should_inject(self, endpoint: str) -> Optional[Tuple[ChaosExperiment, ChaosConfig]]:
        """Check if chaos should be injected for endpoint.
        
        Args:
            endpoint: The API endpoint being called
            
        Returns:
            Tuple of (experiment, config) if chaos should be injected, None otherwise
        """
        for experiment in self.active_experiments.values():
            if not experiment.is_active:
                continue
            
            config = experiment.config
            if self._matches_target(endpoint, config.targets):
                if random.random() < config.probability:
                    return (experiment, config)
        return None
    
    def get_db_delay(self) -> float:
        """Get current database delay if DB_SLOW mode is active."""
        return self._db_slow_delay if self._db_slow_enabled else 0.0
    
    def should_force_cache_miss(self) -> bool:
        """Check if cache misses should be forced."""
        return self._cache_miss_enabled and random.random() < 0.5
    
    def should_fail_redis(self) -> bool:
        """Check if Redis should fail."""
        return self._redis_fail_enabled and random.random() < 0.3
    
    def _matches_target(self, endpoint: str, targets: List[str]) -> bool:
        """Check if endpoint matches target patterns.
        
        Supports wildcards:
        - "*" matches everything
        - "/v1/tournaments" exact match
        - "/v1/tournaments/*" prefix match
        """
        for target in targets:
            if target == "*":
                return True
            if target.endswith("*"):
                if endpoint.startswith(target[:-1]):
                    return True
            if endpoint == target or endpoint.startswith(target.rstrip("/") + "/"):
                return True
        return False
    
    async def _start_memory_pressure(self, intensity: float):
        """Consume memory to simulate pressure."""
        target_mb = int(50 * intensity)  # 50MB per intensity unit
        
        try:
            # Allocate memory in chunks to avoid large allocations
            for _ in range(target_mb):
                chunk = bytearray(1024 * 1024)  # 1MB chunks
                self._memory_hog.append(chunk)
            
            logger.warning(f"🧠 Memory pressure started: {target_mb}MB allocated")
        except MemoryError:
            logger.error("Memory allocation failed - system under severe pressure")
    
    async def _stop_memory_pressure(self):
        """Release memory pressure."""
        self._memory_hog.clear()
        gc.collect()
        logger.info("🧠 Memory pressure released")
    
    async def _start_cpu_spike(self, intensity: float):
        """Start CPU-intensive tasks."""
        num_tasks = int(2 * intensity)  # 2 tasks per intensity unit
        
        async def cpu_hog():
            """CPU-intensive busy work."""
            while True:
                # Mathematical operations to consume CPU
                _ = sum(i * i for i in range(100000))
                await asyncio.sleep(0.01)  # Yield to prevent blocking
        
        for i in range(num_tasks):
            task = asyncio.create_task(cpu_hog(), name=f"chaos_cpu_hog_{i}")
            self._cpu_tasks.add(task)
            task.add_done_callback(self._cpu_tasks.discard)
        
        logger.warning(f"🔥 CPU spike started: {num_tasks} tasks")
    
    async def _stop_cpu_spike(self):
        """Stop CPU-intensive tasks."""
        for task in list(self._cpu_tasks):
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        self._cpu_tasks.clear()
        logger.info("🔥 CPU spike stopped")
    
    async def _auto_stop_experiment(self, name: str, delay: int):
        """Auto-stop experiment after duration."""
        await asyncio.sleep(delay)
        await self.stop_experiment(name)
    
    def get_experiments_summary(self) -> Dict[str, Any]:
        """Get summary of all experiments."""
        return {
            "active_count": len(self.active_experiments),
            "experiments": [
                {
                    "name": name,
                    "mode": exp.config.mode.value,
                    "probability": exp.config.probability,
                    "intensity": exp.config.intensity,
                    "targets": exp.config.targets,
                    "is_active": exp.is_active,
                    "metrics": exp.metrics.to_dict(),
                }
                for name, exp in self.active_experiments.items()
            ],
            "system_effects": {
                "db_slow_enabled": self._db_slow_enabled,
                "db_slow_delay_ms": self._db_slow_delay * 1000,
                "cache_miss_enabled": self._cache_miss_enabled,
                "redis_fail_enabled": self._redis_fail_enabled,
            },
        }
    
    def get_recommendations(self) -> List[Dict[str, Any]]:
        """Generate chaos engineering recommendations."""
        recommendations = []
        
        # Analyze active experiments
        for name, exp in self.active_experiments.items():
            metrics = exp.metrics
            
            if metrics.requests_affected == 0:
                recommendations.append({
                    "type": "warning",
                    "experiment": name,
                    "message": f"Experiment '{name}' has not affected any requests - check target patterns",
                })
            
            if exp.config.probability < 0.05:
                recommendations.append({
                    "type": "info",
                    "experiment": name,
                    "message": f"Experiment '{name}' has low probability - consider increasing for better coverage",
                })
            
            if metrics.errors_injected > metrics.requests_affected * 0.5:
                recommendations.append({
                    "type": "alert",
                    "experiment": name,
                    "message": f"Experiment '{name}' has high error rate - system may be too fragile",
                })
        
        # General recommendations
        if not self.active_experiments:
            recommendations.append({
                "type": "info",
                "experiment": None,
                "message": "No active chaos experiments - consider running regular chaos tests",
            })
        
        return recommendations


# Global chaos engine instance
chaos_engine = ChaosEngine()


# Convenience functions for common chaos operations
async def inject_latency(
    name: str,
    duration: int = 60,
    probability: float = 0.3,
    intensity: float = 1.0,
    targets: Optional[List[str]] = None,
) -> ChaosExperiment:
    """Inject latency into requests.
    
    Args:
        name: Experiment name
        duration: Duration in seconds
        probability: Probability of injection (0.0-1.0)
        intensity: Latency multiplier (1.0 = 100-500ms, higher = more latency)
        targets: Target endpoints
        
    Returns:
        The created ChaosExperiment
    """
    config = ChaosConfig(
        mode=ChaosMode.LATENCY,
        probability=probability,
        duration=duration,
        intensity=intensity,
        targets=targets or ["*"],
    )
    return await chaos_engine.start_experiment(name, config)


async def inject_errors(
    name: str,
    duration: int = 60,
    probability: float = 0.1,
    targets: Optional[List[str]] = None,
) -> ChaosExperiment:
    """Inject HTTP 5xx errors into responses.
    
    Args:
        name: Experiment name
        duration: Duration in seconds
        probability: Probability of injection (0.0-1.0)
        targets: Target endpoints
        
    Returns:
        The created ChaosExperiment
    """
    config = ChaosConfig(
        mode=ChaosMode.ERROR,
        probability=probability,
        duration=duration,
        targets=targets or ["*"],
    )
    return await chaos_engine.start_experiment(name, config)


async def simulate_db_slowdown(
    name: str,
    duration: int = 60,
    probability: float = 0.3,
    intensity: float = 1.0,
) -> ChaosExperiment:
    """Simulate slow database queries.
    
    Args:
        name: Experiment name
        duration: Duration in seconds
        probability: Probability of injection (0.0-1.0)
        intensity: Delay multiplier (1.0 = 0-2s, higher = more delay)
        
    Returns:
        The created ChaosExperiment
    """
    config = ChaosConfig(
        mode=ChaosMode.DB_SLOW,
        probability=probability,
        duration=duration,
        intensity=intensity,
        targets=["/v1/*"],
    )
    return await chaos_engine.start_experiment(name, config)


__all__ = [
    # Core classes
    "ChaosMode",
    "ChaosConfig",
    "ChaosExperiment",
    "ChaosMetrics",
    "ChaosEngine",
    # Global instance
    "chaos_engine",
    # Convenience functions
    "inject_latency",
    "inject_errors",
    "simulate_db_slowdown",
]
