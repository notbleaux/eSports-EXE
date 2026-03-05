/**
 * RadiatingSearch.jsx
 * Search with radiating results visualization
 * Reference: Gufram grid expansion, signal propagation
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDebounce } from '../hooks';
import { filterItems } from '../utils/helpers';
import '../styles/radiating-search.css';

// Search data - teams, tournaments, players
const SEARCH_DATA = [
  // Teams
  { id: 1, type: 'team', name: 'Nexus Gaming', category: 'FPS', region: 'NA', tier: 'S', members: 5 },
  { id: 2, type: 'team', name: 'Apex Predators', category: 'Battle Royale', region: 'EU', tier: 'S', members: 4 },
  { id: 3, type: 'team', name: 'Phantom Legion', category: 'MOBA', region: 'Asia', tier: 'A', members: 5 },
  { id: 4, type: 'team', name: 'Storm Riders', category: 'MOBA', region: 'NA', tier: 'A', members: 5 },
  { id: 5, type: 'team', name: 'Cyber Wolves', category: 'FPS', region: 'EU', tier: 'B', members: 5 },
  { id: 6, type: 'team', name: 'Neon Dragons', category: 'RPG', region: 'Asia', tier: 'S', members: 8 },
  { id: 7, type: 'team', name: 'Void Walkers', category: 'Strategy', region: 'NA', tier: 'B', members: 3 },
  { id: 8, type: 'team', name: 'Solar Flare', category: 'Sports', region: 'EU', tier: 'A', members: 6 },
  { id: 9, type: 'team', name: 'Thunder Strike', category: 'FPS', region: 'Asia', tier: 'S', members: 5 },
  { id: 10, type: 'team', name: 'Crystal Blades', category: 'MOBA', region: 'SA', tier: 'C', members: 5 },
  
  // Tournaments
  { id: 101, type: 'tournament', name: 'World Championship 2024', game: 'Multiple', prize: '$5,000,000', teams: 32 },
  { id: 102, type: 'tournament', name: 'Regional Masters', game: 'FPS', prize: '$500,000', teams: 16 },
  { id: 103, type: 'tournament', name: 'MOBA Summit', game: 'MOBA', prize: '$1,000,000', teams: 12 },
  { id: 104, type: 'tournament', name: 'Battle Royale Cup', game: 'Battle Royale', prize: '$250,000', teams: 100 },
  { id: 105, type: 'tournament', name: 'Indie Showdown', game: 'Indie', prize: '$50,000', teams: 64 },
  
  // Players
  { id: 201, type: 'player', name: 'Phoenix', team: 'Nexus Gaming', role: 'AWPer', rank: 1 },
  { id: 202, type: 'player', name: 'Viper', team: 'Apex Predators', role: 'IGL', rank: 3 },
  { id: 203, type: 'player', name: 'Shadow', team: 'Phantom Legion', role: 'Mid', rank: 5 },
  { id: 204, type: 'player', name: 'Blaze', team: 'Neon Dragons', role: 'Carry', rank: 2 },
  { id: 205, type: 'player', name: 'Frost', team: 'Cyber Wolves', role: 'Support', rank: 12 },
  { id: 206, type: 'player', name: 'Storm', team: 'Thunder Strike', role: 'Entry', rank: 4 },
  { id: 207, type: 'player', name: 'Nova', team: 'Solar Flare', role: 'Captain', rank: 8 },
  { id: 208, type: 'player', name: 'Echo', team: 'Void Walkers', role: 'Strategist', rank: 15 }
];

// Type icons
const TYPE_ICONS = {
  team: '👥',
  tournament: '🏆',
  player: '🎮'
};

// Type colors
const TYPE_COLORS = {
  team: '#4ecdc4',
  tournament: '#c9b037',
  player: '#00f0ff'
};

// Radiating Ring Component
const RadiatingRing = ({ delay, isActive }) => {
  return (
    <div 
      className={`radiating-ring ${isActive ? 'active' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
};

// Search Result Node Component
const ResultNode = ({ result, index, total, isHovered, onHover, onClick }) => {
  // Calculate position in radial layout
  const angle = useMemo(() => {
    const baseAngle = (index / Math.min(total, 8)) * 2 * Math.PI - Math.PI / 2;
    const ringIndex = Math.floor(index / 8);
    const ringOffset = ringIndex * 0.3;
    return baseAngle + ringOffset;
  }, [index, total]);

  const radius = useMemo(() => {
    const ringIndex = Math.floor(index / 8);
    return 120 + ringIndex * 80;
  }, [index]);

  const position = useMemo(() => ({
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  }), [angle, radius]);

  return (
    <div
      className={`result-node ${result.type} ${isHovered ? 'hovered' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        '--node-color': TYPE_COLORS[result.type]
      }}
      onMouseEnter={() => onHover(result)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(result)}
    >
      <div className="result-node-pulse" />
      <div className="result-node-content">
        <span className="result-node-icon">{TYPE_ICONS[result.type]}</span>
        <div className="result-node-info">
          <span className="result-node-name">{result.name}</span>
          <span className="result-node-type">{result.type}</span>
        </div>
      </div>
    </div>
  );
};

// Result Detail Card
const ResultDetailCard = ({ result, onClose }) => {
  if (!result) return null;

  const getDetailFields = () => {
    switch (result.type) {
      case 'team':
        return [
          { label: 'Category', value: result.category },
          { label: 'Region', value: result.region },
          { label: 'Tier', value: result.tier },
          { label: 'Members', value: result.members }
        ];
      case 'tournament':
        return [
          { label: 'Game', value: result.game },
          { label: 'Prize Pool', value: result.prize },
          { label: 'Teams', value: result.teams }
        ];
      case 'player':
        return [
          { label: 'Team', value: result.team },
          { label: 'Role', value: result.role },
          { label: 'Rank', value: `#${result.rank}` }
        ];
      default:
        return [];
    }
  };

  return (
    <div className={`result-detail-card ${result.type}`}>
      <button className="result-detail-close" onClick={onClose}>×</button>
      
      <div className="result-detail-header">
        <span className="result-detail-icon">{TYPE_ICONS[result.type]}</span>
        <h4>{result.name}</h4>
        <span className="result-detail-type">{result.type}</span>
      </div>
      
      <div className="result-detail-fields">
        {getDetailFields().map((field, index) => (
          <div key={index} className="result-detail-field">
            <span className="field-label">{field.label}</span>
            <span className="field-value">{field.value}</span>
          </div>
        ))}
      </div>
      
      <button className="result-detail-action">
        View {result.type === 'player' ? 'Profile' : 'Details'} →
      </button>
    </div>
  );
};

/**
 * Main Radiating Search Component
 */
