import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { initSentry } from './shared/lib/sentry'

// Initialize Sentry before app mounts (no-op if VITE_SENTRY_DSN not set)
initSentry();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const queryClient = new QueryClient();

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
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
  
  console.log('[Main] App rendered successfully');
} catch (error) {
  console.error('[Main] React mount error:', error);
  window.reactMountError = error.message;
  document.body.innerHTML = '<div style="padding:20px;background:#ff69b4;color:black;font-family:monospace;"><h1>React Mount Error</h1><pre>' + error.message + '</pre><pre>' + error.stack + '</pre></div>';
}
