// Service Worker for aggressive caching and performance
const CACHE_NAME = 'ddcars-v2';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/assets/hero_image_DD_1753178216280.webp',
  '/assets/over_ons_hero_image.webp',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        
        // Clone the request for network fetch
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(function(response) {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Force HTTPS only in production
self.addEventListener('fetch', function(event) {
  // Only redirect to HTTPS if we're not on localhost/Replit development
  if (event.request.url.startsWith('http:') && 
      !event.request.url.includes('localhost') && 
      !event.request.url.includes('replit.dev')) {
    event.respondWith(
      Response.redirect(event.request.url.replace('http:', 'https:'), 301)
    );
  }
});