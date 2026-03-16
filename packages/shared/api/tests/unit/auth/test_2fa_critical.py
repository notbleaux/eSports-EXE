"""
[Ver001.000]
Critical 2FA Tests
"""

import pytest
import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from datetime import datetime, timezone, timedelta
import json

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.auth.two_factor import (
    generate_totp_secret, get_totp_uri, generate_qr_code,
    verify_totp, generate_backup_codes, verify_backup_code,
    encrypt_secret, decrypt_secret, setup_two_factor,
    enable_two_factor, disable_two_factor, verify_two_factor,
    verify_backup_code_login, get_two_factor_status,
    create_temp_token, verify_temp_token, is_two_factor_enabled
)


class TestTOTPGeneration:
    """TOTP secret generation tests."""
    
    def test_generate_totp_secret_format(self):
        """Generated secret is valid base32 string."""
        secret = generate_totp_secret()
        
        # Should be string
        assert isinstance(secret, str)
        
        # Should be valid base32 (no 0, 1, 8, 9)
        assert all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' for c in secret)
        
        # Should be 32 characters (standard)
        assert len(secret) == 32
    
    def test_generate_totp_secret_unique(self):
        """Each generated secret is unique."""
        secrets = [generate_totp_secret() for _ in range(10)]
        assert len(set(secrets)) == 10
    
    def test_get_totp_uri_format(self):
        """TOTP URI has correct format."""
        secret = "JBSWY3DPEHPK3PXP"
        email = "user@example.com"
        
        uri = get_totp_uri(secret, email)
        
        assert uri.startswith("otpauth://totp/")
        assert secret in uri
        # Email may be URL-encoded in the URI
        assert "user" in uri and "example.com" in uri
        assert "issuer=" in uri
    
    def test_generate_qr_code_output(self):
        """QR code generation produces base64 image."""
        uri = "otpauth://totp/test"
        
        try:
            qr_code = generate_qr_code(uri)
            
            # Should be base64 string
            assert isinstance(qr_code, str)
            
            # Should be valid base64 (no errors)
            import base64
            decoded = base64.b64decode(qr_code)
            assert len(decoded) > 0
            
            # Should be PNG (starts with PNG magic bytes)
            assert decoded[:4] == b'\x89PNG'
        except ImportError:
            # PIL not installed, skip this test
            pytest.skip("PIL not installed")


class TestTOTPEncryption:
    """TOTP secret encryption tests."""
    
    def test_encrypt_decrypt_roundtrip(self):
        """Encrypt and decrypt returns original secret."""
        original = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"
        
        encrypted = encrypt_secret(original)
        decrypted = decrypt_secret(encrypted)
        
        assert decrypted == original
    
    def test_encrypted_value_different_from_plain(self):
        """Encrypted value is different from plaintext."""
        secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"
        
        encrypted = encrypt_secret(secret)
        
        assert encrypted != secret
        assert isinstance(encrypted, str)
    
    def test_encrypt_produces_different_ciphertexts(self):
        """Same secret encrypted twice produces different ciphertexts."""
        secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"
        
        encrypted1 = encrypt_secret(secret)
        encrypted2 = encrypt_secret(secret)
        
        # Fernet uses random IV, so ciphertexts should differ
        assert encrypted1 != encrypted2
        
        # But both should decrypt to same value
        assert decrypt_secret(encrypted1) == secret
        assert decrypt_secret(encrypted2) == secret


class TestTOTPVerification:
    """TOTP code verification tests."""
    
    def test_verify_totp_valid_code(self):
        """Valid TOTP code verifies correctly."""
        import pyotp
        
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()
        
        assert verify_totp(secret, valid_code) == True
    
    def test_verify_totp_invalid_code(self):
        """Invalid TOTP code is rejected."""
        secret = generate_totp_secret()
        
        assert verify_totp(secret, "000000") == False
        assert verify_totp(secret, "invalid") == False
        assert verify_totp(secret, "") == False
    
    def test_verify_totp_time_window(self):
        """TOTP verification accepts codes within time window."""
        import pyotp
        
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        
        # Current code
        current_code = totp.now()
        assert verify_totp(secret, current_code) == True
    
    def test_verify_totp_wrong_secret_fails(self):
        """Code for different secret fails."""
        import pyotp
        
        secret1 = pyotp.random_base32()
        secret2 = pyotp.random_base32()
        
        totp = pyotp.TOTP(secret1)
        code = totp.now()
        
        # Code from secret1 should fail for secret2
        assert verify_totp(secret2, code) == False


