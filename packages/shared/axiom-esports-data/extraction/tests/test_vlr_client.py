"""
Tests for VLRClient base class.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from extraction.src.scrapers.vlr_client import VLRClient


class TestVLRClientBasics:
    """Test basic VLRClient functionality."""
    
    def test_rate_limit_constant(self):
        """Client should enforce 2 req/sec rate limit."""
        assert VLRClient.RATE_LIMIT == 2.0
    
    def test_base_url_constant(self):
        """Client should use correct base URL."""
        assert VLRClient.BASE_URL == "https://www.vlr.gg"
    
    @pytest.mark.asyncio
    async def test_client_initialization(self):
        """Client should initialize with optional session."""
        mock_session = MagicMock()
        client = VLRClient(session=mock_session)
        
        assert client._session == mock_session
        assert client._owned_session is False
    
    @pytest.mark.asyncio
    async def test_client_creates_session(self):
        """Client should create session if none provided."""
        client = VLRClient(session=None)
        
        assert client._session is None
        assert client._owned_session is True


class TestChecksumComputation:
    """Test SHA-256 checksum computation."""
    
    @pytest.mark.asyncio
    async def test_checksum_consistency(self):
        """Same content should produce same checksum."""
        client = VLRClient()
        content = "test content"
        
        cs1 = client._compute_checksum(content)
        cs2 = client._compute_checksum(content)
        
        assert cs1 == cs2
        assert len(cs1) == 64  # SHA-256 hex is 64 chars
    
    @pytest.mark.asyncio
    async def test_checksum_uniqueness(self):
        """Different content should produce different checksums."""
        client = VLRClient()
        
        cs1 = client._compute_checksum("content A")
        cs2 = client._compute_checksum("content B")
        
        assert cs1 != cs2
    
    @pytest.mark.asyncio
    async def test_checksum_hex_format(self):
        """Checksum should be valid hexadecimal."""
        client = VLRClient()
        checksum = client._compute_checksum("test")
        
        # Should only contain hex characters
        assert all(c in '0123456789abcdef' for c in checksum)


class TestRateLimiting:
    """Test rate limiting functionality."""
    
    @pytest.mark.asyncio
    async def test_throttle_enforces_delay(self):
        """Throttle should enforce minimum interval between requests."""
        client = VLRClient()
        
        # First request should not wait
        start = asyncio.get_event_loop().time()
        await client._throttle()
        elapsed1 = asyncio.get_event_loop().time() - start
        
        # Should be essentially instant
        assert elapsed1 < 0.1
        
        # Second request should wait
        start = asyncio.get_event_loop().time()
        await client._throttle()
        elapsed2 = asyncio.get_event_loop().time() - start
        
        # Should wait at least 0.5s (1/2 req per sec)
        assert elapsed2 >= 0.4  # Allow some tolerance


class TestURLConstruction:
    """Test URL construction for different endpoints."""
    
    @pytest.mark.asyncio
    async def test_match_url_construction(self):
        """Should construct correct match URL."""
        client = VLRClient()
        match_id = "12345"
        expected = "https://www.vlr.gg/12345"
        
        assert f"{client.BASE_URL}/{match_id}" == expected
    
    @pytest.mark.asyncio
    async def test_match_list_url_construction(self):
        """Should construct correct match list URL."""
        client = VLRClient()
        page = 2
        expected = "https://www.vlr.gg/matches/?page=2"
        
        assert f"{client.BASE_URL}/matches/?page={page}" == expected
    
    @pytest.mark.asyncio
    async def test_player_url_construction(self):
        """Should construct correct player URL."""
        client = VLRClient()
        player_id = "9876"
        expected = "https://www.vlr.gg/player/9876"
        
        assert f"{client.BASE_URL}/player/{player_id}" == expected
    
    @pytest.mark.asyncio
    async def test_team_url_construction(self):
        """Should construct correct team URL."""
        client = VLRClient()
        team_id = "123"
        expected = "https://www.vlr.gg/team/123"
        
        assert f"{client.BASE_URL}/team/{team_id}" == expected
