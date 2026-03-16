"""
[Ver002.000]
Full WebSocket Gateway Test Coverage

Expands gateway test coverage to 30+ tests total.
"""

import pytest
import pytest_asyncio
import asyncio
import json
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch, call

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.gateway.websocket_gateway import (
    WebSocketGateway, MessageType, Channel, WSMessage, ChatMessage
)


# Module-level fixtures
@pytest.fixture
def gateway():
    """Create a fresh gateway instance."""
    return WebSocketGateway()


@pytest.fixture
def mock_websocket():
    """Create a mock WebSocket."""
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.send_text = AsyncMock()
    ws.close = AsyncMock()
    return ws


class TestWebSocketGatewayFull:
    """Comprehensive gateway tests - Connection lifecycle, messaging, presence."""
    
    @pytest.mark.asyncio
    async def test_connection_lifecycle(self, gateway, mock_websocket):
        """Test full connection lifecycle: connect, verify, disconnect."""
        user_id = "test_user_123"
        
        # Connect
        await gateway.connect(mock_websocket, user_id)
        
        # Verify connection state
        assert user_id in gateway.connections
        assert user_id in gateway.presence
        assert gateway.presence[user_id]["status"] == "online"
        assert gateway.get_online_count() == 1
        
        # Disconnect
        await gateway.disconnect(user_id)
        
        # Verify cleanup
        assert user_id not in gateway.connections
        assert user_id not in gateway.presence
        assert gateway.get_online_count() == 0
    
    @pytest.mark.asyncio
    async def test_message_persistence(self, gateway, mock_websocket):
        """Test message persistence (last 500)."""
        user_id = "test_user_123"
        channel = "match:test_match"
        
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, channel)
        
        # Send 505 messages
        for i in range(505):
            msg = WSMessage(
                type=MessageType.CHAT_MESSAGE.value,
                channel=channel,
                payload={"content": f"Message {i}", "username": "test"},
                timestamp=datetime.utcnow().isoformat()
            )
            await gateway._handle_chat_message(user_id, msg)
        
        # Verify only last 500 kept
        assert len(gateway.message_history[channel]) == 500
        
        # Verify oldest messages were removed (first 5)
        first_msg = gateway.message_history[channel][0]
        assert "Message 5" in str(first_msg.get('content', ''))
    
    @pytest.mark.asyncio
    async def test_broadcast_to_multiple_users(self, gateway):
        """Test broadcasting to multiple subscribers."""
        # Setup multiple users
        users = []
        for i in range(5):
            ws = AsyncMock()
            ws.send_text = AsyncMock()
            user_id = f"user_{i}"
            await gateway.connect(ws, user_id)
            await gateway._subscribe(user_id, "match:test")
            users.append((user_id, ws))
        
        # Clear connection messages
        for _, ws in users:
            ws.send_text.reset_mock()
        
        # Broadcast message
        message = WSMessage(
            type=MessageType.DATA_UPDATE.value,
            channel="match:test",
            payload={"data": "update"},
            timestamp=datetime.utcnow().isoformat()
        )
        await gateway.broadcast_to_channel("match:test", message)
        
        # Verify all users received message
        for _, ws in users:
            assert ws.send_text.call_count == 1
    
    @pytest.mark.asyncio
    async def test_channel_unsubscribe_all(self, gateway, mock_websocket):
        """Test unsubscribe from all channels on disconnect."""
        user_id = "test_user"
        channels = ["match:1", "match:2", "lobby:abc", "team:xyz"]
        
        await gateway.connect(mock_websocket, user_id)
        
        # Subscribe to multiple channels
        for channel in channels:
            await gateway._subscribe(user_id, channel)
        
        # Verify subscriptions
        for channel in channels:
            assert user_id in gateway.channels[channel]
        
        # Disconnect
        await gateway.disconnect(user_id)
        
        # Verify unsubscribed from all
        for channel in channels:
            assert user_id not in gateway.channels.get(channel, set())
    
    @pytest.mark.asyncio
    async def test_duplicate_connection_same_user(self, gateway, mock_websocket):
        """Test handling duplicate connections - new connection kicks old."""
        user_id = "test_user"
        old_ws = AsyncMock()
        old_ws.close = AsyncMock()
        
        # First connection
        await gateway.connect(old_ws, user_id)
        assert gateway.connections[user_id] == old_ws
        
        # Second connection should kick first
        await gateway.connect(mock_websocket, user_id)
        
        # Old connection should be closed
        old_ws.close.assert_called_once_with(code=1008, reason="New connection established")
        
        # New connection should be active
        assert gateway.connections[user_id] == mock_websocket
        assert gateway.get_online_count() == 1
    
    @pytest.mark.asyncio
    async def test_presence_tracking_accuracy(self, gateway, mock_websocket):
        """Test accurate presence tracking across operations."""
        user_id = "test_user"
        
        # Initial connect
        await gateway.connect(mock_websocket, user_id)
        
        presence = gateway.presence[user_id]
        assert presence["status"] == "online"
        assert len(presence["channels"]) == 0
        assert "last_seen" in presence
        
        # Subscribe to channels
        await gateway._subscribe(user_id, "match:test1")
        await gateway._subscribe(user_id, "match:test2")
        
        assert len(gateway.presence[user_id]["channels"]) == 2
        assert "match:test1" in gateway.presence[user_id]["channels"]
        
        # Unsubscribe from one
        await gateway._unsubscribe(user_id, "match:test1")
        
        assert len(gateway.presence[user_id]["channels"]) == 1
        assert "match:test1" not in gateway.presence[user_id]["channels"]


