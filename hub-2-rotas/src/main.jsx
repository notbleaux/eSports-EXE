import React from 'react';
import ReactDOM from 'react-dom/client';
import ROTASHub from './components/ROTASHub';
import './index.css';

// Import design tokens
import '/shared/styles/design-tokens.css';

/**
 * ROTAS Hub 2 - The Harmonic Layer
 * 
 * A glassmorphism-styled analytics dashboard featuring:
 * - Intersecting elliptical fields (Jungian archetypes)
 * - Harmonic wave visualizations
 * - WebGL probability clouds
 * - Drag-and-drop component library
 * - Fluid morphing animations at 60fps
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ROTASHub />
  </React.StrictMode>
);
