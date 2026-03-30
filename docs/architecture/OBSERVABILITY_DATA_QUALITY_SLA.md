[Ver001.000] [Part: 1/1, Phase: 3/3, Progress: 10%, Status: On-Going]

# Observability & Data Quality SLA
## Great Expectations, PagerDuty, and Model Drift Detection

---

## 1. EXECUTIVE SUMMARY

**Objective:** Implement comprehensive observability with automated data quality validation, alerting, and model drift detection.

**Components:**
- **Great Expectations** for pipeline validation
- **PagerDuty** integration for critical alerts
- **Model drift detection** for data corruption monitoring

---

## 2. DATA QUALITY WITH GREAT EXPECTATIONS

### 2.1 Expectation Suite Configuration

```python
# packages/shared/ml/data_quality/expectations.py
"""
Great Expectations suite for esports data validation.
"""
import great_expectations as gx
from great_expectations.core import ExpectationSuite
from great_expectations.expectations import (
    ExpectColumnValuesToNotBeNull,
    ExpectColumnValuesToBeBetween,
    ExpectColumnValuesToBeUnique,
    ExpectTableRowCountToBeBetween,
    ExpectColumnValuesToMatchRegex,
    ExpectColumnPairValuesToBeEqual
)
from great_expectations.checkpoint import Checkpoint


class DataQualityValidator:
    """
    Validate data quality using Great Expectations.
    """
    
    def __init__(self, context_root_dir: str = "gx"):
        self.context = gx.get_context(context_root_dir=context_root_dir)
    
    def create_player_stats_suite(self) -> ExpectationSuite:
        """
        Create expectation suite for player statistics.
        """
        suite = self.context.create_expectation_suite(
            expectation_suite_name="player_stats_suite",
            overwrite_existing=True
        )
        
        # Required columns not null
        suite.add_expectation(
            ExpectColumnValuesToNotBeNull(column="player_id")
        )
        suite.add_expectation(
            ExpectColumnValuesToNotBeNull(column="match_id")
        )
        suite.add_expectation(
            ExpectColumnValuesToNotBeNull(column="combat_score")
        )
        
        # Combat score in valid range
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="combat_score",
                min_value=0,
                max_value=1000,
                mostly=0.99  # 99% should be in range
            )
        )
        
        # KDA ratio validation
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="kda_ratio",
                min_value=0,
                max_value=50
            )
        )
        
        # Deaths should be non-negative
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="deaths",
                min_value=0,
                max_value=50
            )
        )
        
        # Player ID format validation
        suite.add_expectation(
            ExpectColumnValuesToMatchRegex(
                column="player_id",
                regex=r"^player_[a-z0-9]+$"
            )
        )
        
        return suite
    
    def create_match_data_suite(self) -> ExpectationSuite:
        """
        Create expectation suite for match data.
        """
        suite = self.context.create_expectation_suite(
            expectation_suite_name="match_data_suite",
            overwrite_existing=True
        )
        
        # Match ID uniqueness
        suite.add_expectation(
            ExpectColumnValuesToBeUnique(column="match_id")
        )
        
        # Score validation (Valorant: first to 13)
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="team_a_score",
                min_value=0,
                max_value=25  # OT possible
            )
        )
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="team_b_score",
                min_value=0,
                max_value=25
            )
        )
        
        # One team must have won (score >= 13 or higher in OT)
        suite.add_expectation(
            ExpectColumnPairValuesToBeEqual(
                column_A="winner_id",
                column_B="team_a_id",
                or_else_expect_column_pair_values_to_be_equal={
                    "column_A": "winner_id",
                    "column_B": "team_b_id"
                }
            )
        )
        
        # Valid map names
        valid_maps = [
            "Haven", "Bind", "Split", "Ascent",
            "Icebox", "Breeze", "Fracture", "Pearl",
            "Lotus", "Sunset"
        ]
        suite.add_expectation(
            ExpectColumnValuesToBeInSet(
                column="map",
                value_set=valid_maps
            )
        )
        
        # Match duration (5 min to 90 min)
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="duration_seconds",
                min_value=300,
                max_value=5400
            )
        )
        
        return suite
    
    def create_simrating_suite(self) -> ExpectationSuite:
        """
        Create expectation suite for SimRating outputs.
        """
        suite = self.context.create_expectation_suite(
            expectation_suite_name="simrating_suite",
            overwrite_existing=True
        )
        
        # SimRating between 0 and 100
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="simrating",
                min_value=0,
                max_value=100
            )
        )
        
        # Confidence interval validation
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="ci_lower",
                min_value=0,
                max_value=100
            )
        )
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="ci_upper",
                min_value=0,
                max_value=100
            )
        )
        
        # Lower < Upper
        suite.add_expectation(
            ExpectColumnPairValuesAToBeGreaterThanB(
                column_A="ci_upper",
                column_B="ci_lower"
            )
        )
        
        # Matches analyzed should be positive
        suite.add_expectation(
            ExpectColumnValuesToBeBetween(
                column="matches_analyzed",
                min_value=1
            )
        )
        
        return suite
    
    def run_validation(
        self,
        dataframe,
        suite_name: str,
        batch_kwargs: dict = None
    ) -> dict:
        """
        Run validation on a dataframe.
        
        Returns:
            Validation results with success/failure details
        """
        batch = self.context.get_batch(
            batch_kwargs=batch_kwargs or {},
            expectation_suite_name=suite_name
        )
        
        results = batch.validate()
        
        return {
            "success": results.success,
            "statistics": results.statistics,
            "evaluated_expectations": results.statistics["evaluated_expectations"],
            "successful_expectations": results.statistics["successful_expectations"],
            "unsuccessful_expectations": results.statistics["unsuccessful_expectations"],
            "success_percent": results.statistics["success_percent"],
            "results": [
                {
                    "expectation": r.expectation_config.expectation_type,
                    "success": r.success,
                    "unexpected_count": r.result.get("unexpected_count", 0)
                }
                for r in results.results
            ]
        }


# Automated checkpoint configuration
checkpoint_config = {
    "name": "daily_data_quality_checkpoint",
    "config_version": 1,
    "class_name": "SimpleCheckpoint",
    "validations": [
        {
            "batch_request": {
                "datasource_name": "postgres_datasource",
                "data_connector_name": "default_inferred_data_connector",
                "data_asset_name": "player_stats"
            },
            "expectation_suite_name": "player_stats_suite"
        },
        {
            "batch_request": {
                "datasource_name": "postgres_datasource",
                "data_connector_name": "default_inferred_data_connector",
                "data_asset_name": "matches"
            },
            "expectation_suite_name": "match_data_suite"
        }
    ],
    "action_list": [
        {
            "name": "store_validation_result",
            "action": {"class_name": "StoreValidationResultAction"}
        },
        {
            "name": "update_data_docs",
            "action": {"class_name": "UpdateDataDocsAction"}
        },
        {
            "name": "send_slack_notification",
            "action": {
                "class_name": "SlackNotificationAction",
                "slack_webhook": "${SLACK_WEBHOOK_URL}",
                "notify_on": "failure",
                "renderer": {
                    "module_name": "great_expectations.render.renderer.slack_renderer",
                    "class_name": "SlackRenderer"
                }
            }
        }
    ]
}
```

