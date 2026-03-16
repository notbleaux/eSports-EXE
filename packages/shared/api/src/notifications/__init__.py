"""
Notifications Module — Web Push Protocol Implementation

[Ver001.000]
This module provides Web Push Protocol support for browser push notifications.

Exports:
    push_service: Global PushService instance
    router: FastAPI router for notification endpoints
    VAPIDKeyManager: VAPID key generation and management
    models: Pydantic models for subscriptions, preferences, and logs
"""

from .push_service import push_service, VAPIDKeyManager
from .routes import router
from .models import (
    PushSubscription,
    PushSubscriptionKeys,
    PushMessage,
    NotificationCategory,
    NotificationPreference,
    NotificationLog,
    NotificationStats,
    SubscribeRequest,
    SubscribeResponse,
    VapidKeyResponse,
)

__all__ = [
    "push_service",
    "VAPIDKeyManager",
    "router",
    "PushSubscription",
    "PushSubscriptionKeys",
    "PushMessage",
    "NotificationCategory",
    "NotificationPreference",
    "NotificationLog",
    "NotificationStats",
    "SubscribeRequest",
    "SubscribeResponse",
    "VapidKeyResponse",
]
