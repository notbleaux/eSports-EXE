"""
Test Data Fixtures
Provides test data for E2E and integration tests

[Ver001.000]
"""

import pytest
from datetime import datetime, timedelta
from typing import Dict, List, Any
import random
import string


# Player fixtures
@pytest.fixture
def sample_player():
    """Generate a sample player."""
    return {
        "id": f"player_{random.randint(1000, 9999)}",
        "name": f"Player {random.randint(1, 100)}",
        "team": "Sentinels",
        "region": "NA",
        "role": random.choice(["Duelist", "Initiator", "Controller", "Sentinel"]),
        "stats": {
            "rating": round(0.8 + random.random() * 0.4, 2),
            "acs": round(180 + random.random() * 100, 1),
            "kda": round(1.0 + random.random() * 1.5, 2),
            "headshot_percentage": round(15 + random.random() * 20, 1),
            "adr": round(140 + random.random() * 60, 1),
            "kast": round(60 + random.random() * 30, 1)
        }
    }


@pytest.fixture
def sample_players():
    """Generate a list of sample players."""
    teams = ["Sentinels", "Cloud9", "NRG", "LOUD", "FNATIC", "NAVI"]
    roles = ["Duelist", "Initiator", "Controller", "Sentinel"]
    
    players = []
    for i in range(20):
        players.append({
            "id": f"player_{i + 1000}",
            "name": f"Player {i + 1}",
            "team": random.choice(teams),
            "region": random.choice(["NA", "EU", "APAC", "BR", "KR"]),
            "role": random.choice(roles),
            "stats": {
                "rating": round(0.8 + random.random() * 0.4, 2),
                "acs": round(180 + random.random() * 100, 1),
                "kda": round(1.0 + random.random() * 1.5, 2),
                "headshot_percentage": round(15 + random.random() * 20, 1),
                "adr": round(140 + random.random() * 60, 1),
                "kast": round(60 + random.random() * 30, 1)
            }
        })
    return players


# Team fixtures
@pytest.fixture
def sample_team():
    """Generate a sample team."""
    return {
        "id": f"team_{random.randint(1000, 9999)}",
        "name": f"Team {random.randint(1, 100)}",
        "region": random.choice(["NA", "EU", "APAC", "BR", "KR"]),
        "stats": {
            "win_rate": round(0.4 + random.random() * 0.4, 2),
            "matches_played": random.randint(10, 100),
            "tournament_wins": random.randint(0, 10),
            "avg_rating": round(0.8 + random.random() * 0.3, 2)
        }
    }


@pytest.fixture
def sample_teams():
    """Generate a list of sample teams."""
    team_names = ["Sentinels", "Cloud9", "NRG", "LOUD", "FNATIC", "NAVI", 
                  "DRX", "Paper Rex", "EDward Gaming", "Leviatán"]
    
    teams = []
    for i, name in enumerate(team_names):
        teams.append({
            "id": f"team_{i + 1000}",
            "name": name,
            "region": random.choice(["NA", "EU", "APAC", "BR", "KR", "CN", "LATAM"]),
            "stats": {
                "win_rate": round(0.4 + random.random() * 0.4, 2),
                "matches_played": random.randint(20, 150),
                "tournament_wins": random.randint(0, 15),
                "avg_rating": round(0.8 + random.random() * 0.3, 2)
            }
        })
    return teams


# Match fixtures
@pytest.fixture
def sample_match():
    """Generate a sample match."""
    return {
        "id": f"match_{random.randint(1000, 9999)}",
        "team_a": "Sentinels",
        "team_b": "Cloud9",
        "score": {
            "team_a": random.randint(0, 13),
            "team_b": random.randint(0, 13)
        },
        "status": random.choice(["upcoming", "live", "completed"]),
        "scheduled_time": (datetime.now() + timedelta(hours=random.randint(-24, 48))).isoformat(),
        "map": random.choice(["Ascent", "Bind", "Haven", "Split", "Icebox", "Breeze", "Fracture", "Pearl", "Lotus"]),
        "tournament": random.choice(["VCT Champions", "VCT Masters", "VCT Americas", "VCT EMEA"]),
        "round": random.randint(1, 24)
    }


@pytest.fixture
def sample_matches():
    """Generate a list of sample matches."""
    teams = ["Sentinels", "Cloud9", "NRG", "LOUD", "FNATIC", "NAVI"]
    maps = ["Ascent", "Bind", "Haven", "Split", "Icebox", "Breeze", "Fracture", "Pearl", "Lotus"]
    tournaments = ["VCT Champions", "VCT Masters", "VCT Americas", "VCT EMEA", "VCT Pacific", "VCT China"]
    
    matches = []
    for i in range(15):
        team_a, team_b = random.sample(teams, 2)
        matches.append({
            "id": f"match_{i + 1000}",
            "team_a": team_a,
            "team_b": team_b,
            "score": {
                "team_a": random.randint(0, 13),
                "team_b": random.randint(0, 13)
            },
            "status": random.choice(["upcoming", "live", "completed"]),
            "scheduled_time": (datetime.now() + timedelta(hours=random.randint(-48, 72))).isoformat(),
            "map": random.choice(maps),
            "tournament": random.choice(tournaments),
            "round": random.randint(1, 24)
        })
    return matches