### 2.2 Pipeline Validation Decorator

```python
# packages/shared/ml/data_quality/decorators.py
"""
Decorators for automatic data quality validation.
"""
from functools import wraps
from typing import Callable, Any
import logging

from .expectations import DataQualityValidator
from ..alerts import AlertManager

logger = logging.getLogger(__name__)


def validate_data_quality(
    suite_name: str,
    raise_on_failure: bool = False,
    alert_on_failure: bool = True
):
    """
    Decorator to validate data quality on function output.
    
    Usage:
        @validate_data_quality("player_stats_suite")
        def process_player_stats(data: pd.DataFrame) -> pd.DataFrame:
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Run function
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            
            # Validate if result is DataFrame
            if hasattr(result, 'to_pandas'):  # Polars/Pandas compatibility
                validator = DataQualityValidator()
                validation_results = validator.run_validation(
                    result,
                    suite_name=suite_name
                )
                
                if not validation_results["success"]:
                    logger.error(f"Data quality validation failed: {validation_results}")
                    
                    if alert_on_failure:
                        await AlertManager.send_alert(
                            level="warning",
                            title=f"Data Quality Failure: {suite_name}",
                            message=f"Success rate: {validation_results['success_percent']:.1f}%",
                            details=validation_results
                        )
                    
                    if raise_on_failure:
                        raise DataQualityError(
                            f"Data validation failed for {suite_name}",
                            validation_results
                        )
            
            return result
        return wrapper
    return decorator


class DataQualityError(Exception):
    """Exception raised when data quality validation fails."""
    
    def __init__(self, message: str, validation_results: dict):
        super().__init__(message)
        self.validation_results = validation_results
```

