import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { mockSearchResults } from '../data/zones';

// Custom hook for managing recent searches
function useRecentSearches(maxItems = 5) {
  const [recentSearches, setRecentSearches] = useState(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('njz_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });

  const addRecentSearch = useCallback((term) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, maxItems);
      localStorage.setItem('njz_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, [maxItems]);

  const removeRecentSearch = useCallback((term) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== term);
      localStorage.setItem('njz_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('njz_recent_searches');
  }, []);

  return { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches };
}

// eslint-disable-next-line react/display-name
const DirectorySearch = forwardRef(({ isMobileSearchOpen: externalMobileOpen, setIsMobileSearchOpen: setExternalMobileOpen }, ref) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  
  const searchInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches();

  // Use external state if provided, otherwise use internal
  const isMobileSearchOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
  const setIsMobileSearchOpen = setExternalMobileOpen || setInternalMobileOpen;

  const categories = ['All', 'Teams', 'Players', 'Tournaments', 'Matches', 'Stats'];

  // Check for speech recognition support
  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const hasVoiceSearch = !!SpeechRecognition;

  // Expose imperative handle for parent component
  useImperativeHandle(ref, () => ({
    openMobileSearch: () => setIsMobileSearchOpen(true),
    closeMobileSearch: () => setIsMobileSearchOpen(false),
  }));

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
        // On mobile, open mobile search; on desktop, focus input
        if (window.innerWidth <= 900) {
          setIsMobileSearchOpen(true);
        } else {
          searchInputRef.current?.focus();
        }
      }
      
      // Escape to close mobile search
      if (e.key === 'Escape' && isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSearchOpen, setIsMobileSearchOpen]);

  // Focus mobile input when opened
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSearchOpen]);

  // Handle voice search
  const startVoiceSearch = () => {
    if (!SpeechRecognition) return;
    
    setVoiceError(null);
    setIsListening(true);
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      addRecentSearch(transcript);
      setIsListening(false);
    };
    
    recognition.onerror = () => {
      setVoiceError('Voice search failed. Please try again.');
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  // Handle search submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      addRecentSearch(query);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (term) => {
    setQuery(term);
    if (isMobileSearchOpen) {
      setIsMobileSearchOpen(false);
    }
  };

  // Render search bar content (shared between desktop and mobile)
  const renderSearchInput = (isMobile = false) => (
    <>
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input 
        ref={isMobile ? mobileInputRef : searchInputRef}
        id={isMobile ? 'mobile-search-input' : 'search-input'}
        type="text" 
        placeholder={isMobile ? "Search..." : "Search teams, players, tournaments... (Cmd+K)"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit(e);
        }}
        className={isMobile ? 'mobile-search-input' : 'search-input'}
        aria-label="Search directory"
      />
      {!isMobile && <span className="shortcut-hint">⌘K</span>}
      {hasVoiceSearch && (
        <button
          type="button"
          className={`voice-search-btn ${isListening ? 'listening' : ''}`}
          onClick={startVoiceSearch}
          aria-label={isListening ? 'Listening...' : 'Voice search'}
          title="Voice search"
        >
          {isListening ? '🔴' : '🎤'}
        </button>
      )}
    </>
  );

  return (
    <>
      <section id="search" className="directory-search-section">
        <div className="section-header">
          <h2 className="section-title">Global Directory Search</h2>
          <p className="section-subtitle">Find teams, players, tournaments, and more</p>
        </div>

        <div className="directory-search">
          <form className="search-bar" onSubmit={handleSubmit}>
            {renderSearchInput(false)}
          </form>
          
          {voiceError && (
            <div className="voice-error" style={{ 
              color: 'var(--njz-error-red)', 
              fontSize: '0.875rem', 
              marginTop: 'var(--ma-sm)',
              textAlign: 'center'
            }}>
              {voiceError}
            </div>
          )}
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <div className="search-recent">
              <div className="recent-header">
                <span>Recent Searches</span>
                <button 
                  className="clear-recent"
                  onClick={clearRecentSearches}
                  aria-label="Clear recent searches"
                >
                  Clear
                </button>
              </div>
              <div className="recent-searches-list" role="list">
                {recentSearches.map((term, index) => (
                  <div 
                    key={index} 
                    className="recent-search-item"
                    onClick={() => handleRecentSearchClick(term)}
                    role="listitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRecentSearchClick(term);
                    }}
                  >
                    <span>🕐 {term}</span>
                    <span 
                      className="remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(term);
                      }}
                      role="button"
                      aria-label={`Remove ${term} from recent searches`}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }
                      }}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="category-filters" role="group" aria-label="Category filters">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`filter-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {query && (
            <div className="search-results" role="region" aria-label="Search results">
              {isSearching ? (
                <div className="search-loading">
                  <div className="spinner" aria-hidden="true"></div>
                  <span>Searching...</span>
                </div>
              ) : results.length > 0 ? (
                results.map(result => (
                  <div key={result.id} className="result-card">
                    <div className="result-image">
                      <img src={result.image} alt="" loading="lazy" />
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
                  <span className="empty-icon" aria-hidden="true">🔍</span>
                  <p>No results found for "{query}"</p>
                  <span>Try a different search term or category</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Mobile Search Modal */}
      {isMobileSearchOpen && (
        <div 
          className="mobile-search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Search directory"
        >
          <div className="mobile-search-header">
            <div className="mobile-search-input-wrapper">
              {renderSearchInput(true)}
            </div>
            <button 
              className="close-mobile-search"
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Close search"
            >
              ✕
            </button>
          </div>
          
          {/* Mobile Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <div className="search-recent" style={{ marginTop: 0 }}>
              <div className="recent-header">
                <span>Recent Searches</span>
                <button 
                  className="clear-recent"
                  onClick={clearRecentSearches}
                  aria-label="Clear recent searches"
                >
                  Clear
                </button>
              </div>
              <div className="recent-searches-list">
                {recentSearches.map((term, index) => (
                  <div 
                    key={index} 
                    className="recent-search-item"
                    onClick={() => handleRecentSearchClick(term)}
                  >
                    <span>🕐 {term}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Mobile Category Filters */}
          <div className="category-filters" style={{ marginTop: 'var(--ma-md)', justifyContent: 'flex-start' }}>
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
          
          {/* Mobile Results */}
          {query && (
            <div className="search-results" style={{ marginTop: 'var(--ma-md)' }}>
              {isSearching ? (
                <div className="search-loading">
                  <div className="spinner"></div>
                  <span>Searching...</span>
                </div>
              ) : results.length > 0 ? (
                results.map(result => (
                  <div key={result.id} className="result-card">
                    <div className="result-info">
                      <h4>{result.name}</h4>
                      <p>{result.description}</p>
                      <span className={`result-category ${result.category.toLowerCase()}`}>
                        {result.category}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-empty">
                  <span className="empty-icon">🔍</span>
                  <p>No results found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
});

DirectorySearch.displayName = 'DirectorySearch';

export default DirectorySearch;
export { useRecentSearches };