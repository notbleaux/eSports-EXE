/**
 * RadiantX Service Worker
 * Caching strategy: Cache First, Network Fallback
 * Version: 1.0.0
 */

const CACHE_NAME = 'radiantx-v1';
const STATIC_CACHE = 'radiantx-static-v1';
const IMAGE_CACHE = 'radiantx-images-v1';
const API_CACHE = 'radiantx-api-v1';

// Critical static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/landing.html',
  '/launchpad.html',
  '/njz-design-system.css',
  '/assets/js/main.js',
  '/assets/css/critical.css',
  '/favicon.svg',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.json'
];

// Hub-specific assets
const HUB_ASSETS = [
  '/njz-central/index.html',
  '/njz-central/app.js',
  '/njz-central/styles.css',
  '/hub1-sator/index.html',
  '/hub1-sator/app.js',
  '/hub1-sator/styles.css',
  '/hub2-rotas/index.html',
  '/hub2-rotas/dist/index.html',
  '/hub3-information/dist/index.html',
  '/hub4-games/dist/index.html'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll([...STATIC_ASSETS, ...HUB_ASSETS]);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Cache install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('radiantx-') && 
                   name !== STATIC_CACHE && 
                   name !== IMAGE_CACHE && 
                   name !== API_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
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
  
  // Strategy: Cache First for static assets
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // Strategy: Cache First with expiration for images
  if (isImage(request)) {
    event.respondWith(cacheFirstWithExpiration(request, IMAGE_CACHE, 30)); // 30 days
    return;
  }
  
  // Strategy: Network First for API calls
  if (isAPI(request)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }
  
  // Strategy: Stale While Revalidate for HTML
  if (isHTML(request)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  
  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// Helper functions
function isStaticAsset(request) {
  return request.url.match(/\.(js|css|woff2?|json|svg)$/);
}

function isImage(request) {
  return request.url.match(/\.(png|jpg|jpeg|webp|gif|avif)$/i);
}

function isAPI(request) {
  return request.url.includes('/api/') || request.url.includes('/data/');
}

function isHTML(request) {
  return request.headers.get('Accept')?.includes('text/html') || 
         request.url.match(/\.html$/);
}

// Cache First strategy
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

// Cache First with expiration
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

// Network First strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale While Revalidate strategy
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

// Network with cache fallback
async function networkWithCacheFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Background sync for analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Send queued analytics data when back online
  const queue = await getAnalyticsQueue();
  for (const data of queue) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      await removeFromQueue(data.id);
    } catch (err) {
      console.error('[SW] Analytics sync failed:', err);
    }
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