const RadiatingSearch = ({ isOpen, onClose, categories }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hoveredResult, setHoveredResult] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [activeFilters, setActiveFilters] = useState(['team', 'tournament', 'player']);
  
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Simulate API delay
    const timer = setTimeout(() => {
      const filtered = SEARCH_DATA.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                            (item.category && item.category.toLowerCase().includes(debouncedQuery.toLowerCase())) ||
                            (item.team && item.team.toLowerCase().includes(debouncedQuery.toLowerCase()));
        const matchesFilter = activeFilters.includes(item.type);
        return matchesQuery && matchesFilter;
      });
      
      setResults(filtered);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [debouncedQuery, activeFilters]);

  // Handle filter toggle
  const toggleFilter = useCallback((filter) => {
    setActiveFilters(prev => {
      if (prev.includes(filter)) {
        return prev.length > 1 ? prev.filter(f => f !== filter) : prev;
      }
      return [...prev, filter];
    });
  }, []);

  // Handle result click
  const handleResultClick = useCallback((result) => {
    setSelectedResult(result);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelectedResult(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Generate radiating rings
  const rings = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      id: i,
      delay: i * 200,
      isActive: results.length > 0 && !isSearching
    }));
  }, [results.length, isSearching]);

  // Group results by type
  const groupedResults = useMemo(() => {
    return results.reduce((acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type].push(result);
      return acc;
    }, {});
  }, [results]);

  return (
    <div 
      ref={searchContainerRef}
      className={`radiating-search ${isOpen ? 'open' : ''} ${results.length > 0 ? 'has-results' : ''}`}
    >
      {/* Search Input Container */}
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <svg 
            className="search-icon"
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search teams, tournaments, players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
          
          {query && (
            <button className="search-clear" onClick={clearSearch}>×</button>
          )}
          
          {isSearching && (
            <div className="search-spinner" />
          )}
        </div>

        {/* Filter Pills */}
        <div className="search-filters"
        >
          {[
            { id: 'team', label: 'Teams', icon: '👥' },
            { id: 'tournament', label: 'Tournaments', icon: '🏆' },
            { id: 'player', label: 'Players', icon: '🎮' }
          ].map((filter) => (
            <button
              key={filter.id}
              className={`filter-pill ${activeFilters.includes(filter.id) ? 'active' : ''}`}
              onClick={() => toggleFilter(filter.id)}
              style={{ '--filter-color': TYPE_COLORS[filter.id] }}
            >
              <span>{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Radiating Results Visualization */}
      <div className="radiating-results-container"
      >
        {/* Radiating Rings */}
        <div className="radiating-rings"
        >
          {rings.map((ring) => (
            <RadiatingRing 
              key={ring.id}
              delay={ring.delay}
              isActive={ring.isActive}
            />
          ))}
        </div>

        {/* Center Hub */}
        <div className="search-hub"
        >
          <div className="search-hub-inner"
          >
            {isSearching ? (
              <span className="hub-text searching">Searching...</span>
            ) : results.length > 0 ? (
              <>
                <span className="hub-count">{results.length}</span>
                <span className="hub-text">results</span>
              </>
            ) : query ? (
              <span className="hub-text">No results</span>
            ) : (
              <span className="hub-text">Type to search</span>
            )}
          </div>
        </div>

        {/* Result Nodes */}
        {results.length > 0 && !isSearching && (
          <div className="result-nodes-container"
          >
            {results.slice(0, 24).map((result, index) => (
              <ResultNode
                key={`${result.type}-${result.id}`}
                result={result}
                index={index}
                total={Math.min(results.length, 24)}
                isHovered={hoveredResult?.id === result.id && hoveredResult?.type === result.type}
                onHover={setHoveredResult}
                onClick={handleResultClick}
              />
            ))}
          </div>
        )}

        {/* Result Detail Card */}
        <ResultDetailCard 
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      </div>

      {/* Results List View (Alternative) */}
      {results.length > 0 && !isSearching && (
        <div className="search-results-list"
        >
          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type} className="result-group"
            >
              <h4 className="result-group-header"
              >
                <span>{TYPE_ICONS[type]}</span>
                {type.charAt(0).toUpperCase() + type.slice(1)}s
                <span className="result-count">{items.length}</span>
              </h4>
              <div className="result-group-items"
              >
                {items.slice(0, 5).map((item) => (
                  <div 
                    key={item.id}
                    className="result-list-item"
                    onClick={() => handleResultClick(item)}
                  >
                    <span className="item-name">{item.name}</span>
                    <span className="item-meta">
                      {item.category || item.game || item.team}
                    </span>
                  </div>
                ))}
                {items.length > 5 && (
                  <button className="result-show-more"
                  >
                    +{items.length - 5} more
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RadiatingSearch;