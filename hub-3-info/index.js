/**
 * Hub 3 - Information Directory
 * Main Entry Point
 * 
 * The Directory - NJZ Platform's Information Hub
 * Features:
 * - 12-section radial menu (zodiacal navigation)
 * - Conical 3D team directory
 * - Radiating search with cloud transitions
 * - Tier comparison matrix
 * - AI-powered contextual suggestions
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import InformationHub from './components/InformationHub';

// Import styles
import './styles/information-hub.css';
import './styles/radial-menu.css';
import './styles/conical-directory.css';
import './styles/radiating-search.css';
import './styles/tier-comparison.css';
import './styles/ai-suggestions.css';

// Mount the application
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <InformationHub />
    </React.StrictMode>
  );
}

export { default as InformationHub } from './components/InformationHub';
export { default as RadialMenu } from './components/RadialMenu';
export { default as ConicalDirectory } from './components/ConicalDirectory';
export { default as RadiatingSearch } from './components/RadiatingSearch';
export { default as TierComparison } from './components/TierComparison';
export { default as AISuggestions } from './components/AISuggestions';
