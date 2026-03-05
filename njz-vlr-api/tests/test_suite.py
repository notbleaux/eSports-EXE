"""
Automated Testing Suite
pytest with VCR.py for HTTP mocking
"""

import pytest
from pathlib import Path
import vcr

# Configure VCR for recording/replaying HTTP interactions
my_vcr = vcr.VCR(
    cassette_library_dir='tests/fixtures/cassettes',
    record_mode='once',  # Record once, then replay
    match_on=['uri', 'method'],
    filter_headers=['Authorization', 'Cookie'],
    filter_post_data_parameters=['api_key', 'password'],
)


# Fixtures
@pytest.fixture
def sample_match_html():
    """Sample HTML for match listing"""
    return """
    <html>
        <body>
            <a class="match-item" href="/12345/test-match">
                <div class="match-item-vs-team-name">Team A</div>
                <div class="match-item-vs-team-name">Team B</div>
                <div class="match-item-event">VCT Test</div>
            </a>
        </body>
    </html>
    """


@pytest.fixture
def sample_player_stats():
    """Sample player statistics"""
    return {
        "player": "TenZ",
        "team": "Sentinels",
        "agent": "Jett",
        "rating": "1.25",
        "acs": "275.5",
        "kills": "22",
        "deaths": "15",
        "assists": "5",
        "adr": "175.2",
        "kast": "78%",
        "headshot_pct": "32%"
    }


# Unit Tests
class TestCheckSumUtils:
    """Test checksum utilities"""
    
    def test_calculate_sha256(self):
        from utils.checksums import calculate_sha256
        
        result = calculate_sha256("test data")
        assert len(result) == 64  # SHA-256 hex length
        assert result == "d7b55315f9c1552403f2b1b493a6273e8c1c79976c81b8dbfd4a75c6"


class TestCircuitBreaker:
    """Test circuit breaker pattern"""
    
    @pytest.mark.asyncio
    async def test_circuit_opens_after_failures(self):
        from utils.circuit_breaker import CircuitBreaker
        
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=60)
        
        # Record failures
        await cb.record_failure()
        await cb.record_failure()
        opened = await cb.record_failure()  # Third failure opens circuit
        
        assert opened is True
        assert cb.state.name == "OPEN"
        assert cb.can_execute() is False
    
    @pytest.mark.asyncio
    async def test_circuit_closes_after_success(self):
        from utils.circuit_breaker import CircuitBreaker
        
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0)
        
        # Open circuit
        for _ in range(3):
            await cb.record_failure()
        
        # Manually set to half-open (simulating timeout)
        cb._state = type('State', (), {'name': 'HALF_OPEN'})()
        
        # Success should close circuit
        await cb.record_success()
        
        assert cb.can_execute() is True


class TestDOMLearner:
    """Test DOM structure learning"""
    
    def test_extract_selectors(self):
        from utils.dom_anomaly_detector import DOMStructureLearner
        
        html = """
        <html>
            <div class="match-item">Match 1</div>
            <div class="match-item">Match 2</div>
            <div class="player-stats-row">Player</div>
        </html>
        """
        
        learner = DOMStructureLearner(storage_path="/tmp/test_dom")
        selectors = learner.extract_selectors(html, "/matches")
        
        assert "match_cards" in selectors
        assert selectors["match_cards"]["count"] == 2


class TestAPIRateLimit:
    """Test API rate limiting"""
    
    def test_rate_limit_enforcement(self):
        from api.middleware.tier_system import APIKeyManager, APITier
        
        manager = APIKeyManager()
        
        # Register a test key
        manager.register_key("test-key-123", APITier.FREE, "test")
        
        # Use up the rate limit
        for _ in range(30):  # FREE tier: 30 req/min
            allowed, _ = manager.check_rate_limit("test-key-123")
        
        # Next request should be blocked
        allowed, info = manager.check_rate_limit("test-key-123")
        assert allowed is False
        assert "Rate limit exceeded" in info["error"]


# Integration Tests with VCR
@pytest.mark.integration
class TestScraperIntegration:
    """Integration tests with recorded HTTP responses"""
    
    @my_vcr.use_cassette('vlr_upcoming_matches.yml')
    @pytest.mark.asyncio
    async def test_fetch_upcoming_matches(self):
        """Test fetching upcoming matches (recorded)"""
        from scrapers.match_scraper import MatchScraper
        
        async with MatchScraper() as scraper:
            result = await scraper.scrape("/matches", match_type="upcoming")
        
        assert result.data is not None
        assert len(result.data.upcoming) > 0
    
    @my_vcr.use_cassette('vlr_match_details.yml')
    @pytest.mark.asyncio
    async def test_fetch_match_details(self):
        """Test fetching match details (recorded)"""
        from scrapers.match_scraper import MatchDetailsScraper
        
        async with MatchDetailsScraper() as scraper:
            result = await scraper.scrape("/595657", match_id="595657")
        
        assert result.data is not None
        assert result.data.match_id == "595657"


# Performance Tests
@pytest.mark.performance
class TestPerformance:
    """Performance benchmarks"""
    
    @pytest.mark.asyncio
    async def test_scrape_parallel_performance(self):
        """Test parallel scraping performance"""
        import asyncio
        import time
        
        from scrapers.match_scraper import MatchScraper
        
        urls = ["/matches?page=1", "/matches?page=2", "/matches?page=3"]
        
        start = time.time()
        
        async with MatchScraper() as scraper:
            tasks = [scraper.scrape(url, save_raws=False) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        elapsed = time.time() - start
        
        # Should complete 3 requests in under 10 seconds with rate limiting
        assert elapsed < 10


# Conftest.py content (for reference)
CONftest_CONTENT = '''
"""
pytest configuration
"""

import pytest
import asyncio

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_raws_storage(tmp_path):
    """Create temporary RAWS storage for tests"""
    from data.storage.raws_storage import RAWSStorage
    return RAWSStorage(base_path=str(tmp_path))
'''

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])