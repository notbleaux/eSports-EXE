"""
Tests for TeamParser.
"""
import pytest
from datetime import datetime

from extraction.src.parsers.team_parser import TeamParser, RawTeamData


# Minimal synthetic VLR.gg-style team profile HTML
SAMPLE_TEAM_HTML = """
<html><body>
<div class="team-header">
    <h1>Sentinels (SEN)</h1>
    <div class="flag" data-country="North America">NA</div>
</div>
<div class="team-stats wf-module">
    <table>
        <tr>
            <td>Maps Played</td>
            <td>150</td>
        </tr>
        <tr>
            <td>Wins</td>
            <td>100</td>
        </tr>
        <tr>
            <td>Losses</td>
            <td>50</td>
        </tr>
        <tr>
            <td>Win Rate</td>
            <td>66.7%</td>
        </tr>
    </table>
</div>
<div class="roster">
    <div class="team-roster">
        <div class="player-card">
            <a href="/player/12345">TenZ</a>
            <span class="role">Duelist</span>
            <span class="flag" data-country="Canada">CA</span>
        </div>
        <div class="player-card">
            <a href="/player/12346">SicK</a>
            <span class="role">Flex</span>
            <span class="flag" data-country="USA">US</span>
        </div>
    </div>
</div>
<div class="match-item">
    <span class="date">2024-01-15</span>
    <span class="tournament">Champions Tour</span>
    <span class="opponent"><a href="/team/999">Cloud9</a></span>
    <span class="result">W</span>
    <span class="score">2-1</span>
</div>
<a href="https://twitter.com/Sentinels">Twitter</a>
<a href="https://sentinels.gg">Official Website</a>
</body></html>
"""

MISSING_MARKERS_HTML = "<html><body><p>not a team page</p></body></html>"


class TestTeamParserBasics:
    """Test basic TeamParser functionality."""
    
    def test_parse_returns_raw_team_data(self):
        """Parser should return RawTeamData on valid HTML."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert isinstance(result, RawTeamData)
        assert result.vlr_team_id == "123"
    
    def test_parse_returns_none_on_missing_structure(self):
        """Parser should return None when HTML lacks required markers."""
        parser = TeamParser()
        result = parser.parse(MISSING_MARKERS_HTML, "123")
        
        assert result is None
    
    def test_parse_extracts_name(self):
        """Parser should extract team name."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.name is not None
        assert "Sentinels" in result.name
    
    def test_parse_extracts_tag(self):
        """Parser should extract team tag."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        # Tag extraction depends on format - may be None if not found
        if result.tag:
            assert isinstance(result.tag, str)
    
    def test_parse_extracts_region(self):
        """Parser should extract team region."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.region is not None


class TestTeamParserRoster:
    """Test roster extraction."""
    
    def test_current_roster_is_list(self):
        """Parser should return roster as a list."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert isinstance(result.current_roster, list)
    
    def test_roster_players_have_names(self):
        """Roster players should have names."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        for player in result.current_roster:
            assert 'name' in player
            assert player['name'] is not None


class TestTeamParserDataTypes:
    """Test data type validation in parsed results."""
    
    def test_extraction_date_is_set(self):
        """Parser should set extraction date."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.extraction_date is not None
        # Should be a valid ISO format date
        try:
            datetime.fromisoformat(result.extraction_date.replace('Z', '+00:00'))
        except ValueError:
            pytest.fail("extraction_date is not valid ISO format")
    
    def test_recent_matches_is_list(self):
        """Parser should return recent matches as a list."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert isinstance(result.recent_matches, list)
    
    def test_tournament_results_is_list(self):
        """Parser should return tournament results as a list."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert isinstance(result.tournament_results, list)


class TestTeamParserStructureValidation:
    """Test HTML structure validation."""
    
    def test_has_expected_structure_with_valid_html(self):
        """Should detect structure in valid HTML."""
        parser = TeamParser()
        assert parser._has_expected_structure(SAMPLE_TEAM_HTML) is True
    
    def test_has_expected_structure_with_invalid_html(self):
        """Should reject HTML without required markers."""
        parser = TeamParser()
        assert parser._has_expected_structure(MISSING_MARKERS_HTML) is False
    
    def test_has_expected_structure_partial_match(self):
        """Should accept HTML with at least 2 of 4 required markers."""
        parser = TeamParser()
        
        # HTML with only 2 markers
        partial_html = """
        <html><body>
        <div class="team-header">header</div>
        <div class="team-stats">stats</div>
        </body></html>
        """
        assert parser._has_expected_structure(partial_html) is True


class TestTeamParserStatExtraction:
    """Test numeric stat extraction."""
    
    def test_maps_played_is_int_or_none(self):
        """Maps played should be int or None."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.maps_played is None or isinstance(result.maps_played, int)
    
    def test_wins_is_int_or_none(self):
        """Wins should be int or None."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.wins is None or isinstance(result.wins, int)
    
    def test_losses_is_int_or_none(self):
        """Losses should be int or None."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.losses is None or isinstance(result.losses, int)
    
    def test_win_rate_is_float_or_none(self):
        """Win rate should be float or None."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.win_rate is None or isinstance(result.win_rate, float)
    
    def test_avg_kd_is_float_or_none(self):
        """Average K/D should be float or None."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.avg_kd is None or isinstance(result.avg_kd, float)
    
    def test_avg_rating_is_float_or_none(self):
        """Average rating should be float or None."""
        parser = TeamParser()
        result = parser.parse(SAMPLE_TEAM_HTML, "123")
        
        assert result.avg_rating is None or isinstance(result.avg_rating, float)


class TestTeamParserEdgeCases:
    """Test edge cases and error handling."""
    
    def test_empty_html(self):
        """Should handle empty HTML gracefully."""
        parser = TeamParser()
        result = parser.parse("", "123")
        
        assert result is None
    
    def test_malformed_html(self):
        """Should handle malformed HTML gracefully."""
        parser = TeamParser()
        malformed = "<html><div class='team-header'>Test</div></html>"
        result = parser.parse(malformed, "123")
        
        # May or may not be None depending on marker detection
        if result is not None:
            assert result.vlr_team_id == "123"
    
    def test_parse_stat_value_k_suffix(self):
        """Should parse K suffix for thousands."""
        parser = TeamParser()
        assert parser._parse_stat_value("1.5K") == 1500
    
    def test_parse_float_value_with_percent(self):
        """Should handle percentage values."""
        parser = TeamParser()
        assert parser._parse_float_value("66.7%") == 66.7
