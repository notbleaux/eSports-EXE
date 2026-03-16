"""
[Ver002.000]
Push Notification Service Tests

Comprehensive tests for VAPID key management and push service functionality.
"""

import pytest
import pytest_asyncio
import base64
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch, Mock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.notifications.push_service import VAPIDKeyManager, PushService, PYWEBPUSH_AVAILABLE
from src.notifications.models import (
    PushSubscription, PushSubscriptionKeys, PushMessage, 
    NotificationPreference, NotificationCategory, NotificationLog
)


class TestVAPIDKeyManager:
    """VAPID key generation and management tests."""
    
    def test_generate_vapid_keys(self):
        """Test VAPID key pair generation."""
        manager = VAPIDKeyManager()
        public_key, private_key = manager.generate_keys()
        
        # Keys should be non-empty strings
        assert isinstance(public_key, str)
        assert isinstance(private_key, str)
        assert len(public_key) > 0
        assert len(private_key) > 0
        
        # Public key should be base64url encoded
        assert '=' not in public_key  # base64url doesn't use padding
        
    def test_vapid_keys_unique(self):
        """Test each generation produces unique keys."""
        manager1 = VAPIDKeyManager()
        manager2 = VAPIDKeyManager()
        
        pub1, priv1 = manager1.generate_keys()
        pub2, priv2 = manager2.generate_keys()
        
        # Each key pair should be different
        assert pub1 != pub2
        assert priv1 != priv2
    
    def test_vapid_public_key_format(self):
        """Test public key is valid base64."""
        manager = VAPIDKeyManager()
        public_key = manager.public_key
        
        # Should be valid base64url
        # Add padding for decoding
        padding = 4 - len(public_key) % 4
        if padding != 4:
            public_key += '=' * padding
        
        decoded = base64.urlsafe_b64decode(public_key)
        assert len(decoded) > 0
        # Uncompressed EC point should be 65 bytes (0x04 + 32 bytes x + 32 bytes y)
        assert len(decoded) == 65
        assert decoded[0] == 0x04  # Uncompressed point indicator
    
    def test_vapid_key_manager_properties(self):
        """Test VAPID key manager properties."""
        manager = VAPIDKeyManager()
        
        # Should have public_key property
        pub_key = manager.public_key
        assert isinstance(pub_key, str)
        
        # Should have private_key property
        priv_key = manager.private_key
        assert priv_key is not None
    
    def test_vapid_export_to_env_format(self):
        """Test export to env file format."""
        manager = VAPIDKeyManager()
        env_format = manager.export_to_env_format()
        
        assert "VAPID_PUBLIC_KEY=" in env_format
        assert "VAPID_PRIVATE_KEY=" in env_format
        assert "VAPID_CLAIMS_EMAIL=" in env_format
        assert manager.public_key in env_format
    
    @patch.dict(os.environ, {
        'VAPID_PRIVATE_KEY': 'test_private_key',
        'VAPID_PUBLIC_KEY': 'test_public_key'
    })
    def test_vapid_key_manager_loads_from_env(self):
        """Test VAPID key manager loads keys from environment."""
        # This will attempt to load from env, but invalid keys will trigger regeneration
        manager = VAPIDKeyManager()
        # Should either load or generate new keys
        assert manager.public_key is not None


