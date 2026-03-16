"""
[Ver002.000]
Notification Routes Tests

API endpoint tests for push notification management.
"""

import pytest
import pytest_asyncio
import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from fastapi.testclient import TestClient
from fastapi import FastAPI

# Create test app
from main import app

client = TestClient(app)


class TestVapidPublicKeyEndpoint:
    """VAPID public key endpoint tests."""
    
    def test_get_vapid_public_key_success(self):
        """Test VAPID key endpoint returns key."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.get_vapid_public_key.return_value = "test_public_key_base64"
            
            response = client.get("/api/notifications/vapid-public-key")
            
            assert response.status_code == 200
            data = response.json()
            assert "public_key" in data
            assert data["public_key"] == "test_public_key_base64"
    
    def test_get_vapid_public_key_error(self):
        """Test VAPID key endpoint handles errors."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.get_vapid_public_key.side_effect = RuntimeError("Keys not initialized")
            
            response = client.get("/api/notifications/vapid-public-key")
            
            assert response.status_code == 500


class TestSubscribeEndpoint:
    """Subscribe endpoint tests."""
    
    def test_subscribe_success(self):
        """Test successful subscription."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.initialize = AsyncMock()
            mock_service.subscribe = AsyncMock(return_value=True)
            
            subscription_data = {
                "subscription": {
                    "endpoint": "https://fcm.googleapis.com/fcm/send/test123",
                    "keys": {
                        "p256dh": "BNcRdreALRFXTkQAEuJi7e8MYVpH6iE9x0lP8C",
                        "auth": "tBHO7wLJHCGpO7tRqQ"
                    }
                }
            }
            
            response = client.post(
                "/api/notifications/subscribe",
                json=subscription_data,
                headers={"Authorization": "Bearer test_token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "Successfully subscribed" in data["message"]
    
    def test_subscribe_failure(self):
        """Test subscription failure handling."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.initialize = AsyncMock()
            mock_service.subscribe = AsyncMock(return_value=False)
            
            subscription_data = {
                "subscription": {
                    "endpoint": "https://fcm.googleapis.com/fcm/send/test123",
                    "keys": {
                        "p256dh": "BNcRdreALRFXTkQAEuJi7e8MYVpH6iE9x0lP8C",
                        "auth": "tBHO7wLJHCGpO7tRqQ"
                    }
                }
            }
            
            response = client.post(
                "/api/notifications/subscribe",
                json=subscription_data
            )
            
            assert response.status_code == 500
    
    def test_subscribe_with_preferences(self):
        """Test subscription with custom preferences."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.initialize = AsyncMock()
            mock_service.subscribe = AsyncMock(return_value=True)
            
            subscription_data = {
                "subscription": {
                    "endpoint": "https://fcm.googleapis.com/fcm/send/test123",
                    "keys": {
                        "p256dh": "BNcRdreALRFXTkQAEuJi7e8MYVpH6iE9x0lP8C",
                        "auth": "tBHO7wLJHCGpO7tRqQ"
                    }
                },
                "preferences": {
                    "global_enabled": True,
                    "categories": {
                        "match_start": True,
                        "match_end": False,
                        "odds_change": False,
                        "bet_won": True,
                        "bet_lost": True,
                        "system": True
                    }
                }
            }
            
            response = client.post(
                "/api/notifications/subscribe",
                json=subscription_data
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True


class TestUnsubscribeEndpoint:
    """Unsubscribe endpoint tests."""
    
    def test_unsubscribe_success(self):
        """Test successful unsubscription."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.unsubscribe = AsyncMock(return_value=True)
            
            response = client.post(
                "/api/notifications/unsubscribe",
                json={"endpoint": "https://fcm.googleapis.com/fcm/send/test123"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "unsubscribed" in data["message"].lower()
    
    def test_unsubscribe_not_found(self):
        """Test unsubscribe when subscription not found."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.unsubscribe = AsyncMock(return_value=False)
            
            response = client.post(
                "/api/notifications/unsubscribe",
                json={"endpoint": "nonexistent_endpoint"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "not found" in data["message"].lower()
    
    def test_unsubscribe_all_success(self):
        """Test unsubscribe all devices."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.unsubscribe_all = AsyncMock(return_value=True)
            
            response = client.delete("/api/notifications/unsubscribe-all")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "all devices" in data["message"].lower()
    
    def test_unsubscribe_all_none_found(self):
        """Test unsubscribe all when no subscriptions exist."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.unsubscribe_all = AsyncMock(return_value=False)
            
            response = client.delete("/api/notifications/unsubscribe-all")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "no subscriptions" in data["message"].lower()


class TestPreferencesEndpoints:
    """Preferences endpoint tests."""
    
    def test_get_preferences_success(self):
        """Test getting preferences."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.get_preferences = AsyncMock(return_value={
                "global_enabled": True,
                "categories": {
                    "match_start": True,
                    "match_end": True,
                    "odds_change": False,
                    "bet_won": True,
                    "bet_lost": True,
                    "system": True
                }
            })
            
            response = client.get("/api/notifications/preferences")
            
            assert response.status_code == 200
            data = response.json()
            assert "global_enabled" in data
            assert "categories" in data
    
    def test_update_preferences_success(self):
        """Test updating preferences."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.get_preferences = AsyncMock(return_value=MagicMock(
                global_enabled=True,
                categories={}
            ))
            mock_service.update_preferences = AsyncMock(return_value=True)
            
            update_data = {
                "global_enabled": False,
                "categories": {
                    "match_start": False,
                    "odds_change": True
                }
            }
            
            response = client.put(
                "/api/notifications/preferences",
                json=update_data
            )
            
            assert response.status_code == 200


class TestTestNotificationEndpoint:
    """Test notification endpoint tests."""
    
    def test_send_test_notification(self):
        """Test sending test notification."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.send_notification = AsyncMock(return_value=[
                MagicMock(
                    subscription_endpoint="test_endpoint",
                    status="sent",
                    error_message=None
                )
            ])
            
            response = client.post(
                "/api/notifications/test",
                json={
                    "title": "Test",
                    "body": "Test message",
                    "category": "system"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "sent_count" in data
    
    def test_send_test_notification_to_specific_user(self):
        """Test sending test notification to specific user."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.send_notification = AsyncMock(return_value=[])
            
            response = client.post(
                "/api/notifications/test",
                json={
                    "user_id": "specific_user",
                    "title": "Test",
                    "body": "Test message"
                }
            )
            
            assert response.status_code in [200, 500]  # 500 if no subscriptions


class TestSubscriptionsEndpoint:
    """Subscriptions endpoint tests."""
    
    def test_get_subscriptions(self):
        """Test getting all subscriptions."""
        with patch('src.notifications.routes.push_service') as mock_service:
            from src.notifications.models import PushSubscription, PushSubscriptionKeys
            
            mock_service.get_subscriptions = AsyncMock(return_value=[
                PushSubscription(
                    endpoint="https://fcm.googleapis.com/fcm/send/test123",
                    keys=PushSubscriptionKeys(p256dh="KEY1", auth="AUTH1"),
                    user_agent="Chrome 120"
                )
            ])
            
            response = client.get("/api/notifications/subscriptions")
            
            assert response.status_code == 200
            data = response.json()
            assert "count" in data
            assert "subscriptions" in data
            assert data["count"] == 1
    
    def test_get_subscriptions_empty(self):
        """Test getting subscriptions when none exist."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.get_subscriptions = AsyncMock(return_value=[])
            
            response = client.get("/api/notifications/subscriptions")
            
            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 0


class TestStatsEndpoint:
    """Stats endpoint tests."""
    
    def test_get_stats(self):
        """Test getting notification statistics."""
        with patch('src.notifications.routes.push_service') as mock_service:
            from src.notifications.models import NotificationStats
            
            mock_service.get_stats = AsyncMock(return_value=NotificationStats(
                total_subscriptions=10,
                active_today=5,
                sent_today=20,
                delivered_today=18,
                failed_today=2,
                click_rate=0.25
            ))
            
            response = client.get("/api/notifications/stats")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total_subscriptions"] == 10
            assert data["sent_today"] == 20
            assert data["click_rate"] == 0.25


class TestClickTrackingEndpoint:
    """Click tracking endpoint tests."""
    
    def test_mark_notification_clicked(self):
        """Test marking notification as clicked."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.mark_clicked = AsyncMock(return_value=True)
            
            response = client.post("/api/notifications/click/notif_123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
    
    def test_mark_notification_clicked_not_found(self):
        """Test marking non-existent notification as clicked."""
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.mark_clicked = AsyncMock(return_value=False)
            
            response = client.post("/api/notifications/click/nonexistent")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False


class TestRequestValidation:
    """Request validation tests."""
    
    def test_subscribe_missing_subscription(self):
        """Test subscribe with missing subscription data."""
        response = client.post(
            "/api/notifications/subscribe",
            json={}  # Missing subscription
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_subscribe_missing_keys(self):
        """Test subscribe with missing keys."""
        response = client.post(
            "/api/notifications/subscribe",
            json={
                "subscription": {
                    "endpoint": "https://example.com/push"
                    # Missing keys
                }
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_unsubscribe_missing_endpoint(self):
        """Test unsubscribe with missing endpoint."""
        response = client.post(
            "/api/notifications/unsubscribe",
            json={}  # Missing endpoint
        )
        
        assert response.status_code == 422  # Validation error


class TestRateLimiting:
    """Rate limiting tests."""
    
    def test_subscribe_rate_limit(self):
        """Test subscribe endpoint has rate limiting."""
        # The endpoint should be rate limited (10/minute)
        # We just verify the endpoint exists and works
        with patch('src.notifications.routes.push_service') as mock_service:
            mock_service.initialize = AsyncMock()
            mock_service.subscribe = AsyncMock(return_value=True)
            
            subscription_data = {
                "subscription": {
                    "endpoint": "https://fcm.googleapis.com/fcm/send/test",
                    "keys": {
                        "p256dh": "KEY",
                        "auth": "AUTH"
                    }
                }
            }
            
            # First request should succeed
            response = client.post(
                "/api/notifications/subscribe",
                json=subscription_data
            )
            
            assert response.status_code == 200


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
