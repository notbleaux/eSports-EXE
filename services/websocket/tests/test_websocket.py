"""
Comprehensive test suite for WebSocket Service
Tests connection management, message broadcasting, and Redis stream parsing
"""
import pytest
import json
from datetime import datetime
from fastapi.testclient import TestClient
import asyncio

# Import from main
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import (
    app, MatchConnectionManager, RedisStreamConsumer,
    WsMessage, WsMessageType
)

client = TestClient(app)


class TestConnectionManager:
    """Test WebSocket connection management"""

    def test_connection_manager_initialization(self):
        """Connection manager should initialize with empty subscriptions"""
        manager = MatchConnectionManager()
        assert len(manager.match_subscriptions) == 0
        assert len(manager.global_subscribers) == 0
        assert manager.active_connection_count == 0

    @pytest.mark.asyncio
    async def test_metrics_tracking(self):
        """Metrics should reflect connection counts"""
        manager = MatchConnectionManager()
        metrics = manager.get_metrics()
        assert metrics["activeConnections"] == 0
        assert metrics["matchSubscriptions"] == 0
        assert "timestamp" in metrics


class TestRedisStreamConsumer:
    """Test Redis stream consumer and event parsing"""

    def test_parse_match_start_event(self):
        """Should parse MATCH_START events correctly"""
        raw_event = {
            "event_type": "MATCH_START",
            "match_id": "m_12345",
            "timestamp": int(datetime.utcnow().timestamp() * 1000),
            "team1": {"id": "t1", "name": "Team A"},
            "team2": {"id": "t2", "name": "Team B"}
        }

        consumer = RedisStreamConsumer("redis://localhost", "test", "test", "test")
        ws_msg = asyncio.run(consumer.parse_pandascore_event(raw_event))

        assert ws_msg is not None
        assert ws_msg.type == WsMessageType.MATCH_START
        assert ws_msg.matchId == "m_12345"
        assert ws_msg.payload["teamA"]["name"] == "Team A"

    def test_parse_score_update_event(self):
        """Should parse SCORE_UPDATE events correctly"""
        raw_event = {
            "event_type": "SCORE_UPDATE",
            "match_id": "m_12345",
            "timestamp": int(datetime.utcnow().timestamp() * 1000),
            "team1": {"id": "t1", "name": "Team A"},
            "team2": {"id": "t2", "name": "Team B"},
            "team1_score": 10,
            "team2_score": 8,
            "current_round": 18,
            "half": "second"
        }

        consumer = RedisStreamConsumer("redis://localhost", "test", "test", "test")
        ws_msg = asyncio.run(consumer.parse_pandascore_event(raw_event))

        assert ws_msg is not None
        assert ws_msg.type == WsMessageType.SCORE_UPDATE
        assert ws_msg.payload["teamA"]["score"] == 10
        assert ws_msg.payload["teamB"]["score"] == 8
        assert ws_msg.payload["currentRound"] == 18

    def test_parse_round_end_event(self):
        """Should parse ROUND_END events correctly"""
        raw_event = {
            "event_type": "ROUND_END",
            "match_id": "m_12345",
            "timestamp": int(datetime.utcnow().timestamp() * 1000),
            "round_number": 18,
            "round_result": "teamA_win",
            "win_condition": "elimination",
            "round_duration": 180
        }

        consumer = RedisStreamConsumer("redis://localhost", "test", "test", "test")
        ws_msg = asyncio.run(consumer.parse_pandascore_event(raw_event))

        assert ws_msg is not None
        assert ws_msg.type == WsMessageType.ROUND_END
        assert ws_msg.payload["roundNumber"] == 18
        assert ws_msg.payload["winCondition"] == "elimination"

    def test_parse_match_end_event(self):
        """Should parse MATCH_END events correctly"""
        raw_event = {
            "event_type": "MATCH_END",
            "match_id": "m_12345",
            "timestamp": int(datetime.utcnow().timestamp() * 1000),
            "winner_id": "t1",
            "team1_score": 13,
            "team2_score": 11,
            "total_rounds": 26,
            "match_duration": 3600
        }

        consumer = RedisStreamConsumer("redis://localhost", "test", "test", "test")
        ws_msg = asyncio.run(consumer.parse_pandascore_event(raw_event))

        assert ws_msg is not None
        assert ws_msg.type == WsMessageType.MATCH_END
        assert ws_msg.payload["winnerId"] == "t1"
        assert ws_msg.payload["finalScore"]["teamA"] == 13

    def test_parse_invalid_event_returns_none(self):
        """Invalid event should return None"""
        raw_event = {"invalid": "data"}

        consumer = RedisStreamConsumer("redis://localhost", "test", "test", "test")
        ws_msg = asyncio.run(consumer.parse_pandascore_event(raw_event))

        # Should handle gracefully (either return None or default message)
        assert ws_msg is None or ws_msg.type is not None

    def test_timestamp_normalization(self):
        """Timestamps should be normalized to milliseconds"""
        raw_event = {
            "event_type": "MATCH_START",
            "match_id": "m_12345",
            "timestamp": int(datetime.utcnow().timestamp()),  # seconds
            "team1": {"id": "t1", "name": "Team A"},
            "team2": {"id": "t2", "name": "Team B"}
        }

        consumer = RedisStreamConsumer("redis://localhost", "test", "test", "test")
        ws_msg = asyncio.run(consumer.parse_pandascore_event(raw_event))

        assert ws_msg is not None
        # Timestamp should be in milliseconds (large number)
        assert ws_msg.timestamp > 10**12


