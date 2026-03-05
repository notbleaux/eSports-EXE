/**
 * Demo page for Hub 3 - Information Directory
 * Test all components in isolation
 */

import React, { useState } from 'react';
import {
  InformationHub,
  RadialMenu,
  TierComparison,
  RadiatingSearch,
  AISuggestions,
  ConicalDirectory,
  GAME_CATEGORIES,
  getSuggestionsByRole
} from './components';

// Demo selector for component testing
const COMPONENT_DEMOS = [
  { id: 'full', name: 'Full Hub', component: InformationHub },
  { id: 'radial', name: 'Radial Menu', component: RadialMenu },
  { id: 'tiers', name: 'Tier Comparison', component: TierComparison },
  { id: 'search', name: 'Radiating Search', component: RadiatingSearch },
  { id: 'ai', name: 'AI Suggestions', component: AISuggestions },
  { id: 'conical', name: 'Conical Directory', component: ConicalDirectory }
];

// Individual component demos
const RadialMenuDemo = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  return (
    <div style={{ padding: '2rem', background: '#0a0a0f', minHeight: '100vh' }}>
      <h2 style={{ color: '#e8e6e3', marginBottom: '2rem' }}>Radial Menu Demo</h2>
      <RadialMenu 
        onCategorySelect={setActiveCategory}
        activeCategory={activeCategory}
      />
      {activeCategory && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(232, 230, 227, 0.05)',
          borderRadius: '8px',
          color: '#e8e6e3'
        }}>
          Selected: {activeCategory.name}
        </div>
      )}
    </div>
  );
};

const TierComparisonDemo = () => {
  const [selectedTier, setSelectedTier] = useState(null);
  return (
    <div style={{ padding: '2rem', background: '#0a0a0f', minHeight: '100vh' }}>
      <h2 style={{ color: '#e8e6e3', marginBottom: '2rem' }}>Tier Comparison Demo</h2>
      <TierComparison
        selectedTier={selectedTier}
        onSelectTier={setSelectedTier}
      />
    </div>
  );
};

const SearchDemo = () => {
  return (
    <div style={{ padding: '2rem', background: '#0a0a0f', minHeight: '100vh' }}>
      <h2 style={{ color: '#e8e6e3', marginBottom: '2rem' }}>Radiating Search Demo</h2>
      <RadiatingSearch
        isOpen={true}
        onClose={() => {}}
        categories={GAME_CATEGORIES}
      />
    </div>
  );
};

const AISuggestionsDemo = () => {
  const [role, setRole] = useState('player');
  const suggestions = getSuggestionsByRole(role);
  
  return (
    <div style={{ padding: '2rem', background: '#0a0a0f', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <h2 style={{ color: '#e8e6e3' }}>AI Suggestions Demo</h2>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(232, 230, 227, 0.1)',
            border: '1px solid rgba(232, 230, 227, 0.2)',
            borderRadius: '6px',
            color: '#e8e6e3',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem'
          }}
        >
          <option value="player">Player</option>
          <option value="team_manager">Team Manager</option>
          <option value="coach">Coach</option>
          <option value="analyst">Analyst</option>
          <option value="organizer">Organizer</option>
          <option value="spectator">Spectator</option>
        </select>
      </div>
      
      <AISuggestions
        suggestions={suggestions.suggestions}
        role={role}
      />
    </div>
  );
};

const ConicalDirectoryDemo = () => {
  return (
    <div style={{ padding: '2rem', background: '#0a0a0f', minHeight: '100vh' }}>
      <h2 style={{ color: '#e8e6e3', marginBottom: '2rem' }}>Conical Directory Demo</h2>
      <div style={{ height: '600px' }}>
        <ConicalDirectory />
      </div>
    </div>
  );
};

// Main demo selector
const DemoPage = () => {
  const [activeDemo, setActiveDemo] = useState('full');

  const renderDemo = () => {
    switch (activeDemo) {
      case 'radial':
        return <RadialMenuDemo />;
      case 'tiers':
        return <TierComparisonDemo />;
      case 'search':
        return <SearchDemo />;
      case 'ai':
        return <AISuggestionsDemo />;
      case 'conical':
        return <ConicalDirectoryDemo />;
      case 'full':
      default:
        return <InformationHub />;
    }
  };

  return (
    <div>
      {/* Demo Selector Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(10, 10, 15, 0.98)',
        borderBottom: '1px solid rgba(232, 230, 227, 0.1)',
        padding: '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {COMPONENT_DEMOS.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              style={{
                padding: '0.5rem 1rem',
                background: activeDemo === demo.id 
                  ? 'rgba(201, 176, 55, 0.2)' 
                  : 'rgba(232, 230, 227, 0.05)',
                border: `1px solid ${activeDemo === demo.id 
                  ? 'rgba(201, 176, 55, 0.4)' 
                  : 'rgba(232, 230, 227, 0.1)'}`,
                borderRadius: '6px',
                color: activeDemo === demo.id ? '#c9b037' : '#7a7874',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {demo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Content */}
      <div style={{ paddingTop: activeDemo === 'full' ? 0 : '60px' }}>
        {renderDemo()}
      </div>
    </div>
  );
};

export default DemoPage;