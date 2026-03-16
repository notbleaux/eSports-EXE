"""
[Ver001.000]
Authentication Routes
Login, registration, token refresh, password reset, OAuth, 2FA
"""

from datetime import datetime, timezone
from typing import Optional
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import HTTPBearer
from slowapi import Limiter
from slowapi.util import get_remote_address

from axiom_esports_data.api.src.db_manager import db
from .auth_schemas import (
    Token, TokenData, UserLogin, UserRegister, UserResponse, UserProfile,
    RefreshTokenRequest, PasswordResetRequest, PasswordReset,
    PasswordChange, UserUpdate, TokenWithTwoFactor,
    TwoFactorSetupResponse, TwoFactorEnableRequest, TwoFactorEnableResponse,
    TwoFactorVerifyRequest, TwoFactorDisableRequest, TwoFactorStatusResponse,
    TwoFactorRegenerateBackupCodesRequest, TwoFactorRegenerateBackupCodesResponse
)
from .auth_utils import (
    create_access_token, create_refresh_token, verify_token,
    hash_password, verify_password, get_current_user, get_current_active_user
)
from .two_factor import (
    setup_two_factor, enable_two_factor, disable_two_factor,
    verify_two_factor, verify_backup_code_login, get_two_factor_status,
    regenerate_backup_codes, create_temp_token, is_two_factor_enabled
)

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Rate limiter: 5 requests per minute for auth endpoints (P0 Security Fix)
auth_limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@auth_limiter.limit("5/minute")
async def register(
    request: Request,
    user_data: UserRegister,
    background_tasks: BackgroundTasks
):
    """
    Register a new user account.
    
    - Creates user record with hashed password
    - Initializes token wallet
    - Sends verification email (if configured)
    """
    async with db.pool.acquire() as conn:
        # Check if username exists
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE username = $1",
            user_data.username
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already registered"
            )
        
        # Check if email exists (if provided)
        if user_data.email:
            existing_email = await conn.fetchrow(
                "SELECT id FROM users WHERE email = $1",
                user_data.email
            )
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered"
                )
        
        # Create user with cryptographically secure ID
        user_id = f"usr_{secrets.token_urlsafe(12)}"
        hashed_pw = hash_password(user_data.password)
        
        now = datetime.now(timezone.utc)
        
        await conn.execute(
            """
            INSERT INTO users (id, username, email, display_name, hashed_password, 
                             is_active, is_verified, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """,
            user_id, user_data.username, user_data.email,
            user_data.display_name or user_data.username,
            hashed_pw, True, False, now, now
        )
        
        # Initialize token wallet for new user
        await conn.execute(
            """
            INSERT INTO user_tokens (user_id, balance, total_earned, total_spent, created_at, updated_at)
            VALUES ($1, 0, 0, 0, $2, $2)
            """,
            user_id, now
        )
        
        # Fetch created user
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            user_id
        )
        
        # TODO: Send verification email via background task
        # background_tasks.add_task(send_verification_email, user_id, user_data.email)
        
        return UserResponse(**dict(user))


