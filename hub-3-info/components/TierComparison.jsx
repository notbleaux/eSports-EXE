/**
 * TierComparison.jsx
 * NJZ 4eva vs Nvr Die feature comparison
 * Reference: Darkroom comparison, Phamily segmentation
 */

import React, { useState, useCallback } from 'react';
import { TIER_COMPARISON } from '../data/tiers';
import '../styles/tier-comparison.css';

// Checkmark Icon
const CheckIcon = ({ className }) => (
  <svg 
    className={className}
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// X Icon for unavailable features
const XIcon = ({ className }) => (
  <svg 
    className={className}
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Feature Row Component
const FeatureRow = ({ item, isHighlighted }) => {
  return (
    <tr className={`feature-row ${isHighlighted ? 'highlighted' : ''}`}>
      <td className="feature-name">
        <span className="feature-name-text">{item.name}</span>
      </td>
      <td className="feature-tier njz-4eva">
        {item.njz4eva ? (
          <div className="feature-cell">
            <CheckIcon className="feature-check" />
            <span className="feature-label">{item.njz4evaLabel}</span>
          </div>
        ) : (
          <div className="feature-cell unavailable">
            <XIcon className="feature-x" />
            <span className="feature-label">{item.njz4evaLabel || '-'}</span>
          </div>
        )}
      </td>
      <td className="feature-tier nvrdie">
        {item.nvrdie ? (
          <div className="feature-cell">
            <CheckIcon className="feature-check nvrdie-check" />
            <span className="feature-label">{item.nvrdieLabel}</span>
          </div>
        ) : (
          <div className="feature-cell unavailable">
            <XIcon className="feature-x" />
            <span className="feature-label">{item.nvrdieLabel || '-'}</span>
          </div>
        )}
      </td>
    </tr>
  );
};

// Category Section Component
const CategorySection = ({ category, isExpanded, onToggle }) => {
  return (
    <div className={`category-section ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className="category-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="category-name">{category.category}</span>
        <span className="category-count">{category.items.length} features</span>
        <svg 
          className="category-arrow"
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      
      {isExpanded && (
        <table className="features-table">
          <tbody>
            {category.items.map((item, index) => (
              <FeatureRow 
                key={`${category.category}-${item.name}`}
                item={item}
                isHighlighted={index % 2 === 0}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Tier Card Component
const TierCard = ({ tier, isSelected, onSelect, highlights }) => {
  const isNJZ4eva = tier.id === 'njz-4eva';
  
  return (
    <div 
      className={`tier-card ${tier.id} ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(tier.id)}
      style={{ '--tier-gradient': tier.gradient }}
    >
      <div className="tier-card-header">
        <div className="tier-icon">{tier.icon}</div>
        <div className="tier-badge">{tier.price}</div>
      </div>
      
      <h3 className="tier-name">{tier.name}</h3>
      <p className="tier-tagline">{tier.tagline}</p>
      <p className="tier-description">{tier.description}</p>
      
      <div className="tier-highlights">
        {highlights.map((highlight, index) => (
          <div key={index} className="tier-highlight-item">
            <CheckIcon className={`highlight-check ${isNJZ4eva ? 'gold' : 'silver'}`} />
            <span>{highlight}</span>
          </div>
        ))}
      </div>
      
      <button 
        className={`tier-cta ${isNJZ4eva ? 'gold' : 'silver'}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(tier.id);
        }}
      >
        {isSelected ? 'Selected' : `Choose ${tier.name}`}
      </button>
    </div>
  );
};

/**
 * Main Tier Comparison Component
 */
const TierComparison = ({ selectedTier, onSelectTier }) => {
  const [expandedCategories, setExpandedCategories] = useState(
    TIER_COMPARISON.features.map((_, i) => i === 0) // First category expanded by default
  );
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  const toggleCategory = useCallback((index) => {
    setExpandedCategories(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedCategories(TIER_COMPARISON.features.map(() => true));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedCategories(TIER_COMPARISON.features.map(() => false));
  }, []);

  return (
    <div className="tier-comparison">
      {/* View Mode Toggle */}
      <div className="tier-comparison-controls">
        <div className="view-toggle">
          <button 
            className={viewMode === 'cards' ? 'active' : ''}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </button>
          <button 
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
          >
            Compare All
          </button>
        </div>
        
        {viewMode === 'table' && (
          <div className="expand-controls">
            <button onClick={expandAll}>Expand All</button>
            <button onClick={collapseAll}>Collapse All</button>
          </div>
        )}
      </div>

      {viewMode === 'cards' ? (
        <div className="tier-cards-grid">
          {TIER_COMPARISON.tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              isSelected={selectedTier === tier.id}
              onSelect={onSelectTier}
              highlights={TIER_COMPARISON.highlights[tier.id === 'njz-4eva' ? 'njz4eva' : 'nvrdie']}
            />
          ))}
        </div>
      ) : (
        <div className="tier-comparison-table-view">
          <div className="tier-table-header">
            <div className="tier-header-cell feature-col">Feature</div>
            <div className="tier-header-cell njz-4eva-col">
              <span className="tier-header-icon">👑</span>
              <span>NJZ 4eva</span>
              <span className="tier-header-badge premium">Premium</span>
            </div>
            <div className="tier-header-cell nvrdie-col">
              <span className="tier-header-icon">⚡</span>
              <span>NJZ Nvr Die</span>
              <span className="tier-header-badge standard">Standard</span>
            </div>
          </div>
          
          <div className="tier-categories">
            {TIER_COMPARISON.features.map((category, index) => (
              <CategorySection
                key={category.category}
                category={category}
                isExpanded={expandedCategories[index]}
                onToggle={() => toggleCategory(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {selectedTier && (
        <div className="tier-selection-bar">
          <div className="tier-selection-content">
            <span className="tier-selection-text">
              Selected: <strong>{TIER_COMPARISON.tiers.find(t => t.id === selectedTier)?.name}</strong>
            </span>
            <button 
              className="tier-selection-cta"
              onClick={() => {
                // Handle upgrade/selection
                console.log('Selected tier:', selectedTier);
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TierComparison;