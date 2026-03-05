/**
 * RadiatingSearch.jsx
 * Search results radiate from center along 8 vectors
 * Reference: Landingi AI, cloud-like search transitions
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDebounce, useAnimatedCounter } from '../hooks';
import { filterItems } from '../utils/helpers';
import { TEAMS_DATA } from '../data/teams';
import { GAME_CATEGORIES } from '../data/categories';
import '../styles/radiating-search.css';

// Search data combined from all sources
const SEARCH_DATA = [
  ...TEAMS_DATA.sampleTeams.map(team => ({
    ...team,
    type: 'team',
    searchableText: `${team.name} ${team.region} ${team.tier}`
  })),
  ...GAME_CATEGORIES.map(cat => ({
    ...cat,
    type: 'category',
    searchableText: `${cat.name} ${cat.fullName} ${cat.description}`
  }))
];

// Vector directions for 8 radiating arms (in degrees)
const VECTORS = [0, 45, 90, 135, 180, 225, 270, 315];

// Get color based on result type
const getResultColor = (type, item) => {
  if (type === 'category') return item.color;
  if (type === 'team') {
    const colors = {
      'tier-s': '#c9b037',
      'tier-a': '#e8e6e3',
      'tier-b': '#b8b6b2',
      'tier-c': '#7a7874',
      'tier-d': '#5a5854'
    };
    return colors[item.tier] || '#7a7874';
  }
  return '#c9b037';
};

// Individual result node
const ResultNode = ({ item, index, vector, delay, onClick, isVisible }) => {
  const distance = 120 + (index * 80);
  const angleRad = (vector * Math.PI) / 180;
  const x = Math.cos(angleRad) * distance;
  const y = Math.sin(angleRad) * distance;
  
  const color = getResultColor(item.type, item);
  
  return (
    <div
      className={`result-node ${item.type} ${isVisible ? 'visible' : ''}`}
      style={{
        '--x': `${x}px`,
        '--y': `${y}px`,
        '--delay': `${delay}ms`,
        '--node-color': color
      }}
      onClick={() => onClick(item)}
    >
      <div className="result-node-glow" style={{ background: color }} />
      <div className="result-node-content">
        {item.type === 'category' && (
          <>
            <span className="result-icon">{item.icon}</span>
            <span className="result-name">{item.name}</span>
            <span className="result-meta">{item.totalTeams} teams</span>
          </>
        )}
        {item.type === 'team' && (
          <>
            <span className={`result-tier ${item.tier}`}>{item.tier.replace('tier-', '').toUpperCase()}</span>
            <span className="result-name">{item.name}</span>
            <span className="result-meta">{item.region.toUpperCase()}</span>
          </>
        )}
      </div>
    </div>
  );
};

// Cloud particle for background effect
const CloudParticle = ({ index, total }) => {
  const angle = (index / total) * 360;
  const distance = 200 + Math.random() * 300;
  const size = 20 + Math.random() * 60;
  const delay = Math.random() * 2000;
  const duration = 4000 + Math.random() * 2000;
  
  return (
    <div
      className="cloud-particle"
      style={{
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        '--size': `${size}px`,
        '--delay': `${delay}ms`,
        '--duration': `${duration}ms`
      }}
    />
  );
};

// Main Radiating Search Component
const RadiatingSearch = ({ onResultSelect, placeholder = "Search teams, games, categories..." }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const inputRef = useRef(null);
  
  const debouncedQuery = useDebounce(query, 300);
  
  // Filter results based on query
  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    
    return filterItems(SEARCH_DATA, debouncedQuery, ['searchableText', 'name'])
      .slice(0, 16); // Max 16 results (2 per vector)
  }, [debouncedQuery]);
  
  // Distribute results across 8 vectors
  const distributedResults = useMemo(() => {
    const distributed = VECTORS.map(vector => ({
      vector,
      items: []
    }));
    
    results.forEach((item, index) => {
      const vectorIndex = index % 8;
      distributed[vectorIndex].items.push({
        ...item,
        index: Math.floor(index / 8)
      });
    });
    
    return distributed.filter(v => v.items.length > 0);
  }, [results]);
  
  // Handle search
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
        setHasSearched(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setHasSearched(false);
      setSelectedResult(null);
    }
  }, [debouncedQuery]);
  
  const handleInputChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);
  
  const handleResultClick = useCallback((item) => {
    setSelectedResult(item);
    onResultSelect?.(item);
  }, [onResultSelect]);
  
  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedResult(null);
    inputRef.current?.focus();
  }, []);
  
  const resultCount = results.length;
  
  return (
    <div className={`radiating-search ${hasSearched ? 'has-results' : ''} ${selectedResult ? 'has-selection' : ''}`}>
      {/* Cloud particles background */}
      <div className="cloud-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <CloudParticle key={i} index={i} total={20} />
        ))}
      </div>
      
      {/* Search center */}
      <div className="search-center">
        <div className="search-input-wrapper">
          <div className="search-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
          />
          {query && (
            <button className="search-clear" onClick={handleClear}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
          {isSearching && (
            <div className="search-spinner">
              <div className="spinner-ring" />
            </div>
          )}
        </div>
        
        {/* Result counter */}
        {hasSearched && !isSearching && (
          <div className="result-counter">
            <span className="counter-value">{resultCount}</span>
            <span className="counter-label">{resultCount === 1 ? 'result' : 'results'}</span>
          </div>
        )}
        
        {/* Selected result preview */}
        {selectedResult && (
          <div className="selected-preview">
            <div 
              className="preview-glow"
              style={{ background: getResultColor(selectedResult.type, selectedResult) }}
            />
            <div className="preview-content">
              {selectedResult.type === 'category' && (
                <>
                  <span className="preview-icon">{selectedResult.icon}</span>
                  <h4>{selectedResult.fullName}</h4>
                  <p>{selectedResult.description}</p>
                </>
              )}
              {selectedResult.type === 'team' && (
                <>
                  <span className={`preview-tier ${selectedResult.tier}`}>
                    {selectedResult.tier.replace('tier-', '').toUpperCase()}
                  </span>
                  <h4>{selectedResult.name}</h4>
                  <p>{selectedResult.region.toUpperCase()} • {selectedResult.members} members • Founded {selectedResult.founded}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Radiating results */}
      <div className="radiating-results">
        {distributedResults.map((vectorGroup) => (
          <div 
            key={vectorGroup.vector} 
            className="vector-arm"
            style={{ '--vector-angle': `${vectorGroup.vector}deg` }}
          >
            {vectorGroup.items.map((item, idx) => (
              <ResultNode
                key={`${item.type}-${item.id}`}
                item={item}
                index={idx}
                vector={vectorGroup.vector}
                delay={idx * 100 + Math.random() * 200}
                onClick={handleResultClick}
                isVisible={hasSearched && !isSearching}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Search suggestions */}
      {!hasSearched && !query && (
        <div className="search-suggestions">
          <div className="suggestion-group">
            <span className="suggestion-label">Popular</span>
            <div className="suggestion-tags">
              <button onClick={() => setQuery('Valorant')}>Valorant</button>
              <button onClick={() => setQuery('Tier S')}>Tier S</button>
              <button onClick={() => setQuery('MOBA')}>MOBA</button>
              <button onClick={() => setQuery('Nexus')}>Nexus</button>
            </div>
          </div>
          <div className="suggestion-group">
            <span className="suggestion-label">Categories</span>
            <div className="suggestion-tags">
              {GAME_CATEGORIES.slice(0, 4).map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setQuery(cat.name)}
                  style={{ '--tag-color': cat.color }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* No results message */}
      {hasSearched && !isSearching && results.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h4>No results found</h4>
          <p>Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default RadiatingSearch;
