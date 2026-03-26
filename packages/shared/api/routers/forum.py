"""[Ver002.000] Forum API — posts and comments for AREPO community hub.

Phase 10: Migrated from in-memory store to PostgreSQL with JWT auth on writes
and Redis caching for list_posts.
"""
import logging
import sys
import os

from fastapi import APIRouter, Query, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from database import get_db
from cache import cache_get, cache_set
from src.auth.auth_utils import get_current_user
from src.auth.auth_schemas import TokenData

# Forum models loaded lazily so the router can still start even if the DB
# migration hasn't run yet (graceful degradation during deploy).
try:
    from services.api.src.njz_api.models.forum import ForumPost, ForumComment, ForumFlag
    _MODELS_AVAILABLE = True
except ImportError:
    try:
        from njz_api.models.forum import ForumPost, ForumComment, ForumFlag
        _MODELS_AVAILABLE = True
    except ImportError:
        _MODELS_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/forum", tags=["forum"])


def _require_models() -> None:
    if not _MODELS_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Forum service unavailable — DB migration 005 not yet applied",
        )


class PostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    body: str = Field(..., min_length=10, max_length=10000)
    category: Optional[str] = Field(None, max_length=50)
    game: Optional[str] = Field(None, pattern="^(valorant|cs2)$")


class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)


class FlagCreate(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


def _post_to_dict(p: "ForumPost", reply_count: int = 0) -> dict:
    return {
        "id": p.id,
        "user_id": p.user_id,
        "title": p.title,
        "body": p.content,
        "category": p.category,
        "game": p.game,
        "flagged": p.flagged,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "reply_count": reply_count,
    }


def _comment_to_dict(c: "ForumComment") -> dict:
    return {
        "id": c.id,
        "post_id": c.post_id,
        "user_id": c.user_id,
        "body": c.content,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.get("/posts", summary="List forum posts")
async def list_posts(
    category: Optional[str] = Query(None),
    game: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """List forum posts with optional category/game filter, paginated, ordered newest first."""
    _require_models()

    cache_key = f"forum:posts:{game}:{category}:{limit}:{offset}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    stmt = select(ForumPost).order_by(ForumPost.created_at.desc())
    if category:
        stmt = stmt.where(ForumPost.category == category)
    if game:
        stmt = stmt.where(ForumPost.game == game)

    count_stmt = select(func.count(ForumPost.id))
    if category:
        count_stmt = count_stmt.where(ForumPost.category == category)
    if game:
        count_stmt = count_stmt.where(ForumPost.game == game)

    total = (await db.execute(count_stmt)).scalar_one()
    rows = (await db.execute(stmt.offset(offset).limit(limit))).scalars().all()

    # Fetch reply counts in one query
    post_ids = [p.id for p in rows]
    reply_counts: dict[int, int] = {}
    if post_ids:
        rc_stmt = (
            select(ForumComment.post_id, func.count(ForumComment.id).label("cnt"))
            .where(ForumComment.post_id.in_(post_ids))
            .group_by(ForumComment.post_id)
        )
        for rc_row in (await db.execute(rc_stmt)).all():
            reply_counts[rc_row.post_id] = rc_row.cnt

    result = {
        "posts": [_post_to_dict(p, reply_counts.get(p.id, 0)) for p in rows],
        "total": total,
    }
    await cache_set(cache_key, result, ttl=60)
    return result


@router.post("/posts", summary="Create a forum post", status_code=201)
async def create_post(
    payload: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Create a new forum post. Requires authentication."""
    _require_models()

    try:
        user_id = int(current_user.user_id)
    except (ValueError, TypeError):
        user_id = None

    post = ForumPost(
        user_id=user_id,
        title=payload.title,
        content=payload.body,
        category=payload.category,
        game=payload.game,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {"post": _post_to_dict(post)}


@router.get("/posts/{post_id}/comments", summary="List comments on a post")
async def list_comments(post_id: int, db: AsyncSession = Depends(get_db)):
    _require_models()
    post = (await db.execute(select(ForumPost).where(ForumPost.id == post_id))).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = (
        await db.execute(
            select(ForumComment)
            .where(ForumComment.post_id == post_id)
            .order_by(ForumComment.created_at.asc())
        )
    ).scalars().all()
    return {"comments": [_comment_to_dict(c) for c in comments], "total": len(comments)}


@router.post("/posts/{post_id}/comments", summary="Add a comment", status_code=201)
async def add_comment(
    post_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Add a comment to a post. Requires authentication."""
    _require_models()
    post = (await db.execute(select(ForumPost).where(ForumPost.id == post_id))).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        user_id = int(current_user.user_id)
    except (ValueError, TypeError):
        user_id = None

    comment = ForumComment(post_id=post_id, user_id=user_id, content=payload.body)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return {"comment": _comment_to_dict(comment)}


@router.post("/posts/{post_id}/flag", summary="Flag a post for moderation", status_code=201)
async def flag_post(
    post_id: int,
    payload: FlagCreate = FlagCreate(),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Flag a post for moderator review. Requires authentication."""
    _require_models()
    post = (await db.execute(select(ForumPost).where(ForumPost.id == post_id))).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    try:
        reporter_id = int(current_user.user_id)
    except (ValueError, TypeError):
        reporter_id = None

    flag = ForumFlag(post_id=post_id, reporter_user_id=reporter_id, reason=payload.reason)
    db.add(flag)
    await db.execute(
        update(ForumPost).where(ForumPost.id == post_id).values(flagged=True)
    )
    await db.commit()
    return {"flagged": True}
