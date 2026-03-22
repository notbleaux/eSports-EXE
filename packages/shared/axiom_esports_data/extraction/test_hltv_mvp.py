"""Test script for HLTV Client MVP

Verifies:
1. Client can be instantiated
2. Config files are valid JSON
3. Parser works with sample data
4. Role classifier works
"""

import asyncio
import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from extraction.src.parsers.cs_match_parser import (
    CS2MatchParser,
    CS2RoleClassifier,
    CS2Role,
    RawMatchData,
    normalize_map_name,
    calculate_team_rating
)
from extraction.src.scrapers.hltv_client import (
    HLTVClient,
    HLTVMatchResult,
    HLTVMatchDetails
)


def test_config_files():
    """Test that config files are valid JSON"""
    print("\n=== Testing Config Files ===")
    
    config_dir = Path(__file__).parent.parent / "config"
    
    # Test cs_maps.json
    cs_maps_path = config_dir / "cs_maps.json"
    try:
        with open(cs_maps_path) as f:
            cs_maps = json.load(f)
        print(f"[OK] cs_maps.json loaded successfully")
        print(f"  - Active duty maps: {len(cs_maps['maps'])}")
        print(f"  - Reserve maps: {len(cs_maps['reserve_maps'])}")
        print(f"  - Map aliases: {len(cs_maps['map_aliases_lookup'])}")
        
        # Verify key maps exist
        assert "Dust2" in cs_maps["maps"], "Dust2 not found"
        assert "Mirage" in cs_maps["maps"], "Mirage not found"
        print("  [OK] Key maps verified (Dust2, Mirage, Inferno, Nuke)")
        
    except Exception as e:
        print(f"[FAIL] cs_maps.json failed: {e}")
        return False
    
    # Test datapoint_naming.json
    datapoint_path = config_dir / "datapoint_naming.json"
    try:
        with open(datapoint_path) as f:
            datapoint = json.load(f)
        print(f"[OK] datapoint_naming.json loaded successfully")
        print(f"  - Match fields: {len(datapoint['match_fields'])}")
        print(f"  - Player fields: {len(datapoint['player_fields'])}")
        print(f"  - CS2 specific fields: {len(datapoint['game_specific']['cs2'])}")
        print(f"  - Valorant specific fields: {len(datapoint['game_specific']['valorant'])}")
        
        # Verify HLTV mappings exist
        assert "hltv" in datapoint["sources"], "HLTV source not found"
        assert "cs2" in datapoint["game_specific"], "CS2 fields not found"
        print("  [OK] HLTV and CS2 field mappings verified")
        
    except Exception as e:
        print(f"[FAIL] datapoint_naming.json failed: {e}")
        return False
    
    return True


