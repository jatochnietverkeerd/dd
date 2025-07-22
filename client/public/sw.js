// Enhanced Service Worker for Performance and HTTPS
const CACHE_NAME = 'ddcars-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/assets/logo_dd_1752326110259.png'
];

// Install event - cache critical resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', function(event) {
  // Force HTTPS for all requests
  if (event.request.url.startsWith('http://') && 
      !event.request.url.includes('localhost') && 
      !event.request.url.includes('127.0.0.1')) {
    
    const httpsUrl = event.request.url.replace('http://', 'https://');
    event.respondWith(
      fetch(httpsUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: event.request.body
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});