// @ts-nocheck
/**
 * Service Worker - Production-Ready PWA with Offline Support
 * [Ver003.000] - Enhanced for SATOR hub offline player stats
 * 
 * Features:
 * - Stale-while-revalidate for API calls
 * - Precache: index.html, main assets
 * - Runtime cache: player data, API responses
 * - Offline fallback page
 * - SkipWaiting for immediate activation
 * - Update notifications
 * - Bundle size optimization (<500KB initial)
 */

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

// Cache versions - increment to invalidate
const CACHE_VERSION = 'v3'
const STATIC_CACHE = `njzitegeiste-static-${CACHE_VERSION}`
const API_CACHE = `njzitegeiste-api-${CACHE_VERSION}`
const PLAYER_CACHE = `njzitegeiste-players-${CACHE_VERSION}`
const IMAGE_CACHE = `njzitegeiste-images-${CACHE_VERSION}`
const FALLBACK_CACHE = `njzitegeiste-fallback-${CACHE_VERSION}`

// Precache critical assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
]

// API routes for stale-while-revalidate
const API_ROUTES = [
  '/api/',
  '/v1/',
  'https://api.pandascore.co',
  'https://vlrggapi.vercel.app',
]

// Player data endpoints
const PLAYER_ENDPOINTS = [
  '/api/players',
  '/api/player',
  '/v1/players',
]

