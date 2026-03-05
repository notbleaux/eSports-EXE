"""
FastAPI dependencies for rate limiting and caching
"""

from functools import wraps
from fastapi import Request, HTTPException
import time
from typing import Callable

# Simple in-memory rate limiter for now
_request_history = {}

async def rate_limit(requests: int = 100, window: int = 3600):
    """Rate limiting dependency"""
    async def dependency(request: Request):
        client_ip = request.client.host
        now = time.time()
        
        # Clean old entries
        if client_ip in _request_history:
            _request_history[client_ip] = [
                t for t in _request_history[client_ip] 
                if now - t < window
            ]
        else:
            _request_history[client_ip] = []
        
        # Check limit
        if len(_request_history[client_ip]) >= requests:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        _request_history[client_ip].append(now)
        return True
    
    return dependency


def cache_response(ttl: int = 300):
    """Cache response decorator"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # For now, just pass through - implement caching later
            return await func(*args, **kwargs)
        return wrapper
    return decorator