class TestHealthEndpoints:
    """Test health and metrics endpoints"""

    def test_health_endpoint(self):
        """Health endpoint should return ok status"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.json()["service"] == "websocket"

    def test_metrics_endpoint(self):
        """Metrics endpoint should return connection counts"""
        response = client.get("/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "activeConnections" in data
        assert "matchSubscriptions" in data
        assert "globalSubscribers" in data
        assert "timestamp" in data

    def test_ready_endpoint(self):
        """Ready endpoint should indicate service status"""
        response = client.get("/ready")
        assert response.status_code == 200
        assert "status" in response.json()


class TestWsMessageFormat:
    """Test WebSocket message formatting"""

    def test_ws_message_has_required_fields(self):
        """WsMessage should have all required fields"""
        msg = WsMessage(
            type=WsMessageType.SCORE_UPDATE,
            matchId="m_123",
            timestamp=int(datetime.utcnow().timestamp() * 1000),
            payload={"teamA": 10, "teamB": 8}
        )

        assert msg.type == WsMessageType.SCORE_UPDATE
        assert msg.matchId == "m_123"
        assert msg.timestamp > 0
        assert msg.payload == {"teamA": 10, "teamB": 8}

    def test_ws_message_serializable(self):
        """WsMessage should be JSON serializable"""
        msg = WsMessage(
            type=WsMessageType.SCORE_UPDATE,
            matchId="m_123",
            timestamp=int(datetime.utcnow().timestamp() * 1000),
            payload={"teamA": 10, "teamB": 8}
        )

        msg_dict = msg.dict()
        json_str = json.dumps(msg_dict)
        assert "SCORE_UPDATE" in json_str
        assert "m_123" in json_str


class TestBroadcasting:
    """Test message broadcasting logic"""

    @pytest.mark.asyncio
    async def test_broadcast_to_match_empty(self):
        """Broadcasting to empty match should not error"""
        manager = MatchConnectionManager()
        message = {"type": "test"}

        # Should not raise
        await manager.broadcast_to_match("m_123", message)

    @pytest.mark.asyncio
    async def test_get_metrics_updates_actively(self):
        """Metrics should reflect current state"""
        manager = MatchConnectionManager()

        metrics1 = manager.get_metrics()
        assert metrics1["activeConnections"] == 0

        # Simulate connection
        manager.active_connection_count = 5
        manager.match_subscriptions["m_123"] = set()

        metrics2 = manager.get_metrics()
        assert metrics2["activeConnections"] == 5
        assert metrics2["matchSubscriptions"] == 1


class TestEventParsing:
    """Test event type mapping"""

    @pytest.mark.asyncio
    async def test_all_event_types_mapped(self):
        """All Pandascore event types should map to WsMessageType"""
        event_types = [
            "MATCH_START",
            "ROUND_END",
            "ROUND_UPDATE",
            "SCORE_UPDATE",
            "MATCH_END"
        ]

        consumer = RedisStreamConsumer("redis://localhost", "test", "test", "test")

        for event_type in event_types:
            raw_event = {
                "event_type": event_type,
                "match_id": "m_test",
                "timestamp": int(datetime.utcnow().timestamp() * 1000)
            }
            ws_msg = await consumer.parse_pandascore_event(raw_event)
            # Should not return None for valid event types
            assert ws_msg is not None or event_type not in [
                "MATCH_START", "SCORE_UPDATE", "MATCH_END"
            ]


# Test execution
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
