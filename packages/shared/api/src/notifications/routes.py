"""
Notification Routes — Web Push API Endpoints

[Ver001.000]
FastAPI router for push notification management
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from .models import (
    SubscribeRequest,
    SubscribeResponse,
    UnsubscribeRequest,
    PreferencesUpdateRequest,
    TestNotificationRequest,
    NotificationPreference,
    PushSubscription,
    PushMessage,
    NotificationCategory,
    VapidKeyResponse,
    NotificationStats,
)
from .push_service import push_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])
limiter = Limiter(key_func=get_remote_address)

# Simple auth dependency (should be replaced with proper JWT auth)
async def get_current_user_id(request: Request) -> str:
    """
    Extract user ID from request.
    
    In production, this should validate JWT token.
    For now, uses session or generates a temporary ID.
    """
    # Check for auth header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # In real implementation, decode JWT here
        # For now, return a placeholder
        return "user_from_token"
    
    # Check for session/cookie
    user_id = request.cookies.get("user_id")
    if user_id:
        return user_id
    
    # Generate temporary user ID (for testing)
    # In production, this should raise 401
    import uuid
    return f"temp_{uuid.uuid4().hex[:8]}"


async def require_admin(request: Request, user_id: str = Depends(get_current_user_id)) -> str:
    """Require admin privileges."""
    # In production, check user role from database
    # For now, allow all for testing
    return user_id


@router.get("/vapid-public-key", response_model=VapidKeyResponse)
async def get_vapid_public_key():
    """
    Get the VAPID public key for push subscription.
    
    The frontend needs this key to subscribe to push notifications
    using the PushManager API.
    """
    try:
        public_key = push_service.get_vapid_public_key()
        return VapidKeyResponse(public_key=public_key)
    except Exception as e:
        logger.error(f"Failed to get VAPID key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Push service not configured"
        )


@router.post("/subscribe", response_model=SubscribeResponse)
@limiter.limit("10/minute")
async def subscribe(
    request: Request,
    data: SubscribeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Subscribe to push notifications.
    
    Stores the push subscription from the browser's PushManager
    and associates it with the current user.
    """
    try:
        await push_service.initialize()
        
        success = await push_service.subscribe(
            user_id=user_id,
            subscription=data.subscription,
            preferences=data.preferences
        )
        
        if success:
            return SubscribeResponse(
                success=True,
                message="Successfully subscribed to push notifications",
                endpoint_id=data.subscription.endpoint[:50]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store subscription"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Subscription error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription failed: {str(e)}"
        )


@router.post("/unsubscribe", response_model=SubscribeResponse)
async def unsubscribe(
    request: Request,
    data: UnsubscribeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Unsubscribe from push notifications.
    
    Removes the specified subscription endpoint for the current user.
    """
    try:
        removed = await push_service.unsubscribe(user_id, data.endpoint)
        
        if removed:
            return SubscribeResponse(
                success=True,
                message="Successfully unsubscribed from push notifications"
            )
        else:
            return SubscribeResponse(
                success=True,
                message="Subscription not found (may have been already removed)"
            )
            
    except Exception as e:
        logger.error(f"Unsubscribe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unsubscribe failed: {str(e)}"
        )


@router.delete("/unsubscribe-all", response_model=SubscribeResponse)
async def unsubscribe_all(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """
    Unsubscribe all devices for the current user.
    
    Removes all push subscriptions associated with the user.
    """
    try:
        removed = await push_service.unsubscribe_all(user_id)
        
        if removed:
            return SubscribeResponse(
                success=True,
                message="Successfully unsubscribed all devices"
            )
        else:
            return SubscribeResponse(
                success=True,
                message="No subscriptions found"
            )
            
    except Exception as e:
        logger.error(f"Unsubscribe all error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unsubscribe failed: {str(e)}"
        )


@router.get("/preferences", response_model=NotificationPreference)
async def get_preferences(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get notification preferences for the current user.
    
    Returns the user's current notification preferences including
    which categories are enabled/disabled.
    """
    try:
        prefs = await push_service.get_preferences(user_id)
        return prefs
        
    except Exception as e:
        logger.error(f"Get preferences error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get preferences: {str(e)}"
        )


@router.put("/preferences", response_model=NotificationPreference)
async def update_preferences(
    request: Request,
    data: PreferencesUpdateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update notification preferences.
    
    Allows the user to enable/disable push notifications globally
    and per category.
    """
    try:
        # Get current preferences
        current = await push_service.get_preferences(user_id)
        
        # Update fields
        if data.global_enabled is not None:
            current.global_enabled = data.global_enabled
        if data.categories is not None:
            current.categories.update(data.categories)
        
        # Save
        await push_service.update_preferences(user_id, current)
        return current
        
    except Exception as e:
        logger.error(f"Update preferences error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update preferences: {str(e)}"
        )


@router.post("/test", response_model=dict)
async def send_test_notification(
    request: Request,
    data: TestNotificationRequest,
    admin_user: str = Depends(require_admin)
):
    """
    Send a test notification (admin only).
    
    Useful for testing push notification setup without waiting
    for real events.
    """
    try:
        target_user = data.user_id or admin_user
        
        message = PushMessage(
            title=data.title,
            body=data.body,
            icon="/icons/icon-192x192.png",
            badge="/icons/badge-72x72.png",
            tag="test_notification",
            requireInteraction=False,
            data={
                "url": "/settings/notifications",
                "test": True
            }
        )
        
        logs = await push_service.send_notification(
            user_id=target_user,
            message=message,
            category=data.category
        )
        
        return {
            "success": len(logs) > 0,
            "sent_count": len(logs),
            "target_user": target_user,
            "category": data.category.value,
            "results": [
                {
                    "endpoint": log.subscription_endpoint[:50] + "...",
                    "status": log.status,
                    "error": log.error_message
                }
                for log in logs
            ]
        }
        
    except Exception as e:
        logger.error(f"Test notification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test notification: {str(e)}"
        )


@router.get("/subscriptions", response_model=dict)
async def get_subscriptions(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all subscriptions for the current user.
    
    Returns a list of active push subscriptions with their
    metadata (without sensitive keys).
    """
    try:
        subs = await push_service.get_subscriptions(user_id)
        
        return {
            "user_id": user_id,
            "count": len(subs),
            "subscriptions": [
                {
                    "endpoint": sub.endpoint[:100] + "..." if len(sub.endpoint) > 100 else sub.endpoint,
                    "endpoint_preview": sub.endpoint[:50] + "...",
                    "user_agent": sub.user_agent,
                    "created_at": sub.created_at.isoformat() if sub.created_at else None,
                    "last_used": sub.last_used.isoformat() if sub.last_used else None,
                }
                for sub in subs
            ]
        }
        
    except Exception as e:
        logger.error(f"Get subscriptions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscriptions: {str(e)}"
        )


@router.get("/stats", response_model=NotificationStats)
async def get_stats(
    request: Request,
    admin_user: str = Depends(require_admin)
):
    """
    Get notification statistics (admin only).
    
    Returns aggregated statistics about subscriptions and
    notification delivery.
    """
    try:
        stats = await push_service.get_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )


@router.post("/click/{notification_id}", response_model=dict)
async def mark_notification_clicked(
    request: Request,
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Mark a notification as clicked.
    
    Called by the service worker when a user clicks a notification.
    """
    try:
        success = await push_service.mark_clicked(notification_id)
        return {"success": success}
        
    except Exception as e:
        logger.error(f"Mark clicked error: {e}")
        return {"success": False, "error": str(e)}
