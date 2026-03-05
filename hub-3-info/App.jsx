/**
 * App.jsx
 * Hub 3 Information Directory - Standalone Application
 */

import React from 'react';
import InformationHub from './components/InformationHub';

// Import all styles
import './styles/information-hub.css';
import './styles/radial-menu.css';
import './styles/conical-directory.css';
import './styles/radiating-search.css';
import './styles/tier-comparison.css';
import './styles/ai-suggestions.css';

const App = () => {
  return (
    <InformationHub />
  );
};

export default App;