---

## 3. PAGERDUTY INTEGRATION

### 3.1 Alert Manager

```python
# packages/shared/ml/alerts/pagerduty.py
"""
PagerDuty integration for critical alerts.
"""
import json
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum

import httpx


class AlertSeverity(Enum):
    """PagerDuty severity levels."""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class AlertManager:
    """
    Centralized alert management with PagerDuty integration.
    """
    
    PAGERDUTY_EVENTS_URL = "https://events.pagerduty.com/v2/enqueue"
    
    def __init__(self, routing_key: str):
        self.routing_key = routing_key
        self.client = httpx.AsyncClient()
    
    async def send_alert(
        self,
        level: AlertSeverity,
        title: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        dedup_key: Optional[str] = None
    ) -> str:
        """
        Send alert to PagerDuty.
        
        Args:
            level: Severity level
            title: Alert title
            message: Alert message
            details: Additional context
            dedup_key: For alert grouping
            
        Returns:
            dedup_key for reference
        """
        payload = {
            "routing_key": self.routing_key,
            "event_action": "trigger",
            "dedup_key": dedup_key or f"{title}-{datetime.utcnow().strftime('%Y%m%d')}",
            "payload": {
                "summary": title,
                "severity": level.value,
                "source": "njz-data-pipeline",
                "component": details.get("component", "unknown") if details else "unknown",
                "group": details.get("group", "data-quality") if details else "data-quality",
                "class": details.get("class", "validation") if details else "validation",
                "custom_details": details or {}
            }
        }
        
        async with self.client as client:
            response = await client.post(
                self.PAGERDUTY_EVENTS_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
        
        return payload["dedup_key"]
    
    async def resolve_alert(self, dedup_key: str) -> None:
        """Resolve a previously triggered alert."""
        payload = {
            "routing_key": self.routing_key,
            "event_action": "resolve",
            "dedup_key": dedup_key
        }
        
        async with self.client as client:
            await client.post(
                self.PAGERDUTY_EVENTS_URL,
                json=payload
            )


# Specific alert types
class DataFreshnessMonitor:
    """
    Monitor data freshness and alert if data is stale.
    """
    
    def __init__(
        self,
        alert_manager: AlertManager,
        max_staleness_minutes: int = 15
    ):
        self.alert_manager = alert_manager
        self.max_staleness = max_staleness_minutes
    
    async def check_data_freshness(self):
        """
        Check if match data is being ingested.
        
        Alerts if no new match data in last 15 minutes during active hours.
        """
        from ...database import get_db_pool
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT MAX(created_at) as last_match_time
                FROM matches
                WHERE created_at > NOW() - INTERVAL '24 hours'
            """)
        
        last_match = row["last_match_time"]
        staleness_minutes = (datetime.utcnow() - last_match).total_seconds() / 60
        
        # Only alert during active hours (assuming VCT schedule)
        current_hour = datetime.utcnow().hour
        is_active_hours = 10 <= current_hour <= 23  # VCT typically 10am-11pm UTC
        
        if staleness_minutes > self.max_staleness and is_active_hours:
            await self.alert_manager.send_alert(
                level=AlertSeverity.ERROR,
                title="Data Freshness Alert: No New Matches",
                message=f"No match data in {staleness_minutes:.0f} minutes",
                details={
                    "last_match_time": last_match.isoformat(),
                    "staleness_minutes": staleness_minutes,
                    "threshold_minutes": self.max_staleness,
                    "component": "data-ingestion",
                    "runbook_url": "https://wiki.njzitegeist.com/runbooks/data-freshness"
                },
                dedup_key="data-freshness-no-matches"
            )
            
            return False
        
        return True


class APIHealthMonitor:
    """Monitor external API health."""
    
    def __init__(self, alert_manager: AlertManager):
        self.alert_manager = alert_manager
        self.failure_counts = {}
    
    async def check_api_health(self, api_name: str, check_func: callable):
        """Check API health and alert on repeated failures."""
        try:
            healthy = await check_func()
            
            if healthy:
                # Reset failure count
                if api_name in self.failure_counts:
                    del self.failure_counts[api_name]
                return True
            else:
                # Increment failure count
                self.failure_counts[api_name] = self.failure_counts.get(api_name, 0) + 1
                
                # Alert after 3 consecutive failures
                if self.failure_counts[api_name] >= 3:
                    await self.alert_manager.send_alert(
                        level=AlertSeverity.WARNING,
                        title=f"API Health Alert: {api_name}",
                        message=f"{api_name} API failing health checks",
                        details={
                            "api": api_name,
                            "consecutive_failures": self.failure_counts[api_name],
                            "component": "external-api"
                        },
                        dedup_key=f"api-health-{api_name}"
                    )
                return False
                
        except Exception as e:
            self.failure_counts[api_name] = self.failure_counts.get(api_name, 0) + 1
            
            if self.failure_counts[api_name] >= 3:
                await self.alert_manager.send_alert(
                    level=AlertSeverity.ERROR,
                    title=f"API Health Alert: {api_name}",
                    message=f"Exception checking {api_name}: {str(e)}",
                    details={
                        "api": api_name,
                        "error": str(e),
                        "component": "external-api"
                    },
                    dedup_key=f"api-health-{api_name}"
                )
            return False
```

