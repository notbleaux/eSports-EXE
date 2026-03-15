"""
Authentication Utilities
JWT token handling, password hashing, and FastAPI dependencies
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
import os
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from .auth_schemas import TokenData

# Configure logging
logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    # Prevent hardcoded secrets in production
    if os.getenv("APP_ENVIRONMENT") == "production":
        raise RuntimeError(
            "CRITICAL: JWT_SECRET_KEY environment variable must be set in production! "
            "Generate a secure key with: openssl rand -hex 32"
        )
    # Fallback for development only
    SECRET_KEY = "dev-secret-key-change-in-production"
    logger.warning("JWT_SECRET_KEY not set, using development fallback!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme for Swagger UI
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a plain text password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> tuple[str, datetime]:
    """
    Create a JWT access token.
    
    Returns:
        Tuple of (token_string, expiration_datetime)
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire


def create_refresh_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> tuple[str, datetime]:
    """
    Create a JWT refresh token.
    
    Returns:
        Tuple of (token_string, expiration_datetime)
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire


def verify_token(token: str, token_type: str = "access") -> Optional[TokenData]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: The JWT token string
        token_type: Expected token type ("access" or "refresh")
    
    Returns:
        TokenData if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != token_type:
            logger.warning(f"Token type mismatch: expected {token_type}, got {payload.get('type')}")
            return None
        
        user_id: str = payload.get("sub")
        username: str = payload.get("username")
        
        if user_id is None or username is None:
            return None
        
        return TokenData(
            user_id=user_id,
            username=username,
            email=payload.get("email"),
            permissions=payload.get("permissions", []),
            is_active=payload.get("is_active", True),
        )
    
    except JWTError as e:
        logger.debug(f"JWT verification failed: {e}")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """
    FastAPI dependency to get the current authenticated user.
    
    Usage:
        @router.get("/protected")
        async def protected_endpoint(user: TokenData = Depends(get_current_user)):
            return {"user_id": user.user_id}
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    token_data = verify_token(credentials.credentials, token_type="access")
    
    if token_data is None:
        raise credentials_exception
    
    return token_data


async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user)
) -> TokenData:
    """
    FastAPI dependency to get the current active user.
    Checks that the user account is active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return current_user


def require_permissions(required_permissions: List[str]):
    """
    Factory for creating permission-checking dependencies.
    
    Usage:
        @router.post("/admin-only")
        async def admin_endpoint(
            user: TokenData = Depends(require_permissions(["admin"]))
        ):
            return {"message": "Admin access granted"}
    """
    async def check_permissions(
        current_user: TokenData = Depends(get_current_active_user)
    ) -> TokenData:
        user_perms = set(current_user.permissions)
        required_perms = set(required_permissions)
        
        if not required_perms.issubset(user_perms):
            missing = required_perms - user_perms
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Missing: {', '.join(missing)}"
            )
        
        return current_user
    
    return check_permissions


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[TokenData]:
    """
    Get current user if authenticated, None otherwise.
    Useful for endpoints that work with or without authentication.
    """
    if not credentials:
        return None
    
    return verify_token(credentials.credentials, token_type="access")


# Common permission sets
ADMIN_PERMISSIONS = ["admin"]
MODERATOR_PERMISSIONS = ["moderator", "admin"]
PREMIUM_PERMISSIONS = ["premium", "moderator", "admin"]
