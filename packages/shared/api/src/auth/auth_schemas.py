"""
[Ver001.000]
Authentication Pydantic Schemas
OAuth + 2FA Implementation
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator


# ============================================================================
# Token Schemas
# ============================================================================

class Token(BaseModel):
    """JWT token response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration in seconds")
    expires_at: datetime = Field(..., description="Access token expiration timestamp")


class TokenData(BaseModel):
    """Token payload data."""
    user_id: str
    username: str
    email: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    is_active: bool = True


class UserBase(BaseModel):
    """Base user model."""
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: Optional[EmailStr] = None
    display_name: Optional[str] = Field(None, max_length=100)


class UserLogin(BaseModel):
    """User login request."""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., min_length=8, description="User password")


class UserRegister(UserBase):
    """User registration request."""
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    password_confirm: str = Field(..., description="Password confirmation")
    
    @field_validator('password_confirm')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v


class UserUpdate(BaseModel):
    """User update request."""
    email: Optional[EmailStr] = None
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=500)


class UserResponse(UserBase):
    """User response model (safe to return to client)."""
    id: str = Field(..., description="User unique identifier")
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserProfile(UserResponse):
    """Extended user profile (for own profile view)."""
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    social_links: Optional[dict] = None


class PasswordResetRequest(BaseModel):
    """Password reset request (step 1 - send email)."""
    email: EmailStr


class PasswordReset(BaseModel):
    """Password reset confirmation (step 2 - set new password)."""
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, max_length=128)
    new_password_confirm: str = Field(...)
    
    @field_validator('new_password_confirm')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


class PasswordChange(BaseModel):
    """Password change (for authenticated users)."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    new_password_confirm: str = Field(...)
    
    @field_validator('new_password_confirm')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


class RefreshTokenRequest(BaseModel):
    """Token refresh request."""
    refresh_token: str


# ============================================================================
# 2FA Schemas
# ============================================================================

class TwoFactorSetupRequest(BaseModel):
    """Request to initialize 2FA setup."""
    pass  # No fields needed, uses authenticated user


class TwoFactorSetupResponse(BaseModel):
    """Response with 2FA setup information."""
    secret: str = Field(..., description="TOTP secret (show only once)")
    qr_code: str = Field(..., description="Base64 encoded QR code image")
    manual_entry_key: str = Field(..., description="Manual entry key for authenticator apps")


class TwoFactorEnableRequest(BaseModel):
    """Request to enable 2FA after setup."""
    verification_code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TwoFactorEnableResponse(BaseModel):
    """Response after enabling 2FA."""
    enabled: bool = True
    backup_codes: List[str] = Field(..., description="10 backup codes (show only once)")


class TwoFactorVerifyRequest(BaseModel):
    """Request to verify 2FA code during login."""
    temp_token: str = Field(..., description="Temporary token from initial login")
    code: str = Field(..., min_length=6, max_length=8, description="TOTP code or backup code")
    is_backup_code: bool = Field(default=False, description="Whether this is a backup code")


class TwoFactorDisableRequest(BaseModel):
    """Request to disable 2FA."""
    password: str = Field(..., description="Current password for verification")


class TwoFactorStatusResponse(BaseModel):
    """2FA status for a user."""
    enabled: bool
    enabled_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class TwoFactorRegenerateBackupCodesRequest(BaseModel):
    """Request to regenerate backup codes."""
    password: str = Field(..., description="Current password for verification")


class TwoFactorRegenerateBackupCodesResponse(BaseModel):
    """Response with new backup codes."""
    backup_codes: List[str] = Field(..., description="10 new backup codes (show only once)")


# ============================================================================
# OAuth Schemas
# ============================================================================

class OAuthLoginRequest(BaseModel):
    """Request for OAuth login (mobile/non-browser flows)."""
    provider: str = Field(..., pattern=r"^(discord|google|github)$")
    access_token: str = Field(..., description="OAuth access token from provider")


class OAuthLinkRequest(BaseModel):
    """Request to link OAuth account."""
    provider: str = Field(..., pattern=r"^(discord|google|github)$")
    access_token: str = Field(..., description="OAuth access token from provider")


class OAuthAccountResponse(BaseModel):
    """OAuth account information."""
    id: int
    provider: str
    provider_account_id: str
    provider_email: Optional[str] = None
    provider_username: Optional[str] = None
    provider_avatar_url: Optional[str] = None
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OAuthProviderResponse(BaseModel):
    """OAuth provider information."""
    name: str
    display_name: str
    configured: bool
    auth_url: str


# ============================================================================
# Extended Token Schema for 2FA
# ============================================================================

class TokenWithTwoFactor(BaseModel):
    """Token response when 2FA is required."""
    requires_two_factor: bool = True
    temp_token: str = Field(..., description="Temporary token to complete 2FA")
    message: str = "Two-factor authentication required"


class AuthError(BaseModel):
    """Authentication error response."""
    detail: str
    error_code: Optional[str] = None
