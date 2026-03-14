"""
eXe Directory - SATOR-eXe-ROTAS Central Hub
FastAPI Application for Service Registry and Health Monitoring
"""

import asyncio
import json
import logging
import sqlite3
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("exe-directory")

# Database path
DB_PATH = Path(__file__).parent / "exe_directory.db"

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ServiceRegistration(BaseModel):
    """Service registration request"""
    service_id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=128)
    service_type: str = Field(..., pattern="^(core|game|pipeline|platform)$")
    host: str = Field(..., max_length=256)
    port: int = Field(..., ge=1, le=65535)
    base_url: Optional[str] = Field(None, max_length=512)
    health_endpoint: str = Field("/health", max_length=256)
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[str] = None
    priority: int = Field(100, ge=0, le=1000)

class ServiceInstanceRegistration(BaseModel):
    """Instance registration request"""
    instance_id: Optional[str] = None
    host: str
    port: int
    metadata: Optional[Dict[str, Any]] = None

class HealthStatus(BaseModel):
    """Health status response"""
    service_id: str
    status: str  # healthy, unhealthy, unknown, degraded
    response_time_ms: Optional[int] = None
    last_checked: Optional[datetime] = None
    message: Optional[str] = None

class ServiceInfo(BaseModel):
    """Service information response"""
    service_id: str
    name: str
    service_type: str
    host: str
    port: int
    base_url: Optional[str]
    status: str
    is_active: bool
    instances: List[Dict[str, Any]]
    last_heartbeat: Optional[datetime]
    created_at: datetime

class ParityCheckRequest(BaseModel):
    """Parity check trigger request"""
    source_service: Optional[str] = None
    target_service: Optional[str] = None
    table_name: Optional[str] = None
    check_all: bool = True

class ParityCheckResult(BaseModel):
    """Parity check result"""
    check_run_id: str
    config_id: int
    source_service: str
    target_service: str
    table_name: str
    status: str
    source_count: Optional[int]
    target_count: Optional[int]
    diff_count: Optional[int]
    execution_time_ms: Optional[int]
    completed_at: Optional[datetime]

class ParityStatus(BaseModel):
    """Overall parity status"""
    overall_status: str  # synced, partial, error
    last_check_run_id: Optional[str]
    last_check_time: Optional[datetime]
    checks: List[ParityCheckResult]
    summary: Dict[str, int]

class RouteRegistration(BaseModel):
    """Data route registration"""
    route_id: str
    source_service: str
    target_service: str
    route_type: str = Field(..., pattern="^(sync|async|webhook|stream)$")
    endpoint_path: Optional[str] = None
    transformation_rules: Optional[Dict[str, Any]] = None
    retry_policy: Optional[Dict[str, Any]] = None

# ============================================================================
# DATABASE HELPERS
# ============================================================================

def get_db() -> sqlite3.Connection:
    """Get database connection with row factory"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initialize database with schema"""
    schema_path = Path(__file__).parent / "schema.sql"
    with get_db() as conn:
        with open(schema_path, 'r') as f:
            conn.executescript(f.read())
        conn.commit()
    logger.info("Database initialized")

# ============================================================================
# SERVICE REGISTRY
# ============================================================================

