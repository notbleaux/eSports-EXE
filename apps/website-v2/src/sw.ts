/**
 * Service Worker - Offline-First Grid Rendering
 * [Ver001.000]
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
            .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
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

// Message handling for app communication
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

export {}