class TestPushServiceInitialization:
    """Push service initialization tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create a fresh push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.mark.asyncio
    async def test_push_service_initialization(self):
        """Test push service initializes correctly."""
        service = PushService()
        
        # Should initialize without error
        await service.initialize()
        
        # Should have VAPID manager
        assert service.vapid is not None
        assert service._initialized is True
    
    @pytest.mark.asyncio
    async def test_push_service_initialize_idempotent(self):
        """Test initialize is idempotent."""
        service = PushService()
        
        await service.initialize()
        await service.initialize()  # Second call should be no-op
        
        assert service._initialized is True
    
    @pytest.mark.asyncio
    async def test_get_vapid_public_key(self, push_service):
        """Test getting VAPID public key."""
        public_key = push_service.get_vapid_public_key()
        
        assert isinstance(public_key, str)
        assert len(public_key) > 0


class TestPushServiceSubscriptions:
    """Push service subscription management tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create a fresh push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def sample_subscription(self):
        """Create a sample push subscription."""
        return PushSubscription(
            endpoint="https://fcm.googleapis.com/fcm/send/test123",
            keys=PushSubscriptionKeys(
                p256dh="BNcRdreALRFXTkQAEuJi7e8MYVpH6iE9x0lP8C",
                auth="tBHO7wLJHCGpO7tRqQ"
            ),
            user_agent="Mozilla/5.0 Test Browser"
        )
    
    @pytest.mark.asyncio
    async def test_subscribe_new_user(self, push_service, sample_subscription):
        """Test new subscription creation."""
        result = await push_service.subscribe("user_123", sample_subscription)
        
        assert result is True
        
        # Verify subscription stored
        subs = await push_service.get_subscriptions("user_123")
        assert len(subs) == 1
        assert subs[0].endpoint == sample_subscription.endpoint
    
    @pytest.mark.asyncio
    async def test_subscribe_update_existing(self, push_service, sample_subscription):
        """Test updating existing subscription."""
        # First subscribe
        await push_service.subscribe("user_123", sample_subscription)
        
        # Subscribe again with same endpoint but different data
        updated_sub = PushSubscription(
            endpoint=sample_subscription.endpoint,  # Same endpoint
            keys=PushSubscriptionKeys(
                p256dh="NEWp256dhKEY1234567890",
                auth="NEWauthKEY123456"
            ),
            user_agent="Updated User Agent"
        )
        
        result = await push_service.subscribe("user_123", updated_sub)
        
        assert result is True
        subs = await push_service.get_subscriptions("user_123")
        assert len(subs) == 1  # Still only one subscription
        assert subs[0].keys.p256dh == "NEWp256dhKEY1234567890"
    
    @pytest.mark.asyncio
    async def test_subscribe_multiple_devices(self, push_service, sample_subscription):
        """Test multiple subscriptions for same user (different devices)."""
        # First device
        await push_service.subscribe("user_123", sample_subscription)
        
        # Second device
        sub2 = PushSubscription(
            endpoint="https://fcm.googleapis.com/fcm/send/different789",
            keys=PushSubscriptionKeys(
                p256dh="DIFFERENTp256dhKEY",
                auth="DIFFERENTauthKEY"
            ),
            user_agent="Different Browser"
        )
        result = await push_service.subscribe("user_123", sub2)
        
        assert result is True
        subs = await push_service.get_subscriptions("user_123")
        assert len(subs) == 2
    
    @pytest.mark.asyncio
    async def test_unsubscribe_user(self, push_service, sample_subscription):
        """Test subscription removal."""
        # Subscribe first
        await push_service.subscribe("user_123", sample_subscription)
        
        # Unsubscribe
        result = await push_service.unsubscribe("user_123", sample_subscription.endpoint)
        
        assert result is True
        subs = await push_service.get_subscriptions("user_123")
        assert len(subs) == 0
    
    @pytest.mark.asyncio
    async def test_unsubscribe_nonexistent(self, push_service):
        """Test unsubscribing when no subscriptions exist."""
        result = await push_service.unsubscribe("user_123", "nonexistent_endpoint")
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_unsubscribe_all(self, push_service, sample_subscription):
        """Test unsubscribe all for a user."""
        # Add multiple subscriptions
        await push_service.subscribe("user_123", sample_subscription)
        sub2 = PushSubscription(
            endpoint="https://different.endpoint.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY1", auth="AUTH1")
        )
        await push_service.subscribe("user_123", sub2)
        
        # Unsubscribe all
        result = await push_service.unsubscribe_all("user_123")
        
        assert result is True
        subs = await push_service.get_subscriptions("user_123")
        assert len(subs) == 0
    
    @pytest.mark.asyncio
    async def test_unsubscribe_all_no_subscriptions(self, push_service):
        """Test unsubscribe all when user has no subscriptions."""
        result = await push_service.unsubscribe_all("user_123")
        
        assert result is False


