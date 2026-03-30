"""[Ver001.000]
Tests for staging module — data partition firewall and export forms.
"""
import pytest
from njz_api.staging.firewall import (
    sanitize_for_web,
    DataPartitionFirewall,
    FantasyDataFilter,
    GAME_ONLY_FIELDS,
    validate_partition,
)
from njz_api.staging.export_forms import WebExportForm, GameExportForm
from njz_api.staging.integrity import compute_hash, verify_checksum, IntegrityChecker


class TestFirewallSanitization:
    """Test data partition firewall sanitization."""
    
    def test_sanitize_removes_game_fields(self):
        """Test that game-only fields are removed during sanitization."""
        data = {
            'matchId': '123',
            'playerId': '456',
            'internalAgentState': {'x': 100, 'y': 200},
            'kills': 10,
            'radarData': [[1, 2], [3, 4]],
        }
        sanitized = sanitize_for_web(data)
        
        assert 'matchId' in sanitized
        assert 'playerId' in sanitized
        assert 'kills' in sanitized
        assert 'internalAgentState' not in sanitized
        assert 'radarData' not in sanitized
    
    def test_sanitize_preserves_shared_fields(self):
        """Test that shared fields are preserved."""
        data = {
            'matchId': '123',
            'playerId': '456',
            'teamId': '789',
            'score': 13,
            'kills': 20,
            'deaths': 10,
            'assists': 5,
        }
        sanitized = sanitize_for_web(data)
        
        for field in ['matchId', 'playerId', 'teamId', 'score', 'kills', 'deaths', 'assists']:
            assert field in sanitized, f"Shared field '{field}' should be preserved"
    
    def test_sanitize_nested_structures(self):
        """Test sanitization of nested dictionaries and lists."""
        data = {
            'matchId': '123',
            'players': [
                {'playerId': '1', 'internalAgentState': {}},
                {'playerId': '2', 'radarData': []},
            ],
            'metadata': {
                'seedValue': 12345,
                'mapName': 'Ascent',
            },
        }
        sanitized = sanitize_for_web(data)
        
        assert sanitized['matchId'] == '123'
        assert 'players' in sanitized
        assert len(sanitized['players']) == 2
        assert 'internalAgentState' not in sanitized['players'][0]
        assert 'radarData' not in sanitized['players'][1]
        assert 'seedValue' not in sanitized['metadata']
        assert sanitized['metadata']['mapName'] == 'Ascent'
    
    def test_sanitize_empty_dict(self):
        """Test sanitization of empty dictionary."""
        assert sanitize_for_web({}) == {}
    
    def test_sanitize_non_dict(self):
        """Test sanitization of non-dict values."""
        assert sanitize_for_web("string") == "string"
        assert sanitize_for_web(123) == 123
        assert sanitize_for_web(None) is None


class TestFantasyDataFilter:
    """Test FantasyDataFilter class."""
    
    def test_sanitize_for_web_classmethod(self):
        """Test classmethod sanitization."""
        data = {
            'matchId': '123',
            'internalAgentState': {'x': 100},
        }
        sanitized = FantasyDataFilter.sanitize_for_web(data)
        
        assert 'matchId' in sanitized
        assert 'internalAgentState' not in sanitized
    
    def test_validate_web_input_valid(self):
        """Test validation of valid web data."""
        data = {
            'matchId': '123',
            'playerId': '456',
            'kills': 10,
        }
        assert FantasyDataFilter.validate_web_input(data) is True
    
    def test_validate_web_input_invalid(self):
        """Test validation raises on game-only fields."""
        data = {
            'matchId': '123',
            'internalAgentState': {},
        }
        with pytest.raises(ValueError, match="game-internal field"):
            FantasyDataFilter.validate_web_input(data)
    
    def test_validate_web_input_nested_invalid(self):
        """Test validation raises on nested game-only fields."""
        data = {
            'matchId': '123',
            'player': {
                'internalAgentState': {},
            },
        }
        with pytest.raises(ValueError, match="game-internal field"):
            FantasyDataFilter.validate_web_input(data)


