'use client';

import { useState, useMemo } from 'react';

interface Article {
  title: string;
  readTime: string;
  helpful?: number;
  notHelpful?: number;
}

interface Category {
  name: string;
  articles: Article[];
}

const categories: Category[] = [
  {
    name: 'Getting Started',
    articles: [
      { title: 'Installation Guide', readTime: '5 min', helpful: 124, notHelpful: 3 },
      { title: 'First Match Setup', readTime: '8 min', helpful: 89, notHelpful: 5 },
      { title: 'Understanding RAWS Files', readTime: '12 min', helpful: 67, notHelpful: 8 }
    ]
  },
  {
    name: 'Advanced Strategy',
    articles: [
      { title: 'Roster Optimization', readTime: '15 min', helpful: 156, notHelpful: 4 },
      { title: 'Economy Management', readTime: '10 min', helpful: 112, notHelpful: 6 },
      { title: 'Scouting & Recruitment', readTime: '20 min', helpful: 78, notHelpful: 2 }
    ]
  },
  {
    name: 'Data Integration',
    articles: [
      { title: 'Using SATOR Statistics', readTime: '10 min', helpful: 95, notHelpful: 7 },
      { title: 'ROTAS Predictions', readTime: '12 min', helpful: 83, notHelpful: 9 },
      { title: 'Live Match Integration', readTime: '8 min', helpful: 102, notHelpful: 3 }
    ]
  }
];

type FeedbackState = 'none' | 'helpful' | 'not-helpful';

interface ArticleFeedback {
  [key: string]: FeedbackState;
}

export function KnowledgeBase() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.name))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [feedback, setFeedback] = useState<ArticleFeedback>({});
  const [showThanks, setShowThanks] = useState<string | null>(null);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSearch = () => {
    setActiveSearch(searchQuery.toLowerCase());
    // Expand all categories when searching
    if (searchQuery) {
      setExpandedCategories(new Set(categories.map(c => c.name)));
    }
  };

  const handleFeedback = (articleKey: string, type: FeedbackState) => {
    setFeedback(prev => ({ ...prev, [articleKey]: type }));
    setShowThanks(articleKey);
    setTimeout(() => setShowThanks(null), 2000);
  };

  const filteredCategories = useMemo(() => {
    if (!activeSearch) return categories;
    
    return categories.map(cat => ({
      ...cat,
      articles: cat.articles.filter(article =>
        article.title.toLowerCase().includes(activeSearch)
      )
    })).filter(cat => cat.articles.length > 0);
  }, [activeSearch]);

  const totalResults = filteredCategories.reduce(
    (sum, cat) => sum + cat.articles.length, 
    0
  );

  return (
    <section className="knowledge-section" id="knowledge">
      <h2>Knowledge Base</h2>
      <p>Master the game with our comprehensive guides</p>
      
      {/* Search bar */}
      <div className="knowledge-search">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button 
            className="search-btn"
            onClick={handleSearch}
          >
            🔍
          </button>
        </div>
        
        {activeSearch && (
          <div className="search-results-info">
            {totalResults === 0 ? (
              <span>No results for "{activeSearch}"</span>
            ) : (
              <span>{totalResults} result{totalResults !== 1 ? 's' : ''} for "{activeSearch}"</span>
            )}
            <button 
              className="clear-search"
              onClick={() => {
                setSearchQuery('');
                setActiveSearch('');
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="knowledge-grid">
        {filteredCategories.map(cat => (
          <div key={cat.name} className="category-card">
            <button 
              className="category-header"
              onClick={() => toggleCategory(cat.name)}
            >
              <h3>{cat.name}</h3>
              <span className={`expand-icon ${expandedCategories.has(cat.name) ? 'expanded' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedCategories.has(cat.name) && (
              <ul className="article-list">
                {cat.articles.map((article, idx) => {
                  const articleKey = `${cat.name}-${article.title}`;
                  const articleFeedback = feedback[articleKey];
                  
                  return (
                    <li key={article.title} className="article-item">
                      <div className="article-main">
                        <a href="#" className="article-link">{article.title}</a>
                        <span className="read-time">{article.readTime}</span>
                      </div>
                      
                      {/* Was this helpful? feedback */}
                      <div className="article-feedback">
                        {showThanks === articleKey ? (
                          <span className="thanks-message">✓ Thanks for your feedback!</span>
                        ) : (
                          <>
                            <span className="feedback-text">Was this helpful?</span>
                            <button
                              className={`feedback-btn ${articleFeedback === 'helpful' ? 'active' : ''}`}
                              onClick={() => handleFeedback(articleKey, 'helpful')}
                              title="Yes, this was helpful"
                            >
                              👍 {article.helpful && article.helpful > 0 && (
                                <span className="feedback-count">{article.helpful}</span>
                              )}
                            </button>
                            <button
                              className={`feedback-btn ${articleFeedback === 'not-helpful' ? 'active' : ''}`}
                              onClick={() => handleFeedback(articleKey, 'not-helpful')}
                              title="No, this wasn't helpful"
                            >
                              👎 {article.notHelpful && article.notHelpful > 0 && (
                                <span className="feedback-count">{article.notHelpful}</span>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