---

## 4. MODEL DRIFT DETECTION

### 4.1 Statistical Drift Detection

```python
# packages/shared/ml/monitoring/drift_detection.py
"""
Model drift detection for data corruption monitoring.
"""
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from statistics import mean, stdev

import numpy as np
from scipy import stats

from ...database import get_db_pool
from ..alerts import AlertManager, AlertSeverity


@dataclass
class DriftReport:
    """Report of detected drift."""
    feature_name: str
    drift_detected: bool
    drift_score: float
    threshold: float
    baseline_mean: float
    current_mean: float
    baseline_std: float
    current_std: float
    sample_size: int
    timestamp: datetime


class ModelDriftDetector:
    """
    Detect drift in model inputs and outputs.
    
    Alerts if player ratings shift >3σ in 24h (potential data corruption).
    """
    
    DEFAULT_THRESHOLD_SIGMA = 3.0
    MIN_SAMPLE_SIZE = 30
    
    def __init__(
        self,
        alert_manager: AlertManager,
        threshold_sigma: float = DEFAULT_THRESHOLD_SIGMA
    ):
        self.alert_manager = alert_manager
        self.threshold = threshold_sigma
    
    async def detect_rating_drift(
        self,
        player_id: str,
        lookback_days: int = 7
    ) -> Optional[DriftReport]:
        """
        Detect if player's rating has drifted significantly.
        
        Compares recent ratings to historical baseline.
        """
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Get historical baseline (excluding last 24h)
            baseline_rows = await conn.fetch("""
                SELECT simrating, calculated_at
                FROM player_simratings
                WHERE player_id = $1
                  AND calculated_at < NOW() - INTERVAL '1 day'
                  AND calculated_at > NOW() - INTERVAL '$2 days'
                ORDER BY calculated_at DESC
            """, player_id, lookback_days)
            
            # Get recent ratings (last 24h)
            recent_rows = await conn.fetch("""
                SELECT simrating, calculated_at
                FROM player_simratings
                WHERE player_id = $1
                  AND calculated_at >= NOW() - INTERVAL '1 day'
                ORDER BY calculated_at DESC
            """, player_id)
        
        if len(baseline_rows) < self.MIN_SAMPLE_SIZE:
            return None  # Insufficient baseline data
        
        if len(recent_rows) < 3:
            return None  # Insufficient recent data
        
        baseline_ratings = [r["simrating"] for r in baseline_rows]
        recent_ratings = [r["simrating"] for r in recent_rows]
        
        baseline_mean = mean(baseline_ratings)
        baseline_std = stdev(baseline_ratings) if len(baseline_ratings) > 1 else 1.0
        recent_mean = mean(recent_ratings)
        
        # Calculate drift score (z-score of difference)
        if baseline_std > 0:
            drift_score = abs(recent_mean - baseline_mean) / baseline_std
        else:
            drift_score = 0
        
        drift_detected = drift_score > self.threshold
        
        report = DriftReport(
            feature_name=f"player_{player_id}_simrating",
            drift_detected=drift_detected,
            drift_score=drift_score,
            threshold=self.threshold,
            baseline_mean=baseline_mean,
            current_mean=recent_mean,
            baseline_std=baseline_std,
            current_std=stdev(recent_ratings) if len(recent_ratings) > 1 else 0,
            sample_size=len(baseline_rows) + len(recent_rows),
            timestamp=datetime.utcnow()
        )
        
        if drift_detected:
            await self._send_drift_alert(report, player_id)
        
        return report
    
    async def detect_population_drift(
        self,
        feature: str = "simrating",
        window_hours: int = 24
    ) -> Optional[DriftReport]:
        """
        Detect drift across entire player population.
        
        More sensitive indicator of systemic data issues.
        """
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Baseline distribution (previous week, excluding last 24h)
            baseline = await conn.fetch("""
                SELECT simrating
                FROM player_simratings
                WHERE calculated_at < NOW() - INTERVAL '1 day'
                  AND calculated_at > NOW() - INTERVAL '8 days'
            """)
            
            # Current distribution (last 24h)
            current = await conn.fetch("""
                SELECT simrating
                FROM player_simratings
                WHERE calculated_at >= NOW() - INTERVAL '1 day'
            """)
        
        if len(baseline) < 100 or len(current) < 50:
            return None
        
        baseline_values = [r["simrating"] for r in baseline]
        current_values = [r["simrating"] for r in current]
        
        # Two-sample KS test
        ks_statistic, p_value = stats.ks_2samp(baseline_values, current_values)
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt(
            (np.var(baseline_values) + np.var(current_values)) / 2
        )
        cohens_d = (np.mean(current_values) - np.mean(baseline_values)) / pooled_std
        
        drift_detected = ks_statistic > 0.1 or abs(cohens_d) > 0.5
        
        report = DriftReport(
            feature_name=f"population_{feature}",
            drift_detected=drift_detected,
            drift_score=ks_statistic,
            threshold=0.1,
            baseline_mean=mean(baseline_values),
            current_mean=mean(current_values),
            baseline_std=stdev(baseline_values) if len(baseline_values) > 1 else 0,
            current_std=stdev(current_values) if len(current_values) > 1 else 0,
            sample_size=len(baseline) + len(current),
            timestamp=datetime.utcnow()
        )
        
        if drift_detected:
            await self._send_population_drift_alert(report)
        
        return report
    
    async def _send_drift_alert(self, report: DriftReport, player_id: str):
        """Send alert for individual player drift."""
        await self.alert_manager.send_alert(
            level=AlertSeverity.WARNING,
            title=f"Model Drift: Player {player_id}",
            message=f"Rating shifted {report.drift_score:.1f}σ in 24h",
            details={
                "player_id": player_id,
                "drift_score": report.drift_score,
                "threshold": report.threshold,
                "baseline_mean": report.baseline_mean,
                "current_mean": report.current_mean,
                "change": report.current_mean - report.baseline_mean,
                "component": "model-drift",
                "possible_causes": [
                    "Data pipeline error",
                    "Match data corruption",
                    "Calculation bug",
                    "Legitimate performance change"
                ],
                "runbook": "https://wiki.njzitegeist.com/runbooks/model-drift"
            },
            dedup_key=f"drift-player-{player_id}"
        )
    
    async def _send_population_drift_alert(self, report: DriftReport):
        """Send alert for population-wide drift."""
        await self.alert_manager.send_alert(
            level=AlertSeverity.CRITICAL,
            title="CRITICAL: Population-wide Model Drift",
            message=f"KS statistic: {report.drift_score:.3f}. Possible data corruption.",
            details={
                "drift_score": report.drift_score,
                "baseline_mean": report.baseline_mean,
                "current_mean": report.current_mean,
                "sample_size": report.sample_size,
                "component": "model-drift",
                "action_required": "Investigate data pipeline immediately"
            },
            dedup_key="drift-population-simrating"
        )


# Automated monitoring job
async def run_drift_monitoring():
    """Run drift detection on all active players."""
    from ...database import get_db_pool
    
    pool = await get_db_pool()
    alert_manager = AlertManager(routing_key="${PAGERDUTY_KEY}")
    detector = ModelDriftDetector(alert_manager)
    
    # Get active players (played in last week)
    async with pool.acquire() as conn:
        players = await conn.fetch("""
            SELECT DISTINCT player_id
            FROM player_match_stats
            WHERE created_at > NOW() - INTERVAL '7 days'
        """)
    
    # Check each player
    drift_count = 0
    for player_row in players:
        report = await detector.detect_rating_drift(player_row["player_id"])
        if report and report.drift_detected:
            drift_count += 1
    
    # Check population drift
    pop_report = await detector.detect_population_drift()
    
    logger.info(f"Drift monitoring complete. {drift_count}/{len(players)} players with drift.")
```

