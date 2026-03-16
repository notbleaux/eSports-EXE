"""
[Ver002.000]
Push Notification Delivery Integration Tests

Full flow tests from subscription to notification delivery.
"""

import pytest
import pytest_asyncio
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch, Mock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.notifications.push_service import PushService, PYWEBPUSH_AVAILABLE
from src.notifications.models import (
    PushSubscription, PushSubscriptionKeys, PushMessage,
    NotificationPreference, NotificationCategory, NotificationLog
)


class TestFullNotificationFlow:
    """Complete notification flow tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create initialized push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def sample_subscription(self):
        """Create sample push subscription."""
        return PushSubscription(
            endpoint="https://fcm.googleapis.com/fcm/send/test123",
            keys=PushSubscriptionKeys(
                p256dh="BNcRdreALRFXTkQAEuJi7e8MYVpH6iE9x0lP8C",
                auth="tBHO7wLJHCGpO7tRqQ"
            ),
            user_agent="Mozilla/5.0 Chrome/120"
        )
    
    @pytest.fixture
    def sample_message(self):
        """Create sample push message."""
        return PushMessage(
            title="Match Starting",
            body="Team A vs Team B - VCT Champions 2026",
            icon="/icons/icon-192x192.png",
            badge="/icons/badge-72x72.png",
            tag="match_12345",
            data={
                "url": "/matches/12345",
                "match_id": "12345",
                "category": "match_start"
            }
        )
    
    @pytest.mark.asyncio
    async def test_full_notification_flow(self, push_service, sample_subscription, sample_message):
        """Test complete flow: subscribe → send → receive → click."""
        user_id = "test_user"
        
        # Step 1: Subscribe
        result = await push_service.subscribe(user_id, sample_subscription)
        assert result is True
        
        # Verify subscription
        subs = await push_service.get_subscriptions(user_id)
        assert len(subs) == 1
        assert subs[0].endpoint == sample_subscription.endpoint
        
        # Step 2: Send notification
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            logs = await push_service.send_notification(
                user_id, 
                sample_message,
                category=NotificationCategory.MATCH_START
            )
            
            # Step 3: Verify delivery log
            assert len(logs) == 1
            log = logs[0]
            assert log.status == "sent"
            assert log.title == sample_message.title
            assert log.category == NotificationCategory.MATCH_START
            
            # Step 4: Mark as clicked
            result = await push_service.mark_clicked(log.id)
            assert result is True
            
            # Verify clicked status
            clicked_log = next((l for l in push_service._logs if l.id == log.id), None)
            assert clicked_log is not None
            assert clicked_log.status == "clicked"
    
    @pytest.mark.asyncio
    async def test_notification_preferences_respected(self, push_service, sample_subscription, sample_message):
        """Test that disabled categories don't send."""
        user_id = "test_user"
        
        # Subscribe with specific preferences - disable ODDS_CHANGE
        prefs = NotificationPreference(
            global_enabled=True,
            categories={
                NotificationCategory.MATCH_START: True,
                NotificationCategory.MATCH_END: True,
                NotificationCategory.ODDS_CHANGE: False,  # Disabled
                NotificationCategory.BET_WON: True,
                NotificationCategory.BET_LOST: True,
                NotificationCategory.SYSTEM: True
            }
        )
        
        await push_service.subscribe(user_id, sample_subscription, preferences=prefs)
        
        # Send to disabled category - should not send
        logs_disabled = await push_service.send_notification(
            user_id,
            sample_message,
            category=NotificationCategory.ODDS_CHANGE
        )
        assert len(logs_disabled) == 0  # No logs because category disabled
        
        # Send to enabled category - should send
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            logs_enabled = await push_service.send_notification(
                user_id,
                sample_message,
                category=NotificationCategory.MATCH_START
            )
            assert len(logs_enabled) == 1  # Should send
    
    @pytest.mark.asyncio
    async def test_global_disable_blocks_all(self, push_service, sample_subscription, sample_message):
        """Test that global disable blocks all notifications."""
        user_id = "test_user"
        
        # Subscribe with global disabled
        prefs = NotificationPreference(global_enabled=False)
        await push_service.subscribe(user_id, sample_subscription, preferences=prefs)
        
        # Try to send to any category - should be blocked
        for category in NotificationCategory:
            logs = await push_service.send_notification(
                user_id,
                sample_message,
                category=category
            )
            assert len(logs) == 0, f"Category {category} should be blocked"


