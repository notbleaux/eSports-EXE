"""
[Ver001.000]
OAuth + 2FA Implementation
==========================
Two-Factor Authentication with TOTP and backup codes.
"""

import os
import base64
import hashlib
import secrets
import json
import logging
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timezone, timedelta
from io import BytesIO

import pyotp
import qrcode
from passlib.context import CryptContext

from axiom_esports_data.api.src.db_manager import db


logger = logging.getLogger(__name__)

# Password hashing for backup codes
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# SECURITY FIX: Removed weak 2FA fallback (Round 2b Zeta)
# Encryption key for TOTP secrets MUST be set in environment
TOTP_ENCRYPTION_KEY = os.getenv("TOTP_ENCRYPTION_KEY", "")
if not TOTP_ENCRYPTION_KEY:
    # ENFORCE: Always require encryption key - no weak fallbacks allowed
    raise RuntimeError(
        "CRITICAL: TOTP_ENCRYPTION_KEY environment variable must be set! "
        "Generate a secure key with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    )


def _get_encryption_key() -> bytes:
    """Get encryption key from environment."""
    key = TOTP_ENCRYPTION_KEY.encode()[:32]  # Ensure 32 bytes for AES-256
    return hashlib.sha256(key).digest()  # Hash to get exactly 32 bytes


def encrypt_secret(secret: str) -> str:
    """Encrypt TOTP secret using Fernet-like approach with AES."""
    from cryptography.fernet import Fernet
    import base64
    
    key = base64.urlsafe_b64encode(_get_encryption_key())
    f = Fernet(key)
    encrypted = f.encrypt(secret.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_secret(encrypted_secret: str) -> str:
    """Decrypt TOTP secret."""
    from cryptography.fernet import Fernet
    import base64
    
    key = base64.urlsafe_b64encode(_get_encryption_key())
    f = Fernet(key)
    decrypted = f.decrypt(base64.urlsafe_b64decode(encrypted_secret.encode()))
    return decrypted.decode()


def generate_totp_secret() -> str:
    """Generate a new TOTP secret."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "SATOR Platform") -> str:
    """Generate TOTP provisioning URI for QR code."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def generate_qr_code(uri: str) -> str:
    """Generate QR code as base64 encoded PNG."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode()


def generate_backup_codes(count: int = 10) -> Tuple[List[str], List[str]]:
    """
    Generate backup codes.
    
    Returns:
        Tuple of (plain_codes, hashed_codes)
    """
    plain_codes = []
    hashed_codes = []
    
    for _ in range(count):
        # Generate 8-character alphanumeric code
        code = ''.join(secrets.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789') for _ in range(8))
        plain_codes.append(code)
        hashed_codes.append(pwd_context.hash(code))
    
    return plain_codes, hashed_codes


def verify_backup_code(plain_code: str, hashed_codes: List[str]) -> bool:
    """Verify a backup code against list of hashed codes."""
    for hashed in hashed_codes:
        if pwd_context.verify(plain_code, hashed):
            return True
    return False


def verify_totp(secret: str, code: str) -> bool:
    """Verify TOTP code."""
    try:
        totp = pyotp.TOTP(secret)
        # Allow 1 time step window (30 seconds before/after)
        return totp.verify(code, valid_window=1)
    except Exception as e:
        logger.warning(f"TOTP verification error: {e}")
        return False


async def setup_two_factor(user_id: str, email: str) -> Dict[str, Any]:
    """
    Initialize 2FA setup for a user.
    
    Returns:
        Dict with secret, qr_code, and manual_entry_key
    """
    # Generate new secret
    secret = generate_totp_secret()
    encrypted_secret = encrypt_secret(secret)
    
    # Generate provisioning URI
    uri = get_totp_uri(secret, email)
    
    # Generate QR code
    qr_code_base64 = generate_qr_code(uri)
    
    async with db.pool.acquire() as conn:
        # Check if user already has 2FA
        existing = await conn.fetchrow(
            "SELECT * FROM two_factor_auth WHERE user_id = $1",
            user_id
        )
        
        if existing:
            # Update with new secret (not enabled yet)
            await conn.execute(
                """
                UPDATE two_factor_auth
                SET secret_encrypted = $1, is_enabled = FALSE, backup_codes_hash = NULL
                WHERE user_id = $2
                """,
                encrypted_secret, user_id
            )
        else:
            # Create new record
            await conn.execute(
                """
                INSERT INTO two_factor_auth (user_id, secret_encrypted, is_enabled)
                VALUES ($1, $2, FALSE)
                """,
                user_id, encrypted_secret
            )
    
    return {
        "secret": secret,  # Plain secret for initial setup only
        "qr_code": f"data:image/png;base64,{qr_code_base64}",
        "manual_entry_key": secret,
    }


async def enable_two_factor(user_id: str, verification_code: str) -> Dict[str, Any]:
    """
    Enable 2FA after verification.
    
    Returns:
        Dict with backup_codes
    """
    async with db.pool.acquire() as conn:
        # Get user's TOTP secret
        record = await conn.fetchrow(
            "SELECT * FROM two_factor_auth WHERE user_id = $1",
            user_id
        )
        
        if not record:
            raise ValueError("2FA not initialized. Call setup first.")
        
        if record["is_enabled"]:
            raise ValueError("2FA is already enabled")
        
        # Decrypt and verify code
        secret = decrypt_secret(record["secret_encrypted"])
        
        if not verify_totp(secret, verification_code):
            raise ValueError("Invalid verification code")
        
        # Generate backup codes
        plain_codes, hashed_codes = generate_backup_codes(10)
        
        # Enable 2FA and store hashed backup codes
        await conn.execute(
            """
            UPDATE two_factor_auth
            SET is_enabled = TRUE, enabled_at = NOW(), backup_codes_hash = $1
            WHERE user_id = $2
            """,
            json.dumps(hashed_codes), user_id
        )
        
        return {
            "enabled": True,
            "backup_codes": plain_codes,  # Show only once
        }


async def disable_two_factor(user_id: str, password: str) -> bool:
    """Disable 2FA for a user."""
    from .auth_utils import verify_password
    
    async with db.pool.acquire() as conn:
        # Verify password first
        user = await conn.fetchrow(
            "SELECT hashed_password FROM users WHERE id = $1",
            user_id
        )
        
        if not user:
            raise ValueError("User not found")
        
        if not verify_password(password, user["hashed_password"]):
            raise ValueError("Invalid password")
        
        # Check if 2FA is enabled
        record = await conn.fetchrow(
            "SELECT is_enabled FROM two_factor_auth WHERE user_id = $1",
            user_id
        )
        
        if not record or not record["is_enabled"]:
            raise ValueError("2FA is not enabled")
        
        # Disable 2FA
        await conn.execute(
            "DELETE FROM two_factor_auth WHERE user_id = $1",
            user_id
        )
        
        # Update users table
        await conn.execute(
            "UPDATE users SET two_factor_enabled = FALSE WHERE id = $1",
            user_id
        )
        
        return True


async def verify_two_factor(user_id: str, code: str) -> bool:
    """Verify TOTP code for a user."""
    async with db.pool.acquire() as conn:
        record = await conn.fetchrow(
            """
            SELECT tfa.*, u.email 
            FROM two_factor_auth tfa
            JOIN users u ON tfa.user_id = u.id
            WHERE tfa.user_id = $1 AND tfa.is_enabled = TRUE
            """,
            user_id
        )
        
        if not record:
            return False
        
        secret = decrypt_secret(record["secret_encrypted"])
        return verify_totp(secret, code)


async def verify_backup_code_login(user_id: str, code: str) -> bool:
    """Verify backup code for login."""
    async with db.pool.acquire() as conn:
        # Get user's backup codes
        record = await conn.fetchrow(
            "SELECT backup_codes_hash FROM two_factor_auth WHERE user_id = $1 AND is_enabled = TRUE",
            user_id
        )
        
        if not record or not record["backup_codes_hash"]:
            return False
        
        hashed_codes = json.loads(record["backup_codes_hash"])
        
        # Check if code was already used
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        used = await conn.fetchrow(
            "SELECT 1 FROM used_backup_codes WHERE user_id = $1 AND code_hash = $2",
            user_id, code_hash
        )
        
        if used:
            return False
        
        # Verify code
        for hashed in hashed_codes:
            if pwd_context.verify(code, hashed):
                # Mark code as used
                await conn.execute(
                    "INSERT INTO used_backup_codes (user_id, code_hash) VALUES ($1, $2)",
                    user_id, code_hash
                )
                return True
        
        return False


async def get_two_factor_status(user_id: str) -> Dict[str, Any]:
    """Get 2FA status for a user."""
    async with db.pool.acquire() as conn:
        record = await conn.fetchrow(
            """
            SELECT is_enabled, enabled_at, created_at
            FROM two_factor_auth
            WHERE user_id = $1
            """,
            user_id
        )
        
        if not record:
            return {"enabled": False}
        
        return {
            "enabled": record["is_enabled"],
            "enabled_at": record["enabled_at"],
            "created_at": record["created_at"],
        }


async def regenerate_backup_codes(user_id: str, password: str) -> Dict[str, Any]:
    """Generate new backup codes for a user."""
    from .auth_utils import verify_password
    
    async with db.pool.acquire() as conn:
        # Verify password
        user = await conn.fetchrow(
            "SELECT hashed_password FROM users WHERE id = $1",
            user_id
        )
        
        if not user:
            raise ValueError("User not found")
        
        if not verify_password(password, user["hashed_password"]):
            raise ValueError("Invalid password")
        
        # Check if 2FA is enabled
        record = await conn.fetchrow(
            "SELECT is_enabled FROM two_factor_auth WHERE user_id = $1",
            user_id
        )
        
        if not record or not record["is_enabled"]:
            raise ValueError("2FA is not enabled")
        
        # Generate new backup codes
        plain_codes, hashed_codes = generate_backup_codes(10)
        
        # Clear used backup codes
        await conn.execute(
            "DELETE FROM used_backup_codes WHERE user_id = $1",
            user_id
        )
        
        # Update backup codes
        await conn.execute(
            "UPDATE two_factor_auth SET backup_codes_hash = $1 WHERE user_id = $2",
            json.dumps(hashed_codes), user_id
        )
        
        return {
            "backup_codes": plain_codes,  # Show only once
        }


async def create_temp_token(user_id: str) -> str:
    """Create temporary token during 2FA login flow."""
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    async with db.pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO two_factor_temp_tokens (token, user_id, expires_at)
            VALUES ($1, $2, $3)
            """,
            token, user_id, expires
        )
    
    return token


async def verify_temp_token(token: str) -> Optional[str]:
    """Verify temporary token and return user_id if valid."""
    async with db.pool.acquire() as conn:
        record = await conn.fetchrow(
            """
            SELECT user_id FROM two_factor_temp_tokens
            WHERE token = $1 AND used = FALSE AND expires_at > NOW()
            """,
            token
        )
        
        if not record:
            return None
        
        # Mark as used
        await conn.execute(
            "UPDATE two_factor_temp_tokens SET used = TRUE WHERE token = $1",
            token
        )
        
        return record["user_id"]


async def is_two_factor_enabled(user_id: str) -> bool:
    """Check if 2FA is enabled for a user."""
    async with db.pool.acquire() as conn:
        record = await conn.fetchrow(
            "SELECT is_enabled FROM two_factor_auth WHERE user_id = $1",
            user_id
        )
        return record["is_enabled"] if record else False
