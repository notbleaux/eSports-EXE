"""
Authentication Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator


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


class AuthError(BaseModel):
    """Authentication error response."""
    detail: str
    error_code: Optional[str] = None