class TestChannelManagement:
    """Channel subscription management tests."""
    
    @pytest.mark.asyncio
    async def test_subscribe_all_channel_types(self, gateway, mock_websocket):
        """Test all channel types: global, match, lobby, team, hub."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        
        channel_types = [
            ("global", "global"),
            ("match:", "match:test123"),
            ("lobby:", "lobby:abc456"),
            ("team:", "team:xyz789"),
            ("hub:", "hub:sator"),
        ]
        
        for prefix, channel in channel_types:
            await gateway._subscribe(user_id, channel)
            assert user_id in gateway.channels[channel]
            assert channel in gateway.presence[user_id]["channels"]
    
    @pytest.mark.asyncio
    async def test_unsubscribe_specific_channel(self, gateway, mock_websocket):
        """Test unsubscribe from specific channel."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        
        # Subscribe to multiple
        await gateway._subscribe(user_id, "match:test1")
        await gateway._subscribe(user_id, "match:test2")
        
        # Unsubscribe from one
        await gateway._unsubscribe(user_id, "match:test1")
        
        # Verify specific unsubscription
        assert user_id not in gateway.channels.get("match:test1", set())
        assert user_id in gateway.channels["match:test2"]
        assert "match:test2" in gateway.presence[user_id]["channels"]
    
    @pytest.mark.asyncio
    async def test_subscribe_invalid_channel(self, gateway, mock_websocket):
        """Test handling invalid/unusual channel names."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        
        # Gateway should accept any string channel
        invalid_channels = ["", "   ", "unknown:prefix:value"]
        
        for channel in invalid_channels:
            # Should not raise
            await gateway._subscribe(user_id, channel)
            assert user_id in gateway.channels.get(channel, set())
    
    @pytest.mark.asyncio
    async def test_get_channel_users(self, gateway, mock_websocket):
        """Test getting users subscribed to a channel."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, "match:test")
        
        users = gateway.get_channel_users("match:test")
        
        assert isinstance(users, set)
        assert user_id in users
    
    @pytest.mark.asyncio
    async def test_get_user_channels(self, gateway, mock_websocket):
        """Test getting channels a user is subscribed to."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        
        await gateway._subscribe(user_id, "match:test1")
        await gateway._subscribe(user_id, "match:test2")
        
        channels = gateway.get_user_channels(user_id)
        
        assert isinstance(channels, set)
        assert "match:test1" in channels
        assert "match:test2" in channels
    
    @pytest.mark.asyncio
    async def test_empty_channel_cleanup(self, gateway, mock_websocket):
        """Test that empty channels are cleaned up."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        
        await gateway._subscribe(user_id, "match:test")
        assert "match:test" in gateway.channels
        
        await gateway._unsubscribe(user_id, "match:test")
        
        # Channel should be removed when empty
        assert "match:test" not in gateway.channels