class TestNotificationPreferences:
    """Notification preference tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create a fresh push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def sample_subscription(self):
        """Create a sample push subscription."""
        return PushSubscription(
            endpoint="https://fcm.googleapis.com/fcm/send/test",
            keys=PushSubscriptionKeys(p256dh="KEY", auth="AUTH")
        )
    
    @pytest.mark.asyncio
    async def test_get_preferences_default(self, push_service):
        """Test getting default preferences."""
        prefs = await push_service.get_preferences("user_123")
        
        assert isinstance(prefs, NotificationPreference)
        assert prefs.global_enabled is True
        assert NotificationCategory.MATCH_START in prefs.categories
        assert prefs.categories[NotificationCategory.MATCH_START] is True
    
    @pytest.mark.asyncio
    async def test_update_preferences(self, push_service):
        """Test preference updates."""
        # Create custom preferences
        new_prefs = NotificationPreference(
            global_enabled=False,
            categories={
                NotificationCategory.MATCH_START: True,
                NotificationCategory.MATCH_END: False,
                NotificationCategory.ODDS_CHANGE: False,
                NotificationCategory.BET_WON: True,
                NotificationCategory.BET_LOST: False,
                NotificationCategory.SYSTEM: True,
            }
        )
        
        result = await push_service.update_preferences("user_123", new_prefs)
        
        assert result is True
        
        # Verify update
        prefs = await push_service.get_preferences("user_123")
        assert prefs.global_enabled is False
        assert prefs.categories[NotificationCategory.MATCH_END] is False
    
    @pytest.mark.asyncio
    async def test_preferences_with_subscription(self, push_service, sample_subscription):
        """Test preferences are set when subscribing."""
        custom_prefs = NotificationPreference(
            global_enabled=True,
            categories={NotificationCategory.MATCH_START: False}
        )
        
        await push_service.subscribe(
            "user_123", 
            sample_subscription, 
            preferences=custom_prefs
        )
        
        prefs = await push_service.get_preferences("user_123")
        assert prefs.categories[NotificationCategory.MATCH_START] is False


class TestNotificationSending:
    """Notification sending tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create a fresh push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def sample_subscription(self):
        """Create a sample push subscription."""
        return PushSubscription(
            endpoint="https://fcm.googleapis.com/fcm/send/test",
            keys=PushSubscriptionKeys(p256dh="KEY", auth="AUTH")
        )
    
    @pytest.fixture
    def sample_message(self):
        """Create a sample push message."""
        return PushMessage(
            title="Test Notification",
            body="This is a test message",
            icon="/icons/icon.png",
            data={"url": "/test"}
        )
    
    @pytest.mark.asyncio
    async def test_send_notification_no_subscriptions(self, push_service, sample_message):
        """Test sending when user has no subscriptions."""
        logs = await push_service.send_notification("user_123", sample_message)
        
        # Should return empty list when no subscriptions
        assert isinstance(logs, list)
        assert len(logs) == 0
    
    @pytest.mark.asyncio
    async def test_send_notification_disabled_globally(self, push_service, sample_subscription, sample_message):
        """Test sending when notifications disabled globally."""
        # Subscribe user
        prefs = NotificationPreference(global_enabled=False)
        await push_service.subscribe("user_123", sample_subscription, preferences=prefs)
        
        logs = await push_service.send_notification("user_123", sample_message)
        
        # Should return empty list when disabled
        assert isinstance(logs, list)
        assert len(logs) == 0
    
    @pytest.mark.asyncio
    async def test_send_notification_disabled_category(self, push_service, sample_subscription, sample_message):
        """Test sending when category is disabled."""
        # Subscribe user with odds_change disabled
        prefs = NotificationPreference()
        prefs.categories[NotificationCategory.ODDS_CHANGE] = False
        await push_service.subscribe("user_123", sample_subscription, preferences=prefs)
        
        logs = await push_service.send_notification(
            "user_123", 
            sample_message, 
            category=NotificationCategory.ODDS_CHANGE
        )
        
        # Should return empty list when category disabled
        assert isinstance(logs, list)
        assert len(logs) == 0
    
    @pytest.mark.skipif(not PYWEBPUSH_AVAILABLE, reason="pywebpush not installed")
    @pytest.mark.asyncio
    async def test_send_notification_success(self, push_service, sample_subscription, sample_message):
        """Test successful notification send (requires pywebpush)."""
        # Subscribe user
        await push_service.subscribe("user_123", sample_subscription)
        
        # Mock webpush to avoid actual network call
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            logs = await push_service.send_notification("user_123", sample_message)
            
            assert len(logs) == 1
            log = logs[0]
            assert isinstance(log, NotificationLog)
            assert log.status == "sent"
    
    @pytest.mark.asyncio
    async def test_send_to_all(self, push_service, sample_subscription, sample_message):
        """Test sending to all subscribed users."""
        # Subscribe multiple users
        await push_service.subscribe("user_1", sample_subscription)
        sub2 = PushSubscription(
            endpoint="https://different.endpoint.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY2", auth="AUTH2")
        )
        await push_service.subscribe("user_2", sub2)
        
        # Mock webpush if available
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            results = await push_service.send_to_all(sample_message)
            
            assert "user_1" in results
            assert "user_2" in results


