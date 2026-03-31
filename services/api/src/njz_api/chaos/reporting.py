"""[Ver001.000]
Chaos Engineering Reporting and Analytics

Provides comprehensive reporting on chaos experiments.
"""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ResilienceMetrics:
    """Metrics for system resilience."""
    
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    recovery_times: List[float] = field(default_factory=list)
    latency_p50: float = 0.0
    latency_p95: float = 0.0
    latency_p99: float = 0.0
    circuit_breaker_opens: int = 0
    circuit_breaker_closes: int = 0
    
    @property
    def availability_percentage(self) -> float:
        if self.total_requests == 0:
            return 100.0
        return (self.successful_requests / self.total_requests) * 100
    
    @property
    def mean_recovery_time(self) -> float:
        if not self.recovery_times:
            return 0.0
        return sum(self.recovery_times) / len(self.recovery_times)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "availability_percentage": round(self.availability_percentage, 2),
            "mean_recovery_time": round(self.mean_recovery_time, 2),
            "latency_ms": {
                "p50": round(self.latency_p50, 2),
                "p95": round(self.latency_p95, 2),
                "p99": round(self.latency_p99, 2),
            },
        }


@dataclass
class ExperimentReport:
    """Report for a single chaos experiment."""
    
    experiment_name: str
    mode: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    metrics: ResilienceMetrics = field(default_factory=ResilienceMetrics)
    findings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    
    @property
    def duration_seconds(self) -> float:
        end = self.ended_at or datetime.now(timezone.utc)
        return (end - self.started_at).total_seconds()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "experiment_name": self.experiment_name,
            "mode": self.mode,
            "started_at": self.started_at.isoformat(),
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "duration_seconds": round(self.duration_seconds, 2),
            "metrics": self.metrics.to_dict(),
            "findings": self.findings,
            "recommendations": self.recommendations,
        }


class ChaosReporter:
    """Reporter for chaos engineering experiments."""
    
    def __init__(self, reports_dir: Optional[Path] = None):
        self.reports_dir = reports_dir or Path("reports/chaos")
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self._experiment_reports: Dict[str, ExperimentReport] = {}
    
    def start_experiment(self, name: str, mode: str) -> ExperimentReport:
        report = ExperimentReport(
            experiment_name=name,
            mode=mode,
            started_at=datetime.now(timezone.utc),
        )
        self._experiment_reports[name] = report
        return report
    
    def end_experiment(self, name: str) -> Optional[ExperimentReport]:
        if name not in self._experiment_reports:
            return None
        report = self._experiment_reports[name]
        report.ended_at = datetime.now(timezone.utc)
        return report
    
    def generate_html_report(self, output_file: Optional[str] = None) -> Path:
        if output_file is None:
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
            output_file = f"chaos-report-{timestamp}.html"
        
        output_path = self.reports_dir / output_file
        experiments = list(self._experiment_reports.values())
        
        html = "<!DOCTYPE html><html><head>"
        html += "<title>Chaos Engineering Report</title>"
        html += "<style>"
        html += "body{font-family:sans-serif;margin:40px;background:#f5f5f5}"
        html += ".card{background:#fff;padding:20px;margin:20px 0;border-radius:8px}"
        html += "table{width:100%;border-collapse:collapse}"
        html += "th,td{padding:12px;border-bottom:1px solid #ddd;text-align:left}"
        html += "th{background:#4CAF50;color:white}"
        html += ".metric{font-size:24px;font-weight:bold;color:#4CAF50}"
        html += "</style></head><body>"
        html += "<h1>Chaos Engineering Report</h1>"
        html += f"<p>Generated: {datetime.now(timezone.utc).isoformat()}</p>"
        html += f"<p>Total Experiments: {len(experiments)}</p>"
        
        for exp in experiments:
            html += '<div class="card">'
            html += f"<h2>{exp.experiment_name} ({exp.mode})</h2>"
            html += f"<p>Duration: {exp.duration_seconds:.1f}s</p>"
            html += f"<p class='metric'>Availability: {exp.metrics.availability_percentage:.1f}%</p>"
            html += "</div>"
        
        html += "</body></html>"
        
        output_path.write_text(html, encoding="utf-8")
        logger.info(f"Chaos report generated: {output_path}")
        return output_path
    
    def generate_json_report(self, output_file: Optional[str] = None) -> Path:
        if output_file is None:
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
            output_file = f"chaos-report-{timestamp}.json"
        
        output_path = self.reports_dir / output_file
        
        report_data = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "experiments": [
                exp.to_dict() for exp in self._experiment_reports.values()
            ],
        }
        
        output_path.write_text(
            json.dumps(report_data, indent=2),
            encoding="utf-8"
        )
        return output_path


chaos_reporter = ChaosReporter()

__all__ = ["ResilienceMetrics", "ExperimentReport", "ChaosReporter", "chaos_reporter"]
