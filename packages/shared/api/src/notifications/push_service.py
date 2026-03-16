"""
Push Service — Web Push Protocol Implementation

[Ver001.000]
VAPID authentication, subscription management, and notification dispatch
"""

import os
import logging
import base64
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
from urllib.parse import urlparse

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

# Web Push Protocol client
try:
    from pywebpush import webpush, WebPushException
    PYWEBPUSH_AVAILABLE = True
except ImportError:
    PYWEBPUSH_AVAILABLE = False
    logging.warning("pywebpush not installed. Push notifications will be unavailable.")

from .models import (
    PushSubscription,
    PushMessage,
    NotificationLog,
    NotificationPreference,
    NotificationCategory,
    NotificationStats,
)

logger = logging.getLogger(__name__)


class VAPIDKeyManager:
    """
    Manages VAPID (Voluntary Application Server Identification) keys.
    
    VAPID keys are used to authenticate the application server to
    the push service (FCM, Mozilla Autopush, etc.).
    """
    
    def __init__(self):
        self._private_key: Optional[ec.EllipticCurvePrivateKey] = None
        self._public_key: Optional[ec.EllipticCurvePublicKey] = None
        self._public_key_b64: Optional[str] = None
        self._load_keys()
    
    def _load_keys(self):
        """Load VAPID keys from environment or generate new ones."""
        private_key_b64 = os.getenv("VAPID_PRIVATE_KEY")
        public_key_b64 = os.getenv("VAPID_PUBLIC_KEY")
        
        if private_key_b64 and public_key_b64:
            try:
                # Decode existing keys
                private_key_bytes = base64.urlsafe_b64decode(
                    private_key_b64 + "=" * (4 - len(private_key_b64) % 4)
                )
                self._private_key = serialization.load_der_private_key(
                    private_key_bytes, password=None, backend=default_backend()
                )
                self._public_key_b64 = public_key_b64
                logger.info("Loaded existing VAPID keys from environment")
                return
            except Exception as e:
                logger.error(f"Failed to load VAPID keys: {e}. Generating new keys...")
        
        # Generate new keys if not found or invalid
        self.generate_keys()
    
    def generate_keys(self) -> Tuple[str, str]:
        """
        Generate new VAPID key pair.
        
        Returns:
            Tuple of (public_key_b64, private_key_b64)
        """
        # Generate P-256 key pair
        self._private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        self._public_key = self._private_key.public_key()
        
        # Serialize public key (uncompressed point format)
        public_key_bytes = self._public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
        self._public_key_b64 = base64.urlsafe_b64encode(
            public_key_bytes
        ).decode("ascii").rstrip("=")
        
        # Serialize private key
        private_key_bytes = self._private_key.private_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        private_key_b64 = base64.urlsafe_b64encode(
            private_key_bytes
        ).decode("ascii").rstrip("=")
        
        logger.info("Generated new VAPID key pair")
        return self._public_key_b64, private_key_b64
    
    @property
    def public_key(self) -> str:
        """Get VAPID public key (base64url)."""
        if not self._public_key_b64:
            raise RuntimeError("VAPID keys not initialized")
        return self._public_key_b64
    
    @property
    def private_key(self) -> ec.EllipticCurvePrivateKey:
        """Get VAPID private key."""
        if not self._private_key:
            raise RuntimeError("VAPID keys not initialized")
        return self._private_key
    
    def export_to_env_format(self) -> str:
        """Export keys in .env file format."""
        if not self._private_key:
            raise RuntimeError("VAPID keys not initialized")
        
        # Get private key bytes
        private_key_bytes = self._private_key.private_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        private_key_b64 = base64.urlsafe_b64encode(
            private_key_bytes
        ).decode("ascii").rstrip("=")
        
        email = os.getenv("VAPID_CLAIMS_EMAIL")
        if not email:
            email = "admin@example.com"
            logger.warning("VAPID_CLAIMS_EMAIL not set, using example email. Set this in production!")
        
        return f"""# VAPID Keys for Web Push Notifications
# Generated: {datetime.now(timezone.utc).isoformat()}
VAPID_PUBLIC_KEY={self._public_key_b64}
VAPID_PRIVATE_KEY={private_key_b64}
VAPID_CLAIMS_EMAIL={email}
# NOTE: Replace VAPID_CLAIMS_EMAIL with a valid email in production
"""


