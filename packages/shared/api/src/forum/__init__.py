"""
Forum Service
=============
AREPO forum backend for community discussions.
"""

from .forum_service import ForumService
from .forum_models import (
    ForumCategory,
    ForumThread,
    ForumPost,
    CreateThreadRequest,
    CreatePostRequest,
    VoteRequest,
    ThreadListResponse,
)
from .forum_routes import router

__all__ = [
    "ForumService",
    "ForumCategory",
    "ForumThread",
    "ForumPost",
    "CreateThreadRequest",
    "CreatePostRequest",
    "VoteRequest",
    "ThreadListResponse",
    "router",
]