// Offline fallback page content
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - NJZiteGeisTe</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0f;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #00f0ff; }
    p { color: #a0a0a0; margin-bottom: 1.5rem; line-height: 1.6; }
    .btn {
      background: linear-gradient(135deg, #00f0ff, #9d4edd);
      color: #0a0a0f;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
    .btn:hover { opacity: 0.9; }
    .cached-data {
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(0, 240, 255, 0.05);
      border: 1px solid rgba(0, 240, 255, 0.2);
      border-radius: 8px;
      max-width: 400px;
    }
    .cached-data h2 { font-size: 1rem; color: #00f0ff; margin-bottom: 0.5rem; }
    .cached-data p { font-size: 0.875rem; margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="icon">📡</div>
  <h1>You're Offline</h1>
  <p>Connection lost. Your cached player data and analytics are still available.</p>
  <a href="/" class="btn">Go to Dashboard</a>
  <div class="cached-data">
    <h2>📊 Available Offline</h2>
    <p>Player stats, match history, and your saved analytics are accessible offline.</p>
  </div>
  <script>
    // Try to reload when connection returns
    window.addEventListener('online', () => {
      window.location.reload();
    });
  </script>
</body>
</html>`

// Install: Precache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    (async () => {
      // Cache static assets
      const staticCache = await caches.open(STATIC_CACHE)
      await staticCache.addAll(PRECACHE_ASSETS)
      
      // Cache offline fallback
      const fallbackCache = await caches.open(FALLBACK_CACHE)
      const offlineResponse = new Response(OFFLINE_FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html' },
      })
      await fallbackCache.put('/offline.html', offlineResponse)
      
      console.log('[SW] Precache complete')
      
      // Skip waiting for immediate activation
      await self.skipWaiting()
    })()
  )
})

// Activate: Clean old caches and claim clients
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    (async () => {
      // Clean old caches
      const cacheNames = await caches.keys()
      const validCaches = [STATIC_CACHE, API_CACHE, PLAYER_CACHE, IMAGE_CACHE, FALLBACK_CACHE]
      
      await Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
      
      // Claim clients immediately
      await self.clients.claim()
      
      // Notify all clients about update
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          version: CACHE_VERSION,
        })
      })
      
      console.log('[SW] Activation complete')
    })()
  )
})

// Fetch: Handle requests with appropriate strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip browser extensions and non-http(s) requests
  if (!url.protocol.startsWith('http')) return
  
  // API routes: Stale-while-revalidate
  if (isAPIRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE))
    return
  }
  
  // Player data: Network first with cache fallback
  if (isPlayerEndpoint(url)) {
    event.respondWith(networkFirstWithTimeout(request, PLAYER_CACHE, 3000))
    return
  }
  
  // Images: Cache first with network fallback
  if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }
  
  // Static assets (JS, CSS): Cache first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  
  // Navigation requests: Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkWithOfflineFallback(request))
    return
  }
  
  // Default: Network first
  event.respondWith(networkFirst(request, STATIC_CACHE))
})

// Message handling for app communication
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CHECK_UPDATE':
      // Trigger update check
      self.registration.update()
      break
      
    case 'CACHE_PLAYER_DATA':
      event.waitUntil(cachePlayerData(data.playerId, data.data))
      break
      
    case 'GET_CACHED_PLAYER':
      event.waitUntil(
        getCachedPlayer(data.playerId).then((result) => {
          event.ports[0]?.postMessage({ success: true, data: result })
        })
      )
      break
      
    case 'CLEAR_ALL_CACHES':
      event.waitUntil(clearAllCaches())
      break
  }
})

// Background sync for offline mutations
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-player-data') {
    event.waitUntil(syncPlayerData())
  }
})

// ==================== Cache Strategies ====================

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Return offline fallback for navigation
    if (request.mode === 'navigate') {
      const fallbackCache = await caches.open(FALLBACK_CACHE)
      return fallbackCache.match('/offline.html') || new Response('Offline', { status: 503 })
    }
    throw error
  }
}

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

async function networkFirstWithTimeout(
  request: Request, 
  cacheName: string, 
  timeoutMs: number
): Promise<Response> {
  const cache = await caches.open(cacheName)
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Network timeout')), timeoutMs)
  })
  
  try {
    const networkResponse = await Promise.race([fetch(request), timeoutPromise])
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      // Add header to indicate cached response
      const headers = new Headers(cached.headers)
      headers.set('X-SW-Cache', 'hit')
      headers.set('X-SW-Cache-Time', new Date().toISOString())
      
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      })
    }
    throw error
  }
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => cached)
  
  // Return cached immediately, or wait for network if no cache
  return cached || fetchPromise
}

async function networkWithOfflineFallback(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, serving offline fallback')
    const fallbackCache = await caches.open(FALLBACK_CACHE)
    const fallback = await fallbackCache.match('/offline.html')
    
    if (fallback) {
      return fallback
    }
    
    return new Response(OFFLINE_FALLBACK_HTML, {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

// ==================== Player Data Caching ====================

interface CachedPlayerData {
  id: string
  data: unknown
  timestamp: number
  version: string
}

const PLAYER_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

async function cachePlayerData(playerId: string, data: unknown): Promise<void> {
  const cache = await caches.open(PLAYER_CACHE)
  const entry: CachedPlayerData = {
    id: playerId,
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  }
  
  const response = new Response(JSON.stringify(entry), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=86400',
    },
  })
  
  await cache.put(`/player-cache/${playerId}`, response)
  console.log('[SW] Player cached:', playerId)
}

async function getCachedPlayer(playerId: string): Promise<CachedPlayerData | null> {
  const cache = await caches.open(PLAYER_CACHE)
  const response = await cache.match(`/player-cache/${playerId}`)
  
  if (!response) return null
  
  const entry: CachedPlayerData = await response.json()
  const age = Date.now() - entry.timestamp
  
  if (age > PLAYER_CACHE_TTL) {
    await cache.delete(`/player-cache/${playerId}`)
    return null
  }
  
  return entry
}

async function syncPlayerData(): Promise<void> {
  // Implement background sync logic for player data
  console.log('[SW] Syncing player data...')
}

async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map((name) => caches.delete(name)))
  console.log('[SW] All caches cleared')
}

// ==================== Helpers ====================

function isAPIRequest(url: URL): boolean {
  return API_ROUTES.some((route) => url.href.includes(route))
}

function isPlayerEndpoint(url: URL): boolean {
  return PLAYER_ENDPOINTS.some((endpoint) => url.pathname.includes(endpoint))
}

function isStaticAsset(url: URL): boolean {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.json']
  return staticExtensions.some((ext) => url.pathname.endsWith(ext))
}

function isImageRequest(url: URL): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']
  return imageExtensions.some((ext) => url.pathname.endsWith(ext))
}

// Push notification handlers
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'NJZiteGeisTe'
  const body = data.body ?? 'New match update'
  const url = data.url ?? '/pro-scene'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) ?? '/'
  event.waitUntil(clients.openWindow(url))
})

// Export for testing
export {
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
  cachePlayerData,
  getCachedPlayer,
}

export type { CachedPlayerData }
