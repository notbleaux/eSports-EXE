/**
 * Main Entry Point
 * NJZ Platform v2.0 - PWA Enabled
 * 
 * [Ver004.000] - Added Service Worker registration with update handling
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
import { createLogger } from '@/utils/logger';

const logger = createLogger('Main');

// Initialize performance monitoring immediately
performanceMonitor.initialize();

// Mark main script execution start
performanceMonitor.markUserTiming('main-js-start');

// Service Worker Registration with Update Handling
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports',
      })

      console.log('[SW] Registered successfully:', registration.scope)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[SW] New version available')
                
                // Dispatch custom event for the app
                window.dispatchEvent(new CustomEvent('sw-update-available', {
                  detail: { registration }
                }))
              } else {
                // First install
                console.log('[SW] Content cached for offline use')
              }
            }
          })
        }
      })

      // Check for updates periodically (every 30 minutes)
      setInterval(() => {
        registration.update()
        console.log('[SW] Checking for updates...')
      }, 30 * 60 * 1000)

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_ACTIVATED') {
          console.log('[SW] Activated version:', event.data.version)
        }
      })

      // Handle offline/online events
      window.addEventListener('online', () => {
        console.log('[App] Connection restored')
        document.body.classList.remove('is-offline')
      })

      window.addEventListener('offline', () => {
        console.log('[App] Connection lost')
        document.body.classList.add('is-offline')
      })

      // Set initial online status
      if (!navigator.onLine) {
        document.body.classList.add('is-offline')
      }

      return registration
    } catch (error) {
      logger.error('Service worker registration failed', { error: error instanceof Error ? error.message : String(error) })
    }
  } else {
    console.log('[SW] Service workers not supported')
  }
}

// Register service worker
const swRegistration = registerServiceWorker()

// Make registration available globally for components
window.swRegistration = swRegistration

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

// Expose PWA utilities
window.pwaUtils = {
  // Check if app is installed
  isInstalled: () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true
  },

  // Get service worker registration
  getRegistration: () => swRegistration,

  // Check for updates
  checkForUpdates: async () => {
    const reg = await swRegistration
    if (reg) {
      await reg.update()
      return reg.waiting !== null
    }
    return false
  },

  // Skip waiting and reload
  applyUpdate: async () => {
    const reg = await swRegistration
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  },

  // Clear all caches
  clearCaches: async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel()
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_ALL_CACHES' },
        [channel.port2]
      )
      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          resolve(event.data?.success)
        }
      })
    }
  },
}
