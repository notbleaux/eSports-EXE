import React from 'react';
import ReactDOM from 'react-dom/client';
import GamesHub from './components/GamesHub';

/**
 * The Nexus - Demo Entry Point
 * 
 * This is the main entry point for the Games Hub demo.
 * In production, import the GamesHub component from @njz/hub-4-games
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GamesHub />
  </React.StrictMode>
);
