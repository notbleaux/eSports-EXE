"""
Webhook Subscription System
Real-time notifications to subscribers when new matches are scraped
"""

import asyncio
import hashlib
import hmac
import json
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
import aiohttp
import structlog

from core.config import settings

logger = structlog.get_logger(__name__)


class WebhookEventType(Enum):
    """Types of webhook events"""
    MATCH_STARTED = "match.started"
    MATCH_COMPLETED = "match.completed"
    MATCH_SCHEDULED = "match.scheduled"
    RANKINGS_UPDATED = "rankings.updated"
    STATS_UPDATED = "stats.updated"
    PLAYER_TRANSFER = "player.transfer"
    DOM_ANOMALY = "system.dom_anomaly"


@dataclass
class WebhookSubscription:
    """Webhook subscription configuration"""
    id: str
    url: str
    events: List[str]
    secret: str  # For HMAC signature
    created_at: datetime
    last_delivered: Optional[datetime] = None
    failure_count: int = 0
    is_active: bool = True
    
    def to_dict(self) -> dict:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["last_delivered"] = self.last_delivered.isoformat() if self.last_delivered else None
        return data


class WebhookManager:
    """
    Manages webhook subscriptions and deliveries
    """
    
    def __init__(self, storage_path: str = "./data/webhooks"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.subscriptions: Dict[str, WebhookSubscription] = {}
        self._load_subscriptions()
    
    def _get_storage_path(self) -> Path:
        return self.storage_path / "subscriptions.json"
    
    def _load_subscriptions(self):
        """Load subscriptions from disk"""
        path = self._get_storage_path()
        if path.exists():
            try:
                with open(path, 'r') as f:
                    data = json.load(f)
                    for sub_id, sub_data in data.items():
                        sub_data["created_at"] = datetime.fromisoformat(sub_data["created_at"])
                        if sub_data.get("last_delivered"):
                            sub_data["last_delivered"] = datetime.fromisoformat(sub_data["last_delivered"])
                        self.subscriptions[sub_id] = WebhookSubscription(**sub_data)
            except Exception as e:
                logger.error("webhook.load_failed", error=str(e))
    
    def _save_subscriptions(self):
        """Save subscriptions to disk"""
        path = self._get_storage_path()
        data = {k: v.to_dict() for k, v in self.subscriptions.items()}
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def create_subscription(
        self,
        url: str,
        events: List[str],
        secret: Optional[str] = None
    ) -> WebhookSubscription:
        """Create new webhook subscription"""
        sub_id = hashlib.sha256(f"{url}:{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
        
        subscription = WebhookSubscription(
            id=sub_id,
            url=url,
            events=events,
            secret=secret or settings.WEBHOOK_SECRET,
            created_at=datetime.utcnow()
        )
        
        self.subscriptions[sub_id] = subscription
        self._save_subscriptions()
        
        logger.info("webhook.created", id=sub_id, url=url, events=events)
        return subscription
    
    def delete_subscription(self, sub_id: str) -> bool:
        """Delete a subscription"""
        if sub_id in self.subscriptions:
            del self.subscriptions[sub_id]
            self._save_subscriptions()
            logger.info("webhook.deleted", id=sub_id)
            return True
        return False
    
    def get_subscriptions_for_event(self, event_type: str) -> List[WebhookSubscription]:
        """Get all subscriptions interested in an event"""
        return [
            sub for sub in self.subscriptions.values()
            if sub.is_active and (event_type in sub.events or "*" in sub.events)
        ]
    
    def _sign_payload(self, payload: str, secret: str) -> str:
        """Create HMAC signature for webhook payload"""
        return hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
    
    async def deliver(
        self,
        subscription: WebhookSubscription,
        event_type: str,
        payload: dict
    ) -> bool:
        """
        Deliver webhook to subscriber
        Returns True if successful
        """
        webhook_payload = {
            "event": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": payload
        }
        
        payload_str = json.dumps(webhook_payload)
        signature = self._sign_payload(payload_str, subscription.secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-ID": subscription.id,
            "X-Webhook-Signature": f"sha256={signature}",
            "X-Webhook-Event": event_type,
            "User-Agent": "NJZ-VLR-API-Webhook/2.0"
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    subscription.url,
                    data=payload_str,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    success = 200 <= response.status < 300
                    
                    if success:
                        subscription.last_delivered = datetime.utcnow()
                        subscription.failure_count = 0
                    else:
                        subscription.failure_count += 1
                        if subscription.failure_count >= 5:
                            subscription.is_active = False
                            logger.error("webhook.deactivated", id=subscription.id, failures=subscription.failure_count)
                    
                    self._save_subscriptions()
                    
                    logger.info(
                        "webhook.delivered" if success else "webhook.failed",
                        id=subscription.id,
                        status=response.status,
                        event=event_type
                    )
                    
                    return success
                    
            except Exception as e:
                subscription.failure_count += 1
                self._save_subscriptions()
                logger.error("webhook.error", id=subscription.id, error=str(e))
                return False
    
    async def broadcast(self, event_type: str, payload: dict):
        """
        Broadcast event to all interested subscribers
        """
        subscribers = self.get_subscriptions_for_event(event_type)
        
        if not subscribers:
            return
        
        logger.info("webhook.broadcasting", event=event_type, subscribers=len(subscribers))
        
        # Deliver to all subscribers concurrently
        tasks = [
            self.deliver(sub, event_type, payload)
            for sub in subscribers
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        success_count = sum(1 for r in results if r is True)
        logger.info("webhook.broadcast_complete", event=event_type, success=success_count, total=len(subscribers))


# Global instance
webhook_manager = WebhookManager()