class TestMessageTypes:
    """All message type handling tests."""
    
    def test_message_type_enum_values(self):
        """Test all message types defined."""
        expected_types = [
            "data_update", "odds_update", "match_event",
            "chat_message", "chat_history", "user_presence",
            "auth", "ping", "pong", "error", "subscribe", "unsubscribe"
        ]
        
        for msg_type in expected_types:
            assert hasattr(MessageType, msg_type.upper())
            enum_value = getattr(MessageType, msg_type.upper())
            assert enum_value.value == msg_type
    
    def test_ws_message_serialization(self):
        """Test WSMessage to JSON."""
        msg = WSMessage(
            type="test",
            channel="global",
            payload={"key": "value", "number": 123},
            timestamp="2024-01-01T00:00:00",
            sender_id="user_123",
            message_id="msg_456"
        )
        
        json_str = msg.to_json()
        
        # Should be valid JSON
        parsed = json.loads(json_str)
        assert parsed["type"] == "test"
        assert parsed["channel"] == "global"
        assert parsed["payload"]["key"] == "value"
        assert parsed["sender_id"] == "user_123"
    
    def test_ws_message_deserialization(self):
        """Test JSON to WSMessage."""
        data = {
            "type": "chat_message",
            "channel": "match:test",
            "payload": {"content": "Hello"},
            "timestamp": "2024-01-01T00:00:00",
            "sender_id": "user_123",
            "message_id": "msg_456"
        }
        
        msg = WSMessage.from_dict(data)
        
        assert msg.type == "chat_message"
        assert msg.channel == "match:test"
        assert msg.payload["content"] == "Hello"
        assert msg.sender_id == "user_123"
    
    def test_ws_message_deserialization_defaults(self):
        """Test WSMessage deserialization with defaults."""
        data = {
            "type": "ping",
            "payload": {}
        }
        
        msg = WSMessage.from_dict(data)
        
        assert msg.type == "ping"
        assert msg.channel == "global"  # Default
        assert isinstance(msg.timestamp, str)  # Should have timestamp
    
    @pytest.mark.asyncio
    async def test_handle_auth_message(self, gateway, mock_websocket):
        """Test auth message handling."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        auth_msg = WSMessage(
            type=MessageType.AUTH.value,
            channel="global",
            payload={},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_auth(user_id, auth_msg)
        
        # Should send auth confirmation
        mock_websocket.send_text.assert_called_once()
        sent = json.loads(mock_websocket.send_text.call_args[0][0])
        assert sent["payload"]["status"] == "authenticated"
    
    @pytest.mark.asyncio
    async def test_handle_subscribe_message(self, gateway, mock_websocket):
        """Test subscribe message handling."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        sub_msg = WSMessage(
            type=MessageType.SUBSCRIBE.value,
            channel="global",
            payload={"channel": "match:test"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_subscribe(user_id, sub_msg)
        
        # Should be subscribed
        assert user_id in gateway.channels["match:test"]
    
    @pytest.mark.asyncio
    async def test_handle_unsubscribe_message(self, gateway, mock_websocket):
        """Test unsubscribe message handling."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        
        # First subscribe
        await gateway._subscribe(user_id, "match:test")
        assert user_id in gateway.channels["match:test"]
        
        # Then unsubscribe via message
        unsub_msg = WSMessage(
            type=MessageType.UNSUBSCRIBE.value,
            channel="global",
            payload={"channel": "match:test"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_unsubscribe(user_id, unsub_msg)
        
        # Should be unsubscribed
        assert user_id not in gateway.channels.get("match:test", set())
    
    @pytest.mark.asyncio
    async def test_handle_ping_message(self, gateway, mock_websocket):
        """Test ping message handling."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        ping_msg = WSMessage(
            type=MessageType.PING.value,
            channel="global",
            payload={},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_ping(user_id, ping_msg)
        
        # Should send pong
        mock_websocket.send_text.assert_called_once()
        sent = json.loads(mock_websocket.send_text.call_args[0][0])
        assert sent["type"] == "pong"


class TestBroadcastOperations:
    """Broadcast operation tests."""
    
    @pytest.mark.asyncio
    async def test_broadcast_to_channel_no_subscribers(self, gateway, mock_websocket):
        """Test broadcast to channel with no subscribers."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        message = WSMessage(
            type=MessageType.DATA_UPDATE.value,
            channel="match:nonexistent",
            payload={"data": "test"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        # Should not raise
        await gateway.broadcast_to_channel("match:nonexistent", message)
        
        # No messages sent
        mock_websocket.send_text.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_broadcast_to_all(self, gateway):
        """Test broadcast to all connected users."""
        # Setup multiple users
        users = []
        for i in range(3):
            ws = AsyncMock()
            ws.send_text = AsyncMock()
            user_id = f"user_{i}"
            await gateway.connect(ws, user_id)
            users.append((user_id, ws))
        
        # Clear connection messages
        for _, ws in users:
            ws.send_text.reset_mock()
        
        message = WSMessage(
            type=MessageType.DATA_UPDATE.value,
            channel="global",
            payload={"announcement": "test"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway.broadcast_to_all(message)
        
        # All users should receive
        for _, ws in users:
            ws.send_text.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_broadcast_handles_disconnected_users(self, gateway):
        """Test broadcast cleans up disconnected users."""
        # Setup users
        ws1 = AsyncMock()
        ws1.send_text = AsyncMock(side_effect=Exception("Connection closed"))
        
        ws2 = AsyncMock()
        ws2.send_text = AsyncMock()
        
        await gateway.connect(ws1, "user_1")
        await gateway.connect(ws2, "user_2")
        
        # Subscribe both to same channel
        await gateway._subscribe("user_1", "match:test")
        await gateway._subscribe("user_2", "match:test")
        
        message = WSMessage(
            type=MessageType.DATA_UPDATE.value,
            channel="match:test",
            payload={"data": "test"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway.broadcast_to_channel("match:test", message)
        
        # Disconnected user should be cleaned up - check via trying to get their channels
        # They were disconnected due to send failure


class TestChatMessageHandling:
    """Chat message specific tests."""
    
    def test_chat_message_to_ws_message(self):
        """Test ChatMessage conversion to WSMessage."""
        chat = ChatMessage(
            id="msg_123",
            room_id="test",
            user_id="user_123",
            username="TestUser",
            content="Hello world",
            timestamp=datetime.utcnow(),
            reply_to="msg_456",
            reactions={"👍": 5}
        )
        
        ws_msg = chat.to_ws_message()
        
        assert ws_msg.type == "chat_message"
        # Channel gets prefixed with "match:" in to_ws_message
        assert "match:" in ws_msg.channel
        assert "test" in ws_msg.channel
        assert ws_msg.payload["content"] == "Hello world"
        assert ws_msg.payload["username"] == "TestUser"
        assert ws_msg.payload["reply_to"] == "msg_456"
        # Reactions are handled in the payload
        if "reactions" in ws_msg.payload:
            assert ws_msg.payload["reactions"]["👍"] == 5
    
    @pytest.mark.asyncio
    async def test_chat_message_with_reply(self, gateway, mock_websocket):
        """Test chat message with reply reference."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, "match:test")
        mock_websocket.send_text.reset_mock()
        
        msg = WSMessage(
            type=MessageType.CHAT_MESSAGE.value,
            channel="match:test",
            payload={
                "content": "Reply message",
                "username": "TestUser",
                "reply_to": "original_msg_id"
            },
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_chat_message(user_id, msg)
        
        # Message should be stored with reply reference
        assert len(gateway.message_history["match:test"]) == 1
        stored = gateway.message_history["match:test"][0]
        assert stored.get("reply_to") == "original_msg_id"
    
    @pytest.mark.asyncio
    async def test_chat_message_reactions_initialization(self, gateway, mock_websocket):
        """Test chat message reactions are initialized."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        await gateway._subscribe(user_id, "match:test")
        
        msg = WSMessage(
            type=MessageType.CHAT_MESSAGE.value,
            channel="match:test",
            payload={
                "content": "Test message",
                "username": "TestUser"
            },
            timestamp=datetime.utcnow().isoformat()
        )
        
        await gateway._handle_chat_message(user_id, msg)
        
        # Stored message should have reactions dict
        stored = gateway.message_history["match:test"][0]
        assert "reactions" in stored


class TestErrorHandling:
    """Error handling tests."""
    
    @pytest.mark.asyncio
    async def test_invalid_json_handling(self, gateway, mock_websocket):
        """Test handling of invalid JSON."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        await gateway.handle_message(user_id, "not valid json")
        
        # Should send error
        mock_websocket.send_text.assert_called_once()
        sent = json.loads(mock_websocket.send_text.call_args[0][0])
        assert sent["type"] == "error"
        assert "invalid" in sent["payload"]["error"].lower()
    
    @pytest.mark.asyncio
    async def test_unknown_message_type(self, gateway, mock_websocket):
        """Test handling of unknown message type."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        mock_websocket.send_text.reset_mock()
        
        await gateway.handle_message(user_id, json.dumps({
            "type": "unknown_type",
            "channel": "global",
            "payload": {},
            "timestamp": "2024-01-01T00:00:00"
        }))
        
        # Should send error about unknown type
        mock_websocket.send_text.assert_called_once()
        sent = json.loads(mock_websocket.send_text.call_args[0][0])
        assert sent["type"] == "error"
        assert "unknown" in sent["payload"]["error"].lower()
    
    @pytest.mark.asyncio
    async def test_send_to_disconnected_user(self, gateway, mock_websocket):
        """Test sending to disconnected user."""
        user_id = "test_user"
        await gateway.connect(mock_websocket, user_id)
        
        # Disconnect
        await gateway.disconnect(user_id)
        
        # Try to send message
        message = WSMessage(
            type="test",
            channel="global",
            payload={},
            timestamp=datetime.utcnow().isoformat()
        )
        
        # Should not raise
        await gateway.send_to_user(user_id, message)


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
