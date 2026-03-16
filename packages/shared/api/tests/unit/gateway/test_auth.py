"""
[Ver001.000]
Critical WebSocket Authentication Tests
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from fastapi import WebSocket

# Import the gateway module
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.gateway.websocket_gateway import WebSocketGateway, WSMessage, MessageType


class TestWebSocketAuth:
    """Critical WebSocket authentication tests."""
    
    @pytest.fixture
    def gateway(self):
        """Create a fresh gateway instance."""
        return WebSocketGateway()
    
    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket."""
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_text = AsyncMock()
        ws.close = AsyncMock()
        return ws
    
    @pytest.mark.asyncio
    async def test_websocket_connection_established(self, gateway, mock_websocket):
        """WebSocket connection is established and tracked."""
        user_id = "test_user_123"
        
        # Connect
        await gateway.connect(mock_websocket, user_id)
        
        # Verify connection accepted
        mock_websocket.accept.assert_called_once()
        
        # Verify user tracked
        assert user_id in gateway.connections
        assert gateway.connections[user_id] == mock_websocket
        assert user_id in gateway.presence
        assert gateway.presence[user_id]["status"] == "online"
    
    @pytest.mark.asyncio
    async def test_websocket_duplicate_connection_kicked(self, gateway, mock_websocket):
        """Duplicate connection kicks old connection."""
        user_id = "test_user_123"
        old_ws = AsyncMock(spec=WebSocket)
        old_ws.close = AsyncMock()
        
        # First connection
        await gateway.connect(old_ws, user_id)
        
        # Second connection should kick first
        await gateway.connect(mock_websocket, user_id)
        
        # Old connection should be closed
        old_ws.close.assert_called_once_with(code=1008, reason="New connection established")
        
        # New connection should be active
        assert gateway.connections[user_id] == mock_websocket
    
    @pytest.mark.asyncio
    async def test_websocket_disconnect_cleans_up(self, gateway, mock_websocket):
        """Disconnect removes user from all channels and tracking."""
        user_id = "test_user_123"
        
        # Connect and subscribe
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, "match:test_123")
        
        # Disconnect
        await gateway.disconnect(user_id)
        
        # Verify cleanup
        assert user_id not in gateway.connections
        assert user_id not in gateway.presence
        assert user_id not in gateway.channels.get("match:test_123", set())
    
    @pytest.mark.asyncio
    async def test_websocket_auth_message_handled(self, gateway, mock_websocket):
        """Auth message type is properly handled."""
        user_id = "test_user_123"
        
        await gateway.connect(mock_websocket, user_id)
        
        # Send auth message
        auth_msg = WSMessage(
            type=MessageType.AUTH.value,
            channel="global",
            payload={},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_auth(user_id, auth_msg)
        
        # Verify auth confirmation sent
        mock_websocket.send_text.assert_called()
        sent_message = mock_websocket.send_text.call_args[0][0]
        assert "authenticated" in sent_message
    
    @pytest.mark.asyncio
    async def test_websocket_invalid_json_rejected(self, gateway, mock_websocket):
        """Invalid JSON messages are rejected with error."""
        user_id = "test_user_123"
        
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        # Send invalid JSON
        await gateway.handle_message(user_id, "not valid json{{{")
        
        # Verify error sent
        mock_websocket.send_text.assert_called_once()
        sent_message = mock_websocket.send_text.call_args[0][0]
        assert "error" in sent_message.lower()
    
    @pytest.mark.asyncio
    async def test_websocket_unknown_message_type_warned(self, gateway, mock_websocket):
        """Unknown message types return error."""
        user_id = "test_user_123"
        
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        # Send unknown message type
        await gateway.handle_message(user_id, '{"type": "unknown_type", "channel": "global", "payload": {}, "timestamp": "2024-01-01T00:00:00"}')
        
        # Verify error sent
        mock_websocket.send_text.assert_called_once()
        sent_message = mock_websocket.send_text.call_args[0][0]
        assert "unknown" in sent_message.lower()
    
    @pytest.mark.asyncio
    async def test_websocket_ping_pong(self, gateway, mock_websocket):
        """Ping messages receive pong response."""
        user_id = "test_user_123"
        
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        # Send ping
        ping_msg = WSMessage(
            type=MessageType.PING.value,
            channel="global",
            payload={},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_ping(user_id, ping_msg)
        
        # Verify pong sent
        mock_websocket.send_text.assert_called_once()
        sent_message = mock_websocket.send_text.call_args[0][0]
        assert "pong" in sent_message.lower()


class TestWebSocketChannelSecurity:
    """WebSocket channel subscription security tests."""
    
    @pytest.fixture
    def gateway(self):
        return WebSocketGateway()
    
    @pytest.fixture
    def mock_websocket(self):
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_text = AsyncMock()
        return ws
    
    @pytest.mark.asyncio
    async def test_channel_subscription_tracked(self, gateway, mock_websocket):
        """Channel subscriptions are properly tracked."""
        user_id = "user_1"
        channel = "match:test_match"
        
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, channel)
        
        assert user_id in gateway.channels[channel]
        assert channel in gateway.presence[user_id]["channels"]
    
    @pytest.mark.asyncio
    async def test_channel_unsubscription_removes_user(self, gateway, mock_websocket):
        """Unsubscribe removes user from channel."""
        user_id = "user_1"
        channel = "match:test_match"
        
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, channel)
        await gateway._unsubscribe(user_id, channel)
        
        assert user_id not in gateway.channels.get(channel, set())
        assert channel not in gateway.presence[user_id]["channels"]
    
    @pytest.mark.asyncio
    async def test_broadcast_to_channel_only_subscribers(self, gateway, mock_websocket):
        """Broadcast only reaches subscribed users."""
        # Setup user 1
        ws1 = AsyncMock(spec=WebSocket)
        ws1.send_text = AsyncMock()
        user1 = "user_1"
        
        # Setup user 2
        ws2 = AsyncMock(spec=WebSocket)
        ws2.send_text = AsyncMock()
        user2 = "user_2"
        
        # Connect both
        await gateway.connect(ws1, user1)
        await gateway.connect(ws2, user2)
        
        # Clear the connection/auth messages
        ws1.send_text.reset_mock()
        ws2.send_text.reset_mock()
        
        # Only user1 subscribes to channel
        channel = "match:test_match"
        await gateway._subscribe(user1, channel)
        
        # Broadcast message
        message = WSMessage(
            type=MessageType.DATA_UPDATE.value,
            channel=channel,
            payload={"data": "test"},
            timestamp=datetime.utcnow().isoformat()
        )
        await gateway.broadcast_to_channel(channel, message)
        
        # Only user1 should receive the data update
        ws1.send_text.assert_called_once()
        ws2.send_text.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_empty_channel_cleanup(self, gateway, mock_websocket):
        """Empty channels are cleaned up."""
        user_id = "user_1"
        channel = "match:test_match"
        
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, channel)
        
        assert channel in gateway.channels
        
        await gateway._unsubscribe(user_id, channel)
        
        # Channel should be removed when empty
        assert channel not in gateway.channels


