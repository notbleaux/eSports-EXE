/**
 * RadiantX Service Worker - Enhanced Caching Strategy
 * Version: 2.0.0
 * Strategy: Multi-tier caching with expiration
 */

const CACHE_VERSION = '2';
const STATIC_CACHE = `radiantx-static-v${CACHE_VERSION}`;
const IMAGE_CACHE = `radiantx-images-v${CACHE_VERSION}`;
const API_CACHE = `radiantx-api-v${CACHE_VERSION}`;
const FONT_CACHE = `radiantx-fonts-v${CACHE_VERSION}`;

// Critical static assets - cached on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/landing.html',
  '/launchpad.html',
  '/njz-design-system.css',
  '/assets/css/critical.css',
  '/assets/css/animations.css',
  '/assets/js/main-optimized.js',
  '/favicon.svg',
  '/manifest.json',
  '/offline.html'
];

// Hub-specific assets
const HUB_ASSETS = [
  '/hub1-sator/index.html',
  '/hub1-sator/app.js',
  '/hub1-sator/styles.css',
  '/hub2-rotas/dist/index.html',
  '/hub3-information/dist/index.html',
  '/hub4-games/dist/index.html'
];

// ============================================
// INSTALL EVENT
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll([...STATIC_ASSETS, ...HUB_ASSETS]);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache install failed:', err);
      })
  );
});

// ============================================
// ACTIVATE EVENT
// ============================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('radiantx-') && 
                   name !== STATIC_CACHE && 
                   name !== IMAGE_CACHE && 
                   name !== API_CACHE &&
                   name !== FONT_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// ============================================
// FETCH EVENT
// ============================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except fonts)
  if (url.origin !== self.location.origin && !request.url.includes('fonts.gstatic.com')) {
    return;
  }
  
  // Route to appropriate strategy
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  if (isImage(request)) {
    event.respondWith(cacheFirstWithExpiration(request, IMAGE_CACHE, 30)); // 30 days
    return;
  }
  
  if (isFont(request)) {
    event.respondWith(cacheFirstWithExpiration(request, FONT_CACHE, 365)); // 1 year
    return;
  }
  
  if (isAPI(request)) {
    event.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000)); // 5s timeout
    return;
  }
  
  if (isHTML(request)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  
  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// ============================================
// STRATEGY FUNCTIONS
// ============================================

// Cache First - For static assets that rarely change
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Network error', { status: 408 });
  }
}

// Cache First with Expiration - For images
async function cacheFirstWithExpiration(request, cacheName, days) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    const dateHeader = cached.headers.get('sw-fetched-date');
    if (dateHeader) {
      const age = (Date.now() - parseInt(dateHeader)) / (1000 * 60 * 60 * 24);
      if (age < days) {
        return cached;
      }
    } else {
      // No date header, assume valid
      return cached;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-fetched-date', Date.now().toString());
      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
      cache.put(request, cachedResponse.clone());
      return cachedResponse;
    }
    return response;
  } catch (error) {
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network First with Timeout - For API calls
async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeoutMs);
  });
  
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      timeoutPromise
    ]);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline fallback for API
    return new Response(
      JSON.stringify({ error: 'Offline', cached: false }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale While Revalidate - For HTML pages
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

// Stale While Revalidate with timeout
async function staleWhileRevalidateWithTimeout(request, cacheName, timeoutMs = 3000) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Return cached immediately if available
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached); // Fall back to cache on error
  
  // Race with timeout
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  
  if (cached) {
    // Return cached immediately, update in background
    fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone());
    }).catch(() => {});
    return cached;
  }
  
  // No cache - wait for fetch with timeout
  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return new Response(JSON.stringify({ error: 'Network timeout' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Enhanced Cache First with stale check
async function cacheFirstWithStaleCheck(request, cacheName, maxAgeHours = 24) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Check cache age
    const dateHeader = cached.headers.get('sw-fetched-date');
    if (dateHeader) {
      const age = (Date.now() - parseInt(dateHeader)) / (1000 * 60 * 60);
      if (age < maxAgeHours) {
        return cached;
      }
    }
    
    // Stale - fetch in background but return cached
    fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone());
    }).catch(() => {});
    return cached;
  }
  
  // No cache - fetch and store
  const response = await fetch(request);
  if (response.ok) {
    const headers = new Headers(response.headers);
    headers.set('sw-fetched-date', Date.now().toString());
    const cachedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    cache.put(request, cachedResponse.clone());
    return cachedResponse;
  }
  return response;
}

// Background sync for analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  const queue = await getAnalyticsQueue();
  for (const item of queue) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(item),
        headers: { 'Content-Type': 'application/json' }
      });
      await removeFromQueue(item.id);
    } catch (err) {
      console.error('[SW] Analytics sync failed:', err);
    }
  }
}

// Placeholder functions for queue management
async function getAnalyticsQueue() {
  // Implementation would use IndexedDB
  return [];
}

async function removeFromQueue(id) {
  // Implementation would use IndexedDB
  return true;
}

// Cache size management
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

async function cleanupCache() {
  const cacheNames = [STATIC_CACHE, IMAGE_CACHE, API_CACHE, FONT_CACHE];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        // Remove old entries
        const dateHeader = response.headers.get('sw-fetched-date');
        if (dateHeader) {
          const age = Date.now() - parseInt(dateHeader);
          if (age > MAX_CACHE_AGE) {
            await cache.delete(request);
          }
        }
      }
    }
  }
}

// Run cleanup on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupCache());
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function isStaticAsset(request) {
  return request.url.match(/\.(js|css|woff2?|json|svg)$/);
}

function isImage(request) {
  return request.url.match(/\.(png|jpg|jpeg|webp|gif|avif)$/i);
}

function isFont(request) {
  return request.url.match(/\.(woff2?|ttf|otf)$/i) || 
         request.url.includes('fonts.gstatic.com');
}

function isAPI(request) {
  return request.url.includes('/api/') || 
         request.url.includes('/data/') ||
         request.headers.get('Accept')?.includes('application/json');
}

function isHTML(request) {
  return request.headers.get('Accept')?.includes('text/html') || 
         request.url.match(/\.html$/);
}

// ============================================
// BACKGROUND SYNC
// ============================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
  
  if (event.tag === 'form-sync') {
    event.waitUntil(syncForms());
  }
});

async function syncAnalytics() {
  // Get queued analytics from IndexedDB
  const queue = await getQueuedData('analytics');
  
  for (const data of queue) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      await removeQueuedData('analytics', data.id);
    } catch (err) {
      console.error('[SW] Analytics sync failed:', err);
    }
  }
}

async function syncForms() {
  const queue = await getQueuedData('forms');
  
  for (const data of queue) {
    try {
      await fetch(data.url, {
        method: 'POST',
        body: JSON.stringify(data.payload),
        headers: { 'Content-Type': 'application/json' }
      });
      await removeQueuedData('forms', data.id);
    } catch (err) {
      console.error('[SW] Form sync failed:', err);
    }
  }
}

// Placeholder functions for queue management
async function getQueuedData(type) {
  // Implementation would use IndexedDB
  return [];
}

async function removeQueuedData(type, id) {
  // Implementation would use IndexedDB
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New update from RadiantX',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: data.url || '/',
    actions: data.actions || [],
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'RadiantX',
      options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

// ============================================
// MESSAGE HANDLING
// ============================================

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }
  
  if (event.data?.type === 'PRECACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