---

## 5. SLA DEFINITIONS

```yaml
# docs/sla/data_quality_sla.yml
service_level_agreements:
  data_freshness:
    description: "Time since last match data ingestion"
    threshold: 15 minutes
    severity: "error"
    on_breach: "page_oncall"
    
  data_quality_score:
    description: "Great Expectations validation success rate"
    threshold: 99.5%
    severity: "warning"
    on_breach: "slack_notification"
    
  model_drift:
    description: "Player rating change standard deviations"
    threshold: 3.0 sigma
    severity: "warning"
    on_breach: "create_ticket"
    
  population_drift:
    description: "Population-wide distribution change"
    threshold: 0.1 KS statistic
    severity: "critical"
    on_breach: "page_oncall"
    
  api_availability:
    description: "External API uptime"
    threshold: 99.9%
    measurement: "5 minute windows"
    severity: "error"
    
  prediction_latency:
    description: "SimRating calculation p99 latency"
    threshold: 500ms
    severity: "warning"
```

---

## 6. IMPLEMENTATION TIMELINE

### Week 1: Great Expectations
- [ ] Install and configure GX
- [ ] Create expectation suites
- [ ] Set up validation checkpoints

### Week 2: PagerDuty
- [ ] Configure PagerDuty integration
- [ ] Set up alert routing
- [ ] Test alert flows

### Week 3: Drift Detection
- [ ] Implement drift detection algorithms
- [ ] Create monitoring jobs
- [ ] Set up drift dashboards

### Week 4: Integration
- [ ] Connect all components
- [ ] Run end-to-end tests
- [ ] Document runbooks

---

## 7. DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | Data Engineering | Observability implementation |

---

*End of Observability & Data Quality SLA*