class TestWebSocketMessageValidation:
    """WebSocket message validation tests."""
    
    @pytest.fixture
    def gateway(self):
        return WebSocketGateway()
    
    @pytest.fixture
    def mock_websocket(self):
        ws = AsyncMock(spec=WebSocket)
        ws.accept = AsyncMock()
        ws.send_text = AsyncMock()
        return ws
    
    @pytest.mark.asyncio
    async def test_chat_message_too_long_rejected(self, gateway, mock_websocket):
        """Chat messages over 2000 characters are rejected."""
        user_id = "user_1"
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        # Create oversized message
        long_content = "x" * 2001
        
        msg = WSMessage(
            type=MessageType.CHAT_MESSAGE.value,
            channel="match:test",
            payload={"content": long_content, "username": "test"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_chat_message(user_id, msg)
        
        # Should send error
        mock_websocket.send_text.assert_called_once()
        sent_message = mock_websocket.send_text.call_args[0][0]
        assert "too long" in sent_message.lower() or "error" in sent_message.lower()
    
    @pytest.mark.asyncio
    async def test_chat_message_empty_rejected(self, gateway, mock_websocket):
        """Empty chat messages are rejected."""
        user_id = "user_1"
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        msg = WSMessage(
            type=MessageType.CHAT_MESSAGE.value,
            channel="match:test",
            payload={"content": "", "username": "test"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_chat_message(user_id, msg)
        
        # Should send error
        mock_websocket.send_text.assert_called_once()
        sent_message = mock_websocket.send_text.call_args[0][0]
        assert "error" in sent_message.lower()
    
    @pytest.mark.asyncio
    async def test_valid_chat_message_broadcast(self, gateway, mock_websocket):
        """Valid chat messages are broadcast to channel."""
        user_id = "user_1"
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, "match:test_match")
        mock_websocket.send_text.reset_mock()
        
        msg = WSMessage(
            type=MessageType.CHAT_MESSAGE.value,
            channel="match:test_match",
            payload={"content": "Hello world!", "username": "test_user"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_chat_message(user_id, msg)
        
        # Should broadcast (mock websocket is both sender and subscriber)
        assert mock_websocket.send_text.called


class TestWebSocketGatewaySingleton:
    """WebSocket gateway singleton tests."""
    
    def test_gateway_singleton_exists(self):
        """Gateway singleton instance exists."""
        from src.gateway.websocket_gateway import gateway
        assert gateway is not None
        assert isinstance(gateway, WebSocketGateway)
    
    def test_gateway_tracks_connections(self):
        """Gateway tracks connection count."""
        from src.gateway.websocket_gateway import gateway
        count = gateway.get_online_count()
        assert isinstance(count, int)
        assert count >= 0


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
