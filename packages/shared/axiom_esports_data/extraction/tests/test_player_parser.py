"""
Tests for PlayerParser.
"""
import pytest
from datetime import datetime

from extraction.src.parsers.player_parser import PlayerParser, RawPlayerData


# Minimal synthetic VLR.gg-style player profile HTML
SAMPLE_PLAYER_HTML = """
<html><body>
<div class="player-header">
    <h1>TenZ</h1>
    <div class="ge-text-light">Tyson Ngo</div>
    <div class="flag" data-country="Canada">CA</div>
</div>
<div class="player-stats wf-module">
    <div class="team-name">Sentinels</div>
    <table>
        <tr>
            <td>ACS</td>
            <td>250.5</td>
        </tr>
        <tr>
            <td>K/D</td>
            <td>1.15</td>
        </tr>
        <tr>
            <td>Rating</td>
            <td>1.12</td>
        </tr>
    </table>
</div>
<div class="agent-stats">
    <div class="mod-agents">
        <img alt="Jett" />
        <span class="mod-stat">35%</span>
        <span class="mod-stat">250</span>
    </div>
    <div class="mod-agents">
        <img alt="Sage" />
        <span class="mod-stat">25%</span>
        <span class="mod-stat">200</span>
    </div>
</div>
<div class="match-item">
    <span class="date">2024-01-15</span>
    <span class="tournament">Champions Tour</span>
    <span class="result">W</span>
</div>
<a href="https://twitter.com/TenZ">Twitter</a>
<a href="https://twitch.tv/TenZ">Twitch</a>
</body></html>
"""

MISSING_MARKERS_HTML = "<html><body><p>not a player page</p></body></html>"


class TestPlayerParserBasics:
    """Test basic PlayerParser functionality."""
    
    def test_parse_returns_raw_player_data(self):
        """Parser should return RawPlayerData on valid HTML."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert isinstance(result, RawPlayerData)
        assert result.vlr_player_id == "12345"
    
    def test_parse_returns_none_on_missing_structure(self):
        """Parser should return None when HTML lacks required markers."""
        parser = PlayerParser()
        result = parser.parse(MISSING_MARKERS_HTML, "12345")
        
        assert result is None
    
    def test_parse_extracts_name(self):
        """Parser should extract player name."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert result.name is not None
        assert len(result.name) > 0
    
    def test_parse_extracts_team(self):
        """Parser should extract current team."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert result.team == "Sentinels"
    
    def test_parse_extracts_region(self):
        """Parser should extract player region/country."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert result.region is not None
    
    def test_parse_extracts_social_links(self):
        """Parser should extract social media links."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert result.twitter is not None or result.twitch is not None


class TestPlayerParserDataTypes:
    """Test data type validation in parsed results."""
    
    def test_extraction_date_is_set(self):
        """Parser should set extraction date."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert result.extraction_date is not None
        # Should be a valid ISO format date
        try:
            datetime.fromisoformat(result.extraction_date.replace('Z', '+00:00'))
        except ValueError:
            pytest.fail("extraction_date is not valid ISO format")
    
    def test_agents_is_list(self):
        """Parser should return agents as a list."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert isinstance(result.agents, list)
    
    def test_recent_matches_is_list(self):
        """Parser should return recent matches as a list."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert isinstance(result.recent_matches, list)


class TestPlayerParserStructureValidation:
    """Test HTML structure validation."""
    
    def test_has_expected_structure_with_valid_html(self):
        """Should detect structure in valid HTML."""
        parser = PlayerParser()
        assert parser._has_expected_structure(SAMPLE_PLAYER_HTML) is True
    
    def test_has_expected_structure_with_invalid_html(self):
        """Should reject HTML without required markers."""
        parser = PlayerParser()
        assert parser._has_expected_structure(MISSING_MARKERS_HTML) is False
    
    def test_has_expected_structure_partial_match(self):
        """Should accept HTML with at least 2 of 4 required markers."""
        parser = PlayerParser()
        
        # HTML with only 2 markers
        partial_html = """
        <html><body>
        <div class="player-header">header</div>
        <div class="player-stats">stats</div>
        </body></html>
        """
        assert parser._has_expected_structure(partial_html) is True


class TestPlayerParserStatExtraction:
    """Test numeric stat extraction."""
    
    def test_acs_avg_is_float_or_none(self):
        """ACS average should be float or None."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert result.acs_avg is None or isinstance(result.acs_avg, float)
    
    def test_kast_avg_is_float_or_none(self):
        """KAST average should be float or None."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert result.kast_avg is None or isinstance(result.kast_avg, float)
    
    def test_rating_avg_is_float_or_none(self):
        """Rating average should be float or None."""
        parser = PlayerParser()
        result = parser.parse(SAMPLE_PLAYER_HTML, "12345")
        
        assert result.rating_avg is None or isinstance(result.rating_avg, float)


class TestPlayerParserEdgeCases:
    """Test edge cases and error handling."""
    
    def test_empty_html(self):
        """Should handle empty HTML gracefully."""
        parser = PlayerParser()
        result = parser.parse("", "12345")
        
        assert result is None
    
    def test_malformed_html(self):
        """Should handle malformed HTML gracefully."""
        parser = PlayerParser()
        malformed = "<html><div class='player-header'>Test</div></html>"
        result = parser.parse(malformed, "12345")
        
        # May or may not be None depending on marker detection
        if result is not None:
            assert result.vlr_player_id == "12345"
    
    def test_parse_stat_value_k_suffix(self):
        """Should parse K suffix for thousands."""
        parser = PlayerParser()
        assert parser._parse_stat_value("1.5K") == 1500
        assert parser._parse_stat_value("2K") == 2000
    
    def test_parse_stat_value_m_suffix(self):
        """Should parse M suffix for millions."""
        parser = PlayerParser()
        assert parser._parse_stat_value("1.5M") == 1500000
    
    def test_parse_stat_value_with_commas(self):
        """Should handle comma separators."""
        parser = PlayerParser()
        assert parser._parse_stat_value("1,234") == 1234
    
    def test_parse_float_value_with_percent(self):
        """Should handle percentage values."""
        parser = PlayerParser()
        assert parser._parse_float_value("75%") == 75.0
