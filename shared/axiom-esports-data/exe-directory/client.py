"""
eXe Directory Service Registry Client
Python class for services to register themselves with the eXe Directory

Usage:
    from exe_directory_client import ServiceRegistryClient
    
    client = ServiceRegistryClient("http://localhost:8000")
    
    # Register service
    client.register_service(
        service_id="my-service",
        name="My Service",
        service_type="core",
        host="localhost",
        port=8080
    )
    
    # Start heartbeat
    client.start_heartbeat(interval_seconds=30)
"""

import asyncio
import atexit
import logging
import signal
import sys
import threading
import time
from contextlib import contextmanager
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Callable, Any
from urllib.parse import urljoin

import httpx

logger = logging.getLogger("exe-directory-client")


@dataclass
class ServiceConfig:
    """Service configuration"""
    service_id: str
    name: str
    service_type: str  # core, game, pipeline, platform
    host: str
    port: int
    base_url: Optional[str] = None
    health_endpoint: str = "/health"
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[str] = None
    priority: int = 100


class ServiceRegistryClient:
    """
    Client for registering and maintaining service presence in eXe Directory.
    
    Features:
    - Service registration
    - Automatic heartbeat
    - Health check endpoint support
    - Graceful shutdown handling
    """
    
    def __init__(self, directory_url: str = "http://localhost:8000"):
        """
        Initialize the registry client.
        
        Args:
            directory_url: Base URL of the eXe Directory service
        """
        self.directory_url = directory_url.rstrip("/")
        self.http_client = httpx.Client(timeout=10.0)
        self.config: Optional[ServiceConfig] = None
        self.instance_id: Optional[str] = None
        self._heartbeat_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._registered = False
        
        # Register cleanup on exit
        atexit.register(self.shutdown)
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.shutdown()
        sys.exit(0)
    
    def register_service(self, config: ServiceConfig) -> Dict[str, Any]:
        """
        Register this service with the eXe Directory.
        
        Args:
            config: Service configuration
            
        Returns:
            Registration response from directory
        """
        self.config = config
        
        url = urljoin(self.directory_url, "/register")
        payload = {
            "service_id": config.service_id,
            "name": config.name,
            "service_type": config.service_type,
            "host": config.host,
            "port": config.port,
            "base_url": config.base_url,
            "health_endpoint": config.health_endpoint,
            "metadata": config.metadata,
            "tags": config.tags,
            "priority": config.priority
        }
        
        try:
            response = self.http_client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            self._registered = True
            logger.info(f"Service {config.service_id} registered successfully")
            return result
        except httpx.HTTPError as e:
            logger.error(f"Failed to register service: {e}")
            raise
    
    def register_instance(self, host: Optional[str] = None, 
                          port: Optional[int] = None,
                          metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Register a specific instance of this service.
        
        Args:
            host: Instance host (defaults to service host)
            port: Instance port (defaults to service port)
            metadata: Instance-specific metadata
            
        Returns:
            Instance registration response
        """
        if not self.config:
            raise RuntimeError("Service must be registered before registering instance")
        
        url = urljoin(self.directory_url, f"/register/{self.config.service_id}/instance")
        payload = {
            "host": host or self.config.host,
            "port": port or self.config.port,
            "metadata": metadata
        }
        
        try:
            response = self.http_client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            self.instance_id = result.get("instance_id")
            logger.info(f"Instance {self.instance_id} registered")
            return result
        except httpx.HTTPError as e:
            logger.error(f"Failed to register instance: {e}")
            raise
    
    def send_heartbeat(self) -> bool:
        """
        Send a single heartbeat to the directory.
        
        Returns:
            True if successful, False otherwise
        """
        if not self.config:
            return False
        
        # Heartbeat is done via instance update
        if self.instance_id:
            url = urljoin(
                self.directory_url, 
                f"/register/{self.config.service_id}/instance"
            )
            payload = {
                "instance_id": self.instance_id,
                "host": self.config.host,
                "port": self.config.port
            }
            
            try:
                response = self.http_client.post(url, json=payload)
                response.raise_for_status()
                return True
            except httpx.HTTPError as e:
                logger.warning(f"Heartbeat failed: {e}")
                return False
        
        return True
    
    def start_heartbeat(self, interval_seconds: int = 30) -> None:
        """
        Start automatic heartbeat in background thread.
        
        Args:
            interval_seconds: Seconds between heartbeats
        """
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            logger.warning("Heartbeat already running")
            return
        
        self._stop_event.clear()
        
        def heartbeat_loop():
            while not self._stop_event.is_set():
                self.send_heartbeat()
                self._stop_event.wait(interval_seconds)
        
        self._heartbeat_thread = threading.Thread(
            target=heartbeat_loop,
            name=f"heartbeat-{self.config.service_id if self.config else 'unknown'}",
            daemon=True
        )
        self._heartbeat_thread.start()
        logger.info(f"Heartbeat started (interval: {interval_seconds}s)")
    
    def stop_heartbeat(self) -> None:
        """Stop the automatic heartbeat"""
        if self._heartbeat_thread:
            self._stop_event.set()
            self._heartbeat_thread.join(timeout=5)
            logger.info("Heartbeat stopped")
    
    def deregister(self) -> bool:
        """
        Deregister this service from the directory.
        
        Returns:
            True if successful
        """
        if not self.config:
            return False
        
        url = urljoin(self.directory_url, f"/services/{self.config.service_id}")
        
        try:
            response = self.http_client.delete(url)
            response.raise_for_status()
            self._registered = False
            logger.info(f"Service {self.config.service_id} deregistered")
            return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to deregister: {e}")
            return False
    
    def shutdown(self) -> None:
        """Graceful shutdown - stop heartbeat and deregister"""
        logger.info("Shutting down registry client...")
        self.stop_heartbeat()
        if self._registered:
            self.deregister()
        self.http_client.close()
    
    def get_service_info(self, service_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get information about a service.
        
        Args:
            service_id: Service to query (defaults to this service)
            
        Returns:
            Service information or None
        """
        sid = service_id or (self.config.service_id if self.config else None)
        if not sid:
            return None
        
        url = urljoin(self.directory_url, f"/services/{sid}")
        
        try:
            response = self.http_client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to get service info: {e}")
            return None
    
    def list_services(self, service_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all registered services.
        
        Args:
            service_type: Filter by type (core, game, pipeline, platform)
            
        Returns:
            List of services
        """
        url = urljoin(self.directory_url, "/services")
        params = {}
        if service_type:
            params["service_type"] = service_type
        
        try:
            response = self.http_client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to list services: {e}")
            return []
    
    def discover_service(self, service_type: str, 
                         healthy_only: bool = True) -> Optional[Dict[str, Any]]:
        """
        Discover a service by type (for load balancing).
        
        Args:
            service_type: Type of service to find
            healthy_only: Only return healthy services
            
        Returns:
            Service info or None
        """
        services = self.list_services(service_type=service_type)
        
        if healthy_only:
            services = [s for s in services if s.get("status") == "healthy"]
        
        if not services:
            return None
        
        # Simple round-robin: pick first (or implement priority-based)
        services.sort(key=lambda s: (s.get("priority", 100), s.get("name", "")))
        return services[0]


class FastAPIHealthEndpoint:
    """
    Helper class to add a standard health endpoint to FastAPI apps.
    
    Usage:
        from fastapi import FastAPI
        from exe_directory_client import FastAPIHealthEndpoint
        
        app = FastAPI()
        health = FastAPIHealthEndpoint(app)
        
        # Add custom checks
        @health.add_check
        def check_database():
            return {"status": "healthy", "detail": "DB connected"}
    """
    
    def __init__(self, app, endpoint: str = "/health"):
        """
        Initialize health endpoint.
        
        Args:
            app: FastAPI application
            endpoint: Path for health endpoint
        """
        self.app = app
        self.endpoint = endpoint
        self.checks: List[Callable[[], Dict[str, Any]]] = []
        
        @app.get(endpoint)
        async def health_check():
            return self._run_checks()
    
    def add_check(self, func: Callable[[], Dict[str, Any]]) -> Callable:
        """Add a custom health check"""
        self.checks.append(func)
        return func
    
    def _run_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {
            "status": "healthy",
            "checks": {}
        }
        
        for check in self.checks:
            try:
                result = check()
                results["checks"][check.__name__] = result
                if result.get("status") != "healthy":
                    results["status"] = "degraded"
            except Exception as e:
                results["checks"][check.__name__] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                results["status"] = "unhealthy"
        
        return results


# Convenience context manager
@contextmanager
def registered_service(directory_url: str, config: ServiceConfig, 
                       heartbeat_interval: int = 30):
    """
    Context manager for service registration.
    
    Usage:
        with registered_service("http://localhost:8000", config) as client:
            # Run your service
            app.run()
    """
    client = ServiceRegistryClient(directory_url)
    client.register_service(config)
    client.register_instance()
    client.start_heartbeat(heartbeat_interval)
    
    try:
        yield client
    finally:
        client.shutdown()


# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Example: Register a service
    config = ServiceConfig(
        service_id="example-service",
        name="Example Service",
        service_type="core",
        host="localhost",
        port=8080,
        tags="example,test",
        metadata={"version": "1.0.0"}
    )
    
    with registered_service("http://localhost:8000", config) as client:
        print("Service registered, press Ctrl+C to exit")
        while True:
            time.sleep(1)
