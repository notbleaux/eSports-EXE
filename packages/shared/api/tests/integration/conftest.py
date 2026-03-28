"""
[Ver001.000]
Integration Test Configuration and Fixtures

Shared fixtures for API integration tests.
"""

import base64
import hashlib
import io
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, Tuple
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
import pytest_asyncio

# Add the project root to sys.path
_REPO_ROOT = Path(__file__).parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))


@pytest_asyncio.fixture
async def temp_storage(tmp_path):
    """Create a temporary storage backend for testing."""
    from src.njz_api.archival.storage.backend import LocalBackend
    
    storage_path = tmp_path / "archive_storage"
    storage_path.mkdir(parents=True)
    
    backend = LocalBackend(base_path=str(storage_path))
    yield backend
    
    # Cleanup happens automatically via tmp_path


@pytest.fixture
def test_jwt_secret():
    """Get or set JWT secret for testing."""
    secret = os.environ.get("JWT_SECRET_KEY", "test-secret-key-for-testing-only")
    os.environ["JWT_SECRET_KEY"] = secret
    return secret


@pytest.fixture
def admin_token(test_jwt_secret) -> str:
    """Generate admin JWT token."""
    try:
        import jwt
        payload = {
            "sub": str(uuid4()),
            "username": "test_admin",
            "email": "admin@test.com",
            "permissions": ["admin"],
            "exp": int(datetime.utcnow().timestamp()) + 3600,
            "iat": int(datetime.utcnow().timestamp()),
        }
        return jwt.encode(payload, test_jwt_secret, algorithm="HS256")
    except ImportError:
        # Return a mock token if PyJWT not available
        return "mock_admin_token"


@pytest.fixture
def service_token(test_jwt_secret) -> str:
    """Generate service principal JWT token."""
    try:
        import jwt
        payload = {
            "sub": str(uuid4()),
            "username": "extractor_service",
            "email": "service@test.com",
            "permissions": ["service"],
            "exp": int(datetime.utcnow().timestamp()) + 3600,
            "iat": int(datetime.utcnow().timestamp()),
        }
        return jwt.encode(payload, test_jwt_secret, algorithm="HS256")
    except ImportError:
        return "mock_service_token"


@pytest.fixture
def admin_headers(admin_token) -> dict:
    """Admin auth headers."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def service_headers(service_token) -> dict:
    """Service principal auth headers."""
    return {"Authorization": f"Bearer {service_token}"}


def create_test_jpeg_bytes(index: int = 0, size: Tuple[int, int] = (100, 100)) -> bytes:
    """Create test JPEG bytes with unique color based on index."""
    try:
        from PIL import Image
        
        # Create image with unique color
        color = ((index * 10) % 255, (index * 20) % 255, (index * 30) % 255)
        img = Image.new("RGB", size, color=color)
        
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue()
    except ImportError:
        # Fallback: create minimal JPEG-like bytes
        # This is a minimal valid JPEG structure
        jpeg_header = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        jpeg_data = jpeg_header + f"frame{index:04d}".encode() * 100
        jpeg_footer = b"\xff\xd9"
        return jpeg_data + jpeg_footer


def compute_content_hash(data: bytes) -> str:
    """Compute SHA-256 hash of data."""
    return hashlib.sha256(data).hexdigest().lower()


def create_test_frame_payload(
    index: int = 0,
    match_id: str = None,
    segment_type: str = "IN_ROUND",
) -> dict:
    """Create a test frame payload for upload."""
    jpeg_bytes = create_test_jpeg_bytes(index)
    content_hash = compute_content_hash(jpeg_bytes)
    
    return {
        "frame_index": index,
        "timestamp_ms": index * 1000,
        "segment_type": segment_type,
        "content_hash": content_hash,
        "accuracy_tier": "STANDARD",
        "jpeg_data": base64.b64encode(jpeg_bytes).decode("utf-8"),
        "jpeg_size_bytes": len(jpeg_bytes),
    }


def create_batch_frame_payload(
    count: int,
    match_id: str = None,
    extraction_job_id: str = None,
    segment_type: str = "IN_ROUND",
) -> dict:
    """Create a batch frame upload payload."""
    if match_id is None:
        match_id = str(uuid4())
    if extraction_job_id is None:
        extraction_job_id = str(uuid4())
    
    frames = [
        create_test_frame_payload(i, match_id, segment_type)
        for i in range(count)
    ]
    
    return {
        "frames": frames,
        "extraction_job_id": extraction_job_id,
        "match_id": match_id,
    }


@pytest_asyncio.fixture
async def mock_db_pool():
    """Create a mock database pool for integration testing."""
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock()
    mock_conn.fetch = AsyncMock(return_value=[])
    mock_conn.fetchrow = AsyncMock(return_value=None)
    mock_conn.fetchval = AsyncMock(return_value=1)
    
    mock_pool = AsyncMock()
    mock_pool.acquire = MagicMock()
    mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
    
    return mock_pool, mock_conn


@pytest_asyncio.fixture
async def archival_service(temp_storage, mock_db_pool):
    """Create an archival service with temporary storage and mocked DB."""
    from src.njz_api.archival.services.archival_service import ArchivalService
    
    mock_pool, mock_conn = mock_db_pool
    service = ArchivalService(temp_storage, mock_pool)
    return service, mock_pool, mock_conn


@pytest.fixture(autouse=True)
def setup_test_env():
    """Set up test environment variables."""
    # Store original values
    original_env = {}
    env_vars = [
        "DATABASE_URL",
        "JWT_SECRET_KEY",
        "ARCHIVE_DATA_DIR",
        "REDIS_URL",
    ]
    
    for var in env_vars:
        original_env[var] = os.environ.get(var)
    
    # Set test values
    os.environ["JWT_SECRET_KEY"] = os.environ.get(
        "JWT_SECRET_KEY", "test-secret-key-for-testing-only"
    )
    
    yield
    
    # Restore original values
    for var, value in original_env.items():
        if value is None:
            os.environ.pop(var, None)
        else:
            os.environ[var] = value