@router.post("/login", response_model=Token)
@auth_limiter.limit("5/minute")
async def login(request: Request, login_data: UserLogin):
    """
    Authenticate user and return JWT tokens.
    
    - Accepts username or email as login identifier
    - If 2FA is enabled, returns a temp_token for 2FA verification
    - Otherwise, returns full access token and refresh token
    - Updates last_login timestamp
    """
    async with db.pool.acquire() as conn:
        # Try to find user by username or email
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE username = $1 OR email = $1",
            login_data.username
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(login_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )
        
        # Check if 2FA is enabled
        two_factor_enabled = await is_two_factor_enabled(user["id"])
        
        if two_factor_enabled:
            # Return temp token for 2FA verification
            temp_token = await create_temp_token(user["id"])
            return TokenWithTwoFactor(
                requires_two_factor=True,
                temp_token=temp_token,
                message="Two-factor authentication required"
            )
        
        # Update last login
        now = datetime.now(timezone.utc)
        await conn.execute(
            "UPDATE users SET last_login = $1 WHERE id = $2",
            now, user["id"]
        )
        
        # Get user permissions
        permissions = await conn.fetch(
            "SELECT permission FROM user_permissions WHERE user_id = $1",
            user["id"]
        )
        perm_list = [p["permission"] for p in permissions]
        
        # Create tokens
        token_data = {
            "sub": user["id"],
            "username": user["username"],
            "email": user["email"],
            "permissions": perm_list,
            "is_active": user["is_active"],
        }
        
        access_token, access_expires = create_access_token(token_data)
        refresh_token, refresh_expires = create_refresh_token({"sub": user["id"]})
        
        # Store refresh token (for logout/revocation)
        await conn.execute(
            """
            INSERT INTO refresh_tokens (token, user_id, expires_at, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            refresh_token, user["id"], refresh_expires, now
        )
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=15 * 60,  # 15 minutes in seconds
            expires_at=access_expires
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using a valid refresh token.
    
    - Validates refresh token
    - Issues new access token
    - Optionally rotates refresh token (security best practice)
    """
    # Verify refresh token
    token_data = verify_token(request.refresh_token, token_type="refresh")
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    async with db.pool.acquire() as conn:
        # Check if refresh token exists and is not revoked
        stored = await conn.fetchrow(
            """
            SELECT * FROM refresh_tokens 
            WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()
            """,
            request.refresh_token
        )
        
        if not stored:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user data
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            token_data.user_id
        )
        
        if not user or not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not found or inactive"
            )
        
        # Get permissions
        permissions = await conn.fetch(
            "SELECT permission FROM user_permissions WHERE user_id = $1",
            user["id"]
        )
        perm_list = [p["permission"] for p in permissions]
        
        # Create new tokens
        token_data = {
            "sub": user["id"],
            "username": user["username"],
            "email": user["email"],
            "permissions": perm_list,
            "is_active": user["is_active"],
        }
        
        access_token, access_expires = create_access_token(token_data)
        new_refresh_token, refresh_expires = create_refresh_token({"sub": user["id"]})
        
        # Revoke old refresh token and store new one
        now = datetime.now(timezone.utc)
        await conn.execute(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1",
            request.refresh_token
        )
        await conn.execute(
            """
            INSERT INTO refresh_tokens (token, user_id, expires_at, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            new_refresh_token, user["id"], refresh_expires, now
        )
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=15 * 60,
            expires_at=access_expires
        )


@router.post("/logout")
async def logout(
    request: RefreshTokenRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Logout user and revoke refresh token.
    
    - Revokes the provided refresh token
    - Client should discard access token
    """
    async with db.pool.acquire() as conn:
        await conn.execute(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1 AND user_id = $2",
            request.refresh_token, current_user.user_id
        )
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: TokenData = Depends(get_current_active_user)):
    """Get current user's profile."""
    async with db.pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            current_user.user_id
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserProfile(**dict(user))


@router.patch("/me", response_model=UserResponse)
async def update_me(
    request: UserUpdate,
    current_user: TokenData = Depends(get_current_active_user)
):
    """Update current user's profile."""
    update_fields = []
    params = []
    param_idx = 1
    
    if request.email is not None:
        update_fields.append(f"email = ${param_idx}")
        params.append(request.email)
        param_idx += 1
    
    if request.display_name is not None:
        update_fields.append(f"display_name = ${param_idx}")
        params.append(request.display_name)
        param_idx += 1
    
    if request.bio is not None:
        update_fields.append(f"bio = ${param_idx}")
        params.append(request.bio)
        param_idx += 1
    
    if request.avatar_url is not None:
        update_fields.append(f"avatar_url = ${param_idx}")
        params.append(request.avatar_url)
        param_idx += 1
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_fields.append(f"updated_at = ${param_idx}")
    params.append(datetime.now(timezone.utc))
    param_idx += 1
    
    params.append(current_user.user_id)
    
    async with db.pool.acquire() as conn:
        # Check email uniqueness if updating email
        if request.email:
            existing = await conn.fetchrow(
                "SELECT id FROM users WHERE email = $1 AND id != $2",
                request.email, current_user.user_id
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already in use"
                )
        
        await conn.execute(
            f"UPDATE users SET {', '.join(update_fields)} WHERE id = ${param_idx}",
            *params
        )
        
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            current_user.user_id
        )
        
        return UserResponse(**dict(user))


@router.post("/password/change")
async def change_password(
    request: PasswordChange,
    current_user: TokenData = Depends(get_current_active_user)
):
    """Change password for authenticated user."""
    async with db.pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT hashed_password FROM users WHERE id = $1",
            current_user.user_id
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(request.current_password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        # Update password
        new_hash = hash_password(request.new_password)
        await conn.execute(
            "UPDATE users SET hashed_password = $1, updated_at = $2 WHERE id = $3",
            new_hash, datetime.now(timezone.utc), current_user.user_id
        )
        
        # Revoke all refresh tokens for security
        await conn.execute(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1",
            current_user.user_id
        )
        
        return {"message": "Password changed successfully. Please log in again."}


@router.post("/password/reset-request")
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks
):
    """
    Request password reset email.
    
    - Always returns success (prevents user enumeration)
    - Sends reset email if user exists
    """
    async with db.pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            request.email
        )
        
        if user:
            # Generate reset token
            reset_token = secrets.token_urlsafe(32)
            expires = datetime.now(timezone.utc) + __import__('datetime').timedelta(hours=1)
            
            await conn.execute(
                """
                INSERT INTO password_resets (token, user_id, expires_at, created_at)
                VALUES ($1, $2, $3, $4)
                """,
                reset_token, user["id"], expires, datetime.now(timezone.utc)
            )
            
            # TODO: Send email via background task
            # background_tasks.add_task(send_reset_email, request.email, reset_token)
    
    # Always return success to prevent user enumeration
    return {"message": "If an account exists with this email, a reset link has been sent."}


