/**
 * Service Worker - Offline-First Grid Rendering
 * [Ver002.000] - Added Worker Cache API integration
 */

/// <reference lib="webworker" />

const CACHE_NAME = '4njz4-grid-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
]

const API_CACHE_NAME = '4njz4-api-v1'
const API_ROUTES = ['/api/']

// Grid render cache with TTL
const GRID_CACHE_NAME = '4njz4-grid-render-v1'
const GRID_CACHE_TTL = 60 * 60 * 1000 // 1 hour in ms

// Install: Precache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Skip waiting for immediate activation')
        return self.skipWaiting()
      })
      .catch((err) => {
        console.error('[SW] Precache failed:', err)
      })
  )
})

// Activate: Clean old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => 
              name !== CACHE_NAME && 
              name !== API_CACHE_NAME &&
              name !== GRID_CACHE_NAME
            )
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => {
        console.log('[SW] Claiming clients')
        return self.clients.claim()
      })
  )
})

// Fetch: Cache strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // API routes: Stale-while-revalidate
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME))
    return
  }

  // Static assets: Cache first, fallback to network
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
    return
  }

  // Default: Network first, fallback to cache
  event.respondWith(networkFirst(request, CACHE_NAME))
})

// Grid Cache API
interface GridCacheEntry {
  timestamp: number
  panelHash: string
  data: unknown
}

// Generate hash from panel configuration
function hashPanels(panels: unknown[]): string {
  const str = JSON.stringify(panels)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

// Check if cache entry is valid (within TTL)
function isCacheValid(entry: GridCacheEntry): boolean {
  const age = Date.now() - entry.timestamp
  return age < GRID_CACHE_TTL
}

// Cache grid render result
async function cacheGridRender(
  panels: unknown[],
  renderData: unknown
): Promise<void> {
  const cache = await caches.open(GRID_CACHE_NAME)
  const panelHash = hashPanels(panels)
  const entry: GridCacheEntry = {
    timestamp: Date.now(),
    panelHash,
    data: renderData,
  }
  
  const response = new Response(JSON.stringify(entry), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=3600',
    },
  })
  
  await cache.put(`grid-render-${panelHash}`, response)
  console.log('[SW] Grid render cached:', panelHash)
}

// Get cached grid render
async function getCachedGridRender(
  panels: unknown[]
): Promise<GridCacheEntry | null> {
  const cache = await caches.open(GRID_CACHE_NAME)
  const panelHash = hashPanels(panels)
  
  const response = await cache.match(`grid-render-${panelHash}`)
  if (!response) return null
  
  const entry: GridCacheEntry = await response.json()
  
  if (!isCacheValid(entry)) {
    console.log('[SW] Grid cache expired:', panelHash)
    await cache.delete(`grid-render-${panelHash}`)
    return null
  }
  
  console.log('[SW] Grid cache hit:', panelHash)
  return entry
}

// Cache strategies
async function cacheFirst(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    console.log('[SW] Cache hit:', request.url)
    return cached
  }

  console.log('[SW] Cache miss, fetching:', request.url)
  const response = await fetch(request)

  if (response.ok) {
    cache.put(request, response.clone())
  }

  return response
}

async function networkFirst(
  request: Request,
  cacheName: string
): Promise<Response> {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)

    if (cached) {
      return cached
    }

    throw error
  }
}

async function staleWhileRevalidate(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  // Return cached immediately, then update in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  // Return cached or wait for network
  return cached || fetchPromise
}

// Helpers
function isStaticAsset(url: URL): boolean {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.svg', '.woff', '.woff2']
  return staticExtensions.some((ext) => url.pathname.endsWith(ext))
}

// Message handling for app communication and Grid caching
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event
  
  if (data === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }
  
  // Grid cache operations
  if (data.type === 'CACHE_GRID_RENDER') {
    const { panels, renderData } = data
    event.waitUntil(
      cacheGridRender(panels, renderData).then(() => {
        event.ports[0]?.postMessage({ success: true })
      })
    )
    return
  }
  
  if (data.type === 'GET_CACHED_GRID') {
    const { panels } = data
    event.waitUntil(
      getCachedGridRender(panels).then((entry) => {
        event.ports[0]?.postMessage({ 
          success: true, 
          data: entry?.data || null,
          timestamp: entry?.timestamp || null,
        })
      })
    )
    return
  }
  
  if (data.type === 'CLEAR_GRID_CACHE') {
    event.waitUntil(
      caches.delete(GRID_CACHE_NAME).then(() => {
        event.ports[0]?.postMessage({ success: true })
      })
    )
    return
  }
})

export { hashPanels, cacheGridRender, getCachedGridRender }
export type { GridCacheEntry }
