"""[Ver002.000] Admin API endpoints — user management, moderation, stats, ML triggers."""
import asyncio
import logging
import sys
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, text

_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.api.src.njz_api.models.player import Player
from services.api.src.njz_api.models.team import Team
from services.api.src.njz_api.models.match import Match
from database import get_db
from src.auth.auth_utils import get_current_user
from src.auth.auth_schemas import TokenData

try:
    from services.api.src.njz_api.models.forum import ForumPost, ForumFlag, ForumComment
    _FORUM_AVAILABLE = True
except ImportError:
    _FORUM_AVAILABLE = False

try:
    from cache import cache_get, cache_set
    _CACHE_AVAILABLE = True
except ImportError:
    _CACHE_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(current_user: TokenData) -> None:
    if "admin" not in (current_user.permissions or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


# ---------------------------------------------------------------------------
# Platform stats
# ---------------------------------------------------------------------------

@router.get("/stats", summary="Platform-wide stats for admin dashboard")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Aggregate counts across the platform. Requires admin role."""
    _require_admin(current_user)
    players = (await db.execute(select(func.count(Player.id)))).scalar() or 0
    teams = (await db.execute(select(func.count(Team.id)))).scalar() or 0
    matches = (await db.execute(select(func.count(Match.id)))).scalar() or 0
    forum_posts = 0
    if _FORUM_AVAILABLE:
        forum_posts = (await db.execute(select(func.count(ForumPost.id)))).scalar() or 0
    return {"players": players, "teams": teams, "matches": matches, "forum_posts": forum_posts}


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@router.get("/users", summary="List recent platform users")
async def list_users(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Paginated list of registered users. Requires admin role."""
    _require_admin(current_user)
    rows = (await db.execute(
        text(
            "SELECT id, username, email, created_at, updated_at "
            "FROM users ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        ),
        {"limit": limit, "offset": offset},
    )).fetchall()
    total = (await db.execute(text("SELECT COUNT(*) FROM users"))).scalar() or 0
    return {
        "users": [
            {"id": r[0], "username": r[1], "email": r[2],
             "created_at": r[3].isoformat() if r[3] else None,
             "updated_at": r[4].isoformat() if r[4] else None}
            for r in rows
        ],
        "total": total,
    }


# ---------------------------------------------------------------------------
# Forum moderation
# ---------------------------------------------------------------------------

@router.get("/flags", summary="List flagged forum posts pending moderation")
async def list_flags(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """List all active forum flags with post and reporter info. Requires admin."""
    _require_admin(current_user)
    if not _FORUM_AVAILABLE:
        return {"flags": []}
    rows = (await db.execute(
        select(ForumFlag).order_by(ForumFlag.created_at.desc()).limit(100)
    )).scalars().all()
    return {
        "flags": [
            {"id": f.id, "post_id": f.post_id,
             "reporter_user_id": f.reporter_user_id,
             "reason": f.reason,
             "created_at": f.created_at.isoformat() if f.created_at else None}
            for f in rows
        ]
    }


@router.delete("/flags/{flag_id}", summary="Dismiss a forum flag", status_code=204)
async def dismiss_flag(
    flag_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Dismiss a moderation flag without removing the post. Requires admin."""
    _require_admin(current_user)
    if not _FORUM_AVAILABLE:
        raise HTTPException(status_code=503, detail="Forum service unavailable")
    flag = (await db.execute(
        select(ForumFlag).where(ForumFlag.id == flag_id)
    )).scalar_one_or_none()
    if flag is None:
        raise HTTPException(status_code=404, detail="Flag not found")
    await db.delete(flag)
    await db.commit()


@router.delete("/posts/{post_id}", summary="Remove a flagged forum post", status_code=204)
async def remove_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Permanently remove a forum post and cascade-delete its comments and flags. Requires admin."""
    _require_admin(current_user)
    if not _FORUM_AVAILABLE:
        raise HTTPException(status_code=503, detail="Forum service unavailable")
    post = (await db.execute(
        select(ForumPost).where(ForumPost.id == post_id)
    )).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
    await db.commit()


# ---------------------------------------------------------------------------
# ML training trigger
# ---------------------------------------------------------------------------

_training_task: Optional[asyncio.Task] = None  # type: ignore[assignment]


@router.post("/ml/train", summary="Trigger SimRating model training", status_code=202)
async def trigger_ml_training(
    current_user: TokenData = Depends(get_current_user),
):
    """Trigger async SimRating model training. Requires admin.
    Returns 202 Accepted immediately; check /admin/ml/status for progress."""
    _require_admin(current_user)
    global _training_task
    if _CACHE_AVAILABLE:
        current = await cache_get("ml:training:status")
        if current == "running":
            return {"status": "already_running"}
        await cache_set("ml:training:status", "running", ttl=3600)

    async def _run_training():
        script = os.path.join(_REPO_ROOT, "services/api/src/njz_api/ml/train_simrating.py")
        try:
            proc = await asyncio.create_subprocess_exec(
                "python", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()
            if _CACHE_AVAILABLE:
                from datetime import datetime, timezone
                await cache_set("ml:training:status", "idle", ttl=86400)
                await cache_set(
                    "ml:last_trained",
                    datetime.now(timezone.utc).isoformat(),
                    ttl=86400 * 30,
                )
            logger.info("ML training completed")
        except Exception as exc:
            logger.error("ML training failed: %s", exc)
            if _CACHE_AVAILABLE:
                await cache_set("ml:training:status", "error", ttl=3600)

    _training_task = asyncio.create_task(_run_training())
    return {"status": "accepted", "message": "Training started in background"}


@router.get("/ml/status", summary="Get ML training status")
async def ml_status(current_user: TokenData = Depends(get_current_user)):
    """Return current ML training status. Requires admin."""
    _require_admin(current_user)
    if not _CACHE_AVAILABLE:
        return {"status": "unknown", "last_trained": None}
    training_status = await cache_get("ml:training:status") or "idle"
    last_trained = await cache_get("ml:last_trained")
    return {"status": training_status, "last_trained": last_trained}