@router.post("/password/reset")
async def reset_password(request: PasswordReset):
    """Reset password using token from email."""
    async with db.pool.acquire() as conn:
        # Find valid reset token
        reset = await conn.fetchrow(
            """
            SELECT * FROM password_resets 
            WHERE token = $1 AND used = FALSE AND expires_at > NOW()
            """,
            request.token
        )
        
        if not reset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Update password
        new_hash = hash_password(request.new_password)
        await conn.execute(
            "UPDATE users SET hashed_password = $1, updated_at = $2 WHERE id = $3",
            new_hash, datetime.now(timezone.utc), reset["user_id"]
        )
        
        # Mark token as used
        await conn.execute(
            "UPDATE password_resets SET used = TRUE WHERE token = $1",
            request.token
        )
        
        # Revoke all refresh tokens
        await conn.execute(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1",
            reset["user_id"]
        )
        
        return {"message": "Password reset successfully"}


# ============================================================================
# Two-Factor Authentication Endpoints
# ============================================================================

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def two_factor_setup(
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Initialize 2FA setup.
    
    Returns:
        - TOTP secret (show only once)
        - QR code as base64 image
        - Manual entry key
    """
    # Get user email
    async with db.pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT email FROM users WHERE id = $1",
            current_user.user_id
        )
        email = user["email"] or current_user.username
    
    result = await setup_two_factor(current_user.user_id, email)
    return TwoFactorSetupResponse(**result)


@router.post("/2fa/enable", response_model=TwoFactorEnableResponse)
async def two_factor_enable(
    request: TwoFactorEnableRequest,
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Enable 2FA after verification.
    
    Requires the user to verify a TOTP code from their authenticator app.
    Returns backup codes that should be saved securely.
    """
    try:
        result = await enable_two_factor(current_user.user_id, request.verification_code)
        return TwoFactorEnableResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/2fa/verify", response_model=Token)
async def two_factor_verify(request: TwoFactorVerifyRequest):
    """
    Complete login with 2FA verification.
    
    Used after initial login returns a temp_token.
    Accepts either TOTP code or backup code.
    """
    # Verify temp token
    from .two_factor import verify_temp_token
    user_id = await verify_temp_token(request.temp_token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired temporary token"
        )
    
    # Verify 2FA code
    if request.is_backup_code:
        valid = await verify_backup_code_login(user_id, request.code)
    else:
        valid = await verify_two_factor(user_id, request.code)
    
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )
    
    # Generate full tokens
    async with db.pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            user_id
        )
        
        if not user or not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not found or inactive"
            )
        
        # Get permissions
        permissions = await conn.fetch(
            "SELECT permission FROM user_permissions WHERE user_id = $1",
            user_id
        )
        perm_list = [p["permission"] for p in permissions]
        
        # Create tokens
        token_data = {
            "sub": user_id,
            "username": user["username"],
            "email": user["email"],
            "permissions": perm_list,
            "is_active": user["is_active"],
        }
        
        access_token, access_expires = create_access_token(token_data)
        refresh_token, refresh_expires = create_refresh_token({"sub": user_id})
        
        # Store refresh token
        now = datetime.now(timezone.utc)
        await conn.execute(
            """
            INSERT INTO refresh_tokens (token, user_id, expires_at, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            refresh_token, user_id, refresh_expires, now
        )
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=15 * 60,
            expires_at=access_expires
        )


@router.post("/2fa/disable")
async def two_factor_disable(
    request: TwoFactorDisableRequest,
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Disable 2FA for the current user.
    
    Requires password verification for security.
    """
    try:
        await disable_two_factor(current_user.user_id, request.password)
        return {"message": "Two-factor authentication disabled successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
async def two_factor_status(
    current_user: TokenData = Depends(get_current_active_user)
):
    """Get 2FA status for the current user."""
    result = await get_two_factor_status(current_user.user_id)
    return TwoFactorStatusResponse(**result)


@router.post("/2fa/backup-codes/regenerate", response_model=TwoFactorRegenerateBackupCodesResponse)
async def two_factor_regenerate_backup_codes(
    request: TwoFactorRegenerateBackupCodesRequest,
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Generate new backup codes.
    
    Invalidates all existing backup codes. Returns new codes (show only once).
    """
    try:
        result = await regenerate_backup_codes(current_user.user_id, request.password)
        return TwoFactorRegenerateBackupCodesResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
