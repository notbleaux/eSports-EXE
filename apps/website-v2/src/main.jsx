import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));

// Mark that React is mounting (for debugging)
window.reactRootMounted = true;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
