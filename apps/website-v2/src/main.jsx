import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Mark that React is loading (for debugging)
window.reactLoading = true;

console.log('[Main] Starting React load...');

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  // Mark that React is mounting (for debugging)
  window.reactRootMounted = true;
  console.log('[Main] React root created, rendering app...');
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('[Main] App rendered successfully');
} catch (error) {
  console.error('[Main] React mount error:', error);
  window.reactMountError = error.message;
  document.body.innerHTML = '<div style="padding:20px;background:#ff69b4;color:black;font-family:monospace;"><h1>React Mount Error</h1><pre>' + error.message + '</pre><pre>' + error.stack + '</pre></div>';
}
