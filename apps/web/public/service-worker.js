// [Ver001.000]
/**
 * TENET Platform Service Worker
 * =============================
 * Handles Web Push Protocol notifications and asset caching.
 * 
 * Events:
 * - push: Receives and displays push notifications
 * - notificationclick: Handles notification click actions
 * - install: Caches critical assets
 * - activate: Cleans up old caches and claims clients
 * - fetch: Serves cached assets when available
 */

// ============================================================================
// Configuration
// ============================================================================

const CACHE_NAME = 'tenet-platform-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
];

// API endpoint for click tracking
const API_BASE_URL = self.location.origin;

// ============================================================================
// Install Event — Cache Static Assets
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
});

// ============================================================================
// Activate Event — Cleanup and Claim
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete old caches
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        // Claim all clients immediately
        return self.clients.claim();
      })
  );
});

// ============================================================================
// Push Event — Handle Incoming Notifications
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[Service Worker] Failed to parse push data:', e);
    data = {
      title: 'New Notification',
      options: {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
      }
    };
  }
  
  const title = data.title || 'TENET Platform';
  const options = {
    body: data.options?.body || '',
    icon: data.options?.icon || '/icons/icon-192x192.png',
    badge: data.options?.badge || '/icons/badge-72x72.png',
    tag: data.options?.tag || `notif-${Date.now()}`,
    requireInteraction: data.options?.requireInteraction || false,
    data: {
      ...data.options?.data,
      url: data.options?.data?.url || '/',
      notificationId: data.options?.data?.notification_id || `notif-${Date.now()}`,
      timestamp: Date.now(),
    },
    // Action buttons for supported browsers
    actions: data.options?.actions || [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    // Additional options
    silent: false,
    renotify: false,
  };
  
  // Show the notification
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[Service Worker] Notification shown:', title);
        // Report delivery to server (if needed)
        reportDelivery(options.data.notificationId);
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to show notification:', error);
      })
  );
});

// ============================================================================
// Notification Click Event — Handle User Interaction
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  // Always close the notification
  notification.close();
  
  // Report click to server
  reportClick(data.notificationId);
  
  if (action === 'dismiss') {
    // Just close (already done above)
    return;
  }
  
  // Default action or 'open'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const urlToOpen = data.url || '/';
        
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url && new URL(client.url).pathname === urlToOpen && 'focus' in client) {
            // Focus existing window
            return client.focus().then(() => {
              // Post message to client about notification click
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                notificationId: data.notificationId,
                data: data
              });
            });
          }
        }
        
        // No existing window, open new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================================================
// Notification Close Event — Track Dismissals
// ============================================================================

self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
  
  const data = event.notification.data || {};
  
  // Could track dismissals if needed
  // reportDismissal(data.notificationId);
});

// ============================================================================
// Fetch Event — Serve from Cache
// ============================================================================

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip non-GET and API requests
  if (event.request.url.includes('/api/') || event.request.url.includes('/ws/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-success responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clone the response before caching
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // Could return offline fallback here
            throw error;
          });
      })
  );
});

// ============================================================================
// Message Event — Handle Messages from Main Thread
// ============================================================================

self.addEventListener('message', (event) => {
  const data = event.data;
  
  if (!data || !data.type) {
    return;
  }
  
  switch (data.type) {
    case 'SKIP_WAITING':
      console.log('[Service Worker] Skipping waiting');
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.delete(CACHE_NAME)
          .then(() => caches.open(CACHE_NAME))
          .then(() => ({ success: true }))
      );
      break;
      
    default:
      console.log('[Service Worker] Unknown message type:', data.type);
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Report notification delivery to the server.
 * Used for analytics and debugging.
 */
async function reportDelivery(notificationId) {
  try {
    // Fire-and-forget delivery report
    fetch(`${API_BASE_URL}/api/notifications/delivered`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
      // Don't wait for response
      keepalive: true
    });
  } catch (e) {
    // Silent fail - delivery reporting is non-critical
    console.debug('[Service Worker] Delivery report failed:', e);
  }
}

/**
 * Report notification click to the server.
 * Used for analytics and click tracking.
 */
async function reportClick(notificationId) {
  try {
    // Fire-and-forget click report
    fetch(`${API_BASE_URL}/api/notifications/click/${notificationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clicked: true }),
      keepalive: true
    });
  } catch (e) {
    // Silent fail - click reporting is non-critical
    console.debug('[Service Worker] Click report failed:', e);
  }
}

/**
 * Check if push notifications are supported in this browser.
 * This can be called from the main thread.
 */
function isPushSupported() {
  return 'PushManager' in self && 'Notification' in self;
}

// Log service worker version
console.log(`[Service Worker] Loaded: ${CACHE_NAME}`);
console.log(`[Service Worker] Push supported: ${isPushSupported()}`);