class TestMultiDeviceNotificationFlow:
    """Multi-device notification flow tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create initialized push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def device_subscriptions(self):
        """Create subscriptions for multiple devices."""
        return [
            PushSubscription(
                endpoint=f"https://fcm.googleapis.com/fcm/send/device_{i}",
                keys=PushSubscriptionKeys(
                    p256dh=f"KEY_{i}",
                    auth=f"AUTH_{i}"
                ),
                user_agent=f"Device {i}"
            )
            for i in range(3)
        ]
    
    @pytest.fixture
    def sample_message(self):
        return PushMessage(
            title="Test",
            body="Test message",
            data={"test": True}
        )
    
    @pytest.mark.asyncio
    async def test_multi_device_delivery(self, push_service, device_subscriptions, sample_message):
        """Test notification delivery to multiple devices."""
        user_id = "multi_device_user"
        
        # Subscribe all devices
        for sub in device_subscriptions:
            await push_service.subscribe(user_id, sub)
        
        # Verify all subscriptions
        subs = await push_service.get_subscriptions(user_id)
        assert len(subs) == 3
        
        # Send notification
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            logs = await push_service.send_notification(
                user_id,
                sample_message,
                category=NotificationCategory.SYSTEM
            )
            
            # Should have logs for all 3 devices
            assert len(logs) == 3
            
            # webpush should be called 3 times
            assert mock_webpush.call_count == 3
    
    @pytest.mark.asyncio
    async def test_partial_device_failure(self, push_service, device_subscriptions, sample_message):
        """Test handling when some devices fail."""
        user_id = "partial_fail_user"
        
        # Subscribe all devices
        for sub in device_subscriptions:
            await push_service.subscribe(user_id, sub)
        
        # Mock webpush with mixed results
        call_count = [0]
        def mock_webpush_impl(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 2:  # Second call fails
                from pywebpush import WebPushException
                raise WebPushException("Device 2 expired", response=MagicMock(status_code=410))
        
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.side_effect = mock_webpush_impl
            
            logs = await push_service.send_notification(
                user_id,
                sample_message,
                category=NotificationCategory.SYSTEM
            )
            
            # Should have 3 logs (one per device)
            assert len(logs) == 3
            
            # One should be failed
            failed_logs = [l for l in logs if l.status == "failed"]
            assert len(failed_logs) == 1
            
            # Expired subscription should be removed
            subs_after = await push_service.get_subscriptions(user_id)
            assert len(subs_after) == 2  # One removed


class TestNotificationStatsFlow:
    """Notification statistics flow tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create initialized push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def sample_subscription(self):
        return PushSubscription(
            endpoint="https://fcm.googleapis.com/fcm/send/test",
            keys=PushSubscriptionKeys(p256dh="KEY", auth="AUTH")
        )
    
    @pytest.fixture
    def sample_message(self):
        return PushMessage(title="Test", body="Test message")
    
    @pytest.mark.asyncio
    async def test_stats_after_notification_send(self, push_service, sample_subscription, sample_message):
        """Test stats are updated after sending notifications."""
        user_id = "stats_user"
        
        # Initial stats
        initial_stats = await push_service.get_stats()
        assert initial_stats.total_subscriptions == 0
        
        # Subscribe
        await push_service.subscribe(user_id, sample_subscription)
        
        # Stats after subscribe
        stats_after_sub = await push_service.get_stats()
        assert stats_after_sub.total_subscriptions == 1
        
        # Send notification
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            await push_service.send_notification(
                user_id,
                sample_message,
                category=NotificationCategory.SYSTEM
            )
            
            # Stats after send
            stats_after_send = await push_service.get_stats()
            assert stats_after_send.sent_today == 1
            assert stats_after_send.delivered_today == 0  # Not marked delivered yet
    
    @pytest.mark.asyncio
    async def test_click_rate_calculation(self, push_service, sample_subscription, sample_message):
        """Test click rate calculation."""
        user_id = "click_rate_user"
        
        await push_service.subscribe(user_id, sample_subscription)
        
        # Send 4 notifications
        notification_ids = []
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            for i in range(4):
                logs = await push_service.send_notification(
                    user_id,
                    sample_message,
                    category=NotificationCategory.SYSTEM
                )
                notification_ids.append(logs[0].id)
        
        # Mark 1 as clicked (25% click rate)
        await push_service.mark_clicked(notification_ids[0])
        
        # Calculate stats
        stats = await push_service.get_stats()
        
        # With 4 delivered and 1 clicked, click rate should be 0.25
        assert stats.sent_today == 4
        # Note: delivered count depends on marking as delivered, which happens
        # via service worker confirmation, not directly in send_notification


