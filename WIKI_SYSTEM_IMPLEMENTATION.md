# Wiki System Implementation
## Knowledge Base & Help Documentation

**Version:** [Ver001.000]  
**Date:** 2026-03-15  
**Status:** ✅ IMPLEMENTED

---

## Overview

The Wiki System provides a comprehensive knowledge base and help documentation platform integrated with the existing forum system. It supports markdown-based articles, categorization, search, and user feedback.

---

## Components Created

### Backend (Python/FastAPI)

```
packages/shared/api/
├── migrations/016_wiki_system.sql    # Database schema
└── src/wiki/
    ├── __init__.py                    # Package exports
    ├── wiki_models.py                 # Pydantic models
    ├── wiki_service.py                # Business logic
    └── wiki_routes.py                 # REST API endpoints
```

**Database Tables:**
- `wiki_categories` — Article categories
- `wiki_articles` — Article content with markdown
- `wiki_article_versions` — Revision history
- `wiki_article_feedback` — User ratings
- `wiki_redirects` — URL redirects
- `wiki_navigation` — Menu structure

**API Endpoints:**
```
GET    /api/v1/wiki/categories              # List categories
GET    /api/v1/wiki/categories/:slug        # Get category
GET    /api/v1/wiki/articles                # List articles
GET    /api/v1/wiki/articles/search         # Search articles
GET    /api/v1/wiki/articles/:slug          # Get article
POST   /api/v1/wiki/articles                # Create article
PATCH  /api/v1/wiki/articles/:id            # Update article
POST   /api/v1/wiki/articles/:id/feedback   # Submit feedback
GET    /api/v1/wiki/navigation/:menu_key    # Get navigation
GET    /api/v1/wiki/help/articles           # List help articles
GET    /api/v1/wiki/help/search             # Search help only
```

### Frontend (React/TypeScript)

```
apps/website-v2/src/components/Wiki/
├── types.ts                           # TypeScript interfaces
├── WikiArticleViewer.tsx              # Article display with feedback
├── WikiEditor.tsx                     # Markdown editor
├── WikiSearch.tsx                     # Search with dropdown
├── WikiPage.tsx                       # Full wiki page layout
├── HelpPanel.tsx                      # Slide-out help panel
└── index.ts                           # Public exports
```

---

## Features

### 1. Article Management
- ✅ Markdown-based content editing
- ✅ Category organization
- ✅ Tagging system
- ✅ Version history (auto-saved)
- ✅ Publishing workflow (draft → published)
- ✅ Excerpt generation (auto or manual)

### 2. Search & Discovery
- ✅ Full-text search across articles
- ✅ Category-based browsing
- ✅ Tag-based filtering
- ✅ Featured articles
- ✅ Related articles

### 3. User Feedback
- ✅ Helpful / Not Helpful rating
- ✅ Written feedback submission
- ✅ View count tracking
- ✅ Rating statistics display

### 4. Help Panel Integration
- ✅ Slide-out panel design
- ✅ Quick links navigation
- ✅ Category browsing
- ✅ Popular articles
- ✅ Contact support link

### 5. Wiki Page Layout
- ✅ Sidebar navigation
- ✅ Responsive design
- ✅ Breadcrumb navigation
- ✅ Related articles section
- ✅ Tag cloud

---

## Seeded Content

### Categories (10)
1. Getting Started
2. Platform Guide
3. Token Economy
4. Betting Guide
5. Fantasy League
6. Simulator
7. API Documentation
8. Community
9. Troubleshooting
10. Changelog

### Sample Article
- **Title:** Welcome to 4NJZ4 Platform
- **Slug:** welcome-to-4njz4
- **Content:** Introduction to all five hubs
- **Category:** Getting Started

---

## Integration Points

### With Forum System (AREPO)
```typescript
// Help panel links to forum for support
<a href="/forum/feedback-support">Contact Support</a>

// Wiki articles can reference forum discussions
// Forum posts can link to wiki articles
```

### With User Store
```typescript
// Track user feedback
const { userId } = useUserStore();

// Article helpfulness per user
await submitFeedback(articleId, userId, isHelpful);
```

### With Navigation
```typescript
// Help panel in global navigation
<HelpButton onClick={() => setHelpPanelOpen(true)} />

// Wiki link in footer
<a href="/wiki">Knowledge Base</a>
```

---

## Usage Examples

### Display Article
```tsx
import { WikiArticleViewer } from '@/components/Wiki';

<WikiArticleViewer 
  article={article}
  onFeedback={handleFeedback}
/>
```

### Open Help Panel
```tsx
import { HelpPanel } from '@/components/Wiki';

<HelpPanel 
  isOpen={isHelpOpen}
  onClose={() => setHelpOpen(false)}
/>
```

### Search Articles
```tsx
import { WikiSearch } from '@/components/Wiki';

<WikiSearch 
  placeholder="Search help..."
  onSearch={(query, results) => console.log(results)}
/>
```

### Edit Article
```tsx
import { WikiEditor } from '@/components/Wiki';

<WikiEditor
  article={existingArticle}
  categories={categories}
  onSave={saveArticle}
  onCancel={() => navigate('/wiki')}
/>
```

### Full Wiki Page
```tsx
import { WikiPage } from '@/components/Wiki';

// Route: /wiki/:slug?
<WikiPage defaultSlug="welcome-to-4njz4" />
```

---

## Markdown Support

The editor supports standard markdown:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
`code`

- List item
- List item

[Link text](url)
```

---

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/wiki` | WikiPage | Wiki home with categories |
| `/wiki/:slug` | WikiPage | Single article view |
| `/wiki/search?q=` | WikiPage | Search results |
| `/wiki/category/:slug` | WikiPage | Category filter |
| `/wiki/tag/:tag` | WikiPage | Tag filter |

---

## Database Schema

```sql
-- Categories
CREATE TABLE wiki_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE,
    name VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER,
    is_help_category BOOLEAN
);

-- Articles
CREATE TABLE wiki_articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(200) UNIQUE,
    title VARCHAR(200),
    category_id INTEGER REFERENCES wiki_categories(id),
    author_id VARCHAR(50),
    content TEXT,           -- Markdown
    content_html TEXT,      -- Pre-rendered
    excerpt TEXT,
    tags TEXT[],
    is_published BOOLEAN,
    is_help_article BOOLEAN,
    view_count INTEGER,
    helpful_count INTEGER,
    version INTEGER
);
```

---

## Future Enhancements

1. **Rich Text Editor** — Replace markdown with WYSIWYG
2. **Image Upload** — Drag-and-drop images in articles
3. **Article Comments** — Discuss articles
4. **Bookmarking** — Save articles for later
5. **Print View** — Printer-friendly layout
6. **PDF Export** — Download articles as PDF
7. **Analytics Dashboard** — View stats for authors

---

## Files Summary

| Component | Lines | Purpose |
|-----------|-------|---------|
| wiki_models.py | 200 | Pydantic types |
| wiki_service.py | 500 | Business logic |
| wiki_routes.py | 250 | API endpoints |
| 016_wiki_system.sql | 300 | Database schema |
| types.ts | 100 | TypeScript types |
| WikiArticleViewer.tsx | 350 | Article display |
| WikiEditor.tsx | 350 | Markdown editor |
| WikiSearch.tsx | 250 | Search component |
| WikiPage.tsx | 400 | Full page layout |
| HelpPanel.tsx | 450 | Slide-out panel |
| index.ts | 20 | Exports |
| **TOTAL** | **~3,170** | **Complete wiki system** |

---

*Wiki System implemented by KODE (AGENT-KODE-001)*  
*Status: READY FOR INTEGRATION ✅*
