"""
Data Lineage Middleware

Tracks data provenance for all writes to the database.
Integrates with feature flags for gradual rollout.
"""

import hashlib
import json
from typing import Optional, Dict, Any, Callable
from uuid import UUID
import logging

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from ..feature_flags import lineage_tracking_enabled
from ..database import get_db_pool

logger = logging.getLogger(__name__)


class DataLineageMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track data lineage for API writes.
    
    Tracks:
    - Source system of data
    - Confidence scores
    - Data checksums
    - Parent-child relationships
    """
    
    def __init__(
        self,
        app: ASGIApp,
        track_endpoints: Optional[list] = None,
        exclude_endpoints: Optional[list] = None
    ):
        super().__init__(app)
        self.track_endpoints = track_endpoints or ["/v1/"]
        self.exclude_endpoints = exclude_endpoints or [
            "/health",
            "/ready",
            "/metrics",
            "/docs",
            "/openapi.json"
        ]
    
    def _should_track(self, request: Request) -> bool:
        """Determine if this request should be tracked."""
        # Check feature flag
        if not lineage_tracking_enabled():
            return False
        
        path = request.url.path
        method = request.method
        
        # Only track write operations
        if method not in ("POST", "PUT", "PATCH", "DELETE"):
            return False
        
        # Check excludes
        for exclude in self.exclude_endpoints:
            if path.startswith(exclude):
                return False
        
        # Check includes
        for include in self.track_endpoints:
            if path.startswith(include):
                return True
        
        return False
    
    def _calculate_checksum(self, data: Dict[str, Any]) -> str:
        """Calculate SHA-256 checksum of canonical JSON representation."""
        # Remove mutable fields for consistent hashing
        canonical = self._canonicalize_data(data)
        json_str = json.dumps(canonical, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(json_str.encode()).hexdigest()
    
    def _canonicalize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove mutable fields from data for consistent hashing."""
        if not isinstance(data, dict):
            return data
        
        mutable_fields = {'created_at', 'updated_at', 'lineage_id', 'checksum'}
        return {
            k: self._canonicalize_data(v) if isinstance(v, dict) else v
            for k, v in data.items()
            if k not in mutable_fields
        }
    
    def _extract_source_system(self, request: Request) -> str:
        """Extract source system from request headers or default."""
        # Check for explicit source header
        source = request.headers.get("X-Data-Source")
        if source:
            return source.lower()
        
        # Infer from request context
        user_agent = request.headers.get("user-agent", "").lower()
        
        if "pandascore" in user_agent:
            return "pandascore"
        elif "rotas" in user_agent:
            return "rotas_simulation"
        elif "vlr" in user_agent or "vlr.gg" in user_agent:
            return "vlr_gg"
        
        # Default to manual for API writes
        return "manual_entry"
    
    async def _record_lineage(
        self,
        request: Request,
        response: Response,
        entity_type: str,
        entity_id: Optional[UUID],
        data: Dict[str, Any]
    ) -> Optional[UUID]:
        """Record data lineage entry."""
        try:
            pool = await get_db_pool()
            
            source_system = self._extract_source_system(request)
            checksum = self._calculate_checksum(data)
            
            # Get parent lineage if provided in headers
            parent_lineage = request.headers.get("X-Parent-Lineage-ID")
            
            async with pool.acquire() as conn:
                lineage_id = await conn.fetchval(
                    """
                    INSERT INTO data_lineage (
                        source_system, external_id, entity_type, entity_id,
                        confidence_score, checksum, parent_lineage_id, metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING lineage_id
                    """,
                    source_system,
                    data.get("external_id"),
                    entity_type,
                    entity_id,
                    data.get("confidence_score", 0.85),
                    checksum,
                    UUID(parent_lineage) if parent_lineage else None,
                    json.dumps({
                        "request_method": request.method,
                        "request_path": str(request.url.path),
                        "user_agent": request.headers.get("user-agent"),
                        "response_status": response.status_code
                    })
                )
                
                logger.debug(f"Recorded lineage {lineage_id} for {entity_type}:{entity_id}")
                return lineage_id
                
        except Exception as e:
            # Log but don't fail the request
            logger.error(f"Failed to record lineage: {e}")
            return None
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and track lineage if applicable."""
        response = await call_next(request)
        
        if not self._should_track(request):
            return response
        
        try:
            # Extract entity info from response
            entity_type = self._extract_entity_type(request)
            entity_id = self._extract_entity_id(response)
            
            # Try to get response body for checksum
            if hasattr(response, 'body'):
                try:
                    data = json.loads(response.body)
                    lineage_id = await self._record_lineage(
                        request, response, entity_type, entity_id, data
                    )
                    
                    # Add lineage header to response
                    if lineage_id:
                        response.headers["X-Lineage-ID"] = str(lineage_id)
                        
                except json.JSONDecodeError:
                    pass
                    
        except Exception as e:
            logger.error(f"Error in lineage middleware: {e}")
        
        return response
    
    def _extract_entity_type(self, request: Request) -> str:
        """Extract entity type from request path."""
        path = request.url.path
        
        if "/players" in path:
            return "player"
        elif "/teams" in path:
            return "team"
        elif "/matches" in path:
            return "match"
        elif "/stats" in path:
            return "stats"
        elif "/tournaments" in path:
            return "tournament"
        else:
            return "unknown"
    
    def _extract_entity_id(self, response: Response) -> Optional[UUID]:
        """Extract entity ID from response."""
        try:
            if hasattr(response, 'body'):
                data = json.loads(response.body)
                entity_id = data.get("id") or data.get("player_id") or data.get("team_id") or data.get("match_id")
                if entity_id:
                    return UUID(str(entity_id))
        except (json.JSONDecodeError, ValueError):
            pass
        return None


# Decorator for manual lineage tracking in service layer
def track_lineage(
    entity_type: str,
    source_system: Optional[str] = None
):
    """
    Decorator to track data lineage for function calls.
    
    Usage:
        @track_lineage(entity_type="player", source_system="pandascore")
        async def create_player(data: dict) -> Player:
            ...
    """
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, **kwargs) -> Any:
            result = await func(*args, **kwargs)
            
            if not lineage_tracking_enabled():
                return result
            
            try:
                # Extract entity ID from result
                entity_id = None
                if hasattr(result, 'id'):
                    entity_id = result.id
                elif isinstance(result, dict):
                    entity_id = result.get('id')
                
                # Calculate checksum
                data_dict = result.model_dump() if hasattr(result, 'model_dump') else dict(result)
                checksum = hashlib.sha256(
                    json.dumps(data_dict, sort_keys=True, default=str).encode()
                ).hexdigest()
                
                # Record lineage (async - fire and forget)
                pool = await get_db_pool()
                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO data_lineage (
                            source_system, entity_type, entity_id, checksum, metadata
                        ) VALUES ($1, $2, $3, $4, $5)
                        """,
                        source_system or "manual_entry",
                        entity_type,
                        entity_id,
                        checksum,
                        json.dumps({"function": func.__name__})
                    )
                    
            except Exception as e:
                logger.error(f"Lineage tracking error: {e}")
            
            return result
        
        return wrapper
    return decorator
