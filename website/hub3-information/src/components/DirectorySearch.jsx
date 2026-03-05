import { useState, useEffect, useCallback } from 'react';
import { mockSearchResults } from '../data/zones';

function DirectorySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSearching, setIsSearching] = useState(false);

  const categories = ['All', 'Teams', 'Players', 'Tournaments', 'Matches', 'Stats'];

  const handleSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay for realism
    setTimeout(() => {
      const filtered = mockSearchResults.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        return matchesQuery && matchesCategory;
      });
      setResults(filtered);
      setIsSearching(false);
    }, 200);
  }, [activeCategory]);

  useEffect(() => {
    handleSearch(query);
  }, [query, activeCategory, handleSearch]);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section id="search" className="directory-search-section">
      <div className="section-header">
        <h2 className="section-title">Global Directory Search</h2>
        <p className="section-subtitle">Find teams, players, tournaments, and more</p>
      </div>

      <div className="directory-search">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            id="search-input"
            type="text" 
            placeholder="Search teams, players, tournaments... (Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <span className="shortcut-hint">⌘K</span>
        </div>
        
        <div className="category-filters">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {query && (
          <div className="search-results">
            {isSearching ? (
              <div className="search-loading">
                <div className="spinner"></div>
                <span>Searching...</span>
              </div>
            ) : results.length > 0 ? (
              results.map(result => (
                <div key={result.id} className="result-card">
                  <div className="result-image">
                    <img src={result.image} alt={result.name} />
                  </div>
                  <div className="result-info">
                    <h4>{result.name}</h4>
                    <p>{result.description}</p>
                    <span className={`result-category ${result.category.toLowerCase()}`}>
                      {result.category}
                    </span>
                  </div>
                  <div className="result-meta">
                    {result.rating && (
                      <span className="result-rating">★ {result.rating}</span>
                    )}
                    {result.members && (
                      <span className="result-members">{result.members} members</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="search-empty">
                <span className="empty-icon">🔍</span>
                <p>No results found for "{query}"</p>
                <span>Try a different search term or category</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default DirectorySearch;