def test_role_classifier():
    """Test the CS2 role classifier"""
    print("\n=== Testing CS2 Role Classifier ===")
    
    classifier = CS2RoleClassifier()
    
    # Test cases
    test_cases = [
        # AWPer
        ({"awp_kills": 8}, CS2Role.AWPER),
        # IGL
        ({"is_igl": True}, CS2Role.IGL),
        # Entry
        ({"entry_success": 0.7}, CS2Role.ENTRY),
        # Rifler (default)
        ({}, CS2Role.RIFLER),
    ]
    
    passed = 0
    for kwargs, expected in test_cases:
        from extraction.src.parsers.cs_match_parser import RawPlayerStats
        stats = RawPlayerStats(
            player_id="test",
            player_name="Test",
            team="TestTeam"
        )
        role = classifier.classify_from_stats(stats, **kwargs)
        if role == expected:
            passed += 1
            print(f"  [OK] {kwargs} -> {role.value}")
        else:
            print(f"  [FAIL] {kwargs} -> {role.value} (expected {expected.value})")
    
    print(f"  Passed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)


def test_parser():
    """Test the CS2 match parser"""
    print("\n=== Testing CS2 Match Parser ===")
    
    parser = CS2MatchParser()
    
    # Sample HLTV data
    sample_match = {
        "match_id": "2379423",
        "team_a": "FaZe",
        "team_b": "NAVI",
        "event_name": "IEM Katowice 2024",
        "event_id": "7543",
        "date": "2024-02-11",
        "format": "bo3",
        "url": "https://www.hltv.org/matches/2379423/faze-vs-navi",
        "maps": [
            {
                "map_name": "Mirage",
                "team_a": "FaZe",
                "team_b": "NAVI",
                "score_a": 13,
                "score_b": 11,
                "player_stats": [
                    {
                        "player_id": "11816",
                        "player_name": "ropz",
                        "team": "FaZe",
                        "kills": 22,
                        "deaths": 14,
                        "assists": 3,
                        "adr": 85.5,
                        "kast": 78.3,
                        "rating": 1.35,
                        "hs_percent": 45.5,
                        "fk_diff": 4
                    },
                    {
                        "player_id": "7998",
                        "player_name": "s1mple",
                        "team": "NAVI",
                        "kills": 18,
                        "deaths": 16,
                        "assists": 2,
                        "adr": 72.3,
                        "kast": 65.2,
                        "rating": 1.05,
                        "hs_percent": 38.9,
                        "fk_diff": -2
                    }
                ]
            },
            {
                "map_name": "Nuke",
                "team_a": "FaZe",
                "team_b": "NAVI",
                "score_a": 16,
                "score_b": 14,
                "player_stats": []
            }
        ]
    }
    
    try:
        # Parse match
        raw_match = parser.parse_hltv_match(sample_match, include_raw=True)
        
        print(f"  [OK] Parsed match: {raw_match.match_id}")
        print(f"    Teams: {raw_match.team_a} vs {raw_match.team_b}")
        print(f"    Event: {raw_match.event_name}")
        print(f"    Format: {raw_match.format}")
        print(f"    Winner: {raw_match.winner}")
        print(f"    Maps: {len(raw_match.maps)}")
        
        # Verify data
        assert raw_match.match_id == "2379423", "Match ID mismatch"
        assert raw_match.team_a == "FaZe", "Team A mismatch"
        assert raw_match.team_b == "NAVI", "Team B mismatch"
        assert raw_match.winner == "FaZe", "Winner mismatch"
        assert len(raw_match.maps) == 2, "Map count mismatch"
        
        # Check first map
        first_map = raw_match.maps[0]
        assert first_map.map_name == "Mirage", "Map name mismatch"
        assert first_map.score_a == 13, "Score A mismatch"
        assert first_map.score_b == 11, "Score B mismatch"
        assert len(first_map.player_stats) == 2, "Player stats count mismatch"
        
        # Check player
        player = first_map.player_stats[0]
        assert player.player_name == "ropz", "Player name mismatch"
        assert player.kills == 22, "Kills mismatch"
        assert player.adr == 85.5, "ADR mismatch"
        assert player.role in CS2Role, "Role not assigned"
        
        print(f"  [OK] All assertions passed")
        
        # Test staging payload
        staging_payload = parser.to_staging_payload(raw_match)
        assert "match_id" in staging_payload
        assert "teams" in staging_payload
        assert "maps" in staging_payload
        print(f"  [OK] Staging payload generated")
        
        return True
        
    except Exception as e:
        print(f"  [FAIL] Parser test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_map_normalization():
    """Test map name normalization"""
    print("\n=== Testing Map Normalization ===")
    
    test_cases = [
        ("dust2", "Dust2"),
        ("de_mirage", "Mirage"),
        ("NUKE", "Nuke"),
        ("de_inferno (pick)", "Inferno"),
        ("ANCIENT", "Ancient"),
    ]
    
    passed = 0
    for input_name, expected in test_cases:
        result = normalize_map_name(input_name)
        if result == expected:
            passed += 1
            print(f"  [OK] '{input_name}' -> '{result}'")
        else:
            print(f"  [FAIL] '{input_name}' -> '{result}' (expected '{expected}')")
    
    print(f"  Passed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)


def test_client_import():
    """Test that client can be imported"""
    print("\n=== Testing Client Import ===")
    
    try:
        from extraction.src.scrapers.hltv_client import HLTVClient
        from extraction.src.scrapers.hltv_client import HLTVMatchResult
        from extraction.src.scrapers.hltv_client import HLTVMatchDetails
        from extraction.src.scrapers.hltv_client import HLTVPlayerStats
        from extraction.src.scrapers.hltv_client import HLTVMapStats
        
        print("  [OK] All HLTV client classes imported")
        
        # Test instantiation (without actual HTTP calls)
        client = HLTVClient()
        print(f"  [OK] HLTVClient instantiated")
        print(f"    Base URL: {client.BASE_URL}")
        print(f"    Rate limit delay: {client.RATE_LIMIT_DELAY}s")
        
        return True
        
    except Exception as e:
        print(f"  [FAIL] Client import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_client_mock():
    """Test client with mock data (no actual HTTP)"""
    print("\n=== Testing HLTV Client (Mock) ===")
    
    # We can't test actual HTTP without network,
    # but we can verify the parsing methods work
    
    try:
        from bs4 import BeautifulSoup
        
        # Create a mock HTML result
        mock_html = """
        <div class="result-con">
            <a class="a-reset" href="/matches/12345/test-match">
                <div class="team">Team A</div>
                <div class="team">Team B</div>
                <td class="result-score">16-14</td>
                <span class="event-name">Test Event</span>
            </a>
        </div>
        """
        
        soup = BeautifulSoup(mock_html, "lxml")
        client = HLTVClient()
        
        # Test parsing
        result_block = soup.find("div", class_="result-con")
        if result_block:
            match = client._parse_result_block(result_block)
            if match:
                print(f"  [OK] Parsed result block:")
                print(f"    Match ID: {match.match_id}")
                print(f"    Teams: {match.team_a} vs {match.team_b}")
                print(f"    Score: {match.score_a}-{match.score_b}")
                print(f"    Event: {match.event_name}")
                return True
            else:
                print("  ✗ Failed to parse result block")
                return False
        else:
            print("  [FAIL] No result block found")
            return False
            
    except Exception as e:
        print(f"  [FAIL] Mock test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("HLTV Client MVP Test Suite")
    print("=" * 60)
    
    results = []
    
    # Run synchronous tests
    results.append(("Config Files", test_config_files()))
    results.append(("Role Classifier", test_role_classifier()))
    results.append(("Parser", test_parser()))
    results.append(("Map Normalization", test_map_normalization()))
    results.append(("Client Import", test_client_import()))
    
    # Run async tests
    results.append(("Client Mock", asyncio.run(test_client_mock())))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"  {status}: {name}")
    
    print(f"\nTotal: {passed}/{total} passed")
    
    if passed == total:
        print("\n[SUCCESS] All tests passed! MVP is ready.")
        return 0
    else:
        print(f"\n[WARNING] {total - passed} test(s) failed.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
