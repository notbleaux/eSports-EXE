// Service Worker for Hub4 Games (Next.js)
const CACHE_NAME = 'hub4-games-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Network-first for HTML, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isAsset = event.request.url.includes('/_next/static/');
  
  if (isHTML) {
    // Network-first for HTML
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else if (isAsset) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((response) => 
        response || fetch(event.request).then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
      )
    );
  }
});