class ServiceRegistry:
    """Manages service registration and discovery"""
    
    def register_service(self, reg: ServiceRegistration) -> Dict[str, Any]:
        """Register or update a service"""
        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO services 
                (service_id, name, service_type, host, port, base_url, 
                 health_endpoint, metadata, tags, priority, is_active, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
                ON CONFLICT(service_id) DO UPDATE SET
                name = excluded.name,
                host = excluded.host,
                port = excluded.port,
                base_url = excluded.base_url,
                health_endpoint = excluded.health_endpoint,
                metadata = excluded.metadata,
                tags = excluded.tags,
                priority = excluded.priority,
                is_active = 1,
                updated_at = CURRENT_TIMESTAMP
                RETURNING *
            """, (
                reg.service_id, reg.name, reg.service_type, reg.host, reg.port,
                reg.base_url, reg.health_endpoint,
                json.dumps(reg.metadata) if reg.metadata else None,
                reg.tags, reg.priority
            ))
            conn.commit()
            row = cursor.fetchone()
            
            # Log event
            conn.execute("""
                INSERT INTO system_events (event_type, service_id, severity, message)
                VALUES (?, ?, 'info', ?)
            """, ('service_registered', reg.service_id, f"Service {reg.name} registered"))
            conn.commit()
            
            return dict(row)
    
    def register_instance(self, service_id: str, inst: ServiceInstanceRegistration) -> Dict[str, Any]:
        """Register a service instance"""
        instance_id = inst.instance_id or f"{service_id}-{uuid.uuid4().hex[:8]}"
        
        with get_db() as conn:
            # Verify service exists
            service = conn.execute(
                "SELECT 1 FROM services WHERE service_id = ?", (service_id,)
            ).fetchone()
            if not service:
                raise HTTPException(status_code=404, detail=f"Service {service_id} not found")
            
            cursor = conn.execute("""
                INSERT INTO service_instances 
                (service_id, instance_id, host, port, status, metadata, last_heartbeat)
                VALUES (?, ?, ?, ?, 'starting', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(instance_id) DO UPDATE SET
                host = excluded.host,
                port = excluded.port,
                status = 'starting',
                metadata = excluded.metadata,
                last_heartbeat = CURRENT_TIMESTAMP
                RETURNING *
            """, (service_id, instance_id, inst.host, inst.port,
                  json.dumps(inst.metadata) if inst.metadata else None))
            conn.commit()
            return dict(cursor.fetchone())
    
    def get_services(self, service_type: Optional[str] = None, 
                     active_only: bool = True) -> List[ServiceInfo]:
        """Get all services with their instances"""
        with get_db() as conn:
            query = "SELECT * FROM services WHERE 1=1"
            params = []
            if service_type:
                query += " AND service_type = ?"
                params.append(service_type)
            if active_only:
                query += " AND is_active = 1"
            query += " ORDER BY priority, name"
            
            services = conn.execute(query, params).fetchall()
            result = []
            
            for svc in services:
                instances = conn.execute("""
                    SELECT * FROM service_instances 
                    WHERE service_id = ? ORDER BY last_heartbeat DESC
                """, (svc['service_id'],)).fetchall()
                
                # Get latest health status
                health = conn.execute("""
                    SELECT status, checked_at FROM health_checks
                    WHERE service_id = ? ORDER BY checked_at DESC LIMIT 1
                """, (svc['service_id'],)).fetchone()
                
                result.append(ServiceInfo(
                    service_id=svc['service_id'],
                    name=svc['name'],
                    service_type=svc['service_type'],
                    host=svc['host'],
                    port=svc['port'],
                    base_url=svc['base_url'],
                    status=health['status'] if health else 'unknown',
                    is_active=bool(svc['is_active']),
                    instances=[dict(i) for i in instances],
                    last_heartbeat=health['checked_at'] if health else None,
                    created_at=svc['created_at']
                ))
            
            return result
    
    def get_service(self, service_id: str) -> Optional[ServiceInfo]:
        """Get a specific service"""
        with get_db() as conn:
            svc = conn.execute(
                "SELECT * FROM services WHERE service_id = ?", (service_id,)
            ).fetchone()
            if not svc:
                return None
            
            instances = conn.execute("""
                SELECT * FROM service_instances 
                WHERE service_id = ? ORDER BY last_heartbeat DESC
            """, (service_id,)).fetchall()
            
            health = conn.execute("""
                SELECT status, checked_at FROM health_checks
                WHERE service_id = ? ORDER BY checked_at DESC LIMIT 1
            """, (service_id,)).fetchone()
            
            return ServiceInfo(
                service_id=svc['service_id'],
                name=svc['name'],
                service_type=svc['service_type'],
                host=svc['host'],
                port=svc['port'],
                base_url=svc['base_url'],
                status=health['status'] if health else 'unknown',
                is_active=bool(svc['is_active']),
                instances=[dict(i) for i in instances],
                last_heartbeat=health['checked_at'] if health else None,
                created_at=svc['created_at']
            )
    
    def deregister_service(self, service_id: str) -> bool:
        """Soft-delete a service"""
        with get_db() as conn:
            cursor = conn.execute("""
                UPDATE services SET is_active = 0, updated_at = CURRENT_TIMESTAMP
                WHERE service_id = ?
            """, (service_id,))
            conn.execute("""
                INSERT INTO system_events (event_type, service_id, severity, message)
                VALUES (?, ?, 'warning', ?)
            """, ('service_deregistered', service_id, f"Service {service_id} deregistered"))
            conn.commit()
            return cursor.rowcount > 0

# ============================================================================
# HEALTH CHECK ORCHESTRATOR
# ============================================================================

class HealthCheckOrchestrator:
    """Orchestrates health checks across all services"""
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=5.0)
        self._check_task: Optional[asyncio.Task] = None
    
    async def check_service(self, service_id: str) -> HealthStatus:
        """Check health of a single service"""
        registry = ServiceRegistry()
        service = registry.get_service(service_id)
        
        if not service:
            return HealthStatus(
                service_id=service_id,
                status='unknown',
                message='Service not found in registry'
            )
        
        # Build health URL
        health_url = f"http://{service.host}:{service.port}"
        if service.base_url:
            health_url = service.base_url
        health_url = health_url.rstrip('/') + '/health'
        
        start_time = datetime.now()
        try:
            response = await self.http_client.get(health_url)
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            status = 'healthy' if response.status_code == 200 else 'degraded'
            if response.status_code >= 500:
                status = 'unhealthy'
            
            # Store health check
            with get_db() as conn:
                conn.execute("""
                    INSERT INTO health_checks 
                    (service_id, status, response_time_ms, status_code, message)
                    VALUES (?, ?, ?, ?, ?)
                """, (service_id, status, response_time, response.status_code, 
                      response.text[:500] if response.text else None))
                
                # Update instance status if exists
                conn.execute("""
                    UPDATE service_instances 
                    SET status = ?, last_heartbeat = CURRENT_TIMESTAMP
                    WHERE service_id = ?
                """, (status, service_id))
                
                conn.commit()
            
            return HealthStatus(
                service_id=service_id,
                status=status,
                response_time_ms=response_time,
                last_checked=datetime.now(),
                message=f"HTTP {response.status_code}"
            )
            
        except httpx.TimeoutException:
            self._store_failure(service_id, 'unhealthy', None, 'Connection timeout')
            return HealthStatus(
                service_id=service_id,
                status='unhealthy',
                message='Connection timeout'
            )
        except Exception as e:
            self._store_failure(service_id, 'unhealthy', None, str(e))
            return HealthStatus(
                service_id=service_id,
                status='unhealthy',
                message=str(e)
            )
    
    def _store_failure(self, service_id: str, status: str, 
                       response_time: Optional[int], message: str):
        """Store failed health check"""
        with get_db() as conn:
            conn.execute("""
                INSERT INTO health_checks 
                (service_id, status, response_time_ms, message)
                VALUES (?, ?, ?, ?)
            """, (service_id, status, response_time, message))
            conn.execute("""
                UPDATE service_instances 
                SET status = ?, last_heartbeat = CURRENT_TIMESTAMP
                WHERE service_id = ?
            """, (status, service_id))
            conn.commit()
    
    async def check_all_services(self) -> List[HealthStatus]:
        """Check health of all active services"""
        registry = ServiceRegistry()
        services = registry.get_services(active_only=True)
        
        results = []
        for svc in services:
            result = await self.check_service(svc.service_id)
            results.append(result)
        
        return results
    
    async def start_periodic_checks(self, interval_seconds: int = 30):
        """Start background health check loop"""
        async def check_loop():
            while True:
                try:
                    logger.info("Running periodic health checks...")
                    await self.check_all_services()
                except Exception as e:
                    logger.error(f"Health check error: {e}")
                await asyncio.sleep(interval_seconds)
        
        self._check_task = asyncio.create_task(check_loop())
    
    async def stop(self):
        """Stop health check loop"""
        if self._check_task:
            self._check_task.cancel()
            try:
                await self._check_task
            except asyncio.CancelledError:
                pass
        await self.http_client.aclose()

# ============================================================================
# PARITY CHECK COORDINATOR
# ============================================================================

class ParityCheckCoordinator:
    """Coordinates parity checks between RAWS and BASE"""
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def run_parity_check(self, config_id: Optional[int] = None,
                               check_all: bool = True) -> List[ParityCheckResult]:
        """Run parity check(s)"""
        check_run_id = f"parity-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
        results = []
        
        with get_db() as conn:
            if config_id:
                configs = conn.execute(
                    "SELECT * FROM parity_configs WHERE id = ? AND is_enabled = 1", 
                    (config_id,)
                ).fetchall()
            elif check_all:
                configs = conn.execute(
                    "SELECT * FROM parity_configs WHERE is_enabled = 1"
                ).fetchall()
            else:
                configs = []
        
        for config in configs:
            result = await self._check_pair(config, check_run_id)
            results.append(result)
        
        return results
    
    async def _check_pair(self, config: sqlite3.Row, 
                          check_run_id: str) -> ParityCheckResult:
        """Check parity for a single config"""
        start_time = datetime.now()
        
        with get_db() as conn:
            # Insert running record
            cursor = conn.execute("""
                INSERT INTO parity_checks 
                (config_id, check_run_id, status, started_at)
                VALUES (?, ?, 'running', CURRENT_TIMESTAMP)
                RETURNING id
            """, (config['id'], check_run_id))
            check_id = cursor.fetchone()['id']
            conn.commit()
        
        try:
            # Get service endpoints
            registry = ServiceRegistry()
            source_svc = registry.get_service(config['source_service'])
            target_svc = registry.get_service(config['target_service'])
            
            if not source_svc or not target_svc:
                raise ValueError(f"Source or target service not found")
            
            # Build URLs
            source_url = self._build_count_url(source_svc, config['table_name'])
            target_url = self._build_count_url(target_svc, config['table_name'])
            
            # Fetch counts (parallel)
            source_count, target_count = await asyncio.gather(
                self._fetch_count(source_url),
                self._fetch_count(target_url)
            )
            
            # Calculate diff
            diff_count = abs(source_count - target_count)
            tolerance = config['tolerance_percent'] / 100.0
            max_diff = int(max(source_count, target_count) * tolerance)
            
            if diff_count <= max_diff:
                status = 'synced'
            else:
                status = 'mismatch'
            
            execution_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # Update record
            with get_db() as conn:
                conn.execute("""
                    UPDATE parity_checks 
                    SET status = ?, source_count = ?, target_count = ?, 
                        diff_count = ?, execution_time_ms = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (status, source_count, target_count, diff_count, 
                      execution_time, check_id))
                conn.commit()
            
            return ParityCheckResult(
                check_run_id=check_run_id,
                config_id=config['id'],
                source_service=config['source_service'],
                target_service=config['target_service'],
                table_name=config['table_name'],
                status=status,
                source_count=source_count,
                target_count=target_count,
                diff_count=diff_count,
                execution_time_ms=execution_time,
                completed_at=datetime.now()
            )
            
        except Exception as e:
            with get_db() as conn:
                conn.execute("""
                    UPDATE parity_checks 
                    SET status = 'error', message = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (str(e), check_id))
                conn.commit()
            
            return ParityCheckResult(
                check_run_id=check_run_id,
                config_id=config['id'],
                source_service=config['source_service'],
                target_service=config['target_service'],
                table_name=config['table_name'],
                status='error',
                source_count=None,
                target_count=None,
                diff_count=None,
                execution_time_ms=None,
                completed_at=datetime.now()
            )
    
    def _build_count_url(self, service: ServiceInfo, table: str) -> str:
        """Build count URL for a service"""
        base = service.base_url or f"http://{service.host}:{service.port}"
        return f"{base.rstrip('/')}/v1/count?table={table}"
    
    async def _fetch_count(self, url: str) -> int:
        """Fetch count from service"""
        try:
            response = await self.http_client.get(url)
            data = response.json()
            return data.get('count', 0)
        except Exception as e:
            logger.error(f"Failed to fetch count from {url}: {e}")
            return 0
    
    def get_parity_status(self, limit: int = 50) -> ParityStatus:
        """Get current parity status"""
        with get_db() as conn:
            # Get latest check run
            latest = conn.execute("""
                SELECT check_run_id, MAX(completed_at) as last_time
                FROM parity_checks 
                WHERE status != 'running' AND completed_at IS NOT NULL
            """).fetchone()
            
            # Get checks from latest run or recent
            if latest and latest['check_run_id']:
                checks_rows = conn.execute("""
                    SELECT pc.*, pcfg.source_service, pcfg.target_service, pcfg.table_name
                    FROM parity_checks pc
                    JOIN parity_configs pcfg ON pc.config_id = pcfg.id
                    WHERE pc.check_run_id = ?
                    ORDER BY pc.completed_at DESC
                """, (latest['check_run_id'],)).fetchall()
            else:
                checks_rows = conn.execute("""
                    SELECT pc.*, pcfg.source_service, pcfg.target_service, pcfg.table_name
                    FROM parity_checks pc
                    JOIN parity_configs pcfg ON pc.config_id = pcfg.id
                    WHERE pc.status != 'running'
                    ORDER BY pc.completed_at DESC
                    LIMIT ?
                """, (limit,)).fetchall()
            
            checks = []
            synced_count = 0
            mismatch_count = 0
            error_count = 0
            
            for row in checks_rows:
                checks.append(ParityCheckResult(
                    check_run_id=row['check_run_id'],
                    config_id=row['config_id'],
                    source_service=row['source_service'],
                    target_service=row['target_service'],
                    table_name=row['table_name'],
                    status=row['status'],
                    source_count=row['source_count'],
                    target_count=row['target_count'],
                    diff_count=row['diff_count'],
                    execution_time_ms=row['execution_time_ms'],
                    completed_at=row['completed_at']
                ))
                
                if row['status'] == 'synced':
                    synced_count += 1
                elif row['status'] == 'mismatch':
                    mismatch_count += 1
                elif row['status'] == 'error':
                    error_count += 1
            
            # Determine overall status
            if error_count > 0:
                overall = 'error'
            elif mismatch_count > 0:
                overall = 'partial'
            else:
                overall = 'synced'
            
            return ParityStatus(
                overall_status=overall,
                last_check_run_id=latest['check_run_id'] if latest else None,
                last_check_time=latest['last_time'] if latest else None,
                checks=checks,
                summary={
                    'total': len(checks),
                    'synced': synced_count,
                    'mismatch': mismatch_count,
                    'error': error_count
                }
            )

# ============================================================================
# FASTAPI APP
# ============================================================================

# Global orchestrators
health_orchestrator: Optional[HealthCheckOrchestrator] = None
parity_coordinator: Optional[ParityCheckCoordinator] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global health_orchestrator, parity_coordinator
    
    # Startup
    init_db()
    health_orchestrator = HealthCheckOrchestrator()
    parity_coordinator = ParityCheckCoordinator()
    
    # Start periodic health checks
    await health_orchestrator.start_periodic_checks(interval_seconds=30)
    
    logger.info("eXe Directory started")
    yield
    
    # Shutdown
    await health_orchestrator.stop()
    logger.info("eXe Directory stopped")

app = FastAPI(
    title="eXe Directory",
    description="SATOR-eXe-ROTAS Central Service Registry and Health Monitor",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Secure configuration with environment-based origins
# Default allows common local development ports
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:4173,http://127.0.0.1:3000,http://127.0.0.1:5173"
).split(",")
# Strip whitespace from origins
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,  # 10 minutes preflight cache
)

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Service info"""
    return {
        "name": "eXe Directory",
        "version": "1.0.0",
        "system": "SATOR-eXe-ROTAS",
        "status": "operational",
        "api_version": "v1"
    }

@app.get("/health")
async def directory_health():
    """Directory self-health check"""
    return {
        "status": "healthy",
        "service": "exe-directory",
        "timestamp": datetime.now().isoformat()
    }

# v1 API Routes
@app.get("/v1/")
async def v1_root():
    """v1 API info"""
    return {
        "name": "eXe Directory",
        "version": "1.0.0",
        "api_version": "v1",
        "system": "SATOR-eXe-ROTAS",
        "status": "operational"
    }

@app.get("/v1/health")
async def v1_directory_health():
    """v1 Directory self-health check"""
    return {
        "status": "healthy",
        "service": "exe-directory",
        "api_version": "v1",
        "timestamp": datetime.now().isoformat()
    }

# Service Registration (Legacy - maintained for backward compatibility)
@app.post("/register", response_model=Dict[str, Any])
async def register_service(reg: ServiceRegistration):
    """Register a new service or update existing (deprecated, use /v1/register)"""
    registry = ServiceRegistry()
    return registry.register_service(reg)

@app.post("/register/{service_id}/instance", response_model=Dict[str, Any])
async def register_instance(service_id: str, inst: ServiceInstanceRegistration):
    """Register a service instance (deprecated, use /v1/register/{service_id}/instance)"""
    registry = ServiceRegistry()
    return registry.register_instance(service_id, inst)

@app.get("/services", response_model=List[ServiceInfo])
async def list_services(
    service_type: Optional[str] = Query(None, pattern="^(core|game|pipeline|platform)$"),
    active_only: bool = Query(True)
):
    """List all registered services (deprecated, use /v1/services)"""
    registry = ServiceRegistry()
    return registry.get_services(service_type, active_only)

@app.get("/services/{service_id}", response_model=ServiceInfo)
async def get_service(service_id: str):
    """Get a specific service (deprecated, use /v1/services/{service_id})"""
    registry = ServiceRegistry()
    service = registry.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@app.delete("/services/{service_id}")
async def deregister_service(service_id: str):
    """Deregister a service (deprecated, use /v1/services/{service_id})"""
    registry = ServiceRegistry()
    if registry.deregister_service(service_id):
        return {"message": f"Service {service_id} deregistered"}
    raise HTTPException(status_code=404, detail="Service not found")

# v1 Service Registration
@app.post("/v1/register", response_model=Dict[str, Any])
async def v1_register_service(reg: ServiceRegistration):
    """Register a new service or update existing"""
    registry = ServiceRegistry()
    return registry.register_service(reg)

@app.post("/v1/register/{service_id}/instance", response_model=Dict[str, Any])
async def v1_register_instance(service_id: str, inst: ServiceInstanceRegistration):
    """Register a service instance"""
    registry = ServiceRegistry()
    return registry.register_instance(service_id, inst)

@app.get("/v1/services", response_model=List[ServiceInfo])
async def v1_list_services(
    service_type: Optional[str] = Query(None, pattern="^(core|game|pipeline|platform)$"),
    active_only: bool = Query(True)
):
    """List all registered services"""
    registry = ServiceRegistry()
    return registry.get_services(service_type, active_only)

@app.get("/v1/services/{service_id}", response_model=ServiceInfo)
async def v1_get_service(service_id: str):
    """Get a specific service"""
    registry = ServiceRegistry()
    service = registry.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@app.delete("/v1/services/{service_id}")
async def v1_deregister_service(service_id: str):
    """Deregister a service"""
    registry = ServiceRegistry()
    if registry.deregister_service(service_id):
        return {"message": f"Service {service_id} deregistered"}
    raise HTTPException(status_code=404, detail="Service not found")

# Health Check Endpoints (Legacy)
@app.get("/health/all", response_model=List[HealthStatus])
async def check_all_health():
    """Check health of all services (deprecated, use /v1/health/all)"""
    return await health_orchestrator.check_all_services()

@app.get("/health/{service_id}", response_model=HealthStatus)
async def check_service_health(service_id: str):
    """Check health of a specific service (deprecated, use /v1/health/{service_id})"""
    return await health_orchestrator.check_service(service_id)

# v1 Health Check Endpoints
@app.get("/v1/health/all", response_model=List[HealthStatus])
async def v1_check_all_health():
    """Check health of all services"""
    return await health_orchestrator.check_all_services()

@app.get("/v1/health/{service_id}", response_model=HealthStatus)
async def v1_check_service_health(service_id: str):
    """Check health of a specific service"""
    return await health_orchestrator.check_service(service_id)

# Parity Check Endpoints (Legacy)
@app.post("/parity-check", response_model=List[ParityCheckResult])
async def trigger_parity_check(
    request: Optional[ParityCheckRequest] = None,
    background_tasks: BackgroundTasks = None
):
    """Trigger parity validation between RAWS and BASE (deprecated, use /v1/parity-check)"""
    req = request or ParityCheckRequest(check_all=True)
    
    # Run immediately for API response
    results = await parity_coordinator.run_parity_check(
        check_all=req.check_all
    )
    return results

@app.get("/parity-status", response_model=ParityStatus)
async def get_parity_status(limit: int = Query(50, ge=1, le=500)):
    """Get RAWS/BASE synchronization status (deprecated, use /v1/parity-status)"""
    return parity_coordinator.get_parity_status(limit)

@app.get("/parity-checks/history")
async def get_parity_history(
    service: Optional[str] = None,
    table: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500)
):
    """Get parity check history (deprecated, use /v1/parity-checks/history)"""
    with get_db() as conn:
        query = """
            SELECT pc.*, pcfg.source_service, pcfg.target_service, pcfg.table_name
            FROM parity_checks pc
            JOIN parity_configs pcfg ON pc.config_id = pcfg.id
            WHERE pc.status != 'running'
        """
        params = []
        
        if service:
            query += " AND (pcfg.source_service = ? OR pcfg.target_service = ?)"
            params.extend([service, service])
        if table:
            query += " AND pcfg.table_name = ?"
            params.append(table)
        
        query += " ORDER BY pc.completed_at DESC LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

# v1 Parity Check Endpoints
@app.post("/v1/parity-check", response_model=List[ParityCheckResult])
async def v1_trigger_parity_check(
    request: Optional[ParityCheckRequest] = None,
    background_tasks: BackgroundTasks = None
):
    """Trigger parity validation between RAWS and BASE"""
    req = request or ParityCheckRequest(check_all=True)
    
    # Run immediately for API response
    results = await parity_coordinator.run_parity_check(
        check_all=req.check_all
    )
    return results

@app.get("/v1/parity-status", response_model=ParityStatus)
async def v1_get_parity_status(limit: int = Query(50, ge=1, le=500)):
    """Get RAWS/BASE synchronization status"""
    return parity_coordinator.get_parity_status(limit)

@app.get("/v1/parity-checks/history")
async def v1_get_parity_history(
    service: Optional[str] = None,
    table: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500)
):
    """Get parity check history"""
    with get_db() as conn:
        query = """
            SELECT pc.*, pcfg.source_service, pcfg.target_service, pcfg.table_name
            FROM parity_checks pc
            JOIN parity_configs pcfg ON pc.config_id = pcfg.id
            WHERE pc.status != 'running'
        """
        params = []
        
        if service:
            query += " AND (pcfg.source_service = ? OR pcfg.target_service = ?)"
            params.extend([service, service])
        if table:
            query += " AND pcfg.table_name = ?"
            params.append(table)
        
        query += " ORDER BY pc.completed_at DESC LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

