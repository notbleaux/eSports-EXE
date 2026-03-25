"""
Notification Models — Push Subscription and Preferences

[Ver001.000]
Web Push Protocol models for browser push notifications
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class NotificationCategory(str, Enum):
    """Notification categories for user preferences."""
    MATCH_START = "match_start"
    MATCH_END = "match_end"
    ODDS_CHANGE = "odds_change"
    BET_WON = "bet_won"
    BET_LOST = "bet_lost"
    SYSTEM = "system"


class PushSubscriptionKeys(BaseModel):
    """Push subscription keys from browser PushManager."""
    p256dh: str = Field(..., description="P-256 ECDH public key (base64url)")
    auth: str = Field(..., description="Authentication secret (base64url)")


class PushSubscription(BaseModel):
    """
    Web Push Protocol subscription data.
    
    Stored per user-device combination. Each browser/device
    gets its own subscription endpoint.
    """
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "endpoint": "https://fcm.googleapis.com/fcm/send/...",
            "keys": {
                "p256dh": "BNcRdreALRFXTk...",
                "auth": "tBHO7wL..."
            },
            "user_agent": "Mozilla/5.0...",
            "created_at": "2026-03-16T14:30:00Z"
        }
    })
    
    endpoint: str = Field(..., description="Push service endpoint URL")
    keys: PushSubscriptionKeys = Field(..., description="Encryption keys")
    user_agent: Optional[str] = Field(None, description="Browser user agent")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    
    # For database storage
    def to_db_dict(self, user_id: str) -> Dict[str, Any]:
        """Convert to database-compatible dictionary."""
        return {
            "user_id": user_id,
            "endpoint": self.endpoint,
            "p256dh": self.keys.p256dh,
            "auth": self.keys.auth,
            "user_agent": self.user_agent,
            "created_at": self.created_at,
            "updated_at": self.updated_at or self.created_at,
            "last_used": self.last_used,
        }
    
    @classmethod
    def from_db_row(cls, row: Dict[str, Any]) -> "PushSubscription":
        """Create from database row."""
        return cls(
            endpoint=row["endpoint"],
            keys=PushSubscriptionKeys(
                p256dh=row["p256dh"],
                auth=row["auth"]
            ),
            user_agent=row.get("user_agent"),
            created_at=row["created_at"],
            updated_at=row.get("updated_at"),
            last_used=row.get("last_used"),
        )


class NotificationPreference(BaseModel):
    """
    User notification preferences per category.
    
    Allows granular control over which notification types
    the user receives via push.
    """
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "global_enabled": True,
            "categories": {
                "match_start": True,
                "match_end": True,
                "odds_change": False,
                "bet_won": True,
                "bet_lost": False,
                "system": True
            }
        }
    })
    
    global_enabled: bool = Field(default=True, description="Master switch for push notifications")
    categories: Dict[NotificationCategory, bool] = Field(
        default_factory=lambda: {
            NotificationCategory.MATCH_START: True,
            NotificationCategory.MATCH_END: True,
            NotificationCategory.ODDS_CHANGE: False,
            NotificationCategory.BET_WON: True,
            NotificationCategory.BET_LOST: True,
            NotificationCategory.SYSTEM: True,
        }
    )
    
    def is_enabled_for(self, category: NotificationCategory) -> bool:
        """Check if notifications are enabled for a specific category."""
        return self.global_enabled and self.categories.get(category, False)


class NotificationLog(BaseModel):
    """
    Log entry for sent notifications.
    
    Used for tracking delivery, debugging, and rate limiting.
    """
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": "notif_abc123",
            "user_id": "user_xyz789",
            "category": "match_start",
            "title": "Match Starting",
            "body": "Team A vs Team B is about to begin",
            "sent_at": "2026-03-16T14:30:00Z",
            "delivered": True,
            "clicked": False
        }
    })
    
    id: str = Field(..., description="Unique notification ID")
    user_id: str = Field(..., description="Recipient user ID")
    subscription_endpoint: str = Field(..., description="Target subscription endpoint")
    category: NotificationCategory = Field(..., description="Notification category")
    title: str = Field(..., description="Notification title")
    body: str = Field(..., description="Notification body text")
    icon: Optional[str] = Field(None, description="Icon URL")
    badge: Optional[str] = Field(None, description="Badge URL (Android)")
    data: Optional[Dict[str, Any]] = Field(None, description="Custom payload data")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    
    # Status
    status: str = Field(default="pending", description="pending/sent/delivered/failed")
    error_message: Optional[str] = None
    
    def mark_sent(self):
        """Mark notification as sent."""
        self.sent_at = datetime.now(timezone.utc)
        self.status = "sent"
    
    def mark_delivered(self):
        """Mark notification as delivered (confirmed by service worker)."""
        self.status = "delivered"
    
    def mark_clicked(self):
        """Mark notification as clicked by user."""
        self.clicked_at = datetime.now(timezone.utc)
        self.status = "clicked"
    
    def mark_failed(self, error: str):
        """Mark notification as failed with error."""
        self.status = "failed"
        self.error_message = error


class PushMessage(BaseModel):
    """
    Message payload for Web Push Protocol.
    
    This is the actual data sent to the push service and
    displayed by the service worker.
    """
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "title": "Match Starting",
            "body": "Team A vs Team B - VCT Champions 2026",
            "icon": "/icons/icon-192x192.png",
            "badge": "/icons/badge-72x72.png",
            "tag": "match_12345",
            "requireInteraction": False,
            "data": {
                "url": "/matches/12345",
                "match_id": "12345",
                "category": "match_start"
            }
        }
    })
    
    title: str = Field(..., max_length=100, description="Notification title")
    body: str = Field(..., max_length=200, description="Notification body")
    icon: Optional[str] = Field(default="/icons/icon-192x192.png", description="Icon URL")
    badge: Optional[str] = Field(default="/icons/badge-72x72.png", description="Badge URL")
    tag: Optional[str] = Field(None, description="Tag for grouping/replacing notifications")
    requireInteraction: bool = Field(default=False, description="Require user interaction")
    actions: Optional[List[Dict[str, str]]] = Field(None, description="Action buttons")
    data: Optional[Dict[str, Any]] = Field(None, description="Custom data payload")
    
    def to_notification_options(self) -> Dict[str, Any]:
        """Convert to NotificationOptions format for service worker."""
        options = {
            "body": self.body,
            "icon": self.icon,
            "badge": self.badge,
            "requireInteraction": self.requireInteraction,
            "data": self.data or {},
        }
        if self.tag:
            options["tag"] = self.tag
        if self.actions:
            options["actions"] = self.actions
        return options


# Request/Response Models

class SubscribeRequest(BaseModel):
    """Request body for subscription endpoint."""
    subscription: PushSubscription
    preferences: Optional[NotificationPreference] = None


class SubscribeResponse(BaseModel):
    """Response from subscription endpoint."""
    success: bool
    message: str
    endpoint_id: Optional[str] = None


class UnsubscribeRequest(BaseModel):
    """Request body for unsubscription."""
    endpoint: str


class PreferencesUpdateRequest(BaseModel):
    """Request body for preferences update."""
    global_enabled: Optional[bool] = None
    categories: Optional[Dict[NotificationCategory, bool]] = None


class TestNotificationRequest(BaseModel):
    """Request body for sending test notification (admin only)."""
    user_id: Optional[str] = None  # If None, send to self
    title: str = "Test Notification"
    body: str = "This is a test notification from NJZiteGeisTe Platform"
    category: NotificationCategory = NotificationCategory.SYSTEM


class NotificationStats(BaseModel):
    """Statistics for notifications."""
    total_subscriptions: int
    active_today: int
    sent_today: int
    delivered_today: int
    failed_today: int
    click_rate: float


class VapidKeyResponse(BaseModel):
    """Response containing VAPID public key."""
    public_key: str