class PushService:
    """
    Web Push Protocol service for sending push notifications.
    
    Handles:
    - VAPID authentication
    - Subscription storage/retrieval
    - Notification dispatch
    - Delivery tracking
    """
    
    def __init__(self):
        self.vapid = VAPIDKeyManager()
        self._subscriptions: Dict[str, List[PushSubscription]] = {}  # user_id -> subscriptions
        self._preferences: Dict[str, NotificationPreference] = {}  # user_id -> preferences
        self._logs: List[NotificationLog] = []
        self._initialized = False
    
    async def initialize(self):
        """Initialize the push service."""
        if self._initialized:
            return
        
        if not PYWEBPUSH_AVAILABLE:
            logger.warning("pywebpush not available. Push notifications disabled.")
            return
        
        self._initialized = True
        logger.info("Push service initialized")
    
    def get_vapid_public_key(self) -> str:
        """Get the VAPID public key for frontend subscription."""
        return self.vapid.public_key
    
    async def subscribe(
        self,
        user_id: str,
        subscription: PushSubscription,
        preferences: Optional[NotificationPreference] = None
    ) -> bool:
        """
        Store a new push subscription for a user.
        
        Args:
            user_id: The user identifier
            subscription: Push subscription from browser PushManager
            preferences: Optional initial notification preferences
            
        Returns:
            True if subscription was stored successfully
        """
        try:
            # Initialize user's subscription list
            if user_id not in self._subscriptions:
                self._subscriptions[user_id] = []
            
            # Check for existing subscription with same endpoint
            existing = None
            for i, sub in enumerate(self._subscriptions[user_id]):
                if sub.endpoint == subscription.endpoint:
                    existing = i
                    break
            
            if existing is not None:
                # Update existing subscription
                self._subscriptions[user_id][existing] = subscription
                logger.info(f"Updated subscription for user {user_id}")
            else:
                # Add new subscription
                self._subscriptions[user_id].append(subscription)
                logger.info(f"Added new subscription for user {user_id}")
            
            # Set preferences if provided
            if preferences:
                self._preferences[user_id] = preferences
            elif user_id not in self._preferences:
                self._preferences[user_id] = NotificationPreference()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to store subscription: {e}")
            return False
    
    async def unsubscribe(self, user_id: str, endpoint: str) -> bool:
        """
        Remove a push subscription.
        
        Args:
            user_id: The user identifier
            endpoint: The subscription endpoint to remove
            
        Returns:
            True if subscription was removed
        """
        if user_id not in self._subscriptions:
            return False
        
        initial_count = len(self._subscriptions[user_id])
        self._subscriptions[user_id] = [
            s for s in self._subscriptions[user_id] if s.endpoint != endpoint
        ]
        
        removed = len(self._subscriptions[user_id]) < initial_count
        if removed:
            logger.info(f"Removed subscription for user {user_id}")
        
        return removed
    
    async def unsubscribe_all(self, user_id: str) -> bool:
        """
        Remove all push subscriptions for a user.
        
        Args:
            user_id: The user identifier
            
        Returns:
            True if any subscriptions were removed
        """
        if user_id not in self._subscriptions:
            return False
        
        had_subscriptions = len(self._subscriptions[user_id]) > 0
        del self._subscriptions[user_id]
        
        if user_id in self._preferences:
            del self._preferences[user_id]
        
        logger.info(f"Removed all subscriptions for user {user_id}")
        return had_subscriptions
    
    async def get_subscriptions(self, user_id: str) -> List[PushSubscription]:
        """Get all subscriptions for a user."""
        return self._subscriptions.get(user_id, [])
    
    async def get_preferences(self, user_id: str) -> NotificationPreference:
        """Get notification preferences for a user."""
        if user_id not in self._preferences:
            self._preferences[user_id] = NotificationPreference()
        return self._preferences[user_id]
    
    async def update_preferences(
        self,
        user_id: str,
        preferences: NotificationPreference
    ) -> bool:
        """Update notification preferences for a user."""
        self._preferences[user_id] = preferences
        logger.info(f"Updated preferences for user {user_id}")
        return True
    
    async def send_notification(
        self,
        user_id: str,
        message: PushMessage,
        category: NotificationCategory = NotificationCategory.SYSTEM
    ) -> List[NotificationLog]:
        """
        Send push notification to all user devices.
        
        Args:
            user_id: Target user identifier
            message: Notification content
            category: Notification category for preference checking
            
        Returns:
            List of notification logs (one per device)
        """
        logs = []
        
        if not PYWEBPUSH_AVAILABLE:
            logger.error("pywebpush not available. Cannot send notifications.")
            return logs
        
        # Check preferences
        prefs = await self.get_preferences(user_id)
        if not prefs.is_enabled_for(category):
            logger.debug(f"Notifications disabled for {category} for user {user_id}")
            return logs
        
        subscriptions = await self.get_subscriptions(user_id)
        if not subscriptions:
            logger.warning(f"No subscriptions found for user {user_id}")
            return logs
        
        vapid_email = os.getenv("VAPID_CLAIMS_EMAIL")
        if not vapid_email:
            vapid_email = "admin@example.com"
            if os.getenv("APP_ENVIRONMENT") == "production":
                logger.error("VAPID_CLAIMS_EMAIL must be set in production environment!")
                raise RuntimeError("VAPID_CLAIMS_EMAIL environment variable is required in production")
            logger.warning("VAPID_CLAIMS_EMAIL not set, using example email")
        
        vapid_claims = {
            "sub": f"mailto:{vapid_email}",
            "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
        }
        
        # Get private key in PEM format for pywebpush
        private_key_pem = self.vapid.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ).decode("utf-8")
        
        for subscription in subscriptions:
            log = NotificationLog(
                id=f"notif_{datetime.now(timezone.utc).timestamp()}_{hash(subscription.endpoint) % 10000}",
                user_id=user_id,
                subscription_endpoint=subscription.endpoint,
                category=category,
                title=message.title,
                body=message.body,
                icon=message.icon,
                badge=message.badge,
                data={
                    **(message.data or {}),
                    "category": category.value,
                    "notification_id": f"notif_{datetime.now(timezone.utc).timestamp()}"
                },
            )
            
            try:
                # Send via Web Push Protocol
                webpush(
                    subscription_info={
                        "endpoint": subscription.endpoint,
                        "keys": {
                            "p256dh": subscription.keys.p256dh,
                            "auth": subscription.keys.auth,
                        }
                    },
                    data=json.dumps({
                        "title": message.title,
                        "options": message.to_notification_options()
                    }),
                    vapid_private_key=private_key_pem,
                    vapid_claims=vapid_claims
                )
                
                log.mark_sent()
                logger.debug(f"Sent notification to {subscription.endpoint[:50]}...")
                
            except WebPushException as e:
                log.mark_failed(str(e))
                logger.error(f"WebPush error: {e}")
                
                # Handle expired/invalid subscriptions
                if e.response and e.response.status_code in (404, 410):
                    logger.info(f"Removing expired subscription for {user_id}")
                    await self.unsubscribe(user_id, subscription.endpoint)
                    
            except Exception as e:
                log.mark_failed(str(e))
                logger.error(f"Failed to send notification: {e}")
            
            self._logs.append(log)
            logs.append(log)
        
        return logs
    
    async def send_to_all(
        self,
        message: PushMessage,
        category: NotificationCategory = NotificationCategory.SYSTEM
    ) -> Dict[str, List[NotificationLog]]:
        """
        Send notification to all subscribed users.
        
        Args:
            message: Notification content
            category: Notification category
            
        Returns:
            Dict mapping user_id to their notification logs
        """
        results = {}
        for user_id in self._subscriptions:
            results[user_id] = await self.send_notification(user_id, message, category)
        return results
    
    async def get_stats(self) -> NotificationStats:
        """Get notification statistics."""
        today = datetime.now(timezone.utc).date()
        
        total_subs = sum(len(subs) for subs in self._subscriptions.values())
        
        active_today = sum(
            1 for user_subs in self._subscriptions.values()
            for sub in user_subs
            if sub.last_used and sub.last_used.date() == today
        )
        
        sent_today = sum(
            1 for log in self._logs
            if log.sent_at and log.sent_at.date() == today
        )
        
        delivered_today = sum(
            1 for log in self._logs
            if log.status == "delivered" and log.sent_at and log.sent_at.date() == today
        )
        
        failed_today = sum(
            1 for log in self._logs
            if log.status == "failed" and log.created_at.date() == today
        )
        
        clicked_today = sum(
            1 for log in self._logs
            if log.clicked_at and log.clicked_at.date() == today
        )
        
        click_rate = clicked_today / delivered_today if delivered_today > 0 else 0.0
        
        return NotificationStats(
            total_subscriptions=total_subs,
            active_today=active_today,
            sent_today=sent_today,
            delivered_today=delivered_today,
            failed_today=failed_today,
            click_rate=click_rate
        )
    
    async def mark_clicked(self, notification_id: str):
        """Mark a notification as clicked."""
        for log in self._logs:
            if log.id == notification_id:
                log.mark_clicked()
                logger.info(f"Notification {notification_id} marked as clicked")
                return True
        return False


# Global push service instance
push_service = PushService()
