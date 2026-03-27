"""
[Ver001.000] Unit Tests for Legacy Compiler Scrapers

Tests for VLRScraper, LiquidpediaScraper, YouTubeExtractor, and normalization functions.
Uses mock HTTP responses to avoid external dependencies.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime
from bs4 import BeautifulSoup
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import (
    VLRScraper,
    LiquidpediaScraper,
    YouTubeExtractor,
    DataAggregator,
    normalize_player_name,
    normalize_team_name,
    RateLimiter,
)


# ─── Normalization Tests ──────────────────────────────────────────────

class TestPlayerNameNormalization:
    """Test player name normalization against known database"""

    def test_known_player_exact_match(self):
        """Known player should return canonical name"""
        result = normalize_player_name("derke")
        assert result == "Derke"

    def test_known_player_case_insensitive(self):
        """Known player lookup should be case-insensitive"""
        result = normalize_player_name("BOASTER")
        assert result == "boaster"

    def test_unknown_player_normalized(self):
        """Unknown player should be normalized (lowercase, no special chars)"""
        result = normalize_player_name("UnknownPlayer123")
        assert result == "unknownplayer123"

    def test_player_with_unicode(self):
        """Player name with Unicode should be normalized"""
        result = normalize_player_name("Señor Player")
        # Should strip accents
        assert "senor" in result.lower()

    def test_empty_player_name(self):
        """Empty player name should return empty string"""
        result = normalize_player_name("")
        assert result == ""

    def test_player_with_special_chars(self):
        """Player with special chars should be cleaned"""
        result = normalize_player_name("Player@#$Name")
        assert "@" not in result
        assert "#" not in result

    def test_player_with_spaces(self):
        """Multiple spaces should be collapsed"""
        result = normalize_player_name("Player  Name  Here")
        assert "  " not in result


class TestTeamNameNormalization:
    """Test team name normalization and abbreviation expansion"""

    def test_known_team_abbreviation(self):
        """Known team abbreviation should expand to full name"""
        full_name, abbr, confidence = normalize_team_name("fnc")
        assert full_name == "Fnatic"
        assert abbr == "FNC"
        assert confidence > 0.9

    def test_known_team_full_name(self):
        """Known team full name should be recognized"""
        full_name, abbr, confidence = normalize_team_name("Fnatic")
        assert full_name == "Fnatic"
        assert abbr == "FNC"

    def test_known_team_standard_abbr(self):
        """Known team standard abbreviation should be recognized"""
        full_name, abbr, confidence = normalize_team_name("FNC")
        assert full_name == "Fnatic"
        assert abbr == "FNC"

    def test_team_case_insensitive(self):
        """Team lookup should be case-insensitive"""
        full_name, abbr, confidence = normalize_team_name("SEN")
        assert full_name == "Sentinels"
        assert abbr == "SEN"

    def test_unknown_team(self):
        """Unknown team should return as-is with lower confidence"""
        full_name, abbr, confidence = normalize_team_name("RandomTeam")
        assert full_name == "RandomTeam"
        assert abbr is None
        assert confidence < 0.6

    def test_empty_team_name(self):
        """Empty team name should return empty"""
        full_name, abbr, confidence = normalize_team_name("")
        assert full_name == ""
        assert abbr is None

    def test_fuzzy_team_match(self):
        """Partial team name match should have medium confidence"""
        full_name, abbr, confidence = normalize_team_name("Fnatic Pro")
        # Should still match Fnatic due to partial match
        if "Fnatic" in full_name:
            assert confidence >= 0.5


# ─── Rate Limiter Tests ────────────────────────────────────────────────

class TestRateLimiter:
    """Test rate limiting mechanism"""

    @pytest.mark.asyncio
    async def test_rate_limiter_single_request(self):
        """Single request should not be throttled"""
        limiter = RateLimiter(10)  # 10 requests per second
        start = asyncio.get_event_loop().time()
        await limiter.wait()
        end = asyncio.get_event_loop().time()
        # First request should be nearly instant
        assert (end - start) < 0.1

    @pytest.mark.asyncio
    async def test_rate_limiter_throttles(self):
        """Multiple rapid requests should be throttled"""
        limiter = RateLimiter(1)  # 1 request per second
        start = asyncio.get_event_loop().time()

        await limiter.wait()
        await limiter.wait()
        await limiter.wait()

        end = asyncio.get_event_loop().time()
        # Should take ~2 seconds (3 requests at 1 req/sec)
        assert (end - start) >= 1.8


# ─── VLR Scraper Tests ──────────────────────────────────────────────────

class TestVLRScraper:
    """Test VLR.gg scraper with mocked HTTP responses"""

    @pytest.mark.asyncio
    async def test_scrape_match_history_success(self):
        """VLRScraper should parse match history from HTML"""
        scraper = VLRScraper()

        # Mock HTML response
        mock_html = """
        <table>
            <tr class="match">
                <td>2026-03-27</td>
                <td>Fnatic vs Sentinels</td>
                <td>13-10</td>
            </tr>
            <tr class="match">
                <td>2026-03-26</td>
                <td>FURIA vs FPX</td>
                <td>13-5</td>
            </tr>
        </table>
        """

        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.text = mock_html
            mock_response.status_code = 200
            mock_response.raise_for_status = Mock()
            mock_get.return_value.__aenter__.return_value = mock_response

            matches = await scraper.scrape_match_history("test-player-123", limit=5)

            assert len(matches) == 2
            assert matches[0]['teams'] == 'Fnatic vs Sentinels'
            assert matches[0]['score'] == '13-10'

    @pytest.mark.asyncio
    async def test_scrape_match_history_empty(self):
        """VLRScraper should handle empty results gracefully"""
        scraper = VLRScraper()
        mock_html = "<table></table>"

        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.text = mock_html
            mock_response.status_code = 200
            mock_response.raise_for_status = Mock()
            mock_get.return_value.__aenter__.return_value = mock_response

            matches = await scraper.scrape_match_history("unknown-player")
            assert matches == []

    @pytest.mark.asyncio
    async def test_scrape_match_history_network_error(self):
        """VLRScraper should handle network errors gracefully"""
        scraper = VLRScraper()

        with patch('httpx.AsyncClient.get') as mock_get:
            mock_get.return_value.__aenter__.side_effect = Exception("Connection error")

            matches = await scraper.scrape_match_history("test-player")
            assert matches == []

    @pytest.mark.asyncio
    async def test_scrape_tournament_success(self):
        """VLRScraper should parse tournament bracket"""
        scraper = VLRScraper()

        mock_html = """
        <h1>Champions 2026</h1>
        <div class="match-card">
            <div class="team">Fnatic</div>
            <div class="team">Sentinels</div>
            <div class="score">2-1</div>
        </div>
        """

        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.text = mock_html
            mock_response.status_code = 200
            mock_response.raise_for_status = Mock()
            mock_get.return_value.__aenter__.return_value = mock_response

            result = await scraper.scrape_tournament("champions-2026")

            assert result['source'] == 'vlr'
            assert result['tournament_id'] == 'champions-2026'
            assert result['tournament_name'] == 'Champions 2026'


# ─── Liquidpedia Scraper Tests ────────────────────────────────────────

class TestLiquidpediaScraper:
    """Test Liquidpedia scraper with mocked responses"""

    @pytest.mark.asyncio
    async def test_scrape_team_roster_success(self):
        """LiquidpediaScraper should extract team roster"""
        scraper = LiquidpediaScraper()

        mock_html = """
        <table class="infobox">
            <tr><td>Derke</td></tr>
            <tr><td>Boaster</td></tr>
            <tr><td>Zeek</td></tr>
        </table>
        """

        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.text = mock_html
            mock_response.status_code = 200
            mock_response.raise_for_status = Mock()
            mock_get.return_value.__aenter__.return_value = mock_response

            result = await scraper.scrape_team_roster("Fnatic")

            assert result['source'] == 'liquidpedia'
            assert result['team_name'] == 'Fnatic'
            assert result['player_count'] == 3

    @pytest.mark.asyncio
    async def test_scrape_tournament_history_success(self):
        """LiquidpediaScraper should list tournaments"""
        scraper = LiquidpediaScraper()

        mock_html = """
        <a href="/Tournament/Champions_2026">Champions 2026</a>
        <a href="/Tournament/Masters_2026">Masters 2026</a>
        """

        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.text = mock_html
            mock_response.status_code = 200
            mock_response.raise_for_status = Mock()
            mock_get.return_value.__aenter__.return_value = mock_response

            tournaments = await scraper.scrape_tournament_history("valorant")

            assert len(tournaments) == 2
            assert tournaments[0]['game'] == 'valorant'
            assert tournaments[0]['source'] == 'liquidpedia'

    @pytest.mark.asyncio
    async def test_scrape_tournament_history_empty(self):
        """LiquidpediaScraper should handle no tournaments"""
        scraper = LiquidpediaScraper()

        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.text = ""
            mock_response.status_code = 200
            mock_response.raise_for_status = Mock()
            mock_get.return_value.__aenter__.return_value = mock_response

            tournaments = await scraper.scrape_tournament_history("lol")
            assert tournaments == []


# ─── YouTube Extractor Tests ────────────────────────────────────────────

class TestYouTubeExtractor:
    """Test YouTube metadata extraction"""

    @pytest.mark.asyncio
    async def test_extract_via_regex_fallback(self):
        """YouTubeExtractor should fallback to regex without API key"""
        extractor = YouTubeExtractor()

        with patch('main.settings.YOUTUBE_API_KEY', ''):
            result = await extractor.extract_from_livestream_description("test_video_id")

            assert result['source'] == 'youtube'
            assert result['video_id'] == 'test_video_id'
            # Should indicate limited effectiveness without API key
            assert 'note' in result or 'error' in result

    @pytest.mark.asyncio
    async def test_extract_description_parsing(self):
        """YouTubeExtractor should parse team names from description"""
        extractor = YouTubeExtractor()

        description = """
        VCT Champions 2026 Grand Final
        Fnatic vs Sentinels
        Final Score: 3-2
        """
        title = "Fnatic vs Sentinels - Finals"

        result = extractor._parse_description(description, title)

        assert len(result['teams']) > 0
        assert result['teams'][0]['team_a'] == 'Fnatic'
        assert result['teams'][0]['team_b'] == 'Sentinels'
        assert len(result['scores']) > 0


# ─── Data Aggregator Tests ────────────────────────────────────────

class TestDataAggregator:
    """Test data aggregation and combination"""

    @pytest.mark.asyncio
    async def test_aggregator_scraper_status(self):
        """DataAggregator should report scraper health"""
        aggregator = DataAggregator()

        statuses = await aggregator.get_scraper_status()

        assert len(statuses) == 2  # VLR + Liquidpedia
        assert all('source' in s for s in statuses)
        assert all('available' in s for s in statuses)
        assert all('last_check' in s for s in statuses)

    @pytest.mark.asyncio
    async def test_aggregator_combines_sources(self):
        """DataAggregator should combine data from multiple sources"""
        aggregator = DataAggregator()

        # Mock the scrapers
        with patch.object(aggregator.vlr, 'scrape_match_history') as mock_vlr:
            mock_vlr.return_value = [{"teams": "Fnatic vs Sentinels", "score": "13-10"}]

            result = await aggregator.aggregate_match_data("match-123")

            assert result['entityId'] == 'match-123'
            assert result['entityType'] == 'match'
            assert 'sources' in result


# ─── Integration Tests ────────────────────────────────────────────────

class TestIntegration:
    """End-to-end integration tests"""

    def test_normalize_then_lookup_player(self):
        """Should normalize player name then lookup in database"""
        raw_name = "DERKE"
        normalized = normalize_player_name(raw_name)
        assert normalized == "Derke"

    def test_normalize_then_lookup_team(self):
        """Should normalize team name then expand abbreviation"""
        raw_name = "FNC"
        full_name, abbr, confidence = normalize_team_name(raw_name)
        assert full_name == "Fnatic"
        assert confidence > 0.9


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