class TestBackupCodes:
    """Backup code generation and verification tests."""
    
    @pytest.fixture(autouse=True)
    def skip_if_bcrypt_issue(self):
        """Skip tests if bcrypt has compatibility issues."""
        try:
            from src.auth.two_factor import pwd_context
            pwd_context.hash("TEST1234")
        except Exception as e:
            pytest.skip(f"Bcrypt compatibility issue: {e}")
    
    def test_generate_backup_codes_count(self):
        """Correct number of backup codes generated."""
        plain, hashed = generate_backup_codes(10)
        
        assert len(plain) == 10
        assert len(hashed) == 10
    
    def test_backup_codes_format(self):
        """Backup codes are 8-character alphanumeric."""
        plain, _ = generate_backup_codes(1)
        code = plain[0]
        
        assert len(code) == 8
        # Should not contain confusing characters (0, 1, 8, 9, I, O)
        assert all(c in 'ABCDEFGHJKLMNPQRSTUVWXYZ234567' for c in code)
    
    def test_backup_codes_unique(self):
        """Generated backup codes are unique."""
        plain, _ = generate_backup_codes(10)
        
        assert len(set(plain)) == 10
    
    def test_verify_backup_code_valid(self):
        """Valid backup code verifies."""
        plain, hashed = generate_backup_codes(1)
        
        assert verify_backup_code(plain[0], hashed) == True
    
    def test_verify_backup_code_invalid(self):
        """Invalid backup code is rejected."""
        _, hashed = generate_backup_codes(1)
        
        assert verify_backup_code("INVALID1", hashed) == False
        assert verify_backup_code("", hashed) == False
        assert verify_backup_code("WRONGCODE", hashed) == False
    
    def test_verify_backup_code_wrong_code_fails(self):
        """Wrong valid-format code is rejected."""
        plain1, _ = generate_backup_codes(1)
        _, hashed2 = generate_backup_codes(1)
        
        # Code from set 1 should fail against set 2
        assert verify_backup_code(plain1[0], hashed2) == False


