"""
Example Service - Shows how to integrate with eXe Directory
This is a template for services in the SATOR-eXe-ROTAS ecosystem
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel

# Import the eXe Directory client
import sys
sys.path.insert(0, str(Path(__file__).parent))
from client import ServiceRegistryClient, ServiceConfig, FastAPIHealthEndpoint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("example-service")

# Service configuration
SERVICE_CONFIG = ServiceConfig(
    service_id="example-service",
    name="Example Service",
    service_type="core",
    host="localhost",
    port=8080,
    tags="example,demo",
    metadata={
        "version": "1.0.0",
        "features": ["demo", "example"]
    }
)

DIRECTORY_URL = "http://localhost:8000"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan with directory registration"""
    # Startup: Register with directory
    logger.info("Registering with eXe Directory...")
    app.state.registry_client = ServiceRegistryClient(DIRECTORY_URL)
    app.state.registry_client.register_service(SERVICE_CONFIG)
    app.state.registry_client.register_instance()
    app.state.registry_client.start_heartbeat(interval_seconds=30)
    logger.info("Registration complete")
    
    yield
    
    # Shutdown: Deregister
    logger.info("Shutting down...")
    app.state.registry_client.shutdown()


# Create FastAPI app
app = FastAPI(
    title="Example Service",
    description="Example service demonstrating eXe Directory integration",
    version="1.0.0",
    lifespan=lifespan
)

# Add health endpoint (required for directory health checks)
health = FastAPIHealthEndpoint(app)


# Add custom health checks
@health.add_check
def check_database():
    """Check database connectivity"""
    # Replace with actual DB check
    return {
        "status": "healthy",
        "component": "database",
        "detail": "Connected"
    }


@health.add_check
def check_cache():
    """Check cache connectivity"""
    # Replace with actual cache check
    return {
        "status": "healthy", 
        "component": "cache",
        "detail": "Responsive"
    }


# Business endpoints
@app.get("/")
async def root():
    """Service root"""
    return {
        "service": SERVICE_CONFIG.name,
        "version": "1.0.0",
        "api_version": "v1",
        "status": "operational"
    }


@app.get("/v1/")
async def v1_root():
    """v1 Service root"""
    return {
        "service": SERVICE_CONFIG.name,
        "version": "1.0.0",
        "api_version": "v1",
        "status": "operational"
    }


class CountResponse(BaseModel):
    """Count response model"""
    table: str
    count: int
    service: str


@app.get("/api/v1/count")
async def get_count(table: str):
    """
    Get record count for a table (legacy, use /v1/count).
    Required for parity checks with eXe Directory.
    """
    # In a real service, query your database
    # This is a mock response
    mock_counts = {
        "player_stats": 1000,
        "match_history": 5000,
        "team_standings": 50,
        "market_data": 10000
    }
    
    count = mock_counts.get(table, 0)
    
    return CountResponse(
        table=table,
        count=count,
        service=SERVICE_CONFIG.service_id
    )


@app.get("/v1/count")
async def v1_get_count(table: str):
    """
    Get record count for a table (v1).
    Required for parity checks with eXe Directory.
    """
    mock_counts = {
        "player_stats": 1000,
        "match_history": 5000,
        "team_standings": 50,
        "market_data": 10000
    }
    
    count = mock_counts.get(table, 0)
    
    return CountResponse(
        table=table,
        count=count,
        service=SERVICE_CONFIG.service_id
    )


@app.get("/api/v1/data/{table}")
async def get_data(table: str, limit: int = 100):
    """Get data from a table (legacy, use /v1/data/{table})"""
    # Mock data response
    return {
        "table": table,
        "limit": limit,
        "data": [],  # Would be actual data
        "service": SERVICE_CONFIG.service_id
    }


@app.get("/v1/data/{table}")
async def v1_get_data(table: str, limit: int = 100):
    """Get data from a table (v1)"""
    # Mock data response
    return {
        "table": table,
        "limit": limit,
        "data": [],  # Would be actual data
        "service": SERVICE_CONFIG.service_id
    }


# Discovery example endpoint
@app.get("/discover/{service_type}")
async def discover_service(service_type: str):
    """Discover another service via the directory (legacy, use /v1/discover/{service_type})"""
    client = app.state.registry_client
    service = client.discover_service(service_type, healthy_only=True)
    
    if service:
        return {
            "found": True,
            "service": service
        }
    return {
        "found": False,
        "message": f"No healthy {service_type} service found"
    }


@app.get("/v1/discover/{service_type}")
async def v1_discover_service(service_type: str):
    """Discover another service via the directory (v1)"""
    client = app.state.registry_client
    service = client.discover_service(service_type, healthy_only=True)
    
    if service:
        return {
            "found": True,
            "service": service
        }
    return {
        "found": False,
        "message": f"No healthy {service_type} service found"
    }


if __name__ == "__main__":
    import uvicorn
    from pathlib import Path
    
    uvicorn.run(app, host="localhost", port=8080)
