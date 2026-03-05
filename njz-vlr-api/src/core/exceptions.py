"""
Custom Exceptions for NJZ VLR API
Structured error handling with HTTP status codes
"""

from typing import Optional, Dict, Any


class NJZVLRAPIError(Exception):
    """Base exception for all API errors"""
    
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": "error",
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details
        }


class ScraperError(NJZVLRAPIError):
    """Raised when scraping fails"""
    status_code = 502
    error_code = "SCRAPER_ERROR"


class CircuitBreakerOpen(NJZVLRAPIError):
    """Raised when circuit breaker is open"""
    status_code = 503
    error_code = "CIRCUIT_BREAKER_OPEN"


class RateLimitExceeded(NJZVLRAPIError):
    """Raised when rate limit is hit"""
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"


class VLRRateLimit(NJZVLRAPIError):
    """Raised when VLR.gg returns 429"""
    status_code = 429
    error_code = "VLR_RATE_LIMIT"


class ValidationError(NJZVLRAPIError):
    """Raised when input validation fails"""
    status_code = 400
    error_code = "VALIDATION_ERROR"


class NotFoundError(NJZVLRAPIError):
    """Raised when resource is not found"""
    status_code = 404
    error_code = "NOT_FOUND"


class IntegrityError(NJZVLRAPIError):
    """Raised when RAWS integrity check fails"""
    status_code = 500
    error_code = "INTEGRITY_ERROR"


class CacheError(NJZVLRAPIError):
    """Raised when cache operation fails"""
    status_code = 500
    error_code = "CACHE_ERROR"