class TestNotificationStats:
    """Notification statistics tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create a fresh push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def sample_subscription(self):
        """Create a sample push subscription."""
        return PushSubscription(
            endpoint="https://fcm.googleapis.com/fcm/send/test",
            keys=PushSubscriptionKeys(p256dh="KEY", auth="AUTH")
        )
    
    @pytest.mark.asyncio
    async def test_get_stats_empty(self, push_service):
        """Test stats with no activity."""
        stats = await push_service.get_stats()
        
        assert stats.total_subscriptions == 0
        assert stats.active_today == 0
        assert stats.sent_today == 0
        assert stats.click_rate == 0.0
    
    @pytest.mark.asyncio
    async def test_get_stats_with_subscriptions(self, push_service, sample_subscription):
        """Test stats with subscriptions."""
        # Add subscription
        await push_service.subscribe("user_123", sample_subscription)
        
        stats = await push_service.get_stats()
        
        assert stats.total_subscriptions == 1
    
    @pytest.mark.asyncio
    async def test_mark_clicked(self, push_service):
        """Test marking notification as clicked."""
        # Create a log entry
        log = NotificationLog(
            id="test_notif_123",
            user_id="user_123",
            subscription_endpoint="test_endpoint",
            category=NotificationCategory.SYSTEM,
            title="Test",
            body="Test body"
        )
        log.mark_sent()
        push_service._logs.append(log)
        
        # Mark as clicked
        result = await push_service.mark_clicked("test_notif_123")
        
        assert result is True
        assert log.status == "clicked"
        assert log.clicked_at is not None
    
    @pytest.mark.asyncio
    async def test_mark_clicked_not_found(self, push_service):
        """Test marking non-existent notification as clicked."""
        result = await push_service.mark_clicked("nonexistent_id")
        
        assert result is False


class TestNotificationLog:
    """Notification log entry tests."""
    
    def test_log_mark_sent(self):
        """Test marking log as sent."""
        log = NotificationLog(
            id="test_123",
            user_id="user_123",
            subscription_endpoint="test_endpoint",
            category=NotificationCategory.SYSTEM,
            title="Test",
            body="Test body"
        )
        
        log.mark_sent()
        
        assert log.status == "sent"
        assert log.sent_at is not None
    
    def test_log_mark_delivered(self):
        """Test marking log as delivered."""
        log = NotificationLog(
            id="test_123",
            user_id="user_123",
            subscription_endpoint="test_endpoint",
            category=NotificationCategory.SYSTEM,
            title="Test",
            body="Test body"
        )
        
        log.mark_delivered()
        
        assert log.status == "delivered"
    
    def test_log_mark_clicked(self):
        """Test marking log as clicked."""
        log = NotificationLog(
            id="test_123",
            user_id="user_123",
            subscription_endpoint="test_endpoint",
            category=NotificationCategory.SYSTEM,
            title="Test",
            body="Test body"
        )
        
        log.mark_clicked()
        
        assert log.status == "clicked"
        assert log.clicked_at is not None
    
    def test_log_mark_failed(self):
        """Test marking log as failed."""
        log = NotificationLog(
            id="test_123",
            user_id="user_123",
            subscription_endpoint="test_endpoint",
            category=NotificationCategory.SYSTEM,
            title="Test",
            body="Test body"
        )
        
        log.mark_failed("Network error")
        
        assert log.status == "failed"
        assert log.error_message == "Network error"


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