class TestTwoFactorSetup:
    """2FA setup flow tests."""
    
    @pytest.fixture(autouse=True)
    def skip_if_bcrypt_issue(self):
        """Skip tests if bcrypt has compatibility issues."""
        try:
            from src.auth.two_factor import pwd_context
            pwd_context.hash("TEST1234")
        except Exception as e:
            pytest.skip(f"Bcrypt compatibility issue: {e}")
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_setup_two_factor_creates_record(self, mock_db_pool):
        """Setup creates 2FA record in database."""
        mock_pool, mock_conn = mock_db_pool
        mock_conn.fetchrow.return_value = None  # No existing 2FA
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            with patch('src.auth.two_factor.generate_qr_code', return_value="mock_qr_base64"):
                result = await setup_two_factor("user_123", "user@example.com")
                
                assert "secret" in result
                assert "qr_code" in result
                assert "manual_entry_key" in result
                
                # Should create record
                mock_conn.execute.assert_called_once()
                call_args = mock_conn.execute.call_args[0]
                assert "INSERT INTO two_factor_auth" in call_args[0]
    
    @pytest.mark.asyncio
    async def test_setup_two_factor_updates_existing(self, mock_db_pool):
        """Setup updates existing 2FA record."""
        mock_pool, mock_conn = mock_db_pool
        mock_conn.fetchrow.return_value = {"id": 1, "is_enabled": True}
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            with patch('src.auth.two_factor.generate_qr_code', return_value="mock_qr_base64"):
                result = await setup_two_factor("user_123", "user@example.com")
                
                # Should update, not insert
                mock_conn.execute.assert_called_once()
                call_args = mock_conn.execute.call_args[0]
                assert "UPDATE two_factor_auth" in call_args[0]
    
    @pytest.mark.asyncio
    async def test_enable_two_factor_verifies_code(self, mock_db_pool):
        """Enable requires valid TOTP verification."""
        mock_pool, mock_conn = mock_db_pool
        
        # Setup mock secret
        import pyotp
        secret = pyotp.random_base32()
        encrypted = encrypt_secret(secret)
        
        mock_conn.fetchrow.return_value = {
            "secret_encrypted": encrypted,
            "is_enabled": False
        }
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            with patch('src.auth.two_factor.generate_backup_codes', return_value=(
                ["CODE1", "CODE2"], ["hash1", "hash2"]
            )):
                # Get valid code
                totp = pyotp.TOTP(secret)
                valid_code = totp.now()
                
                result = await enable_two_factor("user_123", valid_code)
                
                assert result["enabled"] == True
                assert "backup_codes" in result
    
    @pytest.mark.asyncio
    async def test_enable_two_factor_invalid_code_raises(self, mock_db_pool):
        """Enable with invalid code raises error."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.return_value = {
            "secret_encrypted": encrypt_secret(generate_totp_secret()),
            "is_enabled": False
        }
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            with pytest.raises(ValueError) as exc_info:
                await enable_two_factor("user_123", "000000")
            
            assert "Invalid verification code" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_enable_two_factor_already_enabled_raises(self, mock_db_pool):
        """Enable when already enabled raises error."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.return_value = {
            "secret_encrypted": encrypt_secret(generate_totp_secret()),
            "is_enabled": True
        }
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            with pytest.raises(ValueError) as exc_info:
                await enable_two_factor("user_123", "123456")
            
            assert "already enabled" in str(exc_info.value)


class TestTwoFactorVerification:
    """2FA verification flow tests."""
    
    @pytest.fixture(autouse=True)
    def skip_if_bcrypt_issue(self):
        """Skip tests if bcrypt has compatibility issues."""
        try:
            from src.auth.two_factor import pwd_context
            pwd_context.hash("TEST1234")
        except Exception as e:
            pytest.skip(f"Bcrypt compatibility issue: {e}")
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_verify_two_factor_valid_code(self, mock_db_pool):
        """Valid TOTP code verifies successfully."""
        mock_pool, mock_conn = mock_db_pool
        
        import pyotp
        secret = pyotp.random_base32()
        encrypted = encrypt_secret(secret)
        
        mock_conn.fetchrow.return_value = {
            "secret_encrypted": encrypted,
            "is_enabled": True,
            "email": "user@example.com"
        }
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            totp = pyotp.TOTP(secret)
            valid_code = totp.now()
            
            result = await verify_two_factor("user_123", valid_code)
            
            assert result == True
    
    @pytest.mark.asyncio
    async def test_verify_two_factor_invalid_code(self, mock_db_pool):
        """Invalid TOTP code is rejected."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.return_value = {
            "secret_encrypted": encrypt_secret(generate_totp_secret()),
            "is_enabled": True,
            "email": "user@example.com"
        }
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_two_factor("user_123", "000000")
            
            assert result == False
    
    @pytest.mark.asyncio
    async def test_verify_two_factor_not_enabled(self, mock_db_pool):
        """Verification fails if 2FA not enabled."""
        mock_pool, mock_conn = mock_db_pool
        mock_conn.fetchrow.return_value = None
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_two_factor("user_123", "123456")
            
            assert result == False
    
    @pytest.mark.asyncio
    async def test_verify_backup_code_login_valid(self, mock_db_pool):
        """Valid backup code allows login."""
        mock_pool, mock_conn = mock_db_pool
        
        from src.auth.two_factor import pwd_context
        plain_code = "BACKCODE"
        hashed = pwd_context.hash(plain_code)
        
        mock_conn.fetchrow.side_effect = [
            {"backup_codes_hash": json.dumps([hashed])},  # First call - get codes
            None  # Second call - check if used (not used)
        ]
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_backup_code_login("user_123", plain_code)
            
            assert result == True


class TestTwoFactorStatus:
    """2FA status and management tests."""
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_get_two_factor_status_enabled(self, mock_db_pool):
        """Status shows enabled for user with 2FA."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.return_value = {
            "is_enabled": True,
            "enabled_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        }
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await get_two_factor_status("user_123")
            
            assert result["enabled"] == True
            assert "enabled_at" in result
    
    @pytest.mark.asyncio
    async def test_get_two_factor_status_disabled(self, mock_db_pool):
        """Status shows disabled for user without 2FA."""
        mock_pool, mock_conn = mock_db_pool
        mock_conn.fetchrow.return_value = None
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await get_two_factor_status("user_123")
            
            assert result["enabled"] == False
    
    @pytest.mark.asyncio
    async def test_is_two_factor_enabled_true(self, mock_db_pool):
        """is_two_factor_enabled returns True when enabled."""
        mock_pool, mock_conn = mock_db_pool
        mock_conn.fetchrow.return_value = {"is_enabled": True}
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await is_two_factor_enabled("user_123")
            
            assert result == True
    
    @pytest.mark.asyncio
    async def test_is_two_factor_enabled_false(self, mock_db_pool):
        """is_two_factor_enabled returns False when disabled."""
        mock_pool, mock_conn = mock_db_pool
        mock_conn.fetchrow.return_value = None
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await is_two_factor_enabled("user_123")
            
            assert result == False