# Data Routes (Legacy)
@app.post("/routes")
async def create_route(route: RouteRegistration):
    """Register a data route (deprecated, use /v1/routes)"""
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO data_routes 
            (route_id, source_service, target_service, route_type, 
             endpoint_path, transformation_rules, retry_policy)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(route_id) DO UPDATE SET
            source_service = excluded.source_service,
            target_service = excluded.target_service,
            route_type = excluded.route_type,
            endpoint_path = excluded.endpoint_path,
            transformation_rules = excluded.transformation_rules,
            retry_policy = excluded.retry_policy,
            is_active = 1
            RETURNING *
        """, (
            route.route_id, route.source_service, route.target_service,
            route.route_type, route.endpoint_path,
            json.dumps(route.transformation_rules) if route.transformation_rules else None,
            json.dumps(route.retry_policy) if route.retry_policy else None
        ))
        conn.commit()
        return dict(cursor.fetchone())

@app.get("/routes")
async def list_routes(active_only: bool = True):
    """List data routes (deprecated, use /v1/routes)"""
    with get_db() as conn:
        query = "SELECT * FROM data_routes"
        if active_only:
            query += " WHERE is_active = 1"
        query += " ORDER BY created_at DESC"
        
        rows = conn.execute(query).fetchall()
        return [dict(r) for r in rows]

# v1 Data Routes
@app.post("/v1/routes")
async def v1_create_route(route: RouteRegistration):
    """Register a data route"""
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO data_routes 
            (route_id, source_service, target_service, route_type, 
             endpoint_path, transformation_rules, retry_policy)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(route_id) DO UPDATE SET
            source_service = excluded.source_service,
            target_service = excluded.target_service,
            route_type = excluded.route_type,
            endpoint_path = excluded.endpoint_path,
            transformation_rules = excluded.transformation_rules,
            retry_policy = excluded.retry_policy,
            is_active = 1
            RETURNING *
        """, (
            route.route_id, route.source_service, route.target_service,
            route.route_type, route.endpoint_path,
            json.dumps(route.transformation_rules) if route.transformation_rules else None,
            json.dumps(route.retry_policy) if route.retry_policy else None
        ))
        conn.commit()
        return dict(cursor.fetchone())

@app.get("/v1/routes")
async def v1_list_routes(active_only: bool = True):
    """List data routes"""
    with get_db() as conn:
        query = "SELECT * FROM data_routes"
        if active_only:
            query += " WHERE is_active = 1"
        query += " ORDER BY created_at DESC"
        
        rows = conn.execute(query).fetchall()
        return [dict(r) for r in rows]

# System Events (Legacy)
@app.get("/events")
async def get_events(
    service_id: Optional[str] = None,
    severity: Optional[str] = Query(None, pattern="^(info|warning|error|critical)$"),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get system events (deprecated, use /v1/events)"""
    with get_db() as conn:
        query = "SELECT * FROM system_events WHERE 1=1"
        params = []
        
        if service_id:
            query += " AND service_id = ?"
            params.append(service_id)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

# v1 System Events
@app.get("/v1/events")
async def v1_get_events(
    service_id: Optional[str] = None,
    severity: Optional[str] = Query(None, pattern="^(info|warning|error|critical)$"),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get system events"""
    with get_db() as conn:
        query = "SELECT * FROM system_events WHERE 1=1"
        params = []
        
        if service_id:
            query += " AND service_id = ?"
            params.append(service_id)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
