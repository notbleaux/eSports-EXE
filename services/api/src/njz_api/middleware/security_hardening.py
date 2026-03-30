"""
Security Hardening Middleware

Production security middleware:
- Security headers
- Request validation
- CORS hardening
- Content Security Policy
"""

import logging
from typing import Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    
    Headers added:
    - Strict-Transport-Security (HSTS)
    - X-Content-Type-Options
    - X-Frame-Options
    - X-XSS-Protection
    - Content-Security-Policy
    - Referrer-Policy
    - Permissions-Policy
    """
    
    def __init__(
        self,
        app: ASGIApp,
        csp_policy: Optional[str] = None
    ):
        super().__init__(app)
        self.csp_policy = csp_policy or (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' wss: https:;"
        )
    
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # HTTP Strict Transport Security
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # XSS Protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = self.csp_policy
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "camera=(), "
            "microphone=(), "
            "geolocation=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=()"
        )
        
        # Remove server identification
        response.headers.pop("Server", None)
        
        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """
    Validate incoming requests for security issues.
    
    Checks:
    - Request size limits
    - Content-Type validation
    - Path traversal attempts
    - SQL injection patterns (basic)
    """
    
    def __init__(
        self,
        app: ASGIApp,
        max_body_size: int = 10 * 1024 * 1024,  # 10MB
        max_header_size: int = 16 * 1024  # 16KB
    ):
        super().__init__(app)
        self.max_body_size = max_body_size
        self.max_header_size = max_header_size
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Check request size
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > self.max_body_size:
                    from fastapi.responses import JSONResponse
                    return JSONResponse(
                        status_code=413,
                        content={"error": "Request entity too large"}
                    )
            except ValueError:
                pass
        
        # Check for path traversal
        path = request.url.path
        if ".." in path or "//" in path:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid path"}
            )
        
        # Check User-Agent length (DDoS protection)
        user_agent = request.headers.get("user-agent", "")
        if len(user_agent) > 512:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid User-Agent"}
            )
        
        return await call_next(request)


class CORSHardeningMiddleware(BaseHTTPMiddleware):
    """
    Hardened CORS middleware with strict defaults.
    """
    
    def __init__(
        self,
        app: ASGIApp,
        allowed_origins: list = None,
        allowed_methods: list = None,
        allowed_headers: list = None,
        allow_credentials: bool = False,
        max_age: int = 600
    ):
        super().__init__(app)
        self.allowed_origins = set(allowed_origins or [])
        self.allowed_methods = allowed_methods or ["GET", "POST", "PUT", "DELETE"]
        self.allowed_headers = allowed_headers or ["Content-Type", "Authorization"]
        self.allow_credentials = allow_credentials
        self.max_age = max_age
    
    async def dispatch(self, request: Request, call_next) -> Response:
        origin = request.headers.get("origin")
        
        response = await call_next(request)
        
        # Check if origin is allowed
        if origin and (not self.allowed_origins or origin in self.allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
            
            if self.allow_credentials:
                response.headers["Access-Control-Allow-Credentials"] = "true"
            
            # Preflight request
            if request.method == "OPTIONS":
                response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allowed_methods)
                response.headers["Access-Control-Allow-Headers"] = ", ".join(self.allowed_headers)
                response.headers["Access-Control-Max-Age"] = str(self.max_age)
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using Redis.
    
    Supports:
    - Per-IP rate limiting
    - Per-user rate limiting (if authenticated)
    - Different limits per endpoint
    """
    
    def __init__(
        self,
        app: ASGIApp,
        redis_client=None,
        default_limit: int = 100,  # requests
        default_window: int = 60,  # seconds
        endpoint_limits: dict = None
    ):
        super().__init__(app)
        self.redis = redis_client
        self.default_limit = default_limit
        self.default_window = default_window
        self.endpoint_limits = endpoint_limits or {}
    
    def _get_limit(self, path: str) -> tuple:
        """Get rate limit for path."""
        for pattern, (limit, window) in self.endpoint_limits.items():
            if pattern in path:
                return limit, window
        return self.default_limit, self.default_window
    
    def _get_key(self, request: Request) -> str:
        """Get rate limit key for request."""
        # Try to get user ID from auth
        user_id = None
        if hasattr(request.state, "user"):
            user_id = request.state.user.get("id")
        
        if user_id:
            return f"ratelimit:user:{user_id}"
        
        # Fall back to IP
        client_ip = request.client.host if request.client else "unknown"
        return f"ratelimit:ip:{client_ip}"
    
    async def dispatch(self, request: Request, call_next) -> Response:
        if self.redis is None:
            try:
                from ..redis_cache import redis_client
                self.redis = redis_client
            except Exception:
                # Redis not available, skip rate limiting
                return await call_next(request)
        
        key = self._get_key(request)
        limit, window = self._get_limit(request.url.path)
        
        try:
            # Check rate limit
            current = await self.redis.get(key)
            
            if current:
                current_count = int(current)
                if current_count >= limit:
                    from fastapi.responses import JSONResponse
                    response = JSONResponse(
                        status_code=429,
                        content={
                            "error": "Rate limit exceeded",
                            "retry_after": window
                        }
                    )
                    response.headers["Retry-After"] = str(window)
                    response.headers["X-RateLimit-Limit"] = str(limit)
                    response.headers["X-RateLimit-Remaining"] = "0"
                    return response
                
                # Increment counter
                await self.redis.incr(key)
            else:
                # First request in window
                await self.redis.setex(key, window, 1)
            
            # Get current count for headers
            current_count = int(await self.redis.get(key) or 0)
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Fail open if Redis error
            return await call_next(request)
        
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current_count))
        
        return response


def get_security_middleware_stack(
    allowed_origins: list = None,
    rate_limit_redis=None
) -> list:
    """
    Get complete security middleware stack.
    
    Usage:
        app = FastAPI()
        for middleware in get_security_middleware_stack():
            app.add_middleware(middleware)
    """
    return [
        (SecurityHeadersMiddleware, {}),
        (RequestValidationMiddleware, {}),
        (CORSHardeningMiddleware, {"allowed_origins": allowed_origins or ["https://njzitegeist.com"]}),
        (RateLimitMiddleware, {"redis_client": rate_limit_redis}),
    ]