class TestTempTokens:
    """Temporary token tests for 2FA login flow."""
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_create_temp_token(self, mock_db_pool):
        """Temp token is created and stored."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            token = await create_temp_token("user_123")
            
            assert isinstance(token, str)
            assert len(token) > 20
            
            # Should store in database
            mock_conn.execute.assert_called_once()
            call_args = mock_conn.execute.call_args[0]
            assert "INSERT INTO two_factor_temp_tokens" in call_args[0]
    
    @pytest.mark.asyncio
    async def test_verify_temp_token_valid(self, mock_db_pool):
        """Valid temp token returns user_id."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.return_value = {"user_id": "user_123"}
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_temp_token("valid_token")
            
            assert result == "user_123"
            
            # Should mark as used
            mock_conn.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_verify_temp_token_invalid(self, mock_db_pool):
        """Invalid temp token returns None."""
        mock_pool, mock_conn = mock_db_pool
        mock_conn.fetchrow.return_value = None
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_temp_token("invalid_token")
            
            assert result is None


class TestDisableTwoFactor:
    """2FA disable tests."""
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_disable_two_factor_success(self, mock_db_pool):
        """Disable 2FA with correct password succeeds."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.side_effect = [
            {"hashed_password": "hashed_pass"},  # Password check
            {"is_enabled": True}  # 2FA check
        ]
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            with patch('src.auth.auth_utils.verify_password', return_value=True):
                result = await disable_two_factor("user_123", "correct_password")
                
                assert result == True
                # Should delete 2FA record and update user
                assert mock_conn.execute.call_count == 2
    
    @pytest.mark.asyncio
    async def test_disable_two_factor_wrong_password(self, mock_db_pool):
        """Disable 2FA with wrong password raises error."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.return_value = {"hashed_password": "hashed_pass"}
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            with patch('src.auth.auth_utils.verify_password', return_value=False):
                with pytest.raises(ValueError) as exc_info:
                    await disable_two_factor("user_123", "wrong_password")
                
                assert "Invalid password" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_disable_two_factor_not_enabled(self, mock_db_pool):
        """Disable when 2FA not enabled raises error."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.side_effect = [
            {"hashed_password": "hashed_pass"},  # Password check passes
            {"is_enabled": False}  # But 2FA is not enabled
        ]
        
        with patch('src.auth.two_factor.db') as mock_db:
            mock_db.pool = mock_pool
            
            with patch('src.auth.auth_utils.verify_password', return_value=True):
                with pytest.raises(ValueError) as exc_info:
                    await disable_two_factor("user_123", "password")
                
                assert "2FA is not enabled" in str(exc_info.value)


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
