"""[Ver001.000] Forum API — posts and comments for AREPO community hub."""
from fastapi import APIRouter, Query, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field
from typing import Optional
import sys, os

_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from database import get_db

router = APIRouter(prefix="/forum", tags=["forum"])


class PostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    body: str = Field(..., min_length=10, max_length=10000)
    category: Optional[str] = Field(None, max_length=50)
    game: Optional[str] = Field(None, pattern="^(valorant|cs2)$")


class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)


# In-memory store for Phase 9 (replace with DB in production)
_posts: list[dict] = []
_comments: dict[int, list[dict]] = {}
_next_post_id = 1
_next_comment_id = 1


@router.get("/posts", summary="List forum posts")
async def list_posts(
    category: Optional[str] = Query(None),
    game: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    offset: int = Query(0),
):
    filtered = _posts
    if category:
        filtered = [p for p in filtered if p.get("category") == category]
    if game:
        filtered = [p for p in filtered if p.get("game") == game]
    total = len(filtered)
    return {"posts": filtered[offset:offset+limit], "total": total}


@router.post("/posts", summary="Create a forum post", status_code=201)
async def create_post(payload: PostCreate):
    global _next_post_id
    from datetime import datetime, timezone
    post = {
        "id": _next_post_id, "title": payload.title, "body": payload.body,
        "category": payload.category, "game": payload.game,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reply_count": 0, "flagged": False,
    }
    _posts.insert(0, post)
    _comments[_next_post_id] = []
    _next_post_id += 1
    return {"post": post}


@router.get("/posts/{post_id}/comments", summary="List comments on a post")
async def list_comments(post_id: int):
    if post_id not in _comments:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"comments": _comments[post_id], "total": len(_comments[post_id])}


@router.post("/posts/{post_id}/comments", summary="Add a comment", status_code=201)
async def add_comment(post_id: int, payload: CommentCreate):
    global _next_comment_id
    if post_id not in _comments:
        raise HTTPException(status_code=404, detail="Post not found")
    from datetime import datetime, timezone
    comment = {
        "id": _next_comment_id, "post_id": post_id, "body": payload.body,
        "created_at": datetime.now(timezone.utc).isoformat(), "flagged": False,
    }
    _comments[post_id].append(comment)
    _next_comment_id += 1
    # Update reply count
    for p in _posts:
        if p["id"] == post_id:
            p["reply_count"] += 1
            break
    return {"comment": comment}


@router.post("/posts/{post_id}/flag", summary="Flag a post for moderation")
async def flag_post(post_id: int):
    for p in _posts:
        if p["id"] == post_id:
            p["flagged"] = True
            return {"flagged": True}
    raise HTTPException(status_code=404, detail="Post not found")
