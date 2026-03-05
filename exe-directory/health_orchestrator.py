"""
eXe Directory Health Check Orchestrator
Standalone module for monitoring service health
"""

import asyncio
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum

import httpx

logger = logging.getLogger("health-orchestrator")


class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class HealthResult:
    """Result of a health check"""
    service_id: str
    status: HealthStatus
    response_time_ms: Optional[int]
    status_code: Optional[int]
    message: Optional[str]
    checked_at: datetime
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class AlertRule:
    """Alert rule configuration"""
    service_id: Optional[str] = None  # None = all services
    consecutive_failures: int = 3
    status_threshold: HealthStatus = HealthStatus.UNHEALTHY
    cooldown_minutes: int = 15
    callback: Optional[Callable[[HealthResult], None]] = None


class HealthOrchestrator:
    """
    Standalone health check orchestrator.
    
    Can be run as a separate process or integrated into the main directory.
    """
    
    def __init__(self, db_path: str = "exe_directory.db",
                 check_interval_seconds: int = 30):
        """
        Initialize the orchestrator.
        
        Args:
            db_path: Path to SQLite database
            check_interval_seconds: How often to check health
        """
        self.db_path = Path(db_path)
        self.check_interval = check_interval_seconds
        self.http_client = httpx.AsyncClient(timeout=5.0)
        self._running = False
        self._alert_rules: List[AlertRule] = []
        self._failure_counts: Dict[str, int] = {}
        self._last_alert: Dict[str, datetime] = {}
    
    def _get_db(self) -> sqlite3.Connection:
        """Get database connection"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn
    
    def add_alert_rule(self, rule: AlertRule) -> None:
        """Add an alert rule"""
        self._alert_rules.append(rule)
        logger.info(f"Added alert rule for service: {rule.service_id or 'all'}")
    
    async def check_service(self, service_id: str, 
                            host: str, 
                            port: int,
                            base_url: Optional[str] = None,
                            health_endpoint: str = "/health") -> HealthResult:
        """
        Check health of a single service.
        
        Args:
            service_id: Service identifier
            host: Service host
            port: Service port
            base_url: Optional base URL override
            health_endpoint: Health check path
            
        Returns:
            Health check result
        """
        # Build URL
        if base_url:
            url = f"{base_url.rstrip('/')}{health_endpoint}"
        else:
            url = f"http://{host}:{port}{health_endpoint}"
        
        start_time = datetime.now()
        
        try:
            response = await self.http_client.get(url)
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # Determine status
            if response.status_code == 200:
                status = HealthStatus.HEALTHY
            elif response.status_code < 500:
                status = HealthStatus.DEGRADED
            else:
                status = HealthStatus.UNHEALTHY
            
            # Try to parse response for additional status
            try:
                data = response.json()
                if data.get("status") == "unhealthy":
                    status = HealthStatus.UNHEALTHY
                elif data.get("status") == "degraded" and status == HealthStatus.HEALTHY:
                    status = HealthStatus.DEGRADED
            except:
                pass
            
            return HealthResult(
                service_id=service_id,
                status=status,
                response_time_ms=response_time,
                status_code=response.status_code,
                message=response.text[:200] if response.text else None,
                checked_at=datetime.now()
            )
            
        except httpx.TimeoutException:
            return HealthResult(
                service_id=service_id,
                status=HealthStatus.UNHEALTHY,
                response_time_ms=None,
                status_code=None,
                message="Connection timeout",
                checked_at=datetime.now()
            )
        except httpx.ConnectError as e:
            return HealthResult(
                service_id=service_id,
                status=HealthStatus.UNHEALTHY,
                response_time_ms=None,
                status_code=None,
                message=f"Connection error: {str(e)[:100]}",
                checked_at=datetime.now()
            )
        except Exception as e:
            return HealthResult(
                service_id=service_id,
                status=HealthStatus.UNKNOWN,
                response_time_ms=None,
                status_code=None,
                message=f"Check error: {str(e)[:100]}",
                checked_at=datetime.now()
            )
    
    def _store_result(self, result: HealthResult) -> None:
        """Store health check result in database"""
        with self._get_db() as conn:
            conn.execute("""
                INSERT INTO health_checks 
                (service_id, status, response_time_ms, status_code, message)
                VALUES (?, ?, ?, ?, ?)
            """, (
                result.service_id,
                result.status.value,
                result.response_time_ms,
                result.status_code,
                result.message
            ))
            
            # Update instance status
            conn.execute("""
                UPDATE service_instances 
                SET status = ?, last_heartbeat = CURRENT_TIMESTAMP
                WHERE service_id = ?
            """, (result.status.value, result.service_id))
            
            conn.commit()
    
    def _check_alerts(self, result: HealthResult) -> None:
        """Check if any alert rules should fire"""
        service_id = result.service_id
        
        # Update failure count
        if result.status in (HealthStatus.UNHEALTHY, HealthStatus.UNKNOWN):
            self._failure_counts[service_id] = self._failure_counts.get(service_id, 0) + 1
        else:
            self._failure_counts[service_id] = 0
        
        # Check rules
        for rule in self._alert_rules:
            # Skip if rule is for specific service and doesn't match
            if rule.service_id and rule.service_id != service_id:
                continue
            
            # Check failure threshold
            if self._failure_counts.get(service_id, 0) >= rule.consecutive_failures:
                # Check cooldown
                last_alert = self._last_alert.get(service_id)
                if last_alert:
                    cooldown = timedelta(minutes=rule.cooldown_minutes)
                    if datetime.now() - last_alert < cooldown:
                        continue
                
                # Fire alert
                self._last_alert[service_id] = datetime.now()
                self._fire_alert(rule, result)
    
    def _fire_alert(self, rule: AlertRule, result: HealthResult) -> None:
        """Fire an alert"""
        message = f"ALERT: Service {result.service_id} is {result.status.value}"
        logger.warning(message)
        
        # Log to database
        with self._get_db() as conn:
            conn.execute("""
                INSERT INTO system_events (event_type, service_id, severity, message, metadata)
                VALUES (?, ?, 'error', ?, ?)
            """, (
                'health_alert',
                result.service_id,
                message,
                json.dumps({
                    'consecutive_failures': self._failure_counts.get(result.service_id, 0),
                    'response_time_ms': result.response_time_ms,
                    'status_code': result.status_code
                })
            ))
            conn.commit()
        
        # Call custom callback if defined
        if rule.callback:
            try:
                rule.callback(result)
            except Exception as e:
                logger.error(f"Alert callback failed: {e}")
    
    async def check_all_services(self) -> List[HealthResult]:
        """Check health of all registered services"""
        with self._get_db() as conn:
            services = conn.execute("""
                SELECT service_id, host, port, base_url, health_endpoint
                FROM services WHERE is_active = 1
            """).fetchall()
        
        results = []
        for svc in services:
            result = await self.check_service(
                service_id=svc['service_id'],
                host=svc['host'],
                port=svc['port'],
                base_url=svc['base_url'],
                health_endpoint=svc['health_endpoint']
            )
            self._store_result(result)
            self._check_alerts(result)
            results.append(result)
        
        return results
    
    async def run(self) -> None:
        """Run the orchestrator loop"""
        self._running = True
        logger.info(f"Health orchestrator started (interval: {self.check_interval}s)")
        
        while self._running:
            try:
                await self.check_all_services()
            except Exception as e:
                logger.error(f"Health check cycle failed: {e}")
            
            await asyncio.sleep(self.check_interval)
    
    def stop(self) -> None:
        """Stop the orchestrator"""
        self._running = False
        logger.info("Health orchestrator stopping...")
    
    async def close(self) -> None:
        """Cleanup resources"""
        await self.http_client.aclose()


class HealthDashboard:
    """
    Generate health dashboard data.
    Can be used to feed a web dashboard or CLI output.
    """
    
    def __init__(self, db_path: str = "exe_directory.db"):
        self.db_path = Path(db_path)
    
    def _get_db(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_overview(self) -> Dict[str, Any]:
        """Get health overview"""
        with self._get_db() as conn:
            # Count by status
            status_counts = conn.execute("""
                SELECT status, COUNT(*) as count
                FROM health_checks h
                INNER JOIN (
                    SELECT service_id, MAX(checked_at) as max_date
                    FROM health_checks
                    GROUP BY service_id
                ) latest ON h.service_id = latest.service_id AND h.checked_at = latest.max_date
                GROUP BY status
            """).fetchall()
            
            # Recent failures
            recent_failures = conn.execute("""
                SELECT h.*, s.name
                FROM health_checks h
                JOIN services s ON h.service_id = s.service_id
                WHERE h.status IN ('unhealthy', 'unknown')
                AND h.checked_at > datetime('now', '-1 hour')
                ORDER BY h.checked_at DESC
                LIMIT 10
            """).fetchall()
            
            # Average response times
            avg_times = conn.execute("""
                SELECT service_id, 
                       AVG(response_time_ms) as avg_time,
                       MAX(checked_at) as last_check
                FROM health_checks
                WHERE checked_at > datetime('now', '-1 hour')
                GROUP BY service_id
            """).fetchall()
            
            return {
                "status_summary": {r['status']: r['count'] for r in status_counts},
                "recent_failures": [dict(r) for r in recent_failures],
                "response_times": [
                    {
                        "service_id": r['service_id'],
                        "avg_response_ms": round(r['avg_time'], 2) if r['avg_time'] else None,
                        "last_check": r['last_check']
                    }
                    for r in avg_times
                ],
                "generated_at": datetime.now().isoformat()
            }
    
    def get_service_history(self, service_id: str, 
                            hours: int = 24) -> List[Dict[str, Any]]:
        """Get health history for a service"""
        with self._get_db() as conn:
            rows = conn.execute("""
                SELECT * FROM health_checks
                WHERE service_id = ? AND checked_at > datetime('now', ?)
                ORDER BY checked_at DESC
            """, (service_id, f"-{hours} hours")).fetchall()
            
            return [dict(r) for r in rows]


# CLI entry point for standalone orchestrator
async def main():
    """Run standalone health orchestrator"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    orchestrator = HealthOrchestrator()
    
    # Add example alert rule
    def on_alert(result: HealthResult):
        print(f"\n🚨 ALERT: {result.service_id} is unhealthy!\n")
    
    orchestrator.add_alert_rule(AlertRule(
        consecutive_failures=2,
        callback=on_alert
    ))
    
    try:
        await orchestrator.run()
    except KeyboardInterrupt:
        orchestrator.stop()
    finally:
        await orchestrator.close()


if __name__ == "__main__":
    asyncio.run(main())
