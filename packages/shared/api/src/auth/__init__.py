"""
SATOR Authentication Module
JWT-based authentication for the API
"""

from .auth_utils import (
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_password,
    hash_password,
    get_current_user,
    get_current_active_user,
    get_optional_user,
    require_permissions,
)
from .auth_schemas import (
    Token,
    TokenData,
    UserLogin,
    UserRegister,
    UserResponse,
    PasswordReset,
    PasswordResetRequest,
)

__all__ = [
    "create_access_token",
    "create_refresh_token",
    "verify_token",
    "verify_password",
    "hash_password",
    "get_current_user",
    "get_current_active_user",
    "get_optional_user",
    "require_permissions",
    "Token",
    "TokenData",
    "UserLogin",
    "UserRegister",
    "UserResponse",
    "PasswordReset",
    "PasswordResetRequest",
]