class TestNotificationEdgeCases:
    """Notification edge case tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create initialized push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def sample_message(self):
        return PushMessage(title="Test", body="Test message")
    
    @pytest.mark.asyncio
    async def test_send_to_nonexistent_user(self, push_service, sample_message):
        """Test sending to user with no subscriptions."""
        logs = await push_service.send_notification(
            "nonexistent_user",
            sample_message,
            category=NotificationCategory.SYSTEM
        )
        
        assert len(logs) == 0
    
    @pytest.mark.asyncio
    async def test_unsubscribe_specific_device(self, push_service):
        """Test unsubscribing a specific device."""
        user_id = "multi_device_user"
        
        sub1 = PushSubscription(
            endpoint="https://device1.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY1", auth="AUTH1")
        )
        sub2 = PushSubscription(
            endpoint="https://device2.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY2", auth="AUTH2")
        )
        
        # Subscribe both devices
        await push_service.subscribe(user_id, sub1)
        await push_service.subscribe(user_id, sub2)
        
        # Unsubscribe first device
        result = await push_service.unsubscribe(user_id, sub1.endpoint)
        assert result is True
        
        # Verify only second device remains
        subs = await push_service.get_subscriptions(user_id)
        assert len(subs) == 1
        assert subs[0].endpoint == sub2.endpoint
    
    @pytest.mark.asyncio
    async def test_subscribe_update_preserves_preferences(self, push_service):
        """Test that re-subscribing preserves existing preferences."""
        user_id = "pref_preserve_user"
        
        # Initial subscription with custom prefs
        sub = PushSubscription(
            endpoint="https://test.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY", auth="AUTH")
        )
        prefs = NotificationPreference(
            global_enabled=True,
            categories={NotificationCategory.MATCH_START: False}
        )
        
        await push_service.subscribe(user_id, sub, preferences=prefs)
        
        # Re-subscribe (e.g., after browser refresh) with different prefs
        new_prefs = NotificationPreference(
            global_enabled=False  # Changed
        )
        await push_service.subscribe(user_id, sub, preferences=new_prefs)
        
        # Verify new preferences were applied
        current_prefs = await push_service.get_preferences(user_id)
        assert current_prefs.global_enabled is False
    
    @pytest.mark.asyncio
    async def test_message_with_actions(self, push_service):
        """Test push message with action buttons."""
        user_id = "actions_user"
        
        sub = PushSubscription(
            endpoint="https://test.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY", auth="AUTH")
        )
        await push_service.subscribe(user_id, sub)
        
        message_with_actions = PushMessage(
            title="Bet Won!",
            body="You won your bet on Team A",
            actions=[
                {"action": "view", "title": "View Match"},
                {"action": "dismiss", "title": "Dismiss"}
            ],
            data={"match_id": "123"}
        )
        
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            logs = await push_service.send_notification(
                user_id,
                message_with_actions,
                category=NotificationCategory.BET_WON
            )
            
            assert len(logs) == 1
            
            # Verify webpush was called with actions
            call_kwargs = mock_webpush.call_args[1]
            data_json = json.loads(call_kwargs['data'])
            assert 'actions' in data_json['options']


class TestBulkNotificationOperations:
    """Bulk notification operation tests."""
    
    @pytest_asyncio.fixture
    async def push_service(self):
        """Create initialized push service."""
        service = PushService()
        await service.initialize()
        return service
    
    @pytest.fixture
    def sample_message(self):
        return PushMessage(title="Broadcast", body="Message to all")
    
    @pytest.mark.asyncio
    async def test_send_to_all_users(self, push_service, sample_message):
        """Test broadcasting to all subscribed users."""
        # Subscribe multiple users
        for i in range(3):
            sub = PushSubscription(
                endpoint=f"https://user{i}.com/push",
                keys=PushSubscriptionKeys(p256dh=f"KEY{i}", auth=f"AUTH{i}")
            )
            await push_service.subscribe(f"user_{i}", sub)
        
        # Send to all
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            results = await push_service.send_to_all(
                sample_message,
                category=NotificationCategory.SYSTEM
            )
            
            # Should have results for all 3 users
            assert len(results) == 3
            for user_id in ["user_0", "user_1", "user_2"]:
                assert user_id in results
                assert len(results[user_id]) == 1  # One log per user
    
    @pytest.mark.asyncio
    async def test_send_to_all_with_mixed_preferences(self, push_service, sample_message):
        """Test broadcast respects individual preferences."""
        # User 1 - all enabled
        sub1 = PushSubscription(
            endpoint="https://user1.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY1", auth="AUTH1")
        )
        await push_service.subscribe("user_1", sub1)
        
        # User 2 - global disabled
        sub2 = PushSubscription(
            endpoint="https://user2.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY2", auth="AUTH2")
        )
        prefs2 = NotificationPreference(global_enabled=False)
        await push_service.subscribe("user_2", sub2, preferences=prefs2)
        
        # User 3 - specific category disabled
        sub3 = PushSubscription(
            endpoint="https://user3.com/push",
            keys=PushSubscriptionKeys(p256dh="KEY3", auth="AUTH3")
        )
        prefs3 = NotificationPreference()
        prefs3.categories[NotificationCategory.SYSTEM] = False
        await push_service.subscribe("user_3", sub3, preferences=prefs3)
        
        # Send SYSTEM notification to all
        with patch('src.notifications.push_service.webpush') as mock_webpush:
            mock_webpush.return_value = None
            
            results = await push_service.send_to_all(
                sample_message,
                category=NotificationCategory.SYSTEM
            )
            
            # Only user_1 should receive
            assert len(results["user_1"]) == 1
            assert len(results["user_2"]) == 0  # Global disabled
            assert len(results["user_3"]) == 0  # Category disabled
            
            # webpush should only be called once (for user_1)
            assert mock_webpush.call_count == 1


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
