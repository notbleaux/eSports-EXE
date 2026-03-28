"""
Module: njz_api.archival.dependencies
Purpose: FastAPI dependencies for archival system
Task: AS-7 - Dependencies
Date: 2026-03-28

[Ver001.000] - Initial dependency definitions
"""

import logging
import os

# Import auth utilities
import sys
from typing import Optional

import asyncpg
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

_REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from database import get_pool  # noqa: E402
from src.auth.auth_schemas import TokenData  # noqa: E402
from src.auth.auth_utils import get_current_user, security  # noqa: E402

from .services.archival_service import ArchivalService  # noqa: E402
from .storage.backend import LocalBackend, StorageBackend  # noqa: E402

logger = logging.getLogger(__name__)

# Singleton storage backend instance
_storage_backend: Optional[StorageBackend] = None
_archival_service: Optional[ArchivalService] = None


def get_storage_backend() -> StorageBackend:
    """Get or create the storage backend singleton.
    
    Returns:
        LocalBackend instance configured from environment
    """
    global _storage_backend
    if _storage_backend is None:
        data_dir = os.getenv("ARCHIVE_DATA_DIR", os.getenv("DATA_DIR", "./data"))
        _storage_backend = LocalBackend(base_path=data_dir)
        logger.info(f"Storage backend initialized: {data_dir}")
    return _storage_backend


def reset_storage_backend():
    """Reset storage backend singleton (for testing)."""
    global _storage_backend
    _storage_backend = None


async def get_db_pool() -> asyncpg.Pool:
    """Get the database connection pool.
    
    Returns:
        asyncpg connection pool
        
    Raises:
        HTTPException: If database pool is not initialized
    """
    try:
        pool = get_pool()
        if pool._pool is None:
            await pool.connect()
        return pool._pool
    except Exception as e:
        logger.error(f"Failed to get database pool: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable",
        )


async def get_archival_service(
    storage: StorageBackend = Depends(get_storage_backend),
) -> ArchivalService:
    """Get or create the archival service with dependencies.
    
    Args:
        storage: Storage backend from get_storage_backend
        
    Returns:
        ArchivalService instance
        
    Raises:
        HTTPException: If service initialization fails
    """
    global _archival_service
    
    try:
        pool = get_pool()
        if pool._pool is None:
            await pool.connect()
            
        # Create new service instance if needed
        if _archival_service is None:
            _archival_service = ArchivalService(storage, pool)
            
        return _archival_service
    except Exception as e:
        logger.error(f"Failed to create archival service: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Archival service unavailable",
        )


def reset_archival_service():
    """Reset archival service singleton (for testing)."""
    global _archival_service
    _archival_service = None


async def require_admin_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Require admin authentication for protected endpoints.
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        TokenData for authenticated admin user
        
    Raises:
        HTTPException: If not authenticated or not admin
    """
    # Get current user (raises 401 if invalid)
    user = await get_current_user(credentials)
    
    # Check admin permission
    if "admin" not in (user.permissions or []):
        logger.warning(f"Non-admin user {user.username} attempted admin action")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    return user


async def require_service_or_admin_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Require service principal or admin authentication.
    
    Service principals have 'service' permission.
    Admins have 'admin' permission.
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        TokenData for authenticated service or admin user
        
    Raises:
        HTTPException: If not authenticated or lacks required permissions
    """
    user = await get_current_user(credentials)
    
    allowed_permissions = {"admin", "service"}
    user_permissions = set(user.permissions or [])
    
    if not allowed_permissions & user_permissions:
        logger.warning(
            f"User {user.username} lacks required permissions for service endpoint"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Service principal or admin access required",
        )
    
    return user
