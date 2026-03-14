/**
 * Main Entry Point
 * NJZ Platform v2.0
 * 
 * [Ver003.000] - Enhanced with performance monitoring and lazy loading
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './styles/mobile.css'

// Use AppErrorBoundary from components/error for consistency
import { AppErrorBoundary } from './components/error'
import { performanceMonitor } from './monitoring/PerformanceMonitor'

// Initialize performance monitoring immediately
performanceMonitor.initialize();

// Mark main script execution start
performanceMonitor.markUserTiming('main-js-start');

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

// Measure main script execution
const mainJsDuration = performanceMonitor.measureUserTiming('main-js-start');
if (mainJsDuration) {
  console.log('[Performance] Main JS executed in:', mainJsDuration.toFixed(2), 'ms');
}

// Preload critical chunks after initial render
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Preload likely navigation targets
    const preloadHubs = ['/sator', '/rotas'];
    
    // Use requestIdleCallback for non-critical preloading
    const schedulePreload = window.requestIdleCallback || window.setTimeout;
    
    schedulePreload(() => {
      preloadHubs.forEach(hub => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = hub;
        document.head.appendChild(link);
      });
    }, { timeout: 2000 });
  });
}
