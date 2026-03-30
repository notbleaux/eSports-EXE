"""[Ver001.000]
SLO (Service Level Objective) Monitoring Dashboard

Tracks key service metrics and SLO compliance for the NJZiteGeisTe Platform.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable
from collections import deque

logger = logging.getLogger(__name__)


@dataclass
class SLIMetric:
    """Service Level Indicator metric."""
    name: str
    value: float
    timestamp: datetime
    labels: Dict[str, str] = field(default_factory=dict)


@dataclass
class SLOTarget:
    """Service Level Objective target."""
    name: str
    description: str
    target_value: float  # e.g., 0.99 for 99%
    warning_threshold: float  # e.g., 0.995
    lookback_window_minutes: int = 60
    
    @property
    def target_percentage(self) -> str:
        return f"{self.target_value * 100:.2f}%"


@dataclass
class SLOStatus:
    """Current SLO compliance status."""
    slo: SLOTarget
    current_value: float
    is_compliant: bool
    is_warning: bool
    burn_rate: float  # How fast we're consuming error budget
    error_budget_remaining: float
    last_evaluation: datetime


class SLIMetricsCollector:
    """Collects and stores SLI metrics."""
    
    def __init__(self, max_history_minutes: int = 1440):  # 24 hours
        self.max_history = max_history_minutes
        self._metrics: Dict[str, deque] = {}
        self._lock = asyncio.Lock()
    
    async def record_metric(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ):
        """Record a new SLI metric."""
        async with self._lock:
            if name not in self._metrics:
                self._metrics[name] = deque(maxlen=self.max_history * 60)  # per second
            
            metric = SLIMetric(
                name=name,
                value=value,
                timestamp=datetime.utcnow(),
                labels=labels or {},
            )
            self._metrics[name].append(metric)
    
    async def get_metrics(
        self,
        name: str,
        lookback_minutes: int = 60
    ) -> List[SLIMetric]:
        """Get metrics for the specified lookback period."""
        async with self._lock:
            if name not in self._metrics:
                return []
            
            cutoff = datetime.utcnow() - timedelta(minutes=lookback_minutes)
            return [
                m for m in self._metrics[name]
                if m.timestamp >= cutoff
            ]
    
    async def get_metric_names(self) -> List[str]:
        """Get all metric names."""
        async with self._lock:
            return list(self._metrics.keys())


class SLODashboard:
    """SLO monitoring dashboard."""
    
    # Define SLOs
    DEFAULT_SLOS = [
        SLOTarget(
            name="api_availability",
            description="API uptime percentage",
            target_value=0.995,  # 99.5%
            warning_threshold=0.997,
            lookback_window_minutes=60,
        ),
        SLOTarget(
            name="api_latency_p99",
            description="API P99 latency < 200ms",
            target_value=0.99,
            warning_threshold=0.995,
            lookback_window_minutes=60,
        ),
        SLOTarget(
            name="feature_store_latency",
            description="Feature store P99 latency < 10ms",
            target_value=0.99,
            warning_threshold=0.995,
            lookback_window_minutes=60,
        ),
        SLOTarget(
            name="websocket_availability",
            description="WebSocket connection success rate",
            target_value=0.99,
            warning_threshold=0.995,
            lookback_window_minutes=60,
        ),
        SLOTarget(
            name="model_prediction_latency",
            description="Model prediction P99 latency < 50ms",
            target_value=0.99,
            warning_threshold=0.995,
            lookback_window_minutes=60,
        ),
        SLOTarget(
            name="data_freshness",
            description="Data freshness < 5 minutes",
            target_value=0.99,
            warning_threshold=0.995,
            lookback_window_minutes=60,
        ),
    ]
    
    def __init__(self):
        self.collector = SLIMetricsCollector()
        self.slos: Dict[str, SLOTarget] = {
            slo.name: slo for slo in self.DEFAULT_SLOS
        }
        self._status_cache: Dict[str, SLOStatus] = {}
        self._last_evaluation: Optional[datetime] = None
    
    async def record_request_latency(
        self,
        endpoint: str,
        latency_ms: float,
        status_code: int,
    ):
        """Record API request latency."""
        # Record latency metric
        await self.collector.record_metric(
            "api_latency",
            latency_ms,
            labels={"endpoint": endpoint, "status_code": str(status_code)},
        )
        
        # Record availability (1 for success, 0 for error)
        is_success = 200 <= status_code < 500
        await self.collector.record_metric(
            "api_availability",
            1.0 if is_success else 0.0,
            labels={"endpoint": endpoint},
        )
        
        # Check latency SLO
        await self.collector.record_metric(
            "api_latency_p99",
            1.0 if latency_ms < 200 else 0.0,
            labels={"endpoint": endpoint},
        )
    
    async def record_feature_store_latency(
        self,
        operation: str,
        latency_ms: float,
    ):
        """Record feature store latency."""
        await self.collector.record_metric(
            "feature_store_latency",
            1.0 if latency_ms < 10 else 0.0,
            labels={"operation": operation},
        )
    
    async def record_websocket_event(
        self,
        event_type: str,
        success: bool,
    ):
        """Record WebSocket event."""
        await self.collector.record_metric(
            "websocket_availability",
            1.0 if success else 0.0,
            labels={"event_type": event_type},
        )
    
    async def record_model_prediction(
        self,
        model_name: str,
        latency_ms: float,
        success: bool,
    ):
        """Record model prediction."""
        await self.collector.record_metric(
            "model_prediction_latency",
            1.0 if latency_ms < 50 else 0.0,
            labels={"model_name": model_name},
        )
        
        await self.collector.record_metric(
            "model_prediction_success",
            1.0 if success else 0.0,
            labels={"model_name": model_name},
        )
    
    async def evaluate_slo(self, slo_name: str) -> SLOStatus:
        """Evaluate a specific SLO."""
        slo = self.slos.get(slo_name)
        if not slo:
            raise ValueError(f"Unknown SLO: {slo_name}")
        
        metrics = await self.collector.get_metrics(
            slo_name,
            lookback_minutes=slo.lookback_window_minutes,
        )
        
        if not metrics:
            return SLOStatus(
                slo=slo,
                current_value=0.0,
                is_compliant=False,
                is_warning=True,
                burn_rate=0.0,
                error_budget_remaining=0.0,
                last_evaluation=datetime.utcnow(),
            )
        
        # Calculate current compliance
        values = [m.value for m in metrics]
        current_value = sum(values) / len(values)
        
        # Calculate burn rate (errors per hour)
        error_count = sum(1 for v in values if v < slo.target_value)
        hours = slo.lookback_window_minutes / 60
        burn_rate = error_count / hours if hours > 0 else 0
        
        # Calculate error budget remaining
        # Monthly error budget = 1 - target (e.g., 0.5% for 99.5% SLO)
        monthly_error_budget = 1 - slo.target_value
        error_budget_consumed = (1 - current_value) * (30 * 24 / hours)
        error_budget_remaining = max(0, monthly_error_budget - error_budget_consumed)
        
        status = SLOStatus(
            slo=slo,
            current_value=current_value,
            is_compliant=current_value >= slo.target_value,
            is_warning=current_value < slo.warning_threshold,
            burn_rate=burn_rate,
            error_budget_remaining=error_budget_remaining,
            last_evaluation=datetime.utcnow(),
        )
        
        self._status_cache[slo_name] = status
        return status
    
    async def evaluate_all_slos(self) -> Dict[str, SLOStatus]:
        """Evaluate all SLOs."""
        results = {}
        for slo_name in self.slos:
            results[slo_name] = await self.evaluate_slo(slo_name)
        
        self._last_evaluation = datetime.utcnow()
        return results
    
    def get_dashboard_html(self) -> str:
        """Generate simple HTML dashboard."""
        if not self._status_cache:
            return "<p>No SLO data available. Run evaluate_all_slos() first.</p>"
        
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>SLO Dashboard - NJZiteGeisTe Platform</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px; }
                .slo-card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .compliant { border-left: 4px solid #10b981; }
                .warning { border-left: 4px solid #f59e0b; }
                .violation { border-left: 4px solid #ef4444; }
                .metric { font-size: 2em; font-weight: bold; }
                .metric-label { color: #666; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SLO Dashboard</h1>
                <p>NJZiteGeisTe Platform - Last updated: {last_update}</p>
            </div>
            <div class="grid">
        """
        
        for status in self._status_cache.values():
            css_class = "compliant" if status.is_compliant else "violation"
            if status.is_warning and status.is_compliant:
                css_class = "warning"
            
            html += f"""
                <div class="slo-card {css_class}">
                    <h3>{status.slo.name}</h3>
                    <p>{status.slo.description}</p>
                    <div class="metric">{status.current_value * 100:.2f}%</div>
                    <div class="metric-label">Current (Target: {status.slo.target_percentage})</div>
                    <p>Burn Rate: {status.burn_rate:.2f} errors/hour</p>
                    <p>Error Budget: {status.error_budget_remaining * 100:.2f}%</p>
                </div>
            """
        
        html += """
            </div>
        </body>
        </html>
        """
        
        return html.format(
            last_update=self._last_evaluation.isoformat() if self._last_evaluation else "Never"
        )


# Global instance
_dashboard: Optional[SLODashboard] = None


async def get_slo_dashboard() -> SLODashboard:
    """Get the global SLO dashboard."""
    global _dashboard
    if _dashboard is None:
        _dashboard = SLODashboard()
    return _dashboard
