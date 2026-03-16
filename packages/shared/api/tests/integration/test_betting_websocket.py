"""
[Ver002.000]
Betting + WebSocket Integration Tests

Tests for odds updates broadcast via WebSocket and live match data flow.
"""

import pytest
import asyncio
import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.betting.odds_engine import OddsEngine, MatchContext, TeamFactors, HeadToHead, OddsResult
from src.gateway.websocket_gateway import WebSocketGateway, MessageType, WSMessage


class TestOddsUpdateBroadcasts:
    """Odds update broadcasting via WebSocket tests."""
    
    @pytest.fixture
    def odds_engine(self):
        """Create odds engine with mocked dependencies."""
        mock_db = AsyncMock()
        mock_pandascore = AsyncMock()
        return OddsEngine(db_pool=mock_db, pandascore_client=mock_pandascore)
    
    @pytest.fixture
    def gateway(self):
        """Create fresh WebSocket gateway."""
        return WebSocketGateway()
    
    @pytest.fixture
    def mock_websocket(self):
        """Create mock WebSocket."""
        ws = AsyncMock()
        ws.accept = AsyncMock()
        ws.send_text = AsyncMock()
        return ws
    
    @pytest.mark.asyncio
    async def test_odds_update_broadcasts_via_websocket(self, odds_engine, gateway, mock_websocket):
        """Test that odds updates are broadcast to WebSocket subscribers."""
        # Setup user
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, "match:test_match")
        
        # Clear connection message
        mock_websocket.send_text.reset_mock()
        
        # Calculate odds
        context = MatchContext(
            match_id="test_match",
            team_a_id="team_a",
            team_b_id="team_b",
            game="valorant"
        )
        odds_result = await odds_engine.calculate_odds(context, is_live=False)
        
        # Broadcast odds update
        odds_update = WSMessage(
            type=MessageType.ODDS_UPDATE.value,
            channel="match:test_match",
            payload={
                "match_id": odds_result.match_id,
                "team_a_decimal": odds_result.team_a_decimal,
                "team_b_decimal": odds_result.team_b_decimal,
                "team_a_probability": odds_result.team_a_probability,
                "team_b_probability": odds_result.team_b_probability,
                "vig_percentage": odds_result.vig_percentage,
                "confidence_score": odds_result.confidence_score,
                "last_updated": odds_result.last_updated.isoformat()
            },
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await gateway.broadcast_to_channel("match:test_match", odds_update)
        
        # Verify broadcast received
        mock_websocket.send_text.assert_called_once()
        sent_data = json.loads(mock_websocket.send_text.call_args[0][0])
        assert sent_data["type"] == "odds_update"
        assert sent_data["payload"]["match_id"] == "test_match"
    
    @pytest.mark.asyncio
    async def test_live_match_updates_real_time(self, odds_engine, gateway, mock_websocket):
        """Test live match data flows through WebSocket."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, "match:live_match")
        mock_websocket.send_text.reset_mock()
        
        # Calculate live odds
        context = MatchContext(
            match_id="live_match",
            team_a_id="team_a",
            team_b_id="team_b",
            game="valorant",
            match_type="bo3"
        )
        
        odds_result = await odds_engine.calculate_odds(
            context, 
            is_live=True,
            current_score={"team_a": 1, "team_b": 0}
        )
        
        # Broadcast match event
        match_event = WSMessage(
            type=MessageType.MATCH_EVENT.value,
            channel="match:live_match",
            payload={
                "event_type": "round_end",
                "match_id": "live_match",
                "score": {"team_a": 1, "team_b": 0},
                "odds": {
                    "team_a_decimal": odds_result.team_a_decimal,
                    "team_b_decimal": odds_result.team_b_decimal
                }
            },
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await gateway.broadcast_to_channel("match:live_match", match_event)
        
        # Verify event received
        mock_websocket.send_text.assert_called_once()
        sent_data = json.loads(mock_websocket.send_text.call_args[0][0])
        assert sent_data["type"] == "match_event"
        assert sent_data["payload"]["event_type"] == "round_end"
    
    @pytest.mark.asyncio
    async def test_multiple_subscribers_receive_odds_updates(self, odds_engine, gateway):
        """Test multiple subscribers receive odds updates."""
        # Setup multiple users
        users = []
        for i in range(3):
            ws = AsyncMock()
            ws.send_text = AsyncMock()
            user_id = f"user_{i}"
            await gateway.connect(ws, user_id)
            await gateway._subscribe(user_id, "match:multi_test")
            users.append((user_id, ws))
        
        # Clear connection messages
        for _, ws in users:
            ws.send_text.reset_mock()
        
        # Broadcast odds update
        odds_update = WSMessage(
            type=MessageType.ODDS_UPDATE.value,
            channel="match:multi_test",
            payload={
                "match_id": "multi_test",
                "team_a_decimal": 1.85,
                "team_b_decimal": 2.10
            },
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await gateway.broadcast_to_channel("match:multi_test", odds_update)
        
        # All users should receive
        for _, ws in users:
            ws.send_text.assert_called_once()
            sent_data = json.loads(ws.send_text.call_args[0][0])
            assert sent_data["type"] == "odds_update"
    
    @pytest.mark.asyncio
    async def test_unsubscribed_user_does_not_receive(self, odds_engine, gateway):
        """Test unsubscribed users don't receive odds updates."""
        # Setup subscribed user
        subscribed_ws = AsyncMock()
        subscribed_ws.send_text = AsyncMock()
        await gateway.connect(subscribed_ws, "subscribed_user")
        await gateway._subscribe("subscribed_user", "match:private")
        
        # Setup unsubscribed user
        unsubscribed_ws = AsyncMock()
        unsubscribed_ws.send_text = AsyncMock()
        await gateway.connect(unsubscribed_ws, "unsubscribed_user")
        # Not subscribing to the channel
        
        # Clear connection messages
        subscribed_ws.send_text.reset_mock()
        unsubscribed_ws.send_text.reset_mock()
        
        # Broadcast odds update
        odds_update = WSMessage(
            type=MessageType.ODDS_UPDATE.value,
            channel="match:private",
            payload={"match_id": "private", "odds": "1.90"},
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await gateway.broadcast_to_channel("match:private", odds_update)
        
        # Only subscribed user should receive
        subscribed_ws.send_text.assert_called_once()
        unsubscribed_ws.send_text.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_odds_broadcast_with_cash_out_update(self, odds_engine, gateway, mock_websocket):
        """Test cash out availability broadcast via WebSocket."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, "match:cashout_test")
        mock_websocket.send_text.reset_mock()
        
        # Calculate live odds with cash out
        context = MatchContext(
            match_id="cashout_test",
            team_a_id="team_a",
            team_b_id="team_b",
            game="valorant"
        )
        
        odds_result = await odds_engine.calculate_odds(
            context, 
            is_live=True,
            current_score={"team_a": 1, "team_b": 0}
        )
        
        # Broadcast with cash out info
        cashout_update = WSMessage(
            type=MessageType.ODDS_UPDATE.value,
            channel="match:cashout_test",
            payload={
                "match_id": "cashout_test",
                "cash_out_available": odds_result.cash_out_available,
                "cash_out_multiplier": odds_result.cash_out_multiplier,
                "odds": {
                    "team_a": odds_result.team_a_decimal,
                    "team_b": odds_result.team_b_decimal
                }
            },
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await gateway.broadcast_to_channel("match:cashout_test", cashout_update)
        
        # Verify cash out info received
        mock_websocket.send_text.assert_called_once()
        sent_data = json.loads(mock_websocket.send_text.call_args[0][0])
        assert sent_data["payload"]["cash_out_available"] is True


class TestLiveMatchIntegration:
    """Live match data flow integration tests."""
    
    @pytest.fixture
    def odds_engine(self):
        mock_db = AsyncMock()
        mock_pandascore = AsyncMock()
        return OddsEngine(db_pool=mock_db, pandascore_client=mock_pandascore)
    
    @pytest.fixture
    def gateway(self):
        return WebSocketGateway()
    
    @pytest.mark.asyncio
    async def test_live_odds_changes_trigger_websocket_update(self, odds_engine, gateway):
        """Test live odds changes trigger WebSocket broadcasts."""
        # Setup user
        ws = AsyncMock()
        ws.send_text = AsyncMock()
        await gateway.connect(ws, "live_user")
        await gateway._subscribe("live_user", "match:live_updates")
        ws.send_text.reset_mock()
        
        context = MatchContext(
            match_id="live_updates",
            team_a_id="team_a",
            team_b_id="team_b",
            game="valorant",
            match_type="bo3"
        )
        
        # Initial odds
        initial_odds = await odds_engine.calculate_odds(
            context, is_live=True, current_score={"team_a": 0, "team_b": 0}
        )
        
        # Updated odds after score change
        updated_odds = await odds_engine.calculate_odds(
            context, is_live=True, current_score={"team_a": 1, "team_b": 0}
        )
        
        # Broadcast update
        update = WSMessage(
            type=MessageType.ODDS_UPDATE.value,
            channel="match:live_updates",
            payload={
                "match_id": "live_updates",
                "previous_odds": {
                    "team_a": initial_odds.team_a_decimal,
                    "team_b": initial_odds.team_b_decimal
                },
                "current_odds": {
                    "team_a": updated_odds.team_a_decimal,
                    "team_b": updated_odds.team_b_decimal
                },
                "score_change": {"team_a": 1, "team_b": 0}
            },
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await gateway.broadcast_to_channel("match:live_updates", update)
        
        # Verify update received
        ws.send_text.assert_called_once()
        sent_data = json.loads(ws.send_text.call_args[0][0])
        assert "previous_odds" in sent_data["payload"]
        assert "current_odds" in sent_data["payload"]
    
    @pytest.mark.asyncio
    async def test_match_end_broadcast(self, odds_engine, gateway):
        """Test match end event broadcast."""
        ws = AsyncMock()
        ws.send_text = AsyncMock()
        await gateway.connect(ws, "user")
        await gateway._subscribe("user", "match:ended_match")
        ws.send_text.reset_mock()
        
        # Broadcast match end
        match_end = WSMessage(
            type=MessageType.MATCH_EVENT.value,
            channel="match:ended_match",
            payload={
                "event_type": "match_end",
                "match_id": "ended_match",
                "final_score": {"team_a": 2, "team_b": 1},
                "winner": "team_a"
            },
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await gateway.broadcast_to_channel("match:ended_match", match_end)
        
        ws.send_text.assert_called_once()
        sent_data = json.loads(ws.send_text.call_args[0][0])
        assert sent_data["payload"]["event_type"] == "match_end"
        assert sent_data["payload"]["winner"] == "team_a"


class TestBettingGatewayEdgeCases:
    """Edge cases for betting + gateway integration."""
    
    @pytest.fixture
    def odds_engine(self):
        mock_db = AsyncMock()
        mock_pandascore = AsyncMock()
        return OddsEngine(db_pool=mock_db, pandascore_client=mock_pandascore)
    
    @pytest.fixture
    def gateway(self):
        return WebSocketGateway()
    
    @pytest.mark.asyncio
    async def test_odds_broadcast_after_disconnect(self, odds_engine, gateway):
        """Test broadcast behavior after user disconnect."""
        ws = AsyncMock()
        ws.send_text = AsyncMock()
        
        await gateway.connect(ws, "temp_user")
        await gateway._subscribe("temp_user", "match:temp")
        
        # User disconnects
        await gateway.disconnect("temp_user")
        
        # Try to broadcast
        update = WSMessage(
            type=MessageType.ODDS_UPDATE.value,
            channel="match:temp",
            payload={"match_id": "temp", "odds": "1.90"},
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        # Should not raise error
        await gateway.broadcast_to_channel("match:temp", update)
        
        # No message sent (user disconnected)
        # This is expected behavior - disconnected users don't receive messages
    
    @pytest.mark.asyncio
    async def test_large_odds_payload_broadcast(self, odds_engine, gateway):
        """Test broadcasting large odds payloads."""
        ws = AsyncMock()
        ws.send_text = AsyncMock()
        
        await gateway.connect(ws, "user")
        await gateway._subscribe("user", "match:large_payload")
        ws.send_text.reset_mock()
        
        # Create large payload with full odds data
        large_payload = {
            "match_id": "large_payload",
            "odds": {
                "team_a_decimal": 1.85,
                "team_b_decimal": 2.10,
                "team_a_american": -118,
                "team_b_american": 110,
                "team_a_probability": 0.54,
                "team_b_probability": 0.476,
            },
            "factors": {
                "team_a": {"win_rate": 0.65, "form": 0.70},
                "team_b": {"win_rate": 0.55, "form": 0.60}
            },
            "history": [f"entry_{i}" for i in range(100)]  # Large list
        }
        
        update = WSMessage(
            type=MessageType.ODDS_UPDATE.value,
            channel="match:large_payload",
            payload=large_payload,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await gateway.broadcast_to_channel("match:large_payload", update)
        
        # Should be called with large payload
        ws.send_text.assert_called_once()
        sent_json = ws.send_text.call_args[0][0]
        sent_data = json.loads(sent_json)
        assert len(sent_data["payload"]["history"]) == 100


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
