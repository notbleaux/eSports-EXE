/**
 * Main Entry Point
 * NJZ Platform v2.0 - PWA Enabled
 * 
 * [Ver004.001] - Added error handling for debugging
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './styles/design-system.css'
import './styles/mobile.css'

// Global error handler to catch initialization errors
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('[FATAL ERROR]', msg, error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; background: #ff69b4; color: black; font-family: monospace;">
        <h1>Initialization Error</h1>
        <pre>${msg}\n${error?.stack || ''}</pre>
      </div>
    `;
  }
  return false;
};

try {
  // Import error boundary
  const { AppErrorBoundary } = await import('./components/error');
  
  const root = ReactDOM.createRoot(document.getElementById('root'));

  root.render(
    <React.StrictMode>
      <AppErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppErrorBoundary>
    </React.StrictMode>,
  );

} catch (error) {
  console.error('[INIT ERROR]', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; background: #ff69b4; color: black; font-family: monospace;">
        <h1>Failed to start application</h1>
        <pre>${error.message}\n${error.stack || ''}</pre>
      </div>
    `;
  }
}
