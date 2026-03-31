"""
ROTAS Monitoring and Metrics

Prometheus metrics for data ingestion observability.
"""

from prometheus_client import Counter, Histogram, Gauge
from functools import wraps
from typing import Callable, Any
import time
import logging

logger = logging.getLogger(__name__)

# Ingestion job metrics
INGESTION_JOBS_TOTAL = Counter(
    'rotas_ingestion_jobs_total',
    'Total number of ingestion jobs run',
    ['source', 'entity_type', 'status']
)

INGESTION_DURATION = Histogram(
    'rotas_ingestion_duration_seconds',
    'Time spent running ingestion jobs',
    ['source', 'entity_type'],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600]
)

INGESTION_RECORDS_PROCESSED = Counter(
    'rotas_ingestion_records_processed_total',
    'Total records processed by ingestion',
    ['source', 'entity_type', 'operation']
)

INGESTION_ERRORS = Counter(
    'rotas_ingestion_errors_total',
    'Total errors during ingestion',
    ['source', 'entity_type', 'error_type']
)

# Data freshness metrics
DATA_FRESHNESS_SECONDS = Gauge(
    'rotas_data_freshness_seconds',
    'Age of most recent data by game and entity type',
    ['game', 'entity_type']
)

LAST_INGESTION_TIMESTAMP = Gauge(
    'rotas_last_ingestion_timestamp',
    'Unix timestamp of last successful ingestion',
    ['source', 'entity_type']
)

# Database metrics
DB_CONNECTIONS_ACTIVE = Gauge(
    'rotas_db_connections_active',
    'Number of active database connections'
)

DB_QUERY_DURATION = Histogram(
    'rotas_db_query_duration_seconds',
    'Time spent executing database queries',
    ['operation'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)


def track_ingestion(entity_type: str, source: str = "pandascore"):
    """Decorator to track ingestion job metrics.
    
    Args:
        entity_type: Type of entity being ingested (teams, players, matches, tournaments)
        source: Data source name
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            status = "success"
            
            try:
                result = await func(*args, **kwargs)
                
                # Track records processed
                INGESTION_RECORDS_PROCESSED.labels(
                    source=source,
                    entity_type=entity_type,
                    operation="processed"
                ).inc(result.records_processed)
                
                INGESTION_RECORDS_PROCESSED.labels(
                    source=source,
                    entity_type=entity_type,
                    operation="created"
                ).inc(result.records_created)
                
                INGESTION_RECORDS_PROCESSED.labels(
                    source=source,
                    entity_type=entity_type,
                    operation="updated"
                ).inc(result.records_updated)
                
                INGESTION_RECORDS_PROCESSED.labels(
                    source=source,
                    entity_type=entity_type,
                    operation="failed"
                ).inc(result.records_failed)
                
                # Update last ingestion timestamp
                LAST_INGESTION_TIMESTAMP.labels(
                    source=source,
                    entity_type=entity_type
                ).set_to_current_time()
                
                return result
                
            except Exception as e:
                status = "error"
                INGESTION_ERRORS.labels(
                    source=source,
                    entity_type=entity_type,
                    error_type=type(e).__name__
                ).inc()
                raise
                
            finally:
                # Track duration and job count
                duration = time.time() - start_time
                INGESTION_DURATION.labels(
                    source=source,
                    entity_type=entity_type
                ).observe(duration)
                
                INGESTION_JOBS_TOTAL.labels(
                    source=source,
                    entity_type=entity_type,
                    status=status
                ).inc()
        
        return wrapper
    return decorator


def track_db_query(operation: str):
    """Decorator to track database query metrics.
    
    Args:
        operation: Type of database operation (select, insert, update, delete)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            
            try:
                return await func(*args, **kwargs)
            finally:
                duration = time.time() - start_time
                DB_QUERY_DURATION.labels(operation=operation).observe(duration)
        
        return wrapper
    return decorator


class DataQualityChecker:
    """Checks data quality and alerts on anomalies."""
    
    def __init__(self):
        self.quality_issues = Counter(
            'rotas_data_quality_issues_total',
            'Total data quality issues detected',
            ['game', 'issue_type']
        )
    
    def check_player_stats(self, stats: dict, game: str) -> bool:
        """Check player statistics for impossible values.
        
        Args:
            stats: Player statistics dictionary
            game: Game type
            
        Returns:
            True if data is valid, False if issues found
        """
        issues = []
        
        # Check for negative values
        if stats.get('kills', 0) < 0:
            issues.append("negative_kills")
        if stats.get('deaths', 0) < 0:
            issues.append("negative_deaths")
        
        # Check for impossible ratios
        kd = stats.get('kd_ratio', 0)
        if kd > 50:  # Impossibly high K/D
            issues.append("impossible_kd_ratio")
        
        # Check for missing required fields
        if stats.get('rounds_played', 0) == 0 and stats.get('kills', 0) > 0:
            issues.append("kills_without_rounds")
        
        # Track issues
        for issue in issues:
            self.quality_issues.labels(game=game, issue_type=issue).inc()
            logger.warning(f"Data quality issue: {issue} for game {game}")
        
        return len(issues) == 0
    
    def check_match_scores(self, team1_score: int, team2_score: int, best_of: int) -> bool:
        """Check match scores for validity.
        
        Args:
            team1_score: Score for team 1
            team2_score: Score for team 2
            best_of: Best of format (3, 5, etc.)
            
        Returns:
            True if scores are valid
        """
        max_score = (best_of // 2) + 1
        
        if team1_score < 0 or team2_score < 0:
            logger.warning(f"Negative scores detected: {team1_score}, {team2_score}")
            return False
        
        if team1_score > max_score or team2_score > max_score:
            logger.warning(f"Scores exceed maximum for BO{best_of}: {team1_score}, {team2_score}")
            return False
        
        return True


class IngestionAlertManager:
    """Manages alerts for ingestion failures and anomalies."""
    
    def __init__(self, failure_threshold: float = 0.05):
        """Initialize alert manager.
        
        Args:
            failure_threshold: Percentage of failures that triggers alert (0.05 = 5%)
        """
        self.failure_threshold = failure_threshold
        self.alert_counter = Counter(
            'rotas_alerts_sent_total',
            'Total alerts sent',
            ['alert_type']
        )
    
    def check_and_alert(self, result: 'IngestionResult') -> list:
        """Check ingestion result and generate alerts if needed.
        
        Args:
            result: IngestionResult to check
            
        Returns:
            List of alert messages
        """
        alerts = []
        
        if result.records_processed == 0:
            alerts.append({
                "severity": "warning",
                "message": f"No records processed for {result.entity_type}",
                "source": result.source
            })
            self.alert_counter.labels(alert_type="no_records").inc()
        
        elif result.records_processed > 0:
            failure_rate = result.records_failed / result.records_processed
            
            if failure_rate > self.failure_threshold:
                alerts.append({
                    "severity": "critical",
                    "message": f"High failure rate ({failure_rate:.1%}) for {result.entity_type}",
                    "source": result.source,
                    "details": {
                        "processed": result.records_processed,
                        "failed": result.records_failed
                    }
                })
                self.alert_counter.labels(alert_type="high_failure_rate").inc()
        
        if result.error_message:
            alerts.append({
                "severity": "error",
                "message": f"Ingestion error: {result.error_message}",
                "source": result.source
            })
            self.alert_counter.labels(alert_type="ingestion_error").inc()
        
        return alerts
