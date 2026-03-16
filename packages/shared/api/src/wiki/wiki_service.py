"""
Wiki Service
============
Business logic for wiki/knowledge base.
"""

import logging
import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import asyncpg

from .wiki_models import (
    WikiCategory, WikiArticle, WikiArticleSummary, WikiArticleVersion,
    WikiNavigationItem, CreateArticleRequest, UpdateArticleRequest
)

logger = logging.getLogger(__name__)


class WikiService:
    """Service for wiki operations."""
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
    
    # Category operations
    
    async def get_categories(self, include_empty: bool = False) -> List[WikiCategory]:
        """Get all wiki categories."""
        async with self.db.acquire() as conn:
            where_clause = "" if include_empty else "WHERE article_count > 0 OR is_help_category = TRUE"
            rows = await conn.fetch(
                f"""
                SELECT id, slug, name, description, icon, sort_order,
                       parent_id, is_help_category, article_count, created_at
                FROM wiki_categories
                {where_clause}
                ORDER BY sort_order ASC, name ASC
                """
            )
            return [WikiCategory(**dict(row)) for row in rows]
    
    async def get_category_by_slug(self, slug: str) -> Optional[WikiCategory]:
        """Get category by slug."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, slug, name, description, icon, sort_order,
                       parent_id, is_help_category, article_count, created_at
                FROM wiki_categories WHERE slug = $1
                """,
                slug
            )
            return WikiCategory(**dict(row)) if row else None
    
    # Article operations
    
    async def list_articles(
        self,
        category_id: Optional[int] = None,
        is_help: Optional[bool] = None,
        is_featured: bool = False,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[WikiArticleSummary], int]:
        """List articles with pagination."""
        offset = (page - 1) * page_size
        
        async with self.db.acquire() as conn:
            # Build WHERE clause
            where_clauses = ["is_published = TRUE"]
            params = []
            
            if category_id:
                params.append(category_id)
                where_clauses.append(f"category_id = ${len(params)}")
            
            if is_help is not None:
                params.append(is_help)
                where_clauses.append(f"is_help_article = ${len(params)}")
            
            if is_featured:
                where_clauses.append("is_featured = TRUE")
            
            where_sql = " AND ".join(where_clauses)
            
            # Get total
            count_row = await conn.fetchrow(
                f"SELECT COUNT(*) FROM wiki_articles WHERE {where_sql}",
                *params
            )
            total = count_row['count']
            
            # Get articles
            rows = await conn.fetch(
                f"""
                SELECT a.id, a.slug, a.title, a.category_id, c.name as category_name,
                       a.excerpt, a.tags, a.is_featured, a.view_count, a.helpful_count,
                       a.published_at, a.updated_at
                FROM wiki_articles a
                LEFT JOIN wiki_categories c ON a.category_id = c.id
                WHERE {where_sql}
                ORDER BY a.is_featured DESC, a.published_at DESC
                LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
                """,
                *params, page_size, offset
            )
            
            articles = [WikiArticleSummary(**dict(row)) for row in rows]
            return articles, total
    
    async def get_article_by_slug(
        self,
        slug: str,
        user_id: Optional[str] = None,
        increment_view: bool = True
    ) -> Optional[WikiArticle]:
        """Get article by slug."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT a.*, c.slug as category_slug, c.name as category_name,
                       c.icon as category_icon
                FROM wiki_articles a
                LEFT JOIN wiki_categories c ON a.category_id = c.id
                WHERE a.slug = $1 AND a.is_published = TRUE
                """,
                slug
            )
            
            if not row:
                return None
            
            # Increment view count
            if increment_view:
                await conn.execute(
                    "UPDATE wiki_articles SET view_count = view_count + 1 WHERE id = $1",
                    row['id']
                )
            
            # Build category if exists
            category = None
            if row['category_id']:
                category = WikiCategory(
                    id=row['category_id'],
                    slug=row['category_slug'],
                    name=row['category_name'],
                    icon=row['category_icon'],
                    sort_order=0,
                    is_help_category=False,
                    article_count=0,
                    created_at=datetime.now()
                )
            
            return WikiArticle(
                id=row['id'],
                slug=row['slug'],
                title=row['title'],
                category_id=row['category_id'],
                category=category,
                author_id=row['author_id'],
                content=row['content'],
                content_html=row['content_html'],
                excerpt=row['excerpt'],
                tags=row['tags'] or [],
                is_published=row['is_published'],
                is_help_article=row['is_help_article'],
                is_featured=row['is_featured'],
                view_count=row['view_count'] + (1 if increment_view else 0),
                helpful_count=row['helpful_count'],
                not_helpful_count=row['not_helpful_count'],
                version=row['version'],
                published_at=row['published_at'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
    
    async def create_article(
        self,
        author_id: str,
        request: CreateArticleRequest
    ) -> WikiArticle:
        """Create a new article."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Generate excerpt if not provided
                excerpt = request.excerpt or self._generate_excerpt(request.content)
                
                # Convert content to HTML (simple markdown)
                content_html = self._markdown_to_html(request.content)
                
                row = await conn.fetchrow(
                    """
                    INSERT INTO wiki_articles
                    (slug, title, category_id, author_id, content, content_html,
                     excerpt, tags, is_published, is_help_article, published_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                           CASE WHEN $9 THEN CURRENT_TIMESTAMP ELSE NULL END)
                    RETURNING *
                    """,
                    request.slug, request.title, request.category_id, author_id,
                    request.content, content_html, excerpt, request.tags,
                    request.is_published, request.is_help_article
                )
                
                logger.info(f"User {author_id} created article {request.slug}")
                return await self._row_to_article(row)
    
    async def update_article(
        self,
        article_id: int,
        editor_id: str,
        request: UpdateArticleRequest
    ) -> Optional[WikiArticle]:
        """Update an existing article."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Get current article
                current = await conn.fetchrow(
                    "SELECT * FROM wiki_articles WHERE id = $1",
                    article_id
                )
                
                if not current:
                    return None
                
                # Build update fields
                updates = {}
                if request.title is not None:
                    updates['title'] = request.title
                if request.category_id is not None:
                    updates['category_id'] = request.category_id
                if request.content is not None:
                    updates['content'] = request.content
                    updates['content_html'] = self._markdown_to_html(request.content)
                    updates['excerpt'] = self._generate_excerpt(request.content)
                if request.excerpt is not None:
                    updates['excerpt'] = request.excerpt
                if request.tags is not None:
                    updates['tags'] = request.tags
                if request.is_published is not None:
                    updates['is_published'] = request.is_published
                    if request.is_published and not current['is_published']:
                        updates['published_at'] = datetime.now()
                if request.is_featured is not None:
                    updates['is_featured'] = request.is_featured
                
                if not updates:
                    return await self._row_to_article(current)
                
                # Build UPDATE query
                set_clause = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(updates.keys())])
                values = [article_id] + list(updates.values())
                
                row = await conn.fetchrow(
                    f"UPDATE wiki_articles SET {set_clause} WHERE id = $1 RETURNING *",
                    *values
                )
                
                logger.info(f"User {editor_id} updated article {article_id}")
                return await self._row_to_article(row)
    
    async def search_articles(
        self,
        query: str,
        category_id: Optional[int] = None,
        is_help_only: bool = False,
        limit: int = 20
    ) -> List[WikiArticleSummary]:
        """Search articles by query."""
        async with self.db.acquire() as conn:
            # Build WHERE clause
            where_clauses = [
                "is_published = TRUE",
                "(title ILIKE $1 OR content ILIKE $1 OR $1 = ANY(tags))"
            ]
            params = [f"%{query}%"]
            
            if category_id:
                params.append(category_id)
                where_clauses.append(f"category_id = ${len(params)}")
            
            if is_help_only:
                where_clauses.append("is_help_article = TRUE")
            
            where_sql = " AND ".join(where_clauses)
            
            rows = await conn.fetch(
                f"""
                SELECT a.id, a.slug, a.title, a.category_id, c.name as category_name,
                       a.excerpt, a.tags, a.is_featured, a.view_count, a.helpful_count,
                       a.published_at, a.updated_at
                FROM wiki_articles a
                LEFT JOIN wiki_categories c ON a.category_id = c.id
                WHERE {where_sql}
                ORDER BY 
                    CASE WHEN title ILIKE $1 THEN 0 ELSE 1 END,
                    helpful_count DESC,
                    view_count DESC
                LIMIT ${len(params) + 1}
                """,
                *params, limit
            )
            
            return [WikiArticleSummary(**dict(row)) for row in rows]
    
    async def submit_feedback(
        self,
        article_id: int,
        user_id: str,
        is_helpful: bool,
        feedback: Optional[str] = None
    ) -> bool:
        """Submit feedback on an article."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Upsert feedback
                await conn.execute(
                    """
                    INSERT INTO wiki_article_feedback (article_id, user_id, is_helpful, feedback)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (article_id, user_id) DO UPDATE
                    SET is_helpful = $3, feedback = $4, created_at = CURRENT_TIMESTAMP
                    """,
                    article_id, user_id, is_helpful, feedback
                )
                
                # Update counts
                await conn.execute(
                    """
                    UPDATE wiki_articles
                    SET helpful_count = (SELECT COUNT(*) FROM wiki_article_feedback WHERE article_id = $1 AND is_helpful = TRUE),
                        not_helpful_count = (SELECT COUNT(*) FROM wiki_article_feedback WHERE article_id = $1 AND is_helpful = FALSE)
                    WHERE id = $1
                    """,
                    article_id
                )
                
                return True
    
    # Navigation operations
    
    async def get_navigation(self, menu_key: str) -> List[WikiNavigationItem]:
        """Get navigation items for a menu."""
        async with self.db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, menu_key, parent_id, title, article_slug, external_url,
                       sort_order, icon, is_visible
                FROM wiki_navigation
                WHERE menu_key = $1 AND is_visible = TRUE
                ORDER BY sort_order ASC
                """,
                menu_key
            )
            
            # Build tree structure
            items_map = {row['id']: dict(row) for row in rows}
            root_items = []
            
            for row in rows:
                item = items_map[row['id']]
                item['children'] = []
                
                if row['parent_id'] and row['parent_id'] in items_map:
                    items_map[row['parent_id']]['children'].append(item)
                else:
                    root_items.append(item)
            
            return [WikiNavigationItem(**item) for item in root_items]
    
    # Helper methods
    
    def _generate_excerpt(self, content: str, max_length: int = 200) -> str:
        """Generate excerpt from content."""
        # Remove markdown syntax
        text = re.sub(r'[#*`\[\]()]', '', content)
        # Get first paragraph
        text = text.split('\n\n')[0]
        # Truncate
        if len(text) > max_length:
            text = text[:max_length].rsplit(' ', 1)[0] + '...'
        return text.strip()
    
    def _markdown_to_html(self, content: str) -> str:
        """Simple markdown to HTML conversion."""
        html = content
        
        # Headers
        html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
        html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
        html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
        
        # Bold and italic
        html = re.sub(r'\*\*\*(.*?)\*\*\*', r'<strong><em>\1</em></strong>', html)
        html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
        html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
        
        # Code blocks
        html = re.sub(r'```(.*?)```', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
        html = re.sub(r'`(.*?)`', r'<code>\1</code>', html)
        
        # Links
        html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)
        
        # Paragraphs
        paragraphs = html.split('\n\n')
        html = ''.join(f'<p>{p}</p>' for p in paragraphs if p.strip() and not p.startswith('<'))
        
        return html
    
    async def _row_to_article(self, row) -> WikiArticle:
        """Convert database row to WikiArticle."""
        return WikiArticle(
            id=row['id'],
            slug=row['slug'],
            title=row['title'],
            category_id=row['category_id'],
            author_id=row['author_id'],
            content=row['content'],
            content_html=row['content_html'],
            excerpt=row['excerpt'],
            tags=row['tags'] or [],
            is_published=row['is_published'],
            is_help_article=row['is_help_article'],
            is_featured=row['is_featured'],
            view_count=row['view_count'],
            helpful_count=row['helpful_count'],
            not_helpful_count=row['not_helpful_count'],
            version=row['version'],
            published_at=row['published_at'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