# Prediction fixtures
@pytest.fixture
def sample_prediction():
    """Generate a sample prediction."""
    confidence = round(0.5 + random.random() * 0.45, 2)
    return {
        "id": f"pred_{random.randint(1000, 9999)}",
        "match_id": f"match_{random.randint(1000, 9999)}",
        "predicted_winner": random.choice(["team_a", "team_b"]),
        "confidence": confidence,
        "factors": [
            {"name": "Win Rate", "weight": 0.3, "contribution": round(random.random(), 2)},
            {"name": "Recent Form", "weight": 0.25, "contribution": round(random.random(), 2)},
            {"name": "Head to Head", "weight": 0.2, "contribution": round(random.random(), 2)},
            {"name": "Map Performance", "weight": 0.15, "contribution": round(random.random(), 2)},
            {"name": "Player Ratings", "weight": 0.1, "contribution": round(random.random(), 2)}
        ],
        "created_at": datetime.now().isoformat(),
        "status": random.choice(["pending", "processing", "complete"])
    }


@pytest.fixture
def sample_predictions():
    """Generate a list of sample predictions."""
    predictions = []
    for i in range(10):
        predictions.append({
            "id": f"pred_{i + 1000}",
            "match_id": f"match_{i + 1000}",
            "predicted_winner": random.choice(["team_a", "team_b"]),
            "confidence": round(0.5 + random.random() * 0.45, 2),
            "factors": [
                {"name": "Win Rate", "weight": 0.3, "contribution": round(random.random(), 2)},
                {"name": "Recent Form", "weight": 0.25, "contribution": round(random.random(), 2)},
                {"name": "Head to Head", "weight": 0.2, "contribution": round(random.random(), 2)},
                {"name": "Map Performance", "weight": 0.15, "contribution": round(random.random(), 2)},
                {"name": "Player Ratings", "weight": 0.1, "contribution": round(random.random(), 2)}
            ],
            "created_at": (datetime.now() - timedelta(hours=i)).isoformat(),
            "status": random.choice(["pending", "processing", "complete"])
        })
    return predictions


# Analytics fixtures
@pytest.fixture
def sample_analytics():
    """Generate sample analytics data."""
    return {
        "overview": {
            "total_matches": random.randint(100, 1000),
            "total_players": random.randint(50, 500),
            "total_teams": random.randint(10, 100),
            "avg_rating": round(0.85 + random.random() * 0.15, 2)
        },
        "trends": [
            {
                "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                "matches": random.randint(10, 50),
                "rating": round(0.8 + random.random() * 0.2, 2)
            }
            for i in range(30)
        ],
        "predictions": {
            "total": random.randint(100, 500),
            "accuracy": round(0.6 + random.random() * 0.3, 2),
            "by_map": [
                {"map": map_name, "accuracy": round(0.6 + random.random() * 0.3, 2)}
                for map_name in ["Ascent", "Bind", "Haven", "Split", "Icebox"]
            ]
        }
    }


# Event fixtures
@pytest.fixture
def sample_events():
    """Generate sample timeline events."""
    event_types = ["match_start", "round_end", "kill", "ability_used", "match_end", "tournament_start"]
    
    events = []
    for i in range(20):
        events.append({
            "id": f"event_{i + 1000}",
            "type": random.choice(event_types),
            "timestamp": (datetime.now() - timedelta(minutes=i * 5)).isoformat(),
            "data": {
                "description": f"Event {i + 1}",
                "related_id": f"match_{random.randint(1000, 9999)}"
            }
        })
    return events


# Search fixtures
@pytest.fixture
def sample_search_results():
    """Generate sample search results."""
    return {
        "query": "test",
        "results": {
            "players": [
                {"id": f"player_{i}", "name": f"Test Player {i}"}
                for i in range(5)
            ],
            "teams": [
                {"id": f"team_{i}", "name": f"Test Team {i}"}
                for i in range(3)
            ],
            "matches": [
                {"id": f"match_{i}", "name": f"Test Match {i}"}
                for i in range(4)
            ]
        },
        "total_count": 12
    }


# User fixtures
@pytest.fixture
def sample_user():
    """Generate a sample user."""
    return {
        "id": f"user_{random.randint(1000, 9999)}",
        "username": f"user_{random.randint(1, 1000)}",
        "email": f"user{random.randint(1, 1000)}@example.com",
        "role": random.choice(["user", "admin", "moderator"]),
        "preferences": {
            "theme": random.choice(["light", "dark"]),
            "notifications": random.choice([True, False]),
            "language": "en"
        },
        "created_at": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat()
    }


# Export fixtures
@pytest.fixture
def sample_export_data():
    """Generate sample export data."""
    return {
        "format": "csv",
        "type": "players",
        "data": [
            {
                "id": f"player_{i}",
                "name": f"Player {i}",
                "team": f"Team {i % 5}",
                "rating": round(0.8 + random.random() * 0.4, 2)
            }
            for i in range(50)
        ]
    }


# Error fixtures
@pytest.fixture
def sample_error_response():
    """Generate a sample error response."""
    return {
        "success": False,
        "error": {
            "code": 404,
            "message": "Resource not found",
            "details": "The requested resource does not exist"
        },
        "timestamp": datetime.now().isoformat()
    }


@pytest.fixture
def sample_validation_error():
    """Generate a sample validation error response."""
    return {
        "success": False,
        "error": {
            "code": 422,
            "message": "Validation failed",
            "details": {
                "field": "email",
                "error": "Invalid email format"
            }
        },
        "timestamp": datetime.now().isoformat()
    }
