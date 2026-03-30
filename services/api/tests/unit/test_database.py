"""[Ver001.000]
Tests for database module.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

from src.njz_api.database import get_db_pool, check_database_connection, close_db_pool


class AsyncContextManagerMock:
    """Helper for mocking async context managers."""
    def __init__(self, return_value):
        self.return_value = return_value
    
    async def __aenter__(self):
        return self.return_value
    
    async def __aexit__(self, *args):
        return False


class TestDatabaseConnection:
    """Tests for database connectivity."""
    
    @pytest.mark.asyncio
    async def test_get_db_pool_creates_pool(self):
        """Test that get_db_pool creates a new pool."""
        import src.njz_api.database as db_module
        db_module._pool = None  # Reset
        
        with patch("asyncpg.create_pool") as mock_create:
            mock_pool = MagicMock()
            mock_create.return_value = asyncio.Future()
            mock_create.return_value.set_result(mock_pool)
            
            pool = await get_db_pool()
            
            assert pool == mock_pool
            mock_create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_check_connection_success(self):
        """Test successful connection check."""
        import src.njz_api.database as db_module
        db_module._pool = None  # Reset
        
        with patch("asyncpg.create_pool") as mock_create:
            mock_conn = MagicMock()
            mock_conn.fetchval = AsyncMock(return_value=1)
            
            mock_pool = MagicMock()
            mock_pool.acquire = MagicMock(return_value=AsyncContextManagerMock(mock_conn))
            
            mock_create.return_value = asyncio.Future()
            mock_create.return_value.set_result(mock_pool)
            
            result = await check_database_connection()
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_check_connection_failure(self):
        """Test failed connection check."""
        with patch("src.njz_api.database.get_db_pool") as mock_get:
            mock_get.side_effect = Exception("Connection failed")
            
            result = await check_database_connection()
            
            assert result is False