class TestDataPartitionFirewall:
    """Test DataPartitionFirewall class."""
    
    def test_firewall_sanitize(self):
        """Test firewall sanitization with violation tracking."""
        firewall = DataPartitionFirewall()
        data = {
            'matchId': '123',
            'internalAgentState': {},
        }
        sanitized = firewall.sanitize(data)
        
        assert 'matchId' in sanitized
        assert 'internalAgentState' not in sanitized
        assert len(firewall.get_violations()) == 1
    
    def test_firewall_strict_check_passes(self):
        """Test strict check on clean data."""
        firewall = DataPartitionFirewall()
        data = {'matchId': '123', 'kills': 10}
        # Should not raise
        firewall.strict_check(data)
    
    def test_firewall_strict_check_raises(self):
        """Test strict check raises on game fields."""
        firewall = DataPartitionFirewall()
        data = {'internalAgentState': {}, 'matchId': '123'}
        
        with pytest.raises(ValueError, match="Data partition violation"):
            firewall.strict_check(data)
    
    def test_firewall_clear_violations(self):
        """Test clearing violation history."""
        firewall = DataPartitionFirewall()
        data = {'internalAgentState': {}}
        firewall.sanitize(data)
        
        assert len(firewall.get_violations()) == 1
        firewall.clear_violations()
        assert len(firewall.get_violations()) == 0


class TestValidatePartition:
    """Test validate_partition function."""
    
    def test_validate_partition_clean(self):
        """Test validation of clean data."""
        data = {'matchId': '123', 'kills': 10}
        assert validate_partition(data) is True
    
    def test_validate_partition_violation(self):
        """Test validation detects violations."""
        data = {'matchId': '123', 'internalAgentState': {}}
        assert validate_partition(data) is False
    
    def test_validate_partition_nested(self):
        """Test validation of nested structures."""
        data = {
            'matchId': '123',
            'players': [
                {'internalAgentState': {}},  # Violation
            ],
        }
        assert validate_partition(data) is False


class TestWebExportForm:
    """Test WebExportForm class."""
    
    def test_web_export_form_init(self):
        """Test WebExportForm initialization."""
        form = WebExportForm()
        assert form.REQUIRES_FIREWALL is True
        assert form.TARGET_PROJECT == "web"
    
    def test_export_player_stats(self):
        """Test exporting player stats."""
        form = WebExportForm()
        player_records = [
            {
                'player_id': 'player1',
                'match_id': 'match1',
                'kills': 20,
                'deaths': 10,
                'internalAgentState': {},  # Should be stripped
            }
        ]
        records = form.export_player_stats(player_records)
        
        assert len(records) == 1
        record = records[0]
        assert record.data_type == "player_stats"
        assert record.firewall_verified is True
        assert 'internalAgentState' not in record.payload
        assert record.payload.get('playerId') == 'player1'
    
    def test_export_match_summary(self):
        """Test exporting match summaries."""
        form = WebExportForm()
        match_records = [
            {
                'match_id': 'match1',
                'map_name': 'Ascent',
                'radarData': [],  # Should be stripped
            }
        ]
        records = form.export_match_summary(match_records)
        
        assert len(records) == 1
        assert records[0].payload.get('matchId') == 'match1'
        assert 'radarData' not in records[0].payload
    
    def test_export_leaderboard(self):
        """Test exporting leaderboard."""
        form = WebExportForm()
        player_records = [
            {'player_id': 'p1', 'kills': 100},
            {'player_id': 'p2', 'kills': 50},
        ]
        records = form.export_leaderboard(player_records)
        
        assert len(records) == 2
    
    def test_get_verified_records(self):
        """Test getting verified records."""
        form = WebExportForm()
        form.export_player_stats([{'player_id': 'p1', 'match_id': 'm1', 'kills': 10}])
        
        verified = form.get_verified_records()
        assert len(verified) == 1
    
    def test_get_export_log(self):
        """Test getting export audit log."""
        form = WebExportForm()
        form.export_player_stats([{'player_id': 'p1', 'match_id': 'm1', 'kills': 10}])
        
        log = form.get_export_log()
        assert len(log) == 1
        assert log[0]['target_project'] == 'web'


