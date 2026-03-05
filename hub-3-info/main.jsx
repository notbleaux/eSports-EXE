/**
 * main.jsx
 * Vite entry point for Hub 3 Information Directory
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import all styles
import './styles/information-hub.css'
import './styles/radial-menu.css'
import './styles/conical-directory.css'
import './styles/radiating-search.css'
import './styles/tier-comparison.css'
import './styles/ai-suggestions.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
