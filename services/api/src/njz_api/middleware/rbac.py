"""
Role-Based Access Control (RBAC)

Granular permission system for API access control.
"""

import logging
from enum import Enum
from typing import Dict, List, Optional, Set
from functools import wraps

from fastapi import Request, HTTPException, Depends
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class Permission(str, Enum):
    """API Permissions."""
    # Player permissions
    PLAYER_READ = "player:read"
    PLAYER_WRITE = "player:write"
    PLAYER_DELETE = "player:delete"
    
    # Team permissions
    TEAM_READ = "team:read"
    TEAM_WRITE = "team:write"
    TEAM_DELETE = "team:delete"
    
    # Match permissions
    MATCH_READ = "match:read"
    MATCH_WRITE = "match:write"
    MATCH_DELETE = "match:delete"
    
    # Analytics permissions
    ANALYTICS_READ = "analytics:read"
    ANALYTICS_WRITE = "analytics:write"
    
    # Admin permissions
    ADMIN_USERS = "admin:users"
    ADMIN_SYSTEM = "admin:system"
    ADMIN_EXPORT = "admin:export"
    
    # Feature flags
    FEATURES_READ = "features:read"
    FEATURES_WRITE = "features:write"


class Role(str, Enum):
    """User roles with predefined permissions."""
    GUEST = "guest"
    USER = "user"
    ANALYST = "analyst"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SERVICE = "service"  # For internal service accounts


# Role-Permission mappings
ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.GUEST: {
        Permission.PLAYER_READ,
        Permission.TEAM_READ,
        Permission.MATCH_READ,
        Permission.ANALYTICS_READ,
    },
    Role.USER: {
        Permission.PLAYER_READ,
        Permission.TEAM_READ,
        Permission.MATCH_READ,
        Permission.ANALYTICS_READ,
    },
    Role.ANALYST: {
        Permission.PLAYER_READ,
        Permission.TEAM_READ,
        Permission.MATCH_READ,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_WRITE,
    },
    Role.MODERATOR: {
        Permission.PLAYER_READ,
        Permission.PLAYER_WRITE,
        Permission.TEAM_READ,
        Permission.TEAM_WRITE,
        Permission.MATCH_READ,
        Permission.MATCH_WRITE,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_WRITE,
    },
    Role.ADMIN: set(Permission),  # All permissions
    Role.SERVICE: set(Permission),  # Service accounts have all permissions
}


class UserPrincipal(BaseModel):
    """Authenticated user principal."""
    id: str
    email: Optional[str] = None
    roles: List[Role]
    permissions: Set[Permission] = set()
    
    def has_permission(self, permission: Permission) -> bool:
        """Check if user has specific permission."""
        return permission in self.permissions
    
    def has_any_permission(self, permissions: List[Permission]) -> bool:
        """Check if user has any of the permissions."""
        return any(p in self.permissions for p in permissions)
    
    def has_all_permissions(self, permissions: List[Permission]) -> bool:
        """Check if user has all permissions."""
        return all(p in self.permissions for p in permissions)
    
    def is_admin(self) -> bool:
        """Check if user is admin."""
        return Role.ADMIN in self.roles


class RBACManager:
    """
    Role-Based Access Control manager.
    
    Handles:
    - Permission checking
    - Role assignment
    - Permission inheritance
    """
    
    def __init__(self):
        self._custom_permissions: Dict[str, Set[Permission]] = {}
    
    def get_user_permissions(self, roles: List[Role]) -> Set[Permission]:
        """Get combined permissions for a list of roles."""
        permissions = set()
        for role in roles:
            permissions.update(ROLE_PERMISSIONS.get(role, set()))
        return permissions
    
    def create_principal(
        self,
        user_id: str,
        email: Optional[str],
        roles: List[Role]
    ) -> UserPrincipal:
        """Create a user principal with resolved permissions."""
        permissions = self.get_user_permissions(roles)
        
        # Add custom permissions if any
        if user_id in self._custom_permissions:
            permissions.update(self._custom_permissions[user_id])
        
        return UserPrincipal(
            id=user_id,
            email=email,
            roles=roles,
            permissions=permissions
        )
    
    def grant_permission(self, user_id: str, permission: Permission):
        """Grant a custom permission to a user."""
        if user_id not in self._custom_permissions:
            self._custom_permissions[user_id] = set()
        self._custom_permissions[user_id].add(permission)
    
    def revoke_permission(self, user_id: str, permission: Permission):
        """Revoke a custom permission from a user."""
        if user_id in self._custom_permissions:
            self._custom_permissions[user_id].discard(permission)


# Global RBAC manager
_rbac_manager: Optional[RBACManager] = None


def get_rbac_manager() -> RBACManager:
    """Get the global RBAC manager."""
    global _rbac_manager
    if _rbac_manager is None:
        _rbac_manager = RBACManager()
    return _rbac_manager


async def get_current_principal(request: Request) -> Optional[UserPrincipal]:
    """
    Get current user principal from request.
    
    Extracts JWT token and resolves permissions.
    """
    # Get token from header
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        # Return guest principal
        return get_rbac_manager().create_principal(
            user_id="anonymous",
            email=None,
            roles=[Role.GUEST]
        )
    
    token = auth_header[7:]  # Remove "Bearer "
    
    # Decode and validate JWT (simplified)
    try:
        from jose import jwt
        from ..config import settings
        
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        
        user_id = payload.get("sub")
        email = payload.get("email")
        roles = [Role(r) for r in payload.get("roles", ["guest"])]
        
        return get_rbac_manager().create_principal(user_id, email, roles)
        
    except Exception as e:
        logger.warning(f"JWT validation failed: {e}")
        # Return guest principal
        return get_rbac_manager().create_principal(
            user_id="anonymous",
            email=None,
            roles=[Role.GUEST]
        )


def require_permission(permission: Permission):
    """
    Decorator/FastAPI dependency to require a specific permission.
    
    Usage:
        @app.get("/admin/users")
        async def list_users(
            principal: UserPrincipal = Depends(require_permission(Permission.ADMIN_USERS))
        ):
            ...
    """
    async def check_permission(
        request: Request
    ) -> UserPrincipal:
        principal = await get_current_principal(request)
        
        if not principal.has_permission(permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {permission.value}"
            )
        
        return principal
    
    return check_permission


def require_any_permission(permissions: List[Permission]):
    """Require any of the specified permissions."""
    async def check_permission(request: Request) -> UserPrincipal:
        principal = await get_current_principal(request)
        
        if not principal.has_any_permission(permissions):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: needs one of {[p.value for p in permissions]}"
            )
        
        return principal
    
    return check_permission


def require_admin():
    """Require admin role."""
    return require_permission(Permission.ADMIN_SYSTEM)