class TestGameExportForm:
    """Test GameExportForm class."""
    
    def test_game_export_form_init(self):
        """Test GameExportForm initialization."""
        form = GameExportForm()
        assert form.REQUIRES_FIREWALL is False
        assert form.TARGET_PROJECT == "game"
    
    def test_export_definitions(self):
        """Test exporting game definitions."""
        form = GameExportForm()
        definitions = [
            {'id': 'jett', 'name': 'Jett', 'role': 'duelist'},
            {'id': 'sage', 'name': 'Sage', 'role': 'sentinel'},
        ]
        records = form.export_definitions('agents', definitions)
        
        assert len(records) == 2
        assert records[0].data_type == "agent_def"
    
    def test_export_match_events(self):
        """Test exporting match events."""
        form = GameExportForm()
        events = [{'type': 'kill', 'player': 'p1'}]
        record = form.export_match_events('match1', events)
        
        assert record.data_type == "event_log"
        assert record.data_key == "match1"
        assert record.payload['event_count'] == 1
    
    def test_export_replay(self):
        """Test exporting replay data."""
        form = GameExportForm()
        replay_data = {'frames': [], 'ticks': 1000}
        record = form.export_replay('match1', replay_data)
        
        assert record.data_type == "match_replay"
        assert record.payload == replay_data
    
    def test_get_active_definitions(self):
        """Test getting active definitions."""
        form = GameExportForm()
        form.export_definitions('agents', [{'id': 'jett'}])
        
        active = form.get_active_definitions('agent_def')
        assert len(active) == 1
    
    def test_get_by_key(self):
        """Test getting record by key."""
        form = GameExportForm()
        form.export_definitions('agents', [{'id': 'jett'}])
        
        record = form.get_by_key('agent_def', 'jett')
        assert record is not None
        assert record.data_key == 'jett'


class TestIntegrity:
    """Test integrity checking."""
    
    def test_compute_hash_string(self):
        """Test computing hash of string."""
        hash1 = compute_hash("test")
        hash2 = compute_hash("test")
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA-256 hex is 64 chars
    
    def test_compute_hash_dict(self):
        """Test computing hash of dictionary."""
        data = {'a': 1, 'b': 2}
        hash1 = compute_hash(data)
        hash2 = compute_hash({'b': 2, 'a': 1})  # Different order
        assert hash1 == hash2  # Should be same due to key sorting
    
    def test_verify_checksum(self):
        """Test checksum verification."""
        data = "test data"
        hash_val = compute_hash(data)
        assert verify_checksum(data, hash_val) is True
        assert verify_checksum(data, "wrong_hash") is False
    
    def test_integrity_checker_sign_data(self):
        """Test signing data with integrity hash."""
        checker = IntegrityChecker()
        data = {'matchId': '123', 'kills': 10}
        signed = checker.sign_data(data)
        
        assert '_integrity' in signed
        assert signed['matchId'] == '123'
    
    def test_integrity_checker_verify_data(self):
        """Test verifying signed data."""
        checker = IntegrityChecker()
        data = {'matchId': '123', 'kills': 10}
        signed = checker.sign_data(data)
        
        assert checker.verify_data(signed) is True
    
    def test_integrity_checker_verify_tampered(self):
        """Test verification fails on tampered data."""
        checker = IntegrityChecker()
        data = {'matchId': '123', 'kills': 10}
        signed = checker.sign_data(data)
        
        # Tamper with data
        signed['kills'] = 100
        
        assert checker.verify_data(signed) is False
    
    def test_integrity_checker_verify_no_integrity_field(self):
        """Test verification fails without integrity field."""
        checker = IntegrityChecker()
        data = {'matchId': '123'}
        
        assert checker.verify_data(data) is False


class TestGameOnlyFields:
    """Test GAME_ONLY_FIELDS constant."""
    
    def test_game_only_fields_contents(self):
        """Test that expected fields are in GAME_ONLY_FIELDS."""
        expected_fields = [
            "internalAgentState",
            "radarData",
            "detailedReplayFrameData",
            "simulationTick",
            "seedValue",
            "visionConeData",
            "smokeTickData",
            "recoilPattern",
            "aimAssistData",
            "serverTimestamp",
        ]
        
        for field in expected_fields:
            assert field in GAME_ONLY_FIELDS, f"{field} should be in GAME_ONLY_FIELDS"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
